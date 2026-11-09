/* ========================================================================
   AI driver — racing line follower with braking model, avoidance, rubber band
   ======================================================================== */
const DIFFICULTY = [
  { name: 'Rookie', speed: 0.82, latAcc: 15, react: 0.5, error: 0.35, nitro: 0.15, levels: { engine: 0, turbo: 0, tires: 0, nitro: 0 } },
  { name: 'Pro', speed: 0.93, latAcc: 21, react: 0.8, error: 0.15, nitro: 0.5, levels: { engine: 2, turbo: 2, tires: 2, nitro: 1 } },
  { name: 'Legend', speed: 1.0, latAcc: 27, react: 1.0, error: 0.05, nitro: 0.9, levels: { engine: 4, turbo: 4, tires: 4, nitro: 3 } },
];

class AIDriver {
  constructor(car, track, diff, seed) {
    this.car = car; this.track = track; this.d = diff; const r = rng(seed);
    this.lane = (r() - 0.5) * 0.9;              /* preferred lateral position (fraction of half width) */
    this.aggr = 0.7 + r() * 0.6;                /* individual aggression */
    this.skill = 1 - diff.error * (0.4 + r() * 0.8);
    this.noiseT = r() * 100; this.avoid = 0; this.reverseT = 0; this.rubber = 1; this.nitroHold = 0;
  }
  update(dt, cars, playerProg, elapsed) {
    const c = this.car, t = this.track, inp = c.input; this.noiseT += dt;
    if (c.finished) { /* cruise home */ }
    /* stuck → reverse briefly */
    if (c.stuck > 1.6 && this.reverseT <= 0) this.reverseT = 1.1;
    if (this.reverseT > 0) { this.reverseT -= dt; inp.throttle = 0; inp.brake = 1; inp.steer = -Math.sign(this._steerTo(10)) || 1; inp.nitro = false; inp.handbrake = false; return; }

    /* rubber band: slower when far ahead of the player, faster when far behind */
    if (playerProg != null) { const gap = c.totalProgress - playerProg; this.rubber = clamp(1 - gap * 0.35, 0.86, 1.1); }
    const speedCap = c.stats.topSpeed * this.d.speed * this.rubber;

    /* lookahead target lateral: bias toward inside of the upcoming corner (apex) */
    const seg = t.length / t.n; const look = clamp(c.speed * 0.55 + 10, 12, 40);
    const li = (c.trackIdx + Math.round(look / seg)) % t.n;
    const curvAhead = t.curv[(c.trackIdx + Math.round(25 / seg)) % t.n];
    const apex = clamp(curvAhead * 22, -0.6, 0.6);  /* left turn (+) → move left (−lat) */
    const wobble = Math.sin(this.noiseT * 0.7) * this.d.error * 0.3;
    let laneLat = (this.lane * 0.5 - apex + wobble + this.avoid) * t.halfWidth * 0.8;
    laneLat = clamp(laneLat, -t.halfWidth * 0.85, t.halfWidth * 0.85);
    const target = t.point(li, laneLat);
    const dx = target.x - c.pos.x, dz = target.z - c.pos.z;
    const ang = wrapAngle(Math.atan2(dx, dz) - c.yaw);
    inp.steer = clamp(ang * 2.4 * this.skill, -1, 1);

    /* target speed from the tightest curvature within the braking distance */
    const brakeDist = (c.speed * c.speed) / (2 * c.stats.brake * 0.8) + 8;
    const maxC = t.maxCurvAhead(c.trackIdx, brakeDist + 12);
    let vTarget = maxC > 1e-4 ? Math.sqrt(this.d.latAcc * this.aggr / maxC) : speedCap;
    const cNow = Math.abs(t.curv[c.trackIdx]);
    if (cNow > 1e-4) vTarget = Math.min(vTarget, Math.sqrt(this.d.latAcc * 1.25 * this.aggr / cNow));
    vTarget = Math.min(vTarget, speedCap);
    if (Math.abs(ang) > 0.5) vTarget *= 0.75;
    if (c.offTrack) vTarget = Math.min(vTarget, 25);
    const dv = vTarget - c.speed;
    inp.throttle = dv > -1 ? 1 : dv > -5 ? 0.3 : 0;
    inp.brake = dv < -4 ? clamp(-dv / 10, 0.3, 1) : 0;
    inp.handbrake = false;

    /* nitro on straights when the tank is reasonably full */
    const straight = t.maxCurvAhead(c.trackIdx, 90) < 0.006;
    if (this.nitroHold > 0) this.nitroHold -= dt;
    else if (straight && c.nitro > c.stats.nitroCap * 0.45 && Math.random() < this.d.nitro * dt * 1.5 * (this.rubber > 1 ? 2 : 1)) this.nitroHold = 1.6 + Math.random();
    inp.nitro = this.nitroHold > 0 && straight;

    /* avoidance: car ahead within 14 m in our lane → move away, ease throttle if very close */
    let av = 0;
    for (const o of cars) {
      if (o === c) continue;
      const ox = o.pos.x - c.pos.x, oz = o.pos.z - c.pos.z; const f = c.forward(), r = c.rightVec();
      const ahead = ox * f.x + oz * f.z, side = ox * r.x + oz * r.z;
      if (ahead > 0 && ahead < 14 && Math.abs(side) < 3.2) {
        av += (side >= 0 ? -1 : 1) * (1 - ahead / 14) * 0.9;
        if (ahead < 6 && c.speed > o.speed + 2) inp.throttle *= 0.5;
      }
    }
    this.avoid = damp(this.avoid, clamp(av, -0.7, 0.7), 4, dt);
  }
  _steerTo(aheadM) { const t = this.track, c = this.car; const i = (c.trackIdx + Math.round(aheadM / (t.length / t.n))) % t.n; const p = t.center[i]; return wrapAngle(Math.atan2(p.x - c.pos.x, p.z - c.pos.z) - c.yaw); }
}
