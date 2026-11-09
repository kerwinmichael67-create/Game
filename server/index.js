import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { CONFIG } from '../shared/config.js';
import { Room } from './room.js';
import { createStaticHandler } from './static.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;

// ---------- rooms (think "Roblox servers") ----------

const rooms = new Map();

function makeRoomId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  do {
    id = '';
    for (let i = 0; i < 4; i++) id += alphabet[Math.floor(Math.random() * alphabet.length)];
  } while (rooms.has(id));
  return id;
}

function createRoom(id = makeRoomId()) {
  const room = new Room(id);
  room.onEmpty = (r) => {
    if (rooms.get(r.id) === r) {
      rooms.delete(r.id);
      console.log(`[room ${r.id}] closed (empty)`);
    }
  };
  rooms.set(id, room);
  console.log(`[room ${id}] created`);
  return room;
}

function pickRoom(requestedId, token) {
  // A reconnecting player goes back to the room that holds their tycoon.
  if (token) for (const r of rooms.values()) if (r.findByToken(token)) return r;
  const id = String(requestedId ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  if (id) {
    const r = rooms.get(id);
    if (r && !r.isFull()) return r;
    if (!r) return createRoom(id);
  }
  // Fill the most-populated room that still has space (keeps players together).
  let best = null;
  for (const r of rooms.values()) {
    if (r.isFull()) continue;
    if (!best || r.occupancy > best.occupancy) best = r;
  }
  return best ?? createRoom();
}

// ---------- http ----------

const serveStatic = createStaticHandler({
  '/shared/': path.join(ROOT, 'shared'),
  '/': path.join(ROOT, 'public'),
});

const server = http.createServer((req, res) => {
  if (req.url === '/api/rooms') {
    const list = [...rooms.values()].map((r) => ({ id: r.id, players: r.connectedCount, max: CONFIG.MAX_PLAYERS_PER_ROOM }));
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ rooms: list }));
    return;
  }
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }
  serveStatic(req, res);
});

// ---------- websockets ----------

const wss = new WebSocketServer({ server, maxPayload: 16 * 1024 });

function send(ws, obj) {
  if (ws.readyState === 1) ws.send(JSON.stringify(obj));
}

wss.on('connection', (ws, req) => {
  let room = null;
  let player = null;
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || typeof msg !== 'object') return;

    if (!player) {
      if (msg.t !== 'join') return;
      room = pickRoom(msg.room, msg.token);
      player = room.addPlayer(ws, { name: msg.name, token: msg.token });
      if (!player) {
        send(ws, { t: 'error', message: 'That server is full.' });
        ws.close();
        return;
      }
      send(ws, { t: 'welcome', id: player.id, token: player.token, state: room.fullState() });
      room.broadcast({ t: 'pjoin', player: room.playerState(player) }, player);
      console.log(`[room ${room.id}] ${player.name} (#${player.id}) joined from ${req.socket.remoteAddress}`);
      return;
    }

    switch (msg.t) {
      case 'move': room.handleMove(player, msg); break;
      case 'chat': room.handleChat(player, msg.text); break;
      case 'pad': {
        const now = Date.now();
        if (now - player.lastPadAt < 150) break; // rate limit
        player.lastPadAt = now;
        const res = room.handlePad(player, msg);
        if (!res.ok && res.reason) send(ws, { t: 'denied', pad: msg.pad, reason: res.reason });
        break;
      }
      case 'ping': send(ws, { t: 'pong', c: msg.c }); break;
      case 'cheat':
        // Development aid only: `DEV_CHEATS=1 npm start` lets clients grant themselves cash.
        if (process.env.DEV_CHEATS === '1') player.cash += Math.min(1e9, Math.max(0, Number(msg.amount) || 0));
        break;
    }
  });

  ws.on('close', () => {
    if (room && player) {
      room.disconnectPlayer(player);
      console.log(`[room ${room.id}] ${player.name} (#${player.id}) disconnected`);
    }
  });
  ws.on('error', () => {});
});

// Heartbeat: drop dead sockets.
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 30_000);

// ---------- game loop ----------

const TICK_MS = 1000 / CONFIG.TICK_RATE;
const SNAP_EVERY = Math.max(1, Math.round(CONFIG.TICK_RATE / CONFIG.SNAPSHOT_RATE));
let tickCount = 0;
let last = process.hrtime.bigint();

setInterval(() => {
  const now = process.hrtime.bigint();
  const dt = Math.min(0.25, Number(now - last) / 1e9);
  last = now;
  tickCount++;
  for (const room of [...rooms.values()]) {
    room.tick(dt);
    if (tickCount % SNAP_EVERY === 0) {
      room.broadcast(room.snapshot());
    }
    if (tickCount % CONFIG.TICK_RATE === 0) room.reapDisconnected();
  }
}, TICK_MS);

server.listen(PORT, () => {
  console.log(`Blox Tycoon server listening on http://localhost:${PORT}`);
});
