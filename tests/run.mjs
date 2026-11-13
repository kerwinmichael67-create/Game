// Runs the regression suite: `node tests/run.mjs` (all) or `node tests/run.mjs steer physics` (subset).
// Builds first so the tests always exercise the current sources.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const all = readdirSync(HERE)
  .filter((f) => /^t-.*\.mjs$/.test(f))
  .map((f) => f.slice(2, -4))
  .sort();
const want = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const names = want.length ? want : all;
const unknown = names.filter((n) => !all.includes(n));
if (unknown.length) {
  console.error('Unknown test(s): ' + unknown.join(', ') + '\nAvailable: ' + all.join(', '));
  process.exit(2);
}
const build = spawnSync('node', ['build.mjs'], { cwd: ROOT, encoding: 'utf8' });
if (build.status !== 0) {
  console.error('BUILD FAILED\n' + build.stdout + build.stderr);
  process.exit(1);
}
console.log(build.stdout.trim());
const summary = [];
for (const n of names) {
  console.log(`\n=== ${n} ===`);
  const t0 = Date.now();
  const r = spawnSync('node', [path.join(HERE, `t-${n}.mjs`)], { cwd: ROOT, encoding: 'utf8', timeout: 15 * 60 * 1000 });
  process.stdout.write(r.stdout || '');
  if (r.stderr && r.status !== 0) process.stdout.write(r.stderr.split('\n').slice(0, 25).join('\n') + '\n');
  summary.push({ n, ok: r.status === 0, s: ((Date.now() - t0) / 1000).toFixed(0) });
}
console.log('\n=== summary ===');
for (const s of summary) console.log(`${s.ok ? 'PASS' : 'FAIL'}  ${s.n}  (${s.s}s)`);
process.exit(summary.every((s) => s.ok) ? 0 : 1);
