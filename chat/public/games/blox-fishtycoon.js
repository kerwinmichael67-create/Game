/* =====================================================================
   BLOXVERSE — FISHING TYCOON. Four harbours along the beach. Claim one
   and buy nets that haul fish out of the sea, and boats that sail out
   and come back loaded; the fish ride the conveyor through the ice box,
   the fillet table, the smokehouse and the cannery (each one doubles
   what they're worth) to your market. Fish off the end of your dock
   with your own rod for rare catches: they swim in your aquarium and
   add to every sale (or sell them, or trade them). Rebirth at the end.
   ===================================================================== */
(() => {
  const NET_Z = -21.5, BOAT_Z = -31, DOCK_X = 23;
  // common fish on the conveyor
  const COLS = [0x94a3b8, 0x60a5fa, 0xf59e0b, 0x84cc16, 0xf472b6, 0xa3a3a3];
  // what your rod can catch: Common and Uncommon are sold on the spot
  const CATCH = [
    [['Cod', 0x9ca3af], ['Sardine', 0x93c5fd], ['Mackerel', 0x2563eb], ['Herring', 0xcbd5e1], ['Anchovy', 0x64748b]],
    [['Salmon', 0xfb7185], ['Tuna', 0x1e3a8a], ['Snapper', 0xef4444], ['Sea Bass', 0x57534e]],
  ];
  // rare catches: Rare and up go in your aquarium
  const FINDS = [
    { n: 'Clownfish', e: '🐠', r: 2, v: 500, c: 0xf97316 }, { n: 'Pufferfish', e: '🐡', r: 2, v: 500, c: 0xfde047 }, { n: 'Octopus', e: '🐙', r: 2, v: 600, c: 0xc026d3 },
    { n: 'Lobster', e: '🦞', r: 2, v: 600, c: 0xdc2626 }, { n: 'Swordfish', e: '🗡️', r: 2, v: 700, c: 0x475569 },
    { n: 'Shark', e: '🦈', r: 3, v: 2500, c: 0x64748b }, { n: 'Squid', e: '🦑', r: 3, v: 2500, c: 0xf9a8d4 }, { n: 'Manta Ray', e: '🪽', r: 3, v: 3000, c: 0x1e293b }, { n: 'Golden Koi', e: '🎏', r: 3, v: 3500, c: 0xfbbf24 },
    { n: 'Blue Whale', e: '🐋', r: 4, v: 15000, c: 0x3b82f6 }, { n: 'Narwhal', e: '🦄', r: 4, v: 18000, c: 0xe2e8f0 }, { n: 'Megalodon', e: '🦈', r: 4, v: 22000, c: 0x334155 },
    { n: 'Kraken', e: '🐙', r: 5, v: 80000, c: 0x7e22ce }, { n: 'Rainbow Leviathan', e: '🌈', r: 5, v: 100000, c: 0xffffff, rainbow: true }, { n: 'Ghost Fish', e: '👻', r: 5, v: 90000, c: 0xe0f2fe },
  ];
  const RODS = ['Old Rod', 'Better Rod', 'Pro Rod', 'Golden Rod'], ROD_COL = [0x8b5a2b, 0x2563eb, 0x7c3aed, 0xfacc15];
  const SEC = [4, 10, 25, 60, 180, 500], MIN = [10, 25, 80, 250, 1000, 4000]; // a catch's cash: that many seconds of your harbour's income (at least)
  const mats = new Map(), M = (c) => { let m = mats.get(c); if (!m) { m = new THREE.MeshLambertMaterial({ color: c }); mats.set(c, m); } return m; };
  const box = (g, c, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(BOX, typeof c === 'number' ? M(c) : c); m.scale.set(sx, sy, sz); m.position.set(x, y, z); g.add(m); return m; };
  const rainbowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  // a fish, nose along +x
  function fishMesh(c, k = 1) {
    const g = new THREE.Group(), m = c === 'rainbow' ? rainbowMat : M(c);
    box(g, m, 1.3 * k, 0.62 * k, 0.42 * k, 0, 0, 0); box(g, m, 0.32 * k, 0.62 * k, 0.1 * k, -0.78 * k, 0, 0);
    return g;
  }
  const filletMesh = (c) => { const g = new THREE.Group(); box(g, c, 1.2, 0.3, 0.7, 0, -0.15, 0); return g; };
  const canMesh = () => { const g = new THREE.Group(), m = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.8, 10), M(0xcbd5e1)); m.position.y = 0.1; g.add(m); box(g, 0x2563eb, 0.86, 0.42, 0.86, 0, 0.1, 0); return g; };
  const reset = (g) => { while (g.children.length) g.remove(g.children[0]); };
  function boatMesh(look) {
    const g = new THREE.Group();
    if (look === 'row') { box(g, 0x8b5a2b, 2.2, 0.8, 4.4, 0, 0.2, 0); box(g, 0x6b4a2b, 2.4, 0.3, 0.5, 0, 0.6, -2.0); box(g, 0xa16207, 0.2, 0.15, 3.4, -1.6, 0.6, 0.3).rotation.y = 0.3; box(g, 0xa16207, 0.2, 0.15, 3.4, 1.6, 0.6, 0.3).rotation.y = -0.3; }
    else if (look === 'motor') { box(g, 0xf8fafc, 2.6, 1, 5.6, 0, 0.3, 0); box(g, 0x2563eb, 2.7, 0.3, 5.7, 0, -0.1, 0); box(g, 0x93c5fd, 2, 1.2, 1.6, 0, 1.4, 0.2); box(g, 0x1f2937, 0.6, 1.2, 0.6, 0, 0.6, 3.0); }
    else if (look === 'trawler') { box(g, 0xb91c1c, 3.4, 1.4, 7, 0, 0.4, 0); box(g, 0xf8fafc, 3.5, 0.4, 7.1, 0, 1.2, 0); box(g, 0xf8fafc, 2.6, 2, 2.4, 0, 2.4, 1.6); box(g, 0x38bdf8, 2.7, 0.6, 1, 0, 2.9, 0.4); box(g, 0x78716c, 0.3, 5, 0.3, 0, 3.6, -2); box(g, 0x78716c, 0.2, 0.2, 4, 0, 5.5, -2.6).rotation.x = -0.5; }
    else if (look === 'sub') { const b = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 7, 14), M(0xfacc15)); b.rotation.x = Math.PI / 2; g.add(b); box(g, 0xfacc15, 1.2, 1.6, 2, 0, 1.6, 0.4); box(g, 0x1f2937, 0.25, 1.4, 0.25, 0, 3, 0.8); box(g, 0x38bdf8, 1.3, 0.5, 0.5, 0, 1.8, -0.5); for (const s of [-1, 1]) box(g, 0x1f2937, 0.2, 1.2, 1, s * 0.7, 0, 3.6); }
    else { box(g, 0x1e3a8a, 4.4, 2, 11, 0, 0.6, 0); box(g, 0xf8fafc, 4.5, 0.4, 11.1, 0, 1.7, 0); box(g, 0xf8fafc, 3.4, 3, 4, 0, 3.4, 2); box(g, 0x0ea5e9, 3.5, 0.7, 1, 0, 4.3, -0.1); box(g, 0xdc2626, 1, 2.4, 1, 0, 6, 3); box(g, 0x78716c, 0.3, 6, 0.3, 0, 4.5, -3.5); }
    return g;
  }
  const UPS = { ice: [0xe0f2fe, '❄️ Ice Box'], fillet: [0xfecaca, '🔪 Fillet Table'], smoke: [0x78350f, '🔥 Smokehouse'], can: [0x64748b, '🥫 Cannery'] };

  const FT = tycoonKit({
    id: 'fishty', code: 'ft', saveKey: 'ft', rank: 0.0005, name: 'Fishing Tycoon', emoji: '🐟', noun: 'Harbour', camDist: 22,
    color: 'linear-gradient(135deg,#0284c7,#f59e0b)',
    desc: 'Claim a harbour on the beach. Buy fishing nets, then boats that sail out and come back full; the fish ride your conveyor through the ice box, fillet table, smokehouse and cannery to your market. Fish off your dock with your own rod for rare catches that swim in your aquarium and add to every sale. Rebirth for more cash for good.',
    welcome: 'Step on a claim pad to get a harbour!',
    land: { theme: 'beach', mode: 'sea', sea: -0.6, holes: [[-131, -131, 131, -6]], extras: ['boats'] },
    skyCols: ['#5eb6ff', '#e0f2fe'], ground: false, speed0: 8,
    plotsAt: [[-84, 6, 1], [-28, 6, 1], [28, 6, 1], [84, 6, 1]],
    path: [[-22, -16], [20, -16], [20, 6]], padAt: [-6, 12], caseAt: [-14, -6], caseName: '🐠 Aquarium',
    findHow: 'Rare fish you catch with your rod (Rare and up) swim in your aquarium.',
    FINDS,
    items: [
      { n: 'Fishing Net', price: 0, kind: 'src', look: 'net', v: 2, every: 1.6, at: [-21, -16], drop: 2.6 },
      { n: 'Fishing Net 2', price: 25, kind: 'src', look: 'net', v: 3, every: 1.6, at: [-17.5, -16], drop: 2.6 },
      { n: 'Faster Belt', price: 75, kind: 'speed', sp: 11 },
      { n: 'Ice Box', price: 160, kind: 'up', look: 'ice', at: [14, -16] },
      { n: 'Rowboat', price: 320, kind: 'src', look: 'row', v: 6, every: 6, batch: 3, at: [-7, -16], drop: 4 },
      { n: 'Palm Trees', price: 500, kind: 'deco', look: 'palms', bonus: 0.05, pad: [-10, 19] },
      { n: 'Fishing Net 3', price: 900, kind: 'src', look: 'net', v: 12, every: 1.6, at: [-14, -16], drop: 2.6 },
      { n: 'Fillet Table', price: 1600, kind: 'up', look: 'fillet', at: [20, -10] },
      { n: 'Better Rod', price: 2600, kind: 'rod', lvl: 1, say: '🎣 Rarer catches!', pad: [-2, -21] },
      { n: 'Motorboat', price: 4500, kind: 'src', look: 'motor', v: 40, every: 7, batch: 4, at: [-3, -16], drop: 4 },
      { n: 'Lighthouse', price: 8000, kind: 'deco', look: 'lighthouse', bonus: 0.1, pad: [-20, 18] },
      { n: 'Golden Net', price: 14000, kind: 'src', look: 'net', gold: true, v: 110, every: 1.4, at: [-10.5, -16], drop: 2.6 },
      { n: 'Fishing Trawler', price: 40000, kind: 'src', look: 'trawler', v: 350, every: 8, batch: 4, at: [1, -16], drop: 4 },
      { n: 'Smokehouse', price: 60000, kind: 'up', look: 'smoke', at: [20, -4] },
      { n: 'Turbo Belt', price: 90000, kind: 'speed', sp: 15 },
      { n: 'Pro Rod', price: 110000, kind: 'rod', lvl: 2, say: '🎣 Even rarer catches!', pad: [-2, -21] },
      { n: 'Fish Statue', price: 170000, kind: 'deco', look: 'statue', bonus: 0.15, pad: [-2, -7] },
      { n: 'Submarine', price: 250000, kind: 'src', look: 'sub', v: 1800, every: 9, batch: 4, at: [5, -16], drop: 4 },
      { n: 'Cannery', price: 380000, kind: 'up', look: 'can', at: [20, 2] },
      { n: 'Neon Fish Sign', price: 600000, kind: 'deco', look: 'neon', bonus: 0.2, pad: [13, 19.5] },
      { n: 'Golden Rod', price: 850000, kind: 'rod', lvl: 3, say: '🎣 The best catches in the sea!', pad: [-2, -21] },
      { n: 'Mega Fishing Ship', price: 1300000, kind: 'src', look: 'mega', v: 8000, every: 10, batch: 6, at: [10, -16], drop: 4.5 },
      { n: 'Treasure Diver', price: 2800000, kind: 'pay', look: 'diver', v: 60000, every: 12, say: '🤿 Treasure from the sea bed!', pad: [18, -22] },
      { n: 'Golden Whale', price: 9000000, kind: 'deco', look: 'whale', bonus: 0.25, pad: [6, 2] },
    ],
    spawn0() { return [0, 0.5, 44, 0]; },

    /* ---- the beach, the sea and the harbours ---- */
    tyWorld() {
      slab(0, 0, 54, 242, 120, 0xe9d8a6, { sy: 2 }); // the beach and the town
      slab(0, 0.06, 86, 242, 56, 0x7cc35a, { sy: 0.12, plain: true, solid: false });
      slab(0, 0.05, 40, 242, 8, 0xc8a46a, { sy: 0.1, plain: true, solid: false }); // the boardwalk
      // the sea: shallow by the shore (you can wade), deep further out (where the boats go)
      slab(0, -1.4, -25, 262, 38, 0xd9c08c, { sy: 2 });
      slab(0, -12, -88, 262, 88, 0x8a7350, { sy: 2 });
      part({ x: 0, y: -0.9, z: -68.5, sx: 262, sy: 0.6, sz: 125, c: 0x1f7fc4, alpha: 0.72, plain: true, solid: false });
      // walls you can't see: the edges of the beach and the shallows
      const wall = (x, z, sx, sz) => { const p = part({ x, y: 8, z, sx, sy: 24, sz, alpha: 0, plain: true }); p.m.visible = false; };
      wall(-122, 54, 2, 122); wall(122, 54, 2, 122); wall(0, 115, 246, 2); wall(-131, -25, 2, 40); wall(131, -25, 2, 40); wall(0, -45, 264, 2);
      // the public pier, for anyone to fish from
      slab(0, 0.4, -24, 6, 36, 0x8b5a2b, { sy: 0.6 }); slab(0, 0.4, -40, 14, 6, 0x8b5a2b, { sy: 0.6 });
      for (let z = -10; z > -44; z -= 8) for (const x of [-2.6, 2.6]) part({ x, y: -0.6, z, sx: 0.6, sy: 2, sz: 0.6, c: 0x5b3a1e });
      const pl = label('🎣 Public Pier', { size: 1.2, bg: 'rgba(15,23,42,.65)' }); pl.position.set(0, 4, -8); place.add(pl);
      const s = label('🐟 FISHING\nTYCOON', { size: 3.2, color: '#e0f2fe' }); s.position.set(0, 14, 62); place.add(s);
      // the town behind the beach: little shops with striped roofs
      const r = mulberry(5150), shop = [0xfca5a5, 0x93c5fd, 0xfde68a, 0x86efac, 0xc4b5fd];
      for (let i = 0; i < 9; i++) {
        const x = -104 + i * 26, z = 100, c = shop[i % shop.length];
        if (Math.abs(x) < 10) continue;
        part({ x, y: 3, z, sx: 12, sy: 6, sz: 9, c });
        part({ x, y: 6.4, z: z - 0.4, sx: 13, sy: 0.8, sz: 10, c: [0xef4444, 0x2563eb, 0x16a34a][i % 3] });
        part({ x, y: 1.8, z: z - 4.55, sx: 2.4, sy: 3.6, sz: 0.2, c: 0x6b4a2b });
      }
      for (let i = 0; i < 14; i++) { const x = -110 + r() * 220, z = 56 + r() * 30; if (Math.abs(x) < 14) continue; this.palm(null, x, 0.1, z, 0.8 + r() * 0.4); }
    },
    // a plot: paving on the beach, a wooden dock over the water
    tyFloor(pl) {
      slab(pl.ox, 0.4, pl.oz + 6, 48, 36, 0xd6d3d1, { sy: 0.4 });
      slab(pl.ox, 0.4, pl.oz - 18, 48, 12, 0x9a6b3c, { sy: 1.8 });
      for (let x = -22; x <= 22; x += 8.8) part({ x: pl.ox + x, y: -0.4, z: pl.oz - 24.4, sx: 0.9, sy: 3.2, sz: 0.9, c: 0x5b3a1e });
    },
    palm(pl, x, y, z, k = 1) {
      const g = new THREE.Group(), h = 7 * k;
      for (let i = 0; i < 5; i++) box(g, 0x8b5a2b, 0.7 * k, h / 5 + 0.1, 0.7 * k, i * 0.12 * k, h / 10 + i * h / 5, 0);
      for (let a = 0; a < 6; a++) { const l = box(g, 0x16a34a, 4.2 * k, 0.2, 1.1 * k, 0.6 * k, h, 0); l.position.x += Math.cos(a) * 1.8 * k; l.position.z = Math.sin(a) * 1.8 * k; l.rotation.y = -a; l.rotation.z = -0.35; }
      if (pl) return this.deco(pl, g, x, y, z);
      g.position.set(x, y, z); place.add(g); return g;
    },
    tyBase(pl, add) {
      // the market at the end of the conveyor
      add(20, 1.8, 7.6, 4.6, 1.4, 3.2, 0x6b4a2b); add(20, 1.9, 7.6, 3.8, 0.12, 2.4, 0xe0f2fe, { plain: true });
      add(20, 1.6, 12, 8, 1.2, 3, 0x9a6b3c);
      for (const x of [16.4, 23.6]) add(x, 6.6, 12.6, 0.4, 6.2, 0.4, 0x6b4a2b);
      add(20, 7.1, 11.2, 8.4, 0.5, 4.8, 0x0ea5e9); add(20, 6.8, 13.7, 8.4, 0.6, 0.2, 0xffffff);
      const [mx, mz] = this.W(pl, 20, 12.6), l = label('🐟 Market', { size: 1.2 }); l.position.set(mx, 8.6, mz); place.add(l); pl.decor.push(l);
      // where to fish from
      const [fx, fz] = this.W(pl, -2, -23), f = label('🎣 Fish here', { size: 0.9, bg: 'rgba(15,23,42,.6)' }); f.position.set(fx, 2.6, fz); place.add(f); pl.decor.push(f);
    },
    tyItem(pl, it, i, add) {
      const lx = it.at ? it.at[0] : 0;
      if (it.look === 'net') {
        add(lx, 7.4, NET_Z, 0.7, 7, 0.7, it.gold ? 0xfacc15 : 0x6b4a2b);
        const g = new THREE.Group(), arm = box(g, it.gold ? 0xfde047 : 0x8b5a2b, 0.35, 0.35, 5.4, 0, 0, -2.7);
        const rope = box(g, 0xe7e5e4, 0.08, 1, 0.08, 0, 0, -5.3);
        const net = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: it.gold ? 0xfacc15 : 0xd6c49a, wireframe: true })); net.scale.set(1.8, 1.4, 1.8); g.add(net);
        this.deco(pl, g, lx, 7.4, NET_Z); arm.castShadow = true;
        // down into the sea, up, swing round over the belt, let go
        pl.anim.push(() => {
          const p = 1 - (pl.tm[i] == null ? 0 : pl.tm[i]) / it.every;
          const ang = p < 0.15 ? Math.PI * (1 - p / 0.15) : p < 0.65 ? 0 : p < 0.85 ? Math.PI * (p - 0.65) / 0.2 : Math.PI;
          const low = p < 0.15 ? 2 : p < 0.35 ? 2 + (p - 0.15) / 0.2 * 6.6 : p < 0.5 ? 8.6 : p < 0.65 ? 8.6 - (p - 0.5) / 0.15 * 6.6 : 2;
          g.rotation.y = ang; rope.scale.y = low; rope.position.y = -low / 2; net.position.set(0, -low - 0.6, -5.3);
        });
      } else if (it.kind === 'src') {
        const m = boatMesh(it.look), len = { row: 4.4, motor: 5.6, trawler: 7, sub: 7, mega: 11 }[it.look] || 6;
        const home = BOAT_Z - len / 2 + 2;
        add(lx, 0.6, -24.6, 2.4, 0.4, 1.6, 0x6b4a2b); // a little jetty where it ties up
        this.deco(pl, m, lx, -0.5, home);
        pl.anim.push((dt, t) => {
          const p = 1 - (pl.tm[i] == null ? 0 : pl.tm[i]) / it.every, ease = (u) => u * u * (3 - 2 * u);
          const out = p < 0.08 ? 0 : p < 0.45 ? ease((p - 0.08) / 0.37) : p < 0.6 ? 1 : p < 0.95 ? 1 - ease((p - 0.6) / 0.35) : 0;
          const [, z] = this.W(pl, lx, home - out * 52);
          m.position.z = z; m.position.y = -0.5 + Math.sin(t / 600 + i) * 0.12 - (it.look === 'sub' ? out * 5 : 0);
          m.rotation.y = p > 0.45 && p < 0.95 ? Math.PI : 0;
          m.rotation.z = Math.sin(t / 800 + i) * 0.04;
        });
      } else if (it.kind === 'up') {
        const [c, name] = UPS[it.look], g = this.ty.pathAt(it.s)[2], along = Math.abs(g.dx) > 0.5, lz = it.at[1];
        const side = (o) => (along ? [lx, lz + o] : [lx + o, lz]);
        for (const o of [-2.6, 2.6]) { const [x, z] = side(o); add(x, 6, z, along ? 3 : 0.6, 5.6, along ? 0.6 : 3, c); }
        add(lx, 6.6, lz, along ? 3.4 : 6, 0.6, along ? 6 : 3.4, it.look === 'smoke' ? 0x44403c : 0xf8fafc);
        add(lx, 4.4, lz, along ? 0.2 : 4.4, 4, along ? 4.4 : 0.2, 0x7dd3fc, { neon: true, solid: false, alpha: 0.35 });
        const [x, z] = this.W(pl, lx, lz), l = label(name, { size: 0.9 }); l.position.set(x, 8.2, z); place.add(l); pl.decor.push(l);
        if (it.look === 'smoke') { const [cx, cz] = side(2.6); add(cx, 9.6, cz, 1.2, 3, 1.2, 0x57534e); pl.anim.push((dt) => { if (Math.random() < dt * 3) { const [wx, wz] = this.W(pl, cx, cz); puffAt(wx, 10, wz, [0x9ca3af, 0xd6d3d1], 1); } }); }
      } else if (it.look === 'palms') { for (const [x, z] of [[-22, -9], [23, 22], [-10, 22], [-23, 8]]) this.palm(pl, x, 0.6, z); }
      else if (it.look === 'lighthouse') {
        const g = new THREE.Group();
        for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(1.6 - k * 0.12, 1.7 - k * 0.12, 2.4, 14), M(k % 2 ? 0xffffff : 0xdc2626)); m.position.y = 1.2 + k * 2.4; g.add(m); }
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.6, 12), new THREE.MeshBasicMaterial({ color: 0xfef08a })); lamp.position.y = 15.2; g.add(lamp);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.8, 12), M(0x1f2937)); cap.position.y = 16.9; g.add(cap);
        const beam = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: 0xfef9c3, transparent: true, opacity: 0.35, depthWrite: false })); beam.scale.set(16, 0.8, 0.8); beam.position.set(8, 15.2, 0);
        const piv = new THREE.Group(); piv.add(beam); g.add(piv);
        this.deco(pl, g, -20, 0.6, 18);
        add(-20, 15, 18, 3, 14.4, 3, 0, { alpha: 0, plain: true }).m.visible = false; // so you can't walk through it
        pl.anim.push((dt) => { piv.rotation.y += dt * 1.2; });
      } else if (it.look === 'statue') {
        add(-2, 2, -7, 4, 1.6, 4, 0x94a3b8);
        const f = fishMesh(0xfbbf24, 3.4); f.rotation.z = 0.5; this.deco(pl, f, -2, 4.6, -7);
        pl.anim.push((dt) => { f.rotation.y += dt * 0.6; });
      } else if (it.look === 'neon') {
        const c = new THREE.Color(this.ty.PLOT_COLS[pl.k]).lerp(new THREE.Color(0xffffff), 0.3).getHex();
        for (const x of [9, 17]) add(x, 6, 20, 0.5, 5.6, 0.5, 0x374151);
        add(13, 9.2, 20, 10, 3.4, 0.5, 0x0f172a);
        const f = fishMesh(c, 2.4); f.children.forEach((m) => { m.material = new THREE.MeshBasicMaterial({ color: c }); }); this.deco(pl, f, 13, 9.3, 19.5);
        pl.anim.push((dt, t) => { const on = Math.floor(t / 600) % 4 !== 0; f.visible = on; });
      } else if (it.look === 'diver') {
        add(18, 1.4, -23, 3, 1, 3, 0x0f766e);
        const d = new THREE.Group(); box(d, 0x111827, 0.9, 2, 0.6, 0, 0, 0); box(d, 0xfacc15, 0.7, 0.7, 0.7, 0, 1.3, 0); box(d, 0x38bdf8, 0.5, 0.3, 0.2, 0, 1.35, -0.4);
        const chest = new THREE.Group(); box(chest, 0x92400e, 1.2, 0.8, 0.8, 0, 0, 0); box(chest, 0xfacc15, 1.25, 0.2, 0.85, 0, 0.2, 0); chest.position.y = -1.3; d.add(chest);
        this.deco(pl, d, 18, 3, -27);
        pl.anim.push(() => { const p = 1 - (pl.tm[i] == null ? 0 : pl.tm[i]) / it.every; d.position.y = -0.6 - Math.sin(Math.min(1, p) * Math.PI) * 4.4; chest.visible = p > 0.5; });
      } else if (it.look === 'whale') {
        add(6, 1.6, 2, 10, 1.2, 5, 0x94a3b8);
        const g = new THREE.Group(), gold = new THREE.MeshLambertMaterial({ color: 0xfbbf24, emissive: 0x7c5800 });
        box(g, gold, 8, 3, 3.4, 0, 0, 0); box(g, gold, 3, 2.4, 3, -4.6, 0.4, 0); box(g, gold, 1.4, 0.5, 4.6, 5.2, 0.6, 0).rotation.z = 0.5; box(g, gold, 2.4, 0.4, 1.2, 0.6, -1, 2).rotation.x = 0.4; box(g, gold, 2.4, 0.4, 1.2, 0.6, -1, -2).rotation.x = -0.4;
        this.deco(pl, g, 6, 4.2, 2);
        pl.anim.push((dt, t) => { g.position.y = 4.4 + Math.sin(t / 900) * 0.3; if (Math.random() < dt * 2) { const [x, z] = this.W(pl, 2, 2); puffAt(x, 7, z, [0x7dd3fc, 0xe0f2fe], 2); } });
      }
    },
    tyProd(pl, it) { return fishMesh(it.gold ? 0xfacc15 : COLS[Math.floor(Math.random() * COLS.length)]); },
    // ice → fillet → smoked → canned
    tyUp(pl, pr, it) {
      const g = pr.m;
      if (it.look === 'ice') { g.children.forEach((m) => { m.material = M(0xbae6fd); }); }
      else if (it.look === 'fillet') { reset(g); g.add(filletMesh(0xfda4af)); }
      else if (it.look === 'smoke') { reset(g); g.add(filletMesh(0xb45309)); }
      else if (it.look === 'can') { reset(g); g.add(canMesh()); }
    },
    tySold(pl) { if (Math.random() < 0.25) { const [x, z] = this.W(pl, 20, 7.6); puffAt(x, 2.2, z, [0xe0f2fe, 0xffffff], 2); } },
    tyCase(pl, f) { const F = FINDS[f]; const m = fishMesh(F.rainbow ? 'rainbow' : F.c, F.r >= 4 ? 0.95 : 0.75); return m; },

    /* ---- your own rod ---- */
    rodLvl() { let l = 0; this.items.forEach((it, i) => { if (it.kind === 'rod' && this.ty.has(this.b, i)) l = Math.max(l, it.lvl); }); return l; },
    async tyEnter(s) {
      this.caught = Math.max(0, s.caught | 0); this.R = { st: 'idle' }; this.rodM = null; this.others = new Map();
    },
    tySave() { return { caught: this.caught }; },
    tyLeave() { this.endFish(); for (const o of this.others.values()) { scene.remove(o.bob); scene.remove(o.line); } this.others.clear(); },
    // where you can fish: the back of your dock, or the end of the public pier
    fishSpot() {
      if (P.dead || P.y < 0) return false;
      if (Math.abs(P.x) < 7.5 && P.z < -36) return true;
      if (this.myPlot == null) return false;
      const pl = this.plots[this.myPlot], lx = P.x - pl.ox, lz = (P.z - pl.oz) * pl.fz;
      return Math.abs(lx) < DOCK_X && lz < -19 && lz > -25;
    },
    tyPrompts() {
      if (this.tg) return [];
      const R = this.R;
      if (R.st === 'idle' && this.fishSpot()) return [{ x: P.x, z: P.z, r: 2, text: `🎣 Cast your ${RODS[this.rodLvl()]}`, fn: () => this.cast() }];
      if (R.st === 'wait') return [{ x: P.x, z: P.z, r: 3, text: '🎣 Reel in', fn: () => this.endFish('You reeled in.') }];
      if (R.st === 'idle' && this.myPlot == null && Math.abs(P.x) < 7 && P.z < -6 && P.z > -36) return [{ x: P.x, z: P.z, r: 2, text: '🎣 Walk to the end of the pier to fish', fn: () => {} }];
      return [];
    },
    cast() {
      const lvl = this.rodLvl(), bob = new THREE.Group(), a = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), M(0xef4444)); bob.add(a);
      const w = new THREE.Mesh(new THREE.SphereGeometry(0.33, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(0xffffff)); bob.add(w);
      const x = P.x, z = P.z - 9;
      bob.position.set(x, -0.5, z); scene.add(bob);
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xf8fafc })); scene.add(line);
      P.yaw = 0; // face the sea
      const bait = useItem('bait');
      this.R = { st: 'wait', bob, line, x, z, px: P.x, pz: P.z, t: (2 + Math.random() * 4) * (1 - 0.15 * lvl) * (bait ? 0.6 : 1), bait, lvl };
      puffAt(x, -0.4, z, [0xffffff, 0x93c5fd], 6); sfx('swing'); setTimeout(() => sfx('splash', { vol: 0.5 }), 250);
      send({ fb: [+x.toFixed(1), +z.toFixed(1)] });
      if (bait) toast(`🪱 Lucky Bait on! (${itemCount('bait')} left)`, '#fde68a');
    },
    endFish(msg) {
      const R = this.R; if (!R) return;
      if (R.bob) scene.remove(R.bob); if (R.line) { scene.remove(R.line); R.line.geometry.dispose(); }
      if (R.st !== 'idle') send({ fb: 0 });
      this.R = { st: 'idle' }; this.timingEnd();
      if (msg) toast(msg);
    },
    bite() {
      const R = this.R; R.st = 'bite';
      puffAt(R.x, -0.3, R.z, [0xffffff, 0x7dd3fc], 10); sfx('splash'); sfx('select');
      this.timing({ title: '🐟 A bite! Stop in the green to hook it', btn: '🎣 Hook it!', zone: 0.2 + 0.04 * R.lvl, speed: 1.25, time: 5, done: (sc) => this.hooked(sc) });
    },
    // what you caught: a rarer rod (and Lucky Bait, and a perfect hook) means rarer fish
    hooked(sc) {
      const R = this.R;
      if (sc < 0) { this.endFish('🐟 It got away!'); sfx('error', { gap: 300 }); return; }
      const lvl = R.lvl, w = [60, 25, 10, 4, 0.9, 0.12].map((x, r) => x * (r >= 2 ? (1 + 0.7 * lvl) * (R.bait ? 3 : 1) * (sc > 0 ? 1.5 : 1) : 1) * (r >= 4 ? 1 + lvl : 1));
      let roll = Math.random() * w.reduce((a, b) => a + b, 0), r = 0;
      while (r < 5 && roll >= w[r]) { roll -= w[r]; r++; }
      const cash = this.worth(SEC[r], MIN[r]) * (1 + 0.5 * this.rb);
      this.caught++; quest('fishty.catch');
      if (r < 2) {
        const [n] = CATCH[r][Math.floor(Math.random() * CATCH[r].length)];
        this.gain(cash, null, null, true); toast(`🐟 ${sc > 0 ? 'Perfect! ' : ''}You caught a ${n}! +${money(cash)}`, r ? '#86efac' : '#e2e8f0'); sfx('coin');
      } else {
        const opts = FINDS.map((F, f) => [F, f]).filter(([F]) => F.r === r), [, f] = opts[Math.floor(Math.random() * opts.length)];
        this.gain(cash, null, null, true); this.gotFind(f, `You caught`);
        toast(`+${money(cash)} · in your aquarium now`, '#fde68a');
      }
      puffAt(P.x, P.y + 4, P.z, r >= 2 ? CONFETTI : [0x93c5fd, 0xffffff], r >= 2 ? 30 : 10);
      this.endFish();
    },
    tyTick(dt, t) {
      const R = this.R;
      if (R && R.st !== 'idle') {
        if (P.dead || Math.hypot(P.x - R.px, P.z - R.pz) > 4) { this.endFish(P.dead ? null : 'You walked away from your line.'); }
        else {
          if (R.st === 'wait') { R.t -= dt; if (R.t <= 0) this.bite(); }
          R.bob.position.y = -0.5 + (R.st === 'bite' ? -0.35 + Math.sin(t / 60) * 0.12 : Math.sin(t / 400) * 0.06);
          this.lineTo(R.line, this.tip(me), R.bob.position);
        }
      }
      // everyone else's lines
      for (const p of Net.peers) {
        if (p.isMe) continue;
        const fb = p.presence && p.presence.fb, a = Net.avatars.get(p.peer); let o = this.others.get(p.peer);
        if (!Array.isArray(fb) || !a) { if (o) { scene.remove(o.bob); scene.remove(o.line); this.others.delete(p.peer); } continue; }
        if (!o) { o = { bob: new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), M(0xef4444)), line: new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xf8fafc })) }; scene.add(o.bob, o.line); this.others.set(p.peer, o); }
        o.bob.position.set(+fb[0] || 0, -0.5 + Math.sin(t / 400) * 0.06, +fb[1] || 0);
        this.lineTo(o.line, this.tip(a), o.bob.position);
      }
    },
    lineTo(line, a, b) { const pos = line.geometry.attributes.position; pos.setXYZ(0, a.x, a.y, a.z); pos.setXYZ(1, b.x, b.y, b.z); pos.needsUpdate = true; line.geometry.computeBoundingSphere(); },
    tip(a) { const r = a && a.ftRod; if (r) { r.updateMatrixWorld(true); return r.userData.tip.getWorldPosition(new THREE.Vector3()); } const p = a ? a.g.position : new THREE.Vector3(P.x, P.y, P.z); return new THREE.Vector3(p.x, p.y + 5, p.z - 2); },
    // a rod in your hand while you fish (and in everyone else's)
    pose() {
      this.holdRod(me, this.R && this.R.st !== 'idle', this.rodLvl());
      for (const p of Net.peers) { if (p.isMe) continue; const a = Net.avatars.get(p.peer); if (a) this.holdRod(a, !!(p.presence && Array.isArray(p.presence.fb)), 0); }
    },
    holdRod(a, on, lvl) {
      if (!a || a.dead) return;
      let r = a.ftRod;
      if (on && (!r || r.userData.lvl !== lvl)) {
        if (r) a.armR.remove(r);
        r = new THREE.Group(); box(r, 0x3f2a1e, 0.28, 1.2, 0.28, 0, -0.2, 0); box(r, ROD_COL[lvl], 0.16, 5.2, 0.16, 0, 2.8, 0);
        const tip = new THREE.Object3D(); tip.position.y = 5.4; r.add(tip); r.userData = { tip, lvl };
        r.rotation.x = -Math.PI / 2 + 0.3; r.position.set(0, -1.9, -0.2); a.armR.add(r); a.ftRod = r;
      }
      if (r) r.visible = on;
      if (on) a.armR.rotation.x = 1.25;
    },
    tyHud() { const R = this.R; return R && R.st === 'wait' ? '🎣 waiting for a bite…' : this.fishSpot() ? `🎣 ${touchy ? 'Tap' : 'Press E'} to fish` : ''; },
    coinShop: [
      { id: 'cash2', e: '💵', n: '2× Cash', d: 'Every fish you sell is worth double, for good', price: 700, kind: 'pass' },
      { id: 'bait', e: '🪱', n: 'Lucky Bait', d: '5 casts with 3× the chance of a rare fish (and quicker bites)', price: 25, kind: 'use', pack: 5 },
      shopSpeed(200, 1.25),
      { id: 'crate', e: '💰', n: 'Cash Crate', d: 'A minute of your harbour’s cash (at least $300), right now', price: 40, kind: 'now' },
    ],
  });
  addExp(FT);
  window.__rbFT = FT;
})();
