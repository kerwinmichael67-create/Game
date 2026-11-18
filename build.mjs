// Builds dist/artifact.html (fragment published to the Claude artifact) and index.html (standalone page).
// Sources are plain partials concatenated in filename order: src/css/*.css, src/html/*.html, src/js/*.js.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
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

const cat = (dir, ext) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .sort()
    .map((f) => readFileSync(`${dir}/${f}`, 'utf8').replace(/\n*$/, '\n'))
    .join('\n');

const head = readFileSync('src/head.html', 'utf8');
const css = cat('src/css', '.css');
const html = cat('src/html', '.html');
const js = cat('src/js', '.js');
const fragment = `${head}<style>\n${css}</style>\n${html}\n<script src="${THREE_CDN}"></script>\n${POST}\n<script>\n${js}</script>\n`;
mkdirSync('dist', { recursive: true });
writeFileSync('dist/artifact.html', fragment);
const standalone = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:dark}body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>\n${fragment}</body></html>\n`;
writeFileSync('index.html', standalone);
// apex-circuit.txt: the whole game as one address-bar URL. Copy the file's contents, paste them into a browser's
// address bar and press Enter. The page is gzipped inside a small loader so the text stays short enough to paste.
const packed = gzipSync(Buffer.from(standalone), { level: 9 }).toString('base64');
const loader =
  '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Apex Circuit</title>' +
  '<body style="margin:0;background:#0b0d14;color:#cdd3e0;font:16px system-ui"><p id="l" style="padding:24px">Loading Apex Circuit…</p><script>' +
  `(async()=>{try{const b=Uint8Array.from(atob("${packed}"),c=>c.charCodeAt(0));` +
  'const t=await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream("gzip"))).text();' +
  'document.open();document.write(t);document.close()}catch(e){document.getElementById("l").textContent=' +
  '"This browser could not unpack the game ("+e.message+"). Try a current Chrome, Edge, Firefox or Safari."}})()</script>';
const pasteUrl = 'data:text/html;charset=utf-8;base64,' + Buffer.from(loader).toString('base64');
writeFileSync('apex-circuit.txt', pasteUrl);
console.log(
  `built: fragment ${(fragment.length / 1024).toFixed(0)} KB, standalone ${(standalone.length / 1024).toFixed(0)} KB, paste URL ${(pasteUrl.length / 1024).toFixed(0)} KB`
);
