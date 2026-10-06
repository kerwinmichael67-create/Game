// Bundles the web client + artifact backend into one self-contained page for claude.ai.
//   node scripts/build-artifact.js  ->  dist/game-chat.html
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const inline = (code) => code.replace(/<\/script/gi, '<\\/script');

let body = read('public/index.html');
body = body.slice(body.indexOf('>', body.indexOf('<body')) + 1, body.indexOf('</body>'));
body = body.replace(/<script src="[^"]*"><\/script>\s*/g, '');

// Replace the sign-in form with a connecting state: on claude.ai you're already signed in.
const formStart = body.indexOf('<form id="authForm"');
const formEnd = body.indexOf('</form>', formStart) + '</form>'.length;
body = body.slice(0, formStart) +
  `<div id="authForm" class="auth-card">
    <h2>Connecting…</h2>
    <p class="muted">Loading your chats and who’s online. If your browser asks, allow Game Chat to use your Claude profile.</p>
  </div>` + body.slice(formEnd);
body = body.replace('<div id="auth" class="auth hidden">', '<div id="auth" class="auth">');

const css = read('public/style.css');
const scripts = ['shared/rules.js', 'realtime.js', 'public/td.js', 'public/td-icons.js', 'public/td-ui.js', 'public/games.js', 'public/bots.js', 'artifact/backend.js', 'public/app.js'];

const html = `<title>Game Chat</title>
<meta name="theme-color" content="#6d5dfc">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap">
<style>
${css}
</style>
${body.trim()}
${scripts.map((s) => `<script>\n${inline(read(s))}\n</script>`).join('\n')}
`;

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'game-chat.html'), html);
console.log(`dist/game-chat.html (${(html.length / 1024).toFixed(0)} KB)`);
