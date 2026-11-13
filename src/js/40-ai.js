/* ========================================================================
   AI driver — racing line follower with braking model, avoidance, rubber band
   latK is the share of the car's tyre grip the driver is willing to use.
   ======================================================================== */
const DIFFICULTY = [
  { name: 'Rookie', speed: 0.84, latK: 0.60, error: 0.35, nitro: 0.15, drift: 0, levels: { engine: 0, turbo: 0, tires: 0, nitro: 0 } },
  { name: 'Pro', speed: 0.94, latK: 0.76, error: 0.15, nitro: 0.5, drift: 0.35, levels: { engine: 2, turbo: 2, tires: 2, nitro: 1 } },
  { name: 'Legend', speed: 1.0, latK: 0.9, error: 0.05, nitro: 0.9, drift: 0.7, levels: { engine: 4, turbo: 4, tires: 4, nitro: 3 } },
];

class AIDriver {
  constructor(car, track, diff, seed) {
    this.car = car; this.track = track; this.d = diff; const r = rng(seed);
    this.lane = (r() - 0.5) * 0.9;              /* preferred lateral position (fraction of half width, + = right) */
    this.aggr = 0.9 + r() * 0.2;                /* individual pace */
    this.skill = 1 - diff.error * (0.4 + r() * 0.8);
    this.noiseT = r() * 100; this.avoid = 0; this.reverseT = 0; this.rubber = 1; this.nitroHold = 0; this.slowT = 0; this.driftCool = 0; this.r = r;
  }
  update(dt, cars, playerProg) {
    const c = this.car, t = this.track, inp = c.input; this.noiseT += dt;
    /* stuck → back out, then recover onto the track if that does not work */
    if (c.stuck > 1.6 && this.reverseT <= 0) this.reverseT = 1.1;
    this.slowT = Math.abs(c.speed) < 3 && !c.finished ? this.slowT + dt : 0;
    if (this.slowT > 6) { c.recover(t); this.reverseT = 0; this.slowT = 0; }
    if (this.reverseT > 0) { this.reverseT -= dt; inp.throttle = 0; inp.brake = 1; inp.steer = Math.sign(this._bearing(10)) || 1; inp.nitro = false; inp.handbrake = false; return; }

    /* rubber band: slower when far ahead of the player, faster when far behind */
    if (playerProg != null) { const gap = c.totalProgress - playerProg; this.rubber = clamp(1 - gap * 0.35, 0.86, 1.1); }
    const speedCap = c.stats.topSpeed * this.d.speed * this.rubber;

    /* aim point: ahead on the track, pulled toward the inside of the corner that is coming (the apex) */
    const seg = t.length / t.n; const look = clamp(c.speed * 0.5 + 9, 11, 38);
    const li = (c.trackIdx + Math.round(look / seg)) % t.n;
    const curvAhead = t.curv[(c.trackIdx + Math.round(24 / seg)) % t.n];
    const apex = clamp(curvAhead * 24, -0.65, 0.65);        /* curv > 0 is a left turn → apex on the left → negative lat */
    const wobble = Math.sin(this.noiseT * 0.7) * this.d.error * 0.3;
    let lane = this.lane * 0.45 - apex + wobble;
    /* line up for a boost pad when one is coming on a straight */
    for (const p of t.pads) { const d = t.ahead(c.trackIdx, p.idx); if (d > 6 && d < 75 && Math.abs(curvAhead) < 0.006) { lane = lerp(lane, p.lat / (t.halfWidth * 0.8), 0.8); break; } }
    const laneLat = clamp((lane + this.avoid) * t.halfWidth * 0.8, -t.halfWidth * 0.85, t.halfWidth * 0.85);
    const target = t.point(li, laneLat);
    const bearing = wrapAngle(Math.atan2(target.x - c.pos.x, target.z - c.pos.z) - c.yaw);  /* + = target is to the left */
    inp.steer = clamp(-bearing * 2.6 * this.skill, -1, 1);

    /* target speed from the tightest curvature within the braking distance */
    const latAcc = c.stats.grip * this.d.latK * this.aggr;
    const brakeDist = (c.speed * c.speed) / (2 * c.stats.brake * 0.8) + 8;
    const maxC = t.maxCurvAhead(c.trackIdx, brakeDist + 12);
    let vTarget = maxC > 1e-4 ? Math.sqrt(latAcc / maxC) : speedCap;
    vTarget = Math.min(vTarget, speedCap);
    if (Math.abs(bearing) > 0.5) vTarget *= 0.75;
    if (c.offTrack) vTarget = Math.min(vTarget, 25);
    const dv = vTarget - c.speed;
    inp.throttle = dv > -1 ? 1 : dv > -5 ? 0.3 : 0;
    inp.brake = dv < -4 ? clamp(-dv / 10, 0.3, 1) : 0;
    inp.handbrake = false;
    /* the quicker drivers flick the car sideways into tight corners; in a slide the nose is simply aimed at the same point */
    this.driftCool -= dt;
    const cTurn = t.curv[(c.trackIdx + Math.round(12 / seg)) % t.n];
    if (!c.drifting && this.driftCool <= 0 && this.d.drift > 0 && Math.abs(cTurn) > 0.017 && c.speed > 17 && !c.offTrack && Math.abs(c.lat) < t.halfWidth * 0.6 && Math.abs(bearing) < 0.35) {
      this.driftCool = 3; if (this.r() < this.d.drift) { inp.handbrake = true; inp.steer = cTurn > 0 ? -1 : 1; }
    }
    if (c.drifting) { inp.steer = clamp(-bearing * 2.2 - c.driftAngle * 0.6, -1, 1); if (inp.brake < 0.6) { inp.brake = 0; inp.throttle = Math.max(inp.throttle, 0.7); } }

    /* nitro on straights when the tank is reasonably full */
    const straight = t.maxCurvAhead(c.trackIdx, 90) < 0.006;
    if (this.nitroHold > 0) this.nitroHold -= dt;
    else if (straight && c.nitro > c.stats.nitroCap * 0.45 && Math.random() < this.d.nitro * dt * 1.5 * (this.rubber > 1 ? 2 : 1)) this.nitroHold = 1.6 + Math.random();
    inp.nitro = this.nitroHold > 0 && straight;

    /* avoidance: car close ahead in our lane → move to the other side, ease off if about to hit it */
    let av = 0; const f = c.forward(), r = c.rightVec();
    for (const o of cars) {
      if (o === c) continue;
      const ox = o.pos.x - c.pos.x, oz = o.pos.z - c.pos.z;
      const ahead = ox * f.x + oz * f.z, side = ox * r.x + oz * r.z;      /* side > 0: the other car is on our right */
      if (ahead > 0 && ahead < 14 && Math.abs(side) < 3.2) {
        av += (side >= 0 ? -1 : 1) * (1 - ahead / 14) * 0.9;
        if (ahead < 6 && c.speed > o.speed + 2) inp.throttle *= 0.5;
      }
    }
    this.avoid = damp(this.avoid, clamp(av, -0.7, 0.7), 4, dt);
  }
  /* bearing to the centreline some metres ahead; + = to the left */
  _bearing(aheadM) { const t = this.track, c = this.car; const i = (c.trackIdx + Math.round(aheadM / (t.length / t.n))) % t.n; const p = t.center[i]; return wrapAngle(Math.atan2(p.x - c.pos.x, p.z - c.pos.z) - c.yaw); }
}
