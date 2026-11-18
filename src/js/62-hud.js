/* ========================================================================
   HUD: DOM read-outs, speedometer and minimap canvases
   ======================================================================== */
const HUD = {
  init() {
    this.speedo = $('#speedo');
    this.sctx = this.speedo.getContext('2d');
    this.mini = $('#minimap');
    this.mctx = this.mini.getContext('2d');
    this.msgT = 0;
    this.toastT = 0;
    this.lastStand = '';
    this.lastPos = null;
    this.bankT = 0;
    this.tagKey = '';
  },
  show(on) {
    $('#hud').hidden = !on;
  },
  message(text, cls = '', hold = 0.9) {
    const m = $('#msg');
    m.textContent = text;
    m.className = 'show ' + cls;
    this.msgT = hold;
  },
  toast(text, hold = 2, cls = '') {
    const m = $('#toast');
    m.textContent = text;
    m.className = 'show ' + cls;
    this.toastT = hold;
  },
  /* a style move pops up on the right and drifts away */
  style(label, pts, mult, cls = '') {
    const feed = $('#style-feed');
    while (feed.children.length > 3) feed.firstElementChild.remove();
    const line = el('div', { class: 'style-line ' + cls }, [
      el('span', { text: label }),
      pts ? el('b', { text: '+' + fmtInt(pts) }) : null,
      mult > 1 ? el('i', { text: '×' + mult.toFixed(1) }) : null,
    ]);
    feed.append(line);
    setTimeout(() => line.classList.add('out'), 1600);
    setTimeout(() => line.remove(), 2000);
  },
  banked(pts, tier) {
    const b = $('#d-bank');
    b.textContent = '+' + fmtInt(pts);
    b.style.color = hexCss(TIER_HEX[tier] || 0x4ade80);
    this.bankT = 1.5;
  },
  update(game, dt) {
    if (this.msgT > 0) {
      this.msgT -= dt;
      if (this.msgT <= 0) $('#msg').classList.remove('show');
    }
    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT <= 0) $('#toast').classList.remove('show');
    }
    const p = game.player;
    if (!p) return;
    const pos = game.playerPos;
    if (this.lastPos != null && pos !== this.lastPos && game.state === 'racing') {
      const pill = $('#h-pos').closest('.pill');
      pill.classList.remove('bump', 'up', 'down');
      void pill.offsetWidth;
      pill.classList.add('bump', pos < this.lastPos ? 'up' : 'down');
    }
    this.lastPos = pos;
    $('#h-pos').textContent = pos;
    $('#h-pos-sup').textContent = ordinal(pos);
    $('#h-total').textContent = game.cars.filter((c) => !c.ghost).length;
    $('#h-lap').textContent = Math.min(p.lap + 1, game.laps);
    $('#h-laps').textContent = game.ko ? '∞' : game.laps;
    /* knockout clock: who goes next, and whether it is us */
    const kp = $('#h-ko');
    kp.hidden = !game.ko || p.finished;
    if (game.ko) {
      const s = Math.max(0, Math.ceil(game.ko.next));
      $('#h-ko-t').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
      kp.classList.toggle('danger', !!game.ko.danger);
      kp.firstChild.textContent = game.ko.danger ? 'YOU ARE LAST ' : 'NEXT OUT ';
    }
    /* style score, coins and the combo that is running */
    const sp = $('#h-style'),
      on = !!game.styleOn && (Style.score > 0 || Style.stats.coins > 0);
    sp.hidden = !on;
    if (on) {
      $('#h-style-v').textContent = fmtInt(Style.score);
      $('#h-coins').hidden = Style.stats.coins === 0;
      $('#h-coins-v').textContent = Style.stats.coins;
    }
    const cb = $('#style-combo'),
      live = !!game.styleOn && Style.combo > 0 && Style.comboT > 0 && game.state === 'racing';
    cb.hidden = !live;
    if (live) {
      $('#style-mult').textContent = '×' + Style.mult().toFixed(1);
      $('#style-fill').style.transform = `scaleX(${clamp(Style.comboT / COMBO_WINDOW, 0, 1)})`;
    }
    const lapT = p.finished ? p.lapTimes[p.lapTimes.length - 1] || 0 : (game.raceTime - p.lapStart) * 1000;
    $('#h-time').textContent = fmtTime(game.state === 'racing' || p.finished ? lapT : 0, '0:00.000');
    $('#h-best').textContent = fmtTime(p.bestLap);
    const nb = $('#nitrobar');
    nb.firstElementChild.style.transform = `scaleX(${clamp(p.nitro / p.stats.nitroCap, 0, 1)})`;
    nb.classList.toggle('boost', p.boosting);
    $('#wrongway').classList.toggle('show', p.wrongWay > 0.8 && game.state === 'racing');
    const hot = p.boosting || p.turboT > 0 || p.padT > 0;
    $('#speedfx').style.opacity = hot ? 0.8 : clamp((Math.abs(p.speed) - 50) / 40, 0, 0.5);
    /* drift meter */
    const showDrift = p.drifting && Math.abs(p.driftAngle) > 0.12;
    if (this.bankT > 0) this.bankT -= dt;
    const dp = $('#drift');
    dp.classList.toggle('show', showDrift || this.bankT > 0);
    dp.classList.toggle('banked', !showDrift && this.bankT > 0);
    if (showDrift) {
      $('#d-pts').textContent = fmtInt(p.driftPts);
      $('#d-mult').textContent = p.driftChain > 0 ? '×' + (1 + 0.5 * p.driftChain).toFixed(1) : '';
      const f = $('#d-fill');
      f.style.transform = `scaleX(${clamp(p.driftCharge / DRIFT_TIERS[2], 0, 1)})`;
      f.style.background = hexCss(TIER_HEX[p.driftTier] || 0xffffff);
      dp.dataset.tier = p.driftTier;
    }
    const ds = $('#h-drift');
    const showScore = game.mode === 'drift' || p.driftScore > 0;
    ds.hidden = !showScore;
    if (showScore) $('#h-drift-v').textContent = fmtInt(p.driftScore);
    /* state chips */
    const tags = [];
    if (p.turboT > 0) tags.push(['turbo', ['', 'TURBO', 'SUPER TURBO', 'ULTRA TURBO'][p.turboTier] || 'TURBO']);
    if (p.padT > 0) tags.push(['pad', 'BOOST PAD']);
    if (p.draft > 0.5) tags.push(['draft', 'SLIPSTREAM']);
    if (game.state === 'racing' && !p.finished && (p.stuck > 1.2 || p.wrongWay > 2 || p.offT > 3))
      tags.push(['hint', Input.isTouch ? 'HOLD BRAKE + DRIFT TO RESET' : 'PRESS R TO RESET']);
    const tk = tags.map((t) => t[1]).join('|');
    if (tk !== this.tagKey) {
      this.tagKey = tk;
      const box = $('#tags');
      box.innerHTML = '';
      for (const [c, t] of tags) box.append(el('span', { class: 'tag-chip ' + c, text: t }));
    }
    this.drawSpeedo(p);
    this.drawMinimap(game);
    /* standings: cheap string diff to avoid DOM churn */
    const st = game.standings.slice(0, 8);
    const key = st.map((c) => c.id + ':' + (c.finished ? 'F' : Math.floor(c.totalProgress * 50))).join('|');
    if (key !== this.lastStand) {
      this.lastStand = key;
      const box = $('#h-standings');
      box.innerHTML = '';
      box.hidden = st.length < 2;
      st.forEach((c, i) => {
        const d = el('div', { class: c.isPlayer ? 'me' : '' }, [
          el('span', { class: 'n', text: i + 1 }),
          el('span', { class: 'c', style: `background:${hexCss(c.hex)}` }),
          el('span', { text: c.name }),
          el('span', { class: 'gap', text: c.finished ? fmtTime(c.finishTime) : i === 0 ? '' : gapText(st[0], c, game) }),
        ]);
        box.append(d);
      });
    }
  },
  drawSpeedo(p) {
    const x = this.sctx,
      W = this.speedo.width,
      H = this.speedo.height;
    x.clearRect(0, 0, W, H);
    const cx = W / 2,
      cy = H * 0.8,
      r = W * 0.42,
      kmh = Math.max(p.spd, Math.abs(p.speed)) * 3.6,
      max = Math.max(280, Math.ceil((p.stats.topSpeed * p.stats.nitroTop * 3.6) / 20) * 20);
    const a0 = Math.PI * 0.85,
      a1 = Math.PI * 2.15,
      f = clamp(kmh / max, 0, 1),
      hot = p.boosting || p.turboT > 0 || p.padT > 0;
    x.fillStyle = 'rgba(12,16,28,.62)';
    x.beginPath();
    x.arc(cx, cy, r + 26, 0, TAU);
    x.fill();
    x.lineWidth = 1.5;
    x.strokeStyle = 'rgba(160,190,255,.16)';
    x.stroke();
    x.lineWidth = 14;
    x.lineCap = 'round';
    x.strokeStyle = 'rgba(255,255,255,.08)';
    x.beginPath();
    x.arc(cx, cy, r, a0, a1);
    x.stroke();
    const grad = x.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#39d2ff');
    grad.addColorStop(0.7, '#ff7a1a');
    grad.addColorStop(1, '#ff3030');
    x.strokeStyle = hot ? '#ffd166' : grad;
    x.beginPath();
    x.arc(cx, cy, r, a0, a0 + (a1 - a0) * f);
    x.stroke();
    x.lineWidth = 3;
    x.strokeStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i <= 10; i++) {
      const a = a0 + ((a1 - a0) * i) / 10;
      x.beginPath();
      x.moveTo(cx + Math.cos(a) * (r - 18), cy + Math.sin(a) * (r - 18));
      x.lineTo(cx + Math.cos(a) * (r - 28), cy + Math.sin(a) * (r - 28));
      x.stroke();
    }
    const na = a0 + (a1 - a0) * f;
    x.lineWidth = 5;
    x.strokeStyle = '#eef3ff';
    x.beginPath();
    x.moveTo(cx, cy);
    x.lineTo(cx + Math.cos(na) * (r - 34), cy + Math.sin(na) * (r - 34));
    x.stroke();
    x.fillStyle = '#ff7a1a';
    x.beginPath();
    x.arc(cx, cy, 9, 0, TAU);
    x.fill();
    x.fillStyle = '#eef3ff';
    x.font = `900 ${W * 0.17}px Orbitron, sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'alphabetic';
    x.fillText(Math.round(kmh), cx, cy - 26);
    x.fillStyle = 'rgba(140,152,184,1)';
    x.font = `600 ${W * 0.055}px Orbitron, sans-serif`;
    x.fillText('KM/H', cx, cy - 4);
    const gear = p.speed < -0.5 ? 'R' : kmh < 2 ? 'N' : Math.min(6, 1 + Math.floor(kmh / 45));
    x.fillStyle = hot ? '#ffd166' : '#39d2ff';
    x.font = `700 ${W * 0.08}px Orbitron, sans-serif`;
    x.fillText(gear, cx, cy + 36);
  },
  drawMinimap(game) {
    const x = this.mctx,
      W = this.mini.width,
      t = game.track;
    if (!t) return;
    x.clearRect(0, 0, W, W);
    if (!this.miniPath || this.miniPath.track !== t) {
      const p = new Path2D();
      t.center.forEach((c, i) => {
        const [u, v] = t.map.toUV(c.x, c.z);
        i ? p.lineTo(u * W, v * W) : p.moveTo(u * W, v * W);
      });
      p.closePath();
      this.miniPath = { track: t, path: p };
    }
    x.lineWidth = 11;
    x.strokeStyle = 'rgba(255,255,255,.12)';
    x.lineJoin = 'round';
    x.stroke(this.miniPath.path);
    x.lineWidth = 6;
    x.strokeStyle = 'rgba(238,243,255,.55)';
    x.stroke(this.miniPath.path);
    const [su, sv] = t.map.toUV(t.center[0].x, t.center[0].z);
    x.fillStyle = '#fff';
    x.fillRect(su * W - 4, sv * W - 4, 8, 8);
    x.fillStyle = '#39d2ff';
    for (const pad of t.pads) {
      const c = t.center[pad.idx],
        [u, v] = t.map.toUV(c.x, c.z);
      x.beginPath();
      x.arc(u * W, v * W, 4, 0, TAU);
      x.fill();
    }
    for (const c of game.cars) {
      if (c.ghost) continue;
      const [u, v] = t.map.toUV(c.pos.x, c.pos.z);
      x.beginPath();
      x.arc(u * W, v * W, c.isPlayer ? 8 : 6, 0, TAU);
      x.fillStyle = hexCss(c.hex);
      x.fill();
      if (c.isPlayer) {
        x.lineWidth = 3;
        x.strokeStyle = '#fff';
        x.stroke();
      }
    }
  },
};
function gapText(leader, c, game) {
  const dp = leader.totalProgress - c.totalProgress;
  if (dp <= 0) return '';
  const metres = dp * game.track.length;
  const v = Math.max(Math.abs(leader.speed), 20);
  const s = metres / v;
  return s >= 1 ? '+' + s.toFixed(1) + 's' : '+' + metres.toFixed(0) + 'm';
}
