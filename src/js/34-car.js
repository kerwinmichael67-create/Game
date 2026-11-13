/* ========================================================================
   Car: state + fixed-step driving model (grip mode, drift mode, barriers, laps)
   ======================================================================== */
class Car {
  constructor(opts) {
    this.id = opts.id;
    this.name = opts.name || 'Racer';
    this.hex = opts.hex;
    this.paintId = opts.paintId || null;
    this.isPlayer = !!opts.isPlayer;
    this.remote = !!opts.remote;
    this.ghost = !!opts.ghost;
    this.model = carModel(opts.model).id;
    this.stats = opts.stats || carStats(opts.levels || {}, this.model);
    this.mesh = buildCarMesh(this.hex, this.stats.levels, {
      ghost: this.ghost,
      night: !!opts.night,
      number: opts.number,
      model: this.model,
    });
    if (opts.label) this.mesh.add(makeLabel(opts.label, this.hex));
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.roll = 0;
    this.pitch = 0;
    this.input = { throttle: 0, brake: 0, steer: 0, nitro: false, handbrake: false };
    this.digital = false; /* true while a keyboard/touch player is steering: inputs get eased */
    this.ai = null;
    this.hold = false;
    this.clock = 0;
    this.resetState();
  }
  resetState() {
    this.speed = 0;
    this.spd = 0;
    this.steer = 0;
    this.steerVis = 0;
    this.wheelSpin = 0;
    this.slip = 0;
    this.nitro = this.stats.nitroCap;
    this.boosting = false;
    this.trackIdx = 0;
    this.lat = 0;
    this.progress = 0;
    this.lap = 0;
    this.lapStart = 0;
    this.lapTimes = [];
    this.bestLap = null;
    this.finished = false;
    this.finishTime = null;
    this.sectorsHit = [false, false];
    this.offTrack = false;
    this.offT = 0;
    this.wrongWay = 0;
    this.lastCollide = 0;
    this.totalProgress = 0;
    this.stuck = 0;
    this.lightsBrake = false;
    this.drifting = false;
    this.driftDir = 0;
    this.driftT = 0;
    this.driftCharge = 0;
    this.driftTier = 0;
    this.driftPts = 0;
    this.driftAngle = 0;
    this.kickT = 0;
    this.driftScore = 0;
    this.driftChain = 0;
    this.driftEndAt = -10;
    this.driftBest = 0;
    this.turboT = 0;
    this.turboPow = 0;
    this.turboTier = 0;
    this.padT = 0;
    this.padCool = 0;
    this.draft = 0;
    this.topSeen = 0;
    this.wallT = 0;
  }
  place(pose, idx) {
    this.resetState();
    this.pos.copy(pose.pos);
    this.yaw = pose.yaw;
    this.vel.set(0, 0, 0);
    this.trackIdx = idx;
    this.roll = 0;
    this.pitch = 0;
    this.syncMesh(0);
  }
  /* put the car back on the racing surface, pointing the right way */
  recover(track) {
    const i = this.trackIdx;
    this.pos.copy(track.point(i, 0));
    this.yaw = track.yawAt(i);
    this.vel.set(0, 0, 0);
    this.speed = 0;
    this.steer = 0;
    this.stuck = 0;
    this.wrongWay = 0;
    this.endDrift(null, false);
    this.turboT = 0;
    this.padT = 0;
    this.lat = 0;
    this.offTrack = false;
  }
  forward() {
    return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
  }
  rightVec() {
    return new THREE.Vector3(-Math.cos(this.yaw), 0, Math.sin(this.yaw));
  }

  endDrift(world, clean) {
    if (!this.drifting) return;
    const tier = clean ? this.driftTier : 0;
    let banked = 0;
    if (clean && this.driftPts > 20) {
      banked = Math.round(this.driftPts * [1, 1.1, 1.25, 1.5][tier]);
      this.driftScore += banked;
      this.driftBest = Math.max(this.driftBest, banked);
      this.driftEndAt = this.clock;
    } else this.driftChain = 0;
    if (tier > 0) {
      this.turboT = [0.75, 1.2, 1.8][tier - 1];
      this.turboPow = [0.7, 0.9, 1.15][tier - 1];
      this.turboTier = tier;
      this.nitro = Math.min(this.stats.nitroCap, this.nitro + [8, 16, 26][tier - 1]);
    }
    this.drifting = false;
    this.driftAngle = 0;
    this.kickT = 0;
    if (world) world.onDrift(this, clean ? 'end' : 'fail', { tier, banked });
    this.driftPts = 0;
    this.driftCharge = 0;
    this.driftTier = 0;
  }

