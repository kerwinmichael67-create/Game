'use strict';
/*
 * Bumper Crop online server.
 *
 * Serves the game page and runs the multiplayer side over one WebSocket:
 * a fixed list of servers (rooms), each with four plots, so up to four
 * farmers share a yard. Players can hop between servers, and every server
 * keeps its own chat.
 *
 * Farms stay client side: each player's browser owns its own farm and
 * sends the server a snapshot whenever it changes. The server relays those
 * snapshots, avatar positions and chat to everyone else in the same room.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PLOTS = 4;                    // four plots, so four farmers per server
const CHAT_KEEP = 60;               // lines of history a newcomer gets
const CHAT_MAX = 160;               // characters per message
const NAME_MAX = 16;
const DEFAULT_NAMES = ['Sunny Meadow', 'Clover Hill', 'Maple Hollow', 'Willow Creek', 'Pumpkin Patch', 'Berry Bend'];
const ROOM_NAMES = (process.env.SERVER_NAMES ? process.env.SERVER_NAMES.split(',') : DEFAULT_NAMES)
  .map(s => s.trim()).filter(Boolean).slice(0, 24);
const PUBLIC = path.join(__dirname, 'public');

const rooms = ROOM_NAMES.map((name, i) => ({ id: 's' + (i + 1), name, slots: new Array(PLOTS).fill(null), chat: [] }));
const roomById = id => rooms.find(r => r.id === id) || null;
const clients = new Set();

/* ---------------- helpers ---------------- */
const now = () => Date.now();
const newId = () => crypto.randomBytes(6).toString('hex');
const finite = (v, fb = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fb);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
function cleanText(raw, max) {
  return String(raw == null ? '' : raw)
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
function cleanName(raw) {
  return cleanText(raw, NAME_MAX) || 'Farmer ' + (1000 + Math.floor(Math.random() * 9000));
}
function send(p, msg) {
  if (p.ws.readyState === WebSocket.OPEN) p.ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
}
function toRoom(room, msg, except) {
  const data = JSON.stringify(msg);
  for (const q of room.slots) if (q && q !== except) send(q, data);
}
const countOf = room => room.slots.filter(Boolean).length;
function serverList() {
  return rooms.map(r => ({ id: r.id, name: r.name, n: countOf(r), max: PLOTS, players: r.slots.map(q => (q ? q.name : null)) }));
}
function peerView(q) {
  return { id: q.id, name: q.name, slot: q.slot, farm: q.farm, pos: q.pos };
}
function logChat(room, entry) {
  room.chat.push(entry);
  if (room.chat.length > CHAT_KEEP) room.chat.splice(0, room.chat.length - CHAT_KEEP);
  toRoom(room, Object.assign({ t: 'chat' }, entry));
}
function sysLine(room, text) {
  logChat(room, { k: 'sys', text, at: now() });
}

// server counts change whenever someone joins or leaves; batch those into one broadcast
let listTimer = null;
function announceList() {
  if (listTimer) return;
  listTimer = setTimeout(() => {
    listTimer = null;
    const data = JSON.stringify({ t: 'servers', list: serverList() });
    for (const p of clients) if (p.hello) send(p, data);
  }, 150);
}

// busiest server with a plot free, so people end up farming together
function pickAuto(avoid) {
  let best = null;
  for (const r of rooms) {
    const n = countOf(r);
    if (n >= PLOTS || r === avoid) continue;
    if (!best || n > countOf(best)) best = r;
  }
  return best || (avoid && countOf(avoid) < PLOTS ? avoid : null);
}

/* ---------------- joining and leaving ---------------- */
function leave(p, quiet) {
  const room = p.room;
  if (!room) return;
  if (room.slots[p.slot] === p) room.slots[p.slot] = null;
  p.room = null; p.slot = -1;
  clearTimeout(p.farmTimer); p.farmTimer = null;
  toRoom(room, { t: 'peer-leave', id: p.id });
  if (!quiet) sysLine(room, `${p.name} left the server`);
  announceList();
}
function join(p, m) {
  const want = String(m.room || 'auto');
  const target = want === 'auto' ? pickAuto(null) : roomById(want);
  if (!target) return send(p, { t: 'join-fail', room: want, reason: want === 'auto' ? 'Every server is full right now.' : 'That server does not exist.' });
  if (target === p.room) return sendJoined(p);
  const free = target.slots.map((q, i) => (q ? -1 : i)).filter(i => i >= 0);
  if (!free.length) return send(p, { t: 'join-fail', room: target.id, reason: `${target.name} is full. Try another server.` });
  const prefer = Math.floor(finite(m.slot, -1));
  const slot = free.includes(prefer) ? prefer : free[0];
  const from = p.room;
  if (from) {
    leave(p, true);
    sysLine(from, `${p.name} moved to ${target.name}`);
  }
  p.room = target; p.slot = slot;
  target.slots[slot] = p;
  p.pos = null;
  toRoom(target, { t: 'peer-join', p: peerView(p) }, p);
  sendJoined(p);
  sysLine(target, `${p.name} joined on plot ${slot + 1}`);
  announceList();
}
function sendJoined(p) {
  const room = p.room;
  send(p, {
    t: 'joined',
    room: { id: room.id, name: room.name },
    slot: p.slot,
    players: room.slots.filter(q => q && q !== p).map(peerView),
    chat: room.chat.slice(-40),
    list: serverList(),
    now: now(),
  });
}

/* ---------------- messages ---------------- */
const BRAGS = new Set(['mut', 'pet', 'upg']);
function handle(p, m) {
  if (!m || typeof m !== 'object' || typeof m.t !== 'string') return;
  if (!p.hello && m.t !== 'hello') return;
  switch (m.t) {
    case 'hello': {
      p.hello = true;
      p.name = cleanName(m.name);
      send(p, { t: 'welcome', id: p.id, name: p.name, now: now(), list: serverList(), plots: PLOTS });
      return;
    }
    case 'ping': return send(p, { t: 'pong', at: finite(m.at), now: now() });
    case 'list': return send(p, { t: 'servers', list: serverList() });
    case 'join': return join(p, m);
    case 'name': {
      const name = cleanName(m.name);
      if (name === p.name) return;
      const old = p.name;
      p.name = name;
      send(p, { t: 'you', name });
      if (p.room) {
        toRoom(p.room, { t: 'peer-name', id: p.id, name }, p);
        sysLine(p.room, `${old} is now called ${name}`);
      }
      announceList();
      return;
    }
    case 'pos': {
      if (!p.room) return;
      const t = now();
      if (t - p.posAt < 45) return;     // roughly twenty a second is plenty
      p.posAt = t;
      p.pos = {
        x: clamp(finite(m.x), -60, 60),
        z: clamp(finite(m.z), -60, 60),
        yaw: finite(m.yaw),
        s: clamp(finite(m.s), 0, 1),
        h: typeof m.h === 'string' ? m.h.slice(0, 48) : '',
      };
      toRoom(p.room, Object.assign({ t: 'pos', id: p.id }, p.pos), p);
      return;
    }
    case 'farm': {
      if (!p.room || !m.f || typeof m.f !== 'object' || Array.isArray(m.f)) return;
      p.farm = m.f;
      // relay at most four times a second; the latest snapshot always wins
      if (p.farmTimer) return;
      const gap = Math.max(0, 250 - (now() - p.farmAt));
      p.farmTimer = setTimeout(() => {
        p.farmTimer = null;
        if (!p.room) return;
        p.farmAt = now();
        toRoom(p.room, { t: 'farm', id: p.id, f: p.farm }, p);
      }, gap);
      return;
    }
    case 'chat': {
      if (!p.room) return;
      const text = cleanText(m.text, CHAT_MAX);
      if (!text) return;
      const t = now();
      p.chatTimes = p.chatTimes.filter(x => t - x < 8000);
      if (p.chatTimes.length >= 5) return send(p, { t: 'chat', k: 'sys', text: 'Slow down a little, you are chatting too fast.', at: t, own: 1 });
      p.chatTimes.push(t);
      logChat(p.room, { k: 'chat', id: p.id, name: p.name, slot: p.slot, text, at: t });
      return;
    }
    case 'brag': {
      if (!p.room || !BRAGS.has(m.what)) return;
      const t = now();
      if (t - p.bragAt < 4000) return;
      p.bragAt = t;
      logChat(p.room, { k: 'brag', id: p.id, name: p.name, slot: p.slot, what: m.what, a: cleanText(m.a, 24), b: cleanText(m.b, 24), at: t });
      return;
    }
  }
}

/* ---------------- http ---------------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/healthz') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }
  if (url.pathname === '/api/servers') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(serverList()));
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : buf);
  });
});

/* ---------------- websocket ---------------- */
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 256 * 1024 });
wss.on('connection', ws => {
  const p = { id: newId(), ws, name: '', hello: false, room: null, slot: -1, farm: null, pos: null, alive: true, posAt: 0, farmAt: 0, farmTimer: null, chatTimes: [], bragAt: 0 };
  clients.add(p);
  ws.on('pong', () => { p.alive = true; });
  ws.on('message', (data, isBinary) => {
    if (isBinary) return;
    let m;
    try { m = JSON.parse(data.toString()); } catch (e) { return; }
    try { handle(p, m); } catch (e) { console.error('message failed', e); }
  });
  ws.on('close', () => { clients.delete(p); leave(p); });
  ws.on('error', () => { /* the close event does the cleanup */ });
});
// drop connections that stopped answering
const beat = setInterval(() => {
  for (const p of clients) {
    if (!p.alive) { p.ws.terminate(); continue; }
    p.alive = false;
    try { p.ws.ping(); } catch (e) { /* closing anyway */ }
  }
}, 25000);
wss.on('close', () => clearInterval(beat));

server.listen(PORT, HOST, () => {
  console.log(`Bumper Crop is up on http://localhost:${PORT} with ${rooms.length} servers of ${PLOTS} plots`);
});
