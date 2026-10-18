/* =====================================================================
   BLOXVERSE — BEE SWARM SIMULATOR. Your bees follow you; walk into a
   flower field and they fly off to the flowers and bring back pollen
   (your tool collects some too: click). When your bag is full, take it
   to the hive and make honey (E). Honey buys bigger bags, better tools
   and eggs that hatch more bees. More bees open more fields, and the
   fields further out pay more. Everything you have is saved.
   ===================================================================== */
(() => {
  const TS = 5, FW = 10, FD = 8; // tile size; tiles across and down each field
  const FIELDS = [
    { n: '🌻 Sunflower Field', x: 0, z: -34, cols: [0xfef3c7, 0xfde047], col: 'white', mult: 1, need: 0 },
    { n: '🍀 Clover Field', x: -62, z: -34, cols: [0x93c5fd, 0x3b82f6], col: 'blue', mult: 2.2, need: 5 },
    { n: '🌹 Rose Field', x: 62, z: -34, cols: [0xfca5a5, 0xef4444], col: 'red', mult: 4.5, need: 10 },
  ];
  // bees: what they bring back each trip, how long a trip takes, what colour they like (×2 there), how likely from an egg
  const BEES = [
    { n: 'Basic Bee', e: '🐝', amt: 10, t: 4, c: 0xfacc15, w: 50 },
    { n: 'Hasty Bee', e: '⚡', amt: 10, t: 2.6, c: 0xfde68a, w: 15 },
    { n: 'Brave Bee', e: '💪', amt: 18, t: 4, c: 0xf97316, w: 12 },
    { n: 'Cool Bee', e: '💙', amt: 13, t: 3.4, c: 0x60a5fa, likes: 'blue', w: 8 },
    { n: 'Rad Bee', e: '❤️', amt: 13, t: 3.4, c: 0xf87171, likes: 'red', w: 8 },
    { n: 'Bomber Bee', e: '💣', amt: 9, t: 3.2, c: 0x6b7280, splash: 1, w: 5 },
    { n: 'Lion Bee', e: '🦁', amt: 40, t: 3.5, c: 0xd97706, w: 2 },
  ];
  const BAGS = [['👝 Pouch', 200, 0], ['🫙 Jar', 750, 300], ['🎒 Backpack', 2500, 1500], ['🛢️ Canister', 8000, 6000], ['🏺 Porcelain Port-O-Hive', 25000, 25000], ['🥥 Coconut Canister', 80000, 90000]];
  // tools: [name, pollen per flower, reach, swings a second, price]
  const TOOLS = [['🥄 Scooper', 2, 3, 2, 0], ['🧹 Rake', 5, 4, 2, 400], ['✂️ Clippers', 12, 4, 2.5, 2000], ['🌀 Vacuum', 20, 6, 3, 8000], ['💎 Super Scooper', 50, 7, 3, 30000]];
  const MAX_BEES = 25, GIFT = 0.04;
  const eggPrice = (n) => Math.round(100 * 1.45 ** n / 10) * 10;
  const short = (n) => (n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M' : n >= 1e4 ? Math.round(n / 1e3) + 'K' : Math.floor(n).toLocaleString('en-US'));
  const HIVE = [0, 36], PAD = [0, 24], EGGS = [-26, 22], BAGSHOP = [26, 22], TOOLSHOP = [40, 4];

  function beeMesh(c, gifted) {
    const g = new THREE.Group(), L = (col) => new THREE.MeshLambertMaterial({ color: col });
    const body = new THREE.Mesh(BOX, L(c)); body.scale.set(0.7, 0.6, 0.9); g.add(body);
    const stripe = new THREE.Mesh(BOX, L(0x111827)); stripe.scale.set(0.72, 0.62, 0.2); stripe.position.z = 0.1; g.add(stripe);
    const wm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
    const wings = [-1, 1].map((s) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.35), wm); w.position.set(s * 0.45, 0.35, 0); w.rotation.x = -Math.PI / 2; g.add(w); return w; });
    if (gifted) { const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshBasicMaterial({ color: 0xfde047 })); star.position.y = 0.6; g.add(star); }
    g.userData.wings = wings; g.scale.setScalar(1.7);
    return g;
  }
  function toolMesh(k) {
    const g = new THREE.Group(), L = (c) => new THREE.MeshLambertMaterial({ color: c });
    const stick = new THREE.Mesh(BOX, L(0x92400e)); stick.scale.set(0.15, 0.15, 2.2); stick.position.z = -1.1; g.add(stick);
    const head = new THREE.Mesh(BOX, L([0x9ca3af, 0x16a34a, 0xdc2626, 0x7c3aed, 0x22d3ee][k] || 0x9ca3af)); head.scale.set(k === 1 ? 1.2 : 0.7, 0.2, 0.7); head.position.set(0, 0, -2.3); g.add(head);
    return g;
  }

  const BS = {
    id: 'bee', code: 'bs', genre: 'Simulator', rank: 0.03, name: 'Bee Swarm Simulator', emoji: '🐝', max: 10, stat: 'Honey', killY: -30, camDist: 20,
    color: 'linear-gradient(135deg,#facc15,#f59e0b 55%,#78350f)',
    desc: 'Grow a swarm of bees! Walk into a flower field and your bees collect pollen (click to collect some yourself). When your bag’s full, make honey at the hive. Spend honey on bigger bags, better tools and eggs that hatch new bees — more bees open the Clover and Rose fields. Your hive is saved.',
    welcome: 'Walk into the Sunflower Field — your bees will collect pollen. Then make honey at the hive!',
    build() {
      sky('#7dd3fc', '#fef9c3');
      slab(0, 0, 0, 230, 150, 0x84cc16, { sy: 2 });
      // the fields: tiles of flowers, each with its own pollen
      this.tiles = [];
      FIELDS.forEach((F, f) => {
        slab(F.x, 0.3, F.z, FW * TS + 2, FD * TS + 2, 0x65a30d, { sy: 0.6 });
        for (let j = 0; j < FD; j++) for (let i = 0; i < FW; i++) {
          const x = F.x - (FW * TS) / 2 + (i + 0.5) * TS, z = F.z - (FD * TS) / 2 + (j + 0.5) * TS;
          const p = part({ x, y: 0.36, z, sx: TS - 0.3, sy: 0.12, sz: TS - 0.3, c: F.cols[(i + j) % 2], solid: false });
          this.tiles.push({ f, x, z, p, pol: 1, base: new THREE.Color(F.cols[(i + j) % 2]) });
        }
        const sg = label(`${F.n}${F.need ? `\n🐝 ${F.need} bees` : ''}`, { size: 2.2, color: '#fff' }); sg.position.set(F.x, 7, F.z + (FD * TS) / 2 + 4); place.add(sg);
        // a locked field has a fence round it
        if (F.need) F.fence = [[0, -(FD * TS) / 2 - 1, FW * TS + 4, 1], [0, (FD * TS) / 2 + 1, FW * TS + 4, 1], [-(FW * TS) / 2 - 1, 0, 1, FD * TS + 4], [(FW * TS) / 2 + 1, 0, 1, FD * TS + 4]]
          .map(([x, z, sx, sz]) => part({ x: F.x + x, y: 2, z: F.z + z, sx, sy: 4, sz, c: 0xfde68a, alpha: 0.45, plain: true }));
      });
      // the hive, its honey pad, the egg machine and the shops
      for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) part({ x: HIVE[0] - 9 + c * 3 + (r % 2) * 1.5, y: 2 + r * 2.6, z: HIVE[1], sx: 2.6, sy: 2.4, sz: 2.4, c: (r + c) % 3 ? 0xf59e0b : 0xfbbf24 });
      part({ x: HIVE[0], y: 12.6, z: HIVE[1], sx: 24, sy: 1.4, sz: 3, c: 0x92400e });
      part({ x: PAD[0], y: 0.06, z: PAD[1], sx: 8, sy: 0.12, sz: 6, c: 0xfacc15, neon: true, solid: false });
      const machine = (x, z, c, text) => { part({ x, y: 2.5, z, sx: 5, sy: 5, sz: 4, c }); part({ x, y: 0.06, z: z - 3.5, sx: 4, sy: 0.12, sz: 3, c: 0xffffff, neon: true, solid: false }); const lb = label(text, { size: 1.6 }); lb.position.set(x, 7, z); place.add(lb); };
      machine(EGGS[0], EGGS[1], 0xfef3c7, '🥚 Egg Machine'); machine(BAGSHOP[0], BAGSHOP[1], 0x7c3aed, '🎒 Bag Shop'); machine(TOOLSHOP[0], TOOLSHOP[1], 0x0ea5e9, '🧹 Tool Shop');
      const hl = label('🍯 THE HIVE\nmake honey here', { size: 2.2, color: '#fde68a' }); hl.position.set(HIVE[0], 16, HIVE[1]); place.add(hl);
    },
    pres() { return { bz: [0, 0] }; },
    async enter() {
      this.S = { honey: 0, pollen: 0, bag: 0, tool: 0, bees: [[0, 0], [0, 0]], eggs: 0, made: 0 };
      const s = await kvGet('bee');
      if (s && typeof s === 'object') {
        const S = this.S;
        S.honey = Math.max(0, +s.honey || 0); S.pollen = Math.max(0, +s.pollen || 0); S.bag = clamp(s.bag | 0, 0, BAGS.length - 1); S.tool = clamp(s.tool | 0, 0, TOOLS.length - 1);
        S.eggs = Math.max(0, s.eggs | 0); S.made = Math.max(0, +s.made || 0);
        if (Array.isArray(s.bees) && s.bees.length) S.bees = s.bees.slice(0, MAX_BEES).map((b) => [clamp(b[0] | 0, 0, BEES.length - 1), b[1] ? 1 : 0]);
      }
      this.swarm = []; this.others = new Map(); this.held = new Map(); this.swingT = 0; this.toolCd = 0; this.making = false; this.saveAt = performance.now() + 10000; this.coinAcc = 0; this.gainShow = 0;
      for (const b of this.S.bees) this.addBee(b);
      this.fences();
      setBar('<button class="xslot" data-k="bees" title="Your bees (B)"><span class="k">B</span><span class="e">🐝</span>Bees</button>', () => this.beesPanel());
      send({ bz: [this.S.bees.length, Math.floor(this.S.honey)] });
    },
    leave() { for (const b of this.swarm) scene.remove(b.m); this.swarm = []; for (const s of this.others.values()) for (const b of s) scene.remove(b); this.others = new Map(); this.held = new Map(); return this.save(); },
    save() { return kvSet('bee', this.S); },
    spawn() { return [(Math.random() - 0.5) * 8, 0.5, 12, Math.PI]; },
    addBee(b) { const m = beeMesh(BEES[b[0]].c, b[1]); m.position.set(P.x, P.y + 4, P.z); scene.add(m); this.swarm.push({ type: b[0], gifted: b[1], m, st: 'idle', t: 0, a: Math.random() * 6.283, tile: null, x: P.x, y: P.y + 4, z: P.z }); },
    // open the fields you have enough bees for
    fences() { FIELDS.forEach((F) => { if (!F.fence) return; const open = this.S.bees.length >= F.need; for (const p of F.fence) { p.solid = !open; p.m.visible = !open; } }); },
    cap() { return BAGS[this.S.bag][1]; },
    fieldAt(x, z) { return FIELDS.findIndex((F) => Math.abs(x - F.x) < (FW * TS) / 2 && Math.abs(z - F.z) < (FD * TS) / 2); },
    open(f) { return f >= 0 && this.S.bees.length >= FIELDS[f].need; },
    // pollen from one flower: how much, by its field and how much it has left (it grows back)
    take(tile, amt, bite, likes) {
      const F = FIELDS[tile.f], room = this.cap() - this.S.pollen;
      if (room <= 0) return 0;
      const got = Math.min(room, amt * F.mult * (likes && likes === F.col ? 2 : 1) * (0.25 + 0.75 * tile.pol));
      tile.pol = Math.max(0, tile.pol - bite);
      this.S.pollen += got; this.gain = (this.gain || 0) + got;
      return got;
    },
    // the tool: a swing collects from the flowers round you
    swing() {
      if (this.toolCd > 0 || P.dead) return;
      const f = this.fieldAt(P.x, P.z), T = TOOLS[this.S.tool];
      this.toolCd = 1 / T[3]; this.swingT = 0.25;
      if (!this.open(f)) return;
      if (this.S.pollen >= this.cap()) { toast('🎒 Your bag is full — make honey at the hive!', '#fde68a'); return; }
      let got = 0;
      for (const t of this.tiles) if (t.f === f && Math.hypot(t.x - P.x, t.z - P.z) < T[2] + TS / 2) got += this.take(t, T[1], 0.3);
      if (got) { sfx('dig', { vol: 0.35, pitch: 1.3, gap: 120 }); puffAt(P.x - Math.sin(P.yaw) * 2, P.y + 0.6, P.z - Math.cos(P.yaw) * 2, FIELDS[f].cols, 4); }
    },
    click() { this.swing(); },
    key(code, down) { if (down && code === 'KeyB') { this.beesPanel(); return true; } },
    prompts() {
      const near = Math.hypot(P.x - PAD[0], P.z - PAD[1]) < 6;
      return [
        { x: PAD[0], z: PAD[1], r: 6, text: this.making ? 'Stop making honey' : this.S.pollen > 0 ? `Make honey (${short(this.S.pollen)} pollen)` : 'Make honey (bring pollen!)', fn: () => { this.making = !this.making && this.S.pollen > 0 && near; } },
        { x: EGGS[0], z: EGGS[1] - 3.5, r: 4.5, text: 'Egg Machine', fn: () => this.eggPanel() },
        { x: BAGSHOP[0], z: BAGSHOP[1] - 3.5, r: 4.5, text: 'Bag Shop', fn: () => this.shopPanel('bag') },
        { x: TOOLSHOP[0], z: TOOLSHOP[1] - 3.5, r: 4.5, text: 'Tool Shop', fn: () => this.shopPanel('tool') },
      ];
    },
    eggPanel() {
      const S = this.S, price = eggPrice(S.eggs), full = S.bees.length >= MAX_BEES, can = S.honey >= price && !full;
      const total = BEES.reduce((s, b) => s + b.w, 0);
      const html = `<div class="xp-row"><span>🥚 <b>Basic Egg</b><br><small style="color:var(--muted)">hatches a bee (sometimes a ⭐ gifted one: double pollen) · you have ${S.bees.length}/${MAX_BEES}</small></span><b>🍯 ${short(price)}</b></div>
        ${BEES.map((b) => `<div class="xp-row"><span>${b.e} ${esc(b.n)} <small style="color:var(--muted)">${b.amt} pollen / ${b.t}s${b.likes ? ` · ×2 on ${b.likes}` : ''}${b.splash ? ' · three flowers at once' : ''}</small></span><small>${Math.round(b.w / total * 100)}%</small></div>`).join('')}
        <button class="xp-btn green" data-egg="1" style="width:100%" ${can ? '' : 'disabled'}>${full ? 'Your hive is full' : can ? `Hatch an egg (🍯 ${short(price)})` : `Need 🍯 ${short(price - S.honey)} more honey`}</button>`;
      openPanel('🥚 Egg Machine', html, (b) => { if (b.dataset.egg) this.hatch(); });
    },
    hatch() {
      const S = this.S, price = eggPrice(S.eggs);
      if (S.honey < price || S.bees.length >= MAX_BEES) return;
      S.honey -= price; S.eggs++;
      const total = BEES.reduce((s, b) => s + b.w, 0); let r = Math.random() * total, k = 0;
      for (; k < BEES.length - 1; k++) { r -= BEES[k].w; if (r < 0) break; }
      const bee = [k, Math.random() < GIFT ? 1 : 0];
      S.bees.push(bee); this.addBee(bee); this.fences(); this.save();
      send({ bz: [S.bees.length, Math.floor(S.honey)] });
      const B = BEES[k];
      sfx(B.w <= 5 || bee[1] ? 'win' : 'egg'); puffAt(P.x, P.y + 3, P.z, B.w <= 5 || bee[1] ? CONFETTI : [B.c, 0xffffff], 30);
      toast(`${B.e} You hatched a ${bee[1] ? '⭐ Gifted ' : ''}${B.n}!`, '#fde68a');
      FIELDS.forEach((F) => { if (F.need && S.bees.length === F.need) say(`${F.n} is open now!`, '#86efac'); });
      this.eggPanel();
    },
    shopPanel(kind) {
      const S = this.S, list = kind === 'bag' ? BAGS : TOOLS, have = kind === 'bag' ? S.bag : S.tool;
      const html = list.map((it, k) => {
        const price = kind === 'bag' ? it[2] : it[4], info = kind === 'bag' ? `holds ${short(it[1])} pollen` : `${it[1]} pollen a flower · reach ${it[2]} · ${it[3]} swings/s`;
        const btn = k === have ? '<button class="xp-btn" disabled>Using</button>' : k < have ? '<button class="xp-btn" disabled>Owned</button>' : `<button class="xp-btn ${S.honey >= price && k === have + 1 ? 'green' : ''}" data-buy="${k}" ${S.honey >= price && k === have + 1 ? '' : 'disabled'}>🍯 ${short(price)}</button>`;
        return `<div class="xp-row"><span><b>${esc(it[0])}</b><br><small style="color:var(--muted)">${info}</small></span>${btn}</div>`;
      }).join('') + '<p class="xp-note">Each one is bought after the one before it.</p>';
      openPanel(kind === 'bag' ? '🎒 Bag Shop' : '🧹 Tool Shop', html, (b) => {
        const k = +b.dataset.buy; if (!(k > 0)) return;
        const price = kind === 'bag' ? BAGS[k][2] : TOOLS[k][4];
        if (S.honey < price) return;
        S.honey -= price; if (kind === 'bag') S.bag = k; else { S.tool = k; this.held = new Map(); }
        sfx('buy'); toast(`Got the ${(kind === 'bag' ? BAGS : TOOLS)[k][0]}!`, '#86efac'); this.save(); this.shopPanel(kind);
      });
    },
    beesPanel() {
      const S = this.S, groups = {};
      for (const b of S.bees) { const k = b[0] + (b[1] ? 'g' : ''); groups[k] = (groups[k] || 0) + 1; }
      const html = Object.entries(groups).sort((a, b) => parseInt(b[0]) - parseInt(a[0])).map(([k, n]) => { const B = BEES[parseInt(k)], g = k.endsWith('g'); return `<div class="xp-row"><span>${B.e} <b>${g ? '⭐ Gifted ' : ''}${esc(B.n)}</b><br><small style="color:var(--muted)">${B.amt * (g ? 2 : 1)} pollen every ${B.t}s${B.likes ? ` · ×2 on ${B.likes} flowers` : ''}</small></span><b>×${n}</b></div>`; }).join('')
        + `<p class="xp-note">${S.bees.length}/${MAX_BEES} bees · ${FIELDS.filter((F) => F.need > S.bees.length).map((F) => `${F.n} opens at ${F.need}`).join(' · ') || 'every field is open'}</p>`;
      openPanel('🐝 Your bees', html);
    },
    tick(dt) {
      const S = this.S; if (!S) return;
      const now = performance.now(), f = this.fieldAt(P.x, P.z), inField = this.open(f), full = S.pollen >= this.cap();
      this.toolCd = Math.max(0, this.toolCd - dt); this.swingT = Math.max(0, this.swingT - dt);
      // flowers grow their pollen back
      for (const t of this.tiles) { if (t.pol < 1) t.pol = Math.min(1, t.pol + dt * 0.12); const k = 0.35 + 0.65 * t.pol; if (Math.abs(k - (t.shownK || 0)) > 0.03) { t.shownK = k; t.p.m.material.color.copy(t.base).multiplyScalar(k); } }
      // the bees: round you, off to a flower, collecting, back
      const T = now / 1000;
      for (const b of this.swarm) {
        const B = BEES[b.type];
        let tx, ty, tz, sp = 20;
        if (b.st === 'idle') {
          b.a += dt * 1.6;
          tx = P.x + Math.cos(b.a) * 3.2; ty = P.y + 4 + Math.sin(T * 3 + b.a) * 0.5; tz = P.z + Math.sin(b.a) * 3.2;
          b.t -= dt;
          if (inField && !full && b.t <= 0) { const near = this.tiles.filter((t) => t.f === f && Math.hypot(t.x - P.x, t.z - P.z) < 14); if (near.length) { b.tile = near[Math.floor(Math.random() * near.length)]; b.st = 'go'; } }
        } else if (b.st === 'go') {
          tx = b.tile.x; ty = 1.4; tz = b.tile.z; sp = 24;
          if (Math.hypot(b.x - tx, b.z - tz) < 0.6) { b.st = 'gather'; b.t = B.t * 0.6; }
        } else if (b.st === 'gather') {
          tx = b.tile.x + Math.sin(T * 4 + b.a) * 0.5; ty = 1.2 + Math.abs(Math.sin(T * 6 + b.a)) * 0.4; tz = b.tile.z + Math.cos(T * 4 + b.a) * 0.5; sp = 6;
          b.t -= dt;
          if (b.t <= 0) {
            const amt = B.amt * (b.gifted ? 2 : 1);
            let got = this.take(b.tile, amt, 0.25, B.likes);
            if (B.splash) for (const t of this.tiles) if (t !== b.tile && t.f === b.tile.f && Math.hypot(t.x - b.tile.x, t.z - b.tile.z) < TS * 1.1) got += this.take(t, amt * 0.5, 0.15, B.likes);
            if (got) puffAt(b.x, b.y, b.z, FIELDS[b.tile.f].cols, 2);
            b.st = 'idle'; b.t = B.t * 0.4 + Math.random() * 0.5; b.tile = null;
          }
        }
        const dx = tx - b.x, dy = ty - b.y, dz = tz - b.z, d = Math.hypot(dx, dy, dz), step = Math.min(d, sp * dt * (d > 12 ? 2 : 1));
        if (d > 60) { b.x = tx; b.y = ty; b.z = tz; } else if (d > 1e-3) { b.x += dx / d * step; b.y += dy / d * step; b.z += dz / d * step; }
        b.m.position.set(b.x, b.y, b.z);
        if (Math.hypot(dx, dz) > 0.05) b.m.rotation.y = Math.atan2(-dx, -dz);
        for (const w of b.m.userData.wings) w.rotation.y = Math.sin(T * 40 + b.a) * 0.6;
      }
      // making honey at the hive
      if (this.making) {
        const onPad = Math.hypot(P.x - PAD[0], P.z - PAD[1]) < 6;
        if (!onPad || S.pollen <= 0) { if (onPad && S.pollen <= 0) { toast('🍯 All your pollen is honey now!', '#fde68a'); sfx('reward'); } this.making = false; }
        else {
          const rate = 120 + 40 * S.bees.length, n = Math.min(S.pollen, rate * dt);
          S.pollen -= n; S.honey += n; S.made += n;
          this.coinAcc += n / 1500; if (this.coinAcc >= 1) { earn(Math.floor(this.coinAcc)); this.coinAcc %= 1; }
          if (Math.random() < dt * 8) puffAt(PAD[0] + (Math.random() - 0.5) * 6, 1 + Math.random() * 3, PAD[1] + (Math.random() - 0.5) * 4, [0xfbbf24, 0xf59e0b], 1);
          if (Math.random() < dt * 3) sfx('coin', { vol: 0.2, pitch: 1.4, gap: 200 });
        }
      }
      if (full && inField && now > (this.fullAt || 0)) { this.fullAt = now + 6000; toast('🎒 Your bag is full — make honey at the hive!', '#fde68a'); sfx('error', { vol: 0.4 }); }
      // other players' swarms (just for show)
      for (const p of Net.peers) {
        if (p.isMe || !p.presence) continue;
        const a = Net.avatars.get(p.peer), n = Math.min(8, (p.presence.bz && p.presence.bz[0]) | 0);
        let list = this.others.get(p.peer); if (!list) { list = []; this.others.set(p.peer, list); }
        while (list.length < n) { const m = beeMesh(0xfacc15, 0); m.scale.setScalar(1.3); scene.add(m); list.push(m); }
        while (list.length > n) scene.remove(list.pop());
        if (a) list.forEach((m, k) => { const ang = T * 1.4 + k * 6.283 / n; m.position.set(a.g.position.x + Math.cos(ang) * 3, a.g.position.y + 4 + Math.sin(T * 3 + k) * 0.4, a.g.position.z + Math.sin(ang) * 3); m.rotation.y = -ang; });
      }
      for (const [peer, list] of this.others) if (!Net.peers.some((p) => p.peer === peer)) { for (const m of list) scene.remove(m); this.others.delete(peer); }
      // keep the others and the save up to date
      const bz = [S.bees.length, Math.floor(S.honey)];
      if (now - (this.sentAt || 0) > 1500 && bz.join() !== this.bzKey) { this.sentAt = now; this.bzKey = bz.join(); send({ bz }); }
      if (now > this.saveAt) { this.saveAt = now + 10000; this.save(); }
    },
    pose() {
      this.holdTool(me, 'me', this.swingT);
      for (const [peer, a] of Net.avatars) this.holdTool(a, peer, 0);
    },
    holdTool(a, key, swing) {
      if (!a || a.dead) return;
      let h = this.held.get(key);
      const k = key === 'me' ? this.S.tool : 0;
      if (!h || h.a !== a) { if (h && h.m.parent) h.m.parent.remove(h.m); h = { a, m: toolMesh(k) }; h.m.rotation.x = -Math.PI / 2 + 0.5; h.m.position.set(0, -1.9, 0); a.armR.add(h.m); this.held.set(key, h); }
      if (swing > 0) a.armR.rotation.x = 0.4 + Math.sin((1 - swing / 0.25) * Math.PI) * 1.4;
    },
    statOf(pr, isMe) { return '🍯 ' + short(isMe ? this.S.honey : (pr.bz && pr.bz[1]) || 0); },
    sortKey(pr, isMe) { return isMe ? this.S.honey : (pr.bz && pr.bz[1]) || 0; },
    hud() {
      const S = this.S; if (!S) return '';
      const f = this.fieldAt(P.x, P.z), cap = this.cap(), pct = Math.round(S.pollen / cap * 100);
      return `🍯 <b>${short(S.honey)}</b> honey · 🎒 ${short(S.pollen)}/${short(cap)}${pct >= 100 ? ' <b style="color:#fca5a5">FULL</b>' : ''} · 🐝 ${S.bees.length} bees${f >= 0 ? ` · ${FIELDS[f].n}${this.open(f) ? '' : ` 🔒 ${FIELDS[f].need} bees`}` : ''}${this.making ? ' · making honey…' : ''}`;
    },
  };
  addExp(BS);
  window.__rbBS = BS;
  window.__bee = { FIELDS, BEES, BAGS, TOOLS, PAD, EGGS, eggPrice }; // for tests
})();
