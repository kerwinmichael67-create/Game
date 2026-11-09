/* ========================================================================
   Online multiplayer over the artifact `room` capability.
   Everything travels in presence (coalesced ~30/s, allowed for every viewer):
     lobby presence:  { name, color, room }
     race-room presence: { name, color, ready, phase, settings, seed, car, bots, fin, best }
   The host is the room peer with the lowest peer id; everyone computes it the same way.
   ======================================================================== */
const Net = {
  room: null, user: null, named: null, code: null, peers: [], roomPeers: [], myPeer: null, hostPeer: null, isHost: false,
  active: false, phase: 'lobby', ready: false, settings: { track: 'bay', laps: 3, bots: 2 }, seed: 1, connected: false, unavailable: false,
  remoteCars: new Map(), lastSend: 0, lastHostBots: null, raceStartedFrom: null,

  async init() {
    try {
      if (!window.claude || !window.claude.use) { this.setUnavailable('Online play works when this page is opened on claude.ai while signed in.'); return; }
      const [room, user] = await Promise.all([claude.use('room'), claude.use('user')]);
      this.user = user;
      if (!room) { this.setUnavailable('Online play is not available in this view. Open the artifact signed in on claude.ai, or share it with teammates by link, to race together.'); return; }
      this.room = room;
      room.onConnection((on) => { this.connected = on; this.renderStatus(); }, (e) => { this.setUnavailable('Online play is unavailable for this viewer.'); });
      room.onPeers((ch) => { this.peers = ch.peers; UI.renderLobby && UI.renderLobby(); }, (e) => { this.setUnavailable('Online play is unavailable for this viewer.'); });
      this.updateLobbyPresence();
      this.renderStatus();
    } catch (e) { this.setUnavailable('Online play could not start in this view.'); }
  },
  setUnavailable(msg) { this.unavailable = true; this.unavailableMsg = msg; this.renderStatus(); },
  renderStatus() {
    const on = !!this.room && this.connected && !this.unavailable;
    for (const id of ['#m-online-status', '#o-status']) { const s = $(id); if (!s) continue; s.classList.toggle('on', on); s.lastElementChild.textContent = this.unavailable ? 'Offline' : on ? 'Connected' : 'Connecting…'; }
    const n = $('#o-notice'); if (n) { n.hidden = !this.unavailable; n.textContent = this.unavailableMsg || ''; }
    $('#b-create').disabled = !on; $('#b-join').disabled = !on;
  },
  myName() { return (Profile.data.name || '').trim().slice(0, 16) || 'Racer'; },
  myColor() { return (PAINTS.find(p => p.id === Profile.data.paint) || PAINTS[0]).id; },
  updateLobbyPresence() { if (!this.room) return; this.room.presence({ name: this.myName(), color: this.myColor(), room: this.code || null }).catch(() => {}); if (this.named) this.named.presence({ name: this.myName(), color: this.myColor() }).catch(() => {}); },
  colorHex(id) { return (PAINTS.find(p => p.id === id) || PAINTS[0]).hex; },
  peerName(p) { const n = p.presence && typeof p.presence.name === 'string' ? p.presence.name.trim().slice(0, 16) : ''; return n || 'Racer'; },

  /* open rooms derived from lobby presences */
  openRooms() {
    const map = new Map();
    for (const p of this.peers) { const c = p.presence && p.presence.room; if (typeof c !== 'string' || !/^[a-z0-9]{4,8}$/.test(c)) continue; if (!map.has(c)) map.set(c, { code: c, players: [] }); map.get(c).players.push(p); }
    return Array.from(map.values());
  },
  genCode() { const A = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = ''; for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)]; return s; },
  async create() { await this.join(this.genCode()); },
  async join(code) {
    code = String(code || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8); if (code.length < 4 || !this.room) return false;
    if (this.named) await this.leave(false);
    try {
      const named = await this.room.join(code); this.named = named; this.code = code; this.ready = false; this.phase = 'lobby';
      named.onPeers((ch) => this.onRoomPeers(ch), (e) => { UI.toastMsg && UI.toastMsg('Lost the room connection.'); this.leave(true); });
      await named.presence({ name: this.myName(), color: this.myColor(), ready: false, phase: 'lobby', joinedAt: Date.now() });
      this.updateLobbyPresence(); UI.show('room'); UI.renderRoom(); return true;
    } catch (e) { UI.toastMsg && UI.toastMsg(e && e.code === 'limit_reached' ? 'Too many rooms open right now. Try again shortly.' : 'Could not join that room.'); return false; }
  },
  async leave(toLobby = true) {
    const n = this.named; this.named = null; this.code = null; this.roomPeers = []; this.isHost = false; this.hostPeer = null; this.active = false; this.phase = 'lobby'; this.ready = false;
    if (n) { try { await n.leave(); } catch (e) {} }
    this.updateLobbyPresence(); this.clearRemotes();
    if (toLobby) { if (Game.state !== 'idle') Game.stop(); UI.show('online'); UI.renderLobby(); }
  },
  setReady(on) { this.ready = on; if (this.named) this.named.presence({ ready: on }).catch(() => {}); UI.renderRoom(); },
  setSettings(patch) { if (!this.isHost) return; Object.assign(this.settings, patch); this.named && this.named.presence({ settings: Object.assign({}, this.settings) }).catch(() => {}); UI.renderRoom(); },

  onRoomPeers(ch) {
    this.roomPeers = ch.peers.filter(p => p.kind === 'viewer');
    this.myPeer = this.roomPeers.find(p => p.isMe && p.sameTab) || null;
    const sorted = this.roomPeers.slice().sort((a, b) => (a.peer < b.peer ? -1 : a.peer > b.peer ? 1 : 0));
    const host = sorted[0] || null; const wasHost = this.isHost; this.hostPeer = host; this.isHost = !!(host && this.myPeer && host.peer === this.myPeer.peer);
    if (this.isHost && !wasHost) {
      /* adopt the previous host's settings so the room doesn't jump */
      if (host && host.presence && host.presence.settings) Object.assign(this.settings, this.sanitizeSettings(host.presence.settings));
      this.named && this.named.presence({ settings: Object.assign({}, this.settings), phase: this.phase }).catch(() => {});
      if (this.active && Game.state !== 'idle') this.adoptBots();
    }
    if (host && !this.isHost && host.presence) {
      if (host.presence.settings) this.settings = this.sanitizeSettings(host.presence.settings);
      const hp = host.presence.phase;
      const hostSeed = host.presence.seed;
      if ((hp === 'countdown' || hp === 'racing') && typeof hostSeed === 'number' && hostSeed !== this.seed && (!this.active || Game.results)) {
        /* host launched a new race: join if it is just starting (within the countdown window) */
        const startedAt = typeof host.presence.startedAt === 'number' ? host.presence.startedAt : 0;
        if (hp === 'countdown' || Date.now() - startedAt < 6000) { if (Game.state !== 'idle') Game.stop(); this.beginRace(hostSeed, false); }
      }
    }
    /* remote cars + finish states */
    if (this.active) this.syncRemotes();
    UI.renderRoom();
  },
  sanitizeSettings(s) { return { track: TRACKS.some(t => t.id === s.track) ? s.track : 'bay', laps: [1, 3, 5].includes(+s.laps) ? +s.laps : 3, bots: [0, 2, 4].includes(+s.bots) ? +s.bots : 2 }; },
  allReady() { return this.roomPeers.length > 0 && this.roomPeers.every(p => p.isMe && p.sameTab ? true : p.presence && p.presence.ready === true); },

  /* ---- race lifecycle ---- */
  start() {
    if (!this.isHost || !this.named) return;
    this.seed = Math.floor(Math.random() * 1e9);
    this.named.presence({ phase: 'countdown', seed: this.seed, startedAt: Date.now(), settings: Object.assign({}, this.settings), ready: false, fin: null, best: null }).catch(() => {});
    this.beginRace(this.seed, true);
  },
  playerSlots() { return this.roomPeers.slice().sort((a, b) => (a.peer < b.peer ? -1 : a.peer > b.peer ? 1 : 0)).map(p => p.peer); },
  beginRace(seed, asHost) {
    this.seed = seed; this.active = true; this.phase = 'countdown'; this.ready = false; this.clearRemotes(); this.lastHostBots = null;
    const slots = this.playerSlots(); const nPlayers = slots.length;
    Game.onTick = (dt) => this.tick(dt);
    Game.setup({ mode: 'online', trackId: this.settings.track, laps: this.settings.laps, botCount: asHost ? this.settings.bots : 0, difficulty: 1, seed,
      gridOrder: (cars) => { const arr = new Array(nPlayers + this.settings.bots).fill(null); const mi = slots.indexOf(this.myPeer ? this.myPeer.peer : ''); arr[mi < 0 ? 0 : mi] = Game.player; cars.filter(c => c !== Game.player).forEach((b, i) => { arr[nPlayers + i] = b; }); return arr; } });
    Game.countdown = asHost ? 4.3 : 3.999;
    if (!asHost) this.named && this.named.presence({ phase: 'countdown', ready: false, fin: null, best: null }).catch(() => {});
    UI.show(null); this.syncRemotes();
  },
  clearRemotes() { for (const c of this.remoteCars.values()) { Game.world.remove(c.mesh); const i = Game.cars.indexOf(c); if (i >= 0) Game.cars.splice(i, 1); } this.remoteCars.clear(); },
  makeRemote(key, name, hex, slot) {
    const car = new Car({ id: key, name, hex, remote: true, label: name });
    const g = Game.track.gridPose(slot); car.place(g, g.idx);
    car.net = { pos: car.pos.clone(), vel: new THREE.Vector3(), yaw: car.yaw, t: performance.now(), lastSpeed: 0 };
    car.netUpdate = (dt) => {
      const n = car.net; const age = Math.min(0.25, (performance.now() - n.t) / 1000);
      const tx = n.pos.x + n.vel.x * age, tz = n.pos.z + n.vel.z * age;
      car.pos.x = damp(car.pos.x, tx, 14, dt); car.pos.z = damp(car.pos.z, tz, 14, dt);
      car.yaw += wrapAngle(n.yaw - car.yaw) * (1 - Math.exp(-14 * dt));
      car.vel.copy(n.vel); car.trackIdx = Game.track.nearest(car.pos.x, car.pos.z, car.trackIdx); car.lat = Game.track.lateral(car.pos.x, car.pos.z, car.trackIdx);
      car.pos.y = Game.track.heightAt(car.trackIdx, clamp(car.lat, -Game.track.halfWidth - 2, Game.track.halfWidth + 2));
      car.roll = damp(car.roll, -Game.track.bank[car.trackIdx], 8, dt); car.wheelSpin += car.speed * dt / 0.36; car.steerVis = damp(car.steerVis, car.net.steer || 0, 10, dt);
      car.slip = clamp(Math.abs(car.net.steer || 0) * Math.abs(car.speed) / 40, 0, 1) * (Math.abs(car.speed) > 15 ? 1 : 0);
    };
    this.remoteCars.set(key, car); Game.cars.push(car); Game.world.add(car.mesh); return car;
  },
  applyState(car, s) {
    if (!Array.isArray(s) || s.length < 8) return; const n = car.net; const now = performance.now(); const dtm = Math.max(0.03, (now - n.t) / 1000);
    const nx = +s[0] || 0, nz = +s[1] || 0;
    if (dtm < 1) { n.vel.set((nx - n.pos.x) / dtm, 0, (nz - n.pos.z) / dtm); if (n.vel.length() > 120) n.vel.set(0, 0, 0); } else n.vel.set(0, 0, 0);
    /* snap when far off (respawn / first packet) */
    if (Math.hypot(nx - car.pos.x, nz - car.pos.z) > 25) { car.pos.set(nx, 0, nz); car.yaw = +s[2] || 0; }
    n.pos.set(nx, 0, nz); n.yaw = +s[2] || 0; n.t = now;
    const sp = +s[3] || 0; car.lightsBrake = sp < n.lastSpeed - 0.5; n.lastSpeed = sp; car.speed = sp; n.steer = clamp(+s[4] || 0, -1, 1) * 0.5; car.boosting = s[5] === 1;
    car.lap = Math.max(0, Math.floor(+s[6] || 0)); car.progress = clamp(+s[7] || 0, 0, 1); car.totalProgress = car.lap + car.progress;
    const fin = +s[8] || 0; if (fin > 0 && !car.finished) { car.finished = true; car.finishTime = fin; } if (s[9] > 0) car.bestLap = +s[9];
  },
  syncRemotes() {
    if (!this.active || Game.state === 'idle') return;
    const slots = this.playerSlots(); const nPlayers = slots.length; const seen = new Set();
    for (const p of this.roomPeers) {
      if (p.isMe && p.sameTab) continue; const pr = p.presence || {}; const key = 'peer:' + p.peer; seen.add(key);
      let car = this.remoteCars.get(key);
      if (!car) car = this.makeRemote(key, this.peerName(p), this.colorHex(pr.color), Math.max(0, slots.indexOf(p.peer)));
      if (pr.car) this.applyState(car, pr.car);
      if (pr.phase === 'lobby' && Game.state !== 'idle' && !car.finished && car.totalProgress > 0.1) { car.finished = true; car.finishTime = car.finishTime || Game.raceTime + 9e5; car.projected = true; }
    }
    /* host's bots */
    if (!this.isHost && this.hostPeer && this.hostPeer.presence && Array.isArray(this.hostPeer.presence.bots)) {
      const bots = this.hostPeer.presence.bots;
      bots.forEach((b, i) => { if (!Array.isArray(b)) return; const key = 'bot:' + i; seen.add(key); let car = this.remoteCars.get(key); if (!car) car = this.makeRemote(key, BOT_NAMES[(this.seed + i) % BOT_NAMES.length], this.colorHex(PAINTS[(this.seed + i * 3) % PAINTS.length].id), nPlayers + i); this.applyState(car, b); });
      this.lastHostBots = bots;
    }
    for (const [key, car] of this.remoteCars) if (!seen.has(key) && key.startsWith('peer:')) { Game.world.remove(car.mesh); const i = Game.cars.indexOf(car); if (i >= 0) Game.cars.splice(i, 1); this.remoteCars.delete(key); }
  },
  /* I just became host mid-race: take over the bots from their last known states */
  adoptBots() {
    const diff = DIFFICULTY[1]; let i = 0;
    for (const [key, rc] of Array.from(this.remoteCars)) {
      if (!key.startsWith('bot:')) continue;
      const bot = new Car({ id: 'bot' + i, name: rc.name, hex: rc.hex, levels: diff.levels, label: rc.name }); bot.ai = new AIDriver(bot, Game.track, diff, this.seed * 31 + i);
      bot.pos.copy(rc.pos); bot.yaw = rc.yaw; bot.trackIdx = rc.trackIdx; bot.lap = rc.lap; bot.progress = rc.progress; bot.totalProgress = rc.totalProgress; bot.finished = rc.finished; bot.finishTime = rc.finishTime; bot.syncMesh(0);
      Game.world.remove(rc.mesh); Game.cars.splice(Game.cars.indexOf(rc), 1); this.remoteCars.delete(key); Game.bots.push(bot); Game.cars.push(bot); Game.world.add(bot.mesh); i++;
    }
  },
  tick(dt) {
    if (!this.active || !this.named) return; const now = performance.now(); if (now - this.lastSend < 50) return; this.lastSend = now;
    const p = Game.player; const r2 = (v) => Math.round(v * 100) / 100;
    const patch = { car: [r2(p.pos.x), r2(p.pos.z), Math.round(p.yaw * 1000) / 1000, r2(p.speed), Math.round(p.input.steer * 100) / 100, p.boosting ? 1 : 0, p.lap, Math.round(p.progress * 10000) / 10000, p.finished ? Math.round(p.finishTime) : 0, p.bestLap ? Math.round(p.bestLap) : 0] };
    if (Game.state === 'racing' && this.phase !== 'racing') { this.phase = 'racing'; patch.phase = 'racing'; }
    if (p.finished && this.phase !== 'finished') { this.phase = 'finished'; patch.phase = 'finished'; patch.fin = Math.round(p.finishTime); patch.best = p.bestLap ? Math.round(p.bestLap) : null; }
    if (this.isHost) patch.bots = Game.bots.map(b => [r2(b.pos.x), r2(b.pos.z), Math.round(b.yaw * 1000) / 1000, r2(b.speed), Math.round(b.input.steer * 100) / 100, b.boosting ? 1 : 0, b.lap, Math.round(b.progress * 10000) / 10000, b.finished ? Math.round(b.finishTime) : 0, b.bestLap ? Math.round(b.bestLap) : 0]);
    this.named.presence(patch).catch(() => {});
  },
  onLocalResults() { /* keep broadcasting final state; phase already 'finished' */ },
  backToRoom() {
    this.active = false; this.phase = 'lobby'; this.ready = false; this.clearRemotes(); Game.onTick = null;
    if (Game.state !== 'idle') Game.stop();
    if (this.named) this.named.presence({ phase: 'lobby', ready: false, car: null, bots: null, fin: null, best: null }).catch(() => {});
    UI.show('room'); UI.renderRoom();
  },
};
