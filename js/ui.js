/* =========================================================================
   ui.js — every menu, the shop, the loadout, the codex and the battle HUD
   ========================================================================= */
(function () {
  const $ = TD.$, $$ = TD.$$, el = TD.el;

  const UI = TD.UI = {
    openModal: null, shopFilter: 'All', codexTab: 'Enemies',
    selMap: 'crossroads', selDiff: 'standard', battle: null, lastCash: -1
  };

  /* ---------------------------------------------------------------- */
  /*  helpers                                                          */
  /* ---------------------------------------------------------------- */
  function towerThumb(defId, level) {
    const def = TD.TOWERS[defId];
    return TD.Thumb.render('t:' + defId + ':' + (level || 0), () => TD.buildTower(def, level || 0), -0.75);
  }
  function enemyThumb(id) {
    const def = TD.ENEMIES[id];
    return TD.Thumb.render('e:' + id, () => TD.buildEnemy(def).group, -0.6);
  }
  function thumbImg(url, cls) {
    const d = el('div', cls || 'thumb');
    if (url) d.style.cssText += 'background-image:url(' + url + ');background-size:contain;background-repeat:no-repeat;background-position:center';
    return d;
  }
  function owned(id) { return TD.Save.data.unlocked.indexOf(id) >= 0; }
  /* One-line summary of what a maxed tower actually contributes. */
  function headline(def) {
    const s = TD.statsAt(def, 4);
    if (s.income) return 'Max $' + TD.fmt(s.income) + '/wave';
    if (s.heal) return 'Max ' + s.heal + ' HP/wave';
    if (s.buff) {
      const parts = [];
      if (s.buff.rate) parts.push('+' + Math.round(s.buff.rate * 100) + '% rate');
      if (s.buff.dmg) parts.push('+' + Math.round(s.buff.dmg * 100) + '% dmg');
      if (s.buff.range) parts.push('+' + Math.round(s.buff.range * 100) + '% range');
      return 'Max ' + parts.join(', ');
    }
    if (s.units) return 'Max ' + s.units.n + ' units × ' + TD.fmt(s.units.dmg) + ' dmg';
    if (s.drones) return 'Max ' + s.drones.n + ' drones';
    if (s.build) return 'Max ' + s.build.n + ' sentries';
    if (s.raise) return 'Raises ' + s.raise.n + ' thralls';
    if (s.aura && s.aura.slow) return 'Slows ' + Math.round(s.aura.slow * 100) + '%';
    return 'Max DPS ' + TD.fmt(TD.towerDps(def, 4));
  }
  function currencyOf(def) { return def.currency === 'gems' ? 'gems' : 'coins'; }

  /* Map preview drawn as a 2D top-down sketch. */
  function mapThumb(map) {
    const c = document.createElement('canvas');
    c.width = 320; c.height = 150;
    const g = c.getContext('2d');
    const th = TD.THEMES[map.theme];
    const hex = n => '#' + n.toString(16).padStart(6, '0');
    g.fillStyle = hex(th.ground); g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = hex(th.ground2);
    for (let x = 0; x < 8; x++) for (let z = 0; z < 4; z++) if ((x + z) % 2) g.fillRect(x * 40, z * 38, 40, 38);
    const sx = v => (v + 95) / 190 * c.width;
    const sz = v => (v + 95) / 190 * c.height * 1.9 - c.height * 0.45;
    (map.water || []).concat(map.lava || []).forEach(w => {
      g.fillStyle = map.lava ? hex(th.lava || 0xff5a1a) : hex(th.water || 0x2f7fb8);
      g.beginPath(); g.arc(sx(w.x), sz(w.z), w.r / 190 * c.width, 0, 6.3); g.fill();
    });
    g.lineCap = 'round'; g.lineJoin = 'round';
    map.paths.forEach(p => {
      g.strokeStyle = hex(th.edge); g.lineWidth = 15;
      g.beginPath(); p.forEach((pt, i) => i ? g.lineTo(sx(pt[0]), sz(pt[1])) : g.moveTo(sx(pt[0]), sz(pt[1]))); g.stroke();
      g.strokeStyle = hex(th.path); g.lineWidth = 11;
      g.beginPath(); p.forEach((pt, i) => i ? g.lineTo(sx(pt[0]), sz(pt[1])) : g.moveTo(sx(pt[0]), sz(pt[1]))); g.stroke();
    });
    map.paths.forEach(p => {
      g.fillStyle = '#ff5d6c';
      g.beginPath(); g.arc(sx(p[0][0]), sz(p[0][1]), 7, 0, 6.3); g.fill();
    });
    g.fillStyle = '#6ee7ff';
    g.beginPath(); g.arc(sx(map.base[0]), sz(map.base[1]), 9, 0, 6.3); g.fill();
    g.strokeStyle = '#0b1020'; g.lineWidth = 2; g.stroke();
    return c.toDataURL();
  }

  /* ---------------------------------------------------------------- */
  /*  lobby HUD                                                        */
  /* ---------------------------------------------------------------- */
  UI.refreshHud = function () {
    const d = TD.Save.data;
    const lv = TD.levelFromXp(d.xp);
    $('#hud-coins').textContent = TD.fmt(d.coins);
    $('#hud-gems').textContent = TD.fmt(d.gems);
    $('#hud-lvl').textContent = 'Lv ' + lv.level;
    $('#hud-xp').style.width = (lv.into / lv.need * 100) + '%';
    $('#hud-name').textContent = d.name;
    $$('.m-coins').forEach(e => e.textContent = TD.fmt(d.coins));
    $$('.m-gems').forEach(e => e.textContent = TD.fmt(d.gems));
    if (TD.Lobby.refreshPlayer) TD.Lobby.refreshPlayer();
  };

  /* ---------------------------------------------------------------- */
  /*  modal plumbing                                                   */
  /* ---------------------------------------------------------------- */
  const MODALS = { shop: '#shop-modal', loadout: '#loadout-modal', play: '#map-modal', codex: '#codex-modal', settings: '#settings-modal' };

  UI.open = function (id) {
    UI.close();
    const sel = MODALS[id]; if (!sel) return;
    if (id === 'shop') UI.buildShop();
    if (id === 'loadout') UI.buildLoadout();
    if (id === 'play') UI.buildMaps();
    if (id === 'codex') UI.buildCodex();
    if (id === 'settings') UI.buildSettings();
    UI.refreshHud();
    $(sel).classList.remove('hidden');
    UI.openModal = sel;
  };
  UI.close = function () {
    if (!UI.openModal) return;
    $(UI.openModal).classList.add('hidden');
    UI.openModal = null;
  };

  /* ---------------------------------------------------------------- */
  /*  SHOP                                                             */
  /* ---------------------------------------------------------------- */
  UI.buildShop = function () {
    const fl = $('#shop-filters'); fl.innerHTML = '';
    TD.ROLES.forEach(r => {
      const b = el('button', UI.shopFilter === r ? 'on' : '', r);
      b.onclick = () => { UI.shopFilter = r; TD.Audio.ui(); UI.buildShop(); };
      fl.appendChild(b);
    });

    const grid = $('#shop-grid'); grid.innerHTML = '';
    const d = TD.Save.data;
    const lvl = TD.levelFromXp(d.xp).level;

    const list = TD.TOWER_IDS
      .filter(id => UI.shopFilter === 'All' || TD.TOWERS[id].role === UI.shopFilter)
      .sort((a, b) => (TD.TOWERS[a].reqLevel - TD.TOWERS[b].reqLevel) || (TD.TOWERS[a].price - TD.TOWERS[b].price));

    list.forEach(id => {
      const def = TD.TOWERS[id];
      const have = owned(id);
      const cur = currencyOf(def);
      const locked = lvl < def.reqLevel;
      const card = el('div', 'card' + (have ? '' : locked ? ' locked' : ''));
      card.appendChild(thumbImg(towerThumb(id, 4)));
      card.appendChild(el('h4', null, def.name));
      card.appendChild(el('div', 'role', def.role + ' · ' + headline(def)));
      card.appendChild(el('p', null, def.desc));

      const tags = el('div', 'tagrow');
      const s4 = TD.statsAt(def, 4);
      if (s4.hidden) tags.appendChild(el('span', 'tag hid', 'Hidden'));
      if (s4.flying) tags.appendChild(el('span', 'tag air', 'Air'));
      if (def.attack === 'support' || def.attack === 'heal') tags.appendChild(el('span', 'tag sup', 'Support'));
      if (s4.income) tags.appendChild(el('span', 'tag sup', 'Income'));
      tags.appendChild(el('span', 'tag', '$' + TD.fmt(def.lv[0].c) + ' to place'));
      tags.appendChild(el('span', 'tag', 'Max ' + def.limit));
      card.appendChild(tags);

      const price = el('div', 'price');
      if (have) price.appendChild(el('span', 'owned', '✔ OWNED'));
      else if (locked) price.appendChild(el('span', 'owned', '🔒 Level ' + def.reqLevel));
      else price.appendChild(el('span', cur === 'gems' ? 'g' : 'c', (cur === 'gems' ? '✦ ' : '◆ ') + TD.fmt(def.price)));
      if (!have && !locked) {
        const buy = el('button', 'cta', 'BUY');
        buy.style.cssText = 'padding:6px 16px;font-size:12px;box-shadow:0 4px 0 #1d7a45';
        buy.onclick = ev => { ev.stopPropagation(); UI.buy(id); };
        price.appendChild(buy);
      }
      card.appendChild(price);
      if (def.role === 'Golden') card.appendChild(el('div', 'badge', 'GOLD'));
      else if (def.reqLevel >= 10) card.appendChild(el('div', 'badge lvl', 'LV ' + def.reqLevel));

      card.onclick = () => UI.towerInfo(id);
      grid.appendChild(card);
    });
  };

  UI.buy = function (id) {
    const def = TD.TOWERS[id], d = TD.Save.data, cur = currencyOf(def);
    if (owned(id)) return;
    if (d[cur] < def.price) { TD.Audio.error(); TD.toast('Not enough ' + cur, 'bad'); return; }
    d[cur] -= def.price;
    d.unlocked.push(id);
    if (d.loadout.indexOf(null) >= 0) d.loadout[d.loadout.indexOf(null)] = id;
    TD.Save.save();
    TD.Audio.upgrade();
    TD.toast('Unlocked ' + def.name + '!', 'good');
    UI.refreshHud(); UI.buildShop();
  };

  /* Detailed tower breakdown shown when a shop card is clicked. */
  UI.towerInfo = function (id) {
    const def = TD.TOWERS[id];
    const wrap = el('div', 'overlay');
    const m = el('div', 'modal');
    const head = el('header');
    head.appendChild(el('h2', null, def.name));
    head.appendChild(el('div', 'sub', def.role + ' · ' + def.attack));
    const x = el('button', 'x', '✕'); x.onclick = () => wrap.remove();
    head.appendChild(x);
    m.appendChild(head);

    const body = el('div');
    body.style.cssText = 'padding:16px 20px;overflow-y:auto';
    const top = el('div');
    top.style.cssText = 'display:flex;gap:14px;align-items:center;margin-bottom:12px';
    const th = thumbImg(towerThumb(id, 4)); th.style.cssText += 'width:110px;height:110px;flex:none;border-radius:10px;background-color:#121830';
    top.appendChild(th);
    top.appendChild(el('p', null, def.desc + '<br><br><b>Placement cost:</b> $' + TD.fmt(def.lv[0].c) +
      '<br><b>Limit:</b> ' + def.limit + ' per match'));
    body.appendChild(top);

    def.lv.forEach((l, i) => {
      const s = TD.statsAt(def, i);
      const row = el('div');
      row.style.cssText = 'border-top:1px solid #253055;padding:9px 0;font-size:12px;color:#8f9bc0';
      row.innerHTML = '<b style="color:#e8ecf8">Lv ' + i + ' — ' + l.n + '</b> ' +
        '<span style="float:right;color:' + (i ? '#ffc63d' : '#51d88a') + '">' + (i ? '$' + TD.fmt(l.c) : 'place $' + TD.fmt(l.c)) + '</span><br>' +
        l.t + '<br><span style="color:#6f7ca3">' +
        (s.dmg ? 'DMG ' + TD.fmt(s.dmg) + ' · ' : '') +
        (s.range ? 'RNG ' + s.range.toFixed(0) + ' · ' : '') +
        (s.cd ? 'CD ' + s.cd.toFixed(2) + 's · DPS ' + TD.fmt(TD.towerDps(def, i)) : '') +
        (s.income ? 'Income $' + s.income + '/wave' : '') +
        (s.heal ? 'Heal ' + s.heal + ' HP/wave' : '') +
        '</span>';
      body.appendChild(row);
    });
    if (def.ability) {
      const a = el('div');
      a.style.cssText = 'margin-top:12px;padding:10px;border-radius:10px;background:#2a2050;border:1px solid #4a3a7a;font-size:12px';
      a.innerHTML = '<b style="color:#c9b8ff">Ability — ' + def.ability.name + '</b><br>' + def.ability.desc +
        '<br><span style="color:#8f9bc0">Unlocks at level ' + def.ability.level + ' · ' + def.ability.cd + 's cooldown</span>';
      body.appendChild(a);
    }
    m.appendChild(body);
    wrap.appendChild(m);
    wrap.onclick = e => { if (e.target === wrap) wrap.remove(); };
    document.body.appendChild(wrap);
  };

  /* ---------------------------------------------------------------- */
  /*  LOADOUT                                                          */
  /* ---------------------------------------------------------------- */
  UI.buildLoadout = function () {
    const d = TD.Save.data;
    const slots = $('#loadout-slots'); slots.innerHTML = '';
    d.loadout.forEach((id, i) => {
      const s = el('div', 'slot' + (id ? ' filled' : ''));
      if (id) {
        const def = TD.TOWERS[id];
        const t = thumbImg(towerThumb(id, 4), 'sthumb');
        s.appendChild(t);
        s.appendChild(el('div', 'sname', def.name));
        s.appendChild(el('div', null, '<span style="color:#51d88a;font-weight:700">$' + TD.fmt(def.lv[0].c) + '</span>'));
        s.onclick = () => { d.loadout[i] = null; TD.Save.save(); TD.Audio.ui(); UI.buildLoadout(); };
      } else {
        s.appendChild(el('div', null, '<div style="font-size:30px;opacity:.4">+</div>'));
        s.appendChild(el('div', 'sname', 'Slot ' + (i + 1)));
      }
      slots.appendChild(s);
    });

    const load = d.loadout.filter(Boolean);
    const note = $('#loadout-slots').parentNode.querySelector('.loadout-note') || (() => {
      const n = el('div', 'loadout-note');
      n.style.cssText = 'padding:10px 20px 0;font-size:12px;color:#8f9bc0;line-height:1.5';
      $('#loadout-slots').after(n);
      return n;
    })();
    note.innerHTML = load.length
      ? 'Cheapest tower <b style="color:#51d88a">$' + TD.fmt(Math.min.apply(null, load.map(id => TD.TOWERS[id].lv[0].c))) + '</b>' +
        UI.loadoutWarnings(load, TD.diffById(UI.selDiff)).replace('<br>', ' · ')
      : 'Pick up to five towers. Bring something cheap to open with, something that sees hidden enemies, and something that hits air.';

    const grid = $('#loadout-grid'); grid.innerHTML = '';
    d.unlocked.slice().sort((a, b) => TD.TOWERS[a].lv[0].c - TD.TOWERS[b].lv[0].c).forEach(id => {
      const def = TD.TOWERS[id]; if (!def) return;
      const inLoad = d.loadout.indexOf(id) >= 0;
      const card = el('div', 'card' + (inLoad ? ' selected' : ''));
      card.appendChild(thumbImg(towerThumb(id, 4)));
      card.appendChild(el('h4', null, def.name));
      card.appendChild(el('div', 'role', def.role + ' · $' + TD.fmt(def.lv[0].c)));
      const tags = el('div', 'tagrow');
      const s4 = TD.statsAt(def, 4);
      if (s4.hidden) tags.appendChild(el('span', 'tag hid', 'Hidden'));
      if (s4.flying) tags.appendChild(el('span', 'tag air', 'Air'));
      tags.appendChild(el('span', 'tag', 'DPS ' + TD.fmt(TD.towerDps(def, 4))));
      card.appendChild(tags);
      card.onclick = () => {
        TD.Audio.ui();
        const at = d.loadout.indexOf(id);
        if (at >= 0) d.loadout[at] = null;
        else {
          const free = d.loadout.indexOf(null);
          if (free < 0) { TD.toast('Loadout is full — remove one first', 'bad'); return; }
          d.loadout[free] = id;
        }
        TD.Save.save(); UI.buildLoadout();
      };
      grid.appendChild(card);
    });
  };

  /* ---------------------------------------------------------------- */
  /*  MAP SELECT                                                       */
  /* ---------------------------------------------------------------- */
  UI.buildMaps = function () {
    const grid = $('#map-grid'); grid.innerHTML = '';
    TD.MAPS.forEach(map => {
      const card = el('div', 'card' + (UI.selMap === map.id ? ' selected' : ''));
      card.appendChild(thumbImg(mapThumb(map)));
      card.appendChild(el('h4', null, map.name));
      card.appendChild(el('div', 'role', '★'.repeat(map.tier) + '☆'.repeat(5 - map.tier) + ' · Rec. Lv ' + map.recLevel));
      card.appendChild(el('p', null, map.blurb));
      const tags = el('div', 'tagrow');
      tags.appendChild(el('span', 'tag', map.paths.length + ' path' + (map.paths.length > 1 ? 's' : '')));
      tags.appendChild(el('span', 'tag', 'Max ' + map.maxTowers + ' towers'));
      const beaten = TD.Save.data.mapsBeaten[map.id];
      if (beaten) tags.appendChild(el('span', 'tag sup', '✔ ' + TD.DIFFICULTIES[beaten - 1].name));
      card.appendChild(tags);
      card.onclick = () => { UI.selMap = map.id; TD.Audio.ui(); UI.buildMaps(); };
      grid.appendChild(card);
    });

    const dl = $('#diff-list'); dl.innerHTML = '';
    TD.DIFFICULTIES.forEach(df => {
      const b = el('div', 'diff' + (UI.selDiff === df.id ? ' on' : ''), df.name);
      if (UI.selDiff === df.id) { b.style.background = df.color; b.style.borderColor = df.color; b.style.color = '#0b1020'; }
      b.onclick = () => { UI.selDiff = df.id; TD.Audio.ui(); UI.buildMaps(); };
      dl.appendChild(b);
    });

    const map = TD.mapById(UI.selMap), df = TD.diffById(UI.selDiff);
    const load = TD.Save.data.loadout.filter(Boolean);
    $('#map-summary').innerHTML =
      '<b>' + map.name + '</b> · <b style="color:' + df.color + '">' + df.name + '</b> — ' + df.desc +
      '<br>Start: <b>$' + TD.fmt(df.cash) + '</b> · Base HP <b>' + df.baseHp + '</b> · Reward ×<b>' + df.reward.toFixed(1) + '</b>' +
      '<br>Loadout: <b>' + (load.length ? load.map(id => TD.TOWERS[id].name).join(', ') : 'EMPTY — pick towers first!') + '</b>' +
      UI.loadoutWarnings(load, df);
  };

  /* Catch the loadouts that make a run unwinnable before the player deploys. */
  UI.loadoutWarnings = function (load, df) {
    if (!load.length) return '';
    const warn = [];
    const cheapest = Math.min.apply(null, load.map(id => TD.TOWERS[id].lv[0].c));
    if (cheapest > df.cash / 2) {
      warn.push('your cheapest tower is <b>$' + TD.fmt(cheapest) + '</b> — you will only afford one at the start');
    }
    const canDetect = load.some(id => {
      const d = TD.TOWERS[id];
      return d.lv.some((l, i) => { const st = TD.statsAt(d, i); return st.hidden || st.reveal; });
    });
    if (!canDetect) warn.push('nothing here detects <b>hidden</b> enemies — they will walk straight past');
    const canAir = load.some(id => TD.statsAt(TD.TOWERS[id], 4).flying);
    if (!canAir) warn.push('nothing here can hit <b>flying</b> enemies');
    if (!warn.length) return '';
    return '<br><span style="color:#ffc63d">⚠ ' + warn.join(' · ') + '</span>';
  };

  /* ---------------------------------------------------------------- */
  /*  CODEX                                                            */
  /* ---------------------------------------------------------------- */
  UI.buildCodex = function () {
    const tabs = $('#codex-tabs'); tabs.innerHTML = '';
    ['Enemies', 'Towers', 'How to play'].forEach(t => {
      const b = el('button', UI.codexTab === t ? 'on' : '', t);
      b.onclick = () => { UI.codexTab = t; TD.Audio.ui(); UI.buildCodex(); };
      tabs.appendChild(b);
    });
    const grid = $('#codex-grid'); grid.innerHTML = '';

    if (UI.codexTab === 'Enemies') {
      TD.ENEMY_IDS.forEach(id => {
        const e = TD.ENEMIES[id];
        const card = el('div', 'card');
        card.appendChild(thumbImg(enemyThumb(id)));
        card.appendChild(el('h4', null, e.name));
        card.appendChild(el('div', 'role', (e.boss ? 'BOSS · ' : '') + 'HP ' + TD.fmt(e.hp) + ' · SPD ' + e.spd));
        card.appendChild(el('p', null, e.desc));
        const tags = el('div', 'tagrow');
        if (e.hidden) tags.appendChild(el('span', 'tag hid', 'Hidden'));
        if (e.flying) tags.appendChild(el('span', 'tag air', 'Flying'));
        if (e.def) tags.appendChild(el('span', 'tag', 'Armour ' + Math.round(e.def * 100) + '%'));
        if (e.immune) tags.appendChild(el('span', 'tag sup', 'Immune: ' + Object.keys(e.immune).join(', ')));
        if (e.split) tags.appendChild(el('span', 'tag', 'Splits'));
        if (e.revive) tags.appendChild(el('span', 'tag', 'Revives'));
        if (e.summon) tags.appendChild(el('span', 'tag', 'Summons'));
        tags.appendChild(el('span', 'tag', '$' + e.cash));
        card.appendChild(tags);
        if (e.boss) card.appendChild(el('div', 'badge', 'BOSS'));
        grid.appendChild(card);
      });
    } else if (UI.codexTab === 'Towers') {
      TD.TOWER_IDS.forEach(id => {
        const def = TD.TOWERS[id];
        const card = el('div', 'card' + (owned(id) ? '' : ' locked'));
        card.appendChild(thumbImg(towerThumb(id, 4)));
        card.appendChild(el('h4', null, def.name));
        card.appendChild(el('div', 'role', def.role + ' · ' + headline(def)));
        card.appendChild(el('p', null, def.desc));
        card.onclick = () => UI.towerInfo(id);
        grid.appendChild(card);
      });
    } else {
      grid.style.gridTemplateColumns = '1fr';
      const c = el('div', 'card');
      c.style.cursor = 'default';
      c.innerHTML =
        '<h4>Getting started</h4><p style="min-height:0">' +
        'Walk up to the glowing kiosks in the plaza and press <kbd>E</kbd>, or use the buttons on the left.<br><br>' +
        '<b>1. Shop</b> — spend ◆ coins to unlock new towers. Coins come from playing matches.<br>' +
        '<b>2. Loadout</b> — choose the 5 towers you can build in a match.<br>' +
        '<b>3. Play</b> — pick a map and difficulty, then deploy.</p>' +
        '<h4 style="margin-top:14px">In a match</h4><p style="min-height:0">' +
        'Click a tower in the bottom bar (or press <kbd>1</kbd>–<kbd>5</kbd>) and click the ground to build. ' +
        'Hold <kbd>Shift</kbd> while placing to keep building the same tower.<br><br>' +
        'Click a built tower to open its panel: <kbd>Q</kbd> upgrades, <kbd>X</kbd> sells for 65%, ' +
        '<kbd>T</kbd> cycles targeting, <kbd>F</kbd> triggers its ability.<br><br>' +
        '<kbd>Enter</kbd> starts the next wave early for a cash bonus. <kbd>P</kbd> pauses.</p>' +
        '<h4 style="margin-top:14px">Your character</h4><p style="min-height:0">' +
        'You are on the map during the battle. <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> walks, ' +
        '<kbd>Space</kbd> jumps, <kbd>Shift</kbd> sprints. Enemies ignore you and you block nothing — ' +
        'you are there to watch your defence from ground level.<br><br>' +
        'Walking makes the camera follow you; the arrow keys or a middle-drag let it go again, ' +
        'and <kbd>C</kbd> (or the ◎ button) toggles follow on and off. ' +
        'Right-drag rotates, the wheel zooms.</p>' +
        '<h4 style="margin-top:14px">Things that will kill you</h4><p style="min-height:0">' +
        '<b>Hidden</b> enemies can only be hit by towers with detection (or a Marshal nearby).<br>' +
        '<b>Flying</b> enemies need anti-air. <b>Armoured</b> enemies shrug off weak, fast shots — ' +
        'bring big single hits or armour-piercing.<br>' +
        '<b>Jammers</b> and <b>Detonators</b> shut your towers down temporarily. Spread your defence out.<br><br>' +
        'Build <b>Homesteads</b> early: income compounds. Sell them late for a defensive push.</p>';
      grid.appendChild(c);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  SETTINGS                                                         */
  /* ---------------------------------------------------------------- */
  UI.buildSettings = function () {
    const s = TD.Save.data.settings;
    const host = $('#settings-body'); host.innerHTML = '';
    function toggle(key, label, sub) {
      const row = el('div', 'srow');
      row.appendChild(el('label', null, label + (sub ? '<small>' + sub + '</small>' : '')));
      const sw = el('div', 'switch' + (s[key] ? ' on' : ''), '<i></i>');
      sw.onclick = () => {
        s[key] = !s[key]; TD.Save.save(); TD.Audio.ui();
        sw.classList.toggle('on', s[key]);
        if (key === 'music') s.music ? TD.Audio.startMusic() : TD.Audio.stopMusic();
      };
      row.appendChild(sw); host.appendChild(row);
    }
    toggle('sound', 'Sound effects');
    toggle('music', 'Background music');
    toggle('shadows', 'Shadows', 'Turn off for more performance (applies next match)');
    toggle('dmgNumbers', 'Floating damage numbers');

    const qrow = el('div', 'srow');
    qrow.appendChild(el('label', null, 'Scenery detail<small>Lower it if the game stutters (applies next match)</small>'));
    const qsw = el('div', 'switch' + (s.quality >= 1 ? ' on' : ''), '<i></i>');
    qsw.onclick = () => { s.quality = s.quality >= 1 ? 0 : 1; TD.Save.save(); TD.Audio.ui(); qsw.classList.toggle('on', s.quality >= 1); };
    qrow.appendChild(qsw); host.appendChild(qrow);

    const row = el('div', 'srow');
    row.appendChild(el('label', null, 'Camera sensitivity'));
    const r = el('input'); r.type = 'range'; r.min = '0.3'; r.max = '2.5'; r.step = '0.1'; r.value = s.sens;
    r.oninput = () => { s.sens = parseFloat(r.value); TD.Save.save(); };
    row.appendChild(r); host.appendChild(row);

    const nrow = el('div', 'srow');
    nrow.appendChild(el('label', null, 'Display name'));
    const inp = el('input'); inp.type = 'text'; inp.maxLength = 16; inp.value = TD.Save.data.name;
    inp.style.cssText = 'background:#1a2138;border:1px solid #2c3757;border-radius:8px;color:#e8ecf8;padding:7px 10px;font-family:inherit;width:150px';
    inp.onchange = () => { TD.Save.data.name = inp.value.slice(0, 16) || 'Defender'; TD.Save.save(); UI.refreshHud(); };
    nrow.appendChild(inp); host.appendChild(nrow);

    const stats = el('div');
    const d = TD.Save.data;
    stats.style.cssText = 'margin-top:8px;padding-top:12px;border-top:1px solid #2c3757;color:#8f9bc0;font-size:12px;line-height:1.7';
    stats.innerHTML = '<b style="color:#e8ecf8">Career</b><br>Wins ' + d.wins + ' · Losses ' + d.losses +
      ' · Best wave ' + d.bestWave + ' · Kills ' + TD.fmt(d.kills) +
      '<br>Towers unlocked ' + d.unlocked.length + ' / ' + TD.TOWER_IDS.length;
    host.appendChild(stats);
  };

  /* ---------------------------------------------------------------- */
  /*  BATTLE HUD                                                       */
  /* ---------------------------------------------------------------- */
  UI.enterBattle = function (B) {
    UI.battle = B;
    UI.close();
    $('#lobby-hud').classList.add('hidden');
    $('#battle-hud').classList.remove('hidden');
    $('#b-map').textContent = B.map.name + ' · ' + B.diff.name;
    UI.buildBar(B);
    UI.hideTower();
    UI.lastCash = -1;
    $('#b-speed').textContent = '1×';
    $('#b-pause').textContent = '❚❚';
  };
  UI.exitBattle = function () {
    $('#battle-hud').classList.add('hidden');
    $('#lobby-hud').classList.remove('hidden');
    UI.battle = null;
  };

  UI.buildBar = function (B) {
    const bar = $('#buildbar'); bar.innerHTML = '';
    B.loadout.forEach((id, i) => {
      const def = TD.TOWERS[id];
      const b = el('button', 'tbtn');
      b.dataset.tid = id;
      const th = thumbImg(towerThumb(id, 0), 'tthumb');
      b.appendChild(th);
      b.appendChild(el('div', 'tname', def.name));
      b.appendChild(el('div', 'tcost', '$' + TD.fmt(def.lv[0].c)));
      b.appendChild(el('div', 'tkey', i + 1));
      b.appendChild(el('div', 'tcount', ''));
      b.onclick = () => { TD.Audio.ui(); if (B.placing && B.placing.def.id === id) B.cancelPlace(); else B.beginPlace(id); };
      bar.appendChild(b);
    });
  };

  UI.setPlacing = function (id) {
    $$('#buildbar .tbtn').forEach(b => b.classList.toggle('active', b.dataset.tid === id));
    $('#place-hint').classList.toggle('hidden', !id);
  };

  /* Cached HUD nodes — tick() runs every frame, so no querying in there. */
  const N = {};
  function nodes() {
    if (N.hp) return N;
    N.hp = $('#b-hp'); N.wave = $('#b-wave'); N.cash = $('#b-cash');
    N.skip = $('#b-skip'); N.skipBonus = $('#b-skip-bonus');
    N.auto = $('#b-autostart'); N.autoNum = N.auto.querySelector('b');
    N.follow = $('#b-follow');
    return N;
  }

  UI.tick = function (B) {
    const n = nodes();
    n.hp.textContent = Math.ceil(B.hp);
    n.wave.textContent = B.wave + ' / ' + B.diff.waves;
    const cash = Math.floor(B.cash);
    if (cash !== UI.lastCash) {
      UI.lastCash = cash;
      n.cash.textContent = TD.fmt(cash);
      $$('#buildbar .tbtn').forEach(b => {
        const def = TD.TOWERS[b.dataset.tid];
        const n = B.towers.filter(t => t.def.id === def.id).length;
        b.classList.toggle('cant', cash < def.lv[0].c || n >= def.limit);
        b.querySelector('.tcount').textContent = n + '/' + def.limit;
      });
    }
    // skip / autostart
    if (B.phase === 'prep' && B.wave < B.diff.waves) {
      n.skip.classList.remove('hidden'); n.auto.classList.remove('hidden');
      n.skipBonus.textContent = '+$' + TD.skipBonus(B.diff, B.wave + 1, B.prepT);
      n.autoNum.textContent = Math.ceil(B.prepT);
    } else { n.skip.classList.add('hidden'); n.auto.classList.add('hidden'); }

    if (UI.panelTower) UI.tickTowerPanel();
    if (n.follow) n.follow.classList.toggle('on', B.camFollow);
  };

  UI.waveBanner = function (text, sub) {
    const b = $('#wave-banner');
    b.innerHTML = text + (sub ? '<small>' + sub + '</small>' : '');
    b.classList.remove('hidden');
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    clearTimeout(UI._bannerT);
    UI._bannerT = setTimeout(() => b.classList.add('hidden'), 2300);
  };

  const MODES = ['First', 'Last', 'Strongest', 'Weakest', 'Closest'];

  UI.showTower = function (t) {
    UI.panelTower = t;
    const p = $('#tower-panel');
    p.classList.remove('hidden');
    $('#tp-icon').style.cssText = 'background-image:url(' + towerThumb(t.def.id, t.level) + ');background-size:contain;background-repeat:no-repeat;background-position:center';
    $('#tp-name').textContent = t.def.name;
    $('#tp-lvl').textContent = 'LEVEL ' + t.level + ' — ' + t.def.lv[t.level].n;

    const s = t.stats;
    const st = $('#tp-stats'); st.innerHTML = '';
    function row(k, v) { st.appendChild(el('div', null, '<span>' + k + '</span><b>' + v + '</b>')); }
    /* Damage, cooldown and DPS all show what this tower is doing right now,
       auras and accumulated bonuses included, so the three agree with each
       other. */
    const dmgMul = (1 + t.buff.dmg) *
      (s.harvest ? 1 + Math.min(s.harvest.max, t.harvestKills * s.harvest.per) : 1);
    if (s.dmg) row('Damage', TD.fmt(Math.round(s.dmg * dmgMul)));
    if (s.cd) row('Cooldown', (s.cd / (1 + t.buff.rate)).toFixed(2) + 's');
    if (s.range) row('Range', Math.round(s.range * (1 + t.buff.range)));
    if (s.dmg && s.cd) row('DPS', TD.fmt(Math.round(TD.towerDps(t.def, t.level) * dmgMul * (1 + t.buff.rate))));
    if (s.income) row('Income', '$' + TD.fmt(s.income));
    if (s.heal) row('Heal', s.heal + ' HP');
    if (s.buff) row('Aura', (s.buff.rate ? '+' + Math.round(s.buff.rate * 100) + '% rate ' : '') + (s.buff.dmg ? '+' + Math.round(s.buff.dmg * 100) + '% dmg ' : '') + (s.buff.range ? '+' + Math.round(s.buff.range * 100) + '% rng' : ''));
    if (s.units) row('Units', s.units.n + ' × ' + TD.fmt(s.units.hp) + ' HP');
    if (s.hidden) row('Detects', 'Hidden');
    if (s.flying) row('Hits', 'Air');
    row('Kills', TD.fmt(t.kills));
    row('Damage done', TD.fmt(Math.round(t.dealt)));

    /* upgrade */
    const up = $('#tp-upgrade'); up.innerHTML = '';
    if (t.level >= t.def.lv.length - 1) {
      up.appendChild(el('div', 'upg max', 'MAX LEVEL'));
    } else {
      const nx = t.def.lv[t.level + 1];
      const can = UI.battle && UI.battle.cash >= nx.c;
      const b = el('button', 'upg' + (can ? '' : ' cant'),
        '<span class="uc">$' + TD.fmt(nx.c) + '</span><div class="un">' + nx.n + '</div><div class="ud">' + nx.t + '</div>');
      b.onclick = () => { UI.battle.upgrade(t); };
      up.appendChild(b);
    }

    /* abilities */
    const ab = $('#tp-abilities'); ab.innerHTML = '';
    if (t.def.ability) {
      const a = t.def.ability;
      const ready = t.level >= a.level && t.abilityCd <= 0;
      const b = el('button', 'abil' + (ready ? ' ready' : ''),
        '<div class="cd"></div><span>' + (t.level < a.level ? '🔒 ' : '⚡ ') + a.name + '</span>');
      b.title = a.desc;
      b.onclick = () => UI.battle.useAbility(t);
      ab.appendChild(b);
      UI._abilBtn = b;
    } else UI._abilBtn = null;

    $('#tp-target').textContent = 'Target: ' + MODES[t.mode];
    $('#tp-sell').textContent = 'Sell $' + TD.fmt(Math.floor(t.spent * 0.65));
  };

  UI.tickTowerPanel = function () {
    const t = UI.panelTower; if (!t) return;
    if (UI._abilBtn && t.def.ability) {
      const a = t.def.ability;
      const pct = t.abilityCd > 0 ? (t.abilityCd / a.cd) * 100 : 0;
      UI._abilBtn.querySelector('.cd').style.width = pct + '%';
      UI._abilBtn.classList.toggle('ready', t.level >= a.level && t.abilityCd <= 0);
    }
    // keep the upgrade button affordability fresh
    const btn = $('#tp-upgrade .upg');
    if (btn && !btn.classList.contains('max') && UI.battle) {
      const nx = t.def.lv[t.level + 1];
      btn.classList.toggle('cant', UI.battle.cash < nx.c);
    }
  };

  UI.hideTower = function () {
    UI.panelTower = null;
    $('#tower-panel').classList.add('hidden');
  };

  UI.toggleFollow = function () {
    const B = UI.battle; if (!B) return;
    B.setFollow(!B.camFollow);
    const btn = $('#b-follow');
    if (btn) { btn.classList.toggle('on', B.camFollow); btn.title = B.camFollow ? 'Camera follows you (C)' : 'Free camera (C)'; }
    TD.toast(B.camFollow ? 'Camera following your character' : 'Free camera');
    TD.Audio.ui();
  };

  UI.togglePause = function () {
    const B = UI.battle; if (!B) return;
    B.paused = !B.paused;
    $('#b-pause').textContent = B.paused ? '▶' : '❚❚';
    TD.Audio.ui();
  };

  /* ---------------------------------------------------------------- */
  /*  RESULTS                                                          */
  /* ---------------------------------------------------------------- */
  UI.showResults = function (won, B, coins, xp) {
    const m = $('#result-modal');
    $('#res-title').textContent = won ? 'VICTORY' : 'DEFEAT';
    $('#res-title').className = 'res-title ' + (won ? 'win' : 'lose');
    $('#res-sub').textContent = won
      ? 'You held ' + B.map.name + ' on ' + B.diff.name
      : 'The base fell on wave ' + B.wave + ' of ' + B.diff.waves;
    const s = B.stats;
    $('#res-stats').innerHTML =
      '<div><span>Waves survived</span><b>' + B.wave + '</b></div>' +
      '<div><span>Enemies killed</span><b>' + TD.fmt(s.kills) + '</b></div>' +
      '<div><span>Damage dealt</span><b>' + TD.fmt(Math.round(s.damage)) + '</b></div>' +
      '<div><span>Cash earned</span><b>$' + TD.fmt(s.cashEarned) + '</b></div>' +
      '<div><span>Towers built</span><b>' + s.placed + '</b></div>' +
      '<div><span>Leaks</span><b>' + s.leaked + '</b></div>';
    $('#res-rewards').innerHTML =
      '<span class="c">◆ ' + TD.fmt(coins) + '</span><span class="x">✦ ' + TD.fmt(xp) + ' XP</span>';
    m.classList.remove('hidden');
  };

  /* ---------------------------------------------------------------- */
  /*  wiring                                                           */
  /* ---------------------------------------------------------------- */
  UI.init = function () {
    $('#btn-play').onclick = () => { TD.Audio.ui(); UI.open('play'); };
    $('#btn-shop').onclick = () => { TD.Audio.ui(); UI.open('shop'); };
    $('#btn-loadout').onclick = () => { TD.Audio.ui(); UI.open('loadout'); };
    $('#btn-codex').onclick = () => { TD.Audio.ui(); UI.open('codex'); };
    $('#btn-settings').onclick = () => { TD.Audio.ui(); UI.open('settings'); };
    $$('[data-close]').forEach(b => b.onclick = () => { TD.Audio.ui(); UI.close(); });
    $$('.overlay').forEach(o => o.addEventListener('click', e => {
      if (e.target === o && o.id !== 'boot' && o.id !== 'result-modal') UI.close();
    }));

    $('#btn-start').onclick = () => {
      const load = TD.Save.data.loadout.filter(Boolean);
      if (!load.length) { TD.Audio.error(); TD.toast('Pick at least one tower in Loadout', 'bad'); return; }
      TD.Audio.ui();
      TD.Game.startMatch(UI.selMap, UI.selDiff, load);
    };
    $('#btn-reset').onclick = () => {
      if (!confirm('Erase all progress: coins, gems, unlocked towers and stats?')) return;
      TD.Save.reset(); UI.refreshHud(); UI.buildSettings();
      TD.toast('Save data reset');
    };

    $('#b-pause').onclick = () => UI.togglePause();
    $('#b-follow').onclick = () => UI.toggleFollow();
    $('#b-speed').onclick = () => {
      const B = UI.battle; if (!B) return;
      B.speed = B.speed === 1 ? 2 : B.speed === 2 ? 3 : 1;
      $('#b-speed').textContent = B.speed + '×';
      TD.Audio.ui();
    };
    $('#b-quit').onclick = () => {
      const B = UI.battle; if (!B) return;
      if (!confirm('Leave the match? Progress in this match is lost.')) return;
      TD.Game.toLobby();
    };
    $('#b-skip').onclick = () => { const B = UI.battle; if (B) B.startWave(true); };
    $('#tp-close').onclick = () => { if (UI.battle) UI.battle.select(null); };
    $('#tp-target').onclick = () => {
      const t = UI.panelTower; if (!t) return;
      t.mode = (t.mode + 1) % MODES.length; TD.Audio.ui(); UI.showTower(t);
    };
    $('#tp-sell').onclick = () => { const t = UI.panelTower; if (t && UI.battle) UI.battle.sell(t); };

    $('#btn-lobby').onclick = () => { $('#result-modal').classList.add('hidden'); TD.Game.toLobby(); };
    $('#btn-again').onclick = () => {
      $('#result-modal').classList.add('hidden');
      const B = UI.battle;
      TD.Game.startMatch(B.map.id, B.diff.id, TD.Save.data.loadout.filter(Boolean));
    };
  };
})();
