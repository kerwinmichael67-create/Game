/* ========================================================================
   Track: centreline samples, curvature, banking, pads, lookups
   ======================================================================== */
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
    this.seg = this.length / this.n; /* metres between samples (they are evenly spaced along the lap) */
    this._elevation(def.elev);
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
  /* Hills. `keys` are [lap fraction, metres] pairs in lap order starting at fraction 0; they are joined by a
     smooth periodic curve and rounded off, so crests and dips have no kinks. elev[i] is the height of the centre
     line at sample i, grade[i] its slope along the lap (rise per metre, + = uphill in the driving direction). */
  _elevation(keys) {
    const n = this.n;
    this.elev = new Array(n).fill(0);
    this.grade = new Array(n).fill(0);
    this.hilly = false;
    if (!keys || keys.length < 2) return;
    const K = keys.length,
      X = (k) => keys[((k % K) + K) % K][0] + Math.floor(k / K),
      Y = (k) => keys[((k % K) + K) % K][1];
    let raw = [];
    for (let i = 0, k = 0; i < n; i++) {
      const u = i / n;
      while (k < K - 1 && X(k + 1) <= u) k++;
      const x0 = X(k),
        x1 = X(k + 1),
        h = x1 - x0,
        t = (u - x0) / h,
        m0 = (Y(k + 1) - Y(k - 1)) / (X(k + 1) - X(k - 1)),
        m1 = (Y(k + 2) - Y(k)) / (X(k + 2) - X(k)),
        t2 = t * t,
        t3 = t2 * t;
      raw.push((2 * t3 - 3 * t2 + 1) * Y(k) + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * Y(k + 1) + (t3 - t2) * h * m1);
    }
    for (let pass = 0; pass < 2; pass++) {
      const sm = [];
      for (let i = 0; i < n; i++) {
        let a = 0;
        for (let k = -7; k <= 7; k++) a += raw[(i + k + n) % n];
        sm.push(a / 15);
      }
      raw = sm;
    }
    this.elev = raw;
    for (let i = 0; i < n; i++) this.grade[i] = (raw[(i + 1) % n] - raw[(i - 1 + n) % n]) / (2 * this.seg);
    this.hilly = raw.some((e) => Math.abs(e) > 0.01);
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
  /* one key per grid cell (no collisions: a shared key would let a far-off sample pose as a near one) */
  cellKey(cx, cz) {
    return (cx + 4096) * 8192 + (cz + 4096);
  }
  _key(x, z) {
    return this.cellKey(Math.floor(x / this.cell), Math.floor(z / this.cell));
  }
  /* nearest sample index; hint speeds up the search for tracked cars */
  nearest(x, z, hint = -1) {
    let best = -1,
      bd = Infinity;
    const C = this.center;
    if (hint >= 0) {
      for (let k = -14; k <= 14; k++) {
        const i = (hint + k + this.n) % this.n;
        const p = C[i];
        const d = (p.x - x) ** 2 + (p.z - z) ** 2;
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      if (bd < 30 * 30) return best;
    }
    /* search the grid ring by ring. Every sample in ring r is at least r - 1 cells away,
       so the search may stop as soon as that is further than the best found so far. */
    const cell = this.cell,
      cx = Math.floor(x / cell),
      cz = Math.floor(z / cell);
    for (let r = 0; r <= 5; r++) {
      if (best >= 0 && (r - 1) * cell > Math.sqrt(bd)) return best;
      for (let dx = -r; dx <= r; dx++) {
        const edge = dx === -r || dx === r;
        for (let dz = -r; dz <= r; dz += edge ? 1 : 2 * r) {
          const arr = this.hash.get(this.cellKey(cx + dx, cz + dz));
          if (!arr) continue;
          for (const i of arr) {
            const p = C[i];
            const d = (p.x - x) ** 2 + (p.z - z) ** 2;
            if (d < bd) {
              bd = d;
              best = i;
            }
          }
        }
      }
    }
    if (best >= 0 && 5 * cell > Math.sqrt(bd)) return best;
    /* far from the circuit: scan everything */
    for (let i = 0; i < this.n; i++) {
      const p = C[i];
      const d = (p.x - x) ** 2 + (p.z - z) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
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
  /* height of the road's cross-section at sample i, lat metres right of the centre line (banking tilts it) */
  heightAt(i, lat) {
    return this.elev[i] + Math.sin(this.bank[i]) * lat;
  }
  /* Where a point sits in the strip of road between sample i and its neighbour: returns [j, f, lat] with j the
     neighbour on the point's side, f in 0..1 the fraction of the way from cross-section i to cross-section j,
     and lat the offset right of the centre line there. Matches the rendered ribbon, corners included (the two
     cross-sections are not parallel in a bend, so a plain projection onto sample i's axes would drift). */
  _locate(x, z, i, maxLat = Infinity) {
    const n = this.n,
      ci = this.center[i],
      j = this.along(x, z, i) >= 0 ? (i + 1) % n : (i - 1 + n) % n,
      cj = this.center[j],
      ri = this.right[i],
      rj = this.right[j];
    /* first guess along the chord of the centre line, then once more along the line at the point's own offset */
    let ex = cj.x - ci.x,
      ez = cj.z - ci.z,
      f = clamp(((x - ci.x) * ex + (z - ci.z) * ez) / (ex * ex + ez * ez), 0, 1),
      lat = 0;
    for (let pass = 0; pass < 2; pass++) {
      const rx = ri.x + (rj.x - ri.x) * f,
        rz = ri.z + (rj.z - ri.z) * f;
      lat = ((x - ci.x - (cj.x - ci.x) * f) * rx + (z - ci.z - (cj.z - ci.z) * f) * rz) / Math.hypot(rx, rz);
      if (pass) break;
      const ax = ci.x + ri.x * lat,
        az = ci.z + ri.z * lat;
      ex = cj.x + rj.x * lat - ax;
      ez = cj.z + rj.z * lat - az;
      const d2 = ex * ex + ez * ez;
      f = d2 > 1e-6 ? clamp(((x - ax) * ex + (z - az) * ez) / d2, 0, 1) : f;
    }
    return [j, f, clamp(lat, -maxLat, maxLat)];
  }
  /* height of the road surface under a point near sample i: blended between the two cross-sections it lies
     between, so a car climbs a hill smoothly instead of in steps. maxLat limits how far out the banking is followed. */
  surface(x, z, i, maxLat = Infinity) {
    const [j, f, lat] = this._locate(x, z, i, maxLat);
    return lerp(this.heightAt(i, lat), this.heightAt(j, lat), f);
  }
  /* slope of the road surface at a point near sample i, in the direction (dx, dz) (unit length): rise per metre */
  slope(x, z, i, dx, dz) {
    const [j, f] = this._locate(x, z, i),
      t = this.tangent[i],
      r = this.right[i];
    return lerp(this.grade[i], this.grade[j], f) * (dx * t.x + dz * t.z) + lerp(Math.sin(this.bank[i]), Math.sin(this.bank[j]), f) * (dx * r.x + dz * r.z);
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
  /* like point(), for a fractional sample position s (pads and painted lines that start between samples) */
  pointF(s, lat = 0) {
    const n = this.n,
      i0 = ((Math.floor(s) % n) + n) % n,
      i1 = (i0 + 1) % n,
      f = s - Math.floor(s),
      a = this.point(i0, lat),
      b = this.point(i1, lat);
    return a.lerp(b, f);
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
