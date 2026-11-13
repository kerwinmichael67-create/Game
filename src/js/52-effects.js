/* ========================================================================
   Effects: particle pools and tyre marks
   ======================================================================== */
class Particles {
  constructor(scene, count, tex, opts) {
    this.n = count;
    this.pos = new Float32Array(count * 3);
    this.col = new Float32Array(count * 3);
    this.vel = new Float32Array(count * 3);
    this.life = new Float32Array(count);
    this.max = new Float32Array(count);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mat = new THREE.PointsMaterial({
      size: opts.size,
      map: tex,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      opacity: opts.opacity,
      blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      sizeAttenuation: true,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.head = 0;
    this.grav = opts.gravity || 0;
    this.drag = opts.drag || 0;
    for (let i = 0; i < count; i++) this.pos[i * 3 + 1] = -100;
  }
  emit(p, v, color, life) {
    const i = this.head;
    this.head = (this.head + 1) % this.n;
    this.pos[i * 3] = p.x;
    this.pos[i * 3 + 1] = p.y;
    this.pos[i * 3 + 2] = p.z;
    this.vel[i * 3] = v.x;
    this.vel[i * 3 + 1] = v.y;
    this.vel[i * 3 + 2] = v.z;
    this.col[i * 3] = color.r;
    this.col[i * 3 + 1] = color.g;
    this.col[i * 3 + 2] = color.b;
    this.life[i] = life;
    this.max[i] = life;
  }
  update(dt) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this.pos[i * 3 + 1] = -100;
        continue;
      }
      this.vel[i * 3 + 1] += this.grav * dt;
      const k = 1 - this.drag * dt;
      this.vel[i * 3] *= k;
      this.vel[i * 3 + 2] *= k;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }
}

/* tyre marks: a ring buffer of quads laid where a sliding tyre has been */
class SkidMarks {
  constructor(scene, max = 1600) {
    this.max = max;
    this.pos = new Float32Array(max * 12);
    const idx = [];
    for (let i = 0; i < max; i++) {
      const k = i * 4;
      idx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3);
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setIndex(idx);
    this.mesh = new THREE.Mesh(
      this.geo,
      new THREE.MeshBasicMaterial({
        color: 0x030304,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      })
    );
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    scene.add(this.mesh);
    this.head = 0;
    this.last = new Map();
    this.dirty = false;
  }
  /* key identifies one tyre; p is its contact point; on = currently sliding */
  mark(key, p, on) {
    const prev = this.last.get(key);
    if (!on) {
      if (prev) this.last.delete(key);
      return;
    }
    if (!prev) {
      this.last.set(key, { c: p.clone(), l: null, r: null });
      return;
    }
    const dx = p.x - prev.c.x,
      dz = p.z - prev.c.z,
      d = Math.hypot(dx, dz);
    if (d < 0.45) return;
    if (d > 6) {
      this.last.set(key, { c: p.clone(), l: null, r: null });
      return;
    }
    const px = (-dz / d) * 0.15,
      pz = (dx / d) * 0.15;
    const l = new THREE.Vector3(p.x - px, p.y, p.z - pz),
      r = new THREE.Vector3(p.x + px, p.y, p.z + pz);
    const pl = prev.l || new THREE.Vector3(prev.c.x - px, prev.c.y, prev.c.z - pz),
      pr = prev.r || new THREE.Vector3(prev.c.x + px, prev.c.y, prev.c.z + pz);
    const a = this.pos,
      k = this.head * 12;
    this.head = (this.head + 1) % this.max;
    a[k] = pl.x;
    a[k + 1] = pl.y;
    a[k + 2] = pl.z;
    a[k + 3] = pr.x;
    a[k + 4] = pr.y;
    a[k + 5] = pr.z;
    a[k + 6] = l.x;
    a[k + 7] = l.y;
    a[k + 8] = l.z;
    a[k + 9] = r.x;
    a[k + 10] = r.y;
    a[k + 11] = r.z;
    prev.c.copy(p);
    prev.l = l;
    prev.r = r;
    this.dirty = true;
  }
  flush() {
    if (this.dirty) {
      this.geo.attributes.position.needsUpdate = true;
      this.dirty = false;
    }
  }
}
