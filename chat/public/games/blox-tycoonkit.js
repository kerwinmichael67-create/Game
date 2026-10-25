/* =====================================================================
   BLOXVERSE — TYCOON KIT. What the tycoons share: four plots you claim
   by stepping on a pad; buy pads for the next two things on the list
   (what you own is saved as one bit each, in the order you buy them);
   things that make products, which ride a path to where they're sold
   and are worth double after every upgrader they pass; things that pay
   by themselves now and then (delivery scooters); decorations that add
   to every sale; rebirth for more cash for good; Blox Coins; a display
   case of rare finds that you can trade; and a little timing game.
   A tycoon is an experience object handed to tycoonKit(E), which fills
   in what E doesn't say itself. E brings its own look and its own thing
   to do through these (all optional):
     tyWorld()                 the world round the plots
     tyFloor(pl)               a plot's floor (a grey slab if not)
     tyBase(pl, add)           an owned plot's fixed things (a market…)
     tyItem(pl, it, i, add)    one thing that's been bought
     tyProd(pl, it, i)         a new product (an Object3D) from source i
                               (userData.vk: worth that many times more)
     tyUp(pl, pr, it, i)       a product just passed upgrader i
     tySold(pl, pr)            a product was sold (true: E took its mesh)
     tyAnim(pl, dt, t)         every frame, each owned plot
     tyTick(dt, t)             every frame
     tyHud() tyPrompts() tyEnter(saved) tySave() tyLeave() tyBuy(id)
     tyCase(pl, f)             a find's model in the display case
   Items: { n, price, kind } with kind 'src' (makes products: v, every,
   s = where on the path, drop = how high it falls from, batch), 'up'
   (s, mul), 'pay' (v, every), 'speed' (sp: the path's speed), 'deco'
   (bonus: more cash for every sale) or anything of the tycoon's own.
   And to make a tycoon play its own way: tyMult(pl) (more for every sale
   on a plot), tySpawn(pl, it, i) (false: that one doesn't come), tyFlow(pl)
   (for the cards: what each thing made is worth, as a share: how many come,
   at what price).
   Next to a pad, a card says what it gives you: E.prod (what's made, one
   of them: 'fish'), E.make ('Catches more fish'), and tyBoost(it, i) for a
   line of the tycoon's own; an item's say is shown on it too.
   An item's buy pad goes where it'll be built: pad: [lx, lz, top] (top:
   the floor there, 0.4 if not said), or, for a thing on the path, beside
   the path where it is; a faster belt's by the start of the belt (or at
   E.speedPad).
   ===================================================================== */
