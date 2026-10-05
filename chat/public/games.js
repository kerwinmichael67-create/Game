// Game dock: renders whichever multiplayer game you're in next to the chat.
(() => {
  const META = {
    snake: { color: 'linear-gradient(135deg,#22c55e,#15803d)', emoji: '🐍', name: 'Snake PvP', desc: 'Eat & grow. Longest snake after 90s wins.', help: 'Arrow keys / WASD (or swipe)' },
    chess: { color: 'linear-gradient(135deg,#a3a38a,#4d6b35)', emoji: '♟️', name: 'Chess', desc: 'Classic chess with full rules.', help: 'Click a piece, then click where to move it' },
    checkers: { color: 'linear-gradient(135deg,#f97316,#b91c1c)', emoji: '⛀', name: 'Checkers', desc: 'Jumps are mandatory. Reach the end to king.', help: 'Click a piece, then click where to move it' },
    tetris: { color: 'linear-gradient(135deg,#22d3ee,#6366f1)', emoji: '🧱', name: 'Tetris Battle', desc: 'Clear lines to send junk. Last one standing wins.', help: '←→ move · ↑/X rotate · Z rotate back · ↓ soft drop · Space hard drop · C hold' },
    fighter: { color: 'linear-gradient(135deg,#f59e0b,#dc2626)', emoji: '🥊', name: 'Street Fighter', desc: 'Best of 3 rounds. Punch, kick, block, fireball.', help: 'A/D or ←→ move · W/↑ jump · S/↓ block · J punch · K kick · L fireball (needs 50 energy)' },
    pong: { color: 'linear-gradient(135deg,#64748b,#0f172a)', emoji: '🏓', name: 'Pong', desc: 'First to 7 points wins.', help: 'W/S or ↑/↓ to move your paddle' },
    connect4: { color: 'linear-gradient(135deg,#3b82f6,#1e3a8a)', emoji: '🔴', name: 'Connect Four', desc: 'Get four in a row.', help: 'Click a column to drop a disc' },
    tictactoe: { color: 'linear-gradient(135deg,#ec4899,#8b5cf6)', emoji: '❌', name: 'Tic-Tac-Toe', desc: 'Three in a row. Quick game!', help: 'Click a square' },
    reversi: { color: 'linear-gradient(135deg,#16a34a,#14532d)', emoji: '⚫', name: 'Reversi', desc: 'Trap discs to flip them. Most discs wins.', help: 'Click a dotted square to place a disc' },
    dots: { color: 'linear-gradient(135deg,#f59e0b,#ea580c)', emoji: '🔲', name: 'Dots & Boxes', desc: 'Close a box to score and go again.', help: 'Click between two dots to draw a line' },
    mancala: { color: 'linear-gradient(135deg,#a16207,#713f12)', emoji: '🫘', name: 'Mancala', desc: 'Sow seeds, capture, fill your store.', help: 'Click one of your pits (bottom row) to sow its seeds' },
    gomoku: { color: 'linear-gradient(135deg,#d6a35c,#8a5a24)', emoji: '⭕', name: 'Five in a Row', desc: 'Get five stones in a line on a big board.', help: 'Click a spot to place a stone' },
    tron: { color: 'linear-gradient(135deg,#06b6d4,#7c3aed)', emoji: '🏍️', name: 'Light Cycles', desc: 'Don’t hit a wall. Best of 5 rounds.', help: 'Arrow keys / WASD (or swipe) to turn' },
    hockey: { color: 'linear-gradient(135deg,#38bdf8,#1d4ed8)', emoji: '🏒', name: 'Air Hockey', desc: 'Smash the puck into their goal. First to 7.', help: 'Move the mouse or your finger over your half (or WASD / arrows)' },
    apex: { color: 'linear-gradient(135deg,#ffd400,#ff3b4e)', emoji: '🏎️', name: 'Apex Rush 3D', desc: '3D racing on nine circuits. First over the line wins.', help: 'W A S D or arrows · Shift nitro · Space pickup · C camera (keyboard only)' },
  };

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
  const isTyping = () => {
    const a = document.activeElement;
    return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable);
  };
  function canvas(w, hgt) {
    const c = h('canvas', { width: w, height: hgt });
    return [c, c.getContext('2d')];
  }
  // Two distinct colors for the two players (their profile colors when those differ enough).
  function playerColors(players) {
    const fix = (c) => (c.toLowerCase() === '#111111' || c.toLowerCase() === '#000000' ? '#9ca3af' : c);
    const a = fix(players[0].avatar), b = fix(players[1].avatar);
    const hex = (c) => /^#[0-9a-f]{6}$/i.test(c);
    const rgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const close = (x, y) => !hex(x) || !hex(y) || Math.hypot(...rgb(x).map((v, i) => v - rgb(y)[i])) < 110;
    if (!close(a, b)) return [a, b];
    return [a, ['#3b82f6', '#f97316', '#ec4899', '#22c55e'].find((c) => !close(a, c)) || '#f97316'];
  }


  // Tracks held keys (ignoring keys while typing in chat) and on-screen touch buttons.
  function heldKeys(map, onChange) {
    const held = {};
    const setA = (a, v) => { if (!!held[a] === v) return; held[a] = v; onChange(held, a, v); };
    const down = (e) => {
      const a = map[e.code];
      if (!a || isTyping()) return;
      e.preventDefault();
      setA(a, true);
    };
    const up = (e) => { const a = map[e.code]; if (a) setA(a, false); };
    const blur = () => Object.keys(held).forEach((a) => setA(a, false));
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    addEventListener('blur', blur);
    return { press: setA, destroy() { removeEventListener('keydown', down); removeEventListener('keyup', up); removeEventListener('blur', blur); } };
  }
  function touchPad(buttons, press) {
    return h('div', { class: 'touchpad' }, buttons.map(([label, action]) => {
      const b = h('button', { type: 'button' }, label);
      const set = (v) => (e) => { e.preventDefault(); b.classList.toggle('on', v); press(action, v); };
      b.addEventListener('pointerdown', set(true));
      b.addEventListener('pointerup', set(false));
      b.addEventListener('pointerleave', set(false));
      b.addEventListener('pointercancel', set(false));
      return b;
    }));
  }

  // ---------------------------------------------------------------- SNAKE
  function snakeGame(stage, api) {
    const CELL = 16;
    const [cv, ctx] = canvas(40 * CELL, 28 * CELL);
    const colors = playerColors(api.players);
    stage.append(cv, touchPad([['◀', 'L'], ['▲', 'U'], ['▼', 'D'], ['▶', 'R']], (a, v) => v && api.send({ dir: a })),
      h('div', { class: 'controls-help' }, META.snake.help));
    const keys = heldKeys({ ArrowUp: 'U', KeyW: 'U', ArrowDown: 'D', KeyS: 'D', ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R' },
      (held, a, v) => v && api.send({ dir: a }));
    let sx = 0, sy = 0;
    cv.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
    cv.addEventListener('pointerup', (e) => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
      api.send({ dir: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : dy > 0 ? 'D' : 'U' });
    });
    return {
      update(s) {
        ctx.fillStyle = '#0d0d12';
        ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.fillStyle = '#16161e';
        for (let x = 0; x < s.W; x++) for (let y = 0; y < s.H; y++) if ((x + y) % 2) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        for (const [x, y, g] of s.food) {
          ctx.fillStyle = g ? '#fbbf24' : '#ef4444';
          ctx.beginPath();
          ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, g ? 7 : 5, 0, 7);
          ctx.fill();
        }
        s.snakes.forEach((sn, i) => {
          sn.body.forEach(([x, y], k) => {
            ctx.fillStyle = colors[i];
            ctx.globalAlpha = k === 0 ? 1 : 0.85 - Math.min(0.4, k / 80);
            ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
          });
          ctx.globalAlpha = 1;
          if (sn.body.length) {
            const [x, y] = sn.body[0];
            ctx.fillStyle = '#fff';
            ctx.fillRect(x * CELL + 4, y * CELL + 4, 3, 3);
            ctx.fillRect(x * CELL + 9, y * CELL + 4, 3, 3);
            if (i === api.you) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x * CELL, y * CELL, CELL, CELL); }
          }
        });
        const me = s.snakes[api.you], them = s.snakes[1 - api.you];
        api.status(h('span', {}, `⏱ ${Math.ceil(s.ticks / 10)}s`),
          h('span', { style: `color:${colors[api.you]};font-weight:bold` }, `You: ${me.body.length}`), me.alive ? '' : ' (respawning…)',
          h('span', { style: `color:${colors[1 - api.you]};font-weight:bold` }, `${api.players[1 - api.you].name}: ${them.body.length}`),
          h('small', { class: 'muted' }, `best ${me.best} vs ${them.best}`));
      },
      destroy() { keys.destroy(); },
    };
  }

  // ---------------------------------------------------------------- PONG
  function pongGame(stage, api) {
    const [cv, ctx] = canvas(800, 500);
    const colors = playerColors(api.players);
    const held = { up: false, down: false };
    // When the game runs in the other player's browser, move our own paddle right away and send
    // where it is, instead of waiting a round trip to see it move.
    const local = api.predict ? { y: null, sentY: null, sentAt: 0 } : null;
    const sendKeys = (k) => (local ? (local.sentAt = 0) : api.send({ up: !!k.up, down: !!k.down }));
    const keys = heldKeys({ ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' }, (k) => { held.up = !!k.up; held.down = !!k.down; sendKeys(held); });
    const step = local && setInterval(() => {
      if (local.y === null) return;
      local.y = Math.max(0, Math.min(500 - 90, local.y + (held.down ? 9 : 0) - (held.up ? 9 : 0)));
      const now = performance.now();
      if (local.y !== local.sentY && now - local.sentAt > 30) { local.sentY = local.y; local.sentAt = now; api.send({ up: held.up, down: held.down, y: local.y }); }
    }, 20);
    stage.append(cv, touchPad([['▲', 'up'], ['▼', 'down']], (a, v) => { held[a] = v; sendKeys(held); }),
      h('div', { class: 'controls-help' }, `You are the ${api.you === 0 ? 'LEFT' : 'RIGHT'} paddle · ${META.pong.help}`));
    return {
      update(s) {
        ctx.fillStyle = '#0d0d12';
        ctx.fillRect(0, 0, 800, 500);
        ctx.fillStyle = '#333';
        for (let y = 0; y < 500; y += 30) ctx.fillRect(398, y, 4, 18);
        ctx.font = 'bold 56px Outfit, Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = colors[0]; ctx.fillText(s.score[0], 320, 70);
        ctx.fillStyle = colors[1]; ctx.fillText(s.score[1], 480, 70);
        if (local && (local.y === null || Math.abs(local.y - s.p[api.you].y) > 250)) local.y = s.p[api.you].y; // start, or way off: take the game's
        const py = (i) => (local && i === api.you ? local.y : s.p[i].y);
        ctx.fillStyle = colors[0]; ctx.fillRect(30, py(0), 12, s.ph);
        ctx.fillStyle = colors[1]; ctx.fillRect(758, py(1), 12, s.ph);
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, 8, 0, 7); ctx.fill();
        if (s.serve > 0) { ctx.font = '20px Outfit, Arial'; ctx.fillText('Get ready…', 400, 300); }
        api.status(`First to ${s.to}`, h('b', {}, `${s.score[api.you]} – ${s.score[1 - api.you]}`));
      },
      destroy() { keys.destroy(); clearInterval(step); },
    };
  }

  // ---------------------------------------------------------------- STREET FIGHTER
  function fighterGame(stage, api) {
    const [cv, ctx] = canvas(900, 480);
    const colors = playerColors(api.players);
    const held = {};
    const map = { KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyJ: 'p', KeyK: 'k', KeyL: 's', KeyZ: 'p', KeyX: 'k', KeyC: 's' };
    const keys = heldKeys(map, (k) => api.send(k));
    stage.append(cv, touchPad([['◀', 'l'], ['▲', 'u'], ['▼', 'd'], ['▶', 'r'], ['👊', 'p'], ['🦵', 'k'], ['🔥', 's']], (a, v) => { held[a] = v; api.send(held); }),
      h('div', { class: 'controls-help' }, META.fighter.help));
    const line = (pts) => { ctx.beginPath(); ctx.moveTo(...pts[0]); pts.slice(1).forEach((p) => ctx.lineTo(...p)); ctx.stroke(); };
    function drawFighter(f, color) {
      const { x, y } = f, d = f.face;
      ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = f.flash % 2 ? '#fff' : color;
      ctx.fillStyle = ctx.strokeStyle;
      if (f.act === 'ko') {
        line([[x - 60, y - 6], [x + 30, y - 6]]);
        ctx.beginPath(); ctx.arc(x + 48, y - 10, 14, 0, 7); ctx.fill();
        line([[x - 60, y - 6], [x - 85, y - 2]]); line([[x - 60, y - 6], [x - 82, y - 14]]);
        return;
      }
      const low = f.act === 'block' ? 12 : 0;
      const hip = [x, y - 52 + low], neck = [x, y - 100 + low], sh = [x, y - 92 + low];
      ctx.beginPath(); ctx.arc(x, y - 117 + low, 15, 0, 7); ctx.fill();
      line([neck, hip]);
      // legs
      const sw = f.act === 'walk' ? Math.sin(x / 9) * 16 : 0;
      if (f.act === 'kick' && f.t > 4 && f.t < 18) {
        line([hip, [x + d * 45, y - 60], [x + d * 92, y - 70]]);
        line([hip, [x - d * 10, y - 26], [x - d * 18, y]]);
      } else if (f.act === 'jump' || y < 400) {
        line([hip, [x - 16, y - 30], [x - 8, y - 6]]);
        line([hip, [x + 18, y - 30], [x + 12, y - 4]]);
      } else {
        line([hip, [x - 8 + sw / 2, y - 26], [x - 16 + sw, y]]);
        line([hip, [x + 8 - sw / 2, y - 26], [x + 16 - sw, y]]);
      }
      // arms
      if (f.act === 'punch' && f.t > 2 && f.t < 11) {
        line([sh, [x + d * 40, sh[1] - 2], [x + d * 76, sh[1] - 4]]);
        line([sh, [x + d * 8, sh[1] + 22], [x + d * 22, sh[1] + 6]]);
      } else if (f.act === 'block') {
        line([sh, [x + d * 20, sh[1] + 12], [x + d * 26, sh[1] - 22]]);
        line([sh, [x + d * 14, sh[1] + 16], [x + d * 20, sh[1] - 16]]);
      } else if (f.act === 'special') {
        line([sh, [x + d * 30, sh[1] + 8], [x + d * 58, sh[1] + 10]]);
        line([sh, [x + d * 28, sh[1] + 14], [x + d * 56, sh[1] + 18]]);
      } else if (f.act === 'hurt') {
        line([sh, [x - d * 20, sh[1] - 10], [x - d * 34, sh[1] - 26]]);
        line([sh, [x - d * 14, sh[1] + 12], [x - d * 30, sh[1] + 4]]);
      } else {
        line([sh, [x + d * 16, sh[1] + 18], [x + d * 30, sh[1] - 2]]);
        line([sh, [x + d * 6, sh[1] + 22], [x + d * 20, sh[1] + 2]]);
      }
    }
    function bar(x, w, frac, color, right) {
      ctx.fillStyle = '#333'; ctx.fillRect(x, 20, w, 18);
      ctx.fillStyle = color;
      const fw = w * Math.max(0, frac);
      ctx.fillRect(right ? x + w - fw : x, 20, fw, 18);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x, 20, w, 18);
    }
    return {
      update(s) {
        const g = ctx.createLinearGradient(0, 0, 0, 480);
        g.addColorStop(0, '#1e1b4b'); g.addColorStop(1, '#7c2d12');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 900, 480);
        ctx.fillStyle = '#292524'; ctx.fillRect(0, 400, 900, 80);
        ctx.fillStyle = '#44403c'; for (let x = 0; x < 900; x += 60) ctx.fillRect(x, 400, 30, 4);
        s.f.forEach((f, i) => drawFighter(f, colors[i]));
        for (const p of s.proj) {
          ctx.fillStyle = colors[p.owner];
          ctx.shadowColor = colors[p.owner]; ctx.shadowBlur = 20;
          ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, 7); ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 7); ctx.fill();
        }
        // HUD
        bar(20, 360, s.f[0].hp / 100, colors[0], true);
        bar(520, 360, s.f[1].hp / 100, colors[1], false);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(20 + 360 - 200 * s.f[0].en / 100, 42, 200 * s.f[0].en / 100, 6);
        ctx.fillRect(520, 42, 200 * s.f[1].en / 100, 6);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Outfit, Arial';
        ctx.textAlign = 'left'; ctx.fillText(api.players[0].name + (api.you === 0 ? ' (you)' : ''), 20, 66);
        ctx.textAlign = 'right'; ctx.fillText(api.players[1].name + (api.you === 1 ? ' (you)' : ''), 880, 66);
        ctx.textAlign = 'center'; ctx.font = 'bold 30px Outfit, Arial';
        ctx.fillText(Math.ceil(s.timer / 50), 450, 42);
        for (let i = 0; i < 2; i++) {
          ctx.fillStyle = s.wins[0] > i ? '#facc15' : '#555'; ctx.beginPath(); ctx.arc(360 - i * 18, 76, 6, 0, 7); ctx.fill();
          ctx.fillStyle = s.wins[1] > i ? '#facc15' : '#555'; ctx.beginPath(); ctx.arc(540 + i * 18, 76, 6, 0, 7); ctx.fill();
        }
        if (s.msg) {
          ctx.font = 'bold 64px Outfit, Arial'; ctx.lineWidth = 6; ctx.strokeStyle = '#000'; ctx.fillStyle = '#facc15';
          const msg = s.msg.replace(/^P([12]) WINS ROUND$/, (_, n) => `${api.players[n - 1].name} wins round`.toUpperCase());
          ctx.strokeText(msg, 450, 230); ctx.fillText(msg, 450, 230);
        }
        api.status(`Round ${s.round}`, h('b', {}, `Rounds ${s.wins[api.you]} – ${s.wins[1 - api.you]}`), `Energy ${Math.floor(s.f[api.you].en)}`);
      },
      destroy() { keys.destroy(); },
    };
  }

  // ---------------------------------------------------------------- TETRIS BATTLE
  const TETRO = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  };
  const TKEYS = Object.keys(TETRO);
  const TCOLORS = ['#000', '#06b6d4', '#eab308', '#a855f7', '#22c55e', '#ef4444', '#3b82f6', '#f97316', '#6b7280'];
  function tetrisGame(stage, api) {
    const COLS = 10, ROWS = 20, CELL = 26;
    const [cv, ctx] = canvas(COLS * CELL, ROWS * CELL);
    const [nextCv, nctx] = canvas(96, 230);
    const [holdCv, hctx] = canvas(96, 80);
    const [oppCv, octx] = canvas(COLS * 13, ROWS * 13);
    const scoreEl = h('b', {}, '0'), linesEl = h('span', {}, '0'), levelEl = h('span', {}, '1'), oppEl = h('span', {}, '0');
    const meter = h('i', {});
    stage.append(h('div', { class: 'tetris-wrap' },
      h('div', { class: 'tetris-side' }, h('span', {}, 'Hold (C)'), holdCv, h('span', {}, 'Score'), scoreEl, h('span', {}, 'Lines ', linesEl), h('span', {}, 'Level ', levelEl),
        h('span', {}, 'Incoming'), h('div', { class: 'garbage-meter' }, meter)),
      cv,
      h('div', { class: 'tetris-side' }, h('span', {}, 'Next'), nextCv, h('span', {}, api.players[1 - api.you].name), oppCv, h('span', {}, 'Score ', oppEl))),
    touchPad([['◀', 'left'], ['▶', 'right'], ['⟳', 'rot'], ['▼', 'soft'], ['⤓', 'drop'], ['Hold', 'hold']], (a, v) => v && act(a)),
    h('div', { class: 'controls-help' }, META.tetris.help));

    let board = new Array(COLS * ROWS).fill(0), bag = [], queue = [], cur = null, hold = null, canHold = true;
    let score = 0, lines = 0, pending = 0, dead = false, stopped = false, acc = 0, lockDelay = 0, last = performance.now();
    const level = () => 1 + Math.floor(lines / 10);
    const dropMs = () => Math.max(70, 800 - (level() - 1) * 75);
    const nextType = () => {
      if (!bag.length) bag = TKEYS.slice().sort(() => Math.random() - 0.5);
      return bag.pop();
    };
    const spawnPiece = (type) => ({ type, m: TETRO[type].map((r) => r.slice()), x: Math.floor((COLS - TETRO[type][0].length) / 2), y: type === 'I' ? -1 : 0 });
    const fits = (m, px, py) => m.every((row, r) => row.every((v, c) => {
      if (!v) return true;
      const x = px + c, y = py + r;
      return x >= 0 && x < COLS && y < ROWS && (y < 0 || !board[y * COLS + x]);
    }));
    const rotate = (m, dir) => (dir > 0
      ? m[0].map((_, c) => m.map((row) => row[c]).reverse())
      : m[0].map((_, c) => m.map((row) => row[row.length - 1 - c])));
    function spawn() {
      while (queue.length < 4) queue.push(nextType());
      cur = spawnPiece(queue.shift());
      canHold = true;
      lockDelay = 0;
      if (!fits(cur.m, cur.x, cur.y)) die();
    }
    function die() {
      if (dead) return;
      dead = true;
      api.send({ kind: 'dead' });
    }
    function sendBoard() {
      api.send({ kind: 'board', board: board.join(''), score, lines });
    }
    function lock() {
      cur.m.forEach((row, r) => row.forEach((v, c) => {
        if (!v) return;
        const y = cur.y + r;
        if (y < 0) { die(); return; }
        board[y * COLS + cur.x + c] = TKEYS.indexOf(cur.type) + 1;
      }));
      if (dead) return;
      let cleared = 0;
      for (let y = ROWS - 1; y >= 0; y--) {
        if (board.slice(y * COLS, y * COLS + COLS).every(Boolean)) {
          board.splice(y * COLS, COLS);
          board.unshift(...new Array(COLS).fill(0));
          cleared++;
          y++;
        }
      }
      score += [0, 100, 300, 500, 800][cleared] * level();
      lines += cleared;
      let attack = [0, 0, 1, 2, 4][cleared];
      const cancel = Math.min(attack, pending);
      pending -= cancel; attack -= cancel;
      if (attack > 0) api.send({ kind: 'garbage', n: attack });
      if (!cleared && pending > 0) {
        const n = Math.min(pending, 10), hole = Math.floor(Math.random() * COLS);
        pending -= n;
        for (let i = 0; i < n; i++) {
          if (board.slice(0, COLS).some(Boolean)) { die(); return; }
          board.splice(0, COLS);
          board.push(...new Array(COLS).fill(8).map((v, c) => (c === hole ? 0 : v)));
        }
      }
      sendBoard();
      spawn();
    }
    function tryMove(dx, dy) {
      if (fits(cur.m, cur.x + dx, cur.y + dy)) { cur.x += dx; cur.y += dy; if (dy === 0) lockDelay = 0; return true; }
      return false;
    }
    function tryRotate(dir) {
      const m = rotate(cur.m, dir);
      for (const [kx, ky] of [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0], [0, -2]]) {
        if (fits(m, cur.x + kx, cur.y + ky)) { cur.m = m; cur.x += kx; cur.y += ky; lockDelay = 0; return; }
      }
    }
    function act(a) {
      if (dead || stopped || !cur) return;
      if (a === 'left') tryMove(-1, 0);
      else if (a === 'right') tryMove(1, 0);
      else if (a === 'rot') tryRotate(1);
      else if (a === 'rotl') tryRotate(-1);
      else if (a === 'soft') { if (tryMove(0, 1)) score += 1; acc = 0; }
      else if (a === 'drop') { while (tryMove(0, 1)) score += 2; lock(); }
      else if (a === 'hold' && canHold) {
        const t = cur.type;
        if (hold) cur = spawnPiece(hold); else spawn();
        hold = t; canHold = false;
      }
      draw();
    }
    const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'rot', KeyX: 'rot', KeyW: 'rot', KeyZ: 'rotl', ArrowDown: 'soft', KeyS: 'soft', Space: 'drop', KeyC: 'hold', ShiftLeft: 'hold', ShiftRight: 'hold' };
    const onKey = (e) => {
      const a = KEYMAP[e.code];
      if (!a || isTyping()) return;
      e.preventDefault();
      if (e.repeat && (a === 'rot' || a === 'rotl' || a === 'drop' || a === 'hold')) return;
      act(a);
    };
    addEventListener('keydown', onKey);

    function cellDraw(c, x, y, v, size, alpha) {
      c.globalAlpha = alpha || 1;
      c.fillStyle = TCOLORS[v];
      c.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      c.globalAlpha = 1;
    }
    function drawMini(c, type, w) {
      if (!type) return;
      const m = TETRO[type], size = 20;
      const offX = (w - m[0].length * size) / 2 / size;
      m.forEach((row, r) => row.forEach((v, cc) => v && cellDraw(c, cc + offX, r, TKEYS.indexOf(type) + 1, size)));
    }
    function draw() {
      ctx.fillStyle = '#0d0d12'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.strokeStyle = '#1c1c26';
      for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, cv.height); ctx.stroke(); }
      board.forEach((v, i) => v && cellDraw(ctx, i % COLS, Math.floor(i / COLS), v, CELL));
      if (cur && !dead) {
        let gy = cur.y;
        while (fits(cur.m, cur.x, gy + 1)) gy++;
        const v = TKEYS.indexOf(cur.type) + 1;
        cur.m.forEach((row, r) => row.forEach((x, c) => { if (x && gy + r >= 0) cellDraw(ctx, cur.x + c, gy + r, v, CELL, 0.25); }));
        cur.m.forEach((row, r) => row.forEach((x, c) => { if (x && cur.y + r >= 0) cellDraw(ctx, cur.x + c, cur.y + r, v, CELL); }));
      }
      nctx.fillStyle = '#0d0d12'; nctx.fillRect(0, 0, 96, 230);
      queue.slice(0, 3).forEach((t, i) => { nctx.save(); nctx.translate(0, i * 75 + 10); drawMini(nctx, t, 96); nctx.restore(); });
      hctx.fillStyle = '#0d0d12'; hctx.fillRect(0, 0, 96, 80);
      hctx.save(); hctx.translate(0, 18); hctx.globalAlpha = canHold ? 1 : 0.4; drawMini(hctx, hold, 96); hctx.restore();
      scoreEl.textContent = score; linesEl.textContent = lines; levelEl.textContent = level();
      meter.style.width = Math.min(100, pending * 10) + '%';
    }
    function loop(now) {
      if (stopped) return;
      const dt = now - last;
      last = now;
      if (!dead && cur) {
        acc += dt;
        if (!fits(cur.m, cur.x, cur.y + 1)) {
          lockDelay += dt;
          if (lockDelay > 500) lock();
        } else if (acc >= dropMs()) { acc = 0; tryMove(0, 1); }
      }
      draw();
      requestAnimationFrame(loop);
    }
    spawn();
    sendBoard();
    requestAnimationFrame(loop);
    return {
      update(s) {
        const ob = s.boards[1 - api.you];
        octx.fillStyle = '#0d0d12'; octx.fillRect(0, 0, oppCv.width, oppCv.height);
        if (ob) for (let i = 0; i < ob.length; i++) if (ob[i] !== '0') cellDraw(octx, i % COLS, Math.floor(i / COLS), +ob[i], 13);
        oppEl.textContent = s.scores[1 - api.you];
        api.status(h('b', {}, dead ? 'You topped out!' : 'Survive!'), `Junk sent: ${s.sent[api.you]}`, `Junk received: ${s.sent[1 - api.you]}`);
      },
      event(ev) { if (ev.garbage) { pending += ev.garbage; draw(); } },
      stop() { stopped = true; },
      destroy() { stopped = true; removeEventListener('keydown', onKey); },
    };
  }

  // ---------------------------------------------------------------- CHESS
  const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
  function chessGame(stage, api) {
    const board = h('div', { class: 'board' });
    const capTop = h('div', { class: 'captured' }), capBottom = h('div', { class: 'captured' });
    const promoBox = h('div', { class: 'promo hidden' });
    stage.append(capTop, board, capBottom, promoBox, h('div', { class: 'controls-help' }, `You are ${api.you === 0 ? 'White' : 'Black'} · ${META.chess.help}`));
    let state = null, sel = -1;
    const flip = api.you === 1;
    const mine = (p) => p && (api.you === 0 ? p === p.toUpperCase() : p === p.toLowerCase());
    const pieceEl = (p) => h('span', { class: p === p.toUpperCase() ? 'pw' : 'pb' }, GLYPH[p.toLowerCase()]);
    function render() {
      const s = state;
      const legal = s.turn === api.you && !s.result ? Rules.chess.legal(s) : [];
      const targets = sel >= 0 ? legal.filter((m) => m.from === sel) : [];
      const kingIdx = s.check ? s.board.indexOf(s.turn === 0 ? 'K' : 'k') : -1;
      board.replaceChildren();
      for (let v = 0; v < 64; v++) {
        const i = flip ? 63 - v : v, r = i >> 3, c = i & 7, p = s.board[i];
        const t = targets.find((m) => m.to === i);
        const cls = ['sq', (r + c) % 2 ? 'darksq' : 'light', s.last && s.last.includes(i) ? 'last' : '', i === sel ? 'sel' : '', i === kingIdx ? 'check' : '', t ? 'target' : '', t && p ? 'capture' : ''].join(' ');
        board.append(h('button', { class: cls, onclick: () => click(i, legal) },
          (flip ? c === 7 : c === 0) ? h('span', { class: 'coord' }, 8 - r) : null, p ? pieceEl(p) : null));
      }
      const capBy = (idx) => s.captured[idx].map((p) => GLYPH[p.toLowerCase()]).join('');
      capBottom.textContent = capBy(api.you);
      capTop.textContent = capBy(1 - api.you);
      if (s.result) api.status('Game over');
      else if (s.turn === api.you) api.status(h('b', {}, s.check ? 'Check! Your move' : 'Your move'));
      else api.status(`Waiting for ${api.players[1 - api.you].name}…`, s.check ? h('b', {}, 'Check!') : '');
    }
    function click(i, legal) {
      if (state.turn !== api.you || state.result) return;
      if (mine(state.board[i])) { sel = sel === i ? -1 : i; promoBox.classList.add('hidden'); return render(); }
      if (sel < 0) return;
      const moves = legal.filter((m) => m.from === sel && m.to === i);
      if (!moves.length) { sel = -1; return render(); }
      if (moves[0].promo) {
        const from = sel;
        promoBox.replaceChildren(h('span', {}, 'Promote to:'), ...['q', 'r', 'b', 'n'].map((pr) =>
          h('button', { onclick: () => { promoBox.classList.add('hidden'); api.send({ from, to: i, promo: pr }); } },
            pieceEl(api.you === 0 ? pr.toUpperCase() : pr))));
        promoBox.classList.remove('hidden');
        return;
      }
      api.send({ from: sel, to: i });
      sel = -1;
    }
    return { update(s) { state = s; sel = -1; render(); } };
  }

  // ---------------------------------------------------------------- CHECKERS
  function checkersGame(stage, api) {
    const board = h('div', { class: 'board checkers' });
    stage.append(board, h('div', { class: 'controls-help' }, `You are ${api.you === 0 ? 'Red (moving up)' : 'Black (moving up)'} · ${META.checkers.help}`));
    let state = null, sel = -1;
    const flip = api.you === 1;
    const owner = (p) => (p ? (p.toLowerCase() === 'r' ? 0 : 1) : -1);
    function render() {
      const s = state;
      const legal = s.turn === api.you && !s.result ? Rules.checkers.legal(s) : [];
      if (s.chain >= 0 && s.turn === api.you) sel = s.chain;
      const movable = new Set(legal.map((m) => m.from));
      const targets = legal.filter((m) => m.from === sel);
      board.replaceChildren();
      for (let v = 0; v < 64; v++) {
        const i = flip ? 63 - v : v, r = i >> 3, c = i & 7, p = s.board[i];
        const cls = ['sq', (r + c) % 2 ? 'darksq' : 'light', s.last && s.last.includes(i) ? 'last' : '', i === sel ? 'sel' : '', targets.some((m) => m.to === i) ? 'target' : ''].join(' ');
        board.append(h('button', { class: cls, onclick: () => click(i, legal) },
          p ? h('div', { class: 'ck-piece ' + (owner(p) === 0 ? 'red' : 'black'), style: movable.has(i) && sel < 0 ? 'outline:3px solid #facc15' : '' }, p === p.toUpperCase() ? '♛' : '') : null));
      }
      const count = (o) => s.board.filter((p) => owner(p) === o).length;
      if (s.result) api.status('Game over');
      else if (s.turn === api.you) api.status(h('b', {}, s.chain >= 0 ? 'Keep jumping!' : legal.some((m) => m.cap !== undefined) ? 'You must capture!' : 'Your move'), `Pieces ${count(api.you)} vs ${count(1 - api.you)}`);
      else api.status(`Waiting for ${api.players[1 - api.you].name}…`, `Pieces ${count(api.you)} vs ${count(1 - api.you)}`);
    }
    function click(i, legal) {
      if (state.turn !== api.you || state.result) return;
      if (state.chain < 0 && owner(state.board[i]) === api.you) { sel = sel === i ? -1 : i; return render(); }
      const m = legal.find((x) => x.from === sel && x.to === i);
      if (m) api.send({ from: m.from, to: m.to });
    }
    return { update(s) { state = s; sel = -1; render(); } };
  }

  // ---------------------------------------------------------------- CONNECT FOUR
  function connect4Game(stage, api) {
    const grid = h('div', { class: 'c4' });
    stage.append(grid, h('div', { class: 'controls-help' }, `You are ${api.you === 0 ? '🔴 Red' : '🟡 Yellow'} · ${META.connect4.help}`));
    return {
      update(s) {
        grid.replaceChildren(...s.grid.map((v, i) => h('button', {
          class: [v >= 0 ? 'p' + v : '', s.line && s.line.includes(i) ? 'win' : '', i === s.last ? 'last' : ''].join(' '),
          onclick: () => s.turn === api.you && !s.result && api.send({ col: i % 7 }),
        })));
        if (!s.result) api.status(s.turn === api.you ? h('b', {}, 'Your move') : `Waiting for ${api.players[1 - api.you].name}…`);
      },
    };
  }

  // ---------------------------------------------------------------- TIC-TAC-TOE
  function tictactoeGame(stage, api) {
    const grid = h('div', { class: 'ttt' });
    stage.append(grid, h('div', { class: 'controls-help' }, `You are ${api.you === 0 ? 'X' : 'O'}`));
    return {
      update(s) {
        grid.replaceChildren(...s.cells.map((v, i) => h('button', {
          class: s.line && s.line.includes(i) ? 'win' : '',
          style: v >= 0 ? `color:${v === 0 ? '#ef4444' : '#2563eb'}` : '',
          onclick: () => s.turn === api.you && !s.result && v < 0 && api.send({ cell: i }),
        }, v === 0 ? 'X' : v === 1 ? 'O' : '')));
        if (!s.result) api.status(s.turn === api.you ? h('b', {}, 'Your move') : `Waiting for ${api.players[1 - api.you].name}…`);
      },
    };
  }

  // ---------------------------------------------------------------- REVERSI
  function reversiGame(stage, api) {
    const board = h('div', { class: 'board reversi' });
    stage.append(board, h('div', { class: 'controls-help' }, `You are ${api.you === 0 ? '⚫ Black' : '⚪ White'} · ${META.reversi.help}`));
    return {
      update(s) {
        const moves = s.turn === api.you && !s.result ? new Set(Rules.reversi.legal(s).map((m) => m.cell)) : new Set();
        board.replaceChildren(...s.board.map((v, i) => h('button', {
          class: ['sq', i === s.last ? 'last' : '', moves.has(i) ? 'hint' : ''].join(' '),
          'aria-label': `Row ${(i >> 3) + 1}, column ${(i & 7) + 1}`,
          onclick: () => moves.has(i) && api.send({ cell: i }),
        }, v >= 0 ? h('span', { class: 'disc ' + (v === 0 ? 'black' : 'white') }) : null)));
        const [b, w] = Rules.reversi.count(s.board);
        const mine = api.you === 0 ? b : w, theirs = api.you === 0 ? w : b;
        if (s.result) api.status(`Discs ${mine} – ${theirs}`);
        else if (s.turn === api.you) api.status(h('b', {}, s.passed ? 'They had no move, so it’s your move again' : 'Your move'), `Discs ${mine} – ${theirs}`);
        else api.status(`Waiting for ${api.players[1 - api.you].name}…`, s.passed ? 'You had no move' : '', `Discs ${mine} – ${theirs}`);
      },
    };
  }

  // ---------------------------------------------------------------- DOTS & BOXES
  function dotsGame(stage, api) {
    const SIZE = 440, M = 40, GAP = 90;
    const [cv, ctx] = canvas(SIZE, SIZE);
    cv.classList.add('board-canvas');
    const colors = playerColors(api.players);
    let state = null, hover = -1;
    stage.append(cv, h('div', { class: 'controls-help' }, META.dots.help));
    const ends = (l) => (l < 20 ? [[M + (l % 4) * GAP, M + Math.floor(l / 4) * GAP], [M + (l % 4 + 1) * GAP, M + Math.floor(l / 4) * GAP]]
      : [[M + ((l - 20) % 5) * GAP, M + Math.floor((l - 20) / 5) * GAP], [M + ((l - 20) % 5) * GAP, M + (Math.floor((l - 20) / 5) + 1) * GAP]]);
    function lineAt(e) {
      const r = cv.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * SIZE, y = ((e.clientY - r.top) / r.height) * SIZE;
      let best = -1, bd = 22;
      for (let l = 0; l < 40; l++) {
        const [[x1, y1], [x2, y2]] = ends(l), mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const d = l < 20 ? Math.abs(y - y1) + Math.max(0, Math.abs(x - mx) - GAP / 2) : Math.abs(x - x1) + Math.max(0, Math.abs(y - my) - GAP / 2);
        if (d < bd) { bd = d; best = l; }
      }
      return best;
    }
    const myTurn = () => state && !state.result && state.turn === api.you;
    cv.addEventListener('pointermove', (e) => { const l = lineAt(e); hover = myTurn() && l >= 0 && state.lines[l] === -1 ? l : -1; draw(); });
    cv.addEventListener('pointerleave', () => { hover = -1; draw(); });
    cv.addEventListener('click', (e) => { const l = lineAt(e); if (myTurn() && l >= 0 && state.lines[l] === -1) { hover = -1; api.send({ line: l }); } });
    function draw() {
      if (!state) return;
      const s = state, dark = getComputedStyle(document.body).getPropertyValue('--surface').trim();
      ctx.fillStyle = dark || '#fff'; ctx.fillRect(0, 0, SIZE, SIZE);
      s.boxes.forEach((o, i) => {
        if (o < 0) return;
        const x = M + (i % 4) * GAP, y = M + Math.floor(i / 4) * GAP;
        ctx.globalAlpha = 0.28; ctx.fillStyle = colors[o]; ctx.fillRect(x, y, GAP, GAP); ctx.globalAlpha = 1;
        ctx.fillStyle = colors[o]; ctx.font = 'bold 30px Outfit, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText((api.players[o].name.replace(/^\W+/, '')[0] || '?').toUpperCase(), x + GAP / 2, y + GAP / 2);
      });
      for (let l = 0; l < 40; l++) {
        const [[x1, y1], [x2, y2]] = ends(l), o = s.lines[l];
        if (o < 0 && l !== hover) continue;
        ctx.strokeStyle = o >= 0 ? colors[o] : colors[api.you]; ctx.globalAlpha = o >= 0 ? 1 : 0.4;
        ctx.lineWidth = l === s.last ? 9 : 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#64748b';
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) { ctx.beginPath(); ctx.arc(M + c * GAP, M + r * GAP, 7, 0, 7); ctx.fill(); }
    }
    return {
      update(s) {
        state = s; draw();
        const sc = `Boxes ${s.scores[api.you]} – ${s.scores[1 - api.you]}`;
        if (s.result) api.status(sc);
        else api.status(s.turn === api.you ? h('b', {}, 'Your move') : `Waiting for ${api.players[1 - api.you].name}…`, sc);
      },
    };
  }

  // ---------------------------------------------------------------- MANCALA
  function mancalaGame(stage, api) {
    const wrap = h('div', { class: 'mancala' });
    stage.append(wrap, h('div', { class: 'controls-help' }, META.mancala.help));
    const mineIdx = api.you === 0 ? [0, 1, 2, 3, 4, 5] : [7, 8, 9, 10, 11, 12];
    const theirsIdx = api.you === 0 ? [12, 11, 10, 9, 8, 7] : [5, 4, 3, 2, 1, 0];
    const myStore = api.you === 0 ? 6 : 13, theirStore = api.you === 0 ? 13 : 6;
    const seeds = (n) => h('span', { class: 'seeds' }, ...Array.from({ length: Math.min(n, 15) }, () => h('i', {})));
    return {
      update(s) {
        const can = s.turn === api.you && !s.result;
        const pit = (i, mine) => h('button', {
          class: ['pit', mine && can && s.pits[i] ? 'can' : '', i === s.last ? 'last' : ''].join(' '),
          'aria-label': `${s.pits[i]} seeds`,
          onclick: () => mine && can && s.pits[i] && api.send({ pit: i }),
        }, seeds(s.pits[i]), h('b', {}, s.pits[i]));
        wrap.replaceChildren(
          h('div', { class: 'store' }, h('small', {}, api.players[1 - api.you].name), seeds(s.pits[theirStore]), h('b', {}, s.pits[theirStore])),
          h('div', { class: 'pits' }, theirsIdx.map((i) => pit(i, false)), mineIdx.map((i) => pit(i, true))),
          h('div', { class: 'store mine' }, h('small', {}, 'You'), seeds(s.pits[myStore]), h('b', {}, s.pits[myStore])));
        const sc = `Store ${s.pits[myStore]} – ${s.pits[theirStore]}`;
        if (s.result) api.status(sc);
        else api.status(can ? h('b', {}, 'Your move') : `Waiting for ${api.players[1 - api.you].name}…`, sc);
      },
    };
  }

  // ---------------------------------------------------------------- FIVE IN A ROW
  function gomokuGame(stage, api) {
    const board = h('div', { class: 'gomoku' });
    stage.append(board, h('div', { class: 'controls-help' }, `You are ${api.you === 0 ? '⚫ Black' : '⚪ White'} · ${META.gomoku.help}`));
    return {
      update(s) {
        const can = s.turn === api.you && !s.result;
        board.replaceChildren(...s.cells.map((v, i) => h('button', {
          class: ['pt', i === s.last ? 'last' : '', s.line && s.line.includes(i) ? 'win' : '', can && v < 0 ? 'can' : ''].join(' '),
          'aria-label': `Row ${Math.floor(i / 15) + 1}, column ${(i % 15) + 1}`,
          onclick: () => can && v < 0 && api.send({ cell: i }),
        }, v >= 0 ? h('span', { class: 'stone ' + (v === 0 ? 'black' : 'white') }) : null)));
        if (!s.result) api.status(can ? h('b', {}, 'Your move') : `Waiting for ${api.players[1 - api.you].name}…`);
      },
    };
  }

  // ---------------------------------------------------------------- LIGHT CYCLES
  function tronGame(stage, api) {
    const CELL = 14;
    const [cv, ctx] = canvas(56 * CELL, 36 * CELL);
    const colors = playerColors(api.players);
    stage.append(cv, touchPad([['◀', 'L'], ['▲', 'U'], ['▼', 'D'], ['▶', 'R']], (a, v) => v && api.send({ dir: a })),
      h('div', { class: 'controls-help' }, META.tron.help));
    const keys = heldKeys({ ArrowUp: 'U', KeyW: 'U', ArrowDown: 'D', KeyS: 'D', ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R' }, (held, a, v) => v && api.send({ dir: a }));
    let sx = 0, sy = 0;
    cv.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
    cv.addEventListener('pointerup', (e) => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
      api.send({ dir: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : dy > 0 ? 'D' : 'U' });
    });
    return {
      update(s) {
        ctx.fillStyle = '#05060d'; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.strokeStyle = 'rgba(99,102,241,.12)'; ctx.lineWidth = 1;
        for (let x = 0; x <= s.W; x += 4) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, cv.height); ctx.stroke(); }
        for (let y = 0; y <= s.H; y += 4) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(cv.width, y * CELL); ctx.stroke(); }
        for (let i = 0; i < s.grid.length; i++) {
          const ch = s.grid[i];
          if (ch === '0') continue;
          ctx.fillStyle = colors[+ch - 1]; ctx.globalAlpha = 0.75;
          ctx.fillRect((i % s.W) * CELL + 2, Math.floor(i / s.W) * CELL + 2, CELL - 4, CELL - 4);
        }
        ctx.globalAlpha = 1;
        s.p.forEach((p, i) => {
          ctx.fillStyle = p.alive ? '#fff' : '#ef4444';
          ctx.shadowColor = colors[i]; ctx.shadowBlur = 16;
          ctx.fillRect(p.x * CELL, p.y * CELL, CELL, CELL);
          ctx.shadowBlur = 0;
        });
        if (s.msg) {
          const msg = s.msg.replace(/^P([12]) SCORES$/, (_, n) => `${api.players[n - 1].name} scores`.toUpperCase());
          ctx.font = 'bold 48px Outfit, Arial'; ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = '#000'; ctx.fillStyle = '#fff';
          ctx.strokeText(msg, cv.width / 2, cv.height / 2); ctx.fillText(msg, cv.width / 2, cv.height / 2);
        }
        api.status(h('b', {}, `Rounds ${s.wins[api.you]} – ${s.wins[1 - api.you]}`), `First to ${s.to}`,
          h('span', { style: `color:${colors[api.you]};font-weight:bold` }, 'You'), `vs`, h('span', { style: `color:${colors[1 - api.you]};font-weight:bold` }, api.players[1 - api.you].name));
      },
      destroy() { keys.destroy(); },
    };
  }

  // ---------------------------------------------------------------- AIR HOCKEY
  function hockeyGame(stage, api) {
    const [cv, ctx] = canvas(800, 480);
    const colors = playerColors(api.players);
    stage.append(cv, h('div', { class: 'controls-help' }, `You're on the ${api.you === 0 ? 'LEFT' : 'RIGHT'} · ${META.hockey.help}`));
    let lastSent = 0, pending = null;
    // When the game runs in the other player's browser, move our own mallet here (same rules as
    // the game) and send where it is, instead of waiting a round trip to see it move.
    const local = api.predict ? { m: null, aim: null, keys: null, sentAt: 0, sent: '' } : null;
    const sendAim = (e) => {
      const r = cv.getBoundingClientRect();
      pending = { tx: ((e.clientX - r.left) / r.width) * 800, ty: ((e.clientY - r.top) / r.height) * 480 };
      if (local) { local.aim = pending; local.keys = null; pending = null; return; }
      const now = performance.now();
      if (now - lastSent > 33) { lastSent = now; api.send(pending); pending = null; }
    };
    cv.addEventListener('pointermove', sendAim);
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); sendAim(e); });
    const flush = setInterval(() => {
      if (!local) { if (pending) { api.send(pending); pending = null; } return; }
      const m = local.m;
      if (!m) return;
      const me = api.you, R = 30, minX = me === 0 ? R : 400 + R, maxX = me === 0 ? 400 - R : 800 - R;
      let tx = m.x, ty = m.y;
      if (local.keys) { tx = m.x + local.keys.x * 40; ty = m.y + local.keys.y * 40; } else if (local.aim) { tx = local.aim.tx; ty = local.aim.ty; }
      tx = Math.max(minX, Math.min(maxX, tx)); ty = Math.max(R, Math.min(480 - R, ty));
      let dx = tx - m.x, dy = ty - m.y;
      const d = Math.hypot(dx, dy);
      if (d > 13) { dx = (dx / d) * 13; dy = (dy / d) * 13; }
      m.x += dx; m.y += dy; m.vx = dx; m.vy = dy;
      const now = performance.now(), key = Math.round(m.x) + ',' + Math.round(m.y);
      if (now - local.sentAt > 30 && (key !== local.sent || dx || dy)) { local.sent = key; local.sentAt = now; api.send({ mx: m.x, my: m.y, vx: m.vx, vy: m.vy }); }
    }, local ? 20 : 50);
    const keys = heldKeys({ ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' },
      (k) => {
        if (local) { local.keys = k.up || k.down || k.left || k.right ? { x: (k.right ? 1 : 0) - (k.left ? 1 : 0), y: (k.down ? 1 : 0) - (k.up ? 1 : 0) } : null; if (!local.keys) local.aim = null; return; }
        api.send({ up: !!k.up, down: !!k.down, left: !!k.left, right: !!k.right });
      });
    return {
      update(s) {
        ctx.fillStyle = '#e0f2fe'; ctx.fillRect(0, 0, 800, 480);
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(400, 0); ctx.lineTo(400, 480); ctx.stroke();
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(400, 240, 60, 0, 7); ctx.stroke();
        ctx.lineWidth = 3;
        [0, 800].forEach((x, i) => {
          ctx.strokeStyle = colors[i]; ctx.beginPath(); ctx.arc(x, 240, 90, 0, 7); ctx.stroke();
          ctx.fillStyle = '#0f172a'; ctx.fillRect(i ? 794 : 0, 240 - s.goal / 2, 6, s.goal);
        });
        ctx.font = 'bold 64px Outfit, Arial'; ctx.textAlign = 'center'; ctx.globalAlpha = 0.25;
        ctx.fillStyle = colors[0]; ctx.fillText(s.score[0], 300, 90);
        ctx.fillStyle = colors[1]; ctx.fillText(s.score[1], 500, 90); ctx.globalAlpha = 1;
        if (local && (!local.m || Math.hypot(local.m.x - s.m[api.you].x, local.m.y - s.m[api.you].y) > 250)) local.m = { x: s.m[api.you].x, y: s.m[api.you].y, vx: 0, vy: 0 };
        s.m.forEach((m0, i) => {
          const m = local && i === api.you ? local.m : m0;
          ctx.fillStyle = colors[i]; ctx.beginPath(); ctx.arc(m.x, m.y, s.mallet, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(m.x, m.y, s.mallet * 0.45, 0, 7); ctx.fill();
          if (i === api.you) { ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(m.x, m.y, s.mallet + 3, 0, 7); ctx.stroke(); }
        });
        ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(s.puck.x, s.puck.y, s.puckR, 0, 7); ctx.fill();
        if (s.serve > 0) { ctx.font = '20px Outfit, Arial'; ctx.fillStyle = '#0f172a'; ctx.fillText('Get ready…', 400, 300); }
        api.status(`First to ${s.to}`, h('b', {}, `${s.score[api.you]} – ${s.score[1 - api.you]}`));
      },
      destroy() { keys.destroy(); clearInterval(flush); },
    };
  }

  // ---------------------------------------------------------------- APEX RUSH 3D
  // The racing game is its own page (apex.html) in a frame. This side passes messages between
  // that frame and the other player, and reports the result.
  function apexGame(stage, api) {
    const frame = h('iframe', { class: 'apex-frame', src: 'apex.html', title: 'Apex Rush 3D', allow: 'autoplay; fullscreen' });
    const target = location.origin === 'null' ? '*' : location.origin;
    let ready = false;
    const queue = [];
    const post = (msg) => { if (frame.contentWindow) frame.contentWindow.postMessage(msg, target); };
    const onMsg = (e) => {
      if (e.source !== frame.contentWindow) return;
      const m = e.data || {};
      if (m.type === 'apex:hello') {
        ready = true;
        post(api.bot ? { type: 'apex:init', mode: 'bot', diff: api.bot.diff }
          : { type: 'apex:init', mode: 'online', you: api.you, players: api.players.map((p) => ({ name: p.name })) });
        queue.splice(0).forEach((d) => post({ type: 'apex:peer', data: d }));
        frame.focus();
      } else if (m.type === 'apex:send' && !api.bot) api.send({ kind: 'msg', data: m.data });
      else if (m.type === 'apex:result' && !api.bot) api.send({ kind: 'result', winner: m.winner, reason: String(m.reason || '').slice(0, 80) });
      else if (m.type === 'apex:leave') api.leave();
    };
    addEventListener('message', onMsg);
    stage.append(frame);
    api.status((api.bot ? 'Racing the computer. ' : '') + 'Drive with WASD or the arrow keys. Click the game if your keys stop working.');
    return {
      update() {},
      event(ev) {
        if (!ev || !ev.msg) return;
        if (ready) post({ type: 'apex:peer', data: ev.msg }); else queue.push(ev.msg);
      },
      destroy() { removeEventListener('message', onMsg); frame.src = 'about:blank'; },
    };
  }

  const FACTORY = {
    snake: snakeGame, pong: pongGame, fighter: fighterGame, tetris: tetrisGame, chess: chessGame, checkers: checkersGame, connect4: connect4Game, tictactoe: tictactoeGame,
    reversi: reversiGame, dots: dotsGame, mancala: mancalaGame, gomoku: gomokuGame, tron: tronGame, hockey: hockeyGame, apex: apexGame,
  };

  // ---------------------------------------------------------------- dock
  let host = null, cur = null;
  // Smoothing for a player whose updates arrive over the network in uneven bursts: keep the last
  // few states and draw slightly in the past, sliding positions between them every frame.
  const SMOOTH = new Set(['pong', 'hockey', 'fighter']);
  function lerpState(a, b, t, key) {
    if (typeof a === 'number' && typeof b === 'number') {
      if (key !== 'x' && key !== 'y') return b;
      return Math.abs(b - a) > 150 ? b : a + (b - a) * t; // a big jump is a reset: don't slide across the board
    }
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length ? b.map((v, i) => lerpState(a[i], v, t, key)) : b;
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      const out = {};
      for (const k of Object.keys(b)) out[k] = k in a ? lerpState(a[k], b[k], t, k) : b[k];
      return out;
    }
    return b;
  }
  function smoothPush(c, state) {
    const now = performance.now(), buf = c.buf;
    if (buf.length) c.gap = c.gap * 0.85 + Math.min(200, now - buf[buf.length - 1].t) * 0.15;
    buf.push({ t: now, s: state });
    while (buf.length > 12) buf.shift();
    if (!c.raf) c.raf = requestAnimationFrame(() => smoothFrame(c));
  }
  function smoothFrame(c) {
    c.raf = 0;
    if (cur !== c || c.over) return;
    const buf = c.buf, at = performance.now() - Math.max(40, Math.min(160, c.gap * 2 + 15));
    let i = buf.length - 1;
    while (i > 0 && buf[i - 1].t > at) i--;
    const b = buf[i], a = buf[i - 1];
    const s = !a || at >= b.t ? b.s : lerpState(a.s, b.s, Math.max(0, Math.min(1, (at - a.t) / (b.t - a.t || 1))));
    c.inst.update(s);
    c.raf = requestAnimationFrame(() => smoothFrame(c));
  }
  const dock = () => document.getElementById('gameDock');

  function close() {
    const c = cur;
    if (c && c.raf) cancelAnimationFrame(c.raf);
    if (c && c.inst.destroy) c.inst.destroy();
    cur = null;
    if (c && c.onClose) c.onClose();
    dock().classList.add('hidden');
    dock().classList.remove('min', 'full');
    dock().replaceChildren();
  }
  function start(m) {
    if (cur && cur.id === m.id) { cur.inst.update(m.state); return; }
    close();
    const meta = META[m.game], d = dock();
    const gameHost = m.host || host; // a bot game brings its own host instead of the server
    const colors = playerColors(m.players);
    const statusEl = h('div', { class: 'game-status' });
    const stage = h('div', { class: 'game-stage' });
    const leaveBtn = h('button', { class: 'btn danger small', onclick: () => {
      if (!cur) return;
      if (cur.over) close();
      else {
        const id = cur.id;
        window.uiConfirm('Forfeit this game?', 'Forfeit', () => gameHost.leave(id));
      }
    } }, 'Forfeit');
    d.replaceChildren(
      h('div', { class: 'game-head' },
        h('span', { class: 'title' }, `${meta.emoji} ${meta.name}`),
        h('span', { class: 'players-line' }, ...m.players.map((p, i) => h('span', { class: 'pchip' }, h('i', { style: `background:${colors[i]}` }), p.name + (i === m.you ? ' (you)' : ''))).reduce((a, el, i) => (i ? a.concat(' vs ', el) : [el]), [])),
        h('button', { class: 'btn small', title: 'Minimize', onclick: () => d.classList.toggle('min') }, '▁'),
        leaveBtn),
      statusEl, stage);
    d.classList.remove('hidden', 'min');
    d.classList.toggle('full', m.game === 'apex'); // the racing game wants the whole window
    const api = {
      you: m.you,
      predict: !!(m.net && m.net.predict),
      players: m.players,
      bot: m.bot || null,
      leave: () => cur && (cur.over ? close() : gameHost.leave(cur.id)),
      send: (input) => cur && !cur.over && gameHost.send(cur.id, input),
      status: (...parts) => statusEl.replaceChildren(...parts.flat().filter((x) => x !== '' && x !== null).map((x) => (x instanceof Node ? x : h('span', {}, x)))),
    };
    cur = { id: m.id, game: m.game, players: m.players, you: m.you, over: false, smooth: !!(m.net && m.net.smooth) && SMOOTH.has(m.game), buf: [], gap: 33, raf: 0, stage, statusEl, leaveBtn, host: gameHost, onClose: m.onClose, inst: FACTORY[m.game](stage, api) };
    cur.inst.update(m.state);
    if (document.activeElement && document.activeElement.id === 'msgInput') document.activeElement.blur();
  }
  function over(m) {
    if (!cur || cur.id !== m.id) return;
    cur.over = true;
    if (cur.raf) { cancelAnimationFrame(cur.raf); cur.raf = 0; }
    cur.inst.update(m.state);
    if (cur.inst.stop) cur.inst.stop();
    cur.leaveBtn.textContent = 'Close';
    const r = m.result, win = r.winner === cur.you, draw = r.winner === -1;
    const opp = cur.players[1 - cur.you];
    const { game } = cur;
    cur.statusEl.replaceChildren(h('b', {}, draw ? 'Draw' : win ? 'You won! 🏆' : `${opp.name} won`), h('span', { class: 'muted' }, r.reason));
    cur.stage.append(h('div', { class: 'game-over' }, h('div', { class: 'box' },
      h('div', { style: 'font-size:44px' }, draw ? '🤝' : win ? '🏆' : '😵'),
      h('h3', {}, draw ? 'Draw!' : win ? 'You win!' : 'You lose'),
      h('div', { class: 'muted' }, r.reason),
      h('div', { class: 'row', style: 'justify-content:center' },
        h('button', { class: 'btn', onclick: close }, 'Close'),
        h('button', { class: 'btn primary', onclick: () => { const again = cur.host; close(); again.rematch(game, opp.username); } }, `Rematch ${opp.name}`)))));
  }

  window.GameDock = {
    META,
    init(h2) { host = h2; },
    start,
    close,
    over,
    state(m) {
      if (!cur || cur.id !== m.id) return;
      if (cur.smooth) smoothPush(cur, m.state);
      else cur.inst.update(m.state);
    },
    event(m) { if (cur && cur.id === m.id && cur.inst.event) cur.inst.event(m.ev); },
  };
})();
