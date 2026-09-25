/* =========================================================================
   data/maps.js — battle maps, themes and difficulty tiers
   Paths are polylines in world units. The last point is the base.
   ========================================================================= */
(function () {

  /* ------------------------------ difficulties ----------------------------- */
  TD.DIFFICULTIES = [
    { id: 'rookie', name: 'ROOKIE', waves: 20, hpMul: 0.65, spdMul: 0.95, cash: 1500, baseHp: 180, reward: 0.7, color: '#51d88a', desc: 'A gentle warm-up. 20 waves.' },
    { id: 'standard', name: 'STANDARD', waves: 30, hpMul: 1.0, spdMul: 1.00, cash: 1200, baseHp: 140, reward: 1.0, color: '#4f8cff', desc: 'The intended experience. 30 waves.' },
    { id: 'molten', name: 'MOLTEN', waves: 35, hpMul: 1.9, spdMul: 1.05, cash: 1000, baseHp: 115, reward: 1.7, color: '#ff8b3a', desc: 'Molten enemies join the fight. 35 waves.' },
    { id: 'forsaken', name: 'FORSAKEN', waves: 40, hpMul: 3.4, spdMul: 1.12, cash: 900, baseHp: 95, reward: 2.6, color: '#a678ff', desc: 'The Forsaken march. 40 waves.' },
    { id: 'nightmare', name: 'NIGHTMARE', waves: 45, hpMul: 6.5, spdMul: 1.20, cash: 800, baseHp: 75, reward: 4.2, color: '#ff5d6c', desc: 'Only the best survive. 45 waves.' }
  ];

  /* ------------------------------ themes ----------------------------- */
  const THEMES = {
    grass: { ground: 0x4f8f4a, ground2: 0x43803f, path: 0x9b8a63, edge: 0x7d6e4d, sky: 0x86bdf5, fog: 0xa8cfff, light: 0xfff4e0, amb: 0x6f86b8, prop: 'tree', propC: [0x2f8f4a, 0x5a4028] },
    beach: { ground: 0xd8cb9a, ground2: 0xc9ba88, path: 0xa08f6a, edge: 0x8a7a55, sky: 0x8fd0ff, fog: 0xcfe9ff, light: 0xfff0d0, amb: 0x7d95c4, prop: 'palm', propC: [0x3fae5c, 0x8a6a3a], water: 0x2f7fb8 },
    pine: { ground: 0x3f855a, ground2: 0x35734d, path: 0x7d6b46, edge: 0x64543a, sky: 0x74a3cf, fog: 0x93b4d2, light: 0xf2f7ff, amb: 0x6d82a8, prop: 'tree', propC: [0x247a42, 0x4a3524] },
    jungle: { ground: 0x5f7a46, ground2: 0x52693c, path: 0x8f8672, edge: 0x6f6858, sky: 0x9fc9a8, fog: 0xa9cbb2, light: 0xfff3dc, amb: 0x6d8a74, prop: 'tree', propC: [0x2f7a3f, 0x5a4028] },
    snow: { ground: 0xdfe9f6, ground2: 0xcedcec, path: 0xaebdd0, edge: 0x92a3ba, sky: 0xbcd6f0, fog: 0xd8e7f8, light: 0xffffff, amb: 0x8ea4c4, prop: 'tree', propC: [0x2f6b4f, 0x4a3524] },
    volcano: { ground: 0x6b4f42, ground2: 0x5c4338, path: 0x936b50, edge: 0xb35a30, sky: 0x8f3f22, fog: 0xb35a30, light: 0xffdcb8, amb: 0xc06a48, prop: 'rock', propC: [0x8a6a5c, 0x4a352c], lava: 0xff6a24 },
    void: { ground: 0x4a4180, ground2: 0x3f376e, path: 0x7a66c0, edge: 0x9b7ae8, sky: 0x2a2150, fog: 0x4a3a84, light: 0xeee4ff, amb: 0x8a72d4, prop: 'crystal', propC: [0xc39bff, 0x7a5ac0] }
  };
  TD.THEMES = THEMES;

  /* ------------------------------ maps ----------------------------- */
  const MAPS = [
    {
      id: 'crossroads', name: 'Crossroads', theme: 'grass', tier: 1, recLevel: 1, maxTowers: 26, pathWidth: 7,
      blurb: 'Wide open farmland with long straight runs. A perfect first posting.',
      paths: [[[-70, -24], [-30, -24], [-30, 18], [6, 18], [6, -18], [34, -18], [34, 20], [60, 20]]]
    },
    {
      id: 'harbor', name: 'Harbor Point', theme: 'beach', tier: 1, recLevel: 2, maxTowers: 26, pathWidth: 7,
      blurb: 'A sunny dockside. Water limits where you can build.',
      paths: [[[-70, 10], [-34, 10], [-34, -26], [4, -26], [4, 26], [32, 26], [32, -8], [62, -8]]],
      water: [{ x: -46, z: 42, r: 26 }, { x: 44, z: 44, r: 22 }, { x: -50, z: -46, r: 20 }]
    },
    {
      id: 'pinehollow', name: 'Pine Hollow', theme: 'pine', tier: 2, recLevel: 4, maxTowers: 24, pathWidth: 6.5,
      blurb: 'A twisting forest track. Lots of corners for short-range towers.',
      paths: [[[-70, -32], [-44, -32], [-44, 2], [-16, 2], [-16, -26], [10, -26], [10, 26], [-22, 26], [-22, 42], [36, 42], [36, -4], [62, -4]]]
    },
    {
      id: 'temple', name: 'Sunken Temple', theme: 'jungle', tier: 3, recLevel: 6, maxTowers: 24, pathWidth: 6.5,
      blurb: 'Two overgrown approaches converge on the inner sanctum.',
      paths: [
        [[-70, -30], [-34, -30], [-34, -6], [6, -6], [6, -30], [34, -30], [34, 6], [60, 6]],
        [[-70, 30], [-34, 30], [-34, 6], [6, 6], [6, 30], [34, 30], [34, 6], [60, 6]]
      ]
    },
    {
      id: 'frostbite', name: 'Frostbite Pass', theme: 'snow', tier: 3, recLevel: 8, maxTowers: 22, pathWidth: 6.5,
      blurb: 'A long, exposed mountain pass. Fire towers thaw the way.',
      paths: [[[-70, 0], [-46, 0], [-46, -30], [-10, -30], [-10, 30], [16, 30], [16, -18], [40, -18], [40, 28], [62, 28]]]
    },
    {
      id: 'molten', name: 'Molten Core', theme: 'volcano', tier: 4, recLevel: 10, maxTowers: 22, pathWidth: 6.5,
      blurb: 'Lava fields leave little solid ground. Choose placements carefully.',
      paths: [[[-70, 22], [-38, 22], [-38, -26], [14, -26], [14, 32], [-18, 32], [-18, 6], [34, 6], [34, -32], [62, -32]]],
      lava: [{ x: -52, z: -12, r: 17 }, { x: 44, z: 22, r: 19 }, { x: -6, z: -50, r: 15 }, { x: 52, z: -8, r: 12 }]
    },
    {
      id: 'riftnexus', name: 'Rift Nexus', theme: 'void', tier: 5, recLevel: 13, maxTowers: 20, pathWidth: 6,
      blurb: 'Two tears in reality pour enemies at the core from both sides.',
      paths: [
        [[-70, -36], [-24, -36], [-24, -12], [20, -12], [20, -36], [46, -36], [46, 0], [58, 0]],
        [[-70, 36], [-24, 36], [-24, 12], [20, 12], [20, 36], [46, 36], [46, 0], [58, 0]]
      ]
    }
  ];

  /* Pre-compute path metadata: cumulative lengths and total length. */
  function prep(map) {
    map.pathData = map.paths.map(pts => {
      const v = pts.map(p => ({ x: p[0], z: p[1] }));
      const seg = [];
      let total = 0;
      for (let i = 0; i < v.length - 1; i++) {
        const len = TD.dist(v[i].x, v[i].z, v[i + 1].x, v[i + 1].z);
        seg.push({ a: v[i], b: v[i + 1], len: len, start: total });
        total += len;
      }
      return { pts: v, seg: seg, total: total };
    });
    map.base = map.paths[0][map.paths[0].length - 1];
    return map;
  }
  MAPS.forEach(prep);

  /* Position + direction at a given distance travelled along a path. */
  TD.pathPoint = function (pd, d) {
    if (d <= 0) {
      const s = pd.seg[0];
      const dx = (s.b.x - s.a.x) / s.len, dz = (s.b.z - s.a.z) / s.len;
      return { x: s.a.x + dx * d, z: s.a.z + dz * d, dx: dx, dz: dz, done: false };
    }
    for (let i = 0; i < pd.seg.length; i++) {
      const s = pd.seg[i];
      if (d <= s.start + s.len) {
        const t = (d - s.start) / s.len;
        const dx = (s.b.x - s.a.x) / s.len, dz = (s.b.z - s.a.z) / s.len;
        return { x: TD.lerp(s.a.x, s.b.x, t), z: TD.lerp(s.a.z, s.b.z, t), dx: dx, dz: dz, done: false };
      }
    }
    const last = pd.seg[pd.seg.length - 1];
    return { x: last.b.x, z: last.b.z, dx: 0, dz: 0, done: true };
  };

  /* Shortest distance from a world point to any of the map's paths. */
  TD.distToPath = function (map, x, z) {
    let best = 1e9;
    for (let p = 0; p < map.pathData.length; p++) {
      const segs = map.pathData[p].seg;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        const vx = s.b.x - s.a.x, vz = s.b.z - s.a.z;
        const wx = x - s.a.x, wz = z - s.a.z;
        let t = (vx * wx + vz * wz) / (vx * vx + vz * vz);
        t = TD.clamp(t, 0, 1);
        const px = s.a.x + vx * t, pz = s.a.z + vz * t;
        const d = TD.dist(x, z, px, pz);
        if (d < best) best = d;
      }
    }
    return best;
  };

  TD.MAPS = MAPS;
  TD.mapById = id => MAPS.filter(m => m.id === id)[0] || MAPS[0];
  TD.diffById = id => TD.DIFFICULTIES.filter(d => d.id === id)[0] || TD.DIFFICULTIES[1];
})();
