// Builds dist/artifact.html (fragment published to the Claude artifact) and index.html (standalone page).
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const head = readFileSync('src/head.html', 'utf8');
const body = readFileSync('src/body.html', 'utf8');
const js = readdirSync('src/js')
  .filter((f) => f.endsWith('.js'))
  .sort()
  .map((f) => readFileSync('src/js/' + f, 'utf8'))
  .join('\n');
const POST = [
  'postprocessing/EffectComposer.js',
  'postprocessing/RenderPass.js',
  'postprocessing/ShaderPass.js',
  'shaders/CopyShader.js',
  'shaders/LuminosityHighPassShader.js',
  'postprocessing/UnrealBloomPass.js',
]
  .map((f) => `<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/${f}"></script>`)
  .join('\n');
const fragment = `${head}\n${body}\n<script src="${THREE_CDN}"></script>\n${POST}\n<script>\n${js}\n</script>\n`;
mkdirSync('dist', { recursive: true });
writeFileSync('dist/artifact.html', fragment);
const standalone = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:dark}body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>\n${fragment}</body></html>\n`;
writeFileSync('index.html', standalone);
console.log(`built: fragment ${(fragment.length / 1024).toFixed(0)} KB, standalone ${(standalone.length / 1024).toFixed(0)} KB`);
