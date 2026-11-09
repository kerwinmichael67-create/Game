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

function buildCarMesh(hex, levels = {}, opts = {}) {
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: hex, metalness: 0.65, roughness: 0.32 });
  const dark = matCache('dark', () => new THREE.MeshStandardMaterial({ color: 0x15171c, metalness: 0.3, roughness: 0.7 }));
  const glass = matCache('glass', () => new THREE.MeshStandardMaterial({ color: 0x0b1a2a, metalness: 0.9, roughness: 0.15, transparent: true, opacity: 0.92 }));
  const chrome = matCache('chrome', () => new THREE.MeshStandardMaterial({ color: 0xcfd6e6, metalness: 1, roughness: 0.25 }));
  const tyre = matCache('tyre', () => new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.95 }));
  const headMat = matCache('head', () => new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff2c0, emissiveIntensity: 1.6 }));
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x5a0a0a, emissive: 0xff2020, emissiveIntensity: 0.5 });

  /* chassis: tapered box via scaled vertices */
  const body = new THREE.BoxGeometry(CAR.wid, 0.62, CAR.len, 1, 1, 4);
  const pa = body.attributes.position;
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
    let sx = 1; if (z > 1.6) sx = 0.86; else if (z < -1.6) sx = 0.92;    /* narrower nose/tail */
    let yy = y; if (y > 0 && z > 1.4) yy -= 0.14 * ((z - 1.4) / 0.8);    /* sloping bonnet */
    pa.setXYZ(i, x * sx, yy, z);
  }
  body.computeVertexNormals();
  const bodyM = new THREE.Mesh(body, paint); bodyM.position.y = 0.52; bodyM.castShadow = true; bodyM.receiveShadow = true; g.add(bodyM);
  /* lower skirt */
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(CAR.wid * 0.96, 0.22, CAR.len * 0.9), dark); skirt.position.y = 0.3; skirt.castShadow = true; g.add(skirt);
  /* cabin */
  const cab = new THREE.BoxGeometry(1.5, 0.52, 2.0, 1, 1, 2);
  const ca = cab.attributes.position;
  for (let i = 0; i < ca.count; i++) { const y = ca.getY(i), z = ca.getZ(i), x = ca.getX(i); if (y > 0) { ca.setX(i, x * 0.8); ca.setZ(i, z * 0.6 - 0.15); } }
  cab.computeVertexNormals();
  const cabM = new THREE.Mesh(cab, glass); cabM.position.set(0, 1.05, -0.25); cabM.castShadow = true; g.add(cabM);
  /* roof stripe */
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 4.2), matCache('stripe', () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })));
  stripe.position.y = 0.835; stripe.position.z = 0.1; g.add(stripe);
  /* spoiler grows with engine level */
  const sl = Math.min(3, Math.ceil(((levels.engine || 0) + (levels.turbo || 0)) / 3));
  if (sl > 0) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(1.7 + sl * 0.12, 0.06, 0.4), dark); w.position.set(0, 0.95 + sl * 0.08, -2.05); w.castShadow = true; g.add(w);
    for (const sx of [-0.7, 0.7]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3 + sl * 0.08, 0.25), dark); p.position.set(sx, 0.8 + (sl * 0.08) / 2, -2.05); g.add(p); }
  }
  /* lights */
  for (const sx of [-0.62, 0.62]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.08), headMat); h.position.set(sx, 0.62, 2.18); g.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.06), tailMat); t.position.set(sx, 0.7, -2.2); g.add(t);
  }
  /* exhausts + nitro flames */
  const flames = [];
  for (const sx of [-0.35, 0.35]) {
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.3, 8), chrome); ex.rotation.x = Math.PI / 2; ex.position.set(sx, 0.3, -2.25); g.add(ex);
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.2, 8), matCache('flame', () => new THREE.MeshBasicMaterial({ color: 0x66d9ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })));
    fl.rotation.x = Math.PI / 2; fl.position.set(sx, 0.3, -2.9); fl.scale.set(1, 1, 0.01); fl.visible = false; g.add(fl); flames.push(fl);
  }
  /* wheels */
  const wheelGeo = matCache('wheelGeo', () => { const geo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 18); geo.rotateZ(Math.PI / 2); return geo; });
  const rimGeo = matCache('rimGeo', () => { const geo = new THREE.CylinderGeometry(0.24, 0.24, 0.32, 6); geo.rotateZ(Math.PI / 2); return geo; });
  const wheels = [];
  const wp = [[-0.95, 1.45], [0.95, 1.45], [-0.95, -1.45], [0.95, -1.45]];
  wp.forEach(([x, z], i) => {
    const hub = new THREE.Group(); hub.position.set(x, 0.36, z);
    const w = new THREE.Mesh(wheelGeo, tyre); w.castShadow = true; hub.add(w);
    const r = new THREE.Mesh(rimGeo, chrome); hub.add(r);
    g.add(hub); wheels.push({ hub, spin: w, rim: r, front: i < 2 });
  });
  /* blob shadow helper (cheap contact shadow in addition to shadow maps) */
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5.0), matCache('blob', () => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }); }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.03; g.add(blob);

  g.userData = { paint, tailMat, wheels, flames, body: bodyM };
  if (opts.ghost) { g.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.35; o.material.depthWrite = false; o.castShadow = false; } }); blob.visible = false; }
  return g;
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
    this.mesh = buildCarMesh(this.hex, this.stats.levels, { ghost: this.ghost });
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
    u.tailMat.emissiveIntensity = this.lightsBrake ? 2.4 : 0.5;
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
