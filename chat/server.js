// Online chat + multiplayer minigames server.
// Serves the web client from ./public and speaks JSON over a WebSocket at /ws.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const Rules = require('./shared/rules');
const Realtime = require('./realtime');

const PORT = process.env.PORT !== undefined ? Number(process.env.PORT) : 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const MAX_HISTORY = 300;
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const MAX_UPLOAD = 10 * 1024 * 1024;
// Uploaded types a browser may show inline; everything else is served as a download.
const INLINE_TYPES = /^(image\/(png|jpeg|gif|webp|svg\+xml)|video\/(mp4|webm|ogg|quicktime)|audio\/(mpeg|ogg|wav|webm|mp4)|application\/pdf)$/;

// kind: 'turn' = validated with shared/rules.js, 'realtime' = simulated here, 'relay' = each client plays its own board
const GAMES = {
  snake: { name: 'Snake PvP', kind: 'realtime' },
  chess: { name: 'Chess', kind: 'turn' },
  checkers: { name: 'Checkers', kind: 'turn' },
  tetris: { name: 'Tetris Battle', kind: 'relay' },
  fighter: { name: 'Street Fighter', kind: 'realtime' },
  pong: { name: 'Pong', kind: 'realtime' },
  connect4: { name: 'Connect Four', kind: 'turn' },
  tictactoe: { name: 'Tic-Tac-Toe', kind: 'turn' },
  reversi: { name: 'Reversi', kind: 'turn' },
  dots: { name: 'Dots & Boxes', kind: 'turn' },
  mancala: { name: 'Mancala', kind: 'turn' },
  gomoku: { name: 'Five in a Row', kind: 'turn' },
  tron: { name: 'Light Cycles', kind: 'realtime' },
  hockey: { name: 'Air Hockey', kind: 'realtime' },
};
const AVATAR_COLORS = ['#22c55e', '#111111', '#ef4444', '#facc15', '#d946ef', '#3b82f6', '#f97316', '#14b8a6'];

// ---------------------------------------------------------------- storage
function loadDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { users: {}, tokens: {}, rooms: {} };
  }
}
const db = loadDb();
if (!db.rooms.global) {
  db.rooms.global = { id: 'global', name: 'Global chat', public: true, members: [], owner: null, created: Date.now(), messages: [] };
}
let saveTimer = null;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE + '.tmp', JSON.stringify(db));
    fs.renameSync(DB_FILE + '.tmp', DB_FILE);
  }, 1000);
}
function saveNow() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db));
}

