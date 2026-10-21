/* =====================================================================
   BLOXVERSE — MINI GOLF. Nine holes, played at your own pace (everyone
   on the server is out on the course at once, each with their own ball).
   Aim with the camera (drag, or A/D), hold the mouse or Space to charge
   the putt and let go. Walls bounce, sand slows, water costs a stroke,
   the spinners sweep and the ramp rolls you back. Fewest strokes wins.
   ===================================================================== */
(() => {
  const SPACING = 44, R = 0.5, CUP = 0.8, MAXV = 62, MAXSTROKES = 8;
  // each hole, around its own middle: the green (W wide, L long), tee, cup, par; walls [x, z, sx, sz],
  // sand and water [x, z, sx, sz], slopes [x, z, sx, sz, ax, az] (a push), spinners [x, z, length, turn speed]
  const HOLES = [
    { n: 'Straight Start', par: 2, W: 10, L: 34, tee: [0, 14], cup: [0, -13] },
    { n: 'The Bend', par: 3, W: 24, L: 30, tee: [-7, 12], cup: [7, -11], walls: [[5, 4, 14, 22]] },
    { n: 'Sand Trap', par: 3, W: 12, L: 36, tee: [0, 15], cup: [0, -15], sand: [[0, -1, 8, 7]] },
    { n: 'The Spinner', par: 3, W: 12, L: 34, tee: [0, 14], cup: [0, -14], spin: [[0, -1, 11, 1.6]] },
    { n: 'Water Hazard', par: 3, W: 16, L: 36, tee: [0, 15], cup: [0, -15], water: [[0, -1, 11, 9]] },
    { n: 'Zig Zag', par: 4, W: 20, L: 40, tee: [6, 17], cup: [-6, -17], walls: [[-3, 9, 14, 1.2], [3, -1, 14, 1.2], [-3, -11, 14, 1.2]] },
    { n: 'Uphill', par: 3, W: 12, L: 36, tee: [0, 15], cup: [0, -15], slope: [[0, 0, 12, 14, 0, 26]] },
    { n: 'Bumpers', par: 3, W: 22, L: 30, tee: [0, 13], cup: [0, -12], walls: [[-6, 4, 2, 2], [0, 0, 2, 2], [6, 4, 2, 2], [-3, -5, 2, 2], [3, -5, 2, 2], [0, 8, 2, 2]] },
    { n: 'Grand Finale', par: 4, W: 18, L: 46, tee: [0, 20], cup: [0, -20], spin: [[0, 6, 14, 2.2]], sand: [[-5, -12, 7, 6]], water: [[5, -4, 7, 6]], slope: [[0, -6, 18, 5, 0, 12]] },
  ];
  const PAR = HOLES.reduce((s, h) => s + h.par, 0);
  const hx = (k) => (k - (HOLES.length - 1) / 2) * SPACING; // where each hole's middle is (along x)
  const WORD = (d, s) => (s === 1 ? '⛳ HOLE IN ONE!' : d <= -2 ? '🦅 Eagle!' : d === -1 ? '🐦 Birdie!' : d === 0 ? '👍 Par' : d === 1 ? 'Bogey' : d === 2 ? 'Double bogey' : `+${d}`);
  const inBox = (x, z, b, pad = 0) => Math.abs(x - b[0]) <= b[2] / 2 + pad && Math.abs(z - b[1]) <= b[3] / 2 + pad;

  // the walls of a hole as boxes (its edge and what's on it), in the world
  function wallsOf(k) {
    const H = HOLES[k], ox = hx(k), w = H.W / 2, l = H.L / 2, T = 1;
    return [[ox, -l - T / 2, H.W + 2 * T, T], [ox, l + T / 2, H.W + 2 * T, T], [ox - w - T / 2, 0, T, H.L], [ox + w + T / 2, 0, T, H.L]]
      .concat((H.walls || []).map(([x, z, sx, sz]) => [ox + x, z, sx, sz]));
  }
  const WALLS = HOLES.map((_, k) => wallsOf(k));

  function putterMesh() {
    const g = new THREE.Group(), L = (c) => new THREE.MeshLambertMaterial({ color: c });
    const shaft = new THREE.Mesh(BOX, L(0xd1d5db)); shaft.scale.set(0.12, 0.12, 3.4); shaft.position.z = -1.7; g.add(shaft);
    const grip = new THREE.Mesh(BOX, L(0x111827)); grip.scale.set(0.2, 0.2, 0.9); grip.position.z = -0.35; g.add(grip);
    const head = new THREE.Mesh(BOX, L(0x9ca3af)); head.scale.set(0.9, 0.3, 0.3); head.position.set(0.3, 0, -3.4); g.add(head);
    return g;
  }

  const GF = {
    noLock: true, noSprint: true, // (the camera goes round the ball)
    id: 'golf', code: 'gf', genre: 'Sports', rank: 0.04, name: 'Mini Golf', emoji: '⛳', max: 10, stat: 'Score', killY: -30, camDist: 15, noReset: true,
    land: { theme: 'meadow', fence: 'wood', g: -0.6 },
    color: 'linear-gradient(135deg,#22c55e,#15803d 55%,#facc15)',
    desc: 'Nine holes of mini golf at your own pace: aim with the camera (drag, or A/D), hold the mouse or Space to charge your putt and let go. Walls bounce, sand slows you down, water costs a stroke, and watch out for the spinners! Fewest strokes wins.',
    welcome: 'Aim with the camera (drag or A/D); hold the mouse or Space, let go to putt!',
    welcomeTouch: 'Drag to aim; hold the ⤒ jump button and let go to putt!',
    build() {
      sky('#7dd3fc', '#f0fdf4');
      slab(0, -0.6, 0, HOLES.length * SPACING + 60, 90, 0x65a30d, { sy: 1 });
      this.cups = [];
      HOLES.forEach((H, k) => {
        const ox = hx(k);
        slab(ox, 0, 0, H.W, H.L, 0x4ade80, { sy: 1, plain: true });
        for (const [x, z, sx, sz] of WALLS[k]) part({ x, y: 0.6, z, sx, sy: 1.2, sz, c: 0x92400e });
        for (const [x, z, sx, sz] of H.sand || []) part({ x: ox + x, y: 0.03, z, sx, sy: 0.06, sz, c: 0xfde68a, solid: false });
        for (const [x, z, sx, sz] of H.water || []) part({ x: ox + x, y: 0.04, z, sx, sy: 0.08, sz, c: 0x38bdf8, neon: true, solid: false, alpha: 0.9 });
        for (const [x, z, sx, sz, ax, az] of H.slope || []) part({ x: ox + x, y: 0.03, z, sx, sy: 0.06, sz, c: 0xffffff, stripes: '#16a34a', conv: [ax / 6, az / 6], solid: false });
        // the cup and its flag; the tee; the sign
        const cup = new THREE.Mesh(new THREE.CircleGeometry(CUP, 20), new THREE.MeshBasicMaterial({ color: 0x111827, ...DECAL })); cup.rotation.x = -Math.PI / 2; cup.position.set(ox + H.cup[0], 0.05, H.cup[1]); place.add(cup);
        part({ x: ox + H.cup[0], y: 2.5, z: H.cup[1], sx: 0.15, sy: 5, sz: 0.15, c: 0xf3f4f6, solid: false });
        part({ x: ox + H.cup[0] + 0.7, y: 4.5, z: H.cup[1], sx: 1.3, sy: 0.9, sz: 0.1, c: 0xef4444, neon: true, solid: false });
        part({ x: ox + H.tee[0], y: 0.03, z: H.tee[1], sx: 3, sy: 0.06, sz: 3, c: 0x166534, solid: false });
        const sg = label(`Hole ${k + 1} · Par ${H.par}\n${H.n}`, { size: 1.4, color: '#fff' }); sg.position.set(ox - H.W / 2 - 4, 4.5, H.L / 2 - 3); place.add(sg);
      });
      // the spinners: a bar turning round (the same for everyone: it follows the clock)
      this.spinners = [];
      HOLES.forEach((H, k) => (H.spin || []).forEach(([x, z, len, sp]) => {
        const g = new THREE.Group(), M = new THREE.MeshLambertMaterial({ color: 0xdc2626 });
        const bar = new THREE.Mesh(BOX, M); bar.scale.set(len, 1, 0.8); bar.position.y = 0.6; g.add(bar);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.6, 12), new THREE.MeshLambertMaterial({ color: 0xfacc15 })); hub.position.y = 0.8; g.add(hub);
        g.position.set(hx(k) + x, 0, z); place.add(g);
        this.spinners.push({ k, x: hx(k) + x, z, len, sp, g });
      }));
      const sg = label('⛳ MINI GOLF', { size: 4, color: '#fde68a' }); sg.position.set(hx(0) - 30, 8, 0); place.add(sg);
    },
    pres() { return { gb: [0, 0, 0, 0, 0, 0] }; },
    enter() {
      this.hole = 0; this.cards = []; this.balls = new Map(); this.held = new Map(); this.best = 0; this.swingT = 0;
      this.newHole(0);
      kvGet('golf').then((s) => { if (s && +s.best > 0) this.best = +s.best; });
      const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 16, 12), new THREE.MeshLambertMaterial({ color: 0xffffff })); scene.add(ball); this.ballM = ball;
      // the aim: a row of dots from the ball, longer the harder you'll hit
      this.aimG = new THREE.Group(); for (let k = 0; k < 8; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })); this.aimG.add(d); } scene.add(this.aimG);
      const bar = document.createElement('div'); bar.id = 'gfPow';
      bar.style.cssText = 'position:absolute;left:50%;bottom:calc(var(--barH,0px) + 64px);transform:translateX(-50%);width:260px;height:16px;border-radius:999px;background:rgba(15,23,42,.6);box-shadow:0 0 0 2px rgba(255,255,255,.6);overflow:hidden;display:none';
      bar.innerHTML = '<i style="display:block;height:100%;width:100%;background:linear-gradient(90deg,#22c55e,#facc15,#ef4444);border-radius:999px;transform-origin:left;transform:scaleX(0);will-change:transform"></i>';
      $('#xhud').append(bar); this.powEl = bar;
      setBar('<button class="xslot" data-k="card" title="Scorecard (C)"><span class="k">C</span><span class="e">📋</span>Card</button>', () => this.cardPanel());
      cam.pitch = -0.5;
    },
    leave() {
      clearTimeout(this.nextT);
      if (this.ballM) { scene.remove(this.ballM); this.ballM = null; }
      if (this.aimG) { scene.remove(this.aimG); this.aimG = null; }
      for (const b of this.balls.values()) scene.remove(b);
      this.balls = new Map(); this.held = new Map();
    },
    newHole(k) {
      const H = HOLES[k];
      clearTimeout(this.nextT); // (a move to the next hole still waiting: not any more)
      this.hole = k; this.strokes = 0; this.done = false; this.charge = null;
      this.B = { x: hx(k) + H.tee[0], z: H.tee[1], vx: 0, vz: 0, from: null };
      this.aimAt(H.cup[0] + hx(k), H.cup[1]);
      this.placeMe();
    },
    aimAt(x, z) { cam.yaw = Math.atan2(-(x - this.B.x), -(z - this.B.z)); },
    // you stand just behind your ball, facing where you're aiming
    placeMe() {
      const B = this.B, fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw);
      P.x = B.x - fx * 2.2 + fz * 0.9; P.z = B.z - fz * 2.2 - fx * 0.9; P.yaw = cam.yaw; P.vx = P.vz = 0;
      if (P.y < 0 || P.y > 3) { P.y = 0.02; P.vy = 0; }
    },
    spawn() { const B = this.B || { x: hx(0), z: HOLES[0].tee[1] }; return [B.x, 0.02, B.z + 2.5, 0]; },
    rolling() { return Math.hypot(this.B.vx, this.B.vz) > 0; },
    // the putt: power swings up and down while you hold; let go to hit
    startCharge() { if (this.done || this.rolling() || this.charge || fullOpen()) return; this.charge = { t: 0 }; },
    release() {
      if (!this.charge) return;
      const pw = this.power(); this.charge = null;
      if (pw < 0.03) return;
      const B = this.B, fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), v = 4 + pw * (MAXV - 4);
      B.from = [B.x, B.z]; B.vx = fx * v; B.vz = fz * v;
      this.strokes++; this.swingT = 0.35; sfx('hit', { pitch: 0.8 + pw * 0.6, vol: 0.4 + pw * 0.6 });
    },
    power() { if (!this.charge) return 0; const t = this.charge.t % 2.4; return t < 1.2 ? t / 1.2 : 2 - t / 1.2; },
    press(btn, down) { if (btn !== 0) return; if (down) this.startCharge(); else this.release(); },
    key(code, down) {
      if (code === 'Space') { if (down) this.startCharge(); else this.release(); return; } // (not "handled": the engine still marks Space as held)
      if (down && code === 'KeyC') { this.cardPanel(); return true; }
    },
    // the ball rolling: friction, sand, slopes, walls, spinners, water, the cup
    roll(dt) {
      const B = this.B, H = HOLES[this.hole], ox = hx(this.hole);
      const n = Math.max(1, Math.ceil(Math.hypot(B.vx, B.vz) * dt / 0.2));
      for (let s = 0; s < n && this.rolling(); s++) {
        const h = dt / n, lx = B.x - ox;
        const sand = (H.sand || []).some((b) => inBox(lx, B.z, b));
        for (const [x, z, sx, sz, ax, az] of H.slope || []) if (inBox(lx, B.z, [x, z, sx, sz])) { B.vx += ax * h; B.vz += az * h; }
        const sp = Math.hypot(B.vx, B.vz), slow = Math.min(sp, (sand ? 26 : 3.2) * h) + sp * (1 - Math.exp(-(sand ? 2.5 : 0.75) * h));
        B.vx *= (sp - slow) / sp || 0; B.vz *= (sp - slow) / sp || 0;
        B.x += B.vx * h; B.z += B.vz * h;
        // walls: push out and bounce
        for (const w of WALLS[this.hole]) this.bounce(w[0], w[1], w[2] / 2, w[3] / 2, 0, 0.75);
        const T = now();
        for (const S of this.spinners) if (S.k === this.hole) this.bounce(S.x, S.z, S.len / 2, 0.4, S.sp * T, 0.85, S.sp);
        // water: back to where you hit from, and a stroke more
        if ((H.water || []).some((b) => inBox(B.x - ox, B.z, b))) {
          const f = B.from || [ox + H.tee[0], H.tee[1]];
          puffAt(B.x, 0.3, B.z, [0x38bdf8, 0xffffff], 14); sfx('splash');
          Object.assign(B, { x: f[0], z: f[1], vx: 0, vz: 0 }); this.strokes++; toast('💦 In the water! +1 stroke', '#7dd3fc'); return;
        }
        // the cup: in if it's not going too fast
        const cx = ox + H.cup[0], cz = H.cup[1], dc = Math.hypot(B.x - cx, B.z - cz);
        if (dc < CUP && Math.hypot(B.vx, B.vz) < 26) { this.holed(); return; }
        if (dc < CUP * 1.6 && Math.hypot(B.vx, B.vz) < 9) { B.vx += (cx - B.x) * 6 * h; B.vz += (cz - B.z) * 6 * h; } // it rolls towards the hole when it's close and slow
        if (Math.hypot(B.vx, B.vz) < 0.35) { B.vx = B.vz = 0; }
      }
    },
    // the ball against a box (turned by `turn`), bouncing off it; a spinner gives it a knock too
    bounce(cx, cz, hw, hd, turn, e, spin) {
      const B = this.B, c = Math.cos(turn), s = Math.sin(turn);
      const dx = B.x - cx, dz = B.z - cz, lx = dx * c - dz * s, lz = dx * s + dz * c;
      const qx = clamp(lx, -hw, hw), qz = clamp(lz, -hd, hd);
      let nx = lx - qx, nz = lz - qz, d = Math.hypot(nx, nz);
      if (d >= R) return;
      if (d < 1e-6) { const px = hw - Math.abs(lx), pz = hd - Math.abs(lz); if (px < pz) { nx = Math.sign(lx) || 1; nz = 0; } else { nx = 0; nz = Math.sign(lz) || 1; } d = 0; } else { nx /= d; nz /= d; }
      const wx = nx * c + nz * s, wz = -nx * s + nz * c; // back into the world
      B.x = cx + (qx * c + qz * s) + wx * R; B.z = cz + (-qx * s + qz * c) + wz * R;
      const vn = B.vx * wx + B.vz * wz;
      if (vn < 0) { B.vx -= (1 + e) * vn * wx; B.vz -= (1 + e) * vn * wz; if (-vn > 6) sfx('block', { vol: Math.min(0.8, -vn / 40), gap: 90 }); }
      if (spin) { const px = B.x - cx, pz = B.z - cz; B.vx += -pz * spin * 0.9; B.vz += px * spin * 0.9; }
    },
    holed() {
      const H = HOLES[this.hole], d = this.strokes - H.par;
      this.B.vx = this.B.vz = 0; this.done = true; this.cards[this.hole] = this.strokes;
      sfx(d <= 0 ? 'win' : 'reward'); puffAt(this.B.x, 1, this.B.z, d <= 0 ? CONFETTI : [0xffffff, 0x4ade80], d <= 0 ? 40 : 14);
      toast(`${WORD(d, this.strokes)} ${this.strokes} stroke${this.strokes === 1 ? '' : 's'} on hole ${this.hole + 1}`, d <= 0 ? '#fde68a' : '#fff');
      earn(this.strokes === 1 ? 10 : d < 0 ? 5 : d === 0 ? 3 : 1);
      if (d < 0) quest('golf.birdie'); if (this.strokes === 1) quest('golf.ace');
      this.nextT = setTimeout(() => this.next(), 2200);
    },
    // picked up after too many strokes
    pickUp() { this.done = true; this.cards[this.hole] = MAXSTROKES; this.B.vx = this.B.vz = 0; toast(`Picked up on ${MAXSTROKES} strokes`, '#fca5a5'); this.nextT = setTimeout(() => this.next(), 1600); },
    next() {
      if (!this.ballM) return; // left
      if (this.hole + 1 < HOLES.length) { this.newHole(this.hole + 1); sfx('teleport'); toast(`Hole ${this.hole + 1}: ${HOLES[this.hole].n} (par ${HOLES[this.hole].par})`, '#fde68a'); return; }
      // the end of the round
      const total = this.cards.reduce((s, v) => s + v, 0);
      earn(10, 'finished Mini Golf'); quest('golf.round');
      if (!this.best || total < this.best) { this.best = total; kvSet('golf', { best: total }); say(`⛳ New best round: ${total} (${total - PAR >= 0 ? '+' : ''}${total - PAR})`, '#86efac'); }
      Net.chat(`⛳ finished Mini Golf in ${total} (${total - PAR >= 0 ? '+' : ''}${total - PAR})`);
      this.finished = total; this.cardPanel(true);
    },
    cardPanel(end) {
      const tot = this.cards.reduce((s, v) => s + (v || 0), 0), parSoFar = HOLES.reduce((s, h, k) => s + (this.cards[k] ? h.par : 0), 0);
      const rows = HOLES.map((H, k) => { const v = this.cards[k]; return `<div class="xp-row"><span><b>${k + 1}. ${esc(H.n)}</b> <small style="color:var(--muted)">par ${H.par}</small></span><b>${v ? `${v} <small style="color:${v - H.par < 0 ? '#86efac' : v - H.par > 0 ? '#fca5a5' : 'var(--muted)'}">${v - H.par > 0 ? '+' : ''}${v - H.par || 'E'}</small>` : k === this.hole ? '…' : '–'}</b></div>`; }).join('');
      const html = `${rows}<div class="xp-row"><span><b>Total</b>${this.best ? ` <small style="color:var(--muted)">· best ${this.best}</small>` : ''}</span><b>${tot} <small>(${tot - parSoFar > 0 ? '+' : ''}${tot - parSoFar || 'E'})</small></b></div>${end ? '<button class="xp-btn green" data-again="1" style="width:100%">⛳ Play again</button>' : ''}`;
      openPanel(end ? '🏆 Round over!' : '📋 Scorecard', html, (b) => { if (b.dataset.again) { closePanel(); this.cards = []; this.finished = 0; this.newHole(0); } });
    },
    tick(dt) {
      if (!this.B) return;
      // A and D turn your aim (walking's off: you're putting)
      if (!this.rolling() && !chatOpen() && !fullOpen()) cam.yaw += ((keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0)) * 1.4 * dt;
      P.frozen = true;
      if (this.charge) { this.charge.t += dt; if (!(keys.Space || jumpHeld || this.mouseHeld())) this.release(); }
      else if (jumpHeld && !this.done && !this.rolling()) this.startCharge();
      // a ball sitting where a spinner sweeps gets knocked along
      if (!this.rolling() && !this.done) { const T = now(); for (const S of this.spinners) if (S.k === this.hole) this.bounce(S.x, S.z, S.len / 2, 0.4, S.sp * T, 0.85, S.sp); }
      if (this.rolling()) { this.roll(dt); if (!this.rolling() && !this.done && this.strokes >= MAXSTROKES) this.pickUp(); }
      this.placeMe();
      // the spinners turn with the clock
      const T = now(); for (const S of this.spinners) S.g.rotation.y = S.sp * T;
      // my ball and the aim
      const B = this.B, sink = this.done ? -0.6 : 0;
      this.ballM.position.set(B.x, R + sink + 0.02, B.z); this.ballM.visible = !this.done;
      const pw = this.charge ? this.power() : 0.35, show = !this.rolling() && !this.done && !P.dead;
      this.aimG.visible = show;
      if (show) { const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw); this.aimG.children.forEach((d, k) => { const t = (k + 1) / 8 * (2 + pw * 9); d.position.set(B.x + fx * t, 0.25, B.z + fz * t); d.material.color.setHex(this.charge ? (pw > 0.75 ? 0xef4444 : pw > 0.4 ? 0xfacc15 : 0x22c55e) : 0xffffff); }); }
      const pv = this.charge ? Math.round(pw * 50) / 50 : -1; // (only when it changes: redrawing the page over the game is slow on some computers)
      if (pv !== this.powShown) { this.powShown = pv; this.powEl.style.display = pv < 0 ? 'none' : 'block'; if (pv >= 0) this.powEl.firstChild.style.transform = `scaleX(${pv})`; }
      this.swingT = Math.max(0, this.swingT - dt);
      // tell everyone where my ball is (and my score)
      const tot = this.cards.reduce((s, v) => s + (v || 0), 0) + (this.done ? 0 : this.strokes), done = this.cards.filter(Boolean).length;
      const gb = [this.hole, +B.x.toFixed(2), +B.z.toFixed(2), this.done ? 1 : 0, tot, done];
      if (performance.now() - (this.sentAt || 0) > 120 && gb.join() !== this.gbKey) { this.sentAt = performance.now(); this.gbKey = gb.join(); send({ gb }); }
      this.drawOthers(dt);
    },
    mouseHeld() { return !!(this.mouseDown); },
    drawOthers(dt) {
      const seen = new Set();
      for (const p of Net.peers) {
        if (p.isMe || !p.presence || !Array.isArray(p.presence.gb)) continue;
        const gb = p.presence.gb; seen.add(p.peer);
        let m = this.balls.get(p.peer);
        if (!m) { const av = okAv(p.presence.av); m = new THREE.Mesh(new THREE.SphereGeometry(R, 14, 10), new THREE.MeshLambertMaterial({ color: SHIRTS[av[1]] || '#fff' })); m.position.set(gb[1], R, gb[2]); scene.add(m); this.balls.set(p.peer, m); }
        const k = Math.min(1, dt * 12); m.position.x += (gb[1] - m.position.x) * k; m.position.z += (gb[2] - m.position.z) * k; m.position.y = R + (gb[3] ? -0.6 : 0.02); m.visible = !gb[3];
      }
      for (const [peer, m] of this.balls) if (!seen.has(peer)) { scene.remove(m); this.balls.delete(peer); }
    },
    // everyone holds a putter; it swings when they hit
    pose() {
      this.holdClub(me, 'me', this.swingT);
      for (const [peer, a] of Net.avatars) this.holdClub(a, peer, 0);
    },
    holdClub(a, key, swing) {
      if (!a || a.dead) return;
      let h = this.held.get(key);
      if (!h || h.a !== a) { if (h && h.m.parent) h.m.parent.remove(h.m); h = { a, m: putterMesh() }; h.m.rotation.x = -Math.PI / 2 + 0.35; h.m.position.set(0, -1.9, 0); a.armR.add(h.m); this.held.set(key, h); }
      a.armR.rotation.x = 0.25 + (swing > 0 ? Math.sin((1 - swing / 0.35) * Math.PI) * 0.9 : 0); a.armL.rotation.x = a.armR.rotation.x;
      a.legL.rotation.x = a.legR.rotation.x = 0;
    },
    statOf(pr, isMe) { const g = isMe ? [this.hole, 0, 0, this.done ? 1 : 0, this.cards.reduce((s, v) => s + (v || 0), 0) + (this.done ? 0 : this.strokes), this.cards.filter(Boolean).length] : pr.gb; if (!Array.isArray(g)) return '–'; return `${g[4]} (hole ${Math.min(HOLES.length, g[0] + 1)})`; },
    sortKey(pr, isMe) { const g = isMe ? [0, 0, 0, 0, this.cards.reduce((s, v) => s + (v || 0), 0), this.cards.filter(Boolean).length] : pr.gb; if (!Array.isArray(g)) return -1e9; return g[5] * 100 - g[4]; },
    hud() {
      if (!this.B) return '';
      const H = HOLES[this.hole], tot = this.cards.reduce((s, v) => s + (v || 0), 0), parSoFar = HOLES.reduce((s, h, k) => s + (this.cards[k] ? h.par : 0), 0), d = tot - parSoFar;
      return `⛳ Hole <b>${this.hole + 1}</b>/${HOLES.length} · par ${H.par} · strokes <b>${this.strokes}</b> · total ${tot} (${d > 0 ? '+' : ''}${d || 'E'})${this.best ? ` · best ${this.best}` : ''}`;
    },
  };
  // (the engine tells experiences about the mouse button through press(); remember whether it's still down)
  const press0 = GF.press;
  GF.press = function (btn, down) { if (btn === 0) this.mouseDown = down; press0.call(this, btn, down); };
  addExp(GF);
  window.__rbGF = GF;
  window.__golf = { HOLES, hx, WALLS, PAR }; // for tests
})();
