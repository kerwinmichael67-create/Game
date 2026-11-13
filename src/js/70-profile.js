/* ========================================================================
   Profile (credits, cars, upgrades, records) + shared leaderboard + Garage.
   Saved in this browser; mirrored to the viewer's private db subtree when the
   artifact runtime offers one, so progress follows a signed-in player.
   Personal bests are also published to the shared `records` collection.
   ======================================================================== */
const Profile = {
  key: 'apex.profile.v1',
  data: null,
  db: null,
  userId: null,
  saveT: null,
  recT: null,
  blankUp() {
    return { engine: 0, turbo: 0, tires: 0, nitro: 0 };
  },
  fresh() {
    return {
      credits: 500,
      cars: { vanta: { up: this.blankUp() } },
      car: 'vanta',
      paint: 'ember',
      name: '',
      bestLaps: {},
      bestDrift: {},
      ghosts: {},
      races: 0,
      wins: 0,
      trophies: 0,
      cam: 0,
      quality: null,
      updatedAt: 0,
    };
  },
  normalize(d) {
    d = d ? JSON.parse(JSON.stringify(d)) : null; /* db snapshots are frozen: always work on a copy */
    const out = Object.assign(this.fresh(), d || {});
    /* v1 saves kept one set of upgrades at the top level: they belong to the starter car */
    if (!d || !d.cars) out.cars = { vanta: { up: Object.assign(this.blankUp(), (d && d.upgrades) || {}) } };
    delete out.upgrades;
    if (!out.cars.vanta) out.cars.vanta = { up: this.blankUp() };
    for (const id of Object.keys(out.cars)) {
      if (!CAR_MODELS.some((m) => m.id === id)) {
        delete out.cars[id];
        continue;
      }
      out.cars[id].up = Object.assign(this.blankUp(), out.cars[id].up || {});
    }
    if (!out.cars[out.car]) out.car = 'vanta';
    out.bestLaps = out.bestLaps || {};
    out.bestDrift = out.bestDrift || {};
    out.ghosts = out.ghosts || {};
    return out;
  },
  load() {
    this.data = this.normalize(Store.get(this.key, null));
  },
  up(id = this.data.car) {
    return (this.data.cars[id] || this.data.cars.vanta).up;
  },
  owns(id) {
    return !!this.data.cars[id];
  },
  stats(id = this.data.car) {
    return carStats(this.owns(id) ? this.up(id) : {}, id);
  },
  save() {
    this.data.updatedAt = Date.now();
    Store.set(this.key, this.data);
    UI.refreshCredits && UI.refreshCredits();
    if (this.db && this.userId) {
      clearTimeout(this.saveT);
      this.saveT = setTimeout(() => this.pushRemote(), 1200);
    }
  },
  async connect(db, user) {
    try {
      if (!db || !user) return;
      const id = await user.id();
      if (!id) return;
      this.db = db;
      this.userId = id;
      const snap = await db.doc('data/users/' + id + '/profile').get();
      if (snap.exists) {
        const remote = this.normalize(snap.data());
        delete remote.ghosts; /* ghosts stay local: too large to mirror */
        if ((remote.updatedAt || 0) > (this.data.updatedAt || 0)) {
          const ghosts = this.data.ghosts,
            quality = this.data.quality;
          Object.assign(this.data, remote);
          this.data.ghosts = ghosts;
          this.data.quality = quality;
          Store.set(this.key, this.data);
          UI.onProfileSynced && UI.onProfileSynced();
        } else if ((this.data.updatedAt || 0) > (remote.updatedAt || 0)) this.pushRemote();
      } else this.pushRemote();
      $('#m-save-status').textContent = 'Progress synced to your account';
      this.syncRecord();
    } catch (e) {
      /* db unavailable for this viewer: local only */
    }
  },
  async pushRemote() {
    if (!this.db || !this.userId) return;
    try {
      const d = Object.assign({}, this.data);
      delete d.ghosts;
      await this.db.doc('data/users/' + this.userId + '/profile').set(d);
    } catch (e) {
      this.db = null;
    }
  },
  /* publish existing personal bests once, but only when the shared row is missing or out of date */
  async syncRecord() {
    try {
      const d = this.data;
      if (!Object.keys(d.bestLaps).length && !Object.keys(d.bestDrift).length) return;
      const snap = await this.db.doc('records/' + this.userId).get(),
        v = snap.exists ? snap.data() : null;
      const same =
        v &&
        JSON.stringify(v.laps || {}) === JSON.stringify(d.bestLaps) &&
        JSON.stringify(v.drift || {}) === JSON.stringify(d.bestDrift) &&
        (v.name || '') === (d.name || '').trim().slice(0, 16);
      if (!same) this.pushRecord();
    } catch (e) {
      /* board unavailable */
    }
  },
  /* personal bests go to the shared board (each viewer may only write their own row) */
  pushRecord() {
    if (!this.db || !this.userId) return;
    clearTimeout(this.recT);
    this.recT = setTimeout(async () => {
      try {
        await this.db
          .doc('records/' + this.userId)
          .set({
            name: (this.data.name || '').trim().slice(0, 16),
            laps: Object.assign({}, this.data.bestLaps),
            drift: Object.assign({}, this.data.bestDrift),
            wins: this.data.wins || 0,
            car: this.data.car,
            at: Date.now(),
          });
      } catch (e) {
        /* view-only viewers cannot post times */
      }
    }, 1500);
  },
  async fetchRecords() {
    const mine = {
      id: this.userId || 'local',
      name: (this.data.name || '').trim() || 'You',
      laps: this.data.bestLaps,
      drift: this.data.bestDrift,
      me: true,
    };
    if (!this.db) return { shared: false, rows: [mine] };
    try {
      const snap = await this.db.collection('records').limit(200).get();
      const rows = [];
      for (const d of snap.docs) {
        const v = d.data() || {};
        if (d.id === this.userId) continue;
        rows.push({
          id: d.id,
          name: typeof v.name === 'string' ? v.name.slice(0, 16) : '',
          laps: v.laps && typeof v.laps === 'object' ? v.laps : {},
          drift: v.drift && typeof v.drift === 'object' ? v.drift : {},
          me: false,
        });
      }
      rows.push(mine);
      return { shared: true, rows };
    } catch (e) {
      return { shared: false, rows: [mine] };
    }
  },
  buyUpgrade(id) {
    const u = UPGRADES.find((x) => x.id === id),
      up = this.up(),
      lv = up[id];
    if (lv >= MAX_LEVEL || this.data.credits < u.costs[lv]) return false;
    this.data.credits -= u.costs[lv];
    up[id] = lv + 1;
    this.save();
    return true;
  },
  buyCar(id) {
    const m = carModel(id);
    if (this.owns(id) || this.data.credits < m.price) return false;
    this.data.credits -= m.price;
    this.data.cars[id] = { up: this.blankUp() };
    this.data.car = id;
    this.save();
    return true;
  },
  selectCar(id) {
    if (!this.owns(id)) return false;
    this.data.car = id;
    this.save();
    return true;
  },
};
