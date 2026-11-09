import { CONFIG, PLOT_DEFS, plotToWorld, dist2D, PLAYER_COLORS, sanitizeName } from '../shared/config.js';
import { ITEMS, ITEM_BY_ID, SPECIAL_PADS, isAvailable, incomeMultiplier, dropperInterval } from '../shared/items.js';

let nextPlayerId = 1;

function randomToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export class Plot {
  constructor(idx) {
    this.idx = idx;
    this.reset();
  }
  reset() {
    this.ownerId = null;
    this.owned = new Set();
    this.pool = 0;              // uncollected cash sitting in the collector
    this.timers = new Map();    // dropperId -> seconds accumulated
    this.pending = [];          // cubes in transit: { at, value }
  }
}

export class Room {
  constructor(id, { now = () => Date.now() } = {}) {
    this.id = id;
    this.now = now;
    this.players = new Map();   // id -> player
    this.plots = PLOT_DEFS.map((_, i) => new Plot(i));
    this.drops = [];            // drop events accumulated for the next snapshot
    this.events = [];           // misc events accumulated for the next snapshot
    this.simTime = 0;
    this.createdAt = now();
    this.onEmpty = null;
  }

  // ---------- players ----------

  get connectedCount() {
    let n = 0;
    for (const p of this.players.values()) if (p.connected) n++;
    return n;
  }

  get occupancy() {
    return this.players.size;
  }

  isFull() {
    return this.players.size >= CONFIG.MAX_PLAYERS_PER_ROOM;
  }

  findByToken(token) {
    if (!token) return null;
    for (const p of this.players.values()) if (p.token === token) return p;
    return null;
  }

  addPlayer(ws, { name, token }) {
    let player = this.findByToken(token);
    if (player) {
      // Reconnect: resume the existing player.
      player.ws = ws;
      player.connected = true;
      player.disconnectedAt = null;
      this.events.push({ e: 'join', id: player.id, name: player.name, rejoin: true });
      return player;
    }
    if (this.isFull()) return null;
    const usedColors = new Set([...this.players.values()].map((p) => p.color));
    const color = PLAYER_COLORS.find((c) => !usedColors.has(c)) ?? PLAYER_COLORS[this.players.size % PLAYER_COLORS.length];
    player = {
      id: nextPlayerId++,
      name: sanitizeName(name),
      token: randomToken(),
      color,
      ws,
      connected: true,
      disconnectedAt: null,
      pos: { x: 0, y: 0, z: 0 },
      ry: 0,
      anim: 0,
      cash: 0,
      rebirths: 0,
      plotIdx: null,
      lastChatAt: 0,
      lastPadAt: 0,
      joinedAt: this.now(),
    };
    // Spawn on the east or west side of the hub (the leaderboard totems stand north and south).
    player.pos.x = (Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 4);
    player.pos.z = (Math.random() - 0.5) * 10;
    player.ry = Math.atan2(-player.pos.x, -player.pos.z);
    this.players.set(player.id, player);
    this.events.push({ e: 'join', id: player.id, name: player.name });
    return player;
  }

  disconnectPlayer(player) {
    if (!this.players.has(player.id)) return;
    player.connected = false;
    player.ws = null;
    player.disconnectedAt = this.now();
    this.events.push({ e: 'away', id: player.id, name: player.name });
  }

  removePlayer(player) {
    if (!this.players.delete(player.id)) return;
    if (player.plotIdx !== null) {
      const plot = this.plots[player.plotIdx];
      if (plot.ownerId === player.id) plot.reset();
    }
    this.events.push({ e: 'leave', id: player.id, name: player.name });
    if (this.players.size === 0 && this.onEmpty) this.onEmpty(this);
  }

  // Remove players whose reconnect grace has expired.
  reapDisconnected() {
    const t = this.now();
    for (const p of [...this.players.values()]) {
      if (!p.connected && t - p.disconnectedAt > CONFIG.RECONNECT_GRACE_MS) this.removePlayer(p);
    }
  }

  // ---------- messages from clients ----------

  handleMove(player, m) {
    const x = Number(m.x), y = Number(m.y), z = Number(m.z);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;
    player.pos.x = Math.max(-CONFIG.WORLD_HALF_X, Math.min(CONFIG.WORLD_HALF_X, x));
    player.pos.y = Math.max(0, Math.min(200, y));
    player.pos.z = Math.max(-CONFIG.WORLD_HALF_Z, Math.min(CONFIG.WORLD_HALF_Z, z));
    player.ry = Number.isFinite(+m.ry) ? +m.ry : 0;
    player.anim = m.anim | 0;
  }

