/* ========================================================================
   UI: screens, menus, championship flow, leaderboard, boot
   ======================================================================== */
const CH_POINTS = [10, 8, 6, 5, 4, 3, 2, 1];
const MODE_TEXT = {
  ai: ['Race the AI', 'Set up your race', 'You start at the back of the grid. Podiums, fastest laps and banked drifts all pay credits.'],
  champ: ['Championship', 'Three rounds for the title', 'Sunset Bay, Alpine Pass and Neon Dock, two laps each against the same five rivals. Points every round, and a purse for the top three overall.'],
  drift: ['Drift Attack', 'Slide for score', 'Two laps alone on the circuit. Every clean slide banks points; chain them within 2.5 seconds for a multiplier. Touch a wall and the slide is lost.'],
  trial: ['Time Trial', 'Chase your best lap', 'No traffic. Set a lap and a ghost of your record runs with you on every lap after it.'],
};

const UI = {
  screens: ['menu', 'setup', 'garage', 'board', 'online', 'room', 'results', 'pause'], current: null, setupMode: 'ai', pendingOpts: null, champ: null, confettiRaf: 0, boardData: null,
  show(name) {
    for (const s of this.screens) $('#s-' + s).hidden = s !== name;
    this.current = name; if (name !== 'garage') Garage.close(); if (name === 'garage') Garage.open();
    if (name !== 'results') this.stopConfetti();
    if (name === 'menu') this.refreshCredits();
  },
  refreshCredits() { $('#m-credits').textContent = fmtInt(Profile.data.credits); if (this.current === 'garage') Garage.render(); },
  onProfileSynced() { $('#nick').value = Profile.data.name || ''; this.refreshCredits(); if (this.current === 'garage') { Garage.view = Profile.data.car; Garage.render(); Garage.rebuildCar(); } },
  toastMsg(t) { HUD.toast(t, 2.5); $('#hud').hidden = false; setTimeout(() => { if (Game.state === 'idle') $('#hud').hidden = true; }, 2600); },
  trackSeg(seg, onChange) {
    seg.innerHTML = ''; for (const t of TRACKS) seg.append(el('button', { type: 'button', 'data-v': t.id, text: t.name, 'aria-pressed': t.id === 'bay' ? 'true' : 'false' }));
    segInit(seg, onChange);
  },
  init() {
    /* menu */
    $('#b-quick').onclick = () => this.openSetup('ai');
    $('#b-champ').onclick = () => this.openSetup('champ');
    $('#b-drift').onclick = () => this.openSetup('drift');
    $('#b-trial').onclick = () => this.openSetup('trial');
    $('#b-garage').onclick = () => { this.unlockAudio(); this.show('garage'); };
    $('#b-board').onclick = () => { this.unlockAudio(); this.show('board'); this.loadBoard(); };
    $('#b-online').onclick = () => { this.unlockAudio(); this.show('online'); this.renderLobby(); Net.renderStatus(); };
    $('#nick').value = Profile.data.name || '';
    $('#nick').addEventListener('change', () => { Profile.data.name = $('#nick').value.trim().slice(0, 16); Profile.save(); Profile.pushRecord(); Net.updateLobbyPresence(); });
    $('#b-sound').onclick = () => { this.unlockAudio(); Audio.setEnabled(!Audio.enabled); this.syncToggles(); };
    $('#b-music').onclick = () => { this.unlockAudio(); Music.setOn(!Music.on); this.syncToggles(); };
    $('#b-quality').onclick = () => { const q = Profile.data.quality === 'high' ? 'low' : 'high'; Profile.data.quality = q; Profile.save(); Game.world.setQuality(q); this.syncToggles(); };
    this.syncToggles();
    /* setup */
    this.trackSeg($('#sel-track'), (v) => { $('#track-desc').textContent = TRACKS.find(t => t.id === v).desc; });
    $('#track-desc').textContent = TRACKS[0].desc;
    segInit($('#sel-laps')); segInit($('#sel-diff')); segInit($('#sel-bots'));
    $('#b-setup-back').onclick = () => this.show('menu');
    $('#b-setup-go').onclick = () => {
      const seed = Math.floor(Math.random() * 1e9), difficulty = +segValue($('#sel-diff'));
      if (this.setupMode === 'champ') { this.champ = { round: 0, tracks: TRACKS.map(t => t.id), difficulty, seed, points: {}, names: {} }; this.startRace(this.champOpts()); return; }
      this.champ = null;
      this.startRace({ mode: this.setupMode, trackId: segValue($('#sel-track')), laps: +segValue($('#sel-laps')), difficulty, botCount: +segValue($('#sel-bots')), seed });
    };
    /* garage / board */
    $('#b-garage-back').onclick = () => this.show('menu');
    $('#b-board-back').onclick = () => this.show('menu');
    $('#b-board-refresh').onclick = () => this.loadBoard();
    this.trackSeg($('#lb-track'), () => this.renderBoard()); segInit($('#lb-kind'), () => this.renderBoard());
    /* online */
    $('#b-online-back').onclick = () => this.show('menu');
    $('#b-create').onclick = () => { Audio.click(); Net.create(); };
    $('#b-join').onclick = () => { Audio.click(); Net.join($('#joincode').value); };
    $('#joincode').addEventListener('keydown', (e) => { if (e.key === 'Enter') Net.join($('#joincode').value); });
    /* room */
    this.trackSeg($('#r-track'), (v) => Net.setSettings({ track: v })); segInit($('#r-laps'), (v) => Net.setSettings({ laps: +v })); segInit($('#r-bots'), (v) => Net.setSettings({ bots: +v }));
    $('#b-leave').onclick = () => Net.leave(true);
    $('#b-ready').onclick = () => { Audio.click(); Net.setReady(!Net.ready); };
    $('#b-start').onclick = () => { this.unlockAudio(); Net.start(); };
    /* results */
    $('#b-res-menu').onclick = () => { if (Net.active) Net.backToRoom(); else { this.champ = null; Game.stop(); this.show('menu'); } };
    $('#b-res-garage').onclick = () => { if (Net.active) Net.backToRoom(); else { this.champ = null; Game.stop(); this.show('garage'); } };
    $('#b-res-again').onclick = () => {
      if (Net.active) { Net.backToRoom(); if (Net.isHost) setTimeout(() => Net.start(), 400); }
      else if (this.champ && this.champ.round < this.champ.tracks.length) this.startRace(this.champOpts());
      else if (this.pendingOpts) this.startRace(Object.assign({}, this.pendingOpts, { seed: Math.floor(Math.random() * 1e9) }));
    };
    /* pause */
    $('#pausebtn').onclick = () => this.pause(true);
    $('#b-resume').onclick = () => this.pause(false);
    $('#b-reset').onclick = () => { this.pause(false); Game.resetPlayer(); };
    $('#b-restart').onclick = () => { if (this.pendingOpts) this.startRace(Object.assign({}, this.pendingOpts)); };
    $('#b-quit').onclick = () => { if (Net.active) Net.backToRoom(); else { this.champ = null; Game.stop(); this.show('menu'); } };
    addEventListener('keydown', (e) => {
      if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.code === 'Escape' && Game.state !== 'idle' && !Game.results) this.pause(!Game.paused);
      if (e.code === 'KeyC' && Game.state !== 'idle') { Game.world.camMode = (Game.world.camMode + 1) % 2; Profile.data.cam = Game.world.camMode; Profile.save(); }
      if (e.code === 'KeyR' && Game.state === 'racing' && !Game.paused) Game.resetPlayer();
      if (e.code === 'KeyM') { this.unlockAudio(); Music.setOn(!Music.on); this.syncToggles(); }
    });
    /* first interaction unlocks audio */
    addEventListener('pointerdown', () => this.unlockAudio(), { passive: true }); addEventListener('keydown', () => this.unlockAudio());
  },
  unlockAudio() { Audio.init(); Audio.resume(); Music.start(); },
  syncToggles() {
    const b = $('#b-sound'); b.textContent = 'Sound: ' + (Audio.enabled ? 'On' : 'Off'); b.setAttribute('aria-pressed', String(Audio.enabled));
    const m = $('#b-music'); m.textContent = 'Music: ' + (Music.on ? 'On' : 'Off'); m.setAttribute('aria-pressed', String(Music.on));
    const q = Profile.data.quality, g = $('#b-quality'); g.textContent = 'Graphics: ' + (q === 'high' ? 'High' : 'Fast'); g.title = q === 'high' ? 'Bloom, soft shadows, full resolution' : 'No bloom, lighter shadows, lower resolution';
  },
  openSetup(mode) {
    this.setupMode = mode; this.unlockAudio(); const tx = MODE_TEXT[mode];
    $('#setup-eyebrow').textContent = tx[0]; $('#setup-title').textContent = tx[1]; $('#setup-desc').textContent = tx[2];
    $('#f-track').hidden = mode === 'champ'; $('#f-laps').hidden = mode === 'champ' || mode === 'drift';
    $('#f-diff').hidden = mode === 'trial' || mode === 'drift'; $('#f-bots').hidden = mode !== 'ai';
    $('#b-setup-go').textContent = mode === 'champ' ? 'Start championship' : mode === 'drift' ? 'Start run' : mode === 'trial' ? 'Start session' : 'Start race';
    this.show('setup');
  },
  champOpts() { const c = this.champ; return { mode: 'champ', trackId: c.tracks[c.round], laps: 2, difficulty: c.difficulty, botCount: 5, seed: c.seed }; },
  startRace(opts) {
    this.pendingOpts = opts; this.unlockAudio(); this.show(null); $('#loading').hidden = false; $('#loading').lastElementChild.textContent = 'LOADING ' + (TRACKS.find(t => t.id === opts.trackId) || TRACKS[0]).name.toUpperCase();
    setTimeout(() => { Game.setup(opts); $('#loading').hidden = true; }, 30);
  },
  pause(on) {
    if (Game.state === 'idle') return; Game.paused = on; $('#s-pause').hidden = !on;
    $('#pause-note').textContent = Net.active ? 'Online race: the clock keeps running while you are paused.' : 'The race is paused.';
    $('#b-restart').hidden = !!Net.active || !!this.champ; if (on) Audio.stopAll();
  },

  showResults(res) {
    let eyebrow = { drift: 'Drift attack', trial: 'Session complete', champ: 'Championship', online: 'Online race' }[res.mode] || 'Race complete';
    let head = res.head, rows = res.rows, title = res.title, note = res.note, again = res.mode === 'drift' ? 'Run again' : res.mode === 'trial' ? 'Go again' : 'Race again', showAgain = true, credits = res.credits;
    const c = this.champ;
    if (res.mode === 'champ' && c) {
      rows.forEach((r, i) => { const pts = CH_POINTS[i] || 0; c.points[r.id] = (c.points[r.id] || 0) + pts; c.names[r.id] = r.cells[1]; r.pts = pts; });
      c.round++; const last = c.round >= c.tracks.length;
      eyebrow = `Championship · round ${c.round} of ${c.tracks.length}`;
      if (!last) { head = ['Pos', 'Driver', 'Race time', 'Round', 'Points']; rows = rows.map(r => ({ cells: [r.cells[0], r.cells[1], r.cells[3], '+' + r.pts, c.points[r.id]], me: r.me, posCls: r.posCls })); again = `Next round · ${TRACKS.find(t => t.id === c.tracks[c.round]).name}`; }
      else {
        const table = Object.keys(c.points).map(id => ({ id, name: c.names[id], pts: c.points[id] })).sort((a, b) => b.pts - a.pts || (a.id === 'me' ? -1 : 1));
        const rank = table.findIndex(t => t.id === 'me') + 1, purse = Math.round(([1500, 800, 400][rank - 1] || 0) * ([0.8, 1, 1.35][c.difficulty] || 1));
        if (purse) { Profile.data.credits += purse; credits += purse; } if (rank === 1) Profile.data.trophies = (Profile.data.trophies || 0) + 1; Profile.save();
        title = rank === 1 ? 'Champion!' : `Championship: ${rank}${ordinal(rank)}`; res.win = rank === 1;
        head = ['Pos', 'Driver', 'Points']; rows = table.map((t, i) => ({ cells: [i + 1, t.name, t.pts], me: t.id === 'me', posCls: i < 3 ? 'p' + (i + 1) : '' }));
        note = (purse ? `Title purse +${fmtInt(purse)} CR. ` : 'No purse outside the top three. ') + `Final round: ${res.title.toLowerCase()}.`; showAgain = false;
      }
    }
    $('#res-eyebrow').textContent = eyebrow; $('#res-title').textContent = title;
    $('#res-reward').textContent = '+' + fmtInt(credits) + ' CR';
    const hr = $('#res-head'); hr.innerHTML = ''; for (const h of head) hr.append(el('th', { text: h }));
    const tb = $('#res-body'); tb.innerHTML = '';
    for (const r of rows) tb.append(el('tr', { class: r.me ? 'me' : '' }, r.cells.map((cell, i) => el('td', { class: i === 0 ? (r.posCls || r.cls || '') : '', text: cell }))));
    $('#res-note').textContent = note;
    const ab = $('#b-res-again'); ab.hidden = !showAgain && !Net.active; ab.textContent = Net.active ? (Net.isHost ? 'Race again' : 'Back to room') : again;
    $('#b-res-garage').hidden = !!Net.active || (!!c && c.round < c.tracks.length); $('#b-res-menu').textContent = Net.active ? 'Room' : c && c.round < c.tracks.length ? 'Abandon' : 'Main menu';
    this.show('results'); this.refreshCredits();
    if (res.win) this.confetti();
  },
  confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = $('#confetti'), x = cv.getContext('2d'); const W = cv.width = cv.clientWidth, H = cv.height = cv.clientHeight; const cols = ['#ff7a1a', '#39d2ff', '#ffd166', '#4ade80', '#d27bff', '#f6f8ff'];
    const ps = Array.from({ length: 150 }, () => ({ x: Math.random() * W, y: -Math.random() * H * 0.6, vx: (Math.random() - 0.5) * 120, vy: 120 + Math.random() * 220, r: Math.random() * TAU, vr: (Math.random() - 0.5) * 8, w: 6 + Math.random() * 8, c: cols[Math.floor(Math.random() * cols.length)] }));
    let last = performance.now(), t = 0; this.stopConfetti();
    const tick = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; x.clearRect(0, 0, W, H);
      for (const p of ps) { p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.globalAlpha = clamp(1.4 - t / 4, 0, 1); x.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2); x.restore(); }
      this.confettiRaf = t < 5.5 ? requestAnimationFrame(tick) : 0; if (!this.confettiRaf) x.clearRect(0, 0, W, H); };
    this.confettiRaf = requestAnimationFrame(tick);
  },
  stopConfetti() { if (this.confettiRaf) { cancelAnimationFrame(this.confettiRaf); this.confettiRaf = 0; const cv = $('#confetti'); cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); } },

  /* ---- leaderboard ---- */
  async loadBoard() {
    const st = $('#lb-status'); st.classList.remove('on'); st.lastElementChild.textContent = 'Loading…';
    this.boardData = await Profile.fetchRecords();
    st.classList.toggle('on', this.boardData.shared); st.lastElementChild.textContent = this.boardData.shared ? 'Shared board' : 'This browser only';
    this.renderBoard();
  },
  renderBoard() {
    if (this.current !== 'board' || !this.boardData) return;
    const tid = segValue($('#lb-track')), kind = segValue($('#lb-kind')), lap = kind === 'lap';
    $('#lb-col').textContent = lap ? 'Best lap' : 'Drift score';
    const rows = this.boardData.rows.map(r => ({ name: r.name, me: r.me, v: +(lap ? r.laps : r.drift)[tid] })).filter(r => isFinite(r.v) && r.v > 0).sort((a, b) => lap ? a.v - b.v : b.v - a.v).slice(0, 25);
    const tb = $('#lb-body'); tb.innerHTML = '';
    rows.forEach((r, i) => tb.append(el('tr', { class: r.me ? 'me' : '' }, [el('td', { class: i < 3 ? 'p' + (i + 1) : '', text: i + 1 }), el('td', { text: r.me ? (r.name && r.name !== 'You' ? r.name + ' (you)' : 'You') : (r.name || 'Racer') }), el('td', { text: lap ? fmtTime(r.v) : fmtInt(r.v) })])));
    if (!rows.length) tb.append(el('tr', {}, [el('td', { colspan: 3, class: 'muted', text: lap ? 'No laps recorded on this circuit yet. Finish a lap in any mode to set one.' : 'No drift scores yet. Run a Drift Attack on this circuit to post one.' })]));
    $('#lb-note').textContent = this.boardData.shared ? 'Every lap you complete in any mode counts. Drift scores come from Drift Attack runs.' : 'The shared board appears when this page is opened signed in on claude.ai. Until then you see your own records.';
  },

  /* ---- online renderers ---- */
  renderLobby() {
    if (this.current !== 'online') return;
    const list = $('#o-players'); list.innerHTML = ''; const peers = Net.peers.filter(p => p.kind === 'viewer');
    $('#o-count').textContent = peers.length;
    for (const p of peers) { const pr = p.presence || {}; list.append(el('div', { class: 'pl' }, [el('span', { class: 'dot', style: `color:${hexCss(Net.colorHex(pr.color))};background:currentColor` }), el('span', { class: 'nm', text: Net.peerName(p) + (p.isMe ? ' (you)' : '') + (p.guest ? ' · guest' : '') }), el('span', { class: 'tag', text: pr.room ? 'In room' : 'Lobby' })])); }
    if (!peers.length) list.append(el('div', { class: 'muted', text: 'Nobody else is here yet. Open a room and share the link to this page with the code.' }));
    const rooms = $('#o-rooms'); rooms.innerHTML = '';
    const open = Net.openRooms();
    if (!open.length) rooms.append(el('div', { class: 'muted', style: 'font-size:14px', text: 'No rooms yet. Open one and share the code.' }));
    for (const r of open) rooms.append(el('div', { class: 'pl' }, [el('span', { class: 'code', style: 'font-size:16px;letter-spacing:.2em', text: r.code.toUpperCase() }), el('span', { class: 'nm', text: `${r.players.length} driver${r.players.length === 1 ? '' : 's'}` }), el('button', { class: 'btn sm cyan', type: 'button', text: 'Join', onclick: () => Net.join(r.code) })]));
  },
  renderRoom() {
    if (this.current !== 'room') return;
    $('#r-code').textContent = (Net.code || '------').toUpperCase();
    const list = $('#r-players'); list.innerHTML = ''; $('#r-count').textContent = Net.roomPeers.length;
    for (const p of Net.roomPeers) { const pr = p.presence || {}; const isHost = Net.hostPeer && p.peer === Net.hostPeer.peer; const me = p.isMe && p.sameTab;
      list.append(el('div', { class: 'pl' }, [el('span', { class: 'dot', style: `color:${hexCss(Net.colorHex(pr.color))};background:currentColor` }), el('span', { class: 'nm', text: Net.peerName(p) + (me ? ' (you)' : '') + ' · ' + carModel(pr.model).name }), isHost ? el('span', { class: 'tag host', text: 'Host' }) : null, el('span', { class: 'tag ' + ((me ? Net.ready : pr.ready) ? 'ready' : ''), text: pr.phase === 'racing' || pr.phase === 'countdown' ? 'Racing' : pr.phase === 'finished' ? 'Finished' : isHost ? '' : (me ? Net.ready : pr.ready) ? 'Ready' : 'Not ready' })])); }
    segSet($('#r-track'), Net.settings.track); segSet($('#r-laps'), Net.settings.laps); segSet($('#r-bots'), Net.settings.bots);
    for (const id of ['#r-track', '#r-laps', '#r-bots']) { $(id).dataset.locked = Net.isHost ? '0' : '1'; $(id).style.opacity = Net.isHost ? '1' : '.6'; }
    const racing = Net.hostPeer && Net.hostPeer.presence && ['countdown', 'racing'].includes(Net.hostPeer.presence.phase) && !Net.active;
    $('#b-start').hidden = !Net.isHost; $('#b-start').disabled = !Net.allReady() && Net.roomPeers.length > 1;
    $('#b-ready').setAttribute('aria-pressed', String(Net.ready)); $('#b-ready').textContent = Net.ready ? 'Ready ✓' : 'Ready up'; $('#b-ready').classList.toggle('cyan', !Net.ready);
    $('#r-status-text').textContent = racing ? 'Race in progress — you will join the next one' : Net.roomPeers.length < 2 ? 'Waiting for drivers · share the code' : Net.allReady() ? (Net.isHost ? 'Everyone is ready' : 'Waiting for the host to start') : 'Waiting for everyone to ready up';
    $('#r-hint').textContent = Net.isHost ? 'You are the host: pick the circuit, then start when everyone is ready. Bots fill the grid.' : 'Only the host can change settings and start the race.';
  },
};

