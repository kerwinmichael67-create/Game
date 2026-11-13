/* ========================================================================
   Profile (credits, cars, upgrades, records) + shared leaderboard + Garage.
   Saved in this browser; mirrored to the viewer's private db subtree when the
   artifact runtime offers one, so progress follows a signed-in player.
   Personal bests are also published to the shared `records` collection.
   ======================================================================== */
const Profile = {
  key: 'apex.profile.v1', data: null, db: null, userId: null, saveT: null, recT: null,
  blankUp() { return { engine: 0, turbo: 0, tires: 0, nitro: 0 }; },
  fresh() { return { credits: 500, cars: { vanta: { up: this.blankUp() } }, car: 'vanta', paint: 'ember', name: '', bestLaps: {}, bestDrift: {}, ghosts: {}, races: 0, wins: 0, trophies: 0, cam: 0, quality: null, updatedAt: 0 }; },
  normalize(d) {
    d = d ? JSON.parse(JSON.stringify(d)) : null;      /* db snapshots are frozen: always work on a copy */
    const out = Object.assign(this.fresh(), d || {});
    /* v1 saves kept one set of upgrades at the top level: they belong to the starter car */
    if (!d || !d.cars) out.cars = { vanta: { up: Object.assign(this.blankUp(), (d && d.upgrades) || {}) } };
    delete out.upgrades;
    if (!out.cars.vanta) out.cars.vanta = { up: this.blankUp() };
    for (const id of Object.keys(out.cars)) { if (!CAR_MODELS.some(m => m.id === id)) { delete out.cars[id]; continue; } out.cars[id].up = Object.assign(this.blankUp(), out.cars[id].up || {}); }
    if (!out.cars[out.car]) out.car = 'vanta';
    out.bestLaps = out.bestLaps || {}; out.bestDrift = out.bestDrift || {}; out.ghosts = out.ghosts || {};
    return out;
  },
  load() { this.data = this.normalize(Store.get(this.key, null)); },
  up(id = this.data.car) { return (this.data.cars[id] || this.data.cars.vanta).up; },
  owns(id) { return !!this.data.cars[id]; },
  stats(id = this.data.car) { return carStats(this.owns(id) ? this.up(id) : {}, id); },
  save() {
    this.data.updatedAt = Date.now(); Store.set(this.key, this.data); UI.refreshCredits && UI.refreshCredits();
    if (this.db && this.userId) { clearTimeout(this.saveT); this.saveT = setTimeout(() => this.pushRemote(), 1200); }
  },
  async connect(db, user) {
    try {
      if (!db || !user) return; const id = await user.id(); if (!id) return; this.db = db; this.userId = id;
      const snap = await db.doc('data/users/' + id + '/profile').get();
      if (snap.exists) {
        const remote = this.normalize(snap.data()); delete remote.ghosts;      /* ghosts stay local: too large to mirror */
        if ((remote.updatedAt || 0) > (this.data.updatedAt || 0)) { const ghosts = this.data.ghosts, quality = this.data.quality; Object.assign(this.data, remote); this.data.ghosts = ghosts; this.data.quality = quality; Store.set(this.key, this.data); UI.onProfileSynced && UI.onProfileSynced(); }
        else if ((this.data.updatedAt || 0) > (remote.updatedAt || 0)) this.pushRemote();
      } else this.pushRemote();
      $('#m-save-status').textContent = 'Progress synced to your account';
      this.syncRecord();
    } catch (e) { /* db unavailable for this viewer: local only */ }
  },
  async pushRemote() {
    if (!this.db || !this.userId) return;
    try { const d = Object.assign({}, this.data); delete d.ghosts; await this.db.doc('data/users/' + this.userId + '/profile').set(d); } catch (e) { this.db = null; }
  },
  /* publish existing personal bests once, but only when the shared row is missing or out of date */
  async syncRecord() {
    try {
      const d = this.data; if (!Object.keys(d.bestLaps).length && !Object.keys(d.bestDrift).length) return;
      const snap = await this.db.doc('records/' + this.userId).get(), v = snap.exists ? snap.data() : null;
      const same = v && JSON.stringify(v.laps || {}) === JSON.stringify(d.bestLaps) && JSON.stringify(v.drift || {}) === JSON.stringify(d.bestDrift) && (v.name || '') === (d.name || '').trim().slice(0, 16);
      if (!same) this.pushRecord();
    } catch (e) { /* board unavailable */ }
  },
  /* personal bests go to the shared board (each viewer may only write their own row) */
  pushRecord() {
    if (!this.db || !this.userId) return; clearTimeout(this.recT);
    this.recT = setTimeout(async () => { try { await this.db.doc('records/' + this.userId).set({ name: (this.data.name || '').trim().slice(0, 16), laps: Object.assign({}, this.data.bestLaps), drift: Object.assign({}, this.data.bestDrift), wins: this.data.wins || 0, car: this.data.car, at: Date.now() }); } catch (e) { /* view-only viewers cannot post times */ } }, 1500);
  },
  async fetchRecords() {
    const mine = { id: this.userId || 'local', name: (this.data.name || '').trim() || 'You', laps: this.data.bestLaps, drift: this.data.bestDrift, me: true };
    if (!this.db) return { shared: false, rows: [mine] };
    try {
      const snap = await this.db.collection('records').limit(200).get(); const rows = [];
      for (const d of snap.docs) { const v = d.data() || {}; if (d.id === this.userId) continue; rows.push({ id: d.id, name: typeof v.name === 'string' ? v.name.slice(0, 16) : '', laps: v.laps && typeof v.laps === 'object' ? v.laps : {}, drift: v.drift && typeof v.drift === 'object' ? v.drift : {}, me: false }); }
      rows.push(mine); return { shared: true, rows };
    } catch (e) { return { shared: false, rows: [mine] }; }
  },
  buyUpgrade(id) { const u = UPGRADES.find(x => x.id === id), up = this.up(), lv = up[id]; if (lv >= MAX_LEVEL || this.data.credits < u.costs[lv]) return false; this.data.credits -= u.costs[lv]; up[id] = lv + 1; this.save(); return true; },
  buyCar(id) { const m = carModel(id); if (this.owns(id) || this.data.credits < m.price) return false; this.data.credits -= m.price; this.data.cars[id] = { up: this.blankUp() }; this.data.car = id; this.save(); return true; },
  selectCar(id) { if (!this.owns(id)) return false; this.data.car = id; this.save(); return true; },
};

