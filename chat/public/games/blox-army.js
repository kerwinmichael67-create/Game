/* =====================================================================
   BLOXVERSE — COMMAND AN ARMY. 3 v 3 battles: attackers capture A, then B,
   then the enemy's base before time runs out; defenders hold them off.
   Every commander rides into battle with an army of soldiers that follows
   their orders (Hold, Follow, Attack, Rush; three formations). Empty
   seats are filled with bots, so a battle is always 3 v 3.
   The host runs the soldiers, the bots and the objectives; each player
   runs their own hero and sends their hits and orders through presence.
   Between battles: summon units, level them, pick a class and a mount,
   spend skill points, climb the battle pass, do quests, play ranked.
   ===================================================================== */
(() => {
  // ---------------------------------------------------------------- data
  const UNITS = [
    { n: 'Militia', st: 2, cnt: 20, hp: 40, dmg: 6, cd: 1.1, sp: 9, rng: 2.6, c: 0x92400e, w: 'spear' },
    { n: 'Swordsman', st: 2, cnt: 18, hp: 55, dmg: 8, cd: 1.0, sp: 9, rng: 2.4, c: 0x6b7280, w: 'sword', shield: 1 },
    { n: 'Archer', st: 3, cnt: 14, hp: 35, dmg: 7, cd: 1.6, sp: 9, rng: 26, ranged: 1, c: 0x15803d, w: 'bow' },
    { n: 'Spearman', st: 3, cnt: 18, hp: 60, dmg: 9, cd: 1.1, sp: 9, rng: 3.2, antiCav: 2, c: 0xb45309, w: 'spear' },
    { n: 'Cavalryman', st: 3, cnt: 12, hp: 90, dmg: 12, cd: 1.0, sp: 17, rng: 3, cav: 1, c: 0x1d4ed8, w: 'sword' },
    { n: 'Myrmidon', st: 4, cnt: 16, hp: 110, dmg: 11, cd: 1.0, sp: 9.5, rng: 2.8, armor: 0.35, c: 0x991b1b, w: 'spear', shield: 1 },
    { n: 'Samurai', st: 4, cnt: 14, hp: 95, dmg: 18, cd: 0.9, sp: 10, rng: 2.8, c: 0x7c3aed, w: 'katana' },
    { n: 'Bataar', st: 4, cnt: 12, hp: 80, dmg: 9, cd: 1.3, sp: 16, rng: 22, ranged: 1, cav: 1, c: 0xa16207, w: 'bow' },
    { n: 'Berserker', st: 5, cnt: 14, hp: 100, dmg: 24, cd: 0.8, sp: 12, rng: 2.6, c: 0x0f766e, w: 'axe' },
    { n: 'Royal Knight', st: 5, cnt: 10, hp: 200, dmg: 22, cd: 1.0, sp: 16, rng: 3.2, cav: 1, armor: 0.4, c: 0xca8a04, w: 'lance', shield: 1 },
  ];
  const CLASSES = [
    { n: 'Sword & Shield', e: '🛡️', hp: 300, dmg: 26, cd: 0.6, block: 0.7, sp: 16, lvl: 1, hits: 2 },
    { n: 'Assassin', e: '🗡️', hp: 220, dmg: 22, cd: 0.35, block: 0.4, sp: 18.5, lvl: 3, hits: 1 },
    { n: 'Hammer', e: '🔨', hp: 380, dmg: 46, cd: 1.0, block: 0.6, sp: 15, lvl: 6, hits: 6 },
  ];
  const MOUNTS = [
    { n: 'Brown Horse', e: '🐴', hp: 0, sp: 30, gems: 0, c: 0x8b5a2b },
    { n: 'Black Warhorse', e: '🐎', hp: 60, sp: 31, gems: 500, c: 0x1f2937 },
    { n: 'Armored Charger', e: '🛡️', hp: 140, sp: 29, gems: 1200, c: 0x6b7280, armor: 1 },
    { n: 'Golden Steed', e: '✨', hp: 100, sp: 34, gems: -1, c: 0xeab308 },
  ];
  const SKILLS = [
    { k: 'reck', n: 'Reckless', d: '+8% hero damage', e: '⚔️' }, { k: 'guard', n: 'Guard', d: '+10% hero health', e: '🛡️' },
    { k: 'duel', n: 'Duelist', d: '6% faster attacks', e: '💨' }, { k: 'war', n: 'Warlord', d: '+8% army damage', e: '🚩' },
  ];
  const BP_XP = 400;
  const BP = Array.from({ length: 30 }, (_, i) => {
    const L = i + 1;
    if (L === 5) return { unit: 6 }; if (L === 10) return { gems: 150 }; if (L === 15) return { cos: ['h', 15] }; if (L === 20) return { unit: 7 };
    if (L === 25) return { mount: 3 }; if (L === 30) return { unit: 9 };
    return L % 3 === 0 ? { coins: 60 } : { gems: 40 + Math.floor(L / 5) * 10 };
  });
  const QUESTS = [{ k: 'wins', n: 'Win 2 battles', goal: 2, gems: 100 }, { k: 'kills', n: 'Defeat 150 troops', goal: 150, gems: 80 }, { k: 'caps', n: 'Capture 3 points', goal: 3, gems: 60 }];
  const CODES = { BLOXVERSE: { gems: 200 }, COMMANDER: { unit: 4 }, UPDATE4: { gems: 100 } };
  const TIERS = [[0, 'Bronze', '🥉'], [1100, 'Silver', '🥈'], [1250, 'Gold', '🥇'], [1400, 'Platinum', '💠'], [1600, 'Diamond', '💎'], [1800, 'Champion', '👑']];
  const tierOf = (r) => TIERS.filter((t) => r >= t[0]).pop();
  const BOT_NAMES = ['Sir Bolt', 'Lady Pixel', 'Duke Cog', 'Baron Byte', 'Captain Gear', 'General Spark', 'Count Widget', 'Dame Sprocket'];
  const STREAKS = [[10, 'RAMPAGE!'], [20, 'UNSTOPPABLE!'], [35, 'MERCILESS!'], [50, 'ULTRAKILL!'], [75, 'BLOODBATH!']];
  const TEAM_COL = [0x2563eb, 0xdc2626], TEAM_CSS = ['#3b82f6', '#ef4444'], TEAM_NAME = ['Attackers', 'Defenders'];
  // the battlefield
  const POINTS = [{ n: 'A', x: 0, z: 55 }, { n: 'B', x: 0, z: -45 }, { n: 'Base', x: 0, z: -140 }];
  const CAMPS = [[[0, 130], [0, 40], [0, -60]], [[0, -20], [0, -100], [0, -158]]]; // camps by objective: attackers move up, defenders fall back
  const GATE_Z = -112, FORT = { x0: -40, x1: 40, z0: -175, z1: GATE_Z }, LOBBY = [0, 300];
  const ROUND_S = 480, CAP_BONUS = 120, CAMP_R = 14, POINT_R = 13;
  const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const n2 = (n) => AL[(n >> 6) & 63] + AL[n & 63], d2 = (t, i) => AL.indexOf(t[i]) * 64 + AL.indexOf(t[i + 1]);
  const qx = (x) => clamp(Math.round((x + 256) * 8), 0, 4095), uqx = (v) => v / 8 - 256;
  const lvlMul = (l) => 1 + 0.06 * ((l || 1) - 1);
  const inFort = (x, z) => x > FORT.x0 && x < FORT.x1 && z > FORT.z0 && z < FORT.z1;
  const campOf = (team, obj) => CAMPS[team][clamp(obj, 0, 2)];

  // ---------------------------------------------------------------- your progress (saved)
  const S0 = () => ({ gems: 300, xp: 0, units: { 0: { lvl: 1 }, 1: { lvl: 1 }, 2: { lvl: 1 } }, eq: [0, 1, 2], cls: 0, mount: 0, mounts: [0], skills: {}, bpXp: 0, bpClaimed: [], rating: 1000, wins: 0, losses: 0, quest: { day: '', wins: 0, kills: 0, caps: 0, claimed: [] }, codes: [], pity: 0 });
  function levelOf(xp) { let L = 1, need = 300; while (xp >= need && L < 50) { xp -= need; L++; need = 200 + L * 100; } return { L, into: xp, need }; }
  const skillPts = (S) => levelOf(S.xp).L - 1 - Object.values(S.skills).reduce((a, b) => a + b, 0);

  // ---------------------------------------------------------------- models
  const MATS = new Map(), mat = (c) => { if (!MATS.has(c)) MATS.set(c, new THREE.MeshLambertMaterial({ color: c })); return MATS.get(c); };
  const bx = (g, c, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(BOX, mat(c)); m.scale.set(sx, sy, sz); m.position.set(x, y, z); g.add(m); return m; };
  function horseModel(c, armored) {
    const g = new THREE.Group();
    bx(g, c, 1.6, 1.5, 3.6, 0, 2.3, 0); bx(g, c, 0.9, 1.6, 0.9, 0, 3.3, -1.9).rotation.x = -0.5; bx(g, c, 0.8, 0.8, 1.4, 0, 3.9, -2.6);
    bx(g, 0x111111, 0.3, 1.2, 0.3, 0, 3.4, -1.4);
    const legs = []; for (const [x, z] of [[-0.5, -1.3], [0.5, -1.3], [-0.5, 1.3], [0.5, 1.3]]) { const p = new THREE.Group(); p.position.set(x, 1.6, z); bx(p, c, 0.38, 1.6, 0.38, 0, -0.8, 0); g.add(p); legs.push(p); }
    bx(g, 0x7f1d1d, 1.7, 0.2, 1.4, 0, 3.1, 0.1);
    if (armored) { bx(g, 0x9ca3af, 1.75, 0.9, 2.6, 0, 2.5, 0); bx(g, 0x9ca3af, 0.95, 0.5, 1.2, 0, 4.1, -2.6); }
    g.userData.legs = legs; g.scale.setScalar(1.3);
    return g;
  }
  // soldiers: one instanced mesh per body part, so a hundred of them draw cheaply
  function makeCrowd() {
    const N = 160, parts = {};
    const mk = (key, n, color) => { const m = new THREE.InstancedMesh(BOX, new THREE.MeshLambertMaterial({ color: color || 0xffffff }), n); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.count = 0; m.frustumCulled = false; place.add(m); parts[key] = m; return m; };
    mk('body', N); mk('head', N, 0xf2c94c); mk('helm', N); mk('legs', N * 2, 0x1f2937); mk('weapon', N, 0xd1d5db); mk('shield', N); mk('horse', N * 6);
    for (const k of ['body', 'helm', 'shield', 'horse']) parts[k].instanceColor = new THREE.InstancedBufferAttribute(new Float32Array((k === 'horse' ? N * 6 : N) * 3), 3);
    return parts;
  }
  const dummy = new THREE.Object3D(), tmpC = new THREE.Color();

  // ---------------------------------------------------------------- the experience
  const ARMY = {
    id: 'army', code: 'ca', rank: 1, name: 'Command an Army', emoji: '⚔️', max: 6, stat: 'Score', killY: -40, banner: true, camDist: 22, respawnDelay: 6000, noReset: true,
    color: 'linear-gradient(135deg,#7f1d1d,#1e3a8a)',
    desc: '3 v 3 battles with armies: attackers capture A, B and then the enemy base; defenders hold them off. Ride your horse, give your soldiers orders, fight with your class. Empty seats are filled with bots. Summon units, level them, unlock classes and mounts, a skill tree, a battle pass, quests — and servers 5 and 6 are Ranked.',
    welcome: 'Battle starts soon — check your units!',
    build() {
      sky('#94a3b8', '#e2e8f0');
      // the battlefield
      slab(0, 0, 0, 240, 380, 0x4d7c0f, { sy: 2 });
      part({ x: 0, y: 0.07, z: 5, sx: 12, sy: 0.14, sz: 300, c: 0x8b6b45, plain: true });
      const r = mulberry(1234);
      for (let i = 0; i < 60; i++) { const x = (r() < 0.5 ? -1 : 1) * (30 + r() * 85), z = -180 + r() * 360; if (inFort(x, z) || Math.abs(z - 150) < 20) continue; part({ x, y: 2, z, sx: 1, sy: 4, sz: 1, c: 0x78350f, plain: true, deco: 1 }); part({ x, y: 5.5, z, sx: 4.5, sy: 4, sz: 4.5, c: [0x166534, 0x14532d, 0x15803d][i % 3], deco: 1 }); }
      for (let i = 0; i < 10; i++) { const x = (i % 2 ? -1 : 1) * (22 + r() * 30), z = -90 + i * 22; part({ x, y: 2, z, sx: 6, sy: 4, sz: 5, c: 0xa16207 }); part({ x, y: 4.6, z, sx: 6.6, sy: 1.2, sz: 5.6, c: 0x7f1d1d }); }
      // the fort: walls, towers, and a gate only defenders can pass (until B falls)
      const WALL = 0x78716c;
      part({ x: 0, y: 4, z: FORT.z0, sx: 80, sy: 8, sz: 2, c: WALL }); part({ x: FORT.x0, y: 4, z: (FORT.z0 + FORT.z1) / 2, sx: 2, sy: 8, sz: 63, c: WALL }); part({ x: FORT.x1, y: 4, z: (FORT.z0 + FORT.z1) / 2, sx: 2, sy: 8, sz: 63, c: WALL });
      part({ x: -24, y: 4, z: GATE_Z, sx: 32, sy: 8, sz: 2, c: WALL }); part({ x: 24, y: 4, z: GATE_Z, sx: 32, sy: 8, sz: 2, c: WALL });
      for (const [x, z] of [[-40, -175], [40, -175], [-40, GATE_Z], [40, GATE_Z], [-8, GATE_Z], [8, GATE_Z]]) part({ x, y: 6, z, sx: 4, sy: 12, sz: 4, c: 0x57534e });
      this.gate = part({ x: 0, y: 3.5, z: GATE_Z, sx: 12, sy: 7, sz: 1.2, c: 0x78350f, pass: 1, gate: 1 });
      // camps and points
      this.marks = [];
      const ring = (x, z, rad, col, opa) => { const m = new THREE.Mesh(new THREE.RingGeometry(rad - 0.6, rad, 48), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: opa, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.15, z); place.add(m); return m; };
      // camps: armies refill (and change units) here; they move as the battle moves
      for (const i of [0, 1]) CAMPS[i].forEach((c, k) => {
        ring(c[0], c[1], CAMP_R, TEAM_COL[i], 0.4);
        const back = i === 0 ? 4 : -4;
        for (const dx of [-9, 9]) { part({ x: c[0] + dx, y: 2.2, z: c[1] + back, sx: 4, sy: 4.4, sz: 4, c: TEAM_COL[i], deco: 1 }); part({ x: c[0] + dx, y: 5, z: c[1] + back, sx: 0.3, sy: 2, sz: 0.3, c: 0x78350f, plain: true }); }
        const l = label(`⛺ ${i ? 'Defender' : 'Attacker'} camp${k ? ` (after ${POINTS[k - 1].n})` : ''}`, { size: 1, color: TEAM_CSS[i] }); l.position.set(c[0], 7.5, c[1] + back); place.add(l);
      });
      this.pointRings = POINTS.map((p) => ring(p.x, p.z, POINT_R, 0xffffff, 0.6));
      this.pointFills = POINTS.map((p) => { const m = new THREE.Mesh(new THREE.CircleGeometry(POINT_R - 0.6, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(p.x, 0.12, p.z); place.add(m); return m; });
      this.flags = POINTS.map((p) => { part({ x: p.x, y: 5, z: p.z, sx: 0.4, sy: 10, sz: 0.4, c: 0x57534e, plain: true }); const f = new THREE.Mesh(BOX, new THREE.MeshLambertMaterial({ color: 0xffffff })); f.scale.set(3, 2, 0.1); f.position.set(p.x + 1.7, 8.8, p.z); place.add(f); const l = label(p.n === 'Base' ? '🏰 BASE' : `Point ${p.n}`, { size: 2.2 }); l.position.set(p.x, 12.5, p.z); place.add(l); return f; });
      // the lobby: a courtyard far behind the battlefield
      slab(LOBBY[0], 0, LOBBY[1], 80, 60, 0x9ca3af, { sy: 2 });
      part({ x: LOBBY[0], y: 1, z: LOBBY[1], sx: 10, sy: 2, sz: 10, c: 0x57534e }); part({ x: LOBBY[0], y: 2.1, z: LOBBY[1], sx: 8, sy: 0.3, sz: 8, c: 0x38bdf8, neon: true, solid: false });
      for (const s of [-1, 1]) { part({ x: LOBBY[0] + s * 38, y: 6, z: LOBBY[1], sx: 2, sy: 12, sz: 58, c: 0x44403c }); part({ x: LOBBY[0] + s * 30, y: 7, z: LOBBY[1] - 26, sx: 0.4, sy: 14, sz: 0.4, c: 0x78350f, plain: true }); part({ x: LOBBY[0] + s * 30, y: 11, z: LOBBY[1] - 26, sx: 0.1, sy: 6, sz: 3.5, c: TEAM_COL[(s + 1) / 2], plain: true }); }
      part({ x: LOBBY[0], y: 6, z: LOBBY[1] - 30, sx: 80, sy: 12, sz: 2, c: 0x44403c });
      const t = label('⚔️ COMMAND AN ARMY', { size: 3, color: '#fde68a' }); t.position.set(LOBBY[0], 15, LOBBY[1] - 28); place.add(t);
      this.podium = [];
      this.crowd = makeCrowd();
      this.sviews = new Map(); this.bviews = new Map(); this.horses = new Map(); this.dmgFx = [];
    },
    // ---------------------------------------------------------------- joining
    pres() { return { tm: -1, ah: 1, od: 1, fm: 0, cu: 0, ht: [], dth: [] }; },
    async enter() {
      const s = await kvGet('ca');
      this.S = Object.assign(S0(), s || {});
      const S = this.S, today = new Date().toISOString().slice(0, 10);
      if (S.quest.day !== today) S.quest = { day: today, wins: 0, kills: 0, caps: 0, claimed: [] };
      S.eq = (S.eq || []).filter((u) => S.units[u]).slice(0, 4); if (!S.eq.length) S.eq = [0];
      Object.assign(this, { H: null, lastG: null, gSeen: null, ord: 1, form: 0, anchor: null, rush: null, sel: 0, hp: 1, mounted: true, blocking: false, cdA: 0, cdRoll: 0, cdHeal: 0, healT: 0, rollT: 0, hits: [], hn: 0, deaths: [], dn: 0, evN: -1, evFrom: null, team: -1, chg: null, myStats: null, shownEnd: null, lobbyShown: false });
      P.team = -1;
      this.sendMe(true);
      this.drawMenu();
    },
    stats() {
      const S = this.S, C = CLASSES[S.cls] || CLASSES[0], M = MOUNTS[S.mount] || MOUNTS[0], sk = S.skills;
      return { maxHp: Math.round((C.hp + (this.mounted ? M.hp : 0)) * (1 + 0.1 * (sk.guard || 0))), dmg: C.dmg * (1 + 0.08 * (sk.reck || 0)), cd: C.cd * (1 - 0.06 * (sk.duel || 0)), block: C.block, sp: this.mounted ? M.sp : C.sp, armyMul: 1 + 0.08 * (sk.war || 0), hits: C.hits };
    },
    unitNow() { return this.S.eq[this.sel] != null ? this.S.eq[this.sel] : this.S.eq[0]; },
    sendMe(force) {
      const S = this.S, u = this.unitNow();
      const st = { tm: this.team, cu: u, ul: (S.units[u] || {}).lvl || 1, cl: S.cls, mo: S.mount, mt: this.mounted ? 1 : 0, od: this.ord, fm: this.form, an: this.anchor, rp: this.rush, hpf: +this.hp.toFixed(2), blk: this.blocking ? 1 : 0, lv: levelOf(S.xp).L, rt: S.rating, sk: S.skills.war || 0 };
      const key = JSON.stringify(st);
      if (!force && key === this.lastMe) return;
      this.lastMe = key; send(st);
    },
    spawn() {
      const g = this.g;
      if (g && g.ph === 'battle' && this.team >= 0) { const c = campOf(this.team, g.obj); return [c[0] + (Math.random() - 0.5) * 10, 0.5, c[1] + (Math.random() - 0.5) * 6, this.team === 0 ? 0 : Math.PI]; }
      return [LOBBY[0] + (Math.random() - 0.5) * 20, 0.5, LOBBY[1] + 10 + Math.random() * 8, 0];
    },
    // ---------------------------------------------------------------- the host
    adopt() {
      const g = this.lastG;
      if (!g || g.ph !== 'battle') return { ph: 'lobby', left: 30, gs: 0, cm: [], sol: [], obj: 0, prog: 0, sid: 1, ev: [], evs: 0, seen: {}, ranked: Net.srvN >= 5 };
      // the host left mid-battle: carry on from what everyone last saw
      const H = { ph: 'battle', left: +g.left || 60, gs: g.gs || 0, obj: g.obj | 0, prog: +g.prog || 0, ev: [], evs: g.evs || 0, seen: {}, ranked: !!g.rk, sid: 1, refill: {}, cm: (g.cm || []).map((c, i) => ({ k: c[0], id: c[1], nm: c[2], team: c[3], unit: c[4], ul: c[5] || 1, cls: c[6] || 0, sc: Object.assign({ k: 0, d: 0, hk: 0, cap: 0, score: 0, st: 0 }, (g.sc || [])[i] || {}), hero: null })), sol: [] };
      const ss = typeof g.s === 'string' ? g.s : '';
      for (let i = 0; i + 8 < ss.length + 1; i += 9) { const ci = AL.indexOf(ss[i]), id = d2(ss, i + 1), x = uqx(d2(ss, i + 3)), z = uqx(d2(ss, i + 5)), hpf = AL.indexOf(ss[i + 7]) / 63; const c = H.cm[ci]; if (!c) continue; const U = UNITS[c.unit]; H.sol.push({ id, ci, x, z, hp: Math.max(1, hpf * U.hp * lvlMul(c.ul)), cd: Math.random(), vx: 0, vz: 0, yaw: 0, rt: 0, tgt: null, slot: 0 }); H.sid = Math.max(H.sid, id + 1); }
      (g.bh || []).forEach((b) => { const c = H.cm[b[0]]; if (c) c.hero = { x: uqx(b[1]), z: uqx(b[2]), yaw: b[3], hp: b[4] * this.botHp(c), max: this.botHp(c), mt: b[5], cd: 0, dead: 0 }; });
      for (const c of H.cm) if (c.k === 'b' && !c.hero) c.hero = this.newBotHero(c, H);
      return H;
    },
    botHp(c) { return CLASSES[c.cls].hp + 60; },
    newBotHero(c, H) { const cp = campOf(c.team, H.obj); return { x: cp[0] + (Math.random() - 0.5) * 8, z: cp[1] + (Math.random() - 0.5) * 6, yaw: c.team === 0 ? 0 : Math.PI, hp: this.botHp(c), max: this.botHp(c), mt: 1, cd: 0, dead: 0, ord: 1, an: null }; },
    ev(H, e) { H.evs = (H.evs || 0) + 1; e.unshift(H.evs); H.ev.push(e); if (H.ev.length > 18) H.ev.shift(); this.playEv(e, true); },
    host(dt) {
      const H = this.H, pl = players();
      H.left = Math.max(0, H.left - dt);
      if (H.ph === 'lobby') { if (pl.length && H.left <= 0) this.startBattle(H, pl); }
      else if (H.ph === 'battle') {
        this.syncCommanders(H, pl);
        H.acc = (H.acc || 0) + dt;
        while (H.acc >= 0.1) { H.acc -= 0.1; this.step(H, 0.1, pl); }
        if (H.left <= 0 && H.ph === 'battle') this.endBattle(H, 1);
      } else if (H.ph === 'end' && H.left <= 0) Object.assign(H, { ph: 'lobby', left: 30, sol: [], cm: [], ev: [] });
      if (performance.now() - (this.sentAt || 0) > 160) { this.sentAt = performance.now(); this.publish(H); }
    },
    startBattle(H, pl) {
      const ps = pl.slice().sort(() => Math.random() - 0.5), cm = [];
      ps.slice(0, 6).forEach((p, i) => cm.push({ k: 'p', id: p.peer, nm: p.me ? Net.name : String(p.pr.nm || 'Player').slice(0, 20), team: i % 2, unit: p.me ? this.unitNow() : p.pr.cu | 0, ul: p.me ? (this.S.units[this.unitNow()] || {}).lvl || 1 : p.pr.ul || 1, cls: p.me ? this.S.cls : p.pr.cl | 0 }));
      const avg = Math.max(1, Math.round(ps.reduce((a, p) => a + (p.me ? levelOf(this.S.xp).L : p.pr.lv || 1), 0) / Math.max(1, ps.length)));
      let bi = Math.floor(Math.random() * BOT_NAMES.length);
      for (const team of [0, 1]) while (cm.filter((c) => c.team === team).length < 3) {
        const pool = UNITS.map((u, i) => i).filter((i) => UNITS[i].st <= 2 + Math.min(3, Math.floor(avg / 4) + 1));
        cm.push({ k: 'b', id: 'bot' + cm.length, nm: '🤖 ' + BOT_NAMES[bi++ % BOT_NAMES.length], team, unit: pool[Math.floor(Math.random() * pool.length)], ul: Math.min(10, avg), cls: Math.floor(Math.random() * 3) });
      }
      cm.forEach((c) => { c.sc = { k: 0, d: 0, hk: 0, cap: 0, score: 0, st: 0, stT: 0 }; c.hero = c.k === 'b' ? this.newBotHero(c, H) : null; c.ord = 1; });
      Object.assign(H, { ph: 'battle', left: ROUND_S, obj: 0, prog: 0, cm, sol: [], sid: 1, ev: [], seen: {}, ranked: Net.srvN >= 5, refill: {} });
      cm.forEach((c, ci) => this.fillArmy(H, ci, true));
      this.ev(H, ['start']);
    },
    fillArmy(H, ci, full) {
      const c = H.cm[ci], U = UNITS[c.unit], have = H.sol.filter((s) => s.ci === ci).length, cp = campOf(c.team, H.obj);
      const pos = full ? { x: cp[0], z: cp[1] } : (c.k === 'b' ? c.hero : this.heroPos(H, ci)) || { x: cp[0], z: cp[1] };
      for (let i = have; i < (full ? U.cnt : have + 1) && i < U.cnt; i++) H.sol.push({ id: H.sid++ % 4000, ci, x: pos.x + (Math.random() - 0.5) * 6, z: pos.z + (c.team === 0 ? 4 : -4) + (Math.random() - 0.5) * 4, hp: U.hp * lvlMul(c.ul), cd: Math.random(), vx: 0, vz: 0, yaw: c.team === 0 ? 0 : Math.PI, rt: Math.random() * 0.5, tgt: null });
    },
    heroPos(H, ci) {
      const c = H.cm[ci]; if (!c) return null;
      if (c.k === 'b') return c.hero && !c.hero.dead ? c.hero : null;
      const p = players().find((q) => q.peer === c.id); if (!p) return null;
      const alive = p.me ? !P.dead : !(p.pr.hpf <= 0);
      return alive ? { x: p.x, z: p.z, yaw: p.me ? P.yaw : (Array.isArray(p.pr.p) ? p.pr.p[3] : 0), pr: p.pr, me: p.me } : null;
    },
    // players who left become bots; new players take a bot's seat
    syncCommanders(H, pl) {
      const here = new Map(pl.map((p) => [p.peer, p]));
      H.cm.forEach((c, ci) => {
        if (c.k === 'p' && !here.has(c.id)) { c.k = 'b'; c.nm = '🤖 ' + c.nm.replace(/^🤖 /, ''); c.hero = this.newBotHero(c, H); this.ev(H, ['left', ci]); }
      });
      for (const p of pl) {
        if (H.cm.some((c) => c.k === 'p' && c.id === p.peer)) continue;
        const counts = [0, 1].map((t) => H.cm.filter((c) => c.team === t && c.k === 'p').length), team = counts[0] <= counts[1] ? 0 : 1;
        const ci = H.cm.findIndex((c) => c.k === 'b' && c.team === team) >= 0 ? H.cm.findIndex((c) => c.k === 'b' && c.team === team) : H.cm.findIndex((c) => c.k === 'b');
        if (ci < 0) continue;
        const c = H.cm[ci]; H.sol = H.sol.filter((s) => s.ci !== ci);
        Object.assign(c, { k: 'p', id: p.peer, nm: p.me ? Net.name : String(p.pr.nm || 'Player').slice(0, 20), unit: p.me ? this.unitNow() : p.pr.cu | 0, ul: p.pr.ul || 1, cls: p.pr.cl | 0, hero: null });
        this.fillArmy(H, ci, true); this.ev(H, ['joined', ci]);
      }
      // what players asked for: hits, deaths, unit changes
      for (const p of pl) {
        const ci = H.cm.findIndex((c) => c.k === 'p' && c.id === p.peer); if (ci < 0) continue;
        const c = H.cm[ci], seen = H.seen[p.peer] || { t: 0, h: 0, d: 0 };
        if (p.pr.t !== seen.t) { seen.t = p.pr.t; seen.h = 0; seen.d = 0; }
        const hits = p.me ? this.hits : p.pr.ht, deaths = p.me ? this.deaths : p.pr.dth;
        for (const h of Array.isArray(hits) ? hits : []) { if (!Array.isArray(h) || !(h[0] > seen.h)) continue; seen.h = h[0]; this.applyHit(H, ci, h[1], h[2], clamp(+h[3] || 0, 0, 200)); }
        for (const d of Array.isArray(deaths) ? deaths : []) { if (!Array.isArray(d) || !(d[0] > seen.d)) continue; seen.d = d[0]; c.sc.d++; const k = H.cm[d[1]]; if (k && k.team !== c.team) { k.sc.hk++; k.sc.score += 25; this.ev(H, ['k', d[1], ci]); } }
        H.seen[p.peer] = seen;
        const cu = p.me ? this.unitNow() : p.pr.cu | 0;
        if (cu !== c.unit && UNITS[cu]) {
          // switching units happens in camp
          const hp = this.heroPos(H, ci), cp = campOf(c.team, H.obj);
          if (hp && Math.hypot(hp.x - cp[0], hp.z - cp[1]) < CAMP_R) { c.chg = c.chg && c.chg.u === cu ? c.chg : { u: cu, t: 3 }; }
        }
      }
    },
    applyHit(H, ci, kind, id, dmg) {
      const c = H.cm[ci]; if (!c) return;
      if (kind === 's') { const s = H.sol.find((q) => q.id === id); if (!s || H.cm[s.ci].team === c.team) return; this.damageSoldier(H, s, dmg, ci); }
      else if (kind === 'h') {
        const v = H.cm[id]; if (!v || v.team === c.team) return;
        if (v.k === 'b') this.damageBot(H, id, dmg, ci); else this.ev(H, ['h', id, Math.round(dmg), ci]);
      }
    },
    damageSoldier(H, s, dmg, by) {
      const U = UNITS[H.cm[s.ci].unit];
      s.hp -= dmg * (1 - (U.armor || 0));
      if (s.hp > 0) return;
      H.sol.splice(H.sol.indexOf(s), 1);
      const k = H.cm[by]; if (!k) return;
      k.sc.k++; k.sc.score += 2;
      const t = H.left; if (t - (k.sc.stT || 0) < -0.001 || (k.sc.stT || 0) - t > 6) k.sc.st = 0;
      k.sc.st++; k.sc.stT = t;
      const hitS = STREAKS.find((x) => x[0] === k.sc.st); if (hitS) this.ev(H, ['st', by, hitS[1]]);
    },
    damageBot(H, ci, dmg, by) {
      const c = H.cm[ci], h = c.hero; if (!h || h.dead) return;
      h.hp -= dmg * (h.blk ? 0.5 : 1);
      if (h.hp > 0) return;
      h.dead = 8; c.sc.d++;
      const k = H.cm[by]; if (k) { k.sc.hk++; k.sc.score += 25; }
      this.ev(H, ['k', by, ci]);
    },
    // one step of the battle (10 a second)
    step(H, dt, pl) {
      const cmPos = H.cm.map((c, ci) => this.heroPos(H, ci));
      // orders for players come from their presence; bots decide their own
      H.cm.forEach((c, ci) => {
        if (c.k === 'p') { const p = cmPos[ci] && cmPos[ci].pr; if (p) { c.ord = p.od | 0; c.fm = p.fm | 0; c.an = Array.isArray(p.an) ? p.an : null; c.rp = Array.isArray(p.rp) ? p.rp : null; c.sk = clamp(p.sk | 0, 0, 3); } }
        else this.botThink(H, ci, cmPos, dt);
      });
      // unit changes and refills at camp
      H.cm.forEach((c, ci) => {
        const hp = cmPos[ci], cp = campOf(c.team, H.obj), inCamp = hp && Math.hypot(hp.x - cp[0], hp.z - cp[1]) < CAMP_R;
        if (c.chg) { if (!inCamp) c.chg = null; else if ((c.chg.t -= dt) <= 0) { H.sol = H.sol.filter((s) => s.ci !== ci); c.unit = c.chg.u; c.ul = c.k === 'p' && cmPos[ci] && cmPos[ci].pr ? cmPos[ci].pr.ul || 1 : c.ul; c.chg = null; this.ev(H, ['chg', ci, c.unit]); } }
        if (inCamp) { H.refill[ci] = (H.refill[ci] || 0) + dt; if (H.refill[ci] > 0.35) { H.refill[ci] = 0; this.fillArmy(H, ci, false); } }
      });
      // soldiers
      const sols = H.sol, heroes = H.cm.map((c, ci) => (cmPos[ci] ? { ci, team: c.team, x: cmPos[ci].x, z: cmPos[ci].z } : null)).filter(Boolean);
      const byCi = {}; for (const s of sols) (byCi[s.ci] = byCi[s.ci] || []).push(s);
      const gateOpen = H.obj >= 2;
      for (const s of sols.slice()) {
        if (!H.sol.includes(s)) continue;
        const c = H.cm[s.ci], U = UNITS[c.unit], hp = cmPos[s.ci], mine = byCi[s.ci], idx = mine.indexOf(s);
        // pick a target now and then
        s.rt -= dt;
        if (s.rt <= 0) {
          s.rt = 0.5 + Math.random() * 0.2;
          const ord = c.ord, centre = ord === 2 && hp ? hp : s, reach = ord === 2 ? 30 : ord === 3 ? 16 : U.ranged ? U.rng : 9;
          let best = null, bd = 1e9;
          for (const o of sols) { if (H.cm[o.ci].team === c.team) continue; if (c.team === 0 && !gateOpen && inFort(o.x, o.z)) continue; const d = Math.hypot(o.x - centre.x, o.z - centre.z); if (d < reach && d < bd) { bd = d; best = o; } }
          for (const o of heroes) { if (o.team === c.team) continue; if (c.team === 0 && !gateOpen && inFort(o.x, o.z)) continue; const d = Math.hypot(o.x - centre.x, o.z - centre.z); if (d < reach && d < bd) { bd = d; best = { hero: o.ci }; } }
          s.tgt = best && best.hero != null ? { hero: best.hero } : best ? { id: best.id } : null;
        }
        let tx, tz, tp = null;
        if (s.tgt) {
          if (s.tgt.hero != null) { const h = cmPos[s.tgt.hero]; tp = h ? { x: h.x, z: h.z, hero: s.tgt.hero } : null; }
          else { const o = sols.find((q) => q.id === s.tgt.id); tp = o && H.sol.includes(o) ? o : null; }
          if (!tp) s.tgt = null;
        }
        if (tp) { tx = tp.x; tz = tp.z; }
        else {
          // formation slot
          const f = c.fm | 0, base = c.ord === 1 && c.an ? { x: c.an[0], z: c.an[1], yaw: c.an[2] } : c.ord === 3 && c.rp ? { x: c.rp[0], z: c.rp[1], yaw: c.rp[2] } : hp ? { x: hp.x, z: hp.z, yaw: hp.yaw || 0 } : { x: s.x, z: s.z, yaw: 0 };
          const per = f === 2 ? 10 : 5, row = f === 1 ? Math.floor((Math.sqrt(8 * idx + 1) - 1) / 2) : Math.floor(idx / per), col = f === 1 ? idx - (row * (row + 1)) / 2 - row / 2 : (idx % per) - (per - 1) / 2;
          const lx = col * 1.9, lz = (row + 1) * 2 + (c.ord === 3 ? -6 : 0), cy = Math.cos(base.yaw), sy = Math.sin(base.yaw);
          tx = base.x + lx * cy + lz * sy; tz = base.z - lx * sy + lz * cy;
        }
        // through the gate, not the walls
        const wantIn = inFort(tx, tz), isIn = inFort(s.x, s.z);
        if (wantIn !== isIn && Math.abs(s.x) > 5 && (c.team === 1 || gateOpen)) { tx = 0; tz = GATE_Z + (isIn ? -3 : 3); }
        if (c.team === 0 && !gateOpen && wantIn && !isIn) { tx = s.x; tz = Math.max(s.z, GATE_Z + 3); }
        const dx = tx - s.x, dz = tz - s.z, d = Math.hypot(dx, dz), range = tp ? (U.ranged ? U.rng : U.rng + (tp.hero != null ? 1 : 0.6)) : 0.4;
        let vx = 0, vz = 0;
        if (d > range) { const sp = U.sp * (tp ? 1 : Math.min(1.25, 0.6 + d / 8)); vx = (dx / d) * sp; vz = (dz / d) * sp; }
        // don't stand in each other
        for (const o of mine) { if (o === s) continue; const ox = s.x - o.x, oz = s.z - o.z, od = ox * ox + oz * oz; if (od < 2.6 && od > 1e-4) { const k = (2.6 - od) * 2.2; vx += ox * k; vz += oz * k; } }
        s.vx = vx; s.vz = vz; s.x += vx * dt; s.z += vz * dt;
        s.x = clamp(s.x, -118, 118); s.z = clamp(s.z, -185, 185);
        if (inFort(s.x, s.z) && !isIn && Math.abs(s.x) > 6 && Math.abs(s.z - GATE_Z) < 2) s.z = GATE_Z + 1.5; // walls
        if (Math.hypot(vx, vz) > 0.5) s.yaw = Math.atan2(-vx, -vz);
        if (tp) s.yaw = Math.atan2(-(tp.x - s.x), -(tp.z - s.z));
        s.atk = Math.max(0, (s.atk || 0) - dt);
        s.cd -= dt;
        if (tp && d <= range + 0.3 && s.cd <= 0) {
          s.cd = U.cd * (0.85 + Math.random() * 0.3); s.atk = 0.3;
          if (U.ranged && Math.random() > 0.75) continue;
          let dmg = U.dmg * lvlMul(c.ul) * (1 + 0.08 * (c.sk || 0));
          if (tp.hero != null) {
            const v = H.cm[tp.hero];
            if (U.antiCav) dmg *= 1.5;
            if (v.k === 'b') this.damageBot(H, tp.hero, dmg, s.ci); else { const a = (H.hitAcc = H.hitAcc || {})[tp.hero] || (H.hitAcc[tp.hero] = { d: 0, by: s.ci }); a.d += dmg; }
          } else {
            const VU = UNITS[H.cm[tp.ci].unit]; if (U.antiCav && VU.cav) dmg *= U.antiCav;
            this.damageSoldier(H, tp, dmg, s.ci);
          }
        }
      }
      for (const k in H.hitAcc || {}) this.ev(H, ['h', +k, Math.round(H.hitAcc[k].d), H.hitAcc[k].by]);
      H.hitAcc = {};
      // the objective
      if (H.obj < 3) {
        const p = POINTS[H.obj], near = [0, 0];
        for (const s of H.sol) if (Math.hypot(s.x - p.x, s.z - p.z) < POINT_R) near[H.cm[s.ci].team]++;
        for (const h of heroes) if (Math.hypot(h.x - p.x, h.z - p.z) < POINT_R) near[h.team] += 3;
        if (near[0] && !near[1]) H.prog = Math.min(100, H.prog + dt * (4 + Math.min(20, near[0]) * 0.45));
        else if (near[1] && !near[0]) H.prog = Math.max(0, H.prog - dt * 8);
        H.contested = near[0] && near[1] ? 1 : 0;
        if (H.prog >= 100) {
          for (const c of H.cm) if (c.team === 0) { const hp = cmPos[H.cm.indexOf(c)]; if (hp && Math.hypot(hp.x - p.x, hp.z - p.z) < POINT_R * 1.6) { c.sc.cap++; c.sc.score += 50; } }
          H.obj++; H.prog = 0; H.left += CAP_BONUS;
          this.ev(H, ['cap', H.obj - 1]);
          if (H.obj >= 3) this.endBattle(H, 0);
        }
      }
      // bot heroes
      H.cm.forEach((c, ci) => { if (c.k === 'b') this.botBody(H, ci, cmPos, dt); });
    },
    botThink(H, ci, cmPos, dt) {
      const c = H.cm[ci], h = c.hero; if (!h) return;
      if (h.dead) { h.dead -= dt; if (h.dead <= 0) Object.assign(h, this.newBotHero(c, H)); return; }
      const mine = H.sol.filter((s) => s.ci === ci).length, U = UNITS[c.unit], cp = campOf(c.team, H.obj), p = POINTS[Math.min(2, H.obj)];
      // go back for more soldiers when the army is nearly gone
      if (mine < U.cnt * 0.25 && !h.goCamp) h.goCamp = true; if (h.goCamp && mine >= U.cnt * 0.9) h.goCamp = false;
      let goal;
      if (h.goCamp) { goal = { x: cp[0], z: cp[1] }; c.ord = 1; c.an = null; }
      else if (c.team === 0) { goal = { x: p.x + ((ci % 3) - 1) * 6, z: p.z + 10 }; c.ord = Math.hypot(h.x - p.x, h.z - p.z) < 45 ? 2 : 1; }
      else { goal = { x: p.x + ((ci % 3) - 1) * 7, z: p.z - 4 }; const enemyNear = H.sol.some((s) => H.cm[s.ci].team === 0 && Math.hypot(s.x - p.x, s.z - p.z) < 30); c.ord = enemyNear ? 2 : 1; c.an = null; }
      h.goal = goal; c.fm = 0;
    },
    botBody(H, ci, cmPos, dt) {
      const c = H.cm[ci], h = c.hero; if (!h || h.dead) return;
      const C = CLASSES[c.cls];
      // fight anything close
      let tgt = null, td = 6;
      for (const s of H.sol) { if (H.cm[s.ci].team === c.team) continue; const d = Math.hypot(s.x - h.x, s.z - h.z); if (d < td) { td = d; tgt = s; } }
      for (let k = 0; k < H.cm.length; k++) { const o = cmPos[k]; if (!o || H.cm[k].team === c.team) continue; const d = Math.hypot(o.x - h.x, o.z - h.z); if (d < td) { td = d; tgt = { hero: k, x: o.x, z: o.z }; } }
      let gx = h.goal ? h.goal.x : h.x, gz = h.goal ? h.goal.z : h.z;
      if (tgt) { gx = tgt.x; gz = tgt.z; h.mt = 0; } else if (Math.hypot(gx - h.x, gz - h.z) > 25) h.mt = 1;
      if (c.team === 0 && H.obj < 2 && inFort(gx, gz)) gz = Math.max(gz, GATE_Z + 3);
      const dx = gx - h.x, dz = gz - h.z, d = Math.hypot(dx, dz), sp = h.mt ? 26 : C.sp * 0.9;
      if (d > (tgt ? 2.6 : 2)) { h.x += (dx / d) * Math.min(sp * dt, d); h.z += (dz / d) * Math.min(sp * dt, d); h.yaw = Math.atan2(-dx, -dz); h.anim = 1; } else h.anim = 0;
      h.cd -= dt; h.atk = Math.max(0, (h.atk || 0) - dt);
      if (tgt && td < 3.4 && h.cd <= 0) {
        h.cd = C.cd * 1.4; h.atk = 0.3;
        const dmg = C.dmg * 0.8;
        if (tgt.hero != null) { const v = H.cm[tgt.hero]; if (v.k === 'b') this.damageBot(H, tgt.hero, dmg, ci); else this.ev(H, ['h', tgt.hero, Math.round(dmg), ci]); }
        else this.damageSoldier(H, tgt, dmg, ci);
      }
    },
    endBattle(H, winner) {
      H.ph = 'end'; H.left = 12; H.win = winner;
      const mvp = [0, 1].map((t) => { const list = H.cm.map((c, ci) => [ci, c]).filter(([, c]) => c.team === t).sort((a, b) => b[1].sc.score - a[1].sc.score); return list[0] ? list[0][0] : -1; });
      H.mvp = mvp;
      this.ev(H, ['end', winner]);
    },
    publish(H) {
      H.gs = (H.gs || 0) + 1;
      let s = '';
      if (H.ph === 'battle') for (const q of H.sol.slice(0, 150)) { const c = H.cm[q.ci], U = UNITS[c.unit]; s += AL[q.ci] + n2(q.id) + n2(qx(q.x)) + n2(qx(q.z)) + AL[clamp(Math.round((q.hp / (U.hp * lvlMul(c.ul))) * 63), 0, 63)] + AL[(q.atk > 0 ? 1 : 0) | (Math.hypot(q.vx, q.vz) > 1 ? 2 : 0) | (Math.round(((q.yaw % 6.283) + 6.283) % 6.283 / 6.283 * 15) << 2)]; }
      const bh = H.ph === 'battle' ? H.cm.map((c, ci) => (c.k === 'b' && c.hero ? [ci, qx(c.hero.x), qx(c.hero.z), +c.hero.yaw.toFixed(2), c.hero.dead ? 0 : +(c.hero.hp / c.hero.max).toFixed(2), c.hero.mt ? 1 : 0, (c.hero.anim ? 1 : 0) | (c.hero.atk > 0 ? 2 : 0)] : null)).filter(Boolean) : [];
      send({ g: { ph: H.ph, left: +H.left.toFixed(1), gs: H.gs, obj: H.obj, prog: +(H.prog || 0).toFixed(1), ct: H.contested || 0, rk: H.ranked ? 1 : 0, cm: (H.cm || []).map((c) => [c.k, c.id, c.nm, c.team, c.unit, c.ul, c.cls, c.chg ? +c.chg.t.toFixed(1) : null]), sc: (H.cm || []).map((c) => ({ k: c.sc.k, d: c.sc.d, hk: c.sc.hk, cap: c.sc.cap, score: c.sc.score })), s, bh, ev: H.ev.slice(), evs: H.evs, win: H.win, mvp: H.mvp } });
    },
    // ---------------------------------------------------------------- what everyone sees and does
    // the host's own state, in the shape everyone else gets
    hostView(H) {
      const bh = H.ph === 'battle' ? H.cm.map((c, ci) => (c.k === 'b' && c.hero ? [ci, qx(c.hero.x), qx(c.hero.z), +(c.hero.yaw || 0).toFixed(2), c.hero.dead ? 0 : c.hero.hp / c.hero.max, c.hero.mt ? 1 : 0, (c.hero.anim ? 1 : 0) | (c.hero.atk > 0 ? 2 : 0)] : null)).filter(Boolean) : [];
      return { ph: H.ph, left: H.left, gs: H.gs, obj: H.obj, prog: H.prog || 0, ct: H.contested || 0, rk: H.ranked ? 1 : 0, cm: H.cm, sc: (H.cm || []).map((c) => c.sc), sol: H.sol, bh, ev: H.ev, evs: H.evs, win: H.win, mvp: H.mvp };
    },
    tick(dt) {
      let g = roundState(this);
      if (g && iAmHost() && this.H) g = this.hostView(this.H);
      this.g = g;
      if (!g) { setBanner('Joining the battle…'); return; }
      const me = myPeer(), ci = (g.cm || []).findIndex((c) => c[1] === me || c.id === me);
      this.ci = ci;
      const cmRow = ci >= 0 ? g.cm[ci] : null, team = cmRow ? (Array.isArray(cmRow) ? cmRow[3] : cmRow.team) : -1;
      if (g.ph === 'battle' && ci >= 0 && this.team !== team) { this.team = team; P.team = team; this.hp = 1; this.mounted = true; this.ord = 1; this.anchor = null; this.rush = null; respawn(); toast(team === 0 ? '⚔️ You attack! Capture A, then B, then the base' : '🛡️ You defend! Hold them off until time runs out', TEAM_CSS[team]); closePanel(); }
      if (g.ph !== 'battle' && this.team !== -1) { this.team = -1; P.team = -1; this.mounted = true; this.hp = 1; }
      // after a battle everyone goes back to the courtyard, where the MVPs stand on the podium until the next one
      if (g.ph !== 'battle' && P.z < LOBBY[1] - 40 && !P.dead) respawn(true);
      if (g.ph === 'end' && Array.isArray(g.mvp)) this.mvpKeep = { mvp: g.mvp.slice(), names: g.mvp.map((ci) => { const I = this.cmInfo(g, ci); return I ? I.nm : ''; }) };
      if (g.ph === 'battle') this.mvpKeep = null;
      this.events(g);
      this.hero(dt, g);
      this.drawWorld(g, dt);
      this.drawUI(g);
      this.sendMe();
      if (g.ph === 'end' && this.shownEnd !== g.gs && this.lastPh === 'battle') this.results(g);
      this.lastPh = g.ph;
    },
    // events from the host: hits on me, kills, captures, streaks
    events(g) {
      const evs = Array.isArray(g.ev) ? g.ev : [], from = iAmHost() ? 'me' : (crew()[0] || {}).peer;
      if (this.evFrom !== from) { this.evFrom = from; this.evN = evs.reduce((m, e) => Math.max(m, e[0] || 0), 0); return; }
      for (const e of evs) { if (!(e[0] > this.evN)) continue; this.evN = e[0]; if (!iAmHost()) this.playEv(e, false); }
    },
    playEv(e, local) {
      const g = this.g || this.H, cm = g && g.cm, name = (ci) => { const c = cm && cm[ci]; return c ? (Array.isArray(c) ? c[2] : c.nm) : '?'; }, teamOf = (ci) => { const c = cm && cm[ci]; return c ? (Array.isArray(c) ? c[3] : c.team) : 0; };
      const [, k] = e, mineCi = this.ci;
      if (k === 'h' && e[2] === mineCi && !P.dead) this.takeHit(e[3], e[4]);
      else if (k === 'k') { say(`☠️ ${name(e[2])} defeated ${name(e[3])}`, TEAM_CSS[teamOf(e[2])]); if (e[2] === mineCi) this.popup('+25 XP · hero down', '#fde68a'); }
      else if (k === 'st' && e[2] === mineCi) this.popup(e[3], '#f87171', true);
      else if (k === 'cap') { const n = POINTS[e[2]].n; toast(e[2] === 2 ? '🏰 Base captured!' : `🚩 Point ${n} captured! +2:00`, TEAM_CSS[0]); if (e[2] === 1) say('🚪 Gate breached!', '#fde68a'); }
      else if (k === 'start') { say('⚔️ The battle has begun!', '#fde68a'); }
      else if (k === 'left') say(`${name(e[2])} left — a bot takes command`, '#9ca3af');
      else if (k === 'joined') say(`${name(e[2])} joined the battle`, '#9ca3af');
      else if (k === 'chg' && e[2] === mineCi) toast(`Now commanding ${UNITS[e[3]].n}`, '#86efac');
    },
    takeHit(dmg, from) {
      const st = this.stats();
      if (this.rollT > 0) return;
      const real = dmg * (this.blocking ? 1 - st.block : 1);
      this.hp -= real / st.maxHp;
      this.floatDmg(P.x, P.y + 5, P.z, Math.round(real), '#f87171');
      if (this.hp <= 0) { this.hp = 0; this.deaths.push([++this.dn, from]); if (this.deaths.length > 8) this.deaths.shift(); send({ dth: this.deaths.slice() }); die(); toast('You were defeated — back to camp in 6s', '#fca5a5'); }
    },
    // my hero: abilities, cooldowns, healing
    hero(dt, g) {
      const st = this.stats();
      this.cdA = Math.max(0, this.cdA - dt); this.cdRoll = Math.max(0, this.cdRoll - dt); this.cdHeal = Math.max(0, this.cdHeal - dt); this.rollT = Math.max(0, this.rollT - dt);
      if (this.healT > 0) { this.healT -= dt; this.hp = Math.min(1, this.hp + dt * 0.35 / 3); }
      if (P.dead) { this.hp = 0; return; }
      if (this.hp <= 0) this.hp = 1; // came back to life
      // the horse under me
      if (me) {
        let hz = me.g.userData.horse;
        if (this.mounted && g.ph === 'battle' && !hz) { hz = horseModel(MOUNTS[this.S.mount].c, MOUNTS[this.S.mount].armor); me.g.add(hz); me.g.userData.horse = hz; }
        if ((!this.mounted || g.ph !== 'battle') && hz) { me.g.remove(hz); me.g.userData.horse = null; hz = null; }
        me.body.position.y = hz ? 2.6 : 0;
        if (hz) { const sp = Math.hypot(P.vx, P.vz), w = performance.now() / 90; hz.userData.legs.forEach((l, i) => (l.rotation.x = sp > 1 ? Math.sin(w + (i % 2 ? Math.PI : 0) + (i > 1 ? 1.5 : 0)) * 0.7 : 0)); me.legL.rotation.x = 0.9; me.legR.rotation.x = 0.9; }
        setGlow(me, this.blocking ? 0x1e3a8a : null);
      }
      if (this.rollT > 0) { P.vx = this.rollV[0]; P.vz = this.rollV[1]; }
    },
    speed() { const g = this.g; if (!g || g.ph !== 'battle') return 18; const st = this.stats(); return st.sp * (this.blocking ? 0.5 : 1); },
    attack() {
      const g = this.g; if (!g || g.ph !== 'battle' || P.dead || this.cdA > 0 || this.ci < 0) return;
      const st = this.stats(); this.cdA = st.cd;
      P.yaw = cam.yaw;
      if (me) { me.armR.rotation.x = -2.4; }
      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), reach = this.mounted ? 5.5 : 4.2, targets = [];
      const charge = this.mounted && Math.hypot(P.vx, P.vz) > 15 ? 1.35 : 1;
      for (const s of this.solList || []) { if (s.team === this.team) continue; const dx = s.x - P.x, dz = s.z - P.z, d = Math.hypot(dx, dz); if (d < reach && (dx * fx + dz * fz) / (d || 1) > 0.2) targets.push({ k: 's', id: s.id, d, x: s.x, z: s.z }); }
      for (const h of this.heroList || []) { if (h.team === this.team || h.dead) continue; const dx = h.x - P.x, dz = h.z - P.z, d = Math.hypot(dx, dz); if (d < reach + 0.6 && (dx * fx + dz * fz) / (d || 1) > 0.2) targets.push({ k: 'h', id: h.ci, d, x: h.x, z: h.z }); }
      targets.sort((a, b) => a.d - b.d);
      for (const t of targets.slice(0, st.hits)) {
        const dmg = Math.round(st.dmg * charge * (0.9 + Math.random() * 0.2));
        this.hits.push([++this.hn, t.k, t.id, dmg]); if (this.hits.length > 16) this.hits.shift();
        this.floatDmg(t.x, 4, t.z, dmg, '#fde68a');
      }
      if (targets.length) send({ ht: this.hits.slice() });
    },
    floatDmg(x, y, z, n, col) {
      const l = label(String(n), { size: 0.9, color: col }); l.position.set(x + (Math.random() - 0.5), y, z + (Math.random() - 0.5)); place.add(l);
      this.dmgFx.push({ l, life: 0.8 });
    },
    popup(text, col, big) {
      const el = document.createElement('div');
      el.textContent = text; el.style.cssText = `position:absolute;left:50%;top:${big ? 34 : 44}%;transform:translateX(-50%) rotate(-4deg);font:900 ${big ? 46 : 22}px "Segoe UI",sans-serif;color:${col};text-shadow:0 3px 0 #000,0 0 18px rgba(0,0,0,.5);pointer-events:none;transition:opacity .6s,transform .6s;white-space:nowrap`;
      $('#xhud').append(el);
      setTimeout(() => { el.style.opacity = 0; el.style.transform = 'translateX(-50%) translateY(-30px) rotate(-4deg)'; }, 1300); setTimeout(() => el.remove(), 2000);
    },
    order(o) {
      if (this.ci < 0) return;
      this.ord = o;
      if (o === 1) this.anchor = [+P.x.toFixed(1), +P.z.toFixed(1), +P.yaw.toFixed(2)];
      if (o === 3) { const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw); this.rush = [+(P.x + fx * 40).toFixed(1), +(P.z + fz * 40).toFixed(1), +cam.yaw.toFixed(2)]; }
      toast(['', 'Hold Position', 'Attack!', 'Charge!', 'Follow Me'][o === 0 ? 4 : o], '#fde68a');
      this.sendMe(true); this.drawOrders();
    },
    key(code, down) {
      const g = this.g;
      if (code === 'KeyF') { this.blocking = down && g && g.ph === 'battle'; return true; }
      if (!down) return false;
      if (code === 'Tab') { this.board = !this.board; this.drawBoard(); return true; }
      if (!g || g.ph !== 'battle') { const m = /^Digit([1-4])$/.exec(code); if (m && this.S.eq[+m[1] - 1] != null) { this.sel = +m[1] - 1; this.sendMe(true); this.drawMenu(); return true; } return false; }
      const map = { KeyX: 1, KeyC: 0, KeyV: 2, KeyB: 3 };
      if (code in map) { this.order(map[code]); return true; }
      if (code === 'KeyZ') { this.form = (this.form + 1) % 3; toast(['Block formation', 'Wedge formation', 'Line formation'][this.form]); this.sendMe(true); this.drawOrders(); return true; }
      if (code === 'KeyG') { this.mounted = !this.mounted; toast(this.mounted ? '🐴 Mounted' : 'On foot'); return true; }
      if (code === 'KeyQ') { if (this.cdRoll <= 0 && !this.mounted && !P.dead) { this.cdRoll = 4; this.rollT = 0.35; const yaw = Math.hypot(P.vx, P.vz) > 1 ? Math.atan2(-P.vx, -P.vz) : P.yaw; this.rollV = [-Math.sin(yaw) * 30, -Math.cos(yaw) * 30]; } return true; }
      if (code === 'KeyH') { if (this.cdHeal <= 0 && !P.dead) { this.cdHeal = 25; this.healT = 3; toast('💚 Healing'); } return true; }
      const m = /^Digit([1-4])$/.exec(code);
      if (m && this.S.eq[+m[1] - 1] != null) { this.sel = +m[1] - 1; this.sendMe(true); toast(`Switching to ${UNITS[this.unitNow()].n} — stay in your camp`, '#fde68a'); return true; }
      return false;
    },
    press(btn, down) { if (btn === 2) this.blocking = down && this.g && this.g.ph === 'battle'; },
    click(e) { if (e.button === 0) this.attack(); },
    // ---------------------------------------------------------------- drawing the battle
    unpackSoldiers(g) {
      if (Array.isArray(g.sol)) return g.sol.map((s) => ({ id: s.id, ci: s.ci, x: s.x, z: s.z, hpf: s.hp / (UNITS[g.cm[s.ci].unit].hp * lvlMul(g.cm[s.ci].ul)), atk: s.atk > 0, mv: Math.hypot(s.vx, s.vz) > 1, yaw: s.yaw }));
      const out = [], ss = typeof g.s === 'string' ? g.s : '';
      for (let i = 0; i + 8 < ss.length + 1; i += 9) { const f = AL.indexOf(ss[i + 8]); out.push({ ci: AL.indexOf(ss[i]), id: d2(ss, i + 1), x: uqx(d2(ss, i + 3)), z: uqx(d2(ss, i + 5)), hpf: AL.indexOf(ss[i + 7]) / 63, atk: !!(f & 1), mv: !!(f & 2), yaw: ((f >> 2) / 15) * 6.283 }); }
      return out;
    },
    cmInfo(g, ci) { const c = g.cm[ci]; if (!c) return null; return Array.isArray(c) ? { k: c[0], id: c[1], nm: c[2], team: c[3], unit: c[4], ul: c[5], cls: c[6], chg: c[7] } : { k: c.k, id: c.id, nm: c.nm, team: c.team, unit: c.unit, ul: c.ul, cls: c.cls, chg: c.chg ? c.chg.t : null }; },
    drawWorld(g, dt) {
      const battle = g.ph === 'battle';
      // the gate falls when B is taken
      const gateUp = !battle || g.obj < 2;
      if (this.gate.on !== gateUp) { this.gate.on = gateUp; this.gate.m.visible = gateUp; }
      // objective markers
      POINTS.forEach((p, i) => {
        const done = battle && g.obj > i, cur = battle && g.obj === i;
        const col = done ? TEAM_COL[0] : cur ? (g.ct ? 0xfacc15 : TEAM_COL[1]) : 0xffffff;
        this.pointRings[i].material.color.set(col); this.pointFills[i].material.color.set(col); this.flags[i].material.color.set(done ? TEAM_COL[0] : TEAM_COL[1]);
        this.pointFills[i].material.opacity = cur ? 0.12 + (g.prog / 100) * 0.3 : 0.12;
      });
      // soldiers
      const sols = battle ? this.unpackSoldiers(g) : [], info = (g.cm || []).map((c, i) => this.cmInfo(g, i));
      this.solList = sols.map((s) => ({ id: s.id, x: s.x, z: s.z, team: info[s.ci] ? info[s.ci].team : 0 }));
      const keep = new Set(), now = performance.now();
      for (const s of sols) {
        keep.add(s.id);
        let v = this.sviews.get(s.id);
        if (!v) { v = { x: s.x, z: s.z, yaw: s.yaw, walk: Math.random() * 6 }; this.sviews.set(s.id, v); }
        const k = Math.min(1, dt * 7); v.x += (s.x - v.x) * k; v.z += (s.z - v.z) * k;
        let d = s.yaw - v.yaw; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; v.yaw += d * Math.min(1, dt * 10);
        v.s = s; v.walk += dt * (s.mv ? 11 : 0);
        if (s.atk && !v.firedAt) { v.firedAt = now; const I = info[s.ci], U = I && UNITS[I.unit]; if (U && U.ranged) this.arrow(v); }
        if (!s.atk) v.firedAt = 0;
      }
      for (const [id, v] of this.sviews) if (!keep.has(id)) { this.sviews.delete(id); if (battle) puffAt(v.x, 1.5, v.z, 0x7f1d1d, 3); }
      this.drawCrowd(info);
      // heroes: bots from the host, players from their own presence
      this.heroList = [];
      const bh = battle ? (Array.isArray(g.bh) ? g.bh : []) : [], seen = new Set();
      for (const b of bh) {
        const ci = b[0], I = info[ci]; if (!I) continue; seen.add(ci);
        const x = uqx(b[1]), z = uqx(b[2]);
        let v = this.bviews.get(ci);
        if (!v || v.nm !== I.nm) { if (v) dropAvatar(v.a); const a = makeAvatar([ci % 6, I.team === 0 ? 0 : 1, 2, [6, 15, 2][I.cls] || 6, 4], I.nm); a.tag.material.color.set(TEAM_CSS[I.team]); scene.add(a.g); v = { a, nm: I.nm, x, z }; this.bviews.set(ci, v); }
        const k = Math.min(1, dt * 8); v.x += (x - v.x) * k; v.z += (z - v.z) * k;
        v.a.g.position.set(v.x, 0, v.z); v.a.g.rotation.y = b[3];
        const dead = b[4] <= 0; v.a.g.visible = !dead;
        this.mountOn(v.a, b[5] && !dead, 0x8b5a2b, (b[6] & 1) === 1);
        if (b[6] & 2) v.a.armR.rotation.x = -2.2; else animateAvatar(v.a, dt, (b[6] & 1) === 1, false);
        placeShadow(v.a);
        this.heroList.push({ ci, x: v.x, z: v.z, team: I.team, dead });
      }
      for (const [ci, v] of this.bviews) if (!seen.has(ci)) { dropAvatar(v.a); this.bviews.delete(ci); }
      if (battle) for (const p of players()) {
        if (p.me) continue;
        const ci = info.findIndex((I) => I && I.k === 'p' && I.id === p.peer); if (ci < 0) continue;
        const a = Net.avatars.get(p.peer); if (!a) continue;
        this.mountOn(a, p.pr.mt && !(p.pr.hpf <= 0), MOUNTS[p.pr.mo | 0] ? MOUNTS[p.pr.mo | 0].c : 0x8b5a2b, a.anim === 1);
        if (a.tag) a.tag.material.color.set(TEAM_CSS[info[ci].team]);
        this.heroList.push({ ci, x: p.x, z: p.z, team: info[ci].team, dead: p.pr.hpf <= 0 });
      }
      else for (const a of Net.avatars.values()) this.mountOn(a, false);
      for (let i = this.dmgFx.length - 1; i >= 0; i--) { const f = this.dmgFx[i]; f.life -= dt; f.l.position.y += dt * 2; if (f.life <= 0) { place.remove(f.l); f.l.material.map.dispose(); this.dmgFx.splice(i, 1); } }
      // the podium after a battle (in the lobby)
      this.drawPodium(g);
    },
    mountOn(a, on, col, moving) {
      let hz = a.g.userData.horse;
      if (on && !hz) { hz = horseModel(col || 0x8b5a2b); a.g.add(hz); a.g.userData.horse = hz; }
      if (!on && hz) { a.g.remove(hz); a.g.userData.horse = null; hz = null; }
      a.body.position.y = hz ? 2.6 : 0;
      if (hz) { const w = performance.now() / 90; hz.userData.legs.forEach((l, i) => (l.rotation.x = moving ? Math.sin(w + (i % 2 ? Math.PI : 0) + (i > 1 ? 1.5 : 0)) * 0.7 : 0)); a.legL.rotation.x = 0.9; a.legR.rotation.x = 0.9; }
    },
    arrow(v) {
      const fx = -Math.sin(v.yaw), fz = -Math.cos(v.yaw), from = new THREE.Vector3(v.x, 2.5, v.z), to = new THREE.Vector3(v.x + fx * 18, 1.5, v.z + fz * 18);
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, to]), new THREE.LineBasicMaterial({ color: 0xe5e7eb }));
      place.add(l); setTimeout(() => { place.remove(l); l.geometry.dispose(); }, 120);
    },
    drawCrowd(info) {
      const C = this.crowd; let n = 0, nl = 0, nh = 0;
      const set = (m, i, x, y, z, sx, sy, sz, yaw, rx, col) => { dummy.position.set(x, y, z); dummy.rotation.set(rx || 0, yaw, 0, 'YXZ'); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); if (col != null && m.instanceColor) m.setColorAt(i, tmpC.set(col)); };
      const local = (v, lx, ly, lz) => { const c = Math.cos(v.yaw), s = Math.sin(v.yaw); return [v.x + lx * c + lz * s, ly, v.z - lx * s + lz * c]; };
      for (const v of this.sviews.values()) {
        if (n >= 160) break;
        const s = v.s, I = info[s.ci]; if (!I) continue;
        const U = UNITS[I.unit], team = TEAM_COL[I.team], up = U.cav ? 2.4 : 0, sw = Math.sin(v.walk) * 0.6, atk = s.atk ? -1.6 : -0.4;
        if (U.cav) { // the horse
          const hc = I.team === 0 ? 0x5b3a1e : 0x2b2b2b;
          let p = local(v, 0, 2.1, 0); set(C.horse, nh++, p[0], p[1], p[2], 1.3, 1.2, 3, v.yaw, 0, hc);
          p = local(v, 0, 3.2, -1.9); set(C.horse, nh++, p[0], p[1], p[2], 0.7, 0.8, 1.2, v.yaw, 0, hc);
          for (const [lx, lz, ph] of [[-0.4, -1.1, 0], [0.4, -1.1, Math.PI], [-0.4, 1.1, Math.PI], [0.4, 1.1, 0]]) { p = local(v, lx, 0.75, lz); set(C.horse, nh++, p[0], p[1], p[2], 0.3, 1.5, 0.3, v.yaw, Math.sin(v.walk + ph) * 0.6, hc); }
        } else for (const [lx, ph] of [[-0.25, 0], [0.25, Math.PI]]) { const p = local(v, lx, 0.7, 0); set(C.legs, nl++, p[0], p[1], p[2], 0.42, 1.4, 0.42, v.yaw, Math.sin(v.walk + ph) * 0.6 * (s.mv ? 1 : 0)); }
        let p = local(v, 0, 2 + up, 0); set(C.body, n, p[0], p[1], p[2], 1.1, 1.3, 0.6, v.yaw, 0, team);
        p = local(v, 0, 3.05 + up, 0); set(C.head, n, p[0], p[1], p[2], 0.7, 0.7, 0.7, v.yaw, 0);
        p = local(v, 0, 3.45 + up, 0); set(C.helm, n, p[0], p[1], p[2], 0.8, 0.3, 0.8, v.yaw, 0, U.c);
        const wl = U.w === 'spear' || U.w === 'lance' ? 3 : U.w === 'bow' ? 1.6 : 1.3;
        p = local(v, 0.65, 2.1 + up, -0.4); set(C.weapon, n, p[0], p[1], p[2], U.w === 'axe' ? 0.35 : 0.14, U.w === 'bow' ? 1.6 : 0.14, U.w === 'bow' ? 0.14 : wl, v.yaw, U.w === 'bow' ? 0 : atk * 0.5);
        if (U.shield) { p = local(v, -0.65, 2.1 + up, -0.2); set(C.shield, n, p[0], p[1], p[2], 0.12, 1.1, 0.9, v.yaw, 0, team); } else set(C.shield, n, 0, -50, 0, 0.01, 0.01, 0.01, 0, 0, team);
        n++;
      }
      for (const [k, cnt] of [['body', n], ['head', n], ['helm', n], ['weapon', n], ['shield', n], ['legs', nl], ['horse', nh]]) { const m = C[k]; m.count = cnt; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
    },
    drawPodium(g) {
      const K = this.mvpKeep, want = K ? K.names.join(',') : '';
      if (want === this.podSig) return;
      this.podSig = want;
      for (const o of this.podium) { if (o.a) dropAvatar(o.a); if (o.p) removeParts((p) => p === o.p); if (o.l) place.remove(o.l); }
      this.podium = [];
      if (!want) return;
      K.names.forEach((nm, t) => {
        const I = nm ? { nm } : null; if (!I) return;
        const x = LOBBY[0] + (t ? 9 : -9), z = LOBBY[1] - 18;
        const p = part({ x, y: 1.5, z, sx: 6, sy: 3, sz: 6, c: TEAM_COL[t] });
        const a = makeAvatar([3, t, 2, 15, 1], I.nm); a.g.position.set(x, 3, z); a.g.rotation.y = 0; scene.add(a.g);
        const l = label(`${t ? '🛡️ Defender' : '⚔️ Attacker'} MVP`, { size: 1.2, color: '#fde68a' }); l.position.set(x, 11, z); place.add(l);
        this.podium.push({ a, p, l });
      });
    },
    // ---------------------------------------------------------------- the screen
    drawUI(g) {
      const battle = g.ph === 'battle';
      if (g.ph === 'lobby') {
        setBanner(`⚔️ Next battle in ${Math.ceil(g.left)}s${g.rk || Net.srvN >= 5 ? ' · 🏆 Ranked server' : ''} — get your army ready`);
        if (!this.lobbyShown && !panelOpen()) { this.lobbyShown = true; this.openMenu('units'); }
      } else if (battle) {
        this.lobbyShown = false;
        const obj = POINTS[Math.min(2, g.obj)], me = this.ci >= 0 ? this.cmInfo(g, this.ci) : null;
        const verb = me && me.team === 1 ? 'Defend' : 'Capture';
        const bar = `<span style="display:inline-block;width:120px;height:10px;background:#374151;border-radius:5px;vertical-align:middle;margin:0 8px;overflow:hidden"><i style="display:block;height:100%;width:${g.prog}%;background:${g.ct ? '#facc15' : TEAM_CSS[0]}"></i></span>`;
        setBanner(`${mmss(g.left)} · ${verb} ${obj.n === 'Base' ? 'the Base' : 'Point ' + obj.n}${bar}${g.ct ? '⚔️ contested' : ''}`);
      } else setBanner(g.win === 0 ? '⚔️ The attackers win!' : '🛡️ The defenders win!');
      const sig = [g.ph, this.ci, this.ord, this.form, this.sel].join();
      if (sig !== this.uiSig) { this.uiSig = sig; this.drawOrders(); this.drawMenu(); }
      this.drawHeroBar(g);
      if (this.board) this.drawBoard();
    },
    drawOrders() {
      const g = this.g, battle = g && g.ph === 'battle' && this.ci >= 0;
      let el = document.getElementById('caOrders');
      if (!battle) { if (el) el.remove(); return; }
      if (!el) { el = document.createElement('div'); el.id = 'caOrders'; el.style.cssText = 'position:absolute;left:10px;top:120px;display:flex;flex-direction:column;gap:6px;pointer-events:auto'; $('#xhud').append(el); el.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.o) this.order(+b.dataset.o); if (b.dataset.f) { this.form = (this.form + 1) % 3; this.sendMe(true); this.drawOrders(); } }; }
      const O = [[1, '✋', 'Hold', 'X'], [0, '🏃', 'Follow', 'C'], [2, '⚔️', 'Attack', 'V'], [3, '🐎', 'Rush', 'B']];
      el.innerHTML = O.map(([o, e, n, k]) => `<button class="xslot ${this.ord === o ? 'on' : ''}" data-o="${o}" style="height:54px;min-width:70px"><span class="k">${k}</span><span class="e">${e}</span>${n}</button>`).join('')
        + `<button class="xslot" data-f="1" style="height:54px;min-width:70px"><span class="k">Z</span><span class="e">${['▦', '◭', '▬'][this.form]}</span>${['Block', 'Wedge', 'Line'][this.form]}</button>`;
    },
    drawHeroBar(g) {
      const battle = g.ph === 'battle' && this.ci >= 0;
      if (!battle) { if (this.barMode !== 'lobby') { this.barMode = 'lobby'; this.drawMenu(); } return; }
      this.barMode = 'battle';
      const st = this.stats(), mine = (this.solList || []).filter((s) => { const v = this.sviews.get(s.id); return v && v.s.ci === this.ci; }).length, U = UNITS[this.unitNow()], me = this.cmInfo(g, this.ci);
      const unitNow = me ? UNITS[me.unit] : U, cd = (v, max) => (v > 0 ? `<span class="n">${Math.ceil(v)}</span>` : '');
      const html = `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="width:300px;height:12px;background:#1f2937;border-radius:6px;overflow:hidden;border:2px solid rgba(255,255,255,.2)"><i style="display:block;height:100%;width:${Math.max(0, this.hp) * 100}%;background:linear-gradient(90deg,#dc2626,#f87171)"></i></div>
        <div style="display:flex;gap:6px">${[['⚔️', 'Attack', 'Click', this.cdA], ['🛡️', 'Block', 'F', 0], ['🌀', 'Roll', 'Q', this.cdRoll], ['💚', 'Heal', 'H', this.cdHeal], [this.mounted ? '🚶' : '🐴', this.mounted ? 'Dismount' : 'Mount', 'G', 0]].map(([e, n, k, c], i) => `<button class="xslot ${i === 1 && this.blocking ? 'on' : ''}" data-ab="${i}"><span class="k">${k}</span><span class="e">${e}</span>${n}${cd(c)}</button>`).join('')}
        <button class="xslot" data-ab="unit" title="${esc(unitNow.n)}" style="min-width:90px"><span class="e">${'⭐'.repeat(unitNow.st).slice(0, 10)}</span>${esc(unitNow.n)}<span class="n">${mine}/${unitNow.cnt}</span></button></div>
        ${me && me.chg != null ? `<div style="font-weight:800;color:#fde68a">Changing unit… ${Math.ceil(me.chg)}s (stay in camp)</div>` : mine < unitNow.cnt * 0.3 ? '<div style="font-weight:800;color:#fca5a5">☠️ Get more units at camp</div>' : ''}
      </div>`;
      if (html !== this.barHtml) { this.barHtml = html; setBar(html, (b) => { const a = b.dataset.ab; if (a === '0') this.attack(); else if (a === '2') this.key('KeyQ', true); else if (a === '3') this.key('KeyH', true); else if (a === '4') this.key('KeyG', true); else if (a === '1') { this.blocking = !this.blocking; } }); }
    },
    drawBoard() {
      const g = this.g; let el = document.getElementById('caBoard');
      if (!this.board || !g || !g.cm || !g.cm.length) { if (el) el.remove(); return; }
      if (!el) { el = document.createElement('div'); el.id = 'caBoard'; el.style.cssText = 'position:absolute;left:50%;top:120px;transform:translateX(-50%);display:flex;gap:14px;pointer-events:none'; $('#xhud').append(el); }
      const sc = g.sc || [], rows = (t) => g.cm.map((c, ci) => [this.cmInfo(g, ci), sc[ci] || {}, ci]).filter(([I]) => I.team === t).sort((a, b) => (b[1].score || 0) - (a[1].score || 0));
      const table = (t) => `<div style="background:rgba(17,18,20,.85);border-radius:12px;overflow:hidden;min-width:300px"><div style="background:${TEAM_CSS[t]};padding:6px 12px;font-weight:900">${t === 0 ? '⚔️ ATTACKERS' : '🛡️ DEFENDERS'}</div><table style="width:100%;font-size:13px;border-collapse:collapse"><tr style="color:#9ca3af"><td style="padding:4px 10px">Player</td><td>Kills</td><td>Heroes</td><td>Deaths</td><td>Score</td></tr>${rows(t).map(([I, s, ci]) => `<tr style="${ci === this.ci ? 'color:#7dd3fc;font-weight:800' : ''}"><td style="padding:4px 10px">${esc(I.nm)}</td><td>${s.k || 0}</td><td>${s.hk || 0}</td><td>${s.d || 0}</td><td>${s.score || 0}</td></tr>`).join('')}</table></div>`;
      el.innerHTML = table(0) + table(1);
    },
    // ---------------------------------------------------------------- the lobby menus (like the video's left-hand buttons)
    drawMenu() {
      const g = this.g;
      if (g && g.ph === 'battle' && this.ci >= 0) return;
      const S = this.S, lv = levelOf(S.xp);
      setBar(`<button class="xslot" data-m="units"><span class="e">🪖</span>Units</button><button class="xslot" data-m="summon"><span class="e">🎲</span>Summon</button><button class="xslot" data-m="classes"><span class="e">🗡️</span>Classes</button><button class="xslot" data-m="mount"><span class="e">🐴</span>Mount</button><button class="xslot" data-m="skills"><span class="e">🌳</span>Skills${skillPts(S) > 0 ? `<span class="n">${skillPts(S)}</span>` : ''}</button><button class="xslot" data-m="bp"><span class="e">🎖️</span>Pass</button><button class="xslot" data-m="quests"><span class="e">📜</span>Quests</button><button class="xslot" data-m="ranked"><span class="e">${tierOf(S.rating)[2]}</span>Ranked</button><button class="xslot" data-m="codes"><span class="e">🎟️</span>Codes</button>
        <div class="xslot" style="cursor:default;min-width:110px"><b style="font-size:13px">Lv ${lv.L}</b><span>💎 ${S.gems}</span></div>`, (b) => this.openMenu(b.dataset.m));
    },
    saveS() { kvSet('ca', this.S); this.drawMenu(); },
    give(r, why) {
      const S = this.S;
      if (r.gems) { S.gems += r.gems; }
      if (r.coins) earn(r.coins, why);
      if (r.unit != null) { const u = S.units[r.unit]; if (u) u.lvl = Math.min(10, u.lvl + 1); else S.units[r.unit] = { lvl: 1 }; }
      if (r.mount != null && !S.mounts.includes(r.mount)) S.mounts.push(r.mount);
      if (r.cos) grantCosmetic(r.cos[0], r.cos[1], why);
    },
    rewardText(r) { return r.gems ? `💎 ${r.gems}` : r.coins ? `🪙 ${r.coins}` : r.unit != null ? `${'⭐'.repeat(UNITS[r.unit].st)} ${UNITS[r.unit].n}` : r.mount != null ? `🐴 ${MOUNTS[r.mount].n}` : r.cos ? `🎩 ${COSMETICS[r.cos[0]].list[r.cos[1]]}` : ''; },
    openMenu(which) {
      const S = this.S, lv = levelOf(S.xp), self = this;
      const reopen = () => this.openMenu(which);
      let title = '', html = '', onClick = null;
      if (which === 'units') {
        title = '🪖 Units';
        html = `<p class="xp-note">Equip up to 4 units; in battle press 1–4 in your camp to switch. Duplicates from summons level a unit up (+6% health and damage per level).</p><div class="xp-grid">${UNITS.map((U, i) => { const own = S.units[i], on = S.eq.indexOf(i); return `<div class="xp-card ${on >= 0 ? 'on' : ''}" style="${own ? '' : 'opacity:.45'}"><b>${U.n}</b><span>${'⭐'.repeat(U.st)}${own ? ` · Lv ${own.lvl}` : ''}</span><span>❤️ ${Math.round(U.hp * lvlMul(own && own.lvl))} · ⚔️ ${Math.round(U.dmg * lvlMul(own && own.lvl))} · ×${U.cnt}</span><span>${U.ranged ? '🏹 ranged' : U.cav ? '🐎 cavalry' : U.antiCav ? '🔱 anti-cavalry' : U.armor ? '🛡️ armored' : '⚔️ melee'}</span>${own ? `<button class="xp-btn ${on >= 0 ? 'alt' : ''}" data-eq="${i}">${on >= 0 ? `Slot ${on + 1} · Remove` : 'Equip'}</button>` : '<span>Summon to unlock</span>'}</div>`; }).join('')}</div>`;
        onClick = (b) => { const i = +b.dataset.eq, at = S.eq.indexOf(i); if (at >= 0) { if (S.eq.length > 1) S.eq.splice(at, 1); } else { if (S.eq.length >= 4) S.eq.pop(); S.eq.push(i); } this.sel = Math.min(this.sel, S.eq.length - 1); this.saveS(); this.sendMe(true); reopen(); };
      } else if (which === 'summon') {
        title = '🎲 Summon — Standard Banner';
        html = `<div class="xp-row"><span>💎 <b>${S.gems}</b> gems</span><span>★2 55% · ★3 30% · ★4 12% · ★5 3%</span></div><p class="xp-note">Every 10-summon has at least one ★4 or better. Earn gems in battles, quests, codes and the battle pass.</p>
          <div style="display:flex;gap:8px"><button class="xp-btn" data-n="1" style="flex:1" ${S.gems < 50 ? 'disabled' : ''}>Summon ×1 — 💎50</button><button class="xp-btn gold" data-n="10" style="flex:1" ${S.gems < 450 ? 'disabled' : ''}>Summon ×10 — 💎450</button></div><div id="caSum" style="margin-top:10px"></div>`;
        onClick = (b) => {
          const n = +b.dataset.n, cost = n === 10 ? 450 : 50; if (S.gems < cost) return;
          S.gems -= cost; const got = [];
          for (let k = 0; k < n; k++) {
            const roll = Math.random(); let st = roll < 0.03 ? 5 : roll < 0.15 ? 4 : roll < 0.45 ? 3 : 2;
            if (n === 10 && k === 9 && !got.some((u) => UNITS[u].st >= 4)) st = Math.random() < 0.2 ? 5 : 4;
            const pool = UNITS.map((u, i) => i).filter((i) => UNITS[i].st === st), u = pool[Math.floor(Math.random() * pool.length)];
            got.push(u); this.give({ unit: u });
          }
          this.saveS(); reopen();
          const best = Math.max(...got.map((u) => UNITS[u].st));
          $('#caSum').innerHTML = `<div class="xp-grid">${got.map((u) => `<div class="xp-card" style="${UNITS[u].st >= 4 ? 'border-color:#facc15' : ''}"><b>${UNITS[u].n}</b><span>${'⭐'.repeat(UNITS[u].st)}</span><span>Lv ${S.units[u].lvl}</span></div>`).join('')}</div>`;
          if (best >= 4) { puffAt(P.x, P.y + 4, P.z, CONFETTI, 40); toast(best === 5 ? '🌟 LEGENDARY!' : '✨ Epic unit!', '#fde68a'); }
        };
      } else if (which === 'classes') {
        title = '🗡️ Classes';
        html = `<div class="xp-grid">${CLASSES.map((C, i) => `<div class="xp-card ${S.cls === i ? 'on' : ''}"><div class="big">${C.e}</div><b>${C.n}</b><span>❤️ ${C.hp} · ⚔️ ${C.dmg} · ${C.cd}s</span><span>Block ${Math.round(C.block * 100)}% · ${C.hits > 2 ? 'hits a crowd' : C.hits === 1 ? 'one fast target' : 'two targets'}</span>${lv.L >= C.lvl ? `<button class="xp-btn ${S.cls === i ? 'alt' : ''}" data-c="${i}">${S.cls === i ? 'Equipped' : 'Equip'}</button>` : `<span>Unlocks at level ${C.lvl}</span>`}</div>`).join('')}</div>`;
        onClick = (b) => { S.cls = +b.dataset.c; this.saveS(); this.sendMe(true); reopen(); };
      } else if (which === 'mount') {
        title = '🐴 Mounts';
        html = `<p class="xp-note">Press G in battle to mount or dismount. Mounted: much faster, extra health, a charge bonus on hits. On foot: you can roll (Q).</p><div class="xp-grid">${MOUNTS.map((M, i) => { const own = S.mounts.includes(i); return `<div class="xp-card ${S.mount === i ? 'on' : ''}"><div class="big">${M.e}</div><b>${M.n}</b><span>Speed ${M.sp} · +${M.hp} health</span>${own ? `<button class="xp-btn ${S.mount === i ? 'alt' : ''}" data-mo="${i}">${S.mount === i ? 'Riding' : 'Ride'}</button>` : M.gems < 0 ? '<span>Battle pass level 25</span>' : `<button class="xp-btn gold" data-buy="${i}" ${S.gems < M.gems ? 'disabled' : ''}>💎 ${M.gems}</button>`}</div>`; }).join('')}</div>`;
        onClick = (b) => { if (b.dataset.mo) S.mount = +b.dataset.mo; else { const i = +b.dataset.buy; if (S.gems < MOUNTS[i].gems) return; S.gems -= MOUNTS[i].gems; S.mounts.push(i); S.mount = i; } this.saveS(); this.sendMe(true); reopen(); };
      } else if (which === 'skills') {
        title = '🌳 Skill Tree';
        html = `<div class="xp-row"><span>Skill points: <b>${skillPts(S)}</b></span><span>1 point per commander level</span></div>${SKILLS.map((k) => { const have = S.skills[k.k] || 0; return `<div class="xp-row"><span>${k.e} <b>${k.n}</b> ${'I'.repeat(have) || '—'}<br><small style="color:#9ca3af">${k.d} per rank (max III)</small></span><button class="xp-btn" data-sk="${k.k}" ${have >= 3 || skillPts(S) < 1 ? 'disabled' : ''}>${have >= 3 ? 'Max' : `Learn ${'I'.repeat(have + 1)}`}</button></div>`; }).join('')}<button class="xp-btn red" data-reset="1" style="width:100%;margin-top:6px" ${S.gems < 100 || !Object.keys(S.skills).length ? 'disabled' : ''}>Reset skills — 💎100</button>`;
        onClick = (b) => { if (b.dataset.reset) { if (S.gems < 100) return; S.gems -= 100; S.skills = {}; } else { const k = b.dataset.sk; if (skillPts(S) < 1 || (S.skills[k] || 0) >= 3) return; S.skills[k] = (S.skills[k] || 0) + 1; } this.saveS(); this.sendMe(true); reopen(); };
      } else if (which === 'bp') {
        title = '🎖️ Battle Pass — Season 1';
        const bl = Math.min(30, Math.floor(S.bpXp / BP_XP));
        html = `<div class="xp-row"><span>Level <b>${bl}</b>/30</span><span>${S.bpXp % BP_XP}/${BP_XP} XP</span></div><p class="xp-note">Battle XP fills the pass. Claim each level's reward.</p>${BP.map((r, i) => { const L = i + 1, got = S.bpClaimed.includes(L); return `<div class="xp-row" style="${L % 5 === 0 ? 'border:1px solid #facc15' : ''}"><span>Level ${L} · ${this.rewardText(r)}</span><button class="xp-btn ${got ? 'alt' : 'gold'}" data-bp="${L}" ${got || bl < L ? 'disabled' : ''}>${got ? 'Claimed' : bl >= L ? 'Claim' : '🔒'}</button></div>`; }).join('')}`;
        onClick = (b) => { const L = +b.dataset.bp; if (S.bpClaimed.includes(L) || Math.floor(S.bpXp / BP_XP) < L) return; S.bpClaimed.push(L); this.give(BP[L - 1], `battle pass level ${L}`); toast(`🎁 ${this.rewardText(BP[L - 1])}`, '#fde68a'); this.saveS(); reopen(); };
      } else if (which === 'quests') {
        title = '📜 Daily Quests';
        html = QUESTS.map((q, i) => { const v = Math.min(q.goal, S.quest[q.k] || 0), done = v >= q.goal, got = S.quest.claimed.includes(i); return `<div class="xp-row"><span><b>${q.n}</b><br><small style="color:#9ca3af">${v}/${q.goal} · 💎 ${q.gems}</small></span><button class="xp-btn gold" data-q="${i}" ${!done || got ? 'disabled' : ''}>${got ? 'Done' : 'Claim'}</button></div>`; }).join('') + '<p class="xp-note">New quests every day.</p>';
        onClick = (b) => { const i = +b.dataset.q, q = QUESTS[i]; if (S.quest.claimed.includes(i) || (S.quest[q.k] || 0) < q.goal) return; S.quest.claimed.push(i); S.gems += q.gems; toast(`+💎${q.gems}`, '#fde68a'); this.saveS(); reopen(); };
      } else if (which === 'ranked') {
        const t = tierOf(S.rating);
        title = '🏆 Ranked';
        html = `<div class="xp-row"><span>${t[2]} <b>${t[1]}</b></span><span>Rating <b>${S.rating}</b></span></div><div class="xp-row"><span>Wins ${S.wins}</span><span>Losses ${S.losses}</span></div><p class="xp-note">Battles on servers 5 and 6 are ranked: a win is +25 rating, a loss −20. Tiers: ${TIERS.map((x) => `${x[2]} ${x[1]} ${x[0]}`).join(' · ')}.</p>`;
      } else if (which === 'codes') {
        title = '🎟️ Codes';
        html = `<p class="xp-note">Have a code? Try BLOXVERSE, COMMANDER or UPDATE4.</p><div style="display:flex;gap:6px"><input id="caCode" maxlength="20" placeholder="Enter a code" style="flex:1;border-radius:8px;border:0;padding:9px;background:#2c2f32;color:#fff;font:600 14px inherit"><button class="xp-btn" data-code="1">Redeem</button></div><p class="xp-note" id="caCodeMsg"></p>`;
        onClick = (b) => { const c = String($('#caCode').value || '').trim().toUpperCase(), r = CODES[c]; const msg = $('#caCodeMsg'); if (!r) { msg.textContent = 'That code doesn’t work.'; return; } if (S.codes.includes(c)) { msg.textContent = 'Already redeemed.'; return; } S.codes.push(c); this.give(r, `code ${c}`); this.saveS(); msg.textContent = `Redeemed: ${this.rewardText(r)}!`; };
      }
      openPanel(title, html, onClick);
      if (which === 'codes') setTimeout(() => { const i = $('#caCode'); if (i) { i.focus(); i.addEventListener('keydown', (e) => e.stopPropagation()); } }, 0);
    },
    // after a battle: rewards for me
    results(g) {
      this.shownEnd = g.gs;
      const ci = this.ci, I = ci >= 0 ? this.cmInfo(g, ci) : null; if (!I) return;
      const s = (g.sc || [])[ci] || {}, win = g.win === I.team, S = this.S;
      const xp = (s.k || 0) * 2 + (s.hk || 0) * 25 + (s.cap || 0) * 50 + (win ? 200 : 60);
      const gems = (win ? 25 : 10) + Math.floor((s.k || 0) / 10), before = levelOf(S.xp).L;
      S.xp += xp; S.bpXp += xp; S.gems += gems;
      S.quest.kills = (S.quest.kills || 0) + (s.k || 0); S.quest.caps = (S.quest.caps || 0) + (s.cap || 0); if (win) S.quest.wins = (S.quest.wins || 0) + 1;
      let rt = '';
      if (g.rk) { const d = win ? 25 : -20; S.rating = Math.max(0, S.rating + d); rt = ` · rating ${d > 0 ? '+' : ''}${d}`; }
      if (win) S.wins++; else S.losses++;
      this.saveS();
      earn(win ? 40 : 15, win ? 'won a battle' : 'fought a battle');
      const after = levelOf(S.xp).L;
      openPanel(win ? '🏆 VICTORY' : '💀 DEFEAT', `<div class="xp-row"><span>Troops defeated</span><b>${s.k || 0}</b></div><div class="xp-row"><span>Heroes defeated</span><b>${s.hk || 0}</b></div><div class="xp-row"><span>Points captured</span><b>${s.cap || 0}</b></div><div class="xp-row"><span>Rewards</span><b>+${xp} XP · 💎 ${gems}${rt}</b></div>${after > before ? `<p class="xp-note" style="color:#fde68a">⬆️ Level ${after}! +${after - before} skill point${after - before > 1 ? 's' : ''}</p>` : ''}<p class="xp-note">MVPs are on the podium in the courtyard.</p>`, null);
      this.lobbyShown = true;
      if (win) puffAt(P.x, P.y + 4, P.z, CONFETTI, 50);
    },
    hud() {
      const g = this.g; if (!g) return '';
      if (g.ph !== 'battle' || this.ci < 0) { const lv = levelOf(this.S.xp); return `Level ${lv.L} (${lv.into}/${lv.need} XP) · 💎 ${this.S.gems} · Commanding ${UNITS[this.unitNow()].n}`; }
      const s = (g.sc || [])[this.ci] || {};
      return `${TEAM_NAME[this.team] || ''} · ☠️ ${s.k || 0} · 👑 ${s.hk || 0} · Tab: scoreboard`;
    },
    statOf(pr, isMe, peer) { const g = this.g; if (!g || !g.cm) return '—'; const ci = g.cm.findIndex((c) => (Array.isArray(c) ? c[1] : c.id) === peer); return ci >= 0 && g.sc && g.sc[ci] ? g.sc[ci].score : '—'; },
    sortKey(pr, isMe, peer) { const v = this.statOf(pr, isMe, peer); return typeof v === 'number' ? v : -1; },
    menu() { return [['🪖 Units', () => this.openMenu('units')], ['🎲 Summon', () => this.openMenu('summon')], ['🎖️ Battle pass', () => this.openMenu('bp')]]; },
    leave() {
      P.team = -1; this.team = -1;
      for (const v of this.bviews.values()) dropAvatar(v.a); this.bviews = new Map(); this.sviews = new Map();
      for (const o of this.podium || []) if (o.a) dropAvatar(o.a); this.podium = []; this.podSig = '';
      return kvSet('ca', this.S);
    },
  };
  addExp(ARMY);
  window.__rbArmy = ARMY;
})();
