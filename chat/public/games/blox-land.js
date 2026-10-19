/* =====================================================================
   BLOXVERSE — THE LAND ROUND EACH EXPERIENCE. Ground, hills, mountains,
   trees, rocks, bushes, flowers, ponds and clouds (and a moon and stars
   at night) all round the place you play. None of it is a part, so the
   physics never looks at it, and it's merged into a few big meshes, a
   patch of land each, so it only takes a few draw calls.
   An experience says what it wants with `land` (land: false for none):
     theme   meadow · forest · autumn · blossom · desert · beach · snow ·
             volcano · candy · space · night
     mode    'ground': the land is at floor level all round · 'sky': you
             play up high and the land is far below · 'sea': water, with
             islands
     g       the floor's top (0) · low: the valley under a sky experience
             (killY − 60) · sea: the water's surface
     box     [x0, z0, x1, z1] where you play, kept clear (the bounds of
             its parts once it's built)
     fence   'wood' · 'hedge' · 'stone' · 'none': walls you can't see stop
             you walking off the floor onto the land, and this is what you
             see there · fences: the rectangles to fence (the box) ·
             floor: a solid ground under them too (for floors with gaps)
     holes   rectangles with no ground or water (the experience's own) ·
             under: floors that cover the land, so none is drawn there
             (in 'ground' mode, the box)
     keep    more rectangles where nothing grows · water: the sea's
             colours · bands: [[z0, z1, theme], …] themes that change
             along z · ridges: [x0, x1, z0, z1] rocky ridges down both
             sides (a canyon) · cliffs: [[x0, y0, z0, x1, y1, z1], …]
             rock walls · extras: graves, pumpkins, crystals, fireflies,
             boats, snowmen, stars
   ===================================================================== */
