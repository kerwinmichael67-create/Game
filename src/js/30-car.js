/* ========================================================================
   Cars: models, procedural meshes and the driving model.
   Conventions (y is up):
     forward = (sin yaw, 0, cos yaw)      right = forward × up = (-cos yaw, 0, sin yaw)
     steer > 0 turns RIGHT, so yaw decreases.   lateral speed vr > 0 means sliding to the right.
   ======================================================================== */
const CAR = { len: 4.4, wid: 2.0, radius: 2.3 };

/* side silhouettes run rear-bottom → over the roof → front-bottom; cabin = [deck, roof rear, roof front, cowl] indices */
const CAR_MODELS = [
  { id: 'vanta', name: 'Vanta S', price: 0, tag: 'Balanced coupé', desc: 'The all-rounder you start with. Honest grip and an easy, catchable slide.',
    mod: { top: 0, accel: 0, grip: 0 },
    body: [[-2.2, 0.34], [-2.28, 0.6], [-2.18, 0.84], [-1.5, 0.9], [-0.8, 1.22], [0.3, 1.27], [1.1, 0.9], [2.0, 0.74], [2.26, 0.58], [2.22, 0.34]], cabin: [3, 4, 5, 6], w: 1.96, wb: 1.42 },
  { id: 'kite', name: 'Kite RS', price: 3000, tag: 'Featherweight hatch', desc: 'Corners on rails and stops on a coin, but runs out of breath on long straights.',
    mod: { top: -3.5, accel: 1.2, grip: 3.2, brake: 4 },
    body: [[-1.92, 0.34], [-2.0, 0.62], [-1.97, 0.96], [-1.7, 1.34], [-0.2, 1.39], [0.74, 0.98], [1.72, 0.84], [1.98, 0.62], [1.95, 0.34]], cabin: [2, 3, 4, 5], w: 1.86, wb: 1.3 },
  { id: 'brute', name: 'Brute 427', price: 5500, tag: 'Big-block muscle', desc: 'Savage launch and a tail that steps out if you so much as look at the handbrake.',
    mod: { top: 2, accel: 3.2, grip: -2, nitroPower: 0.1, driftBonus: 0.25 },
    body: [[-2.32, 0.36], [-2.4, 0.66], [-2.32, 0.93], [-1.6, 0.97], [-1.12, 1.31], [0.0, 1.34], [0.56, 0.99], [2.18, 0.93], [2.4, 0.7], [2.36, 0.36]], cabin: [3, 4, 5, 6], w: 2.02, wb: 1.5 },
  { id: 'apex', name: 'Apex GT-X', price: 12000, tag: 'Mid-engine hypercar', desc: 'The fastest thing on any grid. Needs commitment, repays it with lap records.',
    mod: { top: 6.5, accel: 2.2, grip: 2.5, nitroCap: 1.2 },
    body: [[-2.2, 0.3], [-2.3, 0.56], [-2.24, 0.8], [-1.25, 0.88], [-0.55, 1.08], [0.45, 1.1], [1.45, 0.72], [2.2, 0.5], [2.3, 0.3]], cabin: [3, 4, 5, 6], w: 2.04, wb: 1.46 },
];
const carModel = (id) => CAR_MODELS.find(m => m.id === id) || CAR_MODELS[0];

const UPGRADES = [
  { id: 'engine', name: 'Engine', icon: '⚙️', desc: 'Raises top speed.', costs: [400, 800, 1400, 2200, 3200] },
  { id: 'turbo', name: 'Turbo', icon: '🌀', desc: 'Sharper acceleration out of corners.', costs: [350, 700, 1200, 1900, 2800] },
  { id: 'tires', name: 'Tyres', icon: '🛞', desc: 'More cornering grip and later braking.', costs: [300, 650, 1100, 1800, 2600] },
  { id: 'nitro', name: 'Nitro', icon: '🔥', desc: 'Bigger tank, harder boost, faster recharge.', costs: [450, 900, 1500, 2300, 3300] },
];
const MAX_LEVEL = 5;
const DRIFT_TIERS = [0.55, 1.3, 2.3];                  /* seconds of quality sliding for each mini-turbo tier */
const TIER_HEX = [0xffffff, 0x4fc3ff, 0xffa13a, 0xd27bff];

