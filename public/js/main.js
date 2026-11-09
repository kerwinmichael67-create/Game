import * as THREE from 'three';
import { CONFIG, PLOT_DEFS, plotToWorld, formatCash } from '/shared/config.js';
import { ITEMS, ITEM_BY_ID, incomeMultiplier, dropperInterval } from '/shared/items.js';
import { Net } from './net.js';
import { UI } from './ui.js';
import { Controls } from './controls.js';
import { Avatar } from './avatar.js';
import { LocalPlayer } from './player.js';
import { buildEnvironment, drawLeaderboard, Plot, padAt } from './world.js';
import { sfx } from './sfx.js';

const C = CONFIG;

// ---------- renderer / scene ----------
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(0, 30, 60);
camera.lookAt(0, 0, 0);
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const env = buildEnvironment(scene);
const plots = PLOT_DEFS.map((_, i) => new Plot(i, scene));

// ---------- state ----------
const ui = new UI();
const net = new Net();
const controls = new Controls(canvas, ui);
const isTouch = controls.touch;
if (isTouch) { renderer.shadowMap.enabled = false; renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); }

const state = {
  myId: null,
  token: null,
  room: null,
  players: new Map(),   // id -> { data, avatar, target: {x,y,z,ry}, isMe }
  me: null,             // my player data (from server)
  local: null,          // LocalPlayer
  lastSend: 0,
  lastSent: null,
  padCooldown: new Map(),
  joined: false,
  reconnectAttempts: 0,
  lastDeny: 0,
  cashHistory: [],
};
try { state.token = localStorage.getItem('bt_token'); } catch {}

// ---------- join flow ----------
ui.onPlay(({ name, room }) => {
  sfx.unlock();
  state.pendingJoin = { name, room };
  net.connect({ name, room: room || undefined, token: state.token || undefined });
});

net.addEventListener('error', (e) => {
  ui.showJoinError(e.detail.message || 'Could not join.');
  state.pendingJoin = null;
});

net.addEventListener('welcome', (e) => {
  const { id, token, state: full } = e.detail;
  state.myId = id;
  state.token = token;
  state.room = full.room;
  try { localStorage.setItem('bt_token', token); } catch {}
  history.replaceState(null, '', `?room=${full.room}`);

  // Rebuild everything from the full state (also used on reconnect).
  for (const p of state.players.values()) { scene.remove(p.avatar.group); p.avatar.dispose(); }
  state.players.clear();
  for (const p of full.players) addPlayer(p);
  for (const ps of full.plots) {
    const plot = plots[ps.idx];
    plot.setState(ps);
    plot.setOwnerName(ps.owner !== null ? state.players.get(ps.owner)?.data.name ?? null : null);
  }

  const me = state.players.get(id);
  state.me = me.data;
  if (!state.local) {
    state.local = new LocalPlayer(me.avatar, camera);
  } else {
    state.local.avatar = me.avatar;
  }
  state.local.teleport(me.data.x, me.data.y, me.data.z);
  state.local.yaw = Math.atan2(me.data.x, me.data.z); // camera sits outside the hub looking in
  me.avatar.targetYaw = me.data.ry;
  me.avatar.body.rotation.y = me.data.ry;
  me.isMe = true;

  ui.enterGame();
  ui.setRoom(full.room);
  ui.setRebirths(me.data.rebirths);
  state.joined = true;
  state.reconnectAttempts = 0;
  ui.chatLine(null, `Welcome to Blox Tycoon, ${me.data.name}! You're on server ${full.room}.`);
  if (me.data.plot === null) ui.chatLine(null, 'Walk to an empty plot and step on the gold CLAIM pad to start your tycoon.');
});

net.addEventListener('pjoin', (e) => {
  const p = e.detail.player;
  if (!state.players.has(p.id)) addPlayer(p);
});

net.addEventListener('denied', (e) => {
  const { reason } = e.detail;
  const now = performance.now();
  if (now - state.lastDeny < 1500) return;
  state.lastDeny = now;
  if (reason === 'poor') { ui.toast('Not enough cash!', 'bad', 1500); sfx.deny(); }
  else if (reason === 'owned') ui.toast('Someone already owns that tycoon.', 'bad');
  else if (reason === 'already have plot') ui.toast('You already own a tycoon.', 'bad');
});

net.addEventListener('s', (e) => onSnapshot(e.detail));

