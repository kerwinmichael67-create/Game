// Game modes end to end: Drift Attack, Time Trial (records + ghost), Championship via the real buttons.
import { open, check, finish, installHelpers } from './harness.mjs';
const { page, close } = await open({ mock: true });
await page.evaluate(installHelpers);
const waitRace = () => page.waitForFunction(() => Game.state !== 'idle' && Game.player, null, { timeout: 15000 });

/* ---- Drift Attack ---- */
await page.click('#b-drift');
check(
  'drift setup hides laps, difficulty and opponents',
  await page.evaluate(() => $('#f-laps').hidden && $('#f-diff').hidden && $('#f-bots').hidden && !$('#f-track').hidden)
);
await page.click('#b-setup-go');
await waitRace();
const drift = await page.evaluate(() => {
  Game.headless = true;
  T.run(250);
  const p = Game.player;
  T.place(p, 20, -5.5, 30);
  T.run(8, { ArrowUp: true, ArrowRight: true, Space: true });
  T.run(16, { ArrowUp: true, ArrowRight: true });
  let k = 0;
  while (p.drifting && k++ < 240) T.run(1, { ArrowUp: true, ArrowLeft: Math.abs(p.driftAngle) > 0.15 });
  const banked = p.driftScore;
  const med = driftMedals(Game.track, Game.laps);
  p.driftScore = med.silver + 10;
  T.autopilot(true);
  T.finishRace();
  const res = Game.results;
  return {
    mode: Game.mode,
    laps: Game.laps,
    cars: Game.cars.length,
    banked,
    med,
    title: res && res.title,
    credits: res && res.credits,
    rows: res && res.rows.map((r) => r.cells.join('|')),
    best: Profile.data.bestDrift.bay,
  };
});
check(
  'drift attack is solo over two laps',
  drift.mode === 'drift' && drift.laps === 2 && drift.cars === 1,
  JSON.stringify({ laps: drift.laps, cars: drift.cars })
);
check('a clean slide banks points', drift.banked > 20, drift.banked);
check('medal targets are ordered', drift.med.bronze < drift.med.silver && drift.med.silver < drift.med.gold, JSON.stringify(drift.med));
check(
  'silver score earns the silver medal and credits',
  drift.title === 'Silver medal' && drift.credits > 250,
  `${drift.title} +${drift.credits}`
);
check('best drift score is stored', drift.best >= drift.med.silver, drift.best);
await page.waitForSelector('#s-results:not([hidden])');
check('results screen shows the medal table', (await page.textContent('#res-body')).includes('Gold'));
await page.click('#b-res-menu');
check('back at the menu after results', await page.evaluate(() => UI.current === 'menu' && Game.state === 'idle'));

/* ---- Time Trial ---- */
await page.click('#b-trial');
await page.click('#sel-laps button[data-v="3"]');
await page.click('#b-setup-go');
await waitRace();
const trial = await page.evaluate(() => {
  Game.headless = true;
  Game.autopilot = false;
  /* drive lap 1 with the AI but as a "real" run so the record and ghost are saved */
  const p = Game.player;
  p.ai = new AIDriver(p, Game.track, DIFFICULTY[2], 9);
  const orig = Input.read.bind(Input);
  Input.read = (out) => {
    p.ai.update(1 / 60, Game.cars, null);
  };
  let ghostSeen = false;
  for (let i = 0; i < 40000 && !Game.results; i++) {
    Game.frame(1 / 60);
    if (Game.ghost && Game.ghost.mesh.visible) ghostSeen = true;
  }
  Input.read = orig;
  const res = Game.results;
  return {
    laps: p.lapTimes,
    best: Profile.data.bestLaps.bay,
    ghostLen: (Profile.data.ghosts.bay || []).length,
    ghostSeen,
    title: res && res.title,
    rows: res && res.rows.length,
    credits: res && res.credits,
  };
});
check('time trial runs three laps solo', trial.laps.length === 3 && trial.rows === 3, JSON.stringify(trial.laps));
check('best lap is recorded', trial.best === Math.min(...trial.laps), trial.best);
check(
  'a ghost is recorded and shown on later laps',
  trial.ghostLen > 50 && trial.ghostSeen,
  JSON.stringify({ len: trial.ghostLen, seen: trial.ghostSeen })
);
check('time trial pays per lap', trial.credits === 180, trial.credits);
await page.waitForSelector('#s-results:not([hidden])');
await page.click('#b-res-menu');

/* ---- Championship ---- */
await page.click('#b-champ');
check(
  'championship setup only asks for difficulty',
  await page.evaluate(() => $('#f-track').hidden && $('#f-laps').hidden && !$('#f-diff').hidden && $('#f-bots').hidden)
);
await page.click('#sel-diff button[data-v="0"]');
await page.click('#b-setup-go');
const rounds = await page.evaluate(() => TRACKS.length);
let lastTitle = '';
for (let round = 1; round <= rounds; round++) {
  await page.waitForFunction((r) => Game.state !== 'idle' && Game.player && UI.champ && UI.champ.round === r - 1 && !Game.results, round, {
    timeout: 15000,
  });
  const r = await page.evaluate(() => {
    Game.headless = true;
    T.autopilot(true);
    T.finishRace();
    Game.autopilot = false;
    return { track: Game.track.id, laps: Game.laps, pos: Game.results.pos, bots: Game.bots.map((b) => b.name) };
  });
  await page.waitForSelector('#s-results:not([hidden])');
  const scr = await page.evaluate(() => ({
    eyebrow: $('#res-eyebrow').textContent,
    title: $('#res-title').textContent,
    head: $$('#res-head th').map((t) => t.textContent),
    againHidden: $('#b-res-again').hidden,
    again: $('#b-res-again').textContent,
    rows: $$('#res-body tr').length,
  }));
  check(
    `round ${round}: results show round number and six drivers`,
    scr.eyebrow.includes(`round ${round} of ${rounds}`) && scr.rows === 6,
    JSON.stringify(scr)
  );
  if (round < rounds) {
    check(
      `round ${round}: points columns and a next-round button`,
      scr.head.includes('Points') && !scr.againHidden && scr.again.startsWith('Next round'),
      scr.again
    );
    await page.click('#b-res-again');
  } else {
    check(
      'final round shows the championship table without a next button',
      scr.head.length === 3 && scr.againHidden,
      JSON.stringify(scr.head)
    );
    lastTitle = scr.title;
  }
}
check('championship ends with a title screen', /Champion/.test(lastTitle), lastTitle);
const purse = await page.evaluate(() => ({
  credits: Profile.data.credits,
  trophies: Profile.data.trophies,
  champ: UI.champ && UI.champ.round,
}));
check('championship state is complete', purse.champ === rounds, JSON.stringify(purse));
await page.click('#b-res-menu');
check('menu after the championship', await page.evaluate(() => UI.current === 'menu' && UI.champ === null));
await close();
finish();
