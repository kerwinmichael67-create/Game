/* ========================================================================
   Procedural car meshes (one silhouette per model, extruded across the width)
   ======================================================================== */
const _mat = {};
function matCache(key, make) {
  return _mat[key] || (_mat[key] = make());
}

function polyShape(pts) {
  const s = new THREE.Shape();
  pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])));
  s.closePath();
  return s;
}
function extrudeAcross(shape, width, bevel, segs = 3) {
  /* bevelOffset pulls the bevel inward, so the outer surface is exactly the drawn silhouette and only the side edges round off */
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: width - bevel * 2,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: segs,
    steps: 1,
    curveSegments: 4,
  });
  g.rotateY(-Math.PI / 2);
  g.translate(width / 2 - bevel, 0, 0);
  g.computeVertexNormals();
  return g;
}
/* thin panel lying on the edge a→b of the silhouette (windscreen, rear window) */
function edgePanel(a, b, inset0, inset1, lift, thick) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    L = Math.hypot(dx, dy),
    ux = dx / L,
    uy = dy / L,
    nx = -uy,
    ny = ux; /* n points up-out of the body for a rear→front walk */
  const p0 = [a[0] + ux * L * inset0, a[1] + uy * L * inset0],
    p1 = [b[0] - ux * L * inset1, b[1] - uy * L * inset1];
  return polyShape([
    [p0[0] + nx * lift, p0[1] + ny * lift],
    [p1[0] + nx * lift, p1[1] + ny * lift],
    [p1[0] - nx * thick, p1[1] - ny * thick],
    [p0[0] - nx * thick, p0[1] - ny * thick],
  ]);
}
function makeDecal(num, hex) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#f4f6fb';
  x.beginPath();
  x.arc(64, 64, 56, 0, TAU);
  x.fill();
  x.lineWidth = 6;
  x.strokeStyle = hexCss(hex);
  x.stroke();
  x.fillStyle = '#10131c';
  x.font = '900 70px Orbitron, Rajdhani, sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(String(num), 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  return new THREE.MeshStandardMaterial({
    map: t,
    transparent: true,
    roughness: 0.5,
    metalness: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
}
function makeGlowTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 1, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function carGeometry(model) {
  return matCache('geo:' + model.id, () => {
    const B = model.body,
      [iDeck, iRoofR, iRoofF, iCowl] = model.cabin,
      w = model.w;
    const deck = B[iDeck],
      roofR = B[iRoofR],
      roofF = B[iRoofF],
      cowl = B[iCowl];
    const side = polyShape([
      [deck[0] + 0.3, deck[1] + 0.02],
      [roofR[0] + 0.1, roofR[1] - 0.13],
      [roofF[0] - 0.12, roofF[1] - 0.13],
      [cowl[0] - 0.34, cowl[1] + 0.0],
    ]);
    const zs = B.map((p) => p[0]),
      ys = B.map((p) => p[1]);
    return {
      body: extrudeAcross(polyShape(B), w, 0.09),
      stripe: extrudeAcross(polyShape(B), 0.4, 0),
      screen: extrudeAcross(edgePanel(roofF, cowl, 0.07, 0.05, 0.012, 0.05), w - 0.3, 0),
      rear: extrudeAcross(edgePanel(deck, roofR, 0.1, 0.07, 0.012, 0.05), w - 0.34, 0),
      side: extrudeAcross(side, w + 0.014, 0),
      zf: Math.max(...zs),
      zr: Math.min(...zs),
      yb: Math.min(...ys),
      roofY: Math.max(...ys),
      noseY: B[B.length - 2][1],
      tailY: B[2][1],
      deckY: deck[1],
      deckZ: deck[0],
      cowlZ: cowl[0],
      cowlY: cowl[1],
    };
  });
}