net.addEventListener('close', (e) => {
  if (!state.joined) {
    if (state.pendingJoin) ui.showJoinError('Could not connect to the server.');
    return;
  }
  // Try to resume with our token; the server keeps our tycoon for a grace period.
  const delay = Math.min(8000, 1000 * 2 ** state.reconnectAttempts++);
  ui.showDisconnected(`Lost connection. Reconnecting in ${Math.round(delay / 1000)}s…`);
  setTimeout(() => {
    if (!net.open) net.connect({ name: state.me?.name, room: state.room, token: state.token });
  }, delay);
});

function addPlayer(p) {
  const avatar = new Avatar({ name: p.name, color: p.color });
  avatar.group.position.set(p.x, p.y, p.z);
  avatar.targetYaw = p.ry;
  avatar.body.rotation.y = p.ry;
  if (p.connected === false) avatar.setAway(true);
  scene.add(avatar.group);
  const entry = { data: p, avatar, target: { x: p.x, y: p.y, z: p.z, ry: p.ry }, isMe: p.id === state.myId };
  state.players.set(p.id, entry);
  return entry;
}

function removePlayer(id) {
  const p = state.players.get(id);
  if (!p) return;
  scene.remove(p.avatar.group);
  p.avatar.dispose();
  state.players.delete(id);
}

// ---------- snapshots & events ----------
function onSnapshot(s) {
  for (const row of s.p) {
    const [id, x, y, z, ry, anim, cash, rebirths, plotIdx] = row;
    const p = state.players.get(id);
    if (!p) continue;
    p.data.cash = cash;
    p.data.rebirths = rebirths;
    p.data.plot = plotIdx;
    if (id === state.myId) continue; // we are authoritative over our own position client-side
    p.target.x = x; p.target.y = y; p.target.z = z; p.target.ry = ry;
    p.avatar.anim = anim;
    p.avatar.targetYaw = ry;
  }
  for (let i = 0; i < s.k.length; i++) plots[i].pool = s.k[i];
  if (s.d) for (const [plotIdx, dropperId] of s.d) plots[plotIdx]?.spawnCube(dropperId);
  if (s.e) for (const ev of s.e) onEvent(ev);
}

function onEvent(ev) {
  const me = ev.id === state.myId;
  switch (ev.e) {
    case 'join':
      if (!me) {
        ui.chatLine(null, `${ev.name} ${ev.rejoin ? 'is back' : 'joined the server'}.`);
        const p = state.players.get(ev.id);
        if (p && ev.rejoin) { p.data.connected = true; p.avatar.setAway(false); }
      }
      break;
    case 'away': {
      const p = state.players.get(ev.id);
      if (p) { p.data.connected = false; p.avatar.setAway(true); }
      if (!me) ui.chatLine(null, `${ev.name} disconnected (tycoon saved for 2 min).`);
      break;
    }
    case 'leave': {
      const p = state.players.get(ev.id);
      if (p && p.data.plot !== null) { const plot = plots[p.data.plot]; plot.setState({ owner: null, owned: [], pool: 0 }); plot.setOwnerName(null); plot.resetOwned(); }
      for (const plot of plots) if (plot.owner === ev.id) { plot.setState({ owner: null, owned: [], pool: 0 }); plot.setOwnerName(null); plot.resetOwned(); }
      removePlayer(ev.id);
      ui.chatLine(null, `${ev.name} left the server.`);
      break;
    }
    case 'claim': {
      const plot = plots[ev.plot];
      plot.setState({ owner: ev.id, owned: [], pool: 0 });
      plot.setOwnerName(ev.name);
      if (me) { ui.toast('Tycoon claimed! Step on the FREE Dropper pad to start earning.', 'good', 5000); sfx.claim(); ui.setTeleportVisible(true); }
      else ui.chatLine(null, `${ev.name} claimed a tycoon.`);
      break;
    }
    case 'buy': {
      const plot = plots[ev.plot];
      plot.addOwned(ev.item);
      const item = ITEM_BY_ID[ev.item];
      if (me) { ui.toast(`Bought ${item.name}!`, 'good', 1800); sfx.buy(); }
      break;
    }
    case 'collect':
      if (me) { ui.toast(`+${formatCash(ev.amount)}`, 'good', 1200); sfx.collect(); }
      break;
    case 'rebirth': {
      const plot = plots[ev.plot];
      plot.resetOwned();
      plot.setState({ owner: ev.id, owned: [], pool: 0 });
      if (me) { ui.toast(`REBIRTH ${ev.rebirths}! All income +${Math.round(ev.rebirths * C.REBIRTH_BONUS * 100)}%`, 'gold', 6000); sfx.rebirth(); ui.setRebirths(ev.rebirths); }
      ui.chatLine(null, `★ ${ev.name} rebirthed! (${ev.rebirths})`);
      break;
    }
    case 'chat': {
      const p = state.players.get(ev.id);
      ui.chatLine(ev.name, ev.text, p?.data.color);
      if (!me) sfx.chat();
      break;
    }
  }
}