  /* ---- fixed-step physics ---- */
  step(dt, track, world) {
    const s = this.stats,
      inp = this.input;
    this.clock += dt;
    /* keyboard and touch are on/off, so ease the wheel toward the input; centring is faster than turning in */
    const sr = this.digital ? (inp.steer === 0 || inp.steer * this.steer < 0 ? 11 : 6.5) : 18;
    this.steer += clamp(inp.steer - this.steer, -sr * dt, sr * dt);
    if (this.hold) {
      this.vel.set(0, 0, 0);
      this.speed = 0;
      this.boosting = false;
      this.lightsBrake = true;
      this.steerVis = damp(this.steerVis, this.steer * 0.5, 12, dt);
      return;
    }
    const fwd = this.forward(),
      right = this.rightVec();
    let vf = this.vel.dot(fwd),
      vr = this.vel.dot(right);
    const absV = Math.abs(vf),
      spd = Math.hypot(vf, vr),
      surf = this.offTrack ? 0.5 : 1;

    /* ---- boost sources: nitro, drift mini-turbo, boost pads, slipstream ---- */
    this.boosting = inp.nitro && this.nitro > 0 && vf > 2 && !this.finished;
    if (this.boosting) this.nitro = Math.max(0, this.nitro - 34 * dt);
    else this.nitro = Math.min(s.nitroCap, this.nitro + s.nitroRegen * dt * (this.drifting ? 2.5 : 1));
    this.turboT = Math.max(0, this.turboT - dt);
    this.padT = Math.max(0, this.padT - dt);
    this.padCool = Math.max(0, this.padCool - dt);
    const turbo = this.turboT > 0 ? this.turboPow : 0,
      pad = this.padT > 0 ? 1 : 0;
    const top =
      s.topSpeed * (1 + (this.boosting ? s.nitroTop - 1 : 0) + turbo * 0.1 + pad * 0.14 + this.draft * 0.05) * (this.offTrack ? 0.55 : 1);
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
      else acc -= inp.brake * s.accel * 0.6; /* reverse */
      if (vf < -top * 0.3) acc = Math.max(acc, 0);
    }
    if (inp.handbrake && vf > 1) acc -= 7;
    acc -=
      vf * 0.0012 * absV +
      sign(vf) *
        (1.2 + (this.offTrack ? Math.min(3, absV * 0.15) : 0)); /* drag + rolling resistance; grass drags harder the faster you go */

    /* ---- enter a drift: handbrake while steering, or the tail has already stepped out ---- */
    if (!this.drifting && vf > 11) {
      const pull = inp.handbrake && Math.abs(this.steer) > 0.25 && !this.offTrack;
      const beta = Math.atan2(vr, absV);
      if (pull || Math.abs(beta) > 0.24) {
        this.drifting = true;
        this.driftT = 0;
        this.driftCharge = 0;
        this.driftTier = 0;
        this.driftPts = 0;
        this.driftDir = pull ? sign(this.steer) : -sign(beta);
        this.kickT = pull ? 0.24 : 0;
        this.driftChain = this.clock - this.driftEndAt < 2.5 ? Math.min(this.driftChain + 1, 4) : 0;
        if (world) world.onDrift(this, 'start', {});
      }
    }

