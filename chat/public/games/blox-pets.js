/* =====================================================================
   BLOXVERSE — PET SIMULATOR. Your pets follow you around and break
   coin piles, crates, crystals, presents and chests for coins and gems.
   Hatch eggs for stronger pets (six rarities), unlock new zones, make
   pets Golden and Rainbow, and buy upgrades. Your progress is saved;
   everyone on the server sees your pets.
   ===================================================================== */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    #psHatch{position:absolute;inset:0;display:grid;place-items:center;pointer-events:auto;background:radial-gradient(circle,rgba(0,0,0,.35),rgba(0,0,0,.75));z-index:5;cursor:pointer}
    #psHatch .egg{font-size:150px;animation:psWob .18s ease-in-out infinite alternate;filter:drop-shadow(0 10px 20px rgba(0,0,0,.5))}
    #psHatch .row{display:flex;gap:18px;flex-wrap:wrap;justify-content:center;padding:20px}
    #psHatch .got{width:200px;border-radius:24px;padding:16px;text-align:center;background:linear-gradient(180deg,#1f2937,#0f172a);border:3px solid var(--rc,#94a3b8);box-shadow:0 0 50px var(--rc,#94a3b8);animation:psPop .45s cubic-bezier(.2,1.6,.5,1)}
    #psHatch .got img{width:150px;height:150px;object-fit:contain}
    #psHatch .got b{display:block;font:600 22px var(--fh);color:#fff}
    #psHatch .got span{font:700 15px var(--fh);color:var(--rc)}
    #psHatch .got small{display:block;color:#cbd5e1;font:700 13px var(--fb);margin-top:4px}
    #psHatch .tap{position:absolute;bottom:14%;color:#e2e8f0;font:600 15px var(--fh);opacity:.8}
    @keyframes psWob{from{transform:rotate(-14deg) scale(1)}to{transform:rotate(14deg) scale(1.06)}}
    @keyframes psPop{from{transform:scale(.3);opacity:0}}
    .ps-card img{width:100%;height:84px;object-fit:contain}
    .ps-card .v{position:absolute;top:6px;left:8px;font:700 11px var(--fh);padding:2px 6px;border-radius:8px;background:rgba(0,0,0,.45)}
    .ps-card .pw{font:700 12px var(--fh);color:#fde68a}
    .ps-odds{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0}
    .ps-odds div{background:rgba(0,0,0,.25);border-radius:12px;padding:6px;text-align:center;font:700 11.5px var(--fb);border:2px solid var(--rc)}
    .ps-odds img{width:64px;height:64px;object-fit:contain;display:block;margin:0 auto}
    .ps-odds b{display:block;color:#fff;font:600 12.5px var(--fh)}`;
  document.head.append(style);

  /* ---------------- numbers ---------------- */
  const short = (n) => { n = Math.floor(n || 0); if (n < 1000) return String(n); const u = ['K', 'M', 'B', 'T', 'Qa']; let i = -1; while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; } return (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)).replace(/\.?0+$/, '') + u[i]; };
  const RAR = [['Common', '#cbd5e1', 1], ['Uncommon', '#4ade80', 1.6], ['Rare', '#60a5fa', 2.6], ['Epic', '#c084fc', 4.5], ['Legendary', '#fbbf24', 9], ['Mythical', '#f87171', 20]];
  const CHANCE = [55, 28, 12, 4, 0.9, 0.1];
  const VAR = [['', 1], ['✨ Golden', 2.5], ['🌈 Rainbow', 6]];
  const MAX_PETS = 60;

  /* ---------------- the zones ---------------- */
  const ZONES = [
    { n: 'Grassy Meadow', e: '🌳', g: 0x7ccf4a, sky: ['#6ec3ff', '#e6f6ff'], cost: 0, mult: 1, egg: 'Meadow Egg', eggE: '🥚', price: 100, pow: 3 },
    { n: 'Sunny Beach', e: '🏖️', g: 0xf2d38a, sky: ['#38bdf8', '#fef9c3'], cost: 1500, mult: 9, egg: 'Beach Egg', eggE: '🐚', price: 1200, pow: 24 },
    { n: 'Snowy Peaks', e: '🏔️', g: 0xf1f5f9, sky: ['#93c5fd', '#f8fafc'], cost: 15000, mult: 80, egg: 'Snow Egg', eggE: '❄️', price: 11000, pow: 200 },
    { n: 'Lava Land', e: '🌋', g: 0x4a2c2a, sky: ['#7f1d1d', '#fb923c'], cost: 130000, mult: 700, egg: 'Lava Egg', eggE: '🔥', price: 95000, pow: 1700 },
    { n: 'Candy World', e: '🍭', g: 0xf9a8d4, sky: ['#f472b6', '#fde7f3'], cost: 1100000, mult: 6000, egg: 'Candy Egg', eggE: '🍬', price: 800000, pow: 15000 },
    { n: 'Outer Space', e: '🪐', g: 0x312e81, sky: ['#0b0a2a', '#4c1d95'], cost: 9000000, mult: 50000, egg: 'Space Egg', eggE: '🌌', price: 7000000, pow: 125000 },
  ];
  const ZC = (k) => -30 - 75 * k; // a zone's middle (along -z); each is 70 across
  const zoneAt = (z) => (z > 7 ? -1 : clamp(Math.floor((5 - z) / 75), 0, ZONES.length - 1));
  // pets: name, shape, colours, rarity (index in its egg = rarity)
  const SPECIES = [
    ['Doggy', 'quad', 0xa16207, 0x713f12, 'flop'], ['Kitty', 'quad', 0xf97316, 0xffedd5, 'point'], ['Bunny', 'quad', 0xf5f5f5, 0xf9a8d4, 'long'], ['Piggy', 'quad', 0xf9a8d4, 0xec4899, 'round'], ['Fox', 'quad', 0xea580c, 0xffffff, 'point'], ['Unicorn', 'quad', 0xffffff, 0xfde047, 'horn'],
    ['Seal', 'blob', 0x9ca3af, 0x4b5563], ['Turtle', 'quad', 0x16a34a, 0x854d0e, 'shell'], ['Crab', 'quad', 0xdc2626, 0xfca5a5, 'claws'], ['Parrot', 'bird', 0xef4444, 0x22c55e], ['Dolphin', 'blob', 0x60a5fa, 0xe0f2fe], ['Kraken', 'slime', 0x7c3aed, 0xc4b5fd],
    ['Penguin', 'bird', 0x1f2937, 0xffffff], ['Polar Bear', 'quad', 0xf8fafc, 0x94a3b8, 'round'], ['Arctic Fox', 'quad', 0xe2e8f0, 0x93c5fd, 'point'], ['Snow Owl', 'bird', 0xf1f5f9, 0xfacc15], ['Yeti', 'quad', 0xe0f2fe, 0x38bdf8, 'round'], ['Ice Dragon', 'dragon', 0x7dd3fc, 0xe0f2fe],
    ['Fire Cat', 'quad', 0xdc2626, 0xfbbf24, 'point'], ['Magma Slime', 'slime', 0xf97316, 0xfde047], ['Lava Bat', 'bird', 0x450a0a, 0xf97316], ['Hellhound', 'quad', 0x1c1917, 0xef4444, 'point'], ['Phoenix', 'bird', 0xf59e0b, 0xef4444], ['Fire Dragon', 'dragon', 0xb91c1c, 0xfbbf24],
    ['Gummy Bear', 'quad', 0xf43f5e, 0xfda4af, 'round'], ['Candy Slime', 'slime', 0xec4899, 0xa5f3fc], ['Cupcake Cat', 'quad', 0xfbcfe8, 0x8b5cf6, 'point'], ['Lollipop Owl', 'bird', 0xa78bfa, 0xfde047], ['Cotton Unicorn', 'quad', 0xfce7f3, 0x67e8f9, 'horn'], ['Candy Dragon', 'dragon', 0xf472b6, 0x5eead4],
    ['Alien', 'slime', 0x22c55e, 0xbbf7d0], ['Robot', 'robot', 0x9ca3af, 0x22d3ee], ['Space Dog', 'quad', 0xe5e7eb, 0x6366f1, 'flop'], ['Star Owl', 'bird', 0x312e81, 0xfde047], ['Galaxy Unicorn', 'quad', 0x4c1d95, 0xf0abfc, 'horn'], ['Cosmic Dragon', 'dragon', 0x1e1b4b, 0xa855f7],
  ];
  const eggOf = (sp) => Math.floor(sp / 6), rarOf = (sp) => sp % 6;
  const power = (sp, v) => ZONES[eggOf(sp)].pow * RAR[rarOf(sp)][2] * VAR[v || 0][1];
  const FLY = { bird: 1, dragon: 1, robot: 1 };
  const UPG = {
    slots: { n: '🐾 Pet slots', d: 'Equip one more pet', max: 5, cost: (l) => [15, 40, 100, 250, 600][l], cur: 'g' },
    dmg: { n: '⚔️ Pet strength', d: '+15% damage', max: 10, cost: (l) => Math.round(5 * 1.6 ** l), cur: 'g' },
    coin: { n: '💰 More coins', d: '+20% coins', max: 10, cost: (l) => Math.round(300 * 3 ** l), cur: 'c' },
    speed: { n: '👟 Walk speed', d: '+10% speed', max: 5, cost: (l) => Math.round(200 * 4 ** l), cur: 'c' },
    luck: { n: '🍀 Lucky hatch', d: 'Better odds of rare pets', max: 5, cost: (l) => Math.round(20 * 2 ** l), cur: 'g' },
    triple: { n: '🥚🥚🥚 Triple hatch', d: 'Open 3 eggs at once', max: 1, cost: () => 60, cur: 'g' },
  };
  // what you can break: hp and coins before the zone's multiplier
  const KINDS = {
    pile: { n: 'Coins', hp: 12, v: 5, gem: 0, resp: 12 },
    crate: { n: 'Crate', hp: 60, v: 30, gem: 0, resp: 20 },
    present: { n: 'Present', hp: 70, v: 45, gem: 0, resp: 20 },
    crystal: { n: 'Crystal', hp: 90, v: 20, gem: 1, resp: 25 },
    chest: { n: 'Chest', hp: 900, v: 900, gem: 8, resp: 60 },
    giant: { n: 'Giant Chest', hp: 7000, v: 9000, gem: 40, resp: 180 },
  };

  /* ---------------- pet models ---------------- */
  const rainbowMat = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0x220022 });
  const goldMat = new THREE.MeshLambertMaterial({ color: 0xfacc15, emissive: 0x4a3300 });
  function petMesh(sp, v) {
    const [, shape, c1, c2, ex] = SPECIES[sp], g = new THREE.Group();
    const lam = (c) => (v === 1 ? goldMat : v === 2 ? rainbowMat : new THREE.MeshLambertMaterial({ color: c }));
    const box = (c, sx, sy, sz, x, y, z) => { const o = new THREE.Mesh(BOX, typeof c === 'object' ? c : lam(c)); o.scale.set(sx, sy, sz); o.position.set(x, y, z); g.add(o); return o; };
    const dark = (sx, sy, sz, x, y, z) => box(new THREE.MeshBasicMaterial({ color: 0x111111 }), sx, sy, sz, x, y, z);
    const eyes = (y, z, w) => { dark(0.14, 0.16, 0.05, -w, y, z); dark(0.14, 0.16, 0.05, w, y, z); };
    const cone = (c, r, h, x, y, z, rx) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), lam(c)); m.position.set(x, y, z); if (rx) m.rotation.x = rx; g.add(m); return m; };
    const wings = (c, y, w) => { for (const s of [-1, 1]) { const o = box(c, w, 0.08, 0.7, s * (0.45 + w / 2), y, 0.05); o.userData.wing = s; } };
    if (shape === 'quad' || shape === 'dragon') {
      box(c1, 1, 0.75, 1.3, 0, 0.8, 0); box(c1, 0.85, 0.8, 0.8, 0, 1.35, -0.8);
      for (const [x, z] of [[-0.3, -0.45], [0.3, -0.45], [-0.3, 0.45], [0.3, 0.45]]) box(c1, 0.24, 0.5, 0.24, x, 0.25, z);
      eyes(1.45, -1.21, 0.2); box(c2, 0.3, 0.18, 0.06, 0, 1.22, -1.22);
      box(c1, 0.16, 0.16, 0.6, 0, 1.05, 0.85).rotation.x = -0.6;
      if (ex === 'flop') { box(c2, 0.2, 0.5, 0.26, -0.45, 1.55, -0.75); box(c2, 0.2, 0.5, 0.26, 0.45, 1.55, -0.75); }
      if (ex === 'point') { cone(c2, 0.17, 0.4, -0.27, 1.92, -0.8); cone(c2, 0.17, 0.4, 0.27, 1.92, -0.8); }
      if (ex === 'long') { box(c1, 0.18, 0.95, 0.16, -0.2, 2.15, -0.75); box(c1, 0.18, 0.95, 0.16, 0.2, 2.15, -0.75); box(c2, 0.09, 0.62, 0.02, -0.2, 2.15, -0.84); box(c2, 0.09, 0.62, 0.02, 0.2, 2.15, -0.84); }
      if (ex === 'round') { box(c1, 0.26, 0.26, 0.15, -0.33, 1.85, -0.72); box(c1, 0.26, 0.26, 0.15, 0.33, 1.85, -0.72); }
      if (ex === 'horn') { cone(0xfde047, 0.1, 0.62, 0, 2.05, -1.05, -0.5); [0xef4444, 0xf59e0b, 0x22c55e, 0x3b82f6, 0xa855f7].forEach((c, i) => box(v ? c2 : c, 0.12, 0.5, 0.18, 0, 1.75 - i * 0.08, -0.45 + i * 0.16)); }
      if (ex === 'shell') box(c2, 1.15, 0.45, 1.3, 0, 1.3, 0.05);
      if (ex === 'claws') { box(c1, 0.35, 0.3, 0.35, -0.7, 0.85, -0.7); box(c1, 0.35, 0.3, 0.35, 0.7, 0.85, -0.7); }
      if (shape === 'dragon') { wings(c2, 1.25, 1.2); cone(c2, 0.09, 0.35, -0.22, 1.9, -0.7); cone(c2, 0.09, 0.35, 0.22, 1.9, -0.7); for (let i = 0; i < 3; i++) cone(c2, 0.1, 0.3, 0, 1.25, -0.3 + i * 0.35); }
    } else if (shape === 'bird') {
      box(c1, 0.95, 1.05, 0.95, 0, 1.0, 0); box(c2, 0.7, 0.6, 0.06, 0, 0.9, -0.49);
      eyes(1.25, -0.49, 0.2); cone(0xf59e0b, 0.12, 0.35, 0, 1.08, -0.62, -Math.PI / 2);
      wings(c1, 1.05, 0.55); box(0xf59e0b, 0.12, 0.3, 0.12, -0.2, 0.35, 0); box(0xf59e0b, 0.12, 0.3, 0.12, 0.2, 0.35, 0);
    } else if (shape === 'blob' || shape === 'slime') {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.75, 14, 10), v ? lam(c1) : new THREE.MeshLambertMaterial({ color: c1, transparent: shape === 'slime', opacity: shape === 'slime' ? 0.85 : 1 }));
      m.scale.set(1, shape === 'slime' ? 0.8 : 0.85, shape === 'blob' ? 1.35 : 1); m.position.y = 0.65; g.add(m);
      eyes(0.85, shape === 'blob' ? -0.95 : -0.7, 0.24);
      if (shape === 'blob') { box(c2, 0.6, 0.12, 0.4, -0.55, 0.3, -0.2); box(c2, 0.6, 0.12, 0.4, 0.55, 0.3, -0.2); box(c2, 0.5, 0.3, 0.1, 0, 0.75, 1.0); }
      if (sp === 30) { box(0x111111, 0.06, 0.45, 0.06, -0.25, 1.35, 0); box(0x111111, 0.06, 0.45, 0.06, 0.25, 1.35, 0); box(c2, 0.16, 0.16, 0.16, -0.25, 1.6, 0); box(c2, 0.16, 0.16, 0.16, 0.25, 1.6, 0); }
      if (sp === 11) for (let i = 0; i < 4; i++) box(c2, 0.14, 0.5, 0.14, -0.45 + i * 0.3, 0.15, 0.3);
    } else if (shape === 'robot') {
      box(c1, 1, 1, 1, 0, 1, 0); box(new THREE.MeshBasicMaterial({ color: c2 }), 0.7, 0.28, 0.04, 0, 1.12, -0.51); box(0x4b5563, 0.08, 0.5, 0.08, 0, 1.75, 0);
      box(new THREE.MeshBasicMaterial({ color: 0xef4444 }), 0.18, 0.18, 0.18, 0, 2.05, 0); wings(0x6b7280, 1.0, 0.4);
    }
    const s = 0.75 + rarOf(sp) * 0.07 + (v ? 0.08 : 0);
    g.scale.setScalar(s);
    return g;
  }
  const portrait = (sp, v) => snapshot(`ps-${sp}-${v || 0}`, () => petMesh(sp, v || 0), { w: 140, h: 140, dir: [0.7, 0.35, -1] });

  /* ---------------- the experience ---------------- */
  const PS = {
    id: 'pets', code: 'ps', genre: 'Simulator', rank: 0.6, name: 'Pet Simulator', emoji: '🐾', max: 12, stat: 'Coins', killY: -30,
    land: { theme: 'meadow', fence: 'none', floor: true, under: ZONES.map((Z, k) => [-35, ZC(k) - 35, 35, ZC(k) + 35]).concat([[-35, 10, 35, 60]]), bands: ZONES.map((Z, k) => [k === ZONES.length - 1 ? -1e9 : ZC(k) - 37.5, k ? ZC(k) + 37.5 : 1e9, ['meadow', 'beach', 'snow', 'volcano', 'candy', 'space'][k]]) }, // the land changes with the zones
    color: 'linear-gradient(135deg,#22c55e,#a855f7)',
    desc: 'Your pets break coins, crates, crystals and chests for you. Hatch eggs for stronger pets (Common to Mythical), unlock six zones from the Meadow to Outer Space, make pets Golden and Rainbow, and buy upgrades. Everything you collect is saved.',
    welcome: 'Click coins and chests — your pets break them!',
    welcomeTouch: 'Tap coins and chests — your pets break them!',
    build() {
      sky(ZONES[0].sky[0], ZONES[0].sky[1]);
      this.brk = []; this.gates = []; this.orbs = []; this.zoneSky = -2;
      // the hub
      slab(0, 0, 35, 70, 50, 0xd1d5db, { sy: 2 });
      const sg = label('PET SIMULATOR', { size: 3.4, color: '#fef08a' }); sg.position.set(0, 13, 58); place.add(sg);
      this.machines = [
        { x: -22, z: 42, e: '⬆️', n: 'Upgrades', c: 0x2563eb, fn: () => this.upgrades() },
        { x: 22, z: 42, e: '✨', n: 'Golden Machine', c: 0xf59e0b, fn: () => this.machine(1) },
        { x: 22, z: 26, e: '🌈', n: 'Rainbow Machine', c: 0xa855f7, fn: () => this.machine(2) },
        { x: -22, z: 26, e: '🗺️', n: 'Teleport', c: 0x0d9488, fn: () => this.teleports() },
      ];
      for (const m of this.machines) {
        part({ x: m.x, y: 2.5, z: m.z, sx: 6, sy: 5, sz: 4, c: m.c });
        part({ x: m.x, y: 5.4, z: m.z, sx: 6.4, sy: 0.8, sz: 4.4, c: 0xffffff, neon: true });
        const l = label(`${m.e} ${m.n}`, { size: 1.15 }); l.position.set(m.x, 7.6, m.z); place.add(l);
      }
      // the zones, each with a wall and a gate before it
      ZONES.forEach((Z, k) => {
        const cz = ZC(k), r = mulberry(1000 + k);
        slab(0, 0, cz, 70, 70, Z.g, { sy: 2 });
        // the fence round the sides
        for (const s of [-1, 1]) part({ x: s * 35.5, y: 3, z: cz, sx: 1, sy: 6, sz: 76, c: 0x64748b, alpha: 0.35, plain: true });
        // the gate in front of it (open for the first)
        const gz = cz + 37.5;
        slab(0, 0, gz, 70, 5, 0x9ca3af, { sy: 2 });
        part({ x: -21, y: 4, z: gz, sx: 28, sy: 8, sz: 1.5, c: 0x475569 }); part({ x: 21, y: 4, z: gz, sx: 28, sy: 8, sz: 1.5, c: 0x475569 });
        part({ x: 0, y: 8.75, z: gz, sx: 14, sy: 1.5, sz: 1.5, c: 0x475569 });
        const zl = label(`${Z.e} ${Z.n}`, { size: 2 }); zl.position.set(0, 12, gz); place.add(zl);
        if (k > 0) {
          const bar = part({ x: 0, y: 4, z: gz, sx: 14, sy: 8, sz: 1, c: 0x60a5fa, alpha: 0.55, plain: true, gate: k });
          const gl = label(`🔒 ${short(Z.cost)} coins`, { size: 1.3, bg: 'rgba(15,23,42,.85)' }); gl.position.set(0, 5, gz + 1); place.add(gl);
          this.gates.push({ k, bar, gl, z: gz });
        }
        // the egg stand
        part({ x: -26, y: 1, z: cz + 26, sx: 6, sy: 2, sz: 6, c: 0xfef3c7 });
        const eg = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 12), new THREE.MeshLambertMaterial({ color: Z.g === 0xf1f5f9 ? 0xbae6fd : Z.g }));
        eg.scale.y = 1.3; eg.position.set(-26, 4.3, cz + 26); place.add(eg);
        const el = label(`${Z.eggE} ${Z.egg}\n${short(Z.price)} coins`, { size: 1.2 }); el.position.set(-26, 8.6, cz + 26); place.add(el);
        this.decor(k, cz, r);
        // what to break
        const spots = [];
        const free = (x, z, d) => Math.abs(x + 26) + Math.abs(z - cz - 26) > 10 && spots.every((s) => Math.hypot(s[0] - x, s[1] - z) > d);
        spots.push([0, cz]); this.addBrk('giant', 0, cz, k);
        for (const [kind, n] of [['chest', 2], ['crystal', 3], [k === 4 || k === 2 ? 'present' : 'crate', 5], ['pile', 14]]) {
          for (let i = 0; i < n; i++) for (let tries = 0; tries < 40; tries++) { const x = (r() - 0.5) * 60, z = cz + (r() - 0.5) * 60; if (free(x, z, 6)) { spots.push([x, z]); this.addBrk(kind, x, z, k); break; } }
        }
      });
    },
    decor(k, cz, r) {
      for (let i = 0; i < 9; i++) {
        const x = (r() < 0.5 ? -1 : 1) * (26 + r() * 7), z = cz + (r() - 0.5) * 62;
        const j = (i % 4) * 0.05, up = (o) => Object.assign(o, { y: o.y + j / 2, sy: o.sy + j }); // a little taller or shorter each, so ones that overlap don't share a top (it flickered)
        if (k === 0) { part({ x, y: 2.5, z, sx: 1.2, sy: 5, sz: 1.2, c: 0x7c4a1e }); part(up({ x, y: 6, z, sx: 5, sy: 4, sz: 5, c: 0x2f9e44 })); }
        if (k === 1) { part({ x, y: 4, z, sx: 1, sy: 8, sz: 1, c: 0xa16207 }); for (const [a, b] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) part({ x: x + a, y: 8 + j + (a ? 0.02 : 0), z: z + b, sx: a ? 4 : 1, sy: 0.4, sz: b ? 4 : 1, c: 0x16a34a }); }
        if (k === 2) { for (let n = 0; n < 3; n++) part(up({ x, y: 1.5 + n * 2.5, z, sx: 5 - n * 1.5, sy: 2.5, sz: 5 - n * 1.5, c: 0x166534 })); part({ x, y: 9.2 + j, z, sx: 1.2, sy: 1.2, sz: 1.2, c: 0xffffff }); }
        if (k === 3) { part({ x, y: 0.12, z, sx: 6, sy: 0.25, sz: 6, c: 0xff6a00, neon: true, solid: false }); part(up({ x: x + 3, y: 1.5, z: z + 2, sx: 3, sy: 3, sz: 3, c: 0x292524 })); }
        if (k === 4) { part({ x, y: 4, z, sx: 0.8, sy: 8, sz: 0.8, c: 0xffffff, stripes: '#ef4444' }); part({ x, y: 8.6, z, sx: 3, sy: 3, sz: 0.6, c: [0xf472b6, 0x22d3ee, 0xfde047][i % 3] }); }
        if (k === 5) { const m = new THREE.Mesh(new THREE.SphereGeometry(1.5 + r() * 2.5, 16, 12), new THREE.MeshLambertMaterial({ color: [0xa855f7, 0x38bdf8, 0xf97316, 0xfde047][i % 4] })); m.position.set(x, 9 + r() * 10, z); place.add(m); }
      }
    },
    addBrk(kind, x, z, k) {
      const K = KINDS[kind], Z = ZONES[k], g = new THREE.Group(), lam = (c) => new THREE.MeshLambertMaterial({ color: c });
      const add = (geo, c, sx, sy, sz, px, py, pz) => { const m = new THREE.Mesh(geo, typeof c === 'object' ? c : lam(c)); m.scale.set(sx, sy, sz); m.position.set(px, py, pz); g.add(m); return m; };
      let size = 1;
      if (kind === 'pile') { const cy = new THREE.CylinderGeometry(0.7, 0.7, 0.25, 14); for (let i = 0; i < 5; i++) add(cy, 0xfacc15, 1, 1, 1, (i % 3 - 1) * 0.5, 0.15 + Math.floor(i / 3) * 0.28, (i % 2 - 0.5) * 0.4); size = 1.6; }
      if (kind === 'crate') { add(BOX, k === 1 ? 0xb45309 : 0x92400e, 2.4, 2.4, 2.4, 0, 1.2, 0); add(BOX, 0x78350f, 2.5, 0.4, 2.5, 0, 1.2, 0); size = 2.6; }
      if (kind === 'present') { const c = [0xef4444, 0x22c55e, 0x3b82f6, 0xa855f7][Math.floor(Math.random() * 4)]; add(BOX, c, 2.2, 2.2, 2.2, 0, 1.1, 0); add(BOX, 0xfde047, 2.3, 2.3, 0.4, 0, 1.1, 0); add(BOX, 0xfde047, 0.4, 2.3, 2.3, 0, 1.1, 0); size = 2.4; }
      if (kind === 'crystal') { const m = add(new THREE.OctahedronGeometry(1.2, 0), new THREE.MeshLambertMaterial({ color: [0x22d3ee, 0x67e8f9, 0xa5f3fc, 0xf97316, 0xf0abfc, 0xc084fc][k], emissive: 0x0a2a33 }), 1, 1.6, 1, 0, 1.9, 0); m.rotation.y = Math.random(); size = 2.2; }
      if (kind === 'chest' || kind === 'giant') { const s = kind === 'giant' ? 2.4 : 1; add(BOX, 0x7c2d12, 3 * s, 2 * s, 2 * s, 0, 1 * s, 0); add(BOX, 0x9a3412, 3.1 * s, 0.9 * s, 2.1 * s, 0, 2.3 * s, 0); add(BOX, 0xfacc15, 0.5 * s, 0.7 * s, 0.2 * s, 0, 1.7 * s, -1.05 * s); add(BOX, 0xfacc15, 3.15 * s, 0.25 * s, 2.15 * s, 0, 1.9 * s, 0); size = 3.2 * s; }
      g.position.set(x, 0.1, z); place.add(g);
      const hp = K.hp * Z.mult;
      const b = { kind, x, z, k, g, size, max: hp, hp, v: K.v * Z.mult, gem: K.gem * (k + 1), alive: true, back: 0 };
      g.traverse((m) => { m.userData.brk = b; });
      this.brk.push(b);
    },
    pres() { return { pt: '', tg: 0, cc: 0, pz: -1 }; },
    async enter() {
      const s = await kvGet('ps');
      const D = { c: 0, g: 0, pets: [[0, 0], [1, 0]], eq: [0, 1], z: 1, up: {}, eggs: 0, broke: 0 };
      this.S = Object.assign(D, s && typeof s === 'object' ? s : {});
      const S = this.S;
      S.pets = (Array.isArray(S.pets) ? S.pets : []).filter((p) => Array.isArray(p) && SPECIES[p[0]]).slice(0, MAX_PETS).map((p) => [p[0] | 0, clamp(p[1] | 0, 0, 2)]);
      if (!S.pets.length) S.pets = [[0, 0], [1, 0]];
      S.up = Object.assign({ slots: 0, dmg: 0, coin: 0, speed: 0, luck: 0, triple: 0 }, S.up || {});
      S.z = clamp(S.z | 0 || 1, 1, ZONES.length); S.c = Math.max(0, +S.c || 0); S.g = Math.max(0, +S.g || 0);
      questMax('pets.zone', S.z - 1);
      S.eq = (Array.isArray(S.eq) ? S.eq : []).filter((i) => S.pets[i]).slice(0, this.slots());
      this.myPets = []; this.others = new Map(); this.target = null; this.auto = S.auto !== false; this.dirty = false;
      for (const gt of this.gates) if (gt.k < S.z) this.openGate(gt, true);
      this.syncPets();
      this.send();
      this.drawBar();
    },
    leave() { this.save(); for (const o of this.orbs) { scene.remove(o.m); } this.orbs = []; this.clearPetMeshes(); this.hatchClose(); },
    save() { this.dirty = false; this.S.auto = this.auto; return kvSet('ps', this.S); },
    slots() { return 3 + (this.S.up.slots | 0) + (hasItem('slot') ? 1 : 0); },
    send() { send({ pt: this.S.eq.map((i) => this.S.pets[i].join('.')).join(','), cc: Math.floor(this.S.c), pz: zoneAt(P.z) }); },
    spawn() { return [0, 0.6, 45, 0]; },
    speed() { return 16 * (1 + 0.1 * (this.S ? this.S.up.speed : 0)); },

    /* ---- your pets ---- */
    clearPetMeshes() { for (const p of this.myPets || []) scene.remove(p.g); this.myPets = []; for (const o of (this.others || new Map()).values()) for (const p of o.pets) scene.remove(p.g); this.others = new Map(); },
    syncPets() {
      for (const p of this.myPets) scene.remove(p.g);
      this.myPets = this.S.eq.map((i, n) => { const [sp, v] = this.S.pets[i], g = petMesh(sp, v); g.position.set(P.x, P.y, P.z); scene.add(g); return { sp, v, g, walk: Math.random() * 6, n, pw: power(sp, v) }; });
    },
    movePet(pt, tx, tz, ty, dt, fly, attack) {
      const g = pt.g, dx = tx - g.position.x, dz = tz - g.position.z, d = Math.hypot(dx, dz), sp = Math.min(d, 34 * dt);
      if (d > 60) g.position.set(tx, ty, tz);
      else if (d > 0.05) { g.position.x += (dx / d) * sp; g.position.z += (dz / d) * sp; }
      pt.walk += dt * (d > 0.3 ? 12 : attack ? 16 : 3);
      const hop = attack ? Math.abs(Math.sin(pt.walk)) * 0.8 : Math.abs(Math.sin(pt.walk)) * (d > 0.3 ? 0.4 : 0.05);
      const y = ty + (fly ? 2.6 + Math.sin(pt.walk * 0.4) * 0.3 : hop);
      g.position.y += (y - g.position.y) * Math.min(1, dt * 10);
      const face = attack ? Math.atan2(-(attack[0] - g.position.x), -(attack[1] - g.position.z)) : d > 0.3 ? Math.atan2(-dx, -dz) : null;
      if (face != null) { let a = face - g.rotation.y; while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; g.rotation.y += a * Math.min(1, dt * 10); }
      for (const ch of g.children) if (ch.userData.wing) ch.rotation.z = ch.userData.wing * Math.sin(pt.walk * 2) * 0.6;
    },
    // where pet n of m stands: in an arc behind you, or round what it's breaking
    slot(n, m, cx, cz, yaw, around, r) {
      if (around) { const a = (n / m) * Math.PI * 2 + 0.4; return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; }
      const a = yaw + Math.PI + (m > 1 ? (n / (m - 1) - 0.5) * 2.2 : 0), rr = 3.2 + (n % 2) * 1.6;
      return [cx - Math.sin(a) * rr, cz - Math.cos(a) * rr];
    },
    tick(dt) {
      if (!this.S) return;
      const S = this.S, T = performance.now() / 1000;
      rainbowMat.color.setHSL((T * 0.25) % 1, 0.85, 0.6);
      const zone = zoneAt(P.z);
      if (zone !== this.zoneSky) { this.zoneSky = zone; const Z = ZONES[Math.max(0, zone)]; sky(Z.sky[0], Z.sky[1]); this.send(); }
      // breakables come back
      const now = performance.now();
      for (const b of this.brk) if (!b.alive && now > b.back) { b.alive = true; b.hp = b.max; b.g.visible = true; b.g.scale.setScalar(0.2); }
      for (const b of this.brk) if (b.alive && b.g.scale.x < 1) b.g.scale.setScalar(Math.min(1, b.g.scale.x + dt * 3));
      // pick something to break
      if (this.target && (!this.target.alive || this.target.k >= S.z || Math.hypot(this.target.x - P.x, this.target.z - P.z) > 70)) this.target = null;
      if (!this.target && this.auto && this.myPets.length && now - (this.autoAt || 0) > 400) {
        this.autoAt = now;
        // whatever your pets can break soonest, counting the walk there
        const dps = Math.max(1, this.myPets.reduce((t, p) => t + p.pw, 0) * (1 + 0.15 * S.up.dmg));
        let best = null, bs = Infinity;
        for (const b of this.brk) {
          if (!b.alive || b.k >= S.z || b.kind === 'giant') continue;
          const d = Math.hypot(b.x - P.x, b.z - P.z);
          if (d > 34) continue;
          const score = b.hp / dps + d / 25;
          if (score < bs) { bs = score; best = b; }
        }
        if (best) this.setTarget(best, true);
      }
      // the pets
      const tg = this.target, n = this.myPets.length;
      let dps = 0;
      this.myPets.forEach((pt, i) => {
        const fly = FLY[SPECIES[pt.sp][1]];
        if (tg) {
          const [x, z] = this.slot(i, n, tg.x, tg.z, 0, true, tg.size * 0.75 + 1);
          this.movePet(pt, x, z, 0.1, dt, fly, [tg.x, tg.z]);
          if (Math.hypot(pt.g.position.x - x, pt.g.position.z - z) < 1.5) dps += pt.pw;
        } else { const [x, z] = this.slot(i, n, P.x, P.z, P.yaw, false); this.movePet(pt, x, z, P.y, dt, fly, null); }
      });
      if (tg && dps) {
        tg.hp -= dps * (1 + 0.15 * S.up.dmg) * dt;
        tg.g.rotation.y = Math.sin(T * 30) * 0.06;
        if (now - (this.hitAt || 0) > 260) { this.hitAt = now; sfx3('hit', tg.x, tg.z, 40, { vol: 0.35, pitch: 1 + Math.random() * 0.3 }); }
        if (tg.hp <= 0) this.breakIt(tg);
      }
      // coins flying to you
      for (let i = this.orbs.length - 1; i >= 0; i--) {
        const o = this.orbs[i]; o.t += dt;
        if (o.t < 0.45) { o.m.position.addScaledVector(o.v, dt); o.v.y -= 30 * dt; }
        else { const p = new THREE.Vector3(P.x, P.y + 2.5, P.z), d = p.clone().sub(o.m.position), l = d.length(); if (l < 1.2) { this.collect(o); scene.remove(o.m); this.orbs.splice(i, 1); continue; } o.m.position.addScaledVector(d.normalize(), Math.min(l, (30 + o.t * 40) * dt)); }
      }
      // the health bar over what's being broken
      this.drawHp();
      this.drawOthers(dt);
      if (this.dirty && now - (this.savedAt || 0) > 8000) { this.savedAt = now; this.save(); this.send(); }
    },
    setTarget(b, quiet) {
      if (!b || !b.alive) return;
      if (b.k >= this.S.z) { toast(`🔒 Unlock ${ZONES[b.k].n} first`, '#fca5a5'); return; }
      this.target = b;
      send({ tg: [Math.round(b.x), Math.round(b.z)] });
      if (!quiet) sfx('select');
    },
    breakIt(b) {
      b.alive = false; b.g.visible = false; b.back = performance.now() + KINDS[b.kind].resp * 1000;
      if (this.target === b) { this.target = null; send({ tg: 0 }); }
      const coins = b.v * (1 + 0.2 * this.S.up.coin) * (hasItem('coins2') ? 2 : 1), n = b.kind === 'giant' ? 24 : b.kind === 'chest' ? 14 : b.kind === 'pile' ? 4 : 7;
      for (let i = 0; i < n; i++) this.orb(b, 'c', coins / n);
      if (b.gem) for (let i = 0; i < Math.min(8, b.gem); i++) this.orb(b, 'g', b.gem / Math.min(8, b.gem));
      puffAt(b.x, 1.5, b.z, b.kind === 'crystal' ? [0x67e8f9, 0xffffff] : [0xfacc15, 0x92400e], 8);
      sfx3(b.kind === 'chest' || b.kind === 'giant' ? 'break' : b.kind === 'crystal' ? 'crunch' : 'pop', b.x, b.z, 50);
      this.S.broke = (this.S.broke | 0) + 1;
      if (b.kind === 'giant') { toast(`💥 Giant Chest broken! +${short(coins)}`, '#fde68a'); earn(5, 'broke a Giant Chest'); }
      if (this.S.broke % 100 === 0) earn(5, `broke ${this.S.broke} things`);
    },
    orb(b, cur, val) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(cur === 'g' ? 0.35 : 0.3, 8, 6), new THREE.MeshBasicMaterial({ color: cur === 'g' ? 0x22d3ee : 0xfacc15 }));
      m.position.set(b.x, 1.5, b.z); scene.add(m);
      this.orbs.push({ m, cur, val, t: 0, v: new THREE.Vector3((Math.random() - 0.5) * 14, 8 + Math.random() * 8, (Math.random() - 0.5) * 14) });
    },
    collect(o) {
      if (o.cur === 'g') this.S.g += o.val; else this.S.c += o.val;
      this.dirty = true;
      if (performance.now() - (this.coinSnd || 0) > 90) { this.coinSnd = performance.now(); sfx('coin', { vol: 0.35, pitch: o.cur === 'g' ? 1.5 : 1 }); }
      m_dispose(o.m);
    },
    drawHp() {
      const tg = this.target;
      if (!tg) { if (this.hpBar) this.hpBar.visible = false; return; }
      if (!this.hpBar) {
        const g = new THREE.Group();
        const bg = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: 0x111827 })); bg.scale.set(4.2, 0.55, 0.05); g.add(bg);
        const fg = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: 0x22c55e })); fg.scale.set(4, 0.38, 0.06); fg.position.z = 0.04; g.add(fg); // (in front: the bar turns to face the camera)
        g.userData.fg = fg; this.hpBar = g; scene.add(g);
      }
      const g = this.hpBar, f = clamp(tg.hp / tg.max, 0, 1), fg = g.userData.fg;
      g.visible = true; g.position.set(tg.x, tg.size + 2.3, tg.z); g.quaternion.copy(camera.quaternion);
      fg.scale.x = 4 * f; fg.position.x = -2 * (1 - f); fg.material.color.setHex(f > 0.5 ? 0x22c55e : f > 0.2 ? 0xf59e0b : 0xef4444);
    },
    // other people's pets: following them, or round what they're breaking
    drawOthers(dt) {
      const seen = new Set();
      for (const p of Net.peers) {
        if (p.isMe || !p.presence) continue;
        const a = Net.avatars.get(p.peer); if (!a) continue;
        seen.add(p.peer);
        const key = String(p.presence.pt || '');
        let o = this.others.get(p.peer);
        if (!o || o.key !== key) {
          if (o) for (const pt of o.pets) scene.remove(pt.g);
          const list = key ? key.split(',').slice(0, 8).map((s) => s.split('.').map(Number)).filter((x) => SPECIES[x[0]]) : [];
          o = { key, pets: list.map(([sp, v], n) => { const g = petMesh(sp, clamp(v | 0, 0, 2)); g.position.copy(a.g.position); scene.add(g); return { sp, g, walk: Math.random() * 6, n }; }) };
          this.others.set(p.peer, o);
        }
        const tg = Array.isArray(p.presence.tg) ? p.presence.tg : null, n = o.pets.length, ap = a.g.position;
        o.pets.forEach((pt, i) => {
          const fly = FLY[SPECIES[pt.sp][1]];
          if (tg && Math.hypot(tg[0] - ap.x, tg[1] - ap.z) < 60) { const [x, z] = this.slot(i, n, tg[0], tg[1], 0, true, 2.5); this.movePet(pt, x, z, 0.1, dt, fly, tg); }
          else { const [x, z] = this.slot(i, n, ap.x, ap.z, a.g.rotation.y, false); this.movePet(pt, x, z, ap.y, dt, fly, null); }
        });
      }
      for (const [peer, o] of this.others) if (!seen.has(peer)) { for (const pt of o.pets) scene.remove(pt.g); this.others.delete(peer); }
    },
    click(e) {
      const hit = pickObjects(e.x, e.y, this.brk.filter((b) => b.alive).map((b) => b.g));
      if (hit && hit.object.userData.brk) this.setTarget(hit.object.userData.brk);
    },
    key(code, down) {
      if (!down) return;
      if (code === 'KeyP') { this.petsPanel(); return true; }
      if (code === 'KeyU') { this.upgrades(); return true; }
      if (code === 'KeyT') { this.teleports(); return true; }
    },
    prompts() {
      const out = this.machines.map((m) => ({ x: m.x, z: m.z + 3, r: 6, text: `${m.e} ${m.n}`, fn: m.fn }));
      ZONES.forEach((Z, k) => { if (k < this.S.z) out.push({ x: -26, z: ZC(k) + 26, r: 6, text: `${Z.eggE} ${Z.egg} (${short(Z.price)} coins)`, fn: () => this.eggPanel(k) }); });
      for (const gt of this.gates) if (gt.k >= this.S.z && gt.k === this.S.z) out.push({ x: 0, z: gt.z + 2, r: 7, text: `🔓 Unlock ${ZONES[gt.k].n} (${short(ZONES[gt.k].cost)} coins)`, fn: () => this.unlock(gt.k) });
      const near = this.brk.find((b) => b.alive && b.k < this.S.z && Math.hypot(b.x - P.x, b.z - P.z) < b.size + 3);
      if (near && near !== this.target) out.push({ x: near.x, z: near.z, r: near.size + 3, text: `🐾 Break the ${KINDS[near.kind].n.toLowerCase()}`, fn: () => this.setTarget(near) });
      return out;
    },
    drawBar() {
      setBar(`<button class="xslot" data-k="pets" title="Pets (P)"><span class="k">P</span><span class="e">🐾</span>Pets<span class="n">${this.S.eq.length}/${this.slots()}</span></button>`
        + `<button class="xslot" data-k="upg" title="Upgrades (U)"><span class="k">U</span><span class="e">⬆️</span>Upgrades</button>`
        + `<button class="xslot" data-k="tp" title="Teleport (T)"><span class="k">T</span><span class="e">🗺️</span>Teleport</button>`
        + `<button class="xslot ${this.auto ? 'on' : ''}" data-k="auto" title="Pets break things near you by themselves"><span class="e">🤖</span>Auto ${this.auto ? 'on' : 'off'}</button>`, (b) => {
        const k = b.dataset.k;
        if (k === 'pets') this.petsPanel();
        if (k === 'upg') this.upgrades();
        if (k === 'tp') this.teleports();
        if (k === 'auto') { this.auto = !this.auto; this.dirty = true; if (!this.auto) { this.target = null; send({ tg: 0 }); } this.drawBar(); }
      });
    },

    /* ---- eggs ---- */
    roll(k) {
      const luck = (1 + 0.25 * this.S.up.luck) * (hasItem('lucky') ? 1.5 : 1), w = CHANCE.map((c, i) => (i >= 2 ? c * luck : c)), tot = w.reduce((a, b) => a + b, 0);
      let x = Math.random() * tot, r = 0;
      while (r < 5 && x >= w[r]) { x -= w[r]; r++; }
      return k * 6 + r;
    },
    eggPanel(k) {
      const Z = ZONES[k], S = this.S, luck = (1 + 0.25 * S.up.luck) * (hasItem('lucky') ? 1.5 : 1), w = CHANCE.map((c, i) => (i >= 2 ? c * luck : c)), tot = w.reduce((a, b) => a + b, 0);
      const odds = [0, 1, 2, 3, 4, 5].map((r) => { const sp = k * 6 + r; return `<div style="--rc:${RAR[r][1]}"><img src="${portrait(sp, 0)}" alt=""><b>${esc(SPECIES[sp][0])}</b><span style="color:${RAR[r][1]}">${RAR[r][0]}</span><br>${(100 * w[r] / tot).toFixed(w[r] / tot < 0.01 ? 2 : 1)}% · ⚔️ ${short(power(sp, 0))}</div>`; }).join('');
      const full = S.pets.length >= MAX_PETS;
      const html = `<div class="xp-row"><span>💰 <b>${short(S.c)}</b></span><span>🐾 <b>${S.pets.length}/${MAX_PETS}</b></span></div><div class="ps-odds">${odds}</div>
        ${full ? '<p class="xp-note">Your pet storage is full. Delete some pets (🐾 Pets) to hatch more.</p>' : ''}
        <div style="display:flex;gap:8px"><button class="xp-btn gold" data-open="1" style="flex:1" ${S.c < Z.price || full ? 'disabled' : ''}>Open 1 · ${short(Z.price)}</button>
        ${S.up.triple ? `<button class="xp-btn purple" data-open="3" style="flex:1" ${S.c < Z.price * 3 || S.pets.length + 3 > MAX_PETS ? 'disabled' : ''}>Open 3 · ${short(Z.price * 3)}</button>` : ''}</div>
        ${S.up.triple ? '' : '<p class="xp-note">Get 🥚🥚🥚 Triple hatch in Upgrades to open 3 at once.</p>'}`;
      openPanel(`${Z.eggE} ${Z.egg}`, html, (btn) => { if (btn.dataset.open) this.hatch(k, +btn.dataset.open); });
    },
    hatch(k, n) {
      const Z = ZONES[k], S = this.S;
      if (S.c < Z.price * n || S.pets.length + n > MAX_PETS) { sfx('error'); return; }
      S.c -= Z.price * n; S.eggs = (S.eggs | 0) + n; this.dirty = true;
      const got = Array.from({ length: n }, () => this.roll(k));
      for (const sp of got) S.pets.push([sp, 0]);
      closePanel();
      // the egg wobbles, then cracks open
      const el = document.createElement('div'); el.id = 'psHatch';
      el.innerHTML = '<div class="egg">🥚</div>';
      $('#xhud').append(el); this.hatchEl = el;
      sfx('magic');
      const best = Math.max(...got.map(rarOf));
      quest('pets.hatch', got.length); if (best >= 4) quest('pets.legend');
      clearTimeout(this.hatchT);
      this.hatchT = setTimeout(() => {
        if (this.hatchEl !== el) return;
        el.innerHTML = `<div class="row">${got.map((sp) => { const r = rarOf(sp); return `<div class="got" style="--rc:${RAR[r][1]}"><img src="${portrait(sp, 0)}" alt=""><b>${esc(SPECIES[sp][0])}</b><span>${RAR[r][0]}</span><small>⚔️ ${short(power(sp, 0))} power</small></div>`; }).join('')}</div><div class="tap">Tap to continue</div>`;
        sfx(best >= 4 ? 'win' : best >= 2 ? 'reward' : 'pop');
        puffAt(P.x, P.y + 4, P.z, best >= 4 ? CONFETTI : [0xffffff, 0xfde047], best >= 4 ? 50 : 16);
        if (best === 5) { earn(50, `hatched a Mythical ${SPECIES[got.find((s) => rarOf(s) === 5)][0]}!`); Net.chat(`🥚 hatched a MYTHICAL ${SPECIES[got.find((s) => rarOf(s) === 5)][0]}!`); }
        else if (best === 4) { earn(15, 'hatched a Legendary pet'); Net.chat(`🥚 hatched a Legendary ${SPECIES[got.find((s) => rarOf(s) === 4)][0]}!`); }
        // a better pet goes straight on if there's room, or replaces the weakest
        got.forEach((sp, j) => this.autoEquip(S.pets.length - got.length + j));
        this.hatchT = setTimeout(() => this.hatchClose(), 4000);
      }, 1300);
      el.onclick = () => { if (el.querySelector('.got')) this.hatchClose(); };
      this.save();
    },
    hatchClose() { clearTimeout(this.hatchT); if (this.hatchEl) { this.hatchEl.remove(); this.hatchEl = null; } },
    autoEquip(i) {
      const S = this.S, pw = (j) => power(...S.pets[j]);
      if (S.eq.includes(i)) return;
      if (S.eq.length < this.slots()) S.eq.push(i);
      else { let w = 0; S.eq.forEach((j, n) => { if (pw(j) < pw(S.eq[w])) w = n; }); if (pw(i) > pw(S.eq[w])) S.eq[w] = i; else return; }
      this.syncPets(); this.send(); this.drawBar(); this.dirty = true;
    },

    /* ---- your pets ---- */
    petsPanel(sort) {
      const S = this.S, order = S.pets.map((p, i) => i).sort((a, b) => (S.eq.includes(b) - S.eq.includes(a)) || power(...S.pets[b]) - power(...S.pets[a]));
      const total = S.eq.reduce((a, i) => a + power(...S.pets[i]), 0) * (1 + 0.15 * S.up.dmg);
      const html = `<div class="xp-row"><span>🐾 <b>${S.eq.length}/${this.slots()}</b> equipped · <b>${S.pets.length}/${MAX_PETS}</b> pets</span><span>⚔️ <b>${short(total)}</b>/s</span></div>
        <div style="display:flex;gap:8px;margin:6px 0"><button class="xp-btn gold" data-best="1" style="flex:1">⭐ Equip best</button><button class="xp-btn alt" data-none="1" style="flex:1">Unequip all</button></div>
        <div class="xp-grid">${order.map((i) => { const [sp, v] = S.pets[i], r = rarOf(sp), on = S.eq.includes(i); return `<div class="xp-card ps-card ${on ? 'on' : ''}" style="border-color:${on ? '' : RAR[r][1] + '55'}">${v ? `<span class="v">${VAR[v][0]}</span>` : ''}<img src="${portrait(sp, v)}" alt=""><b>${esc(SPECIES[sp][0])}</b><span style="color:${RAR[r][1]}">${RAR[r][0]}</span><span class="pw">⚔️ ${short(power(sp, v))}</span>
          <button class="xp-btn ${on ? 'alt' : ''}" data-eq="${i}">${on ? 'Unequip' : 'Equip'}</button>${on ? '' : `<button class="xp-btn red" data-del="${i}" style="padding:5px 8px;font-size:12px">${this.delAsk === i ? 'Sure? Delete' : 'Delete'}</button>`}</div>`; }).join('')}</div>`;
      openPanel('🐾 Your Pets', html, (btn) => {
        if (btn.dataset.best) { const best = S.pets.map((p, i) => i).sort((a, b) => power(...S.pets[b]) - power(...S.pets[a])).slice(0, this.slots()); S.eq = best; }
        else if (btn.dataset.none) S.eq = [];
        else if (btn.dataset.eq != null) { const i = +btn.dataset.eq; if (S.eq.includes(i)) S.eq = S.eq.filter((x) => x !== i); else if (S.eq.length < this.slots()) S.eq.push(i); else { toast(`All ${this.slots()} slots are full`, '#fca5a5'); sfx('error'); return; } }
        else if (btn.dataset.del != null) {
          const i = +btn.dataset.del;
          if (this.delAsk !== i) { this.delAsk = i; this.petsPanel(); return; }
          this.delAsk = null; S.pets.splice(i, 1); S.eq = S.eq.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)); sfx('break');
        }
        this.delAsk = btn.dataset.del != null ? this.delAsk : null;
        this.dirty = true; this.syncPets(); this.send(); this.drawBar(); this.petsPanel(); this.save();
      }, null, { full: true });
    },
    // 5 of the same pet make one Golden; 5 Golden make one Rainbow
    machine(to) {
      const S = this.S, from = to - 1, groups = {};
      S.pets.forEach(([sp, v], i) => { if (v === from) (groups[sp] = groups[sp] || []).push(i); });
      const rows = Object.entries(groups).filter(([, l]) => l.length >= 1).sort((a, b) => power(+b[0], to) - power(+a[0], to));
      const html = `<p class="xp-note">Put in 5 ${from ? 'Golden' : 'normal'} pets of the same kind to get one ${VAR[to][0]} pet (${VAR[to][1] / VAR[from][1]}× as strong as one ${from ? 'Golden' : 'normal'}).</p>`
        + (rows.length ? rows.map(([sp, l]) => `<div class="xp-row"><span class="lft"><img src="${portrait(+sp, from)}" style="width:44px;height:44px" alt=""><span><b>${esc(SPECIES[sp][0])}</b><br><small style="color:var(--muted)">${l.length}/5 · makes ⚔️ ${short(power(+sp, to))}</small></span></span><button class="xp-btn ${to === 2 ? 'purple' : 'gold'}" data-sp="${sp}" ${l.length < 5 ? 'disabled' : ''}>Make ${VAR[to][0]}</button></div>`).join('')
          : `<p class="xp-note">You don’t have any ${from ? 'Golden' : ''} pets to use yet.</p>`);
      openPanel(to === 1 ? '✨ Golden Machine' : '🌈 Rainbow Machine', html, (btn) => {
        const sp = +btn.dataset.sp, use = S.pets.map((p, i) => i).filter((i) => S.pets[i][0] === sp && S.pets[i][1] === from).slice(0, 5);
        if (use.length < 5) return;
        const wasEq = use.some((i) => S.eq.includes(i));
        S.pets = S.pets.filter((p, i) => !use.includes(i));
        S.eq = S.eq.filter((i) => !use.includes(i)).map((i) => i - use.filter((u) => u < i).length);
        S.pets.push([sp, to]);
        if (wasEq) this.autoEquip(S.pets.length - 1);
        this.syncPets(); this.send(); this.drawBar();
        sfx('levelup'); puffAt(P.x, P.y + 4, P.z, to === 2 ? CONFETTI : [0xfacc15, 0xffffff], 30);
        toast(`${VAR[to][0]} ${SPECIES[sp][0]}!`, '#fde68a'); this.dirty = true; this.save(); this.machine(to);
      });
    },
    upgrades() {
      const S = this.S;
      const html = `<div class="xp-row"><span>💰 <b>${short(S.c)}</b></span><span>💎 <b>${short(S.g)}</b></span></div>` + Object.entries(UPG).map(([k, u]) => {
        const l = S.up[k] | 0, maxed = l >= u.max, cost = maxed ? 0 : u.cost(l), have = u.cur === 'g' ? S.g : S.c;
        return `<div class="xp-row"><span><b>${u.n}</b> <small style="color:var(--muted)">${u.max > 1 ? `${l}/${u.max}` : l ? 'owned' : ''}</small><br><small style="color:var(--muted)">${u.d}</small></span><button class="xp-btn ${u.cur === 'g' ? 'blue' : 'gold'}" data-u="${k}" ${maxed || have < cost ? 'disabled' : ''}>${maxed ? 'Maxed' : `${u.cur === 'g' ? '💎' : '💰'} ${short(cost)}`}</button></div>`;
      }).join('') + '<p class="xp-note">💎 Gems come from crystals and chests.</p>';
      openPanel('⬆️ Upgrades', html, (btn) => {
        const k = btn.dataset.u, u = UPG[k], l = S.up[k] | 0, cost = u.cost(l);
        if (l >= u.max) return;
        if (u.cur === 'g') { if (S.g < cost) return; S.g -= cost; } else { if (S.c < cost) return; S.c -= cost; }
        S.up[k] = l + 1; sfx('levelup'); this.dirty = true; this.save(); this.drawBar(); this.upgrades();
      });
    },
    teleports() {
      const S = this.S;
      const html = `<div class="xp-row" data-z="-1"><span class="lft"><span class="ico">🏠</span><b>Spawn</b></span><button class="xp-btn alt" data-z="-1">Go</button></div>` + ZONES.map((Z, k) => {
        const open = k < S.z;
        return `<div class="xp-row"><span class="lft"><span class="ico">${Z.e}</span><span><b>${Z.n}</b><br><small style="color:var(--muted)">${open ? `Coins ×${short(Z.mult)} · ${Z.egg}` : `🔒 ${short(Z.cost)} coins`}</small></span></span>${open ? `<button class="xp-btn blue" data-z="${k}">Go</button>` : k === S.z ? `<button class="xp-btn gold" data-unlock="${k}" ${S.c < Z.cost ? 'disabled' : ''}>Unlock</button>` : '<span>🔒</span>'}</div>`;
      }).join('');
      openPanel('🗺️ Teleport', html, (btn) => {
        if (btn.dataset.unlock) { this.unlock(+btn.dataset.unlock); this.teleports(); return; }
        const k = +btn.dataset.z;
        if (k < 0) { P.x = 0; P.z = 45; } else { P.x = 6; P.z = ZC(k) + 30; }
        P.y = 1; P.vx = P.vy = P.vz = 0; this.target = null; sfx('teleport'); puffAt(P.x, P.y + 2, P.z, 0xffffff); closePanel();
      });
    },
    unlock(k) {
      const S = this.S, Z = ZONES[k];
      if (k !== S.z || S.c < Z.cost) { sfx('error'); toast(`You need ${short(Z.cost)} coins`, '#fca5a5'); return; }
      S.c -= Z.cost; S.z = k + 1; this.dirty = true; this.save(); questMax('pets.zone', S.z - 1);
      const gt = this.gates.find((g) => g.k === k); if (gt) this.openGate(gt);
      sfx('unlock'); puffAt(0, 4, ZC(k) + 37.5, CONFETTI, 50); toast(`${Z.e} ${Z.n} unlocked!`, '#86efac');
      earn(20, `unlocked ${Z.n}`); Net.chat(`🔓 unlocked ${Z.n}!`);
    },
    openGate(gt) { removeParts((p) => p === gt.bar); if (gt.gl) { place.remove(gt.gl); gt.gl = null; } },
    statOf(pr, isMe) { return short(isMe ? this.S && this.S.c : pr.cc || 0); },
    sortKey(pr, isMe) { return isMe ? (this.S ? this.S.c : 0) : +pr.cc || 0; },
    hud() {
      if (!this.S) return '';
      const S = this.S, z = zoneAt(P.z), tg = this.target;
      return `💰 <b>${short(S.c)}</b> · 💎 <b>${short(S.g)}</b> · ${z < 0 ? '🏠 Spawn' : `${ZONES[z].e} ${ZONES[z].n}`}${tg ? ` · ${KINDS[tg.kind].n} ${short(Math.max(0, tg.hp))}/${short(tg.max)}` : ''}`;
    },
    coinShop: [
      { id: 'coins2', e: '💰', n: '2× Coins', d: 'Everything your pets break gives twice the coins, for good', price: 700, kind: 'pass' },
      { id: 'lucky', e: '🍀', n: 'Lucky Eggs', d: 'Rare, epic and legendary pets hatch 50% more often, for good', price: 600, kind: 'pass' },
      { id: 'slot', e: '🐾', n: 'Extra Pet Slot', d: 'Equip one more pet, for good', price: 500, kind: 'pass' },
      shopSpeed(200, 1.2),
    ],
    onBuy(id) { if (id === 'slot' && this.S) this.drawBar(); },
    // trading: your pets
    tradeName: 'Pets',
    tradeItems() { const S = this.S; return S ? S.pets.map((p, i) => ({ k: trKey(i, p), e: RAR_DOT[rarOf(p[0])], n: `${VAR[p[1]][0] ? VAR[p[1]][0] + ' ' : ''}${SPECIES[p[0]][0]} (${RAR[rarOf(p[0])][0]})`, d: p })) : []; },
    tradeTake(k) { const S = this.S, i = trFind(S.pets, k); if (i < 0) return; S.pets.splice(i, 1); S.eq = S.eq.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)); this.syncPets(); this.send(); this.drawBar(); this.save(); },
    tradeGive(d) { const S = this.S; if (!Array.isArray(d) || !SPECIES[d[0] | 0] || S.pets.length >= MAX_PETS * 2) return; S.pets.push([d[0] | 0, clamp(d[1] | 0, 0, 2)]); this.drawBar(); this.save(); },
  };
  function m_dispose(m) { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); }
  addExp(PS);
  window.__rbPS = PS;
})();