function tycoonKit(E) {
  const T = E.items, LAST = T.length - 1;
  const has = (b, i) => ((b >>> i) & 1) === 1;
  const RAR = [['Common', '#cbd5e1'], ['Uncommon', '#86efac'], ['Rare', '#60a5fa'], ['Epic', '#c084fc'], ['Legendary', '#fbbf24'], ['Mythical', '#f87171']];
  const FIND_BONUS = [0.01, 0.02, 0.04, 0.08, 0.15, 0.3], FIND_CAP = 1, CASE_MAX = 8, KEEP_MAX = 40;
  const key = E.saveKey || E.code, noun = E.noun || 'Tycoon'; // (where it's saved: not "key", that's the keyboard hook)
  const PLOT_COLS = [0x3b82f6, 0xef4444, 0x22c55e, 0xf59e0b], PLOT_NAMES = ['Blue', 'Red', 'Green', 'Yellow'];
  const bonusOf = (b) => T.reduce((s, it, i) => s + (it.bonus && has(b, i) ? it.bonus : 0), 0);
  // the path the products ride: straight bits, one after the other
  const path = (() => {
    const pts = E.path || [[-21, -12], [16.5, -12]], segs = []; let L = 0;
    for (let i = 1; i < pts.length; i++) { const [x0, z0] = pts[i - 1], [x1, z1] = pts[i], len = Math.hypot(x1 - x0, z1 - z0); segs.push({ x0, z0, x1, z1, len, s0: L, dx: (x1 - x0) / len, dz: (z1 - z0) / len }); L += len; }
    return { pts, segs, L };
  })();
  const pathAt = (s) => { const g = path.segs.find((q) => s <= q.s0 + q.len) || path.segs[path.segs.length - 1], d = clamp(s - g.s0, 0, g.len); return [g.x0 + g.dx * d, g.z0 + g.dz * d, g]; };
  // how far along the path is the nearest point to (lx, lz)
  const sNear = (lx, lz) => { let best = 0, bd = 1e9; for (const g of path.segs) { const d = clamp((lx - g.x0) * g.dx + (lz - g.z0) * g.dz, 0, g.len), e = Math.hypot(g.x0 + g.dx * d - lx, g.z0 + g.dz * d - lz); if (e < bd) { bd = e; best = g.s0 + d; } } return best; };
  for (const it of T) if (it.at && it.s == null) it.s = sNear(it.at[0], it.at[1]);
  // where each thing's buy pad goes: [lx, lz, the floor's top, and which way to move it if another pad's there]
  const PAD = 3.6, FLOOR = 0.4;
  const beside = (s) => {
    const [x, z, g] = pathAt(s); let nx = -g.dz, nz = g.dx;
    if (-x * nx - z * nz < 0) { nx = -nx; nz = -nz; } // (the side towards the middle of the plot: where you walk)
    return [x + nx * 5, z + nz * 5, FLOOR, nx, nz];
  };
  const start = T[0].s != null ? beside(T[0].s) : null; // (the first thing's always yours: its spot's free)
  for (const it of T) {
    if (it.pad) { const [x, z, top] = it.pad, d = Math.hypot(x, z) || 1; it.spot = [x, z, top != null ? top : FLOOR, -x / d, -z / d]; }
    else if (it.kind === 'speed' && (E.speedPad || start)) it.spot = E.speedPad ? [E.speedPad[0], E.speedPad[1], FLOOR, 0, 1] : start;
    else if (it.s != null) it.spot = beside(it.s);
  }
  if (!document.getElementById('tyCss')) {
    const st = document.createElement('style'); st.id = 'tyCss';
    st.textContent = `.tyTime{position:absolute;left:50%;bottom:150px;transform:translateX(-50%);width:min(420px,86vw);background:rgba(15,23,42,.82);border:2px solid rgba(255,255,255,.2);border-radius:16px;padding:10px 14px 12px;text-align:center;color:#fff;pointer-events:auto;font-weight:800}
.tyTime .tt{font-size:17px;margin-bottom:8px}.tyTime .bar{position:relative;height:26px;border-radius:13px;background:#334155;overflow:hidden}
.tyTime .zone{position:absolute;top:0;bottom:0;background:#22c55e}.tyTime .sweet{position:absolute;top:0;bottom:0;background:#fde047}
.tyTime b{position:absolute;top:-3px;bottom:-3px;width:6px;margin-left:-3px;background:#fff;border-radius:3px;box-shadow:0 0 8px #fff}
.tyTime .tybtn{margin-top:10px;font:inherit;font-size:18px;padding:10px 28px;border-radius:12px;border:0;background:#f97316;color:#fff;cursor:pointer;box-shadow:0 4px 0 #c2410c}
@media (max-width:640px){.tyTime{bottom:190px}}`;
    document.head.append(st);
  }

  const kit = {
    max: 4, stat: 'Cash', killY: -40, genre: 'Tycoon',
    build() {
      sky(...(E.skyCols || ['#6cb8ff', '#e3f4ff']));
      if (E.ground !== false) slab(0, 0, 0, 330, 330, E.ground || 0x4caf50, { sy: 2 });
      const at = E.plotsAt || [[-62, -62, 1], [62, -62, 1], [-62, 62, -1], [62, 62, -1]];
      this.plots = at.map(([ox, oz, fz], k) => {
        const pl = { k, ox, oz, fz, owner: null, b: 0, rb: 0, cash: 0, name: '', cl: [], prods: [], tm: {}, decor: [], anim: [], sign: null, shown: null, caseG: null };
        if (this.tyFloor) this.tyFloor(pl); else slab(ox, 0.4, oz, 48, 48, 0x6b7280, { sy: 0.4 });
        for (const [x, z, sx, sz] of [[0, -24, 48, 0.6], [0, 24, 48, 0.6], [-24, 0, 0.6, 48], [24, 0, 0.6, 48]]) part({ x: ox + x, y: 0.55, z: oz + z, sx, sy: 0.3, sz, c: PLOT_COLS[k], neon: true, solid: false });
        return pl;
      });
      if (this.tyWorld) this.tyWorld();
      for (const pl of this.plots) this.buildPlot(pl.k);
    },
    // a plot's own layout, its front towards fz (so all four look the same from the path in)
    W(pl, lx, lz) { return [pl.ox + lx, pl.oz + lz * pl.fz]; },
    // a model of the tycoon's own on a plot, mirrored with it
    deco(pl, obj, lx, y, lz) { const [x, z] = this.W(pl, lx, lz); obj.position.set(x, y, z); obj.scale.z *= pl.fz; place.add(obj); pl.decor.push(obj); return obj; },
    buildPlot(k) {
      const pl = this.plots[k];
      // (what's on its way along the path stays, unless someone else has the plot now)
      if (!pl.shown || pl.shown.owner !== pl.owner) { for (const c of pl.prods) place.remove(c.m); pl.prods = []; pl.tm = {}; }
      pl.shown = { owner: pl.owner, b: pl.b, rb: pl.rb }; pl.ups = null;
      removeParts((p) => p.plot === k);
      for (const d of pl.decor) place.remove(d); pl.decor = []; pl.anim = [];
      if (pl.sign) { place.remove(pl.sign); pl.sign.material.map.dispose(); }
      if (pl.caseG) { place.remove(pl.caseG); pl.caseG = null; pl.caseKey = null; }
      const add = (lx, top, lz, sx, sy, sz, c, o = {}) => { const [x, z] = this.W(pl, lx, lz); return part(Object.assign({ x, y: top - sy / 2, z, sx, sy, sz, c, plot: k }, o)); };
      const lab = (p, text, y) => { p.lab = label(text, { size: 1.1 }); p.lab.position.set(p.x, y, p.z); place.add(p.lab); };
      const [sx, sz] = this.W(pl, 0, 27);
      pl.sign = label(pl.owner ? `${pl.name}’s ${noun}${pl.rb ? ` 🔁${pl.rb}` : ''}` : `${PLOT_NAMES[k]} ${noun} — free!`, { size: 2.2, color: pl.owner ? '#fff' : '#d1fae5' }); pl.sign.position.set(sx, 9, sz); place.add(pl.sign);
      if (!pl.owner) {
        const p = add(0, 0.8, 21, 6, 0.4, 6, 0xffffff, { neon: true, kind: 'claim', solid: false });
        lab(p, 'Touch to claim!', 3.2);
        return;
      }
      const b = pl.b, top = E.beltTop || 2.4;
      // the path: a conveyor belt (or a walkway)
      if (E.belt !== false) {
        const sp = this.speedOf(b), col = sp >= (E.speed0 || 6) * 1.8 ? '#e879f9' : sp >= (E.speed0 || 6) * 1.35 ? '#22d3ee' : '#facc15';
        for (const g of path.segs) {
          const ax = Math.abs(g.dx) > 0.5, cx = (g.x0 + g.x1) / 2, cz = (g.z0 + g.z1) / 2, len = g.len + 4;
          add(cx, top, cz, ax ? len : 4, 2, ax ? 4 : len, 0xffffff, { stripes: col, conv: [g.dx * sp, g.dz * sp * pl.fz] });
        }
      }
      if (this.tyBase) this.tyBase(pl, add);
      T.forEach((it, i) => { if (has(b, i) && this.tyItem) this.tyItem(pl, it, i, add); });
      // buy pads: the next two things, each where it'll be built (moved along a bit if the other's there);
      // with everything bought, the rebirth
      const [px, pz] = E.padAt || [0, 6];
      const left = T.map((_, i) => i).filter((i) => !has(b, i)).slice(0, 2), used = [];
      left.forEach((i, n) => {
        const it = T[i]; let [lx, lz, top, ox, oz] = it.spot || [px + (n ? 6 : -6), pz, FLOOR, 0, 1];
        for (const [ux, uz, ut] of used) if (ut === top && Math.abs(ux - lx) < PAD + 0.6 && Math.abs(uz - lz) < PAD + 0.6) { lx += ox * (PAD + 1); lz += oz * (PAD + 1); }
        used.push([lx, lz, top]);
        const p = add(lx, top + 0.4, lz, PAD, 0.4, PAD, 0x22c55e, { neon: true, kind: 'buy', item: i, solid: false });
        lab(p, `${it.n}\n${money(it.price)}`, top + 3.2);
      });
      if (!left.length) { const p = add(px, 0.8, pz, 5, 0.4, 5, 0xa855f7, { neon: true, kind: 'rebirth', solid: false }); lab(p, `🔁 Rebirth\n×${(1 + 0.5 * (pl.rb + 1)).toFixed(1)} cash`, 3.8); }
      this.drawCase(pl);
    },
    // the display case: the plot owner's best finds
    drawCase(pl) {
      const ck = pl.owner ? pl.cl.join(',') : '';
      if (!E.caseAt || pl.caseKey === ck) return;
      pl.caseKey = ck;
      if (pl.caseG) place.remove(pl.caseG);
      if (!pl.owner) { pl.caseG = null; return; }
      const g = new THREE.Group(), [cx, cz] = E.caseAt;
      const stand = new THREE.Mesh(BOX, new THREE.MeshLambertMaterial({ color: 0x334155 })); stand.scale.set(9, 1, 3.4); stand.position.y = 0.9; g.add(stand);
      const glass = new THREE.Mesh(BOX, new THREE.MeshLambertMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.25, depthWrite: false })); glass.scale.set(9, 3.4, 3.4); glass.position.y = 3.1; g.add(glass);
      pl.cl.slice(0, CASE_MAX).forEach((f, n) => {
        const F = E.FINDS[f]; if (!F) return;
        const m = this.tyCase ? this.tyCase(pl, f) : (() => { const s = label(F.e, { size: 1.3, fit: false }); return s; })();
        m.position.set(-3.6 + (n % 4) * 2.4, 2.3 + Math.floor(n / 4) * 1.6, 0); m.userData.bob = n; g.add(m);
      });
      const t = label(`${E.caseName || '💎 Rare finds'}${pl.cl.length ? '' : '\n(none yet)'}`, { size: 0.8 }); t.position.y = 5.6; g.add(t);
      this.deco(pl, g, cx, 0.4, cz); pl.decor.pop(); pl.caseG = g;
    },
    speedOf(b) { let sp = E.speed0 || 6; T.forEach((it, i) => { if (it.kind === 'speed' && has(b, i)) sp = Math.max(sp, it.sp); }); return sp; },
    // cash for every sale: decorations, rebirths (and, for you, 2× Cash and your finds)
    mult(pl) { return (1 + bonusOf(pl.b)) * (1 + 0.5 * (pl.rb || 0)) * (pl.mine ? (hasItem('cash2') ? 2 : 1) * (1 + this.findBonus()) : 1) * (this.tyMult ? this.tyMult(pl) : 1); },
    findBonus() { return Math.min(FIND_CAP, (this.col || []).reduce((s, f) => s + (E.FINDS[f] ? (E.FINDS[f].bonus != null ? E.FINDS[f].bonus : FIND_BONUS[E.FINDS[f].r]) : 0), 0)); },
    pres() { return { pl: -1, cash: 0, b: 0, rb: 0, cl: [] }; },
    async enter() {
      this.cash = 0; this.b = 1; this.rb = 0; this.col = []; this.myPlot = null; this.ct = 0; this.buyCd = 0; this.earned = []; this.sentCash = -1; this.saveAt = performance.now() + 10000; this.btnAt = 0; this.rbAt = 0; this.tg = null;
      const s = await kvGet(key);
      if (s) { this.cash = Math.max(0, +s.cash || 0); this.b = (s.b | 0) | 1; this.rb = Math.max(0, s.rb | 0); this.col = (Array.isArray(s.col) ? s.col : []).map((f) => f | 0).filter((f) => E.FINDS && E.FINDS[f]).slice(0, KEEP_MAX); }
      send({ rb: this.rb, cl: this.bestFinds() });
      questMax(`${E.id}.rebirth`, this.rb); questMax(`${E.id}.buy`, T.filter((_, i) => i && has(this.b, i)).length);
      if (this.tyEnter) await this.tyEnter(s || {});
      this.peers();
    },
    leave() { if (this.tyLeave) this.tyLeave(); this.timingEnd(); return this.save(); },
    spawn() {
      if (this.myPlot == null) return E.spawn0 ? E.spawn0() : [0, 0.5, 4, 0];
      const pl = this.plots[this.myPlot], [x, z] = this.W(pl, 0, 16);
      return [x, 0.5, z, pl.fz > 0 ? 0 : Math.PI];
    },
    // who owns which plot: whoever claimed it first (by claim time)
    peers() {
      if (!this.plots) return;
      const claims = [];
      for (const p of Net.peers) { if (p.isMe || !p.presence || !p.presence.t) continue; const pr = p.presence; if (pr.pl >= 0 && pr.pl < this.plots.length) claims.push({ peer: p.peer, k: pr.pl | 0, ct: +pr.ct || 0, b: (pr.b | 0) | 1, rb: Math.max(0, pr.rb | 0), cash: +pr.cash || 0, cl: (Array.isArray(pr.cl) ? pr.cl : []).slice(0, CASE_MAX).map((f) => f | 0).filter((f) => E.FINDS && E.FINDS[f]), name: String(pr.nm || 'Player').slice(0, 20) }); }
      if (this.myPlot != null) claims.push({ peer: myPeer(), k: this.myPlot, ct: this.ct, b: this.b, rb: this.rb, cash: this.cash, cl: this.bestFinds(), name: Net.name, me: true });
      for (const pl of this.plots) {
        const c = claims.filter((x) => x.k === pl.k).sort((a, b) => a.ct - b.ct || (a.peer < b.peer ? -1 : 1))[0];
        pl.owner = c ? c.peer : null; pl.b = c ? c.b : 0; pl.rb = c ? c.rb : 0; pl.cash = c ? c.cash : 0; pl.name = c ? c.name : ''; pl.mine = !!(c && c.me); pl.cl = c ? c.cl : [];
        if (!pl.shown || pl.shown.owner !== pl.owner || pl.shown.b !== pl.b || pl.shown.rb !== pl.rb) this.buildPlot(pl.k); else this.drawCase(pl);
      }
      if (this.myPlot != null && !this.plots[this.myPlot].mine) { this.myPlot = null; send({ pl: -1 }); toast(`Someone else got that ${noun.toLowerCase()} first!`); }
    },
    claim(k) {
      this.myPlot = k; this.ct = Date.now();
      send({ pl: k, ct: this.ct, b: this.b, rb: this.rb, cash: Math.floor(this.cash), cl: this.bestFinds() });
      this.peers();
      toast(`It’s yours! The ${PLOT_NAMES[k]} ${noun}`, '#86efac'); puffAt(P.x, P.y + 2, P.z, CONFETTI, 30); sfx('unlock');
    },
    buy(i) {
      const it = T[i], now = performance.now(), still = this.onPad === i && now - this.onPadT < 400; // (still standing on it)
      this.onPad = i; this.onPadT = now;
      if (has(this.b, i) || now < this.buyCd) return;
      if (this.cash < it.price) { if (!still) { toast(`You need ${money(it.price - this.cash)} more`, '#fca5a5'); sfx('error', { gap: 600 }); } return; }
      this.buyCd = now + 700;
      this.cash -= it.price; this.b |= 1 << i;
      send({ b: this.b, cash: Math.floor(this.cash) }); this.peers(); this.save();
      toast(`${it.e ? it.e + ' ' : ''}Bought ${it.n}!${it.bonus ? ` +${Math.round(it.bonus * 100)}% cash` : ''}${it.say ? ' ' + it.say : ''}`, '#86efac'); puffAt(P.x, P.y + 2, P.z, 0x22c55e, 18); sfx('buy');
      quest(`${E.id}.buy`);
      if (i === LAST) { toast(`🏆 You finished the ${E.name}! Rebirth for more cash`, '#fde68a'); sfx('win'); puffAt(P.x, P.y + 4, P.z, CONFETTI, 80); Net.chat(`🏆 finished ${E.name}!`); }
    },
    rebirthReady() { return T.every((_, i) => has(this.b, i)); },
    // what a pad gives you, on a card when you're next to it: the cash a second it adds, with what you have now
    // (everything made is worth its source's value, times each upgrader, times the plot's bonuses)
    boostCard(i) {
      const it = T[i], pl = this.plots[this.myPlot], b = this.b, M = this.mult(pl), prod = E.prod || 'thing';
      const ups = T.reduce((m, u, k) => (u.kind === 'up' && has(b, k) ? m * (u.mul || 2) : m), 1);
      const flow = this.tyFlow ? this.tyFlow(pl) : 1, made = T.reduce((r, s, k) => (s.kind === 'src' && has(b, k) ? r + s.v * (s.batch || 1) / s.every : r), 0) * ups * M * flow;
      const paid = T.reduce((r, s, k) => (s.kind === 'pay' && has(b, k) ? r + s.v / s.every : r), 0) * M;
      const ps = (v) => `<span class="up">+${perSec(v)}</span>`, lines = [];
      if (it.kind === 'src') lines.push(`${E.make || 'Makes more to sell'} (${it.batch > 1 ? `${it.batch} at a time ` : ''}every ${it.every}s): ${ps(it.v * (it.batch || 1) / it.every * ups * M * flow)}`);
      else if (it.kind === 'up') lines.push(`×${it.mul || 2} for every ${prod} that goes past it: ${ps(made * ((it.mul || 2) - 1))}`);
      else if (it.kind === 'pay') lines.push(`Brings in ${money(it.v * M)} every ${it.every}s: ${ps(it.v / it.every * M)}`);
      else if (it.kind === 'speed') lines.push(`Everything moves faster: speed ${this.speedOf(b)} → <span class="up">${it.sp}</span>`);
      if (it.bonus) lines.push(`+${Math.round(it.bonus * 100)}% cash on every sale: ${ps((made + paid) * it.bonus / (1 + bonusOf(b)))}`);
      if (this.tyBoost) lines.push(this.tyBoost(it, i));
      if (it.say) lines.push(esc(it.say));
      return boostHtml(`${it.e ? it.e + ' ' : ''}${it.n}`, it.price, lines, it.price - this.cash);
    },
    rebirthCard() { return boostHtml('🔁 Rebirth', null, [`Every sale worth <span class="up">×${(1 + 0.5 * (this.rb + 1)).toFixed(1)}</span> for good (now ×${(1 + 0.5 * this.rb).toFixed(1)})`, `Your ${noun.toLowerCase()} and cash start again${E.FINDS ? `; you keep your ${E.caseShort ? E.caseShort.toLowerCase() : 'finds'}` : ''}`], null); },
    rebirthPanel() {
      const next = 1 + 0.5 * (this.rb + 1), got = T.filter((_, i) => has(this.b, i)).length, ready = got === T.length;
      const html = `<div class="xp-row"><span>✅ <b>×${next.toFixed(1)} cash for every sale</b>, for good<br><small style="color:var(--muted)">now ×${(1 + 0.5 * this.rb).toFixed(1)}, and it adds up with every rebirth</small></span></div>
        <div class="xp-row"><span>✅ <b>You keep your ${E.caseName ? E.caseName.replace(/^\S+\s/, '').toLowerCase() : 'rare finds'}</b></span></div>
        <div class="xp-row"><span>❌ <b>Your ${noun.toLowerCase()} and cash start again</b><br><small style="color:var(--muted)">back to the first thing and $0</small></span></div>
        ${ready ? `<button class="xp-btn purple" data-rb="1" style="width:100%">🔁 Rebirth ${this.rb + 1}</button>` : `<button class="xp-btn alt" disabled style="width:100%">Buy everything first: ${got} of ${T.length} bought</button>`}`;
      openPanel('🔁 Rebirth', html, (btn) => { if (btn.dataset.rb && this.rebirthReady()) { closePanel(); this.rebirth(); } });
    },
    rebirth() {
      if (T.some((_, i) => !has(this.b, i))) return;
      this.rb++; this.b = 1; this.cash = 0; this.tmReset = true; questMax(`${E.id}.rebirth`, this.rb);
      send({ b: this.b, rb: this.rb, cash: 0 }); this.peers(); this.save();
      toast(`🔁 Rebirth ${this.rb}! Every sale is worth ×${(1 + 0.5 * this.rb).toFixed(1)} now`, '#d8b4fe'); sfx('unlock'); puffAt(P.x, P.y + 3, P.z, CONFETTI, 60);
      Net.chat(`🔁 rebirthed their ${noun.toLowerCase()} (×${(1 + 0.5 * this.rb).toFixed(1)} cash)`);
    },
    touch(p) {
      if (p.kind === 'claim' && this.myPlot == null && !this.plots[p.plot].owner) this.claim(p.plot);
      else if (p.kind === 'buy' && p.plot === this.myPlot) this.buy(p.item);
      else if (p.kind === 'rebirth' && p.plot === this.myPlot && !panelOpen() && performance.now() > this.rbAt) { this.rbAt = performance.now() + 2500; this.rebirthPanel(); }
      else if (this.tyTouch) this.tyTouch(p);
    },
    // cash you earn (sales, the scooters, what you do yourself): counted for the rate, and now and then a Blox Coin
    // (extra: a catch, a crate, a tip… not counted in the rate, which is what the plot makes by itself)
    gain(v, x, z, extra) {
      this.cash += v; if (!extra) this.earned.push([performance.now(), v]); this.dirty = true;
      if (x != null) sfx3('coin', x, z, 50, { vol: 0.25, gap: 350, pitch: 1.3 });
      this.coinAcc = Math.min(3, (this.coinAcc || 0) + v / 1500);
      if (this.coinAcc >= 1 && performance.now() - (this.coinAt || 0) > 10000) { this.coinAt = performance.now(); earn(1); this.coinAcc -= 1; } // Blox Coins: one per $1,500, at most one every 10 seconds
    },
    rate() { const t = performance.now(); this.earned = this.earned.filter((e) => t - e[0] < 5000); return this.earned.reduce((s, e) => s + e[1], 0) / 5; },
    // what your plot makes in a while (for rewards that keep up as it grows)
    worth(sec, min) { return Math.max(min || 0, Math.round(this.rate() * sec)); },
    tick(dt) {
      const t = performance.now();
      if (t > (this.boostAt || 0)) { this.boostAt = t + 150; padBoost(this); }
      for (const pl of this.plots) { this.sim(pl, dt); if (pl.owner) { for (const f of pl.anim) f(dt, t); if (this.tyAnim) this.tyAnim(pl, dt, t); } if (pl.caseG) pl.caseG.children.forEach((m) => { if (m.userData.bob != null) { m.position.y += Math.sin(t / 500 + m.userData.bob) * 0.004; m.rotation.y += dt * 0.8; } }); }
      if (this.myPlot != null) {
        if (Math.floor(this.cash) !== this.sentCash && t - (this.cashAt || 0) > 1000) { this.cashAt = t; this.sentCash = Math.floor(this.cash); send({ cash: this.sentCash }); }
        if (t > this.saveAt) { this.saveAt = t + 10000; this.save(); }
        if (t > this.btnAt) { this.btnAt = t + 300; for (const p of parts) if (p.kind === 'buy' && p.plot === this.myPlot) p.m.material.color.set(this.cash >= T[p.item].price ? 0x22c55e : 0xef4444); }
      }
      if (this.tyTick) this.tyTick(dt, t);
      this.timingTick(dt);
    },
    sim(pl, dt) {
      if (!pl.owner) return;
      const b = pl.b, sp = this.speedOf(b), top = (E.beltTop || 2.4) + (E.prodLift != null ? E.prodLift : 0.5);
      if (pl.mine && this.tmReset) { this.tmReset = false; for (const c of pl.prods) place.remove(c.m); pl.prods = []; pl.tm = {}; }
      T.forEach((it, i) => {
        if ((it.kind !== 'src' && it.kind !== 'pay') || !has(b, i)) return;
        pl.tm[i] = (pl.tm[i] == null ? Math.random() * it.every : pl.tm[i]) - dt;
        if (pl.tm[i] > 0) return;
        pl.tm[i] += it.every;
        if (it.kind === 'pay') { if (pl.mine) { const v = it.v * this.mult(pl), [x, z] = this.W(pl, 0, 0); this.gain(v, x, z); } if (this.tyPay) this.tyPay(pl, it, i); return; }
        for (let n = 0; n < (it.batch || 1) && pl.prods.length < 120; n++) {
          if (this.tySpawn && this.tySpawn(pl, it, i) === false) continue;
          const m = this.tyProd(pl, it, i); place.add(m);
          pl.prods.push({ s: Math.max(0, it.s - n * 1.6), y: top + (it.drop != null ? it.drop : 6) + n * 0.8, v: it.v * (m.userData.vk || 1), up: 0, m, it: i }); // (vk: a rarer one, worth more)
        }
      });
      // the upgraders, in order along the path
      if (pl.upsB !== b || !pl.ups) { pl.upsB = b; pl.ups = []; T.forEach((it, i) => { if (it.kind === 'up' && has(b, i)) pl.ups.push(i); }); }
      for (let j = pl.prods.length - 1; j >= 0; j--) {
        const c = pl.prods[j];
        if (c.y > top) c.y = Math.max(top, c.y - 16 * dt); else c.s += sp * (E.walkK || 1) * dt;
        for (const i of pl.ups) { if (c.up & (1 << (i & 31))) continue; if (c.s >= T[i].s) { c.up |= 1 << (i & 31); c.v *= T[i].mul || 2; if (this.tyUp) this.tyUp(pl, c, T[i], i); } }
        if (c.s >= path.L) {
          pl.prods.splice(j, 1);
          if (pl.mine) { const [x, z] = this.W(pl, ...pathAt(path.L)); this.gain(c.v * this.mult(pl), x, z); }
          if (!(this.tySold && this.tySold(pl, c))) place.remove(c.m);
          continue;
        }
        const [lx, lz, g] = pathAt(c.s), [x, z] = this.W(pl, lx, lz);
        c.m.position.set(x, c.y, z); c.m.rotation.y = Math.atan2(-g.dz * pl.fz, g.dx);
      }
    },
    save() { if (this.dirty || this.myPlot != null) { this.dirty = false; return kvSet(key, Object.assign({ cash: Math.floor(this.cash), b: this.b, rb: this.rb, col: this.col }, this.tySave ? this.tySave() : {})); } },
    coinShop: [{ id: 'cash2', e: '💵', n: '2× Cash', d: 'Every sale is worth double, for good', price: 700, kind: 'pass' }, shopSpeed(200, 1.25), { id: 'crate', e: '💰', n: 'Cash Crate', d: 'A minute of your cash (at least $300), right now', price: 40, kind: 'now' }],
    shopCan(id) { return id === 'crate' && this.myPlot == null ? `Claim a ${noun.toLowerCase()} first` : this.tyShopCan ? this.tyShopCan(id) : ''; },
    onBuy(id) {
      if (id === 'crate') { const v = this.worth(60, 300); this.gain(v, null, null, true); this.save(); toast(`💰 +${money(v)}`, '#86efac'); puffAt(P.x, P.y + 2, P.z, 0x22c55e, 18); }
      else if (this.tyBuy) this.tyBuy(id);
    },
    statOf(pr, isMe) { return money(isMe ? this.cash : pr.cash); },
    sortKey(pr, isMe) { return isMe ? this.cash : +pr.cash || 0; },
    hud() {
      const rate = this.rate(), pl = this.myPlot != null ? this.plots[this.myPlot] : null, mult = pl ? this.mult(pl) : 1;
      const extra = this.tyHud ? this.tyHud() : '';
      return `💵 ${money(this.cash)}${rate ? ` <small>+$${rate < 10 ? rate.toFixed(1) : Math.round(rate).toLocaleString('en-US')}/s</small>` : ''}${mult > 1 ? ` · ×${mult.toFixed(2).replace(/\.?0+$/, '')} cash` : ''}${this.rb ? ` · 🔁 ${this.rb}` : ''}${this.myPlot == null ? ` · find a free ${noun.toLowerCase()}` : ''}${extra ? ' · ' + extra : ''}`;
    },
    prompts() { return this.tyPrompts ? this.tyPrompts() : []; },
    menu() { return E.FINDS ? [[`${E.caseName || '💎 Rare finds'} (${this.col.length})`, () => this.casePanel(), E.caseShort]] : []; },

    /* ---- rare finds: kept in your case, each adds a little to every sale; sell them or trade them ---- */
    bestFinds() { return (this.col || []).slice().sort((a, b) => E.FINDS[b].r - E.FINDS[a].r || b - a).slice(0, CASE_MAX); },
    findValue(f) { return Math.round(E.FINDS[f].v * (1 + 0.5 * this.rb)); },
    gotFind(f, how) {
      const F = E.FINDS[f]; if (!F) return;
      this.col.push(f);
      // too many: the cheapest one is sold
      if (this.col.length > KEEP_MAX) { const lo = this.col.reduce((m, x, i, a) => (E.FINDS[x].r < E.FINDS[a[m]].r ? i : m), 0), x = this.col.splice(lo, 1)[0]; this.gain(this.findValue(x), null, null, true); }
      this.dirty = true; this.save(); send({ cl: this.bestFinds() }); this.peers();
      quest(`${E.id}.find`); if (F.r >= 4) quest(`${E.id}.legend`);
      say(`${F.e} ${how || 'You found'} ${/^[AEIOU]/.test(RAR[F.r][0]) ? 'an' : 'a'} ${RAR[F.r][0]} ${F.n}! +${Math.round((F.bonus != null ? F.bonus : FIND_BONUS[F.r]) * 100)}% cash`, RAR[F.r][1]);
      sfx(F.r >= 3 ? 'win' : 'unlock'); puffAt(P.x, P.y + 2.5, P.z, F.r >= 3 ? CONFETTI : [0xffffff, 0x93c5fd], F.r >= 3 ? 40 : 14);
      if (F.r >= 4) Net.chat(`${F.e} found a ${RAR[F.r][0]} ${F.n}!`);
    },
    casePanel() {
      const list = this.col.map((f, i) => [f, i]).sort((a, b) => E.FINDS[b[0]].r - E.FINDS[a[0]].r);
      const row = ([f, i]) => { const F = E.FINDS[f]; return `<div class="xp-row"><span>${F.e} <b>${esc(F.n)}</b> <small style="color:${RAR[F.r][1]}">${RAR[F.r][0]}</small><br><small style="color:var(--muted)">+${Math.round((F.bonus != null ? F.bonus : FIND_BONUS[F.r]) * 100)}% cash while you keep it</small></span><button class="xp-btn" data-sell="${i}">Sell ${money(this.findValue(f))}</button></div>`; };
      const html = `<p style="margin:0 0 8px;color:var(--muted)">${esc(E.findHow || 'Rare finds')} Each one you keep adds to every sale (up to +${FIND_CAP * 100}%: now <b>+${Math.round(this.findBonus() * 100)}%</b>). Trade them with other players from the 🤝 Trade menu.</p>${list.length ? list.map(row).join('') : '<p>Nothing yet.</p>'}`;
      openPanel(`${E.caseName || '💎 Rare finds'}`, html, (btn) => {
        if (btn.dataset.sell == null) return;
        const i = +btn.dataset.sell, f = this.col[i]; if (f == null) return;
        this.col.splice(i, 1); this.gain(this.findValue(f), null, null, true); this.dirty = true; this.save(); send({ cl: this.bestFinds() }); this.peers();
        sfx('coin'); toast(`Sold for ${money(this.findValue(f))}`, '#86efac'); this.casePanel();
      });
    },
    tradeItems() { return E.FINDS ? this.col.map((f, i) => ({ k: trKey(i, f), e: E.FINDS[f].e, n: `${E.FINDS[f].n} (${RAR[E.FINDS[f].r][0]})`, d: f })) : []; },
    tradeTake(k) { const i = trFind(this.col, k); if (i >= 0) { this.col.splice(i, 1); this.dirty = true; this.save(); send({ cl: this.bestFinds() }); this.peers(); } },
    tradeGive(d) { const f = d | 0; if (!E.FINDS || !E.FINDS[f] || this.col.length >= KEEP_MAX) return; this.col.push(f); this.dirty = true; this.save(); send({ cl: this.bestFinds() }); this.peers(); },

    /* ---- the timing game: a marker sweeps a bar; stop it in the green (E, a click or the button) ---- */
    timing(o) {
      this.timingEnd();
      const el = document.createElement('div'); el.className = 'tyTime';
      el.innerHTML = `<div class="tt">${esc(o.title)}</div><div class="bar"><i class="zone"></i><i class="sweet"></i><b></b></div><button class="tybtn">${esc(o.btn || 'Stop!')}</button>`;
      $('#xhud').append(el);
      const z0 = clamp(o.zone != null ? o.zone : 0.24, 0.08, 0.6), at = 0.15 + Math.random() * (0.7 - z0);
      const zone = el.querySelector('.zone'), sweet = el.querySelector('.sweet');
      zone.style.left = at * 100 + '%'; zone.style.width = z0 * 100 + '%';
      sweet.style.left = (at + z0 * 0.38) * 100 + '%'; sweet.style.width = z0 * 0.24 * 100 + '%';
      el.querySelector('.tybtn').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.timingStop(); });
      this.tg = { o, el, x: 0, dir: 1, at, z0, left: o.time || 6 };
    },
    timingTick(dt) {
      const g = this.tg; if (!g) return;
      g.x += g.dir * dt * (g.o.speed || 1.1); if (g.x > 1) { g.x = 1; g.dir = -1; } if (g.x < 0) { g.x = 0; g.dir = 1; }
      g.el.querySelector('b').style.left = g.x * 100 + '%';
      g.left -= dt; if (g.left <= 0) { const o = g.o; this.timingEnd(); o.done(-1); }
    },
    // -1 missed (or too slow), 0 in the green, 1 right in the middle
    timingStop() {
      const g = this.tg; if (!g) return false;
      const o = g.o, rel = (g.x - g.at) / g.z0, score = rel < 0 || rel > 1 ? -1 : Math.abs(rel - 0.5) < 0.12 ? 1 : 0;
      this.timingEnd(); o.done(score); return true;
    },
    timingEnd() { if (this.tg) { this.tg.el.remove(); this.tg = null; } },
    key(code, down) { if (down && this.tg && (code === 'KeyE' || code === 'Space')) { this.timingStop(); return true; } return this.tyKey ? this.tyKey(code, down) : undefined; },
    press(btn, down) { if (down && btn === 0 && this.tg) this.timingStop(); else if (this.tyPress) this.tyPress(btn, down); },
  };
  for (const [k, v] of Object.entries(kit)) if (!(k in E)) E[k] = v;
  E.ty = { has, T, RAR, path, pathAt, sNear, PLOT_COLS, PLOT_NAMES };
  return E;
}
