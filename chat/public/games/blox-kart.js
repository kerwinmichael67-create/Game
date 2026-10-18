/* =====================================================================
   BLOXVERSE — KART RACING. Three laps round a twisty track against
   everyone on the server, and bots when there aren't enough drivers.
   W to go, S to brake, A/D to steer; hold Space while turning to drift
   and let go for a boost. Boost pads help, the grass slows you down.
   The host starts the races, drives the bots and keeps the standings;
   each driver counts their own laps.
   ===================================================================== */
(() => {
  const LAPS = 3, RACERS = 6, ROAD = 9; // ROAD: half the road's width
  const TOP = 62, GRASS = 26, BOOST = 92, ACC = 34, REV = 18;
  const N = 600; // points along the middle of the road
  const CTRL = [[0, 0], [100, 0], [150, 20], [170, 70], [150, 120], [100, 130], [60, 100], [20, 120], [-30, 150], [-90, 140], [-130, 100], [-130, 40], [-90, 0], [-50, -10]];
  const PADS = [60, 250, 405, 520]; // boost pads: where they start (each is 7 points long)
  const BOT_NAMES = ['Turbo Tim', 'Drift Queen', 'Speedy Sal', 'Nitro Ned', 'Zoom Zoe', 'Rev Rex', 'Lightning Lu', 'Skid Kid'];
  const PLACE = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'], MEDAL = ['🥇', '🥈', '🥉'];

  // the track: evenly spaced points round the middle of the road, and which way it goes at each
  const curve = new THREE.CatmullRomCurve3(CTRL.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  const PTS = curve.getSpacedPoints(N).slice(0, N), LEN = curve.getLength(), STEP = LEN / N;
  const TX = PTS.map((p) => p.x), TZ = PTS.map((p) => p.z), DX = [], DZ = [];
  const wrap = (i) => ((i % N) + N) % N;
  for (let i = 0; i < N; i++) { const j = (i + 1) % N, d = Math.hypot(TX[j] - TX[i], TZ[j] - TZ[i]) || 1; DX.push((TX[j] - TX[i]) / d); DZ.push((TZ[j] - TZ[i]) / d); }
  // how sharp the road bends just ahead (the bots slow down for it)
  const BEND = TX.map((_, i) => { const a = Math.atan2(DX[i], DZ[i]), b = Math.atan2(DX[wrap(i + 25)], DZ[wrap(i + 25)]); let d = Math.abs(a - b); if (d > Math.PI) d = 6.283 - d; return d; });
  const onPad = (i) => PADS.some((p) => wrap(i - p) < 7);
  // the nearest point on the road (searching all of it, or only near the last one)
  function nearest(x, z, hint, span) {
    let best = 0, bd = 1e18;
    const from = hint == null ? 0 : hint - span, to = hint == null ? N - 1 : hint + span;
    for (let k = from; k <= to; k++) { const i = wrap(k), d = (TX[i] - x) ** 2 + (TZ[i] - z) ** 2; if (d < bd) { bd = d; best = i; } }
    return [best, Math.sqrt(bd)];
  }
  // a place on the road: how far round (in points, any number) and how far to the side; and which way it faces
  function at(prog, lane) {
    const i0 = Math.floor(prog), f = prog - i0, a = wrap(i0), b = wrap(i0 + 1);
    const x = TX[a] + (TX[b] - TX[a]) * f, z = TZ[a] + (TZ[b] - TZ[a]) * f;
    return [x - DZ[a] * lane, z + DX[a] * lane, Math.atan2(-DX[a], -DZ[a])];
  }
  const gridSpot = (k) => at(-(7 + Math.floor(k / 2) * 9) / STEP, k % 2 ? 4.5 : -4.5);
  const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

  // strips along the road between two distances from the middle, coloured point by point (null: none there),
  // all in one mesh; side by side rather than on top of each other where they can be (less to draw)
  function ribbons(list) {
    const pos = [], cols = [];
    for (const [o1, o2, y, col] of list) for (let i = 0; i < N; i++) {
      const c = col(i); if (!c) continue;
      const j = (i + 1) % N, P1 = (k, o) => [TX[k] - DZ[k] * o, y, TZ[k] + DX[k] * o];
      const a1 = P1(i, o1), a2 = P1(i, o2), b1 = P1(j, o1), b2 = P1(j, o2);
      pos.push(...a1, ...b1, ...a2, ...a2, ...b1, ...b2);
      for (let k = 0; k < 6; k++) cols.push(c[0], c[1], c[2]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 }));
    place.add(m);
  }
  const rgb = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };

  const WHEEL = new THREE.CylinderGeometry(0.7, 0.7, 0.6, 14);
  function kartMesh(col) {
    const g = new THREE.Group(), L = (c) => new THREE.MeshLambertMaterial({ color: c });
    const box = (c, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(BOX, L(c)); m.scale.set(sx, sy, sz); m.position.set(x, y, z); g.add(m); return m; };
    box(col, 3.2, 0.7, 5.2, 0, 0.8, 0.2); box(col, 2.4, 0.5, 1.4, 0, 0.85, -2.9);
    box(0x1f2937, 3.7, 0.35, 0.8, 0, 0.55, -3.55); box(0x111827, 2.2, 1.5, 0.5, 0, 1.75, 1.35);
    box(0x1f2937, 3.6, 0.15, 0.9, 0, 2.35, 2.75); box(0x1f2937, 0.2, 0.9, 0.2, -1.2, 1.75, 2.75); box(0x1f2937, 0.2, 0.9, 0.2, 1.2, 1.75, 2.75);
    box(0x111827, 0.15, 0.15, 1, 0, 1.7, -1.55);
    const sw = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.09, 6, 14), L(0x111827)); sw.position.set(0, 2.05, -1.5); sw.rotation.x = -0.9; g.add(sw);
    const wheels = [];
    for (const [x, z] of [[-1.85, -2.1], [1.85, -2.1], [-1.85, 2.1], [1.85, 2.1]]) {
      const w = new THREE.Group(); w.position.set(x, 0.7, z);
      const t = new THREE.Mesh(WHEEL, L(0x111111)); t.rotation.z = Math.PI / 2; w.add(t);
      const hub = new THREE.Mesh(BOX, L(0xd1d5db)); hub.scale.set(0.64, 0.3, 0.9); w.add(hub);
      g.add(w); wheels.push(w);
    }
    return { g, wheels };
  }

  const KR = {
    id: 'kart', code: 'kr', genre: 'Racing', rank: 0.05, name: 'Kart Racing', emoji: '🏎️', max: 8, stat: 'Wins', killY: -30, banner: true, camDist: 20, respawnDelay: 700, stepHeight: 0.6,
    color: 'linear-gradient(135deg,#f97316,#dc2626 55%,#1f2937)',
    desc: `Race karts round a twisty track: ${LAPS} laps against everyone on the server, with bots when there aren’t enough drivers. W to go, A/D to steer, hold Space while turning to drift and let go for a boost. Hit the orange boost pads and stay off the grass!`,
    welcome: 'W to go, A/D to steer, Space to drift. The next race starts soon!',
    build() {
      sky('#60a5fa', '#e0f2fe');
      slab(20, 0, 70, 470, 380, 0x4ade80, { sy: 2 });
      // the road, its kerbs, the lines and the boost pads
      const kerb = (i) => rgb(Math.floor(i / 4) % 2 ? 0xffffff : 0xdc2626), verge = () => rgb(0xa3a3a3);
      ribbons([[-ROAD, ROAD, 0.05, () => rgb(0x3f3f46)], [ROAD, ROAD + 1.4, 0.05, kerb], [-ROAD - 1.4, -ROAD, 0.05, kerb], [ROAD + 1.4, ROAD + 3, 0.05, verge], [-ROAD - 3, -ROAD - 1.4, 0.05, verge],
        [-0.25, 0.25, 0.1, (i) => (i % 12 < 5 && !onPad(i) && i > 3 ? rgb(0xffffff) : null)], [-2.6, 2.6, 0.12, (i) => (onPad(i) ? rgb(i % 2 ? 0xfacc15 : 0xf97316) : null)]]
        .concat(Array.from({ length: 8 }, (_, c) => [-ROAD + c * (ROAD / 4), -ROAD + (c + 1) * (ROAD / 4), 0.14, (i) => (i < 3 ? rgb((i + c) % 2 ? 0x111111 : 0xffffff) : null)])));
      // the start: posts, a beam with the lights, the name
      const [sx, sz] = at(0, 0);
      for (const s of [-1, 1]) part({ x: sx, y: 6, z: sz + s * (ROAD + 3), sx: 1.6, sy: 12, sz: 1.6, c: 0x1f2937 });
      part({ x: sx, y: 12.6, z: sz, sx: 2, sy: 1.6, sz: 2 * ROAD + 8, c: 0x111827, plain: true });
      this.lights = [-4, 0, 4].map((dz) => part({ x: sx - 1.1, y: 11, z: sz + dz, sx: 0.6, sy: 1.6, sz: 1.6, c: 0x374151, neon: true, solid: false }));
      const lb = label('🏁 KART RACING', { size: 2.6, color: '#fde68a' }); lb.position.set(sx, 15.6, sz); place.add(lb);
      // the grandstand by the start straight
      for (let k = 0; k < 5; k++) slab(50, 1.6 * (k + 1), -16 - ROAD - k * 3.5, 76, 3.5, k % 2 ? 0x94a3b8 : 0xcbd5e1, { sy: 1.6 * (k + 1) });
      part({ x: 50, y: 13, z: -25 - ROAD, sx: 78, sy: 0.6, sz: 20, c: 0xdc2626, solid: false });
      // trees and cones about the place (never on the road)
      const r = mulberry(4242);
      let trees = 0;
      for (let k = 0; k < 600 && trees < 46; k++) {
        const x = -200 + r() * 430, z = -100 + r() * 340, [, d] = nearest(x, z);
        if (d < ROAD + 9 || (z < -12 && x > 5 && x < 95)) continue;
        trees++;
        const h = 5 + r() * 4;
        part({ x, y: h / 2, z, sx: 1.6, sy: h, sz: 1.6, c: 0x7c4a1e });
        part({ x, y: h + 2, z, sx: 6, sy: 5, sz: 6, c: r() < 0.5 ? 0x15803d : 0x16a34a, solid: false });
      }
      for (let i = 0; i < N; i += 9) if (BEND[i] > 0.75) for (const s of [-1, 1]) { const [x, z] = at(i, s * (ROAD + 3.5)); part({ x, y: 0.9, z, sx: 0.9, sy: 1.8, sz: 0.9, c: 0xf97316, solid: false }); }
    },
    pres() { return { kr: [0, 0, 0] }; },
    enter() {
      this.H = null; this.lastG = null; this.gSeen = null; this.rd = -1; this.prog = 0; this.si = null; this.started = false; this.finT = 0; this.lap = 0;
      this.mapBg = null; this.K = { sp: 0, yaw: 0, boostT: 0, drift: false, driftT: 0, bumpAt: 0, exp: null }; this.offT = 0; this.wrongT = 0; this.sentAt = 0; this.karts = new Map(); this.botAv = new Map(); this.coinRd = -1; this.best = 0;
      kvGet('kart').then((s) => { if (s && +s.best > 0) this.best = +s.best; });
      const el = document.createElement('canvas'); el.width = el.height = 300; el.id = 'krMap';
      el.style.cssText = 'position:absolute;right:12px;bottom:140px;width:150px;height:150px;border-radius:16px;background:rgba(15,23,42,.55);box-shadow:0 4px 14px rgba(0,0,0,.3)';
      $('#xhud').append(el); this.map = el;
      setBar('<button class="xslot" data-k="drift" title="Drift (Space)"><span class="k">␣</span><span class="e">💨</span>Drift</button><button class="xslot" data-k="horn" title="Horn (H)"><span class="k">H</span><span class="e">📯</span>Horn</button>', (b) => { if (b.dataset.k === 'horn') this.honk(); });
    },
    leave() {
      for (const a of this.botAv.values()) dropAvatar(a);
      this.botAv = new Map(); this.karts = new Map();
    },
    spawn() {
      const g = roundState(this), slot = g && g.grid ? g.grid.indexOf(myPeer()) : -1;
      if (g && g.ph === 'play' && slot >= 0 && this.started && g.rd === this.rd) { const [x, z, yaw] = at(Math.max(0, this.prog), 0); this.K.sp = 0; this.K.yaw = yaw; return [x, 0.5, z, yaw]; }
      const k = slot >= 0 ? slot : Math.max(0, crew().findIndex((c) => c.isMe)) % RACERS, [x, z, yaw] = gridSpot(k);
      if (this.K) { this.K.sp = 0; this.K.yaw = yaw; }
      return [x, 0.5, z, yaw];
    },
    adopt() {
      const g = this.lastG;
      return g ? JSON.parse(JSON.stringify(g)) : { ph: 'wait', left: 0, el: 0, rd: 0, grid: [], bots: [], b: [], st: [], res: [], sc: {}, gs: 0 };
    },

    /* ---- the host: races, bots, standings ---- */
    host(fdt) {
      // (the race keeps real time, even when frames come slowly)
      const now = performance.now(), dt = Math.min(1, (now - (this.hostT || now)) / 1000); this.hostT = now;
      const H = this.H, humans = players(), n = humans.length;
      H.left = Math.max(0, H.left - dt);
      if (H.ph === 'wait') { if (n >= 1) this.newRace(humans); }
      else if (H.ph === 'count') { if (n < 1) H.ph = 'wait'; else if (H.left <= 0) { H.ph = 'play'; H.el = 0; H.res = []; this.firstAt = 0; } }
      else if (H.ph === 'play') {
        H.el += dt;
        this.moveBots(dt);
        // the drivers' own progress (only those on the grid this race)
        const prog = new Map();
        for (const p of humans) {
          if (!H.grid.includes(p.peer)) continue;
          if (p.me) { prog.set(p.peer, [this.prog, this.finT]); continue; }
          const k = p.pr && p.pr.kr;
          if (Array.isArray(k) && k[0] === H.rd) prog.set(p.peer, [+k[1] || 0, +k[2] || 0]);
          else prog.set(p.peer, [-20, 0]);
        }
        for (const b of H.b) prog.set(b[0], [b[1], b[4] || 0]);
        for (const [id, [pg, ft]] of prog) if (ft > 0 && !H.res.some((r) => r[0] === id)) { H.res.push([id, this.nameOfId(id, H), +ft.toFixed(2)]); if (!this.firstAt) this.firstAt = H.el; }
        H.res.sort((a, b) => a[2] - b[2]);
        const done = new Set(H.res.map((r) => r[0]));
        H.st = H.res.map((r) => r[0]).concat([...prog.keys()].filter((id) => !done.has(id)).sort((a, b) => prog.get(b)[0] - prog.get(a)[0]));
        const people = H.grid.filter((id) => !this.isBot(id) && humans.some((p) => p.peer === id));
        if (!people.length || people.every((id) => done.has(id)) || (this.firstAt && H.el - this.firstAt > 30) || H.el > 300) this.endRace(prog);
      } else if (H.ph === 'end' && H.left <= 0) { if (n >= 1) this.newRace(humans); else H.ph = 'wait'; }
      if (performance.now() - (this.hSent || 0) > 120) { this.hSent = performance.now(); hostSend(this); }
    },
    isBot: (id) => typeof id === 'string' && id.startsWith('bot:'),
    nameOfId(id, g) { if (this.isBot(id)) { const b = ((g || this.g || {}).bots || []).find((b) => b[0] === id); return b ? b[1] : 'A bot'; } return nameOf(id); },
    newRace(humans) {
      const H = this.H;
      H.ph = 'count'; H.left = 8; H.rd = (H.rd | 0) + 1; H.el = 0; H.res = [];
      H.grid = humans.map((p) => p.peer).slice(0, RACERS);
      H.bots = [];
      for (let i = 0; H.grid.length < RACERS; i++) { const id = `bot:${H.rd}:${i}`; H.grid.push(id); H.bots.push([id, BOT_NAMES[(i + H.rd * 3) % BOT_NAMES.length], Math.floor(Math.random() * 1e6), 0.86 + Math.random() * 0.1]); }
      // the bots line up in their grid places: [id, progress, lane, speed, finish time]
      H.b = H.bots.map((b) => { const k = H.grid.indexOf(b[0]); return [b[0], +(-(7 + Math.floor(k / 2) * 9) / STEP).toFixed(1), k % 2 ? 4.5 : -4.5, 0, 0]; });
      H.st = H.grid.slice();
    },
    moveBots(dt) {
      const H = this.H;
      for (const b of H.b) {
        if (b[4]) continue; // finished
        const info = H.bots.find((x) => x[0] === b[0]), skill = info ? info[3] : 0.9, i = wrap(Math.round(b[1]));
        const want = TOP * skill * (1 - Math.min(0.38, BEND[i] * 0.32)) * (onPad(i) ? 1.35 : 1);
        b[3] = +(b[3] + (want - b[3]) * Math.min(1, dt * (want > b[3] ? 0.9 : 3))).toFixed(2);
        b[1] = +(b[1] + b[3] * dt / STEP).toFixed(2);
        b[2] = +clamp(b[2] + Math.sin(H.el * 0.6 + (info ? info[2] : 0)) * dt * 1.5, -5, 5).toFixed(2);
        if (b[1] >= LAPS * N) b[4] = +H.el.toFixed(2);
      }
    },
    endRace(prog) {
      const H = this.H;
      H.ph = 'end'; H.left = 9;
      // anyone still going: placed by how far they got
      const done = new Set(H.res.map((r) => r[0]));
      for (const id of H.st) if (!done.has(id)) H.res.push([id, this.nameOfId(id, H), 0]);
      const w = H.res[0];
      if (w && w[2] > 0 && !this.isBot(w[0])) H.sc[w[0]] = (H.sc[w[0]] || 0) + 1;
    },

    /* ---- driving (every player, their own kart) ---- */
    drive(dt, f, r) {
      const K = this.K, g = this.g, now = performance.now();
      const held = g && g.ph === 'count' && g.grid && g.grid.includes(myPeer());
      const throttle = held || P.frozen || chatOpen() || fullOpen() ? 0 : clamp(f, -1, 1), steer = held ? 0 : clamp(r, -1, 1);
      // ran into something: lose most of the speed
      if (K.exp) { const want = Math.hypot(K.exp[0], K.exp[1]), got = Math.hypot(P.x - K.exp[2], P.z - K.exp[3]); if (want > 0.03 && got < want * 0.35 && now > K.bumpAt) { K.bumpAt = now + 400; K.sp *= 0.35; sfx('crash', { vol: 0.5, gap: 300 }); } }
      K.boostT = Math.max(0, K.boostT - dt);
      const cap = K.boostT > 0 ? BOOST : this.offRoad ? GRASS : TOP;
      if (held) K.sp = 0;
      else if (K.sp > cap) K.sp += (cap - K.sp) * Math.min(1, dt * (this.offRoad ? 3 : 1.5));
      else if (throttle > 0) K.sp = Math.min(cap, K.sp + ACC * throttle * dt * (K.sp < 20 ? 1.4 : 1));
      else if (throttle < 0) K.sp = Math.max(-REV, K.sp + 55 * throttle * dt);
      else { K.sp *= Math.exp(-dt * 0.9); if (Math.abs(K.sp) < 0.5) K.sp = 0; }
      // drifting: hold Space while turning at speed; let go after a while for a boost
      const wantDrift = (keys.Space || jumpHeld) && Math.abs(steer) > 0.3 && K.sp > 25 && !held;
      if (wantDrift) { if (!K.drift) { K.drift = true; K.driftT = 0; K.driftDir = Math.sign(steer); } K.driftT += dt; }
      else if (K.drift) {
        K.drift = false;
        if (K.driftT > 0.8) { K.boostT = K.driftT > 1.8 ? 1.3 : 0.75; K.sp = Math.max(K.sp, TOP + 12); sfx('whoosh', { pitch: 1.3 }); puffAt(P.x, P.y + 1, P.z, K.driftT > 1.8 ? [0xf97316, 0xfde047] : [0x60a5fa, 0xffffff], 10); }
      }
      // steering turns harder the faster you go (up to a point), and the other way backwards
      const grip = clamp(Math.abs(K.sp) / 14, 0, 1), turn = 2.2 * (K.drift ? 1.45 : 1) * grip * (K.sp < 0 ? -1 : 1);
      K.yaw -= steer * turn * dt;
      const vx = -Math.sin(K.yaw) * K.sp, vz = -Math.cos(K.yaw) * K.sp;
      K.exp = [vx * dt, vz * dt, P.x, P.z];
      return [vx, vz, K.yaw];
    },
    honk() { if (performance.now() > (this.hornAt || 0)) { this.hornAt = performance.now() + 700; sfx('horn'); send({ hk: ((this.hk = (this.hk || 0) + 1)) }); } },
    key(code, down) { if (down && code === 'KeyH') { this.honk(); return true; } },
    tick(dt) {
      const g = this.g = roundState(this), mine = myPeer(), K = this.K, now = performance.now();
      const racing = !!(g && g.ph === 'play' && g.grid && g.grid.includes(mine));
      // a new race: to the grid
      if (g && (g.ph === 'count' || g.ph === 'play') && g.rd !== this.rd) {
        this.rd = g.rd; this.started = false; this.finT = 0; this.lap = 0; this.prog = 0;
        if (g.grid && g.grid.includes(mine)) { respawn(true); if (g.ph === 'count') toast(`🏁 Race ${g.rd}: get ready!`, '#fde68a'); }
      }
      if (g && g.ph === 'count') { const c = Math.ceil(g.left); if (c !== this.cdS && c <= 3 && c > 0) sfx('count'); this.cdS = c; } else this.cdS = null;
      // where you are on the road
      let [i, d] = nearest(P.x, P.z, this.si, 40);
      if (this.si == null || d > 40) [i, d] = nearest(P.x, P.z);
      this.si = i;
      this.offRoad = d > ROAD + 1;
      if (racing && !this.started) {
        this.started = true; this.prog = this.si > N / 2 ? this.si - N : this.si; this.lap = 1;
        sfx('go'); toast('GO! 🏁', '#86efac');
      }
      if (racing && this.started && !this.finT && !P.dead) {
        let delta = this.si - wrap(Math.round(this.prog));
        if (delta > N / 2) delta -= N; if (delta < -N / 2) delta += N;
        if (Math.abs(delta) <= 45) this.prog += delta;
        const lap = Math.floor(this.prog / N) + 1;
        if (lap > this.lap) { this.lap = lap; if (lap <= LAPS) { sfx('bell'); toast(lap === LAPS ? '🏁 Final lap!' : `Lap ${lap} of ${LAPS}`, '#fde68a'); } }
        if (this.prog >= LAPS * N) {
          this.finT = Math.max(0.1, g.el);
          const place = (g.res || []).length + 1;
          sfx(place === 1 ? 'win' : 'reward'); toast(`🏁 You finished ${PLACE[place - 1] || ''}! ${fmt(this.finT)}`, '#86efac'); puffAt(P.x, P.y + 3, P.z, CONFETTI, 40);
          if (!this.best || this.finT < this.best) { this.best = this.finT; kvSet('kart', { best: this.best }); say(`⏱️ New best time: ${fmt(this.best)}`, '#86efac'); }
        }
        // way off the road (or going the wrong way for a while): back onto it
        this.offT = d > 34 ? this.offT + dt : 0;
        const fwd = -Math.sin(K.yaw) * DX[this.si] - Math.cos(K.yaw) * DZ[this.si];
        this.wrongT = K.sp > 10 && fwd < -0.5 ? this.wrongT + dt : 0;
        if (this.offT > 1.5) { this.offT = 0; respawn(); toast('↩️ Back on the track', '#fde68a'); }
      } else { this.offT = 0; this.wrongT = 0; }
      // boost pads
      if (!this.offRoad && onPad(this.si) && d < 3.2 && now > (this.padAt || 0)) { this.padAt = now + 600; K.boostT = Math.max(K.boostT, 1.1); K.sp = Math.max(K.sp, BOOST); sfx('powerup', { vol: 0.6, gap: 300 }); }
      if (K.drift && Math.random() < dt * 30) { const bk = 2.6; puffAt(P.x + Math.sin(K.yaw) * bk + (Math.random() - 0.5) * 3, P.y + 0.3, P.z + Math.cos(K.yaw) * bk, K.driftT > 1.8 ? [0xf97316, 0xfde047] : K.driftT > 0.8 ? [0x60a5fa, 0xffffff] : [0xd1d5db], 1); }
      if (K.boostT > 0 && Math.random() < dt * 25) puffAt(P.x + Math.sin(K.yaw) * 3.2, P.y + 1, P.z + Math.cos(K.yaw) * 3.2, [0xf97316, 0xfacc15], 1);
      // tell the host how far you've got
      if (racing && now - this.sentAt > 200) { this.sentAt = now; const kr = [g.rd, +this.prog.toFixed(1), +(this.finT || 0).toFixed(2)]; if (kr.join() !== this.krKey) { this.krKey = kr.join(); send({ kr }); } }
      // the camera follows behind
      let dy = P.yaw - cam.yaw; while (dy > Math.PI) dy -= 6.283; while (dy < -Math.PI) dy += 6.283;
      cam.yaw += dy * Math.min(1, dt * 4.5); cam.pitch += (-0.24 - cam.pitch) * Math.min(1, dt * 3);
      // the start lights
      if (this.lights) {
        const left = g && g.ph === 'count' ? g.left : 99, go = g && g.ph === 'play' && g.el < 2;
        this.lights.forEach((p, k) => p.m.material.color.setHex(go ? 0x22c55e : left <= 3 - k ? 0xef4444 : 0x374151));
      }
      // other drivers' horns
      for (const p of Net.peers) { if (p.isMe || !p.presence) continue; const s = this.hks || (this.hks = new Map()), h = p.presence.hk | 0; if (s.has(p.peer) && s.get(p.peer) !== h) { const a = Net.avatars.get(p.peer); if (a) sfx3('horn', a.g.position.x, a.g.position.z, 90); } s.set(p.peer, h); }
      // coins when a race ends
      if (g && g.ph === 'end' && this.coinRd !== g.rd && (g.res || []).length) {
        this.coinRd = g.rd;
        const k = g.res.findIndex((r) => r[0] === mine);
        if (k >= 0 && g.res[k][2] > 0) { const c = [25, 15, 10][k] || 5; earn(c, k === 0 ? 'won a kart race' : 'finished a kart race'); }
      }
      this.drawBots(g, dt);
      this.drawMap(g);
      // the banner
      const place = g && g.st ? g.st.indexOf(mine) + 1 : 0;
      if (!g) setBanner('Getting the race…');
      else if (g.ph === 'wait') setBanner('Waiting for drivers…');
      else if (g.ph === 'count') setBanner(g.grid.includes(mine) ? `🏁 Race starts in ${Math.ceil(g.left)}…` : 'A race is about to start — you’re in the next one');
      else if (g.ph === 'play') setBanner(!g.grid.includes(mine) ? '🏁 Race on — you’re in the next one (drive around for now)' : this.finT ? `🏁 Finished ${PLACE[place - 1] || ''} · ${fmt(this.finT)} · waiting for the others…` : this.wrongT > 1 ? '⚠️ Wrong way! Turn around' : this.offT > 0.3 ? '↩️ Get back on the track!' : `Lap ${Math.min(LAPS, this.lap)}/${LAPS} · ${MEDAL[place - 1] || ''} ${PLACE[place - 1] || ''} of ${g.st.length} · ⏱ ${fmt(g.el)}`);
      else setBanner(`🏆 ${(g.res || []).slice(0, 3).map((r, k) => `${MEDAL[k]} ${esc(r[1])}${r[2] ? ` ${fmt(r[2])}` : ''}`).join(' · ') || 'Race over'}`);
    },
    // the bots: where the host says, carried on at their speed since
    drawBots(g, dt) {
      const since = this.H ? 0 : Math.min(0.3, (performance.now() - (this.gAt || performance.now())) / 1000);
      const want = new Map(g && g.ph !== 'wait' ? (g.b || []).map((b) => [b[0], b]) : []);
      for (const [id, a] of this.botAv) if (!want.has(id)) { dropAvatar(a); this.botAv.delete(id); this.karts.delete(id); }
      for (const [id, b] of want) {
        let a = this.botAv.get(id);
        const info = (g.bots || []).find((x) => x[0] === id) || [id, 'Bot', 1];
        if (!a) { const r = mulberry(info[2] | 0), av = okAv([Math.floor(r() * 6), Math.floor(r() * 10), Math.floor(r() * 8), Math.floor(r() * 12), Math.floor(r() * 9), 0, 0, Math.floor(r() * 7), 0]); a = makeAvatar(av, '🤖 ' + info[1], false); scene.add(a.g); this.botAv.set(id, a); a.first = true; }
        const pg = Math.min(LAPS * N + 30, b[1] + (b[4] ? 0 : b[3] * since / STEP)), [x, z, yaw] = at(pg, b[2]);
        const p = a.g.position, k = a.first ? 1 : Math.min(1, dt * 10); a.first = false;
        p.x += (x - p.x) * k; p.z += (z - p.z) * k; p.y = 0.02;
        let dyw = yaw - a.g.rotation.y; while (dyw > Math.PI) dyw -= 6.283; while (dyw < -Math.PI) dyw += 6.283; a.g.rotation.y += dyw * Math.min(1, dt * 10);
        a.speed = b[3]; placeShadow(a);
      }
    },
    drawMap(g) {
      const c = this.map; if (!c) return;
      const x = c.getContext('2d'), S = 300, sc = 0.82, ox = S / 2 - 20 * sc, oz = S / 2 - 70 * sc;
      if (!this.mapBg) {
        const bg = this.mapBg = document.createElement('canvas'); bg.width = bg.height = S; const y = bg.getContext('2d');
        y.lineWidth = 16; y.lineCap = y.lineJoin = 'round'; y.strokeStyle = 'rgba(255,255,255,.85)';
        y.beginPath(); for (let i = 0; i <= N; i += 4) { const k = i % N, px = ox + TX[k] * sc, pz = oz + TZ[k] * sc; i ? y.lineTo(px, pz) : y.moveTo(px, pz); } y.closePath(); y.stroke();
        y.lineWidth = 9; y.strokeStyle = '#3f3f46'; y.stroke();
        y.fillStyle = '#fff'; y.fillRect(ox + TX[0] * sc - 2, oz + TZ[0] * sc - 9, 4, 18);
      }
      x.clearRect(0, 0, S, S); x.drawImage(this.mapBg, 0, 0);
      const dot = (px, pz, col, r) => { x.fillStyle = col; x.beginPath(); x.arc(ox + px * sc, oz + pz * sc, r, 0, 6.283); x.fill(); x.lineWidth = 2; x.strokeStyle = '#fff'; x.stroke(); };
      for (const a of this.botAv.values()) dot(a.g.position.x, a.g.position.z, '#94a3b8', 6);
      for (const a of Net.avatars.values()) dot(a.g.position.x, a.g.position.z, '#60a5fa', 7);
      dot(P.x, P.z, '#f97316', 9);
    },
    // everyone sits in a kart in their shirt colour
    pose(dt) {
      this.seat(me, 'me', this.K.sp, dt);
      for (const [peer, a] of Net.avatars) { const p = a.g.position, lp = a.lastP || p.clone(); a.speed = p.distanceTo(lp) / Math.max(dt, 1e-3); a.lastP = p.clone(); this.seat(a, peer, a.speed, dt); }
      for (const [id, a] of this.botAv) this.seat(a, id, a.speed || 0, dt);
    },
    seat(a, key, speed, dt) {
      if (!a) return;
      let k = this.karts.get(key);
      if (!k || k.a !== a) { k = kartMesh(SHIRTS[a.av ? a.av[1] : 0] || '#ef4444'); k.a = a; a.g.add(k.g); this.karts.set(key, k); }
      if (a.dead) return;
      a.body.position.y = -1.0;
      a.legL.rotation.x = a.legR.rotation.x = Math.PI / 2;
      a.armL.rotation.x = a.armR.rotation.x = 1.15;
      for (const w of k.wheels) w.rotation.x -= speed * dt / 0.7;
    },
    statOf(pr, isMe, peer) { const g = this.g; return g && g.sc ? g.sc[peer] || 0 : 0; },
    sortKey(pr, isMe, peer) { const g = this.g; return g && g.sc ? g.sc[peer] || 0 : 0; },
    hud() {
      const K = this.K;
      return `⚡ <b>${Math.round(Math.abs(K.sp) * 1.2)}</b> mph${K.boostT > 0 ? ' · 🔥 BOOST' : K.drift ? ` · 💨 ${K.driftT > 1.8 ? 'super drift!' : K.driftT > 0.8 ? 'drift ready' : 'drifting'}` : ''}${this.best ? ` · ⏱️ best ${fmt(this.best)}` : ''}`;
    },
  };
  addExp(KR);
  window.__rbKR = KR;
  window.__kart = { at, nearest, N, LAPS, STEP, LEN }; // for tests
})();
