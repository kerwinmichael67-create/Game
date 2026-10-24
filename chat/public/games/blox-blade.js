/* =====================================================================
   BLOXVERSE — BLADE BALL. A glowing ball hunts one player at a time.
   Parry it (F or click) just before it hits you and it flies off at
   someone else, a little faster every time. Miss and you're out; the
   last one standing wins. Bots join when there aren't enough people.
   The host runs the ball; everyone presses their own parries.
   ===================================================================== */
(() => {
  const ARENA = 46; // half the arena's width
  const START_SPEED = 26, MAX_SPEED = 260;
  const reach = (s) => 7 + s * 0.1; // how far away you can parry a ball this fast
  const HIT = 2.4, GRACE = 0.3, COOL = 0.8;
  const BOT_NAMES = ['BladeBot', 'ParryPro', 'SwordSam', 'NinjaNed', 'SliceySue', 'BlockBob'];
  const TARGET_Y = 3.4;

  function swordMesh(c) {
    const g = new THREE.Group(), b = (col, sx, sy, sz, x, y, z) => { const o = new THREE.Mesh(BOX, new THREE.MeshLambertMaterial({ color: col, emissive: col === c ? 0x111111 : 0 })); o.scale.set(sx, sy, sz); o.position.set(x, y, z); g.add(o); return o; };
    b(0x3f2a1e, 0.24, 0.24, 1, 0, 0, -0.3); b(0xfacc15, 0.9, 0.22, 0.22, 0, 0, -0.85); b(c, 0.1, 0.36, 3.2, 0, 0, -2.6);
    return g;
  }

  const BB = {
    id: 'blade', code: 'bl', genre: 'PvP', rank: 0.1, name: 'Blade Ball', emoji: '⚔️', max: 10, stat: 'Wins', killY: -30, banner: true, camDist: 22,
    land: { theme: 'night', fence: 'none', under: [[-47, -47, 47, 47]], extras: ['crystals'] },
    color: 'linear-gradient(135deg,#ef4444,#1e1b4b)',
    desc: 'A glowing ball hunts one player at a time. Parry it (F or click) just before it hits and it flies at someone else, faster every time. Miss and you’re out — the last one standing wins. Bots join in when there aren’t enough players.',
    welcome: 'When the ball turns red and comes for you, press F (or click) to parry!',
    welcomeTouch: 'When the ball turns red and comes for you, tap ⚔️ Parry!',
    build() {
      sky('#1e1b4b', '#7c3aed');
      // the arena: a floor, glass walls, a ring in the middle
      slab(0, 0, 0, ARENA * 2, ARENA * 2, 0x312e81, { sy: 2 });
      part({ x: 0, y: 0.06, z: 0, sx: 12, sy: 0.12, sz: 12, c: 0xef4444, neon: true, solid: false });
      part({ x: 0, y: 0.08, z: 0, sx: 8, sy: 0.12, sz: 8, c: 0x312e81, plain: true, solid: false });
      for (const [x, z, sx, sz] of [[0, -ARENA - 1, ARENA * 2 + 4, 2], [0, ARENA + 1, ARENA * 2 + 4, 2], [-ARENA - 1, 0, 2, ARENA * 2], [ARENA + 1, 0, 2, ARENA * 2]]) part({ x, y: 5, z, sx, sy: 10, sz, c: 0xa78bfa, alpha: 0.25, plain: true });
      // a balcony all round, where you wait and watch
      for (const [x, z, sx, sz] of [[0, -ARENA - 9, ARENA * 2 + 32, 14], [0, ARENA + 9, ARENA * 2 + 32, 14], [-ARENA - 9, 0, 14, ARENA * 2 + 4], [ARENA + 9, 0, 14, ARENA * 2 + 4]]) slab(x, 10, z, sx, sz, 0x4338ca, { sy: 1 });
      for (const s of [-1, 1]) for (const t of [-1, 1]) part({ x: s * (ARENA + 9), y: 4.5, z: t * (ARENA + 9), sx: 3, sy: 9, sz: 3, c: 0x1e1b4b });
      for (const [x, z, sx, sz] of [[0, -ARENA - 16.5, ARENA * 2 + 32, 1], [0, ARENA + 16.5, ARENA * 2 + 32, 1], [-ARENA - 16.5, 0, 1, ARENA * 2 + 32], [ARENA + 16.5, 0, 1, ARENA * 2 + 32]]) part({ x, y: 11.5, z, sx, sy: 3, sz, c: 0xa78bfa, alpha: 0.3, plain: true });
      // steps down from the balcony into the arena (for between rounds)
      for (let k = 0; k < 5; k++) slab(0, 10 - (k + 1) * 2, ARENA + 1 - 3 - k * 3, 8, 3, 0x6366f1, { sy: 1 });
      const sg = label('⚔️ BLADE BALL', { size: 4, color: '#fca5a5' }); sg.position.set(0, 22, -ARENA - 14); place.add(sg);
      this.spawns = Array.from({ length: 12 }, (_, i) => [Math.cos(i * 0.5236) * 26, 0.5, Math.sin(i * 0.5236) * 26]);
      this.ball = null;
    },
    pres() { return { pk: 0, ay: 0 }; },
    enter() {
      this.H = null; this.hb = null; this.lastG = null; this.gSeen = null; this.rd = 0; this.evN = null; this.pk = 0; this.coolT = 0; this.botAv = new Map(); this.held = new Map(); this.parries = 0;
      const m = new THREE.Mesh(new THREE.SphereGeometry(1.1, 22, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      const glow = new THREE.Mesh(new THREE.SphereGeometry(1.6, 18, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false }));
      m.add(glow); m.visible = false; scene.add(m); this.ball = { m, glow, x: 0, y: TARGET_Y, z: 0 };
      setBar('<button class="xslot" data-k="parry" title="Parry (F)"><span class="k">F</span><span class="e">⚔️</span>Parry</button>', () => this.parry());
      send({ wp: hasItem('wide') ? 1 : 0 });
    },
    leave() {
      if (this.ball) { scene.remove(this.ball.m); this.ball = null; }
      for (const a of this.botAv.values()) dropAvatar(a);
      this.botAv = new Map();
      for (const h of this.held.values()) if (h.m && h.m.parent) h.m.parent.remove(h.m);
      this.held = new Map();
    },
    spawn() {
      const g = this.g, mine = myPeer();
      if (g && (g.ph === 'play' || g.ph === 'end') && !(g.al || []).includes(mine)) { const a = Math.random() * 6.283; return [Math.cos(a) * 6, 10.5, ARENA + 9 + Math.sin(a) * 2, Math.PI]; } // out: watch from the balcony
      const i = Math.max(0, crew().findIndex((c) => c.isMe)), s = this.spawns[(i * 5 + (this.rd | 0)) % 12];
      return [s[0], s[1], s[2], Math.atan2(s[0], s[2])];
    },
    adopt() {
      const g = this.lastG;
      this.evSeq = Math.max(this.evSeq || 0, ...((g && g.ev) || []).map((e) => e[0])); // carry on numbering where the last host was
      return g ? JSON.parse(JSON.stringify(g)) : { ph: 'wait', left: 0, rd: 0, al: [], sc: {}, w: '', b: null, bots: [], gs: 0, ev: [] };
    },

    /* ---- the host: rounds, bots and the ball ---- */
    host(dt) {
      const H = this.H, humans = players(), n = humans.length;
      H.left = Math.max(0, H.left - dt);
      if (!this.hb) this.hb = { x: 0, y: TARGET_Y, z: 0, vx: 0, vy: 0, vz: 0, s: START_SPEED, t: null, hold: 1.5, grace: 0, seen: new Map(), botTry: {} };
      const B = this.hb;
      if (H.ph === 'wait') { if (n >= 1) { H.ph = 'count'; H.left = 6; } }
      else if (H.ph === 'count') { if (n < 1) H.ph = 'wait'; else if (H.left <= 0) this.startRound(humans); }
      else if (H.ph === 'play') {
        H.al = H.al.filter((id) => this.isBot(id) || humans.some((p) => p.peer === id)); // someone left
        this.moveBots(dt);
        this.parriesIn(humans);
        if (H.al.length <= 1 || !H.al.some((id) => !this.isBot(id))) this.endRound();
        else this.stepBall(dt, humans);
      } else if (H.ph === 'end' && H.left <= 0) { H.ph = n >= 1 ? 'count' : 'wait'; H.left = 6; H.bots = []; H.b = null; }
      if (performance.now() - (this.sentAt || 0) > 100) {
        this.sentAt = performance.now();
        H.b = H.ph === 'play' ? [+B.x.toFixed(2), +B.y.toFixed(2), +B.z.toFixed(2), +B.vx.toFixed(1), +B.vy.toFixed(1), +B.vz.toFixed(1), Math.round(B.s), B.t, B.hold > 0 ? 1 : 0] : null;
        hostSend(this);
      }
    },
    isBot: (id) => typeof id === 'string' && id.startsWith('bot:'),
    startRound(humans) {
      const H = this.H, B = this.hb;
      H.ph = 'play'; H.left = 0; H.rd = (H.rd | 0) + 1; H.w = ''; H.wp = null; H.ev = [];
      H.al = humans.map((p) => p.peer);
      // bots fill in up to 4
      H.bots = [];
      for (let i = 0; H.al.length + H.bots.length < 4; i++) {
        const s = this.spawns[(i * 3 + 7 + H.rd) % 12], id = 'bot:' + i;
        H.bots.push([id, +s[0].toFixed(1), +s[2].toFixed(1), BOT_NAMES[(i + H.rd) % BOT_NAMES.length], Math.floor(Math.random() * 1e6)]);
      }
      H.al = H.al.concat(H.bots.map((b) => b[0]));
      Object.assign(B, { x: 0, y: TARGET_Y + 2, z: 0, vx: 0, vy: 0, vz: 0, s: START_SPEED, t: null, hold: 2.5, grace: 0, botTry: {} });
      for (const p of humans) B.seen.set(p.peer, +((p.pr && p.pr.pk && p.pr.pk[0]) || 0)); // old presses don't count
    },
    endRound() {
      const H = this.H, w = H.al[0];
      H.ph = 'end'; H.left = 6;
      H.wp = w || null; H.w = !w ? '' : this.isBot(w) ? (H.bots.find((b) => b[0] === w) || [])[3] || 'A bot' : nameOf(w);
      if (w && !this.isBot(w)) H.sc[w] = (H.sc[w] || 0) + 1;
    },
    posOf(id, humans) {
      if (this.isBot(id)) { const b = this.H.bots.find((b) => b[0] === id); return b ? { x: b[1], y: 0, z: b[2] } : null; }
      return humans.find((p) => p.peer === id) || null;
    },
    pickTarget(from, aim, humans) {
      const H = this.H, opts = H.al.filter((id) => id !== from);
      if (!opts.length) return null;
      if (aim == null) return opts[Math.floor(Math.random() * opts.length)];
      // whoever's closest to where the parrier is facing
      const f = this.posOf(from, humans); let best = null, bd = 1e9;
      for (const id of opts) { const p = this.posOf(id, humans); if (!p || !f) continue; let d = Math.atan2(-(p.x - f.x), -(p.z - f.z)) - aim; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; if (Math.abs(d) < bd) { bd = Math.abs(d); best = id; } }
      return best || opts[0];
    },
    deflect(by, aim, humans) {
      const H = this.H, B = this.hb, t = this.pickTarget(by, aim, humans), tp = t && this.posOf(t, humans);
      B.s = Math.min(MAX_SPEED, Math.max(B.s * 1.12, B.s + 4)); B.t = t; B.grace = 0; B.botTry = {};
      if (tp) { const dx = tp.x - B.x, dz = tp.z - B.z, d = Math.hypot(dx, dz) || 1; B.vx = (dx / d) * B.s * 0.8; B.vz = (dz / d) * B.s * 0.8; B.vy = B.s * 0.35; }
      H.ev = (H.ev || []).concat([[this.evSeq = (this.evSeq || 0) + 1, 'p', by, t]]).slice(-6);
    },
    eliminate(id) {
      const H = this.H, B = this.hb;
      H.al = H.al.filter((x) => x !== id);
      H.ev = (H.ev || []).concat([[this.evSeq = (this.evSeq || 0) + 1, 'x', id, +B.x.toFixed(1), +B.z.toFixed(1)]]).slice(-6);
      Object.assign(B, { x: 0, y: TARGET_Y + 2, z: 0, vx: 0, vy: 0, vz: 0, s: START_SPEED, t: null, hold: 1.6, grace: 0, botTry: {} });
    },
    parriesIn(humans) {
      const B = this.hb;
      for (const p of humans) {
        if (p.me) continue; // (the host's own parries go straight in)
        const pk = p.pr && Array.isArray(p.pr.pk) ? p.pr.pk : null;
        if (!pk || pk[0] === B.seen.get(p.peer)) continue;
        B.seen.set(p.peer, pk[0]);
        if (B.t !== p.peer || B.hold > 0) continue; // not you it's after: a whiff
        const d = Math.hypot(B.x - p.x, B.y - (p.y + TARGET_Y), B.z - p.z);
        if (d < reach(B.s) * 1.8 * (p.pr.wp ? 1.35 : 1) || B.grace > 0) this.deflect(p.peer, +pk[1] || 0, humans); // (wp: a Wide Parry)
      }
    },
    moveBots(dt) {
      const H = this.H, T = performance.now() / 1000;
      for (const b of H.bots) {
        if (!H.al.includes(b[0])) continue;
        const k = +b[0].slice(4);
        b[1] = +clamp(b[1] + Math.sin(T * 0.7 + k * 2) * 3 * dt, -ARENA + 4, ARENA - 4).toFixed(2);
        b[2] = +clamp(b[2] + Math.cos(T * 0.5 + k * 3) * 3 * dt, -ARENA + 4, ARENA - 4).toFixed(2);
      }
    },
    stepBall(dt, humans) {
      const H = this.H, B = this.hb;
      if (B.hold > 0) { B.hold -= dt; B.vx = B.vz = 0; B.y += (TARGET_Y + 2 - B.y) * Math.min(1, dt * 3); if (B.hold <= 0) { B.t = this.pickTarget(null, null, humans); } return; }
      if (!B.t || !H.al.includes(B.t)) { B.t = this.pickTarget(null, null, humans); if (!B.t) return; }
      const tp = this.posOf(B.t, humans);
      if (!tp) { B.t = null; return; }
      const tx = tp.x, ty = tp.y + TARGET_Y, tz = tp.z, dx = tx - B.x, dy = ty - B.y, dz = tz - B.z, d = Math.hypot(dx, dy, dz) || 1;
      // home in: turn the velocity towards the target, harder the closer it is
      const want = [dx / d * B.s, dy / d * B.s, dz / d * B.s], turn = Math.min(1, dt * (3 + 40 / Math.max(4, d)));
      B.vx += (want[0] - B.vx) * turn; B.vy += (want[1] - B.vy) * turn; B.vz += (want[2] - B.vz) * turn;
      const v = Math.hypot(B.vx, B.vy, B.vz) || 1, k = B.s / v; B.vx *= k; B.vy *= k; B.vz *= k;
      if (B.grace > 0) { B.grace -= dt; if (B.grace <= 0) this.eliminate(B.t); return; } // waiting at the target for a late parry
      B.x += B.vx * dt; B.y = clamp(B.y + B.vy * dt, 1.5, 30); B.z += B.vz * dt;
      B.x = clamp(B.x, -ARENA, ARENA); B.z = clamp(B.z, -ARENA, ARENA);
      const dd = Math.hypot(tx - B.x, ty - B.y, tz - B.z);
      // bots parry too: once per pass, less likely the faster it is
      if (this.isBot(B.t) && dd < reach(B.s) * 0.8 && !B.botTry[B.t]) {
        B.botTry[B.t] = 1;
        if (Math.random() < clamp(1.05 - B.s / 180, 0.2, 0.95)) { this.deflect(B.t, null, humans); return; }
      }
      if (dd < HIT) { if (this.isBot(B.t)) this.eliminate(B.t); else { B.grace = GRACE; B.x = tx; B.y = ty; B.z = tz; } }
    },

    /* ---- everyone ---- */
    parry() {
      if (this.coolT > 0 || P.dead) return;
      const g = this.g, mine = myPeer();
      if (!g || g.ph !== 'play' || !(g.al || []).includes(mine)) return;
      this.coolT = COOL * (hasItem('quick') ? 0.6 : 1); this.swingT = 0.3;
      this.pk++; send({ pk: [this.pk, +cam.yaw.toFixed(2)] });
      if (this.H && this.hb) { const B = this.hb; if (B.t === mine && B.hold <= 0 && (B.grace > 0 || Math.hypot(B.x - P.x, B.y - (P.y + TARGET_Y), B.z - P.z) < reach(B.s) * 1.3 * (hasItem('wide') ? 1.35 : 1))) this.deflect(mine, cam.yaw, players()); }
      sfx('swing', { pitch: 1.2 });
      puffAt(P.x - Math.sin(P.yaw) * 2, P.y + 3, P.z - Math.cos(P.yaw) * 2, [0xffffff, 0x93c5fd], 6);
    },
    click() { this.parry(); },
    key(code, down) { if (down && code === 'KeyF') { this.parry(); return true; } },
    tick(dt) {
      const g = this.g = roundState(this), mine = myPeer(), T = performance.now();
      this.coolT = Math.max(0, this.coolT - dt); this.swingT = Math.max(0, (this.swingT || 0) - dt);
      const alive = !!(g && (g.al || []).includes(mine));
      if (g && g.ph === 'play' && g.rd !== this.rd) { this.rd = g.rd; this.parries = 0; this.wasAlive = alive; respawn(); sfx('go'); toast('⚔️ Parry the ball when it comes for you!', '#fde68a'); }
      if (g && g.ph === 'count') { const c = Math.ceil(g.left); if (c !== this.cdS && c <= 5) sfx('count'); this.cdS = c; } else this.cdS = null;
      // knocked out
      if (g && g.ph === 'play' && this.wasAlive && !alive && !P.dead) { die(); toast('💥 The ball got you!', '#fca5a5'); }
      this.wasAlive = alive;
      // the round's news: parries and knockouts (only what's new since you got here)
      if (g && this.evN == null) this.evN = Math.max(0, ...(g.ev || []).map((e) => e[0]));
      for (const e of (g && g.ev) || []) {
        if (!(e[0] > (this.evN || 0))) continue;
        this.evN = e[0];
        if (e[1] === 'p') { const p = this.where(e[2]); if (p) puffAt(p.x, p.y + 3, p.z, [0xffffff, 0xfde047], 10); sfx3('block', p ? p.x : 0, p ? p.z : 0, 80); if (e[2] === mine) { this.parries++; if (this.parries <= 10) earn(1); quest('blade.parry'); } }
        if (e[1] === 'x') { puffAt(e[3], 3, e[4], [0xef4444, 0xfde047, 0x111111], 24); sfx3('boom', e[3], e[4], 120); if (this.isBot(e[2])) { const a = this.botAv.get(e[2]); if (a) scatter(a); } }
      }
      if (g && g.ph !== this.coinPh) { if (g.ph === 'end' && this.coinPh === 'play') { sfx(g.wp === mine ? 'win' : 'bell'); if (g.wp === mine) { earn(20, 'won Blade Ball'); quest('blade.win'); } } this.coinPh = g.ph; }
      this.drawBall(g, dt);
      this.drawBots(g, dt);
      // who the ball's after glows red
      const tg = g && g.b && g.ph === 'play' ? g.b[7] : null;
      setGlow(me, tg === mine ? 0x991b1b : null);
      for (const [peer, a] of Net.avatars) setGlow(a, tg === peer ? 0x991b1b : null);
      for (const [id, a] of this.botAv) setGlow(a, tg === id ? 0x991b1b : null);
      const left = g && g.al ? g.al.length : 0, speed = g && g.b ? g.b[6] : 0;
      if (!g) setBanner('Getting the round…');
      else if (g.ph === 'wait') setBanner('Waiting for players…');
      else if (g.ph === 'count') setBanner(`Next round in ${Math.ceil(g.left)}…`);
      else if (g.ph === 'play') setBanner(!alive ? `👀 You’re out — ${left} left · ball speed ${speed}` : tg === mine ? `🔴 THE BALL IS COMING FOR YOU — ${touchy ? 'tap ⚔️ Parry' : 'press F'}! · speed ${speed}` : `⚔️ ${left} left · ball speed ${speed}${tg ? ` · after ${esc(this.nameOfId(tg))}` : ''}`);
      else setBanner(`🏆 ${esc(g.w || 'Nobody')} wins!`);
    },
    nameOfId(id) { if (this.isBot(id)) { const b = ((this.g && this.g.bots) || []).find((b) => b[0] === id); return b ? b[3] : 'a bot'; } return nameOf(id); },
    where(id) {
      if (id === myPeer()) return P;
      if (this.isBot(id)) { const a = this.botAv.get(id); return a ? a.g.position : null; }
      const a = Net.avatars.get(id); return a ? a.g.position : null;
    },
    drawBall(g, dt) {
      const ball = this.ball;
      if (!ball) return;
      const b = g && g.b;
      ball.m.visible = !!b;
      if (!b) return;
      // the host's ball, carried on along its path since it was sent
      const since = this.H ? 0 : Math.min(0.25, (performance.now() - (this.gAt || performance.now())) / 1000);
      const tx = b[0] + b[3] * since, ty = b[1] + b[4] * since, tz = b[2] + b[5] * since, p = ball.m.position;
      const k = this.H ? 1 : Math.min(1, dt * 18);
      p.set(p.x + (tx - p.x) * k, p.y + (ty - p.y) * k, p.z + (tz - p.z) * k);
      const mineT = b[7] === myPeer();
      ball.m.material.color.setHex(b[8] ? 0xffffff : mineT ? 0xff2d2d : b[6] > 120 ? 0xfb923c : 0xfde68a);
      ball.glow.material.color.copy(ball.m.material.color);
      ball.glow.scale.setScalar(1 + Math.sin(performance.now() / 90) * 0.12);
      if (!b[8] && Math.random() < dt * (10 + b[6] / 10)) puffAt(p.x, p.y, p.z, ball.m.material.color.getHex(), 1);
      // close and coming for you: a warning sound
      const d = Math.hypot(p.x - P.x, p.y - (P.y + TARGET_Y), p.z - P.z);
      if (mineT && d < reach(b[6]) * 1.3 && performance.now() - (this.warnAt || 0) > 400) { this.warnAt = performance.now(); sfx('tick', { vol: 0.5, pitch: 1.6 }); }
    },
    drawBots(g, dt) {
      const want = new Map(((g && g.bots) || []).filter((b) => (g.al || []).includes(b[0]) || g.ph === 'end').map((b) => [b[0], b]));
      for (const [id, a] of this.botAv) if (!want.has(id)) { if (a.dead && a.dead.t < 2) { updateDead(a, dt); continue; } dropAvatar(a); this.botAv.delete(id); } // (knocked-out bots fall apart first)
      for (const [id, b] of want) {
        let a = this.botAv.get(id);
        if (!a) { const r = mulberry(b[4] | 0), av = okAv([Math.floor(r() * 6), Math.floor(r() * 10), Math.floor(r() * 8), Math.floor(r() * 12), Math.floor(r() * 9), 0, 0, Math.floor(r() * 7), 0]); a = makeAvatar(av, '🤖 ' + b[3], false); a.g.position.set(b[1], 0, b[2]); scene.add(a.g); this.botAv.set(id, a); }
        const p = a.g.position, dx = b[1] - p.x, dz = b[2] - p.z, k = Math.min(1, dt * 8);
        p.x += dx * k; p.z += dz * k;
        const bp = this.ball && this.ball.m.position; if (bp) a.g.rotation.y = Math.atan2(-(bp.x - p.x), -(bp.z - p.z));
        animateAvatar(a, dt, Math.hypot(dx, dz) > 0.05, false); placeShadow(a);
        this.holdSword(a, id, 0);
      }
    },
    // everyone holds a sword; it swings when they parry
    pose() {
      this.holdSword(me, 'me', this.swingT);
      for (const [peer, a] of Net.avatars) this.holdSword(a, peer, 0);
    },
    holdSword(a, key, swing) {
      if (!a || a.dead) return;
      let h = this.held.get(key);
      if (!h || h.a !== a) { if (h && h.m && h.m.parent) h.m.parent.remove(h.m); h = { a, m: swordMesh(key === 'me' ? 0x93c5fd : 0xe5e7eb) }; h.m.rotation.x = -Math.PI / 2 + 0.5; h.m.position.set(0, -1.9, 0); a.armR.add(h.m); this.held.set(key, h); }
      a.armR.rotation.x = swing > 0 ? 2.6 - (1 - swing / 0.3) * 2.6 : 0.6;
    },
    statOf(pr, isMe, peer) { const g = this.g; return g && g.sc ? g.sc[peer] || 0 : 0; },
    sortKey(pr, isMe, peer) { const g = this.g; return g && g.sc ? g.sc[peer] || 0 : 0; },
    hud() {
      const g = this.g;
      if (!g || g.ph !== 'play') return '';
      return `⚔️ Parry: <b>F</b> or click${this.coolT > 0 ? ` · ⏳ ${this.coolT.toFixed(1)}s` : ' · ✅ ready'} · your parries: ${this.parries}`;
    },
    coinShop: [
      { id: 'wide', e: '🛡️', n: 'Wide Parry', d: 'You can parry the ball from further away, for good', price: 600, kind: 'pass' },
      { id: 'quick', e: '⚡', n: 'Quick Hands', d: 'Your parry is ready again 40% sooner, for good', price: 500, kind: 'pass' },
      shopSpeed(300, 1.12),
    ],
    onBuy(id) { if (id === 'wide') send({ wp: 1 }); },
  };
  addExp(BB);
  window.__rbBL = BB; // for tests (__rbBB is the boat)
})();
