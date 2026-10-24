/* =====================================================================
   BLOXVERSE — RIVALS. Duels: step onto a pad in the lobby (1v1 or 2v2)
   and when the other side fills up you're off to an arena (on your own,
   a bot takes the empty spots after a few seconds). Everyone has 100
   health and one life a round; the first team to win 5 rounds wins the
   match. Pick a loadout (a primary, a secondary, a melee and a utility)
   and unlock more weapons with Blox Coins; try them on the dummies in
   the practice range. The host runs the pads, the rounds and the bots,
   and checks every hit: the shooter says who they hit and with what,
   and the host decides the damage.
   ===================================================================== */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    #rvCross{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;pointer-events:none;display:none;transition:transform .08s}
    #rvCross::before,#rvCross::after{content:'';position:absolute;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.6)}
    #rvCross::before{left:14px;top:3px;width:2px;height:24px}#rvCross::after{top:14px;left:3px;height:2px;width:24px}
    #rvCross.hit{transform:rotate(45deg) scale(.85)}#rvCross.hit::before,#rvCross.hit::after{background:#f87171}
    #rvCross.head::before,#rvCross.head::after{background:#facc15}
    .rv-dmg{position:absolute;transform:translate(-50%,-50%);font:700 21px var(--fh);color:#fff;-webkit-text-stroke:4px rgba(10,12,18,.7);paint-order:stroke fill;pointer-events:none;animation:rvDmg .8s ease-out forwards}
    .rv-dmg.head{color:#facc15;font-size:25px}
    @keyframes rvDmg{0%{opacity:1;margin-top:0}100%{opacity:0;margin-top:-50px}}
    #rvHurt{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 42%,rgba(220,38,38,.6));opacity:0;transition:opacity .4s}
    #rvFlash{position:absolute;inset:0;pointer-events:none;background:#fff;opacity:0}
    #rvScope{position:absolute;inset:0;pointer-events:none;display:none}
    #rvFeed{position:absolute;right:12px;bottom:calc(var(--barH,84px) + 72px);display:flex;flex-direction:column;gap:4px;align-items:flex-end;pointer-events:none}
    #rvFeed div{padding:5px 11px;border-radius:10px;background:rgba(15,23,42,.74);font:700 13px var(--fb);color:#e2e8f0;animation:rvIn .2s ease-out}
    #rvFeed div.mine{background:rgba(30,64,175,.82)}#rvFeed div.died{background:rgba(127,29,29,.82)}
    #rvFeed .a{color:#93c5fd}#rvFeed .e{color:#fca5a5}
    @keyframes rvIn{from{transform:translateX(30px);opacity:0}}
    #rvBig{position:absolute;left:50%;top:30%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;font:700 58px/1.05 var(--fh);letter-spacing:.03em;-webkit-text-stroke:8px rgba(10,12,18,.72);paint-order:stroke fill;text-shadow:0 6px 0 rgba(0,0,0,.3);white-space:nowrap}
    #rvBig small{display:block;font-size:22px;-webkit-text-stroke:5px rgba(10,12,18,.72);margin-top:8px;color:#e2e8f0}
    #rvBig.pop{animation:rvPop .45s cubic-bezier(.2,1.6,.5,1)}
    @keyframes rvPop{from{transform:translate(-50%,-50%) scale(.3);opacity:0}}
    .rv-hp{display:inline-block;width:150px;height:14px;border-radius:8px;background:rgba(0,0,0,.5);overflow:hidden;vertical-align:-2px;margin-right:7px;box-shadow:inset 0 1px 2px rgba(0,0,0,.5)}
    .rv-hp i{display:block;height:100%;border-radius:8px;transition:width .2s}
    .rv-sb{display:inline-flex;gap:9px;align-items:center}
    .rv-sb b{font-size:24px}.rv-sb .t0{color:#60a5fa}.rv-sb .t1{color:#f87171}
    .rv-sb i{font-style:normal;font-size:13px;color:#cbd5e1}.rv-sb u{text-decoration:none;opacity:.3}
    .rv-st{font-size:11px;color:#94a3b8}
    .xslot small{display:block;font-size:10.5px;color:#fde68a;margin-top:2px}
    @media (max-width:640px){#rvFeed{display:none}#rvBig{font-size:38px}.rv-nm,.rv-ft{display:none}.rv-sb b{font-size:20px}}`;
  document.head.append(style);

  /* ---------------- the weapons ---------------- */
  // sl: 0 primary, 1 secondary, 2 melee, 3 utility · dmg a hit (hs: times that for the head) · rate: shots a second ·
  // sp: spread (zsp: zoomed in) · rng: range · fall: damage falls off past this · price in Blox Coins
  const WP = {
    ar: { n: 'Assault Rifle', e: '🔫', sl: 0, dmg: 16, hs: 1.5, rate: 9, mag: 30, rl: 2, sp: 0.022, rng: 170, auto: 1, price: 0, d: 'Full auto. Good at any range.' },
    burst: { n: 'Burst Rifle', e: '🎯', sl: 0, dmg: 20, hs: 1.5, rate: 2.6, burst: 3, bgap: 0.075, mag: 24, rl: 2.1, sp: 0.012, rng: 180, price: 250, d: 'Three shots a pull, very accurate.' },
    shotgun: { n: 'Shotgun', e: '💥', sl: 0, dmg: 10, hs: 1.3, pel: 8, rate: 1.15, mag: 5, rl: 2.4, sp: 0.085, rng: 70, fall: 12, price: 300, d: 'Eight pellets. Deadly up close.' },
    sniper: { n: 'Sniper', e: '🔭', sl: 0, dmg: 70, hs: 2.2, rate: 0.75, mag: 5, rl: 2.6, sp: 0.035, zsp: 0.0015, rng: 320, price: 500, d: 'Hold right-click to scope in. A headshot kills.' },
    minigun: { n: 'Minigun', e: '🌀', sl: 0, dmg: 8, hs: 1.4, rate: 18, mag: 150, rl: 4, sp: 0.05, rng: 150, auto: 1, spin: 0.55, price: 800, d: 'Spins up, then never stops. Slows you down.' },
    handgun: { n: 'Handgun', e: '🔫', sl: 1, dmg: 19, hs: 1.6, rate: 5, mag: 12, rl: 1.4, sp: 0.012, rng: 150, price: 0, d: 'Quick and reliable.' },
    revolver: { n: 'Revolver', e: '🤠', sl: 1, dmg: 42, hs: 1.5, rate: 1.6, mag: 6, rl: 2.2, sp: 0.008, rng: 180, price: 200, d: 'Six big shots.' },
    uzi: { n: 'Uzi', e: '⚡', sl: 1, dmg: 10, hs: 1.4, rate: 14, mag: 25, rl: 1.5, sp: 0.045, rng: 110, auto: 1, fall: 20, price: 250, d: 'Sprays fast up close.' },
    fists: { n: 'Fists', e: '🥊', sl: 2, dmg: 22, rate: 3, rng: 5, melee: 1, run: 18, price: 0, d: 'Quick punches.' },
    knife: { n: 'Knife', e: '🔪', sl: 2, dmg: 35, rate: 2.2, rng: 5.5, melee: 1, run: 20, price: 150, d: 'Run faster with it out.' },
    katana: { n: 'Katana', e: '🗡️', sl: 2, dmg: 50, rate: 1.4, rng: 7, melee: 1, run: 18, price: 400, d: 'A long, wide slash.' },
    scythe: { n: 'Scythe', e: '🌙', sl: 2, dmg: 65, rate: 0.9, rng: 8.5, melee: 1, run: 17, price: 600, d: 'Slow, huge reach, huge damage.' },
    grenade: { n: 'Grenade', e: '💣', sl: 3, uses: 2, fuse: 1.8, price: 0, d: 'Two a round. Blows up after a moment.' },
    medkit: { n: 'Medkit', e: '🩹', sl: 3, uses: 1, price: 200, d: 'Heals 50, once a round (takes a second).' },
    flash: { n: 'Flashbang', e: '🌟', sl: 3, uses: 2, fuse: 1.3, price: 250, d: 'Blinds anyone looking at it.' },
    smoke: { n: 'Smoke Grenade', e: '💨', sl: 3, uses: 2, fuse: 1.1, price: 200, d: 'A cloud nobody can see through.' },
  };
  const START = ['ar', 'handgun', 'fists', 'grenade'];
  const SLOTS = ['Primary', 'Secondary', 'Melee', 'Utility'];
  const TO = 5, PRE = 3.2, ROUND_T = 100, BOT_WAIT = 6, NADE_R = 11, NADE_DMG = 95, SMOKE_T = 12, SMOKE_R = 7;
  const BOT_NAMES = ['Viper', 'Nova', 'Turbo', 'Ghost', 'Rex', 'Pixel', 'Zed', 'Kai', 'Blaze', 'Echo', 'Jinx', 'Ace'];
  const BOT_W = ['ar', 'ar', 'burst', 'shotgun', 'sniper', 'ar'];
  const BOT_RANGE = { ar: 24, burst: 26, shotgun: 7, sniper: 46, minigun: 20, uzi: 12 };
  const isBot = (id) => typeof id === 'string' && id.startsWith('bot:');

  /* ---------------- the places ---------------- */
  const AW = 28, AL = 48, SPZ = 33, WALL = 20, BAL = 21; // an arena's half width (x) and half length (z); where each team starts (±z, with room behind for the camera); the spectators' balcony floor
  const ARENAS = [{ n: '🏙️ Crossroads', x: -120, z: -200 }, { n: '⚓ Dockyard', x: 0, z: -200 }, { n: '🏛️ Temple', x: 120, z: -200 }];
  const PAD_W = 18, PAD_D = 9;
  const PADS = [{ md: 1, x: -30, z: 20 }, { md: 1, x: 0, z: 20 }, { md: 2, x: 30, z: 20 }]; // (the arenas are the other way: behind you as you face the pads)
  const KIOSK = { x: -40, z: 8 };
  const DUMMIES = [[-14, -27], [0, -27], [14, -27]];

  /* ---------------- looks ---------------- */
  const MC = new Map(), mat = (c) => { if (!MC.has(c)) MC.set(c, new THREE.MeshLambertMaterial({ color: c })); return MC.get(c); };
  // a weapon to hold: the barrel along -z, the grip at the middle
  function model(wid) {
    const g = new THREE.Group(), b = (c, sx, sy, sz, x, y, z) => { const o = new THREE.Mesh(BOX, mat(c)); o.scale.set(sx, sy, sz); o.position.set(x, y, z); g.add(o); return o; };
    if (wid === 'ar' || wid === 'burst') {
      const body = wid === 'ar' ? 0x1f2937 : 0xa16207;
      b(body, 0.3, 0.45, 1.6, 0, 0.12, -0.45); b(0x111827, 0.14, 0.14, 0.8, 0, 0.18, -1.6); b(0x374151, 0.22, 0.6, 0.3, 0, -0.35, -0.6);
      b(body, 0.26, 0.42, 0.6, 0, 0.05, 0.6); b(0x111827, 0.22, 0.5, 0.25, 0, -0.25, 0.1); if (wid === 'burst') b(0x111827, 0.12, 0.12, 0.9, 0, 0.42, -0.4);
    } else if (wid === 'shotgun') { b(0x6b7280, 0.18, 0.18, 1.9, 0, 0.16, -0.95); b(0x7c2d12, 0.28, 0.24, 0.6, 0, -0.04, -1.0); b(0x7c2d12, 0.28, 0.42, 0.85, 0, 0.0, 0.4); b(0x374151, 0.26, 0.3, 0.6, 0, 0.1, -0.2); }
    else if (wid === 'sniper') { b(0x111827, 0.26, 0.36, 1.8, 0, 0.1, -0.5); b(0x111827, 0.1, 0.1, 1.4, 0, 0.16, -2.0); b(0x334155, 0.2, 0.22, 0.85, 0, 0.42, -0.5); b(0x065f46, 0.28, 0.45, 0.8, 0, 0.0, 0.62); }
    else if (wid === 'minigun') { b(0x374151, 0.6, 0.6, 1.0, 0, 0.05, -0.1); for (const [x, y] of [[-0.14, 0.2], [0.14, 0.2], [-0.14, -0.08], [0.14, -0.08]]) b(0x111827, 0.12, 0.12, 1.5, x, y, -1.3); b(0x9ca3af, 0.5, 0.5, 0.12, 0, 0.06, -1.9); b(0xfacc15, 0.3, 0.35, 0.4, 0.4, -0.15, 0); }
    else if (wid === 'handgun') { b(0x1f2937, 0.22, 0.3, 0.9, 0, 0.1, -0.3); b(0x111827, 0.2, 0.5, 0.24, 0, -0.2, 0.02); }
    else if (wid === 'revolver') { b(0x9ca3af, 0.14, 0.14, 1.0, 0, 0.14, -0.62); b(0x6b7280, 0.3, 0.3, 0.36, 0, 0.1, -0.1); b(0x7c2d12, 0.2, 0.55, 0.26, 0, -0.22, 0.08); }
    else if (wid === 'uzi') { b(0x27272a, 0.24, 0.4, 0.85, 0, 0.12, -0.25); b(0x111827, 0.16, 0.85, 0.2, 0, -0.45, -0.1); b(0x111827, 0.1, 0.1, 0.35, 0, 0.18, -0.85); }
    else if (wid === 'fists') b(0xdc2626, 1.15, 1.15, 1.15, 0, 0, 0);
    else if (wid === 'knife') { b(0x1f2937, 0.22, 0.26, 0.9, 0, 0, -0.3); b(0x6b7280, 0.5, 0.2, 0.16, 0, 0, -0.78); b(0xe5e7eb, 0.07, 0.34, 1.6, 0, 0, -1.6); }
    else if (wid === 'katana') { b(0x111827, 0.2, 0.2, 0.9, 0, 0, 0.05); b(0xfacc15, 0.62, 0.14, 0.14, 0, 0, -0.42); b(0xe5e7eb, 0.07, 0.28, 3.1, 0, 0, -2.05); }
    else if (wid === 'scythe') { b(0x78350f, 0.18, 0.18, 4.4, 0, 0, -1.0); const bl = b(0xd1d5db, 0.08, 0.3, 2.2, 0, 0.8, -3.0); bl.rotation.x = 1.2; bl.position.set(0, 0.9, -3.05); }
    else if (wid === 'grenade') { const s = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), mat(0x3f6212)); g.add(s); g.userData.own = [s.geometry]; b(0x9ca3af, 0.12, 0.22, 0.12, 0, 0.4, 0); }
    else if (wid === 'medkit') { b(0xf8fafc, 0.95, 0.7, 0.5, 0, 0, 0); b(0xdc2626, 0.55, 0.16, 0.52, 0, 0, 0); b(0xdc2626, 0.16, 0.5, 0.52, 0, 0, 0); }
    else if (wid === 'flash') { b(0x9ca3af, 0.42, 0.7, 0.42, 0, 0, 0); b(0x111827, 0.44, 0.12, 0.44, 0, 0.2, 0); }
    else if (wid === 'smoke') { b(0x6b7280, 0.42, 0.75, 0.42, 0, 0, 0); b(0x22c55e, 0.44, 0.14, 0.44, 0, 0.1, 0); }
    return g;
  }
  const dropModel = (o) => { if (!o) return; if (o.parent) o.parent.remove(o); for (const geo of o.userData.own || []) geo.dispose(); };

  const RV = {
    ownFov: true, // (scoping in; it starts from the engine's, which sprinting widens)
    id: 'rivals', code: 'rv', genre: 'PvP', rank: 0.005, name: 'Rivals', emoji: '🎯', max: 12, stat: 'Wins', killY: -40, banner: true, camDist: 16, noReset: true, respawnDelay: 2500,
    land: { theme: 'meadow', mode: 'sky', low: -100 },
    color: 'linear-gradient(135deg,#1d4ed8,#7c3aed 55%,#dc2626)',
    desc: 'Competitive duels. Step onto a 1v1 or 2v2 pad and fight in an arena: 100 health, one life a round, first team to 5 rounds wins. Build your loadout (assault rifle, shotgun, sniper, minigun, katana, grenades, flashbangs and more) and unlock weapons with Blox Coins. Bots play you when nobody else is around.',
    welcome: 'Stand on a duel pad to fight! 🎒 L changes your loadout · try your weapons on the dummies behind you.',
    welcomeTouch: 'Stand on a duel pad to fight! Try your weapons on the dummies behind you.',
    build() {
      sky('#3b82f6', '#dbeafe');
      const blk = (x, y0, z, sx, sy, sz, c, o) => part(Object.assign({ x, y: y0 + sy / 2, z, sx, sy, sz, c }, o || {}));
      const flat = (x, z, sx, sz, c, y = 0.03) => part({ x, y, z, sx, sy: 0.06, sz, c, plain: true, solid: false });
      // a floating island's rocky underside
      const rock = (x, z, sx, sz) => { blk(x, -11, z, sx - 4, 8, sz - 4, 0x6b5b4b, { solid: false }); blk(x, -19, z, sx * 0.62, 8, sz * 0.62, 0x57493c, { solid: false }); blk(x, -26, z, sx * 0.3, 7, sz * 0.3, 0x473b31, { solid: false }); };
      const sign = (t, x, y, z, o) => { const l = label(t, Object.assign({ size: 1.6 }, o || {})); l.position.set(x, y, z); place.add(l); return l; };
      /* the lobby: a plaza in the sky */
      slab(0, 0, 3, 100, 74, 0x334155, { sy: 3 }); rock(0, 3, 100, 74);
      flat(0, 3, 92, 66, 0x475569);
      flat(0, 7, 34, 22, 0x64748b, 0.05);
      for (const [x, z, sx, sz] of [[0, -34.5, 101, 1], [0, 40.5, 101, 1], [-50.5, 3, 1, 75], [50.5, 3, 1, 75]]) blk(x, 0, z, sx, 2.2, sz, 0x1e293b);
      sign('⚔️ RIVALS', 0, 14, 40, { size: 5, color: '#ffffff' });
      // the duel pads: blue side on the left, red on the right, a spot each (two on the 2v2 pad)
      this.spots = []; this.padLab = []; this.padTxt = [];
      PADS.forEach((pd, i) => {
        blk(pd.x, 0, pd.z, PAD_W + 1.4, 0.3, PAD_D + 1.4, 0x0f172a);
        const sp = [[], []];
        for (const s of [0, 1]) {
          const cx = pd.x + (s ? 1 : -1) * (PAD_W / 4 + 0.2);
          flat(cx, pd.z, PAD_W / 2 - 0.4, PAD_D, s ? 0x7f1d1d : 0x1e3a8a, 0.33);
          for (let k = 0; k < pd.md; k++) {
            const m = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: s ? 0xef4444 : 0x3b82f6, transparent: true, opacity: 0.35 }));
            m.scale.set(3, 0.08, 3); m.position.set(cx + (pd.md > 1 ? (k ? 2.2 : -2.2) : 0), 0.4, pd.z); m.userData.own = true; place.add(m); sp[s].push(m);
          }
          blk(pd.x + (s ? 1 : -1) * (PAD_W / 2 + 0.3), 0, pd.z, 0.5, 5, 0.5, 0x0f172a); blk(pd.x + (s ? 1 : -1) * (PAD_W / 2 + 0.3), 5, pd.z, 0.9, 0.9, 0.9, s ? 0xef4444 : 0x3b82f6, { neon: true });
        }
        flat(pd.x, pd.z, 0.4, PAD_D, 0xf8fafc, 0.34);
        this.spots.push(sp);
        sign(pd.md === 1 ? '⚔️ 1v1' : '⚔️ 2v2', pd.x, 8.5, pd.z, { size: 2.2, color: '#ffffff' });
        this.padLab.push(null);
      });
      // the loadout kiosk
      blk(KIOSK.x - 3, 0, KIOSK.z, 2, 6, 10, 0x1d4ed8); blk(KIOSK.x - 1, 0, KIOSK.z, 2, 2.4, 10, 0xe2e8f0); blk(KIOSK.x - 3, 6, KIOSK.z, 4, 0.6, 11, 0x1e40af);
      sign('🎒 LOADOUT', KIOSK.x - 2, 9, KIOSK.z, { size: 1.6, color: '#bfdbfe' });
      // the practice range
      flat(0, -16, 60, 0.6, 0xfacc15, 0.06);
      for (const [x, z] of DUMMIES) flat(x, z, 4, 4, 0x1f2937, 0.06);
      sign('🎯 PRACTICE RANGE', 0, 11, -33, { size: 1.5, color: '#fde68a' });
      // lamps and planters
      for (const [x, z] of [[-46, -30], [46, -30], [-46, 36], [46, 36]]) { blk(x, 0, z, 0.5, 8, 0.5, 0x1e293b); blk(x, 8, z, 1.6, 0.8, 1.6, 0xfef3c7, { neon: true }); }
      for (const [x, z] of [[-16, 8], [16, 8], [-30, -6], [30, -6]]) { blk(x, 0, z, 4, 1.2, 4, 0x78350f); blk(x, 1.2, z, 3, 3, 3, 0x16a34a); }
      /* the arenas */
      this.abox = [];
      ARENAS.forEach((A, ai) => {
        const n0 = parts.length, X = A.x, Z = A.z;
        const sym = (fn) => { fn(1); fn(-1); };
        const theme = [{ floor: 0x4b5563, wall: 0x9a3412 }, { floor: 0x9ca3af, wall: 0x475569 }, { floor: 0xd6b98c, wall: 0xa98a5b }][ai];
        slab(X, 0, Z, AW * 2 + 2, AL * 2 + 2, theme.floor, { sy: 3 }); rock(X, Z, AW * 2 + 2, AL * 2 + 2);
        blk(X, 0, Z - AL - 0.5, AW * 2 + 2, WALL, 1, theme.wall); blk(X, 0, Z + AL + 0.5, AW * 2 + 2, WALL, 1, theme.wall);
        blk(X - AW - 0.5, 0, Z, 1, WALL, AL * 2, theme.wall); blk(X + AW + 0.5, 0, Z, 1, WALL, AL * 2, theme.wall);
        flat(X, Z + SPZ, 20, 6, 0x1d4ed8, 0.05); flat(X, Z - SPZ, 20, 6, 0xb91c1c, 0.05);
        for (const s of [1, -1]) { part({ x: X, y: 9, z: Z + s * (AL - 0.08), sx: 22, sy: 8, sz: 0.1, c: s > 0 ? 0x1d4ed8 : 0xb91c1c, plain: true, solid: false }); part({ x: X, y: 9, z: Z + s * (AL - 0.16), sx: 4, sy: 4, sz: 0.1, c: 0xf8fafc, neon: true, solid: false }); } // each team's colours on its end wall
        if (ai === 0) { // Crossroads: a city street
          flat(X - AW + 3, Z, 6, AL * 2, 0x9ca3af); flat(X + AW - 3, Z, 6, AL * 2, 0x9ca3af);
          for (let z = -AL + 5; z < AL - 4; z += 6) if (Math.abs(z) > 5) flat(X, Z + z, 0.4, 3, 0xfacc15, 0.05);
          for (let x = -10; x <= 10; x += 2.5) flat(X + x, Z, 1.2, 6, 0xf8fafc, 0.05);
          const car = (x, z, alongZ, c) => { const [sx, sz] = alongZ ? [4.4, 8] : [8, 4.4]; blk(x, 0.6, z, sx, 2, sz, c); blk(x, 2.6, z, alongZ ? 3.8 : 4.2, 1.5, alongZ ? 4.2 : 3.8, 0x1e293b); for (const a of [-1, 1]) for (const b of [-1, 1]) blk(x + a * (sx / 2 - 0.9), 0, z + b * (sz / 2 - 1.2), alongZ ? 0.5 : 1.2, 1.1, alongZ ? 1.2 : 0.5, 0x111827); };
          sym((s) => {
            blk(X - s * 17, 0, Z + s * 20, 10, 12, 10, 0xb45309); blk(X - s * 17, 12, Z + s * 20, 10.6, 0.6, 10.6, 0x7c2d12);
            for (const y of [3, 7.5]) part({ x: X - s * 17, y, z: Z + s * 14.94, sx: 7, sy: 2.4, sz: 0.1, c: 0x93c5fd, plain: true, solid: false });
            car(X + s * 9, Z + s * 14, true, s > 0 ? 0xdc2626 : 0x2563eb); car(X - s * 7, Z + s * 3, false, 0xf59e0b);
            blk(X + s * 18, 0, Z + s * 27, 3, 3, 3, 0xa16207); blk(X + s * 19, 3, Z + s * 27, 3, 3, 3, 0x92400e);
            blk(X + s * 2, 0, Z + s * 11, 8, 2.6, 1.4, 0xd1d5db);
            blk(X - s * 20, 0, Z + s * 4, 4, 6.5, 4, 0x065f46); blk(X - s * 20, 6.5, Z + s * 4, 5, 0.5, 5, 0x064e3b);
            blk(X, 0, Z + s * 29, 12, 6.5, 1.5, 0x6b7280);
            for (const z of [10, -14]) { blk(X + s * (AW - 1.5), 0, Z + s * z, 0.4, 9, 0.4, 0x374151); blk(X + s * (AW - 2.3), 9, Z + s * z, 2, 0.5, 1, 0xfef3c7, { neon: true }); }
          });
          blk(X, 0, Z, 7, 1.6, 7, 0x94a3b8); blk(X, 1.6, Z, 2, 4.6, 2, 0xcbd5e1); part({ x: X, y: 1.62, z: Z, sx: 6.2, sy: 0.05, sz: 6.2, c: 0x38bdf8, plain: true, solid: false });
        } else if (ai === 1) { // Dockyard: shipping containers
          for (const z of [-AL + 8, AL - 8]) flat(X, Z + z, AW * 2 - 4, 0.5, 0xfacc15, 0.05);
          const box = (x, z, alongZ, c, y0 = 0) => { blk(x, y0, z, alongZ ? 6 : 14, 6.4, alongZ ? 14 : 6, c); blk(x, y0 + 6.4, z, alongZ ? 6.2 : 14.2, 0.2, alongZ ? 14.2 : 6.2, 0x1f2937, { plain: true }); };
          sym((s) => {
            box(X - s * 15, Z + s * 19, true, 0xb91c1c); box(X + s * 9, Z + s * 22, false, 0x1d4ed8);
            box(X - s * 3, Z + s * 7, false, 0x15803d); box(X - s * 3, Z + s * 7, false, 0xc2410c, 6.6);
            box(X + s * 19, Z + s * 2, true, 0x0e7490);
            blk(X - s * 21, 0, Z + s * 4, 3.2, 3.2, 3.2, 0xa16207); blk(X + s * 3, 0, Z + s * 15, 4, 3, 4, 0x92400e);
            blk(X + s * 12, 0, Z + s * 10, 2, 3, 2, 0x1e40af); blk(X + s * 14, 0, Z + s * 11, 2, 3, 2, 0x1e40af);
            blk(X, 0, Z + s * 29, 12, 6.5, 1.5, 0x334155);
          });
          blk(X, 0, Z, 4, 5, 4, 0x78350f);
          // a crane outside
          blk(X - AW - 9, 0, Z - 10, 2, 34, 2, 0xfacc15, { solid: false }); blk(X - AW + 3, 34, Z - 10, 26, 1.5, 1.5, 0xfacc15, { solid: false }); blk(X - AW + 14, 22, Z - 10, 0.2, 12, 0.2, 0x111827, { solid: false });
        } else { // Temple: ruins round a raised altar
          sym((s) => {
            blk(X - s * 12, 0, Z + s * 14, 2.6, 10, 2.6, 0xe7d3a8); blk(X + s * 12, 0, Z + s * 14, 2.6, 10, 2.6, 0xe7d3a8);
            blk(X - s * 16, 0, Z + s * 24, 10, 5.8, 1.6, 0xb08d57); blk(X - s * 21.5, 0, Z + s * 24, 2, 7.5, 1.6, 0xb08d57);
            blk(X + s * 14, 0, Z + s * 22, 9, 3.2, 2, 0x3f6212);
            blk(X + s * 20, 0, Z + s * 6, 2, 6.5, 8, 0xb08d57);
            blk(X - s * 22, 0, Z + s * 8, 3, 3, 3, 0xcbb88f); blk(X - s * 22, 3, Z + s * 8, 1.6, 2, 1.6, 0xe7d3a8);
            blk(X, 0, Z + s * 29, 12, 6.5, 1.5, 0x92400e);
            blk(X, 0, Z + s * 7.5, 8, 1, 2, 0xcbb88f);
            for (const z of [12, -18]) { blk(X + s * (AW - 0.5), 6.6, Z + s * z, 0.6, 1.6, 0.6, 0x3f2a14); blk(X + s * (AW - 0.6), 8.2, Z + s * z, 0.8, 1, 0.8, 0xf97316, { neon: true }); }
          });
          blk(X, 0, Z, 12, 2, 12, 0xcbb88f); blk(X, 2, Z, 2, 7, 2, 0xe5e7eb); blk(X, 9, Z, 2.6, 0.6, 2.6, 0xfacc15);
        }
        // the spectators' balcony, looking in over the east wall
        const bx = X + AW + 7;
        slab(bx, BAL, Z, 11, 40, 0x1e293b, { sy: 1 });
        for (const [x, z, sx, sz] of [[X + AW + 1.4, Z, 0.4, 40], [bx + 5.3, Z, 0.4, 40], [bx, Z - 20, 11, 0.4], [bx, Z + 20, 11, 0.4]]) part({ x, y: BAL + 4.5, z, sx, sy: 9, sz, c: 0x93c5fd, alpha: 0.16, plain: true });
        sign(A.n, X, WALL + 6, Z - AL - 1, { size: 2.4, color: '#ffffff' });
        // what blocks shots and bots in here
        this.abox[ai] = parts.slice(n0).filter((p) => p.solid && p.y + p.sy / 2 > 0.4 && Math.abs(p.x - X) < AW + 2 && Math.abs(p.z - Z) < AL + 2).map(boxOf);
      });
    },
    pres() { return { tq: [], hd: '', lo: START.slice(), sh: null, gn: null, rw: 0 }; },
    async enter() {
      Object.assign(this, { H: null, lastG: null, gSeen: null, g: null, mm: null, rkey: '', evN: null, q: [], qn: 0, cur: 0, ammo: {}, uses: {}, rl: null, next: 0, burstQ: 0, spin: 0, healT: 0, swingT: 0, faceT: 0, ads: false, zoom: 0, blind: 0, shake: 0, hold: null, firing: false, mouse: null, shotN: 0, gnN: 0, nades: [], fx: [], held: new Map(), botAv: new Map(), tags: new Map(), smokes: new Map(), localSm: [], shSeen: new Map(), gnSeen: new Map(), swingOf: new Map(), smN: 0, wasAlive: true, lastHp: 100, mk: 0, barKey: '' });
      this.fov0 = camera.fov;
      this.seen = new Map(); this.bs = new Map(); this.tok = new Map();
      $('#xhud').insertAdjacentHTML('beforeend', '<div id="rvHurt"></div><div id="rvFlash"></div><div id="rvScope"></div><div id="rvFeed"></div><div id="rvBig"></div><div id="rvCross"></div><div id="rvDmg"></div>');
      // the practice dummies
      this.dummies = DUMMIES.map(([x, z], i) => { const a = makeAvatar(okAv([4, 7, 5, 0, 0, 0, 0, 0, 0, 0]), '🎯 Dummy', false); a.g.position.set(x, 0, z); scene.add(a.g); return { id: 'dummy:' + i, a, x0: x, z, hurtT: 0 }; });
      const s = await kvGet('rv');
      this.save = Object.assign({ own: START.slice(), lo: START.slice(), wins: 0, kills: 0, played: 0 }, s && typeof s === 'object' ? s : {});
      questMax('rivals.win', this.save.wins | 0); questMax('rivals.kill', this.save.kills | 0);
      if (!Array.isArray(this.save.own)) this.save.own = START.slice();
      for (const id of START) if (!this.save.own.includes(id)) this.save.own.push(id);
      this.save.lo = SLOTS.map((t, sl) => { const id = Array.isArray(this.save.lo) ? this.save.lo[sl] : null; return WP[id] && WP[id].sl === sl && this.save.own.includes(id) ? id : START[sl]; });
      send({ lo: this.save.lo.slice(), rw: this.save.wins | 0, hd: this.cw() });
      this.drawBar();
    },
    leave() {
      for (const a of this.botAv.values()) dropAvatar(a);
      for (const d of this.dummies || []) dropAvatar(d.a);
      for (const h of this.held.values()) dropModel(h.m);
      for (const n of this.nades) { scene.remove(n.m); dropModel(n.m); }
      for (const f of this.fx) { scene.remove(f.m); if (f.m.geometry) f.m.geometry.dispose(); if (f.m.material) f.m.material.dispose(); }
      for (const t of this.tags.values()) scene.remove(t.g);
      for (const c of this.smokes.values()) scene.remove(c.g);
      Object.assign(this, { botAv: new Map(), dummies: [], held: new Map(), nades: [], fx: [], tags: new Map(), smokes: new Map() });
      camera.fov = this.fov0 || 70; camera.updateProjectionMatrix();
      P.frozen = false;
    },
    save: null,
    cw() { return (this.save ? this.save.lo : START)[this.cur]; },
    spawn() {
      const g = this.g, mine = myPeer(), m = this.matchOf(g, mine);
      if (m) {
        const A = ARENAS[m.ar], team = m.tm[0].includes(mine) ? 0 : 1;
        if ((m.al || []).includes(mine)) { const i = Math.max(0, m.tm[team].indexOf(mine)), n = m.tm[team].length; return [A.x + (i - (n - 1) / 2) * 8, 0.5, A.z + (team ? -1 : 1) * SPZ, team ? Math.PI : 0]; }
        return [A.x + AW + 7, BAL + 0.6, A.z + (Math.random() - 0.5) * 24, Math.PI / 2]; // out this round: watch from the balcony
      }
      return [(Math.random() - 0.5) * 16, 0.5, Math.random() * 5, Math.PI]; // facing the pads
    },
    matchOf(g, id) { return g && Array.isArray(g.M) ? g.M.find((m) => m.tm[0].includes(id) || m.tm[1].includes(id)) || null : null; },
    speed() {
      const W = WP[this.cw()] || WP.ar;
      if (this.healT > 0) return 8;
      if (W.spin && this.spin > 0.05) return 10;
      if (this.ads) return W === WP.sniper ? 9 : 12;
      return W.melee ? W.run : 16;
    },

    /* ---------------- the host: pads, matches, bots, and checking every hit ---------------- */
    adopt() {
      const g = this.lastG;
      this.bs = new Map(); this.tok = new Map(); this.seen = new Map();
      // whatever everyone had already asked for before I took over doesn't count again
      for (const p of players()) if (!p.me && Array.isArray(p.pr.tq)) this.seen.set(p.peer, { t: p.pr.t, n: Math.max(0, ...p.pr.tq.map((r) => (Array.isArray(r) ? +r[0] || 0 : 0))) });
      const pq = PADS.map(() => ({ s: [[], []], t: -1, w: 0 }));
      if (g && Array.isArray(g.M)) { const H = JSON.parse(JSON.stringify(g)); H.pq = pq; H.ev = H.ev || []; this.evSeq = Math.max(this.evSeq || 0, ...H.ev.map((e) => e[0])); return H; }
      return { gs: 0, left: 0, M: [], pq, nm: 0, nb: 0, ev: [] };
    },
    ev(e) { const H = this.H; this.evSeq = (this.evSeq || 0) + 1; H.ev = (H.ev || []).concat([[this.evSeq].concat(e)]).slice(-12); },
    host(dt) {
      // real time, not the frame's step (that's capped, so a slow computer would slow every match down)
      const t = performance.now(); dt = this.hostT && t - this.hostT < 2000 ? (t - this.hostT) / 1000 : dt; this.hostT = t;
      const H = this.H, pl = this.pl = players();
      for (const p of pl) { // what everyone asked for: hits, grenades, medkits
        if (p.me) continue;
        const seen = this.seen.get(p.peer) || { t: 0, n: 0 };
        if (p.pr.t !== seen.t) { seen.t = p.pr.t; seen.n = 0; }
        for (const r of Array.isArray(p.pr.tq) ? p.pr.tq : []) { if (!Array.isArray(r) || !(r[0] > seen.n)) continue; seen.n = r[0]; this.apply(p.peer, r.slice(1)); }
        this.seen.set(p.peer, seen);
      }
      const n = Math.max(1, Math.ceil(dt / 0.1));
      for (let k = 0; k < n; k++) { this.pads(dt / n, pl); for (const m of H.M.slice()) this.runMatch(m, dt / n, pl); }
      for (const m of H.M) this.packBots(m);
      if (t - (this.sentAt || 0) > 100) { this.sentAt = t; hostSend(this); }
    },
    pads(dt, pl) {
      const H = this.H, busy = new Set(H.M.flatMap((m) => m.tm[0].concat(m.tm[1])));
      H.pq.forEach((q, i) => {
        const pd = PADS[i], on = [[], []];
        for (const p of pl) {
          if (busy.has(p.peer) || Math.abs(p.z - pd.z) > PAD_D / 2 + 0.6 || p.y > 3 || p.y < -1) continue;
          const dx = p.x - pd.x; if (Math.abs(dx) > PAD_W / 2 + 0.6 || Math.abs(dx) < 0.3) continue;
          on[dx < 0 ? 0 : 1].push(p.peer);
        }
        // first on, first in: the first ones on each side play
        for (const s of [0, 1]) q.s[s] = q.s[s].filter((id) => on[s].includes(id)).concat(on[s].filter((id) => !q.s[s].includes(id)));
        const a = q.s[0].slice(0, pd.md), b = q.s[1].slice(0, pd.md), sig = a.join() + '|' + b.join();
        if (!a.length && !b.length) { q.t = -1; q.w = 0; q.sig = ''; return; }
        const full = a.length === pd.md && b.length === pd.md;
        if (sig !== q.sig) { q.sig = sig; q.t = full ? 3 : -1; q.w = full ? 0 : BOT_WAIT; } // someone stepped on or off: start over
        if (q.t < 0) { q.w = Math.max(0, q.w - dt); if (q.w <= 0) q.t = 3; } // waited long enough: bots take the empty spots
        else { q.t = Math.max(0, q.t - dt); q.busy = H.M.length >= ARENAS.length ? 1 : 0; if (q.t <= 0 && !q.busy) { this.startMatch(i, a, b, pl); q.s = [[], []]; q.sig = ''; q.t = -1; q.w = 0; } } // (every arena in use: wait for one)
      });
    },
    startMatch(pad, a, b, pl) {
      const H = this.H, md = PADS[pad].md, used = new Set(H.M.map((m) => m.ar)), free = [0, 1, 2].filter((i) => !used.has(i));
      if (!free.length) return;
      const ar = free[Math.floor(Math.random() * free.length)], bots = [];
      const fill = (team, ids) => { while (ids.length < md) { H.nb = (H.nb | 0) + 1; const id = 'bot:' + H.nb; bots.push([id, BOT_NAMES[H.nb % BOT_NAMES.length], Math.floor(Math.random() * 1e6), team, BOT_W[Math.floor(Math.random() * BOT_W.length)]]); ids.push(id); } return ids; };
      const lo = {};
      for (const id of a.concat(b)) { const p = pl.find((q) => q.peer === id), l = p ? (p.me ? this.save.lo : p.pr.lo) : null; lo[id] = Array.isArray(l) && l.length === 4 && l.every((w, sl) => WP[w] && WP[w].sl === sl) ? l.slice() : START.slice(); }
      H.nm = (H.nm | 0) + 1;
      const m = { id: H.nm, pad, ar, md, tm: [fill(0, a.slice()), fill(1, b.slice())], bots, s: [0, 0], rd: 0, ph: 'pre', left: PRE, hp: {}, al: [], k: {}, b: {}, sm: [], u: {}, la: {}, lo, w: -1 };
      H.M.push(m);
      this.newRound(m);
    },
    newRound(m) {
      m.rd++; m.ph = 'pre'; m.left = PRE; m.w = -1; m.sm = []; m.u = {}; m.la = {};
      const all = m.tm[0].concat(m.tm[1]); m.al = all.slice(); m.hp = {}; for (const id of all) m.hp[id] = 100;
      for (const [id, , , team, wid] of m.bots) this.botInit(m, id, team, wid); // back to their spawns
    },
    runMatch(m, dt, pl) {
      const H = this.H, here = new Set(pl.map((p) => p.peer));
      m.left = Math.max(0, m.left - dt);
      // anyone who left the server is out of the match
      for (const tm of m.tm) for (let i = tm.length - 1; i >= 0; i--) if (!isBot(tm[i]) && !here.has(tm[i])) { const id = tm[i]; tm.splice(i, 1); m.al = m.al.filter((x) => x !== id); }
      if (!m.tm[0].concat(m.tm[1]).some((id) => !isBot(id))) { H.M.splice(H.M.indexOf(m), 1); return; } // only bots left
      if (m.ph !== 'mend' && (!m.tm[0].length || !m.tm[1].length)) { m.s[m.tm[0].length ? 0 : 1] = TO; m.ph = 'mend'; m.left = 6; m.w = m.tm[0].length ? 0 : 1; this.ev(['m', m.id, m.w]); return; }
      if (m.ph === 'pre') { if (m.left <= 0) { m.ph = 'fight'; m.left = ROUND_T; } }
      else if (m.ph === 'fight') {
        this.bots(m, dt);
        for (const s of m.sm) s[2] = +(s[2] - dt).toFixed(2);
        m.sm = m.sm.filter((s) => s[2] > 0);
        const up = [0, 1].map((t) => m.tm[t].some((id) => m.al.includes(id)));
        if (!up[0] || !up[1]) this.endRound(m, up[0] ? 0 : up[1] ? 1 : -1);
        else if (m.left <= 0) { const hp = [0, 1].map((t) => m.tm[t].reduce((a, id) => a + (m.al.includes(id) ? m.hp[id] : 0), 0)); this.endRound(m, hp[0] > hp[1] ? 0 : hp[1] > hp[0] ? 1 : -1); }
      } else if (m.ph === 'rend') { if (m.left <= 0) this.newRound(m); }
      else if (m.ph === 'mend' && m.left <= 0) H.M.splice(H.M.indexOf(m), 1);
    },
    endRound(m, w) {
      if (w >= 0) m.s[w]++;
      m.w = w; this.ev(['r', m.id, w]);
      if (w >= 0 && m.s[w] >= TO) { m.ph = 'mend'; m.left = 7; this.ev(['m', m.id, w]); }
      else { m.ph = 'rend'; m.left = 3.5; }
    },
    posOf(id, m) {
      if (isBot(id)) { const b = this.bs.get(id); if (b) return b; const q = m && m.b && m.b[id]; return q ? { x: q[0], y: q[1], z: q[2] } : null; }
      return (this.pl || players()).find((p) => p.peer === id) || null;
    },
    // someone asked: a hit, a grenade going off, a medkit
    apply(peer, req) {
      const H = this.H, [op, ...a] = req, m = this.matchOf(H, peer);
      if (!m || m.ph !== 'fight' || !m.al.includes(peer)) return;
      const team = m.tm[0].includes(peer) ? 0 : 1, lo = m.lo[peer] || START, me = this.posOf(peer, m);
      if (op === 'h') {
        const [tg, wid, body, head] = a, W = WP[wid];
        if (!W || W.sl > 2 || !lo.includes(wid) || !m.al.includes(tg) || !m.tm[1 - team].includes(tg)) return;
        const nb = body | 0, nh = head | 0; if (nb < 0 || nh < 0 || nb + nh < 1 || nb + nh > (W.pel || 1)) return;
        if (!this.spendTok(peer, wid, W)) return; // faster than the weapon fires: no
        const tp = this.posOf(tg, m), d = tp && me ? Math.hypot(tp.x - me.x, tp.z - me.z) : 0;
        if (d > (W.melee ? W.rng + 7 : W.rng + 12)) return;
        const f = W.fall && d > W.fall ? Math.max(0.4, 1 - (d - W.fall) / W.rng) : 1;
        this.hurt(m, tg, (W.dmg * nb + W.dmg * (W.hs || 1) * nh) * f, peer, wid, nh > 0);
      } else if (op === 'n') {
        const [k, x, y, z] = a, wid = { g: 'grenade', f: 'flash', s: 'smoke' }[k];
        if (!wid || !lo.includes(wid) || !(Math.abs(x) < 1e4 && Math.abs(y) < 1e4 && Math.abs(z) < 1e4)) return;
        const u = m.u[peer] || (m.u[peer] = {}); if ((u[wid] | 0) >= WP[wid].uses) return;
        if (me && Math.hypot(x - me.x, z - me.z) > 80) return;
        u[wid] = (u[wid] | 0) + 1;
        if (k === 'g') {
          this.ev(['x', m.id, +x.toFixed(1), +y.toFixed(1), +z.toFixed(1), peer]);
          for (const id of m.tm[1 - team]) { if (!m.al.includes(id)) continue; const p = this.posOf(id, m); if (!p) continue; const d = Math.hypot(p.x - x, p.y + 2 - y, p.z - z); if (d < NADE_R) this.hurt(m, id, NADE_DMG * (1 - (d / NADE_R) * 0.75), peer, 'grenade', false); }
        } else if (k === 'f') {
          this.ev(['f', m.id, +x.toFixed(1), +y.toFixed(1), +z.toFixed(1), peer]);
          for (const [id] of m.bots) { const b = this.bs.get(id); if (b && Math.hypot(b.x - x, b.z - z) < 30 && this.los(m, b.x, 3.8, b.z, x, y, z)) b.stun = Math.max(b.stun, 2.6); }
        } else { m.sm.push([+x.toFixed(1), +z.toFixed(1), SMOKE_T]); this.ev(['s', m.id, +x.toFixed(1), +z.toFixed(1), peer]); }
      } else if (op === 'm') {
        const u = m.u[peer] || (m.u[peer] = {}); if (!lo.includes('medkit') || (u.medkit | 0) >= 1) return;
        u.medkit = 1; m.hp[peer] = Math.min(100, m.hp[peer] + 50);
      }
    },
    // a weapon fires so fast and no faster: each shot spends a token, and they come back at the weapon's rate
    spendTok(peer, wid, W) {
      const T = performance.now() / 1000, b = this.tok.get(peer) || {}, rate = W.burst ? W.rate * W.burst : W.rate, cap = 2 + rate * 0.6; // (a little slack: shots can arrive a few at once)
      const e = b[wid] || (b[wid] = { n: cap, t: T });
      e.n = Math.min(cap, e.n + (T - e.t) * rate * 1.35); e.t = T; this.tok.set(peer, b);
      if (e.n < 1) return false;
      e.n -= 1; return true;
    },
    hurt(m, tg, dmg, by, wid, head) {
      dmg = Math.round(dmg);
      if (!(dmg > 0) || !m.al.includes(tg)) return;
      m.hp[tg] = Math.max(0, m.hp[tg] - dmg); m.la[tg] = by;
      if (m.hp[tg] <= 0) { m.al = m.al.filter((x) => x !== tg); m.k[by] = (m.k[by] | 0) + 1; this.ev(['k', m.id, by, tg, wid, head ? 1 : 0]); }
    },
    // nothing in the way between two points (walls, cover, smoke)?
    los(m, x0, y0, z0, x1, y1, z1) {
      const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, L = Math.hypot(dx, dy, dz) || 1, o = [x0, y0, z0], d = [dx / L, dy / L, dz / L];
      for (const b of this.abox[m.ar]) if (rayBox(o, d, b, L) < L - 0.4) return false;
      for (const s of m.sm) { // a smoke cloud: a ball round (x, 3, z)
        const cx = s[0] - x0, cy = 3 - y0, cz = s[1] - z0, along = cx * d[0] + cy * d[1] + cz * d[2];
        if (along < 0 || along > L) continue;
        if (cx * cx + cy * cy + cz * cz - along * along < SMOKE_R * SMOKE_R) return false;
      }
      return true;
    },
    botInit(m, id, team, wid) {
      const A = ARENAS[m.ar], i = m.tm[team].indexOf(id), n = m.tm[team].length, W = WP[wid];
      const b = { mid: m.id, x: A.x + (i - (n - 1) / 2) * 8, y: 0, z: A.z + (team ? -1 : 1) * SPZ, yaw: team ? Math.PI : 0, wid, mag: W.mag, rl: 0, next: 0, see: false, seeT: 0, losT: 0, str: Math.random() < 0.5 ? 1 : -1, strT: 0, stun: 0, last: null, react: 0.45 + Math.random() * 0.3 + (wid === 'sniper' ? 0.5 : 0), sN: 0, e: null, walk: 0 };
      this.bs.set(id, b);
      return b;
    },
    bots(m, dt) {
      const A = ARENAS[m.ar], T = performance.now() / 1000;
      for (const [id, , seed, team, wid] of m.bots) {
        if (!m.al.includes(id)) continue;
        let b = this.bs.get(id);
        if (!b) { b = this.botInit(m, id, team, wid); const q = m.b && m.b[id]; if (q) { b.x = q[0]; b.z = q[2]; } } // (a new host carries on from where they were)
        const W = WP[b.wid];
        b.walk = Math.max(0, b.walk - dt);
        // the nearest enemy still up
        let tid = null, tp = null, bd = 1e9;
        for (const x of m.tm[1 - team]) { if (!m.al.includes(x)) continue; const p = this.posOf(x, m); if (!p) continue; const d = Math.hypot(p.x - b.x, p.z - b.z); if (d < bd) { bd = d; tid = x; tp = p; } }
        if (!tp) continue;
        b.losT -= dt; if (b.losT <= 0) { b.losT = 0.2; b.see = this.los(m, b.x, 3.8, b.z, tp.x, (tp.y || 0) + 3, tp.z); }
        if (b.see) { b.seeT += dt; b.last = [tp.x, tp.z]; } else b.seeT = 0;
        // move: keep to a good distance for the weapon, strafing; or go to where they were last seen
        const dx = tp.x - b.x, dz = tp.z - b.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, want = BOT_RANGE[b.wid] || 20;
        let mx, mz;
        if (b.stun > 0) { b.stun -= dt; mx = Math.sin(T * 3 + seed); mz = Math.cos(T * 2.3 + seed); }
        else if (b.see) {
          const fw = d > want + 4 ? 1 : d < want - 4 ? -0.8 : 0;
          b.strT -= dt; if (b.strT <= 0) { b.str = -b.str; b.strT = 0.7 + Math.random() * 1.2; }
          mx = ux * fw - uz * b.str * 0.9; mz = uz * fw + ux * b.str * 0.9;
        } else {
          const L = b.last || [tp.x, tp.z], lx = L[0] - b.x, lz = L[1] - b.z, l = Math.hypot(lx, lz);
          if (l < 2.5) b.last = [tp.x, tp.z];
          mx = lx / (l || 1); mz = lz / (l || 1);
        }
        this.botMove(m, b, mx, mz, 13.5 * dt, A);
        b.yaw = Math.atan2(-dx, -dz);
        // shoot
        if (b.rl > 0) { b.rl -= dt; if (b.rl <= 0) b.mag = W.mag; }
        else if (b.see && b.seeT > b.react && T >= b.next && !(b.stun > 0)) {
          b.next = T + 1 / ((W.burst ? W.rate * 2 : W.rate) * 0.85); b.mag--; if (b.mag <= 0) b.rl = W.rl;
          const pr = isBot(tid) ? null : (this.pl || []).find((p) => p.peer === tid), moving = isBot(tid) || !!(pr && pr.pr && pr.pr.a === 1);
          let hb = 0, hh = 0;
          for (let k = 0; k < (W.pel || 1); k++) {
            let p = W.pel ? clamp(1.1 - d / 28, 0.04, 0.8) : b.wid === 'sniper' ? 0.36 : clamp(0.5 - d / 320, 0.14, 0.5);
            if (moving) p *= 0.72;
            if (Math.random() < p) { if (Math.random() < 0.12) hh++; else hb++; }
          }
          const f = W.fall && d > W.fall ? Math.max(0.4, 1 - (d - W.fall) / W.rng) : 1;
          if (hb + hh) this.hurt(m, tid, (W.dmg * hb + W.dmg * (W.hs || 1) * hh) * f, id, b.wid, hh > 0);
          const miss = !(hb + hh), r = () => (Math.random() - 0.5) * 2;
          b.sN++; b.e = [+(tp.x + (miss ? r() * 2.5 : 0)).toFixed(1), +((tp.y || 0) + 3 + (miss ? Math.random() * 2 : 0)).toFixed(1), +(tp.z + (miss ? r() * 2.5 : 0)).toFixed(1)];
        }
      }
    },
    blocked(m, x, z) {
      const A = ARENAS[m.ar];
      if (Math.abs(x - A.x) > AW - 1.4 || Math.abs(z - A.z) > AL - 1.4) return true;
      for (const b of this.abox[m.ar]) if (x + 1 > b[0] && x - 1 < b[3] && z + 1 > b[2] && z - 1 < b[5] && b[4] > 0.5 && b[1] < 4.5) return true;
      return false;
    },
    // step towards (mx, mz), turning aside round anything in the way
    botMove(m, b, mx, mz, step, A) {
      const l = Math.hypot(mx, mz); if (l < 0.05) return;
      const a0 = Math.atan2(mx, mz);
      for (const da of [0, 0.6, -0.6, 1.2, -1.2, 1.9, -1.9, 2.6, -2.6]) {
        const a = a0 + da * (b.str || 1), nx = b.x + Math.sin(a) * step * Math.min(1, l), nz = b.z + Math.cos(a) * step * Math.min(1, l);
        if (!this.blocked(m, nx, nz)) { b.x = nx; b.z = nz; b.walk = 0.2; return; }
      }
      b.str = -b.str; b.last = null;
    },
    packBots(m) {
      m.b = {};
      for (const [id] of m.bots) { const b = this.bs.get(id); if (b) m.b[id] = [+b.x.toFixed(2), 0, +b.z.toFixed(2), +b.yaw.toFixed(2), b.sN, ...(b.e || [0, 0, 0]), b.walk > 0 ? 1 : 0]; }
    },

    /* ---------------- you: weapons ---------------- */
    ask(op, ...args) {
      if (!this.mm) return;
      if (this.H) return this.apply(myPeer(), [op, ...args]); // the host's own go straight in
      this.q.push([++this.qn, op, ...args]); if (this.q.length > 24) this.q.shift();
      send({ tq: this.q.slice() });
    },
    fighting() { const m = this.mm; return !m || (m.ph === 'fight' && (m.al || []).includes(myPeer())); },
    canAct() { return !P.dead && !fullOpen() && this.fighting(); },
    hover(e) { this.mouse = { x: e.x, y: e.y }; },
    press(btn, down) {
      if (btn === 2) { this.ads = !!down && !!WP[this.cw()] && WP[this.cw()].sl < 2; return; }
      if (btn !== 0) return;
      if (down) this.hold = { at: performance.now() / 1000, auto: false };
      else { if (this.hold) this.hold.up = true; if (this.firing === 'mouse') this.firing = false; }
    },
    click(e) {
      if (e.button === 2) return;
      const h = this.hold; this.hold = null;
      if (h && h.auto) return; // it was already firing while held
      this.mouse = { x: e.x, y: e.y };
      this.trigger(this.aimFrom(e.x, e.y));
    },
    key(code, down) {
      if (!down) { if (code === 'KeyF') this.firing = false; return; }
      if (code === 'KeyF') { this.firing = 'auto'; this.trigger(); return true; }
      if (code === 'KeyR') { this.reload(); return true; }
      if (/^Digit[1-4]$/.test(code)) { this.pick(+code.slice(5) - 1); return true; }
      if (code === 'KeyQ') { this.pick(this.last != null ? this.last : 1); return true; }
      if (code === 'KeyG') { const c = this.cur; this.pick(3, true); this.trigger(); this.pick(c, true); return true; }
      if (code === 'KeyL') { this.loadout(); return true; }
    },
    menuKey(code) { if (code === 'KeyL') closePanel(); },
    pick(sl, quiet) {
      if (sl === this.cur) return;
      this.last = this.cur; this.cur = sl; this.rl = null; this.burstQ = 0; this.spin = 0; this.healT = 0;
      const W = WP[this.cw()]; if (!W || W.sl > 1) this.ads = false;
      if (!quiet) sfx('select');
      send({ hd: this.cw() }); this.drawBar();
    },
    reload() {
      const wid = this.cw(), W = WP[wid];
      if (!W || W.sl > 1 || this.rl || (this.ammo[wid] ?? W.mag) >= W.mag) return;
      this.rl = { wid, t: W.rl * (hasItem('fast') ? 0.7 : 1) }; this.burstQ = 0; sfx('reload'); this.drawBar();
    },
    // one pull of the trigger
    trigger(at) {
      if (!this.canAct()) return;
      const wid = this.cw(), W = WP[wid], t = performance.now() / 1000;
      if (!W || this.healT > 0 || t < this.next) return;
      if (W.sl === 3) return this.useUtil(wid, W, at);
      if (W.melee) { this.next = t + 1 / W.rate; return this.swing(wid, W, at); }
      if (this.rl) return;
      if ((this.ammo[wid] ?? W.mag) <= 0) { this.reload(); return; }
      if (W.spin && this.spin < W.spin) return; // the minigun spins up first
      this.next = t + 1 / W.rate;
      if (W.burst) { this.burstQ = W.burst; this.burstAt = t; this.burstAim = at; return; }
      this.shoot(wid, W, at);
    },
    // where a click points: at an enemy (or near one on screen), else at whatever's there
    aimFrom(sx, sy) {
      const rc = rayAt(sx, sy), o = [rc.ray.origin.x, rc.ray.origin.y, rc.ray.origin.z], d = [rc.ray.direction.x, rc.ray.direction.y, rc.ray.direction.z];
      let best = null, bt = wallHit(o, d, 400, true);
      for (const tg of this.targets()) { const r = this.rayTarget(o, d, tg, bt); if (r) { bt = r.t; best = tg; } }
      if (best) return { x: o[0] + d[0] * bt, y: o[1] + d[1] * bt, z: o[2] + d[2] * bt, tg: best };
      let bd = 34;
      for (const tg of this.targets()) { const p = new THREE.Vector3(tg.x, tg.y + 3, tg.z).project(camera); if (p.z > 1) continue; const dd = Math.hypot((p.x + 1) / 2 * innerWidth - sx, (1 - p.y) / 2 * innerHeight - sy); if (dd < bd) { bd = dd; best = tg; } }
      if (best) return { x: best.x, y: best.y + 3, z: best.z, tg: best };
      return { x: o[0] + d[0] * bt, y: o[1] + d[1] * bt, z: o[2] + d[2] * bt };
    },
    // the nearest enemy in front of the camera that you can see (F, and phones)
    autoAim() {
      const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), W = WP[this.cw()] || WP.ar;
      let best = null, bs = 1e9;
      for (const tg of this.targets()) {
        const dx = tg.x - P.x, dz = tg.z - P.z, d = Math.hypot(dx, dz); if (d > (W.melee ? W.rng + 3 : W.rng || 80) || d < 0.01) continue;
        const dot = (dx * fx + dz * fz) / d; if (dot < (d < 6 ? -0.3 : 0.5)) continue;
        const o = [P.x, P.y + 3.7, P.z], dir = [dx, tg.y + 3 - o[1], dz], l = Math.hypot(...dir);
        if (wallHit(o, dir.map((q) => q / l), l) < l - 1) continue;
        const sc = d * (1.6 - dot); if (sc < bs) { bs = sc; best = tg; }
      }
      if (best) return { x: best.x, y: best.y + 3, z: best.z, tg: best };
      return { x: P.x + fx * 40, y: P.y + 3.6, z: P.z + fz * 40 };
    },
    curAim() { return this.mouse && !touchy && this.firing !== 'auto' ? this.aimFrom(this.mouse.x, this.mouse.y) : this.autoAim(); },
    // who you can hit: the other team (or the dummies in the lobby), where they're drawn
    targets() {
      const m = this.mm, out = [];
      if (!m) { for (const d of this.dummies || []) out.push({ id: d.id, dummy: d, x: d.a.g.position.x, y: d.a.g.position.y, z: d.a.g.position.z }); return out; }
      if (m.ph !== 'fight') return out;
      for (const id of m.tm[1 - this.myTeam]) { if (!(m.al || []).includes(id)) continue; const p = this.drawnPos(id); if (p) out.push({ id, x: p.x, y: p.y, z: p.z }); }
      return out;
    },
    drawnPos(id) {
      if (id === myPeer()) return P;
      const a = isBot(id) ? this.botAv.get(id) : Net.avatars.get(id);
      return a && !a.dead ? a.g.position : null;
    },
    rayTarget(o, d, tg, max) {
      const tb = rayBox(o, d, [tg.x - 1.1, tg.y, tg.z - 1.1, tg.x + 1.1, tg.y + 4, tg.z + 1.1], max), th = rayBox(o, d, [tg.x - 0.78, tg.y + 4, tg.z - 0.78, tg.x + 0.78, tg.y + 5.5, tg.z + 0.78], max);
      const t = Math.min(tb, th);
      return t < max ? { t, head: th <= tb } : null;
    },
    faceAt(x, z) { this.aimYaw = Math.atan2(-(x - P.x), -(z - P.z)); this.faceT = 0.6; P.yaw = this.aimYaw; },
    gunTip() {
      const fx = -Math.sin(this.aimYaw), fz = -Math.cos(this.aimYaw), rx = Math.cos(this.aimYaw), rz = -Math.sin(this.aimYaw);
      return [P.x + fx * 1.3 + rx * 1.4, P.y + 3.7, P.z + fz * 1.3 + rz * 1.4];
    },
    shoot(wid, W, at) {
      this.ammo[wid] = (this.ammo[wid] ?? W.mag) - 1;
      const aim = at || this.curAim();
      this.faceAt(aim.x, aim.z);
      const o = this.gunTip();
      let dx = aim.x - o[0], dy = aim.y - o[1], dz = aim.z - o[2]; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
      const moving = Math.hypot(P.vx, P.vz) > 2 || !P.ground, sp = (this.ads && W.zsp != null ? W.zsp : W.sp * (this.ads ? 0.7 : 1)) * (moving ? 1.7 : 1) * (hasItem('steady') ? 0.65 : 1);
      const tgs = this.targets(), hits = new Map(), ends = [];
      for (let k = 0; k < (W.pel || 1); k++) {
        const d = [dx + (Math.random() - 0.5) * 2 * sp, dy + (Math.random() - 0.5) * 2 * sp, dz + (Math.random() - 0.5) * 2 * sp], dl = Math.hypot(...d); d[0] /= dl; d[1] /= dl; d[2] /= dl;
        let bt = wallHit(o, d, W.rng, true), best = null, head = false;
        for (const tg of tgs) { const r = this.rayTarget(o, d, tg, bt); if (r) { bt = r.t; best = tg; head = r.head; } }
        const end = [o[0] + d[0] * bt, o[1] + d[1] * bt, o[2] + d[2] * bt]; ends.push(end);
        if (best) { const h = hits.get(best.id) || { tg: best, body: 0, head: 0, at: end }; if (head) h.head++; else h.body++; hits.set(best.id, h); }
      }
      for (const h of hits.values()) this.landHit(h, wid, W);
      for (const e of ends.slice(0, 4)) this.tracer(o, e, W.pel ? 0xffd27a : 0xfff3b0);
      this.flash(o);
      sfx(W.pel ? 'cannon' : wid === 'sniper' || wid === 'revolver' ? 'boom' : 'gun', { gap: 30, vol: W.auto ? 0.55 : 0.9, pitch: wid === 'minigun' ? 1.45 : wid === 'uzi' ? 1.25 : wid === 'handgun' ? 1.1 : 1 });
      this.shake = Math.max(this.shake, W.pel || wid === 'sniper' ? 0.2 : 0.05);
      this.shotN++; const e0 = ends[0]; send({ sh: [this.shotN, +e0[0].toFixed(1), +e0[1].toFixed(1), +e0[2].toFixed(1), wid] });
      if (this.ammo[wid] <= 0) this.reload();
      this.drawBar();
    },
    // a hit: the dummies just show it; anyone else, ask the host (and show what it should do)
    landHit(h, wid, W) {
      const d = Math.hypot(h.tg.x - P.x, h.tg.z - P.z), f = W.fall && d > W.fall ? Math.max(0.4, 1 - (d - W.fall) / W.rng) : 1;
      const dmg = Math.round((W.dmg * h.body + W.dmg * (W.hs || 1) * h.head) * f);
      this.dmgNum(h.at, dmg, h.head > 0);
      this.hitMark(h.head > 0);
      if (h.tg.dummy) { h.tg.dummy.hurtT = 0.15; return; }
      this.ask('h', h.tg.id, wid, h.body, h.head);
    },
    swing(wid, W, at) {
      const aim = at || this.curAim(); if (aim) this.faceAt(aim.x, aim.z);
      this.swingT = 0.3; sfx('swing', { pitch: wid === 'scythe' ? 0.8 : wid === 'fists' ? 1.3 : 1 });
      const fx = -Math.sin(this.aimYaw), fz = -Math.cos(this.aimYaw); let any = false;
      for (const tg of this.targets()) {
        const dx = tg.x - P.x, dz = tg.z - P.z, d = Math.hypot(dx, dz);
        if (d > W.rng + 1 || Math.abs(tg.y - P.y) > 4.5) continue;
        if (d > 1.6 && (dx * fx + dz * fz) / d < (wid === 'katana' || wid === 'scythe' ? 0.1 : 0.35)) continue;
        this.landHit({ tg, body: 1, head: 0, at: [tg.x, tg.y + 3, tg.z] }, wid, W); any = true;
      }
      if (any) sfx('hit');
      this.shotN++; send({ sh: [this.shotN, 0, 0, 0, wid] });
    },
    useUtil(wid, W, at) {
      const m = this.mm, left = m ? W.uses - (this.uses[wid] | 0) : 9;
      if (left <= 0) { toast(`${W.e} None left this round`, '#fca5a5'); sfx('error', { gap: 300 }); return; }
      if (wid === 'medkit') { if (m && (m.hp[myPeer()] ?? 100) >= 100) { toast('🩹 You’re at full health', '#86efac'); return; } this.healT = 1; sfx('magic'); return; }
      if (m) this.uses[wid] = (this.uses[wid] | 0) + 1;
      const aim = at || this.curAim(); this.faceAt(aim.x, aim.z);
      const o = [P.x, P.y + 4.2, P.z], dx = aim.x - o[0], dz = aim.z - o[2], d = Math.hypot(dx, dz) || 1, sp = clamp(d * 1.05, 14, 40);
      const v = [dx / d * sp, 11 + Math.max(-4, Math.min(12, (aim.y - o[1]) * 0.6)), dz / d * sp];
      this.throwIt(wid, o, v, true);
      this.gnN++; send({ gn: [this.gnN, wid, +o[0].toFixed(1), +o[1].toFixed(1), +o[2].toFixed(1), +v[0].toFixed(1), +v[1].toFixed(1), +v[2].toFixed(1)] });
      this.next = performance.now() / 1000 + 0.7; this.swingT = 0.3; sfx('whoosh');
      this.drawBar();
    },
    throwIt(wid, o, v, mine, peer) {
      const mesh = model(wid); mesh.position.set(o[0], o[1], o[2]); scene.add(mesh);
      this.nades.push({ wid, x: o[0], y: o[1], z: o[2], vx: v[0], vy: v[1], vz: v[2], t: WP[wid].fuse, m: mesh, mine, peer });
    },
    // a thrown one going off (yours does the asking; everyone else's is just for show, the host says what happened)
    pop(n) {
      const lobby = !n.mine && !this.matchOf(this.g, n.peer); // someone trying theirs out in the lobby: nobody asks the host about it
      if (n.wid === 'grenade') { if (n.mine || lobby) this.boom(n.x, n.y, n.z); if (n.mine) { if (this.mm) this.ask('n', 'g', n.x, n.y, n.z); else this.nadeDummies(n); } }
      else if (n.wid === 'flash') { if (n.mine) { this.flashAt(n.x, n.y, n.z); this.ask('n', 'f', n.x, n.y, n.z); } else if (lobby) { puffAt(n.x, n.y, n.z, [0xffffff, 0xfef9c3], 10); sfx3('zap', n.x, n.z, 90); } }
      else if (n.wid === 'smoke' && lobby) this.localSm.push([n.x, n.z, SMOKE_T, ++this.smN]);
      else if (n.wid === 'smoke' && n.mine) { if (this.mm) this.ask('n', 's', n.x, n.y, n.z); else this.localSm.push([n.x, n.z, SMOKE_T, ++this.smN]); sfx('hiss'); }
    },
    nadeDummies(n) { for (const tg of this.targets()) { const d = Math.hypot(tg.x - n.x, tg.y + 2 - n.y, tg.z - n.z); if (d < NADE_R && tg.dummy) { this.dmgNum([tg.x, tg.y + 3, tg.z], Math.round(NADE_DMG * (1 - (d / NADE_R) * 0.75)), false); tg.dummy.hurtT = 0.15; } } },
    boom(x, y, z) {
      puffAt(x, y, z, [0xf97316, 0xfde047, 0x1f2937, 0xef4444], 26); sfx3('explode', x, z, 140);
      const d = Math.hypot(x - P.x, z - P.z); if (d < 30) this.shake = Math.max(this.shake, 0.5 * (1 - d / 30));
    },
    flashAt(x, y, z) {
      puffAt(x, y, z, [0xffffff, 0xfef9c3], 10); sfx3('zap', x, z, 90);
      if (P.dead) return;
      const dx = x - P.x, dy = y - (P.y + 4.2), dz = z - P.z, d = Math.hypot(dx, dy, dz) || 1;
      if (d > 34) return;
      if (wallHit([P.x, P.y + 4.2, P.z], [dx / d, dy / d, dz / d], d) < d - 0.6) return; // round a corner: fine
      const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), facing = (dx * fx + dz * fz) / (Math.hypot(dx, dz) || 1);
      const s = d < 7 ? 1 : facing > 0.35 ? 1 - d / 45 : facing > -0.2 ? 0.35 : 0;
      if (s > 0) this.blind = Math.max(this.blind, 2.8 * s);
    },
    dmgNum(at, n, head) {
      const box = $('#rvDmg'); if (!box || !(n > 0)) return;
      const p = new THREE.Vector3(at[0], at[1] + 0.5, at[2]).project(camera); if (p.z > 1) return;
      const el = document.createElement('div'); el.className = 'rv-dmg' + (head ? ' head' : ''); el.textContent = n;
      el.style.left = ((p.x + 1) / 2 * innerWidth + (Math.random() - 0.5) * 30) + 'px'; el.style.top = ((1 - p.y) / 2 * innerHeight) + 'px';
      box.append(el); while (box.children.length > 14) box.firstChild.remove();
      setTimeout(() => el.remove(), 850);
    },
    hitMark(head) {
      const cr = $('#rvCross'); if (!cr) return;
      cr.classList.add('hit'); cr.classList.toggle('head', head); clearTimeout(this.hmT); this.hmT = setTimeout(() => cr.classList.remove('hit', 'head'), 140);
      sfx('hit', { gap: 40, vol: 0.5, pitch: head ? 1.5 : 1.2 });
    },
    tracer(o, e, c) {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(o[0], o[1], o[2]), new THREE.Vector3(e[0], e[1], e[2])]);
      const m = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.9 })); scene.add(m); this.fx.push({ m, life: 0.09 });
    },
    flash(o) {
      const m = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.9 })); m.scale.setScalar(0.7); m.position.set(o[0], o[1], o[2]); m.rotation.set(Math.random(), Math.random(), 0);
      scene.add(m); this.fx.push({ m, life: 0.05, keepGeo: true });
    },
    loadout() {
      if (this.mm) { toast('🎒 Change your loadout in the lobby', '#fca5a5'); return; }
      if (!this.save) return;
      const S = this.save, stat = (W) => W.sl === 3 ? `${W.uses} a round` : W.melee ? `💥 ${W.dmg} · ⚡ ${W.rate}/s · 📏 ${W.rng}` : `💥 ${W.dmg}${W.pel ? `×${W.pel}` : ''} · ⚡ ${Math.round((W.burst ? W.rate * W.burst : W.rate) * 10) / 10}/s · 📦 ${W.mag}`;
      const html = `<p style="margin:0 0 6px;color:#cbd5e1;font:700 13px var(--fb)">Pick one of each. Unlock more with Blox Coins (you have 🪙 ${W_.coins.toLocaleString('en-US')}).</p>` + SLOTS.map((t, sl) => `<h4>${t}</h4><div class="xp-grid">` + Object.keys(WP).filter((id) => WP[id].sl === sl).map((id) => {
        const W = WP[id], own = S.own.includes(id), on = S.lo[sl] === id;
        return `<div class="xp-card ${on ? 'on' : ''}"><div class="big">${W.e}</div><b>${W.n}</b><span>${W.d}</span><span class="rv-st">${stat(W)}</span><button class="xp-btn ${own ? (on ? 'alt' : 'blue') : 'gold'}" data-w="${id}" ${on ? 'disabled' : ''}>${own ? (on ? 'Equipped' : 'Equip') : `🪙 ${W.price}`}</button></div>`;
      }).join('') + '</div>').join('');
      openPanel('🎒 Loadout', html, (b) => {
        const id = b.dataset.w, W = WP[id]; if (!W) return;
        if (!S.own.includes(id)) { if (!spend(W.price)) { toast('Not enough Blox Coins', '#fca5a5'); return; } S.own.push(id); sfx('unlock'); toast(`${W.e} ${W.n} unlocked!`, '#fde68a'); }
        else sfx('select');
        S.lo[W.sl] = id; this.saveNow(); send({ lo: S.lo.slice() });
        this.cur = W.sl; this.ammo = {}; send({ hd: this.cw() }); this.drawBar(); this.loadout();
      }, null, { full: true });
    },
    saveNow() { if (this.save) kvSet('rv', this.save); },
    drawBar() {
      const lo = this.save ? this.save.lo : START, m = this.mm;
      const html = lo.map((wid, i) => {
        const W = WP[wid]; let sub = '';
        if (W.sl < 2) sub = this.rl && this.rl.wid === wid ? '⏳ reloading' : `${this.ammo[wid] ?? W.mag} / ${W.mag}`;
        else if (W.sl === 3) sub = m ? `× ${Math.max(0, W.uses - (this.uses[wid] | 0))}` : '∞';
        return `<button class="xslot ${i === this.cur ? 'on' : ''}" data-k="s${i}"><span class="k">${i + 1}</span><span class="e">${W.e}</span>${W.n}${sub ? `<small>${sub}</small>` : ''}</button>`;
      }).join('') + (touchy ? '<button class="xslot" data-k="fire"><span class="e">🔥</span>Fire</button><button class="xslot" data-k="rl"><span class="e">🔄</span>Reload</button>' : '')
        + (!m ? '<button class="xslot" data-k="lo"><span class="k">L</span><span class="e">🎒</span>Loadout</button>' : '');
      setBar(html, (b) => {
        const k = b.dataset.k;
        if (/^s\d$/.test(k)) this.pick(+k[1]);
        else if (k === 'fire') { this.firing = false; this.trigger(); }
        else if (k === 'rl') this.reload();
        else if (k === 'lo') this.loadout();
      });
    },

    /* ---------------- everyone ---------------- */
    tick(dt) {
      const g = this.g = roundState(this), mine = myPeer(), t = performance.now() / 1000;
      const m = this.mm = this.matchOf(g, mine);
      this.myTeam = m && m.tm[1].includes(mine) ? 1 : 0;
      const since = this.H ? 0 : Math.min(1, (performance.now() - (this.gAt || performance.now())) / 1000), mLeft = m ? Math.max(0, m.left - since) : 0;
      // a new round (or a new match, or back to the lobby): everyone to their places
      const key = m ? m.id + ':' + m.rd : '';
      if (key !== this.rkey) {
        const was = this.rkey; this.rkey = key;
        if (m) { if (!was || was.split(':')[0] !== String(m.id)) this.matchStart(m); this.roundStart(m); respawn(true); }
        else { if (was) respawn(); this.drawBar(); }
      }
      P.frozen = !!(m && m.ph === 'pre');
      const alive = !m || (m.al || []).includes(mine), hp = m ? (m.hp && m.hp[mine] != null ? m.hp[mine] : 100) : 100;
      if (m && this.wasAlive && !alive && !P.dead) die();
      this.wasAlive = alive;
      if (hp < this.lastHp && alive) { const el = $('#rvHurt'); if (el) { el.style.transition = 'none'; el.style.opacity = Math.min(1, 0.35 + (this.lastHp - hp) / 60); void el.offsetWidth; el.style.transition = ''; el.style.opacity = 0; } sfx('hurt', { gap: 120 }); this.shake = Math.max(this.shake, 0.12); }
      this.lastHp = hp;
      if (m && m.ph === 'pre') { const c = Math.ceil(mLeft); if (c !== this.cdS && c >= 1 && c <= 3) { sfx('count'); this.big(String(c), m.rd > 1 ? `Round ${m.rd}` : `${ARENAS[m.ar].n}`, '#fde68a'); } this.cdS = c; }
      else if (m && m.ph === 'fight' && this.cdS) { this.cdS = 0; this.big('FIGHT!', '', '#86efac'); sfx('go'); }
      this.events(g, m);
      this.combat(dt, t);
      this.drawBots(g, dt);
      this.peerFx(dt);
      this.drawNades(dt);
      this.drawSmoke(g, dt);
      this.drawTags(m);
      this.drawDummies(dt, t);
      this.drawPads(g);
      for (let i = this.fx.length - 1; i >= 0; i--) { const f = this.fx[i]; f.life -= dt; if (f.life <= 0) { scene.remove(f.m); if (!f.keepGeo) f.m.geometry.dispose(); f.m.material.dispose(); this.fx.splice(i, 1); } }
      // the screen: shake, zoom, blinded, the scope
      cam.yaw -= this.sy0 || 0; cam.pitch -= this.sp0 || 0; this.sy0 = this.sp0 = 0;
      if (this.shake > 0) { this.shake = Math.max(0, this.shake - dt * 1.6); this.sy0 = (Math.random() - 0.5) * this.shake * 0.04; this.sp0 = (Math.random() - 0.5) * this.shake * 0.04; cam.yaw += this.sy0; cam.pitch += this.sp0; }
      const W = WP[this.cw()] || WP.ar, scoped = this.ads && W === WP.sniper && !P.dead;
      const fov = scoped ? 24 : this.ads ? 55 : viewFov();
      if (Math.abs(camera.fov - fov) > 0.1) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 14); camera.updateProjectionMatrix(); }
      this.blind = Math.max(0, this.blind - dt);
      const fl = $('#rvFlash'); if (fl) fl.style.opacity = Math.min(1, this.blind / 1.4).toFixed(2);
      const sc = $('#rvScope'); if (sc) { sc.style.display = scoped ? 'block' : 'none'; if (scoped) { const x = this.mouse && !touchy ? this.mouse.x : innerWidth / 2, y = this.mouse && !touchy ? this.mouse.y : innerHeight / 2; sc.style.background = `radial-gradient(circle at ${x}px ${y}px,transparent 0 ${Math.min(innerWidth, innerHeight) * 0.3}px,rgba(0,0,0,.94) ${Math.min(innerWidth, innerHeight) * 0.3 + 3}px)`; } }
      const cr = $('#rvCross'); if (cr) { const show = !!(W.sl < 2 && this.mouse && !touchy && !panelOpen() && this.fighting() && !P.dead); cr.style.display = show ? 'block' : 'none'; if (show) { cr.style.left = this.mouse.x + 'px'; cr.style.top = this.mouse.y + 'px'; } }
      this.drawBar();
      this.drawBanner(g, m, mLeft, alive);
    },
    matchStart(m) {
      this.mk = 0; this.mBots = m.tm[1 - (m.tm[1].includes(myPeer()) ? 1 : 0)].some(isBot);
      const feed = $('#rvFeed'); if (feed) feed.innerHTML = '';
      closePanel(); sfx('alarm', { vol: 0.5 });
    },
    roundStart(m) {
      Object.assign(this, { ammo: {}, uses: {}, rl: null, burstQ: 0, spin: 0, healT: 0, blind: 0, lastHp: 100, wasAlive: true, ads: false });
      if (this.cur !== 0) { this.cur = 0; send({ hd: this.cw() }); }
      this.drawBar();
    },
    big(text, sub, color) {
      const el = $('#rvBig'); if (!el) return;
      el.innerHTML = `<span style="color:${color || '#fff'}">${esc(text)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}`;
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); el.style.opacity = 1;
      clearTimeout(this.bigT); this.bigT = setTimeout(() => { el.style.transition = 'opacity .4s'; el.style.opacity = 0; setTimeout(() => { el.style.transition = ''; }, 450); }, 1300);
    },
    nameOfId(id) {
      if (isBot(id)) { for (const m of (this.g && this.g.M) || []) { const b = m.bots.find((q) => q[0] === id); if (b) return '🤖 ' + b[1]; } return '🤖 Bot'; }
      return nameOf(id);
    },
    // the news: knockouts, rounds, matches, grenades
    events(g, m) {
      if (!g) return;
      const mine = myPeer();
      if (this.evN == null) this.evN = Math.max(0, ...(g.ev || []).map((e) => e[0]));
      for (const e of g.ev || []) {
        if (!(e[0] > this.evN)) continue;
        this.evN = e[0];
        const [, k, mid] = e, inMine = m && m.id === mid;
        if (k === 'k' && inMine) {
          const [, , , by, vic, wid, head] = e, W = WP[wid] || WP.ar;
          const feed = $('#rvFeed');
          if (feed) { const side = (id) => (m.tm[this.myTeam].includes(id) ? 'a' : 'e'), div = document.createElement('div'); div.className = by === mine ? 'mine' : vic === mine ? 'died' : ''; div.innerHTML = `<span class="${side(by)}">${esc(this.nameOfId(by))}</span> ${W.e}${head ? '🎯' : ''} <span class="${side(vic)}">${esc(this.nameOfId(vic))}</span>`; feed.append(div); while (feed.children.length > 5) feed.firstChild.remove(); setTimeout(() => div.remove(), 6000); }
          if (by === mine) {
            sfx('kill'); toast(`💀 You eliminated ${this.nameOfId(vic)}${head ? ' (headshot!)' : ''}`, '#fde68a');
            this.mk++; if (this.save) this.save.kills = (this.save.kills | 0) + 1; if (this.mk <= (this.mBots ? 3 : 5)) earn(1); quest('rivals.kill');
          } else if (vic === mine) { toast(`☠️ ${this.nameOfId(by)} got you`, '#fca5a5'); }
          if (isBot(vic)) { const a = this.botAv.get(vic); if (a) { puffAt(a.g.position.x, a.g.position.y + 3, a.g.position.z, [0xef4444, 0xffffff], 12); scatter(a); sfx3('oof', a.g.position.x, a.g.position.z, 70); } }
        }
        if (k === 'r' && inMine) {
          const w = e[3];
          if (m.ph !== 'mend' && !(m.s[w] >= TO)) { if (w < 0) { this.big('DRAW', 'Nobody scores', '#e2e8f0'); sfx('draw'); } else if (w === this.myTeam) { this.big('ROUND WON', `${m.s[this.myTeam]} – ${m.s[1 - this.myTeam]}`, '#86efac'); sfx('point'); } else { this.big('ROUND LOST', `${m.s[this.myTeam]} – ${m.s[1 - this.myTeam]}`, '#fca5a5'); sfx('wrong'); } }
        }
        if (k === 'm' && inMine && this.save) {
          const won = e[3] === this.myTeam, vsBots = this.mBots;
          this.big(won ? '🏆 VICTORY' : 'DEFEAT', `${m.s[this.myTeam]} – ${m.s[1 - this.myTeam]}`, won ? '#fde047' : '#fca5a5');
          sfx(won ? 'win' : 'lose');
          this.save.played = (this.save.played | 0) + 1;
          if (won) { this.save.wins = (this.save.wins | 0) + 1; send({ rw: this.save.wins }); questMax('rivals.win', this.save.wins); earn(vsBots ? 6 : 15, vsBots ? 'beat the bots in Rivals' : 'won a Rivals duel'); for (let i = 0; i < 24; i++) puffAt(P.x + (Math.random() - 0.5) * 8, P.y + 6, P.z + (Math.random() - 0.5) * 8, CONFETTI, 1); }
          else earn(vsBots ? 1 : 3, 'played a Rivals duel');
          this.saveNow();
        }
        if (k === 'x' && e[6] !== mine) this.boom(e[3], e[4], e[5]);
        if (k === 'f' && e[6] !== mine) { if (inMine) this.flashAt(e[3], e[4], e[5]); else { puffAt(e[3], e[4], e[5], [0xffffff, 0xfef9c3], 10); sfx3('zap', e[3], e[5], 90); } }
        if (k === 's') sfx3('hiss', e[3], e[4], 80);
      }
    },
    combat(dt, t) {
      const W = WP[this.cw()] || WP.ar;
      if (this.faceT > 0) { this.faceT -= dt; P.yaw = this.aimYaw; }
      this.swingT = Math.max(0, this.swingT - dt);
      if (this.rl) { this.rl.t -= dt; if (this.rl.t <= 0) { const w = WP[this.rl.wid]; this.ammo[this.rl.wid] = w.mag; this.rl = null; sfx('click'); } }
      if (this.healT > 0) { this.healT -= dt; if (this.healT <= 0) { this.healT = 0; if (this.mm) { this.uses.medkit = 1; this.ask('m'); } puffAt(P.x, P.y + 3, P.z, [0x86efac, 0xffffff], 10); sfx('unlock'); this.drawBar(); } }
      if (!this.canAct()) { this.firing = false; this.burstQ = 0; this.spin = Math.max(0, this.spin - dt * 2); return; }
      // holding the mouse button (not dragging the camera) keeps automatic weapons firing
      if (this.hold && !this.hold.auto && !this.hold.up && !(typeof drag !== 'undefined' && drag && drag.moved) && t - this.hold.at > 0.16 && this.mouse) { if (W.auto || W.melee || W.spin) { this.hold.auto = true; this.firing = 'mouse'; } }
      if (this.firing === 'mouse' && typeof drag !== 'undefined' && drag && drag.moved) this.firing = false;
      const wantFire = !!this.firing && (W.auto || W.melee || this.firing === 'auto');
      if (W.spin) { this.spin = wantFire && !this.rl ? Math.min(W.spin + 0.5, this.spin + dt) : Math.max(0, this.spin - dt * 1.5); }
      if (wantFire && t >= this.next) this.trigger(this.firing === 'mouse' && this.mouse ? this.aimFrom(this.mouse.x, this.mouse.y) : null);
      if (this.burstQ > 0 && t >= this.burstAt && !this.rl) {
        const wid = this.cw(), BW = WP[wid];
        if (BW && BW.burst && (this.ammo[wid] ?? BW.mag) > 0) { this.burstQ--; this.burstAt = t + BW.bgap; this.shoot(wid, BW, this.burstAim && this.burstQ === BW.burst - 1 ? this.burstAim : this.firing === 'mouse' && this.mouse ? this.aimFrom(this.mouse.x, this.mouse.y) : this.burstAim || null); }
        else this.burstQ = 0;
      }
    },
    // the bots: where the host says they are, holding their guns, shooting
    drawBots(g, dt) {
      const want = new Map();
      for (const m of (g && g.M) || []) for (const [id, name, seed, team, wid] of m.bots) { const q = m.b && m.b[id]; if (q) want.set(id, { q, name, seed, wid, alive: (m.al || []).includes(id) }); }
      for (const [id, a] of this.botAv) if (!want.has(id)) { dropAvatar(a); this.botAv.delete(id); const h = this.held.get(id); if (h) dropModel(h.m); this.held.delete(id); }
      for (const [id, w] of want) {
        let a = this.botAv.get(id);
        if (a && a.dead && w.alive) { dropAvatar(a); this.botAv.delete(id); a = null; } // a new round: back in one piece
        if (!a) {
          const r = mulberry(w.seed | 0);
          a = makeAvatar(okAv([Math.floor(r() * 6), Math.floor(r() * 10), Math.floor(r() * 8), Math.floor(r() * 16), Math.floor(r() * 11), 0, 0, Math.floor(r() * 9), 0, 0]), '🤖 ' + w.name, false);
          a.g.position.set(w.q[0], w.q[1], w.q[2]); a.g.rotation.y = w.q[3]; scene.add(a.g); a.sN = w.q[4]; this.botAv.set(id, a);
        }
        if (!w.alive) { if (!a.dead) scatter(a); updateDead(a, dt); if (a.dead.t > 2.5) a.g.visible = false; continue; }
        const p = a.g.position, k = this.H ? 1 : Math.min(1, dt * 10);
        p.x += (w.q[0] - p.x) * k; p.y += (w.q[1] - p.y) * k; p.z += (w.q[2] - p.z) * k;
        let dy = w.q[3] - a.g.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; a.g.rotation.y += dy * Math.min(1, dt * 12);
        animateAvatar(a, dt, !!w.q[8], false); placeShadow(a);
        this.grip(a, id, w.wid, 0);
        if (w.q[4] !== a.sN) { a.sN = w.q[4]; const y = a.g.rotation.y, o = [p.x - Math.sin(y) * 1.3 + Math.cos(y) * 1.4, p.y + 3.7, p.z - Math.cos(y) * 1.3 - Math.sin(y) * 1.4]; this.tracer(o, [w.q[5], w.q[6], w.q[7]], 0xfff3b0); this.flash(o); const W = WP[w.wid] || WP.ar; sfx3(W.pel ? 'cannon' : w.wid === 'sniper' ? 'boom' : 'gun', p.x, p.z, 120, { gap: 30, vol: 0.7 }); }
      }
    },
    // other people's shots, swings and throws
    peerFx(dt) {
      for (const [k, v] of this.swingOf) { if (v - dt <= 0) this.swingOf.delete(k); else this.swingOf.set(k, v - dt); }
      for (const p of Net.peers) {
        if (p.isMe || !p.presence) continue;
        const pr = p.presence, a = Net.avatars.get(p.peer);
        if (Array.isArray(pr.sh)) {
          const n = pr.sh[0], s0 = this.shSeen.get(p.peer); this.shSeen.set(p.peer, n);
          if (s0 != null && n !== s0 && a && !a.dead) {
            const W = WP[pr.sh[4]] || WP.ar;
            if (W.melee) { this.swingOf.set(p.peer, 0.3); sfx3('swing', a.g.position.x, a.g.position.z, 50); }
            else { const g = a.g.position, y = a.g.rotation.y, o = [g.x - Math.sin(y) * 1.3 + Math.cos(y) * 1.4, g.y + 3.7, g.z - Math.cos(y) * 1.3 - Math.sin(y) * 1.4]; this.tracer(o, [+pr.sh[1], +pr.sh[2], +pr.sh[3]], W.pel ? 0xffd27a : 0xfff3b0); this.flash(o); sfx3(W.pel ? 'cannon' : pr.sh[4] === 'sniper' ? 'boom' : 'gun', g.x, g.z, 120, { gap: 30, vol: 0.7 }); }
          }
        }
        if (Array.isArray(pr.gn) && pr.gn.length === 8) {
          const n = pr.gn[0], s0 = this.gnSeen.get(p.peer); this.gnSeen.set(p.peer, n);
          if (s0 != null && n !== s0 && WP[pr.gn[1]] && WP[pr.gn[1]].fuse) this.throwIt(pr.gn[1], pr.gn.slice(2, 5).map(Number), pr.gn.slice(5, 8).map(Number), false, p.peer);
        }
      }
    },
    // grenades in the air: they bounce off the ground and walls
    drawNades(dt) {
      for (let i = this.nades.length - 1; i >= 0; i--) {
        const n = this.nades[i]; n.t -= dt; n.vy -= 50 * dt;
        const solid = (x, y, z) => parts.some((p) => p.solid && p.on && !p.land && x > p.x - p.sx / 2 && x < p.x + p.sx / 2 && y > p.y - p.sy / 2 && y < p.y + p.sy / 2 && z > p.z - p.sz / 2 && z < p.z + p.sz / 2);
        let nx = n.x + n.vx * dt; if (solid(nx, n.y, n.z)) { n.vx *= -0.45; nx = n.x; } n.x = nx;
        let nz = n.z + n.vz * dt; if (solid(n.x, n.y, nz)) { n.vz *= -0.45; nz = n.z; } n.z = nz;
        n.y += n.vy * dt;
        const gy = groundBelow(n.x, n.y + 1, n.z); if (gy > -1e8 && n.y < gy + 0.35) { n.y = gy + 0.35; n.vy = Math.abs(n.vy) * 0.35; n.vx *= 0.65; n.vz *= 0.65; }
        n.m.position.set(n.x, n.y, n.z); n.m.rotation.x += dt * 8;
        if (n.t <= 0 || n.y < -60) { scene.remove(n.m); dropModel(n.m); this.nades.splice(i, 1); if (n.y > -60) this.pop(n); }
      }
    },
    // smoke clouds: the host's list in each match, and your own in the lobby
    drawSmoke(g, dt) {
      const want = new Map();
      for (const m of (g && g.M) || []) for (const s of m.sm || []) want.set(`${m.id}:${s[0]}:${s[1]}`, s);
      this.localSm = this.localSm.filter((s) => (s[2] -= dt) > 0);
      for (const s of this.localSm) want.set(`l:${s[3]}`, s);
      for (const [k, c] of this.smokes) if (!want.has(k)) { scene.remove(c.g); for (const o of c.g.children) o.material.dispose(); this.smokes.delete(k); }
      for (const [k, s] of want) {
        let c = this.smokes.get(k);
        if (!c) {
          const grp = new THREE.Group(), r = mulberry(Math.floor(s[0] * 13 + s[1] * 7));
          for (let i = 0; i < 16; i++) { const o = new THREE.Mesh(SMOKE_GEO, new THREE.MeshLambertMaterial({ color: 0xd1d5db, transparent: true, opacity: 0, depthWrite: false })); const a = r() * Math.PI * 2, d = r() * SMOKE_R * 0.75; o.position.set(Math.cos(a) * d, 1 + r() * 5, Math.sin(a) * d); o.scale.setScalar(2.4 + r() * 2.2); grp.add(o); }
          grp.position.set(s[0], 0, s[1]); scene.add(grp); c = { g: grp, t: 0 }; this.smokes.set(k, c);
          sfx3('hiss', s[0], s[1], 80);
        }
        c.t += dt;
        const op = Math.min(0.92, c.t * 1.5) * Math.min(1, s[2] / 2);
        for (const o of c.g.children) { o.material.opacity = op; o.rotation.y += dt * 0.2; }
      }
    },
    // over everyone in your match: a marker (blue: your team, red: the other) and their health
    drawTags(m) {
      const want = new Set();
      if (m && m.ph !== 'mend') for (const id of m.tm[0].concat(m.tm[1])) if (id !== myPeer() && (m.al || []).includes(id)) want.add(id);
      for (const [id, t] of this.tags) if (!want.has(id)) { scene.remove(t.g); this.tags.delete(id); }
      for (const id of want) {
        const p = this.drawnPos(id); let t = this.tags.get(id);
        if (!t) {
          const ally = m.tm[this.myTeam].includes(id), grp = new THREE.Group();
          const mk = new THREE.Mesh(TAG_GEO, ally ? TAG_ALLY : TAG_FOE); mk.rotation.x = Math.PI; mk.position.y = 0.9; grp.add(mk);
          const bg = new THREE.Mesh(BOX, BAR_BG); bg.scale.set(2.6, 0.32, 0.05); grp.add(bg);
          const fill = new THREE.Mesh(BOX, ally ? BAR_ALLY : BAR_FOE); fill.scale.set(2.5, 0.22, 0.06); grp.add(fill);
          scene.add(grp); t = { g: grp, fill, mk }; this.tags.set(id, t);
        }
        t.g.visible = !!p;
        if (!p) continue;
        t.g.position.set(p.x, p.y + 7.4, p.z); t.g.quaternion.copy(camera.quaternion);
        const f = clamp((m.hp[id] != null ? m.hp[id] : 100) / 100, 0, 1); t.fill.scale.x = Math.max(0.01, 2.5 * f); t.fill.position.x = -1.25 * (1 - f);
      }
    },
    drawDummies(dt, t) {
      for (const d of this.dummies || []) {
        if (d.id === 'dummy:1') d.a.g.position.x = d.x0 + Math.sin(t * 0.9) * 7;
        animateAvatar(d.a, dt, d.id === 'dummy:1', false); placeShadow(d.a);
        d.hurtT = Math.max(0, d.hurtT - dt); setGlow(d.a, d.hurtT > 0 ? 0x7f1d1d : null);
      }
    },
    // the pads light up a spot for each player on them
    drawPads(g) {
      const pq = (g && g.pq) || [];
      PADS.forEach((pd, i) => {
        const q = pq[i], sp = this.spots && this.spots[i]; if (!sp) return;
        for (const s of [0, 1]) sp[s].forEach((mesh, k) => { const on = !!(q && q.s && q.s[s] && q.s[s][k]); mesh.material.opacity = on ? 0.95 : 0.3 + Math.sin(performance.now() / 300 + k) * 0.05; });
        const txt = !q || !q.s || (!q.s[0].length && !q.s[1].length) ? '' : q.busy ? 'Waiting for an arena…' : q.t >= 0 ? `Starting in ${Math.ceil(q.t)}…` : `${Math.min(pd.md, q.s[0].length)} vs ${Math.min(pd.md, q.s[1].length)} · bots in ${Math.ceil(q.w)}`;
        if (txt !== (this.padTxt || [])[i]) {
          (this.padTxt = this.padTxt || [])[i] = txt;
          if (this.padLab[i]) { place.remove(this.padLab[i]); this.padLab[i].material.map.dispose(); this.padLab[i].material.dispose(); this.padLab[i] = null; }
          if (txt) { const l = label(txt, { size: 1.1, bg: 'rgba(15,23,42,.7)', color: '#fde68a' }); l.position.set(pd.x, 6, pd.z); place.add(l); this.padLab[i] = l; }
        }
      });
    },
    // weapons in hands: yours, everyone else's (what they say they hold), and the bots'
    pose() {
      this.grip(me, 'me', this.cw(), this.swingT);
      for (const [peer, a] of Net.avatars) { const p = Net.peers.find((q) => q.peer === peer), hd = p && p.presence ? String(p.presence.hd || '') : ''; this.grip(a, peer, WP[hd] ? hd : '', this.swingOf.get(peer) || 0); }
    },
    grip(a, key, wid, swing) {
      if (!a || a.dead) return;
      let h = this.held.get(key);
      if (!h || h.a !== a || h.w !== wid) {
        if (h) dropModel(h.m);
        h = { a, w: wid, m: wid ? model(wid) : null };
        if (h.m) { const W = WP[wid]; h.m.rotation.x = W.sl < 2 ? -Math.PI / 2 : -Math.PI / 2 + 0.5; h.m.position.set(0, -1.9, W.sl < 2 ? -0.1 : 0); a.armR.add(h.m); }
        this.held.set(key, h);
      }
      const W = WP[wid];
      if (!W) return;
      if (W.sl < 2) { a.armR.rotation.x = Math.PI / 2; if (W.sl === 0) { a.armL.rotation.x = 1.35; a.armL.rotation.z = 0.55; } else a.armL.rotation.z = 0; }
      else { a.armL.rotation.z = 0; if (swing > 0) a.armR.rotation.x = 2.6 - (1 - swing / 0.3) * 2.6; else if (W.sl === 2) a.armR.rotation.x = 0.6; }
    },
    drawBanner(g, m, left, alive) {
      if (!g) { setBanner('Getting the server…'); return; }
      if (!m) {
        const mine = myPeer(), qi = (g.pq || []).findIndex((q) => q && q.s && (q.s[0].includes(mine) || q.s[1].includes(mine)));
        if (qi >= 0) { const q = g.pq[qi]; setBanner(q.busy ? '⏳ All three arenas are in use — your match starts as soon as one is free' : q.t >= 0 ? `⚔️ Match starting in ${Math.ceil(q.t)}…` : `⏳ Waiting for an opponent — a 🤖 bot takes the empty spots in ${Math.ceil(q.w)}s`); }
        else setBanner(touchy ? '⚔️ Stand on a 1v1 or 2v2 pad to duel' : '⚔️ Stand on a 1v1 or 2v2 pad to duel · 🎒 <b>L</b> loadout · 🎯 dummies behind you');
        return;
      }
      const t = this.myTeam, dots = (tm) => m.tm[tm].map((id) => ((m.al || []).includes(id) || m.ph === 'pre' ? '●' : '<u>●</u>')).join('');
      const names = (tm) => (m.md === 1 ? `<span class="rv-nm">${esc(this.nameOfId(m.tm[tm][0] || ''))}</span>` : dots(tm));
      const sb = `<span class="rv-sb"><i>${names(t)}</i><b class="t0">${m.s[t]}</b><i>—</i><b class="t1">${m.s[1 - t]}</b><i>${names(1 - t)}</i></span>`;
      const ph = m.ph === 'pre' ? `Round ${m.rd}` : m.ph === 'fight' ? `${alive ? '' : '👻 out · '}${mmss(left)}` : m.ph === 'rend' ? (m.w < 0 ? 'Draw' : m.w === t ? 'Round won' : 'Round lost') : m.w === t ? '🏆 Victory!' : 'Defeat';
      setBanner(`${sb} <span style="font-size:14px;color:#cbd5e1;margin-left:8px">${ph}<span class="rv-ft"> · first to ${TO}</span></span>`);
    },
    statOf(pr, isMe) { return isMe ? (this.save ? this.save.wins | 0 : 0) : +pr.rw || 0; },
    sortKey(pr, isMe) { return this.statOf(pr, isMe); },
    prompts() { return this.mm ? [] : [{ x: KIOSK.x, z: KIOSK.z, r: 6.5, text: 'Loadout', fn: () => this.loadout() }]; },
    hud() {
      const m = this.mm, W = WP[this.cw()] || WP.ar;
      const ammo = W.sl < 2 ? (this.rl && this.rl.wid === this.cw() ? '⏳ reloading…' : `${W.e} ${this.ammo[this.cw()] ?? W.mag} / ${W.mag}`) : W.sl === 3 ? `${W.e} ${W.n}` : `${W.e} ${W.n}`;
      if (!m) return touchy ? `${ammo} · 🔥 Fire to shoot` : `${ammo} · 🖱️ click to shoot · R reload · 1–4 weapons · G utility`;
      if (!(m.al || []).includes(myPeer())) return '👻 You’re out this round — watching from the balcony';
      const hp = m.hp[myPeer()] != null ? m.hp[myPeer()] : 100, c = hp > 60 ? '#22c55e' : hp > 30 ? '#f59e0b' : '#ef4444';
      return `<span class="rv-hp"><i style="width:${hp}%;background:${c}"></i></span><b style="color:${c}">${hp}</b> ❤️ · ${ammo}${this.healT > 0 ? ' · 🩹 healing…' : ''}`;
    },
    coinShop: [
      { id: 'fast', e: '⚡', n: 'Fast Hands', d: 'Reload 30% faster, for good', price: 500, kind: 'pass' },
      { id: 'steady', e: '🎯', n: 'Steady Aim', d: 'Your shots spread 35% less, for good', price: 600, kind: 'pass' },
      shopSpeed(500, 1.06),
    ],
  };
  const SMOKE_GEO = new THREE.IcosahedronGeometry(1, 1), TAG_GEO = new THREE.ConeGeometry(0.45, 0.8, 4);
  const TAG_ALLY = new THREE.MeshBasicMaterial({ color: 0x3b82f6 }), TAG_FOE = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const BAR_BG = new THREE.MeshBasicMaterial({ color: 0x111827 }), BAR_ALLY = new THREE.MeshBasicMaterial({ color: 0x60a5fa }), BAR_FOE = new THREE.MeshBasicMaterial({ color: 0xf87171 });
  const W_ = { get coins() { return typeof W !== 'undefined' && W && W.coins != null ? W.coins : 0; } }; // (W is the wallet; the weapons here are WP)
  // the first box a ray (unit dir) meets: how far along it, or max
  function rayBox(o, d, b, max) {
    let t0 = 0, t1 = max;
    for (let a = 0; a < 3; a++) {
      const lo = b[a], hi = b[a + 3], oa = o[a], da = d[a];
      if (Math.abs(da) < 1e-9) { if (oa < lo || oa > hi) return Infinity; continue; }
      let ta = (lo - oa) / da, tb = (hi - oa) / da; if (ta > tb) { const q = ta; ta = tb; tb = q; }
      if (ta > t0) t0 = ta; if (tb < t1) t1 = tb; if (t0 > t1) return Infinity;
    }
    return t0;
  }
  // how far a ray (unit dir) goes before it meets a block (or the ground)
  function wallHit(o, d, max, ground) {
    let best = max;
    const ex = [Math.min(o[0], o[0] + d[0] * max), Math.min(o[1], o[1] + d[1] * max), Math.min(o[2], o[2] + d[2] * max), Math.max(o[0], o[0] + d[0] * max), Math.max(o[1], o[1] + d[1] * max), Math.max(o[2], o[2] + d[2] * max)];
    for (const p of parts) {
      if (!p.solid || p.land || (!ground && p.sy < 0.8 && p.y < 1)) continue;
      const b = [p.x - p.sx / 2, p.y - p.sy / 2, p.z - p.sz / 2, p.x + p.sx / 2, p.y + p.sy / 2, p.z + p.sz / 2];
      if (b[3] < ex[0] || b[0] > ex[3] || b[4] < ex[1] || b[1] > ex[4] || b[5] < ex[2] || b[2] > ex[5]) continue;
      const t = rayBox(o, d, b, best); if (t > 0.05 && t < best) best = t;
    }
    return best;
  }
  addExp(RV);
  window.__rbRV = RV; // for tests
})();
