// apex-circuit.txt is the whole game as one data: URL for the address bar. It has to boot, reach the menu and
// run a race there, where there is no localStorage and no artifact runtime.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, finish, chromium, ROOT, THREE_DIR } from './harness.mjs';

const url = readFileSync(path.join(ROOT, 'apex-circuit.txt'), 'utf8');
const shape = new RegExp('^data:text/html;charset=utf-8;base64,[A-Za-z0-9+/=]+$');
check('the file is a single data URL', shape.test(url), url.slice(0, 40) + '... ' + url.length + ' chars');
check('short enough to paste into an address bar', url.length < 400000, Math.round(url.length / 1024) + ' KB');

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route('**/three.min.js', (r) => r.fulfill({ path: path.join(THREE_DIR, 'build/three.min.js'), contentType: 'application/javascript' }));
await page.route('**/examples/js/**', (r) => {
  const rel = r.request().url().split('/examples/js/')[1];
  r.fulfill({ path: path.join(THREE_DIR, 'examples/js', rel), contentType: 'application/javascript' });
});
await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
await page.route('**/fonts.gstatic.com/**', (r) => r.abort());
await page.goto(url);
await page.waitForFunction(() => typeof Game !== 'undefined' && typeof UI !== 'undefined' && UI.current === 'menu', null, { timeout: 60000 });
const boot = await page.evaluate(() => {
  let storage = 'ok';
  try {
    localStorage.getItem('x');
  } catch (e) {
    storage = 'blocked';
  }
  return { proto: location.protocol, menu: UI.current, tiles: $$('#s-menu .tile').length, goals: $$('#m-goals .goal').length, storage, three: THREE.REVISION };
});
check('the game boots from the pasted URL', boot.proto === 'data:' && boot.menu === 'menu' && boot.tiles >= 8 && boot.three === '128', JSON.stringify(boot));
const race = await page.evaluate(() => {
  UI.show(null);
  Game.setup({ mode: 'ai', trackId: 'bay', laps: 1, botCount: 3, seed: 3 });
  Game.headless = true;
  Input.keys = { ArrowUp: true };
  for (let i = 0; i < 600; i++) Game.frame(1 / 60);
  Game.headless = false;
  Game.frame(1 / 60);
  const out = { state: Game.state, speed: Game.player.speed, hud: !$('#hud').hidden };
  Profile.data.credits += 5;
  Profile.save();
  out.credits = Profile.data.credits;
  return out;
});
check('a race runs there', race.state === 'racing' && race.speed > 20 && race.hud && race.credits > 0, JSON.stringify(race));
check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 300));
await browser.close();
finish();
