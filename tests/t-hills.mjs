// Hills: every circuit has an elevation profile, and everything that touches the road follows it:
// cars ride the surface smoothly, gravity acts along the slope, the body pitches with the gradient,
// painted strips (start line, boost pads) lie on the surface, and remote cars and the ghost do the same.
import { open, check, near, finish, installHelpers } from './harness.mjs';
const { page, close, errors } = await open();
await page.evaluate(installHelpers);

/* 1. the profiles themselves */
const prof = await page.evaluate(() =>
  TRACKS.map((def) => {
    const t = new Track(def);
    let min = Infinity,
      max = -Infinity,
      g = 0,
      kink = 0;
    for (let i = 0; i < t.n; i++) {
      min = Math.min(min, t.elev[i]);
      max = Math.max(max, t.elev[i]);
      g = Math.max(g, Math.abs(t.grade[i]));
      kink = Math.max(kink, Math.abs(t.grade[(i + 1) % t.n] - t.grade[i]));
    }
    /* the grid: the last 60 m before the line and the first 40 m after it */
    let gridGrade = 0;
    for (let k = -Math.ceil(60 / t.seg); k <= Math.ceil(40 / t.seg); k++) gridGrade = Math.max(gridGrade, Math.abs(t.grade[(k + t.n) % t.n]));
    return { id: def.id, hilly: t.hilly, min, max, g, kink, gridGrade, e0: t.elev[0], flat: new Track(Object.assign({}, def, { elev: null })).hilly };
  })
);
for (const p of prof) {
  check(`${p.id}: has hills`, p.hilly && p.max - p.min > 5, `${p.min.toFixed(1)} to ${p.max.toFixed(1)} m`);
  check(`${p.id}: no gradient steeper than 9%`, p.g < 0.09, (p.g * 100).toFixed(1) + '%');
  check(`${p.id}: gradient changes smoothly (no kinks)`, p.kink < 0.004, p.kink.toFixed(5) + ' per sample');
  check(`${p.id}: the grid is level`, p.gridGrade < 0.012 && Math.abs(p.e0) < 0.2, `${(p.gridGrade * 100).toFixed(2)}% at height ${p.e0.toFixed(2)}`);
  check(`${p.id}: a definition without a profile stays flat`, p.flat === false);
}

/* 2. geometry: surface() agrees with the samples and with the rendered road mesh */
const geo = await page.evaluate(() => {
  T.start({ mode: 'trial', trackId: 'alpine', laps: 1 });
  const t = Game.track,
    w = Game.world,
    R = rng(77),
    out = {};
  let atSample = 0,
    cont = 0;
  for (let i = 0; i < t.n; i++) {
    const lat = (R() - 0.5) * 2 * t.halfWidth,
      p = t.point(i, lat);
    atSample = Math.max(atSample, Math.abs(t.surface(p.x, p.z, i) - p.y));
    /* halfway to the next sample, asked from either neighbour */
    const j = (i + 1) % t.n,
      q = t.pointF(i + 0.5, lat);
    cont = Math.max(cont, Math.abs(t.surface(q.x, q.z, i) - t.surface(q.x, q.z, j)));
  }
  out.atSample = atSample;
  out.cont = cont;
  const road = w.trackGroup.children.find((o) => o.name === 'road');
  w.trackGroup.updateMatrixWorld(true);
  const ray = new THREE.Raycaster(),
    down = new THREE.Vector3(0, -1, 0);
  let mesh = 0,
    hits = 0;
  for (let k = 0; k < 500; k++) {
    const s = R() * t.n,
      lat = (R() - 0.5) * 1.9 * t.halfWidth,
      p = t.pointF(s, lat);
    ray.set(new THREE.Vector3(p.x, 80, p.z), down);
    const h = ray.intersectObject(road, false)[0];
    if (!h) continue;
    hits++;
    mesh = Math.max(mesh, Math.abs(h.point.y - 0.03 - t.surface(p.x, p.z, t.nearest(p.x, p.z))));
  }
  out.mesh = mesh;
  out.hits = hits;
  /* painted strips sit just above the road everywhere along their length */
  const strips = w.trackGroup.children.filter((o) => o.isMesh && o.geometry.attributes.uv && !o.name && o.geometry.attributes.position.count <= 12 && o.material.polygonOffset);
  let stripWorst = 0,
    stripPts = 0;
  for (const m of strips) {
    const pa = m.geometry.attributes.position;
    for (let k = 0; k < pa.count; k++) {
      const x = pa.getX(k),
        z = pa.getZ(k),
        lift = pa.getY(k) - t.surface(x, z, t.nearest(x, z));
      stripPts++;
      stripWorst = Math.max(stripWorst, Math.abs(lift - 0.055));
    }
  }
  out.strips = strips.length;
  out.stripPts = stripPts;
  out.stripWorst = stripWorst;
  out.pads = t.pads.length;
  return out;
});
check('surface() equals the cross-section at every sample', geo.atSample < 1e-3, geo.atSample.toExponential(1));
check('surface() is continuous between neighbouring samples', geo.cont < 0.03, geo.cont.toFixed(4) + ' m');
check('surface() matches the rendered road mesh', geo.hits > 450 && geo.mesh < 0.025, `${geo.mesh.toFixed(3)} m over ${geo.hits} rays`);
check('start line and pads lie on the surface', geo.strips === 1 + geo.pads * 2 && geo.stripWorst < 0.03, `${geo.strips} strips, ${geo.stripPts} points, worst ${geo.stripWorst.toFixed(3)} m`);

