/* =====================================================================
   BLOXVERSE — PLANTS VS BRAINROTS. Everyone has a plot: rows to plant
   in at the back, a base of podiums at the front. Brainrots wander in at
   the far end of your rows and walk towards your base; your plants (and
   your bat) beat them, and a beaten brainrot goes in your bag. Put it on
   a podium and it makes money every second. One that gets all the way
   through runs off with 1% of your cash. Seeds from the seed shop (it
   restocks every 5 minutes), gear from Joel, sell to Barry, fuse a plant
   with a brainrot (after your first rebirth), and rebirth for more cash,
   more luck and a stronger bat. Weather turns new brainrots Gold,
   Diamond, Frozen, Neon or Rainbow.
   Each player runs their own plot and shows it to everyone through their
   presence; the weather and the shop run on the shared clock, so there
   is no host.
   ===================================================================== */
(() => {
  const TAU = Math.PI * 2;
  const style = document.createElement('style');
  style.textContent = `
    .pb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:10px}
    .pb-grid .xp-card img{width:100%;height:88px;object-fit:contain}
    .pb-grid button.xp-card{cursor:pointer;width:100%;text-align:center;align-items:center}.pb-grid .xp-card.sel{outline:3px solid #fde047}
    .pb-grid .xp-card.dim img{filter:brightness(0) opacity(.45)}
    .pb-rar{font:700 11px var(--fh);text-transform:uppercase;letter-spacing:.05em}
    .pb-fuse{display:flex;align-items:center;justify-content:center;gap:14px;margin:6px 0 12px;font:700 26px var(--fh)}
    .pb-fuse .slot{width:110px;height:110px;border-radius:16px;border:2px dashed rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font:600 12px var(--fh);text-align:center;overflow:hidden}
    .pb-fuse .slot img{width:100%;height:100%;object-fit:contain}
    #pbIce{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .6s}`;
  document.head.append(style);

  /* ---------------- the plots ---------------- */
  const NP = 6, PX = (p) => -125 + p * 50; // six plots side by side, 44 studs wide
  const Z_END = 33, Z_SPAWN = 103; // brainrots walk from the back of the rows (z 103) to the base (z 33)
  const ORDER = [2, 1, 3, 0, 4], LANE_COST = [0, 1000, 10000, 100000, 1000000]; // the rows, in the order you unlock them
  const laneX = (p, l) => PX(p) + (l - 2) * 8;
  // a planting spot: lane × 20 + side × 10 + k (ten down each side of the path)
  const spotPos = (p, s) => { const l = Math.floor(s / 20), side = Math.floor((s % 20) / 10), k = s % 10; return [laneX(p, l) + (side ? 2.65 : -2.65), 39 + k * 6.4]; };
  const podPos = (p, k) => [PX(p) - 18 + (k % 10) * 4, k < 10 ? 11 : 21];
  const SLOTS = (reb) => Math.min(20, 8 + reb * 2);
  const SHOP = { seed: [-75, -28], gear: [-38, -28], sell: [0, -28], fuse: [38, -28], reb: [75, -28] };
  const PCOL = [0xef4444, 0xf59e0b, 0x22c55e, 0x3b82f6, 0xa855f7, 0xec4899];

  /* ---------------- what's in it ---------------- */
  const RAR = [
    { n: 'Rare', c: '#60a5fa', w: 70 }, { n: 'Epic', c: '#c084fc', w: 22 }, { n: 'Legendary', c: '#fbbf24', w: 6 },
    { n: 'Mythic', c: '#f87171', w: 1.6 }, { n: 'Godly', c: '#22d3ee', w: 0.34 }, { n: 'Secret', c: '#f0abfc', w: 0.06 },
  ];
  const FUSED = { n: 'Fused', c: '#a3e635' };
  // plants: name, rarity, seed price, damage a hit, hits a second, reach, how, emoji, seconds to grow, shot colour, short name
  const SEEDS = [
    ['Cactus', 0, 200, 10, 1, 16, 'shoot', '🌵', 8, 0x65a30d, 'Cactus'], ['Strawberry', 0, 1250, 24, 1.2, 16, 'shoot', '🍓', 10, 0xef4444, 'Strawberry'],
    ['Pumpkin', 1, 5000, 60, 0.8, 16, 'splash', '🎃', 15, 0xf97316, 'Pumpkin'], ['Sunflower', 1, 25000, 140, 1, 18, 'beam', '🌻', 20, 0xfde047, 'Sunflower'],
    ['Dragon Fruit', 2, 100000, 320, 1, 18, 'burn', '🐉', 25, 0xec4899, 'Dragon'], ['Eggplant', 2, 250000, 700, 0.9, 18, 'shoot', '🍆', 30, 0x7e22ce, 'Eggplant'],
    ['Watermelon', 3, 1000000, 1600, 0.7, 18, 'splash', '🍉', 35, 0x16a34a, 'Melon'], ['Grape', 3, 2500000, 1300, 1, 18, 'triple', '🍇', 40, 0x7c3aed, 'Grape'],
    ['Cocotank', 4, 5000000, 6500, 0.5, 20, 'shell', '🥥', 45, 0x78350f, 'Coco'], ['Carnivorous Plant', 4, 25000000, 22000, 0.6, 7, 'chomp', '🪴', 50, 0xdc2626, 'Chomper'],
    ['Mr Carrot', 5, 50000000, 30000, 1.2, 20, 'shoot', '🥕', 60, 0xf97316, 'Carrot'], ['Tomatrio', 5, 125000000, 36000, 1, 20, 'triple', '🍅', 60, 0xdc2626, 'Tomato'],
    ['Shroombino', 5, 300000000, 110000, 0.8, 20, 'splash', '🍄', 60, 0xef4444, 'Shroom'],
  ];
  const HOW = { shoot: 'Shoots', splash: 'Splash damage', beam: 'Sun beam', burn: 'Burns', triple: 'Three shots', shell: 'Big splash', chomp: 'Chomps up close' };
  // what's in the seed shop: the chance a seed is in stock at a restock, and how many
  const STOCK = [[1, 4, 9], [0.85, 2, 6], [0.6, 1, 4], [0.45, 1, 3], [0.32, 1, 2], [0.24, 1, 2], [0.15, 1, 1], [0.1, 1, 1], [0.06, 1, 1], [0.04, 1, 1], [0.02, 1, 1], [0.012, 1, 1], [0.007, 1, 1]];
  const RESTOCK = 300;
  // brainrots: name, rarity, health, cash a second
  const BR = [
    ['Noobini Bananini', 0, 50, 2], ['Lirili Larila', 0, 80, 3], ['Boneca Ambalabu', 0, 110, 4], ['Fluriflura', 0, 140, 6],
    ['Trulimero Trulicina', 1, 300, 12], ['Brr Brr Patapim', 1, 450, 18], ['Cappuccino Assassino', 1, 650, 26], ['Svinino Bombondino', 1, 850, 35],
    ['Orangutini Ananassini', 2, 2500, 85], ['Bandito Bobrito', 2, 3500, 120], ['Tralalero Tralala', 2, 5000, 170], ['Elefanto Cocofanto', 2, 7500, 240],
    ['Bombini Gussini', 3, 20000, 700], ['Frigo Camelo', 3, 30000, 1000], ['Giraffa Celeste', 3, 42000, 1400], ['Bombardiro Crocodilo', 3, 60000, 2000],
    ['Tung Tung Tung Sahur', 4, 150000, 6000], ['Ballerina Cappuccina', 4, 220000, 8500], ['Chimpanzini Bananini', 4, 320000, 12000], ['Odin Din Din Dun', 4, 480000, 18000],
    ['Matteo', 5, 1500000, 60000], ['Trippi Troppi', 5, 2500000, 100000], ['Los Tralaleritos', 5, 4000000, 160000], ['Garamararam', 5, 6000000, 250000],
  ];
  const BYR = RAR.map((_, r) => BR.map((b, i) => (b[1] === r ? i : -1)).filter((i) => i >= 0));
  const SPEED = [3.6, 3.3, 3.0, 2.8, 2.6, 2.4];
  const MUT = [{ n: '', x: 1 }, { n: 'Gold', x: 2, c: '#facc15' }, { n: 'Diamond', x: 3, c: '#67e8f9' }, { n: 'Frozen', x: 4, c: '#bae6fd' }, { n: 'Neon', x: 5, c: '#f472b6' }, { n: 'Rainbow', x: 10, c: '#c4b5fd' }];
  // weather: every ten minutes, three minutes of it; new brainrots often come out with its mutation
  const WEATHER = [
    { n: '🌟 Golden Rain', mut: 1, ch: 0.4, w: 30, sky: ['#f6c945', '#fff4c7'], fx: [0xfacc15, 0xfde68a] },
    { n: '💎 Diamond Storm', mut: 2, ch: 0.35, w: 25, sky: ['#38bdf8', '#e0f2fe'], fx: [0x67e8f9, 0xffffff] },
    { n: '❄️ Blizzard', mut: 3, ch: 0.4, w: 20, slow: 0.65, sky: ['#94a3b8', '#f1f5f9'], fx: [0xffffff, 0xe0f2fe] },
    { n: '⚡ Neon Night', mut: 4, ch: 0.3, w: 17, sky: ['#1e1b4b', '#6d28d9'], fx: [0xf472b6, 0x22d3ee, 0xa3e635] },
    { n: '🌈 Rainbow', mut: 5, ch: 0.2, w: 8, sky: ['#7dd3fc', '#fbcfe8'], fx: [0xef4444, 0xf59e0b, 0xfacc15, 0x22c55e, 0x3b82f6, 0xa855f7] },
  ];
  const CYCLE = 600, CLEAR = 420;
  function weatherAt(t) {
    if (PB.wOver !== undefined) return PB.wOver; // (tests)
    const n = Math.floor(t / CYCLE), k = t - n * CYCLE; if (k < CLEAR) return null;
    const r = mulberry(n * 9973 + 11)(), tot = WEATHER.reduce((a, w) => a + w.w, 0); let x = r * tot, i = 0;
    while (i < WEATHER.length - 1 && x >= WEATHER[i].w) { x -= WEATHER[i].w; i++; }
    return { W: WEATHER[i], left: CYCLE - k };
  }
  // the gear shop (Joel): tools you keep, and things you use up
  const GEAR = {
    banana: { n: 'Banana Gun', e: '🍌', price: 25000, tool: 1, d: 'Shoot bananas where you click: 120 damage' },
    blower: { n: 'Frost Blower', e: '🌬️', price: 150000, tool: 1, d: 'Brainrots in front of you walk at half speed for 5 seconds' },
    carrot: { n: 'Carrot Launcher', e: '🥕', price: 1000000, tool: 1, d: 'A carrot rocket where you click: 600 damage all round' },
    bucket: { n: 'Water Bucket', e: '🪣', price: 7500, d: 'Click a growing plant: it’s grown' },
    grenade: { n: 'Frost Grenade', e: '🧊', price: 12500, d: 'Freezes the brainrots where it lands for 4 seconds' },
  };
  const BATS = [['Wooden Bat', 20, 0xb08150], ['Iron Bat', 70, 0x9ca3af], ['Golden Bat', 260, 0xfacc15], ['Diamond Bat', 1000, 0x67e8f9], ['Galaxy Bat', 4000, 0x7c3aed], ['Rainbow Bat', 16000, 0xf472b6], ['Brainrot Bat', 64000, 0xa3e635]];
  // rebirths: the cash and the two brainrots each one takes
  const REB = [[1e6, [10, 12]], [5e6, [13, 15]], [30e6, [16, 17]], [150e6, [18, 19]], [800e6, [20, 21]], [4e9, [22, 23]]];
  const FUSE_SECS = 60;

  const short = (n) => { n = Math.floor(n || 0); for (const [v, s] of [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']]) if (n >= v) return (n / v).toFixed(n >= v * 100 ? 0 : 1).replace(/\.0$/, '') + s; return String(n); };
  const cash = (n) => '$' + short(n);
  const rarOf = (t, f) => (f >= 0 ? FUSED : RAR[BR[t][1]]);
  const rotName = (t, m, f) => (m ? MUT[m].n + ' ' : '') + (f >= 0 ? (f === 1 && t === 11 ? 'Strawberry Elephant' : `${SEEDS[f][10]} ${BR[t][0].split(' ')[0]}`) : BR[t][0]);
  const income = (t, m, f) => BR[t][3] * MUT[m].x * (f >= 0 ? 3 + SEEDS[f][1] : 1);
  const sellPrice = (t, m, f) => Math.floor(income(t, m, f) * 25);
  const rkey = (e) => `${e[0]}.${e[1]}.${e[2]}`;
  const unkey = (k) => k.split('.').map(Number);

  /* ---------------- models ---------------- */
  const MATS = new Map();
  const mat = (c) => { if (!MATS.has(c)) MATS.set(c, new THREE.MeshLambertMaterial({ color: c })); return MATS.get(c); };
  const SPH = new THREE.IcosahedronGeometry(1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 12), CONE = new THREE.ConeGeometry(1, 1, 10), TOR = new THREE.TorusGeometry(1, 0.42, 8, 16);
  // a block (BOX: full sizes; the round shapes: radii, and a cylinder's full height)
  const bx = (g, c, sx, sy, sz, x, y, z, geo, rx, ry, rz) => { const m = new THREE.Mesh(geo || BOX, mat(c)); m.scale.set(sx, sy, sz); m.position.set(x, y, z); if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0); g.add(m); return m; };
  const eyes = (g, y, z, w = 0.26, gap = 0.28, x = 0) => { for (const s of [-1, 1]) { bx(g, 0xffffff, w, w, 0.05, x + s * gap, y, z); bx(g, 0x111111, w * 0.5, w * 0.55, 0.06, x + s * gap, y - w * 0.08, z - 0.01); } };
  const SKIN = 0xf1c27d, WOOD = 0x8b5a2b;
  function shark(g, x, z, s) { // Tralalero: a shark on three legs in blue trainers
    const h = new THREE.Group(); h.position.set(x, 0, z); h.scale.setScalar(s); g.add(h);
    for (const [lx, lz] of [[-0.45, -0.4], [0.45, -0.4], [0, 0.7]]) { bx(h, 0x6b7f99, 0.32, 1.3, 0.32, lx, 0.85, lz); bx(h, 0x2563eb, 0.5, 0.32, 0.85, lx, 0.16, lz - 0.12); bx(h, 0xffffff, 0.52, 0.1, 0.87, lx, 0.02, lz - 0.12); }
    bx(h, 0x5b7fa6, 0.85, 0.8, 1.9, 0, 2.1, 0, SPH); bx(h, 0xe2e8f0, 0.6, 0.45, 1.5, 0, 1.75, -0.1, SPH);
    bx(h, 0x5b7fa6, 0.12, 0.9, 0.7, 0, 3.0, 0.2, BOX, -0.4); bx(h, 0x5b7fa6, 0.12, 1.1, 0.6, 0, 2.3, 1.95, BOX, 0.5);
    for (const sx of [-1, 1]) { bx(h, 0xffffff, 0.06, 0.22, 0.22, sx * 0.62, 2.35, -1.25); bx(h, 0x111111, 0.07, 0.12, 0.12, sx * 0.63, 2.33, -1.28); }
    bx(h, 0x7f1d1d, 0.5, 0.12, 0.3, 0, 1.95, -1.75); for (let i = -2; i <= 2; i++) bx(h, 0xffffff, 0.07, 0.12, 0.07, i * 0.1, 2.05, -1.83);
  }
  const cupHead = (g, y) => { bx(g, 0xffffff, 0.62, 1.0, 0.62, 0, y, 0, CYL); bx(g, 0x7c4a1e, 0.56, 0.08, 0.56, 0, y + 0.5, 0, CYL); bx(g, 0xfef3c7, 0.3, 0.09, 0.3, 0, y + 0.53, 0, CYL); bx(g, 0xffffff, 0.3, 0.3, 0.09, 0.75, y, 0, TOR, 0, Math.PI / 2); };
  function rotBody(t, g) {
    const B = (c, sx, sy, sz, x, y, z, geo, rx, ry, rz) => bx(g, c, sx, sy, sz, x, y, z, geo, rx, ry, rz);
    const E = (y, z, w, gap, x) => eyes(g, y, z, w, gap, x);
    const legs2 = (c, h, gap, shoe) => { for (const s of [-1, 1]) { B(c, 0.42, h, 0.42, s * gap, h / 2, 0); if (shoe != null) B(shoe, 0.55, 0.3, 0.8, s * gap, 0.15, -0.12); } };
    const legs4 = (c, h, w, l, th = 0.45) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(c, th, h, th, sx * w, h / 2, sz * l); };
    switch (t) {
      case 0: // Noobini Bananini: a noob with a banana on his head
        legs2(0x22c55e, 1.4, 0.3); B(0x2563eb, 1.3, 1.4, 0.7, 0, 2.1, 0); for (const s of [-1, 1]) B(0xfacc15, 0.4, 1.3, 0.4, s * 0.86, 2.1, 0);
        B(0xfacc15, 0.95, 0.95, 0.95, 0, 3.3, 0); E(3.42, -0.49, 0.18, 0.2); B(0x111111, 0.38, 0.07, 0.04, 0, 3.1, -0.49);
        B(0xfde047, 0.26, 1.7, 0.26, 0.1, 4.4, 0.1, CYL, 0, 0, 0.55); B(0x713f12, 0.12, 0.3, 0.12, 0.58, 5.1, 0.1, CYL, 0, 0, 0.55); break;
      case 1: // Lirili Larila: an elephant who's a cactus, in sandals
        for (const s of [-1, 1]) { B(0x92400e, 0.6, 0.15, 0.9, s * 0.45, 0.08, -0.1); B(0x16a34a, 0.45, 1.0, 0.45, s * 0.45, 0.6, 0); }
        B(0x16a34a, 0.75, 2.2, 0.75, 0, 2.1, 0, CYL); for (const s of [-1, 1]) { B(0x16a34a, 0.7, 0.35, 0.35, s * 0.95, 2.2, 0); B(0x16a34a, 0.35, 0.8, 0.35, s * 1.2, 2.6, 0); }
        for (let i = 0; i < 8; i++) B(0xfefce8, 0.06, 0.18, 0.06, Math.cos(i) * 0.76, 1.4 + (i % 4) * 0.45, Math.sin(i) * 0.76);
        B(0x9ca3af, 1.3, 1.1, 1.1, 0, 3.7, 0); for (const s of [-1, 1]) B(0x9ca3af, 0.15, 1.1, 1.0, s * 0.75, 3.75, 0.1);
        B(0x9ca3af, 0.34, 1.0, 0.34, 0, 3.05, -0.72, BOX, 0.35); E(3.95, -0.56, 0.22, 0.3); break;
      case 2: // Boneca Ambalabu: a frog head on a tyre, on human legs
        legs2(SKIN, 1.4, 0.36, 0x111111); B(0x1f2937, 0.85, 0.85, 0.85, 0, 2.4, 0, TOR, 0, Math.PI / 2); B(0x6b7280, 0.3, 0.3, 0.3, 0, 2.4, 0, CYL, 0, 0, Math.PI / 2);
        B(0x4d7c0f, 0.8, 0.6, 0.75, 0, 3.6, 0, SPH); for (const s of [-1, 1]) { B(0xffffff, 0.28, 0.28, 0.28, s * 0.38, 4.12, -0.25, SPH); B(0x111111, 0.12, 0.12, 0.12, s * 0.38, 4.14, -0.5, SPH); }
        B(0x14532d, 0.7, 0.06, 0.06, 0, 3.4, -0.72); break;
      case 3: // Fluriflura: a little bird with a flower for a head
        for (const s of [-1, 1]) B(0xf59e0b, 0.12, 1.2, 0.12, s * 0.25, 0.6, 0); B(0xffffff, 0.6, 0.55, 0.65, 0, 1.7, 0, SPH);
        B(0xfacc15, 0.42, 0.2, 0.42, 0, 2.75, -0.15, CYL, Math.PI / 2); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; B(0xf472b6, 0.3, 0.5, 0.08, Math.cos(a) * 0.62, 2.75 + Math.sin(a) * 0.62, -0.12, BOX, 0, 0, a - Math.PI / 2); }
        E(2.82, -0.27, 0.14, 0.13); B(0xf97316, 0.12, 0.3, 0.12, 0, 2.6, -0.4, CONE, -Math.PI / 2); break;
      case 4: // Trulimero Trulicina: a fish with a cat's head, on four legs
        legs4(SKIN, 1.1, 0.45, 0.55, 0.32); B(0x3b82f6, 0.8, 0.7, 1.2, 0, 1.8, 0, SPH); B(0x3b82f6, 0.1, 0.9, 0.7, 0, 1.9, 1.35, BOX, 0.4);
        B(0x9ca3af, 1.0, 0.9, 0.9, 0, 2.3, -1.15); for (const s of [-1, 1]) B(0x9ca3af, 0.22, 0.4, 0.22, s * 0.32, 2.85, -1.15, CONE); E(2.4, -1.61, 0.2, 0.22);
        for (const s of [-1, 1]) B(0x111111, 0.5, 0.03, 0.03, s * 0.45, 2.1, -1.62); break;
      case 5: // Brr Brr Patapim: a monkey that's a tree, with huge feet
        for (const s of [-1, 1]) { B(0x92400e, 0.9, 0.4, 1.4, s * 0.55, 0.2, -0.2); B(WOOD, 0.3, 1.2, 0.3, s * 0.4, 1.0, 0); }
        B(WOOD, 0.6, 1.8, 0.6, 0, 2.3, 0, CYL); B(0x22c55e, 1.25, 1.0, 1.25, 0, 3.9, 0, SPH); B(0x16a34a, 0.8, 0.7, 0.8, 0.6, 4.3, 0.3, SPH);
        B(0xd6b48a, 0.9, 0.8, 0.2, 0, 2.7, -0.58); E(2.85, -0.69, 0.18, 0.2); B(0x7c2d12, 0.22, 0.14, 0.05, 0, 2.55, -0.69);
        for (const s of [-1, 1]) B(WOOD, 0.22, 1.5, 0.22, s * 0.75, 2.2, 0, BOX, 0, 0, s * 0.2); break;
      case 6: // Cappuccino Assassino: a ninja with a coffee cup for a head
        legs2(0x111827, 1.3, 0.3); B(0x111827, 1.1, 1.4, 0.7, 0, 2.0, 0); B(0xdc2626, 1.12, 0.2, 0.72, 0, 1.5, 0); for (const s of [-1, 1]) B(0x111827, 0.35, 1.2, 0.35, s * 0.72, 2.0, 0);
        for (const s of [-1, 1]) B(0xd1d5db, 0.08, 2.2, 0.12, s * 0.3, 2.4, 0.42, BOX, 0, 0, s * 0.6);
        cupHead(g, 3.25); B(0xdc2626, 0.66, 0.18, 0.66, 0, 3.4, 0, CYL); E(3.4, -0.67, 0.16, 0.2); break;
      case 7: // Svinino Bombondino: a pig with a bomb on its back
        legs4(0xf9a8d4, 0.8, 0.5, 0.6, 0.4); B(0xf9a8d4, 0.9, 0.8, 1.2, 0, 1.6, 0, SPH); B(0xf9a8d4, 0.9, 0.85, 0.8, 0, 1.95, -1.2);
        B(0xec4899, 0.45, 0.3, 0.12, 0, 1.8, -1.62); for (const s of [-1, 1]) B(0xf9a8d4, 0.25, 0.3, 0.12, s * 0.3, 2.45, -1.1, BOX, 0, 0, s * 0.4); E(2.08, -1.61, 0.17, 0.22);
        B(0x111827, 0.55, 0.55, 0.55, 0, 2.6, 0.25, SPH); B(0x9ca3af, 0.06, 0.35, 0.06, 0, 3.25, 0.25); B(0xfde047, 0.12, 0.12, 0.12, 0, 3.45, 0.25, SPH); break;
      case 8: // Orangutini Ananassini: an orangutan who's a pineapple
        legs2(0xc2410c, 1.0, 0.35); B(0xeab308, 0.85, 1.15, 0.85, 0, 2.1, 0, SPH); for (let i = 0; i < 10; i++) B(0xa16207, 0.1, 0.1, 0.05, Math.cos(i * 0.7) * 0.6, 1.6 + (i % 5) * 0.25, -0.62);
        for (const s of [-1, 1]) B(0xc2410c, 0.32, 1.7, 0.32, s * 0.95, 1.9, 0, BOX, 0, 0, s * 0.15);
        B(0xc2410c, 1.0, 0.9, 0.9, 0, 3.55, 0); B(0xfdba74, 0.75, 0.6, 0.1, 0, 3.45, -0.47); E(3.62, -0.53, 0.17, 0.2);
        for (let i = 0; i < 5; i++) B(0x16a34a, 0.15, 0.8, 0.15, (i - 2) * 0.18, 4.35, 0, CONE, 0, 0, (i - 2) * 0.25); break;
      case 9: // Bandito Bobrito: a beaver bandit
        legs2(0x78350f, 0.9, 0.35); B(0x92400e, 1.2, 1.4, 0.9, 0, 1.6, 0); B(0x451a03, 0.8, 0.15, 1.4, 0, 0.5, 0.9);
        B(0x92400e, 1.0, 0.9, 0.9, 0, 2.8, 0); B(0x111111, 1.02, 0.25, 0.05, 0, 2.95, -0.46); E(2.95, -0.49, 0.16, 0.22); B(0xffffff, 0.25, 0.22, 0.05, 0, 2.48, -0.47);
        B(0x7c2d12, 0.95, 0.06, 0.95, 0, 3.27, 0, CYL); B(0x7c2d12, 0.45, 0.5, 0.45, 0, 3.55, 0, CYL); B(0xdc2626, 0.9, 0.3, 0.2, 0, 2.3, -0.48); break;
      case 10: shark(g, 0, 0, 1); break; // Tralalero Tralala
      case 11: // Elefanto Cocofanto: an elephant who's a coconut
        legs4(0x9ca3af, 1.2, 0.55, 0.55, 0.5); B(0x78350f, 1.1, 1.0, 1.1, 0, 2.2, 0, SPH); for (const [x, y] of [[-0.4, 2.6], [0.3, 2.9], [0.5, 2.1]]) B(0x451a03, 0.15, 0.15, 0.05, x, y, -1.0);
        B(0x9ca3af, 1.3, 1.2, 1.1, 0, 2.9, -1.2); for (const s of [-1, 1]) B(0x9ca3af, 0.15, 1.3, 1.1, s * 0.78, 2.95, -1.0);
        B(0x9ca3af, 0.36, 1.1, 0.36, 0, 2.15, -1.85, BOX, 0.3); for (const s of [-1, 1]) B(0xffffff, 0.1, 0.1, 0.5, s * 0.35, 2.45, -1.85); E(3.15, -1.77, 0.2, 0.3); break;
      case 12: // Bombini Gussini: a goose that's a jet
        for (const s of [-1, 1]) { B(0xf59e0b, 0.12, 1.2, 0.12, s * 0.3, 0.6, 0); B(0xf59e0b, 0.4, 0.06, 0.5, s * 0.3, 0.03, -0.15); }
        B(0xf8fafc, 0.7, 0.7, 1.6, 0, 2.0, 0, SPH); B(0x9ca3af, 3.8, 0.14, 1.0, 0, 2.1, 0.1); for (const s of [-1, 1]) B(0x6b7280, 0.25, 0.9, 0.25, s * 1.2, 1.8, 0.1, CYL, Math.PI / 2);
        B(0xf8fafc, 0.4, 1.2, 0.4, 0, 2.8, -1.2, BOX, -0.2); B(0xf8fafc, 0.6, 0.55, 0.65, 0, 3.4, -1.35); B(0xf97316, 0.4, 0.18, 0.5, 0, 3.3, -1.85); E(3.52, -1.68, 0.14, 0.2); B(0x9ca3af, 0.1, 0.7, 0.6, 0, 2.6, 1.45); break;
      case 13: // Frigo Camelo: a camel who's a fridge, in boots
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { B(0xd4a373, 0.36, 1.6, 0.36, sx * 0.5, 0.95, sz * 0.75); B(0x451a03, 0.45, 0.4, 0.55, sx * 0.5, 0.2, sz * 0.75 - 0.05); }
        B(0xf8fafc, 1.3, 1.6, 2.0, 0, 2.5, 0); B(0xd1d5db, 1.32, 0.04, 2.02, 0, 2.7, 0); B(0x6b7280, 0.08, 0.6, 0.1, 0.55, 2.2, -1.03);
        B(0xd4a373, 0.42, 1.4, 0.42, 0, 3.6, -1.15, BOX, 0.35); B(0xd4a373, 0.6, 0.6, 1.0, 0, 4.3, -1.6); E(4.42, -2.11, 0.15, 0.18); break;
      case 14: // Giraffa Celeste: a giraffe who's a watermelon
        legs4(0xfacc15, 1.6, 0.5, 0.55, 0.32); B(0x16a34a, 1.0, 0.9, 1.1, 0, 2.3, 0, SPH); for (let i = -2; i <= 2; i++) B(0x14532d, 0.12, 1.75, 0.05, i * 0.38, 2.3, -0.92 + Math.abs(i) * 0.12);
        B(0xfacc15, 0.5, 2.2, 0.5, 0, 3.9, -0.75); for (let i = 0; i < 4; i++) B(0xa16207, 0.2, 0.2, 0.04, i % 2 ? 0.1 : -0.1, 3.3 + i * 0.5, -1.01);
        B(0xfacc15, 0.6, 0.6, 0.95, 0, 5.15, -0.95); for (const s of [-1, 1]) B(0xa16207, 0.1, 0.35, 0.1, s * 0.18, 5.6, -0.85); E(5.25, -1.43, 0.15, 0.18); break;
      case 15: // Bombardiro Crocodilo: a crocodile that's a bomber plane
        B(0x4d5d36, 0.65, 3.2, 0.65, 0, 2.2, 0.2, CYL, Math.PI / 2); B(0x4d5d36, 4.6, 0.14, 1.1, 0, 2.3, 0.1); B(0x4d5d36, 1.8, 0.1, 0.6, 0, 2.3, 1.7); B(0x4d5d36, 0.1, 0.8, 0.6, 0, 2.7, 1.7);
        for (const s of [-1, 1]) { B(0x374151, 0.14, 0.9, 0.14, s * 1.6, 2.3, -0.5); B(0x111827, 0.28, 0.28, 0.5, s * 1.3, 1.85, 0.2, SPH); }
        B(0x15803d, 0.9, 0.55, 1.6, 0, 2.3, -1.9); for (let i = -3; i <= 3; i++) B(0xffffff, 0.08, 0.14, 0.08, i * 0.12, 2.05, -2.66); for (const s of [-1, 1]) B(0x15803d, 0.3, 0.3, 0.3, s * 0.3, 2.65, -1.6); E(2.75, -1.75, 0.13, 0.3); break;
      case 16: // Tung Tung Tung Sahur: a log with a bat
        for (const s of [-1, 1]) B(WOOD, 0.18, 1.1, 0.18, s * 0.35, 0.55, 0); B(0xa16207, 0.7, 3.0, 0.7, 0, 2.6, 0, CYL); for (const y of [1.6, 3.6]) B(0x78350f, 0.72, 0.06, 0.72, 0, y, 0, CYL);
        for (const s of [-1, 1]) { B(0xffffff, 0.3, 0.3, 0.05, s * 0.28, 3.3, -0.7); B(0x111111, 0.13, 0.13, 0.06, s * 0.28, 3.3, -0.72); } B(0x3f1d0b, 0.45, 0.2, 0.05, 0, 2.8, -0.7);
        B(WOOD, 0.16, 1.2, 0.16, -0.75, 2.5, 0, BOX, 0, 0, 0.5); B(WOOD, 0.16, 1.0, 0.16, 0.75, 2.6, -0.3, BOX, -0.8); B(0xd6a35c, 0.16, 2.2, 0.16, 0.8, 3.2, -1.0, CYL, -0.4); B(0xd6a35c, 0.26, 0.9, 0.26, 0.8, 4.0, -1.35, CYL, -0.4); break;
      case 17: // Ballerina Cappuccina
        for (const s of [-1, 1]) { B(SKIN, 0.16, 1.6, 0.16, s * 0.18, 0.85, 0); B(0xf9a8d4, 0.22, 0.15, 0.35, s * 0.18, 0.08, -0.05); }
        B(0xf9a8d4, 1.0, 0.25, 1.0, 0, 1.85, 0, CYL); B(0xf472b6, 0.75, 1.0, 0.45, 0, 2.45, 0); for (const s of [-1, 1]) B(SKIN, 0.14, 1.2, 0.14, s * 0.5, 3.3, 0, BOX, 0, 0, s * -0.4);
        cupHead(g, 3.55); E(3.6, -0.63, 0.15, 0.2); B(0xfde047, 0.5, 0.12, 0.05, 0, 4.15, -0.4); break;
      case 18: // Chimpanzini Bananini: a chimp in a banana
        B(0x713f12, 0.35, 0.3, 0.35, 0, 0.15, 0, CYL); B(0xfacc15, 0.75, 2.6, 0.75, 0, 1.6, 0, CYL); for (let i = 0; i < 4; i++) B(0xfde047, 0.5, 1.5, 0.12, Math.cos(i * 1.57) * 0.75, 2.5, Math.sin(i * 1.57) * 0.75, BOX, Math.sin(i * 1.57) * 0.5, -i * 1.57, Math.cos(i * 1.57) * -0.5);
        B(0x3f2a1e, 1.0, 1.0, 0.9, 0, 3.4, 0); B(0xd6b48a, 0.75, 0.6, 0.1, 0, 3.3, -0.46); E(3.5, -0.53, 0.17, 0.2); for (const s of [-1, 1]) B(0x3f2a1e, 0.3, 0.35, 0.15, s * 0.6, 3.5, 0); break;
      case 19: // Odin Din Din Dun: a great big viking with a hammer
        legs2(0x3f2a1e, 1.4, 0.45, 0x111111); B(0x1e3a8a, 1.6, 1.8, 1.0, 0, 2.5, 0); B(0x78350f, 1.62, 0.25, 1.02, 0, 1.75, 0); for (const s of [-1, 1]) B(0x1e3a8a, 0.5, 1.6, 0.5, s * 1.05, 2.5, 0);
        B(SKIN, 1.0, 1.0, 1.0, 0, 3.9, 0); B(0xea580c, 0.9, 0.7, 0.2, 0, 3.55, -0.55); E(4.05, -0.51, 0.16, 0.22);
        B(0x9ca3af, 0.58, 0.45, 0.58, 0, 4.5, 0, CYL); for (const s of [-1, 1]) B(0xfefce8, 0.15, 0.6, 0.15, s * 0.7, 4.75, 0, CONE, 0, 0, s * -0.6);
        B(WOOD, 0.14, 1.8, 0.14, 1.15, 2.3, -0.4); B(0x6b7280, 0.7, 0.5, 0.5, 1.15, 3.2, -0.4); break;
      case 20: // Matteo: tall and grey, in a suit
        legs2(0x111827, 2.2, 0.28, 0x111111); B(0x1f2937, 0.95, 1.8, 0.55, 0, 3.1, 0); B(0xffffff, 0.3, 1.0, 0.05, 0, 3.4, -0.28); B(0xdc2626, 0.14, 0.9, 0.05, 0, 3.3, -0.3);
        for (const s of [-1, 1]) B(0x1f2937, 0.25, 1.7, 0.25, s * 0.6, 3.0, 0); B(0x9ca3af, 0.3, 0.6, 0.3, 0, 4.2, 0); B(0x9ca3af, 0.8, 1.3, 0.8, 0, 5.1, 0); E(5.3, -0.41, 0.2, 0.2); B(0x374151, 0.3, 0.06, 0.05, 0, 4.8, -0.41); break;
      case 21: // Trippi Troppi: a shrimp with a cat's head
        for (let i = 0; i < 4; i++) B(0xfb923c, 0.65 - i * 0.1, 0.6 - i * 0.08, 0.5, 0, 1.4 + i * 0.25, i * 0.6, SPH); B(0xfb923c, 0.8, 0.12, 0.5, 0, 2.2, 2.4, BOX, 0.6);
        for (let i = 0; i < 4; i++) for (const s of [-1, 1]) B(0xea580c, 0.08, 0.9, 0.08, s * 0.45, 0.5, i * 0.45 - 0.2, BOX, 0, 0, s * 0.3);
        B(0x9ca3af, 1.0, 0.9, 0.9, 0, 2.0, -0.75); for (const s of [-1, 1]) B(0x9ca3af, 0.22, 0.4, 0.22, s * 0.32, 2.55, -0.75, CONE); E(2.1, -1.21, 0.2, 0.22);
        for (const s of [-1, 1]) { B(0x111111, 0.5, 0.03, 0.03, s * 0.45, 1.85, -1.22); B(0xfb923c, 0.05, 0.05, 1.4, s * 0.2, 2.6, -1.6, BOX, -0.5); } break;
      case 22: // Los Tralaleritos: three Tralaleros
        for (const [x, z] of [[-1.3, 0.3], [1.3, 0.3], [0, -0.6]]) shark(g, x, z, 0.62); break;
      case 23: // Garamararam: a hooded giant with glowing eyes and a lantern
        B(0x3b0764, 1.3, 3.2, 1.3, 0, 1.6, 0, CONE); B(0x4c1d95, 0.75, 0.75, 0.75, 0, 3.5, 0, SPH); B(0x1e1b4b, 0.6, 0.55, 0.3, 0, 3.4, -0.55);
        for (const s of [-1, 1]) bx(g, 0, 0.14, 0.09, 0.05, s * 0.18, 3.45, -0.72).material = GLOW; B(0xfacc15, 0.9, 0.3, 0.9, 0, 4.25, 0, CYL); for (let i = 0; i < 5; i++) B(0xfacc15, 0.12, 0.35, 0.12, Math.cos(i * 1.256) * 0.8, 4.55, Math.sin(i * 1.256) * 0.8, CONE);
        B(0x3b0764, 0.3, 1.4, 0.3, 0.95, 2.6, -0.3, BOX, -0.5); bx(g, 0, 0.45, 0.6, 0.45, 1.0, 1.9, -0.95).material = GLOW; break;
    }
  }
  const GLOW = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  // mutations: everything takes on the colour (the eyes stay as they are)
  const MUTMAT = new Map(), RAINBOW = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0x220022 });
  function mutMat(c, m) {
    if (m === 5) return RAINBOW;
    const k = c + ':' + m; if (MUTMAT.has(k)) return MUTMAT.get(k);
    const col = new THREE.Color(c); let M;
    if (m === 1) M = new THREE.MeshLambertMaterial({ color: col.lerp(new THREE.Color(0xfacc15), 0.7), emissive: 0x3d2a00 });
    else if (m === 2) M = new THREE.MeshLambertMaterial({ color: col.lerp(new THREE.Color(0x67e8f9), 0.65), emissive: 0x0e3a4c, transparent: true, opacity: 0.85 });
    else if (m === 3) M = new THREE.MeshLambertMaterial({ color: col.lerp(new THREE.Color(0xdbeafe), 0.6), emissive: 0x0b2540 });
    else M = new THREE.MeshBasicMaterial({ color: col.lerp(new THREE.Color(0xff3fd0), 0.5) }); // (neon: glowing pink)
    MUTMAT.set(k, M); return M;
  }
  const RSCALE = [1, 1.1, 1.25, 1.4, 1.6, 1.8];
  function rotModel(t, m, f) {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    rotBody(t, body);
    if (m) body.traverse((o) => { if (o.isMesh && o.material !== GLOW) { const c = o.material.color.getHex(); if (c !== 0xffffff && c !== 0x111111) o.material = mutMat(c, m); } });
    if (m === 3) for (const [x, z] of [[-0.8, -0.5], [0.7, 0.4], [0.2, -0.9]]) { const ice = new THREE.Mesh(BOX, ICE); ice.scale.set(0.6, 0.6, 0.6); ice.position.set(x, 0.3, z); ice.rotation.y = x; body.add(ice); }
    const top = new THREE.Box3().setFromObject(body).max.y;
    if (f >= 0) { const p = plantModel(f); p.scale.setScalar(0.42); p.position.y = top - 0.1; body.add(p); const ring = new THREE.Mesh(RING, FUSEMAT); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring); }
    const s = (f >= 0 ? 0.1 : 0) + RSCALE[BR[t][1]]; g.scale.setScalar(s);
    g.userData = { body, h: (top + (f >= 0 ? 1.2 : 0)) * s, fly: t === 15 };
    return g;
  }
  const ICE = new THREE.MeshLambertMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.6 });
  const RING = new THREE.RingGeometry(1.4, 1.75, 24), FUSEMAT = new THREE.MeshBasicMaterial({ color: 0xa3e635, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, ...DECAL });
  const rotPic = (t, m, f) => snapshot(`pb-r-${t}-${m}-${f}`, () => rotModel(t, m, f), { w: 150, h: 150, dir: [0.75, 0.35, -1], zoom: 0.9 });
  // plants (facing -z; they turn to what they shoot at)
  function plantModel(t) {
    const g = new THREE.Group(), B = (c, sx, sy, sz, x, y, z, geo, rx, ry, rz) => bx(g, c, sx, sy, sz, x, y, z, geo, rx, ry, rz), E = (y, z, w, gap) => eyes(g, y, z, w, gap);
    const stem = (h) => { B(0x22c55e, 0.16, h, 0.16, 0, h / 2, 0, CYL); B(0x16a34a, 1.3, 0.1, 0.55, -0.5, 0.1, 0.1, BOX, 0, 0.4); B(0x16a34a, 1.3, 0.1, 0.55, 0.5, 0.1, -0.1, BOX, 0, 0.4); };
    switch (t) {
      case 0: B(0x65a30d, 0.5, 2.2, 0.5, 0, 1.1, 0, CYL); for (const s of [-1, 1]) { B(0x65a30d, 0.5, 0.3, 0.3, s * 0.6, 1.2, 0); B(0x65a30d, 0.3, 0.6, 0.3, s * 0.75, 1.55, 0); } B(0xf472b6, 0.25, 0.25, 0.25, 0, 2.3, 0, SPH); E(1.6, -0.5, 0.17, 0.17); break;
      case 1: stem(0.8); B(0xef4444, 0.75, 0.85, 0.75, 0, 1.55, 0, SPH); for (let i = 0; i < 8; i++) B(0xfde68a, 0.07, 0.07, 0.04, Math.cos(i) * 0.45, 1.3 + (i % 3) * 0.3, -0.62); B(0x16a34a, 0.9, 0.12, 0.9, 0, 2.35, 0); E(1.7, -0.72, 0.17, 0.2); break;
      case 2: B(0xf97316, 1.0, 0.8, 1.0, 0, 0.85, 0, SPH); B(0x15803d, 0.12, 0.5, 0.12, 0, 1.75, 0, CYL); for (const s of [-1, 1]) { B(0x111111, 0.22, 0.22, 0.05, s * 0.32, 1.0, -0.98); } B(0x111111, 0.55, 0.12, 0.05, 0, 0.62, -0.98); break;
      case 3: stem(1.8); { const h = new THREE.Group(); h.position.set(0, 2.2, 0); g.add(h); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; bx(h, 0xfacc15, 0.4, 0.75, 0.1, Math.cos(a) * 0.8, Math.sin(a) * 0.8, 0, BOX, 0, 0, a - Math.PI / 2); } bx(h, 0x92400e, 0.6, 0.2, 0.6, 0, 0, -0.05, CYL, Math.PI / 2); eyes(h, 0.12, -0.17, 0.16, 0.2); } break;
      case 4: stem(0.6); B(0xec4899, 0.75, 0.9, 0.75, 0, 1.4, 0, SPH); for (let i = 0; i < 8; i++) B(0x84cc16, 0.12, 0.45, 0.12, Math.cos(i) * 0.7, 1.2 + (i % 3) * 0.35, Math.sin(i) * 0.7, CONE, 0, 0, Math.cos(i) * -0.8); E(1.55, -0.7, 0.17, 0.2); break;
      case 5: stem(0.4); B(0x7e22ce, 0.55, 1.1, 0.55, 0, 1.4, 0, SPH); B(0x15803d, 0.6, 0.2, 0.6, 0, 2.45, 0, CYL); E(1.6, -0.52, 0.16, 0.18); break;
      case 6: B(0x15803d, 1.05, 0.9, 1.05, 0, 0.95, 0, SPH); for (let i = -2; i <= 2; i++) B(0x14532d, 0.1, 1.6, 0.05, i * 0.38, 0.95, -0.98 + Math.abs(i) * 0.12); E(1.15, -1.0, 0.2, 0.25); break;
      case 7: B(0x166534, 0.1, 0.9, 0.1, 0, 2.2, 0, CYL); for (const [x, y, z] of [[0, 1.8, 0], [-0.4, 1.45, 0], [0.4, 1.45, 0], [0, 1.1, 0], [-0.2, 0.75, 0], [0.2, 0.75, 0], [0, 1.45, -0.35]]) B(0x7c3aed, 0.34, 0.34, 0.34, x, y, z, SPH); E(1.5, -0.68, 0.14, 0.17); break;
      case 8: for (const s of [-1, 1]) B(0x374151, 0.35, 0.5, 1.6, s * 0.55, 0.25, 0); B(0x78350f, 0.85, 0.8, 0.85, 0, 1.2, 0, SPH); B(0x4b5563, 0.18, 1.3, 0.18, 0, 1.4, -0.9, CYL, Math.PI / 2); E(1.45, -0.8, 0.17, 0.22); break;
      case 9: stem(1.4); { const h = new THREE.Group(); h.position.set(0, 1.9, 0); g.add(h); bx(h, 0x16a34a, 1.1, 0.5, 1.2, 0, 0.3, -0.3); bx(h, 0xdc2626, 1.0, 0.1, 1.1, 0, 0.04, -0.3); bx(h, 0x16a34a, 1.1, 0.5, 1.2, 0, -0.25, -0.3); for (let i = -2; i <= 2; i++) { bx(h, 0xffffff, 0.1, 0.2, 0.1, i * 0.22, 0.06, -0.92); } g.userData.jaw = h; } break;
      case 10: B(0xf97316, 0.5, 2.0, 0.5, 0, 1.0, 0, CONE, Math.PI); for (let i = -1; i <= 1; i++) B(0x16a34a, 0.12, 0.8, 0.12, i * 0.18, 2.35, 0, CONE, 0, 0, i * 0.4); B(0x111111, 0.7, 0.18, 0.05, 0, 1.6, -0.36); E(1.6, -0.4, 0.15, 0.17); break;
      case 11: B(0x166534, 0.1, 1.6, 0.1, 0, 0.8, 0, CYL); B(0x166534, 1.4, 0.1, 0.1, 0, 1.4, 0); for (const [x, y] of [[-0.7, 1.4], [0.7, 1.4], [0, 2.1]]) { B(0xdc2626, 0.48, 0.45, 0.48, x, y, 0, SPH); eyes(g, y + 0.05, -0.47, 0.12, 0.14); } break;
      case 12: B(0xf5f5f4, 0.4, 1.2, 0.4, 0, 0.6, 0, CYL); B(0xef4444, 1.2, 0.55, 1.2, 0, 1.4, 0, SPH); for (const [x, z] of [[-0.5, -0.6], [0.4, -0.7], [0, -0.95], [0.75, 0.1]]) B(0xffffff, 0.16, 0.16, 0.16, x, 1.7, z, SPH); E(0.85, -0.4, 0.14, 0.16); break;
    }
    return g;
  }
  const seedPic = (t) => snapshot(`pb-p-${t}`, () => plantModel(t), { w: 140, h: 140, dir: [0.7, 0.35, -1], zoom: 0.9 });
  function sproutModel() { const g = new THREE.Group(); bx(g, 0x78350f, 0.9, 0.12, 0.9, 0, 0.06, 0, CYL); bx(g, 0x22c55e, 0.08, 0.6, 0.08, 0, 0.3, 0); bx(g, 0x4ade80, 0.5, 0.06, 0.25, -0.22, 0.6, 0, BOX, 0, 0, 0.4); bx(g, 0x4ade80, 0.5, 0.06, 0.25, 0.22, 0.6, 0, BOX, 0, 0, -0.4); return g; }
  // the bars over a brainrot, and the words over it
  const BAR_BG = new THREE.MeshBasicMaterial({ color: 0x111827, transparent: true, opacity: 0.85, depthWrite: false }), BAR_FG = new THREE.MeshBasicMaterial({ color: 0x22c55e, depthWrite: false }), PLANE = new THREE.PlaneGeometry(1, 1);
  const LAB = new Map();
  function labMat(lines) {
    const k = lines.map((l) => l.join('~')).join('|'); if (LAB.has(k)) return LAB.get(k);
    const c = document.createElement('canvas'), g = c.getContext('2d'); c.width = 360; c.height = lines.reduce((a, l) => a + l[2] * 1.18, 10);
    let y = 6; g.textAlign = 'center'; g.textBaseline = 'top'; g.lineJoin = 'round';
    for (const [txt, col, fs] of lines) { g.font = `800 ${fs}px "Segoe UI",system-ui,sans-serif`; g.lineWidth = 7; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText(txt, 180, y); g.fillStyle = col; g.fillText(txt, 180, y); y += fs * 1.18; }
    const tx = new THREE.CanvasTexture(c); tx.minFilter = THREE.LinearFilter;
    const v = { m: new THREE.SpriteMaterial({ map: tx, transparent: true }), w: 360, h: c.height }; LAB.set(k, v); return v;
  }
  const labSprite = (lines, size) => { const v = labMat(lines), s = new THREE.Sprite(v.m), k = size / 100; s.scale.set(v.w * k, v.h * k, 1); return s; };
  function textSprite(lines, size) {
    const c = document.createElement('canvas'), g = c.getContext('2d'); c.width = 460; c.height = lines.length * 46 + 14;
    g.textAlign = 'center'; g.textBaseline = 'top'; lines.forEach(([t, col], i) => { g.font = `800 ${i ? 32 : 38}px "Segoe UI",system-ui,sans-serif`; g.lineWidth = 7; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText(t, 230, 6 + i * 46); g.fillStyle = col; g.fillText(t, 230, 6 + i * 46); });
    const tx = new THREE.CanvasTexture(c); tx.minFilter = THREE.LinearFilter;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true })); const k = size / 100; s.scale.set(460 * k, c.height * k, 1); return s;
  }
  const dropText = (s) => { if (!s) return; if (s.parent) s.parent.remove(s); s.material.map.dispose(); s.material.dispose(); };
  const SHOT = new THREE.IcosahedronGeometry(1, 0);
  // what you hold: a bat, a seed packet, a brainrot, a tool
  function heldModel(sel, reb) {
    const g = new THREE.Group();
    if (sel === 'bat') { const c = BATS[Math.min(reb, BATS.length - 1)][2]; bx(g, 0x3f2a1e, 0.13, 1.0, 0.13, 0, -1.95, -0.25, CYL, -1.25); bx(g, c, 0.15, 1.2, 0.15, 0, -2.25, -1.25, CYL, -1.25); bx(g, c, 0.24, 1.5, 0.24, 0, -2.65, -2.55, CYL, -1.25); }
    else if (sel[0] === 's') { const t = +sel.slice(1); if (SEEDS[t]) { bx(g, 0xfef3c7, 0.7, 0.9, 0.12, 0, -2.1, -0.4); bx(g, SEEDS[t][9], 0.5, 0.45, 0.13, 0, -2.0, -0.4); } } // (someone else's: whatever they say they hold)
    else if (sel[0] === 'r') { const [t, m, f] = unkey(sel.slice(1)); if (BR[t] && MUT[m] && (f === -1 || SEEDS[f])) { const r = rotModel(t, m, f); r.scale.multiplyScalar(0.32); r.position.set(0, -2.3, -0.9); r.rotation.x = Math.PI / 2; g.add(r); } }
    else if (sel === 'gbanana') { bx(g, 0xfacc15, 0.3, 0.35, 1.3, 0, -2, -0.8); bx(g, 0x854d0e, 0.2, 0.5, 0.2, 0, -2.3, -0.4); }
    else if (sel === 'gblower') { bx(g, 0xe0f2fe, 0.4, 0.4, 1.4, 0, -2, -0.8); bx(g, 0x38bdf8, 0.5, 0.5, 0.3, 0, -2, -1.5); }
    else if (sel === 'gcarrot') { bx(g, 0xf97316, 0.3, 1.6, 0.3, 0, -2, -0.8, CYL, Math.PI / 2); bx(g, 0x16a34a, 0.2, 0.4, 0.2, 0, -2, 0.1, CONE, -Math.PI / 2); }
    else if (sel === 'gbucket') { bx(g, 0x3b82f6, 0.4, 0.6, 0.4, 0, -2.1, -0.5, CYL); bx(g, 0x93c5fd, 0.36, 0.05, 0.36, 0, -1.8, -0.5, CYL); }
    else if (sel === 'ggrenade') { bx(g, 0x7dd3fc, 0.32, 0.32, 0.32, 0, -2.1, -0.5, SPH); bx(g, 0x475569, 0.1, 0.2, 0.1, 0, -1.75, -0.5); }
    return g;
  }

  /* ---------------- the experience ---------------- */
  const PB = {
    id: 'pvb', code: 'pb', genre: 'Tower Defense', rank: 0.001, name: 'Plants vs Brainrots', emoji: '🧠', max: 6, stat: 'Cash', killY: -30, banner: true, camDist: 24,
    land: { theme: 'meadow', fence: 'wood' },
    color: 'linear-gradient(135deg,#22c55e,#a855f7)',
    desc: 'Plant seeds in the rows of your plot, and they fight the brainrots that walk in at the back. Beat one (whack it with your bat too) and it goes in your bag: put it on a podium in your base and it makes money every second. Let one get through and it runs off with 1% of your cash! Buy rarer seeds when the shop restocks, gear from Joel, sell to Barry, fuse plants with brainrots, rebirth, and watch the weather: Gold, Diamond, Frozen, Neon and Rainbow brainrots earn far more. Saved.',
    welcome: 'Plant seeds, catch brainrots!',
    build() {
      sky('#69b7ff', '#e6f6ff'); this.skyKey = 'clear';
      this.npcs = []; this.views = new Map(); this.signs = []; this.locks = []; this.pods = [];
      // the street and the shops
      slab(0, 0, -26, 312, 52, 0x9ca3af, { sy: 2, plain: true });
      part({ x: 0, y: 0.04, z: -8, sx: 312, sy: 0.1, sz: 8, c: 0x4b5563, plain: true, solid: false });
      for (let x = -150; x < 150; x += 10) part({ x, y: 0.1, z: -8, sx: 4, sy: 0.04, sz: 0.4, c: 0xfde047, plain: true, solid: false });
      const stall = (x, z, c, name, who, av) => {
        slab(x, 0.3, z, 16, 10, 0x8b5e34, { sy: 0.3 }); part({ x, y: 1.4, z: z + 2.5, sx: 12, sy: 2.2, sz: 2, c: 0x6b4423 });
        for (let i = 0; i < 6; i++) part({ x: x - 6.25 + i * 2.5, y: 6.4, z: z - 1, sx: 2.5, sy: 0.4, sz: 9, c: i % 2 ? 0xffffff : c, plain: true });
        for (const dx of [-7.5, 7.5]) part({ x: x + dx, y: 3.3, z: z - 4.5, sx: 0.5, sy: 6, sz: 0.5, c: 0x6b4423, plain: true });
        const s = label(name, { size: 2, bg: 'rgba(15,23,42,.8)' }); s.position.set(x, 9, z); place.add(s);
        if (who) { const a = makeAvatar(av, who); a.g.position.set(x, 0.3, z + 4); a.g.rotation.y = Math.PI; place.add(a.g); scene.remove(a.shadow); this.npcs.push(a); }
      };
      stall(SHOP.seed[0], SHOP.seed[1], 0x22c55e, '🌱 SEED SHOP', 'Seed Sally', [3, 2, 2, 1, 0]);
      stall(SHOP.gear[0], SHOP.gear[1], 0x3b82f6, '🛠️ GEAR SHOP', 'Joel', [1, 6, 3, 5, 2]);
      stall(SHOP.sell[0], SHOP.sell[1], 0xfacc15, '💰 SELL', 'Barry', [4, 4, 7, 11, 0]);
      // the fuse machine and the rebirth statue
      { const [x, z] = SHOP.fuse; slab(x, 1, z, 12, 10, 0x4b5563, { sy: 1 }); part({ x, y: 4, z, sx: 8, sy: 5, sz: 6, c: 0x6d28d9 }); part({ x: x - 2.2, y: 4.2, z: z - 3.05, sx: 2.6, sy: 2.6, sz: 0.2, c: 0xa5f3fc, neon: true });
        part({ x: x + 2.2, y: 4.2, z: z - 3.05, sx: 2.6, sy: 2.6, sz: 0.2, c: 0xa3e635, neon: true }); part({ x, y: 7.2, z, sx: 3, sy: 1.6, sz: 3, c: 0xc4b5fd, neon: true });
        const s = label('🧬 FUSE MACHINE', { size: 2, bg: 'rgba(76,29,149,.85)' }); s.position.set(x, 11, z); place.add(s); }
      { const [x, z] = SHOP.reb; slab(x, 1.2, z, 9, 9, 0xe5e7eb, { sy: 1.2 }); slab(x, 2.4, z, 6, 6, 0xd4d4d8, { sy: 1.2 });
        const t = rotModel(10, 1, -1); t.position.set(x, 2.4, z); t.rotation.y = Math.PI; place.add(t); this.statue = t;
        const s = label('♻️ REBIRTH', { size: 2, bg: 'rgba(124,45,18,.85)' }); s.position.set(x, 11, z); place.add(s); }
      // the plots
      for (let p = 0; p < NP; p++) {
        const cx = PX(p), col = PCOL[p], light = new THREE.Color(col).lerp(new THREE.Color(0xffffff), 0.6).getHex();
        slab(cx, 0.2, 16, 44, 28, light, { sy: 0.4 }); // the base
        part({ x: cx, y: 0.5, z: 2.4, sx: 44, sy: 0.6, sz: 0.8, c: col, plain: true }); // its front edge
        slab(cx, 0.1, 69, 44, 74, 0x5a8f3a, { sy: 0.4 }); // the garden
        for (let l = 0; l < 5; l++) {
          const lx = laneX(p, l);
          part({ x: lx, y: 0.14, z: 68, sx: 2.6, sy: 0.12, sz: 70, c: 0xb08150, plain: true, solid: false }); // the path
          for (const s of [-1, 1]) part({ x: lx + s * 2.65, y: 0.16, z: 68, sx: 2.4, sy: 0.12, sz: 66, c: 0x4f8f2f, solid: false });
          const lk = part({ x: lx, y: 0.6, z: 68, sx: 7.6, sy: 1, sz: 70, c: 0x1f2937, alpha: 0.55, solid: false, plain: true });
          const ls = label('🔒', { size: 2.4 }); ls.position.set(lx, 3, 40); place.add(ls); lk.lab = ls;
          (this.locks[p] || (this.locks[p] = []))[l] = lk;
        }
        for (const s of [-1, 1]) part({ x: cx + s * 22.3, y: 0.9, z: 69, sx: 0.6, sy: 1.6, sz: 74, c: 0x6b4423 }); // hedges between the plots
        // the gate the brainrots come out of
        for (const s of [-1, 1]) part({ x: cx + s * 20, y: 4, z: 106, sx: 2, sy: 8, sz: 2, c: 0x581c87 });
        part({ x: cx, y: 8.5, z: 106, sx: 42, sy: 1.6, sz: 2, c: 0x581c87 }); part({ x: cx, y: 4, z: 107.5, sx: 38, sy: 8, sz: 0.4, c: 0xc026d3, neon: true, solid: false, alpha: 0.5 });
        part({ x: cx, y: 4, z: 108.5, sx: 44, sy: 8, sz: 1, c: 0x3b0764, plain: true });
        // podiums
        this.pods[p] = [];
        for (let k = 0; k < 20; k++) { const [x, z] = podPos(p, k); const a = part({ x, y: 0.9, z, sx: 2.6, sy: 1, sz: 2.6, c: 0xf8fafc }); const b = part({ x, y: 1.45, z, sx: 2.2, sy: 0.1, sz: 2.2, c: col, neon: true, solid: false }); a.top = b; this.pods[p].push(a); }
        this.signs[p] = null;
      }
      part({ x: 0, y: 4, z: 110, sx: 312, sy: 8, sz: 1, c: 0x3b0764, plain: true });
    },
    pres() { return { b: -1, pl: '', wr: '', pd: '', cs: 0, ps: 0, rb: 0, ln: 1, hd: 'bat', sw: 0 }; },
    async enter() {
      const s = await kvGet('pvb');
      const D = { cash: 400, inv: [], seeds: { 0: 1 }, plants: [], pods: [], gear: {}, cons: {}, lanes: 1, reb: 0, caught: 0, escaped: 0, dex: {}, buy: { n: -1, got: {} }, fuse: null, at: 0, best: 0 };
      const S = this.S = Object.assign(D, s && typeof s === 'object' ? s : {});
      S.cash = Math.max(0, +S.cash || 0); S.reb = clamp(S.reb | 0, 0, REB.length); S.lanes = clamp(S.lanes | 0, 1, 5);
      const okR = (e) => Array.isArray(e) && BR[e[0]] && MUT[e[1]] && (e[2] === -1 || SEEDS[e[2]]);
      S.inv = (Array.isArray(S.inv) ? S.inv : []).filter(okR).map((e) => [e[0] | 0, e[1] | 0, e[2] | 0]).slice(0, 120);
      S.pods = Array.from({ length: 20 }, (_, k) => (okR((S.pods || [])[k]) ? S.pods[k].map((v) => v | 0) : null));
      S.seeds = S.seeds && typeof S.seeds === 'object' ? S.seeds : {}; for (const k in S.seeds) if (!SEEDS[k] || !(S.seeds[k] > 0)) delete S.seeds[k];
      const open = new Set(ORDER.slice(0, S.lanes)), used = new Set();
      S.plants = (Array.isArray(S.plants) ? S.plants : []).filter((p) => p && SEEDS[p.t] && p.s >= 0 && p.s < 100 && open.has(Math.floor(p.s / 20)) && !used.has(p.s) && used.add(p.s));
      S.gear = S.gear && typeof S.gear === 'object' ? S.gear : {}; S.cons = S.cons && typeof S.cons === 'object' ? S.cons : {}; S.dex = S.dex && typeof S.dex === 'object' ? S.dex : {};
      if (S.fuse && !(SEEDS[S.fuse.p] && okR(S.fuse.r))) S.fuse = null;
      questMax('pvb.rebirth', S.reb); questMax('pvb.catch', S.caught | 0);
      // what your podiums made while you were away (a quarter, up to two hours)
      if (S.at) { const away = clamp((Date.now() - S.at) / 1000, 0, 7200), got = this.rate() * away * 0.25; if (got >= 1) { S.cash += got; setTimeout(() => toast(`💤 While you were away: +${cash(got)}`, '#86efac'), 1200); } }
      this.b = -1; this.rots = []; this.rid = 1; this.spawnT = 3; this.shots = []; this.pcd = new Map(); this.sel = 'bat'; this.swingT = 0; this.hitCd = 0; this.swN = 0; this.toolCd = {};
      this.views = new Map(); this.parsed = new Map(); this.held = new Map(); this.seenSw = new Map(); this.floats = []; this.flakes = null; this.dirty = false; this.saveT = 8; this.sendT = 0; this.syncT = 0;
      this.ghost = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.4, depthWrite: false })); this.ghost.scale.set(2.2, 0.3, 2.2); this.ghost.visible = false; scene.add(this.ghost);
      $('#xhud').insertAdjacentHTML('beforeend', '<div id="pbIce"></div>');
      this.drawBar();
    },
    leave() {
      this.save();
      for (const v of this.views.values()) this.dropView(v);
      for (const s of this.shots) scene.remove(s.m); for (const f of this.floats) dropText(f.s); for (const s of this.signs) dropText(s && s.sp);
      for (const [, h] of this.held) if (h.m && h.m.parent) h.m.parent.remove(h.m);
      if (this.flakes) scene.remove(this.flakes.g); if (this.ghost) scene.remove(this.ghost);
      for (const a of this.npcs || []) dropAvatar(a);
      this.views = new Map(); this.shots = []; this.floats = []; this.held = new Map(); this.flakes = null; this.signs = [];
    },
    save() { if (!this.S) return; this.S.at = Date.now(); this.dirty = false; return kvSet('pvb', this.S); },
    luck() { return 1 + 0.5 * this.S.reb; },
    mult() { return 1 + 0.5 * this.S.reb; },
    rate() { const S = this.S; let r = 0; S.pods.forEach((e, k) => { if (e && k < SLOTS(S.reb)) r += income(e[0], e[1], e[2]); }); return r * this.mult() * (hasItem('cash2') ? 2 : 1); },
    bat() { return BATS[Math.min(this.S.reb, BATS.length - 1)]; },
    send() {
      const S = this.S, nowMs = Date.now();
      send({ b: this.b, cs: Math.floor(S.cash), ps: Math.floor(this.rate()), rb: S.reb, ln: S.lanes, hd: this.sel,
        pl: S.plants.map((p) => `${p.s}.${p.t}.${this.grown(p, nowMs) ? 1 : 0}`).join(','),
        wr: this.rots.slice(0, 22).map((r) => `${r.id}.${r.t}.${r.m}.${r.f + 1}.${r.lane}.${Math.round(r.z * 10)}.${Math.round(clamp(r.hp / r.max, 0, 1) * 63)}`).join(','),
        pd: S.pods.map((e, k) => (e ? `${k}.${e[0]}.${e[1]}.${e[2] + 1}` : '')).filter(Boolean).join(',') });
    },
    spawn() { if (this.b >= 0) return [PX(this.b), 0.5, 16, Math.PI]; return [(Math.random() - 0.5) * 30, 2.2, -26, 0]; },
    statOf(pr, isMe) { return cash(isMe ? (this.S ? this.S.cash : 0) : pr.cs || 0); },
    sortKey(pr, isMe) { return isMe ? (this.S ? this.S.cash : 0) : +pr.cs || 0; },
    menu() { return [['🎒 Bag', () => this.bag()], ['📖 Brainrot index', () => this.index(), 'Index']]; },

    /* ---------------- whose plot is whose ---------------- */
    others() { return Net.peers.filter((p) => !p.isMe && p.presence && p.presence.t); },
    pickPlot() {
      const mine = Net.peers.find((p) => p.isMe), myT = mine && mine.presence ? +mine.presence.t || 0 : Net.t0;
      const taken = new Map(); for (const p of this.others()) { const b = p.presence.b; if (b >= 0 && b < NP) taken.set(b, p); }
      const clash = taken.get(this.b), lose = clash && (+clash.presence.t < myT || (+clash.presence.t === myT && clash.peer < myPeer()));
      if (this.b >= 0 && !lose) return;
      const was = this.b; let b = 0; while (b < NP && taken.has(b)) b++;
      if (b >= NP) return;
      this.b = b; this.rots = []; this.send();
      if (was < 0 || lose) { const s = this.spawn(); P.x = s[0]; P.y = s[1]; P.z = s[2]; P.yaw = cam.yaw = s[3]; P.vx = P.vy = P.vz = 0; say(`🏡 Your plot is the ${['red', 'orange', 'green', 'blue', 'purple', 'pink'][b]} one. Plant seeds in its rows to stop the brainrots!`, '#fde68a'); }
    },
    ownerOf(p) { if (p === this.b) return { me: true }; const q = this.others().find((x) => x.presence.b === p); return q ? { me: false, peer: q.peer, pr: q.presence } : null; },
    parse(key, s, fn) { const c = this.parsed.get(key); if (c && c.s === s) return c.v; const v = fn(String(s || '')); this.parsed.set(key, { s, v }); return v; },

    /* ---------------- plants ---------------- */
    grown(p, nowMs) { return (nowMs || Date.now()) >= p.at + SEEDS[p.t][8] * 1000; },
    spotFree(s) { return !this.S.plants.some((p) => p.s === s); },
    laneOpen(l) { return ORDER.slice(0, this.S.lanes).includes(l); },
    // the free spot nearest a point, in a row you've unlocked
    spotNear(x, z, r) {
      if (this.b < 0) return -1; let best = -1, bd = r;
      for (const l of ORDER.slice(0, this.S.lanes)) for (let k = 0; k < 20; k++) { const s = l * 20 + k, [sx, sz] = spotPos(this.b, s), d = Math.hypot(sx - x, sz - z); if (d < bd && this.spotFree(s)) { bd = d; best = s; } }
      return best;
    },
    plant(t, s) {
      const S = this.S; if (!(S.seeds[t] > 0) || s < 0 || !this.spotFree(s)) return;
      S.seeds[t]--; if (!S.seeds[t]) delete S.seeds[t];
      S.plants.push({ s, t, at: Date.now() }); this.dirty = true;
      const [x, z] = spotPos(this.b, s); puffAt(x, 0.6, z, 0x7c4a1e, 6); sfx('seed');
      if (!S.seeds[t] && this.sel === 's' + t) this.sel = 'bat';
      this.drawBar(); this.send();
    },
    unplant(p) {
      const S = this.S; S.plants = S.plants.filter((q) => q !== p); S.seeds[p.t] = (S.seeds[p.t] || 0) + 1; this.dirty = true;
      const [x, z] = spotPos(this.b, p.s); puffAt(x, 1, z, 0x22c55e, 6); sfx('dig'); toast(`🪴 ${SEEDS[p.t][0]} back in your bag`); this.drawBar(); this.send();
    },

    /* ---------------- brainrots ---------------- */
    roll() {
      const L = this.luck(), w = RAR.map((R, k) => (k ? R.w * L : R.w)), tot = w.reduce((a, b) => a + b, 0);
      let x = Math.random() * tot, r = 0; while (r < RAR.length - 1 && x >= w[r]) { x -= w[r]; r++; }
      const t = BYR[r][Math.floor(Math.random() * BYR[r].length)], wx = weatherAt(now());
      let m = 0;
      if (wx && Math.random() < wx.W.ch) m = wx.W.mut;
      else { const q = Math.random(); m = q < 0.0005 ? 5 : q < 0.003 ? 4 : q < 0.013 ? 2 : q < 0.043 ? 1 : 0; }
      return { t, m };
    },
    spawnRot(o) {
      const S = this.S, open = ORDER.slice(0, S.lanes), lane = o && o.lane != null ? o.lane : open[Math.floor(Math.random() * open.length)], { t, m } = o && o.t != null ? { t: o.t, m: o.m | 0 } : this.roll();
      const hp = BR[t][2] * (1 + 0.15 * S.reb);
      const r = { id: (this.rid = (this.rid % 9999) + 1), t, m, f: -1, lane, z: o && o.z != null ? o.z : Z_SPAWN, hp, max: hp, slow: 0, frz: 0, burn: 0, burnT: 0 };
      this.rots.push(r); return r;
    },
    stepRots(dt, tp) {
      if (this.b < 0) return;
      const S = this.S, open = S.lanes, wx = weatherAt(now());
      if ((this.spawnT -= dt) <= 0) { this.spawnT = 5 / (0.6 + 0.4 * open); if (this.rots.length < 20) this.spawnRot(); }
      for (let i = this.rots.length - 1; i >= 0; i--) {
        const r = this.rots[i];
        if (r.burnT > tp) { r.hp -= r.burn * dt; if (r.hp <= 0) { this.caught(r); continue; } }
        const sp = r.frz > tp ? 0 : SPEED[BR[r.t][1]] * (r.slow > tp ? 0.5 : 1) * (wx && wx.W.slow ? wx.W.slow : 1);
        r.z -= sp * dt;
        if (r.z <= Z_END) { this.rots.splice(i, 1); this.escaped(r); }
      }
    },
    hurt(r, n) {
      if (!(r.hp > 0)) return;
      r.hp -= n; r.hitT = 0.12;
      if (r.hp <= 0) this.caught(r);
    },
    caught(r) {
      const i = this.rots.indexOf(r); if (i < 0) return; this.rots.splice(i, 1);
      const S = this.S, R = BR[r.t][1], e = [r.t, r.m, r.f], v = this.views.get(`R${this.b}.${r.id}`);
      const at = v ? v.g.position : new THREE.Vector3(laneX(this.b, r.lane), 0, r.z);
      puffAt(at.x, 2.5, at.z, r.m ? [0xfacc15, 0xffffff, 0xa855f7] : CONFETTI, 10 + R * 4); sfx(R >= 3 ? 'win' : 'pop', { gap: 60 });
      S.caught++; S.dex[r.t] = 1; this.dirty = true; quest('pvb.catch'); if (R >= 3) quest('pvb.mythic');
      if (R >= 2) earn([0, 0, 2, 5, 15, 40][R], `caught ${/^[AEIOU]/.test(RAR[R].n) ? 'an' : 'a'} ${RAR[R].n.toLowerCase()} brainrot`);
      if (S.inv.length >= 120) { const p = sellPrice(...e); S.cash += p; toast(`🎒 Bag full — sold the ${rotName(...e)} for ${cash(p)}`, '#fde68a'); }
      else { S.inv.push(e); if (R >= 1 || r.m) toast(`🧠 Caught ${rotName(...e)}! (${RAR[R].n})`, r.m ? MUT[r.m].c : RAR[R].c); else this.floaty(`🧠 ${BR[r.t][0]}`, at.x, at.z); }
      this.drawBarSoon();
    },
    escaped(r) {
      const S = this.S, loss = Math.floor(S.cash * 0.01); S.cash -= loss; S.escaped = (S.escaped | 0) + 1; this.dirty = true;
      toast(`🏃 ${rotName(r.t, r.m, r.f)} got away${loss ? ` with ${cash(loss)}` : ''}!`, '#fca5a5'); sfx('oof', { gap: 300 });
    },
    floaty(t, x, z) { const s = textSprite([[t, '#fde68a']], 1.5); s.position.set(x, 7, z); scene.add(s); this.floats.push({ s, t: 1.4 }); },

    /* ---------------- your plants fight ---------------- */
    fight(dt, tp) {
      if (this.b < 0) return;
      const S = this.S, nowMs = Date.now();
      for (const p of S.plants) {
        if (!this.grown(p, nowMs)) continue;
        let cd = (this.pcd.get(p.s) || 0) - dt; if (cd > 0) { this.pcd.set(p.s, cd); continue; }
        const T = SEEDS[p.t], lane = Math.floor(p.s / 20), [px, pz] = spotPos(this.b, p.s);
        let tgt = null, bz = 1e9;
        for (const r of this.rots) if (r.lane === lane && r.hp > 0 && Math.abs(r.z - pz) <= T[5] && r.z < bz) { bz = r.z; tgt = r; }
        if (!tgt) { this.pcd.set(p.s, 0.15); continue; }
        this.pcd.set(p.s, 1 / T[4]);
        const v = this.views.get(`P${this.b}.${p.s}`), tv = this.views.get(`R${this.b}.${tgt.id}`);
        this.fire(T, p.t, v, px, pz, tv, tgt);
      }
    },
    // a plant fires (real: at one of your brainrots, and it does damage; otherwise just for show, on someone else's plot)
    fire(T, t, pv, px, pz, tv, real) {
      if (pv && tv) pv.face = Math.atan2(-(tv.g.position.x - px), -(tv.g.position.z - pz));
      const kind = T[6], dmg = T[3], from = new THREE.Vector3(px, 2, pz), at = () => (tv && tv.g ? tv.g.position.clone().setY(1.8 * (tv.s || 1)) : from.clone());
      const lane = real ? real.lane : -1;
      const splash = (z, rad, n) => { for (const r of this.rots.slice()) if (r.lane === lane && Math.abs(r.z - z) < rad) this.hurt(r, n); };
      if (kind === 'beam') { this.beam(from, at(), T[9]); if (real) this.hurt(real, dmg); return; }
      if (kind === 'chomp') { if (pv) pv.chomp = 0.35; if (real) this.hurt(real, dmg); sfx3('chomp', px, pz, 50, { gap: 80 }); return; }
      const n = kind === 'triple' ? 3 : 1;
      for (let i = 0; i < n; i++) this.shot(from, at, T[9], kind === 'shell' ? 0.5 : kind === 'splash' ? 0.32 : 0.2, kind === 'shell' || kind === 'splash' ? 5 : 0, i * 0.09, real ? (hit) => {
        if (kind === 'splash' || kind === 'shell') { splash(hit.z, kind === 'shell' ? 5.5 : 4, dmg); puffAt(hit.x, 1, hit.z, T[9], 5); }
        else { this.hurt(real, dmg); if (kind === 'burn') { real.burn = dmg * 0.35; real.burnT = performance.now() / 1000 + 3; } }
      } : null);
      if (real) sfx3('shoot', px, pz, 40, { gap: 90, vol: 0.4 });
    },
    shot(from, to, c, size, arc, delay, onHit) { const m = new THREE.Mesh(SHOT, mat(c)); m.scale.setScalar(size); m.visible = false; scene.add(m); this.shots.push({ m, from: from.clone(), to, t: -delay, dur: 0, arc, onHit }); },
    beam(a, b, c) { const d = b.clone().sub(a), l = d.length(), m = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85 })); m.scale.set(0.25, 0.25, l); m.position.copy(a).addScaledVector(d, 0.5); m.lookAt(b); scene.add(m); this.shots.push({ m, beam: 0.12, own: true }); },
    moveShots(dt) {
      for (let i = this.shots.length - 1; i >= 0; i--) {
        const s = this.shots[i];
        if (s.beam != null) { s.beam -= dt; s.m.material.opacity = Math.max(0, s.beam * 7); if (s.beam <= 0) { scene.remove(s.m); s.m.material.dispose(); this.shots.splice(i, 1); } continue; }
        s.t += dt; if (s.t < 0) continue;
        const to = s.to(); if (!s.dur) s.dur = Math.max(0.12, s.from.distanceTo(to) / 34);
        const k = Math.min(1, s.t / s.dur); s.m.visible = true;
        s.m.position.lerpVectors(s.from, to, k); s.m.position.y += Math.sin(k * Math.PI) * s.arc; s.m.rotation.x += dt * 9;
        if (k >= 1) { scene.remove(s.m); this.shots.splice(i, 1); if (s.onHit) s.onHit(to); }
      }
    },

    /* ---------------- you: the bat and the gear ---------------- */
    swing() {
      const tp = performance.now() / 1000; if (tp < this.hitCd || P.dead) return;
      this.hitCd = tp + 0.42; this.swingT = 0.3; this.swN++; send({ sw: this.swN }); sfx('swing');
      if (this.b < 0) return;
      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), dmg = this.bat()[1] * (hasItem('swing') ? 2 : 1); let any = false;
      for (const r of this.rots.slice()) {
        const x = laneX(this.b, r.lane), dx = x - P.x, dz = r.z - P.z, d = Math.hypot(dx, dz), reach = 4.5 + RSCALE[BR[r.t][1]];
        if (d > reach || Math.abs(P.y) > 6) continue;
        if (d > 2.4 && (dx * fx + dz * fz) / d < 0.15) continue;
        this.hurt(r, dmg); any = true; this.dmgFloat(x, r.z, dmg);
      }
      if (any) sfx('hit');
    },
    dmgFloat(x, z, n) { const s = textSprite([[short(n), '#ffffff']], 1.1); s.position.set(x + (Math.random() - 0.5), 5.5, z); scene.add(s); this.floats.push({ s, t: 0.7 }); },
    // the brainrot of yours nearest a point (within r)
    rotNear(x, z, rad) { let best = null, bd = rad; for (const r of this.rots) { const d = Math.hypot(laneX(this.b, r.lane) - x, r.z - z); if (d < bd) { bd = d; best = r; } } return best; },
    useGear(id, h) {
      const S = this.S, G = GEAR[id], tp = performance.now() / 1000;
      if (!G || (G.tool ? !S.gear[id] : !(S.cons[id] > 0))) return;
      if (tp < (this.toolCd[id] || 0)) return;
      const hand = new THREE.Vector3(P.x - Math.sin(P.yaw) * 1.2, P.y + 3.4, P.z - Math.cos(P.yaw) * 1.2);
      if (h) P.yaw = Math.atan2(-(h.x - P.x), -(h.z - P.z));
      if (id === 'banana' || id === 'carrot') {
        if (!h) { toast('Click where to shoot'); return; }
        this.toolCd[id] = tp + (id === 'banana' ? 0.45 : 2);
        const tgt = this.b >= 0 ? this.rotNear(h.x, h.z, id === 'banana' ? 5 : 7) : null, tv = tgt && this.views.get(`R${this.b}.${tgt.id}`);
        const to = tv ? () => tv.g.position.clone().setY(2) : () => new THREE.Vector3(h.x, 0.5, h.z);
        this.shot(hand, to, id === 'banana' ? 0xfacc15 : 0xf97316, id === 'banana' ? 0.3 : 0.5, id === 'carrot' ? 4 : 0, 0, (hit) => {
          if (id === 'banana') { if (tgt) this.hurt(tgt, 120); }
          else { puffAt(hit.x, 1, hit.z, [0xf97316, 0xfacc15, 0x16a34a], 14); sfx('explode', { vol: 0.5 }); for (const r of this.rots.slice()) if (Math.hypot(laneX(this.b, r.lane) - hit.x, r.z - hit.z) < 5) this.hurt(r, 600); }
        });
        sfx(id === 'banana' ? 'shoot' : 'cannon');
      } else if (id === 'blower') {
        this.toolCd[id] = tp + 2.5; const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); let n = 0;
        for (const r of this.rots) { const dx = laneX(this.b, r.lane) - P.x, dz = r.z - P.z, d = Math.hypot(dx, dz); if (d < 16 && (d < 2 || (dx * fx + dz * fz) / d > 0.55)) { r.slow = tp + 5; n++; } }
        puffAt(P.x + fx * 4, 2.5, P.z + fz * 4, [0xffffff, 0xbae6fd], 14); sfx('freeze'); if (n) toast(`🌬️ Slowed ${n} brainrot${n > 1 ? 's' : ''}`, '#bae6fd');
      } else if (id === 'grenade') {
        if (!h) { toast('Click where to throw it'); return; }
        const d = Math.hypot(h.x - P.x, h.z - P.z), k = d > 40 ? 40 / d : 1, to = new THREE.Vector3(P.x + (h.x - P.x) * k, 0.5, P.z + (h.z - P.z) * k);
        S.cons.grenade--; this.dirty = true; this.toolCd[id] = tp + 0.6; this.drawBar();
        this.shot(hand, () => to, 0x7dd3fc, 0.4, 6, 0, (hit) => { puffAt(hit.x, 1.5, hit.z, [0xffffff, 0x7dd3fc, 0xbae6fd], 18); sfx('freeze'); for (const r of this.rots) if (Math.hypot(laneX(this.b, r.lane) - hit.x, r.z - hit.z) < 8) r.frz = performance.now() / 1000 + 4; });
        sfx('whoosh');
      } else if (id === 'bucket') {
        if (!h || this.b < 0) return;
        let best = null, bd = 3.5; for (const p of S.plants) { if (this.grown(p)) continue; const [x, z] = spotPos(this.b, p.s), dd = Math.hypot(x - h.x, z - h.z); if (dd < bd) { bd = dd; best = p; } }
        if (!best) { toast('Click a plant that’s still growing'); return; }
        this.water(best);
      }
    },
    water(p) {
      const S = this.S; if (!(S.cons.bucket > 0) || this.grown(p)) return;
      S.cons.bucket--; p.at = Date.now() - SEEDS[p.t][8] * 1000; this.dirty = true;
      const [x, z] = spotPos(this.b, p.s); puffAt(x, 1.5, z, [0x60a5fa, 0xbfdbfe], 12); sfx('splash'); toast(`🪣 Your ${SEEDS[p.t][0]} has grown!`, '#93c5fd'); this.drawBar(); this.send();
    },
    // put the brainrot you're holding on a podium, or take one off
    placeRot(k) {
      const S = this.S, sel = this.sel; if (sel[0] !== 'r' || this.b < 0 || k < 0 || k >= SLOTS(S.reb) || S.pods[k]) return;
      const e = unkey(sel.slice(1)), i = S.inv.findIndex((q) => rkey(q) === rkey(e)); if (i < 0) return;
      S.inv.splice(i, 1); S.pods[k] = e; this.dirty = true;
      const [x, z] = podPos(this.b, k); puffAt(x, 2.5, z, CONFETTI, 12); sfx('place'); toast(`${rotName(...e)} is making ${cash(income(...e) * this.mult())}/s`, '#86efac');
      if (!S.inv.some((q) => rkey(q) === rkey(e))) this.sel = 'bat';
      this.drawBar(); this.send();
    },
    takeRot(k) {
      const S = this.S, e = S.pods[k]; if (!e) return;
      if (S.inv.length >= 120) { toast('Your bag is full', '#fca5a5'); return; }
      S.pods[k] = null; S.inv.push(e); this.sel = 'r' + rkey(e); this.dirty = true; sfx('select'); this.drawBar(); this.send();
    },
    podNear(x, z, rad, free) { if (this.b < 0) return -1; let best = -1, bd = rad; for (let k = 0; k < SLOTS(this.S.reb); k++) { if (free && this.S.pods[k]) continue; const [px, pz] = podPos(this.b, k), d = Math.hypot(px - x, pz - z); if (d < bd) { bd = d; best = k; } } return best; },
    unlockLane() {
      const S = this.S; if (S.lanes >= 5) return; const c = LANE_COST[S.lanes];
      if (S.cash < c) { toast(`Not enough cash (${cash(c)})`, '#fca5a5'); sfx('error'); return; }
      S.cash -= c; S.lanes++; this.dirty = true; sfx('unlock'); toast(`🔓 Row ${S.lanes} unlocked — more brainrots come now`, '#86efac'); this.send();
    },

    /* ---------------- every frame ---------------- */
    tick(dt) {
      if (!this.S) return;
      const S = this.S, tp = performance.now() / 1000;
      if ((this.pickT = (this.pickT || 0) - dt) <= 0) { this.pickT = 1; this.pickPlot(); }
      this.stepRots(dt, tp); this.fight(dt, tp); this.moveShots(dt);
      // your podiums make money (by the real clock, however slow the frames)
      const nowMs = Date.now(), el = clamp((nowMs - (this.incAt || nowMs)) / 1000, 0, 5); this.incAt = nowMs;
      const got = this.rate() * el; if (got > 0) { S.cash += got; S.best = Math.max(S.best, S.cash); this.dirty = true; }
      if (S.fuse && Date.now() >= S.fuse.until && !S.fuse.told) { S.fuse.told = 1; toast('🧬 Your fusion is ready at the fuse machine!', '#a3e635'); sfx('reward'); }
      this.weather(dt, tp);
      this.drawPlots(dt, tp);
      for (let i = this.floats.length - 1; i >= 0; i--) { const f = this.floats[i]; f.t -= dt; f.s.position.y += dt * 2.5; f.s.material.opacity = Math.min(1, f.t * 2); if (f.t <= 0) { dropText(f.s); this.floats.splice(i, 1); } }
      if (this.statue) this.statue.rotation.y += dt * 0.5;
      RAINBOW.color.setHSL((tp * 0.25) % 1, 0.8, 0.6);
      if (this.swingT > 0) this.swingT -= dt;
      if ((this.sendT -= dt) <= 0) { this.sendT = 0.4; this.send(); }
      if ((this.saveT -= dt) <= 0) { this.saveT = 10; this.save(); }
      if ((this.barT2 = (this.barT2 || 0) - dt) <= 0) { this.barT2 = 1; this.drawBar(); }
    },
    weather(dt, tp) {
      const t = now(), wx = weatherAt(t), key = wx ? wx.W.n : 'clear';
      if (key !== this.skyKey) {
        this.skyKey = key;
        if (wx) { sky(wx.W.sky[0], wx.W.sky[1]); toast(`${wx.W.n}! New brainrots may come out ${MUT[wx.W.mut].n}`, MUT[wx.W.mut].c); sfx('magic'); } else sky('#69b7ff', '#e6f6ff');
        if (this.flakes) { scene.remove(this.flakes.g); this.flakes = null; }
        if (wx) { const g = new THREE.Group(), list = []; for (let i = 0; i < 90; i++) { const m = new THREE.Mesh(wx.W.mut === 2 ? SHOT : BOX, mat(wx.W.fx[i % wx.W.fx.length])); m.scale.setScalar(wx.W.mut === 3 ? 0.18 : 0.22); m.position.set((Math.random() - 0.5) * 70, Math.random() * 30, (Math.random() - 0.5) * 70); g.add(m); list.push(m); } scene.add(g); this.flakes = { g, list }; }
      }
      if (this.flakes) { this.flakes.g.position.set(P.x, 0, P.z); for (const m of this.flakes.list) { m.position.y -= dt * (wx && wx.W.mut === 3 ? 6 : 14); m.rotation.y += dt * 3; if (m.position.y < 0) m.position.y += 30; } }
      const ice = $('#pbIce'); if (ice) { ice.style.opacity = wx && wx.W.mut === 3 ? 1 : 0; ice.style.boxShadow = 'inset 0 0 140px rgba(186,230,253,.75)'; }
      const restock = RESTOCK - (t % RESTOCK);
      setBanner(wx ? `${wx.W.n} · ${MUT[wx.W.mut].n} ×${MUT[wx.W.mut].x} · ${mmss(wx.left)}` : `☀️ Weather in ${mmss(CLEAR - (t % CYCLE))} · 🌱 Restock in ${mmss(restock)}`);
    },
    // everyone's plot: plants, brainrots, podiums, the rows they've unlocked, the sign
    drawPlots(dt, tp) {
      const sync = (this.syncT -= dt) <= 0; if (sync) this.syncT = 0.25;
      const live = new Set(), nowMs = Date.now();
      for (let p = 0; p < NP; p++) {
        const o = this.ownerOf(p), S = this.S;
        let plants = [], rots = [], pods = [], lanes = 1, reb = 0, rate = 0, name = '';
        if (o && o.me) { plants = S.plants.map((q) => ({ s: q.s, t: q.t, g: this.grown(q, nowMs) ? 1 : 0, at: q.at })); rots = this.rots; pods = S.pods.map((e, k) => (e ? [k, e[0], e[1], e[2]] : null)).filter(Boolean); lanes = S.lanes; reb = S.reb; rate = this.rate(); name = Net.name; }
        else if (o) {
          const pr = o.pr;
          plants = this.parse(o.peer + 'pl', pr.pl, (s) => s.split(',').filter(Boolean).map((x) => { const [a, b, c] = x.split('.').map(Number); return { s: a, t: b, g: c }; }).filter((q) => SEEDS[q.t] && q.s >= 0 && q.s < 100));
          rots = this.parse(o.peer + 'wr', pr.wr, (s) => s.split(',').filter(Boolean).map((x) => { const [id, t, m, f, l, z, h] = x.split('.').map(Number); return { id, t, m: MUT[m] ? m : 0, f: f - 1, lane: l, z: z / 10, hpf: h / 63 }; }).filter((q) => BR[q.t] && q.lane >= 0 && q.lane < 5));
          pods = this.parse(o.peer + 'pd', pr.pd, (s) => s.split(',').filter(Boolean).map((x) => { const [k, t, m, f] = x.split('.').map(Number); return [k, t, MUT[m] ? m : 0, f - 1]; }).filter((q) => BR[q[1]] && q[0] >= 0 && q[0] < 20 && (q[3] < 0 || SEEDS[q[3]])));
          lanes = clamp(+pr.ln || 1, 1, 5); reb = clamp(+pr.rb || 0, 0, 9); rate = +pr.ps || 0; name = String(pr.nm || 'Player').slice(0, 20);
        }
        // brainrots walking (every frame)
        for (const r of rots) {
          const key = `R${p}.${r.id}`; live.add(key);
          let v = this.views.get(key);
          if (!v || v.t !== r.t || v.m !== r.m) { if (v) this.dropView(v); v = this.rotView(r.t, r.m, r.f); v.z = r.z; this.views.set(key, v); }
          v.seen = tp; const x = laneX(p, r.lane);
          if (o.me) v.z = r.z; else { v.tz = r.z; if (v.lastTz !== r.z) { v.lastTz = r.z; v.tz0 = tp; } const pred = r.z - (tp - (v.tz0 || tp)) * SPEED[BR[r.t][1]] * 0.9; v.z += (Math.max(Z_END, pred) - v.z) * Math.min(1, dt * 6); }
          const bob = Math.abs(Math.sin(tp * 7 + r.id)) * 0.25;
          v.g.position.set(x, (v.g.userData.fly ? 1.6 + Math.sin(tp * 2 + r.id) * 0.3 : bob), v.z); v.g.rotation.y = Math.PI * 0 + Math.sin(tp * 7 + r.id) * 0.12;
          const hpf = o.me ? clamp(r.hp / r.max, 0, 1) : r.hpf; v.hpf = hpf;
          if (r.hitT > 0) { r.hitT -= dt; v.g.userData.body.scale.setScalar(1 + r.hitT * 1.2); } else v.g.userData.body.scale.setScalar(1);
          v.bar.visible = hpf < 0.995; if (v.bar.visible) { v.fg.scale.x = 2.4 * hpf; v.fg.position.x = -1.2 * (1 - hpf); v.bar.quaternion.copy(camera.quaternion); }
        }
        if (sync) {
          // plants
          for (const q of plants) {
            const key = `P${p}.${q.s}`; live.add(key);
            let v = this.views.get(key);
            if (!v || v.t !== q.t || v.gr !== q.g) { if (v) this.dropView(v); v = this.plantView(p, q.s, q.t, q.g); this.views.set(key, v); if (q.g && v.wasSprout) puffAt(v.g.position.x, 1.5, v.g.position.z, [0x22c55e, 0xfacc15], 8); }
            if (!q.g && o.me) { const k = clamp((nowMs - q.at) / (SEEDS[q.t][8] * 1000), 0, 1); v.g.scale.setScalar(0.6 + k * 0.7); }
          }
          // podiums
          const slots = SLOTS(reb);
          this.pods[p].forEach((a, k) => { const on = k < slots && !!o; if (a.on !== on || a.m.visible !== on) { a.on = a.solid = on; a.m.visible = on; a.top.m.visible = on; } });
          const m = o && o.me ? this.mult() : 1 + 0.5 * reb;
          for (const [k, t, mu, f] of pods) {
            if (k >= slots) continue;
            const key = `D${p}.${k}`; live.add(key);
            let v = this.views.get(key);
            const lab = `${t}.${mu}.${f}.${m}`;
            if (!v || v.lab !== lab) { if (v) this.dropView(v); v = this.podView(p, k, t, mu, f, m); v.lab = lab; this.views.set(key, v); }
          }
          // the rows they've unlocked
          const open = ORDER.slice(0, o ? lanes : 0);
          for (let l = 0; l < 5; l++) { const lk = this.locks[p][l], show = !open.includes(l); if (lk.m.visible !== show) { lk.m.visible = show; lk.lab.visible = show; } }
          // the sign
          const st = o ? `${name}'s plot|${cash(rate)}/s${reb ? ` · ♻️ ${reb}` : ''}` : 'Empty plot|Join in!';
          const sg = this.signs[p];
          if (!sg || sg.t !== st) { if (sg) dropText(sg.sp); const [a, b] = st.split('|'); const sp = textSprite([[a, '#ffffff'], [b, '#86efac']], 1.9); sp.position.set(PX(p), 9, 31.5); scene.add(sp); this.signs[p] = { t: st, sp }; }
        }
        { const sg2 = this.signs[p]; if (sg2) sg2.sp.visible = camera.position.distanceTo(sg2.sp.position) > 18; } // (not right in your face)
        // plants on other plots shoot too (just for show)
        if (o && !o.me) for (const q of plants) {
          if (!q.g) continue;
          const v = this.views.get(`P${p}.${q.s}`); if (!v) continue;
          v.cd = (v.cd || Math.random()) - dt; if (v.cd > 0) continue;
          const T = SEEDS[q.t], lane = Math.floor(q.s / 20), [px, pz] = spotPos(p, q.s);
          let tv = null, bz = 1e9; for (const r of rots) { const rv = this.views.get(`R${p}.${r.id}`); if (r.lane === lane && rv && Math.abs(rv.z - pz) <= T[5] && rv.z < bz) { bz = rv.z; tv = rv; } }
          v.cd = tv ? 1 / T[4] : 0.3; if (tv) this.fire(T, q.t, v, px, pz, tv, null);
        }
      }
      // the views nobody has any more
      for (const [key, v] of this.views) {
        if (live.has(key)) continue;
        if (key[0] === 'R') { if (v.hpf < 0.08 && !key.startsWith(`R${this.b}.`)) puffAt(v.g.position.x, 2.5, v.g.position.z, CONFETTI, 10); } // (someone else's caught one: a puff; yours puffed already)
        else if (!sync) continue;
        this.dropView(v); this.views.delete(key);
      }
      // plants turn to what they shoot at, and chomp
      for (const v of this.views.values()) if (v.kind === 'P') {
        if (v.face != null) { let d = v.face - v.g.rotation.y; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; v.g.rotation.y += d * Math.min(1, dt * 8); }
        if (v.chomp > 0) { v.chomp -= dt; const j = v.g.userData.jaw; if (j) j.scale.y = 0.6 + Math.abs(Math.sin(v.chomp * 18)) * 0.4; }
      }
    },
    rotView(t, m, f) {
      const g = rotModel(t, m, f), R = rarOf(t, f), h = g.userData.h;
      g.rotation.y = 0; scene.add(g);
      const lab = labSprite([[rotName(t, m, f), m ? MUT[m].c : '#ffffff', 30], [R.n, R.c, 24]], 1.3); lab.position.y = h / g.scale.x + 1.2; g.add(lab); lab.scale.multiplyScalar(1 / g.scale.x);
      const bar = new THREE.Group(); bar.position.y = h / g.scale.x + 0.55; bar.scale.setScalar(1 / g.scale.x); g.add(bar);
      const bg = new THREE.Mesh(PLANE, BAR_BG); bg.scale.set(2.5, 0.32, 1); bg.renderOrder = 5; bar.add(bg);
      const fg = new THREE.Mesh(PLANE, BAR_FG); fg.scale.set(2.4, 0.22, 1); fg.position.z = 0.01; fg.renderOrder = 6; bar.add(fg); bar.visible = false;
      return { kind: 'R', g, t, m, f, bar, fg, s: g.scale.x, z: Z_SPAWN, hpf: 1 };
    },
    plantView(p, s, t, grown) {
      const g = grown ? plantModel(t) : sproutModel(), [x, z] = spotPos(p, s);
      g.position.set(x, 0.22, z); g.rotation.y = Math.PI + (Math.floor((s % 20) / 10) ? 0.5 : -0.5); scene.add(g);
      return { kind: 'P', g, t, gr: grown, wasSprout: !grown, face: null };
    },
    podView(p, k, t, m, f, mult) {
      const g = rotModel(t, m, f), [x, z] = podPos(p, k), h = g.userData.h;
      g.position.set(x, 1.5, z); g.rotation.y = Math.PI; scene.add(g);
      const R = rarOf(t, f), lab = labSprite([[rotName(t, m, f), m ? MUT[m].c : '#ffffff', 30], [R.n, R.c, 24], [`${cash(income(t, m, f) * mult)}/s`, '#86efac', 28]], 1.3);
      lab.position.set(x, 1.5 + h + 1.6, z); scene.add(lab);
      return { kind: 'D', g, lab };
    },
    dropView(v) { scene.remove(v.g); if (v.lab) scene.remove(v.lab); },

    /* ---------------- clicking, holding, prompts ---------------- */
    hover(e) {
      this.mouse = e;
      const sel = this.sel || '';
      if (sel[0] !== 's' || this.b < 0) { this.ghost.visible = false; return; }
      const h = pickPlane(e.x, e.y, 0.3), s = h ? this.spotNear(h.x, h.z, 3.2) : -1;
      this.ghost.visible = s >= 0; if (s >= 0) { const [x, z] = spotPos(this.b, s); this.ghost.position.set(x, 0.4, z); }
    },
    click(e) {
      if (!this.S || P.dead) return;
      const sel = this.sel || 'bat', h = pickPlane(e.x, e.y, 0.3);
      if (sel === 'bat') return this.swing();
      if (sel[0] === 's') { const s = h ? this.spotNear(h.x, h.z, 3.2) : -1; if (s < 0) { toast(this.b < 0 ? 'You don’t have a plot yet' : 'Click a free spot in an unlocked row of your plot'); return; } return this.plant(+sel.slice(1), s); }
      if (sel[0] === 'r') { const k = h ? this.podNear(h.x, h.z, 3, true) : -1; if (k < 0) { toast('Click an empty podium in your base'); return; } return this.placeRot(k); }
      if (sel[0] === 'g') return this.useGear(sel.slice(1), h);
    },
    prompts() {
      if (!this.S) return [];
      const out = [], S = this.S, sel = this.sel || '';
      out.push({ x: SHOP.seed[0], z: SHOP.seed[1] + 5, r: 6, text: '🌱 Seed shop', fn: () => this.seedShop() });
      out.push({ x: SHOP.gear[0], z: SHOP.gear[1] + 5, r: 6, text: '🛠️ Joel’s gear shop', fn: () => this.gearShop() });
      out.push({ x: SHOP.sell[0], z: SHOP.sell[1] + 5, r: 6, text: '💰 Sell brainrots to Barry', fn: () => this.sellShop() });
      out.push({ x: SHOP.fuse[0], z: SHOP.fuse[1] + 4, r: 7, text: '🧬 Fuse machine', fn: () => this.fusePanel() });
      out.push({ x: SHOP.reb[0], z: SHOP.reb[1] + 4, r: 6, text: '♻️ Rebirth', fn: () => this.rebirthPanel() });
      if (this.b < 0 || Math.abs(P.x - PX(this.b)) > 23) return out;
      // podiums
      for (let k = 0; k < SLOTS(S.reb); k++) {
        const [x, z] = podPos(this.b, k); if (Math.abs(P.x - x) > 2.6 || Math.abs(P.z - z) > 2.6) continue;
        const e = S.pods[k];
        if (e) out.push({ x, z, r: 2.6, y: 4, text: `🧠 Pick up ${rotName(...e)}`, fn: () => this.takeRot(k) });
        else if (sel[0] === 'r') { const r = unkey(sel.slice(1)); out.push({ x, z, r: 2.6, y: 3, text: `⬇️ Place ${rotName(...r)}`, fn: () => this.placeRot(k) }); }
      }
      // plants, and free spots when you're holding a seed
      for (const p of S.plants) {
        const [x, z] = spotPos(this.b, p.s); if (Math.abs(P.x - x) > 2.2 || Math.abs(P.z - z) > 2.2) continue;
        if (sel === 'gbucket' && !this.grown(p) && S.cons.bucket > 0) out.push({ x, z, r: 2.2, text: `🪣 Water the ${SEEDS[p.t][0]}`, fn: () => this.water(p) });
        else out.push({ x, z, r: 2.2, text: this.grown(p) ? `🪴 Pick up the ${SEEDS[p.t][0]}` : `🌱 ${SEEDS[p.t][0]} (${Math.floor(clamp((Date.now() - p.at) / (SEEDS[p.t][8] * 1000), 0, 1) * 100)}% grown) · pick up`, fn: () => this.unplant(p) });
      }
      if (sel[0] === 's') { const s = this.spotNear(P.x, P.z, 2.6); if (s >= 0) { const [x, z] = spotPos(this.b, s); out.push({ x, z, r: 3, text: `🌱 Plant ${SEEDS[+sel.slice(1)][0]}`, fn: () => this.plant(+sel.slice(1), s) }); } }
      // the next row to unlock
      if (S.lanes < 5) { const l = ORDER[S.lanes], x = laneX(this.b, l); if (Math.abs(P.x - x) < 4 && P.z > 30 && P.z < 46) out.push({ x, z: 37, r: 9, text: `🔓 Unlock this row — ${cash(LANE_COST[S.lanes])}`, fn: () => this.unlockLane() }); }
      return out;
    },
    key(code, down) {
      if (!down) return;
      const m = /^Digit([1-9])$/.exec(code);
      if (m) { const it = this.barItems()[+m[1] - 1]; if (it) this.hold(it.k); return true; }
      if (code === 'KeyQ') { this.hold('bat'); this.swing(); return true; }
      if (code === 'KeyB') { this.bag(); return true; }
      if (code === 'KeyI') { this.index(); return true; }
    },
    menuKey(code) { if (code === 'KeyB' || code === 'KeyI') closePanel(); },
    hold(k) { this.sel = k; sfx('select'); this.drawBar(); this.send(); if (k[0] !== 's') this.ghost.visible = false; },
    // after the walk animation: what everyone's holding, and bat swings
    pose(dt) {
      if (!this.S) return;
      const hands = [['me', me, this.sel, this.S.reb]];
      for (const p of this.others()) { const a = Net.avatars.get(p.peer); if (a) hands.push([p.peer, a, String(p.presence.hd || 'bat'), +p.presence.rb || 0]); const sw = +p.presence.sw || 0, ls = this.seenSw.get(p.peer); if (ls != null && sw !== ls && a) a.pbSwing = 0.3; this.seenSw.set(p.peer, sw); }
      for (const [k, a, sel, reb] of hands) {
        if (!a || a.dead) continue;
        let h = this.held.get(k);
        const want = sel + ':' + (sel === 'bat' ? Math.min(reb, BATS.length - 1) : '');
        if (!h || h.a !== a || h.want !== want) { if (h && h.m && h.m.parent) h.m.parent.remove(h.m); h = { a, want, m: heldModel(sel, reb) }; a.armR.add(h.m); this.held.set(k, h); }
        const sw = k === 'me' ? this.swingT : (a.pbSwing = Math.max(0, (a.pbSwing || 0) - dt));
        a.armR.rotation.x = sw > 0 ? 2.6 - (1 - sw / 0.3) * 2.4 : sel[0] === 'r' ? 1.2 : 0.4;
      }
    },

    /* ---------------- the hotbar and menus ---------------- */
    barItems() {
      const S = this.S, out = [{ k: 'bat', e: '🏏', n: this.bat()[0].replace(' Bat', ''), c: '' }];
      const seeds = Object.keys(S.seeds).map(Number).sort((a, b) => b - a).map((t) => ({ k: 's' + t, e: SEEDS[t][7], n: SEEDS[t][10], c: '×' + S.seeds[t] }));
      const groups = new Map(); for (const e of S.inv) { const k = rkey(e); groups.set(k, (groups.get(k) || 0) + 1); }
      const rots = [...groups].sort((a, b) => income(...unkey(b[0])) - income(...unkey(a[0]))).map(([k, n]) => { const e = unkey(k); return { k: 'r' + k, e: '🧠', n: rotName(...e).split(' ').slice(-2).join(' '), c: '×' + n, pic: rotPic(...e) }; });
      const gear = Object.keys(GEAR).filter((id) => (GEAR[id].tool ? S.gear[id] : S.cons[id] > 0)).map((id) => ({ k: 'g' + id, e: GEAR[id].e, n: GEAR[id].n.split(' ')[0], c: GEAR[id].tool ? '' : '×' + S.cons[id] }));
      const list = out.concat(seeds.slice(0, 3), rots.slice(0, 3), gear).slice(0, 9);
      const cur = this.sel && !list.some((x) => x.k === this.sel) && seeds.concat(rots, gear).find((x) => x.k === this.sel);
      if (cur) list[Math.min(list.length, 8)] = cur;
      return list;
    },
    drawBar() {
      if (!this.S) return;
      clearTimeout(this.barT); this.barT = 0;
      const items = this.barItems();
      if (this.sel !== 'bat' && !this.has(this.sel)) this.sel = 'bat';
      setBar(items.map((x, i) => `<button class="xslot ${this.sel === x.k ? 'on' : ''}" data-k="${x.k}" title="${esc(x.n)}"><span class="k">${i + 1}</span>${x.pic ? `<img class="pic" src="${x.pic}" alt="">` : `<span class="e">${x.e}</span>`}${esc(x.n)}${x.c ? `<span class="n">${x.c}</span>` : ''}</button>`).join('')
        + `<button class="xslot" data-k="bag" title="Your bag (B)"><span class="k">B</span><span class="e">🎒</span>Bag<span class="n">${this.S.inv.length}</span></button>`,
        (b) => { const k = b.dataset.k; if (k === 'bag') this.bag(); else this.hold(k); });
    },
    drawBarSoon() { if (!this.barT) this.barT = setTimeout(() => this.drawBar(), 150); },
    has(sel) {
      const S = this.S; if (!sel) return false;
      if (sel[0] === 's') return S.seeds[sel.slice(1)] > 0;
      if (sel[0] === 'r') return S.inv.some((e) => 'r' + rkey(e) === sel);
      if (sel[0] === 'g') { const id = sel.slice(1), G = GEAR[id]; return !!G && (G.tool ? !!S.gear[id] : S.cons[id] > 0); }
      return sel === 'bat';
    },
    bag() {
      const S = this.S, groups = new Map(); for (const e of S.inv) { const k = rkey(e); groups.set(k, (groups.get(k) || 0) + 1); }
      const seedCards = Object.keys(S.seeds).map(Number).sort((a, b) => b - a).map((t) => `<button class="xp-card pick ${this.sel === 's' + t ? 'sel' : ''}" data-hold="s${t}"><img src="${seedPic(t)}" alt=""><b>${SEEDS[t][7]} ${esc(SEEDS[t][0])}</b><small>×${S.seeds[t]} · ${short(SEEDS[t][3])} dmg</small></button>`).join('');
      const rotCards = [...groups].sort((a, b) => income(...unkey(b[0])) - income(...unkey(a[0]))).map(([k, n]) => { const e = unkey(k), R = rarOf(e[0], e[2]); return `<button class="xp-card pick ${this.sel === 'r' + k ? 'sel' : ''}" data-hold="r${k}"><img src="${rotPic(...e)}" alt=""><b style="color:${e[1] ? MUT[e[1]].c : '#fff'}">${esc(rotName(...e))}</b><small><span class="pb-rar" style="color:${R.c}">${R.n}</span> · ×${n}</small><small>${cash(income(...e) * this.mult())}/s</small></button>`; }).join('');
      const gearCards = Object.keys(GEAR).filter((id) => (GEAR[id].tool ? S.gear[id] : S.cons[id] > 0)).map((id) => `<button class="xp-card pick ${this.sel === 'g' + id ? 'sel' : ''}" data-hold="g${id}"><div class="big">${GEAR[id].e}</div><b>${GEAR[id].n}</b><small>${GEAR[id].tool ? 'Tool' : '×' + S.cons[id]}</small></button>`).join('');
      openPanel('🎒 Bag', `<p class="xp-note">Click something to hold it. Hold a seed and click a spot in your rows to plant it; hold a brainrot and click an empty podium to put it there.</p>
        <h4>🌱 Seeds</h4>${seedCards ? `<div class="pb-grid">${seedCards}</div>` : '<p class="xp-note">No seeds — buy some at the seed shop.</p>'}
        <h4>🧠 Brainrots (${S.inv.length}/120)</h4>${rotCards ? `<div class="pb-grid">${rotCards}</div>` : '<p class="xp-note">None yet — beat some in your rows!</p>'}
        ${gearCards ? `<h4>🛠️ Gear</h4><div class="pb-grid">${gearCards}</div>` : ''}`, (b) => { const k = b.dataset.hold; if (k) { this.hold(k); closePanel(); } }, null, { full: true, extra: `<span class="chip">💰 ${cash(S.cash)}</span>` });
    },
    seedShop() {
      const S = this.S, t = now(), n = Math.floor(t / RESTOCK), r = mulberry(n * 7919 + 13);
      if (S.buy.n !== n) S.buy = { n, got: {} };
      const stock = STOCK.map(([ch, lo, hi]) => { const a = r(), b = r(); return a < ch ? lo + Math.floor(b * (hi - lo + 1)) : 0; });
      const left = (i) => Math.max(0, stock[i] - (S.buy.got[i] || 0));
      openPanel('🌱 Seed shop', `<p class="xp-note">Restocks in ${mmss(RESTOCK - (t % RESTOCK))}. Rarer seeds aren’t in stock every time.</p>` + SEEDS.map((P0, i) => {
        const R = RAR[P0[1]], l = left(i);
        return `<div class="xp-row"><span class="lft"><img src="${seedPic(i)}" alt="" style="width:46px;height:46px"><span><b>${P0[7]} ${esc(P0[0])}</b> <span class="pb-rar" style="color:${R.c}">${R.n}</span><br><small>${short(P0[3])} damage${P0[6] === 'triple' ? ' ×3' : ''} · ${HOW[P0[6]]} · grows in ${P0[8]}s · you have ${S.seeds[i] || 0}</small></span></span>
          <span>${l ? `<small>${l} in stock</small> <button class="xp-btn gold" data-seed="${i}" ${S.cash < P0[2] ? 'disabled' : ''}>${cash(P0[2])}</button>` : '<button class="xp-btn alt" disabled>No stock</button>'}</span></div>`;
      }).join(''), (b) => {
        const i = b.dataset.seed; if (i == null) return; const P0 = SEEDS[i];
        if (S.cash < P0[2] || !left(+i)) return;
        S.cash -= P0[2]; S.buy.got[i] = (S.buy.got[i] || 0) + 1; S.seeds[i] = (S.seeds[i] || 0) + 1; this.dirty = true; sfx('buy'); toast(`${P0[7]} +1 ${P0[0]} seed`, '#86efac');
        if (this.sel === 'bat') this.sel = 's' + i; this.drawBar(); this.seedShop();
      }, null, { full: true, extra: `<span class="chip">💰 ${cash(S.cash)}</span>` });
    },
    gearShop() {
      const S = this.S;
      openPanel('🛠️ Joel’s gear shop', `<div class="xp-grid">${Object.entries(GEAR).map(([k, G]) => `<div class="xp-card ${G.tool && S.gear[k] ? 'on' : ''}"><div class="big">${G.e}</div><b>${G.n}</b><small>${esc(G.d)}</small>${G.tool ? (S.gear[k] ? '<button class="xp-btn alt" disabled>Owned</button>' : `<button class="xp-btn gold" data-g="${k}" ${S.cash < G.price ? 'disabled' : ''}>${cash(G.price)}</button>`) : `<small>You have ${S.cons[k] || 0}</small><button class="xp-btn gold" data-g="${k}" ${S.cash < G.price ? 'disabled' : ''}>${cash(G.price)}</button>`}</div>`).join('')}</div>
        <p class="xp-note">Tools stay yours; buckets and grenades get used up. Hold one (from the bar or your bag) and click to use it.</p>`, (b) => {
        const k = b.dataset.g, G = GEAR[k]; if (!G || S.cash < G.price || (G.tool && S.gear[k])) return;
        S.cash -= G.price; if (G.tool) S.gear[k] = 1; else S.cons[k] = (S.cons[k] || 0) + 1; this.dirty = true; sfx('buy'); toast(`${G.e} ${G.n}!`, '#fde68a'); this.drawBar(); this.gearShop();
      }, null, { extra: `<span class="chip">💰 ${cash(S.cash)}</span>` });
    },
    sellShop() {
      const S = this.S, groups = new Map(); for (const e of S.inv) { const k = rkey(e); groups.set(k, (groups.get(k) || 0) + 1); }
      const rows = [...groups].sort((a, b) => income(...unkey(b[0])) - income(...unkey(a[0]))).map(([k, n]) => { const e = unkey(k), R = rarOf(e[0], e[2]); return `<div class="xp-row"><span class="lft"><img src="${rotPic(...e)}" alt="" style="width:46px;height:46px"><span><b style="color:${e[1] ? MUT[e[1]].c : '#fff'}">${esc(rotName(...e))}</b> ×${n}<br><small><span class="pb-rar" style="color:${R.c}">${R.n}</span> · ${cash(sellPrice(...e))} each</small></span></span><span><button class="xp-btn gold" data-sell="${k}">Sell 1</button> ${n > 1 ? `<button class="xp-btn" data-sellall="${k}">All ${n}</button>` : ''}</span></div>`; }).join('');
      const cheap = S.inv.filter((e) => e[2] < 0 && BR[e[0]][1] <= 1 && !e[1]), cheapV = cheap.reduce((a, e) => a + sellPrice(...e), 0);
      openPanel('💰 Barry buys brainrots', `<p class="xp-note">Barry pays 25 seconds’ worth of what a brainrot makes. Pick a brainrot up off its podium to sell it.</p>
        ${cheap.length ? `<button class="xp-btn gold" data-cheap="1" style="width:100%;margin-bottom:10px">Sell every plain Rare & Epic (${cheap.length}) for ${cash(cheapV)}</button>` : ''}${rows || '<p class="xp-note">Your bag has no brainrots in it.</p>'}`, (b) => {
        let take = [];
        if (b.dataset.cheap) take = cheap.slice();
        else if (b.dataset.sell) take = [S.inv.find((e) => rkey(e) === b.dataset.sell)].filter(Boolean);
        else if (b.dataset.sellall) take = S.inv.filter((e) => rkey(e) === b.dataset.sellall);
        if (!take.length) return;
        let got = 0; for (const e of take) { const i = S.inv.indexOf(e); if (i >= 0) { S.inv.splice(i, 1); got += sellPrice(...e); } }
        S.cash += got; this.dirty = true; sfx('sell'); toast(`💰 +${cash(got)}`, '#fde68a'); this.drawBar(); this.sellShop();
      }, null, { full: true, extra: `<span class="chip">💰 ${cash(S.cash)}</span>` });
    },
    fusePanel(pick) {
      const S = this.S;
      if (S.reb < 1) { openPanel('🧬 Fuse machine', '<p class="xp-note">The fuse machine turns a plant and a brainrot into a new, much richer brainrot. It opens after your first rebirth.</p>', null, null, {}); return; }
      if (S.fuse) {
        const left = Math.max(0, (S.fuse.until - Date.now()) / 1000), e = [S.fuse.r[0], S.fuse.r[1], S.fuse.p];
        openPanel('🧬 Fuse machine', `<div class="pb-fuse"><div class="slot"><img src="${rotPic(...e)}" alt=""></div></div><p style="text-align:center"><b>${esc(rotName(...e))}</b><br><small>${cash(income(...e) * this.mult())}/s</small></p>
          ${left > 0 ? `<div class="meter"><i style="width:${100 - (left / FUSE_SECS) * 100}%"></i></div><p class="xp-note">Ready in ${mmss(left)}</p>` : '<button class="xp-btn gold" data-take="1" style="width:100%">Take it!</button>'}`, (b) => {
          if (!b.dataset.take || !S.fuse || Date.now() < S.fuse.until) return;
          if (S.inv.length >= 120) { toast('Your bag is full', '#fca5a5'); return; }
          S.inv.push(e); S.fuse = null; this.dirty = true; sfx('win'); puffAt(SHOP.fuse[0], 6, SHOP.fuse[1], [0xa3e635, 0xc4b5fd, 0xffffff], 24); toast(`🧬 ${rotName(...e)}!`, '#a3e635'); earn(20, 'fused a brainrot'); this.sel = 'r' + rkey(e); this.drawBar(); closePanel();
        }, null, {});
        return;
      }
      const sp = this.fp || (this.fp = { s: -1, r: '' });
      const seeds = Object.keys(S.seeds).map(Number), groups = new Map(); for (const e of S.inv) if (e[2] < 0) { const k = rkey(e); groups.set(k, (groups.get(k) || 0) + 1); }
      if (sp.s >= 0 && !(S.seeds[sp.s] > 0)) sp.s = -1; if (sp.r && !groups.has(sp.r)) sp.r = '';
      const out = sp.s >= 0 && sp.r ? [unkey(sp.r)[0], unkey(sp.r)[1], sp.s] : null;
      openPanel('🧬 Fuse machine', `<div class="pb-fuse"><div class="slot">${sp.s >= 0 ? `<img src="${seedPic(sp.s)}" alt="">` : 'Pick a plant'}</div>+<div class="slot">${sp.r ? `<img src="${rotPic(...unkey(sp.r))}" alt="">` : 'Pick a brainrot'}</div>=<div class="slot">${out ? `<img src="${rotPic(...out)}" alt="">` : '?'}</div></div>
        ${out ? `<p style="text-align:center"><b>${esc(rotName(...out))}</b> · ${cash(income(...out) * this.mult())}/s (×${3 + SEEDS[sp.s][1]})</p><button class="xp-btn gold" data-go="1" style="width:100%">Fuse! (takes ${FUSE_SECS} seconds)</button>` : '<p class="xp-note">A fused brainrot makes 3× (or more, with a rarer plant) what the brainrot did. The plant and the brainrot go into the machine.</p>'}
        <h4>🌱 A plant</h4>${seeds.length ? `<div class="pb-grid">${seeds.map((t) => `<button class="xp-card pick ${sp.s === t ? 'sel' : ''}" data-fs="${t}"><img src="${seedPic(t)}" alt=""><b>${esc(SEEDS[t][0])}</b><small>×${S.seeds[t]}</small></button>`).join('')}</div>` : '<p class="xp-note">No seeds in your bag.</p>'}
        <h4>🧠 A brainrot</h4>${groups.size ? `<div class="pb-grid">${[...groups].map(([k, n]) => `<button class="xp-card pick ${sp.r === k ? 'sel' : ''}" data-fr="${k}"><img src="${rotPic(...unkey(k))}" alt=""><b>${esc(rotName(...unkey(k)))}</b><small>×${n}</small></button>`).join('')}</div>` : '<p class="xp-note">No brainrots in your bag (pick them up off their podiums first).</p>'}`, (b) => {
        const el = b;
        if (el.dataset.fs != null) { sp.s = sp.s === +el.dataset.fs ? -1 : +el.dataset.fs; this.fusePanel(); return; }
        if (el.dataset.fr != null) { sp.r = sp.r === el.dataset.fr ? '' : el.dataset.fr; this.fusePanel(); return; }
        if (b.dataset.go && out) {
          const i = S.inv.findIndex((e) => rkey(e) === sp.r); if (i < 0 || !(S.seeds[sp.s] > 0)) return;
          S.inv.splice(i, 1); S.seeds[sp.s]--; if (!S.seeds[sp.s]) delete S.seeds[sp.s];
          S.fuse = { p: sp.s, r: [out[0], out[1], -1], until: Date.now() + FUSE_SECS * 1000 }; this.fp = null; this.dirty = true; sfx('magic'); this.drawBar(); this.fusePanel();
        }
      }, null, { full: true });
    },
    has2(t) { const S = this.S; return S.inv.some((e) => e[0] === t && e[2] < 0) || S.pods.some((e) => e && e[0] === t && e[2] < 0); },
    rebirthReady() { const S = this.S, R0 = S && REB[S.reb]; return !!R0 && S.cash >= R0[0] && R0[1].every((t) => this.has2(t)); },
    rebirthPanel() {
      const S = this.S, R0 = REB[S.reb];
      if (!R0) { openPanel('♻️ Rebirth', `<p class="xp-note">You’ve rebirthed ${S.reb} times — that’s all of them! Your bat is the ${this.bat()[0]}.</p>`, null, null, {}); return; }
      const [cost, need] = R0, have = need.map((t) => this.has2(t)), can = S.cash >= cost && have.every(Boolean);
      openPanel('♻️ Rebirth', `<div class="xp-row"><span class="lft"><span class="ico">💰</span><span><b>${cash(cost)}</b><br><small>You have ${cash(S.cash)}</small></span></span>${S.cash >= cost ? '✅' : '❌'}</div>
        ${need.map((t, i) => `<div class="xp-row"><span class="lft"><img src="${rotPic(t, 0, -1)}" alt="" style="width:46px;height:46px"><span><b>${esc(BR[t][0])}</b><br><small style="color:${RAR[BR[t][1]].c}">${RAR[BR[t][1]].n} (any mutation)</small></span></span>${have[i] ? '✅' : '❌'}</div>`).join('')}
        <p class="xp-note">Rebirth ${S.reb + 1} takes your cash and those two brainrots. In return: cash and luck ×${(1 + 0.5 * (S.reb + 1)).toFixed(1)}, the ${BATS[Math.min(S.reb + 1, BATS.length - 1)][0]} (${short(BATS[Math.min(S.reb + 1, BATS.length - 1)][1])} damage), ${SLOTS(S.reb + 1) - SLOTS(S.reb) ? `${SLOTS(S.reb + 1) - SLOTS(S.reb)} more podiums` : 'tougher, richer brainrots'}${S.reb === 0 ? ', and the fuse machine' : ''}. Your plants, seeds, gear, rows and other brainrots stay.</p>
        <button class="xp-btn ${can ? 'gold' : 'alt'}" data-rb="1" ${can ? '' : 'disabled'} style="width:100%">${can ? 'Rebirth!' : 'Not yet'}</button>`, (b) => {
        if (!b.dataset.rb || !(S.cash >= cost && need.every((t) => this.has2(t)))) return;
        for (const t of need) { const i = S.inv.findIndex((e) => e[0] === t && e[2] < 0); if (i >= 0) S.inv.splice(i, 1); else { const k = S.pods.findIndex((e) => e && e[0] === t && e[2] < 0); if (k >= 0) S.pods[k] = null; } }
        S.reb++; S.cash = 0; this.dirty = true; this.save(); this.send(); this.drawBar(); closePanel();
        toast(`♻️ Rebirth ${S.reb}! Cash and luck ×${this.mult().toFixed(1)} · ${this.bat()[0]}`, '#fde68a'); sfx('levelup'); puffAt(P.x, P.y + 3, P.z, CONFETTI, 30);
        earn(100, `rebirth ${S.reb} in Plants vs Brainrots`); questMax('pvb.rebirth', S.reb);
      }, null, { extra: `<span class="chip">♻️ ${S.reb}</span>` });
    },
    index() {
      const S = this.S, n = Object.keys(S.dex).length;
      openPanel('📖 Brainrot index', RAR.map((R, r) => `<h4 style="color:${R.c}">${R.n}</h4><div class="pb-grid">${BYR[r].map((t) => `<div class="xp-card ${S.dex[t] ? '' : 'dim'}"><img src="${rotPic(t, 0, -1)}" alt=""><b>${S.dex[t] ? esc(BR[t][0]) : '???'}</b><small>${cash(BR[t][3])}/s · ${short(BR[t][2])} ❤️</small></div>`).join('')}</div>`).join('')
        + `<p class="xp-note">Gold brainrots make ×2, Diamond ×3, Frozen ×4, Neon ×5 and Rainbow ×10. Weather makes them far more likely.</p>`, null, null, { full: true, extra: `<span class="chip">📖 ${n}/${BR.length}</span><span class="chip">🧠 ${S.caught} caught</span>` });
    },
    hud() {
      if (!this.S) return '';
      const S = this.S, sel = this.sel || 'bat';
      const holding = sel === 'bat' ? `🏏 ${this.bat()[0]}` : sel[0] === 's' ? `${SEEDS[+sel.slice(1)][7]} ${SEEDS[+sel.slice(1)][0]} seed` : sel[0] === 'r' ? `🧠 ${rotName(...unkey(sel.slice(1)))}` : `${GEAR[sel.slice(1)].e} ${GEAR[sel.slice(1)].n}`;
      return `💰 <b>${cash(S.cash)}</b> · 📈 ${cash(this.rate())}/s · ${holding}${S.reb ? ` · ♻️ ${S.reb}` : ''}`;
    },
    coinShop: [
      { id: 'cash2', e: '💰', n: '2× Money', d: 'Your brainrots make twice the cash, for good', price: 700, kind: 'pass' },
      { id: 'swing', e: '🏏', n: 'Mighty Swing', d: 'Your bat hits twice as hard, for good', price: 500, kind: 'pass' },
      { id: 'crate', e: '🌱', n: 'Seed Crate', d: '3 surprise seeds, sometimes a rare one, right now', price: 40, kind: 'now' },
    ],
    shopCan(id) { return id === 'crate' && !this.S ? 'Loading…' : ''; },
    onBuy(id) {
      if (id !== 'crate') return;
      const got = [];
      for (let i = 0; i < 3; i++) { const r = Math.random(), t = r < 0.05 ? 6 + Math.floor(Math.random() * 2) : r < 0.2 ? 4 + Math.floor(Math.random() * 2) : r < 0.5 ? 2 + Math.floor(Math.random() * 2) : Math.floor(Math.random() * 2); this.S.seeds[t] = (this.S.seeds[t] || 0) + 1; got.push(SEEDS[t][7]); }
      this.dirty = true; this.drawBar(); toast(`🌱 ${got.join(' ')} seeds!`, '#86efac');
    },
    // trading: brainrots from your bag, and seeds (one at a time)
    tradeName: 'Brainrots & seeds',
    tradeItems() {
      const S = this.S; if (!S) return [];
      const out = S.inv.map((e, i) => ({ k: 'r' + trKey(i, e), e: '🧠', n: `${rotName(...e)} (${RAR[rarOf(e[0], e[2])].n})`, d: { r: e } }));
      for (const t in S.seeds) if (S.seeds[t] > 0 && SEEDS[t]) out.push({ k: 's:' + t, e: SEEDS[t][7], n: `${SEEDS[t][0]} seed (you have ${S.seeds[t]})`, d: { s: +t } });
      return out;
    },
    tradeTake(k) {
      const S = this.S;
      if (k[0] === 'r') { const i = trFind(S.inv, k.slice(1)); if (i >= 0) S.inv.splice(i, 1); }
      else if (k.startsWith('s:')) { const t = k.slice(2); if (S.seeds[t] > 0) { S.seeds[t]--; if (!S.seeds[t]) delete S.seeds[t]; if (this.sel === 's' + t && !S.seeds[t]) this.sel = 'bat'; } }
      this.dirty = true; this.save(); this.drawBar();
    },
    tradeGive(d) {
      const S = this.S; if (!d || typeof d !== 'object') return;
      const e = d.r; if (Array.isArray(e) && BR[e[0] | 0] && MUT[e[1] | 0] && (e[2] === -1 || SEEDS[e[2] | 0]) && S.inv.length < 120) S.inv.push([e[0] | 0, e[1] | 0, e[2] | 0]);
      else if (SEEDS[d.s]) S.seeds[d.s] = (S.seeds[d.s] || 0) + 1;
      this.dirty = true; this.save(); this.drawBar();
    },
  };
  addExp(PB);
  PB.W = WEATHER; PB.consts = { SEEDS, BR, GEAR, REB, PX, spotPos, podPos, laneX }; window.__rbPB = PB; // for tests
})();
