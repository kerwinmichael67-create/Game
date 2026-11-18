/* ========================================================================
   Pickups: coins and nitro canisters laid out on the road.
   Coins come in rows that weave across the lanes and pay credits at the flag;
   they all return when you start a new lap. A canister tops up the nitro of
   whoever drives through it (rivals take them too) and returns after a while.
   Everything is derived from the race seed, so a restart lays the same course.
   ======================================================================== */
const COIN_VALUE = 10;
const Pickups = {
  items: [],
  coins: null,
  cans: null,
  group: null,
  t: 0,
  enabled(mode) {
    return mode === 'ai' || mode === 'champ' || mode === 'knockout' || mode === 'online';
  },
  clear(world) {
    if (this.group && world) {
      world.remove(this.group);
      disposeTree(this.group);
    }
    this.group = this.coins = this.cans = null;
    this.items = [];
  },
  setup(game) {
    this.clear(game.world);
    if (!this.enabled(game.mode)) return;
    const t = game.track,
      R = rng(hashStr(t.id) ^ 0x51ed),
      items = [];
    const perSample = 1 / t.seg,
      rowEvery = 210,
      rows = Math.max(4, Math.floor(t.length / rowEvery));
    const nearPad = (s) => t.pads.some((p) => Math.min(Math.abs(p.idx - s), t.n - Math.abs(p.idx - s)) * t.seg < 26);
    for (let k = 0; k < rows; k++) {
      /* keep the grid and the first metres after the lights clear */
      const s0 = (70 + k * rowEvery + R() * 60) * perSample;
      if (s0 > t.n - 80 * perSample || nearPad(s0)) continue;
      const lane = (R() - 0.5) * 1.3 * t.halfWidth,
        drift = (R() - 0.5) * 0.9; /* the row slants across the road */
      for (let j = 0; j < 6; j++) {
        const s = s0 + j * 6.5 * perSample,
          lat = clamp(lane + drift * j * 1.1, -t.halfWidth * 0.82, t.halfWidth * 0.82);
        items.push(this._item('coin', t, s, lat, R));
      }
      /* a canister between some of the rows, on the other side of the road */
      if (k % 3 === 1) items.push(this._item('can', t, s0 + 95 * perSample, clamp(-lane, -t.halfWidth * 0.7, t.halfWidth * 0.7), R));
    }
    this.items = items;
    const nCoin = items.filter((i) => i.kind === 'coin').length,
      nCan = items.length - nCoin;
    const disc = new THREE.CylinderGeometry(0.7, 0.7, 0.16, 18).rotateX(Math.PI / 2);
    this.coins = new THREE.InstancedMesh(
      disc,
      new THREE.MeshStandardMaterial({ color: 0xffa200, metalness: 0.3, roughness: 0.45, emissive: 0x9a4a00, emissiveIntensity: 0.7, envMapIntensity: 0.3 }),
      Math.max(1, nCoin)
    );
    this.cans = new THREE.InstancedMesh(
      mergeGeometries([new THREE.CylinderGeometry(0.34, 0.34, 1.0, 12), new THREE.SphereGeometry(0.34, 12, 8).translate(0, 0.5, 0), new THREE.CylinderGeometry(0.12, 0.16, 0.3, 8).translate(0, 0.95, 0)]),
      new THREE.MeshStandardMaterial({ color: 0x1c8fff, metalness: 0.6, roughness: 0.3, emissive: 0x1aa8ff, emissiveIntensity: 1.6 }),
      Math.max(1, nCan)
    );
    this.coins.count = nCoin;
    this.cans.count = nCan;
    this.coins.name = 'coins';
    this.cans.name = 'canisters';
    let a = 0,
      b = 0;
    for (const it of items) it.slot = it.kind === 'coin' ? a++ : b++;
    this.group = new THREE.Group();
    this.group.add(this.coins, this.cans);
    game.world.add(this.group);
    this.t = 0;
    this.draw(0);
  },
  _item(kind, t, s, lat, R) {
    const p = t.pointF(s, lat);
    return { kind, idx: ((Math.round(s) % t.n) + t.n) % t.n, x: p.x, y: p.y + (kind === 'coin' ? 0.95 : 0.75), z: p.z, alive: true, back: 0, phase: R() * 6.283, slot: 0 };
  },
  /* all coins return when the player starts a new lap */
  lap() {
    for (const it of this.items) if (it.kind === 'coin') it.alive = true;
  },
  update(game, dt) {
    if (!this.items.length) return;
    this.t += dt;
    const t = game.track,
      p = game.player;
    for (const it of this.items) {
      if (!it.alive) {
        if (it.kind === 'can' && this.t >= it.back) it.alive = true;
        continue;
      }
      for (const c of game.cars) {
        if (c.ghost || (it.kind === 'coin' && c !== p)) continue;
        const di = Math.abs(c.trackIdx - it.idx);
        if (Math.min(di, t.n - di) > 5) continue;
        const dx = c.pos.x - it.x,
          dz = c.pos.z - it.z;
        if (dx * dx + dz * dz > 2.5 * 2.5) continue;
        it.alive = false;
        if (it.kind === 'coin') {
          Style.stats.coins++;
          Style.score += COIN_VALUE;
          if (!game.headless) {
            Audio.beep(1568 * Math.pow(1.06, Style.stats.coins % 6), 0.06, 'sine', 0.14);
            this._sparkle(game, it, 0xffd24a);
          }
        } else {
          it.back = this.t + 12;
          if (c === p && !p.finished) {
            Style.stats.canisters++;
            Style.award(game, 'canister');
            if (!game.headless) {
              Audio.whoosh(0.5);
              this._sparkle(game, it, 0x5cc8ff);
            }
          } else c.nitro = Math.min(c.stats.nitroCap, c.nitro + 35);
        }
        break;
      }
    }
    if (!game.headless) this.draw(dt);
  },
  _sparkle(game, it, hex) {
    const w = game.world;
    if (!w.sparks) return;
    const col = new THREE.Color(hex),
      at = new THREE.Vector3(it.x, it.y, it.z);
    for (let k = 0; k < 8; k++) w.sparks.emit(at, new THREE.Vector3((Math.random() - 0.5) * 7, 2 + Math.random() * 5, (Math.random() - 0.5) * 7), col, 0.35 + Math.random() * 0.3);
  },
  draw() {
    if (!this.coins) return;
    const d = this._dummy || (this._dummy = new THREE.Object3D());
    for (const it of this.items) {
      const mesh = it.kind === 'coin' ? this.coins : this.cans;
      if (it.alive) {
        d.position.set(it.x, it.y + Math.sin(this.t * 2.2 + it.phase) * 0.12, it.z);
        d.rotation.set(0, this.t * (it.kind === 'coin' ? 3.2 : 1.6) + it.phase, it.kind === 'coin' ? 0 : 0.25);
        d.scale.setScalar(1);
      } else d.scale.setScalar(0.0001);
      d.updateMatrix();
      mesh.setMatrixAt(it.slot, d.matrix);
    }
    this.coins.instanceMatrix.needsUpdate = true;
    this.cans.instanceMatrix.needsUpdate = true;
  },
};
