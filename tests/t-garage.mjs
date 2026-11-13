// Garage: buying and tuning cars, stats, paint; migration of a v1 save delivered as a frozen db snapshot; leaderboard rows.
import { open, check, finish, installHelpers } from './harness.mjs';

/* ---- purchases ---- */
{
  const { page, close } = await open({ mock: true });
  await page.evaluate(installHelpers);
  await page.click('#b-garage');
  await page.waitForSelector('#preview canvas');
  const g0 = await page.evaluate(() => {
    Profile.data.credits = 20000;
    Profile.save();
    Garage.render();
    return { chips: $$('.car-chip').map((c) => c.textContent), models: CAR_MODELS.map((m) => m.id) };
  });
  check('garage lists every car model', g0.chips.length === g0.models.length && g0.chips.length >= 4, g0.chips.join(' / '));
  await page.click('.car-chip:nth-child(3)');
  const view = await page.evaluate(() => ({
    name: $('#g-car-name').textContent,
    buyHidden: $('#b-buy-car').hidden,
    car: Profile.data.car,
    upg: $$('#upgrades .upg').length,
  }));
  check(
    'viewing an unowned car offers to buy it and hides tuning',
    !view.buyHidden && view.car === 'vanta' && view.upg === 0,
    JSON.stringify(view)
  );
  const before = await page.evaluate(() => Profile.data.credits);
  await page.click('#b-buy-car');
  await page.click('#upgrades .upg:nth-child(1) button');
  await page.click('#upgrades .upg:nth-child(3) button');
  const after = await page.evaluate(() => {
    const m = CAR_MODELS[2];
    return {
      credits: Profile.data.credits,
      car: Profile.data.car,
      owns: Profile.owns(m.id),
      up: Profile.up(m.id),
      price: m.price,
      costs: UPGRADES[0].costs[0] + UPGRADES[2].costs[0],
      stock: carStats({}, m.id),
      tuned: Profile.stats(m.id),
      stored: JSON.parse(localStorage.getItem('apex.profile.v1')).cars[m.id],
    };
  });
  check(
    'buying deducts the price and selects the car',
    after.owns && after.car === 'brute' && before - after.credits === after.price + after.costs,
    JSON.stringify({ spent: before - after.credits, expected: after.price + after.costs })
  );
  check(
    'upgrades apply to that car only and raise its stats',
    after.up.engine === 1 && after.up.tires === 1 && after.tuned.topSpeed > after.stock.topSpeed && after.tuned.grip > after.stock.grip,
    JSON.stringify(after.up)
  );
  check('purchase is persisted', after.stored && after.stored.up.engine === 1);
  await page.click('.car-chip:nth-child(1)');
  check('clicking an owned car selects it', await page.evaluate(() => Profile.data.car === 'vanta' && Profile.up().engine === 0));
  await page.click('#swatches .swatch:nth-child(2)');
  check('paint choice is saved', await page.evaluate(() => Profile.data.paint === PAINTS[1].id));
  const stats = await page.evaluate(() =>
    CAR_MODELS.map((m) => {
      const s = carStats({}, m.id),
        f = carStats({ engine: 5, turbo: 5, tires: 5, nitro: 5 }, m.id);
      return { id: m.id, top: s.topSpeed, fullTop: f.topSpeed, grip: s.grip, accel: s.accel };
    })
  );
  check(
    'every model has sane stats and upgrades help',
    stats.every((s) => s.top > 40 && s.top < 80 && s.fullTop > s.top + 10 && s.grip > 15 && s.accel > 10),
    JSON.stringify(stats)
  );
  await page.click('#b-garage-back');
  await close();
}

/* ---- v1 save migration through a frozen snapshot ---- */
{
  const { page, close } = await open({ mock: true });
  const out = await page.evaluate(async () => {
    const v1 = {
      bestLaps: { bay: 62963 },
      cam: 0,
      credits: 181,
      name: 'Tester',
      paint: 'ember',
      quality: 'high',
      races: 1,
      updatedAt: Date.now() + 5000,
      upgrades: { engine: 1, nitro: 0, tires: 0, turbo: 0 },
      wins: 0,
    };
    __mock.db._store.set('data/users/' + __mock.UID + '/profile', v1);
    Profile.data.updatedAt = 0;
    await Profile.connect(__mock.db, Net.user);
    const migrated = JSON.parse(JSON.stringify(Profile.data));
    let err = null;
    try {
      Profile.data.bestLaps.neon = 50000;
      Profile.data.credits = 5000;
      Profile.buyUpgrade('engine');
      Profile.buyCar('kite');
      Profile.data.bestDrift.bay = 1234;
      Profile.save();
      Profile.pushRecord();
    } catch (e) {
      err = String(e);
    }
    await new Promise((r) => setTimeout(r, 3200));
    return {
      migrated,
      err,
      rec: __mock.db._store.get('records/' + __mock.UID),
      remote: __mock.db._store.get('data/users/' + __mock.UID + '/profile'),
    };
  });
  check(
    'v1 upgrades move to the starter car',
    out.migrated.cars && out.migrated.cars.vanta.up.engine === 1 && !('upgrades' in out.migrated) && out.migrated.credits === 181,
    JSON.stringify(out.migrated.cars)
  );
  check('synced profile stays writable', out.err === null, out.err);
  check(
    'personal bests are published to the shared board',
    out.rec && out.rec.laps.bay === 62963 && out.rec.laps.neon === 50000 && out.rec.drift.bay === 1234 && out.rec.name === 'Tester',
    JSON.stringify(out.rec)
  );
  check(
    'remote profile is updated without ghosts',
    out.remote && out.remote.cars.kite && !('ghosts' in out.remote),
    out.remote && Object.keys(out.remote).join(',')
  );
  /* leaderboard screen */
  await page.evaluate(() => {
    __mock.db._store.set('records/u_aaa', { name: 'Rae', laps: { bay: 52110 }, drift: { bay: 15400 } });
    __mock.db._store.set('records/u_bbb', { name: '<b>x</b>', laps: { bay: 99990 }, drift: {} });
  });
  await page.click('#b-board');
  await page.waitForFunction(() => UI.boardData && $$('#lb-body tr').length >= 3);
  const board = await page.evaluate(() => ({
    status: $('#lb-status').textContent.trim(),
    rows: $$('#lb-body tr').map((r) => r.textContent),
    html: $('#lb-body').innerHTML.includes('<b>x</b>'),
  }));
  check(
    'leaderboard sorts fastest first and marks the player',
    board.rows[0].includes('Rae') && board.rows[1].includes('Tester') && board.status === 'Shared board',
    JSON.stringify(board.rows)
  );
  check('names from other players are rendered as text', !board.html);
  await page.click('#lb-kind button[data-v="drift"]');
  const d = await page.evaluate(() => $$('#lb-body tr').map((r) => r.textContent));
  check('drift board sorts highest first', d[0].includes('Rae') && d[0].includes('15,400'), JSON.stringify(d));
  await close();
}
finish();
