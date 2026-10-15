// Party games with servers anyone can join (opened from the 🕹️ Games button).
// Draw Phone, like Gartic Phone: everyone writes a prompt, then the papers go round: draw the
// prompt you're handed, describe the drawing you're handed, and so on. Then every album is shown.
(() => {
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid instanceof Node ? kid : String(kid));
    return el;
  }
  const GAMES = {
    phone: { name: 'Draw Phone', emoji: '🎨', color: 'linear-gradient(135deg,#f472b6,#8b5cf6)', players: '2–12 players',
      desc: 'Write a prompt, draw what you’re handed, guess what others drew — then watch how it all went wrong.' },
  };
  // Games that run full-window in their own frame, with their own servers (games/*.html + games/net.js)
  const FRAME_GAMES = {
    blockcraft: { name: 'Blockcraft', emoji: '⛏️', code: 'mc', frame: 'games/blockcraft.html', color: 'linear-gradient(135deg,#4d7c0f,#78350f)', players: 'Online worlds',
      desc: 'Build and mine together, or switch to Survival: craft tools and fight mobs at night. Worlds are saved.' },
    bloxverse: { name: 'Bloxverse', emoji: '🧱', code: 'rb', frame: 'games/bloxverse.html', color: 'linear-gradient(135deg,#0ea5e9,#16a34a)', players: 'Online servers',
      desc: 'A Roblox-style hub: earn coins for cosmetics, then play Command an Army, Grow a Garden, Tower Defense Simulator, Tower of Hell, an obby, a tycoon, tag and more.' },
    trivia: { name: 'Trivia Rush', emoji: '🧠', code: 'tr', frame: 'games/trivia.html', color: 'linear-gradient(135deg,#7c3aed,#db2777)', players: '2–12 players',
      desc: 'Party quiz: ten questions, faster right answers score more.' },
    odd: { name: 'Odd One Out', emoji: '🕵️', code: 'oo', frame: 'games/oddoneout.html', color: 'linear-gradient(135deg,#0f766e,#1e3a8a)', players: '3–10 players',
      desc: 'Everyone gets the same secret word except one. Give clues, then vote out the odd one.' },
    sketch: { name: 'Sketch & Guess', emoji: '🎨', code: 'sg', frame: 'games/sketch.html', color: 'linear-gradient(135deg,#e11d48,#f59e0b)', players: '2–10 players',
      desc: 'Take turns drawing a secret word while everyone races to guess it.' },
    majority: { name: 'Majority Rules', emoji: '🙋', code: 'mr', frame: 'games/majority.html', color: 'linear-gradient(135deg,#4338ca,#06b6d4)', players: '2–12 players',
      desc: 'No right answers, only popular ones: pick what most people will pick.' },
    lastStand: { name: 'Tower Defense: Last Stand', emoji: '🏰', code: 'td', frame: 'games/last-stand.html', color: 'linear-gradient(135deg,#1e3a8a,#0f766e)', players: 'Co-op servers',
      desc: '3D tower defense. Build together on a shared server; Join drops you on a random one.' },
    crop: { name: 'Bumper Crop', emoji: '🌱', code: 'bc', frame: 'games/bumper-crop.html', color: 'linear-gradient(135deg,#65a30d,#ca8a04)', players: '4 farmers per server',
      desc: 'Grow, harvest and sell crops next to other farmers. Join puts you on a random server.' },
    duel: { name: 'Duel Yard', emoji: '🤠', code: 'dy', frame: 'games/duel-yard.html', color: 'linear-gradient(135deg,#b45309,#7c2d12)', players: '1 v 1 online',
      desc: 'Quick-draw duels. Find a match, then out-shoot your opponent.' },
    space: { name: 'Space Shooter', emoji: '🚀', code: 'ss', frame: 'games/space-shooter.html', color: 'linear-gradient(135deg,#312e81,#0e7490)', players: 'Co-op up to 4',
      desc: 'Fly the campaign together: shared hull, fuel and score, everyone in their own ship.' },
    tanks: { name: 'Tank Arena', emoji: '🛡️', code: 'ta', frame: 'games/tank-arena.html', color: 'linear-gradient(135deg,#ea580c,#7f1d1d)', players: '2–4 online',
      desc: 'Aim with the mouse, click to shoot. Five rounds, upgrades when you get knocked out.' },
  };
  const IDEAS = ['A cat running a lemonade stand', 'A dragon at the dentist', 'Pizza delivery on the moon', 'A snowman on vacation', 'A robot learning to dance',
    'A shark playing video games', 'Grandma riding a skateboard', 'A haunted vending machine', 'Dinosaur birthday party', 'A wizard stuck in traffic',
    'A penguin chef', 'The world’s smallest elephant', 'A banana in a business suit', 'Aliens at a fast food drive-thru', 'A dog driving a bus',
    'A volcano erupting popcorn', 'A ghost taking a selfie', 'Superhero doing laundry', 'A frog king on a lily pad throne', 'A cactus giving hugs',
    'Pirates on a rubber duck', 'A tiny house on a giant turtle', 'An octopus playing drums', 'A cloud that rains candy', 'A knight fighting a vacuum cleaner',
    'A sloth winning a race', 'A treehouse in space', 'A monster under the bed who is scared', 'A snail with a rocket', 'Ice cream that melts upward'];
  const KIND_LABEL = { write: 'Write a prompt', draw: 'Draw it', describe: 'What is this?' };
  const COLORS = ['#111827', '#ffffff', '#9ca3af', '#ef4444', '#f97316', '#facc15', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#92400e'];

  let api = null, list = [], party = null, offset = 0, view = null, minimized = false;
  let task = null; // what I'm working on this round: { key, canvas tools / input }
  const $ = (sel, el = document) => el.querySelector(sel);

  // ---------------------------------------------------------------- the Games window
  let gamesOpen = null; // 'pick' | game id, while the window is open
  function openGames(game) {
    const wasOpen = !!gamesOpen;
    gamesOpen = game || 'pick';
    if (wasOpen) api.refreshModal(); else api.openModal(buildGames, true);
  }
  function buildGames() {
    if (String(gamesOpen).startsWith('tb:') && window.Tables) return Tables.view(gamesOpen.slice(3));
    if (gamesOpen === 'pick' || !GAMES[gamesOpen]) {
      return [api.modalHead('🕹️ Games'), h('p', { class: 'muted' }, 'Party games with servers: make one, or join someone else’s. More games are coming.'),
        h('div', { class: 'party-games' }, Object.entries(FRAME_GAMES).map(([id, g]) => h('button', { class: 'party-game-card', style: `--g:${g.color}`, onclick: () => { api.closeModal(); openFrame(id); } },
          h('span', { class: 'pg-emoji' }, g.emoji), h('b', {}, g.name), h('small', {}, g.desc), h('span', { class: 'pg-meta' }, `${g.players} · ${frame && frame.id === id ? 'open now' : 'Play'}`))),
        Object.entries(GAMES).map(([id, g]) => {
          const open = list.filter((p) => p.game === id && p.players.length);
          return h('button', { class: 'party-game-card', style: `--g:${g.color}`, onclick: () => { gamesOpen = id; api.refreshModal(); } },
            h('span', { class: 'pg-emoji' }, g.emoji), h('b', {}, g.name), h('small', {}, g.desc),
            h('span', { class: 'pg-meta' }, `${g.players} · ${open.length ? `${open.length} server${open.length === 1 ? '' : 's'} open` : 'no servers yet'}`));
        }),
        ),
        ...(window.Tables ? [h('h3', { class: 'games-section' }, '🎲 Classic games — tables'),
          h('p', { class: 'muted', style: 'margin-top:0' }, 'Every Request-a-game game, with tables to join: the next players in line play, everyone else watches. Snake, Light Cycles and Tetris seat up to 4.'),
          h('div', { class: 'party-games' }, Tables.cards())] : []),
      ];
    }
    const g = GAMES[gamesOpen], servers = list.filter((p) => p.game === gamesOpen && p.players.length);
    const name = h('input', { maxlength: 30, placeholder: `${api.me().name}’s server` });
    const max = h('select', {}, [2, 3, 4, 5, 6, 8, 10, 12].map((n) => h('option', { value: n, selected: n === 8 }, `${n} players`)));
    const time = h('select', {}, [[60, '1 min to draw'], [90, '1½ min to draw'], [120, '2 min to draw'], [180, '3 min to draw']].map(([v, l]) => h('option', { value: v, selected: v === 90 }, l)));
    return [
      h('div', { class: 'modal-head' }, h('button', { class: 'btn small ghost', onclick: () => { gamesOpen = 'pick'; api.refreshModal(); } }, '‹ Games'),
        h('h2', { style: 'flex:1' }, `${g.emoji} ${g.name} servers`), h('button', { class: 'close-x', onclick: api.closeModal }, 'X')),
      h('div', { class: 'server-list' }, servers.length ? servers.map((p) => {
        const full = p.players.length >= p.max, playing = p.state !== 'lobby', mine = party && party.id === p.id;
        return h('div', { class: 'server-row' + (mine ? ' mine' : '') },
          h('div', { class: 'grow' }, h('b', {}, p.name), h('small', { class: 'muted' }, ` hosted by ${api.nameOf(p.host)}`),
            h('div', { class: 'server-people' }, p.players.slice(0, 8).map((u) => api.avatar(u)), p.players.length > 8 ? h('small', {}, `+${p.players.length - 8}`) : null)),
          h('span', { class: 'server-count' + (full ? ' full' : '') }, `${p.players.length}/${p.max}`),
          h('span', { class: 'server-state ' + (playing ? 'playing' : 'lobby') }, playing ? 'Playing' : 'In lobby'),
          mine ? h('button', { class: 'btn small primary', onclick: () => { api.closeModal(); show(); } }, 'Open')
            : h('button', { class: 'btn small primary', disabled: full || playing, onclick: () => { api.send({ t: 'partyJoin', id: p.id }); api.closeModal(); } }, playing ? 'In game' : full ? 'Full' : 'Join'));
      }) : h('div', { class: 'muted server-empty' }, 'No servers yet. Make the first one!')),
      h('div', { class: 'server-create' }, h('b', {}, 'Make a server'),
        h('div', { class: 'row', style: 'flex-wrap:wrap' }, name, max, time,
          h('button', { class: 'btn primary', onclick: () => {
            api.send({ t: 'partyCreate', game: gamesOpen, name: name.value.trim(), max: +max.value, drawTime: +time.value });
            api.closeModal();
          } }, '＋ Create server'))),
    ];
  }

  // ---------------------------------------------------------------- full-window games in a frame
  let frame = null; // { id, el, pill, iframe, detach, min }
  function openFrame(id) {
    const g = FRAME_GAMES[id];
    if (!g) return;
    if (frame && frame.id === id) { frame.min = false; syncFrame(); return; }
    closeFrame();
    const iframe = h('iframe', { class: 'frame-game', src: g.frame, title: g.name, allow: 'autoplay; fullscreen; pointer-lock; clipboard-write' });
    const el = h('section', { id: 'frameView', class: 'frame-view' },
      h('header', { class: 'frame-head' }, h('span', { class: 'party-title' }, `${g.emoji} ${g.name}`), h('span', { class: 'grow' }),
        window.GameDock ? window.GameDock.soundButton() : '',
        h('button', { class: 'btn small', title: 'Back to the chat; the game keeps running', onclick: () => { frame.min = true; syncFrame(); } }, '▁ Chat'),
        h('button', { class: 'btn small danger', onclick: () => api.confirm(`Close ${g.name}?`, 'Close', closeFrame) }, '✕ Close')),
      iframe);
    const pill = h('button', { class: 'party-pill frame-pill hidden', onclick: () => { frame.min = false; syncFrame(); } }, `${g.emoji} Back to ${g.name}`);
    document.body.append(el, pill);
    frame = { id, el, pill, iframe, min: false, detach: window.GameNet ? window.GameNet.attach(iframe, id, g.code) : () => {} };
    syncFrame();
    setTimeout(() => iframe.focus(), 300);
  }
  function syncFrame() {
    if (!frame) return;
    frame.el.classList.toggle('hidden', frame.min);
    frame.pill.classList.toggle('hidden', !frame.min);
    if (!frame.min) setTimeout(() => frame && frame.iframe.focus(), 50);
  }
  function closeFrame() {
    if (!frame) return;
    const f = frame;
    frame = null;
    try { f.detach(); } catch {}
    f.iframe.src = 'about:blank';
    f.el.remove(); f.pill.remove();
  }

  // ---------------------------------------------------------------- the party screen
  function root() {
    let el = $('#partyView');
    if (!el) {
      el = h('section', { id: 'partyView', class: 'party-view hidden' });
      document.body.append(el);
      const pill = h('button', { id: 'partyPill', class: 'party-pill hidden', onclick: () => { minimized = false; render(); } });
      document.body.append(pill);
    }
    return el;
  }
  function show() { minimized = false; render(); }
  const now = () => Date.now() + offset;
  const secsLeft = () => Math.max(0, Math.ceil((party.roundEnds - now()) / 1000));
  const isHost = () => party && party.host === api.me().username;

  function render() {
    const el = root(), pill = $('#partyPill');
    if (!party) { el.classList.add('hidden'); pill.classList.add('hidden'); el.replaceChildren(); task = null; view = null; return; }
    el.classList.toggle('hidden', minimized);
    pill.classList.toggle('hidden', !minimized);
    pill.textContent = `${GAMES[party.game].emoji} Back to ${GAMES[party.game].name}` + (party.state === 'playing' ? ` · ${secsLeft()}s` : '');
    if (minimized) return;
    // keep the drawing (or typing) in progress when updates arrive during the same round
    const key = `${party.id}:${party.state}:${party.round}:${party.mineDone ? 1 : 0}:${party.state === 'reveal' ? JSON.stringify(party.reveal) : ''}`;
    if (view === key && party.state === 'playing') { updateLive(); return; }
    view = key;
    const g = GAMES[party.game];
    el.replaceChildren(
      h('header', { class: 'party-head' },
        h('span', { class: 'party-title' }, `${g.emoji} ${g.name}`), h('span', { class: 'muted party-server' }, party.name),
        h('span', { class: 'party-people' }, party.players.map((u) => h('span', { class: 'party-person' + (u === party.host ? ' host' : ''), title: api.nameOf(u) + (u === party.host ? ' (host)' : '') }, api.avatar(u)))),
        h('button', { class: 'btn small', title: 'Go back to the chat; the game keeps going', onclick: () => { minimized = true; render(); } }, '▁ Chat'),
        h('button', { class: 'btn small danger', onclick: () => api.confirm('Leave this server?', 'Leave', () => api.send({ t: 'partyLeave' })) }, 'Leave')),
      h('div', { class: 'party-body' }, party.state === 'lobby' ? lobbyView() : party.state === 'playing' ? playView() : albumView()));
    updateLive();
  }

  function lobbyView() {
    const enough = party.players.length >= 2;
    return h('div', { class: 'party-lobby' },
      h('h2', {}, 'Waiting room'),
      h('p', { class: 'muted' }, `Up to ${party.max} players · ${Math.round(party.drawTime / 60 * 10) / 10} min to draw each round`),
      h('div', { class: 'lobby-people' }, party.players.map((u) => h('div', { class: 'lobby-person' }, api.avatar(u, true), h('b', {}, api.nameOf(u)), u === party.host ? h('small', {}, '👑 Host') : null)),
        Array.from({ length: Math.max(0, Math.min(3, party.max - party.players.length)) }, () => h('div', { class: 'lobby-person empty' }, h('div', { class: 'avatar big' }, '?'), h('small', { class: 'muted' }, 'Open seat')))),
      h('div', { class: 'how-to' }, h('b', {}, 'How to play'),
        h('ol', {}, h('li', {}, 'Everyone writes a silly prompt.'), h('li', {}, 'You get someone else’s prompt: draw it.'),
          h('li', {}, 'You get someone else’s drawing: describe it.'), h('li', {}, 'Repeat until every paper has been round, then laugh at the albums.'))),
      h('div', { class: 'row', style: 'justify-content:center;flex-wrap:wrap' },
        h('button', { class: 'btn', onclick: () => api.shareInvite(`🎨 Come play **Draw Phone** in “${party.name}”! Open 🕹️ Games → Draw Phone and join.`) }, '📣 Invite from chat'),
        isHost() ? h('button', { class: 'btn primary', disabled: !enough, onclick: () => api.send({ t: 'partyStart' }) }, enough ? '▶ Start game' : 'Need 2+ players')
          : h('span', { class: 'muted' }, `Waiting for ${api.nameOf(party.host)} to start…`)));
  }

  // ---------------------------------------------------------------- playing a round
  function playView() {
    const kind = party.kind, step = `Round ${party.round + 1} of ${party.steps}`;
    const timer = h('div', { class: 'party-timer' }, h('div', { class: 'bar' }), h('span', {}));
    const doneBox = h('div', { class: 'done-people' });
    if (!party.order.includes(api.me().username)) {
      task = null;
      return h('div', { class: 'party-round' }, h('h2', {}, 'Watching'), h('p', { class: 'muted' }, 'You joined after this game started. You’ll be in the next one!'), doneBox, timer);
    }
    if (party.mineDone) {
      task = null;
      return h('div', { class: 'party-round waiting' }, h('div', { class: 'round-label' }, step), h('h2', {}, '✅ Done!'), h('p', { class: 'muted' }, 'Waiting for everyone else…'), doneBox, timer);
    }
    const prompt = party.task;
    let work;
    if (kind === 'draw') {
      const pad = drawPad();
      task = { kind, pad, sent: false };
      work = [h('div', { class: 'task-card' }, h('small', {}, 'Draw this:'), h('b', {}, prompt && prompt.prompt ? prompt.prompt : '(they didn’t write anything — draw anything!)')),
        pad.el, h('button', { class: 'btn primary big-btn', onclick: () => submit() }, '✔ Done')];
    } else {
      const input = h('input', { class: 'task-input', maxlength: 120, placeholder: kind === 'write' ? 'e.g. A cat running a lemonade stand' : 'Describe what you see…',
        onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } } });
      task = { kind, input, sent: false };
      setTimeout(() => input.focus(), 30);
      work = [
        kind === 'describe' ? h('div', { class: 'task-card' }, h('small', {}, 'What is this drawing?'),
          prompt && prompt.image ? h('img', { class: 'task-img', src: prompt.image, alt: 'The drawing you were handed' }) : h('div', { class: 'muted no-drawing' }, '(they didn’t draw anything — make something up!)')) : null,
        h('div', { class: 'row task-row' }, input,
          kind === 'write' ? h('button', { class: 'btn', title: 'Give me an idea', onclick: () => { input.value = IDEAS[Math.floor(Math.random() * IDEAS.length)]; input.focus(); } }, '🎲 Idea') : null,
          h('button', { class: 'btn primary', onclick: () => submit() }, '✔ Done'))];
    }
    return h('div', { class: 'party-round' }, h('div', { class: 'round-label' }, step), h('h2', {}, KIND_LABEL[kind]), timer, ...work, doneBox);
  }
  async function submit() {
    if (!task || task.sent || !party || party.state !== 'playing') return;
    task.sent = true;
    const round = party.round;
    if (task.kind === 'draw') {
      const btn = $('#partyView .big-btn');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      try {
        const blob = await new Promise((res) => task.pad.canvas.toBlob(res, 'image/png'));
        const meta = await api.uploadFile(new File([blob], 'drawing.png', { type: 'image/png' }));
        api.send({ t: 'partySubmit', round, image: meta });
      } catch (e) {
        api.toast(e.message || 'Your drawing didn’t send.', 'err');
        api.send({ t: 'partySubmit', round, image: null });
      }
    } else api.send({ t: 'partySubmit', round, text: task.input.value.trim() });
  }
  function updateLive() {
    if (!party || party.state !== 'playing') return;
    const el = root(), left = secsLeft(), total = party.kind === 'draw' ? party.drawTime : 45;
    const t = $('.party-timer', el);
    if (t) {
      $('.bar', t).style.width = `${Math.max(0, Math.min(100, (left / total) * 100))}%`;
      $('span', t).textContent = `${left}s`;
      t.classList.toggle('low', left <= 10);
    }
    const d = $('.done-people', el);
    if (d) d.replaceChildren(h('small', { class: 'muted' }, `${(party.done || []).length}/${party.order.length} done`),
      ...party.order.map((u) => h('span', { class: 'done-person' + ((party.done || []).includes(u) ? ' yes' : ''), title: api.nameOf(u) }, api.avatar(u))));
    // time's up: send what you have
    if (task && !task.sent && left <= 1) submit();
  }
  setInterval(() => { if (party && party.state === 'playing') { updateLive(); const pill = $('#partyPill'); if (pill && minimized) pill.textContent = `${GAMES[party.game].emoji} Back to ${GAMES[party.game].name} · ${secsLeft()}s`; } }, 250);

  // ---------------------------------------------------------------- the drawing pad
  function drawPad() {
    const W = 800, H = 500;
    const canvas = h('canvas', { width: W, height: H, class: 'draw-canvas' });
    const g = canvas.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    g.lineCap = 'round'; g.lineJoin = 'round';
    let color = '#111827', size = 6, tool = 'pen', drawing = false, lx = 0, ly = 0;
    const undo = [];
    const snap = () => { undo.push(g.getImageData(0, 0, W, H)); if (undo.length > 25) undo.shift(); };
    const pos = (e) => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]; };
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const [x, y] = pos(e);
      snap();
      if (tool === 'fill') { fill(Math.floor(x), Math.floor(y)); return; }
      drawing = true; lx = x; ly = y;
      g.strokeStyle = tool === 'eraser' ? '#ffffff' : color; g.lineWidth = tool === 'eraser' ? size * 3 : size;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.01, y); g.stroke();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const pts = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const p of pts.length ? pts : [e]) {
        const [x, y] = pos(p);
        g.beginPath(); g.moveTo(lx, ly); g.lineTo(x, y); g.stroke();
        lx = x; ly = y;
      }
    });
    const stop = () => { drawing = false; };
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);
    function fill(x, y) {
      const img = g.getImageData(0, 0, W, H), d = img.data, i0 = (y * W + x) * 4;
      const target = [d[i0], d[i0 + 1], d[i0 + 2]], n = parseInt(color.slice(1), 16), rep = [n >> 16, (n >> 8) & 255, n & 255];
      const near = (i) => Math.abs(d[i] - target[0]) + Math.abs(d[i + 1] - target[1]) + Math.abs(d[i + 2] - target[2]) < 60;
      if (Math.abs(target[0] - rep[0]) + Math.abs(target[1] - rep[1]) + Math.abs(target[2] - rep[2]) < 8) return;
      const stack = [[x, y]], seen = new Uint8Array(W * H);
      while (stack.length) {
        const [cx, cy] = stack.pop();
        if (cx < 0 || cy < 0 || cx >= W || cy >= H) continue;
        const k = cy * W + cx;
        if (seen[k]) continue;
        seen[k] = 1;
        const i = k * 4;
        if (!near(i)) continue;
        d[i] = rep[0]; d[i + 1] = rep[1]; d[i + 2] = rep[2]; d[i + 3] = 255;
        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
      }
      g.putImageData(img, 0, 0);
    }
    const swatches = h('div', { class: 'draw-colors' }, COLORS.map((c) => h('button', { class: 'draw-swatch' + (c === color ? ' sel' : ''), style: `background:${c}`, title: c, onclick: (e) => {
      color = c; if (tool === 'eraser') setTool('pen');
      swatches.querySelectorAll('.draw-swatch').forEach((b) => b.classList.toggle('sel', b === e.currentTarget));
    } })), h('input', { type: 'color', class: 'draw-custom', title: 'Any color', value: '#ff6600', oninput: (e) => { color = e.target.value; swatches.querySelectorAll('.draw-swatch').forEach((b) => b.classList.remove('sel')); if (tool === 'eraser') setTool('pen'); } }));
    const tools = {};
    const setTool = (t) => { tool = t; Object.entries(tools).forEach(([k, b]) => b.classList.toggle('sel', k === t)); canvas.dataset.tool = t; };
    for (const [k, label, tip] of [['pen', '✏️', 'Pen'], ['fill', '🪣', 'Fill'], ['eraser', '🧽', 'Eraser']]) tools[k] = h('button', { class: 'btn small draw-tool', title: tip, onclick: () => setTool(k) }, label, ' ', tip);
    const sizes = h('div', { class: 'draw-sizes' }, [3, 6, 12, 24].map((s) => h('button', { class: 'draw-size' + (s === size ? ' sel' : ''), title: `Brush ${s}`, onclick: (e) => {
      size = s; sizes.querySelectorAll('.draw-size').forEach((b) => b.classList.toggle('sel', b === e.currentTarget));
    } }, h('i', { style: `width:${Math.min(22, s)}px;height:${Math.min(22, s)}px` }))));
    setTool('pen');
    const el = h('div', { class: 'draw-pad' },
      h('div', { class: 'draw-tools' }, swatches, sizes, tools.pen, tools.fill, tools.eraser,
        h('button', { class: 'btn small', title: 'Undo (Ctrl+Z)', onclick: () => { const u = undo.pop(); if (u) g.putImageData(u, 0, 0); } }, '↶ Undo'),
        h('button', { class: 'btn small', onclick: () => { snap(); g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); } }, '🗑 Clear')),
      canvas);
    el.undo = () => { const u = undo.pop(); if (u) g.putImageData(u, 0, 0); };
    return { el, canvas };
  }
  addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && task && task.pad && !minimized) { e.preventDefault(); task.pad.el.undo(); }
  });

  // ---------------------------------------------------------------- albums
  function entryEl(en, i) {
    const who = h('div', { class: 'album-who' }, api.avatar(en.by), h('b', {}, api.nameOf(en.by)),
      h('small', { class: 'muted' }, i === 0 ? 'wrote' : en.kind === 'draw' ? 'drew' : 'thought it was'));
    if (en.kind === 'draw') return h('div', { class: 'album-entry draw' }, who, en.image ? h('img', { src: en.image, alt: `Drawing by ${api.nameOf(en.by)}`, loading: 'lazy' }) : h('div', { class: 'no-drawing muted' }, '(no drawing)'));
    return h('div', { class: 'album-entry text' + (i === 0 ? ' first' : '') }, who, h('div', { class: 'album-text' }, en.text || h('span', { class: 'muted' }, '(nothing)')));
  }
  function albumView() {
    const chains = party.chains || [];
    if (party.state === 'reveal') {
      const r = party.reveal || { chain: 0, step: 0 }, chain = chains[r.chain] || [];
      return h('div', { class: 'party-album' },
        h('div', { class: 'round-label' }, `Album ${r.chain + 1} of ${chains.length}`),
        h('h2', {}, `${api.nameOf(chain[0] && chain[0].by)}’s album`),
        h('div', { class: 'album' }, chain.slice(0, r.step + 1).map(entryEl)),
        isHost() ? h('div', { class: 'row', style: 'justify-content:center' },
          h('button', { class: 'btn', onclick: () => api.send({ t: 'partyNext', all: true }) }, 'Show all albums'),
          h('button', { class: 'btn primary', onclick: () => api.send({ t: 'partyNext' }) }, r.step + 1 < party.steps ? 'Next ▶' : r.chain + 1 < chains.length ? 'Next album ▶' : 'Finish ▶'))
          : h('p', { class: 'muted', style: 'text-align:center' }, `${api.nameOf(party.host)} is showing the albums…`));
    }
    return h('div', { class: 'party-album' },
      h('h2', {}, '🎉 All the albums'),
      chains.map((chain) => h('div', { class: 'album-block' }, h('b', {}, `${api.nameOf(chain[0] && chain[0].by)}’s album`), h('div', { class: 'album row-album' }, chain.map(entryEl)))),
      h('div', { class: 'row', style: 'justify-content:center' },
        isHost() ? h('button', { class: 'btn primary', onclick: () => api.send({ t: 'partyAgain' }) }, '🔁 Play again') : h('span', { class: 'muted' }, `${api.nameOf(party.host)} can start another game.`),
        h('button', { class: 'btn', onclick: () => api.send({ t: 'partyLeave' }) }, 'Leave server')));
  }

  window.PartyUI = {
    GAMES,
    FRAME_GAMES,
    openFrame,
    closeFrame,
    frameOpen: () => !!(frame && !frame.min),
    init(a) { api = a; if (window.Tables) Tables.init(a); },
    openGames,
    openOn: () => gamesOpen,
    buildGames: () => buildGames(),
    isOpen: () => !!gamesOpen,
    closed() { gamesOpen = null; },
    list(l) {
      list = Array.isArray(l) ? l : [];
      if (gamesOpen) api.refreshModal();
    },
    state(p) {
      const was = party;
      party = p;
      if (p) offset = (p.serverNow || Date.now()) - Date.now();
      if (p && !was) minimized = false;
      if (!p && was) api.toast(`You left ${GAMES[was.game].name}`);
      render();
    },
    where(u) { const p = list.find((x) => x.players.includes(u)); return p ? GAMES[p.game] && GAMES[p.game].name : null; },
    openCount: () => list.filter((p) => p.players.length).length,
  };
})();
