/* =====================================================================
   BLOXVERSE — COLOR BLOCK. A floor of coloured tiles over a long drop.
   A colour is called and a countdown runs; then every tile that isn't
   that colour vanishes. Be standing on the right colour or fall out!
   The floor comes back in a new pattern, and every call is quicker
   than the last. The last one standing wins.
   The host calls the colours; everyone works out the same pattern from
   the round's number, so only a few numbers need sending.
   ===================================================================== */
(() => {
  const G = 12, T = 6, HALF = (G * T) / 2; // tiles per side, tile size
  const COLS = [[0xef4444, 'Red', '🟥'], [0xf97316, 'Orange', '🟧'], [0xfacc15, 'Yellow', '🟨'], [0x22c55e, 'Green', '🟩'], [0x3b82f6, 'Blue', '🟦'], [0xa855f7, 'Purple', '🟪'], [0xf472b6, 'Pink', '💗'], [0xf8fafc, 'White', '⬜']];
  const GONE = 2.4; // how long the floor stays gone
  const BOT_NAMES = ['Hue Hopper', 'Tile Tess', 'Pixel Pip', 'Rainbow Ray', 'Blocky Bo', 'Swatch'];
  const BALC = [0, 12, HALF + 16]; // the balcony where you watch from when you're out
  const tileAt = (x, z) => { const i = Math.floor((x + HALF) / T), j = Math.floor((z + HALF) / T); return i >= 0 && j >= 0 && i < G && j < G ? j * G + i : -1; };
  const tileXZ = (k) => [-HALF + (k % G) * T + T / 2, -HALF + Math.floor(k / G) * T + T / 2];
  const ncol = (call) => Math.min(COLS.length, 4 + Math.floor(call / 2)); // more colours as it goes on
  const dur = (call) => Math.max(1.5, 4.6 - call * 0.25);
  // the pattern for a call: the same for everyone (from the round's seed)
  function pattern(seed, call) {
    const r = mulberry((seed * 131 + call * 7919) | 0), n = ncol(call);
    return Array.from({ length: G * G }, () => Math.floor(r() * n));
  }

  const CB = {
    id: 'color', code: 'cb', genre: 'Party', rank: 0.08, name: 'Color Block', emoji: '🎨', max: 12, stat: 'Wins', killY: -30, banner: true, camDist: 24, respawnDelay: 1600, noReset: true,
    land: { theme: 'night', mode: 'sky', low: -80, extras: ['crystals'] },
    color: 'linear-gradient(135deg,#ef4444,#facc15 33%,#22c55e 66%,#3b82f6)',
    desc: 'A colour is called — get onto a tile of that colour before the countdown ends, because every other tile vanishes! The floor comes back in a new pattern, each call quicker than the last. Last one standing wins.',
    welcome: 'Listen for the colour, and get on a tile of it before time runs out!',
    build() {
      sky('#1e1b4b', '#4c1d95');
      this.tiles = [];
      for (let k = 0; k < G * G; k++) { const [x, z] = tileXZ(k); const p = part({ x, y: -0.5, z, sx: T - 0.12, sy: 1, sz: T - 0.12, c: 0xffffff, plain: true }); p.tile = k; this.tiles.push(p); }
      // a rim round the floor, and four beacons that glow in the colour called
      for (const [x, z, sx, sz] of [[0, -HALF - 0.6, G * T + 2.4, 1.2], [0, HALF + 0.6, G * T + 2.4, 1.2], [-HALF - 0.6, 0, 1.2, G * T], [HALF + 0.6, 0, 1.2, G * T]]) part({ x, y: -0.4, z, sx, sy: 0.8, sz, c: 0x312e81, solid: false });
      this.beacons = [];
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { part({ x: sx * (HALF + 6), y: 4, z: sz * (HALF + 6), sx: 2, sy: 8, sz: 2, c: 0x1e1b4b }); this.beacons.push(part({ x: sx * (HALF + 6), y: 9.5, z: sz * (HALF + 6), sx: 3.4, sy: 3, sz: 3.4, c: 0xffffff, neon: true, solid: false })); }
      // the balcony to watch from, and steps down to the floor from it
      slab(BALC[0], BALC[1], BALC[2], 70, 14, 0x4338ca, { sy: 1 });
      part({ x: 0, y: BALC[1] + 1.5, z: BALC[2] - 7.2, sx: 70, sy: 3, sz: 0.5, c: 0xa5b4fc, alpha: 0.35, plain: true });
      for (let k = 0; k < 5; k++) slab(30, BALC[1] - (k + 1) * 2.2, BALC[2] - 7 - (k + 1) * 2.4, 6, 2.4, 0x6366f1, { sy: 1 });
      const sg = label('🎨 COLOR BLOCK', { size: 4, color: '#fde68a' }); sg.position.set(0, 26, BALC[2] + 8); place.add(sg);
      this.callLab = null; this.shown = '';
    },
    pres() { return { co: [0, 0] }; },
    enter() {
      this.H = null; this.lastG = null; this.gSeen = null; this.rd = -1; this.out = false; this.survived = 0; this.coinRd = -1; this.botAv = new Map(); this.callSeen = -1; this.stSeen = '';
    },
    leave() { for (const a of this.botAv.values()) dropAvatar(a); this.botAv = new Map(); },
    spawn() {
      const g = this.g || roundState(this), r = Math.random;
      if (g && g.ph === 'play' && (this.out || g.rd !== this.rd || !(g.al || []).includes(myPeer()))) return [BALC[0] + (r() - 0.5) * 50, BALC[1] + 0.5, BALC[2] + (r() - 0.5) * 6, 0];
      const [x, z] = tileXZ(Math.floor(r() * G * G));
      return [x + (r() - 0.5) * 2, 0.5, z + (r() - 0.5) * 2, 0];
    },
    adopt() {
      const g = this.lastG;
      return g ? JSON.parse(JSON.stringify(g)) : { ph: 'wait', left: 0, el: 0, rd: 0, seed: 1, call: 0, cc: 0, st: 'show', t0: 0, al: [], bots: [], bp: [], out: [], sc: {}, gs: 0 };
    },

    /* ---- the host: the calls, who's still in, the bots ---- */
    host() {
      const now = performance.now(), dt = Math.min(1, (now - (this.hostT || now)) / 1000); this.hostT = now; // (real time)
      const H = this.H, humans = players(), n = humans.length;
      H.left = Math.max(0, H.left - dt);
      if (H.ph === 'wait') { if (n >= 1) { H.ph = 'count'; H.left = 8; } }
      else if (H.ph === 'count') { if (n < 1) H.ph = 'wait'; else if (H.left <= 0) this.startRound(humans); }
      else if (H.ph === 'play') {
        H.el += dt;
        // people who fell out (or left)
        for (const id of H.al.slice()) {
          if (this.isBot(id)) continue;
          const p = humans.find((q) => q.peer === id), co = p && (p.me ? [H.rd, this.out ? 1 : 0] : p.pr && p.pr.co);
          if (!p || (Array.isArray(co) && co[0] === H.rd && co[1])) this.knockOut(id);
        }
        this.calls(dt);
        const people = H.al.filter((id) => !this.isBot(id));
        if (!people.length || H.al.length <= 1) this.endRound();
      } else if (H.ph === 'end' && H.left <= 0) { H.ph = n >= 1 ? 'count' : 'wait'; H.left = 8; }
      if (now - (this.hSent || 0) > 110) { this.hSent = now; hostSend(this); }
    },
    isBot: (id) => typeof id === 'string' && id.startsWith('bot:'),
    nameOfId(id, g) { if (this.isBot(id)) { const b = ((g || this.g || {}).bots || []).find((b) => b[0] === id); return b ? b[1] : 'a bot'; } return nameOf(id); },
    startRound(humans) {
      const H = this.H;
      H.ph = 'play'; H.el = 0; H.rd = (H.rd | 0) + 1; H.seed = Math.floor(Math.random() * 1e6); H.call = 0; H.st = 'show'; H.t0 = 0; H.out = [];
      H.cc = this.pick(H.seed, 0);
      H.al = humans.map((p) => p.peer);
      H.bots = []; H.bp = [];
      for (let i = 0; H.al.length < 5; i++) { // (the bots go into the list of who's still in, too)
        const id = `bot:${H.rd}:${i}`, [x, z] = tileXZ(Math.floor(Math.random() * G * G));
        H.bots.push([id, BOT_NAMES[(i + H.rd) % BOT_NAMES.length], Math.floor(Math.random() * 1e6), 0.25 + Math.random() * 0.5, 13 + Math.random() * 6, 0.1 + Math.random() * 0.15]); // [id, name, seed, reaction, speed, chance of a wrong tile]
        H.bp.push([id, +x.toFixed(1), 0, +z.toFixed(1)]);
        H.al.push(id);
      }
      this.botT = {};
    },
    // the colour called: one that's on the floor
    pick(seed, call) { const pt = pattern(seed, call), have = [...new Set(pt)]; return have[Math.floor(mulberry(seed + call * 31)() * have.length)]; },
    calls(dt) {
      const H = this.H, t = H.el - H.t0;
      if (!this.botT) this.botT = {}; // (a new host part way through)
      if (H.st === 'show' && t >= dur(H.call)) {
        H.st = 'gone'; H.t0 = +H.el.toFixed(2);
        // the bots not on the right colour fall
        const pt = pattern(H.seed, H.call);
        for (const b of H.bp) { if (!H.al.includes(b[0])) continue; const k = tileAt(b[1], b[3]); if (k < 0 || pt[k] !== H.cc) { this.botT[b[0]] = Object.assign(this.botT[b[0]] || {}, { fall: 0.001 }); } }
      } else if (H.st === 'gone' && t >= GONE) {
        H.call++; H.st = 'show'; H.t0 = +H.el.toFixed(2); H.cc = this.pick(H.seed, H.call);
      }
      this.moveBots(dt);
    },
    knockOut(id) { const H = this.H; if (!H.al.includes(id)) return; H.al = H.al.filter((x) => x !== id); H.out.push([id, this.nameOfId(id, H), H.call]); },
    moveBots(dt) {
      const H = this.H, pt = pattern(H.seed, H.call);
      for (const b of H.bp) {
        if (!H.al.includes(b[0]) && !(this.botT[b[0]] && this.botT[b[0]].fall)) continue;
        const info = H.bots.find((x) => x[0] === b[0]) || [b[0], 'bot', 0, 0.4, 14, 0.15], t = this.botT[b[0]] || (this.botT[b[0]] = {});
        if (t.fall) { t.fall += dt; b[2] = +(-t.fall * t.fall * 25).toFixed(1); if (t.fall > 1.2 && H.al.includes(b[0])) this.knockOut(b[0]); continue; }
        if (H.st === 'show') {
          // after a moment to react, head for a tile of the colour (usually the nearest one)
          if (t.call !== H.call) { t.call = H.call; t.react = info[3]; t.goal = null; }
          t.react -= dt;
          if (t.react <= 0 && t.goal == null) {
            const opts = pt.map((c, k) => (c === H.cc ? k : -1)).filter((k) => k >= 0);
            const wrong = Math.random() < info[5] + H.call * 0.02;
            if (wrong) t.goal = tileXZ(Math.floor(Math.random() * G * G));
            else { let best = null, bd = 1e9; for (const k of opts) { const [x, z] = tileXZ(k), d = Math.hypot(x - b[1], z - b[3]); if (d < bd) { bd = d; best = [x + (Math.random() - 0.5) * 2, z + (Math.random() - 0.5) * 2]; } } t.goal = best; }
          }
          if (t.goal) { const dx = t.goal[0] - b[1], dz = t.goal[1] - b[3], d = Math.hypot(dx, dz), s = Math.min(d, info[4] * dt); if (d > 0.05) { b[1] = +(b[1] + dx / d * s).toFixed(2); b[3] = +(b[3] + dz / d * s).toFixed(2); } }
        }
      }
    },
    endRound() {
      const H = this.H;
      H.ph = 'end'; H.left = 7;
      const w = H.al.length === 1 ? H.al[0] : null;
      H.w = w; H.wn = w ? this.nameOfId(w, H) : '';
      if (w && !this.isBot(w)) H.sc[w] = (H.sc[w] || 0) + 1;
    },

    /* ---- everyone ---- */
    tick(dt) {
      const g = this.g = roundState(this), mine = myPeer();
      if (g && g.ph === 'play' && g.rd !== this.rd) {
        this.rd = g.rd; this.out = !(g.al || []).includes(mine); this.survived = 0; this.callSeen = -1;
        send({ co: [g.rd, this.out ? 1 : 0] });
        if (!this.out) { sfx('go'); toast('🎨 Listen for the colour!', '#fde68a'); }
      }
      if (g && g.ph === 'count') { const c = Math.ceil(g.left); if (c !== this.cdS && c <= 3 && c > 0) sfx('count'); this.cdS = c; } else this.cdS = null;
      const playing = !!(g && g.ph === 'play');
      // the floor: this call's pattern; while it's gone, only the called colour is left
      const call = playing ? g.call : -1, st = playing ? g.st : 'show', key = playing ? `${g.seed}:${call}:${st}` : 'idle';
      if (key !== this.shown) {
        this.shown = key;
        const pt = playing ? pattern(g.seed, call) : null;
        for (const p of this.tiles) {
          const c = pt ? pt[p.tile] : (p.tile * 7 + (p.tile >> 3)) % COLS.length;
          p.m.material.color.setHex(COLS[c][0]);
          const on = !playing || st === 'show' || c === g.cc;
          p.solid = on; p.m.visible = on;
        }
        if (playing && st === 'gone') sfx('whoosh');
        if (playing && st === 'show' && call > 0) sfx('pop', { vol: 0.6 });
      }
      for (const [k, b] of this.beacons.entries()) b.m.material.color.setHex(playing ? COLS[g.cc][0] : COLS[(Math.floor(performance.now() / 600) + k) % COLS.length][0]);
      // a countdown tick each second
      if (playing && st === 'show') { const left = Math.ceil(dur(call) - (g.el - g.t0)); if (left !== this.tickS && left > 0) { sfx('tick', { vol: 0.5, pitch: left <= 1 ? 1.5 : 1.1 }); this.tickS = left; } }
      // made it through a call
      if (playing && st === 'show' && call > 0 && call !== this.callSeen) { if (this.callSeen >= 0 && !this.out) { this.survived++; if (this.survived <= 15) earn(1); quest('color.call'); } this.callSeen = call; }
      else if (playing && this.callSeen < 0) this.callSeen = call;
      // fell: out for this round
      if (playing && !this.out && (P.dead || P.y < -4)) { this.out = true; send({ co: [g.rd, 1] }); toast(`💥 You’re out! You lasted ${this.survived} call${this.survived === 1 ? '' : 's'}`, '#fca5a5'); }
      // coins when a round ends
      if (g && g.ph === 'end' && this.coinRd !== g.rd) { this.coinRd = g.rd; if (g.w === mine) { earn(15, 'won Color Block'); quest('color.win'); sfx('win'); puffAt(P.x, P.y + 3, P.z, CONFETTI, 50); } }
      this.drawBots(g, dt);
      // the banner: the colour called, and how long is left
      if (!g) setBanner('Getting the round…');
      else if (g.ph === 'wait') setBanner('Waiting for players…');
      else if (g.ph === 'count') setBanner(`🎨 Next round in ${Math.ceil(g.left)}…`);
      else if (g.ph === 'play') {
        const C = COLS[g.cc], left = Math.max(0, dur(call) - (g.el - g.t0));
        setBanner(st === 'show' ? `<span style="display:inline-block;width:1.1em;height:1.1em;border-radius:5px;vertical-align:-0.18em;background:#${C[0].toString(16).padStart(6, '0')};box-shadow:0 0 0 2px #fff"></span> <b>${C[1].toUpperCase()}</b> · ⏳ ${left.toFixed(1)}s${this.out ? ' · 👀 you’re out' : ''} · ${(g.al || []).length} left`
          : `${C[2]} Only ${C[1]} is left!${this.out ? ' · 👀 you’re out' : ''} · ${(g.al || []).length} left`);
      } else setBanner(g.w ? `🏆 ${esc(g.wn)} wins!` : '🏁 Round over');
    },
    drawBots(g, dt) {
      const want = new Map(g && (g.ph === 'play' || g.ph === 'end') ? (g.bp || []).map((b) => [b[0], b]) : []);
      for (const [id, a] of this.botAv) if (!want.has(id)) { dropAvatar(a); this.botAv.delete(id); }
      for (const [id, b] of want) {
        let a = this.botAv.get(id);
        const info = (g.bots || []).find((x) => x[0] === id) || [id, 'Bot', 1];
        if (!a) { const r = mulberry(info[2] | 0), av = okAv([Math.floor(r() * 6), Math.floor(r() * 10), Math.floor(r() * 8), Math.floor(r() * 12), Math.floor(r() * 9), 0, 0, Math.floor(r() * 7), 0]); a = makeAvatar(av, '🤖 ' + info[1], false); a.g.position.set(b[1], b[2], b[3]); scene.add(a.g); this.botAv.set(id, a); }
        a.g.visible = b[2] > -28;
        const p = a.g.position, k = Math.min(1, dt * 10), dx = b[1] - p.x, dz = b[3] - p.z;
        p.x += dx * k; p.y += (b[2] - p.y) * Math.min(1, dt * 14); p.z += dz * k;
        if (Math.hypot(dx, dz) > 0.1) a.g.rotation.y = Math.atan2(-dx, -dz);
        animateAvatar(a, dt, Math.hypot(dx, dz) > 0.1, b[2] < -0.5); placeShadow(a);
      }
    },
    statOf(pr, isMe, peer) { const g = this.g; return g && g.sc ? g.sc[peer] || 0 : 0; },
    sortKey(pr, isMe, peer) { const g = this.g; return g && g.sc ? g.sc[peer] || 0 : 0; },
    hud() {
      const g = this.g;
      if (!g || g.ph !== 'play') return '';
      const k = tileAt(P.x, P.z), pt = pattern(g.seed, g.call), on = k >= 0 && !this.out ? COLS[pt[k]] : null;
      return this.out ? `👀 Watching · you lasted ${this.survived} call${this.survived === 1 ? '' : 's'}` : `${on ? `You’re on ${on[2]} ${on[1]}${pt[k] === g.cc ? ' ✅' : ' ❌'}` : ''} · ✅ ${this.survived} survived`;
    },
  };
  addExp(CB);
  window.__rbCB = CB;
  window.__cblock = { pattern, tileAt, tileXZ, COLS, dur, G, T }; // for tests
})();
