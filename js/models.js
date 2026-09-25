/* =========================================================================
   models.js — procedural blocky models (characters, towers, enemies, props)
   Everything is built from primitives so the game needs zero art assets.
   ========================================================================= */
(function () {
  const T = THREE;
  const matCache = new Map();

  /* Shared, cached Lambert material. */
  const mat = TD.mat = function (color, opts) {
    opts = opts || {};
    const key = color + '|' + (opts.transparent ? 't' + opts.opacity : '') + (opts.emissive || '') + (opts.flat ? 'f' : '');
    if (matCache.has(key)) return matCache.get(key);
    const m = new T.MeshLambertMaterial({
      color: color,
      transparent: !!opts.transparent,
      opacity: opts.opacity != null ? opts.opacity : 1,
      emissive: opts.emissive != null ? opts.emissive : 0x000000,
      emissiveIntensity: opts.emissiveIntensity != null ? opts.emissiveIntensity : 1,
      side: opts.side || T.FrontSide,
      depthWrite: opts.transparent ? false : true
    });
    matCache.set(key, m);
    return m;
  };

  const GEOM = { box: new T.BoxGeometry(1, 1, 1) };
  GEOM.box.__shared = true;
  /* Cached geometries are reused everywhere, so effect cleanup must never
     dispose them. remember(): tag + store in one step. */
  function remember(key, geo) { geo.__shared = true; GEOM[key] = geo; return geo; }
  function cyl(rt, rb, h, seg) {
    const k = 'c' + rt + '_' + rb + '_' + h + '_' + (seg || 10);
    if (!GEOM[k]) remember(k, new T.CylinderGeometry(rt, rb, h, seg || 10));
    return GEOM[k];
  }
  function sph(r, seg) {
    const k = 's' + r + '_' + (seg || 10);
    if (!GEOM[k]) remember(k, new T.SphereGeometry(r, seg || 10, (seg || 10) >> 1));
    return GEOM[k];
  }
  function cone(r, h, seg) {
    const k = 'k' + r + '_' + h + '_' + (seg || 8);
    if (!GEOM[k]) remember(k, new T.ConeGeometry(r, h, seg || 8));
    return GEOM[k];
  }
  function torus(r, tube, seg) {
    const k = 't' + r + '_' + tube + '_' + (seg || 16);
    if (!GEOM[k]) remember(k, new T.TorusGeometry(r, tube, 8, seg || 16));
    return GEOM[k];
  }

  /* box(width,height,depth,color,x,y,z) -> Mesh */
  const box = TD.box = function (w, h, d, color, x, y, z, opts) {
    const m = new T.Mesh(GEOM.box, mat(color, opts));
    m.scale.set(w, h, d);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  };
  const cylinder = TD.cyl = function (rt, rb, h, color, x, y, z, seg) {
    const m = new T.Mesh(cyl(rt, rb, h, seg), mat(color));
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  };
  const sphere = TD.sphere = function (r, color, x, y, z, seg) {
    const m = new T.Mesh(sph(r, seg), mat(color));
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  };
  const coneM = TD.cone = function (r, h, color, x, y, z, seg) {
    const m = new T.Mesh(cone(r, h, seg), mat(color));
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  };
  TD.ring = function (r, tube, color, opacity) {
    const m = new T.Mesh(torus(r, tube, 40), mat(color, { transparent: opacity != null, opacity: opacity }));
    m.rotation.x = -Math.PI / 2;
    return m;
  };

  /* ======================================================================
     HUMANOID — the blocky figure used for the player, towers and enemies
     ====================================================================== */
  TD.makeHumanoid = function (o) {
    o = Object.assign({
      skin: 0xe0ac69, shirt: 0x3d7bdd, pants: 0x27304d, shoes: 0x1a1f30,
      scale: 1, hair: null, hat: null, face: true, slim: false
    }, o || {});

    const g = new T.Group();
    const armW = o.slim ? 0.72 : 0.9;

    // legs (pivot at hip so they can swing). `minimal` drops the shoe mesh —
    // with dozens of units on screen every saved draw call counts.
    const legs = [];
    for (let i = 0; i < 2; i++) {
      const p = new T.Group();
      p.position.set(i ? 0.52 : -0.52, 2.0, 0);
      p.add(box(0.92, 2.0, 0.92, o.pants, 0, -1.0, 0));
      if (!o.minimal) p.add(box(0.98, 0.34, 1.06, o.shoes, 0, -1.9, 0.06));
      g.add(p); legs.push(p);
    }
    // torso
    const torso = new T.Group(); torso.position.y = 2.0;
    const chest = box(2.0, 2.0, 1.0, o.shirt, 0, 1.0, 0);
    torso.add(chest);
    if (o.belt) torso.add(box(2.06, 0.3, 1.06, o.belt, 0, 0.18, 0));
    g.add(torso);

    // arms (pivot at shoulder)
    const arms = [];
    for (let i = 0; i < 2; i++) {
      const p = new T.Group();
      // torso-local: the shoulder sits just below the top of the chest
      p.position.set(i ? 1.0 + armW / 2 : -(1.0 + armW / 2), 1.9, 0);
      if (o.minimal) {
        p.add(box(armW, 2.0, armW, o.sleeve != null ? o.sleeve : o.shirt, 0, -1.0, 0));
      } else {
        p.add(box(armW, 1.25, armW, o.sleeve != null ? o.sleeve : o.shirt, 0, -0.62, 0));
        p.add(box(armW, 0.78, armW, o.skin, 0, -1.63, 0));
      }
      torso.add(p); arms.push(p);
    }
    // head
    // torso-local too: arms and head ride the torso's walk bob
    const head = new T.Group(); head.position.y = 2.05;
    const skull = box(1.28, 1.28, 1.28, o.skin, 0, 0.64, 0);
    head.add(skull);
    if (o.face) {
      head.add(box(0.2, 0.22, 0.06, 0x14161f, -0.3, 0.78, 0.66));
      head.add(box(0.2, 0.22, 0.06, 0x14161f, 0.3, 0.78, 0.66));
      head.add(box(0.5, 0.08, 0.06, 0x14161f, 0, 0.42, 0.66));
    }
    if (o.hair) head.add(box(1.36, 0.36, 1.36, o.hair, 0, 1.26, 0));
    if (o.hat) head.add(TD.makeHat(o.hat, o.hatColor || 0x222838, o.hatColor2));
    torso.add(head);

    g.scale.setScalar(o.scale);

    const api = {
      group: g, torso: torso, head: head, arms: arms, legs: legs,
      rightArm: arms[1], leftArm: arms[0],
      /* walk cycle. move 0..1 blends between idle and walking */
      anim: function (t, move, opts) {
        opts = opts || {};
        const sw = Math.sin(t * (opts.speed || 8));
        const m = move == null ? 1 : move;
        legs[0].rotation.x = sw * 0.62 * m;
        legs[1].rotation.x = -sw * 0.62 * m;
        if (!opts.freezeArms) {
          arms[0].rotation.x = -sw * 0.5 * m + (opts.armBase || 0);
          arms[1].rotation.x = sw * 0.5 * m + (opts.armBase || 0);
          arms[0].rotation.z = 0.06 + (1 - m) * 0.04;
          arms[1].rotation.z = -0.06 - (1 - m) * 0.04;
        }
        torso.position.y = 2.0 + Math.abs(sw) * 0.10 * m;
        head.rotation.z = sw * 0.035 * m;
      },
      /* both arms forward, holding a weapon */
      aimPose: function (twoHanded, lift) {
        const a = lift == null ? -1.45 : lift;
        arms[1].rotation.x = a; arms[1].rotation.z = -0.18;
        if (twoHanded) { arms[0].rotation.x = a; arms[0].rotation.z = 0.34; }
      }
    };
    return api;
  };

  TD.makeHat = function (kind, c1, c2) {
    const h = new T.Group();
    h.position.y = 1.3;
    switch (kind) {
      case 'cap': h.add(box(1.36, 0.42, 1.36, c1, 0, 0.1, 0)); h.add(box(1.2, 0.12, 0.7, c1, 0, -0.06, 0.9)); break;
      case 'helmet': h.add(box(1.44, 0.6, 1.44, c1, 0, 0.16, 0)); h.add(box(1.5, 0.14, 1.5, c2 || c1, 0, -0.14, 0)); break;
      case 'beret': h.add(cylinder(0.78, 0.7, 0.3, c1, 0, 0.12, -0.08, 8)); break;
      case 'cowboy': h.add(cylinder(0.56, 0.62, 0.62, c1, 0, 0.3, 0, 10)); h.add(cylinder(1.25, 1.25, 0.1, c1, 0, 0.02, 0, 12)); break;
      case 'top': h.add(cylinder(0.6, 0.6, 1.2, c1, 0, 0.62, 0, 10)); h.add(cylinder(1.15, 1.15, 0.1, c1, 0, 0.04, 0, 12)); break;
      case 'hood': h.add(box(1.5, 1.1, 1.5, c1, 0, -0.25, -0.06)); h.add(box(1.1, 0.5, 0.3, c1, 0, -0.4, 0.72)); break;
      case 'crown': {
        h.add(cylinder(0.78, 0.78, 0.34, c1, 0, 0.14, 0, 10));
        for (let i = 0; i < 5; i++) {
          const a = i / 5 * Math.PI * 2;
          h.add(coneM(0.16, 0.44, c1, Math.cos(a) * 0.66, 0.5, Math.sin(a) * 0.66, 6));
        }
        h.add(sphere(0.16, c2 || 0xff4d6d, 0, 0.42, 0.74, 8));
        break;
      }
      case 'horns': {
        const a = coneM(0.2, 0.8, c1, -0.6, 0.3, 0, 6); a.rotation.z = 0.55; h.add(a);
        const b = coneM(0.2, 0.8, c1, 0.6, 0.3, 0, 6); b.rotation.z = -0.55; h.add(b);
        break;
      }
      case 'visor': h.add(box(1.4, 0.36, 1.42, c1, 0, -0.35, 0)); h.add(box(1.44, 0.3, 0.1, c2 || 0x6ee7ff, 0, -0.35, 0.7)); break;
      case 'mask': h.add(box(1.34, 0.9, 1.34, c1, 0, -0.66, 0)); h.add(box(0.5, 0.4, 0.2, c2 || 0x86ffd0, 0, -0.8, 0.68)); break;
      case 'santa': h.add(coneM(0.72, 1.3, c1, 0, 0.62, -0.1, 8)); h.add(cylinder(0.8, 0.8, 0.26, 0xf2f4ff, 0, 0.06, 0, 10)); h.add(sphere(0.22, 0xf2f4ff, 0, 1.2, -0.45, 8)); break;
      case 'halo': { const r = TD.ring(0.66, 0.08, c1); r.position.y = 0.9; h.add(r); break; }
      case 'antenna': h.add(cylinder(0.05, 0.05, 1.0, c1, 0.3, 0.5, 0, 6)); h.add(sphere(0.14, c2 || 0xff4d6d, 0.3, 1.02, 0, 6)); break;
      default: h.add(box(1.34, 0.4, 1.34, c1, 0, 0.1, 0));
    }
    return h;
  };

  /* ----------------------------------------------------------------------
     A flat plane carrying rendered text — used for kiosk signs and nametags.
     ---------------------------------------------------------------------- */
  const textCache = new Map();
  TD.textPlane = function (text, opts) {
    opts = opts || {};
    const key = text + '|' + JSON.stringify(opts);
    let tex = textCache.get(key);
    if (!tex) {
      const pad = 24, fs = opts.size || 72;
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      ctx.font = '800 ' + fs + 'px "Trebuchet MS", sans-serif';
      const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
      c.width = Math.max(64, w); c.height = fs + pad * 2;
      const g = c.getContext('2d');
      if (opts.bg != null) {
        g.fillStyle = opts.bg;
        const r = 24;
        g.beginPath();
        g.moveTo(r, 0); g.arcTo(c.width, 0, c.width, c.height, r);
        g.arcTo(c.width, c.height, 0, c.height, r); g.arcTo(0, c.height, 0, 0, r);
        g.arcTo(0, 0, c.width, 0, r); g.fill();
      }
      g.font = '800 ' + fs + 'px "Trebuchet MS", sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 8; g.strokeStyle = opts.outline || '#0b1020';
      g.strokeText(text, c.width / 2, c.height / 2);
      g.fillStyle = opts.color || '#ffffff';
      g.fillText(text, c.width / 2, c.height / 2);
      tex = new T.CanvasTexture(c);
      tex.__aspect = c.width / c.height;
      textCache.set(key, tex);
    }
    const h = opts.height || 1.4;
    const m = new T.Mesh(new T.PlaneGeometry(h * tex.__aspect, h),
      new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: T.DoubleSide }));
    m.castShadow = false; m.receiveShadow = false;
    m.userData.isText = true;
    return m;
  };

  /* Orient a mesh to face the camera, accounting for any rotated parent. */
  const _q = new T.Quaternion();
  TD.billboard = function (mesh, camera) {
    if (mesh.parent) { mesh.parent.getWorldQuaternion(_q); mesh.quaternion.copy(_q.invert()).multiply(camera.quaternion); }
    else mesh.quaternion.copy(camera.quaternion);
  };

  /* Flat wings for flying enemies. */
  TD.makeWings = function (color, span) {
    const g = new T.Group();
    span = span || 2.2;
    for (let i = 0; i < 2; i++) {
      const w = new T.Group();
      w.position.set(i ? 1.0 : -1.0, 3.2, -0.4);
      const blade = box(span, 0.12, 1.3, color, i ? span / 2 : -span / 2, 0, -0.3, { transparent: true, opacity: 0.85 });
      w.add(blade);
      g.add(w);
      g.userData['w' + i] = w;
    }
    g.userData.flap = function (t) {
      g.userData.w0.rotation.z = Math.sin(t * 9) * 0.45;
      g.userData.w1.rotation.z = -Math.sin(t * 9) * 0.45;
    };
    return g;
  };

  /* ======================================================================
     WEAPONS — attached to a humanoid's right hand
     ====================================================================== */
  const WEAPONS = TD.WEAPONS = {
    none: () => new T.Group(),
    pistol: c => { const g = new T.Group(); g.add(box(0.22, 0.24, 0.9, c, 0, 0, 0.35)); g.add(box(0.2, 0.42, 0.24, c, 0, -0.28, 0)); return g; },
    rifle: c => { const g = new T.Group(); g.add(box(0.24, 0.26, 2.0, c, 0, 0, 0.85)); g.add(box(0.2, 0.44, 0.3, c, 0, -0.3, 0.1)); g.add(box(0.26, 0.2, 0.5, 0x2a2f42, 0, 0.16, 0.3)); return g; },
    smg: c => { const g = new T.Group(); g.add(box(0.26, 0.3, 1.2, c, 0, 0, 0.5)); g.add(box(0.18, 0.6, 0.22, 0x23283a, 0, -0.42, 0.28)); return g; },
    sniper: c => { const g = new T.Group(); g.add(box(0.2, 0.22, 2.9, c, 0, 0, 1.3)); g.add(box(0.16, 0.2, 0.7, 0x141824, 0, 0.26, 0.9)); g.add(box(0.5, 0.1, 0.5, 0x141824, 0, -0.2, 0.2)); return g; },
    shotgun: c => { const g = new T.Group(); g.add(box(0.36, 0.3, 1.7, c, 0, 0, 0.75)); g.add(box(0.42, 0.34, 0.5, 0x3a2418, 0, -0.06, -0.15)); return g; },
    minigun: c => {
      const g = new T.Group();
      g.add(box(0.6, 0.6, 0.8, 0x2a3048, 0, 0, 0.25));
      const b = new T.Group(); b.position.z = 0.7;
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2;
        const barrel = cylinder(0.08, 0.08, 1.7, c, Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0.85, 6);
        barrel.rotation.x = Math.PI / 2;
        b.add(barrel);
      }
      g.add(b); g.userData.spin = b;
      return g;
    },
    rocket: c => { const g = new T.Group(); g.add(cylinder(0.24, 0.24, 2.2, c, 0, 0, 0.8, 10)); g.children[0].rotation.x = Math.PI / 2; g.add(coneM(0.3, 0.6, 0xff6b4a, 0, 0, 1.9, 8)); g.children[1].rotation.x = Math.PI / 2; return g; },
    launcher: c => { const g = new T.Group(); const t = cylinder(0.3, 0.3, 2.4, c, 0, 0.1, 0.9, 10); t.rotation.x = Math.PI / 2; g.add(t); g.add(box(0.2, 0.34, 0.3, 0x23283a, 0, -0.22, 0.2)); return g; },
    flamer: c => { const g = new T.Group(); g.add(cylinder(0.18, 0.22, 1.7, c, 0, 0, 0.7, 8)); g.children[0].rotation.x = Math.PI / 2; g.add(cylinder(0.3, 0.2, 0.5, 0xff7b3a, 0, 0, 1.6, 8)); g.children[1].rotation.x = Math.PI / 2; g.add(cylinder(0.26, 0.26, 1.0, 0xc8402a, -0.45, 0.4, -0.5, 8)); return g; },
    icegun: c => { const g = new T.Group(); g.add(box(0.34, 0.36, 1.5, c, 0, 0, 0.6)); g.add(sphere(0.3, 0x9ff0ff, 0, 0.06, 1.35, 8)); g.add(cylinder(0.2, 0.2, 0.8, 0x7fd8ff, -0.4, 0.34, -0.3, 8)); return g; },
    tesla: c => { const g = new T.Group(); g.add(cylinder(0.2, 0.26, 1.2, c, 0, 0, 0.5, 8)); g.children[0].rotation.x = Math.PI / 2; g.add(sphere(0.34, 0x8fe3ff, 0, 0, 1.25, 8)); g.add(TD.ring(0.42, 0.05, 0x6ee7ff)); g.children[2].position.z = 1.25; g.children[2].rotation.x = 0; return g; },
    bow: c => { const g = new T.Group(); const b = new T.Mesh(torus(0.85, 0.08, 18), mat(c)); b.rotation.y = Math.PI / 2; g.add(b); g.add(box(0.04, 1.6, 0.04, 0xe8ecf8, 0, 0, 0.2)); return g; },
    staff: c => { const g = new T.Group(); g.add(cylinder(0.09, 0.09, 3.0, 0x6b4a2a, 0, 0.6, 0, 8)); g.add(sphere(0.34, c, 0, 2.1, 0, 10)); return g; },
    sword: c => { const g = new T.Group(); g.add(box(0.16, 2.4, 0.42, c, 0, 1.1, 0)); g.add(box(0.2, 0.22, 1.0, 0x8a6a2a, 0, -0.12, 0)); g.add(box(0.2, 0.7, 0.2, 0x3a2a1a, 0, -0.5, 0)); return g; },
    scythe: c => { const g = new T.Group(); g.add(cylinder(0.09, 0.09, 3.4, 0x30241a, 0, 0.9, 0, 8)); const bl = box(0.1, 0.3, 2.0, c, 0, 2.5, 0.9); bl.rotation.x = 0.5; g.add(bl); return g; },
    hammer: c => { const g = new T.Group(); g.add(cylinder(0.12, 0.12, 2.6, 0x4a3524, 0, 0.6, 0, 8)); g.add(box(0.9, 0.9, 1.5, c, 0, 2.0, 0)); return g; },
    axe: c => { const g = new T.Group(); g.add(cylinder(0.1, 0.1, 2.4, 0x4a3524, 0, 0.5, 0, 8)); g.add(box(0.12, 1.0, 0.9, c, 0, 1.6, 0.5)); return g; },
    fist: c => { const g = new T.Group(); g.add(box(0.85, 0.7, 0.9, c, 0, -0.1, 0.25)); return g; },
    wrench: c => { const g = new T.Group(); g.add(box(0.16, 1.5, 0.2, c, 0, 0.5, 0)); g.add(box(0.5, 0.4, 0.22, c, 0, 1.3, 0)); return g; },
    syringe: c => { const g = new T.Group(); g.add(cylinder(0.16, 0.16, 1.1, 0xdff4ff, 0, 0, 0.4, 8)); g.children[0].rotation.x = Math.PI / 2; g.add(cylinder(0.03, 0.03, 0.7, c, 0, 0, 1.2, 6)); g.children[1].rotation.x = Math.PI / 2; return g; },
    boombox: c => { const g = new T.Group(); g.add(box(2.0, 1.1, 0.7, c, 0, -0.2, 0.2)); g.add(cylinder(0.3, 0.3, 0.12, 0x1a1e2c, -0.55, -0.2, 0.58, 10)); g.children[1].rotation.x = Math.PI / 2; g.add(cylinder(0.3, 0.3, 0.12, 0x1a1e2c, 0.55, -0.2, 0.58, 10)); g.children[2].rotation.x = Math.PI / 2; return g; },
    flag: c => { const g = new T.Group(); g.add(cylinder(0.07, 0.07, 3.2, 0xcfd6ea, 0, 0.8, 0, 6)); g.add(box(0.06, 0.9, 1.3, c, 0, 1.9, 0.68)); return g; },
    cannon: c => { const g = new T.Group(); const t = cylinder(0.42, 0.5, 2.6, c, 0, 0.2, 1.0, 12); t.rotation.x = Math.PI / 2; g.add(t); g.add(TD.ring(0.55, 0.09, 0xffc63d)); g.children[1].position.set(0, 0.2, 2.2); g.children[1].rotation.x = 0; return g; },
    firework: c => { const g = new T.Group(); for (let i = 0; i < 3; i++) { const t = cylinder(0.16, 0.16, 1.4, c, (i - 1) * 0.36, 0, 0.5, 8); t.rotation.x = Math.PI / 2; g.add(t); } return g; },
    dual: c => { const g = new T.Group(); g.add(box(0.2, 0.22, 0.85, c, -0.3, 0, 0.3)); g.add(box(0.2, 0.22, 0.85, c, 0.3, 0, 0.3)); return g; }
  };

  /* ======================================================================
     TOWER MODELS
     def.model = { kind, ... }   kind: 'humanoid' | structure name
     ====================================================================== */
  function plate(color, r, h) {
    const g = new T.Group();
    const base = cylinder(r, r * 1.06, h || 0.36, color, 0, (h || 0.36) / 2, 0, 8);
    g.add(base);
    const top = cylinder(r * 0.86, r * 0.86, 0.1, 0x2b3350, 0, (h || 0.36) + 0.02, 0, 8);
    g.add(top);
    return g;
  }

  const STRUCTURES = {
    farm: (m) => {
      const g = new T.Group();
      g.add(box(3.4, 2.2, 2.6, m.c1 || 0xc0473a, 0, 1.1, 0));
      const roof = coneM(2.5, 1.5, m.c2 || 0x8a2f26, 0, 2.9, 0, 4); roof.rotation.y = Math.PI / 4; g.add(roof);
      g.add(box(0.9, 1.4, 0.1, 0x6b4a2a, 0, 0.7, 1.32));
      g.add(cylinder(0.7, 0.7, 3.2, m.c3 || 0xd8d3c0, 2.4, 1.6, -0.4, 10));
      g.add(coneM(0.85, 0.8, 0x8a2f26, 2.4, 3.6, -0.4, 10));
      g.add(box(0.2, 1.8, 0.2, 0x8a6a3a, -2.2, 0.9, 1.0));
      return g;
    },
    barracks: (m) => {
      const g = new T.Group();
      g.add(box(4.0, 1.6, 3.0, m.c1 || 0x4a5a3a, 0, 0.8, 0));
      const roof = box(4.3, 0.5, 3.3, m.c2 || 0x35422a, 0, 1.8, 0); g.add(roof);
      g.add(box(1.2, 1.5, 0.2, 0x2a3320, 0, 0.75, 1.55));
      for (let i = 0; i < 3; i++) g.add(box(0.5, 0.6, 0.1, 0x8fd8ff, -1.4 + i * 1.4, 1.1, 1.53));
      g.add(cylinder(0.08, 0.08, 3.0, 0xcfd6ea, 1.8, 2.4, -1.2, 6));
      g.add(box(0.06, 0.8, 1.2, m.c3 || 0x4f8cff, 1.8, 3.4, -0.6));
      return g;
    },
    bunker: (m) => {
      const g = new T.Group();
      g.add(cylinder(2.1, 2.4, 1.6, m.c1 || 0x5a6274, 0, 0.8, 0, 8));
      g.add(cylinder(1.5, 1.7, 0.7, m.c2 || 0x434a5c, 0, 1.9, 0, 8));
      g.add(box(0.5, 0.4, 2.0, 0x2a3040, 0, 1.9, 1.2));
      return g;
    },
    mortar: (m) => {
      const g = new T.Group();
      g.add(box(3.0, 0.5, 3.0, m.c1 || 0x4a5240, 0, 0.25, 0));
      for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; g.add(box(0.26, 1.6, 0.26, 0x3a4030, Math.cos(a) * 1.0, 0.8, Math.sin(a) * 1.0)); }
      const tube = cylinder(0.46, 0.55, 3.2, m.c2 || 0x2f3648, 0, 2.0, -0.35, 12);
      tube.rotation.x = -0.72; g.add(tube); g.userData.barrel = tube;
      return g;
    },
    turret: (m) => {
      const g = new T.Group();
      g.add(cylinder(1.3, 1.5, 0.7, 0x3b4460, 0, 0.35, 0, 10));
      const head = new T.Group(); head.position.y = 1.2;
      head.add(box(1.7, 1.2, 1.9, m.c1 || 0x556080, 0, 0, 0));
      head.add(cylinder(0.2, 0.2, 2.2, m.c2 || 0x2b3350, -0.4, 0.1, 1.4, 8));
      head.children[1].rotation.x = Math.PI / 2;
      head.add(cylinder(0.2, 0.2, 2.2, m.c2 || 0x2b3350, 0.4, 0.1, 1.4, 8));
      head.children[2].rotation.x = Math.PI / 2;
      head.add(box(0.7, 0.5, 0.7, 0x8fd8ff, 0, 0.7, 0.2));
      g.add(head); g.userData.head = head;
      return g;
    },
    tesla: (m) => {
      const g = new T.Group();
      g.add(cylinder(1.2, 1.5, 1.0, 0x3b4460, 0, 0.5, 0, 10));
      g.add(cylinder(0.4, 0.5, 2.6, m.c1 || 0x8a7a5a, 0, 2.3, 0, 10));
      const coil = new T.Mesh(torus(0.9, 0.16, 20), mat(m.c2 || 0x6ee7ff, { emissive: 0x1a5f7a }));
      coil.rotation.x = -Math.PI / 2; coil.position.y = 3.7; g.add(coil);
      g.add(sphere(0.7, m.c2 || 0x9ff0ff, 0, 4.3, 0, 12));
      g.userData.orb = g.children[3];
      return g;
    },
    dish: (m) => {
      const g = new T.Group();
      g.add(cylinder(1.1, 1.4, 1.2, 0x3b4460, 0, 0.6, 0, 10));
      const arm = new T.Group(); arm.position.y = 1.6;
      const d = cylinder(1.6, 0.3, 0.5, m.c1 || 0xd8dcea, 0, 0.8, 0.5, 16);
      d.rotation.x = -1.0; arm.add(d);
      arm.add(cylinder(0.12, 0.12, 1.6, 0x8a93aa, 0, 0.9, 1.4, 6));
      arm.children[1].rotation.x = -1.0;
      arm.add(sphere(0.26, m.c2 || 0xff6b4a, 0, 1.2, 1.9, 8));
      g.add(arm); g.userData.head = arm;
      return g;
    },
    speaker: (m) => {
      const g = new T.Group();
      g.add(box(2.6, 0.4, 2.2, 0x2a3048, 0, 0.2, 0));
      for (let i = 0; i < 2; i++) {
        const s = box(1.1, 2.6, 1.1, m.c1 || 0x1f2436, i ? 0.75 : -0.75, 1.6, 0);
        g.add(s);
        for (let k = 0; k < 2; k++) {
          const cne = cylinder(0.38, 0.38, 0.1, m.c2 || 0x6ee7ff, i ? 0.75 : -0.75, 1.0 + k * 1.1, 0.58, 10);
          cne.rotation.x = Math.PI / 2; g.add(cne);
        }
      }
      g.add(box(1.4, 0.8, 0.9, 0x2f3650, 0, 2.6, 0.2));
      return g;
    },
    trap: (m) => {
      const g = new T.Group();
      g.add(cylinder(1.3, 1.3, 0.2, m.c1 || 0x6a5a3a, 0, 0.1, 0, 12));
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2;
        const t = coneM(0.14, 0.7, m.c2 || 0xb8c0d4, Math.cos(a) * 1.0, 0.45, Math.sin(a) * 1.0, 5);
        t.rotation.x = Math.cos(a) * 0.0; t.rotation.z = -Math.sin(a) * 0.5; g.add(t);
      }
      g.add(cylinder(0.8, 0.8, 0.12, 0x3a3020, 0, 0.22, 0, 12));
      return g;
    },
    hangar: (m) => {
      const g = new T.Group();
      g.add(box(4.4, 0.4, 4.4, 0x39405a, 0, 0.2, 0));
      g.add(box(3.0, 1.6, 2.2, m.c1 || 0x4a5568, -0.4, 1.0, -1.0));
      const plane = TD.makePlane(m.c2 || 0xdd4b3e, m.c3);
      plane.position.set(0.6, 1.4, 0.8); plane.scale.setScalar(0.5);
      g.add(plane); g.userData.plane = plane;
      const wind = cylinder(0.05, 0.05, 2.2, 0xcfd6ea, 2.0, 1.3, 1.8, 6); g.add(wind);
      g.add(coneM(0.3, 1.0, 0xff8b3a, 2.0, 2.3, 2.3, 6));
      return g;
    },
    mech: (m) => {
      const g = new T.Group();
      g.add(box(4.0, 0.5, 4.0, 0x2f3650, 0, 0.25, 0));
      g.add(box(0.4, 3.4, 0.4, 0x4a5368, -1.7, 1.9, -1.7));
      g.add(box(0.4, 3.4, 0.4, 0x4a5368, 1.7, 1.9, -1.7));
      g.add(box(3.8, 0.3, 0.4, 0x4a5368, 0, 3.5, -1.7));
      const mech = TD.makeHumanoid({ skin: m.c2 || 0x8a93aa, shirt: m.c1 || 0x556080, pants: 0x3b4460, shoes: 0x2a3048, hat: 'visor', hatColor: 0x3b4460, face: false, scale: 0.62 });
      mech.group.position.set(0, 0.45, 0.4);
      g.add(mech.group); g.userData.mech = mech;
      return g;
    },
    obelisk: (m) => {
      const g = new T.Group();
      g.add(cylinder(1.6, 1.9, 0.6, 0x2b3350, 0, 0.3, 0, 6));
      const shaft = cylinder(0.5, 1.0, 4.4, m.c1 || 0x3b2f66, 0, 2.6, 0, 6); g.add(shaft);
      const orb = sphere(0.7, m.c2 || 0xa678ff, 0, 5.4, 0, 12); g.add(orb);
      g.userData.orb = orb;
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * Math.PI * 2;
        g.add(box(0.3, 1.2, 0.3, m.c1 || 0x3b2f66, Math.cos(a) * 1.5, 0.9, Math.sin(a) * 1.5));
      }
      return g;
    },
    campfire: (m) => {
      const g = new T.Group();
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2;
        g.add(box(0.5, 0.35, 0.5, 0x6a6a72, Math.cos(a) * 1.5, 0.18, Math.sin(a) * 1.5));
      }
      for (let i = 0; i < 4; i++) {
        const l = cylinder(0.14, 0.14, 1.8, 0x5a4028, 0, 0.6, 0, 6);
        l.rotation.z = 0.5; l.rotation.y = i / 4 * Math.PI * 2; g.add(l);
      }
      const fire = coneM(0.7, 1.6, m.c1 || 0xff8b3a, 0, 1.2, 0, 8);
      g.add(fire); g.userData.fire = fire;
      const tent = coneM(1.9, 2.4, m.c2 || 0x2f6b4a, -3.2, 1.2, 0.6, 5); g.add(tent);
      return g;
    }
  };

  TD.makePlane = function (c1, c2) {
    const g = new T.Group();
    g.add(box(1.1, 0.9, 4.4, c1, 0, 0, 0));
    g.add(box(6.0, 0.22, 1.2, c2 || 0xd8dcea, 0, 0.2, 0.2));
    g.add(box(2.0, 0.2, 0.7, c2 || 0xd8dcea, 0, 0.4, -1.9));
    g.add(box(0.2, 1.0, 0.7, c1, 0, 0.8, -1.9));
    g.add(box(0.8, 0.55, 0.8, 0x8fd8ff, 0, 0.6, 0.5));
    const prop = box(0.15, 3.0, 0.15, 0x2a3048, 0, 0, 2.3);
    g.add(prop); g.userData.prop = prop;
    return g;
  };
  TD.makeChopper = function (c1) {
    const g = new T.Group();
    g.add(box(1.6, 1.4, 4.0, c1, 0, 0, 0));
    g.add(box(1.0, 0.9, 0.9, 0x8fd8ff, 0, 0.25, 2.1));
    g.add(box(0.4, 0.4, 2.6, c1, 0, 0.3, -3.0));
    g.add(box(0.15, 1.4, 0.5, c1, 0, 0.9, -4.0));
    const rot = new T.Group(); rot.position.y = 1.1;
    rot.add(box(8.0, 0.1, 0.4, 0x2a3048, 0, 0, 0));
    rot.add(box(0.4, 0.1, 8.0, 0x2a3048, 0, 0, 0));
    g.add(rot); g.userData.rotor = rot;
    g.add(box(0.2, 0.6, 2.4, 0x2a3048, -0.85, -1.0, 0));
    g.add(box(0.2, 0.6, 2.4, 0x2a3048, 0.85, -1.0, 0));
    return g;
  };

  /* Build a complete tower model for a definition at a given level. */
  TD.buildTower = function (def, level) {
    const m = def.model || {};
    const g = new T.Group();
    const lv = level || 0;
    const tint = m.tints && m.tints[Math.min(lv, m.tints.length - 1)];

    if (!m.noPlate) g.add(plate(m.plate || 0x3a4468, m.plateR || 1.7));

    if (m.kind === 'humanoid' || !m.kind) {
      const h = TD.makeHumanoid({
        skin: m.skin || 0xe0ac69,
        shirt: tint || m.shirt || 0x3d7bdd,
        sleeve: m.sleeve,
        pants: m.pants || 0x27304d,
        shoes: m.shoes || 0x1a1f30,
        belt: m.belt,
        hair: m.hair, hat: m.hat, hatColor: tint || m.hatColor, hatColor2: m.hatColor2,
        face: m.face !== false, scale: m.scale || 0.62
      });
      h.group.position.y = m.noPlate ? 0 : 0.42;
      g.add(h.group);
      const wk = (m.weaponByLevel && m.weaponByLevel[Math.min(lv, m.weaponByLevel.length - 1)]) || m.weapon;
      if (wk && WEAPONS[wk]) {
        const w = WEAPONS[wk](m.weaponColor || 0x2c3247);
        w.scale.setScalar(m.weaponScale || 1);
        h.rightArm.add(w);
        w.position.set(0, -1.6, 0.2);
        if (m.twoHanded !== false) h.aimPose(m.twoHanded !== false ? true : false, m.armLift);
        else h.aimPose(false, m.armLift);
        g.userData.weapon = w;
      } else {
        h.anim(0, 0);
      }
      // extra level-based gear
      if (lv >= 3 && m.pack) h.group.add(box(1.3, 1.5, 0.7, m.packColor || 0x3a4468, 0, 3.0, -0.85));
      g.userData.human = h;
    } else if (STRUCTURES[m.kind]) {
      const s = STRUCTURES[m.kind](m);
      s.position.y = m.noPlate ? 0 : 0.42;
      s.scale.setScalar(m.scale || 1);
      g.add(s);
      g.userData.struct = s;
    }

    // Level pips on the plate
    if (!m.noPlate) {
      for (let i = 0; i < lv; i++) {
        const a = -0.9 + i * 0.45;
        const pip = box(0.18, 0.1, 0.18, 0xffc63d, Math.sin(a) * 1.35, 0.48, Math.cos(a) * 1.35);
        g.add(pip);
      }
    }
    return g;
  };

  /* ======================================================================
     ENEMY MODELS
     ====================================================================== */
  TD.buildEnemy = function (def) {
    const m = def.model || {};
    const g = new T.Group();
    const h = TD.makeHumanoid({
      skin: m.skin || 0x9aa4bf,
      shirt: m.shirt || 0x556080,
      pants: m.pants || 0x333c55,
      shoes: m.shoes || 0x20263a,
      hat: m.hat, hatColor: m.hatColor || m.shirt, hatColor2: m.hatColor2,
      hair: m.hair, face: def.boss && m.face !== false,
      minimal: !def.boss,
      scale: 1
    });
    g.add(h.group);
    const api = { group: g, human: h, extras: [] };

    if (m.wings) { const w = TD.makeWings(m.wings, m.wingSpan); g.add(w); api.wings = w; }
    if (m.cape) {
      const c = box(2.1, 2.6, 0.16, m.cape, 0, 3.0, -0.65);
      g.add(c); api.cape = c;
    }
    if (m.shield) {
      const s = box(0.24, 2.2, 1.7, m.shield, -1.75, 3.0, 0.3);
      g.add(s);
    }
    if (m.weapon && WEAPONS[m.weapon]) {
      const w = WEAPONS[m.weapon](m.weaponColor || 0x39405a);
      h.rightArm.add(w); w.position.set(0, -1.6, 0.1);
      w.scale.setScalar(m.weaponScale || 1);
    }
    if (m.aura) {
      const r = TD.ring(1.9, 0.12, m.aura, 0.75);
      r.position.y = 0.12; g.add(r); api.aura = r;
    }
    if (m.glow) {
      const orb = sphere(0.5, m.glow, 0, 5.4, 0, 10);
      orb.material = mat(m.glow, { transparent: true, opacity: 0.8, emissive: m.glow });
      g.add(orb); api.orb = orb;
    }
    if (m.blob) {
      // slime/ooze bodies: replace the humanoid with a wobbling blob
      g.remove(h.group);
      const body = sphere(1.7, m.shirt || 0x5fd88a, 0, 1.6, 0, 12);
      body.material = mat(m.shirt || 0x5fd88a, { transparent: true, opacity: 0.88 });
      g.add(body);
      g.add(sphere(0.24, 0x101520, -0.55, 2.2, 1.35, 8));
      g.add(sphere(0.24, 0x101520, 0.55, 2.2, 1.35, 8));
      api.blob = body; api.human = null;
    }
    g.scale.setScalar(def.scale || 1);
    return api;
  };

  /* ======================================================================
     PROPS for maps & lobby
     ====================================================================== */
  TD.props = {
    tree: (c1, c2, s) => {
      const g = new T.Group();
      g.add(cylinder(0.35, 0.5, 2.4, c2 || 0x5a4028, 0, 1.2, 0, 7));
      g.add(coneM(1.7, 2.6, c1 || 0x2f8f4a, 0, 3.2, 0, 8));
      g.add(coneM(1.3, 2.2, c1 || 0x2f8f4a, 0, 4.4, 0, 8));
      g.scale.setScalar(s || 1);
      return g;
    },
    palm: (c1, c2, s) => {
      const g = new T.Group();
      const tr = cylinder(0.28, 0.42, 4.4, c2 || 0x8a6a3a, 0, 2.2, 0, 7); tr.rotation.z = 0.12; g.add(tr);
      for (let i = 0; i < 6; i++) {
        const l = box(3.0, 0.14, 0.9, c1 || 0x3fae5c, 1.4, 4.4, 0);
        const p = new T.Group(); p.position.y = 4.4; p.rotation.y = i / 6 * Math.PI * 2; p.rotation.z = -0.35;
        l.position.set(1.5, 0, 0); p.add(l); g.add(p);
      }
      g.scale.setScalar(s || 1); return g;
    },
    rock: (c1, c2, s) => {
      const g = new T.Group();
      g.add(sphere(1.2, c1 || 0x6a7080, 0, 0.7, 0, 6));
      g.add(sphere(0.8, c2 || c1 || 0x6a7080, 0.9, 0.4, 0.5, 6));
      g.add(sphere(0.55, c1 || 0x6a7080, -0.8, 0.3, -0.5, 6));
      g.scale.setScalar(s || 1); return g;
    },
    crystal: (c1, c2, s) => {
      const g = new T.Group();
      for (let i = 0; i < 3; i++) {
        const k = coneM(0.5 - i * 0.1, 2.6 - i * 0.5, (i === 1 ? (c2 || c1) : c1) || 0xa678ff, (i - 1) * 0.8, 1.3, (i % 2) * 0.6, 5);
        k.rotation.z = (i - 1) * 0.25; g.add(k);
      }
      g.scale.setScalar(s || 1); return g;
    },
    house: (c1, c2, s) => {
      const g = new T.Group();
      g.add(box(5, 4, 5, c1 || 0xd8cdb4, 0, 2, 0));
      const r = coneM(4.2, 2.6, c2 || 0x9a4b3c, 0, 5.3, 0, 4); r.rotation.y = Math.PI / 4; g.add(r);
      g.add(box(1.3, 2.2, 0.2, 0x6b4a2a, 0, 1.1, 2.55));
      g.add(box(1.0, 1.0, 0.16, 0x8fd8ff, -1.6, 2.6, 2.55));
      g.add(box(1.0, 1.0, 0.16, 0x8fd8ff, 1.6, 2.6, 2.55));
      g.scale.setScalar(s || 1); return g;
    },
    lamp: (c) => {
      const g = new T.Group();
      g.add(cylinder(0.16, 0.22, 5.0, 0x39405a, 0, 2.5, 0, 8));
      g.add(box(0.7, 0.4, 0.7, 0x39405a, 0, 5.1, 0));
      const bulb = box(0.5, 0.3, 0.5, c || 0xffe08a, 0, 4.85, 0);
      bulb.material = mat(c || 0xffe08a, { emissive: c || 0xffe08a, emissiveIntensity: 0.6 });
      g.add(bulb);
      return g;
    },
    sandbag: (c) => {
      const g = new T.Group();
      for (let i = 0; i < 3; i++) g.add(box(1.2, 0.55, 0.9, c || 0x8a7a55, (i - 1) * 1.15, 0.3, 0));
      for (let i = 0; i < 2; i++) g.add(box(1.2, 0.55, 0.9, c || 0x9a8a65, (i - 0.5) * 1.15, 0.85, 0));
      return g;
    },
    kiosk: (label, c1, c2) => {
      const g = new T.Group();
      g.add(cylinder(2.3, 2.6, 0.5, 0x39405a, 0, 0.25, 0, 8));
      g.add(box(3.2, 3.0, 1.6, c1 || 0x2f3a5e, 0, 2.0, 0));
      g.add(box(3.4, 0.4, 1.8, c2 || 0xffc63d, 0, 3.6, 0));
      for (let i = 0; i < 2; i++) g.add(cylinder(0.12, 0.12, 3.4, 0x39405a, i ? 1.5 : -1.5, 1.7, 0.95, 6));
      const sign = box(3.6, 1.4, 0.2, c2 || 0xffc63d, 0, 4.7, 0);
      g.add(sign);
      g.add(box(3.0, 1.6, 0.12, 0x101626, 0, 2.3, 0.85));
      g.userData.sign = sign;
      return g;
    },
    fence: (len, c) => {
      const g = new T.Group();
      for (let i = 0; i <= len; i++) g.add(box(0.2, 1.4, 0.2, c || 0x8a6a3a, i * 2 - len, 0.7, 0));
      g.add(box(len * 2, 0.18, 0.14, c || 0x8a6a3a, 0, 1.1, 0));
      g.add(box(len * 2, 0.18, 0.14, c || 0x8a6a3a, 0, 0.55, 0));
      return g;
    },
    base: (c1, c2) => {
      /* The thing the enemies are trying to reach. */
      const g = new T.Group();
      g.add(cylinder(4.4, 5.0, 1.0, 0x3a4468, 0, 0.5, 0, 10));
      g.add(box(6.0, 3.4, 6.0, c1 || 0x455178, 0, 2.6, 0));
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * Math.PI * 2 + Math.PI / 4;
        g.add(box(1.4, 5.4, 1.4, c1 || 0x455178, Math.cos(a) * 3.4, 2.7, Math.sin(a) * 3.4));
        g.add(box(1.7, 0.6, 1.7, 0x2b3350, Math.cos(a) * 3.4, 5.6, Math.sin(a) * 3.4));
      }
      const core = sphere(1.5, c2 || 0x6ee7ff, 0, 5.2, 0, 14);
      core.material = mat(c2 || 0x6ee7ff, { emissive: c2 || 0x6ee7ff, emissiveIntensity: 0.55, transparent: true, opacity: 0.92 });
      g.add(core); g.userData.core = core;
      const r = TD.ring(2.4, 0.16, c2 || 0x6ee7ff, 0.8); r.position.y = 5.2; g.add(r);
      g.userData.ring = r;
      return g;
    },
    portal: (c) => {
      const g = new T.Group();
      const r = new T.Mesh(torus(3.4, 0.45, 28), mat(c || 0xa678ff, { emissive: c || 0xa678ff, emissiveIntensity: 0.5 }));
      r.position.y = 3.8; g.add(r);
      const inner = new T.Mesh(new T.CircleGeometry(3.1, 26), mat(0x140c26, { transparent: true, opacity: 0.8 }));
      inner.position.y = 3.8; g.add(inner);
      const inner2 = inner.clone(); inner2.rotation.y = Math.PI; g.add(inner2);
      for (let i = 0; i < 2; i++) {
        g.add(box(0.8, 4.4, 0.8, 0x2b3350, i ? 4.2 : -4.2, 2.2, 0));
        const cap = box(1.1, 0.5, 1.1, c || 0xa678ff, i ? 4.2 : -4.2, 4.6, 0);
        cap.material = mat(c || 0xa678ff, { emissive: c || 0xa678ff, emissiveIntensity: 0.4 });
        g.add(cap);
      }
      g.add(box(10.0, 0.5, 2.4, 0x2b3350, 0, 0.25, 0));
      g.userData.ring = r;
      return g;
    }
  };

  /* ======================================================================
     THUMBNAILS — one shared renderer draws every UI card preview
     ====================================================================== */
  TD.Thumb = (function () {
    let renderer = null, scene = null, cam = null;
    const cache = new Map();
    function init() {
      if (renderer) return true;
      try {
        renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      } catch (e) { return false; }
      renderer.setSize(256, 256);
      renderer.setPixelRatio(1);
      scene = new T.Scene();
      const hemi = new T.HemisphereLight(0xdfe8ff, 0x2a3048, 1.05); scene.add(hemi);
      const dir = new T.DirectionalLight(0xffffff, 0.85); dir.position.set(6, 10, 7); scene.add(dir);
      const dir2 = new T.DirectionalLight(0x7f9bff, 0.3); dir2.position.set(-6, 4, -5); scene.add(dir2);
      cam = new T.PerspectiveCamera(32, 1, 0.1, 200);
      return true;
    }
    /* Render a group and return a data URL. Cached by key. */
    function render(key, builder, angle) {
      if (cache.has(key)) return cache.get(key);
      if (!init()) return null;
      const g = builder();
      scene.add(g);
      const bbox = new T.Box3().setFromObject(g);
      const size = bbox.getSize(new T.Vector3());
      const center = bbox.getCenter(new T.Vector3());
      const radius = Math.max(size.x, size.y, size.z) * 0.72 + 0.6;
      const a = angle == null ? -0.7 : angle;
      cam.position.set(center.x + Math.sin(a) * radius * 2.4, center.y + radius * 1.15, center.z + Math.cos(a) * radius * 2.4);
      cam.lookAt(center);
      renderer.render(scene, cam);
      const url = renderer.domElement.toDataURL('image/png');
      scene.remove(g);
      cache.set(key, url);
      return url;
    }
    return { render: render };
  })();

})();
