/* =========================================================================
   lobby.js — the 3D menu world: a plaza you walk around with kiosks that
   open the shop, loadout, codex and map select.
   ========================================================================= */
(function () {
  const T = THREE;

  const Lobby = TD.Lobby = {
    scene: null, camera: null, player: null, active: false,
    keys: {}, yaw: Math.PI, pitch: 0.42, zoom: 34,
    vel: { x: 0, z: 0 }, vy: 0, grounded: true,
    t: 0, near: null, npcs: [], solids: [], stepT: 0, billboards: [],
    touch: { active: false, x: 0, y: 0, id: null }
  };

  const KIOSKS = [
    { id: 'shop', label: 'SHOP', x: -16, z: -10, ry: 0.7, c1: 0x6a5220, c2: 0xffc63d, text: 'Open the Tower Shop' },
    { id: 'loadout', label: 'LOADOUT', x: 16, z: -10, ry: -0.7, c1: 0x3f2f6a, c2: 0xa678ff, text: 'Edit your Loadout' },
    { id: 'codex', label: 'CODEX', x: -26, z: 10, ry: 1.2, c1: 0x1f4a5a, c2: 0x6ee7ff, text: 'Read the Codex' },
    { id: 'settings', label: 'OPTIONS', x: 26, z: 10, ry: -1.2, c1: 0x2f3650, c2: 0x8a93aa, text: 'Open Settings' }
  ];

  /* ------------------------------------------------------------------ */
  Lobby.build = function () {
    const scene = this.scene = new T.Scene();
    scene.background = new T.Color(0x44579b);
    scene.fog = new T.Fog(0x44579b, 100, 230);

    const hemi = new T.HemisphereLight(0xc3d4ff, 0x3a4468, 1.15); scene.add(hemi);
    const sun = new T.DirectionalLight(0xfff4e2, 1.05);
    sun.position.set(34, 58, 26); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -70; sun.shadow.camera.right = 70;
    sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -70;
    sun.shadow.camera.far = 170;
    scene.add(sun);
    scene.add(new T.DirectionalLight(0x5a6ec0, 0.35).translateX(-40).translateY(30).translateZ(-40));

    /* ---- ground ---- */
    const grass = new T.Mesh(new T.CircleGeometry(110, 40), TD.mat(0x3f7a44));
    grass.rotation.x = -Math.PI / 2; grass.position.y = -0.2; grass.receiveShadow = true; scene.add(grass);
    const ground = new T.Mesh(new T.CircleGeometry(64, 48), TD.mat(0x6b78b0));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const inner = new T.Mesh(new T.CircleGeometry(40, 48), TD.mat(0x7c8ac0));
    inner.rotation.x = -Math.PI / 2; inner.position.y = 0.04; inner.receiveShadow = true; scene.add(inner);
    const centre = new T.Mesh(new T.CircleGeometry(13, 40), TD.mat(0x8f9cd2));
    centre.rotation.x = -Math.PI / 2; centre.position.y = 0.08; centre.receiveShadow = true; scene.add(centre);

    // radial paving lines
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2;
      const s = TD.box(0.5, 0.06, 26, 0x5b69a0, Math.cos(a) * 26, 0.1, Math.sin(a) * 26);
      s.rotation.y = -a + Math.PI / 2; scene.add(s);
    }
    // outer ring wall
    for (let i = 0; i < 44; i++) {
      const a = i / 44 * Math.PI * 2;
      scene.add(TD.box(3.2, 2.4, 1.6, i % 2 ? 0x4a5680 : 0x5a6794, Math.cos(a) * 63, 1.2, Math.sin(a) * 63).rotateY(-a));
    }
    scene.children.forEach(c => { if (c.isMesh) c.receiveShadow = true; });

    /* ---- centrepiece: a giant trophy/statue ---- */
    const statue = new T.Group();
    statue.add(TD.cyl(5.2, 6.0, 1.6, 0x2a3457, 0, 0.8, 0, 10));
    statue.add(TD.cyl(3.4, 4.2, 2.2, 0x394777, 0, 2.6, 0, 10));
    const hero = TD.makeHumanoid({ shirt: 0xffc63d, pants: 0xd8a33a, skin: 0xffd98a, hat: 'helmet', hatColor: 0xffd45e, hatColor2: 0xb88a20, scale: 1.6 });
    hero.group.position.y = 3.7;
    TD.attachWeapon(hero, 'rifle', 0xb88a20, 1.3);
    hero.aimPose(true, 0.35);
    statue.add(hero.group);
    statue.position.set(0, 0, 0);
    scene.add(statue);
    this.statue = statue;
    this.solids.push({ x: 0, z: 0, r: 7 });

    /* ---- kiosks ---- */
    this.kiosks = KIOSKS.map(k => {
      const g = TD.props.kiosk(k.label, k.c1, k.c2);
      g.position.set(k.x, 0, k.z); g.rotation.y = k.ry;
      scene.add(g);
      // sign face + a floating banner, both real rendered text
      const face = TD.textPlane(k.label, { color: '#0b1020', height: 1.0, size: 64 });
      face.position.set(0, 4.7, 0.13); g.add(face);
      const back = face.clone(); back.position.set(0, 4.7, -0.13); back.rotation.y = Math.PI; g.add(back);
      const lbl = TD.textPlane(k.label, { color: '#ffffff', height: 1.8, size: 72 });
      lbl.position.y = 7.4; g.add(lbl);
      this.billboards.push(lbl);
      const beam = TD.cyl(0.3, 0.3, 4.2, k.c2, 0, 5.4, 0, 8);
      beam.material = TD.mat(k.c2, { transparent: true, opacity: 0.25 });
      g.add(beam);
      this.solids.push({ x: k.x, z: k.z, r: 3.2 });
      return Object.assign({}, k, { group: g, label3d: lbl });
    });

    /* ---- the PLAY portal ---- */
    const portal = TD.props.portal(0x51d88a);
    portal.position.set(0, 0, -30); scene.add(portal);
    const plabel = TD.textPlane('PLAY', { color: '#7ef0ad', height: 2.4, size: 88 });
    plabel.position.y = 7.4; portal.add(plabel); this.billboards.push(plabel);
    this.portal = portal;
    this.kiosks.push({ id: 'play', label: 'PLAY', x: 0, z: -30, group: portal, text: 'Deploy to a map', label3d: plabel });
    this.solids.push({ x: 0, z: -34, r: 3 });

    /* ---- scenery ---- */
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * Math.PI * 2 + 0.2;
      const r = 50 + Math.sin(i * 2.3) * 5;
      const tree = TD.props.tree(0x2f8f4a, 0x4a3524, TD.rand(0.9, 1.5));
      tree.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      scene.add(tree);
    }
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + 0.4;
      const lamp = TD.props.lamp(0xffd98a);
      lamp.position.set(Math.cos(a) * 33, 0, Math.sin(a) * 33);
      scene.add(lamp);
    }
    [[-44, -28], [44, -28], [-46, 26], [46, 26]].forEach((p, i) => {
      const h = TD.props.house(i % 2 ? 0xd8cdb4 : 0xc8b8a0, i % 2 ? 0x9a4b3c : 0x3f5a7a, 1.2);
      h.position.set(p[0], 0, p[1]);
      h.rotation.y = Math.atan2(-p[0], -p[1]);
      scene.add(h);
      this.solids.push({ x: p[0], z: p[1], r: 5 });
    });

    /* ---- idle NPCs ---- */
    const NPC_COLORS = [[0x4f8cff, 0x27304d], [0xff5d6c, 0x3a2430], [0x51d88a, 0x244a34], [0xffc63d, 0x5a4420], [0xa678ff, 0x342a55], [0x6ee7ff, 0x24414a]];
    for (let i = 0; i < 6; i++) {
      const c = NPC_COLORS[i];
      const h = TD.makeHumanoid({
        shirt: c[0], pants: c[1], skin: TD.pick([0xe0ac69, 0xc68642, 0x8d5524, 0xf1c27d]),
        hat: TD.pick([null, 'cap', 'beret', 'visor', 'cowboy']), hatColor: c[0], scale: 0.95
      });
      const a = i / 6 * Math.PI * 2 + 0.9;
      const r = 24 + (i % 2) * 5;
      h.group.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      scene.add(h.group);
      this.npcs.push({ h: h, a: a, r: r, spd: TD.rand(0.12, 0.3) * (i % 2 ? 1 : -1), phase: Math.random() * 10 });
    }

    /* ---- the player (same builder the battle uses) ---- */
    const lvl0 = TD.levelFromXp(TD.Save.data.xp).level;
    const p = TD.makeAvatar(TD.Save.data.name, lvl0);
    p.group.position.set(0, 0, 24);
    scene.add(p.group);
    this.player = { model: p, x: 0, z: 24, y: 0, dir: Math.PI };
    this.nameTag = p.tag;
    this.billboards.push(p.tag);
    this._hatKind = TD.playerHat(lvl0);
    this._tagName = TD.Save.data.name;

    this.camera = new T.PerspectiveCamera(58, 1, 0.5, 400);
    this.updateCamera(0, true);
  };

  /* ------------------------------------------------------------------ */
  Lobby.enter = function () {
    if (!this.scene) this.build();
    this.active = true;
    this.keys = {};
  };
  Lobby.exit = function () { this.active = false; };

  Lobby.resize = function (w, h) {
    if (!this.camera) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  /* ------------------------------------------------------------------ */
  Lobby.update = function (dt) {
    if (!this.active) return;
    this.t += dt;
    const p = this.player;

    /* input -> desired direction, relative to the camera */
    let ix = 0, iz = 0;
    const k = this.keys;
    if (k['w'] || k['arrowup']) iz -= 1;
    if (k['s'] || k['arrowdown']) iz += 1;
    if (k['a'] || k['arrowleft']) ix -= 1;
    if (k['d'] || k['arrowright']) ix += 1;
    if (this.touch.active) { ix += this.touch.x; iz += this.touch.y; }
    const mag = Math.hypot(ix, iz);
    if (mag > 1) { ix /= mag; iz /= mag; }

    const sprint = (k['shift'] ? 1.75 : 1);
    const speed = 15 * sprint;
    const cos = Math.cos(this.yaw), sin = Math.sin(this.yaw);
    // camera forward = (sin, cos); camera right = (-cos, sin)
    const wx = -(ix * cos + iz * sin);
    const wz = ix * sin - iz * cos;

    // smooth acceleration
    const acc = 12;
    this.vel.x += (wx * speed - this.vel.x) * Math.min(1, acc * dt);
    this.vel.z += (wz * speed - this.vel.z) * Math.min(1, acc * dt);

    let nx = p.x + this.vel.x * dt;
    let nz = p.z + this.vel.z * dt;

    // collisions with props + arena bounds
    this.solids.forEach(s => {
      const d = TD.dist(nx, nz, s.x, s.z);
      if (d < s.r + 1.2 && d > 0.001) {
        const push = (s.r + 1.2 - d);
        nx += (nx - s.x) / d * push;
        nz += (nz - s.z) / d * push;
      }
    });
    const rad = Math.hypot(nx, nz);
    if (rad > 60) { nx = nx / rad * 60; nz = nz / rad * 60; }
    p.x = nx; p.z = nz;

    // jump / gravity
    if ((k[' '] || k['space']) && this.grounded) { this.vy = 13; this.grounded = false; TD.Audio.jump(); }
    this.vy -= 38 * dt;
    p.y += this.vy * dt;
    if (p.y <= 0) { p.y = 0; this.vy = 0; this.grounded = true; }

    // orientation + animation
    const moving = Math.hypot(this.vel.x, this.vel.z) > 0.6;
    if (moving) p.dir = TD.angleLerp(p.dir, Math.atan2(this.vel.x, this.vel.z), Math.min(1, 14 * dt));
    p.model.group.position.set(p.x, p.y, p.z);
    p.model.group.rotation.y = p.dir;
    const moveAmt = TD.clamp(Math.hypot(this.vel.x, this.vel.z) / 12, 0, 1.3);
    p.model.anim(this.t, this.grounded ? moveAmt : 0.2, { speed: 9 * sprint });
    if (!this.grounded) { p.model.arms[0].rotation.x = -2.2; p.model.arms[1].rotation.x = -2.2; }

    // footstep sounds
    if (moving && this.grounded) {
      this.stepT -= dt * (0.9 + moveAmt) * sprint;
      if (this.stepT <= 0) { this.stepT = 0.33; TD.Audio.step(); }
    }

    /* NPC wandering */
    this.npcs.forEach(n => {
      n.a += n.spd * dt * 0.25;
      const px = Math.cos(n.a) * n.r, pz = Math.sin(n.a) * n.r;
      n.h.group.position.set(px, 0, pz);
      n.h.group.rotation.y = n.a + (n.spd > 0 ? Math.PI / 2 : -Math.PI / 2);
      n.h.anim(this.t + n.phase, 0.9, { speed: 7 });
    });

    /* ambience */
    if (this.statue) this.statue.rotation.y = Math.sin(this.t * 0.2) * 0.06;
    if (this.portal) {
      this.portal.userData.ring.rotation.z += dt * 0.9;
      this.portal.userData.ring.scale.setScalar(1 + Math.sin(this.t * 2) * 0.03);
    }
    this.kiosks.forEach(kk => {
      if (kk.label3d) kk.label3d.position.y = 7.4 + Math.sin(this.t * 1.7 + kk.x) * 0.25;
    });
    this.billboards.forEach(b => TD.billboard(b, this.camera));

    /* kiosk proximity */
    let near = null, bestD = 7.5;
    this.kiosks.forEach(kk => {
      const d = TD.dist(p.x, p.z, kk.x, kk.z);
      if (d < bestD) { bestD = d; near = kk; }
    });
    if (near !== this.near) {
      this.near = near;
      const el = document.getElementById('prompt');
      if (near) { document.getElementById('prompt-text').textContent = near.text; el.classList.remove('hidden'); }
      else el.classList.add('hidden');
    }

    this.updateCamera(dt);
  };

  Lobby.updateCamera = function (dt, snap) {
    const p = this.player;
    const tx = p.x, ty = p.y + 4.2, tz = p.z;
    const cx = tx - Math.sin(this.yaw) * Math.cos(this.pitch) * this.zoom;
    const cy = ty + Math.sin(this.pitch) * this.zoom + 2;
    const cz = tz - Math.cos(this.yaw) * Math.cos(this.pitch) * this.zoom;
    const s = snap ? 1 : Math.min(1, dt * 12);
    this.camera.position.lerp(new T.Vector3(cx, cy, cz), s);
    this.camera.lookAt(tx, ty, tz);
  };

  Lobby.useNear = function () {
    if (!this.near) return;
    TD.Audio.ui();
    TD.UI.open(this.near.id);
  };

  /* ------------------------------ input ----------------------------- */
  Lobby.bindInput = function (dom) {
    const self = this;
    window.addEventListener('keydown', e => {
      if (!self.active) return;
      const key = e.key.toLowerCase();
      self.keys[key] = true;
      if (key === ' ') e.preventDefault();
      if (key === 'e') self.useNear();
    });
    window.addEventListener('keyup', e => { self.keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { self.keys = {}; });

    let dragging = false, lx = 0, ly = 0;
    dom.addEventListener('pointerdown', e => {
      if (!self.active) return;
      dragging = true; lx = e.clientX; ly = e.clientY;
      dom.setPointerCapture(e.pointerId);
    });
    dom.addEventListener('pointermove', e => {
      if (!dragging || !self.active) return;
      const sens = 0.0055 * (TD.Save.data.settings.sens || 1);
      self.yaw -= (e.clientX - lx) * sens;
      self.pitch = TD.clamp(self.pitch + (e.clientY - ly) * sens, -0.15, 1.15);
      lx = e.clientX; ly = e.clientY;
    });
    const stop = () => { dragging = false; };
    dom.addEventListener('pointerup', stop);
    dom.addEventListener('pointercancel', stop);
    dom.addEventListener('wheel', e => {
      if (!self.active) return;
      self.zoom = TD.clamp(self.zoom + Math.sign(e.deltaY) * 2, 9, 46);
    }, { passive: true });

    /* touch joystick */
    const pad = document.getElementById('touch-pad'), nub = document.getElementById('touch-nub');
    if ('ontouchstart' in window) pad.classList.remove('hidden');
    function padPos(e) {
      const r = pad.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      let dx = (t.clientX - (r.left + r.width / 2)) / (r.width / 2);
      let dy = (t.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
      self.touch.x = dx; self.touch.y = dy;
      nub.style.left = (35 + dx * 32) + 'px';
      nub.style.top = (35 + dy * 32) + 'px';
    }
    pad.addEventListener('touchstart', e => { self.touch.active = true; padPos(e); e.preventDefault(); });
    pad.addEventListener('touchmove', e => { padPos(e); e.preventDefault(); });
    pad.addEventListener('touchend', () => {
      self.touch.active = false; self.touch.x = self.touch.y = 0;
      nub.style.left = '35px'; nub.style.top = '35px';
    });
  };

  /* Reflect saved cosmetics / name on the player. */
  Lobby.refreshPlayer = function () {
    if (!this.player) return;
    if (this.nameTag && this._tagName !== TD.Save.data.name) {
      this._tagName = TD.Save.data.name;
      const old = this.nameTag;
      const tag = TD.textPlane(this._tagName, { color: '#6ee7ff', height: 1.3, size: 64, bg: 'rgba(8,11,22,0.7)' });
      tag.position.y = 6.6;
      old.parent.add(tag); old.parent.remove(old);
      this.billboards[this.billboards.indexOf(old)] = tag;
      this.nameTag = tag;
    }
    const lvl = TD.levelFromXp(TD.Save.data.xp).level;
    // higher levels get a fancier hat, a tiny bit of progression flavour
    const want = TD.playerHat(lvl);
    if (this._hatKind === want) return;
    this._hatKind = want;
    const head = this.player.model.head;
    for (let i = head.children.length - 1; i >= 0; i--) {
      if (head.children[i].userData.isHat) head.remove(head.children[i]);
    }
    const hat = TD.makeHat(want, lvl >= 20 ? 0xffc63d : 0x2f5fb8, 0xff5d6c);
    hat.userData.isHat = true;
    head.add(hat);
  };
})();