/* ---------------- boot ---------------- */
function start() {
  Profile.load(); Input.init(); HUD.init();
  Input.isTouch = matchMedia('(pointer: coarse)').matches && 'ontouchstart' in window;
  if (!Profile.data.quality) Profile.data.quality = Input.isTouch ? 'low' : 'high';
  const world = new World($('#gl'), Profile.data.quality); Game.world = world; world.setupPost();
  UI.init();
  Game.track = new Track(TRACKS[0]); world.load(Game.track, hashStr('bay'));
  /* a few cars lapping behind the menu for life */
  const demo = []; CAR_MODELS.forEach((m, i) => { const c = new Car({ id: 'demo' + i, name: 'demo', hex: PAINTS[(i * 2 + 1) % PAINTS.length].hex, model: m.id, levels: DIFFICULTY[2].levels, number: 7 + i * 11 }); c.ai = new AIDriver(c, Game.track, DIFFICULTY[2], 100 + i); demo.push(c); });
  const placeDemo = () => demo.forEach((c, i) => { const g = Game.track.gridPose(i); c.place(g, g.idx); world.add(c.mesh); });
  placeDemo(); let demoOn = true;
  UI.show('menu'); $('#loading').hidden = true;
  Net.init().then(() => { if (window.claude && window.claude.use) claude.use('db').then(db => Profile.connect(db, Net.user)); });
  let last = performance.now(), t = 0, acc = 0;
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt;
    if (Game.state !== 'idle') {
      if (demoOn) { demoOn = false; for (const c of demo) world.remove(c.mesh); }
      Game.frame(dt);
    } else {
      if (!demoOn && world.track === Game.track && Game.track.id === 'bay') { demoOn = true; placeDemo(); }
      if (demoOn) {
        acc += dt; const h = 1 / 60; while (acc >= h) { for (const c of demo) { c.ai.update(h, demo, null); c.step(h, Game.track, null); } for (let i = 0; i < demo.length; i++) for (let j = i + 1; j < demo.length; j++) demo[i].collide(demo[j], null); acc -= h; }
        for (const c of demo) c.syncMesh(dt);
        /* TV-style camera trailing the lead car */
        const lead = demo[0], look = lead.pos; const camT = lead.pos.clone().addScaledVector(lead.forward(), -22).add(new THREE.Vector3(Math.sin(t * 0.3) * 10, 9, Math.cos(t * 0.3) * 10));
        world.camPos.lerp(camT, 1 - Math.exp(-2 * dt)); world.camera.position.copy(world.camPos); world.camera.lookAt(look.x, 1, look.z); world.camera.fov = 50; world.camera.updateProjectionMatrix(); world._followSun(look); world.streaks.visible = false;
        world.effects(demo, dt);
      } else world.orbitCamera(t, new THREE.Vector3(-10, 0, 20));
      world.render();
    }
    Garage.frame(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
(window.claude && window.claude.hot && window.claude.hot.ready) ? window.claude.hot.ready(start) : start();
