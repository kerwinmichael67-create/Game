/* ========================================================================
   Car: procedural low-poly model + arcade physics
   ======================================================================== */
const CAR = { len: 4.4, wid: 2.0, radius: 2.3 };

const UPGRADES = [
  { id: 'engine', name: 'Engine', icon: '⚙️', desc: 'Raises top speed.', costs: [400, 800, 1400, 2200, 3200] },
  { id: 'turbo', name: 'Turbo', icon: '🌀', desc: 'Sharper acceleration out of corners.', costs: [350, 700, 1200, 1900, 2800] },
  { id: 'tires', name: 'Tyres', icon: '🛞', desc: 'More grip, less sliding, later braking.', costs: [300, 650, 1100, 1800, 2600] },
  { id: 'nitro', name: 'Nitro', icon: '🔥', desc: 'Bigger tank, harder boost, faster recharge.', costs: [450, 900, 1500, 2300, 3300] },
];
const MAX_LEVEL = 5;

/* derive physics stats from upgrade levels (0..5) */
function carStats(up = {}) {
  const e = up.engine || 0, t = up.turbo || 0, g = up.tires || 0, n = up.nitro || 0;
  return {
    topSpeed: 52 + e * 4.2,             /* m/s  (≈187 → 263 km/h displayed ×1.0) */
    accel: 13 + t * 2.1,                /* m/s² at low speed */
    brake: 26 + g * 1.5,
    grip: 4.2 + g * 0.85,               /* lateral velocity damping rate */
    steer: 2.1 + g * 0.12,              /* rad/s peak yaw rate */
    nitroCap: 100 * (1 + n * 0.25),
    nitroPower: 1.55 + n * 0.09,        /* accel multiplier while boosting */
    nitroTop: 1.22 + n * 0.03,          /* top speed multiplier while boosting */
    nitroRegen: 4 + n * 1.4,            /* units / s */
    levels: { engine: e, turbo: t, tires: g, nitro: n },
  };
}

const _mat = {};
function matCache(key, make) { return _mat[key] || (_mat[key] = make()); }

/* side silhouette of the car (z forward, y up); extruded across the width with a bevel for soft edges */
function carBodyShape() {
  const s = new THREE.Shape();
  s.moveTo(-2.2, 0.34); s.lineTo(-2.28, 0.6); s.lineTo(-2.18, 0.84); s.lineTo(-1.5, 0.9); s.lineTo(-0.8, 1.22); s.lineTo(0.3, 1.27);
  s.lineTo(1.1, 0.9); s.lineTo(2.0, 0.74); s.lineTo(2.26, 0.58); s.lineTo(2.22, 0.34); s.closePath(); return s;
}
function carGlassShape() {
  const s = new THREE.Shape();
  s.moveTo(-1.55, 0.86); s.lineTo(-0.82, 1.225); s.lineTo(0.3, 1.275); s.lineTo(1.16, 0.885); s.lineTo(1.16, 0.84); s.lineTo(-1.55, 0.84); s.closePath(); return s;
}
function extrudeAcross(shape, width, bevel, segs = 3) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: width - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: segs, steps: 1, curveSegments: 4 });
  g.rotateY(-Math.PI / 2); g.translate(width / 2 - bevel, 0, 0); g.computeVertexNormals(); return g;
}
function makeDecal(num, hex) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#f4f6fb'; x.beginPath(); x.arc(64, 64, 56, 0, TAU); x.fill(); x.lineWidth = 6; x.strokeStyle = '#' + hex.toString(16).padStart(6, '0'); x.stroke();
  x.fillStyle = '#10131c'; x.font = '900 70px Orbitron, Rajdhani, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(num), 64, 70);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.5, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -2 });
}

