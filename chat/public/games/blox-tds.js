/* =====================================================================
   BLOXVERSE — TOWER DEFENSE SIMULATOR. Up to 4 players defend one path
   together. Each player has their own cash and towers; the host runs the
   enemies and the towers' shooting and shares it through presence.
   Players ask the host to place / upgrade / sell through their presence.
   ===================================================================== */
(() => {
  const PATH = [[-88, -48], [-40, -48], [-40, 22], [2, 22], [2, -30], [44, -30], [44, 42], [88, 42]];
  const SEG = [], LEN = (() => { let L = 0; for (let i = 1; i < PATH.length; i++) { const d = Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]); SEG.push([L, d]); L += d; } return L; })();
  function posAt(s) {
    s = clamp(s, 0, LEN);
    for (let i = 0; i < SEG.length; i++) { const [a, d] = SEG[i]; if (s <= a + d || i === SEG.length - 1) { const f = d ? (s - a) / d : 0, p = PATH[i], q = PATH[i + 1]; return [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f, Math.atan2(-(q[0] - p[0]), -(q[1] - p[1]))]; } }
    return PATH[PATH.length - 1].concat(0);
  }
  function distToPath(x, z) {
    let best = 1e9;
    for (let i = 1; i < PATH.length; i++) { const [ax, az] = PATH[i - 1], [bx, bz] = PATH[i], dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz, t = clamp(((x - ax) * dx + (z - az) * dz) / l, 0, 1); best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t)); }
    return best;
  }
  // enemies: hp, speed, damage to the base, cash, colour, flags
  const EN = [
    { n: 'Normal', hp: 6, sp: 6.3, dmg: 1, cash: 4, c: 0x65a30d },
    { n: 'Quick', hp: 4, sp: 11.5, dmg: 1, cash: 4, c: 0xfacc15 },
    { n: 'Slow', hp: 30, sp: 3.6, dmg: 2, cash: 10, c: 0x7c2d12, big: 1.3 },
    { n: 'Hidden', hp: 10, sp: 7.2, dmg: 1, cash: 8, c: 0x9ca3af, hidden: 1 },
    { n: 'Armored', hp: 44, sp: 4.5, dmg: 3, cash: 14, c: 0x475569, armor: 0.65, big: 1.2 },
    { n: 'Breaker', hp: 230, sp: 7, dmg: 14, cash: 60, c: 0xb91c1c, big: 1.8, boss: 1 },
    { n: 'Grave Digger', hp: 1000, sp: 2.7, dmg: 999, cash: 300, c: 0x1e1b4b, big: 2.6, boss: 1 },
    { n: 'Mystery', hp: 16, sp: 6.3, dmg: 1, cash: 6, c: 0x7c3aed, split: 1 },
  ];
  // towers: price, upgrade costs, per-level stats; unlock = Blox Coins to unlock (0 = free)
  const TW = [
    { n: 'Scout', e: '🔫', price: 200, unlock: 0, up: [50, 150, 400, 1200], dmg: [2, 2, 3, 4, 6], rate: [1.8, 2.3, 2.6, 3.1, 4], range: [13, 14, 15, 17, 18], hid: 2, c: 0x22c55e, limit: 12 },
    { n: 'Sniper', e: '🎯', price: 350, unlock: 0, up: [150, 500, 1500, 4000], dmg: [8, 12, 20, 35, 70], rate: [0.45, 0.5, 0.55, 0.62, 0.8], range: [32, 34, 37, 42, 48], hid: 1, c: 0x0ea5e9, limit: 12 },
    { n: 'Soldier', e: '🪖', price: 400, unlock: 0, up: [250, 700, 2000, 5000], dmg: [3, 3, 4, 6, 8], rate: [3.5, 4, 4.6, 5.5, 7], range: [15, 16, 17, 18, 20], hid: 3, c: 0x4d7c0f, limit: 12 },
    { n: 'Demoman', e: '💣', price: 600, unlock: 0, up: [300, 900, 2500, 6000], dmg: [6, 9, 14, 22, 40], rate: [0.7, 0.75, 0.8, 0.9, 1], range: [14, 14, 15, 16, 17], splash: [4.5, 5, 5.5, 6.5, 7.5], hid: 9, c: 0x7f1d1d, limit: 10 },
    { n: 'Farm', e: '🌾', price: 250, unlock: 0, up: [150, 400, 1200, 3000], income: [75, 150, 350, 650, 1300], c: 0xa16207, limit: 8 },
    { n: 'Freezer', e: '🧊', price: 450, unlock: 150, up: [200, 600, 1500, 3500], dmg: [2, 2, 3, 3, 4], rate: [1.2, 1.4, 1.6, 1.8, 2.2], range: [13, 14, 15, 16, 17], slow: [0.35, 0.45, 0.5, 0.55, 0.65], hid: 3, c: 0x67e8f9, limit: 8 },
    { n: 'Commander', e: '🚩', price: 650, unlock: 300, up: [400, 1200, 3000, 7000], buff: [0.15, 0.2, 0.3, 0.4, 0.5], range: [15, 15, 16, 18, 20], c: 0x1d4ed8, limit: 4 },
    { n: 'Minigunner', e: '⚙️', price: 1600, unlock: 400, up: [800, 2500, 6000, 15000], dmg: [2, 2, 3, 4, 5], rate: [11, 13, 15, 18, 22], range: [17, 17, 18, 19, 21], hid: 2, c: 0x374151, limit: 8 },
    { n: 'Ranger', e: '🏹', price: 5000, unlock: 1000, up: [3000, 8000, 20000, 45000], dmg: [90, 135, 220, 360, 600], rate: [0.33, 0.35, 0.38, 0.42, 0.5], range: [62, 65, 68, 72, 78], hid: 0, c: 0x312e81, limit: 3 },
  ];
  const DIFF = { easy: { n: 'Easy', waves: 15, hp: 0.8, base: 200, cash: 800, coins: 100 }, normal: { n: 'Normal', waves: 20, hp: 1, base: 150, cash: 600, coins: 175 }, hard: { n: 'Hard', waves: 25, hp: 1.45, base: 100, cash: 450, coins: 300 } };
  const TGT = ['First', 'Last', 'Strongest', 'Close'];
  const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const n2 = (n) => AL[(n >> 6) & 63] + AL[n & 63], d2 = (t, i) => AL.indexOf(t[i]) * 64 + AL.indexOf(t[i + 1]);
  const fmt = (n) => '$' + Math.floor(n).toLocaleString('en-US');
  // the sound of each tower's shot (Farm and Commander don't shoot)
  const SHOT_SND = [['gun', { vol: 0.5, pitch: 1.4 }], ['gun', { vol: 0.9, pitch: 0.7 }], ['gun', { vol: 0.6 }], ['explode', { vol: 0.45 }], null, ['freeze', { vol: 0.6 }], null, ['gun', { vol: 0.35, pitch: 1.6, gap: 30 }], ['laser', { vol: 0.7, pitch: 0.8 }]];
  // what each wave sends
  function waveList(n, last) {
    const q = [], add = (t, k, gap) => { for (let i = 0; i < k; i++) q.push([t, gap]); };
    if (n === last) { add(5, 2, 2.5); add(4, 6, 0.8); add(6, 1, 3); add(3, 8, 0.5); return q; }
    add(0, 4 + n * 2, Math.max(0.35, 1.1 - n * 0.03));
    if (n >= 3) add(1, 2 + n, 0.45);
    if (n >= 5) add(2, Math.floor(n / 2), 1.2);
    if (n >= 6) add(7, Math.floor(n / 3), 0.9);
    if (n >= 7) add(3, Math.floor(n / 2), 0.7);
    if (n >= 9) add(4, Math.floor(n / 3), 1.4);
    if (n % 5 === 0) add(5, Math.floor(n / 10) + 1, 2);
    return q;
  }
  // ---------------------------------------------------------------- models
  const MATS = new Map(), mat = (c) => { if (!MATS.has(c)) MATS.set(c, new THREE.MeshLambertMaterial({ color: c })); return MATS.get(c); };
  const bx = (g, c, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(BOX, mat(c)); m.scale.set(sx, sy, sz); m.position.set(x, y, z); g.add(m); return m; };
  function enemyModel(t) {
    const d = EN[t], g = new THREE.Group(), s = d.big || 1, c = d.c;
    bx(g, 0x1f2937, 0.5, 1.4, 0.5, -0.3, 0.7, 0); bx(g, 0x1f2937, 0.5, 1.4, 0.5, 0.3, 0.7, 0);
    bx(g, c, 1.2, 1.3, 0.6, 0, 2.05, 0); bx(g, d.hidden ? 0xd1d5db : 0x86efac, 0.8, 0.8, 0.8, 0, 3.1, 0);
    const aL = bx(g, d.hidden ? 0xd1d5db : 0x86efac, 0.35, 1.2, 0.35, -0.8, 2.2, -0.4); aL.rotation.x = -1.3; const aR = bx(g, d.hidden ? 0xd1d5db : 0x86efac, 0.35, 1.2, 0.35, 0.8, 2.2, -0.4); aR.rotation.x = -1.3;
    bx(g, 0x111111, 0.16, 0.16, 0.04, -0.18, 3.2, -0.41); bx(g, 0x111111, 0.16, 0.16, 0.04, 0.18, 3.2, -0.41);
    if (d.armor) { bx(g, 0x9ca3af, 1.3, 0.5, 0.7, 0, 2.5, 0); bx(g, 0x9ca3af, 0.9, 0.3, 0.9, 0, 3.55, 0); }
    if (d.boss) bx(g, 0xfacc15, 0.9, 0.25, 0.9, 0, 3.65, 0);
    g.scale.setScalar(s);
    const bar = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: 0x22c55e })); bar.scale.set(1.6, 0.18, 0.05); bar.position.y = 4.1; g.add(bar); g.userData.bar = bar;
    return g;
  }
  // ---------------------------------------------------------------- the towers: polished metal and glowing parts, like the
  // limited hats, and a look that grows with every upgrade (a chest plate, gold trim, shoulder armour, then gold armour with an aura)
  const TGEO = {
    box: BOX, cyl: new THREE.CylinderGeometry(1, 1, 1, 16), oct: new THREE.CylinderGeometry(1, 1, 1, 8), hex: new THREE.CylinderGeometry(1, 1, 1, 6),
    cone: new THREE.ConeGeometry(1, 1, 16), ball: new THREE.SphereGeometry(1, 16, 12), dome: new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    gem: new THREE.OctahedronGeometry(1, 0), ring: new THREE.TorusGeometry(1, 0.07, 8, 40), thin: new THREE.TorusGeometry(1, 0.035, 6, 40),
    roof: (() => { const s = new THREE.Shape(); s.moveTo(-1, 0); s.lineTo(1, 0); s.lineTo(0, 0.8); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }); g.translate(0, 0, -0.5); return g; })(),
  };
  const TMAT = new Map(), tmat = (k, f) => { if (!TMAT.has(k)) TMAT.set(k, f()); return TMAT.get(k); };
  const steel = (c) => tmat('m' + c, () => metalMat(c)); // shiny metal
  const lit = (c) => tmat('g' + c, () => new THREE.MeshBasicMaterial({ color: c })); // glowing: lit from inside
  const ice = () => tmat('ice', () => metalMat(0xc9f3ff, { transparent: true, opacity: 0.8, reflectivity: 0.9, shininess: 140, specular: '#ffffff' }));
  const GOLD = 0xf2c14e, STEEL = 0xc3cbd6, SKIN = 0xf2c94c;
  // one piece: a shape, a material, where, how big (one number for all three), how turned
  const pc = (p, geo, m, x, y, z, sx, sy, sz, rx, ry, rz) => { const o = new THREE.Mesh(TGEO[geo] || geo, m); o.position.set(x, y, z); o.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz); if (rx || ry || rz) o.rotation.set(rx || 0, ry || 0, rz || 0); p.add(o); return o; };
  // a rod from one point to another (arms, poles, legs of a bipod)
  const _up = new THREE.Vector3(0, 1, 0), _a = new THREE.Vector3(), _b = new THREE.Vector3();
  const rod = (p, a, b, r, m) => { _a.set(...a); _b.set(...b).sub(_a); const o = new THREE.Mesh(TGEO.cyl, m); o.scale.set(r, _b.length(), r); o.position.copy(_a).addScaledVector(_b, 0.5); o.quaternion.setFromUnitVectors(_up, _b.normalize()); p.add(o); return o; };
  const glowCard = (k, c, w, h, x, y, z, p, fn) => { const o = fxCard(k, c, w, h, x, y, z, p, fn); o.raycast = () => {}; return o; }; // (clicks go through glows)
  // the still parts of a tower become one mesh per material, so a map full of towers stays quick to draw
  function bake(src) {
    const out = new THREE.Group(), by = new Map(), p = new THREE.Vector3(), nm = new THREE.Matrix3();
    src.updateMatrixWorld(true);
    src.traverse((o) => { if (o.isMesh && !o.userData.fx) { if (!by.has(o.material)) by.set(o.material, []); by.get(o.material).push(o); } });
    for (const [m, list] of by) {
      let n = 0, ni = 0; for (const o of list) { n += o.geometry.attributes.position.count; ni += o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count; }
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), idx = new (n > 65535 ? Uint32Array : Uint16Array)(ni);
      let v = 0, k = 0;
      for (const o of list) {
        const G = o.geometry, P = G.attributes.position, N = G.attributes.normal; nm.getNormalMatrix(o.matrixWorld);
        for (let i = 0; i < P.count; i++) {
          p.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); pos[(v + i) * 3] = p.x; pos[(v + i) * 3 + 1] = p.y; pos[(v + i) * 3 + 2] = p.z;
          p.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor[(v + i) * 3] = p.x; nor[(v + i) * 3 + 1] = p.y; nor[(v + i) * 3 + 2] = p.z;
        }
        if (G.index) for (let i = 0; i < G.index.count; i++) idx[k++] = G.index.getX(i) + v; else for (let i = 0; i < P.count; i++) idx[k++] = v + i;
        v += P.count;
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
      const mesh = new THREE.Mesh(geo, m); mesh.userData.baked = true; out.add(mesh);
    }
    return out;
  }
  // a part that moves (spins, waves, recoils): its pieces are baked too, then it's moved as one
  const mover = (p, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); return g; };
  const settle = (g) => { const parts = g.children.filter((o) => o.isMesh && !o.userData.fx); if (!parts.length) return g; const tmp = new THREE.Group(); parts.forEach((o) => tmp.add(o)); g.add(bake(tmp)); return g; };

  // the stand every tower is on: dark metal, the owner's colour with a glowing ring, a gem per upgrade
  function pedestal(S, lvl, own) {
    pc(S, 'oct', steel(0x4b5563), 0, 0.22, 0, 1.75, 0.44, 1.75, 0, Math.PI / 8);
    pc(S, 'oct', steel(lvl >= 2 ? GOLD : STEEL), 0, 0.47, 0, 1.68, 0.08, 1.68, 0, Math.PI / 8);
    pc(S, 'oct', mat(own), 0, 0.53, 0, 1.5, 0.08, 1.5, 0, Math.PI / 8);
    pc(S, 'ring', lit(own), 0, 0.58, 0, 1.42, 1.42, 1.42, Math.PI / 2);
    for (let i = 0; i < lvl; i++) { const a = Math.PI + (i - (lvl - 1) / 2) * 0.4; pc(S, 'gem', lit(lvl >= 4 ? 0xffe680 : 0xfde047), Math.sin(a) * 1.76, 0.24, Math.cos(a) * 1.76, 0.13, 0.19, 0.13); }
    if (lvl >= 3) for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; pc(S, 'cyl', steel(GOLD), Math.sin(a) * 1.5, 0.75, Math.cos(a) * 1.5, 0.09, 0.4, 0.09); pc(S, 'ball', lit(0xffe680), Math.sin(a) * 1.5, 1.0, Math.cos(a) * 1.5, 0.11); }
  }
  // max level: a beam of golden light, gold gems going round the stand, sparkles and a soft glow in the tower's colour
  let BEAM_TEX = null;
  const BEAM_GEO = new THREE.CylinderGeometry(1.5, 1.5, 6, 28, 1, true);
  function maxFx(g, A, c, y) {
    if (!BEAM_TEX) { const cv = document.createElement('canvas'); cv.width = 4; cv.height = 128; const x = cv.getContext('2d'), gr = x.createLinearGradient(0, 128, 0, 0); for (const [k, a] of [[0, 0.95], [0.25, 0.5], [0.7, 0.12], [1, 0]]) gr.addColorStop(k, `rgba(255,255,255,${a})`); x.fillStyle = gr; x.fillRect(0, 0, 4, 128); BEAM_TEX = new THREE.CanvasTexture(cv); }
    const beam = new THREE.Mesh(BEAM_GEO, new THREE.MeshBasicMaterial({ map: BEAM_TEX, color: 0xffd34d, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
    beam.position.y = 3.6; beam.userData.fx = beam.userData.noShadow = true; beam.raycast = () => {}; g.add(beam);
    glowCard('glow', c, 6, 6, 0, y, 0, g, (o, m, t) => { m.opacity = 0.33 + 0.12 * Math.sin(t * 2.4); });
    const orbit = mover(g, 0, 0, 0);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; pc(orbit, 'gem', lit(0xffd34d), Math.sin(a) * 1.62, 0.95, Math.cos(a) * 1.62, 0.13, 0.22, 0.13); }
    settle(orbit);
    for (let i = 0; i < 3; i++) glowCard('twinkle', 0xfff3b0, 0.7, 0.7, Math.sin(i * 2.1) * 1.9, 1.2 + i * 1.1, Math.cos(i * 2.1) * 1.9, orbit, twinkle(0.7, i * 1.7, 2.6));
    A.push((t) => { orbit.rotation.y = t * 0.9; beam.material.opacity = 0.42 + 0.12 * Math.sin(t * 2.4); });
  }
  // a Roblox-style figure in armour: o = { shirt, pants, lvl, head, visor, plate }
  function figure(S, o) {
    const lvl = o.lvl, trim = steel(lvl >= 2 ? GOLD : STEEL), plate = steel(lvl >= 4 ? GOLD : o.plate || 0xaab4c0), shirt = mat(o.shirt), pants = mat(o.pants || 0x1f2937), skin = mat(SKIN);
    for (const s of [-1, 1]) {
      pc(S, 'cyl', pants, 0.27 * s, 1.2, 0, 0.25, 1.16, 0.27);
      pc(S, 'box', steel(0x2b2f36), 0.27 * s, 0.74, -0.06, 0.48, 0.3, 0.64);
      if (lvl >= 1) pc(S, 'ball', trim, 0.27 * s, 1.42, -0.25, 0.14, 0.16, 0.1);
    }
    pc(S, 'box', shirt, 0, 2.45, 0, 1.2, 1.32, 0.62);
    pc(S, 'box', trim, 0, 1.88, 0, 1.26, 0.16, 0.68);
    pc(S, 'box', lvl >= 2 ? lit(0xffe680) : steel(STEEL), 0, 1.88, -0.36, 0.24, 0.2, 0.06);
    if (lvl >= 1) { pc(S, 'box', plate, 0, 2.62, -0.33, 1.02, 0.86, 0.12); pc(S, 'box', trim, 0, 3.0, -0.35, 1.06, 0.1, 0.14); pc(S, 'gem', lit(o.visor), 0, 2.62, -0.41, 0.12, 0.16, 0.06); }
    if (lvl >= 3) for (const s of [-1, 1]) { pc(S, 'dome', plate, 0.7 * s, 3.0, 0, 0.42, 0.32, 0.44, 0, 0, -0.35 * s); pc(S, 'thin', trim, 0.7 * s, 3.0, 0, 0.42, 0.42, 0.42, Math.PI / 2, 0, -0.35 * s); }
    pc(S, 'cyl', skin, 0, 3.5, 0, 0.4, 0.78, 0.4);
    pc(S, 'box', mat(0x111111), -0.15, 3.58, -0.39, 0.1, 0.15, 0.04); pc(S, 'box', mat(0x111111), 0.15, 3.58, -0.39, 0.1, 0.15, 0.04);
    const h = o.head;
    if (h === 'cap') { pc(S, 'dome', mat(o.shirt), 0, 3.86, 0, 0.44, 0.3, 0.44); pc(S, 'box', mat(o.shirt), 0, 3.88, -0.48, 0.62, 0.06, 0.4); if (lvl >= 2) pc(S, 'box', lit(o.visor), 0, 3.58, -0.42, 0.7, 0.14, 0.05); }
    else if (h === 'helmet') { pc(S, 'dome', steel(lvl >= 4 ? GOLD : 0x4d5b3a), 0, 3.82, 0, 0.5, 0.42, 0.52); pc(S, 'thin', trim, 0, 3.84, 0, 0.5, 0.5, 0.52, Math.PI / 2); if (lvl >= 2) pc(S, 'box', lit(o.visor), 0, 3.58, -0.42, 0.72, 0.15, 0.05); }
    else if (h === 'hood') { pc(S, 'dome', mat(0x365314), 0, 3.78, 0.04, 0.5, 0.5, 0.52); for (let i = 0; i < 6; i++) { const a = i * 1.05; pc(S, 'cone', mat(i % 2 ? 0x4d7c0f : 0x3f6212), Math.sin(a) * 0.36, 4.05, Math.cos(a) * 0.36 + 0.05, 0.1, 0.36, 0.1, Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5); } if (lvl >= 2) pc(S, 'box', lit(o.visor), 0, 3.58, -0.42, 0.3, 0.13, 0.05); }
    else if (h === 'beanie') { pc(S, 'dome', mat(0x991b1b), 0, 3.84, 0, 0.44, 0.34, 0.44); pc(S, 'ball', mat(0xfca5a5), 0, 4.2, 0, 0.12); pc(S, 'cyl', steel(0x374151), 0, 3.82, -0.06, 0.45, 0.14, 0.45); if (lvl >= 2) for (const s of [-1, 1]) pc(S, 'cyl', lit(o.visor), 0.16 * s, 3.84, -0.42, 0.1, 0.06, 0.1, Math.PI / 2); }
    else if (h === 'officer') { pc(S, 'cyl', mat(0x1e3a8a), 0, 3.95, 0, 0.5, 0.16, 0.5); pc(S, 'cyl', mat(0x111827), 0, 3.85, 0, 0.44, 0.12, 0.44); pc(S, 'box', mat(0x111827), 0, 3.83, -0.45, 0.6, 0.05, 0.3, 0.2); pc(S, 'gem', lit(GOLD), 0, 3.95, -0.5, 0.1, 0.13, 0.05); }
    else if (h === 'visor') { pc(S, 'ball', steel(lvl >= 4 ? GOLD : 0x312e81), 0, 3.56, 0, 0.5, 0.52, 0.5); pc(S, 'box', lit(o.visor), 0, 3.58, -0.42, 0.74, 0.18, 0.08); pc(S, 'cone', steel(0x6d28d9), 0, 4.15, 0.1, 0.06, 0.4, 0.06, -0.3); }
    else if (h === 'heavy') { pc(S, 'box', steel(lvl >= 4 ? GOLD : 0x374151), 0, 3.56, 0, 0.92, 0.9, 0.9); pc(S, 'box', lit(o.visor), 0, 3.58, -0.46, 0.72, 0.14, 0.04); pc(S, 'box', steel(0x1f2937), 0, 3.3, -0.46, 0.5, 0.2, 0.06); }
  }
  // the arms reach for whatever the figure holds: the right hand at its grip, the left out front
  function arms(S, o, grip, fore) {
    const shirt = mat(o.shirt), skin = mat(SKIN);
    rod(S, [0.68, 2.98, 0], grip, 0.17, shirt); pc(S, 'ball', skin, ...grip, 0.16);
    rod(S, [-0.68, 2.98, 0], fore, 0.17, shirt); pc(S, 'ball', skin, ...fore, 0.16);
  }
  // a gun along -z, in a group that recoils; returns the muzzle (where shots come out, with a flash)
  function gunMount(g, A, x, y, z, flashC, flashW) {
    const G = mover(g, x, y, z), z0 = z, muzzle = new THREE.Object3D(); G.add(muzzle);
    A.push((t, dt, m) => { const k = t - (m.shotAt || -9); G.position.z = z0 + (k < 0.12 ? 0.14 * (1 - k / 0.12) : 0); });
    return { G, muzzle, done: (mz) => { muzzle.position.set(0, mz[1], mz[2]); const f = glowCard('glow', flashC, flashW, flashW, 0, 0, 0, muzzle); f.visible = false; A.push((t, dt, m) => { f.visible = t - (m.shotAt || -9) < 0.07; }); settle(G); return muzzle; } };
  }
  const BUILD = [
    // 🔫 Scout: a quick SMG with a red-dot sight; a second one at level 3
    (g, S, A, lvl, c) => {
      figure(S, { shirt: c, pants: 0x14532d, lvl, head: 'cap', visor: 0xf87171 });
      const smg = (x) => { const m = gunMount(g, A, x, 2.5, -0.62, 0xfff1a8, 0.8), G = m.G, dark = steel(0x30343b);
        pc(G, 'box', dark, 0, 0, -0.25, 0.18, 0.28, 0.8); pc(G, 'cyl', dark, 0, 0.04, -0.85, 0.06, 0.5, 0.06, Math.PI / 2); pc(G, 'box', dark, 0, -0.28, -0.2, 0.12, 0.36, 0.17, 0.2);
        pc(G, 'box', steel(lvl >= 2 ? GOLD : STEEL), 0, 0.17, -0.25, 0.08, 0.06, 0.5); pc(G, 'box', lit(0xff4d4d), 0, 0.2, -0.05, 0.08, 0.08, 0.04);
        return m.done([0, 0.04, -1.12]); };
      const mz = smg(0.3); if (lvl >= 3) smg(-0.3);
      arms(S, { shirt: c }, [0.36, 2.4, -0.5], lvl >= 3 ? [-0.36, 2.4, -0.5] : [0.24, 2.48, -1.0]);
      return mz;
    },
    // 🎯 Sniper: a long rifle with a scope that glints, a bipod and (level 2) a laser sight
    (g, S, A, lvl, c) => {
      figure(S, { shirt: 0x3f6212, pants: 0x283618, lvl, head: 'hood', visor: 0x67e8f9, plate: 0x6b7f4a });
      const m = gunMount(g, A, 0.3, 2.52, -0.5, 0xd9f8ff, 1.0), G = m.G, dark = steel(0x262a30), L = 1.6 + 0.15 * lvl;
      pc(G, 'box', steel(0x5b4636), 0, -0.04, 0.12, 0.16, 0.3, 0.55); pc(G, 'box', dark, 0, 0, -0.45, 0.18, 0.22, 0.8);
      pc(G, 'cyl', dark, 0, 0.03, -0.85 - L / 2, 0.06, L, 0.06, Math.PI / 2); pc(G, 'box', steel(lvl >= 2 ? GOLD : STEEL), 0, 0.03, -0.9 - L, 0.13, 0.13, 0.2);
      pc(G, 'cyl', steel(lvl >= 2 ? GOLD : 0x3b4049), 0, 0.24, -0.45, 0.09, 0.7, 0.09, Math.PI / 2); pc(G, 'cyl', lit(0x67e8f9), 0, 0.24, -0.81, 0.075, 0.02, 0.075, Math.PI / 2);
      glowCard('twinkle', 0xbff6ff, 0.55, 0.55, 0, 0.24, -0.84, G, twinkle(0.55, 0, 1.4));
      rod(G, [0, 0, -1.6], [0.16, -0.5, -1.7], 0.025, dark); rod(G, [0, 0, -1.6], [-0.16, -0.5, -1.7], 0.025, dark);
      if (lvl >= 2) { const laser = pc(G, 'cyl', new THREE.MeshBasicMaterial({ color: 0xff3344, transparent: true, opacity: 0.55 }), 0.1, -0.08, -0.95 - L / 2 - 2.5, 0.015, L + 5, 0.015, Math.PI / 2); laser.userData.fx = true; laser.raycast = () => {}; }
      arms(S, { shirt: 0x3f6212 }, [0.36, 2.42, -0.36], [0.24, 2.5, -1.25]);
      return m.done([0, 0.03, -1.0 - L]);
    },
    // 🪖 Soldier: an assault rifle, sandbags (level 1) and a shoulder rocket pod at max level
    (g, S, A, lvl, c) => {
      figure(S, { shirt: c, pants: 0x3f3f22, lvl, head: 'helmet', visor: 0xfbbf24, plate: 0x7c8a5a });
      const m = gunMount(g, A, 0.3, 2.5, -0.6, 0xffd27a, 0.95), G = m.G, dark = steel(0x2c3036);
      pc(G, 'box', dark, 0, 0, -0.35, 0.2, 0.3, 1.0); pc(G, 'box', steel(0x5b4636), 0, -0.05, 0.25, 0.16, 0.26, 0.4); pc(G, 'cyl', dark, 0, 0.05, -1.05, 0.065, 0.55, 0.065, Math.PI / 2);
      pc(G, 'box', dark, 0, -0.33, -0.4, 0.13, 0.42, 0.2, 0.3); pc(G, 'box', steel(lvl >= 2 ? GOLD : STEEL), 0, 0.02, -0.75, 0.24, 0.2, 0.36);
      if (lvl >= 2) pc(G, 'box', lit(0xff4d4d), 0, 0.2, -0.3, 0.07, 0.07, 0.07);
      if (lvl >= 1) for (let i = 0; i < 7; i++) { const a = Math.PI * 0.35 + i * Math.PI * 0.22; pc(S, 'ball', mat(i % 2 ? 0xc8b07a : 0xb59a63), Math.sin(a) * 1.18, 0.78, Math.cos(a) * 1.18, 0.34, 0.2, 0.24, 0, a); }
      if (lvl >= 4) { pc(S, 'box', steel(GOLD), 0.78, 3.35, 0.05, 0.42, 0.42, 0.7); for (const [x, y] of [[-0.1, 0.1], [0.1, 0.1], [-0.1, -0.1], [0.1, -0.1]]) pc(S, 'cyl', lit(0xff6a3d), 0.78 + x, 3.35 + y, -0.36, 0.06, 0.04, 0.06, Math.PI / 2); }
      arms(S, { shirt: c }, [0.36, 2.4, -0.45], [0.24, 2.5, -1.05]);
      return m.done([0, 0.05, -1.35]);
    },
    // 💣 Demoman: a drum grenade launcher, grenades on a belt, and a lit bomb at his feet (level 2)
    (g, S, A, lvl, c) => {
      figure(S, { shirt: c, pants: 0x292524, lvl, head: 'beanie', visor: 0xff9f43, plate: 0x8a5a44 });
      const m = gunMount(g, A, 0.3, 2.45, -0.6, 0xffa94d, 1.4), G = m.G, dark = steel(0x2f2a28);
      pc(G, 'cyl', dark, 0, 0.05, -0.75, 0.2, 1.0, 0.2, Math.PI / 2); pc(G, 'cyl', steel(lvl >= 2 ? GOLD : 0x6b4f3a), 0, -0.02, -0.3, 0.3, 0.38, 0.3, Math.PI / 2);
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; pc(G, 'cyl', mat(0x3f6212), Math.cos(a) * 0.2, -0.02 + Math.sin(a) * 0.2, -0.3, 0.07, 0.4, 0.07, Math.PI / 2); }
      pc(G, 'thin', steel(lvl >= 2 ? GOLD : STEEL), 0, 0.05, -1.24, 0.22); pc(G, 'box', steel(0x5b4636), 0, -0.1, 0.12, 0.15, 0.24, 0.4);
      if (lvl >= 4) for (let i = 0; i < 3; i++) pc(G, 'box', lit(0xff8c2b), 0, 0.26, -0.55 - i * 0.22, 0.12, 0.03, 0.1);
      for (let i = 0; i < 4; i++) pc(S, 'ball', mat(0x4d7c0f), -0.42 + i * 0.26, 2.95 - i * 0.28, -0.36, 0.12);
      rod(S, [-0.6, 3.1, -0.33], [0.55, 2.0, -0.33], 0.05, steel(0x3a2f28));
      if (lvl >= 2) { pc(S, 'ball', steel(0x1c1c1c), -1.05, 1.0, -0.45, 0.42); pc(S, 'cyl', steel(lvl >= 4 ? GOLD : STEEL), -1.05, 1.42, -0.45, 0.13, 0.12, 0.13); rod(S, [-1.05, 1.48, -0.45], [-0.95, 1.75, -0.5], 0.03, mat(0xd6c08a));
        glowCard('flame', 0xffffff, 0.3, 0.45, -0.95, 1.9, -0.5, g, (o, mm, t) => { o.scale.set(0.28 + 0.06 * Math.sin(t * 23), 0.42 + 0.12 * Math.sin(t * 17), 1); });
        glowCard('twinkle', 0xffc46b, 0.5, 0.5, -0.95, 1.8, -0.5, g, twinkle(0.5, 0, 9)); }
      arms(S, { shirt: c }, [0.36, 2.35, -0.42], [0.22, 2.4, -1.05]);
      return m.done([0, 0.05, -1.3]);
    },
    // 🌾 Farm: a red barn, a silo, wheat, a windmill (level 2) and a golden roof with coins at max level
    (g, S, A, lvl, c) => {
      const gold = lvl >= 4, roof = gold ? steel(GOLD) : mat(0x7f1d1d);
      pc(S, 'box', mat(0xb91c1c), -0.2, 1.3, 0.25, 1.9, 1.5, 1.6);
      pc(S, 'roof', roof, -0.2, 2.05, 0.25, 1.1, 1.0, 1.75);
      for (const [x, w] of [[-0.2, 1.96]]) { pc(S, 'box', mat(0xf8fafc), x, 0.6, -0.56, w, 0.08, 0.04); pc(S, 'box', mat(0xf8fafc), x, 2.03, -0.56, w, 0.08, 0.04); }
      pc(S, 'box', mat(0x7f1d1d), -0.2, 1.05, -0.57, 0.8, 0.95, 0.04); rod(S, [-0.58, 0.6, -0.6], [0.18, 1.5, -0.6], 0.035, mat(0xf8fafc)); rod(S, [0.18, 0.6, -0.6], [-0.58, 1.5, -0.6], 0.035, mat(0xf8fafc));
      pc(S, 'box', lit(0xffe9a8), -0.2, 1.75, -0.57, 0.3, 0.26, 0.04);
      pc(S, 'cyl', steel(0xd1d5db), 1.15, 1.6, 0.55, 0.42, 2.1, 0.42); pc(S, 'dome', steel(lvl >= 2 ? GOLD : 0x9ca3af), 1.15, 2.65, 0.55, 0.44);
      for (let i = 0; i < 3; i++) pc(S, 'thin', steel(STEEL), 1.15, 0.9 + i * 0.6, 0.55, 0.43, 0.43, 0.43, Math.PI / 2);
      for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { const x = -1.0 + i * 0.55, z = -1.05 - r * 0.38; pc(S, 'cone', mat(0xd4a017), x, 0.95, z, 0.12, 0.6, 0.12); pc(S, 'cyl', mat(0x65a30d), x, 0.68, z, 0.035, 0.3, 0.035); }
      if (lvl >= 1) for (let i = 0; i < 5; i++) { const x = -1.35 + i * 0.6; pc(S, 'box', mat(0xe7d3a8), x, 0.78, -1.55, 0.08, 0.45, 0.08); } if (lvl >= 1) pc(S, 'box', mat(0xe7d3a8), -0.15, 0.88, -1.55, 2.5, 0.06, 0.05);
      if (lvl >= 2) {
        pc(S, 'cyl', steel(0xe5e7eb), -1.1, 1.9, 1.15, 0.12, 2.8, 0.12);
        const blades = mover(g, -1.1, 3.25, 1.3);
        for (let i = 0; i < 4; i++) { const b = new THREE.Group(); b.rotation.z = i * Math.PI / 2; blades.add(b); pc(b, 'box', mat(0xf8fafc), 0, 0.55, 0, 0.18, 1.0, 0.04); pc(b, 'box', steel(lvl >= 4 ? GOLD : STEEL), 0, 0.1, 0, 0.05, 0.25, 0.05); }
        pc(blades, 'ball', steel(lvl >= 4 ? GOLD : 0x6b7280), 0, 0, 0, 0.12);
        const tmp = new THREE.Group(); blades.children.slice().forEach((o) => tmp.add(o)); blades.add(bake(tmp));
        A.push((t, dt) => { blades.rotation.z -= dt * 2.2; });
      }
      if (lvl >= 3) { pc(S, 'box', mat(0x15803d), 1.0, 0.8, -0.95, 0.7, 0.4, 0.45); pc(S, 'cyl', mat(0x111827), 0.75, 0.68, -0.95, 0.2, 0.12, 0.2, 0, 0, Math.PI / 2); pc(S, 'cyl', mat(0x111827), 1.3, 0.72, -0.95, 0.26, 0.14, 0.26, 0, 0, Math.PI / 2); pc(S, 'box', lit(0xfff3b0), 0.66, 0.85, -0.95, 0.04, 0.08, 0.3); }
      if (gold) for (let i = 0; i < 3; i++) { const coin = glowCard('glow', 0xffd34d, 0.45, 0.45, 0.2 * i - 0.2, 3, 0.2, g); A.push((t) => { const k = (t * 0.45 + i / 3) % 1; coin.position.y = 2.6 + k * 2.2; coin.material.opacity = Math.sin(k * Math.PI); }); }
      return null;
    },
    // 🧊 Freezer: a pillar of ice with a frost cannon, crystals round it and a crystal floating on top
    (g, S, A, lvl, c) => {
      pc(S, 'hex', steel(0xe0f2fe), 0, 0.9, 0, 0.75, 0.7, 0.75);
      pc(S, 'thin', steel(lvl >= 2 ? GOLD : STEEL), 0, 1.25, 0, 0.78, 0.78, 0.78, Math.PI / 2);
      const n = lvl >= 1 ? 6 : 4;
      for (let i = 0; i < n; i++) { const a = i * Math.PI * 2 / n + 0.3; pc(S, 'gem', ice(), Math.sin(a) * 0.95, 1.2, Math.cos(a) * 0.95, 0.22, 0.6, 0.22, Math.cos(a) * 0.45, 0, -Math.sin(a) * 0.45); }
      pc(S, 'gem', ice(), 0, 2.55, 0, 0.55, 1.5, 0.55);
      glowCard('glow', 0x7dd3fc, 2.4, 3.2, 0, 2.55, 0, g, (o, m, t) => { m.opacity = 0.5 + 0.15 * Math.sin(t * 3); });
      const m = gunMount(g, A, 0, 2.3, -0.4, 0xbff6ff, 1.1), G = m.G;
      pc(G, 'cyl', steel(0xe5e7eb), 0, 0, -0.35, 0.18, 0.75, 0.18, Math.PI / 2); pc(G, 'ring', lit(0x67e8f9), 0, 0, -0.75, 0.2); pc(G, 'cone', steel(lvl >= 2 ? GOLD : STEEL), 0, 0, -0.85, 0.14, 0.22, 0.14, -Math.PI / 2);
      const top = mover(g, 0, 4.25, 0);
      pc(top, 'gem', ice(), 0, 0, 0, 0.3, 0.55, 0.3); settle(top);
      glowCard('glow', 0xa5f3fc, 1.4, 1.4, 0, 0, 0, top);
      A.push((t) => { top.position.y = 4.25 + Math.sin(t * 1.8) * 0.18; top.rotation.y = t * 1.2; });
      if (lvl >= 2) { const fl = mover(g, 0, 0, 0), k = lvl >= 4 ? 4 : 2; for (let i = 0; i < k; i++) glowCard('twinkle', 0xd5f6ff, 0.6, 0.6, Math.sin(i * 6.28 / k) * 1.35, 2.2 + (i % 2) * 1.2, Math.cos(i * 6.28 / k) * 1.35, fl, twinkle(0.6, i * 1.3, 2)); A.push((t) => { fl.rotation.y = -t * 0.7; }); }
      if (lvl >= 3) pc(S, 'ring', lit(0x7dd3fc), 0, 1.75, 0, 1.1, 1.1, 1.1, Math.PI / 2);
      return m.done([0, 0, -0.95]);
    },
    // 🚩 Commander: an officer with a peaked cap, a cape and a banner that waves; a ring that shows the buff
    (g, S, A, lvl, c) => {
      figure(S, { shirt: 0x1e3a8a, pants: 0x111827, lvl, head: 'officer', visor: 0x93c5fd, plate: 0x8fa3c4 });
      for (const s of [-1, 1]) { pc(S, 'box', steel(GOLD), 0.62 * s, 3.12, 0, 0.36, 0.08, 0.5); for (let i = 0; i < 3; i++) pc(S, 'cyl', steel(GOLD), 0.62 * s + (i - 1) * 0.1, 3.02, -0.2, 0.025, 0.16, 0.025); }
      rod(S, [-0.55, 3.05, -0.33], [0.55, 1.95, -0.33], 0.06, steel(GOLD));
      pc(S, 'box', mat(0x991b1b), 0, 2.35, 0.42, 1.15, 1.7, 0.06, 0.12);
      arms(S, { shirt: 0x1e3a8a }, [0.75, 2.55, -0.75], [-0.85, 2.4, -0.15]);
      rod(S, [-0.9, 0.6, -0.15], [-0.9, 5.3, -0.15], 0.06, steel(lvl >= 2 ? GOLD : STEEL)); pc(S, 'ball', steel(GOLD), -0.9, 5.36, -0.15, 0.13);
      const flag = mover(g, -0.9, 4.75, -0.15);
      pc(flag, 'box', mat(c), 0, 0, 0.62, 0.05, 0.75, 1.2); pc(flag, 'box', steel(GOLD), 0, 0.33, 0.62, 0.06, 0.08, 1.2); pc(flag, 'gem', lit(0xfde047), 0.04, 0, 0.62, 0.18, 0.22, 0.04, 0, Math.PI / 2);
      settle(flag);
      A.push((t) => { flag.rotation.y = Math.sin(t * 2.6) * 0.3; });
      const aura = pc(g, 'ring', new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.7, depthWrite: false }), 0, 0.68, 0, 1.62, 1.62, 1.62, Math.PI / 2); aura.userData.fx = true; aura.raycast = () => {};
      A.push((t) => { const k = (Math.sin(t * 2.2) + 1) / 2; aura.scale.setScalar(1.55 + k * 0.25); aura.material.opacity = 0.35 + 0.45 * (1 - k); });
      return null;
    },
    // ⚙️ Minigunner: heavy armour and six barrels that spin up when it fires, fed by an ammo belt
    (g, S, A, lvl, c) => {
      figure(S, { shirt: c, pants: 0x1f2937, lvl, head: 'heavy', visor: 0xff3b3b, plate: 0x6b7280 });
      const m = gunMount(g, A, 0.32, 2.4, -0.55, 0xffd27a, 1.1), G = m.G, dark = steel(0x2b2f36);
      pc(G, 'cyl', dark, 0, 0, -0.25, 0.3, 0.7, 0.3, Math.PI / 2); pc(G, 'box', dark, 0, 0.32, -0.2, 0.12, 0.2, 0.5);
      const spin = mover(G, 0, 0, -0.9);
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; pc(spin, 'cyl', steel(lvl >= 2 ? GOLD : 0x4b5563), Math.cos(a) * 0.15, Math.sin(a) * 0.15, -0.2, 0.05, 1.2, 0.05, Math.PI / 2); }
      pc(spin, 'thin', steel(STEEL), 0, 0, -0.65, 0.22); pc(spin, 'thin', steel(STEEL), 0, 0, 0.25, 0.22); settle(spin);
      A.push((t, dt, m) => { spin.rotation.z += dt * (t - (m.shotAt || -9) < 0.6 ? 26 : 1.2); });
      pc(S, 'box', steel(lvl >= 4 ? GOLD : 0x4b5320), 0, 2.55, 0.5, 0.9, 0.95, 0.42); pc(S, 'box', lit(0xfde047), 0, 2.95, 0.72, 0.5, 0.06, 0.02);
      for (let i = 0; i < 6; i++) pc(S, 'box', steel(GOLD), 0.55 + i * 0.02, 2.2 - i * 0.04, 0.38 - i * 0.16, 0.08, 0.14, 0.06, 0, 0, 0.4);
      arms(S, { shirt: c }, [0.36, 2.3, -0.4], [0.22, 2.45, -0.85]);
      return m.done([0, 0, -1.55]);
    },
    // 🏹 Ranger: an energy railgun with glowing coils and a crystal tip, and rings floating round it
    (g, S, A, lvl, c) => {
      figure(S, { shirt: 0x1e1b4b, pants: 0x0f0d24, lvl, head: 'visor', visor: 0xc084fc, plate: 0x4c3a8f });
      const m = gunMount(g, A, 0.3, 2.5, -0.55, 0xd8b4fe, 1.5), G = m.G, dark = steel(0x1e1b4b);
      pc(G, 'box', dark, 0, 0, -0.35, 0.22, 0.32, 1.0); pc(G, 'box', steel(lvl >= 2 ? GOLD : 0x6d28d9), 0, 0.2, -0.35, 0.1, 0.08, 0.9);
      pc(G, 'box', dark, 0.09, 0, -1.45, 0.06, 0.12, 1.4); pc(G, 'box', dark, -0.09, 0, -1.45, 0.06, 0.12, 1.4);
      for (let i = 0; i < 4; i++) pc(G, 'thin', lit(0xc084fc), 0, 0, -0.95 - i * 0.32, 0.2);
      pc(G, 'cyl', lit(0xe9d5ff), 0, 0, -1.45, 0.03, 1.3, 0.03, Math.PI / 2); pc(G, 'gem', lit(0xf0abfc), 0, 0, -2.25, 0.12, 0.2, 0.12, Math.PI / 2);
      glowCard('glow', 0xc084fc, 1.0, 1.0, 0, 0, -1.45, G, (o, mm, t) => { mm.opacity = 0.45 + 0.2 * Math.sin(t * 5); });
      pc(S, 'box', steel(0x312e81), 0, 2.55, 0.42, 0.8, 0.9, 0.25); pc(S, 'box', lit(0xc084fc), 0, 2.55, 0.56, 0.1, 0.7, 0.02);
      if (lvl >= 2) { const rings = mover(g, 0, 2.6, 0); pc(rings, 'thin', lit(0xa78bfa), 0, 0, 0, 1.55, 1.55, 1.55, Math.PI / 2); pc(rings, 'thin', lit(0xe879f9), 0, 0, 0, 1.3, 1.3, 1.3, Math.PI / 2 + 0.6); settle(rings); A.push((t) => { rings.rotation.y = t * 0.8; rings.rotation.z = Math.sin(t * 0.7) * 0.25; }); }
      if (lvl >= 3) { const cr = mover(g, -0.95, 4.2, 0.3); pc(cr, 'gem', lit(0xe9d5ff), 0, 0, 0, 0.2, 0.36, 0.2); settle(cr); glowCard('glow', 0xc084fc, 0.9, 0.9, 0, 0, 0, cr); A.push((t) => { cr.position.y = 4.2 + Math.sin(t * 2) * 0.15; cr.rotation.y = t * 2; }); }
      arms(S, { shirt: 0x1e1b4b }, [0.36, 2.4, -0.42], [0.24, 2.5, -1.05]);
      return m.done([0, 0, -2.3]);
    },
  ];
  // a tower: the stand, its build, gold and an aura at max level; userData.anim moves it, userData.muzzle is where shots start
  function towerModel(t, lvl, ownerCol) {
    const d = TW[t], g = new THREE.Group(), S = new THREE.Group(), A = [];
    pedestal(S, lvl, ownerCol);
    const muzzle = BUILD[t](g, S, A, lvl, d.c);
    if (lvl >= 4) maxFx(g, A, d.c, 2.2);
    g.add(bake(S));
    g.userData.anim = (time, dt, m) => { for (const f of A) f(time, dt, m); };
    g.userData.muzzle = muzzle;
    return g;
  }
  // (a tower's own shapes go when it does; the shared ones stay)
  const dropModel = (g) => { place.remove(g); g.traverse((o) => { if (o.userData.baked) o.geometry.dispose(); }); };
  const OWN_COL = [0x3b82f6, 0xef4444, 0x22c55e, 0xf59e0b];

  const TDS = {
    noLock: true, // (you look down on the map)
    id: 'tds', code: 'ts', genre: 'Tower Defense', rank: 3, name: 'Tower Defense Simulator', emoji: '🗼', max: 4, stat: 'Cash', killY: -30, banner: true, camDist: 40, camClip: false,
    land: { theme: 'forest', fence: 'wood' },
    color: 'linear-gradient(135deg,#334155,#16a34a)',
    desc: 'Co-op tower defense for up to 4. Vote a difficulty, then place Scouts, Snipers, Demomen, Farms and more along the path and upgrade them. Hidden, armored and boss enemies; unlock more towers with Blox Coins.',
    welcome: 'Vote a difficulty and get ready!',
    build() {
      sky('#93c5fd', '#e0f2fe');
      slab(0, 0, 0, 200, 160, 0x4d7c0f, { sy: 2 });
      for (let i = 1; i < PATH.length; i++) { const [ax, az] = PATH[i - 1], [bx2, bz] = PATH[i]; part({ x: (ax + bx2) / 2, y: 0.08, z: (az + bz) / 2, sx: Math.abs(bx2 - ax) + 7, sy: 0.16, sz: Math.abs(bz - az) + 7, c: 0xd6c08a, plain: true }); }
      // the enemies' portal and your base
      const [sx, sz] = PATH[0], [ex, ez] = PATH[PATH.length - 1];
      part({ x: sx - 2, y: 4, z: sz, sx: 1, sy: 8, sz: 8, c: 0x581c87, neon: true, solid: false });
      slab(ex + 4, 0.1, ez, 12, 14, 0x9ca3af, { sy: 0.2 });
      part({ x: ex + 5, y: 4, z: ez, sx: 6, sy: 8, sz: 10, c: 0x6b7280 });
      for (const dz of [-5, 5]) part({ x: ex + 5, y: 6, z: ez + dz, sx: 3, sy: 12, sz: 3, c: 0x4b5563 });
      const l = label('🏰 BASE', { size: 2 }); l.position.set(ex + 5, 13, ez); place.add(l);
      // some trees where you can't build
      const r = mulberry(55);
      for (let i = 0; i < 26; i++) { const x = (r() - 0.5) * 190, z = (r() - 0.5) * 150; if (distToPath(x, z) < 12 || Math.abs(z - 62) < 10) continue; part({ x, y: 2, z, sx: 1, sy: 4, sz: 1, c: 0x92400e, plain: true }); part({ x, y: 5, z, sx: 4, sy: 3.5, sz: 4, c: 0x166534 }); }
      this.views = new Map(); this.tviews = new Map(); this.fx = []; this.sndOn = false; this.sndHp = null; this.sndPh = null;
      this.ghost = null; this.ring = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, ...DECAL }));
      this.ring.rotation.x = -Math.PI / 2; this.ring.visible = false; place.add(this.ring);
      this.disc = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false, ...DECAL }));
      this.disc.rotation.x = -Math.PI / 2; this.disc.visible = false; place.add(this.disc);
    },
    pres() { return { tq: [], vt: 'normal', rdy: 0, wc: 0 }; },
    async enter() {
      Object.assign(this, { H: null, lastG: null, gSeen: null, q: [], qn: 0, placing: null, selT: null, vote: 'normal', ready: false, lobbyShown: false, lastPh: null });
      const s = await kvGet('ts');
      this.save = Object.assign({ unlocked: [0, 1, 2, 3, 4], loadout: [0, 1, 2, 3, 4], wins: 0 }, s || {});
      this.save.loadout = this.save.loadout.filter((t) => TW[t] && this.save.unlocked.includes(t)).slice(0, 5);
      send({ wc: hasItem('chest') ? 1 : 0 }); // (the host gives a War Chest's cash at the start)
      this.drawBar();
    },
    spawn() { return [(Math.random() - 0.5) * 20, 0.5, 62, 0]; },
    // ------------------------------------------------ pausing (anyone can, between and during waves; anyone can carry on)
    canPause() { const g = this.g; return !!g && (g.ph === 'break' || g.ph === 'wave'); },
    pausedBy() { const g = this.g; return this.canPause() && typeof g.pz === 'string' ? g.pz : ''; },
    setPause(on) { this.ask('pz', on ? 1 : 0); },
    // ------------------------------------------------ asking the host
    ask(op, ...args) {
      if (iAmHost() && this.H) return this.apply(myPeer(), [op, ...args]);
      this.q.push([++this.qn, op, ...args]); if (this.q.length > 12) this.q.shift();
      send({ tq: this.q.slice() });
    },
    // ------------------------------------------------ the host's game
    adopt() {
      const g = this.lastG;
      if (g && g.ph !== 'lobby') { const H = this.unpack(g); H.seen = {}; return H; }
      return { ph: 'lobby', left: 25, gs: 0, diff: 'normal', wave: 0, hp: 0, e: [], tw: [], cash: {}, pl: [], nid: 1, tid: 1, q: [], spawnT: 0, fx: [], seen: {}, res: '' };
    },
    unpack(g) {
      // the host left: carry on from what everyone last saw
      const e = []; const es = typeof g.e === 'string' ? g.e : '';
      for (let i = 0; i + 6 < es.length + 1; i += 7) { const t = AL.indexOf(es[i]), id = d2(es, i + 1), s = d2(es, i + 3) / 4, hpF = AL.indexOf(es[i + 5]) / 63; if (EN[t]) e.push({ id, t, s, hp: Math.max(1, hpF * this.hpOf(t, g.wave, g.diff)), max: this.hpOf(t, g.wave, g.diff), slow: 0, slowT: 0 }); }
      return { pz: typeof g.pz === 'string' ? g.pz : '', ph: g.ph, left: +g.left || 5, gs: g.gs || 0, diff: g.diff, wave: g.wave | 0, hp: +g.hp || 1, e, tw: (g.tw || []).map((w) => ({ id: w[0], o: w[1], t: w[2], x: w[3], z: w[4], lvl: w[5], tg: w[6] || 0, cd: 0 })), cash: Object.assign({}, g.cash || {}), pl: (g.pl || []).slice(), nid: 1 + Math.max(0, ...e.map((x) => x.id)), tid: 1 + Math.max(0, ...(g.tw || []).map((w) => w[0])), q: [], spawnT: 0, fx: [], res: g.res || '' };
    },
    hpOf(t, wave, diff) { return EN[t].hp * (1 + (wave - 1) * 0.1) * (DIFF[diff] || DIFF.normal).hp * (EN[t].boss ? 1 + wave * 0.03 : 1); },
    chest(p) { return (p.me ? hasItem('chest') : p.pr && p.pr.wc === 1) ? 300 : 0; }, // a War Chest: more cash to start with
    ownerIdx(H, peer) { let i = H.pl.indexOf(peer); if (i < 0) { i = H.pl.length; H.pl.push(peer); } return i; },
    apply(peer, req) {
      const H = this.H, [op, ...a] = req, oi = this.ownerIdx(H, peer);
      if (H.ph === 'lobby') return;
      const cash = H.cash[peer] || 0;
      if (op === 'place') {
        const [t, x, z] = a, d = TW[t];
        if (!d || cash < d.price || !this.canPlace(x, z) || H.tw.filter((w) => w.o === oi && w.t === t).length >= d.limit) return;
        H.cash[peer] = cash - d.price; H.tw.push({ id: H.tid++, o: oi, t, x: +(+x).toFixed(1), z: +(+z).toFixed(1), lvl: 0, tg: 0, cd: 0, spent: d.price });
      } else if (op === 'up') {
        const w = H.tw.find((q) => q.id === a[0]); if (!w || w.o !== oi || w.lvl >= 4) return;
        const c = TW[w.t].up[w.lvl]; if (cash < c) return; H.cash[peer] = cash - c; w.lvl++; w.spent = (w.spent || TW[w.t].price) + c;
      } else if (op === 'sell') {
        const i = H.tw.findIndex((q) => q.id === a[0]); if (i < 0 || H.tw[i].o !== oi) return;
        H.cash[peer] = cash + Math.floor((H.tw[i].spent || TW[H.tw[i].t].price) / 3); H.tw.splice(i, 1);
      } else if (op === 'tgt') { const w = H.tw.find((q) => q.id === a[0]); if (w && w.o === oi) w.tg = (a[1] | 0) % 4; }
      else if (op === 'skip') { if (H.ph === 'break') H.skip = (H.skip || new Set()).add(peer); }
      else if (op === 'pz') { if (H.ph === 'break' || H.ph === 'wave') H.pz = a[0] ? peer : ''; }
      else if (op === 'bonus' && H.ph !== 'end') H.cash[peer] = cash + 250; // 💸 from the shop
      else if (op === 'heal' && H.ph !== 'end') H.hp = Math.min((DIFF[H.diff] || DIFF.normal).base, H.hp + 50);
    },
    canPlace(x, z, H) {
      H = H || this.H || this.g;
      if (!(Math.abs(x) < 92 && Math.abs(z) < 72) || distToPath(x, z) < 5.2 || Math.abs(z - 62) < 6 && Math.abs(x) < 14) return false;
      const tw = H ? (H.tw || []).map((w) => (Array.isArray(w) ? { x: w[3], z: w[4] } : w)) : [];
      if (tw.some((w) => Math.hypot(w.x - x, w.z - z) < 3.6)) return false;
      return !parts.some((p) => p.sy >= 3 && Math.abs(p.x - x) < p.sx / 2 + 1.6 && Math.abs(p.z - z) < p.sz / 2 + 1.6 && p.y < 8);
    },
    host(dt) {
      // real time, not the frame's step (that's capped, so a slow computer would slow the game down for everyone)
      const t = performance.now(); dt = this.hostT && t - this.hostT < 2000 ? (t - this.hostT) / 1000 : dt; this.hostT = t;
      const H = this.H, pl = players(), here = new Set(pl.map((p) => p.peer));
      // requests from everyone
      for (const p of pl) {
        if (p.me) continue;
        const seen = H.seen[p.peer] || { t: 0, n: 0 };
        if (p.pr.t !== seen.t) { seen.t = p.pr.t; seen.n = 0; }
        for (const r of Array.isArray(p.pr.tq) ? p.pr.tq : []) { if (!Array.isArray(r) || !(r[0] > seen.n)) continue; seen.n = r[0]; this.apply(p.peer, r.slice(1)); }
        H.seen[p.peer] = seen;
      }
      if (H.pz && (!here.has(H.pz) || (H.ph !== 'break' && H.ph !== 'wave'))) H.pz = ''; // (whoever paused has gone: carry on)
      if (H.pz) dt = 0; // paused: the countdown and the wave wait (towers can still go up)
      H.left = Math.max(0, H.left - dt);
      if (H.ph === 'lobby') {
        const ready = pl.filter((p) => (p.me ? this.ready : p.pr.rdy)).length;
        if (ready === pl.length && pl.length && H.left > 3) H.left = 3;
        if (H.left <= 0) {
          const votes = {}; for (const p of pl) { const v = p.me ? this.vote : p.pr.vt; if (DIFF[v]) votes[v] = (votes[v] || 0) + 1; }
          H.diff = Object.keys(votes).sort((a, b) => votes[b] - votes[a])[0] || 'normal';
          const D = DIFF[H.diff];
          Object.assign(H, { ph: 'break', left: 10, wave: 0, hp: D.base, e: [], tw: [], cash: {}, pl: [], q: [], fx: [], res: '' });
          for (const p of pl) { H.cash[p.peer] = D.cash + this.chest(p); this.ownerIdx(H, p.peer); }
        }
      } else if (H.ph === 'break') {
        for (const p of pl) if (H.cash[p.peer] == null) { H.cash[p.peer] = DIFF[H.diff].cash + this.chest(p); this.ownerIdx(H, p.peer); }
        if (H.skip && [...H.skip].filter((x) => here.has(x)).length * 2 > pl.length) H.left = 0;
        if (H.left <= 0) { H.skip = null; H.wave++; H.q = waveList(H.wave, DIFF[H.diff].waves); H.spawnT = 0; H.ph = 'wave'; }
      } else if (H.ph === 'wave') for (let k = Math.ceil(dt / 0.1), i = 0; i < k && H.ph === 'wave'; i++) this.sim(H, dt / k); // in small steps
      else if (H.ph === 'end' && H.left <= 0) { Object.assign(H, { ph: 'lobby', left: 25, e: [], tw: [], res: '' }); }
      if (!pl.length) return;
      if (performance.now() - (this.sentAt || 0) > 150) { this.sentAt = performance.now(); this.publish(H); }
    },
    sim(H, dt) {
      const D = DIFF[H.diff];
      // spawning
      H.spawnT -= dt;
      while (H.q.length && H.spawnT <= 0) { const [t, gap] = H.q.shift(); const max = this.hpOf(t, H.wave, H.diff); H.e.push({ id: H.nid++ % 4000, t, s: 0, hp: max, max, slow: 0, slowT: 0 }); H.spawnT += gap; }
      // walking
      for (let i = H.e.length - 1; i >= 0; i--) {
        const e = H.e[i]; e.slowT = Math.max(0, e.slowT - dt); if (!e.slowT) e.slow = 0;
        e.s += EN[e.t].sp * (1 - e.slow) * dt;
        if (e.s >= LEN) { H.hp -= EN[e.t].dmg; H.e.splice(i, 1); }
      }
      if (H.hp <= 0) { H.hp = 0; H.ph = 'end'; H.left = 12; H.res = 'lose'; return; }
      // the towers
      const pos = H.e.map((e) => posAt(e.s));
      const cmd = H.tw.filter((w) => w.t === 6);
      for (const w of H.tw) {
        const d = TW[w.t];
        if (!d.dmg) continue;
        let buff = 0; for (const c of cmd) if (Math.hypot(c.x - w.x, c.z - w.z) < TW[6].range[c.lvl]) buff = Math.max(buff, TW[6].buff[c.lvl]);
        w.cd -= dt * (1 + buff);
        if (w.cd > 0) continue;
        const range = d.range[w.lvl], seesHidden = w.lvl >= d.hid;
        let best = -1, bv = -1e9;
        H.e.forEach((e, i) => {
          if (EN[e.t].hidden && !seesHidden) return;
          const dd = Math.hypot(pos[i][0] - w.x, pos[i][1] - w.z); if (dd > range) return;
          const v = w.tg === 0 ? e.s : w.tg === 1 ? -e.s : w.tg === 2 ? e.hp : -dd;
          if (v > bv) { bv = v; best = i; }
        });
        if (best < 0) continue;
        w.cd = 1 / d.rate[w.lvl];
        const hit = (i, dmg) => {
          const e = H.e[i]; if (!e) return;
          e.hp -= dmg * (EN[e.t].armor && d.dmg[w.lvl] < 6 ? EN[e.t].armor : 1);
          if (d.slow) { e.slow = Math.max(e.slow, d.slow[w.lvl]); e.slowT = 2; }
        };
        if (d.splash) { const c = pos[best]; H.e.forEach((e, i) => { if (Math.hypot(pos[i][0] - c[0], pos[i][1] - c[1]) < d.splash[w.lvl] && !(EN[e.t].hidden && !seesHidden)) hit(i, d.dmg[w.lvl]); }); }
        else hit(best, d.dmg[w.lvl]);
        H.fx.push([w.id, Math.round(H.e[best].s * 4)]); if (H.fx.length > 14) H.fx.shift();
        // the dead
        for (let i = H.e.length - 1; i >= 0; i--) {
          const e = H.e[i]; if (e.hp > 0) continue;
          const owner = H.pl[w.o]; if (owner) H.cash[owner] = (H.cash[owner] || 0) + EN[e.t].cash;
          if (EN[e.t].split) for (let k = 0; k < 2; k++) { const max = this.hpOf(1, H.wave, H.diff), s = Math.max(0, e.s - k * 1.5); H.e.push({ id: H.nid++ % 4000, t: 1, s, hp: max, max, slow: 0, slowT: 0 }); pos.push(posAt(s)); } // (the towers after this one can see them too)
          H.e.splice(i, 1); pos.splice(i, 1);
        }
      }
      // the wave is over
      if (!H.q.length && !H.e.length) {
        const bonus = 100 + H.wave * 25;
        for (const peer of Object.keys(H.cash)) H.cash[peer] += bonus;
        for (const w of H.tw) if (w.t === 4) { const owner = H.pl[w.o]; if (owner) H.cash[owner] = (H.cash[owner] || 0) + TW[4].income[w.lvl]; }
        if (H.wave >= D.waves) { H.ph = 'end'; H.left = 12; H.res = 'win'; }
        else { H.ph = 'break'; H.left = 8; }
      }
    },
    publish(H) {
      let es = '';
      for (const e of H.e.slice(0, 90)) es += AL[e.t] + n2(e.id) + n2(Math.min(4095, Math.round(e.s * 4))) + AL[clamp(Math.round((e.hp / e.max) * 63), 0, 63)] + AL[e.slow ? 1 : 0];
      const cash = {}; for (const k in H.cash) cash[k] = Math.floor(H.cash[k]);
      const tw = H.tw.map((w) => [w.id, w.o, w.t, w.x, w.z, w.lvl, w.tg]);
      H.gs = (H.gs || 0) + 1;
      send({ g: { ph: H.ph, left: +H.left.toFixed(1), gs: H.gs, pz: H.pz || '', diff: H.diff, wave: H.wave, hp: H.hp, e: es, tw, cash, pl: H.pl, fx: H.fx.slice(), res: H.res, waves: DIFF[H.diff].waves } });
    },
    // ------------------------------------------------ what everyone sees
    tick(dt) {
      const g = this.g = roundState(this);
      this.drawWorld(g, dt);
      this.drawUI(g);
      if (g && g.ph === 'end' && this.lastPh && this.lastPh !== 'end') this.finish(g);
      if (g && g.ph !== 'lobby') this.lobbyShown = false;
      if (g) this.lastPh = g.ph;
    },
    view(g) {
      // the host has objects; everyone else has the packed form
      if (!g) return { e: [], tw: [] };
      if (Array.isArray(g.e)) return { e: g.e.map((e) => ({ id: e.id, t: e.t, s: e.s, f: e.hp / e.max, slow: e.slow })), tw: g.tw.map((w) => ({ id: w.id, o: w.o, t: w.t, x: w.x, z: w.z, lvl: w.lvl, tg: w.tg })), fx: g.fx };
      const e = [], es = typeof g.e === 'string' ? g.e : '';
      for (let i = 0; i + 6 < es.length + 1; i += 7) { const t = AL.indexOf(es[i]); if (!EN[t]) continue; e.push({ t, id: d2(es, i + 1), s: d2(es, i + 3) / 4, f: AL.indexOf(es[i + 5]) / 63, slow: es[i + 6] === 'B' }); }
      return { e, tw: (g.tw || []).filter(Array.isArray).map((w) => ({ id: w[0], o: w[1], t: w[2], x: +w[3], z: +w[4], lvl: w[5], tg: w[6] })), fx: g.fx || [] };
    },
    drawWorld(g, dt) {
      const v = this.view(g), keep = new Set();
      for (const e of v.e) {
        keep.add(e.id);
        let m = this.views.get(e.id);
        if (!m || m.t !== e.t) { if (m) place.remove(m.g); m = { g: enemyModel(e.t), t: e.t, s: e.s }; place.add(m.g); this.views.set(e.id, m); }
        // slide along the path between updates
        const sp = EN[e.t].sp * (e.slow ? 0.6 : 1);
        m.s = g && g.pz ? e.s : Math.abs(m.s - e.s) > 8 ? e.s : m.s + sp * dt + (e.s - m.s) * Math.min(1, dt * 4); // (paused: right where the host has them)
        if (m.lastS !== e.s) { m.lastS = e.s; m.s += (e.s - m.s) * 0.5; }
        const [x, z, yaw] = posAt(m.s); m.g.position.set(x, 0.1, z); m.g.rotation.y = yaw;
        m.g.userData.bar.scale.x = 1.6 * clamp(e.f, 0.02, 1); m.g.userData.bar.position.x = -(1 - clamp(e.f, 0, 1)) * 0.8;
        m.g.userData.bar.material.color.set(e.f > 0.5 ? 0x22c55e : e.f > 0.25 ? 0xfacc15 : 0xef4444);
        const walk = Math.sin(performance.now() / 120 + e.id) * 0.4; m.g.children[0].rotation.x = walk; m.g.children[1].rotation.x = -walk;
        if (EN[e.t].hidden) m.g.children.forEach((c) => { if (c.material && !c.material.transparent) { c.material = c.material.clone(); c.material.transparent = true; c.material.opacity = 0.45; } });
      }
      for (const [id, m] of this.views) if (!keep.has(id)) { place.remove(m.g); this.views.delete(id); puffAt(m.g.position.x, 2, m.g.position.z, EN[m.t].c, 5); if (this.sndOn) sfx3('pop', m.g.position.x, m.g.position.z, 140, { vol: 0.5, gap: 50 }); }
      // towers
      const tk = new Set(), tNow = performance.now() / 1000;
      for (const w of v.tw) {
        tk.add(w.id);
        const sig = w.t + ':' + w.lvl + ':' + w.o;
        let m = this.tviews.get(w.id);
        if (!m || m.sig !== sig) {
          if (this.sndOn) { const mine = w.o === this.myIdx(g); if (!m) sfx3('place', w.x, w.z, 140); else if (m.w.lvl !== w.lvl) { if (mine) sfx('levelup'); else sfx3('select', w.x, w.z, 140); } }
          if (m) dropModel(m.g); m = { g: towerModel(w.t, w.lvl, OWN_COL[w.o % 4]), sig, w, shotAt: m && m.shotAt }; m.g.position.set(w.x, 0, w.z); m.g.traverse((o) => (o.userData.tid = w.id)); place.add(m.g); this.tviews.set(w.id, m); }
        m.w = w;
        m.g.userData.anim(tNow, dt, m); // (barrels spin, flags wave, crystals float, guns kick back)
      }
      for (const [id, m] of this.tviews) if (!tk.has(id)) { dropModel(m.g); this.tviews.delete(id); if (this.sndOn) sfx3('sell', m.w.x, m.w.z, 140, { vol: m.w.o === this.myIdx(g) ? 1 : 0.4 }); }
      // shots
      const fsig = JSON.stringify(v.fx || []);
      if (fsig !== this.fxSig) {
        const old = new Set((this.fxOld || []).map((f) => f.join()));
        for (const f of v.fx || []) {
          if (old.has(f.join())) continue;
          const m = this.tviews.get(f[0]); if (!m) continue;
          const [x, z] = posAt(f[1] / 4), t = m.w.t, from = new THREE.Vector3(m.w.x, 2.6, m.w.z), to = new THREE.Vector3(x, 2, z);
          m.g.rotation.y = Math.atan2(-(x - m.w.x), -(z - m.w.z)); m.shotAt = performance.now() / 1000;
          if (m.g.userData.muzzle) { m.g.updateMatrixWorld(true); m.g.userData.muzzle.getWorldPosition(from); } // (from the end of the barrel)
          if (this.sndOn) { const snd = SHOT_SND[t]; if (snd) sfx3(snd[0], m.w.x, m.w.z, 150, snd[1]); }
          if (t === 3) puffAt(x, 1.5, z, [0xf97316, 0x444444], 8); else if (t === 5) puffAt(x, 2, z, 0xa5f3fc, 4);
          const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, to]), new THREE.LineBasicMaterial({ color: [0xfff1a8, 0x9beaff, 0xffd27a, 0xffa94d, 0xffffff, 0xbff6ff, 0xffffff, 0xffe08a, 0xd8b4fe][t] }));
          place.add(l); this.fx.push({ l, life: 0.08 });
        }
        this.fxOld = (v.fx || []).slice(); this.fxSig = fsig;
      }
      // the base taking hits, and the waves coming and going
      if (g && this.sndOn) {
        if (this.sndHp != null && g.hp < this.sndHp && g.ph !== 'lobby') sfx('hurt', { gap: 200 });
        if (g.ph !== this.sndPh) { if (g.ph === 'wave') sfx('horn'); else if (g.ph === 'break' && this.sndPh === 'wave') sfx('reward'); }
        if (g.ph === 'lobby' || g.ph === 'break') { const c = Math.ceil(g.left); if (c !== this.sndC && c <= 3 && c > 0) sfx('count'); this.sndC = c; }
      }
      if (g) { this.sndHp = g.hp; this.sndPh = g.ph; }
      this.sndOn = true; // (not on the first frame: everything already there would make a noise)
      for (let i = this.fx.length - 1; i >= 0; i--) { const f = this.fx[i]; f.life -= dt; if (f.life <= 0) { place.remove(f.l); f.l.geometry.dispose(); this.fx.splice(i, 1); } }
      // placing a tower: the ghost follows the mouse
      if (this.ghost) this.ghost.visible = !!this.placing && !!this.hoverAt;
      this.ring.visible = this.disc.visible = false;
      if (this.placing != null && this.hoverAt) {
        const t = this.placing, ok = this.canPlace(this.hoverAt.x, this.hoverAt.z, g), r = TW[t].range ? TW[t].range[0] : 4;
        this.ghost.position.set(this.hoverAt.x, 0, this.hoverAt.z);
        this.ring.visible = this.disc.visible = true; this.ring.scale.setScalar(r); this.disc.scale.setScalar(r); this.ring.position.set(this.hoverAt.x, 0.3, this.hoverAt.z); this.disc.position.set(this.hoverAt.x, 0.25, this.hoverAt.z);
        this.disc.material.color.set(ok ? 0x60a5fa : 0xef4444);
      } else if (this.selT != null && this.tviews.get(this.selT)) {
        const w = this.tviews.get(this.selT).w, r = TW[w.t].range ? TW[w.t].range[w.lvl] : 3;
        this.ring.visible = this.disc.visible = true; this.ring.scale.setScalar(r); this.disc.scale.setScalar(r); this.ring.position.set(w.x, 0.3, w.z); this.disc.position.set(w.x, 0.25, w.z); this.disc.material.color.set(0x60a5fa);
      }
    },
    myCash(g) { return g && g.cash ? Math.floor(g.cash[myPeer()] || 0) : 0; },
    myIdx(g) { return g && g.pl ? g.pl.indexOf(myPeer()) : -1; },
    drawUI(g) {
      if (!g) return setBanner('Connecting to the game…');
      const D = DIFF[g.diff] || DIFF.normal;
      if (g.ph === 'lobby') {
        setBanner(`Voting: ${D.n === 'Normal' ? '' : ''}game starts in ${Math.ceil(g.left)} — pick a difficulty`);
        if (!this.lobbyShown && !panelOpen()) { this.lobbyShown = true; this.openLobby(); } // once per lobby: closing it keeps it closed
      } else if (g.ph === 'break') setBanner(`Wave ${g.wave + 1}/${g.waves || D.waves} in ${Math.ceil(g.left)} · ❤️ ${g.hp}`);
      else if (g.ph === 'wave') setBanner(`🌊 Wave ${g.wave}/${g.waves || D.waves} · ❤️ ${g.hp} · ${this.view(g).e.length} enemies`);
      else setBanner(g.res === 'win' ? `🏆 Victory on ${D.n}!` : `💀 The base fell on wave ${g.wave}`);
      if (g.ph !== 'lobby' && this.panelKind === 'lobby') { closePanel(); this.panelKind = null; }
      const cash = this.myCash(g);
      if (cash !== this.barCash || g.ph !== this.barPh) { this.barCash = cash; this.barPh = g.ph; this.drawBar(); }
      if (this.panelKind === 'tower' && this.selT != null) { const m = this.tviews.get(this.selT); if (!m) { closePanel(); this.selT = null; } else if (performance.now() - (this.tpAt || 0) > 400) this.openTower(this.selT, true); }
    },
    drawBar() {
      const g = this.g, cash = this.myCash(g), live = g && g.ph !== 'lobby' && g.ph !== 'end';
      setBar(this.save.loadout.map((t, i) => `<button class="xslot ${this.placing === t ? 'on' : ''}" data-t="${t}" ${!live || cash < TW[t].price ? 'disabled' : ''} title="${TW[t].n}"><span class="k">${i + 1}</span><span class="e">${TW[t].e}</span>${TW[t].n}<span class="n">${fmt(TW[t].price)}</span></button>`).join('')
        + (g && g.ph === 'break' ? `<button class="xslot" data-skip="1"><span class="e">⏭️</span>Skip</button>` : ''),
        (b) => { if (b.dataset.skip) { this.ask('skip'); toast('Voted to skip'); return; } const t = +b.dataset.t; this.startPlacing(t); });
    },
    startPlacing(t) {
      if (this.placing === t) { this.placing = null; } else { this.placing = t; this.selT = null; if (this.ghost) dropModel(this.ghost); this.ghost = towerModel(t, 0, OWN_COL[Math.max(0, this.myIdx(this.g)) % 4]); this.ghost.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.55; } }); place.add(this.ghost); }
      this.drawBar();
    },
    key(code, down) {
      if (!down) return false;
      const m = /^Digit([1-5])$/.exec(code);
      if (m) { const t = this.save.loadout[+m[1] - 1]; if (t != null) this.startPlacing(t); return true; }
      if (code === 'KeyQ' || code === 'Escape') { if (this.placing != null) { this.placing = null; this.drawBar(); return true; } }
      if (code === 'KeyU' && this.selT != null) { this.ask('up', this.selT); return true; }
      return false;
    },
    hover(e) { this.hoverAt = pickPlane(e.x, e.y, 0); },
    click(e) {
      const g = this.g; if (!g) return;
      if (this.placing != null) {
        const h = pickPlane(e.x, e.y, 0); if (!h) return;
        if (!this.canPlace(h.x, h.z, g)) { sfx('error'); return toast('You can’t place a tower there', '#fca5a5'); }
        if (this.myCash(g) < TW[this.placing].price) { sfx('error'); return toast('Not enough cash', '#fca5a5'); }
        this.ask('place', this.placing, +h.x.toFixed(1), +h.z.toFixed(1));
        if (!keys.ShiftLeft && !keys.ShiftRight) { this.placing = null; this.drawBar(); }
        return;
      }
      const hit = pickObjects(e.x, e.y, [...this.tviews.values()].map((m) => m.g));
      if (hit && hit.object.userData.tid) this.openTower(hit.object.userData.tid);
      else if (this.panelKind === 'tower') { closePanel(); this.selT = null; }
    },
    openTower(id, refresh) {
      const m = this.tviews.get(id); if (!m) return;
      const w = m.w, d = TW[w.t], g = this.g, mine = w.o === this.myIdx(g), cash = this.myCash(g), L = w.lvl;
      const pc = (k, v) => (k === 'slow' || k === 'buff' ? Math.round(v * 100) + '%' : k === 'income' ? fmt(v) : v);
      const stat = (k, f) => (d[k] ? `<div class="xp-row"><span>${f}</span><span>${pc(k, d[k][L])}${L < 4 ? ` → <b style="color:#86efac">${pc(k, d[k][L + 1])}</b>` : ''}</span></div>` : '');
      const owner = g.pl && g.pl[w.o] ? nameOf(g.pl[w.o]) : '?';
      const html = `<div class="xp-row"><span>👤 Owner</span><b>${esc(owner)}</b></div><div class="xp-row" style="display:block"><div style="display:flex;justify-content:space-between"><span>⭐ Level</span><b>${L}/4</b></div><div class="meter" style="margin-top:8px"><i style="width:${L * 25}%;background:linear-gradient(180deg,#fde047,#f59e0b)"></i></div></div>
        ${stat('dmg', 'Damage')}${stat('rate', 'Shots per second')}${stat('range', 'Range')}${stat('income', 'Income per wave')}${stat('buff', 'Firerate buff')}${stat('slow', 'Slow')}
        ${d.hid != null ? `<div class="xp-row"><span>Hidden detection</span><b>${L >= d.hid ? '✅ Yes' : d.hid > 4 ? '❌ Never' : `at level ${d.hid}`}</b></div>` : ''}
        ${mine ? `<div class="xp-row"><span>Targeting</span><span>${TGT.map((n, i) => `<button class="xp-btn ${w.tg === i ? '' : 'alt'}" data-tg="${i}" style="padding:5px 7px">${n}</button>`).join(' ')}</span></div>
        <button class="xp-btn" data-up="1" style="width:100%;margin-top:4px" ${L >= 4 || cash < d.up[L] ? 'disabled' : ''}>${L >= 4 ? 'Max level' : `Upgrade (U) — ${fmt(d.up[L])}`}</button>
        <button class="xp-btn red" data-sell="1" style="width:100%;margin-top:6px">Sell</button>` : '<p class="xp-note">Only its owner can upgrade or sell it.</p>'}`;
      if (refresh) { const k = html; if (this.tpKey !== k) { this.tpKey = k; $('#xpBody').innerHTML = html; } this.tpAt = performance.now(); return; }
      openPanel(`${d.e} ${d.n}`, html, (b) => {
        if (b.dataset.up) this.ask('up', id);
        else if (b.dataset.sell) { this.ask('sell', id); closePanel(); }
        else if (b.dataset.tg) this.ask('tgt', id, +b.dataset.tg);
      }, () => { this.panelKind = null; this.selT = null; });
      this.selT = id; this.panelKind = 'tower'; this.tpKey = html; this.tpAt = performance.now(); // (after: opening closes the last panel)
    },
    openLobby() {
      const S = this.save, coins = W.coins;
      const html = `<p class="xp-note">🗳️ Vote for a difficulty and press Ready. The game starts when everyone is ready (or the timer runs out).</p>
        <div class="xp-tabs">${Object.entries(DIFF).map(([k, d]) => `<button data-vote="${k}" class="${this.vote === k ? 'on' : ''}">${d.n} · ${d.waves} waves</button>`).join('')}</div>
        <button class="xp-btn ${this.ready ? 'alt' : ''}" data-ready="1" style="width:100%;padding:13px;font-size:17px">${this.ready ? '✅ Ready' : 'Ready'}</button>
        <h4>🗼 Loadout <small style="color:var(--muted);font:700 12px var(--fb)">— pick 5 towers</small></h4>
        <div class="xp-grid">${TW.map((d, t) => { const has = S.unlocked.includes(t), on = S.loadout.includes(t); return `<div class="xp-card ${on ? 'on' : ''}"><div class="big">${d.e}</div><b>${d.n}</b><span>${fmt(d.price)}${d.hid != null && d.hid <= 4 ? ' · 👁️' : ''}</span>${has ? `<button class="xp-btn ${on ? 'alt' : ''}" data-lo="${t}">${on ? 'Remove' : 'Equip'}</button>` : `<button class="xp-btn gold" data-unlock="${t}" ${coins < d.unlock ? 'disabled' : ''}>🪙 ${d.unlock}</button>`}</div>`; }).join('')}</div>`;
      openPanel('🗼 Tower Defense Simulator', html, (b) => {
        if (b.dataset.vote) { this.vote = b.dataset.vote; send({ vt: this.vote }); }
        else if (b.dataset.ready) { this.ready = !this.ready; send({ rdy: this.ready ? 1 : 0 }); }
        else if (b.dataset.lo) { const t = +b.dataset.lo, i = S.loadout.indexOf(t); if (i >= 0) { if (S.loadout.length > 1) S.loadout.splice(i, 1); } else { if (S.loadout.length >= 5) S.loadout.shift(); S.loadout.push(t); } kvSet('ts', S); this.drawBar(); }
        else if (b.dataset.unlock) { const t = +b.dataset.unlock; if (spend(TW[t].unlock)) { S.unlocked.push(t); kvSet('ts', S); toast(`Unlocked ${TW[t].n}!`, '#86efac'); } }
        this.openLobby();
      }, () => { this.panelKind = null; });
      this.panelKind = 'lobby';
    },
    finish(g) {
      if (this.myIdx(g) < 0) return;
      const D = DIFF[g.diff] || DIFF.normal, win = g.res === 'win';
      sfx(win ? 'win' : 'lose');
      earn(g.wave * 3 + (win ? D.coins : 0), win ? `won ${D.n}` : `survived ${g.wave} waves`);
      questMax('tds.wave', win ? D.waves : g.wave); if (win) { quest('tds.win'); if (g.diff === 'hard') quest('tds.hard'); }
      if (win) { this.save.wins = (this.save.wins | 0) + 1; kvSet('ts', this.save); puffAt(P.x, P.y + 3, P.z, CONFETTI, 60); }
      this.ready = false; send({ rdy: 0 });
    },
    hud() { const g = this.g; return g && g.ph !== 'lobby' ? `💵 ${fmt(this.myCash(g))}${this.placing != null ? ` · placing ${TW[this.placing].n} (Q to cancel, Shift to place more)` : ''}` : ''; },
    statOf(pr, isMe, peer) { const g = this.g; return g && g.cash ? fmt(g.cash[peer] || 0) : '—'; },
    sortKey(pr, isMe, peer) { const g = this.g; return g && g.cash ? g.cash[peer] || 0 : 0; },
    menu() { return [['🗼 Loadout & difficulty', () => this.openLobby(), 'Loadout']]; },
    leave() { this.placing = null; this.views = new Map(); this.tviews = new Map(); },
    coinShop: [
      { id: 'chest', e: '💰', n: 'War Chest', d: 'Start every game with $300 more, for good', price: 500, kind: 'pass' },
      { id: 'cash', e: '💸', n: 'Cash Drop', d: 'Use it in a game: +$250 for you', price: 30, kind: 'use', tap: true },
      { id: 'heal', e: '🧱', n: 'Base Repair', d: 'Use it in a game: the base gets 50 health back', price: 40, kind: 'use', tap: true },
    ],
    onBuy(id) { if (id === 'chest') send({ wc: 1 }); },
    shopUse(id) {
      const g = this.g; if (!g || g.ph === 'lobby' || g.ph === 'end') return false;
      if (id === 'heal' && g.hp >= (DIFF[g.diff] || DIFF.normal).base) return false;
      this.ask(id === 'cash' ? 'bonus' : 'heal'); return true;
    },
  };
  addExp(TDS);
  window.__rbTDS = TDS;
})();
