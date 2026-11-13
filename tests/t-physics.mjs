// Handling model: grip limit, drift lifecycle, recovery situations, pads, nitro, slipstream.
import { open, check, finish, installHelpers, near } from './harness.mjs';
const { page, close } = await open();
await page.evaluate(installHelpers);

const grip = await page.evaluate(() => {
  T.start({ mode: 'drift', trackId: 'alpine' });
  T.run(250);
  const p = Game.player;
  /* main straight, left side, 38 m/s; then full right lock for 0.5 s (stays on the tarmac) */
  T.place(p, 20, -4, 38);
  T.run(20, { ArrowUp: true });
  let drifted = false,
    maxRate = 0,
    limit = 0;
  const v = p.speed;
  for (let i = 0; i < 30; i++) {
    const y = p.yaw,
      lim = p.stats.grip / p.speed;
    T.run(1, { ArrowUp: true, ArrowRight: true });
    if (p.drifting) drifted = true;
    if (i > 22) {
      maxRate = Math.max(maxRate, Math.abs(wrapAngle(p.yaw - y)) * 60);
      limit = lim;
    }
  }
  return { v, drifted, maxRate, limit, slip: p.slip, off: p.offTrack };
});
check('full lock at speed does not start a slide', !grip.drifted && !grip.off, 'v=' + grip.v.toFixed(1));
check(
  'yaw rate at full lock equals the grip limit',
  near(grip.maxRate, grip.limit, grip.limit * 0.12),
  `${grip.maxRate.toFixed(3)} vs ${grip.limit.toFixed(3)} rad/s`
);

const drift = await page.evaluate(() => {
  T.start({ mode: 'drift', trackId: 'alpine' });
  T.run(250);
  const p = Game.player;
  T.place(p, 20, -5.5, 30);
  T.run(10, { ArrowUp: true });
  const out = { v0: p.spd, events: [] };
  const orig = Game.world.onDrift;
  Game.world.onDrift = (car, evt, d) => {
    out.events.push(evt + (d && d.tier ? d.tier : ''));
    orig(car, evt, d);
  };
  T.run(8, { ArrowUp: true, ArrowRight: true, Space: true });
  out.enteredAfterPull = p.drifting;
  out.dir = p.driftDir;
  T.run(16, { ArrowUp: true, ArrowRight: true });
  out.angHold = p.driftAngle;
  out.ptsHold = p.driftPts;
  out.spdHold = p.spd;
  out.slip = p.slip;
  /* release and counter-steer until the slide ends */
  let frames = 0;
  while (p.drifting && frames < 240) {
    T.run(1, { ArrowUp: true, ArrowLeft: Math.abs(p.driftAngle) > 0.15 });
    frames++;
  }
  out.exitFrames = frames;
  out.turboT = p.turboT;
  out.turboTier = p.turboTier;
  out.score = p.driftScore;
  out.lat = p.lat;
  out.wall = T.wallLimit();
  return out;
});
check(
  'handbrake + steer starts a drift',
  drift.enteredAfterPull && drift.dir === 1,
  JSON.stringify({ in: drift.enteredAfterPull, dir: drift.dir })
);
check('nose points into the turn (positive angle for a right drift)', drift.angHold > 0.3 && drift.angHold < 1.0, drift.angHold.toFixed(2));
check('slide keeps most of its speed', drift.spdHold > drift.v0 * 0.8, `${drift.spdHold.toFixed(1)} of ${drift.v0.toFixed(1)}`);
check(
  'drift ends when straightened, still on the road',
  drift.exitFrames < 240 && Math.abs(drift.lat) < drift.wall - 1,
  JSON.stringify({ frames: drift.exitFrames, lat: +drift.lat.toFixed(1) })
);
check('slide charges at least tier 1', drift.events.includes('tier1'), drift.events.join(','));
check(
  'clean exit fires a turbo and banks points',
  drift.turboT > 0 && drift.score > 0 && drift.events.some((e) => e.startsWith('end')),
  JSON.stringify({ t: drift.turboT, s: drift.score, e: drift.events })
);

