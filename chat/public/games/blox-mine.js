/* =====================================================================
   BLOXVERSE — MINING TYCOON. Claim a mine at the foot of a cliff.
   Drills dig coal, iron, copper, silver, gold, diamond, emerald and
   mythril out of the rock; the ore rides the conveyor through the
   washer, the furnace (out comes a glowing bar), the refinery and the
   coin mint (each one doubles what it's worth) to the bank. Dig the
   mine deeper for rarer, sparkly ores; a railway and dynamite bring in
   more. Mine the veins in your quarry with your own pickaxe for cash
   and gems for your display case. Rebirth at the end.
   ===================================================================== */
(() => {
  const ORES = { coal: [0x292524, 'Coal'], iron: [0xc2a68c, 'Iron'], copper: [0xc2410c, 'Copper'], silver: [0xe5e7eb, 'Silver'], gold: [0xfacc15, 'Gold'], diamond: [0x67e8f9, 'Diamond'], emerald: [0x10b981, 'Emerald'], mythril: [0x818cf8, 'Mythril'] };
  const FINDS = [
    { n: 'Quartz', e: '🤍', r: 2, v: 500, c: 0xf8fafc }, { n: 'Amethyst', e: '💜', r: 2, v: 500, c: 0xa855f7 }, { n: 'Topaz', e: '🧡', r: 2, v: 600, c: 0xf97316 }, { n: 'Jade', e: '💚', r: 2, v: 600, c: 0x22c55e },
    { n: 'Sapphire', e: '💙', r: 3, v: 2500, c: 0x2563eb }, { n: 'Emerald', e: '💎', r: 3, v: 3000, c: 0x059669 }, { n: 'Ruby', e: '❤️', r: 3, v: 3000, c: 0xdc2626 },
    { n: 'Diamond', e: '💎', r: 4, v: 15000, c: 0xe0f2fe }, { n: 'Black Opal', e: '🖤', r: 4, v: 20000, c: 0x1e1b4b },
    { n: 'Painite', e: '🔶', r: 5, v: 90000, c: 0x9a3412 }, { n: 'Star Gem', e: '🌟', r: 5, v: 100000, c: 0xfde047 },
  ];
  const mats = new Map(), M = (c, o) => { const k = c + (o ? JSON.stringify(o) : ''); let m = mats.get(k); if (!m) { m = new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {})); mats.set(k, m); } return m; };
  const box = (g, c, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(BOX, typeof c === 'number' ? M(c) : c); m.scale.set(sx, sy, sz); m.position.set(x, y, z); g.add(m); return m; };
  const ROCK = new THREE.IcosahedronGeometry(0.6, 0), GEM = new THREE.OctahedronGeometry(0.55, 0), COIN = new THREE.CylinderGeometry(0.6, 0.6, 0.18, 14);
  const rainbow = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const reset = (g) => { while (g.children.length) g.remove(g.children[0]); };
  const PICKS = ['Stone Pickaxe', 'Iron Pickaxe', 'Diamond Pickaxe'], HITS = [5, 3, 2];
  const VEIN_SPOTS = [[-22, -2], [-16, -3], [-21, 2], [-14, 5], [-19, 8]]; // (clear of the buy pads in front of the belt)

  const MT = tycoonKit({
    id: 'mine', code: 'mt', saveKey: 'mt', rank: 0.0008, name: 'Mining Tycoon', emoji: '⛏️', noun: 'Mine', camDist: 22,
    color: 'linear-gradient(135deg,#78350f,#0ea5e9)',
    desc: 'Claim a mine. Drills dig coal, iron, gold, diamonds and more; the ore rides your conveyor through the washer, furnace, refinery and coin mint to the bank. Dig deeper for rarer, sparkly ores, add a mine railway and dynamite, and swing your own pickaxe in the quarry for cash and gems. Rebirth for more cash for good.',
    welcome: 'Step on a claim pad to get a mine!',
    land: { theme: 'desert', fence: 'stone', extras: ['crystals'] },
    skyCols: ['#7dd3fc', '#fef3c7'], ground: 0xc8a97a, speed0: 7,
    path: [[-22, -12], [16, -12], [16, 4]], padAt: [-4, 12], caseAt: [-15, 20], caseName: '💎 Gem case', caseShort: 'Gems',
    findHow: 'Gems turn up in the veins you mine with your pickaxe.',
    FINDS,
    items: [
      { n: 'Coal Drill', price: 0, kind: 'src', ore: 'coal', v: 2, every: 1.6, at: [-21, -12], drop: 2.5 },
      { n: 'Coal Drill 2', price: 25, kind: 'src', ore: 'coal', v: 3, every: 1.6, at: [-17, -12], drop: 2.5 },
      { n: 'Faster Belt', price: 75, kind: 'speed', sp: 10 },
      { n: 'Ore Washer', price: 160, kind: 'up', look: 'wash', at: [11, -12] },
      { n: 'Iron Drill', price: 320, kind: 'src', ore: 'iron', v: 5, every: 2, at: [-13, -12], drop: 2.5 },
      { n: 'Lanterns', price: 500, kind: 'deco', look: 'lanterns', bonus: 0.05, pad: [21, 0] },
      { n: 'Copper Drill', price: 900, kind: 'src', ore: 'copper', v: 12, every: 1.6, at: [-9, -12], drop: 2.5 },
      { n: 'Furnace', price: 1600, kind: 'up', look: 'furnace', at: [16, -7] },
      { n: 'Iron Pickaxe', price: 2600, kind: 'pick', lvl: 1, say: '⛏️ Veins break in 3 hits!', pad: [-7.5, 2] },
      { n: 'Silver Drill', price: 4500, kind: 'src', ore: 'silver', v: 35, every: 1.6, at: [-5, -12], drop: 2.5 },
      { n: 'Mine Level 2', price: 8000, kind: 'deco', look: 'depth', lvl: 1, bonus: 0.1, say: '✨ Rarer ores!', pad: [20.5, -19.5] },
      { n: 'Gold Drill', price: 14000, kind: 'src', ore: 'gold', v: 110, every: 1.4, at: [-1, -12], drop: 2.5 },
      { n: 'Mine Railway', price: 40000, kind: 'pay', look: 'rail', v: 2500, every: 9, pad: [21.4, -6] },
      { n: 'Refinery', price: 60000, kind: 'up', look: 'refine', at: [16, -2] },
      { n: 'Turbo Belt', price: 90000, kind: 'speed', sp: 14 },
      { n: 'Mine Level 3', price: 110000, kind: 'deco', look: 'depth', lvl: 2, bonus: 0.15, say: '✨ Even rarer ores!', pad: [20.5, -19.5] },
      { n: 'Diamond Drill', price: 170000, kind: 'src', ore: 'diamond', v: 500, every: 1.5, at: [3, -12], drop: 2.5 },
      { n: 'Diamond Pickaxe', price: 250000, kind: 'pick', lvl: 2, say: '⛏️ Veins break in 2 hits!', pad: [-7.5, 2] },
      { n: 'Coin Mint', price: 380000, kind: 'up', look: 'mint', at: [16, 3] },
      { n: 'Emerald Drill', price: 600000, kind: 'src', ore: 'emerald', v: 1200, every: 1.5, at: [7, -12], drop: 2.5 },
      { n: 'Mine Level 4', price: 850000, kind: 'deco', look: 'depth', lvl: 3, bonus: 0.2, say: '✨ The rarest ores!', pad: [20.5, -19.5] },
      { n: 'Dynamite', price: 1300000, kind: 'pay', look: 'dynamite', v: 30000, every: 10, pad: [-6, -22] },
      { n: 'Mythril Drill', price: 2800000, kind: 'src', ore: 'mythril', v: 6000, every: 1.4, at: [16, -10], side: true, drop: 2.5, pad: [21.4, -10] },
      { n: 'Diamond Mountain', price: 9000000, kind: 'deco', look: 'mountain', bonus: 0.25, pad: [3, -22] },
    ],

    tyWorld() {
      const s = label('⛏️ MINING\nTYCOON', { size: 3.2, color: '#fef3c7' }); s.position.set(0, 12, -8); place.add(s);
      slab(0, 0.2, 0, 14, 14, 0x78716c, { sy: 0.4 });
      for (const pl of this.plots) { const len = Math.abs(pl.oz) - 24 - 7; part({ x: pl.ox, y: 0.075, z: Math.sign(pl.oz) * (7 + len / 2), sx: 6, sy: 0.15, sz: len, c: 0x8b7355, plain: true }); if (pl.oz < 0) part({ x: pl.ox / 2 + Math.sign(pl.ox) * 3, y: 0.075, z: 0, sx: Math.abs(pl.ox), sy: 0.15, sz: 6, c: 0x8b7355, plain: true }); }
      // the cliffs behind every mine
      for (const pl of this.plots) {
        const [x, z] = this.W(pl, 0, -30);
        part({ x, y: 9, z, sx: 54, sy: 18, sz: 10, c: 0x92735a });
        part({ x, y: 18.5, z: z - pl.fz * 1.5, sx: 50, sy: 3, sz: 7, c: 0x7c5f48 });
        // the tunnel into the rock
        part({ x, y: 3.4, z: z + pl.fz * 5.05, sx: 6, sy: 6.6, sz: 0.2, c: 0x1c1917, plain: true, solid: false });
        for (const sx of [-3.4, 3.4]) part({ x: x + sx, y: 3.6, z: z + pl.fz * 5.3, sx: 0.8, sy: 7, sz: 0.8, c: 0x6b4a2b });
        part({ x, y: 7.3, z: z + pl.fz * 5.3, sx: 7.6, sy: 0.8, sz: 0.8, c: 0x6b4a2b });
      }
    },
    tyFloor(pl) { slab(pl.ox, 0.4, pl.oz, 48, 48, 0x8b7d6b, { sy: 0.4 }); },
    tyBase(pl, add) {
      // ore deposits along the back, where the drills go in
      for (let k = 0; k < 9; k++) add(-21 + k * 4, 1.6, -18.5, 3.4, 1.6, 2.6, 0x78716c);
      // the bank at the end of the conveyor
      add(16, 1.6, 7.4, 4.4, 1.2, 3, 0x57534e); add(16, 7.4, 12, 9, 7, 5, 0xe7e5e4);
      for (const x of [12.6, 14.9, 17.1, 19.4]) add(x, 7.6, 9.3, 0.8, 7.2, 0.8, 0xf5f5f4);
      add(16, 8.6, 11.6, 10, 1, 6, 0xd6d3d1);
      const [bx, bz] = this.W(pl, 16, 9.3), l = label('🏦 Bank', { size: 1.2 }); l.position.set(bx, 10.4, bz); place.add(l); pl.decor.push(l);
      // the quarry: rocky ground where veins come up
      add(-17, 0.5, 1, 14, 0.1, 18, 0x6b5b4b, { plain: true, solid: false });
      const [qx, qz] = this.W(pl, -17, -9.5), q = label('⛏️ Quarry', { size: 0.9, bg: 'rgba(15,23,42,.6)' }); q.position.set(qx, 2.6, qz); place.add(q); pl.decor.push(q);
    },
    tyItem(pl, it, i, add) {
      const anim = (f) => pl.anim.push(f);
      if (it.kind === 'src') {
        const [lx, lz] = it.side ? [19.6, -10] : [it.at[0], -16.2], [c] = ORES[it.ore];
        const g = new THREE.Group();
        for (const sx of [-1.2, 1.2]) box(g, 0x475569, 0.35, 6, 0.35, sx, 3, 0);
        box(g, 0xf59e0b, 3, 0.6, 1.2, 0, 6, 0); box(g, 0x334155, 1.4, 1.6, 1.4, 0, 4.8, 0);
        const bit = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.4, 8), M(0x94a3b8)); bit.rotation.x = Math.PI; bit.position.y = 2.8; g.add(bit);
        box(g, c, 1.6, 0.4, 1.6, 0, 6.5, 0); // the drill's colour: its ore
        if (it.side) g.rotation.y = Math.PI / 2;
        this.deco(pl, g, lx, 0.4, lz);
        anim((dt) => { bit.rotation.y += dt * 14; if (Math.random() < dt * 4) { const [x, z] = this.W(pl, lx, lz); puffAt(x, 1.4, z, [0xa8a29e, c], 1); } });
      } else if (it.kind === 'up') {
        const g = this.ty.pathAt(it.s)[2], along = Math.abs(g.dx) > 0.5, [lx, lz] = it.at, side = (o) => (along ? [lx, lz + o] : [lx + o, lz]);
        const look = { wash: [0x0ea5e9, '💧 Washer'], furnace: [0x7c2d12, '🔥 Furnace'], refine: [0x64748b, '⚙️ Refinery'], mint: [0xca8a04, '🪙 Coin Mint'] }[it.look];
        for (const o of [-2.6, 2.6]) { const [x, z] = side(o); add(x, 5.2, z, along ? 3.4 : 0.8, 4.8, along ? 0.8 : 3.4, look[0]); }
        add(lx, 6.4, lz, along ? 3.6 : 6, 1.2, along ? 6 : 3.6, look[0]);
        if (it.look === 'furnace') { add(lx, 4.4, lz, along ? 0.2 : 4.4, 2, along ? 4.4 : 0.2, 0xff6a00, { neon: true, solid: false, alpha: 0.7 }); const [cx, cz] = side(2.6); add(cx, 9.4, cz, 1.2, 3, 1.2, 0x44403c); anim((dt) => { if (Math.random() < dt * 4) { const [x, z] = this.W(pl, cx, cz); puffAt(x, 10.5, z, [0x57534e, 0x9ca3af], 1); } }); }
        else if (it.look === 'wash') anim((dt) => { if (Math.random() < dt * 8) { const [x, z] = this.W(pl, lx + (Math.random() - 0.5) * 2, lz + (Math.random() - 0.5) * 2); puffAt(x, 4.8, z, [0x7dd3fc, 0xe0f2fe], 1); } });
        const [x, z] = this.W(pl, lx, lz), l = label(look[1], { size: 0.9 }); l.position.set(x, 8.2, z); place.add(l); pl.decor.push(l);
      } else if (it.look === 'lanterns') {
        for (const [lx, lz] of [[-23, -22], [23, -22], [-23, 22], [23, 22], [-23, 0], [23, 0]]) { add(lx, 4.4, lz, 0.4, 4, 0.4, 0x44403c); add(lx, 4.9, lz, 0.9, 1, 0.9, 0xfde68a, { neon: true, solid: false }); }
      } else if (it.look === 'depth') {
        // the headframe over the shaft: taller the deeper you go, with its lift going up and down (only the deepest one's)
        if (this.items.some((q, k) => q.look === 'depth' && q.lvl > it.lvl && this.ty.has(pl.b, k))) return;
        const h = 8 + it.lvl * 4, g = new THREE.Group();
        for (const [sx, sz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) box(g, 0x7c2d12, 0.4, h, 0.4, sx, h / 2, sz);
        for (let y = 3; y < h; y += 3) { box(g, 0x9a3412, 3.6, 0.25, 0.25, 0, y, -1.6); box(g, 0x9a3412, 3.6, 0.25, 0.25, 0, y, 1.6); }
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.2, 6, 16), M(0x334155)); wheel.position.y = h + 1; g.add(wheel);
        const cage = box(g, 0xfacc15, 2, 2, 2, 0, 1.4, 0);
        const t = label(`⛏️ Level ${it.lvl + 1} · ${(it.lvl + 1) * 100} m deep`, { size: 0.8 }); t.position.y = h + 3; g.add(t);
        this.deco(pl, g, 20.5, 0.4, -20);
        anim((dt, t2) => { wheel.rotation.z += dt * 2; cage.position.y = 1.4 + (Math.sin(t2 / 1500) * 0.5 + 0.5) * (h - 4); });
      } else if (it.look === 'rail') {
        add(21.8, 0.5, -4, 2.4, 0.12, 24, 0x57534e, { plain: true, solid: false });
        for (let z = -15; z < 8; z += 2) add(21.8, 0.6, z, 2.8, 0.1, 0.4, 0x6b4a2b, { plain: true, solid: false });
        const cart = new THREE.Group(); box(cart, 0x475569, 2, 1.2, 2.6, 0, 0.9, 0); box(cart, ORES.gold[0], 1.6, 0.4, 2.2, 0, 1.6, 0);
        this.deco(pl, cart, 21.8, 0.4, -14);
        anim(() => { const p = 1 - (pl.tm[i] == null ? 0 : pl.tm[i]) / it.every, u = p < 0.4 ? p / 0.4 : p < 0.55 ? 1 : p < 0.95 ? 1 - (p - 0.55) / 0.4 : 0, [, z] = this.W(pl, 21.8, -14 + u * 20); cart.position.z = z; cart.children[1].visible = p < 0.55; });
      } else if (it.look === 'dynamite') {
        add(-6, 1.6, -21.5, 2, 1.2, 1.2, 0xdc2626); add(-6, 2.6, -21.5, 1.4, 0.8, 0.3, 0x111827);
      } else if (it.look === 'mountain') {
        const g = new THREE.Group(), d = new THREE.Mesh(new THREE.OctahedronGeometry(4, 0), new THREE.MeshLambertMaterial({ color: 0xbae6fd, emissive: 0x0e7490, transparent: true, opacity: 0.9 })); d.scale.y = 1.4; g.add(d);
        this.deco(pl, g, 0, 26, -30);
        anim((dt, t) => { d.rotation.y += dt * 0.6; g.position.y = 26 + Math.sin(t / 900) * 0.6; if (Math.random() < dt * 3) { const [x, z] = this.W(pl, (Math.random() - 0.5) * 8, -30); puffAt(x, 24 + Math.random() * 6, z, [0xe0f2fe, 0x67e8f9, 0xffffff], 1); } });
      }
    },
    // the dynamite goes off; the railway's cart arrives
    tyPay(pl, it) {
      if (it.look === 'dynamite') { const [x, z] = this.W(pl, (Math.random() - 0.5) * 30, -25); puffAt(x, 4, z, [0xf97316, 0xfde047, 0x57534e, 0x78716c], 30); sfx3('explode', x, z, 90, { vol: 0.5 }); }
    },
    depthOf(b) { let d = 0; this.items.forEach((it, i) => { if (it.look === 'depth' && this.ty.has(b, i)) d = Math.max(d, it.lvl); }); return d; },
    // an ore chunk (deeper mines: now and then a sparkly one, worth 3×)
    tyProd(pl, it) {
      const g = new THREE.Group(), [c] = ORES[it.ore], rare = Math.random() < this.depthOf(pl.b) * 0.06;
      const m = new THREE.Mesh(ROCK, it.ore === 'mythril' ? rainbow : rare ? M(c, { emissive: 0x6b5b00 }) : M(c)); g.add(m);
      if (rare) { m.scale.setScalar(1.3); g.userData.vk = 3; }
      g.userData.c = c;
      return g;
    },
    // washed, then a glowing bar, then polished, then a coin
    tyUp(pl, pr, it) {
      const g = pr.m, c = g.userData.c;
      if (it.look === 'wash') { const m = g.children[0]; if (m.material !== rainbow) m.material = M(new THREE.Color(c).lerp(new THREE.Color(0xffffff), 0.2).getHex()); }
      else if (it.look === 'furnace') { reset(g); box(g, M(c, { emissive: 0xc2410c }), 1.2, 0.5, 0.65, 0, 0, 0); }
      else if (it.look === 'refine') { reset(g); box(g, M(new THREE.Color(c).lerp(new THREE.Color(0xffffff), 0.35).getHex(), { emissive: 0x333333 }), 1.2, 0.5, 0.65, 0, 0, 0); }
      else if (it.look === 'mint') { reset(g); for (let k = 0; k < 2; k++) { const m = new THREE.Mesh(COIN, M(c === 0x292524 ? 0xa8a29e : c, { emissive: 0x3f3f00 })); m.position.y = k * 0.2 - 0.1; g.add(m); } }
    },
    tyCase(pl, f) { const m = new THREE.Mesh(GEM, M(FINDS[f].c, { emissive: new THREE.Color(FINDS[f].c).multiplyScalar(0.3).getHex() })); m.scale.set(0.9, 1.2, 0.9); return m; },

    /* ---- your own pickaxe ---- */
    pickLvl() { let l = 0; this.items.forEach((it, i) => { if (it.kind === 'pick' && this.ty.has(this.b, i)) l = Math.max(l, it.lvl); }); return l; },
    async tyEnter(s) { this.mined = Math.max(0, s.mined | 0); this.veins = []; this.veinAt = 0; this.swingT = 0; this.hitAt = 0; this.picks = new Map(); },
    tySave() { return { mined: this.mined }; },
    tyLeave() { removeParts((p) => p.vein); this.veins = []; for (const p of this.picks.values()) if (p.parent) p.parent.remove(p); this.picks.clear(); },
    // veins come up in your quarry, a few at a time
    tyTick(dt, t) {
      this.swingT = Math.max(0, this.swingT - dt);
      if (this.myPlot == null) return;
      const pl = this.plots[this.myPlot];
      this.veins = this.veins.filter((v) => parts.includes(v.rock));
      if (this.veins.length < 4 && t > this.veinAt) {
        this.veinAt = t + 3000;
        const free = VEIN_SPOTS.filter(([lx, lz]) => !this.veins.some((v) => v.lx === lx && v.lz === lz)), [lx, lz] = free[Math.floor(Math.random() * free.length)];
        const d = this.depthOf(this.b), pool = ['coal', 'iron', 'copper', 'silver', 'gold', 'diamond', 'emerald'].slice(0, 3 + d * 1 + 1), ore = pool[Math.floor(Math.random() * pool.length)];
        const [x, z] = this.W(pl, lx, lz), rock = part({ x, y: 1.4, z, sx: 2.6, sy: 2, sz: 2.6, c: 0x57534e, vein: true });
        for (let k = 0; k < 5; k++) part({ x: x + (Math.random() - 0.5) * 2.2, y: 1.2 + Math.random() * 1.6, z: z + (Math.random() - 0.5) * 2.2, sx: 0.5, sy: 0.5, sz: 0.5, c: ORES[ore][0], vein: rock, solid: false, neon: ore !== 'coal' });
        this.veins.push({ rock, lx, lz, ore, dmg: 0, x, z });
        puffAt(x, 2, z, [0x78716c, ORES[ore][0]], 8);
      }
      for (const v of this.veins) if (v.shake > 0) { v.shake -= dt; v.rock.m.position.x = v.x + Math.sin(t / 20) * 0.12 * (v.shake > 0 ? 1 : 0); }
    },
    tyPrompts() {
      if (this.myPlot == null || P.dead) return [];
      let best = null, bd = 3.4;
      for (const v of this.veins) { const d = Math.hypot(P.x - v.x, P.z - v.z); if (d < bd) { bd = d; best = v; } }
      return best ? [{ x: best.x, z: best.z, r: 3.4, text: `⛏️ Mine the ${ORES[best.ore][1].toLowerCase()} vein (${this.hitsLeft(best)})`, fn: () => this.hit(best) }] : [];
    },
    hitsLeft(v) { return Math.max(0, HITS[this.pickLvl()] - v.dmg); },
    hit(v) {
      const t = performance.now(); if (t < this.hitAt) return;
      this.hitAt = t + 330; this.swingT = 0.3; v.dmg++; v.shake = 0.25;
      P.yaw = Math.atan2(-(v.x - P.x), -(v.z - P.z));
      sfx('dig', { pitch: 0.9 + Math.random() * 0.2 }); puffAt(v.x, 2.2, v.z, [0x78716c, ORES[v.ore][0]], 5);
      if (this.hitsLeft(v) > 0) return;
      // broken: cash for the ore, and maybe a gem
      removeParts((p) => p === v.rock || p.vein === v.rock); this.veins = this.veins.filter((q) => q !== v);
      const k = ['coal', 'iron', 'copper', 'silver', 'gold', 'diamond', 'emerald'].indexOf(v.ore), cash = Math.round(this.worth(4 + k * 2, 10 + k * 15) * (1 + 0.5 * this.rb));
      this.gain(cash, null, null, true); this.mined++; quest('mine.vein');
      sfx('break'); puffAt(v.x, 2, v.z, [0x78716c, ORES[v.ore][0], 0xfde047], 18);
      toast(`⛏️ ${ORES[v.ore][1]}! +${money(cash)}`, '#fde68a');
      if (Math.random() < (0.08 + 0.05 * this.pickLvl() + 0.03 * this.depthOf(this.b)) * (hasItem('lucky') ? 2 : 1)) {
        const w = [0, 0, 60, 28, 9, 3]; let roll = Math.random() * 100, r = 2; while (r < 5 && roll >= w[r]) { roll -= w[r]; r++; }
        const opts = FINDS.map((F, f) => [F, f]).filter(([F]) => F.r === r); this.gotFind(opts[Math.floor(Math.random() * opts.length)][1], 'You dug up');
      }
    },
    // a pickaxe in your hand in the quarry, swung when you mine (and everyone else's)
    pose() {
      const pl = this.myPlot != null ? this.plots[this.myPlot] : null, inQ = pl && Math.abs(P.x - this.W(pl, -17, 0)[0]) < 9 && Math.abs(P.z - this.W(pl, -17, 0)[1]) < 12;
      this.holdPick(me, 'me', inQ || this.swingT > 0, this.swingT);
      if (inQ !== this.sentQ) { this.sentQ = inQ; send({ pk: inQ ? 1 : 0 }); }
      for (const p of Net.peers) { if (p.isMe) continue; const a = Net.avatars.get(p.peer); if (a) this.holdPick(a, p.peer, !!(p.presence && p.presence.pk), 0); }
    },
    holdPick(a, k, on, sw) {
      if (!a || a.dead) return;
      let p = this.picks.get(k);
      if (on && (!p || p.parent !== a.armR)) { if (p && p.parent) p.parent.remove(p); p = new THREE.Group(); box(p, 0x6b4a2b, 0.25, 3, 0.25, 0, 0, 0); box(p, [0x78716c, 0xd6d3d1, 0x67e8f9][k === 'me' ? this.pickLvl() : 0], 2.2, 0.35, 0.35, 0, 1.4, 0); p.position.set(0, -1.9, -0.4); p.rotation.x = -Math.PI / 2 + 0.3; a.armR.add(p); this.picks.set(k, p); }
      if (p) p.visible = on;
      if (on) a.armR.rotation.x = sw > 0 ? 0.3 + Math.sin((0.3 - sw) / 0.3 * Math.PI) * 1.8 : 0.9;
    },
    tyHud() { return this.myPlot != null && this.veins.length ? `⛏️ ${PICKS[this.pickLvl()]}` : ''; },
    coinShop: [
      { id: 'cash2', e: '💵', n: '2× Cash', d: 'Every ore you sell is worth double, for good', price: 700, kind: 'pass' },
      { id: 'lucky', e: '🍀', n: 'Lucky Pickaxe', d: 'Twice the chance of a gem in every vein, for good', price: 450, kind: 'pass' },
      shopSpeed(200, 1.25),
      { id: 'crate', e: '💰', n: 'Cash Crate', d: 'A minute of your mine’s cash (at least $300), right now', price: 40, kind: 'now' },
    ],
  });
  addExp(MT);
  window.__rbMT = MT;
})();
