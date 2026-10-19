/* =====================================================================
   BLOXVERSE — STEAL AN EGG. Eggs ride the red carpet down the middle of
   the map; buy them and they sit in your base making cash every second
   (step on the green pad by an egg to collect it). Or walk into someone
   else's base, grab one of their eggs and carry it home before they
   bonk you with a bat and knock it out of your hands. Lock your base
   with lasers, buy gear, and rebirth for bigger earnings.
   Everyone's base and eggs live in their own presence; the host only
   settles who bought which egg off the carpet when two people try.
   ===================================================================== */
(() => {
  const ROAD0 = -150, ROAD1 = 150, RSP = 5, GAP = 3; // an egg every 3 seconds, riding 5 studs a second
  const style = document.createElement('style');
  style.textContent = `
    .se-alert{position:absolute;left:50%;top:21%;transform:translateX(-50%);padding:10px 20px;border-radius:16px;background:linear-gradient(180deg,rgba(185,28,28,.95),rgba(127,29,29,.95));border:2px solid #fca5a5;font:700 20px var(--fh);color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.4);pointer-events:none;animation:sePulse .8s ease-in-out infinite;white-space:nowrap}
    @keyframes sePulse{50%{transform:translateX(-50%) scale(1.06)}}
    #seSteal{position:absolute;left:50%;top:60%;transform:translateX(-50%);width:230px;padding:9px 12px;border-radius:14px;text-align:center;font:600 14px var(--fh);pointer-events:none;display:none}
    .se-egg{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px}
    .se-egg .xp-card img{width:100%;height:92px;object-fit:contain}
    .se-rar{font:700 11px var(--fh);text-transform:uppercase;letter-spacing:.06em}
    .se-ice{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 120px rgba(125,211,252,.8);opacity:0;transition:opacity .3s}`;
  document.head.append(style);

  /* ---------------- the eggs ---------------- */
  const RAR = [
    { n: 'Common', c: '#cbd5e1', w: 52 }, { n: 'Uncommon', c: '#4ade80', w: 26 }, { n: 'Rare', c: '#60a5fa', w: 13 }, { n: 'Epic', c: '#c084fc', w: 6 },
    { n: 'Legendary', c: '#fbbf24', w: 2.4 }, { n: 'Mythic', c: '#f87171', w: 0.5 }, { n: 'Secret', c: '#f0abfc', w: 0.1 },
  ];
  // name, rarity, price, cash per second, colours, pattern
  const EGGS = [
    ['Chicken Egg', 0, 15, 1, ['#fff7ed', '#fde68a'], 'plain'], ['Duck Egg', 0, 30, 2, ['#e0f2fe', '#7dd3fc'], 'spots'], ['Quail Egg', 0, 50, 3, ['#f5f0e6', '#78350f'], 'spots'], ['Speckled Egg', 0, 75, 5, ['#fde4cf', '#9a3412'], 'specks'],
    ['Turtle Egg', 1, 180, 10, ['#ecfccb', '#4d7c0f'], 'spots'], ['Frog Egg', 1, 260, 14, ['#bbf7d0', '#15803d'], 'bubbles'], ['Snake Egg', 1, 360, 19, ['#fef9c3', '#a16207'], 'zigzag'], ['Penguin Egg', 1, 500, 25, ['#e2e8f0', '#0f172a'], 'band'],
    ['Ostrich Egg', 2, 1200, 50, ['#fef3c7', '#d97706'], 'specks'], ['Croc Egg', 2, 1900, 75, ['#a3e635', '#3f6212'], 'scales'], ['Shark Egg', 2, 2800, 105, ['#93c5fd', '#1e3a8a'], 'stripes'], ['Owl Egg', 2, 4000, 145, ['#d6d3d1', '#57534e'], 'zigzag'],
    ['Dino Egg', 3, 10000, 330, ['#86efac', '#166534'], 'spots'], ['Ice Egg', 3, 16000, 500, ['#cffafe', '#0891b2'], 'cracks'], ['Lava Egg', 3, 24000, 700, ['#1c1917', '#f97316'], 'cracks'], ['Thunder Egg', 3, 35000, 950, ['#fde047', '#1e3a8a'], 'zigzag'],
    ['Dragon Egg', 4, 100000, 2600, ['#dc2626', '#fbbf24'], 'scales'], ['Phoenix Egg', 4, 160000, 3800, ['#fb923c', '#fde047'], 'stripes'], ['Crystal Egg', 4, 250000, 5400, ['#e9d5ff', '#7c3aed'], 'gems'],
    ['Galaxy Egg', 5, 900000, 17000, ['#1e1b4b', '#e0e7ff'], 'stars'], ['Unicorn Egg', 5, 1400000, 25000, ['#fbcfe8', '#a78bfa'], 'rainbow'], ['Kraken Egg', 5, 2200000, 36000, ['#4c1d95', '#22d3ee'], 'bubbles'],
    ['Golden Goose Egg', 6, 9000000, 125000, ['#facc15', '#fff7cc'], 'shine'], ['Void Egg', 6, 16000000, 210000, ['#020617', '#a855f7'], 'stars'], ['Cosmic Egg', 6, 32000000, 400000, ['#0c4a6e', '#f0abfc'], 'stars'],
  ];
  const BYR = RAR.map((_, r) => EGGS.map((e, i) => (e[1] === r ? i : -1)).filter((i) => i >= 0));
  const MUT = [{ n: '', x: 1 }, { n: 'Gold', x: 2, c: '#facc15' }, { n: 'Diamond', x: 4, c: '#67e8f9' }, { n: 'Rainbow', x: 8, c: '#f472b6' }];
  const short = (n) => { n = Math.floor(n || 0); for (const [v, s] of [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']]) if (n >= v) return (n / v).toFixed(n >= v * 100 ? 0 : 1).replace(/\.0$/, '') + s; return String(n); };
  const cash = (n) => '$' + short(n);
  const eggName = (t, m) => (m ? MUT[m].n + ' ' : '') + EGGS[t][0];
  const income = (t, m) => EGGS[t][3] * MUT[m].x;
  // events on the shared clock: a Lucky Hour (rare eggs ×3) and a Golden Hour (mutations ×3) every ten minutes
  const lucky = (t) => ((t % 600) + 600) % 600 < 90, golden = (t) => { const k = ((t % 600) + 600) % 600; return k >= 300 && k < 390; };
  // which egg is the i-th onto the carpet (everyone works out the same one)
  const EGGOF = new Map();
  function eggOf(i) {
    if (EGGOF.has(i)) return EGGOF.get(i);
    const r = mulberry(Math.imul(i, 2654435761) ^ 0x5bd1e995), t = i * GAP, luck = lucky(t) ? 3 : 1, gold = golden(t) ? 3 : 1;
    const w = RAR.map((R, k) => (k >= 2 ? R.w * luck : R.w)), tot = w.reduce((a, b) => a + b, 0);
    let x = r() * tot, rr = 0; while (rr < RAR.length - 1 && x >= w[rr]) { x -= w[rr]; rr++; }
    const list = BYR[rr], type = list[Math.floor(r() * list.length)], m = r();
    const mut = m < 0.005 * gold ? 3 : m < 0.02 * gold ? 2 : m < 0.07 * gold ? 1 : 0;
    const e = { type, mut }; EGGOF.set(i, e); if (EGGOF.size > 400) EGGOF.delete(EGGOF.keys().next().value);
    return e;
  }
  function roadEggs(t) {
    const out = [], hi = Math.floor(t / GAP), lo = Math.ceil((t - (ROAD1 - ROAD0) / RSP) / GAP);
    for (let i = lo; i <= hi; i++) { const z = ROAD0 + (t - i * GAP) * RSP; if (z >= ROAD0 && z <= ROAD1) out.push(Object.assign({ i, z }, eggOf(i))); }
    return out;
  }

  /* ---------------- gear ---------------- */
  const GEAR = {
    speed: { n: 'Speed Coil', e: '🌀', price: 3000, d: 'Run 35% faster' },
    grav: { n: 'Gravity Coil', e: '🪐', price: 8000, d: 'Jump much higher' },
    freeze: { n: 'Freeze Ray', e: '❄️', price: 60000, d: 'Freeze the nearest player for 3 seconds (F)' },
    cloak: { n: 'Invisibility Cloak', e: '👻', price: 150000, d: 'Turn invisible for 8 seconds (V) — the egg you carry still shows' },
    gbat: { n: 'Golden Bat', e: '🏆', price: 500000, d: 'Hits harder and reaches further' },
  };
  const rebirthCost = (r) => 1e6 * Math.pow(6, r);
  const SLOTS = (r) => 10 + (r >= 1 ? 5 : 0) + (r >= 3 ? 5 : 0);

  /* ---------------- the bases ---------------- */
  const BCOL = [0xef4444, 0xf59e0b, 0x22c55e, 0x3b82f6, 0xa855f7, 0xec4899, 0x14b8a6, 0xf97316];
  const BASES = Array.from({ length: 8 }, (_, i) => { const s = i < 4 ? -1 : 1, zc = [-105, -35, 35, 105][i % 4]; return { i, s, zc, x0: Math.min(s * 22, s * 58), x1: Math.max(s * 22, s * 58), z0: zc - 30, z1: zc + 30, col: BCOL[i] }; });
  const slotPos = (b, k) => { const B = BASES[b], r = Math.floor(k / 5), c = k % 5; return [B.s * (30 + r * 7), B.zc - 20 + c * 10]; };
  const padPos = (b, k) => { const [x, z] = slotPos(b, k); return [x - BASES[b].s * 3.2, z]; };
  const inBase = (b, x, z) => { const B = BASES[b]; return b >= 0 && x > B.x0 && x < B.x1 && z > B.z0 && z < B.z1; };
  const baseAt = (x, z) => BASES.findIndex((B) => x > B.x0 && x < B.x1 && z > B.z0 && z < B.z1);

  /* ---------------- egg models ---------------- */
  const EGG_GEO = new THREE.SphereGeometry(1, 20, 14);
  const EGG_TEX = new Map(), EGG_MAT = new Map();
  function eggTex(t) {
    if (EGG_TEX.has(t)) return EGG_TEX.get(t);
    const [, , , , [base, acc], pat] = EGGS[t], c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d'), r = mulberry(t * 31 + 7);
    g.fillStyle = base; g.fillRect(0, 0, 128, 64); g.fillStyle = acc; g.strokeStyle = acc;
    if (pat === 'spots') for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(r() * 128, 8 + r() * 48, 3 + r() * 5, 0, 7); g.fill(); }
    if (pat === 'specks') for (let i = 0; i < 90; i++) g.fillRect(r() * 128, r() * 64, 1.5 + r() * 2, 1.5 + r() * 2);
    if (pat === 'bubbles') { g.lineWidth = 2; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(r() * 128, 8 + r() * 48, 3 + r() * 6, 0, 7); g.stroke(); } }
    if (pat === 'zigzag') { g.lineWidth = 5; g.beginPath(); for (let x = 0; x <= 128; x += 16) g.lineTo(x, x % 32 ? 22 : 36); g.stroke(); g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= 128; x += 16) g.lineTo(x, x % 32 ? 44 : 52); g.stroke(); }
    if (pat === 'band') { g.fillRect(0, 26, 128, 14); g.fillStyle = base; g.fillRect(0, 31, 128, 4); }
    if (pat === 'scales') for (let y = 0; y < 64; y += 8) for (let x = (y / 8) % 2 * 8; x < 128; x += 16) { g.beginPath(); g.arc(x, y, 7, 0, Math.PI); g.stroke(); g.lineWidth = 2.5; }
    if (pat === 'stripes') for (let y = 6; y < 64; y += 14) g.fillRect(0, y, 128, 6);
    if (pat === 'cracks') { g.lineWidth = 3; for (let i = 0; i < 7; i++) { g.beginPath(); let x = r() * 128, y = r() * 64; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 30; y += (r() - 0.5) * 22; g.lineTo(x, y); } g.stroke(); } }
    if (pat === 'gems') for (let i = 0; i < 12; i++) { const x = r() * 128, y = 8 + r() * 48, s = 4 + r() * 5; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s, y); g.lineTo(x, y + s); g.lineTo(x - s, y); g.closePath(); g.fill(); }
    if (pat === 'stars') for (let i = 0; i < 60; i++) { g.globalAlpha = 0.4 + r() * 0.6; g.fillRect(r() * 128, r() * 64, r() < 0.15 ? 3 : 1.5, r() < 0.15 ? 3 : 1.5); }
    if (pat === 'rainbow') ['#f87171', '#fbbf24', '#4ade80', '#60a5fa', '#c084fc'].forEach((col, k) => { g.fillStyle = col; g.fillRect(0, 10 + k * 9, 128, 5); });
    if (pat === 'shine') { g.globalAlpha = 0.6; for (let i = 0; i < 6; i++) { g.fillRect(i * 22, 0, 6, 64); } }
    g.globalAlpha = 1;
    const tx = new THREE.CanvasTexture(c); tx.wrapS = THREE.RepeatWrapping; EGG_TEX.set(t, tx); return tx;
  }
  function eggMat(t, m) {
    const k = t + ':' + m; if (EGG_MAT.has(k)) return EGG_MAT.get(k);
    const mat = new THREE.MeshLambertMaterial({ map: eggTex(t), color: m === 1 ? 0xffd34d : m === 2 ? 0xa5f3fc : 0xffffff, emissive: m === 1 ? 0x3d2a00 : m === 2 ? 0x0e4a5c : EGGS[t][1] >= 5 ? 0x1a0d2e : 0x000000 });
    if (m === 2) { mat.transparent = true; mat.opacity = 0.88; }
    EGG_MAT.set(k, mat); return mat;
  }
  const eggSize = (t) => 0.9 + EGGS[t][1] * 0.16;
  const HALO_G = new Map(), HALO_M = new Map();
  const haloGeo = (r) => { if (!HALO_G.has(r)) { const s = 0.9 + r * 0.16; HALO_G.set(r, new THREE.RingGeometry(s * 1.2, s * 1.45, 24)); } return HALO_G.get(r); };
  const haloMat = (c) => { if (!HALO_M.has(c)) HALO_M.set(c, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, ...DECAL })); return HALO_M.get(c); };
  function eggMesh(t, m) {
    const g = new THREE.Group(), s = eggSize(t), body = new THREE.Mesh(EGG_GEO, eggMat(t, m));
    body.scale.set(s, s * 1.3, s); body.position.y = s * 1.3; g.add(body);
    if (m === 3 || EGGS[t][1] >= 4) { const halo = new THREE.Mesh(haloGeo(EGGS[t][1]), haloMat(m === 3 ? '#f472b6' : RAR[EGGS[t][1]].c)); halo.rotation.x = -Math.PI / 2; halo.position.y = 0.06; g.add(halo); }
    g.userData = { t, m, body, rainbow: m === 3 };
    return g;
  }
  const portrait = (t, m) => snapshot(`se-${t}-${m || 0}`, () => eggMesh(t, m || 0), { w: 140, h: 140, dir: [0.7, 0.3, -1], zoom: 0.85 });
  // the text over an egg (cached: the same egg always says the same)
  const LAB = new Map();
  function eggLabel(t, m, price) {
    const k = `${t}:${m}:${price ? 1 : 0}`; if (LAB.has(k)) return LAB.get(k);
    const R = RAR[EGGS[t][1]], lines = [[eggName(t, m), m ? MUT[m].c : '#ffffff', 34], [R.n, R.c, 26], [price ? cash(EGGS[t][2] * MUT[m].x) : `${cash(income(t, m))}/s`, price ? '#fde68a' : '#86efac', 30]];
    if (price) lines.push([`${cash(income(t, m))}/s`, '#86efac', 24]);
    const c = document.createElement('canvas'), g = c.getContext('2d'); c.width = 320; c.height = lines.reduce((a, l) => a + l[2] * 1.18, 10);
    let y = 6; g.textAlign = 'center'; g.textBaseline = 'top'; g.lineJoin = 'round';
    for (const [txt, col, fs] of lines) { g.font = `800 ${fs}px "Segoe UI",system-ui,sans-serif`; g.lineWidth = 7; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText(txt, 160, y); g.fillStyle = col; g.fillText(txt, 160, y); y += fs * 1.18; }
    const tx = new THREE.CanvasTexture(c); tx.minFilter = THREE.LinearFilter; const v = { tx, w: 320, h: c.height }; LAB.set(k, v); return v;
  }
  function labelSprite(v, size) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: v.tx, transparent: true })); const k = size / 100; s.scale.set(v.w * k, v.h * k, 1); return s; }
  // words that change (base signs, money waiting on a pad): their own little canvas
  function textSprite(lines, size) {
    const c = document.createElement('canvas'), g = c.getContext('2d'); c.width = 420; c.height = lines.length * 46 + 14;
    g.textAlign = 'center'; g.textBaseline = 'top'; lines.forEach(([t, col], i) => { g.font = `800 ${i ? 32 : 38}px "Segoe UI",system-ui,sans-serif`; g.lineWidth = 7; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText(t, 210, 6 + i * 46); g.fillStyle = col; g.fillText(t, 210, 6 + i * 46); });
    const tx = new THREE.CanvasTexture(c); tx.minFilter = THREE.LinearFilter;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true })); const k = size / 100; s.scale.set(420 * k, c.height * k, 1); return s;
  }
  const dropSprite = (s) => { if (!s) return; if (s.parent) s.parent.remove(s); s.material.map.dispose(); s.material.dispose(); };

  /* ---------------- the experience ---------------- */
  const SE = {
    id: 'egg', code: 'se', genre: 'Tycoon', rank: 0.3, name: 'Steal an Egg', emoji: '🥚', max: 8, stat: 'Cash', killY: -30, banner: true, camDist: 22,
    land: { theme: 'beach', mode: 'sea', sea: -1.2, under: [[-88, -188, 88, 188]], extras: ['boats'] },
    color: 'linear-gradient(135deg,#f59e0b,#ec4899)',
    desc: 'Eggs ride the red carpet: buy one and it earns cash every second in your base. Rare eggs earn far more, and Gold, Diamond and Rainbow ones even more. Or sneak into someone else’s base, grab their egg and carry it home before they bonk you with a bat! Lock your base with lasers, buy gear, rebirth for bigger earnings. Saved.',
    welcome: 'Buy eggs off the carpet — or steal them!',
    build() {
      sky('#7cc8ff', '#fff1f8');
      this.eggs = new Map(); this.slotV = new Map(); this.carryV = new Map(); this.ice = new Map(); this.signs = []; this.lasers = []; this.flies = [];
      // the island
      slab(0, 0, 0, 170, 370, 0x86d46b, { sy: 4 });
      part({ x: 0, y: -2.1, z: 0, sx: 176, sy: 3.6, sz: 376, c: 0xd9c38f, plain: true }); // a sandy rim below the grass
      for (const [x, z, sx, sz] of [[0, -186, 170, 1], [0, 186, 170, 1], [-85.5, 0, 1, 370], [85.5, 0, 1, 370]]) part({ x, y: 1.5, z, sx, sy: 3, sz, c: 0xffffff, alpha: 0.25, plain: true });
      // the red carpet (it carries you along too)
      part({ x: 0, y: 0.2, z: 0, sx: 12, sy: 0.4, sz: ROAD1 - ROAD0, c: 0xffffff, stripes: '#ef4444', conv: [0, RSP] });
      for (const s of [-1, 1]) part({ x: s * 6.6, y: 0.35, z: 0, sx: 1.2, sy: 0.7, sz: ROAD1 - ROAD0, c: 0xfacc15, plain: true });
      // the egg machine at the top, and the egg drop at the bottom
      slab(0, 12, ROAD0 - 7, 20, 12, 0xf472b6, { sy: 12 }); slab(0, 13.4, ROAD0 - 7, 16, 9, 0xfbcfe8, { sy: 1.4 });
      part({ x: 0, y: 4, z: ROAD0 - 1, sx: 9, sy: 7, sz: 0.6, c: 0x111827, plain: true });
      const big = eggMesh(22, 3); big.scale.setScalar(2.2); big.position.set(0, 13.4, ROAD0 - 7); place.add(big); this.bigEgg = big;
      const s1 = label('🥚 EGG MACHINE', { size: 2.4, color: '#fde68a' }); s1.position.set(0, 24, ROAD0 - 1); place.add(s1);
      part({ x: 0, y: -0.1, z: ROAD1 + 6, sx: 14, sy: 0.4, sz: 10, c: 0x1f2937, plain: true });
      const s2 = label('♻️ Egg drop', { size: 1.6 }); s2.position.set(0, 5, ROAD1 + 6); place.add(s2);
      // the gear shop and the rebirth statue up by the machine
      slab(-30, 0.4, -160, 16, 10, 0x8b5e34, { sy: 0.4 }); part({ x: -30, y: 1.6, z: -157, sx: 12, sy: 2.4, sz: 2, c: 0x6b4423 });
      for (let i = 0; i < 6; i++) part({ x: -36.25 + i * 2.5, y: 6.4, z: -161, sx: 2.5, sy: 0.4, sz: 9, c: i % 2 ? 0xffffff : 0x3b82f6, plain: true });
      for (const x of [-37.5, -22.5]) part({ x, y: 3.4, z: -164.5, sx: 0.5, sy: 6, sz: 0.5, c: 0x6b4423, plain: true });
      const s3 = label('🛍️ GEAR SHOP', { size: 2, bg: 'rgba(30,58,138,.85)' }); s3.position.set(-30, 9, -157); place.add(s3);
      slab(30, 1.2, -160, 9, 9, 0xe5e7eb, { sy: 1.2 }); slab(30, 2.4, -160, 6, 6, 0xd4d4d8, { sy: 1.2 });
      const gold = eggMesh(22, 1); gold.scale.setScalar(1.6); gold.position.set(30, 2.4, -160); place.add(gold); this.goldEgg = gold;
      const s4 = label('♻️ REBIRTH', { size: 2, bg: 'rgba(124,45,18,.85)' }); s4.position.set(30, 10.5, -160); place.add(s4);
      // the bases
      for (const B of BASES) {
        const { s, zc, col } = B, c2 = new THREE.Color(col).lerp(new THREE.Color(0xffffff), 0.55).getHex();
        part({ x: s * 40, y: 0.25, z: zc, sx: 36, sy: 0.5, sz: 60, c: c2 });
        // walls round three sides and the front, with a wide way in (open to the sky, so the camera never gets stuck on it)
        part({ x: s * 40, y: 3, z: zc - 29.5, sx: 36, sy: 5, sz: 1, c: col }); part({ x: s * 40, y: 3, z: zc + 29.5, sx: 36, sy: 5, sz: 1, c: col });
        part({ x: s * 57.5, y: 3, z: zc, sx: 1, sy: 5, sz: 58, c: col });
        part({ x: s * 22.5, y: 3, z: zc - 19.5, sx: 1, sy: 5, sz: 19, c: col }); part({ x: s * 22.5, y: 3, z: zc + 19.5, sx: 1, sy: 5, sz: 19, c: col });
        B.ped = []; B.pads = []; B.shown = -1;
        for (let k = 0; k < 20; k++) {
          const [x, z] = slotPos(B.i, k), [px, pz] = padPos(B.i, k);
          B.ped.push(part({ x, y: 1, z, sx: 3, sy: 1, sz: 3, c: 0xf8fafc }));
          B.pads.push(part({ x: px, y: 0.56, z: pz, sx: 2.2, sy: 0.12, sz: 2.4, c: 0x22c55e, neon: true, solid: false }));
        }
        const lk = part({ x: s * 25, y: 0.62, z: zc + 25, sx: 2.6, sy: 0.24, sz: 2.6, c: 0xef4444, neon: true, solid: false });
        const ca = part({ x: s * 25, y: 0.62, z: zc - 25, sx: 2.6, sy: 0.24, sz: 2.6, c: 0x22c55e, neon: true, solid: false });
        const laser = part({ x: s * 22.5, y: 3, z: zc, sx: 0.4, sy: 5, sz: 20, c: 0xff2d2d, alpha: 0.4, neon: true, solid: false });
        laser.m.visible = false; this.lasers[B.i] = laser;
        B.lk = lk; B.ca = ca; this.signs[B.i] = null;
        const l1 = label('🔒 Lock', { size: 0.9 }); l1.position.set(s * 25, 2.2, zc + 25); place.add(l1);
        const l2 = label('💰 Collect all', { size: 0.9 }); l2.position.set(s * 25, 2.2, zc - 25); place.add(l2);
      }
      // a few trees and flowers round the edge
      const r = mulberry(77);
      for (let i = 0; i < 46; i++) {
        const x = (r() < 0.5 ? -1 : 1) * (62 + r() * 18), z = -175 + r() * 350; if (Math.abs(z) > 170) continue;
        if (i % 3) { part({ x, y: 2, z, sx: 1, sy: 4, sz: 1, c: 0x8b5a2b }); part({ x, y: 5 + (i % 4) * 0.05, z, sx: 4 + (i % 3) * 0.3, sy: 3 + (i % 5) * 0.07, sz: 4 + (i % 3) * 0.3, c: [0xf9a8d4, 0x86efac, 0xfde68a][i % 3] }); }
        else part({ x, y: 0.3, z, sx: 1.2, sy: 0.6 + (i % 4) * 0.04, sz: 1.2, c: [0xf472b6, 0xfacc15, 0x60a5fa, 0xf87171][i % 4], plain: true });
      }
    },
    pres() { return { b: -1, eg: '', cs: 0, ps: 0, lk: 0, cr: null, sto: [], bq: [], hit: null, fz: null, fr: 0, cl: 0 }; },
    async enter() {
      const s = await kvGet('se');
      const D = { cash: 100, eggs: [], acc: [], reb: 0, gear: {}, stolen: 0, lost: 0, bought: 0, best: 0, at: 0 };
      const S = this.S = Object.assign(D, s && typeof s === 'object' ? s : {});
      S.cash = Math.max(0, +S.cash || 0); S.reb = clamp(S.reb | 0, 0, 20); S.gear = S.gear && typeof S.gear === 'object' ? S.gear : {};
      S.eggs = (Array.isArray(S.eggs) ? S.eggs : []).slice(0, SLOTS(S.reb)).map((e) => (Array.isArray(e) && EGGS[e[0]] ? [e[0] | 0, clamp(e[1] | 0, 0, 3)] : null));
      while (S.eggs.length < SLOTS(S.reb)) S.eggs.push(null);
      S.acc = S.eggs.map((_, k) => Math.max(0, +(S.acc || [])[k] || 0));
      // what your eggs made while you were away (a quarter, up to two hours)
      if (S.at) { const away = clamp((Date.now() - S.at) / 1000, 0, 7200), got = this.rate() * away * 0.25; if (got >= 1) { S.cash += got; setTimeout(() => toast(`💤 While you were away: +${cash(got)}`, '#86efac'), 1200); } }
      this.b = -1; this.carry = null; this.stealing = null; this.pendBuy = null; this.reqN = 0; this.bq = []; this.hitN = 0; this.fzN = 0; this.stoList = [];
      this.seenHit = new Map(); this.seenFz = new Map(); this.seenSto = new Set(); this.alerted = new Map(); this.frozenUntil = 0; this.cloakUntil = 0; this.freezeCd = 0; this.cloakCd = 0; this.swingT = 0; this.hitCd = 0;
      this.onPad = -1; this.saveT = 5; this.dirty = false; this.soldSeen = null; this.floats = []; this.shove = null;
      $('#xhud').insertAdjacentHTML('beforeend', '<div id="seSteal" class="glass"></div><div id="seAlert"></div><div class="se-ice" id="seIce"></div>');
      this.drawBar();
    },
    leave() {
      this.dropCarry(true); this.save();
      for (const v of this.eggs.values()) scene.remove(v.g); for (const v of this.slotV.values()) { scene.remove(v.g); dropSprite(v.lab); } for (const v of this.carryV.values()) scene.remove(v.g);
      for (const f of this.flies) scene.remove(f.g); for (const v of this.ice.values()) scene.remove(v); for (const f of this.floats || []) dropSprite(f.s);
      for (const s of this.signs) dropSprite(s && s.sp);
      this.eggs = new Map(); this.slotV = new Map(); this.carryV = new Map(); this.flies = []; this.ice = new Map();
    },
    save() { if (!this.S) return; this.S.at = Date.now(); this.dirty = false; return kvSet('se', this.S); },
    rate() { const S = this.S; let r = 0; S.eggs.forEach((e) => { if (e) r += income(e[0], e[1]); }); return r * (1 + 0.6 * S.reb); },
    mult() { return 1 + 0.6 * this.S.reb; },
    send() {
      const S = this.S;
      send({ sl: SLOTS(S.reb), b: this.b, eg: S.eggs.map((e, k) => (e ? `${k}.${e[0]}.${e[1]}` : '')).filter(Boolean).join(','), cs: Math.floor(S.cash), ps: Math.floor(this.rate()), lk: this.lockUntil || 0 });
    },
    spawn() {
      const B = BASES[this.b];
      if (B) return [B.s * 33, 0.6, B.zc, B.s < 0 ? -Math.PI / 2 : Math.PI / 2];
      return [(Math.random() - 0.5) * 30, 0.6, -140, 0];
    },
    speed() { if (!this.S) return 16; if (performance.now() / 1000 < this.frozenUntil) return 0; return 16 * (this.S.gear.speed ? 1.35 : 1) * (this.carry ? 0.72 : 1); },
    jumpPower() { if (!this.S || performance.now() / 1000 < this.frozenUntil) return 0; return 50 * (this.S.gear.grav ? 1.42 : 1) * (this.carry ? 0.85 : 1); },
    statOf(pr, isMe) { return cash(isMe ? (this.S ? this.S.cash : 0) : pr.cs || 0); },
    sortKey(pr, isMe) { return isMe ? (this.S ? this.S.cash : 0) : +pr.cs || 0; },
    menu() { return [['📖 Egg index', () => this.index()], ['🛍️ Gear shop', () => this.gearShop()]]; },

    /* ---------------- whose base is whose ---------------- */
    others() { return Net.peers.filter((p) => !p.isMe && p.presence && p.presence.t); },
    pickBase() {
      const mine = Net.peers.find((p) => p.isMe), myT = mine && mine.presence ? +mine.presence.t || 0 : Net.t0;
      const taken = new Map(); for (const p of this.others()) { const b = p.presence.b; if (b >= 0 && b < 8) taken.set(b, p); }
      // two of us on one base: whoever got here first keeps it
      const clash = taken.get(this.b), lose = clash && (+clash.presence.t < myT || (+clash.presence.t === myT && clash.peer < myPeer()));
      if (this.b >= 0 && !lose) return;
      const was = this.b; let b = 0; while (b < 8 && taken.has(b)) b++;
      if (b >= 8) return;
      this.b = b; this.send();
      if (was < 0 || lose) { const s = this.spawn(); P.x = s[0]; P.y = s[1]; P.z = s[2]; P.yaw = cam.yaw = s[3]; P.vx = P.vy = P.vz = 0; say(`🏠 Your base is the ${['red', 'orange', 'green', 'blue', 'purple', 'pink', 'teal', 'amber'][b]} one.`, '#fde68a'); }
    },
    ownerOf(b) { if (b === this.b) return { peer: myPeer(), me: true, pr: null }; const p = this.others().find((q) => q.presence.b === b); return p ? { peer: p.peer, me: false, pr: p.presence } : null; },
    eggsOf(pr) { const out = new Map(); for (const s of String((pr && pr.eg) || '').split(',')) { const [k, t, m] = s.split('.').map((v) => +v); if (s && EGGS[t] && k >= 0 && k < 20) out.set(k, [t, clamp(m | 0, 0, 3)]); } return out; },
    lockedFor(b) { const o = this.ownerOf(b); if (!o) return false; const until = o.me ? this.lockUntil || 0 : +o.pr.lk || 0; return until > Date.now() / 1000; },

    /* ---------------- the host: who bought which egg ---------------- */
    host() {
      if (!this.S) return;
      if (!this.H) { const g = this.lastG; this.H = { sold: g && Array.isArray(g.sold) ? g.sold.slice() : [], seen: {}, gs: g ? g.gs || 0 : 0 }; for (const p of this.others()) this.H.seen[p.peer] = { t: p.presence.t, n: Math.max(0, ...(Array.isArray(p.presence.bq) ? p.presence.bq.map((q) => +q[0] || 0) : [0])) }; }
      const H = this.H, t = now();
      const reqs = [];
      for (const p of this.others()) {
        const seen = H.seen[p.peer] || (H.seen[p.peer] = { t: p.presence.t, n: 0 }); if (p.presence.t !== seen.t) { seen.t = p.presence.t; seen.n = 0; }
        for (const q of Array.isArray(p.presence.bq) ? p.presence.bq : []) { if (!Array.isArray(q) || !(q[0] > seen.n)) continue; seen.n = q[0]; reqs.push([q[1] | 0, p.peer]); }
      }
      for (const q of this.bq) if (!q.done) { q.done = true; reqs.push([q.i, myPeer()]); }
      let changed = false;
      for (const [i, peer] of reqs) {
        const z = ROAD0 + (t - i * GAP) * RSP;
        if (z < ROAD0 - 2 || z > ROAD1 + 2 || H.sold.some((s) => s[0] === i)) continue;
        H.sold.push([i, peer]); if (H.sold.length > 40) H.sold.shift(); changed = true;
      }
      if (changed || performance.now() - (this.sentAt || 0) > 1500) { this.sentAt = performance.now(); H.gs++; send({ g: { gs: H.gs, sold: H.sold.slice(-40) } }); }
    },
    sold() {
      if (iAmHost() && this.H) return this.H.sold;
      this.H = null;
      const h = crew()[0], g = h && h.pr && h.pr.g;
      if (g && typeof g === 'object') this.lastG = g;
      return (this.lastG && Array.isArray(this.lastG.sold)) ? this.lastG.sold : [];
    },

    /* ---------------- every frame ---------------- */
    tick(dt) {
      if (!this.S) return;
      const S = this.S, t = now(), nowS = Date.now() / 1000, tp = performance.now() / 1000;
      if ((this.pickT = (this.pickT || 0) - dt) <= 0) { this.pickT = 1; this.pickBase(); }
      const sold = this.sold(), soldSet = new Map(sold.map((s) => [s[0], s[1]]));
      this.settleBuys(soldSet);
      this.drawRoad(t, soldSet, dt);
      // everyone's base: their eggs, the laser door, the sign
      const carried = new Set(); for (const p of this.others()) { const c = p.presence.cr; if (Array.isArray(c)) carried.add(c[0] + ':' + c[1]); }
      if (this.carry) carried.add(this.carry.owner + ':' + this.carry.slot);
      const seenSlots = new Set(), relabel = (this.labT = (this.labT || 0) - dt) <= 0; if (relabel) this.labT = 0.5;
      const flying = new Set(this.flies.filter((f) => f.slot != null).map((f) => f.slot));
      for (const B of BASES) {
        const o = this.ownerOf(B.i), eggs = o ? (o.me ? new Map(S.eggs.map((e, k) => [k, e]).filter((x) => x[1])) : this.eggsOf(o.pr)) : new Map();
        const slots = o ? (o.me ? SLOTS(S.reb) : clamp(+o.pr.sl || 10, 10, 20)) : 10;
        if (B.shown !== slots) { B.shown = slots; B.ped.forEach((p, k) => { p.on = p.solid = k < slots; p.m.visible = k < slots; }); B.pads.forEach((p, k) => { p.m.visible = k < slots; }); }
        for (const [k, e] of eggs) {
          if (carried.has((o.me ? myPeer() : o.peer) + ':' + k) || (o.me && flying.has(k))) continue;
          const key = B.i + ':' + k; seenSlots.add(key);
          let v = this.slotV.get(key);
          if (!v || v.t !== e[0] || v.m !== e[1]) { if (v) { scene.remove(v.g); dropSprite(v.lab); } const g = eggMesh(e[0], e[1]), [x, z] = slotPos(B.i, k); g.position.set(x, 1.5, z); scene.add(g); v = { g, t: e[0], m: e[1], lab: null, labT: '' }; this.slotV.set(key, v); }
          // the label: name and earnings (and, in your base, the money waiting)
          const near = Math.hypot(v.g.position.x - P.x, v.g.position.z - P.z) < 70;
          const txt = near ? (o.me ? `${eggName(e[0], e[1])}|${cash(income(e[0], e[1]) * this.mult())}/s|💰 ${cash(S.acc[k] || 0)}` : `${eggName(e[0], e[1])}|${RAR[EGGS[e[0]][1]].n}|${cash(income(e[0], e[1]))}/s`) : '';
          if (txt !== v.labT && (!o.me || relabel || !v.lab)) {
            v.labT = txt; dropSprite(v.lab); v.lab = null;
            if (txt) { const [a, b, c] = txt.split('|'); v.lab = textSprite([[a, e[1] ? MUT[e[1]].c : '#ffffff'], [b, o.me ? '#86efac' : RAR[EGGS[e[0]][1]].c], [c, o.me ? '#fde68a' : '#86efac']], 1.25); v.lab.position.set(v.g.position.x, 1.5 + eggSize(e[0]) * 2.6 + 2.2, v.g.position.z); scene.add(v.lab); }
          }
        }
        // the laser door: shut to everyone but the owner while it's locked
        const L = this.lasers[B.i], locked = this.lockedFor(B.i);
        L.m.visible = locked; L.solid = locked && B.i !== this.b; L.on = true;
        if (locked && B.i !== this.b && Math.abs(P.x - B.s * 22.5) < 1.6 && P.z > B.zc - 10 && P.z < B.zc + 10 && !inBase(B.i, P.x, P.z)) { P.x = B.s * 20.4; P.vx = 0; }
        // the sign over the door
        const name = o ? (o.me ? Net.name : String(o.pr.nm || 'Player').slice(0, 20)) : '', rate = o ? (o.me ? this.rate() : +o.pr.ps || 0) : 0;
        const st = o ? `${name}'s base|${cash(rate)}/s${locked ? ` · 🔒 ${Math.ceil((o.me ? this.lockUntil : +o.pr.lk) - nowS)}s` : ''}` : 'Empty base|Up for grabs';
        const sg = this.signs[B.i];
        if (!sg || sg.t !== st) { if (sg) dropSprite(sg.sp); const [a, b] = st.split('|'); const sp = textSprite([[a, '#ffffff'], [b, locked ? '#fca5a5' : '#86efac']], 2.2); sp.position.set(B.s * 22.5, 9.5, B.zc); scene.add(sp); this.signs[B.i] = { t: st, sp }; }
      }
      for (const [key, v] of this.slotV) if (!seenSlots.has(key)) { scene.remove(v.g); dropSprite(v.lab); this.slotV.delete(key); }
      for (const v of this.slotV.values()) { v.g.rotation.y += dt * 0.6; if (v.g.userData.rainbow) v.g.userData.body.material.color.setHSL((tp * 0.25) % 1, 0.75, 0.68); }
      if (this.bigEgg) { this.bigEgg.rotation.y += dt * 0.5; this.bigEgg.userData.body.material.color.setHSL((tp * 0.2) % 1, 0.75, 0.68); }
      if (this.goldEgg) this.goldEgg.rotation.y -= dt * 0.7;
      // your eggs make money
      const m = this.mult();
      S.eggs.forEach((e, k) => { if (e && !this.beingStolen(k)) S.acc[k] = (S.acc[k] || 0) + income(e[0], e[1]) * m * dt; });
      this.pads();
      this.thieves(); this.carrying(dt, tp); this.hits(tp); this.flyEggs(dt);
      if (this.stealing) { const s = this.stealing, el = $('#seSteal'); s.t = tp - s.at; const o = this.ownerOf(s.b); if (!o || Math.hypot(P.x - s.x, P.z - s.z) > 4.5 || !this.eggsOf(o.pr).has(s.k)) { this.stealing = null; if (el) el.style.display = 'none'; } else if (s.t >= 1.2) this.grab(); else if (el) { el.style.display = 'block'; el.innerHTML = `🥷 Grabbing the ${esc(eggName(s.e[0], s.e[1]).toLowerCase())}…<div class="meter"><i style="width:${(s.t / 1.2) * 100}%"></i></div>`; } }
      if (this.swingT > 0) this.swingT -= dt;
      const ice = $('#seIce'); if (ice) ice.style.opacity = tp < this.frozenUntil ? 1 : 0;
      if ((this.sendT = (this.sendT || 0) - dt) <= 0) { this.sendT = 1; this.send(); }
      if ((this.saveT -= dt) <= 0) { this.saveT = 10; this.save(); }
      const k = ((t % 600) + 600) % 600;
      setBanner(lucky(t) ? `🍀 Lucky Hour! Rare eggs ×3 · ${mmss(90 - k)}` : golden(t) ? `✨ Golden Hour! Gold, Diamond & Rainbow eggs ×3 · ${mmss(390 - k)}` : k < 300 ? `✨ Golden Hour in ${mmss(300 - k)}` : `🍀 Lucky Hour in ${mmss(600 - k)}`);
    },
    beingStolen(k) { return this.others().some((p) => Array.isArray(p.presence.cr) && p.presence.cr[0] === myPeer() && p.presence.cr[1] === k); },
    // the eggs riding the carpet
    drawRoad(t, soldSet, dt) {
      const live = new Set();
      for (const e of roadEggs(t)) {
        if (soldSet.has(e.i)) continue;
        live.add(e.i);
        let v = this.eggs.get(e.i);
        if (!v) { const g = eggMesh(e.type, e.mut), lab = labelSprite(eggLabel(e.type, e.mut, true), 1.9); g.add(lab); lab.position.y = eggSize(e.type) * 2.6 + 2.6; scene.add(g); v = { g, e }; this.eggs.set(e.i, v); }
        v.g.position.set(0, 0.4, e.z); v.g.rotation.y += dt * 0.8;
        if (v.g.userData.rainbow) v.g.userData.body.material.color.setHSL((t * 0.25) % 1, 0.75, 0.68);
      }
      for (const [i, v] of this.eggs) if (!live.has(i)) { scene.remove(v.g); for (const c of v.g.children) if (c.isSprite) c.material.dispose(); this.eggs.delete(i); }
    },

    /* ---------------- buying ---------------- */
    buy(e) {
      const S = this.S, price = EGGS[e.type][2] * MUT[e.mut].x;
      if (this.pendBuy) return;
      if (S.cash < price) { toast(`Not enough cash (${cash(price)})`, '#fca5a5'); sfx('error'); return; }
      const free = S.eggs.findIndex((x) => !x); if (free < 0) { toast('Your base is full — sell or rebirth', '#fca5a5'); sfx('error'); return; }
      if (this.b < 0) return;
      this.pendBuy = { i: e.i, type: e.type, mut: e.mut, price, at: performance.now(), z: e.z };
      const q = { n: ++this.reqN, i: e.i, done: false }; this.bq.push(q); this.bq = this.bq.slice(-4);
      if (!iAmHost()) send({ bq: this.bq.map((x) => [x.n, x.i]) });
      sfx('select');
    },
    settleBuys(soldSet) {
      const pb = this.pendBuy; if (!pb) return;
      const who = soldSet.get(pb.i);
      if (who === myPeer()) {
        this.pendBuy = null; const S = this.S, free = S.eggs.findIndex((x) => !x);
        if (S.cash < pb.price || free < 0) return;
        S.cash -= pb.price; S.eggs[free] = [pb.type, pb.mut]; S.acc[free] = 0; S.bought++; this.dirty = true;
        sfx('egg'); toast(`🥚 ${eggName(pb.type, pb.mut)}!`, RAR[EGGS[pb.type][1]].c);
        const r = EGGS[pb.type][1]; if (r >= 3) earn([0, 0, 0, 3, 6, 15, 40][r], `bought a ${RAR[r].n.toLowerCase()} egg`);
        // it hops over to your base
        const g = eggMesh(pb.type, pb.mut), [x, z] = slotPos(this.b, free); g.position.set(0, 0.4, ROAD0 + (now() - pb.i * GAP) * RSP); scene.add(g); this.flies.push({ g, from: g.position.clone(), to: new THREE.Vector3(x, 1.5, z), t: 0, slot: free });
        this.send(); this.drawBar();
      } else if (who) { this.pendBuy = null; toast('Someone else got it first!', '#fca5a5'); sfx('error'); }
      else if (performance.now() - pb.at > 5000) { this.pendBuy = null; }
    },
    flyEggs(dt) {
      for (let i = this.floats.length - 1; i >= 0; i--) { const f = this.floats[i]; f.t -= dt; f.s.position.y += dt * 3; f.s.material.opacity = Math.min(1, f.t * 2); if (f.t <= 0) { dropSprite(f.s); this.floats.splice(i, 1); } }
      for (let i = this.flies.length - 1; i >= 0; i--) {
        const f = this.flies[i]; f.t += dt / 1.4; const k = Math.min(1, f.t);
        f.g.position.lerpVectors(f.from, f.to, k); f.g.position.y += Math.sin(k * Math.PI) * 14;
        if (k >= 1) { scene.remove(f.g); this.flies.splice(i, 1); puffAt(f.to.x, f.to.y + 1, f.to.z, CONFETTI, 12); }
      }
    },

    /* ---------------- your base: collecting, locking, selling ---------------- */
    pads() {
      if (this.b < 0) return;
      const S = this.S; let on = -1;
      for (let k = 0; k < S.eggs.length; k++) { const [x, z] = padPos(this.b, k); if (Math.abs(P.x - x) < 1.5 && Math.abs(P.z - z) < 1.6 && P.y < 1.6) { on = k; break; } }
      const B = BASES[this.b];
      if (Math.abs(P.x - B.s * 25) < 1.6 && Math.abs(P.z - (B.zc - 25)) < 1.6 && P.y < 1.6) on = 'all';
      if (on !== this.onPad) {
        this.onPad = on;
        if (on === 'all') this.collect([...S.eggs.keys()]);
        else if (on >= 0) this.collect([on]);
      }
    },
    collect(ks) {
      const S = this.S; let got = 0;
      for (const k of ks) { got += S.acc[k] || 0; S.acc[k] = 0; }
      if (got < 1) return;
      S.cash += got; S.best = Math.max(S.best, S.cash); this.dirty = true;
      sfx('coin'); this.floaty(`+${cash(got)}`); this.drawBar();
    },
    floaty(t) { const s = textSprite([[t, '#fde68a']], 1.6); s.position.set(P.x, P.y + 7, P.z); scene.add(s); this.floats.push({ s, t: 1.2 }); },
    lock() {
      if (this.b < 0 || !inBase(this.b, P.x, P.z)) { toast('Lock your base from the red button inside it'); return; }
      const nowS = Date.now() / 1000; if ((this.lockUntil || 0) > nowS) { toast(`Already locked (${Math.ceil(this.lockUntil - nowS)}s)`); return; }
      this.lockUntil = nowS + 60 + 15 * this.S.reb; this.send(); sfx('lock'); toast('🔒 Base locked!', '#fca5a5');
    },
    sell(k) {
      const S = this.S, e = S.eggs[k]; if (!e) return;
      const price = Math.floor(EGGS[e[0]][2] * MUT[e[1]].x * 0.5);
      openPanel(`🥚 ${eggName(e[0], e[1])}`, `<div style="text-align:center"><img src="${portrait(e[0], e[1])}" alt="" style="width:150px;height:150px"><p class="xp-note">${RAR[EGGS[e[0]][1]].n} · earns ${cash(income(e[0], e[1]) * this.mult())}/s</p></div>
        <button class="xp-btn gold" data-sell="${k}" style="width:100%">Sell for ${cash(price)}</button>`, (b) => {
        if (b.dataset.sell == null) return;
        if (!S.eggs[k]) return; S.cash += price + (S.acc[k] || 0); S.eggs[k] = null; S.acc[k] = 0; this.dirty = true; sfx('sell'); closePanel(); this.send(); this.drawBar();
      });
    },

    /* ---------------- stealing ---------------- */
    steal(b, k, e, x, z) {
      if (this.carry) { toast('You’re already carrying one!'); return; }
      if (this.S.eggs.findIndex((q) => !q) < 0) { toast('Your base is full — no room for it', '#fca5a5'); sfx('error'); return; }
      this.stealing = { b, k, e, x, z, at: performance.now() / 1000, t: 0 }; sfx('select');
    },
    grab() {
      const s = this.stealing; this.stealing = null; $('#seSteal').style.display = 'none';
      const o = this.ownerOf(s.b); if (!o || o.me) return;
      this.carry = { owner: o.peer, ob: s.b, slot: s.k, t: s.e[0], m: s.e[1], n: (this.carryN = (this.carryN || 0) + 1) };
      send({ cr: [o.peer, s.k, s.e[0], s.e[1], this.carry.n] }); sfx('whoosh');
      toast(`🥷 Got it! Run it back to your base!`, '#fde68a');
    },
    dropCarry(quiet, why) {
      if (!this.carry) return;
      this.carry = null; send({ cr: null });
      if (!quiet) { toast(why || '💥 You dropped the egg!', '#fca5a5'); sfx('oof'); }
    },
    carrying(dt, tp) {
      // the egg over your head (and over everyone else's who's carrying one)
      const carriers = new Map();
      if (this.carry && me) carriers.set('me', { a: me, t: this.carry.t, m: this.carry.m });
      for (const p of this.others()) { const c = p.presence.cr, a = Net.avatars.get(p.peer); if (Array.isArray(c) && a && EGGS[c[2]]) carriers.set(p.peer, { a, t: c[2] | 0, m: clamp(c[3] | 0, 0, 3) }); }
      for (const [k, c] of carriers) {
        let v = this.carryV.get(k);
        if (!v || v.t !== c.t || v.m !== c.m) { if (v) scene.remove(v.g); const g = eggMesh(c.t, c.m); scene.add(g); v = { g, t: c.t, m: c.m }; this.carryV.set(k, v); }
        v.g.position.set(c.a.g.position.x, c.a.g.position.y + 6.2, c.a.g.position.z); v.g.rotation.y += dt * 2;
      }
      for (const [k, v] of this.carryV) if (!carriers.has(k)) { scene.remove(v.g); this.carryV.delete(k); }
      if (!this.carry) return;
      if (P.dead) { this.dropCarry(false, '💀 You dropped the egg'); return; }
      // home with it
      if (inBase(this.b, P.x, P.z)) {
        const c = this.carry, S = this.S, free = S.eggs.findIndex((q) => !q), o = this.others().find((p) => p.peer === c.owner);
        this.carry = null;
        if (!o) { send({ cr: null }); toast('The owner left — the egg vanished!', '#fca5a5'); return; }
        if (free < 0) { send({ cr: null }); toast('No room in your base!', '#fca5a5'); return; }
        S.eggs[free] = [c.t, c.m]; S.acc[free] = 0; S.stolen++; this.dirty = true;
        this.stoList.push([c.owner, c.slot, c.n]); this.stoList = this.stoList.slice(-5);
        send({ cr: null, sto: this.stoList }); this.send();
        sfx('win'); toast(`🥷 Stolen: ${eggName(c.t, c.m)}!`, '#86efac'); earn(5, 'stole an egg'); puffAt(P.x, P.y + 3, P.z, CONFETTI, 18); this.drawBar();
      }
    },
    // someone's after your eggs
    thieves() {
      const S = this.S, el = $('#seAlert'); let msg = '';
      for (const p of this.others()) {
        const c = p.presence.cr, nm = String(p.presence.nm || 'Someone').slice(0, 20);
        if (Array.isArray(c) && c[0] === myPeer()) {
          msg = `🚨 ${esc(nm)} is stealing your ${esc(EGGS[c[2]] ? eggName(c[2], c[3] | 0) : 'egg')}! Bonk them!`;
          const key = p.peer + ':' + c[4]; if (!this.alerted.has(key)) { this.alerted.set(key, 1); sfx('alarm'); }
        }
        for (const s of Array.isArray(p.presence.sto) ? p.presence.sto : []) {
          if (!Array.isArray(s) || s[0] !== myPeer()) continue;
          const key = p.peer + ':' + p.presence.t + ':' + s[2]; if (this.seenSto.has(key)) continue; this.seenSto.add(key);
          const e = S.eggs[s[1]]; if (!e) continue;
          S.eggs[s[1]] = null; S.acc[s[1]] = 0; S.lost++; this.dirty = true; this.send(); this.drawBar();
          toast(`💔 ${nm} stole your ${eggName(e[0], e[1])}!`, '#fca5a5'); sfx('lose');
        }
      }
      if (el) el.innerHTML = msg ? `<div class="se-alert">${msg}</div>` : '';
    },

    /* ---------------- bonking, freezing, cloaking ---------------- */
    click(e) { this.swing(); },
    swing() {
      const tp = performance.now() / 1000; if (tp < this.hitCd || P.dead || tp < this.frozenUntil) return;
      this.hitCd = tp + 0.55; this.swingT = 0.3; sfx('swing');
      const range = this.S.gear.gbat ? 8 : 6, fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
      let best = null, bd = range;
      for (const p of players()) { if (p.me) continue; const dx = p.x - P.x, dz = p.z - P.z, d = Math.hypot(dx, dz); if (d < bd && (d < 2 || (dx * fx + dz * fz) / d > 0.2) && Math.abs(p.y - P.y) < 5) { bd = d; best = p; } }
      if (!best) return;
      this.hitN++; send({ hit: [this.hitN, best.peer, this.S.gear.gbat ? 1 : 0] }); sfx('hit');
      const a = Net.avatars.get(best.peer); if (a) puffAt(a.g.position.x, a.g.position.y + 3, a.g.position.z, 0xffffff, 6);
    },
    freeze() {
      const tp = performance.now() / 1000; if (!this.S.gear.freeze) { this.gearShop(); return; }
      if (tp < this.freezeCd) { toast(`Freeze Ray recharging (${Math.ceil(this.freezeCd - tp)}s)`); return; }
      let best = null, bd = 30; for (const p of players()) { if (p.me) continue; const d = Math.hypot(p.x - P.x, p.z - P.z); if (d < bd) { bd = d; best = p; } }
      if (!best) { toast('Nobody close enough to freeze'); return; }
      this.freezeCd = tp + 20; this.fzN++; send({ fz: [this.fzN, best.peer] }); sfx('freeze'); this.drawBar();
    },
    cloak() {
      const tp = performance.now() / 1000; if (!this.S.gear.cloak) { this.gearShop(); return; }
      if (tp < this.cloakCd) { toast(`Cloak recharging (${Math.ceil(this.cloakCd - tp)}s)`); return; }
      this.cloakCd = tp + 40; this.cloakUntil = tp + 8; send({ cl: Math.floor(Date.now() / 1000 + 8) }); sfx('magic'); toast('👻 Invisible for 8 seconds', '#c4b5fd'); this.drawBar();
    },
    hits(tp) {
      for (const p of this.others()) {
        // (the first time we see someone, whatever they did before we got here doesn't count)
        const key = p.peer + ':' + p.presence.t, h = Array.isArray(p.presence.hit) ? p.presence.hit : [0], f = Array.isArray(p.presence.fz) ? p.presence.fz : [0];
        const lh = this.seenHit.get(key); this.seenHit.set(key, h[0]);
        if (lh !== undefined && h[0] !== lh && h[1] === myPeer()) this.bonked(p, h[2]);
        const lf = this.seenFz.get(key); this.seenFz.set(key, f[0]);
        if (lf !== undefined && f[0] !== lf && f[1] === myPeer()) { this.frozenUntil = tp + 3; send({ fr: Math.floor(Date.now() / 1000 + 3) }); toast(`❄️ ${String(p.presence.nm || 'Someone').slice(0, 20)} froze you!`, '#7dd3fc'); sfx('freeze'); }
      }
    },
    bonked(p, gold) {
      const a = Net.avatars.get(p.peer), ax = a ? a.g.position.x : p.presence.p[0], az = a ? a.g.position.z : p.presence.p[2];
      let dx = P.x - ax, dz = P.z - az; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const k = gold ? 46 : 34; P.vx = dx * k; P.vz = dz * k; P.vy = 22; P.ground = null;
      this.frozenUntil = Math.max(this.frozenUntil, performance.now() / 1000 + 0.5);
      sfx('punch'); this.shove = { vx: dx * k, vz: dz * k, t: 0.35 };
      if (this.carry) this.dropCarry(false, `💥 ${String(p.presence.nm || 'Someone').slice(0, 20)} bonked the egg out of your hands!`);
    },
    // after the walk animation: your bat swing, frozen people in ice, cloaked people unseen
    pose(dt) {
      if (!this.S) return;
      if (this.shove && this.shove.t > 0 && !P.dead) { this.shove.t -= dt; moveP(this.shove.vx * dt, 0, this.shove.vz * dt); }
      if (me && this.swingT > 0) me.armR.rotation.x = 2.6 - (1 - this.swingT / 0.3) * 2.4;
      const nowS = Date.now() / 1000;
      if (me) me.g.visible = true;
      const cloaked = performance.now() / 1000 < this.cloakUntil;
      if (me && cloaked !== !!me.cloaked) { me.cloaked = cloaked; for (const m of me.mats) { m.transparent = cloaked; m.opacity = cloaked ? 0.3 : 1; m.needsUpdate = true; } }
      const frozen = new Set();
      for (const p of this.others()) {
        const a = Net.avatars.get(p.peer); if (!a) continue;
        a.g.visible = !(+p.presence.cl > nowS);
        if (a.shadow) a.shadow.visible = a.g.visible && a.shadow.visible;
        if (+p.presence.fr > nowS) frozen.add(p.peer);
      }
      if (performance.now() / 1000 < this.frozenUntil) frozen.add('me');
      for (const k of frozen) {
        let m = this.ice.get(k); const a = k === 'me' ? me : Net.avatars.get(k); if (!a) continue;
        if (!m) { m = new THREE.Mesh(BOX, new THREE.MeshLambertMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.55 })); m.scale.set(3.6, 6.6, 3.6); scene.add(m); this.ice.set(k, m); }
        m.position.set(a.g.position.x, a.g.position.y + 3.2, a.g.position.z);
      }
      for (const [k, m] of this.ice) if (!frozen.has(k)) { scene.remove(m); m.material.dispose(); this.ice.delete(k); }
    },

    /* ---------------- prompts, keys and menus ---------------- */
    prompts() {
      if (!this.S) return [];
      const out = [], S = this.S;
      out.push({ x: -30, z: -155, r: 6, text: '🛍️ Gear shop', fn: () => this.gearShop() });
      out.push({ x: 30, z: -154, r: 6, text: '♻️ Rebirth', fn: () => this.rebirthPanel() });
      // eggs on the carpet
      if (Math.abs(P.x) < 12 && !this.carry) {
        let best = null, bd = 7;
        for (const v of this.eggs.values()) { const d = Math.abs(v.g.position.z - P.z) + Math.abs(P.x) * 0.3; if (d < bd) { bd = d; best = v; } }
        if (best) { const e = best.e; out.push({ x: P.x, z: P.z, r: 1, text: this.pendBuy ? 'Buying…' : `🥚 Buy ${eggName(e.type, e.mut)} — ${cash(EGGS[e.type][2] * MUT[e.mut].x)}`, fn: () => this.buy(e) }); }
      }
      const bHere = baseAt(P.x, P.z);
      if (bHere >= 0) {
        const B = BASES[bHere];
        if (bHere === this.b) {
          out.push({ x: B.s * 25, z: B.zc + 25, r: 3, text: (this.lockUntil || 0) > Date.now() / 1000 ? `🔒 Locked (${Math.ceil(this.lockUntil - Date.now() / 1000)}s)` : `🔒 Lock your base (${60 + 15 * S.reb}s)`, fn: () => this.lock() });
          S.eggs.forEach((e, k) => { if (!e) return; const [x, z] = slotPos(bHere, k); out.push({ x, z, r: 3.4, text: `💰 Sell the ${eggName(e[0], e[1]).toLowerCase()}`, fn: () => this.sell(k) }); });
        } else if (!this.carry) {
          const o = this.ownerOf(bHere);
          if (o) for (const [k, e] of this.eggsOf(o.pr)) {
            if (this.others().some((p) => Array.isArray(p.presence.cr) && p.presence.cr[0] === o.peer && p.presence.cr[1] === k)) continue;
            const [x, z] = slotPos(bHere, k); out.push({ x, z, r: 3.6, text: `🥷 Steal the ${eggName(e[0], e[1]).toLowerCase()}`, fn: () => this.steal(bHere, k, e, x, z) });
          }
        }
      }
      return out;
    },
    key(code, down) {
      if (!down) return;
      if (code === 'KeyF') { this.freeze(); return true; }
      if (code === 'KeyV') { this.cloak(); return true; }
      if (code === 'KeyL') { this.lock(); return true; }
      if (code === 'KeyG') { this.gearShop(); return true; }
      if (code === 'KeyI') { this.index(); return true; }
      if (code === 'KeyB') { this.home(); return true; }
      if (code === 'Digit1' || code === 'KeyQ') { this.swing(); return true; }
    },
    menuKey(code) { if (code === 'KeyG' || code === 'KeyI') closePanel(); },
    home() {
      if (this.carry) { toast('You can’t teleport while carrying an egg!'); return; }
      const s = this.spawn(); P.x = s[0]; P.y = s[1]; P.z = s[2]; P.vx = P.vy = P.vz = 0; sfx('teleport');
    },
    drawBar() {
      const S = this.S; if (!S) return;
      const tp = performance.now() / 1000, cd = (t) => (t > tp ? `<span class="n">${Math.ceil(t - tp)}s</span>` : '');
      setBar(`<button class="xslot" data-k="bat" title="Bonk (click / Q)"><span class="k">Q</span><span class="e">${S.gear.gbat ? '🏆' : '🏏'}</span>Bat</button>`
        + `<button class="xslot" data-k="fz" ${S.gear.freeze ? '' : 'title="Buy it in the gear shop"'}><span class="k">F</span><span class="e">❄️</span>${S.gear.freeze ? 'Freeze' : 'Freeze 🔒'}${cd(this.freezeCd)}</button>`
        + `<button class="xslot" data-k="cl" ${S.gear.cloak ? '' : 'title="Buy it in the gear shop"'}><span class="k">V</span><span class="e">👻</span>${S.gear.cloak ? 'Cloak' : 'Cloak 🔒'}${cd(this.cloakCd)}</button>`
        + `<button class="xslot" data-k="lock"><span class="k">L</span><span class="e">🔒</span>Lock</button>`
        + `<button class="xslot" data-k="home"><span class="k">B</span><span class="e">🏠</span>Base</button>`
        + `<button class="xslot" data-k="gear"><span class="k">G</span><span class="e">🛍️</span>Gear</button>`
        + `<button class="xslot" data-k="idx"><span class="k">I</span><span class="e">📖</span>Eggs<span class="n">${S.eggs.filter(Boolean).length}/${S.eggs.length}</span></button>`, (b) => {
        const k = b.dataset.k;
        if (k === 'bat') this.swing(); if (k === 'fz') this.freeze(); if (k === 'cl') this.cloak(); if (k === 'lock') this.lock(); if (k === 'home') this.home(); if (k === 'gear') this.gearShop(); if (k === 'idx') this.index();
      });
      clearTimeout(this.barT); if (this.freezeCd > tp || this.cloakCd > tp) this.barT = setTimeout(() => this.drawBar(), 1000);
    },
    gearShop() {
      const S = this.S;
      openPanel('🛍️ Gear shop', `<div class="xp-grid">${Object.entries(GEAR).map(([k, G]) => `<div class="xp-card ${S.gear[k] ? 'on' : ''}"><div class="big">${G.e}</div><b>${G.n}</b><small>${esc(G.d)}</small>${S.gear[k] ? '<button class="xp-btn alt" disabled>Owned</button>' : `<button class="xp-btn gold" data-g="${k}" ${S.cash < G.price ? 'disabled' : ''}>${cash(G.price)}</button>`}</div>`).join('')}</div>
        <p class="xp-note">Click (or Q) bonks whoever's in front of you with your bat: anyone carrying an egg drops it.</p>`, (b) => {
        const k = b.dataset.g; if (!k || S.gear[k] || S.cash < GEAR[k].price) return;
        S.cash -= GEAR[k].price; S.gear[k] = 1; this.dirty = true; sfx('buy'); toast(`${GEAR[k].e} ${GEAR[k].n}!`, '#fde68a'); this.drawBar(); this.gearShop();
      }, null, { extra: `<span class="chip">💰 ${cash(S.cash)}</span>` });
    },
    rebirthPanel() {
      const S = this.S, cost = rebirthCost(S.reb), can = S.cash >= cost;
      openPanel('♻️ Rebirth', `<div class="xp-row"><span class="lft"><span class="ico">♻️</span><span><b>Rebirth ${S.reb + 1}</b><br><small>Costs ${cash(cost)} (you have ${cash(S.cash)})</small></span></span></div>
        <p class="xp-note">Rebirthing gives up your cash and every egg in your base. In return, everything you earn after is ×${(1 + 0.6 * (S.reb + 1)).toFixed(1)}${S.reb + 1 === 1 || S.reb + 1 === 3 ? ', you get 5 more egg slots' : ''}, and your base stays locked ${15 * (S.reb + 1)}s longer. Gear is kept.</p>
        <div class="meter"><i style="width:${Math.min(100, (S.cash / cost) * 100)}%"></i></div><br>
        <button class="xp-btn ${can ? 'gold' : 'alt'}" data-rb="1" ${can ? '' : 'disabled'} style="width:100%">${can ? 'Rebirth!' : `Need ${cash(cost - S.cash)} more`}</button>`, (b) => {
        if (!b.dataset.rb || S.cash < cost) return;
        S.reb++; S.cash = 0; S.eggs = Array(SLOTS(S.reb)).fill(null); S.acc = S.eggs.map(() => 0); this.dirty = true; this.save(); this.send(); this.drawBar();
        closePanel(); toast(`♻️ Rebirth ${S.reb}! Earnings ×${this.mult().toFixed(1)}`, '#fde68a'); sfx('levelup'); earn(100, `rebirth ${S.reb} in Steal an Egg`);
      }, null, { extra: `<span class="chip">♻️ ${S.reb}</span>` });
    },
    index() {
      const S = this.S, have = new Set(S.eggs.filter(Boolean).map((e) => e[0]));
      openPanel('📖 Egg index', RAR.map((R, r) => `<h4 style="color:${R.c}">${R.n}</h4><div class="se-egg">${BYR[r].map((t) => `<div class="xp-card ${have.has(t) ? 'on' : ''}"><img src="${portrait(t, 0)}" alt=""><b>${esc(EGGS[t][0])}</b><small>${cash(EGGS[t][2])} · ${cash(EGGS[t][3])}/s</small></div>`).join('')}</div>`).join('')
        + `<p class="xp-note">Gold eggs earn ×2, Diamond ×4 and Rainbow ×8. Watch for the Lucky Hour (rare eggs ×3) and the Golden Hour (mutations ×3).</p>`, null, null, { full: true, extra: `<span class="chip">🥚 ${S.bought} bought · 🥷 ${S.stolen} stolen</span>` });
    },
    hud() {
      if (!this.S) return '';
      const S = this.S, waiting = S.acc.reduce((a, b) => a + (b || 0), 0);
      return `💰 <b>${cash(S.cash)}</b> · 📈 ${cash(this.rate())}/s · 🏦 ${cash(waiting)} waiting${this.carry ? ` · 🥷 <b>Carrying the ${esc(eggName(this.carry.t, this.carry.m).toLowerCase())} — get it home!</b>` : ''}${this.S.reb ? ` · ♻️ ${this.S.reb}` : ''}`;
    },
  };
  addExp(SE);
  window.__rbSE = SE; // for tests
})();
