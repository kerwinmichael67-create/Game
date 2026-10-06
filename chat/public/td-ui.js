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
        h('span', { class: 'td-buy-icon', style: `background:${d.color}` }, d.icon),
        h('span', { class: 'td-buy-name' }, d.name), h('span', { class: 'td-buy-cost' }, money(d.cost)), h('small', {}, ''));
      shop.append(shopBtns[type]);
    }
    const info = h('div', { class: 'td-info' });
    const oppMap = h('canvas', { width: 200, height: 125, class: 'td-mini' });
    const oppBox = h('div', { class: 'td-opp' });
    stage.append(h('div', { class: 'td-wrap' },
      h('div', { class: 'td-board' }, cv),
      h('div', { class: 'td-side' }, stats, h('div', { class: 'row td-wave-row' }, waveBtn, h('span', { class: 'td-speeds' }, speedBtns)),
        h('b', { class: 'td-h' }, 'Towers'), shop, info, h('b', { class: 'td-h' }, api.bot ? oppName : `${oppName}’s map`), oppBox, oppMap)));

    // ---------------------------------------------------------------- input
    let placing = null, selected = null, hover = null, speed = 1;
    const banners = [];
    function setSpeed(n) { speed = n; speedBtns.forEach((b, i) => b.classList.toggle('sel', i + 1 === n)); }
    function choose(type) { placing = placing === type ? null : type; selected = null; render(); }
    const toMap = (e) => { const r = cv.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * T.W, ((e.clientY - r.top) / r.height) * T.H]; };
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
      if (e.key === 'Escape') { placing = null; selected = null; render(); }
      else if (e.key === ' ' && s.phase === 'build') { T.startWave(s); e.preventDefault(); render(); }
      else if ((e.key === 'u' || e.key === 'U') && selected) { const err = T.upgrade(s, selected); if (err) flash(err); render(); }
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
        h('div', { class: 'td-sel-head' }, h('span', { class: 'td-buy-icon', style: `background:${d.color}` }, d.icon), h('b', {}, d.name),
          h('span', { class: 'td-pips' }, [0, 1, 2, 3, 4].map((i) => h('i', { class: i < t.lvl ? 'on' : '' })))),
        t.type === 'farm'
          ? row('Pays per wave', money(st.income), nx ? money(nx.income) : undefined)
          : [row('Damage', fmt(st.dmg), nx ? fmt(nx.dmg) : undefined), row('Shots / sec', fmt(st.rate), nx ? fmt(nx.rate) : undefined),
            row('Range', String(st.range), nx ? String(nx.range) : undefined), st.burn ? row('Burn / sec', String(st.burn), nx ? String(nx.burn) : undefined) : null,
            h('div', { class: 'td-row muted' }, h('span', {}, 'Damage dealt'), h('b', {}, Math.round(t.dmg).toLocaleString()))],
        h('div', { class: 'td-actions' },
          h('button', { class: 'btn primary small', disabled: cost === null || s.money < cost, onclick: () => { const err = T.upgrade(s, t.id); if (err) flash(err); render(); } },
            cost === null ? 'Max level' : `Upgrade ${money(cost)} (U)`),
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
      }
      if (out || won) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, 200, 125); g.fillStyle = '#fff'; g.font = 'bold 15px Outfit, Arial'; g.textAlign = 'center'; g.fillText(won ? 'WON' : 'OVERRUN', 100, 68); }
    }

    // ---------------------------------------------------------------- drawing
    function draw() {
      ctx.fillStyle = '#21452f'; ctx.fillRect(0, 0, T.W, T.H);
      ctx.fillStyle = 'rgba(255,255,255,.025)';
      for (let x = 0; x < T.W; x += 40) for (let y = (x / 40) % 2 ? 0 : 20; y < T.H; y += 40) ctx.fillRect(x, y, 20, 20);
      // road
      ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
      const road = (w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); T.PATH.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); };
      road(T.ROAD * 2 + 6, '#5d4b36'); road(T.ROAD * 2, '#9a8462');
      ctx.setLineDash([10, 12]); road(2, 'rgba(255,255,255,.18)'); ctx.setLineDash([]);
      ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🚩', 18, 44); ctx.fillText('🏰', 780, 470);
      // ranges
      const sel = selected && s.towers.find((t) => t.id === selected);
      const ring = (x, y, r, ok) => { ctx.fillStyle = ok ? 'rgba(255,255,255,.08)' : 'rgba(239,68,68,.12)'; ctx.strokeStyle = ok ? 'rgba(255,255,255,.45)' : 'rgba(239,68,68,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke(); };
      if (sel && sel.type !== 'farm') ring(sel.x, sel.y, T.statsOf(sel).range, true);
      // towers
      for (const t of s.towers) {
        const d = T.TOWERS[t.type];
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(t.x + 2, t.y + 3, T.TOWER_R + 1, 0, 7); ctx.fill();
        ctx.fillStyle = d.color; ctx.beginPath(); ctx.arc(t.x, t.y, T.TOWER_R, 0, 7); ctx.fill();
        ctx.strokeStyle = t.id === selected ? '#fff' : 'rgba(0,0,0,.45)'; ctx.lineWidth = t.id === selected ? 3 : 2; ctx.stroke();
        if (t.type !== 'farm') {
          ctx.strokeStyle = '#1f2937'; ctx.lineWidth = t.type === 'sniper' ? 3 : t.type === 'machinegun' ? 5 : 4; ctx.lineCap = 'round';
          const len = t.type === 'sniper' ? 20 : 15;
          ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.x + Math.cos(t.aim) * len, t.y + Math.sin(t.aim) * len); ctx.stroke();
        }
        ctx.font = '13px serif'; ctx.fillText(d.icon, t.x, t.y + 1);
        for (let i = 0; i < t.lvl; i++) { ctx.fillStyle = '#facc15'; ctx.fillRect(t.x - 11 + i * 5, t.y + T.TOWER_R + 3, 4, 4); }
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
        const d = T.ENEMIES[e.kind];
        if (e.boss) boss = e;
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(e.x + 2, e.y + d.r * 0.8, d.r, d.r * 0.45, 0, 0, 7); ctx.fill();
        ctx.fillStyle = d.color; ctx.beginPath(); ctx.arc(e.x, e.y, d.r, 0, 7); ctx.fill();
        if (e.armor) { ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3; ctx.stroke(); }
        if (e.burnT > 0) { ctx.strokeStyle = 'rgba(251,146,60,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, d.r + 3, 0, 7); ctx.stroke(); }
        if (e.boss) { ctx.font = `${d.r}px serif`; ctx.fillText('👑', e.x, e.y - d.r - 8); }
        if (e.hp < e.max && !e.boss) {
          ctx.fillStyle = '#111'; ctx.fillRect(e.x - 11, e.y - d.r - 7, 22, 4);
          ctx.fillStyle = '#4ade80'; ctx.fillRect(e.x - 11, e.y - d.r - 7, 22 * Math.max(0, e.hp / e.max), 4);
        }
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
        ctx.globalAlpha = 0.75; ctx.fillStyle = ok ? d.color : '#ef4444'; ctx.beginPath(); ctx.arc(x, y, T.TOWER_R, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        ctx.font = '13px serif'; ctx.fillText(d.icon, x, y + 1);
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
      tw: s.towers.map((t) => [T.ORDER.indexOf(t.type), Math.round(t.x), Math.round(t.y), t.lvl]) });
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
        tw: b.towers.map((t) => [T.ORDER.indexOf(t.type), t.x, t.y, t.lvl]) };
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
        opp = { w: +m.w || 0, c: +m.c || 0, l: +m.l || 0, m: +m.m || 0, d: m.d ? 1 : 0, v: m.v ? 1 : 0, ki: +m.ki || 0, tw: m.tw.slice(0, 20) };
        renderOpp();
      },
      stop() { stopped = true; cancelAnimationFrame(raf); },
      destroy() { stopped = true; cancelAnimationFrame(raf); removeEventListener('keydown', onKey); },
    };
  };
})();
