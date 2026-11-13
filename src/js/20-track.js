/* ========================================================================
   Track definitions + geometry builder
   Units: metres. Road width is the full drivable width.
   ======================================================================== */
const TRACKS = [
  {
    id: 'bay',
    name: 'Sunset Bay',
    desc: 'Fast coastal sweepers into a tight harbour hairpin. 2.4 km.',
    width: 16,
    bankMax: 0.22,
    theme: {
      sky: [0x1b2a6b, 0xff7a3d, 0xffd6a0],
      sun: [320, 200, -520],
      sunColor: 0xffc08a,
      hemi: [0xffd9bd, 0x4a4f66],
      fog: 0xf0a070,
      fogNear: 260,
      fogFar: 1100,
      ground: 0x66744f,
      ground2: 0x556343,
      trees: 'palm',
      treeCount: 260,
      rocks: 90,
      buildings: 0,
      lamps: true,
      cloud: 0xffc9a6,
      water: { x: 350, color: 0x08222e },
    },
    points: [
      [0, 0],
      [170, 0],
      [255, -35],
      [300, -120],
      [275, -205],
      [185, -245],
      [100, -205],
      [60, -125],
      [-45, -100],
      [-130, -160],
      [-230, -175],
      [-305, -110],
      [-325, -10],
      [-285, 90],
      [-205, 125],
      [-120, 95],
      [-60, 150],
      [-15, 230],
      [85, 255],
      [175, 215],
      [205, 125],
      [120, 75],
      [-35, 55],
      [-60, 10],
    ],
  },
  {
    id: 'alpine',
    name: 'Alpine Pass',
    desc: 'Long back straight, banked bowl and a blind chicane through the pines. 2.8 km.',
    width: 15,
    bankMax: 0.3,
    theme: {
      sky: [0x1d4f9e, 0x9ccfff, 0xe9f4ff],
      sun: [-400, 260, 300],
      sunColor: 0xfff4e0,
      hemi: [0xcfe6ff, 0x3d5a3a],
      fog: 0xb9d6f0,
      fogNear: 300,
      fogFar: 1400,
      ground: 0x3f6b39,
      ground2: 0x355c31,
      trees: 'pine',
      treeCount: 460,
      rocks: 140,
      buildings: 0,
      lamps: false,
      mountains: true,
      cloud: 0xffffff,
    },
    points: [
      [0, 0],
      [220, 0],
      [360, -10],
      [430, -80],
      [410, -170],
      [320, -200],
      [250, -150],
      [180, -190],
      [80, -245],
      [-40, -230],
      [-100, -150],
      [-80, -70],
      [-150, -20],
      [-250, -60],
      [-350, -40],
      [-400, 50],
      [-360, 140],
      [-260, 170],
      [-180, 120],
      [-110, 150],
      [-60, 230],
      [40, 260],
      [150, 220],
      [190, 130],
      [120, 80],
      [-20, 60],
      [-60, 10],
    ],
  },
  {
    id: 'neon',
    name: 'Neon Dock',
    desc: 'Night street circuit between container stacks. Short, technical, unforgiving. 2.0 km.',
    width: 14,
    bankMax: 0.1,
    theme: {
      sky: [0x05060f, 0x1a1040, 0x3a1a60],
      sun: [-200, 300, -200],
      sunColor: 0x8fb4ff,
      hemi: [0x7a6cc0, 0x23233a],
      fog: 0x120a28,
      fogNear: 180,
      fogFar: 760,
      ground: 0x262833,
      ground2: 0x1d1f29,
      trees: 'none',
      treeCount: 0,
      rocks: 0,
      buildings: 160,
      lamps: true,
      night: true,
    },
    points: [
      [0, 0],
      [150, 0],
      [210, -50],
      [200, -130],
      [120, -165],
      [40, -120],
      [-40, -140],
      [-70, -215],
      [-160, -235],
      [-230, -170],
      [-210, -90],
      [-250, -20],
      [-230, 70],
      [-150, 110],
      [-80, 70],
      [-10, 110],
      [30, 190],
      [130, 200],
      [160, 120],
      [90, 70],
      [-20, 55],
      [-55, 10],
    ],
  },
];

