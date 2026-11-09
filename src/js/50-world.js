/* ========================================================================
   World: renderer, sky, lighting, track meshes, scenery, particles, camera
   ======================================================================== */
function makeAsphalt(def) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const x = c.getContext('2d');
  x.fillStyle = def.theme.night ? '#1d1f26' : '#2a2c33'; x.fillRect(0, 0, 256, 512);
  const img = x.getImageData(0, 0, 256, 512), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 26; d[i] += n; d[i + 1] += n; d[i + 2] += n + 2; }
  x.putImageData(img, 0, 0);
  /* edge lines */
  x.fillStyle = 'rgba(235,235,225,.85)'; x.fillRect(6, 0, 5, 512); x.fillRect(245, 0, 5, 512);
  /* centre dashes */
  x.fillStyle = def.theme.night ? 'rgba(255,215,90,.8)' : 'rgba(250,235,150,.75)';
  for (let y = 0; y < 512; y += 128) x.fillRect(125, y, 6, 70);
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.encoding = THREE.sRGBEncoding; return t;
}
function makeGroundTex(def) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const a = new THREE.Color(def.theme.ground), b = new THREE.Color(def.theme.ground2);
  const img = x.createImageData(256, 256), d = img.data;
  for (let i = 0; i < 256 * 256; i++) { const n = Math.random(); const r = a.r * (1 - n) + b.r * n, g = a.g * (1 - n) + b.g * n, bl = a.b * (1 - n) + b.b * n; d[i * 4] = r * 255; d[i * 4 + 1] = g * 255; d[i * 4 + 2] = bl * 255; d[i * 4 + 3] = 255; }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(140, 140); t.encoding = THREE.sRGBEncoding; return t;
}
function makeParticleTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}

const SKY_VERT = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const SKY_FRAG = `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; uniform vec3 sunDir; uniform vec3 sunColor; varying vec3 vW;
void main(){ vec3 d = normalize(vW); float h = d.y; vec3 col = h > 0.0 ? mix(horizon, top, pow(h, 0.55)) : mix(horizon, bottom, pow(-h, 0.5));
 float s = max(dot(d, normalize(sunDir)), 0.0); col += sunColor * (pow(s, 220.0) * 1.6 + pow(s, 8.0) * 0.25);
 gl_FragColor = vec4(col, 1.0); }`;

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
      const f = this.life[i] / this.max[i]; this.col[i * 3] *= 0.5 + f * 0.5 > 0 ? 1 : 1;
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true;
  }
}

