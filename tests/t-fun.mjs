// The fun layer: style rewards (overtakes, close passes, slingshots, clean laps, combo), pickups (coins and
// nitro canisters), Knockout mode and the rolling challenges.
import { open, check, finish, installHelpers } from './harness.mjs';
const { page, close, errors } = await open();
await page.evaluate(installHelpers);

/* ---------- style ---------- */
const style = await page.evaluate(() => {
  T.start({ mode: 'ai', trackId: 'bay', laps: 3, botCount: 3, difficulty: 0 });
  T.run(250);
  const p = Game.player,
    b = Game.bots[0],
    out = { on: Game.styleOn, state: Game.state };
  /* park the other bots out of the way so only one car is being passed */
  const stage = (lat, botSpeed = 18) => {
    Game.bots.forEach((o, k) => {
      if (o !== b) T.place(o, 300 + k * 20, 0, 0);
    });
    T.place(b, 22, 0, botSpeed);
    T.place(p, 19, lat, 46);
    Style.prev.clear();
    p.hitT = b.hitT = 0;
  };
  const pass = () => {
    const before = Style.stats.overtakes;
    let k = 0;
    while (Style.stats.overtakes === before && k++ < 240) T.run(1, { ArrowUp: true });
    return k;
  };
  /* 1. a close pass */
  Style.reset();
  p.nitro = 10;
  stage(2.6);
  out.closeFrames = pass();
  out.close = { ...Style.stats, score: Style.score, nitro: p.nitro, combo: Style.combo };
  /* 2. a wide pass straight after: plain overtake, and the combo multiplies it */
  stage(6);
  pass();
  out.wide = { ...Style.stats, score: Style.score, combo: Style.combo, mult: Style.mult() };
  /* 3. contact while passing: counted, not rewarded */
  const s0 = Style.score;
  stage(6);
  let k = 0;
  const n0 = Style.stats.overtakes;
  while (Style.stats.overtakes === n0 && k++ < 240) {
    p.hitT = 0.3;
    T.run(1, { ArrowUp: true });
  }
  out.shove = { overtakes: Style.stats.overtakes - n0, gained: Style.score - s0 };
  /* 4. out of a slipstream: slingshot */
  Style.reset();
  stage(6);
  Style.draftAt = Game.raceTime;
  pass();
  out.sling = { ...Style.stats, score: Style.score };
  /* 5. the combo runs out, and a hit breaks it */
  Style.reset();
  Style.award(Game, 'overtake');
  Style.award(Game, 'overtake');
  out.comboUp = Style.combo;
  T.place(p, 40, 0, 20);
  T.run(Math.ceil(COMBO_WINDOW * 60) + 5, { ArrowUp: true });
  out.comboAfterWait = Style.combo;
  Style.award(Game, 'overtake');
  Style.award(Game, 'overtake');
  p.hitT = 0.8;
  T.run(1, { ArrowUp: true });
  out.comboAfterHit = Style.combo;
  /* 6. clean lap bonus only for a lap without hits */
  Style.reset();
  p.dirty = false;
  Style.lap(Game, p);
  const clean1 = Style.stats.cleanLaps;
  p.dirty = true;
  Style.lap(Game, p);
  out.clean = [clean1, Style.stats.cleanLaps, p.dirty];
  /* 7. being passed pays nothing */
  Style.reset();
  T.place(b, 18, 5, 46);
  T.place(p, 24, 0, 16);
  Style.prev.clear();
  T.run(120);
  out.passed = { ...Style.stats, score: Style.score };
  /* a wall hit marks the lap dirty */
  T.place(p, 60, 0, 30);
  p.dirty = false;
  p.yaw += 1.2;
  const f = p.forward();
  p.vel.set(f.x * 30, 0, f.z * 30);
  T.run(60, { ArrowUp: true });
  out.wallDirty = p.dirty;
  /* the HUD shows the popup and the combo chip */
  Style.reset();
  T.place(p, 40, 0, 30);
  Game.headless = false;
  Style.award(Game, 'close');
  Style.award(Game, 'overtake');
  Game.frame(1 / 60);
  out.hud = { lines: $$('#style-feed .style-line').length, text: $('#style-feed').textContent, combo: !$('#style-combo').hidden, pill: !$('#h-style').hidden, pillText: $('#h-style-v').textContent };
  Game.headless = true;
  return out;
});
check('style is active in a race', style.on && style.state === 'racing');
check('a close pass is recognised', style.close.overtakes === 1 && style.close.nearMisses === 1, JSON.stringify(style.close));
check('a close pass pays points and nitro', style.close.score === 160 && style.close.nitro > 20, `score ${style.close.score}, nitro ${style.close.nitro.toFixed(1)}`);
check('a wide pass is a plain overtake', style.wide.overtakes === 2 && style.wide.nearMisses === 1, JSON.stringify(style.wide));
check('moves in quick succession build a combo', style.wide.combo === 1 && style.wide.mult === 1.5 && style.wide.score === 160 + 150, JSON.stringify(style.wide));
check('shoving past counts as a pass but earns nothing', style.shove.overtakes === 1 && style.shove.gained === 0, JSON.stringify(style.shove));
check('passing out of a slipstream is a slingshot', style.sling.slingshots === 1 && style.sling.score === 200, JSON.stringify(style.sling));
check('the combo expires after its window', style.comboUp === 1 && style.comboAfterWait === 0, `${style.comboUp} then ${style.comboAfterWait}`);
check('a hit breaks the combo', style.comboAfterHit === 0, style.comboAfterHit);
check('clean lap bonus only without contact', style.clean[0] === 1 && style.clean[1] === 1 && style.clean[2] === false, style.clean.join(','));
check('being overtaken pays nothing', style.passed.overtakes === 0 && style.passed.score === 0, JSON.stringify(style.passed));
check('hitting a wall spoils the clean lap', style.wallDirty === true);
check('HUD shows style popups, combo and score', style.hud.lines === 2 && /CLOSE PASS/.test(style.hud.text) && style.hud.combo && style.hud.pill, JSON.stringify(style.hud));

