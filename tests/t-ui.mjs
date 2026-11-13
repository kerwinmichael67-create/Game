// Menus and in-race controls through the real DOM: navigation, toggles, pause, reset, camera, rocket start, offline states.
import { open, check, finish, installHelpers } from './harness.mjs';

{
  const { page, close } = await open();
  await page.evaluate(installHelpers);
  check('menu is shown with all tiles', await page.evaluate(() => UI.current === 'menu' && $$('#s-menu .tile').length >= 7));
  check(
    'without the artifact runtime, online play reports offline',
    await page.evaluate(() => Net.unavailable && $('#m-online-status').textContent.trim() === 'Offline')
  );
  for (const [btn, screen, back] of [
    ['#b-garage', 'garage', '#b-garage-back'],
    ['#b-board', 'board', '#b-board-back'],
    ['#b-online', 'online', '#b-online-back'],
    ['#b-quick', 'setup', '#b-setup-back'],
  ]) {
    await page.click(btn);
    const on = await page.evaluate((s) => UI.current === s && !$('#s-' + s).hidden && $$('.screen:not([hidden])').length === 1, screen);
    await page.click(back);
    check(`${screen} opens and Back returns to the menu`, on && (await page.evaluate(() => UI.current === 'menu')));
  }
  await page.click('#b-online');
  check(
    'offline lobby explains itself and disables room buttons',
    await page.evaluate(
      () => !$('#o-notice').hidden && $('#o-notice').textContent.length > 20 && $('#b-create').disabled && $('#b-join').disabled
    )
  );
  await page.click('#b-online-back');
  await page.fill('#nick', '  Ace <b>Driver</b> 1234567  ');
  await page.dispatchEvent('#nick', 'change');
  check(
    'driver name is trimmed, capped at 16 and saved',
    await page.evaluate(
      () =>
        Profile.data.name.length <= 16 &&
        Profile.data.name.startsWith('Ace') &&
        JSON.parse(localStorage.getItem('apex.profile.v1')).name === Profile.data.name
    )
  );
  await page.click('#b-sound');
  await page.click('#b-music');
  await page.click('#b-quality');
  const tog = await page.evaluate(() => ({
    s: $('#b-sound').textContent,
    m: $('#b-music').textContent,
    q: $('#b-quality').textContent,
    ae: Audio.enabled,
    mo: Music.on,
    pq: Profile.data.quality,
    composer: !!Game.world.composer,
  }));
  check(
    'sound, music and graphics toggles flip and persist',
    tog.s === 'Sound: Off' &&
      tog.m === 'Music: Off' &&
      tog.q === 'Graphics: Fast' &&
      !tog.ae &&
      !tog.mo &&
      tog.pq === 'low' &&
      !tog.composer,
    JSON.stringify(tog)
  );
  await page.click('#b-quality');
  check('graphics back to High restores bloom', await page.evaluate(() => Profile.data.quality === 'high' && !!Game.world.composer));

  /* race controls */
  await page.click('#b-quick');
  await page.click('#sel-track button[data-v="alpine"]');
  await page.click('#sel-laps button[data-v="1"]');
  await page.click('#sel-bots button[data-v="3"]');
  await page.click('#b-setup-go');
  await page.waitForFunction(() => Game.state === 'countdown');
  const setup = await page.evaluate(() => ({
    track: Game.track.id,
    laps: Game.laps,
    bots: Game.bots.length,
    hud: !$('#hud').hidden,
    name: Game.player.name,
  }));
  check(
    'setup choices reach the race',
    setup.track === 'alpine' && setup.laps === 1 && setup.bots === 3 && setup.hud,
    JSON.stringify(setup)
  );
  check('custom driver name is used in the race', setup.name.startsWith('Ace'), setup.name);
  /* rocket start: throttle picked up in the last half second */
  const launch = await page.evaluate(() => {
    Game.headless = true;
    while (Game.countdown > 0.3) T.run(1);
    let k = 0;
    while (Game.state === 'countdown' && k++ < 60) T.run(1, { ArrowUp: true });
    return { state: Game.state, turbo: Game.player.turboT, toast: $('#toast').textContent };
  });
  check(
    'late throttle gives a rocket start',
    launch.state === 'racing' && launch.turbo > 0.5 && /PERFECT/.test(launch.toast),
    JSON.stringify(launch)
  );
  await page.evaluate(() => {
    Game.headless = false;
    T.run(30, { ArrowUp: true });
  });
  await page.keyboard.press('Escape');
  check('Escape pauses', await page.evaluate(() => Game.paused && !$('#s-pause').hidden));
  const frozen = await page.evaluate(() => {
    const t = Game.raceTime;
    for (let i = 0; i < 30; i++) Game.frame(1 / 60);
    return Game.raceTime === t;
  });
  check('race clock stops while paused', frozen);
  await page.click('#b-resume');
  check('Resume continues', await page.evaluate(() => !Game.paused && $('#s-pause').hidden));
  const cam0 = await page.evaluate(() => Game.world.camMode);
  await page.keyboard.press('KeyC');
  check(
    'C switches camera and remembers it',
    await page.evaluate((c) => Game.world.camMode !== c && Profile.data.cam === Game.world.camMode, cam0)
  );
  await page.keyboard.press('KeyC');
  await page.evaluate(() => {
    const p = Game.player;
    p.pos.copy(Game.track.point(p.trackIdx, 6.5));
    p.yaw += 2.5;
  });
  await page.keyboard.press('KeyR');
  check(
    'R puts the car back on the road',
    await page.evaluate(() => Math.abs(Game.track.lateral(Game.player.pos.x, Game.player.pos.z, Game.player.trackIdx)) < 0.5)
  );
  await page.click('#pausebtn');
  await page.click('#b-restart');
  await page.waitForFunction(() => Game.state === 'countdown' && !Game.paused);
  check(
    'Restart begins a fresh countdown with the pause screen closed',
    await page.evaluate(() => $('#s-pause').hidden && Game.raceTime === 0)
  );
  await page.keyboard.press('Escape');
  await page.click('#b-quit');
  check(
    'Quit returns to the menu and stops the race',
    await page.evaluate(() => UI.current === 'menu' && Game.state === 'idle' && $('#hud').hidden && $('#s-pause').hidden)
  );
  /* finish a race through the UI and go again */
  await page.click('#b-quick');
  await page.click('#b-setup-go');
  await page.waitForFunction(() => Game.state === 'countdown');
  await page.evaluate(() => {
    Game.headless = true;
    T.autopilot(true);
    T.finishRace();
    Game.autopilot = false;
  });
  await page.waitForSelector('#s-results:not([hidden])');
  const res = await page.evaluate(() => ({
    title: $('#res-title').textContent,
    reward: $('#res-reward').textContent,
    rows: $$('#res-body tr').length,
    me: $$('#res-body tr.me').length,
  }));
  check('results list the grid with the player highlighted', res.rows === 4 && res.me === 1 && /CR/.test(res.reward), JSON.stringify(res));
  await page.click('#b-res-again');
  await page.waitForFunction(() => Game.state === 'countdown' && !Game.results);
  check('Race again starts a new race', await page.evaluate(() => $('#s-results').hidden));
  await page.evaluate(() => {
    Game.stop();
    UI.show('menu');
  });
  await close();
}

/* runtime present but refusing capabilities */
{
  const { page, close } = await open({ mock: true, mockOpts: { offline: true } });
  check(
    'a runtime without room access degrades to offline',
    await page.evaluate(() => Net.unavailable && !Net.room && $('#m-save-status').textContent.includes('browser'))
  );
  await close();
}
finish();