// ---------- chat & hotkeys ----------
controls.onKey = (code, e) => {
  if (code === 'Enter') { if (state.joined && !ui.chatOpen) { ui.openChat(); e.preventDefault(); return true; } }
  if (code === 'KeyH') { ui.toggleHelp(); return true; }
  if (code === 'KeyT') { teleportHome(); return true; }
  if (code === 'Escape') { ui.toggleHelp(false); return true; }
  return false;
};
ui.chatInput.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Enter') {
    const text = ui.chatInput.value.trim();
    if (text) net.send({ t: 'chat', text });
    ui.closeChat();
  } else if (e.key === 'Escape') ui.closeChat();
});
ui.tpBtn.addEventListener('click', teleportHome);

function teleportHome() {
  if (!state.me || state.me.plot === null || !state.local) return;
  const w = plotToWorld(state.me.plot, 0, C.PLOT_SIZE / 2 + 3);
  state.local.teleport(w.x, 0, w.z);
  state.local.yaw = PLOT_DEFS[state.me.plot].rot + Math.PI;
}

// ---------- pads ----------
function checkPads() {
  const me = state.me;
  const pos = state.local.pos;
  if (!me) return;
  let promptText = null, promptKind = '';
  const now = performance.now();

  for (const plot of plots) {
    // Quick reject: far from this plot.
    if (Math.abs(pos.x - plot.def.x) > C.PLOT_SIZE / 2 + 4 || Math.abs(pos.z - plot.def.z) > C.PLOT_SIZE / 2 + 4) continue;
    const pad = padAt(plot, pos.x, pos.z);
    if (!pad) continue;
    const key = `${plot.idx}:${pad.id}`;
    const mine = plot.owner === state.myId;
    let shouldSend = false;

    if (pad.kind === 'claim') {
      if (me.plot === null) { promptText = 'Claiming tycoon…'; promptKind = 'ok'; shouldSend = true; }
      else { promptText = 'You already own a tycoon'; promptKind = 'bad'; }
    } else if (pad.kind === 'collect') {
      if (mine) {
        if (plot.owned.has('autocollect')) { promptText = 'Auto Collector is on<small>cash goes straight to your wallet</small>'; promptKind = 'ok'; }
        else if (plot.pool > 0) { promptText = `Collecting ${formatCash(plot.pool)}…`; promptKind = 'ok'; shouldSend = true; }
        else { promptText = 'Collector is empty'; promptKind = ''; }
      } else promptText = `${plot.ownerName}'s collector`;
    } else {
      const item = pad.item;
      if (!mine) { promptText = `${plot.ownerName}'s tycoon`; }
      else if (me.cash >= item.price) { promptText = `Buying ${item.name}…<small>${item.desc}</small>`; promptKind = 'ok'; shouldSend = true; }
      else { promptText = `${item.name} — ${formatCash(item.price)}<small>Need ${formatCash(item.price - me.cash)} more · ${item.desc}</small>`; promptKind = 'bad'; }
    }

    if (shouldSend && (now - (state.padCooldown.get(key) ?? 0)) > 500) {
      state.padCooldown.set(key, now);
      net.send({ t: 'pad', plot: plot.idx, pad: pad.id });
    }
  }
  ui.setPrompt(promptText, promptKind);
}

// ---------- income estimate (for the HUD) ----------
function incomePerSecond(plot, rebirths) {
  let total = 0;
  const mult = incomeMultiplier(plot.owned, rebirths, C.REBIRTH_BONUS);
  for (const it of ITEMS) if (it.type === 'dropper' && plot.owned.has(it.id)) total += it.value * mult / dropperInterval(it, plot.owned);
  return total;
}

