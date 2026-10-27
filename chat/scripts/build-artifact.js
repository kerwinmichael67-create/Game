// Bundles the web client + artifact backend into one self-contained page for claude.ai.
//   node scripts/build-artifact.js  ->  dist/game-chat.html
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

// a fingerprint of the games' files: a game's page is opened as games/x.html?v=<it>, so after an update the browser
// fetches the new one instead of a copy it kept
const gamesDir = path.join(root, 'public/games');
const gamesV = crypto.createHash('sha1').update(fs.readdirSync(gamesDir).sort().filter((f) => fs.statSync(path.join(gamesDir, f)).isFile()).map((f) => f + fs.readFileSync(path.join(gamesDir, f))).join('')).digest('hex').slice(0, 10);
const css = read('public/style.css');
const scripts = ['shared/rules.js', 'realtime.js', 'public/games/sfx.js', 'public/td.js', 'public/td-icons.js', 'public/td-ui.js', 'public/games.js', 'public/party.js', 'public/gamenet.js', 'public/tables.js', 'public/bots.js', 'artifact/backend.js', 'shared/ai-guide.js', 'public/games/trivia-q.js', 'public/buddy-data.js', 'public/buddy.js', 'public/ai.js', 'public/tools.js', 'public/app.js'];

// (data-gc marks the chat's own style and scripts, and #gcBody keeps a clean copy of the page: ⧉ Pop out
// copies them into a small window of its own, since claude.ai won't open its pages in one)
const html = `<title>Game Chat</title>
<meta name="theme-color" content="#6d5dfc">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap">
<style data-gc>
${css}
</style>
${body.trim()}
<template id="gcBody">${body.trim()}</template>
<script data-gc>window.GAMES_V = '${gamesV}';</script>
${scripts.map((s) => `<script data-gc>\n${inline(read(s))}\n</script>`).join('\n')}
`;

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'game-chat.html'), html);
console.log(`dist/game-chat.html (${(html.length / 1024).toFixed(0)} KB)`);
