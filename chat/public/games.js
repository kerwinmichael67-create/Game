// Game dock: renders whichever multiplayer game you're in next to the chat.
(() => {
  const META = {
    snake: { emoji: '🐍', name: 'Snake PvP', desc: 'Eat & grow. Longest snake after 90s wins.', help: 'Arrow keys / WASD (or swipe)' },
    chess: { emoji: '♟️', name: 'Chess', desc: 'Classic chess with full rules.', help: 'Click a piece, then click where to move it' },
    checkers: { emoji: '⛀', name: 'Checkers', desc: 'Jumps are mandatory. Reach the end to king.', help: 'Click a piece, then click where to move it' },
    tetris: { emoji: '🧱', name: 'Tetris Battle', desc: 'Clear lines to send junk. Last one standing wins.', help: '←→ move · ↑/X rotate · Z rotate back · ↓ soft drop · Space hard drop · C hold' },
    fighter: { emoji: '🥊', name: 'Street Fighter', desc: 'Best of 3 rounds. Punch, kick, block, fireball.', help: 'A/D or ←→ move · W/↑ jump · S/↓ block · J punch · K kick · L fireball (needs 50 energy)' },
    pong: { emoji: '🏓', name: 'Pong', desc: 'First to 7 points wins.', help: 'W/S or ↑/↓ to move your paddle' },
    connect4: { emoji: '🔴', name: 'Connect Four', desc: 'Get four in a row.', help: 'Click a column to drop a disc' },
    tictactoe: { emoji: '❌', name: 'Tic-Tac-Toe', desc: 'Three in a row. Quick game!', help: 'Click a square' },
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
    return [a, a.toLowerCase() === b.toLowerCase() ? (a.toLowerCase() === '#3b82f6' ? '#f97316' : '#3b82f6') : b];
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
    const keys = heldKeys({ ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' }, (k) => api.send({ up: !!k.up, down: !!k.down }));
    stage.append(cv, touchPad([['▲', 'up'], ['▼', 'down']], (a, v) => { held[a] = v; api.send(held); }),
      h('div', { class: 'controls-help' }, `You are the ${api.you === 0 ? 'LEFT' : 'RIGHT'} paddle · ${META.pong.help}`));
    return {
      update(s) {
        ctx.fillStyle = '#0d0d12';
        ctx.fillRect(0, 0, 800, 500);
        ctx.fillStyle = '#333';
        for (let y = 0; y < 500; y += 30) ctx.fillRect(398, y, 4, 18);
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = colors[0]; ctx.fillText(s.score[0], 320, 70);
        ctx.fillStyle = colors[1]; ctx.fillText(s.score[1], 480, 70);
        ctx.fillStyle = colors[0]; ctx.fillRect(30, s.p[0].y, 12, s.ph);
        ctx.fillStyle = colors[1]; ctx.fillRect(758, s.p[1].y, 12, s.ph);
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, 8, 0, 7); ctx.fill();
        if (s.serve > 0) { ctx.font = '20px Arial'; ctx.fillText('Get ready…', 400, 300); }
        api.status(`First to ${s.to}`, h('b', {}, `${s.score[api.you]} – ${s.score[1 - api.you]}`));
      },
      destroy() { keys.destroy(); },
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
        ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'left'; ctx.fillText(api.players[0].name + (api.you === 0 ? ' (you)' : ''), 20, 66);
        ctx.textAlign = 'right'; ctx.fillText(api.players[1].name + (api.you === 1 ? ' (you)' : ''), 880, 66);
        ctx.textAlign = 'center'; ctx.font = 'bold 30px Arial';
        ctx.fillText(Math.ceil(s.timer / 50), 450, 42);
        for (let i = 0; i < 2; i++) {
          ctx.fillStyle = s.wins[0] > i ? '#facc15' : '#555'; ctx.beginPath(); ctx.arc(360 - i * 18, 76, 6, 0, 7); ctx.fill();
          ctx.fillStyle = s.wins[1] > i ? '#facc15' : '#555'; ctx.beginPath(); ctx.arc(540 + i * 18, 76, 6, 0, 7); ctx.fill();
        }
        if (s.msg) {
          ctx.font = 'bold 64px Arial'; ctx.lineWidth = 6; ctx.strokeStyle = '#000'; ctx.fillStyle = '#facc15';
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

  const FACTORY = { snake: snakeGame, pong: pongGame, fighter: fighterGame, tetris: tetrisGame, chess: chessGame, checkers: checkersGame, connect4: connect4Game, tictactoe: tictactoeGame };

  // ---------------------------------------------------------------- dock
  let host = null, cur = null;
  const dock = () => document.getElementById('gameDock');

  function close() {
    if (cur && cur.inst.destroy) cur.inst.destroy();
    cur = null;
    dock().classList.add('hidden');
    dock().classList.remove('min');
    dock().replaceChildren();
  }
  function start(m) {
    if (cur && cur.id === m.id) { cur.inst.update(m.state); return; }
    close();
    const meta = META[m.game], d = dock();
    const colors = playerColors(m.players);
    const statusEl = h('div', { class: 'game-status' });
    const stage = h('div', { class: 'game-stage' });
    const leaveBtn = h('button', { class: 'btn danger small', onclick: () => {
      if (!cur) return;
      if (cur.over) close();
      else if (confirm('Forfeit this game?')) host.leave(cur.id);
    } }, 'Forfeit');
    d.replaceChildren(
      h('div', { class: 'game-head' },
        h('span', { class: 'title' }, `${meta.emoji} ${meta.name}`),
        h('span', { class: 'players-line' }, ...m.players.map((p, i) => h('span', { class: 'pchip' }, h('i', { style: `background:${colors[i]}` }), p.name + (i === m.you ? ' (you)' : ''))).reduce((a, el, i) => (i ? a.concat(' vs ', el) : [el]), [])),
        h('button', { class: 'btn small', title: 'Minimize', onclick: () => d.classList.toggle('min') }, '▁'),
        leaveBtn),
      statusEl, stage);
    d.classList.remove('hidden', 'min');
    const api = {
      you: m.you,
      players: m.players,
      send: (input) => cur && !cur.over && host.send(cur.id, input),
      status: (...parts) => statusEl.replaceChildren(...parts.flat().filter((x) => x !== '' && x !== null).map((x) => (x instanceof Node ? x : h('span', {}, x)))),
    };
    cur = { id: m.id, game: m.game, players: m.players, you: m.you, over: false, stage, statusEl, leaveBtn, inst: FACTORY[m.game](stage, api) };
    cur.inst.update(m.state);
    if (document.activeElement && document.activeElement.id === 'msgInput') document.activeElement.blur();
  }
  function over(m) {
    if (!cur || cur.id !== m.id) return;
    cur.inst.update(m.state);
    cur.over = true;
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
        h('button', { class: 'btn primary', onclick: () => { host.rematch(game, opp.username); close(); } }, `Rematch ${opp.name}`)))));
  }

  window.GameDock = {
    META,
    init(h2) { host = h2; },
    start,
    close,
    over,
    state(m) { if (cur && cur.id === m.id) cur.inst.update(m.state); },
    event(m) { if (cur && cur.id === m.id && cur.inst.event) cur.inst.event(m.ev); },
  };
})();
