/* ========================================================================
   Input, HUD and the race controller
   ======================================================================== */
const Input = {
  keys: {}, touch: { left: 0, right: 0, gas: 0, brake: 0, nitro: 0 }, gamepadIndex: null,
  init() {
    addEventListener('keydown', (e) => { if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; this.keys[e.code] = true; if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft'].includes(e.code)) e.preventDefault(); });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; });
    const bind = (id, key) => { const b = $(id); if (!b) return; const on = (e) => { e.preventDefault(); this.touch[key] = 1; b.classList.add('on'); }; const off = (e) => { e.preventDefault(); this.touch[key] = 0; b.classList.remove('on'); };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off); b.addEventListener('contextmenu', e => e.preventDefault()); };
    bind('#t-left', 'left'); bind('#t-right', 'right'); bind('#t-gas', 'gas'); bind('#t-brake', 'brake'); bind('#t-nitro', 'nitro');
    addEventListener('gamepadconnected', (e) => { this.gamepadIndex = e.gamepad.index; });
  },
  read(out) {
    const k = this.keys, t = this.touch;
    let steer = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0) + t.right - t.left;
    let throttle = (k.ArrowUp || k.KeyW ? 1 : 0) || t.gas, brake = (k.ArrowDown || k.KeyS ? 1 : 0) || t.brake;
    let nitro = !!(k.ShiftLeft || k.ShiftRight || t.nitro), hb = !!k.Space;
    if (this.gamepadIndex != null && navigator.getGamepads) {
      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (gp) { const ax = gp.axes[0] || 0; if (Math.abs(ax) > 0.12) steer += ax; const rt = gp.buttons[7] ? gp.buttons[7].value : 0, lt = gp.buttons[6] ? gp.buttons[6].value : 0; throttle = Math.max(throttle, rt); brake = Math.max(brake, lt); if (gp.buttons[0] && gp.buttons[0].pressed) nitro = true; if (gp.buttons[1] && gp.buttons[1].pressed) hb = true; }
    }
    out.steer = clamp(steer, -1, 1); out.throttle = clamp(throttle, 0, 1); out.brake = clamp(brake, 0, 1); out.nitro = nitro; out.handbrake = hb;
  },
};

