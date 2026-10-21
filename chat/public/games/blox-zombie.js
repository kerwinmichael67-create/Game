/* =====================================================================
   BLOXVERSE — ZOMBIE OUTBREAK. An open world overrun by the undead: a
   town, a hospital, a gas station and motel, a farm, a forest, a lake,
   a graveyard, a radio tower and a military base, around a walled Safe
   Zone with a trader, a medic and a mission board. Search houses, shops
   and cars for weapons, ammo, food and medkits, level up, and survive
   the nights (every fourth one is a Blood Moon, with a boss).
   The zombies are run by the host (whoever has been on the server
   longest). Everyone checks their own shots where they fire them and
   sends the hits to the host; zombies bite whoever they reach.
   ===================================================================== */
(() => {
  const HALF = 260, CELL = 2, GN = (HALF * 2) / CELL, SAFE = 24, TAU = Math.PI * 2;
  const DAY = 300, DUSK = 0.66; // a day lasts five minutes; the last third of it is night
  const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const e1 = (v) => AL[clamp(Math.round(v), 0, 63)], e2 = (v) => { v = clamp(Math.round(v), 0, 4095); return AL[v >> 6] + AL[v & 63]; };
  const d1 = (s, i) => AL.indexOf(s[i]), d2 = (s, i) => (AL.indexOf(s[i]) << 6) | AL.indexOf(s[i + 1]);
  const lerp = (a, b, k) => a + (b - a) * k;
  const short = (n) => { n = Math.floor(n || 0); return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'K' : n.toLocaleString('en-US'); };
  const style = document.createElement('style');
  style.textContent = `
    #zsV{position:absolute;left:12px;bottom:12px;width:236px;padding:10px 12px 11px;border-radius:16px;display:flex;flex-direction:column;gap:6px;font:600 12.5px var(--fh);pointer-events:none}
    .touchy #zsV{bottom:178px;transform:scale(.8);transform-origin:left bottom}
    #zsV .row{display:flex;align-items:center;gap:8px}#zsV .row>span:first-child{width:18px;text-align:center}
    #zsV .meter{flex:1;height:11px}#zsV .meter i{transition:width .25s}
    #zsV .hp i{background:linear-gradient(180deg,#f87171,#dc2626)}#zsV .fd i{background:linear-gradient(180deg,#fdba74,#ea580c)}
    #zsV .st i{background:linear-gradient(180deg,#7dd3fc,#0284c7)}#zsV .xp i{background:linear-gradient(180deg,#fde047,#ca8a04)}
    #zsV .lv{display:flex;justify-content:space-between;color:#cbd5e1;font-size:12px}
    #zsMap{position:absolute;right:12px;top:50%;transform:translateY(-50%);width:156px;height:156px;border-radius:50%;border:3px solid rgba(255,255,255,.28);box-shadow:var(--drop);overflow:hidden;pointer-events:none;background:#1f3320}
    #zsMap canvas{width:100%;height:100%;display:block}
    .touchy #zsMap{top:auto;bottom:250px;transform:scale(.8);transform-origin:right bottom}
    #zsHurt{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 150px rgba(190,0,0,.75);opacity:0;transition:opacity .35s}
    #zsSearch{position:absolute;left:50%;top:60%;transform:translateX(-50%);width:220px;padding:9px 12px;border-radius:14px;text-align:center;font:600 14px var(--fh);pointer-events:none;display:none}
    #zsSearch .meter{margin-top:6px}
    #zsCross{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;pointer-events:none;display:none}
    #zsCross::before,#zsCross::after{content:'';position:absolute;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.6)}
    #zsCross::before{left:12px;top:2px;width:2px;height:22px}#zsCross::after{top:12px;left:2px;height:2px;width:22px}
    #zsTouch{display:none}.touchy #zsTouch{display:block}
    #zsTouch button{position:absolute;pointer-events:auto;border-radius:50%;border:2px solid rgba(255,255,255,.4);color:#fff;font-family:var(--fh);box-shadow:0 6px 18px rgba(0,0,0,.3)}
    #zsFire{right:24px;bottom:140px;width:88px;height:88px;font-size:34px;background:radial-gradient(circle at 40% 35%,rgba(248,113,113,.75),rgba(185,28,28,.6))}
    #zsRel{right:124px;bottom:150px;width:56px;height:56px;font-size:22px;background:radial-gradient(circle at 40% 35%,rgba(255,255,255,.3),rgba(255,255,255,.1))}
    #zsRun{right:130px;bottom:214px;width:56px;height:56px;font-size:22px;background:radial-gradient(circle at 40% 35%,rgba(125,211,252,.55),rgba(2,132,199,.4))}
    #zsRun.on,#zsAim.on{border-color:#fde047;box-shadow:0 0 0 3px rgba(253,224,71,.5)}
    #zsAim{right:40px;bottom:244px;width:60px;height:60px;font-size:24px;background:radial-gradient(circle at 40% 35%,rgba(253,224,71,.45),rgba(161,98,7,.4))}
    #zsScope{position:absolute;inset:0;pointer-events:none;display:none}
    #zsScope::before,#zsScope::after{content:'';position:absolute;left:50%;top:50%;background:rgba(0,0,0,.85)}
    #zsScope::before{width:2px;height:60vmin;margin:-30vmin 0 0 -1px}#zsScope::after{height:2px;width:60vmin;margin:-1px 0 0 -30vmin}
    .touchy #xbar.zs{max-width:calc(100vw - 400px)}
    @media (max-width:640px){
      .touchy #xbar.zs{max-width:calc(100vw - 20px);gap:4px;padding-top:16px}
      .touchy #xbar.zs .xslot .k{display:none}.touchy #xbar.zs .xslot .n{right:-2px;top:-7px;font-size:9px;padding:2px 5px 1px}
      .touchy #xbar.zs .xslot{width:50px;min-width:0;height:60px;padding-left:2px;padding-right:2px;font-size:9px;white-space:normal;overflow:hidden;border-radius:14px}
      .touchy #xbar.zs .xslot .e{font-size:20px}.touchy #xbar.zs .xslot .pic{width:38px;height:30px}
      .touchy #zsFire{bottom:300px;right:14px;width:80px;height:80px;font-size:30px}
      .touchy #zsRel{bottom:300px;right:104px;width:52px;height:52px}
      .touchy #zsRun{bottom:362px;right:104px;width:52px;height:52px}
      .touchy #zsAim{bottom:390px;right:20px;width:56px;height:56px}
      .touchy #zsMap{bottom:462px;transform:scale(.62)}
      .touchy #zsV{bottom:300px;transform:scale(.75)}
      .zs-on.touchy.hasbar #prompt{left:12px;transform:none;bottom:400px}
    }
    #zsCross.aim{width:16px;height:16px;margin:-8px 0 0 -8px}#zsCross.aim::before{left:7px;top:0;height:16px}#zsCross.aim::after{top:7px;left:0;width:16px}
    .zs-w{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
    .zs-w .xp-card img{width:100%;height:84px;object-fit:contain}
    .zs-lock{color:#fca5a5;font-size:12px}
    .zs-q{display:flex;flex-direction:column;gap:6px}
    .zs-map{position:relative;width:min(100%,calc(100vh - 150px));aspect-ratio:1;margin:0 auto;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.4)}
    .zs-map canvas{width:100%;height:100%;display:block}
    .zs-legend{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:10px}`;
  document.head.append(style);

  /* ---------------- what's in the world ---------------- */
  // zombies: hp, speed, damage per bite, seconds between bites, reach, xp, cash, size
  const ZT = [
    { n: 'Walker', hp: 100, sp: 6.5, dmg: 12, cd: 1.1, reach: 2.7, xp: 10, cash: 6, s: 1, skin: 0x7fa36b, shirt: 0x56677a, pants: 0x3f3a33 },
    { n: 'Runner', hp: 60, sp: 12.5, dmg: 8, cd: 0.75, reach: 2.5, xp: 14, cash: 8, s: 0.95, skin: 0x9bbf83, shirt: 0x8b2e2e, pants: 0x2d3748 },
    { n: 'Brute', hp: 480, sp: 5.2, dmg: 26, cd: 1.6, reach: 3.8, xp: 45, cash: 30, s: 1.55, skin: 0x5e7d4f, shirt: 0x3b3b3b, pants: 0x2b2118 },
    { n: 'Exploder', hp: 70, sp: 8.5, dmg: 0, cd: 1, reach: 3, xp: 18, cash: 12, s: 1.1, skin: 0xa3b84a, shirt: 0xc9c25d, pants: 0x4a4a2a, boom: 1 },
    { n: 'Abomination', hp: 6000, sp: 7.2, dmg: 38, cd: 1.4, reach: 5.6, xp: 900, cash: 700, s: 2.5, skin: 0x6b4f7a, shirt: 0x2a1b33, pants: 0x1c1424, boss: 1 },
  ];
  // weapons: m melee / s sidearm / p primary
  const WP = {
    fists: { n: 'Fists', e: '👊', slot: 'm', dmg: 14, rate: 2.4, range: 4.4, price: 0, lvl: 1, d: 'Better than nothing' },
    bat: { n: 'Baseball Bat', e: '🏏', slot: 'm', dmg: 32, rate: 1.9, range: 5.6, price: 150, lvl: 1, d: 'A solid swing' },
    machete: { n: 'Machete', e: '🔪', slot: 'm', dmg: 50, rate: 2.1, range: 5.9, price: 650, lvl: 3, d: 'Quick and sharp' },
    katana: { n: 'Katana', e: '🗡️', slot: 'm', dmg: 90, rate: 2.3, range: 7, price: 3600, lvl: 10, d: 'Slices through crowds' },
    pistol: { n: 'Pistol', e: '🔫', slot: 's', gun: 1, dmg: 26, rate: 3.2, mag: 12, ammo: 'light', range: 95, spread: 0.018, reload: 1.2, price: 300, lvl: 1, d: 'Reliable sidearm' },
    revolver: { n: 'Revolver', e: '🤠', slot: 's', gun: 1, dmg: 72, rate: 1.4, mag: 6, ammo: 'light', range: 115, spread: 0.01, reload: 2, price: 1500, lvl: 5, d: 'Hits hard, slow to reload' },
    shotgun: { n: 'Shotgun', e: '💥', slot: 'p', gun: 1, dmg: 15, pellets: 8, rate: 1.1, mag: 6, ammo: 'shells', range: 38, spread: 0.11, reload: 2.4, price: 1200, lvl: 4, d: 'Devastating up close' },
    smg: { n: 'SMG', e: '⚡', slot: 'p', gun: 1, auto: 1, dmg: 17, rate: 10, mag: 30, ammo: 'light', range: 75, spread: 0.045, reload: 1.8, price: 2600, lvl: 6, d: 'Sprays fast — hold to fire' },
    ar: { n: 'Assault Rifle', e: '🎯', slot: 'p', gun: 1, auto: 1, dmg: 33, rate: 7, mag: 30, ammo: 'rifle', range: 140, spread: 0.022, reload: 2.1, price: 5200, lvl: 8, d: 'Accurate and automatic' },
    sniper: { n: 'Sniper Rifle', e: '🔭', slot: 'p', gun: 1, dmg: 240, pierce: 3, rate: 0.75, mag: 5, ammo: 'rifle', range: 260, spread: 0.002, reload: 2.8, price: 9500, lvl: 12, d: 'Goes through three zombies' },
    minigun: { n: 'Minigun', e: '🌀', slot: 'p', gun: 1, auto: 1, dmg: 21, rate: 16, mag: 150, ammo: 'rifle', range: 110, spread: 0.06, reload: 4, price: 26000, lvl: 18, slow: 0.72, d: 'Slows you down. Worth it.' },
  };
  const IT = {
    bandage: { n: 'Bandage', e: '🩹', heal: 25, price: 25 },
    medkit: { n: 'Medkit', e: '⛑️', heal: 75, price: 90 },
    beans: { n: 'Canned Beans', e: '🥫', food: 40, price: 15 },
    chips: { n: 'Chips', e: '🍟', food: 22, price: 10 },
    soda: { n: 'Soda', e: '🥤', food: 12, stam: 1, price: 8 },
    energy: { n: 'Energy Drink', e: '🔋', food: 8, boost: 25, price: 60 },
    grenade: { n: 'Grenade', e: '💣', price: 120 },
  };
  // building: walls and barricades keep zombies out (a barricade is low enough for you to step over), spike traps hurt and
  // slow the ones that walk over them, turrets shoot the ones nearby. cw × cd: the footprint in 2-stud cells (before turning)
  const BP = {
    wall: { n: 'Wooden Wall', e: '🧱', cw: 3, cd: 1, h: 5.5, hp: 900, wood: 8, block: 1, d: 'Keeps zombies (and bullets) out' },
    barricade: { n: 'Barricade', e: '🚧', cw: 2, cd: 1, h: 1.8, hp: 450, wood: 5, block: 1, d: 'Zombies can’t get past; you can step over it' },
    spikes: { n: 'Spike Trap', e: '📍', cw: 2, cd: 2, h: 0.6, hp: 320, wood: 6, trap: 1, d: 'Hurts and slows zombies that walk on it' },
    turret: { n: 'Auto Turret', e: '🔫', cw: 1, cd: 1, h: 3.2, hp: 500, wood: 20, cash: 400, lvl: 4, block: 1, gun: 1, d: 'Shoots zombies near it (two each)' },
  };
  const BKEYS = Object.keys(BP), MAX_OWN = 30, MAX_ALL = 120, MAX_TURRETS = 2; // (what's built travels in the host's presence, which the room keeps under 4 KiB)
  const NOPE = ['', 'Not in the Safe Zone', 'Something’s in the way', 'The ground isn’t flat there', 'Someone’s standing there', 'A zombie’s in the way', 'Too far away', 'You’ve built as much as you can (30)', 'Two turrets each at most', 'The server’s full of builds', 'Too close to the edge', 'Not on the water', 'That’s gone already', 'That’s someone else’s'];
  const AMMO = { light: { n: 'Light ammo', e: '🟡', pack: 30, price: 40 }, shells: { n: 'Shells', e: '🔴', pack: 12, price: 60 }, rifle: { n: 'Rifle ammo', e: '🟢', pack: 30, price: 90 } };
  // what turns up where: [thing, weight]; $ is cash
  const LOOT = {
    house: [['wood', 12], ['beans', 30], ['chips', 25], ['soda', 25], ['bandage', 18], ['$', 24], ['light', 14], ['shells', 6], ['bat', 3], ['pistol', 2], ['energy', 4]],
    fridge: [['beans', 30], ['soda', 35], ['chips', 20], ['energy', 8]],
    grocery: [['beans', 35], ['chips', 30], ['soda', 30], ['energy', 10], ['$', 10]],
    pharmacy: [['bandage', 45], ['medkit', 18], ['energy', 8], ['$', 8]],
    hospital: [['medkit', 30], ['bandage', 40], ['$', 10], ['energy', 6]],
    police: [['light', 40], ['shells', 22], ['pistol', 5], ['revolver', 3], ['shotgun', 3], ['bandage', 12], ['grenade', 5]],
    guns: [['light', 35], ['shells', 30], ['rifle', 18], ['shotgun', 4], ['smg', 3], ['revolver', 4], ['grenade', 6]],
    car: [['wood', 5], ['$', 35], ['soda', 20], ['chips', 18], ['light', 14], ['bandage', 10], ['energy', 6]],
    farm: [['wood', 24], ['beans', 30], ['shells', 25], ['machete', 4], ['shotgun', 3], ['$', 18], ['soda', 12]],
    camp: [['wood', 22], ['beans', 30], ['bandage', 20], ['rifle', 12], ['machete', 4], ['soda', 15], ['$', 12]],
    military: [['rifle', 40], ['shells', 18], ['grenade', 18], ['medkit', 12], ['ar', 4], ['smg', 4], ['sniper', 2], ['minigun', 1], ['$', 10]],
  };
  const LOOT_BACK = 240; // seconds until a container you searched has something again
  const AREAS = [
    { id: 'safe', n: 'Safe Zone', e: '🛡️', r: [-SAFE, -SAFE, SAFE, SAFE], c: '#94a3b8' },
    { id: 'hospital', n: 'St. Mercy Hospital', e: '🏥', r: [-160, -200, -106, -146], c: '#e2e8f0' },
    { id: 'town', n: 'Maple Town', e: '🏘️', r: [-100, -240, 100, -68], c: '#a8a29e' },
    { id: 'gas', n: 'Gas Station & Motel', e: '⛽', r: [86, -64, 200, -9], c: '#fca5a5' },
    { id: 'farm', n: 'Sunny Acres Farm', e: '🚜', r: [142, 20, 248, 142], c: '#d6a35c' },
    { id: 'military', n: 'Fort Ironside', e: '🪖', r: [-248, 92, -136, 232], c: '#84a98c' },
    { id: 'lake', n: 'Mirror Lake', e: '🎣', r: [64, 98, 160, 210], c: '#60a5fa' },
    { id: 'radio', n: 'Radio Tower', e: '📡', r: [-56, 170, -10, 215], c: '#f87171' },
    { id: 'grave', n: 'Old Graveyard', e: '🪦', r: [-114, 130, -62, 186], c: '#9ca3af' },
    { id: 'woods', n: 'Whispering Woods', e: '🌲', r: [-250, -235, -110, 85], c: '#3f7d3a' },
  ];
  const areaAt = (x, z) => AREAS.find((a) => x >= a.r[0] && x <= a.r[2] && z >= a.r[1] && z <= a.r[3]) || null;
  const LAKE = [110, 160, 40];
  const inLake = (x, z) => Math.hypot(x - LAKE[0], z - LAKE[1]) < LAKE[2];
  const inSafe = (x, z) => Math.abs(x) < SAFE && Math.abs(z) < SAFE;
  // missions: three at a time from the board in the Safe Zone
  const MISSIONS = [
    { k: 'kill', t: 'Kill {n} zombies', n: (l) => 15 + l * 3, cash: 120 },
    { k: 'kill1', t: 'Kill {n} runners', n: () => 6, cash: 150 },
    { k: 'kill2', t: 'Take down {n} brutes', n: () => 2, cash: 220 },
    { k: 'kill3', t: 'Pop {n} exploders', n: () => 3, cash: 160 },
    { k: 'melee', t: 'Kill {n} zombies up close (melee)', n: () => 8, cash: 160 },
    { k: 'head', t: 'Land {n} headshots', n: () => 10, cash: 140 },
    { k: 'loot', t: 'Search {n} containers', n: () => 8, cash: 100 },
    { k: 'night', t: 'Survive a night outside the Safe Zone', n: () => 1, cash: 300 },
    { k: 'visit', at: 'military', t: 'Scout Fort Ironside', n: () => 1, cash: 160 },
    { k: 'visit', at: 'radio', t: 'Reach the Radio Tower', n: () => 1, cash: 120 },
    { k: 'visit', at: 'farm', t: 'Check on Sunny Acres Farm', n: () => 1, cash: 110 },
    { k: 'visit', at: 'hospital', t: 'Raid St. Mercy Hospital', n: () => 1, cash: 120 },
    { k: 'visit', at: 'grave', t: 'Visit the Old Graveyard at night', n: () => 1, cash: 180, night: 1 },
    { k: 'build', t: 'Build {n} things', n: () => 6, cash: 130 },
    { k: 'chop', t: 'Chop {n} wood from trees', n: () => 12, cash: 90 },
  ];
  const need = (l) => Math.round(80 * Math.pow(l, 1.5));

  /* ---------------- the clock ---------------- */
  function clock() {
    const t = now() + (ZS.tOff || 0), day = Math.floor(t / DAY), f = t / DAY - day, night = f >= DUSK; // tOff: tests jump the clock
    const dark = f < 0.04 ? 1 - f / 0.04 : f < DUSK - 0.05 ? 0 : f < DUSK ? (f - (DUSK - 0.05)) / 0.05 : 1;
    return { t, day, f, night, dark, blood: day % 4 === 3, n: (day % 99) + 1, left: night ? (1 - f) * DAY : (DUSK - f) * DAY };
  }

  /* ---------------- the zombies' map: which 2-stud cells they can walk ---------------- */
  const blocked = new Uint8Array(GN * GN), floorY = new Float32Array(GN * GN), BFSQ = new Int32Array(GN * GN);
  const pieceAt = new Int16Array(GN * GN), TREES = []; // (a built piece's id + 1 in each of its cells: 2 in blocked is a piece, 1 the world)
  const ci = (v) => Math.floor((v + HALF) / CELL), cc = (i) => -HALF + (i + 0.5) * CELL;
  const cell = (x, z) => { const i = ci(x), j = ci(z); return i < 0 || j < 0 || i >= GN || j >= GN ? -1 : j * GN + i; };
  function cellsIn(x0, z0, x1, z1, m, fn) {
    for (let j = Math.max(0, ci(z0 - m)); j <= Math.min(GN - 1, ci(z1 + m)); j++) for (let i = Math.max(0, ci(x0 - m)); i <= Math.min(GN - 1, ci(x1 + m)); i++) {
      const x = cc(i), z = cc(j); if (x > x0 - m && x < x1 + m && z > z0 - m && z < z1 + m) fn(j * GN + i);
    }
  }
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const walkable = (x, z) => { const c = cell(x, z); return c >= 0 && !blocked[c] && Math.abs(x) < HALF - 4 && Math.abs(z) < HALF - 4; };
  const floorAt = (x, z) => { const c = cell(x, z); return c < 0 ? 0 : floorY[c]; };
  function clearLine(x0, z0, x1, z1) {
    const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.5);
    for (let s = 1; s < n; s++) { const c = cell(x0 + (x1 - x0) * s / n, z0 + (z1 - z0) * s / n); if (c < 0 || blocked[c]) return false; }
    return true;
  }

  // what players build: a piece covers whole cells (turned, its footprint the other way round)
  const bdims = (k, r) => { const B = BP[BKEYS[k]]; return r ? [B.cd, B.cw] : [B.cw, B.cd]; };
  const bbox = (k, i, j, r) => { const [w, d] = bdims(k, r); return [-HALF + i * CELL, -HALF + j * CELL, -HALF + (i + w) * CELL, -HALF + (j + d) * CELL]; };
  function bcells(k, i, j, r, fn) { const [w, d] = bdims(k, r); for (let jj = j; jj < j + d; jj++) for (let ii = i; ii < i + w; ii++) fn(jj * GN + ii); }
  const boxDist = (x, z, b) => Math.hypot(Math.max(b[0] - x, 0, x - b[2]), Math.max(b[1] - z, 0, z - b[3]));
  const pieceFloor = (k, i, j, r) => { let y = 0; bcells(k, i, j, r, (c) => (y = Math.max(y, floorY[c]))); return y; };
  function markCells(pc, on) { // (taking one away leaves alone any cell another has taken since)
    const B = BP[BKEYS[pc.k]];
    bcells(pc.k, pc.i, pc.j, pc.r, (c) => { if (on) { pieceAt[c] = pc.id + 1; if (B.block) blocked[c] = 2; } else if (pieceAt[c] === pc.id + 1) { pieceAt[c] = 0; if (blocked[c] === 2) blocked[c] = 0; } });
  }
  // why a piece can't go there (0: it can). by: whoever's building it (it must be near them), zs: the zombies
  function fits(k, i, j, r, by, zs) {
    const B = BP[BKEYS[k]], [w, d] = bdims(k, r), b = bbox(k, i, j, r);
    if (i < 3 || j < 3 || i + w > GN - 3 || j + d > GN - 3) return 10;
    if (b[0] < SAFE + 1 && b[2] > -SAFE - 1 && b[1] < SAFE + 1 && b[3] > -SAFE - 1) return 1;
    if (inLake(b[0], b[1]) || inLake(b[2], b[1]) || inLake(b[0], b[3]) || inLake(b[2], b[3])) return 11;
    let why = 0, lo = 1e9, hi = -1e9;
    bcells(k, i, j, r, (c) => { if (blocked[c] || pieceAt[c]) why = 2; lo = Math.min(lo, floorY[c]); hi = Math.max(hi, floorY[c]); });
    if (why) return why;
    if (hi - lo > 0.3) return 3;
    if (B.block) {
      for (const p of players()) if (p.x > b[0] - 0.95 && p.x < b[2] + 0.95 && p.z > b[1] - 0.95 && p.z < b[3] + 0.95 && p.y < hi + B.h - 0.2) return 4;
      for (const z of zs) if (!z.dead && z.x > b[0] - 1 && z.x < b[2] + 1 && z.z > b[1] - 1 && z.z < b[3] + 1) return 5;
    }
    if (by && Math.hypot((b[0] + b[2]) / 2 - by.x, (b[1] + b[3]) / 2 - by.z) > 20) return 6;
    return 0;
  }
  // the first piece that blocks the way between two points: its id, or -1
  function pieceBetween(x0, z0, x1, z1) {
    const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.7);
    for (let s = 1; s < n; s++) { const c = cell(x0 + (x1 - x0) * s / n, z0 + (z1 - z0) * s / n); if (c >= 0 && blocked[c] === 2 && pieceAt[c]) return pieceAt[c] - 1; }
    return -1;
  }

  /* ---------------- building the world, baked into a few big meshes ---------------- */
  // Thousands of blocks drawn one by one would be slow, so they're merged into a mesh per chunk of the map;
  // what you bump into is a list of invisible boxes beside them.
  const NOMESH = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial()); NOMESH.visible = false;
  const FACES = [
    [[1, 0, 0], [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], 2, 1], [[-1, 0, 0], [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], 2, 1],
    [[0, 0, 1], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], 0, 1], [[0, 0, -1], [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], 0, 1],
    [[0, 1, 0], [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], 0, 2], [[0, -1, 0], [[1, 0, 1], [0, 0, 1], [0, 0, 0], [1, 0, 0]], 0, 2],
  ];
  let BK = null, LOOTS = [], MAPBOX = [], baked = [];
  function baker() {
    // kinds: s studded, p plain, g glowing; a digit after it is a layer of flat things lying on the ground (patches,
    // roads, road markings), each drawn just in front of the one below so they never flicker against it
    const lists = {};
    return {
      lists,
      add(k, b) { (lists[k] || (lists[k] = [])).push(b); },
      build(group) {
        const out = [], col = new THREE.Color();
        for (const k of Object.keys(lists)) {
          const chunks = new Map(), layer = +k.slice(1) || 0;
          for (const b of lists[k]) { const big = b[3] - b[0] > 200 || b[5] - b[2] > 200, key = big ? 'big' : Math.floor(((b[0] + b[3]) / 2 + HALF + 60) / 130) + ',' + Math.floor(((b[2] + b[5]) / 2 + HALF + 60) / 130); (chunks.get(key) || chunks.set(key, []).get(key)).push(b); }
          for (const list of chunks.values()) {
            const n = list.length, pos = new Float32Array(n * 72), nor = new Float32Array(n * 72), clr = new Float32Array(n * 72), uv = new Float32Array(n * 48), idx = new Uint32Array(n * 36);
            let v = 0, u = 0, ii = 0;
            for (const b of list) {
              col.set(b[6]); const sz = [b[3] - b[0], b[4] - b[1], b[5] - b[2]];
              for (const [nn, cs, ua, va] of FACES) {
                const base = v / 3;
                cs.forEach((c, q) => {
                  pos[v] = c[0] ? b[3] : b[0]; pos[v + 1] = c[1] ? b[4] : b[1]; pos[v + 2] = c[2] ? b[5] : b[2];
                  nor[v] = nn[0]; nor[v + 1] = nn[1]; nor[v + 2] = nn[2]; clr[v] = col.r; clr[v + 1] = col.g; clr[v + 2] = col.b; v += 3;
                  uv[u++] = q === 1 || q === 2 ? sz[ua] / 2 : 0; uv[u++] = q >= 2 ? sz[va] / 2 : 0;
                });
                idx[ii++] = base; idx[ii++] = base + 1; idx[ii++] = base + 2; idx[ii++] = base; idx[ii++] = base + 2; idx[ii++] = base + 3;
              }
            }
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
            g.setAttribute('color', new THREE.BufferAttribute(clr, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
            g.computeBoundingSphere();
            const mat = k[0] === 'g' ? new THREE.MeshBasicMaterial({ vertexColors: true }) : new THREE.MeshLambertMaterial({ vertexColors: true, map: k[0] === 's' ? tex(1, 1) : null });
            if (layer) { mat.polygonOffset = true; mat.polygonOffsetFactor = -layer; mat.polygonOffsetUnits = -4 * layer; }
            const m = new THREE.Mesh(g, mat); group.add(m); out.push(m);
          }
        }
        return out;
      },
    };
  }
  function solid(x0, y0, z0, x1, y1, z1, o) {
    const p = Object.assign({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2, sx: x1 - x0, sy: y1 - y0, sz: z1 - z0, solid: true, on: true, ox: 0, oy: 0, oz: 0, dx: 0, dy: 0, dz: 0, c: 0, m: NOMESH, zs: 1 }, o || {});
    parts.push(p); return p;
  }
  // a block: seen (studded, or o.plain, or o.glow: always bright) and bumped into (unless o.ghost)
  function blk(x0, y0, z0, x1, y1, z1, c, o = {}) {
    if (!(x1 - x0 > 0.01 && y1 - y0 > 0.01 && z1 - z0 > 0.01)) return;
    const b = [x0, y0, z0, x1, y1, z1, c];
    BK.add((o.glow ? 'g' : o.plain ? 'p' : 's') + (o.layer || ''), b);
    if (y1 > 0.2 && !o.nomap) MAPBOX.push(b);
    if (o.ghost) return;
    solid(x0, y0, z0, x1, y1, z1, o.truss ? { truss: true } : null);
    if (y0 < 3.2 && y1 > 0.7) cellsIn(x0, z0, x1, z1, 0.7, (k) => (blocked[k] = 1));
    else if (y1 <= 1.2) cellsIn(x0, z0, x1, z1, 0, (k) => (floorY[k] = Math.max(floorY[k], y1)));
  }
  const loot = (kind, x, z, lab, y = 0.3) => LOOTS.push({ id: LOOTS.length, kind, x, z, y, lab });
  let roadN = 0, padN = 0, ROADS = [];
  function road(x0, z0, x1, z1, lines) {
    const top = 0.05 + (roadN++ % 8) * 0.01; // every road a hair apart, so crossings don't flicker
    blk(x0, -0.4, z0, x1, top, z1, 0x3a3d42, { plain: true, ghost: true, nomap: 1, layer: 2 });
    ROADS.push([x0, z0, x1, z1]);
    if (!lines) return;
    const ax = x1 - x0 > z1 - z0, m = ax ? (z0 + z1) / 2 : (x0 + x1) / 2, a0 = ax ? x0 : z0, a1 = ax ? x1 : z1;
    for (let a = a0 + 2; a < a1 - 3; a += 8) {
      if (Math.abs(a + 1.5) < 8) continue;
      if (ax) blk(a, top - 0.1, m - 0.2, a + 3, top + 0.05, m + 0.2, 0xe8d44d, { plain: true, ghost: true, nomap: 1, layer: 3 });
      else blk(m - 0.2, top - 0.1, a, m + 0.2, top + 0.05, a + 3, 0xe8d44d, { plain: true, ghost: true, nomap: 1, layer: 3 });
    }
  }
  const pad = (x0, z0, x1, z1, c, layer) => { const top = 0.01 + (padN++ % 10) * 0.004; blk(x0, -0.4, z0, x1, top, z1, c, { plain: true, ghost: true, nomap: 1, layer: layer || 1 }); MAPBOX.push([x0, 0, z0, x1, top, z1, c]); };
  const onRoad = (x, z, m) => ROADS.some((r) => x > r[0] - m && x < r[2] + m && z > r[1] - m && z < r[3] + m);
  const BUILT = []; // building footprints (trees keep out)
  const label3 = (text, x, y, z, size, o) => { const s = label(text, Object.assign({ size: size || 1.6 }, o || {})); s.position.set(x, y, z); place.add(s); return s; };

  // things to put in rooms, against a wall: wall n/s/e/w of the inside rect, t (0..1) along it
  function against(R, wall, t, w, d, h, c, o = {}) {
    const [x0, z0, x1, z1] = R;
    let b, px, pz;
    if (wall === 'n' || wall === 's') { const m = lerp(x0 + w / 2, x1 - w / 2, t); b = wall === 'n' ? [m - w / 2, z0, m + w / 2, z0 + d] : [m - w / 2, z1 - d, m + w / 2, z1]; px = m; pz = wall === 'n' ? z0 + d + 1.3 : z1 - d - 1.3; }
    else { const m = lerp(z0 + w / 2, z1 - w / 2, t); b = wall === 'w' ? [x0, m - w / 2, x0 + d, m + w / 2] : [x1 - d, m - w / 2, x1, m + w / 2]; pz = m; px = wall === 'w' ? x0 + d + 1.3 : x1 - d - 1.3; }
    const y0 = o.y0 || 0.3;
    blk(b[0], y0, b[1], b[2], y0 + h, b[3], c, { plain: o.plain });
    if (o.top) blk(b[0] + 0.15, y0 + h, b[1] + 0.15, b[2] - 0.15, y0 + h + 0.3, b[3] - 0.15, o.top, { plain: true, ghost: true });
    if (o.loot) loot(o.loot, px, pz, o.lab || 'Cabinet', 0.3);
    return b;
  }
  const OPP = { n: 's', s: 'n', e: 'w', w: 'e' }, SIDES = { n: ['w', 'e'], s: ['e', 'w'], e: ['n', 's'], w: ['s', 'n'] };
  function furnish(type, R, door) {
    const back = OPP[door], [sa, sb] = SIDES[door], cx = (R[0] + R[2]) / 2, cz = (R[1] + R[3]) / 2;
    const kind = { farmhouse: 'farm', motel: 'house', church: 'house' }[type] || 'house';
    if (type === 'house' || type === 'farmhouse' || type === 'motel') {
      against(R, back, 0.12, 3.2, 4.6, 1.1, 0x6b4f3a, { top: 0xf1f5f9 }); // bed
      if (type !== 'motel') against(R, back, 0.92, 2.4, 2, 4.8, 0xe5e7eb, { plain: true, loot: 'fridge', lab: 'Fridge' });
      against(R, sa, 0.55, 3.6, 1.4, 3.2, 0x8b5e34, { loot: kind, lab: 'Cabinet' });
      if (type !== 'motel') { against(R, sb, 0.35, 3, 1.4, 2.4, 0x7c4a2a, { loot: kind, lab: 'Drawers' }); blk(cx - 1.6, 0.3, cz - 1, cx + 1.6, 2.6, cz + 1, 0x92653a); }
    } else if (type === 'grocery' || type === 'store') {
      const n = type === 'store' ? 2 : 3;
      for (let k = 0; k < n; k++) { const t = (k + 1) / (n + 1), alongX = door === 'e' || door === 'w'; const L = alongX ? (R[3] - R[1]) * 0.55 : (R[2] - R[0]) * 0.55; if (alongX) { const x = lerp(R[0] + 3, R[2] - 3, t); blk(x - 0.8, 0.3, cz - L / 2, x + 0.8, 5, cz + L / 2, 0xd4d4d8, { plain: true }); for (let q = 0; q < 4; q++) blk(x - 0.9, 1 + q * 1.1, cz - L / 2 + 0.3, x + 0.9, 1.6 + q * 1.1, cz + L / 2 - 0.3, [0xef4444, 0xf59e0b, 0x22c55e, 0x3b82f6][(q + k) % 4], { plain: true, ghost: true }); loot('grocery', x + 1.8, cz, 'Shelf'); } else { const z = lerp(R[1] + 3, R[3] - 3, t); blk(cx - L / 2, 0.3, z - 0.8, cx + L / 2, 5, z + 0.8, 0xd4d4d8, { plain: true }); for (let q = 0; q < 4; q++) blk(cx - L / 2 + 0.3, 1 + q * 1.1, z - 0.9, cx + L / 2 - 0.3, 1.6 + q * 1.1, z + 0.9, [0xef4444, 0xf59e0b, 0x22c55e, 0x3b82f6][(q + k) % 4], { plain: true, ghost: true }); loot('grocery', cx, z + 1.8, 'Shelf'); } }
      against(R, back, 0.5, 9, 2, 3, 0xe0f2fe, { plain: true, loot: type === 'store' ? 'car' : 'fridge', lab: type === 'store' ? 'Till' : 'Freezer' });
    } else if (type === 'police') {
      against(R, back, 0.2, 4, 1.2, 5, 0x64748b, { plain: true, loot: 'police', lab: 'Locker' });
      against(R, back, 0.8, 4, 1.2, 5, 0x64748b, { plain: true, loot: 'police', lab: 'Locker' });
      against(R, sa, 0.3, 4, 2.2, 2.4, 0x7c5a3c, { top: 0x111827, loot: 'police', lab: 'Desk' });
      against(R, sb, 0.7, 4, 2.2, 2.4, 0x7c5a3c, { top: 0x111827, loot: 'police', lab: 'Desk' });
      for (let k = 0; k < 5; k++) blk(cx - 4 + k * 2, 0.3, cz - 0.15, cx - 3.7 + k * 2, 6.5, cz + 0.15, 0x9ca3af, { plain: true }); // a cell's bars
    } else if (type === 'guns') {
      against(R, back, 0.3, 5, 1, 5.5, 0x5b4636, { loot: 'guns', lab: 'Gun rack' });
      against(R, back, 0.8, 5, 1, 5.5, 0x5b4636, { loot: 'guns', lab: 'Gun rack' });
      against(R, sa, 0.5, 6, 2.2, 2.8, 0x3f3f46, { top: 0x93c5fd, loot: 'guns', lab: 'Counter' });
      against(R, sb, 0.4, 3, 3, 2.6, 0x4d5d33, { loot: 'guns', lab: 'Ammo crate' });
    } else if (type === 'pharmacy') {
      against(R, back, 0.12, 4.6, 1.4, 5, 0xf1f5f9, { plain: true, loot: 'pharmacy', lab: 'Shelf' });
      against(R, back, 0.92, 3.6, 1.4, 5, 0xf1f5f9, { plain: true, loot: 'pharmacy', lab: 'Shelf' });
      against(R, sa, 0.5, 5, 2, 2.8, 0x0ea5e9, { plain: true, loot: 'pharmacy', lab: 'Counter' });
    } else if (type === 'diner') {
      against(R, back, 0.5, 10, 2, 3, 0xd1d5db, { plain: true, top: 0xef4444, loot: 'grocery', lab: 'Kitchen' });
      against(R, sa, 0.85, 2.4, 2, 5, 0xe5e7eb, { plain: true, loot: 'fridge', lab: 'Fridge' });
      for (let k = 0; k < 3; k++) { const t = (k + 0.7) / 3.4, x = lerp(R[0] + 3, R[2] - 3, t), z = lerp(R[1] + 3, R[3] - 3, 0.5); blk(x - 1.2, 0.3, z - 1.2, x + 1.2, 2.6, z + 1.2, 0xdc2626, { plain: true }); }
    } else if (type === 'hospital') {
      for (let k = 0; k < 4; k++) { against(R, k < 2 ? sa : sb, k % 2 ? 0.75 : 0.25, 3, 5, 1.3, 0xcbd5e1, { top: 0xffffff }); against(R, back, (k + 0.5) / 4, 3, 1.4, 4.5, 0xf8fafc, { plain: true, loot: 'hospital', lab: 'Medicine cabinet' }); }
    } else if (type === 'barn') {
      for (let k = 0; k < 6; k++) { const x = lerp(R[0] + 3, R[2] - 3, (k % 3) / 2), z = lerp(R[1] + 3, R[3] - 6, k < 3 ? 0.15 : 0.6); blk(x - 1.6, 0.3, z - 1.2, x + 1.6, 2.6 + (k % 2) * 0.3, z + 1.2, 0xe9c46a); }
      against(R, back, 0.2, 4, 2, 3, 0xb91c1c, { loot: 'farm', lab: 'Toolbox' });
      against(R, back, 0.8, 4, 2, 2, 0xd6c29a, { plain: true, loot: 'farm', lab: 'Feed sacks' });
    } else if (type === 'barracks') {
      for (let k = 0; k < 4; k++) against(R, back, (k + 0.5) / 4, 2.6, 4.6, 1.2, 0x4d5d33, { top: 0x9ca3af });
      against(R, sa, 0.5, 4, 1.2, 5, 0x4b5563, { plain: true, loot: 'military', lab: 'Locker' });
      against(R, sb, 0.5, 4, 1.2, 5, 0x4b5563, { plain: true, loot: 'military', lab: 'Locker' });
    } else if (type === 'hq' || type === 'armory') {
      against(R, back, 0.08, 5, 1.2, 5.2, 0x4d5d33, { loot: 'military', lab: type === 'armory' ? 'Weapon rack' : 'Supply shelf' });
      against(R, back, 0.92, 5, 1.2, 5.2, 0x4d5d33, { loot: 'military', lab: type === 'armory' ? 'Weapon rack' : 'Supply shelf' });
      against(R, sa, 0.5, 3, 3, 2.6, 0x556b2f, { loot: 'military', lab: 'Crate' });
      if (type === 'hq') blk(cx - 3, 0.3, cz - 2, cx + 3, 2.8, cz + 2, 0x3f3f46, { plain: true });
    } else if (type === 'church') {
      for (let k = 0; k < 4; k++) { const z = lerp(R[1] + 4, R[3] - 6, k / 3); blk(R[0] + 3, 0.3, z - 0.6, cx - 1.5, 1.6, z + 0.6, 0x7c4a2a); blk(cx + 1.5, 0.3, z - 0.6, R[2] - 3, 1.6, z + 0.6, 0x7c4a2a); }
      against(R, back, 0.5, 5, 2, 2.4, 0xf8fafc, { top: 0xfacc15, loot: 'house', lab: 'Donation box' });
    } else if (type === 'cabin' || type === 'hut' || type === 'shack' || type === 'crypt') {
      if (type === 'crypt') { blk(cx - 1.2, 0.3, cz - 3, cx + 1.2, 1.8, cz + 3, 0x57534e); against(R, back, 0.5, 4, 2, 2, 0x44403c, { loot: 'camp', lab: 'Old chest' }); }
      else { against(R, back, 0.2, 3, 4.4, 1.1, 0x6b4f3a, { top: 0xd6d3d1 }); against(R, back, 0.85, 3, 2, 2.2, 0x78350f, { loot: 'camp', lab: type === 'shack' ? 'Radio desk' : 'Chest' }); against(R, sa, 0.5, 3, 1.2, 3, 0x7c4a2a, { loot: type === 'hut' ? 'farm' : 'camp', lab: 'Shelf' }); }
    }
  }
  // a building: walls with a doorway, windows, a floor, a roof, and things inside
  function building(x0, z0, x1, z1, o) {
    const h = o.h || 8, T = 1, door = o.door || 's', dw = o.dw || 4.6, dh = Math.min(6.6, h - 1.2), wc = o.wall;
    BUILT.push([x0 - 2, z0 - 2, x1 + 2, z1 + 2]);
    blk(x0 + T, -0.1, z0 + T, x1 - T, 0.3, z1 - T, o.floor || 0xa8896a, { plain: true });
    const walls = { n: [x0, z0, x1, z0 + T], s: [x0, z1 - T, x1, z1], w: [x0, z0 + T, x0 + T, z1 - T], e: [x1 - T, z0 + T, x1, z1 - T] };
    for (const k of ['n', 's', 'w', 'e']) {
      const [a0, b0, a1, b1] = walls[k], ax = k === 'n' || k === 's', lo = ax ? a0 : b0, hi = ax ? a1 : b1;
      const gaps = [];
      for (const d of o.doors || (k === door ? [[k, o.dpos != null ? o.dpos : (lo + hi) / 2, dw]] : [])) if (d[0] === k) gaps.push([d[1] - d[2] / 2, d[1] + d[2] / 2]);
      gaps.sort((p, q) => p[0] - q[0]);
      const box = (s0, s1, y0, y1) => (ax ? blk(s0, y0, b0, s1, y1, b1, wc, { plain: o.plainWalls }) : blk(a0, y0, s0, a1, y1, s1, wc, { plain: o.plainWalls }));
      let at = lo; const segs = [];
      for (const [g0, g1] of gaps) { segs.push([at, g0]); at = g1; }
      segs.push([at, hi]);
      for (const [s0, s1] of segs) if (s1 - s0 > 0.05) box(s0, s1, 0, h);
      for (const [g0, g1] of gaps) box(g0, g1, dh, h);
      // windows: dark glass set into the outside of the wall
      if (o.windows !== false) {
        const out = k === 'n' || k === 'w' ? -1 : 1, face = k === 'n' ? b0 : k === 's' ? b1 : k === 'w' ? a0 : a1;
        for (let w = lo + 3; w + 2.4 < hi - 2; w += 6) {
          if (gaps.some(([g0, g1]) => w + 2.4 > g0 - 1 && w < g1 + 1)) continue;
          for (let fl = 0; fl < (o.floors || 1); fl++) {
            const y0 = 3 + fl * 6; if (y0 + 2.2 > h - 0.5) break;
            const f0 = out < 0 ? face - 0.08 : face - 0.3, f1 = out < 0 ? face + 0.3 : face + 0.08;
            if (ax) blk(w, y0, f0, w + 2.4, y0 + 2.2, f1, o.glass || 0x2b3a4f, { plain: true, ghost: true }); else blk(f0, y0, w, f1, y0 + 2.2, w + 2.4, o.glass || 0x2b3a4f, { plain: true, ghost: true });
          }
        }
      }
    }
    // the roof: flat with a lip, or stepped like a gable
    const rc = o.roof || 0x5b3a29;
    const ov = o.ov != null ? o.ov : 0.4;
    if (o.flat) { blk(x0 - ov, h, z0 - ov, x1 + ov, h + 0.7, z1 + ov, rc, { plain: true }); blk(x0 - ov, h + 0.7, z0 - ov, x1 + ov, h + 1.4, z0 + 0.5, rc, { plain: true }); }
    else {
      const along = x1 - x0 >= z1 - z0;
      for (let i = 0; i < 4; i++) {
        const k = i * 0.13;
        if (along) { const dz = (z1 - z0 + 1.2) * k; blk(x0 - 0.6, h + i * 0.9, z0 - 0.6 + dz, x1 + 0.6, h + (i + 1) * 0.9, z1 + 0.6 - dz, rc); }
        else { const dx = (x1 - x0 + 1.2) * k; blk(x0 - 0.6 + dx, h + i * 0.9, z0 - 0.6, x1 + 0.6 - dx, h + (i + 1) * 0.9, z1 + 0.6, rc); }
      }
    }
    if (o.sign) {
      const m = o.dpos != null ? o.dpos : door === 'n' || door === 's' ? (x0 + x1) / 2 : (z0 + z1) / 2;
      const [sx, sz] = door === 'n' ? [m, z0 - 0.6] : door === 's' ? [m, z1 + 0.6] : door === 'w' ? [x0 - 0.6, m] : [x1 + 0.6, m];
      label3(o.sign, sx, h + 2.6, sz, 1.7, { bg: 'rgba(15,23,42,.82)' });
      if (o.awning) { const a = o.awning; if (door === 'n') blk(m - 5, dh + 0.3, z0 - 2.6, m + 5, dh + 0.7, z0, a, { plain: true, ghost: true }); else if (door === 's') blk(m - 5, dh + 0.3, z1, m + 5, dh + 0.7, z1 + 2.6, a, { plain: true, ghost: true }); else if (door === 'w') blk(x0 - 2.6, dh + 0.3, m - 5, x0, dh + 0.7, m + 5, a, { plain: true, ghost: true }); else blk(x1, dh + 0.3, m - 5, x1 + 2.6, dh + 0.7, m + 5, a, { plain: true, ghost: true }); }
    }
    if (o.type) furnish(o.type, [x0 + T, z0 + T, x1 - T, z1 - T], door);
  }
  function car(x, z, ax, c) {
    const [hx, hz] = ax ? [4.4, 2.1] : [2.1, 4.4];
    blk(x - hx, 0.55, z - hz, x + hx, 1.85, z + hz, c);
    const cab = ax ? [x - 2.4, z - 1.85, x + 1.5, z + 1.85] : [x - 1.85, z - 1.5, x + 1.85, z + 2.4];
    blk(cab[0], 1.85, cab[1], cab[2], 3.05, cab[3], c);
    blk(cab[0] - 0.06, 2.0, cab[1] - 0.06, cab[2] + 0.06, 2.85, cab[3] + 0.06, 0x1e293b, { plain: true, ghost: true });
    for (const s of [-1, 1]) for (const t of [-1, 1]) { // wheels poke out of the sides
      const a0 = s > 0 ? 1.75 : -2.3, a1 = s > 0 ? 2.3 : -1.75;
      if (ax) blk(x + t * 2.8 - 0.65, 0, z + a0, x + t * 2.8 + 0.65, 1.15, z + a1, 0x111111, { plain: true, ghost: true });
      else blk(x + a0, 0, z + t * 2.8 - 0.65, x + a1, 1.15, z + t * 2.8 + 0.65, 0x111111, { plain: true, ghost: true });
    }
    BUILT.push([x - hx - 1, z - hz - 1, x + hx + 1, z + hz + 1]);
    if (ax) loot('car', x, z + hz + 1.4, 'Car', 0); else loot('car', x + hx + 1.4, z, 'Car', 0);
  }
  function tree(x, z, s, pine) {
    TREES.push([x, z, s]);
    blk(x - 0.45 * s, 0, z - 0.45 * s, x + 0.45 * s, 5 * s, z + 0.45 * s, 0x6b4423);
    if (pine) { for (let i = 0; i < 4; i++) { const w = (3.1 - i * 0.7) * s; blk(x - w, (3 + i * 1.9) * s, z - w, x + w, (5 + i * 1.9) * s, z + w, 0x2f6b3a + i * 0x020400, { ghost: true }); } }
    else { blk(x - 2.6 * s, 4.2 * s, z - 2.6 * s, x + 2.6 * s, 7.4 * s, z + 2.6 * s, 0x3f8f3a, { ghost: true }); blk(x - 1.7 * s, 7.4 * s, z - 1.7 * s, x + 1.7 * s, 9.3 * s, z + 1.7 * s, 0x4aa043, { ghost: true }); }
  }
  const lamp = (x, z) => { blk(x - 0.2, 0, z - 0.2, x + 0.2, 8.2, z + 0.2, 0x52525b, { plain: true }); blk(x - 0.8, 8.2, z - 0.45, x + 0.8, 8.6, z + 0.45, 0xfff1c1, { glow: true, ghost: true }); };
  const crate = (x, z, s, c, kind) => { blk(x - s / 2, 0, z - s / 2, x + s / 2, s, z + s / 2, c || 0x556b2f); if (kind) loot(kind, x, z + s / 2 + 1.3, kind === 'military' ? 'Military crate' : 'Crate', 0); };
  function fence(x0, z0, x1, z1, h, c, gaps) { // a straight fence (along x or z) with gaps [from, to]
    const ax = x1 - x0 > z1 - z0, lo = ax ? x0 : z0, hi = ax ? x1 : z1; let at = lo;
    for (const [g0, g1] of (gaps || []).concat([[hi, hi]])) { if (g0 - at > 0.1) { if (ax) blk(at, 0, z0, g0, h, z1, c, { plain: true }); else blk(x0, 0, at, x1, h, g0, c, { plain: true }); } at = g1; }
  }

  function world() {
    BK = baker(); LOOTS = []; MAPBOX = []; ROADS = []; BUILT.length = 0; roadN = padN = 0; TREES.length = 0; pieceAt.fill(0);
    blocked.fill(0); floorY.fill(0);
    const r = mulberry(4242);
    // the ground, the edge of the world and mountains beyond it
    blk(-HALF - 70, -3, -HALF - 70, HALF + 70, 0, HALF + 70, 0x5d8f3e, { nomap: 1 });
    solid(-HALF - 4, -5, -HALF - 4, HALF + 4, 60, -HALF); solid(-HALF - 4, -5, HALF, HALF + 4, 60, HALF + 4);
    solid(-HALF - 4, -5, -HALF, -HALF, 60, HALF); solid(HALF, -5, -HALF, HALF + 4, 60, HALF);
    for (let side = 0; side < 4; side++) for (let a = -HALF - 40; a < HALF + 40; a += 26 + r() * 10) {
      const d = HALF + 14 + r() * 26, w = 18 + r() * 16, h = 18 + r() * 34, x = side < 2 ? a : (side === 2 ? -d : d), z = side < 2 ? (side === 0 ? -d : d) : a;
      for (let i = 0; i < 3; i++) { const k = 1 - i * 0.3; blk(x - w * k, -1 + i * h / 3, z - w * k, x + w * k, -1 + (i + 1) * h / 3, z + w * k, [0x6b7a5c, 0x7d8a6c, 0xe8edf2][i], { ghost: true, nomap: 1 }); }
    }
    // roads
    road(-6, -HALF, 6, -SAFE, true); road(-6, SAFE, 6, HALF, true); road(-HALF, -6, -SAFE, 6, true); road(SAFE, -6, HALF, 6, true);
    for (const z of [-95, -150, -205]) road(-110, z - 6, 110, z + 6, true);
    road(-170, -156, -110, -144, false);
    for (const x of [-70, 70]) road(x - 6, -211, x + 6, -89, false);
    road(-201, 6, -189, 96, false); road(160, 6, 168, 30, false);
    // ground patches
    pad(-104, -236, 104, -70, 0x8f9a86); pad(88, -54, 136, -7, 0x9ca3af); pad(-246, 94, -138, 230, 0x8b8f6a); pad(145, 22, 245, 142, 0x9b7d4f);
    pad(-112, 130, -62, 186, 0x4d6b3c); pad(-162, -204, -104, -144, 0x9ca3af);
    // street lamps along the main roads
    for (let a = -230; a <= 230; a += 34) { if (Math.abs(a) < 40) continue; lamp(8.5, a); lamp(a, -8.5); }

    /* ---- the Safe Zone ---- */
    blk(-SAFE + 0.05, -0.3, -SAFE + 0.05, SAFE - 0.05, 0.12, SAFE - 0.05, 0x8d9399, { plain: true, nomap: 1 });
    const T = 1.6, H = 7, G = 7, WC = 0x6b7280;
    for (const s of [-1, 1]) {
      const z0 = s < 0 ? -SAFE : SAFE - T, x0 = s < 0 ? -SAFE : SAFE - T;
      blk(-SAFE, 0, z0, -G, H, z0 + T, WC); blk(G, 0, z0, SAFE, H, z0 + T, WC);
      blk(x0, 0, -SAFE + T, x0 + T, H, -G, WC); blk(x0, 0, G, x0 + T, H, SAFE - T, WC);
      for (let a = -SAFE + 3; a < SAFE - 3; a += 4) { if (Math.abs(a + 0.8) < G + 2.4) continue; blk(a, H, z0 + 0.2, a + 1.6, H + 1.1, z0 + T - 0.2, 0x7b8494, { plain: true }); blk(x0 + 0.2, H, a, x0 + T - 0.2, H + 1.1, a + 1.6, 0x7b8494, { plain: true }); }
      // gates: pillars and an arch
      blk(-G - 2, 0, z0 - 0.5, -G + 0.3, 10, z0 + T + 0.5, 0x4b5563); blk(G - 0.3, 0, z0 - 0.5, G + 2, 10, z0 + T + 0.5, 0x4b5563);
      blk(-G - 2, 10, z0 - 0.5, G + 2, 11.6, z0 + T + 0.5, 0x374151, { plain: true });
      blk(x0 - 0.5, 0, -G - 2, x0 + T + 0.5, 10, -G + 0.3, 0x4b5563); blk(x0 - 0.5, 0, G - 0.3, x0 + T + 0.5, 10, G + 2, 0x4b5563);
      blk(x0 - 0.5, 10, -G - 2, x0 + T + 0.5, 11.6, G + 2, 0x374151, { plain: true });
      label3('🛡️ SAFE ZONE', 0, 13.4, s * (SAFE + 0.6), 2.2); label3('🛡️ SAFE ZONE', s * (SAFE + 0.6), 13.4, 0, 2.2);
    }
    cellsIn(-SAFE - 2, -SAFE - 2, SAFE + 2, SAFE + 2, 0, (k) => (blocked[k] = 1)); // zombies never get in
    // the trader's stall
    blk(-18, 0.12, -10.6, -6, 2.3, -9.2, 0x8b5e34); blk(-18, 0.12, -17, -6, 5.2, -15.8, 0x6b4f3a);
    for (let i = 0; i < 6; i++) blk(-18.4 + i * 2.1, 5.6, -17.2, -16.3 + i * 2.1, 6.1, -8.4, i % 2 ? 0xf8fafc : 0xdc2626, { plain: true, ghost: true });
    for (let i = 0; i < 5; i++) blk(-17.4 + i * 2.2, 2.4, -16.6, -16 + i * 2.2, 3.4, -15.7, [0x111827, 0x854d0e, 0x166534, 0x1e3a8a, 0x7f1d1d][i], { plain: true, ghost: true });
    // the medic's tent
    blk(7, 0.12, -17, 17, 5, -16, 0xf8fafc, { plain: true }); blk(7, 0.12, -16, 8, 5, -9, 0xf8fafc, { plain: true }); blk(16, 0.12, -16, 17, 5, -9, 0xf8fafc, { plain: true });
    blk(6.5, 5, -17.5, 17.5, 5.6, -8.5, 0xe2e8f0, { plain: true });
    blk(11, 5.6, -14.4, 13, 5.75, -11.6, 0xdc2626, { plain: true, ghost: true }); blk(10.6, 5.6, -13.5, 13.4, 5.7, -12.5, 0xdc2626, { plain: true, ghost: true });
    blk(9, 0.12, -15.6, 11.6, 1.2, -11, 0x94a3b8, { top: 0 }); blk(12.6, 0.12, -15.6, 15.2, 1.2, -11, 0x94a3b8);
    // the mission board
    blk(9.6, 0.12, 13, 10.2, 6, 13.6, 0x6b4423); blk(17.8, 0.12, 13, 18.4, 6, 13.6, 0x6b4423); blk(9.4, 2.4, 13.05, 18.6, 5.6, 13.55, 0x8b5e34, { plain: true });
    for (let i = 0; i < 3; i++) blk(10.4 + i * 2.8, 3, 12.95, 12.4 + i * 2.8, 5, 13.1, 0xf5f5dc, { plain: true, ghost: true });
    label3('📋 MISSIONS', 14, 7.4, 13.3, 1.4, { bg: 'rgba(15,23,42,.82)' });
    // tents, crates, sandbags, floodlights
    for (const [x, z] of [[-16, 10], [-16, 17]]) { blk(x - 3, 0.12, z - 2, x + 3, 2.6, z + 2, 0x4d7c0f); blk(x - 2.2, 2.6, z - 2, x + 2.2, 3.6, z + 2, 0x3f6212); }
    crate(4, 17, 2.4, 0x8b5e34); crate(6.8, 17.4, 2, 0x7c4a2a); crate(-4, -18, 2.2, 0x8b5e34);
    for (const [x, z] of [[-21, -21], [21, -21], [-21, 21], [21, 21]]) { blk(x - 0.3, 0.12, z - 0.3, x + 0.3, 11, z + 0.3, 0x52525b, { plain: true }); blk(x - 1.2, 11, z - 0.8, x + 1.2, 11.8, z + 0.8, 0xfffbe6, { glow: true, ghost: true }); }
    for (const s of [-1, 1]) for (let i = -2; i <= 2; i++) { if (!i) continue; blk(i * 2.6 - 1.2, 0, s * (SAFE + 3.2) - 0.8, i * 2.6 + 1.2, 1.3, s * (SAFE + 3.2) + 0.8, 0xc2a878); }
    this_spots.trader = [-12, -7.5]; this_spots.medic = [12, -7.6]; this_spots.board = [14, 11]; this_spots.fire = [0, 9];
    blk(-1.4, 0.12, 8.7, 1.4, 0.6, 9.3, 0x57534e, { plain: true, ghost: true }); blk(-0.3, 0.12, 7.6, 0.3, 0.55, 10.4, 0x6b4423, { plain: true, ghost: true });

    /* ---- Maple Town ---- */
    const H1 = 0xf5e6c8, H2 = 0xa7c7e7, H3 = 0xe8b4a0, H4 = 0xd9d4c4, H5 = 0xb5c99a, HC = [H1, H2, H3, H4, H5], RC = [0x5b3a29, 0x7f1d1d, 0x334155, 0x3f3f46, 0x14532d];
    let hn = 0;
    const house = (x0, z0, x1, z1, door) => { const k = hn++; building(x0, z0, x1, z1, { door, wall: HC[k % 5], roof: RC[(k * 3) % 5], type: 'house' }); };
    building(12, -138, 42, -108, { door: 'w', wall: 0x3b5b8c, roof: 0x1e293b, flat: true, h: 9, type: 'police', sign: '🚓 POLICE', awning: 0x1e3a8a });
    house(46, -140, 61, -126, 'e'); house(46, -121, 61, -106, 'e');
    building(-42, -138, -12, -108, { door: 'e', wall: 0xd9a441, roof: 0x7c2d12, flat: true, h: 9, type: 'grocery', sign: '🛒 GROCERY', awning: 0x16a34a });
    house(-61, -140, -46, -126, 'w'); house(-61, -121, -46, -106, 'w');
    building(12, -196, 36, -176, { door: 'w', wall: 0x6b4f3a, roof: 0x27272a, flat: true, h: 8.5, type: 'guns', sign: '🔫 GUN STORE', awning: 0x7f1d1d });
    building(12, -172, 36, -159, { door: 'w', wall: 0xe5f2ee, roof: 0x0f766e, flat: true, h: 8, type: 'pharmacy', sign: '💊 PHARMACY', awning: 0x0d9488 });
    house(42, -196, 61, -181, 'e'); house(42, -176, 61, -160, 'e');
    building(-38, -194, -12, -172, { door: 'e', wall: 0xc2414b, roof: 0x1f2937, flat: true, h: 8, type: 'diner', sign: '🍔 DINER', awning: 0xfacc15 });
    house(-61, -196, -46, -181, 'w'); house(-61, -176, -46, -160, 'w'); house(-36, -170, -20, -159, 's');
    for (const [a, b] of [[12, 27], [34, 49], [-27, -12], [-49, -34]]) house(a, -86, b, -72, 'n');
    house(12, -228, 27, -214, 's'); house(-27, -228, -12, -214, 's'); house(-52, -228, -36, -214, 's');
    building(32, -240, 58, -214, { door: 's', wall: 0xf1f5f9, roof: 0x334155, h: 12, type: 'church', sign: '⛪ CHAPEL' });
    blk(41, 15.5, -231, 49, 26, -223, 0xf1f5f9); blk(42.5, 26, -229.5, 47.5, 31, -224.5, 0x334155); blk(44.6, 31, -227.4, 45.4, 34, -226.6, 0xfacc15, { plain: true });
    for (const z of [[-140, -126], [-121, -106], [-196, -181], [-176, -160]]) { house(79, z[0], 94, z[1], 'w'); house(-94, z[0], -79, z[1], 'e'); }
    building(-152, -194, -114, -160, { door: 's', wall: 0xf1f5f9, roof: 0x94a3b8, flat: true, h: 12, floors: 2, type: 'hospital', sign: '🏥 HOSPITAL', awning: 0xdc2626, dw: 6 });
    blk(-134.5, 12.7, -178, -131.5, 12.92, -170, 0xdc2626, { plain: true, ghost: true }); blk(-137, 12.7, -175.5, -129, 12.86, -172.5, 0xdc2626, { plain: true, ghost: true });

    /* ---- the gas station and motel ---- */
    building(100, -48, 122, -34, { door: 's', wall: 0xfafafa, roof: 0xdc2626, flat: true, h: 7.5, type: 'store', sign: '⛽ GAS & GO', awning: 0xdc2626 });
    for (const [x, z] of [[97, -28], [125, -28], [97, -15], [125, -15]]) blk(x - 0.5, 0, z - 0.5, x + 0.5, 7, z + 0.5, 0xe5e7eb, { plain: true });
    blk(94, 7, -30.5, 128, 7.8, -12.5, 0xdc2626, { plain: true }); blk(94.2, 7.8, -30.3, 127.8, 8.1, -12.7, 0xf8fafc, { plain: true });
    for (const x of [104, 111, 118]) blk(x - 0.8, 0, -22.5, x + 0.8, 2.6, -20.5, 0x1f2937, { plain: true });
    for (let k = 0; k < 4; k++) building(140 + k * 14, -58, 154 + k * 14 - 0.02, -40, { door: 's', wall: 0xf4d6a0, roof: 0x9a3412, h: 7, flat: true, ov: 0, type: 'motel', windows: k % 2 === 0 });
    label3('🛏️ MOTEL', 168, 11, -39.2, 2, { bg: 'rgba(124,45,18,.85)' });

    /* ---- the farm ---- */
    building(168, 40, 200, 72, { door: 'n', dw: 9, wall: 0xa83232, roof: 0x3f3f46, h: 12, type: 'barn', sign: '🐄 BARN' });
    building(212, 40, 230, 56, { door: 'n', wall: 0xfef3c7, roof: 0x166534, type: 'farmhouse' });
    blk(206, 0, 64, 214, 22, 72, 0xcbd5e1); blk(206.6, 22, 64.6, 213.4, 25, 71.4, 0x94a3b8, { plain: true });
    for (let z = 92; z < 136; z += 4) blk(150, 0, z, 240, 2.4 + ((z / 4) % 3) * 0.05, z + 1.4, 0xa3b745, { ghost: true });
    fence(145, 21.6, 245, 22, 1.6, 0x8b6b45, [[158, 170]]); fence(145, 140, 245, 140.4, 1.6, 0x8b6b45); fence(145, 22, 145.4, 140, 1.6, 0x8b6b45); fence(244.6, 22, 245, 140, 1.6, 0x8b6b45);
    blk(176, 0, 76, 186, 2.6, 82, 0x16a34a); blk(176.5, 2.6, 79, 180.5, 5.2, 82, 0x15803d); blk(183, 0, 75.6, 186.4, 3.4, 77, 0x111111, { plain: true, ghost: true });
    loot('farm', 181, 84.4, 'Tractor', 0);
    for (const [x, z] of [[156, 34], [160, 60], [232, 80], [236, 30]]) { blk(x - 1.6, 0, z - 1.2, x + 1.6, 2.4, z + 1.2, 0xe9c46a); }

    /* ---- Fort Ironside ---- */
    const FC = 0x6b7280;
    fence(-245, 95.6, -138, 96, 6, FC, [[-201, -189]]); fence(-245, 228, -138, 228.4, 6, FC); fence(-245.4, 96, -245, 228, 6, FC); fence(-138, 96, -137.6, 228, 6, FC);
    building(-236, 108, -206, 124, { door: 's', wall: 0x6b7a4f, roof: 0x3f4a2f, flat: true, h: 8, type: 'barracks', sign: 'BARRACKS' });
    building(-236, 132, -206, 148, { door: 's', wall: 0x6b7a4f, roof: 0x3f4a2f, flat: true, h: 8, type: 'barracks' });
    building(-180, 106, -152, 126, { door: 's', wall: 0x8a8f6a, roof: 0x3f4a2f, flat: true, h: 9, type: 'hq', sign: '🪖 HQ' });
    building(-180, 136, -158, 152, { door: 'w', wall: 0x57534e, roof: 0x292524, flat: true, h: 8, type: 'armory', sign: 'ARMORY' });
    for (const [x, z] of [[-224, 166], [-204, 166]]) { blk(x - 7, 0, z - 5, x + 7, 3.4, z + 5, 0x4d5d33); blk(x - 5.5, 3.4, z - 5, x + 5.5, 5, z + 5, 0x3f4a2f); }
    for (const [x, z] of [[-240, 101], [-143, 101], [-240, 223], [-143, 223]]) {
      for (const [a, b] of [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) blk(x + a - 0.3, 0, z + b - 0.3, x + a + 0.3, 10, z + b + 0.3, 0x57534e, { plain: true });
      blk(x - 2.6, 10, z - 2.6, x + 2.6, 10.6, z + 2.6, 0x6b4423);
      for (const s of [-1, 1]) { blk(x - 2.6, 10.6, z + s * 2.6 - (s > 0 ? 0.3 : 0), x + 2.6, 11.8, z + s * 2.6 + (s < 0 ? 0.3 : 0), 0x57534e, { plain: true }); }
      blk(x - 2.6, 12.8, z - 2.6, x + 2.6, 13.3, z + 2.6, 0x3f4a2f, { plain: true, ghost: true });
      blk(x + 2.6, 0, z - 0.6, x + 3.6, 11.2, z + 0.6, 0x9ca3af, { plain: true, truss: true });
    }
    pad(-200, 180, -170, 210, 0x6b7280, 2);
    blk(-186.5, 0.04, 188, -184.5, 0.08, 202, 0xf8fafc, { plain: true, ghost: true, layer: 3 }); blk(-191.5, 0.04, 188, -189.5, 0.08, 202, 0xf8fafc, { plain: true, ghost: true, layer: 3 }); blk(-189.5, 0.045, 194, -186.5, 0.085, 196, 0xf8fafc, { plain: true, ghost: true, layer: 3 });
    blk(-192, 0, 190, -182, 4.6, 200, 0x3f4a2f); blk(-182, 2.4, 193.5, -170, 3.6, 196.5, 0x3f4a2f); blk(-200, 5, 194.4, -174, 5.4, 195.6, 0x1f2937, { plain: true, ghost: true }); blk(-188, 4.6, 194, -186, 5, 196, 0x1f2937, { plain: true, ghost: true });
    blk(-232, 0, 190, -214, 3, 204, 0x4d5d33); blk(-228, 3, 193, -218, 5.2, 201, 0x3f4a2f); blk(-240, 4, 196.4, -228, 4.8, 197.6, 0x27272a, { plain: true });
    for (const [x, z] of [[-215, 102], [-170, 160], [-160, 170], [-226, 150], [-150, 214], [-210, 214], [-190, 130], [-145, 140]]) crate(x, z, 2.6, 0x556b2f, 'military');
    for (let i = 0; i < 6; i++) blk(-203 - i * 0.02, 0, 100 + i * 4, -201.6, 1.4, 103 + i * 4, 0xc2a878);

    /* ---- Whispering Woods ---- */
    building(-176, -56, -160, -42, { door: 'e', wall: 0x8b5e34, roof: 0x3f2a14, type: 'cabin' });
    for (const [x, z] of [[-112, 36], [-104, 46]]) { blk(x - 2.5, 0, z - 2, x + 2.5, 2.4, z + 2, 0xf97316); blk(x - 1.6, 2.4, z - 2, x + 1.6, 3.2, z + 2, 0xea580c); }
    blk(-110.8, 0, 40.2, -107.2, 0.6, 43.8, 0x57534e); loot('camp', -106, 39, 'Backpack', 0); loot('camp', -115, 44, 'Supplies', 0);

    /* ---- Mirror Lake ---- */
    blk(106, 0.4, 112, 114, 0.75, 136, 0x8b6b45); for (const z of [116, 124, 132]) for (const x of [106.4, 113.6]) blk(x - 0.3, -1, z - 0.3, x + 0.3, 0.4, z + 0.3, 0x6b4f3a, { plain: true });
    building(126, 102, 138, 114, { door: 'w', wall: 0x7c5a3c, roof: 0x334155, type: 'hut', sign: '🎣 BAIT' });

    /* ---- the Radio Tower ---- */
    building(-52, 196, -40, 206, { door: 'e', wall: 0x9ca3af, roof: 0x334155, flat: true, h: 7, type: 'shack' });
    for (const [a, b] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) blk(-30 + a - 0.35, 0, 186 + b - 0.35, -30 + a + 0.35, 42, 186 + b + 0.35, 0xb91c1c, { plain: true });
    for (let y = 6; y < 42; y += 8) { blk(-33.4, y, 182.72, -26.6, y + 0.5, 183.28, 0xe5e7eb, { plain: true, ghost: true }); blk(-33.4, y + 0.5, 188.72, -26.6, y + 1, 189.28, 0xe5e7eb, { plain: true, ghost: true }); }
    blk(-30.6, 42, 185.4, -29.4, 43.2, 186.6, 0xff2020, { glow: true, ghost: true });

    /* ---- the Old Graveyard ---- */
    fence(-112, 130, -62, 130.4, 1.5, 0x27272a, [[-90, -84]]); fence(-112, 185.6, -62, 186, 1.5, 0x27272a); fence(-112.4, 130, -112, 186, 1.5, 0x27272a); fence(-62, 130, -61.6, 186, 1.5, 0x27272a);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const x = -106 + i * 7.5 + (r() - 0.5), z = 138 + j * 7 + (r() - 0.5); if (Math.abs(x + 87) < 4) continue; blk(x - 0.7, 0, z - 0.25, x + 0.7, 1.4 + r() * 0.8, z + 0.25, 0x9ca3af); }
    building(-96, 166, -82, 180, { door: 'n', wall: 0x57534e, roof: 0x292524, flat: true, h: 6.5, type: 'crypt', windows: false });

    /* ---- cars along the roads ---- */
    const CC = [0xdc2626, 0x2563eb, 0xf8fafc, 0x16a34a, 0xf59e0b, 0x52525b, 0x7c3aed];
    for (const [x, z, ax] of [[2.5, -60, 0], [-2.5, -125, 0], [3, -170, 0], [-30, -97.5, 1], [40, -92.5, 1], [-88, -147.5, 1], [67.5, -120, 0], [-72.5, -185, 0], [0, 80, 0], [-2.8, 140, 0],
      [60, 2.5, 1], [120, -2.5, 1], [200, 2.8, 1], [-60, -2.5, 1], [-130, 2.5, 1], [-215, -2.5, 1], [-195, 60, 0], [111, -26.5, 1], [210, 34, 1], [-160, 158, 1], [-30, -205, 1], [85, -200, 1]]) car(x, z, ax, CC[Math.floor(r() * CC.length)]);

    /* ---- trees everywhere else (a forest in the west) ---- */
    const free = (x, z, m) => !inSafe(x, z) && Math.abs(x) < HALF - 6 && Math.abs(z) < HALF - 6 && !onRoad(x, z, m) && !inLake(x, z) && Math.hypot(x - LAKE[0], z - LAKE[1]) > LAKE[2] + 6 && !BUILT.some((b) => x > b[0] - m && x < b[2] + m && z > b[1] - m && z < b[3] + m) && !['town', 'gas', 'farm', 'military', 'grave', 'radio', 'hospital'].includes((areaAt(x, z) || {}).id);
    for (let i = 0; i < 520; i++) {
      const woods = i < 260, x = woods ? -250 + r() * 145 : -250 + r() * 500, z = woods ? -235 + r() * 320 : -250 + r() * 500;
      if (!free(x, z, 4)) continue;
      tree(x, z, 0.8 + r() * 0.55, woods || r() < 0.3);
    }
    // the lake: water you can wade through
    const wat = new THREE.Mesh(new THREE.CircleGeometry(LAKE[2], 48), new THREE.MeshLambertMaterial({ color: 0x2f7fd8, transparent: true, opacity: 0.82, ...DECAL }));
    wat.rotation.x = -Math.PI / 2; wat.position.set(LAKE[0], 0.12, LAKE[1]); place.add(wat);
    const beach = new THREE.Mesh(new THREE.RingGeometry(LAKE[2] - 2, LAKE[2] + 5, 48), new THREE.MeshLambertMaterial({ color: 0xd9c38f, ...DECAL }));
    beach.rotation.x = -Math.PI / 2; beach.position.set(LAKE[0], 0.06, LAKE[1]); place.add(beach);
    baked = BK.build(place);
  }
  const this_spots = {};

  /* ---------------- models ---------------- */
  const EYE = new THREE.MeshBasicMaterial({ color: 0xff3b2f }), EYE2 = new THREE.MeshBasicMaterial({ color: 0xfde047 }), GORE = new THREE.MeshLambertMaterial({ color: 0x7f1d1d });
  const BAR_BG = new THREE.MeshBasicMaterial({ color: 0x111827, transparent: true, opacity: 0.85 }), BAR_FG = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true });
  const PLANE = new THREE.PlaneGeometry(1, 1);
  function zModel(t) {
    const Z = ZT[t], g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
    const skin = lam(Z.skin), shirt = lam(Z.shirt), pants = lam(Z.pants), mats = [skin, shirt, pants];
    const box = (m, sx, sy, sz, x, y, z, par) => { const o = new THREE.Mesh(BOX, m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); (par || body).add(o); return o; };
    const fat = t === 3 ? 1.35 : 1, limb = (m, x, y) => { const p = new THREE.Group(); p.position.set(x, y, 0); body.add(p); box(m, 0.96, 2, 0.96, 0, -1, 0, p); return p; };
    const legL = limb(pants, -0.5, 2), legR = limb(pants, 0.5, 2);
    box(shirt, 2 * fat, 2, fat, 0, 3, 0);
    box(GORE, 0.8, 0.6, 0.06, 0.45, 3.4, -0.53 * fat); box(skin, 0.6, 0.5, 0.06, -0.5, 2.7, -0.53 * fat);
    const armL = limb(skin, -fat - 0.5, 4), armR = limb(skin, fat + 0.5, 4);
    box(shirt, 1, 0.74, 1, 0, -0.35, 0, armL); box(shirt, 1, 0.74, 1, 0, -0.35, 0, armR);
    const head = new THREE.Group(); head.position.set(0, 4.72, 0); body.add(head);
    box(skin, 1.3, 1.3, 1.3, 0, 0, 0, head);
    const eye = Z.boss ? EYE2 : EYE; box(eye, 0.28, 0.2, 0.06, -0.3, 0.12, -0.67, head); box(eye, 0.28, 0.2, 0.06, 0.3, 0.12, -0.67, head);
    box(GORE, 0.6, 0.14, 0.06, 0, -0.32, -0.67, head);
    if (t === 2) { box(pants, 2.4, 0.5, 1.3, 0, 4.15, 0); }
    if (t === 3) for (const [x, y] of [[-0.7, 3.5], [0.6, 2.6], [0.1, 3.8], [-0.4, 2.4]]) box(EYE2, 0.38, 0.38, 0.2, x, y, -0.62 * fat);
    if (t === 4) { for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.1, 6), GORE); c.position.set(-0.6 + i * 0.4, 3.9 - i * 0.2, 0.6); c.rotation.x = 0.9; body.add(c); } for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.8, 6), EYE2); h.position.set(s * 0.45, 0.85, 0); h.rotation.z = -s * 0.4; head.add(h); } }
    g.scale.setScalar(Z.s);
    const bar = new THREE.Group(); bar.position.y = 6.3; bar.scale.setScalar(1 / Z.s); g.add(bar);
    const bg = new THREE.Mesh(PLANE, BAR_BG); bg.scale.set(2.4, 0.34, 1); bg.renderOrder = 5; bar.add(bg);
    const fg = new THREE.Mesh(PLANE, BAR_FG); fg.scale.set(2.3, 0.24, 1); fg.position.z = 0.01; fg.renderOrder = 6; bar.add(fg);
    bar.visible = false;
    return { g, body, legL, legR, armL, armR, head, mats, bar, fg };
  }
  // weapons, pointing along -z with the grip at the origin
  const WMAT = new Map();
  const wmat = (c) => { if (!WMAT.has(c)) WMAT.set(c, new THREE.MeshLambertMaterial({ color: c })); return WMAT.get(c); };
  function weaponModel(id) {
    const g = new THREE.Group(), b = (c, sx, sy, sz, x, y, z) => { const o = new THREE.Mesh(BOX, wmat(c)); o.scale.set(sx, sy, sz); o.position.set(x, y, z); g.add(o); return o; };
    const BLK = 0x1f2937, GUN = 0x374151, WOOD = 0x8b5a2b;
    if (id === 'bat') { b(WOOD, 0.22, 0.22, 1.2, 0, 0, -0.5); b(0xb07a43, 0.36, 0.36, 2, 0, 0, -2); }
    else if (id === 'machete') { b(BLK, 0.2, 0.3, 0.9, 0, 0, -0.35); b(0xd1d5db, 0.08, 0.5, 2.4, 0, 0.05, -2); }
    else if (id === 'katana') { b(0x7f1d1d, 0.2, 0.22, 1.1, 0, 0, -0.4); b(0xfacc15, 0.5, 0.5, 0.1, 0, 0, -1); b(0xe5e7eb, 0.07, 0.26, 3.4, 0, 0, -2.75); }
    else if (id === 'pistol' || id === 'revolver') { b(BLK, 0.24, 0.6, 0.32, 0, -0.2, 0); b(id === 'revolver' ? 0x9ca3af : GUN, 0.26, 0.32, id === 'revolver' ? 1.3 : 1, 0, 0.18, -0.35); if (id === 'revolver') b(0x6b7280, 0.36, 0.36, 0.4, 0, 0.18, -0.15); }
    else if (id === 'shotgun') { b(WOOD, 0.26, 0.4, 1.2, 0, -0.1, 0.6); b(GUN, 0.28, 0.32, 1, 0, 0.1, -0.4); b(BLK, 0.16, 0.16, 2.2, 0, 0.2, -1.9); b(WOOD, 0.26, 0.2, 0.8, 0, -0.04, -1.6); }
    else if (id === 'smg') { b(BLK, 0.24, 0.5, 0.3, 0, -0.25, 0); b(GUN, 0.3, 0.36, 1.4, 0, 0.12, -0.45); b(BLK, 0.16, 0.6, 0.24, 0, -0.35, -0.7); b(BLK, 0.12, 0.12, 0.5, 0, 0.18, -1.4); }
    else if (id === 'ar') { b(WOOD, 0.24, 0.42, 1.1, 0, -0.08, 0.7); b(GUN, 0.3, 0.38, 1.6, 0, 0.12, -0.6); b(0xb45309, 0.2, 0.7, 0.3, 0, -0.38, -0.8); b(BLK, 0.13, 0.13, 1.2, 0, 0.2, -2); }
    else if (id === 'sniper') { b(0x3f6212, 0.24, 0.42, 1.2, 0, -0.08, 0.7); b(0x4d7c0f, 0.28, 0.34, 2, 0, 0.1, -0.7); b(BLK, 0.12, 0.12, 2, 0, 0.16, -2.6); b(BLK, 0.22, 0.22, 1, 0, 0.5, -0.6); }
    else if (id === 'minigun') { b(GUN, 0.6, 0.6, 1.4, 0, 0, -0.3); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; b(BLK, 0.12, 0.12, 2.4, Math.cos(a) * 0.2, Math.sin(a) * 0.2, -2); } b(0xf59e0b, 0.5, 0.5, 0.6, 0, -0.5, 0.2); }
    else b(0xf5cd9b, 0.01, 0.01, 0.01, 0, 0, 0);
    return g;
  }
  const portrait = (id) => snapshot('zs-w-' + id, () => weaponModel(id), { w: 180, h: 110, dir: [1, 0.35, -0.15], zoom: 0.8 });
  // a number or word that floats up and fades (damage)
  // what's been built: planks, posts and spikes (w × d studs on the ground; a turret's head turns)
  const BAR_WOOD = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true }), SPIKE = new THREE.ConeGeometry(0.3, 0.95, 6);
  function pieceModel(k, w, d) {
    const g = new THREE.Group(), key = BKEYS[k], B = BP[key], along = w >= d, L = Math.max(w, d), T = Math.min(w, d);
    const b = (c, sx, sy, sz, x, y, z, par) => { const o = new THREE.Mesh(BOX, wmat(c)); if (along || par) { o.scale.set(sx, sy, sz); o.position.set(x, y, z); } else { o.scale.set(sz, sy, sx); o.position.set(z, y, x); } (par || g).add(o); return o; };
    if (key === 'wall') {
      for (let n = 0; n < 4; n++) b(n % 2 ? 0x8a5a2e : 0x9c6b3a, L - 0.5, B.h / 4 - 0.1, T * 0.6, 0, (n + 0.5) * (B.h / 4), 0);
      for (const s of [-1, 1]) b(0x5c3b1e, 0.75, B.h + 0.3, T * 0.82, s * (L / 2 - 0.38), (B.h + 0.3) / 2, 0);
      for (const s of [-1, 1]) b(0x6b4423, L - 1.4, 0.45, 0.2, 0, B.h * 0.62, s * T * 0.32);
    }
    if (key === 'barricade') {
      for (const s of [-1, 1]) b(0x5c3b1e, 0.5, B.h, 0.5, s * (L / 2 - 0.4), B.h / 2, 0);
      b(0xa0703f, L - 0.2, 0.4, 0.4, 0, 0.55, 0); b(0xa0703f, L - 0.2, 0.4, 0.4, 0, 1.45, 0);
      const len = Math.hypot(L - 1.1, 1.3), a = Math.atan2(1.3, L - 1.1);
      for (const s of [-1, 1]) { const o = b(0x8a5a2e, len, 0.34, 0.26, 0, 1, s * 0.3); o.rotation[along ? 'z' : 'x'] = s * a; }
    }
    if (key === 'spikes') {
      b(0x5c3b1e, L - 0.2, 0.26, T - 0.2, 0, 0.13, 0);
      for (let a = 0; a < 3; a++) for (let c = 0; c < 3; c++) { const o = new THREE.Mesh(SPIKE, wmat(0xa1a1aa)); o.position.set((a - 1) * L / 3.2, 0.73, (c - 1) * T / 3.2); g.add(o); }
    }
    let head = null;
    if (key === 'turret') {
      b(0x8a5a2e, 1.9, 1.3, 1.9, 0, 0.65, 0); b(0x5c3b1e, 2, 0.24, 2, 0, 1.3, 0); b(0x4b5563, 0.5, 0.9, 0.5, 0, 1.85, 0);
      head = new THREE.Group(); head.position.y = 2.65; g.add(head);
      b(0x374151, 1.1, 0.8, 1.3, 0, 0, 0, head); b(0x111827, 0.26, 0.26, 1.6, 0, 0.05, -1.3, head); b(0x65a30d, 0.4, 0.5, 0.6, 0.76, -0.05, 0.1, head);
    }
    const bar = new THREE.Group(); bar.position.y = B.h + 1.1; g.add(bar);
    const bg = new THREE.Mesh(PLANE, BAR_BG); bg.scale.set(2.6, 0.34, 1); bg.renderOrder = 5; bar.add(bg);
    const fg = new THREE.Mesh(PLANE, BAR_WOOD); fg.scale.set(2.5, 0.24, 1); fg.position.z = 0.01; fg.renderOrder = 6; bar.add(fg);
    bar.visible = false;
    return { g, head, bar, fg };
  }
  const NUMTEX = new Map();
  function numTex(text, color) {
    const k = text + color; if (NUMTEX.has(k)) return NUMTEX.get(k);
    const c = document.createElement('canvas'), g = c.getContext('2d'); c.width = 128; c.height = 48;
    g.font = '800 34px "Segoe UI",system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 7; g.strokeStyle = 'rgba(0,0,0,.7)'; g.strokeText(text, 64, 26); g.fillStyle = color; g.fillText(text, 64, 26);
    const t = new THREE.CanvasTexture(c); NUMTEX.set(k, t); if (NUMTEX.size > 300) { const [k0, t0] = NUMTEX.entries().next().value; t0.dispose(); NUMTEX.delete(k0); }
    return t;
  }

  /* ---------------- the experience ---------------- */
  const ZS = {
    noSprint: true, // (its own, with stamina, hunger and the 🏃 button; the sprint key comes from the engine)
    ownFov: true, aimDist: 10, // (aiming zooms in)
    id: 'zombie', code: 'zs', genre: 'Survival', rank: 0.4, name: 'Zombie Outbreak', emoji: '🧟', max: 12, stat: 'Kills', killY: -20, banner: true, noReset: true, respawnDelay: 4200, camDist: 18,
    land: { theme: 'forest' },
    color: 'linear-gradient(135deg,#365314,#7f1d1d)',
    desc: 'An open world overrun by zombies. Leave the Safe Zone to search houses, shops, cars and the military base for weapons, ammo, food and medkits. Level up, take on missions, buy gear from the trader and survive the nights — every fourth is a Blood Moon with a giant boss. Aim down the sights, and build walls, barricades, spike traps and turrets from wood to hold them off. Your gear, level and base are saved.',
    welcome: 'Grab a weapon and stay alive!',
    build() {
      sky('#5aaef5', '#d6ecfb');
      world();
      this.npcs = [];
      const npc = (x, z, yaw, name, av) => { const a = makeAvatar(av, name); a.g.position.set(x, 0.12, z); a.g.rotation.y = yaw; place.add(a.g); scene.remove(a.shadow); this.npcs.push(a); };
      npc(-12, -13, Math.PI, '🛒 Trader', [3, 6, 4, 5, 2]); npc(12, -14.6, Math.PI, '⛑️ Medic', [4, 7, 5, 11, 0]);
      this.fire = []; for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: [0xff6a00, 0xffc400, 0xff2a00][i % 3] })); m.position.set(this_spots.fire[0], 0.6, this_spots.fire[1]); place.add(m); this.fire.push(m); }
      this.mapImg = null; this.skyK = -1;
    },
    pres() { return { kc: 0, lv: 1, w: '', zh: [], sh: null, gr: null }; },
    async enter() {
      const s = await kvGet('zs');
      const D = { cash: 100, xp: 0, lvl: 1, kills: 0, nights: 0, best: 0, w: ['fists', 'pistol'], slot: { m: 'fists', s: 'pistol', p: '' }, cur: 's', ammo: { light: 36, shells: 0, rifle: 0 }, mag: { pistol: 12 }, it: { bandage: 2, medkit: 0, beans: 2, chips: 0, soda: 1, energy: 0, grenade: 1 }, hp: 100, food: 90, q: [], looted: {}, st: {} };
      const S = this.S = Object.assign(D, s && typeof s === 'object' ? s : {});
      S.w = (Array.isArray(S.w) ? S.w : []).filter((w) => WP[w]); if (!S.w.includes('fists')) S.w.unshift('fists');
      S.slot = Object.assign({ m: 'fists', s: '', p: '' }, S.slot || {}); for (const k of ['m', 's', 'p']) if (S.slot[k] && (!S.w.includes(S.slot[k]) || WP[S.slot[k]].slot !== k)) S.slot[k] = k === 'm' ? 'fists' : '';
      if (!S.slot[S.cur]) S.cur = 'm';
      questMax('zombie.kill', S.kills | 0); questMax('zombie.night', S.nights | 0);
      S.ammo = Object.assign({ light: 0, shells: 0, rifle: 0 }, S.ammo || {}); S.it = Object.assign({ bandage: 0, medkit: 0, beans: 0, chips: 0, soda: 0, energy: 0, grenade: 0 }, S.it || {}); S.mag = Object.assign({}, S.mag || {});
      for (const k of ['cash', 'xp', 'kills', 'nights', 'best']) S[k] = Math.max(0, Math.floor(+S[k] || 0));
      S.lvl = clamp(S.lvl | 0, 1, 99); S.hp = clamp(+S.hp || 100, 40, 100); S.food = clamp(+S.food || 80, 30, 100);
      if (!S.looted || typeof S.looted !== 'object') S.looted = {};
      const nowS = Date.now() / 1000; for (const k in S.looted) if (!(S.looted[k] > nowS)) delete S.looted[k];
      S.q = (Array.isArray(S.q) ? S.q : []).filter((q) => Array.isArray(q) && MISSIONS[q[0]] && q[2] > 0).slice(0, 3); S.st = S.st && typeof S.st === 'object' ? S.st : {};
      while (S.q.length < 3) S.q.push(this.newMission());
      S.wood = Math.max(0, S.wood == null ? 12 : S.wood | 0);
      S.base = (Array.isArray(S.base) ? S.base : []).filter((b) => Array.isArray(b) && BKEYS[b[0]] && b[1] > 0 && b[2] > 0).slice(0, MAX_OWN);
      this.hp = S.hp; this.food = S.food; this.stam = 100; this.boost = 0; this.dead = false;
      this.zv = new Map(); this.killSet = new Set(); this.killSeen = null; this.evSeen = null; this.hq = []; this.zh = []; this.hn = 0; this.zcd = {}; this.bossHit = new Set(); this.lastHit = new Map();
      this.H = null; this.lastG = null; this.list = []; this.nextShot = 0; this.reloading = null; this.firing = false; this.swingT = 0; this.faceT = 0; this.aimYaw = 0;
      this.fx = []; this.nades = []; this.searching = null; this.mouse = null; this.shotN = 0; this.grN = 0; this.peerSeen = new Map(); this.held = new Map(); this.myHeld = null;
      this.sprint = false; this.runToggle = false; this.area = null; this.nightWas = null; this.nightDied = false; this.nightOut = 0; this.saveT = 0; this.alive0 = performance.now();
      this.groanT = 2; this.dirty = false;
      this.bm = new Map(); this.rmAsk = new Map(); this.pend = new Map(); this.bq = []; this.bqn = 0; this.bpSeen = null; this.lastBP = null; this.tsSeen = null; this.chop = new Map();
      this.building = false; this.tool = 0; this.brot = 0; this.ghost = null; this.spot = null; this.bT = 0;
      this.restoreAt = performance.now() / 1000 + 4; this.restoring = false; this.baseLive = false; // (your base from last time goes back up once the server's settled)
      $('#xhud').insertAdjacentHTML('beforeend', `<div id="zsV" class="glass"></div><div id="zsMap"><canvas width="156" height="156"></canvas></div><div id="zsHurt"></div><div id="zsSearch" class="glass"></div><div id="zsCross"></div>
        <div id="zsScope"></div><div id="zsTouch"><button id="zsFire">🔫</button><button id="zsRel">🔄</button><button id="zsRun">🏃</button><button id="zsAim">🎯</button></div>`);
      this.aim = false; this.fov0 = camera.fov; $('#xbar').classList.add('zs'); document.body.classList.add('zs-on');
      $('#zsAim').addEventListener('click', () => { this.aim = !this.aim; sfx(this.aim ? 'select' : 'click'); });
      const fireBtn = $('#zsFire');
      fireBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.building) { this.buildAct(); return; } this.firing = 'auto'; this.trigger(); }, { passive: false });
      fireBtn.addEventListener('touchend', () => { this.firing = false; });
      $('#zsRel').addEventListener('click', () => { if (this.building) this.turn(); else this.reload(); });
      $('#zsRun').addEventListener('click', () => { this.runToggle = !this.runToggle; $('#zsRun').classList.toggle('on', this.runToggle); });
      this.drawBar(); this.send(); this.vitals();
      if (!touchy && !S.seenAim) { S.seenAim = 1; this.dirty = true; say('🎯 Aim down the sights with the right mouse button or R (tap R to aim and again to stop, or hold it). T reloads, Q builds.', '#e2e8f0'); }
    },
    leave() {
      this.save();
      for (const v of this.zv.values()) scene.remove(v.m.g);
      for (const f of this.fx) { scene.remove(f.m); if (f.own) f.m.material.dispose(); }
      for (const n of this.nades) scene.remove(n.m);
      for (const [, h] of this.held) if (h.m && h.m.parent) h.m.parent.remove(h.m);
      if (this.myHeld && this.myHeld.m.parent) this.myHeld.m.parent.remove(this.myHeld.m);
      for (const m of baked) { m.geometry.dispose(); m.material.dispose(); } baked = [];
      for (const a of this.npcs || []) dropAvatar(a);
      gfxApply(); // the usual light again (it depends on the graphics setting)
      this.aim = false; camera.fov = this.fov0 || 70; camera.updateProjectionMatrix(); if (this.laser) { scene.remove(this.laser); this.laser = null; } if (me) me.g.visible = true;
      for (const v of this.bm.values()) scene.remove(v.m.g);
      this.setGhost(null); this.building = false; this.bm = new Map(); $('#xbar').classList.remove('zs'); document.body.classList.remove('zs-on');
      this.zv = new Map(); this.fx = []; this.nades = []; this.H = null;
    },
    save() { if (!this.S) return; this.S.hp = Math.round(this.hp); this.S.food = Math.round(this.food); this.dirty = false; return kvSet('zs', this.S); },
    send() { send({ kc: this.S.kills, lv: this.S.lvl, w: this.cur() }); },
    spawn() {
      if (this.dead) { this.dead = false; this.hp = 100; this.food = Math.max(this.food, 60); this.stam = 100; this.alive0 = performance.now(); this.drawBar(); }
      return [(Math.random() - 0.5) * 8, 0.2, -6 + Math.random() * 4, 0]; // the camera behind you stays inside the walls
    },
    cur() { return this.S ? this.S.slot[this.S.cur] || 'fists' : 'fists'; },
    // aiming down the sights: right mouse button held, or R (a trackpad has no easy right button), or 🎯 on a phone, with a gun out
    aiming() { return !!(this.aim && this.S && !P.dead && !this.dead && WP[this.cur()] && WP[this.cur()].gun && !this.building && !this.searching && !panelOpen()); },
    loots() { return LOOTS; }, trees() { return TREES; }, grid() { return { blocked, pieceAt, floorY, cell, bbox, GN, fits }; }, // for tests
    speed() {
      if (!this.S) return 16;
      const W = WP[this.cur()], slow = (W && W.slow) || 1, wet = inLake(P.x, P.z) ? 0.55 : 1, run = this.sprint ? 1.55 : 1;
      return 16 * slow * wet * (this.aiming() ? 0.55 : run) * (this.boost > 0 ? 1.2 : 1);
    },
    statOf(pr, isMe) { return isMe ? (this.S ? this.S.kills : 0) : pr.kc || 0; },
    sortKey(pr, isMe) { return isMe ? (this.S ? this.S.kills : 0) : pr.kc || 0; },
    menu() { return [['🎒 Backpack', () => this.backpack()], ['🗺️ Map', () => this.mapPanel()]]; },

    /* ---------------- the host: the zombies ---------------- */
    adopt() {
      const g = this.lastG, H = { zs: [], nid: 1, kl: [], ev: [], evn: 0, gs: 0, seen: {}, bossDay: -1, flows: new Map(), spT: {}, noise: {}, bp: new Map(), bid: 1, bv: 0, bseen: {}, bdirty: false, ts: [], tsn: 0 };
      if (g) {
        for (const z of this.parse(g)) { const T = ZT[z.t]; if (T) H.zs.push({ id: z.id, t: z.t, x: z.x, z: z.z, yaw: z.yaw, max: T.hp, hp: Math.max(1, z.hp * T.hp), st: 0, tgt: null, w: null, losT: 0, seeT: 0, stuck: 0 }); }
        H.nid = 1 + Math.max(0, ...H.zs.map((z) => z.id)); H.kl = Array.isArray(g.k) ? g.k.slice() : []; H.ev = Array.isArray(g.ev) ? g.ev.slice() : [];
        H.evn = Math.max(0, ...H.ev.map((e) => +e[0] || 0)); H.gs = g.gs || 0; H.bossDay = g.bd != null ? g.bd : -1;
        H.ts = Array.isArray(g.ts) ? g.ts.slice() : []; H.tsn = Math.max(0, ...H.ts.map((e) => +e[0] || 0));
      }
      // what's been built carries on as it was
      if (this.lastBP) {
        for (const q of this.parseB(this.lastBP)) H.bp.set(q.id, { id: q.id, k: q.k, i: q.i, j: q.j, r: q.r, hp: Math.max(1, q.hp * BP[BKEYS[q.k]].hp), o: q.o, fireT: 0 });
        H.bv = (+this.lastBP.v || 0) + 1; H.bid = (Math.max(0, ...H.bp.keys()) % 4095) + 1; H.bdirty = true;
      }
      for (const p of players()) if (!p.me) H.bseen[p.peer] = { t: p.pr.t, n: Math.max(0, ...(Array.isArray(p.pr.bq) ? p.pr.bq.map((q) => (Array.isArray(q) ? +q[0] || 0 : 0)) : [0])) };
      for (const p of players()) if (!p.me) H.seen[p.peer] = { t: p.pr.t, n: Math.max(0, ...(Array.isArray(p.pr.zh) ? p.pr.zh.map((h) => (Array.isArray(h) ? +h[0] || 0 : 0)) : [0])) };
      return H;
    },
    parse(g) {
      const s = typeof g.z === 'string' ? g.z : '', out = [];
      for (let i = 0; i + 10 <= s.length; i += 10) out.push({ t: d1(s, i), id: d2(s, i + 1), x: d2(s, i + 3) / 7.5 - HALF, z: d2(s, i + 5) / 7.5 - HALF, yaw: (d1(s, i + 7) / 64) * TAU, hp: d1(s, i + 8) / 63, st: d1(s, i + 9) });
      return out;
    },
    damage(id, dmg, peer) {
      const H = this.H, z = H && H.zs.find((q) => q.id === id); if (!z || !(dmg > 0)) return;
      z.hp -= Math.min(dmg, 2000);
      if (!z.tgt && peer) z.tgt = peer; // shot: it comes for you
      if (z.hp <= 0) this.kill(z, peer);
    },
    kill(z, peer) {
      const H = this.H, i = H.zs.indexOf(z); if (i < 0) return;
      H.zs.splice(i, 1);
      H.kl.push([z.id, peer || '', z.t]); if (H.kl.length > 20) H.kl.shift();
      if (ZT[z.t].boom) this.explode(z.x, z.z, peer, z.id);
    },
    explode(x, z, peer, from) {
      const H = this.H;
      H.ev.push([++H.evn, 1, Math.round(x * 4) / 4, Math.round(z * 4) / 4]); if (H.ev.length > 10) H.ev.shift();
      for (const q of H.zs.slice()) if (q.id !== from && Math.hypot(q.x - x, q.z - z) < 7) this.damage(q.id, 110, peer);
      for (const pc of [...H.bp.values()]) { const d = boxDist(x, z, bbox(pc.k, pc.i, pc.j, pc.r)); if (d < 6) this.hurtB(H, pc, 320 * (1 - d / 8)); }
    },
    host(dt) {
      if (!this.S) return;
      if (!this.H) this.H = this.adopt();
      const H = this.H, ck = clock(), pl = players(), tnow = performance.now() / 1000;
      // hits from everyone else (mine go straight in)
      for (const p of pl) {
        if (p.me) continue;
        const seen = H.seen[p.peer] || (H.seen[p.peer] = { t: p.pr.t, n: 0 });
        if (p.pr.t !== seen.t) { seen.t = p.pr.t; seen.n = 0; }
        for (const h of Array.isArray(p.pr.zh) ? p.pr.zh : []) { if (!Array.isArray(h) || !(h[0] > seen.n)) continue; seen.n = h[0]; this.damage(h[1] | 0, +h[2] || 0, p.peer); }
        const sh = Array.isArray(p.pr.sh) ? p.pr.sh[0] : 0; if (sh && sh !== (H.noise[p.peer] || {}).n) H.noise[p.peer] = { n: sh, until: tnow + 2.5 };
        // what they want built (or taken down, or mended)
        const bs = H.bseen[p.peer] || (H.bseen[p.peer] = { t: p.pr.t, n: 0 });
        if (p.pr.t !== bs.t) { bs.t = p.pr.t; bs.n = 0; }
        for (const q of Array.isArray(p.pr.bq) ? p.pr.bq : []) { if (!Array.isArray(q) || !(q[0] > bs.n)) continue; bs.n = q[0]; const why = this.bReq(H, p.peer, q); if (why) this.bNope(H, p.peer, q[0], why); }
      }
      if (this.shotN && this.shotN !== (H.noise[myPeer()] || {}).n) H.noise[myPeer()] = { n: this.shotN, until: tnow + 2.5 };
      // who they can chase: alive, outside the Safe Zone
      const tg = pl.filter((p) => !(p.me ? P.dead || this.dead : p.pr.a === 3) && !inSafe(p.x, p.z) && Math.abs(p.x) < HALF && Math.abs(p.z) < HALF);
      const sight = ck.night ? (ck.blood ? 95 : 72) : 42, fast = ck.night ? (ck.blood ? 1.38 : 1.25) : 1;
      // more of them around everyone outside, more at night
      const want = ck.night ? (ck.blood ? 15 : 11) : 7, cap = ck.night ? 50 : 38;
      for (const p of tg) {
        const near = H.zs.filter((z) => Math.hypot(z.x - p.x, z.z - p.z) < 130).length;
        if (near < want && H.zs.length < cap && tnow > (H.spT[p.peer] || 0)) { H.spT[p.peer] = tnow + (ck.night ? 0.45 : 0.9); this.spawnNear(H, p, ck, pl); }
      }
      if (ck.night && ck.blood && tg.length && H.bossDay !== ck.day && !H.zs.some((z) => ZT[z.t].boss)) { H.bossDay = ck.day; this.spawnNear(H, tg[Math.floor(Math.random() * tg.length)], ck, pl, 4); }
      // the ones nobody's near wander off
      for (let i = H.zs.length - 1; i >= 0; i--) { const z = H.zs[i], d = Math.min(...pl.map((p) => Math.hypot(p.x - z.x, p.z - z.z)), 1e9); if (d > (ZT[z.t].boss ? 260 : 185) || (!ck.night && H.zs.length > cap && d > 90 && !z.tgt)) H.zs.splice(i, 1); }
      // move
      const booms = [];
      for (const z of H.zs) {
        const Z = ZT[z.t];
        let best = null, bd = 1e9;
        for (const p of tg) {
          const d = Math.hypot(p.x - z.x, p.z - z.z), loud = H.noise[p.peer] && H.noise[p.peer].until > tnow;
          const sense = (z.tgt === p.peer ? sight * 1.7 : sight) + (loud ? 45 : 0);
          if (d < sense && d < bd && Math.abs(p.y - floorAt(z.x, z.z)) < 30) { bd = d; best = p; }
        }
        z.tgt = best ? best.peer : null;
        let vx = 0, vz = 0, sp = Z.sp * fast * (inLake(z.x, z.z) ? 0.55 : 1) * (this.onTrap(H, z) ? 0.45 : 1);
        let siege = null; // something that's been built, in its way: it tears into it
        if (best && z.sg && tnow < z.sgT && H.bp.has(z.sg)) siege = H.bp.get(z.sg); // (still at it)
        if (best && !siege) {
          if (Z.boom && bd < 3.1) { booms.push(z); continue; }
          // close enough to bite, unless there's a wall (or a barricade) in between, or you're up on one
          if (bd < Z.reach * 0.85 + 0.3) { const w = H.bp.size ? this.blocker(z, best) : -1; if (w < 0) { z.st = 2; z.yaw = Math.atan2(-(best.x - z.x), -(best.z - z.z)); continue; } siege = H.bp.get(w); }
        }
        if (best && !siege) {
          z.st = 1;
          if (tnow > z.losT) { z.losT = tnow + 0.35; z.see = clearLine(z.x, z.z, best.x, best.z); }
          let dx = best.x - z.x, dz = best.z - z.z;
          if (!z.see) {
            // the way round; and if there isn't one (you've walled yourself in), the way through what's been built
            let f = this.flow(H, best.peer, best.x, best.z), c = cell(z.x, z.z), thru = false;
            if (f && c >= 0 && f.d[c] < 0 && H.bp.size) { f = this.flow(H, best.peer, best.x, best.z, true); thru = true; }
            if (f && c >= 0) { const i = c % GN, j = (c / GN) | 0, here = f.d[c]; let bv = here >= 0 ? here : 1e9, bx = 0, bz = 0, bk = -1; for (const [di, dj] of DIRS) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= GN || jj >= GN) continue; const kk = jj * GN + ii, v = f.d[kk]; if (v < 0 || (blocked[kk] && !(thru && blocked[kk] === 2)) || v >= bv) continue; if (di && dj && (blocked[j * GN + ii] || blocked[jj * GN + i])) continue; bv = v; bx = di; bz = dj; bk = kk; } if (bx || bz) { dx = cc(i + bx) - z.x; dz = cc(j + bz) - z.z; if (thru && blocked[bk] === 2 && pieceAt[bk]) { const pc = H.bp.get(pieceAt[bk] - 1); if (pc && boxDist(z.x, z.z, bbox(pc.k, pc.i, pc.j, pc.r)) < Z.reach + 0.4) siege = pc; } } }
          }
          const l = Math.hypot(dx, dz) || 1; vx = (dx / l) * sp; vz = (dz / l) * sp;
          // pushing against something that's been built and getting nowhere: break it
          if (!siege && z.stuck > 0.4 && H.bp.size) siege = this.pieceNear(H, z, Z.reach + 0.4);
        }
        if (siege) { this.siegeHit(H, z, siege, tnow, booms); continue; }
        if (!best) {
          z.st = 0;
          if (!z.w || Math.hypot(z.w[0] - z.x, z.w[1] - z.z) < 2 || tnow > z.wT) { const a = Math.random() * TAU, d = 6 + Math.random() * 18; z.w = [z.x + Math.cos(a) * d, z.z + Math.sin(a) * d]; z.wT = tnow + 8; }
          const dx = z.w[0] - z.x, dz = z.w[1] - z.z, l = Math.hypot(dx, dz) || 1; vx = (dx / l) * sp * 0.32; vz = (dz / l) * sp * 0.32;
        }
        // keep a little apart from each other
        for (const q of H.zs) { if (q === z) continue; const dx = z.x - q.x, dz = z.z - q.z, d = Math.hypot(dx, dz), m = 0.9 * (ZT[z.t].s + ZT[q.t].s); if (d > 0.01 && d < m) { vx += (dx / d) * (m - d) * 6; vz += (dz / d) * (m - d) * 6; } }
        const ox = z.x, oz = z.z, nx = z.x + vx * dt, nz = z.z + vz * dt;
        if (walkable(nx, z.z)) z.x = nx; if (walkable(z.x, nz)) z.z = nz;
        if (vx || vz) { const ty = Math.atan2(-vx, -vz); let d = ty - z.yaw; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; z.yaw += d * Math.min(1, dt * 8); }
        // stuck against something: try a sidestep
        if (best && Math.hypot(z.x - ox, z.z - oz) < sp * dt * 0.15) { z.stuck += dt; if (z.stuck > 1.2) { z.stuck = 0; const a = Math.random() * TAU; const sx = z.x + Math.cos(a) * 2, sz = z.z + Math.sin(a) * 2; if (walkable(sx, sz)) { z.x = sx; z.z = sz; } } } else z.stuck = 0;
      }
      for (const z of booms) if (H.zs.includes(z)) this.kill(z, '');
      if (H.bp.size) this.defend(H, dt, tnow);
      if (tnow - (this.sentAt || 0) > 0.2) { this.sentAt = tnow; this.publish(H); }
      if (H.bdirty && tnow - (H.bpAt || 0) > 0.3) { H.bdirty = false; H.bpAt = tnow; this.publishB(H); }
    },
    /* ---------------- the host: what's been built ---------------- */
    onTrap(H, z) { const c = cell(z.x, z.z), pc = c >= 0 && pieceAt[c] ? H.bp.get(pieceAt[c] - 1) : null; return pc && BP[BKEYS[pc.k]].trap ? pc : null; },
    // a piece between a zombie and whoever it's after (or the one they're standing on, out of its reach): its id, or -1
    blocker(z, p) {
      const w = pieceBetween(z.x, z.z, p.x, p.z); if (w >= 0) return w;
      const c = cell(p.x, p.z);
      return c >= 0 && blocked[c] === 2 && pieceAt[c] && p.y - floorAt(z.x, z.z) > 3.2 + ZT[z.t].s ? pieceAt[c] - 1 : -1;
    },
    pieceNear(H, z, reach) {
      let best = null, bd = reach;
      const i0 = ci(z.x), j0 = ci(z.z), m = Math.ceil(reach / CELL);
      for (let j = j0 - m; j <= j0 + m; j++) for (let i = i0 - m; i <= i0 + m; i++) {
        if (i < 0 || j < 0 || i >= GN || j >= GN) continue;
        const c = j * GN + i; if (blocked[c] !== 2 || !pieceAt[c]) continue;
        const pc = H.bp.get(pieceAt[c] - 1); if (!pc) continue;
        const d = boxDist(z.x, z.z, bbox(pc.k, pc.i, pc.j, pc.r)); if (d < bd) { bd = d; best = pc; }
      }
      return best;
    },
    // a zombie at something that's been built tears into it (an exploder just goes off)
    siegeHit(H, z, pc, tnow, booms) {
      const Z = ZT[z.t], b = bbox(pc.k, pc.i, pc.j, pc.r);
      z.st = 2; z.yaw = Math.atan2(-((b[0] + b[2]) / 2 - z.x), -((b[1] + b[3]) / 2 - z.z));
      if (z.sg !== pc.id) { z.sg = pc.id; z.sgT = tnow + 1.5; }
      if (Z.boom) { booms.push(z); return; }
      if (tnow < (z.hitT || 0)) return;
      z.hitT = tnow + Z.cd; z.sgT = tnow + Z.cd + 0.3;
      this.hurtB(H, pc, Z.dmg * (Z.boss ? 4 : 1.5));
    },
    hurtB(H, pc, n) { if (!H.bp.has(pc.id)) return; pc.hp -= n; if (pc.hp <= 0) this.unbuild(H, pc, true); else this.bChanged(H); },
    bChanged(H, layout) { H.bv++; H.bdirty = true; if (layout) H.flows.clear(); },
    unbuild(H, pc, broke) {
      H.bp.delete(pc.id); markCells(pc, false); this.bChanged(H, true);
      if (broke) { const b = bbox(pc.k, pc.i, pc.j, pc.r); H.ev.push([++H.evn, 3, Math.round((b[0] + b[2]) * 2) / 4, Math.round((b[1] + b[3]) * 2) / 4, pc.k]); if (H.ev.length > 10) H.ev.shift(); }
    },
    bNope(H, peer, seq, why) { H.ev.push([++H.evn, 4, peer, seq, why]); if (H.ev.length > 10) H.ev.shift(); },
    present(peer) { return players().some((p) => p.peer === peer); },
    // a request: [seq, 'p', piece, i, j, turned, free (your saved base going back up)] | [seq, 'x', id] | [seq, 'f', id, hp]
    bReq(H, peer, q) {
      const op = q[1];
      if (op === 'p') {
        const k = q[2] | 0, i = q[3] | 0, j = q[4] | 0, r = q[5] ? 1 : 0, free = !!q[6], B = BP[BKEYS[k]];
        if (!B) return 2;
        if (free) { // the same piece left standing where it was: it's yours again
          for (const pc of H.bp.values()) if (pc.k === k && pc.i === i && pc.j === j && pc.r === r) { if (pc.o === peer) return 0; if (!this.present(pc.o)) { pc.o = peer; this.bChanged(H); return 0; } }
        }
        let mine = 0, guns = 0; for (const pc of H.bp.values()) if (pc.o === peer) { mine++; if (BP[BKEYS[pc.k]].gun) guns++; }
        if (mine >= MAX_OWN) return 7;
        if (B.gun && guns >= MAX_TURRETS) return 8;
        if (H.bp.size >= MAX_ALL) return 9;
        const why = fits(k, i, j, r, free ? null : players().find((p) => p.peer === peer), H.zs); if (why) return why;
        let id = H.bid; while (H.bp.has(id)) id = (id % 4095) + 1;
        H.bid = (id % 4095) + 1;
        const pc = { id, k, i, j, r, hp: B.hp, o: peer, fireT: 0 };
        H.bp.set(id, pc); markCells(pc, true); this.bChanged(H, true);
        return 0;
      }
      const pc = H.bp.get(q[2] | 0); if (!pc) return 12;
      if (op === 'x') { if (pc.o !== peer && this.present(pc.o)) return 13; this.unbuild(H, pc, false); return 0; }
      if (op === 'f') { pc.hp = Math.min(BP[BKEYS[pc.k]].hp, pc.hp + clamp(+q[3] || 0, 0, 300)); this.bChanged(H); return 0; }
      return 2;
    },
    // spikes hurt the zombies on them (the kill is the builder's) and wear down; turrets shoot the nearest one they can see
    defend(H, dt, tnow) {
      for (const z of H.zs.slice()) {
        const pc = this.onTrap(H, z); if (!pc) continue;
        z.hp -= 55 * dt * (ZT[z.t].boss ? 0.5 : 1); if (z.hp <= 0) this.kill(z, pc.o);
        this.hurtB(H, pc, 6 * dt);
      }
      for (const pc of H.bp.values()) {
        if (!BP[BKEYS[pc.k]].gun || tnow < pc.fireT) continue;
        const b = bbox(pc.k, pc.i, pc.j, pc.r), x = (b[0] + b[2]) / 2, z0 = (b[1] + b[3]) / 2;
        let tg = null, td = 36;
        for (const z of H.zs) { const d = Math.hypot(z.x - x, z.z - z0); if (d < td && this.turretSees(H, pc, x, z0, z.x, z.z)) { td = d; tg = z; } }
        if (!tg) { pc.fireT = tnow + 0.25; continue; }
        pc.fireT = tnow + 0.4;
        H.ts.push([++H.tsn, pc.id, Math.round(tg.x * 4) / 4, Math.round(tg.z * 4) / 4]); if (H.ts.length > 16) H.ts.shift();
        tg.hp -= ZT[tg.t].boss ? 30 : 22; if (tg.hp <= 0) this.kill(tg, pc.o);
      }
    },
    // a turret fires over barricades, spikes and other turrets, not through walls or anything else
    turretSees(H, me, x0, z0, x1, z1) {
      const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.2);
      for (let s = 1; s < n; s++) {
        const c = cell(x0 + (x1 - x0) * s / n, z0 + (z1 - z0) * s / n); if (c < 0 || blocked[c] === 1) return false;
        if (blocked[c] === 2 && pieceAt[c] !== me.id + 1) { const pc = H.bp.get(pieceAt[c] - 1); if (pc && BKEYS[pc.k] === 'wall') return false; }
      }
      return true;
    },
    publishB(H) {
      const o = [''], here = new Set(players().map((p) => p.peer)); let s = ''; // (owners who've gone are all just '')
      for (const pc of H.bp.values()) {
        let oi = here.has(pc.o) ? o.indexOf(pc.o) : 0; if (oi < 0) { oi = o.length < 63 ? o.length : 0; if (oi) o.push(pc.o); }
        s += AL[pc.k + pc.r * 4] + e2(pc.id) + e2(pc.i) + e2(pc.j) + e1((Math.max(0, pc.hp) / BP[BKEYS[pc.k]].hp) * 63) + AL[oi];
      }
      const bp = { v: H.bv, s, o };
      this.sentAt = performance.now() / 1000; this.publish(H, bp); this.lastBP = bp; this.applyB(bp);
    },
    spawnNear(H, p, ck, pl, type) {
      for (let tries = 0; tries < 12; tries++) {
        const a = Math.random() * TAU, d = (type === 4 ? 70 : 55) + Math.random() * 45, x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
        if (!walkable(x, z) || inLake(x, z) || Math.abs(x) > HALF - 10 || Math.abs(z) > HALF - 10) continue;
        if (pl.some((q) => Math.hypot(q.x - x, q.z - z) < 42)) continue;
        let t = type;
        if (t == null) { const w = ck.night ? (ck.blood ? [0.35, 0.33, 0.18, 0.14] : [0.45, 0.3, 0.12, 0.13]) : [0.7, 0.15, 0.07, 0.08], grave = (areaAt(x, z) || {}).id === 'grave' ? 1 : 0; let rr = Math.random(); t = 0; while (t < 3 && rr >= w[t]) { rr -= w[t]; t++; } if (grave && ck.night && Math.random() < 0.3) t = 2; }
        const Z = ZT[t]; H.zs.push({ id: H.nid++ % 4096, t, x, z, yaw: Math.random() * TAU, max: Z.hp, hp: Z.hp, st: 0, tgt: null, w: null, losT: 0, stuck: 0 });
        return;
      }
    },
    flow(H, peer, px, pz, thru) { // thru: as if what's been built weren't there (to find the way through it)
      const key = thru ? peer + '#' : peer;
      let f = H.flows.get(key); const c = cell(px, pz), t = performance.now();
      if (f && ((f.c === c && t - f.at < 3000) || t - f.at < 450)) return f;
      if (c < 0) return null;
      if (!f) { f = { d: new Int16Array(GN * GN) }; H.flows.set(key, f); }
      f.c = c; f.at = t; f.d.fill(-1);
      let h = 0, n = 0; BFSQ[n++] = c; f.d[c] = 0;
      while (h < n) {
        const k = BFSQ[h++], dk = f.d[k]; if (dk > 85) break;
        const i = k % GN, j = (k / GN) | 0;
        for (const [di, dj] of DIRS) {
          const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= GN || jj >= GN) continue;
          const kk = jj * GN + ii; if (f.d[kk] >= 0 || (blocked[kk] && !(thru && blocked[kk] === 2))) continue;
          if (di && dj && (blocked[j * GN + ii] || blocked[jj * GN + i])) continue;
          f.d[kk] = dk + 1; BFSQ[n++] = kk;
        }
      }
      return f;
    },
    publish(H, bp) { // (bp: what's been built, when that's changed too)
      let zs = '';
      for (const z of H.zs.slice(0, 60)) zs += AL[z.t] + e2(z.id) + e2((z.x + HALF) * 7.5) + e2((z.z + HALF) * 7.5) + e1(((((z.yaw % TAU) + TAU) % TAU) / TAU) * 64 % 64) + e1((Math.max(0, z.hp) / z.max) * 63) + AL[z.st];
      H.gs = (H.gs || 0) + 1;
      const g = { gs: H.gs, z: zs, k: H.kl.slice(-16), ev: H.ev.slice(-8), bd: H.bossDay, ts: H.ts.slice(-8) }, patch = bp ? { g, bp } : { g };
      // the room keeps each presence under 4 KiB: with a lot going on, the least important goes first
      const size = () => new TextEncoder().encode(JSON.stringify(Object.assign({}, (Net.peers.find((p) => p.isMe) || {}).presence, Net.queued, patch))).length;
      for (let n = 0; n < 6 && size() > 3900; n++) { if (n === 0) g.ts = g.ts.slice(-2); else if (n === 1) g.k = g.k.slice(-6); else if (n === 2) g.ev = g.ev.slice(-3); else g.z = g.z.slice(0, Math.floor(g.z.length * 0.06) * 10); }
      send(patch);
    },

    /* ---------------- everyone: drawing the zombies ---------------- */
    tick(dt) {
      if (!this.S) return;
      const ck = clock(), tnow = performance.now() / 1000;
      this.light(ck);
      let list, kills, evs, shots;
      if (iAmHost()) {
        if (!this.H) this.H = this.adopt();
        list = this.H.zs.map((z) => ({ id: z.id, t: z.t, x: z.x, z: z.z, yaw: z.yaw, hp: Math.max(0, z.hp) / z.max, st: z.st }));
        kills = this.H.kl; evs = this.H.ev; shots = this.H.ts;
      } else {
        if (this.H) { this.H = null; }
        const h = crew()[0], g = h && h.pr && h.pr.g;
        if (g && typeof g === 'object' && g.gs !== this.gsSeen) { this.gsSeen = g.gs; this.lastG = g; this.list = this.parse(g); }
        list = this.list || []; kills = (this.lastG && this.lastG.k) || []; evs = (this.lastG && this.lastG.ev) || []; shots = (this.lastG && this.lastG.ts) || [];
        // what's been built, as the host has it
        const bp = h && h.pr && h.pr.bp, key = h ? h.peer + ':' + (bp && typeof bp === 'object' ? bp.v : '-') : '';
        if (h && key !== this.bpSeen) { this.bpSeen = key; const ok = bp && typeof bp === 'object'; this.lastBP = ok ? bp : null; this.applyB(ok ? bp : { s: '' }); }
      }
      this.takeKills(kills); this.takeEvents(evs); this.takeShots(shots);
      this.drawPieces(dt); this.buildView();
      if (!this.baseLive && tnow > this.restoreAt) this.restoreBase(tnow);
      for (const [n, q] of this.pend) if (tnow - q.at > 20) this.pend.delete(n);
      this.drawZombies(list, dt, iAmHost());
      this.bites(dt);
      this.others(dt);
      this.combat(dt, tnow);
      this.effects(dt);
      this.survive(dt, ck);
      this.flushHits(tnow);
      for (const m of this.fire) { m.scale.set(0.5 + Math.random() * 0.6, 0.6 + Math.random() * 1.2, 0.5 + Math.random() * 0.6); m.position.y = 0.6 + m.scale.y / 2; m.rotation.y += dt * 3; }
      if ((this.uiT = (this.uiT || 0) - dt) <= 0) { this.uiT = 0.2; this.vitals(); this.minimap(); this.banner(ck); }
      if (this.dirty && (this.saveT -= dt) <= 0) { this.saveT = 8; this.save(); }
    },
    takeKills(list) {
      if (!Array.isArray(list)) return;
      if (!this.killSeen) { this.killSeen = new Set(list.map((k) => k[0] + ':' + k[2])); return; } // the ones from before you arrived
      for (const k of list) {
        if (!Array.isArray(k)) continue;
        const key = k[0] + ':' + k[2]; if (this.killSeen.has(key)) continue;
        this.killSeen.add(key); this.killSet.add(k[0]);
        if (this.killSeen.size > 300) this.killSeen = new Set([...this.killSeen].slice(-150));
        const T = ZT[k[2]]; if (!T) continue;
        if (k[1] === myPeer()) this.reward(k[0], k[2]);
        else if (T.boss && this.bossHit.has(k[0])) { this.gain(T.xp / 2, T.cash / 2); earn(25, 'helped take down the Abomination'); quest('zombie.boss'); toast('🏆 The Abomination is down!', '#fde047'); }
      }
    },
    reward(id, t) {
      const T = ZT[t], S = this.S, melee = this.lastHit.get(id) === 'm';
      S.kills++; this.gain(T.xp, T.cash); questMax('zombie.kill', S.kills); if (T.boss) quest('zombie.boss');
      this.prog('kill', 1); if (t >= 1 && t <= 3) this.prog('kill' + t, 1); if (melee) this.prog('melee', 1);
      if (T.boss) { earn(60, 'defeated the Abomination'); toast('🏆 You defeated the Abomination!', '#fde047'); sfx('win'); }
      else if (S.kills % 25 === 0) earn(5, `${S.kills} zombies`);
      this.send(); this.dirty = true;
    },
    gain(xp, cash) {
      const S = this.S; S.xp += Math.round(xp); S.cash += Math.round(cash);
      while (S.xp >= need(S.lvl) && S.lvl < 99) { S.xp -= need(S.lvl); S.lvl++; S.cash += 50 * S.lvl; toast(`⭐ Level ${S.lvl}!`, '#fde047'); sfx('levelup'); earn(10, `reached level ${S.lvl} in Zombie Outbreak`); this.send(); }
      this.dirty = true;
    },
    takeEvents(list) {
      if (!Array.isArray(list)) return;
      const top = Math.max(0, ...list.map((e) => +e[0] || 0));
      if (this.evSeen == null) { this.evSeen = top; return; }
      for (const e of list) {
        if (!Array.isArray(e) || !(e[0] > this.evSeen)) continue;
        if (e[1] === 1) this.boom(e[2], e[3], true);
        if (e[1] === 3) { puffAt(e[2], floorAt(e[2], e[3]) + 1.5, e[3], [0x8a5a2e, 0x5c3b1e, 0xa0703f, 0x9ca3af], 20); sfx3('break', e[2], e[3], 90); }
        if (e[1] === 4 && e[2] === myPeer()) this.nope(e[3], e[4]);
      }
      this.evSeen = Math.max(this.evSeen, top);
    },
    boom(x, z, hurtsMe) {
      const y = floorAt(x, z) + 1;
      puffAt(x, y, z, [0xff6a00, 0xffc400, 0x3f3f46, 0xa3e635], 26); sfx3('explode', x, z, 110);
      const fl = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffa500, transparent: true, opacity: 0.8 }));
      fl.position.set(x, y, z); scene.add(fl); this.fx.push({ m: fl, t: 0.35, k: 'ball', own: true, geo: true });
      const d = Math.hypot(P.x - x, P.z - z); if (hurtsMe && d < 8 && !inSafe(P.x, P.z)) this.hurt(48 * (1 - d / 10), '💥 Caught in an explosion');
      if (d < 30) this.shake = Math.max(this.shake || 0, 0.6 * (1 - d / 30));
    },
    drawZombies(list, dt, host) {
      const stamp = (this.stamp = (this.stamp || 0) + 1), cam0 = camera.position;
      for (const z of list) {
        let v = this.zv.get(z.id);
        if (!v || v.t !== z.t) { if (v) scene.remove(v.m.g); this.killSet.delete(z.id); const m = zModel(z.t); const y = floorAt(z.x, z.z); m.g.position.set(z.x, y, z.z); m.g.rotation.y = z.yaw; scene.add(m.g); v = { id: z.id, t: z.t, m, x: z.x, z: z.z, y, yaw: z.yaw, walk: Math.random() * 6, flash: 0, hp: 1, st: 0, atk: 0 }; this.zv.set(z.id, v); }
        v.tx = z.x; v.tz = z.z; v.tyaw = z.yaw; v.st = z.st; if (z.hp < v.hp - 0.005) v.flash = Math.max(v.flash, 0.1); v.hp = z.hp; v.stamp = stamp;
      }
      const k = host ? 1 : Math.min(1, dt * 7);
      for (const [id, v] of this.zv) {
        const g = v.m.g;
        if (v.dead) {
          v.dead += dt; g.rotation.x = Math.max(-1.5, -v.dead * 5); g.position.y = v.y + Math.min(0.6, v.dead * 1.5) * ZT[v.t].s - Math.max(0, v.dead - 2) * 1.5;
          if (v.dead > 3.2) { scene.remove(g); this.zv.delete(id); }
          continue;
        }
        if (v.stamp !== stamp) {
          if (this.killSet.has(id)) { v.dead = 0.001; v.m.bar.visible = false; puffAt(v.x, v.y + 3 * ZT[v.t].s, v.z, [0x7f1d1d, 0x65a30d, 0x14532d], ZT[v.t].boss ? 40 : 10); sfx3('die', v.x, v.z, 60, { pitch: 0.6, vol: 0.7 }); }
          else { scene.remove(g); this.zv.delete(id); }
          continue;
        }
        const ox = v.x, oz = v.z;
        if (Math.hypot(v.tx - v.x, v.tz - v.z) > 25) { v.x = v.tx; v.z = v.tz; } else { v.x += (v.tx - v.x) * k; v.z += (v.tz - v.z) * k; }
        let dy = v.tyaw - v.yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; v.yaw += dy * Math.min(1, dt * 9);
        v.y += (floorAt(v.x, v.z) - v.y) * Math.min(1, dt * 10);
        const far = Math.hypot(v.x - cam0.x, v.z - cam0.z) > 230; g.visible = !far;
        g.position.set(v.x, v.y, v.z); g.rotation.y = v.yaw;
        const moving = Math.hypot(v.x - ox, v.z - oz) / Math.max(dt, 1e-3) > 0.6, M = v.m;
        v.walk += dt * (moving ? (v.t === 1 ? 14 : 8) : 2);
        const sw = moving ? Math.sin(v.walk) * 0.7 : 0;
        M.legL.rotation.x = sw; M.legR.rotation.x = -sw;
        v.atk = v.st === 2 ? v.atk + dt : 0;
        const reach = v.st === 2 ? 1.2 + Math.sin(v.atk * 9) * 0.6 : 1.45 + Math.sin(v.walk * 0.5) * 0.12;
        M.armL.rotation.x = reach + (v.st === 2 ? 0.3 : 0); M.armR.rotation.x = reach;
        M.body.rotation.x = v.t === 1 && moving ? 0.28 : v.t === 2 ? 0.12 : 0;
        if (v.flash > 0) { v.flash -= dt; for (const m of M.mats) m.emissive.setHex(v.flash > 0 ? 0x991b1b : 0); }
        M.bar.visible = v.hp < 0.995 && !far && Math.hypot(v.x - P.x, v.z - P.z) < 70;
        if (M.bar.visible) { M.bar.quaternion.copy(camera.quaternion); M.bar.quaternion.premultiply(g.quaternion.clone().invert()); M.fg.scale.x = 2.3 * v.hp; M.fg.position.x = -1.15 * (1 - v.hp); }
      }
      // now and then one of them groans
      if ((this.groanT -= dt) <= 0) { this.groanT = 1.5 + Math.random() * 3; let n = null, nd = 50; for (const v of this.zv.values()) { const d = Math.hypot(v.x - P.x, v.z - P.z); if (!v.dead && d < nd) { nd = d; n = v; } } if (n) sfx3('groan', n.x, n.z, 50, { pitch: n.t === 2 || n.t === 4 ? 0.7 : 0.9 + Math.random() * 0.3 }); }
    },
    // zombies that reach you bite (you work this out yourself, so it's fair whatever the lag)
    bites(dt) {
      if (P.dead || this.dead || inSafe(P.x, P.z)) return;
      const t = performance.now() / 1000;
      for (const v of this.zv.values()) {
        if (v.dead) continue;
        const Z = ZT[v.t]; if (!Z.dmg) continue;
        const d = Math.hypot(v.x - P.x, v.z - P.z), reach = Z.reach + 0.4;
        if (d > reach || Math.abs(P.y - v.y) > 3.6 + Z.s) continue;
        if (!(v.st === 2 || d < reach * 0.7)) continue;
        if (t < (this.zcd[v.id] || 0)) continue;
        if (this.bm.size && pieceBetween(v.x, v.z, P.x, P.z) >= 0) continue; // a wall (or a barricade) in between
        this.zcd[v.id] = t + Z.cd;
        const night = clock().night;
        this.hurt(Z.dmg * (night ? 1.15 : 1), `🧟 Got by a ${Z.n.toLowerCase()}`);
        v.atk = 0.01;
      }
    },
    hurt(n, why) {
      if (P.dead || this.dead) return;
      this.hp -= n; sfx('hurt', { gap: 120 });
      const el = $('#zsHurt'); if (el) { el.style.opacity = Math.min(1, 0.35 + n / 40); clearTimeout(this.hurtT); this.hurtT = setTimeout(() => (el.style.opacity = 0), 220); }
      this.shake = Math.max(this.shake || 0, 0.25);
      if (this.searching) this.cancelSearch();
      if (this.hp <= 0) this.died(why);
    },
    died(why) {
      this.hp = 0; this.dead = true; this.firing = false; this.reloading = null; this.aim = false; if (this.building) this.toggleBuild(false);
      const S = this.S, lost = Math.floor(S.cash * 0.1), lived = (performance.now() - this.alive0) / 1000;
      S.cash -= lost; S.best = Math.max(S.best, Math.floor(lived)); this.dirty = true;
      if (clock().night) this.nightDied = true;
      die(); sfx('die');
      toast('💀 You died', '#fca5a5');
      say(`${why || 'You died'}. You survived ${mmss(lived)}${lost ? ` and dropped ${money(lost)}` : ''}. Back to the Safe Zone…`, '#fca5a5');
    },

    /* ---------------- other players: their weapons and shots ---------------- */
    others(dt) {
      const prs = new Map(Net.peers.filter((p) => !p.isMe && p.presence).map((p) => [p.peer, p.presence]));
      for (const [peer, pr] of prs) {
        const seen = this.peerSeen.get(peer) || {}, a = Net.avatars.get(peer);
        const sh = Array.isArray(pr.sh) ? pr.sh : null;
        if (sh && seen.sh !== undefined && sh[0] !== seen.sh && a) { const h = a.g.position; this.tracer([h.x, h.y + 3.6, h.z], [sh[1], sh[2], sh[3]], WP[pr.w] && WP[pr.w].pellets ? 0xffd27a : 0xfff3b0); sfx3(WP[pr.w] && WP[pr.w].pellets ? 'cannon' : 'gun', h.x, h.z, 120, { vol: 0.8 }); }
        seen.sh = sh ? sh[0] : 0;
        const gr = Array.isArray(pr.gr) ? pr.gr : null;
        if (gr && seen.gr !== undefined && gr[0] !== seen.gr) this.boom(gr[1], gr[2], false);
        seen.gr = gr ? gr[0] : 0;
        this.peerSeen.set(peer, seen);
      }
    },
    // hold weapons: mine and everyone's (after the walk animation, so the arms stay up)
    pose() {
      if (!this.S) return;
      this.holdOn(me, this.cur(), 'me');
      for (const [peer, a] of Net.avatars) { const p = Net.peers.find((q) => q.peer === peer); this.holdOn(a, p && p.presence ? String(p.presence.w || '') : '', peer); }
      if (me && this.swingT > 0) { me.armR.rotation.x = 2.6 - (1 - this.swingT / 0.3) * 2.4; }
    },
    holdOn(a, wid, key) {
      if (!a || a.dead) return;
      let h = key === 'me' ? this.myHeld : this.held.get(key);
      if (!h || h.a !== a || h.w !== wid) {
        if (h && h.m && h.m.parent) h.m.parent.remove(h.m);
        h = { a, w: wid, m: null };
        if (WP[wid] && wid !== 'fists') { h.m = weaponModel(wid); h.m.rotation.x = WP[wid].gun ? -Math.PI / 2 : -Math.PI / 2 + 0.5; h.m.position.set(0, -1.9, WP[wid].gun ? -0.1 : 0); a.armR.add(h.m); }
        if (key === 'me') this.myHeld = h; else this.held.set(key, h);
      }
      const W = WP[wid];
      if (W && W.gun) { a.armR.rotation.x = Math.PI / 2; if (W.slot === 'p') { a.armL.rotation.x = 1.35; a.armL.rotation.z = 0.55; } else a.armL.rotation.z = 0; }
      else a.armL.rotation.z = 0;
    },

    /* ---------------- you: fighting ---------------- */
    hover(e) { this.mouse = { x: e.x, y: e.y }; },
    // a click shoots (or swings) where you click; holding the button down without dragging the camera keeps
    // automatic weapons firing; dragging just turns the camera
    press(btn, down) {
      if (btn === 2) { if (this.building) { if (down) this.turn(); return; } this.aim = !!down && !!WP[this.cur()].gun; return; } // aim (the right button); building: turn it
      if (btn !== 0) return;
      if (down) { this.hold = { at: performance.now() / 1000, auto: false }; }
      else { if (this.hold) this.hold.up = true; if (this.firing === 'mouse') this.firing = false; }
    },
    click(e) {
      if (e.button === 2) return; // (that was aiming; grenades are G)
      const h = this.hold; this.hold = null;
      if (this.building) { this.mouse = { x: e.x, y: e.y }; this.buildAct(); return; }
      if (h && h.auto) return; // it was already firing while held
      this.mouse = { x: e.x, y: e.y };
      this.fireOnce(this.aimFrom(e.x, e.y));
    },
    key(code, down) {
      if (!down) {
        if (code === 'KeyF') this.firing = false;
        if (code === 'KeyR' && this.rAt && performance.now() - this.rAt > 350) this.aim = false; // (held down: aimed only while it was)
        this.rAt = 0; return;
      }
      if (code === 'KeyQ') { this.toggleBuild(); return true; }
      if (this.building) {
        const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].indexOf(code);
        if (n >= 0) { this.pickTool(n); return true; }
        if (code === 'KeyR') { this.turn(); return true; }
        if (code === 'KeyF') { this.buildAct(); return true; }
      }
      if (code === 'KeyF') { this.firing = 'auto'; this.trigger(); return true; }
      // R aims: tap it to aim until you tap it again, or hold it (handy on a trackpad); T reloads
      if (code === 'KeyR') {
        if (this.aim) { this.aim = false; this.rAt = 0; sfx('click'); return true; }
        if (!WP[this.cur()].gun) { toast('Get a gun out to aim', '#fca5a5'); sfx('error'); return true; }
        this.aim = true; this.rAt = performance.now(); sfx('select'); tryLock(); // (the mouse turns the camera while you aim)
        return true;
      }
      if (code === 'KeyT') { this.reload(); return true; }
      if (code === 'Digit1' || code === 'Digit2' || code === 'Digit3') { this.pick(['m', 's', 'p'][+code.slice(5) - 1]); return true; }
      if (code === 'KeyG' || code === 'Digit4') { this.throwNade(this.mouse ? this.aimFrom(this.mouse.x, this.mouse.y) : this.autoAim()); return true; }
      if (code === 'KeyH' || code === 'Digit5') { this.heal(); return true; }
      if (code === 'KeyC' || code === 'Digit6') { this.eat(); return true; }
      if (code === 'KeyB' || code === 'Tab' || code === 'KeyI') { this.backpack(); return true; }
      if (code === 'KeyM') { this.mapPanel(); return true; }
    },
    menuKey(code) { if (code === 'KeyB' || code === 'Tab' || code === 'KeyI' || code === 'KeyM') closePanel(); },
    pick(slot) {
      const S = this.S; if (!S.slot[slot]) { toast(slot === 'p' ? 'No main gun yet — find or buy one' : 'Nothing in that slot', '#fca5a5'); sfx('error'); return; }
      if (S.cur === slot) return;
      S.cur = slot; this.reloading = null; this.aim = false; this.dirty = true; sfx('select'); this.drawBar(); this.send();
    },
    trigger() { this.fireOnce(); },
    // the camera shakes a little (applied to its angles, then taken back next frame)
    shakeCam(dt) {
      cam.yaw -= this.sy0 || 0; cam.pitch -= this.sp0 || 0; this.sy0 = this.sp0 = 0;
      if (!(this.shake > 0)) return;
      this.shake = Math.max(0, this.shake - dt * 1.6);
      this.sy0 = (Math.random() - 0.5) * this.shake * 0.04; this.sp0 = (Math.random() - 0.5) * this.shake * 0.04;
      cam.yaw += this.sy0; cam.pitch += this.sp0;
    },
    // where a click points: at a zombie (or near one on screen), else at whatever's there
    aimFrom(sx, sy, exact) {
      const rc = rayAt(sx, sy), o = [rc.ray.origin.x, rc.ray.origin.y, rc.ray.origin.z], d = [rc.ray.direction.x, rc.ray.direction.y, rc.ray.direction.z];
      let best = null, bt = 1e9;
      for (const v of this.zv.values()) { if (v.dead || !v.m.g.visible) continue; const s = ZT[v.t].s, r = 1.1 * s, t = rayBox(o, d, [v.x - r, v.y, v.z - r, v.x + r, v.y + 5.4 * s, v.z + r], 400); if (t < bt) { bt = t; best = v; } }
      if (best) return { x: o[0] + d[0] * bt, y: o[1] + d[1] * bt + 0.2, z: o[2] + d[2] * bt, v: best };
      if (exact) { const w = wallHit(o, d, 320, true); return { x: o[0] + d[0] * w, y: o[1] + d[1] * w, z: o[2] + d[2] * w }; } // (aiming: exactly where you point)
      let bd = 70;
      for (const v of this.zv.values()) { if (v.dead || !v.m.g.visible) continue; const p = new THREE.Vector3(v.x, v.y + 3 * ZT[v.t].s, v.z).project(camera); if (p.z > 1) continue; const dd = Math.hypot((p.x + 1) / 2 * innerWidth - sx, (1 - p.y) / 2 * innerHeight - sy); if (dd < bd && Math.hypot(v.x - P.x, v.z - P.z) < 130) { bd = dd; best = v; } }
      if (best) return { x: best.x, y: best.y + 3.1 * ZT[best.t].s, z: best.z, v: best };
      const w = wallHit(o, d, 320, true);
      return { x: o[0] + d[0] * w, y: o[1] + d[1] * w, z: o[2] + d[2] * w };
    },
    // the nearest zombie in front of the camera that you can see
    autoAim() {
      const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), W = WP[this.cur()] || WP.fists, range = W.gun ? W.range : W.range + 3;
      let best = null, bs = 1e9;
      for (const v of this.zv.values()) {
        if (v.dead) continue;
        const dx = v.x - P.x, dz = v.z - P.z, d = Math.hypot(dx, dz); if (d > range || d < 0.01) continue;
        const dot = (dx * fx + dz * fz) / d; if (dot < (d < 6 ? -0.2 : 0.55)) continue;
        const s = ZT[v.t].s, o = [P.x, P.y + 3.6, P.z], tgt = [v.x, v.y + 3 * s, v.z], dir = [tgt[0] - o[0], tgt[1] - o[1], tgt[2] - o[2]], l = Math.hypot(...dir);
        if (wallHit(o, dir.map((q) => q / l), l) < l - 1) continue;
        const score = d * (1.6 - dot); if (score < bs) { bs = score; best = v; }
      }
      if (best) return { x: best.x, y: best.y + 3.1 * ZT[best.t].s, z: best.z, v: best };
      return { x: P.x + fx * 30, y: P.y + 3.4, z: P.z + fz * 30 };
    },
    combat(dt, t) {
      if (this.faceT > 0) { this.faceT -= dt; P.yaw = this.aimYaw; }
      if (this.swingT > 0) this.swingT -= dt;
      if (this.reloading) {
        this.reloading.t -= dt;
        if (this.reloading.t <= 0) { const wid = this.reloading.wid, W = WP[wid], S = this.S, n = Math.min(W.mag - (S.mag[wid] | 0), S.ammo[W.ammo] | 0); S.mag[wid] = (S.mag[wid] | 0) + n; S.ammo[W.ammo] -= n; this.reloading = null; this.dirty = true; this.drawBar(); }
      }
      // holding the mouse button (not dragging the camera): automatic weapons and melee keep going
      if (this.hold && !this.hold.auto && !this.hold.up && !(typeof drag !== 'undefined' && drag && drag.moved) && t - this.hold.at > 0.16 && this.mouse) { const W = WP[this.cur()]; if (W && (W.auto || !W.gun)) { this.hold.auto = true; this.firing = 'mouse'; } }
      if (this.firing === 'mouse' && typeof drag !== 'undefined' && drag && drag.moved) this.firing = false;
      if (this.firing) { const W = WP[this.cur()]; if (W && (W.auto || this.firing === 'auto' || !W.gun) && t >= this.nextShot) this.fireOnce(); }
      // thrown grenades
      for (let i = this.nades.length - 1; i >= 0; i--) {
        const n = this.nades[i]; n.t -= dt; n.vy -= 60 * dt;
        n.x += n.vx * dt; n.y += n.vy * dt; n.z += n.vz * dt;
        const gy = Math.max(0, groundBelow(n.x, n.y + 1, n.z)); if (n.y < gy + 0.3) { n.y = gy + 0.3; n.vy = Math.abs(n.vy) * 0.35; n.vx *= 0.6; n.vz *= 0.6; }
        n.m.position.set(n.x, n.y, n.z); n.m.rotation.x += dt * 8;
        if (n.t <= 0) { scene.remove(n.m); this.nades.splice(i, 1); this.nadeBoom(n.x, n.z); }
      }
      // the crosshair follows the mouse when you've got a gun out (aiming on a computer, the dot in the middle is it)
      const aiming = this.aiming(), cr = $('#zsCross');
      if (cr) { const W = WP[this.cur()], show = !!(W && W.gun && !panelOpen() && (aiming ? touchy : this.mouse && !touchy)); cr.style.display = show ? 'block' : 'none'; cr.classList.toggle('aim', aiming); if (show) { cr.style.left = (aiming ? innerWidth / 2 : this.mouse.x) + 'px'; cr.style.top = (aiming ? innerHeight / 2 : this.mouse.y) + 'px'; } }
      this.aimView(dt, aiming);
    },
    // aiming: the view zooms in (the sniper's scope much further), and a laser shows where the shot will go
    aimView(dt, aiming) {
      const scoped = aiming && this.cur() === 'sniper', fov = scoped ? 18 : aiming ? 46 : viewFov();
      if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 12); camera.updateProjectionMatrix(); }
      const sc = $('#zsScope'), inScope = scoped && camera.fov < 28;
      if (sc) { sc.style.display = inScope ? 'block' : 'none'; if (inScope) { const r = Math.min(innerWidth, innerHeight) * 0.36; sc.style.background = `radial-gradient(circle at 50% 50%,transparent 0 ${r}px,rgba(0,0,0,.95) ${r + 3}px)`; } }
      if (me) me.g.visible = !inScope; // (looking through the scope: you're not in the way)
      if (!aiming) { if (this.laser) this.laser.visible = false; return; }
      if (!this.laser) {
        const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]);
        this.laser = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.75 }));
        this.laser.add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3b3b })));
        this.laser.frustumCulled = false; scene.add(this.laser);
      }
      const a = this.aimFrom(innerWidth / 2, innerHeight / 2, true), yaw = P.yaw, o = [P.x - Math.sin(yaw) * 1.4 + Math.cos(yaw) * 1.4, P.y + 3.7, P.z - Math.cos(yaw) * 1.4 - Math.sin(yaw) * 1.4];
      const pos = this.laser.geometry.attributes.position; pos.setXYZ(0, o[0], o[1], o[2]); pos.setXYZ(1, a.x, a.y, a.z); pos.needsUpdate = true;
      this.laser.children[0].position.set(a.x, a.y, a.z); this.laser.visible = !scoped;
    },
    fireOnce(at) {
      if (P.dead || this.dead || !this.S || fullOpen() || this.building) return;
      const t = performance.now() / 1000, wid = this.cur(), W = WP[wid];
      if (t < this.nextShot || this.reloading || this.searching) return;
      const aiming = this.aiming();
      const aim = aiming ? this.aimFrom(innerWidth / 2, innerHeight / 2, true) : at || (this.firing === 'mouse' && this.mouse ? this.aimFrom(this.mouse.x, this.mouse.y) : this.autoAim());
      if (!W.gun) { this.nextShot = t + 1 / W.rate; this.swing(W, aim); return; }
      const S = this.S, m = S.mag[wid] | 0;
      if (m <= 0) { if (S.ammo[W.ammo] > 0) this.reload(); else { sfx('error', { gap: 400 }); toast('Out of ammo', '#fca5a5'); this.firing = false; } this.nextShot = t + 0.35; return; }
      S.mag[wid] = m - 1; this.nextShot = t + 1 / W.rate; this.dirty = true;
      this.faceAt(aim.x, aim.z);
      const fx = -Math.sin(this.aimYaw), fz = -Math.cos(this.aimYaw), rx = Math.cos(this.aimYaw), rz = -Math.sin(this.aimYaw);
      const o = [P.x + fx * 1.4 + rx * 1.4, P.y + 3.7, P.z + fz * 1.4 + rz * 1.4];
      let dx = aim.x - o[0], dy = aim.y - o[1], dz = aim.z - o[2]; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
      const hits = new Map(), ends = [], moving = Math.hypot(P.vx, P.vz) > 2;
      for (let k = 0; k < (W.pellets || 1); k++) {
        const sp = W.spread * (aiming ? (wid === 'sniper' ? 0 : 0.3) * (moving ? 1.3 : 1) : moving ? 1.6 : 1), d = [dx + (Math.random() - 0.5) * 2 * sp, dy + (Math.random() - 0.5) * 2 * sp, dz + (Math.random() - 0.5) * 2 * sp], dl = Math.hypot(...d); d[0] /= dl; d[1] /= dl; d[2] /= dl;
        const wall = wallHit(o, d, W.range);
        const zs = [];
        for (const v of this.zv.values()) { if (v.dead) continue; const s = ZT[v.t].s, r = 1.05 * s, tz = rayBox(o, d, [v.x - r, v.y, v.z - r, v.x + r, v.y + 5.4 * s, v.z + r], wall); if (tz < wall) zs.push([tz, v]); }
        zs.sort((a, b) => a[0] - b[0]);
        let end = wall;
        zs.slice(0, W.pierce || 1).forEach(([tz, v], i) => {
          const hy = o[1] + d[1] * tz, head = hy > v.y + 4.05 * ZT[v.t].s;
          const dmg = W.dmg * (i ? 0.75 : 1) * (head ? 1.6 : 1);
          const h = hits.get(v.id) || { v, dmg: 0, head: false }; h.dmg += dmg; h.head = h.head || head; hits.set(v.id, h);
          end = tz;
        });
        ends.push([o[0] + d[0] * end, o[1] + d[1] * end, o[2] + d[2] * end]);
      }
      for (const h of hits.values()) { this.hitZ(h.v, h.dmg, false, h.head); if (h.head) this.prog('head', 1); }
      for (const e of ends.slice(0, 4)) this.tracer(o, e, W.pellets ? 0xffd27a : 0xfff3b0);
      this.flash(o);
      sfx(W.pellets ? 'cannon' : wid === 'sniper' ? 'boom' : 'gun', { gap: 30, vol: W.auto ? 0.6 : 0.9, pitch: wid === 'minigun' ? 1.4 : wid === 'smg' ? 1.2 : 1 });
      this.shake = Math.max(this.shake || 0, W.pellets || wid === 'sniper' ? 0.18 : 0.05);
      this.shotN++; const e0 = ends[0]; send({ sh: [this.shotN, +e0[0].toFixed(1), +e0[1].toFixed(1), +e0[2].toFixed(1)] });
      if (S.mag[wid] <= 0 && S.ammo[W.ammo] > 0) this.reload();
      this.drawBarSoon();
    },
    swing(W, aim) {
      if (aim) this.faceAt(aim.x, aim.z);
      this.swingT = 0.3; sfx('swing');
      const fx = -Math.sin(this.aimYaw), fz = -Math.cos(this.aimYaw); let any = false;
      for (const v of this.zv.values()) {
        if (v.dead) continue;
        const dx = v.x - P.x, dz = v.z - P.z, d = Math.hypot(dx, dz), s = ZT[v.t].s;
        if (d > W.range + s * 0.8 || Math.abs(v.y - P.y) > 4) continue;
        if (d > 1.6 && (dx * fx + dz * fz) / d < 0.3) continue;
        this.hitZ(v, W.dmg, true); any = true;
      }
      if (any) sfx('hit'); else this.chopAt(W, fx, fz);
    },
    // a melee swing at a tree: wood (a tree has 8 to give, then it grows back)
    chopAt(W, fx, fz) {
      let best = -1, bd = 1e9;
      TREES.forEach((t, n) => { const dx = t[0] - P.x, dz = t[1] - P.z, l = Math.hypot(dx, dz), d = l - 0.45 * t[2]; if (d < W.range && d < bd && (d < 1.4 || (dx * fx + dz * fz) / l > 0.45)) { bd = d; best = n; } });
      if (best < 0) return;
      const t = TREES[best], nowS = Date.now() / 1000, c = this.chop.get(best) || { left: 8, back: 0 };
      if (c.back > nowS) { toast('🌲 Nothing left to chop on that tree for now'); return; }
      const n = Math.min(c.left, W.dmg >= 45 ? 2 : 1); c.left -= n; if (c.left <= 0) { c.left = 8; c.back = nowS + 150; }
      this.chop.set(best, c);
      this.S.wood += n; this.dirty = true; this.prog('chop', n);
      puffAt(t[0], 2.5, t[1], [0x6b4423, 0x8a5a2e, 0x3f8f3a], 6); sfx('dig', { vol: 0.7 });
      this.dmgNum(t[0], 4.5 * t[2], t[1], `+${n} 🪵`, '#fcd34d'); this.drawBarSoon();
    },
    faceAt(x, z) { this.aimYaw = Math.atan2(-(x - P.x), -(z - P.z)); this.faceT = 0.6; P.yaw = this.aimYaw; },
    hitZ(v, dmg, melee, head) {
      v.flash = 0.1; this.lastHit.set(v.id, melee ? 'm' : 'g');
      if (ZT[v.t].boss) this.bossHit.add(v.id);
      const s = ZT[v.t].s; puffAt(v.x, v.y + (head ? 4.6 : 3) * s, v.z, [0x7f1d1d, 0x991b1b], 4);
      this.dmgNum(v.x, v.y + 5.8 * s, v.z, String(Math.round(dmg)), head ? '#fde047' : '#ffffff');
      if (iAmHost()) { if (!this.H) this.H = this.adopt(); this.damage(v.id, dmg, myPeer()); }
      else this.hq.push([v.id, Math.round(dmg)]);
    },
    flushHits(t) {
      if (!this.hq.length || t - (this.hqAt || 0) < 0.1) return;
      this.hqAt = t;
      const m = new Map(); for (const [id, d] of this.hq) m.set(id, (m.get(id) || 0) + d);
      this.hq = [];
      for (const [id, d] of m) this.zh.push([++this.hn, id, d]);
      this.zh = this.zh.slice(-16);
      send({ zh: this.zh });
    },
    reload() {
      const wid = this.cur(), W = WP[wid]; if (!W || !W.gun || this.reloading || P.dead) return;
      const S = this.S; if ((S.mag[wid] | 0) >= W.mag) return;
      if (!(S.ammo[W.ammo] > 0)) { toast(`No ${AMMO[W.ammo].n.toLowerCase()}`, '#fca5a5'); sfx('error'); return; }
      this.reloading = { wid, t: W.reload }; sfx('reload');
    },
    throwNade(aim) {
      const S = this.S; if (P.dead || this.dead) return;
      if (!(S.it.grenade > 0)) { toast('No grenades', '#fca5a5'); sfx('error'); return; }
      S.it.grenade--; this.dirty = true; this.drawBar();
      const tx = aim ? aim.x : P.x - Math.sin(P.yaw) * 20, tz = aim ? aim.z : P.z - Math.cos(P.yaw) * 20;
      this.faceAt(tx, tz);
      let dx = tx - P.x, dz = tz - P.z; const d = Math.hypot(dx, dz), k = d > 40 ? 40 / d : 1; dx *= k; dz *= k;
      const T = 1.1, m = new THREE.Mesh(BOX, new THREE.MeshLambertMaterial({ color: 0x3f6212 })); m.scale.setScalar(0.6); scene.add(m);
      this.nades.push({ m, x: P.x, y: P.y + 4, z: P.z, vx: dx / T, vy: (0.5 * 60 * T * T - 3) / T, vz: dz / T, t: 1.3 });
      sfx('whoosh');
    },
    nadeBoom(x, z) {
      this.boom(x, z, false);
      for (const v of this.zv.values()) { if (v.dead) continue; const d = Math.hypot(v.x - x, v.z - z); if (d < 10) this.hitZ(v, 190 * (1 - d / 13), false); }
      this.grN++; send({ gr: [this.grN, +x.toFixed(1), +z.toFixed(1)] });
      this.shotN++; send({ sh: [this.shotN, +x.toFixed(1), 1, +z.toFixed(1)] });
    },
    tracer(a, b, color) {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz); if (l < 0.5) return;
      const m = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }));
      m.scale.set(0.09, 0.09, l); m.position.set(a[0] + dx / 2, a[1] + dy / 2, a[2] + dz / 2); m.lookAt(b[0], b[1], b[2]);
      scene.add(m); this.fx.push({ m, t: 0.07, k: 'fade', own: true });
    },
    flash(o) {
      const m = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.95 }));
      m.scale.setScalar(0.7); m.position.set(o[0], o[1], o[2]); m.rotation.set(Math.random(), Math.random(), 0); scene.add(m); this.fx.push({ m, t: 0.05, k: 'fade', own: true });
    },
    dmgNum(x, y, z, text, color) {
      if (this.fx.filter((f) => f.k === 'num').length > 14) return;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: numTex(text, color), transparent: true, depthTest: false }));
      s.scale.set(2.4, 0.9, 1); s.position.set(x + (Math.random() - 0.5) * 1.2, y, z + (Math.random() - 0.5) * 1.2); s.renderOrder = 10; scene.add(s);
      this.fx.push({ m: s, t: 0.8, k: 'num', own: true, vy: 3 });
    },
    effects(dt) {
      for (let i = this.fx.length - 1; i >= 0; i--) {
        const f = this.fx[i]; f.t -= dt;
        if (f.k === 'num') { f.m.position.y += f.vy * dt; f.m.material.opacity = Math.min(1, f.t * 3); }
        if (f.k === 'fade') f.m.material.opacity = Math.max(0, f.t * 12);
        if (f.k === 'ball') { f.m.scale.setScalar(1 + (0.35 - f.t) * 22); f.m.material.opacity = Math.max(0, f.t * 2.2); }
        if (f.t <= 0) { scene.remove(f.m); if (f.own) f.m.material.dispose(); if (f.geo) f.m.geometry.dispose(); this.fx.splice(i, 1); }
      }
      this.shakeCam(dt);
    },

    /* ---------------- you: building ---------------- */
    toggleBuild(on) {
      on = on == null ? !this.building : !!on;
      if (on && (P.dead || this.dead)) return;
      if (on === this.building) return;
      this.building = on; this.aim = false; this.firing = false; this.hold = null; this.spot = null;
      if (on) {
        if (this.searching) this.cancelSearch();
        sfx('select');
        if (!this.S.seenBuild) { this.S.seenBuild = 1; this.dirty = true; say(`🔨 Building: pick a piece, then ${touchy ? 'tap 🔨' : 'click'} to put it down (${touchy ? '↻' : 'R or right-click'} turns it). Walls and barricades keep zombies out, spike traps hurt them and turrets shoot them. Get 🪵 wood by searching houses, farms and camps, chopping trees with a melee weapon, or from the trader.`, '#fde68a'); }
      } else { sfx('click'); this.setGhost(null); }
      const f = $('#zsFire'), r = $('#zsRel'); if (f) f.textContent = on ? '🔨' : '🔫'; if (r) r.textContent = on ? '↻' : '🔄';
      this.drawBar();
    },
    pickTool(n) { this.tool = n; sfx('select'); if (!this.building) this.toggleBuild(true); else this.drawBar(); },
    turn() { this.brot ^= 1; sfx('rotate'); },
    // which way a piece goes: across where you're looking (R turns it)
    rotOf(k) { const B = BP[BKEYS[k]]; if (B.cw === B.cd) return 0; return (Math.abs(Math.sin(cam.yaw)) > Math.abs(Math.cos(cam.yaw)) ? 1 : 0) ^ this.brot; },
    // where you're pointing on the ground (a phone: a little way in front of you)
    buildAim() {
      const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), ahead = this.tool >= 4 ? 5 : 8;
      let x = P.x + fx * ahead, z = P.z + fz * ahead;
      if (!touchy && this.mouse) { const ray = rayAt(this.mouse.x, this.mouse.y).ray, o = ray.origin, d = ray.direction, gy = Math.max(0, P.y); if (d.y < -0.02) { const t = (gy - o.y) / d.y; x = o.x + d.x * t; z = o.z + d.z * t; } }
      const dx = x - P.x, dz = z - P.z, l = Math.hypot(dx, dz); if (l > 16) { x = P.x + (dx / l) * 16; z = P.z + (dz / l) * 16; }
      return { x, z };
    },
    // what's wrong with building piece k there ('' if nothing)
    canBuild(k, i, j, r) {
      const S = this.S, B = BP[BKEYS[k]], me = myPeer();
      if (B.lvl && S.lvl < B.lvl) return `Turrets unlock at level ${B.lvl}`;
      if (S.wood < B.wood) return `Not enough wood (${B.wood} 🪵)`;
      if (B.cash && S.cash < B.cash) return `Not enough cash (${money(B.cash)})`;
      let mine = 0, guns = 0; for (const v of this.bm.values()) if (v.o === me) { mine++; if (BP[BKEYS[v.k]].gun) guns++; }
      if (mine >= MAX_OWN) return NOPE[7];
      if (B.gun && guns >= MAX_TURRETS) return NOPE[8];
      if (this.bm.size >= MAX_ALL) return NOPE[9];
      return NOPE[fits(k, i, j, r, P, this.zv.values())] || '';
    },
    // the piece you're pointing at (to mend or take down)
    aimedPiece(a) {
      let best = null, bt = 1e9;
      if (!touchy && this.mouse) {
        const ray = rayAt(this.mouse.x, this.mouse.y).ray, o = [ray.origin.x, ray.origin.y, ray.origin.z], d = [ray.direction.x, ray.direction.y, ray.direction.z];
        for (const v of this.bm.values()) { const b = v.b, t = rayBox(o, d, [b[0], v.y, b[1], b[2], v.y + BP[BKEYS[v.k]].h, b[3]], 300); if (t < bt) { bt = t; best = v; } }
        if (best) return best;
      }
      let bd = 3.5; for (const v of this.bm.values()) { const d = boxDist(a.x, a.z, v.b); if (d < bd) { bd = d; best = v; } }
      return best;
    },
    setGhost(on) {
      if (!on) { if (this.ghost) { scene.remove(this.ghost.g); this.ghost.g.material.dispose(); this.ghost = null; } return null; }
      if (!this.ghost) { const g = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.4, depthWrite: false })); g.renderOrder = 4; scene.add(g); this.ghost = { g }; }
      return this.ghost;
    },
    // every frame while building: a see-through piece where it'd go (green: fine, red: not there), or a box round the one you'd mend or take down
    buildView() {
      if (!this.building) return;
      if (P.dead || this.dead) { this.toggleBuild(false); return; }
      const a = this.buildAim(), t = this.tool, G = this.setGhost(true).g;
      if (t < 4) {
        const r = this.rotOf(t), [w, d] = bdims(t, r), i = Math.round((a.x + HALF) / CELL - w / 2), j = Math.round((a.z + HALF) / CELL - d / 2);
        const B = BP[BKEYS[t]], b = bbox(t, i, j, r), y = pieceFloor(t, i, j, r), why = this.canBuild(t, i, j, r);
        this.spot = { k: t, i, j, r, why };
        G.visible = true; G.scale.set(b[2] - b[0], B.h, b[3] - b[1]); G.position.set((b[0] + b[2]) / 2, y + B.h / 2, (b[1] + b[3]) / 2); G.material.color.setHex(why ? 0xef4444 : 0x22c55e);
        return;
      }
      const v = this.aimedPiece(a); this.spot = { v };
      G.visible = !!v;
      if (v) { const B = BP[BKEYS[v.k]], b = v.b; G.scale.set(b[2] - b[0] + 0.3, B.h + 0.3, b[3] - b[1] + 0.3); G.position.set((b[0] + b[2]) / 2, v.y + B.h / 2, (b[1] + b[3]) / 2); G.material.color.setHex(t === 4 ? 0xfacc15 : v.o === myPeer() || !this.present(v.o) ? 0xef4444 : 0x64748b); }
    },
    buildAct() {
      if (!this.building || P.dead || this.dead || !this.spot) return;
      const S = this.S, t = this.tool, s = this.spot, nowT = performance.now() / 1000;
      if (nowT < this.bT) return;
      this.bT = nowT + 0.22;
      if (t < 4) {
        if (s.why) { toast('🔨 ' + s.why, '#fca5a5'); sfx('error'); return; }
        const B = BP[BKEYS[t]]; S.wood -= B.wood; S.cash -= B.cash || 0; this.dirty = true;
        this.ask(['p', t, s.i, s.j, s.r, 0], { wood: B.wood, cash: B.cash || 0 });
        sfx('place'); this.prog('build', 1); this.drawBarSoon();
        return;
      }
      const v = s.v; if (!v) { toast(touchy ? 'Face something you’ve built' : 'Point at something that’s been built', '#fca5a5'); sfx('error'); return; }
      if (t === 5 && v.o !== myPeer() && this.present(v.o)) { toast(`That’s ${nameOf(v.o)}’s`, '#fca5a5'); sfx('error'); return; }
      if (boxDist(P.x, P.z, v.b) > 20) { toast(NOPE[6], '#fca5a5'); sfx('error'); return; }
      if (t === 4) { // mend it: 1 wood for every 125 health
        const miss = (1 - v.hp) * BP[BKEYS[v.k]].hp; if (miss < 8) { toast('That’s in one piece'); return; }
        const n = Math.min(miss, 250), wood = Math.max(1, Math.ceil(n / 125));
        if (S.wood < wood) { toast(`Not enough wood (${wood} 🪵)`, '#fca5a5'); sfx('error'); return; }
        S.wood -= wood; this.dirty = true; this.ask(['f', v.id, Math.round(n)], { wood }); sfx('dig'); this.drawBarSoon();
        return;
      }
      // take it down (half the wood back)
      if (this.rmAsk.has(v.id)) return;
      this.rmAsk.set(v.id, Math.floor(BP[BKEYS[v.k]].wood / 2)); this.ask(['x', v.id], { rm: v.id }); sfx('break');
    },
    // ask the host (if that's you, it's done straight away); what it cost comes back if it can't be done
    ask(q, cost) {
      const seq = ++this.bqn; q = [seq].concat(q);
      if (cost) this.pend.set(seq, Object.assign({ at: performance.now() / 1000 }, cost));
      if (iAmHost()) { if (!this.H) this.H = this.adopt(); const why = this.bReq(this.H, myPeer(), q); if (why) this.nope(seq, why); return; }
      this.bq.push(q); if (this.bq.length > 48) this.bq.shift();
      send({ bq: this.bq });
    },
    nope(seq, why) {
      const q = this.pend.get(seq); if (!q) return;
      this.pend.delete(seq);
      if (q.rm) this.rmAsk.delete(q.rm);
      if (q.free) return;
      this.S.wood += q.wood || 0; this.S.cash += q.cash || 0; this.dirty = true; this.drawBarSoon();
      toast(`🔨 ${NOPE[why] || 'That can’t be built there'}`, '#fca5a5'); sfx('error');
    },
    // your base from last time goes back up (free); after that, what you've built is remembered as it is
    restoreBase(tnow) {
      if (!this.restoring) { this.restoring = true; for (const b of this.S.base) this.ask(['p', b[0], b[1], b[2], b[3] ? 1 : 0, 1], { free: 1 }); this.liveAt = tnow + (this.S.base.length ? 6 : 0); return; }
      if (tnow > this.liveAt) this.baseLive = true;
    },
    parseB(bp) {
      const s = bp && typeof bp.s === 'string' ? bp.s : '', o = bp && Array.isArray(bp.o) ? bp.o : [], out = [];
      for (let n = 0; n + 9 <= s.length; n += 9) { const kr = d1(s, n), k = kr & 3; if (kr < 0 || !BKEYS[k]) continue; out.push({ id: d2(s, n + 1), k, r: (kr >> 2) & 1, i: d2(s, n + 3), j: d2(s, n + 5), hp: d1(s, n + 7) / 63, o: String(o[d1(s, n + 8)] || '') }); }
      return out;
    },
    // everyone: what's been built, from the host's list (models, what you bump into, the zombies' map)
    applyB(bp) {
      const list = this.parseB(bp), ids = new Map(list.map((q) => [q.id, q]));
      for (const [id, v] of this.bm) {
        const q = ids.get(id);
        if (q && q.k === v.k && q.i === v.i && q.j === v.j && q.r === v.r) continue;
        this.dropB(v); this.bm.delete(id);
        if (!q && this.rmAsk.has(id)) { this.S.wood += this.rmAsk.get(id); this.rmAsk.delete(id); this.dirty = true; this.drawBarSoon(); toast(`🪓 Taken down (+${BP[BKEYS[v.k]].wood >> 1} 🪵)`, '#fde68a'); }
      }
      for (const q of list) {
        let v = this.bm.get(q.id);
        if (!v) { v = this.makeB(q); this.bm.set(q.id, v); }
        v.hp = q.hp; v.o = q.o;
      }
      if (this.baseLive) { const me = myPeer(), base = list.filter((q) => q.o === me).map((q) => [q.k, q.i, q.j, q.r]); if (JSON.stringify(base) !== JSON.stringify(this.S.base)) { this.S.base = base; this.dirty = true; } }
    },
    makeB(q) {
      const B = BP[BKEYS[q.k]], b = bbox(q.k, q.i, q.j, q.r), y = pieceFloor(q.k, q.i, q.j, q.r), m = pieceModel(q.k, b[2] - b[0], b[3] - b[1]);
      m.g.position.set((b[0] + b[2]) / 2, y, (b[1] + b[3]) / 2); scene.add(m.g);
      const part = B.trap ? null : solid(b[0] + 0.05, y, b[1] + 0.05, b[2] - 0.05, y + B.h, b[3] - 0.05, { built: q.id });
      markCells(q, true);
      return { id: q.id, k: q.k, i: q.i, j: q.j, r: q.r, hp: q.hp, o: q.o, b, y, m, part, yaw: 0, aimYaw: 0 };
    },
    dropB(v) {
      scene.remove(v.m.g);
      if (v.part) { const n = parts.indexOf(v.part); if (n >= 0) parts.splice(n, 1); }
      markCells(v, false);
    },
    drawPieces(dt) {
      for (const v of this.bm.values()) {
        const M = v.m, near = Math.hypot((v.b[0] + v.b[2]) / 2 - P.x, (v.b[1] + v.b[3]) / 2 - P.z);
        M.bar.visible = v.hp < 0.995 && (near < 55 || this.building);
        if (M.bar.visible) { M.bar.quaternion.copy(camera.quaternion); M.fg.scale.x = 2.5 * v.hp; M.fg.position.x = -1.25 * (1 - v.hp); }
        if (M.head) { let d = v.aimYaw - v.yaw; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; v.yaw += d * Math.min(1, dt * 10); M.head.rotation.y = v.yaw; }
      }
    },
    // turrets firing (the host says which, and at what)
    takeShots(list) {
      if (!Array.isArray(list)) return;
      const top = Math.max(0, ...list.map((e) => +e[0] || 0));
      if (this.tsSeen == null || top < this.tsSeen - 40) { this.tsSeen = top; return; }
      for (const e of list) {
        if (!Array.isArray(e) || !(e[0] > this.tsSeen)) continue;
        const v = this.bm.get(e[1]); if (!v || !v.m.head) continue;
        const x = (v.b[0] + v.b[2]) / 2, z = (v.b[1] + v.b[3]) / 2; v.aimYaw = Math.atan2(-(e[2] - x), -(e[3] - z));
        const fx = -Math.sin(v.aimYaw), fz = -Math.cos(v.aimYaw), o = [x + fx * 2, v.y + 2.7, z + fz * 2];
        this.tracer(o, [e[2], floorAt(e[2], e[3]) + 3, e[3]], 0xfde68a); this.flash(o);
        sfx3('gun', x, z, 90, { vol: 0.45, pitch: 1.3, gap: 60 });
      }
      this.tsSeen = Math.max(this.tsSeen, top);
    },

    /* ---------------- you: staying alive ---------------- */
    survive(dt, ck) {
      if (P.dead || this.dead) return;
      const safe = inSafe(P.x, P.z), moving = Math.hypot(P.vx, P.vz) > 2;
      // sprinting
      this.sprint = (sprintHeld() || this.runToggle) && moving && this.stam > 1 && !this.aiming();
      this.stam = clamp(this.stam + (this.sprint ? -22 : 16) * dt, 0, 100);
      if (this.boost > 0) this.boost -= dt;
      // hunger, and healing
      this.food = Math.max(0, this.food - dt * (this.sprint ? 0.13 : 0.075));
      if (this.food <= 0) this.hurtT2 = (this.hurtT2 || 0) + dt; if (this.hurtT2 > 2) { this.hurtT2 = 0; this.hurt(2, '🍖 Starved'); }
      if (this.hp < 100 && !this.dead) this.hp = Math.min(100, this.hp + dt * (safe ? 3 : this.food > 50 ? 0.4 : 0));
      // searching a container
      if (this.searching) {
        const s = this.searching; s.t = performance.now() / 1000 - s.at; // real seconds, however slow the frames
        if (Math.hypot(P.x - s.l.x, P.z - s.l.z) > 4.5) this.cancelSearch();
        else if (s.t >= s.need) this.finishSearch();
      }
      // where you are
      const a = areaAt(P.x, P.z), id = a ? a.id : null;
      if (id !== this.area) { this.area = id; if (a && a.id !== 'safe') { toast(`${a.e} ${a.n}`, '#e2e8f0'); this.visit(a.id, ck); } if (a && a.id === 'safe') say('🛡️ You’re in the Safe Zone: zombies can’t get in, and you heal faster.', '#a7f3d0'); }
      if (ck.night && !safe) this.nightOut += dt;
      // day and night
      if (this.nightWas !== null && this.nightWas !== ck.night) {
        if (ck.night) { toast(ck.blood ? '🩸 Blood Moon! A boss is coming…' : '🌙 Night falls — they’re faster now', ck.blood ? '#fca5a5' : '#c7d2fe'); sfx(ck.blood ? 'thunder' : 'horn'); this.nightDied = false; this.nightOut = 0; }
        else {
          if (!this.nightDied) { const S = this.S; S.nights++; questMax('zombie.night', S.nights); this.gain(60, 120); earn(15, 'survived the night'); toast('☀️ You survived the night!', '#fde68a'); sfx('win'); if (this.nightOut > DAY * (1 - DUSK) * 0.5) this.prog('night', 1); }
        }
      }
      this.nightWas = ck.night;
    },
    visit(id, ck) { for (const q of this.S.q) { const M = MISSIONS[q[0]]; if (M && M.k === 'visit' && M.at === id && (!M.night || ck.night)) this.progQ(q, 1); } },
    prog(k, n) { for (const q of this.S.q) { const M = MISSIONS[q[0]]; if (M && M.k === k) this.progQ(q, n); } },
    progQ(q, n) { if (q[1] >= q[2]) return; q[1] = Math.min(q[2], q[1] + n); this.dirty = true; if (q[1] >= q[2]) { toast('📋 Mission done! Claim it at the board', '#a7f3d0'); sfx('reward'); } },
    newMission() {
      const S = this.S, have = new Set(S.q.map((q) => q[0]));
      let i, tries = 0; do { i = Math.floor(Math.random() * MISSIONS.length); } while ((have.has(i) || (MISSIONS[i].k === 'kill2' && S.lvl < 3)) && tries++ < 40);
      return [i, 0, MISSIONS[i].n(S.lvl)];
    },
    heal() {
      const S = this.S; if (P.dead || this.dead) return;
      if (this.hp >= 100) { toast('Already at full health'); return; }
      const k = this.hp < 50 && S.it.medkit > 0 ? 'medkit' : S.it.bandage > 0 ? 'bandage' : S.it.medkit > 0 ? 'medkit' : '';
      if (!k) { toast('No bandages or medkits', '#fca5a5'); sfx('error'); return; }
      S.it[k]--; this.hp = Math.min(100, this.hp + IT[k].heal); sfx('heal'); toast(`${IT[k].e} +${IT[k].heal} health`, '#86efac'); this.dirty = true; this.drawBar();
    },
    eat() {
      const S = this.S; if (P.dead || this.dead) return;
      const order = this.food < 60 ? ['beans', 'chips', 'soda', 'energy'] : ['chips', 'soda', 'beans', 'energy'], k = order.find((x) => S.it[x] > 0);
      if (!k) { toast('Nothing to eat', '#fca5a5'); sfx('error'); return; }
      this.use(k);
    },
    use(k) {
      const S = this.S, I = IT[k]; if (!I || !(S.it[k] > 0) || P.dead) return;
      if (I.heal) { this.heal(); return; }
      if (k === 'grenade') { closePanel(); this.throwNade(this.autoAim()); return; }
      S.it[k]--; this.food = Math.min(100, this.food + (I.food || 0)); if (I.stam) this.stam = 100; if (I.boost) { this.boost = I.boost; toast('🔋 Speed boost!', '#7dd3fc'); }
      sfx('chomp'); this.dirty = true; this.drawBar();
    },

    /* ---------------- loot ---------------- */
    prompts() {
      if (!this.S) return [];
      const out = [], nowS = Date.now() / 1000, sp = this_spots;
      out.push({ x: sp.trader[0], z: sp.trader[1], r: 5, text: '🛒 Trade with the trader', fn: () => this.shop() });
      out.push({ x: sp.medic[0], z: sp.medic[1], r: 5, text: this.hp < 100 ? `⛑️ Get patched up (${this.S.cash >= 20 ? '$20' : 'free'})` : '⛑️ The medic (you’re fine)', fn: () => this.medic() });
      out.push({ x: sp.board[0], z: sp.board[1], r: 5, text: '📋 Missions', fn: () => this.missions() });
      if (this.searching) return out;
      for (const l of LOOTS) {
        if (Math.abs(l.x - P.x) > 5 || Math.abs(l.z - P.z) > 5) continue;
        const left = (this.S.looted[l.id] || 0) - nowS;
        out.push({ x: l.x, z: l.z, r: 3.6, y: l.y, text: left > 0 ? `${l.lab}: empty (back in ${mmss(left)})` : `🔍 Search the ${l.lab.toLowerCase()}`, fn: () => this.search(l) });
      }
      return out;
    },
    search(l) {
      const left = (this.S.looted[l.id] || 0) - Date.now() / 1000;
      if (left > 0) { toast('Nothing left here yet'); sfx('error'); return; }
      if (P.dead || this.searching) return;
      this.searching = { l, t: 0, at: performance.now() / 1000, need: l.kind === 'car' ? 1 : 1.4 }; sfx('dig', { vol: 0.5 });
    },
    cancelSearch() { this.searching = null; const el = $('#zsSearch'); if (el) el.style.display = 'none'; },
    finishSearch() {
      const l = this.searching.l, S = this.S, tbl = LOOT[l.kind] || LOOT.house; this.cancelSearch();
      S.looted[l.id] = Math.floor(Date.now() / 1000 + LOOT_BACK);
      const n = l.kind === 'military' || l.kind === 'guns' ? 2 + (Math.random() < 0.4 ? 1 : 0) : 1 + (Math.random() < 0.5 ? 1 : 0), got = [];
      for (let i = 0; i < n; i++) {
        const tot = tbl.reduce((a, b) => a + b[1], 0); let x = Math.random() * tot, k = tbl[0][0];
        for (const [kk, w] of tbl) { if (x < w) { k = kk; break; } x -= w; }
        got.push(this.give(k, l.kind));
      }
      this.prog('loot', 1); this.dirty = true; this.drawBar(); sfx('reward');
      toast(got.join('  '), '#fde68a'); say(`🔍 ${l.lab}: ${got.join(', ')}`, '#fde68a');
    },
    give(k, where) {
      const S = this.S;
      if (k === 'wood') { const n = 3 + Math.floor(Math.random() * 4); S.wood += n; return `🪵 ${n} planks`; }
      if (k === '$') { const n = Math.round((8 + Math.random() * 30) * (where === 'military' ? 2.5 : 1) * (1 + S.lvl * 0.05)); S.cash += n; return `💵 $${n}`; }
      if (AMMO[k]) { const n = Math.round(AMMO[k].pack * (0.45 + Math.random() * 0.55)); S.ammo[k] += n; return `${AMMO[k].e} ${n} ${AMMO[k].n.toLowerCase()}`; }
      if (IT[k]) { const n = k === 'beans' || k === 'soda' || k === 'chips' ? 1 + (Math.random() < 0.3 ? 1 : 0) : 1; S.it[k] += n; return `${IT[k].e} ${IT[k].n}${n > 1 ? ' ×' + n : ''}`; }
      if (WP[k]) return this.giveWeapon(k);
      return '';
    },
    giveWeapon(k) {
      const S = this.S, W = WP[k];
      if (S.w.includes(k)) { if (W.gun) { const n = AMMO[W.ammo].pack; S.ammo[W.ammo] += n; return `${AMMO[W.ammo].e} ${n} ${AMMO[W.ammo].n.toLowerCase()}`; } const c = Math.round(W.price / 4) || 20; S.cash += c; return `💵 $${c} (spare ${W.n.toLowerCase()})`; }
      S.w.push(k); sfx('unlock');
      const curW = WP[S.slot[W.slot]];
      if (!curW || curW.price < W.price) { S.slot[W.slot] = k; if (W.gun) S.mag[k] = Math.min(W.mag, Math.max(S.mag[k] | 0, Math.round(W.mag / 2))); }
      this.send();
      return `${W.e} ${W.n}!`;
    },

    /* ---------------- menus ---------------- */
    drawBar() {
      clearTimeout(this.barT); this.barT = 0;
      const S = this.S; if (!S) return;
      if (this.building) {
        const tb = (n, key, e, label, cost, lock) => `<button class="xslot ${this.tool === n ? 'on' : ''}" data-t="${n}" title="${label} (${key})"><span class="k">${key}</span><span class="e">${lock ? '🔒' : e}</span>${label}${cost ? `<span class="n">${cost}</span>` : ''}</button>`;
        setBar(BKEYS.map((k, n) => { const B = BP[k]; return tb(n, n + 1, B.e, B.n.replace(/^(Wooden|Auto) /, ''), B.lvl && S.lvl < B.lvl ? `Lv ${B.lvl}` : `${B.wood}🪵${B.cash ? ' $' + B.cash : ''}`, B.lvl && S.lvl < B.lvl); }).join('')
          + tb(4, 5, '🔧', 'Repair') + tb(5, 6, '🪓', 'Remove') + `<button class="xslot" data-k="done" title="Stop building (Q)"><span class="k">Q</span><span class="e">✅</span>Done<span class="n">${S.wood}🪵</span></button>`, (b) => {
          if (b.dataset.k === 'done') this.toggleBuild(false); else if (b.dataset.t != null) this.pickTool(+b.dataset.t);
        });
        return;
      }
      const slotBtn = (k, key) => { const id = S.slot[k], W = WP[id]; if (!W) return `<button class="xslot" data-k="${k}" title="Nothing here yet" disabled><span class="k">${key}</span><span class="e">➖</span>${k === 'p' ? 'Main gun' : 'Sidearm'}</button>`; const pic = W.gun || id !== 'fists' ? portrait(id) : ''; const amt = W.gun ? `<span class="n">${S.mag[id] | 0}/${S.ammo[W.ammo] | 0}</span>` : ''; return `<button class="xslot ${S.cur === k ? 'on' : ''}" data-k="${k}" title="${esc(W.n)}"><span class="k">${key}</span>${pic ? `<img class="pic" src="${pic}" alt="">` : `<span class="e">${W.e}</span>`}${esc(W.n)}${amt}</button>`; };
      const item = (k, key, label, n) => `<button class="xslot" data-k="${k}" title="${label} (${key})"><span class="k">${key}</span><span class="e">${k === 'heal' ? '🩹' : k === 'eat' ? '🥫' : '💣'}</span>${label}<span class="n">${n}</span></button>`;
      setBar(slotBtn('m', '1') + slotBtn('s', '2') + slotBtn('p', '3')
        + item('nade', 'G', 'Grenade', S.it.grenade) + item('heal', 'H', 'Heal', S.it.bandage + S.it.medkit) + item('eat', 'C', 'Eat', S.it.beans + S.it.chips + S.it.soda + S.it.energy)
        + `<button class="xslot" data-k="build" title="Build (Q)"><span class="k">Q</span><span class="e">🔨</span>Build<span class="n">${S.wood}🪵</span></button>`
        + `<button class="xslot" data-k="bag" title="Backpack (B)"><span class="k">B</span><span class="e">🎒</span>Backpack</button><button class="xslot" data-k="map" title="Map (M)"><span class="k">M</span><span class="e">🗺️</span>Map</button>`, (b) => {
        const k = b.dataset.k;
        if (k === 'm' || k === 's' || k === 'p') this.pick(k);
        if (k === 'nade') this.throwNade(this.autoAim());
        if (k === 'heal') this.heal();
        if (k === 'eat') this.eat();
        if (k === 'bag') this.backpack();
        if (k === 'map') this.mapPanel();
        if (k === 'build') this.toggleBuild(true);
      });
    },
    drawBarSoon() { if (!this.barT) this.barT = setTimeout(() => this.drawBar(), 150); },
    vitals() {
      const el = $('#zsV'); if (!el || !this.S) return;
      const S = this.S, row = (e, cls, v, txt) => `<div class="row"><span>${e}</span><div class="meter ${cls}"><i style="width:${clamp(v, 0, 100)}%"></i></div><b style="min-width:30px;text-align:right">${txt}</b></div>`;
      el.innerHTML = row('❤️', 'hp', this.hp, Math.ceil(this.hp)) + row('🍖', 'fd', this.food, Math.ceil(this.food)) + row('🏃', 'st', this.stam, Math.ceil(this.stam))
        + `<div class="lv"><span>⭐ Level ${S.lvl}</span><span>🪵 ${S.wood}</span><span>💵 ${money(S.cash)}</span></div>` + row('✨', 'xp', (S.xp / need(S.lvl)) * 100, '');
      const sr = $('#zsSearch');
      if (sr) { if (this.searching) { sr.style.display = 'block'; sr.innerHTML = `🔍 Searching the ${esc(this.searching.l.lab.toLowerCase())}…<div class="meter"><i style="width:${(this.searching.t / this.searching.need) * 100}%"></i></div>`; } else sr.style.display = 'none'; }
    },
    banner(ck) {
      const t = mmss(ck.left);
      if (ck.night) setBanner(ck.blood ? `🩸 Blood Moon · Night ${ck.n} · dawn in ${t}` : `🌙 Night ${ck.n} · dawn in ${t}`);
      else setBanner(`☀️ Day ${ck.n} · night in ${t}${ck.blood ? ' · 🩸 Blood Moon tonight' : ''}`);
    },
    hud() {
      if (!this.S) return '';
      const W = WP[this.cur()], S = this.S;
      if (this.building) {
        const t = this.tool, s = this.spot, name = t < 4 ? BP[BKEYS[t]].e + ' ' + BP[BKEYS[t]].n : t === 4 ? '🔧 Repair' : '🪓 Remove';
        const tip = t < 4 ? (s && s.why ? `⛔ ${s.why}` : `${touchy ? 'tap 🔨' : 'click'} to build · ${touchy ? '↻' : 'R'} turns it`) : s && s.v ? `${BP[BKEYS[s.v.k]].n}${s.v.o ? ' · ' + (s.v.o === myPeer() ? 'yours' : nameOf(s.v.o) + '’s') : ''} · ${Math.round(s.v.hp * BP[BKEYS[s.v.k]].hp)}/${BP[BKEYS[s.v.k]].hp}` : t === 4 ? 'point at something to mend it' : 'point at something of yours';
        if (touchy) return `🔨 ${name} · 🪵 ${S.wood}${t < 4 && s && s.why ? ' · ⛔ ' + s.why : ''}`; // (the screen's narrow)
        return `🔨 ${name} · 🪵 ${S.wood} · ${tip} · Q done`;
      }
      const gun = W.gun ? `${W.e} ${W.n} <b>${S.mag[this.cur()] | 0}</b>/${S.ammo[W.ammo] | 0}${this.reloading ? ' · reloading…' : ''}` : `${W.e} ${W.n}`;
      const a = areaAt(P.x, P.z);
      return `${this.aiming() ? '🎯 ' : ''}${gun} · ${a ? a.e + ' ' + a.n : '🌾 The wilds'}${this.boost > 0 ? ' · 🔋' : ''}`;
    },
    // the map: drawn once from the world's blocks, then you and everyone on top
    mapCanvas(size) {
      if (!this.mapImg) {
        const c = document.createElement('canvas'); c.width = c.height = 520; const g = c.getContext('2d');
        g.fillStyle = '#4f7d36'; g.fillRect(0, 0, 520, 520);
        g.fillStyle = '#2e5a27'; for (const a of AREAS) if (a.id === 'woods') g.fillRect(a.r[0] + HALF, a.r[1] + HALF, a.r[2] - a.r[0], a.r[3] - a.r[1]);
        const hex = (n) => '#' + n.toString(16).padStart(6, '0'), boxes = MAPBOX.filter((b) => b[3] - b[0] < 300).sort((p, q) => p[4] - q[4]);
        const draw = (b) => { g.fillStyle = hex(b[6]); g.fillRect(b[0] + HALF, b[2] + HALF, Math.max(1, b[3] - b[0]), Math.max(1, b[5] - b[2])); };
        boxes.filter((b) => b[4] < 0.1).forEach(draw);
        g.fillStyle = '#3a3d42'; for (const r of ROADS) g.fillRect(r[0] + HALF, r[1] + HALF, r[2] - r[0], r[3] - r[1]);
        boxes.filter((b) => b[4] >= 0.1).forEach(draw);
        g.fillStyle = '#2f7fd8'; g.beginPath(); g.arc(LAKE[0] + HALF, LAKE[1] + HALF, LAKE[2], 0, TAU); g.fill();
        g.strokeStyle = '#a7f3d0'; g.lineWidth = 3; g.strokeRect(-SAFE + HALF, -SAFE + HALF, SAFE * 2, SAFE * 2);
        this.mapImg = c;
      }
      return this.mapImg;
    },
    minimap() {
      const cv = document.querySelector('#zsMap canvas'); if (!cv) return;
      const g = cv.getContext('2d'), R = 90, sc = 156 / (R * 2), img = this.mapCanvas();
      g.save(); g.clearRect(0, 0, 156, 156);
      g.translate(78, 78); g.rotate(cam.yaw); g.scale(sc, sc); g.translate(-(P.x + HALF), -(P.z + HALF));
      g.drawImage(img, 0, 0);
      g.fillStyle = '#c08a4a'; for (const v of this.bm.values()) if (Math.abs(v.b[0] - P.x) < R * 1.5 && Math.abs(v.b[1] - P.z) < R * 1.5) g.fillRect(v.b[0] + HALF, v.b[1] + HALF, v.b[2] - v.b[0], v.b[3] - v.b[1]);
      g.fillStyle = '#ef4444'; for (const v of this.zv.values()) if (!v.dead && Math.hypot(v.x - P.x, v.z - P.z) < R * 1.5) { g.beginPath(); g.arc(v.x + HALF, v.z + HALF, ZT[v.t].boss ? 4 : 1.8, 0, TAU); g.fill(); }
      g.fillStyle = '#38bdf8'; for (const p of players()) if (!p.me) { g.beginPath(); g.arc(p.x + HALF, p.z + HALF, 2.6, 0, TAU); g.fill(); }
      g.restore();
      g.save(); g.translate(78, 78); g.rotate(cam.yaw - P.yaw); g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 6); g.lineTo(0, 3); g.lineTo(-5, 6); g.closePath(); g.fill(); g.stroke(); g.restore();
      g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '700 11px sans-serif'; g.textAlign = 'center'; g.save(); g.translate(78, 78); g.rotate(cam.yaw); g.fillText('N', 0, -64); g.restore();
    },
    mapPanel() {
      const img = this.mapCanvas(), c = document.createElement('canvas'); c.width = c.height = 520; const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      g.font = '700 11px sans-serif'; g.textAlign = 'center';
      for (const a of AREAS) { const x = (a.r[0] + a.r[2]) / 2 + HALF, y = (a.r[1] + a.r[3]) / 2 + HALF; g.fillStyle = 'rgba(15,23,42,.72)'; const w = g.measureText(a.n).width + 22; g.fillRect(x - w / 2, y - 9, w, 18); g.fillStyle = '#fff'; g.fillText(`${a.e} ${a.n}`, x, y + 4); }
      g.fillStyle = '#c08a4a'; for (const v of this.bm.values()) g.fillRect(v.b[0] + HALF, v.b[1] + HALF, Math.max(2, v.b[2] - v.b[0]), Math.max(2, v.b[3] - v.b[1]));
      g.fillStyle = '#ef4444'; for (const v of this.zv.values()) if (!v.dead) { g.beginPath(); g.arc(v.x + HALF, v.z + HALF, ZT[v.t].boss ? 6 : 2.5, 0, TAU); g.fill(); }
      g.fillStyle = '#38bdf8'; for (const p of players()) if (!p.me) { g.beginPath(); g.arc(p.x + HALF, p.z + HALF, 4.5, 0, TAU); g.fill(); }
      g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.arc(P.x + HALF, P.z + HALF, 6, 0, TAU); g.fill(); g.stroke();
      openPanel('🗺️ Map', `<div class="zs-map"><img src="${c.toDataURL()}" alt="Map" style="width:100%;height:100%;display:block"></div><div class="zs-legend"><span class="pill">⚪ You</span><span class="pill">🔵 Players</span><span class="pill">🔴 Zombies</span><span class="pill">🟩 Safe Zone</span><span class="pill">🟫 Built</span></div>`, null, null, { full: true });
    },
    backpack() {
      const S = this.S, ws = S.w.slice().sort((a, b) => WP[a].price - WP[b].price);
      const wcard = (id) => { const W = WP[id], on = S.slot[W.slot] === id; return `<div class="xp-card ${on ? 'on' : ''}">${W.gun || id !== 'fists' ? `<img src="${portrait(id)}" alt="">` : `<div class="big">${W.e}</div>`}<b>${esc(W.n)}</b><small>${W.gun ? `${W.dmg}${W.pellets ? '×' + W.pellets : ''} dmg · ${W.mag} rounds · ${AMMO[W.ammo].e}` : `${W.dmg} dmg · melee`}</small>${on ? '<button class="xp-btn alt" disabled>Equipped</button>' : `<button class="xp-btn" data-eq="${id}">Equip</button>`}</div>`; };
      const ic = (k) => `<div class="xp-row"><span class="lft"><span class="ico">${IT[k].e}</span><span><b>${IT[k].n}</b><br><small>${IT[k].heal ? '+' + IT[k].heal + ' health' : IT[k].food ? '+' + IT[k].food + ' food' + (IT[k].boost ? ', speed boost' : '') : 'G to throw'}</small></span></span><span><b>×${S.it[k] | 0}</b> <button class="xp-btn ${k === 'grenade' ? 'red' : ''}" data-use="${k}" ${S.it[k] > 0 ? '' : 'disabled'}>${k === 'grenade' ? 'Throw' : 'Use'}</button></span></div>`;
      openPanel('🎒 Backpack', `<div class="xp-note">⭐ Level ${S.lvl} · 🧟 ${S.kills} kills · 🌙 ${S.nights} nights survived · ⏱️ best life ${mmss(S.best)}</div>
        <h4>Weapons</h4><div class="zs-w">${ws.map(wcard).join('')}</div>
        <h4>Ammo</h4>${Object.entries(AMMO).map(([k, A]) => `<div class="xp-row"><span class="lft"><span class="ico">${A.e}</span><b>${A.n}</b></span><b>${S.ammo[k] | 0}</b></div>`).join('')}
        <h4>Supplies</h4>${Object.keys(IT).map(ic).join('')}
        <h4>Building</h4><div class="xp-row"><span class="lft"><span class="ico">🪵</span><span><b>Wood</b><br><small>Search houses, farms and camps, chop trees (melee) or buy planks</small></span></span><b>${S.wood}</b></div>
        <div class="xp-row"><span class="lft"><span class="ico">🔨</span><span><b>Your builds</b><br><small>Q to build: ${BKEYS.map((k) => BP[k].e + ' ' + BP[k].n.replace(/^(Wooden|Auto) /, '')).join(', ')}</small></span></span><b>${[...this.bm.values()].filter((v) => v.o === myPeer()).length}/${MAX_OWN}</b></div>`, (b) => {
        if (b.dataset.eq) { const W = WP[b.dataset.eq]; S.slot[W.slot] = b.dataset.eq; S.cur = W.slot; if (W.gun && S.mag[b.dataset.eq] == null) S.mag[b.dataset.eq] = 0; this.reloading = null; this.dirty = true; sfx('select'); this.drawBar(); this.send(); this.backpack(); }
        if (b.dataset.use) { this.use(b.dataset.use); if (panelOpen()) this.backpack(); }
      }, null, { full: true, extra: `<span class="chip">💵 ${money(S.cash)}</span>` });
    },
    shop(tab) {
      const S = this.S; tab = tab || this.shopTab || 'guns'; this.shopTab = tab;
      const tabs = `<div class="xp-tabs"><button data-tab="guns" class="${tab === 'guns' ? 'on' : ''}">🔫 Weapons</button><button data-tab="sup" class="${tab === 'sup' ? 'on' : ''}">🎒 Ammo & supplies</button></div>`;
      let body = '';
      if (tab === 'guns') body = `<div class="zs-w">${Object.entries(WP).filter(([id]) => id !== 'fists').map(([id, W]) => { const own = S.w.includes(id), lock = S.lvl < W.lvl; return `<div class="xp-card ${own ? 'on' : ''}"><img src="${portrait(id)}" alt=""><b>${W.e} ${esc(W.n)}</b><small>${esc(W.d)}</small><small>${W.gun ? `${W.dmg}${W.pellets ? '×' + W.pellets : ''} dmg · ${W.mag} rounds · ${AMMO[W.ammo].n}` : `${W.dmg} dmg · melee`}</small>${own ? '<button class="xp-btn alt" disabled>Owned</button>' : lock ? `<span class="zs-lock">🔒 Level ${W.lvl}</span>` : `<button class="xp-btn gold" data-buy="${id}" ${S.cash < W.price ? 'disabled' : ''}>${money(W.price)}</button>`}</div>`; }).join('')}</div>`;
      else body = Object.entries(AMMO).map(([k, A]) => `<div class="xp-row"><span class="lft"><span class="ico">${A.e}</span><span><b>${A.n} ×${A.pack}</b><br><small>You have ${S.ammo[k] | 0}</small></span></span><button class="xp-btn gold" data-ammo="${k}" ${S.cash < A.price ? 'disabled' : ''}>${money(A.price)}</button></div>`).join('')
        + Object.entries(IT).map(([k, I]) => `<div class="xp-row"><span class="lft"><span class="ico">${I.e}</span><span><b>${I.n}</b><br><small>You have ${S.it[k] | 0}</small></span></span><button class="xp-btn gold" data-item="${k}" ${S.cash < I.price ? 'disabled' : ''}>${money(I.price)}</button></div>`).join('')
        + `<div class="xp-row"><span class="lft"><span class="ico">🪵</span><span><b>Planks ×10</b><br><small>For building · you have ${S.wood}</small></span></span><button class="xp-btn gold" data-wood="1" ${S.cash < 50 ? 'disabled' : ''}>${money(50)}</button></div>`;
      openPanel('🛒 Trader', tabs + body, (b) => {
        if (b.dataset.tab) { this.shop(b.dataset.tab); return; }
        if (b.dataset.buy) { const W = WP[b.dataset.buy]; if (S.cash < W.price || S.lvl < W.lvl || S.w.includes(b.dataset.buy)) return; S.cash -= W.price; this.giveWeapon(b.dataset.buy); if (W.gun) S.ammo[W.ammo] += AMMO[W.ammo].pack; sfx('buy'); toast(`${W.e} ${W.n}!`, '#fde68a'); }
        if (b.dataset.ammo) { const A = AMMO[b.dataset.ammo]; if (S.cash < A.price) return; S.cash -= A.price; S.ammo[b.dataset.ammo] += A.pack; sfx('buy'); }
        if (b.dataset.item) { const I = IT[b.dataset.item]; if (S.cash < I.price) return; S.cash -= I.price; S.it[b.dataset.item]++; sfx('buy'); }
        if (b.dataset.wood) { if (S.cash < 50) return; S.cash -= 50; S.wood += 10; sfx('buy'); }
        this.dirty = true; this.drawBar(); this.shop();
      }, null, { full: true, extra: `<span class="chip">💵 ${money(S.cash)}</span><span class="chip">⭐ Lv ${S.lvl}</span>` });
    },
    medic() {
      if (this.hp >= 100) { toast('The medic says you’re fine'); return; }
      const S = this.S, cost = S.cash >= 20 ? 20 : 0; S.cash -= cost; this.hp = 100; this.dirty = true; sfx('heal'); toast(`⛑️ Patched up${cost ? ' ($20)' : ''}`, '#86efac');
    },
    missions() {
      const S = this.S;
      const row = (q, i) => { const M = MISSIONS[q[0]]; if (!M) return ''; const done = q[1] >= q[2], cash = M.cash + S.lvl * 10; return `<div class="xp-row" style="flex-direction:column;align-items:stretch"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(M.t.replace('{n}', q[2]))}</b><small>💵 $${cash} · ✨ ${Math.round(cash / 2)} XP</small></div><div class="meter"><i style="width:${(q[1] / q[2]) * 100}%"></i></div><div style="display:flex;justify-content:space-between;align-items:center"><small>${q[1]}/${q[2]}</small>${done ? `<button class="xp-btn gold" data-claim="${i}">Claim</button>` : `<button class="xp-btn alt" data-swap="${i}">Swap ($25)</button>`}</div></div>`; };
      openPanel('📋 Missions', `<div class="zs-q">${S.q.map(row).join('')}</div><p class="xp-note">Finish a mission, then come back here to claim the reward. New ones appear as you finish them.</p>`, (b) => {
        if (b.dataset.claim != null) { const i = +b.dataset.claim, q = S.q[i], M = MISSIONS[q[0]]; if (q[1] < q[2]) return; const cash = M.cash + S.lvl * 10; this.gain(cash / 2, cash); earn(15, 'finished a mission'); S.q.splice(i, 1); S.q.push(this.newMission()); sfx('reward'); }
        if (b.dataset.swap != null) { if (S.cash < 25) { sfx('error'); return; } S.cash -= 25; const i = +b.dataset.swap; S.q.splice(i, 1); S.q.push(this.newMission()); sfx('select'); }
        this.dirty = true; this.missions();
      }, null, { extra: `<span class="chip">💵 ${money(S.cash)}</span>` });
    },

    /* ---------------- day, night and the sky ---------------- */
    light(ck) {
      const k = Math.round(ck.dark * 40) / 40, b = ck.blood && ck.night ? 1 : 0, hi = gfxHigh();
      if (k === this.skyK && b === this.skyB && hi === this.skyHi) return;
      this.skyK = k; this.skyB = b; this.skyHi = hi;
      const hemi = scene.children.find((o) => o.isHemisphereLight);
      if (hemi) hemi.intensity = lerp(hi ? 0.66 : 0.8, b ? 0.36 : 0.3, k); sunL.intensity = lerp(hi ? 0.7 : 0.55, 0.06, k); // (with shadows on, more of the daylight comes from the sun)
      const mix = (a, c) => new THREE.Color(a).lerp(new THREE.Color(c), k);
      const top = mix('#5aaef5', b ? '#1f0306' : '#04060d'), bot = mix('#d6ecfb', b ? '#5c0d12' : '#18213b');
      if (!this.skyCv) { this.skyCv = document.createElement('canvas'); this.skyCv.width = 2; this.skyCv.height = 256; }
      const g = this.skyCv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#' + top.getHexString()); gr.addColorStop(1, '#' + bot.getHexString()); g.fillStyle = gr; g.fillRect(0, 0, 2, 256);
      if (!this.skyTex || scene.background !== this.skyTex) { if (scene.background && scene.background.dispose && scene.background !== this.skyTex) scene.background.dispose(); this.skyTex = new THREE.CanvasTexture(this.skyCv); scene.background = this.skyTex; } else this.skyTex.needsUpdate = true;
      if (!scene.fog) scene.fog = new THREE.Fog(bot, 200, 700);
      scene.fog.color.copy(bot); scene.fog.near = lerp(200, 25, k); scene.fog.far = lerp(720, b ? 190 : 230, k);
    },
  };
  // the first box a ray (unit dir) meets among the world's blocks: how far along it, or max
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
  function wallHit(o, d, max, ground) {
    let best = max;
    const ex = [Math.min(o[0], o[0] + d[0] * max), Math.min(o[1], o[1] + d[1] * max), Math.min(o[2], o[2] + d[2] * max), Math.max(o[0], o[0] + d[0] * max), Math.max(o[1], o[1] + d[1] * max), Math.max(o[2], o[2] + d[2] * max)];
    for (const p of parts) {
      if (!p.solid || (!ground && p.sy < 0.8 && p.y < 1)) continue;
      const b = [p.x - p.sx / 2, p.y - p.sy / 2, p.z - p.sz / 2, p.x + p.sx / 2, p.y + p.sy / 2, p.z + p.sz / 2];
      if (b[3] < ex[0] || b[0] > ex[3] || b[4] < ex[1] || b[1] > ex[4] || b[5] < ex[2] || b[2] > ex[5]) continue;
      const t = rayBox(o, d, b, best); if (t > 0.05 && t < best) best = t;
    }
    if (d[1] < -1e-6) { const tg = (0 - o[1]) / d[1]; if (tg > 0 && tg < best) best = tg; }
    return best;
  }
  addExp(ZS);
  window.__rbZS = ZS; // for tests
})();
