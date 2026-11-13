// Full AI races on every circuit, player on autopilot: they finish, laps count, nobody escapes the barriers.
import { open, check, finish, installHelpers } from './harness.mjs';
const { page, close } = await open();
await page.evaluate(installHelpers);
const tracks = await page.evaluate(() => TRACKS.map((t) => t.id));
check('at least three circuits', tracks.length >= 3, tracks.join(','));
for (const [k, id] of tracks.entries()) {
  const diff = k % 3;
  const r = await page.evaluate(
    ({ id, diff }) => {
      T.start({ mode: 'ai', trackId: id, laps: 2, difficulty: diff, botCount: 5 });
      T.autopilot(true);
      let outside = 0,
        nan = 0;
      const wall = T.wallLimit();
      let frames = 0;
      for (; frames < 40000 && !Game.results; frames++) {
        Game.frame(1 / 60);
        if (frames % 4 === 0)
          for (const c of Game.cars) {
            if (Math.abs(c.lat) > wall + 0.6) outside++;
            if (!Number.isFinite(c.pos.x + c.pos.z + c.yaw + c.speed)) nan++;
          }
      }
      const res = Game.results,
        p = Game.player;
      return {
        frames,
        finished: !!res,
        pos: res && res.pos,
        n: res && res.n,
        credits: res && res.credits,
        rows: res && res.rows.length,
        laps: p.lapTimes,
        botLaps: Game.bots.map((b) => b.lapTimes.length),
        botBest: Game.bots.map((b) => b.bestLap),
        outside,
        nan,
        pads: Game.track.pads.length,
        lengthKm: Game.track.length / 1000,
      };
    },
    { id, diff }
  );
  const tag = `[${id} d${diff}] `;
  check(tag + 'race produces results', r.finished, `frames=${r.frames}`);
  check(tag + 'player completes both laps', r.laps && r.laps.length === 2, JSON.stringify(r.laps));
  check(tag + 'lap times are plausible', r.laps && r.laps.every((t) => t > 25000 && t < 150000), JSON.stringify(r.laps));
  check(tag + 'every bot completes at least one lap', r.botLaps && r.botLaps.every((n) => n >= 1), JSON.stringify(r.botLaps));
  check(tag + 'no car leaves the barriers', r.outside === 0, r.outside);
  check(tag + 'no NaN state', r.nan === 0, r.nan);
  check(
    tag + 'results table covers the grid and pays credits',
    r.rows === 6 && r.credits > 0 && r.pos >= 1 && r.pos <= 6,
    JSON.stringify({ rows: r.rows, credits: r.credits, pos: r.pos })
  );
}
await close();
finish();