/* 3. riding: a full autopilot lap on the hilliest circuit */
const ride = await page.evaluate(() => {
  T.start({ mode: 'trial', trackId: 'alpine', laps: 1 });
  T.autopilot(true, 2);
  const p = Game.player,
    t = Game.track;
  let prevY = null,
    worstStep = 0,
    worstFloat = 0,
    minY = Infinity,
    maxY = -Infinity,
    pitchErr = 0,
    maxPitch = 0,
    frames = 0;
  for (; frames < 20000 && !Game.results; frames++) {
    Game.frame(1 / 60);
    if (Game.state !== 'racing') continue;
    if (prevY !== null) {
      /* the car can only gain or lose height as fast as it moves along a slope */
      const lim = (Math.hypot(p.vel.x, p.vel.z) / 60) * 0.42 + 0.02;
      worstStep = Math.max(worstStep, Math.abs(p.pos.y - prevY) - lim);
    }
    prevY = p.pos.y;
    worstFloat = Math.max(worstFloat, Math.abs(p.pos.y - t.surface(p.pos.x, p.pos.z, p.trackIdx, t.halfWidth + 2)));
    minY = Math.min(minY, p.pos.y);
    maxY = Math.max(maxY, p.pos.y);
    maxPitch = Math.max(maxPitch, Math.abs(p.pitch));
    /* on straight road the only other pitch is squat and dive, which is limited to 0.06 rad */
    if (!p.drifting && Math.abs(p.speed) > 20 && t.maxCurvAhead((p.trackIdx - 6 + t.n) % t.n, 50) < 0.002) pitchErr = Math.max(pitchErr, Math.abs(p.pitch + Math.atan(p.slopeF)) - 0.075);
  }
  return { finished: !!Game.results, frames, worstStep, worstFloat, minY, maxY, pitchErr, maxPitch };
});
check('autopilot completes a lap over the pass', ride.finished, ride.frames + ' frames');
check('the lap really climbs and descends', ride.maxY - ride.minY > 25, `${ride.minY.toFixed(1)} to ${ride.maxY.toFixed(1)} m`);
check('ride height never jumps', ride.worstStep <= 0, `excess ${ride.worstStep.toFixed(3)} m per frame`);
check('the car stays on the surface', ride.worstFloat < 1e-6, ride.worstFloat.toExponential(1));
check('the body pitches with the gradient', ride.maxPitch > 0.04 && ride.pitchErr <= 0, `max pitch ${ride.maxPitch.toFixed(3)} rad, excess error ${ride.pitchErr.toFixed(3)}`);