function buildCarMesh(hex, levels = {}, opts = {}) {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color: hex, metalness: 0.25, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.14, envMapIntensity: 0.5 });
  const dark = matCache('dark', () => new THREE.MeshStandardMaterial({ color: 0x15171c, metalness: 0.35, roughness: 0.65 }));
  const glass = matCache('glass', () => new THREE.MeshPhysicalMaterial({ color: 0x0a141f, metalness: 0.9, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.9 }));
  const chrome = matCache('chrome', () => new THREE.MeshStandardMaterial({ color: 0xc8cedb, metalness: 1, roughness: 0.25, envMapIntensity: 0.8 }));
  const tyre = matCache('tyre', () => new THREE.MeshStandardMaterial({ color: 0x0f1012, roughness: 0.95 }));
  const headMat = matCache('head', () => new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff2c0, emissiveIntensity: 2.2 }));
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x3a0606, emissive: 0xff1a1a, emissiveIntensity: 0.8 });

  const bodyGeo = matCache('bodyGeo', () => extrudeAcross(carBodyShape(), 1.96, 0.1));
  const bodyM = new THREE.Mesh(bodyGeo, paint); bodyM.castShadow = true; bodyM.receiveShadow = true; g.add(bodyM);
  const glassGeo = matCache('glassGeo', () => extrudeAcross(carGlassShape(), 1.78, 0.06, 2));
  const glassM = new THREE.Mesh(glassGeo, glass); glassM.scale.set(1.025, 1.02, 1.012); glassM.position.y = -0.012; glassM.castShadow = true; g.add(glassM);
  /* lower body + splitter + diffuser */
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.2, 4.3), dark); skirt.position.y = 0.3; skirt.castShadow = true; g.add(skirt);
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.05, 0.5), dark); splitter.position.set(0, 0.22, 2.15); g.add(splitter);
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.4), dark); diffuser.position.set(0, 0.28, -2.15); g.add(diffuser);
  /* wheel arches */
  const archGeo = matCache('archGeo', () => { const geo = new THREE.CylinderGeometry(0.47, 0.47, 0.18, 20); geo.rotateZ(Math.PI / 2); return geo; });
  /* roof stripe + door decal */
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.015, 4.3), matCache('stripe', () => new THREE.MeshStandardMaterial({ color: 0xf4f6fb, roughness: 0.4, metalness: 0.2 })));
  stripe.position.set(0, 0.95, 0.05); g.add(stripe);
  const num = opts.number ?? ((hex >> 4) % 89 + 7);
  const decal = makeDecal(num, hex);
  for (const sx of [-1, 1]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), decal); d.position.set(sx * 0.985, 0.68, 0.15); d.rotation.y = sx * Math.PI / 2; g.add(d); }
  /* mirrors */
  for (const sx of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.22), paint); m.position.set(sx * 1.06, 0.98, 0.95); g.add(m); const st = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.06), dark); st.position.set(sx * 0.98, 0.95, 0.95); g.add(st); }
  /* spoiler grows with upgrades */
  const sl = Math.min(3, Math.ceil(((levels.engine || 0) + (levels.turbo || 0)) / 3));
  if (sl > 0) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(1.7 + sl * 0.1, 0.05, 0.42), dark); w.position.set(0, 0.98 + sl * 0.09, -2.0); w.rotation.x = -0.12; w.castShadow = true; g.add(w);
    for (const sx of [-0.68, 0.68]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14 + sl * 0.09, 0.3), paint); p.position.set(sx, 0.9 + (sl * 0.09) / 2, -2.0); g.add(p); }
  }
  /* lights */
  for (const sx of [-0.6, 0.6]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.1), headMat); h.position.set(sx, 0.62, 2.24); h.rotation.x = 0.4; g.add(h);
  }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.05), tailMat); tail.position.set(0, 0.76, -2.3); g.add(tail);
  const glows = [];
  if (opts.night) {
    const glowMat = matCache('glow', () => new THREE.SpriteMaterial({ map: makeGlowTex(), color: 0xfff1c8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 }));
    for (const sx of [-0.6, 0.6]) { const sp = new THREE.Sprite(glowMat); sp.scale.set(1.3, 1.3, 1); sp.position.set(sx, 0.62, 2.35); g.add(sp); glows.push(sp); }
  }
  /* exhausts + nitro flames */
  const flames = [];
  for (const sx of [-0.4, 0.4]) {
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.3, 10), chrome); ex.rotation.x = Math.PI / 2; ex.position.set(sx, 0.3, -2.3); g.add(ex);
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.3, 8), matCache('flame', () => new THREE.MeshBasicMaterial({ color: 0x66d9ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })));
    fl.rotation.x = Math.PI / 2; fl.position.set(sx, 0.3, -2.95); fl.visible = false; g.add(fl); flames.push(fl);
  }
  /* wheels */
  const wheelGeo = matCache('wheelGeo', () => { const geo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 24); geo.rotateZ(Math.PI / 2); return geo; });
  const rimGeo = matCache('rimGeo', () => { const geo = new THREE.CylinderGeometry(0.25, 0.25, 0.31, 10); geo.rotateZ(Math.PI / 2); return geo; });
  const hubGeo = matCache('hubGeo', () => { const geo = new THREE.CylinderGeometry(0.1, 0.1, 0.33, 8); geo.rotateZ(Math.PI / 2); return geo; });
  const wheels = [];
  const wp = [[-0.94, 1.42], [0.94, 1.42], [-0.94, -1.42], [0.94, -1.42]];
  wp.forEach(([x, z], i) => {
    const arch = new THREE.Mesh(archGeo, dark); arch.position.set(x * 0.98, 0.42, z); g.add(arch);
    const hub = new THREE.Group(); hub.position.set(x, 0.36, z);
    const w = new THREE.Mesh(wheelGeo, tyre); w.castShadow = true; hub.add(w);
    const r = new THREE.Mesh(rimGeo, chrome); hub.add(r);
    const hb = new THREE.Mesh(hubGeo, dark); hub.add(hb);
    g.add(hub); wheels.push({ hub, spin: w, rim: r, front: i < 2 });
  });
  /* soft contact shadow */
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 5.2), matCache('blob', () => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }); }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.03; g.add(blob);

  g.userData = { paint, tailMat, wheels, flames, body: bodyM, glows };
  if (opts.ghost) { g.traverse(o => { if (o.isMesh || o.isSprite) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.3; o.material.depthWrite = false; o.castShadow = false; } }); blob.visible = false; }
  return g;
}
function makeGlowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 1, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}

