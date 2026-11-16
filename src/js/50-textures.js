/* ========================================================================
   World: renderer + post-processing, sky/environment, track meshes,
   scenery, particles, camera
   ======================================================================== */
function makeAsphalt(def) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 1024;
  const x = c.getContext('2d');
  x.fillStyle = def.theme.night ? '#383944' : '#55555b';
  x.fillRect(0, 0, 512, 1024);
  const img = x.getImageData(0, 0, 512, 1024),
    d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n + 1;
  }
  x.putImageData(img, 0, 0);
  /* worn tyre bands where cars run */
  for (const bx of [150, 362]) {
    const gr = x.createLinearGradient(bx - 60, 0, bx + 60, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(0.5, 'rgba(0,0,0,.22)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr;
    x.fillRect(bx - 60, 0, 120, 1024);
  }
  /* patches / cracks */
  x.strokeStyle = 'rgba(0,0,0,.09)';
  x.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) {
    x.beginPath();
    let px = Math.random() * 512,
      py = Math.random() * 1024;
    x.moveTo(px, py);
    for (let k = 0; k < 5; k++) {
      px += (Math.random() - 0.5) * 60;
      py += Math.random() * 40;
      x.lineTo(px, py);
    }
    x.stroke();
  }
  /* edge lines + centre dashes */
  x.fillStyle = 'rgba(238,238,228,.9)';
  x.fillRect(12, 0, 9, 1024);
  x.fillRect(491, 0, 9, 1024);
  x.fillStyle = def.theme.night ? 'rgba(255,210,80,.85)' : 'rgba(250,232,140,.8)';
  for (let y = 0; y < 1024; y += 256) x.fillRect(250, y, 12, 140);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.encoding = THREE.sRGBEncoding;
  return t;
}
/* tiling grey grain multiplied over the terrain's vertex colours: fine noise plus soft darker blotches */
function makeDetailTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const img = x.createImageData(256, 256),
    d = img.data;
  for (let i = 0; i < 256 * 256; i++) {
    const v = 205 + Math.random() * 50;
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
    d[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  for (let i = 0; i < 26; i++) {
    const px = Math.random() * 256,
      py = Math.random() * 256,
      r = 14 + Math.random() * 40;
    /* drawn at the four wrap positions so the blotches tile without seams */
    for (const ox of [0, -256, 256])
      for (const oy of [0, -256, 256]) {
        const gr = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, r);
        gr.addColorStop(0, 'rgba(0,0,0,.16)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = gr;
        x.fillRect(px + ox - r, py + oy - r, r * 2, r * 2);
      }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.encoding = THREE.sRGBEncoding;
  return t;
}
function makeParticleTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
function makeCloudTex() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const x = c.getContext('2d');
  for (let i = 0; i < 26; i++) {
    const r = 18 + Math.random() * 30,
      cx = 40 + Math.random() * 176,
      cy = 50 + Math.random() * 40 - (r - 18) * 0.5;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(255,255,255,.9)');
    g.addColorStop(0.6, 'rgba(255,255,255,.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 128);
  }
  return new THREE.CanvasTexture(c);
}
function makeFrondTex() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#2f8a3a';
  x.beginPath();
  x.moveTo(32, 0);
  for (let y = 0; y <= 256; y += 16) {
    const w = 6 + 26 * Math.sin((Math.PI * y) / 256) * (1 - y / 300);
    x.lineTo(32 + w, y);
  }
  for (let y = 256; y >= 0; y -= 16) {
    const w = 6 + 26 * Math.sin((Math.PI * y) / 256) * (1 - y / 300);
    x.lineTo(32 - w, y);
  }
  x.closePath();
  x.fill();
  x.strokeStyle = '#1f6a2a';
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(32, 0);
  x.lineTo(32, 256);
  x.stroke();
  for (let y = 10; y < 256; y += 14) {
    x.beginPath();
    x.moveTo(32, y);
    x.lineTo(2, y + 18);
    x.moveTo(32, y);
    x.lineTo(62, y + 18);
    x.strokeStyle = 'rgba(10,40,15,.35)';
    x.lineWidth = 2;
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  return t;
}

const SKY_VERT = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz - cameraPosition; gl_Position = projectionMatrix * viewMatrix * w; }`;
const SKY_FRAG = `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; uniform vec3 sunDir; uniform vec3 sunColor; uniform float glow; varying vec3 vW;
void main(){ vec3 d = normalize(vW); float h = d.y; vec3 col = h > 0.0 ? mix(horizon, top, pow(h, 0.5)) : mix(horizon, bottom, pow(-h, 0.45));
 float s = max(dot(d, normalize(sunDir)), 0.0); col += sunColor * glow * (pow(s, 400.0) * 2.2 + pow(s, 12.0) * 0.35 + pow(s, 3.0) * 0.08);
 gl_FragColor = vec4(col, 1.0); }`;
/* mipmapped cube map of the sky, used as the scene environment for reflections and soft ambient light */
function makeEnvironment(renderer, th) {
  const ground = new THREE.Color(th.ground || 0x303030).multiplyScalar(0.6);
  const envTheme = {
    sky: [new THREE.Color(th.sky[0]).multiplyScalar(0.8), new THREE.Color(th.sky[1]).multiplyScalar(0.75), ground],
    sun: th.sun,
    sunColor: th.sunColor,
    glow: 0.25,
  };
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), skyMaterial(envTheme)));
  const rt = new THREE.WebGLCubeRenderTarget(128, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
  });
  const cam = new THREE.CubeCamera(0.1, 100, rt);
  cam.update(renderer, envScene);
  envScene.children[0].geometry.dispose();
  envScene.children[0].material.dispose();
  return rt;
}
function skyMaterial(th) {
  return new THREE.ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color(th.sky[0]) },
      horizon: { value: new THREE.Color(th.sky[1]) },
      bottom: { value: new THREE.Color(th.sky[2]) },
      sunDir: { value: new THREE.Vector3(...th.sun) },
      sunColor: { value: new THREE.Color(th.sunColor) },
      glow: { value: th.glow == null ? 1 : th.glow },
    },
  });
}


function makeChevronTex() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const x = c.getContext('2d');
  x.lineWidth = 16;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  for (let k = -1; k < 3; k++) {
    const y = k * 64 + 20;
    x.strokeStyle = 'rgba(255,255,255,.95)';
    x.beginPath();
    x.moveTo(18, y);
    x.lineTo(64, y + 40);
    x.lineTo(110, y);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 2.2);
  return t;
}