/* 4. gravity: coasting uphill loses more speed than on the flat, downhill less, by SLOPE_G x gradient */
const grav = await page.evaluate(() => {
  T.start({ mode: 'trial', trackId: 'alpine', laps: 1 });
  T.run(260);
  const t = Game.track,
    p = Game.player;
  let up = 0,
    dn = 0,
    flat = 0;
  for (let i = 0; i < t.n; i++) {
    /* straightest steep spots, so cornering does not blur the measurement */
    const straight = Math.abs(t.curv[i]) < 0.004 ? 1 : 0.2;
    if (t.grade[i] * straight > t.grade[up] * (Math.abs(t.curv[up]) < 0.004 ? 1 : 0.2)) up = i;
    if (-t.grade[i] * straight > -t.grade[dn] * (Math.abs(t.curv[dn]) < 0.004 ? 1 : 0.2)) dn = i;
  }
  flat = 20; /* the start straight */
  const coast = (i) => {
    T.place(p, i, 0, 30);
    p.ground(t, 0);
    const g0 = p.slopeF;
    T.run(30); /* half a second, no input */
    return { loss: 30 - p.speed, g: g0, i };
  };
  const a = coast(up),
    b = coast(dn),
    c = coast(flat);
  /* parked on the steepest climb with no input, the car must not roll away */
  T.place(p, up, 0, 0);
  const z0 = p.pos.clone();
  T.run(120);
  const rolled = p.pos.distanceTo(z0);
  return { up: a, dn: b, flat: c, rolled, G: SLOPE_G };
});
check('test picked a real climb and a real descent', grav.up.g > 0.03 && grav.dn.g < -0.03 && Math.abs(grav.flat.g) < 0.005, `up ${(grav.up.g * 100).toFixed(1)}% at ${grav.up.i}, down ${(grav.dn.g * 100).toFixed(1)}% at ${grav.dn.i}`);
check('coasting uphill costs more speed than on the flat', grav.up.loss > grav.flat.loss + 0.05, `${grav.up.loss.toFixed(2)} vs ${grav.flat.loss.toFixed(2)} m/s in 0.5 s`);
check('coasting downhill costs less', grav.dn.loss < grav.flat.loss - 0.05, `${grav.dn.loss.toFixed(2)} vs ${grav.flat.loss.toFixed(2)} m/s in 0.5 s`);
check('uphill penalty matches SLOPE_G x gradient', near(grav.up.loss - grav.flat.loss, grav.G * grav.up.g * 0.5, 0.05), `${(grav.up.loss - grav.flat.loss).toFixed(3)} vs ${(grav.G * grav.up.g * 0.5).toFixed(3)} m/s`);
check('a parked car does not roll down the hill', grav.rolled < 0.05, grav.rolled.toFixed(3) + ' m');

/* 5. bots race on hills without getting stuck, on every circuit */
for (const id of await page.evaluate(() => TRACKS.map((t) => t.id))) {
  const race = await page.evaluate((id) => {
    T.start({ mode: 'ai', trackId: id, laps: 1, difficulty: 2, botCount: 5, seed: 3 });
    T.autopilot(true, 2);
    const used = T.finishRace(30000);
    /* when the player takes the flag every car should be on its way round: nobody parked on a slope */
    const laps = Game.cars.map((c) => (c.finished ? 1 : c.totalProgress));
    return { used, rows: Game.results ? Game.results.rows.length : 0, slowest: Math.min(...laps), stuck: Game.cars.filter((c) => c.stuck > 2).length };
  }, id);
  check(`${id}: six cars race over the hills without anyone left behind`, race.rows === 6 && race.slowest > 0.8 && race.stuck === 0, `${race.rows} rows, slowest car at ${(race.slowest * 100).toFixed(0)}% of the lap, ${race.stuck} stuck, ${race.used} frames`);
}

check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 300));
await close();
finish();