/* ---------- pickups ---------- */
const pk = await page.evaluate(() => {
  T.start({ mode: 'ai', trackId: 'alpine', laps: 3, botCount: 3, difficulty: 0, seed: 11 });
  T.run(250);
  const t = Game.track,
    p = Game.player,
    out = {};
  const coins = Pickups.items.filter((i) => i.kind === 'coin'),
    cans = Pickups.items.filter((i) => i.kind === 'can');
  out.coins = coins.length;
  out.cans = cans.length;
  /* all of them on the tarmac, floating just above it, clear of the grid and of the pads */
  let offRoad = 0,
    badHeight = 0,
    onGrid = 0,
    onPad = 0;
  for (const it of Pickups.items) {
    const i = t.nearest(it.x, it.z),
      lat = t.lateral(it.x, it.z, i),
      h = it.y - t.surface(it.x, it.z, i);
    if (Math.abs(lat) > t.halfWidth - 0.8) offRoad++;
    if (h < 0.5 || h > 1.3) badHeight++;
    if (i * t.seg < 60 || (t.n - i) * t.seg < 40) onGrid++;
    if (t.pads.some((q) => Math.min(Math.abs(q.idx - i), t.n - Math.abs(q.idx - i)) * t.seg < 12 && Math.abs(q.lat - lat) < q.half + 1)) onPad++;
  }
  Object.assign(out, { offRoad, badHeight, onGrid, onPad });
  out.meshes = [Pickups.coins.count, Pickups.cans.count, !!Pickups.group.parent];
  /* drive through a coin */
  Game.bots.forEach((o, k) => T.place(o, 5 + k * 3, 0, 0));
  Style.reset();
  const c = coins[3],
    ci = t.nearest(c.x, c.z);
  T.place(p, ci, t.lateral(c.x, c.z, ci), 20);
  T.run(2, { ArrowUp: true });
  out.coinTaken = !c.alive;
  out.coinStat = Style.stats.coins;
  out.coinScore = Style.score;
  /* a new lap brings the coins back */
  Pickups.lap();
  out.coinBack = c.alive;
  /* a canister fills nitro and returns after a while */
  const k = cans[0],
    ki = t.nearest(k.x, k.z);
  p.nitro = 5;
  T.place(p, ki, t.lateral(k.x, k.z, ki), 20);
  T.run(2, { ArrowUp: true });
  out.canTaken = !k.alive;
  out.canNitro = p.nitro;
  T.place(p, (ki + 200) % t.n, 0, 10);
  T.run(60 * 13);
  out.canBack = k.alive;
  /* rivals take canisters too, but never coins */
  const b = Game.bots[0];
  b.nitro = 0;
  T.place(b, ki, t.lateral(k.x, k.z, ki), 5);
  const coinsBefore = Pickups.items.filter((i) => i.kind === 'coin' && i.alive).length;
  T.place(Game.bots[1], t.nearest(coins[10].x, coins[10].z), t.lateral(coins[10].x, coins[10].z, t.nearest(coins[10].x, coins[10].z)), 5);
  T.run(2);
  out.botCan = [!k.alive, b.nitro];
  out.botCoin = coinsBefore - Pickups.items.filter((i) => i.kind === 'coin' && i.alive).length;
  /* same seed, same layout */
  const sig = Pickups.items.map((i) => i.kind + i.idx + ':' + i.x.toFixed(1)).join('|');
  T.start({ mode: 'ai', trackId: 'alpine', laps: 3, botCount: 3, difficulty: 0, seed: 99 });
  out.sameLayout = sig === Pickups.items.map((i) => i.kind + i.idx + ':' + i.x.toFixed(1)).join('|');
  /* none in time trial or drift attack */
  T.start({ mode: 'trial', trackId: 'alpine', laps: 1 });
  out.trial = [Pickups.items.length, Game.styleOn, !!Pickups.group];
  T.start({ mode: 'drift', trackId: 'alpine' });
  out.drift = [Pickups.items.length, Game.styleOn];
  return out;
});
check('coins and canisters are laid out', pk.coins >= 40 && pk.cans >= 2, `${pk.coins} coins, ${pk.cans} canisters`);
check('pickups sit on the road, clear of grid and pads', pk.offRoad === 0 && pk.badHeight === 0 && pk.onGrid === 0 && pk.onPad === 0, JSON.stringify({ offRoad: pk.offRoad, badHeight: pk.badHeight, onGrid: pk.onGrid, onPad: pk.onPad }));
check('pickup meshes are in the scene', pk.meshes[0] === pk.coins && pk.meshes[1] === pk.cans && pk.meshes[2]);
check('driving through a coin collects it', pk.coinTaken && pk.coinStat === 1 && pk.coinScore === 10, `${pk.coinTaken} ${pk.coinStat} ${pk.coinScore}`);
check('coins return on a new lap', pk.coinBack);
check('a canister fills the nitro', pk.canTaken && pk.canNitro >= 39, `nitro ${pk.canNitro}`);
check('a canister returns after a while', pk.canBack);
check('rivals take canisters but not coins', pk.botCan[0] && pk.botCan[1] >= 35 && pk.botCoin === 0, JSON.stringify([pk.botCan, pk.botCoin]));
check('the layout depends on the circuit, not the race seed', pk.sameLayout);
check('time trial and drift attack have no pickups or style', pk.trial[0] === 0 && !pk.trial[1] && !pk.trial[2] && pk.drift[0] === 0 && !pk.drift[1], JSON.stringify([pk.trial, pk.drift]));