// ---------- main loop ----------
let last = performance.now();
let lbTimer = 0;
let boardTimer = 0;
let physAcc = 0;
const PHYS_STEP = 1 / 60;
const sunOffset = new THREE.Vector3(60, 120, 40);

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  const input = controls.poll();
  if (state.joined && state.local) {
    const solids = env.solids.concat(...plots.map((p) => p.getSolids()));
    if (ui.chatOpen || !ui.help.classList.contains('hidden')) { input.moveX = 0; input.moveZ = 0; input.jump = false; }
    // Fixed-step physics so movement speed is identical at any frame rate.
    physAcc += dt;
    let steps = 0;
    while (physAcc >= PHYS_STEP && steps < 8) {
      state.local.update(PHYS_STEP, input, solids, sfx);
      input.jump = false; input.lookDX = 0; input.lookDY = 0; input.zoom = 0; // one-shot inputs
      physAcc -= PHYS_STEP;
      steps++;
    }
    if (steps === 8) physAcc = 0;

    // Send our position to the server at a fixed rate.
    if (now - state.lastSend > 1000 / C.POSITION_SEND_HZ) {
      state.lastSend = now;
      const p = state.local.pos;
      const msg = { t: 'move', x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), ry: +state.local.facing.toFixed(2), anim: state.local.anim };
      const sig = `${msg.x},${msg.y},${msg.z},${msg.ry},${msg.anim}`;
      if (sig !== state.lastSent) { state.lastSent = sig; net.send(msg); }
    }

    checkPads();

    // HUD.
    const me = state.me;
    ui.setCash(me.cash);
    ui.setPing(net.rtt);
    ui.setRebirths(me.rebirths);
    ui.setTeleportVisible(me.plot !== null);
    if (me.plot === null) {
      ui.setStatus('Find an empty plot and step on the gold CLAIM pad.');
      ui.setIncome('');
    } else {
      const plot = plots[me.plot];
      const ips = incomePerSecond(plot, me.rebirths);
      const ownedCount = plot.owned.size, total = ITEMS.length - 1;
      ui.setStatus(ownedCount === 0 ? 'Step on the FREE Dropper pad to start earning.' : (ownedCount >= total ? 'Everything built! Step on REBIRTH.' : `Tycoon: ${ownedCount}/${total} items · Collector: ${formatCash(plot.pool)}`));
      ui.setIncome(ips > 0 ? `${ips < 100 ? '$' + ips.toFixed(1) : formatCash(ips)}/sec` : '');
    }

    // Shadow camera follows the player.
    const p = state.local.pos;
    env.sun.position.copy(p).add(sunOffset);
    env.sun.target.position.copy(p);
    env.sun.target.updateMatrixWorld();
  }

  // Remote players: interpolate toward their latest snapshot.
  for (const p of state.players.values()) {
    if (p.isMe) continue;
    const g = p.avatar.group.position;
    const k = Math.min(1, dt * 12);
    g.x += (p.target.x - g.x) * k; g.y += (p.target.y - g.y) * k; g.z += (p.target.z - g.z) * k;
    p.avatar.update(dt);
  }
  if (state.local) state.local.avatar.update(dt);

  for (const plot of plots) {
    plot.update(dt);
    plot.updatePads(state.myId, state.me?.cash ?? 0);
  }

  // Leaderboard: HUD twice a second, the in-world boards once a second.
  lbTimer += dt; boardTimer += dt;
  if (lbTimer > 0.5) {
    lbTimer = 0;
    const rows = [...state.players.values()].map((p) => p.data).sort((a, b) => (b.rebirths - a.rebirths) || (b.cash - a.cash));
    ui.leaderboard(rows, state.myId);
    if (boardTimer > 1) {
      boardTimer = 0;
      for (const b of env.boards) drawLeaderboard(b, rows, state.myId);
    }
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

// Idle camera drift on the join screen.
(function idleCam() {
  if (state.joined) return;
  const t = performance.now() / 1000;
  camera.position.set(Math.sin(t * 0.08) * 70, 28, Math.cos(t * 0.08) * 70);
  camera.lookAt(0, 6, 0);
  requestAnimationFrame(idleCam);
})();

// Debug/test hook: teleport to plot-local coordinates, e.g. __bt.goto(0, 0, 21) stands on plot 0's claim pad.
window.__bt = {
  goto(plotIdx, lx, lz) {
    if (!state.local) return;
    const w = plotToWorld(plotIdx, lx, lz);
    state.local.teleport(w.x, 0, w.z);
  },
  cheat(amount = 1e6) { net.send({ t: 'cheat', amount }); },
  state,
  plots,
};
