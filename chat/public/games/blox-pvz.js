/* =====================================================================
   BLOXVERSE — PLANTS VS ZOMBIES. Zombies come off the street, down five
   lanes of lawn, to eat the brains in the house. Plant seeds on the lawn
   to stop them: Peashooters, Sunflowers for more sun, Cherry Bombs,
   Wall-nuts, Potato Mines, Snow Peas, Chompers, Repeaters, Jalapeños,
   Squash and Threepeaters. Collect sun as it falls (click it, or walk
   into it), and dig up plants with the shovel. A lawn mower guards each
   lane, once. Ten levels, each unlocking a new plant, then Endless.
   Co-op for up to 4: the sun is shared, each player has their own seed
   packets. The host runs the zombies, the plants and the peas, and
   shares it all through presence; players ask the host to plant, dig and
   pick up sun through theirs.
   ===================================================================== */
(() => {
  const T = 6, ROWS = 5, COLS = 9, Z0 = 24; // a tile; columns run from the house (z 24) out to the street (z -24)
  const tx = (r) => (r - 2) * T, tz = (c) => Z0 - c * T;
  const HOUSE = 30.5, SPAWN = -40, ONLAWN = -31; // past HOUSE a zombie is at the door; shooters fire once a zombie is on the lawn
  const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const n2 = (n) => AL[(n >> 6) & 63] + AL[n & 63], d2 = (t, i) => AL.indexOf(t[i]) * 64 + AL.indexOf(t[i + 1]);
  // the plants: sun cost, recharge (s), health, the level that unlocks it
  const PL = [
    { k: 'pea', n: 'Peashooter', e: '🌱', cost: 100, cd: 7.5, hp: 300, un: 0, d: 'Shoots peas at zombies in its lane.' },
    { k: 'sun', n: 'Sunflower', e: '🌻', cost: 50, cd: 7.5, hp: 300, un: 1, d: 'Makes extra sun (25 every 20 seconds).' },
    { k: 'cherry', n: 'Cherry Bomb', e: '🍒', cost: 150, cd: 50, hp: 300, un: 2, d: 'Blows up every zombie close by.' },
    { k: 'nut', n: 'Wall-nut', e: '🌰', cost: 50, cd: 30, hp: 4000, un: 3, d: 'A tough wall that holds zombies back.' },
    { k: 'mine', n: 'Potato Mine', e: '🥔', cost: 25, cd: 30, hp: 300, un: 4, d: 'Arms after 14 seconds, then explodes when a zombie steps on it.' },
    { k: 'snow', n: 'Snow Pea', e: '❄️', cost: 175, cd: 7.5, hp: 300, un: 5, d: 'Frozen peas: they slow zombies down too.' },
    { k: 'chomp', n: 'Chomper', e: '🌺', cost: 150, cd: 7.5, hp: 300, un: 6, d: 'Swallows the zombie in front of it whole, then chews for a while.' },
    { k: 'rep', n: 'Repeater', e: '🌿', cost: 200, cd: 7.5, hp: 300, un: 7, d: 'Shoots two peas at a time.' },
    { k: 'jal', n: 'Jalapeño', e: '🌶️', cost: 125, cd: 50, hp: 300, un: 8, d: 'Burns every zombie in its lane.' },
    { k: 'squash', n: 'Squash', e: '🎃', cost: 50, cd: 30, hp: 300, un: 9, d: 'Squashes the first zombie that comes close.' },
    { k: 'three', n: 'Threepeater', e: '☘️', cost: 325, cd: 7.5, hp: 300, un: 10, d: 'Shoots peas down three lanes at once.' },
  ];
  const P_ = Object.fromEntries(PL.map((p, i) => [p.k, i]));
  // the zombies: health, armour (cone, bucket, paper, helmet), speed, how much of a wave they use up, the level they first come
  const ZB = [
    { k: 'basic', n: 'Zombie', hp: 270, arm: 0, sp: 1.05, pts: 1, lv: 1 },
    { k: 'flag', n: 'Flag Zombie', hp: 270, arm: 0, sp: 1.35, pts: 1, lv: 99 },
    { k: 'cone', n: 'Conehead Zombie', hp: 270, arm: 370, sp: 1.05, pts: 2, lv: 2 },
    { k: 'pole', n: 'Pole Vaulting Zombie', hp: 500, arm: 0, sp: 2.3, pts: 2, lv: 4 },
    { k: 'bucket', n: 'Buckethead Zombie', hp: 270, arm: 1100, sp: 1.05, pts: 4, lv: 6 },
    { k: 'paper', n: 'Newspaper Zombie', hp: 270, arm: 150, sp: 1.05, pts: 2, lv: 7 },
    { k: 'foot', n: 'Football Zombie', hp: 270, arm: 1400, sp: 2.2, pts: 7, lv: 9 },
    { k: 'garg', n: 'Gargantuar', hp: 3000, arm: 0, sp: 0.7, pts: 10, lv: 10 },
  ];
  const LEVELS = 10, BLAST = 1800, BITE = 100, PEA = 20, PEA_SP = 20;
  const wavesOf = (lv) => (lv ? 3 + lv : 0); // 0: Endless
  const flagWave = (lv, w) => (lv ? w === wavesOf(lv) || (wavesOf(lv) >= 9 && w === Math.ceil(wavesOf(lv) / 2)) : w % 5 === 0);
  // what each wave sends: a budget of points, spent on the zombies this level has
  function waveList(lv, w, r, n = 1) {
    const flag = flagWave(lv, w), types = ZB.map((z, t) => t).filter((t) => t !== 1 && (lv ? ZB[t].lv <= lv && (t !== 7 || w === wavesOf(lv)) : ZB[t].lv <= Math.min(9, 1 + Math.floor(w / 2)) || (t === 7 && w >= 10)));
    let b = (lv ? 1 + Math.floor(w * (0.45 + lv * 0.06)) : 2 + Math.floor(w * 1.1)) * (1 + 0.25 * (n - 1)); // more of you, more of them
    if (flag) b = Math.ceil(b * 2.1) + 2;
    const out = flag ? [1] : [];
    if (lv === LEVELS && w === wavesOf(lv)) { out.push(7); b -= 10; } // the last level ends with a Gargantuar
    const most = Math.max(2, Math.floor(b / 2)); // no zombie takes more than half a wave (the big ones come in the huge waves)
    while (b > 0) {
      const ok = types.filter((t) => ZB[t].pts <= Math.min(b, most) && (t !== 7 || !lv));
      if (!ok.length) break;
      const t = r() < 0.45 ? ok[0] : ok[Math.floor(r() * ok.length)];
      out.push(t); b -= ZB[t].pts;
    }
    return out;
  }

  /* ---------------- looks ---------------- */
  const style = document.createElement('style');
  style.textContent = `
    .xslot .pz-cd{position:absolute;left:0;right:0;top:0;background:rgba(15,23,42,.66);border-radius:15px 15px 0 0;pointer-events:none}
    .xslot.pz-sun{min-width:84px;cursor:default;background:linear-gradient(180deg,rgba(120,84,10,.96),rgba(66,44,6,.97));border-color:rgba(253,224,71,.5)}
    .xslot.pz-sun b{font:700 20px var(--fh);color:#fde047}
    .pz-prog{display:inline-flex;align-items:center;gap:6px;vertical-align:middle;margin-left:8px}
    .pz-prog .bar{position:relative;width:150px;height:12px;border-radius:7px;background:rgba(0,0,0,.45);overflow:visible;box-shadow:inset 0 1px 2px rgba(0,0,0,.5)}
    .pz-prog .bar i{position:absolute;left:0;top:0;bottom:0;border-radius:7px;background:linear-gradient(180deg,#a3e635,#4d7c0f)}
    .pz-prog .bar u{position:absolute;top:-9px;font-size:13px;text-decoration:none;transform:translateX(-50%)}
    .pz-seeds .xp-card.locked{opacity:.55}
    .pz-lv{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:8px 0}
    .pz-lv button{padding:9px 0;border-radius:11px;border:2px solid rgba(255,255,255,.12);background:#243042;color:#fff;font:700 14px var(--fh);cursor:pointer}
    .pz-lv button.on{background:linear-gradient(180deg,#4ade80,#16a34a);border-color:#fff}
    .pz-lv button:disabled{opacity:.4;cursor:default}
  `;
  document.head.appendChild(style);
  const MATS = new Map(), mat = (c, basic) => { const k = c + (basic ? 'b' : ''); if (!MATS.has(k)) MATS.set(k, basic ? new THREE.MeshBasicMaterial({ color: c }) : new THREE.MeshLambertMaterial({ color: c })); return MATS.get(k); };
  const BALL = new THREE.IcosahedronGeometry(1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 12), CONE = new THREE.ConeGeometry(0.6, 1, 8);
  const bx = (g, c, sx, sy, sz, x, y, z, geo) => { const m = new THREE.Mesh(geo || BOX, mat(c)); m.scale.set(sx, sy, sz); m.position.set(x, y, z); g.add(m); return m; };
  const eyes = (g, y, z, w = 0.28, gap = 0.3) => { bx(g, 0xffffff, w, w, 0.05, -gap, y, z); bx(g, 0xffffff, w, w, 0.05, gap, y, z); bx(g, 0x111111, w * 0.5, w * 0.5, 0.06, -gap, y, z - 0.01); bx(g, 0x111111, w * 0.5, w * 0.5, 0.06, gap, y, z - 0.01); };
  // a plant, facing the street (-z)
  function plantModel(t) {
    const g = new THREE.Group(), k = PL[t].k, leaf = 0x16a34a;
    const stem = (h, x = 0) => { bx(g, 0x22c55e, 0.32, h, 0.32, x, h / 2, 0); bx(g, leaf, 1.6, 0.12, 0.7, x - 0.6, 0.12, 0.2).rotation.y = 0.5; bx(g, leaf, 1.6, 0.12, 0.7, x + 0.6, 0.12, -0.2).rotation.y = 0.5; };
    const shooter = (c, x, y, s = 1) => {
      const h = new THREE.Group(); h.position.set(x, y, 0); h.scale.setScalar(s); g.add(h);
      bx(h, c, 1.4, 1.3, 1.3, 0, 0, 0); bx(h, c, 0.75, 0.75, 1, 0, 0, -1); bx(h, 0x0f172a, 0.45, 0.45, 0.05, 0, 0, -1.51);
      eyes(h, 0.42, -0.66, 0.26, 0.36);
      return h;
    };
    if (k === 'pea' || k === 'rep' || k === 'snow') {
      stem(1.6); const c = k === 'snow' ? 0x7dd3fc : k === 'rep' ? 0x15803d : 0x4ade80;
      const h = shooter(c, 0, 2.3); g.userData.head = h;
      if (k === 'rep') bx(h, 0x166534, 0.3, 0.9, 1.2, 0, 0.6, 0.6).rotation.x = 0.6;
      if (k === 'snow') for (const [x, z] of [[-0.5, 0.4], [0.5, 0.2], [0, 0.6]]) bx(h, 0xe0f2fe, 0.25, 0.7, 0.25, x, 0.8, z).rotation.z = x;
    } else if (k === 'three') {
      bx(g, 0x22c55e, 0.32, 1.4, 0.32, 0, 0.7, 0); bx(g, 0x22c55e, 2.2, 0.28, 0.28, 0, 1.45, 0);
      g.userData.heads = [-1.05, 0, 1.05].map((x, i) => shooter(0x4ade80, x, i === 1 ? 2.65 : 2.2, 0.68));
    } else if (k === 'sun') {
      stem(1.6); const h = new THREE.Group(); h.position.set(0, 2.5, 0); g.add(h); g.userData.head = h;
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, p = bx(h, 0xfacc15, 0.55, 0.95, 0.2, Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0.05); p.rotation.z = a - Math.PI / 2; }
      const f = bx(h, 0x92400e, 0.85, 0.85, 0.3, 0, 0, 0, CYL); f.rotation.x = Math.PI / 2;
      eyes(h, 0.18, 0.18, 0.18, 0.25); bx(h, 0x111111, 0.5, 0.08, 0.05, 0, -0.25, 0.2);
    } else if (k === 'nut') {
      bx(g, 0xb45309, 2.4, 2.9, 2, 0, 1.45, 0, BALL).scale.set(1.2, 1.55, 1.05); bx(g, 0xd97706, 1.6, 1.8, 0.3, 0, 1.6, -0.95);
      eyes(g, 2, -1.12, 0.36, 0.42);
      g.userData.cracks = [bx(g, 0x451a03, 0.12, 1.1, 0.06, -0.5, 1.2, -1.14), bx(g, 0x451a03, 0.9, 0.12, 0.06, 0.3, 0.9, -1.14), bx(g, 0x451a03, 0.12, 0.9, 0.06, 0.6, 2.5, -1.14)];
    } else if (k === 'cherry') {
      for (const x of [-0.6, 0.6]) { bx(g, 0xdc2626, 0.85, 0.85, 0.85, x, 0.9, 0, BALL); bx(g, 0x15803d, 0.12, 1.2, 0.12, x * 0.5, 2.1, 0).rotation.z = -x * 0.6; for (const e of [-0.2, 0.2]) bx(g, 0x111111, 0.14, 0.18, 0.05, x + e, 1.05, -0.84); }
      bx(g, leaf, 0.9, 0.12, 0.5, 0, 2.7, 0);
    } else if (k === 'mine') {
      bx(g, 0x78350f, 1.8, 0.5, 1.8, 0, 0.25, 0, BALL);
      const body = new THREE.Group(); g.add(body); g.userData.body = body;
      bx(body, 0xa16207, 1.5, 1.1, 1.3, 0, 0.7, 0, BALL); eyes(body, 1, -1.1, 0.22, 0.3);
      bx(body, 0x57534e, 0.08, 0.7, 0.08, 0, 1.8, 0); g.userData.light = bx(body, 0x7f1d1d, 0.3, 0.3, 0.3, 0, 2.2, 0, BALL);
    } else if (k === 'chomp') {
      bx(g, 0x22c55e, 0.35, 1.8, 0.35, 0, 0.9, 0); bx(g, leaf, 1.8, 0.12, 0.8, 0, 0.12, 0);
      const h = new THREE.Group(); h.position.set(0, 2.4, 0); g.add(h); g.userData.head = h;
      const top = new THREE.Group(); h.add(top); bx(top, 0x7e22ce, 1.9, 0.9, 2.1, 0, 0.45, -0.5); for (let i = -2; i <= 2; i++) bx(top, 0xffffff, 0.18, 0.35, 0.18, i * 0.38, 0, -1.4);
      bx(top, 0xc084fc, 0.4, 0.4, 0.4, -0.6, 1, -0.2); bx(top, 0xc084fc, 0.4, 0.4, 0.4, 0.6, 1, -0.2);
      bx(h, 0x6b21a8, 1.8, 0.6, 1.9, 0, -0.35, -0.45); g.userData.top = top; g.userData.belly = bx(h, 0x7e22ce, 1.8, 1.4, 1.6, 0, -0.2, 0.3, BALL);
      g.userData.belly.visible = false;
    } else if (k === 'jal') {
      bx(g, 0xdc2626, 0.9, 2.6, 0.9, 0, 1.4, 0, BALL).scale.set(0.75, 1.5, 0.75); bx(g, 0x15803d, 0.7, 0.4, 0.7, 0, 2.85, 0); eyes(g, 1.9, -0.6, 0.2, 0.2);
    } else if (k === 'squash') {
      const b = new THREE.Group(); g.add(b); g.userData.body = b;
      bx(b, 0x65a30d, 2.2, 2.3, 2.1, 0, 1.2, 0); bx(b, 0x84cc16, 1.6, 1.3, 0.2, 0, 1.4, -1.06); bx(b, 0x3f6212, 0.3, 0.5, 0.3, 0, 2.6, 0);
      bx(b, 0x111111, 0.5, 0.1, 0.05, -0.4, 1.95, -1.17).rotation.z = -0.4; bx(b, 0x111111, 0.5, 0.1, 0.05, 0.4, 1.95, -1.17).rotation.z = 0.4; eyes(b, 1.65, -1.12, 0.26, 0.4);
    }
    return g;
  }
  // a zombie, walking towards the house (+z)
  const SKIN = 0x9fb48a, COAT = 0x6b4f3a, PANTS = 0x3b5ba5;
  function zombieModel(t) {
    const g = new THREE.Group(), k = ZB[t].k, body = new THREE.Group(); g.add(body);
    const legL = new THREE.Group(), legR = new THREE.Group(); legL.position.set(-0.32, 1.5, 0); legR.position.set(0.32, 1.5, 0); body.add(legL, legR);
    bx(legL, PANTS, 0.55, 1.5, 0.55, 0, -0.75, 0); bx(legR, PANTS, 0.55, 1.5, 0.55, 0, -0.75, 0);
    bx(legL, 0x3f3f46, 0.6, 0.25, 0.75, 0, -1.4, 0.1); bx(legR, 0x3f3f46, 0.6, 0.25, 0.75, 0, -1.4, 0.1);
    const coat = k === 'foot' ? 0xb91c1c : k === 'garg' ? 0x57534e : COAT;
    bx(body, coat, 1.3, 1.5, 0.7, 0, 2.25, 0); bx(body, 0xf5f5f4, 0.45, 1.1, 0.05, 0, 2.4, 0.36); bx(body, 0xb91c1c, 0.16, 0.8, 0.06, 0, 2.3, 0.39);
    const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(-0.85, 2.85, 0); armR.position.set(0.85, 2.85, 0); body.add(armL, armR);
    bx(armL, coat, 0.4, 1.4, 0.4, 0, -0.6, 0); bx(armR, coat, 0.4, 1.4, 0.4, 0, -0.6, 0); bx(armL, SKIN, 0.36, 0.4, 0.36, 0, -1.45, 0); bx(armR, SKIN, 0.36, 0.4, 0.36, 0, -1.45, 0);
    armL.rotation.x = armR.rotation.x = -1.35; // arms out in front, reaching for brains
    const head = new THREE.Group(); head.position.set(0, 3.45, 0); body.add(head);
    bx(head, SKIN, 1, 1, 1, 0, 0.45, 0); bx(head, 0xffffff, 0.28, 0.28, 0.05, -0.22, 0.6, 0.51); bx(head, 0xffffff, 0.36, 0.36, 0.05, 0.22, 0.58, 0.51);
    bx(head, 0x111111, 0.1, 0.1, 0.06, -0.22, 0.6, 0.53); bx(head, 0x111111, 0.12, 0.12, 0.06, 0.25, 0.56, 0.53); bx(head, 0x3f3f46, 0.5, 0.12, 0.05, 0, 0.18, 0.51);
    const hat = new THREE.Group(); head.add(hat);
    if (k === 'cone') { bx(hat, 0xf97316, 1.3, 1.3, 1.3, 0, 1.45, 0, CONE); bx(hat, 0xffedd5, 0.75, 0.15, 0.75, 0, 1.3, 0, CYL); }
    if (k === 'bucket') { bx(hat, 0x9ca3af, 0.62, 0.9, 0.62, 0, 1.15, 0, CYL); bx(hat, 0x6b7280, 0.66, 0.1, 0.66, 0, 0.75, 0, CYL); }
    if (k === 'foot') { bx(hat, 0xb91c1c, 1.2, 0.8, 1.2, 0, 0.75, -0.05); bx(hat, 0x111111, 0.9, 0.08, 0.08, 0, 0.3, 0.62); bx(hat, 0xffffff, 0.12, 0.8, 1.22, 0, 0.75, -0.05); bx(body, 0xb91c1c, 2, 0.5, 1, 0, 2.95, 0); }
    if (k === 'flag') { const f = new THREE.Group(); f.position.set(0.85, 2.3, 0.3); body.add(f); bx(f, 0x78350f, 0.1, 3.6, 0.1, 0, 1.2, 0); bx(f, 0xb91c1c, 0.06, 1, 1.5, 0, 2.5, -0.8); bx(f, 0xfda4af, 0.07, 0.4, 0.5, 0, 2.5, -0.8); armR.rotation.x = -0.3; }
    if (k === 'paper') { const p = bx(body, 0xf5f5f4, 1.6, 1.1, 0.06, 0, 2.6, 1.1); p.rotation.x = -0.25; g.userData.paper = p; }
    if (k === 'pole') { g.userData.pole = bx(body, 0xd97706, 0.12, 0.12, 6, 0.7, 2.1, 0.6); bx(body, 0xf5f5f4, 1.32, 0.6, 0.72, 0, 2.6, 0); }
    if (k === 'garg') { const pole = bx(armR, 0x78350f, 0.45, 5, 0.45, 0, -2.6, 0); pole.position.z = 0; g.userData.club = armR; bx(head, 0xdc2626, 1.04, 0.2, 1.04, 0, 0.95, 0); }
    if (k === 'garg') g.scale.setScalar(2.1);
    Object.assign(g.userData, { legL, legR, armL, armR, head, hat, body });
    const bar = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: 0x22c55e })); bar.scale.set(1.5, 0.16, 0.05); bar.position.y = k === 'garg' ? 5 : 4.9; g.add(bar); g.userData.bar = bar;
    return g;
  }
  // the sun: a glowing ball you click
  let haloTex = null;
  function sunModel() {
    if (!haloTex) {
      const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 4, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,240,140,1)'); gr.addColorStop(0.45, 'rgba(253,200,40,.75)'); gr.addColorStop(1, 'rgba(253,200,40,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
      haloTex = new THREE.CanvasTexture(c);
    }
    const g = new THREE.Group();
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false })); s.scale.set(4.2, 4.2, 1); g.add(s); g.userData.hit = s;
    const core = new THREE.Mesh(BALL, mat(0xfde047, true)); core.scale.setScalar(0.85); g.add(core);
    for (let i = 0; i < 8; i++) { const r = new THREE.Mesh(BOX, mat(0xfacc15, true)); r.scale.set(0.22, 0.9, 0.22); const a = (i / 8) * Math.PI * 2; r.position.set(Math.cos(a) * 1.2, Math.sin(a) * 1.2, 0); r.rotation.z = a - Math.PI / 2; g.add(r); }
    return g;
  }
  function coinModel(v) {
    const g = new THREE.Group(), m = new THREE.Mesh(CYL, mat(v > 2 ? 0xfacc15 : 0xd1d5db, true)); m.scale.set(0.8, 0.18, 0.8); m.rotation.x = Math.PI / 2; g.add(m);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, opacity: 0.6 })); s.scale.set(2.6, 2.6, 1); g.add(s); g.userData.hit = s;
    return g;
  }
  function mowerModel() {
    const g = new THREE.Group();
    bx(g, 0xdc2626, 1.8, 0.8, 2.2, 0, 0.75, 0); bx(g, 0x991b1b, 1.4, 0.5, 1.2, 0, 1.35, 0.2);
    for (const [x, z] of [[-0.95, -0.7], [0.95, -0.7], [-0.95, 0.75], [0.95, 0.75]]) bx(g, 0x111111, 0.3, 0.7, 0.7, x, 0.35, z, CYL).rotation.z = Math.PI / 2;
    bx(g, 0x52525b, 0.12, 0.12, 2.2, -0.6, 1.6, 1.8).rotation.x = -0.6; bx(g, 0x52525b, 0.12, 0.12, 2.2, 0.6, 1.6, 1.8).rotation.x = -0.6; bx(g, 0x111111, 1.4, 0.15, 0.15, 0, 2.2, 2.65);
    return g;
  }

  const PZ = {
    noLock: true, // (you look down on the lawn)
    id: 'pvz', code: 'pz', genre: 'Tower Defense', rank: 0.01, name: 'Plants vs Zombies', emoji: '🌻', max: 4, stat: 'Level', killY: -30, banner: true, camDist: 30, camClip: false, noReset: true,
    land: { theme: 'meadow', fence: 'wood' },
    color: 'linear-gradient(135deg,#65a30d,#facc15 55%,#7c2d12)',
    desc: 'Zombies are coming down five lanes of lawn to eat your brains! Collect sun and plant Peashooters, Sunflowers, Wall-nuts, Cherry Bombs, Chompers and more to stop them. Ten levels that each unlock a new plant, then Endless. Co-op for up to 4, sharing the sun.',
    welcome: 'Pick your seeds and a level, then press Ready!',
    build() {
      sky('#7dd3fc', '#e0f2fe');
      slab(0, 0, 12, 90, 140, 0x4d8f32, { sy: 2 }); // the yard (and the street)
      // the lawn: five lanes of nine, in stripes of two greens
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) part({ x: tx(r), y: 0.06, z: tz(c), sx: T, sy: 0.12, sz: T, c: (r + c) % 2 ? 0x6fbf45 : 0x82cf52, solid: false });
      // hedges down the sides, the patio and the house behind, the sidewalk and the street in front
      for (const s of [-1, 1]) { part({ x: s * 17.6, y: 1.6, z: 0, sx: 2, sy: 3.2, sz: 54, c: 0x2f6f2a }); part({ x: s * 17.6, y: 3.3, z: 0, sx: 2.2, sy: 0.4, sz: 54.2, c: 0x3c8a35, plain: true, solid: false }); }
      slab(0, 0.04, 35.5, 38, 17, 0xd6c3a5, { sy: 0.1, plain: true, solid: false });
      slab(0, 0.04, -29, 46, 4, 0xd4d4d8, { sy: 0.1, solid: false });
      slab(0, 0.03, -39, 90, 16, 0x52525b, { sy: 0.1, plain: true, solid: false });
      for (let x = -40; x <= 40; x += 8) part({ x, y: 0.1, z: -39, sx: 4, sy: 0.04, sz: 0.5, c: 0xfacc15, plain: true, solid: false });
      // the house behind you: low, so the camera sees over it (walls, windows, a door, a sloping roof, a chimney)
      const H = (x, y, z, sx, sy, sz, c, o) => part(Object.assign({ x, y, z, sx, sy, sz, c }, o || {}));
      H(0, 2.75, 70, 40, 5.5, 16, 0xf5e6c8); H(0, 5.9, 70, 42, 0.8, 18, 0x9a3412);
      for (let i = 0; i < 4; i++) H(0, 6.7 + i * 0.8, 70, 36 - i * 9, 0.8, 18, 0x9a3412);
      H(0, 2.2, 61.9, 3.6, 4.4, 0.3, 0x7c2d12, { plain: true }); H(-11, 3, 61.9, 6, 2.6, 0.3, 0x93c5fd, { plain: true }); H(11, 3, 61.9, 6, 2.6, 0.3, 0x93c5fd, { plain: true });
      H(9, 8, 74, 2.2, 4, 2.2, 0x7f1d1d);
      slab(0, 0.04, 52.5, 4, 17, 0xd6c3a5, { sy: 0.1, plain: true, solid: false }); // the path to the door
      const sg = label('🌻 PLANTS VS ZOMBIES 🧟', { size: 2.6, color: '#fef08a' }); sg.position.set(0, 15, -50); place.add(sg); // over the street, where they come from
      // across the street: the zombies' side
      for (const x of [-30, -10, 10, 30]) { H(x, 3.5, -56, 14, 7, 10, [0x94a3b8, 0xa8a29e, 0x9ca3af, 0x78716c][(x + 30) / 20]); H(x, 7.6, -56, 15, 1.2, 11, 0x44403c); }
      // the mowers, one per lane
      this.mowers = []; for (let r = 0; r < ROWS; r++) { const m = mowerModel(); m.position.set(tx(r), 0.1, 28.6); place.add(m); this.mowers.push({ g: m, z: 28.6 }); }
      Object.assign(this, { zv: new Map(), pv: new Map(), sv: new Map(), cv: new Map(), peas: [], fxSeen: -1, asked: new Set(), ghost: null, ghostT: -1 });
      this.tile = new THREE.Mesh(new THREE.PlaneGeometry(T - 0.3, T - 0.3), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false, ...DECAL }));
      this.tile.rotation.x = -Math.PI / 2; this.tile.visible = false; place.add(this.tile);
    },
    pres() { return { tq: [], vt: 1, rdy: 0, bl: 0, sb: 0 }; },
    maxSeeds() { return hasItem('slot') ? 7 : 6; }, // (an Extra Seed Slot from the shop)
    async enter() {
      Object.assign(this, { H: null, lastG: null, gSeen: null, q: [], qn: 0, sel: null, shovel: false, ready: false, lobbyShown: false, lastPh: null, camSet: false, ccSeen: null, msgSeen: null, barKey: '' });
      const s = await kvGet('pz');
      this.save = Object.assign({ best: 0, endless: 0, wins: 0, seeds: [0] }, s && typeof s === 'object' ? s : {});
      this.save.seeds = (Array.isArray(this.save.seeds) ? this.save.seeds : [0]).filter((t) => PL[t] && this.unlocked(t)).slice(0, this.maxSeeds());
      send({ sb: hasItem('sun') ? 1 : 0 }); // (the host adds a Sunny Start's sun)
      if (!this.save.seeds.length) this.save.seeds = [0];
      questMax('pvz.lvl', this.save.best | 0);
      this.vote = Math.min(LEVELS, this.save.best + 1);
      send({ vt: this.vote, rdy: 0, bl: this.save.best });
      this.drawBar();
    },
    unlocked(t) { return PL[t].un <= (this.save ? this.save.best : 0); },
    spawn() { return [(Math.random() - 0.5) * 18, 0.5, 33 + Math.random() * 3, 0]; },
    ask(op, ...args) {
      if (iAmHost() && this.H) return this.apply(myPeer(), [op, ...args]);
      this.q.push([++this.qn, op, ...args]); if (this.q.length > 16) this.q.shift();
      send({ tq: this.q.slice() });
    },
    // ------------------------------------------------ the host's game
    adopt() {
      const g = this.lastG;
      if (g && g.ph === 'play') { const H = this.unpack(g); H.seen = {}; return H; }
      return this.fresh();
    },
    fresh() { return { ph: 'lobby', left: 30, gs: 0, lvl: 1, wave: 0, el: 0, sun: 50, z: [], p: [], s: [], c: [], m: [0, 0, 0, 0, 0], pe: [], fx: [], fxN: 0, cd: {}, cc: {}, msg: '', msgN: 0, res: '', nid: 1, q: [], qT: 0, waveT: 0, wHp: 0, wAt: 0, warned: false, kills: 0, sunT: 6, seen: {} }; },
    unpack(g) {
      // the host left mid-game: carry on from what everyone last saw
      const H = Object.assign(this.fresh(), { ph: 'play', left: 0, lvl: g.lvl | 0, wave: g.wave | 0, el: +g.el || 0, sun: g.sun | 0, m: (g.m || [0, 0, 0, 0, 0]).slice(), cd: Object.assign({}, g.cd || {}), cc: Object.assign({}, g.cc || {}), kills: g.kills | 0, waveT: 8, fxN: (g.fx && g.fx.length ? g.fx[g.fx.length - 1][0] : 0) + 1, msgN: g.msgN | 0 });
      for (const z of this.zList(g)) { const d = ZB[z.t], max = d.hp + d.arm; H.z.push({ id: z.id, t: z.t, r: z.r, z: z.z, hp: Math.max(1, z.f * max), arm: z.fl & 4 ? 0 : Math.max(0, z.f * max - d.hp), max, slow: 0, pole: !!(z.fl & 8), jump: 0, smash: 0, angry: z.t === 5 && !!(z.fl & 4) }); }
      for (const p of g.p || []) if (Array.isArray(p) && PL[p[1]]) H.p.push({ id: p[0], t: p[1], r: p[2], c: p[3], hp: Math.max(1, (p[4] / 63) * PL[p[1]].hp), cdS: 1, sunT: 10, arm: p[5] & 1 ? 0 : 8, chew: p[5] & 2 ? 20 : 0, fuse: p[5] & 4 ? 0.5 : PL[p[1]].k === 'cherry' ? 1.2 : PL[p[1]].k === 'jal' ? 1 : 0, squash: 0 });
      for (const s of g.s || []) if (Array.isArray(s)) H.s.push({ id: s[0], x: s[1], z: s[2], born: s[3], k: s[4] });
      for (const c of g.c || []) if (Array.isArray(c)) H.c.push({ id: c[0], x: c[1], z: c[2], v: c[3], born: H.el });
      H.nid = 1 + Math.max(0, ...H.z.map((z) => z.id), ...H.p.map((p) => p.id), ...H.s.map((s) => s.id), ...H.c.map((c) => c.id));
      H.wHp = H.z.reduce((a, z) => a + z.hp, 0); H.wAt = H.el;
      return H;
    },
    apply(peer, req) {
      const H = this.H, [op, ...a] = req;
      if (H.ph !== 'play') return;
      if (op === 'plant') {
        const [t, r, c] = a, d = PL[t];
        if (!d || !(r >= 0 && r < ROWS && c >= 0 && c < COLS) || H.p.some((p) => p.r === r && p.c === c) || H.sun < d.cost) return;
        const cd = H.cd[peer] || (H.cd[peer] = {}); if ((cd[t] || 0) > H.el + 0.05) return;
        H.sun -= d.cost; cd[t] = +(H.el + d.cd).toFixed(1);
        H.p.push({ id: H.nid++ % 4000, t, r, c, hp: d.hp, cdS: d.k === 'rep' || d.k === 'pea' || d.k === 'snow' || d.k === 'three' ? 0.6 : 0, sunT: 6 + Math.random() * 4, arm: d.k === 'mine' ? 14 : 0, chew: 0, fuse: d.k === 'cherry' ? 1.2 : d.k === 'jal' ? 1 : 0, squash: 0 });
      } else if (op === 'dig') {
        const i = H.p.findIndex((p) => p.r === a[0] && p.c === a[1]); if (i >= 0) H.p.splice(i, 1);
      } else if (op === 'sun') {
        const i = H.s.findIndex((s) => s.id === a[0]); if (i >= 0) { H.sun = Math.min(9990, H.sun + 25); H.s.splice(i, 1); }
      } else if (op === 'coin') {
        const i = H.c.findIndex((s) => s.id === a[0]); if (i >= 0) { H.cc[peer] = (H.cc[peer] || 0) + H.c[i].v; H.c.splice(i, 1); }
      }
    },
    host(dt) {
      // real time, not the frame's step (that's capped, so a slow computer would slow the whole lawn down for everyone)
      const t = performance.now(); dt = this.hostT && t - this.hostT < 2000 ? (t - this.hostT) / 1000 : dt; this.hostT = t;
      const H = this.H, pl = players();
      H.left = Math.max(0, H.left - dt);
      for (const p of pl) { // requests from everyone
        if (p.me) continue;
        const seen = H.seen[p.peer] || { t: 0, n: 0 };
        if (p.pr.t !== seen.t) { seen.t = p.pr.t; seen.n = 0; }
        for (const r of Array.isArray(p.pr.tq) ? p.pr.tq : []) { if (!Array.isArray(r) || !(r[0] > seen.n)) continue; seen.n = r[0]; this.apply(p.peer, r.slice(1)); }
        H.seen[p.peer] = seen;
      }
      if (H.ph === 'lobby') {
        const ready = pl.filter((p) => (p.me ? this.ready : p.pr.rdy)).length;
        if (ready === pl.length && pl.length && H.left > 3) H.left = 3;
        if (H.left <= 0) {
          const votes = {}; for (const p of pl) { const v = p.me ? this.vote : p.pr.vt; if (v >= 0 && v <= LEVELS) votes[v] = (votes[v] || 0) + 1; }
          const lvl = +(Object.keys(votes).sort((a, b) => votes[b] - votes[a] || a - b)[0] || 1);
          const s = this.fresh(); s.seen = H.seen;
          Object.assign(H, s, { ph: 'play', lvl, sun: (lvl === 1 ? 150 : 75) + 25 * (pl.length - 1) + 75 * pl.filter((p) => (p.me ? hasItem('sun') : p.pr && p.pr.sb === 1)).length, waveT: lvl === 1 ? 24 : 20, waves: wavesOf(lvl), msgN: H.msgN + 1, msg: 'ready' });
          // the slow seeds start recharging, the rest are ready
          for (const p of pl) { H.cd[p.peer] = {}; PL.forEach((d, t) => { if (d.cd >= 30 && d.k !== 'nut') H.cd[p.peer][t] = d.cd * 0.6; }); }
        }
      } else if (H.ph === 'play') for (let k = Math.ceil(dt / 0.1), i = 0; i < k && H.ph === 'play'; i++) this.sim(H, dt / k, pl); // in small steps
      else if (H.ph === 'end' && H.left <= 0) { const s = this.fresh(); s.seen = H.seen; s.msgN = H.msgN; Object.assign(H, s); }
      if (!pl.length) return;
      if (performance.now() - (this.sentAt || 0) > 150) { this.sentAt = performance.now(); this.publish(H); }
    },
    fx(H, kind, r, z) { H.fx.push([H.fxN++, kind, r, +z.toFixed(1)]); if (H.fx.length > 28) H.fx.shift(); },
    hurt(H, zb, dmg) { // armour first (cone, bucket, paper, helmet), then the zombie
      if (zb.arm > 0) { zb.arm -= dmg; if (zb.arm < 0) { zb.hp += zb.arm; zb.arm = 0; } if (zb.arm <= 0 && ZB[zb.t].k === 'paper' && !zb.angry) { zb.angry = true; zb.stun = 1.2; } }
      else zb.hp -= dmg;
    },
    sim(H, dt, pl) {
      H.el += dt;
      const lv = H.lvl, n = pl.length, r0 = Math.random;
      // sun falls from the sky (a little faster with more of you)
      H.sunT -= dt;
      if (H.sunT <= 0) { H.sunT = ((lv === 1 ? 5.5 : 7) + r0() * 3.5) / (1 + 0.3 * (n - 1)); H.s.push({ id: H.nid++ % 4000, x: +(tx(0) - 2 + r0() * (T * 4 + 4)).toFixed(1), z: +(tz(8) + r0() * (T * 7)).toFixed(1), born: +H.el.toFixed(1), k: 0 }); }
      H.s = H.s.filter((s) => H.el - s.born < (s.k ? 13 : 20)); H.c = H.c.filter((c) => H.el - c.born < 12);
      // the waves
      const waves = wavesOf(lv), q = H.q;
      H.waveT -= dt;
      const alive = H.z.reduce((a, z) => a + Math.max(0, z.hp) + z.arm, 0);
      if (H.wave > 0 && !q.length && H.el - H.wAt > 6 && alive < H.wHp * 0.35) H.waveT = Math.min(H.waveT, 2.5); // most of this wave is down: the next comes sooner
      if (H.waveT <= 0 && (!waves || H.wave < waves)) {
        const w = H.wave + 1;
        if (flagWave(lv, w) && !H.warned) { H.warned = true; H.waveT = 5; H.msg = w === waves ? 'final' : 'huge'; H.msgN++; }
        else {
          H.wave = w; H.warned = false; H.waveT = flagWave(lv, w) ? 30 : 25;
          const list = waveList(lv, w, r0, n); let last = -1;
          list.forEach((t, i) => { let r = Math.floor(r0() * ROWS); if (r === last) r = (r + 1 + Math.floor(r0() * 4)) % ROWS; last = r; q.push([t, r, t === 1 ? 0 : 0.2 + r0() * (flagWave(lv, w) ? 5 : 7)]); });
          q.sort((a, b) => a[2] - b[2]); H.qT = 0; H.wAt = H.el; H.wHp = list.reduce((a, t) => a + ZB[t].hp + ZB[t].arm, 0) + alive;
        }
      }
      H.qT += dt;
      while (q.length && q[0][2] <= H.qT) { const [t, r] = q.shift(), d = ZB[t]; H.z.push({ id: H.nid++ % 4000, t, r, z: SPAWN - r0() * 3, hp: d.hp, arm: d.arm, max: d.hp + d.arm, slow: 0, pole: t === 3, jump: 0, smash: 0, angry: false, stun: 0 }); }
      // the plants
      const zIn = (r) => H.z.filter((z) => z.r === r && z.hp > 0);
      for (let i = H.p.length - 1; i >= 0; i--) {
        const p = H.p[i], d = PL[p.t], pz = tz(p.c);
        if (d.k === 'sun') { p.sunT -= dt; if (p.sunT <= 0) { p.sunT = 20; H.s.push({ id: H.nid++ % 4000, x: +(tx(p.r) + r0() * 2 - 1).toFixed(1), z: +(pz + 1 + r0()).toFixed(1), born: +H.el.toFixed(1), k: 1 }); } continue; }
        if (d.k === 'pea' || d.k === 'snow' || d.k === 'rep' || d.k === 'three') {
          const lanes = d.k === 'three' ? [p.r - 1, p.r, p.r + 1].filter((r) => r >= 0 && r < ROWS) : [p.r];
          p.cdS -= dt;
          if (p.cdS <= 0 && lanes.some((r) => zIn(r).some((z) => z.z > ONLAWN && z.z < pz + 1))) {
            p.cdS = 1.35;
            for (const r of lanes) { H.pe.push({ r, z: pz - 1.2, snow: d.k === 'snow' }); this.fx(H, d.k === 'snow' ? 1 : 0, r, pz); }
            if (d.k === 'rep') p.second = 0.22;
          }
          if (p.second != null) { p.second -= dt; if (p.second <= 0) { p.second = null; H.pe.push({ r: p.r, z: pz - 1.2 }); this.fx(H, 0, p.r, pz); } }
        } else if (d.k === 'cherry' || d.k === 'jal') {
          p.fuse -= dt;
          if (p.fuse <= 0) {
            for (const z of H.z) if (d.k === 'jal' ? z.r === p.r && z.z > -46 : Math.abs(z.r - p.r) <= 1 && Math.abs(z.z - pz) < T * 1.5 + 1) this.hurt(H, z, BLAST);
            this.fx(H, d.k === 'jal' ? 3 : 2, p.r, pz); H.p.splice(i, 1);
          }
        } else if (d.k === 'mine') {
          if (p.arm > 0) p.arm -= dt;
          else if (zIn(p.r).some((z) => Math.abs(z.z + 0.8 - pz) < 2.2 && !z.jump)) { for (const z of zIn(p.r)) if (Math.abs(z.z - pz) < 3.5) this.hurt(H, z, BLAST); this.fx(H, 4, p.r, pz); H.p.splice(i, 1); }
        } else if (d.k === 'chomp') {
          if (p.chew > 0) p.chew -= dt;
          else { const z = zIn(p.r).find((z) => z.z > pz - T * 1.2 - 1 && z.z < pz + 1.5 && ZB[z.t].k !== 'garg' && !z.jump); if (z) { z.hp = -1e9; z.arm = 0; z.eaten = true; p.chew = 42; this.fx(H, 5, p.r, pz); } }
        } else if (d.k === 'squash') {
          if (p.squash > 0) { p.squash -= dt; if (p.squash <= 0) { for (const z of zIn(p.r)) if (Math.abs(z.z - p.tz) < 2.6) this.hurt(H, z, BLAST); this.fx(H, 6, p.r, p.tz); H.p.splice(i, 1); } }
          else { const z = zIn(p.r).find((z) => z.z > pz - T * 1.15 && z.z < pz + T * 0.8 && !z.jump); if (z) { p.squash = 0.9; p.tz = +(z.z + (z.angry ? 2.5 : 1)).toFixed(1); } }
        }
      }
      // the peas
      for (let i = H.pe.length - 1; i >= 0; i--) {
        const e = H.pe[i], nz = e.z - PEA_SP * dt;
        let hit = null; for (const z of H.z) if (z.r === e.r && z.hp > 0 && z.z + 0.9 >= nz && z.z - 0.9 <= e.z && !(z.jump > 0) && (!hit || z.z > hit.z)) hit = z;
        if (hit) { this.hurt(H, hit, PEA); if (e.snow) hit.slow = 10; H.pe.splice(i, 1); }
        else if (nz < -46) H.pe.splice(i, 1); else e.z = nz;
      }
      // the zombies
      for (const z of H.z) {
        if (z.hp <= 0) continue;
        const d = ZB[z.t]; z.slow = Math.max(0, z.slow - dt); z.stun = Math.max(0, (z.stun || 0) - dt);
        const k = z.slow ? 0.5 : 1;
        if (z.jump > 0) { const s = Math.min(dt, z.jump); z.jump -= s; z.z += (T + 2.2) / 0.9 * s; if (z.jump <= 0) z.pole = false; continue; }
        // a plant in its way? (the first one it's touching)
        const plant = H.p.find((p) => p.r === z.r && z.z + 0.9 >= tz(p.c) - 1.6 && z.z <= tz(p.c) + 1.8 && !(PL[p.t].k === 'mine' && p.arm <= 0) && !(PL[p.t].k === 'squash' && p.squash > 0));
        z.eat = false;
        if (plant) {
          if (z.pole) { z.jump = 0.9; continue; } // the pole vaulter hops over the first plant
          if (d.k === 'garg') { z.smash = (z.smash || 0) + dt; if (z.smash > 1.3) { z.smash = 0; H.p.splice(H.p.indexOf(plant), 1); this.fx(H, 7, z.r, z.z + 2); } continue; }
          z.eat = true; plant.hp -= BITE * k * dt;
          if (plant.hp <= 0) H.p.splice(H.p.indexOf(plant), 1);
          continue;
        }
        z.smash = 0;
        if (z.stun > 0) continue;
        z.z += (z.angry ? 3 : z.t === 3 && !z.pole ? 1.05 : d.sp) * k * dt;
      }
      // the lawn mowers, and the house
      for (let r = 0; r < ROWS; r++) {
        if (H.m[r] !== 0 && H.m[r] !== -99) { // running: everything in front of it in its lane goes
          H.m[r] -= 24 * dt;
          for (const z of H.z) if (z.r === r && z.hp > 0 && z.z > H.m[r] - 1.5) { z.hp = -1; z.arm = 0; }
          if (H.m[r] < -48) H.m[r] = -99;
        }
        const at = H.z.find((z) => z.r === r && z.hp > 0 && z.z > HOUSE - (H.m[r] === 0 ? 1.8 : 0));
        if (!at) continue;
        if (H.m[r] === 0) { H.m[r] = 28.6; this.fx(H, 9, r, 28.6); }
        else if (H.m[r] === -99 && at.z > HOUSE + 1.5) { H.ph = 'end'; H.left = 10; H.res = 'lose'; H.msg = 'brains'; H.msgN++; return; }
      }
      // the fallen: some drop coins
      for (let i = H.z.length - 1; i >= 0; i--) {
        const z = H.z[i]; if (z.hp > 0) continue;
        H.kills++;
        if (!z.eaten && z.z > -30 && z.z < 28) { const v = r0(); if (v < 0.07) H.c.push({ id: H.nid++ % 4000, x: +tx(z.r).toFixed(1), z: +z.z.toFixed(1), v: v < 0.015 ? 10 : 2, born: H.el }); }
        H.z.splice(i, 1);
      }
      // the end of the level
      if (waves && H.wave >= waves && !q.length && !H.z.length && !H.warned) { H.ph = 'end'; H.left = 10; H.res = 'win'; H.msgN++; H.msg = 'win'; }
    },
    publish(H) {
      let zs = '';
      for (const z of H.z.slice(0, 120)) {
        const fl = (z.eat ? 1 : 0) | (z.slow ? 2 : 0) | (z.arm <= 0 && ZB[z.t].arm ? 4 : 0) | (z.pole ? 8 : 0) | (z.jump > 0 ? 16 : 0) | (z.smash > 0 ? 32 : 0);
        zs += AL[z.t] + n2(z.id) + AL[z.r] + n2(clamp(Math.round((z.z + 60) * 30), 0, 4095)) + AL[clamp(Math.round(((Math.max(0, z.hp) + z.arm) / z.max) * 63), 0, 63)] + AL[fl];
      }
      const cd = {}; for (const k in H.cd) { const o = {}; for (const t in H.cd[k]) if (H.cd[k][t] > H.el) o[t] = H.cd[k][t]; cd[k] = o; }
      H.gs = (H.gs || 0) + 1;
      send({ g: {
        ph: H.ph, left: +H.left.toFixed(1), gs: H.gs, el: +H.el.toFixed(1), lvl: H.lvl, wave: H.wave, waves: wavesOf(H.lvl), sun: H.sun, z: zs,
        p: H.p.map((p) => [p.id, p.t, p.r, p.c, clamp(Math.round((p.hp / PL[p.t].hp) * 63), 0, 63), (PL[p.t].k === 'mine' && p.arm <= 0 ? 1 : 0) | (p.chew > 0 ? 2 : 0) | (p.fuse > 0 ? 4 : 0) | (p.squash > 0 ? 8 : 0)].concat(p.squash > 0 ? [p.tz] : [])),
        s: H.s.map((s) => [s.id, s.x, s.z, s.born, s.k]), c: H.c.map((c) => [c.id, c.x, c.z, c.v]), m: H.m.map((v) => (v === 0 || v === -99 ? v : +v.toFixed(1) || 0.1)), // 0 ready, -99 gone, else where it's driving
        fx: H.fx.slice(), cd, cc: Object.assign({}, H.cc), msg: H.msg, msgN: H.msgN, res: H.res, kills: H.kills,
        flag: H.warned ? 1 : 0,
      } });
    },
    // ------------------------------------------------ what everyone sees
    zList(g) {
      const out = [], s = g && typeof g.z === 'string' ? g.z : '';
      if (g && Array.isArray(g.z)) return g.z.map((z) => ({ id: z.id, t: z.t, r: z.r, z: z.z, f: (Math.max(0, z.hp) + z.arm) / z.max, fl: (z.eat ? 1 : 0) | (z.slow ? 2 : 0) | (z.arm <= 0 && ZB[z.t].arm ? 4 : 0) | (z.pole ? 8 : 0) | (z.jump > 0 ? 16 : 0) | (z.smash > 0 ? 32 : 0) })).filter((z) => z.f > 0);
      for (let i = 0; i + 7 < s.length + 1; i += 8) { const t = AL.indexOf(s[i]); if (!ZB[t]) continue; out.push({ t, id: d2(s, i + 1), r: AL.indexOf(s[i + 3]), z: d2(s, i + 4) / 30 - 60, f: AL.indexOf(s[i + 6]) / 63, fl: AL.indexOf(s[i + 7]) }); }
      return out;
    },
    view(g) { // the host has objects; everyone else has the packed form
      if (!g) return null;
      if (g === this.H) {
        return { z: this.zList(g), p: g.p.map((p) => [p.id, p.t, p.r, p.c, (p.hp / PL[p.t].hp) * 63, (PL[p.t].k === 'mine' && p.arm <= 0 ? 1 : 0) | (p.chew > 0 ? 2 : 0) | (p.fuse > 0 ? 4 : 0) | (p.squash > 0 ? 8 : 0), p.tz]),
          s: g.s.map((s) => [s.id, s.x, s.z, s.born, s.k]), c: g.c.map((c) => [c.id, c.x, c.z, c.v]) };
      }
      return { z: this.zList(g), p: (g.p || []).filter(Array.isArray), s: (g.s || []).filter(Array.isArray), c: (g.c || []).filter(Array.isArray) };
    },
    spOf(t, fl) { return fl & 1 || fl & 32 ? 0 : (fl & 16 ? (T + 2.2) / 0.9 : t === 3 && !(fl & 8) ? 1.05 : t === 5 && fl & 4 ? 3 : ZB[t].sp) * (fl & 2 ? 0.5 : 1); },
    tick(dt) {
      const g = this.g = roundState(this);
      if (!this.camSet) { this.camSet = true; cam.pitch = -0.6; }
      this.drawWorld(g, dt);
      this.drawUI(g);
      if (g && g.ph === 'end' && this.lastPh && this.lastPh !== 'end') this.finish(g);
      if (g && g.ph !== 'lobby') this.lobbyShown = false;
      if (g && g.ph === 'play' && this.lastPh === 'lobby') { this.sel = null; this.shovel = false; sfx('go'); }
      if (g) this.lastPh = g.ph;
    },
    drawWorld(g, dt) {
      const v = this.view(g) || { z: [], p: [], s: [], c: [] }, now = performance.now() / 1000, el = g ? +g.el || 0 : 0;
      // zombies: they walk on between updates
      const keep = new Set();
      for (const z of v.z) {
        keep.add(z.id);
        let m = this.zv.get(z.id);
        if (!m || m.t !== z.t) { if (m) place.remove(m.g); m = { g: zombieModel(z.t), t: z.t, z: z.z, fl: -1 }; place.add(m.g); this.zv.set(z.id, m); m.g.position.x = tx(z.r); m.ph = Math.random() * 6; }
        m.z = Math.abs(m.z - z.z) > 6 ? z.z : m.z + this.spOf(z.t, z.fl) * dt;
        if (m.lastZ !== z.z) { m.lastZ = z.z; m.z += (z.z - m.z) * 0.5; }
        m.r = z.r; m.f = z.f;
        const U = m.g.userData, eat = z.fl & 1, jump = z.fl & 16;
        m.g.position.set(tx(z.r), jump ? Math.sin(Math.min(1, (now - (m.jumpAt || now)) / 0.9) * Math.PI) * 4 : 0.1, m.z);
        if (jump && !m.jumpAt) { m.jumpAt = now; sfx3('jump', tx(z.r), m.z, 60, { vol: 0.6 }); } if (!jump) m.jumpAt = 0;
        const w = eat || z.fl & 32 ? 0 : Math.sin(now * (z.t === 6 || (z.t === 3 && z.fl & 8) ? 9 : 4.5) + m.ph) * 0.45;
        U.legL.rotation.x = w; U.legR.rotation.x = -w; U.body.rotation.z = Math.sin(now * 2.2 + m.ph) * 0.06;
        U.head.rotation.x = eat ? Math.sin(now * 14) * 0.25 : 0.12;
        if (ZB[z.t].k !== 'garg' && ZB[z.t].k !== 'flag') U.armL.rotation.x = U.armR.rotation.x = eat ? -1.35 + Math.sin(now * 14) * 0.3 : -1.35;
        if (U.club) U.club.rotation.x = z.fl & 32 ? -2.6 + Math.min(2.4, (now % 1.3) * 3) : -0.2;
        if (z.fl & 4 && !m.armless) { m.armless = true; U.hat.visible = false; if (U.paper) { U.paper.visible = false; sfx3('break', tx(z.r), m.z, 60); } else if (ZB[z.t].arm) { puffAt(tx(z.r), 4.4, m.z, ZB[z.t].k === 'cone' ? 0xf97316 : ZB[z.t].k === 'foot' ? 0xb91c1c : 0x9ca3af, 6); sfx3('hit', tx(z.r), m.z, 60, { vol: 0.6 }); } }
        if (U.pole) U.pole.visible = !!(z.fl & 8);
        if (eat && !m.eating) sfx3('chomp', tx(z.r), m.z, 50, { vol: 0.5, gap: 400 }); m.eating = eat;
        U.bar.scale.x = 1.5 * clamp(z.f, 0.02, 1); U.bar.position.x = -(1 - clamp(z.f, 0, 1)) * 0.75; U.bar.material.color.set(z.f > 0.5 ? 0x22c55e : z.f > 0.25 ? 0xfacc15 : 0xef4444);
        const blue = !!(z.fl & 2); if (blue !== m.blue) { m.blue = blue; m.g.traverse((o) => { if (o.isMesh && o !== U.bar) { if (!o.userData.base) o.userData.base = o.material; o.material = blue ? (o.userData.blue || (o.userData.blue = new THREE.MeshLambertMaterial({ color: o.userData.base.color.clone().lerp(new THREE.Color(0x60a5fa), 0.45) }))) : o.userData.base; } }); }
      }
      for (const [id, m] of this.zv) if (!keep.has(id)) {
        place.remove(m.g); this.zv.delete(id);
        m.g.traverse((o) => { if (o.userData.blue) o.userData.blue.dispose(); }); m.g.userData.bar.material.dispose();
        const x = m.g.position.x, z = m.g.position.z;
        puffAt(x, 2.5, z, [SKIN, COAT, 0x52525b], 12); sfx3('pop', x, z, 70, { vol: 0.5, gap: 60 });
        this.head(x, z); // the head rolls off
      }
      // plants
      const pk = new Set();
      for (const p of v.p) {
        const [id, t, r, c, hp, st, ptz] = p; pk.add(id);
        let m = this.pv.get(id);
        if (!m) { m = { g: plantModel(t), t, r, c, born: now }; m.g.position.set(tx(r), 0.12, tz(c)); place.add(m.g); this.pv.set(id, m); if (this.sndOn) { sfx3('seed', tx(r), tz(c), 70); puffAt(tx(r), 0.6, tz(c), 0x7c5a2b, 6); } }
        const U = m.g.userData, k = PL[t].k, grow = Math.min(1, (now - m.born) / 0.25);
        m.g.scale.setScalar(0.4 + 0.6 * grow);
        if (U.head && k !== 'chomp') U.head.rotation.x = Math.sin(now * 2 + id) * 0.08;
        if (k === 'sun') U.head.rotation.z = Math.sin(now * 1.6 + id) * 0.12;
        if (k === 'nut' && U.cracks) { U.cracks[0].visible = hp < 44; U.cracks[1].visible = hp < 28; U.cracks[2].visible = hp < 16; }
        if (k === 'mine') { const armed = st & 1; U.body.position.y = armed ? 0 : -1.25; U.light.material = mat(armed && Math.floor(now * 3) % 2 ? 0xef4444 : 0x7f1d1d, true); if (armed && !m.armed) sfx3('pop', tx(r), tz(c), 50, { vol: 0.4 }); m.armed = armed; }
        if (k === 'chomp') { const chew = st & 2; U.belly.visible = !!chew; U.top.rotation.x = chew ? Math.sin(now * 5) * 0.08 : -0.25 - Math.max(0, Math.sin(now * 1.5 + id)) * 0.35; }
        if ((k === 'cherry' || k === 'jal') && st & 4) { const s = 1 + (now - m.born) * 0.35; m.g.scale.setScalar(Math.min(1.5, s)); m.g.position.x = tx(r) + Math.sin(now * 40) * 0.08; }
        if (k === 'squash') { if (st & 8 && ptz != null) { m.jumpAt = m.jumpAt || now; const f = Math.min(1, (now - m.jumpAt) / 0.9); m.g.position.z = tz(c) + (ptz - tz(c)) * f; m.g.position.y = 0.12 + Math.sin(f * Math.PI) * 6; } }
        m.hp = hp;
      }
      for (const [id, m] of this.pv) if (!pk.has(id)) { place.remove(m.g); this.pv.delete(id); if (this.sndOn && !['cherry', 'jal', 'mine', 'squash'].includes(PL[m.t].k)) { sfx3('crunch', m.g.position.x, m.g.position.z, 60, { vol: 0.6 }); puffAt(m.g.position.x, 1.5, m.g.position.z, 0x22c55e, 6); } }
      // sun and coins
      const sk = new Set();
      for (const s of v.s) {
        const [id, x, z, born, k] = s; if (this.asked.has('s' + id)) continue; sk.add(id);
        let m = this.sv.get(id); if (!m) { m = { g: sunModel(), id }; m.g.userData.sid = id; m.g.traverse((o) => (o.userData.sid = id)); place.add(m.g); this.sv.set(id, m); }
        const age = Math.max(0, el - born), y = k ? 1.6 + Math.sin(Math.min(1, age / 0.9) * Math.PI) * 3.5 + Math.max(0, 1 - age / 0.9) * 1.5 : Math.max(1.6, 26 - age * 4.2);
        m.g.position.set(x, y + Math.sin(now * 2 + id) * 0.15, z); m.g.rotation.z = now * 0.8; m.g.children[1].rotation.y = now;
        const fade = (k ? 13 : 20) - age; m.g.visible = fade > 2.5 || Math.floor(now * 6) % 2 === 0;
        m.x = x; m.z = z; m.y = y;
      }
      for (const [id, m] of this.sv) if (!sk.has(id)) { place.remove(m.g); this.sv.delete(id); }
      const ck = new Set();
      for (const c of v.c) {
        const [id, x, z, val] = c; if (this.asked.has('c' + id)) continue; ck.add(id);
        let m = this.cv.get(id); if (!m) { m = { g: coinModel(val) }; m.g.traverse((o) => (o.userData.cid = id)); place.add(m.g); this.cv.set(id, m); sfx3('coin', x, z, 60, { vol: 0.4 }); }
        m.g.position.set(x, 1.4 + Math.sin(now * 3 + id) * 0.2, z); m.g.children[0].rotation.z = now * 3; m.x = x; m.z = z;
      }
      for (const [id, m] of this.cv) if (!ck.has(id)) { place.remove(m.g); this.cv.delete(id); }
      // walk into sun or a coin to pick it up
      if (g && g.ph === 'play' && !P.dead) {
        const reach = hasItem('magnet') ? 6 : 2.6; // (a Sun Magnet)
        for (const [id, m] of this.sv) if (Math.hypot(m.x - P.x, m.z - P.z) < reach && m.y < 6) this.grab('sun', id);
        for (const [id, m] of this.cv) if (Math.hypot(m.x - P.x, m.z - P.z) < reach) this.grab('coin', id);
      }
      // shots, booms and mowers
      if (g && Array.isArray(g.fx)) for (const f of g.fx) {
        if (!Array.isArray(f) || f[0] <= this.fxSeen) continue;
        this.fxSeen = f[0]; if (!this.sndOn) continue;
        const [, kind, r, z] = f, x = tx(r);
        if (kind <= 1) { const m = new THREE.Mesh(BALL, mat(kind ? 0x93c5fd : 0x65a30d)); m.scale.setScalar(0.38); m.position.set(x, 2.3, z - 1.4); place.add(m); this.peas.push({ m, r, snow: kind }); sfx3('shoot', x, z, 50, { vol: 0.25, gap: 40 }); }
        else if (kind === 2 || kind === 4) { puffAt(x, 2, z, [0xef4444, 0xf97316, 0x111111, 0xfde047], kind === 2 ? 40 : 22); sfx3('explode', x, z, 120); }
        else if (kind === 3) { for (let zz = -26; zz <= 26; zz += 3) puffAt(x, 1.5, zz, [0xef4444, 0xf97316, 0xfde047], 4); sfx3('boom', x, z, 120); }
        else if (kind === 5) sfx3('chomp', x, z, 70);
        else if (kind === 6 || kind === 7) { puffAt(x, 0.5, z, [0x7c5a2b, 0x65a30d], 14); sfx3('crash', x, z, 90, { vol: 0.8 }); }
        else if (kind === 9) sfx3('engine', x, z, 120, { vol: 0.7 });
      }
      this.fxSeen = Math.max(this.fxSeen, g && Array.isArray(g.fx) && g.fx.length ? g.fx[g.fx.length - 1][0] : this.fxSeen);
      for (let i = this.peas.length - 1; i >= 0; i--) {
        const e = this.peas[i]; e.m.position.z -= PEA_SP * dt;
        let hit = false; for (const m of this.zv.values()) if (m.r === e.r && Math.abs(m.g.position.z - e.m.position.z) < 0.9 && !(m.jumpAt)) { hit = true; break; }
        if (hit || e.m.position.z < -46) { place.remove(e.m); this.peas.splice(i, 1); if (hit) { puffAt(e.m.position.x, 2.3, e.m.position.z, e.snow ? 0xbfdbfe : 0x84cc16, 3); sfx3('hit', e.m.position.x, e.m.position.z, 40, { vol: 0.25, gap: 50 }); } }
      }
      // mowers
      const ms = g && Array.isArray(g.m) ? g.m : [0, 0, 0, 0, 0];
      this.mowers.forEach((m, r) => { const s = +ms[r] || 0; m.g.visible = s !== -99; const want = s === 0 ? 28.6 : s; m.z = Math.abs(m.z - want) > 8 || s === 0 ? want : m.z - 24 * dt + (want - m.z) * 0.2; m.g.position.z = m.z; });
      // planting: the tile under the mouse, and a ghost of the plant
      const live = g && g.ph === 'play', hv = live && this.hoverAt && (this.sel != null || this.shovel) ? this.tileAt(this.hoverAt.x, this.hoverAt.z) : null;
      this.tile.visible = !!hv;
      if (hv) {
        const taken = v.p.some((p) => p[2] === hv[0] && p[3] === hv[1]), ok = this.shovel ? taken : !taken && this.canAfford(g, this.sel);
        this.tile.position.set(tx(hv[0]), 0.2, tz(hv[1])); this.tile.material.color.set(ok ? (this.shovel ? 0xfbbf24 : 0xffffff) : 0xef4444);
      }
      if (this.ghost && (this.ghostT !== this.sel || !hv || this.shovel)) { place.remove(this.ghost); this.ghost.traverse((o) => { if (o.material) o.material.dispose(); }); this.ghost = null; }
      if (hv && this.sel != null && !this.shovel) {
        if (!this.ghost) { this.ghostT = this.sel; this.ghost = plantModel(this.sel); this.ghost.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.45; } }); place.add(this.ghost); }
        this.ghost.position.set(tx(hv[0]), 0.12, tz(hv[1]));
      }
      this.sndOn = true; // (not on the first frame: everything already there would make a noise)
    },
    head(x, z) { // a zombie's head falls off and rolls away (the engine's flying bits: in the scene, with a material of its own)
      const m = new THREE.Mesh(BOX, new THREE.MeshLambertMaterial({ color: SKIN })); m.scale.setScalar(0.9); m.position.set(x, 3.8, z); m.userData = { v: new THREE.Vector3((Math.random() - 0.5) * 6, 6, 3 + Math.random() * 3), life: 1.1 };
      scene.add(m); bits.push(m);
    },
    tileAt(x, z) { const r = Math.round(x / T) + 2, c = Math.round((Z0 - z) / T); return r >= 0 && r < ROWS && c >= 0 && c < COLS ? [r, c] : null; },
    // ------------------------------------------------ seeds, sun and the bar
    myCd(g, t) { const cd = g && g.cd && g.cd[myPeer()]; return cd && cd[t] ? Math.max(0, cd[t] - (+g.el || 0)) : 0; },
    canAfford(g, t) { return g && t != null && g.sun >= PL[t].cost && this.myCd(g, t) <= 0; },
    drawBar() {
      const g = this.g, live = g && g.ph === 'play', sun = g ? g.sun | 0 : 0;
      const html = `<button class="xslot info pz-sun" title="Sun"><span class="e">☀️</span><b>${live ? sun : '—'}</b></button>`
        + this.save.seeds.map((t, i) => {
          const d = PL[t], cd = live ? this.myCd(g, t) : 0, f = cd > 0 ? Math.ceil((cd / d.cd) * 20) * 5 : 0;
          return `<button class="xslot ${this.sel === t ? 'on' : ''}" data-t="${t}" ${!live || sun < d.cost || cd > 0 ? 'disabled' : ''} title="${d.n} — ${d.d}"><span class="k">${i + 1}</span><span class="e">${d.e}</span>${d.n}<span class="n">☀️${d.cost}</span>${f ? `<i class="pz-cd" style="height:${f}%"></i>` : ''}</button>`;
        }).join('')
        + `<button class="xslot ${this.shovel ? 'on' : ''}" data-dig="1" ${live ? '' : 'disabled'} title="Shovel: dig up a plant (X)"><span class="k">X</span><span class="e">⛏️</span>Shovel</button>`;
      setBar(html, (b) => { if (b.dataset.dig) this.pick(null, true); else if (b.dataset.t != null) this.pick(+b.dataset.t); });
    },
    pick(t, dig) {
      if (dig) { this.shovel = !this.shovel; this.sel = null; }
      else { this.shovel = false; this.sel = this.sel === t ? null : t; if (this.sel != null) sfx('select'); }
      this.drawBar();
    },
    grab(kind, id) {
      const key = (kind === 'sun' ? 's' : 'c') + id; if (this.asked.has(key)) return;
      this.asked.add(key); this.ask(kind, id); sfx(kind === 'sun' ? 'point' : 'coin', { vol: 0.7 });
      const m = (kind === 'sun' ? this.sv : this.cv).get(id); if (m) { puffAt(m.g.position.x, m.g.position.y, m.g.position.z, kind === 'sun' ? 0xfde047 : 0xfacc15, 6); place.remove(m.g); (kind === 'sun' ? this.sv : this.cv).delete(id); }
      if (this.asked.size > 300) this.asked = new Set([...this.asked].slice(-150));
    },
    key(code, down) {
      if (!down) return false;
      const m = /^Digit([1-7])$/.exec(code);
      if (m) { const t = this.save.seeds[+m[1] - 1]; if (t != null) this.pick(t); return true; }
      if (code === 'KeyX') { this.pick(null, true); return true; }
      if (code === 'Escape' && (this.sel != null || this.shovel)) { this.sel = null; this.shovel = false; this.drawBar(); return true; }
      return false;
    },
    hover(e) { this.hoverAt = pickPlane(e.x, e.y, 0); },
    click(e) {
      const g = this.g; if (!g || g.ph !== 'play') return;
      // sun and coins first: click one to pick it up
      const hit = pickObjects(e.x, e.y, [...this.sv.values()].map((m) => m.g).concat([...this.cv.values()].map((m) => m.g)));
      if (hit) { const u = hit.object.userData; if (u.sid != null) return this.grab('sun', u.sid); if (u.cid != null) return this.grab('coin', u.cid); }
      if (this.sel == null && !this.shovel) return;
      const h = pickPlane(e.x, e.y, 0), at = h && this.tileAt(h.x, h.z); if (!at) return;
      const taken = this.view(g).p.some((p) => p[2] === at[0] && p[3] === at[1]);
      if (this.shovel) { if (!taken) return; this.ask('dig', at[0], at[1]); sfx('dig'); this.shovel = false; this.drawBar(); return; }
      const d = PL[this.sel];
      if (taken) { sfx('error'); return toast('There’s already a plant there', '#fca5a5'); }
      if (g.sun < d.cost) { sfx('error'); return toast('Not enough sun! ☀️', '#fde68a'); }
      if (this.myCd(g, this.sel) > 0) { sfx('error'); return toast(`${d.n} is still recharging`, '#fca5a5'); }
      this.ask('plant', this.sel, at[0], at[1]);
      if (!keys.ShiftLeft && !keys.ShiftRight) this.sel = null;
      this.drawBar();
    },
    // ------------------------------------------------ banners, the lobby, the end
    drawUI(g) {
      if (!g) return setBanner('Connecting to the lawn…');
      if (g.ph === 'lobby') {
        setBanner(`🌻 Pick your seeds and a level · starts in ${Math.ceil(g.left)}`);
        if (!this.lobbyShown && !panelOpen()) { this.lobbyShown = true; this.openLobby(); } // once per lobby: closing it keeps it closed
      } else if (g.ph === 'play') {
        const waves = g.waves | 0, f = waves ? clamp(g.wave / waves, 0, 1) : 0;
        const flags = waves ? Array.from({ length: waves }, (_, i) => (flagWave(g.lvl, i + 1) ? `<u style="left:${((i + 1) / waves) * 100}%">🚩</u>` : '')).join('') : '';
        const zc = this.zList(g).length;
        setBanner(`${g.lvl ? `Level ${g.lvl}` : '🔁 Endless'} · ${g.wave ? `Wave ${g.wave}${waves ? '/' + waves : ''}` : 'The zombies are coming…'}${waves ? `<span class="pz-prog"><span class="bar"><i style="width:${f * 100}%"></i>${flags}</span></span>` : ''} · 🧟 ${zc}`);
      } else setBanner(g.res === 'win' ? `🏆 ${g.lvl ? `Level ${g.lvl} complete!` : 'Well played!'}` : `🧠 The zombies ate your brains! ${g.lvl ? `(level ${g.lvl}, wave ${g.wave})` : `You lasted ${g.wave} waves`}`);
      if (g.ph !== 'lobby' && this.panelKind === 'lobby') { closePanel(); this.panelKind = null; }
      // big news: a huge wave, the final wave, the end
      if (g.msgN !== this.msgSeen) {
        if (this.msgSeen != null && g.msg) {
          if (g.msg === 'huge') { toast('A huge wave of zombies is approaching!', '#f87171'); sfx('horn'); }
          else if (g.msg === 'final') { toast('FINAL WAVE', '#f87171'); sfx('horn'); }
          else if (g.msg === 'ready') { toast('Ready… Set… PLANT!', '#86efac'); }
          else if (g.msg === 'brains') { toast('THE ZOMBIES ATE YOUR BRAINS!', '#f87171'); }
        }
        this.msgSeen = g.msgN;
      }
      // coins you picked up
      const cc = g.cc ? g.cc[myPeer()] | 0 : 0;
      if (g.ph !== 'play' || this.ccSeen == null) this.ccSeen = g.ph === 'play' ? cc : 0;
      else if (cc > this.ccSeen) { earn(cc - this.ccSeen, 'coins on the lawn'); this.ccSeen = cc; }
      // the bar: redrawn when the sun or a recharge changes
      const key = [g.ph, g.sun, this.sel, this.shovel, ...this.save.seeds.map((t) => Math.ceil((this.myCd(g, t) / PL[t].cd) * 20))].join();
      if (key !== this.barKey) { this.barKey = key; this.drawBar(); }
    },
    openLobby() {
      const S = this.save, best = S.best;
      const lv = Array.from({ length: LEVELS }, (_, i) => i + 1).map((n) => `<button data-lv="${n}" class="${this.vote === n ? 'on' : ''}" ${n > best + 1 ? 'disabled' : ''}>${n <= best ? '⭐' : n > best + 1 ? '🔒' : ''}${n}</button>`).join('');
      const html = `<p class="xp-note">🧟 Zombies are coming down five lanes to eat your brains. Vote for a level, choose up to ${this.maxSeeds()} seeds and press Ready. The sun is shared; each of you has your own seed packets.</p>
        <h4>🗺️ Level</h4><div class="pz-lv">${lv}</div>
        <button class="xp-btn ${this.vote === 0 ? '' : 'alt'}" data-lv="0" style="width:100%" ${best >= 5 ? '' : 'disabled'}>🔁 Endless${best >= 5 ? (S.endless ? ` · best ${S.endless} waves` : '') : ' · beat level 5'}</button>
        <button class="xp-btn ${this.ready ? 'alt' : ''}" data-ready="1" style="width:100%;padding:13px;font-size:17px;margin-top:8px">${this.ready ? '✅ Ready' : 'Ready'}</button>
        <h4>🌱 Seeds <small style="color:var(--muted);font:700 12px var(--fb)">— ${S.seeds.length}/${this.maxSeeds()} picked</small></h4>
        <div class="xp-grid pz-seeds">${PL.map((d, t) => { const has = this.unlocked(t), on = S.seeds.includes(t); return `<div class="xp-card ${on ? 'on' : ''} ${has ? '' : 'locked'}"><div class="big">${has ? d.e : '🔒'}</div><b>${d.n}</b><span>☀️ ${d.cost} · ${d.cd}s</span><span style="font-weight:600;color:#94a3b8">${has ? d.d : `Beat level ${d.un} to unlock`}</span>${has ? `<button class="xp-btn ${on ? 'alt' : ''}" data-seed="${t}">${on ? 'Remove' : 'Pick'}</button>` : ''}</div>`; }).join('')}</div>`;
      openPanel('🌻 Plants vs Zombies', html, (b) => {
        if (b.dataset.lv != null) { this.vote = +b.dataset.lv; send({ vt: this.vote }); }
        else if (b.dataset.ready) { this.ready = !this.ready; send({ rdy: this.ready ? 1 : 0 }); }
        else if (b.dataset.seed != null) { const t = +b.dataset.seed, i = S.seeds.indexOf(t); if (i >= 0) { if (S.seeds.length > 1) S.seeds.splice(i, 1); } else { if (S.seeds.length >= this.maxSeeds()) S.seeds.shift(); S.seeds.push(t); } kvSet('pz', S); this.drawBar(); }
        this.openLobby();
      }, () => { this.panelKind = null; });
      this.panelKind = 'lobby';
    },
    finish(g) {
      const S = this.save, win = g.res === 'win';
      sfx(win ? 'win' : 'lose');
      if (g.lvl) {
        if (win) {
          S.wins = (S.wins | 0) + 1; questMax('pvz.lvl', g.lvl);
          if (g.lvl > S.best) {
            S.best = g.lvl; const nu = PL.findIndex((d) => d.un === g.lvl);
            if (nu >= 0) { if (S.seeds.length < this.maxSeeds()) S.seeds.push(nu); setTimeout(() => toast(`🌱 You got a new plant: ${PL[nu].n}!`, '#86efac'), 1600); }
            else setTimeout(() => toast('🏆 You beat every level! Try Endless.', '#fde68a'), 1600);
            this.vote = Math.min(LEVELS, S.best + 1);
          }
          earn(20 + g.lvl * 6, `beat level ${g.lvl}`); puffAt(P.x, P.y + 3, P.z, CONFETTI, 60);
        } else earn(g.wave * 2, `held out ${g.wave} waves`);
      } else { S.endless = Math.max(S.endless | 0, g.wave); earn(g.wave * 3, `lasted ${g.wave} waves`); }
      kvSet('pz', S);
      this.ready = false; send({ rdy: 0, bl: S.best, vt: this.vote });
      this.sel = null; this.shovel = false;
    },
    prompts() { const g = this.g; return g && g.ph === 'lobby' ? [{ x: 0, z: 34, r: 30, text: 'Seeds & level', fn: () => this.openLobby() }] : []; },
    hud() { const g = this.g; return g && g.ph === 'play' ? (touchy ? (this.shovel ? '⛏️ Tap a plant to dig it up' : this.sel != null ? `${PL[this.sel].e} Tap the lawn to plant a ${PL[this.sel].n}` : 'Pick a seed and tap the lawn · tap ☀️ sun to collect it') : this.shovel ? '⛏️ Click a plant to dig it up (Esc to stop)' : this.sel != null ? `${PL[this.sel].e} Click the lawn to plant a ${PL[this.sel].n} (Shift to plant more)` : 'Pick a seed (1–6) and click the lawn · click ☀️ sun to collect it') : ''; },
    statOf(pr) { return pr && pr.bl ? `⭐ ${pr.bl}` : '—'; },
    sortKey(pr) { return (pr && pr.bl) | 0; },
    menu() { return [['🌱 Seeds & level', () => this.openLobby()]]; },
    leave() { this.sel = null; this.shovel = false; this.zv = new Map(); this.pv = new Map(); this.sv = new Map(); this.cv = new Map(); this.peas = []; this.ghost = null; },
    coinShop: [
      { id: 'sun', e: '☀️', n: 'Sunny Start', d: 'Every game starts with 75 more sun (for everyone), for good', price: 500, kind: 'pass' },
      { id: 'slot', e: '🌱', n: 'Extra Seed Slot', d: 'Take 7 seeds into a game instead of 6, for good', price: 600, kind: 'pass' },
      { id: 'magnet', e: '🧲', n: 'Sun Magnet', d: 'Pick up sun and coins from further away, for good', price: 400, kind: 'pass' },
    ],
    onBuy(id) { if (id === 'sun') send({ sb: 1 }); },
  };
  addExp(PZ);
  window.__rbPZ = Object.assign(PZ, { PL, ZB, waveList, wavesOf, tx, tz });
})();
