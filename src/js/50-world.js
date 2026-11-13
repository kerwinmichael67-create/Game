/* ========================================================================
   World: renderer + post-processing, sky/environment, track meshes,
   scenery, particles, camera
   ======================================================================== */
function makeAsphalt(def) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 1024; const x = c.getContext('2d');
  x.fillStyle = def.theme.night ? '#383944' : '#55555b'; x.fillRect(0, 0, 512, 1024);
  const img = x.getImageData(0, 0, 512, 1024), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n + 1; }
  x.putImageData(img, 0, 0);
  /* worn tyre bands where cars run */
  for (const bx of [150, 362]) { const gr = x.createLinearGradient(bx - 60, 0, bx + 60, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(bx - 60, 0, 120, 1024); }
  /* patches / cracks */
  x.strokeStyle = 'rgba(0,0,0,.09)'; x.lineWidth = 1.5; for (let i = 0; i < 12; i++) { x.beginPath(); let px = Math.random() * 512, py = Math.random() * 1024; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (Math.random() - 0.5) * 60; py += Math.random() * 40; x.lineTo(px, py); } x.stroke(); }
  /* edge lines + centre dashes */
  x.fillStyle = 'rgba(238,238,228,.9)'; x.fillRect(12, 0, 9, 1024); x.fillRect(491, 0, 9, 1024);
  x.fillStyle = def.theme.night ? 'rgba(255,210,80,.85)' : 'rgba(250,232,140,.8)';
  for (let y = 0; y < 1024; y += 256) x.fillRect(250, y, 12, 140);
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.encoding = THREE.sRGBEncoding; return t;
}
function makeGroundTex(def) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  const a = new THREE.Color(def.theme.ground), b = new THREE.Color(def.theme.ground2);
  const img = x.createImageData(512, 512), d = img.data;
  for (let i = 0; i < 512 * 512; i++) { const n = Math.random(); const r = a.r * (1 - n) + b.r * n, g = a.g * (1 - n) + b.g * n, bl = a.b * (1 - n) + b.b * n; d[i * 4] = r * 255; d[i * 4 + 1] = g * 255; d[i * 4 + 2] = bl * 255; d[i * 4 + 3] = 255; }
  x.putImageData(img, 0, 0);
  /* soft darker patches for variation */
  for (let i = 0; i < 40; i++) { const r = 30 + Math.random() * 90; const gr = x.createRadialGradient(Math.random() * 512, Math.random() * 512, 0, Math.random() * 512, Math.random() * 512, r); gr.addColorStop(0, 'rgba(0,0,0,.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 512, 512); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(90, 90); t.anisotropy = 4; t.encoding = THREE.sRGBEncoding; return t;
}
function makeParticleTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
function makeCloudTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  for (let i = 0; i < 26; i++) { const r = 18 + Math.random() * 30, cx = 40 + Math.random() * 176, cy = 50 + Math.random() * 40 - (r - 18) * 0.5; const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.6, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 128); }
  return new THREE.CanvasTexture(c);
}
function makeFrondTex() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#2f8a3a'; x.beginPath(); x.moveTo(32, 0);
  for (let y = 0; y <= 256; y += 16) { const w = 6 + 26 * Math.sin(Math.PI * y / 256) * (1 - y / 300); x.lineTo(32 + w, y); }
  for (let y = 256; y >= 0; y -= 16) { const w = 6 + 26 * Math.sin(Math.PI * y / 256) * (1 - y / 300); x.lineTo(32 - w, y); }
  x.closePath(); x.fill();
  x.strokeStyle = '#1f6a2a'; x.lineWidth = 3; x.beginPath(); x.moveTo(32, 0); x.lineTo(32, 256); x.stroke();
  for (let y = 10; y < 256; y += 14) { x.beginPath(); x.moveTo(32, y); x.lineTo(2, y + 18); x.moveTo(32, y); x.lineTo(62, y + 18); x.strokeStyle = 'rgba(10,40,15,.35)'; x.lineWidth = 2; x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}