/* derive physics stats from upgrade levels (0..5) and the car model */
function carStats(up = {}, modelId = 'vanta') {
  const m = carModel(modelId).mod, e = up.engine || 0, t = up.turbo || 0, g = up.tires || 0, n = up.nitro || 0;
  return {
    topSpeed: 52 + e * 4.2 + m.top,                    /* m/s */
    accel: 13 + t * 2.1 + m.accel,                     /* m/s² at low speed */
    brake: 27 + g * 1.5 + (m.brake || 0),
    grip: 21 + g * 1.5 + m.grip,                       /* lateral acceleration the tyres can hold, m/s² */
    steer: 2.2 + g * 0.08,                             /* rad/s yaw rate at parking speeds */
    nitroCap: 100 * (1 + n * 0.25) * (m.nitroCap || 1),
    nitroPower: 1.55 + n * 0.09 + (m.nitroPower || 0), /* accel multiplier while boosting */
    nitroTop: 1.22 + n * 0.03,                         /* top speed multiplier while boosting */
    nitroRegen: 4 + n * 1.4,                           /* units / s */
    driftBonus: 1 + (m.driftBonus || 0),
    levels: { engine: e, turbo: t, tires: g, nitro: n }, model: carModel(modelId).id,
  };
}

const _mat = {};
function matCache(key, make) { return _mat[key] || (_mat[key] = make()); }

function polyShape(pts) { const s = new THREE.Shape(); pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]))); s.closePath(); return s; }
function extrudeAcross(shape, width, bevel, segs = 3) {
  /* bevelOffset pulls the bevel inward, so the outer surface is exactly the drawn silhouette and only the side edges round off */
  const g = new THREE.ExtrudeGeometry(shape, { depth: width - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: segs, steps: 1, curveSegments: 4 });
  g.rotateY(-Math.PI / 2); g.translate(width / 2 - bevel, 0, 0); g.computeVertexNormals(); return g;
}
/* thin panel lying on the edge a→b of the silhouette (windscreen, rear window) */
function edgePanel(a, b, inset0, inset1, lift, thick) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux; /* n points up-out of the body for a rear→front walk */
  const p0 = [a[0] + ux * L * inset0, a[1] + uy * L * inset0], p1 = [b[0] - ux * L * inset1, b[1] - uy * L * inset1];
  return polyShape([[p0[0] + nx * lift, p0[1] + ny * lift], [p1[0] + nx * lift, p1[1] + ny * lift], [p1[0] - nx * thick, p1[1] - ny * thick], [p0[0] - nx * thick, p0[1] - ny * thick]]);
}
function makeDecal(num, hex) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#f4f6fb'; x.beginPath(); x.arc(64, 64, 56, 0, TAU); x.fill(); x.lineWidth = 6; x.strokeStyle = hexCss(hex); x.stroke();
  x.fillStyle = '#10131c'; x.font = '900 70px Orbitron, Rajdhani, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(num), 64, 70);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.5, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -2 });
}
function makeGlowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 1, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}

function carGeometry(model) {
  return matCache('geo:' + model.id, () => {
    const B = model.body, [iDeck, iRoofR, iRoofF, iCowl] = model.cabin, w = model.w;
    const deck = B[iDeck], roofR = B[iRoofR], roofF = B[iRoofF], cowl = B[iCowl];
    const side = polyShape([[deck[0] + 0.3, deck[1] + 0.02], [roofR[0] + 0.1, roofR[1] - 0.13], [roofF[0] - 0.12, roofF[1] - 0.13], [cowl[0] - 0.34, cowl[1] + 0.0]]);
    const zs = B.map(p => p[0]), ys = B.map(p => p[1]);
    return {
      body: extrudeAcross(polyShape(B), w, 0.09),
      stripe: extrudeAcross(polyShape(B), 0.4, 0),
      screen: extrudeAcross(edgePanel(roofF, cowl, 0.07, 0.05, 0.012, 0.05), w - 0.3, 0),
      rear: extrudeAcross(edgePanel(deck, roofR, 0.1, 0.07, 0.012, 0.05), w - 0.34, 0),
      side: extrudeAcross(side, w + 0.014, 0),
      zf: Math.max(...zs), zr: Math.min(...zs), yb: Math.min(...ys), roofY: Math.max(...ys),
      noseY: B[B.length - 2][1], tailY: B[2][1], deckY: deck[1], deckZ: deck[0], cowlZ: cowl[0], cowlY: cowl[1],
    };
  });
}