/* name tag sprite for other racers */
function makeLabel(text, hex) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  x.fillStyle = 'rgba(8,10,18,.72)'; x.beginPath(); x.roundRect ? x.roundRect(8, 8, 240, 48, 12) : x.rect(8, 8, 240, 48); x.fill();
  x.fillStyle = '#' + hex.toString(16).padStart(6, '0'); x.beginPath(); x.arc(32, 32, 10, 0, TAU); x.fill();
  x.fillStyle = '#eef3ff'; x.font = '700 26px Rajdhani, Segoe UI, sans-serif'; x.textBaseline = 'middle'; x.fillText(String(text).slice(0, 14), 52, 33);
  const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })); sp.scale.set(4, 1, 1); sp.position.y = 2.3; sp.renderOrder = 5;
  return sp;
}

class Car {
  constructor(opts) {
    this.id = opts.id; this.name = opts.name || 'Racer'; this.hex = opts.hex; this.isPlayer = !!opts.isPlayer; this.remote = !!opts.remote; this.ghost = !!opts.ghost;
    this.stats = opts.stats || carStats(opts.levels || {});
    this.mesh = buildCarMesh(this.hex, this.stats.levels, { ghost: this.ghost, night: !!opts.night, number: opts.number });
    if (opts.label) this.mesh.add(makeLabel(opts.label, this.hex));
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.yaw = 0; this.roll = 0; this.pitch = 0;
    this.speed = 0; this.steerVis = 0; this.wheelSpin = 0; this.slip = 0; this.nitro = this.stats.nitroCap; this.boosting = false;
    this.input = { throttle: 0, brake: 0, steer: 0, nitro: false, handbrake: false };
    this.trackIdx = 0; this.lat = 0; this.progress = 0; this.lap = 0; this.lapStart = 0; this.lapTimes = []; this.bestLap = null; this.finished = false; this.finishTime = null;
    this.sectorsHit = [false, false]; this.offTrack = false; this.wrongWay = 0; this.lastCollide = 0; this.totalProgress = 0; this.stuck = 0;
    this.ai = null; this.lightsBrake = false; this.hold = false;
  }
  place(pose, idx) {
    this.pos.copy(pose.pos); this.yaw = pose.yaw; this.vel.set(0, 0, 0); this.speed = 0; this.trackIdx = idx; this.progress = 0; this.lap = 0; this.lapTimes = []; this.bestLap = null;
    this.finished = false; this.finishTime = null; this.sectorsHit = [false, false]; this.nitro = this.stats.nitroCap; this.boosting = false; this.totalProgress = 0; this.stuck = 0;
    this.syncMesh(0);
  }
  forward() { return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  rightVec() { return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)); }

  /* ---- fixed-step physics ---- */
  step(dt, track, world) {
    const s = this.stats, inp = this.input;
    if (this.hold) { this.vel.set(0, 0, 0); this.speed = 0; this.boosting = false; this.lightsBrake = true; this.steerVis = damp(this.steerVis, inp.steer * 0.5, 12, dt); return; }
    const fwd = this.forward(), right = this.rightVec();
    let vf = this.vel.dot(fwd), vr = this.vel.dot(right);
    const surfaceGrip = this.offTrack ? 0.45 : 1;
    const absV = Math.abs(vf);

    /* nitro */
    this.boosting = inp.nitro && this.nitro > 0 && vf > 2 && !this.finished;
    if (this.boosting) this.nitro = Math.max(0, this.nitro - 34 * dt);
    else this.nitro = Math.min(s.nitroCap, this.nitro + s.nitroRegen * dt * (this.slip > 0.3 ? 2.2 : 1));
    const top = s.topSpeed * (this.boosting ? s.nitroTop : 1) * (this.offTrack ? 0.55 : 1);

    /* longitudinal */
    let acc = 0;
    if (inp.throttle > 0 && vf >= -0.5) {
      const headroom = clamp(1 - vf / top, 0, 1);
      acc += inp.throttle * s.accel * (0.35 + 0.65 * Math.pow(headroom, 0.8)) * (this.boosting ? s.nitroPower : 1) * surfaceGrip;
      if (vf > top) acc -= (vf - top) * 1.5;
    }
    if (inp.brake > 0) {
      if (vf > 0.5) acc -= inp.brake * s.brake * surfaceGrip;
      else acc -= inp.brake * s.accel * 0.6; /* reverse */
      if (vf < -top * 0.3) acc = Math.max(acc, 0);
    }
    if (inp.handbrake && vf > 1) acc -= 9;
    /* drag + rolling */
    acc -= vf * 0.0012 * absV + sign(vf) * (this.offTrack ? 6 : 1.2);
    if (inp.throttle === 0 && inp.brake === 0 && absV < 0.8) vf = 0; else vf += acc * dt;

    /* lateral: grip bleeds lateral velocity; handbrake / nitro reduce it (drift) */
    let grip = s.grip * surfaceGrip;
    if (inp.handbrake) grip *= 0.32;
    if (this.boosting) grip *= 0.85;
    const slipAng = Math.atan2(Math.abs(vr), Math.max(absV, 0.1));
    if (slipAng > 0.3) grip *= 0.7; /* already sliding: keep sliding */
    vr *= Math.exp(-grip * dt);
    this.slip = clamp(Math.abs(vr) / 6, 0, 1);

    /* steering: yaw rate peaks around 22 m/s then tapers so high speed feels planted */
    const sp = Math.min(absV, top);
    const steerCurve = sp < 22 ? sp / 22 : clamp(1 - (sp - 22) / (top * 1.6), 0.35, 1);
    let yawRate = inp.steer * s.steer * steerCurve * (inp.handbrake ? 1.35 : 1) * (this.offTrack ? 0.8 : 1);
    if (vf < -0.5) yawRate = -yawRate * 0.8;
    /* body yaw adds lateral velocity when sliding sideways through a turn (kick-out) */
    this.yaw += yawRate * dt;
    if (inp.handbrake && absV > 8) vr -= yawRate * dt * absV * 0.35;

    /* recompose world velocity */
    const f2 = this.forward(), r2 = this.rightVec();
    this.vel.set(f2.x * vf + r2.x * vr, 0, f2.z * vf + r2.z * vr);
    this.pos.addScaledVector(this.vel, dt);
    this.speed = vf;

    /* track relation */
    this.trackIdx = track.nearest(this.pos.x, this.pos.z, this.trackIdx);
    this.lat = track.lateral(this.pos.x, this.pos.z, this.trackIdx);
    this.offTrack = Math.abs(this.lat) > track.halfWidth + 0.3;
    const wall = track.halfWidth + track.wallOffset - CAR.wid * 0.45;
    if (Math.abs(this.lat) > wall) {
      /* barrier hit: clamp to wall, reflect lateral velocity, scrub speed */
      const n = track.right[this.trackIdx].clone().multiplyScalar(-sign(this.lat)); /* normal pointing back to road */
      const over = Math.abs(this.lat) - wall;
      this.pos.addScaledVector(n, over + 0.02);
      const vn = this.vel.dot(n);
      if (vn < 0) {
        const impact = -vn;
        this.vel.addScaledVector(n, -vn * 1.6);                /* bounce */
        this.vel.multiplyScalar(clamp(1 - impact * 0.03, 0.55, 0.96)); /* scrub */
        const nowT = performance.now();
        if (impact > 2.5 && nowT - this.lastCollide > 120) { this.lastCollide = nowT; world && world.onCollision(this, impact, this.pos.clone().addScaledVector(n, -1.2)); }
        /* straighten heading a little toward the track direction */
        const ty = track.yawAt(this.trackIdx); this.yaw += wrapAngle(ty - this.yaw) * clamp(impact * 0.02, 0, 0.35);
      }
      this.speed = this.vel.dot(this.forward());
    }
    /* height & attitude from banking */
    const bank = track.bank[this.trackIdx];
    this.pos.y = track.heightAt(this.trackIdx, clamp(this.lat, -track.halfWidth - 2, track.halfWidth + 2));
    const targetRoll = -bank * Math.cos(wrapAngle(this.yaw - track.yawAt(this.trackIdx))) - vr * 0.012 + inp.steer * -0.02 * Math.min(1, absV / 20);
    this.roll = damp(this.roll, targetRoll, 10, dt);
    this.pitch = damp(this.pitch, clamp(-acc * 0.004, -0.06, 0.06), 8, dt);

    /* progress + laps */
    const prevP = this.progress;
    this.progress = track.progress(this.pos.x, this.pos.z, this.trackIdx);
    const dp = this.progress - prevP;
    const fwdOnTrack = this.vel.dot(track.tangent[this.trackIdx]);
    this.wrongWay = fwdOnTrack < -3 ? Math.min(this.wrongWay + dt, 3) : Math.max(this.wrongWay - dt * 2, 0);
    if (this.trackIdx >= track.sectors[0] && this.trackIdx < track.sectors[0] + 40) this.sectorsHit[0] = true;
    if (this.trackIdx >= track.sectors[1] && this.trackIdx < track.sectors[1] + 40 && this.sectorsHit[0]) this.sectorsHit[1] = true;
    if (dp < -0.5 && fwdOnTrack > 0) {
      /* crossed the line forwards */
      if (this.sectorsHit[0] && this.sectorsHit[1]) { this.lap++; world && world.onLap(this); }
      this.sectorsHit = [false, false];
    } else if (dp > 0.5) {
      /* crossed backwards: undo */
      if (this.lap > 0 && fwdOnTrack < 0) { this.lap--; this.sectorsHit = [true, true]; }
    }
    this.totalProgress = this.lap + this.progress;
    this.stuck = absV < 1.5 && inp.throttle > 0.5 ? this.stuck + dt : 0;

    /* visuals */
    this.steerVis = damp(this.steerVis, inp.steer * 0.5, 12, dt);
    this.wheelSpin += vf * dt / 0.36;
    this.lightsBrake = inp.brake > 0 && vf > 1;
  }

  syncMesh(dt) {
    const m = this.mesh; m.position.copy(this.pos); m.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');
    const u = m.userData;
    for (const w of u.wheels) { w.hub.rotation.y = w.front ? this.steerVis : 0; w.spin.rotation.x = this.wheelSpin; w.rim.rotation.x = this.wheelSpin; }
    u.tailMat.emissiveIntensity = this.lightsBrake ? 3.2 : 0.8;
    for (const f of u.flames) { f.visible = this.boosting; if (this.boosting) { const s = 0.7 + Math.random() * 0.6; f.scale.set(s, s, 1 + Math.random() * 0.5); } }
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
