/* ========================================================================
   Profile (credits, upgrades, records) + Garage screen
   Saved in this browser; mirrored to the viewer's private db subtree when the
   artifact runtime offers one, so progress follows a signed-in player.
   ======================================================================== */
const Profile = {
  key: 'apex.profile.v1', data: null, db: null, userId: null, saveT: null, remoteVersion: 0,
  fresh() { return { credits: 500, upgrades: { engine: 0, turbo: 0, tires: 0, nitro: 0 }, paint: 'ember', name: '', bestLaps: {}, ghosts: {}, races: 0, wins: 0, cam: 0, quality: null, updatedAt: 0 }; },
  load() {
    const d = Store.get(this.key, null); this.data = Object.assign(this.fresh(), d || {});
    this.data.upgrades = Object.assign({ engine: 0, turbo: 0, tires: 0, nitro: 0 }, this.data.upgrades); this.data.bestLaps = this.data.bestLaps || {}; this.data.ghosts = this.data.ghosts || {};
  },
  save() {
    this.data.updatedAt = Date.now(); Store.set(this.key, this.data); UI.refreshCredits && UI.refreshCredits();
    if (this.db && this.userId) { clearTimeout(this.saveT); this.saveT = setTimeout(() => this.pushRemote(), 1200); }
  },
  async connect(db, user) {
    try {
      if (!db || !user) return; const id = await user.id(); if (!id) return; this.db = db; this.userId = id;
      const ref = db.doc('data/users/' + id + '/profile'); const snap = await ref.get();
      if (snap.exists) {
        const r = snap.data(); const remote = Object.assign(this.fresh(), r); delete remote.ghosts; /* ghosts stay local: too large to mirror */
        if ((remote.updatedAt || 0) > (this.data.updatedAt || 0)) { const ghosts = this.data.ghosts; Object.assign(this.data, remote); this.data.ghosts = ghosts; Store.set(this.key, this.data); UI.refreshCredits && UI.refreshCredits(); UI.onProfileSynced && UI.onProfileSynced(); }
        else if ((this.data.updatedAt || 0) > (remote.updatedAt || 0)) this.pushRemote();
      } else this.pushRemote();
      $('#m-save-status').textContent = 'Progress synced to your account';
    } catch (e) { /* db unavailable for this viewer: local only */ }
  },
  async pushRemote() {
    if (!this.db || !this.userId) return;
    try { const d = Object.assign({}, this.data); delete d.ghosts; await this.db.doc('data/users/' + this.userId + '/profile').set(d); } catch (e) { this.db = null; }
  },
  canAfford(id) { const u = UPGRADES.find(x => x.id === id); const lv = this.data.upgrades[id]; return lv < MAX_LEVEL && this.data.credits >= u.costs[lv]; },
  buy(id) { const u = UPGRADES.find(x => x.id === id); const lv = this.data.upgrades[id]; if (lv >= MAX_LEVEL || this.data.credits < u.costs[lv]) return false; this.data.credits -= u.costs[lv]; this.data.upgrades[id] = lv + 1; this.save(); return true; },
};