const misc = await page.evaluate(() => {
  const out = {};
  T.start({ mode: 'drift', trackId: 'alpine' });
  T.run(250);
  const p = Game.player,
    t = Game.track;
  /* reverse, then throttle */
  T.run(120, { ArrowDown: true });
  out.reverseV = p.speed;
  T.run(150, { ArrowUp: true });
  out.afterThrottleV = p.speed;
  /* standing start on the shoulder */
  p.recover(t);
  const i0 = p.trackIdx;
  p.pos.copy(t.point(i0, t.halfWidth + 1.4));
  p.vel.set(0, 0, 0);
  T.run(2);
  out.offAtStart = p.offTrack;
  T.run(180, { ArrowUp: true });
  out.offV = p.spd;
  /* straight into a barrier */
  T.place(p, 40, 0, 0);
  p.yaw = t.yawAt(p.trackIdx) - Math.PI / 2;
  let maxLat = 0;
  for (let i = 0; i < 300; i++) {
    T.run(1, { ArrowUp: true });
    maxLat = Math.max(maxLat, Math.abs(p.lat));
  }
  out.maxLat = maxLat;
  out.wall = T.wallLimit();
  out.wallV = p.spd;
  out.headingErr = Math.abs(wrapAngle(p.yaw - t.yawAt(p.trackIdx)));
  /* reset key */
  p.pos.copy(t.point(p.trackIdx, 6));
  p.yaw += 2;
  Game.resetPlayer();
  out.resetLat = Math.abs(t.lateral(p.pos.x, p.pos.z, p.trackIdx));
  out.resetHeading = Math.abs(wrapAngle(p.yaw - t.yawAt(p.trackIdx)));
  /* boost pad */
  const pad = t.pads[0];
  const before = (pad.idx - 8 + t.n) % t.n;
  p.recover(t);
  p.trackIdx = before;
  p.pos.copy(t.point(before, pad.lat));
  p.yaw = t.yawAt(before);
  const f = p.forward();
  p.vel.set(f.x * 25, 0, f.z * 25);
  let padHit = false;
  for (let i = 0; i < 90; i++) {
    T.run(1, { ArrowUp: true });
    if (p.padT > 0) padHit = true;
  }
  out.padHit = padHit;
  out.pads = t.pads.length;
  /* nitro */
  p.recover(t);
  T.run(200, { ArrowUp: true });
  const n0 = p.nitro;
  T.run(30, { ArrowUp: true, ShiftLeft: true });
  out.boosting = p.boosting;
  out.nitroUsed = n0 - p.nitro;
  out.finite = [p.pos.x, p.pos.z, p.yaw, p.speed].every(Number.isFinite);
  return out;
});
check('brake from standstill reverses', misc.reverseV < -2, misc.reverseV.toFixed(1));
check('throttle recovers from rolling backwards', misc.afterThrottleV > 5, misc.afterThrottleV.toFixed(1));
check('shoulder counts as off track', misc.offAtStart);
check('car pulls away from standstill on the shoulder', misc.offV > 8, misc.offV.toFixed(1));
check('barrier contains the car', misc.maxLat <= misc.wall + 0.6, `${misc.maxLat.toFixed(2)} vs wall ${misc.wall.toFixed(2)}`);
check(
  'wall assist frees a car driven into the barrier',
  misc.wallV > 6 && misc.headingErr < 0.6,
  JSON.stringify({ v: +misc.wallV.toFixed(1), err: +misc.headingErr.toFixed(2) })
);
check(
  'reset puts the car on the centre line facing forward',
  misc.resetLat < 0.5 && misc.resetHeading < 0.05,
  JSON.stringify({ lat: misc.resetLat, h: misc.resetHeading })
);
check(
  'track has boost pads and driving over one triggers it',
  misc.pads >= 2 && misc.padHit,
  JSON.stringify({ pads: misc.pads, hit: misc.padHit })
);
check('nitro boosts and drains the tank', misc.boosting && misc.nitroUsed > 5, misc.nitroUsed.toFixed(1));
check('state stays finite', misc.finite);

const draft = await page.evaluate(() => {
  T.start({ mode: 'ai', trackId: 'alpine', laps: 1, botCount: 1, difficulty: 1 });
  T.run(250);
  const p = Game.player,
    b = Game.bots[0],
    t = Game.track;
  /* put the player 10 m directly behind the bot, both at speed on the main straight */
  const i = 30,
    seg = t.length / t.n,
    f = t.tangent[i];
  b.recover(t);
  b.trackIdx = i;
  b.pos.copy(t.point(i, 0));
  b.yaw = t.yawAt(i);
  b.vel.set(f.x * 35, 0, f.z * 35);
  const j = i - Math.round(10 / seg);
  p.recover(t);
  p.trackIdx = j;
  p.pos.copy(t.point(j, 0));
  p.yaw = t.yawAt(j);
  p.vel.set(f.x * 35, 0, f.z * 35);
  T.run(50, { ArrowUp: true });
  return { draft: p.draft, gap: p.pos.distanceTo(b.pos) };
});
check(
  'following closely builds slipstream',
  draft.draft > 0.5,
  JSON.stringify({ draft: +draft.draft.toFixed(2), gap: +draft.gap.toFixed(1) })
);
await close();
finish();
