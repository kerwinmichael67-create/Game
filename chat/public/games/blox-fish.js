/* =====================================================================
   BLOXVERSE — FISHING. Cast into the lake, the ocean, a frozen pond or
   a lake of lava; when a fish bites, hook it and reel it in by keeping
   it inside your bar. 37 kinds of fish (Trash to Mythical), heavier and
   ✨ shiny ones worth more. Sell your catch, buy better rods, fill your
   📖 fish book. Saved; everyone sees your line.
   ===================================================================== */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    #fiGame{position:absolute;left:50%;bottom:calc(var(--barH,84px) + 70px);transform:translateX(-50%);width:min(520px,calc(100vw - 30px));pointer-events:auto;display:flex;flex-direction:column;gap:8px;align-items:stretch}
    #fiGame .tip{text-align:center;font:600 16px var(--fh);text-shadow:0 2px 0 rgba(0,0,0,.5)}
    #fiGame .track{position:relative;height:46px;border-radius:14px;background:linear-gradient(180deg,#0c4a6e,#082f49);border:3px solid rgba(255,255,255,.25);box-shadow:0 6px 18px rgba(0,0,0,.4);overflow:hidden}
    #fiGame .zone{position:absolute;top:3px;bottom:3px;border-radius:9px;background:rgba(134,239,172,.42);border:2px solid #86efac}
    #fiGame .zone.on{background:rgba(134,239,172,.7)}
    #fiGame .fish{position:absolute;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px;font-size:28px;line-height:34px;text-align:center;filter:drop-shadow(0 2px 0 rgba(0,0,0,.5))}
    #fiGame .prog{height:12px;border-radius:8px;background:rgba(0,0,0,.45);overflow:hidden;border:2px solid rgba(255,255,255,.2)}
    #fiGame .prog i{display:block;height:100%;background:linear-gradient(90deg,#fde047,#22c55e)}
    #fiGame .row{display:flex;gap:8px;justify-content:center}
    #fiGame .big{flex:1;max-width:260px;padding:12px 0;border-radius:16px;border:0;font:600 19px var(--fh);color:#fff;cursor:pointer;background:linear-gradient(180deg,#38bdf8,#0284c7);box-shadow:0 5px 0 #075985;touch-action:none;user-select:none}
    #fiGame .big.hold{transform:translateY(3px);box-shadow:0 2px 0 #075985}
    #fiGame .power{height:14px;border-radius:8px;background:rgba(0,0,0,.45);overflow:hidden;border:2px solid rgba(255,255,255,.25)}
    #fiGame .power i{display:block;height:100%;background:linear-gradient(90deg,#22c55e,#fde047,#ef4444)}
    #fiCatch{position:absolute;inset:0;display:grid;place-items:center;pointer-events:auto;background:radial-gradient(circle,rgba(0,0,0,.2),rgba(0,0,0,.65));z-index:5;cursor:pointer}
    #fiCatch .card{width:250px;border-radius:24px;padding:16px;text-align:center;background:linear-gradient(180deg,#1f2937,#0f172a);border:3px solid var(--rc);box-shadow:0 0 50px var(--rc);animation:fiPop .45s cubic-bezier(.2,1.6,.5,1)}
    #fiCatch img{width:200px;height:130px;object-fit:contain}
    #fiCatch b{display:block;font:600 24px var(--fh);color:#fff}
    #fiCatch span{font:700 15px var(--fh);color:var(--rc)}
    #fiCatch small{display:block;color:#e2e8f0;font:700 14px var(--fb);margin-top:6px}
    #fiCatch em{display:block;font:600 14px var(--fh);color:#fde047;font-style:normal;margin-top:4px}
    @keyframes fiPop{from{transform:scale(.3);opacity:0}}
    .fi-card img{width:100%;height:64px;object-fit:contain}
    .fi-card.unk img{filter:brightness(0) opacity(.5)}
    .fi-card .v{color:#86efac;font:700 12px var(--fh)}
    .touchy #fiGame{bottom:calc(var(--barH,84px) + 188px)}
    @media (max-width:640px){.touchy #fiGame{bottom:calc(var(--barH,84px) + 224px)}}`;
  document.head.append(style);

  /* ---------------- fish ---------------- */
  const short = (n) => { n = Math.floor(n || 0); if (n < 1000) return String(n); const u = ['K', 'M', 'B', 'T']; let i = -1; while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; } return (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)).replace(/\.?0+$/, '') + u[i]; };
  const kgs = (k) => (k >= 100 ? Math.round(k).toLocaleString() : k >= 10 ? k.toFixed(1) : k.toFixed(2)) + ' kg';
  // name, weight, chance, colour
  const RAR = [['Trash', 0.6, 8, '#9ca3af'], ['Common', 1, 50, '#e5e7eb'], ['Uncommon', 1.6, 25, '#4ade80'], ['Rare', 2.4, 11, '#60a5fa'], ['Epic', 3.4, 4.5, '#c084fc'], ['Legendary', 4.6, 1.2, '#fbbf24'], ['Mythical', 6, 0.3, '#f43f5e']];
  // name, rarity, typical kg, typical price, [body, fin], where, shape
  const FISH = [
    ['Old Boot', 0, 1, 2, [0x5b4636, 0x3b2a1e], 'lake', 'boot'], ['Seaweed', 0, 0.5, 1, [0x2f855a, 0x276749], 'lake', 'weed'],
    ['Bluegill', 1, 0.4, 12, [0x3b82f6, 0xfbbf24], 'lake'], ['Perch', 1, 0.6, 15, [0xd9b13b, 0x3f6212], 'lake'], ['Carp', 2, 4, 40, [0xb7791f, 0x92400e], 'lake'], ['Rainbow Trout', 2, 2, 45, [0x94a3b8, 0xf472b6], 'lake'],
    ['Largemouth Bass', 3, 3, 90, [0x4d7c0f, 0xd9f99d], 'lake'], ['Pike', 3, 6, 120, [0x65a30d, 0xfef08a], 'lake', 'long'], ['Catfish', 4, 12, 260, [0x57534e, 0xa8a29e], 'lake'], ['Sturgeon', 5, 40, 900, [0x475569, 0xcbd5e1], 'lake', 'long'],
    ['Golden Koi', 5, 3, 1100, [0xf59e0b, 0xfff7ed], 'lake'], ['Lake Serpent', 6, 120, 5000, [0x166534, 0x86efac], 'lake', 'long'],
    ['Tin Can', 0, 0.2, 2, [0x9ca3af, 0xdc2626], 'ocean', 'can'], ['Sardine', 1, 0.1, 10, [0x93c5fd, 0xe0f2fe], 'ocean'], ['Mackerel', 1, 0.8, 18, [0x1e3a8a, 0x93c5fd], 'ocean'], ['Cod', 2, 6, 55, [0xa8a29e, 0xe7e5e4], 'ocean'],
    ['Red Snapper', 2, 4, 60, [0xdc2626, 0xfecaca], 'ocean'], ['Pufferfish', 3, 1, 150, [0xfde68a, 0x854d0e], 'ocean', 'puff'], ['Tuna', 3, 60, 220, [0x1e40af, 0xfacc15], 'ocean'], ['Swordfish', 4, 120, 520, [0x334155, 0x94a3b8], 'ocean', 'sword'],
    ['Hammerhead Shark', 5, 250, 1800, [0x64748b, 0xe2e8f0], 'ocean', 'shark'], ['Giant Squid', 5, 300, 2400, [0xbe123c, 0xfda4af], 'deep', 'squid'], ['Kraken', 6, 900, 12000, [0x7e22ce, 0xe9d5ff], 'deep', 'squid'],
    ['Ice Cube', 0, 0.3, 3, [0xbae6fd, 0xe0f2fe], 'ice', 'cube'], ['Ice Minnow', 1, 0.05, 25, [0xe0f2fe, 0x7dd3fc], 'ice'], ['Arctic Char', 2, 3, 90, [0xfb7185, 0xf1f5f9], 'ice'], ['Glacier Salmon', 3, 6, 220, [0xf97316, 0xe0f2fe], 'ice'],
    ['Frost Eel', 4, 8, 480, [0x67e8f9, 0xecfeff], 'ice', 'long'], ['Narwhal', 5, 900, 4200, [0xcbd5e1, 0xf8fafc], 'ice', 'narwhal'], ['Crystal Fish', 6, 2, 15000, [0xa5f3fc, 0xf0abfc], 'ice'],
    ['Charcoal', 0, 0.5, 6, [0x1c1917, 0x44403c], 'lava', 'cube'], ['Ember Snapper', 2, 3, 260, [0xf97316, 0xfde047], 'lava'], ['Magma Eel', 3, 7, 600, [0xb91c1c, 0xf97316], 'lava', 'long'], ['Obsidian Ray', 4, 20, 1500, [0x1e1b4b, 0xa855f7], 'lava', 'flat'],
    ['Lava Lobster', 4, 5, 1700, [0xdc2626, 0xfdba74], 'lava', 'crab'], ['Molten Shark', 5, 300, 9000, [0x7f1d1d, 0xfb923c], 'lava', 'shark'], ['Phoenix Fish', 6, 5, 40000, [0xfbbf24, 0xef4444], 'lava'],
  ];
  const PLACES = {
    lake: { n: 'Sunny Lake', e: '🏞️' }, ocean: { n: 'Open Ocean', e: '🌊' }, deep: { n: 'Deep Ocean', e: '🌊' }, ice: { n: 'Frozen Pond', e: '❄️' }, lava: { n: 'Magma Lake', e: '🌋' },
  };
  // the fish you can catch in a place (the deep ocean has the ocean's too)
  const poolOf = (pl) => FISH.map((f, i) => i).filter((i) => FISH[i][5] === pl || (pl === 'deep' && FISH[i][5] === 'ocean'));
  // luck: better odds of rare ones · lure: how soon a fish bites · control: your bar's size · reel: how fast you reel in
  const RODS = [
    { n: 'Flimsy Rod', price: 0, luck: 0, lure: 1, control: 0.22, reel: 1, c: 0x8b5a2b },
    { n: 'Plastic Rod', price: 250, luck: 0.15, lure: 0.9, control: 0.25, reel: 1.1, c: 0x22c55e },
    { n: 'Carbon Rod', price: 1200, luck: 0.3, lure: 0.8, control: 0.28, reel: 1.25, c: 0x1f2937 },
    { n: 'Steady Rod', price: 3500, luck: 0.25, lure: 0.85, control: 0.38, reel: 1.15, steady: 0.6, c: 0x0ea5e9 },
    { n: 'Fast Rod', price: 3500, luck: 0.25, lure: 0.5, control: 0.27, reel: 1.35, c: 0xf97316 },
    { n: 'Lucky Rod', price: 9000, luck: 0.9, lure: 0.8, control: 0.3, reel: 1.2, c: 0x16a34a },
    { n: 'Magma Rod', price: 16000, luck: 0.5, lure: 0.75, control: 0.32, reel: 1.4, lava: true, c: 0xb91c1c },
    { n: 'Rod of the Depths', price: 60000, luck: 1.4, lure: 0.6, control: 0.36, reel: 1.6, lava: true, c: 0x4c1d95 },
  ];
  const BAG = 40, bagMax = () => BAG + (hasItem('bag') ? 40 : 0); // (a Big Bag from the shop holds more)
  const valueOf = (f, kg, shiny) => Math.max(1, Math.round(FISH[f][3] * Math.pow(kg / FISH[f][2], 0.85) * (shiny ? 2 : 1)));

  /* ---------------- the water ---------------- */
  // each: where its surface is, and the shape (a box, or a circle)
  const WATERS = [
    { k: 'lake', y: -0.5, x0: -130, x1: -62, z0: -12, z1: 62 },
    { k: 'ocean', y: -0.5, x0: -240, x1: 240, z0: -260, z1: -12 },
    { k: 'ice', y: 7.5, x0: 78, x1: 98, z0: 16, z1: 36 },
    { k: 'lava', y: 3.2, x0: -54.5, x1: -37.5, z0: -130.5, z1: -113.5 },
  ];
  const inWater = (w, x, z) => (w.r ? Math.hypot(x - w.cx, z - w.cz) < w.r : x > w.x0 && x < w.x1 && z > w.z0 && z < w.z1);
  function waterAt(x, z) {
    for (const w of WATERS) if (inWater(w, x, z) && groundBelow(x, w.y + 3, z) < w.y - 0.6) return w;
    return null;
  }
  const placeOf = (w, z) => (w.k === 'ocean' && z < -80 ? 'deep' : w.k);

  /* ---------------- models ---------------- */
  function fishMesh(f) {
    const [, , , , [c1, c2], , shape] = FISH[f], g = new THREE.Group();
    const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
    const box = (c, sx, sy, sz, x, y, z) => { const o = new THREE.Mesh(BOX, lam(c)); o.scale.set(sx, sy, sz); o.position.set(x, y, z); g.add(o); return o; };
    const ball = (c, r, sx, sy, sz, x, y, z) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), lam(c)); o.scale.set(sx, sy, sz); o.position.set(x, y, z); g.add(o); return o; };
    const eye = (x, y, z) => { ball(0xffffff, 0.12, 1, 1, 1, x, y, z); ball(0x111111, 0.07, 1, 1, 1, x - 0.04, y, z + 0.05); };
    if (shape === 'boot') { box(c1, 0.6, 1.2, 0.6, 0, 0.6, 0); box(c1, 1.2, 0.5, 0.6, -0.3, 0.05, 0); box(c2, 1.25, 0.12, 0.65, -0.3, -0.22, 0); }
    else if (shape === 'weed') { for (let i = 0; i < 5; i++) { const o = box(i % 2 ? c1 : c2, 0.18, 1.6, 0.08, -0.4 + i * 0.2, 0.1, 0); o.rotation.z = (i - 2) * 0.15; } }
    else if (shape === 'can') { const o = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1, 14), lam(c1)); g.add(o); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.45, 14), lam(c2)); g.add(band); }
    else if (shape === 'cube') box(c1, 0.9, 0.9, 0.9, 0, 0, 0);
    else if (shape === 'squid') { ball(c1, 0.55, 1, 1.6, 1, 0, 0.5, 0); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const o = box(c2, 0.12, 1.1, 0.12, Math.cos(a) * 0.3, -0.6, Math.sin(a) * 0.3); o.rotation.z = Math.cos(a) * 0.3; } eye(0.3, 0.3, 0.45); }
    else if (shape === 'crab') { box(c1, 1.2, 0.5, 0.9, 0, 0, 0); for (const s of [-1, 1]) { box(c1, 0.5, 0.35, 0.35, s * 0.8, 0.15, -0.5); for (let i = 0; i < 3; i++) box(c2, 0.5, 0.08, 0.08, s * 0.75, -0.2, -0.2 + i * 0.25); } eye(-0.2, 0.35, -0.4); eye(0.2, 0.35, -0.4); }
    else if (shape === 'flat') { ball(c1, 0.8, 1.6, 0.25, 1.2, 0, 0, 0); box(c2, 1.6, 0.08, 0.1, 1.4, 0, 0); eye(-0.6, 0.12, 0.3); }
    else {
      const long = shape === 'long', L = long ? 2.4 : shape === 'shark' || shape === 'sword' || shape === 'narwhal' ? 1.6 : 1.1, H = long ? 0.42 : shape === 'puff' ? 1 : 0.7;
      ball(c1, 0.5, L, H, 0.55, 0, 0, 0);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.6, 4), lam(c2)); tail.rotation.z = Math.PI / 2; tail.position.set(L * 0.5 + 0.2, 0, 0); g.add(tail);
      box(c2, 0.4, shape === 'shark' ? 0.7 : 0.35, 0.06, 0, H * 0.45 + 0.1, 0);
      if (shape === 'sword') box(0xcbd5e1, 1.1, 0.07, 0.07, -L * 0.5 - 0.5, 0.05, 0);
      if (shape === 'narwhal') box(0xf5f5f4, 1.2, 0.08, 0.08, -L * 0.5 - 0.55, 0.12, 0);
      if (shape === 'shark') box(c1, 0.8, 0.5, 0.3, -L * 0.5, 0, 0);
      if (shape === 'puff') for (let i = 0; i < 10; i++) { const a = i * 2.4, o = box(c2, 0.08, 0.3, 0.08, Math.cos(a) * 0.4, Math.sin(a) * 0.55, (i % 2 - 0.5) * 0.5); o.rotation.z = a; }
      eye(-L * 0.32, H * 0.12, 0.27);
    }
    return g;
  }
  const portrait = (f) => snapshot(`fi-${f}`, () => fishMesh(f), { w: 200, h: 130, dir: [0.15, 0.25, -1] });
  function rodMesh(i) {
    const g = new THREE.Group(), R = RODS[i];
    const handle = new THREE.Mesh(BOX, new THREE.MeshLambertMaterial({ color: 0x3f2a1e })); handle.scale.set(0.28, 1.2, 0.28); handle.position.y = -0.2; g.add(handle);
    const pole = new THREE.Mesh(BOX, new THREE.MeshLambertMaterial({ color: R.c })); pole.scale.set(0.16, 5.2, 0.16); pole.position.y = 2.8; g.add(pole);
    const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 10), new THREE.MeshLambertMaterial({ color: 0xd4d4d8 })); reel.rotation.z = Math.PI / 2; reel.position.set(0.25, 0.4, 0); g.add(reel);
    const tip = new THREE.Object3D(); tip.position.y = 5.4; g.add(tip); g.userData.tip = tip;
    return g;
  }
  const bobberMesh = () => { const g = new THREE.Group(); const a = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), new THREE.MeshLambertMaterial({ color: 0xef4444 })); a.position.y = 0.1; g.add(a); const b = new THREE.Mesh(new THREE.SphereGeometry(0.33, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xffffff })); b.position.y = 0.1; g.add(b); return g; };

  /* ---------------- the experience ---------------- */
  const FI = {
    id: 'fish', code: 'fi', genre: 'Simulator', rank: 0.15, name: 'Fishing', emoji: '🎣', max: 12, stat: 'Caught', killY: -30, camDist: 20,
    land: { theme: 'beach', mode: 'sea', sea: -0.6, holes: [[-240, -260, 240, -12], [-130, -12, -62, 62]], water: [0x467ca2, 0x4a80a6, 0x43789d], extras: ['boats'] },
    color: 'linear-gradient(135deg,#0ea5e9,#14b8a6)',
    desc: 'Cast into the lake, the ocean, a frozen pond or a lake of lava. When a fish bites, hook it and reel it in by keeping it inside your bar. 37 kinds of fish from Trash to Mythical, heavier and ✨ shiny ones worth more. Sell your catch, buy better rods, and fill your fish book.',
    welcome: 'Hold the mouse (or the 🎣 Cast button) and let go to cast!',
    welcomeTouch: 'Hold the 🎣 Cast button and let go to cast!',
    build() {
      sky('#7dd3fc', '#e0f2fe');
      this.stands = []; this.lines = new Map();
      // the town on the shore
      slab(0, 0, 25, 124, 74, 0x6cc24a, { sy: 4 });
      slab(-16, 0.06, 25, 6, 60, 0xd6c49a, { sy: 0.2, plain: true, solid: false }); // sandy paths
      slab(20, 0.05, 10, 6, 44, 0xd6c49a, { sy: 0.2, plain: true, solid: false });
      // the lake: its bed, the water, a dock
      slab(-96, -6, 25, 68, 74, 0xb59a6a, { sy: 2 });
      part({ x: -96, y: -0.8, z: 25, sx: 68, sy: 0.6, sz: 74, c: 0x2b8ad9, alpha: 0.7, plain: true, solid: false });
      slab(-74, 0.4, 10, 26, 5, 0x9a6b3c, { sy: 0.6 }); for (const x of [-64, -72, -80, -86]) for (const z of [8, 12]) part({ x, y: -2.5, z, sx: 0.6, sy: 5.4, sz: 0.6, c: 0x5b3a1e });
      // the ocean, a long pier with a deck at the end, and the bridge out to the volcano
      slab(0, -9, -136, 480, 248, 0xc2a36b, { sy: 2 });
      part({ x: 0, y: -0.8, z: -136, sx: 480, sy: 0.6, sz: 248, c: 0x1f6fb2, alpha: 0.75, plain: true, solid: false });
      slab(20, 0.4, -46, 6, 72, 0x9a6b3c, { sy: 0.6 }); slab(20, 0.4, -88, 18, 14, 0x9a6b3c, { sy: 0.6 });
      for (let z = -14; z > -95; z -= 8) for (const x of [17.5, 22.5]) part({ x, y: -4, z, sx: 0.6, sy: 8.4, sz: 0.6, c: 0x5b3a1e });
      slab(-10, 0.4, -96.5, 44, 4, 0x6b4a2b, { sy: 0.6 }); slab(-30, 0.4, -99.5, 4, 8, 0x6b4a2b, { sy: 0.6 }); // the bridge out to the island
      // the volcano island, with its lava lake in the crater
      slab(-46, 2, -122, 40, 40, 0x44403c, { sy: 11 });
      slab(-46, 2.6, -122, 24, 24, 0x292524, { sy: 0.6, solid: false });
      part({ x: -46, y: 2.95, z: -122, sx: 17, sy: 0.3, sz: 17, c: 0xff6a00, neon: true, solid: false });
      for (const [x, z, sx, sz] of [[-46, -141, 40, 2], [-46, -103.5, 16, 2], [-65, -122, 2, 40], [-27, -122, 2, 40]]) slab(x, 6, z, sx, sz, 0x57534e, { sy: 4 });
      // the snowy hill (in steps you can walk up) with the frozen pond in its top
      for (let k = 0; k < 3; k++) slab(88, 2 * (k + 1), 26, 52 - k * 8, 52 - k * 8, 0xe2e8f0, { sy: 2 });
      for (const [x, z, sx, sz] of [[88, 38, 28, 4], [88, 14, 28, 4], [76, 26, 4, 20], [100, 26, 4, 20]]) slab(x, 8, z, sx, sz, 0xf8fafc, { sy: 2 });
      slab(88, 3, 26, 20, 20, 0x93c5fd, { sy: 1 });
      part({ x: 88, y: 7.4, z: 26, sx: 20.6, sy: 0.25, sz: 20.6, c: 0x9ad7f5, alpha: 0.8, plain: true, solid: false });
      // trees and lamps round the town
      const r = mulberry(919);
      for (let i = 0; i < 18; i++) { const x = -55 + r() * 110, z = 5 + r() * 54; if (Math.abs(x + 16) < 6 || (Math.abs(x) < 22 && z > 26 && z < 60) || Math.abs(x - 20) < 5) continue; const h = 4 + r() * 3; part({ x, y: h / 2, z, sx: 1.1, sy: h, sz: 1.1, c: 0x7c4a1e }); part({ x, y: h + 1.4 + (i % 4) * 0.02, z, sx: 4.4, sy: 3, sz: 4.4, c: i % 2 ? 0x2f9e44 : 0x37b24d }); }
      // the stalls: sell fish, buy rods, the fish book
      this.stands = [
        { x: -14, z: 34, e: '💰', n: 'Fish Merchant', c: 0x16a34a, fn: () => this.sellPanel() },
        { x: 0, z: 34, e: '🎣', n: 'Rod Shop', c: 0x2563eb, fn: () => this.rodPanel() },
        { x: 14, z: 34, e: '📖', n: 'Fish Book', c: 0xa16207, fn: () => this.bookPanel() },
      ];
      for (const s of this.stands) {
        part({ x: s.x, y: 1.2, z: s.z, sx: 7, sy: 2.4, sz: 3, c: 0x9a6b3c });
        for (const dx of [-3.2, 3.2]) part({ x: s.x + dx, y: 3.5, z: s.z + 1.2, sx: 0.4, sy: 4.6, sz: 0.4, c: 0x6b4a2b });
        part({ x: s.x, y: 6, z: s.z + 1.2, sx: 7.6, sy: 0.6, sz: 4.4, c: s.c, stripes: '#ffffff' });
        const l = label(`${s.e} ${s.n}`, { size: 1.3 }); l.position.set(s.x, 7.8, s.z + 1.2); place.add(l);
      }
      const sg = label('🎣 FISHING', { size: 3.4, color: '#e0f2fe' }); sg.position.set(0, 13, -8); place.add(sg);
      for (const [x, z, t] of [[-62, 6, '🏞️ Sunny Lake ←'], [20, -10, '🌊 Ocean pier ↓'], [70, 26, '❄️ Frozen Pond →'], [-24, -100, '🌋 Magma Lake']]) { const l = label(t, { size: 1.3, bg: 'rgba(15,23,42,.65)' }); l.position.set(x, 4, z); place.add(l); }
    },
    pres() { return { cc: 0, rd: 0, bb: 0, rl: 0 }; },
    async enter() {
      const s = await kvGet('fi');
      const D = { cash: 0, rod: 0, rods: [0], bag: [], dex: {}, caught: 0, best: 0 };
      this.S = Object.assign(D, s && typeof s === 'object' ? s : {});
      const S = this.S;
      S.cash = Math.max(0, +S.cash || 0); S.caught = Math.max(0, S.caught | 0);
      questMax('fish.catch', S.caught); if (S.dex && typeof S.dex === 'object') questMax('fish.dex', Object.keys(S.dex).length);
      S.rods = (Array.isArray(S.rods) ? S.rods : [0]).map((i) => i | 0).filter((i, n, a) => RODS[i] && a.indexOf(i) === n); if (!S.rods.includes(0)) S.rods.unshift(0);
      S.rod = S.rods.includes(S.rod | 0) ? S.rod | 0 : 0;
      S.bag = (Array.isArray(S.bag) ? S.bag : []).filter((b) => Array.isArray(b) && FISH[b[0]] && b[1] > 0).slice(0, bagMax());
      S.dex = S.dex && typeof S.dex === 'object' ? S.dex : {};
      this.st = 'idle'; this.safe = [0, 1, 52]; this.held = null; this.heldOthers = new Map(); this.bobber = null; this.pw = 0; this.holdT = 0; this.holding = false;
      const hud = $('#xhud');
      this.gEl = document.createElement('div'); this.gEl.id = 'fiGame'; hud.append(this.gEl); this.gHtml = null;
      this.gEl.addEventListener('pointerdown', (e) => { if (e.target.closest('.big')) { e.preventDefault(); this.press(0, true, true); } });
      this.gEl.addEventListener('pointerup', (e) => { if (e.target.closest('.big')) this.press(0, false, true); });
      this.gEl.addEventListener('pointerleave', () => { if (this.holding && this.st === 'reel') this.press(0, false, true); });
      this.drawBar(); this.drawGame();
      this.send(true);
    },
    leave() {
      this.save();
      this.dropBobber(); this.catchClose();
      for (const l of this.lines.values()) { scene.remove(l.line); if (l.bob) scene.remove(l.bob); }
      this.lines = new Map();
      if (this.held && this.held.m && this.held.m.parent) this.held.m.parent.remove(this.held.m);
      for (const h of this.heldOthers.values()) if (h.m && h.m.parent) h.m.parent.remove(h.m);
    },
    save() { this.dirty = false; return kvSet('fi', this.S); },
    send(now) {
      const t = performance.now();
      if (!now && t - (this.sentAt || 0) < 300) return;
      this.sentAt = t;
      const b = this.bobber;
      send({ cc: this.S.caught, rd: this.S.rod, bb: b && b.landed ? [+b.x.toFixed(1), +b.y.toFixed(2), +b.z.toFixed(1)] : 0, rl: this.st === 'reel' ? 1 : 0 });
    },
    spawn() { return [0, 1, 52, 0]; },

    /* ---- casting, waiting, reeling ---- */
    rod() { return RODS[this.S.rod]; },
    press(btn, down, ui) {
      if (btn !== 0) return;
      if (down && !ui && (panelOpen() || this.catchEl)) return;
      this.holding = down;
      if (this.st === 'idle' && down && !P.dead) { this.st = 'charge'; this.pw = 0; this.pwDir = 1; P.frozen = true; }
      else if (this.st === 'charge' && !down) { if (ui) this.cast(); else this.st = 'let'; } // (the click that follows casts; a drag to look around doesn't)
      else if (this.st === 'bite' && down) this.hook();
      else if ((this.st === 'wait' || this.st === 'fly') && down && !ui) this.reelIn('You reeled in your line.');
    },
    click() { if (this.st === 'let') this.cast(); },
    key(code, down) {
      if (code === 'Space' && ['reel', 'bite'].includes(this.st)) { this.press(0, down, true); return true; }
      if (!down) return;
      if (code === 'KeyB') { this.sellPanel(true); return true; }
      if (code === 'KeyJ') { this.bookPanel(); return true; }
      if (code === 'KeyT') { this.teleports(); return true; }
      if (code === 'KeyQ' && this.st !== 'idle' && this.st !== 'reel') { this.reelIn('You reeled in your line.'); return true; }
    },
    cast() {
      const pw = this.pw, d = 6 + pw * 30, yaw = cam.yaw, tip = this.tipPos();
      const x = P.x - Math.sin(yaw) * d, z = P.z - Math.cos(yaw) * d, w = waterAt(x, z);
      this.st = 'fly'; P.frozen = false;
      P.yaw = yaw;
      const bob = { m: bobberMesh(), from: tip, x, z, y: w ? w.y + 0.05 : groundBelow(x, P.y + 20, z) + 0.2, t: 0, w, landed: false };
      bob.m.position.copy(tip); scene.add(bob.m);
      this.bobber = bob;
      sfx('swing', { pitch: 0.8 + pw * 0.4 });
    },
    tipPos() { const m = this.held && this.held.m; if (m) { m.updateMatrixWorld(true); return m.userData.tip.getWorldPosition(new THREE.Vector3()); } return new THREE.Vector3(P.x, P.y + 4.5, P.z); },
    landed(b) {
      b.landed = true; this.send(true);
      if (!b.w) { this.reelIn('That’s not water! Cast into the lake, the sea, the pond or the lava.'); return; }
      const place = placeOf(b.w, b.z);
      if (place === 'lava' && !this.rod().lava) { puffAt(b.x, b.y + 0.5, b.z, [0xff6a00, 0x444444], 8); sfx('hiss'); this.reelIn('🔥 Your line burned! Only the Magma Rod can fish in lava.'); return; }
      puffAt(b.x, b.y + 0.2, b.z, place === 'lava' ? [0xff6a00, 0xfde047] : [0xffffff, 0x93c5fd], 6); sfx('splash', { vol: 0.5 });
      this.place = place; this.st = 'wait'; this.waitT = (2.5 + Math.random() * 6) * this.rod().lure * (useItem('bait') ? 0.3 : 1); // (Magic Bait: a bite much sooner)
    },
    hook() {
      const b = this.bobber; if (b && b.mark) { b.m.remove(b.mark); b.mark = null; }
      const f = this.pick(this.place), kg = FISH[f][2] * (0.45 + Math.pow(Math.random(), 2.2) * 2.6), shiny = Math.random() < 0.05;
      const rar = FISH[f][1], R = this.rod();
      this.fish = { f, kg, shiny, d: Math.max(0, rar - 1) * (1 - (R.steady || 0) * 0.5) };
      this.st = 'reel'; P.frozen = true;
      this.g = { cx: 0.5 - R.control / 2, cv: 0, fx: 0.5, ft: 0.5, tT: 0, p: 0.3, w: R.control };
      sfx('select'); this.send(true);
    },
    pick(place) {
      const pool = poolOf(place), luck = this.rod().luck + (place === 'deep' ? 0.4 : 0) + (hasItem('lure') ? 0.5 : 0);
      const w = RAR.map((r, i) => (pool.some((f) => FISH[f][1] === i) ? r[2] * (i >= 3 ? 1 + luck * (i - 2) : 1) : 0));
      let x = Math.random() * w.reduce((a, b) => a + b, 0), r = 0;
      while (r < w.length - 1 && x >= w[r]) { x -= w[r]; r++; }
      const opts = pool.filter((f) => FISH[f][1] === r);
      return opts[Math.floor(Math.random() * opts.length)];
    },
    reelIn(why) {
      if (why) toast(why, '#e2e8f0');
      this.dropBobber(); this.st = 'idle'; P.frozen = false; this.fish = null; this.g = null; this.send(true);
    },
    dropBobber() { if (this.bobber) { scene.remove(this.bobber.m); if (this.bobber.mark) this.bobber.m.remove(this.bobber.mark); this.bobber = null; } },
    caught() {
      const S = this.S, { f, kg, shiny } = this.fish, first = !S.dex[f], val = valueOf(f, kg, shiny), rar = FISH[f][1];
      this.reelIn();
      if (S.bag.length >= bagMax()) { toast('🎒 Your bag is full! Sell some fish at the merchant (B).', '#fca5a5'); sfx('error'); return; }
      S.bag.push([f, +kg.toFixed(3), shiny ? 1 : 0]); S.caught++; S.dex[f] = Math.max(S.dex[f] || 0, +kg.toFixed(3)); S.best = Math.max(S.best || 0, val);
      questMax('fish.catch', S.caught); questMax('fish.dex', Object.keys(S.dex).length); if (rar >= 5) quest('fish.legend');
      this.dirty = true; this.save(); this.send(true);
      sfx(rar >= 5 ? 'win' : rar >= 3 ? 'reward' : 'coin');
      puffAt(P.x, P.y + 4, P.z, rar >= 5 ? CONFETTI : [0xffffff, 0x93c5fd], rar >= 4 ? 30 : 10);
      if (first) earn(rar >= 5 ? 25 : rar >= 3 ? 8 : 3, `new fish: ${FISH[f][0]}`);
      if (rar >= 5) Net.chat(`🎣 caught a ${RAR[rar][0].toUpperCase()} ${shiny ? '✨ shiny ' : ''}${FISH[f][0]} (${kgs(kg)})!`);
      const el = document.createElement('div'); el.id = 'fiCatch';
      el.innerHTML = `<div class="card" style="--rc:${RAR[rar][3]}"><img src="${portrait(f)}" alt=""><b>${shiny ? '✨ ' : ''}${esc(FISH[f][0])}</b><span>${RAR[rar][0]}</span><small>⚖️ ${kgs(kg)} · 💰 C$${short(val)}</small>${first ? '<em>📖 New in your fish book!</em>' : ''}</div>`;
      el.onclick = () => this.catchClose();
      $('#xhud').append(el); this.catchEl = el;
      clearTimeout(this.catchT); this.catchT = setTimeout(() => this.catchClose(), 3200);
    },
    catchClose() { clearTimeout(this.catchT); if (this.catchEl) { this.catchEl.remove(); this.catchEl = null; } },

    tick(dt) {
      const S = this.S;
      if (!S) return;
      const T = performance.now() / 1000;
      // fell in? back to where you were standing
      if (this.st === 'let') { this.st = 'idle'; P.frozen = false; } // dragged the camera instead of casting
      const wet = waterAt(P.x, P.z);
      if (!P.dead && ((wet && P.y < wet.y - 0.6) || P.y < -3)) { const lava = wet && wet.k === 'lava'; puffAt(P.x, P.y + 1, P.z, lava ? [0xff6a00, 0x444444] : [0xffffff, 0x93c5fd], 14); sfx(lava ? 'hiss' : 'splash'); toast(lava ? '🔥 Ouch, lava! Back you go.' : 'Splash! You fell in.', lava ? '#fdba74' : '#bae6fd'); [P.x, P.y, P.z] = this.safe; P.vx = P.vy = P.vz = 0; this.reelIn(); }
      else if (P.ground && !wet) this.safe = [P.x, P.y + 0.1, P.z];
      if (P.dead && this.st !== 'idle') this.reelIn();
      // charging a cast: the power swings up and down while you hold
      if (this.st === 'charge') { this.pw += this.pwDir * dt * 1.1; if (this.pw >= 1) { this.pw = 1; this.pwDir = -1; } if (this.pw <= 0) { this.pw = 0; this.pwDir = 1; } P.yaw = cam.yaw; }
      // the bobber flying out
      const b = this.bobber;
      if (b && !b.landed) {
        b.t = Math.min(1, b.t + dt / 0.7);
        const k = b.t, p = b.m.position;
        p.set(b.from.x + (b.x - b.from.x) * k, b.from.y + (b.y - b.from.y) * k + Math.sin(k * Math.PI) * 6, b.from.z + (b.z - b.from.z) * k);
        if (b.t >= 1) this.landed(b);
      }
      if (b && b.landed) {
        b.m.position.set(b.x, b.y + Math.sin(T * 3) * 0.06 - (this.st === 'bite' ? 0.35 + Math.sin(T * 25) * 0.1 : 0), b.z);
        if (Math.hypot(b.x - P.x, b.z - P.z) > 50) this.reelIn('Your line snapped — you walked too far!');
      }
      if (this.st === 'wait') {
        this.waitT -= dt;
        if (this.waitT <= 0) { this.st = 'bite'; this.biteT = 1.6; sfx('alarm', { vol: 0.5 }); if (b) { b.mark = label('❗', { size: 1.6 }); b.mark.position.y = 1.4; b.m.add(b.mark); } }
      } else if (this.st === 'bite') {
        this.biteT -= dt;
        if (this.biteT <= 0) { if (b && b.mark) { b.m.remove(b.mark); b.mark = null; } this.st = 'wait'; this.waitT = (2 + Math.random() * 5) * this.rod().lure; toast('It got away… wait for the next bite', '#e2e8f0'); }
      } else if (this.st === 'reel') this.reel(dt);
      this.drawGame();
      this.drawLines();
      this.send();
      if (this.dirty && T - (this.savedAt || 0) > 10) { this.savedAt = T; this.save(); }
    },
    // the minigame: hold to push your bar right, let go and it drifts left; keep the fish inside it
    reel(dt) {
      const g = this.g, F = this.fish, R = this.rod();
      g.cv += (this.holding ? 2.8 : -2.8) * dt; g.cv = clamp(g.cv, -1.4, 1.4);
      g.cx += g.cv * dt;
      if (g.cx < 0) { g.cx = 0; g.cv = Math.max(0, g.cv) * 0.3; }
      if (g.cx > 1 - g.w) { g.cx = 1 - g.w; g.cv = Math.min(0, g.cv) * 0.3; }
      g.tT -= dt;
      if (g.tT <= 0) { g.tT = Math.max(0.35, 1.5 - F.d * 0.18) * (0.6 + Math.random() * 0.8); g.ft = clamp(g.fx + (Math.random() - 0.5) * (0.4 + F.d * 0.12), 0.04, 0.96); }
      g.fx += (g.ft - g.fx) * Math.min(1, dt * (1.2 + F.d * 0.7));
      const inside = g.fx > g.cx && g.fx < g.cx + g.w;
      g.p += inside ? 0.22 * R.reel * dt * (1 - F.d * 0.04) : -0.16 * dt * (1 + F.d * 0.12);
      g.on = inside;
      if (inside && performance.now() - (this.reelSnd || 0) > 160) { this.reelSnd = performance.now(); sfx('tick', { vol: 0.2, pitch: 1.4 }); }
      if (g.p >= 1) this.caught();
      else if (g.p <= 0) { sfx('lose'); this.reelIn(`The ${FISH[F.f][1] >= 3 ? RAR[FISH[F.f][1]][0].toLowerCase() + ' fish' : 'fish'} got away!`); }
    },
    drawGame() {
      const st = this.st;
      let html;
      if (st === 'reel') {
        const g = this.g;
        html = `<div class="tip">🎣 Reel it in! Hold to move the bar →</div><div class="track"><div class="zone ${g.on ? 'on' : ''}" style="left:${(g.cx * 100).toFixed(1)}%;width:${(g.w * 100).toFixed(1)}%"></div><div class="fish" style="left:${(g.fx * 100).toFixed(1)}%">🐟</div></div><div class="prog"><i style="width:${(clamp(g.p, 0, 1) * 100).toFixed(0)}%"></i></div><div class="row"><button class="big ${this.holding ? 'hold' : ''}">🎣 Hold to reel</button></div>`;
      } else if (st === 'charge') html = `<div class="tip">Let go to cast!</div><div class="power"><i style="width:${(this.pw * 100).toFixed(0)}%"></i></div><div class="row"><button class="big hold">🎣 Cast</button></div>`;
      else if (st === 'bite') html = '<div class="tip">❗ A bite! Click NOW!</div><div class="row"><button class="big">🐟 Hook it!</button></div>';
      else if (st === 'wait' || st === 'fly') html = `<div class="tip">Waiting for a bite at ${PLACES[this.place || 'lake'] && this.st === 'wait' ? PLACES[this.place].e + ' ' + PLACES[this.place].n : 'the water'}… (Q reels in)</div>`;
      else html = '<div class="row"><button class="big">🎣 Cast</button></div>';
      if (html !== this.gHtml) { this.gHtml = html; this.gEl.innerHTML = html; }
    },
    // fishing lines: yours, and everyone else's (from their presence)
    drawLines() {
      const want = new Map();
      if (this.bobber && me) want.set('me', { from: this.tipPos(), to: this.bobber.m.position, mine: true });
      for (const p of Net.peers) {
        if (p.isMe || !p.presence || !Array.isArray(p.presence.bb)) continue;
        const h = this.heldOthers.get(p.peer); if (!h || !h.m) continue;
        h.m.updateMatrixWorld(true);
        const [x, y, z] = p.presence.bb;
        want.set(p.peer, { from: h.m.userData.tip.getWorldPosition(new THREE.Vector3()), to: new THREE.Vector3(x, y + Math.sin(performance.now() / 330 + x) * 0.06, z), reel: p.presence.rl });
      }
      for (const [k, l] of this.lines) if (!want.has(k)) { scene.remove(l.line); if (l.bob) scene.remove(l.bob); this.lines.delete(k); }
      for (const [k, w] of want) {
        let l = this.lines.get(k);
        if (!l) { const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); l = { line: new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xf8fafc })) }; scene.add(l.line); if (!w.mine) { l.bob = bobberMesh(); scene.add(l.bob); } this.lines.set(k, l); }
        const pos = l.line.geometry.attributes.position; pos.setXYZ(0, w.from.x, w.from.y, w.from.z); pos.setXYZ(1, w.to.x, w.to.y, w.to.z); pos.needsUpdate = true; l.line.geometry.computeBoundingSphere();
        if (l.bob) l.bob.position.copy(w.to).add(new THREE.Vector3(0, w.reel ? -0.3 : 0, 0));
      }
    },
    // a rod in your hand (and everyone's), raised while fishing
    pose() {
      this.holdRod(me, this.S.rod, 'me', this.st !== 'idle');
      for (const [peer, a] of Net.avatars) { const p = Net.peers.find((q) => q.peer === peer); const pr = p && p.presence; this.holdRod(a, pr && RODS[pr.rd | 0] ? pr.rd | 0 : 0, peer, !!(pr && Array.isArray(pr.bb))); }
    },
    holdRod(a, rod, key, up) {
      if (!a || a.dead) return;
      let h = key === 'me' ? this.held : this.heldOthers.get(key);
      if (!h || h.a !== a || h.rod !== rod) {
        if (h && h.m && h.m.parent) h.m.parent.remove(h.m);
        h = { a, rod, m: rodMesh(rod) };
        h.m.rotation.x = -Math.PI / 2 + 0.3; h.m.position.set(0, -1.9, -0.2); a.armR.add(h.m);
        if (key === 'me') this.held = h; else this.heldOthers.set(key, h);
      }
      a.armR.rotation.x = up ? (this.st === 'charge' && key === 'me' ? 0.2 + this.pw * 1.4 : 1.25) : 0.9;
    },

    /* ---- shops and things ---- */
    sellPanel(fromBar) {
      const S = this.S, total = S.bag.reduce((a, b) => a + valueOf(b[0], b[1], b[2]), 0), near = Math.hypot(P.x + 14, P.z - 34) < 9;
      const order = S.bag.map((b, i) => i).sort((a, b) => valueOf(...S.bag[b]) - valueOf(...S.bag[a]));
      const html = `<div class="xp-row"><span>🎒 <b>${S.bag.length}/${bagMax()}</b> fish</span><span>💰 <b>C$${short(S.cash)}</b></span></div>
        ${near ? `<button class="xp-btn gold" data-all="1" style="width:100%;margin:6px 0" ${S.bag.length ? '' : 'disabled'}>Sell all for C$${short(total)}</button>` : `<p class="xp-note">Sell your fish at the 💰 Fish Merchant in town (they’re worth C$${short(total)}).</p>`}
        <div class="xp-grid">${order.map((i) => { const [f, kg, sh] = S.bag[i], r = FISH[f][1]; return `<div class="xp-card fi-card" style="border-color:${RAR[r][3]}55"><img src="${portrait(f)}" alt=""><b>${sh ? '✨ ' : ''}${esc(FISH[f][0])}</b><span style="color:${RAR[r][3]}">${RAR[r][0]}</span><span>⚖️ ${kgs(kg)}</span><span class="v">C$${short(valueOf(f, kg, sh))}</span>${near ? `<button class="xp-btn" data-sell="${i}">Sell</button>` : ''}</div>`; }).join('') || '<p class="xp-note">Your bag is empty. Go fishing!</p>'}</div>`;
      openPanel(near ? '💰 Fish Merchant' : '🎒 Your Fish', html, (btn) => {
        if (btn.dataset.all) { S.cash += total; toast(`💰 Sold ${S.bag.length} fish for C$${short(total)}`, '#86efac'); S.bag = []; }
        else if (btn.dataset.sell != null) { const [f, kg, sh] = S.bag[+btn.dataset.sell]; S.cash += valueOf(f, kg, sh); S.bag.splice(+btn.dataset.sell, 1); }
        sfx('buy'); this.dirty = true; this.save(); this.sellPanel(fromBar);
      }, null, { full: !near || S.bag.length > 8 });
    },
    rodPanel() {
      const S = this.S;
      const stat = (v, max) => `<span style="display:inline-block;width:46px;height:7px;border-radius:4px;background:rgba(255,255,255,.12);vertical-align:middle;overflow:hidden"><i style="display:block;height:100%;width:${Math.round((100 * v) / max)}%;background:#38bdf8"></i></span>`;
      const html = `<div class="xp-row"><span>💰 <b>C$${short(S.cash)}</b></span></div>` + RODS.map((R, i) => {
        const own = S.rods.includes(i), on = S.rod === i;
        return `<div class="xp-row"><span><b>${esc(R.n)}</b>${R.lava ? ' 🔥' : ''}<br><small style="color:var(--muted)">🍀 ${stat(R.luck, 1.4)} ⏱️ ${stat(1.1 - R.lure, 0.6)} 🎯 ${stat(R.control, 0.38)} 🌀 ${stat(R.reel, 1.6)}</small></span>${on ? '<b>✓ Using</b>' : own ? `<button class="xp-btn blue" data-use="${i}">Use</button>` : `<button class="xp-btn gold" data-buy="${i}" ${S.cash < R.price ? 'disabled' : ''}>C$${short(R.price)}</button>`}</div>`;
      }).join('') + '<p class="xp-note">🍀 luck: rarer fish · ⏱️ lure: quicker bites · 🎯 control: a bigger bar · 🌀 reel: reel in faster. 🔥 rods can fish in lava.</p>';
      openPanel('🎣 Rod Shop', html, (btn) => {
        if (btn.dataset.buy) { const i = +btn.dataset.buy, R = RODS[i]; if (S.cash < R.price) return; S.cash -= R.price; S.rods.push(i); S.rod = i; sfx('levelup'); toast(`🎣 Got the ${R.n}!`, '#86efac'); }
        else if (btn.dataset.use) { S.rod = +btn.dataset.use; sfx('select'); }
        this.reelIn(); this.dirty = true; this.save(); this.send(true); this.drawBar(); this.rodPanel();
      });
    },
    bookPanel() {
      const S = this.S, got = Object.keys(S.dex).length;
      const html = `<div class="xp-row"><span>📖 <b>${got}/${FISH.length}</b> kinds caught</span><span>🐟 ${S.caught} fish in all</span></div>` + Object.keys(PLACES).filter((k) => k !== 'deep').map((k) => `<h4>${PLACES[k].e} ${PLACES[k].n}</h4><div class="xp-grid">${FISH.map((F, i) => i).filter((i) => FISH[i][5] === k || (k === 'ocean' && FISH[i][5] === 'deep')).map((i) => { const has = S.dex[i] != null, r = FISH[i][1]; return `<div class="xp-card fi-card ${has ? '' : 'unk'}" style="border-color:${RAR[r][3]}55"><img src="${portrait(i)}" alt=""><b>${has ? esc(FISH[i][0]) : '???'}</b><span style="color:${RAR[r][3]}">${RAR[r][0]}${FISH[i][5] === 'deep' ? ' · deep' : ''}</span>${has ? `<span>🏆 ${kgs(S.dex[i])}</span>` : ''}</div>`; }).join('')}</div>`).join('');
      openPanel('📖 Fish Book', html, null, null, { full: true });
    },
    teleports() {
      const spots = [['🏠 Town', 0, 52], ['🏞️ Sunny Lake dock', -82, 10], ['🌊 The pier', 20, -86], ['❄️ Frozen Pond', 88, 14], ['🌋 Magma Lake', -46, -108]];
      openPanel('🗺️ Teleport', spots.map(([n], i) => `<div class="xp-row"><b>${n}</b><button class="xp-btn blue" data-tp="${i}">Go</button></div>`).join(''), (btn) => {
        const [, x, z] = spots[+btn.dataset.tp]; this.reelIn(); P.x = x; P.z = z; P.y = groundBelow(x, 40, z) + 0.2; P.vx = P.vy = P.vz = 0; sfx('teleport'); closePanel();
      });
    },
    drawBar() {
      setBar(`<button class="xslot info"><span>🎣 ${esc(this.rod().n)}</span></button>`
        + `<button class="xslot" data-k="bag" title="Your fish (B)"><span class="k">B</span><span class="e">🎒</span>Fish<span class="n">${this.S.bag.length}</span></button>`
        + `<button class="xslot" data-k="book" title="Fish book (J)"><span class="k">J</span><span class="e">📖</span>Book</button>`
        + `<button class="xslot" data-k="tp" title="Teleport (T)"><span class="k">T</span><span class="e">🗺️</span>Teleport</button>`, (b) => {
        const k = b.dataset.k;
        if (k === 'bag') this.sellPanel(true);
        if (k === 'book') this.bookPanel();
        if (k === 'tp') this.teleports();
      });
    },
    prompts() { return this.stands.map((s) => ({ x: s.x, z: s.z - 3, r: 6, text: `${s.e} ${s.n}`, fn: s.fn })); },
    hud() {
      if (!this.S) return '';
      const S = this.S, w = waterNear();
      if (S.bag.length !== this.bagN) { this.bagN = S.bag.length; this.drawBar(); }
      return `💰 <b>C$${short(S.cash)}</b> · 🎒 ${S.bag.length}/${bagMax()} · 📖 ${Object.keys(S.dex).length}/${FISH.length}${w ? ` · ${PLACES[w].e} ${PLACES[w].n}` : ''}`;
    },
    statOf(pr, isMe) { return short(isMe ? this.S && this.S.caught : pr.cc || 0); },
    sortKey(pr, isMe) { return isMe ? (this.S ? this.S.caught : 0) : +pr.cc || 0; },
    coinShop: [
      { id: 'lure', e: '🍀', n: 'Lucky Lure', d: 'Rare fish bite more often, for good', price: 600, kind: 'pass' },
      { id: 'bag', e: '🎒', n: 'Big Bag', d: 'Hold 80 fish instead of 40, for good', price: 400, kind: 'pass' },
      { id: 'bait', e: '🪱', n: 'Magic Bait', d: '10 casts where a fish bites much sooner', price: 25, kind: 'use', pack: 10 },
    ],
  };
  // the water you're facing: where a cast would land (for the status line)
  function waterNear() {
    for (let d = 6; d <= 36; d += 5) { const x = P.x - Math.sin(cam.yaw) * d, z = P.z - Math.cos(cam.yaw) * d, w = waterAt(x, z); if (w) return placeOf(w, z); }
    return null;
  }
  addExp(FI);
  window.__rbFI = Object.assign(FI, { FISH, RODS, waterAt, valueOf });
})();
