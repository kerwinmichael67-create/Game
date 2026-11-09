import fs from 'node:fs';
import path from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

// Serves files from `mounts` ({ urlPrefix: absoluteDir }). Falls back to 404.
export function createStaticHandler(mounts) {
  const entries = Object.entries(mounts).sort((a, b) => b[0].length - a[0].length);
  return function handle(req, res) {
    let url = decodeURIComponent((req.url || '/').split('?')[0]);
    if (url === '/') url = '/index.html';
    for (const [prefix, dir] of entries) {
      if (!url.startsWith(prefix)) continue;
      const rel = url.slice(prefix.length);
      const file = path.normalize(path.join(dir, rel));
      if (!file.startsWith(dir)) break; // path traversal
      fs.stat(file, (err, st) => {
        if (err || !st.isFile()) { notFound(res); return; }
        const ext = path.extname(file).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME[ext] || 'application/octet-stream',
          'Content-Length': st.size,
          'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=300',
        });
        fs.createReadStream(file).pipe(res);
      });
      return;
    }
    notFound(res);
  };
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
}
