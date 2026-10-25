/* =====================================================================
   BLOXVERSE — DEEP SHAFT. A mining clicker you play down a shaft of your
   own. Swing your pickaxe at the floor (click, tap or E): every layer has
   so much rock to break, and when it goes it drops its seam's ore and you
   fall onto the next one; every few swings a loose pocket gives up a gem.
   Some layers are rich, brittle, dense, glittering or haunted, and every
   25th is sealed with a guardian inside. Creatures come out of the dark:
   hit the lit band to beat them for their ore. Sell ore for cash; buy
   picks, gear, upgrades and diggers (they swing for you, even while you're
   away); forge pickaxes and trinkets out of rare ore, and fuse ten of one
   into one of the next; do quests; rebirth for cores and perks that last.
   Up to eight miners a server, each with a shaft. Saved.
   ===================================================================== */
(() => {
  /* ---- the ore: from the seam when a layer breaks, gems from loose pockets, and what creatures drop ---- */
  const SEAM = [
    { id: 'rock', name: 'Rock', tier: 0, base: 1000, value: 1, color: '#9a9289' },
    { id: 'coal', name: 'Coal', tier: 0, base: 760, value: 3, color: '#4a4750' },
    { id: 'copper', name: 'Copper', tier: 1, base: 340, value: 9, color: '#cc7a44' },
    { id: 'tin', name: 'Tin', tier: 1, base: 250, value: 14, color: '#a9b0ad' },
    { id: 'iron', name: 'Iron', tier: 2, base: 130, value: 30, color: '#b9c2ca' },
    { id: 'nickel', name: 'Nickel', tier: 3, base: 58, value: 75, color: '#cfd6c9' },
    { id: 'silver', name: 'Silver', tier: 4, base: 24, value: 180, color: '#e2ecf5' },
    { id: 'gold', name: 'Gold', tier: 5, base: 9.5, value: 500, color: '#f2c33a' },
    { id: 'platinum', name: 'Platinum', tier: 6, base: 3.4, value: 1500, color: '#d8e4e8' },
    { id: 'emerald', name: 'Emerald', tier: 7, base: 1.25, value: 4400, color: '#42d98d' },
    { id: 'diamond', name: 'Diamond', tier: 8, base: 0.44, value: 13500, color: '#6fe6f0' },
    { id: 'obsidian', name: 'Obsidian', tier: 9, base: 0.15, value: 44000, color: '#8f63f5' },
    { id: 'starstone', name: 'Starstone', tier: 10, base: 0.05, value: 150000, color: '#ff7ad9' },
    { id: 'aetherite', name: 'Aetherite', tier: 11, base: 0.015, value: 520000, color: '#9fe6ff' },
    { id: 'soulglass', name: 'Soulglass', tier: 12, base: 0.004, value: 2000000, color: '#c8fff0' },
    { id: 'riftstone', name: 'Riftstone', tier: 13, base: 0.0011, value: 8500000, color: '#ff5aa8' },
    { id: 'deepfire', name: 'Deepfire', tier: 14, base: 0.00028, value: 36000000, color: '#ff4d1a' },
    { id: 'worldcore', name: 'Worldcore', tier: 15, base: 0.00006, value: 150000000, color: '#fff6cf' },
  ];
  const POCKET = [
    { id: 'gravel', name: 'Gravel', tier: 0, base: 1000, value: 2, color: '#8a8073' },
    { id: 'flint', name: 'Flint', tier: 0, base: 700, value: 6, color: '#5b6169' },
    { id: 'quartz', name: 'Quartz', tier: 1, base: 300, value: 18, color: '#eee6f4' },
    { id: 'amethyst', name: 'Amethyst', tier: 2, base: 120, value: 52, color: '#a97ff5' },
    { id: 'jade', name: 'Jade', tier: 3, base: 50, value: 150, color: '#4fbf8a' },
    { id: 'topaz', name: 'Topaz', tier: 4, base: 20, value: 400, color: '#f0a02a' },
    { id: 'ruby', name: 'Ruby', tier: 5, base: 7.5, value: 1150, color: '#ef4a5e' },
    { id: 'sapphire', name: 'Sapphire', tier: 6, base: 2.8, value: 3400, color: '#5a86f5' },
    { id: 'opal', name: 'Opal', tier: 7, base: 1.0, value: 9800, color: '#7ff0d0' },
    { id: 'moonstone', name: 'Moonstone', tier: 8, base: 0.35, value: 29000, color: '#dfe3ff' },
    { id: 'meteorite', name: 'Meteorite', tier: 9, base: 0.12, value: 88000, color: '#d1743f' },
    { id: 'voidshard', name: 'Void shard', tier: 10, base: 0.04, value: 270000, color: '#c04dff' },
    { id: 'chronite', name: 'Chronite', tier: 11, base: 0.012, value: 920000, color: '#ffd166' },
    { id: 'sunfleck', name: 'Sunfleck', tier: 12, base: 0.003, value: 3400000, color: '#fff0a8' },
    { id: 'duskpearl', name: 'Duskpearl', tier: 13, base: 0.0009, value: 14000000, color: '#8c7bff' },
    { id: 'frostheart', name: 'Frostheart', tier: 14, base: 0.00022, value: 58000000, color: '#a8f4ff' },
    { id: 'eternite', name: 'Eternite', tier: 15, base: 0.00005, value: 240000000, color: '#e9ffb0' },
  ];
  const BEAST_ORES = [
    { id: 'echofang', name: 'Echo fang', tier: 0, value: 6000, color: '#b9a6ff' },
    { id: 'golemcore', name: 'Golem core', tier: 1, value: 24000, color: '#c98f4a' },
    { id: 'emberpearl', name: 'Ember pearl', tier: 2, value: 95000, color: '#ff7a3d' },
    { id: 'silkcrystal', name: 'Silk crystal', tier: 3, value: 340000, color: '#8ff0e6' },
    { id: 'wyrmscale', name: 'Wyrm scale', tier: 4, value: 1200000, color: '#5fe07a' },
    { id: 'voideye', name: 'Void eye', tier: 5, value: 4500000, color: '#e05cff' },
    { id: 'sealheart', name: 'Seal heart', tier: 6, value: 15000000, color: '#ff9ec4' },
  ];
  const ORE = {};
  [SEAM, POCKET, BEAST_ORES].forEach((p) => p.forEach((o) => (ORE[o.id] = o)));
  // ore can come out better than usual: worth 3×, 11× or 45×
  const QUAL = [
    { n: '', mult: 1, chance: 1, color: null },
    { n: 'Pristine', mult: 3, chance: 0.075, color: '#7fe3ff' },
    { n: 'Flawless', mult: 11, chance: 0.011, color: '#ffd45e' },
    { n: 'Perfect', mult: 45, chance: 0.0011, color: '#ff6ff0' },
  ];
  // what a layer can be like
  const MODS = {
    none: { name: '', w: 50, hp: 1, ore: 1, lux: 1, beast: 1, color: '#93816e', note: '' },
    rich: { name: 'Rich vein', w: 12, hp: 1, ore: 2, lux: 1, beast: 1, color: '#ffb340', note: 'drops twice the ore' },
    brittle: { name: 'Brittle rock', w: 12, hp: 0.5, ore: 1, lux: 1, beast: 1, color: '#8ff0e6', note: 'half the rock to break' },
    dense: { name: 'Dense rock', w: 9, hp: 2.4, ore: 3, lux: 1, beast: 1, color: '#b9c2ca', note: 'tough, but pays triple' },
    glitter: { name: 'Glittering', w: 8, hp: 1, ore: 1, lux: 2.6, beast: 1, color: '#ff7ad9', note: 'far better ore' },
    haunted: { name: 'Haunted', w: 7, hp: 1, ore: 1, lux: 1, beast: 4, color: '#ff5a4d', note: 'something lives here' },
    sealed: { name: 'Sealed layer', w: 0, hp: 3.5, ore: 3, lux: 1.8, beast: 1, color: '#ff9ec4', note: 'a guardian waits inside' },
  };
  const BEASTS = [
    { id: 'bat', name: 'Cave bat', min: 1, ore: 'echofang', speed: 52, zone: 22, need: 3, lives: 3, desc: 'Fast, but it telegraphs every dive.' },
    { id: 'golem', name: 'Rock golem', min: 12, ore: 'golemcore', speed: 38, zone: 15, need: 4, lives: 3, desc: 'Slow and heavy. The gaps between plates are small.' },
    { id: 'slug', name: 'Magma slug', min: 30, ore: 'emberpearl', speed: 62, zone: 14, need: 4, lives: 3, desc: 'It leaks heat. Strike the cooled crust.' },
    { id: 'spider', name: 'Crystal spider', min: 55, ore: 'silkcrystal', speed: 78, zone: 12, need: 5, lives: 3, desc: 'Eight legs, one soft joint.' },
    { id: 'wyrm', name: 'Deep wyrm', min: 85, ore: 'wyrmscale', speed: 92, zone: 10, need: 5, lives: 3, desc: 'Scales overlap except when it coils.' },
    { id: 'stalker', name: 'Void stalker', min: 120, ore: 'voideye', speed: 112, zone: 9, need: 6, lives: 3, desc: 'It blinks. That is the only moment you get.' },
  ];
  const WARDEN = { id: 'warden', name: 'Seal warden', ore: 'sealheart', speed: 70, zone: 13, need: 6, lives: 4, boss: true, desc: 'It was set here to keep the shaft shallow.' };
  const PICKS = [
    { name: 'Wooden pick', power: 1, cost: 0 }, { name: 'Stone pick', power: 3, cost: 60 }, { name: 'Copper pick', power: 9, cost: 400 },
    { name: 'Bronze pick', power: 24, cost: 1800 }, { name: 'Iron pick', power: 62, cost: 9000 }, { name: 'Steel pick', power: 155, cost: 42000 },
    { name: 'Silvered pick', power: 390, cost: 190000 }, { name: 'Gold pick', power: 980, cost: 850000 }, { name: 'Platinum pick', power: 2500, cost: 3600000 },
    { name: 'Emerald pick', power: 6400, cost: 16000000 }, { name: 'Diamond pick', power: 16000, cost: 70000000 }, { name: 'Obsidian pick', power: 41000, cost: 300000000 },
    { name: 'Void pick', power: 105000, cost: 1300000000 }, { name: 'Starforged pick', power: 270000, cost: 5600000000 }, { name: 'Aether drill', power: 700000, cost: 24000000000 },
    { name: 'Chrono breaker', power: 1800000, cost: 110000000000 },
  ];
  // the colour of each pick's head (in your hand)
  const PICK_COL = [0x8b5a2b, 0x9a9289, 0xcc7a44, 0xb08d57, 0xb9c2ca, 0x94a3b8, 0xe2ecf5, 0xf2c33a, 0xd8e4e8, 0x42d98d, 0x6fe6f0, 0x8f63f5, 0xc04dff, 0xff7ad9, 0x9fe6ff, 0xffd166];
  const GEAR = {
    lamp: { label: 'Lamp', e: '🏮', blurb: 'better rare-ore odds and far better ore quality',
      tiers: [{ n: 'Tallow candle', c: 0 }, { n: 'Oil lantern', c: 2500 }, { n: 'Carbide lamp', c: 30000 }, { n: 'Arc lamp', c: 400000 }, { n: 'Emerald lens', c: 5000000 }, { n: 'Starlight lamp', c: 70000000 }, { n: 'Voidlight', c: 900000000 }, { n: 'Second sun', c: 1.4e10 }] },
    gloves: { label: 'Gloves', e: '🧤', blurb: 'more critical hits, and harder ones',
      tiers: [{ n: 'Bare hands', c: 0 }, { n: 'Leather gloves', c: 1800 }, { n: 'Padded gloves', c: 22000 }, { n: 'Steel gauntlets', c: 300000 }, { n: 'Weighted grips', c: 4000000 }, { n: 'Obsidian gauntlets', c: 55000000 }, { n: 'Void grips', c: 700000000 }, { n: 'Titan hands', c: 1.1e10 }] },
    cart: { label: 'Ore cart', e: '🛒', blurb: 'every sale worth more, and a chance to double a drop',
      tiers: [{ n: 'Sack', c: 0 }, { n: 'Wheelbarrow', c: 3200 }, { n: 'Wooden cart', c: 38000 }, { n: 'Iron cart', c: 520000 }, { n: 'Rail cart', c: 6500000 }, { n: 'Powered cart', c: 85000000 }, { n: 'Void hopper', c: 1.1e9 }, { n: 'Fold-space cart', c: 1.8e10 }] },
  };
  // forged pickaxes: for good (rebirths too), made from rare ore
  const FORGED = [
    { name: 'Coalforged pick', power: 520, coins: 60000, bonus: '+6% swing power', req: { coal: 250, iron: 120, quartz: 60 } },
    { name: 'Gembound pick', power: 5200, coins: 2500000, bonus: '+12% better ore quality', req: { emerald: 60, sapphire: 30, gold: 150 } },
    { name: 'Voidtouched pick', power: 62000, coins: 8e7, bonus: '+6% critical chance', req: { obsidian: 25, voidshard: 12, diamond: 40 } },
    { name: 'Starforged core', power: 520000, coins: 1.8e9, bonus: 'better rare-ore odds', req: { starstone: 10, meteorite: 8, chronite: 5 } },
    { name: 'Aether edge', power: 4200000, coins: 5e10, bonus: '+25% cash from ore', req: { aetherite: 6, sunfleck: 4, soulglass: 3 } },
    { name: 'Riftbreaker', power: 34000000, coins: 9e11, bonus: '1 swing fewer per loose pocket', req: { riftstone: 3, duskpearl: 2, wyrmscale: 2 } },
    { name: 'Worldcore maul', power: 280000000, coins: 2.5e13, bonus: '+50% swing power', req: { worldcore: 1, eternite: 1, deepfire: 1, frostheart: 1, sealheart: 1 } },
  ];
  const TRINKETS = [
    { id: 'pebble', e: '🪨', name: 'Lucky pebble', desc: 'Rare ore turns up a little more often', coins: 600000, req: { jade: 100, tin: 100 } },
    { id: 'monocle', e: '🧐', name: 'Refiner’s monocle', desc: '+20% cash from every sale', coins: 2500000, req: { quartz: 40, topaz: 20 } },
    { id: 'totem', e: '🗿', name: 'Beast fang totem', desc: '10% wider strike band in fights', coins: 6000000, req: { echofang: 5, golemcore: 3 } },
    { id: 'weight', e: '⚖️', name: 'Chain weight', desc: '+0.4 s to keep a chain going', coins: 1.2e7, req: { nickel: 30, platinum: 20 } },
    { id: 'map', e: '🗺️', name: 'Prospector’s map', desc: '+15% better ore quality', coins: 2.5e8, req: { moonstone: 15, opal: 10 } },
    { id: 'sigil', e: '🔱', name: 'Warden’s sigil', desc: 'One extra life in every fight', coins: 6e9, req: { sealheart: 2, voideye: 1 } },
  ];
  const UPGRADES = [
    { id: 'sharp', e: '🪨', name: 'Sharpening stone', desc: '+2 power a swing', base: 80, mult: 1.55, max: 250 },
    { id: 'crit', e: '🎯', name: 'Lucky strike', desc: '+3% chance of a critical hit', base: 250, mult: 1.9, max: 15 },
    { id: 'value', e: '🏭', name: 'Ore refinery', desc: '+12% cash from every ore sold', base: 200, mult: 1.7, max: 80 },
    { id: 'luck', e: '👁️', name: 'Prospecting eye', desc: 'Better odds of rare ore', base: 600, mult: 2.0, max: 30 },
    { id: 'pocket', e: '🗺️', name: 'Pocket mapping', desc: '1 swing fewer per loose pocket', base: 1200, mult: 2.6, max: 9 },
    { id: 'twin', e: '♊', name: 'Twin seam', desc: '+4% chance a layer drops an extra ore', base: 3000, mult: 1.85, max: 20 },
    { id: 'bane', e: '🗡️', name: 'Beast bane', desc: '6% wider strike band in fights', base: 5000, mult: 2.1, max: 10 },
    { id: 'chain', e: '🥁', name: 'Rhythm training', desc: '+0.15 s to keep a chain going, and +1% chain power', base: 9000, mult: 2.0, max: 12 },
  ];
  const PERKS = [
    { id: 'roots', e: '🌳', name: 'Deep roots', desc: '+15% swing power', cost: 1, max: 25 },
    { id: 'rich', e: '💰', name: 'Rich veins', desc: '+12% cash from ore', cost: 1, max: 25 },
    { id: 'lucky', e: '🍀', name: 'Born lucky', desc: 'Better rare-ore odds', cost: 2, max: 15 },
    { id: 'start', e: '⛏️', name: 'Head start', desc: 'Start each run one pickaxe higher', cost: 3, max: 6 },
    { id: 'crew', e: '👷', name: 'Loyal crew', desc: 'Keep your diggers when you rebirth', cost: 5, max: 1 },
    { id: 'purse', e: '👛', name: 'Deep pockets', desc: 'Keep 25% of your cash when you rebirth', cost: 4, max: 3 },
    { id: 'instinct', e: '🧭', name: 'Pocket instinct', desc: '1 swing fewer per loose pocket', cost: 3, max: 4 },
    { id: 'lure', e: '🪝', name: 'Beast lure', desc: '+1% chance of a creature', cost: 2, max: 5 },
    { id: 'foreman', e: '📣', name: 'Foreman', desc: 'Diggers swing 25% faster', cost: 2, max: 6 },
    { id: 'polish', e: '✨', name: 'Gem polish', desc: '+35% better ore quality', cost: 3, max: 8 },
    { id: 'autosell', e: '🗑️', name: 'Scrap chute', desc: 'Rock, coal, gravel and flint sell themselves', cost: 4, max: 1 },
    { id: 'anchor', e: '⚓', name: 'Gear anchor', desc: 'Keep one tier of each gear when you rebirth', cost: 6, max: 3 },
  ];
  const LAYER_NAMES = ['Topsoil', 'Clay bed', 'Gravel pack', 'Sandstone', 'Shale', 'Limestone', 'Granite', 'Basalt', 'Schist', 'Deep granite', 'Magma shelf', 'Blackrock', 'Voidstone', 'The Hollow'];
  const BANDS = [0x8b6b4a, 0xa0522d, 0x8a8073, 0xc8a26b, 0x5b5f66, 0xcfc6b0, 0x9a8f8a, 0x3f3f46, 0x6b7280, 0x57534e, 0x7c2d12, 0x292524, 0x3b0764, 0x111827];
  const bandOf = (L) => Math.min(LAYER_NAMES.length - 1, Math.floor((L - 1) / 10));
  const BASE_POCKET = 15, FIRST_REBIRTH = 30, REBIRTH_STEP = 15, BASE_ENCOUNTER = 0.025;
  const QUEST_KINDS = [
    { id: 'swing', e: '⛏️', text: (n) => `Take ${n} swings`, roll: () => 25 + Math.floor(Math.random() * 90), pay: 12 },
    { id: 'layer', e: '🧱', text: (n) => `Break ${n} layers`, roll: () => 3 + Math.floor(Math.random() * 9), pay: 260 },
    { id: 'ore', e: '🪨', text: (n) => `Mine ${n} ore`, roll: () => 6 + Math.floor(Math.random() * 16), pay: 150 },
    { id: 'sell', e: '💵', text: (n) => `Sell ore worth $${fmt(n)}`, roll: () => 0, pay: 0.9 },
    { id: 'beast', e: '🦇', text: (n) => `Beat ${n} creature${n > 1 ? 's' : ''}`, roll: () => 1 + Math.floor(Math.random() * 2), pay: 2600 },
    { id: 'pocket', e: '💎', text: (n) => `Crack ${n} loose pockets`, roll: () => 2 + Math.floor(Math.random() * 6), pay: 420 },
    { id: 'crit', e: '💥', text: (n) => `Land ${n} critical hits`, roll: () => 4 + Math.floor(Math.random() * 10), pay: 340 },
    { id: 'fuse', e: '🔥', text: (n) => `Fuse ore ${n} time${n > 1 ? 's' : ''}`, roll: () => 1 + Math.floor(Math.random() * 3), pay: 900 },
    { id: 'chain', e: '🥁', text: (n) => `Reach a chain of ${n}`, roll: () => 15 + Math.floor(Math.random() * 35), pay: 200 },
  ];

  /* ---- numbers ---- */
  function fmt(n) {
    n = Math.floor(n);
    if (!isFinite(n)) return '∞';
    if (n < 1000) return String(n);
    const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
    let i = -1;
    while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
    return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n)) + u[i];
  }
  const hex = (s) => parseInt(String(s).slice(1), 16);
  // a bag holds "gold" and "gold|2" (a Flawless one)
  const keyOf = (id, q) => (q ? id + '|' + q : id);
  const oreOfKey = (k) => ORE[k.split('|')[0]];
  const qualOfKey = (k) => Math.max(0, Math.min(3, parseInt(k.split('|')[1] || '0', 10) || 0));
  const keyValue = (k) => Math.round(oreOfKey(k).value * QUAL[qualOfKey(k)].mult);
  const keyName = (k) => (qualOfKey(k) ? QUAL[qualOfKey(k)].n + ' ' : '') + oreOfKey(k).name;
  const keyColor = (k) => QUAL[qualOfKey(k)].color || oreOfKey(k).color;
  const isScrap = (id) => id === 'rock' || id === 'coal' || id === 'gravel' || id === 'flint';

  // the state you save, and everything worked out from it
  const fresh = () => ({
    cash: 0, layer: 1, hp: 12, mod: 'none', pick: 0, gear: { lamp: 0, gloves: 0, cart: 0 }, forged: 0, trinkets: {},
    up: { sharp: 0, crit: 0, value: 0, luck: 0, pocket: 0, twin: 0, bane: 0, chain: 0 },
    bag: {}, seen: {}, swings: 0, pocketProgress: 0, rebirths: 0, cores: 0, perks: {},
    layersBroken: 0, oresMined: 0, coinsEarned: 0, beasts: 0, bosses: 0, codex: {}, diggers: 0, fused: 0, charges: 0,
    muts: 0, bestChain: 0, best: 1, quests: [], questsDone: 0, lastSeen: Date.now(),
  });
  let S = fresh();
  const perk = (id) => (S.perks && S.perks[id]) || 0;
  const trinket = (id) => !!(S.trinkets && S.trinkets[id]);
  const forgedPower = () => (S.forged > 0 ? FORGED[S.forged - 1].power : 0);
  const forgeMult = () => (S.forged >= 1 ? 1.06 : 1) * (S.forged >= 7 ? 1.5 : 1);
  const bestPickName = () => (S.forged > 0 && forgedPower() > PICKS[S.pick].power ? FORGED[S.forged - 1].name : PICKS[S.pick].name);
  const modOf = () => MODS[S.mod] || MODS.none;
  const baseLayerHp = (l) => Math.max(1, Math.round(12 * Math.pow(1.1, l - 1)));
  const curMaxHp = () => Math.max(1, Math.round(baseLayerHp(S.layer) * modOf().hp));
  const rebirthMult = () => Math.pow(1.25, S.rebirths);
  const basePower = () => Math.max(PICKS[S.pick].power, forgedPower()) + S.up.sharp * 2;
  const critChance = () => Math.min(0.6, S.up.crit * 0.03 + S.gear.gloves * 0.02 + (S.forged >= 3 ? 0.06 : 0));
  const critDamage = () => 3 + S.gear.gloves * 0.3;
  const sellMult = () => (1 + S.up.value * 0.12 + S.gear.cart * 0.12 + perk('rich') * 0.12 + (S.forged >= 5 ? 0.25 : 0) + (trinket('monocle') ? 0.2 : 0)) * (hasItem('cash2') ? 2 : 1);
  const luckSkew = () => S.up.luck * 0.05 + S.gear.lamp * 0.06 + perk('lucky') * 0.04 + (S.forged >= 4 ? 0.1 : 0) + (trinket('pebble') ? 0.05 : 0) + (hasItem('lamp') ? 0.25 : 0);
  const mutChance = () => 1 + S.gear.lamp * 0.25 + S.up.luck * 0.02 + perk('polish') * 0.35 + (S.forged >= 2 ? 0.12 : 0) + (trinket('map') ? 0.15 : 0) + (hasItem('lamp') ? 0.5 : 0);
  const pocketNeed = () => Math.max(4, BASE_POCKET - S.up.pocket - perk('instinct') - (S.forged >= 6 ? 1 : 0));
  const encounterOdds = () => (BASE_ENCOUNTER + perk('lure') * 0.01) * modOf().beast;
  const rebirthAt = () => FIRST_REBIRTH + S.rebirths * REBIRTH_STEP;
  const coresFor = (l) => Math.max(1, Math.floor(Math.pow(l / 10, 1.35)));
  const upCost = (u) => Math.floor(u.base * Math.pow(u.mult, S.up[u.id]));
  const perkCost = (p) => p.cost * (perk(p.id) + 1);
  const diggerCost = () => Math.floor(6000 * Math.pow(1.38, S.diggers));
  const chargeCost = () => Math.max(200, Math.floor(curMaxHp() * 0.9 * (1 + S.layer * 0.02)));
  const autoRate = () => S.diggers * 0.55 * (1 + perk('foreman') * 0.25);
  const isBossLayer = (l) => l % 25 === 0;
  const chainWindow = () => 1500 + S.up.chain * 150 + (trinket('weight') ? 400 : 0);
  const bagWorth = () => { let t = 0; for (const k in S.bag) if (oreOfKey(k)) t += keyValue(k) * S.bag[k]; return Math.round(t * sellMult()); };
  const bagCount = () => Object.keys(S.bag).reduce((a, k) => a + (S.bag[k] | 0), 0);
  const countOre = (id) => Object.keys(S.bag).reduce((a, k) => a + (k.split('|')[0] === id ? S.bag[k] : 0), 0);

  function weights(pool) {
    const depth = Math.min(S.layer + S.rebirths * 12, 400), skew = (1 + depth * 0.02 + luckSkew()) * modOf().lux;
    let total = 0;
    const w = pool.map((o) => { const v = o.base * Math.pow(skew, o.tier); total += v; return v; });
    return { w, total };
  }
  function rollOre(pool) {
    const { w, total } = weights(pool);
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
    return pool[0];
  }
  function rollQuality() {
    const m = mutChance();
    if (Math.random() < QUAL[3].chance * m) return 3;
    if (Math.random() < QUAL[2].chance * m) return 2;
    if (Math.random() < QUAL[1].chance * m) return 1;
    return 0;
  }
  function rollMod(layer) {
    if (isBossLayer(layer)) return 'sealed';
    const ks = Object.keys(MODS).filter((k) => MODS[k].w > 0);
    let r = Math.random() * ks.reduce((a, k) => a + MODS[k].w, 0);
    for (const k of ks) { r -= MODS[k].w; if (r <= 0) return k; }
    return 'none';
  }

  /* ---- the camp: eight shafts (each a 10×10 hole), the ore exchange, the forge, the quest board ---- */
  const SLOTS = [[-36, -16], [-12, -16], [12, -16], [36, -16], [-36, 16], [-12, 16], [12, 16], [36, 16]], HW = 5;
  const FY = (L) => -6 - 2 * (L - 1); // (the top of layer L's floor)
  const EXCHANGE = [-47, 0], FORGE = [47, 0], BOARD = [0, -6];
  const mats = new Map(), M = (c, o) => { const k = c + (o ? JSON.stringify(o) : ''); let m = mats.get(k); if (!m) { m = new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {})); mats.set(k, m); } return m; };
  const box = (g, m, sx, sy, sz, x, y, z) => { const o = new THREE.Mesh(BOX, typeof m === 'number' ? M(m) : m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); g.add(o); return o; };
  // the creatures, out of boxes
  function beastModel(id) {
    const g = new THREE.Group(), eye = (x, y, z, c = 0xff9b4a, s = 0.28) => box(g, M(c, { emissive: c }), s, s, 0.12, x, y, z);
    const parts = {};
    if (id === 'bat') {
      box(g, 0x3a2f4d, 1, 1.3, 0.9, 0, 0, 0); box(g, 0x3a2f4d, 0.7, 0.6, 0.7, 0, 0.9, 0); eye(-0.18, 0.95, 0.36); eye(0.18, 0.95, 0.36);
      for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(s * 0.5, 0.2, 0); box(w, 0x5b4a7a, 1.8, 0.1, 1.1, s * 0.9, 0, 0); g.add(w); parts[s < 0 ? 'wl' : 'wr'] = w; }
    } else if (id === 'golem') {
      box(g, 0x6b5440, 2.2, 1.8, 1.4, 0, 0, 0); box(g, 0x7c6248, 1.4, 1.1, 1.1, 0, 1.45, 0); eye(-0.3, 1.5, 0.56); eye(0.3, 1.5, 0.56);
      box(g, 0x6b5440, 0.7, 1.8, 0.7, -1.5, -0.2, 0); box(g, 0x6b5440, 0.7, 1.8, 0.7, 1.5, -0.2, 0); box(g, 0xc98f4a, 0.6, 0.6, 0.1, 0, 0.1, 0.71, M(0xc98f4a, { emissive: 0x7a4a10 }));
    } else if (id === 'slug') {
      box(g, 0x4a2418, 1.4, 0.9, 2.8, 0, -0.4, 0); box(g, 0x7a2e12, 1.2, 1, 1.1, 0, 0.1, 1.1);
      for (const s of [-1, 1]) { box(g, 0x7a2e12, 0.15, 0.8, 0.15, s * 0.3, 0.9, 1.3); eye(s * 0.3, 1.35, 1.3, 0xffd166, 0.24); }
      for (let k = 0; k < 4; k++) box(g, M(0xff7a3d, { emissive: 0xb43c0c }), 0.3, 0.12, 0.3, (k % 2 - 0.5) * 0.7, 0.06, -0.8 + k * 0.4);
    } else if (id === 'spider') {
      box(g, 0x16323a, 1.6, 1.1, 1.8, 0, 0, -0.4); box(g, 0x1f4954, 1.1, 0.8, 1, 0, 0.1, 0.9); eye(-0.2, 0.3, 1.41, 0xff5c7a, 0.2); eye(0.2, 0.3, 1.41, 0xff5c7a, 0.2);
      parts.legs = [];
      for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const l = new THREE.Group(); l.position.set(s * 0.7, 0, 0.6 - k * 0.5); box(l, M(0x8ff0e6, { emissive: 0x1d5f59 }), 1.6, 0.14, 0.14, s * 0.8, -0.35, 0); l.rotation.z = s * -0.3; g.add(l); parts.legs.push(l); }
    } else if (id === 'wyrm') {
      parts.segs = [];
      for (let k = 0; k < 6; k++) { const s = box(g, k === 0 ? 0x2f7a3e : 0x1e3a24, 1 - k * 0.08, 1 - k * 0.08, 1, 0, 0.2 - k * 0.1, 0.9 - k * 0.8); parts.segs.push(s); }
      eye(-0.25, 0.4, 1.41, 0xffd166, 0.2); eye(0.25, 0.4, 1.41, 0xffd166, 0.2);
    } else if (id === 'stalker') {
      box(g, 0x25103a, 1.6, 2.6, 1.2, 0, 0.4, 0); box(g, 0x0d0714, 1, 1, 0.1, 0, 0.9, 0.62);
      parts.eye = box(g, M(0xe05cff, { emissive: 0xe05cff }), 0.45, 0.45, 0.12, 0, 0.9, 0.7);
      for (const s of [-1, 1]) box(g, 0x25103a, 0.25, 2.2, 0.25, s * 1.05, -0.2, 0);
    } else {
      box(g, 0x2a1220, 2.2, 3.2, 1.2, 0, 0.6, 0); box(g, 0x3d1a2e, 2.8, 0.5, 1.4, 0, 2.1, 0);
      parts.eye = box(g, M(0xff9ec4, { emissive: 0xff9ec4 }), 0.6, 0.6, 0.12, 0, 1.2, 0.62);
      box(g, M(0xff9ec4, { emissive: 0x7a2a50 }), 0.15, 2.4, 0.1, 0, 0.6, 0.63); box(g, M(0xff9ec4, { emissive: 0x7a2a50 }), 1.6, 0.15, 0.1, 0, 0.9, 0.63);
    }
    g.userData.parts = parts; g.userData.kind = id;
    return g;
  }

  const css = () => {
    if (document.getElementById('dsCss')) return;
    const st = document.createElement('style'); st.id = 'dsCss';
    st.textContent = `
#dsBar{position:absolute;right:12px;top:50%;transform:translateY(-50%);width:228px;padding:10px 12px 11px;border-radius:16px;background:linear-gradient(180deg,rgba(41,33,27,.92),rgba(18,14,12,.94));border:2px solid rgba(255,179,64,.25);box-shadow:0 4px 0 rgba(0,0,0,.35);font:700 11.5px/1.25 var(--fb);color:#d6c6b1;pointer-events:none}
#dsBar .hd{display:flex;justify-content:space-between;align-items:baseline;gap:6px}#dsBar .hd b{font:600 15px var(--fh);color:#f7e9d6}
#dsBar .md{display:inline-block;margin:3px 0 2px;padding:1px 8px;border-radius:99px;border:1px solid currentColor;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em}
#dsBar .lb{display:flex;justify-content:space-between;margin-top:6px;color:#93816e}#dsBar .lb span:last-child{color:#f3e5d2}
#dsBar .bar{height:9px;border-radius:5px;background:#0b0807;overflow:hidden;margin-top:3px;box-shadow:inset 0 1px 3px rgba(0,0,0,.8)}#dsBar .bar i{display:block;height:100%;border-radius:5px}
#dsBar .ft{margin-top:7px;color:#b8a48c;font-size:11px}
.dsFloat{position:absolute;transform:translate(-50%,-50%);font:600 19px var(--fh);text-shadow:0 2px 3px rgba(0,0,0,.9),0 0 14px currentColor;pointer-events:none;white-space:nowrap;animation:dsUp .9s cubic-bezier(.2,.7,.3,1) forwards}
.dsFloat.big{font-size:23px}
@keyframes dsUp{0%{opacity:0;margin-top:6px}18%{opacity:1;margin-top:-4px}100%{opacity:0;margin-top:-70px}}
#dsFight{position:absolute;left:50%;bottom:120px;transform:translateX(-50%);width:min(500px,92vw);padding:12px 14px 14px;border-radius:18px;background:linear-gradient(180deg,rgba(46,22,20,.95),rgba(18,10,10,.96));border:2px solid #7c3025;box-shadow:0 0 40px rgba(255,90,77,.35),0 4px 0 rgba(0,0,0,.4);pointer-events:auto;text-align:center;color:#f5e7d3;font:700 13px var(--fb)}
#dsFight .tt{font:600 19px var(--fh);color:#ffd9d0}#dsFight .ds{color:#c9b6a8;font-size:12px;margin:2px 0 6px}
#dsFight .lv{display:flex;gap:5px;justify-content:center;margin-bottom:8px;font-size:16px}
#dsFight .tr{position:relative;height:42px;border-radius:10px;overflow:hidden;background:repeating-linear-gradient(45deg,rgba(255,255,255,.03) 0 10px,transparent 10px 20px),#140c0c;border:1px solid #57534e}
#dsFight .zn{position:absolute;top:0;bottom:0;background:linear-gradient(180deg,rgba(88,224,204,.45),rgba(88,224,204,.12));border-left:2px solid #58e0cc;border-right:2px solid #58e0cc}
#dsFight .mk{position:absolute;top:-3px;bottom:-3px;width:6px;margin-left:-3px;border-radius:3px;background:linear-gradient(180deg,#fff3d8,#ffb340);box-shadow:0 0 16px 3px rgba(255,179,64,.8)}
#dsFight .pp{display:flex;gap:6px;margin:9px 0 6px}#dsFight .pp i{flex:1;height:9px;border-radius:3px;background:#2a2020}#dsFight .pp i.hit{background:linear-gradient(90deg,#177f74,#58e0cc);box-shadow:0 0 10px rgba(88,224,204,.6)}
#dsFight .msg{min-height:18px;margin-bottom:8px;color:#e9dbc7}
#dsFight .bt{display:flex;gap:8px}#dsFight .bt .xp-btn{flex:1;padding:12px}
.dsDot{display:inline-block;width:12px;height:12px;border-radius:3px;transform:rotate(45deg);margin-right:8px;box-shadow:0 0 8px currentColor;background:currentColor;vertical-align:-1px}
.dsReq{display:inline-block;margin:3px 4px 0 0;padding:1px 8px;border-radius:99px;border:1px solid #57534e;font-size:11px}.dsReq.ok{border-color:#177f74;color:#58e0cc}.dsReq.no{border-color:#7c3025;color:#f8a493}
@media (max-width:640px){#dsBar{width:150px;top:58%;right:8px;padding:7px 9px;font-size:10px;background:linear-gradient(180deg,rgba(41,33,27,.8),rgba(18,14,12,.84))}#dsBar .hd b{font-size:13px}#dsFight{bottom:170px}}`;
    document.head.append(st);
  };

  const DS = {
    id: 'shaft', code: 'ds', genre: 'Simulator', rank: 0.0006, name: 'Deep Shaft', emoji: '⛏️', max: 8, stat: 'Depth', killY: -1e7, camDist: 16, music: true,
    land: { theme: 'desert', box: [-56, -34, 56, 34], fence: 'wood', extras: ['crystals'] },
    color: 'linear-gradient(135deg,#a85c08,#1a1310 60%,#58e0cc)',
    desc: 'Dig down your own mine shaft, one layer at a time: click (or tap, or press E) to swing your pickaxe at the floor. Each layer drops its seam’s ore, loose pockets give up gems, and every 25th layer is sealed with a guardian. Beat the creatures that come out of the dark, sell your ore for better picks, gear and diggers who dig for you (even while you’re away), forge pickaxes and trinkets, do quests, and rebirth for perks that last.',
    welcome: 'Your shaft is the open one: press E at its edge (or jump in) and start digging!',
    build() {
      sky('#7dd3fc', '#fde68a');
      css();
      // the camp's floor, with a hole for each shaft
      const strip = (x0, x1, z0, z1) => slab((x0 + x1) / 2, 0, (z0 + z1) / 2, x1 - x0, z1 - z0, 0xb08a5a, { sy: 2 });
      const X = [-56, -41, -31, -17, -7, 7, 17, 31, 41, 56];
      strip(-56, 56, -34, -21); strip(-56, 56, -11, 11); strip(-56, 56, 21, 34);
      for (const [z0, z1] of [[-21, -11], [11, 21]]) for (let k = 0; k < X.length; k += 2) strip(X[k], X[k + 1], z0, z1);
      // each shaft: a timber rim, a headframe with its wheel, a grate over it till it's yours, and its sign
      this.shafts = SLOTS.map(([x, z], k) => {
        const back = z < 0 ? -1 : 1; // (the headframe stands on the far side, away from the camp's middle)
        for (const [dx, dz, sx, sz] of [[0, -HW - 0.4, 11.6, 0.8], [0, HW + 0.4, 11.6, 0.8], [-HW - 0.4, 0, 0.8, 10], [HW + 0.4, 0, 0.8, 10]]) part({ x: x + dx, y: 0.15, z: z + dz, sx, sy: 0.3, sz, c: 0x6b4a2b, solid: false });
        for (const dx of [-HW - 1, HW + 1]) part({ x: x + dx, y: 5, z: z + back * (HW + 1), sx: 0.8, sy: 10, sz: 0.8, c: 0x7c2d12 });
        part({ x, y: 10.2, z: z + back * (HW + 1), sx: 2 * HW + 3, sy: 0.7, sz: 0.9, c: 0x9a3412, solid: false });
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.22, 6, 18), M(0x334155)); wheel.position.set(x, 11.8, z + back * (HW + 1)); place.add(wheel);
        const cover = part({ x, y: -0.2, z, sx: 2 * HW, sy: 0.4, sz: 2 * HW, c: 0x292524, plain: true });
        for (let i = -2; i <= 2; i++) part({ x: x + i * 2, y: 0.05, z, sx: 0.25, sy: 0.12, sz: 2 * HW, c: 0x57534e, solid: false, plain: true, grate: k });
        return { k, x, z, back, wheel, cover, owner: null, name: '', ly: 1, sign: null, signTxt: '', signAt: 0 };
      });
      // the ore exchange, the forge, the quest board
      const [ex, ez] = EXCHANGE;
      part({ x: ex, y: 3, z: ez, sx: 6, sy: 6, sz: 9, c: 0xd6c6b1 }); part({ x: ex, y: 6.4, z: ez, sx: 7, sy: 0.8, sz: 10, c: 0x7c2d12 });
      part({ x: ex + 3.1, y: 1.6, z: ez, sx: 0.4, sy: 1.2, sz: 6, c: 0x6b4a2b }); part({ x: ex + 3.1, y: 2.4, z: ez, sx: 0.6, sy: 0.3, sz: 6.4, c: 0x92400e });
      const l1 = label('🏦 Ore Exchange', { size: 1.4 }); l1.position.set(ex, 8.4, ez); place.add(l1);
      const [fx, fz] = FORGE;
      part({ x: fx + 1, y: 2.6, z: fz - 2, sx: 4, sy: 5.2, sz: 4, c: 0x44403c }); part({ x: fx - 0.95, y: 1.6, z: fz - 2, sx: 0.2, sy: 1.6, sz: 2, c: 0xff6a00, neon: true, solid: false });
      part({ x: fx - 1, y: 0.8, z: fz + 2.5, sx: 2.4, sy: 1.6, sz: 1.2, c: 0x334155 }); part({ x: fx - 1, y: 1.85, z: fz + 2.5, sx: 3, sy: 0.5, sz: 1.4, c: 0x475569 });
      const l2 = label('🔨 Forge', { size: 1.4 }); l2.position.set(fx, 7.4, fz); place.add(l2);
      const [bx, bz] = BOARD;
      for (const dx of [-2.6, 2.6]) part({ x: bx + dx, y: 2, z: bz, sx: 0.4, sy: 4, sz: 0.4, c: 0x6b4a2b });
      part({ x: bx, y: 3, z: bz, sx: 5.6, sy: 2.6, sz: 0.3, c: 0xa16207 });
      const l3 = label('📜 Quests', { size: 1.2 }); l3.position.set(bx, 5.4, bz); place.add(l3);
      const t = label('⛏️ DEEP SHAFT', { size: 4, color: '#ffb340' }); t.position.set(0, 16, -30); place.add(t);
    },
    pres() { return { sh: -1, ct: 0, ly: 1, rb: 0 }; },
    async enter() {
      css();
      const s = await kvGet('ds');
      S = Object.assign(fresh(), s && typeof s === 'object' ? s : {});
      const num = (v, d = 0) => (Number.isFinite(+v) && +v >= 0 ? +v : d), obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
      for (const k of ['cash', 'cores', 'coinsEarned', 'swings', 'layersBroken', 'oresMined', 'beasts', 'bosses', 'diggers', 'fused', 'charges', 'muts', 'bestChain', 'questsDone', 'pocketProgress']) S[k] = num(S[k]);
      S.layer = Math.max(1, Math.floor(num(S.layer, 1))); S.best = Math.max(S.layer, Math.floor(num(S.best, 1))); S.rebirths = Math.floor(num(S.rebirths));
      S.pick = clamp(Math.floor(num(S.pick)), 0, PICKS.length - 1); S.forged = clamp(Math.floor(num(S.forged)), 0, FORGED.length); S.diggers = Math.min(30, Math.floor(S.diggers));
      S.gear = Object.assign({ lamp: 0, gloves: 0, cart: 0 }, obj(S.gear)); for (const g in GEAR) S.gear[g] = clamp(Math.floor(num(S.gear[g])), 0, GEAR[g].tiers.length - 1);
      S.up = Object.assign(fresh().up, obj(S.up)); for (const u of UPGRADES) S.up[u.id] = clamp(Math.floor(num(S.up[u.id])), 0, u.max);
      S.perks = obj(S.perks); for (const p of PERKS) if (S.perks[p.id] != null) S.perks[p.id] = clamp(Math.floor(num(S.perks[p.id])), 0, p.max);
      S.trinkets = obj(S.trinkets); S.seen = obj(S.seen); S.codex = obj(S.codex);
      S.bag = obj(S.bag); for (const k of Object.keys(S.bag)) if (!oreOfKey(k) || !(S.bag[k] > 0)) delete S.bag[k]; else S.bag[k] = Math.floor(S.bag[k]);
      if (!MODS[S.mod]) S.mod = rollMod(S.layer);
      if (!(S.hp > 0) || S.hp > curMaxHp()) S.hp = curMaxHp();
      S.quests = (Array.isArray(S.quests) ? S.quests : []).filter((q) => q && QUEST_KINDS.some((k) => k.id === q.kind) && q.target > 0).slice(0, 3);
      this.fillQuests();
      this.mySlot = null; this.ct = 0; this.chain = 0; this.chainAt = 0; this.swAt = 0; this.swingT = 0; this.acc = 0; this.fight = null; this.beast = null;
      this.viewL = -1; this.viewMod = ''; this.viewAt = 0; this.floor = null; this.diggers = []; this.floats = []; this.pickG = null; this.pan = null;
      this.dirty = false; this.saveAt = performance.now() + 15000; this.sentAt = 0; this.sent = ''; this.barHtml = ''; this.dmgAt = 0; this.barAt = 0; this.awaying = false;
      this.bar = document.createElement('div'); this.bar.id = 'dsBar'; $('#xhud').append(this.bar);
      questMax('shaft.layer', S.best); questMax('shaft.rebirth', S.rebirths); questMax('shaft.warden', S.bosses);
      this.claim();
      this.away();
    },
    leave() {
      if (S) { this.save(); }
      this.endFight(null);
      for (const a of this.diggers) dropAvatar(a); this.diggers = [];
      if (this.pickG && this.pickG.parent) this.pickG.parent.remove(this.pickG); this.pickG = null;
      if (this.bar) { this.bar.remove(); this.bar = null; }
      for (const f of this.floats) f.remove(); this.floats = [];
      P.frozen = false;
    },
    save() { S.lastSeen = Date.now(); this.dirty = false; this.saveAt = performance.now() + 15000; return kvSet('ds', S); },
    state() { return S; }, // (for tests)

    /* ---- your shaft: the first free one (whoever claimed first keeps it if two pick the same) ---- */
    claim() {
      const taken = new Set(players().filter((p) => !p.me && p.pr.sh >= 0).map((p) => p.pr.sh | 0));
      const k = SLOTS.map((_, i) => i).find((i) => !taken.has(i));
      this.mySlot = k == null ? null : k; this.ct = Date.now();
      if (k == null) toast('Every shaft is taken — try another server', '#fca5a5');
      this.send(true); this.peers();
    },
    peers() {
      if (!this.shafts) return;
      const claims = players().filter((p) => !p.me && p.pr.sh >= 0 && p.pr.sh < SLOTS.length).map((p) => ({ peer: p.peer, k: p.pr.sh | 0, ct: +p.pr.ct || 0, pr: p.pr }));
      if (this.mySlot != null) claims.push({ peer: myPeer(), k: this.mySlot, ct: this.ct, me: true });
      for (const sh of this.shafts) {
        const c = claims.filter((x) => x.k === sh.k).sort((a, b) => a.ct - b.ct || (a.peer < b.peer ? -1 : 1))[0];
        sh.owner = c ? c.peer : null; sh.mine = !!(c && c.me); sh.name = c ? (c.me ? Net.name : String(c.pr.nm || 'Player').slice(0, 20)) : '';
        sh.ly = c ? (c.me ? S.layer : Math.max(1, +c.pr.ly | 0)) : 1; sh.rb = c ? (c.me ? S.rebirths : +c.pr.rb | 0) : 0;
        // only your own shaft is open
        sh.cover.solid = !sh.mine; sh.cover.m.visible = !sh.mine;
        for (const p of parts) if (p.grate === sh.k) p.m.visible = !sh.mine;
        this.signFor(sh);
      }
      if (this.mySlot != null && !this.shafts[this.mySlot].mine) { this.mySlot = null; this.claim(); respawn(true); }
    },
    signFor(sh, force) {
      const txt = sh.owner ? `${sh.mine ? '⭐ ' : ''}${sh.name}\n⛏️ Layer ${sh.ly}${sh.rb ? ` · 🔁${sh.rb}` : ''}` : 'Free shaft';
      if (txt === sh.signTxt || (!force && performance.now() < sh.signAt)) return;
      sh.signTxt = txt; sh.signAt = performance.now() + 2500;
      if (sh.sign) { place.remove(sh.sign); sh.sign.material.map.dispose(); sh.sign.material.dispose(); }
      sh.sign = label(txt, { size: 1.2, color: sh.mine ? '#fde68a' : '#fff', bg: 'rgba(15,23,42,.65)' }); sh.sign.position.set(sh.x, 13.8, sh.z + sh.back * (HW + 1)); place.add(sh.sign);
    },
    send(now) {
      const t = performance.now(), body = { sh: this.mySlot == null ? -1 : this.mySlot, ct: this.ct, ly: S.layer, rb: S.rebirths }, k = JSON.stringify(body);
      if (!now && (k === this.sent || t - this.sentAt < 1000)) return;
      this.sent = k; this.sentAt = t; send(body);
    },
    spawn() {
      if (this.mySlot == null) return [0, 0.6, 4, 0];
      const [x, z] = SLOTS[this.mySlot], f = z < 0 ? 1 : -1; // (on the camp side of your shaft, facing it)
      return [x, 0.6, z + f * (HW + 3), f > 0 ? 0 : Math.PI];
    },
    statOf(pr, isMe) { return isMe ? `${S.layer}${S.rebirths ? ` 🔁${S.rebirths}` : ''}` : `${Math.max(1, +pr.ly | 0)}${+pr.rb ? ` 🔁${+pr.rb | 0}` : ''}`; },
    sortKey(pr, isMe) { return isMe ? S.rebirths * 1e6 + S.layer : (+pr.rb | 0) * 1e6 + (+pr.ly | 0); },

    /* ---- in your shaft ---- */
    inShaft() { if (this.mySlot == null) return false; const [x, z] = SLOTS[this.mySlot]; return Math.abs(P.x - x) < HW + 0.6 && Math.abs(P.z - z) < HW + 0.6 && P.y < 0.4; },
    onFloor() { return this.inShaft() && P.y < FY(S.layer) + 6 && !P.dead; },
    goDown() {
      if (this.mySlot == null) return;
      this.drawShaft();
      const [x, z] = SLOTS[this.mySlot];
      Object.assign(P, { x: x - 2, y: FY(S.layer) + 0.6, z, vx: 0, vy: 0, vz: 0 }); P.ground = null;
      cam.pitch = Math.min(cam.pitch, -0.75);
      sfx('whoosh'); toast(`⛏️ Layer ${S.layer} · ${LAYER_NAMES[bandOf(S.layer)]}`, '#ffb340');
    },
    goUp() { if (this.fight) return; const s = this.spawn(); Object.assign(P, { x: s[0], y: s[1], z: s[2], vx: 0, vy: 0, vz: 0, yaw: s[3] }); P.ground = null; sfx('whoosh'); },
    // what you see of your shaft: its walls (from the top all the way down), the floor you're digging, the rock you've
    // dug through in stripes, ore glinting in the walls and a couple of lanterns; only yours, rebuilt as you go down
    drawShaft() {
      if (this.mySlot == null) return;
      const L = S.layer, [x, z] = SLOTS[this.mySlot], y0 = FY(L), o = { ds: true, plain: true }, quiet = (p) => { p.m.userData.noShadow = true; p.m.castShadow = false; return p; };
      removeParts((p) => p.ds);
      this.viewL = L; this.viewMod = S.mod; this.viewAt = performance.now() + 250;
      const depth = -y0 + 10;
      for (const [dx, dz, sx, sz] of [[0, -HW - 0.5, 2 * HW + 2, 1], [0, HW + 0.5, 2 * HW + 2, 1], [-HW - 0.5, 0, 1, 2 * HW], [HW + 0.5, 0, 1, 2 * HW]]) quiet(part(Object.assign({ x: x + dx, y: -depth / 2 - 0.2, z: z + dz, sx, sy: depth, sz, c: 0x2b231e }, o)));
      // the floor: this layer's rock, in its layer type's colour
      const md = modOf(), base = new THREE.Color(BANDS[bandOf(L)]);
      if (S.mod !== 'none') base.lerp(new THREE.Color(hex(md.color)), S.mod === 'sealed' ? 0.55 : 0.28);
      this.floorCol = base;
      this.floor = part({ x, y: y0 - 1, z, sx: 2 * HW, sy: 2, sz: 2 * HW, c: base.getHex(), ds: true, dsFloor: true });
      // the layers you've dug through, in stripes up the walls
      for (let k = 0; k < 9; k++) {
        const Lk = L - 1 - k; if (Lk < 1) break;
        const c = BANDS[bandOf(Lk)], yy = y0 + 1 + 2 * k, sh = k % 2 ? 0.92 : 1;
        const col = new THREE.Color(c).multiplyScalar(sh).getHex();
        for (const [dx, dz, sx, sz] of [[0, -HW + 0.06, 2 * HW, 0.1], [0, HW - 0.06, 2 * HW, 0.1], [-HW + 0.06, 0, 0.1, 2 * HW], [HW - 0.06, 0, 0.1, 2 * HW]]) quiet(part(Object.assign({ x: x + dx, y: yy, z: z + dz, sx, sy: 1.96, sz, c: col, solid: false }, o)));
      }
      // ore glinting in the walls (the better the odds here, the better what you see), and lanterns
      const r = mulberry(L * 7919 + 13);
      for (let k = 0; k < 7; k++) {
        const ore = SEAM[Math.min(SEAM.length - 1, Math.floor(Math.pow(r(), 2.2) * (3 + bandOf(L) * 1.2)))], side = k % 4, u = (r() - 0.5) * (2 * HW - 2), yy = y0 + 0.6 + r() * 7;
        const [gx, gz] = side === 0 ? [u, -HW + 0.12] : side === 1 ? [u, HW - 0.12] : side === 2 ? [-HW + 0.12, u] : [HW - 0.12, u];
        quiet(part({ x: x + gx, y: yy, z: z + gz, sx: 0.4 + r() * 0.3, sy: 0.4 + r() * 0.3, sz: 0.4, c: hex(ore.color), neon: true, solid: false, ds: true }));
      }
      for (const s of [-1, 1]) quiet(part({ x: x + s * (HW - 0.12), y: y0 + 2.4, z: z + s * 2, sx: 0.22, sy: 0.4, sz: 0.4, c: 0xffb340, neon: true, solid: false, ds: true }));
      // a sealed layer: the seal across the floor
      if (S.mod === 'sealed') for (const [dx, dz, sx, sz] of [[0, -3, 6.2, 0.3], [0, 3, 6.2, 0.3], [-3, 0, 0.3, 6.2], [3, 0, 0.3, 6.2], [0, 0, 1.4, 1.4]]) quiet(part({ x: x + dx, y: y0 + 0.03, z: z + dz, sx, sy: 0.06, sz, c: 0xff9ec4, neon: true, solid: false, ds: true }));
      this.placeDiggers();
      // you were standing on the layer that broke: down you go (and never through)
      if (this.inShaft() && P.y < y0 - 1.5) { P.y = y0 + 0.6; P.vy = 0; }
    },
    // your crew (up to four of them show), swinging in the corners
    placeDiggers() {
      const want = Math.min(4, S.diggers);
      while (this.diggers.length > want) dropAvatar(this.diggers.pop());
      if (this.mySlot == null) return;
      const [x, z] = SLOTS[this.mySlot], y0 = FY(S.layer);
      while (this.diggers.length < want) {
        const i = this.diggers.length, r = mulberry(i * 31 + 5), av = okAv([Math.floor(r() * 6), Math.floor(r() * 10), Math.floor(r() * 8), Math.floor(r() * 12), Math.floor(r() * 9), 0, 0, Math.floor(r() * 7), 0]);
        const a = makeAvatar(av, '👷', false); a.g.scale.setScalar(0.72); scene.add(a.g);
        const p = new THREE.Group(); box(p, 0x6b4a2b, 0.25, 3, 0.25, 0, 0, 0); box(p, 0x9a9289, 2.2, 0.35, 0.35, 0, 1.4, 0); p.position.set(0, -1.9, -0.4); p.rotation.x = -Math.PI / 2 + 0.3; a.armR.add(p);
        a.ph = r() * 6; this.diggers.push(a);
      }
      this.diggers.forEach((a, i) => { const sx = i % 2 ? 1 : -1, sz = i < 2 ? -1 : 1; a.g.position.set(x + sx * 3.9, y0, z + sz * 3.9); a.g.rotation.y = Math.atan2(sx, sz); });
    },

    /* ---- digging ---- */
    swing(auto) {
      if (this.fight) return;
      const now = performance.now();
      if (!auto) {
        if (now - this.swAt < 70) return; // (no faster than a person can click)
        this.swAt = now;
        this.chain = now - this.chainAt < chainWindow() ? this.chain + 1 : 1; this.chainAt = now;
        if (this.chain > S.bestChain) S.bestChain = this.chain;
        for (const q of S.quests) if (q.kind === 'chain') q.progress = Math.max(q.progress, Math.min(q.target, this.chain));
      }
      const crit = !auto && Math.random() < critChance();
      const cm = 1 + Math.min(1.2, Math.floor(this.chain / 8) * (0.05 + S.up.chain * 0.01));
      const power = basePower() * rebirthMult() * (1 + perk('roots') * 0.15) * forgeMult() * (auto ? 0.4 : cm);
      const dmg = power * (crit ? critDamage() : 1);
      S.hp -= dmg; S.swings++; S.pocketProgress++; this.dirty = true;
      this.qt('swing', 1); if (crit) this.qt('crit', 1);
      if (!auto) {
        this.swingT = 0.25;
        const [x, z] = SLOTS[this.mySlot], y0 = FY(S.layer);
        this.float((crit ? 'CRIT −' : '−') + fmt(dmg), crit ? '#ff9b4a' : '#f3e5d2', crit, x + (Math.random() - 0.5) * 3, y0 + 0.5, z + (Math.random() - 0.5) * 3);
        sfx(crit ? 'crunch' : 'dig', { pitch: 0.9 + Math.random() * 0.25, gap: 40 });
        puffAt(P.x - Math.sin(P.yaw) * 1.6, y0 + 0.3, P.z - Math.cos(P.yaw) * 1.6, [this.floorCol ? this.floorCol.getHex() : 0x8b6b4a, 0xd6c6b1], crit ? 10 : 5);
      }
      if (S.pocketProgress >= pocketNeed()) {
        S.pocketProgress = 0;
        const ore = rollOre(POCKET);
        this.gainOre(ore, 1, auto); this.qt('pocket', 1);
        if (!auto) { this.floatOre(`+1 ${ore.name}`, ore.color, false); sfx('unlock', { gap: 80 }); }
      }
      if (S.hp <= 0) this.breakLayer(auto);
    },
    gainOre(ore, n, quiet) {
      for (let i = 0; i < n; i++) {
        const q = rollQuality(), dup = Math.random() < S.gear.cart * 0.01 ? 2 : 1, k = keyOf(ore.id, q);
        if (q > 0) S.muts++;
        if (q === 0 && isScrap(ore.id) && perk('autosell')) this.addCash(Math.round(ore.value * dup * sellMult()));
        else S.bag[k] = (S.bag[k] || 0) + dup;
        S.seen[ore.id] = (S.seen[ore.id] || 0) + dup; S.oresMined += dup;
        if (q > 0 && !quiet) { this.floatOre(`${QUAL[q].n.toUpperCase()} ${ore.name}!`, QUAL[q].color, true); say(`✨ ${QUAL[q].n} ${ore.name}: worth ${QUAL[q].mult}×`, QUAL[q].color); sfx(q >= 2 ? 'win' : 'magic'); }
      }
      this.qt('ore', n);
      if (!quiet && !this.fight && Math.random() < encounterOdds()) this.startFight(false);
    },
    breakLayer(quiet) {
      const boss = S.mod === 'sealed', ore = rollOre(SEAM), n = modOf().ore + (Math.random() < S.up.twin * 0.04 ? 1 : 0), was = S.layer;
      this.gainOre(ore, n, quiet);
      S.layersBroken++; this.qt('layer', 1);
      S.layer++; S.mod = rollMod(S.layer); S.hp = curMaxHp(); this.dirty = true;
      if (S.layer > S.best) { S.best = S.layer; questMax('shaft.layer', S.best); if (S.best % 10 === 0) earn(2, `reached layer ${S.best} of your shaft`); }
      if (!quiet) {
        sfx('break');
        this.floatOre(`${n > 1 ? n + '× ' : ''}${ore.name}`, ore.color, n > 1 || ore.tier >= 5);
        const md = modOf();
        if (md.name) setTimeout(() => this.floatOre(`${S.mod === 'sealed' ? '🛡️' : '✨'} ${md.name}: ${md.note}`, md.color, true), 350);
        if (bandOf(S.layer) !== bandOf(was)) toast(`⛏️ ${LAYER_NAMES[bandOf(S.layer)]}`, '#ffb340');
      }
      // (your crew can break a seal too: if you're down there, out it comes)
      if (boss && !this.fight && !this.awaying && (!quiet || this.onFloor())) this.startFight(true);
    },
    addCash(n) { S.cash += n; S.coinsEarned += n; this.dirty = true; },
    useCharge() {
      const c = chargeCost(); if (S.cash < c || this.fight) return;
      S.cash -= c; S.charges++; S.hp = 0; this.breakLayer(false);
      const [x, z] = SLOTS[this.mySlot]; puffAt(x, FY(S.layer) + 1, z, [0xff5a4d, 0xffb340, 0x57534e], 26); sfx('explode');
      this.reopen();
    },
    // diggers who swung while you were away (up to two hours of it)
    away() {
      const delta = Math.max(0, (Date.now() - (S.lastSeen || Date.now())) / 1000);
      if (S.diggers <= 0 || delta < 60) return;
      const capped = Math.min(delta, 7200), n = Math.min(Math.floor(autoRate() * capped), 6000);
      if (n <= 0) return;
      const b = { ores: S.oresMined, layers: S.layersBroken, cash: S.cash };
      this.awaying = true; for (let i = 0; i < n; i++) this.swing(true); this.awaying = false;
      openPanel('👷 While you were away', `<p class="xp-note">Your crew of ${S.diggers} kept swinging for ${Math.round(capped / 60)} minutes.</p>
        <div class="xp-row"><span>🧱 <b>${S.layersBroken - b.layers} layers broken</b><br><small>you’re on layer ${S.layer} now</small></span></div>
        <div class="xp-row"><span>🎒 <b>${S.oresMined - b.ores} ore hauled up</b><br><small>waiting in your bag${S.cash > b.cash ? `, and $${fmt(S.cash - b.cash)} from the scrap chute` : ''}</small></span></div>`);
    },

    /* ---- creatures ---- */
    startFight(boss) {
      if (this.mySlot == null) return;
      const ok = BEASTS.filter((b) => S.layer >= b.min), r = Math.random();
      const b = boss ? Object.assign({}, WARDEN, { speed: WARDEN.speed + Math.min(60, S.layer * 0.4) }) : r < 0.6 || ok.length === 1 ? ok[ok.length - 1] : r < 0.85 || ok.length === 2 ? ok[ok.length - 2] : ok[Math.floor(Math.random() * ok.length)];
      const lives = b.lives + (trinket('sigil') ? 1 : 0), zoneW = Math.min(48, b.zone * (1 + S.up.bane * 0.06 + (trinket('totem') ? 0.1 : 0)));
      this.fight = { b, boss, hits: 0, lives, maxLives: lives, pos: Math.random() * 100, dir: Math.random() < 0.5 ? 1 : -1, speed: b.speed, zoneA: 0, zoneW, at: performance.now() };
      this.fight.zoneA = Math.random() * (100 - zoneW);
      // it comes out of the wall, across from you
      const [x, z] = SLOTS[this.mySlot], y0 = FY(S.layer), side = P.x < x ? 1 : -1, g = beastModel(b.id);
      g.position.set(x + side * 2.8, y0 + (b.id === 'bat' ? 3.2 : b.id === 'slug' || b.id === 'spider' ? 0.9 : 1.6), z); g.lookAt(P.x, g.position.y, P.z); scene.add(g);
      this.beast = { g, y: g.position.y };
      puffAt(g.position.x, g.position.y, g.position.z, [0x1c1917, 0x57534e, hex(ORE[b.ore].color)], 20);
      P.frozen = true; P.vx = P.vz = 0;
      const el = document.createElement('div'); el.id = 'dsFight';
      el.innerHTML = `<div class="tt">${boss ? '🛡️ The seal opens' : `⚠️ A ${b.name.toLowerCase()} blocks the seam`}</div><div class="ds">${b.desc}</div><div class="lv"></div>
        <div class="tr"><div class="zn"></div><div class="mk"></div></div><div class="pp"></div><div class="msg">Land ${b.need} strikes in the lit band: click, tap, Space or E.</div>
        <div class="bt"><button class="xp-btn red" data-st="1">⚔️ Strike</button><button class="xp-btn alt" data-fl="1">${boss ? 'Leave the seal' : 'Back away'}</button></div>`;
      el.addEventListener('pointerdown', (e) => { e.stopPropagation(); const t = e.target.closest('button'); if (!t) return; if (t.dataset.st) this.strike(); else if (t.dataset.fl) this.endFight(false); });
      $('#xhud').append(el); this.fight.el = el;
      this.drawFight();
      sfx('groan'); say(boss ? `🛡️ A Seal warden rises from layer ${S.layer - 1}!` : `⚠️ A ${b.name.toLowerCase()} comes out of the dark!`, '#ff5a4d');
    },
    drawFight() {
      const f = this.fight; if (!f || !f.el) return;
      const q = (s) => f.el.querySelector(s);
      q('.zn').style.left = f.zoneA + '%'; q('.zn').style.width = f.zoneW + '%'; q('.mk').style.left = f.pos + '%';
      q('.lv').innerHTML = Array.from({ length: f.maxLives }, (_, i) => (i < f.lives ? '❤️' : '🖤')).join('');
      q('.pp').innerHTML = Array.from({ length: f.b.need }, (_, i) => `<i class="${i < f.hits ? 'hit' : ''}"></i>`).join('');
    },
    strike() {
      const f = this.fight; if (!f || performance.now() - f.at < 250) return;
      const msg = f.el.querySelector('.msg');
      if (f.pos >= f.zoneA && f.pos <= f.zoneA + f.zoneW) {
        f.hits++; f.speed *= 1.07; f.zoneW = Math.max(6, f.zoneW * 0.94); f.zoneA = Math.random() * (100 - f.zoneW);
        sfx('hit'); this.swingT = 0.25; msg.textContent = `Clean hit! ${f.b.need - f.hits} to go.`;
        if (this.beast) puffAt(this.beast.g.position.x, this.beast.g.position.y, this.beast.g.position.z, [0xffffff, hex(ORE[f.b.ore].color)], 8);
        if (f.hits >= f.b.need) return this.endFight(true);
      } else {
        f.lives--; sfx('hurt'); msg.textContent = 'Missed! It gets a swipe in.';
        if (f.lives <= 0) return this.endFight(false);
      }
      this.drawFight();
    },
    // won: its ore (a Seal warden: three, and cash); lost or backed away: it slinks off (won === null: just tidy up)
    endFight(won) {
      const f = this.fight;
      if (this.beast) { scene.remove(this.beast.g); this.beast = null; }
      if (!f) return;
      this.fight = null; P.frozen = false;
      if (f.el) f.el.remove();
      if (won === null) return;
      const b = f.b;
      if (won) {
        const ore = ORE[b.ore], n = f.boss ? 3 : 1, k = keyOf(ore.id, rollQuality());
        S.bag[k] = (S.bag[k] || 0) + n; S.seen[ore.id] = (S.seen[ore.id] || 0) + n; S.oresMined += n; S.beasts++;
        S.codex[b.id] = (S.codex[b.id] || 0) + 1; this.qt('beast', 1);
        if (f.boss) { S.bosses++; questMax('shaft.warden', S.bosses); this.addCash(Math.round(ore.value * 0.5 * sellMult())); earn(10, 'beat a Seal warden'); }
        sfx('win'); this.floatOre(`+${n} ${ore.name}`, ore.color, true);
        toast(`⚔️ You beat the ${b.name.toLowerCase()}!`, '#86efac');
        if (f.boss) Net.chat(`🛡️ beat a Seal warden at layer ${S.layer - 1}!`);
      } else { sfx('lose'); toast(`The ${b.name.toLowerCase()} drove you back`, '#fca5a5'); }
      this.dirty = true;
    },

    /* ---- every frame ---- */
    tick(dt) {
      if (!this.shafts) return;
      const t = performance.now();
      // the crew swings
      if (S.diggers > 0 && !this.fight) { this.acc += dt * autoRate(); let n = 0; while (this.acc >= 1 && n < 40) { this.acc -= 1; this.swing(true); n++; } }
      if (this.mySlot != null && (this.viewL !== S.layer || this.viewMod !== S.mod) && t > this.viewAt) this.drawShaft();
      // the floor darkens as it cracks
      if (this.floor && this.floorCol && t > this.dmgAt) { this.dmgAt = t + 100; const k = clamp(1 - S.hp / curMaxHp(), 0, 1); this.floor.m.material.color.copy(this.floorCol).lerp(new THREE.Color(0x0c0908), k * 0.55); }
      // never fall past your floor
      if (this.inShaft() && P.y < FY(S.layer) - 3) { P.y = FY(S.layer) + 0.6; P.vy = 0; }
      // the fight's marker
      const f = this.fight;
      if (f) {
        f.pos += f.dir * f.speed * dt;
        if (f.pos >= 100) { f.pos = 100; f.dir = -1; } if (f.pos <= 0) { f.pos = 0; f.dir = 1; }
        if (f.el) f.el.querySelector('.mk').style.left = f.pos + '%';
        if (!this.inShaft() || P.dead) this.endFight(false);
      }
      if (this.beast) { const g = this.beast.g, pr = g.userData.parts, T = t / 1000; g.position.y = this.beast.y + Math.sin(T * 3) * 0.18; if (pr.wl) { pr.wl.rotation.z = Math.sin(T * 18) * 0.7; pr.wr.rotation.z = -pr.wl.rotation.z; } if (pr.legs) pr.legs.forEach((l, i) => (l.rotation.x = Math.sin(T * 8 + i) * 0.3)); if (pr.segs) pr.segs.forEach((s, i) => (s.position.x = Math.sin(T * 3 + i * 0.8) * 0.35)); if (pr.eye) pr.eye.scale.setScalar(0.8 + Math.abs(Math.sin(T * 2.5)) * 0.5); }
      // the crew's swings
      this.diggers.forEach((a) => { a.ph += dt * 4.5 * (1 + perk('foreman') * 0.25); a.armR.rotation.x = 0.3 + Math.max(0, Math.sin(a.ph)) * 1.6; animateAvatar(a, 0, false, false); });
      this.swingT = Math.max(0, this.swingT - dt);
      if (t > this.barAt) { this.barAt = t + 120; this.drawBar(); }
      for (const sh of this.shafts) if (sh.owner) { const ly = sh.mine ? S.layer : sh.ly; if (ly !== sh.shownLy) { sh.shownLy = ly; sh.ly = ly; } this.signFor(sh); }
      this.send(false);
      if (this.dirty && t > this.saveAt) this.save();
    },
    pose() {
      const on = this.inShaft() || this.swingT > 0;
      if (!me || me.dead) return;
      if (on && (!this.pickG || this.pickG.parent !== me.armR || this.pickCol !== S.pick)) {
        if (this.pickG && this.pickG.parent) this.pickG.parent.remove(this.pickG);
        const p = new THREE.Group(); box(p, 0x6b4a2b, 0.25, 3, 0.25, 0, 0, 0); box(p, M(PICK_COL[S.pick], S.pick >= 9 ? { emissive: new THREE.Color(PICK_COL[S.pick]).multiplyScalar(0.3).getHex() } : undefined), 2.2, 0.35, 0.35, 0, 1.4, 0);
        p.position.set(0, -1.9, -0.4); p.rotation.x = -Math.PI / 2 + 0.3; me.armR.add(p); this.pickG = p; this.pickCol = S.pick;
      }
      if (this.pickG) this.pickG.visible = on;
      if (on) me.armR.rotation.x = this.swingT > 0 ? 0.3 + Math.sin((0.25 - this.swingT) / 0.25 * Math.PI) * 1.8 : 0.9;
    },
    // the panel down the right: this layer, how much rock is left, the next pocket, your chain
    drawBar() {
      if (!this.bar) return;
      const md = modOf(), max = curMaxHp(), hp = Math.max(0, S.hp), ch = performance.now() - this.chainAt < chainWindow() ? this.chain : 0;
      const chLeft = ch ? clamp(1 - (performance.now() - this.chainAt) / chainWindow(), 0, 1) : 0;
      const html = `<div class="hd"><b>Layer ${S.layer}</b><span>${LAYER_NAMES[bandOf(S.layer)]}</span></div>${md.name ? `<span class="md" style="color:${md.color}">${md.name}</span>` : ''}
        <div class="lb"><span>ROCK LEFT</span><span>${fmt(Math.ceil(hp))} / ${fmt(max)}</span></div><div class="bar"><i style="width:${(hp / max) * 100}%;background:linear-gradient(90deg,#a85c08,#ffb340)"></i></div>
        <div class="lb"><span>LOOSE POCKET</span><span>${S.pocketProgress} / ${pocketNeed()}</span></div><div class="bar"><i style="width:${(S.pocketProgress / pocketNeed()) * 100}%;background:linear-gradient(90deg,#177f74,#58e0cc)"></i></div>
        <div class="lb"><span>CHAIN ${ch || ''}</span><span>${ch >= 8 ? '×' + (1 + Math.min(1.2, Math.floor(ch / 8) * (0.05 + S.up.chain * 0.01))).toFixed(2) : 'keep swinging'}</span></div><div class="bar" style="height:5px"><i style="width:${chLeft * 100}%;background:linear-gradient(90deg,#ff6ff0,#ffb340)"></i></div>
        <div class="ft">⛏️ ${bestPickName()} · 💪 ${fmt(basePower() * rebirthMult())}${S.diggers ? ` · 👷 ${S.diggers}` : ''}${S.rebirths ? ` · 🔁 ${S.rebirths}` : ''}</div>`;
      if (html !== this.barHtml) { this.barHtml = html; this.bar.innerHTML = html; }
      this.bar.style.display = this.mySlot == null ? 'none' : '';
    },
    hud() {
      const n = bagCount();
      return `💵 $${fmt(S.cash)}${n ? ` · 🎒 ${fmt(n)} ore ($${fmt(bagWorth())})` : ''}${this.inShaft() ? '' : ` · ⛏️ your shaft: layer ${S.layer}`}`;
    },
    // words that float up off the floor
    float(text, color, big, x, y, z) {
      const v = new THREE.Vector3(x, y, z).project(camera); if (v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2) return;
      if (this.floats.length > 10) this.floats.shift().remove();
      const el = document.createElement('div'); el.className = 'dsFloat' + (big ? ' big' : ''); el.textContent = text; el.style.color = color;
      el.style.left = ((v.x + 1) / 2) * innerWidth + 'px'; el.style.top = ((1 - v.y) / 2) * innerHeight + 'px';
      $('#xhud').append(el); this.floats.push(el);
      setTimeout(() => { el.remove(); this.floats = this.floats.filter((q) => q !== el); }, 900);
    },
    floatOre(text, color, big) { if (this.mySlot == null || !this.inShaft()) return; const [x, z] = SLOTS[this.mySlot]; this.float(text, color, big, x + (Math.random() - 0.5) * 2, FY(S.layer) + 2.4, z); },

    /* ---- input ---- */
    prompts() {
      if (P.dead || this.mySlot == null || this.fight) return [];
      if (this.onFloor()) return [{ x: P.x, z: P.z, y: P.y, r: 99, text: `⛏️ Dig (or click) · layer ${S.layer}`, fn: () => this.swing(false) }];
      const out = [], [x, z] = SLOTS[this.mySlot], n = bagCount();
      out.push({ x, z, y: 0.6, r: 9, text: `🛗 Down to layer ${S.layer}`, fn: () => this.goDown() });
      out.push({ x: EXCHANGE[0] + 4, z: EXCHANGE[1], y: 0.6, r: 6, text: n ? `🏦 Sell all your ore · $${fmt(bagWorth())}` : '🏦 Ore Exchange', fn: () => (n ? this.sellAll() : this.open('ores')) });
      out.push({ x: FORGE[0] - 3, z: FORGE[1], y: 0.6, r: 6, text: '🔨 Forge', fn: () => this.open('forge') });
      out.push({ x: BOARD[0], z: BOARD[1] + 2, y: 0.6, r: 5, text: '📜 Quests', fn: () => this.open('quests') });
      return out;
    },
    click() { if (this.fight) this.strike(); else if (this.onFloor() && !panelOpen()) this.swing(false); },
    key(code, down) { if (down && this.fight && (code === 'Space' || code === 'KeyE')) { this.strike(); return true; } },
    menu() {
      const ready = S.quests.filter((q) => q.progress >= q.target).length, m = [
        [`🎒 Ores (${fmt(bagCount())})`, () => this.open('ores'), 'Ores'], ['⛏️ Picks & gear', () => this.open('picks'), 'Picks'], ['🔨 Forge', () => this.open('forge'), 'Forge'], [`📜 Quests${ready ? ` (${ready} done!)` : ''}`, () => this.open('quests'), 'Quests'],
      ];
      if (this.inShaft()) m.push(['⬆️ Up to the camp', () => this.goUp(), 'Up']);
      else if (this.mySlot != null) m.push(['🛗 Down your shaft', () => this.goDown(), 'Down']);
      return m;
    },

    /* ---- selling, buying, forging ---- */
    sell(k, all) {
      const have = S.bag[k] || 0, n = all ? have : Math.min(have, 1); if (n <= 0) return;
      const gain = Math.round(keyValue(k) * n * sellMult());
      this.addCash(gain); S.bag[k] = have - n; if (!S.bag[k]) delete S.bag[k];
      this.qt('sell', gain); sfx('coin'); this.reopen();
    },
    sellAll(scrapOnly) {
      let gain = 0, count = 0;
      for (const k of Object.keys(S.bag)) { if (scrapOnly && (qualOfKey(k) || !isScrap(oreOfKey(k).id))) continue; gain += keyValue(k) * S.bag[k]; count += S.bag[k]; delete S.bag[k]; }
      if (!count) return;
      gain = Math.round(gain * sellMult()); this.addCash(gain); this.qt('sell', gain);
      sfx('coin'); sfx('buy'); toast(`💵 Sold ${fmt(count)} ore: +$${fmt(gain)}`, '#86efac'); puffAt(P.x, P.y + 2, P.z, [0xffb340, 0x22c55e], 18);
      this.save(); this.reopen();
    },
    fuse(k) {
      const ore = oreOfKey(k), q = qualOfKey(k), pool = SEAM.includes(ore) ? SEAM : POCKET.includes(ore) ? POCKET : null;
      if (!pool) return;
      const i = pool.indexOf(ore); if (i < 0 || i >= pool.length - 1 || (S.bag[k] || 0) < 10) return;
      const next = pool[i + 1], nk = keyOf(next.id, q);
      S.bag[k] -= 10; if (!S.bag[k]) delete S.bag[k];
      S.bag[nk] = (S.bag[nk] || 0) + 1; S.seen[next.id] = (S.seen[next.id] || 0) + 1; S.fused++; this.qt('fuse', 1);
      sfx('magic'); toast(`🔥 10 ${keyName(k)} → 1 ${keyName(nk)}`, next.color); this.dirty = true; this.reopen();
    },
    canCraft(req, coins) { return S.cash >= coins && Object.keys(req).every((id) => countOre(id) >= req[id]); },
    payCraft(req, coins) {
      S.cash -= coins;
      for (const id of Object.keys(req)) {
        let need = req[id];
        // the plain ones go first
        for (const k of Object.keys(S.bag).filter((k) => k.split('|')[0] === id).sort((a, b) => qualOfKey(a) - qualOfKey(b))) { const t = Math.min(need, S.bag[k]); S.bag[k] -= t; need -= t; if (!S.bag[k]) delete S.bag[k]; if (!need) break; }
      }
    },
    buy(what, id) {
      if (what === 'pick') { const i = S.pick + 1, p = PICKS[i]; if (!p || S.cash < p.cost) return; S.cash -= p.cost; S.pick = i; sfx('unlock'); toast(`⛏️ ${p.name}!`, '#58e0cc'); }
      else if (what === 'gear') { const t = S.gear[id] + 1, g = GEAR[id]; if (!g || !g.tiers[t] || S.cash < g.tiers[t].c) return; S.cash -= g.tiers[t].c; S.gear[id] = t; sfx('unlock'); }
      else if (what === 'up') { const u = UPGRADES.find((x) => x.id === id); if (!u || S.up[id] >= u.max || S.cash < upCost(u)) return; S.cash -= upCost(u); S.up[id]++; sfx('buy'); }
      else if (what === 'dig') { if (S.diggers >= 30 || S.cash < diggerCost()) return; S.cash -= diggerCost(); S.diggers++; sfx('buy'); this.placeDiggers(); }
      else if (what === 'forge') { const F = FORGED[S.forged]; if (!F || !this.canCraft(F.req, F.coins)) return; this.payCraft(F.req, F.coins); S.forged++; sfx('win'); toast(`🔨 You forged the ${F.name}!`, '#ffb340'); Net.chat(`🔨 forged the ${F.name}!`); }
      else if (what === 'trinket') { const T = TRINKETS.find((x) => x.id === id); if (!T || trinket(id) || !this.canCraft(T.req, T.coins)) return; this.payCraft(T.req, T.coins); S.trinkets[id] = 1; sfx('win'); toast(`${T.e} ${T.name}!`, '#58e0cc'); }
      else if (what === 'perk') { const p = PERKS.find((x) => x.id === id); if (!p || perk(id) >= p.max || S.cores < perkCost(p)) return; S.cores -= perkCost(p); S.perks[id] = perk(id) + 1; sfx('unlock'); }
      this.dirty = true; this.save(); this.reopen();
    },

    /* ---- quests ---- */
    makeQuest() {
      const pool = QUEST_KINDS.filter((k) => (k.id !== 'beast' || S.layer >= 3) && (k.id !== 'fuse' || S.oresMined > 30)), k = pool[Math.floor(Math.random() * pool.length)];
      let target = k.roll();
      if (k.id === 'sell') target = Math.max(500, Math.floor(bagWorth() * 2 + 400 * S.layer * (1 + S.rebirths)));
      const reward = k.id === 'sell' ? Math.floor(target * 0.45) : Math.max(50, Math.floor(k.pay * target * (1 + S.layer * 0.55) * (1 + S.rebirths * 0.5)));
      return { kind: k.id, target, progress: 0, reward };
    },
    fillQuests() { while (S.quests.length < 3) S.quests.push(this.makeQuest()); },
    qt(kind, n) { for (const q of S.quests) if (q.kind === kind && q.progress < q.target) q.progress = Math.min(q.target, q.progress + n); },
    claimQuest(i) {
      const q = S.quests[i]; if (!q || q.progress < q.target) return;
      this.addCash(q.reward); S.questsDone++; S.quests[i] = this.makeQuest();
      sfx('win'); toast(`📜 Quest done: +$${fmt(q.reward)}`, '#58e0cc'); if (S.questsDone % 5 === 0) earn(3, `${S.questsDone} Deep Shaft quests done`);
      this.dirty = true; this.reopen();
    },
    rerollCost() { return Math.max(150, Math.floor(200 * (1 + S.layer) * (1 + S.rebirths * 0.6))); },
    rerollQuest(i) { const c = this.rerollCost(); if (S.cash < c) return; S.cash -= c; S.quests[i] = this.makeQuest(); sfx('select'); this.dirty = true; this.reopen(); },

    /* ---- rebirth ---- */
    rebirthReady() { return S.layer >= rebirthAt(); },
    rebirthPanel() {
      const ready = this.rebirthReady(), gain = coresFor(S.layer);
      const perks = PERKS.map((p) => { const lv = perk(p.id), c = perkCost(p), max = lv >= p.max; return `<div class="xp-row"><span>${p.e} <b>${p.name}</b> <small style="color:#c084fc">${lv}/${p.max}</small><br><small style="color:var(--muted)">${p.desc}</small></span>${max ? '<small style="color:#58e0cc">MAX</small>' : `<button class="xp-btn purple" data-perk="${p.id}"${S.cores < c ? ' disabled' : ''}>💠 ${c}</button>`}</div>`; }).join('');
      openPanel('🔁 Rebirth', `<p class="xp-note">The shaft collapses and you start again from layer 1 with a wooden pick, no ore, no upgrades and no gear. You keep your perks, forged picks, trinkets and achievements.</p>
        <div class="xp-row"><span>💠 <b>+${gain} core${gain > 1 ? 's' : ''}</b> for perks<br><small style="color:var(--muted)">more the deeper you go (you have ${S.cores})</small></span></div>
        <div class="xp-row"><span>💪 <b>×${Math.pow(1.25, S.rebirths + 1).toFixed(2)} swing power</b>, for good<br><small style="color:var(--muted)">now ×${rebirthMult().toFixed(2)}; every rebirth adds up</small></span></div>
        <button class="xp-btn purple" data-rb="1" style="width:100%;padding:13px;margin:6px 0 10px"${ready ? '' : ' disabled'}>${ready ? '🔁 Collapse the shaft' : `Reach layer ${rebirthAt()} first (you’re on ${S.layer})`}</button>
        <p class="xp-note">💠 <b>Perks</b> · you have <b>${S.cores}</b> core${S.cores === 1 ? '' : 's'}</p>${perks}`,
      (b) => { if (b.dataset.rb && this.rebirthReady()) { closePanel(); this.rebirth(); } else if (b.dataset.perk) { this.buy('perk', b.dataset.perk); this.rebirthPanel(); } });
    },
    rebirth() {
      if (!this.rebirthReady()) return;
      this.endFight(null);
      const gain = coresFor(S.layer), old = S, keep = {
        rebirths: old.rebirths + 1, cores: old.cores + gain, perks: old.perks, seen: old.seen, codex: old.codex, questsDone: old.questsDone, swings: old.swings,
        layersBroken: old.layersBroken, oresMined: old.oresMined, coinsEarned: old.coinsEarned, beasts: old.beasts, bosses: old.bosses, fused: old.fused, charges: old.charges,
        muts: old.muts, bestChain: old.bestChain, best: old.best, forged: old.forged, trinkets: old.trinkets,
        diggers: perk('crew') ? old.diggers : 0, cash: Math.floor(old.cash * 0.25 * perk('purse')),
        gear: { lamp: Math.min(old.gear.lamp, perk('anchor')), gloves: Math.min(old.gear.gloves, perk('anchor')), cart: Math.min(old.gear.cart, perk('anchor')) },
      };
      S = Object.assign(fresh(), keep);
      S.pick = Math.min(PICKS.length - 1, perk('start')); S.mod = rollMod(1); S.hp = curMaxHp(); this.fillQuests();
      questMax('shaft.rebirth', S.rebirths); earn(25, 'rebirthed your shaft');
      sfx('magic'); sfx('win'); toast(`🔁 Rebirth ${S.rebirths}! +${gain} cores`, '#c084fc'); Net.chat(`🔁 rebirthed their shaft (×${rebirthMult().toFixed(2)} power)`);
      this.viewL = -1; this.drawShaft(); this.placeDiggers(); this.save(); this.send(true);
      if (this.inShaft()) this.goDown();
    },

    /* ---- the panels down the left ---- */
    open(kind, tab) { this.pan = { kind, tab: tab || (this.pan && this.pan.kind === kind ? this.pan.tab : null) }; this.draw(); },
    reopen() { if (this.pan && panelOpen()) this.draw(); },
    draw() {
      const p = this.pan; if (!p) return;
      const done = () => { this.pan = null; };
      const click = (b) => {
        const d = b.dataset;
        if (d.tab) this.open(p.kind, d.tab);
        else if (d.sell) this.sell(d.sell, !!d.all);
        else if (d.sa) this.sellAll(false);
        else if (d.ss) this.sellAll(true);
        else if (d.fuse) this.fuse(d.fuse);
        else if (d.buy) this.buy(d.buy, d.id);
        else if (d.charge) this.useCharge();
        else if (d.claim != null) this.claimQuest(+d.claim);
        else if (d.swap != null) this.rerollQuest(+d.swap);
      };
      const [title, html] = p.kind === 'ores' ? this.oresHtml() : p.kind === 'picks' ? this.picksHtml(p) : p.kind === 'forge' ? this.forgeHtml() : this.questsHtml();
      openPanel(title, html, click, done, { extra: `<span style="font:600 14px var(--fh);color:#fde68a">💵 $${fmt(S.cash)}</span>` });
      this.pan = p; // (opening it called the old one's close)
    },
    oresHtml() {
      const keys = Object.keys(S.bag).filter((k) => S.bag[k] > 0).sort((a, b) => keyValue(b) - keyValue(a)), n = bagCount(), scrap = keys.some((k) => !qualOfKey(k) && isScrap(oreOfKey(k).id));
      const fusable = (k) => { const o = oreOfKey(k), pool = SEAM.includes(o) ? SEAM : POCKET.includes(o) ? POCKET : null; return pool && pool.indexOf(o) < pool.length - 1 && S.bag[k] >= 10 ? pool[pool.indexOf(o) + 1] : null; };
      const rows = keys.map((k) => { const nx = fusable(k); return `<div class="xp-row"><span><i class="dsDot" style="color:${keyColor(k)}"></i><b style="color:${QUAL[qualOfKey(k)].color || '#fff'}">${keyName(k)}</b> ×${fmt(S.bag[k])}<br><small style="color:var(--muted)">$${fmt(keyValue(k) * sellMult())} each</small></span><span style="display:flex;gap:5px">${nx ? `<button class="xp-btn alt" data-fuse="${k}" title="10 into 1 ${nx.name}">🔥 10→1</button>` : ''}<button class="xp-btn gold" data-sell="${k}" data-all="1">$${fmt(keyValue(k) * S.bag[k] * sellMult())}</button></span></div>`; }).join('');
      return [`🎒 Ores · ${fmt(n)}`, `<p class="xp-note">Worth <b style="color:#fde68a">$${fmt(bagWorth())}</b> (every sale ×${sellMult().toFixed(2)}). 🔥 Fuse ten of an ore into one of the next one up.</p>
        <div style="display:flex;gap:6px;margin-bottom:8px"><button class="xp-btn gold" data-sa="1" style="flex:1"${n ? '' : ' disabled'}>💵 Sell all</button><button class="xp-btn alt" data-ss="1" style="flex:1"${scrap ? '' : ' disabled'}>🪨 Sell the scrap</button></div>
        ${rows || '<p class="xp-note">Nothing yet. Dig! Every layer that breaks drops its seam’s ore, and every few swings a loose pocket gives up a gem.</p>'}`];
    },
    picksHtml(p) {
      const tab = p.tab || 'picks', tabs = [['picks', '⛏️ Picks'], ['gear', '🧰 Gear'], ['up', '⬆️ Upgrades'], ['crew', '👷 Crew']];
      let html = `<div class="xp-tabs">${tabs.map(([k, n]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>`;
      if (tab === 'picks') {
        const nx = PICKS[S.pick + 1];
        html += `<div class="xp-row"><span>⛏️ <b>${PICKS[S.pick].name}</b> <small style="color:#58e0cc">yours</small><br><small style="color:var(--muted)">power ${fmt(PICKS[S.pick].power)}${S.forged ? ` · forged: ${FORGED[S.forged - 1].name} (${fmt(forgedPower())})` : ''}</small></span></div>`;
        html += nx ? `<div class="xp-row"><span>⛏️ <b>${nx.name}</b><br><small style="color:var(--muted)">power ${fmt(nx.power)} (×${(nx.power / PICKS[S.pick].power).toFixed(1)})</small></span><button class="xp-btn gold" data-buy="pick"${S.cash < nx.cost ? ' disabled' : ''}>$${fmt(nx.cost)}</button></div>` : '<p class="xp-note">You have the best pick there is. Forge one for more!</p>';
        html += PICKS.slice(S.pick + 2, S.pick + 5).map((q) => `<div class="xp-row" style="opacity:.55"><span>🔒 <b>${q.name}</b><br><small>power ${fmt(q.power)}</small></span><small>$${fmt(q.cost)}</small></div>`).join('');
        html += `<p class="xp-note">💥 <b>Depth charge</b>: blow this layer open right now.</p><button class="xp-btn red" data-charge="1" style="width:100%"${S.cash < chargeCost() || this.mySlot == null ? ' disabled' : ''}>💥 Depth charge · $${fmt(chargeCost())}</button>`;
      } else if (tab === 'gear') {
        html += Object.keys(GEAR).map((id) => { const g = GEAR[id], t = S.gear[id], nx = g.tiers[t + 1]; return `<div class="xp-row"><span>${g.e} <b>${g.tiers[t].n}</b> <small style="color:#58e0cc">${t}/${g.tiers.length - 1}</small><br><small style="color:var(--muted)">${g.label}: ${g.blurb}${nx ? ` · next: ${nx.n}` : ''}</small></span>${nx ? `<button class="xp-btn gold" data-buy="gear" data-id="${id}"${S.cash < nx.c ? ' disabled' : ''}>$${fmt(nx.c)}</button>` : '<small style="color:#58e0cc">MAX</small>'}</div>`; }).join('');
      } else if (tab === 'up') {
        html += UPGRADES.map((u) => { const lv = S.up[u.id], max = lv >= u.max, c = upCost(u); return `<div class="xp-row"><span>${u.e} <b>${u.name}</b> <small style="color:#58e0cc">${lv}/${u.max}</small><br><small style="color:var(--muted)">${u.desc}</small></span>${max ? '<small style="color:#58e0cc">MAX</small>' : `<button class="xp-btn gold" data-buy="up" data-id="${u.id}"${S.cash < c ? ' disabled' : ''}>$${fmt(c)}</button>`}</div>`; }).join('');
      } else {
        html += `<p class="xp-note">Diggers swing for you all the time, even when you’re not playing (up to two hours’ worth when you come back). Four of them work in your shaft where you can see them.</p>
          <div class="xp-row"><span>👷 <b>${S.diggers} digger${S.diggers === 1 ? '' : 's'}</b><br><small style="color:var(--muted)">${autoRate().toFixed(1)} swings a second, at 40% of your power</small></span>${S.diggers >= 30 ? '<small style="color:#58e0cc">MAX</small>' : `<button class="xp-btn gold" data-buy="dig"${S.cash < diggerCost() ? ' disabled' : ''}>Hire · $${fmt(diggerCost())}</button>`}</div>`;
      }
      return ['⛏️ Picks & gear', html];
    },
    forgeHtml() {
      const req = (r, coins) => Object.keys(r).map((id) => `<span class="dsReq ${countOre(id) >= r[id] ? 'ok' : 'no'}"><i class="dsDot" style="color:${ORE[id].color};width:8px;height:8px;margin-right:5px"></i>${ORE[id].name} ${fmt(countOre(id))}/${r[id]}</span>`).join('') + `<span class="dsReq ${S.cash >= coins ? 'ok' : 'no'}">$${fmt(coins)}</span>`;
      const F = FORGED[S.forged];
      let html = `<p class="xp-note">🔨 <b>Forged pickaxes</b> are yours for good (rebirths too), each with a bonus that adds to the last.</p>`;
      html += FORGED.slice(0, S.forged).map((f) => `<div class="xp-row"><span>✅ <b>${f.name}</b><br><small style="color:var(--muted)">power ${fmt(f.power)} · ${f.bonus}</small></span></div>`).join('');
      html += F ? `<div class="xp-row" style="flex-wrap:wrap"><span>🔨 <b>${F.name}</b><br><small style="color:var(--muted)">power ${fmt(F.power)} · ${F.bonus}</small><br>${req(F.req, F.coins)}</span><button class="xp-btn gold" data-buy="forge"${this.canCraft(F.req, F.coins) ? '' : ' disabled'}>Forge</button></div>` : '<p class="xp-note">You’ve forged every pickaxe there is!</p>';
      html += `<p class="xp-note" style="margin-top:12px">🧿 <b>Trinkets</b>: one of each, for good.</p>`;
      html += TRINKETS.map((T) => trinket(T.id) ? `<div class="xp-row"><span>${T.e} <b>${T.name}</b> <small style="color:#58e0cc">✓</small><br><small style="color:var(--muted)">${T.desc}</small></span></div>` : `<div class="xp-row" style="flex-wrap:wrap"><span>${T.e} <b>${T.name}</b><br><small style="color:var(--muted)">${T.desc}</small><br>${req(T.req, T.coins)}</span><button class="xp-btn gold" data-buy="trinket" data-id="${T.id}"${this.canCraft(T.req, T.coins) ? '' : ' disabled'}>Craft</button></div>`).join('');
      return ['🔨 Forge', html];
    },
    questsHtml() {
      const qs = S.quests.map((q, i) => { const k = QUEST_KINDS.find((x) => x.id === q.kind), ok = q.progress >= q.target; return `<div class="xp-row"><span>${k.e} <b>${k.text(q.target)}</b><br><small style="color:var(--muted)">${fmt(q.progress)} / ${fmt(q.target)} · pays $${fmt(q.reward)}</small><div style="height:6px;border-radius:4px;background:rgba(255,255,255,.1);margin-top:5px;overflow:hidden;width:170px"><i style="display:block;height:100%;width:${(q.progress / q.target) * 100}%;background:#58e0cc"></i></div></span>${ok ? `<button class="xp-btn" data-claim="${i}">Claim!</button>` : `<button class="xp-btn alt" data-swap="${i}"${S.cash < this.rerollCost() ? ' disabled' : ''}>Swap $${fmt(this.rerollCost())}</button>`}</div>`; }).join('');
      const ores = (pool, title) => `<p class="xp-note" style="margin-top:12px">${title}</p><div style="display:flex;flex-wrap:wrap;gap:4px">${pool.map((o) => S.seen[o.id] ? `<span class="dsReq ok" style="color:${o.color};border-color:${o.color}55">${o.name} ×${fmt(S.seen[o.id])}</span>` : '<span class="dsReq">???</span>').join('')}</div>`;
      const beasts = [...BEASTS, WARDEN].map((b) => `<span class="dsReq ${S.codex[b.id] || (b === WARDEN && S.bosses) ? 'ok' : ''}">${S.codex[b.id] ? `${b.name} ×${S.codex[b.id]}` : b.min > S.best ? `??? (layer ${b.min}+)` : b === WARDEN ? 'Seal warden (layer 25)' : '???'}</span>`).join('');
      return [`📜 Quests · ${S.questsDone} done`, `${qs}${ores(SEAM, '📖 <b>Codex</b> · seam ore')}${ores(POCKET, 'Gems from loose pockets')}${ores(BEAST_ORES, 'Creature drops')}<p class="xp-note" style="margin-top:12px">Creatures beaten</p><div style="display:flex;flex-wrap:wrap;gap:4px">${beasts}</div>
        <p class="xp-note" style="margin-top:12px">⛏️ ${fmt(S.swings)} swings · 🧱 ${fmt(S.layersBroken)} layers · 🪨 ${fmt(S.oresMined)} ore · deepest layer ${S.best} · best chain ${S.bestChain} · ✨ ${fmt(S.muts)} better-than-usual ore</p>`];
    },

    coinShop: [
      { id: 'cash2', e: '💵', n: '2× Cash', d: 'Every ore you sell is worth double, for good', price: 700, kind: 'pass' },
      { id: 'lamp', e: '🔦', n: 'Miner’s Headlamp', d: 'Rare ore turns up more often and comes out better more often, for good', price: 450, kind: 'pass' },
      { id: 'tnt', e: '🧨', n: 'Dynamite', d: 'Blows the next five layers open at once (press Use down your shaft)', price: 60, kind: 'use', tap: true },
      { id: 'crate', e: '💰', n: 'Cash Crate', d: 'Cash worth ten of this layer’s depth charges (at least $500), right now', price: 40, kind: 'now' },
    ],
    shopCan(id) { return id === 'tnt' && this.mySlot == null ? 'You need a shaft' : ''; },
    shopUse(id) {
      if (id !== 'tnt' || this.mySlot == null || this.fight) return false;
      for (let k = 0; k < 5; k++) { S.hp = 0; this.breakLayer(k < 4); }
      const [x, z] = SLOTS[this.mySlot]; puffAt(x, FY(S.layer) + 2, z, [0xff5a4d, 0xffb340, 0x57534e, 0x292524], 40); sfx('explode');
      toast('🧨 BOOM! Five layers down', '#ffb340'); this.save(); return true;
    },
    onBuy(id) { if (id === 'crate') { const v = Math.max(500, chargeCost() * 10); this.addCash(v); toast(`💰 +$${fmt(v)}`, '#86efac'); this.save(); } },
  };
  addExp(DS);
  window.__rbDS = DS;
})();
