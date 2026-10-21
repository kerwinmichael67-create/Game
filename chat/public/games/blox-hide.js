/* =====================================================================
   BLOXVERSE — HIDE AND SEEK. One player is the seeker: they count, shut
   in a box outside and blindfolded, while everyone else hides in the
   house or the yard (wardrobes, the shower, bushes, the shed…). Then the
   door opens: touch a hider to find them, and they seek too. Find
   everyone before time runs out and the seekers win; otherwise the
   hiders do. Bots hide (and seek) when there aren't enough players.
   The host runs the rounds, the bots and who's been found.
   ===================================================================== */
(() => {
  const HIDE = 25, SEEK = 110, TAG = 3.4, WALL = 9;
  const CAGE = [52, 34], LOBBY = [0, 40];
  const BOT_NAMES = ['Sneaky Sam', 'Peekaboo Pat', 'Hidey Ho', 'Quiet Quinn', 'Shadow Sue', 'Corner Carl'];
  // places a bot can hide
  const SPOTS = [[-33, -22], [-33, 4], [-12, 23], [-26, -23], [-13, -3], [12, -21], [-6, 23], [33, 23], [17, 3], [32.5, -10], [33, -23], [17, -23], [-50, 30], [-50, -30], [46, -32], [-30, 38], [30, -40], [-46, 0], [-52, 50]];
  // the way round for a bot seeker: room middles and doorways, and which connect
  const NODES = { L: [-30, 14], B: [-19, -15], K: [2, -3], G: [19, 4], W: [24, -14], Y: [0, 36], YB: [5, -36], YL: [-46, 0], YR: [46, 0], C: [CAGE[0] - 8, CAGE[1]], d1: [-10, 11], d2: [-10, -13], d3: [-23, 0], d4: [14, 13], d5: [14, -9], d6: [25, -2], fd: [0, 26], bd: [5, -26] };
  const EDGES = [['L', 'd1'], ['d1', 'K'], ['B', 'd2'], ['d2', 'K'], ['L', 'd3'], ['d3', 'B'], ['K', 'd4'], ['d4', 'G'], ['K', 'd5'], ['d5', 'W'], ['G', 'd6'], ['d6', 'W'], ['K', 'fd'], ['fd', 'Y'], ['K', 'bd'], ['bd', 'YB'], ['Y', 'YL'], ['Y', 'YR'], ['YB', 'YL'], ['YB', 'YR'], ['Y', 'C'], ['YR', 'C']];
  const ROOMS = ['L', 'B', 'K', 'G', 'W', 'Y', 'YB', 'YL', 'YR'];
  const near = (n) => { let best = 'Y', bd = 1e9; for (const [k, p] of Object.entries(NODES)) { const d = Math.hypot(p[0] - n[0], p[1] - n[1]); if (d < bd) { bd = d; best = k; } } return best; };
  function route(from, to) { // breadth-first, along the edges
    const prev = { [from]: null }, q = [from];
    while (q.length) { const n = q.shift(); if (n === to) break; for (const [a, b] of EDGES) for (const [x, y] of [[a, b], [b, a]]) if (x === n && !(y in prev)) { prev[y] = n; q.push(y); } }
    const path = []; for (let n = to; n; n = prev[n]) path.unshift(n); return path[0] === from ? path : [to];
  }

  const HS = {
    id: 'hide', code: 'hs', genre: 'Party', rank: 0.02, name: 'Hide and Seek', emoji: '🙈', max: 12, stat: 'Points', killY: -30, banner: true, camDist: 16, noReset: true,
    land: { theme: 'autumn', fence: 'wood' },
    color: 'linear-gradient(135deg,#7c3aed,#db2777 55%,#f59e0b)',
    desc: 'One player seeks while everyone else hides — in wardrobes, the shower, behind the sofa, in the bushes or the shed. The seeker counts with a blindfold on, then comes looking: touch a hider to find them, and they seek too. Find everyone before time runs out, or stay hidden to win! Bots join in when there aren’t enough players.',
    welcome: 'When the round starts, find a good hiding place — or count, if you’re the seeker!',
    build() {
      sky('#93c5fd', '#fef3c7');
      slab(0, 0, 0, 170, 130, 0x65a30d, { sy: 2 });
      slab(0, 0.02, 0, 72, 52, 0xd6c6a8, { sy: 0.04, plain: true }); // the floor inside
      const W = (x, z, sx, sz, c = 0xf1f5f9, h = WALL) => part({ x, y: h / 2, z, sx, sy: h, sz, c });
      // the outside walls, with a front door and a back door
      W(-19.5, 26, 33, 1); W(19.5, 26, 33, 1); W(-17.5, -26, 37, 1); W(23.5, -26, 25, 1); W(-36, 0, 1, 53); W(36, 0, 1, 53);
      // inside walls, with doorways
      W(-10, 20, 1, 12); W(-10, 1, 1, 18); W(-10, -21.5, 1, 9);
      W(14, 21, 1, 10); W(14, 2, 1, 16); W(14, -19, 1, 14);
      W(-31, 0, 10, 1); W(-15, 0, 10, 1);
      W(18, -2, 8, 1); W(32, -2, 8, 1);
      part({ x: 0, y: WALL + 0.3, z: 0, sx: 73, sy: 0.6, sz: 53, c: 0x9a3412 }); // the roof
      // the living room: sofa, TV, bookshelf, plant
      part({ x: -18, y: 1.2, z: 6, sx: 10, sy: 2.4, sz: 3.5, c: 0x2563eb }); part({ x: -18, y: 2.6, z: 7.6, sx: 10, sy: 2.8, sz: 1, c: 0x1d4ed8 });
      part({ x: -23, y: 2.5, z: 24.8, sx: 8, sy: 4.4, sz: 1, c: 0x111827 }); part({ x: -34.5, y: 3.5, z: 14, sx: 2, sy: 7, sz: 7, c: 0x92400e });
      part({ x: -12.5, y: 2, z: 23, sx: 2.5, sy: 4, sz: 2.5, c: 0x16a34a, solid: false });
      // the bedroom: bed, wardrobe (you fit inside), desk, toy box
      part({ x: -28, y: 1.2, z: -14, sx: 8, sy: 2.4, sz: 12, c: 0xf472b6 }); part({ x: -28, y: 2.2, z: -19.2, sx: 8, sy: 2.2, sz: 1.5, c: 0xffffff });
      this.wardrobe(-33, -22, 'x'); this.wardrobe(-26, -23, 'z');
      part({ x: -14, y: 1.5, z: -10, sx: 6, sy: 3, sz: 3, c: 0x92400e }); part({ x: -16, y: 1, z: -23, sx: 4, sy: 2, sz: 4, c: 0xfacc15 });
      // the kitchen and hall: counters, fridge, table, island
      part({ x: -3, y: 2, z: -24.5, sx: 13, sy: 4, sz: 2, c: 0xe5e7eb }); part({ x: 8, y: 4, z: -23.5, sx: 4, sy: 8, sz: 3, c: 0xd1d5db });
      part({ x: -5, y: 1.6, z: 17, sx: 6, sy: 0.6, sz: 4, c: 0x92400e }); for (const [x, z] of [[-7.5, 15.4], [-2.5, 15.4], [-7.5, 18.6], [-2.5, 18.6]]) part({ x, y: 0.7, z, sx: 0.6, sy: 1.4, sz: 0.6, c: 0x78350f });
      part({ x: 2, y: 2, z: -12, sx: 8, sy: 4, sz: 4, c: 0x64748b }); part({ x: -6, y: 1.5, z: 23, sx: 3, sy: 3, sz: 3, c: 0x16a34a, solid: false });
      // the garage: a car, shelves, a stack of boxes
      part({ x: 26, y: 2, z: 14, sx: 8, sy: 3, sz: 14, c: 0xdc2626 }); part({ x: 26, y: 4.2, z: 15, sx: 7, sy: 1.6, sz: 7, c: 0x7dd3fc, alpha: 0.6, plain: true });
      part({ x: 35, y: 3.5, z: 12, sx: 1.6, sy: 7, sz: 18, c: 0x78716c });
      for (const [x, y, z] of [[17, 1.25, 23], [17, 3.75, 23], [19.6, 1.25, 23], [17, 1.25, 20.4]]) part({ x, y, z, sx: 2.5, sy: 2.5, sz: 2.5, c: 0xb45309 });
      // the bathroom: a bath, a shower with a curtain, a washing machine
      part({ x: 25, y: 0.8, z: -23, sx: 10, sy: 1.6, sz: 4.4, c: 0xffffff });
      for (const [x, z, sx, sz] of [[30, -10, 0.6, 7], [35, -10, 1, 7], [32.5, -13.3, 5, 0.6]]) part({ x, y: 4, z, sx, sy: 8, sz, c: 0xe0f2fe });
      part({ x: 32.5, y: 4, z: -6.7, sx: 5, sy: 7, sz: 0.2, c: 0x60a5fa, solid: false });
      part({ x: 17, y: 2, z: -6, sx: 3.5, sy: 4, sz: 3.5, c: 0xf8fafc });
      // the yard: bushes you can hide in, trees, a shed, a trampoline
      for (const [x, z] of [[-50, 30], [-50, -30], [-30, 38], [30, -40], [-46, 0], [46, -32], [-60, 12], [60, -10]]) part({ x, y: 3, z, sx: 6, sy: 6, sz: 6, c: 0x15803d, solid: false });
      for (const [x, z] of [[-62, -40], [62, 44], [-20, -48], [24, 50], [-70, 30]]) { part({ x, y: 4, z, sx: 2, sy: 8, sz: 2, c: 0x7c4a1e }); part({ x, y: 10, z, sx: 8, sy: 6, sz: 8, c: 0x16a34a, solid: false }); }
      for (const [x, z, sx, sz] of [[-52, 46, 12, 1], [-52, 54, 12, 1], [-58, 50, 1, 9]]) part({ x, y: 4, z, sx, sy: 8, sz, c: 0x854d0e });
      part({ x: -46, y: 4, z: 50, sx: 1, sy: 8, sz: 9, c: 0x854d0e, solid: false, alpha: 0.95 }); part({ x: -52, y: 8.2, z: 50, sx: 13, sy: 0.6, sz: 10, c: 0x713f12 });
      part({ x: 40, y: 0.6, z: 44, sx: 8, sy: 1.2, sz: 8, c: 0x111827, kind: 'bounce', power: 85 });
      // the seeker's box, with a door that opens when the seeking starts
      for (const [x, z, sx, sz] of [[CAGE[0], CAGE[1] - 5, 11, 1], [CAGE[0], CAGE[1] + 5, 11, 1], [CAGE[0] + 5, CAGE[1], 1, 11]]) part({ x, y: 4, z, sx, sy: 8, sz, c: 0x475569 });
      part({ x: CAGE[0], y: 8.3, z: CAGE[1], sx: 11, sy: 0.6, sz: 11, c: 0x334155 });
      this.door = part({ x: CAGE[0] - 5, y: 4, z: CAGE[1], sx: 1, sy: 8, sz: 9, c: 0x94a3b8 });
      const lb = label('🙈 SEEKER', { size: 1.6, color: '#fca5a5' }); lb.position.set(CAGE[0], 10.5, CAGE[1]); place.add(lb);
      const sg = label('🙈 HIDE AND SEEK', { size: 3.4, color: '#fde68a' }); sg.position.set(0, 11.5, 30); place.add(sg);
    },
    // a wardrobe: three sides and a top, and doors you can walk through (to hide inside)
    wardrobe(x, z, open) {
      const c = 0x78350f;
      if (open === 'x') { part({ x: x - 2, y: 3.5, z, sx: 0.5, sy: 7, sz: 4.5, c }); part({ x, y: 3.5, z: z - 2.2, sx: 4.5, sy: 7, sz: 0.5, c }); part({ x, y: 3.5, z: z + 2.2, sx: 4.5, sy: 7, sz: 0.5, c }); part({ x: x + 2.1, y: 3.5, z, sx: 0.2, sy: 7, sz: 4, c: 0xa16207, solid: false }); }
      else { part({ x, y: 3.5, z: z - 2, sx: 4.5, sy: 7, sz: 0.5, c }); part({ x: x - 2.2, y: 3.5, z, sx: 0.5, sy: 7, sz: 4.5, c }); part({ x: x + 2.2, y: 3.5, z, sx: 0.5, sy: 7, sz: 4.5, c }); part({ x, y: 3.5, z: z + 2.1, sx: 4, sy: 7, sz: 0.2, c: 0xa16207, solid: false }); }
      part({ x, y: 7.2, z, sx: 4.6, sy: 0.4, sz: 4.6, c });
    },
    pres() { return {}; },
    enter() {
      this.H = null; this.lastG = null; this.gSeen = null; this.rd = -1; this.ph = ''; this.coinRd = -1; this.botAv = new Map(); this.wasSeeker = false;
      const bf = document.createElement('div'); bf.id = 'hsBlind';
      bf.style.cssText = 'position:absolute;inset:0;background:#0b1020;display:none;place-items:center;color:#fff;font:700 30px var(--fh);text-align:center;pointer-events:none;z-index:5';
      $('#xhud').append(bf); this.blind = bf;
    },
    leave() { for (const a of this.botAv.values()) dropAvatar(a); this.botAv = new Map(); },
    spawn() {
      const g = this.g || roundState(this), mine = myPeer(), r = Math.random;
      if (g && g.ph === 'hide' && (g.sk || []).includes(mine)) return [CAGE[0] + (r() - 0.5) * 4, 0.5, CAGE[1] + (r() - 0.5) * 4, Math.PI / 2];
      return [LOBBY[0] + (r() - 0.5) * 20, 0.5, LOBBY[1] + r() * 6, 0];
    },
    adopt() {
      const g = this.lastG;
      return g ? JSON.parse(JSON.stringify(g)) : { ph: 'wait', left: 0, rd: 0, sk: [], hd: [], fd: [], bots: [], bp: [], sc: {}, last: '', gs: 0, ev: [] };
    },

    /* ---- the host: rounds, who's found, the bots ---- */
    host() {
      const now = performance.now(), dt = Math.min(1, (now - (this.hostT || now)) / 1000); this.hostT = now; // (real time)
      const H = this.H, humans = players(), n = humans.length;
      H.left = Math.max(0, H.left - dt);
      if (H.ph === 'wait') { if (n >= 1) { H.ph = 'count'; H.left = 8; } }
      else if (H.ph === 'count') { if (n < 1) H.ph = 'wait'; else if (H.left <= 0) this.startRound(humans); }
      else if (H.ph === 'hide' || H.ph === 'seek') {
        // anyone who left
        const here = (id) => this.isBot(id) || humans.some((p) => p.peer === id);
        H.sk = H.sk.filter(here); H.hd = H.hd.filter(here);
        if (!this.T) this.T = {}; // (a new host part way through)
        this.moveBots(dt, humans);
        if (H.ph === 'hide' && H.left <= 0) { H.ph = 'seek'; H.left = SEEK; }
        else if (H.ph === 'seek') {
          this.tags(humans);
          const people = H.sk.concat(H.hd).filter((id) => !this.isBot(id));
          if (!H.hd.length || !H.sk.length || !people.length || H.left <= 0) this.endRound();
        }
      } else if (H.ph === 'end' && H.left <= 0) { H.ph = n >= 1 ? 'count' : 'wait'; H.left = 8; }
      if (now - (this.hSent || 0) > 110) { this.hSent = now; hostSend(this); }
    },
    isBot: (id) => typeof id === 'string' && id.startsWith('bot:'),
    nameOfId(id, g) { if (this.isBot(id)) { const b = ((g || this.g || {}).bots || []).find((b) => b[0] === id); return b ? b[1] : 'a bot'; } return nameOf(id); },
    startRound(humans) {
      const H = this.H, ids = humans.map((p) => p.peer);
      H.ph = 'hide'; H.left = HIDE; H.rd = (H.rd | 0) + 1; H.fd = []; H.ev = []; H.bots = []; H.bp = [];
      // the seeker: someone who wasn't last time (alone, you take turns with a bot)
      const pick = ids.filter((id) => id !== H.last);
      let seeker = ids.length === 1 && H.last === ids[0] ? null : pick.length ? pick[Math.floor(Math.random() * pick.length)] : ids[0];
      const nb = Math.max(0, 5 - ids.length - (seeker ? 0 : 1));
      if (!seeker) { seeker = `bot:${H.rd}:s`; H.bots.push([seeker, 'Seeker Bot', Math.floor(Math.random() * 1e6)]); H.bp.push([seeker, CAGE[0], CAGE[1], 1]); }
      H.last = seeker; H.sk = [seeker]; H.hd = ids.filter((id) => id !== seeker);
      const spots = SPOTS.slice().sort(() => Math.random() - 0.5);
      for (let i = 0; i < nb; i++) {
        const id = `bot:${H.rd}:${i}`, s = spots[i % spots.length];
        H.bots.push([id, BOT_NAMES[(i + H.rd) % BOT_NAMES.length], Math.floor(Math.random() * 1e6)]);
        H.bp.push([id, LOBBY[0] + (Math.random() - 0.5) * 20, LOBBY[1], 0]); H.hd.push(id);
        this.T = this.T || {}; this.T[id] = { spot: s, at: 2 + Math.random() * 10, path: null };
      }
      this.T = this.T || {}; if (this.isBot(seeker)) this.T[seeker] = { path: null };
    },
    // where someone is (a bot from the host's list, a person from what they've said)
    posOf(id, humans) { if (this.isBot(id)) { const b = this.H.bp.find((b) => b[0] === id); return b && { x: b[1], z: b[2], y: 0.5 }; } const p = humans.find((q) => q.peer === id); return p && { x: p.x, y: p.y, z: p.z }; },
    tags(humans) {
      const H = this.H;
      for (const s of H.sk.slice()) {
        const sp = this.posOf(s, humans); if (!sp) continue;
        for (const h of H.hd.slice()) {
          const hp = this.posOf(h, humans); if (!hp) continue;
          if (Math.hypot(sp.x - hp.x, sp.z - hp.z) < TAG && Math.abs(sp.y - hp.y) < 4 && this.clear(sp, hp)) { // (not through a wall)
            H.hd = H.hd.filter((x) => x !== h); H.sk.push(h); H.fd.push([h, this.nameOfId(h, H), s]);
            H.sc[s] = (H.sc[s] || 0) + 1;
            H.ev = (H.ev || []).concat([[this.evSeq = (this.evSeq || 0) + 1, 'f', h, s, +hp.x.toFixed(1), +hp.z.toFixed(1)]]).slice(-6);
            if (this.isBot(h)) { const t = this.T[h] || (this.T[h] = {}); t.path = null; t.spot = null; }
          }
        }
      }
    },
    // is there a clear line between two places (at head height)?
    clear(a, b) {
      const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z));
      for (let k = 1; k < n; k++) { const x = a.x + (b.x - a.x) * k / n, z = a.z + (b.z - a.z) * k / n; for (const p of parts) { if (!p.solid || p.sy < 3 || p.y > 6) continue; const q = boxOf(p); if (x > q[0] && x < q[3] && z > q[2] && z < q[5] && 3 > q[1] && 3 < q[4]) return false; } }
      return true;
    },
    moveBots(dt, humans) {
      const H = this.H, T = this.T;
      for (const b of H.bp) {
        const id = b[0], t = T[id] || (T[id] = {}), seeking = H.sk.includes(id);
        const go = (x, z, sp) => { const dx = x - b[1], dz = z - b[2], d = Math.hypot(dx, dz), s = Math.min(d, sp * dt); if (d > 0.01) { b[1] = +(b[1] + dx / d * s).toFixed(2); b[2] = +(b[2] + dz / d * s).toFixed(2); } return d < 0.3; };
        const walkTo = (node, sp) => { if (!t.path || !t.path.length) t.path = route(near([b[1], b[2]]), node); const n = NODES[t.path[0]]; if (go(n[0], n[1], sp)) t.path.shift(); return !t.path.length; };
        if (!seeking) {
          // a hider: off to its spot (through the doors), then still as a statue
          if (H.ph === 'hide' && t.spot && H.left < HIDE - (t.at || 0)) {
            if (!t.path) t.path = route(near([b[1], b[2]]), near(t.spot)).concat(['*']);
            if (t.path[0] === '*') go(t.spot[0], t.spot[1], 13); else { const n = NODES[t.path[0]]; if (go(n[0], n[1], 13)) t.path.shift(); }
          }
          b[3] = 0;
        } else if (H.ph === 'seek') {
          // a seeker: room to room; anyone it can see, it chases
          let prey = null, pd = 26;
          for (const h of H.hd) { const hp = this.posOf(h, humans); if (!hp) continue; const d = Math.hypot(hp.x - b[1], hp.z - b[2]); if (d < pd && this.clear({ x: b[1], z: b[2] }, hp)) { pd = d; prey = hp; } }
          if (prey) { go(prey.x, prey.z, 15); t.path = null; }
          else if (walkTo(t.room || (t.room = ROOMS[Math.floor(Math.random() * ROOMS.length)]), 12)) { t.room = ROOMS[Math.floor(Math.random() * ROOMS.length)]; t.path = null; }
          b[3] = 1;
        } else b[3] = 1;
      }
    },
    endRound() {
      const H = this.H;
      H.ph = 'end'; H.left = 7; H.win = H.hd.length ? 'hiders' : 'seekers';
      for (const h of H.hd) H.sc[h] = (H.sc[h] || 0) + 3;
    },

    /* ---- everyone ---- */
    tick(dt) {
      const g = this.g = roundState(this), mine = myPeer();
      const seeker = !!(g && (g.sk || []).includes(mine)), active = g && (g.ph === 'hide' || g.ph === 'seek');
      if (g && active && g.rd !== this.rd) { this.rd = g.rd; this.evN = Math.max(0, ...((g.ev || []).map((e) => e[0]))); respawn(true); sfx('go'); toast(seeker ? '🙈 You’re the seeker! Count to 25…' : '🏃 Hide! The seeker is counting…', '#fde68a'); }
      if (g && g.ph !== this.ph) { if (g.ph === 'seek' && this.ph === 'hide') { sfx('alarm', { vol: 0.6 }); toast(seeker ? '🔎 Ready or not, here you come!' : '🔎 The seeker is coming!', '#fca5a5'); } this.ph = g.ph; }
      if (g && g.ph === 'count') { const c = Math.ceil(g.left); if (c !== this.cdS && c <= 3 && c > 0) sfx('count'); this.cdS = c; } else this.cdS = null;
      // the seeker's door, and the blindfold
      const shut = !(g && g.ph === 'seek'); this.door.solid = shut; this.door.m.visible = shut;
      const blind = !!(g && g.ph === 'hide' && seeker);
      this.blind.style.display = blind ? 'grid' : 'none';
      if (blind) this.blind.innerHTML = `<div>🙈 Counting… <span style="font-size:64px;display:block">${Math.ceil(g.left)}</span><small style="font:700 15px var(--fb);color:#94a3b8">no peeking!</small></div>`;
      // found someone (or you were found)
      for (const e of (g && g.ev) || []) {
        if (!(e[0] > (this.evN || 0))) continue; this.evN = e[0];
        if (e[1] === 'f') { puffAt(e[4], 3, e[5], [0xfde047, 0xffffff, 0xf472b6], 16); sfx3('pop', e[4], e[5], 80); if (e[2] === mine) { toast('🙈 You were found! Now help seek', '#fca5a5'); sfx('oof'); } if (e[3] === mine) { toast(`🎯 Found ${this.nameOfId(e[2], g)}!`, '#86efac'); sfx('reward'); earn(3); quest('hide.find'); } }
      }
      // seekers glow red; during the round, nobody's name shows (it would give hiders away)
      const glow = (id) => (g && active && (g.sk || []).includes(id) ? 0x991b1b : null);
      setGlow(me, glow(mine));
      for (const [peer, a] of Net.avatars) { setGlow(a, glow(peer)); if (a.tag) a.tag.visible = !active; }
      for (const [id, a] of this.botAv) { setGlow(a, glow(id)); if (a.tag) a.tag.visible = !active; }
      // coins when a round ends
      if (g && g.ph === 'end' && this.coinRd !== g.rd) {
        this.coinRd = g.rd;
        const hid = (g.hd || []).includes(mine), sk = (g.sk || []).includes(mine);
        if (hid) { earn(15, 'stayed hidden'); sfx('win'); quest('hide.hid'); } else if (sk && g.win === 'seekers') earn(10, 'found everyone');
      }
      this.drawBots(g, dt);
      const hiders = g ? (g.hd || []).length : 0, left = g ? Math.ceil(g.left) : 0;
      if (!g) setBanner('Getting the round…');
      else if (g.ph === 'wait') setBanner('Waiting for players…');
      else if (g.ph === 'count') setBanner(`🙈 Next round in ${left}…`);
      else if (g.ph === 'hide') setBanner(seeker ? `🙈 You’re the seeker — counting… ${left}` : `🏃 Hide! The seeker comes out in ${left}`);
      else if (g.ph === 'seek') setBanner(`${seeker ? '🔎 Find them! Touch a hider' : '🤫 Stay hidden!'} · ${hiders} hider${hiders === 1 ? '' : 's'} left · ⏱ ${mmss(g.left)}`);
      else setBanner(g.win === 'hiders' ? `🏆 The hiders win! ${(g.hd || []).map((id) => esc(this.nameOfId(id, g))).join(', ')} stayed hidden` : '🔎 The seekers found everyone!');
    },
    drawBots(g, dt) {
      const want = new Map(g && g.ph !== 'wait' && g.ph !== 'count' ? (g.bp || []).map((b) => [b[0], b]) : []);
      for (const [id, a] of this.botAv) if (!want.has(id)) { dropAvatar(a); this.botAv.delete(id); }
      for (const [id, b] of want) {
        let a = this.botAv.get(id);
        const info = (g.bots || []).find((x) => x[0] === id) || [id, 'Bot', 1];
        if (!a) { const r = mulberry(info[2] | 0), av = okAv([Math.floor(r() * 6), Math.floor(r() * 10), Math.floor(r() * 8), Math.floor(r() * 12), Math.floor(r() * 9), 0, 0, Math.floor(r() * 7), 0]); a = makeAvatar(av, '🤖 ' + info[1], false); a.g.position.set(b[1], 0.02, b[2]); scene.add(a.g); this.botAv.set(id, a); }
        const p = a.g.position, k = Math.min(1, dt * 10), dx = b[1] - p.x, dz = b[2] - p.z;
        if (Math.hypot(dx, dz) > 25) p.set(b[1], 0.02, b[2]); else { p.x += dx * k; p.z += dz * k; }
        if (Math.hypot(dx, dz) > 0.05) a.g.rotation.y = Math.atan2(-dx, -dz);
        animateAvatar(a, dt, Math.hypot(dx, dz) > 0.05, false); placeShadow(a);
      }
    },
    statOf(pr, isMe, peer) { const g = this.g; return g && g.sc ? g.sc[peer] || 0 : 0; },
    sortKey(pr, isMe, peer) { const g = this.g; return g && g.sc ? g.sc[peer] || 0 : 0; },
    hud() {
      const g = this.g, mine = myPeer();
      if (!g || (g.ph !== 'hide' && g.ph !== 'seek')) return '';
      return (g.sk || []).includes(mine) ? `🔎 You’re a <b>seeker</b> · found so far: ${(g.fd || []).length}` : `🤫 You’re <b>hiding</b> · ${(g.sk || []).length} seeker${(g.sk || []).length === 1 ? '' : 's'} looking`;
    },
  };
  addExp(HS);
  window.__rbHS = HS;
  window.__hide = { SPOTS, NODES, EDGES, route, CAGE, LOBBY }; // for tests
})();
