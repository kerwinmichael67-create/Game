/* =========================================================================
   battle.js — the match: map building, placement, towers, enemies, units,
   projectiles, waves, abilities, win/lose.
   ========================================================================= */
(function () {
  const T = THREE;
  const GRID = 2;                 // placement snap
  const TOWER_R = 2.3;            // tower footprint radius

  const B = TD.Battle = {
    active: false, scene: null, camera: null,
    map: null, diff: null, loadout: [],
    towers: [], enemies: [], shots: [], units: [], fx: [],
    cash: 0, hp: 0, wave: 0, phase: 'idle', speed: 1, paused: false,
    time: 0, spawnQueue: [], spawnT: 0, prepT: 0, selected: null,
    placing: null, ghost: null, rangeRing: null, stats: null,
    cam: { tx: 0, tz: 0, yaw: 0.7, pitch: 0.82, dist: 78 },
    keys: {}, mouse: { x: 0, y: 0 }, hoverPoint: null,
    player: null, camFollow: false,
    globalBuff: { rate: 0, dmg: 0, until: 0 }
  };

  /* A repeating two-tone checkerboard, built once per colour pair. */
  const checkerCache = new Map();
  function checkerTex(c1, c2) {
    const key = c1 + '/' + c2;
    if (checkerCache.has(key)) return checkerCache.get(key);
    const cv = document.createElement('canvas');
    cv.width = cv.height = 2;
    const g = cv.getContext('2d');
    const hex = n => '#' + n.toString(16).padStart(6, '0');
    g.fillStyle = hex(c1); g.fillRect(0, 0, 1, 1); g.fillRect(1, 1, 1, 1);
    g.fillStyle = hex(c2); g.fillRect(1, 0, 1, 1); g.fillRect(0, 1, 1, 1);
    const t = new T.CanvasTexture(cv);
    t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(23, 23);
    if (t.colorSpace !== undefined) t.colorSpace = T.SRGBColorSpace;
    checkerCache.set(key, t);
    return t;
  }

  const ray = new T.Raycaster();
  const groundPlane = new T.Plane(new T.Vector3(0, 1, 0), 0);
  const tmpV = new T.Vector3();

  /* ====================================================================
     SETUP
     ==================================================================== */
  B.start = function (mapId, diffId, loadout) {
    this.map = TD.mapById(mapId);
    this.diff = TD.diffById(diffId);
    this.loadout = loadout.filter(Boolean);
    this.towers = []; this.enemies = []; this.shots = []; this.units = []; this.fx = [];
    this.cash = this.diff.cash;
    this.hp = this.diff.baseHp;
    this.maxHp = this.diff.baseHp;
    this.wave = 0; this.phase = 'prep'; this.prepT = 14; this.time = 0;
    this.speed = 1; this.paused = false; this.selected = null; this.placing = null;
    this.globalBuff = { rate: 0, dmg: 0, until: 0 };
    this.stats = { kills: 0, leaked: 0, cashEarned: 0, damage: 0, placed: 0 };
    this.buildWorld();
    this.active = true;
    TD.UI.enterBattle(this);
  };

  B.stop = function () {
    this.active = false;
    if (this.scene) disposeScene(this.scene);
    this.scene = null;
    TD.DamageText.clear();
  };

  function disposeMesh(m) {
    if (m.geometry && !m.geometry.__shared) m.geometry.dispose();
  }
  function disposeScene(s) {
    s.traverse(o => { if (o.isMesh) disposeMesh(o); });
    while (s.children.length) s.remove(s.children[0]);
  }

  B.buildWorld = function () {
    const map = this.map, th = TD.THEMES[map.theme];
    const scene = this.scene = new T.Scene();
    scene.background = new T.Color(th.sky);
    scene.fog = new T.Fog(th.fog, 120, 260);

    scene.add(new T.HemisphereLight(th.fog, th.amb, 0.95));
    const sun = new T.DirectionalLight(th.light, 0.9);
    sun.position.set(48, 78, 36);
    if (TD.Save.data.settings.shadows) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(TD.Save.data.settings.quality >= 1 ? 1024 : 512, TD.Save.data.settings.quality >= 1 ? 1024 : 512);
      sun.shadow.camera.left = -95; sun.shadow.camera.right = 95;
      sun.shadow.camera.top = 95; sun.shadow.camera.bottom = -95;
      sun.shadow.camera.far = 220;
      sun.shadow.bias = -0.0009;
    }
    scene.add(sun);
    const fill = new T.DirectionalLight(th.amb, 0.35);
    fill.position.set(-40, 35, -40); scene.add(fill);

    /* ---- ground: one textured plane instead of hundreds of patches ---- */
    const g = new T.Mesh(new T.PlaneGeometry(460, 460, 1, 1),
      new T.MeshLambertMaterial({ map: checkerTex(th.ground, th.ground2) }));
    g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);

    /* ---- water / lava ---- */
    this.blockers = [];
    const addPool = (w, mat) => {
      // never let a pool spill onto the walkable path
      const r = Math.min(w.r, TD.distToPath(map, w.x, w.z) - map.pathWidth / 2 - 1.5);
      if (r < 5) return;
      const pool = { x: w.x, z: w.z, r: r };
      const m = new T.Mesh(new T.CircleGeometry(r, 26), mat);
      m.rotation.x = -Math.PI / 2; m.position.set(w.x, 0.06, w.z); scene.add(m);
      this.blockers.push(pool);
    };
    (map.water || []).forEach(w => addPool(w, TD.mat(th.water || 0x2f7fb8, { transparent: true, opacity: 0.85 })));
    (map.lava || []).forEach(w => addPool(w, TD.mat(th.lava || 0xff5a1a, { emissive: 0xff3a00, emissiveIntensity: 0.5 })));

    /* ---- the path ---- */
    const halfW = map.pathWidth / 2;
    map.pathData.forEach(pd => {
      pd.seg.forEach(s => {
        const len = s.len;
        const mid = { x: (s.a.x + s.b.x) / 2, z: (s.a.z + s.b.z) / 2 };
        const strip = TD.box(map.pathWidth, 0.3, len + map.pathWidth, th.path, mid.x, 0.12, mid.z);
        strip.rotation.y = Math.atan2(s.b.x - s.a.x, s.b.z - s.a.z);
        strip.castShadow = false; scene.add(strip);
        const edge = TD.box(map.pathWidth + 1.3, 0.16, len + map.pathWidth, th.edge, mid.x, 0.06, mid.z);
        edge.rotation.y = strip.rotation.y; edge.castShadow = false; scene.add(edge);
      });
      pd.pts.forEach(p => {
        const c = new T.Mesh(new T.CylinderGeometry(halfW, halfW, 0.3, 14), TD.mat(th.path));
        c.position.set(p.x, 0.13, p.z); scene.add(c);
      });
    });

    /* ---- spawn portals + base ---- */
    this.portals = map.pathData.map(pd => {
      const p = TD.props.portal(map.theme === 'void' ? 0xff5d6c : 0xa678ff);
      const s = pd.pts[0], n = pd.pts[1];
      p.position.set(s.x, 0, s.z);
      p.rotation.y = Math.atan2(n.x - s.x, n.z - s.z);
      scene.add(p);
      return p;
    });
    const baseG = TD.props.base(0x455178, 0x6ee7ff);
    baseG.position.set(map.base[0], 0, map.base[1]);
    scene.add(baseG);
    this.baseModel = baseG;

    /* ---- scenery ---- */
    const propFn = TD.props[th.prop] || TD.props.tree;
    let seed = 1337;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const propCount = TD.Save.data.settings.quality >= 1 ? 80 : 34;
    for (let i = 0; i < propCount; i++) {
      const x = (rnd() - 0.5) * 180, z = (rnd() - 0.5) * 180;
      if (TD.distToPath(map, x, z) < 11) continue;
      if (TD.dist(x, z, map.base[0], map.base[1]) < 14) continue;
      if (this.blockers.some(b => TD.dist(x, z, b.x, b.z) < b.r + 3)) continue;
      const p = propFn(th.propC[0], th.propC[1], 0.7 + rnd() * 0.9);
      p.position.set(x, 0, z); p.rotation.y = rnd() * 6.28;
      scene.add(p);
    }

    /* ---- placement helpers ---- */
    this.rangeRing = TD.ring(10, 0.22, 0x6ee7ff, 0.55);
    this.rangeRing.position.y = 0.4; this.rangeRing.visible = false;
    scene.add(this.rangeRing);
    const disc = new T.Mesh(new T.CircleGeometry(1, 30), TD.mat(0x6ee7ff, { transparent: true, opacity: 0.12 }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = 0.03;
    this.rangeDisc = disc; disc.visible = false; scene.add(disc);

    /* ---- the player's character, free to walk the map during a match ---- */
    this.buildPlayer();

    /* ---- camera ---- */
    this.camera = new T.PerspectiveCamera(52, 1, 0.5, 600);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    map.paths.forEach(pts => pts.forEach(pt => {
      x0 = Math.min(x0, pt[0]); x1 = Math.max(x1, pt[0]);
      z0 = Math.min(z0, pt[1]); z1 = Math.max(z1, pt[1]);
    }));
    this.cam.tx = (x0 + x1) / 2; this.cam.tz = (z0 + z1) / 2;
    this.cam.dist = TD.clamp(Math.max(x1 - x0, (z1 - z0) * 1.8) * 1.02, 70, 160);
    this.cam.yaw = Math.PI; this.cam.pitch = 0.95;
    this.cam.wantDist = this.cam.dist; this.cam.freeDist = this.cam.dist;
    this.updateCamera(0, true);
  };

  /* ====================================================================
     THE PLAYER'S CHARACTER
     Purely the viewer's avatar: enemies ignore it, it blocks nothing and it
     never affects the simulation. It exists so you can walk your defence
     while it fights.
     ==================================================================== */
  B.buildPlayer = function () {
    const d = TD.Save.data;
    const h = TD.makeAvatar(d.name, TD.levelFromXp(d.xp).level);
    const spot = this.playerSpawn();
    h.group.position.set(spot.x, 0, spot.z);
    this.scene.add(h.group);
    this.player = {
      model: h, x: spot.x, z: spot.z, y: 0,
      dir: Math.PI, vx: 0, vz: 0, vy: 0, grounded: true, t: 0, stepT: 0
    };
    this.camFollow = false;
  };

  /* Somewhere clear beside the base to start from. */
  B.playerSpawn = function () {
    const map = this.map, bx = map.base[0], bz = map.base[1];
    for (let r = 10; r <= 40; r += 4) {
      for (let a = 0; a < 12; a++) {
        const ang = a / 12 * Math.PI * 2;
        const x = bx + Math.cos(ang) * r, z = bz + Math.sin(ang) * r;
        if (Math.abs(x) > 80 || Math.abs(z) > 80) continue;
        if (TD.distToPath(map, x, z) < map.pathWidth / 2 + 3) continue;
        if (this.blockers.some(b => TD.dist(x, z, b.x, b.z) < b.r + 2)) continue;
        return { x: x, z: z };
      }
    }
    return { x: bx, z: bz + 14 };
  };

  /* Runs on real time, not simulation time — the speed multiplier should
     not make you sprint three times faster. */
  B.updatePlayer = function (dt) {
    const p = this.player;
    if (!p) return;
    p.t += dt;

    let ix = 0, iz = 0;
    const k = this.keys;
    if (k['w']) iz -= 1;
    if (k['s']) iz += 1;
    if (k['a']) ix -= 1;
    if (k['d']) ix += 1;
    const mag = Math.hypot(ix, iz);
    if (mag > 1) { ix /= mag; iz /= mag; }
    if (mag > 0) this.setFollow(true);       // walking re-engages the camera

    const sprint = k['shift'] ? 1.8 : 1;
    const speed = 16 * sprint;
    const cos = Math.cos(this.cam.yaw), sin = Math.sin(this.cam.yaw);
    const wx = -(ix * cos + iz * sin);
    const wz = ix * sin - iz * cos;

    p.vx += (wx * speed - p.vx) * Math.min(1, 12 * dt);
    p.vz += (wz * speed - p.vz) * Math.min(1, 12 * dt);

    let nx = p.x + p.vx * dt, nz = p.z + p.vz * dt;

    /* Push out of water, lava and towers; the path itself is walkable.
       Dead centre has no direction to push along, so pick one rather than
       skipping — otherwise the exact centre is a spot you can never leave. */
    const shove = (cx, cz, r) => {
      const d = TD.dist(nx, nz, cx, cz);
      if (d >= r) return;
      if (d < 0.001) { nx = cx + r; return; }
      const push = r - d;
      nx += (nx - cx) / d * push;
      nz += (nz - cz) / d * push;
    };
    this.blockers.forEach(b => shove(b.x, b.z, b.r + 1.2));
    for (let i = 0; i < this.towers.length; i++) shove(this.towers[i].x, this.towers[i].z, 2.6);
    nx = TD.clamp(nx, -88, 88); nz = TD.clamp(nz, -88, 88);
    p.x = nx; p.z = nz;

    if (k[' '] && p.grounded) { p.vy = 13; p.grounded = false; TD.Audio.jump(); }
    p.vy -= 38 * dt;
    p.y += p.vy * dt;
    if (p.y <= 0) { p.y = 0; p.vy = 0; p.grounded = true; }

    const moving = Math.hypot(p.vx, p.vz) > 0.6;
    if (moving) p.dir = TD.angleLerp(p.dir, Math.atan2(p.vx, p.vz), Math.min(1, 14 * dt));
    p.model.group.position.set(p.x, p.y, p.z);
    p.model.group.rotation.y = p.dir;
    const amt = TD.clamp(Math.hypot(p.vx, p.vz) / 12, 0, 1.3);
    p.model.anim(p.t, p.grounded ? amt : 0.2, { speed: 9 * sprint });
    if (!p.grounded) { p.model.arms[0].rotation.x = -2.2; p.model.arms[1].rotation.x = -2.2; }
    if (moving && p.grounded) {
      p.stepT -= dt * (0.9 + amt) * sprint;
      if (p.stepT <= 0) { p.stepT = 0.33; TD.Audio.step(); }
    }
    TD.billboard(p.model.tag, this.camera);
  };

  /* ====================================================================
     CAMERA
     ==================================================================== */
  /* Following from map-fit distance would leave the character a speck, so
     entering follow pulls in and leaving restores whatever the player had. */
  const FOLLOW_DIST = 46;
  B.setFollow = function (on) {
    if (this.camFollow === on) return;
    this.camFollow = on;
    const c = this.cam;
    if (on) {
      c.freeDist = c.wantDist;
      c.wantDist = Math.min(c.wantDist, FOLLOW_DIST);
    } else if (c.freeDist != null) {
      c.wantDist = c.freeDist;
    }
  };

  B.updateCamera = function (dt, snap) {
    const c = this.cam;
    if (c.wantDist == null) c.wantDist = c.dist;
    c.dist += (c.wantDist - c.dist) * (snap ? 1 : Math.min(1, dt * 4));
    if (this.camFollow && this.player) {
      c.tx += (this.player.x - c.tx) * Math.min(1, dt * 3.5);
      c.tz += (this.player.z - c.tz) * Math.min(1, dt * 3.5);
    }
    const cx = c.tx - Math.sin(c.yaw) * Math.cos(c.pitch) * c.dist;
    const cy = Math.sin(c.pitch) * c.dist;
    const cz = c.tz - Math.cos(c.yaw) * Math.cos(c.pitch) * c.dist;
    if (snap) this.camera.position.set(cx, cy, cz);
    else this.camera.position.lerp(tmpV.set(cx, cy, cz), Math.min(1, dt * 10));
    this.camera.lookAt(c.tx, 0, c.tz);
  };
  B.resize = function (w, h) {
    if (!this.camera) return;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  };

  /* ====================================================================
     PLACEMENT
     ==================================================================== */
  B.beginPlace = function (towerId) {
    const def = TD.TOWERS[towerId];
    if (!def) return;
    if (this.cash < def.lv[0].c) { TD.Audio.error(); TD.toast('Not enough cash', 'bad'); return; }
    const placed = this.towers.filter(t => t.def.id === towerId).length;
    if (placed >= def.limit) { TD.Audio.error(); TD.toast(def.name + ' limit reached', 'bad'); return; }
    if (this.towers.length >= this.map.maxTowers) { TD.Audio.error(); TD.toast('Tower limit reached for this map', 'bad'); return; }
    this.cancelPlace();
    this.select(null);
    this.placing = { def: def, rot: 0, ok: false, x: 0, z: 0 };
    this.ghost = TD.buildTower(def, 0);
    this.ghost.traverse(o => {
      if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.62; o.castShadow = false; }
    });
    this.scene.add(this.ghost);
    this.rangeRing.visible = true; this.rangeDisc.visible = true;
    TD.UI.setPlacing(towerId);
  };

  B.cancelPlace = function () {
    if (this.ghost) { this.scene.remove(this.ghost); this.ghost = null; }
    this.placing = null;
    if (!this.selected) { this.rangeRing.visible = false; this.rangeDisc.visible = false; }
    TD.UI.setPlacing(null);
  };

  B.validSpot = function (def, x, z) {
    const map = this.map;
    if (Math.abs(x) > 88 || Math.abs(z) > 88) return false;
    const dp = TD.distToPath(map, x, z);
    const half = map.pathWidth / 2;
    const on = def.placeOn || 'ground';
    if (on === 'path') {
      if (dp > half - 0.8) return false;
    } else {
      if (dp < half + 1.6) return false;
      if (on === 'near-path' && dp > half + 6) return false;
      if (this.blockers.some(b => TD.dist(x, z, b.x, b.z) < b.r + 1)) return false;
      if (TD.dist(x, z, map.base[0], map.base[1]) < 8) return false;
    }
    for (let i = 0; i < this.towers.length; i++) {
      const t = this.towers[i];
      if (TD.dist(x, z, t.x, t.z) < (on === 'path' ? 3.4 : TOWER_R * 2)) return false;
    }
    return true;
  };

  B.placeAt = function (x, z) {
    const p = this.placing; if (!p) return;
    if (!p.ok) { TD.Audio.error(); return; }
    const def = p.def, cost = def.lv[0].c;
    if (this.cash < cost) { TD.Audio.error(); TD.toast('Not enough cash', 'bad'); return; }
    this.cash -= cost;
    const t = this.makeTower(def, x, z);
    this.towers.push(t);
    this.stats.placed++;
    TD.Audio.place();
    spawnRipple(this, x, z, 0x6ee7ff, 4);
    const keep = !!this.keys['shift'];
    this.cancelPlace();
    if (keep && this.cash >= cost) this.beginPlace(def.id);
    else this.select(t);
  };

  B.makeTower = function (def, x, z) {
    const group = TD.buildTower(def, 0);
    group.position.set(x, 0, z);
    this.scene.add(group);
    const t = {
      def: def, level: 0, x: x, z: z, group: group,
      cd: 0, target: null, mode: 0, kills: 0, dealt: 0,
      spent: def.lv[0].c, jam: 0, abilityCd: 0, ramp: 0, harvestKills: 0,
      buff: { rate: 0, dmg: 0, range: 0 }, weaken: 0, revealed: false, blockCount: 0,
      sub: [], spawnT: 0, raiseT: 0, aim: 0, fireAnim: 0
    };
    t.stats = TD.statsAt(def, 0);
    this.initSpecial(t);
    return t;
  };

  /* Sub-entities that some towers own (sentries, drones, aircraft). */
  B.initSpecial = function (t) {
    const a = t.def.attack;
    if (a === 'plane') this.syncPlanes(t);
    if (a === 'chopper') this.syncChoppers(t);
    if (a === 'build') this.syncSentries(t);
    if (a === 'drones') this.syncDrones(t);
  };

  B.upgrade = function (t) {
    if (t.level >= t.def.lv.length - 1) return;
    const next = t.def.lv[t.level + 1];
    if (this.cash < next.c) { TD.Audio.error(); TD.toast('Not enough cash', 'bad'); return; }
    this.cash -= next.c; t.spent += next.c; t.level++;
    t.stats = TD.statsAt(t.def, t.level);
    this.scene.remove(t.group);
    t.group = TD.buildTower(t.def, t.level);
    t.group.position.set(t.x, 0, t.z);
    t.group.rotation.y = t.aim;
    this.scene.add(t.group);
    this.initSpecial(t);
    TD.Audio.upgrade();
    spawnRipple(this, t.x, t.z, 0xffc63d, 5);
    if (this.selected === t) TD.UI.showTower(t);
  };

  B.sell = function (t) {
    const refund = Math.floor(t.spent * 0.65);
    this.cash += refund;
    this.removeTower(t);
    TD.Audio.sell();
    TD.toast('Sold for $' + TD.fmt(refund), 'good');
  };

  B.removeTower = function (t) {
    this.scene.remove(t.group);
    (t.sub || []).forEach(s => this.scene.remove(s.group));
    this.units = this.units.filter(u => u.owner !== t);
    this.towers = this.towers.filter(x => x !== t);
    if (this.selected === t) this.select(null);
  };

  B.select = function (t) {
    this.selected = t;
    if (t) {
      this.rangeRing.visible = true; this.rangeDisc.visible = true;
      TD.UI.showTower(t);
    } else {
      if (!this.placing) { this.rangeRing.visible = false; this.rangeDisc.visible = false; }
      TD.UI.hideTower();
    }
  };

  /* ====================================================================
     WAVES
     ==================================================================== */
  B.startWave = function (fromSkip) {
    if (this.phase !== 'prep') return;
    if (fromSkip) {
      const bonus = TD.skipBonus(this.diff, this.wave + 1, this.prepT);
      this.cash += bonus; this.stats.cashEarned += bonus;
      TD.toast('Skip bonus +$' + bonus, 'good');
    }
    this.wave++;
    const w = TD.buildWave(this.diff, this.wave, this.map.pathData.length);
    this.spawnQueue = w.events.slice();
    this.spawnT = 0;
    this.phase = 'wave';
    TD.UI.waveBanner('WAVE ' + this.wave, TD.wavePreview(this.diff, this.wave));
    if (w.boss) TD.Audio.boss(); else TD.Audio.wave();
  };

  B.endWave = function () {
    this.phase = 'prep';
    this.prepT = this.wave >= this.diff.waves ? 0 : 13;
    let income = TD.waveBonus(this.diff, this.wave);
    let heal = 0;
    this.towers.forEach(t => {
      const s = t.stats;
      if (s.income) income += s.income;
      if (s.heal) heal += s.heal;
    });
    this.cash += income; this.stats.cashEarned += income;
    if (heal) { this.hp = Math.min(this.maxHp, this.hp + heal); }
    TD.Audio.coin();
    TD.toast('Wave ' + this.wave + ' cleared  +$' + TD.fmt(income) + (heal ? '  +' + heal + ' HP' : ''), 'good');
    if (this.wave >= this.diff.waves) this.finish(true);
  };

  B.finish = function (won) {
    if (this.phase === 'over') return;
    this.phase = 'over';
    won ? TD.Audio.win() : TD.Audio.lose();
    const d = TD.Save.data;
    const mul = this.diff.reward * (1 + this.map.tier * 0.12);
    const coins = Math.round((won ? 260 : 60) * mul + this.wave * 11 * mul + this.stats.kills * 0.25);
    const xp = Math.round((won ? 200 : 45) * mul + this.wave * 9 * mul);
    d.coins += coins; d.xp += xp; d.kills += this.stats.kills;
    if (this.wave > d.bestWave) d.bestWave = this.wave;
    if (won) {
      d.wins++;
      d.mapsBeaten[this.map.id] = Math.max(d.mapsBeaten[this.map.id] || 0, TD.DIFFICULTIES.indexOf(this.diff) + 1);
      if (this.diff.id === 'forsaken' || this.diff.id === 'nightmare') d.gems += this.diff.id === 'nightmare' ? 40 : 20;
    } else d.losses++;
    TD.Save.save();
    TD.UI.showResults(won, this, coins, xp);
  };

  /* ====================================================================
     ENEMIES
     ==================================================================== */
  B.spawnEnemy = function (id, pathIdx, spawnD) {
    const def = TD.ENEMIES[id]; if (!def) return null;
    const pd = this.map.pathData[pathIdx % this.map.pathData.length];
    const model = TD.buildEnemy(def);
    const scale = TD.hpScale(this.diff, this.wave);
    const hp = Math.round(def.hp * (def.boss ? TD.bossScale(this.diff, this.wave) : scale));
    const e = {
      def: def, model: model, group: model.group, pd: pd, pathIdx: pathIdx,
      d: spawnD || 0, hp: hp, maxHp: hp, baseSpd: def.spd * this.diff.spdMul,
      slow: 0, slowT: 0, freezeT: 0, burn: 0, burnT: 0, poison: 0, poisonT: 0,
      blocked: null, atkT: 0, summonT: 0, jamT: 0, revived: false,
      dmg: Math.max(5, def.hp * 0.05) * (def.boss ? 3 : 1), phase: Math.random() * 6,
      bar: makeBar(def.boss), dead: false
    };
    e.group.add(e.bar.group);
    e.bar.group.position.y = (def.boss ? 8.4 : 6.6);
    e.bar.group.visible = !!def.boss;
    if (def.flying) e.group.position.y = 6;
    this.scene.add(e.group);
    this.enemies.push(e);
    return e;
  };

  function makeBar(boss) {
    const g = new T.Group();
    const w = boss ? 6 : 3.4;
    const bg = TD.box(w, 0.42, 0.14, 0x11161f, 0, 0, 0);
    bg.castShadow = false;
    const fill = TD.box(w - 0.18, 0.3, 0.1, boss ? 0xff5d6c : 0x51d88a, 0, 0, 0.09);
    fill.castShadow = false;
    fill.material = TD.mat(boss ? 0xff5d6c : 0x51d88a, { emissive: boss ? 0x8a1020 : 0x1f6b3a });
    g.add(bg); g.add(fill);
    return { group: g, fill: fill, w: w - 0.18 };
  }

  B.damageEnemy = function (e, amount, opts) {
    if (e.dead) return 0;
    opts = opts || {};
    const def = e.def;
    let armour = (def.def || 0) * (1 - (opts.armorPierce || 0));
    if (opts.trueDamage) armour = 0;
    let dmg = amount * (1 - TD.clamp(armour, 0, 0.92));
    if (opts.source) dmg *= (1 - (opts.source.weaken || 0));
    if (opts.execute && e.hp / e.maxHp <= opts.execute && !def.boss) dmg = e.hp;
    e.hp -= dmg;
    this.stats.damage += dmg;
    if (opts.source) { opts.source.dealt += dmg; }
    e.bar.group.visible = true;
    if (TD.Save.data.settings.dmgNumbers && dmg >= 1 && !opts.silent) {
      TD.DamageText.push(e.group.position, Math.round(dmg), opts.crit ? '#ffc63d' : '#ffffff');
    }
    if (e.hp <= 0) this.killEnemy(e, opts.source);
    return dmg;
  };

  B.applyStatus = function (e, s, source) {
    const im = e.def.immune || {}, res = e.def.resist || {};
    if (s.slow) {
      const pct = s.slow.pct * (1 - (res.slow || 0));
      if (pct > 0.005) {
        if (pct >= e.slow || e.slowT <= 0) { e.slow = Math.max(e.slow, pct); }
        e.slowT = Math.max(e.slowT, s.slow.dur);
      }
    }
    if (s.freeze && !im.freeze) e.freezeT = Math.max(e.freezeT, s.freeze * (1 - (res.slow || 0)));
    if (s.stun && !im.stun && !e.def.boss) e.freezeT = Math.max(e.freezeT, s.stun);
    else if (s.stun && !im.stun && e.def.boss) e.freezeT = Math.max(e.freezeT, s.stun * 0.4);
    if (s.burn && !im.burn) { e.burn = Math.max(e.burn, s.burn.dps); e.burnT = Math.max(e.burnT, s.burn.dur); }
    if (s.poison) { e.poison = Math.max(e.poison, s.poison.dps); e.poisonT = Math.max(e.poisonT, s.poison.dur); }
    if (s.fear) { e.slow = Math.max(e.slow, s.fear); e.slowT = Math.max(e.slowT, 1.5); }
  };

  B.killEnemy = function (e, source) {
    if (e.dead) return;
    if (e.def.revive && !e.revived) {
      e.revived = true;
      e.hp = e.maxHp * e.def.revive;
      spawnRipple(this, e.group.position.x, e.group.position.z, 0xa678ff, 4);
      return;
    }
    e.dead = true;
    const cash = Math.round(e.def.cash * TD.cashScale(this.diff, this.wave));
    this.cash += cash; this.stats.cashEarned += cash; this.stats.kills++;
    if (source) { source.kills++; if (source.stats.harvest) source.harvestKills++; }
    TD.Audio.hit();

    if (e.def.split) {
      for (let i = 0; i < e.def.split.n; i++) {
        const c = this.spawnEnemy(e.def.split.into, e.pathIdx, Math.max(0, e.d - i * 1.6));
        if (c) c.group.position.copy(e.group.position);
      }
    }
    if (e.def.onDeath && e.def.onDeath.explode) {
      const ex = e.def.onDeath.explode;
      spawnBlast(this, e.group.position.x, e.group.position.z, ex.radius, 0xff8b3a);
      this.towers.forEach(t => {
        if (TD.dist(t.x, t.z, e.group.position.x, e.group.position.z) < ex.radius) t.jam = Math.max(t.jam, ex.jam);
      });
      TD.Audio.boom();
    }
    // Bonecaller raises the fallen
    for (let i = 0; i < this.towers.length; i++) {
      const t = this.towers[i];
      if (t.def.attack === 'raise' && t.raiseReady > 0 &&
        TD.dist(t.x, t.z, e.group.position.x, e.group.position.z) <= t.stats.range) {
        t.raiseReady--;
        this.spawnUnit(t, {
          hp: e.maxHp * t.stats.raise.hpPct, dmg: e.dmg * t.stats.raise.dmgPct,
          cd: 0.8, speed: e.baseSpd * 0.9, block: 1, ranged: 3, life: t.stats.raise.life,
          hidden: true, flying: true, thrall: e.def
        }, e.group.position.x, e.group.position.z, e.pathIdx, e.d);
        break;
      }
    }
    spawnPuff(this, e.group.position, e.def.model && e.def.model.shirt || 0xffffff, e.def.boss ? 22 : 8);
    this.scene.remove(e.group);
  };

  /* ====================================================================
     FRIENDLY UNITS
     ==================================================================== */
  B.spawnUnit = function (owner, cfg, x, z, pathIdx, atD) {
    const map = this.map;
    if (pathIdx == null) {
      const best = nearestPath(map, x, z);
      pathIdx = best.i; atD = best.d;
    }
    const pd = map.pathData[pathIdx];
    const col = cfg.thrall ? (cfg.thrall.model.shirt || 0x8a93aa) : (owner ? (owner.def.model.shirt || 0x4f8cff) : 0x4f8cff);
    const h = TD.makeHumanoid({
      shirt: col, pants: 0x2f3650, skin: cfg.thrall ? 0x9a8fc4 : 0xd9a066,
      hat: cfg.thrall ? 'hood' : 'helmet', hatColor: col, hatColor2: 0x2a3048,
      face: false, minimal: true, scale: (cfg.scale || 1) * 0.9
    });
    if (!cfg.thrall) {
      const ranged = cfg.ranged > 4;
      TD.attachWeapon(h, ranged ? 'rifle' : 'sword', 0x39405a, 0.85);
      if (ranged) h.aimPose(true, 0.12); else h.meleePose(false);
    }
    const u = {
      owner: owner, model: h, group: h.group, pd: pd, pathIdx: pathIdx,
      d: atD, hp: cfg.hp, maxHp: cfg.hp, dmg: cfg.dmg, cd: cfg.cd || 0.8, t: 0,
      speed: cfg.speed || 5, block: cfg.block || 0, ranged: cfg.ranged || 2.6,
      splash: cfg.splash || 0, life: cfg.life || 9999, hidden: cfg.hidden, flying: cfg.flying,
      fly: !!cfg.fly, poison: cfg.poison, orbit: Math.random() * 6.28, bar: makeBar(false)
    };
    u.group.add(u.bar.group);
    u.bar.group.position.y = 6.4; u.bar.group.visible = false;
    const p = TD.pathPoint(pd, atD);
    u.group.position.set(p.x, cfg.fly ? 7 : 0, p.z);
    this.scene.add(u.group);
    this.units.push(u);
    return u;
  };

  function nearestPath(map, x, z) {
    let best = { i: 0, d: 0, dist: 1e9 };
    map.pathData.forEach((pd, i) => {
      pd.seg.forEach(s => {
        const vx = s.b.x - s.a.x, vz = s.b.z - s.a.z;
        let t = ((x - s.a.x) * vx + (z - s.a.z) * vz) / (vx * vx + vz * vz);
        t = TD.clamp(t, 0, 1);
        const px = s.a.x + vx * t, pz = s.a.z + vz * t;
        const dist = TD.dist(x, z, px, pz);
        if (dist < best.dist) best = { i: i, d: s.start + s.len * t, dist: dist };
      });
    });
    return best;
  }

  /* ====================================================================
     UPDATE LOOP
     ==================================================================== */
  /* The simulation always advances in steps of at most STEP seconds, however
     long the real frame was or how high the speed multiplier is. Without this,
     a fast tower could only fire once per rendered frame, so 3x speed quietly
     halved the damage of anything with a sub-0.15s cooldown. */
  const STEP = 0.05;
  B.update = function (rawDt) {
    if (!this.active) return;
    if (this.paused || this.phase === 'over') {
      this.panKeys(rawDt); this.updatePlayer(rawDt); this.updateCamera(rawDt);
      return;
    }

    this.panKeys(rawDt);
    this.updatePlayer(rawDt);
    let remaining = Math.min(0.05, rawDt) * this.speed;
    let guard = 0;
    while (remaining > 1e-4 && guard++ < 8) {
      const dt = Math.min(STEP, remaining);
      remaining -= dt;
      this.step(dt);
      if (this.phase === 'over') break;
    }

    this.updateGhost();
    this.updateCamera(rawDt);
    if (this.baseModel) {
      this.baseModel.userData.core.position.y = 5.2 + Math.sin(this.time * 1.6) * 0.25;
      this.baseModel.userData.ring.rotation.z += rawDt * 0.8;
    }
    this.portals.forEach((p, i) => { p.userData.ring.rotation.z += rawDt * (1 + i * 0.3); });
    TD.UI.tick(this);
    TD.DamageText.update(rawDt, this.camera);
  };

  /* One fixed slice of simulation. */
  B.step = function (dt) {
    this.time += dt;

    if (this.phase === 'prep') {
      if (this.prepT > 0) {
        this.prepT -= dt;
        if (this.prepT <= 0 && this.wave < this.diff.waves) this.startWave(false);
      }
    } else if (this.phase === 'wave') {
      this.spawnT += dt;
      while (this.spawnQueue.length && this.spawnQueue[0].t <= this.spawnT) {
        const ev = this.spawnQueue.shift();
        this.spawnEnemy(ev.id, ev.path, 0);
      }
      if (!this.spawnQueue.length && !this.enemies.length) this.endWave();
    }

    this.updateEnemies(dt);
    this.updateTowers(dt);
    this.updateUnits(dt);
    this.updateShots(dt);
    this.updateFx(dt);
    if (this.globalBuff.until > 0) this.globalBuff.until -= dt;
  };

  B.panKeys = function (dt) {
    const k = this.keys, c = this.cam;
    let px = 0, pz = 0;
    if (k['arrowup']) pz -= 1;
    if (k['arrowdown']) pz += 1;
    if (k['arrowleft']) px -= 1;
    if (k['arrowright']) px += 1;
    if (px || pz) {
      this.setFollow(false);
      const sp = 60 * dt * (c.dist / 80);
      const cos = Math.cos(c.yaw), sin = Math.sin(c.yaw);
      c.tx += -(px * cos + pz * sin) * sp;
      c.tz += (px * sin - pz * cos) * sp;
      c.tx = TD.clamp(c.tx, -90, 90); c.tz = TD.clamp(c.tz, -90, 90);
    }
  };

  /* ------------------------------ enemies ---------------------------- */
  B.updateEnemies = function (dt) {
    const map = this.map;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dead) { this.enemies.splice(i, 1); continue; }

      /* status timers */
      if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slow = 0; }
      if (e.freezeT > 0) e.freezeT -= dt;
      if (e.burnT > 0) { e.burnT -= dt; this.damageEnemy(e, e.burn * dt, { silent: true, trueDamage: true }); if (e.dead) { this.enemies.splice(i, 1); continue; } }
      if (e.poisonT > 0) { e.poisonT -= dt; this.damageEnemy(e, e.poison * dt, { silent: true, trueDamage: true }); if (e.dead) { this.enemies.splice(i, 1); continue; } }

      /* enemy auras */
      const aura = e.def.aura;
      if (aura) {
        if (aura.heal) {
          e.auraT = (e.auraT || 0) - dt;
          if (e.auraT <= 0) {
            e.auraT = 1;
            const r = aura.radius || 13;
            this.enemies.forEach(o => {
              if (o !== e && !o.dead && TD.dist(o.group.position.x, o.group.position.z, e.group.position.x, e.group.position.z) < r) {
                o.hp = Math.min(o.maxHp, o.hp + o.maxHp * aura.heal);
              }
            });
          }
        }
        if (aura.jam) {
          e.jamT -= dt;
          if (e.jamT <= 0) {
            e.jamT = aura.jam.every;
            let hit = 0;
            this.towers.forEach(t => {
              if (TD.dist(t.x, t.z, e.group.position.x, e.group.position.z) < aura.jam.radius) { t.jam = Math.max(t.jam, aura.jam.dur); hit++; }
            });
            if (hit) { spawnRipple(this, e.group.position.x, e.group.position.z, 0xa678ff, aura.jam.radius); }
          }
        }
        if (aura.weaken) {
          this.towers.forEach(t => {
            if (TD.dist(t.x, t.z, e.group.position.x, e.group.position.z) < aura.weaken.radius) t.weaken = aura.weaken.pct;
          });
        }
      }

      /* boss summons */
      if (e.def.summon) {
        e.summonT -= dt;
        if (e.summonT <= 0) {
          e.summonT = e.def.summon.every;
          for (let s = 0; s < e.def.summon.n; s++) {
            const c = this.spawnEnemy(e.def.summon.of, e.pathIdx, Math.max(0, e.d - 4 - s * 2));
            if (c) spawnRipple(this, c.group.position.x, c.group.position.z, 0xff5d6c, 3);
          }
        }
      }

      /* blocking: melee towers with a block value hold enemies in place */
      let blocked = false;
      if (!e.def.flying) {
        for (let k = 0; k < this.towers.length; k++) {
          const t = this.towers[k];
          if (!t.stats.block || t.jam > 0 || t.blockCount >= t.stats.block) continue;
          if (TD.dist(t.x, t.z, e.group.position.x, e.group.position.z) > t.stats.range * 0.8) continue;
          t.blockCount++; blocked = true; break;
        }
      }
      if (!blocked && !e.def.flying) {
        for (let u = 0; u < this.units.length; u++) {
          const un = this.units[u];
          if (un.fly || !un.block || un.pathIdx !== e.pathIdx) continue;
          if (Math.abs(un.d - e.d) < 2.6 && un.d >= e.d - 2.6) {
            blocked = true; e.blocked = un;
            e.atkT -= dt;
            if (e.atkT <= 0) {
              e.atkT = 0.9;
              un.hp -= e.dmg * (e.def.boss ? 4 : 1);
              un.bar.group.visible = true;
            }
            break;
          }
        }
      }

      /* motion */
      let spd = e.baseSpd * (1 - e.slow);
      if (e.freezeT > 0) spd = 0;
      if (blocked) spd = 0;
      e.d += spd * dt;
      const p = TD.pathPoint(e.pd, e.d);
      const y = e.def.flying ? 6 + Math.sin(this.time * 2 + e.phase) * 0.5 : 0;
      e.group.position.set(p.x, y, p.z);
      if (spd > 0.01 || !e.def.flying) e.group.rotation.y = Math.atan2(p.dx, p.dz);

      /* animate */
      const mv = spd > 0.05 ? TD.clamp(spd / 5, 0.4, 1.4) : (blocked ? 1.1 : 0);
      if (e.model.human) e.model.human.anim(this.time * (blocked ? 1.6 : 1) + e.phase, mv, { speed: 7 });
      if (e.model.blob) {
        const s = 1 + Math.sin(this.time * 7 + e.phase) * 0.09;
        e.model.blob.scale.set(s, 2 - s, s);
      }
      if (e.model.wings) e.model.wings.userData.flap(this.time + e.phase);
      if (e.model.aura) e.model.aura.rotation.z += dt * 2;
      if (e.freezeT > 0 && e.model.human) e.model.human.group.rotation.z = 0;

      /* health bar */
      const ratio = TD.clamp(e.hp / e.maxHp, 0, 1);
      e.bar.fill.scale.x = Math.max(0.001, e.bar.w * ratio);
      e.bar.fill.position.x = -(e.bar.w * (1 - ratio)) / 2;
      TD.billboard(e.bar.group, this.camera);

      /* reached the base */
      if (p.done) {
        this.hp -= e.def.leak;
        this.stats.leaked += e.def.leak;
        e.dead = true;
        this.scene.remove(e.group);
        this.enemies.splice(i, 1);
        TD.Audio.leak();
        spawnBlast(this, map.base[0], map.base[1], 6, 0xff5d6c);
        if (this.hp <= 0) { this.hp = 0; this.finish(false); return; }
      }
    }
  };

  /* ------------------------------ towers ----------------------------- */
  B.canSee = function (t, e) {
    const s = t.stats;
    if (e.def.hidden && !s.hidden && !t.revealed) return false;
    if (e.def.flying && !s.flying) return false;
    return true;
  };

  B.findTarget = function (t, range) {
    const mode = t.mode;
    let best = null, bestKey = -Infinity;
    const r2 = range * range;
    const minR2 = t.stats.minRange ? t.stats.minRange * t.stats.minRange : 0;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead || !this.canSee(t, e)) continue;
      const dx = e.group.position.x - t.x, dz = e.group.position.z - t.z;
      const d2 = dx * dx + dz * dz;
      if (d2 > r2 || d2 < minR2) continue;
      let key;
      switch (mode) {
        case 1: key = -e.d; break;            // last
        case 2: key = e.hp; break;            // strongest
        case 3: key = -e.hp; break;           // weakest
        case 4: key = -d2; break;             // closest
        default: key = e.d;                   // first
      }
      if (key > bestKey) { bestKey = key; best = e; }
    }
    return best;
  };

  B.updateTowers = function (dt) {
    /* recompute support buffs */
    const supports = this.towers.filter(t => t.stats.buff);
    const gb = this.globalBuff.until > 0 ? this.globalBuff : null;
    for (let i = 0; i < this.towers.length; i++) {
      const t = this.towers[i];
      t.buff.rate = gb ? gb.rate : 0; t.buff.dmg = gb ? gb.dmg : 0; t.buff.range = 0;
      t.revealed = false; t.blockCount = 0;
      for (let s = 0; s < supports.length; s++) {
        const sp = supports[s];
        if (sp === t) continue;
        if (TD.dist(t.x, t.z, sp.x, sp.z) <= sp.stats.range) {
          const b = sp.stats.buff;
          t.buff.rate += b.rate || 0; t.buff.dmg += b.dmg || 0; t.buff.range += b.range || 0;
        }
      }
      t.weaken = Math.max(0, t.weaken - dt * 0.8);
    }

    /* reveal auras have to resolve before anything picks a target */
    for (let i = 0; i < this.towers.length; i++) {
      const t = this.towers[i];
      if (t.stats.reveal && t.jam <= 0) {
        const r = t.stats.range * (1 + t.buff.range);
        for (let k = 0; k < this.towers.length; k++) {
          const o = this.towers[k];
          if (o !== t && TD.dist(t.x, t.z, o.x, o.z) <= r) o.revealed = true;
        }
      }
    }

    for (let i = 0; i < this.towers.length; i++) {
      const t = this.towers[i];
      const s = t.stats;
      if (t.jam > 0) { t.jam -= dt; jamFlash(t, true); continue; }
      jamFlash(t, false);
      if (t.abilityCd > 0) t.abilityCd -= dt;
      if (t.fireAnim > 0) t.fireAnim -= dt * 3;

      const range = s.range * (1 + t.buff.range);
      const rate = 1 + t.buff.rate;
      const dmgMul = (1 + t.buff.dmg) * (1 - t.weaken) *
        (s.harvest ? 1 + Math.min(s.harvest.max, t.harvestKills * s.harvest.per) : 1);

      /* --- support / passive towers --- */
      switch (t.def.attack) {
        case 'support': case 'farm': case 'heal': {
          if (s.reveal || (s.aura && s.aura.slow)) this.applyAuraToEnemies(t, range);
          idleAnim(t, this.time);
          continue;
        }
        case 'spawn': {
          this.tickSpawner(t, dt);
          idleAnim(t, this.time);
          if (!s.dmg) continue;
          break;
        }
        case 'build': { this.tickSentries(t, dt, dmgMul, rate); idleAnim(t, this.time); continue; }
        case 'drones': { this.tickDrones(t, dt); idleAnim(t, this.time); continue; }
        case 'raise': { t.raiseT -= dt; if (t.raiseT <= 0) { t.raiseT = s.raise.every; t.raiseReady = s.raise.n; } break; }
        case 'plane': { this.tickPlanes(t, dt, dmgMul, rate); continue; }
        case 'chopper': { this.tickChoppers(t, dt, dmgMul, rate); continue; }
        case 'trap': { this.tickTrap(t, dt, dmgMul); continue; }
      }
      if (s.aura && s.aura.slow) this.applyAuraToEnemies(t, range);

      /* --- attacking towers --- */
      t.cd -= dt * rate;
      const target = (t.target && !t.target.dead && this.canSee(t, t.target) &&
        TD.dist(t.x, t.z, t.target.group.position.x, t.target.group.position.z) <= range &&
        (!s.minRange || TD.dist(t.x, t.z, t.target.group.position.x, t.target.group.position.z) >= s.minRange))
        ? t.target : this.findTarget(t, range);
      if (target !== t.target) { t.target = target; t.ramp = 0; }

      if (!target) { idleAnim(t, this.time); if (t.beam) hideBeam(t); continue; }

      /* face the target */
      const ang = Math.atan2(target.group.position.x - t.x, target.group.position.z - t.z);
      t.aim = TD.angleLerp(t.aim, ang, Math.min(1, dt * 9));
      aimAnim(t, this.time);

      if (t.def.attack === 'beam') { this.tickBeam(t, dt, target, dmgMul, range); continue; }
      if (t.def.attack === 'flame') { this.tickFlame(t, dt, dmgMul, range, rate); continue; }

      if (t.cd > 0) continue;
      t.cd = s.cd;
      t.fireAnim = 1;
      this.fire(t, target, dmgMul, range);
    }
  };

  B.applyAuraToEnemies = function (t, range) {
    const s = t.stats;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead) continue;
      if (TD.dist(t.x, t.z, e.group.position.x, e.group.position.z) > range) continue;
      if (s.aura && s.aura.slow) { const p = s.aura.slow * (1 - ((e.def.resist || {}).slow || 0)); if (p > e.slow) { e.slow = p; e.slowT = Math.max(e.slowT, 0.4); } }
    }
    if (s.reveal) {
      // a Marshal lends hidden-detection to every tower inside its aura
      for (let i = 0; i < this.towers.length; i++) {
        const o = this.towers[i];
        if (o !== t && TD.dist(t.x, t.z, o.x, o.z) <= range) o.revealed = true;
      }
    }
  };

  /* ------------------------------ firing ----------------------------- */
  B.fire = function (t, target, dmgMul, range) {
    const s = t.stats;
    const dmg = s.dmg * dmgMul;
    const opts = {
      source: t, armorPierce: s.armorPierce || 0, execute: s.execute || 0,
      splash: s.splash || 0, status: pickStatus(s), pierce: s.pierce || 0
    };
    const muzzle = { x: t.x, y: 3.2, z: t.z };
    const volley = s.volley || 1;

    switch (t.def.attack) {
      case 'shotgun': {
        for (let i = 0; i < (s.pellets || 4); i++) {
          const spread = (s.spread || 0.25);
          const a = t.aim + (Math.random() - 0.5) * spread * 2;
          const tx = t.x + Math.sin(a) * range, tz = t.z + Math.cos(a) * range;
          const hit = this.raycastEnemies(t, t.x, t.z, tx, tz, 1.6, 1);
          if (hit.length) this.hitEnemy(t, hit[0], dmg, opts);
          spawnTracer(this, muzzle, { x: hit.length ? hit[0].group.position.x : tx, y: 3, z: hit.length ? hit[0].group.position.z : tz }, 0xffd45e);
        }
        TD.Audio.heavy();
        break;
      }
      case 'chain': {
        let cur = target, hitList = [];
        let d = dmg;
        for (let i = 0; i < (s.chain || 3); i++) {
          if (!cur) break;
          hitList.push(cur);
          this.hitEnemy(t, cur, d, opts);
          spawnLightning(this, i === 0 ? muzzle : hitList[i - 1].group.position, cur.group.position);
          d *= 0.82;
          cur = this.nearestOther(cur, hitList, 12, t);
        }
        TD.Audio.laser();
        break;
      }
      case 'aoe': {
        const p = target.group.position;
        spawnBlast(this, p.x, p.z, s.splash, 0x9ff0ff);
        this.splashDamage(t, p.x, p.z, s.splash, dmg, opts);
        TD.Audio.heavy();
        break;
      }
      case 'melee': {
        const n = s.meleeTargets || 1;
        const list = this.enemiesInRange(t, range).slice(0, n);
        list.forEach(e => this.hitEnemy(t, e, dmg, opts));
        if (list.length) spawnSlash(this, t.x, t.z, t.aim, range);
        TD.Audio.hit();
        break;
      }
      case 'slam': {
        spawnBlast(this, t.x, t.z, s.splash, 0xd8b06a);
        this.splashDamage(t, t.x, t.z, s.splash, dmg, opts);
        TD.Audio.boom();
        break;
      }
      case 'mortar': case 'explosive': {
        for (let v = 0; v < volley; v++) {
          const jitter = v ? (Math.random() - 0.5) * 5 : 0;
          this.launch(t, target, dmg, opts, {
            speed: s.projSpeed || 34, arc: !!s.arc || t.def.attack === 'mortar',
            splash: s.splash || 4, jitter: jitter, homing: !!s.homing,
            color: t.def.attack === 'mortar' ? 0x39405a : 0xff8b3a, size: 0.45
          });
        }
        TD.Audio.heavy();
        break;
      }
      default: { /* bullet */
        for (let v = 0; v < volley; v++) {
          this.launch(t, target, dmg, opts, {
            speed: s.projSpeed || 70, splash: s.splash || 0, pierce: s.pierce || 0,
            color: s.elemental || s.allElements ? 0xa678ff : 0xffe08a, size: 0.26,
            chaos: s.chaos, elemental: s.elemental || s.allElements
          });
        }
        TD.Audio.shoot();
        break;
      }
    }
    if (s.cash) { this.cash += s.cash; this.stats.cashEarned += s.cash; }
    muzzleFlash(this, t, muzzle);
  };

  function pickStatus(s) {
    const st = {};
    if (s.slow) st.slow = s.slow;
    if (s.burn) st.burn = s.burn;
    if (s.poison) st.poison = s.poison;
    if (s.stun) st.stun = s.stun;
    if (s.freeze) st.freeze = s.freeze;
    if (s.fear) st.fear = s.fear;
    return st;
  }

  B.hitEnemy = function (t, e, dmg, opts) {
    let d = dmg;
    if (opts.chaos) d *= TD.rand(opts.chaos[0], opts.chaos[1]);
    const crit = opts.chaos && d > dmg * 1.8;
    this.damageEnemy(e, d, { source: t, armorPierce: opts.armorPierce, execute: opts.execute, crit: crit });
    if (opts.status) this.applyStatus(e, opts.status, t);
    if (opts.splash) this.splashDamage(t, e.group.position.x, e.group.position.z, opts.splash, d * 0.6, { source: t, armorPierce: opts.armorPierce, status: opts.status, skip: e });
  };

  B.splashDamage = function (t, x, z, radius, dmg, opts) {
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead || e === opts.skip) continue;
      if (e.def.flying && !(t && t.stats.flying)) continue;
      if (e.def.hidden && !(t && t.stats.hidden)) continue;
      const d = TD.dist(x, z, e.group.position.x, e.group.position.z);
      if (d > radius) continue;
      const falloff = 1 - (d / radius) * 0.45;
      this.damageEnemy(e, dmg * falloff, { source: t, armorPierce: opts.armorPierce, silent: true });
      if (opts.status) this.applyStatus(e, opts.status, t);
    }
  };

  B.enemiesInRange = function (t, range) {
    const out = [];
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead || !this.canSee(t, e)) continue;
      if (TD.dist(t.x, t.z, e.group.position.x, e.group.position.z) <= range) out.push(e);
    }
    out.sort((a, b) => b.d - a.d);
    return out;
  };

  B.nearestOther = function (from, exclude, radius, t) {
    let best = null, bd = radius;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead || exclude.indexOf(e) >= 0 || !this.canSee(t, e)) continue;
      const d = TD.dist(from.group.position.x, from.group.position.z, e.group.position.x, e.group.position.z);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  };

  B.raycastEnemies = function (t, x0, z0, x1, z1, width, max) {
    const out = [];
    const vx = x1 - x0, vz = z1 - z0;
    const len2 = vx * vx + vz * vz;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead || !this.canSee(t, e)) continue;
      const wx = e.group.position.x - x0, wz = e.group.position.z - z0;
      let s = (wx * vx + wz * vz) / len2;
      if (s < 0 || s > 1) continue;
      const px = x0 + vx * s, pz = z0 + vz * s;
      if (TD.dist(e.group.position.x, e.group.position.z, px, pz) <= width) out.push({ e: e, s: s });
    }
    out.sort((a, b) => a.s - b.s);
    return out.slice(0, max || 99).map(o => o.e);
  };

  /* --------------------------- special attacks ----------------------- */
  B.tickBeam = function (t, dt, target, dmgMul, range) {
    const s = t.stats;
    t.ramp = Math.min(s.ramp.max, t.ramp + s.ramp.rate * dt);
    const mult = 1 + t.ramp;
    t.cd -= dt;
    if (t.cd <= 0) {
      t.cd = s.cd;
      const list = this.raycastEnemies(t, t.x, t.z,
        t.x + Math.sin(t.aim) * range, t.z + Math.cos(t.aim) * range, 2.2, (s.pierce || 1) + 1);
      const use = list.length ? list : [target];
      use.forEach(e => this.damageEnemy(e, s.dmg * mult * dmgMul, { source: t, armorPierce: s.armorPierce }));
    }
    showBeam(this, t, target, mult);
  };

  B.tickFlame = function (t, dt, dmgMul, range, rate) {
    const s = t.stats;
    t.cd -= dt * rate;
    if (t.cd > 0) return;
    t.cd = s.cd;
    const cone = s.cone || 0.55;
    let any = false;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead || !this.canSee(t, e)) continue;
      const dx = e.group.position.x - t.x, dz = e.group.position.z - t.z;
      if (Math.hypot(dx, dz) > range) continue;
      const a = Math.atan2(dx, dz);
      let diff = Math.abs(((a - t.aim + Math.PI) % (Math.PI * 2)) - Math.PI);
      if (diff > cone) continue;
      this.damageEnemy(e, s.dmg * dmgMul, { source: t, silent: true });
      this.applyStatus(e, { burn: s.burn }, t);
      any = true;
    }
    if (any && Math.random() < 0.3) TD.Audio.hit();
    spawnFlame(this, t, range, cone);
  };

  B.tickTrap = function (t, dt, dmgMul) {
    const s = t.stats;
    t.cd -= dt;
    const armed = t.cd <= 0;
    if (t.group.userData.struct) t.group.userData.struct.position.y = armed ? 0 : -0.5;
    t.group.visible = true;
    if (!armed) return;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead || e.def.flying) continue;
      if (TD.dist(t.x, t.z, e.group.position.x, e.group.position.z) > s.range) continue;
      t.cd = s.cd;
      this.damageEnemy(e, s.dmg * dmgMul, { source: t, armorPierce: 0.3 });
      this.applyStatus(e, { stun: s.stun, burn: s.burn }, t);
      if (s.splash) this.splashDamage(t, t.x, t.z, s.splash, s.dmg * dmgMul * 0.6, { source: t, skip: e, status: { stun: s.stun * 0.5 } });
      spawnBlast(this, t.x, t.z, s.splash || 3, 0xffc63d);
      TD.Audio.boom();
      break;
    }
  };

  B.tickSpawner = function (t, dt) {
    const cfg = t.stats.units; if (!cfg) return;
    t.spawnT -= dt;
    const alive = this.units.filter(u => u.owner === t).length;
    if (t.spawnT <= 0 && alive < cfg.n) {
      t.spawnT = cfg.every / cfg.n;
      this.spawnUnit(t, cfg, t.x, t.z);
    }
  };

  B.syncSentries = function (t) {
    (t.sub || []).forEach(s => this.scene.remove(s.group));
    t.sub = [];
    const cfg = t.stats.build; if (!cfg) return;
    for (let i = 0; i < cfg.n; i++) {
      const a = i / cfg.n * Math.PI * 2 + 0.6;
      const x = t.x + Math.cos(a) * 4.2, z = t.z + Math.sin(a) * 4.2;
      const g = new T.Group();
      g.add(TD.cyl(0.9, 1.1, 0.5, 0x3b4460, 0, 0.25, 0, 8));
      const head = new T.Group(); head.position.y = 0.9;
      head.add(TD.box(1.1, 0.8, 1.2, 0xd8a33a, 0, 0, 0));
      head.add(TD.box(0.2, 0.2, 1.4, 0x2b3350, 0, 0.05, 0.9));
      g.add(head);
      g.position.set(x, 0, z);
      this.scene.add(g);
      t.sub.push({ group: g, head: head, x: x, z: z, cd: Math.random() * 0.4, aim: 0 });
    }
  };

  B.tickSentries = function (t, dt, dmgMul, rate) {
    const cfg = t.stats.build; if (!cfg) return;
    if (!t.sub.length) this.syncSentries(t);
    t.sub.forEach(s => {
      s.cd -= dt * rate;
      const fake = { x: s.x, z: s.z, stats: { hidden: cfg.hidden, flying: cfg.flying }, mode: t.mode, dealt: 0, kills: 0 };
      const e = this.findTarget(fake, cfg.range);
      if (!e) return;
      s.aim = TD.angleLerp(s.aim, Math.atan2(e.group.position.x - s.x, e.group.position.z - s.z), Math.min(1, dt * 10));
      s.head.rotation.y = s.aim;
      if (s.cd > 0) return;
      s.cd = cfg.cd;
      this.damageEnemy(e, cfg.dmg * dmgMul, { source: t });
      if (cfg.splash) this.splashDamage(t, e.group.position.x, e.group.position.z, cfg.splash, cfg.dmg * dmgMul * 0.5, { source: t, skip: e });
      spawnTracer(this, { x: s.x, y: 1.6, z: s.z }, e.group.position, 0xffd45e);
    });
  };

  B.syncDrones = function (t) {
    this.units = this.units.filter(u => { if (u.owner === t) { this.scene.remove(u.group); return false; } return true; });
    const cfg = t.stats.drones; if (!cfg) return;
    for (let i = 0; i < cfg.n; i++) {
      const u = this.spawnUnit(t, {
        hp: cfg.hp, dmg: cfg.dmg, cd: cfg.cd, speed: 12, ranged: 9,
        hidden: cfg.hidden, flying: cfg.flying, fly: true, poison: cfg.poison, scale: 0.55
      }, t.x, t.z);
      u.orbit = i / cfg.n * Math.PI * 2;
      u.home = t;
      const w = TD.makeWings(0x6ef0b0, 1.6);
      w.scale.setScalar(0.6); u.group.add(w); u.wings = w;
    }
  };
  B.tickDrones = function (t, dt) {
    const cfg = t.stats.drones; if (!cfg) return;
    const alive = this.units.filter(u => u.owner === t).length;
    if (alive < cfg.n) { t.spawnT -= dt; if (t.spawnT <= 0) { t.spawnT = 6; this.syncDrones(t); } }
  };

  B.syncPlanes = function (t) {
    (t.sub || []).forEach(s => this.scene.remove(s.group));
    t.sub = [];
    const n = t.stats.planes || 1;
    for (let i = 0; i < n; i++) {
      const p = TD.makePlane(0xdd4b3e, 0xd8dcea);
      p.scale.setScalar(0.9);
      this.scene.add(p);
      t.sub.push({ group: p, a: i / n * Math.PI * 2, cd: 0 });
    }
  };
  B.tickPlanes = function (t, dt, dmgMul, rate) {
    const s = t.stats;
    if (!t.sub.length) this.syncPlanes(t);
    const R = s.range;
    t.sub.forEach(p => {
      p.a += dt * (s.planeSpeed || 0.55);
      const x = t.x + Math.cos(p.a) * R * 0.75, z = t.z + Math.sin(p.a) * R * 0.75;
      p.group.position.set(x, 15, z);
      p.group.rotation.y = -p.a + Math.PI / 2;
      p.group.rotation.z = 0.35;
      p.group.userData.prop.rotation.z += dt * 40;
      p.cd -= dt * rate;
      if (p.cd > 0) return;
      const fake = { x: x, z: z, stats: s, mode: t.mode };
      const e = this.findTarget(fake, 16);
      if (!e) return;
      p.cd = s.cd;
      this.damageEnemy(e, s.dmg * dmgMul, { source: t });
      if (s.splash) this.splashDamage(t, e.group.position.x, e.group.position.z, s.splash, s.dmg * dmgMul * 0.5, { source: t, skip: e });
      spawnTracer(this, { x: x, y: 14, z: z }, e.group.position, 0xffd45e);
    });
  };

  B.syncChoppers = function (t) {
    (t.sub || []).forEach(s => this.scene.remove(s.group));
    t.sub = [];
    const c = TD.makeChopper(0x3f4a3a);
    c.scale.setScalar(0.8);
    this.scene.add(c);
    const np = nearestPath(this.map, t.x, t.z);
    const p = TD.pathPoint(this.map.pathData[np.i], np.d);
    t.sub.push({ group: c, hx: p.x, hz: p.z, cd: 0, bob: 0 });
  };
  B.tickChoppers = function (t, dt, dmgMul, rate) {
    const s = t.stats;
    if (!t.sub.length) this.syncChoppers(t);
    const c = t.sub[0];
    c.bob += dt;
    c.group.position.set(c.hx, (s.hover || 14) + Math.sin(c.bob * 1.4) * 0.6, c.hz);
    c.group.userData.rotor.rotation.y += dt * 30;
    c.cd -= dt * rate;
    const fake = { x: c.hx, z: c.hz, stats: s, mode: t.mode };
    const e = this.findTarget(fake, s.range);
    if (!e) return;
    c.group.rotation.y = TD.angleLerp(c.group.rotation.y, Math.atan2(e.group.position.x - c.hx, e.group.position.z - c.hz), Math.min(1, dt * 4));
    if (c.cd > 0) return;
    c.cd = s.cd;
    this.damageEnemy(e, s.dmg * dmgMul, { source: t });
    if (s.splash) this.splashDamage(t, e.group.position.x, e.group.position.z, s.splash, s.dmg * dmgMul * 0.5, { source: t, skip: e });
    if (s.stun) this.applyStatus(e, { stun: s.stun }, t);
    spawnTracer(this, { x: c.hx, y: s.hover || 14, z: c.hz }, e.group.position, 0xffd45e);
  };

  /* ------------------------------- units ----------------------------- */
  B.updateUnits = function (dt) {
    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];
      u.life -= dt;
      if (u.hp <= 0 || u.life <= 0) {
        spawnPuff(this, u.group.position, 0x8a93aa, 6);
        this.scene.remove(u.group); this.units.splice(i, 1); continue;
      }
      u.t -= dt;

      /* find something to hit */
      let target = null, bd = u.ranged;
      for (let k = 0; k < this.enemies.length; k++) {
        const e = this.enemies[k];
        if (e.dead) continue;
        if (e.def.hidden && !u.hidden) continue;
        if (e.def.flying && !u.flying) continue;
        const d = TD.dist(u.group.position.x, u.group.position.z, e.group.position.x, e.group.position.z);
        if (d < bd) { bd = d; target = e; }
      }

      if (u.fly) {
        /* drones orbit their tower and dart at targets */
        const home = u.owner;
        u.orbit += dt * 1.4;
        let tx, tz, ty = 8;
        if (target) { tx = target.group.position.x; tz = target.group.position.z; ty = target.def.flying ? 8 : 6.5; }
        else if (home) { tx = home.x + Math.cos(u.orbit) * 5; tz = home.z + Math.sin(u.orbit) * 5; }
        else { tx = u.group.position.x; tz = u.group.position.z; }
        u.group.position.x += (tx - u.group.position.x) * Math.min(1, dt * 2.4);
        u.group.position.z += (tz - u.group.position.z) * Math.min(1, dt * 2.4);
        u.group.position.y += (ty - u.group.position.y) * Math.min(1, dt * 3);
        u.group.rotation.y = Math.atan2(tx - u.group.position.x, tz - u.group.position.z);
        if (u.wings) u.wings.userData.flap(this.time * 2);
      } else {
        /* ground units march up the path toward the spawn */
        if (!target) {
          u.d -= u.speed * dt;
          if (u.d < 0) u.d = 0;
        }
        const p = TD.pathPoint(u.pd, u.d);
        u.group.position.set(p.x, 0, p.z);
        u.group.rotation.y = Math.atan2(-p.dx, -p.dz);
        u.model.anim(this.time + u.orbit, target ? 1.2 : 0.95, { speed: 8 });
      }

      if (target && u.t <= 0) {
        u.t = u.cd;
        this.damageEnemy(target, u.dmg, { source: null, silent: true });
        if (u.poison) this.applyStatus(target, { poison: u.poison }, null);
        if (u.splash) this.splashDamage(null, target.group.position.x, target.group.position.z, u.splash, u.dmg * 0.5, { skip: target });
        if (u.ranged > 4) spawnTracer(this, { x: u.group.position.x, y: 3, z: u.group.position.z }, target.group.position, 0x9fe8ff);
      }

      const ratio = TD.clamp(u.hp / u.maxHp, 0, 1);
      u.bar.fill.scale.x = Math.max(0.001, u.bar.w * ratio);
      u.bar.fill.position.x = -(u.bar.w * (1 - ratio)) / 2;
      TD.billboard(u.bar.group, this.camera);
      u.bar.group.visible = ratio < 0.999;
    }
  };

  /* ---------------------------- projectiles -------------------------- */
  /* Projectiles are created constantly — reuse one geometry per radius. */
  const shotGeo = new Map();
  function projGeo(r) {
    const k = r.toFixed(2);
    if (!shotGeo.has(k)) {
      const g = new T.SphereGeometry(r, 7, 5);
      g.__shared = true;
      shotGeo.set(k, g);
    }
    return shotGeo.get(k);
  }

  B.launch = function (t, target, dmg, opts, cfg) {
    const geo = cfg.arc ? 0.42 : (cfg.size || 0.3);
    const m = new T.Mesh(projGeo(geo), TD.mat(cfg.color || 0xffe08a, { emissive: cfg.color || 0xffe08a, emissiveIntensity: 0.4 }));
    m.position.set(t.x, 3.2, t.z);
    this.scene.add(m);
    const tp = target.group.position;
    const dist = TD.dist(t.x, t.z, tp.x, tp.z);
    const travel = dist / cfg.speed;
    const lead = target.baseSpd * (1 - target.slow) * travel;
    const lp = TD.pathPoint(target.pd, target.d + lead);
    this.shots.push({
      mesh: m, src: t, target: target, dmg: dmg, opts: opts,
      x: t.x, y: 3.2, z: t.z,
      tx: lp.x + (cfg.jitter || 0), ty: target.def.flying ? 6 : 2.2, tz: lp.z + (cfg.jitter || 0),
      speed: cfg.speed, arc: cfg.arc, t: 0, dur: Math.max(0.08, travel),
      splash: cfg.splash || 0, pierce: cfg.pierce || 0, hitList: [],
      homing: cfg.homing, chaos: cfg.chaos, elemental: cfg.elemental
    });
  };

  B.updateShots = function (dt) {
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const p = this.shots[i];
      p.t += dt;
      const k = TD.clamp(p.t / p.dur, 0, 1);
      if (p.homing && p.target && !p.target.dead) {
        p.tx = p.target.group.position.x; p.tz = p.target.group.position.z;
        p.ty = p.target.def.flying ? 6 : 2.2;
      }
      const x = TD.lerp(p.x, p.tx, k), z = TD.lerp(p.z, p.tz, k);
      let y = TD.lerp(p.y, p.ty, k);
      if (p.arc) y += Math.sin(k * Math.PI) * (TD.dist(p.x, p.z, p.tx, p.tz) * 0.28);
      p.mesh.position.set(x, y, z);

      /* pierce: damage things it flies through */
      if (p.pierce) {
        for (let e = 0; e < this.enemies.length; e++) {
          const en = this.enemies[e];
          if (en.dead || p.hitList.indexOf(en) >= 0) continue;
          if (!this.canSee(p.src, en)) continue;
          if (TD.dist(x, z, en.group.position.x, en.group.position.z) < 2.0) {
            p.hitList.push(en);
            this.hitEnemy(p.src, en, p.dmg, Object.assign({}, p.opts, { splash: 0 }));
            if (p.hitList.length > p.pierce) { p.spent = true; break; }
          }
        }
      }

      if (k >= 1 || p.spent) {
        const opts = Object.assign({}, p.opts, { splash: p.splash, chaos: p.chaos });
        if (p.elemental) applyElement(this, p, x, z);
        if (p.target && !p.target.dead && TD.dist(x, z, p.target.group.position.x, p.target.group.position.z) < 4.5) {
          if (p.hitList.indexOf(p.target) < 0) this.hitEnemy(p.src, p.target, p.dmg, opts);
        } else if (p.splash) {
          this.splashDamage(p.src, x, z, p.splash, p.dmg, { source: p.src, status: p.opts.status, armorPierce: p.opts.armorPierce });
        }
        if (p.splash > 3) { spawnBlast(this, x, z, p.splash, 0xff8b3a); TD.Audio.boom(); }
        this.scene.remove(p.mesh);
        this.shots.splice(i, 1);
      }
    }
  };

  function applyElement(self, p, x, z) {
    const r = Math.random();
    const st = r < 0.34 ? { burn: { dps: p.dmg * 0.35, dur: 3 } }
      : r < 0.67 ? { slow: { pct: 0.45, dur: 2.4 } }
        : { stun: 0.35 };
    self.splashDamage(p.src, x, z, 4, p.dmg * 0.4, { source: p.src, status: st });
  }

  /* ------------------------------ effects ---------------------------- */
  function pushFx(self, mesh, life, fn) {
    self.scene.add(mesh);
    self.fx.push({ mesh: mesh, life: life, max: life, fn: fn });
  }
  function spawnBlast(self, x, z, r, color) {
    const m = new T.Mesh(new T.SphereGeometry(1, 10, 7), TD.mat(color, { transparent: true, opacity: 0.55 }));
    m.position.set(x, 1.5, z);
    pushFx(self, m, 0.35, (o, k) => { o.scale.setScalar(r * (1 - k) + r * 0.2); o.material.opacity = 0.55 * k; });
  }
  function spawnRipple(self, x, z, color, r) {
    const m = TD.ring(1, 0.16, color, 0.8);
    m.position.set(x, 0.5, z);
    pushFx(self, m, 0.5, (o, k) => { o.scale.setScalar(r * (1.2 - k)); o.material.opacity = 0.8 * k; });
  }
  function spawnPuff(self, pos, color, n) {
    for (let i = 0; i < Math.min(n, 10); i++) {
      const m = new T.Mesh(new T.BoxGeometry(0.4, 0.4, 0.4), TD.mat(color, { transparent: true, opacity: 0.9 }));
      m.position.copy(pos); m.position.y += 2;
      const v = { x: TD.rand(-4, 4), y: TD.rand(3, 8), z: TD.rand(-4, 4) };
      pushFx(self, m, 0.6, (o, k, dt) => {
        v.y -= 22 * dt;
        o.position.x += v.x * dt; o.position.y += v.y * dt; o.position.z += v.z * dt;
        o.material.opacity = k; o.rotation.x += dt * 6; o.rotation.y += dt * 5;
      });
    }
  }
  function spawnTracer(self, a, b, color) {
    const m = new T.Mesh(new T.BoxGeometry(0.1, 0.1, 1), TD.mat(color, { transparent: true, opacity: 0.85, emissive: color }));
    const dx = b.x - a.x, dy = (b.y != null ? b.y : 2) - a.y, dz = b.z - a.z;
    const len = Math.hypot(dx, dy, dz);
    m.scale.z = len;
    m.position.set(a.x + dx / 2, a.y + dy / 2, a.z + dz / 2);
    m.lookAt(b.x, b.y != null ? b.y : 2, b.z);
    m.castShadow = false;
    pushFx(self, m, 0.09, (o, k) => { o.material.opacity = 0.85 * k; });
  }
  function spawnLightning(self, a, b) {
    spawnTracer(self, { x: a.x, y: (a.y || 3), z: a.z }, { x: b.x, y: 3, z: b.z }, 0x9fe8ff);
    const m = new T.Mesh(new T.SphereGeometry(0.6, 8, 6), TD.mat(0x9fe8ff, { transparent: true, opacity: 0.8, emissive: 0x6ee7ff }));
    m.position.set(b.x, 3, b.z);
    pushFx(self, m, 0.2, (o, k) => { o.scale.setScalar(1 + (1 - k) * 1.5); o.material.opacity = 0.8 * k; });
  }
  function spawnSlash(self, x, z, ang, r) {
    const m = TD.ring(r * 0.8, 0.22, 0xffe08a, 0.8);
    m.position.set(x, 2.2, z);
    pushFx(self, m, 0.2, (o, k) => { o.material.opacity = 0.8 * k; o.scale.setScalar(1 + (1 - k) * 0.3); });
  }
  function spawnFlame(self, t, range, cone) {
    if (Math.random() > 0.55) return;
    const m = new T.Mesh(new T.ConeGeometry(range * Math.tan(cone) * 0.5, range * 0.85, 7, 1, true),
      TD.mat(0xff8b3a, { transparent: true, opacity: 0.4, side: T.DoubleSide }));
    m.position.set(t.x + Math.sin(t.aim) * range * 0.42, 2.6, t.z + Math.cos(t.aim) * range * 0.42);
    m.rotation.z = Math.PI / 2;
    m.rotation.y = -t.aim + Math.PI / 2;
    m.castShadow = false;
    pushFx(self, m, 0.16, (o, k) => { o.material.opacity = 0.4 * k; });
  }
  function muzzleFlash(self, t, pos) {
    if (Math.random() > 0.5) return;
    const m = new T.Mesh(new T.SphereGeometry(0.42, 6, 5), TD.mat(0xffe08a, { transparent: true, opacity: 0.9, emissive: 0xffc63d }));
    m.position.set(t.x + Math.sin(t.aim) * 2.2, 3.1, t.z + Math.cos(t.aim) * 2.2);
    m.castShadow = false;
    pushFx(self, m, 0.07, (o, k) => { o.material.opacity = 0.9 * k; });
  }
  function showBeam(self, t, target, mult) {
    if (!t.beam) {
      t.beam = new T.Mesh(new T.CylinderGeometry(0.22, 0.22, 1, 7), TD.mat(0x6ee7ff, { transparent: true, opacity: 0.8, emissive: 0x6ee7ff }));
      t.beam.castShadow = false;
      self.scene.add(t.beam);
    }
    const a = { x: t.x, y: 3.4, z: t.z }, b = target.group.position;
    const dx = b.x - a.x, dy = (b.y + 2.4) - a.y, dz = b.z - a.z;
    const len = Math.hypot(dx, dy, dz);
    t.beam.visible = true;
    t.beam.position.set(a.x + dx / 2, a.y + dy / 2, a.z + dz / 2);
    t.beam.scale.set(0.5 + mult * 0.25, len, 0.5 + mult * 0.25);
    t.beam.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(dx, dy, dz).normalize());
  }
  function hideBeam(t) { if (t.beam) t.beam.visible = false; }

  B.updateFx = function (dt) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.life -= dt;
      const k = TD.clamp(f.life / f.max, 0, 1);
      f.fn(f.mesh, k, dt);
      if (f.life <= 0) { this.scene.remove(f.mesh); disposeMesh(f.mesh); this.fx.splice(i, 1); }
    }
  };

  /* ---------------------------- tower anims -------------------------- */
  function idleAnim(t, time) {
    const h = t.group.userData.human;
    if (h && !t.def.model.weapon && !t.def.model.weaponByLevel) h.anim(time * 0.5, 0.12, { speed: 3 });
    const st = t.group.userData.struct;
    if (st) {
      if (st.userData.orb) st.userData.orb.position.y += Math.sin(time * 2) * 0.004;
      if (st.userData.fire) st.userData.fire.scale.set(1 + Math.sin(time * 9) * 0.12, 1 + Math.sin(time * 7) * 0.18, 1);
      if (st.userData.plane) st.userData.plane.userData.prop.rotation.z += 0.3;
      if (st.userData.mech) st.userData.mech.anim(time * 0.4, 0.15, { speed: 3 });
    }
  }
  function aimAnim(t, time) {
    t.group.rotation.y = t.aim;
    const st = t.group.userData.struct;
    if (st && st.userData.head) st.userData.head.rotation.y = 0;
    if (st && st.userData.barrel) st.userData.barrel.rotation.x = -0.72;
    const w = t.group.userData.weapon;
    if (w && w.userData.spin) w.userData.spin.rotation.z += 0.6;
    if (t.fireAnim > 0 && t.group.userData.human) {
      t.group.userData.human.torso.position.z = -t.fireAnim * 0.18;
    } else if (t.group.userData.human) t.group.userData.human.torso.position.z = 0;
  }
  function jamFlash(t, on) {
    if (t._jammed === on) return;
    t._jammed = on;
    t.group.traverse(o => { if (o.isMesh) o.visible = on ? (Math.random() > 0.35) : true; });
    if (!on) t.group.traverse(o => { if (o.isMesh) o.visible = true; });
  }

  /* ---------------------------- ghost / hover ------------------------ */
  B.updateGhost = function () {
    if (this.placing && this.hoverPoint) {
      const gx = Math.round(this.hoverPoint.x / GRID) * GRID;
      const gz = Math.round(this.hoverPoint.z / GRID) * GRID;
      this.placing.x = gx; this.placing.z = gz;
      this.placing.ok = this.validSpot(this.placing.def, gx, gz) && this.cash >= this.placing.def.lv[0].c;
      this.ghost.position.set(gx, 0, gz);
      const col = this.placing.ok ? 0x51d88a : 0xff5d6c;
      this.ghost.traverse(o => { if (o.isMesh) o.material.color.setHex(col); });
      const r = this.placing.def.lv[0].r || 6;
      this.showRange(gx, gz, r, col);
    } else if (this.selected) {
      const t = this.selected;
      this.showRange(t.x, t.z, t.stats.range * (1 + t.buff.range), 0x6ee7ff);
    }
  };
  B.showRange = function (x, z, r, color) {
    this.rangeRing.position.set(x, 0.4, z);
    this.rangeRing.scale.setScalar(r / 10);
    this.rangeRing.material = TD.mat(color, { transparent: true, opacity: 0.6 });
    this.rangeDisc.position.set(x, 0.05, z);
    this.rangeDisc.scale.setScalar(r);
    this.rangeDisc.material = TD.mat(color, { transparent: true, opacity: 0.1 });
  };

  /* ------------------------------ abilities -------------------------- */
  B.useAbility = function (t) {
    const ab = t.def.ability;
    if (!ab || t.level < ab.level || t.abilityCd > 0) { TD.Audio.error(); return; }
    t.abilityCd = ab.cd;
    TD.Audio.ability();
    switch (ab.id) {
      case 'rally':
        this.globalBuff = { rate: 0.6, dmg: 0.2, until: 10 };
        TD.toast('Rally! All towers fire faster', 'good');
        spawnRipple(this, t.x, t.z, 0xffc63d, 30);
        break;
      case 'airstrike': {
        // bomb the busiest stretch of path
        let bx = 0, bz = 0, n = 0;
        this.enemies.forEach(e => { bx += e.group.position.x; bz += e.group.position.z; n++; });
        if (!n) { const p = TD.pathPoint(this.map.pathData[0], this.map.pathData[0].total * 0.5); bx = p.x; bz = p.z; n = 1; }
        bx /= n; bz /= n;
        for (let i = 0; i < 8; i++) {
          setTimeout(() => {
            if (!this.active) return;
            const x = bx + TD.rand(-9, 9), z = bz + TD.rand(-9, 9);
            spawnBlast(this, x, z, 9, 0xff8b3a);
            this.splashDamage(t, x, z, 9, t.stats.dmg * 9, { source: t, status: { burn: { dps: t.stats.dmg, dur: 3 } } });
            TD.Audio.boom();
          }, i * 130);
        }
        TD.toast('Airstrike inbound!', 'good');
        break;
      }
      case 'triage':
        this.hp = Math.min(this.maxHp, this.hp + 15);
        TD.toast('+15 base HP', 'good');
        spawnRipple(this, this.map.base[0], this.map.base[1], 0x51d88a, 10);
        break;
    }
    TD.UI.showTower(t);
  };

  /* ------------------------------- input ----------------------------- */
  B.bindInput = function (dom) {
    const self = this;
    let rotating = false, panning = false, lx = 0, ly = 0, downX = 0, downY = 0, downBtn = -1;

    function ndc(e) {
      const r = dom.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 };
    }
    function ground(e) {
      const n = ndc(e);
      ray.setFromCamera(n, self.camera);
      const hit = new T.Vector3();
      return ray.ray.intersectPlane(groundPlane, hit) ? hit : null;
    }
    B.groundAt = ground;

    dom.addEventListener('contextmenu', e => e.preventDefault());
    dom.addEventListener('pointerdown', e => {
      if (!self.active) return;
      downX = e.clientX; downY = e.clientY; downBtn = e.button;
      lx = e.clientX; ly = e.clientY;
      if (e.button === 2) rotating = true;
      if (e.button === 1) { panning = true; self.setFollow(false); e.preventDefault(); }
      dom.setPointerCapture(e.pointerId);
    });
    dom.addEventListener('pointermove', e => {
      if (!self.active) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      if (rotating) {
        const s = 0.006 * (TD.Save.data.settings.sens || 1);
        self.cam.yaw -= dx * s;
        self.cam.pitch = TD.clamp(self.cam.pitch + dy * s, 0.22, 1.42);
      } else if (panning) {
        const sp = 0.09 * (self.cam.dist / 80);
        const cos = Math.cos(self.cam.yaw), sin = Math.sin(self.cam.yaw);
        self.cam.tx += (dx * cos + dy * sin) * sp;
        self.cam.tz += (-dx * sin + dy * cos) * sp;
        self.cam.tx = TD.clamp(self.cam.tx, -90, 90); self.cam.tz = TD.clamp(self.cam.tz, -90, 90);
      }
      const g = ground(e);
      if (g) self.hoverPoint = g;
    });
    function up(e) {
      if (!self.active) return;
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (downBtn === 0 && moved < 6) self.click(e);
      rotating = false; panning = false; downBtn = -1;
    }
    dom.addEventListener('pointerup', up);
    dom.addEventListener('pointercancel', () => { rotating = panning = false; });
    dom.addEventListener('wheel', e => {
      if (!self.active) return;
      const c = self.cam;
      c.wantDist = TD.clamp((c.wantDist == null ? c.dist : c.wantDist) + Math.sign(e.deltaY) * 6, 22, 150);
      if (!self.camFollow) c.freeDist = c.wantDist;
    }, { passive: true });

    window.addEventListener('keydown', e => {
      if (!self.active) return;
      const k = e.key.toLowerCase();
      self.keys[k] = true;
      if (k === 'escape') { if (self.placing) self.cancelPlace(); else self.select(null); }
      if (k >= '1' && k <= '5') {
        const id = self.loadout[parseInt(k, 10) - 1];
        if (id) self.beginPlace(id);
      }
      if (k === 'q' && self.selected) self.upgrade(self.selected);
      if (k === 'x' && self.selected) self.sell(self.selected);
      if (k === 't' && self.selected) { self.selected.mode = (self.selected.mode + 1) % 5; TD.UI.showTower(self.selected); }
      if (k === 'f' && self.selected) self.useAbility(self.selected);
      if (k === ' ') e.preventDefault();               // jump; handled in updatePlayer
      if (k === 'enter') { if (self.phase === 'prep' && self.wave < self.diff.waves) self.startWave(true); }
      if (k === 'c') TD.UI.toggleFollow();
      if (k === 'p') TD.UI.togglePause();
    });
    window.addEventListener('keyup', e => { self.keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { self.keys = {}; });
  };

  B.click = function (e) {
    const g = B.groundAt(e);
    if (!g) return;
    if (this.placing) {
      const gx = Math.round(g.x / GRID) * GRID, gz = Math.round(g.z / GRID) * GRID;
      this.placeAt(gx, gz);
      return;
    }
    /* pick a tower */
    let best = null, bd = 3.2;
    this.towers.forEach(t => {
      const d = TD.dist(g.x, g.z, t.x, t.z);
      if (d < bd) { bd = d; best = t; }
    });
    this.select(best);
    if (best) TD.Audio.ui();
  };

  /* ====================================================================
     FLOATING DAMAGE NUMBERS (DOM overlay, pooled)
     ==================================================================== */
  TD.DamageText = (function () {
    const pool = [], active = [];
    let host = null;
    function ensure() {
      if (host) return;
      host = document.createElement('div');
      host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9;overflow:hidden';
      document.body.appendChild(host);
    }
    function push(pos, value, color) {
      ensure();
      if (active.length > 26) return;
      const el = pool.pop() || (() => {
        const d = document.createElement('div');
        d.style.cssText = 'position:absolute;font:700 14px "Trebuchet MS",sans-serif;text-shadow:0 2px 4px #000;transform:translate(-50%,-50%);will-change:transform,opacity';
        return d;
      })();
      el.textContent = value >= 1000 ? TD.fmt(value) : value;
      el.style.color = color;
      el.style.opacity = '1';
      host.appendChild(el);
      active.push({ el: el, x: pos.x, y: pos.y + 5, z: pos.z, life: 0.85, vy: 5 });
    }
    function update(dt, camera) {
      if (!host) return;
      const w = window.innerWidth, h = window.innerHeight;
      for (let i = active.length - 1; i >= 0; i--) {
        const a = active[i];
        a.life -= dt; a.y += a.vy * dt; a.vy -= 6 * dt;
        if (a.life <= 0) { host.removeChild(a.el); pool.push(a.el); active.splice(i, 1); continue; }
        tmpV.set(a.x, a.y, a.z).project(camera);
        if (tmpV.z > 1) { a.el.style.opacity = '0'; continue; }
        a.el.style.left = ((tmpV.x * 0.5 + 0.5) * w) + 'px';
        a.el.style.top = ((-tmpV.y * 0.5 + 0.5) * h) + 'px';
        a.el.style.opacity = String(TD.clamp(a.life / 0.4, 0, 1));
      }
    }
    function clear() {
      while (active.length) { const a = active.pop(); if (host) host.removeChild(a.el); pool.push(a.el); }
    }
    return { push: push, update: update, clear: clear };
  })();

})();