const rid = (n = 9) => crypto.randomBytes(n).toString('base64url');
const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 64).toString('hex');
function checkPw(user, pw) {
  const a = Buffer.from(hashPw(pw, user.salt), 'hex'), b = Buffer.from(user.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isColor = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);

// ---------------------------------------------------------------- presence
const conns = new Map(); // username -> Set<ws>
const isConnected = (u) => conns.has(u) && conns.get(u).size > 0;
const presence = (u) => (isConnected(u) ? db.users[u].status : 'offline');

function publicUser(u) {
  const x = db.users[u];
  return {
    username: x.username, handle: x.username, name: x.name, bio: x.bio, avatar: x.avatar, favorites: x.favorites,
    presence: presence(u), stats: x.stats, inGame: userGame.has(u) ? sessions.get(userGame.get(u)).type : null,
  };
}
function privateUser(u) {
  const x = db.users[u];
  return Object.assign(publicUser(u), { status: x.status, bg: x.bg, bgCustom: x.bgCustom, friends: x.friends });
}

function send(ws, obj) {
  if (ws.readyState === 1) ws.send(JSON.stringify(obj));
}
function sendUser(u, obj) {
  const set = conns.get(u);
  if (set) for (const ws of set) send(ws, obj);
}
function broadcast(obj, filter) {
  for (const [u, set] of conns) if (!filter || filter(u)) for (const ws of set) send(ws, obj);
}
const broadcastUser = (u) => broadcast({ t: 'user', user: publicUser(u) });

// ---------------------------------------------------------------- rooms
const canSee = (room, u) => room.public || room.members.includes(u);
const roomView = (room) => ({
  id: room.id, name: room.name, public: room.public, dm: !!room.dm, members: room.members, owner: room.owner,
  messages: room.messages.slice(-100),
});
function toRoom(room, obj) {
  broadcast(obj, (u) => canSee(room, u));
}
function postMessage(room, msg) {
  msg.id = rid(6);
  msg.ts = Date.now();
  room.messages.push(msg);
  if (room.messages.length > MAX_HISTORY) room.messages.splice(0, room.messages.length - MAX_HISTORY);
  toRoom(room, { t: 'msg', room: room.id, msg });
  save();
}
// What a reply shows of the message it answers (taken from the server's copy, so it can't be faked).
const replySnapshot = (orig) => ({ id: orig.id, from: orig.from, text: (orig.text || '').slice(0, 140), file: orig.file ? orig.file.name : null });
const sys = (room, text, extra) => room && postMessage(room, Object.assign({ from: null, sys: true, text }, extra));
const nameOf = (u) => (db.users[u] ? db.users[u].name : u);

// ---------------------------------------------------------------- games
const sessions = new Map(); // id -> session
const userGame = new Map(); // username -> session id
const invites = new Map(); // id -> invite
const forfeitTimers = new Map(); // username -> timeout

function busyReason(u) {
  if (!isConnected(u)) return `${nameOf(u)} is offline`;
  if (userGame.has(u)) return `${nameOf(u)} is already in a game`;
  if (db.users[u].status === 'idle') return `${nameOf(u)} is set to do not disturb`;
  return null;
}
const gamePlayers = (s) => s.players.map((u) => ({ username: u, name: nameOf(u), avatar: db.users[u].avatar }));
function sendStart(s, u) {
  sendUser(u, { t: 'gameStart', id: s.id, game: s.type, players: gamePlayers(s), you: s.players.indexOf(u), state: s.state });
}
function startGame(type, players, roomId) {
  const s = { id: rid(), type, players, room: roomId, over: false, kind: GAMES[type].kind, state: null, timer: null };
  if (s.kind === 'turn') s.state = Rules[type].init();
  else if (s.kind === 'realtime') {
    s.state = Realtime[type].init();
    s.timer = setInterval(() => {
      const res = Realtime[type].tick(s.state);
      toPlayers(s, { t: 'gameState', id: s.id, state: s.state });
      if (res) endGame(s, res);
    }, Realtime[type].tickMs);
  } else s.state = { boards: [null, null], scores: [0, 0], lines: [0, 0], sent: [0, 0] };
  sessions.set(s.id, s);
  players.forEach((u) => { userGame.set(u, s.id); broadcastUser(u); sendStart(s, u); });
}
const toPlayers = (s, obj) => s.players.forEach((u) => sendUser(u, obj));
function endGame(s, result) {
  if (s.over) return;
  s.over = true;
  clearInterval(s.timer);
  toPlayers(s, { t: 'gameOver', id: s.id, result, state: s.state });
  const [a, b] = s.players;
  s.players.forEach((u, i) => {
    userGame.delete(u);
    clearTimeout(forfeitTimers.get(u));
    forfeitTimers.delete(u);
    const st = db.users[u].stats;
    if (result.winner === -1) st.d++;
    else if (result.winner === i) st.w++;
    else st.l++;
  });
  sessions.delete(s.id);
  const game = GAMES[s.type].name, room = db.rooms[s.room];
  if (result.winner === -1) sys(room, `🤝 ${nameOf(a)} and ${nameOf(b)} drew at ${game} (${result.reason})`, { game: s.type });
  else {
    const w = s.players[result.winner], l = s.players[1 - result.winner];
    sys(room, `🏆 ${nameOf(w)} beat ${nameOf(l)} at ${game} (${result.reason})`, { game: s.type });
  }
  s.players.forEach(broadcastUser);
  save();
}
function gameInput(u, msg) {
  const s = sessions.get(msg.id);
  if (!s || s.over) return;
  const idx = s.players.indexOf(u);
  if (idx < 0) return;
  if (s.kind === 'turn') {
    const r = Rules[s.type].move(s.state, idx, msg.input || {});
    if (r.error) return sendUser(u, { t: 'gameError', id: s.id, text: r.error });
    s.state = r.state;
    toPlayers(s, { t: 'gameState', id: s.id, state: s.state });
    if (s.state.result) endGame(s, s.state.result);
  } else if (s.kind === 'realtime') {
    Realtime[s.type].input(s.state, idx, msg.input);
  } else {
    const inp = msg.input || {};
    if (inp.kind === 'board' && typeof inp.board === 'string' && /^[0-8]{200}$/.test(inp.board)) {
      s.state.boards[idx] = inp.board;
      s.state.scores[idx] = Math.max(0, Number(inp.score) || 0);
      s.state.lines[idx] = Math.max(0, Number(inp.lines) || 0);
      toPlayers(s, { t: 'gameState', id: s.id, state: s.state });
    } else if (inp.kind === 'garbage') {
      const n = Math.max(1, Math.min(4, Math.floor(Number(inp.n) || 0)));
      s.state.sent[idx] += n;
      sendUser(s.players[1 - idx], { t: 'gameEvent', id: s.id, ev: { garbage: n } });
    } else if (inp.kind === 'dead') {
      endGame(s, { winner: 1 - idx, reason: `${nameOf(u)} topped out` });
    }
  }
}

// ---------------------------------------------------------------- message handlers
const RATE = new Map(); // username -> timestamps of recent chat messages
function rateOk(u) {
  const now = Date.now(), list = (RATE.get(u) || []).filter((t) => now - t < 4000);
  list.push(now);
  RATE.set(u, list);
  return list.length <= 8;
}

function onAuth(ws, u, token) {
  ws.user = u;
  const wasOnline = isConnected(u);
  if (!conns.has(u)) conns.set(u, new Set());
  conns.get(u).add(ws);
  clearTimeout(forfeitTimers.get(u));
  forfeitTimers.delete(u);
  const rooms = Object.values(db.rooms).filter((r) => canSee(r, u)).map(roomView);
  send(ws, { t: 'hello', token, me: privateUser(u), users: Object.keys(db.users).map(publicUser), rooms, games: GAMES });
  if (userGame.has(u)) {
    const s = sessions.get(userGame.get(u));
    send(ws, { t: 'gameStart', id: s.id, game: s.type, players: gamePlayers(s), you: s.players.indexOf(u), state: s.state });
  }
  for (const inv of invites.values()) if (inv.to === u) send(ws, { t: 'invite', invite: inv });
  if (!wasOnline) broadcastUser(u);
}

const handlers = {
  register(ws, m) {
    const username = str(m.username, 20);
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) return { error: 'Username must be 3-20 letters, numbers or _' };
    if (Object.keys(db.users).some((k) => k.toLowerCase() === username.toLowerCase())) return { error: 'That username is taken' };
    if (typeof m.password !== 'string' || m.password.length < 4) return { error: 'Password must be at least 4 characters' };
    const salt = rid(12);
    db.users[username] = {
      username, name: str(m.name, 30) || username, salt, hash: hashPw(m.password, salt), bio: '', status: 'online',
      bg: 'white', bgCustom: '#dbeafe', avatar: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      favorites: [], friends: [], stats: { w: 0, l: 0, d: 0 }, created: Date.now(),
    };
    const token = rid(24);
    db.tokens[token] = username;
    saveNow();
    broadcast({ t: 'user', user: publicUser(username) });
    onAuth(ws, username, token);
  },
  login(ws, m) {
    const key = Object.keys(db.users).find((k) => k.toLowerCase() === str(m.username, 20).toLowerCase());
    if (!key || !checkPw(db.users[key], m.password)) return { error: 'Wrong username or password' };
    const token = rid(24);
    db.tokens[token] = key;
    save();
    onAuth(ws, key, token);
  },
  resume(ws, m) {
    const u = db.tokens[m.token];
    if (!u || !db.users[u]) return { t: 'authFailed' };
    onAuth(ws, u, m.token);
  },
};