    if (!this.drifting) {
      /* ---- grip driving: tyres hold up to s.grip of lateral acceleration, steering never asks for more on tarmac ---- */
      if (inp.throttle === 0 && inp.brake === 0 && absV < 0.8 && Math.abs(vr) < 0.8) vf = 0;
      else vf += acc * dt;
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
      let sp = this.vel.length();
      const th = Math.atan2(this.vel.x, this.vel.z);
      const N = wrapAngle(th - this.yaw),
        aN = Math.abs(N),
        sN = Math.sin(Math.min(aN, 1.4)),
        cN = Math.cos(N);
      const aT = acc * cN - (3 + s.grip * 0.16) * sN - 7 * sN * sN; /* sliding scrubs speed, steeply at big angles */
      /* cornering force grows with the angle, so steering deeper into the slide tightens the line and easing off lets it run wide */
      const aC = s.grip * 1.15 * surf * (inp.handbrake ? 0.55 : 1) * clamp(aN / 0.5, 0, 1) + Math.max(acc, 0) * sN;
      sp = Math.max(0, sp + aT * dt);
      const dTh = -sign(N) * Math.min((aC / Math.max(sp, 6)) * dt, aN);
      const th2 = th + dTh;
      this.vel.set(Math.sin(th2) * sp, 0, Math.cos(th2) * sp);
      let dN =
        this.steer * 0.95 * dt - sign(N) * (0.1 + (Math.abs(dTh) / dt) * 0.3) * dt; /* steer in to add angle; it bleeds off otherwise */
      if (this.kickT > 0) {
        this.kickT -= dt;
        dN += this.driftDir * 1.7 * dt;
      }
      if (aN > 0.5 && dN * N > 0) dN *= clamp(1 - (aN - 0.5) / 0.38, 0, 1); /* the angle tops out near 45°: no spins */
      this.yaw += dTh - dN;
      this.driftAngle = N + dN;
      if (Math.abs(this.driftAngle) > 0.1) this.driftDir = sign(this.driftAngle);
      this.slip = clamp(Math.abs(this.driftAngle) / 0.45, 0.25, 1);
      const f2 = this.forward(),
        r2 = this.rightVec();
      vf = this.vel.dot(f2);
      vr = this.vel.dot(r2);
      /* charge + score only for real slides on tarmac */
      const a2 = Math.abs(this.driftAngle);
      if (!this.offTrack && a2 > 0.16 && sp > 12) {
        this.driftCharge += dt * clamp(a2 / 0.45, 0.5, 1.3) * clamp(sp / 30, 0.6, 1.25) * s.driftBonus;
        this.driftPts += sp * a2 * dt * 9 * (1 + 0.5 * this.driftChain) * s.driftBonus;
        const tier =
          this.driftCharge >= DRIFT_TIERS[2] ? 3 : this.driftCharge >= DRIFT_TIERS[1] ? 2 : this.driftCharge >= DRIFT_TIERS[0] ? 1 : 0;
        if (tier > this.driftTier) {
          this.driftTier = tier;
          if (world) world.onDrift(this, 'tier', { tier });
        }
      }
      if (this.offT > 0.5) {
        this.driftPts = 0;
        this.driftCharge = 0;
        this.driftTier = 0;
      }
      if (sp < 7) this.endDrift(world, false);
      else if (a2 < 0.06 && this.driftT > 0.32 && this.kickT <= 0) this.endDrift(world, true);
    }
    this.pos.addScaledVector(this.vel, dt);
    this.speed = vf;
    this.spd = Math.hypot(vf, vr);
    if (vf > this.topSeen) this.topSeen = vf;

