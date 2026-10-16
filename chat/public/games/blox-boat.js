/* =====================================================================
   BLOXVERSE — BUILD A BOAT FOR TREASURE. Everyone gets a plot on the
   dock. Build a boat out of blocks (wood, plastic, stone, metal, glass,
   balloons, a seat and motors), launch it and sail down the river:
   ten stages of rocks, logs, a waterfall, a whirlpool, ice, cannons and
   lava, with gold for every stage and treasure at the end. Blocks break
   when they crash; what floats depends on what it's made of. Your boat,
   blocks and gold are saved; everyone sees each other's boats.
   ===================================================================== */
(() => {
  const BLK = [
    { n: 'Wood', e: '🪵', c: 0xb07a3e, d: 0.5, hp: 60, pack: 10, price: 20 },
    { n: 'Plastic', e: '🥛', c: 0xf1f5f9, d: 0.3, hp: 40, pack: 10, price: 40 },
    { n: 'Stone', e: '🪨', c: 0x9ca3af, d: 2.2, hp: 220, pack: 10, price: 60 },
    { n: 'Metal', e: '🔩', c: 0x64748b, d: 3.0, hp: 450, pack: 10, price: 150 },
    { n: 'Glass', e: '🪟', c: 0x93c5fd, d: 1.1, hp: 25, pack: 10, price: 50, alpha: 0.45 },
    { n: 'Balloon', e: '🎈', c: 0xf43f5e, d: -1.6, hp: 15, pack: 1, price: 40 },
    { n: 'Seat', e: '💺', c: 0x1f2937, d: 0.6, hp: 80, pack: 1, price: 100 },
    { n: 'Motor', e: '⚙️', c: 0x334155, d: 1.6, hp: 120, pack: 1, price: 250 },
  ];
  const SEAT = 6, MOTOR = 7, N = 8, MAXB = 200, PLOTS = [-45, -27, -9, 9, 27, 45], PZ = 16, DOCK = 2;
  const STAGES = ['Calm Waters', 'Rocky Rapids', 'Narrow Pass', 'Log Jam', 'Waterfall', 'Whirlpool', 'Ice Floes', 'Cannon Cove', 'Lava Gorge', 'Treasure Bay'];
  const SL = 70, FALL_Z = -4 * SL - 35, END_Z = -10 * SL; // stage length; the waterfall is halfway along stage 5
  const wl = (z) => (z > FALL_Z ? 0 : -10); // the water's surface
  const stageAt = (z) => clamp(Math.floor(-z / SL), 0, 9);
  const cellPos = (px, i, j, k) => [px - 7 + 2 * i, DOCK + 1 + 2 * k, PZ - 7 + 2 * j];
  const enc = (list) => list.map((b) => [b.i, b.j, b.k, b.t].map((v) => v.toString(36)).join('')).join('');
  const dec = (s) => { const out = []; s = String(s || ''); for (let n = 0; n + 4 <= s.length && out.length < MAXB; n += 4) { const [i, j, k, t] = [0, 1, 2, 3].map((q) => parseInt(s[n + q], 36)); if (i < 8 && j < 8 && k < 8 && t < N) out.push({ i, j, k, t }); } return out; };

  const BB = {
    id: 'boat', code: 'bb', genre: 'Building', rank: 0.5, name: 'Build a Boat for Treasure', emoji: '⛵', max: 6, stat: 'Best', killY: -60,
    color: 'linear-gradient(135deg,#0284c7,#a16207)',
    desc: 'Build a boat out of blocks on your plot, then launch it down the river: ten stages of rocks, logs, a waterfall, a whirlpool, ice, cannons and lava. Wood and plastic float, stone and metal are tough, balloons lift, motors push. Every stage pays gold for more blocks; the treasure waits at the end.',
    welcome: 'Build a boat, then ⛵ Launch!',
    build() {
      sky('#4fb3ff', '#e0f2fe');
      this.obs = []; this.fx = []; this.myParts = []; this.others = new Map(); this.sail = null; this.ghost = null;
      // the dock with six plots
      part({ x: 0, y: DOCK - 1.5, z: 16, sx: 116, sy: 3, sz: 28, c: 0x8b5a2b });
      this.floors = PLOTS.map((px, n) => part({ x: px, y: DOCK - 0.05, z: PZ, sx: 16, sy: 0.1, sz: 16, c: [0x60a5fa, 0xf87171, 0x4ade80, 0xfacc15, 0xc084fc, 0xfb923c][n], plot: n }));
      const s = label('BUILD A BOAT\nFOR TREASURE', { size: 3 }); s.position.set(0, 16, 34); place.add(s);
      // the river: water, riverbed, canyon walls
      const water = (z0, z1, top) => part({ x: 0, y: top - 6, z: (z0 + z1) / 2, sx: 60, sy: 12, sz: z0 - z1, c: 0x1e88e5, alpha: 0.62, solid: false, plain: true });
      water(2, FALL_Z, 0); water(FALL_Z, END_Z - 70, -10);
      this.ob({ x: 0, y: -10.4, z: (2 + FALL_Z) / 2, sx: 62, sy: 0.8, sz: 2 - FALL_Z, c: 0xc2a26a }, 0);
      this.ob({ x: 0, y: -20.4, z: (FALL_Z + END_Z - 70) / 2, sx: 62, sy: 0.8, sz: FALL_Z - END_Z + 70, c: 0xc2a26a }, 0);
      part({ x: 0, y: -15, z: FALL_Z - 0.5, sx: 60, sy: 10, sz: 1, c: 0x7dd3fc, alpha: 0.6, solid: false, plain: true }); // the falling water
      for (let s = 0; s < 10; s++) {
        const z = -s * SL - SL / 2, col = s === 8 ? 0x9a3412 : s === 6 ? 0xe2e8f0 : 0x78716c;
        for (const side of [-1, 1]) this.ob({ x: side * 36, y: 0, z, sx: 12, sy: 50, sz: SL, c: col }, 0.4);
        const l = label(`Stage ${s + 1} · ${STAGES[s]}`, { size: 1.3 }); l.position.set(0, (s >= 4 ? 8 : 18), -s * SL - 4); place.add(l);
      }
      this.course(mulberry(4242));
    },
    ob(o, dmg) { const p = part(Object.assign({ obs: dmg }, o)); this.obs.push(p); return p; },
    // what's in the river, stage by stage
    course(r) {
      const z0 = (s) => -s * SL;
      for (let i = 0; i < 3; i++) this.ob({ x: (r() < 0.5 ? -1 : 1) * (22 + r() * 5), y: -2, z: z0(0) - 20 - i * 18, sx: 4, sy: 10, sz: 4, c: 0x57534e }, 1);
      for (let i = 0; i < 11; i++) { const w = 2.5 + r() * 2; this.ob({ x: (r() - 0.5) * 48, y: -3, z: z0(1) - 8 - i * 5.6, sx: w, sy: 14, sz: w, c: 0x57534e }, 1); }
      for (let i = 0; i < 4; i++) { const left = i % 2 === 0; this.ob({ x: left ? -17 : 17, y: -3, z: z0(2) - 10 - i * 16, sx: 26, sy: 16, sz: 6, c: 0x6b7280 }, 0.7); }
      for (let i = 0; i < 4; i++) { const ph = r() * 6, sp = 0.6 + r() * 0.5; this.ob({ x: 0, y: 0.2, z: z0(3) - 12 - i * 15, sx: 16, sy: 2, sz: 2.4, c: 0x7c4a1e, move: (t) => [Math.sin(t * sp + ph) * 14, 0, 0] }, 1.5); }
      for (let i = 0; i < 4; i++) this.ob({ x: (r() - 0.5) * 44, y: -3, z: z0(4) - 6 - i * 7, sx: 3, sy: 10, sz: 3, c: 0x57534e }, 1);
      this.whirl = [(r() - 0.5) * 24, z0(5) - SL / 2];
      this.ob({ x: this.whirl[0], y: -14, z: this.whirl[1], sx: 4, sy: 12, sz: 4, c: 0x44403c }, 1);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(16, 40), new THREE.MeshBasicMaterial({ color: 0x0b3b6b, transparent: true, opacity: 0.55, depthWrite: false }));
      disc.rotation.x = -Math.PI / 2; disc.position.set(this.whirl[0], -9.9, this.whirl[1]); place.add(disc); this.disc = disc;
      for (let i = 0; i < 16; i++) { const s = 3 + r() * 3; this.ob({ x: (r() - 0.5) * 50, y: -10.2, z: z0(6) - 6 - r() * 58, sx: s, sy: 2.4, sz: s, c: 0xe0f2fe }, 0.8); }
      for (let i = 0; i < 5; i++) for (const side of [-1, 1]) { const c = part({ x: side * 29.5, y: -8, z: z0(7) - 8 - i * 13, sx: 3, sy: 2, sz: 2, c: 0x111827 }); c.cannon = side; }
      for (let i = 0; i < 5; i++) this.ob({ x: (r() - 0.5) * 40, y: -13, z: z0(8) - 8 - i * 13, sx: 3, sy: 10, sz: 3, c: 0x7f1d1d }, 1);
      // the treasure beach
      for (let k = 0; k < 8; k++) this.ob({ x: 0, y: -10.6 + k * 1.3, z: END_Z - 16 - k * 3, sx: 60, sy: 2.4, sz: 3, c: 0xf2d38a }, 0);
      part({ x: 0, y: -2, z: END_Z - 56, sx: 60, sy: 4, sz: 34, c: 0xf2d38a });
      const ch = part({ x: 0, y: 1.5, z: END_Z - 50, sx: 6, sy: 3, sz: 4, c: 0x92400e }); part({ x: 0, y: 3.4, z: END_Z - 50, sx: 6.4, sy: 1, sz: 4.4, c: 0xfacc15, neon: true });
      const tl = label('🏆 TREASURE', { size: 3 }); tl.position.set(0, 9, END_Z - 50); place.add(tl); this.chest = ch;
    },
    pres() { return { pl: -1, bd: '', bo: 0, best: 0 }; },
    async enter() {
      const s = await kvGet('bb');
      this.S = Object.assign({ gold: 100, inv: [40, 10, 0, 0, 0, 0, 1, 0], d: '', best: 0, tr: 0 }, s && typeof s === 'object' ? s : {});
      const S = this.S;
      S.inv = BLK.map((b, t) => Math.max(0, (Array.isArray(S.inv) ? S.inv[t] : 0) | 0));
      this.design = dec(S.d);
      this.sel = 0; this.del = false;
      this.pickPlot();
      this.drawBuild(); this.drawBar();
      send({ bd: enc(this.design), best: S.best | 0, bo: 0 });
    },
    leave() { if (this.sail) this.endRun('', true); P.frozen = false; this.save(); this.dropOthers(); if (this.ghost) { scene.remove(this.ghost); this.ghost = null; } },
    save() { this.S.d = enc(this.design); return kvSet('bb', this.S); },
    // the lowest plot nobody's using (someone who's been here longer keeps theirs)
    pickPlot() {
      const taken = new Set(Net.peers.filter((p) => !p.isMe && p.presence && p.presence.pl >= 0).map((p) => p.presence.pl | 0));
      this.pl = PLOTS.findIndex((x, n) => !taken.has(n));
      if (this.pl < 0) this.pl = 0;
      send({ pl: this.pl });
    },
    spawn() { return [PLOTS[this.pl == null ? 0 : this.pl], DOCK + 0.6, PZ + 9.5, 0]; },
    count() { return this.design.length; },

    /* ---- building ---- */
    drawBuild() {
      const old = new Set(this.myParts); removeParts((q) => old.has(q));
      this.myParts = [];
      if (this.sail) return;
      const px = PLOTS[this.pl];
      for (const b of this.design) {
        const [x, y, z] = cellPos(px, b.i, b.j, b.k), B = BLK[b.t];
        const p = part({ x, y, z, sx: 2, sy: 2, sz: 2, c: B.c, alpha: B.alpha, plain: !!B.alpha, cell: b, mine: 1 });
        p.m.updateMatrixWorld(); // (so a quick second click can aim at it before the next frame is drawn)
        this.myParts.push(p);
      }
      const l = this.plotLabel; if (l) place.remove(l);
      this.plotLabel = label(`${Net.name}’s boat`, { size: 1.2 }); this.plotLabel.position.set(px, DOCK + 18, PZ - 9); place.add(this.plotLabel);
    },
    aim(e) {
      if (this.sail || panelOpen()) return null;
      const px = PLOTS[this.pl];
      if (Math.hypot(P.x - px, P.z - PZ) > 34) return null;
      const hit = pickObjects(e.x, e.y, [this.floors[this.pl].m].concat(this.myParts.map((p) => p.m)));
      if (!hit) return null;
      const part0 = this.myParts.find((p) => p.m === hit.object);
      if (this.del) return part0 ? { rm: part0.cell } : null;
      const n = hit.face ? hit.face.normal : { x: 0, y: 1, z: 0 };
      let c;
      if (part0) c = { i: part0.cell.i + Math.round(n.x), j: part0.cell.j + Math.round(n.z), k: part0.cell.k + Math.round(n.y) };
      else c = { i: Math.floor((hit.point.x - (px - 8)) / 2), j: Math.floor((hit.point.z - (PZ - 8)) / 2), k: 0 };
      if (c.i < 0 || c.i > 7 || c.j < 0 || c.j > 7 || c.k < 0 || c.k > 7) return null;
      if (this.design.some((b) => b.i === c.i && b.j === c.j && b.k === c.k)) return null;
      return { add: c };
    },
    hover(e) {
      const a = this.aim(e);
      if (!this.ghost) { this.ghost = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.45, depthWrite: false })); this.ghost.scale.setScalar(2.06); scene.add(this.ghost); }
      if (!a) { this.ghost.visible = false; return; }
      const c = a.add || a.rm, [x, y, z] = cellPos(PLOTS[this.pl], c.i, c.j, c.k);
      this.ghost.visible = true; this.ghost.position.set(x, y, z);
      this.ghost.material.color.setHex(a.rm ? 0xef4444 : this.S.inv[this.sel] > 0 ? 0x4ade80 : 0xf59e0b);
    },
    click(e) {
      let a;
      if (e.button === 2) { const keep = this.del; this.del = true; a = this.aim(e); this.del = keep; } // right-click removes, whatever you hold
      else a = this.aim(e);
      if (!a) return;
      if (a.rm) {
        const c = a.rm;
        this.design = this.design.filter((b) => b !== c); this.S.inv[c.t]++; sfx('break', { vol: 0.5 });
      } else {
        const t = this.sel, c = a.add, [x, y, z] = cellPos(PLOTS[this.pl], c.i, c.j, c.k);
        if (this.S.inv[t] <= 0) { toast(`No ${BLK[t].n.toLowerCase()} left — buy more in the 🛒 Shop`, '#fca5a5'); sfx('error'); return; }
        if (this.design.length >= MAXB) { toast(`Boats can have up to ${MAXB} blocks`, '#fca5a5'); return; }
        if (Math.abs(P.x - x) < 2 && Math.abs(P.z - z) < 2 && P.y < y + 1 && P.y + P.h > y - 1) { toast('You’re in the way!', '#fca5a5'); return; }
        this.design.push({ i: c.i, j: c.j, k: c.k, t }); this.S.inv[t]--; sfx('place', { vol: 0.6 });
      }
      this.changed();
      this.hover(e);
    },
    changed() { this.drawBuild(); this.drawBar(); send({ bd: enc(this.design) }); clearTimeout(this.saveT); this.saveT = setTimeout(() => this.save(), 1500); },
    key(code, down) {
      if (!down) return;
      const d = /^Digit([1-8])$/.exec(code);
      if (d && !this.sail) { this.sel = +d[1] - 1; this.del = false; this.drawBar(); sfx('tap'); return true; }
      if (code === 'KeyX' && !this.sail) { this.del = !this.del; this.drawBar(); return true; }
      if (code === 'KeyL') { if (this.sail) this.endRun('🏠 Back to your plot'); else this.launch(); return true; }
      if (code === 'KeyB' && !this.sail) { this.shop(); return true; }
    },
    drawBar() {
      const S = this.S;
      if (this.sail) {
        setBar(`<button class="xslot" data-k="home" title="Back to your plot (L)"><span class="k">L</span><span class="e">🏠</span>Return</button>${this.seated ? '<button class="xslot info"><b>💺</b>A/D steer · W go<br>Space to stand</button>' : '<button class="xslot" data-k="sit"><span class="e">💺</span>Sit (E)</button>'}`, (b) => {
          if (b.dataset.k === 'home') this.endRun('🏠 Back to your plot');
          if (b.dataset.k === 'sit') this.sit();
        });
        return;
      }
      setBar(BLK.map((B, t) => `<button class="xslot ${!this.del && this.sel === t ? 'on' : ''}" data-t="${t}" title="${B.n}"><span class="k">${t + 1}</span><span class="e">${B.e}</span>${B.n}<span class="n">${S.inv[t]}</span></button>`).join('')
        + `<button class="xslot ${this.del ? 'on' : ''}" data-k="del" title="Remove blocks (X, or right-click)"><span class="k">X</span><span class="e">🔨</span>Remove</button>`
        + `<button class="xslot" data-k="shop" title="Buy blocks (B)"><span class="k">B</span><span class="e">🛒</span>Shop</button>`
        + `<button class="xslot" data-k="clear" title="Take your boat apart"><span class="e">🧹</span>Clear</button>`
        + `<button class="xslot" data-k="go" title="Launch (L)" style="background:linear-gradient(180deg,#22c55e,#15803d)"><span class="k">L</span><span class="e">⛵</span>Launch</button>`, (b) => {
        if (b.dataset.t) { this.sel = +b.dataset.t; this.del = false; this.drawBar(); }
        const k = b.dataset.k;
        if (k === 'del') { this.del = !this.del; this.drawBar(); }
        if (k === 'shop') this.shop();
        if (k === 'go') this.launch();
        if (k === 'clear') { if (!this.design.length) return; if (!this.clearAsk) { this.clearAsk = true; toast('Press 🧹 Clear again to take your boat apart', '#fde68a'); setTimeout(() => (this.clearAsk = false), 3000); return; } this.clearAsk = false; for (const b of this.design) this.S.inv[b.t]++; this.design = []; this.changed(); sfx('break'); }
      });
    },
    shop() {
      const S = this.S;
      const html = `<div class="xp-row"><span>💰 <b>${S.gold}</b> gold</span><span>🧱 <b>${this.design.length}/${MAXB}</b> in your boat</span></div>` + BLK.map((B, t) => `<div class="xp-row"><span class="lft"><span class="ico" style="background:#${B.c.toString(16).padStart(6, '0')}55">${B.e}</span><span><b>${B.n}</b> <small style="color:var(--muted)">you have ${S.inv[t]}</small><br><small style="color:var(--muted)">${B.d < 0 ? 'lifts your boat' : B.d < 1 ? 'floats' : 'sinks'} · ${B.hp} toughness${t === SEAT ? ' · sit to steer' : t === MOTOR ? ' · W pushes you forward' : ''}</small></span></span><button class="xp-btn gold" data-buy="${t}" ${S.gold < B.price ? 'disabled' : ''}>${B.pack > 1 ? `×${B.pack} · ` : ''}💰 ${B.price}</button></div>`).join('')
        + '<p class="xp-note">Every stage you reach pays gold. Wood and plastic float; stone and metal are tough but heavy, so mix them with floaty blocks.</p>';
      openPanel('🛒 Block Shop', html, (btn) => {
        const t = +btn.dataset.buy, B = BLK[t];
        if (S.gold < B.price) return;
        S.gold -= B.price; S.inv[t] += B.pack; sfx('buy'); this.save(); this.drawBar(); this.shop();
      });
    },

    /* ---- sailing ---- */
    launch() {
      if (this.sail) return;
      if (!this.design.length) { toast('Build a boat first! Click your plot to place blocks.', '#fca5a5'); sfx('error'); return; }
      closePanel();
      const kmin = Math.min(...this.design.map((b) => b.k));
      const B = { x: clamp(PLOTS[this.pl], -18, 18), y: -1, z: -8, vx: 0, vy: 0, vz: 0, blocks: [], best: 0, inWater: false, gold: 0 };
      B.x0 = B.x; B.y0 = B.y; B.z0 = B.z;
      const off = () => [B.x - B.x0, B.y - B.y0, B.z - B.z0];
      for (const b of this.design) {
        const T = BLK[b.t], lc = [2 * b.i - 7, 2 * (b.k - kmin) + 1, 2 * b.j - 7];
        const p = part({ x: B.x + lc[0], y: B.y + lc[1], z: B.z + lc[2], sx: 2, sy: 2, sz: 2, c: T.c, alpha: T.alpha, plain: !!T.alpha, move: off, boat: 1 });
        B.blocks.push({ t: b.t, lc, hp: T.hp, p, alive: true, wasIn: false });
      }
      this.sail = B; this.seated = false;
      const old = new Set(this.myParts); removeParts((q) => old.has(q));
      this.myParts = [];
      if (this.ghost) this.ghost.visible = false;
      this.sit(true);
      this.drawBar();
      send({ bo: [+B.x.toFixed(1), +B.y.toFixed(1), +B.z.toFixed(1)] });
      sfx('horn'); toast('⛵ Off you go! Reach the treasure!', '#bae6fd');
    },
    sit(first) {
      const B = this.sail; if (!B) return;
      const seat = B.blocks.find((b) => b.alive && b.t === SEAT);
      const top = seat || B.blocks.filter((b) => b.alive).sort((a, c) => c.lc[1] - a.lc[1] || Math.abs(a.lc[0]) - Math.abs(c.lc[0]))[0];
      if (!seat && !first) return;
      if (top) { P.x = B.x + top.lc[0]; P.y = B.y + top.lc[1] + 1.05; P.z = B.z + top.lc[2]; P.vx = P.vy = P.vz = 0; P.yaw = 0; cam.yaw = 0; }
      this.seated = !!seat; P.frozen = !!seat;
      if (first && !seat) toast('No 💺 seat on your boat: you can’t steer!', '#fde68a');
      this.drawBar();
    },
    endRun(msg, quiet) {
      const B = this.sail; if (!B) return;
      const gone = new Set(B.blocks.map((b) => b.p)); removeParts((q) => gone.has(q));
      for (const f of this.fx) { scene.remove(f.m); if (f.ring) scene.remove(f.ring); }
      this.fx = [];
      this.sail = null; this.seated = false; P.frozen = false;
      send({ bo: 0 });
      this.drawBuild(); this.drawBar(); this.save();
      if (!quiet) { respawn(); if (msg) toast(msg, '#bae6fd'); }
    },
    destroy(b, why) {
      if (!b.alive) return;
      b.alive = false; removeParts((q) => q === b.p);
      puffAt(this.sail.x + b.lc[0], this.sail.y + b.lc[1], this.sail.z + b.lc[2], BLK[b.t].c, 8);
      if (performance.now() - (this.crunchAt || 0) > 120) { this.crunchAt = performance.now(); sfx(why === 'boom' ? 'explode' : 'crunch', { vol: 0.6 }); }
      if (b.t === SEAT && this.seated) { this.seated = false; P.frozen = false; this.drawBar(); toast('💥 Your seat broke!', '#fca5a5'); }
    },
    hurtBlock(b, dmg, why) { if (!b.alive || dmg <= 0) return; b.hp -= dmg; if (b.hp <= 0) this.destroy(b, why); },
    tick(dt) {
      if (!this.S) return;
      // others: their boats on their plots, or sailing
      this.drawOthers();
      if (this.disc) this.disc.rotation.z += dt * 1.6;
      const B = this.sail;
      if (!B) { this.updatePlotSwap(); if (P.y < -2 && !P.dead) { respawn(); sfx('splash'); } return; }
      if (P.dead) { this.endRun('', true); return; } // reset (R): the boat goes back with you
      const n = Math.max(1, Math.ceil(dt / (1 / 90)));
      for (let i = 0; i < n; i++) this.step(dt / n);
      this.hazards(dt);
      // the run's progress
      const s = stageAt(B.z);
      if (s > B.best) {
        B.best = s;
        const g = 10 * s;
        this.S.gold += g; B.gold += g; earn(2);
        toast(`Stage ${s + 1} · ${STAGES[s]} · +${g} gold`, '#fde68a'); sfx('reward');
        if (s > (this.S.best | 0)) { this.S.best = s; send({ best: s }); }
        this.save();
      }
      if (B.z < END_Z - 4 && !B.won) {
        B.won = true; this.S.gold += 300; this.S.tr = (this.S.tr | 0) + 1; this.S.best = 10; send({ best: 10 }); this.save();
        earn(40, 'found the treasure'); toast('🏆 TREASURE! +300 gold', '#fde68a'); sfx('win'); puffAt(P.x, P.y + 3, P.z, CONFETTI, 60);
        Net.chat('🏆 sailed all the way to the treasure!');
        setTimeout(() => { if (this.sail === B) this.endRun(''); }, 5000);
      }
      const alive = B.blocks.filter((b) => b.alive);
      if (!alive.length && !B.over) { B.over = true; setTimeout(() => this.sail === B && this.endRun(`💥 Your boat was smashed at stage ${B.best + 1}`), 1500); }
      if (B.sunkT > 2.5 && !B.over) { B.over = true; this.endRun(`🫧 Your boat sank at stage ${B.best + 1}`); return; }
      // standing up, sitting back down, falling in
      if (this.seated && (keys.Space || jumpHeld)) { this.seated = false; P.frozen = false; P.vy = 30; this.drawBar(); }
      const inWater = P.y < wl(P.z) - 1 && !P.frozen;
      this.swimT = inWater ? (this.swimT || 0) + dt : 0;
      if (this.swimT > 3 && !B.over) { B.over = true; this.endRun(`🌊 You fell in at stage ${B.best + 1}`); return; }
      if (performance.now() - (this.sentAt || 0) > 150) { this.sentAt = performance.now(); send({ bo: [+B.x.toFixed(1), +B.y.toFixed(1), +B.z.toFixed(1)] }); }
    },
    step(dt) {
      const B = this.sail, alive = B.blocks.filter((b) => b.alive);
      if (!alive.length) return;
      const G = 40, surf = wl(B.z);
      let lift = 0, mass = 0, sub = 0, motors = 0;
      for (const b of alive) {
        const T = BLK[b.t], bottom = B.y + b.lc[1] - 1, f = clamp((surf - bottom) / 2, 0, 1);
        if (f > 0 && !b.wasIn && B.vy < -16) this.hurtBlock(b, (-B.vy - 16) * 3, 'splash'); // a hard landing
        b.wasIn = f > 0;
        lift += f - T.d; mass += Math.max(T.d, 0.3); sub += f;
        if (b.t === MOTOR) motors++;
      }
      const inW = sub > 0;
      let ax = 0, az = 0, ay = (G * lift) / mass;
      ay -= B.vy * (inW ? 2.4 : 0.15);
      const s = stageAt(B.z), cur = 6 + s * 0.6;
      if (inW) { az += (-cur - B.vz) * 0.8; ax += -B.vx * 0.9; }
      else { ax += -B.vx * 0.3; az += -B.vz * 0.3; }
      if (this.seated) {
        const steer = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
        ax += steer * (13 + motors * 3);
        if (keys.KeyW || keys.ArrowUp || joy.y < -0.4) az -= motors ? (4 + motors * 5) / Math.sqrt(mass / 20) : 2;
        if (keys.KeyS || keys.ArrowDown || joy.y > 0.4) az += 4;
      }
      // the whirlpool pulls you round and in
      if (this.whirl) { const dx = B.x - this.whirl[0], dz = B.z - this.whirl[1], d = Math.hypot(dx, dz); if (d < 24 && inW) { ax += (-dx / d * 7 + dz / d * 9) / (1 + d / 12); az += (-dz / d * 7 - dx / d * 9) / (1 + d / 12); } }
      B.vx += ax * dt; B.vy += ay * dt; B.vz += az * dt;
      if (B.y > surf + 10) B.vy = Math.min(B.vy, 0); // balloons can lift you, but not out of the canyon
      B.x += B.vx * dt; B.y += B.vy * dt; B.z += B.vz * dt;
      B.sunkT = sub >= alive.length - 0.01 && B.vy < 0.5 && lift < 0 ? (B.sunkT || 0) + dt : 0;
      this.collide(alive);
    },
    // blocks hitting rocks, walls, logs, ice and the riverbed: push the boat out, and the block takes damage
    collide(alive) {
      const B = this.sail;
      for (const o of this.obs) {
        if (Math.abs(o.z - B.z) > o.sz / 2 + 24) continue;
        const ob = boxOf(o);
        for (const b of alive) {
          if (!b.alive) continue;
          const cx = B.x + b.lc[0], cy = B.y + b.lc[1], cz = B.z + b.lc[2];
          if (cx + 1 <= ob[0] || cx - 1 >= ob[3] || cy + 1 <= ob[1] || cy - 1 >= ob[4] || cz + 1 <= ob[2] || cz - 1 >= ob[5]) continue;
          const px = Math.min(cx + 1 - ob[0], ob[3] - (cx - 1)), py = Math.min(cy + 1 - ob[1], ob[4] - (cy - 1)), pz = Math.min(cz + 1 - ob[2], ob[5] - (cz - 1));
          let hit = 0;
          if (py <= px && py <= pz) { const up = cy > (ob[1] + ob[4]) / 2; B.y += up ? py : -py; hit = Math.abs(B.vy); B.vy = up ? Math.max(0, B.vy) : Math.min(0, B.vy); }
          else if (px <= pz) { const right = cx > (ob[0] + ob[3]) / 2; B.x += right ? px : -px; hit = Math.abs(B.vx - (o.dx || 0) / 0.016); B.vx = (right ? 1 : -1) * Math.abs(B.vx) * 0.3; }
          else { const back = cz > (ob[2] + ob[5]) / 2; B.z += back ? pz : -pz; hit = Math.abs(B.vz); B.vz = (back ? 1 : -1) * Math.abs(B.vz) * 0.3; }
          if (o.obs > 0 && hit > 3) { this.hurtBlock(b, (hit - 3) * 9 * o.obs, 'crash'); if (performance.now() - (this.bumpAt || 0) > 250) { this.bumpAt = performance.now(); sfx('hit', { vol: 0.5 }); } }
        }
      }
    },
    // cannonballs in Cannon Cove, lava drops in the Lava Gorge
    hazards(dt) {
      const B = this.sail, s = stageAt(B.z), now = performance.now();
      if (s === 7 && now - (this.cannonAt || 0) > 1100) {
        this.cannonAt = now;
        const cs = parts.filter((p) => p.cannon && Math.abs(p.z - B.z) < 35);
        const c = cs[Math.floor(Math.random() * cs.length)];
        if (c) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), new THREE.MeshLambertMaterial({ color: 0x111111 })); m.position.set(c.x, c.y + 1, c.z); scene.add(m); this.fx.push({ m, v: [-c.cannon * 34, 0, 0], k: 'ball' }); sfx3('cannon', c.x, c.z, 80); puffAt(c.x - c.cannon * 2, c.y + 1, c.z, [0x9ca3af, 0xfbbf24], 6); }
      }
      if (s === 8 && now - (this.lavaAt || 0) > 700) {
        this.lavaAt = now;
        const x = clamp(B.x + (Math.random() - 0.5) * 20, -26, 26), z = B.z + B.vz * 1.2 + (Math.random() - 0.5) * 14, y = wl(z);
        const ring = new THREE.Mesh(new THREE.RingGeometry(2, 2.6, 24), new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; ring.position.set(x, y + 0.2, z); scene.add(ring);
        const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff6a00 })); m.position.set(x, y + 40, z); scene.add(m);
        this.fx.push({ m, ring, v: [0, -32, 0], k: 'lava' });
      }
      for (let i = this.fx.length - 1; i >= 0; i--) {
        const f = this.fx[i], m = f.m;
        m.position.x += f.v[0] * dt; m.position.y += f.v[1] * dt; m.position.z += f.v[2] * dt;
        if (f.k === 'lava' && Math.random() < dt * 20) puffAt(m.position.x, m.position.y + 1, m.position.z, [0xff6a00, 0xfbbf24], 1);
        let gone = Math.abs(m.position.x) > 34 || m.position.y < wl(m.position.z) - 1;
        for (const b of B.blocks) {
          if (!b.alive) continue;
          const cx = B.x + b.lc[0], cy = B.y + b.lc[1], cz = B.z + b.lc[2];
          if (Math.abs(m.position.x - cx) < 1.9 && Math.abs(m.position.y - cy) < 1.9 && Math.abs(m.position.z - cz) < 1.9) { this.hurtBlock(b, f.k === 'ball' ? 160 : 140, 'boom'); gone = true; }
        }
        if (gone) {
          if (f.k === 'lava') { puffAt(m.position.x, m.position.y, m.position.z, [0xff6a00, 0xfbbf24, 0x7f1d1d], 10); sfx3('hiss', m.position.x, m.position.z, 50); }
          scene.remove(m); if (f.ring) scene.remove(f.ring); this.fx.splice(i, 1);
        }
      }
    },
    prompts() {
      const B = this.sail;
      if (!B || this.seated) return [];
      const seat = B.blocks.find((b) => b.alive && b.t === SEAT);
      return seat ? [{ x: B.x + seat.lc[0], z: B.z + seat.lc[2], r: 5, text: '💺 Sit and steer', fn: () => this.sit() }] : [];
    },

    /* ---- everyone else's boats ---- */
    dropOthers() { for (const o of this.others.values()) this.dropOther(o); this.others = new Map(); },
    dropOther(o) { const old = new Set(o.parts); removeParts((q) => old.has(q)); if (o.g) scene.remove(o.g); if (o.lab) place.remove(o.lab); },
    drawOthers() {
      const seen = new Set();
      for (const p of Net.peers) {
        if (p.isMe || !p.presence || !(p.presence.pl >= 0)) continue;
        const pr = p.presence, pl = clamp(pr.pl | 0, 0, PLOTS.length - 1), bd = String(pr.bd || ''), sailing = Array.isArray(pr.bo);
        seen.add(p.peer);
        let o = this.others.get(p.peer);
        if (!o || o.bd !== bd || o.pl !== pl || o.sailing !== sailing) {
          if (o) this.dropOther(o);
          o = { bd, pl, sailing, parts: [], g: null, lab: null };
          const list = dec(bd);
          if (!sailing) for (const b of list) { const [x, y, z] = cellPos(PLOTS[pl], b.i, b.j, b.k), T = BLK[b.t]; o.parts.push(part({ x, y, z, sx: 2, sy: 2, sz: 2, c: T.c, alpha: T.alpha, plain: !!T.alpha })); }
          else {
            o.g = new THREE.Group(); const kmin = Math.min(...list.map((b) => b.k));
            for (const b of list) { const T = BLK[b.t], m = new THREE.Mesh(BOX, new THREE.MeshLambertMaterial({ color: T.c, map: tex(1, 1), transparent: !!T.alpha, opacity: T.alpha || 1 })); m.scale.setScalar(2); m.position.set(2 * b.i - 7, 2 * (b.k - kmin) + 1, 2 * b.j - 7); o.g.add(m); }
            scene.add(o.g);
          }
          o.lab = label(`${String(pr.nm || 'Player').slice(0, 20)}’s boat`, { size: 1.2 }); o.lab.position.set(PLOTS[pl], DOCK + 18, PZ - 9); place.add(o.lab);
          this.others.set(p.peer, o);
        }
        if (o.g && sailing) { const [x, y, z] = pr.bo; o.g.position.x += (x - o.g.position.x) * 0.25; o.g.position.y += (y - o.g.position.y) * 0.25; o.g.position.z += (z - o.g.position.z) * 0.25; if (Math.abs(z - o.g.position.z) > 30) o.g.position.set(x, y, z); }
      }
      for (const [peer, o] of this.others) if (!seen.has(peer)) { this.dropOther(o); this.others.delete(peer); }
    },
    // two people on the same plot: whoever came later moves
    updatePlotSwap() {
      if (performance.now() - (this.plotChk || 0) < 1500) return;
      this.plotChk = performance.now();
      const mine = (Net.peers.find((p) => p.isMe) || {}).presence || {};
      const clash = Net.peers.find((p) => !p.isMe && p.presence && (p.presence.pl | 0) === this.pl && p.presence.pl >= 0 && ((+p.presence.t || 0) < (+mine.t || 0) || ((+p.presence.t || 0) === (+mine.t || 0) && p.peer < myPeer())));
      if (clash) { this.pickPlot(); this.drawBuild(); respawn(true); toast('You moved to a free plot', '#bae6fd'); }
    },
    statOf(pr, isMe) { const b = isMe ? (this.S ? this.S.best | 0 : 0) : pr.best | 0; return b >= 10 ? '🏆' : b ? `Stage ${b + 1}` : '—'; },
    sortKey(pr, isMe) { return isMe ? (this.S ? this.S.best | 0 : 0) : pr.best | 0; },
    hud() {
      if (!this.S) return '';
      const B = this.sail;
      if (B) {
        const alive = B.blocks.filter((b) => b.alive).length, s = stageAt(B.z);
        return `⛵ Stage <b>${s + 1}/10</b> · ${STAGES[s]} · 🧱 ${alive}/${B.blocks.length} · 💰 +${B.gold}${this.seated ? '' : ' · <span style="color:#fde68a">Press E at your seat to steer</span>'}`;
      }
      return `💰 <b>${this.S.gold}</b> gold · 🧱 ${this.design.length} blocks · ${this.del ? '🔨 Click blocks to remove' : `${BLK[this.sel].e} Click your plot to build`} · best ${this.S.best >= 10 ? '🏆' : `stage ${(this.S.best | 0) + 1}`}`;
    },
  };
  addExp(BB);
  window.__rbBB = BB;
})();