const HUD = {
  init() { this.speedo = $('#speedo'); this.sctx = this.speedo.getContext('2d'); this.mini = $('#minimap'); this.mctx = this.mini.getContext('2d'); this.msgT = 0; this.toastT = 0; this.lastStand = ''; this.lastPos = null; },
  show(on) { $('#hud').hidden = !on; },
  message(text, cls = '', hold = 0.9) { const m = $('#msg'); m.textContent = text; m.className = 'show ' + cls; this.msgT = hold; },
  toast(text, hold = 2, cls = '') { const m = $('#toast'); m.textContent = text; m.className = 'show ' + cls; this.toastT = hold; },
  update(game, dt) {
    if (this.msgT > 0) { this.msgT -= dt; if (this.msgT <= 0) $('#msg').classList.remove('show'); }
    if (this.toastT > 0) { this.toastT -= dt; if (this.toastT <= 0) $('#toast').classList.remove('show'); }
    const p = game.player; if (!p) return;
    const pos = game.playerPos; if (this.lastPos != null && pos !== this.lastPos && game.state === 'racing') { const pill = $('#h-pos').closest('.pill'); pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump', pos < this.lastPos ? 'up' : 'down'); } this.lastPos = pos; $('#h-pos').textContent = pos; $('#h-pos-sup').textContent = ordinal(pos); $('#h-total').textContent = game.cars.filter(c => !c.ghost).length;
    $('#h-lap').textContent = Math.min(p.lap + 1, game.laps); $('#h-laps').textContent = game.laps;
    const lapT = p.finished ? (p.lapTimes[p.lapTimes.length - 1] || 0) : (game.raceTime - p.lapStart) * 1000;
    $('#h-time').textContent = fmtTime(game.state === 'racing' || p.finished ? lapT : 0, '0:00.000');
    $('#h-best').textContent = fmtTime(p.bestLap);
    const nb = $('#nitrobar'); nb.firstElementChild.style.transform = `scaleX(${clamp(p.nitro / p.stats.nitroCap, 0, 1)})`; nb.classList.toggle('boost', p.boosting);
    $('#wrongway').classList.toggle('show', p.wrongWay > 0.8 && game.state === 'racing');
    $('#speedfx').style.opacity = p.boosting ? 0.8 : clamp((Math.abs(p.speed) - 50) / 40, 0, 0.5);
    this.drawSpeedo(p); this.drawMinimap(game);
    /* standings: cheap string diff to avoid DOM churn */
    const st = game.standings.slice(0, 8); const key = st.map(c => c.id + ':' + (c.finished ? 'F' : Math.floor(c.totalProgress * 50))).join('|');
    if (key !== this.lastStand) {
      this.lastStand = key; const box = $('#h-standings'); box.innerHTML = '';
      st.forEach((c, i) => { const d = el('div', { class: c.isPlayer ? 'me' : '' }, [el('span', { class: 'n', text: i + 1 }), el('span', { class: 'c', style: `background:#${c.hex.toString(16).padStart(6, '0')}` }), el('span', { text: c.name }), el('span', { class: 'gap', text: c.finished ? fmtTime(c.finishTime) : i === 0 ? '' : gapText(st[0], c, game) })]); box.append(d); });
    }
  },
  drawSpeedo(p) {
    const x = this.sctx, W = this.speedo.width, H = this.speedo.height; x.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.8, r = W * 0.42, kmh = Math.abs(p.speed) * 3.6, max = Math.max(280, Math.ceil(p.stats.topSpeed * p.stats.nitroTop * 3.6 / 20) * 20);
    const a0 = Math.PI * 0.85, a1 = Math.PI * 2.15, f = clamp(kmh / max, 0, 1);
    /* glass backing */
    x.fillStyle = 'rgba(12,16,28,.62)'; x.beginPath(); x.arc(cx, cy, r + 26, 0, TAU); x.fill(); x.lineWidth = 1.5; x.strokeStyle = 'rgba(160,190,255,.16)'; x.stroke();
    x.lineWidth = 14; x.lineCap = 'round'; x.strokeStyle = 'rgba(255,255,255,.08)'; x.beginPath(); x.arc(cx, cy, r, a0, a1); x.stroke();
    const grad = x.createLinearGradient(0, 0, W, 0); grad.addColorStop(0, '#39d2ff'); grad.addColorStop(0.7, '#ff7a1a'); grad.addColorStop(1, '#ff3030');
    x.strokeStyle = p.boosting ? '#ffd166' : grad; x.beginPath(); x.arc(cx, cy, r, a0, a0 + (a1 - a0) * f); x.stroke();
    /* ticks */
    x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i <= 10; i++) { const a = a0 + (a1 - a0) * i / 10; x.beginPath(); x.moveTo(cx + Math.cos(a) * (r - 18), cy + Math.sin(a) * (r - 18)); x.lineTo(cx + Math.cos(a) * (r - 28), cy + Math.sin(a) * (r - 28)); x.stroke(); }
    /* needle */
    const na = a0 + (a1 - a0) * f; x.lineWidth = 5; x.strokeStyle = '#eef3ff'; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(na) * (r - 34), cy + Math.sin(na) * (r - 34)); x.stroke();
    x.fillStyle = '#ff7a1a'; x.beginPath(); x.arc(cx, cy, 9, 0, TAU); x.fill();
    x.fillStyle = '#eef3ff'; x.font = `900 ${W * 0.17}px Orbitron, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillText(Math.round(kmh), cx, cy - 26);
    x.fillStyle = 'rgba(140,152,184,1)'; x.font = `600 ${W * 0.055}px Orbitron, sans-serif`; x.fillText('KM/H', cx, cy - 4);
    const gear = p.speed < -0.5 ? 'R' : kmh < 2 ? 'N' : Math.min(6, 1 + Math.floor(kmh / 45));
    x.fillStyle = p.boosting ? '#ffd166' : '#39d2ff'; x.font = `700 ${W * 0.08}px Orbitron, sans-serif`; x.fillText(gear, cx, cy + 36);
  },
  drawMinimap(game) {
    const x = this.mctx, W = this.mini.width, t = game.track; if (!t) return; x.clearRect(0, 0, W, W);
    if (!this.miniPath || this.miniPath.track !== t) {
      const p = new Path2D(); t.center.forEach((c, i) => { const [u, v] = t.map.toUV(c.x, c.z); i ? p.lineTo(u * W, v * W) : p.moveTo(u * W, v * W); }); p.closePath(); this.miniPath = { track: t, path: p };
    }
    x.lineWidth = 11; x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineJoin = 'round'; x.stroke(this.miniPath.path);
    x.lineWidth = 6; x.strokeStyle = 'rgba(238,243,255,.55)'; x.stroke(this.miniPath.path);
    const [su, sv] = t.map.toUV(t.center[0].x, t.center[0].z); x.fillStyle = '#fff'; x.fillRect(su * W - 4, sv * W - 4, 8, 8);
    for (const c of game.cars) { if (c.ghost) continue; const [u, v] = t.map.toUV(c.pos.x, c.pos.z); x.beginPath(); x.arc(u * W, v * W, c.isPlayer ? 8 : 6, 0, TAU); x.fillStyle = '#' + c.hex.toString(16).padStart(6, '0'); x.fill(); if (c.isPlayer) { x.lineWidth = 3; x.strokeStyle = '#fff'; x.stroke(); } }
  },
};
function gapText(leader, c, game) { const dp = leader.totalProgress - c.totalProgress; if (dp <= 0) return ''; const metres = dp * game.track.length; const v = Math.max(Math.abs(leader.speed), 20); const s = metres / v; return s >= 1 ? '+' + s.toFixed(1) + 's' : '+' + metres.toFixed(0) + 'm'; }

const Game = {
  world: null, track: null, cars: [], player: null, bots: [], remotes: new Map(), ghost: null, ghostRec: [], ghostData: null,
  state: 'idle', mode: 'ai', laps: 3, raceTime: 0, countdown: 0, standings: [], playerPos: 1, finishedAt: null, results: null, acc: 0, seed: 1,
  opts: {}, paused: false, onFinish: null, onTick: null, autopilot: false, headless: false,

  setup(opts) {
    this.opts = opts; this.mode = opts.mode; this.laps = opts.laps || 3; this.seed = opts.seed || 1;
    const def = TRACKS.find(t => t.id === opts.trackId) || TRACKS[0];
    if (!this.track || this.track.id !== def.id || this.world.track !== this.track) { this.track = new Track(def); this.world.load(this.track, hashStr(def.id)); }
    this.clearCars();
    const prof = Profile.data; const R = rng(this.seed);
    const night = !!this.track.def.theme.night;
    this.player = new Car({ id: 'me', name: (prof.name || '').trim().slice(0, 16) || 'You', hex: PAINTS.find(p => p.id === prof.paint)?.hex ?? PAINTS[0].hex, isPlayer: true, levels: prof.upgrades, night, number: 1 });
    this.cars.push(this.player);
    const diff = DIFFICULTY[opts.difficulty ?? 1];
    const botCount = opts.mode === 'trial' ? 0 : (opts.botCount ?? 5);
    const names = BOT_NAMES.slice().sort(() => R() - 0.5), used = new Set([prof.paint]);
    for (let i = 0; i < botCount; i++) {
      const palette = PAINTS.filter(p => !used.has(p.id)); const paint = palette[Math.floor(R() * palette.length)] || PAINTS[i % PAINTS.length]; used.add(paint.id);
      /* per-bot level jitter so the grid isn't uniform */
      const lv = {}; for (const k in diff.levels) lv[k] = clamp(diff.levels[k] + Math.floor(R() * 3) - 1, 0, MAX_LEVEL);
      const bot = new Car({ id: 'bot' + i, name: names[i % names.length], hex: paint.hex, levels: lv, label: opts.mode === 'online' ? names[i % names.length] : null, night, number: 2 + i + Math.floor(R() * 60) });
      bot.ai = new AIDriver(bot, this.track, diff, this.seed * 31 + i); this.bots.push(bot); this.cars.push(bot);
    }
    /* grid order: player starts at the back in AI races (earn your way forward) */
    const order = opts.mode === 'online' ? opts.gridOrder(this.cars) : [...this.bots, this.player];
    order.forEach((c, k) => { if (!c) return; const g = this.track.gridPose(k); c.place(g, g.idx); this.world.add(c.mesh); });
    this.world.attachHeadlights(this.player);
    /* ghost for time trial */
    this.ghost = null; this.ghostData = null; this.ghostRec = [];
    if (opts.mode === 'trial') { const gd = Profile.data.ghosts && Profile.data.ghosts[this.track.id]; if (gd && gd.length > 10) { this.ghostData = gd; this.ghost = new Car({ id: 'ghost', name: 'Ghost', hex: 0xffffff, ghost: true }); this.ghost.mesh.visible = false; this.world.add(this.ghost.mesh); } }
    this.state = 'countdown'; this.countdown = 3.999; this.countdownTotal = 3.999; this.raceTime = 0; this.finishedAt = null; this.results = null; this.paused = false; this.acc = 0;
    this.world.camMode = Profile.data.cam || 0; this.world.updateCamera(this.player, 0, this.world.camMode, true); this.world.introCamera(this.player, 0); this.world.setStartLights(0, false);
    this.updateStandings(); HUD.lastStand = ''; HUD.show(true); HUD.update(this, 0);
    document.body.classList.toggle('touch', Input.isTouch);
    Audio.resume(); Audio.stopAll();
    this.world.onLap = (car) => this.onLap(car);
    HUD.message('3');
  },
  clearCars() { for (const c of this.cars) this.world.remove(c.mesh); if (this.ghost) this.world.remove(this.ghost.mesh); this.cars = []; this.bots = []; this.remotes.clear(); this.player = null; this.ghost = null; },

  startRacing() { this.state = 'racing'; this.raceTime = 0; for (const c of this.cars) c.lapStart = 0; HUD.message('GO!', 'green', 0.8); Audio.beep(1200, 0.5, 'square', 0.3); this.world.setStartLights(5, true); setTimeout(() => this.world.setStartLights(0, false), 2500); },

  onLap(car) {
    if (car.finished) return;
    const t = this.raceTime, lapT = Math.round((t - car.lapStart) * 1000); car.lapTimes.push(lapT); car.lapStart = t;
    if (car.bestLap == null || lapT < car.bestLap) car.bestLap = lapT;
    if (car.isPlayer) {
      Audio.lap();
      if (this.mode === 'trial') {
        const prevBest = Profile.data.bestLaps[this.track.id];
        if (!prevBest || lapT < prevBest) { Profile.data.bestLaps[this.track.id] = lapT; if (this.ghostRec.length > 10) Profile.data.ghosts[this.track.id] = this.ghostRec; Profile.save(); HUD.toast('NEW RECORD  ' + fmtTime(lapT), 2.5); this.ghostData = Profile.data.ghosts[this.track.id]; if (!this.ghost && this.ghostData) { this.ghost = new Car({ id: 'ghost', name: 'Ghost', hex: 0xffffff, ghost: true }); this.world.add(this.ghost.mesh); } }
        else HUD.toast('LAP  ' + fmtTime(lapT), 2);
        this.ghostRec = [];
      } else { const prev = car.lapTimes.length > 1 ? Math.min(...car.lapTimes.slice(0, -1)) : null; const d = prev == null ? '' : (lapT - prev >= 0 ? '  +' : '  −') + (Math.abs(lapT - prev) / 1000).toFixed(2); HUD.toast('LAP  ' + fmtTime(lapT) + d, 1.8, prev == null ? '' : lapT < prev ? 'good' : 'bad'); if (car.lap === this.laps - 1) setTimeout(() => HUD.message('FINAL LAP', '', 1.4), 900); }
    }
    if (car.lap >= this.laps) {
      car.finished = true; car.finishTime = Math.round(t * 1000);
      if (car.isPlayer) { this.finishedAt = t; HUD.message('FINISH', 'green', 2); Audio.fanfare(); car.ai = new AIDriver(car, this.track, DIFFICULTY[1], 7); car.ai.d = Object.assign({}, DIFFICULTY[1], { speed: 0.6, nitro: 0 }); if (this.onFinish) this.onFinish(car); }
    }
  },

  updateStandings() {
    const live = this.cars.filter(c => !c.ghost);
    live.sort((a, b) => { if (a.finished && b.finished) return a.finishTime - b.finishTime; if (a.finished) return -1; if (b.finished) return 1; return b.totalProgress - a.totalProgress; });
    this.standings = live; this.playerPos = live.indexOf(this.player) + 1;
  },

  frame(dt) {
    if (this.state === 'idle') return;
    if (this.paused && this.mode !== 'online') { this.world.render(); return; }
    const w = this.world;
    if (this.state === 'countdown') {
      const prev = Math.ceil(this.countdown); this.countdown -= dt; const now = Math.ceil(this.countdown);
      if (now !== prev && now > 0) { HUD.message(String(now)); Audio.beep(660, 0.15, 'square', 0.25); this.world.setStartLights(4 - now, false); }
      if (this.countdown <= 0) this.startRacing();
    }
    const racing = this.state === 'racing' || this.state === 'finished';
    if (racing) this.raceTime += dt;
    /* inputs */
    Input.read(this.player.input);
    if ((this.player.finished || this.autopilot) && this.player.ai && racing) this.player.ai.update(dt, this.cars, null);
    for (const b of this.bots) { if (racing) b.ai.update(dt, this.cars, this.player.totalProgress, this.raceTime); else { b.input.throttle = 0; b.input.brake = 0; } }
    for (const c of this.cars) if (!c.remote) c.hold = !racing;
    /* fixed-step physics */
    this.acc += Math.min(dt, 0.1); const h = 1 / 120; let steps = 0;
    while (this.acc >= h && steps < 12) {
      for (const c of this.cars) if (!c.remote) c.step(h, this.track, w);
      for (let i = 0; i < this.cars.length; i++) for (let j = i + 1; j < this.cars.length; j++) { const a = this.cars[i], b = this.cars[j]; if (a.remote && b.remote) continue; if (a.remote) b.collide(a, w); else a.collide(b, w); }
      this.acc -= h; steps++;
    }
    for (const c of this.cars) { if (c.remote) c.netUpdate && c.netUpdate(dt); c.syncMesh(dt); }
    /* ghost */
    if (this.mode === 'trial' && this.state === 'racing' && !this.player.finished) {
      const lapT = this.raceTime - this.player.lapStart;
      if (this.ghostRec.length === 0 || lapT - this.ghostRec[this.ghostRec.length - 1][3] >= 0.1) this.ghostRec.push([+this.player.pos.x.toFixed(2), +this.player.pos.z.toFixed(2), +this.player.yaw.toFixed(3), +lapT.toFixed(2)]);
      if (this.ghost && this.ghostData) {
        const gd = this.ghostData; let i = 0; while (i < gd.length - 2 && gd[i + 1][3] < lapT) i++;
        const a = gd[i], b = gd[Math.min(i + 1, gd.length - 1)]; const f = b[3] > a[3] ? clamp((lapT - a[3]) / (b[3] - a[3]), 0, 1) : 0;
        this.ghost.mesh.visible = lapT < gd[gd.length - 1][3] + 0.3; this.ghost.mesh.position.set(lerp(a[0], b[0], f), 0.02, lerp(a[1], b[1], f)); this.ghost.mesh.rotation.set(0, a[2] + wrapAngle(b[2] - a[2]) * f, 0);
      }
    }
    this.updateStandings();
    if (this.onTick) this.onTick(dt);
    if (!this.headless) { w.effects(this.cars, dt); if (this.state === 'countdown') w.introCamera(this.player, 1 - this.countdown / this.countdownTotal); else w.updateCamera(this.player, dt); w.render(); HUD.update(this, dt); }
    /* audio */
    if (this.headless) { this.checkEnd(); return; }
    const p = this.player; const rpm = clamp((Math.abs(p.speed) % 18) / 18 * 0.6 + Math.abs(p.speed) / p.stats.topSpeed * 0.5, 0, 1);
    Audio.updateEngine('me', rpm, p.input.throttle, 1, p.slip * (Math.abs(p.speed) > 4 ? 1 : 0), p.boosting ? 1 : 0);
    let k = 0; for (const b of this.bots.concat([...this.remotes.values()])) { const d = b.pos.distanceTo(p.pos); if (d < 60 && k < 3) { k++; const vol = clamp(1 - d / 60, 0, 1) * 0.45; Audio.updateEngine(b.id, clamp(Math.abs(b.speed) / b.stats.topSpeed, 0, 1), 0.6, vol, 0, b.boosting ? 0.5 : 0); } else Audio.stopEngine(b.id); }
    this.checkEnd();
  },
  checkEnd() {
    if (this.player.finished && this.state !== 'finished') this.state = 'finished';
    if (this.state === 'finished' && !this.results) {
      const others = this.cars.filter(c => !c.ghost && !c.isPlayer);
      const allDone = others.every(c => c.finished);
      const waited = this.raceTime - this.finishedAt;
      if (allDone || waited > (this.mode === 'online' ? 30 : 12) || this.mode === 'trial') this.finishRace();
    }
  },

  finishRace() {
    /* project unfinished bots' times from their remaining distance */
    for (const c of this.cars) if (!c.ghost && !c.finished) { const rem = Math.max(0, this.laps - c.totalProgress) * this.track.length; c.finishTime = Math.round((this.raceTime + rem / Math.max(20, c.stats.topSpeed * 0.75)) * 1000); c.projected = true; }
    this.updateStandings();
    const pos = this.playerPos, n = this.standings.length;
    let credits = 0, note = '';
    if (this.mode === 'trial') { credits = 60 * this.player.lapTimes.length; note = 'Time trial pays 60 CR per lap. Beat your record for a new ghost.'; }
    else {
      const table = [500, 360, 260, 180, 140, 120, 100, 90]; const diffMul = [0.8, 1, 1.35][this.opts.difficulty ?? 1] || 1;
      credits = Math.round((table[pos - 1] || 80) * (this.laps / 3) * diffMul * (this.mode === 'online' ? 1.4 : 1));
      const bestAll = Math.min(...this.standings.filter(c => c.bestLap != null).map(c => c.bestLap));
      if (this.player.bestLap != null && this.player.bestLap <= bestAll) { credits += 100; note = 'Fastest lap bonus +100 CR. '; }
      note += pos === 1 ? 'Race win! ' : pos <= 3 ? 'Podium finish. ' : 'Finish higher for a bigger payout.';
      if (this.mode === 'online') note += ' Online races pay 40% extra.';
      Profile.data.races = (Profile.data.races || 0) + 1; if (pos === 1) Profile.data.wins = (Profile.data.wins || 0) + 1;
    }
    Profile.data.credits += credits; Profile.save();
    this.results = { pos, n, credits, note, rows: this.standings.map((c, i) => ({ pos: i + 1, name: c.name, best: c.bestLap, total: c.finishTime, me: c.isPlayer, projected: !!c.projected })) };
    HUD.show(false); Audio.stopAll(); UI.showResults(this.results);
    if (Net.active && this.mode === 'online') Net.onLocalResults();
  },

  stop() { this.state = 'idle'; this.clearCars(); HUD.show(false); HUD.lastPos = null; Audio.stopAll(); document.body.classList.remove('touch'); },
};
