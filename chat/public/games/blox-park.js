/* =====================================================================
   BLOXVERSE — THEME PARK TYCOON. Claim a park. Guests come in through
   the ticket booths (then by car, bus, train, hotel, blimp and
   teleporter) and walk the path round the park; every ride and food
   stand they pass makes them worth more, and they pay on the way out.
   Rides: a carousel, teacups, a swing ride, a Ferris wheel, a drop
   tower, bumper cars and a roller coaster round the whole park; ride
   the big ones yourself (in anyone's park). Win plushies at the ring
   toss for your prize shelf. Rebirth at the end.
   ===================================================================== */
(() => {
  const FINDS = [
    { n: 'Teddy Bear', e: '🧸', r: 2, v: 500 }, { n: 'Bunny', e: '🐰', r: 2, v: 500 }, { n: 'Rubber Duck', e: '🦆', r: 2, v: 600 }, { n: 'Frog', e: '🐸', r: 2, v: 600 },
    { n: 'Unicorn', e: '🦄', r: 3, v: 2500 }, { n: 'Dragon', e: '🐉', r: 3, v: 3000 }, { n: 'Panda', e: '🐼', r: 3, v: 3000 },
    { n: 'Golden Bear', e: '👑', r: 4, v: 15000 }, { n: 'Rainbow Kitty', e: '🌈', r: 4, v: 20000 },
    { n: 'Cosmic Plush', e: '🌌', r: 5, v: 90000 }, { n: 'Phoenix', e: '🔥', r: 5, v: 100000 },
  ];
  const SHIRTS = [0xef4444, 0x3b82f6, 0x22c55e, 0xf59e0b, 0xa855f7, 0xec4899, 0x14b8a6, 0xf97316, 0xffffff];
  const mats = new Map(), M = (c) => { let m = mats.get(c); if (!m) { m = new THREE.MeshLambertMaterial({ color: c }); mats.set(c, m); } return m; };
  const box = (g, c, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(BOX, typeof c === 'number' ? M(c) : c); m.scale.set(sx, sy, sz); m.position.set(x, y, z); g.add(m); return m; };
  const CYL = new THREE.CylinderGeometry(1, 1, 1, 18);
  const cyl = (g, c, r, h, x, y, z) => { const m = new THREE.Mesh(CYL, typeof c === 'number' ? M(c) : c); m.scale.set(r, h, r); m.position.set(x, y, z); g.add(m); return m; };
  // a guest, walking along +x
  function guest(c) {
    const g = new THREE.Group(), b = new THREE.Group(); b.rotation.y = -Math.PI / 2; g.add(b);
    box(b, 0x1f2937, 0.8, 1.4, 0.45, 0, 0.7, 0); box(b, c, 1.1, 1.4, 0.55, 0, 2.1, 0); box(b, 0xfcd34d, 0.75, 0.75, 0.75, 0, 3.2, 0);
    return g;
  }
  // the rides, round the inside of the path, and where guests ride them (the path goes round them)
  const RIDE = { carousel: [-13, 1], swing: [-13, -13], ferris: [0, -13], drop: [13, -13], teacups: [13, 1], bumper: [0, 1] };
  // the roller coaster's track (the same in every park: made once)
  let coaster = null;
  const coasterGeo = () => { if (!coaster) { const curve = new THREE.CatmullRomCurve3(COASTER.map(([x, z, y]) => new THREE.Vector3(x, y, z)), true, 'catmullrom', 0.3); coaster = { curve, tube: new THREE.TubeGeometry(curve, 260, 0.35, 6, true) }; } return coaster; };
  const COASTER = [[22.5, 14, 5.5], [22.5, -4, 5.5], [22.5, -16, 15], [16, -22.5, 16], [6, -22.5, 4.5], [-6, -22.5, 12], [-16, -22.5, 6], [-22.5, -14, 5], [-22.5, 4, 13], [-22.5, 16, 7], [-14, 22.5, 6.5], [6, 22.5, 6.5], [18, 22.5, 6]];

  const TP = tycoonKit({
    id: 'park', code: 'tp', saveKey: 'tp', rank: 0.0007, name: 'Theme Park Tycoon', emoji: '🎢', noun: 'Park', camDist: 24,
    color: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
    desc: 'Claim a park. Guests walk the path past your rides and food stands and pay on the way out; every ride makes them worth more. Build a carousel, teacups, a swing ride, a Ferris wheel, a drop tower, bumper cars and a roller coaster round the whole park, and ride the big ones yourself. Win plushies at the ring toss. Rebirth for more cash for good.',
    welcome: 'Step on a claim pad to get a park!',
    land: { theme: 'meadow', fence: 'hedge' },
    skyCols: ['#60a5fa', '#fdf2f8'], ground: 0x66bb6a, speed0: 11, belt: false, beltTop: 0.4, prodLift: 0,
    path: [[-6, 25], [-6, 8], [-20, 8], [-20, -20], [20, -20], [20, 8], [8, 8], [8, 25]], padAt: [-15, 17], caseAt: [15, 21], caseName: '🧸 Prize shelf',
    findHow: 'Plushies you win at the ring toss sit on your prize shelf.',
    FINDS,
    items: [
      { n: 'Ticket Booth', price: 0, kind: 'src', look: 'booth', v: 2, every: 1.6, at: [-6, 25], drop: 0, lx: -9.5 },
      { n: 'Ticket Booth 2', price: 25, kind: 'src', look: 'booth', v: 3, every: 1.6, at: [-6, 25], drop: 0, lx: -2.5, pad: [-2.5, 21.5] },
      { n: 'Wider Paths', price: 75, kind: 'speed', sp: 15, pad: [-1, 13] },
      { n: 'Popcorn Stand', price: 160, kind: 'up', look: 'food', food: ['🍿 Popcorn', 0xfef3c7, 0xdc2626], mul: 1.25, at: [-20, -2], stand: [-23, -2, 1], pad: [-22.6, -1] },
      { n: 'Parking Lot', price: 320, kind: 'src', look: 'parking', v: 5, every: 3.2, batch: 2, at: [-6, 25], drop: 0, pad: [-16, 22] },
      { n: 'Flower Gardens', price: 500, kind: 'deco', look: 'flowers', bonus: 0.05, pad: [3.5, 19.5] },
      { n: 'Bus Stop', price: 900, kind: 'src', look: 'bus', v: 12, every: 4.8, batch: 3, at: [-6, 25], drop: 0, pad: [-12, 26.4, 0] },
      { n: 'Carousel', price: 1600, kind: 'up', look: 'carousel', mul: 1.5, at: [-13, 8], pad: [-13, 1] },
      { n: 'Ice Cream Stand', price: 2600, kind: 'up', look: 'food', food: ['🍦 Ice Cream', 0xfce7f3, 0xec4899], mul: 1.25, at: [20, -6], stand: [23, -6, -1], pad: [22.6, -6] },
      { n: 'Train Station', price: 4500, kind: 'src', look: 'train', v: 35, every: 6.4, batch: 4, at: [-6, 25], drop: 0, pad: [1, 26.4, 0] },
      { n: 'Teacups', price: 8000, kind: 'up', look: 'teacups', mul: 1.5, at: [20, 1], pad: [13, 1] },
      { n: 'Hotel', price: 14000, kind: 'src', look: 'hotel', v: 110, every: 4.2, batch: 3, at: [-6, 25], drop: 0, pad: [-30, 16, 0] },
      { n: 'Swing Ride', price: 40000, kind: 'up', look: 'swing', mul: 1.5, at: [-20, -13], pad: [-13, -13] },
      { n: 'Fountain Show', price: 60000, kind: 'deco', look: 'fountain', bonus: 0.1, pad: [-15.5, 11.5] },
      { n: 'Moving Walkways', price: 90000, kind: 'speed', sp: 20, pad: [-1, 13] },
      { n: 'Ferris Wheel', price: 110000, kind: 'up', look: 'ferris', mul: 1.5, at: [0, -20], say: '🎡 Ride it yourself!', pad: [0, -13] },
      { n: 'Blimp Port', price: 170000, kind: 'src', look: 'blimp', v: 500, every: 6, batch: 4, at: [-6, 25], drop: 0, pad: [-20, 26.4, 0] },
      { n: 'Cotton Candy Stand', price: 250000, kind: 'up', look: 'food', food: ['🍭 Cotton Candy', 0xf5d0fe, 0xa855f7], mul: 1.25, at: [-8, -20], stand: [-8, -23, 0], pad: [-8, -22.6] },
      { n: 'Drop Tower', price: 380000, kind: 'up', look: 'drop', mul: 1.5, at: [20, -13], say: '🗼 Ride it yourself!', pad: [13, -13] },
      { n: 'Fireworks', price: 600000, kind: 'deco', look: 'fireworks', bonus: 0.2, pad: [21.6, 21.6] },
      { n: 'Bumper Cars', price: 850000, kind: 'up', look: 'bumper', mul: 1.5, at: [8, 8], pad: [0, 1] },
      { n: 'Teleporter', price: 1300000, kind: 'src', look: 'teleporter', v: 6000, every: 4.2, batch: 3, at: [-6, 25], drop: 0, pad: [-6, 27.4, 0] },
      { n: 'Roller Coaster', price: 2800000, kind: 'up', look: 'coaster', mul: 1.5, at: [8, 20], say: '🎢 Ride it yourself!', pad: [21, 17] },
      { n: 'Golden Castle', price: 9000000, kind: 'deco', look: 'castle', bonus: 0.25, pad: [0, -27, 0] },
    ],

    tyWorld() {
      const s = label('🎢 THEME PARK\nTYCOON', { size: 3.2, color: '#fdf2f8' }); s.position.set(0, 13, -8); place.add(s);
      slab(0, 0.2, 0, 14, 14, 0xf9a8d4, { sy: 0.4 });
      for (const pl of this.plots) { const len = Math.abs(pl.oz) - 24 - 7; part({ x: pl.ox, y: 0.075, z: Math.sign(pl.oz) * (7 + len / 2), sx: 6, sy: 0.15, sz: len, c: 0xd6b98c, plain: true }); if (pl.oz < 0) part({ x: pl.ox / 2 + Math.sign(pl.ox) * 3, y: 0.075, z: 0, sx: Math.abs(pl.ox), sy: 0.15, sz: 6, c: 0xd6b98c, plain: true }); }
      // balloons over the middle
      const r = mulberry(31337);
      for (let i = 0; i < 10; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), M(SHIRTS[i % SHIRTS.length])); b.position.set((r() - 0.5) * 12, 9 + r() * 4, (r() - 0.5) * 12); place.add(b); }
    },
    tyBase(pl, add) {
      pl.ferris = pl.drop = pl.coaster = null; // (set again by the rides still standing)
      // the path round the park, and the gate
      const fast = this.speedOf(pl.b) >= 20;
      for (const g of this.ty.path.segs) { const ax = Math.abs(g.dx) > 0.5; add((g.x0 + g.x1) / 2, 0.5, (g.z0 + g.z1) / 2, ax ? g.len + 3.4 : 3.4, 0.1, ax ? 3.4 : g.len + 3.4, fast ? 0x94a3b8 : 0xd6b98c, { plain: true, solid: false }); }
      for (const x of [-8.2, -3.8]) add(x, 6.5, 23.5, 0.8, 6, 0.8, 0xf472b6);
      add(-6, 7.2, 23.5, 6, 1, 1, 0x8b5cf6);
      const [gx, gz] = this.W(pl, -6, 23.5), l = label('🎟️ Park Entrance', { size: 0.9 }); l.position.set(gx, 8.6, gz); place.add(l); pl.decor.push(l);
      for (const x of [6.2, 9.8]) add(x, 4.5, 23.5, 0.6, 4, 0.6, 0x94a3b8);
      const [ex, ez] = this.W(pl, 8, 23.5), e = label('👋 Exit', { size: 0.8 }); e.position.set(ex, 5.6, ez); place.add(e); pl.decor.push(e);
      // the ring toss
      add(15, 1.6, 13, 6, 1.2, 2.4, 0xfde68a); add(15, 5.2, 13.6, 6.4, 0.4, 3.2, 0xec4899);
      for (const x of [12.2, 17.8]) add(x, 5, 14.6, 0.3, 3.6, 0.3, 0xf8fafc);
      for (let k = 0; k < 5; k++) add(12.8 + k * 1.1, 2.6, 12.6, 0.3, 0.8, 0.3, [0x22c55e, 0x3b82f6, 0xef4444, 0xfacc15, 0xa855f7][k], { solid: false });
      const [rx, rz] = this.W(pl, 15, 13), t = label('🎯 Ring Toss', { size: 0.9 }); t.position.set(rx, 6.6, rz); place.add(t); pl.decor.push(t);
    },
    tyItem(pl, it, i, add) {
      const L = it.look, anim = (f) => pl.anim.push(f), ph = () => 1 - (pl.tm[i] == null ? 0 : pl.tm[i]) / it.every;
      if (L === 'booth') { add(it.lx, 3.4, 21.5, 3, 3, 2.6, 0xfbbf24); add(it.lx, 3.8, 21.5, 3.4, 0.4, 3, 0xdc2626); add(it.lx, 2.6, 22.85, 1.6, 1, 0.1, 0x0f172a, { plain: true }); }
      else if (L === 'parking') {
        add(-16, 0.5, 22, 10, 0.1, 4.4, 0x374151, { plain: true, solid: false });
        for (const [k, x] of [-19.5, -16, -12.5].entries()) { add(x, 1.4, 22, 2, 1, 3.4, SHIRTS[k + 2]); add(x, 2.2, 22.3, 1.7, 0.7, 1.8, 0xbae6fd); }
      } else if (L === 'bus' || L === 'train') {
        const g = new THREE.Group(), long = L === 'train' ? 18 : 9;
        if (L === 'train') { for (let c = 0; c < 3; c++) { box(g, c ? 0x2563eb : 0xdc2626, 6, 3, 2.6, -c * 6.3, 1.8, 0); box(g, 0xbae6fd, 5, 0.9, 2.7, -c * 6.3, 2.5, 0); } box(g, 0x111827, 1, 1.6, 1, 2.5, 3.8, 0); add(0, 0.42, 30, 60, 0.05, 2.4, 0x78716c, { plain: true, solid: false }); }
        else { box(g, 0xfacc15, long, 3.4, 3, 0, 2.2, 0); box(g, 0x0f172a, long - 1.6, 1, 3.1, 0, 2.9, 0); for (const x of [-3, 3]) for (const z of [-1.4, 1.4]) { const w = cyl(g, 0x111827, 0.6, 0.4, x, 0.6, z); w.rotation.x = Math.PI / 2; } add(-12, 3.2, 27.5, 3, 0.3, 1.8, 0x22c55e); add(-12, 1.6, 28.2, 0.3, 3, 0.3, 0x475569); }
        this.deco(pl, g, 0, 0.4, L === 'train' ? 30 : 27.6);
        // drives in, stops at the gate, drives on
        // (the guests get off as each period starts: it's stopped at the gate then)
        anim(() => { const p = ph(), e = (u) => u * u * (3 - 2 * u), off = p < 0.12 ? 0 : p < 0.3 ? e((p - 0.12) / 0.18) : p < 0.7 ? 1 : p < 0.88 ? -1 + e((p - 0.7) / 0.18) : 0; const [x] = this.W(pl, -6 + off * 40 + (L === 'train' ? 6 : 0), 0); g.position.x = x; g.visible = Math.abs(off) < 0.999; });
      } else if (L === 'hotel') {
        add(-30, 16.4, 16, 8, 16, 10, 0xfda4af); for (let f = 0; f < 5; f++) add(-25.95, 3 + f * 3, 16, 0.2, 1.4, 8, 0xbae6fd, { plain: true });
        add(-30, 17, 16, 9, 1, 11, 0xbe123c); const [hx, hz] = this.W(pl, -30, 16), l = label('🏨 Hotel', { size: 1 }); l.position.set(hx, 19, hz); place.add(l); pl.decor.push(l);
      } else if (L === 'blimp') {
        const g = new THREE.Group(), body = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), M(0xe5e7eb)); body.scale.set(7, 2.4, 2.4); g.add(body);
        box(g, 0xec4899, 2.4, 1, 1.2, 0, -2.6, 0); box(g, 0xec4899, 1.2, 2.4, 0.2, -6.6, 0.8, 0);
        const t = label('🎢 PARK', { size: 1 }); t.position.set(0, 0, 2.5); g.add(t);
        this.deco(pl, g, -14, 22, 30);
        anim((dt, t2) => { const p = ph(); g.position.y = 6 + Math.sin(p * Math.PI) * 18; g.rotation.y = Math.sin(t2 / 4000) * 0.2; });
      } else if (L === 'teleporter') {
        const g = new THREE.Group(), ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.3, 8, 24), new THREE.MeshBasicMaterial({ color: 0x22d3ee })); ring.rotation.x = Math.PI / 2; g.add(ring);
        const beam = cyl(g, new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.3, depthWrite: false }), 2.2, 8, 0, 4, 0);
        this.deco(pl, g, -6, 0.6, 27);
        anim((dt, t2) => { ring.rotation.z += dt * 3; beam.material.opacity = 0.2 + (ph() > 0.9 ? 0.4 : 0) + Math.sin(t2 / 150) * 0.05; });
      } else if (L === 'food') {
        const [name, c1, c2] = it.food, [sx, sz, f] = it.stand, g = new THREE.Group();
        box(g, c1, 3.6, 2.4, 2.2, 0, 1.2, 0); box(g, c2, 4, 0.4, 2.8, 0, 4.6, 0); for (const x of [-1.7, 1.7]) box(g, 0xf8fafc, 0.25, 2.2, 0.25, x, 3.4, 0.9);
        const t = label(name, { size: 0.8 }); t.position.set(0, 5.6, 0); g.add(t);
        g.rotation.y = f === 1 ? -Math.PI / 2 : f === -1 ? Math.PI / 2 : 0;
        this.deco(pl, g, sx, 0.4, sz);
      } else if (L === 'carousel' || L === 'teacups' || L === 'swing' || L === 'bumper') this.spinRide(pl, L, add, anim);
      else if (L === 'ferris') {
        const [x, z] = RIDE.ferris, g = new THREE.Group(), wheel = new THREE.Group(), H = 9.5, R = 7;
        for (const s of [-1, 1]) { const leg = box(g, 0x94a3b8, 0.5, 11, 0.5, s * 3, 5, 0.9); leg.rotation.z = s * 0.3; const leg2 = box(g, 0x94a3b8, 0.5, 11, 0.5, s * 3, 5, -0.9); leg2.rotation.z = s * 0.3; }
        const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.25, 6, 40), M(0xec4899)); wheel.add(rim);
        for (let k = 0; k < 8; k++) { const sp = box(wheel, 0xf8fafc, 0.2, R * 2, 0.2, 0, 0, 0); sp.rotation.z = k * Math.PI / 8; }
        const cars = [];
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, c = new THREE.Group(); box(c, SHIRTS[k], 1.8, 1.4, 1.6, 0, -1.2, 0); box(c, 0x475569, 0.15, 1, 0.15, 0, -0.2, 0); c.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); wheel.add(c); cars.push(c); }
        wheel.position.y = H; g.add(wheel); cyl(g, 0x475569, 0.7, 2.6, 0, H, 0).rotation.x = Math.PI / 2;
        this.deco(pl, g, x, 0.4, z);
        add(x, 0.8, z + 3.5, 4, 0.4, 2.6, 0x64748b);
        pl.ferris = { wheel, cars };
        anim((dt) => { wheel.rotation.z += dt * 0.45; for (const c of cars) c.rotation.z = -wheel.rotation.z; });
      } else if (L === 'drop') {
        const [x, z] = RIDE.drop, g = new THREE.Group(), H = 24;
        box(g, 0x64748b, 1.6, H, 1.6, 0, H / 2, 0); cyl(g, 0xdc2626, 1.4, 1.6, 0, H + 0.8, 0);
        const car = new THREE.Group(); cyl(car, 0xfacc15, 2.6, 1, 0, 0, 0); for (let k = 0; k < 6; k++) box(car, SHIRTS[k], 0.8, 1, 0.8, Math.cos(k) * 2.2, 0.8, Math.sin(k) * 2.2); g.add(car);
        this.deco(pl, g, x, 0.4, z);
        add(x, 2.4, z, 2, 4, 2, 0x64748b);
        pl.drop = { car };
        anim((dt, t) => { const p = ((t / 1000 + pl.k) % 9) / 9, y = p < 0.55 ? 1.5 + (p / 0.55) * 19 : p < 0.65 ? 20.5 : p < 0.72 ? 20.5 - ((p - 0.65) / 0.07) ** 2 * 19 : 1.5; car.position.y = y; pl.drop.y = y; });
      } else if (L === 'coaster') {
        const g = new THREE.Group(), { curve, tube: tubeGeo } = coasterGeo(), tube = new THREE.Mesh(tubeGeo, M(0xdc2626)); g.add(tube);
        const len = curve.getLength();
        for (let d = 0; d < len; d += 6) { const p = curve.getPointAt(d / len); box(g, 0xf8fafc, 0.35, p.y, 0.35, p.x, p.y / 2, p.z); }
        const cars = []; for (let k = 0; k < 4; k++) { const c = new THREE.Group(); box(c, k ? 0x2563eb : 0xfacc15, 1.6, 0.9, 2.2, 0, 0.6, 0); box(c, 0x0f172a, 1.4, 0.4, 0.6, 0, 1.2, 0.8); g.add(c); cars.push(c); }
        this.deco(pl, g, 0, 0.4, 0);
        add(21, 0.5, 17, 4, 0.1, 4, 0xfacc15, { plain: true, solid: false });
        const [lx2, lz2] = this.W(pl, 21, 17), l = label('🎢 Roller Coaster', { size: 0.9 }); l.position.set(lx2, 4, lz2); place.add(l); pl.decor.push(l);
        const C = pl.coaster = { curve, len, cars, u: Math.random() };
        const tmp = new THREE.Vector3();
        anim((dt) => {
          const y = curve.getPointAt(C.u).y, v = 9 + (16 - y) * 1.6; C.u = (C.u + dt * v / len) % 1;
          cars.forEach((c, k) => { const u = (C.u - k * 2.6 / len + 1) % 1; c.position.copy(curve.getPointAt(u)); curve.getTangentAt(u, tmp); c.rotation.set(-Math.asin(clamp(tmp.y, -1, 1)), Math.atan2(tmp.x, tmp.z), 0, 'YXZ'); });
        });
      } else if (L === 'flowers') {
        const cols = [0xf472b6, 0xfacc15, 0xf87171, 0xa78bfa, 0xffffff];
        for (const [x, z, w, d] of [[-23, -10, 1.6, 14], [12, -23, 14, 1.6], [3.5, 19.5, 3, 4]]) { add(x, 0.6, z, w, 0.2, d, 0x65a30d, { plain: true, solid: false }); for (let k = 0; k < 6; k++) add(x + (k / 5 - 0.5) * (w - 1), 1, z + ((k % 2) - 0.5) * (d - 0.8), 0.6, 0.6, 0.6, cols[k % 5], { solid: false }); }
      } else if (L === 'fountain') {
        add(-15.5, 1, 11.5, 6, 0.8, 4.4, 0xe5e7eb); add(-15.5, 1.1, 11.5, 5, 0.2, 3.4, 0x38bdf8, { neon: true, solid: false, alpha: 0.8 });
        anim((dt) => { if (Math.random() < dt * 10) { const [x, z] = this.W(pl, -15.5 + (Math.random() - 0.5) * 3, 11.5 + (Math.random() - 0.5) * 2); puffAt(x, 1.6 + Math.random() * 3, z, [0x7dd3fc, 0xe0f2fe, 0xffffff], 1); } });
      } else if (L === 'fireworks') {
        for (const x of [-22, 22]) add(x, 2.4, 23, 1, 2, 1, 0x1f2937);
        anim(() => { if (Math.random() < 0.012) { const [x, z] = this.W(pl, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40); puffAt(x, 26 + Math.random() * 10, z, CONFETTI, 26); sfx3('pop', x, z, 120, { vol: 0.4 }); } });
      } else if (L === 'castle') {
        const g = new THREE.Group(), gold = new THREE.MeshLambertMaterial({ color: 0xfbbf24, emissive: 0x6b4a00 });
        box(g, gold, 20, 10, 6, 0, 5, 0); for (const x of [-10, -3.5, 3.5, 10]) { cyl(g, gold, 2, 16, x, 8, 0); const r = new THREE.Mesh(new THREE.ConeGeometry(2.6, 5, 10), M(0x7c3aed)); r.position.set(x, 18.5, 0); g.add(r); }
        box(g, 0x7c2d12, 4, 6, 0.4, 0, 3, 3.1);
        this.deco(pl, g, 0, 0.4, -31);
      }
    },
    // the rides that spin round
    spinRide(pl, L, add, anim) {
      const [x, z] = RIDE[L], g = new THREE.Group(), spin = new THREE.Group(); g.add(spin);
      if (L === 'carousel') {
        cyl(g, 0xfde68a, 4.4, 0.6, 0, 0.3, 0); cyl(g, 0xdb2777, 0.4, 7, 0, 3.8, 0);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(5, 2.4, 12), M(0xec4899)); roof.position.y = 8.2; spin.add(roof);
        const horses = [];
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, h = new THREE.Group(); box(h, 0xf8fafc, 0.6, 1.2, 1.8, 0, 0, 0); box(h, 0xf8fafc, 0.5, 0.9, 0.6, 0, 0.8, 0.8); box(h, 0xfacc15, 0.12, 7, 0.12, 0, 2.5, 0); h.position.set(Math.cos(a) * 3.4, 2.6, Math.sin(a) * 3.4); h.rotation.y = -a; spin.add(h); horses.push(h); }
        anim((dt, t) => { spin.rotation.y += dt * 0.8; horses.forEach((h, k) => { h.position.y = 2.6 + Math.sin(t / 300 + k * 1.6) * 0.5; }); });
        add(x, 1, z, 9, 0.6, 9, 0, { alpha: 0, plain: true }).m.visible = false;
      } else if (L === 'teacups') {
        cyl(spin, 0x67e8f9, 5, 0.4, 0, 0.3, 0);
        const cups = [];
        for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, c = new THREE.Group(); const m = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1, 1.4, 12, 1, true), new THREE.MeshLambertMaterial({ color: SHIRTS[k + 3], side: THREE.DoubleSide })); m.position.y = 0.7; c.add(m); cyl(c, 0xf8fafc, 1, 0.1, 0, 0.1, 0); c.position.set(Math.cos(a) * 3, 0.5, Math.sin(a) * 3); spin.add(c); cups.push(c); }
        anim((dt) => { spin.rotation.y += dt * 0.6; for (const c of cups) c.rotation.y += dt * 2.4; });
      } else if (L === 'swing') {
        cyl(g, 0x94a3b8, 0.5, 10, 0, 5, 0); const top = cyl(spin, 0x8b5cf6, 3, 0.8, 0, 10, 0);
        const arms = [];
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, arm = new THREE.Group(); arm.position.set(Math.cos(a) * 2.8, 9.6, Math.sin(a) * 2.8); arm.rotation.y = -a; box(arm, 0xe5e7eb, 0.08, 5, 0.08, 0, -2.5, 0); box(arm, SHIRTS[k], 0.8, 0.3, 0.8, 0, -5, 0); spin.add(arm); arms.push(arm); }
        anim((dt) => { spin.rotation.y += dt * 1.6; for (const a of arms) a.rotation.z = -0.6; });
        top.castShadow = true;
      } else if (L === 'bumper') {
        box(g, 0x334155, 12, 0.2, 9, 0, 0.1, 0); for (const [bx, bz, sx, sz] of [[0, -4.5, 12, 0.3], [0, 4.5, 12, 0.3], [-6, 0, 0.3, 9], [6, 0, 0.3, 9]]) box(g, 0xfacc15, sx, 0.8, sz, bx, 0.4, bz);
        const cars = [];
        for (let k = 0; k < 5; k++) { const c = new THREE.Group(); box(c, SHIRTS[k], 1.6, 0.7, 2, 0, 0.6, 0); box(c, 0x111827, 1.8, 0.3, 2.2, 0, 0.3, 0); box(c, 0x94a3b8, 0.1, 2.4, 0.1, 0, 1.8, 0.6); c.position.set((k - 2) * 2, 0, (k % 2) * 2 - 1); c.userData.a = k * 1.3; g.add(c); cars.push(c); }
        anim((dt) => { for (const c of cars) { c.userData.a += (Math.random() - 0.5) * dt * 3; const a = c.userData.a; c.position.x += Math.sin(a) * dt * 4; c.position.z += Math.cos(a) * dt * 4; if (Math.abs(c.position.x) > 5) { c.position.x = Math.sign(c.position.x) * 5; c.userData.a = -a; } if (Math.abs(c.position.z) > 3.6) { c.position.z = Math.sign(c.position.z) * 3.6; c.userData.a = Math.PI - a; } c.rotation.y = c.userData.a; } });
      }
      this.deco(pl, g, x, 0.4, z);
    },
    // (half a ticket at the gate; what they're worth by the end on the way out)
    tyProd(pl, it) { if (pl.mine) { const [x, z] = this.W(pl, -6, 23); this.gain(it.v * this.mult(pl) * 0.5, x, z); } return guest(SHIRTS[Math.floor(Math.random() * SHIRTS.length)]); },
    // a guest who's just been on a ride jumps for joy
    tyUp(pl, pr) { pr.hop = 0.6; },
    tyAnim(pl, dt, t) { for (const c of pl.prods) { if (c.hop > 0) { c.hop -= dt; c.m.position.y += Math.sin((0.6 - c.hop) / 0.6 * Math.PI) * 1.4; } else c.m.position.y += Math.abs(Math.sin(t / 140 + c.s)) * 0.18; } },

    /* ---- ride the big rides yourself; the ring toss ---- */
    async tyEnter(s) { this.rides = Math.max(0, s.rides | 0); this.rideOn = null; this.tossAt = 0; },
    tySave() { return { rides: this.rides }; },
    tyLeave() { if (this.rideOn) this.getOff(true); },
    speed() { return this.rideOn ? 0 : 16; },
    gravity() { return this.rideOn ? 0 : GRAV; },
    tyPrompts() {
      if (this.tg || P.dead) return [];
      if (this.rideOn) return [{ x: P.x, z: P.z, r: 99, y: P.y, text: '🚪 Get off', fn: () => this.getOff() }];
      const out = [];
      for (const pl of this.plots) {
        if (!pl.owner) continue;
        const has = (look) => this.items.some((it, i) => it.look === look && this.ty.has(pl.b, i));
        const at = (lx, lz, text, fn) => { const [x, z] = this.W(pl, lx, lz); out.push({ x, z, r: 3, text, fn }); };
        if (has('ferris') && pl.ferris) at(RIDE.ferris[0], RIDE.ferris[1] + 3.5, '🎡 Ride the Ferris wheel', () => this.ride(pl, 'ferris'));
        if (has('drop') && pl.drop) at(RIDE.drop[0], RIDE.drop[1] + 3, '🗼 Ride the drop tower', () => this.ride(pl, 'drop'));
        if (has('coaster') && pl.coaster) at(21, 17, '🎢 Ride the roller coaster', () => this.ride(pl, 'coaster'));
        if (pl.mine) at(15, 15, `🎯 Ring toss · ${money(this.tossCost())}`, () => this.toss());
      }
      return out;
    },
    ride(pl, kind) {
      this.rideOn = { pl, kind, t: 0, len: kind === 'ferris' ? 14 : kind === 'drop' ? 9 : 0, u0: kind === 'coaster' ? pl.coaster.u : 0, laps: 0 };
      this.rides++; quest('park.ride'); sfx('whoosh'); toast(kind === 'coaster' ? '🎢 Hold on tight!' : kind === 'drop' ? '🗼 Going up…' : '🎡 Enjoy the view!', '#fde68a');
    },
    getOff(quiet) {
      const R = this.rideOn; if (!R) return;
      this.rideOn = null;
      const pl = R.pl, [lx, lz] = R.kind === 'coaster' ? [21, 19] : R.kind === 'drop' ? [RIDE.drop[0], RIDE.drop[1] + 4.5] : [RIDE.ferris[0], RIDE.ferris[1] + 5], [x, z] = this.W(pl, lx, lz);
      Object.assign(P, { x, y: 0.6, z, vx: 0, vy: 0, vz: 0 }); P.ground = null;
      if (!quiet) { sfx('pop'); puffAt(x, 2, z, CONFETTI, 12); }
    },
    tyTick(dt) {
      const R = this.rideOn; if (!R) return;
      const pl = R.pl, v = new THREE.Vector3();
      if (!pl.owner || P.dead || !(R.kind === 'ferris' ? pl.ferris : R.kind === 'drop' ? pl.drop : pl.coaster)) { this.getOff(true); return; }
      R.t += dt;
      if (R.kind === 'ferris' && pl.ferris) { const c = pl.ferris.cars[0]; c.updateMatrixWorld(true); c.getWorldPosition(v); v.y -= 1.6; }
      else if (R.kind === 'drop' && pl.drop) { pl.drop.car.updateMatrixWorld(true); pl.drop.car.getWorldPosition(v); v.x += 2.4; v.y += 0.4; }
      else if (R.kind === 'coaster' && pl.coaster) { const c = pl.coaster.cars[0]; c.updateMatrixWorld(true); c.getWorldPosition(v); v.y += 0.6; if (pl.coaster.u < R.lastU) R.laps++; R.lastU = pl.coaster.u; if (R.laps >= 1 && R.t > 6) { this.getOff(); toast('🎢 What a ride!', '#86efac'); return; } }
      Object.assign(P, { x: v.x, y: v.y, z: v.z, vx: 0, vy: 0, vz: 0 });
      if (R.len && R.t > R.len) { this.getOff(); toast('That was fun!', '#86efac'); }
    },
    pose() { if (this.rideOn && me && !me.dead) { me.legL.rotation.x = me.legR.rotation.x = Math.PI / 2; me.armL.rotation.x = me.armR.rotation.x = Math.PI * 0.9; me.body.position.y = -1; } },
    tossCost() { return Math.max(15, Math.round(this.rate() * 5)); },
    toss() {
      const cost = this.tossCost();
      if (performance.now() < this.tossAt) return;
      if (this.cash < cost) { toast(`You need ${money(cost)} for a go`, '#fca5a5'); sfx('error'); return; }
      this.cash -= cost; this.tossAt = performance.now() + 1200;
      this.timing({ title: '🎯 Throw the ring onto a bottle!', btn: '🎯 Throw!', zone: 0.18, speed: 1.5, time: 6, done: (sc) => {
        if (sc < 0) { toast('🎯 Missed! Try again', '#fca5a5'); sfx('error', { gap: 300 }); return; }
        if (Math.random() < (sc > 0 ? (hasItem('rings') ? 1 : 0.6) : 0.25)) {
          const w = [0, 0, 60, 28, 9, 3]; let roll = Math.random() * 100, r = 2; while (r < 5 && roll >= w[r]) { roll -= w[r]; r++; }
          const opts = FINDS.map((F, f) => [F, f]).filter(([F]) => F.r === r); this.gotFind(opts[Math.floor(Math.random() * opts.length)][1], 'You won');
        } else { toast(sc > 0 ? '🎯 Ringer! …but no prize this time' : '🎯 Close! It bounced off', '#fde68a'); sfx('bounce'); }
      } });
    },
    tyHud() { return this.rideOn ? '🎢 riding!' : ''; },
    coinShop: [
      { id: 'cash2', e: '💵', n: '2× Cash', d: 'Every guest pays double, for good', price: 700, kind: 'pass' },
      { id: 'rings', e: '💍', n: 'Lucky Rings', d: 'The ring toss gives a plushie every time you land a ringer, for good', price: 400, kind: 'pass' },
      shopSpeed(200, 1.25),
      { id: 'crate', e: '💰', n: 'Cash Crate', d: 'A minute of your park’s cash (at least $300), right now', price: 40, kind: 'now' },
    ],
  });
  addExp(TP);
  window.__rbTP = TP;
})();
