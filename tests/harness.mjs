// Shared test harness: serves the built index.html, opens it in headless Chromium with Three.js
// fulfilled from a local copy (the page itself loads it from CDNs), and offers tiny assertion helpers.
import { createRequire } from 'node:module';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
function load(name, fallback) {
  try {
    return require(name);
  } catch (e) {
    return require(fallback);
  }
}
const { chromium, devices } = load('playwright', '/opt/node-tools/node_modules/playwright');

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..');

/* Three.js r128 for offline runs: $APEX_THREE, else tests/.vendor (installed on first use). */
function vendorDir() {
  const local = path.join(HERE, '.vendor/node_modules/three');
  const env = process.env.APEX_THREE;
  if (env && existsSync(path.join(env, 'build/three.min.js'))) return env;
  if (!existsSync(path.join(local, 'build/three.min.js'))) {
    mkdirSync(path.join(HERE, '.vendor'), { recursive: true });
    execSync('npm install three@0.128.0 --no-audit --no-fund --no-package-lock --prefix ' + JSON.stringify(path.join(HERE, '.vendor')), {
      stdio: 'ignore',
    });
  }
  return local;
}
export const THREE_DIR = vendorDir();

let failures = 0;
const results = [];
export function check(name, cond, detail = '') {
  const ok = !!cond;
  if (!ok) failures++;
  results.push({ name, ok });
  console.log(
    `${ok ? '  ok  ' : '  FAIL'} ${name}${detail !== '' ? '  — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`
  );
  return ok;
}
export function near(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

/**
 * Open the game. Options:
 *   mock      – install the fake artifact runtime (room/user/db) before the page loads
 *   mockOpts  – object exposed to the mock as window.__mockOpts (e.g. { mePeer: 'peer-zz' })
 *   phone     – emulate an iPhone 13 in portrait
 *   storage   – object of localStorage entries to seed before load
 */
export async function open({
  mock = false,
  mockOpts = null,
  phone = false,
  landscape = false,
  width = 1280,
  height = 720,
  storage = null,
} = {}) {
  const server = http.createServer((req, res) => {
    res.setHeader('content-type', 'text/html');
    res.end(readFileSync(path.join(ROOT, 'index.html')));
  });
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const dev = landscape ? devices['iPhone 13 landscape'] : devices['iPhone 13'];
  const ctx = await browser.newContext(phone ? { ...dev, deviceScaleFactor: 1 } : { viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + ' @ ' + ((e.stack || '').split('\n')[1] || '').trim()));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300));
  });
  if (storage)
    await page.addInitScript((s) => {
      for (const k in s) localStorage.setItem(k, typeof s[k] === 'string' ? s[k] : JSON.stringify(s[k]));
    }, storage);
  if (mock) {
    if (mockOpts)
      await page.addInitScript((o) => {
        window.__mockOpts = o;
      }, mockOpts);
    await page.addInitScript({ path: path.join(HERE, 'mockroom.js') });
  }
  await page.route('https://cdnjs.cloudflare.com/**', (r) =>
    r.fulfill({ path: path.join(THREE_DIR, 'build/three.min.js'), contentType: 'application/javascript' })
  );
  await page.route('https://cdn.jsdelivr.net/**', (r) => {
    const m = r
      .request()
      .url()
      .match(/examples\/js\/(.+)$/);
    r.fulfill({ path: path.join(THREE_DIR, 'examples/js', m[1]), contentType: 'application/javascript' });
  });
  await page.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ body: '', contentType: 'text/css' }));
  await page.goto('http://localhost:' + port + '/');
  await page.waitForFunction(() => typeof Game !== 'undefined' && Game.world && document.querySelector('#loading').hidden, null, {
    timeout: 30000,
  });
  const close = async () => {
    check('no page errors', errors.length === 0, errors.slice(0, 6).join(' | '));
    await browser.close();
    server.close();
  };
  return { page, errors, close, browser };
}

/* Call at the end of every test file. */
export function finish() {
  const bad = results.filter((r) => !r.ok);
  console.log(
    bad.length
      ? `FAILED ${bad.length}/${results.length}: ${bad.map((b) => b.name).join('; ')}`
      : `PASSED ${results.length}/${results.length}`
  );
  process.exit(bad.length ? 1 : 0);
}

/* In-page helpers shared by tests; injected once per page with page.evaluate(installHelpers). */
export function installHelpers() {
  window.T = {
    /* advance n frames with the given keyboard state, headless (no rendering) */
    run(n, keys = {}) {
      Input.keys = keys;
      for (let i = 0; i < n; i++) Game.frame(1 / 60);
    },
    /* start a mode immediately, skipping the loading timeout */
    start(opts) {
      UI.show(null);
      Game.setup(Object.assign({ seed: 42 }, opts));
      Game.headless = true;
    },
    /* let a strong AI drive the player's car */
    autopilot(on = true, level = 2) {
      Game.autopilot = on;
      if (on) Game.player.ai = new AIDriver(Game.player, Game.track, DIFFICULTY[level], 9);
    },
    /* run until results exist or maxFrames pass; returns frames used */
    finishRace(maxFrames = 40000) {
      let i = 0;
      for (; i < maxFrames && !Game.results; i++) Game.frame(1 / 60);
      return i;
    },
    wallLimit() {
      return Game.track.halfWidth + Game.track.wallOffset;
    },
    /* put a car on the track at sample idx, lateral offset lat (+ = right), rolling at `speed` along the track */
    place(car, idx, lat = 0, speed = 0) {
      const t = Game.track;
      idx = ((idx % t.n) + t.n) % t.n;
      car.recover(t);
      car.trackIdx = idx;
      car.pos.copy(t.point(idx, lat));
      car.yaw = t.yawAt(idx);
      const f = car.forward();
      car.vel.set(f.x * speed, 0, f.z * speed);
      car.speed = car.spd = speed;
      car.lat = lat;
      car.offTrack = Math.abs(lat) > t.halfWidth + 0.3;
    },
  };
}