/* ---------- knockout ---------- */
const koWin = await page.evaluate(() => {
  const credits0 = Profile.data.credits;
  T.start({ mode: 'knockout', trackId: 'neon', botCount: 5, difficulty: 0, seed: 5 });
  const out = { laps: Game.laps, total: Game.cars.length, ko: !!Game.ko, outs: [] };
  T.autopilot(true, 2);
  /* one rendered frame mid-race for the HUD */
  let n = Game.cars.length,
    frames = 0,
    hud = null,
    minPos = 9,
    maxPos = 0;
  while (!Game.results && frames++ < 60 * 400) {
    Game.frame(1 / 60);
    if (Game.cars.length !== n) {
      n = Game.cars.length;
      out.outs.push(+Game.raceTime.toFixed(2));
    }
    if (Game.state === 'racing') {
      minPos = Math.min(minPos, Game.playerPos);
      maxPos = Math.max(maxPos, Game.playerPos);
    }
    if (!hud && Game.state === 'racing' && Game.raceTime > 12) {
      Game.headless = false;
      Game.frame(1 / 60);
      hud = { ko: !$('#h-ko').hidden, t: $('#h-ko-t').textContent, laps: $('#h-laps').textContent, total: $('#h-total').textContent };
      Game.headless = true;
    }
  }
  const r = Game.results;
  return Object.assign(out, { hud, minPos, maxPos, frames, res: r && { pos: r.pos, n: r.n, title: r.title, win: r.win, rows: r.rows.map((x) => x.cells.join('/')), credits: r.credits, mode: r.mode }, gained: Profile.data.credits - credits0, left: Game.cars.length });
});
check('knockout starts with a clock and no lap limit', koWin.ko && koWin.laps === 999 && koWin.total === 6);
check('HUD shows the knockout clock', koWin.hud && koWin.hud.ko && /^0:\d\d$/.test(koWin.hud.t) && koWin.hud.laps === '∞' && koWin.hud.total === '6', JSON.stringify(koWin.hud));
check(
  'a rival goes out at 30 s, then every 20 s',
  koWin.outs.length === 5 && koWin.outs.every((t, i) => Math.abs(t - (30 + 20 * i)) < 0.06),
  koWin.outs.join(', ')
);
check('the survivor wins', koWin.res && koWin.res.pos === 1 && koWin.res.win && /Last car standing/.test(koWin.res.title) && koWin.left === 1, JSON.stringify(koWin.res && [koWin.res.pos, koWin.res.title, koWin.left]));
check('results list the whole field in order', koWin.res && koWin.res.rows.length === 6 && /Survived/.test(koWin.res.rows[0]) && /^6\//.test(koWin.res.rows[5]) && /0:30/.test(koWin.res.rows[5]), koWin.res && koWin.res.rows.join(' | '));
check('knockout pays credits', koWin.res && koWin.res.credits > 300 && koWin.gained === koWin.res.credits, `${koWin.res && koWin.res.credits} / ${koWin.gained}`);

const koLose = await page.evaluate(() => {
  T.start({ mode: 'knockout', trackId: 'bay', botCount: 3, difficulty: 1, seed: 8 });
  let frames = 0,
    danger = false,
    outAt = null;
  /* the player never leaves the grid */
  while (!Game.results && frames++ < 60 * 60) {
    Game.frame(1 / 60);
    if (Game.ko && Game.ko.danger) danger = true;
    if (Game.player.out && outAt == null) outAt = Game.raceTime;
  }
  const r = Game.results;
  return { danger, outAt, endAt: Game.raceTime, res: r && { pos: r.pos, n: r.n, title: r.title, win: r.win, last: r.rows[r.rows.length - 1].cells.join('/'), me: r.rows.findIndex((x) => x.me) }, cars: Game.cars.length };
});
check('sitting in last place raises the danger flag', koLose.danger);
check('the player is eliminated when last at the bell', koLose.outAt != null && Math.abs(koLose.outAt - 30) < 0.06, koLose.outAt);
check('the race ends soon after the player is out', koLose.endAt - koLose.outAt < 2.2, (koLose.endAt - koLose.outAt).toFixed(2));
check('result reports the place', koLose.res && koLose.res.pos === 4 && koLose.res.n === 4 && /Knocked out: 4th/.test(koLose.res.title) && !koLose.res.win && koLose.res.me === 3, JSON.stringify(koLose.res));

/* ---------- challenges ---------- */
const goals = await page.evaluate(() => {
  const out = {};
  Profile.data.goals = null;
  const list = Goals.ensure();
  out.three = list.length;
  out.distinct = new Set(list.map((g) => g.id)).size;
  out.texts = list.map((g) => Goals.text(g));
  /* half way, then over the line */
  const g = list[0],
    d = Goals.def(g),
    credits0 = Profile.data.credits;
  const stat = (v) => ({ [d.stat]: d.id === 'ko' ? 1 : v });
  let first = [];
  if (!d.best && d.id !== 'ko') {
    first = Goals.apply(stat(Math.floor(g.n / 2)));
    out.half = g.p;
  }
  const done = Goals.apply(stat(g.n));
  out.firstDone = first.length;
  out.done = done.map((x) => x.text + ':' + x.reward);
  out.paid = Profile.data.credits - credits0;
  out.reward = d.reward;
  out.after = Profile.data.goals.list.length;
  out.replaced = !Profile.data.goals.list.some((x) => x === g);
  out.notRepeated = !Profile.data.goals.list.some((x) => x.id === g.id);
  /* nothing happens on an empty race */
  const before = JSON.stringify(Profile.data.goals.list);
  out.idle = Goals.apply({}).length === 0 && JSON.stringify(Profile.data.goals.list) === before;
  /* survives a save and load */
  Profile.save();
  const saved = JSON.stringify(Profile.data.goals);
  Profile.load();
  out.persist = JSON.stringify(Profile.data.goals) === saved;
  /* a knockout goal is met by placing, not by adding up */
  const P = { credits: 0, goals: { seq: 0, list: [{ id: 'ko', n: 3, p: 0 }, { id: 'coins', n: 60, p: 0 }, { id: 'style', n: 1500, p: 0 }] } };
  const a = Goals.apply({ koFinal: 5, coins: 20, style: 900 }, P).length,
    b = Goals.apply({ koFinal: 0, coins: 20, style: 1200 }, P).length,
    cgoal = P.goals.list.find((x) => x.id === 'coins').p,
    sgoal = P.goals.list.find((x) => x.id === 'style').p,
    c = Goals.apply({ koFinal: 3, coins: 20, style: 1600 }, P);
  out.rules = { a, b, cgoal, sgoal, c: c.map((x) => x.text), credits: P.credits };
  /* the menu shows them */
  UI.show('menu');
  out.menu = $$('#m-goals .goal').length;
  out.menuText = $('#m-goals').textContent.length > 30;
  /* and the results screen lists what was completed, with the reward in the total */
  UI.showResults({ mode: 'ai', pos: 1, n: 4, credits: 500, title: 'Victory', note: '', head: ['Pos', 'Driver'], rows: [{ cells: [1, 'You'], me: true }], win: false, goals: [{ text: 'Win a race', reward: 500 }] });
  out.results = { rows: $$('#res-goals .goal-done').length, shown: !$('#res-goals').hidden, reward: $('#res-reward').textContent };
  UI.show('menu');
  return out;
});
check('three distinct challenges are on the board', goals.three === 3 && goals.distinct === 3 && goals.texts.every((t) => t.length > 5), goals.texts.join(' | '));
check('completing a challenge pays its reward once', goals.done.length === 1 && goals.firstDone === 0 && goals.paid === goals.reward, `${goals.done.join()} paid ${goals.paid}`);
check('a finished challenge is replaced by a different one', goals.after === 3 && goals.replaced && goals.notRepeated);
check('a race with nothing to show changes nothing', goals.idle);
check('challenges survive save and load', goals.persist);
check(
  'placing goals, single-race bests and running totals follow their own rules',
  goals.rules.a === 0 && goals.rules.b === 0 && goals.rules.cgoal === 40 && goals.rules.sgoal === 1200 && goals.rules.c.length === 3 && goals.rules.credits === 450 + 300 + 400,
  JSON.stringify(goals.rules)
);
check('the menu lists the challenges', goals.menu === 3 && goals.menuText);
check('results show completed challenges and add the reward', goals.results.rows === 1 && goals.results.shown && goals.results.reward === '+1,000 CR', JSON.stringify(goals.results));

/* ---------- menu and setup ---------- */
await page.evaluate(() => UI.show('menu'));
await page.click('#b-knockout');
const setup = await page.evaluate(() => ({ cur: UI.current, laps: $('#f-laps').hidden, bots: $('#f-bots').hidden, diff: $('#f-diff').hidden, go: $('#b-setup-go').textContent, title: $('#setup-eyebrow').textContent }));
check('the Knockout tile opens its setup', setup.cur === 'setup' && setup.laps && !setup.bots && !setup.diff && /knockout/i.test(setup.go) && setup.title === 'Knockout', JSON.stringify(setup));
await page.click('#b-setup-go');
await page.waitForFunction(() => Game.state === 'countdown', null, { timeout: 20000 });
const started = await page.evaluate(() => ({ mode: Game.mode, cars: Game.cars.length, ko: !!Game.ko, pickups: Pickups.items.length > 0 }));
check('starting from the menu runs a knockout race', started.mode === 'knockout' && started.ko && started.cars >= 4 && started.pickups, JSON.stringify(started));

/* a normal race pays style and coin credits at the flag */
const pay = await page.evaluate(() => {
  T.start({ mode: 'ai', trackId: 'bay', laps: 1, botCount: 3, difficulty: 0, seed: 2 });
  T.autopilot(true, 2);
  T.finishRace(30000);
  const r = Game.results;
  return { note: r.note, style: r.style, coins: Style.stats.coins, credits: r.credits, overtakes: Style.stats.overtakes, goals: r.goals.length };
});
check('a race pays style and coin credits', pay.style > 0 && /Style/.test(pay.note) && (pay.coins === 0 || /Coins/.test(pay.note)), JSON.stringify(pay));
check('starting last and winning means overtakes were counted', pay.overtakes >= 1, pay.overtakes);

check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 300));
await close();
finish();
