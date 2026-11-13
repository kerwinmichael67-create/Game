// Phone layout: no horizontal scrolling on any screen, touch buttons drive and drift, default quality is Fast.
import { open, check, finish, installHelpers } from './harness.mjs';

for (const landscape of [false, true]) {
  const tag = landscape ? '[landscape] ' : '[portrait] ';
  const { page, close } = await open({ phone: true, landscape, mock: true });
  await page.evaluate(installHelpers);
  const fits = (label) =>
    page
      .evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
      .then((o) => check(tag + label + ' fits the screen width', o.sw <= o.cw + 1, JSON.stringify(o)));
  check(tag + 'touch device detected with Fast graphics', await page.evaluate(() => Input.isTouch && Profile.data.quality === 'low'));
  await fits('menu');
  for (const [btn, screen, back] of [
    ['#b-garage', 'garage', '#b-garage-back'],
    ['#b-board', 'board', '#b-board-back'],
    ['#b-online', 'online', '#b-online-back'],
    ['#b-drift', 'setup', null],
  ]) {
    await page.tap(btn);
    await page.waitForFunction((s) => UI.current === s, screen);
    await fits(screen);
    const scroll = await page.evaluate((s) => {
      const el = $('#s-' + s);
      return { fits: el.scrollHeight <= el.clientHeight + 1, scrollable: getComputedStyle(el).overflowY !== 'hidden' };
    }, screen);
    check(tag + screen + ' is fully reachable', scroll.fits || scroll.scrollable, JSON.stringify(scroll));
    if (back) await page.tap(back);
  }
  await page.tap('#b-setup-go');
  await page.waitForFunction(() => Game.state === 'countdown');
  const r = await page.evaluate(() => {
    Game.headless = true;
    const run = (n, t) => {
      Object.assign(Input.touch, { left: 0, right: 0, gas: 0, brake: 0, nitro: 0, drift: 0 }, t);
      for (let i = 0; i < n; i++) Game.frame(1 / 60);
    };
    run(250, {});
    run(240, { gas: 1 });
    const v = Game.player.speed;
    run(10, { gas: 1, right: 1, drift: 1 });
    run(30, { gas: 1, right: 1 });
    const out = { v, drifting: Game.player.drifting, ang: Game.player.driftAngle, touchClass: document.body.classList.contains('touch') };
    Game.headless = false;
    run(3, { gas: 1 });
    out.buttons = ['#t-left', '#t-right', '#t-gas', '#t-brake', '#t-nitro', '#t-drift'].map((id) => {
      const b = $(id).getBoundingClientRect();
      return b.width >= 44 && b.height >= 44 && b.left >= 0 && b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1;
    });
    out.hudFits = ['.hud-tl', '.hud-tr', '.hud-bl', '.hud-br'].every((s) => {
      const b = $(s).getBoundingClientRect();
      return b.left >= -1 && b.right <= innerWidth + 1;
    });
    return out;
  });
  check(tag + 'gas button accelerates', r.v > 15, r.v.toFixed(1));
  check(tag + 'drift button starts a slide', r.drifting && r.ang > 0.2, JSON.stringify({ d: r.drifting, a: +r.ang.toFixed(2) }));
  check(tag + 'touch controls are on screen and at least 44px', r.touchClass && r.buttons.every(Boolean), JSON.stringify(r.buttons));
  check(tag + 'HUD stays inside the viewport', r.hudFits);
  await fits('race');
  await page.evaluate(() => {
    Game.headless = true;
    T.autopilot(true);
    T.finishRace();
    Game.autopilot = false;
  });
  await page.waitForSelector('#s-results:not([hidden])');
  await fits('results');
  await close();
}
finish();
