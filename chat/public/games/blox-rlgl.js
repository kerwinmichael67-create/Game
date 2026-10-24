/* =====================================================================
   BLOXVERSE — RED LIGHT, GREEN LIGHT. Run up the field while the big
   robot looks away (green light); freeze when it turns round (red
   light). Move while it's watching and you're sent back to the start.
   Past the field is the glass bridge: in each row one panel holds and
   the other breaks. Fall and you try again from the start of the bridge.
   Everyone who reaches the far side in time wins the round.
   The host runs the lights, the bots and the order people finish in.
   ===================================================================== */
(() => {
  const FIELD = 160, HALF = 40;           // the field runs from z 0 to z -FIELD
  const ROWS = 8, ROW0 = -FIELD - 9, GAP = 7, PW = 5; // the glass bridge: rows of two panels
  const DECK = ROW0 - (ROWS - 1) * GAP - 6; // where the finish deck starts
  const ROUND = 120, GRACE = 0.35;
  const BOT_NAMES = ['Freezy', 'Sprinty', 'StopBot', 'Tippy Toes', 'Statue Sam', 'Quick Quinn', 'Wobbles'];
  const rowZ = (k) => ROW0 - k * GAP, sideX = (s) => (s ? 3.5 : -3.5);

  function watcher() {
    const g = new THREE.Group(), L = (c) => new THREE.MeshLambertMaterial({ color: c });
    const box = (par, c, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(BOX, typeof c === 'number' ? L(c) : c); m.scale.set(sx, sy, sz); m.position.set(x, y, z); par.add(m); return m; };
    box(g, 0x64748b, 8, 2, 6, 0, 1, 0);
    box(g, 0xf97316, 6, 9, 4, 0, 6.5, 0); box(g, 0xfde047, 6.2, 1.2, 4.2, 0, 5.2, 0);
    for (const s of [-1, 1]) { const arm = box(g, 0xf97316, 1.6, 7, 1.6, s * 4, 7, 0); arm.rotation.z = s * 0.15; }
    const head = new THREE.Group(); head.position.set(0, 13.5, 0); g.add(head);
    box(head, 0xe2e8f0, 5.5, 5, 5, 0, 0, 0); box(head, 0x1f2937, 4.6, 0.8, 5.2, 0, 2.6, 0);
    const eyeM = new THREE.MeshBasicMaterial({ color: 0x111827 });
    const eyes = [-1.2, 1.2].map((x) => box(head, eyeM, 1.1, 1.1, 0.3, x, 0.4, 2.55));
    box(head, 0x111827, 2.2, 0.3, 0.3, 0, -1.2, 2.55);
    const ant = box(head, 0x9ca3af, 0.3, 2, 0.3, 0, 3.4, 0); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e })); bulb.position.set(0, 4.6, 0); head.add(bulb);
    return { g, head, eyeM, bulb, ant };
  }

  const RL = {
    id: 'rlgl', code: 'rl', genre: 'Party', rank: 0.07, name: 'Red Light, Green Light', emoji: '🚦', max: 12, stat: 'Wins', killY: -30, banner: true, camDist: 22, respawnDelay: 1500,
    land: { theme: 'blossom', mode: 'sky', low: -90 },
    color: 'linear-gradient(135deg,#22c55e,#facc15 50%,#ef4444)',
    desc: 'Run up the field while the robot looks away, and freeze when it turns round: move on a red light and you’re back at the start. Then cross the glass bridge — in every row one panel holds and the other breaks! Everyone who gets across in time wins the round.',
    welcome: 'Green light: run! Red light: don’t move a muscle!',
    build() {
      sky('#93c5fd', '#fdf2f8');
      // the start pen, the field, its walls
      slab(0, 0, 12, HALF * 2, 26, 0xd6d3d1, { sy: 2 });
      slab(0, 0, -FIELD / 2, HALF * 2, FIELD, 0xe9d8a6, { sy: 2 });
      part({ x: 0, y: 0.06, z: -0.5, sx: HALF * 2, sy: 0.12, sz: 1, c: 0xffffff, neon: true, solid: false });
      part({ x: 0, y: 0.06, z: -FIELD + 0.5, sx: HALF * 2, sy: 0.12, sz: 1, c: 0xef4444, neon: true, solid: false });
      for (const s of [-1, 1]) {
        part({ x: s * (HALF + 1), y: 9, z: -FIELD / 2 + 12, sx: 2, sy: 18, sz: FIELD + 26, c: s < 0 ? 0xf9a8d4 : 0x93c5fd });
        for (let k = 0; k < 8; k++) part({ x: s * HALF, y: 13 + (k % 2) * 2, z: 20 - k * 23, sx: 0.4, sy: 3, sz: 6, c: 0xffffff, solid: false, plain: true });
      }
      // the back of the pen: low, with glass above, so the camera behind you sees over it
      part({ x: 0, y: 1, z: 26, sx: HALF * 2 + 4, sy: 2, sz: 2, c: 0xfde68a });
      part({ x: 0, y: 10, z: 26, sx: HALF * 2 + 4, sy: 16, sz: 1, c: 0xfef9c3, alpha: 0.18, plain: true });
      // the gate that holds everyone in the pen before the start
      this.gate = part({ x: 0, y: 3, z: 0.6, sx: HALF * 2, sy: 6, sz: 0.4, c: 0xfca5a5, alpha: 0.35, plain: true });
      // the glass bridge over the drop (from a little deck at the end of the field), and the finish deck past it
      slab(0, 0, -FIELD - 2.5, 20, 5, 0xd6d3d1, { sy: 2 });
      this.panels = [];
      for (let k = 0; k < ROWS; k++) for (const s of [0, 1]) {
        const p = part({ x: sideX(s), y: -0.4, z: rowZ(k), sx: PW, sy: 0.8, sz: PW, c: 0xbae6fd, alpha: 0.55, plain: true });
        p.row = k; p.side = s; this.panels.push(p);
      }
      for (let k = 0; k < ROWS; k++) for (const s of [-1, 1]) part({ x: s * 7.2, y: 0.3, z: rowZ(k), sx: 0.6, sy: 0.6, sz: GAP, c: 0x94a3b8, solid: false });
      slab(0, 0, DECK - 14, 30, 28, 0xfde68a, { sy: 2 });
      this.finish = part({ x: 0, y: 0.06, z: DECK - 1, sx: 30, sy: 0.12, sz: 2, c: 0x22c55e, neon: true, solid: false });
      for (const s of [-1, 1]) part({ x: s * 13, y: 7, z: DECK - 4, sx: 2, sy: 14, sz: 2, c: 0xfacc15 });
      part({ x: 0, y: 14.5, z: DECK - 4, sx: 28, sy: 2, sz: 2, c: 0xfacc15 });
      const lb = label('🏆 YOU MADE IT!', { size: 2.4, color: '#fde68a' }); lb.position.set(0, 18, DECK - 4); place.add(lb);
      // the robot, on a tower beside the bridge, looking down the field
      part({ x: 24, y: 7, z: -FIELD - 8, sx: 14, sy: 14, sz: 14, c: 0x475569 });
      this.bot = watcher(); this.bot.g.position.set(24, 14, -FIELD - 8); this.bot.g.scale.setScalar(1.7); place.add(this.bot.g);
      const sg = label('🚦 RED LIGHT, GREEN LIGHT', { size: 3, color: '#fff' }); sg.position.set(0, 21, 26); place.add(sg);
    },
    pres() { return { rf: [0, 0], rb: [0, 0] }; },
    enter() {
      this.H = null; this.lastG = null; this.gSeen = null; this.rd = -1; this.onBridge = false; this.finT = 0; this.caught = 0; this.coinRd = -1; this.botAv = new Map(); this.broken = 0; this.headY = Math.PI;
      const tint = document.createElement('div'); tint.id = 'rlTint'; tint.style.cssText = 'position:absolute;inset:0;pointer-events:none;transition:box-shadow .25s;border-radius:0';
      $('#xhud').append(tint); this.tint = tint;
    },
    leave() { for (const a of this.botAv.values()) dropAvatar(a); this.botAv = new Map(); },
    spawn() {
      const g = this.g || roundState(this), r = Math.random;
      if (g && g.ph === 'play' && g.rd === this.rd && this.finT) return [(r() - 0.5) * 16, 0.5, DECK - 12 - r() * 8, 0];
      if (g && g.ph === 'play' && g.rd === this.rd && this.onBridge) return [(r() - 0.5) * 8, 0.5, -FIELD - 2.5, 0];
      return [(r() - 0.5) * (HALF * 2 - 10), 0.5, 3 + r() * 10, 0]; // (near the front of the pen, so the camera behind you is still inside it)
    },
    adopt() {
      const g = this.lastG;
      return g ? JSON.parse(JSON.stringify(g)) : { ph: 'wait', left: 0, el: 0, rd: 0, lt: 'g', lt0: 0, glass: 0, br: 0, fin: [], bots: [], bp: [], sc: {}, gs: 0 };
    },

    /* ---- the host: the lights, the bridge, the bots ---- */
    host() {
      const now = performance.now(), dt = Math.min(1, (now - (this.hostT || now)) / 1000); this.hostT = now; // (real time)
      const H = this.H, humans = players(), n = humans.length;
      H.left = Math.max(0, H.left - dt);
      if (H.ph === 'wait') { if (n >= 1) { H.ph = 'count'; H.left = 7; } }
      else if (H.ph === 'count') { if (n < 1) H.ph = 'wait'; else if (H.left <= 0) this.startRound(humans); }
      else if (H.ph === 'play') {
        H.el += dt;
        this.lights(dt);
        // who's crossed, and anyone standing on glass that breaks
        for (const p of humans) {
          const rf = p.me ? [H.rd, this.finT] : p.pr && p.pr.rf;
          if (Array.isArray(rf) && rf[0] === H.rd && rf[1] > 0 && !H.fin.some((f) => f[0] === p.peer)) H.fin.push([p.peer, nameOf(p.peer), +(+rf[1]).toFixed(1)]);
          this.standCheck(p.x, p.y, p.z);
          const rb = !p.me && p.pr && p.pr.rb; if (Array.isArray(rb) && rb[0] === H.rd) H.br |= rb[1] | 0; // what they broke themselves
        }
        this.moveBots(dt);
        if (!n || humans.every((p) => H.fin.some((f) => f[0] === p.peer)) || H.left <= 0) { H.ph = 'end'; H.left = 7; const w = H.fin[0]; if (w && !this.isBot(w[0])) H.sc[w[0]] = (H.sc[w[0]] || 0) + 1; }
      } else if (H.ph === 'end' && H.left <= 0) { H.ph = n >= 1 ? 'count' : 'wait'; H.left = 7; }
      if (now - (this.hSent || 0) > 110) { this.hSent = now; hostSend(this); }
    },
    isBot: (id) => typeof id === 'string' && id.startsWith('bot:'),
    startRound(humans) {
      const H = this.H;
      H.ph = 'play'; H.left = ROUND; H.el = 0; H.rd = (H.rd | 0) + 1; H.fin = []; H.br = 0;
      H.glass = Math.floor(Math.random() * 256); // bit k: the right-hand panel of row k is the one that holds
      H.lt = 'g'; H.lt0 = 0; this.ltEnd = 3 + Math.random() * 2;
      // bots make up the numbers (up to 5 in all)
      H.bots = []; H.bp = [];
      for (let i = 0; humans.length + H.bots.length < 5; i++) {
        const id = `bot:${H.rd}:${i}`, x = -30 + Math.random() * 60;
        H.bots.push([id, BOT_NAMES[(i + H.rd * 2) % BOT_NAMES.length], Math.floor(Math.random() * 1e6), 9 + Math.random() * 5]);
        H.bp.push([id, +x.toFixed(1), 0, +(8 + Math.random() * 12).toFixed(1), 0]); // [id, x, y, z, state: 0 field, 1 bridge, 2 falling, 3 across]
      }
      this.botT = {};
    },
    lights(dt) {
      const H = this.H, t = H.el;
      if (this.ltEnd == null) this.ltEnd = t + 2;
      if (t < this.ltEnd) return;
      // green → yellow (it's turning) → red → green …
      if (H.lt === 'g') { H.lt = 'y'; this.ltEnd = t + 0.7; }
      else if (H.lt === 'y') { H.lt = 'r'; this.ltEnd = t + 2 + Math.random() * 2; this.slowBots = new Set(H.bp.filter(() => Math.random() < 0.12).map((b) => b[0])); }
      else { H.lt = 'g'; this.ltEnd = t + 2.2 + Math.random() * 3.5; }
      H.lt0 = +t.toFixed(2);
    },
    // a fake panel that someone (or a bot) stands on breaks
    standCheck(x, y, z) {
      const H = this.H;
      if (y > 1.5 || y < -2 || z > ROW0 + PW || z < rowZ(ROWS - 1) - PW) return;
      for (let k = 0; k < ROWS; k++) for (const s of [0, 1]) {
        if (Math.abs(z - rowZ(k)) > PW / 2 + 0.3 || Math.abs(x - sideX(s)) > PW / 2 + 0.3) continue;
        const safe = ((H.glass >> k) & 1) === s;
        if (!safe) H.br |= 1 << (k * 2 + s);
      }
    },
    moveBots(dt) {
      const H = this.H, T = this.botT || (this.botT = {}); // (a new host part way through starts these afresh)
      for (const b of H.bp) {
        const info = H.bots.find((x) => x[0] === b[0]), sp = info ? info[3] : 10, t = T[b[0]] || (T[b[0]] = { hop: 0, wait: 0.6 + Math.random(), row: -1, fall: 0 });
        if (b[4] === 0) {
          // the field: run on green and yellow; on red a slow one sometimes keeps going a moment too long
          const late = H.lt === 'r' && this.slowBots && this.slowBots.has(b[0]) && H.el - H.lt0 < 0.6;
          if (H.lt !== 'r' || late) b[3] = +(b[3] - sp * dt).toFixed(2);
          if (late && H.el - H.lt0 > GRACE) { this.slowBots.delete(b[0]); b[3] = +(8 + Math.random() * 10).toFixed(1); H.ev = (H.ev || []).concat([[this.evSeq = (this.evSeq || 0) + 1, 'c', b[0]]]).slice(-6); }
          if (b[3] < -FIELD - 2) { b[4] = 1; b[1] = 0; b[3] = -FIELD - 2.5; t.row = -1; }
        } else if (b[4] === 1) {
          // the bridge: a hop to the next row now and then, onto whichever side isn't known to break
          t.wait -= dt;
          if (t.hop > 0) { t.hop -= dt; b[2] = +(Math.sin(Math.PI * (1 - t.hop / 0.45)) * 3).toFixed(2); if (t.hop <= 0) b[2] = 0; }
          else if (t.wait <= 0) {
            t.wait = 0.9 + Math.random() * 0.9;
            const k = t.row + 1;
            if (k >= ROWS) { b[4] = 3; b[3] = +(DECK - 10 - Math.random() * 10).toFixed(1); b[1] = +((Math.random() - 0.5) * 16).toFixed(1); H.fin.push([b[0], info ? info[1] : 'A bot', +H.el.toFixed(1)]); continue; }
            const brokeL = (H.br >> (k * 2)) & 1, brokeR = (H.br >> (k * 2 + 1)) & 1, s = brokeL ? 1 : brokeR ? 0 : Math.random() < 0.5 ? 0 : 1;
            b[1] = sideX(s); b[3] = rowZ(k); t.row = k; t.hop = 0.45;
            if ((((H.glass >> k) & 1) !== s)) { H.br |= 1 << (k * 2 + s); b[4] = 2; t.fall = 0; }
          }
        } else if (b[4] === 2) {
          t.fall += dt; b[2] = +(-t.fall * t.fall * 30).toFixed(1);
          if (t.fall > 1.4) { b[4] = 1; b[1] = 0; b[2] = 0; b[3] = -FIELD - 2.5; t.row = -1; t.wait = 1.2; }
        }
      }
    },

    /* ---- everyone ---- */
    tick(dt) {
      // a Glass Sense from the shop: the panels that hold glow green for you this round
      { const g0 = this.g, on = !!(g0 && g0.ph === 'play' && this.senseRd === g0.rd); for (const p of this.panels || []) { const want = on && ((g0.glass >> p.row) & 1) === p.side ? 0x4ade80 : 0xbae6fd; if (p.tint !== want) { p.tint = want; p.m.material.color.setHex(want); } } }
      const g = this.g = roundState(this), mine = myPeer();
      if (g && g.ph === 'play' && g.rd !== this.rd) {
        this.rd = g.rd; this.onBridge = false; this.finT = 0; this.broken = 0; this.myBr = 0; this.caught = 0; this.evN = Math.max(0, ...((g.ev || []).map((e) => e[0])));
        for (const p of this.panels) { p.solid = true; p.m.visible = true; }
        respawn(true); sfx('go'); toast('🟢 Green light — run!', '#86efac');
      }
      if (g && g.ph === 'count') { const c = Math.ceil(g.left); if (c !== this.cdS && c <= 3 && c > 0) sfx('count'); this.cdS = c; } else this.cdS = null;
      this.gate.solid = !(g && g.ph === 'play'); this.gate.m.visible = this.gate.solid;
      const playing = g && g.ph === 'play', lt = playing ? g.lt : 'g';
      // the robot: looking away on green, turning on yellow, watching on red
      const want = lt === 'g' ? Math.PI : 0;
      let d = want - this.headY; this.headY += d * Math.min(1, dt * (lt === 'y' ? 6 : 8));
      this.bot.head.rotation.y = this.headY;
      this.bot.eyeM.color.setHex(lt === 'r' ? 0xef4444 : 0x111827);
      this.bot.bulb.material.color.setHex(lt === 'r' ? 0xef4444 : lt === 'y' ? 0xfacc15 : 0x22c55e);
      if (lt !== this.ltSeen) { if (playing && lt === 'r') sfx('turn'); if (playing && lt === 'g' && this.ltSeen) sfx('tick', { pitch: 1.4 }); this.ltSeen = lt; }
      if (this.tint) this.tint.style.boxShadow = !playing ? 'none' : lt === 'r' ? 'inset 0 0 90px 10px rgba(239,68,68,.55)' : lt === 'y' ? 'inset 0 0 70px 6px rgba(250,204,21,.45)' : 'inset 0 0 60px 4px rgba(34,197,94,.28)';
      // red light: moving after the first moment sends you back to the start (only out on the field)
      if (playing && !P.dead && !this.finT) {
        const onField = P.z < 0.5 && P.z > -FIELD - 1 && P.y > -1;
        const moving = Math.hypot(P.vx, P.vz) > 2.5 || Math.abs(P.vy) > 6;
        if (lt === 'r' && onField && moving && g.el - g.lt0 > GRACE) {
          this.caught++; sfx('error'); puffAt(P.x, P.y + 2, P.z, [0xef4444, 0xffffff], 14);
          toast('🔴 You moved! Back to the start', '#fca5a5'); respawn();
        }
        if (P.z < -FIELD - 1 && !this.onBridge) { this.onBridge = true; toast('🌉 The glass bridge! One panel in each row breaks…', '#bae6fd'); }
        if (P.z < DECK && P.y > -1) { this.finT = Math.max(0.1, g.el); sfx('win'); puffAt(P.x, P.y + 3, P.z, CONFETTI, 50); toast(`🏆 You made it! ${g.el.toFixed(1)}s`, '#86efac'); send({ rf: [g.rd, +this.finT.toFixed(1)] }); }
        // a panel that breaks under you
        const gp = P.ground;
        if (gp && gp.row != null && ((g.glass >> gp.row) & 1) !== gp.side) { this.myBr |= 1 << (gp.row * 2 + gp.side); send({ rb: [g.rd, this.myBr] }); }
      }
      // broken glass: from the host, from me, from anyone seen standing on a fake panel
      if (g && g.ph === 'play') {
        let br = (g.br | 0) | (this.myBr | 0);
        for (const a of Net.avatars.values()) br |= this.wouldBreak(g, a.g.position);
        for (const a of this.botAv.values()) br |= this.wouldBreak(g, a.g.position);
        const fresh = br & ~this.broken;
        if (fresh) {
          for (const p of this.panels) if ((fresh >> (p.row * 2 + p.side)) & 1) { p.solid = false; p.m.visible = false; puffAt(p.x, 0, p.z, [0xbae6fd, 0xffffff, 0x7dd3fc], 16); sfx3('break', p.x, p.z, 80, { pitch: 1.4 }); }
          this.broken |= fresh;
        }
      }
      // the host's news: bots caught on a red light
      for (const e of (g && g.ev) || []) { if (!(e[0] > (this.evN || 0))) continue; this.evN = e[0]; if (e[1] === 'c') { const a = this.botAv.get(e[2]); if (a) puffAt(a.g.position.x, 2, a.g.position.z, [0xef4444, 0xffffff], 10); } }
      // coins when a round ends
      if (g && g.ph === 'end' && this.coinRd !== g.rd) { this.coinRd = g.rd; const k = (g.fin || []).findIndex((f) => f[0] === mine); if (k >= 0) { earn(k === 0 ? 20 : 10, k === 0 ? 'won Red Light, Green Light' : 'crossed the glass bridge'); quest('rlgl.finish'); if (k === 0) quest('rlgl.win'); } }
      this.drawBots(g, dt);
      // the banner
      const left = g ? Math.ceil(g.left) : 0;
      if (!g) setBanner('Getting the round…');
      else if (g.ph === 'wait') setBanner('Waiting for players…');
      else if (g.ph === 'count') setBanner(`🚦 Next round in ${left}… get behind the line!`);
      else if (g.ph === 'play') setBanner(this.finT ? `🏆 You made it! · ${(g.fin || []).length} across · ⏱ ${left}s` : `${lt === 'r' ? '🔴 RED LIGHT — don’t move!' : lt === 'y' ? '🟡 It’s turning…' : this.onBridge ? '🌉 Pick your panel and jump!' : '🟢 GREEN LIGHT — run!'} · ⏱ ${left}s`);
      else setBanner(`🏁 ${(g.fin || []).length ? `${(g.fin || []).slice(0, 3).map((f, k) => `${['🥇', '🥈', '🥉'][k]} ${esc(f[1])}`).join(' · ')}` : 'Nobody made it across!'}`);
    },
    wouldBreak(g, p) {
      if (p.y > 1.5 || p.y < -1 || p.z > ROW0 + PW || p.z < rowZ(ROWS - 1) - PW) return 0;
      let br = 0;
      for (let k = 0; k < ROWS; k++) for (const s of [0, 1]) if (Math.abs(p.z - rowZ(k)) < PW / 2 && Math.abs(p.x - sideX(s)) < PW / 2 && ((g.glass >> k) & 1) !== s) br |= 1 << (k * 2 + s);
      return br;
    },
    drawBots(g, dt) {
      const want = new Map(g && (g.ph === 'play' || g.ph === 'end') ? (g.bp || []).map((b) => [b[0], b]) : []);
      for (const [id, a] of this.botAv) if (!want.has(id)) { dropAvatar(a); this.botAv.delete(id); }
      for (const [id, b] of want) {
        let a = this.botAv.get(id);
        const info = (g.bots || []).find((x) => x[0] === id) || [id, 'Bot', 1];
        if (!a) { const r = mulberry(info[2] | 0), av = okAv([Math.floor(r() * 6), Math.floor(r() * 10), Math.floor(r() * 8), Math.floor(r() * 12), Math.floor(r() * 9), 0, 0, Math.floor(r() * 7), 0]); a = makeAvatar(av, '🤖 ' + info[1], false); a.g.position.set(b[1], b[2], b[3]); scene.add(a.g); this.botAv.set(id, a); }
        const p = a.g.position, k = Math.min(1, dt * 10), dx = b[1] - p.x, dz = b[3] - p.z;
        if (Math.hypot(dx, dz) > 20) p.set(b[1], b[2], b[3]); else { p.x += dx * k; p.y += (b[2] - p.y) * Math.min(1, dt * 14); p.z += dz * k; }
        a.g.rotation.y = 0;
        animateAvatar(a, dt, Math.hypot(dx, dz) > 0.2, b[2] > 0.3); placeShadow(a);
      }
    },
    statOf(pr, isMe, peer) { const g = this.g; return g && g.sc ? g.sc[peer] || 0 : 0; },
    sortKey(pr, isMe, peer) { const g = this.g; return g && g.sc ? g.sc[peer] || 0 : 0; },
    hud() {
      const g = this.g;
      if (!g || g.ph !== 'play') return '';
      const togo = Math.max(0, Math.round(P.z - DECK));
      return this.finT ? `🏆 Across in ${this.finT.toFixed(1)}s` : `📏 ${togo} studs to go${this.caught ? ` · 🔴 caught ×${this.caught}` : ''}`;
    },
    coinShop: [
      { id: 'sense', e: '🔮', n: 'Glass Sense', d: 'Use it in a round: the glass panels that hold glow green for you', price: 45, kind: 'use', tap: true },
      shopSpeed(350, 1.1), shopJump(250, 1.15),
    ],
    shopUse(id) { const g = this.g; if (id !== 'sense' || !g || g.ph !== 'play' || this.senseRd === g.rd) return false; this.senseRd = g.rd; sfx('magic'); return true; },
  };
  addExp(RL);
  window.__rbRL = RL;
  window.__rlgl = { FIELD, ROW0, GAP, ROWS, DECK, rowZ, sideX }; // for tests
})();
