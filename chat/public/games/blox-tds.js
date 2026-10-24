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
    { n: 'Normal', hp: 8, sp: 7, dmg: 1, cash: 4, c: 0x65a30d },
    { n: 'Quick', hp: 6, sp: 13, dmg: 1, cash: 4, c: 0xfacc15 },
    { n: 'Slow', hp: 40, sp: 4, dmg: 3, cash: 10, c: 0x7c2d12, big: 1.3 },
    { n: 'Hidden', hp: 14, sp: 8, dmg: 2, cash: 8, c: 0x9ca3af, hidden: 1 },
    { n: 'Armored', hp: 60, sp: 5, dmg: 4, cash: 14, c: 0x475569, armor: 0.5, big: 1.2 },
    { n: 'Breaker', hp: 320, sp: 8, dmg: 20, cash: 60, c: 0xb91c1c, big: 1.8, boss: 1 },
    { n: 'Grave Digger', hp: 2600, sp: 3.2, dmg: 999, cash: 300, c: 0x1e1b4b, big: 2.6, boss: 1 },
    { n: 'Mystery', hp: 22, sp: 7, dmg: 2, cash: 6, c: 0x7c3aed, split: 1 },
  ];
  // towers: price, upgrade costs, per-level stats; unlock = Blox Coins to unlock (0 = free)
  const TW = [
    { n: 'Scout', e: '🔫', price: 200, unlock: 0, up: [50, 150, 400, 1200], dmg: [1, 1, 2, 2, 4], rate: [1.5, 2, 2, 2.6, 3.5], range: [12, 13, 14, 16, 17], hid: 2, c: 0x22c55e, limit: 12 },
    { n: 'Sniper', e: '🎯', price: 350, unlock: 0, up: [150, 500, 1500, 4000], dmg: [5, 8, 14, 24, 50], rate: [0.4, 0.45, 0.5, 0.55, 0.7], range: [30, 32, 35, 40, 45], hid: 1, c: 0x0ea5e9, limit: 12 },
    { n: 'Soldier', e: '🪖', price: 400, unlock: 0, up: [250, 700, 2000, 5000], dmg: [2, 2, 3, 4, 6], rate: [3, 3.5, 4, 5, 6], range: [14, 15, 16, 17, 18], hid: 3, c: 0x4d7c0f, limit: 12 },
    { n: 'Demoman', e: '💣', price: 600, unlock: 0, up: [300, 900, 2500, 6000], dmg: [4, 6, 10, 16, 30], rate: [0.6, 0.65, 0.7, 0.8, 0.9], range: [13, 13, 14, 15, 16], splash: [4, 4.5, 5, 6, 7], hid: 9, c: 0x7f1d1d, limit: 10 },
    { n: 'Farm', e: '🌾', price: 250, unlock: 0, up: [150, 400, 1200, 3000], income: [50, 100, 250, 500, 1000], c: 0xa16207, limit: 8 },
    { n: 'Freezer', e: '🧊', price: 450, unlock: 150, up: [200, 600, 1500, 3500], dmg: [1, 1, 2, 2, 3], rate: [1, 1.2, 1.4, 1.6, 2], range: [12, 13, 14, 15, 16], slow: [0.3, 0.4, 0.45, 0.5, 0.6], hid: 3, c: 0x67e8f9, limit: 8 },
    { n: 'Commander', e: '🚩', price: 650, unlock: 300, up: [400, 1200, 3000, 7000], buff: [0.1, 0.15, 0.2, 0.25, 0.35], range: [14, 14, 15, 16, 18], c: 0x1d4ed8, limit: 4 },
    { n: 'Minigunner', e: '⚙️', price: 1600, unlock: 400, up: [800, 2500, 6000, 15000], dmg: [1, 2, 2, 3, 4], rate: [10, 12, 14, 16, 20], range: [16, 16, 17, 18, 19], hid: 2, c: 0x374151, limit: 8 },
    { n: 'Ranger', e: '🏹', price: 5000, unlock: 1000, up: [3000, 8000, 20000, 45000], dmg: [60, 90, 150, 250, 400], rate: [0.3, 0.32, 0.35, 0.38, 0.45], range: [60, 62, 65, 70, 75], hid: 0, c: 0x312e81, limit: 3 },
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
  function towerModel(t, lvl, ownerCol) {
    const d = TW[t], g = new THREE.Group();
    bx(g, ownerCol, 3.2, 0.5, 3.2, 0, 0.25, 0); // the base, in the owner's colour
    if (t === 4) { bx(g, 0x92400e, 2.6, 1.8, 2.2, 0, 1.4, 0); bx(g, 0xb91c1c, 3, 0.4, 2.6, 0, 2.5, 0); for (let i = 0; i < 4; i++) bx(g, 0xfacc15, 0.3, 0.6, 0.3, -1.2 + i * 0.8, 0.8, 1.4); }
    else {
      bx(g, 0x1f2937, 0.5, 1.4, 0.5, -0.3, 1.2, 0); bx(g, 0x1f2937, 0.5, 1.4, 0.5, 0.3, 1.2, 0);
      bx(g, d.c, 1.2, 1.3, 0.6, 0, 2.55, 0); bx(g, 0xf2c94c, 0.8, 0.8, 0.8, 0, 3.6, 0);
      bx(g, d.c, 0.9, 0.3, 0.9, 0, 4.1, 0);
      const gun = { 0: [0.2, 0.2, 1.2], 1: [0.15, 0.15, 2.4], 2: [0.22, 0.22, 1.5], 3: [0.5, 0.5, 1.2], 5: [0.4, 0.4, 1], 7: [0.45, 0.45, 1.8], 8: [0.2, 0.2, 2.8] }[t];
      if (gun) bx(g, t === 5 ? 0xa5f3fc : 0x111827, gun[0], gun[1], gun[2], 0.45, 2.6, -gun[2] / 2 - 0.2);
      if (t === 6) { bx(g, 0x78350f, 0.12, 3, 0.12, 0.9, 3.2, 0.3); bx(g, 0x1d4ed8, 0.9, 0.6, 0.05, 1.35, 4.3, 0.3); }
    }
    for (let i = 0; i < lvl; i++) bx(g, 0xfacc15, 0.35, 0.35, 0.35, -0.9 + i * 0.6, 0.65, 1.45); // a star per upgrade
    return g;
  }
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
      return { ph: g.ph, left: +g.left || 5, gs: g.gs || 0, diff: g.diff, wave: g.wave | 0, hp: +g.hp || 1, e, tw: (g.tw || []).map((w) => ({ id: w[0], o: w[1], t: w[2], x: w[3], z: w[4], lvl: w[5], tg: w[6] || 0, cd: 0 })), cash: Object.assign({}, g.cash || {}), pl: (g.pl || []).slice(), nid: 1 + Math.max(0, ...e.map((x) => x.id)), tid: 1 + Math.max(0, ...(g.tw || []).map((w) => w[0])), q: [], spawnT: 0, fx: [], res: g.res || '' };
    },
    hpOf(t, wave, diff) { return EN[t].hp * (1 + (wave - 1) * 0.12) * (DIFF[diff] || DIFF.normal).hp * (EN[t].boss ? 1 + wave * 0.05 : 1); },
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
      H.left = Math.max(0, H.left - dt);
      // requests from everyone
      for (const p of pl) {
        if (p.me) continue;
        const seen = H.seen[p.peer] || { t: 0, n: 0 };
        if (p.pr.t !== seen.t) { seen.t = p.pr.t; seen.n = 0; }
        for (const r of Array.isArray(p.pr.tq) ? p.pr.tq : []) { if (!Array.isArray(r) || !(r[0] > seen.n)) continue; seen.n = r[0]; this.apply(p.peer, r.slice(1)); }
        H.seen[p.peer] = seen;
      }
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
          if (EN[e.t].split) for (let k = 0; k < 2; k++) { const max = this.hpOf(1, H.wave, H.diff); H.e.push({ id: H.nid++ % 4000, t: 1, s: Math.max(0, e.s - k * 1.5), hp: max, max, slow: 0, slowT: 0 }); }
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
      send({ g: { ph: H.ph, left: +H.left.toFixed(1), gs: H.gs, diff: H.diff, wave: H.wave, hp: H.hp, e: es, tw, cash, pl: H.pl, fx: H.fx.slice(), res: H.res, waves: DIFF[H.diff].waves } });
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
        m.s = Math.abs(m.s - e.s) > 8 ? e.s : m.s + sp * dt + (e.s - m.s) * Math.min(1, dt * 4);
        if (m.lastS !== e.s) { m.lastS = e.s; m.s += (e.s - m.s) * 0.5; }
        const [x, z, yaw] = posAt(m.s); m.g.position.set(x, 0.1, z); m.g.rotation.y = yaw;
        m.g.userData.bar.scale.x = 1.6 * clamp(e.f, 0.02, 1); m.g.userData.bar.position.x = -(1 - clamp(e.f, 0, 1)) * 0.8;
        m.g.userData.bar.material.color.set(e.f > 0.5 ? 0x22c55e : e.f > 0.25 ? 0xfacc15 : 0xef4444);
        const walk = Math.sin(performance.now() / 120 + e.id) * 0.4; m.g.children[0].rotation.x = walk; m.g.children[1].rotation.x = -walk;
        if (EN[e.t].hidden) m.g.children.forEach((c) => { if (c.material && !c.material.transparent) { c.material = c.material.clone(); c.material.transparent = true; c.material.opacity = 0.45; } });
      }
      for (const [id, m] of this.views) if (!keep.has(id)) { place.remove(m.g); this.views.delete(id); puffAt(m.g.position.x, 2, m.g.position.z, EN[m.t].c, 5); if (this.sndOn) sfx3('pop', m.g.position.x, m.g.position.z, 140, { vol: 0.5, gap: 50 }); }
      // towers
      const tk = new Set();
      for (const w of v.tw) {
        tk.add(w.id);
        const sig = w.t + ':' + w.lvl + ':' + w.o;
        let m = this.tviews.get(w.id);
        if (!m || m.sig !== sig) {
          if (this.sndOn) { const mine = w.o === this.myIdx(g); if (!m) sfx3('place', w.x, w.z, 140); else if (m.w.lvl !== w.lvl) { if (mine) sfx('levelup'); else sfx3('select', w.x, w.z, 140); } }
          if (m) place.remove(m.g); m = { g: towerModel(w.t, w.lvl, OWN_COL[w.o % 4]), sig, w }; m.g.position.set(w.x, 0, w.z); m.g.traverse((o) => (o.userData.tid = w.id)); place.add(m.g); this.tviews.set(w.id, m); }
        m.w = w;
      }
      for (const [id, m] of this.tviews) if (!tk.has(id)) { place.remove(m.g); this.tviews.delete(id); if (this.sndOn) sfx3('sell', m.w.x, m.w.z, 140, { vol: m.w.o === this.myIdx(g) ? 1 : 0.4 }); }
      // shots
      const fsig = JSON.stringify(v.fx || []);
      if (fsig !== this.fxSig) {
        const old = new Set((this.fxOld || []).map((f) => f.join()));
        for (const f of v.fx || []) {
          if (old.has(f.join())) continue;
          const m = this.tviews.get(f[0]); if (!m) continue;
          const [x, z] = posAt(f[1] / 4), t = m.w.t, from = new THREE.Vector3(m.w.x, 2.6, m.w.z), to = new THREE.Vector3(x, 2, z);
          m.g.rotation.y = Math.atan2(-(x - m.w.x), -(z - m.w.z));
          if (this.sndOn) { const snd = SHOT_SND[t]; if (snd) sfx3(snd[0], m.w.x, m.w.z, 150, snd[1]); }
          if (t === 3) puffAt(x, 1.5, z, [0xf97316, 0x444444], 8); else if (t === 5) puffAt(x, 2, z, 0xa5f3fc, 4);
          const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, to]), new THREE.LineBasicMaterial({ color: t === 8 ? 0xa78bfa : t === 1 ? 0xfde047 : 0xffffff }));
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
      if (this.placing === t) { this.placing = null; } else { this.placing = t; this.selT = null; if (this.ghost) place.remove(this.ghost); this.ghost = towerModel(t, 0, OWN_COL[Math.max(0, this.myIdx(this.g)) % 4]); this.ghost.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.55; } }); place.add(this.ghost); }
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
      const stat = (k, f) => (d[k] ? `<div class="xp-row"><span>${f}</span><span>${d[k][L]}${L < 4 ? ` → <b style="color:#86efac">${d[k][L + 1]}</b>` : ''}</span></div>` : '');
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
    menu() { return [['🗼 Loadout & difficulty', () => this.openLobby()]]; },
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
