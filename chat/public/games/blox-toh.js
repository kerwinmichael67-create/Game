/* =====================================================================
   BLOXVERSE — TOWER OF HELL. A new tower every round, stacked from
   random sections. No checkpoints: touch red and you start again from
   the bottom. The round (seed, timer, mutators) is run by the host.
   ===================================================================== */
(() => {
  const SEC_H = 14, HALF = 13, ROUND = 360;
  const COLS = [0xf472b6, 0x60a5fa, 0x34d399, 0xfbbf24, 0xa78bfa, 0xfb7185, 0x22d3ee, 0xf97316, 0xa3e635, 0xe879f9];
  const MUTS = {
    speed: { n: '⚡ Speed', d: 'everyone runs faster' },
    lowgrav: { n: '🪶 Low gravity', d: 'floaty jumps' },
    jump: { n: '🦘 High jump', d: 'jump higher' },
    fog: { n: '🌫️ Fog', d: 'you can’t see far' },
    invis: { n: '👻 Invisible', d: 'the tower is see-through' },
    long: { n: '📏 Lengthen', d: '3 extra sections' },
  };
  let trussTex = null;
  function makeTruss() {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    g.strokeStyle = '#d1d5db'; g.lineWidth = 7;
    g.strokeRect(4, 4, 56, 56); g.beginPath(); g.moveTo(4, 4); g.lineTo(60, 60); g.moveTo(60, 4); g.lineTo(4, 60); g.stroke();
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  const truss = (x, y0, z, h, o = {}) => { if (!trussTex) trussTex = makeTruss(); const m = trussTex.clone(); m.needsUpdate = true; m.repeat.set(1, Math.round(h / 2)); return part(Object.assign({ x, y: y0 + h / 2, z, sx: 2, sy: h, sz: 2, c: 0xffffff, map: m, truss: true, th: true }, o)); };
  const cl = (v) => clamp(v, -HALF + 2, HALF - 2);
  // a row of platforms from one spot to another, rising the whole section on the way
  function steps(r, y0, from, to, n, col, o = {}) {
    const way = o.via ? [from, o.via, to] : [from, to], pts = [];
    let total = 0; const seg = [];
    for (let i = 1; i < way.length; i++) { const d = Math.hypot(way[i][0] - way[i - 1][0], way[i][1] - way[i - 1][1]); seg.push(d); total += d; }
    for (let k = 1; k <= n; k++) {
      let t = (k / (n + 1)) * total, i = 0; while (i < seg.length - 1 && t > seg[i]) { t -= seg[i]; i++; }
      const f = seg[i] ? t / seg[i] : 0, a = way[i], b = way[i + 1];
      const x = cl(a[0] + (b[0] - a[0]) * f + (r() - 0.5) * (o.jit || 2)), z = cl(a[1] + (b[1] - a[1]) * f + (r() - 0.5) * (o.jit || 2));
      pts.push([x, y0 + (SEC_H * k) / (n + 1), z]);
    }
    return pts;
  }
  const exitPad = (x, y, z, col) => slab(x, y, z, 5, 5, col, { th: true });
  const corner = (r, not) => { const cs = [[-9, -9], [9, -9], [9, 9], [-9, 9]].filter((c) => !not || Math.hypot(c[0] - not[0], c[1] - not[1]) > 8); return cs[Math.floor(r() * cs.length)]; };
  const SECTIONS = {
    'Stairway'(r, y0, e, col) { const x = corner(r, e); for (const [px, py, pz] of steps(r, y0, e, x, 6, col, { via: [0, 0] })) slab(px, py, pz, 3.6, 3.6, col, { th: true }); return x; },
    'Fading Steps'(r, y0, e, col) { const x = corner(r, e); steps(r, y0, e, x, 6, col).forEach(([px, py, pz], i) => part({ x: px, y: py - 0.5, z: pz, sx: 3.6, sy: 1, sz: 3.6, c: col, th: true, fade: { per: 3, on: 2, ph: i * 0.5 } })); return x; },
    'Skinny Beams'(r, y0, e, col) { const x = corner(r, e); steps(r, y0, e, x, 7, col, { via: [r() * 10 - 5, r() * 10 - 5] }).forEach(([px, py, pz], i) => slab(px, py, pz, i % 2 ? 1.1 : 4, i % 2 ? 4 : 1.1, col, { th: true })); return x; },
    'Moving Steps'(r, y0, e, col) { const x = corner(r, e); steps(r, y0, e, x, 6, col).forEach(([px, py, pz], i) => { const ph = r() * 6, ax = i % 2; part({ x: px, y: py - 0.5, z: pz, sx: 3.6, sy: 1, sz: 3.6, c: col, th: true, move: (t) => (ax ? [Math.sin(t * 1.4 + ph) * 2.2, 0, 0] : [0, 0, Math.sin(t * 1.4 + ph) * 2.2]) }); }); return x; },
    'Kill Brick Stairs'(r, y0, e, col) {
      const x = corner(r, e);
      steps(r, y0, e, x, 6, col, { via: [0, 0] }).forEach(([px, py, pz]) => {
        slab(px, py, pz, 4.4, 4.4, col, { th: true });
        const s = Math.floor(r() * 4), off = [[1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]][s];
        part({ x: px + off[0], y: py + 0.12, z: pz + off[1], sx: off[0] ? 1.4 : 4.4, sy: 0.25, sz: off[1] ? 1.4 : 4.4, c: 0xff2020, neon: true, kind: 'kill', th: true, solid: false });
      });
      return x;
    },
    'Truss Climb'(r, y0, e, col) {
      const tx = cl(e[0] + (e[0] > 0 ? -5 : 5)), tz = e[1];
      slab((e[0] + tx) / 2, y0, tz, Math.abs(e[0] - tx) + 3, 3, col, { th: true });
      truss(tx, y0, tz, SEC_H);
      for (let k = 0; k < 2; k++) { const ph = r() * 6; part({ x: tx, y: y0 + 4 + k * 5, z: tz, sx: 6, sy: 0.8, sz: 0.8, c: 0xff2020, neon: true, kind: 'kill', th: true, solid: false, move: (t) => [0, 0, Math.sin(t * 1.2 + ph) * 3.5] }); }
      const x = [cl(tx + (tx > 0 ? -4 : 4)), tz];
      slab((tx + x[0]) / 2, y0 + SEC_H, tz, Math.abs(tx - x[0]) + 4, 3, col, { th: true });
      return x;
    },
    'Bounce Pads'(r, y0, e, col) {
      const mid = [cl(-e[0] * 0.3 + (r() - 0.5) * 6), cl(-e[1] * 0.3 + (r() - 0.5) * 6)];
      slab((e[0] + mid[0]) / 2, y0, (e[1] + mid[1]) / 2, 3, 3, col, { th: true });
      slab(mid[0], y0 + 1, mid[1], 5, 5, col, { th: true });
      part({ x: mid[0], y: y0 + 1.2, z: mid[1], sx: 3, sy: 0.4, sz: 3, c: 0x22ff66, neon: true, kind: 'bounce', power: 78, th: true });
      const x = corner(r, mid);
      slab((mid[0] + x[0]) / 2, y0 + SEC_H - 4.5, (mid[1] + x[1]) / 2, 3.4, 3.4, col, { th: true });
      return x;
    },
    'Spinner Room'(r, y0, e, col) {
      const x = corner(r, e), pts = steps(r, y0, e, x, 3, col, { jit: 1 });
      pts.forEach(([px, py, pz]) => { slab(px, py, pz, 7, 7, col, { th: true }); part({ x: px, y: py + 1.4, z: pz, sx: 6.6, sy: 0.8, sz: 0.8, c: 0xff2020, neon: true, kind: 'kill', solid: false, th: true, spin: (1.3 + r()) * (r() < 0.5 ? 1 : -1) }); });
      const last = pts[pts.length - 1];
      slab((last[0] + x[0]) / 2, y0 + SEC_H * 0.88, (last[2] + x[1]) / 2, 3, 3, col, { th: true });
      return x;
    },
    'Kill Floor'(r, y0, e, col) {
      // climb a truss up through a hole, then cross a floor where most tiles are deadly
      const n = 6, sz = (HALF * 2) / n, idx = (v) => clamp(Math.floor((v + HALF) / sz), 0, n - 1), mid = (i) => -HALF + (i + 0.5) * sz;
      const hole = [idx(e[0]), idx(e[1] + (e[1] > 0 ? -4 : 4))];
      const start = [hole[0], clamp(hole[1] + (hole[1] >= n / 2 ? -1 : 1), 0, n - 1)];
      let end = [n - 1 - start[0], n - 1 - start[1]]; if (end[0] === hole[0] && end[1] === hole[1]) end = [start[0] < n / 2 ? n - 1 : 0, end[1]];
      slab((e[0] + mid(hole[0])) / 2, y0, (e[1] + mid(hole[1])) / 2, Math.abs(e[0] - mid(hole[0])) + 2.5, Math.abs(e[1] - mid(hole[1])) + 2.5, col, { th: true });
      truss(mid(hole[0]), y0, mid(hole[1]), SEC_H + 1);
      const safe = new Set(), key = (a, b) => a + ',' + b; let [cx, cz] = start; safe.add(key(cx, cz));
      while (cx !== end[0] || cz !== end[1]) { if (cx !== end[0] && (cz === end[1] || r() < 0.5)) cx += Math.sign(end[0] - cx); else cz += Math.sign(end[1] - cz); safe.add(key(cx, cz)); }
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if (i === hole[0] && j === hole[1]) continue;
        const x = mid(i), z = mid(j), kill = !safe.has(key(i, j)) && r() < 0.6;
        part({ x, y: y0 + SEC_H - 0.5, z, sx: sz - 0.08, sy: 1, sz: sz - 0.08, c: kill ? 0xff2020 : col, neon: kill, kind: kill ? 'kill' : null, th: true });
      }
      return [-HALF + (end[0] + 0.5) * sz, -HALF + (end[1] + 0.5) * sz, 'floor'];
    },
    'Wraparound'(r, y0, e, col) {
      part({ x: 0, y: y0 + SEC_H / 2, z: 0, sx: 4, sy: SEC_H, sz: 4, c: 0x6b7280, th: true });
      const a0 = Math.atan2(e[1], e[0]), dir = r() < 0.5 ? 1 : -1, d0 = Math.hypot(e[0], e[1]);
      if (d0 > 5) slab(Math.cos(a0) * (d0 + 4.5) / 2, y0, Math.sin(a0) * (d0 + 4.5) / 2, Math.abs(Math.cos(a0)) * (d0 - 4.5) + 2.2, Math.abs(Math.sin(a0)) * (d0 - 4.5) + 2.2, col, { th: true });
      for (let k = 1; k <= 7; k++) { const a = a0 + dir * k * 0.85, x = Math.cos(a) * 3.2, z = Math.sin(a) * 3.2; slab(x, y0 + (SEC_H * k) / 8, z, 2, 2, col, { th: true }); }
      const a = a0 + dir * 8 * 0.85, x = [cl(Math.cos(a) * 8), cl(Math.sin(a) * 8)];
      slab(Math.cos(a) * 5.4, y0 + SEC_H, Math.sin(a) * 5.4, 3, 3, col, { th: true });
      return x;
    },
    'Elevators'(r, y0, e, col) {
      const x = corner(r, e), mid = [(e[0] + x[0]) / 2, (e[1] + x[1]) / 2];
      [[(e[0] + mid[0]) / 2, (e[1] + mid[1]) / 2], mid, [(mid[0] + x[0]) / 2, (mid[1] + x[1]) / 2]].forEach(([px, pz], i) => {
        const ph = i * 1.4, lo = y0 + i * 4.3, hi = y0 + 4 + i * 4.3;
        part({ x: px, y: lo - 0.5, z: pz, sx: 4, sy: 1, sz: 4, c: col, th: true, move: (t) => [0, (Math.sin(t * 0.9 + ph) * 0.5 + 0.5) * (hi - lo), 0] });
      });
      return x;
    },
  };
  const NAMES = Object.keys(SECTIONS);

  const TOH = {
    id: 'toh', code: 'th', rank: 4, name: 'Tower of Hell', emoji: '🔥', max: 12, stat: 'Wins', killY: -30, banner: true,
    color: 'linear-gradient(135deg,#1f2937,#dc2626)',
    desc: 'A new randomly stacked tower every round, often with a twist (speed, low gravity, fog…). No checkpoints: touch red and it’s back to the bottom. Reach the top before the timer runs out.',
    welcome: 'Climb! No checkpoints!',
    build() {
      sky('#1e1b4b', '#c7d2fe');
      slab(0, 0, 0, 60, 60, 0x4b5563, { sy: 2 });
      const s = label('TOWER OF HELL', { size: 3, color: '#fecaca' }); s.position.set(0, 9, 24); place.add(s);
      this.built = null; this.top = SEC_H * 6;
    },
    tower(seed, muts) {
      removeParts((p) => p.th);
      for (const l of this.labels || []) place.remove(l);
      this.labels = [];
      const r = mulberry(seed), n = 6 + (muts.includes('long') ? 3 : 0);
      let e = [0, 0];
      this.names = [];
      for (let i = 0; i < n; i++) {
        let nm = NAMES[Math.floor(r() * NAMES.length)];
        if (nm === 'Wraparound' && Math.hypot(e[0], e[1]) < 6) nm = 'Stairway';
        const col = COLS[Math.floor(r() * COLS.length)], y0 = i * SEC_H;
        const x = SECTIONS[nm](r, y0, e, col);
        if (x[2] !== 'floor') exitPad(x[0], y0 + SEC_H, x[1], col);
        e = [x[0], x[1]];
        this.names.push(nm);
        const lab = label(nm, { size: 0.9, color: '#e5e7eb' }); lab.position.set(0, y0 + 2.5, -HALF - 0.5); place.add(lab); this.labels.push(lab);
      }
      // the top
      const top = n * SEC_H;
      slab(e[0], top, e[1], 6, 6, 0xfbbf24, { th: true });
      part({ x: e[0], y: top + 0.25, z: e[1], sx: 4, sy: 0.5, sz: 4, c: 0xfff3b0, neon: true, kind: 'finish', th: true });
      const f = label('🏁 FINISH', { size: 2 }); f.position.set(e[0], top + 6, e[1]); place.add(f); this.labels.push(f);
      // the frame: corner pillars and see-through walls so you fall inside the tower
      for (const [x, z] of [[-HALF - 1, -HALF - 1], [HALF + 1, -HALF - 1], [HALF + 1, HALF + 1], [-HALF - 1, HALF + 1]]) part({ x, y: top / 2 + 2, z, sx: 2, sy: top + 4, sz: 2, c: 0x1f2937, th: true, plain: true });
      for (const [x, z, sx, sz] of [[0, -HALF - 1, HALF * 2, 0.4], [0, HALF + 1, HALF * 2, 0.4], [-HALF - 1, 0, 0.4, HALF * 2], [HALF + 1, 0, 0.4, HALF * 2]]) part({ x, y: top / 2 + 2, z, sx, sy: top + 4, sz, c: 0xc7d2fe, alpha: 0.08, plain: true, th: true });
      // a doorway at the bottom so you can walk in
      removeParts((p) => p.th && p.alpha === 0.08 && p.z > HALF);
      part({ x: 0, y: top / 2 + 5, z: HALF + 1, sx: HALF * 2, sy: top - 2, sz: 0.4, c: 0xc7d2fe, alpha: 0.08, plain: true, th: true });
      if (muts.includes('invis')) for (const p of parts) if (p.th && !p.kind && !p.truss && p.alpha == null) { p.m.material.transparent = true; p.m.material.opacity = 0.12; p.m.material.depthWrite = false; }
      scene.fog.far = muts.includes('fog') ? 70 : 1000; scene.fog.near = muts.includes('fog') ? 10 : 260;
      this.top = top; this.built = seed; this.muts = muts;
    },
    pres() { return { fin: 0, wn: 0 }; },
    async enter() {
      this.H = null; this.lastG = null; this.gSeen = null; this.fin = 0; this.built = null; this.muts = [];
      const s = await kvGet('th'); this.wins = (s && s.wins | 0) || 0;
      send({ wn: this.wins });
    },
    spawn() { return [(Math.random() - 0.5) * 6, 0.5, HALF + 6 + Math.random() * 4, 0]; },
    adopt() { const g = this.lastG; if (g) return Object.assign({}, g, { mut: (g.mut || []).slice() }); const H = { ph: 'play', left: 0, rd: 0, seed: 0, mut: [], gs: 0 }; this.newRound(H); return H; },
    newRound(H) {
      H.rd = (H.rd | 0) + 1; H.seed = 1 + Math.floor(Math.random() * 1e9); H.ph = 'play';
      const keys = Object.keys(MUTS), m = [];
      if (Math.random() < 0.45) m.push(keys[Math.floor(Math.random() * keys.length)]);
      if (Math.random() < 0.12) { const k = keys[Math.floor(Math.random() * keys.length)]; if (!m.includes(k)) m.push(k); }
      H.mut = m; H.left = ROUND + (m.includes('long') ? 90 : 0);
    },
    host(dt) {
      const H = this.H; H.left = Math.max(0, H.left - dt);
      if (H.ph === 'play' && H.left <= 0) { H.ph = 'inter'; H.left = 6; }
      else if (H.ph === 'inter' && H.left <= 0) this.newRound(H);
      if (performance.now() - (this.sentAt || 0) > 400) { this.sentAt = performance.now(); hostSend(this); }
    },
    tick(dt) {
      const g = this.g = roundState(this);
      if (g && g.seed && g.seed !== this.built) {
        this.tower(g.seed, Array.isArray(g.mut) ? g.mut.filter((k) => MUTS[k]) : []);
        if (this.shown) { respawn(); toast(this.muts.length ? `New tower! ${this.muts.map((k) => MUTS[k].n).join(' + ')}` : 'New tower!', '#fecaca'); }
        this.shown = true;
      }
      if (!g) return setBanner('Building the tower…');
      if (g.ph === 'inter') return setBanner('⏰ Time’s up! A new tower is coming…');
      const mut = this.muts.length ? ` · ${this.muts.map((k) => MUTS[k].n).join(' ')}` : '';
      setBanner(`🔥 ${mmss(g.left)}${mut}${this.fin === g.rd ? ' · ✅ you beat this one' : ''}`);
    },
    touch(p) {
      const g = this.g;
      if (p.kind !== 'finish' || !g || this.fin === g.rd) return;
      const first = !players().some((x) => !x.me && x.pr.fin === g.rd);
      this.fin = g.rd; this.wins++; send({ fin: g.rd, wn: this.wins }); kvSet('th', { wins: this.wins });
      toast('🔥 You beat the tower!', '#fde68a'); puffAt(P.x, P.y + 3, P.z, CONFETTI, 60);
      Net.chat(`🔥 beat the tower${first ? ' first' : ''}!`); say(`${Net.name} beat the tower!`, '#fde68a');
      earn(first ? 60 : 40, first ? 'first to beat the tower' : 'beat the tower');
      setTimeout(() => { if (exp === TOH && playing) respawn(); }, 3000);
    },
    speed() { return this.muts && this.muts.includes('speed') ? 24 : 16; },
    gravity() { return this.muts && this.muts.includes('lowgrav') ? GRAV * 0.55 : GRAV; },
    jumpPower() { return this.muts && this.muts.includes('jump') ? JUMP * 1.22 : JUMP; },
    leave() { scene.fog.far = 1000; scene.fog.near = 260; },
    statOf(pr, isMe) { return isMe ? this.wins : pr.wn | 0; },
    sortKey(pr, isMe) { return isMe ? this.wins : pr.wn | 0; },
    hud() {
      const n = this.names ? this.names.length : 6, sec = clamp(Math.floor(P.y / SEC_H) + 1, 1, n);
      return P.y < 1 ? 'Walk into the tower and climb!' : `Section ${sec}/${n} · ${esc(this.names ? this.names[sec - 1] : '')}`;
    },
  };
  addExp(TOH);
  window.__rbTOH = TOH;
})();