function buildCarMesh(hex, levels = {}, opts = {}) {
  const model = carModel(opts.model), G = carGeometry(model), w = model.w;
  const g = new THREE.Group();
  /* metallic paint: reflections take the body colour, so the car stays saturated instead of washing out under a bright sky */
  const paint = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(hex).convertSRGBToLinear(), metalness: 0.5, roughness: 0.4, clearcoat: 0.3, clearcoatRoughness: 0.22, envMapIntensity: 0.7 });   /* swatch colours are sRGB; the renderer works in linear */
  const dark = matCache('dark', () => new THREE.MeshStandardMaterial({ color: 0x15171c, metalness: 0.35, roughness: 0.65 }));
  const glass = matCache('glass', () => new THREE.MeshStandardMaterial({ color: 0x0a0f16, metalness: 0.3, roughness: 0.22, envMapIntensity: 0.45, polygonOffset: true, polygonOffsetFactor: -2 }));
  const chrome = matCache('chrome', () => new THREE.MeshStandardMaterial({ color: 0xc8cedb, metalness: 1, roughness: 0.25, envMapIntensity: 0.8 }));
  const tyre = matCache('tyre', () => new THREE.MeshStandardMaterial({ color: 0x0f1012, roughness: 0.95 }));
  const headMat = matCache('head', () => new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff2c0, emissiveIntensity: 2.2 }));
  const stripeMat = matCache('stripe', () => new THREE.MeshStandardMaterial({ color: 0xf4f6fb, roughness: 0.4, metalness: 0.2, polygonOffset: true, polygonOffsetFactor: -1 }));
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x3a0606, emissive: 0xff1a1a, emissiveIntensity: 0.8 });

  const bodyM = new THREE.Mesh(G.body, paint); bodyM.castShadow = true; bodyM.receiveShadow = true; g.add(bodyM);
  /* racing stripe hugs the whole profile: a narrow slice of the same silhouette, a hair proud of the paint */
  const stripe = new THREE.Mesh(G.stripe, stripeMat); stripe.scale.set(1, 1.006, 1.002); g.add(stripe);
  for (const geo of [G.screen, G.rear, G.side]) { const m = new THREE.Mesh(geo, glass); g.add(m); }
  /* lower body, splitter, diffuser */
  const len = G.zf - G.zr, mid = (G.zf + G.zr) / 2;
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, 0.2, len - 0.24), dark); skirt.position.set(0, G.yb - 0.04, mid); skirt.castShadow = true; g.add(skirt);
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.5), dark); splitter.position.set(0, G.yb - 0.12, G.zf - 0.12); g.add(splitter);
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(w - 0.16, 0.14, 0.4), dark); diffuser.position.set(0, G.yb - 0.06, G.zr + 0.14); g.add(diffuser);
  /* door number */
  const decal = makeDecal(opts.number ?? ((hex >> 4) % 89 + 7), hex);
  for (const sx of [-1, 1]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.58), decal); d.position.set(sx * (w / 2 + 0.006), G.yb + 0.34, mid + 0.1); d.rotation.y = sx * Math.PI / 2; g.add(d); }
  /* mirrors */
  for (const sx of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.22), paint); m.position.set(sx * (w / 2 + 0.08), G.cowlY + 0.08, G.cowlZ - 0.15); g.add(m); const st = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.06), dark); st.position.set(sx * (w / 2), G.cowlY + 0.05, G.cowlZ - 0.15); g.add(st); }
  /* rear wing grows with engine + turbo upgrades; the hypercar always wears one */
  const sl = Math.min(3, Math.ceil(((levels.engine || 0) + (levels.turbo || 0)) / 3) + (model.id === 'apex' ? 1 : 0));
  if (sl > 0 && model.id !== 'kite') {
    const wz = G.zr + 0.3, wy = G.deckY + 0.1 + sl * 0.09;
    const wing = new THREE.Mesh(new THREE.BoxGeometry(w - 0.26 + sl * 0.1, 0.05, 0.42), dark); wing.position.set(0, wy, wz); wing.rotation.x = -0.12; wing.castShadow = true; g.add(wing);
    for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, wy - G.deckY + 0.04, 0.3), paint); p.position.set(sx * (w / 2 - 0.3), (wy + G.deckY) / 2, wz); g.add(p); }
  } else if (sl > 0) { /* hatch gets a roof spoiler instead */
    const lip = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, 0.05, 0.3 + sl * 0.08), dark); lip.position.set(0, G.roofY - 0.03, model.body[model.cabin[1]][0] - 0.12); lip.rotation.x = -0.1; g.add(lip);
  }
  /* lights */
  for (const sx of [-1, 1]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.1), headMat); h.position.set(sx * (w / 2 - 0.38), G.noseY + 0.04, G.zf - 0.04); h.rotation.x = 0.4; g.add(h); }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(w - 0.46, 0.07, 0.05), tailMat); tail.position.set(0, G.tailY - 0.08, G.zr - 0.01); g.add(tail);
  if (opts.night) {
    const glowMat = matCache('glow', () => new THREE.SpriteMaterial({ map: makeGlowTex(), color: 0xfff1c8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 }));
    for (const sx of [-1, 1]) { const sp = new THREE.Sprite(glowMat); sp.scale.set(1.3, 1.3, 1); sp.position.set(sx * (w / 2 - 0.38), G.noseY + 0.04, G.zf + 0.08); g.add(sp); }
  }
  /* exhausts + boost flames (own material so each car can tint its flame) */
  const flameMat = new THREE.MeshBasicMaterial({ color: 0x66d9ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const flames = [];
  for (const sx of [-0.4, 0.4]) {
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.3, 10), chrome); ex.rotation.x = Math.PI / 2; ex.position.set(sx, G.yb - 0.04, G.zr - 0.02); g.add(ex);
    const fl = new THREE.Mesh(matCache('flameGeo', () => new THREE.ConeGeometry(0.12, 1.3, 8)), flameMat); fl.rotation.x = Math.PI / 2; fl.position.set(sx, G.yb - 0.04, G.zr - 0.68); fl.visible = false; g.add(fl); flames.push(fl);
  }
  /* wheels */
  const wheelGeo = matCache('wheelGeo', () => { const geo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 24); geo.rotateZ(Math.PI / 2); return geo; });
  const rimGeo = matCache('rimGeo', () => { const geo = new THREE.CylinderGeometry(0.25, 0.25, 0.31, 10); geo.rotateZ(Math.PI / 2); return geo; });
  const hubGeo = matCache('hubGeo', () => { const geo = new THREE.CylinderGeometry(0.1, 0.1, 0.33, 8); geo.rotateZ(Math.PI / 2); return geo; });
  const archGeo = matCache('archGeo', () => { const geo = new THREE.CylinderGeometry(0.47, 0.47, 0.18, 20); geo.rotateZ(Math.PI / 2); return geo; });
  const wheels = [], wx = w / 2 - 0.04;
  [[-wx, model.wb], [wx, model.wb], [-wx, -model.wb], [wx, -model.wb]].forEach(([x, z], i) => {
    const arch = new THREE.Mesh(archGeo, dark); arch.position.set(x * 0.98, 0.42, z); g.add(arch);
    const hub = new THREE.Group(); hub.position.set(x, 0.36, z);
    const wm = new THREE.Mesh(wheelGeo, tyre); wm.castShadow = true; hub.add(wm);
    const r = new THREE.Mesh(rimGeo, chrome); hub.add(r); hub.add(new THREE.Mesh(hubGeo, dark));
    g.add(hub); wheels.push({ hub, spin: wm, rim: r, front: i < 2 });
  });
  /* soft contact shadow */
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.8, len + 0.7), matCache('blob', () => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }); }));
  blob.rotation.x = -Math.PI / 2; blob.position.set(0, 0.03, mid); g.add(blob);

  g.userData = { paint, tailMat, wheels, flames, flameMat, body: bodyM, rearZ: G.zr };
  if (opts.ghost) { g.traverse(o => { if (o.isMesh || o.isSprite) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.3; o.material.depthWrite = false; o.castShadow = false; } }); blob.visible = false; }
  return g;
}