  handleChat(player, text) {
    const t = this.now();
    if (t - player.lastChatAt < 800) return;
    text = String(text ?? '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, CONFIG.CHAT_MAX);
    if (!text) return;
    player.lastChatAt = t;
    this.events.push({ e: 'chat', id: player.id, name: player.name, text });
  }

  // A client reports that it stepped on a pad. Everything is verified here.
  handlePad(player, { plot: plotIdx, pad }) {
    plotIdx = plotIdx | 0;
    const plot = this.plots[plotIdx];
    if (!plot) return { ok: false, reason: 'bad plot' };

    let local, radius;
    if (pad === 'claim') {
      local = SPECIAL_PADS.claim.pad; radius = SPECIAL_PADS.claim.radius;
    } else if (pad === 'collect') {
      local = SPECIAL_PADS.collect.pad; radius = SPECIAL_PADS.collect.radius;
    } else {
      const item = ITEM_BY_ID[pad];
      if (!item) return { ok: false, reason: 'unknown pad' };
      local = item.pad; radius = CONFIG.PAD_RADIUS;
    }
    const w = plotToWorld(plotIdx, local[0], local[1]);
    if (dist2D(player.pos.x, player.pos.z, w.x, w.z) > radius + CONFIG.INTERACT_SLACK) {
      return { ok: false, reason: 'too far' };
    }

    if (pad === 'claim') return this.claimPlot(player, plot);
    if (pad === 'collect') return this.collect(player, plot);
    return this.purchase(player, plot, ITEM_BY_ID[pad]);
  }

  claimPlot(player, plot) {
    if (plot.ownerId !== null) return { ok: false, reason: 'owned' };
    if (player.plotIdx !== null) return { ok: false, reason: 'already have plot' };
    plot.reset();
    plot.ownerId = player.id;
    player.plotIdx = plot.idx;
    this.events.push({ e: 'claim', id: player.id, name: player.name, plot: plot.idx });
    return { ok: true };
  }

  collect(player, plot) {
    if (plot.ownerId !== player.id) return { ok: false, reason: 'not yours' };
    const amount = Math.floor(plot.pool);
    if (amount <= 0) return { ok: true, amount: 0 };
    plot.pool -= amount;
    player.cash += amount;
    this.events.push({ e: 'collect', id: player.id, plot: plot.idx, amount });
    return { ok: true, amount };
  }

  purchase(player, plot, item) {
    if (plot.ownerId !== player.id) return { ok: false, reason: 'not yours' };
    if (!isAvailable(item, plot.owned)) return { ok: false, reason: 'locked' };
    if (player.cash < item.price) return { ok: false, reason: 'poor' };
    player.cash -= item.price;

    if (item.type === 'rebirth') {
      player.rebirths += 1;
      player.cash = 0;
      plot.reset();
      plot.ownerId = player.id;
      this.events.push({ e: 'rebirth', id: player.id, name: player.name, plot: plot.idx, rebirths: player.rebirths });
      return { ok: true, rebirth: true };
    }

    plot.owned.add(item.id);
    if (item.type === 'dropper') plot.timers.set(item.id, 0);
    if (item.id === 'autocollect') {
      // Flush whatever is in the collector straight away.
      player.cash += Math.floor(plot.pool);
      plot.pool = 0;
    }
    this.events.push({ e: 'buy', id: player.id, plot: plot.idx, item: item.id });
    return { ok: true };
  }

  // ---------- simulation ----------

  tick(dt) {
    this.simTime += dt;
    for (const plot of this.plots) {
      if (plot.ownerId === null) continue;
      const owner = this.players.get(plot.ownerId);
      if (!owner) { plot.reset(); continue; }
      const mult = incomeMultiplier(plot.owned, owner.rebirths, CONFIG.REBIRTH_BONUS);

      for (const item of ITEMS) {
        if (item.type !== 'dropper' || !plot.owned.has(item.id)) continue;
        const interval = dropperInterval(item, plot.owned);
        let t = (plot.timers.get(item.id) ?? 0) + dt;
        while (t >= interval) {
          t -= interval;
          const travel = CONFIG.FALL_TIME + (CONFIG.COLLECTOR_X - item.x) / CONFIG.CONVEYOR_SPEED;
          plot.pending.push({ at: this.simTime + travel, value: item.value * mult });
          this.drops.push([plot.idx, item.id]);
        }
        plot.timers.set(item.id, t);
      }

      if (plot.pending.length) {
        const keep = [];
        for (const c of plot.pending) {
          if (c.at <= this.simTime) {
            if (plot.owned.has('autocollect')) owner.cash += c.value;
            else plot.pool += c.value;
          } else keep.push(c);
        }
        plot.pending = keep;
      }
    }
  }

  // ---------- serialization ----------

  plotState(plot) {
    return { idx: plot.idx, owner: plot.ownerId, owned: [...plot.owned], pool: Math.floor(plot.pool) };
  }

  playerState(p) {
    return {
      id: p.id, name: p.name, color: p.color, connected: p.connected,
      x: p.pos.x, y: p.pos.y, z: p.pos.z, ry: p.ry, anim: p.anim,
      cash: Math.floor(p.cash), rebirths: p.rebirths, plot: p.plotIdx,
    };
  }

  fullState() {
    return {
      room: this.id,
      players: [...this.players.values()].map((p) => this.playerState(p)),
      plots: this.plots.map((p) => this.plotState(p)),
    };
  }

  // Snapshot: compact arrays to keep bandwidth low.
  snapshot() {
    const p = [];
    for (const pl of this.players.values()) {
      p.push([pl.id, +pl.pos.x.toFixed(2), +pl.pos.y.toFixed(2), +pl.pos.z.toFixed(2), +pl.ry.toFixed(2), pl.anim, Math.floor(pl.cash), pl.rebirths, pl.plotIdx]);
    }
    const k = this.plots.map((pl) => Math.floor(pl.pool));
    const snap = { t: 's', p, k };
    if (this.drops.length) { snap.d = this.drops; this.drops = []; }
    if (this.events.length) { snap.e = this.events; this.events = []; }
    return snap;
  }

  broadcast(obj, except = null) {
    const data = JSON.stringify(obj);
    for (const pl of this.players.values()) {
      if (!pl.connected || !pl.ws || pl === except) continue;
      if (pl.ws.readyState === 1) pl.ws.send(data);
    }
  }
}
