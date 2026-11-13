// Screenshot gallery for visual review (not part of the pass/fail suite).
//   node tests/shots.mjs [outDir] [filter]      default outDir: tests/out
// Each scenario fast-forwards the game headless, then renders a few real frames and captures the canvas + HUD.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { open, installHelpers, ROOT } from './harness.mjs';

const out = path.resolve(process.argv[2] || path.join(ROOT, 'tests/out'));
const filter = process.argv[3] || '';
mkdirSync(out, { recursive: true });

const race = (trackId, frames, extra = '') => `
  T.start({ mode: 'ai', trackId: '${trackId}', laps: 3, difficulty: 1, botCount: 5, seed: 7 });
  T.autopilot(true);
  for (let i = 0; i < ${frames}; i++) Game.frame(1 / 60);
  ${extra}
  Game.headless = false; Game.world.updateCamera(Game.player, 0, Game.world.camMode, true);
  for (let i = 0; i < 3; i++) Game.frame(1 / 60);`;

const scenarios = [
  ['menu', `Game.stop(); UI.show('menu');`, 1200],
  ['garage', `Game.stop(); UI.show('garage');`, 1500],
  ['setup-ai', `Game.stop(); UI.openSetup('ai');`, 300],
  [
    'grid-bay',
    `T.start({ mode: 'ai', trackId: 'bay', laps: 3, difficulty: 1, botCount: 5, seed: 7 }); Game.headless = false; for (let i = 0; i < 40; i++) Game.frame(1 / 60);`,
    200,
  ],
  ['race-bay-early', race('bay', 700), 200],
  ['race-bay-mid', race('bay', 2400), 200],
  ['race-alpine-early', race('alpine', 900), 200],
  ['race-alpine-mid', race('alpine', 2600), 200],
  ['race-neon-early', race('neon', 500), 200],
  ['race-neon-mid', race('neon', 2000), 200],
  ['bonnet-cam-alpine', race('alpine', 1500, 'Game.world.camMode = 1;'), 200],
  [
    'drift-bay',
    `T.start({ mode: 'drift', trackId: 'bay' }); T.run(250); T.place(Game.player, 20, -5.5, 30); T.run(8, { ArrowUp: true, ArrowRight: true, Space: true }); T.run(14, { ArrowUp: true, ArrowRight: true }); Game.headless = false; Game.world.updateCamera(Game.player, 0, 0, true); T.run(14, { ArrowUp: true, ArrowRight: true });`,
    200,
  ],
  [
    'results',
    `T.start({ mode: 'ai', trackId: 'bay', laps: 1, difficulty: 0, botCount: 5, seed: 7 }); T.autopilot(true); T.finishRace(); Game.autopilot = false;`,
    600,
  ],
];

const { page, close } = await open({ mock: true });
await page.evaluate(installHelpers);
for (const [name, body, settle] of scenarios) {
  if (filter && !name.includes(filter)) continue;
  await page.evaluate(`(() => { ${body} })()`);
  await page.waitForTimeout(settle);
  await page.screenshot({ path: path.join(out, name + '.png') });
  console.log('shot', name);
}
await close();
console.log('written to', out);