/* name tag sprite for other racers */
function makeLabel(text, hex) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  x.fillStyle = 'rgba(8,10,18,.72)'; x.beginPath(); x.roundRect ? x.roundRect(8, 8, 240, 48, 12) : x.rect(8, 8, 240, 48); x.fill();
  x.fillStyle = hexCss(hex); x.beginPath(); x.arc(32, 32, 10, 0, TAU); x.fill();
  x.fillStyle = '#eef3ff'; x.font = '700 26px Rajdhani, Segoe UI, sans-serif'; x.textBaseline = 'middle'; x.fillText(String(text).slice(0, 14), 52, 33);
  const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })); sp.scale.set(4, 1, 1); sp.position.y = 2.3; sp.renderOrder = 5;
  return sp;
}

class Car {
  constructor(opts) {
    this.id = opts.id; this.name = opts.name || 'Racer'; this.hex = opts.hex; this.paintId = opts.paintId || null; this.isPlayer = !!opts.isPlayer; this.remote = !!opts.remote; this.ghost = !!opts.ghost;
    this.model = carModel(opts.model).id;
    this.stats = opts.stats || carStats(opts.levels || {}, this.model);
    this.mesh = buildCarMesh(this.hex, this.stats.levels, { ghost: this.ghost, night: !!opts.night, number: opts.number, model: this.model });
    if (opts.label) this.mesh.add(makeLabel(opts.label, this.hex));
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.yaw = 0; this.roll = 0; this.pitch = 0;
    this.input = { throttle: 0, brake: 0, steer: 0, nitro: false, handbrake: false };
    this.digital = false;                 /* true while a keyboard/touch player is steering: inputs get eased */
    this.ai = null; this.hold = false; this.clock = 0;
    this.resetState();
  }
  resetState() {
    this.speed = 0; this.spd = 0; this.steer = 0; this.steerVis = 0; this.wheelSpin = 0; this.slip = 0; this.nitro = this.stats.nitroCap; this.boosting = false;
    this.trackIdx = 0; this.lat = 0; this.progress = 0; this.lap = 0; this.lapStart = 0; this.lapTimes = []; this.bestLap = null; this.finished = false; this.finishTime = null;
    this.sectorsHit = [false, false]; this.offTrack = false; this.offT = 0; this.wrongWay = 0; this.lastCollide = 0; this.totalProgress = 0; this.stuck = 0; this.lightsBrake = false;
    this.drifting = false; this.driftDir = 0; this.driftT = 0; this.driftCharge = 0; this.driftTier = 0; this.driftPts = 0; this.driftAngle = 0; this.kickT = 0;
    this.driftScore = 0; this.driftChain = 0; this.driftEndAt = -10; this.driftBest = 0;
    this.turboT = 0; this.turboPow = 0; this.turboTier = 0; this.padT = 0; this.padCool = 0; this.draft = 0; this.topSeen = 0;
  }
  place(pose, idx) {
    this.resetState(); this.pos.copy(pose.pos); this.yaw = pose.yaw; this.vel.set(0, 0, 0); this.trackIdx = idx; this.roll = 0; this.pitch = 0;
    this.syncMesh(0);
  }
  /* put the car back on the racing surface, pointing the right way */
  recover(track) {
    const i = this.trackIdx; this.pos.copy(track.point(i, 0)); this.yaw = track.yawAt(i); this.vel.set(0, 0, 0); this.speed = 0; this.steer = 0; this.stuck = 0; this.wrongWay = 0;
    this.endDrift(null, false); this.turboT = 0; this.padT = 0; this.lat = 0; this.offTrack = false;
  }
  forward() { return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  rightVec() { return new THREE.Vector3(-Math.cos(this.yaw), 0, Math.sin(this.yaw)); }

  endDrift(world, clean) {
    if (!this.drifting) return;
    const tier = clean ? this.driftTier : 0; let banked = 0;
    if (clean && this.driftPts > 20) {
      banked = Math.round(this.driftPts * [1, 1.1, 1.25, 1.5][tier]); this.driftScore += banked; this.driftBest = Math.max(this.driftBest, banked);
      this.driftEndAt = this.clock;
    } else this.driftChain = 0;
    if (tier > 0) { this.turboT = [0.75, 1.2, 1.8][tier - 1]; this.turboPow = [0.7, 0.9, 1.15][tier - 1]; this.turboTier = tier; this.nitro = Math.min(this.stats.nitroCap, this.nitro + [8, 16, 26][tier - 1]); }
    this.drifting = false; this.driftAngle = 0; this.kickT = 0;
    if (world) world.onDrift(this, clean ? 'end' : 'fail', { tier, banked });
    this.driftPts = 0; this.driftCharge = 0; this.driftTier = 0;
  }

  /* ---- fixed-step physics ---- */
  step(dt, track, world) {
    const s = this.stats, inp = this.input; this.clock += dt;
    /* keyboard and touch are on/off, so ease the wheel toward the input; centring is faster than turning in */
    const sr = this.digital ? ((inp.steer === 0 || inp.steer * this.steer < 0) ? 11 : 6.5) : 18;
    this.steer += clamp(inp.steer - this.steer, -sr * dt, sr * dt);
    if (this.hold) { this.vel.set(0, 0, 0); this.speed = 0; this.boosting = false; this.lightsBrake = true; this.steerVis = damp(this.steerVis, this.steer * 0.5, 12, dt); return; }
    const fwd = this.forward(), right = this.rightVec();
    let vf = this.vel.dot(fwd), vr = this.vel.dot(right);
    const absV = Math.abs(vf), spd = Math.hypot(vf, vr), surf = this.offTrack ? 0.5 : 1;

    /* ---- boost sources: nitro, drift mini-turbo, boost pads, slipstream ---- */
    this.boosting = inp.nitro && this.nitro > 0 && vf > 2 && !this.finished;
    if (this.boosting) this.nitro = Math.max(0, this.nitro - 34 * dt);
    else this.nitro = Math.min(s.nitroCap, this.nitro + s.nitroRegen * dt * (this.drifting ? 2.5 : 1));
    this.turboT = Math.max(0, this.turboT - dt); this.padT = Math.max(0, this.padT - dt); this.padCool = Math.max(0, this.padCool - dt);
    const turbo = this.turboT > 0 ? this.turboPow : 0, pad = this.padT > 0 ? 1 : 0;
    const top = s.topSpeed * (1 + (this.boosting ? s.nitroTop - 1 : 0) + turbo * 0.1 + pad * 0.14 + this.draft * 0.05) * (this.offTrack ? 0.55 : 1);
    const accMul = (1 + (this.boosting ? s.nitroPower - 1 : 0) + turbo * 0.7 + pad * 0.9 + this.draft * 0.25) * surf;

    /* ---- longitudinal ---- */
    let acc = 0;
    if (inp.throttle > 0) {
      const headroom = clamp(1 - vf / top, 0, 1);
      acc += inp.throttle * (vf < -0.5 ? s.brake * 0.6 : s.accel * (0.35 + 0.65 * Math.pow(headroom, 0.8)) * accMul);
      if (vf > top) acc -= (vf - top) * 1.5;
    }
    if (inp.brake > 0) {
      if (vf > 0.5) acc -= inp.brake * s.brake * surf;
      else acc -= inp.brake * s.accel * 0.6;           /* reverse */
      if (vf < -top * 0.3) acc = Math.max(acc, 0);
    }
    if (inp.handbrake && vf > 1) acc -= 7;
    acc -= vf * 0.0012 * absV + sign(vf) * (1.2 + (this.offTrack ? Math.min(3, absV * 0.15) : 0));   /* drag + rolling resistance; grass drags harder the faster you go */

    /* ---- enter a drift: handbrake while steering, or the tail has already stepped out ---- */
    if (!this.drifting && vf > 11) {
      const pull = inp.handbrake && Math.abs(this.steer) > 0.25 && !this.offTrack;
      const beta = Math.atan2(vr, absV);
      if (pull || Math.abs(beta) > 0.24) {
        this.drifting = true; this.driftT = 0; this.driftCharge = 0; this.driftTier = 0; this.driftPts = 0;
        this.driftDir = pull ? sign(this.steer) : -sign(beta); this.kickT = pull ? 0.24 : 0;
        this.driftChain = this.clock - this.driftEndAt < 2.5 ? Math.min(this.driftChain + 1, 4) : 0;
        if (world) world.onDrift(this, 'start', {});
      }
    }

    if (!this.drifting) {
      /* ---- grip driving: tyres hold up to s.grip of lateral acceleration, steering never asks for more on tarmac ---- */
      if (inp.throttle === 0 && inp.brake === 0 && absV < 0.8 && Math.abs(vr) < 0.8) vf = 0; else vf += acc * dt;
      const aLat = s.grip * surf * (inp.handbrake ? 0.6 : 1);
      vr += clamp(-vr, -aLat * dt, aLat * dt);
      this.slip = clamp(Math.abs(vr) / 6, 0, 1);
      this.vel.set(fwd.x * vf + right.x * vr, 0, fwd.z * vf + right.z * vr);
      const wMax = Math.min(s.steer * Math.min(1, absV / 6), s.grip / Math.max(absV, 1));
      this.yaw += -this.steer * wMax * (vf < -0.5 ? -0.8 : 1) * dt;
      this.driftAngle = 0;
    } else {
      /* ---- drift: the nose points N radians inside the direction of travel (N > 0 = nose to the right).
              Tyres bend the path toward the nose, steering trims the angle, and it relaxes on its own. ---- */
      this.driftT += dt;
      let sp = this.vel.length(); const th = Math.atan2(this.vel.x, this.vel.z);
      const N = wrapAngle(th - this.yaw), aN = Math.abs(N), sN = Math.sin(Math.min(aN, 1.4)), cN = Math.cos(N);
      const aT = acc * cN - (3 + s.grip * 0.16) * sN - 7 * sN * sN;                  /* sliding scrubs speed, steeply at big angles */
      /* cornering force grows with the angle, so steering deeper into the slide tightens the line and easing off lets it run wide */
      const aC = s.grip * 1.15 * surf * (inp.handbrake ? 0.55 : 1) * clamp(aN / 0.5, 0, 1) + Math.max(acc, 0) * sN;
      sp = Math.max(0, sp + aT * dt);
      const dTh = -sign(N) * Math.min(aC / Math.max(sp, 6) * dt, aN);
      const th2 = th + dTh; this.vel.set(Math.sin(th2) * sp, 0, Math.cos(th2) * sp);
      let dN = this.steer * 0.95 * dt - sign(N) * (0.1 + Math.abs(dTh) / dt * 0.3) * dt;   /* steer in to add angle; it bleeds off otherwise */
      if (this.kickT > 0) { this.kickT -= dt; dN += this.driftDir * 1.7 * dt; }
      if (aN > 0.5 && dN * N > 0) dN *= clamp(1 - (aN - 0.5) / 0.38, 0, 1);             /* the angle tops out near 45°: no spins */
      this.yaw += dTh - dN;
      this.driftAngle = N + dN; if (Math.abs(this.driftAngle) > 0.1) this.driftDir = sign(this.driftAngle);
      this.slip = clamp(Math.abs(this.driftAngle) / 0.45, 0.25, 1);
      const f2 = this.forward(), r2 = this.rightVec(); vf = this.vel.dot(f2); vr = this.vel.dot(r2);
      /* charge + score only for real slides on tarmac */
      const a2 = Math.abs(this.driftAngle);
      if (!this.offTrack && a2 > 0.16 && sp > 12) {
        this.driftCharge += dt * clamp(a2 / 0.45, 0.5, 1.3) * clamp(sp / 30, 0.6, 1.25) * s.driftBonus;
        this.driftPts += sp * a2 * dt * 9 * (1 + 0.5 * this.driftChain) * s.driftBonus;
        const tier = this.driftCharge >= DRIFT_TIERS[2] ? 3 : this.driftCharge >= DRIFT_TIERS[1] ? 2 : this.driftCharge >= DRIFT_TIERS[0] ? 1 : 0;
        if (tier > this.driftTier) { this.driftTier = tier; if (world) world.onDrift(this, 'tier', { tier }); }
      }
      if (this.offT > 0.5) { this.driftPts = 0; this.driftCharge = 0; this.driftTier = 0; }
      if (sp < 7) this.endDrift(world, false);
      else if (a2 < 0.06 && this.driftT > 0.32 && this.kickT <= 0) this.endDrift(world, true);
    }
    this.pos.addScaledVector(this.vel, dt);
    this.speed = vf; this.spd = Math.hypot(vf, vr); if (vf > this.topSeen) this.topSeen = vf;

    /* ---- track relation ---- */
    this.trackIdx = track.nearest(this.pos.x, this.pos.z, this.trackIdx);
    this.lat = track.lateral(this.pos.x, this.pos.z, this.trackIdx);
    this.offTrack = Math.abs(this.lat) > track.halfWidth + 0.3; this.offT = this.offTrack ? this.offT + dt : 0;
    const wall = track.halfWidth + track.wallOffset - CAR.wid * 0.45;
    if (Math.abs(this.lat) > wall) {
      /* barrier hit: clamp to the wall, reflect the velocity into it, scrub speed */
      const n = track.right[this.trackIdx].clone().multiplyScalar(-sign(this.lat)); /* normal pointing back to the road */
      this.pos.addScaledVector(n, Math.abs(this.lat) - wall + 0.02);
      /* scraping a barrier eases the nose back along the track so the car slides free instead of pinning itself */
      const along = track.yawAt(this.trackIdx) + (this.vel.dot(track.tangent[this.trackIdx]) < -2 ? Math.PI : 0);
      this.yaw += wrapAngle(along - this.yaw) * Math.min(1, 2.2 * dt);
      const vn = this.vel.dot(n);
      if (vn < 0) {
        const impact = -vn;
        this.vel.addScaledVector(n, -vn * 1.5);
        this.vel.multiplyScalar(clamp(1 - impact * 0.03, 0.55, 0.96));
        const nowT = performance.now();
        if (impact > 2.5 && nowT - this.lastCollide > 120) { this.lastCollide = nowT; world && world.onCollision(this, impact, this.pos.clone().addScaledVector(n, -1.2)); }
        const ty = track.yawAt(this.trackIdx); this.yaw += wrapAngle(ty - this.yaw) * clamp(impact * 0.02, 0, 0.35);
        if (impact > 2 && this.drifting) this.endDrift(world, false);
      }
      this.speed = this.vel.dot(this.forward()); this.spd = this.vel.length();
    }
    /* boost pads */
    if (this.padCool <= 0 && vf > 5 && track.padAt(this.trackIdx, this.lat)) { this.padT = 1.4; this.padCool = 1.2; world && world.onPad(this); }
    /* height & attitude: follow the banking, lean out of corners, squat and dive */
    const bank = track.bank[this.trackIdx];
    this.pos.y = track.heightAt(this.trackIdx, clamp(this.lat, -track.halfWidth - 2, track.halfWidth + 2));
    const lean = -this.steer * 0.035 * Math.min(1, absV / 20) - this.driftAngle * 0.09;
    this.roll = damp(this.roll, -bank * Math.cos(wrapAngle(this.yaw - track.yawAt(this.trackIdx))) + lean, 10, dt);
    this.pitch = damp(this.pitch, clamp(-acc * 0.004, -0.06, 0.06), 8, dt);

    /* ---- progress + laps ---- */
    const prevP = this.progress;
    this.progress = track.progress(this.pos.x, this.pos.z, this.trackIdx);
    const dp = this.progress - prevP;
    const fwdOnTrack = this.vel.dot(track.tangent[this.trackIdx]);
    this.wrongWay = fwdOnTrack < -3 ? Math.min(this.wrongWay + dt, 3) : Math.max(this.wrongWay - dt * 2, 0);
    if (this.trackIdx >= track.sectors[0] && this.trackIdx < track.sectors[0] + 40) this.sectorsHit[0] = true;
    if (this.trackIdx >= track.sectors[1] && this.trackIdx < track.sectors[1] + 40 && this.sectorsHit[0]) this.sectorsHit[1] = true;
    if (dp < -0.5 && fwdOnTrack > 0) {
      if (this.sectorsHit[0] && this.sectorsHit[1]) { this.lap++; world && world.onLap(this); }
      this.sectorsHit = [false, false];
    } else if (dp > 0.5) {
      if (this.lap > 0 && fwdOnTrack < 0) { this.lap--; this.sectorsHit = [true, true]; }
    }
    this.totalProgress = this.lap + this.progress;
    this.stuck = Math.abs(this.speed) < 1.5 && inp.throttle > 0.5 ? this.stuck + dt : 0;

    /* visuals */
    this.steerVis = damp(this.steerVis, this.steer * 0.5 - this.driftAngle * 0.5, 12, dt);
    this.wheelSpin += vf * dt / 0.36;
    this.lightsBrake = (inp.brake > 0 || inp.handbrake) && vf > 1;
  }

  syncMesh(dt) {
    const m = this.mesh; m.position.copy(this.pos); m.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');
    const u = m.userData;
    /* +rotation.y swings a wheel to the car's left, so steering right is negative */
    for (const w of u.wheels) { w.hub.rotation.y = w.front ? -clamp(this.steerVis, -0.6, 0.6) : 0; w.spin.rotation.x = this.wheelSpin; w.rim.rotation.x = this.wheelSpin; }
    u.tailMat.emissiveIntensity = this.lightsBrake ? 3.2 : 0.8;
    const fire = this.boosting || this.turboT > 0 || this.padT > 0;
    if (fire) u.flameMat.color.setHex(this.boosting ? 0x66d9ff : this.padT > 0 ? 0xffd166 : TIER_HEX[this.turboTier] || 0xffa13a);
    for (const f of u.flames) { f.visible = fire; if (fire) { const k = 0.7 + Math.random() * 0.6; f.scale.set(k, k, 1 + Math.random() * 0.5); } }
  }

  /* circle collision against another car; both get pushed, momentum partially exchanged */
  collide(other, world) {
    const dx = other.pos.x - this.pos.x, dz = other.pos.z - this.pos.z; const d2 = dx * dx + dz * dz; const r = CAR.radius;
    if (d2 > r * r || d2 < 1e-6) return;
    const d = Math.sqrt(d2), nx = dx / d, nz = dz / d, over = r - d;
    const wThis = other.remote ? 1 : 0.5, wOther = other.remote ? 0 : 0.5;
    this.pos.x -= nx * over * wThis; this.pos.z -= nz * over * wThis;
    other.pos.x += nx * over * wOther; other.pos.z += nz * over * wOther;
    const rvx = this.vel.x - other.vel.x, rvz = this.vel.z - other.vel.z; const rel = rvx * nx + rvz * nz;
    if (rel > 0) {
      const j = rel * 0.8;
      this.vel.x -= nx * j * (other.remote ? 1 : 0.5); this.vel.z -= nz * j * (other.remote ? 1 : 0.5);
      if (!other.remote) { other.vel.x += nx * j * 0.5; other.vel.z += nz * j * 0.5; }
      const nowT = performance.now();
      if (rel > 3 && nowT - this.lastCollide > 150) { this.lastCollide = nowT; world && world.onCollision(this, rel, new THREE.Vector3(this.pos.x + nx * 1.1, 0.5, this.pos.z + nz * 1.1), true); }
    }
  }
}
