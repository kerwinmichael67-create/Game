/* ========================================================================
   UI: screens, menus, boot
   ======================================================================== */
const UI = {
  screens: ['menu', 'setup', 'garage', 'online', 'room', 'results', 'pause'], current: null, setupMode: 'ai', menuT: 0, pendingOpts: null,
  show(name) {
    for (const s of this.screens) $('#s-' + s).hidden = s !== name;
    this.current = name; if (name !== 'garage') Garage.close(); if (name === 'garage') Garage.open();
    if (name === 'menu') this.refreshCredits();
  },
  refreshCredits() { $('#m-credits').textContent = Profile.data.credits.toLocaleString(); if (this.current === 'garage') Garage.render(); },
  onProfileSynced() { $('#nick').value = Profile.data.name || ''; this.refreshCredits(); },
  toastMsg(t) { HUD.toast(t, 2.5); $('#hud').hidden = false; setTimeout(() => { if (Game.state === 'idle') $('#hud').hidden = true; }, 2600); },
  trackSeg(seg, onChange) {
    seg.innerHTML = ''; for (const t of TRACKS) seg.append(el('button', { type: 'button', 'data-v': t.id, text: t.name, 'aria-pressed': t.id === 'bay' ? 'true' : 'false' }));
    segInit(seg, onChange);
  },
  init() {
    Input.isTouch = matchMedia('(pointer: coarse)').matches && 'ontouchstart' in window;
    /* menu */
    $('#b-quick').onclick = () => { this.openSetup('ai'); };
    $('#b-trial').onclick = () => { this.openSetup('trial'); };
    $('#b-garage').onclick = () => { Audio.init(); this.show('garage'); };
    $('#b-online').onclick = () => { Audio.init(); this.show('online'); this.renderLobby(); Net.renderStatus(); };
    $('#nick').value = Profile.data.name || '';
    $('#nick').addEventListener('change', () => { Profile.data.name = $('#nick').value.trim().slice(0, 16); Profile.save(); Net.updateLobbyPresence(); });
    $('#b-sound').onclick = () => { Audio.init(); Audio.setEnabled(!Audio.enabled); this.syncSound(); }; this.syncSound();
    $('#b-quality').onclick = () => { const q = Profile.data.quality === 'high' ? 'low' : 'high'; Profile.data.quality = q; Profile.save(); Game.world.setQuality(q); this.syncQuality(); }; this.syncQuality();
    /* setup */
    this.trackSeg($('#sel-track'), (v) => { $('#track-desc').textContent = TRACKS.find(t => t.id === v).desc; });
    $('#track-desc').textContent = TRACKS[0].desc;
    segInit($('#sel-laps')); segInit($('#sel-diff')); segInit($('#sel-bots'));
    $('#b-setup-back').onclick = () => this.show('menu');
    $('#b-setup-go').onclick = () => {
      const opts = { mode: this.setupMode, trackId: segValue($('#sel-track')), laps: +segValue($('#sel-laps')), difficulty: +segValue($('#sel-diff')), botCount: +segValue($('#sel-bots')), seed: Math.floor(Math.random() * 1e9) };
      this.startRace(opts);
    };
    /* garage */
    $('#b-garage-back').onclick = () => this.show('menu');
    /* online */
    $('#b-online-back').onclick = () => this.show('menu');
    $('#b-create').onclick = () => { Audio.click(); Net.create(); };
    $('#b-join').onclick = () => { Audio.click(); Net.join($('#joincode').value); };
    $('#joincode').addEventListener('keydown', (e) => { if (e.key === 'Enter') Net.join($('#joincode').value); });
    /* room */
    this.trackSeg($('#r-track'), (v) => Net.setSettings({ track: v })); segInit($('#r-laps'), (v) => Net.setSettings({ laps: +v })); segInit($('#r-bots'), (v) => Net.setSettings({ bots: +v }));
    $('#b-leave').onclick = () => Net.leave(true);
    $('#b-ready').onclick = () => { Audio.click(); Net.setReady(!Net.ready); };
    $('#b-start').onclick = () => { Audio.init(); Audio.resume(); Net.start(); };
    /* results */
    $('#b-res-menu').onclick = () => { if (Net.active) Net.backToRoom(); else { Game.stop(); this.show('menu'); } };
    $('#b-res-garage').onclick = () => { if (Net.active) Net.backToRoom(); else { Game.stop(); this.show('garage'); } };
    $('#b-res-again').onclick = () => { if (Net.active) { Net.backToRoom(); if (Net.isHost) setTimeout(() => Net.start(), 400); } else if (this.pendingOpts) this.startRace(Object.assign({}, this.pendingOpts, { seed: Math.floor(Math.random() * 1e9) })); };
    /* pause */
    $('#pausebtn').onclick = () => this.pause(true);
    $('#b-resume').onclick = () => this.pause(false);
    $('#b-restart').onclick = () => { if (this.pendingOpts) this.startRace(Object.assign({}, this.pendingOpts)); };
    $('#b-quit').onclick = () => { if (Net.active) Net.backToRoom(); else { Game.stop(); this.show('menu'); } };
    addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && Game.state !== 'idle') this.pause(!Game.paused);
      if (e.code === 'KeyC' && Game.state !== 'idle') { Game.world.camMode = (Game.world.camMode + 1) % 2; Profile.data.cam = Game.world.camMode; Profile.save(); }
      if (e.code === 'KeyM') { Audio.init(); Audio.setEnabled(!Audio.enabled); this.syncSound(); }
    });
    /* first interaction unlocks audio */
    const unlock = () => { Audio.init(); Audio.resume(); }; addEventListener('pointerdown', unlock, { passive: true }); addEventListener('keydown', unlock);
  },
  syncSound() { const b = $('#b-sound'); b.textContent = 'Sound: ' + (Audio.enabled ? 'On' : 'Off'); b.setAttribute('aria-pressed', String(Audio.enabled)); },
  syncQuality() { const b = $('#b-quality'); const q = Profile.data.quality; b.textContent = 'Graphics: ' + (q === 'high' ? 'High' : 'Fast'); b.title = q === 'high' ? 'Bloom, soft shadows, full resolution' : 'No bloom, lighter shadows, lower resolution'; },
  openSetup(mode) {
    this.setupMode = mode; Audio.init();
    $('#setup-eyebrow').textContent = mode === 'trial' ? 'Time Trial' : 'Race the AI';
    $('#setup-title').textContent = mode === 'trial' ? 'Chase your best lap' : 'Set up your race';
    $('#f-diff').hidden = mode === 'trial'; $('#f-bots').hidden = mode === 'trial';
    this.show('setup');
  },
  startRace(opts) {
    this.pendingOpts = opts; Audio.init(); Audio.resume(); this.show(null); $('#loading').hidden = false; $('#loading').lastElementChild.textContent = 'LOADING ' + (TRACKS.find(t => t.id === opts.trackId) || TRACKS[0]).name.toUpperCase();
    setTimeout(() => { Game.setup(opts); $('#loading').hidden = true; }, 30);
  },
  pause(on) {
    if (Game.state === 'idle') return; Game.paused = on; $('#s-pause').hidden = !on;
    $('#pause-note').textContent = Net.active ? 'Online race: the clock keeps running while you are paused.' : 'The race is paused.';
    $('#b-restart').hidden = !!Net.active; if (on) Audio.stopAll();
  },
  showResults(res) {
    $('#res-title').textContent = res.pos === 1 ? 'Victory' : `${res.pos}${ordinal(res.pos)} place`;
    $('#res-reward').textContent = '+' + res.credits.toLocaleString() + ' CR';
    const tb = $('#res-body'); tb.innerHTML = '';
    for (const r of res.rows) tb.append(el('tr', { class: r.me ? 'me' : '' }, [el('td', { class: r.pos <= 3 ? 'p' + r.pos : '', text: r.pos }), el('td', { text: r.name + (r.me && r.name !== 'You' ? ' (you)' : '') }), el('td', { text: fmtTime(r.best) }), el('td', { text: (r.projected ? '~' : '') + fmtTime(r.total) })]));
    $('#res-note').textContent = res.note;
    $('#b-res-again').textContent = Net.active ? (Net.isHost ? 'Race again' : 'Back to room') : 'Race again';
    $('#b-res-garage').hidden = !!Net.active; $('#b-res-menu').textContent = Net.active ? 'Room' : 'Main menu';
    this.show('results'); this.refreshCredits();
  },
  /* ---- online renderers ---- */
  renderLobby() {
    if (this.current !== 'online') return;
    const list = $('#o-players'); list.innerHTML = ''; const peers = Net.peers.filter(p => p.kind === 'viewer');
    $('#o-count').textContent = peers.length;
    for (const p of peers) { const pr = p.presence || {}; list.append(el('div', { class: 'pl' }, [el('span', { class: 'dot', style: `color:#${Net.colorHex(pr.color).toString(16).padStart(6, '0')};background:currentColor` }), el('span', { class: 'nm', text: Net.peerName(p) + (p.isMe ? ' (you)' : '') + (p.guest ? ' · guest' : '') }), el('span', { class: 'tag', text: pr.room ? 'In room' : 'Lobby' })])); }
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
      list.append(el('div', { class: 'pl' }, [el('span', { class: 'dot', style: `color:#${Net.colorHex(pr.color).toString(16).padStart(6, '0')};background:currentColor` }), el('span', { class: 'nm', text: Net.peerName(p) + (me ? ' (you)' : '') }), isHost ? el('span', { class: 'tag host', text: 'Host' }) : null, el('span', { class: 'tag ' + ((me ? Net.ready : pr.ready) ? 'ready' : ''), text: pr.phase === 'racing' || pr.phase === 'countdown' ? 'Racing' : pr.phase === 'finished' ? 'Finished' : isHost ? '' : (me ? Net.ready : pr.ready) ? 'Ready' : 'Not ready' })])); }
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
  const centre = new THREE.Vector3(-10, 0, 20);
  /* a few bots lapping behind the menu for life */
  const demo = []; for (let i = 0; i < 4; i++) { const c = new Car({ id: 'demo' + i, name: 'demo', hex: PAINTS[i + 1].hex, levels: DIFFICULTY[2].levels }); c.ai = new AIDriver(c, Game.track, DIFFICULTY[2], 100 + i); const g = Game.track.gridPose(i); c.place(g, g.idx); world.add(c.mesh); demo.push(c); }
  let demoOn = true;
  UI.show('menu'); $('#loading').hidden = true;
  Net.init().then(() => { if (window.claude && window.claude.use) claude.use('db').then(db => Profile.connect(db, Net.user)); });
  let last = performance.now(), t = 0, acc = 0;
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt;
    if (Game.state !== 'idle') {
      if (demoOn) { demoOn = false; for (const c of demo) world.remove(c.mesh); }
      Game.frame(dt);
    } else {
      if (!demoOn && world.track === Game.track && Game.track.id === 'bay') { demoOn = true; for (const c of demo) { const g = Game.track.gridPose(demo.indexOf(c)); c.place(g, g.idx); world.add(c.mesh); } }
      if (demoOn) { acc += dt; const h = 1 / 60; while (acc >= h) { for (const c of demo) { c.ai.update(h, demo, null, t); c.step(h, Game.track, null); } acc -= h; }
        for (const c of demo) c.syncMesh(dt);
        /* camera trails the lead demo car from a TV-style high angle */
        const lead = demo[0]; const look = lead.pos; const camT = lead.pos.clone().addScaledVector(lead.forward(), -22).add(new THREE.Vector3(Math.sin(t * 0.3) * 10, 9, Math.cos(t * 0.3) * 10));
        world.camPos.lerp(camT, 1 - Math.exp(-2 * dt)); world.camera.position.copy(world.camPos); world.camera.lookAt(look.x, 1, look.z); world.camera.fov = 50; world.camera.updateProjectionMatrix();
        if (world.sky) world.sky.position.copy(world.camera.position); if (world.sun) { world.sun.target.position.copy(look); world.sun.position.copy(look).add(new THREE.Vector3(...Game.track.def.theme.sun).normalize().multiplyScalar(260)); }
        world.effects(demo, dt);
      } else world.orbitCamera(t, centre);
      world.render();
    }
    Garage.frame(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
(window.claude && window.claude.hot && window.claude.hot.ready) ? window.claude.hot.ready(start) : start();
