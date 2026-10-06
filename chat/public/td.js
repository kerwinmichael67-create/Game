// Tower Defense engine: one player's map. No drawing here, so the same code runs the game you
// play, the bot opponent, and the balance tests.
//   TD.create() -> state      TD.step(state, dt)      TD.place / upgrade / sell / retarget / startWave
//   TD.ai(state, level)       picks and makes one purchase for the bot
(function (root) {
  const W = 800, H = 500;
  const START_MONEY = 350, START_LIVES = 100, LAST_WAVE = 25, BOSS_WAVES = [5, 10, 25];
  const MAX_TOWERS = 20, FIRST_BREAK = 25, BREAK = 12;
  const ROAD = 18, TOWER_R = 13;

  // The road enemies walk along.
  const PATH = [[-20, 70], [690, 70], [690, 200], [110, 200], [110, 330], [690, 330], [690, 440], [820, 440]];
  const SEG = [];
  let PATH_LEN = 0;
  for (let i = 1; i < PATH.length; i++) {
    const [ax, ay] = PATH[i - 1], [bx, by] = PATH[i], len = Math.hypot(bx - ax, by - ay);
    SEG.push({ ax, ay, bx, by, len, at: PATH_LEN });
    PATH_LEN += len;
  }
  function pointAt(d) {
    d = Math.max(0, Math.min(PATH_LEN, d));
    for (const s of SEG) {
      if (d <= s.at + s.len) { const t = (d - s.at) / s.len; return [s.ax + (s.bx - s.ax) * t, s.ay + (s.by - s.ay) * t]; }
    }
    return PATH[PATH.length - 1].slice();
  }
  function distToPath(x, y) {
    let best = Infinity;
    for (const s of SEG) {
      const dx = s.bx - s.ax, dy = s.by - s.ay;
      const t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (y - s.ay) * dy) / (s.len * s.len)));
      best = Math.min(best, Math.hypot(x - (s.ax + dx * t), y - (s.ay + dy * t)));
    }
    return best;
  }
  const SAMPLES = [];
  for (let d = 0; d <= PATH_LEN; d += 10) SAMPLES.push(pointAt(d));

  // Towers: level 0 is as bought; 5 upgrades each, every one dearer than the last.
  const TOWERS = {
    pistol: {
      name: 'Pistol', cost: 100, max: Infinity, color: '#94a3b8', key: '1', desc: 'Cheap all-rounder',
      up: [60, 110, 180, 280, 420],
      lv: [{ dmg: 6, rate: 1.6, range: 115 }, { dmg: 8, rate: 1.9, range: 122 }, { dmg: 11, rate: 2.2, range: 130 },
        { dmg: 15, rate: 2.6, range: 138 }, { dmg: 21, rate: 3.0, range: 148 }, { dmg: 30, rate: 3.6, range: 160 }],
    },
    machinegun: {
      name: 'Machine gun', cost: 250, max: 5, color: '#f59e0b', key: '2', desc: 'Very fast fire; armor blunts it',
      up: [160, 260, 380, 540, 760],
      lv: [{ dmg: 3, rate: 9, range: 118 }, { dmg: 3.6, rate: 10.5, range: 124 }, { dmg: 4.4, rate: 12, range: 130 },
        { dmg: 5.5, rate: 14, range: 136 }, { dmg: 7, rate: 16, range: 145 }, { dmg: 9, rate: 19, range: 155 }],
    },
    sniper: {
      name: 'Sniper', cost: 200, max: 8, color: '#22c55e', key: '3', desc: 'Huge range, pierces armor',
      up: [130, 210, 320, 470, 680],
      lv: [{ dmg: 40, rate: 0.45, range: 260 }, { dmg: 55, rate: 0.5, range: 275 }, { dmg: 78, rate: 0.55, range: 290 },
        { dmg: 110, rate: 0.6, range: 310 }, { dmg: 155, rate: 0.66, range: 335 }, { dmg: 225, rate: 0.75, range: 370 }],
    },
    flamethrower: {
      name: 'Flamethrower', cost: 150, max: 5, color: '#ef4444', key: '4', desc: 'Burns everything close by',
      up: [100, 160, 240, 350, 520],
      lv: [{ dmg: 2, rate: 6, range: 78, burn: 4 }, { dmg: 2.6, rate: 6.5, range: 82, burn: 6 }, { dmg: 3.4, rate: 7, range: 86, burn: 9 },
        { dmg: 4.4, rate: 7.5, range: 92, burn: 13 }, { dmg: 5.6, rate: 8, range: 98, burn: 18 }, { dmg: 7.2, rate: 9, range: 106, burn: 25 }],
    },
    farm: {
      name: 'Farm', cost: 75, max: 7, color: '#a3e635', key: '5', desc: 'Pays out after every wave',
      up: [75, 125, 200, 300, 450],
      lv: [{ income: 25 }, { income: 50 }, { income: 85 }, { income: 130 }, { income: 185 }, { income: 250 }],
    },
  };
  const ORDER = ['pistol', 'machinegun', 'sniper', 'flamethrower', 'farm'];
  // Every level has its own name (level 0 is the tower as bought); td-icons.js has a picture for each.
  const NAMES = {
    pistol: ['Pistol', 'Revolver', 'Dual Pistols', 'Hand Cannon', 'Quick Draw', 'Laser Pistol'],
    machinegun: ['Machine Gun', 'Grease Gun', 'Autogun', 'Chaingun', 'Minigun', 'Flak Cannon'],
    sniper: ['Sniper', 'Hollow Point', 'Scoped Rifle', 'Eagle Eye', 'Railgun', 'Deadeye'],
    flamethrower: ['Flamethrower', 'Hot Sauce', 'Flamer', 'Magma', 'Dragon Breath', 'Solar Flare'],
    farm: ['Farm', 'Corn Field', 'Ranch', 'Tractor Co.', 'Barn', 'Gold Mine'],
  };
  for (const k of ORDER) TOWERS[k].names = NAMES[k];
  const TARGETS = ['first', 'strong', 'last', 'close'];

  const ENEMIES = {
    grunt: { name: 'Grunt', hp: 20, speed: 62, reward: 3, dmg: 1, r: 9, color: '#e11d48' },
    runner: { name: 'Runner', hp: 13, speed: 112, reward: 3, dmg: 1, r: 7, color: '#f97316' },
    brute: { name: 'Brute', hp: 95, speed: 40, reward: 9, dmg: 3, r: 13, color: '#7c3aed' },
    shield: { name: 'Shield', hp: 60, speed: 52, reward: 7, dmg: 2, r: 11, armor: 3, color: '#0ea5e9' },
    warlord: { name: 'Warlord', hp: 650, speed: 34, reward: 120, dmg: 25, r: 20, boss: true, color: '#b91c1c' },
    juggernaut: { name: 'Juggernaut', hp: 1500, speed: 30, reward: 250, dmg: 45, r: 23, armor: 4, boss: true, color: '#1e3a8a' },
    overlord: { name: 'Overlord', hp: 3800, speed: 24, reward: 0, dmg: 100, r: 27, armor: 6, boss: true, color: '#111827' },
  };
  const BOSS_OF = { 5: 'warlord', 10: 'juggernaut', 25: 'overlord' };

  const hpScale = (n) => (n <= 12 ? Math.pow(1.18, n - 1) : Math.pow(1.18, 11) * Math.pow(1.11, n - 12)); // steep early, then steady
  // The same waves for everyone: a list of [kind, seconds after the previous one].
  function waveList(n) {
    const out = [];
    const add = (kind, count, gap) => { for (let i = 0; i < count; i++) out.push([kind, gap]); };
    add('grunt', 6 + Math.floor(n * 1.3), Math.max(0.3, 0.8 - n * 0.02));
    if (n >= 3) add('runner', Math.floor(n * 1.1), 0.4);
    if (n >= 5) add('brute', Math.floor((n - 3) / 1.6), 1.0);
    if (n >= 11) add('shield', Math.floor((n - 8) / 1.4), 0.75);
    if (BOSS_OF[n]) {
      out.push([BOSS_OF[n], 2]);
      if (n === 25) add('brute', 6, 1.5);
    }
    return out;
  }

  function create() {
    return {
      money: START_MONEY, lives: START_LIVES, wave: 0, cleared: 0, phase: 'build', breakT: FIRST_BREAK, t: 0,
      towers: [], enemies: [], queue: [], spawnT: 0, nextId: 1, kills: 0, fx: [], events: [], boss: null, earned: 0,
    };
  }
  const statsOf = (t) => TOWERS[t.type].lv[t.lvl];
  const countOf = (s, type) => s.towers.filter((t) => t.type === type).length;
  const upgradeCost = (t) => (t.lvl < 5 ? TOWERS[t.type].up[t.lvl] : null);
  const sellValue = (t) => Math.floor(t.spent * 0.7);
  function farmIncome(s) { return s.towers.reduce((a, t) => a + (t.type === 'farm' ? TOWERS.farm.lv[t.lvl].income : 0), 0); }

  function canPlace(s, type, x, y) {
    const def = TOWERS[type];
    if (!def) return 'Unknown tower';
    if (s.phase === 'dead' || s.phase === 'won') return 'The game is over';
    if (s.towers.length >= MAX_TOWERS) return `You can only have ${MAX_TOWERS} towers`;
    if (countOf(s, type) >= def.max) return `You can only have ${def.max} ${def.name.toLowerCase()}${def.max === 1 ? '' : 's'}`;
    if (s.money < def.cost) return `Need $${def.cost}`;
    if (!(x >= TOWER_R + 2 && x <= W - TOWER_R - 2 && y >= TOWER_R + 2 && y <= H - TOWER_R - 2)) return 'Out of bounds';
    if (distToPath(x, y) < ROAD + TOWER_R - 2) return 'Can’t build on the road';
    if (s.towers.some((t) => Math.hypot(t.x - x, t.y - y) < TOWER_R * 2 + 2)) return 'Too close to another tower';
    return null;
  }
  function place(s, type, x, y) {
    const err = canPlace(s, type, x, y);
    if (err) return err;
    s.money -= TOWERS[type].cost;
    s.towers.push({ id: s.nextId++, type, x, y, lvl: 0, cd: 0, aim: 0, target: type === 'sniper' ? 'strong' : 'first', spent: TOWERS[type].cost, dmg: 0 });
    return null;
  }
  const find = (s, id) => s.towers.find((t) => t.id === id);
  function upgrade(s, id) {
    const t = find(s, id);
    if (!t) return 'No such tower';
    const c = upgradeCost(t);
    if (c === null) return 'Fully upgraded';
    if (s.money < c) return `Need $${c}`;
    s.money -= c; t.spent += c; t.lvl++;
    return null;
  }
  function sell(s, id) {
    const t = find(s, id);
    if (!t) return 'No such tower';
    s.money += sellValue(t);
    s.towers = s.towers.filter((x) => x !== t);
    return null;
  }
  function retarget(s, id) {
    const t = find(s, id);
    if (t && t.type !== 'farm') t.target = TARGETS[(TARGETS.indexOf(t.target) + 1) % TARGETS.length];
  }
  function startWave(s) {
    if (s.phase !== 'build') return;
    s.wave++;
    s.phase = 'wave';
    s.queue = waveList(s.wave).slice();
    s.spawnT = 0.5;
    s.events.push({ type: 'wave', wave: s.wave, boss: BOSS_OF[s.wave] || null });
  }

  function spawn(s, kind) {
    const e = ENEMIES[kind], hp = Math.round(e.hp * hpScale(s.wave));
    const en = { id: s.nextId++, kind, hp, max: hp, d: 0, speed: e.speed, armor: e.armor || 0, burn: 0, burnT: 0, boss: !!e.boss };
    s.enemies.push(en);
    if (en.boss) { s.boss = en.id; s.events.push({ type: 'boss', kind }); }
  }
  function hurt(s, e, amount, t) {
    if (e.hp <= 0) return;
    e.hp -= amount;
    if (t) t.dmg += amount;
    if (e.hp <= 0) {
      s.kills++;
      const r = ENEMIES[e.kind].reward;
      s.money += r; s.earned += r;
      if (e.id === s.boss) s.boss = null;
    }
  }
  function pickTarget(t, list) {
    switch (t.target) {
      case 'strong': return list.reduce((a, b) => (b.hp > a.hp ? b : a));
      case 'last': return list.reduce((a, b) => (b.d < a.d ? b : a));
      case 'close': return list.reduce((a, b) => (Math.hypot(b.x - t.x, b.y - t.y) < Math.hypot(a.x - t.x, a.y - t.y) ? b : a));
      default: return list.reduce((a, b) => (b.d > a.d ? b : a));
    }
  }

  function step(s, dt) {
    if (s.phase === 'dead' || s.phase === 'won') return;
    s.t += dt;
    s.fx = s.fx.filter((f) => (f.life -= dt) > 0);
    if (s.phase === 'build') {
      s.breakT -= dt;
      if (s.breakT <= 0) startWave(s);
      return;
    }
    // spawn
    s.spawnT -= dt;
    while (s.queue.length && s.spawnT <= 0) {
      const [kind] = s.queue.shift();
      spawn(s, kind);
      s.spawnT += s.queue.length ? s.queue[0][1] : 0;
    }
    // move, burn, leak
    for (const e of s.enemies) {
      e.d += e.speed * dt;
      if (e.burnT > 0) { e.burnT -= dt; hurt(s, e, e.burn * dt, null); }
      const p = pointAt(e.d); e.x = p[0]; e.y = p[1];
    }
    for (const e of s.enemies) {
      if (e.hp > 0 && e.d >= PATH_LEN) {
        s.lives -= ENEMIES[e.kind].dmg;
        e.hp = 0;
        if (e.id === s.boss) s.boss = null;
        s.events.push({ type: 'leak', kind: e.kind });
      }
    }
    s.enemies = s.enemies.filter((e) => e.hp > 0);
    if (s.lives <= 0) { s.lives = 0; s.phase = 'dead'; s.events.push({ type: 'dead' }); return; }
    // towers
    for (const t of s.towers) {
      if (t.type === 'farm') continue;
      const st = statsOf(t);
      t.cd -= dt;
      if (t.cd > 0) continue;
      const inRange = s.enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - t.x, e.y - t.y) <= st.range);
      if (!inRange.length) { t.cd = 0; continue; }
      t.cd += 1 / st.rate;
      if (t.cd < 0) t.cd = 0;
      const e = pickTarget(t, inRange);
      t.aim = Math.atan2(e.y - t.y, e.x - t.x);
      if (t.type === 'flamethrower') {
        for (const o of inRange) {
          hurt(s, o, Math.max(st.dmg * 0.3, st.dmg - o.armor * 0.5), t);
          o.burn = Math.max(o.burn, st.burn); o.burnT = 2;
        }
        s.fx.push({ type: 'flame', x: t.x, y: t.y, a: t.aim, r: st.range, life: 0.12 });
      } else {
        const dmg = t.type === 'sniper' ? st.dmg : Math.max(st.dmg * 0.25, st.dmg - e.armor);
        hurt(s, e, dmg, t);
        s.fx.push({ type: t.type, x: t.x, y: t.y, tx: e.x, ty: e.y, life: t.type === 'sniper' ? 0.15 : 0.06 });
      }
    }
    s.enemies = s.enemies.filter((e) => e.hp > 0);
    // wave over
    if (!s.queue.length && !s.enemies.length) {
      s.cleared = s.wave;
      const bonus = 40 + s.wave * 8, farms = farmIncome(s);
      s.money += bonus + farms; s.earned += bonus + farms;
      s.events.push({ type: 'cleared', wave: s.wave, bonus, farms });
      if (s.wave >= LAST_WAVE) { s.phase = 'won'; s.events.push({ type: 'won' }); return; }
      s.phase = 'build';
      s.breakT = BREAK;
    }
  }

  // ---------------------------------------------------------------- the bot
  // Spot picking: how much of the road a tower at (x, y) with this range covers.
  const SPOTS = [];
  for (let x = 20; x <= W - 20; x += 20) for (let y = 20; y <= H - 20; y += 20) if (distToPath(x, y) >= ROAD + TOWER_R) SPOTS.push([x, y]);
  const covCache = new Map();
  function coverage(x, y, range) {
    const k = x + ',' + y + ',' + range;
    let v = covCache.get(k);
    if (v === undefined) { v = 0; for (const [px, py] of SAMPLES) if (Math.hypot(px - x, py - y) <= range) v++; covCache.set(k, v); }
    return v;
  }
  function bestSpot(s, type, jitter) {
    const range = type === 'farm' ? 0 : TOWERS[type].lv[0].range;
    let best = null, bestV = -Infinity;
    for (const [x, y] of SPOTS) {
      if (canPlace(s, type, x, y)) continue;
      // farms go where guns don't want to be; guns go where they see the most road
      const v = type === 'farm' ? -coverage(x, y, 120) : coverage(x, y, range) * (1 + (jitter ? (Math.random() - 0.5) * jitter : 0));
      if (v > bestV) { bestV = v; best = [x, y]; }
    }
    return best;
  }
  // a tower's worth: damage per second times how much road it sees
  function towerValue(type, lvl, x, y) {
    const st = TOWERS[type].lv[lvl];
    let dps = st.dmg * st.rate;
    if (type === 'flamethrower') dps = dps * 3.5 + st.burn * 1.5; // hits whole crowds
    if (type === 'machinegun') dps *= 0.85; // armor
    // a single gun can only use so much road: more coverage helps less and less
    return dps * Math.sqrt(coverage(x, y, st.range));
  }
  function defense(s) { return s.towers.reduce((a, t) => a + (t.type === 'farm' ? 0 : towerValue(t.type, t.lvl, t.x, t.y)), 0); }
  function need(n) { // what wave n asks for, in the same units (tuned against the simulation)
    const hp = waveList(n).reduce((a, [k]) => a + ENEMIES[k].hp * hpScale(n), 0);
    return hp * 0.16;
  }
  const AI = {
    easy: { farmUntil: 6, maxFarms: 2, margin: 0.45, jitter: 1.2, farmLevel: 1, maxLevel: 1, maxTowers: 7, spendEvery: 5 },
    medium: { farmUntil: 12, maxFarms: 3, margin: 0.8, jitter: 0.5, farmLevel: 2, maxLevel: 2, maxTowers: 12, spendEvery: 3 },
    hard: { farmUntil: 17, maxFarms: 7, margin: 1.35, jitter: 0, farmLevel: 5, maxLevel: 5, maxTowers: MAX_TOWERS, spendEvery: 0 },
  };
  function ai(s, level) {
    const p = AI[level] || AI.medium;
    if (s.phase === 'dead' || s.phase === 'won') return null;
    if (p.spendEvery && s.t - (s.aiAt || -99) < p.spendEvery) return null; // slower hands
    const upcoming = s.wave + 1;
    // losing lives means the estimate was too low: lean harder on defense from now on
    if (s.aiLives === undefined) { s.aiLives = s.lives; s.aiPressure = 1; }
    if (s.lives < s.aiLives) { s.aiPressure = Math.min(5, s.aiPressure * 1.3); s.aiLives = s.lives; }
    const bossSoon = BOSS_OF[upcoming] || (s.phase === 'wave' && BOSS_OF[s.wave]);
    const want = need(Math.min(LAST_WAVE, upcoming)) * p.margin * s.aiPressure * (bossSoon ? 1.5 : 1);
    const have = defense(s);
    const options = [];
    // defense: new towers and upgrades, by value per dollar
    if (s.towers.length < p.maxTowers) {
      for (const type of ORDER) {
        if (type === 'farm' || countOf(s, type) >= TOWERS[type].max) continue;
        const spot = bestSpot(s, type, p.jitter);
        if (!spot) continue;
        options.push({ kind: 'place', type, x: spot[0], y: spot[1], cost: TOWERS[type].cost, gain: towerValue(type, 0, spot[0], spot[1]) });
      }
    }
    for (const t of s.towers) {
      if (t.type === 'farm' || t.lvl >= p.maxLevel) continue;
      options.push({ kind: 'up', id: t.id, cost: upgradeCost(t), gain: towerValue(t.type, t.lvl + 1, t.x, t.y) - towerValue(t.type, t.lvl, t.x, t.y) });
    }
    const bestDef = options.sort((a, b) => b.gain / b.cost - a.gain / a.cost)[0];
    // economy
    let eco = null;
    if (upcoming <= p.farmUntil) {
      const farms = s.towers.filter((t) => t.type === 'farm');
      const low = farms.filter((t) => t.lvl < p.farmLevel).sort((a, b) => a.lvl - b.lvl)[0];
      if (farms.length < p.maxFarms && s.towers.length < MAX_TOWERS - 4) {
        const spot = bestSpot(s, 'farm');
        if (spot) eco = { kind: 'place', type: 'farm', x: spot[0], y: spot[1], cost: TOWERS.farm.cost };
      } else if (low) eco = { kind: 'up', id: low.id, cost: upgradeCost(low) };
    }
    const choice = have < want || !eco ? bestDef : eco;
    if (!choice || s.money < choice.cost) return null;
    s.aiAt = s.t;
    if (choice.kind === 'place') place(s, choice.type, choice.x, choice.y);
    else upgrade(s, choice.id);
    return choice;
  }

  const TD = {
    W, H, PATH, PATH_LEN, ROAD, TOWER_R, TOWERS, ORDER, ENEMIES, TARGETS, MAX_TOWERS, LAST_WAVE, BOSS_WAVES, START_MONEY, START_LIVES,
    create, step, place, canPlace, upgrade, sell, retarget, startWave, waveList, statsOf, upgradeCost, sellValue, farmIncome, countOf, pointAt, ai,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = TD;
  else root.TD = TD;
})(typeof window !== 'undefined' ? window : this);
