/* =====================================================================
   BLOXVERSE — CAR FACTORY TYCOON. Claim a factory. Presses stamp out
   frames for hatchbacks, sedans, pickups, sports cars, supercars,
   hypercars and rocket cars; the assembly line puts in the engine, the
   wheels, the paint and the chrome (each doubles what the car is worth)
   and the finished cars drive off the lot, sold. Your best model turns
   in your showroom: take it for a test drive round the track that runs
   round the whole place, for lap times, cash and trophies. A car
   carrier and a racing team bring in more. Rebirth at the end.
   ===================================================================== */
(() => {
  const MODELS = [
    { n: 'Hatchback', c: 0x60a5fa, len: 3, top: 42 }, { n: 'Sedan', c: 0xdc2626, len: 3.6, top: 46 }, { n: 'Pickup', c: 0x16a34a, len: 4, top: 48, bed: true },
    { n: 'Sports Car', c: 0xfacc15, len: 3.6, top: 58, low: true }, { n: 'Supercar', c: 0xf97316, len: 3.8, top: 66, low: true, wide: true },
    { n: 'Hypercar', c: 0xa855f7, len: 4, top: 76, low: true, wide: true, fins: true }, { n: 'Rocket Car', c: 0xe5e7eb, len: 4.2, top: 90, low: true, rocket: true },
  ];
  const FINDS = [
    { n: 'Bronze Trophy', e: '🥉', r: 2, v: 500 }, { n: 'Checkered Flag', e: '🏁', r: 2, v: 500 }, { n: 'Racing Gloves', e: '🧤', r: 2, v: 600 }, { n: 'Lucky Keyring', e: '🔑', r: 2, v: 600 },
    { n: 'Silver Trophy', e: '🥈', r: 3, v: 2500 }, { n: 'Golden Wrench', e: '🔧', r: 3, v: 3000 }, { n: 'Racing Helmet', e: '⛑️', r: 3, v: 3000 },
    { n: 'Gold Trophy', e: '🥇', r: 4, v: 15000 }, { n: 'Diamond Wheel', e: '💎', r: 4, v: 20000 },
    { n: 'Champion Cup', e: '🏆', r: 5, v: 90000 }, { n: 'Rocket Engine', e: '🚀', r: 5, v: 100000 },
  ];
  const mats = new Map(), M = (c, o) => { const k = c + (o ? JSON.stringify(o) : ''); let m = mats.get(k); if (!m) { m = new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {})); mats.set(k, m); } return m; };
  const box = (g, c, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(BOX, typeof c === 'number' ? M(c) : c); m.scale.set(sx, sy, sz); m.position.set(x, y, z); g.add(m); return m; };
  const WHEEL = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12);
  // a car along +x, built up stage by stage: 0 frame, 1 + engine, 2 + wheels, 3 + body and paint, 4 + chrome
  function carParts(g, k, stage) {
    const D = MODELS[k], L = D.len, W = D.wide ? 1.9 : 1.75, low = D.low ? 0.75 : 1;
    if (stage === 0) { box(g, 0x374151, L, 0.3, W - 0.2, 0, 0.5, 0); box(g, 0x4b5563, 0.2, 0.3, W - 0.3, L / 2 - 0.3, 0.75, 0); box(g, 0x4b5563, 0.2, 0.3, W - 0.3, -L / 2 + 0.3, 0.75, 0); }
    if (stage === 1) box(g, D.rocket ? 0x0ea5e9 : 0x6b7280, 0.9, 0.55, 1, L / 2 - 0.7, 0.9, 0);
    if (stage === 2) for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = new THREE.Mesh(WHEEL, M(0x111827)); w.rotation.x = Math.PI / 2; w.position.set(sx * (L / 2 - 0.65), 0.42, sz * W / 2); g.add(w); }
    if (stage === 3) {
      box(g, D.c, L, 0.62 * low, W, 0, 0.98, 0);
      if (D.bed) { box(g, 0xbae6fd, L * 0.32, 0.6, W - 0.2, L * 0.12, 1.6, 0); box(g, D.c, L * 0.32, 0.6, W, L * 0.12 + 0.02, 1.25, 0); }
      else box(g, 0xbae6fd, L * (D.low ? 0.38 : 0.48), 0.6 * low, W - 0.25, -L * 0.05, 1.28 + 0.3 * low, 0);
      if (D.fins) for (const sz of [-1, 1]) box(g, D.c, 1, 0.7, 0.1, -L / 2 + 0.5, 1.5, sz * (W / 2 - 0.1));
      if (D.rocket) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.4, 10), M(0x94a3b8)); r.rotation.z = Math.PI / 2; r.position.set(-L / 2 - 0.4, 1.1, 0); g.add(r); const f = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 })); f.rotation.z = Math.PI / 2; f.position.set(-L / 2 - 1.5, 1.1, 0); g.add(f); }
    }
    if (stage === 4) { box(g, M(0xfacc15, { emissive: 0x5a4500 }), L + 0.05, 0.1, W + 0.05, 0, 0.75, 0); if (D.low || D.bed) { box(g, 0x111827, 0.5, 0.1, W, -L / 2 + 0.25, 1.75, 0); for (const sz of [-0.6, 0.6]) box(g, 0x111827, 0.1, 0.4, 0.1, -L / 2 + 0.25, 1.5, sz); } }
  }
  function carMesh(k, upTo = 4) { const g = new THREE.Group(); for (let s = 0; s <= upTo; s++) carParts(g, k, s); g.userData.k = k; return g; }
  const STATION = { engine: [0x6b7280, '🔧 Engine', 1], wheels: [0x111827, '🛞 Wheels', 2], paint: [0xec4899, '🎨 Paint Shop', 3], chrome: [0xfacc15, '✨ Chrome', 4] };
  // the test track, round the outside of everything (counter-clockwise from the start line)
  const TR = 112, TW = 12, CORNERS = [[TR, TR], [TR, -TR], [-TR, -TR], [-TR, TR]];

  const CF = tycoonKit({
    id: 'cars', code: 'cf', saveKey: 'cf', rank: 0.0009, name: 'Car Factory Tycoon', emoji: '🚗', noun: 'Car Factory', camDist: 22,
    color: 'linear-gradient(135deg,#334155,#ef4444)',
    desc: 'Claim a car factory. Presses stamp out frames and the assembly line adds the engine, wheels, paint and chrome before every car drives off sold. Build hatchbacks up to hypercars and rocket cars, then take your best one for a test drive round the track for lap times, cash and trophies. Rebirth for more cash for good.',
    welcome: 'Step on a claim pad to get a car factory!',
    land: { theme: 'autumn', fence: 'wood' },
    skyCols: ['#93c5fd', '#f1f5f9'], ground: 0x7cb342, speed0: 8, prodLift: 0,
    path: [[-22, -15], [18, -15], [18, -3], [-2, -3]], padAt: [-6, 11], speedPad: [21.75, -14], caseAt: [-15, 19], caseName: '🏆 Trophy cabinet', caseShort: 'Trophies', prod: 'car', make: 'Builds more cars',
    findHow: 'Trophies come from laps of the test track (the quicker the lap, the likelier).',
    FINDS,
    items: [
      { n: 'Hatchback Press', price: 0, kind: 'src', model: 0, v: 4, every: 3.2, at: [-21, -15], drop: 1 },
      { n: 'Hatchback Press 2', price: 25, kind: 'src', model: 0, v: 6, every: 3.2, at: [-16.5, -15], drop: 1 },
      { n: 'Faster Line', price: 75, kind: 'speed', sp: 11 },
      { n: 'Engine Station', price: 160, kind: 'up', look: 'engine', at: [10.5, -15] },
      { n: 'Sedan Press', price: 320, kind: 'src', model: 1, v: 10, every: 4, at: [-12, -15], drop: 1 },
      { n: 'Flags', price: 500, kind: 'deco', look: 'flags', bonus: 0.05, pad: [-6, 21] },
      { n: 'Pickup Press', price: 900, kind: 'src', model: 2, v: 24, every: 3.2, at: [-7.5, -15], drop: 1 },
      { n: 'Wheel Station', price: 1600, kind: 'up', look: 'wheels', at: [15, -15], pad: [13, -9.5] },
      { n: 'Car Carrier', price: 2600, kind: 'pay', look: 'carrier', v: 150, every: 9, pad: [-21, 2] },
      { n: 'Sports Car Press', price: 4500, kind: 'src', model: 3, v: 70, every: 3.2, at: [-3, -15], drop: 1 },
      { n: 'Factory Walls', price: 8000, kind: 'deco', look: 'walls', bonus: 0.1, pad: [-21.5, -6] },
      { n: 'Supercar Press', price: 14000, kind: 'src', model: 4, v: 220, every: 2.8, at: [1.5, -15], drop: 1 },
      { n: 'Paint Shop', price: 40000, kind: 'up', look: 'paint', at: [18, -10], pad: [21.75, -10] },
      { n: 'Racing Team', price: 60000, kind: 'pay', look: 'race', v: 3500, every: 12, pad: [21, 20] },
      { n: 'Turbo Line', price: 90000, kind: 'speed', sp: 15 },
      { n: 'Neon Sign', price: 110000, kind: 'deco', look: 'neon', bonus: 0.15, pad: [3, 20] },
      { n: 'Hypercar Press', price: 170000, kind: 'src', model: 5, v: 1000, every: 3, at: [6, -15], drop: 1 },
      { n: 'Trophy Statue', price: 250000, kind: 'deco', look: 'trophy', bonus: 0.2, pad: [-3, 4] },
      { n: 'Chrome Station', price: 380000, kind: 'up', look: 'chrome', at: [18, -6], pad: [21.75, -6] },
      { n: 'Robot Arms', price: 600000, kind: 'pay', look: 'robots', v: 15000, every: 8, pad: [-9, -11] },
      { n: 'Test Track Lights', price: 850000, kind: 'deco', look: 'lights', bonus: 0.2, pad: [21.5, 13] },
      { n: 'Rocket Car Press', price: 1300000, kind: 'src', model: 6, v: 12000, every: 2.8, at: [-25, -15], back: true, drop: 1 },
      { n: 'Car Show', price: 2800000, kind: 'pay', look: 'show', v: 60000, every: 12, say: '📸 The crowds love it!', pad: [-14, -7] },
      { n: 'Golden Car', price: 9000000, kind: 'deco', look: 'golden', bonus: 0.25, pad: [-9, 4] },
    ],

    /* ---- the world: roads to every factory, and the test track round the outside ---- */
    tyWorld() {
      const s = label('🚗 CAR FACTORY\nTYCOON', { size: 3.2, color: '#f1f5f9' }); s.position.set(0, 12, -8); place.add(s);
      slab(0, 0.2, 0, 14, 14, 0x64748b, { sy: 0.4 });
      for (const pl of this.plots) { const len = Math.abs(pl.oz) - 24 - 7; part({ x: pl.ox, y: 0.075, z: Math.sign(pl.oz) * (7 + len / 2), sx: 6, sy: 0.15, sz: len, c: 0x475569, plain: true }); if (pl.oz < 0) part({ x: pl.ox / 2 + Math.sign(pl.ox) * 3, y: 0.075, z: 0, sx: Math.abs(pl.ox), sy: 0.15, sz: 6, c: 0x475569, plain: true }); }
      // the track: four straights, kerbs on the inside, the start line in the middle of the front straight
      for (const [x, z, sx, sz] of [[0, TR, 2 * TR + TW, TW], [0, -TR, 2 * TR + TW, TW], [TR, 0, TW, 2 * TR - TW], [-TR, 0, TW, 2 * TR - TW]]) part({ x, y: 0.06, z, sx, sy: 0.12, sz, c: 0x374151, plain: true, solid: false });
      for (const [x, z, sx, sz] of [[0, TR - TW / 2, 2 * TR - TW, 0.6], [0, -TR + TW / 2, 2 * TR - TW, 0.6], [TR - TW / 2, 0, 0.6, 2 * TR - TW], [-TR + TW / 2, 0, 0.6, 2 * TR - TW]]) part({ x, y: 0.14, z, sx, sy: 0.1, sz, c: 0xffffff, stripes: '#ef4444', solid: false });
      for (let k = 0; k < 6; k++) part({ x: (k % 2) - 0.5, y: 0.15, z: TR - TW / 2 + 1 + k * 2, sx: 1, sy: 0.08, sz: 2, c: k % 2 ? 0xffffff : 0x111827, plain: true, solid: false });
      for (let k = 0; k < 6; k++) part({ x: 0.5 - (k % 2), y: 0.15, z: TR - TW / 2 + 1 + k * 2, sx: 1, sy: 0.08, sz: 2, c: k % 2 ? 0x111827 : 0xffffff, plain: true, solid: false });
      for (const sx of [-1, 1]) part({ x: 0, y: 4, z: TR + sx * (TW / 2 + 0.6), sx: 0.6, sy: 8, sz: 0.6, c: 0xe5e7eb });
      part({ x: 0, y: 8.3, z: TR, sx: 0.8, sy: 1.2, sz: TW + 1.8, c: 0x111827 });
      const st = label('🏁 TEST TRACK', { size: 1.2 }); st.position.set(0, 10, TR); place.add(st);
    },
    tyBase(pl, add) {
      pl.leaving = [];
      // the showroom, with your best car turning in it
      add(12, 0.7, 12, 10, 0.3, 8, 0xe2e8f0);
      for (const [x, z, sx, sz] of [[12, 8.1, 10, 0.2], [7.1, 12, 0.2, 8], [16.9, 12, 0.2, 8]]) add(x, 6.4, z, sx, 5.7, sz, 0xbae6fd, { alpha: 0.3 });
      add(12, 6.9, 12, 10.4, 0.5, 8.4, 0x1e293b);
      const [sx, sz] = this.W(pl, 12, 16.4), l = label('🚗 Showroom', { size: 1 }); l.position.set(sx, 8.2, sz); place.add(l); pl.decor.push(l);
      const best = this.bestModel(pl.b), turn = new THREE.Group(), table = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.3, 20), M(0x475569)); turn.add(table);
      const car = carMesh(best); car.scale.setScalar(1.25); car.position.y = 0.15; turn.add(car);
      this.deco(pl, turn, 12, 0.85, 12);
      pl.anim.push((dt) => { turn.rotation.y += dt * 0.5; });
      // the SOLD lot at the end of the line
      add(-4, 0.5, -3, 4, 0.1, 4, 0xfacc15, { plain: true, solid: false });
      const [gx, gz] = this.W(pl, -4, -3), g = label('💲 SOLD!', { size: 0.9, bg: 'rgba(22,163,74,.85)' }); g.position.set(gx, 4, gz); place.add(g); pl.decor.push(g);
    },
    bestModel(b) { let k = 0; this.items.forEach((it, i) => { if (it.kind === 'src' && this.ty.has(b, i)) k = Math.max(k, it.model); }); return k; },
    tyItem(pl, it, i, add) {
      const anim = (f) => pl.anim.push(f), ph = () => 1 - (pl.tm[i] == null ? 0 : pl.tm[i]) / it.every;
      if (it.kind === 'src') {
        // a press over the start of the line, stamping down as each frame comes out
        const lx = it.back ? -22 : it.at[0], lz = it.back ? -15 : -19.6, c = MODELS[it.model].c, g = new THREE.Group();
        for (const sx of [-1.6, 1.6]) box(g, 0x475569, 0.5, 6.4, 0.5, sx, 3.2, 0);
        box(g, c, 4, 1, 2.6, 0, 6.6, 0);
        const ram = box(g, 0x94a3b8, 2.6, 0.6, 2, 0, 4, 0);
        if (it.back) { this.deco(pl, g, lx, 0.4, lz); g.rotation.y = Math.PI / 2; } else this.deco(pl, g, lx, 0.4, lz);
        add(it.back ? lx : lx, 1.2, lz, 3.6, 0.8, 2.4, 0x334155);
        anim(() => { const p = ph(); ram.position.y = p > 0.9 ? 4 - (p - 0.9) / 0.1 * 2.2 : p < 0.08 ? 1.8 + p / 0.08 * 2.2 : 4; });
      } else if (it.kind === 'up') {
        const [c, name] = STATION[it.look], g = this.ty.pathAt(it.s)[2], along = Math.abs(g.dx) > 0.5, [lx, lz] = it.at, side = (o) => (along ? [lx, lz + o] : [lx + o, lz]);
        for (const o of [-2.8, 2.8]) { const [x, z] = side(o); add(x, 5.4, z, along ? 3.2 : 0.6, 5, along ? 0.6 : 3.2, 0x64748b); }
        add(lx, 6.4, lz, along ? 3.6 : 6.2, 1, along ? 6.2 : 3.6, c);
        // a robot arm working on each car
        const arm = new THREE.Group(); box(arm, 0xf97316, 0.4, 0.4, 2.6, 0, 0, 1.3); box(arm, 0x334155, 0.6, 0.6, 0.6, 0, 0, 2.6);
        const [ax, az] = side(2.2); this.deco(pl, arm, ax, 4.6, az); if (!along) arm.rotation.y = Math.PI / 2 * pl.fz;
        anim((dt, t) => { arm.rotation.x = 0.6 + Math.sin(t / 220 + i) * 0.35; });
        if (it.look === 'paint') anim((dt) => { if (Math.random() < dt * 6) { const [x, z] = this.W(pl, lx + (Math.random() - 0.5) * 2, lz); puffAt(x, 2.6, z, CONFETTI, 1); } });
        const [x, z] = this.W(pl, lx, lz), l = label(name, { size: 0.9 }); l.position.set(x, 8.2, z); place.add(l); pl.decor.push(l);
      } else if (it.look === 'carrier') {
        const g = new THREE.Group(); box(g, 0xdc2626, 2.4, 2.4, 3, 0, 1.6, 4.2); box(g, 0x334155, 2.4, 0.4, 8, 0, 1, -1.2); box(g, 0x475569, 2.4, 0.3, 7, 0, 3.2, -1.5);
        for (const z of [-3.6, 0]) { const c = carMesh(1 + (z ? 1 : 0)); c.rotation.y = Math.PI / 2; c.position.set(0, 3.35, z); g.add(c); }
        this.deco(pl, g, -28, 0.4, 2);
        anim(() => { const p = ph(), u = p < 0.1 ? 0 : p < 0.45 ? (p - 0.1) / 0.35 : p < 0.55 ? 1 : p < 0.9 ? 1 - (p - 0.55) / 0.35 : 0, [, z] = this.W(pl, -28, 2 + u * 40); g.position.z = z; g.rotation.y = p >= 0.45 && p < 0.9 ? Math.PI : 0; g.visible = u < 0.98; });
      } else if (it.look === 'race') {
        // a race car lapping the test track
        const car = carMesh(3); car.scale.setScalar(1.4); place.add(car); pl.decor.push(car);
        const L = 8 * TR, off = pl.k * L / 4;
        anim((dt, t) => { const d = (t / 1000 * 70 + off) % L, side = Math.floor(d / (2 * TR)), u = (d % (2 * TR)) - TR, lane = (pl.k - 1.5) * 2; let x, z, a; if (side === 0) { x = u; z = TR + lane; a = 0; } else if (side === 1) { x = TR + lane; z = -u; a = Math.PI / 2; } else if (side === 2) { x = -u; z = -TR - lane; a = Math.PI; } else { x = -TR - lane; z = u; a = -Math.PI / 2; } car.position.set(x, 0.2, z); car.rotation.y = a; });
      } else if (it.look === 'robots') {
        for (const lx of [-19, -9, 1]) { const g = new THREE.Group(); box(g, 0x334155, 1.6, 1, 1.6, 0, 0.5, 0); const a = new THREE.Group(); box(a, 0xf97316, 0.5, 4, 0.5, 0, 2, 0); box(a, 0xf97316, 0.4, 0.4, 2.4, 0, 4, 1.2); a.position.y = 1; g.add(a); this.deco(pl, g, lx, 0.4, -11.5); anim((dt, t) => { a.rotation.y = Math.sin(t / 500 + lx) * 1.2; a.rotation.x = 0.2 + Math.sin(t / 300 + lx) * 0.2; }); }
      } else if (it.look === 'show') {
        // the car show: a stage with spotlights and a crowd taking pictures
        add(-14, 1, -7, 10, 0.6, 4, 0x7c3aed);
        const c = carMesh(5); c.scale.setScalar(1.2); this.deco(pl, c, -14, 1.1, -7);
        anim((dt, t) => { c.rotation.y += dt * 0.7; if (Math.random() < dt * 2) { const [x, z] = this.W(pl, -14 + (Math.random() - 0.5) * 8, -4.6); puffAt(x, 3, z, [0xffffff, 0xfef9c3], 2); } });
      } else if (it.look === 'flags') {
        for (let k = 0; k < 6; k++) { add(-22 + k * 8.8, 5.4, 23, 0.25, 5, 0.25, 0xe5e7eb); add(-21.1 + k * 8.8, 7.2, 23, 1.6, 1.1, 0.08, CONFETTI[k % CONFETTI.length], { solid: false }); }
      } else if (it.look === 'walls') {
        const c = new THREE.Color(this.ty.PLOT_COLS[pl.k]).lerp(new THREE.Color(0xe2e8f0), 0.6).getHex();
        add(0, 9.4, -24, 48, 9, 1, c); add(-24, 9.4, -14, 1, 9, 20, c); add(24, 9.4, -14, 1, 9, 20, c);
        add(0, 9.8, -23.4, 48, 0.8, 0.3, 0x1e293b);
      } else if (it.look === 'neon') {
        for (const x of [-3, 9]) add(x, 6.6, 21.5, 0.5, 6.2, 0.5, 0x374151);
        const g = new THREE.Group(), t = label('🚗 CARS', { size: 2.2, color: '#f472b6' }); g.add(t); this.deco(pl, g, 3, 9.6, 21.5);
        anim((dt, t2) => { t.visible = Math.floor(t2 / 450) % 6 !== 0; });
      } else if (it.look === 'trophy') {
        add(-3, 1.6, 4, 3.4, 1.2, 3.4, 0x94a3b8);
        const g = new THREE.Group(), gold = M(0xfacc15, { emissive: 0x5a4500 }), cup = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.6, 2, 14, 1, true), gold); cup.position.y = 3.4; g.add(cup);
        box(g, gold, 0.5, 1.4, 0.5, 0, 1.7, 0); box(g, gold, 1.8, 0.4, 1.8, 0, 0.9, 0); this.deco(pl, g, -3, 1.6, 4);
        anim((dt) => { g.rotation.y += dt * 0.8; });
      } else if (it.look === 'lights') {
        for (const [x, z] of [[-23, 23], [23, 23], [-23, -23], [23, -23]]) { add(x, 12.4, z, 0.6, 12, 0.6, 0x374151); add(x, 13, z, 2.4, 1.2, 1.2, 0xfef9c3, { neon: true, solid: false }); }
      } else if (it.look === 'golden') {
        add(-9, 1.4, 4, 7, 1, 4, 0x1e293b);
        const c = carMesh(6), gold = M(0xfbbf24, { emissive: 0x6b4a00 }); c.traverse((m) => { if (m.isMesh) m.material = gold; }); c.scale.setScalar(1.8); this.deco(pl, c, -9, 1.4, 4);
        pl.anim.push((dt, t) => { c.position.y = 1.6 + Math.sin(t / 700) * 0.2; c.rotation.y = Math.sin(t / 2000) * 0.5; });
      }
    },
    tyProd(pl, it) { const g = carMesh(it.model, 0); g.userData.stage = 0; return g; },
    // each station adds its part (and everything before it, for a line that's just been built up)
    tyUp(pl, pr, it) { const g = pr.m, s = STATION[it.look][2]; for (let k = g.userData.stage + 1; k <= s; k++) carParts(g, g.userData.k, k); g.userData.stage = Math.max(g.userData.stage, s); },
    // sold: it drives off the lot
    tySold(pl, pr) { if (pl.leaving.length > 12) return false; pl.leaving.push({ m: pr.m, lx: -2 }); return true; },
    tyAnim(pl, dt) {
      for (let k = pl.leaving.length - 1; k >= 0; k--) {
        const c = pl.leaving[k]; c.lx -= dt * 14;
        if (c.lx < -34) { place.remove(c.m); pl.leaving.splice(k, 1); continue; }
        const [x, z] = this.W(pl, c.lx, -3); c.m.position.set(x, 2.4 - Math.min(2, (-2 - c.lx) * 0.6), z); c.m.rotation.y = Math.PI;
      }
    },

    /* ---- the test drive ---- */
    async tyEnter(s) { this.laps = Math.max(0, s.laps | 0); this.bestLap = +s.bl || 0; this.dr = null; this.cars = new Map(); },
    tySave() { return { laps: this.laps, bl: this.bestLap }; },
    tyLeave() { if (this.dr) this.stopDrive(true); for (const c of this.cars.values()) if (c.parent) c.parent.remove(c); this.cars.clear(); },
    get drive() { return this.dr ? this.driveFn : null; },
    driveFn(dt, f, r) {
      const D = this.dr, top = MODELS[D.k].top * (hasItem('nitro') ? 1.12 : 1);
      const thr = P.frozen || chatOpen() ? 0 : clamp(f, -1, 1), steer = clamp(r, -1, 1);
      if (thr > 0) D.sp = Math.min(top, D.sp + 34 * thr * dt * (D.sp < 20 ? 1.5 : 1));
      else if (thr < 0) D.sp = Math.max(-14, D.sp + 50 * thr * dt);
      else { D.sp *= Math.exp(-dt * 0.8); if (Math.abs(D.sp) < 0.4) D.sp = 0; }
      const grip = clamp(Math.abs(D.sp) / 12, 0, 1);
      D.yaw -= steer * 2.1 * grip * (D.sp < 0 ? -1 : 1) * dt;
      return [-Math.sin(D.yaw) * D.sp, -Math.cos(D.yaw) * D.sp, D.yaw];
    },
    startDrive() {
      const k = this.bestModel(this.b);
      Object.assign(P, { x: -6, y: 0.6, z: TR, vx: 0, vy: 0, vz: 0 }); P.yaw = -Math.PI / 2; cam.yaw = P.yaw;
      this.dr = { k, sp: 0, yaw: -Math.PI / 2, cp: 0, t0: 0, lapT: 0 };
      send({ dr: k + 1 }); sfx('engine');
      toast(`🏁 Your ${MODELS[k].n}! Drive round the track (W / ↑ to go) — the lap starts at the line`, '#fde68a');
    },
    stopDrive(quiet) { if (!this.dr) return; this.dr = null; send({ dr: 0 }); P.vx = P.vz = 0; if (!quiet) sfx('pop'); },
    tyPrompts() {
      if (P.dead) return [];
      if (this.dr) return [{ x: P.x, z: P.z, r: 99, text: '🚪 Get out', fn: () => this.stopDrive() }];
      if (this.myPlot == null) return [];
      const pl = this.plots[this.myPlot], [x, z] = this.W(pl, 12, 17.6);
      return [{ x, z, r: 3.5, text: `🏁 Test drive your ${MODELS[this.bestModel(this.b)].n}`, fn: () => this.startDrive() }];
    },
    // the lap: past every corner in turn, then over the line
    tyTick(dt) {
      const D = this.dr; if (!D) return;
      if (P.dead) { this.stopDrive(true); return; }
      D.lapT += dt;
      const onLine = Math.abs(P.z - TR) < TW / 2 + 1 && Math.abs(P.x) < 3;
      if (D.cp === 0 && onLine && D.started !== true) { D.started = true; D.lapT = 0; D.cp = 0; }
      if (D.started) {
        const c = CORNERS[D.cp];
        if (D.cp < 4 && c && Math.hypot(P.x - c[0], P.z - c[1]) < TW * 1.6) { D.cp++; sfx('tick'); }
        if (D.cp === 4 && onLine && P.x > -3) this.lapDone();
      }
    },
    lapDone() {
      const D = this.dr, t = D.lapT, top = MODELS[D.k].top, par = (8 * TR) / (top * 0.85), quick = clamp(1.6 - t / par, 0, 1);
      D.cp = 0; D.lapT = 0;
      const cash = Math.round(this.worth(20, 100) * (1 + quick) * (1 + 0.5 * this.rb));
      this.laps++; quest('cars.lap'); this.gain(cash, null, null, true);
      const best = !this.bestLap || t < this.bestLap; if (best) this.bestLap = t;
      toast(`🏁 Lap ${t.toFixed(1)} s${best ? ' — a new best!' : ''} +${money(cash)}`, '#86efac'); sfx('win');
      if (Math.random() < 0.12 + 0.45 * quick) {
        const w = [0, 0, 60, 28, 9, 3]; let roll = Math.random() * 100, r = 2; while (r < 5 && roll >= w[r]) { roll -= w[r]; r++; }
        const opts = FINDS.map((F, f) => [F, f]).filter(([F]) => F.r === r); this.gotFind(opts[Math.floor(Math.random() * opts.length)][1], 'You won');
      }
      this.save();
    },
    // everyone driving sits in their car
    pose(dt) {
      this.seat(me, 'me', this.dr ? this.dr.k : -1, this.dr ? this.dr.sp : 0, dt);
      for (const p of Net.peers) { if (p.isMe) continue; const a = Net.avatars.get(p.peer); if (a) this.seat(a, p.peer, p.presence && p.presence.dr > 0 ? (p.presence.dr | 0) - 1 : -1, 30, dt); }
    },
    seat(a, key, k, sp, dt) {
      if (!a) return;
      let c = this.cars.get(key);
      if (k < 0 || !MODELS[k]) { if (c) c.visible = false; return; }
      if (!c || c.parent !== a.g || c.userData.k !== k) { if (c && c.parent) c.parent.remove(c); c = carMesh(k); c.scale.setScalar(1.6); c.rotation.y = Math.PI / 2; c.position.y = -0.1; a.g.add(c); this.cars.set(key, c); }
      c.visible = true;
      if (a.dead) return;
      a.body.position.y = -0.4; a.legL.rotation.x = a.legR.rotation.x = Math.PI / 2; a.armL.rotation.x = a.armR.rotation.x = 1.2;
    },
    tyHud() { const D = this.dr; return D ? `🏁 <b>${Math.round(Math.abs(D.sp) * 1.4)}</b> mph${D.started ? ` · lap ${D.lapT.toFixed(1)} s · corner ${Math.min(D.cp, 4)}/4` : ' · drive to the line'}${this.bestLap ? ` · best ${this.bestLap.toFixed(1)} s` : ''}` : ''; },
    coinShop: [
      { id: 'cash2', e: '💵', n: '2× Cash', d: 'Every car you sell is worth double, for good', price: 700, kind: 'pass' },
      { id: 'nitro', e: '🔥', n: 'Nitro', d: 'Your test drives go 12% faster, for good', price: 450, kind: 'pass' },
      shopSpeed(200, 1.25),
      { id: 'crate', e: '💰', n: 'Cash Crate', d: 'A minute of your factory’s cash (at least $300), right now', price: 40, kind: 'now' },
    ],
  });
  addExp(CF);
  window.__rbCF = CF;
})();