function buildCarMesh(hex, levels = {}, opts = {}) {
  const model = carModel(opts.model),
    G = carGeometry(model),
    w = model.w;
  const g = new THREE.Group();
  /* metallic paint: reflections take the body colour, so the car stays saturated instead of washing out under a bright sky */
  const paint = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hex).convertSRGBToLinear(),
    metalness: 0.5,
    roughness: 0.4,
    clearcoat: 0.3,
    clearcoatRoughness: 0.22,
    envMapIntensity: 0.7,
  }); /* swatch colours are sRGB; the renderer works in linear */
  const dark = matCache('dark', () => new THREE.MeshStandardMaterial({ color: 0x15171c, metalness: 0.35, roughness: 0.65 }));
  const glass = matCache(
    'glass',
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x0a0f16,
        metalness: 0.3,
        roughness: 0.22,
        envMapIntensity: 0.45,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      })
  );
  const chrome = matCache(
    'chrome',
    () => new THREE.MeshStandardMaterial({ color: 0xc8cedb, metalness: 1, roughness: 0.25, envMapIntensity: 0.8 })
  );
  const tyre = matCache('tyre', () => new THREE.MeshStandardMaterial({ color: 0x0f1012, roughness: 0.95 }));
  const headMat = matCache('head', () => new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff2c0, emissiveIntensity: 2.2 }));
  const stripeMat = matCache(
    'stripe',
    () => new THREE.MeshStandardMaterial({ color: 0xf4f6fb, roughness: 0.4, metalness: 0.2, polygonOffset: true, polygonOffsetFactor: -1 })
  );
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x3a0606, emissive: 0xff1a1a, emissiveIntensity: 0.8 });

  const bodyM = new THREE.Mesh(G.body, paint);
  bodyM.castShadow = true;
  bodyM.receiveShadow = true;
  g.add(bodyM);
  /* racing stripe hugs the whole profile: a narrow slice of the same silhouette, a hair proud of the paint */
  const stripe = new THREE.Mesh(G.stripe, stripeMat);
  stripe.scale.set(1, 1.006, 1.002);
  g.add(stripe);
  for (const geo of [G.screen, G.rear, G.side]) {
    const m = new THREE.Mesh(geo, glass);
    g.add(m);
  }
  /* lower body, splitter, diffuser */
  const len = G.zf - G.zr,
    mid = (G.zf + G.zr) / 2;
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, 0.2, len - 0.24), dark);
  skirt.position.set(0, G.yb - 0.04, mid);
  skirt.castShadow = true;
  g.add(skirt);
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.5), dark);
  splitter.position.set(0, G.yb - 0.12, G.zf - 0.12);
  g.add(splitter);
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(w - 0.16, 0.14, 0.4), dark);
  diffuser.position.set(0, G.yb - 0.06, G.zr + 0.14);
  g.add(diffuser);
  /* door number */
  const decal = makeDecal(opts.number ?? ((hex >> 4) % 89) + 7, hex);
  for (const sx of [-1, 1]) {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.58), decal);
    d.position.set(sx * (w / 2 + 0.006), G.yb + 0.34, mid + 0.1);
    d.rotation.y = (sx * Math.PI) / 2;
    g.add(d);
  }
  /* mirrors */
  for (const sx of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.22), paint);
    m.position.set(sx * (w / 2 + 0.08), G.cowlY + 0.08, G.cowlZ - 0.15);
    g.add(m);
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.06), dark);
    st.position.set(sx * (w / 2), G.cowlY + 0.05, G.cowlZ - 0.15);
    g.add(st);
  }
  /* rear wing grows with engine + turbo upgrades; the hypercar always wears one */
  const sl = Math.min(3, Math.ceil(((levels.engine || 0) + (levels.turbo || 0)) / 3) + (model.id === 'apex' ? 1 : 0));
  if (sl > 0 && model.id !== 'kite') {
    const wz = G.zr + 0.3,
      wy = G.deckY + 0.1 + sl * 0.09;
    const wing = new THREE.Mesh(new THREE.BoxGeometry(w - 0.26 + sl * 0.1, 0.05, 0.42), dark);
    wing.position.set(0, wy, wz);
    wing.rotation.x = -0.12;
    wing.castShadow = true;
    g.add(wing);
    for (const sx of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, wy - G.deckY + 0.04, 0.3), paint);
      p.position.set(sx * (w / 2 - 0.3), (wy + G.deckY) / 2, wz);
      g.add(p);
    }
  } else if (sl > 0) {
    /* hatch gets a roof spoiler instead */
    const lip = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, 0.05, 0.3 + sl * 0.08), dark);
    lip.position.set(0, G.roofY - 0.03, model.body[model.cabin[1]][0] - 0.12);
    lip.rotation.x = -0.1;
    g.add(lip);
  }
  /* lights */
  for (const sx of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.1), headMat);
    h.position.set(sx * (w / 2 - 0.38), G.noseY + 0.04, G.zf - 0.04);
    h.rotation.x = 0.4;
    g.add(h);
  }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(w - 0.46, 0.07, 0.05), tailMat);
  tail.position.set(0, G.tailY - 0.08, G.zr - 0.01);
  g.add(tail);
  if (opts.night) {
    const glowMat = matCache(
      'glow',
      () =>
        new THREE.SpriteMaterial({
          map: makeGlowTex(),
          color: 0xfff1c8,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: 0.85,
        })
    );
    for (const sx of [-1, 1]) {
      const sp = new THREE.Sprite(glowMat);
      sp.scale.set(1.3, 1.3, 1);
      sp.position.set(sx * (w / 2 - 0.38), G.noseY + 0.04, G.zf + 0.08);
      g.add(sp);
    }
  }
  /* exhausts + boost flames (own material so each car can tint its flame) */
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x66d9ff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const flames = [];
  for (const sx of [-0.4, 0.4]) {
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.3, 10), chrome);
    ex.rotation.x = Math.PI / 2;
    ex.position.set(sx, G.yb - 0.04, G.zr - 0.02);
    g.add(ex);
    const fl = new THREE.Mesh(
      matCache('flameGeo', () => new THREE.ConeGeometry(0.12, 1.3, 8)),
      flameMat
    );
    fl.rotation.x = Math.PI / 2;
    fl.position.set(sx, G.yb - 0.04, G.zr - 0.68);
    fl.visible = false;
    g.add(fl);
    flames.push(fl);
  }
  /* wheels */
  const wheelGeo = matCache('wheelGeo', () => {
    const geo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 24);
    geo.rotateZ(Math.PI / 2);
    return geo;
  });
  const rimGeo = matCache('rimGeo', () => {
    const geo = new THREE.CylinderGeometry(0.25, 0.25, 0.31, 10);
    geo.rotateZ(Math.PI / 2);
    return geo;
  });
  const hubGeo = matCache('hubGeo', () => {
    const geo = new THREE.CylinderGeometry(0.1, 0.1, 0.33, 8);
    geo.rotateZ(Math.PI / 2);
    return geo;
  });
  const archGeo = matCache('archGeo', () => {
    const geo = new THREE.CylinderGeometry(0.47, 0.47, 0.18, 20);
    geo.rotateZ(Math.PI / 2);
    return geo;
  });
  const wheels = [],
    wx = w / 2 - 0.04;
  [
    [-wx, model.wb],
    [wx, model.wb],
    [-wx, -model.wb],
    [wx, -model.wb],
  ].forEach(([x, z], i) => {
    const arch = new THREE.Mesh(archGeo, dark);
    arch.position.set(x * 0.98, 0.42, z);
    g.add(arch);
    const hub = new THREE.Group();
    hub.position.set(x, 0.36, z);
    const wm = new THREE.Mesh(wheelGeo, tyre);
    wm.castShadow = true;
    hub.add(wm);
    const r = new THREE.Mesh(rimGeo, chrome);
    hub.add(r);
    hub.add(new THREE.Mesh(hubGeo, dark));
    g.add(hub);
    wheels.push({ hub, spin: wm, rim: r, front: i < 2 });
  });
  /* soft contact shadow */
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(w + 0.8, len + 0.7),
    matCache('blob', () => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const x = c.getContext('2d');
      const gr = x.createRadialGradient(32, 32, 4, 32, 32, 32);
      gr.addColorStop(0, 'rgba(0,0,0,.6)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gr;
      x.fillRect(0, 0, 64, 64);
      return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false });
    })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.set(0, 0.03, mid);
  g.add(blob);

  g.userData = { paint, tailMat, wheels, flames, flameMat, body: bodyM, rearZ: G.zr };
  if (opts.ghost) {
    g.traverse((o) => {
      if (o.isMesh || o.isSprite) {
        o.material = o.material.clone();
        o.material.transparent = true;
        o.material.opacity = 0.3;
        o.material.depthWrite = false;
        o.castShadow = false;
      }
    });
    blob.visible = false;
  }
  return g;
}

/* name tag sprite for other racers */
function makeLabel(text, hex) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(8,10,18,.72)';
  x.beginPath();
  x.roundRect ? x.roundRect(8, 8, 240, 48, 12) : x.rect(8, 8, 240, 48);
  x.fill();
  x.fillStyle = hexCss(hex);
  x.beginPath();
  x.arc(32, 32, 10, 0, TAU);
  x.fill();
  x.fillStyle = '#eef3ff';
  x.font = '700 26px Rajdhani, Segoe UI, sans-serif';
  x.textBaseline = 'middle';
  x.fillText(String(text).slice(0, 14), 52, 33);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.scale.set(4, 1, 1);
  sp.position.y = 2.3;
  sp.renderOrder = 5;
  return sp;
}
