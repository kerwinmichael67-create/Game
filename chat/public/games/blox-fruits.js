/* =====================================================================
   BLOXVERSE — BLOX FRUITS. Six islands in a sea: Starter Island, the
   Jungle, Pirate Village, the Desert, Frozen Village and the Marine
   Fortress, each harder than the last. Take quests, defeat bandits,
   monkeys, pirates, snowmen and marines (and their bosses), level up
   and put your points into Melee, Defense, Sword or Fruit. Buy or find
   a Blox Fruit and eat it for its powers (Z, X and C, unlocked with
   mastery): Bomb, Spike, Chop, Spring, Smoke, Flame, Ice, Sand, Dark,
   Light, Magma, Quake, Buddha, Dough and Dragon. Swords, Geppo, Buso
   Haki and Soru from the teachers, a boat to sail between islands
   (fruit users can't swim!), and a captain at every dock to sail you
   back to islands you've been to. Co-op: the host runs the enemies,
   checks every hit and spawns fruits; your level, Beli and fruits are
   saved.
   ===================================================================== */
(() => {
  const SEA = -0.6, GY = 1.6, FLOOR = -4.1, MAXLV = 200;
  const style = document.createElement('style');
  style.textContent = `
    #bfV{position:absolute;left:12px;bottom:calc(var(--barH,84px) + 22px);width:250px;padding:10px 12px 11px;border-radius:16px;font:700 12.5px var(--fb);color:#e2e8f0;pointer-events:none}
    .touchy #bfV{bottom:auto;top:128px;left:auto;right:12px;width:178px;padding:8px 10px;font-size:11px}
    .touchy #bfV .lv{font-size:14px}.touchy #bfV .beli{font-size:13px}
    #bfV .btns{display:none;gap:6px;margin-top:7px}
    .touchy #bfV .btns{display:flex;pointer-events:auto}
    #bfV .btns button{flex:1;height:30px;border-radius:9px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.1);color:#fff;font:600 12px var(--fh)}
    #bfV .q{margin-top:6px;color:#fde68a;font-size:11px}
    @media (min-width:641px){.touchy #bfV{top:auto;right:auto;left:50%;transform:translateX(-50%);bottom:8px;width:280px;padding:6px 10px}.touchy #bfV .top{margin-bottom:3px}.touchy #bfV .bar{margin-top:3px}.touchy #bfV .btns{margin-top:5px}.touchy #bfV .btns button{height:24px}}
    @media (max-width:640px){.touchy #xbar.bf .xslot{width:54px;min-width:0;height:62px;padding-left:2px;padding-right:2px;font-size:9px;white-space:normal;overflow:hidden;border-radius:14px}}
    @media (max-width:640px){.touchy #xbar.bf .xslot .e{font-size:22px}.touchy #xbar.bf{gap:5px}}
    #bfV .top{display:flex;align-items:center;gap:8px;margin-bottom:7px}
    #bfV .lv{font:600 16px var(--fh);color:#fde047;background:rgba(0,0,0,.35);padding:2px 9px;border-radius:9px}
    #bfV .beli{margin-left:auto;font:600 15px var(--fh);color:#86efac}
    #bfV .bar{position:relative;height:15px;border-radius:8px;background:rgba(0,0,0,.45);overflow:hidden;margin-top:5px;box-shadow:inset 0 1px 2px rgba(0,0,0,.5)}
    #bfV .bar i{position:absolute;left:0;top:0;bottom:0;border-radius:8px;transition:width .15s}
    #bfV .bar b{position:relative;display:block;text-align:center;font:600 11px/15px var(--fh);color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.7)}
    #bfV .xp{height:6px;margin-top:6px}
    #bfQ{position:absolute;right:12px;bottom:calc(var(--barH,84px) + 22px);max-width:270px;padding:10px 14px;border-radius:14px;font:700 13px/1.35 var(--fb);color:#e2e8f0;pointer-events:none}
    #bfQ b{display:block;font:600 14px var(--fh);color:#fde68a;margin-bottom:2px}
    .touchy #bfQ{display:none}
    #bfHurt{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 45%,rgba(220,38,38,.55));opacity:0;transition:opacity .4s}
    #bfDmg .n{position:absolute;transform:translate(-50%,-50%);font:700 19px var(--fh);color:#fff;-webkit-text-stroke:4px rgba(10,12,18,.7);paint-order:stroke fill;pointer-events:none;animation:bfDmg .8s ease-out forwards}
    #bfDmg .n.big{color:#fde047;font-size:24px}
    @keyframes bfDmg{0%{opacity:1;margin-top:0}100%{opacity:0;margin-top:-46px}}
    #bfBig{position:absolute;left:50%;top:28%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;font:700 46px/1.05 var(--fh);color:#fde047;-webkit-text-stroke:7px rgba(10,12,18,.72);paint-order:stroke fill;white-space:nowrap;opacity:0;transition:opacity .4s}
    #bfBig small{display:block;font-size:20px;color:#e2e8f0;-webkit-text-stroke:4px rgba(10,12,18,.72);margin-top:6px}
    .xslot .bf-cd{position:absolute;left:0;right:0;bottom:0;background:rgba(15,23,42,.7);border-radius:0 0 15px 15px;pointer-events:none}
    .xslot.lockd{opacity:.45}
    .xslot .bf-cdn{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;font:600 22px var(--fh);color:#fff;-webkit-text-stroke:4px rgba(10,12,18,.7);paint-order:stroke fill;pointer-events:none}
    .bf-rar{display:inline-block;padding:1px 7px;border-radius:7px;font:700 10.5px var(--fb);color:#fff}
    .bf-st{display:grid;grid-template-columns:1fr auto auto auto;gap:6px 8px;align-items:center;margin:8px 0}
    .bf-st span{font:600 15px var(--fh)}
    .bf-isl{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:12px;background:rgba(255,255,255,.05);margin:6px 0}
    .bf-isl b{flex:1;font:600 15px var(--fh)}
    @media (max-width:640px){#bfV{width:200px;font-size:11px}#bfQ{display:none}}`;
  document.head.append(style);

  /* ---------------- the islands, the enemies ---------------- */
  const ISL = [
    { n: '🏝️ Starter Island', lv: 0, x: 0, z: 0, w: 120, d: 100, top: 0x5fb544, th: 'meadow' },
    { n: '🌴 Jungle', lv: 10, x: 110, z: -320, w: 140, d: 120, top: 0x2f7d32, th: 'forest' },
    { n: '🏴‍☠️ Pirate Village', lv: 30, x: -100, z: -640, w: 130, d: 110, top: 0xd9b26f, th: 'beach' },
    { n: '🏜️ Desert', lv: 60, x: 90, z: -960, w: 140, d: 120, top: 0xe8c98a, th: 'desert' },
    { n: '❄️ Frozen Village', lv: 90, x: -90, z: -1280, w: 130, d: 110, top: 0xeef2f7, th: 'snow' },
    { n: '⚓ Marine Fortress', lv: 120, x: 50, z: -1600, w: 140, d: 120, top: 0x9ca3af, th: 'beach' },
  ];
  // av: skin, shirt, pants, hat, face, back · s: size
  const EN = [
    { k: 'bandit', n: 'Bandit', lv: 5, isl: 0, n0: 8, at: [0, 22], av: [1, 3, 3, 5, 4, 0], s: 1 },
    { k: 'monkey', n: 'Monkey', lv: 14, isl: 1, n0: 6, at: [-32, 18], av: [2, 5, 3, 0, 12, 0], s: 0.85 },
    { k: 'gorilla', n: 'Gorilla', lv: 20, isl: 1, n0: 5, at: [32, 24], av: [3, 6, 2, 0, 4, 0], s: 1.3 },
    { k: 'gking', n: 'Gorilla King', lv: 25, isl: 1, n0: 1, at: [0, 42], av: [3, 6, 2, 3, 4, 1], s: 2.1, boss: 1 },
    { k: 'pirate', n: 'Pirate', lv: 35, isl: 2, n0: 6, at: [-30, 18], av: [0, 1, 2, 12, 4, 0], s: 1 },
    { k: 'brute', n: 'Brute', lv: 45, isl: 2, n0: 5, at: [30, 22], av: [1, 6, 2, 6, 4, 0], s: 1.3 },
    { k: 'bobby', n: 'Bobby', lv: 55, isl: 2, n0: 1, at: [0, 40], av: [4, 9, 4, 4, 12, 1], s: 1.9, boss: 1 },
    { k: 'dbandit', n: 'Desert Bandit', lv: 60, isl: 3, n0: 6, at: [-32, 18], av: [2, 3, 3, 14, 4, 0], s: 1 },
    { k: 'dofficer', n: 'Desert Officer', lv: 70, isl: 3, n0: 6, at: [32, 22], av: [1, 5, 2, 1, 4, 0], s: 1.1 },
    { k: 'snowb', n: 'Snow Bandit', lv: 90, isl: 4, n0: 6, at: [-30, 18], av: [4, 8, 6, 16, 4, 0], s: 1 },
    { k: 'snowman', n: 'Snowman', lv: 100, isl: 4, n0: 5, at: [30, 22], av: [4, 7, 5, 2, 0, 0], s: 1.2 },
    { k: 'yeti', n: 'Yeti', lv: 110, isl: 4, n0: 1, at: [0, 40], av: [4, 7, 5, 0, 4, 0], s: 2.4, boss: 1 },
    { k: 'marine', n: 'Marine', lv: 120, isl: 5, n0: 6, at: [-32, 18], av: [0, 7, 6, 1, 1, 0], s: 1 },
    { k: 'mcaptain', n: 'Marine Captain', lv: 130, isl: 5, n0: 5, at: [32, 22], av: [1, 7, 6, 19, 4, 1], s: 1.2 },
    { k: 'vadmiral', n: 'Vice Admiral', lv: 150, isl: 5, n0: 1, at: [0, 42], av: [0, 7, 6, 15, 4, 1], s: 2.1, boss: 1 },
  ];
  const npcHp = (e) => (15 + e.lv * 9) * (e.boss ? 8 : 1), npcDmg = (e) => (2 + e.lv * 0.55) * (e.boss ? 2 : 1);
  const npcXp = (e) => Math.round((8 + e.lv * 3) * (e.boss ? 6 : 1)), npcBeli = (e) => Math.round((3 + e.lv) * (e.boss ? 12 : 1));
  const need = (L) => Math.floor(40 * Math.pow(L, 1.4) + 60);
  const questOf = (e) => ({ need: e.boss ? 1 : 6, beli: Math.round((80 + e.lv * 40) * (e.boss ? 3 : 1)), xp: Math.round(need(e.lv) * (e.boss ? 1.5 : 0.8)), req: e.boss ? Math.max(1, e.lv - 5) : Math.max(1, ISL[e.isl].lv) });

  /* ---------------- the fruits ---------------- */
  const RAR = [{ n: 'Common', c: '#64748b', w: 50 }, { n: 'Uncommon', c: '#2563eb', w: 28 }, { n: 'Rare', c: '#9333ea', w: 14 }, { n: 'Legendary', c: '#db2777', w: 6 }, { n: 'Mythical', c: '#dc2626', w: 2 }];
  // a move: t (proj · line · ring · aim · dash · jump · trans), x (damage, times the fruit's), cd, en (energy), m (mastery
  // it unlocks at), r (radius), L/w (a line's length and width), sp (a projectile's speed), cnt/spr (how many, spread),
  // ex (a projectile explodes this wide), d (a dash's distance), stun, kb (knockback), burn (seconds), pull
  const FR = [
    { k: 'bomb', n: 'Bomb', e: '💣', r: 0, price: 5000, c: 0xf97316, c2: 0x1f2937, ls: 'beam', m1: { t: 'proj', sp: 55, ex: 4 }, mv: [
      { n: 'Bomb Throw', t: 'aim', x: 3, cd: 4, en: 15, m: 0, r: 7 },
      { n: 'Self-Destruct', t: 'ring', x: 5, cd: 12, en: 30, m: 25, r: 11, kb: 18 },
      { n: 'Bomb Barrage', t: 'proj', x: 2.2, cd: 16, en: 35, m: 75, sp: 50, cnt: 4, spr: 0.25, ex: 6 }] },
    { k: 'spike', n: 'Spike', e: '🦔', r: 0, price: 7500, c: 0x9ca3af, c2: 0xe5e7eb, ls: 'spike', m1: { t: 'line', L: 7, w: 3 }, mv: [
      { n: 'Spike Burst', t: 'line', x: 3, cd: 5, en: 15, m: 0, L: 20, w: 4 },
      { n: 'Spike Ring', t: 'ring', x: 4.5, cd: 10, en: 25, m: 25, r: 10 },
      { n: 'Spike Field', t: 'aim', x: 6, cd: 18, en: 35, m: 75, r: 11, stun: 1 }] },
    { k: 'chop', n: 'Chop', e: '🪚', r: 0, price: 30000, c: 0x60a5fa, c2: 0xdbeafe, ls: 'spike', m1: { t: 'line', L: 8, w: 4 }, mv: [
      { n: 'Chop Spin', t: 'ring', x: 3.5, cd: 5, en: 15, m: 0, r: 8 },
      { n: 'Chop Barrage', t: 'proj', x: 1.4, cd: 9, en: 25, m: 25, sp: 70, cnt: 5, spr: 0.3 },
      { n: 'Chop Festival', t: 'aim', x: 6.5, cd: 18, en: 35, m: 75, r: 13 }] },
    { k: 'spring', n: 'Spring', e: '🌀', r: 0, price: 60000, c: 0xf472b6, c2: 0xfbcfe8, ls: 'beam', jump: 1.35, m1: { t: 'line', L: 9, w: 3 }, mv: [
      { n: 'Spring Snipe', t: 'proj', x: 4, cd: 5, en: 15, m: 0, sp: 95 },
      { n: 'Spring Leap', t: 'jump', x: 5, cd: 9, en: 25, m: 25, r: 10 },
      { n: 'Spring Bounce', t: 'ring', x: 6, cd: 16, en: 35, m: 75, r: 13, kb: 26 }] },
    { k: 'smoke', n: 'Smoke', e: '💨', r: 1, price: 100000, c: 0xd1d5db, c2: 0x9ca3af, ls: 'breath', elem: 1, m1: { t: 'line', L: 9, w: 4 }, mv: [
      { n: 'Smoke Blast', t: 'line', x: 3.5, cd: 5, en: 15, m: 0, L: 17, w: 6 },
      { n: 'Smoke Tornado', t: 'aim', x: 5, cd: 10, en: 25, m: 25, r: 10, pull: 1 },
      { n: 'White Out', t: 'ring', x: 6, cd: 18, en: 35, m: 75, r: 15, stun: 1.5 }] },
    { k: 'flame', n: 'Flame', e: '🔥', r: 1, price: 250000, c: 0xf97316, c2: 0xfacc15, ls: 'breath', elem: 1, m1: { t: 'proj', sp: 70, burn: 1 }, mv: [
      { n: 'Fire Bullets', t: 'proj', x: 1.7, cd: 5, en: 15, m: 0, sp: 75, cnt: 3, spr: 0.12, burn: 2 },
      { n: 'Flame Pillar', t: 'ring', x: 5, cd: 10, en: 25, m: 25, r: 10, burn: 3 },
      { n: 'Fire Fist', t: 'proj', x: 7, cd: 18, en: 35, m: 75, sp: 55, ex: 9, burn: 3, big: 1 }] },
    { k: 'ice', n: 'Ice', e: '🧊', r: 1, price: 350000, c: 0x93c5fd, c2: 0xe0f2fe, ls: 'spike', elem: 1, m1: { t: 'proj', sp: 70 }, mv: [
      { n: 'Ice Spears', t: 'line', x: 4, cd: 5, en: 15, m: 0, L: 21, w: 5, stun: 1.5 },
      { n: 'Glacial Ring', t: 'ring', x: 5, cd: 10, en: 25, m: 25, r: 11, stun: 2 },
      { n: 'Ice Surf', t: 'dash', x: 6, cd: 14, en: 30, m: 75, d: 32, stun: 1 }] },
    { k: 'sand', n: 'Sand', e: '⏳', r: 1, price: 420000, c: 0xd6b98c, c2: 0xfef3c7, ls: 'spike', elem: 1, m1: { t: 'line', L: 9, w: 4 }, mv: [
      { n: 'Desert Sword', t: 'line', x: 4.5, cd: 5, en: 15, m: 0, L: 23, w: 4 },
      { n: 'Sand Tornado', t: 'aim', x: 5.5, cd: 10, en: 25, m: 25, r: 10, pull: 1 },
      { n: 'Sandstorm', t: 'ring', x: 7, cd: 18, en: 35, m: 75, r: 16 }] },
    { k: 'dark', n: 'Dark', e: '🌑', r: 2, price: 500000, c: 0x4c1d95, c2: 0x111827, ls: 'beam', elem: 1, m1: { t: 'line', L: 9, w: 4 }, mv: [
      { n: 'Black Hole', t: 'aim', x: 5, cd: 6, en: 18, m: 0, r: 11, pull: 1, stun: 1.2 },
      { n: 'Dark Vortex', t: 'ring', x: 6, cd: 10, en: 25, m: 25, r: 12 },
      { n: 'Liberation', t: 'line', x: 8, cd: 18, en: 35, m: 75, L: 29, w: 8 }] },
    { k: 'light', n: 'Light', e: '✨', r: 2, price: 650000, c: 0xfef08a, c2: 0xffffff, ls: 'beam', elem: 1, fast: 1.15, m1: { t: 'proj', sp: 140 }, mv: [
      { n: 'Light Beams', t: 'proj', x: 1.6, cd: 5, en: 15, m: 0, sp: 150, cnt: 5, spr: 0.08 },
      { n: 'Light Kick', t: 'dash', x: 6, cd: 9, en: 25, m: 25, d: 30 },
      { n: 'Sky Beam', t: 'aim', x: 8, cd: 18, en: 35, m: 75, r: 11 }] },
    { k: 'magma', n: 'Magma', e: '🌋', r: 2, price: 850000, c: 0xea580c, c2: 0x7f1d1d, ls: 'breath', elem: 1, m1: { t: 'proj', sp: 60, burn: 1 }, mv: [
      { n: 'Magma Fist', t: 'proj', x: 5, cd: 6, en: 18, m: 0, sp: 60, ex: 7, burn: 3, big: 1 },
      { n: 'Magma Rain', t: 'aim', x: 6.5, cd: 10, en: 25, m: 25, r: 13, burn: 3 },
      { n: 'Volcanic Eruption', t: 'ring', x: 8.5, cd: 18, en: 35, m: 75, r: 15, burn: 4 }] },
    { k: 'quake', n: 'Quake', e: '🌊', r: 3, price: 1000000, c: 0xe5e7eb, c2: 0x93c5fd, ls: 'beam', m1: { t: 'line', L: 10, w: 5, kb: 8 }, mv: [
      { n: 'Quake Punch', t: 'line', x: 6, cd: 6, en: 18, m: 0, L: 25, w: 9, kb: 22 },
      { n: 'Shockwave Ring', t: 'ring', x: 7.5, cd: 10, en: 25, m: 25, r: 16, kb: 24 },
      { n: 'Tsunami Quake', t: 'line', x: 10, cd: 18, en: 40, m: 75, L: 45, w: 14, kb: 30 }] },
    { k: 'buddha', n: 'Buddha', e: '🧘', r: 3, price: 1200000, c: 0xfacc15, c2: 0xfef9c3, ls: 'beam', m1: { t: 'line', L: 9, w: 5 }, mv: [
      { n: 'Transform', t: 'trans', x: 0, cd: 45, en: 30, m: 0 },
      { n: 'Impact', t: 'ring', x: 7, cd: 10, en: 25, m: 25, r: 13, kb: 20 },
      { n: 'Palm Strike', t: 'line', x: 9, cd: 16, en: 35, m: 75, L: 21, w: 11, kb: 26 }] },
    { k: 'dough', n: 'Dough', e: '🍩', r: 4, price: 2800000, c: 0xfde68a, c2: 0xb45309, ls: 'beam', m1: { t: 'proj', sp: 80 }, mv: [
      { n: 'Fist Fusillade', t: 'proj', x: 2, cd: 6, en: 18, m: 0, sp: 85, cnt: 6, spr: 0.22 },
      { n: 'Rolling Donut', t: 'dash', x: 8, cd: 10, en: 25, m: 25, d: 36, kb: 18 },
      { n: 'Piercing Mochi', t: 'line', x: 12, cd: 18, en: 40, m: 75, L: 36, w: 5 }] },
    { k: 'dragon', n: 'Dragon', e: '🐉', r: 4, price: 3500000, c: 0xdc2626, c2: 0xf97316, ls: 'breath', m1: { t: 'proj', sp: 75, burn: 1 }, mv: [
      { n: 'Heatwave Breath', t: 'line', x: 7, cd: 6, en: 18, m: 0, L: 27, w: 10, burn: 3 },
      { n: 'Dragon Rush', t: 'dash', x: 9, cd: 10, en: 25, m: 25, d: 40, burn: 2 },
      { n: 'Fire Shower', t: 'aim', x: 13, cd: 18, en: 40, m: 75, r: 15, burn: 4 }] },
  ];
  const FI = Object.fromEntries(FR.map((f, i) => [f.k, i]));
  const SW = [
    { k: 'katana', n: 'Katana', e: '🗡️', dmg: 14, price: 1000, at: 0, c: 0xe5e7eb, h: 0x111827 },
    { k: 'cutlass', n: 'Cutlass', e: '⚔️', dmg: 16, price: 1000, at: 0, c: 0xd1d5db, h: 0xb45309 },
    { k: 'dual', n: 'Dual Katana', e: '🗡️', dmg: 24, price: 12000, at: 2, c: 0xf1f5f9, h: 0x7f1d1d },
    { k: 'mace', n: 'Iron Mace', e: '🔨', dmg: 32, price: 25000, at: 3, c: 0x6b7280, h: 0x44403c, mace: 1 },
    { k: 'triple', n: 'Triple Katana', e: '🗡️', dmg: 42, price: 60000, at: 5, c: 0xffffff, h: 0x1e3a8a },
    { k: 'saber', n: 'Saber', e: '🌟', dmg: 52, price: -1, at: -1, c: 0x7dd3fc, h: 0xfacc15 },
  ];
  const SWI = Object.fromEntries(SW.map((s, i) => [s.k, i]));
  const SWMV = [{ n: 'Dash Slash', t: 'dash', x: 2.8, cd: 6, en: 10, d: 18 }, { n: 'Spin Slash', t: 'ring', x: 3.5, cd: 10, en: 15, r: 9, kb: 10 }];
  const AB = {
    geppo: { n: 'Geppo (Sky Jump)', e: '🦘', price: 10000, at: 0, d: 'Jump again in the air, twice.' },
    buso: { n: 'Buso Haki', e: '🖤', price: 25000, at: 1, d: 'Press J: your fists and blade hit 25% harder.' },
    soru: { n: 'Soru (Flash Step)', e: '💨', price: 100000, at: 2, d: 'Press R: dash forward in a flash.' },
  };
  const fmt = (n) => '$' + Math.floor(n).toLocaleString('en-US');
  // the fruit dealer's stock: four fruits, new every ten minutes (the same for everyone)
  const pickFruit = (r) => { let t = r() * RAR.reduce((a, q) => a + q.w * FR.filter((f) => f.r === RAR.indexOf(q)).length, 0); for (let i = 0; i < FR.length; i++) { t -= RAR[FR[i].r].w; if (t <= 0) return i; } return 0; };
  const STOCK_MS = 10 * 60 * 1000;
  const stock = () => { const r = mulberry(Math.floor(Date.now() / STOCK_MS) * 7919 + 13), out = new Set(); for (let k = 0; k < 40 && out.size < 4; k++) out.add(pickFruit(r)); return [...out]; };
  const islandAt = (x, z, m = 12) => ISL.findIndex((I) => Math.abs(x - I.x) < I.w / 2 + m && Math.abs(z - I.z) < I.d / 2 + m);

  /* ---------------- looks ---------------- */
  const SPH = new THREE.SphereGeometry(1, 12, 8), CONE = new THREE.ConeGeometry(1, 1, 6), TORUS = new THREE.TorusGeometry(1, 0.12, 6, 28), DISC = new THREE.CircleGeometry(1, 28), CYL = new THREE.CylinderGeometry(1, 1, 1, 14, 1, true);
  const MC = new Map(), mat = (c) => { if (!MC.has(c)) MC.set(c, new THREE.MeshLambertMaterial({ color: c })); return MC.get(c); };
  function swordModel(i) {
    const S = SW[i] || SW[0], g = new THREE.Group(), b = (c, sx, sy, sz, x, y, z) => { const o = new THREE.Mesh(BOX, mat(c)); o.scale.set(sx, sy, sz); o.position.set(x, y, z); g.add(o); return o; };
    if (S.mace) { b(S.h, 0.2, 0.2, 2.2, 0, 0, -0.9); b(S.c, 0.8, 0.8, 1.0, 0, 0, -2.4); }
    else { b(S.h, 0.2, 0.22, 0.9, 0, 0, 0.05); b(0xfacc15, 0.6, 0.12, 0.14, 0, 0, -0.42); b(S.c, 0.08, 0.3, 3.0, 0, 0, -2.0); }
    return g;
  }
  function fruitModel(i, s = 1) {
    const F = FR[i] || FR[0], g = new THREE.Group();
    const m = new THREE.Mesh(SPH, new THREE.MeshLambertMaterial({ color: F.c, emissive: F.c, emissiveIntensity: 0.35 })); m.scale.setScalar(0.9 * s); g.add(m);
    for (let k = 0; k < 4; k++) { const st = new THREE.Mesh(BOX, mat(F.c2)); st.scale.set(0.08 * s, 0.9 * s, 0.3 * s); st.rotation.y = (k * Math.PI) / 4; g.add(st); } // swirls
    const lf = new THREE.Mesh(BOX, mat(0x16a34a)); lf.scale.set(0.5 * s, 0.1 * s, 0.25 * s); lf.position.y = 0.95 * s; lf.rotation.z = 0.5; g.add(lf);
    return g;
  }
  function boatModel() {
    const g = new THREE.Group(), b = (c, sx, sy, sz, x, y, z) => { const o = new THREE.Mesh(BOX, mat(c)); o.scale.set(sx, sy, sz); o.position.set(x, y, z); g.add(o); return o; };
    b(0x7c4a1e, 4.6, 1.3, 10, 0, -0.65, 0); b(0x5b3714, 4.8, 0.4, 10.2, 0, 0.05, 0); b(0xa16207, 3.8, 0.12, 9, 0, 0.1, 0); b(0x7c4a1e, 2.6, 1.2, 1.4, 0, -0.5, -5.4);
    b(0x5b3714, 0.35, 8, 0.35, 0, 4, 1); const s = b(0xf8fafc, 0.1, 5, 4.2, 0, 4.6, 1); s.rotation.y = Math.PI / 2;
    b(0xdc2626, 0.1, 1, 1.6, 0, 8.2, 1.4);
    return g;
  }

  // an island's blocks drawn one by one would be hundreds of draw calls: they're merged into a mesh or two (studded,
  // plain); the blocks stay in the list of things you bump into, unseen
  const HIDDEN = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial()); HIDDEN.visible = false;
  const FACES = [
    [[1, 0, 0], [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], 2, 1], [[-1, 0, 0], [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], 2, 1],
    [[0, 0, 1], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], 0, 1], [[0, 0, -1], [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], 0, 1],
    [[0, 1, 0], [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], 0, 2], [[0, -1, 0], [[1, 0, 1], [0, 0, 1], [0, 0, 0], [1, 0, 0]], 0, 2],
  ];
  function bake(list) {
    const out = [], col = new THREE.Color();
    list = list.filter((p) => p.m && p.m.visible && p.alpha == null && !p.neon && !p.map && !p.stripes && Math.min(p.sx, p.sy, p.sz) > 0.6);
    for (const plain of [false, true]) {
      const L = list.filter((p) => !!p.plain === plain), n = L.length; if (!n) continue;
      const pos = new Float32Array(n * 72), nor = new Float32Array(n * 72), clr = new Float32Array(n * 72), uv = new Float32Array(n * 48), idx = new Uint32Array(n * 36);
      let v = 0, u = 0, ii = 0;
      for (const p of L) {
        const b = [p.x - p.sx / 2, p.y - p.sy / 2, p.z - p.sz / 2, p.x + p.sx / 2, p.y + p.sy / 2, p.z + p.sz / 2], sz = [p.sx, p.sy, p.sz]; col.set(p.c);
        for (const [nn, cs, ua, va] of FACES) {
          const base = v / 3;
          cs.forEach((c, q) => {
            pos[v] = c[0] ? b[3] : b[0]; pos[v + 1] = c[1] ? b[4] : b[1]; pos[v + 2] = c[2] ? b[5] : b[2];
            nor[v] = nn[0]; nor[v + 1] = nn[1]; nor[v + 2] = nn[2]; clr[v] = col.r; clr[v + 1] = col.g; clr[v + 2] = col.b; v += 3;
            uv[u++] = q === 1 || q === 2 ? sz[ua] / 2 : 0; uv[u++] = q >= 2 ? sz[va] / 2 : 0;
          });
          idx[ii++] = base; idx[ii++] = base + 1; idx[ii++] = base + 2; idx[ii++] = base; idx[ii++] = base + 2; idx[ii++] = base + 3;
        }
        place.remove(p.m); p.m.material.dispose(); p.m = HIDDEN;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      g.setAttribute('color', new THREE.BufferAttribute(clr, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, map: plain ? null : tex(1, 1) }));
      place.add(m); out.push(m);
    }
    return out;
  }

  const BF = {
    id: 'fruits', code: 'bf', genre: 'Adventure', rank: 0.002, name: 'Blox Fruits', emoji: '🍎', max: 12, stat: 'Level', killY: -60, camDist: 20, noReset: true, respawnDelay: 3500,
    land: { theme: 'beach', mode: 'sea', sea: SEA, box: [-200, -1720, 200, 80], bands: [[-160, 1e5, 'meadow'], [-480, -160, 'forest'], [-800, -480, 'beach'], [-1120, -800, 'desert'], [-1440, -1120, 'snow'], [-1e5, -1440, 'beach']], under: ISL.map((I) => [I.x - I.w / 2 - 8, I.z - I.d / 2 - 8, I.x + I.w / 2 + 8, I.z + I.d / 2 + 8]), extras: ['boats'] },
    color: 'linear-gradient(135deg,#0ea5e9,#f97316 55%,#dc2626)',
    desc: 'Sail between six islands, defeat bandits, monkeys, pirates, snowmen and marines (and their bosses), take quests and level up. Eat a Blox Fruit for its powers: Bomb, Flame, Ice, Light, Magma, Quake, Buddha, Dough, Dragon and more, each with three moves you unlock with mastery. Buy swords, Geppo, Buso Haki and Soru, get a boat — but fruit users can’t swim! Co-op with everyone on the server.',
    welcome: 'Talk to the ❗ Quest Giver (E) and defeat Bandits! Click to attack · 1–3 tools · Z X C fruit moves · K stats.',
    build() {
      sky('#38bdf8', '#e0f2fe');
      const blk = (x, y0, z, sx, sy, sz, c, o) => part(Object.assign({ x, y: y0 + sy / 2, z, sx, sy, sz, c }, o || {}));
      const sign = (t, x, y, z, o) => { const l = label(t, Object.assign({ size: 1.3 }, o || {})); l.position.set(x, y, z); place.add(l); return l; };
      // under the sea: a floor you can't see, so you can swim (and wade ashore up the shallows)
      const fl = part({ x: 0, y: FLOOR - 1, z: -800, sx: 1500, sy: 2, sz: 2300, c: 0x1e3a5f, alpha: 0, plain: true }); fl.m.visible = false;
      this.npcDefs = []; this.stalls = []; this.trees = []; this.docks = []; this.isMeshes = []; this.ibox = [];
      ISL.forEach((I, ii) => {
        const n0 = parts.length, X = I.x, Z = I.z, hw = I.w / 2, hd = I.d / 2, r = mulberry(ii * 977 + 31);
        // the island: underwater shelf, beach, then the top
        blk(X, -4.1, Z, I.w + 40, 1.9, I.d + 40, 0xc9a86a, { plain: true });
        blk(X, -2.2, Z, I.w + 18, 2, I.d + 18, I.th === 'snow' ? 0xe2e8f0 : 0xf2d38a);
        blk(X, -0.2, Z, I.w, 1.8, I.d, I.top);
        // the dock, out to the north (towards the next island)
        const dz0 = Z - hd, dz1 = dz0 - 30;
        blk(X - 14, GY - 0.6, (dz0 + dz1) / 2 - 4, 6, 0.6, 30, 0x8b5a2b);
        for (const pz of [dz0 - 10, dz0 - 20, dz1 + 1]) for (const px of [X - 16.6, X - 11.4]) blk(px, -4, pz - 4, 0.7, GY + 3.4, 0.7, 0x5b3714);
        this.docks[ii] = { x: X - 14, z: dz0 + 8, boat: [X - 4, dz1 - 2] };
        const n1 = parts.length; // (the island itself and its dock are seen from far off; what's on it only up close)
        // the town: stalls along the north edge, houses behind
        const stall = (k, txt, dx, col) => {
          const x = X + dx, z = Z - hd + 22;
          blk(x, GY, z, 7, 2.4, 2.6, col); blk(x - 3.2, GY, z + 1.5, 0.4, 6, 0.4, 0x5b3714); blk(x + 3.2, GY, z + 1.5, 0.4, 6, 0.4, 0x5b3714);
          blk(x, GY + 6, z + 1.5, 8, 0.5, 4.5, col, { plain: true });
          sign(txt, x, GY + 9.2, z + 1, { size: 1.25, color: '#fff' });
          this.stalls.push({ k, isl: ii, x, z: z - 3, kx: x, kz: z + 2.5 });
        };
        stall('quest', '❗ Quest Giver', -36, 0xf59e0b);
        if (ii === 0) { stall('fruit', '🍎 Fruit Dealer', -12, 0xdc2626); stall('gacha', '🎲 Blox Fruit Gacha', 8, 0x7c3aed); }
        if (SW.some((s) => s.at === ii)) stall('sword', '⚔️ Sword Dealer', ii === 0 ? 28 : -12, 0x334155);
        if (Object.values(AB).some((a) => a.at === ii)) stall('ability', '🥋 Ability Teacher', ii === 0 ? 46 : 12, 0x0f766e);
        this.stalls.push({ k: 'captain', isl: ii, x: X - 14, z: dz0 - 14, kx: X - 15.5, kz: dz0 - 18 });
        sign('⚓ Captain', X - 15.5, GY + 6.5, dz0 - 18, { size: 1.1 });
        sign(I.n + (I.lv ? `  ·  Lv. ${I.lv}+` : ''), X, GY + 20, Z - hd - 2, { size: 3, color: '#fde68a' }).userData.far = 1;
        // houses
        const house = (x, z, w, h, d, wall, roof) => { blk(x, GY, z, w, h, d, wall); blk(x, GY + h, z, w + 1.2, 0.8, d + 1.2, roof); blk(x, GY + h + 0.8, z, w * 0.6, 1.2, d * 0.6, roof); part({ x, y: GY + 1.6, z: z - d / 2 - 0.06, sx: 1.8, sy: 3.2, sz: 0.1, c: 0x3f2a14, plain: true, solid: false }); };
        const wallC = [0xf5f5f4, 0x8b5a2b, 0x7c4a1e, 0xd6b98c, 0xe0f2fe, 0xd1d5db][ii], roofC = [0xb91c1c, 0x14532d, 0x44403c, 0xb45309, 0x60a5fa, 0x1e3a8a][ii];
        for (const [hx, hz] of [[-48, -hd + 34], [-24, -hd + 36], [26, -hd + 34], [48, -hd + 32]]) if (Math.abs(hx) < hw - 6) house(X + hx, Z + hz, 9, 6, 8, wallC, roofC);
        // trees (fruits turn up at their feet)
        const tree = (x, z) => {
          if (I.th === 'desert') { blk(x, GY, z, 1.2, 6, 1.2, 0x3f8f3f); blk(x - 1.2, GY + 2.5, z, 1.4, 0.8, 0.8, 0x3f8f3f); blk(x - 1.6, GY + 2.5, z, 0.8, 2.4, 0.8, 0x3f8f3f); blk(x + 1.2, GY + 3.2, z, 1.4, 0.8, 0.8, 0x3f8f3f); blk(x + 1.6, GY + 3.2, z, 0.8, 2, 0.8, 0x3f8f3f); }
          else if (I.th === 'snow') { blk(x, GY, z, 1, 3, 1, 0x5b3714); for (const [y, s] of [[3, 5], [5.2, 3.8], [7.2, 2.4]]) blk(x, GY + y, z, s, 2.2, s, 0x1f5134, { solid: false }); blk(x, GY + 9.4, z, 1.6, 0.6, 1.6, 0xffffff, { solid: false }); }
          else if (I.th === 'beach') { blk(x, GY, z, 0.9, 9, 0.9, 0x8b6b3a); blk(x, GY + 9, z, 7, 0.4, 1.4, 0x2f9e44, { solid: false }); blk(x, GY + 9, z, 1.4, 0.4, 7, 0x2f9e44, { solid: false }); }
          else { const tall = I.th === 'forest' ? 1.6 : 1; blk(x, GY, z, 1.3, 5 * tall, 1.3, 0x6b4423); blk(x, GY + 5 * tall, z, 6, 4.5, 6, I.th === 'forest' ? 0x1f6b2c : 0x3fa34d, { solid: false }); }
          this.trees.push([ii, x + 2.2, z + 2.2]);
        };
        for (let k = 0, made = 0; k < 60 && made < (I.th === 'forest' ? 16 : 10); k++) {
          const x = X + (r() - 0.5) * (I.w - 12), z = Z + (r() - 0.5) * (I.d - 12);
          if (z < Z - hd + 44 && Math.abs(x - X) < hw) continue; // not in town
          if (EN.some((e) => e.isl === ii && Math.hypot(x - X - e.at[0], z - Z - e.at[1]) < (e.boss ? 12 : 9))) continue;
          tree(x, z); made++;
        }
        // something each island's known for
        if (ii === 1) { for (const [x, z, h] of [[-50, 40, 7], [-44, 40, 5], [50, -4, 6]]) blk(X + x, GY, Z + z, 4, h, 4, 0x6b7280); blk(X, GY, Z + 52, 16, 3, 6, 0x57534e); blk(X, GY + 3, Z + 52, 10, 3, 4, 0x57534e); }
        if (ii === 2) { blk(X + 52, -2, Z + 30, 10, 6, 26, 0x5b3714); blk(X + 52, 4, Z + 30, 0.6, 12, 0.6, 0x3f2a14); blk(X + 52, 10, Z + 30, 0.1, 6, 8, 0x111827, { solid: false }); for (const [x, z] of [[-8, 20], [10, 30], [-20, 36]]) blk(X + x, GY, Z + z, 1.6, 2, 1.6, 0x7c4a1e); }
        if (ii === 3) { for (let k = 0; k < 5; k++) blk(X + 46, GY + k * 3, Z + 36, 22 - k * 4.4, 3, 22 - k * 4.4, 0xd4a35a); for (const [x, z] of [[-50, 44], [-40, 48]]) blk(X + x, GY, Z + z, 6, 4, 6, 0xc08a3e); }
        if (ii === 4) { for (const [x, z] of [[-46, 44], [46, 46]]) { blk(X + x, GY, Z + z, 7, 3.5, 7, 0xf8fafc); blk(X + x, GY + 3.5, Z + z, 4, 1.5, 4, 0xf8fafc); } blk(X, GY, Z + 6, 14, 0.2, 10, 0xbfe3f5, { plain: true, solid: false }); }
        if (ii === 5) {
          for (const s of [-1, 1]) { blk(X + s * (hw - 4), GY, Z + 22, 3, 10, 40, 0x6b7280); blk(X + s * (hw - 4), GY, Z + 44, 7, 15, 7, 0x4b5563); }
          blk(X, GY, Z + hd - 6, I.w - 30, 10, 3, 0x6b7280); blk(X, GY + 15, Z + hd - 6, 0.5, 8, 0.5, 0x374151); blk(X + 2.2, GY + 20, Z + hd - 6, 4, 2.6, 0.1, 0x1d4ed8, { solid: false });
          for (const x of [-20, 0, 20]) blk(X + x, GY, Z + hd - 12, 2, 1.6, 4, 0x111827);
        }
        // the enemies' spots (seeded, so everyone has the same)
        EN.forEach((e, t) => {
          if (e.isl !== ii) return;
          for (let k = 0; k < e.n0; k++) {
            const a = (k / e.n0) * Math.PI * 2 + r() * 0.5, d = e.boss ? 0 : 6 + r() * 12;
            this.npcDefs.push({ id: this.npcDefs.length, t, isl: ii, x: +(X + e.at[0] + Math.cos(a) * d).toFixed(1), z: +(Z + e.at[1] + Math.sin(a) * d).toFixed(1) });
          }
        });
        this.ibox[ii] = parts.slice(n0).filter((p) => p.solid && p.y + p.sy / 2 > GY + 0.3).map(boxOf);
        bake(parts.slice(n0, n1));
        this.isMeshes[ii] = bake(parts.slice(n1)).concat(parts.slice(n1).filter((p) => p.m !== HIDDEN).map((p) => p.m));
      });
      for (const l of place.children) if (l.isSprite && !l.userData.far) { const ii = islandAt(l.position.x, l.position.z, 40); if (ii >= 0) this.isMeshes[ii].push(l); }
    },
    pres() { return { lv: 1, tq: [], fx: null, bt: null, hd: 'combat', bz: 0 }; },
    async enter() {
      Object.assign(this, { H: null, lastG: null, gSeen: null, g: null, evN: null, q: [], qn: 0, tool: 'combat', cds: {}, combo: 0, m1At: 0, hp: 100, en: 100, hurtAt: 0, buso: false, buddhaT: 0, riding: false, boat: null, boatM: null, airJ: 0, wasGround: true, dash: null, slam: null, fxN: 0, fx: [], projs: [], na: new Map(), fruitsM: new Map(), oBoats: new Map(), fxSeen: new Map(), held: new Map(), keepers: [], swingT: 0, mouse: null, hold: null, saveT: 0, dirty: false, waterMsgAt: 0, cullAt: 0, wasDead: false, bigT: 0, jumpWas: false, vis: -1 });
      this.seen = new Map(); this.ns = new Map(); this.tok = new Map(); this.peerSwing = new Map();
      $('#xhud').insertAdjacentHTML('beforeend', '<div id="bfV" class="glass"></div><div id="bfQ" class="glass" hidden></div><div id="bfHurt"></div><div id="bfDmg"></div><div id="bfBig"></div>');
      $('#bfV').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) { sfx('click'); this.toggle(b.dataset.v); } });
      $('#xbar').classList.add('bf');
      // the people behind the stalls
      const looks = { quest: [1, 3, 2, 5, 1, 0], fruit: [0, 1, 4, 11, 1, 0], gacha: [2, 4, 6, 7, 8, 0], sword: [3, 6, 2, 15, 4, 0], ability: [0, 2, 3, 23, 0, 0], captain: [1, 0, 6, 12, 0, 0] };
      for (const s of this.stalls) { const L = looks[s.k] || looks.quest, a = makeAvatar(okAv([L[0], L[1], L[2], L[3], L[4], L[5], 0, 0, 0, 0]), '', false); a.g.position.set(s.kx, GY, s.kz); a.g.rotation.y = Math.PI; scene.add(a.g); placeShadow(a); this.keepers.push(a); a.isl = s.isl; }
      const sv = await kvGet('bf');
      this.S = Object.assign(this.fresh(), sv && typeof sv === 'object' ? sv : {});
      const S = this.S; S.lv = clamp(S.lv | 0, 1, MAXLV); S.st = Object.assign({ m: 0, d: 0, s: 0, f: 0 }, S.st || {}); S.inv = Array.isArray(S.inv) ? S.inv.filter((i) => FR[i]).slice(0, 8) : []; S.swords = Array.isArray(S.swords) ? S.swords.filter((k) => SW[SWI[k]]) : []; S.vis = Array.isArray(S.vis) && S.vis.length ? S.vis : [0]; S.mas = S.mas || {}; S.ab = S.ab || {};
      if (!FR[S.fruit]) S.fruit = -1;
      questMax('fruits.lv', S.lv); if (S.fruit >= 0) questMax('fruits.eat', 1);
      this.hp = this.maxHp(); this.en = this.maxEn();
      send({ lv: S.lv, hd: 'combat' });
      this.drawBar();
    },
    fresh() { return { lv: 1, xp: 0, beli: 0, pts: 0, st: { m: 0, d: 0, s: 0, f: 0 }, fruit: -1, inv: [], mas: {}, swords: [], sword: '', ab: {}, boat: false, vis: [0], home: 0, q: null, gachaAt: 0, kills: 0 }; },
    leave() {
      for (const n of this.na.values()) this.dropNpc(n);
      for (const a of this.keepers || []) dropAvatar(a);
      for (const f of this.fx || []) this.endFx(f);
      for (const p of this.projs || []) { scene.remove(p.m); p.m.material.dispose(); }
      for (const m of this.fruitsM.values()) scene.remove(m.g);
      for (const b of this.oBoats.values()) scene.remove(b);
      for (const h of this.held.values()) if (h.m && h.m.parent) h.m.parent.remove(h.m);
      if (this.boatM) scene.remove(this.boatM);
      this.saveNow();
      Object.assign(this, { na: new Map(), keepers: [], fx: [], projs: [], fruitsM: new Map(), oBoats: new Map(), held: new Map(), boatM: null, boat: null, riding: false });
      if (me) me.g.scale.setScalar(1);
      $('#xbar').classList.remove('bf');
    },
    S: null,
    saveNow() { if (this.S) kvSet('bf', this.S); this.dirty = false; },
    // where you come back: the dock of the island you were last on
    spawn() {
      const S = this.S, i = S && ISL[S.home] ? S.home : 0, d = this.docks[i];
      return [d.x + (Math.random() - 0.5) * 4, GY + 0.5, d.z, Math.PI];
    },

    /* ---------------- you: health, energy, damage ---------------- */
    maxHp() { const S = this.S; return S ? Math.round(100 + S.lv * 12 + S.st.d * 14) : 100; },
    maxEn() { const S = this.S; return S ? Math.round(100 + S.lv * 2) : 100; },
    meleeDmg() { const S = this.S; return (10 + S.lv * 1.0 + S.st.m * 0.8) * (this.buso ? 1.25 : 1) * (this.buddhaT > 0 ? 1.3 : 1); },
    swordDmg() { const S = this.S, W = SW[SWI[S.sword]] || SW[0]; return (W.dmg + S.lv * 0.9 + S.st.s * 0.9) * (this.buso ? 1.25 : 1) * (this.buddhaT > 0 ? 1.3 : 1); },
    fruitDmg() { const S = this.S; return (12 + S.lv * 1.2 + S.st.f * 1.0) * (this.buddhaT > 0 ? 1.3 : 1); },
    fruit() { return this.S && FR[this.S.fruit] ? FR[this.S.fruit] : null; },
    mastery() { const F = this.fruit(); return F ? this.S.mas[F.k] | 0 : 0; },
    inWater() { return !this.riding && P.y < SEA - 1.2 && !P.dead; },
    speed() {
      if (this.inWater()) return 10;
      const F = this.fruit();
      return 16 * (F && F.fast ? F.fast : 1) * (this.buddhaT > 0 ? 1.1 : 1);
    },
    jumpPower() { const F = this.fruit(); return 50 * (F && F.jump ? F.jump : 1); },
    gravity() { return this.riding ? 0 : 196.2; },
    // sailing (the boat drives you) and dashing (a move or Soru carries you)
    get drive() { return this.riding || this.dash ? this.driveFn : undefined; },
    driveFn(dt, f, r) {
      if (this.dash) { const d = this.dash; return [d.dx * d.sp, d.dz * d.sp, Math.atan2(-d.dx, -d.dz)]; }
      const B = this.boat; B.sp += ((f > 0.1 ? 42 : f < -0.1 ? -12 : 0) - B.sp) * Math.min(1, dt * (f ? 1.2 : 0.6));
      B.yaw -= r * dt * (0.8 + Math.min(1, Math.abs(B.sp) / 30) * 0.9);
      return [-Math.sin(B.yaw) * B.sp, -Math.cos(B.yaw) * B.sp, B.yaw];
    },
    statOf(pr, isMe) { return isMe ? (this.S ? this.S.lv : 1) : +pr.lv || 1; },
    sortKey(pr, isMe) { return this.statOf(pr, isMe); },

    /* ---------------- the host: enemies, hits, fruits ---------------- */
    adopt() {
      const g = this.lastG;
      this.ns = new Map(); this.tok = new Map(); this.seen = new Map();
      for (const p of players()) if (!p.me && Array.isArray(p.pr.tq)) this.seen.set(p.peer, { t: p.pr.t, n: Math.max(0, ...p.pr.tq.map((r) => (Array.isArray(r) ? +r[0] || 0 : 0))) });
      const H = { gs: 0, left: 0, n: [], fr: g && Array.isArray(g.fr) ? g.fr.slice() : [], ev: (g && g.ev) || [], nf: g ? g.nf | 0 : 0, frT: g ? +g.frT || 90 : 90 };
      this.evSeq = Math.max(this.evSeq || 0, ...H.ev.map((e) => e[0]));
      for (const q of (g && g.n) || []) { const d = this.npcDefs[q[0]]; if (d) this.ns.set(d.id, Object.assign(this.newNpc(d), { x: q[2], z: q[3], yaw: q[4], hp: (npcHp(EN[d.t]) * q[5]) / 100 })); }
      return H;
    },
    newNpc(d) { const e = EN[d.t]; return { id: d.id, t: d.t, isl: d.isl, hx: d.x, hz: d.z, x: d.x, z: d.z, yaw: Math.random() * 6.28, hp: npcHp(e), max: npcHp(e), tgt: null, atkT: 0, stun: 0, kbx: 0, kbz: 0, burn: null, dead: 0, wT: Math.random() * 4, wx: d.x, wz: d.z, by: {}, slamT: 6, slam: null, mv: 0, atk: 0 }; },
    ev(e) { const H = this.H; this.evSeq = (this.evSeq || 0) + 1; H.ev = (H.ev || []).concat([[this.evSeq].concat(e)]).slice(-30); },
    host(dt) {
      const t = performance.now(), H = this.H, pl = this.pl = players(); // (dt is real time, in steps of 0.1 s at most)
      for (const p of pl) {
        if (p.me) continue;
        const seen = this.seen.get(p.peer) || { t: 0, n: 0 };
        if (p.pr.t !== seen.t) { seen.t = p.pr.t; seen.n = 0; }
        for (const r of Array.isArray(p.pr.tq) ? p.pr.tq : []) { if (!Array.isArray(r) || !(r[0] > seen.n)) continue; seen.n = r[0]; this.apply(p.peer, r.slice(1)); }
        this.seen.set(p.peer, seen);
      }
      // which islands have someone near (only those are run)
      const act = ISL.map((I) => pl.some((p) => Math.abs(p.x - I.x) < I.w / 2 + 160 && Math.abs(p.z - I.z) < I.d / 2 + 160));
      this.step(dt, pl, act);
      // a fruit turns up under a tree every so often
      H.frT -= dt;
      if (H.frT <= 0) {
        H.frT = 240 + Math.random() * 120;
        if (H.fr.length < 3 && this.trees.length) { const tr = this.trees[Math.floor(Math.random() * this.trees.length)], fi = pickFruit(Math.random); H.nf = (H.nf | 0) + 1; H.fr.push([H.nf, fi, +tr[1].toFixed(1), +tr[2].toFixed(1), Date.now()]); this.ev(['fs', tr[0]]); }
      }
      H.fr = H.fr.filter((f) => Date.now() - f[4] < 20 * 60 * 1000);
      if (t - (this.sentAt || 0) > 150) {
        this.sentAt = t;
        H.n = [];
        for (const N of this.ns.values()) if (!N.dead && act[N.isl]) H.n.push([N.id, N.t, +N.x.toFixed(1), +N.z.toFixed(1), +N.yaw.toFixed(2), Math.max(1, Math.round((N.hp / N.max) * 100)), (N.mv ? 1 : 0) | (N.atk > 0 ? 2 : 0) | (N.stun > 0 ? 4 : 0) | (N.burn ? 8 : 0)]);
        hostSend(this);
      }
    },
    step(dt, pl, act) {
      const now = performance.now() / 1000;
      // islands someone's on get their enemies (those nobody's near are left at home, healed)
      for (const d of this.npcDefs) if (act[d.isl] && !this.ns.has(d.id)) this.ns.set(d.id, this.newNpc(d));
      for (const N of this.ns.values()) {
        if (!act[N.isl]) { if (!N.dead && (N.hp < N.max || N.x !== N.hx)) Object.assign(N, { hp: N.max, x: N.hx, z: N.hz, tgt: null, burn: null, stun: 0 }); continue; }
        const e = EN[N.t];
        if (N.dead) { if (now >= N.dead) Object.assign(N, this.newNpc(this.npcDefs[N.id])); continue; }
        N.atk = Math.max(0, N.atk - dt); N.mv = 0;
        if (N.burn) { N.burn.t -= dt; this.hurtNpc(N, N.burn.dps * dt, N.burn.by, true); if (N.burn && N.burn.t <= 0) N.burn = null; if (N.dead) continue; }
        // knocked back
        if (Math.abs(N.kbx) + Math.abs(N.kbz) > 0.5) { this.npcMove(N, N.kbx * dt, N.kbz * dt); N.kbx *= Math.exp(-dt * 6); N.kbz *= Math.exp(-dt * 6); }
        if (N.stun > 0) { N.stun -= dt; continue; }
        // who it's after: whoever hit it, or anyone who comes close (not in the water); it won't go far from home
        const pos = (id) => pl.find((p) => p.peer === id);
        let T = N.tgt && pos(N.tgt);
        if (T && (T.y < SEA - 1.2 || (T.pr && T.pr.a === 3) || Math.hypot(T.x - N.hx, T.z - N.hz) > 70)) { N.tgt = null; T = null; }
        if (!T) { let bd = e.boss ? 22 : 14; for (const p of pl) { if (p.y < SEA - 1.2 || (p.pr && p.pr.a === 3) || p.y > GY + 12) continue; const d = Math.hypot(p.x - N.x, p.z - N.z); if (d < bd && Math.hypot(p.x - N.hx, p.z - N.hz) < 60) { bd = d; T = p; } } if (T) N.tgt = T.peer; }
        const reach = 3.4 * e.s + 1.2, sp = (e.boss ? 13 : 11) * dt;
        if (T) {
          const dx = T.x - N.x, dz = T.z - N.z, d = Math.hypot(dx, dz) || 1;
          N.yaw = Math.atan2(-dx, -dz);
          if (d > reach) { this.npcMove(N, (dx / d) * sp, (dz / d) * sp); N.mv = 1; }
          N.atkT -= dt;
          if (d <= reach + 0.6 && N.atkT <= 0 && Math.abs(T.y - GY) < 6) { N.atkT = e.boss ? 1.8 : 1.4; N.atk = 0.35; this.npcHit(N, T.peer, npcDmg(e)); }
          // a boss slams the ground now and then: get out of the red circle
          if (e.boss) {
            N.slamT -= dt;
            if (!N.slam && N.slamT <= 0 && d < 14) { N.slam = { x: N.x, z: N.z, t: 1 }; N.slamT = 8; this.ev(['bs', N.id, +N.x.toFixed(1), +N.z.toFixed(1)]); }
            if (N.slam) { N.slam.t -= dt; if (N.slam.t <= 0) { for (const p of pl) if (Math.hypot(p.x - N.slam.x, p.z - N.slam.z) < 10 && Math.abs(p.y - GY) < 6) this.npcHit(N, p.peer, npcDmg(e) * 1.6); N.slam = null; } }
          }
        } else {
          // home, or a little wander
          const hx = N.hx - N.x, hz = N.hz - N.z, hd = Math.hypot(hx, hz);
          if (hd > 3) { this.npcMove(N, (hx / hd) * sp, (hz / hd) * sp); N.mv = 1; N.yaw = Math.atan2(-hx, -hz); if (hd > 30) N.hp = Math.min(N.max, N.hp + N.max * dt * 0.2); }
          else { N.wT -= dt; if (N.wT <= 0) { N.wT = 3 + Math.random() * 5; N.wx = N.hx + (Math.random() - 0.5) * 10; N.wz = N.hz + (Math.random() - 0.5) * 10; } const wx = N.wx - N.x, wz = N.wz - N.z, wd = Math.hypot(wx, wz); if (wd > 1) { this.npcMove(N, (wx / wd) * sp * 0.4, (wz / wd) * sp * 0.4); N.mv = 1; N.yaw = Math.atan2(-wx, -wz); } }
          if (hd < 3) N.hp = Math.min(N.max, N.hp + N.max * dt * 0.1);
        }
      }
    },
    npcMove(N, mx, mz) {
      const I = ISL[N.isl], s = EN[N.t].s, nx = clamp(N.x + mx, I.x - I.w / 2 + 3, I.x + I.w / 2 - 3), nz = clamp(N.z + mz, I.z - I.d / 2 + 3, I.z + I.d / 2 - 3);
      const hit = (x, z) => this.ibox[N.isl].some((b) => x + s > b[0] && x - s < b[3] && z + s > b[2] && z - s < b[5] && b[4] > GY + 0.5 && b[1] < GY + 4);
      if (!hit(nx, nz)) { N.x = nx; N.z = nz; } else if (!hit(nx, N.z)) N.x = nx; else if (!hit(N.x, nz)) N.z = nz;
    },
    npcHit(N, peer, dmg) {
      dmg = Math.round(dmg);
      if (peer === myPeer()) this.takeHit(dmg, N.t); else this.ev(['a', N.id, peer, dmg]);
    },
    hurtNpc(N, dmg, by, quiet) {
      if (N.dead || !(dmg > 0)) return;
      N.hp -= dmg; N.by[by] = (N.by[by] || 0) + dmg;
      if (!N.tgt && !quiet) N.tgt = by;
      if (N.hp <= 0) {
        const e = EN[N.t], help = Object.keys(N.by).filter((p) => p !== by && N.by[p] >= N.max * 0.1);
        N.dead = performance.now() / 1000 + (e.boss ? 60 : 12); N.burn = null;
        this.ev(['k', N.id, by, N.t, help, +N.x.toFixed(1), +N.z.toFixed(1)]);
      }
    },
    // someone asked: a hit, or picking up a fruit
    apply(peer, req) {
      const H = this.H, [op, ...a] = req, p = (this.pl || players()).find((q) => q.peer === peer);
      if (!p) return;
      if (op === 'h') {
        const [id, dmg0, stun, kbx, kbz, bdps, bt] = a, N = this.ns.get(id);
        if (!N || N.dead || !(dmg0 > 0) || Math.hypot(p.x - N.x, p.z - N.z) > 75) return;
        const T = performance.now() / 1000, b = this.tok.get(peer) || { n: 40, t: T }; b.n = Math.min(40, b.n + (T - b.t) * 25); b.t = T; this.tok.set(peer, b);
        if (b.n < 1) return; b.n -= 1;
        const lv = clamp(+(p.pr && p.pr.lv) || 1, 1, MAXLV), dmg = Math.min(dmg0, (12 + lv * 4.5) * 22);
        if (stun > 0) N.stun = Math.max(N.stun, Math.min(2.5, stun) * (EN[N.t].boss ? 0.4 : 1));
        if (Math.abs(kbx) + Math.abs(kbz) > 0) { const k = EN[N.t].boss ? 0.3 : 1; N.kbx = clamp(kbx, -40, 40) * k; N.kbz = clamp(kbz, -40, 40) * k; }
        if (bdps > 0 && bt > 0) N.burn = { dps: Math.min(bdps, dmg * 0.3), t: Math.min(4, bt), by: peer };
        this.hurtNpc(N, dmg, peer);
      } else if (op === 'p') {
        const i = H.fr.findIndex((f) => f[0] === a[0]); if (i < 0) return;
        const f = H.fr[i]; if (Math.hypot(p.x - f[2], p.z - f[3]) > 7) return;
        H.fr.splice(i, 1); this.ev(['fp', f[0], peer, f[1]]);
      }
    },
    ask(op, ...args) {
      if (this.H) return this.apply(myPeer(), [op, ...args]); // the host's own go straight in
      this.q.push([++this.qn, op, ...args]); if (this.q.length > 40) this.q.shift();
      send({ tq: this.q.slice() });
    },

    /* ---------------- you: getting hit ---------------- */
    takeHit(dmg, t) {
      if (P.dead || !this.S) return;
      const F = this.fruit(), k = (1 - Math.min(0.5, this.S.st.d * 0.002)) * (F && F.elem ? 0.75 : 1) * (this.buddhaT > 0 ? 0.6 : 1);
      this.hp -= Math.max(1, Math.round(dmg * k)); this.hurtAt = performance.now();
      const el = $('#bfHurt'); if (el) { el.style.transition = 'none'; el.style.opacity = 0.75; void el.offsetWidth; el.style.transition = ''; el.style.opacity = 0; }
      sfx('hurt', { gap: 150 });
      if (this.hp <= 0) { this.hp = 0; this.riding = false; this.dash = null; die(); toast(`☠️ Defeated${EN[t] ? ' by a ' + EN[t].n : ''}!`, '#fca5a5'); }
    },

    /* ---------------- you: progress ---------------- */
    gain(xp, beli, why) {
      const S = this.S; if (!S) return;
      S.beli = Math.round(S.beli + (beli || 0)); S.xp += Math.round(xp || 0);
      if (xp > 0) this.numAt(P.x, P.y + 7, P.z, `+${Math.round(xp)} XP`, false);
      while (S.lv < MAXLV && S.xp >= need(S.lv)) {
        S.xp -= need(S.lv); S.lv++; S.pts += 3;
        this.big(`LEVEL UP!`, `Lv. ${S.lv} · +3 stat points (K)`);
        sfx('unlock'); puffAt(P.x, P.y + 3, P.z, [0xfde047, 0xffffff, 0x86efac], 26);
        this.hp = this.maxHp(); this.en = this.maxEn();
        earn(1, `reached level ${S.lv} in Blox Fruits`);
        send({ lv: S.lv }); questMax('fruits.lv', S.lv);
      }
      if (S.lv >= MAXLV) S.xp = Math.min(S.xp, need(MAXLV));
      if (why) say(why, '#fde68a');
      this.dirty = true;
    },
    big(t, sub) { const el = $('#bfBig'); if (!el) return; el.innerHTML = `${esc(t)}${sub ? `<small>${esc(sub)}</small>` : ''}`; el.style.opacity = 1; clearTimeout(this.bigTm); this.bigTm = setTimeout(() => (el.style.opacity = 0), 2200); },
    numAt(x, y, z, txt, isBig) {
      const box = $('#bfDmg'); if (!box) return;
      const p = new THREE.Vector3(x, y, z).project(camera); if (p.z > 1) return;
      const el = document.createElement('div'); el.className = 'n' + (isBig ? ' big' : ''); el.textContent = txt;
      el.style.left = ((p.x + 1) / 2 * innerWidth + (Math.random() - 0.5) * 30) + 'px'; el.style.top = ((1 - p.y) / 2 * innerHeight) + 'px';
      box.append(el); while (box.children.length > 16) box.firstChild.remove(); setTimeout(() => el.remove(), 850);
    },

    /* ---------------- you: fighting ---------------- */
    hover(e) { this.mouse = { x: e.x, y: e.y }; },
    press(btn, down) { if (btn !== 0) return; this.hold = down ? { at: performance.now() / 1000 } : null; },
    click(e) { if (e.button === 2) return; this.mouse = { x: e.x, y: e.y }; this.m1(this.aimAt(e.x, e.y)); },
    key(code, down) {
      if (!down) return;
      if (code === 'Digit1') { this.pick('combat'); return true; }
      if (code === 'Digit2') { this.pick('sword'); return true; }
      if (code === 'Digit3') { this.pick('fruit'); return true; }
      if (code === 'KeyZ' || code === 'KeyX' || code === 'KeyC') { this.skill('ZXC'.indexOf(code[3])); return true; }
      if (code === 'KeyK') { this.toggle('statsPanel'); return true; }
      if (code === 'KeyB') { this.toggle('bagPanel'); return true; }
      if (code === 'KeyM') { this.toggle('mapPanel'); return true; }
      if (code === 'KeyJ') { this.toggleBuso(); return true; }
      if (code === 'KeyR') { this.soru(); return true; }
      if (code === 'Space') {
        if (this.riding) { this.riding = false; P.vy = 45; sfx('jump'); return true; }
        if (!P.ground && this.S && this.S.ab.geppo && this.airJ < 2 && !this.inWater() && !P.dead) { this.airJ++; P.vy = 46; puffAt(P.x, P.y, P.z, 0xffffff, 6); sfx('jump', { pitch: 1.3 }); }
      }
    },
    // K, B and M open their panel, and close it again
    toggle(fn) { if (panelOpen() && this.pan === fn) { closePanel(); this.pan = null; } else { this[fn](); this.pan = fn; } },
    pick(t) {
      if (t === 'sword' && !this.S.sword) { toast('⚔️ No sword yet: buy one from a Sword Dealer', '#fca5a5'); sfx('error'); return; }
      if (t === 'fruit' && !this.fruit()) { toast('🍎 You haven’t eaten a Blox Fruit (B: your fruits)', '#fca5a5'); sfx('error'); return; }
      if (t === this.tool) return;
      this.tool = t; sfx('select'); send({ hd: t === 'sword' ? 'sword:' + this.S.sword : t }); this.drawBar();
    },
    canAct() { return !P.dead && !fullOpen() && !this.riding && !!this.S; },
    // where you point: at an enemy (or near one on screen), else the ground
    aimAt(sx, sy) {
      const rc = rayAt(sx, sy), o = rc.ray.origin, d = rc.ray.direction;
      let best = null, bt = 400;
      for (const n of this.npcs()) { const r = n.r, t = rayBox([o.x, o.y, o.z], [d.x, d.y, d.z], [n.x - r, n.y, n.z - r, n.x + r, n.y + 5 * n.s, n.z + r], bt); if (t < bt) { bt = t; best = n; } }
      if (best) return { x: best.x, y: best.y + 2.5 * best.s, z: best.z };
      const pp = pickPlane(sx, sy, P.y + 0.5);
      if (pp && Math.hypot(pp.x - P.x, pp.z - P.z) < 120) return pp;
      return this.autoAim();
    },
    autoAim() {
      const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw);
      let best = null, bs = 1e9;
      for (const n of this.npcs()) { const dx = n.x - P.x, dz = n.z - P.z, d = Math.hypot(dx, dz); if (d > 45) continue; const dot = (dx * fx + dz * fz) / (d || 1); if (dot < (d < 6 ? -0.5 : 0.4)) continue; const s = d * (1.6 - dot); if (s < bs) { bs = s; best = n; } }
      return best ? { x: best.x, y: best.y + 2.5, z: best.z } : { x: P.x + fx * 25, y: P.y + 2, z: P.z + fz * 25 };
    },
    curAim() { return this.mouse && !touchy ? this.aimAt(this.mouse.x, this.mouse.y) : this.autoAim(); },
    // the enemies as you see them
    npcs() { const out = []; for (const [id, n] of this.na) if (!n.dead && n.a) out.push({ id, x: n.a.g.position.x, y: n.a.g.position.y, z: n.a.g.position.z, r: 1.3 * EN[n.t].s, s: EN[n.t].s, t: n.t }); return out; },
    faceTo(x, z) { const y = Math.atan2(-(x - P.x), -(z - P.z)); P.yaw = y; this.faceYaw = y; this.faceT = 0.4; return y; },
    // a hit: show it, ask the host
    hitNpc(n, dmg, o = {}) {
      dmg = Math.max(1, Math.round(dmg));
      this.numAt(n.x, n.y + 5 * n.s, n.z, String(dmg), dmg >= this.fruitDmg() * 5);
      const kb = o.kb || 0, dx = n.x - (o.ox != null ? o.ox : P.x), dz = n.z - (o.oz != null ? o.oz : P.z), l = Math.hypot(dx, dz) || 1, pull = o.pull ? -1 : 1;
      const k = o.pull ? 14 : kb;
      this.ask('h', n.id, dmg, o.stun || 0, +((dx / l) * k * pull).toFixed(1), +((dz / l) * k * pull).toFixed(1), o.burn ? +(dmg * 0.25).toFixed(1) : 0, o.burn || 0);
      const v = this.na.get(n.id); if (v) v.flash = 0.12;
      if (o.fruit) { const F = this.fruit(); if (F) { const t = performance.now(); if (t - (this.masAt || 0) > 250) { this.masAt = t; this.S.mas[F.k] = Math.min(600, (this.S.mas[F.k] | 0) + 1); this.dirty = true; } this.lastFruitHit = t; } }
    },
    // the basic attack (click): fists, the sword, or the fruit's
    m1(aim) {
      if (!this.canAct()) return;
      const t = performance.now() / 1000, tool = this.tool, F = this.fruit();
      const cd = tool === 'sword' ? 0.42 : tool === 'fruit' ? 0.45 : 0.32;
      if (t - this.m1At < cd) return;
      if (t - this.m1At > 1) this.combo = 0;
      this.m1At = t; this.combo = (this.combo + 1) % 3;
      const third = this.combo === 0, a = aim || this.curAim();
      this.faceTo(a.x, a.z); this.swingT = 0.25;
      if (tool === 'fruit' && F) {
        const M = F.m1, dmg = this.fruitDmg() * 0.9;
        this.useMove(F, -1, Object.assign({ x: 1 }, M), a, dmg);
        return;
      }
      const big = this.buddhaT > 0 ? 2 : 1, range = (tool === 'sword' ? 7.5 : 5.5) * big, dmg = (tool === 'sword' ? this.swordDmg() : this.meleeDmg()) * (third ? 1.5 : 1);
      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); let n = 0;
      for (const v of this.npcs()) { const dx = v.x - P.x, dz = v.z - P.z, d = Math.hypot(dx, dz); if (d > range + v.r || Math.abs(v.y - P.y) > 5) continue; if (d > 2 && (dx * fx + dz * fz) / d < 0.25) continue; this.hitNpc(v, dmg, { kb: third ? 9 : 2 }); if (++n >= 4) break; }
      sfx(n ? 'punch' : 'swing', { gap: 60, pitch: tool === 'sword' ? 1.15 : 1 });
      if (tool === 'sword') puffAt(P.x + fx * 3, P.y + 3, P.z + fz * 3, [0xffffff, 0xe5e7eb], 3);
      this.fxN++; send({ fx: [this.fxN, tool === 'sword' ? -2 : -3, 9, +P.x.toFixed(1), +P.y.toFixed(1), +P.z.toFixed(1), +a.x.toFixed(1), +a.y.toFixed(1), +a.z.toFixed(1)] });
    },
    // a move (Z, X, C): the fruit's, or the sword's
    skill(i) {
      if (!this.canAct()) return;
      const t = performance.now() / 1000;
      if (this.tool === 'sword' && this.S.sword) {
        const M = SWMV[i]; if (!M) return;
        const key = 's' + i; if ((this.cds[key] || 0) > t) return;
        if (this.en < M.en) { toast('⚡ Not enough energy', '#fca5a5'); return; }
        this.en -= M.en; this.cds[key] = t + M.cd;
        this.useMove(null, i, M, this.curAim(), this.swordDmg() * M.x, true);
        this.drawBar(); return;
      }
      const F = this.fruit();
      if (this.tool !== 'fruit' || !F) { toast(this.tool === 'combat' ? '👊 Combat has no moves: 2 for your sword, 3 for your fruit' : '🍎 Eat a fruit first (B)', '#fca5a5'); return; }
      const M = F.mv[i]; if (!M) return;
      if (this.mastery() < M.m) { toast(`🔒 ${M.n} unlocks at ${M.m} mastery (you have ${this.mastery()})`, '#fca5a5'); sfx('error'); return; }
      const key = 'f' + i; if ((this.cds[key] || 0) > t) return;
      if (this.en < M.en) { toast('⚡ Not enough energy', '#fca5a5'); return; }
      this.en -= M.en; this.cds[key] = t + M.cd;
      this.useMove(F, i, M, this.curAim(), this.fruitDmg() * M.x);
      this.drawBar();
    },
    // what a move does: the shape it hits, the effects (and what everyone sees)
    useMove(F, mi, M, aim, dmg, sword) {
      const ox = P.x, oy = P.y + 3, oz = P.z;
      let dx = aim.x - ox, dz = aim.z - oz; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      this.faceTo(ox + dx, oz + dz);
      const fx = { kb: M.kb, stun: M.stun, burn: M.burn, pull: M.pull, fruit: !!F };
      const col = F ? F.c : 0xe5e7eb, col2 = F ? F.c2 : 0xffffff;
      if (M.t === 'proj') {
        const cnt = M.cnt || 1;
        for (let k = 0; k < cnt; k++) {
          const a = cnt > 1 ? ((k / (cnt - 1)) - 0.5) * (M.spr || 0.2) * 2 : 0, ca = Math.cos(a), sa = Math.sin(a), ddx = dx * ca - dz * sa, ddz = dx * sa + dz * ca;
          const dy = clamp((aim.y - oy) / l, -0.5, 0.5);
          this.shootProj({ x: ox + ddx * 1.5, y: oy, z: oz + ddz * 1.5, dx: ddx, dy, dz: ddz, sp: M.sp || 70, life: (M.range || 70) / (M.sp || 70), size: M.big ? 1.6 : 0.55, col, col2, dmg, ex: M.ex || 0, o: fx, mine: true });
        }
      } else if (M.t === 'line') {
        for (const v of this.npcs()) { const rx = v.x - ox, rz = v.z - oz, along = rx * dx + rz * dz, off = Math.abs(rx * dz - rz * dx); if (along > -1 && along < M.L + v.r && off < M.w / 2 + v.r && Math.abs(v.y - P.y) < 8) this.hitNpc(v, dmg, Object.assign({ ox, oz }, fx)); }
      } else if (M.t === 'ring' || M.t === 'jump') {
        if (M.t === 'jump') { P.vy = 85; P.ground = null; this.slam = { M, dmg, F, fx }; sfx('jump', { pitch: 0.8 }); this.sendFx(F, mi, sword, ox, oy, oz, aim); return; }
        for (const v of this.npcs()) if (Math.hypot(v.x - ox, v.z - oz) < M.r + v.r && Math.abs(v.y - P.y) < 8) this.hitNpc(v, dmg, Object.assign({ ox, oz }, fx));
      } else if (M.t === 'aim') {
        let ax = aim.x, az = aim.z; const ad = Math.hypot(ax - ox, az - oz); if (ad > 45) { ax = ox + dx * 45; az = oz + dz * 45; }
        for (const v of this.npcs()) if (Math.hypot(v.x - ax, v.z - az) < M.r + v.r) this.hitNpc(v, dmg, Object.assign({ ox: ax, oz: az }, fx));
        aim = { x: ax, y: aim.y, z: az };
      } else if (M.t === 'dash') {
        const d = M.d || 20;
        for (const v of this.npcs()) { const rx = v.x - ox, rz = v.z - oz, along = rx * dx + rz * dz, off = Math.abs(rx * dz - rz * dx); if (along > -1 && along < d + v.r && off < 3 + v.r) this.hitNpc(v, dmg, Object.assign({ ox, oz }, fx)); }
        this.dash = { dx, dz, sp: d / 0.28, t: 0.28 };
      } else if (M.t === 'trans') {
        this.buddhaT = 35; send({ bz: 1 }); sfx('magic'); toast('🧘 Buddha form! Bigger, tougher, harder hitting', '#fde68a');
      }
      this.playFx(F ? FI[F.k] : sword ? -1 : -3, mi, M, ox, oy, oz, aim.x, aim.y, aim.z);
      this.sendFx(F, mi, sword, ox, oy, oz, aim);
    },
    sendFx(F, mi, sword, ox, oy, oz, aim) { this.fxN++; send({ fx: [this.fxN, F ? FI[F.k] : sword ? -1 : -3, mi, +ox.toFixed(1), +oy.toFixed(1), +oz.toFixed(1), +aim.x.toFixed(1), +aim.y.toFixed(1), +aim.z.toFixed(1)] }); },
    shootProj(p) {
      const m = new THREE.Mesh(SPH, new THREE.MeshBasicMaterial({ color: p.col, transparent: true, opacity: 0.95 }));
      m.scale.setScalar(p.size); m.position.set(p.x, p.y, p.z); scene.add(m); p.m = m; this.projs.push(p);
      if (p.mine) sfx('shoot', { gap: 40, pitch: 1.2 });
    },
    stepProjs(dt) {
      const vs = this.npcs();
      for (let i = this.projs.length - 1; i >= 0; i--) {
        const p = this.projs[i]; p.life -= dt;
        // in small steps (a fast one would jump right over an enemy in one frame)
        const st = p.sp * dt, n = Math.max(1, Math.ceil(st / 1.2)), d = st / n;
        let hit = null, solid = false;
        for (let k = 0; k < n && !hit && !solid; k++) {
          p.x += p.dx * d; p.y += p.dy * d; p.z += p.dz * d;
          if (p.mine) for (const v of vs) if (Math.hypot(v.x - p.x, v.z - p.z) < v.r + p.size + 0.4 && p.y > v.y - 0.5 && p.y < v.y + 5.5 * v.s) { hit = v; break; }
          const ii = islandAt(p.x, p.z, 2);
          solid = (ii >= 0 && p.y < GY - 0.2) || p.y < SEA - 0.4 || (ii >= 0 && this.ibox[ii].some((b) => p.x > b[0] && p.x < b[3] && p.y > b[1] && p.y < b[4] && p.z > b[2] && p.z < b[5]));
        }
        p.m.position.set(p.x, p.y, p.z);
        if (Math.random() < 0.5) puffAt(p.x, p.y, p.z, [p.col, p.col2], 1);
        if (hit || solid || p.life <= 0) {
          if (p.mine) {
            if (p.ex) { for (const v of this.npcs()) if (Math.hypot(v.x - p.x, v.z - p.z) < p.ex + v.r) this.hitNpc(v, p.dmg, Object.assign({ ox: p.x, oz: p.z }, p.o)); }
            else if (hit) this.hitNpc(hit, p.dmg, p.o);
          }
          this.burst(p.x, p.y, p.z, p.col, p.ex ? p.ex : 1.5, p.col2);
          scene.remove(p.m); p.m.material.dispose(); this.projs.splice(i, 1);
        }
      }
    },
    toggleBuso() {
      if (!this.S || !this.S.ab.buso) { toast('🖤 Learn Buso Haki from the Ability Teacher on the Jungle', '#fca5a5'); return; }
      this.buso = !this.buso; sfx(this.buso ? 'magic' : 'click'); toast(this.buso ? '🖤 Buso Haki on' : 'Buso Haki off', '#e2e8f0');
    },
    soru() {
      if (!this.S || !this.S.ab.soru) { toast('💨 Learn Soru from the Ability Teacher in Pirate Village', '#fca5a5'); return; }
      const t = performance.now() / 1000; if ((this.cds.soru || 0) > t || !this.canAct() || this.inWater()) return;
      this.cds.soru = t + 1.6;
      const yaw = cam.yaw, dx = -Math.sin(yaw), dz = -Math.cos(yaw);
      this.dash = { dx, dz, sp: 22 / 0.16, t: 0.16 }; puffAt(P.x, P.y + 2, P.z, 0xffffff, 8); sfx('whoosh');
    },

    /* ---------------- what everyone sees ---------------- */
    // a move's look, from where it started to where it was aimed (yours, and everyone else's, from what they send)
    playFx(fi, mi, M, ox, oy, oz, ax, ay, az) {
      const F = FR[fi], col = F ? F.c : 0xe5e7eb, col2 = F ? F.c2 : 0xffffff, ls = F ? F.ls : 'beam';
      if (!M) M = F ? (mi === -1 ? F.m1 : F.mv[mi]) : fi === -1 ? SWMV[mi] : null;
      if (!M) return;
      let dx = ax - ox, dz = az - oz; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      sfx3(M.t === 'ring' || M.ex ? 'explode' : M.t === 'dash' ? 'whoosh' : 'zap', ox, oz, 90, { vol: 0.6, gap: 60 });
      if (M.t === 'line') this.lineFx(ox, oy - 2.5, oz, dx, dz, M.L, M.w, col, col2, ls);
      else if (M.t === 'ring') this.ringFx(ox, oy - 2.6, oz, M.r, col, col2);
      else if (M.t === 'aim') this.discFx(ax, oy - 2.6, az, M.r, col, col2);
      else if (M.t === 'dash') for (let k = 0; k < 8; k++) puffAt(ox + dx * k * (M.d || 20) / 8, oy, oz + dz * k * (M.d || 20) / 8, [col, col2], 2);
      else if (M.t === 'trans') { puffAt(ox, oy + 2, oz, [0xfde047, 0xffffff], 30); this.ringFx(ox, oy - 2.6, oz, 8, 0xfde047, 0xffffff); }
      else if (M.t === 'jump') puffAt(ox, oy - 2, oz, [col, col2], 12);
    },
    // others' moves come through what they send: the look only (their hits go to the host)
    peerFx() {
      for (const p of Net.peers) {
        if (p.isMe || !p.presence || !Array.isArray(p.presence.fx)) continue;
        const f = p.presence.fx, n = f[0], s0 = this.fxSeen.get(p.peer); this.fxSeen.set(p.peer, n);
        if (s0 == null || n === s0) continue;
        this.peerSwing.set(p.peer, 0.25); // (they swung, or threw something)
        const [, fi, mi, ox, oy, oz, ax, ay, az] = f.map(Number);
        if (fi <= -2) { puffAt(ox, oy + 1, oz, [0xffffff, 0xe5e7eb], 3); sfx3('punch', ox, oz, 50, { gap: 80 }); continue; }
        const F = FR[fi], M = F ? (mi === -1 ? F.m1 : F.mv[mi]) : fi === -1 ? SWMV[mi] : null;
        if (!M) continue;
        if (M.t === 'proj') {
          let dx = ax - ox, dz = az - oz; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; const cnt = M.cnt || 1;
          for (let k = 0; k < cnt; k++) { const a = cnt > 1 ? ((k / (cnt - 1)) - 0.5) * (M.spr || 0.2) * 2 : 0, ca = Math.cos(a), sa = Math.sin(a); this.shootProj({ x: ox, y: oy, z: oz, dx: dx * ca - dz * sa, dy: clamp((ay - oy) / l, -0.5, 0.5), dz: dx * sa + dz * ca, sp: M.sp || 70, life: 70 / (M.sp || 70), size: M.big ? 1.6 : 0.55, col: F ? F.c : 0xffffff, col2: F ? F.c2 : 0xffffff, ex: M.ex || 0, mine: false }); }
        } else this.playFx(fi, mi, M, ox, oy, oz, ax, ay, az);
      }
    },
    addFx(m, life, upd) { scene.add(m); this.fx.push({ m, life, t: 0, upd }); },
    endFx(f) { scene.remove(f.m); f.m.traverse((o) => { if (o.material) o.material.dispose(); }); },
    burst(x, y, z, col, r, col2) {
      puffAt(x, y, z, [col, col2 || 0xffffff], Math.min(20, 6 + r * 2));
      const m = new THREE.Mesh(SPH, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6, depthWrite: false })); m.position.set(x, y, z);
      this.addFx(m, 0.35, (f, k) => { m.scale.setScalar(0.3 + r * k); m.material.opacity = 0.6 * (1 - k); });
    },
    ringFx(x, y, z, r, col, col2) {
      const m = new THREE.Mesh(TORUS, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, depthWrite: false })); m.rotation.x = Math.PI / 2; m.position.set(x, y + 0.6, z);
      this.addFx(m, 0.45, (f, k) => { m.scale.set(0.3 * r + r * 0.7 * k, 0.3 * r + r * 0.7 * k, 1 + 3 * (1 - k)); m.material.opacity = 0.85 * (1 - k); });
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; puffAt(x + Math.cos(a) * r * 0.7, y + 1, z + Math.sin(a) * r * 0.7, [col, col2], 1); }
    },
    discFx(x, y, z, r, col, col2) {
      const d = new THREE.Mesh(DISC, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide })); d.rotation.x = -Math.PI / 2; d.position.set(x, y + 0.15, z);
      this.addFx(d, 0.6, (f, k) => { d.scale.setScalar(r * Math.min(1, k * 3)); d.material.opacity = 0.5 * (1 - k); });
      const p = new THREE.Mesh(CYL, new THREE.MeshBasicMaterial({ color: col2, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide })); p.position.set(x, y, z);
      this.addFx(p, 0.6, (f, k) => { p.scale.set(r * 0.6, 4 + 22 * k, r * 0.6); p.position.y = y + (4 + 22 * k) / 2; p.material.opacity = 0.55 * (1 - k); });
      for (let k = 0; k < 8; k++) puffAt(x + (Math.random() - 0.5) * r * 1.4, y + 1 + Math.random() * 4, z + (Math.random() - 0.5) * r * 1.4, [col, col2], 1);
    },
    lineFx(x, y, z, dx, dz, L, w, col, col2, ls) {
      const yaw = Math.atan2(dx, dz);
      if (ls === 'spike') {
        const n = Math.max(4, Math.round(L / 2.4));
        for (let k = 1; k <= n; k++) { const s = new THREE.Mesh(CONE, new THREE.MeshLambertMaterial({ color: k % 2 ? col : col2, transparent: true })); const px = x + dx * (L * k) / n + (Math.random() - 0.5) * w * 0.5, pz = z + dz * (L * k) / n + (Math.random() - 0.5) * w * 0.5, h = 2 + Math.random() * 2.5; s.position.set(px, y, pz); this.addFx(s, 0.7 + k * 0.02, (f, q) => { const up = Math.min(1, q * 6); s.scale.set(w * 0.25, h * up, w * 0.25); s.position.y = y + (h * up) / 2; s.material.opacity = q > 0.7 ? (1 - q) / 0.3 : 1; }); }
      } else if (ls === 'breath') {
        for (let k = 0; k < 14; k++) { const q = k / 14; puffAt(x + dx * L * q + (Math.random() - 0.5) * w * q, y + 2.5 + (Math.random() - 0.5) * 2, z + dz * L * q + (Math.random() - 0.5) * w * q, [col, col2, 0xffffff], 2); }
        const b = new THREE.Mesh(CONE, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.45, depthWrite: false })); b.rotation.order = 'YXZ'; b.rotation.y = yaw; b.rotation.x = Math.PI / 2; b.position.set(x + (dx * L) / 2, y + 2.6, z + (dz * L) / 2);
        this.addFx(b, 0.4, (f, q) => { b.scale.set(w * 0.5, L, w * 0.25); b.material.opacity = 0.45 * (1 - q); });
      } else {
        const b = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, depthWrite: false })); b.rotation.y = yaw; b.position.set(x + (dx * L) / 2, y + 2.6, z + (dz * L) / 2);
        this.addFx(b, 0.35, (f, q) => { b.scale.set(w * (1 - q * 0.6), w * 0.4 * (1 - q * 0.6), L); b.material.opacity = 0.8 * (1 - q); });
        const c = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial({ color: col2, transparent: true, opacity: 0.9, depthWrite: false })); c.rotation.y = yaw; c.position.copy(b.position);
        this.addFx(c, 0.25, (f, q) => { c.scale.set(w * 0.35, w * 0.15, L); c.material.opacity = 0.9 * (1 - q); });
        puffAt(x + dx * L, y + 2.5, z + dz * L, [col, col2], 6);
      }
    },

    /* ---------------- everyone ---------------- */
    tick(dt) {
      const g = this.g = roundState(this), S = this.S, t = performance.now();
      if (!S) return;
      // energy and health come back (health only when nothing's hit you for a bit)
      this.en = Math.min(this.maxEn(), this.en + dt * 12);
      if (!P.dead && t - this.hurtAt > 6000) this.hp = Math.min(this.maxHp(), this.hp + this.maxHp() * 0.02 * dt);
      if (this.wasDead && !P.dead) { this.hp = this.maxHp(); this.en = this.maxEn(); this.buddhaT = 0; send({ bz: 0 }); }
      this.wasDead = P.dead;
      if (this.faceT > 0) { this.faceT -= dt; if (!View.lock && !View.fp) P.yaw = this.faceYaw; }
      this.swingT = Math.max(0, this.swingT - dt);
      for (const [k, v] of this.peerSwing) this.peerSwing.set(k, Math.max(0, v - dt));
      // dashing
      if (this.dash) { this.dash.t -= dt; if (this.dash.t <= 0) this.dash = null; }
      // in the air: Geppo resets on landing; Spring Leap slams down
      if (P.ground) { this.airJ = 0; if (this.slam && !this.wasGround) { const s = this.slam; this.slam = null; for (const v of this.npcs()) if (Math.hypot(v.x - P.x, v.z - P.z) < s.M.r + v.r) this.hitNpc(v, s.dmg, s.fx); this.ringFx(P.x, P.y, P.z, s.M.r, s.F ? s.F.c : 0xffffff, s.F ? s.F.c2 : 0xffffff); sfx('explode'); } }
      this.wasGround = !!P.ground;
      if (touchy && jumpHeld && !this.jumpWas && this.riding) { this.riding = false; P.vy = 45; sfx('jump'); }
      else if (touchy && jumpHeld && !this.jumpWas && !P.ground && S.ab.geppo && this.airJ < 2 && !this.inWater()) { this.airJ++; P.vy = 46; puffAt(P.x, P.y, P.z, 0xffffff, 6); }
      this.jumpWas = jumpHeld;
      // Buddha form
      if (this.buddhaT > 0) { this.buddhaT -= dt; if (this.buddhaT <= 0) { send({ bz: 0 }); toast('🧘 Buddha form wore off', '#e2e8f0'); } }
      if (me) me.g.scale.setScalar(this.buddhaT > 0 ? 2.2 : 1);
      // hold the button: keep attacking
      if (this.hold && !(typeof drag !== 'undefined' && drag && drag.moved) && t / 1000 - this.hold.at > 0.18) this.m1(this.mouse ? this.aimAt(this.mouse.x, this.mouse.y) : null);
      // the sea: swim (slowly); fruit users sink and hurt
      const water = this.inWater();
      if (water && !this.wasWater) { puffAt(P.x, SEA + 0.5, P.z, [0xffffff, 0x93c5fd], 14); sfx('splash'); }
      this.wasWater = water;
      if (water && this.fruit()) { this.takeHit(this.maxHp() * 0.07 * dt * 2, -1); this.hurtAt = t; if (t - this.waterMsgAt > 5000) { this.waterMsgAt = t; toast('🌊 Fruit users can’t swim! Get out of the water (or take a boat)', '#93c5fd'); } }
      // a boat: you ride it, it follows you
      if (this.riding) {
        // it runs aground at a beach (and the sea ends somewhere)
        const pv = this.boatPrev;
        if (pv && (islandAt(P.x, P.z, 10) >= 0 || Math.abs(P.x) > 700 || P.z > 300 || P.z < -1900)) { P.x = pv[0]; P.z = pv[1]; this.boat.sp = 0; }
        this.boatPrev = [P.x, P.z];
        P.y = SEA + 0.9; P.vy = 0; this.boat.x = P.x; this.boat.z = P.z; this.boat.yaw = P.yaw;
      } else this.boatPrev = null;
      if (this.boat) { if (!this.boatM) { this.boatM = boatModel(); scene.add(this.boatM); } this.boatM.position.set(this.boat.x, SEA + 0.6 + Math.sin(t / 600) * 0.12, this.boat.z); this.boatM.rotation.y = this.boat.yaw; }
      // the island you're on: visited (for the captain), your respawn
      const ii = islandAt(P.x, P.z, 4);
      if (ii >= 0 && P.ground && !P.dead) { if (!S.vis.includes(ii)) { S.vis.push(ii); this.dirty = true; this.big(ISL[ii].n, ISL[ii].lv ? `Enemies from level ${ISL[ii].lv}` : ''); sfx('reward'); } if (S.home !== ii) { S.home = ii; this.dirty = true; } }
      if (ii !== this.vis) { this.vis = ii; }
      this.events(g);
      this.stepProjs(dt);
      for (let i = this.fx.length - 1; i >= 0; i--) { const f = this.fx[i]; f.t += dt; const k = Math.min(1, f.t / f.life); f.upd(f, k); if (k >= 1) { this.endFx(f); this.fx.splice(i, 1); } }
      this.peerFx();
      this.drawNpcs(g, dt);
      this.drawFruits(g, dt);
      this.drawBoats();
      // only the islands near you are drawn
      if (t - this.cullAt > 500) { this.cullAt = t; ISL.forEach((I, i) => { const v = Math.hypot(camera.position.x - I.x, camera.position.z - I.z) < 380 + I.w / 2; for (const m of this.isMeshes[i] || []) m.visible = v; for (const a of this.keepers) if (a.isl === i) { a.g.visible = v; if (a.shadow) a.shadow.visible = v && !renderer.shadowMap.enabled; } }); }
      // saving
      if (this.dirty && t - this.saveT > 3000) { this.saveT = t; this.saveNow(); }
      this.drawVitals(); this.drawQuest(); this.drawBar();
    },
    events(g) {
      if (!g) return;
      const mine = myPeer(), S = this.S;
      if (this.evN == null) this.evN = Math.max(0, ...(g.ev || []).map((e) => e[0]));
      for (const e of g.ev || []) {
        if (!(e[0] > this.evN)) continue;
        this.evN = e[0];
        const k = e[1];
        if (k === 'a' && e[3] === mine) this.takeHit(+e[4] || 0, (this.na.get(e[2]) || {}).t);
        else if (k === 'k') {
          const [, , id, by, t, help, x, z] = e, E = EN[t], v = this.na.get(id);
          if (v && v.a) { scatter(v.a); v.dead = 0.01; sfx3('oof', x, z, 80); }
          const meK = by === mine, meA = Array.isArray(help) && help.includes(mine);
          if (E && (meK || meA)) {
            this.gain(npcXp(E) * (meK ? 1 : 0.5), meK ? npcBeli(E) : 0);
            S.kills = (S.kills | 0) + (meK ? 1 : 0);
            if (S.q && S.q.t === t) { S.q.n = Math.min(S.q.need, S.q.n + 1); if (S.q.n >= S.q.need) this.questDone(); }
            if (meK && this.fruit() && performance.now() - (this.lastFruitHit || 0) < 1500) { const F = this.fruit(); S.mas[F.k] = Math.min(600, (S.mas[F.k] | 0) + 4); }
            if (E.k === 'vadmiral') quest('fruits.vadmiral');
            if (E.boss && meK) {
              earn(3, `defeated ${E.n}`);
              if (Math.random() < 0.08) this.addFruit(pickFruit(Math.random), `🍎 ${E.n} dropped a Blox Fruit!`);
              if (E.k === 'vadmiral' && !S.swords.includes('saber') && Math.random() < 0.2) { S.swords.push('saber'); this.big('🌟 SABER!', 'The Vice Admiral dropped his sword'); }
            }
            this.dirty = true;
          }
        } else if (k === 'bs') { this.warnFx(e[3], e[4]); }
        else if (k === 'fs') { toast('🍎 A Blox Fruit has spawned somewhere!', '#fde68a'); sfx('reward'); }
        else if (k === 'fp') { if (e[3] === mine) this.addFruit(e[4], `🍎 You found a ${FR[e[4]].n} Fruit!`); else say(`🍎 ${nameOf(e[3])} found a ${FR[e[4]] ? FR[e[4]].n : ''} Fruit!`, '#fde68a'); }
      }
    },
    warnFx(x, z) {
      const d = new THREE.Mesh(DISC, new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide })); d.rotation.x = -Math.PI / 2; d.position.set(x, GY + 0.12, z);
      this.addFx(d, 1, (f, k) => { d.scale.setScalar(10 * Math.min(1, k * 1.3)); d.material.opacity = 0.25 + 0.3 * Math.abs(Math.sin(k * 12)); if (k >= 1) { puffAt(x, GY + 1, z, [0x78350f, 0xffffff], 20); sfx3('boom', x, z, 90); } });
      sfx3('alarm', x, z, 70, { vol: 0.5 });
    },
    addFruit(fi, msg) {
      const S = this.S; if (!FR[fi]) return;
      if (S.inv.length >= 8) { toast('🎒 Your fruit bag is full (8): eat or drop one (B)', '#fca5a5'); return; }
      S.inv.push(fi); this.dirty = true; this.saveNow();
      this.big(`${FR[fi].e} ${FR[fi].n} Fruit`, `${RAR[FR[fi].r].n} · B to eat it`); sfx('unlock');
      if (msg) say(msg, '#fde68a');
    },
    questDone() {
      const S = this.S, E = EN[S.q.t], Q = questOf(E);
      S.q = null; this.big('QUEST COMPLETE!', `+${fmt(Q.beli)} · +${Q.xp.toLocaleString('en-US')} XP`); sfx('win');
      this.gain(Q.xp, Q.beli);
    },
    // the enemies near you: where the host says, with their names, levels and health
    drawNpcs(g, dt) {
      const want = new Map();
      for (const q of (g && g.n) || []) if (Math.hypot(q[2] - P.x, q[3] - P.z) < 170) want.set(q[0], q);
      for (const [id, v] of this.na) {
        if (want.has(id)) continue;
        if (v.dead != null && v.dead < 2.4 && v.a && v.a.dead) { v.dead += dt; updateDead(v.a, dt); continue; }
        this.dropNpc(v); this.na.delete(id);
      }
      for (const [id, q] of want) {
        let v = this.na.get(id);
        if (v && v.dead != null) { this.dropNpc(v); this.na.delete(id); v = null; } // back from the dead
        const E = EN[q[1]];
        if (!v) {
          const L = E.av, a = makeAvatar(okAv([L[0], L[1], L[2], L[3], L[4], L[5], 0, 0, 0, 0]), '', false);
          a.g.scale.setScalar(E.s); a.g.position.set(q[2], GY, q[3]); scene.add(a.g);
          const tag = label(`${E.boss ? '👑 ' : ''}${E.n} [Lv. ${E.lv}]`, { size: E.boss ? 0.75 : 0.62, color: E.boss ? '#fca5a5' : E.lv > this.S.lv + 20 ? '#fda4af' : '#ffffff' }); tag.position.y = 6.3; a.g.add(tag);
          const bar = new THREE.Group(), bg = new THREE.Mesh(BOX, BAR_BG), fill = new THREE.Mesh(BOX, BAR_FG); bg.scale.set(2.4, 0.24, 0.05); fill.scale.set(2.3, 0.16, 0.06); bar.add(bg, fill); bar.position.y = 5.75; a.g.add(bar);
          if (E.boss) { const w = makeWeapon(); a.armR.add(w); }
          v = { a, t: q[1], tag, bar, fill, flash: 0, dead: null }; this.na.set(id, v);
        }
        const p = v.a.g.position, k = this.H ? 1 : Math.min(1, dt * 10);
        p.x += (q[2] - p.x) * k; p.z += (q[3] - p.z) * k; p.y = GY;
        let dy = q[4] - v.a.g.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; v.a.g.rotation.y += dy * Math.min(1, dt * 10);
        animateAvatar(v.a, dt, !!(q[6] & 1), false); placeShadow(v.a);
        v.tag.visible = camera.position.distanceTo(p) > 10; // (right by the camera, it'd fill the screen)
        if (q[6] & 2) v.a.armR.rotation.x = 2.2; // swinging at someone
        v.flash = Math.max(0, v.flash - dt);
        setGlow(v.a, v.flash > 0 ? 0x7f1d1d : q[6] & 4 ? 0x1e3a8a : q[6] & 8 ? 0x9a3412 : null);
        if (q[6] & 8 && Math.random() < dt * 6) puffAt(p.x, p.y + 3 * E.s, p.z, [0xf97316, 0xfacc15], 1);
        const f = q[5] / 100; v.bar.visible = f < 0.999; v.fill.scale.x = Math.max(0.01, 2.3 * f); v.fill.position.x = -1.15 * (1 - f); v.bar.quaternion.copy(camera.quaternion).premultiply(v.a.g.quaternion.clone().invert());
      }
    },
    dropNpc(v) { if (!v.a) return; if (v.tag) { v.tag.material.map.dispose(); v.tag.material.dispose(); } dropAvatar(v.a); v.a = null; },
    // fruits lying under trees: walk into one to pick it up
    drawFruits(g, dt) {
      const list = (g && g.fr) || [], ids = new Set(list.map((f) => f[0]));
      for (const [id, m] of this.fruitsM) if (!ids.has(id)) { scene.remove(m.g); m.l.material.map.dispose(); this.fruitsM.delete(id); }
      for (const f of list) {
        let m = this.fruitsM.get(f[0]);
        if (!m) { const gr = fruitModel(f[1], 1.1), l = label('🍎 Blox Fruit', { size: 0.8, color: '#fde68a' }); l.position.y = 2.2; gr.add(l); gr.position.set(f[2], GY + 1.3, f[3]); scene.add(gr); m = { g: gr, l, asked: 0 }; this.fruitsM.set(f[0], m); }
        m.g.rotation.y += dt * 1.5; m.g.position.y = GY + 1.3 + Math.sin(performance.now() / 400) * 0.2;
        if (!P.dead && Math.hypot(P.x - f[2], P.z - f[3]) < 3.5 && performance.now() - m.asked > 1500) { m.asked = performance.now(); this.ask('p', f[0]); }
      }
    },
    // other players' boats (and giants in Buddha form)
    drawBoats() {
      const seen = new Set();
      for (const p of Net.peers) {
        if (p.isMe || !p.presence) continue;
        const b = p.presence.bt; if (!Array.isArray(b)) continue;
        seen.add(p.peer); let m = this.oBoats.get(p.peer);
        if (!m) { m = boatModel(); scene.add(m); this.oBoats.set(p.peer, m); }
        m.position.set(+b[0], SEA + 0.6, +b[1]); m.rotation.y = +b[2];
      }
      for (const [k, m] of this.oBoats) if (!seen.has(k)) { scene.remove(m); this.oBoats.delete(k); }
      if (this.boat) { const t = performance.now(); if (t - (this.btAt || 0) > 150) { this.btAt = t; send({ bt: [+this.boat.x.toFixed(1), +this.boat.z.toFixed(1), +this.boat.yaw.toFixed(2)] }); } }
    },
    pose() {
      const hold = (a, key, what, swing) => {
        if (!a || a.dead) return;
        let h = this.held.get(key);
        if (!h || h.a !== a || h.w !== what) { if (h && h.m && h.m.parent) h.m.parent.remove(h.m); h = { a, w: what, m: what && what.startsWith('sword:') ? swordModel(SWI[what.slice(6)]) : null }; if (h.m) { h.m.rotation.x = -0.35; h.m.position.set(0, -1.9, 0); a.armR.add(h.m); } this.held.set(key, h); }
        // a sword's held out in front, blade up (as in Roblox); a swing brings the arm down from overhead
        if (swing > 0) a.armR.rotation.x = 2.6 - (1 - swing / 0.25) * 2.6; else if (h.m) a.armR.rotation.x = Math.PI / 2;
      };
      hold(me, 'me', this.tool === 'sword' && this.S && this.S.sword ? 'sword:' + this.S.sword : '', this.swingT);
      // at the helm: standing, not falling
      const stand = (a) => { a.legL.rotation.x = a.legR.rotation.x = 0; a.armL.rotation.x = 0.5; a.armR.rotation.x = 0.5; };
      if (this.riding && me && !me.dead) stand(me);
      for (const [peer, a] of Net.avatars) { const b = this.oBoats.get(peer); if (b && !a.dead && Math.hypot(a.g.position.x - b.position.x, a.g.position.z - b.position.z) < 2 && Math.abs(a.g.position.y - SEA - 0.9) < 1) stand(a); }
      for (const [peer, a] of Net.avatars) { const p = Net.peers.find((q) => q.peer === peer), pr = (p && p.presence) || {}; hold(a, peer, String(pr.hd || ''), this.peerSwing.get(peer) || 0); a.g.scale.setScalar(pr.bz ? 2.2 : 1); }
    },
    drawVitals() {
      const S = this.S, el = $('#bfV'); if (!el) return;
      const mh = this.maxHp(), me2 = this.maxEn(), hp = Math.max(0, Math.round(this.hp)), en = Math.round(this.en), nx = need(S.lv);
      const html = `<div class="top"><span class="lv">Lv. ${S.lv}</span>${S.pts ? `<span style="color:#fde047">+${S.pts} pts (K)</span>` : ''}<span class="beli">${fmt(S.beli)}</span></div>
        <div class="bar"><i style="width:${(100 * hp / mh).toFixed(1)}%;background:linear-gradient(90deg,#16a34a,#4ade80)"></i><b>❤️ ${hp} / ${mh}</b></div>
        <div class="bar"><i style="width:${(100 * en / me2).toFixed(1)}%;background:linear-gradient(90deg,#1d4ed8,#60a5fa)"></i><b>⚡ ${en} / ${me2}</b></div>
        <div class="bar xp"><i style="width:${S.lv >= MAXLV ? 100 : (100 * S.xp / nx).toFixed(1)}%;background:#facc15"></i></div>`
        + (touchy ? `${S.q ? `<div class="q">🎯 ${S.q.n} / ${S.q.need} ${esc(EN[S.q.t].n)}</div>` : ''}<div class="btns"><button data-v="statsPanel">📈 Stats</button><button data-v="bagPanel">🎒 Fruits</button><button data-v="mapPanel">🗺️</button></div>` : '');
      if (html !== this.vHtml) { this.vHtml = html; el.innerHTML = html; }
    },
    drawQuest() {
      const S = this.S, el = $('#bfQ'); if (!el) return;
      const q = S.q, html = q ? `<b>🎯 Quest</b>Defeat ${EN[q.t].boss ? EN[q.t].n : `${q.need} ${EN[q.t].n}s`} — ${q.n} / ${q.need}<br><span style="color:#86efac">${fmt(questOf(EN[q.t]).beli)} · ${questOf(EN[q.t]).xp.toLocaleString('en-US')} XP</span>` : '';
      el.hidden = !q; if (html !== this.qHtml) { this.qHtml = html; el.innerHTML = html; }
    },
    drawBar() {
      const S = this.S; if (!S) return;
      const t = performance.now() / 1000, F = this.fruit(), sw = SW[SWI[S.sword]];
      const cdq = (key, cd) => { const left = (this.cds[key] || 0) - t; return left > 0 ? [Math.ceil((left / cd) * 10), Math.ceil(left)] : 0; };
      let html = `<button class="xslot ${this.tool === 'combat' ? 'on' : ''}" data-k="t:combat"><span class="k">1</span><span class="e">👊</span>Combat</button>`
        + `<button class="xslot ${this.tool === 'sword' ? 'on' : ''} ${sw ? '' : 'lockd'}" data-k="t:sword"><span class="k">2</span><span class="e">${sw ? sw.e : '⚔️'}</span>${sw ? sw.n : 'Sword'}</button>`
        + `<button class="xslot ${this.tool === 'fruit' ? 'on' : ''} ${F ? '' : 'lockd'}" data-k="t:fruit"><span class="k">3</span><span class="e">${F ? F.e : '🍎'}</span>${F ? F.n : 'Fruit'}</button>`;
      const moves = this.tool === 'fruit' && F ? F.mv.map((M, i) => [M, 'f' + i, this.mastery() >= M.m]) : this.tool === 'sword' && sw ? SWMV.map((M, i) => [M, 's' + i, true]) : [];
      moves.forEach(([M, key, ok], i) => { const q = cdq(key, M.cd); html += `<button class="xslot ${ok ? '' : 'lockd'}" data-k="m:${i}" style="position:relative"><span class="k">${'ZXC'[i]}</span><span class="e">${ok ? '✦' : '🔒'}</span>${M.n}${q ? `<i class="bf-cd" style="height:${q[0] * 10}%"></i><b class="bf-cdn">${q[1]}</b>` : ''}</button>`; });
      if (touchy && S.ab.soru) html += '<button class="xslot" data-k="soru"><span class="e">💨</span>Soru</button>';
      if (touchy && S.ab.buso) html += `<button class="xslot ${this.buso ? 'on' : ''}" data-k="buso"><span class="e">🖤</span>Haki</button>`;
      if (!touchy) html += '<button class="xslot" data-k="stats"><span class="k">K</span><span class="e">📈</span>Stats</button><button class="xslot" data-k="bag"><span class="k">B</span><span class="e">🎒</span>Fruits</button>';
      setBar(html, (b) => {
        const k = b.dataset.k;
        if (k.startsWith('t:')) this.pick(k.slice(2));
        else if (k.startsWith('m:')) this.skill(+k.slice(2));
        else if (k === 'stats') this.statsPanel();
        else if (k === 'bag') this.bagPanel();
        else if (k === 'soru') this.soru();
        else if (k === 'buso') this.toggleBuso();
      });
    },
    hud() {
      const S = this.S; if (!S) return '';
      if (this.riding) return touchy ? '⛵ Joystick: sail and steer · Jump: get off' : '⛵ W/S: sail · A/D: steer · Space: jump off';
      if (this.inWater()) return this.fruit() ? '🌊 Fruit users can’t swim — get out of the water!' : '🏊 Swimming · walk up onto a beach to get out';
      if (touchy) return this.buddhaT > 0 ? `🧘 Buddha form · ${Math.ceil(this.buddhaT)}s` : '👆 Tap to attack · moves on the bar';
      return `🖱️ Click: attack · 1–3 tools · Z X C moves${S.ab.soru ? ' · R Soru' : ''}${S.ab.buso ? ` · J Haki${this.buso ? ' ✓' : ''}` : ''}${this.buddhaT > 0 ? ` · 🧘 ${Math.ceil(this.buddhaT)}s` : ''}`;
    },
    prompts() {
      const out = [];
      for (const s of this.stalls) out.push({ x: s.x, z: s.z, r: 6, text: { quest: 'Quests', fruit: 'Fruit Dealer', gacha: 'Blox Fruit Gacha', sword: 'Sword Dealer', ability: 'Ability Teacher', captain: 'Captain: boats & travel' }[s.k], fn: () => this.stallPanel(s) });
      if (this.boat && !this.riding && Math.hypot(P.x - this.boat.x, P.z - this.boat.z) < 9) out.push({ x: this.boat.x, z: this.boat.z, r: 9, text: 'Board your boat', fn: () => { this.riding = true; P.x = this.boat.x; P.z = this.boat.z; P.yaw = this.boat.yaw; this.boat.sp = 0; sfx('splash'); } });
      return out;
    },

    /* ---------------- panels ---------------- */
    stallPanel(s) {
      const S = this.S, I = ISL[s.isl]; this.pan = null;
      if (s.k === 'quest') {
        const list = EN.map((E, t) => [E, t]).filter(([E]) => E.isl === s.isl);
        const html = `<p style="margin:0 0 8px;color:#cbd5e1">${esc(I.n)} · defeat them for Beli and XP. One quest at a time.</p>` + list.map(([E, t]) => {
          const Q = questOf(E), on = S.q && S.q.t === t, can = S.lv >= Q.req;
          return `<div class="xp-card ${on ? 'on' : ''}" style="flex-direction:row;align-items:center;gap:12px;margin:8px 0"><div class="big" style="width:62px;flex:none">${E.boss ? '👑' : '⚔️'}</div><div style="flex:1"><b>${E.boss ? E.n : `Defeat ${Q.need} ${E.n}s`}</b><br>Lv. ${E.lv} · needs Lv. ${Q.req}<br><span style="color:#86efac">${fmt(Q.beli)} · ${Q.xp.toLocaleString('en-US')} XP</span></div><button class="xp-btn ${on ? 'red' : can ? '' : 'alt'}" data-q="${t}" ${!can && !on ? 'disabled' : ''}>${on ? 'Abandon' : can ? 'Accept' : `Lv. ${Q.req}`}</button></div>`;
        }).join('');
        openPanel('❗ Quests', html, (b) => { const t = +b.dataset.q; if (S.q && S.q.t === t) { S.q = null; sfx('click'); } else { S.q = { t, n: 0, need: questOf(EN[t]).need }; sfx('reward'); toast(`🎯 Quest: defeat ${EN[t].boss ? EN[t].n : `${S.q.need} ${EN[t].n}s`}`, '#fde68a'); closePanel(); } this.dirty = true; if (panelOpen()) this.stallPanel(s); });
      } else if (s.k === 'fruit') {
        const st = stock(), left = STOCK_MS - (Date.now() % STOCK_MS);
        const html = `<p style="margin:0 0 8px;color:#cbd5e1">In stock now (new stock in ${Math.ceil(left / 60000)} min). Buy one, then eat it from your bag (B). You have <b style="color:#86efac">${fmt(S.beli)}</b>.</p><div class="xp-grid">` + st.map((i) => { const F = FR[i]; return `<div class="xp-card"><div class="big">${F.e}</div><b>${F.n}</b><span class="bf-rar" style="background:${RAR[F.r].c}">${RAR[F.r].n}</span><span>${F.mv.map((m) => m.n).join(' · ')}</span><button class="xp-btn gold" data-f="${i}" ${S.beli < F.price ? 'disabled' : ''}>${fmt(F.price)}</button></div>`; }).join('') + '</div>';
        openPanel('🍎 Fruit Dealer', html, (b) => { const i = +b.dataset.f, F = FR[i]; if (!F || S.beli < F.price) return; if (S.inv.length >= 8) { toast('🎒 Your fruit bag is full', '#fca5a5'); return; } S.beli -= F.price; sfx('buy'); this.addFruit(i); this.stallPanel(s); });
      } else if (s.k === 'gacha') {
        const price = 15000 + S.lv * 500, wait = Math.max(0, (S.gachaAt || 0) + 15 * 60000 - Date.now());
        const html = `<div class="xp-card" style="text-align:center"><div class="big">🎲</div><b>A random Blox Fruit</b><span>Anything from Bomb to Dragon. Once every 15 minutes.</span><button class="xp-btn purple" data-g="1" ${S.beli < price || wait ? 'disabled' : ''}>${wait ? `Ready in ${Math.ceil(wait / 60000)} min` : fmt(price)}</button></div>`;
        openPanel('🎲 Blox Fruit Gacha', html, () => { if (S.beli < price || wait) return; if (S.inv.length >= 8) { toast('🎒 Your fruit bag is full', '#fca5a5'); return; } S.beli -= price; S.gachaAt = Date.now(); sfx('magic'); this.addFruit(pickFruit(Math.random), '🎲 The gacha rolled a fruit!'); this.stallPanel(s); });
      } else if (s.k === 'sword') {
        const list = SW.map((W, i) => [W, i]).filter(([W]) => W.at === s.isl);
        const html = `<p style="margin:0 0 8px;color:#cbd5e1">Equip with 2. You have <b style="color:#86efac">${fmt(S.beli)}</b>.</p><div class="xp-grid">` + list.concat(S.swords.filter((k) => SW[SWI[k]].at !== s.isl).map((k) => [SW[SWI[k]], SWI[k]])).map(([W]) => { const own = S.swords.includes(W.k), on = S.sword === W.k; return `<div class="xp-card ${on ? 'on' : ''}"><div class="big">${W.e}</div><b>${W.n}</b><span>💥 ${W.dmg} base · Z Dash Slash · X Spin Slash</span><button class="xp-btn ${own ? 'blue' : 'gold'}" data-w="${W.k}" ${on || (!own && S.beli < W.price) ? 'disabled' : ''}>${on ? 'Equipped' : own ? 'Equip' : fmt(W.price)}</button></div>`; }).join('') + '</div>';
        openPanel('⚔️ Sword Dealer', html, (b) => { const W = SW[SWI[b.dataset.w]]; if (!W) return; if (!S.swords.includes(W.k)) { if (S.beli < W.price) return; S.beli -= W.price; S.swords.push(W.k); sfx('buy'); } S.sword = W.k; this.tool = 'sword'; send({ hd: 'sword:' + W.k }); this.dirty = true; this.stallPanel(s); });
      } else if (s.k === 'ability') {
        const list = Object.entries(AB).filter(([, A]) => A.at === s.isl);
        const html = list.map(([k, A]) => { const own = !!S.ab[k]; return `<div class="xp-card ${own ? 'on' : ''}" style="margin:8px 0"><div class="big">${A.e}</div><b>${A.n}</b><span>${A.d}</span><button class="xp-btn gold" data-a="${k}" ${own || S.beli < A.price ? 'disabled' : ''}>${own ? 'Learned' : fmt(A.price)}</button></div>`; }).join('');
        openPanel('🥋 Ability Teacher', html, (b) => { const k = b.dataset.a, A = AB[k]; if (!A || S.ab[k] || S.beli < A.price) return; S.beli -= A.price; S.ab[k] = 1; sfx('unlock'); toast(`${A.e} ${A.n} learned!`, '#fde68a'); this.dirty = true; this.stallPanel(s); });
      } else if (s.k === 'captain') {
        const html = `<div class="xp-card" style="margin-bottom:10px"><div class="big">⛵</div><b>Your boat</b><span>${S.boat ? 'Sail it anywhere: W/S speed, A/D steer, Space to jump off.' : 'A dinghy of your own, to sail between islands.'}</span><button class="xp-btn ${S.boat ? 'blue' : 'gold'}" data-b="1" ${!S.boat && S.beli < 1000 ? 'disabled' : ''}>${S.boat ? 'Put it in the water' : fmt(1000)}</button></div>
          <h4>⚓ Sail to an island you've been to</h4>` + ISL.map((J, i) => `<div class="bf-isl"><b>${esc(J.n)}</b><span style="color:#94a3b8">${J.lv ? `Lv. ${J.lv}+` : 'start'}</span><button class="xp-btn ${S.vis.includes(i) ? '' : 'alt'}" data-tr="${i}" ${!S.vis.includes(i) || i === s.isl ? 'disabled' : ''}>${i === s.isl ? 'Here' : S.vis.includes(i) ? 'Sail' : '🔒 Find it first'}</button></div>`).join('');
        openPanel('⚓ Captain', html, (b) => {
          if (b.dataset.b) {
            if (!S.boat) { if (S.beli < 1000) return; S.beli -= 1000; S.boat = true; sfx('buy'); this.dirty = true; }
            const d = this.docks[s.isl]; this.boat = { x: d.boat[0], z: d.boat[1], yaw: 0, sp: 0 }; closePanel(); toast('⛵ Your boat is at the end of the dock: E to board', '#93c5fd');
          } else if (b.dataset.tr) { const i = +b.dataset.tr, d = this.docks[i]; closePanel(); this.riding = false; P.x = d.x; P.y = GY + 1; P.z = d.z; P.vx = P.vy = P.vz = 0; P.yaw = cam.yaw = Math.PI; puffAt(P.x, P.y + 2, P.z, [0x93c5fd, 0xffffff], 16); sfx('teleport'); }
        });
      }
    },
    statsPanel() {
      const S = this.S, names = { m: ['👊 Melee', 'Fists hit harder'], d: ['🛡️ Defense', 'More health, take less damage'], s: ['⚔️ Sword', 'Swords hit harder'], f: ['🍎 Blox Fruit', 'Fruit moves hit harder'] };
      const html = `<p style="margin:0 0 6px;color:#cbd5e1">Lv. ${S.lv} · ${S.xp.toLocaleString('en-US')} / ${need(S.lv).toLocaleString('en-US')} XP · you get 3 points a level.</p><h4>Points to spend: <span style="color:#fde047">${S.pts}</span></h4><div class="bf-st">` + Object.entries(names).map(([k, [n, d]]) => `<span>${n} <b style="color:#fde047">${S.st[k]}</b><br><small style="color:#94a3b8;font:700 12px var(--fb)">${d}</small></span><button class="xp-btn" data-s="${k}:1" ${S.pts < 1 ? 'disabled' : ''}>+1</button><button class="xp-btn" data-s="${k}:10" ${S.pts < 10 ? 'disabled' : ''}>+10</button><button class="xp-btn blue" data-s="${k}:all" ${S.pts < 1 ? 'disabled' : ''}>All</button>`).join('') + `</div>
        <p style="color:#94a3b8;font:700 12.5px var(--fb)">👊 ${Math.round(this.meleeDmg())} · ⚔️ ${S.sword ? Math.round(this.swordDmg()) : '—'} · 🍎 ${this.fruit() ? Math.round(this.fruitDmg()) : '—'} damage · 🎯 ${S.kills | 0} defeated</p>`;
      openPanel('📈 Stats', html, (b) => { const [k, n] = b.dataset.s.split(':'), m = n === 'all' ? S.pts : Math.min(S.pts, +n); if (!(m > 0)) return; S.st[k] += m; S.pts -= m; sfx('select'); this.dirty = true; this.statsPanel(); });
    },
    bagPanel() {
      const S = this.S, F = this.fruit();
      const html = `<div class="xp-card ${F ? 'on' : ''}" style="margin-bottom:10px"><div class="big">${F ? F.e : '🚫'}</div><b>${F ? `${F.n} Fruit (eaten)` : 'No fruit eaten'}</b>${F ? `<span>Mastery ${this.mastery()} / 600 · ${F.mv.map((m) => `${m.n} (${m.m})`).join(' · ')}</span>` : '<span>Eat one to get its powers (3 to use them).</span>'}</div><h4>🎒 Your fruits (${S.inv.length} / 8)</h4><div class="xp-grid">`
        + (S.inv.length ? S.inv.map((i, k) => { const G = FR[i]; return `<div class="xp-card"><div class="big">${G.e}</div><b>${G.n}</b><span class="bf-rar" style="background:${RAR[G.r].c}">${RAR[G.r].n}</span><button class="xp-btn" data-e="${k}">Eat</button><button class="xp-btn alt" data-d="${k}">Drop</button></div>`; }).join('') : '<p style="color:#94a3b8">None yet: buy one from the 🍎 Fruit Dealer, roll the 🎲 Gacha, or find one under a tree.</p>') + '</div>';
      openPanel('🍎 Blox Fruits', html, (b) => {
        if (b.dataset.e != null) { const k = +b.dataset.e, i = S.inv[k]; S.inv.splice(k, 1); S.fruit = i; quest('fruits.eat'); this.tool = 'fruit'; this.buddhaT = 0; send({ hd: 'fruit', bz: 0 }); this.big(`${FR[i].e} You ate the ${FR[i].n} Fruit!`, 'Press 3, then Z X C'); sfx('chomp'); puffAt(P.x, P.y + 3, P.z, [FR[i].c, FR[i].c2], 18); this.dirty = true; this.saveNow(); this.bagPanel(); }
        else if (b.dataset.d != null) { S.inv.splice(+b.dataset.d, 1); sfx('click'); this.dirty = true; this.bagPanel(); }
      });
    },
    mapPanel() {
      const S = this.S;
      const html = ISL.map((I, i) => { const d = Math.round(Math.hypot(I.x - P.x, I.z - P.z)), a = Math.atan2(I.x - P.x, -(I.z - P.z)) - (Math.PI - cam.yaw); return `<div class="bf-isl"><b>${esc(I.n)}</b><span style="color:#94a3b8">${I.lv ? `Lv. ${I.lv}+` : 'start'} · ${S.vis.includes(i) ? '✓ visited' : 'not yet'}</span><span style="display:inline-block;transform:rotate(${a.toFixed(2)}rad)">⬆️</span><span style="color:#cbd5e1;width:60px;text-align:right">${d} m</span></div>`; }).join('') + '<p style="color:#94a3b8;font:700 12.5px var(--fb)">Sail there with a boat (the ⚓ Captain at any dock), or have the Captain take you to islands you’ve already been to.</p>';
      openPanel('🗺️ The Sea', html);
    },
  };
  const BAR_BG = new THREE.MeshBasicMaterial({ color: 0x111827 }), BAR_FG = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  function makeWeapon() { const g = new THREE.Group(), o = new THREE.Mesh(BOX, mat(0x6b7280)); o.scale.set(0.3, 0.3, 2.6); o.position.set(0, -1.9, -1.2); g.add(o); const h = new THREE.Mesh(BOX, mat(0x44403c)); h.scale.set(0.9, 0.9, 0.9); h.position.set(0, -1.9, -2.6); g.add(h); g.rotation.x = -0.3; return g; }
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
  addExp(BF);
  window.__rbBF = BF; // for tests
  BF.FR = FR; BF.EN = EN; BF.ISL = ISL; BF.need = need; // (tests too)
})();