class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05;
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.3, 2200);
    this.scene = new THREE.Scene();
    this.camMode = 0; this.camPos = new THREE.Vector3(); this.camLook = new THREE.Vector3(); this.shake = 0;
    this.partTex = makeParticleTex();
    this.track = null; this.trackGroup = null; this.time = 0;
    this.resize(); addEventListener('resize', () => this.resize());
  }
  resize() {
    const w = this.canvas.clientWidth || innerWidth, h = this.canvas.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    /* lower pixel ratio on big phone screens for frame rate */
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, w * h > 1.6e6 ? 1.25 : 2));
  }

  /* -------- build a complete scene for a track -------- */
  load(track, seed = 1) {
    this.dispose();
    this.track = track; const def = track.def, th = def.theme, R = rng(seed);
    const scene = this.scene;
    scene.fog = new THREE.Fog(th.fog, th.fogNear, th.fogFar);
    /* sky */
    const skyMat = new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(th.sky[0]) }, horizon: { value: new THREE.Color(th.sky[1]) }, bottom: { value: new THREE.Color(th.sky[2]) }, sunDir: { value: new THREE.Vector3(...th.sun) }, sunColor: { value: new THREE.Color(th.sunColor) } } });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 32, 16), skyMat); this.sky.frustumCulled = false; scene.add(this.sky);
    /* lights */
    this.hemi = new THREE.HemisphereLight(th.hemi[0], th.hemi[1], th.night ? 0.35 : 0.75); scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(th.sunColor, th.night ? 0.5 : 1.35); this.sun.position.set(...th.sun).normalize().multiplyScalar(260);
    this.sun.castShadow = true; const sc = this.sun.shadow.camera; sc.near = 10; sc.far = 700; sc.left = sc.bottom = -110; sc.right = sc.top = 110;
    this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.bias = -0.0008; this.sun.shadow.normalBias = 0.6; this.sun.target = new THREE.Object3D(); scene.add(this.sun.target); scene.add(this.sun);
    this.ambient = new THREE.AmbientLight(0xffffff, th.night ? 0.12 : 0.18); scene.add(this.ambient);

    const g = new THREE.Group(); this.trackGroup = g; scene.add(g);
    /* ground */
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ map: makeGroundTex(def), roughness: 1, metalness: 0 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.08; ground.receiveShadow = true; g.add(ground);

    /* road ribbon */
    const n = track.n, hw = track.halfWidth, pos = [], uv = [], idx = [];
    const segLen = track.length / n, vRepeat = segLen / 12;
    for (let i = 0; i <= n; i++) {
      const ii = i % n, l = track.point(ii, -hw), r = track.point(ii, hw);
      pos.push(l.x, l.y + 0.02, l.z, r.x, r.y + 0.02, r.z); uv.push(0, i * vRepeat, 1, i * vRepeat);
      if (i < n) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const roadGeo = new THREE.BufferGeometry(); roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); roadGeo.setIndex(idx); roadGeo.computeVertexNormals();
    const road = new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({ map: makeAsphalt(def), roughness: 0.9, metalness: 0.05 })); road.receiveShadow = true; g.add(road);

    /* shoulders (gravel/grass strip) + kerbs */
    const shoulder = this._ribbon(track, hw, hw + track.wallOffset, 0.0, null, (i) => new THREE.Color(th.night ? 0x23242b : 0x6e6a5a).lerp(new THREE.Color(th.ground), 0.35));
    shoulder.material.roughness = 1; g.add(shoulder);
    const kerbL = this._ribbon(track, -hw - 0.9, -hw, 0.03, null, (i) => new THREE.Color(Math.floor(i / 4) % 2 ? 0xdd2a2a : 0xf2f2f2)); g.add(kerbL);
    const kerbR = this._ribbon(track, hw, hw + 0.9, 0.03, null, (i) => new THREE.Color(Math.floor(i / 4) % 2 ? 0xdd2a2a : 0xf2f2f2)); g.add(kerbR);
    /* barriers */
    for (const side of [-1, 1]) {
      const off = side * (hw + track.wallOffset);
      const wall = this._wall(track, off, 1.0, (i) => new THREE.Color(Math.floor(i / 6) % 2 ? (th.night ? 0x2a7cff : 0xe8e8e8) : (th.night ? 0x12121a : 0xd23b2f)));
      wall.castShadow = true; wall.receiveShadow = true; g.add(wall);
    }
    /* start/finish line + gantry */
    {
      const c = document.createElement('canvas'); c.width = 128; c.height = 16; const x = c.getContext('2d');
      for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#eee'; x.fillRect(i * 8, j * 8, 8, 8); }
      const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
      const line = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, 2.4), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
      const p0 = track.center[0], t0 = track.tangent[0]; line.position.set(p0.x, 0.05, p0.z); line.rotation.x = -Math.PI / 2; line.rotation.z = -Math.atan2(t0.x, t0.z); g.add(line);
      const gant = new THREE.Group(); const post = new THREE.BoxGeometry(0.5, 7, 0.5), pm = new THREE.MeshStandardMaterial({ color: 0x8a94a8, metalness: 0.7, roughness: 0.4 });
      for (const s of [-1, 1]) { const m = new THREE.Mesh(post, pm); m.position.set(s * (hw + 1.6), 3.5, 0); m.castShadow = true; gant.add(m); }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(hw * 2 + 4, 1.4, 1.2), new THREE.MeshStandardMaterial({ color: 0x1a1c24, roughness: 0.6 })); beam.position.y = 7.2; beam.castShadow = true; gant.add(beam);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 + 3, 1.1), new THREE.MeshBasicMaterial({ map: this._textTex('APEX CIRCUIT', '#ff7a1a'), transparent: true })); sign.position.set(0, 7.2, -0.65); sign.rotation.y = Math.PI; gant.add(sign);
      const sign2 = sign.clone(); sign2.position.z = 0.65; sign2.rotation.y = 0; gant.add(sign2);
      gant.position.set(p0.x, 0, p0.z); gant.rotation.y = Math.atan2(t0.x, t0.z); g.add(gant);
    }
    /* scenery */
    this._scenery(track, R);
    /* particles */
    this.smoke = new Particles(scene, 600, this.partTex, { size: 2.6, opacity: 0.35, drag: 1.5 });
    this.sparks = new Particles(scene, 300, this.partTex, { size: 0.5, opacity: 0.9, additive: true, gravity: -14, drag: 0.5 });
    this.dust = new Particles(scene, 400, this.partTex, { size: 3.2, opacity: 0.25, drag: 1.2 });
    this.time = 0;
  }
  _textTex(text, color) {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 96; const x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,0,0)'; x.fillRect(0, 0, 1024, 96);
    x.font = '900 70px Orbitron, Rajdhani, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = color; x.fillText(text, 512, 50);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  _ribbon(track, a, b, y, mat, colorFn) {
    const n = track.n, pos = [], col = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const ii = i % n, l = track.point(ii, a), r = track.point(ii, b); pos.push(l.x, l.y + y, l.z, r.x, r.y + y, r.z);
      const c = colorFn(ii); col.push(c.r, c.g, c.b, c.r, c.g, c.b);
      if (i < n) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 })); m.receiveShadow = true; return m;
  }
  _wall(track, off, h, colorFn) {
    const n = track.n, pos = [], col = [], idx = [], thick = 0.5 * sign(off);
    for (let i = 0; i <= n; i++) {
      const ii = i % n, p = track.point(ii, off), q = track.point(ii, off + thick);
      pos.push(p.x, p.y - 0.1, p.z, p.x, p.y + h, p.z, q.x, q.y + h, q.z, q.x, q.y - 0.1, q.z);
      const c = colorFn(ii); for (let k = 0; k < 4; k++) col.push(c.r, c.g, c.b);
      if (i < n) { const k = i * 4; idx.push(k, k + 1, k + 4, k + 4, k + 1, k + 5, k + 1, k + 2, k + 5, k + 5, k + 2, k + 6, k + 2, k + 3, k + 6, k + 6, k + 3, k + 7); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }));
  }
  _scenery(track, R) {
    const th = track.def.theme, g = this.trackGroup, n = track.n;
    const place = (count, minD, maxD, fn) => {
      let tries = 0, made = 0;
      while (made < count && tries < count * 12) {
        tries++; const i = Math.floor(R() * n), side = R() < 0.5 ? -1 : 1, d = track.halfWidth + track.wallOffset + minD + R() * (maxD - minD);
        const c = track.center[i], r = track.right[i], x = c.x + r.x * side * d, z = c.z + r.z * side * d;
        if (!track.clear(x, z, minD * 0.6)) continue; fn(x, z, i, made); made++;
      }
    };
    const dummy = new THREE.Object3D();
    if (th.trees === 'pine' || th.trees === 'palm') {
      const count = th.treeCount;
      const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 3, 6), trunkMat = new THREE.MeshStandardMaterial({ color: th.trees === 'palm' ? 0x7a5a3a : 0x4a3426, roughness: 1 });
      const crownGeo = th.trees === 'pine' ? new THREE.ConeGeometry(2.4, 7, 7) : new THREE.SphereGeometry(2.6, 7, 5);
      const crownMat = new THREE.MeshStandardMaterial({ color: th.trees === 'pine' ? 0x1f5a2e : 0x3f8f3a, roughness: 0.95 });
      const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count), crowns = new THREE.InstancedMesh(crownGeo, crownMat, count);
      trunks.castShadow = crowns.castShadow = true; crowns.receiveShadow = true;
      const col = new THREE.Color();
      place(count, 4, 60, (x, z, i, k) => {
        const s = 0.7 + R() * 0.9; dummy.position.set(x, 1.5 * s, z); dummy.scale.set(s, s, s); dummy.rotation.y = R() * TAU; dummy.updateMatrix(); trunks.setMatrixAt(k, dummy.matrix);
        dummy.position.y = (th.trees === 'pine' ? 5.5 : 4.6) * s; dummy.updateMatrix(); crowns.setMatrixAt(k, dummy.matrix);
        col.setHSL(th.trees === 'pine' ? 0.36 : 0.3, 0.45, 0.22 + R() * 0.14); crowns.setColorAt(k, col);
      });
      trunks.instanceMatrix.needsUpdate = true; crowns.instanceMatrix.needsUpdate = true; if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
      g.add(trunks); g.add(crowns);
    }
    if (th.rocks) {
      const geo = new THREE.DodecahedronGeometry(1.4, 0), mat = new THREE.MeshStandardMaterial({ color: 0x6f6f78, roughness: 1 });
      const rocks = new THREE.InstancedMesh(geo, mat, th.rocks); rocks.castShadow = rocks.receiveShadow = true;
      place(th.rocks, 2, 40, (x, z, i, k) => { const s = 0.5 + R() * 1.6; dummy.position.set(x, s * 0.5, z); dummy.scale.set(s, s * (0.6 + R() * 0.5), s); dummy.rotation.set(R(), R() * TAU, R()); dummy.updateMatrix(); rocks.setMatrixAt(k, dummy.matrix); });
      rocks.instanceMatrix.needsUpdate = true; g.add(rocks);
    }
    if (th.buildings) {
      const geo = new THREE.BoxGeometry(1, 1, 1), mat = new THREE.MeshStandardMaterial({ color: 0x3a3f52, roughness: 0.6, metalness: 0.3 });
      const bl = new THREE.InstancedMesh(geo, mat, th.buildings); bl.castShadow = bl.receiveShadow = true;
      const col = new THREE.Color(); const palette = [0x3a4a6a, 0x5a3a4a, 0x2f5a5a, 0x6a5a2f, 0x444a5a];
      place(th.buildings, 3, 70, (x, z, i, k) => {
        const w = 6 + R() * 8, h = 3 + R() * (R() < 0.3 ? 18 : 6), d = 6 + R() * 8;
        dummy.position.set(x, h / 2, z); dummy.scale.set(w, h, d); dummy.rotation.set(0, track.yawAt(i) + (R() < 0.5 ? 0 : Math.PI / 2), 0); dummy.updateMatrix(); bl.setMatrixAt(k, dummy.matrix);
        col.setHex(palette[Math.floor(R() * palette.length)]).offsetHSL(0, 0, (R() - 0.5) * 0.1); bl.setColorAt(k, col);
      });
      bl.instanceMatrix.needsUpdate = true; if (bl.instanceColor) bl.instanceColor.needsUpdate = true; g.add(bl);
      /* glowing windows: emissive planes scattered via points */
      const pts = []; const pc = [];
      for (let k = 0; k < 2200; k++) { const bi = Math.floor(R() * th.buildings); const m = new THREE.Matrix4(); bl.getMatrixAt(bi, m); const p = new THREE.Vector3(); const q = new THREE.Quaternion(); const s = new THREE.Vector3(); m.decompose(p, q, s); const side = R() < 0.5 ? -1 : 1; const face = R() < 0.5;
        const local = face ? new THREE.Vector3(side * 0.51, R() - 0.5, R() - 0.5) : new THREE.Vector3(R() - 0.5, R() - 0.5, side * 0.51); local.multiply(s).applyQuaternion(q).add(p); if (local.y < 1) continue; pts.push(local.x, local.y, local.z); const c = new THREE.Color().setHSL(R() < 0.7 ? 0.12 : 0.55, 0.9, 0.6); pc.push(c.r, c.g, c.b); }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); wg.setAttribute('color', new THREE.Float32BufferAttribute(pc, 3));
      g.add(new THREE.Points(wg, new THREE.PointsMaterial({ size: 0.7, vertexColors: true, map: this.partTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
    }
    if (th.lamps) {
      const count = 70; const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 8, 6), poleMat = new THREE.MeshStandardMaterial({ color: 0x9aa3b5, metalness: 0.8, roughness: 0.4 });
      const poles = new THREE.InstancedMesh(poleGeo, poleMat, count); poles.castShadow = true;
      const headGeo = new THREE.BoxGeometry(1.4, 0.3, 0.5), headMat = new THREE.MeshStandardMaterial({ color: 0xfff1c8, emissive: th.night ? 0xffe2a8 : 0x222222, emissiveIntensity: th.night ? 2.5 : 0.2 });
      const heads = new THREE.InstancedMesh(headGeo, headMat, count);
      for (let k = 0; k < count; k++) { const i = Math.floor(k * n / count), side = k % 2 ? 1 : -1, c = track.center[i], r = track.right[i], d = track.halfWidth + track.wallOffset + 1.3;
        dummy.position.set(c.x + r.x * side * d, 4, c.z + r.z * side * d); dummy.rotation.set(0, track.yawAt(i), 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); poles.setMatrixAt(k, dummy.matrix);
        dummy.position.y = 8; dummy.position.x -= r.x * side * 0.7; dummy.position.z -= r.z * side * 0.7; dummy.updateMatrix(); heads.setMatrixAt(k, dummy.matrix); }
      poles.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true; g.add(poles); g.add(heads);
    }
    if (th.mountains) {
      const ring = new THREE.Group(); const mat = new THREE.MeshStandardMaterial({ color: 0x6d7a92, roughness: 1, flatShading: true });
      for (let k = 0; k < 26; k++) { const a = k / 26 * TAU + R() * 0.2, dist = 900 + R() * 300, h = 160 + R() * 220, w = 220 + R() * 260; const m = new THREE.Mesh(new THREE.ConeGeometry(w, h, 5 + Math.floor(R() * 3)), mat); m.position.set(Math.cos(a) * dist, h / 2 - 40, Math.sin(a) * dist); m.rotation.y = R() * TAU; ring.add(m);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(w * 0.35, h * 0.35, 5), new THREE.MeshStandardMaterial({ color: 0xf2f6fb, roughness: 1, flatShading: true })); cap.position.set(m.position.x, h - 40 - h * 0.175, m.position.z); ring.add(cap); }
      g.add(ring);
    }
    /* grandstand near the start line, outside the barrier */
    {
      const i = 12, c = track.center[i], r = track.right[i], side = 1, d = track.halfWidth + track.wallOffset + 7;
      const stand = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(44, 1, 10), new THREE.MeshStandardMaterial({ color: 0x2b2f3a })); base.position.y = 0.5; stand.add(base);
      for (let s = 0; s < 6; s++) { const step = new THREE.Mesh(new THREE.BoxGeometry(44, 1, 1.6), new THREE.MeshStandardMaterial({ color: s % 2 ? 0x394157 : 0x2f3648 })); step.position.set(0, 1 + s * 0.9, -2 + s * 1.5); step.castShadow = true; stand.add(step);
        /* crowd: coloured points */ }
      const cp = [], cc = []; for (let k = 0; k < 900; k++) { const s = Math.floor(R() * 6); cp.push((R() - 0.5) * 42, 1.9 + s * 0.9, -2 + s * 1.5 + (R() - 0.5) * 0.6); const col = new THREE.Color().setHSL(R(), 0.7, 0.5); cc.push(col.r, col.g, col.b); }
      const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3));
      stand.add(new THREE.Points(cg, new THREE.PointsMaterial({ size: 0.8, vertexColors: true, map: this.partTex, transparent: true, depthWrite: false })));
      const roof = new THREE.Mesh(new THREE.BoxGeometry(46, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0xd8dde8, metalness: 0.5, roughness: 0.4 })); roof.position.set(0, 9.5, 2.5); roof.castShadow = true; stand.add(roof);
      for (const sx of [-21, 21]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 9, 0.6), new THREE.MeshStandardMaterial({ color: 0x8a94a8 })); p.position.set(sx, 5, 7.5); stand.add(p); }
      stand.position.set(c.x + r.x * side * d, 0, c.z + r.z * side * d); stand.rotation.y = track.yawAt(i) + Math.PI / 2 * side; stand.rotation.y += Math.PI;
      g.add(stand);
    }
  }

  dispose() {
    if (!this.trackGroup) return;
    this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { const ms = [].concat(o.material); for (const m of ms) { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); } } });
    while (this.scene.children.length) this.scene.remove(this.scene.children[0]);
    this.trackGroup = null; this.smoke = this.sparks = this.dust = null;
  }
  add(obj) { this.scene.add(obj); }
  remove(obj) { this.scene.remove(obj); }

  /* collision callback used by Car */
  onCollision(car, impact, point, carOnCar) {
    if (!this.sparks) return;
    const n = Math.min(24, Math.floor(impact * 3)); const c = new THREE.Color(carOnCar ? 0xffd27a : 0xffb050);
    for (let i = 0; i < n; i++) this.sparks.emit(point, new THREE.Vector3((Math.random() - 0.5) * 9, Math.random() * 6 + 2, (Math.random() - 0.5) * 9), c, 0.3 + Math.random() * 0.4);
    if (car.isPlayer) { this.shake = Math.min(1, impact * 0.08); Audio.thud(Math.min(1.2, impact / 10)); }
  }
  onLap() {}

  effects(cars, dt) {
    if (!this.smoke) return;
    const grey = new THREE.Color(0xbfc3cc), dustC = new THREE.Color(this.track.def.theme.night ? 0x4a4a55 : 0xb49b78);
    for (const c of cars) {
      if (c.ghost) continue;
      const sp = Math.abs(c.speed);
      if (c.slip > 0.25 && sp > 4 && !c.offTrack) { const k = Math.random() < c.slip ? 2 : 1; for (let i = 0; i < k; i++) { const w = c.mesh.userData.wheels[2 + (i % 2)]; const p = new THREE.Vector3(); w.hub.getWorldPosition(p); p.y = 0.2; this.smoke.emit(p, new THREE.Vector3((Math.random() - 0.5) * 2, 1 + Math.random(), (Math.random() - 0.5) * 2), grey, 0.8 + Math.random() * 0.6); } }
      if (c.offTrack && sp > 6) { const w = c.mesh.userData.wheels[2 + Math.floor(Math.random() * 2)]; const p = new THREE.Vector3(); w.hub.getWorldPosition(p); p.y = 0.2; this.dust.emit(p, new THREE.Vector3((Math.random() - 0.5) * 3 - c.vel.x * 0.1, 1.5 + Math.random(), (Math.random() - 0.5) * 3 - c.vel.z * 0.1), dustC, 1.2); }
      if (c.boosting && Math.random() < 0.6) { const p = c.pos.clone().addScaledVector(c.forward(), -2.6); p.y = 0.35; this.sparks.emit(p, c.vel.clone().multiplyScalar(0.3).add(new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2)), new THREE.Color(0x7fe0ff), 0.25); }
    }
    this.smoke.update(dt); this.sparks.update(dt); this.dust.update(dt);
  }

  /* camera follow */
  updateCamera(car, dt, mode = this.camMode, instant = false) {
    const fwd = car.forward(); const sp = Math.abs(car.speed);
    let target, look;
    if (mode === 1) { /* bonnet */
      target = car.pos.clone().addScaledVector(fwd, 0.9); target.y += 1.15; look = car.pos.clone().addScaledVector(fwd, 30); look.y += 0.8;
      this.camPos.copy(target); this.camLook.copy(look);
    } else { /* chase */
      const dist = 7.5 + sp * 0.05, height = 2.9 + sp * 0.012;
      /* follow the velocity direction a touch so drifts read on camera */
      const velDir = sp > 3 ? car.vel.clone().normalize().lerp(fwd, 0.6).normalize() : fwd;
      target = car.pos.clone().addScaledVector(velDir, -dist); target.y = car.pos.y + height;
      look = car.pos.clone().addScaledVector(fwd, 6); look.y = car.pos.y + 1.0;
      if (instant) { this.camPos.copy(target); this.camLook.copy(look); }
      else { this.camPos.x = damp(this.camPos.x, target.x, 7, dt); this.camPos.z = damp(this.camPos.z, target.z, 7, dt); this.camPos.y = damp(this.camPos.y, target.y, 6, dt); this.camLook.lerp(look, 1 - Math.exp(-14 * dt)); }
    }
    /* shake */
    this.shake = Math.max(0, this.shake - dt * 2.5);
    const sh = this.shake * 0.35 + (car.boosting ? 0.04 : 0) + (car.offTrack && sp > 8 ? 0.05 : 0);
    const cp = this.camPos.clone(); if (sh > 0) cp.add(new THREE.Vector3((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh));
    this.camera.position.copy(cp); this.camera.lookAt(this.camLook);
    const fov = 62 + clamp(sp / 70, 0, 1) * 16 + (car.boosting ? 6 : 0);
    this.camera.fov = damp(this.camera.fov, fov, 5, dt); this.camera.updateProjectionMatrix();
    /* keep the shadow frustum + sky centred on the player */
    const sun = this.sun; if (sun) { sun.target.position.copy(car.pos); sun.position.copy(car.pos).add(new THREE.Vector3(...this.track.def.theme.sun).normalize().multiplyScalar(260)); }
    if (this.sky) this.sky.position.copy(this.camera.position);
  }
  /* slow orbit for menus */
  orbitCamera(t, center) {
    const a = t * 0.08, r = 70; this.camera.position.set(center.x + Math.cos(a) * r, 22 + Math.sin(t * 0.3) * 3, center.z + Math.sin(a) * r);
    this.camera.lookAt(center.x, 0, center.z); this.camera.fov = 55; this.camera.updateProjectionMatrix();
    if (this.sky) this.sky.position.copy(this.camera.position);
    if (this.sun) { this.sun.target.position.copy(center); this.sun.position.copy(center).add(new THREE.Vector3(...this.track.def.theme.sun).normalize().multiplyScalar(260)); }
  }
  render() { this.renderer.render(this.scene, this.camera); }
}