const Garage = {
  renderer: null, scene: null, camera: null, car: null, t: 0, active: false, view: 'vanta',
  open() { this.active = true; this.view = Profile.data.car; this.render(); this.ensurePreview(); this.rebuildCar(); },
  close() { this.active = false; },
  ensurePreview() {
    if (this.renderer) return;
    const host = $('#preview'); const r = new THREE.WebGLRenderer({ antialias: true, alpha: true }); r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.shadowMap.enabled = true;
    host.prepend(r.domElement); this.renderer = r;
    const s = new THREE.Scene(); this.scene = s;
    s.add(new THREE.HemisphereLight(0xcfe6ff, 0x1a1c28, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 0.8); key.position.set(4, 7, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); s.add(key);
    const rim = new THREE.DirectionalLight(0x39d2ff, 0.7); rim.position.set(-5, 3, -6); s.add(rim);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(5, 48), new THREE.MeshStandardMaterial({ color: 0x1b2030, roughness: 0.7, metalness: 0.3, envMapIntensity: 0.4 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
    const ring = new THREE.Mesh(new THREE.RingGeometry(4.6, 4.9, 64), new THREE.MeshBasicMaterial({ color: 0xff7a1a, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; s.add(ring);
    s.environment = makeEnvironment(r, { sky: [0x3d4a6b, 0x9aa6c0, 0x2a2f3a], ground: 0x1a1d26, sun: [3, 6, 4], sunColor: 0xffffff }).texture; r.toneMappingExposure = 0.9;
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    const ro = new ResizeObserver(() => this.resize()); ro.observe(host); this.resize();
  },
  resize() { const host = $('#preview'); const w = host.clientWidth || 300, h = host.clientHeight || 260; this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); },
  rebuildCar() {
    if (!this.scene) return; if (this.car) this.scene.remove(this.car);
    const p = PAINTS.find(x => x.id === Profile.data.paint) || PAINTS[0];
    this.car = buildCarMesh(p.hex, Profile.owns(this.view) ? Profile.up(this.view) : {}, { model: this.view, number: 1 }); this.scene.add(this.car);
  },
  frame(dt) {
    if (!this.active || !this.renderer) return; this.t += dt;
    const a = this.t * 0.45 + 0.9; this.camera.position.set(Math.cos(a) * 7.4, 2.6, Math.sin(a) * 7.4); this.camera.lookAt(0, 0.55, 0);
    this.renderer.render(this.scene, this.camera);
  },
  render() {
    const d = Profile.data, m = carModel(this.view), owned = Profile.owns(this.view); $('#g-credits').textContent = fmtInt(d.credits);
    /* car picker */
    const row = $('#g-cars'); row.innerHTML = '';
    for (const cm of CAR_MODELS) { const own = Profile.owns(cm.id); row.append(el('button', { type: 'button', class: 'car-chip' + (cm.id === this.view ? ' on' : ''), 'aria-pressed': cm.id === this.view ? 'true' : 'false', onclick: () => { this.view = cm.id; if (Profile.owns(cm.id)) Profile.selectCar(cm.id); Audio.click(); this.render(); this.rebuildCar(); Net.updateLobbyPresence(); } }, [el('span', { class: 'cc-name', text: cm.name }), el('span', { class: 'cc-sub', text: own ? (cm.id === d.car ? 'Driving' : 'Owned') : fmtInt(cm.price) + ' CR' })])); }
    $('#g-car-name').textContent = m.name; $('#g-car-tag').textContent = m.tag; $('#g-car-desc').textContent = m.desc;
    const buy = $('#b-buy-car'); buy.hidden = owned; buy.disabled = d.credits < m.price; buy.textContent = `Buy for ${fmtInt(m.price)} CR`;
    buy.onclick = () => { if (Profile.buyCar(m.id)) { Audio.fanfare(); this.render(); this.rebuildCar(); Net.updateLobbyPresence(); } };
    /* stat bars against the best fully upgraded car */
    const st = Profile.stats(this.view), full = { engine: 5, turbo: 5, tires: 5, nitro: 5 };
    const maxOf = (k) => Math.max(...CAR_MODELS.map(c => { const s = carStats(full, c.id); return k(s); }));
    const bar = (id, v, mx, label) => { $('#st-' + id).style.width = clamp(v / mx * 100, 4, 100).toFixed(0) + '%'; $('#sv-' + id).textContent = label; };
    bar('speed', st.topSpeed, maxOf(s => s.topSpeed), Math.round(st.topSpeed * 3.6) + ' km/h');
    bar('accel', st.accel, maxOf(s => s.accel), (27.8 / st.accel * 1.45).toFixed(1) + ' s');
    bar('grip', st.grip, maxOf(s => s.grip), (st.grip / 9.81).toFixed(1) + ' g');
    bar('nitro', st.nitroCap * st.nitroPower, maxOf(s => s.nitroCap * s.nitroPower), (st.nitroCap / 34).toFixed(1) + ' s');
    /* upgrades for this car */
    const box = $('#upgrades'); box.innerHTML = '';
    if (!owned) box.append(el('div', { class: 'notice', text: `Buy the ${m.name} to tune it. Every car keeps its own upgrades.` }));
    else for (const u of UPGRADES) {
      const lv = Profile.up(this.view)[u.id], maxed = lv >= MAX_LEVEL, cost = maxed ? null : u.costs[lv];
      const pips = el('div', { class: 'pips' }, Array.from({ length: MAX_LEVEL }, (_, i) => el('i', { class: i < lv ? 'on' : '' })));
      const btn = el('button', { class: 'btn sm' + (maxed ? ' ghost' : ''), type: 'button', disabled: maxed || d.credits < cost, text: maxed ? 'MAX' : fmtInt(cost) + ' CR', onclick: () => { if (Profile.buyUpgrade(u.id)) { Audio.click(); this.render(); this.rebuildCar(); } } });
      box.append(el('div', { class: 'upg' }, [el('div', { class: 'ico', text: u.icon }), el('div', {}, [el('div', { class: 'name', text: `${u.name} · Lv ${lv}` }), el('div', { class: 'desc', text: u.desc }), pips]), btn]));
    }
    const sw = $('#swatches'); sw.innerHTML = '';
    for (const p of PAINTS) sw.append(el('button', { class: 'swatch', type: 'button', 'aria-label': p.name, title: p.name, 'aria-pressed': d.paint === p.id ? 'true' : 'false', style: `background:${hexCss(p.hex)}`, onclick: () => { d.paint = p.id; Profile.save(); Audio.click(); this.render(); this.rebuildCar(); Net.updateLobbyPresence(); } }));
    const next = owned ? UPGRADES.map(u => ({ u, lv: Profile.up(this.view)[u.id] })).filter(x => x.lv < MAX_LEVEL).map(x => x.u.costs[x.lv]).sort((a, b) => a - b)[0] : m.price;
    $('#g-hint').textContent = !owned ? (d.credits >= m.price ? 'You can afford this car.' : `${fmtInt(m.price - d.credits)} CR short. Win races and bank drifts to earn more.`) : next == null ? 'This car is maxed. Go race.' : d.credits >= next ? 'You can afford an upgrade.' : `Next upgrade from ${fmtInt(next)} CR.`;
  },
};