const Garage = {
  renderer: null, scene: null, camera: null, car: null, t: 0, active: false,
  open() {
    this.active = true; this.render(); this.ensurePreview(); this.rebuildCar();
  },
  close() { this.active = false; },
  ensurePreview() {
    if (this.renderer) return;
    const host = $('#preview'); const r = new THREE.WebGLRenderer({ antialias: true, alpha: true }); r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.shadowMap.enabled = true;
    host.append(r.domElement); this.renderer = r;
    const s = new THREE.Scene(); this.scene = s;
    s.add(new THREE.HemisphereLight(0xcfe6ff, 0x1a1c28, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 7, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); s.add(key);
    const rim = new THREE.DirectionalLight(0x39d2ff, 1.2); rim.position.set(-5, 3, -6); s.add(rim);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(5, 48), new THREE.MeshPhysicalMaterial({ color: 0x141824, roughness: 0.25, metalness: 0.6, clearcoat: 0.6, envMapIntensity: 0.8 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
    const ring = new THREE.Mesh(new THREE.RingGeometry(4.6, 4.9, 64), new THREE.MeshBasicMaterial({ color: 0xff7a1a, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; s.add(ring);
    s.environment = makeEnvironment(r, { sky: [0x6f86b8, 0xdfe7f5, 0x2a2f3a], ground: 0x1a1d26, sun: [3, 6, 4], sunColor: 0xffffff }).texture; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const ro = new ResizeObserver(() => this.resize()); ro.observe(host); this.resize();
  },
  resize() { const host = $('#preview'); const w = host.clientWidth || 300, h = host.clientHeight || 260; this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); },
  rebuildCar() {
    if (this.car) this.scene.remove(this.car);
    const p = PAINTS.find(x => x.id === Profile.data.paint) || PAINTS[0];
    this.car = buildCarMesh(p.hex, Profile.data.upgrades); this.scene.add(this.car);
  },
  frame(dt) {
    if (!this.active || !this.renderer) return; this.t += dt;
    const a = this.t * 0.5; this.camera.position.set(Math.cos(a) * 8.5, 3.2, Math.sin(a) * 8.5); this.camera.lookAt(0, 0.7, 0);
    this.renderer.render(this.scene, this.camera);
  },
  render() {
    const d = Profile.data; $('#g-credits').textContent = d.credits.toLocaleString();
    const st = carStats(d.upgrades), maxS = carStats({ engine: 5, turbo: 5, tires: 5, nitro: 5 });
    const bar = (id, v, m, label) => { $('#st-' + id).style.width = (v / m * 100).toFixed(0) + '%'; $('#sv-' + id).textContent = label; };
    bar('speed', st.topSpeed, maxS.topSpeed, Math.round(st.topSpeed * st.nitroTop * 3.6) + ' km/h');
    bar('accel', st.accel, maxS.accel, (st.accel / 9.81 * 3).toFixed(1) + 's');
    bar('grip', st.grip, maxS.grip, (st.grip / maxS.grip * 100).toFixed(0) + '%');
    bar('nitro', st.nitroCap * st.nitroPower, maxS.nitroCap * maxS.nitroPower, Math.round(st.nitroCap / 34 * 10) / 10 + 's');
    const box = $('#upgrades'); box.innerHTML = '';
    for (const u of UPGRADES) {
      const lv = d.upgrades[u.id], maxed = lv >= MAX_LEVEL, cost = maxed ? null : u.costs[lv];
      const pips = el('div', { class: 'pips' }, Array.from({ length: MAX_LEVEL }, (_, i) => el('i', { class: i < lv ? 'on' : '' })));
      const btn = el('button', { class: 'btn sm' + (maxed ? ' ghost' : ''), type: 'button', disabled: maxed || d.credits < cost, text: maxed ? 'MAX' : cost.toLocaleString() + ' CR', onclick: () => { if (Profile.buy(u.id)) { Audio.click(); this.render(); this.rebuildCar(); } } });
      box.append(el('div', { class: 'upg' }, [el('div', { class: 'ico', text: u.icon }), el('div', {}, [el('div', { class: 'name', text: `${u.name} · Lv ${lv}` }), el('div', { class: 'desc', text: u.desc }), pips]), btn]));
    }
    const sw = $('#swatches'); sw.innerHTML = '';
    for (const p of PAINTS) sw.append(el('button', { class: 'swatch', type: 'button', 'aria-label': p.name, title: p.name, 'aria-pressed': d.paint === p.id ? 'true' : 'false', style: `background:#${p.hex.toString(16).padStart(6, '0')}`, onclick: () => { d.paint = p.id; Profile.save(); Audio.click(); this.render(); this.rebuildCar(); Net.updateLobbyPresence && Net.updateLobbyPresence(); } }));
    const next = UPGRADES.map(u => ({ u, lv: d.upgrades[u.id] })).filter(x => x.lv < MAX_LEVEL).map(x => x.u.costs[x.lv]).sort((a, b) => a - b)[0];
    $('#g-hint').textContent = next == null ? 'Everything is maxed. Go race.' : d.credits >= next ? 'You can afford an upgrade.' : `Next upgrade from ${next.toLocaleString()} CR. Win races to earn more.`;
  },
};
