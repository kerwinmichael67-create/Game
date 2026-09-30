/* =========================================================================
   visuals.js — the look: sky, environment lighting, and post-processing.

   three.js ships EffectComposer and UnrealBloomPass only as ES modules
   under examples/jsm, and this game is deliberately classic <script> tags
   so it runs from file://.  So the passes here are written against the
   core API: render targets, a fullscreen quad and a few small shaders.

   The chain, when post is on:

     scene ──► rtScene (half-float, LINEAR)        no tone mapping yet
                 │
                 ├─ bright pass ──► half-res ──► blur H ──► blur V ─┐
                 │                                                   │
                 └───────────────────────────────────────────────────┴─► composite
                                                                          ACES → vignette
                                                                          → sRGB → canvas

   Working in linear light all the way to the composite is the whole point:
   bloom on already-tone-mapped pixels blooms the wrong things, and the
   colour-space conversion has to happen exactly once, at the end.
   ========================================================================= */
(function () {
  const T = THREE;

  /* ------------------------------------------------------------------
     Shared shader pieces
     ------------------------------------------------------------------ */
  const QUAD_VERT = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }`;

  /* Narkowicz's fit of the ACES filmic curve — cheap, and it rolls
     highlights off instead of clipping them to white. */
  const ACES = `
    vec3 aces(vec3 x) {
      const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
      return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
    }`;

  const SRGB = `
    vec3 toSRGB(vec3 c) {
      return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,
                 step(vec3(0.0031308), c));
    }`;

  /* ==================================================================
     POST
     ================================================================== */
  const Post = TD.Post = {
    ready: false,
    enabled: false,
    strength: 0.55,
    threshold: 0.75,
    exposure: 1.0,
    vignette: 0.26
  };

  let renderer = null, quad = null, quadCam = null, quadScene = null;
  let rtScene = null, rtA = null, rtB = null;
  let matBright = null, matBlur = null, matComp = null;
  let sizeW = 0, sizeH = 0;

  function makeTarget(w, h, float) {
    const rt = new T.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), {
      minFilter: T.LinearFilter,
      magFilter: T.LinearFilter,
      type: float ? T.HalfFloatType : T.UnsignedByteType,
      depthBuffer: !!float,
      stencilBuffer: false
    });
    rt.texture.colorSpace = T.LinearSRGBColorSpace;
    rt.texture.generateMipmaps = false;
    return rt;
  }

  Post.init = function (r) {
    if (Post.ready) return Post.enabled;
    renderer = r;
    try {
      /* Half-float targets are what make a bloom worth having; without
         them the bright pass has nothing above 1.0 to work with. */
      const caps = renderer.capabilities;
      if (!caps.isWebGL2 && !renderer.extensions.get('OES_texture_half_float')) return false;

      quadScene = new T.Scene();
      quadCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      matBright = new T.ShaderMaterial({
        uniforms: { tDiffuse: { value: null }, threshold: { value: Post.threshold } },
        vertexShader: QUAD_VERT,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float threshold;
          varying vec2 vUv;
          void main() {
            vec3 c = texture2D(tDiffuse, vUv).rgb;
            float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
            /* soft knee, so a light does not pop into bloom all at once */
            float k = smoothstep(threshold, threshold + 0.45, l);
            gl_FragColor = vec4(c * k, 1.0);
          }`,
        depthTest: false, depthWrite: false
      });

      matBlur = new T.ShaderMaterial({
        uniforms: {
          tDiffuse: { value: null },
          direction: { value: new T.Vector2(1, 0) },
          texel: { value: new T.Vector2(1 / 512, 1 / 512) }
        },
        vertexShader: QUAD_VERT,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform vec2 direction;
          uniform vec2 texel;
          varying vec2 vUv;
          void main() {
            vec2 o = direction * texel;
            vec3 s = texture2D(tDiffuse, vUv).rgb * 0.227027;
            s += texture2D(tDiffuse, vUv + o * 1.3846).rgb * 0.316216;
            s += texture2D(tDiffuse, vUv - o * 1.3846).rgb * 0.316216;
            s += texture2D(tDiffuse, vUv + o * 3.2308).rgb * 0.070270;
            s += texture2D(tDiffuse, vUv - o * 3.2308).rgb * 0.070270;
            gl_FragColor = vec4(s, 1.0);
          }`,
        depthTest: false, depthWrite: false
      });

      matComp = new T.ShaderMaterial({
        uniforms: {
          tScene: { value: null },
          tBloom: { value: null },
          strength: { value: Post.strength },
          exposure: { value: Post.exposure },
          vignette: { value: Post.vignette }
        },
        vertexShader: QUAD_VERT,
        fragmentShader: `
          uniform sampler2D tScene;
          uniform sampler2D tBloom;
          uniform float strength;
          uniform float exposure;
          uniform float vignette;
          varying vec2 vUv;
          ${ACES}
          ${SRGB}
          void main() {
            vec3 c = texture2D(tScene, vUv).rgb;
            c += texture2D(tBloom, vUv).rgb * strength;
            c *= exposure;
            c = aces(c);
            /* a gentle lift in the shadows keeps the darks from going flat */
            c = mix(c, c * c * (3.0 - 2.0 * c), -0.12);
            vec2 d = vUv - 0.5;
            c *= 1.0 - vignette * dot(d, d) * 1.9;
            gl_FragColor = vec4(toSRGB(c), 1.0);
          }`,
        depthTest: false, depthWrite: false
      });

      quad = new T.Mesh(new T.PlaneGeometry(2, 2), matComp);
      quad.frustumCulled = false;
      quadScene.add(quad);

      Post.ready = true;
      Post.enabled = true;
      return true;
    } catch (e) {
      Post.ready = false; Post.enabled = false;
      return false;
    }
  };

  Post.resize = function (w, h, pixelRatio) {
    if (!Post.ready) return;
    const pr = Math.min(pixelRatio || 1, 2);
    sizeW = Math.max(1, Math.floor(w * pr));
    sizeH = Math.max(1, Math.floor(h * pr));
    const bw = Math.max(1, sizeW >> 1), bh = Math.max(1, sizeH >> 1);
    if (rtScene) rtScene.dispose();
    if (rtA) rtA.dispose();
    if (rtB) rtB.dispose();
    rtScene = makeTarget(sizeW, sizeH, true);
    rtA = makeTarget(bw, bh, true);
    rtB = makeTarget(bw, bh, true);
    matBlur.uniforms.texel.value.set(1 / bw, 1 / bh);
  };

  function blit(material, target) {
    quad.material = material;
    renderer.setRenderTarget(target || null);
    renderer.clear();
    renderer.render(quadScene, quadCam);
  }

  /* Draw one frame.  Falls back to a plain render whenever post is off. */
  Post.render = function (scene, camera) {
    if (!Post.ready || !Post.enabled || !rtScene) {
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = Post.exposure;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      return;
    }
    /* linear all the way through; the composite tone maps at the end */
    renderer.toneMapping = T.NoToneMapping;
    renderer.setRenderTarget(rtScene);
    renderer.clear();
    renderer.render(scene, camera);

    matBright.uniforms.tDiffuse.value = rtScene.texture;
    matBright.uniforms.threshold.value = Post.threshold;
    blit(matBright, rtA);

    matBlur.uniforms.tDiffuse.value = rtA.texture;
    matBlur.uniforms.direction.value.set(1, 0);
    blit(matBlur, rtB);
    matBlur.uniforms.tDiffuse.value = rtB.texture;
    matBlur.uniforms.direction.value.set(0, 1);
    blit(matBlur, rtA);
    /* a second, wider pass so the glow reaches instead of ringing */
    matBlur.uniforms.tDiffuse.value = rtA.texture;
    matBlur.uniforms.direction.value.set(2, 0);
    blit(matBlur, rtB);
    matBlur.uniforms.tDiffuse.value = rtB.texture;
    matBlur.uniforms.direction.value.set(0, 2);
    blit(matBlur, rtA);

    matComp.uniforms.tScene.value = rtScene.texture;
    matComp.uniforms.tBloom.value = rtA.texture;
    matComp.uniforms.strength.value = Post.strength;
    matComp.uniforms.exposure.value = Post.exposure;
    matComp.uniforms.vignette.value = Post.vignette;
    blit(matComp, null);
  };

  /* ==================================================================
     SKY — a gradient dome, so the horizon is not one flat colour
     ================================================================== */
  TD.makeSky = function (top, horizon, ground, radius) {
    const m = new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        cTop: { value: new T.Color(top) },
        cMid: { value: new T.Color(horizon) },
        cBot: { value: new T.Color(ground) }
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 cTop; uniform vec3 cMid; uniform vec3 cBot;
        varying vec3 vPos;
        void main() {
          float h = normalize(vPos).y;
          vec3 c = mix(cMid, cTop, smoothstep(0.0, 0.55, h));
          c = mix(cBot, c, smoothstep(-0.30, 0.02, h));
          gl_FragColor = vec4(c, 1.0);
        }`
    });
    const r = radius || 330;                 // must stay inside the camera's far plane
    const sky = new T.Mesh(new T.SphereGeometry(r, 24, 16), m);
    sky.geometry.__shared = true;
    sky.frustumCulled = false;
    sky.renderOrder = -1000;
    return sky;
  };

  /* ==================================================================
     ENVIRONMENT — a prefiltered probe so metal has something to reflect
     ================================================================== */
  let envCache = new Map();
  function buildEnv(renderer2, top, horizon, ground) {
    const key = top + '/' + horizon + '/' + ground;
    if (envCache.has(key)) return envCache.get(key);
    let tex = null;
    try {
      const pmrem = new T.PMREMGenerator(renderer2);
      pmrem.compileEquirectangularShader();
      const s = new T.Scene();
      s.add(TD.makeSky(top, horizon, ground, 50));
      const rt = pmrem.fromScene(s, 0, 0.1, 1000);
      tex = rt.texture;
      pmrem.dispose();
    } catch (e) {
      tex = null;                 // no probe: the lights still carry the scene
    }
    envCache.set(key, tex);
    return tex;
  }

  /* Prefiltering a probe costs a few hundred milliseconds the first time
     on a slow machine, and the scene looks perfectly fine for the frame
     or two before it lands — so never block the first paint on it. */
  TD.applyEnv = function (scene, renderer2, top, horizon, ground) {
    const key = top + '/' + horizon + '/' + ground;
    if (envCache.has(key)) { scene.environment = envCache.get(key); return; }
    setTimeout(() => {
      const tex = buildEnv(renderer2, top, horizon, ground);
      if (tex && scene) scene.environment = tex;
    }, 0);
  };

  /* ==================================================================
     A soft contact shadow, for grounding things the shadow map is too
     coarse to catch.
     ================================================================== */
  let blobTex = null;
  function blobTexture() {
    if (blobTex) return blobTex;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    grd.addColorStop(0, 'rgba(0,0,0,0.55)');
    grd.addColorStop(0.55, 'rgba(0,0,0,0.22)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    blobTex = new T.CanvasTexture(cv);
    return blobTex;
  }

  let blobGeo = null, blobMat = null;
  TD.blobShadow = function (radius) {
    if (!blobGeo) { blobGeo = new T.PlaneGeometry(1, 1); blobGeo.__shared = true; }
    if (!blobMat) {
      blobMat = new T.MeshBasicMaterial({
        map: blobTexture(), transparent: true, depthWrite: false,
        opacity: 0.85, fog: true
      });
    }
    const m = new T.Mesh(blobGeo, blobMat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.04;
    m.scale.set(radius * 2, radius * 2, 1);
    m.renderOrder = -1;
    m.matrixAutoUpdate = true;
    return m;
  };
})();