const SAMPLES = 720;

class Track {
  constructor(def) {
    this.def = def;
    this.id = def.id;
    this.name = def.name;
    this.width = def.width;
    this.halfWidth = def.width / 2;
    this.wallOffset = 2.6; /* distance from road edge to barrier face */
    const pts = def.points.map((p) => new THREE.Vector3(p[0], 0, p[1]));
    this.curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.5);
    this.length = this.curve.getLength();
    this.n = SAMPLES;
    this.center = [];
    this.tangent = [];
    this.right = [];
    this.curv = [];
    this.bank = [];
    this.dist = [];
    const cum = [];
    let total = 0;
    for (let i = 0; i < this.n; i++) {
      const u = i / this.n;
      const p = this.curve.getPointAt(u),
        t = this.curve.getTangentAt(u).normalize();
      this.center.push(p);
      this.tangent.push(t);
      this.right.push(new THREE.Vector3(-t.z, 0, t.x)); /* true right-hand side when travelling along t (y is up) */
      if (i > 0) total += p.distanceTo(this.center[i - 1]);
      cum.push(total);
    }
    this.dist = cum;
    /* curvature via tangent change; positive = turning left */
    for (let i = 0; i < this.n; i++) {
      const a = this.tangent[(i - 2 + this.n) % this.n],
        b = this.tangent[(i + 2) % this.n];
      const cross = a.x * b.z - a.z * b.x; /* y component of a×b */
      const ds = (4 * this.length) / this.n;
      this.curv.push(-cross / ds);
    }
    /* smooth curvature */
    const sm = [];
    for (let i = 0; i < this.n; i++) {
      let s = 0;
      for (let k = -6; k <= 6; k++) s += this.curv[(i + k + this.n) % this.n];
      sm.push(s / 13);
    }
    this.curv = sm;
    const maxC = Math.max(...this.curv.map(Math.abs));
    for (let i = 0; i < this.n; i++) {
      /* bank towards the inside of the turn: left turn (curv>0) -> right edge (lat>0) higher, left edge lower */
      let b = 0;
      for (let k = -10; k <= 10; k++) b += this.curv[(i + k + this.n) % this.n];
      b /= 21;
      this.bank.push(clamp(b / (maxC || 1), -1, 1) * def.bankMax);
    }
    /* spatial hash for nearest-sample lookup */
    this.cell = 24;
    this.hash = new Map();
    for (let i = 0; i < this.n; i++) {
      const k = this._key(this.center[i].x, this.center[i].z);
      if (!this.hash.has(k)) this.hash.set(k, []);
      this.hash.get(k).push(i);
    }
    /* minimap polyline (normalized 0..1) */
    let minX = 1e9,
      maxX = -1e9,
      minZ = 1e9,
      maxZ = -1e9;
    for (const p of this.center) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
    }
    const span = Math.max(maxX - minX, maxZ - minZ) * 1.12,
      cx = (minX + maxX) / 2,
      cz = (minZ + maxZ) / 2;
    this.map = { cx, cz, span, toUV: (x, z) => [(x - cx) / span + 0.5, (z - cz) / span + 0.5] };
    this.sectors = [Math.floor(this.n * 0.33), Math.floor(this.n * 0.66)];
    this._placePads();
  }
  /* boost pads sit on the straightest stretches; derived from geometry so every client agrees */
  _placePads() {
    const seg = this.length / this.n,
      win = Math.round(80 / seg),
      cand = [];
    for (let i = 0; i < this.n; i++) {
      let m = 0;
      for (let k = 0; k <= win; k++) m = Math.max(m, Math.abs(this.curv[(i + k) % this.n]));
      cand.push([m, i]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    const lats = [-0.32, 0.32, 0],
      picked = [];
    for (const [m, i] of cand) {
      if (picked.length >= 3 || m > 0.012) break;
      const idx = (i + Math.round(win * 0.3)) % this.n;
      if (idx < 16 || idx > this.n - 34) continue; /* keep clear of the grid */
      if (
        picked.some((p) => {
          const d = Math.abs(p - idx);
          return Math.min(d, this.n - d) < this.n * 0.13;
        })
      )
        continue;
      picked.push(idx);
    }
    picked.sort((a, b) => a - b);
    this.pads = picked.map((idx, k) => ({ idx, lat: lats[k % lats.length] * this.halfWidth, half: 2.5 }));
  }
  padAt(idx, lat) {
    for (const p of this.pads) {
      const d = Math.abs(p.idx - idx);
      if (Math.min(d, this.n - d) <= 1 && Math.abs(lat - p.lat) < p.half) return p;
    }
    return null;
  }
  /* metres along the lap from sample a forward to sample b */
  ahead(a, b) {
    return ((b - a + this.n) % this.n) * (this.length / this.n);
  }
  _key(x, z) {
    return (Math.floor(x / this.cell) * 73856093) ^ (Math.floor(z / this.cell) * 19349663);
  }
  /* nearest sample index; hint speeds up the search for tracked cars */
  nearest(x, z, hint = -1) {
    let best = -1,
      bd = Infinity;
    if (hint >= 0) {
      for (let k = -14; k <= 14; k++) {
        const i = (hint + k + this.n) % this.n;
        const p = this.center[i];
        const d = (p.x - x) ** 2 + (p.z - z) ** 2;
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      if (bd < 30 * 30) return best;
    }
    const cx = Math.floor(x / this.cell),
      cz = Math.floor(z / this.cell);
    for (let r = 0; r <= 3 && best < 0; r++) {
      for (let dx = -r; dx <= r; dx++)
        for (let dz = -r; dz <= r; dz++) {
          const arr = this.hash.get(((cx + dx) * 73856093) ^ ((cz + dz) * 19349663));
          if (!arr) continue;
          for (const i of arr) {
            const p = this.center[i];
            const d = (p.x - x) ** 2 + (p.z - z) ** 2;
            if (d < bd) {
              bd = d;
              best = i;
            }
          }
        }
      if (best >= 0 && r >= 1) break;
    }
    if (best < 0) {
      for (let i = 0; i < this.n; i += 3) {
        const p = this.center[i];
        const d = (p.x - x) ** 2 + (p.z - z) ** 2;
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
    }
    return best;
  }
  /* signed lateral offset from centreline (+ = right), and road surface height incl. banking */
  lateral(x, z, i) {
    const c = this.center[i],
      r = this.right[i];
    return (x - c.x) * r.x + (z - c.z) * r.z;
  }
  along(x, z, i) {
    const c = this.center[i],
      t = this.tangent[i];
    return (x - c.x) * t.x + (z - c.z) * t.z;
  }
  heightAt(i, lat) {
    return Math.sin(this.bank[i]) * lat;
  }
  /* fractional progress 0..1 around the lap */
  progress(x, z, i) {
    const seg = this.length / this.n;
    return ((i * seg + clamp(this.along(x, z, i), -seg, seg)) / this.length + 1) % 1;
  }
  point(i, lat = 0) {
    const c = this.center[i],
      r = this.right[i];
    return new THREE.Vector3(c.x + r.x * lat, this.heightAt(i, lat), c.z + r.z * lat);
  }
  yawAt(i) {
    const t = this.tangent[i];
    return Math.atan2(t.x, t.z);
  }
  maxCurvAhead(i, metres) {
    const n = Math.ceil(metres / (this.length / this.n));
    let m = 0;
    for (let k = 0; k <= n; k++) m = Math.max(m, Math.abs(this.curv[(i + k) % this.n]));
    return m;
  }
  /* grid slot world pose for starting position k (0 = pole) */
  gridPose(k) {
    const seg = this.length / this.n,
      back = 9 + Math.floor(k / 2) * 7.5,
      i = (this.n - Math.round(back / seg) + this.n) % this.n;
    const lat = (k % 2 === 0 ? -1 : 1) * this.halfWidth * 0.42;
    return { pos: this.point(i, lat), yaw: this.yawAt(i), idx: i };
  }
  /* keep scenery off the asphalt: true when (x,z) is clear of the road by `margin` */
  clear(x, z, margin) {
    const i = this.nearest(x, z);
    const c = this.center[i];
    const d = Math.hypot(c.x - x, c.z - z);
    return d > this.halfWidth + this.wallOffset + margin;
  }
}
