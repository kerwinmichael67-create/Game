/* =====================================================================
   BLOXVERSE — PIZZA PLACE. Claim a pizzeria. Ovens bake pizzas onto the
   counter; they pick up cheese, pepperoni, veggies and gold leaf on the
   way (each doubles what they're worth) to the order counter, where the
   customers in the queue take them away. Delivery scooters, vans,
   drones and a pizza rocket bring in tips by themselves; take a pizza
   out to a house yourself for a big tip (quick ones tip more) and, now
   and then, a secret recipe. Grow it into a bigger restaurant: walls,
   tables, a rooftop patio; then rebirth.
   ===================================================================== */
(() => {
  const FINDS = [
    { n: 'Grandma’s Sauce', e: '🍅', r: 2, v: 500 }, { n: 'Garlic Knots', e: '🧄', r: 2, v: 500 }, { n: 'Extra Cheesy', e: '🧀', r: 2, v: 600 }, { n: 'Spicy Pepper', e: '🌶️', r: 2, v: 600 },
    { n: 'Truffle Pizza', e: '🍄', r: 3, v: 2500 }, { n: 'Lobster Pizza', e: '🦞', r: 3, v: 3000 }, { n: 'Pineapple Supreme', e: '🍍', r: 3, v: 3000 },
    { n: 'Golden Crust', e: '👑', r: 4, v: 15000 }, { n: 'Volcano Pizza', e: '🌋', r: 4, v: 20000 },
    { n: 'Galaxy Pizza', e: '🌌', r: 5, v: 90000 }, { n: 'Rainbow Pizza', e: '🌈', r: 5, v: 100000 },
  ];
  const SHIRTS = [0xef4444, 0x3b82f6, 0x22c55e, 0xf59e0b, 0xa855f7, 0xec4899, 0x14b8a6, 0xf97316];
  const mats = new Map(), M = (c) => { let m = mats.get(c); if (!m) { m = new THREE.MeshLambertMaterial({ color: c }); mats.set(c, m); } return m; };
  const box = (g, c, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(BOX, typeof c === 'number' ? M(c) : c); m.scale.set(sx, sy, sz); m.position.set(x, y, z); g.add(m); return m; };
  const CYL = new THREE.CylinderGeometry(1, 1, 1, 16), DOT = new THREE.CylinderGeometry(1, 1, 1, 8);
  const disc = (g, c, r, h, y) => { const m = new THREE.Mesh(CYL, typeof c === 'number' ? M(c) : c); m.scale.set(r, h, r); m.position.y = y; g.add(m); return m; };
  const rainbow = new THREE.MeshBasicMaterial({ color: 0xffffff });
  function pizzaMesh(rb) {
    const g = new THREE.Group();
    g.userData.crust = disc(g, 0xe9b872, 0.95, 0.22, 0); disc(g, rb ? rainbow : 0xdc2626, 0.8, 0.24, 0.02);
    return g;
  }
  function person(c) {
    const g = new THREE.Group();
    box(g, 0x1f2937, 0.9, 1.6, 0.5, 0, 0.8, 0); box(g, c, 1.3, 1.6, 0.65, 0, 2.4, 0); box(g, 0xfcd34d, 0.85, 0.85, 0.85, 0, 3.65, 0);
    box(g, c, 0.4, 1.3, 0.4, -0.85, 2.5, -0.25).rotation.x = 0.5; box(g, c, 0.4, 1.3, 0.4, 0.85, 2.5, -0.25).rotation.x = 0.5;
    return g;
  }
  function scooter(look) {
    const g = new THREE.Group();
    if (look === 'van') { box(g, 0xf8fafc, 3, 2.6, 5.4, 0, 1.9, 0); box(g, 0x60a5fa, 2.9, 1, 1.2, 0, 2.5, -2.3); box(g, 0xdc2626, 3.05, 0.5, 5.45, 0, 1.4, 0); for (const [x, z] of [[-1.4, -1.7], [1.4, -1.7], [-1.4, 1.7], [1.4, 1.7]]) { const w = new THREE.Mesh(CYL, M(0x111827)); w.scale.set(0.55, 0.4, 0.55); w.rotation.z = Math.PI / 2; w.position.set(x, 0.55, z); g.add(w); } }
    else if (look === 'drone') { box(g, 0x334155, 1.4, 0.5, 1.4, 0, 0, 0); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { box(g, 0x94a3b8, 0.15, 0.4, 0.15, x, 0.3, z); box(g, 0xe2e8f0, 1.2, 0.05, 0.2, x, 0.5, z).userData.prop = 1; } box(g, 0xdc2626, 1, 0.3, 1, 0, -0.5, 0); }
    else if (look === 'rocket') { const b = new THREE.Mesh(CYL, M(0xf8fafc)); b.scale.set(0.8, 4, 0.8); b.position.y = 2; g.add(b); const n = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.4, 12), M(0xdc2626)); n.position.y = 4.7; g.add(n); box(g, 0xdc2626, 2.4, 1, 0.2, 0, 0.5, 0); box(g, 0xdc2626, 0.2, 1, 2.4, 0, 0.5, 0); const f = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 })); f.rotation.x = Math.PI; f.position.y = -0.5; g.add(f); g.userData.flame = f; }
    else { box(g, 0xdc2626, 1, 0.8, 2.6, 0, 0.9, 0); box(g, 0xdc2626, 0.2, 1.4, 0.2, 0, 1.6, -1.2); box(g, 0x1f2937, 1.2, 0.15, 0.2, 0, 2.3, -1.2); box(g, 0xfde68a, 1.4, 1, 1.2, 0, 1.9, 0.9); for (const z of [-1.1, 1.1]) { const w = new THREE.Mesh(CYL, M(0x111827)); w.scale.set(0.45, 0.3, 0.45); w.rotation.z = Math.PI / 2; w.position.set(0, 0.45, z); g.add(w); } const r = person(0x2563eb); r.scale.setScalar(0.6); r.position.set(0, 0.6, 0.2); g.add(r); }
    return g;
  }
  const TOP = { cheese: [0xfde68a, '🧀 Cheese'], pep: [0xb91c1c, '🍕 Pepperoni'], veg: [0x16a34a, '🫑 Veggies'], gold: [0xfacc15, '✨ Gold Leaf'] };
  const HOUSE_COLS = [0xfca5a5, 0x93c5fd, 0xfde68a, 0x86efac, 0xc4b5fd, 0xfdba74], HOUSE_NAMES = ['pink', 'blue', 'yellow', 'green', 'purple', 'orange'];

  const PZ = tycoonKit({
    id: 'pizza', code: 'pp', saveKey: 'pp', rank: 0.0006, name: 'Pizza Place', emoji: '🍕', noun: 'Pizzeria', camDist: 22,
    color: 'linear-gradient(135deg,#dc2626,#f59e0b)',
    desc: 'Claim a pizzeria. Ovens bake pizzas onto the counter, toppings make them worth more, and customers queue up to take them away. Buy delivery scooters, vans, drones and a pizza rocket, or take a pizza out to a house yourself for a big tip and a secret recipe. Grow it into a bigger restaurant, then rebirth.',
    welcome: 'Step on a claim pad to get a pizzeria!',
    land: { theme: 'blossom', fence: 'wood' },
    skyCols: ['#7cc4ff', '#fff1e0'], ground: 0x8bc34a, speed0: 7,
    path: [[-22, -13], [16, -13], [16, 3]], padAt: [-6, 12], caseAt: [-16, -5], caseName: '📜 Secret recipes',
    findHow: 'Secret recipes turn up when you deliver pizzas yourself (the quicker, the likelier).',
    FINDS,
    items: [
      { n: 'Pizza Oven', price: 0, kind: 'src', look: 'oven', c: 0x9ca3af, v: 2, every: 1.6, at: [-21, -13], drop: 0.5 },
      { n: 'Pizza Oven 2', price: 25, kind: 'src', look: 'oven', c: 0x9ca3af, v: 3, every: 1.6, at: [-17.5, -13], drop: 0.5 },
      { n: 'Faster Counter', price: 75, kind: 'speed', sp: 10 },
      { n: 'Cheese Station', price: 160, kind: 'up', look: 'cheese', at: [10.5, -13] },
      { n: 'Brick Oven', price: 320, kind: 'src', look: 'oven', c: 0xb45309, v: 5, every: 2, at: [-14, -13], drop: 0.5 },
      { n: 'Walls & Windows', price: 500, kind: 'deco', look: 'walls', bonus: 0.05 },
      { n: 'Wood-Fired Oven', price: 900, kind: 'src', look: 'dome', c: 0xc2410c, v: 12, every: 1.6, at: [-10.5, -13], drop: 0.5 },
      { n: 'Pepperoni Station', price: 1600, kind: 'up', look: 'pep', at: [14, -13] },
      { n: 'Delivery Scooter', price: 2600, kind: 'pay', look: 'scooter', v: 120, every: 8, n0: 0 },
      { n: 'Double Oven', price: 4500, kind: 'src', look: 'oven', c: 0x475569, tall: true, v: 35, every: 1.6, at: [-7, -13], drop: 0.5 },
      { n: 'Tables & Chairs', price: 8000, kind: 'deco', look: 'tables', bonus: 0.1 },
      { n: 'Mega Oven', price: 14000, kind: 'src', look: 'oven', c: 0x7c3aed, tall: true, v: 110, every: 1.4, at: [-3.5, -13], drop: 0.5 },
      { n: 'Delivery Van', price: 40000, kind: 'pay', look: 'van', v: 2500, every: 9, n0: 1 },
      { n: 'Veggie Station', price: 60000, kind: 'up', look: 'veg', at: [16, -8.5] },
      { n: 'Turbo Counter', price: 90000, kind: 'speed', sp: 14 },
      { n: 'Golden Oven', price: 110000, kind: 'src', look: 'oven', c: 0xfacc15, tall: true, v: 500, every: 1.5, at: [0, -13], drop: 0.5 },
      { n: 'Rooftop Patio', price: 170000, kind: 'deco', look: 'roof', bonus: 0.15 },
      { n: 'Pizza Robot', price: 250000, kind: 'src', look: 'robot', v: 1200, every: 1.5, at: [3.5, -13], drop: 2 },
      { n: 'Gold Leaf Station', price: 380000, kind: 'up', look: 'gold', at: [16, -2.5] },
      { n: 'Delivery Drones', price: 600000, kind: 'pay', look: 'drone', v: 12000, every: 10, n0: 2 },
      { n: 'Neon Pizza Sign', price: 850000, kind: 'deco', look: 'neon', bonus: 0.2 },
      { n: 'Pizza Portal', price: 1300000, kind: 'src', look: 'portal', v: 6000, every: 1.4, at: [7, -13], drop: 1.5 },
      { n: 'Pizza Rocket', price: 2800000, kind: 'pay', look: 'rocket', v: 60000, every: 12, n0: 3, say: '🚀 Pizza to space!' },
      { n: 'Golden Chef', price: 9000000, kind: 'deco', look: 'chef', bonus: 0.25 },
    ],

    /* ---- the town: houses behind every pizzeria, to deliver to ---- */
    tyWorld() {
      const s = label('🍕 PIZZA\nPLACE', { size: 3.2, color: '#fff7ed' }); s.position.set(0, 12, -8); place.add(s);
      slab(0, 0.2, 0, 14, 14, 0xd6d3d1, { sy: 0.4 });
      // roads from the middle to every pizzeria
      for (const pl of this.plots) { const len = Math.abs(pl.oz) - 24 - 7; part({ x: pl.ox, y: 0.075, z: Math.sign(pl.oz) * (7 + len / 2), sx: 6, sy: 0.15, sz: len, c: 0x6b7280, plain: true }); if (pl.oz < 0) part({ x: pl.ox / 2 + Math.sign(pl.ox) * 3, y: 0.075, z: 0, sx: Math.abs(pl.ox), sy: 0.15, sz: 6, c: 0x6b7280, plain: true }); }
      this.houses = [];
      for (const pl of this.plots) for (const [n, lx] of [-15, 0, 15].entries()) {
        const k = this.houses.length, c = HOUSE_COLS[k % HOUSE_COLS.length], [x, z] = this.W(pl, lx, -46), dz = -pl.fz; // (the door faces the pizzeria)
        part({ x, y: 3, z, sx: 9, sy: 6, sz: 8, c });
        const roof = new THREE.Mesh(new THREE.ConeGeometry(7, 3.4, 4), M(0x9f1239)); roof.rotation.y = Math.PI / 4; roof.position.set(x, 7.7, z); place.add(roof);
        part({ x, y: 1.7, z: z - dz * 4.05, sx: 2, sy: 3.4, sz: 0.2, c: 0x6b4a2b });
        for (const wx of [-2.8, 2.8]) part({ x: x + wx, y: 3.8, z: z - dz * 4.05, sx: 1.6, sy: 1.4, sz: 0.2, c: 0xbae6fd, plain: true });
        part({ x, y: 0.1, z: z - dz * 5.4, sx: 3, sy: 0.2, sz: 2.4, c: 0xa8a29e, plain: true });
        this.houses.push({ x, z: z - dz * 5.6, c, name: `${HOUSE_NAMES[k % HOUSE_NAMES.length]} house`, k: pl.k, n });
      }
    },
    tyBase(pl, add) {
      pl.cust = [];
      // the order counter and the kitchen floor
      add(16, 2.2, 6.2, 6, 1.8, 2.2, 0xf8fafc); add(16, 2.4, 6.2, 6.2, 0.2, 2.4, 0xdc2626);
      add(-1, 0.45, -16, 46, 0.1, 14, 0xf1f5f9, { plain: true, solid: false });
      const [mx, mz] = this.W(pl, 16, 6.2), l = label('🍕 Order here', { size: 1 }); l.position.set(mx, 5.4, mz); place.add(l); pl.decor.push(l);
      const [dx, dz] = this.W(pl, 11, 7.5), d = label('🛵 Deliveries', { size: 0.8, bg: 'rgba(15,23,42,.6)' }); d.position.set(dx, 3, dz); place.add(d); pl.decor.push(d);
      add(11, 1.4, 7.5, 2, 1, 2, 0xdc2626); // the pile of pizza boxes to take out
      for (let k = 0; k < 3; k++) add(11, 1.65 + k * 0.25, 7.5, 1.5, 0.22, 1.5, 0xfef3c7, { solid: false });
    },
    tyItem(pl, it, i, add) {
      const lx = it.at ? it.at[0] : 0;
      if (it.look === 'oven' || it.look === 'dome') {
        const h = it.tall ? 4.6 : 3.4;
        if (it.look === 'dome') { const g = new THREE.Group(), d = new THREE.Mesh(new THREE.SphereGeometry(1.8, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), M(it.c)); g.add(d); box(g, 0x1f2937, 1.4, 1, 0.4, 0, 0.5, 1.6); this.deco(pl, g, lx, 0.4, -17); add(lx, 2.2, -17, 3, 1.8, 3, 0, { alpha: 0, plain: true }).m.visible = false; }
        else { add(lx, 0.4 + h, -17.5, 3.2, h, 3, it.c); add(lx, 0.4 + h + 1.6, -18.3, 0.8, 1.6, 0.8, 0x57534e); }
        add(lx, 2.6, -15.9, 2, 1.4, 0.3, 0x1f2937, { solid: false }); add(lx, 2.4, -15.85, 1.6, 0.9, 0.2, 0xf97316, { neon: true, solid: false });
        pl.anim.push((dt) => { if (pl.tm[i] != null && pl.tm[i] > it.every - dt * 1.5 && Math.random() < 0.6) { const [x, z] = this.W(pl, lx, -18.3); puffAt(x, 0.4 + h + 3, z, [0x9ca3af, 0xd6d3d1], 1); } });
      } else if (it.look === 'robot') {
        add(lx, 0.6, -13, 3, 0.2, 3, 0x334155);
        const g = new THREE.Group(); box(g, 0x94a3b8, 2, 2.6, 1.6, 0, 1.5, 0); box(g, 0xcbd5e1, 1.6, 1.2, 1.4, 0, 3.4, 0); box(g, 0x22d3ee, 1.2, 0.3, 0.1, 0, 3.5, 0.72);
        const arm = new THREE.Group(); box(arm, 0x64748b, 0.4, 0.4, 3, 0, 0, 1.5); arm.position.set(0, 2.4, 0); g.add(arm);
        this.deco(pl, g, lx + 0.5, 0.4, -16.5);
        pl.anim.push((dt, t) => { arm.rotation.y = Math.sin(t / 300) * 0.8; arm.rotation.x = -0.3 + Math.sin(t / 200) * 0.2; });
      } else if (it.look === 'portal') {
        const g = new THREE.Group(), ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.35, 8, 24), new THREE.MeshBasicMaterial({ color: 0xa855f7 })); g.add(ring);
        const inner = new THREE.Mesh(new THREE.CircleGeometry(1.6, 20), new THREE.MeshBasicMaterial({ color: 0x312e81, side: THREE.DoubleSide })); g.add(inner);
        this.deco(pl, g, lx, 4.2, -17);
        pl.anim.push((dt, t) => { ring.rotation.z += dt * 2; ring.material.color.setHSL((t / 2000) % 1, 0.8, 0.6); });
      } else if (it.kind === 'up') {
        const [c, name] = TOP[it.look], g = this.ty.pathAt(it.s)[2], along = Math.abs(g.dx) > 0.5, lz = it.at[1];
        const side = (o) => (along ? [lx, lz + o] : [lx + o, lz]);
        for (const o of [-2.4, 2.4]) { const [x, z] = side(o); add(x, 5.4, z, along ? 0.8 : 0.5, 5, along ? 0.5 : 0.8, 0x94a3b8); }
        add(lx, 6.6, lz, along ? 2.4 : 5.6, 1.2, along ? 5.6 : 2.4, 0xe2e8f0); add(lx, 7.8, lz, 1.8, 1.4, 1.8, c);
        add(lx, 5.2, lz, 0.6, 1.6, 0.6, c, { neon: true, solid: false, alpha: 0.6 });
        const [x, z] = this.W(pl, lx, lz), l = label(name, { size: 0.9 }); l.position.set(x, 9.6, z); place.add(l); pl.decor.push(l);
      } else if (it.kind === 'pay') {
        const m = scooter(it.look), n = it.n0, h = this.houses.find((q) => q.k === pl.k && q.n === n % 3) || this.houses[0];
        const [hx, hz] = [h.x - pl.ox, (h.z - pl.oz) * pl.fz]; // the house, in the plot's own frame
        const home = [-21 + n * 3.4, 19];
        if (it.look === 'scooter' || it.look === 'van') add(home[0], 0.5, home[1], 3.2, 0.1, 6, 0x475569, { plain: true, solid: false });
        // out the side of the plot and round the back to the house, and back again
        const route = [home, [home[0], 26], [-28, 26], [-28, hz + 3], [hx, hz + 3]];
        const segs = []; let L = 0; for (let q = 1; q < route.length; q++) { const len = Math.hypot(route[q][0] - route[q - 1][0], route[q][1] - route[q - 1][1]); segs.push([route[q - 1], route[q], L, len]); L += len; }
        const at = (d) => { const s = segs.find((g) => d <= g[2] + g[3]) || segs[segs.length - 1], u = clamp((d - s[2]) / s[3], 0, 1); return [s[0][0] + (s[1][0] - s[0][0]) * u, s[0][1] + (s[1][1] - s[0][1]) * u, (s[1][0] - s[0][0]) / s[3], (s[1][1] - s[0][1]) / s[3]]; };
        this.deco(pl, m, home[0], 0.4, home[1]);
        pl.anim.push((dt, t) => {
          const p = 1 - (pl.tm[i] == null ? 0 : pl.tm[i]) / it.every;
          if (it.look === 'drone' || it.look === 'rocket') {
            const u = p < 0.1 ? 0 : p < 0.5 ? (p - 0.1) / 0.4 : p < 0.6 ? 1 : p < 0.95 ? 1 - (p - 0.6) / 0.35 : 0;
            if (it.look === 'rocket') { const [x, z] = this.W(pl, home[0], home[1]); m.position.set(x, 0.6 + u * u * 140, z); m.visible = u < 0.98; m.userData.flame.visible = u > 0; if (u > 0 && Math.random() < 0.5) puffAt(x, m.position.y - 1, z, [0xf97316, 0xfde047, 0x9ca3af], 1); }
            else { const lx2 = home[0] + (hx - home[0]) * u, lz2 = home[1] + (hz + 3 - home[1]) * u, [x, z] = this.W(pl, lx2, lz2); m.position.set(x, 1 + Math.sin(u * Math.PI) * 18 + (u > 0 ? 2 : 0), z); m.children.forEach((c) => { if (c.userData.prop) c.rotation.y += dt * 30; }); }
            return;
          }
          const d = p < 0.06 ? 0 : p < 0.46 ? (p - 0.06) / 0.4 * L : p < 0.56 ? L : p < 0.96 ? L * (1 - (p - 0.56) / 0.4) : 0;
          const [qx, qz, hx2, hz2] = at(d), k = p >= 0.56 && p < 0.96 ? -1 : 1, [x, z] = this.W(pl, qx, qz);
          m.position.set(x, 0.4, z); m.rotation.y = Math.atan2(-hx2 * k * pl.fz, -hz2 * k); // (its front is -z, mirrored with the plot)
        });
      } else if (it.look === 'walls') {
        const c = new THREE.Color(this.ty.PLOT_COLS[pl.k]).lerp(new THREE.Color(0xfff7ed), 0.55).getHex();
        add(0, 8.4, -24, 48, 8, 1, c); add(0, 8.9, -23.4, 48, 0.6, 0.4, 0xdc2626);
        for (const sx of [-24, 24]) { add(sx, 8.4, -17.5, 1, 8, 13, c); add(sx, 8.4, 2.5, 1, 8, 7, c); add(sx, 2.4, -6, 1, 2, 10, c); add(sx, 8.4, -6, 1, 2, 10, c); add(sx, 6.4, -6, 0.4, 4, 10, 0xbae6fd, { alpha: 0.35 }); }
      } else if (it.look === 'tables') {
        for (const x of [-19, -11, -3]) {
          add(x, 2.3, 3, 0.4, 1.9, 0.4, 0x6b4a2b); add(x, 2.5, 3, 3.2, 0.2, 3.2, 0xf8fafc); add(x, 2.62, 3, 3, 0.05, 3, 0xdc2626, { plain: true });
          for (const [cx, cz] of [[-2.2, 0], [2.2, 0], [0, -2.2], [0, 2.2]]) add(x + cx, 1.6, 3 + cz, 1.1, 1.2, 1.1, 0x92400e);
        }
      } else if (it.look === 'roof') {
        add(-8, 9, -20, 32, 0.6, 8, 0xa16207); // the patio over the kitchen
        for (let s = 0; s < 8; s++) add(-25.6, 0.4 + (s + 1) * 1.08, -6 - s * 1.7, 2.4, 1.08, 1.7, 0xa16207); // stairs up the side
        for (const x of [-20, -10, 0]) { add(x, 10.8, -20, 0.3, 1.8, 0.3, 0xf8fafc); const u = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.2, 8), M(x === -10 ? 0x16a34a : 0xdc2626)); this.deco(pl, u, x, 13, -20); add(x, 9.9, -20, 1.6, 0.3, 1.6, 0xf8fafc); }
        add(-8, 9.9, -16.2, 32, 0.6, 0.3, 0xf8fafc); // a railing
      } else if (it.look === 'neon') {
        for (const x of [2, 10]) add(x, 6.6, 21, 0.5, 6.2, 0.5, 0x374151);
        const g = new THREE.Group(), p = pizzaMesh(); p.rotation.x = Math.PI / 2; p.scale.setScalar(2.6); g.add(p);
        p.children.forEach((m) => { m.material = new THREE.MeshBasicMaterial({ color: m.material.color }); });
        const t = label('PIZZA', { size: 1.6, color: '#fde047' }); t.position.set(0, -3.4, 0.4); g.add(t);
        this.deco(pl, g, 6, 10.4, 21);
        pl.anim.push((dt, t2) => { p.rotation.z += dt * 0.8; t.visible = Math.floor(t2 / 500) % 5 !== 0; });
      } else if (it.look === 'chef') {
        add(7, 1.6, -4, 4, 1.2, 4, 0x94a3b8);
        const g = person(0xfbbf24), gold = new THREE.MeshLambertMaterial({ color: 0xfbbf24, emissive: 0x7c5800 }); g.children.forEach((m) => { m.material = gold; });
        box(g, 0xffffff, 1.1, 1.2, 1.1, 0, 4.6, 0); const p = pizzaMesh(); p.position.set(0, 4, -1.2); p.rotation.x = -0.4; g.add(p);
        g.scale.setScalar(1.8); this.deco(pl, g, 7, 1.6, -4);
        pl.anim.push((dt) => { g.rotation.y += dt * 0.5; });
      }
    },
    tyProd(pl, it) { return pizzaMesh(it.look === 'portal'); },
    // the toppings go on
    tyUp(pl, pr, it) {
      const g = pr.m;
      if (it.look === 'cheese') disc(g, 0xfde68a, 0.76, 0.26, 0.04);
      else if (it.look === 'pep') for (let k = 0; k < 5; k++) { const a = k * 1.26, m = new THREE.Mesh(DOT, M(0xb91c1c)); m.scale.set(0.16, 0.08, 0.16); m.position.set(Math.cos(a) * 0.45, 0.2, Math.sin(a) * 0.45); g.add(m); }
      else if (it.look === 'veg') for (let k = 0; k < 4; k++) box(g, k % 2 ? 0x16a34a : 0x78350f, 0.18, 0.08, 0.18, Math.cos(k * 1.6 + 0.6) * 0.3, 0.22, Math.sin(k * 1.6 + 0.6) * 0.3);
      else if (it.look === 'gold') g.userData.crust.material = M(0xfacc15);
    },
    // the customer at the front of the queue takes it
    tySold(pl, pr) {
      const c = (pl.cust || []).find((c) => c.st === 'queue' && c.q === 0 && Math.abs(c.lz - c.tz) < 0.6);
      if (!c) return false;
      place.remove(pr.m); pr.m.position.set(0, 2.9, -0.9); pr.m.rotation.set(0, 0, 0); c.m.add(pr.m); c.st = 'leave'; c.lx = 16 + (Math.random() < 0.5 ? -1 : 1) * 3.2;
      return true;
    },
    tyAnim(pl, dt, t) {
      if (!pl.cust) return;
      const q = pl.cust.filter((c) => c.st === 'queue');
      if (q.length < 5 && t > (pl.custAt || 0)) {
        pl.custAt = t + 900;
        const m = person(SHIRTS[Math.floor(Math.random() * SHIRTS.length)]); this.deco(pl, m, 16, 0.4, 27);
        pl.cust.push({ m, st: 'queue', lx: 16, lz: 27, tz: 27, q: 9 });
      }
      q.forEach((c, n) => { c.q = n; c.tz = 8.6 + n * 2.3; });
      for (let k = pl.cust.length - 1; k >= 0; k--) {
        const c = pl.cust[k];
        if (c.st === 'queue') { const d = c.tz - c.lz; c.lz += Math.sign(d) * Math.min(Math.abs(d), 6 * dt); }
        else { c.lz += 6 * dt; if (c.lz > 30) { place.remove(c.m); const di = pl.decor.indexOf(c.m); if (di >= 0) pl.decor.splice(di, 1); pl.cust.splice(k, 1); continue; } }
        const [x, z] = this.W(pl, c.lx, c.lz), walking = c.st === 'leave' || Math.abs(c.tz - c.lz) > 0.05;
        c.m.position.set(x, 0.4 + (walking ? Math.abs(Math.sin(t / 110 + k)) * 0.25 : 0), z);
        c.m.rotation.y = c.st === 'leave' ? Math.PI : 0;
      }
    },

    /* ---- deliver it yourself ---- */
    async tyEnter(s) { this.delivered = Math.max(0, s.dl | 0); this.dv = null; this.boxes = new Map(); },
    tySave() { return { dl: this.delivered }; },
    tyLeave() { this.dropDelivery(); for (const b of this.boxes.values()) if (b.parent) b.parent.remove(b); this.boxes.clear(); },
    tyPrompts() {
      if (this.dv) {
        const h = this.houses[this.dv.h];
        return Math.hypot(P.x - h.x, P.z - h.z) < 5 ? [{ x: h.x, z: h.z, r: 5, text: '🍕 Hand over the pizza', fn: () => this.deliver() }] : [];
      }
      if (this.myPlot == null || P.dead) return [];
      const pl = this.plots[this.myPlot], [x, z] = this.W(pl, 11, 9);
      return [{ x, z, r: 3.5, text: '🛵 Take a pizza out', fn: () => this.takeDelivery() }];
    },
    takeDelivery() {
      const all = this.houses.map((h, k) => [h, k]), far = all.filter(([h]) => Math.hypot(h.x - P.x, h.z - P.z) > 40), [h, k] = (far.length ? far : all)[Math.floor(Math.random() * (far.length || all.length))];
      const time = Math.round(Math.hypot(h.x - P.x, h.z - P.z) / 11 + 12) * (hasItem('hotbag') ? 1.5 : 1);
      const beam = part({ x: h.x, y: 20, z: h.z, sx: 2.4, sy: 40, sz: 2.4, c: 0xfde047, neon: true, solid: false, alpha: 0.35 });
      beam.lab = label('🍕 Deliver here!', { size: 1.4, bg: 'rgba(220,38,38,.85)' }); beam.lab.position.set(h.x, 9, h.z); place.add(beam.lab);
      this.dv = { h: k, left: time, total: time, beam };
      send({ dv: 1 }); sfx('pop', { vol: 0.8 });
      toast(`🛵 Take it to the ${h.name} — follow the yellow light! ${time} s`, '#fde68a');
    },
    deliver() {
      const dv = this.dv; if (!dv) return;
      const quick = clamp(dv.left / dv.total, 0, 1), tip = Math.round(this.worth(30, 60) * (1 + quick) * (hasItem('hotbag') ? 1.5 : 1) * (1 + 0.5 * this.rb));
      this.dropDelivery();
      this.delivered++; quest('pizza.deliver'); this.gain(tip, null, null, true); this.save();
      toast(`🍕 Delivered${quick > 0.5 ? ' — super quick!' : ''} Tip: +${money(tip)}`, '#86efac'); sfx('coin'); puffAt(P.x, P.y + 3, P.z, CONFETTI, 24);
      if (Math.random() < 0.18 + 0.3 * quick) {
        const w = [0, 0, 60, 28, 9, 3]; let roll = Math.random() * 100, r = 2; while (r < 5 && roll >= w[r]) { roll -= w[r]; r++; }
        const opts = FINDS.map((F, f) => [F, f]).filter(([F]) => F.r === r); this.gotFind(opts[Math.floor(Math.random() * opts.length)][1], 'The customer gave you');
      }
    },
    dropDelivery(msg) {
      const dv = this.dv; if (!dv) return;
      removeParts((p) => p === dv.beam); this.dv = null; send({ dv: 0 });
      if (msg) { toast(msg, '#fca5a5'); sfx('error'); }
    },
    tyTick(dt) {
      const dv = this.dv;
      if (dv) { dv.left -= dt; if (dv.left <= 0) this.dropDelivery('🥶 Too slow — the pizza went cold!'); else dv.beam.m.material.opacity = 0.25 + Math.sin(performance.now() / 200) * 0.1; }
    },
    // a pizza box carried over the head
    pose() {
      this.carry(me, 'me', !!this.dv);
      for (const p of Net.peers) { if (p.isMe) continue; const a = Net.avatars.get(p.peer); if (a) this.carry(a, p.peer, !!(p.presence && p.presence.dv)); }
    },
    carry(a, k, on) {
      if (!a || a.dead) return;
      let b = this.boxes.get(k);
      if (on && (!b || b.parent !== a.g)) { if (b && b.parent) b.parent.remove(b); b = new THREE.Group(); box(b, 0xfef3c7, 2, 0.5, 2, 0, 0, 0); box(b, 0xdc2626, 0.8, 0.52, 0.8, 0, 0, 0); b.position.set(0, 6.2, 0); a.g.add(b); this.boxes.set(k, b); }
      if (b) b.visible = on;
      if (on) { a.armL.rotation.x = a.armR.rotation.x = Math.PI; }
    },
    tyHud() { const dv = this.dv; return dv ? `🛵 to the ${this.houses[dv.h].name}: <b>${Math.ceil(dv.left)} s</b>` : ''; },
    coinShop: [
      { id: 'cash2', e: '💵', n: '2× Cash', d: 'Every pizza you sell is worth double, for good', price: 700, kind: 'pass' },
      { id: 'hotbag', e: '🎒', n: 'Hot Bag', d: 'Your own deliveries stay hot 50% longer and tip 50% more, for good', price: 450, kind: 'pass' },
      shopSpeed(200, 1.25),
      { id: 'crate', e: '💰', n: 'Cash Crate', d: 'A minute of your pizzeria’s cash (at least $300), right now', price: 40, kind: 'now' },
    ],
  });
  addExp(PZ);
  window.__rbPP = PZ;
})();