const SKY_VERT = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz - cameraPosition; gl_Position = projectionMatrix * viewMatrix * w; }`;
const SKY_FRAG = `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; uniform vec3 sunDir; uniform vec3 sunColor; uniform float glow; varying vec3 vW;
void main(){ vec3 d = normalize(vW); float h = d.y; vec3 col = h > 0.0 ? mix(horizon, top, pow(h, 0.5)) : mix(horizon, bottom, pow(-h, 0.45));
 float s = max(dot(d, normalize(sunDir)), 0.0); col += sunColor * glow * (pow(s, 400.0) * 2.2 + pow(s, 12.0) * 0.35 + pow(s, 3.0) * 0.08);
 gl_FragColor = vec4(col, 1.0); }`;
/* mipmapped cube map of the sky, used as the scene environment for reflections and soft ambient light */
function makeEnvironment(renderer, th) {
  const ground = new THREE.Color(th.ground || 0x303030).multiplyScalar(0.6);
  const envTheme = { sky: [new THREE.Color(th.sky[0]).multiplyScalar(0.8), new THREE.Color(th.sky[1]).multiplyScalar(0.75), ground], sun: th.sun, sunColor: th.sunColor, glow: 0.25 };
  const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), skyMaterial(envTheme)));
  const rt = new THREE.WebGLCubeRenderTarget(128, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
  const cam = new THREE.CubeCamera(0.1, 100, rt); cam.update(renderer, envScene); envScene.children[0].geometry.dispose(); envScene.children[0].material.dispose();
  return rt;
}
function skyMaterial(th) {
  return new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(th.sky[0]) }, horizon: { value: new THREE.Color(th.sky[1]) }, bottom: { value: new THREE.Color(th.sky[2]) }, sunDir: { value: new THREE.Vector3(...th.sun) }, sunColor: { value: new THREE.Color(th.sunColor) }, glow: { value: th.glow == null ? 1 : th.glow } } });
}

class Particles {
  constructor(scene, count, tex, opts) {
    this.n = count; this.pos = new Float32Array(count * 3); this.col = new Float32Array(count * 3); this.vel = new Float32Array(count * 3); this.life = new Float32Array(count); this.max = new Float32Array(count);
    this.geo = new THREE.BufferGeometry(); this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mat = new THREE.PointsMaterial({ size: opts.size, map: tex, transparent: true, depthWrite: false, vertexColors: true, opacity: opts.opacity, blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true });
    this.points = new THREE.Points(this.geo, this.mat); this.points.frustumCulled = false; scene.add(this.points); this.head = 0; this.grav = opts.gravity || 0; this.drag = opts.drag || 0;
    for (let i = 0; i < count; i++) this.pos[i * 3 + 1] = -100;
  }
  emit(p, v, color, life) {
    const i = this.head; this.head = (this.head + 1) % this.n;
    this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z; this.vel[i * 3] = v.x; this.vel[i * 3 + 1] = v.y; this.vel[i * 3 + 2] = v.z;
    this.col[i * 3] = color.r; this.col[i * 3 + 1] = color.g; this.col[i * 3 + 2] = color.b; this.life[i] = life; this.max[i] = life;
  }
  update(dt) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue; this.life[i] -= dt;
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -100; continue; }
      this.vel[i * 3 + 1] += this.grav * dt; const k = 1 - this.drag * dt;
      this.vel[i * 3] *= k; this.vel[i * 3 + 2] *= k;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true;
  }
}

/* tyre marks: a ring buffer of quads laid where a sliding tyre has been */
class SkidMarks {
  constructor(scene, max = 1600) {
    this.max = max; this.pos = new Float32Array(max * 12); const idx = [];
    for (let i = 0; i < max; i++) { const k = i * 4; idx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3); }
    this.geo = new THREE.BufferGeometry(); this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); this.geo.setIndex(idx);
    this.mesh = new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({ color: 0x030304, transparent: true, opacity: 0.62, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 1; scene.add(this.mesh); this.head = 0; this.last = new Map(); this.dirty = false;
  }
  /* key identifies one tyre; p is its contact point; on = currently sliding */
  mark(key, p, on) {
    const prev = this.last.get(key);
    if (!on) { if (prev) this.last.delete(key); return; }
    if (!prev) { this.last.set(key, { c: p.clone(), l: null, r: null }); return; }
    const dx = p.x - prev.c.x, dz = p.z - prev.c.z, d = Math.hypot(dx, dz);
    if (d < 0.45) return; if (d > 6) { this.last.set(key, { c: p.clone(), l: null, r: null }); return; }
    const px = -dz / d * 0.15, pz = dx / d * 0.15;
    const l = new THREE.Vector3(p.x - px, p.y, p.z - pz), r = new THREE.Vector3(p.x + px, p.y, p.z + pz);
    const pl = prev.l || new THREE.Vector3(prev.c.x - px, prev.c.y, prev.c.z - pz), pr = prev.r || new THREE.Vector3(prev.c.x + px, prev.c.y, prev.c.z + pz);
    const a = this.pos, k = this.head * 12; this.head = (this.head + 1) % this.max;
    a[k] = pl.x; a[k + 1] = pl.y; a[k + 2] = pl.z; a[k + 3] = pr.x; a[k + 4] = pr.y; a[k + 5] = pr.z; a[k + 6] = l.x; a[k + 7] = l.y; a[k + 8] = l.z; a[k + 9] = r.x; a[k + 10] = r.y; a[k + 11] = r.z;
    prev.c.copy(p); prev.l = l; prev.r = r; this.dirty = true;
  }
  flush() { if (this.dirty) { this.geo.attributes.position.needsUpdate = true; this.dirty = false; } }
}
function makeChevronTex() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d');
  x.lineWidth = 16; x.lineCap = 'round'; x.lineJoin = 'round';
  for (let k = -1; k < 3; k++) { const y = k * 64 + 20; x.strokeStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.moveTo(18, y); x.lineTo(64, y + 40); x.lineTo(110, y); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 2.2); return t;
}

class World {
  constructor(canvas, quality = 'high') {
    this.canvas = canvas; this.quality = quality;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 0.86;
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.3, 2600);
    this.scene = new THREE.Scene();
    this.camMode = 0; this.camPos = new THREE.Vector3(); this.camLook = new THREE.Vector3(); this.shake = 0; this.camRoll = 0;
    this.partTex = makeParticleTex(); this.glowTex = makeGlowTex();
    this.track = null; this.trackGroup = null; this.time = 0; this.composer = null;
    /* speed streaks ride with the camera */
    { const n = 80; this.streakN = n; this.streakPos = new Float32Array(n * 6); this.streakSeed = [];
      for (let i = 0; i < n; i++) this.streakSeed.push(this._streakSeed(-Math.random() * 50));
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(this.streakPos, 3));
      this.streaks = new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      this.streaks.frustumCulled = false; this.streaks.visible = false; this.camera.add(this.streaks); }
    this.resize(); addEventListener('resize', () => this.resize());
  }
  _streakSeed(z) { const a = Math.random() * TAU, r = 2.4 + Math.random() * 5.5; return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.62 + 0.4, z }; }
  updateStreaks(speed, boost, dt) {
    const m = this.streaks.material; m.opacity = damp(m.opacity, clamp((speed - 38) / 38, 0, 1) * 0.2 + boost * 0.35, 6, dt);
    if (m.opacity < 0.012) { this.streaks.visible = false; return; } this.streaks.visible = true;
    const len = 0.4 + speed * 0.035, p = this.streakPos;
    for (let i = 0; i < this.streakN; i++) { let s = this.streakSeed[i]; s.z += speed * dt * 1.25; if (s.z > -0.8) s = this.streakSeed[i] = this._streakSeed(-46 - Math.random() * 8);
      const k = i * 6; p[k] = s.x; p[k + 1] = s.y; p[k + 2] = s.z; p[k + 3] = s.x; p[k + 4] = s.y; p[k + 5] = s.z - len; }
    this.streaks.geometry.attributes.position.needsUpdate = true;
  }
  pixelRatio() { const w = this.canvas.clientWidth || innerWidth, h = this.canvas.clientHeight || innerHeight; const cap = this.quality === 'high' ? (w * h > 1.6e6 ? 1.5 : 2) : 1.0; return Math.min(devicePixelRatio || 1, cap); }
  resize() {
    const w = this.canvas.clientWidth || innerWidth, h = this.canvas.clientHeight || innerHeight;
    this.renderer.setPixelRatio(this.pixelRatio()); this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    if (this.composer) { this.composer.setPixelRatio(this.pixelRatio()); this.composer.setSize(w, h); }
  }
  setQuality(q) {
    this.quality = q; this.resize();
    if (this.sun) { this.sun.shadow.mapSize.set(q === 'high' ? 2048 : 1024, q === 'high' ? 2048 : 1024); if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; } }
    this.setupPost();
  }
  /* bloom via EffectComposer when the post-processing scripts loaded; multisampled target keeps the edges smooth */
  setupPost() {
    if (this.composer) { this.composer.renderTarget1.dispose(); this.composer.renderTarget2.dispose(); this.composer = null; }
    if (this.quality !== 'high' || !THREE.EffectComposer || !THREE.UnrealBloomPass || !THREE.RenderPass) return;
    try {
      const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
      const RT = this.renderer.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget ? THREE.WebGLMultisampleRenderTarget : THREE.WebGLRenderTarget;
      const rt = new RT(size.x, size.y, { format: THREE.RGBAFormat, encoding: THREE.sRGBEncoding }); if ('samples' in rt) rt.samples = 4;
      const composer = new THREE.EffectComposer(this.renderer, rt); composer.setPixelRatio(this.pixelRatio()); composer.setSize(this.canvas.clientWidth || innerWidth, this.canvas.clientHeight || innerHeight);
      this.renderPass = new THREE.RenderPass(this.scene, this.camera); composer.addPass(this.renderPass);
      this.bloom = new THREE.UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.45, 0.45, 0.9); composer.addPass(this.bloom);
      this.composer = composer;
    } catch (e) { this.composer = null; }
  }

  /* -------- build a complete scene for a track -------- */
  load(track, seed = 1) {
    this.dispose();
    this.track = track; const def = track.def, th = def.theme, R = rng(seed);
    const scene = this.scene; scene.add(this.camera);
    scene.fog = new THREE.Fog(th.fog, th.fogNear, th.fogFar);
    /* sky dome (follows the camera) with sun glow, clouds or stars attached */
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 32, 16), skyMaterial(th)); this.sky.frustumCulled = false; this.sky.renderOrder = -10; scene.add(this.sky);
    const sunDir = new THREE.Vector3(...th.sun).normalize();
    const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: th.sunColor, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: th.night ? 0.35 : 0.9 }));
    sunSprite.position.copy(sunDir).multiplyScalar(1700); sunSprite.scale.set(th.night ? 220 : 420, th.night ? 220 : 420, 1); this.sky.add(sunSprite);
    if (th.night) {
      const n = 1600, pos = [], col = [];
      for (let i = 0; i < n; i++) { const u = R(), v = R(); const theta = u * TAU, phi = Math.acos(1 - v) * 0.5; const r = 1800; pos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)); const b = 0.5 + R() * 0.5; const c = new THREE.Color().setHSL(0.55 + R() * 0.12, 0.3, b); col.push(c.r, c.g, c.b); }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      this.sky.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })));
    } else {
      const cloudTex = makeCloudTex(); const horizon = new THREE.Color(th.sky[1]); const cloudCol = new THREE.Color(th.cloud || 0xffffff).lerp(horizon, 0.35);
      for (let i = 0; i < 22; i++) { const a = R() * TAU, dist = 1000 + R() * 500, y = 120 + R() * 320; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, color: cloudCol, transparent: true, depthWrite: false, fog: false, opacity: 0.5 + R() * 0.35 })); sp.position.set(Math.cos(a) * dist, y, Math.sin(a) * dist); const s = 300 + R() * 360; sp.scale.set(s, s * 0.45, 1); this.sky.add(sp); }
    }
    /* image-based lighting from the same sky so paint and glass reflect it */
    this.envRT = makeEnvironment(this.renderer, th); scene.environment = this.envRT.texture;
    /* lights */
    this.hemi = new THREE.HemisphereLight(th.hemi[0], th.hemi[1], th.night ? 0.62 : 0.72); scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(th.sunColor, th.night ? 0.55 : 1.05); this.sun.position.copy(sunDir).multiplyScalar(260);
    this.sun.castShadow = true; const sc = this.sun.shadow.camera; sc.near = 10; sc.far = 700; sc.left = sc.bottom = -110; sc.right = sc.top = 110;
    const sm = this.quality === 'high' ? 2048 : 1024; this.sun.shadow.mapSize.set(sm, sm); this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.5; this.sun.target = new THREE.Object3D(); scene.add(this.sun.target); scene.add(this.sun);
    this.ambient = new THREE.AmbientLight(0xffffff, th.night ? 0.2 : 0.08); scene.add(this.ambient);

    const g = new THREE.Group(); this.trackGroup = g; scene.add(g);
    /* ground */
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshStandardMaterial({ map: makeGroundTex(def), roughness: 1, metalness: 0, envMapIntensity: 0.15 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.08; ground.receiveShadow = true; g.add(ground);

    /* road ribbon */
    const n = track.n, hw = track.halfWidth, pos = [], uv = [], idx = [];
    const segLen = track.length / n, vRepeat = segLen / 14;
    for (let i = 0; i <= n; i++) {
      const ii = i % n, l = track.point(ii, -hw), r = track.point(ii, hw);
      pos.push(l.x, l.y + 0.02, l.z, r.x, r.y + 0.02, r.z); uv.push(0, i * vRepeat, 1, i * vRepeat);
      if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }   /* (left, right, next left): faces up */
    }
    const roadGeo = new THREE.BufferGeometry(); roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); roadGeo.setIndex(idx); roadGeo.computeVertexNormals();
    const road = new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({ map: makeAsphalt(def), roughness: 0.78, metalness: 0.1, envMapIntensity: 0.35 })); road.receiveShadow = true; g.add(road);

    /* shoulders + kerbs */
    const shoulderCol = new THREE.Color(th.night ? 0x25262d : 0x7a7463).lerp(new THREE.Color(th.ground), 0.3);
    const shoulder = this._ribbon(track, hw, hw + track.wallOffset, 0.0, null, () => shoulderCol); shoulder.material.roughness = 1; g.add(shoulder);
    const shoulderL = this._ribbon(track, -hw - track.wallOffset, -hw, 0.0, null, () => shoulderCol); shoulderL.material.roughness = 1; g.add(shoulderL);
    const kerbCol = (i) => new THREE.Color(Math.floor(i / 4) % 2 ? 0xc42328 : 0xd9d9d4);
    g.add(this._ribbon(track, -hw - 1.0, -hw, 0.045, null, kerbCol)); g.add(this._ribbon(track, hw, hw + 1.0, 0.045, null, kerbCol));
    /* barriers with a metal top rail */
    const railMat = new THREE.MeshStandardMaterial({ color: 0xb9c0cf, metalness: 0.9, roughness: 0.35 });
    for (const side of [-1, 1]) {
      const off = side * (hw + track.wallOffset);
      const wall = this._wall(track, off, -0.1, 1.0, 0.5, (i) => new THREE.Color(Math.floor(i / 6) % 2 ? (th.night ? 0x2a7cff : 0xa4a8b2) : (th.night ? 0x14141c : 0xa82e25)));
      wall.castShadow = true; wall.receiveShadow = true; g.add(wall);
      const rail = this._wall(track, off - side * 0.05, 1.0, 1.12, 0.6, () => new THREE.Color(0xffffff), railMat); rail.castShadow = true; g.add(rail);
    }
    /* start/finish line + gantry */
    {
      const c = document.createElement('canvas'); c.width = 128; c.height = 16; const x = c.getContext('2d');
      for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#eee'; x.fillRect(i * 8, j * 8, 8, 8); }
      const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
      const line = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, 2.4), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
      const p0 = track.center[0], t0 = track.tangent[0]; line.position.set(p0.x, 0.05, p0.z); line.rotation.x = -Math.PI / 2; line.rotation.z = -Math.atan2(t0.x, t0.z); g.add(line);
      const gant = new THREE.Group(); const post = new THREE.BoxGeometry(0.6, 7.4, 0.6), pm2 = new THREE.MeshStandardMaterial({ color: 0x8a94a8, metalness: 0.7, roughness: 0.4 });
      for (const s of [-1, 1]) { const m = new THREE.Mesh(post, pm2); m.position.set(s * (hw + 1.8), 3.7, 0); m.castShadow = true; gant.add(m); }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(hw * 2 + 4.4, 1.5, 1.3), new THREE.MeshStandardMaterial({ color: 0x1a1c24, roughness: 0.6, metalness: 0.3 })); beam.position.y = 7.4; beam.castShadow = true; gant.add(beam);
      const signMat = new THREE.MeshBasicMaterial({ map: this._textTex('APEX CIRCUIT', '#ff7a1a'), transparent: true });
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 + 3, 1.15), signMat); sign.position.set(0, 7.4, -0.7); sign.rotation.y = Math.PI; gant.add(sign);
      const sign2 = sign.clone(); sign2.position.z = 0.7; sign2.rotation.y = 0; gant.add(sign2);
      /* starting light cluster */
      const lights = new THREE.Group(); const bulbGeo = new THREE.SphereGeometry(0.16, 10, 8);
      this.startLights = [];
      for (let i = 0; i < 5; i++) { const m = new THREE.MeshStandardMaterial({ color: 0x300000, emissive: 0xff2020, emissiveIntensity: 0 }); const b = new THREE.Mesh(bulbGeo, m); b.position.set((i - 2) * 0.5, 6.4, -0.72); lights.add(b); this.startLights.push(m); }
      const box = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.6, 0.3), new THREE.MeshStandardMaterial({ color: 0x0b0c10 })); box.position.set(0, 6.4, -0.6); lights.add(box); gant.add(lights);
      gant.position.set(p0.x, 0, p0.z); gant.rotation.y = Math.atan2(t0.x, t0.z); g.add(gant);
    }
    /* boost pads: glowing chevrons that scroll in the driving direction */
    this.padTex = makeChevronTex(); this.padMats = [];
    for (const pad of track.pads) {
      const mat = new THREE.MeshBasicMaterial({ map: this.padTex, color: 0x39d2ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(pad.half * 2, 9), mat); const p = track.point(pad.idx, pad.lat);
      m.rotation.order = 'YXZ'; m.rotation.set(-Math.PI / 2, track.yawAt(pad.idx), 0); m.position.set(p.x, p.y + 0.06, p.z); m.renderOrder = 2; g.add(m); this.padMats.push(mat);
      const base = new THREE.Mesh(new THREE.PlaneGeometry(pad.half * 2 + 0.5, 9.5), new THREE.MeshBasicMaterial({ color: 0x061a26, transparent: true, opacity: 0.75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 }));
      base.rotation.order = 'YXZ'; base.rotation.copy(m.rotation); base.position.set(p.x, p.y + 0.05, p.z); base.renderOrder = 1; g.add(base);
    }
    this._scenery(track, R);
    this.skids = new SkidMarks(scene);
    /* particles */
    this.smoke = new Particles(scene, 600, this.partTex, { size: 2.8, opacity: 0.35, drag: 1.5 });
    this.sparks = new Particles(scene, 300, this.partTex, { size: 0.5, opacity: 0.95, additive: true, gravity: -14, drag: 0.5 });
    this.dust = new Particles(scene, 400, this.partTex, { size: 3.4, opacity: 0.25, drag: 1.2 });
    this.time = 0;
    if (this.renderPass) this.renderPass.scene = scene;
  }
  setStartLights(count, go) { if (!this.startLights) return; this.startLights.forEach((m, i) => { m.emissive.setHex(go ? 0x20ff60 : 0xff2020); m.emissiveIntensity = go || i < count ? 3 : 0; }); }
  attachHeadlights(car) {
    if (!this.track || !this.track.def.theme.night || !car) return;
    const sp = new THREE.SpotLight(0xfff0c8, 9, 70, 0.5, 0.7, 0.6); sp.position.set(0, 0.9, 1.6); sp.target.position.set(0, -2.5, 30); car.mesh.add(sp); car.mesh.add(sp.target);
  }
  _textTex(text, color) {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 96; const x = c.getContext('2d');
    x.font = '900 70px Orbitron, Rajdhani, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = color; x.fillText(text, 512, 50);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  _ribbon(track, a, b, y, mat, colorFn) {
    const n = track.n, pos = [], col = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const ii = i % n, l = track.point(ii, a), r = track.point(ii, b); pos.push(l.x, l.y + y, l.z, r.x, r.y + y, r.z);
      const c = colorFn(ii); col.push(c.r, c.g, c.b, c.r, c.g, c.b);
      if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, envMapIntensity: 0.3 })); m.receiveShadow = true; return m;
  }
  _wall(track, off, y0, y1, thick, colorFn, mat) {
    const n = track.n, pos = [], col = [], idx = [], t = thick * sign(off);
    for (let i = 0; i <= n; i++) {
      const ii = i % n, p = track.point(ii, off), q = track.point(ii, off + t);
      pos.push(p.x, p.y + y0, p.z, p.x, p.y + y1, p.z, q.x, q.y + y1, q.z, q.x, q.y + y0, q.z);
      const c = colorFn(ii); for (let k = 0; k < 4; k++) col.push(c.r, c.g, c.b);
      if (i < n) { const k = i * 4; idx.push(k, k + 1, k + 4, k + 4, k + 1, k + 5, k + 1, k + 2, k + 5, k + 5, k + 2, k + 6, k + 2, k + 3, k + 6, k + 6, k + 3, k + 7); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    return new THREE.Mesh(geo, mat || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.05, side: THREE.DoubleSide, envMapIntensity: 0.25 }));
  }
  _scenery(track, R) {
    const th = track.def.theme, g = this.trackGroup, n = track.n;
    const waterX = th.water ? th.water.x : Infinity;
    const place = (count, minD, maxD, fn) => {
      let tries = 0, made = 0;
      while (made < count && tries < count * 14) {
        tries++; const i = Math.floor(R() * n), side = R() < 0.5 ? -1 : 1, d = track.halfWidth + track.wallOffset + minD + R() * (maxD - minD);
        const c = track.center[i], r = track.right[i], x = c.x + r.x * side * d, z = c.z + r.z * side * d;
        if (x > waterX - 12) continue;
        if (!track.clear(x, z, minD * 0.6)) continue; fn(x, z, i, made); made++;
      }
    };
    const dummy = new THREE.Object3D(); const col = new THREE.Color();
    if (th.trees === 'pine') {
      const count = th.treeCount;
      const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.36, 2.6, 6), new THREE.MeshStandardMaterial({ color: 0x4a3426, roughness: 1 }), count); trunks.castShadow = true;
      const tiers = [[2.4, 3.4, 2.6], [1.8, 2.9, 4.5], [1.15, 2.5, 6.3]].map(([r, h, y]) => ({ y, mesh: new THREE.InstancedMesh(new THREE.ConeGeometry(r, h, 7), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }), count) }));
      tiers.forEach(t => { t.mesh.castShadow = t.mesh.receiveShadow = true; });
      place(count, 4, 70, (x, z, i, k) => {
        const s = 0.7 + R() * 0.9; const rot = R() * TAU; col.setHSL(0.36 + R() * 0.04, 0.5, 0.2 + R() * 0.12);
        dummy.position.set(x, 1.3 * s, z); dummy.scale.set(s, s, s); dummy.rotation.set(0, rot, 0); dummy.updateMatrix(); trunks.setMatrixAt(k, dummy.matrix);
        for (const t of tiers) { dummy.position.y = t.y * s; dummy.updateMatrix(); t.mesh.setMatrixAt(k, dummy.matrix); t.mesh.setColorAt(k, col); }
      });
      trunks.instanceMatrix.needsUpdate = true; g.add(trunks); for (const t of tiers) { t.mesh.instanceMatrix.needsUpdate = true; if (t.mesh.instanceColor) t.mesh.instanceColor.needsUpdate = true; g.add(t.mesh); }
    }
    if (th.trees === 'palm') {
      const count = th.treeCount, fronds = 7;
      const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.3, 7, 7), new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 1 }), count); trunks.castShadow = true;
      const frondGeo = new THREE.PlaneGeometry(1.2, 3.8, 1, 4); frondGeo.rotateX(-Math.PI / 2); frondGeo.translate(0, 0, 1.9);
      const fp = frondGeo.attributes.position; for (let i = 0; i < fp.count; i++) { const z = fp.getZ(i); fp.setY(i, -0.18 * (z / 3.8) * (z / 3.8) * 3.8); } frondGeo.computeVertexNormals();
      const frondMesh = new THREE.InstancedMesh(frondGeo, new THREE.MeshStandardMaterial({ map: makeFrondTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9, color: 0xffffff }), count * fronds);
      const top = new THREE.Vector3(); const tilt = new THREE.Vector3();
      place(count, 4, 70, (x, z, i, k) => {
        const s = 0.75 + R() * 0.7, lean = (R() - 0.5) * 0.3, leanDir = R() * TAU;
        dummy.position.set(x, 3.5 * s, z); dummy.scale.set(s, s, s); dummy.rotation.set(Math.cos(leanDir) * lean, 0, Math.sin(leanDir) * lean); dummy.updateMatrix(); trunks.setMatrixAt(k, dummy.matrix);
        /* top of the leaning trunk */
        tilt.set(0, 3.5 * s, 0).applyEuler(dummy.rotation); top.set(x, 3.5 * s, z).add(tilt);
        col.setHSL(0.3 + R() * 0.06, 0.55, 0.28 + R() * 0.12);
        for (let f = 0; f < fronds; f++) { const d2 = new THREE.Object3D(); d2.rotation.order = 'YXZ'; d2.rotation.set(0.35 + R() * 0.5, f / fronds * TAU + R() * 0.5, 0); d2.position.copy(top); d2.scale.set(s, s, s); d2.updateMatrix(); frondMesh.setMatrixAt(k * fronds + f, d2.matrix); frondMesh.setColorAt(k * fronds + f, col); }
      });
      trunks.instanceMatrix.needsUpdate = true; frondMesh.instanceMatrix.needsUpdate = true; if (frondMesh.instanceColor) frondMesh.instanceColor.needsUpdate = true; g.add(trunks); g.add(frondMesh);
    }
    if (th.rocks) {
      const geo = new THREE.DodecahedronGeometry(1.4, 0), mat = new THREE.MeshStandardMaterial({ color: 0x6f6f78, roughness: 1 });
      const rocks = new THREE.InstancedMesh(geo, mat, th.rocks); rocks.castShadow = rocks.receiveShadow = true;
      place(th.rocks, 2, 45, (x, z, i, k) => { const s = 0.5 + R() * 1.6; dummy.position.set(x, s * 0.45, z); dummy.scale.set(s, s * (0.6 + R() * 0.5), s); dummy.rotation.set(R(), R() * TAU, R()); dummy.updateMatrix(); rocks.setMatrixAt(k, dummy.matrix); col.setHSL(0.6, 0.05, 0.3 + R() * 0.2); rocks.setColorAt(k, col); });
      rocks.instanceMatrix.needsUpdate = true; if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true; g.add(rocks);
    }
    if (th.buildings) {
      const geo = new THREE.BoxGeometry(1, 1, 1), mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.35, envMapIntensity: 0.6 });
      const bl = new THREE.InstancedMesh(geo, mat, th.buildings); bl.castShadow = bl.receiveShadow = true;
      const palette = [0x2e3a55, 0x4a2f3f, 0x27484a, 0x4f4428, 0x363c4c, 0x1f2a3a];
      const neon = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 1, 0.14), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), th.buildings * 2);
      const neonCols = [0x39d2ff, 0xff3cac, 0xffd166, 0x7cff6b, 0xff7a1a];
      const mats = [];
      place(th.buildings, 13, 85, (x, z, i, k) => {
        const w = 6 + R() * 9, h = 3 + R() * (R() < 0.3 ? 22 : 7), d = 6 + R() * 9, rot = track.yawAt(i) + (R() < 0.5 ? 0 : Math.PI / 2);
        dummy.position.set(x, h / 2, z); dummy.scale.set(w, h, d); dummy.rotation.set(0, rot, 0); dummy.updateMatrix(); bl.setMatrixAt(k, dummy.matrix); mats.push(dummy.matrix.clone());
        col.setHex(palette[Math.floor(R() * palette.length)]).offsetHSL(0, 0, (R() - 0.5) * 0.08); bl.setColorAt(k, col);
        /* two glowing corner strips */
        for (let c2 = 0; c2 < 2; c2++) { const sx = c2 ? 1 : -1; const local = new THREE.Vector3(sx * (w / 2 + 0.05), h / 2, d / 2 + 0.05).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot); dummy.position.set(x + local.x, local.y, z + local.z); dummy.scale.set(1, h, 1); dummy.rotation.set(0, rot, 0); dummy.updateMatrix(); neon.setMatrixAt(k * 2 + c2, dummy.matrix); col.setHex(neonCols[(k + c2) % neonCols.length]); neon.setColorAt(k * 2 + c2, col); }
      });
      bl.instanceMatrix.needsUpdate = true; if (bl.instanceColor) bl.instanceColor.needsUpdate = true; g.add(bl);
      neon.instanceMatrix.needsUpdate = true; if (neon.instanceColor) neon.instanceColor.needsUpdate = true; g.add(neon);
      /* lit windows */
      const pts = [], pc = []; const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
      for (let k = 0; k < 2600; k++) { const bi = Math.floor(R() * mats.length); mats[bi].decompose(p, q, s); const side = R() < 0.5 ? -1 : 1, face = R() < 0.5;
        const local = face ? new THREE.Vector3(side * 0.51, Math.floor((R() - 0.5) * s.y / 1.4) * 1.4 / s.y, R() - 0.5) : new THREE.Vector3(R() - 0.5, Math.floor((R() - 0.5) * s.y / 1.4) * 1.4 / s.y, side * 0.51); local.multiply(s).applyQuaternion(q).add(p); if (local.y < 1.2) continue; pts.push(local.x, local.y, local.z); const c = new THREE.Color().setHSL(R() < 0.7 ? 0.12 : 0.55, 0.9, 0.62); pc.push(c.r, c.g, c.b); }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); wg.setAttribute('color', new THREE.Float32BufferAttribute(pc, 3));
      g.add(new THREE.Points(wg, new THREE.PointsMaterial({ size: 0.8, vertexColors: true, map: this.partTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
    }
    if (th.lamps) {
      const count = 70; const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.17, 8, 6), new THREE.MeshStandardMaterial({ color: 0x9aa3b5, metalness: 0.8, roughness: 0.4 }), count); poles.castShadow = true;
      const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.28, 0.5), new THREE.MeshStandardMaterial({ color: 0xfff1c8, emissive: th.night ? 0xffe2a8 : 0x222222, emissiveIntensity: th.night ? 3 : 0.2 }), count);
      const gp = [];
      for (let k = 0; k < count; k++) { const i = Math.floor(k * n / count), side = k % 2 ? 1 : -1, c = track.center[i], r = track.right[i], d = track.halfWidth + track.wallOffset + 1.3;
        if (c.x + r.x * side * d > waterX - 12) continue;
        dummy.position.set(c.x + r.x * side * d, 4, c.z + r.z * side * d); dummy.rotation.set(0, track.yawAt(i), 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); poles.setMatrixAt(k, dummy.matrix);
        dummy.position.y = 8; dummy.position.x -= r.x * side * 0.75; dummy.position.z -= r.z * side * 0.75; dummy.updateMatrix(); heads.setMatrixAt(k, dummy.matrix); gp.push(dummy.position.x, 7.9, dummy.position.z); }
      poles.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true; g.add(poles); g.add(heads);
      if (th.night) { const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); g.add(new THREE.Points(lg, new THREE.PointsMaterial({ size: 7, color: 0xffe0a0, map: this.glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }))); }
    }
    if (th.mountains) {
      const ring = new THREE.Group(); const mat = new THREE.MeshStandardMaterial({ color: 0x6d7a92, roughness: 1, flatShading: true }); const snow = new THREE.MeshStandardMaterial({ color: 0xf2f6fb, roughness: 1, flatShading: true });
      for (let k = 0; k < 28; k++) { const a = k / 28 * TAU + R() * 0.2, dist = 950 + R() * 350, h = 180 + R() * 240, w = 240 + R() * 280; const m = new THREE.Mesh(new THREE.ConeGeometry(w, h, 5 + Math.floor(R() * 3)), mat); m.position.set(Math.cos(a) * dist, h / 2 - 40, Math.sin(a) * dist); m.rotation.y = R() * TAU; ring.add(m);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(w * 0.33, h * 0.33, 5), snow); cap.position.set(m.position.x, h - 40 - h * 0.165, m.position.z); cap.rotation.y = m.rotation.y; ring.add(cap); }
      g.add(ring);
    }
    if (th.water) {
      const water = new THREE.Mesh(new THREE.PlaneGeometry(1800, 3200), new THREE.MeshPhysicalMaterial({ color: th.water.color || 0x0b2f3f, roughness: 0.15, metalness: 0.1, envMapIntensity: 0.6, clearcoat: 1, clearcoatRoughness: 0.1 }));
      water.rotation.x = -Math.PI / 2; water.position.set(th.water.x + 900, -0.04, 0); g.add(water);
      const sand = new THREE.Mesh(new THREE.PlaneGeometry(60, 3200), new THREE.MeshStandardMaterial({ color: 0xcdb98a, roughness: 1 })); sand.rotation.x = -Math.PI / 2; sand.position.set(th.water.x - 20, -0.06, 0); sand.receiveShadow = true; g.add(sand);
      /* a few boats far out */
      for (let k = 0; k < 6; k++) { const hull = new THREE.Mesh(new THREE.BoxGeometry(14, 3, 5), new THREE.MeshStandardMaterial({ color: 0xf4f6fb, roughness: 0.5 })); hull.position.set(th.water.x + 140 + R() * 500, 1.2, (R() - 0.5) * 1400); hull.rotation.y = R() * TAU; const mast = new THREE.Mesh(new THREE.BoxGeometry(0.4, 18, 0.4), new THREE.MeshStandardMaterial({ color: 0xdddddd })); mast.position.y = 9; hull.add(mast); g.add(hull); }
    }
    /* grandstand near the start line */
    {
      const i = 12, c = track.center[i], r = track.right[i], side = 1, d = track.halfWidth + track.wallOffset + 7;
      const stand = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(46, 1, 10), new THREE.MeshStandardMaterial({ color: 0x2b2f3a })); base.position.y = 0.5; stand.add(base);
      for (let s = 0; s < 6; s++) { const step = new THREE.Mesh(new THREE.BoxGeometry(46, 1, 1.6), new THREE.MeshStandardMaterial({ color: s % 2 ? 0x394157 : 0x2f3648 })); step.position.set(0, 1 + s * 0.9, -2 + s * 1.5); step.castShadow = true; stand.add(step); }
      const cp = [], cc = []; for (let k = 0; k < 1100; k++) { const s = Math.floor(R() * 6); cp.push((R() - 0.5) * 44, 1.9 + s * 0.9, -2 + s * 1.5 + (R() - 0.5) * 0.6); const cl = new THREE.Color().setHSL(R(), 0.7, 0.5); cc.push(cl.r, cl.g, cl.b); }
      const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3));
      stand.add(new THREE.Points(cg, new THREE.PointsMaterial({ size: 0.8, vertexColors: true, map: this.partTex, transparent: true, depthWrite: false })));
      const roof = new THREE.Mesh(new THREE.BoxGeometry(48, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0xd8dde8, metalness: 0.6, roughness: 0.35 })); roof.position.set(0, 9.5, 2.5); roof.castShadow = true; stand.add(roof);
      for (const sx of [-22, 22]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 9, 0.6), new THREE.MeshStandardMaterial({ color: 0x8a94a8, metalness: 0.7 })); p.position.set(sx, 5, 7.5); stand.add(p); }
      const banner = new THREE.Mesh(new THREE.PlaneGeometry(40, 1.5), new THREE.MeshBasicMaterial({ map: this._textTex('APEX CIRCUIT  ·  ' + track.name.toUpperCase(), '#39d2ff'), transparent: true })); banner.position.set(0, 8.5, -3.62); banner.rotation.y = Math.PI; stand.add(banner);
      const fascia = new THREE.Mesh(new THREE.BoxGeometry(48, 1.9, 0.2), new THREE.MeshStandardMaterial({ color: 0x12141c, roughness: 0.6 })); fascia.position.set(0, 8.5, -3.45); stand.add(fascia);
      /* the low front row (local -z) faces the track */
      stand.position.set(c.x + r.x * side * d, 0, c.z + r.z * side * d); stand.rotation.y = Math.atan2(side * r.x, side * r.z);
      g.add(stand);
    }
  }

  dispose() {
    if (!this.trackGroup) return;
    this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { const ms = [].concat(o.material); for (const m of ms) { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); } } });
    while (this.scene.children.length) this.scene.remove(this.scene.children[0]);
    if (this.envRT) { this.envRT.dispose(); this.envRT = null; } this.scene.environment = null;
    this.trackGroup = null; this.smoke = this.sparks = this.dust = null; this.startLights = null; this.skids = null; this.padMats = [];
  }
  add(obj) { this.scene.add(obj); }
  remove(obj) { this.scene.remove(obj); }

  onCollision(car, impact, point, carOnCar) {
    if (!this.sparks) return;
    const n = Math.min(26, Math.floor(impact * 3)); const c = new THREE.Color(carOnCar ? 0xffd27a : 0xffb050);
    for (let i = 0; i < n; i++) this.sparks.emit(point, new THREE.Vector3((Math.random() - 0.5) * 9, Math.random() * 6 + 2, (Math.random() - 0.5) * 9), c, 0.3 + Math.random() * 0.4);
    if (car.isPlayer) { this.shake = Math.min(1, impact * 0.08); Audio.thud(Math.min(1.2, impact / 10)); }
  }
  onLap() {}
  onDrift() {}
  onPad() {}

  effects(cars, dt) {
    if (!this.smoke) return;
    const grey = new THREE.Color(0xbfc3cc), dustC = new THREE.Color(this.track.def.theme.night ? 0x4a4a55 : 0xb49b78);
    if (this.padTex) { this.padTex.offset.y = (this.padTex.offset.y + dt * 1.7) % 1; const pulse = 0.75 + Math.sin(performance.now() * 0.006) * 0.2; for (const m of this.padMats) m.opacity = pulse; }
    const wp = new THREE.Vector3();
    for (const c of cars) {
      if (c.ghost) continue;
      const sp = Math.abs(c.speed);
      /* tyre marks from the rear wheels while sliding or locked up on tarmac */
      const marking = !c.offTrack && sp > 5 && (c.slip > 0.3 || (c.lightsBrake && sp > 30 && c.input && c.input.brake > 0.8));
      if (marking) c.mesh.updateMatrixWorld();
      for (let wi = 2; wi < 4; wi++) { if (marking) { c.mesh.userData.wheels[wi].hub.getWorldPosition(wp); wp.y -= 0.31; } this.skids.mark(c.id + ':' + wi, wp, marking); }
      /* coloured sparks show the drift charge tier */
      if (c.drifting && c.driftTier > 0 && Math.random() < 0.8) { const w = c.mesh.userData.wheels[2 + Math.floor(Math.random() * 2)]; const p = new THREE.Vector3(); w.hub.getWorldPosition(p); p.y = c.pos.y + 0.15; this.sparks.emit(p, new THREE.Vector3((Math.random() - 0.5) * 5 - c.vel.x * 0.15, 1.5 + Math.random() * 3, (Math.random() - 0.5) * 5 - c.vel.z * 0.15), new THREE.Color(TIER_HEX[c.driftTier]), 0.3 + Math.random() * 0.25); }
      if (c.slip > 0.25 && sp > 4 && !c.offTrack) { const k = Math.random() < c.slip ? 2 : 1; for (let i = 0; i < k; i++) { const w = c.mesh.userData.wheels[2 + (i % 2)]; const p = new THREE.Vector3(); w.hub.getWorldPosition(p); p.y = c.pos.y + 0.2; this.smoke.emit(p, new THREE.Vector3((Math.random() - 0.5) * 2, 1 + Math.random(), (Math.random() - 0.5) * 2), grey, 0.8 + Math.random() * 0.6); } }
      if (c.offTrack && sp > 6) { const w = c.mesh.userData.wheels[2 + Math.floor(Math.random() * 2)]; const p = new THREE.Vector3(); w.hub.getWorldPosition(p); p.y = 0.2; this.dust.emit(p, new THREE.Vector3((Math.random() - 0.5) * 3 - c.vel.x * 0.1, 1.5 + Math.random(), (Math.random() - 0.5) * 3 - c.vel.z * 0.1), dustC, 1.2); }
      if ((c.boosting || c.turboT > 0 || c.padT > 0) && Math.random() < 0.7) { const p = c.pos.clone().addScaledVector(c.forward(), -2.6); p.y = c.pos.y + 0.35; this.sparks.emit(p, c.vel.clone().multiplyScalar(0.3).add(new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2)), new THREE.Color(c.boosting ? 0x7fe0ff : c.padT > 0 ? 0xffd166 : TIER_HEX[c.turboTier] || 0xffa13a), 0.25); }
    }
    this.skids.flush();
    this.smoke.update(dt); this.sparks.update(dt); this.dust.update(dt);
  }

  /* cinematic sweep used during the countdown: ends exactly at the chase position */
  introCamera(car, f) {
    f = clamp(f, 0, 1); const e = f * f * (3 - 2 * f);
    const fwd = car.forward(); const ang = car.yaw + Math.PI * (0.58 + 0.42 * e); const dist = lerp(5.2, 6.6, e), h = lerp(1.0, 2.5, e);
    this.camPos.set(car.pos.x + Math.sin(ang) * dist, car.pos.y + h, car.pos.z + Math.cos(ang) * dist);
    this.camLook.copy(car.pos).addScaledVector(fwd, lerp(0.5, 7, e)); this.camLook.y += lerp(0.7, 0.9, e);
    this.camera.position.copy(this.camPos); this.camera.lookAt(this.camLook); this.camera.fov = lerp(44, 60, e); this.camera.updateProjectionMatrix();
    this._followSun(car.pos);
  }
  _followSun(p) { if (this.sun) { this.sun.target.position.copy(p); this.sun.position.copy(p).add(new THREE.Vector3(...this.track.def.theme.sun).normalize().multiplyScalar(260)); } if (this.sky) this.sky.position.copy(this.camera.position); }

  updateCamera(car, dt, mode = this.camMode, instant = false) {
    const fwd = car.forward(); const sp = Math.max(car.spd || 0, Math.abs(car.speed));
    let target, look;
    if (mode === 1) {
      target = car.pos.clone().addScaledVector(fwd, 0.9); target.y += 1.15; look = car.pos.clone().addScaledVector(fwd, 30); look.y += 0.8;
      this.camPos.copy(target); this.camLook.copy(look);
    } else {
      const dist = 6.6 + sp * 0.03, height = 2.5 + sp * 0.01;
      const velDir = sp > 3 ? car.vel.clone().normalize().lerp(fwd, car.drifting ? 0.3 : 0.6).normalize() : fwd;
      target = car.pos.clone().addScaledVector(velDir, -dist); target.y = car.pos.y + height;
      look = car.pos.clone().addScaledVector(fwd, 7); look.y = car.pos.y + 0.9;
      if (instant) { this.camPos.copy(target); this.camLook.copy(look); }
      else { this.camPos.x = damp(this.camPos.x, target.x, 7, dt); this.camPos.z = damp(this.camPos.z, target.z, 7, dt); this.camPos.y = damp(this.camPos.y, target.y, 6, dt); this.camLook.lerp(look, 1 - Math.exp(-14 * dt)); }
    }
    this.shake = Math.max(0, this.shake - dt * 2.5);
    const sh = this.shake * 0.35 + (car.boosting || car.turboT > 0 || car.padT > 0 ? 0.04 : 0) + (car.offTrack && sp > 8 ? 0.05 : 0);
    const cp = this.camPos.clone(); if (sh > 0) cp.add(new THREE.Vector3((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh));
    this.camera.position.copy(cp); this.camera.lookAt(this.camLook);
    /* camera.rotateZ(+) drops the left side; car.roll(+) lifts the car's left side, hence the minus */
    this.camRoll = damp(this.camRoll, -car.roll * (mode === 1 ? 1 : 0.4), 6, dt); this.camera.rotateZ(this.camRoll);
    const hot = car.boosting || car.turboT > 0 || car.padT > 0;
    const fov = 60 + clamp(sp / 70, 0, 1) * 13 + (hot ? 6 : 0);
    this.updateStreaks(sp, hot ? 1 : car.draft > 0.5 ? 0.4 : 0, dt);
    this.camera.fov = damp(this.camera.fov, fov, 5, dt); this.camera.updateProjectionMatrix();
    this._followSun(car.pos);
  }
  orbitCamera(t, center) {
    const a = t * 0.08, r = 70; this.camera.position.set(center.x + Math.cos(a) * r, 22 + Math.sin(t * 0.3) * 3, center.z + Math.sin(a) * r);
    this.camera.lookAt(center.x, 0, center.z); this.camera.fov = 55; this.camera.updateProjectionMatrix(); this._followSun(center); this.streaks.visible = false;
  }
  render() { if (this.composer) { this.renderPass.camera = this.camera; this.composer.render(); } else this.renderer.render(this.scene, this.camera); }
}
