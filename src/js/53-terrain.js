/* ========================================================================
   Terrain: the land around a circuit as a heightfield.

   The road, kerbs and shoulders are ribbons built from the track samples. The land must never cover
   them, so the heightfield is defined relative to the road:
     - inside the corridor (road + shoulder, out to the barriers) it follows the road's cross-section,
       banking included, a fixed DROP below it;
     - from the barriers outward it blends over BLEND metres into the natural terrain (rolling noise,
       a coast, a mountain rim, depending on the theme).
   The mesh is a two-level grid: fine cells near the track so the banked corridor is resolved, coarse
   cells elsewhere, with the shared edges constrained so there are no cracks. A coarse frame carries the
   land out to the horizon.

   Terrain.heightAt(x, z) returns the height of the rendered surface (same triangles as the mesh), which
   is what scenery stands on and what tests/t-terrain.mjs checks against the road.
   ======================================================================== */
function hash2(ix, iz, seed) {
  let h = (Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(seed, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
/* smooth value noise in [-1, 1] */
function vnoise(x, z, seed) {
  const ix = Math.floor(x),
    iz = Math.floor(z),
    fx = x - ix,
    fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx),
    sz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, seed),
    b = hash2(ix + 1, iz, seed),
    c = hash2(ix, iz + 1, seed),
    d = hash2(ix + 1, iz + 1, seed);
  return (a + (b - a) * sx + (c - a + (a - b - c + d) * sx) * sz) * 2 - 1;
}
function fbm(x, z, seed, octaves = 3) {
  let s = 0,
    a = 1,
    f = 1,
    n = 0;
  for (let o = 0; o < octaves; o++) {
    s += a * vnoise(x * f, z * f, seed + o * 17);
    n += a;
    a *= 0.5;
    f *= 2.03;
  }
  return s / n;
}
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

class Terrain {
  /* quality 'high' → 4 m cells near the track, anything else → 5 m */
  constructor(track, theme, quality, seed) {
    this.track = track;
    this.theme = theme;
    this.cfg = Object.assign({ amp: 0, scale: 100, calm: [14, 100], margin: 170 }, theme.terrain || {});
    this.seed = seed | 0;
    this.C = track.halfWidth + track.wallOffset; /* corridor half width: road + shoulder up to the barrier face */
    this.DROP = 0.45; /* how far the land sits below the road surface inside the corridor */
    this.FLAT = this.C + 2.0; /* the cross-section plane is held flat beyond this lateral offset */
    this.B0 = this.C + 2.5; /* blend to natural terrain starts here ... */
    this.B1 = this.B0 + (this.cfg.blend || 30); /* ... and ends here */
    this.RUN = track.seg * 3; /* how far along the lap a sample's gradient is trusted when blending */
    this.K = 4;
    this.CS = quality === 'high' ? 16 : 20;
    this.FS = this.CS / this.K;
    /* the sea: a sheet that starts where the land begins to fall away. It may never lap over the circuit, so
       its level drops below the lowest stretch of road corridor that lies within the sheet. */
    this.waterLevel = -Infinity;
    this.waterStart = Infinity;
    if (theme.water) {
      const coast = this.cfg.coast;
      /* the shore wanders (coastX), so the sheet starts inland of its furthest reach */
      this.waterStart = coast ? coast.x - coast.width - (coast.wobble ?? 30) : theme.water.x - 110;
      this.waterLevel = theme.water.level ?? -1.1;
      for (let i = 0; i < track.n; i++)
        if (track.center[i].x + this.C + 12 > this.waterStart)
          this.waterLevel = Math.min(this.waterLevel, Math.min(track.heightAt(i, -this.C), track.heightAt(i, this.C)) - this.DROP - 0.35);
    }
    /* regional elevation follows the circuit's own height profile so hills in the track become hills in the land */
    this.elevated = !!track.hilly;
    this._d = 0;
    this._buildGrid();
  }

  /* natural terrain with no knowledge of the road; dTrack = distance to the nearest centreline sample */
  base(x, z, dTrack) {
    const c = this.cfg,
      t = this.track;
    let h = 0;
    if (this.elevated) h += this.regional(x, z);
    if (c.amp) {
      const calm = smoothstep(this.C + c.calm[0], this.C + c.calm[1], dTrack);
      h += c.amp * fbm(x / c.scale, z / c.scale, this.seed + 7, 3) * (0.12 + 0.88 * calm);
    }
    if (c.rim) {
      const r = Math.hypot(x - t.map.cx, z - t.map.cz);
      h += c.rim.amp * smoothstep(c.rim.r0, c.rim.r1, r);
    }
    if (c.coast) {
      /* inland hollows stop short of sea level (no ponds with a ruler-straight edge), then the shore falls away */
      const floor = this.waterLevel + 0.9;
      if (h < floor) h = floor + (h - floor) * 0.15;
      const cx = this.coastX(z);
      h -= c.coast.drop * smoothstep(cx - c.coast.width, cx + 12, x);
    }
    return h;
  }
  /* where the coast runs at this z: the theme's line, bent into bays and points so no stretch is ruler-straight */
  coastX(z) {
    const c = this.cfg.coast;
    return c.x + fbm(z / 170, 3.7, this.seed + 71, 2) * (c.wobble ?? 30);
  }
  /* smooth field through the track's elevation: every 6th sample, inverse-distance weighted with a wide kernel */
  regional(x, z) {
    const t = this.track;
    let s = 0,
      w = 0;
    for (let i = 0; i < t.n; i += 6) {
      const c = t.center[i],
        d2 = (c.x - x) * (c.x - x) + (c.z - z) * (c.z - z);
      const k = 1 / (d2 * d2 + 4e6); /* ~45 m core */
      s += k * t.elev[i];
      w += k;
    }
    return s / w;
  }

  /* height of the land at (x, z); also leaves the distance to the centreline in this._d */
  sample(x, z) {
    const t = this.track,
      iN = t.nearest(x, z),
      cN = t.center[iN];
    const dN = Math.hypot(cN.x - x, cN.z - z);
    this._d = dN;
    const base = this.base(x, z, dN);
    if (dN >= this.B1) return base;
    /* proximity-weighted blend of the cross-sections of all nearby samples: continuous where two legs of the
       circuit pass each other, and equal to the nearest cross-section on the road itself */
    const cell = t.cell,
      gx = Math.floor(x / cell),
      gz = Math.floor(z / cell),
      R2 = this.B1 * this.B1;
    let S = 0,
      T = 0,
      W = 0;
    for (let dx = -2; dx <= 2; dx++)
      for (let dz = -2; dz <= 2; dz++) {
        const arr = t.hash.get(t.cellKey(gx + dx, gz + dz));
        if (!arr) continue;
        for (let k = 0; k < arr.length; k++) {
          const i = arr[k],
            c = t.center[i],
            ox = x - c.x,
            oz = z - c.z,
            d2 = ox * ox + oz * oz;
          if (d2 > R2) continue;
          const r = t.right[i],
            tg = t.tangent[i],
            lat = clamp(ox * r.x + oz * r.z, -this.FLAT, this.FLAT),
            run = clamp(ox * tg.x + oz * tg.z, -this.RUN, this.RUN); /* the plane also climbs with the road's gradient */
          const s = 1 / (d2 * d2 * d2 + 1e-4);
          S += s;
          T += s * (t.heightAt(i, lat) + t.grade[i] * run - this.DROP);
          W += s * (1 - smoothstep(this.B0, this.B1, Math.sqrt(d2)));
        }
      }
    if (S === 0) return base;
    return base + (T / S - base) * (W / S);
  }

  _buildGrid() {
    const t = this.track,
      K = this.K,
      CS = this.CS,
      FS = this.FS,
      M = this.cfg.margin;
    let minX = 1e9,
      maxX = -1e9,
      minZ = 1e9,
      maxZ = -1e9;
    for (const p of t.center) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
    }
    const x0 = (this.x0 = Math.floor((minX - M) / CS) * CS),
      z0 = (this.z0 = Math.floor((minZ - M) / CS) * CS);
    const nx = (this.nx = Math.ceil((maxX + M - x0) / CS)),
      nz = (this.nz = Math.ceil((maxZ + M - z0) / CS));
    const LX = (this.LX = nx * K + 1),
      LZ = (this.LZ = nz * K + 1);
    const hf = (this.hf = new Float32Array(LX * LZ).fill(NaN)); /* heights on the fine lattice, where used */
    const dist = (this.dist = new Float32Array(LX * LZ)); /* distance to the centreline, for colouring */
    const fine = (this.fine = new Uint8Array(nx * nz));
    /* which coarse cells need fine resolution */
    const Rf = this.B1 + 2 + CS * 0.7072;
    for (let cz = 0; cz < nz; cz++)
      for (let cx = 0; cx < nx; cx++) {
        const x = x0 + (cx + 0.5) * CS,
          z = z0 + (cz + 0.5) * CS,
          c = t.center[t.nearest(x, z)];
        fine[cz * nx + cx] = Math.hypot(c.x - x, c.z - z) < Rf ? 1 : 0;
      }
    const put = (fx, fz) => {
      const k = fz * LX + fx;
      if (isNaN(hf[k])) {
        hf[k] = this.sample(x0 + fx * FS, z0 + fz * FS);
        dist[k] = this._d;
      }
    };
    /* coarse lattice */
    for (let cz = 0; cz <= nz; cz++) for (let cx = 0; cx <= nx; cx++) put(cx * K, cz * K);
    /* fine lattice inside fine cells; edges shared with a coarse cell follow that cell's straight edge */
    const isFine = (cx, cz) => cx >= 0 && cz >= 0 && cx < nx && cz < nz && fine[cz * nx + cx] === 1;
    const along = (fxa, fza, fxb, fzb, f, k) => {
      const a = fza * LX + fxa,
        b = fzb * LX + fxb;
      hf[k] = hf[a] + (hf[b] - hf[a]) * f;
      dist[k] = dist[a] + (dist[b] - dist[a]) * f;
    };
    for (let cz = 0; cz < nz; cz++)
      for (let cx = 0; cx < nx; cx++) {
        if (!fine[cz * nx + cx]) continue;
        const bx = cx * K,
          bz = cz * K;
        for (let j = 0; j <= K; j++)
          for (let i = 0; i <= K; i++) {
            const onW = i === 0,
              onE = i === K,
              onS = j === 0,
              onN = j === K;
            if ((onW || onE) && (onS || onN)) continue; /* corner: already on the coarse lattice */
            const k = (bz + j) * LX + bx + i;
            if (onW && !isFine(cx - 1, cz)) along(bx, bz, bx, bz + K, j / K, k);
            else if (onE && !isFine(cx + 1, cz)) along(bx + K, bz, bx + K, bz + K, j / K, k);
            else if (onS && !isFine(cx, cz - 1)) along(bx, bz, bx + K, bz, i / K, k);
            else if (onN && !isFine(cx, cz + 1)) along(bx, bz + K, bx + K, bz + K, i / K, k);
            else put(bx + i, bz + j);
          }
      }
    this._carve();
  }

  /* A hard guarantee on top of the smooth cut: no triangle of the land may rise above the road, the kerbs
     or the shoulders. Walks the corridor densely and presses the corners of every cell it crosses below
     the surface at that spot. The blend already sits DROP below almost everywhere, so this only bites on
     the inside of tight banked corners, where neighbouring cross-sections fold over each other. */
  _carve() {
    const t = this.track,
      FS = this.FS,
      LX = this.LX,
      LZ = this.LZ,
      hf = this.hf;
    const steps = Math.max(1, Math.ceil(t.length / t.n / 1.5)),
      W = this.C + 1,
      lats = Math.ceil(W),
      CLEAR = 0.3;
    for (let i = 0; i < t.n; i++) {
      const j = (i + 1) % t.n,
        c0 = t.center[i],
        c1 = t.center[j],
        r0 = t.right[i],
        r1 = t.right[j];
      for (let s = 0; s < steps; s++) {
        const f = s / steps,
          cx = lerp(c0.x, c1.x, f),
          cz = lerp(c0.z, c1.z, f),
          rx = lerp(r0.x, r1.x, f),
          rz = lerp(r0.z, r1.z, f);
        for (let q = -lats; q <= lats; q++) {
          const lat = (q / lats) * W,
            y = lerp(t.heightAt(i, lat), t.heightAt(j, lat), f) - CLEAR,
            fx = Math.floor((cx + rx * lat - this.x0) / FS),
            fz = Math.floor((cz + rz * lat - this.z0) / FS);
          if (fx < 0 || fz < 0 || fx > LX - 2 || fz > LZ - 2) continue;
          const k = fz * LX + fx;
          if (hf[k] > y) hf[k] = y;
          if (hf[k + 1] > y) hf[k + 1] = y;
          if (hf[k + LX] > y) hf[k + LX] = y;
          if (hf[k + LX + 1] > y) hf[k + LX + 1] = y;
        }
      }
    }
  }

  /* height of the rendered surface: same triangles as the mesh */
  heightAt(x, z) {
    const gx = (x - this.x0) / this.CS,
      gz = (z - this.z0) / this.CS;
    if (!(gx >= 0 && gz >= 0 && gx < this.nx && gz < this.nz)) return this.base(x, z, 1e6);
    const cx = Math.floor(gx),
      cz = Math.floor(gz),
      LX = this.LX,
      K = this.K;
    let fx, fz, step, u, v;
    if (this.fine[cz * this.nx + cx]) {
      const lx = (x - this.x0) / this.FS,
        lz = (z - this.z0) / this.FS;
      fx = Math.min(Math.floor(lx), LX - 2);
      fz = Math.min(Math.floor(lz), this.LZ - 2);
      u = lx - fx;
      v = lz - fz;
      step = 1;
    } else {
      fx = cx * K;
      fz = cz * K;
      u = gx - cx;
      v = gz - cz;
      step = K;
    }
    const hf = this.hf,
      h00 = hf[fz * LX + fx],
      h10 = hf[fz * LX + fx + step],
      h01 = hf[(fz + step) * LX + fx],
      h11 = hf[(fz + step) * LX + fx + step];
    return u + v <= 1 ? h00 + u * (h10 - h00) + v * (h01 - h00) : h11 + (1 - u) * (h01 - h11) + (1 - v) * (h10 - h11);
  }

  /* builds the mesh; `detail` is a tiling grey texture multiplied over the vertex colours */
  build(detail) {
    const { nx, nz, K, FS, LX, LZ, x0, z0, hf, dist, fine } = this;
    const pos = [],
      uv = [],
      dd = [],
      idx = [];
    const vi = new Int32Array(LX * LZ).fill(-1);
    const vert = (fx, fz) => {
      const k = fz * LX + fx;
      if (vi[k] >= 0) return vi[k];
      const x = x0 + fx * FS,
        z = z0 + fz * FS;
      pos.push(x, hf[k], z);
      uv.push(x / 26, z / 26);
      dd.push(dist[k]);
      return (vi[k] = pos.length / 3 - 1);
    };
    const isFine = (cx, cz) => cx >= 0 && cz >= 0 && cx < nx && cz < nz && fine[cz * nx + cx] === 1;
    const quad = (fx, fz, s) => {
      const a = vert(fx, fz),
        b = vert(fx, fz + s),
        c = vert(fx + s, fz),
        d = vert(fx + s, fz + s);
      idx.push(a, b, c, c, b, d);
    };
    for (let cz = 0; cz < nz; cz++)
      for (let cx = 0; cx < nx; cx++) {
        if (fine[cz * nx + cx]) {
          for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) quad(cx * K + i, cz * K + j, 1);
          continue;
        }
        const W = isFine(cx - 1, cz),
          E = isFine(cx + 1, cz),
          S = isFine(cx, cz - 1),
          N = isFine(cx, cz + 1);
        if (!(W || E || S || N)) {
          quad(cx * K, cz * K, K);
          continue;
        }
        /* a coarse cell beside fine ones: a fan from its centre takes in the extra vertices along the shared
           edges, so no vertex is left hanging on a longer edge (those leak single pixels). The centre sits on
           the cell's diagonal, which keeps the fan in the same two planes heightAt() uses. */
        const bx = cx * K,
          bz = cz * K,
          rim = [];
        for (let j = 0; j < K; j++) if (j === 0 || W) rim.push(vert(bx, bz + j));
        for (let i = 0; i < K; i++) if (i === 0 || N) rim.push(vert(bx + i, bz + K));
        for (let j = K; j > 0; j--) if (j === K || E) rim.push(vert(bx + K, bz + j));
        for (let i = K; i > 0; i--) if (i === K || S) rim.push(vert(bx + i, bz));
        const kA = bz * LX + bx + K,
          kB = (bz + K) * LX + bx,
          mxc = x0 + (bx + K / 2) * FS,
          mzc = z0 + (bz + K / 2) * FS;
        pos.push(mxc, (hf[kA] + hf[kB]) / 2, mzc);
        uv.push(mxc / 26, mzc / 26);
        dd.push((dist[kA] + dist[kB]) / 2);
        const ctr = pos.length / 3 - 1;
        for (let k = 0; k < rim.length; k++) idx.push(ctr, rim[k], rim[(k + 1) % rim.length]);
      }
    /* frame out to the horizon: the grid's perimeter pushed outward in three rings */
    const per = [];
    for (let cx = 0; cx < nx; cx++) per.push([cx * K, 0]);
    for (let cz = 0; cz < nz; cz++) per.push([nx * K, cz * K]);
    for (let cx = nx; cx > 0; cx--) per.push([cx * K, nz * K]);
    for (let cz = nz; cz > 0; cz--) per.push([0, cz * K]);
    const mx = x0 + (nx * this.CS) / 2,
      mz = z0 + (nz * this.CS) / 2;
    let ring = per.map(([fx, fz]) => vert(fx, fz));
    for (const f of [1.45, 2.4, 5.5]) {
      const next = per.map(([fx, fz]) => {
        const x = mx + (x0 + fx * FS - mx) * f,
          z = mz + (z0 + fz * FS - mz) * f;
        pos.push(x, this.base(x, z, 1e6), z);
        uv.push(x / 26, z / 26);
        dd.push(1e6);
        return pos.length / 3 - 1;
      });
      /* the perimeter runs +x, then +z, then back; (inner, next inner, outer) is the winding that faces up */
      for (let i = 0; i < per.length; i++) {
        const j = (i + 1) % per.length;
        idx.push(ring[i], ring[j], next[i], ring[j], next[j], next[i]);
      }
      ring = next;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    /* colours need the slope, so they come after the normals */
    const nrm = geo.attributes.normal,
      col = new Float32Array(pos.length),
      c = new THREE.Color();
    for (let i = 0; i < pos.length / 3; i++) {
      this.tint(c, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], nrm.getY(i), dd[i]);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.vertices = pos.length / 3;
    this.triangles = idx.length / 3;
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, map: detail, roughness: 1, metalness: 0, envMapIntensity: 0.15 });
    /* the grain is sampled twice, close up and again much larger and turned, so it never reads as a repeating pattern */
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
          vec4 grainA = mapTexelToLinear( texture2D( map, vUv ) );
          vec4 grainB = mapTexelToLinear( texture2D( map, vec2( vUv.x * 0.113 + vUv.y * 0.047, vUv.y * 0.113 - vUv.x * 0.047 ) ) );
          diffuseColor.rgb *= mix( vec3( 1.0 ), grainA.rgb * grainB.rgb * 1.32, ${(this.cfg.grain ?? 1).toFixed(3)} );
        #endif`
      );
    };
    mat.customProgramCacheKey = () => 'terrain-grain-' + (this.cfg.grain ?? 1);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'terrain';
    mesh.receiveShadow = true;
    this.mesh = mesh;
    return mesh;
  }

  /* ground colour: two tones mixed by slow noise, patches of a third, a mown verge beside the barriers,
     a beach along the coast, rock on steep ground and snow up high, as the theme's palette asks */
  tint(out, x, h, z, ny, dTrack) {
    const P = this.pal || (this.pal = this._palette()),
      c = this.cfg;
    const m = fbm(x / 60, z / 60, this.seed + 91, 2) * 0.5 + 0.5;
    out.copy(P.a).lerp(P.b, m);
    if (P.patch) out.lerp(P.patch, smoothstep(0.12, 0.42, fbm(x / 27, z / 27, this.seed + 33, 3)) * 0.85);
    const beyond = dTrack - this.C;
    if (P.verge && beyond < 11) out.lerp(P.verge, 1 - smoothstep(5, 11, beyond));
    if (P.rock && ny < 0.93) out.lerp(P.rock, smoothstep(0.93, 0.8, ny));
    if (P.sand) {
      if (c.coast) {
        const edge = this.coastX(z) - c.coast.width + fbm(x / 45, z / 45, this.seed + 61, 2) * 22;
        out.lerp(P.sand, smoothstep(edge - 34, edge + 6, x));
      } else out.lerp(P.sand, 1 - smoothstep(this.waterLevel + 0.5, this.waterLevel + 2.2, h));
    }
    if (P.snow) out.lerp(P.snow, smoothstep(P.snowLine, P.snowLine + 14, h + fbm(x / 40, z / 40, this.seed + 5, 2) * 5));
    const j = 0.94 + hash2(Math.round(x * 3), Math.round(z * 3), this.seed) * 0.12;
    out.multiplyScalar(j);
    return out;
  }
  _palette() {
    const th = this.theme,
      p = (th.terrain && th.terrain.palette) || {},
      C = (hex) => (hex == null ? null : new THREE.Color(hex));
    return {
      a: C(p.a ?? th.ground),
      b: C(p.b ?? th.ground2),
      patch: C(p.patch),
      verge: C(p.verge),
      rock: C(p.rock),
      sand: C(p.sand),
      snow: C(p.snow),
      snowLine: p.snowLine ?? 30,
    };
  }
}
