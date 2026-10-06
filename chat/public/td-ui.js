// Tower Defense screen. Each player defends their own map (td.js) against the same waves; the
// two browsers only swap progress reports (wave, lives, towers) for the scoreboard and mini-map.
// Whoever survives more waves wins; clearing wave 25 wins outright.
(() => {
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid instanceof Node ? kid : String(kid));
    return el;
  }
  // Tower pictures (td-icons.js): an <svg> for the side panel, a Path2D for the map.
  const SVG = 'http://www.w3.org/2000/svg';
  function icon(type, lvl, cls) {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 512 512');
    svg.setAttribute('class', 'td-icon' + (cls ? ' ' + cls : ''));
    svg.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', window.TD_ICONS[type][lvl][1]);
    p.setAttribute('fill', 'currentColor');
    svg.append(p);
    return svg;
  }
  const pathCache = {};
  const iconPath = (type, lvl) => pathCache[type + lvl] || (pathCache[type + lvl] = new Path2D(window.TD_ICONS[type][lvl][1]));
  // dark picture on light towers, white on dark ones
  const inkFor = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 150 ? '#111827' : '#ffffff'; };
  const isTyping = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable); };
  const money = (n) => '$' + Math.floor(n).toLocaleString();
  const TARGET_LABEL = { first: 'First', strong: 'Strongest', last: 'Last', close: 'Closest' };
  const BOSS_NAME = { 5: 'Warlord', 10: 'Juggernaut', 25: 'Overlord' };

  window.TDGame = function TDGame(stage, api) {
    const T = window.TD, s = T.create();
    const me = api.you, oppIdx = 1 - me, oppName = api.players[oppIdx].name;
    let opp = null; // the other player's last report
    let bot = null;
    if (api.bot) bot = { s: T.create(), level: api.bot.level, aiT: 0 };

    // ---------------------------------------------------------------- layout
    const cv = h('canvas', { width: T.W, height: T.H, class: 'td-canvas' });
    const ctx = cv.getContext('2d');
    const stats = h('div', { class: 'td-stats' });
    const waveBtn = h('button', { class: 'btn primary small', onclick: () => { T.startWave(s); render(); } }, 'Start wave now');
    const speedBtns = [1, 2, 3].map((n) => h('button', { class: 'btn small td-speed' + (n === 1 ? ' sel' : ''), onclick: () => setSpeed(n) }, n + '×'));
    const shop = h('div', { class: 'td-shop' });
    const shopBtns = {};
    for (const type of T.ORDER) {
      const d = T.TOWERS[type];
      shopBtns[type] = h('button', { class: 'td-buy', title: `${d.name}: ${d.desc} (key ${d.key})`, onclick: () => choose(type) },
        h('span', { class: 'td-buy-icon', style: `background:${d.color};color:${inkFor(d.color)}` }, icon(type, 0)),
        h('span', { class: 'td-buy-name' }, d.name), h('span', { class: 'td-buy-cost' }, money(d.cost)), h('small', {}, ''));
      shop.append(shopBtns[type]);
    }
    const info = h('div', { class: 'td-info' });
    const oppMap = h('canvas', { width: 200, height: 125, class: 'td-mini', title: 'Click to watch their map', onclick: () => openPeek() });
    const peekCv = h('canvas', { width: T.W, height: T.H, class: 'td-peek-canvas' });
    const peekHead = h('div', { class: 'td-peek-title' });
    const peek = h('div', { class: 'td-peek hidden', onclick: (e) => { if (e.target === peek) closePeek(); } },
      h('div', { class: 'td-peek-card' },
        h('div', { class: 'td-peek-head' }, peekHead, h('button', { class: 'close-x', title: 'Close (Esc)', 'aria-label': 'Close', onclick: () => closePeek() }, 'X')),
        peekCv, h('small', { class: 'muted' }, api.bot ? 'Live view of the bot’s map.' : 'Live view, updated a couple of times a second. Your own game keeps running.')));
    let peekOpen = false;
    function openPeek() { peekOpen = true; peek.classList.remove('hidden'); drawPeek(); }
    function closePeek() { peekOpen = false; peek.classList.add('hidden'); }
    const oppBox = h('div', { class: 'td-opp' });
    stage.append(h('div', { class: 'td-wrap' },
      h('div', { class: 'td-board' }, cv),
      h('div', { class: 'td-side' }, stats, h('div', { class: 'row td-wave-row' }, waveBtn, h('span', { class: 'td-speeds' }, speedBtns)),
        h('b', { class: 'td-h' }, 'Towers'), shop, info, h('b', { class: 'td-h' }, api.bot ? oppName : `${oppName}’s map`), oppBox, oppMap, h('small', { class: 'muted td-mini-hint' }, '🔍 Click the map to watch it')),
      peek));

    // ---------------------------------------------------------------- input
    let placing = null, selected = null, hover = null, speed = 1;
    const levelUps = [];
    const EKINDS = Object.keys(T.ENEMIES);
    function doUpgrade(id) {
      const err = T.upgrade(s, id);
      if (err) { flash(err); return; }
      const t = s.towers.find((x) => x.id === id), d = T.TOWERS[t.type];
      levelUps.push({ x: t.x, y: t.y, at: performance.now(), text: `${d.names[t.lvl]}!` });
    }
    const banners = [];
    function setSpeed(n) { speed = n; speedBtns.forEach((b, i) => b.classList.toggle('sel', i + 1 === n)); }
    function choose(type) { placing = placing === type ? null : type; selected = null; render(); }
    // where the pointer is on the map (the picture keeps its shape, so allow for any space around it)
    const toMap = (e) => {
      const r = cv.getBoundingClientRect(), k = Math.min(r.width / T.W, r.height / T.H);
      return [(e.clientX - (r.left + (r.width - T.W * k) / 2)) / k, (e.clientY - (r.top + (r.height - T.H * k) / 2)) / k];
    };
    cv.addEventListener('pointermove', (e) => { hover = toMap(e); });
    cv.addEventListener('pointerleave', () => { hover = null; });
    cv.addEventListener('contextmenu', (e) => { e.preventDefault(); placing = null; selected = null; render(); });
    cv.addEventListener('click', (e) => {
      const [x, y] = toMap(e);
      if (placing) {
        const err = T.place(s, placing, Math.round(x), Math.round(y));
        if (err) flash(err);
        else if (!e.shiftKey || s.money < T.TOWERS[placing].cost) { selected = s.towers[s.towers.length - 1].id; placing = null; } // hold Shift to keep placing
        render();
        return;
      }
      const t = s.towers.find((t) => Math.hypot(t.x - x, t.y - y) <= T.TOWER_R + 4);
      selected = t ? t.id : null;
      render();
    });
    const onKey = (e) => {
      if (isTyping() || e.ctrlKey || e.metaKey || e.altKey) return;
      const type = T.ORDER.find((k) => T.TOWERS[k].key === e.key);
      if (type) { choose(type); e.preventDefault(); return; }
      if (e.key === 'Escape' && peekOpen) { closePeek(); e.preventDefault(); return; }
      if (e.key === 'Escape') { placing = null; selected = null; render(); }
      else if (e.key === ' ' && s.phase === 'build') { T.startWave(s); e.preventDefault(); render(); }
      else if ((e.key === 'u' || e.key === 'U') && selected) { doUpgrade(selected); render(); }
      else if ((e.key === 't' || e.key === 'T') && selected) { T.retarget(s, selected); render(); }
    };
    addEventListener('keydown', onKey);
    let flashMsg = null;
    function flash(text) { flashMsg = { text, until: performance.now() + 1800 }; }

    // ---------------------------------------------------------------- side panel
    function render() {
      const inc = T.farmIncome(s);
      stats.replaceChildren(...[
        h('div', { class: 'td-stat' }, h('small', {}, 'Lives'), h('b', { class: s.lives <= 25 ? 'low' : '' }, '❤ ' + s.lives)),
        h('div', { class: 'td-stat' }, h('small', {}, 'Money'), h('b', {}, money(s.money))),
        h('div', { class: 'td-stat' }, h('small', {}, 'Wave'), h('b', {}, `${s.wave} / ${T.LAST_WAVE}`)),
        h('div', { class: 'td-stat' }, h('small', {}, 'Towers'), h('b', {}, `${s.towers.length} / ${T.MAX_TOWERS}`)),
        inc ? h('div', { class: 'td-stat wide' }, h('small', {}, 'Farms pay after each wave'), h('b', {}, '🌾 ' + money(inc))) : null].filter(Boolean));
      waveBtn.disabled = s.phase !== 'build';
      waveBtn.textContent = s.phase === 'build' ? `Start wave ${s.wave + 1} now (${Math.ceil(s.breakT)}s)` : s.phase === 'wave' ? `Wave ${s.wave} in progress` : 'Game over';
      for (const type of T.ORDER) {
        const d = T.TOWERS[type], n = T.countOf(s, type), b = shopBtns[type];
        b.querySelector('small').textContent = d.max === Infinity ? `${n} placed` : `${n} / ${d.max}`;
        b.classList.toggle('sel', placing === type);
        b.disabled = n >= d.max || s.towers.length >= T.MAX_TOWERS || s.money < d.cost || s.phase === 'dead' || s.phase === 'won';
      }
      const t = selected && s.towers.find((x) => x.id === selected);
      if (!t) {
        info.replaceChildren(h('div', { class: 'td-help muted' }, placing
          ? `Click the map to place a ${T.TOWERS[placing].name.toLowerCase()}. Shift-click to place several. Right-click or Esc to stop.`
          : 'Pick a tower (or press 1–5), then click the map. Click a tower to upgrade or sell it. Space starts the next wave.'));
        return;
      }
      const d = T.TOWERS[t.type], st = T.statsOf(t), nx = t.lvl < 5 ? d.lv[t.lvl + 1] : null, cost = T.upgradeCost(t);
      const row = (label, a, b) => h('div', { class: 'td-row' }, h('span', {}, label), h('b', {}, a), b !== undefined && b !== a ? h('span', { class: 'td-next' }, '→ ' + b) : null);
      const fmt = (v) => (Math.round(v * 10) / 10).toString();
      info.replaceChildren(...[
        h('div', { class: 'td-sel-head' }, h('span', { class: 'td-buy-icon' + (t.lvl >= 5 ? ' gold' : ''), style: `background:${d.color};color:${inkFor(d.color)}` }, icon(t.type, t.lvl)),
          h('div', { class: 'td-sel-name' }, h('b', {}, d.names[t.lvl]), h('small', { class: 'muted' }, t.lvl ? `${d.name} · level ${t.lvl}` : 'Not upgraded yet')),
          h('span', { class: 'td-pips' }, [0, 1, 2, 3, 4].map((i) => h('i', { class: i < t.lvl ? 'on' : '' })))),
        h('div', { class: 'td-ladder' }, d.names.map((name, i) => h('span', { class: i === t.lvl ? 'cur' : i < t.lvl ? 'done' : '', title: `${i ? 'Level ' + i : 'Base'}: ${name}` }, icon(t.type, i)))),
        t.type === 'farm'
          ? row('Pays per wave', money(st.income), nx ? money(nx.income) : undefined)
          : [row('Damage', fmt(st.dmg), nx ? fmt(nx.dmg) : undefined), row('Shots / sec', fmt(st.rate), nx ? fmt(nx.rate) : undefined),
            row('Range', String(st.range), nx ? String(nx.range) : undefined), st.burn ? row('Burn / sec', String(st.burn), nx ? String(nx.burn) : undefined) : null,
            h('div', { class: 'td-row muted' }, h('span', {}, 'Damage dealt'), h('b', {}, Math.round(t.dmg).toLocaleString()))],
        h('div', { class: 'td-actions' },
          h('button', { class: 'btn primary small', disabled: cost === null || s.money < cost, onclick: () => { doUpgrade(t.id); render(); } },
            ...(cost === null ? [icon(t.type, 5), ' Fully upgraded'] : ['Upgrade to ', icon(t.type, t.lvl + 1), ` ${d.names[t.lvl + 1]} · ${money(cost)} (U)`])),
          t.type === 'farm' ? null : h('button', { class: 'btn small', title: 'Which enemy it shoots (T)', onclick: () => { T.retarget(s, t.id); render(); } }, 'Target: ' + TARGET_LABEL[t.target]),
          h('button', { class: 'btn small danger', onclick: () => { T.sell(s, t.id); selected = null; render(); } }, `Sell ${money(T.sellValue(t))}`))].flat().filter(Boolean));
    }
    function renderOpp() {
      const o = opp;
      const out = o && o.d, won = o && o.v;
      oppBox.replaceChildren(
        h('div', { class: 'td-opp-line' },
          h('span', {}, '🌊 ', h('b', {}, o ? `Wave ${o.w}` : 'Starting…')),
          h('span', {}, '❤ ', h('b', {}, o ? o.l : 100)),
          h('span', {}, '🏰 ', h('b', {}, o ? o.tw.length : 0))),
        h('small', { class: 'muted' }, !o ? 'Waiting for their first report…' : won ? 'Beat wave 25!' : out ? `Overrun at wave ${o.w} (survived ${o.c})` : `Survived ${o.c} wave${o.c === 1 ? '' : 's'} · ${money(o.m)}`));
      const g = oppMap.getContext('2d'), k = 200 / T.W;
      g.fillStyle = '#1f3d2b'; g.fillRect(0, 0, 200, 125);
      g.strokeStyle = '#8a7559'; g.lineWidth = T.ROAD * 2 * k; g.lineJoin = 'round';
      g.beginPath(); T.PATH.forEach(([x, y], i) => (i ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k))); g.stroke();
      if (o) for (const [ti, x, y, lvl] of o.tw) {
        const d = T.TOWERS[T.ORDER[ti]];
        if (!d) continue;
        g.fillStyle = d.color; g.beginPath(); g.arc(x * k, y * k, 3 + lvl * 0.4, 0, 7); g.fill();
        if (lvl >= 5) { g.strokeStyle = '#facc15'; g.lineWidth = 1.5; g.stroke(); }
      }
      if (o && o.en) for (const [ki, x, y] of o.en) { const e = T.ENEMIES[EKINDS[ki]]; if (!e) continue; g.fillStyle = e.color; g.beginPath(); g.arc(x * k, y * k, e.boss ? 4 : 1.8, 0, 7); g.fill(); }
      if (peekOpen) drawPeek();
      if (out || won) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, 200, 125); g.fillStyle = '#fff'; g.font = 'bold 15px Outfit, Arial'; g.textAlign = 'center'; g.fillText(won ? 'WON' : 'OVERRUN', 100, 68); }
    }

    // ---------------------------------------------------------------- drawing
    function drawBoard(g) {
      g.fillStyle = '#21452f'; g.fillRect(0, 0, T.W, T.H);
      g.fillStyle = 'rgba(255,255,255,.025)';
      for (let x = 0; x < T.W; x += 40) for (let y = (x / 40) % 2 ? 0 : 20; y < T.H; y += 40) g.fillRect(x, y, 20, 20);
      g.lineJoin = 'round'; g.lineCap = 'butt';
      const road = (w, c) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); T.PATH.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
      road(T.ROAD * 2 + 6, '#5d4b36'); road(T.ROAD * 2, '#9a8462');
      g.setLineDash([10, 12]); road(2, 'rgba(255,255,255,.18)'); g.setLineDash([]);
      g.font = '20px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('🚩', 18, 44); g.fillText('🏰', 780, 470);
    }
    const shade = (hex, amt) => { // amt -1..1: darker..lighter
      const n = parseInt(hex.slice(1), 16), f = (c) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
      return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
    };
    function poly(g, x, y, r, sides, rot) { g.beginPath(); for (let i = 0; i < sides; i++) { const a = rot + (i / sides) * Math.PI * 2; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); }
    // A tower looks different at every level: a bigger body, a base plate (square, then
    // octagon), a ring, more and longer barrels, a glow, and a gold finish at the top level.
    function drawTower(g, type, lvl, x, y, aim, opts) {
      const d = T.TOWERS[type], r = T.TOWER_R + lvl * 0.45, now = performance.now() / 1000;
      opts = opts || {};
      g.save();
      if (opts.alpha) g.globalAlpha = opts.alpha;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(x + 2, y + 3, r + (lvl >= 2 ? 3 : 1), 0, 7); g.fill();
      if (lvl >= 2) { // base plate
        poly(g, x, y, r + 4, lvl >= 3 ? 8 : 4, lvl >= 3 ? Math.PI / 8 : Math.PI / 4);
        g.fillStyle = lvl >= 5 ? '#78350f' : '#1f2937'; g.fill();
        g.strokeStyle = lvl >= 5 ? '#facc15' : shade(d.color, -0.3); g.lineWidth = 2; g.stroke();
      }
      if (lvl >= 4) { g.shadowColor = lvl >= 5 ? '#fde047' : d.color; g.shadowBlur = 10 + Math.sin(now * 4) * 4; }
      const grd = g.createRadialGradient(x - r * 0.35, y - r * 0.35, 1, x, y, r);
      grd.addColorStop(0, lvl >= 5 ? '#fef9c3' : shade(d.color, 0.45));
      grd.addColorStop(lvl >= 5 ? 0.35 : 0, lvl >= 5 ? shade(d.color, 0.2) : shade(d.color, 0.45));
      grd.addColorStop(1, shade(d.color, -0.12 * lvl)); // keeps its own color; level 5 gets a gold shine and trim
      g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.shadowBlur = 0;
      g.strokeStyle = opts.selected ? '#fff' : lvl >= 5 ? '#facc15' : 'rgba(0,0,0,.45)'; g.lineWidth = opts.selected ? 3 : lvl >= 5 ? 2.5 : 2; g.stroke();
      if (lvl >= 1) { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r - 4, 0, 7); g.stroke(); }
      if (type !== 'farm') { // barrels
        const n = type === 'machinegun' ? (lvl >= 4 ? 3 : lvl >= 2 ? 2 : 1) : lvl >= 3 ? 2 : 1;
        const len = (type === 'sniper' ? 20 : type === 'flamethrower' ? 13 : 15) + lvl * 1.6;
        const w = type === 'sniper' ? 3 : type === 'machinegun' ? 3.5 : type === 'flamethrower' ? 6 : 4;
        const cos = Math.cos(aim), sin = Math.sin(aim);
        g.strokeStyle = lvl >= 5 ? '#a16207' : '#1f2937'; g.lineWidth = w; g.lineCap = 'round';
        for (let i = 0; i < n; i++) {
          const off = (i - (n - 1) / 2) * (w + 1.5);
          const bx = x - sin * off, by = y + cos * off;
          g.beginPath(); g.moveTo(bx + cos * r * 0.72, by + sin * r * 0.72); g.lineTo(bx + cos * (r * 0.72 + len * 0.75), by + sin * (r * 0.72 + len * 0.75)); g.stroke(); // from the rim, so the picture stays clear
        }
      }
      { // the level's picture
        const size = r * 1.55, ink = inkFor(d.color);
        g.save();
        g.translate(x - size / 2, y - size / 2);
        g.scale(size / 512, size / 512);
        g.shadowColor = ink === '#ffffff' ? 'rgba(0,0,0,.6)' : 'rgba(255,255,255,.5)'; g.shadowBlur = 3;
        g.fillStyle = ink; g.fill(iconPath(type, lvl));
        g.restore();
      }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let i = 0; i < lvl; i++) { // level stars
        const sx = x - (lvl - 1) * 3 + i * 6, sy = y + r + 6;
        g.fillStyle = lvl >= 5 ? '#fde047' : '#facc15'; poly(g, sx, sy, 3, 4, Math.PI / 4); g.fill();
      }
      if (lvl >= 5) for (let i = 0; i < 3; i++) { // sparkles circling a maxed tower
        const a = now * 1.6 + (i * Math.PI * 2) / 3;
        g.fillStyle = '#fef08a'; poly(g, x + Math.cos(a) * (r + 7), y + Math.sin(a) * (r + 7), 2.2, 4, a); g.fill();
      }
      g.restore();
    }
    function drawEnemy(g, kind, x, y, frac, burning) {
      const d = T.ENEMIES[kind];
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x + 2, y + d.r * 0.8, d.r, d.r * 0.45, 0, 0, 7); g.fill();
      g.fillStyle = d.color; g.beginPath(); g.arc(x, y, d.r, 0, 7); g.fill();
      if (d.armor) { g.strokeStyle = '#cbd5e1'; g.lineWidth = 3; g.stroke(); }
      if (burning) { g.strokeStyle = 'rgba(251,146,60,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, d.r + 3, 0, 7); g.stroke(); }
      if (d.boss) { g.font = `${d.r}px serif`; g.fillText('👑', x, y - d.r - 8); }
      if (frac < 1 && !d.boss) {
        g.fillStyle = '#111'; g.fillRect(x - 11, y - d.r - 7, 22, 4);
        g.fillStyle = '#4ade80'; g.fillRect(x - 11, y - d.r - 7, 22 * Math.max(0, frac), 4);
      }
    }
    function drawPeek() {
      const o = opp, g = peekCv.getContext('2d');
      peekHead.replaceChildren(h('b', {}, `${oppName}’s map`),
        h('span', { class: 'muted' }, o ? ` · Wave ${o.w} · ❤ ${o.l} · 🏰 ${o.tw.length} · ${money(o.m)}` : ' · waiting for their first report…'));
      drawBoard(g);
      if (!o) return;
      for (const [ti, x, y, lvl, aim] of o.tw) if (T.ORDER[ti]) drawTower(g, T.ORDER[ti], Math.max(0, Math.min(5, lvl | 0)), x, y, (aim || 0) / 10);
      let boss = null;
      for (const [ki, x, y, pct] of o.en || []) {
        const kind = EKINDS[ki];
        if (!kind) continue;
        drawEnemy(g, kind, x, y, pct / 100, false);
        if (T.ENEMIES[kind].boss) boss = [kind, pct];
      }
      if (boss) {
        g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(200, 8, 400, 26);
        g.fillStyle = '#dc2626'; g.fillRect(203, 11, 394 * boss[1] / 100, 20);
        g.fillStyle = '#fff'; g.font = 'bold 14px Outfit, Arial'; g.fillText(`👑 ${T.ENEMIES[boss[0]].name}`, 400, 22);
      }
      if (o.d || o.v) {
        g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, T.W, T.H);
        g.fillStyle = '#fff'; g.font = 'bold 34px Outfit, Arial'; g.fillText(o.v ? 'Beat wave 25!' : `Overrun at wave ${o.w}`, 400, 250);
      }
    }
    function draw() {
      drawBoard(ctx);
      // ranges
      const sel = selected && s.towers.find((t) => t.id === selected);
      const ring = (x, y, r, ok) => { ctx.fillStyle = ok ? 'rgba(255,255,255,.08)' : 'rgba(239,68,68,.12)'; ctx.strokeStyle = ok ? 'rgba(255,255,255,.45)' : 'rgba(239,68,68,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke(); };
      if (sel && sel.type !== 'farm') ring(sel.x, sel.y, T.statsOf(sel).range, true);
      // towers
      for (const t of s.towers) drawTower(ctx, t.type, t.lvl, t.x, t.y, t.aim, { selected: t.id === selected });
      // level-up bursts
      const nowT = performance.now();
      for (let i = levelUps.length - 1; i >= 0; i--) {
        const u = levelUps[i], k = (nowT - u.at) / 700;
        if (k >= 1) { levelUps.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(250,204,21,${1 - k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(u.x, u.y, 16 + k * 26, 0, 7); ctx.stroke();
        ctx.font = 'bold 13px Outfit, Arial'; ctx.fillStyle = `rgba(254,240,138,${1 - k})`; ctx.fillText(u.text, u.x, u.y - 24 - k * 16);
      }
      // shots
      for (const f of s.fx) {
        if (f.type === 'flame') {
          const grd = ctx.createRadialGradient(f.x, f.y, 4, f.x, f.y, f.r);
          grd.addColorStop(0, 'rgba(255,220,90,.75)'); grd.addColorStop(1, 'rgba(239,68,68,0)');
          ctx.fillStyle = grd; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.arc(f.x, f.y, f.r, f.a - 0.6, f.a + 0.6); ctx.closePath(); ctx.fill();
        } else {
          ctx.strokeStyle = f.type === 'sniper' ? `rgba(255,255,255,${Math.min(1, f.life * 8)})` : f.type === 'machinegun' ? '#fbbf24' : '#fde68a';
          ctx.lineWidth = f.type === 'sniper' ? 2.5 : 1.5;
          ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.tx, f.ty); ctx.stroke();
        }
      }
      // enemies
      let boss = null;
      for (const e of s.enemies) {
        if (e.boss) boss = e;
        drawEnemy(ctx, e.kind, e.x, e.y, e.hp / e.max, e.burnT > 0);
      }
      if (boss) {
        const d = T.ENEMIES[boss.kind];
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(200, 8, 400, 26);
        ctx.fillStyle = '#dc2626'; ctx.fillRect(203, 11, 394 * Math.max(0, boss.hp / boss.max), 20);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Outfit, Arial';
        ctx.fillText(`👑 ${d.name} · ${Math.ceil(boss.hp).toLocaleString()} HP`, 400, 22);
      }
      // placing ghost
      if (placing && hover) {
        const [x, y] = hover, d = T.TOWERS[placing], ok = !T.canPlace(s, placing, x, y);
        if (placing !== 'farm') ring(x, y, d.lv[0].range, ok);
        drawTower(ctx, placing, 0, x, y, -Math.PI / 2, { alpha: 0.75 });
        if (!ok) { ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, T.TOWER_R + 2, 0, 7); ctx.stroke(); }
      }
      // banners
      const now = performance.now();
      while (banners.length && banners[0].until < now) banners.shift();
      const b = banners[banners.length - 1];
      ctx.font = 'bold 30px Outfit, Arial';
      const big = (text, color, y) => { ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(text, 400, y); ctx.fillStyle = color; ctx.fillText(text, 400, y); };
      if (b) big(b.text, b.color, 250);
      else if (s.phase === 'build') { ctx.font = 'bold 20px Outfit, Arial'; big(`Wave ${s.wave + 1}${BOSS_NAME[s.wave + 1] ? ` · BOSS: ${BOSS_NAME[s.wave + 1]}` : ''} in ${Math.ceil(s.breakT)}s`, BOSS_NAME[s.wave + 1] ? '#fca5a5' : '#fff', 140); }
      if (flashMsg && flashMsg.until > now) { ctx.font = 'bold 16px Outfit, Arial'; big(flashMsg.text, '#fecaca', 480); }
      if (s.phase === 'dead' || s.phase === 'won') {
        ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, T.W, T.H);
        ctx.font = 'bold 34px Outfit, Arial';
        big(s.phase === 'won' ? 'You beat wave 25!' : `Overrun at wave ${s.wave}`, s.phase === 'won' ? '#86efac' : '#fca5a5', 220);
        ctx.font = '18px Outfit, Arial';
        big(s.phase === 'won' ? '' : `You survived ${s.cleared} wave${s.cleared === 1 ? '' : 's'}. ${decided ? '' : `Waiting to see how ${oppName} does…`}`, '#fff', 270);
      }
    }

    // ---------------------------------------------------------------- reports and the result
    let lastReport = '', reportAt = 0, decided = false;
    const myReport = () => ({ w: s.wave, c: s.cleared, l: s.lives, m: Math.floor(s.money), d: s.phase === 'dead' ? 1 : 0, v: s.phase === 'won' ? 1 : 0, ki: s.kills,
      tw: s.towers.map((t) => [T.ORDER.indexOf(t.type), Math.round(t.x), Math.round(t.y), t.lvl, Math.round(t.aim * 10)]), en: enemiesOf(s) });
    // up to 60 enemies, for the other player's live view: [kind, x, y, health %]
    function enemiesOf(st) { return st.enemies.slice(0, 60).map((e) => [EKINDS.indexOf(e.kind), Math.round(e.x), Math.round(e.y), Math.max(0, Math.round((e.hp / e.max) * 100))]); }
    function report(force) {
      if (api.bot) return;
      const r = myReport(), j = JSON.stringify(r), now = performance.now();
      if (!force && (j === lastReport || now - reportAt < 500)) return;
      lastReport = j; reportAt = now;
      api.send({ kind: 'msg', data: Object.assign({ k: 's', t: Date.now() }, r) });
    }
    // Both browsers reach the same verdict from the same final reports.
    function decide() {
      if (decided || !opp) return;
      const m = myReport(), o = opp;
      let winner = null, reason = '';
      const ws = (n) => `${n} wave${n === 1 ? '' : 's'}`;
      if (m.v && o.v) { winner = m.l === o.l ? -1 : m.l > o.l ? me : oppIdx; reason = 'both beat wave 25'; }
      else if (m.v) { winner = me; reason = 'beat wave 25'; }
      else if (o.v) { winner = oppIdx; reason = 'beat wave 25'; }
      else if (m.d && o.d) {
        if (m.c !== o.c) winner = m.c > o.c ? me : oppIdx;
        else winner = m.ki === o.ki ? -1 : m.ki > o.ki ? me : oppIdx;
        reason = m.c !== o.c ? `survived ${ws(Math.max(m.c, o.c))} vs ${Math.min(m.c, o.c)}` : `both survived ${ws(m.c)}; ${m.ki === o.ki ? 'same kills' : 'more kills'}`;
      } else if (m.d && o.c > m.c) { winner = oppIdx; reason = `survived ${ws(o.c)} vs ${m.c}`; }
      else if (o.d && m.c > o.c) { winner = me; reason = `survived ${ws(m.c)} vs ${o.c}`; }
      if (winner === null) return;
      decided = true;
      // the result is told from player 0's side, like every other game
      if (api.bot) api.finish({ winner, reason });
      else api.send({ kind: 'result', winner, reason });
    }

    // ---------------------------------------------------------------- loop
    let last = performance.now(), acc = 0, raf = 0, stopped = false, panelT = 0;
    const DT = 1 / 30;
    function botStep(dt) {
      T.step(bot.s, dt);
      bot.aiT -= dt;
      if (bot.aiT <= 0) { bot.aiT = 0.5; let n = 0; while (n++ < 4 && T.ai(bot.s, bot.level)); }
      bot.s.events.length = 0;
      const b = bot.s;
      opp = { w: b.wave, c: b.cleared, l: b.lives, m: Math.floor(b.money), d: b.phase === 'dead' ? 1 : 0, v: b.phase === 'won' ? 1 : 0, ki: b.kills,
        tw: b.towers.map((t) => [T.ORDER.indexOf(t.type), t.x, t.y, t.lvl, Math.round(t.aim * 10)]), en: enemiesOf(b) };
    }
    function frame(now) {
      if (stopped) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += dt * speed;
      let steps = 0;
      while (acc >= DT && steps < 12) {
        acc -= DT; steps++;
        T.step(s, DT);
        if (bot) botStep(DT);
      }
      // once you're out, the bot plays on quickly so you see how it ends
      if (bot && (s.phase === 'dead' || s.phase === 'won') && !decided) for (let i = 0; i < 20; i++) botStep(DT);
      for (const e of s.events.splice(0)) {
        if (e.type === 'wave') banners.push({ text: e.boss ? `BOSS WAVE ${e.wave}: ${BOSS_NAME[e.wave]}!` : `Wave ${e.wave}`, color: e.boss ? '#fca5a5' : '#fff', until: performance.now() + 1800 });
        else if (e.type === 'cleared') banners.push({ text: `Wave ${e.wave} cleared  +${money(e.bonus + e.farms)}`, color: '#86efac', until: performance.now() + 1800 });
        else if (e.type === 'dead' || e.type === 'won') report(true);
      }
      draw();
      if (now - panelT > 250) { panelT = now; render(); renderOpp(); api.status(statusLine()); }
      else if (peekOpen && bot) drawPeek(); // the bot's map is right here: keep the view smooth
      report(false);
      decide();
      raf = requestAnimationFrame(frame);
    }
    function statusLine() {
      return [h('b', {}, `You: wave ${s.wave} · ❤ ${s.lives}`), h('span', {}, 'vs'),
        h('b', {}, `${oppName}: ${opp ? `wave ${opp.w} · ❤ ${opp.l}` : '…'}`), h('small', { class: 'muted' }, 'Survive the most waves, or beat wave 25')];
    }
    cv.tdDebug = { s, get opp() { return opp; }, get bot() { return bot; }, setSpeed }; // for tests
    render(); renderOpp();
    raf = requestAnimationFrame((t) => { last = t; frame(t); });

    return {
      update() {},
      event(ev) {
        const m = ev && ev.msg;
        if (!m || m.k !== 's' || !Array.isArray(m.tw)) return;
        opp = { w: +m.w || 0, c: +m.c || 0, l: +m.l || 0, m: +m.m || 0, d: m.d ? 1 : 0, v: m.v ? 1 : 0, ki: +m.ki || 0, tw: m.tw.slice(0, 20), en: Array.isArray(m.en) ? m.en.slice(0, 60) : [] };
        renderOpp();
      },
      stop() { stopped = true; cancelAnimationFrame(raf); },
      destroy() { stopped = true; cancelAnimationFrame(raf); removeEventListener('keydown', onKey); },
    };
  };
})();