const authed = {
  logout(ws, u, m) {
    for (const [tok, owner] of Object.entries(db.tokens)) if (tok === m.token && owner === u) delete db.tokens[tok];
    save();
    ws.close();
  },
  msg(ws, u, m) {
    const room = db.rooms[m.room], text = str(m.text, 1000), file = attachment(m.file, u);
    if (!room || !canSee(room, u) || (!text && !file)) return;
    if (!rateOk(u)) return { error: 'Slow down a little!' };
    if (room.public && room.id !== 'global' && !room.members.includes(u)) {
      room.members.push(u);
      toRoom(room, { t: 'room', room: roomView(room) });
    }
    const msg = { from: u, text };
    if (file) msg.file = file;
    const orig = typeof m.replyTo === 'string' && room.messages.find((x) => x.id === m.replyTo && !x.sys);
    if (orig) msg.replyTo = replySnapshot(orig);
    postMessage(room, msg);
  },
  edit(ws, u, m) {
    const room = db.rooms[m.room], text = str(m.text, 1000);
    if (!room || !canSee(room, u)) return;
    const msg = room.messages.find((x) => x.id === m.id);
    if (!msg || msg.sys || msg.from !== u) return { error: 'You can only edit your own messages' };
    if (!text && !msg.file) return { error: 'A message can’t be empty' };
    if (text === msg.text) return;
    msg.history = (msg.history || []).concat({ text: msg.text, ts: msg.editedAt || msg.ts }).slice(-20);
    msg.text = text;
    msg.editedAt = Date.now();
    toRoom(room, { t: 'msgEdit', room: room.id, msg });
    save();
  },
  typing(ws, u, m) {
    const room = db.rooms[m.room];
    if (room && canSee(room, u)) broadcast({ t: 'typing', room: room.id, from: u }, (x) => x !== u && canSee(room, x));
  },
  createRoom(ws, u, m) {
    const name = str(m.name, 40);
    if (!name) return { error: 'Give your chat a name' };
    const members = [u].concat((Array.isArray(m.members) ? m.members : []).filter((x) => db.users[x] && x !== u)).slice(0, 50);
    const room = { id: rid(), name, public: !!m.public, members, owner: u, created: Date.now(), messages: [] };
    db.rooms[room.id] = room;
    toRoom(room, { t: 'room', room: roomView(room) });
    send(ws, { t: 'openRoom', id: room.id });
    sys(room, `${nameOf(u)} created “${name}”`);
  },
  dm(ws, u, m) {
    const other = m.with;
    if (!db.users[other] || other === u) return;
    const id = 'dm-' + [u, other].sort().join('-');
    let room = db.rooms[id];
    if (!room) {
      room = { id, name: '', dm: true, public: false, members: [u, other].sort(), owner: null, created: Date.now(), messages: [] };
      db.rooms[id] = room;
      toRoom(room, { t: 'room', room: roomView(room) });
      save();
    }
    send(ws, { t: 'openRoom', id });
  },
  addMembers(ws, u, m) {
    const room = db.rooms[m.room];
    if (!room || room.dm || room.id === 'global' || !room.members.includes(u)) return;
    const added = (Array.isArray(m.members) ? m.members : []).filter((x) => db.users[x] && !room.members.includes(x));
    if (!added.length) return;
    room.members.push(...added);
    toRoom(room, { t: 'room', room: roomView(room) });
    sys(room, `${nameOf(u)} added ${added.map(nameOf).join(', ')}`);
  },
  leaveRoom(ws, u, m) {
    const room = db.rooms[m.room];
    if (!room || room.id === 'global' || room.dm || !room.members.includes(u)) return;
    room.members = room.members.filter((x) => x !== u);
    if (!room.public) sendUser(u, { t: 'roomRemoved', id: room.id });
    if (!room.members.length) {
      delete db.rooms[room.id];
      if (room.public) broadcast({ t: 'roomRemoved', id: room.id });
      save();
      return;
    }
    toRoom(room, { t: 'room', room: roomView(room) });
    sys(room, `${nameOf(u)} left the chat`);
  },
  profile(ws, u, m) {
    const x = db.users[u], d = m.data || {};
    if (typeof d.name === 'string' && str(d.name, 30)) x.name = str(d.name, 30);
    if (typeof d.bio === 'string') x.bio = str(d.bio, 300);
    if (['online', 'offline', 'idle'].includes(d.status)) x.status = d.status;
    if (['white', 'black', 'custom'].includes(d.bg)) x.bg = d.bg;
    if (isColor(d.bgCustom)) x.bgCustom = d.bgCustom;
    if (isColor(d.avatar)) x.avatar = d.avatar;
    if (Array.isArray(d.favorites)) x.favorites = d.favorites.filter((g) => GAMES[g]).slice(0, 8);
    save();
    sendUser(u, { t: 'me', me: privateUser(u) });
    broadcastUser(u);
  },
  password(ws, u, m) {
    const x = db.users[u];
    if (!checkPw(x, m.old)) return { error: 'Current password is wrong' };
    if (typeof m.new !== 'string' || m.new.length < 4) return { error: 'New password must be at least 4 characters' };
    x.salt = rid(12);
    x.hash = hashPw(m.new, x.salt);
    save();
    return { t: 'notice', text: 'Password changed' };
  },
  friend(ws, u, m) {
    const x = db.users[u];
    if (!db.users[m.username] || m.username === u) return;
    x.friends = x.friends.filter((f) => f !== m.username);
    if (m.add) x.friends.push(m.username);
    save();
    sendUser(u, { t: 'me', me: privateUser(u) });
  },
  gameInvite(ws, u, m) {
    const to = m.to;
    if (!GAMES[m.game]) return { error: 'Unknown game' };
    if (!db.users[to] || to === u) return { error: 'Pick someone to play with' };
    const busy = busyReason(u) || busyReason(to);
    if (busy) return { error: busy };
    for (const inv of invites.values()) if (inv.from === u && inv.to === to) invites.delete(inv.id);
    const room = db.rooms[m.room] && canSee(db.rooms[m.room], to) ? m.room : 'global';
    const inv = { id: rid(), from: u, to, game: m.game, room, expires: Date.now() + 60000 };
    invites.set(inv.id, inv);
    sendUser(to, { t: 'invite', invite: inv });
    sys(db.rooms[room], `🎮 ${nameOf(u)} challenged ${nameOf(to)} to ${GAMES[m.game].name}`, { game: m.game });
    return { t: 'notice', text: `Challenge sent to ${nameOf(to)}` };
  },
  gameRespond(ws, u, m) {
    const inv = invites.get(m.id);
    if (!inv || inv.to !== u) return { error: 'That challenge has expired' };
    invites.delete(inv.id);
    if (!m.accept) {
      sendUser(inv.from, { t: 'notice', text: `${nameOf(u)} declined your ${GAMES[inv.game].name} challenge` });
      return;
    }
    if (Date.now() > inv.expires) return { error: 'That challenge has expired' };
    const busy = busyReason(inv.from) || (userGame.has(u) ? 'You are already in a game' : null);
    if (busy) return { error: busy };
    startGame(inv.game, [inv.from, u], inv.room);
  },
  gameInput(ws, u, m) {
    gameInput(u, m);
  },
  gameLeave(ws, u, m) {
    const s = sessions.get(m.id);
    if (!s || s.over) return;
    const idx = s.players.indexOf(u);
    if (idx >= 0) endGame(s, { winner: 1 - idx, reason: `${nameOf(u)} forfeited` });
  },
};

