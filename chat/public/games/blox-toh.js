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
  // (spaced so none hangs over another: each step o.size across, a clear gap between them and from the pads at either end.
  // A short way gets fewer, taller steps — they still reach the top — and a very short one goes round by a corner first)
  function steps(r, y0, from, to, n0, col, o = {}) {
    const size = o.size || 3.6, gap = size + 0.5, endGap = 2.5 + size / 2 + 0.5;
    const len = (w) => w.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - w[i - 1][0], p[1] - w[i - 1][1]) : 0), 0), dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const far = [[-9, -9], [9, -9], [9, 9], [-9, 9]].sort((a, b) => Math.min(dist(b, from), dist(b, to)) - Math.min(dist(a, from), dist(a, to)))[0];
    // the ways it could go: by o.via, straight, round the far corner; the first where every step has room is the one
    const ways = (o.via && dist(from, o.via) > 5 && dist(to, o.via) > 5 && !(ROUND_WALLS && Math.hypot(o.via[0], o.via[1]) < 7) ? [[from, o.via, to]] : []).concat([[from, to], [from, far, to]]);
    const jit = ways.map(() => Array.from({ length: 12 }, () => [(r() - 0.5) * (o.jit || 2), (r() - 0.5) * (o.jit || 2)])); // (drawn up front: the same draws whichever way it goes)
    let pts = [];
    for (let w = 0; w < ways.length; w++) {
      const way = ways[w], seg = [], total = len(way); for (let i = 1; i < way.length; i++) seg.push(dist(way[i], way[i - 1]));
      const span = Math.max(0, total - 2 * endGap), most = Math.max(2, Math.floor(span / gap) + 1), least = Math.ceil(span / (size + 3)) + 1;
      const n = Math.min(12, clamp(n0, Math.min(least, most), most)); // (as many as fit with room between, and enough that no gap's too far to jump)
      pts = [];
      for (let k = 1; k <= n; k++) {
        let t = endGap + (n > 1 ? ((k - 1) / (n - 1)) * span : span / 2), i = 0; while (i < seg.length - 1 && t > seg[i]) { t -= seg[i]; i++; }
        const f = seg[i] ? Math.min(1, t / seg[i]) : 0, a = way[i], b = way[i + 1], [jx, jz] = jit[w][k - 1];
        let x = cl(a[0] + (b[0] - a[0]) * f + jx), z = cl(a[1] + (b[1] - a[1]) * f + jz);
        const prev = pts[k - 2]; if (prev && Math.hypot(x - prev[0], z - prev[2]) < gap) { x = cl(a[0] + (b[0] - a[0]) * f); z = cl(a[1] + (b[1] - a[1]) * f); } // (no shaking a step into the last)
        pts.push([x, y0 + (SEC_H * k) / (n + 1), z]);
      }
      // room, in a straight line: clear of both pads, and of every step near it in height
      const ok = dist([pts[0][0], pts[0][2]], from) >= endGap - 0.2 && dist([pts[pts.length - 1][0], pts[pts.length - 1][2]], to) >= endGap - 0.2
        && pts.every((p, i) => pts.every((q, j) => j <= i || j - i > 3 || Math.hypot(p[0] - q[0], p[2] - q[2]) >= gap - 0.2));
      if (ok) break;
    }
    return pts;
  }
  // where sections join, the exit pad sits a hair above the section's last platforms and the next section's way in a hair
  // below it: platforms that overlap at a joint never share a plane (they'd flicker)
  const JOIN = 0.03, exitPad = (x, y, z, col) => slab(x, y + JOIN, z, 5, 5, col, { th: true });
  let ROUND_WALLS = false; // (when the middle's taken by the section below: go round by the walls)
  const corner = (r, not) => { const cs = [[-9, -9], [9, -9], [9, 9], [-9, 9]].filter((c) => !not || (Math.hypot(c[0] - not[0], c[1] - not[1]) > 8 && (!ROUND_WALLS || Math.hypot(c[0] - not[0], c[1] - not[1]) < 21))); return cs[Math.floor(r() * cs.length)]; };
  const SECTIONS = {
    'Stairway'(r, y0, e, col) { const x = corner(r, e); for (const [px, py, pz] of steps(r, y0, e, x, 6, col, { via: [0, 0] })) slab(px, py, pz, 3.6, 3.6, col, { th: true }); return x; },
    'Fading Steps'(r, y0, e, col) { const x = corner(r, e); steps(r, y0, e, x, 6, col).forEach(([px, py, pz], i) => part({ x: px, y: py - 0.5, z: pz, sx: 3.6, sy: 1, sz: 3.6, c: col, th: true, fade: { per: 3, on: 2, ph: i * 0.5 } })); return x; },
    'Skinny Beams'(r, y0, e, col) { const x = corner(r, e); steps(r, y0, e, x, 7, col, { via: [r() * 10 - 5, r() * 10 - 5], size: 4 }).forEach(([px, py, pz], i) => slab(px, py, pz, i % 2 ? 1.1 : 4, i % 2 ? 4 : 1.1, col, { th: true })); return x; },
    'Moving Steps'(r, y0, e, col) { const x = corner(r, e); steps(r, y0, e, x, 6, col).forEach(([px, py, pz], i) => { const ph = r() * 6, ax = i % 2; part({ x: px, y: py - 0.5, z: pz, sx: 3.6, sy: 1, sz: 3.6, c: col, th: true, move: (t) => (ax ? [Math.sin(t * 1.4 + ph) * 2.2, 0, 0] : [0, 0, Math.sin(t * 1.4 + ph) * 2.2]) }); }); return x; },
    'Kill Brick Stairs'(r, y0, e, col) {
      const x = corner(r, e);
      const pts = steps(r, y0, e, x, 6, col, { via: [0, 0], size: 4.4 });
      pts.forEach(([px, py, pz], i) => {
        slab(px, py, pz, 4.4, 4.4, col, { th: true });
        const a = i ? pts[i - 1] : [e[0], 0, e[1]], b = pts[i + 1] || [x[0], 0, x[1]], along = Math.abs(b[0] - a[0]) > Math.abs(b[2] - a[2]);
        const side = along ? (a[2] - pz) + (b[2] - pz) : (a[0] - px) + (b[0] - px), sd = (Math.abs(side) > 0.3 ? -Math.sign(side) : r() < 0.5 ? 1 : -1) * 1.5;
        const off = along ? [0, sd] : [sd, 0]; // (a strip along the way, on the side away from the steps either side of it: there's always a lane past it)
        part({ x: px + off[0], y: py + 0.12, z: pz + off[1], sx: off[0] ? 1.4 : 4.4, sy: 0.25, sz: off[1] ? 1.4 : 4.4, c: 0xff2020, neon: true, kind: 'kill', th: true, solid: false });
      });
      return x;
    },
    'Truss Climb'(r, y0, e, col) {
      // walk to the truss, climb it (dodging the red bars that sweep across it), go over its top and onto the way off on
      // its far side: nothing hangs over the truss, so you can always get over the top
      const dir = e[0] > 0 ? -1 : 1, tx = cl(e[0] + dir * 5), tz = e[1];
      slab((e[0] + tx) / 2, y0 - JOIN, tz, Math.abs(e[0] - tx) + 3, 3, col, { th: true });
      truss(tx, y0, tz, SEC_H);
      for (let k = 0; k < 2; k++) { const ph = r() * 6; part({ x: tx, y: y0 + 4 + k * 5, z: tz, sx: 6, sy: 0.8, sz: 0.8, c: 0xff2020, neon: true, kind: 'kill', th: true, solid: false, move: (t) => [0, 0, Math.sin(t * 1.2 + ph) * 3.5] }); }
      return [cl(tx + dir * 4), tz]; // (the way off: 0.5 past the truss's far side, level with its top)
    },
    'Bounce Pads'(r, y0, e, col) {
      const mid = [cl(-e[0] * 0.3 + (r() - 0.5) * 6), cl(-e[1] * 0.3 + (r() - 0.5) * 6)];
      slab((e[0] + mid[0]) / 2, y0 - JOIN, (e[1] + mid[1]) / 2, 3, 3, col, { th: true });
      slab(mid[0], y0 + 1, mid[1], 5, 5, col, { th: true });
      part({ x: mid[0], y: y0 + 1.2, z: mid[1], sx: 3, sy: 0.4, sz: 3, c: 0x22ff66, neon: true, kind: 'bounce', power: 78, th: true });
      const x = corner(r, mid);
      slab((mid[0] + x[0]) / 2, y0 + SEC_H - 4.5, (mid[1] + x[1]) / 2, 3.4, 3.4, col, { th: true });
      return x;
    },
    'Spinner Room'(r, y0, e, col) {
      const x = corner(r, e), pts = steps(r, y0, e, x, 3, col, { jit: 1, size: 7 });
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
      slab((e[0] + mid(hole[0])) / 2, y0 - JOIN, (e[1] + mid(hole[1])) / 2, Math.abs(e[0] - mid(hole[0])) + 2.5, Math.abs(e[1] - mid(hole[1])) + 2.5, col, { th: true });
      // (the hole's a tile wide: with the truss in its middle there was no room for you beside it, so it stands in the hole's
      // corner away from where you come in, leaving room to climb up beside it)
      const hx = mid(hole[0]), hz = mid(hole[1]), ax = hx - e[0], az = hz - e[1], off = sz / 2 - 1.05;
      truss(hx + (Math.sign(ax) || 1) * off, y0, hz + (Math.sign(az) || 1) * off, SEC_H + 1); // (in the far corner: two sides to climb from)
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
      if (d0 > 5) slab(Math.cos(a0) * (d0 + 4.5) / 2, y0 - JOIN, Math.sin(a0) * (d0 + 4.5) / 2, Math.abs(Math.cos(a0)) * (d0 - 4.5) + 2.2, Math.abs(Math.sin(a0)) * (d0 - 4.5) + 2.2, col, { th: true });
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
  // after a Kill Floor you come off its far tile: the next section has to start with a jump up, not a walk across the floor
  const AFTER_FLOOR = ['Stairway', 'Fading Steps', 'Skinny Beams', 'Moving Steps', 'Kill Brick Stairs', 'Spinner Room'];
  /* ---- is there room? Every platform you stand on (this section's, its way in, and the top of the one below) needs a
     spot you fit on: nothing hanging lower than your head over it, no wall through it, no red on it. A section that
     leaves one with nowhere to stand is built again (the same for everyone: it's all from the round's seed) ---- */
  const BOXOF = (p, sweep) => {
    let x0 = p.x - p.sx / 2, x1 = p.x + p.sx / 2, y0 = p.y - p.sy / 2, y1 = p.y + p.sy / 2, z0 = p.z - p.sz / 2, z1 = p.z + p.sz / 2;
    if (sweep && p.move) { let lo = 0, hi = 0; for (let k = 0; k < 16; k++) { const m = p.move(k * 0.45); if (m[0] || m[2]) return [x0, y0, z0, x1, y1, z1]; lo = Math.min(lo, m[1]); hi = Math.max(hi, m[1]); } y0 += lo; y1 += hi; } // (a lift: all the way it goes)
    return [x0, y0, z0, x1, y1, z1];
  };
  const standable = (p) => p.solid !== false && !p.kind && !p.move && p.sx >= 1 && p.sz >= 1; // (a truss's top too: you climb up past it)
  function roomy(list, pad, below = []) {
    // (over the top platforms of the section below: room for a whole jump, not just to stand — you jump off them)
    for (const S of below) { const b = BOXOF(S, true), top = b[4]; for (const p of list) { if (!p.th || p.solid === false || below.includes(p)) continue; const q = BOXOF(p, true); if (q[3] > b[0] - 0.3 && q[0] < b[3] + 0.3 && q[5] > b[2] - 0.3 && q[2] < b[5] + 0.3 && q[1] > top + 0.3 && q[1] < top + 11.4) return false; } }
    // (a truss needs one side clear all the way up, and past its top, for you to climb)
    for (const T of list) {
      if (!T.truss) continue; const t = BOXOF(T); let side = false;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const cx = (t[0] + t[3]) / 2 + dx * ((t[3] - t[0]) / 2 + 1.02), cz = (t[2] + t[5]) / 2 + dz * ((t[5] - t[2]) / 2 + 1.02), y0 = t[1] + 1.5, y1 = t[4] + 5.2;
        if (!list.some((p) => p !== T && p.solid !== false && (() => { const q = BOXOF(p, true); return q[3] > cx - (dx ? 1 : 0.95) && q[0] < cx + (dx ? 1 : 0.95) && q[5] > cz - (dz ? 1 : 0.95) && q[2] < cz + (dz ? 1 : 0.95) && q[4] > y0 && q[1] < y1; })())) { side = true; break; }
      }
      if (!side) return false;
    }
    if (pad) { // (nothing new hanging low over the pad you come in on, or just beside it)
      const b = BOXOF(pad), top = b[4];
      for (const p of list) { if (p === pad || p.solid === false || !p.th) continue; const q = BOXOF(p, true); if (q[3] > b[0] - 0.3 && q[0] < b[3] + 0.3 && q[5] > b[2] - 0.3 && q[2] < b[5] + 0.3 && q[1] > top + 0.3 && q[1] < top + 7) return false; }
    }
    const solids = list.filter((p) => p.solid !== false).map((p) => Object.assign(BOXOF(p, true), { p })), kills = list.filter((p) => p.kind === 'kill' && !p.spin && !p.move).map((p) => BOXOF(p));
    for (const S of list) {
      if (!standable(S)) continue;
      const b = BOXOF(S), top = b[4]; let ok = false;
      for (let cx = b[0] - 0.8; cx <= b[3] + 0.8 && !ok; cx += 0.35) for (let cz = b[2] - 0.8; cz <= b[5] + 0.8 && !ok; cz += 0.35) {
        const x0 = cx - 1.05, x1 = cx + 1.05, z0 = cz - 1.05, z1 = cz + 1.05;
        if (Math.min(x1, b[3]) - Math.max(x0, b[0]) < Math.min(1.2, b[3] - b[0]) || Math.min(z1, b[5]) - Math.max(z0, b[2]) < Math.min(1.2, b[5] - b[2])) continue; // (standing on it, not hanging off its edge)
        let free = true;
        for (const q of solids) {
          if (q.p === S || q[3] <= x0 || q[0] >= x1 || q[5] <= z0 || q[2] >= z1 || q[4] <= top + 0.05) continue;
          if (q[1] > top + 0.3 ? q[1] < top + 5.2 : q[4] > top + 2.15) { free = false; break; } // (a ceiling under head height, or a wall)
        }
        if (free) for (const k of kills) if (!(k[3] <= x0 - 0.15 || k[0] >= x1 + 0.15 || k[5] <= z0 - 0.15 || k[2] >= z1 + 0.15) && k[4] > top - 0.1 && k[1] < top + 0.6) { free = false; break; }
        if (free) ok = true;
      }
      if (!ok) return false;
    }
    return true;
  }

  const TOH = {
    id: 'toh', code: 'th', genre: 'Obby', rank: 4, name: 'Tower of Hell', emoji: '🔥', max: 12, stat: 'Wins', killY: -30, banner: true,
    land: { theme: 'snow', mode: 'sky', low: -100, extras: ['stars'] },
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
      this.names = []; this.secs = [];
      let below = parts.filter((p) => p.th === undefined && p.y + p.sy / 2 > -0.5), floorBefore = false, padIn = null; // (the ground, for the first section)
      for (let i = 0; i < n; i++) {
        const y0 = i * SEC_H, from = parts.length;
        let nm, col, x, made;
        let tries = 0; ROUND_WALLS = false;
        for (; ; tries++) {
          ROUND_WALLS = tries >= 6; // (six goes and no room: the middle's in use, so round the walls)
          const pool = (floorBefore ? AFTER_FLOOR : i === n - 1 ? NAMES.filter((k) => k !== 'Kill Floor') : NAMES).filter((k) => !ROUND_WALLS || !['Wraparound', 'Bounce Pads', 'Kill Floor'].includes(k));
          nm = pool[Math.floor(r() * pool.length)];
          if (nm === 'Wraparound' && Math.hypot(e[0], e[1]) < 6) nm = 'Stairway';
          col = COLS[Math.floor(r() * COLS.length)];
          x = SECTIONS[nm](r, y0, e, col);
          if (x[2] !== 'floor' && i < n - 1) exitPad(x[0], y0 + SEC_H, x[1], col); // the last one's pad is the finish
          if (i === n - 1) slab(x[0], n * SEC_H + 2 * JOIN, x[1], 5, 5, 0xfbbf24, { th: true, fin: true }); // (the finish: a pad like the others, gold)
          made = parts.slice(from);
          if (tries >= 40 || roomy(made.concat(below), padIn && made.includes(padIn) ? null : padIn, below)) break;
          const drop = new Set(made); removeParts((p) => drop.has(p)); // (no room somewhere: this section again, made differently)
        }
        // what the next section has to leave room on: this one's upper platforms
        this.secs.push({ nm, y0, e: e.slice(), x: x.slice(0, 2), floor: x[2] === 'floor', made, tries }); // (for checking)
        padIn = x[2] === 'floor' ? made.find((p) => Math.abs(p.x - x[0]) < 0.5 && Math.abs(p.z - x[1]) < 0.5 && !p.kind) : made.find((p) => p.sx === 5 && p.sz === 5 && Math.abs(p.y + p.sy / 2 - (y0 + SEC_H + JOIN)) < 0.01); // (the next one's way in)
        below = (x[2] === 'floor' ? [padIn].filter(Boolean) : made.filter((p) => (standable(p) || (p.move && p.sx >= 1 && p.solid !== false)) && BOXOF(p, true)[4] > y0 + SEC_H - 8)).concat(made.filter((p) => p.truss)); // (after a floor, only the tile you go on from matters; lifts, as high as they go; and its truss, which still has to be climbable)
        floorBefore = x[2] === 'floor';
        e = [x[0], x[1]];
        this.names.push(nm);
        const lab = label(nm, { size: 0.9, color: '#e5e7eb' }); lab.position.set(0, y0 + 2.5, -HALF - 0.5); place.add(lab); this.labels.push(lab);
      }
      ROUND_WALLS = false;
      // the top (its gold slab was made with the last section, so that one leaves room on it too)
      const top = n * SEC_H;
      part({ x: e[0], y: top + 2 * JOIN + 0.25, z: e[1], sx: 4, sy: 0.5, sz: 4, c: 0xfff3b0, neon: true, kind: 'finish', th: true });
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
      const s = await kvGet('th'); this.wins = (s && s.wins | 0) || 0; questMax('toh.win', this.wins);
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
      if (this.built && !P.dead && P.y > this.top * 0.5) questMax('toh.half', 1);
      if (g && g.seed && g.seed !== this.built) {
        this.tower(g.seed, Array.isArray(g.mut) ? g.mut.filter((k) => MUTS[k]) : []);
        if (this.shown) { respawn(); sfx('teleport'); if (this.muts.length) sfx('magic'); toast(this.muts.length ? `New tower! ${this.muts.map((k) => MUTS[k].n).join(' + ')}` : 'New tower!', '#fecaca'); }
        this.shown = true;
      }
      if (!g) return setBanner('Building the tower…');
      if (g.ph === 'inter') { if (this.lastPh !== 'inter') sfx('alarm'); this.lastPh = g.ph; return setBanner('⏰ Time’s up! A new tower is coming…'); }
      this.lastPh = g.ph;
      const sec = Math.ceil(g.left); if (sec <= 10 && sec !== this.tickS && this.fin !== g.rd) sfx(sec <= 3 ? 'count' : 'tick'); this.tickS = sec;
      const mut = this.muts.length ? ` · ${this.muts.map((k) => MUTS[k].n).join(' ')}` : '';
      setBanner(`🔥 ${mmss(g.left)}${mut}${this.fin === g.rd ? ' · ✅ you beat this one' : ''}`);
    },
    touch(p) {
      const g = this.g;
      if (p.kind !== 'finish' || !g || this.fin === g.rd) return;
      const first = !players().some((x) => !x.me && x.pr.fin === g.rd);
      this.fin = g.rd; this.wins++; send({ fin: g.rd, wn: this.wins }); kvSet('th', { wins: this.wins }); questMax('toh.win', this.wins);
      toast('🔥 You beat the tower!', '#fde68a'); puffAt(P.x, P.y + 3, P.z, CONFETTI, 60); sfx('win');
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
    coinShop: [shopJump(350, 1.18), shopSpeed(250, 1.15), shopShield(40, 'Touch a kill brick and it saves you (once), bouncing you up')],
  };
  addExp(TOH);
  window.__rbTOH = TOH;
})();
