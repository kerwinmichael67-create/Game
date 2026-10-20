/* =====================================================================
   BLOXVERSE — GROW A GARDEN. Plant seeds in your plot; they grow in real
   time (even while you're away). Harvest, sell at the stand for Sheckles,
   buy better seeds when the shop restocks. Weather brings mutations that
   make crops worth far more. Everyone on the server sees each other's
   gardens through their presence.
   ===================================================================== */
(() => {
  const RAR = { C: ['Common', '#9ca3af'], U: ['Uncommon', '#22c55e'], R: ['Rare', '#3b82f6'], L: ['Legendary', '#eab308'], M: ['Mythical', '#a855f7'], D: ['Divine', '#f97316'], P: ['Prismatic', '#ec4899'] };
  // name, rarity, seed price, seconds to grow, fruit regrow seconds (0 = harvest once), fruits at a time, base value, emoji
  const SEEDS = [
    ['Carrot', 'C', 10, 40, 0, 0, 20, '🥕'], ['Strawberry', 'C', 50, 60, 30, 4, 16, '🍓'], ['Blueberry', 'U', 400, 90, 40, 5, 45, '🫐'],
    ['Tomato', 'R', 800, 120, 50, 4, 80, '🍅'], ['Corn', 'R', 1300, 150, 70, 3, 120, '🌽'], ['Watermelon', 'R', 2500, 180, 0, 0, 2800, '🍉'],
    ['Pumpkin', 'L', 3000, 240, 0, 0, 3400, '🎃'], ['Apple', 'L', 3250, 240, 90, 6, 300, '🍎'], ['Bamboo', 'L', 4000, 200, 0, 0, 4200, '🎋'],
    ['Coconut', 'M', 6000, 300, 120, 3, 600, '🥥'], ['Cactus', 'M', 15000, 360, 150, 3, 3500, '🌵'], ['Dragon Fruit', 'M', 50000, 420, 180, 4, 5000, '🐉'],
    ['Mango', 'M', 100000, 480, 200, 4, 7000, '🥭'], ['Grape', 'D', 850000, 600, 240, 5, 9000, '🍇'], ['Mushroom', 'D', 150000, 420, 0, 0, 140000, '🍄'],
    ['Beanstalk', 'P', 10000000, 900, 300, 6, 30000, '🫛'],
  ];
  const STOCK = { C: [1, 10, 25], U: [0.8, 5, 15], R: [0.55, 2, 6], L: [0.3, 1, 3], M: [0.15, 1, 2], D: [0.06, 1, 1], P: [0.02, 1, 1] };
  const MUT = [['', 1], ['Wet', 2], ['Chilled', 2], ['Shocked', 100], ['Frozen', 10], ['Gold', 20], ['Rainbow', 50], ['Pollinated', 3]];
  const MUT_COL = [null, '#60a5fa', '#bae6fd', '#facc15', '#7dd3fc', '#fbbf24', '#f472b6', '#fde047'];
  const GEAR = [
    { id: 'can', n: 'Watering Can', e: '🚿', price: 50, d: '10 uses. Water a plant to speed it up.' },
    { id: 'sprk', n: 'Sprinkler', e: '💦', price: 2000, d: 'Place in your garden: plants nearby grow 1.5× faster for 5 minutes.' },
    { id: 'gsprk', n: 'Godly Sprinkler', e: '⛲', price: 20000, d: 'Plants nearby grow 2× faster for 5 minutes, and get Gold more often.' },
    { id: 'shovel', n: 'Shovel', e: '🪏', price: 500, d: 'Dig up a plant you don’t want.' },
  ];
  const PETS = [
    { n: 'Dog', e: '🐶', egg: 0, d: 'Digs up a free seed every 3 minutes' }, { n: 'Bunny', e: '🐰', egg: 0, d: 'Crops sell for 10% more' }, { n: 'Cat', e: '🐱', egg: 0, d: 'Plants grow 10% faster' },
    { n: 'Bee', e: '🐝', egg: 1, d: '5% of harvests are Pollinated (×3)' }, { n: 'Golden Lab', e: '🦮', egg: 1, d: 'Gold mutations twice as often' }, { n: 'Dragonfly', e: '🪰', egg: 1, d: 'Plants grow 15% faster' },
    { n: 'Raccoon', e: '🦝', egg: 2, d: '10% of harvests give two crops' }, { n: 'Owl', e: '🦉', egg: 2, d: 'Crops sell for 20% more' }, { n: 'Unicorn', e: '🦄', egg: 2, d: 'Rainbow mutations 3× as often' },
  ];
  const EGGS = [{ n: 'Common Egg', e: '🥚', price: 5000 }, { n: 'Rare Egg', e: '🪺', price: 50000 }, { n: 'Mythical Egg', e: '🔮', price: 500000 }];
  const WEATHERS = [['Clear', 55], ['Rain', 25], ['Thunderstorm', 8], ['Frost', 7], ['Golden Hour', 5]];
  const MAX_PLANTS = 60, MAX_BAG = 200, PW = 36, PD = 30;
  const PLOTS = [[-45, -44], [0, -44], [45, -44], [-45, 44], [0, 44], [45, 44]];
  const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const fmt = (n) => Math.floor(n).toLocaleString('en-US') + '¢';
  const nowMs = () => Date.now();

  // ---------------------------------------------------------------- the world clock: stock and weather
  function stockNow() {
    const slot = Math.floor(nowMs() / 300000), r = mulberry(slot * 99991 + 7);
    return { slot, left: 300 - (nowMs() / 1000) % 300, n: SEEDS.map((s) => { const [ch, lo, hi] = STOCK[s[1]]; const roll = r(), cnt = lo + Math.floor(r() * (hi - lo + 1)); return roll < ch ? cnt : 0; }) };
  }
  function weatherNow() {
    const slot = Math.floor(nowMs() / 600000), r = mulberry(slot * 7777 + 3), into = (nowMs() / 1000) % 600;
    let roll = r() * 100, w = 'Clear'; for (const [n, c] of WEATHERS) { if (roll < c) { w = n; break; } roll -= c; }
    return into < 180 ? { w, left: 180 - into } : { w: 'Clear', next: 600 - into };
  }

  // ---------------------------------------------------------------- plants: little models that grow
  const MATS = new Map();
  const mat = (c) => { if (!MATS.has(c)) MATS.set(c, new THREE.MeshLambertMaterial({ color: c })); return MATS.get(c); };
  const GEO = { box: BOX, sph: new THREE.SphereGeometry(0.5, 10, 8), cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10), cone: new THREE.ConeGeometry(0.5, 1, 10) };
  function piece(g, geo, c, x, y, z, sx, sy, sz) { const m = new THREE.Mesh(GEO[geo], mat(c)); m.position.set(x, y, z); m.scale.set(sx, sy, sz == null ? sx : sz); g.add(m); return m; }
  // where the fruits hang on each kind of plant
  const FRUIT_SPOTS = (s, k) => { const a = k * 2.3; const r = [0.9, 1.0, 1.1, 0.8, 0.7, 1, 1, 1.5, 1, 1.5, 0.9, 0.9, 1.6, 1.2, 1, 1.2][s]; const h = [0.4, 0.4, 0.7, 1.4, 2.2, 0.5, 0.6, 3.2, 1, 5.2, 1.8, 1.8, 3.4, 1.8, 1, 4][s] + (k % 3) * (s === 15 ? 2.5 : 0.25); return [Math.cos(a) * r, h, Math.sin(a) * r]; };
  function plantModel(s, prog, ripe) {
    const g = new THREE.Group(), sc = (0.25 + 0.75 * Math.min(1, prog)) * 1.5, green = 0x4ade80, dark = 0x15803d, brown = 0x92400e;
    if (prog < 0.2) { piece(g, 'box', green, 0, 0.3, 0, 0.22, 0.6, 0.22); piece(g, 'box', green, 0.18, 0.55, 0, 0.45, 0.08, 0.26); return g; }
    const grp = new THREE.Group(); grp.scale.setScalar(sc); g.add(grp);
    const P = (geo, c, x, y, z, sx, sy, sz) => piece(grp, geo, c, x, y, z, sx, sy, sz);
    switch (s) {
      case 0: for (let k = 0; k < 4; k++) P('box', green, Math.cos(k * 1.6) * 0.15, 0.55, Math.sin(k * 1.6) * 0.15, 0.12, 0.9, 0.12).rotation.z = (k - 1.5) * 0.25; if (prog >= 1) P('cone', 0xf97316, 0, 0.12, 0, 0.45, -0.5); break;
      case 1: case 2: P('sph', s === 1 ? green : dark, 0, 0.45, 0, 1.6, 0.8); break;
      case 3: P('box', brown, 0, 1, 0, 0.1, 2); P('sph', green, 0, 1.2, 0, 1.2, 1.6); break;
      case 4: P('box', 0x65a30d, 0, 1.6, 0, 0.25, 3.2); for (let k = 0; k < 4; k++) P('box', green, 0, 0.8 + k * 0.6, 0, 1.4, 0.08, 0.3).rotation.y = k * 1.3; break;
      case 5: case 6: P('sph', green, 0, 0.25, 0, 2, 0.4); if (prog >= 1) P('sph', s === 5 ? 0x16a34a : 0xf97316, 0.3, 0.55, 0, s === 5 ? 1.5 : 1.3, s === 5 ? 1.1 : 0.9, s === 5 ? 1.1 : 1.3); break;
      case 7: case 12: P('cyl', brown, 0, 1.3, 0, 0.45, 2.6); P('sph', s === 7 ? 0x22c55e : 0x166534, 0, 3.2, 0, 3.2, 2.4); break;
      case 8: for (let k = 0; k < 3; k++) { const x = (k - 1) * 0.5; for (let j = 0; j < 5; j++) P('cyl', 0x84cc16, x, 0.6 + j * 1.15, (k % 2) * 0.3, 0.28, 1.05); } break;
      case 9: P('cyl', 0xa16207, 0, 2.6, 0, 0.35, 5.2); for (let k = 0; k < 6; k++) { const l = P('box', green, Math.cos(k) * 1.1, 5.2, Math.sin(k) * 1.1, 2.4, 0.08, 0.5); l.rotation.y = -k; l.rotation.z = -0.35; } break;
      case 10: case 11: P('cyl', s === 10 ? 0x16a34a : 0x65a30d, 0, 1.1, 0, 0.7, 2.2); P('cyl', 0x16a34a, 0.65, 1.3, 0, 0.4, 0.9).rotation.z = 0.9; P('cyl', 0x16a34a, -0.6, 1.6, 0, 0.35, 0.8).rotation.z = -0.9; break;
      case 13: P('box', brown, -1, 1.2, 0, 0.15, 2.4); P('box', brown, 1, 1.2, 0, 0.15, 2.4); P('box', brown, 0, 2.3, 0, 2.2, 0.12, 0.15); P('sph', green, 0, 1.9, 0, 2.4, 1.2, 0.8); break;
      case 14: P('cyl', 0xf5f5f4, 0, 0.6, 0, 0.5, 1.2); if (prog >= 0.5) { P('sph', 0xdc2626, 0, 1.25, 0, 2.2, 1.1); for (let k = 0; k < 5; k++) P('sph', 0xffffff, Math.cos(k * 1.3) * 0.65, 1.6, Math.sin(k * 1.3) * 0.65, 0.25); } break;
      case 15: for (let j = 0; j < 9; j++) P('cyl', j % 2 ? 0x22c55e : 0x16a34a, Math.sin(j * 0.9) * 0.4, 0.6 + j * 1.2, Math.cos(j * 0.9) * 0.4, 0.4, 1.3); P('sph', green, 0, 11, 0, 2.6, 1.4); break;
    }
    // fruits that are ready (the plant shows them; harvesting takes them)
    const FC = [0xf97316, 0xef4444, 0x3b82f6, 0xef4444, 0xfacc15, 0x16a34a, 0xf97316, 0xdc2626, 0x84cc16, 0x78350f, 0xf472b6, 0xec4899, 0xfbbf24, 0x7c3aed, 0xdc2626, 0x84cc16];
    for (let k = 0; k < (ripe || 0); k++) { const [x, y, z] = FRUIT_SPOTS(s, k); const f = P('sph', FC[s], x, y, z, s === 13 ? 0.7 : s === 9 || s === 12 ? 0.6 : 0.42); if (s === 4 || s === 15) f.scale.set(0.3, 0.8, 0.3); }
    if (prog >= 1 && !SEEDS[s][4]) { const glow = piece(g, 'sph', 0xfff7ae, 0, 0.1, 0, 1.4 * sc, 0.1, 1.4 * sc); glow.material = new THREE.MeshBasicMaterial({ color: 0xfff7ae, transparent: true, opacity: 0.35 }); }
    return g;
  }
  function sprinklerModel(type) {
    const g = new THREE.Group();
    piece(g, 'cyl', 0x9ca3af, 0, 0.5, 0, 0.3, 1); const top = piece(g, 'box', type === 'gsprk' ? 0xfacc15 : 0x3b82f6, 0, 1.1, 0, 0.9, 0.2, 0.25);
    g.userData.top = top; return g;
  }
  // garden pets (not the cosmetic kind)
  function gardenPet(t) {
    const g = new THREE.Group(), b = (c, sx, sy, sz, x, y, z) => piece(g, 'box', c, x, y, z, sx, sy, sz);
    const COL = [0xa16207, 0xf5f5f5, 0xf97316, 0xfacc15, 0xfbbf24, 0x22d3ee, 0x6b7280, 0x92400e, 0xffffff];
    const c = COL[t];
    if (t === 3 || t === 5) { b(c, 0.6, 0.5, 0.8, 0, 0, 0); b(0x111111, 0.62, 0.12, 0.2, 0, 0, 0.1); b(0xe0f2fe, 0.7, 0.05, 0.4, 0.45, 0.2, 0).userData.wing = 1; b(0xe0f2fe, 0.7, 0.05, 0.4, -0.45, 0.2, 0).userData.wing = -1; g.userData.fly = true; }
    else if (t === 7) { b(c, 0.8, 0.9, 0.7, 0, 0.6, 0); b(0xfef3c7, 0.5, 0.4, 0.05, 0, 0.75, -0.36); b(0x111111, 0.12, 0.12, 0.04, -0.14, 0.82, -0.39); b(0x111111, 0.12, 0.12, 0.04, 0.14, 0.82, -0.39); g.userData.fly = true; }
    else {
      b(c, 0.7, 0.55, 1.0, 0, 0.55, 0); b(c, 0.6, 0.55, 0.55, 0, 0.95, -0.6); for (const [x, z] of [[-0.25, -0.35], [0.25, -0.35], [-0.25, 0.35], [0.25, 0.35]]) b(c, 0.18, 0.35, 0.18, x, 0.18, z);
      b(0x111111, 0.1, 0.1, 0.04, -0.14, 1.02, -0.88); b(0x111111, 0.1, 0.1, 0.04, 0.14, 1.02, -0.88);
      if (t === 1) { b(c, 0.14, 0.6, 0.12, -0.15, 1.45, -0.55); b(c, 0.14, 0.6, 0.12, 0.15, 1.45, -0.55); }
      if (t === 6) { b(0x111111, 0.62, 0.16, 0.04, 0, 1.02, -0.88); b(0x6b7280, 0.18, 0.18, 0.7, 0, 0.75, 0.75); }
      if (t === 8) { const h = piece(g, 'cone', 0xfde047, 0, 1.45, -0.75, 0.16, 0.5); h.rotation.x = -0.5; }
    }
    g.scale.setScalar(0.9);
    return g;
  }

  // ---------------------------------------------------------------- the experience
  const G0 = () => ({ sh: 30, seeds: { 0: 5, 1: 2 }, gear: { can: 10 }, plants: [], bag: [], pets: [], eq: [], bought: { slot: 0, n: {} }, sprk: [], dogAt: 0 });
  const GARDEN = {
    id: 'garden', code: 'gg', genre: 'Simulator', rank: 2, name: 'Grow a Garden', emoji: '🌱', max: 6, stat: 'Sheckles', killY: -30, camDist: 24,
    land: { theme: 'meadow', fence: 'wood' },
    color: 'linear-gradient(135deg,#65a30d,#facc15)',
    desc: 'Plant seeds in your own plot and watch them grow in real time (even while you’re away). Harvest, sell for Sheckles, and buy rarer seeds when the shop restocks every 5 minutes. Weather brings valuable mutations; eggs hatch pets with bonuses.',
    welcome: 'Plant seeds in your plot!',
    build() {
      sky('#7cc4ff', '#e0f2fe');
      slab(0, 0, 0, 220, 190, 0x65a30d, { sy: 2 });
      part({ x: 0, y: 0.06, z: 0, sx: 200, sy: 0.12, sz: 16, c: 0xa8a29e, plain: true });
      this.stalls = [];
      const stall = (x, c, name, emoji, npc, kind) => {
        slab(x, 0.3, 0, 12, 6, 0x92400e, { sy: 0.3 });
        part({ x, y: 1.6, z: 0, sx: 10, sy: 2.6, sz: 2, c: 0xb45309 });
        for (const sx of [-5.5, 5.5]) part({ x: x + sx, y: 2.8, z: 2.2, sx: 0.4, sy: 5.6, sz: 0.4, c: 0x78350f, plain: true });
        part({ x, y: 5.8, z: 0.6, sx: 12.4, sy: 0.5, sz: 5.4, c, plain: true });
        const l = label(`${emoji} ${name}`, { size: 1.6 }); l.position.set(x, 7.6, 0); place.add(l);
        const a = makeAvatar(npc.av, npc.n); a.g.position.set(x, 0.3, -1.6); a.g.rotation.y = Math.PI; scene.add(a.g); place.add(a.g); scene.remove(a.shadow);
        this.stalls.push({ x, z: 4, kind, name, a });
      };
      stall(-51, 0x16a34a, 'Seed Shop', '🌱', { n: 'Sam', av: [1, 2, 3, 5, 0] }, 'seeds');
      stall(-17, 0xfacc15, 'Sell Stand', '💰', { n: 'Steven', av: [3, 3, 2, 1, 1] }, 'sell');
      stall(17, 0x2563eb, 'Gear Shop', '🧰', { n: 'Eloise', av: [4, 8, 0, 11, 0] }, 'gear');
      stall(51, 0x9333ea, 'Egg Shop', '🥚', { n: 'Ollie', av: [0, 4, 6, 7, 3] }, 'eggs');
      this.plots = PLOTS.map(([ox, oz], k) => {
        part({ x: ox, y: 0.08, z: oz, sx: PW + 2, sy: 0.16, sz: PD + 2, c: 0x4d7c0f, plain: true });
        for (const s of [-1, 1]) part({ x: ox + s * 9, y: 0.25, z: oz, sx: 15, sy: 0.5, sz: 24, c: 0x7c4a1e });
        // a little fence with a gap facing the street
        const fz = oz < 0 ? 1 : -1, F = 0xd6b88a;
        part({ x: ox, y: 0.9, z: oz - fz * (PD / 2 + 1), sx: PW + 2, sy: 1.6, sz: 0.4, c: F, plain: true });
        for (const s of [-1, 1]) { part({ x: ox + s * (PW / 2 + 1), y: 0.9, z: oz, sx: 0.4, sy: 1.6, sz: PD + 2, c: F, plain: true }); part({ x: ox + s * 11, y: 0.9, z: oz + fz * (PD / 2 + 1), sx: 14, sy: 1.6, sz: 0.4, c: F, plain: true }); }
        return { k, ox, oz, fz, owner: null, name: '', views: new Map(), sprk: [], sign: null, sig: '' };
      });
      // trees and flowers around the edge
      const r = mulberry(4242);
      for (let i = 0; i < 46; i++) {
        const side = i % 4, t = r() * 2 - 1, x = side < 2 ? t * 100 : (side === 2 ? -1 : 1) * (92 + r() * 6), z = side < 2 ? (side ? -1 : 1) * (78 + r() * 12) : t * 85;
        const tree = new THREE.Group(); piece(tree, 'cyl', 0x92400e, 0, 2, 0, 0.8, 4); piece(tree, 'sph', [0x16a34a, 0x15803d, 0x22c55e][i % 3], 0, 5.2, 0, 4.6, 4); tree.position.set(x, 0, z); tree.scale.setScalar(0.8 + r() * 0.6); place.add(tree);
      }
      for (let i = 0; i < 70; i++) { const x = (r() - 0.5) * 190, z = (r() - 0.5) * 30; if (Math.abs(z) < 9) continue; const f = new THREE.Group(); piece(f, 'box', 0x15803d, 0, 0.3, 0, 0.1, 0.6); piece(f, 'sph', [0xf472b6, 0xfacc15, 0xffffff, 0xa78bfa][i % 4], 0, 0.7, 0, 0.35); f.position.set(x, 0, z); place.add(f); }
      this.plantKey = 0;
      this.ghost = plantModel(0, 0.1, 0); this.ghost.visible = false; place.add(this.ghost);
      this.rain = null;
    },
    pres() { return { gp: -1, sh: 0 }; },
    async enter() {
      this.G = G0(); this.myPlot = null; this.ct = 0; this.sel = 0; this.dirty = false; this.sentAt = 0; this.saveAt = performance.now() + 10000; this.coinAcc = 0; this.ask = null; this.panel = null;
      const s = await kvGet('gg');
      if (s && typeof s === 'object') this.G = Object.assign(G0(), s, { plants: Array.isArray(s.plants) ? s.plants.slice(0, MAX_PLANTS) : [], bag: Array.isArray(s.bag) ? s.bag.slice(0, MAX_BAG) : [], pets: Array.isArray(s.pets) ? s.pets.filter((t) => PETS[t]).slice(0, 30) : [], eq: Array.isArray(s.eq) ? s.eq.slice(0, 3) : [], sprk: Array.isArray(s.sprk) ? s.sprk : [] });
      this.G.eq = [...new Set(this.G.eq.filter((i) => Number.isInteger(i) && i >= 0 && i < this.G.pets.length))];
      this.myViews = new Map(); this.petViews = [];
      this.claim();
      this.drawBar();
    },
    // the first free plot is yours (whoever claimed first keeps it if two people pick the same one)
    claim() {
      const taken = new Set(players().filter((p) => !p.me && p.pr.gp >= 0).map((p) => p.pr.gp | 0));
      const k = [0, 1, 2, 3, 4, 5].find((i) => !taken.has(i));
      if (k == null) { this.myPlot = null; toast('Every plot is taken — you can still shop and look around'); return; }
      this.myPlot = k; this.ct = Date.now(); this.sendGarden(true);
    },
    spawn() {
      if (this.myPlot == null) return [0, 0.5, 0, 0];
      const pl = this.plots[this.myPlot];
      return [pl.ox, 0.5, pl.oz + pl.fz * (PD / 2 + 3), pl.fz > 0 ? 0 : Math.PI];
    },
    peers() {
      if (!this.plots) return;
      // owners from presence
      const claims = players().filter((p) => !p.me && p.pr.gp >= 0 && p.pr.gp < 6).map((p) => ({ peer: p.peer, k: p.pr.gp | 0, ct: +p.pr.ct || 0, pr: p.pr }));
      if (this.myPlot != null) claims.push({ peer: myPeer(), k: this.myPlot, ct: this.ct, me: true });
      for (const pl of this.plots) {
        const c = claims.filter((x) => x.k === pl.k).sort((a, b) => a.ct - b.ct || (a.peer < b.peer ? -1 : 1))[0];
        const owner = c ? c.peer : null, name = c ? (c.me ? Net.name : String(c.pr.nm || 'Player').slice(0, 20)) : '';
        if (pl.owner !== owner || pl.name !== name) { pl.owner = owner; pl.name = name; pl.mine = !!(c && c.me); this.signFor(pl); }
        if (c && !c.me) this.drawRemote(pl, c.pr);
        else if (!c) this.drawRemote(pl, {});
      }
      if (this.myPlot != null && this.plots[this.myPlot].owner !== myPeer()) { this.myPlot = null; this.claim(); respawn(true); }
    },
    signFor(pl) {
      if (pl.sign) { place.remove(pl.sign); pl.sign.material.map.dispose(); }
      pl.sign = label(pl.owner ? `${pl.name}’s Garden` : 'Free plot', { size: 1.7, color: pl.owner ? '#fff' : '#d9f99d' });
      pl.sign.position.set(pl.ox, 5, pl.oz + pl.fz * (PD / 2 + 1.5)); place.add(pl.sign);
    },
    // other people's gardens, from the short string in their presence
    drawRemote(pl, pr) {
      const gd = typeof pr.gd === 'string' ? pr.gd.slice(0, MAX_PLANTS * 5) : '';
      if (gd === pl.sig && JSON.stringify(pr.gs || []) === pl.sprSig) return;
      pl.sig = gd; pl.sprSig = JSON.stringify(pr.gs || []);
      const keep = new Map();
      for (let i = 0; i + 4 < gd.length + 1; i += 5) {
        const s = AL.indexOf(gd[i]), qx = AL.indexOf(gd[i + 1]), qz = AL.indexOf(gd[i + 2]), st = AL.indexOf(gd[i + 3]), rp = AL.indexOf(gd[i + 4]);
        if (s < 0 || s >= SEEDS.length || qx < 0 || qz < 0) continue;
        const key = gd.slice(i, i + 3), sig = gd.slice(i + 3, i + 5);
        let v = pl.views.get(key);
        if (!v || v.sig !== sig) { if (v) place.remove(v.g); const g = plantModel(s, st / 9, rp); g.position.set(pl.ox + (qx / 63) * PW - PW / 2, 0.5, pl.oz + (qz / 63) * PD - PD / 2); place.add(g); v = { g, sig }; }
        keep.set(key, v);
      }
      for (const [k, v] of pl.views) if (!keep.has(k)) place.remove(v.g);
      pl.views = keep;
      for (const s of pl.sprk) place.remove(s); pl.sprk = [];
      for (const q of Array.isArray(pr.gs) ? pr.gs.slice(0, 6) : []) { if (!Array.isArray(q)) continue; const m = sprinklerModel(q[0] === 1 ? 'gsprk' : 'sprk'); m.position.set(pl.ox + (+q[1] || 0), 0.5, pl.oz + (+q[2] || 0)); place.add(m); pl.sprk.push(m); }
    },
    // my garden
    prog(p) { const s = SEEDS[p.s]; return clamp((nowMs() - p.t) / (s[3] * 1000), 0, 1); },
    ripeFruits(p) { if (!SEEDS[p.s][4] || this.prog(p) < 1) return []; this.fruits(p); const t = nowMs(); return p.f.map((r, k) => (r <= t ? k : -1)).filter((k) => k >= 0); },
    fruits(p) { const s = SEEDS[p.s]; if (!p.f || p.f.length !== s[5]) { const m = p.t + s[3] * 1000; p.f = Array.from({ length: s[5] }, (_, k) => m + k * s[4] * 500); } },
    isRipe(p) { return SEEDS[p.s][4] ? this.ripeFruits(p).length > 0 : this.prog(p) >= 1; },
    drawMine() {
      if (this.myPlot == null) return;
      const pl = this.plots[this.myPlot], keep = new Map();
      for (const p of this.G.plants) {
        if (!p.id) p.id = ++this.plantKey + ':' + Math.random().toString(36).slice(2, 6);
        const pr = this.prog(p), ripe = SEEDS[p.s][4] ? this.ripeFruits(p).length : 0, sig = Math.floor(pr * 9) + ':' + ripe;
        let v = this.myViews.get(p.id);
        if (!v || v.sig !== sig) { if (v) place.remove(v.g); const g = plantModel(p.s, pr, ripe); g.position.set(pl.ox + p.x, 0.5, pl.oz + p.z); g.userData.pid = p.id; g.traverse((o) => (o.userData.pid = p.id)); place.add(g); v = { g, sig }; }
        keep.set(p.id, v);
      }
      for (const [k, v] of this.myViews) if (!keep.has(k)) place.remove(v.g);
      this.myViews = keep;
      // sprinklers
      const t = nowMs(); this.G.sprk = this.G.sprk.filter((q) => q.until > t);
      for (const s of pl.sprk) place.remove(s); pl.sprk = [];
      for (const q of this.G.sprk) { const m = sprinklerModel(q.type); m.position.set(pl.ox + q.x, 0.5, pl.oz + q.z); place.add(m); pl.sprk.push(m); }
    },
    gdString() {
      return this.G.plants.map((p) => {
        const qx = clamp(Math.round(((p.x + PW / 2) / PW) * 63), 0, 63), qz = clamp(Math.round(((p.z + PD / 2) / PD) * 63), 0, 63), st = Math.floor(this.prog(p) * 9), rp = SEEDS[p.s][4] ? Math.min(9, this.ripeFruits(p).length) : 0;
        return AL[p.s] + AL[qx] + AL[qz] + AL[st] + AL[rp];
      }).join('');
    },
    sendGarden(force) {
      const gd = this.gdString(), gs = this.G.sprk.filter((q) => q.until > nowMs()).map((q) => [q.type === 'gsprk' ? 1 : 0, +q.x.toFixed(1), +q.z.toFixed(1)]);
      const key = gd + JSON.stringify(gs) + Math.floor(this.G.sh) + JSON.stringify(this.eqTypes());
      if (!force && key === this.lastSent) return;
      this.lastSent = key;
      send({ gp: this.myPlot == null ? -1 : this.myPlot, ct: this.ct, gd, gs, sh: Math.floor(this.G.sh), gpet: this.eqTypes() });
    },
    // ------------------------------------------------ bonuses from pets
    eqTypes() { return this.G.eq.map((i) => this.G.pets[i]).filter((t) => PETS[t]); },
    has(n) { return this.eqTypes().some((t) => PETS[t].n === n); },
    growBonus() {
      const w = this.weather.w, pl = this.myPlot != null;
      let b = (w === 'Rain' || w === 'Thunderstorm' ? 0.5 : 0) + (this.has('Cat') ? 0.1 : 0) + (this.has('Dragonfly') ? 0.15 : 0);
      return pl ? b : 0;
    },
    tick(dt) {
      if (!this.plots) return;
      this.weather = weatherNow();
      this.weatherFx(dt);
      const t = nowMs(), G = this.G;
      // growing faster: weather, pets, sprinklers (only while you're here)
      const base = this.growBonus();
      for (const p of G.plants) {
        let b = base;
        for (const q of G.sprk) if (q.until > t && Math.hypot(q.x - p.x, q.z - p.z) < (q.type === 'gsprk' ? 12 : 8)) b += q.type === 'gsprk' ? 1 : 0.5;
        if (b > 0) { const ms = dt * 1000 * b; if (this.prog(p) < 1) p.t -= ms; else if (p.f) p.f = p.f.map((r) => (r > t ? r - ms : r)); }
      }
      // the dog finds seeds
      if (this.has('Dog') && t - (G.dogAt || 0) > 180000) { G.dogAt = t; const s = Math.random() < 0.7 ? 0 : 1 + Math.floor(Math.random() * 2); G.seeds[s] = (G.seeds[s] || 0) + 1; toast(`🐶 Your dog dug up a ${SEEDS[s][0]} seed!`); this.drawBar(); this.dirty = true; }
      const pt = performance.now();
      if (pt - (this.drawAt || 0) > 500) { this.drawAt = pt; this.drawMine(); this.sendGarden(); if (this.panel === 'seeds') this.openShop(true); }
      for (const pl of this.plots) for (const s of pl.sprk) { s.userData.top.rotation.y += dt * 6; if (Math.random() < dt * 12) puffAt(s.position.x, s.position.y + 1.2, s.position.z, 0x93c5fd, 1); }
      if (this.dirty && pt > this.saveAt) { this.saveAt = pt + 10000; this.save(); }
      this.drawPets(dt);
      this.drawStat();
    },
    weatherFx(dt) {
      const w = this.weather.w;
      if (w !== this.lastW) {
        this.lastW = w;
        const sk = { Clear: ['#7cc4ff', '#e0f2fe'], Rain: ['#64748b', '#cbd5e1'], Thunderstorm: ['#1e293b', '#64748b'], Frost: ['#bae6fd', '#f0f9ff'], 'Golden Hour': ['#f59e0b', '#fde68a'] }[w];
        sky(sk[0], sk[1]);
        if (w !== 'Clear') { sfx(w === 'Thunderstorm' ? 'thunder' : w === 'Golden Hour' ? 'magic' : w === 'Frost' ? 'freeze' : 'splash'); toast(`${{ Rain: '🌧️', Thunderstorm: '⛈️', Frost: '❄️', 'Golden Hour': '🌅' }[w]} ${w}!`, '#e0f2fe'); say(`${w} has started: ${{ Rain: 'plants grow faster and crops may be Wet (×2)', Thunderstorm: 'faster growth, Wet crops, and lightning can Shock crops (×100)', Frost: 'crops may be Chilled (×2) or Frozen (×10)', 'Golden Hour': 'Gold crops (×20) are much more common' }[w]}`, '#bae6fd'); }
      }
      if (w === 'Rain' || w === 'Thunderstorm' || w === 'Frost') {
        const n = Math.min(6, Math.ceil(dt * (w === 'Frost' ? 60 : 140)));
        for (let k = 0; k < n; k++) {
          const m = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: w === 'Frost' ? 0xffffff : 0x93c5fd, transparent: true, opacity: 0.7 }));
          m.scale.set(w === 'Frost' ? 0.2 : 0.06, w === 'Frost' ? 0.2 : 1.2, w === 'Frost' ? 0.2 : 0.06);
          m.position.set(P.x + (Math.random() - 0.5) * 60, P.y + 20 + Math.random() * 6, P.z + (Math.random() - 0.5) * 60);
          m.userData = { v: new THREE.Vector3(0, w === 'Frost' ? -6 : -45, 0), life: w === 'Frost' ? 3.5 : 0.6, g: 0 };
          scene.add(m); bits.push(m);
        }
      }
      if (w === 'Thunderstorm' && Math.random() < dt * 0.15) { const f = $('#hud'); f.style.background = 'rgba(255,255,255,.55)'; setTimeout(() => (f.style.background = ''), 90); }
    },
    drawPets(dt) {
      const types = this.eqTypes(), want = types.join(',');
      if (want !== this.petSig) {
        this.petSig = want;
        for (const v of this.petViews) scene.remove(v.g);
        this.petViews = types.map((t) => { const g = gardenPet(t); scene.add(g); return { g, walk: 0 }; });
      }
      this.petViews.forEach((v, i) => {
        const a = me && me.g; if (!a) return;
        const ang = P.yaw + Math.PI + (i - 1) * 0.7, tx = P.x + Math.sin(ang) * 3.4, tz = P.z + Math.cos(ang) * 3.4;
        const k = Math.min(1, dt * 4); v.g.position.x += (tx - v.g.position.x) * k; v.g.position.z += (tz - v.g.position.z) * k;
        v.walk += dt * 8; v.g.position.y = P.y + (v.g.userData.fly ? 2.5 + Math.sin(v.walk * 0.6) * 0.3 : Math.abs(Math.sin(v.walk)) * 0.2);
        v.g.rotation.y = P.yaw;
        for (const c of v.g.children) if (c.userData.wing) c.rotation.z = c.userData.wing * Math.sin(v.walk * 3) * 0.6;
      });
      // other players' garden pets
      for (const [peer, a] of Net.avatars) {
        const p = Net.peers.find((x) => x.peer === peer), list = p && p.presence && Array.isArray(p.presence.gpet) ? p.presence.gpet.slice(0, 3).filter((i) => PETS[i]) : [];
        const sig = list.join(',');
        if (a.gpSig !== sig) { for (const g of a.gpets || []) scene.remove(g); a.gpets = list.map((i) => { const g = gardenPet(i); scene.add(g); return g; }); a.gpSig = sig; }
        (a.gpets || []).forEach((g, i) => { const yaw = a.g.rotation.y, ang = yaw + Math.PI + (i - 1) * 0.7; g.position.x += (a.g.position.x + Math.sin(ang) * 3.4 - g.position.x) * Math.min(1, dt * 4); g.position.z += (a.g.position.z + Math.cos(ang) * 3.4 - g.position.z) * Math.min(1, dt * 4); g.position.y = a.g.position.y + (g.userData.fly ? 2.5 : 0); g.rotation.y = yaw; });
      }
    },
    // ------------------------------------------------ the hotbar: seeds and gear
    barItems() {
      const items = [];
      SEEDS.forEach((s, i) => { if ((this.G.seeds[i] || 0) > 0) items.push({ k: 's' + i, e: s[7], n: s[0] + ' Seed', c: this.G.seeds[i] }); });
      GEAR.forEach((g) => { const c = this.G.gear[g.id] || 0; if (c > 0) items.push({ k: 'g' + g.id, e: g.e, n: g.n, c: g.id === 'shovel' ? '' : c }); });
      return items;
    },
    drawBar() {
      const items = this.barItems();
      if (!items.find((x) => x.k === this.sel)) this.sel = items[0] ? items[0].k : null;
      setBar(items.slice(0, 9).map((x, i) => `<button class="xslot ${this.sel === x.k ? 'on' : ''}" data-k="${x.k}" title="${esc(x.n)}"><span class="k">${i + 1}</span><span class="e">${x.e}</span>${esc(x.n.replace(' Seed', ''))}${x.c !== '' ? `<span class="n">×${x.c}</span>` : ''}</button>`).join('')
        + `<button class="xslot" data-k="bag" title="Your crops (B)"><span class="e">🎒</span>Bag<span class="n">${this.G.bag.length}</span></button><button class="xslot" data-k="pets" title="Pets (P)"><span class="e">🐾</span>Pets</button>`,
        (b) => { const k = b.dataset.k; if (k === 'bag') this.openBag(); else if (k === 'pets') this.openPets(); else { this.sel = k; this.drawBar(); } });
    },
    key(code, down) {
      if (!down) return false;
      const m = /^Digit([1-9])$/.exec(code);
      if (m) { const it = this.barItems()[+m[1] - 1]; if (it) { this.sel = it.k; this.drawBar(); } return true; }
      if (code === 'KeyB') { this.openBag(); return true; }
      if (code === 'KeyP') { this.openPets(); return true; }
      return false;
    },
    // ------------------------------------------------ planting, harvesting, tools
    soilAt(x, z) {
      if (this.myPlot == null) return null;
      const pl = this.plots[this.myPlot], lx = x - pl.ox, lz = z - pl.oz;
      if (Math.abs(lz) > 11.5 || Math.abs(lx) < 2.2 || Math.abs(lx) > 16) return null;
      return [lx, lz];
    },
    hover(e) {
      const isSeed = this.sel && this.sel[0] === 's';
      if (!isSeed) { this.ghost.visible = false; return; }
      const h = pickPlane(e.x, e.y, 0.5), spot = h && this.soilAt(h.x, h.z);
      this.ghost.visible = !!spot;
      if (spot) { const pl = this.plots[this.myPlot]; this.ghost.position.set(pl.ox + spot[0], 0.5, pl.oz + spot[1]); }
    },
    click(e) {
      // a plant of mine?
      const hit = pickObjects(e.x, e.y, [...this.myViews.values()].map((v) => v.g));
      const p = hit && this.G.plants.find((q) => q.id === hit.object.userData.pid);
      const sel = this.sel || '';
      if (p) {
        if (sel === 'gcan') return this.water(p);
        if (sel === 'gshovel') return this.dig(p);
        if (this.isRipe(p)) return this.harvest(p);
        return toast(`${SEEDS[p.s][0]}: ${Math.floor(this.prog(p) * 100)}% grown`);
      }
      const h = pickPlane(e.x, e.y, 0.5);
      if (!h) return;
      if (sel[0] === 's') return this.plant(+sel.slice(1), h.x, h.z);
      if (sel === 'gsprk' || sel === 'ggsprk') return this.placeSprinkler(sel.slice(1), h.x, h.z);
    },
    plant(s, x, z) {
      const spot = this.soilAt(x, z);
      if (!spot) return toast(this.myPlot == null ? 'You don’t have a plot' : 'Plant in the soil of your plot');
      if (this.G.plants.length >= MAX_PLANTS) return toast(`Your garden is full (${MAX_PLANTS} plants)`);
      const big = [7, 9, 12, 15].includes(s) ? 3.2 : 2;
      if (this.G.plants.some((p) => Math.hypot(p.x - spot[0], p.z - spot[1]) < Math.max(big, [7, 9, 12, 15].includes(p.s) ? 3.2 : 2))) return toast('Too close to another plant');
      if (!(this.G.seeds[s] > 0)) return;
      this.G.seeds[s]--; if (!this.G.seeds[s]) delete this.G.seeds[s];
      this.G.plants.push({ s, x: +spot[0].toFixed(2), z: +spot[1].toFixed(2), t: nowMs() });
      this.dirty = true; this.drawBar(); this.drawMine(); this.sendGarden();
      const pl = this.plots[this.myPlot]; puffAt(pl.ox + spot[0], 0.8, pl.oz + spot[1], 0x7c4a1e, 6); sfx('dig', { vol: 0.6 }); setTimeout(() => sfx('seed'), 120);
    },
    harvest(p) {
      if (this.G.bag.length >= MAX_BAG) return toast('Your bag is full — sell at the Sell Stand');
      const s = SEEDS[p.s], w = this.weather.w, R = Math.random;
      // what kind of crop: weight and mutation
      const godly = this.G.sprk.some((q) => q.type === 'gsprk' && q.until > nowMs() && Math.hypot(q.x - p.x, q.z - p.z) < 12);
      let m = 0;
      const gold = (w === 'Golden Hour' ? 0.12 : 0.015) * (this.has('Golden Lab') ? 2 : 1) * (godly ? 2 : 1);
      if (R() < 0.002 * (this.has('Unicorn') ? 3 : 1)) m = 6; else if (R() < gold) m = 5;
      else if (w === 'Thunderstorm' && R() < 0.04) m = 3; else if (w === 'Frost' && R() < 0.05) m = 4; else if (w === 'Frost' && R() < 0.25) m = 2;
      else if ((w === 'Rain' || w === 'Thunderstorm') && R() < 0.3) m = 1; else if (this.has('Bee') && R() < 0.05) m = 7;
      const crop = () => [p.s, +(0.75 + R() * 0.9).toFixed(2), m];
      quest('garden.harvest'); if (m === 5 || m === 6) quest('garden.gold');
      this.G.bag.push(crop()); if (this.has('Raccoon') && R() < 0.1 && this.G.bag.length < MAX_BAG) this.G.bag.push(crop());
      if (s[4]) { this.fruits(p); const k = this.ripeFruits(p)[0]; p.f[k] = nowMs() + s[4] * 1000; }
      else this.G.plants.splice(this.G.plants.indexOf(p), 1);
      const pl = this.plots[this.myPlot];
      puffAt(pl.ox + p.x, 1.5, pl.oz + p.z, MUT_COL[m] ? new THREE.Color(MUT_COL[m]).getHex() : 0x86efac, 8);
      toast(`+1 ${m ? MUT[m][0] + ' ' : ''}${s[0]}${m ? ' ✨' : ''}`, MUT_COL[m] || '#86efac'); sfx('pop'); if (m) setTimeout(() => sfx(m >= 5 ? 'unlock' : 'magic', { vol: 0.7 }), 120);
      this.dirty = true; this.drawMine(); this.drawBar(); this.sendGarden();
    },
    water(p) {
      if (!(this.G.gear.can > 0)) return;
      this.G.gear.can--; if (!this.G.gear.can) delete this.G.gear.can;
      const s = SEEDS[p.s], ms = (s[4] && this.prog(p) >= 1 ? s[4] : s[3]) * 1000 * 0.12;
      if (this.prog(p) < 1) p.t -= ms; else { this.fruits(p); p.f = p.f.map((r) => (r > nowMs() ? r - ms : r)); }
      const pl = this.plots[this.myPlot]; puffAt(pl.ox + p.x, 2, pl.oz + p.z, 0x60a5fa, 10);
      toast('💧 Watered!'); sfx('splash'); this.dirty = true; this.drawBar(); this.drawMine();
    },
    dig(p) {
      const valuable = 'LMDP'.includes(SEEDS[p.s][1]);
      if (valuable && this.ask !== p.id) { this.ask = p.id; return toast(`Dig up your ${SEEDS[p.s][0]}? Click it again`); }
      this.ask = null; this.G.plants.splice(this.G.plants.indexOf(p), 1); this.dirty = true; this.drawMine(); this.sendGarden(); toast('🪏 Dug up'); sfx('dig');
    },
    placeSprinkler(type, x, z) {
      const spot = this.soilAt(x, z) || (this.myPlot != null && (() => { const pl = this.plots[this.myPlot], lx = x - pl.ox, lz = z - pl.oz; return Math.abs(lx) < PW / 2 && Math.abs(lz) < PD / 2 ? [lx, lz] : null; })());
      if (!spot) return toast('Place it in your garden');
      if (!(this.G.gear[type] > 0)) return;
      this.G.gear[type]--; if (!this.G.gear[type]) delete this.G.gear[type];
      this.G.sprk.push({ type, x: spot[0], z: spot[1], until: nowMs() + 300000 });
      this.dirty = true; this.drawBar(); this.drawMine(); this.sendGarden(true); toast(`${type === 'gsprk' ? '⛲' : '💦'} Sprinkler on for 5 minutes`); sfx('splash'); sfx('place');
    },
    prompts() {
      const list = this.stalls.map((s) => ({ x: s.x, z: s.z, r: 7, text: { seeds: 'Seed Shop', sell: 'Sell crops', gear: 'Gear Shop', eggs: 'Egg Shop' }[s.kind], fn: () => this[{ seeds: 'openShop', sell: 'openSell', gear: 'openGear', eggs: 'openEggs' }[s.kind]]() }));
      if (this.myPlot != null) {
        const pl = this.plots[this.myPlot]; let best = null, bd = 6;
        for (const p of this.G.plants) { const d = Math.hypot(pl.ox + p.x - P.x, pl.oz + p.z - P.z); if (d < bd && this.isRipe(p)) { bd = d; best = p; } }
        if (best) list.push({ x: P.x, z: P.z, r: 1, text: `Harvest ${SEEDS[best.s][0]}`, fn: () => this.harvest(best) });
      }
      return list;
    },
    // ------------------------------------------------ shops
    openShop(refresh) {
      if (refresh && !panelOpen()) { this.panel = null; return; }
      const st = stockNow(), b = this.G.bought.slot === st.slot ? this.G.bought.n : {};
      const html = `<div class="xp-row"><span>🥕 <b>${fmt(this.G.sh)}</b></span><span>🔄 Restock in <b>${mmss(st.left)}</b></span></div>
        ${SEEDS.map((s, i) => { const left = Math.max(0, st.n[i] - (b[i] || 0)); return `<div class="xp-row" style="border-left:4px solid ${RAR[s[1]][1]}"><span class="lft"><span class="ico">${s[7]}</span><span><b>${s[0]}</b> <small style="color:${RAR[s[1]][1]}">${RAR[s[1]][0]}</small><br><small style="color:var(--muted)">${s[4] ? `keeps fruiting · ${s[3]}s` : `harvest once · ${s[3]}s`}</small></span></span>
          <span style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px">${left ? `<small style="color:#86efac">×${left} in stock</small>` : '<small style="color:#f87171">NO STOCK</small>'}<button class="xp-btn" data-buy="${i}" ${!left || this.G.sh < s[2] ? 'disabled' : ''}>${fmt(s[2])}</button></span></div>`; }).join('')}`;
      if (refresh) { if ($('#xpBody').dataset.k !== html.length + ':' + Math.floor(st.left)) { $('#xpBody').innerHTML = html; $('#xpBody').dataset.k = html.length + ':' + Math.floor(st.left); } return; }
      this.panel = 'seeds';
      openPanel('🌱 Seed Shop', html, (btn) => {
        const i = +btn.dataset.buy, s = SEEDS[i], st2 = stockNow();
        if (this.G.bought.slot !== st2.slot) this.G.bought = { slot: st2.slot, n: {} };
        if ((this.G.bought.n[i] || 0) >= st2.n[i] || this.G.sh < s[2]) return;
        this.G.sh -= s[2]; this.G.bought.n[i] = (this.G.bought.n[i] || 0) + 1; this.G.seeds[i] = (this.G.seeds[i] || 0) + 1;
        this.dirty = true; this.drawBar(); this.openShop(true); toast(`+1 ${s[0]} Seed`, '#86efac'); sfx('buy');
      }, () => (this.panel = null));
    },
    value(c) { const s = SEEDS[c[0]]; return Math.round(s[6] * c[1] * c[1] * MUT[c[2]][1] * (1 + (this.has('Bunny') ? 0.1 : 0) + (this.has('Owl') ? 0.2 : 0))); },
    openSell() {
      const groups = {};
      for (const c of this.G.bag) { const k = c[0] + ':' + c[2]; (groups[k] = groups[k] || { s: c[0], m: c[2], n: 0, v: 0 }); groups[k].n++; groups[k].v += this.value(c); }
      const total = this.G.bag.reduce((a, c) => a + this.value(c), 0);
      const html = `<div class="xp-row"><span>🥕 <b>${fmt(this.G.sh)}</b></span><span>🎒 <b>${this.G.bag.length}/${MAX_BAG}</b> crops</span></div>
        ${Object.entries(groups).sort((a, b) => b[1].v - a[1].v).map(([k, g]) => `<div class="xp-row"><span class="lft"><span class="ico">${SEEDS[g.s][7]}</span><span>${g.m ? `<b style="color:${MUT_COL[g.m]}">${MUT[g.m][0]}</b> ` : ''}<b>${SEEDS[g.s][0]}</b> <small style="color:var(--muted)">×${g.n}</small></span></span><button class="xp-btn alt" data-sell="${k}">${fmt(g.v)}</button></div>`).join('') || '<p class="xp-note">Your bag is empty. Harvest ripe plants (press E next to them) and come back.</p>'}
        <button class="xp-btn gold" data-sell="all" style="width:100%;margin-top:6px" ${total ? '' : 'disabled'}>Sell everything for ${fmt(total)}</button>`;
      openPanel('💰 Sell Stand', html, (btn) => {
        const k = btn.dataset.sell; let got = 0;
        this.G.bag = this.G.bag.filter((c) => { if (k === 'all' || c[0] + ':' + c[2] === k) { got += this.value(c); return false; } return true; });
        if (!got) return;
        this.G.sh += got; this.dirty = true; toast(`+${fmt(got)}`, '#fde68a'); sfx('sell'); this.drawBar(); this.sendGarden(true); quest('garden.sold', got);
        this.coinAcc += got / 60; if (this.coinAcc >= 1) { earn(Math.min(300, Math.floor(this.coinAcc)), 'sold crops'); this.coinAcc = 0; }
        this.openSell();
      });
    },
    openGear() {
      const html = `<div class="xp-row"><span>🥕 <b>${fmt(this.G.sh)}</b></span></div>${GEAR.map((g) => `<div class="xp-row"><span class="lft"><span class="ico">${g.e}</span><span><b>${g.n}</b><br><small style="color:var(--muted)">${g.d}</small></span></span><button class="xp-btn" data-g="${g.id}" ${this.G.sh < g.price || (g.id === 'shovel' && this.G.gear.shovel) ? 'disabled' : ''}>${g.id === 'shovel' && this.G.gear.shovel ? 'Owned' : fmt(g.price)}</button></div>`).join('')}`;
      openPanel('🧰 Gear Shop', html, (btn) => {
        const g = GEAR.find((x) => x.id === btn.dataset.g); if (!g || this.G.sh < g.price) return;
        this.G.sh -= g.price; this.G.gear[g.id] = (this.G.gear[g.id] || 0) + (g.id === 'can' ? 10 : 1);
        this.dirty = true; this.drawBar(); toast(`Bought ${g.n}`, '#86efac'); sfx('buy'); this.openGear();
      });
    },
    openEggs() {
      const html = `<div class="xp-row"><span>🥕 <b>${fmt(this.G.sh)}</b></span><span>🐾 <b>${this.G.pets.length}</b> pets</span></div>${EGGS.map((e, i) => `<div class="xp-row"><span class="lft"><span class="ico">${e.e}</span><span><b>${e.n}</b><br><small style="color:var(--muted)">${PETS.filter((p) => p.egg === i).map((p) => p.e + ' ' + p.n).join(' · ')}</small></span></span><button class="xp-btn" data-egg="${i}" ${this.G.sh < e.price ? 'disabled' : ''}>${fmt(e.price)}</button></div>`).join('')}<p class="xp-note">Eggs hatch straight away. Equip up to 3 pets from 🐾 Pets (P); each gives a bonus.</p>`;
      openPanel('🥚 Egg Shop', html, (btn) => {
        const i = +btn.dataset.egg, e = EGGS[i]; if (this.G.sh < e.price || this.G.pets.length >= 30) return;
        this.G.sh -= e.price; const opts = PETS.map((p, k) => (p.egg === i ? k : -1)).filter((k) => k >= 0), got = opts[Math.floor(Math.random() * opts.length)];
        this.G.pets.push(got); if (this.G.eq.length < 3) this.G.eq.push(this.G.pets.length - 1);
        this.dirty = true; this.sendGarden(true); toast(`${PETS[got].e} You hatched a ${PETS[got].n}!`, '#fde68a'); sfx('egg'); puffAt(P.x, P.y + 3, P.z, CONFETTI, 30); this.openEggs();
      });
    },
    openPets() {
      const html = this.G.pets.length ? `<div class="xp-grid">${this.G.pets.map((t, i) => { const on = this.G.eq.includes(i); return `<div class="xp-card ${on ? 'on' : ''}"><div class="big">${PETS[t].e}</div><b>${PETS[t].n}</b><span>${PETS[t].d}</span><button class="xp-btn ${on ? 'alt' : ''}" data-p="${i}">${on ? 'Unequip' : 'Equip'}</button></div>`; }).join('')}</div>`
        : '<p class="xp-note">No pets yet. Buy an egg at the Egg Shop.</p>';
      openPanel('🐾 Pets (up to 3)', html, (btn) => {
        const i = +btn.dataset.p;
        if (this.G.eq.includes(i)) this.G.eq.splice(this.G.eq.indexOf(i), 1);
        else { if (this.G.eq.length >= 3) this.G.eq.shift(); this.G.eq.push(i); }
        this.dirty = true; this.sendGarden(true); this.openPets();
      });
    },
    openBag() {
      const html = this.G.bag.length ? this.G.bag.slice().sort((a, b) => this.value(b) - this.value(a)).slice(0, 60).map((c) => `<div class="xp-row"><span class="lft"><span class="ico">${SEEDS[c[0]][7]}</span><span>${c[2] ? `<b style="color:${MUT_COL[c[2]]}">${MUT[c[2]][0]}</b> ` : ''}<b>${SEEDS[c[0]][0]}</b> <small style="color:var(--muted)">${c[1]}kg</small></span></span><b style="color:#fde68a">${fmt(this.value(c))}</b></div>`).join('') + (this.G.bag.length > 60 ? `<p class="xp-note">…and ${this.G.bag.length - 60} more</p>` : '')
        : '<p class="xp-note">No crops yet.</p>';
      openPanel(`🎒 Bag (${this.G.bag.length}/${MAX_BAG})`, html, null);
    },
    drawStat() {
      const w = this.weather;
      const ws = w.w !== 'Clear' ? `${{ Rain: '🌧️', Thunderstorm: '⛈️', Frost: '❄️', 'Golden Hour': '🌅' }[w.w]} ${w.w} ${mmss(w.left)}` : '☀️ Clear';
      this.statLine = `🥕 ${fmt(this.G.sh)} · ${ws}${this.myPlot == null ? ' · no free plot' : ''}`;
    },
    hud() { return this.statLine || ''; },
    statOf(pr, isMe) { return fmt(isMe ? this.G.sh : pr.sh || 0); },
    sortKey(pr, isMe) { return isMe ? this.G.sh : +pr.sh || 0; },
    save() { this.dirty = false; const G = Object.assign({}, this.G, { plants: this.G.plants.map((p) => ({ s: p.s, x: p.x, z: p.z, t: Math.round(p.t), f: p.f ? p.f.map(Math.round) : undefined })) }); return kvSet('gg', G); },
    async leave() {
      await this.save();
      for (const v of this.petViews || []) scene.remove(v.g); this.petViews = []; this.petSig = '';
      for (const a of Net.avatars.values()) for (const g of a.gpets || []) scene.remove(g);
      sky('#58a9ff', '#cfeaff');
    },
  };
  addExp(GARDEN);
  window.__rbGarden = GARDEN;
  addEventListener('visibilitychange', () => { if (document.hidden && exp === GARDEN && playing) GARDEN.save(); });
})();