// ---------------------------------------------------------------- file uploads
const uploadMeta = (id) => {
  if (!/^[A-Za-z0-9_-]{16}$/.test(id)) return null;
  try { return JSON.parse(fs.readFileSync(path.join(UPLOAD_DIR, id + '.json'), 'utf8')); } catch { return null; }
};
// A message may only point at a file its sender uploaded; the details come from the server's record.
function attachment(f, u) {
  const id = f && typeof f.url === 'string' && (f.url.match(/^\/files\/([A-Za-z0-9_-]{16})$/) || [])[1];
  const meta = id && uploadMeta(id);
  if (!meta || meta.by !== u) return null;
  return { url: f.url, name: meta.name, type: meta.type, size: meta.size };
}
function handleUpload(req, res) {
  const json = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
  const u = db.tokens[req.headers['x-token']];
  if (!u || !db.users[u]) return json(401, { error: 'Sign in again to send files' });
  if (Number(req.headers['content-length']) > MAX_UPLOAD) { req.resume(); return json(413, { error: 'Files can be up to 10 MB' }); }
  let name = 'file';
  try { name = decodeURIComponent(req.headers['x-file-name'] || 'file'); } catch {}
  name = path.basename(name).replace(/[^\w .()+-]/g, '_').slice(0, 120) || 'file';
  const rawType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  const type = /^[\w.+-]+\/[\w.+-]+$/.test(rawType) ? rawType : 'application/octet-stream';
  const id = rid(12);
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const dest = path.join(UPLOAD_DIR, id), out = fs.createWriteStream(dest);
  let size = 0, failed = false;
  const fail = (code, msg) => {
    if (failed) return;
    failed = true;
    out.destroy();
    fs.rm(dest, { force: true }, () => {});
    json(code, { error: msg });
  };
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_UPLOAD) { fail(413, 'Files can be up to 10 MB'); req.destroy(); }
  });
  req.on('error', () => fail(400, 'Upload failed'));
  out.on('error', () => fail(500, 'Couldn’t save the file'));
  out.on('finish', () => {
    if (failed) return;
    if (!size) return fail(400, 'That file is empty');
    fs.writeFileSync(path.join(UPLOAD_DIR, id + '.json'), JSON.stringify({ name, type, size, by: u, ts: Date.now() }));
    json(200, { url: '/files/' + id, name, type, size });
  });
  req.pipe(out);
}
function serveUpload(req, res, id) {
  const meta = uploadMeta(id);
  const file = meta && path.join(UPLOAD_DIR, id);
  let stat;
  try { stat = fs.statSync(file); } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
  const inline = INLINE_TYPES.test(meta.type);
  const headers = {
    'Content-Type': inline ? meta.type : 'application/octet-stream',
    'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(meta.name)}`,
    'X-Content-Type-Options': 'nosniff',
    // uploads never run scripts, even an SVG or a PDF opened directly
    'Content-Security-Policy': "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'; sandbox",
    'Cache-Control': 'private, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
  };
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : stat.size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : stat.size - 1;
    start = Math.max(0, start); end = Math.min(end, stat.size - 1);
    if (start > end) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); return res.end(); }
    res.writeHead(206, Object.assign(headers, { 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 }));
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, Object.assign(headers, { 'Content-Length': stat.size }));
  fs.createReadStream(file).pipe(res);
}

