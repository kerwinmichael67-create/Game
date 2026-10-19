/* =====================================================================
   BLOXVERSE — MURDER MYSTERY. Each round one player is secretly the
   Murderer (a knife: stab, or throw it), one the Sheriff (a gun), the
   rest Innocent. Innocents hide, collect coins and pick up the gun if
   the sheriff falls. The sheriff shoots the murderer to win, but shoot
   an innocent and you're both out. Needs 2 or more players.
   The host runs the round and checks every stab and shot.
   ===================================================================== */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    #mmRole{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;z-index:5;background:radial-gradient(circle,rgba(0,0,0,.25),rgba(0,0,0,.7));animation:mmFade 3.6s ease-in forwards}
    #mmRole .card{text-align:center;padding:26px 38px;border-radius:26px;background:linear-gradient(180deg,#1f2937,#0b1220);border:4px solid var(--rc);box-shadow:0 0 70px var(--rc);animation:mmPop .5s cubic-bezier(.2,1.6,.5,1)}
    #mmRole .card i{display:block;font-style:normal;font-size:72px}
    #mmRole .card b{display:block;font:600 40px var(--fh);color:var(--rc);letter-spacing:.04em}
    #mmRole .card span{display:block;font:700 16px var(--fb);color:#e2e8f0;margin-top:6px;max-width:340px}
    @keyframes mmPop{from{transform:scale(.3);opacity:0}}
    @keyframes mmFade{0%,80%{opacity:1}100%{opacity:0}}`;
  document.head.append(style);

  const ROLE = {
    m: { n: 'MURDERER', e: '🔪', c: '#ef4444', d: 'Eliminate everyone without getting shot. Click to stab someone close; F (or right-click) throws your knife.' },
    s: { n: 'SHERIFF', e: '🔫', c: '#3b82f6', d: 'Find the murderer and shoot them (click where to shoot, or F). Shoot an innocent and you’re both out!' },
    i: { n: 'INNOCENT', e: '😇', c: '#22c55e', d: 'Stay alive, collect coins, and watch for the knife. If the sheriff falls, grab their gun!' },
  };
  const ROUND = 180, KNIFE_CD = 3, GUN_CD = 2, STAB = 6.5, NCOINS = 24;
  const WALL_H = 9;

  function knifeMesh() { const g = new THREE.Group(), b = (c, sx, sy, sz, x, y, z) => { const o = new THREE.Mesh(BOX, new THREE.MeshLambertMaterial({ color: c })); o.scale.set(sx, sy, sz); o.position.set(x, y, z); g.add(o); }; b(0x1f2937, 0.22, 0.26, 0.9, 0, 0, -0.3); b(0x6b7280, 0.5, 0.2, 0.16, 0, 0, -0.78); b(0xe5e7eb, 0.07, 0.34, 1.6, 0, 0, -1.6); return g; }
  function gunMesh() { const g = new THREE.Group(), b = (c, sx, sy, sz, x, y, z) => { const o = new THREE.Mesh(BOX, new THREE.MeshLambertMaterial({ color: c })); o.scale.set(sx, sy, sz); o.position.set(x, y, z); g.add(o); }; b(0x111827, 0.24, 0.6, 0.32, 0, -0.2, 0); b(0x9ca3af, 0.26, 0.32, 1.3, 0, 0.18, -0.35); b(0x6b7280, 0.36, 0.36, 0.4, 0, 0.18, -0.15); return g; }

  const MM = {
    id: 'murder', code: 'mm', genre: 'Mystery', rank: 0.12, name: 'Murder Mystery', emoji: '🔪', max: 12, stat: 'Wins', killY: -30, banner: true, camDist: 18, respawnDelay: 3000, noReset: true,
    land: { theme: 'night', fence: 'stone', fences: [[-46, -36, 46, 36]], under: [[-46, -36, 46, 36]], extras: ['graves', 'pumpkins'] },
    color: 'linear-gradient(135deg,#7f1d1d,#1e293b)',
    desc: 'Each round one player is secretly the Murderer, one the Sheriff, and everyone else is Innocent. Innocents hide and collect coins; the sheriff has to find and shoot the murderer (but shoot an innocent and you’re both out); the murderer has to get everyone. Needs 2 or more players.',
    welcome: 'A round starts when 2 or more players are here. Who’s the murderer?',
    build() {
      sky('#334155', '#94a3b8');
      this.walls = [];
      const wall = (x0, z0, x1, z1, c = 0xd6c7a8) => { const p = part({ x: (x0 + x1) / 2, y: WALL_H / 2, z: (z0 + z1) / 2, sx: Math.max(1, x1 - x0), sy: WALL_H, sz: Math.max(1, z1 - z0), c }); this.walls.push(p); return p; };
      // a wall along x (at z) or along z (at x), with door gaps (centre, width 5)
      const wx = (z, x0, x1, doors, c) => { let a = x0; for (const d of doors.concat([x1 + 2.5])) { if (d - 2.5 > a) wall(a, z - 0.5, d - 2.5, z + 0.5, c); a = d + 2.5; } };
      const wz = (x, z0, z1, doors, c) => { let a = z0; for (const d of doors.concat([z1 + 2.5])) { if (d - 2.5 > a) wall(x - 0.5, a, x + 0.5, d - 2.5, c); a = d + 2.5; } };
      // the mansion: a hall down the middle, three rooms on each side
      slab(0, 0, 0, 92, 72, 0x8b6b4a, { sy: 2 });
      const floors = [[-30, -21.5, 0xb45309], [0, -21.5, 0x7c2d12], [30, -21.5, 0xe5e7eb], [-30, 21.5, 0x6d28d9], [0, 21.5, 0x0e7490], [30, 21.5, 0x166534]];
      for (const [x, z, c] of floors) part({ x, y: 0.04, z, sx: 29, sy: 0.08, sz: 26, c, plain: true, solid: false });
      part({ x: 0, y: 0.04, z: 0, sx: 90, sy: 0.08, sz: 15, c: 0x991b1b, plain: true, solid: false }); // the hall's long rug
      wx(-36, -46, 46, [], 0xa8a29e); wx(36, -46, 46, [0], 0xa8a29e); wz(-46, -36, 36, [0], 0xa8a29e); wz(46, -36, 36, [0], 0xa8a29e);
      wx(-8.5, -45, 45, [-30, 0, 30]); wx(8.5, -45, 45, [-30, 0, 30]);
      wz(-15, -35, -9, [-22]); wz(15, -35, -9, [-22]); wz(-15, 9, 35, [22]); wz(15, 9, 35, [22]);
      // furniture: things to hide behind and climb on
      const F = (x, z, sx, sy, sz, c) => part({ x, y: sy / 2, z, sx, sy, sz, c });
      // library: shelves and a reading table
      for (const z of [-33, -26, -19]) F(-30, z, 20, 7, 1.6, 0x5b3a1e);
      F(-30, -12.5, 8, 1.6, 3, 0x7c4a1e);
      // dining room: a long table and chairs
      F(0, -22, 4, 1.8, 18, 0x6b3f1f); for (let z = -29; z <= -15; z += 3.5) { F(-3.5, z, 1.6, 1, 1.6, 0x92400e); F(3.5, z, 1.6, 1, 1.6, 0x92400e); }
      // kitchen: counters, an island, a fridge
      F(30, -34, 26, 2.2, 2, 0xd1d5db); F(43.5, -24, 2, 2.2, 18, 0xd1d5db); F(28, -21, 8, 2.2, 4, 0x9ca3af); F(18, -33.5, 3, 6, 3, 0xf3f4f6);
      // lounge: sofas, a piano, a fireplace
      F(-30, 30, 12, 1.6, 3, 0x7c3aed); F(-38, 20, 3, 1.6, 10, 0x7c3aed); F(-20, 22, 6, 2, 4, 0x111827); F(-30, 34.5, 8, 5, 1.5, 0x57534e);
      // bedroom: a bed, wardrobes
      F(0, 29, 9, 1.4, 11, 0xe0f2fe); F(0, 34.5, 9, 3, 1, 0x1e3a8a); F(-11, 33, 3, 7, 3, 0x713f12); F(11, 33, 3, 7, 3, 0x713f12);
      // study: desk, boxes to climb
      F(30, 25, 10, 1.8, 4, 0x78350f); F(41, 31, 3, 2, 3, 0xa16207); F(41, 31, 2, 4, 2, 0xa16207); F(20, 14, 3, 2, 3, 0xa16207);
      // the hall: pillars and plants
      for (const x of [-38, -20, 20, 38]) { F(x, -6, 1.6, WALL_H, 1.6, 0xe7e5e4); F(x, 6, 1.6, WALL_H, 1.6, 0xe7e5e4); }
      for (const x of [-10, 10]) F(x, 0, 2, 2, 2, 0x166534);
      const rl = [['📚 Library', -30, -9.5], ['🍽️ Dining Room', 0, -9.5], ['🍳 Kitchen', 30, -9.5], ['🛋️ Lounge', -30, 9.5], ['🛏️ Bedroom', 0, 9.5], ['🖋️ Study', 30, 9.5]];
      for (const [t, x, z] of rl) { const l = label(t, { size: 1.1, bg: 'rgba(15,23,42,.55)' }); l.position.set(x, 7.5, z); place.add(l); }
      // the lobby, where you wait and watch: a platform out front with a window onto the mansion
      slab(0, 14, 62, 50, 26, 0x1e293b, { sy: 2 });
      for (const [x, z, sx, sz] of [[0, 75.5, 50, 1], [-25.5, 62, 1, 26], [25.5, 62, 1, 26]]) part({ x, y: 17, z, sx, sy: 6, sz, c: 0x475569 });
      part({ x: 0, y: 17, z: 48.5, sx: 50, sy: 6, sz: 1, c: 0x93c5fd, alpha: 0.25, plain: true });
      for (const x of [-16, -8, 0, 8, 16]) part({ x, y: 14.6, z: 68, sx: 6, sy: 1.2, sz: 2, c: 0x7c2d12 });
      const sg = label('🔪 MURDER MYSTERY', { size: 2.6, color: '#fecaca' }); sg.position.set(0, 23, 74); place.add(sg);
      // where people start, and where coins can turn up
      this.spawns = [[-30, -14], [-36, -30], [0, -14], [8, -30], [30, -14], [38, -28], [-30, 16], [-36, 28], [0, 16], [8, 24], [30, 16], [38, 22], [-28, 0], [28, 0]];
      this.coinSpots = [];
      const r = mulberry(4242);
      for (let i = 0; i < 80; i++) { const x = (r() - 0.5) * 86, z = (r() - 0.5) * 66; if (groundBelow(x, 3, z) < 0.2) this.coinSpots.push([+x.toFixed(1), +z.toFixed(1)]); }
    },
    pres() { return { mk: 0, hd: '' }; },
    enter() {
      this.H = null; this.lastG = null; this.gSeen = null; this.rd = 0; this.evN = null; this.mk = 0; this.cd = 0; this.hd = ''; this.held = new Map(); this.coinM = []; this.fx = []; this.gunM = null; this.seenMk = new Map(); this.tc = {};
      this.drawBar();
    },
    leave() {
      for (const c of this.coinM) scene.remove(c);
      this.coinM = [];
      for (const f of this.fx) scene.remove(f.m);
      this.fx = [];
      if (this.gunM) { scene.remove(this.gunM); this.gunM = null; }
      for (const h of this.held.values()) if (h.m && h.m.parent) h.m.parent.remove(h.m);
      this.held = new Map();
      if (this.roleEl) { this.roleEl.remove(); this.roleEl = null; }
    },
    spawn() {
      const g = this.g, mine = myPeer();
      if (g && g.ph === 'play' && (g.al || []).includes(mine)) {
        const i = Math.max(0, (g.order || []).indexOf(mine)), s = this.spawns[(i + g.rd * 5) % this.spawns.length];
        return [s[0], 0.5, s[1], Math.atan2(s[0], s[1])];
      }
      return [(Math.random() - 0.5) * 30, 15.5, 66, 0]; // the lobby
    },
    adopt() {
      const g = this.lastG;
      this.evSeq = Math.max(this.evSeq || 0, ...((g && g.ev) || []).map((e) => e[0]));
      return g ? JSON.parse(JSON.stringify(g)) : { ph: 'wait', left: 0, rd: 0, roles: {}, al: [], order: [], gun: null, gd: null, cg: [], cc: {}, sc: {}, w: '', gs: 0, ev: [] };
    },

    /* ---- the host: rounds, and checking every stab and shot ---- */
    host(dt) {
      const H = this.H, pl = players(), n = pl.length;
      H.left = Math.max(0, H.left - dt);
      if (H.ph === 'wait') { if (n >= 2) { H.ph = 'count'; H.left = 10; } }
      else if (H.ph === 'count') { if (n < 2) H.ph = 'wait'; else if (H.left <= 0) this.startRound(pl); }
      else if (H.ph === 'play') {
        H.al = H.al.filter((id) => pl.some((p) => p.peer === id)); // left the server: out
        if (H.gun && !H.al.includes(H.gun)) this.dropGun(H.gun, pl);
        for (const p of pl) {
          if (p.me) continue;
          const mk = p.pr && Array.isArray(p.pr.mk) ? p.pr.mk : null;
          if (!mk || mk[0] === this.seenMk.get(p.peer)) continue;
          this.seenMk.set(p.peer, mk[0]);
          this.act(p.peer, mk[1], mk[2], [+mk[3] || 0, +mk[4] || 0], pl);
        }
        // coins and the dropped gun get picked up by walking over them
        for (const p of pl) {
          if (!H.al.includes(p.peer)) continue;
          H.coins.forEach((c, i) => { if (!H.cg.includes(i) && Math.hypot(c[0] - p.x, c[1] - p.z) < 2.2 && p.y < 6) { H.cg.push(i); H.cc[p.peer] = (H.cc[p.peer] || 0) + 1; } });
          if (H.gd && H.roles[p.peer] !== 'm' && Math.hypot(H.gd[0] - p.x, H.gd[1] - p.z) < 3 && p.y < 6) { H.gun = p.peer; H.gd = null; this.ev(['gp', p.peer]); }
        }
        this.checkWin();
        if (H.ph === 'play' && H.left <= 0) this.endRound('i', null);
      } else if (H.ph === 'end' && H.left <= 0) { H.ph = n >= 2 ? 'count' : 'wait'; H.left = 10; }
      if (performance.now() - (this.sentAt || 0) > 150) { this.sentAt = performance.now(); hostSend(this); }
    },
    ev(e) { const H = this.H; this.evSeq = (this.evSeq || 0) + 1; H.ev = (H.ev || []).concat([[this.evSeq].concat(e)]).slice(-8); },
    startRound(pl) {
      const H = this.H, ids = pl.map((p) => p.peer).sort(() => Math.random() - 0.5);
      H.ph = 'play'; H.left = ROUND; H.rd = (H.rd | 0) + 1; H.w = ''; H.hero = null;
      H.roles = {}; ids.forEach((id, i) => (H.roles[id] = i === 0 ? 'm' : i === 1 ? 's' : 'i'));
      H.al = ids.slice(); H.order = ids.slice().sort(); H.gun = ids[1]; H.gd = null; H.cc = {}; H.cg = [];
      const r = mulberry(H.rd * 977 + 13), spots = this.coinSpots.slice();
      H.coins = [];
      for (let i = 0; i < NCOINS && spots.length; i++) H.coins.push(spots.splice(Math.floor(r() * spots.length), 1)[0]);
      this.tc = {};
      for (const p of pl) this.seenMk.set(p.peer, p.pr && Array.isArray(p.pr.mk) ? p.pr.mk[0] : 0); // old clicks don't count
    },
    // someone stabbed, threw or shot: is it allowed, and who goes down?
    act(by, kind, victim, at, pl) {
      const H = this.H, me = pl.find((p) => p.peer === by), now = performance.now() / 1000;
      if (H.ph !== 'play' || !me || !H.al.includes(by)) return;
      const v = victim && pl.find((p) => p.peer === victim), alive = v && H.al.includes(victim) && victim !== by;
      if (kind === 's' && H.roles[by] === 'm' && alive && Math.hypot(v.x - me.x, v.z - me.z) < STAB + 2.5) this.kill(victim, by, 's', pl);
      else if (kind === 't' && H.roles[by] === 'm' && now - (this.tc[by] || -99) > KNIFE_CD - 0.3) {
        this.tc[by] = now;
        this.ev(['kt', +me.x.toFixed(1), +me.z.toFixed(1), at[0], at[1]]);
        if (alive && Math.hypot(v.x - me.x, v.z - me.z) < 80) this.kill(victim, by, 't', pl);
      } else if (kind === 'g' && H.gun === by && now - (this.tc[by] || -99) > GUN_CD - 0.3) {
        this.tc[by] = now;
        this.ev(['gs', +me.x.toFixed(1), +me.z.toFixed(1), at[0], at[1]]);
        if (!alive || Math.hypot(v.x - me.x, v.z - me.z) > 90) return;
        if (H.roles[victim] === 'm') { this.kill(victim, by, 'g', pl); H.hero = by; }
        else { this.kill(victim, by, 'g', pl); this.kill(by, by, 'oops', pl); } // shot an innocent: you're out too
      }
      this.checkWin();
    },
    kill(victim, by, how, pl) {
      const H = this.H;
      if (!H.al.includes(victim)) return;
      H.al = H.al.filter((x) => x !== victim);
      this.ev(['k', victim, by, how]);
      if (H.gun === victim) this.dropGun(victim, pl);
    },
    dropGun(peer, pl) {
      const H = this.H, p = pl.find((q) => q.peer === peer);
      H.gun = null;
      if (H.al.some((id) => H.roles[id] !== 'm')) { H.gd = p ? [+p.x.toFixed(1), +p.z.toFixed(1)] : [0, 0]; this.ev(['gd', H.gd[0], H.gd[1]]); }
    },
    checkWin() {
      const H = this.H;
      if (H.ph !== 'play') return;
      const m = Object.keys(H.roles).find((id) => H.roles[id] === 'm');
      if (!H.al.includes(m)) this.endRound('i', H.hero);
      else if (H.al.length === 1) this.endRound('m', m);
    },
    endRound(side, hero) {
      const H = this.H;
      H.ph = 'end'; H.left = 8; H.w = side; H.hero = hero || null;
      const winners = side === 'm' ? Object.keys(H.roles).filter((id) => H.roles[id] === 'm') : H.al.filter((id) => H.roles[id] !== 'm').concat(hero && !H.al.includes(hero) ? [hero] : []);
      for (const id of winners) H.sc[id] = (H.sc[id] || 0) + 1;
      H.winners = winners;
    },

    /* ---- you: stabbing, throwing, shooting ---- */
    myRole() { const g = this.g; return g && g.ph === 'play' && g.roles ? g.roles[myPeer()] : null; },
    alive() { const g = this.g; return !!(g && g.ph === 'play' && (g.al || []).includes(myPeer())); },
    hasGun() { const g = this.g; return !!(g && g.ph === 'play' && g.gun === myPeer()); },
    // others you could hit: who's alive, where they're drawn
    targets() {
      const g = this.g, out = [];
      for (const [peer, a] of Net.avatars) if ((g.al || []).includes(peer) && !a.dead) out.push({ peer, x: a.g.position.x, y: a.g.position.y, z: a.g.position.z });
      return out;
    },
    // nothing solid in the way at chest height?
    clear(x0, z0, x1, z1) {
      const y = P.y + 3, n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.5);
      for (let k = 1; k < n; k++) {
        const x = x0 + ((x1 - x0) * k) / n, z = z0 + ((z1 - z0) * k) / n;
        for (const p of parts) { if (!p.solid || !p.on) continue; const b = boxOf(p); if (x > b[0] && x < b[3] && z > b[2] && z < b[5] && y > b[1] && y < b[4]) return { x, z }; }
      }
      return null;
    },
    // along a line from you: the first person in the way (and where it stops)
    firstHit(dx, dz, range) {
      const d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
      let best = null, bt = range;
      for (const t of this.targets()) { const rx = t.x - P.x, rz = t.z - P.z, along = rx * ux + rz * uz, off = Math.abs(rx * uz - rz * ux); if (along > 0 && along < bt && off < 1.6) { bt = along; best = t; } }
      const end = { x: P.x + ux * bt, z: P.z + uz * bt }, wall = this.clear(P.x, P.z, end.x, end.z);
      if (wall) return { victim: null, at: wall };
      return { victim: best ? best.peer : null, at: end };
    },
    report(kind, victim, at) {
      this.mk++;
      send({ mk: [this.mk, kind, victim || 0, +at.x.toFixed(1), +at.z.toFixed(1)] });
      if (this.H) this.act(myPeer(), kind, victim, [+at.x.toFixed(1), +at.z.toFixed(1)], players()); // the host's own go straight in
    },
    stab() {
      if (this.cd > 0) return;
      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
      let best = null, bd = STAB;
      for (const t of this.targets()) { const dx = t.x - P.x, dz = t.z - P.z, d = Math.hypot(dx, dz); if (d < bd && (dx * fx + dz * fz) / (d || 1) > 0.2 && !this.clear(P.x, P.z, t.x, t.z)) { bd = d; best = t; } }
      this.cd = 0.6; this.swingT = 0.3; sfx('swing');
      if (best) { this.report('s', best.peer, best); sfx('hit'); }
    },
    throwKnife(dir) {
      if (this.cd > 0) return toast(`🔪 Knife back in ${this.cd.toFixed(1)}s`, '#fca5a5');
      const h = this.firstHit(dir.x, dir.z, 70);
      this.cd = KNIFE_CD; this.swingT = 0.3; sfx('whoosh');
      this.flyFx('k', P.x, P.z, h.at.x, h.at.z);
      this.report('t', h.victim, h.at);
    },
    shoot(dir) {
      if (this.cd > 0) return;
      const h = this.firstHit(dir.x, dir.z, 90);
      this.cd = GUN_CD; sfx('gun');
      this.flyFx('g', P.x, P.z, h.at.x, h.at.z);
      this.report('g', h.victim, h.at);
    },
    // which way: towards what you clicked (a person, or a spot on the floor), or the way the camera faces
    aimAt(e) {
      if (e) {
        const meshes = []; for (const [, a] of Net.avatars) meshes.push(a.g);
        const hit = pickObjects(e.x, e.y, meshes);
        const at = hit ? hit.point : pickPlane(e.x, e.y, P.y + 2);
        if (at) { const dx = at.x - P.x, dz = at.z - P.z; if (Math.hypot(dx, dz) > 0.5) return { x: dx, z: dz }; }
      }
      return { x: -Math.sin(cam.yaw), z: -Math.cos(cam.yaw) };
    },
    click(e) {
      if (!this.alive() || P.dead || panelOpen()) return;
      const role = this.myRole();
      if (role === 'm') { if (this.hd !== 'k') this.equip('k'); else if (e && e.button === 2) this.throwKnife(this.aimAt(e)); else this.stab(); }
      else if (this.hasGun()) { if (this.hd !== 'g') this.equip('g'); else this.shoot(this.aimAt(e)); }
    },
    key(code, down) {
      if (!down) return;
      if (code === 'Digit1' || code === 'KeyQ') { this.equip(this.hd ? '' : this.myRole() === 'm' ? 'k' : this.hasGun() ? 'g' : ''); return true; }
      if (code === 'KeyF' && this.alive()) { if (this.myRole() === 'm') { if (this.hd !== 'k') this.equip('k'); this.throwKnife(this.aimAt(null)); } else if (this.hasGun()) { if (this.hd !== 'g') this.equip('g'); this.shoot(this.aimAt(null)); } return true; }
    },
    equip(h) {
      if (h === 'k' && this.myRole() !== 'm') h = '';
      if (h === 'g' && !this.hasGun()) h = '';
      if (h === this.hd) return;
      this.hd = h; send({ hd: h }); sfx(h ? 'select' : 'click'); this.drawBar();
    },
    drawBar() {
      const role = this.myRole(), gun = this.hasGun();
      const slot = role === 'm' ? `<button class="xslot ${this.hd === 'k' ? 'on' : ''}" data-k="eq"><span class="k">1</span><span class="e">🔪</span>Knife</button><button class="xslot" data-k="throw"><span class="k">F</span><span class="e">🎯</span>Throw</button>`
        : gun ? `<button class="xslot ${this.hd === 'g' ? 'on' : ''}" data-k="eq"><span class="k">1</span><span class="e">🔫</span>Gun</button><button class="xslot" data-k="shoot"><span class="k">F</span><span class="e">💥</span>Shoot</button>` : '';
      const html = slot + (role ? `<button class="xslot info"><span>${ROLE[role].e} <b style="color:${ROLE[role].c};font-size:14px">${ROLE[role].n}</b></span></button>` : '');
      if (html === this.barHtml) return;
      this.barHtml = html;
      setBar(html, (b) => {
        const k = b.dataset.k;
        if (k === 'eq') this.equip(this.hd ? '' : role === 'm' ? 'k' : 'g');
        if (k === 'throw') { if (this.hd !== 'k') this.equip('k'); this.throwKnife(this.aimAt(null)); }
        if (k === 'shoot') { if (this.hd !== 'g') this.equip('g'); this.shoot(this.aimAt(null)); }
      });
    },
    flyFx(kind, x0, z0, x1, z1) {
      const y = 3.2;
      if (kind === 'g') {
        const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x0, y, z0), new THREE.Vector3(x1, y, z1)]);
        const m = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xfde047 })); scene.add(m); this.fx.push({ m, life: 0.15 });
        puffAt(x1, y, z1, [0xfde047, 0xffffff], 4);
      } else {
        const m = knifeMesh(); m.position.set(x0, y, z0); m.rotation.y = Math.atan2(-(x1 - x0), -(z1 - z0)); scene.add(m);
        const d = Math.hypot(x1 - x0, z1 - z0); this.fx.push({ m, life: d / 90, k: { x0, z0, x1, z1, t: 0, T: d / 90 } });
      }
    },

    /* ---- everyone ---- */
    tick(dt) {
      const g = this.g = roundState(this), mine = myPeer();
      this.cd = Math.max(0, this.cd - dt); this.swingT = Math.max(0, (this.swingT || 0) - dt);
      const alive = this.alive();
      if (g && g.ph === 'play' && g.rd !== this.rd) { this.rd = g.rd; this.wasAlive = alive; this.hd = ''; send({ hd: '' }); this.coinsGot = 0; respawn(); this.showRole(g.roles[mine]); }
      if (g && g.ph === 'count') { const c = Math.ceil(g.left); if (c !== this.cdS && c <= 5) sfx('count'); this.cdS = c; } else this.cdS = null;
      if (g && this.evN == null) this.evN = Math.max(0, ...(g.ev || []).map((e) => e[0]));
      for (const e of (g && g.ev) || []) {
        if (!(e[0] > this.evN)) continue;
        this.evN = e[0];
        const [, k] = e;
        if (k === 'k') {
          const how = e[4];
          if (e[2] === mine) toast(how === 'oops' ? '😬 You shot an innocent — you’re out too!' : how === 'g' ? '💥 You were shot!' : '🔪 The murderer got you!', '#fca5a5');
          else if (e[3] === mine && how !== 'oops') toast(how === 'g' ? '🎯 Got them!' : '🔪 Got one!', '#fde68a');
          const a = Net.avatars.get(e[2]); if (a) puffAt(a.g.position.x, a.g.position.y + 3, a.g.position.z, [0x991b1b, 0xffffff], 12);
        }
        if (k === 'kt' && !(Math.abs(e[2] - P.x) < 0.6 && Math.abs(e[3] - P.z) < 0.6)) { this.flyFx('k', e[2], e[3], e[4], e[5]); sfx3('whoosh', e[2], e[3], 60); } // (your own throw is drawn already)
        if (k === 'gs' && !(Math.abs(e[2] - P.x) < 0.6 && Math.abs(e[3] - P.z) < 0.6)) { this.flyFx('g', e[2], e[3], e[4], e[5]); sfx3('gun', e[2], e[3], 100); }
        if (k === 'gd') { toast('🔫 The sheriff’s gun has dropped! Innocents: grab it!', '#93c5fd'); sfx('alarm', { vol: 0.5 }); }
        if (k === 'gp') { if (e[2] === mine) { toast('🔫 You picked up the gun! Shoot the murderer!', '#93c5fd'); sfx('reload'); } else toast('🔫 Someone picked up the gun…', '#93c5fd'); }
      }
      // knocked out
      if (g && g.ph === 'play' && this.wasAlive && !alive && !P.dead) die();
      this.wasAlive = alive;
      if (this.hd && !(alive && ((this.hd === 'k' && this.myRole() === 'm') || (this.hd === 'g' && this.hasGun())))) { this.hd = ''; send({ hd: '' }); }
      // coins: collected ones go; yours count up
      this.drawCoins(g, dt);
      const got = g && g.cc ? g.cc[mine] || 0 : 0;
      if (g && g.ph === 'play' && got > (this.coinsGot || 0)) { for (let i = this.coinsGot || 0; i < got; i++) earn(1); sfx('coin'); this.coinsGot = got; }
      // the dropped gun
      if (g && g.ph === 'play' && g.gd) {
        if (!this.gunM) { this.gunM = gunMesh(); this.gunM.scale.setScalar(1.5); const l = label('🔫 GUN', { size: 1.1, color: '#93c5fd' }); l.position.y = 2; this.gunM.add(l); scene.add(this.gunM); }
        this.gunM.position.set(g.gd[0], 1.2 + Math.sin(performance.now() / 300) * 0.25, g.gd[1]); this.gunM.rotation.y += dt * 2;
      } else if (this.gunM) { scene.remove(this.gunM); this.gunM = null; }
      // knives and shots flying
      for (let i = this.fx.length - 1; i >= 0; i--) {
        const f = this.fx[i]; f.life -= dt;
        if (f.k) { f.k.t = Math.min(f.k.T, f.k.t + dt); const q = f.k.T ? f.k.t / f.k.T : 1; f.m.position.set(f.k.x0 + (f.k.x1 - f.k.x0) * q, 3.2, f.k.z0 + (f.k.z1 - f.k.z0) * q); f.m.rotation.x -= dt * 20; }
        if (f.life <= 0) { scene.remove(f.m); this.fx.splice(i, 1); }
      }
      if (g && g.ph !== this.coinPh) {
        if (g.ph === 'end' && this.coinPh === 'play') {
          const won = (g.winners || []).includes(mine);
          sfx(won ? 'win' : 'lose');
          if (won) earn(g.hero === mine ? 25 : g.w === 'm' ? 20 : 10, g.hero === mine ? 'you were the hero!' : g.w === 'm' ? 'won as the murderer' : 'the innocents won');
        }
        this.coinPh = g.ph;
      }
      this.drawBar();
      const role = this.myRole(), m = g && g.roles ? Object.keys(g.roles).find((id) => g.roles[id] === 'm') : null, sh = g && g.roles ? Object.keys(g.roles).find((id) => g.roles[id] === 's') : null;
      if (!g) setBanner('Getting the round…');
      else if (g.ph === 'wait') setBanner('Waiting for players — Murder Mystery needs 2 or more');
      else if (g.ph === 'count') setBanner(`Next round in ${Math.ceil(g.left)}… (who will be the murderer?)`);
      else if (g.ph === 'play') setBanner(!alive ? `👻 You’re out — watching · ${mmss(g.left)}` : `${ROLE[role].e} You’re the ${ROLE[role].n.toLowerCase()}${role === 'i' && this.hasGun() ? ' with the gun' : ''} · ${mmss(g.left)}`);
      else setBanner(g.w === 'm' ? `🔪 The murderer (${esc(nameOf(m))}) wins!` : `😇 Innocents win!${g.hero ? ` 🦸 ${esc(nameOf(g.hero))} stopped the murderer (${esc(nameOf(m))})` : ` The murderer was ${esc(nameOf(m))}`}${sh ? ` · sheriff: ${esc(nameOf(sh))}` : ''}`);
    },
    showRole(role) {
      if (!role) return;
      if (this.roleEl) this.roleEl.remove();
      const R = ROLE[role], el = document.createElement('div'); el.id = 'mmRole';
      el.innerHTML = `<div class="card" style="--rc:${R.c}"><i>${R.e}</i><b>${R.n}</b><span>${R.d}</span></div>`;
      $('#xhud').append(el); this.roleEl = el;
      sfx(role === 'm' ? 'alarm' : 'reward');
      setTimeout(() => { if (this.roleEl === el) { el.remove(); this.roleEl = null; } }, 3600);
    },
    drawCoins(g, dt) {
      const coins = g && g.ph === 'play' ? g.coins || [] : [], got = new Set((g && g.cg) || []);
      while (this.coinM.length < coins.length) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.16, 16), new THREE.MeshBasicMaterial({ color: 0xfacc15 })); m.rotation.z = Math.PI / 2; scene.add(m); this.coinM.push(m); }
      this.coinM.forEach((m, i) => { const c = coins[i]; m.visible = !!c && !got.has(i); if (m.visible) { m.position.set(c[0], 1.2 + Math.sin(performance.now() / 400 + i) * 0.15, c[1]); m.rotation.y += dt * 3; } });
    },
    // knives and guns in hands: the murderer's knife only shows while it's out
    pose() {
      this.hold(me, 'me', this.hd);
      for (const [peer, a] of Net.avatars) { const p = Net.peers.find((q) => q.peer === peer); this.hold(a, peer, p && p.presence ? String(p.presence.hd || '') : ''); }
    },
    hold(a, key, what) {
      if (!a || a.dead) return;
      let h = this.held.get(key);
      if (!h || h.a !== a || h.w !== what) {
        if (h && h.m && h.m.parent) h.m.parent.remove(h.m);
        h = { a, w: what, m: what === 'k' ? knifeMesh() : what === 'g' ? gunMesh() : null };
        if (h.m) { h.m.rotation.x = what === 'g' ? -Math.PI / 2 : -Math.PI / 2 + 0.5; h.m.position.set(0, -1.9, what === 'g' ? -0.1 : 0); a.armR.add(h.m); }
        this.held.set(key, h);
      }
      if (what === 'g') a.armR.rotation.x = Math.PI / 2;
      else if (what === 'k' && key === 'me' && this.swingT > 0) a.armR.rotation.x = 2.6 - (1 - this.swingT / 0.3) * 2.6;
    },
    statOf(pr, isMe, peer) { const g = this.g; return g && g.sc ? g.sc[peer] || 0 : 0; },
    sortKey(pr, isMe, peer) { const g = this.g; return g && g.sc ? g.sc[peer] || 0 : 0; },
    hud() {
      const g = this.g;
      if (!g || g.ph !== 'play' || !this.alive()) return '';
      const role = this.myRole(), coins = (g.cc || {})[myPeer()] || 0, cd = this.cd > 0 ? ` · ⏳ ${this.cd.toFixed(1)}s` : '';
      return `🪙 ${coins} coins · ${role === 'm' ? `🔪 click: stab · F / right-click: throw${cd}` : this.hasGun() ? `🔫 click where to shoot · F: shoot ahead${cd}` : '😇 hide and collect coins'} · ${(g.al || []).length} alive`;
    },
  };
  addExp(MM);
  window.__rbMM = MM;
})();