    /* ---- track relation ---- */
    this.trackIdx = track.nearest(this.pos.x, this.pos.z, this.trackIdx);
    this.lat = track.lateral(this.pos.x, this.pos.z, this.trackIdx);
    this.offTrack = Math.abs(this.lat) > track.halfWidth + 0.3;
    this.offT = this.offTrack ? this.offT + dt : 0;
    const wall = track.halfWidth + track.wallOffset - CAR.wid * 0.45;
    if (Math.abs(this.lat) > wall) {
      /* barrier hit: clamp to the wall, reflect the velocity into it, scrub speed */
      const n = track.right[this.trackIdx].clone().multiplyScalar(-sign(this.lat)); /* normal pointing back to the road */
      this.pos.addScaledVector(n, Math.abs(this.lat) - wall + 0.02);
      this.wallT = 0.3;
      const vn = this.vel.dot(n);
      if (vn < 0) {
        const impact = -vn;
        this.vel.addScaledVector(n, -vn * 1.5);
        this.vel.multiplyScalar(1 - Math.min(0.45, impact * 0.03)); /* hard hits scrub speed; a light scrape barely does */
        const nowT = performance.now();
        if (impact > 2.5 && nowT - this.lastCollide > 120) {
          this.lastCollide = nowT;
          world && world.onCollision(this, impact, this.pos.clone().addScaledVector(n, -1.2));
        }
        const ty = track.yawAt(this.trackIdx);
        this.yaw += wrapAngle(ty - this.yaw) * clamp(impact * 0.02, 0, 0.35);
        if (impact > 2 && this.drifting) this.endDrift(world, false);
      }
      this.vel.multiplyScalar(1 - Math.min(0.5, 0.9 * dt)); /* rubbing along the barrier costs a little, continuously */
      this.speed = this.vel.dot(this.forward());
      this.spd = this.vel.length();
    }
    /* for a moment after touching a barrier the nose is eased back along the track, so the car slides free instead of pinning itself */
    if (this.wallT > 0) {
      this.wallT -= dt;
      const along = track.yawAt(this.trackIdx) + (this.vel.dot(track.tangent[this.trackIdx]) < -2 ? Math.PI : 0),
        turn = wrapAngle(along - this.yaw);
      this.yaw += sign(turn) * Math.min(Math.abs(turn), (1.4 + 2.2 * Math.abs(turn)) * dt);
    }
    /* boost pads */
    if (this.padCool <= 0 && vf > 5 && track.padAt(this.trackIdx, this.lat)) {
      this.padT = 1.4;
      this.padCool = 1.2;
      world && world.onPad(this);
    }
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
      if (this.sectorsHit[0] && this.sectorsHit[1]) {
        this.lap++;
        world && world.onLap(this);
      }
      this.sectorsHit = [false, false];
    } else if (dp > 0.5) {
      if (this.lap > 0 && fwdOnTrack < 0) {
        this.lap--;
        this.sectorsHit = [true, true];
      }
    }
    this.totalProgress = this.lap + this.progress;
    this.stuck = Math.abs(this.speed) < 1.5 && inp.throttle > 0.5 ? this.stuck + dt : 0;

    /* visuals */
    this.steerVis = damp(this.steerVis, this.steer * 0.5 - this.driftAngle * 0.5, 12, dt);
    this.wheelSpin += (vf * dt) / 0.36;
    this.lightsBrake = (inp.brake > 0 || inp.handbrake) && vf > 1;
  }

  syncMesh(dt) {
    const m = this.mesh;
    m.position.copy(this.pos);
    m.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');
    const u = m.userData;
    /* +rotation.y swings a wheel to the car's left, so steering right is negative */
    for (const w of u.wheels) {
      w.hub.rotation.y = w.front ? -clamp(this.steerVis, -0.6, 0.6) : 0;
      w.spin.rotation.x = this.wheelSpin;
      w.rim.rotation.x = this.wheelSpin;
    }
    u.tailMat.emissiveIntensity = this.lightsBrake ? 3.2 : 0.8;
    const fire = this.boosting || this.turboT > 0 || this.padT > 0;
    if (fire) u.flameMat.color.setHex(this.boosting ? 0x66d9ff : this.padT > 0 ? 0xffd166 : TIER_HEX[this.turboTier] || 0xffa13a);
    for (const f of u.flames) {
      f.visible = fire;
      if (fire) {
        const k = 0.7 + Math.random() * 0.6;
        f.scale.set(k, k, 1 + Math.random() * 0.5);
      }
    }
  }

  /* circle collision against another car; both get pushed, momentum partially exchanged */
  collide(other, world) {
    const dx = other.pos.x - this.pos.x,
      dz = other.pos.z - this.pos.z;
    const d2 = dx * dx + dz * dz;
    const r = CAR.radius;
    if (d2 > r * r || d2 < 1e-6) return;
    const d = Math.sqrt(d2),
      nx = dx / d,
      nz = dz / d,
      over = r - d;
    const wThis = other.remote ? 1 : 0.5,
      wOther = other.remote ? 0 : 0.5;
    this.pos.x -= nx * over * wThis;
    this.pos.z -= nz * over * wThis;
    other.pos.x += nx * over * wOther;
    other.pos.z += nz * over * wOther;
    const rvx = this.vel.x - other.vel.x,
      rvz = this.vel.z - other.vel.z;
    const rel = rvx * nx + rvz * nz;
    if (rel > 0) {
      const j = rel * 0.8;
      this.vel.x -= nx * j * (other.remote ? 1 : 0.5);
      this.vel.z -= nz * j * (other.remote ? 1 : 0.5);
      if (!other.remote) {
        other.vel.x += nx * j * 0.5;
        other.vel.z += nz * j * 0.5;
      }
      const nowT = performance.now();
      if (rel > 3 && nowT - this.lastCollide > 150) {
        this.lastCollide = nowT;
        world && world.onCollision(this, rel, new THREE.Vector3(this.pos.x + nx * 1.1, 0.5, this.pos.z + nz * 1.1), true);
      }
    }
  }
}