// ---------------------------------------------------------------- http + websocket
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const PUBLIC = path.join(__dirname, 'public');
const server = http.createServer((req, res) => {
  let url;
  try { url = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400); return res.end(); }
  if (req.method === 'POST' && url === '/upload') return handleUpload(req, res);
  if (url.startsWith('/files/')) return serveUpload(req, res, url.slice(7));
  let file;
  if (url === '/shared/rules.js') file = path.join(__dirname, 'shared', 'rules.js');
  else if (url === '/realtime.js') file = path.join(__dirname, 'realtime.js'); // bot games run the simulations in the browser
  else {
    file = path.normalize(path.join(PUBLIC, url === '/' ? 'index.html' : url));
    if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end(); }
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 64 * 1024 });
wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.t !== 'string') return;
    let reply;
    try {
      if (!ws.user && Object.hasOwn(handlers, m.t)) reply = handlers[m.t](ws, m);
      else if (ws.user && Object.hasOwn(authed, m.t)) reply = authed[m.t](ws, ws.user, m);
    } catch (e) {
      console.error('handler error', m.t, e);
      reply = { error: 'Something went wrong' };
    }
    if (reply && reply.error) send(ws, { t: 'error', text: reply.error, for: m.t });
    else if (reply) send(ws, reply);
  });
  ws.on('close', () => {
    const u = ws.user;
    if (!u || !conns.has(u)) return;
    conns.get(u).delete(ws);
    if (conns.get(u).size) return;
    conns.delete(u);
    for (const inv of invites.values()) if (inv.from === u || inv.to === u) invites.delete(inv.id);
    if (userGame.has(u)) {
      // give them 20 seconds to come back (e.g. a page refresh) before forfeiting
      forfeitTimers.set(u, setTimeout(() => {
        const s = sessions.get(userGame.get(u));
        if (s && !isConnected(u)) endGame(s, { winner: 1 - s.players.indexOf(u), reason: `${nameOf(u)} disconnected` });
      }, 20000));
    }
    broadcastUser(u);
  });
});
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
  const now = Date.now();
  for (const inv of invites.values()) if (now > inv.expires) invites.delete(inv.id);
}, 30000);

process.on('SIGINT', () => { saveNow(); process.exit(0); });
process.on('SIGTERM', () => { saveNow(); process.exit(0); });

server.listen(PORT, () => console.log(`Chat running on http://localhost:${server.address().port}`));
module.exports = server;