const scenery = (() => {
  const TAU = Math.PI * 2;
  let rnd = Math.random;
  const rr = (a, b) => a + rnd() * (b - a);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  // a shape as a flat list of triangle corners
  const tri = (g) => { const n = g.index ? g.toNonIndexed() : g, a = n.attributes.position.array.slice(); g.dispose(); n.dispose(); return a; };
  const SH = {
    trunk: tri(new THREE.CylinderGeometry(1, 1, 1, 6, 1, true).translate(0, 0.5, 0)),
    post: tri(new THREE.CylinderGeometry(1, 1, 1, 8, 1).translate(0, 0.5, 0)),
    cone: tri(new THREE.ConeGeometry(1, 1, 7, 1, true).translate(0, 0.5, 0)),
    spike: tri(new THREE.ConeGeometry(1, 1, 4, 1, true).translate(0, 0.5, 0)),
    stem: tri(new THREE.ConeGeometry(1, 1, 3, 1, true).translate(0, 0.5, 0)),
    blob: tri(new THREE.IcosahedronGeometry(1, 0)),
    ball: tri(new THREE.IcosahedronGeometry(1, 1)),
    box: tri(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)),
    gem: tri(new THREE.OctahedronGeometry(1, 0)),
    disc: tri(new THREE.CircleGeometry(1, 18).rotateX(-Math.PI / 2)),
  };
  // a mountain, hill or ridge of its own: the corners nudged about (shared corners together, so there are no cracks), the base kept flat
  function lumpy(g, amp, ampY) {
    g.translate(0, g.parameters.height != null ? 0.5 : 0, 0);
    const pos = g.attributes.position, seen = new Map();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), k = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
      let d = seen.get(k);
      if (!d) { d = [1 + (rnd() - 0.5) * 2 * amp, y > 0.001 && y < 0.999 ? (rnd() - 0.5) * 2 * ampY : 0]; seen.set(k, d); }
      pos.setXYZ(i, x * d[0], y > 0.001 ? Math.max(0.002, y + d[1]) : 0, z * d[0]);
    }
    return tri(g);
  }
  const SUN = [40, 100, 25].map((v) => v / Math.hypot(40, 100, 25)); // where the sun shines from (as the engine's light)
  const RGB = new Map();
  const rgbOf = (h) => { let v = RGB.get(h); if (!v) { v = [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255]; RGB.set(h, v); } return v; };

  // triangles with a colour per face, waiting to be one mesh
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), EU = new THREE.Euler(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3();
  class Bag {
    constructor() { this.p = []; this.c = []; }
    // a shape at x,y,z, stretched sx,sy,sz and turned (o.ry, o.rx, o.rz); col: a colour, a list (one for the whole shape),
    // or fn(height of the face's middle in the shape, face number) → colour; o.j: how much each face's shade varies
    put(sh, x, y, z, sx, sy, sz, col, o = {}) {
      EU.set(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ'); Q.setFromEuler(EU); V3.set(x, y, z); S3.set(sx, sy, sz); M4.compose(V3, Q, S3);
      const e = M4.elements, p = this.p, c = this.c, j = o.j != null ? o.j : 0.07;
      const fn = typeof col === 'function' ? col : null, base = fn ? null : rgbOf(Array.isArray(col) ? pick(col) : col);
      for (let i = 0; i < sh.length; i += 9) {
        for (let k = 0; k < 9; k += 3) {
          const a = sh[i + k], b = sh[i + k + 1], d = sh[i + k + 2];
          p.push(e[0] * a + e[4] * b + e[8] * d + e[12], e[1] * a + e[5] * b + e[9] * d + e[13], e[2] * a + e[6] * b + e[10] * d + e[14]);
        }
        const cc = fn ? rgbOf(fn((sh[i + 1] + sh[i + 4] + sh[i + 7]) / 3, i / 9)) : base, f = 1 + (rnd() - 0.5) * 2 * j;
        const r = Math.min(1, cc[0] * f), g = Math.min(1, cc[1] * f), b = Math.min(1, cc[2] * f);
        c.push(r, g, b, r, g, b, r, g, b);
      }
    }
    // a flat four-cornered patch of ground
    quad(xa, za, xb, zb, y, col) {
      this.p.push(xa, y, za, xa, y, zb, xb, y, zb, xa, y, za, xb, y, zb, xb, y, za);
      const cc = rgbOf(col), f = 1 + (rnd() - 0.5) * 0.05;
      for (let k = 0; k < 6; k++) this.c.push(cc[0] * f, cc[1] * f, cc[2] * f);
    }
    // lit: the light baked into the colours, the same sums the sky light and the sun make on a part, so it's drawn unlit (much cheaper),
    // plus a glow of its own (clouds)
    mesh(mat, lit, own = 0, order = 1) {
      if (!this.p.length) return null;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
      g.computeVertexNormals(); g.computeBoundingSphere();
      // the mesh sits at its own middle, so the renderer can draw the patches nearest first (what's behind then costs little)
      const o = g.boundingSphere.center.clone(); g.translate(-o.x, -o.y, -o.z); g.computeBoundingSphere();
      if (lit) {
        const n = g.attributes.normal.array, c = g.attributes.color.array;
        for (let i = 0; i < n.length; i += 3) {
          const t = 0.5 * n[i + 1] + 0.5, sun = Math.max(0, n[i] * SUN[0] + n[i + 1] * SUN[1] + n[i + 2] * SUN[2]) * 0.5 + own;
          c[i] = Math.min(1, c[i] * ((0.541 + 0.459 * t) * 0.78 + sun)); c[i + 1] = Math.min(1, c[i + 1] * ((0.541 + 0.459 * t) * 0.78 + sun)); c[i + 2] = Math.min(1, c[i + 2] * ((0.604 + 0.396 * t) * 0.78 + sun));
        }
      }
      const m = new THREE.Mesh(g, mat); m.position.copy(o); m.userData.ownGeo = true;
      m.renderOrder = order; // after the parts (and the ground last of all), so what's in front hides the rest before it costs anything
      return m;
    }
  }

  /* ---------------- the looks ---------------- */
  const BASE = {
    ground: [0x6cc24a, 0x62b843, 0x74c752, 0x5aad3e], hill: [0x5fb544, 0x67bd48, 0x58a93e], low: 0x4b8a38,
    rock: [0x9ca3af, 0x8e959e, 0xa9aeb6], mount: [0x7d8896, 0x6f7a88, 0x8994a1], snow: 0xf8fafc, snowAt: 0.6, peaks: 'peak',
    trees: [['oak', 5], ['pine', 3], ['birch', 1], ['blossom', 0.5]], leaf: [0x3f9b3a, 0x4caf50, 0x2f8a3a, 0x58b858], pine: [0x2f7d3a, 0x276d33, 0x35884a],
    trunk: [0x8b5a2b, 0x7a4b22], bloom: [0xf9a8d4, 0xf472b6, 0xfbcfe8], birch: [0xa3d65c, 0x8cc84b, 0xc5e07a],
    flowers: [0xef4444, 0xfacc15, 0xffffff, 0xa855f7, 0xf472b6, 0x60a5fa], bush: [0x3f8f3a, 0x4ca64a, 0x5bb450],
    pond: 0x3b8fe0, shore: 0xe6d6a3, cloud: 0xffffff, n: { trees: 1, flowers: 1, rocks: 1, bushes: 1, ponds: 3, hills: 1 },
  };
  const TH = {
    meadow: {},
    forest: { ground: [0x4f9a3c, 0x569f40, 0x4a8f38, 0x5ea845], trees: [['pine', 5], ['oak', 3], ['birch', 0.6]], n: { trees: 1.5, flowers: 0.4, rocks: 1.2, bushes: 1.4, ponds: 2, hills: 1.2 } },
    blossom: { trees: [['blossom', 4], ['oak', 1.2], ['birch', 1]], flowers: [0xf9a8d4, 0xffffff, 0xf472b6, 0xfde68a], n: { trees: 1, flowers: 1.4, rocks: 0.7, bushes: 1, ponds: 3, hills: 1 } },
    autumn: { ground: [0x9caf4b, 0x8fa646, 0xa8b553, 0xb3a24c], hill: [0x8fa646, 0x9caf4b, 0xa39a45], leaf: [0xf59e0b, 0xea580c, 0xdc2626, 0xfacc15, 0xc2410c],
      birch: [0xfacc15, 0xfde047], trees: [['oak', 5], ['pine', 1.5], ['birch', 1.5]], flowers: [0xf59e0b, 0xdc2626, 0xfde047], bush: [0xb45309, 0xa16207, 0xc2410c], n: { trees: 1.2, flowers: 0.5, rocks: 1, bushes: 1.2, ponds: 2, hills: 1 } },
    desert: { ground: [0xe9c46a, 0xe3b95c, 0xf0cf7a, 0xdcb257], hill: [0xe0b45a, 0xe9c46a, 0xd9a94f], low: 0xc99a52, rock: [0xc2703d, 0xb45f33, 0xcd8a52], mount: [0xc2703d, 0xd98b4f], peaks: 'mesa', snowAt: 2,
      trees: [['cactus', 5], ['dead', 1], ['palm', 0.4]], bush: [0x9a8c4a, 0xa3a35a, 0x8b7d3c], flowers: [0xf472b6, 0xfb923c], pond: 0x2fa3c9, shore: 0x8fbf5a, n: { trees: 0.6, flowers: 0.25, rocks: 1.4, bushes: 0.8, ponds: 1, hills: 1.3 } },
    beach: { ground: [0xf2d38a, 0xeccb7e, 0xf6dc9a], hill: [0x5fb544, 0x67bd48], rock: [0x9ca3af, 0xa8a29e], trees: [['palm', 5], ['oak', 0.6]], leaf: [0x3f9b3a, 0x4caf50],
      bush: [0x3f8f3a, 0x4ca64a], flowers: [0xef4444, 0xf472b6, 0xfacc15], n: { trees: 0.8, flowers: 0.3, rocks: 1, bushes: 0.8, ponds: 1, hills: 0.6 } },
    snow: { ground: [0xf1f5f9, 0xe8eef5, 0xf8fafc], hill: [0xeef2f7, 0xe2e8f0, 0xf8fafc], low: 0xdbe3ec, rock: [0xb6c2d1, 0x94a3b8, 0xa5b4c6], mount: [0x8d9bb0, 0x7b8aa0, 0x9aa7ba], snowAt: 0.32,
      trees: [['snowpine', 6], ['dead', 0.6]], bush: [0xdbe4ee, 0xcbd5e1], flowers: [], pond: 0xbfdbfe, shore: 0xe2e8f0, n: { trees: 1.2, flowers: 0, rocks: 1, bushes: 0.6, ponds: 2, hills: 1.2 }, extras: ['snowmen'] },
    volcano: { ground: [0x3f2a2a, 0x47302b, 0x35231f, 0x4a3328], hill: [0x4a3328, 0x3f2a2a, 0x523a2e], low: 0x2e201c, rock: [0x1c1917, 0x292524, 0x3a3330], mount: [0x3b2a25, 0x2e211d, 0x44302a], peaks: 'volcano', snowAt: 2,
      trees: [['dead', 4], ['crystal', 0.5]], gems: [0xff6a00, 0xffb020], bush: [0x57534e, 0x44403c], flowers: [], pond: 0xff5a00, lava: true, shore: 0x1c1917, cloud: 0xb8aca6, n: { trees: 0.6, flowers: 0, rocks: 1.8, bushes: 0.4, ponds: 4, hills: 1 } },
    candy: { ground: [0xf9a8d4, 0xfbcfe8, 0xa7f3d0, 0xddd6fe, 0xfde68a], hill: [0xf472b6, 0x34d399, 0xfbbf24, 0xa78bfa, 0x60a5fa], low: 0xf9a8d4, rock: [0xfef3c7, 0xffffff, 0xfce7f3],
      mount: [0xf472b6, 0xe879f9, 0xc084fc], snow: 0xffffff, snowAt: 0.55, trees: [['lollipop', 4], ['cane', 2], ['gumtree', 2]], bush: [0xf472b6, 0x34d399, 0xfbbf24],
      flowers: [0xef4444, 0xfacc15, 0x60a5fa, 0x34d399, 0xa855f7, 0xffffff], pond: 0x7c4a2d, shore: 0xfbcfe8, cloud: 0xfde7f3, n: { trees: 1, flowers: 1.2, rocks: 0.6, bushes: 1, ponds: 2, hills: 1.3 } },
    space: { ground: [0x2e2a6e, 0x28245f, 0x363080], hill: [0x3b3585, 0x2e2a6e], low: 0x241f5a, rock: [0x4c4f6b, 0x5b5e7a, 0x3f3d56], mount: [0x3b3566, 0x4c4380, 0x2e2a5e], peaks: 'spiky',
      snow: 0xa78bfa, snowAt: 0.78, trees: [['crystal', 4]], gems: [0xa855f7, 0x22d3ee, 0xf472b6, 0x818cf8], bush: [], flowers: [], cloud: null, n: { trees: 0.7, flowers: 0, rocks: 1.8, bushes: 0, ponds: 0, hills: 0.8 }, extras: ['craters', 'planets'] },
    night: { ground: [0x1f3b2c, 0x24412f, 0x1b3427], hill: [0x22402f, 0x1d3829, 0x274634], low: 0x18301f, rock: [0x475569, 0x3f4a5a, 0x52606f], mount: [0x334155, 0x2b3646, 0x3a4658], snow: 0xcbd5e1, snowAt: 0.66,
      trees: [['pine', 4], ['dead', 2], ['oak', 1]], leaf: [0x1f5130, 0x1a4529], pine: [0x14532d, 0x166534], bush: [0x1f4a2e, 0x234f33], flowers: [], gems: [0xa855f7, 0x22d3ee, 0xf472b6],
      pond: 0x1e3a5f, shore: 0x3f4a3a, cloud: 0x475569, n: { trees: 1.1, flowers: 0, rocks: 1, bushes: 0.8, ponds: 2, hills: 1 }, extras: ['stars', 'fireflies'] },
  };
  for (const k in TH) TH[k] = Object.assign({}, BASE, TH[k], { n: Object.assign({}, BASE.n, TH[k].n), name: k });

  /* ---------------- the things that grow ---------------- */
  const leafy = (th) => pick(th.leaf);
  const TREES = {
    oak(b, x, y, z, s, th) {
      b.put(SH.trunk, x, y - 0.4, z, 0.55 * s, 4.8 * s, 0.55 * s, th.trunk);
      const c = leafy(th), ry = rnd() * TAU;
      b.put(SH.blob, x, y + 5.8 * s, z, 3.3 * s, 2.9 * s, 3.3 * s, c, { ry });
      for (const a of [0, 3.1]) if (rnd() < 0.6) b.put(SH.blob, x + Math.cos(a + ry) * 1.9 * s, y + 4.9 * s, z + Math.sin(a + ry) * 1.9 * s, 2.2 * s, 2 * s, 2.2 * s, c, { ry: a });
    },
    blossom(b, x, y, z, s, th) { TREES.oak(b, x, y, z, s, Object.assign({}, th, { leaf: th.bloom })); },
    pine(b, x, y, z, s, th, glow, snowy) {
      b.put(SH.trunk, x, y - 0.4, z, 0.45 * s, 2.8 * s, 0.45 * s, th.trunk);
      const c = pick(th.pine), col = snowy ? (h) => (h > 0.62 ? 0xf8fafc : c) : c, ry = rnd() * TAU;
      b.put(SH.cone, x, y + 1.8 * s, z, 3.3 * s, 4.6 * s, 3.3 * s, col, { ry });
      b.put(SH.cone, x, y + 4.3 * s, z, 2.6 * s, 4.2 * s, 2.6 * s, col, { ry: ry + 0.4 });
      b.put(SH.cone, x, y + 6.7 * s, z, 1.8 * s, 3.6 * s, 1.8 * s, col, { ry: ry + 0.8 });
    },
    snowpine(b, x, y, z, s, th) { TREES.pine(b, x, y, z, s, th, null, true); },
    birch(b, x, y, z, s, th) {
      b.put(SH.trunk, x, y - 0.4, z, 0.38 * s, 7.4 * s, 0.38 * s, (h) => (h > 0.3 && h < 0.36) || (h > 0.6 && h < 0.65) ? 0x334155 : 0xeeeae0, { j: 0.03 });
      b.put(SH.blob, x, y + 7.6 * s, z, 2.3 * s, 3.4 * s, 2.3 * s, th.birch, { ry: rnd() * TAU });
    },
    palm(b, x, y, z, s, th) {
      const a = rnd() * TAU, lean = rr(0.08, 0.22), dx = Math.cos(a), dz = Math.sin(a);
      let px = x, py = y - 0.4, pz = z;
      for (let i = 0; i < 4; i++) { // the trunk, in bits that lean more as it goes up
        const L = 2.4 * s, t = lean * (1 + i * 0.5);
        b.put(SH.trunk, px, py, pz, (0.5 - i * 0.03) * s, L, (0.5 - i * 0.03) * s, i % 2 ? 0x9a6b3c : 0x8b5a2b, { rx: dz * t, rz: -dx * t });
        px += dx * Math.sin(t) * L; pz += dz * Math.sin(t) * L; py += Math.cos(t) * L;
      }
      const c = pick(th.leaf);
      for (let i = 0; i < 6; i++) { const r = (i / 6) * TAU + rnd() * 0.3; b.put(SH.box, px + Math.cos(r) * 2.2 * s, py - 0.2 * s, pz + Math.sin(r) * 2.2 * s, 1.1 * s, 0.14 * s, 4.6 * s, c, { ry: -r + Math.PI / 2, rx: 0.42 }); }
      b.put(SH.blob, px, py - 0.6 * s, pz, 0.7 * s, 0.5 * s, 0.7 * s, 0x6b4423); // coconuts
    },
    cactus(b, x, y, z, s) {
      const c = [0x4d8b31, 0x5a9a3a], h = rr(5, 8) * s;
      b.put(SH.post, x, y - 0.4, z, 0.85 * s, h, 0.85 * s, c);
      b.put(SH.blob, x, y + h - 0.5, z, 0.85 * s, 0.6 * s, 0.85 * s, c);
      const a = rnd() * TAU;
      for (const sd of [-1, 1]) {
        if (rnd() < 0.25) continue;
        const ay = rr(0.3, 0.55) * h, ax = x + Math.cos(a) * sd * 1.6 * s, az = z + Math.sin(a) * sd * 1.6 * s;
        b.put(SH.box, (x + ax) / 2, y + ay - 0.4 * s, (z + az) / 2, 1.6 * s, 0.8 * s, 0.8 * s, c, { ry: -a });
        b.put(SH.post, ax, y + ay - 0.4 * s, az, 0.5 * s, rr(1.8, 3) * s, 0.5 * s, c);
      }
    },
    dead(b, x, y, z, s, th) {
      const c = th.name === 'snow' ? [0x5b4636, 0x4b3a2a] : [0x4b3a2a, 0x3b2f25, 0x5b4636];
      b.put(SH.trunk, x, y - 0.4, z, 0.42 * s, 6 * s, 0.42 * s, c);
      for (let i = 0; i < 3; i++) { const a = rnd() * TAU, t = rr(0.6, 1); b.put(SH.trunk, x, y + rr(2.6, 4.6) * s, z, 0.18 * s, rr(2, 3.4) * s, 0.18 * s, c, { ry: a, rz: t }); }
    },
    lollipop(b, x, y, z, s, th) {
      b.put(SH.trunk, x, y - 0.4, z, 0.22 * s, 6.5 * s, 0.22 * s, 0xffffff, { j: 0.02 });
      const c1 = pick(th.hill), c2 = 0xffffff;
      b.put(SH.post, x, y + 7.4 * s, z, 2.6 * s, 0.9 * s, 2.6 * s, (h, i) => (i % 4 < 2 ? c1 : c2), { rx: Math.PI / 2, ry: rnd() * TAU, j: 0.03 });
    },
    cane(b, x, y, z, s) {
      const col = (k) => (k % 2 ? 0xffffff : 0xef4444), a = rnd() * TAU;
      for (let k = 0; k < 6; k++) b.put(SH.post, x, y - 0.4 + k * 1.2 * s, z, 0.45 * s, 1.2 * s, 0.45 * s, col(k), { j: 0.02 });
      for (let k = 0; k < 4; k++) { // the hook
        const t = (k + 0.5) / 4 * Math.PI, hx = (1 - Math.cos(t)) * 1.1 * s, hy = Math.sin(t) * 1.1 * s;
        b.put(SH.blob, x + Math.cos(a) * hx, y - 0.4 + 7.2 * s + hy, z + Math.sin(a) * hx, 0.5 * s, 0.5 * s, 0.5 * s, col(k + 6), { j: 0.02 });
      }
    },
    gumtree(b, x, y, z, s, th) {
      b.put(SH.trunk, x, y - 0.4, z, 0.3 * s, 4.5 * s, 0.3 * s, 0xfef3c7);
      b.put(SH.ball, x, y + 6 * s, z, 3 * s, 2.6 * s, 3 * s, pick(th.hill), { j: 0.03 });
    },
    crystal(b, x, y, z, s, th, glow) {
      const c = pick(th.gems);
      for (let i = 0; i < 3; i++) { const h = rr(2, 4.5) * s; glow.put(SH.gem, x + rr(-1, 1) * s, y + h * 0.3, z + rr(-1, 1) * s, 0.7 * s, h, 0.7 * s, c, { rx: rr(-0.4, 0.4), rz: rr(-0.4, 0.4), ry: rnd() * TAU, j: 0.15 }); }
    },
  };
  const treeKind = (th) => { const t = th.trees, sum = t.reduce((a, k) => a + k[1], 0); let v = rnd() * sum; for (const [k, w] of t) if ((v -= w) <= 0) return k; return t[0][0]; };

  /* ---------------- building it ---------------- */
  function build(E) {
    const L = E.land;
    if (L === false) return;
    const cfg = Object.assign({ theme: 'meadow', mode: 'ground', g: 0 }, L || {});
    let h = 7; for (const ch of E.id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    rnd = mulberry(h);
    // where you play: kept clear
    let box = cfg.box, top = 0;
    {
      const b = [1e9, 1e9, -1e9, -1e9];
      for (const p of parts) { b[0] = Math.min(b[0], p.x - p.sx / 2); b[1] = Math.min(b[1], p.z - p.sz / 2); b[2] = Math.max(b[2], p.x + p.sx / 2); b[3] = Math.max(b[3], p.z + p.sz / 2); top = Math.max(top, p.y + p.sy / 2); }
      if (!box) box = b[0] < b[2] ? b : [-40, -40, 40, 40];
    }
    const [x0, z0, x1, z1] = box, W = x1 - x0, H = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const mode = cfg.mode, sea = cfg.sea != null ? cfg.sea : -1;
    const gy = mode === 'sky' ? (cfg.low != null ? cfg.low : (E.killY || -40) - 60) : mode === 'sea' ? sea : cfg.g - 0.5; // the land's level
    const holes = cfg.holes || [];
    const themeAt = (x, z) => { if (cfg.bands) for (const b of cfg.bands) if (z >= b[0] && z < b[1]) return TH[b[2]] || TH.meadow; return TH[cfg.theme] || TH.meadow; };
    const TH0 = TH[cfg.theme] || TH.meadow;
    const distBox = (x, z) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1));
    const inRect = (x, z, r, m = 0) => x > r[0] - m && x < r[2] + m && z > r[1] - m && z < r[3] + m;

    // the meshes, a patch of land each (so the patches behind you aren't drawn)
    const CH = 600, bags = new Map();
    const bagAt = (x, z) => { const k = Math.floor(x / CH) + ',' + Math.floor(z / CH); let v = bags.get(k); if (!v) { v = { s: new Bag(), g: new Bag(), p: new Bag(), d: new Bag(), m: new Bag(), f: new Bag() }; bags.set(k, v); } return v; }; // solid, glowing, puffs (smoke), little things (left out on slow computers), mountains, the ground
    const clouds = new Bag();

    // a point d out from the box, anywhere round it (along its sides and round its corners)
    function around(d) {
      const A = (Math.PI / 2) * d, segs = [W, A, H, A, W, A, H, A];
      let t = rnd() * (2 * W + 2 * H + 4 * A), k = 0;
      while (k < 7 && t > segs[k]) t -= segs[k++];
      const f = segs[k] ? t / segs[k] : 0, q = (a0, ox, oz) => { const a = a0 + f * Math.PI / 2; return [ox + Math.cos(a) * d, oz + Math.sin(a) * d]; };
      return [[x0 + f * W, z0 - d], q(-Math.PI / 2, x1, z0), [x1 + d, z0 + f * H], q(0, x1, z1), [x1 - f * W, z1 + d], q(Math.PI / 2, x0, z1), [x0 - d, z1 - f * H], q(Math.PI, x0, z0)][k];
    }
    const per = (d) => 2 * (W + H) + TAU * d;
    const spread = mode === 'sky' ? 480 : 0; // a sky experience's valley has things right under it too
    const spot = (dMin, dMax, pw) => (mode === 'sky' && dMin < spread ? [x0 - spread + rnd() * (W + 2 * spread), z0 - spread + rnd() * (H + 2 * spread)] : around(dMin + (dMax - dMin) * Math.pow(rnd(), pw)));

    // hills and islands, and how high the land is anywhere
    const domes = [], ponds = [];
    const domeH = (x, z) => { let y = gy; for (const d of domes) { const q = Math.hypot(x - d.x, z - d.z) / d.r; if (q < 1) y = Math.max(y, d.y0 + d.h * Math.sqrt(1 - q * q) * 0.88 - 0.3); } return y; };
    function dome(x, z, r, hh, y0, col, amp = 0.08) {
      const sh = lumpy(new THREE.SphereGeometry(1, 10, 4, 0, TAU, 0, Math.PI / 2), amp, 0.06);
      bagAt(x, z).s.put(sh, x, y0, z, r, hh, r, col, { ry: rnd() * TAU, j: 0.05 });
      domes.push({ x, z, r, h: hh, y0 });
    }
    const keep = cfg.keep || [];
    const clear = (x, z, r) => !holes.some((hb) => inRect(x, z, hb, r)) && !keep.some((kb) => inRect(x, z, kb, r)) && !ponds.some((p) => Math.hypot(x - p.x, z - p.z) < p.r + r) && (mode === 'sky' || distBox(x, z) > r);

    /* the ground (or the sea): patches, with lines along every hole's edges so the holes cut it exactly */
    {
      const EXT = 1700, gx0 = x0 - EXT, gx1 = x1 + EXT, gz0 = z0 - EXT, gz1 = z1 + EXT;
      const step = Math.max(80, Math.sqrt(((gx1 - gx0) * (gz1 - gz0)) / 1500));
      const lines = (a, b, cuts) => { const s = new Set(); for (let v = a; v < b; v += step) s.add(Math.round(v * 100) / 100); s.add(b); for (const c of cuts) if (c > a && c < b) s.add(c); return [...s].sort((p, q) => p - q); };
      // no ground under the floors either: they hide it, but drawing it would still cost
      const cut = holes.concat((cfg.under || (mode === 'ground' ? [box] : [])).map((r) => [r[0] + 0.5, r[1] + 0.5, r[2] - 0.5, r[3] - 0.5]));
      const xs = lines(gx0, gx1, cut.flatMap((hb) => [hb[0], hb[2]])), zs = lines(gz0, gz1, cut.flatMap((hb) => [hb[1], hb[3]]));
      const seed = h, hash2 = (i, j) => { let v = Math.imul(i, 374761393) + Math.imul(j, 668265263) + seed; v = Math.imul(v ^ (v >>> 13), 1274126177); return ((v ^ (v >>> 16)) >>> 0) / 4294967296; };
      const noise = (x, z) => { const fx = x / 230, fz = z / 230, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v), a = hash2(i, j), b = hash2(i + 1, j), c = hash2(i, j + 1), d = hash2(i + 1, j + 1); return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv; };
      const water = cfg.water || [0x2d7cc0, 0x2a76b6, 0x3384c6];
      for (let i = 0; i + 1 < xs.length; i++) for (let j = 0; j + 1 < zs.length; j++) {
        const mx = (xs[i] + xs[i + 1]) / 2, mz = (zs[j] + zs[j + 1]) / 2;
        if (cut.some((hb) => inRect(mx, mz, hb))) continue;
        const pal = mode === 'sea' ? water : themeAt(mx, mz).ground, n = noise(mx, mz);
        bagAt(mx, mz).f.quad(xs[i], zs[j], xs[i + 1], zs[j + 1], gy, pal[Math.min(pal.length - 1, Math.floor(n * n * 1.6 * pal.length))]);
      }
    }

    /* mountains: a ring of them, far off (with snow on top, or flat-topped, or smoking) */
    const nM = Math.round(clamp(per(500) / 110, 18, 46));
    for (let i = 0; i < nM; i++) {
      const R = rr(90, 220), [x, z] = around(rr(R + 170, R + 760)), th = themeAt(x, z), Hm = R * rr(0.7, 1.45) * (th.peaks === 'mesa' ? 0.5 : 1);
      const y0 = (mode === 'sea' ? sea - 4 : gy) - 1, b = bagAt(x, z), off = rnd() * 0.08;
      if (th.peaks === 'mesa') {
        const sh = lumpy(new THREE.CylinderGeometry(0.72, 1, 1, 9, 4, true), 0.05, 0.02), c = th.mount;
        b.m.put(sh, x, y0, z, R, Hm, R, (y) => c[Math.floor(y * 6) % 2], { ry: rnd() * TAU, j: 0.04 });
        b.m.put(SH.disc, x, y0 + Hm - 0.6, z, R * 0.7, 1, R * 0.7, 0xd9a066, { j: 0.04 });
        continue;
      }
      const volcano = th.peaks === 'volcano';
      const sh = volcano ? lumpy(new THREE.CylinderGeometry(0.17, 1, 1, 11, 5, true), 0.1, 0.03) : lumpy(new THREE.ConeGeometry(1, 1, 9, 4, true), th.peaks === 'spiky' ? 0.2 : 0.12, 0.05);
      b.m.put(sh, x, y0, z, R, Hm, R, (y, f) => (y < 0.12 && th.low && !volcano ? th.low : y > th.snowAt + off + ((f * 7919) % 13) / 100 ? th.snow : pick(th.mount)), { ry: rnd() * TAU, j: 0.06 });
      if (volcano) { b.g.put(SH.disc, x, y0 + Hm * 0.985, z, R * 0.16, 1, R * 0.16, 0xff5a00, { j: 0.1 }); if (rnd() < 0.6) for (let k = 0; k < 3; k++) bagAt(x, z).p.put(SH.ball, x + rr(-6, 6) + k * 6, y0 + Hm + 10 + k * 18, z + rr(-6, 6), 14 + k * 8, 9 + k * 5, 14 + k * 8, [0xa8a29e, 0x9c938e], { ry: rnd() * TAU, j: 0.03 }); } // smoke
      if (th.peaks === 'spiky' && rnd() < 0.7) b.g.put(SH.gem, x, y0 + Hm + 4, z, 5, 14, 5, pick(th.gems));
    }

    /* ridges down both sides (a canyon), with pines on top */
    if (cfg.ridges) {
      const [rx0, rx1, rz0, rz1] = cfg.ridges;
      for (const sd of [-1, 1]) for (let z = rz1; z > rz0; z -= rr(38, 60)) {
        const r = rr(45, 80), x = sd < 0 ? rx0 - r - 2 : rx1 + r + 2, th = themeAt(x, z), hh = rr(34, 82);
        dome(x, z, r, hh, gy - 2, (y) => (y > 0.62 ? pick(th.hill) : pick(th.rock)), 0.14);
        for (let k = 0; k < 4; k++) { const a = rnd() * TAU, q = rr(0, 0.45) * r, tx = x + Math.cos(a) * q, tz = z + Math.sin(a) * q; TREES.pine(bagAt(tx, tz).s, tx, domeH(tx, tz), tz, rr(1.1, 1.6), th); }
      }
    }

    /* cliffs: rocky walls, in blocks of uneven height */
    for (const [a0, b0, c0, a1, b1, c1] of cfg.cliffs || []) {
      const alongX = a1 - a0 > c1 - c0, len = alongX ? a1 - a0 : c1 - c0, n = Math.max(1, Math.round(len / 9));
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n, hh = b1 - b0 + rr(-2, 5);
        const x = alongX ? a0 + (a1 - a0) * (t0 + t1) / 2 : (a0 + a1) / 2, z = alongX ? (c0 + c1) / 2 : c0 + (c1 - c0) * (t0 + t1) / 2;
        bagAt(x, z).s.put(SH.box, x, b0, z, alongX ? len / n + 0.4 : a1 - a0 + rr(0, 2), hh, alongX ? c1 - c0 + rr(0, 2) : len / n + 0.4, TH0.rock, { j: 0.08 });
      }
    }

    /* the sea's islands, with sandy shores */
    const isles = [];
    if (mode === 'sea') {
      const nI = Math.round(clamp(per(300) / 150, 6, 16));
      for (let i = 0; i < nI * 3 && isles.length < nI; i++) {
        const r = rr(18, 62), [x, z] = around(rr(r + 30, 640));
        if (isles.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + r + 10) || domes.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + r) || !clear(x, z, r)) continue;
        const th = themeAt(x, z);
        dome(x, z, r, 4.5, sea - 2.5, [0xf2d38a, 0xeccb7e], 0.05);
        dome(x, z, r * 0.74, rr(6, Math.max(8, r * 0.35)), sea - 2, th.name === 'snow' ? th.hill : [0x5fb544, 0x67bd48, 0x58a93e], 0.08);
        isles.push({ x, z, r });
      }
    }
    const onIsle = () => { const o = pick(isles), a = rnd() * TAU, q = Math.sqrt(rnd()) * o.r * 0.62; return [o.x + Math.cos(a) * q, o.z + Math.sin(a) * q]; };
    const land = mode === 'sea' ? (dMin, dMax, pw) => (isles.length ? onIsle() : around(dMax)) : spot;

    /* hills */
    if (mode !== 'sea') {
      const nH = Math.round(clamp(per(300) / 90, 8, 36) * TH0.n.hills);
      for (let i = 0; i < nH; i++) {
        const r = rr(26, 95), [x, z] = spot(r + 12, 680, 1.4), th = themeAt(x, z);
        if (!clear(x, z, r + 6)) continue;
        dome(x, z, r, r * rr(0.18, 0.48), gy - 0.6, th.name === 'candy' ? [pick(th.hill)] : th.hill);
      }
    }

    /* ponds (lava in a volcano, chocolate in candy land), with a shore, reeds and lily pads */
    {
      const nP = mode === 'sea' ? 0 : Math.round(TH0.n.ponds * clamp(per(100) / 700, 0.6, 3));
      for (let i = 0, tries = 0; i < nP && tries < 60; tries++) {
        const r = TH0.lava ? rr(12, 30) : rr(7, 18), [x, z] = spot(r + 16, 190, 1.2), th = themeAt(x, z);
        if (!th.n.ponds || !clear(x, z, r + 3) || domeH(x, z) > gy + 0.1) continue;
        const b = bagAt(x, z);
        b.s.put(SH.disc, x, gy + 0.15, z, r + 2.2, 1, r + 2.2, th.shore, { j: 0.04 });
        (th.lava ? b.g : b.s).put(SH.disc, x, gy + 0.3, z, r, 1, r, th.pond, { j: th.lava ? 0.12 : 0.03 });
        if (th.name === 'meadow' || th.name === 'forest' || th.name === 'blossom') {
          for (let k = 0; k < 6; k++) { const a = rnd() * TAU, q = r + rr(-0.4, 1.2); b.d.put(SH.stem, x + Math.cos(a) * q, gy, z + Math.sin(a) * q, 0.18, rr(2, 3.4), 0.18, [0x4d7c0f, 0x65a30d]); }
          for (let k = 0; k < 3; k++) { const a = rnd() * TAU, q = rnd() * r * 0.7; b.d.put(SH.disc, x + Math.cos(a) * q, gy + 0.45, z + Math.sin(a) * q, 1.1, 1, 1.1, 0x3f9b3a); }
        }
        ponds.push({ x, z, r: r + 2.2 }); i++;
      }
    }

    /* trees: some round the edge, most in woods further out */
    {
      const nT = Math.round((mode === 'sea' ? clamp(isles.reduce((a, o) => a + o.r * o.r, 0) / 150, 0, 300) : clamp(per(150) * 0.16, 100, 300)) * TH0.n.trees);
      const woods = Array.from({ length: Math.max(4, Math.round(nT / 18)) }, () => spot(30, 320, 1.3));
      for (let i = 0; i < nT; i++) {
        let x, z;
        if (mode === 'sea') [x, z] = onIsle();
        else if (i % 3 === 0) [x, z] = spot(5, 120, 1.6);
        else { const w = woods[i % woods.length], a = rnd() * TAU, q = Math.abs(rr(-1, 1) + rr(-1, 1)) * 40; x = w[0] + Math.cos(a) * q; z = w[1] + Math.sin(a) * q; }
        if (!clear(x, z, 3)) continue;
        const th = themeAt(x, z), k = treeKind(th), b = bagAt(x, z);
        TREES[k](b.s, x, domeH(x, z), z, rr(0.9, 1.6) * (k === 'oak' || k === 'pine' || k === 'snowpine' ? rr(1, 1.35) : 1), th, b.g);
      }
    }

    /* rocks and boulders, bushes, flowers */
    for (let i = 0, n = Math.round(clamp(per(200) * 0.06, 40, 140) * TH0.n.rocks); i < n; i++) {
      const [x, z] = mode === 'sea' && rnd() < 0.5 ? around(rr(8, 320)) : land(4, 440, 1.5), th = themeAt(x, z), s = rnd() < 0.15 ? rr(4, 9) : rr(0.8, 3.2);
      if (!clear(x, z, s) || (s > 4 && mode !== 'sky' && distBox(x, z) < 30)) continue; // no boulders right by the edge
      const y = mode === 'sea' && !isles.length ? sea : Math.max(domeH(x, z), mode === 'sea' ? sea - 1 : gy);
      bagAt(x, z)[s > 3 ? 's' : 'd'].put(th.name === 'candy' ? SH.box : SH.blob, x, y + s * 0.2, z, s * rr(0.8, 1.3), s * rr(0.55, 0.95), s * rr(0.8, 1.2), th.rock, { ry: rnd() * TAU, rx: rr(-0.3, 0.3) });
    }
    if (mode !== 'sea' || isles.length) for (let i = 0, n = Math.round(clamp(per(40) * 0.08, 30, 110) * TH0.n.bushes); i < n; i++) {
      const [x, z] = land(3, 70, 1.3), th = themeAt(x, z);
      if (!th.bush.length || !clear(x, z, 2)) continue;
      const y = domeH(x, z), c = pick(th.bush), b = bagAt(x, z).d;
      for (let k = 0, m = 1 + Math.floor(rnd() * 2); k < m; k++) { const s = rr(0.9, 1.7); b.put(SH.blob, x + rr(-1.2, 1.2), y + s * 0.45, z + rr(-1.2, 1.2), s * 1.2, s, s * 1.2, c, { ry: rnd() * TAU }); }
    }
    if (mode !== 'sea') for (let i = 0, n = Math.round(clamp(per(30) * 0.04, 16, 60) * TH0.n.flowers); i < n; i++) {
      const [x, z] = spot(2.5, 50, 1.2), th = themeAt(x, z);
      if (!th.flowers.length || !clear(x, z, 3)) continue;
      const c = pick(th.flowers), b = bagAt(x, z).d, y = domeH(x, z);
      for (let k = 0, m = 3 + Math.floor(rnd() * 3); k < m; k++) {
        const fx = x + rr(-2.6, 2.6), fz = z + rr(-2.6, 2.6), hgt = rr(0.7, 1.2);
        b.put(SH.stem, fx, y, fz, 0.1, hgt, 0.1, 0x3f8f3a, { j: 0.02 });
        b.put(SH.gem, fx, y + hgt + 0.15, fz, 0.32, 0.26, 0.32, rnd() < 0.85 ? c : pick(th.flowers), { j: 0.05 });
      }
    }

    /* extras */
    const ex = new Set([].concat(TH0.extras || [], cfg.extras || []));
    if (cfg.bands) for (const b of cfg.bands) for (const e of (TH[b[2]] && TH[b[2]].extras) || []) ex.add(e);
    const near = (dMin, dMax) => (mode === 'sky' ? spot(0, 0, 1) : around(rr(dMin, dMax)));
    const where = (name) => (x, z) => !cfg.bands || themeAt(x, z).extras && themeAt(x, z).extras.includes(name) || (cfg.extras || []).includes(name);
    if (ex.has('snowmen')) for (let i = 0; i < 8; i++) {
      const [x, z] = near(6, 60); if (!where('snowmen')(x, z) || !clear(x, z, 2)) continue;
      const y = domeH(x, z), b = bagAt(x, z).s, a = rnd() * TAU;
      b.put(SH.ball, x, y + 1.3, z, 1.6, 1.5, 1.6, 0xf8fafc, { j: 0.02 }); b.put(SH.ball, x, y + 3.5, z, 1.15, 1.1, 1.15, 0xf8fafc, { j: 0.02 }); b.put(SH.ball, x, y + 5.1, z, 0.8, 0.8, 0.8, 0xf8fafc, { j: 0.02 });
      b.put(SH.cone, x + Math.cos(a) * 0.7, y + 5.1, z + Math.sin(a) * 0.7, 0.16, 0.9, 0.16, 0xf97316, { ry: -a, rz: -Math.PI / 2 });
    }
    if (ex.has('graves')) for (let gI = 0; gI < 3; gI++) {
      const [gx, gz] = near(14, 40);
      for (let i = 0; i < 12; i++) {
        const x = gx + (i % 4) * 4 - 6 + rr(-0.5, 0.5), z = gz + Math.floor(i / 4) * 5 - 5; if (!clear(x, z, 1)) continue;
        const y = domeH(x, z), b = bagAt(x, z).s, ry = rr(-0.2, 0.2), c = [0x94a3b8, 0x8b95a5, 0xa3acb9];
        if (rnd() < 0.3) { b.put(SH.box, x, y, z, 0.4, 2.6, 0.4, c, { ry }); b.put(SH.box, x, y + 1.6, z, 1.6, 0.4, 0.4, c, { ry }); }
        else { b.put(SH.box, x, y, z, 1.5, 2, 0.4, c, { ry, rz: rr(-0.08, 0.08) }); b.put(SH.blob, x, y + 2, z, 0.75, 0.55, 0.2, c, { ry }); }
      }
    }
    if (ex.has('pumpkins')) for (let i = 0; i < 26; i++) {
      const [x, z] = near(3, 50); if (!clear(x, z, 1)) continue;
      const y = domeH(x, z), b = bagAt(x, z), s = rr(0.7, 1.3);
      b.s.put(SH.ball, x, y + 0.6 * s, z, 1.2 * s, 0.85 * s, 1.2 * s, [0xf97316, 0xea580c]); b.s.put(SH.trunk, x, y + 1.2 * s, z, 0.12, 0.5 * s, 0.12, 0x3f6212);
    }
    if (ex.has('crystals')) for (let i = 0; i < 40; i++) { const [x, z] = near(4, 90); if (clear(x, z, 2)) TREES.crystal(null, x, domeH(x, z), z, rr(0.8, 1.6), Object.assign({}, TH0, { gems: TH0.gems || TH.night.gems }), bagAt(x, z).g); }
    if (ex.has('fireflies')) for (let i = 0; i < 140; i++) { const [x, z] = near(2, 70); bagAt(x, z).g.put(SH.gem, x, domeH(x, z) + rr(1, 4.5), z, 0.16, 0.16, 0.16, [0xd9f99d, 0xfef08a], { j: 0.1 }); }
    if (ex.has('craters')) for (let i = 0; i < 26; i++) {
      const [x, z] = spot(10, 300, 1.3); if (!where('craters')(x, z) || !clear(x, z, 8)) continue;
      const r = rr(4, 10), b = bagAt(x, z).s, th = themeAt(x, z);
      b.put(SH.disc, x, gy + 0.15, z, r, 1, r, 0x1e1b4b, { j: 0.03 });
      for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; b.put(SH.blob, x + Math.cos(a) * r, gy, z + Math.sin(a) * r, r * 0.32, r * 0.22, r * 0.32, th.rock, { ry: a }); }
    }
    if (ex.has('planets')) for (let i = 0; i < 4; i++) {
      const [x, z] = cfg.bands ? [rr(-1, 1) * 500, ((cfg.bands.find((b) => b[2] === 'space') || [z0, z1])[0] + (cfg.bands.find((b) => b[2] === 'space') || [z0, z1])[1]) / 2 + rr(-300, 300)] : around(rr(300, 700));
      const r = rr(28, 80), y = gy + rr(180, 380), b = bagAt(x, z).s, c = pick([[0xf97316, 0xfdba74], [0x60a5fa, 0x93c5fd], [0xa78bfa, 0xc4b5fd], [0x34d399, 0x6ee7b7]]);
      b.put(SH.ball, x, y, z, r, r, r, (yy) => c[Math.floor((yy + 1) * 4) % 2], { ry: rnd() * TAU, j: 0.04 });
      if (rnd() < 0.6) b.put(SH.post, x, y - 0.4, z, r * 1.8, 0.8, r * 1.8, 0xe9d5ff, { rx: rr(0.2, 0.45), rz: rr(-0.3, 0.3), j: 0.03 });
    }
    if (ex.has('boats') && mode === 'sea') for (let i = 0; i < 7; i++) {
      const [x, z] = around(rr(30, 420)); if (!clear(x, z, 8) || isles.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + 8)) continue;
      const a = rnd() * TAU, b = bagAt(x, z).s, s = rr(1, 1.6);
      b.put(SH.box, x, sea - 0.6, z, 2.6 * s, 1.4 * s, 7 * s, [0xffffff, 0x92400e, 0xdc2626], { ry: a, j: 0.04 });
      b.put(SH.trunk, x, sea + 0.6, z, 0.14 * s, 8 * s, 0.14 * s, 0x78350f, { ry: a });
      b.put(SH.spike, x + Math.sin(a) * 1.6 * s, sea + 1.4 * s, z + Math.cos(a) * 1.6 * s, 0.25 * s, 6.5 * s, 2.4 * s, 0xf8fafc, { ry: a, j: 0.03 });
    }

    /* the fence: walls you can't see where you'd step off the floor, and a fence, hedge or wall you can */
    if (cfg.fence) {
      const fy = cfg.g - 0.5, style = cfg.fence;
      for (const r of cfg.fences || [box]) {
        const [a0, b0, a1, b1] = r, w = a1 - a0, d = b1 - b0;
        for (const [x, z, sx, sz] of [[(a0 + a1) / 2, b0 - 1, w + 4, 2], [(a0 + a1) / 2, b1 + 1, w + 4, 2], [a0 - 1, (b0 + b1) / 2, 2, d], [a1 + 1, (b0 + b1) / 2, 2, d]]) {
          const p = part({ x, y: fy + 30, z, sx, sy: 64, sz, solid: true, alpha: 0, plain: true, land: true }); p.m.visible = false;
        }
        if (cfg.floor) { const p = part({ x: (a0 + a1) / 2, y: fy - 1, z: (b0 + b1) / 2, sx: w, sy: 2, sz: d, solid: true, alpha: 0, plain: true, land: true }); p.m.visible = false; }
        if (style === 'none') continue;
        const sides = [[a0 - 0.7, b0 - 0.7, a1 + 0.7, b0 - 0.7], [a1 + 0.7, b0 - 0.7, a1 + 0.7, b1 + 0.7], [a1 + 0.7, b1 + 0.7, a0 - 0.7, b1 + 0.7], [a0 - 0.7, b1 + 0.7, a0 - 0.7, b0 - 0.7]];
        for (const [xa, za, xb, zb] of sides) {
          const len = Math.hypot(xb - xa, zb - za), ry = Math.atan2(xb - xa, zb - za), seg = style === 'wood' ? 8 : style === 'hedge' ? 10 : 8, n = Math.max(1, Math.round(len / seg));
          if (style === 'wood') for (const hy of [0.9, 2.1]) bagAt((xa + xb) / 2, (za + zb) / 2).s.put(SH.box, (xa + xb) / 2, fy + hy, (za + zb) / 2, 0.22, 0.32, len, 0xa0703c, { ry, j: 0.05 }); // the rails
          for (let k = 0; k <= n; k++) {
            const t = k / n, x = xa + (xb - xa) * t, z = za + (zb - za) * t, b = bagAt(x, z).s;
            if (style === 'wood') b.put(SH.box, x, fy, z, 0.5, 2.9, 0.5, 0x7a4b22, { ry });
            if (k === n) continue;
            const mx = xa + (xb - xa) * (t + 0.5 / n), mz = za + (zb - za) * (t + 0.5 / n), L = len / n;
            if (style === 'hedge') b.put(SH.box, mx, fy, mz, 1.8, rr(2, 2.6), L + 0.2, [0x3f8f3a, 0x478f3c, 0x3b8636], { ry, j: 0.06 });
            if (style === 'stone') b.put(SH.box, mx, fy, mz, 1.3, rr(1.3, 1.7), L - 0.1, [0x9ca3af, 0x8b929b, 0xa8adb5], { ry, j: 0.06 });
          }
        }
      }
    }

    /* clouds (they drift slowly round), a moon and stars at night */
    const ct = TH0.cloud;
    if (ct != null) {
      const nC = mode === 'sky' ? 34 : 24;
      for (let i = 0; i < nC; i++) {
        const [x, z] = mode === 'sky' && i % 2 ? spot(0, 0, 1) : around(rr(-Math.min(W, H) / 2, 820));
        const y = mode === 'sky' ? (i % 2 ? rr(gy + 30, Math.max(gy + 40, -20)) : rr(top + 50, top + 160)) : gy + rr(110, 230);
        const n = 3 + Math.floor(rnd() * 4), s = rr(0.8, 1.5), a = rnd() * TAU;
        for (let k = 0; k < n; k++) { const o = (k - (n - 1) / 2) * 7 * s; clouds.put(SH.blob, x - cx + Math.cos(a) * o + rr(-2, 2), y + rr(-2, 3), z - cz + Math.sin(a) * o + rr(-3, 3), rr(6, 11) * s, rr(4, 6) * s, rr(6, 10) * s, ct, { ry: rnd() * TAU, j: 0.04 }); }
      }
    }
    const lit = new THREE.MeshBasicMaterial({ vertexColors: true }), glow = new THREE.MeshBasicMaterial({ vertexColors: true });
    cur = { place, chunks: [], clouds: null, mats: [lit], k: 1, ft: 0, fn: 0, wait: 3 };
    for (const v of bags.values()) for (const [b, mat, l, own, detail, order] of [[v.s, lit, 1, 0, 0, 1], [v.g, glow, 0, 0, 0, 1], [v.p, lit, 1, 0.23, 0, 1], [v.d, lit, 1, 0, 1, 1], [v.m, lit, 1, 0, 0, 2], [v.f, lit, 1, 0, 0, 3]]) {
      const m = b.mesh(mat, l, own, order); if (!m) continue;
      m.userData.detail = !!detail; if (detail && slow) m.visible = false;
      place.add(m); cur.chunks.push(m);
    }
    const cm = clouds.mesh(lit, 1, 0.23, 2);
    if (cm) { cm.geometry.translate(cm.position.x, cm.position.y, cm.position.z); cm.position.set(cx, 0, cz); place.add(cm); cur.clouds = cm; } // turns round the middle
    if (ex.has('stars')) {
      const pts = [], r = mulberry(h + 1);
      for (let i = 0; i < 420; i++) { const a = r() * TAU, e = Math.asin(0.12 + r() * 0.88); pts.push(Math.cos(a) * Math.cos(e) * 1100, Math.sin(e) * 1100, Math.sin(a) * Math.cos(e) * 1100); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const st = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 }));
      const moon = new THREE.Mesh(new THREE.SphereGeometry(34, 18, 12), new THREE.MeshBasicMaterial({ color: 0xf1f5f9, fog: false }));
      const halo = new THREE.Mesh(new THREE.SphereGeometry(58, 18, 12), new THREE.MeshBasicMaterial({ color: 0xc7d2fe, fog: false, transparent: true, opacity: 0.14, depthWrite: false }));
      // they stay with the camera, as far off as the sky
      const follow = (o, dx, dy, dz) => { o.frustumCulled = false; o.userData.ownGeo = true; o.renderOrder = -1; o.onBeforeRender = (rd, sc, cam) => { o.matrixWorld.makeTranslation(cam.position.x + dx, cam.position.y + dy, cam.position.z + dz); }; place.add(o); };
      follow(st, 0, 0, 0); follow(moon, -520, 560, -640); follow(halo, -520, 560, -640);
    }
  }
  // every frame: the clouds drift, land lost in the fog isn't drawn, the light (day and night) tints it, and if frames keep
  // coming slowly the little things are left out (for the rest of the visit)
  let cur = null, slow = false, hemi = null;
  build.tick = (dt) => {
    if (!cur || cur.place !== place) return;
    if (cur.clouds) cur.clouds.rotation.y = (now() * 0.0025) % TAU;
    if (!slow && (cur.wait -= dt) < 0) {
      cur.ft += dt; cur.fn++;
      if (cur.ft > 4) { if (cur.fn / cur.ft < 24) slow = true; cur.ft = cur.fn = 0; }
    }
    const far = scene.fog ? scene.fog.far : 1000, cp = camera.position;
    for (const m of cur.chunks) m.visible = !(slow && m.userData.detail) && cp.distanceTo(m.position) - m.geometry.boundingSphere.radius < (m.userData.detail ? far * 0.5 : far);
    if (!hemi) hemi = scene.children.find((o) => o.isHemisphereLight);
    const k = clamp(((hemi ? hemi.intensity : 0.78) + sunL.intensity) / 1.28, 0.2, 1.2);
    if (Math.abs(k - cur.k) > 0.005) { cur.k = k; for (const mt of cur.mats) mt.color.setScalar(k); }
  };
  return build;
})();
