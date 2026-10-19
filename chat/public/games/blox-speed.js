/* =====================================================================
   BLOXVERSE — +1 SPEED EVERY STEP. Every second you keep walking you get
   faster, and the wait for the next gain drops by 10% each time (stop and
   it starts over). Run the track through six zones for wins and money,
   finish quests, convert speed into money (10 speed = $1), buy eggs for
   pets that multiply your speed per step, and rebirth for +1 speed per
   step (your speed resets; each rebirth needs 25% more). Treadmills in the
   hub keep you walking on the spot. Saved; everyone sees your pets.
   ===================================================================== */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    #spQ{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:230px;display:flex;flex-direction:column;gap:6px;pointer-events:auto;cursor:pointer}
    #spQ .qh{font:600 15px var(--fh);text-shadow:0 2px 0 rgba(0,0,0,.45);display:flex;justify-content:space-between;align-items:center}
    #spQ .qh small{font:700 11px var(--fb);opacity:.8}
    #spQ .q{background:linear-gradient(180deg,rgba(30,41,59,.88),rgba(15,23,42,.9));border:2px solid rgba(255,255,255,.12);border-radius:14px;padding:7px 10px 8px;font:700 12px/1.25 var(--fb);color:#e2e8f0;box-shadow:0 3px 0 rgba(0,0,0,.35)}
    #spQ .q b{color:#fff;font:600 13px var(--fh)}
    #spQ .q .bar{height:7px;border-radius:5px;background:rgba(255,255,255,.12);margin-top:5px;overflow:hidden}
    #spQ .q .bar i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#22d3ee,#a3e635)}
    #spQ .q .pay{float:right;color:#86efac}
    #spGain{position:absolute;left:50%;top:36%;transform:translateX(-50%);font:600 30px var(--fh);color:#fde047;text-shadow:0 3px 0 rgba(0,0,0,.5),0 0 18px rgba(250,204,21,.6);pointer-events:none;opacity:0;white-space:nowrap}
    #spGain.go{animation:spUp .7s ease-out}
    @keyframes spUp{0%{opacity:0;transform:translate(-50%,10px) scale(.8)}20%{opacity:1;transform:translate(-50%,0) scale(1.08)}100%{opacity:0;transform:translate(-50%,-34px) scale(1)}}
    #spMeter{position:absolute;left:50%;top:70px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:6px 16px 7px;border-radius:999px;background:rgba(15,23,42,.72);border:2px solid rgba(255,255,255,.14);font:600 20px var(--fh);text-shadow:0 2px 0 rgba(0,0,0,.45);pointer-events:none;white-space:nowrap}
    #spMeter small{font:700 12px var(--fb);color:#cbd5e1}
    #spMeter .t{width:64px;height:8px;border-radius:5px;background:rgba(255,255,255,.14);overflow:hidden}
    #spMeter .t i{display:block;height:100%;background:linear-gradient(90deg,#fde047,#f97316)}
    #spHatch{position:absolute;inset:0;display:grid;place-items:center;pointer-events:auto;background:radial-gradient(circle,rgba(0,0,0,.35),rgba(0,0,0,.75));z-index:5;cursor:pointer}
    #spHatch .egg{font-size:150px;animation:spWob .18s ease-in-out infinite alternate;filter:drop-shadow(0 10px 20px rgba(0,0,0,.5))}
    #spHatch .row{display:flex;gap:18px;flex-wrap:wrap;justify-content:center;padding:20px}
    #spHatch .got{width:200px;border-radius:24px;padding:16px;text-align:center;background:linear-gradient(180deg,#1f2937,#0f172a);border:3px solid var(--rc,#94a3b8);box-shadow:0 0 50px var(--rc,#94a3b8);animation:spPop .45s cubic-bezier(.2,1.6,.5,1)}
    #spHatch .got img{width:150px;height:150px;object-fit:contain}
    #spHatch .got b{display:block;font:600 22px var(--fh);color:#fff}
    #spHatch .got span{font:700 15px var(--fh);color:var(--rc)}
    #spHatch .got small{display:block;color:#fde68a;font:700 14px var(--fb);margin-top:4px}
    #spHatch .tap{position:absolute;bottom:14%;color:#e2e8f0;font:600 15px var(--fh);opacity:.8}
    @keyframes spWob{from{transform:rotate(-14deg)}to{transform:rotate(14deg) scale(1.06)}}
    @keyframes spPop{from{transform:scale(.3);opacity:0}}
    .sp-card img{width:100%;height:84px;object-fit:contain}
    .sp-card .m{font:700 13px var(--fh);color:#fde68a}
    .sp-odds{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:8px 0}
    .sp-odds div{background:rgba(0,0,0,.25);border-radius:12px;padding:5px 3px;text-align:center;font:700 11px var(--fb);border:2px solid var(--rc)}
    .sp-odds img{width:54px;height:54px;object-fit:contain;display:block;margin:0 auto}
    .sp-odds b{display:block;color:#fff;font:600 11.5px var(--fh)}
    .sp-big{font:600 26px var(--fh);text-align:center;margin:6px 0 2px}
    .sp-sub{text-align:center;color:#cbd5e1;font:700 13px var(--fb);margin-bottom:8px}
    .touchy #spQ{transform:translateY(-75%) scale(.78);transform-origin:left center}
    .touchy #spMeter{top:60px;transform:translateX(-50%) scale(.85)}
    @media (max-width:640px){#spQ{transform:translateY(-70%) scale(.72);transform-origin:left center}#spMeter{transform:translateX(-50%) scale(.82)}}`;
  document.head.append(style);

  /* ---------------- numbers ---------------- */
  const short = (n) => { n = Math.floor(n || 0); if (n < 1000) return String(n); const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi']; let i = -1; while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; } return (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)).replace(/\.?0+$/, '') + u[i]; };
  const cash = (n) => '$' + short(n);
  const mx = (m) => '×' + (m >= 10 ? m.toFixed(0) : m.toFixed(2).replace(/0$/, '').replace(/\.0$/, ''));
  const MIN_DELAY = 0.1; // at most 10 gains a second
  const IDLE = 0.6; // stop for this long and the wait goes back to a second
  const PER = 10; // speed for $1
  const rebirthNeed = (rb) => Math.round(80 * 1.25 ** rb); // rebirth 1: 80, rebirth 2: 100, then 25% more each time
  const walkSpeed = (sp) => Math.min(240, 16 + 2.5 * Math.sqrt(Math.max(0, sp))); // how fast your speed lets you run
  const LIMITS = [0, 120, 60, 32]; // the speed limit button: off, then slower
  const TM_COOLDOWN = 20;

  /* ---------------- the track ---------------- */
  const ZL = 500; // each zone is this long, one after another along -z
  const ZONES = [
    { n: 'Grassland', e: '🌳', g: 0x6cc24a, road: 0xd8c8a0, edge: 0x8b6b3d, sky: ['#6ec3ff', '#e6f6ff'], need: 0, win: 1, pay: 20 },
    { n: 'Desert', e: '🏜️', g: 0xe9c46a, road: 0xc8925a, edge: 0x9a6a38, sky: ['#f4a261', '#fde68a'], need: 100, win: 2, pay: 120 },
    { n: 'Snowy Peaks', e: '🏔️', g: 0xf1f5f9, road: 0x9cc7f5, edge: 0x64748b, sky: ['#93c5fd', '#f8fafc'], need: 600, win: 4, pay: 800 },
    { n: 'Volcano', e: '🌋', g: 0x3f2a2a, road: 0x57534e, edge: 0x1c1917, sky: ['#7f1d1d', '#fb923c'], need: 3000, win: 8, pay: 5000 },
    { n: 'Candy Land', e: '🍭', g: 0xf9a8d4, road: 0xfff1d6, edge: 0xdb2777, sky: ['#f472b6', '#fde7f3'], need: 15000, win: 16, pay: 30000 },
    { n: 'Outer Space', e: '🪐', g: 0x2e2a6e, road: 0x1e1b4b, edge: 0x8b5cf6, sky: ['#05041a', '#3b1d7a'], need: 80000, win: 32, pay: 200000 },
  ];
  const END = -ZL * ZONES.length;
  const zoneAt = (z) => (z > 0 ? -1 : Math.min(ZONES.length - 1, Math.floor(-z / ZL)));
  const W2 = 58; // half the width of the ground (walls stand here)
  const ROAD = 20; // half the width of the road
  const TREADS = [{ x: -40, mult: 2, rb: 0, c: '#22d3ee' }, { x: -29, mult: 5, rb: 3, c: '#a855f7' }, { x: -18, mult: 10, rb: 10, c: '#f59e0b' }];
  const TZ0 = 24, TZ1 = 50; // where the treadmills run, along z

  /* ---------------- eggs and pets ---------------- */
  const EGGS = [
    { n: 'Basic Egg', e: '🥚', price: 30, c: 0xf5f5f4, base: 1.1 },
    { n: 'Desert Egg', e: '🏜️', price: 300, c: 0xe9c46a, base: 1.5 },
    { n: 'Frost Egg', e: '❄️', price: 3000, c: 0xbae6fd, base: 2.2 },
    { n: 'Magma Egg', e: '🔥', price: 30000, c: 0xf97316, base: 3.5 },
    { n: 'Candy Egg', e: '🍬', price: 300000, c: 0xf472b6, base: 6 },
    { n: 'Galaxy Egg', e: '🌌', price: 3000000, c: 0x7c3aed, base: 10 },
  ];
  const RAR = [['Common', '#cbd5e1', 1, 60], ['Uncommon', '#4ade80', 1.35, 25], ['Rare', '#60a5fa', 1.8, 10], ['Epic', '#c084fc', 2.6, 4], ['Legendary', '#fbbf24', 4, 1]];
  // name, shape, colours, extra (one per rarity, five per egg)
  const SPECIES = [
    ['Doggy', 'quad', 0xa16207, 0x713f12, 'flop'], ['Kitty', 'quad', 0xf97316, 0xffedd5, 'point'], ['Bunny', 'quad', 0xf5f5f5, 0xf9a8d4, 'long'], ['Chick', 'bird', 0xfde047, 0xf59e0b], ['Golden Pup', 'quad', 0xfacc15, 0xfef08a, 'flop'],
    ['Camel', 'quad', 0xd4a373, 0x8b5e34, 'round'], ['Scorpion', 'quad', 0xb91c1c, 0xfca5a5, 'claws'], ['Fennec Fox', 'quad', 0xf2c48d, 0xffffff, 'point'], ['Vulture', 'bird', 0x6b4f3a, 0xf5f5f4], ['Sphinx Cat', 'quad', 0xeab308, 0x1e3a8a, 'point'],
    ['Penguin', 'bird', 0x1f2937, 0xffffff], ['Snow Bunny', 'quad', 0xf8fafc, 0x93c5fd, 'long'], ['Polar Bear', 'quad', 0xf1f5f9, 0x94a3b8, 'round'], ['Ice Owl', 'bird', 0xe0f2fe, 0x38bdf8], ['Frost Dragon', 'dragon', 0x7dd3fc, 0xe0f2fe],
    ['Lava Slime', 'slime', 0xf97316, 0xfde047], ['Fire Fox', 'quad', 0xdc2626, 0xfbbf24, 'point'], ['Magma Bat', 'bird', 0x450a0a, 0xf97316], ['Hellhound', 'quad', 0x1c1917, 0xef4444, 'point'], ['Phoenix', 'bird', 0xf59e0b, 0xef4444],
    ['Gummy Bear', 'quad', 0xf43f5e, 0xfda4af, 'round'], ['Candy Slime', 'slime', 0xec4899, 0xa5f3fc], ['Lollipop Owl', 'bird', 0xa78bfa, 0xfde047], ['Cupcake Cat', 'quad', 0xfbcfe8, 0x8b5cf6, 'point'], ['Rainbow Unicorn', 'quad', 0xffffff, 0xf0abfc, 'horn'],
    ['Alien', 'slime', 0x22c55e, 0xbbf7d0], ['Space Dog', 'quad', 0xe5e7eb, 0x6366f1, 'flop'], ['Robot', 'robot', 0x9ca3af, 0x22d3ee], ['Star Owl', 'bird', 0x312e81, 0xfde047], ['Cosmic Dragon', 'dragon', 0x1e1b4b, 0xa855f7],
  ];
  const eggOf = (sp) => Math.floor(sp / 5), rarOf = (sp) => sp % 5;
  const petMult = (sp) => 1 + (EGGS[eggOf(sp)].base - 1) * RAR[rarOf(sp)][2]; // a Desert Egg's Common: ×1.5
  const FLY = { bird: 1, dragon: 1, robot: 1 };
  const MAX_PETS = 50;

  /* ---------------- quests ---------------- */
  const QUESTS = {
    walk: { e: '👟', t: (g) => `Walk ${short(g)} studs`, goal: (L) => Math.round(400 * 1.7 ** L), pay: (L) => 15 * 1.9 ** L },
    gain: { e: '⚡', t: (g) => `Gain ${short(g)} speed`, goal: (L) => Math.round(150 * 2.1 ** L), pay: (L) => 20 * 1.9 ** L },
    reach: { e: '🚀', t: (g) => `Reach ${short(g)} speed`, goal: (L) => Math.round(60 * 2 ** L), pay: (L) => 25 * 1.9 ** L },
    orbs: { e: '🔵', t: (g) => `Collect ${g} speed orbs`, goal: (L) => 5 + 3 * L, pay: (L) => 15 * 1.9 ** L },
    wins: { e: '🏆', t: (g) => `Get ${g} wins`, goal: (L) => 2 + 3 * L, pay: (L) => 30 * 1.9 ** L },
    hatch: { e: '🥚', t: (g) => `Hatch ${g} egg${g > 1 ? 's' : ''}`, goal: (L) => 1 + L, pay: (L) => 25 * 1.9 ** L },
    convert: { e: '💱', t: (g) => `Convert ${short(g)} speed to money`, goal: (L) => Math.round(50 * 2 ** L), pay: (L) => 12 * 1.9 ** L },
    tread: { e: '🏃', t: (g) => `Run ${g}s on a treadmill`, goal: (L) => 20 + 15 * L, pay: (L) => 15 * 1.9 ** L },
    rebirth: { e: '🔁', t: () => 'Rebirth once', goal: () => 1, pay: (L) => 100 * 2.2 ** L },
  };
  const FIRST_QUESTS = ['walk', 'gain', 'hatch'];

  /* ---------------- pet models ---------------- */
  function petMesh(sp) {
    const [, shape, c1, c2, ex] = SPECIES[sp], g = new THREE.Group(), legend = rarOf(sp) === 4;
    const lam = (c) => new THREE.MeshLambertMaterial({ color: c, emissive: legend ? 0x221800 : 0x000000 });
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
      if (ex === 'round') { box(c1, 0.26, 0.26, 0.15, -0.33, 1.85, -0.72); box(c1, 0.26, 0.26, 0.15, 0.33, 1.85, -0.72); if (sp === 5) box(c2, 0.6, 0.45, 0.6, 0, 1.4, 0); }
      if (ex === 'horn') { cone(0xfde047, 0.1, 0.62, 0, 2.05, -1.05, -0.5); [0xef4444, 0xf59e0b, 0x22c55e, 0x3b82f6, 0xa855f7].forEach((c, i) => box(c, 0.12, 0.5, 0.18, 0, 1.75 - i * 0.08, -0.45 + i * 0.16)); }
      if (ex === 'claws') { box(c1, 0.35, 0.3, 0.35, -0.7, 0.85, -0.7); box(c1, 0.35, 0.3, 0.35, 0.7, 0.85, -0.7); cone(c2, 0.12, 0.5, 0, 1.6, 0.9); }
      if (shape === 'dragon') { wings(c2, 1.25, 1.2); cone(c2, 0.09, 0.35, -0.22, 1.9, -0.7); cone(c2, 0.09, 0.35, 0.22, 1.9, -0.7); for (let i = 0; i < 3; i++) cone(c2, 0.1, 0.3, 0, 1.25, -0.3 + i * 0.35); }
    } else if (shape === 'bird') {
      box(c1, 0.95, 1.05, 0.95, 0, 1.0, 0); box(c2, 0.7, 0.6, 0.06, 0, 0.9, -0.49);
      eyes(1.25, -0.49, 0.2); cone(0xf59e0b, 0.12, 0.35, 0, 1.08, -0.62, -Math.PI / 2);
      wings(c1, 1.05, 0.55); box(0xf59e0b, 0.12, 0.3, 0.12, -0.2, 0.35, 0); box(0xf59e0b, 0.12, 0.3, 0.12, 0.2, 0.35, 0);
    } else if (shape === 'slime') {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.75, 14, 10), new THREE.MeshLambertMaterial({ color: c1, transparent: true, opacity: 0.88 }));
      m.scale.set(1, 0.8, 1); m.position.y = 0.65; g.add(m);
      eyes(0.85, -0.7, 0.24);
      if (sp === 25) { box(0x111111, 0.06, 0.45, 0.06, -0.25, 1.35, 0); box(0x111111, 0.06, 0.45, 0.06, 0.25, 1.35, 0); box(c2, 0.16, 0.16, 0.16, -0.25, 1.6, 0); box(c2, 0.16, 0.16, 0.16, 0.25, 1.6, 0); }
    } else if (shape === 'robot') {
      box(c1, 1, 1, 1, 0, 1, 0); box(new THREE.MeshBasicMaterial({ color: c2 }), 0.7, 0.28, 0.04, 0, 1.12, -0.51); box(0x4b5563, 0.08, 0.5, 0.08, 0, 1.75, 0);
      box(new THREE.MeshBasicMaterial({ color: 0xef4444 }), 0.18, 0.18, 0.18, 0, 2.05, 0); wings(0x6b7280, 1.0, 0.4);
    }
    g.scale.setScalar(0.75 + rarOf(sp) * 0.08 + eggOf(sp) * 0.04);
    return g;
  }
  const portrait = (sp) => snapshot(`sp-${sp}`, () => petMesh(sp), { w: 140, h: 140, dir: [0.7, 0.35, -1] });

  /* ---------------- the world, baked into a few meshes ---------------- */
  // hundreds of decorations drawn one by one would be slow: they're merged into one mesh per zone
  const FACES = [
    [[1, 0, 0], [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], 2, 1], [[-1, 0, 0], [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], 2, 1],
    [[0, 0, 1], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], 0, 1], [[0, 0, -1], [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], 0, 1],
    [[0, 1, 0], [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], 0, 2], [[0, -1, 0], [[1, 0, 1], [0, 0, 1], [0, 0, 0], [1, 0, 0]], 0, 2],
  ];
  function bake(list, glow) {
    const n = list.length, pos = new Float32Array(n * 72), nor = new Float32Array(n * 72), clr = new Float32Array(n * 72), uv = new Float32Array(n * 48), idx = new Uint32Array(n * 36), col = new THREE.Color();
    let v = 0, u = 0, ii = 0;
    for (const b of list) {
      col.set(b[6]); const sz = [b[3] - b[0], b[4] - b[1], b[5] - b[2]];
      for (const [nn, cs, ua, va] of FACES) {
        const base = v / 3;
        cs.forEach((c, q) => {
          pos[v] = c[0] ? b[3] : b[0]; pos[v + 1] = c[1] ? b[4] : b[1]; pos[v + 2] = c[2] ? b[5] : b[2];
          nor[v] = nn[0]; nor[v + 1] = nn[1]; nor[v + 2] = nn[2]; clr[v] = col.r; clr[v + 1] = col.g; clr[v + 2] = col.b; v += 3;
          uv[u++] = q === 1 || q === 2 ? sz[ua] / 2 : 0; uv[u++] = q >= 2 ? sz[va] / 2 : 0;
        });
        idx[ii++] = base; idx[ii++] = base + 1; idx[ii++] = base + 2; idx[ii++] = base; idx[ii++] = base + 2; idx[ii++] = base + 3;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(clr, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, glow ? new THREE.MeshBasicMaterial({ vertexColors: true }) : new THREE.MeshLambertMaterial({ vertexColors: true, map: tex(1, 1) }));
    place.add(m);
    return m;
  }
  // something you bump into but that's drawn by a baked mesh
  const NOMESH = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial()); NOMESH.visible = false;
  const solidBox = (x0, y0, z0, x1, y1, z1) => parts.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2, sx: x1 - x0, sy: y1 - y0, sz: z1 - z0, solid: true, on: true, ox: 0, oy: 0, oz: 0, dx: 0, dy: 0, dz: 0, c: 0, m: NOMESH });

  /* ---------------- the experience ---------------- */
  const SP = {
    id: 'speed', code: 'sp', genre: 'Simulator', rank: 0.2, name: '+1 Speed Every Step', emoji: '⚡', max: 12, stat: 'Speed', killY: -30, camDist: 22,
    land: { theme: 'meadow', box: [-62, END - 34, 62, 0], keep: [[-56, -2, 56, 96]], under: [[-62, END - 34, 62, 0], [-320, 0, 320, 240]], bands: ['meadow', 'desert', 'snow', 'volcano', 'candy', 'space'].map((t, k) => [k === 5 ? -1e9 : -(k + 1) * ZL, k ? -k * ZL : 1e9, t]) }, // the land changes with the zones
    color: 'linear-gradient(135deg,#facc15,#ef4444)',
    desc: 'Every second you keep walking you get +1 speed, and the wait for the next one drops by 10% each time. Run six zones for wins, do quests and convert speed for money, hatch pets that multiply your speed per step, and rebirth for even more. Your progress is saved.',
    welcome: 'Keep walking to get faster! Try the treadmills, or run the track ➜',
    build() {
      sky(ZONES[0].sky[0], ZONES[0].sky[1]);
      this.zoneSky = -2; this.orbs = []; this.gates = []; this.treads = []; this.eggStands = []; this.machines = [];
      this.buildHub();
      ZONES.forEach((Z, k) => this.buildZone(Z, k));
      // the walls down both sides of the whole track (you can't fall off)
      for (const s of [-1, 1]) solidBox(s > 0 ? W2 : -W2 - 4, -2, END - 30, s > 0 ? W2 + 4 : -W2, 40, 2);
      slab(0, 0, END - 15, W2 * 2, 30, ZONES[ZONES.length - 1].g, { sy: 2, plain: true }); // past the finish, up to the end wall
      bake([[-W2, 0, END - 32, W2, 8, END - 30, ZONES[ZONES.length - 1].edge]]);
      solidBox(-W2, -2, END - 34, W2, 40, END - 30);
    },
    buildHub() {
      // floor, low walls, and the start arch
      slab(0, 0, 45, 100, 90, 0xd1d5db, { sy: 2 });
      part({ x: 0, y: -1.3, z: 120, sx: 640, sy: 2, sz: 240, c: 0x5aa83c, plain: true, solid: false }); // the land round it
      const B = [];
      const wall = (x0, z0, x1, z1) => { B.push([x0, 0, z0, x1, 3, z1, 0x94a3b8]); solidBox(x0, 0, z0, x1, 30, z1); };
      wall(-50, 88, 50, 90); wall(-52, 0, -50, 90); wall(50, 0, 52, 90); wall(-W2, -1, -50, 1); wall(50, -1, W2, 1);
      const sg = label('⚡ +1 SPEED EVERY STEP', { size: 3.6, color: '#fde047' }); sg.position.set(0, 14, 88); place.add(sg);
      // the treadmills: walk on them and you stay put, gaining speed (×2, ×5, ×10 once you've rebirthed enough)
      for (const t of TREADS) {
        B.push([t.x - 5, 0, TZ0 - 1, t.x - 3.6, 2.6, TZ1 + 1, 0x334155], [t.x + 3.6, 0, TZ0 - 1, t.x + 5, 2.6, TZ1 + 1, 0x334155]);
        B.push([t.x - 5, 2.6, TZ0 - 1, t.x - 3.6, 3.2, TZ0 + 1, 0x475569], [t.x + 3.6, 2.6, TZ0 - 1, t.x + 5, 3.2, TZ0 + 1, 0x475569]);
        solidBox(t.x - 5, 0, TZ0 - 1, t.x - 3.6, 2.6, TZ1 + 1); solidBox(t.x + 3.6, 0, TZ0 - 1, t.x + 5, 2.6, TZ1 + 1);
        const p = part({ x: t.x, y: 0.2, z: (TZ0 + TZ1) / 2, sx: 7.2, sy: 0.4, sz: TZ1 - TZ0, c: 0xffffff, stripes: t.c, conv: [0, 0] });
        p.tm = t; t.p = p;
        t.l = null; t.lk = null;
        this.treads.push(t);
      }
      // machines: rebirth, convert, quests
      this.machines = [
        { x: 22, z: 50, e: '🔁', n: 'Rebirth', c: 0xa855f7, fn: () => this.rebirthPanel() },
        { x: 34, z: 50, e: '💱', n: 'Convert Speed', c: 0x16a34a, fn: () => this.convertPanel() },
        { x: 46, z: 50, e: '📜', n: 'Quests', c: 0xf59e0b, fn: () => this.questPanel() },
      ];
      for (const m of this.machines) {
        part({ x: m.x, y: 2.5, z: m.z, sx: 8, sy: 5, sz: 4, c: m.c });
        part({ x: m.x, y: 5.4, z: m.z, sx: 8.4, sy: 0.8, sz: 4.4, c: 0xffffff, neon: true });
        const l = label(`${m.e} ${m.n}`, { size: 1.35 }); l.position.set(m.x, 8, m.z); place.add(l);
      }
      // the eggs, in a row
      EGGS.forEach((E, k) => {
        const x = 14 + k * 7, z = 24;
        B.push([x - 2.6, 0, z - 2.6, x + 2.6, 1.6, z + 2.6, 0xfef3c7]);
        solidBox(x - 2.6, 0, z - 2.6, x + 2.6, 1.6, z + 2.6);
        const eg = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12), new THREE.MeshLambertMaterial({ color: E.c, emissive: k >= 4 ? 0x1a0a22 : 0 }));
        eg.scale.y = 1.3; eg.position.set(x, 3.7, z); place.add(eg);
        const l = label(`${E.e} ${E.n}\n${cash(E.price)}`, { size: 1.05 }); l.position.set(x, 7.6, z); place.add(l);
        this.eggStands.push({ x, z, k, eg });
      });
      // the start arch
      B.push([-ROAD - 3, 0, -1, -ROAD, 12, 1, 0xfacc15], [ROAD, 0, -1, ROAD + 3, 12, 1, 0xfacc15], [-ROAD - 3, 12, -1, ROAD + 3, 14, 1, 0xef4444]);
      solidBox(-ROAD - 3, 0, -1, -ROAD, 12, 1); solidBox(ROAD, 0, -1, ROAD + 3, 12, 1);
      const st = label('🏁 THE TRACK ➜', { size: 2.2 }); st.position.set(0, 16, 0); place.add(st);
      bake(B);
    },
    buildZone(Z, k) {
      const z0 = -ZL * k, z1 = -ZL * (k + 1), r = mulberry(4100 + k), B = [], G = [];
      // ground, road, road edges
      slab(0, 0, (z0 + z1) / 2, W2 * 2, ZL, Z.g, { sy: 2, plain: k === 5 });
      part({ x: 0, y: -1.3, z: (z0 + z1) / 2, sx: 640, sy: 2, sz: ZL, c: new THREE.Color(Z.g).multiplyScalar(0.82).getHex(), plain: true, solid: false }); // the land beyond the walls
      for (const s of [-1, 1]) B.push([s > 0 ? W2 : -W2 - 1, 0, z1, s > 0 ? W2 + 1 : -W2, 1.2, z0, Z.edge]); // a kerb where the walls are
      part({ x: 0, y: 0.04, z: (z0 + z1) / 2, sx: ROAD * 2, sy: 0.08, sz: ZL, c: Z.road, plain: true, solid: false });
      for (const s of [-1, 1]) part({ x: s * (ROAD + 0.6), y: 0.09, z: (z0 + z1) / 2, sx: 1.2, sy: 0.18, sz: ZL, c: Z.edge, plain: true, solid: false });
      // dashes down the middle
      for (let z = z0 - 6; z > z1 + 4; z -= 14) G.push([-0.4, 0.02, z - 6, 0.4, 0.12, z, k === 5 ? 0xa78bfa : 0xffffff]);
      // distance signs
      for (let d = 100; d < ZL; d += 200) { const l = label(`${Z.e} ${(k * ZL + d).toLocaleString()} studs`, { size: 1.3, bg: 'rgba(15,23,42,.6)' }); l.position.set(-ROAD - 4, 3, z0 - d); place.add(l); }
      // decorations either side of the road
      const deco = (x, z) => {
        const t = r();
        if (k === 0) {
          if (t < 0.55) { const h = 4 + r() * 3; B.push([x - 0.6, 0, z - 0.6, x + 0.6, h, z + 0.6, 0x7c4a1e], [x - 2.6, h - 0.5, z - 2.6, x + 2.6, h + 3.5, z + 2.6, r() < 0.5 ? 0x2f9e44 : 0x40c057]); solidBox(x - 0.6, 0, z - 0.6, x + 0.6, h, z + 0.6); }
          else if (t < 0.8) B.push([x - 1.5, 0, z - 1.2, x + 1.5, 1.6, z + 1.2, 0x37b24d]);
          else for (let i = 0; i < 4; i++) { const fx = x + (r() - 0.5) * 4, fz = z + (r() - 0.5) * 4; B.push([fx - 0.1, 0, fz - 0.1, fx + 0.1, 0.8, fz + 0.1, 0x2b8a3e], [fx - 0.35, 0.8, fz - 0.35, fx + 0.35, 1.3, fz + 0.35, [0xf03e3e, 0xfab005, 0xf783ac, 0x748ffc][i]]); }
        } else if (k === 1) {
          if (t < 0.5) { const h = 4 + r() * 4; B.push([x - 0.8, 0, z - 0.8, x + 0.8, h, z + 0.8, 0x2f7d32], [x - 2.6, h * 0.45, z - 0.5, x - 0.8, h * 0.45 + 0.9, z + 0.5, 0x2f7d32], [x - 2.6, h * 0.45, z - 0.5, x - 1.7, h * 0.75, z + 0.5, 0x2f7d32], [x + 0.8, h * 0.6, z - 0.5, x + 2.4, h * 0.6 + 0.9, z + 0.5, 0x2f7d32], [x + 1.5, h * 0.6, z - 0.5, x + 2.4, h * 0.85, z + 0.5, 0x2f7d32]); solidBox(x - 0.8, 0, z - 0.8, x + 0.8, h, z + 0.8); }
          else if (t < 0.75) B.push([x - 2, 0, z - 1.5, x + 2, 1.4, z + 1.5, 0xc2a26b], [x - 1.2, 1.4, z - 1, x + 1.2, 2.2, z + 1, 0xb08d57]);
          else B.push([x - 0.9, 0, z - 0.9, x + 0.9, 0.6, z + 0.9, 0xf5f5f4]);
        } else if (k === 2) {
          if (t < 0.55) { for (let n = 0; n < 4; n++) B.push([x - 2.4 + n * 0.55, 1 + n * 2, z - 2.4 + n * 0.55, x + 2.4 - n * 0.55, 3 + n * 2, z + 2.4 - n * 0.55, n === 3 ? 0xffffff : 0x14532d]); B.push([x - 0.5, 0, z - 0.5, x + 0.5, 1, z + 0.5, 0x5b3a1e]); solidBox(x - 0.5, 0, z - 0.5, x + 0.5, 4, z + 0.5); }
          else if (t < 0.75) { B.push([x - 1.2, 0, z - 1.2, x + 1.2, 2.2, z + 1.2, 0xffffff], [x - 0.9, 2.2, z - 0.9, x + 0.9, 3.8, z + 0.9, 0xffffff], [x - 0.6, 3.8, z - 0.6, x + 0.6, 5, z + 0.6, 0xffffff], [x - 0.12, 4.2, z - 0.9, x + 0.12, 4.45, z - 0.6, 0xf97316], [x - 0.65, 3.65, z - 0.65, x + 0.65, 3.95, z + 0.65, 0xef4444]); solidBox(x - 1.2, 0, z - 1.2, x + 1.2, 5, z + 1.2); }
          else B.push([x - 1.6, 0, z - 1.6, x + 1.6, 2.4, z + 1.6, 0xbae6fd]);
        } else if (k === 3) {
          if (t < 0.45) { const h = 2 + r() * 3; B.push([x - 1.8, 0, z - 1.8, x + 1.8, h, z + 1.8, 0x292524], [x - 1, h, z - 1, x + 1, h + 1.2, z + 1, 0x44403c]); solidBox(x - 1.8, 0, z - 1.8, x + 1.8, h, z + 1.8); }
          else if (t < 0.8) G.push([x - 3, 0.02, z - 2.2, x + 3, 0.16, z + 2.2, 0xff6a00]);
          else B.push([x - 0.5, 0, z - 0.5, x + 0.5, 5, z + 0.5, 0x1c1917], [x - 0.3, 5, z - 0.3, x + 0.3, 6.4, z + 0.3, 0x1c1917]);
        } else if (k === 4) {
          if (t < 0.4) { const c = [0xf43f5e, 0x22d3ee, 0xfde047, 0xa78bfa][Math.floor(r() * 4)]; B.push([x - 0.25, 0, z - 0.25, x + 0.25, 6, z + 0.25, 0xffffff], [x - 1.8, 5.5, z - 0.4, x + 1.8, 9.1, z + 0.4, c]); solidBox(x - 0.25, 0, z - 0.25, x + 0.25, 6, z + 0.25); }
          else if (t < 0.7) { for (let n = 0; n < 6; n++) B.push([x - 0.45, n, z - 0.45, x + 0.45, n + 1, z + 0.45, n % 2 ? 0xffffff : 0xef4444]); B.push([x - 0.45, 6, z - 0.45, x + 1.6, 6.9, z + 0.45, 0xef4444]); solidBox(x - 0.45, 0, z - 0.45, x + 0.45, 6, z + 0.45); }
          else { const c = [0x22c55e, 0xf97316, 0xa855f7, 0xec4899][Math.floor(r() * 4)]; B.push([x - 1.4, 0, z - 1.4, x + 1.4, 1.8, z + 1.4, c], [x - 0.9, 1.8, z - 0.9, x + 0.9, 2.6, z + 0.9, c]); }
        } else {
          if (t < 0.4) { const c = [0xc084fc, 0x22d3ee, 0xf0abfc][Math.floor(r() * 3)]; G.push([x - 0.5, 0, z - 0.5, x + 0.5, 3 + r() * 3, z + 0.5, c]); }
          else if (t < 0.7) B.push([x - 3, 0, z - 3, x + 3, 0.5, z + 3, 0x4c4a8a], [x - 2.2, 0, z - 2.2, x + 2.2, 0.55, z + 2.2, 0x1e1b4b]);
          else { B.push([x - 1.4, 0, z - 1.4, x + 1.4, 1.6, z + 1.4, 0x6b7280]); solidBox(x - 1.4, 0, z - 1.4, x + 1.4, 1.6, z + 1.4); }
        }
      };
      for (let z = z0 - 10; z > z1 + 6; z -= 9) for (const s of [-1, 1]) if (r() < 0.75) deco(s * (ROAD + 5 + r() * (W2 - ROAD - 9)), z + (r() - 0.5) * 6);
      // big things far out to the sides
      for (let z = z0 - 40; z > z1; z -= 90) for (const s of [-1, 1]) {
        const x = s * (W2 + 30 + r() * 40);
        if (k === 1) for (let n = 0; n < 6; n++) B.push([x - 16 + n * 2.6, n * 3.2, z - 16 + n * 2.6, x + 16 - n * 2.6, (n + 1) * 3.2, z + 16 - n * 2.6, 0xd9b26a]);
        else if (k === 2) for (let n = 0; n < 5; n++) B.push([x - 20 + n * 4, n * 6, z - 20 + n * 4, x + 20 - n * 4, (n + 1) * 6, z + 20 - n * 4, n >= 3 ? 0xffffff : 0x64748b]);
        else if (k === 3) { for (let n = 0; n < 5; n++) B.push([x - 22 + n * 4.2, n * 6, z - 22 + n * 4.2, x + 22 - n * 4.2, (n + 1) * 6, z + 22 - n * 4.2, 0x3f3a37]); G.push([x - 3, 30, z - 3, x + 3, 31, z + 3, 0xff6a00]); }
        else if (k === 0) B.push([x - 8, 0, z - 8, x + 8, 12, z + 8, 0x2f9e44], [x - 5, 12, z - 5, x + 5, 18, z + 5, 0x37b24d]);
        else if (k === 4) B.push([x - 6, 0, z - 6, x + 6, 10, z + 6, 0xf9a8d4], [x - 7, 10, z - 7, x + 7, 13, z + 7, 0xfef3c7], [x - 1, 13, z - 1, x + 1, 15, z + 1, 0xef4444]);
      }
      if (k === 5) {
        for (let i = 0; i < 70; i++) G.push(((x, y, z) => [x, y, z, x + 0.6, y + 0.6, z + 0.6, 0xffffff])((r() - 0.5) * 400, 40 + r() * 120, z0 - r() * ZL));
        for (let i = 0; i < 5; i++) {
          const m = new THREE.Mesh(new THREE.SphereGeometry(10 + r() * 22, 20, 14), new THREE.MeshLambertMaterial({ color: [0xf97316, 0x38bdf8, 0xa855f7, 0xfde047, 0x22c55e][i] }));
          m.position.set((r() < 0.5 ? -1 : 1) * (110 + r() * 80), 40 + r() * 70, z0 - 60 - i * 95); place.add(m);
        }
      }
      if (B.length) bake(B);
      if (G.length) bake(G, true);
      // the finish line at the end of the zone, under an arch
      part({ x: 0, y: 0.12, z: z1 + 2, sx: W2 * 2, sy: 0.1, sz: 4, c: k === ZONES.length - 1 ? 0xfacc15 : 0x22c55e, neon: true, solid: false });
      for (const s of [-1, 1]) part({ x: s * (ROAD + 1.5), y: 12, z: z1 + 2, sx: 3, sy: 24, sz: 3, c: Z.edge }); // tall, so the camera doesn't pass under the top
      part({ x: 0, y: 25, z: z1 + 2, sx: ROAD * 2 + 6, sy: 2.2, sz: 3, c: Z.edge });
      const fl = label(k === ZONES.length - 1 ? `🏁 FINISH! 🏆 +${Z.win} wins` : `🏆 +${Z.win} win${Z.win > 1 ? 's' : ''}`, { size: 2.2, color: '#fde047' }); fl.position.set(0, 29, z1 + 2); place.add(fl);
      // the gate into the next zone: shut until you're fast enough
      if (k > 0) {
        const p = part({ x: 0, y: 10, z: z0 - 3, sx: W2 * 2, sy: 20, sz: 1, c: Z.edge, alpha: 0.45, plain: true });
        const l = label(`${Z.e} ${Z.n}\n🔒 ⚡ ${short(Z.need)} speed`, { size: 2.1, bg: 'rgba(15,23,42,.8)' }); l.position.set(0, 9, z0 - 1.2); place.add(l);
        this.gates.push({ k, p, l, need: Z.need, open: null });
      }
      // speed orbs along the road
      for (let i = 0; i < 18; i++) {
        const z = z0 - 18 - i * ((ZL - 36) / 18), x = (r() - 0.5) * (ROAD * 2 - 6);
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 0), new THREE.MeshBasicMaterial({ color: [0x22d3ee, 0xfde047, 0xa3e635, 0xf472b6, 0xf97316, 0xc084fc][k] }));
        m.position.set(x, 2, z); place.add(m);
        this.orbs.push({ x, z, k, m, back: 0, ph: r() * 6 });
      }
    },

    /* ---- you ---- */
    pres() { return { sp: 0, rb: 0, w: 0, pt: '' }; },
    async enter() {
      const s = await kvGet('sp');
      const D = { sp: 0, best: 0, total: 0, rb: 0, cash: 0, wins: 0, pets: [], eq: [], q: [], ql: {}, eggs: 0, zMax: 0, lim: 0 };
      this.S = Object.assign(D, s && typeof s === 'object' ? s : {});
      const S = this.S, num = (v) => (Number.isFinite(+v) && +v > 0 ? +v : 0);
      for (const k of ['sp', 'best', 'total', 'cash', 'wins', 'eggs']) S[k] = num(S[k]);
      S.rb = Math.floor(num(S.rb)); S.zMax = clamp(Math.floor(num(S.zMax)), 0, ZONES.length - 1); S.lim = clamp(S.lim | 0, 0, LIMITS.length - 1);
      S.pets = (Array.isArray(S.pets) ? S.pets : []).map((p) => p | 0).filter((p) => SPECIES[p]).slice(0, MAX_PETS);
      S.eq = (Array.isArray(S.eq) ? S.eq : []).map((i) => i | 0).filter((i, n, a) => S.pets[i] != null && a.indexOf(i) === n).slice(0, this.slots());
      S.ql = S.ql && typeof S.ql === 'object' ? S.ql : {};
      S.q = (Array.isArray(S.q) ? S.q : []).filter((q) => Array.isArray(q) && QUESTS[q[0]] && q[2] > 0).slice(0, 3);
      if (!S.q.length) for (const t of FIRST_QUESTS) S.q.push(this.newQuest(t));
      while (S.q.length < 3) S.q.push(this.newQuest());
      this.delay = 1; this.acc = 0; this.idle = 9; this.run = -1; this.popN = 0; this.popAt = 0; this.sentAt = 0; this.savedAt = performance.now(); this.dirty = false; this.tpAt = -1e9;
      this.myPets = []; this.others = new Map();
      const hud = $('#xhud');
      this.qEl = document.createElement('div'); this.qEl.id = 'spQ'; this.qEl.onclick = () => this.questPanel(); hud.append(this.qEl); this.qHtml = '';
      this.gEl = document.createElement('div'); this.gEl.id = 'spGain'; hud.append(this.gEl);
      this.mEl = document.createElement('div'); this.mEl.id = 'spMeter'; hud.append(this.mEl); this.mHtml = '';
      this.syncPets();
      this.drawBar();
      this.treadLabels();
      this.send(true);
    },
    // over each treadmill: what it multiplies, and the rebirth it needs until you have it
    treadLabels() {
      for (const t of this.treads) {
        const lk = this.S.rb < t.rb;
        if (t.l && t.lk === lk) continue;
        if (t.l) { place.remove(t.l); t.l.material.map.dispose(); t.l.material.dispose(); }
        t.l = label(`×${t.mult} Treadmill${lk ? `\n🔒 Rebirth ${t.rb}` : ''}`, { size: 1.5, color: lk ? '#cbd5e1' : t.c }); t.l.position.set(t.x, 6, TZ0 - 1); place.add(t.l); t.lk = lk;
      }
    },
    leave() {
      this.save();
      this.clearPetMeshes(); this.hatchClose();
      if (camera.fov !== 70) { camera.fov = 70; camera.updateProjectionMatrix(); }
    },
    save() { this.dirty = false; this.savedAt = performance.now(); return kvSet('sp', this.S); },
    send(now) {
      const S = this.S, t = performance.now();
      if (!now && t - this.sentAt < 1000) return;
      this.sentAt = t;
      send({ sp: Math.floor(S.sp), rb: S.rb, w: Math.floor(S.wins), pt: S.eq.map((i) => S.pets[i]).join(',') });
    },
    spawn() { return [0, 0.6, 66, 0]; },
    speed() { const S = this.S; if (!S) return 16; const ws = walkSpeed(S.sp), lim = LIMITS[S.lim]; return lim ? Math.min(ws, lim) : ws; },
    slots() { return 3 + Math.min(3, Math.floor((this.S ? this.S.rb : 0) / 5)); },
    petBoost() { const S = this.S; return 1 + S.eq.reduce((a, i) => a + petMult(S.pets[i]) - 1, 0); },
    // speed you get each gain: +1, +1 more for every rebirth, times your pets, times the treadmill you're on
    perStep(tm) { return (1 + this.S.rb) * this.petBoost() * (tm ? tm.mult : 1); },
    onTread() { const g = P.ground; return g && g.tm && this.S.rb >= g.tm.rb ? g.tm : null; },

    tick(dt) {
      const S = this.S;
      if (!S) return;
      const T = performance.now() / 1000;
      const zone = zoneAt(P.z);
      if (zone !== this.zoneSky) {
        this.zoneSky = zone; const Z = ZONES[Math.max(0, zone)]; sky(Z.sky[0], Z.sky[1]);
        if (zone > S.zMax) { S.zMax = zone; this.dirty = true; toast(`${Z.e} Welcome to ${Z.n}!`, '#fde68a'); earn(10 * zone, `reached ${Z.n}`); Net.chat(`${Z.e} reached ${Z.n}!`); }
      }
      if (P.z > 4) this.run = -1; // back in the hub: the next run's wins count again
      // walking? (pushing to move, and actually moving: walking into a wall doesn't count)
      const ws = this.speed(), tm = this.onTread();
      const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y, r = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
      const walking = Math.hypot(f, r) > 0.1 && !P.frozen && !P.dead && !chatOpen() && !fullOpen() && Math.hypot(P.vx, P.vz) > ws * 0.3;
      if (walking) {
        this.idle = 0; this.acc += dt;
        while (this.acc >= this.delay) { this.acc -= this.delay; this.step(tm); this.delay = Math.max(MIN_DELAY, this.delay * 0.9); }
        this.prog('walk', Math.hypot(P.vx, P.vz) * dt);
        if (tm) { this.tmT = (this.tmT || 0) + dt; if (this.tmT >= 1) { this.tmT -= 1; this.prog('tread', 1); } }
      } else {
        this.idle += dt;
        if (this.idle > IDLE && (this.delay < 1 || this.acc > 0)) { this.delay = 1; this.acc = 0; }
      }
      // treadmills run as fast as you walk (backwards), so you stay on them; locked ones don't run
      for (const t of this.treads) t.p.conv[1] = S.rb >= t.rb ? ws : 0;
      // a faster run looks faster
      const fov = 70 + 16 * clamp((ws - 16) / 224, 0, 1);
      if (Math.abs(camera.fov - fov) > 0.3) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }
      if (walking && P.ground && ws > 60 && !tm && T - (this.trailAt || 0) > 0.09) { this.trailAt = T; puffAt(P.x, P.y + 0.4, P.z, [0xffffff, ZONES[Math.max(0, zone)].edge], 2); }
      // the gates open for you once you're fast enough
      for (const g of this.gates) {
        const open = S.sp >= g.need;
        if (open !== g.open) { g.open = open; g.p.on = !open; g.p.m.material.opacity = open ? 0.12 : 0.45; g.l.material.opacity = open ? 0.35 : 1; }
      }
      // speed orbs
      const now = performance.now();
      for (const o of this.orbs) {
        if (!o.m.visible) { if (now > o.back) { o.m.visible = true; o.m.scale.setScalar(0.2); } continue; }
        if (Math.abs(o.z - P.z) > 300) continue;
        if (o.m.scale.x < 1) o.m.scale.setScalar(Math.min(1, o.m.scale.x + dt * 2));
        o.m.rotation.y = T * 2 + o.ph; o.m.position.y = 2 + Math.sin(T * 3 + o.ph) * 0.4;
        if (Math.abs(o.x - P.x) < 2.8 && Math.abs(o.z - P.z) < 2.8 && P.y < 5) this.orb(o);
      }
      // finish lines: wins and money, once per run
      const done = Math.min(ZONES.length - 1, Math.floor((3 - P.z) / ZL) - 1); // the last finish line you're past
      if (done > this.run && !P.dead) this.win(done);
      if ((S.sp >= rebirthNeed(S.rb)) !== this.barRb) this.drawBar();
      // pets follow you
      this.myPets.forEach((pt, i) => { const [x, z] = this.slot(i, this.myPets.length, P.x, P.z, P.yaw); this.movePet(pt, x, z, P.y, dt, FLY[SPECIES[pt.sp][1]], ws); });
      this.drawOthers(dt);
      // the gains so far, floating up
      if (this.popN && now - this.popAt > 280) { this.gEl.textContent = `+${short(this.popN)} ⚡`; this.gEl.classList.remove('go'); void this.gEl.offsetWidth; this.gEl.classList.add('go'); this.popN = 0; this.popAt = now; }
      this.drawMeter(walking, tm);
      this.drawQuests();
      this.send();
      if (this.dirty && now - this.savedAt > 8000) this.save();
    },
    step(tm) {
      const S = this.S, n = this.perStep(tm);
      S.sp += n; S.total += n; S.best = Math.max(S.best, S.sp); this.popN += n; this.dirty = true;
      this.prog('gain', n); this.prog('reach', 0);
      if (performance.now() - (this.stepSnd || 0) > 140) { this.stepSnd = performance.now(); sfx('tick', { vol: 0.25, pitch: 1 + Math.min(1, (1 - this.delay) * 1.2) }); }
    },
    orb(o) {
      o.m.visible = false; o.back = performance.now() + 15000;
      const n = this.perStep(null) * 5 * (o.k + 1);
      this.S.sp += n; this.S.total += n; this.S.best = Math.max(this.S.best, this.S.sp); this.popN += n; this.dirty = true;
      this.prog('orbs', 1); this.prog('gain', n); this.prog('reach', 0);
      puffAt(o.x, 2, o.z, [0xffffff, o.m.material.color.getHex()], 8); sfx('powerup', { vol: 0.5 });
    },
    win(k) {
      const S = this.S, Z = ZONES[k], pay = Z.pay * (1 + 0.25 * S.rb), last = k === ZONES.length - 1;
      this.run = k; S.wins += Z.win; S.cash += pay; this.dirty = true;
      this.prog('wins', Z.win);
      toast(`🏆 +${Z.win} win${Z.win > 1 ? 's' : ''} · +${cash(pay)}`, '#fde68a'); sfx(last ? 'win' : 'reward');
      puffAt(P.x, P.y + 3, P.z, last ? CONFETTI : [0x22c55e, 0xfde047], last ? 40 : 14);
      if (last) {
        earn(15, 'finished the whole track!'); Net.chat('🏁 finished the whole speed track!');
        setBanner('🏁 You finished the whole track! Back to the hub…');
        setTimeout(() => { setBanner(''); if (exp === SP && P.z < END + 40) this.tp(-1); }, 1800);
      }
      this.save();
    },

    /* ---- quests ---- */
    newQuest(type) {
      const S = this.S, have = S.q.map((q) => q[0]);
      if (!type) { const opts = Object.keys(QUESTS).filter((t) => !have.includes(t)); type = opts[Math.floor(Math.random() * opts.length)]; }
      const L = S.ql[type] | 0, Q = QUESTS[type];
      return [type, 0, Q.goal(L), Math.round(Q.pay(L))];
    },
    prog(type, n) {
      const S = this.S;
      for (let i = 0; i < S.q.length; i++) {
        const q = S.q[i];
        if (q[0] !== type) continue;
        q[1] = type === 'reach' ? Math.max(q[1], Math.floor(S.sp)) : q[1] + n;
        if (q[1] >= q[2]) {
          S.cash += q[3]; S.ql[type] = (S.ql[type] | 0) + 1; S.q[i] = this.newQuest();
          // (the new one isn't this type, so it can't finish twice from one gain)
          toast(`📜 Quest done: ${QUESTS[type].t(q[2])}! +${cash(q[3])}`, '#86efac'); sfx('reward');
          this.dirty = true; this.qHtml = '';
        }
      }
    },
    drawQuests() {
      const S = this.S;
      const html = `<div class="qh">📜 Quests <small>Q</small></div>` + S.q.map(([t, p, g, pay]) => `<div class="q"><span class="pay">+${cash(pay)}</span><b>${QUESTS[t].e} ${QUESTS[t].t(g)}</b><div class="bar"><i style="width:${Math.min(100, (100 * p) / g).toFixed(1)}%"></i></div></div>`).join('');
      if (html !== this.qHtml) { this.qHtml = html; this.qEl.innerHTML = html; }
    },
    questPanel() {
      const S = this.S;
      const html = `<p class="xp-note">Quests pay 💵 money. Finish one and a new one takes its place, a bit harder and paying more.</p>` + S.q.map(([t, p, g, pay]) => `<div class="xp-row"><span><b>${QUESTS[t].e} ${QUESTS[t].t(g)}</b><br><small style="color:var(--muted)">${short(Math.min(p, g))} / ${short(g)}</small></span><span style="color:#86efac;font-weight:800">+${cash(pay)}</span></div>`).join('')
        + `<div class="xp-row"><span>💵 Money</span><b>${cash(S.cash)}</b></div>`;
      openPanel('📜 Quests', html);
    },

    /* ---- the HUD ---- */
    drawMeter(walking, tm) {
      const S = this.S, fill = walking ? clamp(this.acc / this.delay, 0, 1) : 0;
      const ps = this.perStep(tm);
      const html = `⚡ ${short(S.sp)} <small>+${ps < 100 && ps % 1 ? ps.toFixed(1) : short(ps)}/step · every ${this.delay.toFixed(2)}s</small><span class="t"><i style="width:${(fill * 100).toFixed(0)}%"></i></span>`;
      if (html !== this.mHtml) { this.mHtml = html; this.mEl.innerHTML = html; }
    },
    hud() {
      if (!this.S) return '';
      const S = this.S, z = zoneAt(P.z), tm = this.onTread();
      return `💵 <b>${cash(S.cash)}</b> · 🏆 <b>${short(S.wins)}</b> · 🔁 ${S.rb} · 🏃 ${Math.round(this.speed())} studs/s · ${z < 0 ? (tm ? `🏃 ×${tm.mult} treadmill` : '🏠 Hub') : `${ZONES[z].e} ${ZONES[z].n}`}`;
    },
    statOf(pr, isMe) { return short(isMe ? this.S && this.S.sp : pr.sp || 0); },
    sortKey(pr, isMe) { return isMe ? (this.S ? this.S.sp : 0) : +pr.sp || 0; },
    drawBar() {
      const S = this.S, need = rebirthNeed(S.rb), lim = LIMITS[S.lim];
      setBar(`<button class="xslot" data-k="pets" title="Pets (P)"><span class="k">P</span><span class="e">🐾</span>Pets<span class="n">${S.eq.length}/${this.slots()}</span></button>`
        + `<button class="xslot" data-k="eggs" title="Eggs (B)"><span class="k">B</span><span class="e">🥚</span>Eggs</button>`
        + `<button class="xslot ${S.sp >= need ? 'on' : ''}" data-k="rb" title="Rebirth"><span class="e">🔁</span>Rebirth${S.sp >= need ? '<span class="n">!</span>' : ''}</button>`
        + `<button class="xslot" data-k="cv" title="Convert speed to money (C)"><span class="k">C</span><span class="e">💱</span>Convert</button>`
        + `<button class="xslot" data-k="q" title="Quests (Q)"><span class="k">Q</span><span class="e">📜</span>Quests</button>`
        + `<button class="xslot" data-k="tp" title="Teleport (T)"><span class="k">T</span><span class="e">🗺️</span>Teleport</button>`
        + `<button class="xslot ${lim ? 'on' : ''}" data-k="lim" title="Speed limit (L): walk slower when you need to"><span class="k">L</span><span class="e">${lim ? '🐢' : '🏎️'}</span>${lim ? `Max ${lim}` : 'No limit'}</button>`, (b) => this.barKey(b.dataset.k));
      this.barRb = S.sp >= need;
    },
    barKey(k) {
      if (k === 'pets') this.petsPanel();
      if (k === 'eggs') this.eggsPanel();
      if (k === 'rb') this.rebirthPanel();
      if (k === 'cv') this.convertPanel();
      if (k === 'q') this.questPanel();
      if (k === 'tp') this.teleports();
      if (k === 'lim') { this.S.lim = (this.S.lim + 1) % LIMITS.length; this.dirty = true; sfx('toggle'); toast(LIMITS[this.S.lim] ? `🐢 Speed limit: ${LIMITS[this.S.lim]} studs/s` : '🏎️ No speed limit', '#fff'); this.drawBar(); }
    },
    key(code, down) {
      if (!down) return;
      const k = { KeyP: 'pets', KeyB: 'eggs', KeyC: 'cv', KeyQ: 'q', KeyT: 'tp', KeyL: 'lim' }[code];
      if (k) { this.barKey(k); return true; }
    },
    prompts() {
      const out = this.machines.map((m) => ({ x: m.x, z: m.z - 3, r: 6, text: `${m.e} ${m.n}`, fn: m.fn }));
      for (const s of this.eggStands) out.push({ x: s.x, z: s.z - 3, r: 4.5, text: `${EGGS[s.k].e} ${EGGS[s.k].n} (${cash(EGGS[s.k].price)})`, fn: () => this.eggPanel(s.k) });
      return out;
    },

    /* ---- rebirth and convert ---- */
    rebirthPanel() {
      const S = this.S, need = rebirthNeed(S.rb), ok = S.sp >= need, next = TREADS.find((t) => t.rb === S.rb + 1);
      const html = `<div class="sp-big">🔁 Rebirth ${S.rb + 1}</div><div class="sp-sub">Needs ⚡ <b>${short(need)}</b> speed · you have <b>${short(S.sp)}</b></div>
        <div class="xp-row"><span>✅ <b>+1 speed every step</b><br><small style="color:var(--muted)">+${1 + S.rb} → +${2 + S.rb} each step (before pets)</small></span></div>
        <div class="xp-row"><span>❌ <b>Your speed goes back to 0</b><br><small style="color:var(--muted)">You keep your money, wins, pets and quests</small></span></div>
        ${next ? `<div class="xp-row"><span>🏃 <b>Unlocks the ×${next.mult} treadmill</b></span></div>` : ''}
        ${(S.rb + 1) % 5 === 0 && this.slots() < 6 ? '<div class="xp-row"><span>🐾 <b>+1 pet slot</b></span></div>' : ''}
        <p class="xp-note">Each rebirth needs 25% more speed than the last.</p>
        <button class="xp-btn purple" data-rb="1" style="width:100%" ${ok ? '' : 'disabled'}>${ok ? `Rebirth! (${short(need)} speed)` : `Need ${short(need - S.sp)} more speed`}</button>`;
      openPanel('🔁 Rebirth', html, (btn) => { if (btn.dataset.rb) this.rebirth(); });
    },
    rebirth() {
      const S = this.S, need = rebirthNeed(S.rb);
      if (S.sp < need) { sfx('error'); return; }
      S.rb++; S.sp = 0; this.delay = 1; this.acc = 0; this.dirty = true;
      this.prog('rebirth', 1);
      closePanel(); sfx('levelup'); puffAt(P.x, P.y + 3, P.z, CONFETTI, 40);
      toast(`🔁 Rebirth ${S.rb}! Now +${1 + S.rb} speed every step`, '#e9d5ff');
      earn(Math.min(40, 5 + S.rb * 2), `rebirth ${S.rb}`); Net.chat(`🔁 rebirthed (rebirth ${S.rb})!`);
      this.syncPets(); this.drawBar(); this.treadLabels(); this.send(true); this.save();
    },
    convertPanel() {
      const S = this.S, all = Math.floor(S.sp / PER) * PER;
      const opt = (f, lbl, cls) => { const n = Math.floor((S.sp * f) / PER) * PER; return `<button class="xp-btn ${cls}" data-cv="${n}" style="flex:1" ${n < PER ? 'disabled' : ''}>${lbl}<br><small>${short(n)} ⚡ → ${cash(n / PER)}</small></button>`; };
      const html = `<div class="sp-big">⚡ ${short(S.sp)} → 💵 ${cash(all / PER)}</div><div class="sp-sub">${PER} speed = $1 · the speed you convert is taken away</div>
        <div style="display:flex;gap:8px">${opt(0.1, '10%', 'blue')}${opt(0.5, 'Half', 'gold')}${opt(1, 'All', 'red')}</div>
        <p class="xp-note">Careful: less speed means a slower run, and gates you passed may close again.</p>`;
      openPanel('💱 Convert Speed', html, (btn) => {
        const n = Math.min(+btn.dataset.cv || 0, Math.floor(S.sp / PER) * PER);
        if (n < PER) return;
        S.sp -= n; S.cash += n / PER; this.dirty = true;
        this.prog('convert', n);
        sfx('buy'); toast(`💱 ${short(n)} speed → +${cash(n / PER)}`, '#86efac');
        this.drawBar(); this.save(); this.convertPanel();
      });
    },

    /* ---- eggs ---- */
    roll(k) {
      let x = Math.random() * 100, r = 0;
      while (r < 4 && x >= RAR[r][3]) { x -= RAR[r][3]; r++; }
      return k * 5 + r;
    },
    eggsPanel() {
      const S = this.S;
      const html = `<div class="xp-row"><span>💵 <b>${cash(S.cash)}</b></span><span>🐾 <b>${S.pets.length}/${MAX_PETS}</b></span></div>` + EGGS.map((E, k) => `<div class="xp-row"><span class="lft"><img src="${portrait(k * 5 + 4)}" style="width:44px;height:44px" alt=""><span><b>${E.e} ${E.n}</b><br><small style="color:var(--muted)">Pets ${mx(petMult(k * 5))} to ${mx(petMult(k * 5 + 4))}</small></span></span><button class="xp-btn gold" data-egg="${k}">${cash(E.price)}</button></div>`).join('');
      openPanel('🥚 Eggs', html, (btn) => { if (btn.dataset.egg) this.eggPanel(+btn.dataset.egg); });
    },
    eggPanel(k) {
      const E = EGGS[k], S = this.S, full = S.pets.length >= MAX_PETS;
      const odds = RAR.map((R, r) => { const sp = k * 5 + r; return `<div style="--rc:${R[1]}"><img src="${portrait(sp)}" alt=""><b>${esc(SPECIES[sp][0])}</b><span style="color:${R[1]}">${R[3]}%</span><br>${mx(petMult(sp))}</div>`; }).join('');
      const html = `<div class="xp-row"><span>💵 <b>${cash(S.cash)}</b></span><span>🐾 <b>${S.pets.length}/${MAX_PETS}</b></span></div><div class="sp-odds">${odds}</div>
        <p class="xp-note">Pets multiply the speed you get every step. ${mx(1.5)} means 50% more; equipped pets add up.</p>
        ${full ? '<p class="xp-note">Your pet storage is full. Delete some pets (🐾 Pets) to hatch more.</p>' : ''}
        <div style="display:flex;gap:8px"><button class="xp-btn gold" data-open="1" style="flex:1" ${S.cash < E.price || full ? 'disabled' : ''}>Open 1 · ${cash(E.price)}</button>
        <button class="xp-btn purple" data-open="3" style="flex:1" ${S.cash < E.price * 3 || S.pets.length + 3 > MAX_PETS ? 'disabled' : ''}>Open 3 · ${cash(E.price * 3)}</button></div>`;
      openPanel(`${E.e} ${E.n}`, html, (btn) => { if (btn.dataset.open) this.hatch(k, +btn.dataset.open); });
    },
    hatch(k, n) {
      const E = EGGS[k], S = this.S;
      if (S.cash < E.price * n || S.pets.length + n > MAX_PETS) { sfx('error'); return; }
      S.cash -= E.price * n; S.eggs += n; this.dirty = true;
      const got = Array.from({ length: n }, () => this.roll(k));
      for (const sp of got) S.pets.push(sp);
      this.prog('hatch', n);
      closePanel();
      const el = document.createElement('div'); el.id = 'spHatch';
      el.innerHTML = '<div class="egg">🥚</div>';
      $('#xhud').append(el); this.hatchEl = el;
      sfx('egg');
      const best = Math.max(...got.map(rarOf));
      clearTimeout(this.hatchT);
      this.hatchT = setTimeout(() => {
        if (this.hatchEl !== el) return;
        el.innerHTML = `<div class="row">${got.map((sp) => { const r = rarOf(sp); return `<div class="got" style="--rc:${RAR[r][1]}"><img src="${portrait(sp)}" alt=""><b>${esc(SPECIES[sp][0])}</b><span>${RAR[r][0]}</span><small>${mx(petMult(sp))} speed per step</small></div>`; }).join('')}</div><div class="tap">Tap to continue</div>`;
        sfx(best >= 3 ? 'win' : best >= 2 ? 'reward' : 'pop');
        puffAt(P.x, P.y + 4, P.z, best >= 3 ? CONFETTI : [0xffffff, 0xfde047], best >= 3 ? 40 : 14);
        if (best === 4) { const sp = got.find((s) => rarOf(s) === 4); earn(15, `hatched a Legendary ${SPECIES[sp][0]}`); Net.chat(`🥚 hatched a LEGENDARY ${SPECIES[sp][0]}!`); }
        got.forEach((sp, j) => this.autoEquip(S.pets.length - got.length + j));
        this.hatchT = setTimeout(() => this.hatchClose(), 3500);
      }, 1200);
      el.onclick = () => { if (el.querySelector('.got')) this.hatchClose(); };
      this.save();
    },
    hatchClose() { clearTimeout(this.hatchT); if (this.hatchEl) { this.hatchEl.remove(); this.hatchEl = null; } },
    autoEquip(i) {
      const S = this.S, m = (j) => petMult(S.pets[j]);
      if (S.eq.includes(i)) return;
      if (S.eq.length < this.slots()) S.eq.push(i);
      else { let w = 0; S.eq.forEach((j, n) => { if (m(j) < m(S.eq[w])) w = n; }); if (m(i) > m(S.eq[w])) S.eq[w] = i; else return; }
      this.syncPets(); this.send(true); this.drawBar(); this.dirty = true;
    },
    petsPanel() {
      const S = this.S, order = S.pets.map((p, i) => i).sort((a, b) => (S.eq.includes(b) - S.eq.includes(a)) || petMult(S.pets[b]) - petMult(S.pets[a]));
      const html = `<div class="xp-row"><span>🐾 <b>${S.eq.length}/${this.slots()}</b> equipped · <b>${S.pets.length}/${MAX_PETS}</b> pets</span><span>⚡ <b>${mx(this.petBoost())}</b> speed per step</span></div>
        <div style="display:flex;gap:8px;margin:6px 0"><button class="xp-btn gold" data-best="1" style="flex:1">⭐ Equip best</button><button class="xp-btn alt" data-none="1" style="flex:1">Unequip all</button></div>
        ${S.pets.length ? '' : '<p class="xp-note">No pets yet! Buy eggs in the hub (🥚 Eggs) with money from quests, wins and converting speed.</p>'}
        <div class="xp-grid">${order.map((i) => { const sp = S.pets[i], r = rarOf(sp), on = S.eq.includes(i); return `<div class="xp-card sp-card ${on ? 'on' : ''}" style="border-color:${on ? '' : RAR[r][1] + '55'}"><img src="${portrait(sp)}" alt=""><b>${esc(SPECIES[sp][0])}</b><span style="color:${RAR[r][1]}">${RAR[r][0]}</span><span class="m">${mx(petMult(sp))}</span>
          <button class="xp-btn ${on ? 'alt' : ''}" data-eq="${i}">${on ? 'Unequip' : 'Equip'}</button>${on ? '' : `<button class="xp-btn red" data-del="${i}" style="padding:5px 8px;font-size:12px">${this.delAsk === i ? 'Sure? Delete' : 'Delete'}</button>`}</div>`; }).join('')}</div>
        <p class="xp-note">More pet slots every 5 rebirths (up to 6).</p>`;
      openPanel('🐾 Your Pets', html, (btn) => {
        if (btn.dataset.best) S.eq = S.pets.map((p, i) => i).sort((a, b) => petMult(S.pets[b]) - petMult(S.pets[a])).slice(0, this.slots());
        else if (btn.dataset.none) S.eq = [];
        else if (btn.dataset.eq != null) { const i = +btn.dataset.eq; if (S.eq.includes(i)) S.eq = S.eq.filter((x) => x !== i); else if (S.eq.length < this.slots()) S.eq.push(i); else { toast(`All ${this.slots()} slots are full`, '#fca5a5'); sfx('error'); return; } }
        else if (btn.dataset.del != null) {
          const i = +btn.dataset.del;
          if (this.delAsk !== i) { this.delAsk = i; this.petsPanel(); return; }
          this.delAsk = null; S.pets.splice(i, 1); S.eq = S.eq.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)); sfx('break');
        }
        this.delAsk = btn.dataset.del != null ? this.delAsk : null;
        this.dirty = true; this.syncPets(); this.send(true); this.drawBar(); this.petsPanel(); this.save();
      }, null, { full: true });
    },

    /* ---- pets following people ---- */
    clearPetMeshes() { for (const p of this.myPets || []) scene.remove(p.g); this.myPets = []; for (const o of (this.others || new Map()).values()) for (const p of o.pets) scene.remove(p.g); this.others = new Map(); },
    syncPets() {
      for (const p of this.myPets) scene.remove(p.g);
      this.myPets = this.S.eq.map((i) => { const sp = this.S.pets[i], g = petMesh(sp); g.position.set(P.x, P.y, P.z); scene.add(g); return { sp, g, walk: Math.random() * 6 }; });
    },
    movePet(pt, tx, tz, ty, dt, fly, run) {
      const g = pt.g, dx = tx - g.position.x, dz = tz - g.position.z, d = Math.hypot(dx, dz), sp = Math.min(d, Math.max(34, (run || 16) * 1.25) * dt);
      if (d > 50) g.position.set(tx, ty, tz);
      else if (d > 0.05) { g.position.x += (dx / d) * sp; g.position.z += (dz / d) * sp; }
      pt.walk += dt * (d > 0.3 ? 12 : 3);
      const y = ty + (fly ? 2.6 + Math.sin(pt.walk * 0.4) * 0.3 : Math.abs(Math.sin(pt.walk)) * (d > 0.3 ? 0.4 : 0.05));
      g.position.y += (y - g.position.y) * Math.min(1, dt * 10);
      if (d > 0.3) { let a = Math.atan2(-dx, -dz) - g.rotation.y; while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; g.rotation.y += a * Math.min(1, dt * 10); }
      for (const ch of g.children) if (ch.userData.wing) ch.rotation.z = ch.userData.wing * Math.sin(pt.walk * 2) * 0.6;
    },
    slot(n, m, cx, cz, yaw) { const a = yaw + Math.PI + (m > 1 ? (n / (m - 1) - 0.5) * 2.2 : 0), rr = 3.2 + (n % 2) * 1.6; return [cx - Math.sin(a) * rr, cz - Math.cos(a) * rr]; },
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
          const list = key ? key.split(',').slice(0, 6).map(Number).filter((x) => SPECIES[x]) : [];
          o = { key, pets: list.map((sp) => { const g = petMesh(sp); g.position.copy(a.g.position); scene.add(g); return { sp, g, walk: Math.random() * 6 }; }), last: a.g.position.clone(), v: 16 };
          this.others.set(p.peer, o);
        }
        const ap = a.g.position, n = o.pets.length;
        o.v = o.v * 0.9 + (dt > 0 ? Math.hypot(ap.x - o.last.x, ap.z - o.last.z) / dt : 0) * 0.1; o.last.copy(ap);
        o.pets.forEach((pt, i) => { const [x, z] = this.slot(i, n, ap.x, ap.z, a.g.rotation.y); this.movePet(pt, x, z, ap.y, dt, FLY[SPECIES[pt.sp][1]], o.v); });
      }
      for (const [peer, o] of this.others) if (!seen.has(peer)) { for (const pt of o.pets) scene.remove(pt.g); this.others.delete(peer); }
    },

    /* ---- getting around ---- */
    tp(k) {
      if (k < 0) { P.x = 0; P.z = 66; P.yaw = 0; }
      else { P.x = 0; P.z = -ZL * k - 8; P.yaw = 0; this.run = k - 1; }
      P.y = 1; P.vx = P.vy = P.vz = 0; cam.yaw = P.yaw; sfx('teleport'); puffAt(P.x, P.y + 2, P.z, 0xffffff);
      for (const pt of this.myPets) pt.g.position.set(P.x, P.y, P.z);
    },
    teleports() {
      const S = this.S, wait = Math.ceil(TM_COOLDOWN - (performance.now() - this.tpAt) / 1000);
      const html = `<div class="xp-row"><span class="lft"><span class="ico">🏠</span><b>The hub</b></span><button class="xp-btn alt" data-z="-1">Go</button></div>` + ZONES.map((Z, k) => {
        const seen = k <= S.zMax, fast = S.sp >= Z.need;
        return `<div class="xp-row"><span class="lft"><span class="ico">${Z.e}</span><span><b>${Z.n}</b><br><small style="color:var(--muted)">${k ? `Gate: ⚡ ${short(Z.need)} speed` : 'The start'} · 🏆 +${Z.win} at the end</small></span></span>${!seen ? '<span>🔒</span>' : `<button class="xp-btn blue" data-z="${k}" ${fast ? '' : 'disabled'}>${fast ? 'Go' : 'Too slow'}</button>`}</div>`;
      }).join('') + `<p class="xp-note">Teleport to zones you’ve reached, if you’re fast enough for their gate.${wait > 0 ? ` Zone teleports recharge in ${wait}s.` : ''}</p>`;
      openPanel('🗺️ Teleport', html, (btn) => {
        const k = +btn.dataset.z;
        if (k >= 0) {
          if (performance.now() - this.tpAt < TM_COOLDOWN * 1000) { sfx('error'); toast(`Teleport recharging (${Math.ceil(TM_COOLDOWN - (performance.now() - this.tpAt) / 1000)}s)`, '#fca5a5'); return; }
          if (k > S.zMax || S.sp < ZONES[k].need) { sfx('error'); return; }
          this.tpAt = performance.now();
        }
        this.tp(k); closePanel();
      });
    },
  };
  addExp(SP);
  window.__rbSP = SP;
})();
