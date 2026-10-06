// Chat client: sign in, rooms, presence, settings, and game challenges.
(() => {
  const $ = (sel, el = document) => el.querySelector(sel);
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
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
  };

  const S = {
    ws: null, me: null, users: {}, rooms: {}, games: {}, current: store.get('chatRoom') || 'global',
    unread: {}, mentions: {}, typing: {}, revealed: new Set(), newBelow: 0, helloAt: 0, token: store.get('chatToken'), signedOut: false, retry: 0, authMode: 'login', queue: [],
  };
  // In the claude.ai artifact build, a ChatTransport replaces the WebSocket server.
  const ARTIFACT = typeof window.ChatTransport === 'function';
  const CALLS = !ARTIFACT && typeof window.Calls === 'object'; // claude.ai pages can't use the camera, mic or WebRTC
  const PRESENCE_LABEL = { online: 'Online', offline: 'Offline', idle: 'Do not disturb' };
  const AVATARS = ['#22c55e', '#111111', '#ef4444', '#facc15', '#d946ef'];
  const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👀'];
  const EMOJIS = ('😀 😁 😂 🤣 😊 😍 😘 😎 🤩 🥳 😅 😉 🙂 🙃 😐 🤔 🤨 🙄 😴 😮 😢 😭 😡 🤯 😱 🥶 🤡 💀 👻 🤖 '
    + '👍 👎 👏 🙌 🙏 💪 👀 👋 🤝 ✌️ 🤞 👌 ❤️ 💔 💯 🔥 ✨ ⭐ 🎉 🎮 🕹️ 🏆 🥇 🎯 ⚽ 🏀 🍕 🍔 🍿 ☕ 🐍 🐱 🐶 🌈 ☀️ 🌙 ⚡ 💤 ✅ ❌').split(' ');
  const PHOTO_URL = /^\/(files|_blob)\/[A-Za-z0-9_-]+$/;
  // Per-person settings kept in this browser (blocked people, muted chats, drafts, sounds…).
  const prefKey = (k) => 'chat:' + k + ':' + (S.me ? S.me.username : '');
  function pref(k, d) { try { const v = JSON.parse(store.get(prefKey(k))); return v === null || v === undefined ? d : v; } catch { return d; } }
  const setPref = (k, v) => store.set(prefKey(k), v === null ? null : JSON.stringify(v));
  const inSet = (k, v) => pref(k, []).includes(v);
  function toggleIn(k, v) { const l = pref(k, []); setPref(k, l.includes(v) ? l.filter((x) => x !== v) : l.concat(v)); return !l.includes(v); }
  const isBlocked = (u) => !!u && u !== (S.me && S.me.username) && inSet('blocked', u);
  const isMuted = (id) => inSet('muted', id);
  const isFav = (id) => inSet('favs', id);
  const EMOJI_CODES = {
    smile: '😄', grin: '😁', joy: '😂', rofl: '🤣', laugh: '😆', wink: '😉', blush: '😊', cool: '😎', sunglasses: '😎', heart_eyes: '😍', kiss: '😘',
    thinking: '🤔', neutral: '😐', eyeroll: '🙄', sleepy: '😴', cry: '😢', sob: '😭', angry: '😡', rage: '🤬', scream: '😱', mindblown: '🤯', cold: '🥶',
    party: '🥳', clown: '🤡', skull: '💀', ghost: '👻', robot: '🤖', alien: '👽', poop: '💩', shrug: '🤷', facepalm: '🤦',
    thumbsup: '👍', '+1': '👍', thumbsdown: '👎', '-1': '👎', clap: '👏', wave: '👋', pray: '🙏', muscle: '💪', flex: '💪', ok: '👌', v: '✌️', handshake: '🤝', gg: '🤝', eyes: '👀', point_up: '☝️',
    heart: '❤️', broken_heart: '💔', fire: '🔥', '100': '💯', sparkles: '✨', star: '⭐', boom: '💥', zap: '⚡', tada: '🎉', confetti: '🎊', rocket: '🚀',
    check: '✅', x: '❌', warning: '⚠️', question: '❓', exclamation: '❗', game: '🎮', joystick: '🕹️', trophy: '🏆', medal: '🥇', crown: '👑', dart: '🎯', dice: '🎲',
    pizza: '🍕', burger: '🍔', fries: '🍟', cake: '🎂', cookie: '🍪', coffee: '☕', popcorn: '🍿', money: '💰', gift: '🎁', music: '🎵',
    snake: '🐍', dog: '🐶', cat: '🐱', frog: '🐸', unicorn: '🦄', sun: '☀️', moon: '🌙', rainbow: '🌈', snow: '❄️', zzz: '💤',
  };
  const swapShortcodes = (t) => t.split(/(`[^`]*`)/).map((part, i) => (i % 2 ? part : part.replace(/:([a-z0-9_+-]{1,20}):/gi, (m, k) => EMOJI_CODES[k.toLowerCase()] || m))).join('');

  // ---------------------------------------------------------------- connection
  let transport = null;
  function send(obj) {
    if (transport) return transport.send(obj);
    if (S.ws && S.ws.readyState === 1) S.ws.send(JSON.stringify(obj));
    else S.queue.push(obj);
  }
  function connect() {
    if (ARTIFACT) {
      setTimeout(() => { if (transport) $('#fileInput').accept = transport.fileTypes; });
      transport = window.ChatTransport((m) => (on[m.t] || (() => {}))(m), { signedIn: (uid) => store.get('chatSignedIn:' + uid) === '1' });
      return;
    }
    const ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
    S.ws = ws;
    ws.onopen = () => {
      S.retry = 0;
      $('#banner').classList.add('hidden');
      if (S.token) ws.send(JSON.stringify({ t: 'resume', token: S.token }));
      else showAuth();
      const q = S.queue.splice(0);
      q.forEach((m) => ws.send(JSON.stringify(m)));
    };
    ws.onmessage = (e) => {
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      (on[m.t] || (() => {}))(m);
    };
    ws.onclose = () => {
      if (S.signedOut) { S.signedOut = false; connect(); return; }
      if (S.me) $('#banner').classList.remove('hidden');
      S.retry = Math.min(S.retry + 1, 6);
      setTimeout(connect, 500 * S.retry);
    };
  }

  const on = {
    hello(m) {
      if (!ARTIFACT) {
        S.token = m.token;
        store.set('chatToken', m.token);
      }
      S.me = m.me;
      S.helloAt = Date.now();
      S.games = m.games;
      if (CALLS) Calls.configure(m.calls);
      S.users = {};
      m.users.forEach((u) => { S.users[u.username] = u; });
      S.rooms = {};
      m.rooms.forEach((r) => { S.rooms[r.id] = r; });
      if (!S.rooms[S.current]) S.current = 'global';
      applyTheme();
      renderAll();
      if (ARTIFACT && store.get('chatSignedIn:' + S.me.username) !== '1') { showSignIn(false); return; }
      $('#auth').classList.add('hidden');
      $('#app').classList.remove('hidden');
    },
    authFailed() {
      S.token = null;
      store.set('chatToken', null);
      showAuth();
    },
    user(m) {
      const before = S.users[m.user.username];
      // a friend just came online
      if (S.me && before && before.presence === 'offline' && m.user.presence !== 'offline' && (S.me.friends || []).includes(m.user.username)
        && Date.now() - S.helloAt > 5000 && pref('friendAlerts', true) && !isBlocked(m.user.username)) {
        const t = toast(`🟢 ${m.user.name} is online`, 'friend-toast', 5000);
        t.style.cursor = 'pointer';
        t.addEventListener('click', () => { t.remove(); showProfile(m.user.username); });
      }
      S.users[m.user.username] = m.user;
      if (S.me && m.user.username === S.me.username) Object.assign(S.me, m.user);
      renderPeople();
      renderRooms();
      renderHeader();
      refreshOpenModal();
    },
    me(m) {
      S.me = m.me;
      S.users[m.me.username] = Object.assign(S.users[m.me.username] || {}, m.me);
      applyTheme();
      renderPeople();
      refreshOpenModal();
    },
    room(m) {
      const old = S.rooms[m.room.id];
      const lastId = (r) => (r && r.messages.length ? r.messages[r.messages.length - 1].id : null);
      S.rooms[m.room.id] = m.room;
      if (old && old.messages.length > m.room.messages.length) m.room.messages = old.messages;
      renderRooms();
      if (m.room.id === S.current) {
        renderHeader();
        if (lastId(old) !== lastId(m.room)) renderMessages();
      }
    },
    roomRemoved(m) {
      delete S.rooms[m.id];
      if (S.current === m.id) selectRoom('global');
      else renderRooms();
    },
    openRoom(m) {
      if (S.rooms[m.id]) selectRoom(m.id);
      closeModal();
    },
    msg(m) {
      const room = S.rooms[m.room];
      if (!room) return;
      room.messages.push(m.msg);
      if (S.typing[m.room]) delete S.typing[m.room][m.msg.from];
      const fromOther = m.msg.from && m.msg.from !== S.me.username;
      if (m.room === S.current) {
        const box = $('#messages'), below = box.scrollHeight - box.scrollTop - box.clientHeight > 300;
        appendMessage(m.msg, room.messages[room.messages.length - 2]);
        renderTyping();
        if (below && fromOther) { S.newBelow = (S.newBelow || 0) + 1; updateJump(); }
      }
      // You hear about it when you're on another tab or in another chat. An @mention always
      // pings (even in a muted chat); a direct message pings unless that chat is muted.
      const away = m.room !== S.current || document.hidden;
      if (away && fromOther && !isBlocked(m.msg.from)) {
        S.unread[m.room] = (S.unread[m.room] || 0) + 1;
        const mentioned = mentionsMe(m.msg.text);
        if (mentioned) S.mentions[m.room] = true;
        if (mentioned || (room.dm && !isMuted(m.room))) ping();
        if (mentioned && m.room !== S.current) {
          const t = toast(`${nameOf(m.msg.from)} mentioned you in ${roomLabel(room)} — click to see`, null, 7000);
          t.style.cursor = 'pointer';
          t.addEventListener('click', () => { t.remove(); selectRoom(m.room); jumpTo(m.msg.id); });
        }
      }
      renderRooms();
      updateTitle();
    },
    msgEdit(m) {
      const room = S.rooms[m.room];
      const i = room ? room.messages.findIndex((x) => x.id === m.msg.id) : -1;
      if (i < 0) return;
      room.messages[i] = m.msg;
      if (m.msg.deleted && ((editing && editing.id === m.msg.id) || (replyTo && replyTo.id === m.msg.id))) cancelCompose();
      else if (editing && editing.id === m.msg.id) editing = m.msg;
      if (m.room !== S.current) return;
      const old = $(`#messages [data-id="${CSS.escape(m.msg.id)}"]`);
      if (old) old.replaceWith(msgEl(m.msg, room.messages[i - 1]));
      document.querySelectorAll(`#messages .reply-quote[data-for="${CSS.escape(m.msg.id)}"] span`).forEach((s) => { s.textContent = snippet(m.msg); });
      refreshOpenModal(); // e.g. the pinned list
    },
    typing(m) {
      if (isBlocked(m.from)) return;
      (S.typing[m.room] = S.typing[m.room] || {})[m.from] = Date.now();
      if (m.room === S.current) renderTyping();
    },
    error(m) {
      if (!S.me) { $('#authError').textContent = m.text; return; }
      toast(m.text, 'err');
    },
    notice(m) { toast(m.text); },
    fatal(m) {
      $('#app').classList.add('hidden');
      $('#auth').classList.remove('hidden');
      $('#authForm').replaceChildren(h('h2', {}, m.title || 'Can’t connect'), h('p', { class: 'muted' }, m.text));
    },
    invite(m) {
      if (isBlocked(m.invite.from)) { send({ t: 'gameRespond', id: m.invite.id, accept: false }); return; } // blocked: turned down quietly
      showInvite(m.invite);
    },
    gameStart(m) { closeModal(); GameDock.start(m); renderPeople(); },
    gameState(m) { GameDock.state(m); },
    gameEvent(m) { GameDock.event(m); },
    gameOver(m) { GameDock.over(m); },
    gameError(m) { toast(m.text, 'err'); },
    callIncoming(m) { Calls.event(m); },
    callRinging(m) { Calls.event(m); },
    callAccepted(m) { Calls.event(m); },
    callSignal(m) { Calls.event(m); },
    callEnded(m) { Calls.event(m); },
  };

  // ---------------------------------------------------------------- auth
  function showAuth() {
    S.me = null;
    $('#app').classList.add('hidden');
    $('#auth').classList.remove('hidden');
    document.body.dataset.theme = 'dark';
    document.body.style.removeProperty('--bg');
  }
  document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => {
    S.authMode = tab.dataset.mode;
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    $('#authNameRow').classList.toggle('hidden', S.authMode !== 'register');
    $('#authSubmit').textContent = S.authMode === 'register' ? 'Create account' : 'Sign in';
    $('#authPass').autocomplete = S.authMode === 'register' ? 'new-password' : 'current-password';
    $('#authError').textContent = '';
  }));
  $('#authForm').addEventListener('submit', (e) => {
    e.preventDefault();
    $('#authError').textContent = '';
    send({ t: S.authMode, username: $('#authUser').value.trim(), password: $('#authPass').value, name: $('#authName').value.trim() });
  });
  // On claude.ai your identity is your Claude account. Signing in here joins the chat (you show as
  // online); signing out leaves it (you show as offline and can't be challenged) on this browser.
  const noDot = (el) => { const d = el.querySelector('.dot'); if (d) d.remove(); return el; };
  function showSignIn(afterSignOut) {
    $('#app').classList.add('hidden');
    $('#auth').classList.remove('hidden');
    const me = S.me;
    const name = h('input', { id: 'signInName', maxlength: 30, value: me.name, placeholder: 'e.g. Bob', autocomplete: 'nickname' });
    const err = h('div', { class: 'error' });
    const go = () => {
      const n = name.value.trim();
      if (!n) { err.textContent = 'Pick a name people will see.'; name.focus(); return; }
      if (n !== me.name) send({ t: 'profile', data: { name: n } });
      store.set('chatSignedIn:' + me.username, '1');
      send({ t: 'login' });
      $('#auth').classList.add('hidden');
      $('#app').classList.remove('hidden');
      applyTheme();
      renderAll();
    };
    name.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    $('#authForm').replaceChildren(
      h('h2', {}, afterSignOut ? 'You’re signed out' : 'Welcome 👋'),
      h('p', { class: 'muted' }, afterSignOut ? 'People see you as offline and can’t challenge you. Sign in to jump back in.' : 'Sign in to chat with whoever’s online and play games.'),
      h('div', { class: 'me-card', style: 'margin:0;cursor:default' }, noDot(avatar(me.username)),
        h('div', { class: 'grow' }, h('small', {}, 'Claude account'), h('b', {}, me.handle || me.name))),
      h('label', { for: 'signInName' }, 'Display name ', h('span', { class: 'muted' }, '(what people see)'), name),
      err,
      h('button', { class: 'btn primary block', onclick: go }, afterSignOut ? 'Sign back in' : 'Sign in'));
  }
  function signOut() {
    if (CALLS) Calls.hangUp();
    if (ARTIFACT) {
      send({ t: 'logout' });
      store.set('chatSignedIn:' + S.me.username, null);
      GameDock.close();
      closeModal();
      showSignIn(true);
      return;
    }
    send({ t: 'logout', token: S.token });
    store.set('chatToken', null);
    S.token = null;
    S.signedOut = true;
    GameDock.close();
    closeModal();
    showAuth();
  }

  // ---------------------------------------------------------------- helpers
  const userOf = (u) => S.users[u] || { username: u, name: u, avatar: '#999', presence: 'offline', favorites: [], stats: { w: 0, l: 0, d: 0 } };
  const nameOf = (u) => userOf(u).name;
  const handleText = (u) => (ARTIFACT ? u.handle || '' : '@' + (u.handle || u.username));
  const onlineUsers = () => Object.values(S.users).filter((u) => u.presence !== 'offline');
  function avatar(u, big) {
    const x = userOf(u), photo = typeof x.photo === 'string' && PHOTO_URL.test(x.photo) ? x.photo : null;
    return h('div', { class: 'avatar' + (big ? ' big' : '') + (photo ? ' photo' : ''), title: x.name,
      style: photo ? `background-color:${x.avatar};background-image:url("${photo}")` : `background:${x.avatar}` },
    photo ? '' : (x.name || '?')[0].toUpperCase(), h('i', { class: 'dot ' + x.presence }));
  }
  // ---------------------------------------------------------------- mentions, links and sounds
  const escRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const AFTER_NAME = '(?![\\p{L}\\p{N}_])';
  function mentionsMe(text) {
    if (!text || !S.me || !S.me.name) return false;
    return new RegExp('@(' + escRe(S.me.name) + '|everyone|here)' + AFTER_NAME, 'iu').test(text);
  }
  // Message text, built as nodes (never as HTML): ```code blocks```, > quotes, then inline
  // `code`, ||spoilers||, **bold**, *italic* / _italic_, ~~strike~~, \escapes, links and @names.
  function richText(text) {
    const out = [], parts = text.split('```');
    parts.forEach((part, i) => {
      if (i % 2 === 1 && i < parts.length - 1) { out.push(h('pre', { class: 'md-code' }, part.replace(/^[a-z0-9+-]*\n/i, '').replace(/\n$/, ''))); return; }
      if (i % 2 === 1) part = '```' + part; // a fence that never closes is just text
      if (i > 0) part = part.replace(/^\n/, '');
      if (i < parts.length - 2) part = part.replace(/\n$/, '');
      let quote = null, prevQuote = false;
      part.split('\n').forEach((line, j) => {
        const q = /^>\s?(.*)$/.exec(line);
        if (q) {
          if (!quote) { quote = h('blockquote', { class: 'md-quote' }); out.push(quote); } else quote.append('\n');
          quote.append(...inlineText(q[1]));
          prevQuote = true;
          return;
        }
        quote = null;
        if (j > 0 && !prevQuote) out.push('\n');
        prevQuote = false;
        out.push(...inlineText(line));
      });
    });
    return out;
  }
  const INLINE = [
    { re: /\\([*_~`|\\>])/, make: (m) => [m[1]] },
    { re: /`([^`\n]+)`/, make: (m) => [h('code', { class: 'md-inline' }, m[1])] },
    { re: /\|\|(.+?)\|\|/, make: (m) => [spoilerEl(inlineText(m[1]))] },
    { re: /\*\*(.+?)\*\*/, make: (m) => [h('strong', {}, inlineText(m[1]))] },
    { re: /~~(.+?)~~/, make: (m) => [h('s', {}, inlineText(m[1]))] },
    { re: /(?<![\w*])\*(?!\s)([^*\n]+?)(?<!\s)\*(?![\w*])/, make: (m) => [h('em', {}, inlineText(m[1]))] },
    { re: /(?<![\w_])_(?!\s)([^_\n]+?)(?<!\s)_(?![\w_])/, make: (m) => [h('em', {}, inlineText(m[1]))] },
  ];
  function inlineText(text) {
    const out = [];
    let rest = text;
    while (rest) {
      let best = null;
      for (const rule of INLINE) {
        const m = rule.re.exec(rest);
        if (m && (!best || m.index < best.m.index)) best = { m, rule };
      }
      if (!best) { out.push(...linkText(rest)); break; }
      if (best.m.index) out.push(...linkText(rest.slice(0, best.m.index)));
      out.push(...best.rule.make(best.m));
      rest = rest.slice(best.m.index + best.m[0].length);
    }
    return out;
  }
  function spoilerEl(kids) {
    const el = h('span', { class: 'spoiler', title: 'Spoiler: click to show', onclick: (e) => { e.stopPropagation(); el.classList.add('shown'); } }, kids);
    return el;
  }
  // Plain text with clickable links and highlighted @names.
  function linkText(text) {
    const names = [...new Set(Object.values(S.users).map((u) => u.name).filter(Boolean).concat('everyone', 'here'))].sort((a, b) => b.length - a.length).map(escRe);
    const re = new RegExp('(https?:\\/\\/[^\\s<>"]+)' + (names.length ? '|@(' + names.join('|') + ')' + AFTER_NAME : ''), 'giu');
    const out = [];
    let last = 0, mt;
    while ((mt = re.exec(text))) {
      let whole = mt[0];
      if (mt[1]) whole = whole.replace(/[.,!?;:)\]}'"]+$/, '');
      if (mt.index > last) out.push(text.slice(last, mt.index));
      if (mt[1]) out.push(h('a', { href: whole, target: '_blank', rel: 'noopener noreferrer', onclick: (e) => e.stopPropagation() }, whole));
      else {
        const who = Object.values(S.users).find((u) => u.name && u.name.toLowerCase() === mt[2].toLowerCase());
        const all = /^(everyone|here)$/i.test(mt[2]) && !who;
        out.push(h('span', { class: 'mention' + (all || (who && who.username === S.me.username) ? ' you' : ''), onclick: who ? (e) => { e.stopPropagation(); showProfile(who.username); } : null }, '@' + mt[2]));
      }
      last = mt.index + whole.length;
      re.lastIndex = last;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }
  // Notification sounds, made on the fly: [frequency, start, length, wave, loudness]
  let actx = null;
  const SOUNDS = {
    ding: { label: 'Ding', notes: [[1318.5, 0, 0.9, 'sine', 1], [2637, 0, 0.45, 'sine', 0.35]] },
    chime: { label: 'Chime', notes: [[880, 0, 0.5, 'sine', 0.9], [1318.5, 0.13, 0.7, 'sine', 0.9]] },
    bell: { label: 'Bell', notes: [[660, 0, 1.6, 'sine', 0.8], [1320, 0, 1.1, 'sine', 0.4], [1980, 0, 0.7, 'sine', 0.25]] },
    pop: { label: 'Pop', notes: [[620, 0, 0.12, 'sine', 1, 220]] },
    blip: { label: 'Blip', notes: [[880, 0, 0.1, 'square', 0.35], [1320, 0.09, 0.14, 'square', 0.35]] },
  };
  const soundOn = () => soundKind() !== 'off';
  function soundKind() { if (store.get('chatSound') === '0') return 'off'; const k = pref('sound', 'ding'); return SOUNDS[k] || k === 'off' ? k : 'ding'; }
  function ping(force) {
    const kind = force || soundKind();
    if (kind === 'off' || !SOUNDS[kind]) return;
    const vol = Math.max(0, Math.min(1, +pref('volume', 0.7)));
    if (!vol) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume().catch(() => {});
      const now = actx.currentTime;
      for (const [f, at, len, wave, loud, to] of SOUNDS[kind].notes) {
        const t = now + at, o = actx.createOscillator(), g = actx.createGain();
        o.type = wave;
        o.frequency.setValueAtTime(f, t);
        if (to) o.frequency.exponentialRampToValueAtTime(to, t + len);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.16 * vol * loud), t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o.connect(g).connect(actx.destination);
        o.start(t);
        o.stop(t + len + 0.02);
      }
    } catch { /* no audio here */ }
  }
  // A small menu next to a button; closes on outside click or Escape.
  let pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  function popover(anchor, content, cls) {
    closePop();
    pop = h('div', { class: 'popover ' + (cls || ''), role: 'dialog', onclick: (e) => e.stopPropagation(), onmousedown: (e) => e.stopPropagation() }, content);
    document.body.append(pop);
    const r = anchor.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    const left = Math.max(8, Math.min(window.innerWidth - pw - 8, r.left + r.width / 2 - pw / 2));
    const top = r.top - ph - 8 > 8 ? r.top - ph - 8 : Math.min(window.innerHeight - ph - 8, r.bottom + 8);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    return pop;
  }
  document.addEventListener('mousedown', closePop);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && pop) { e.stopPropagation(); closePop(); } }, true);
  window.addEventListener('resize', closePop);
  function roomLabel(r) {
    if (r.dm) return nameOf(r.members.find((m) => m !== S.me.username) || S.me.username);
    return r.name;
  }
  function roomActive(r) {
    const ppl = r.public ? onlineUsers() : r.members.map(userOf).filter((u) => u.presence !== 'offline');
    return ppl.length;
  }
  const lastTs = (r) => (r.messages.length ? r.messages[r.messages.length - 1].ts : 0);
  function fmtTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  function fmtDay(ts) {
    const d = new Date(ts), today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const y = new Date(today - 864e5);
    if (d.toDateString() === y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  }
  function toast(text, kind, ms = 4000) {
    const el = h('div', { class: 'toast' + (kind ? ' ' + kind : '') }, text);
    $('#toasts').append(el);
    setTimeout(() => el.remove(), ms);
    return el;
  }
  function updateTitle() {
    const n = Object.entries(S.unread).reduce((a, [id, c]) => a + (isMuted(id) && !S.mentions[id] ? 0 : c), 0);
    document.title = (n ? `(${n}) ` : '') + 'Game Chat';
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && S.unread[S.current]) { delete S.unread[S.current]; delete S.mentions[S.current]; renderRooms(); updateTitle(); }
  });

  function systemDark() {
    const t = document.documentElement.dataset.theme;
    if (t === 'dark' || t === 'light') return t === 'dark';
    return matchMedia('(prefers-color-scheme: dark)').matches;
  }
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => S.me && applyTheme());
  new MutationObserver(() => S.me && applyTheme()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  function applyTheme() {
    const me = S.me, body = document.body;
    body.style.removeProperty('--bg');
    if (me.bg === 'auto') body.dataset.theme = systemDark() ? 'dark' : 'light';
    else if (me.bg === 'black') body.dataset.theme = 'dark';
    else if (me.bg === 'custom') {
      const c = me.bgCustom, n = parseInt(c.slice(1), 16);
      const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
      body.dataset.theme = lum < 0.5 ? 'dark' : 'light';
      body.style.setProperty('--bg', c);
    } else body.dataset.theme = 'light';
  }

  // ---------------------------------------------------------------- rendering
  function renderAll() {
    renderRooms();
    renderPeople();
    renderHeader();
    renderMessages();
  }
  function renderRooms() {
    if (!S.me) return;
    const list = $('#roomList');
    list.replaceChildren();
    for (const r of sortedRooms()) {
      const n = S.unread[r.id], muted = isMuted(r.id), fav = isFav(r.id);
      const other = r.dm && r.members.find((m) => m !== S.me.username);
      list.append(h('li', { class: (r.id === S.current ? 'active' : '') + (muted ? ' muted-room' : ''), onclick: () => selectRoom(r.id) },
        r.dm ? avatar(other || S.me.username) : h('span', { class: 'room-icon' }, r.id === 'global' ? '🌐' : r.public ? '#' : '🔒'),
        h('span', { class: 'grow' }, fav ? h('span', { class: 'fav-star', title: 'Favorite' }, '★ ') : null, roomLabel(r), ' ', r.dm ? null : h('small', {}, `${roomActive(r)} active`)),
        muted ? h('span', { class: 'mute-icon', title: 'Muted' }, '🔕') : null,
        S.mentions[r.id] ? h('span', { class: 'badge mention', title: 'You were mentioned' }, '@') : null,
        n ? h('span', { class: 'badge' + (muted ? ' quiet' : '') }, n) : null));
    }
  }
  // global first, then favorites, then the rest; newest activity first
  const sortedRooms = () => Object.values(S.rooms).sort((a, b) => (a.id === 'global' ? -1 : b.id === 'global' ? 1 : (isFav(b.id) - isFav(a.id)) || lastTs(b) - lastTs(a)));
  function personRow(u) {
    const x = userOf(u);
    return h('li', { onclick: () => showProfile(u) }, avatar(u),
      h('span', { class: 'grow' }, x.name, u === S.me.username ? h('small', {}, ' (you)') : null, ' ',
        x.inGame ? h('small', {}, `🎮 ${gameName(x.inGame)}`) : h('small', { title: x.custom || '' }, x.custom || PRESENCE_LABEL[x.presence]),
        isBlocked(u) ? h('small', { class: 'blocked-tag' }, ' blocked') : null));
  }
  function renderPeople() {
    if (!S.me) return;
    const online = onlineUsers().sort((a, b) => (a.username === S.me.username ? -1 : b.username === S.me.username ? 1 : a.name.localeCompare(b.name)));
    $('#onlineList').replaceChildren(...(online.length ? online.map((u) => personRow(u.username)) : [h('li', { class: 'empty' }, 'Nobody else is online')]));
    const friends = (S.me.friends || []).filter((f) => S.users[f]);
    $('#friendList').replaceChildren(...(friends.length ? friends.map(personRow) : [h('li', { class: 'empty' }, 'Click someone to add them as a friend')]));
    const n = online.length;
    $('#onlineCount').textContent = `${n} Online`;
    const me = userOf(S.me.username);
    $('#meCard').replaceChildren(avatar(S.me.username),
      h('div', { class: 'grow' }, h('b', {}, me.name), h('small', {}, me.custom || `${ARTIFACT ? '' : handleText(me) + ' · '}${PRESENCE_LABEL[me.presence]}`)),
      h('span', { class: 'muted', style: 'font-size:18px' }, '⚙'));
  }
  function renderHeader() {
    const r = S.rooms[S.current];
    if (!r || !S.me) return;
    $('#roomName').textContent = r.dm ? `💬 ${roomLabel(r)}` : roomLabel(r);
    let meta;
    if (r.dm) {
      const other = userOf(r.members.find((m) => m !== S.me.username) || S.me.username);
      meta = PRESENCE_LABEL[other.presence] + (other.custom ? ` · ${other.custom}` : '');
    } else meta = r.public ? `Public · ${roomActive(r)} active` : `Private · ${r.members.length} members · ${roomActive(r)} active`;
    $('#roomMeta').textContent = meta;
    $('#msgInput').placeholder = r.dm ? `Message ${roomLabel(r)}` : 'Say hello';
    // calls: in a DM, when the other person is online (website only: claude.ai pages can't use the camera or mic)
    const other = r.dm && r.members.find((m) => m !== S.me.username);
    const canCall = CALLS && other && userOf(other).presence !== 'offline';
    $('#callBtn').classList.toggle('hidden', !canCall);
    $('#videoBtn').classList.toggle('hidden', !canCall);
  }
  function renderMessages() {
    const box = $('#messages'), r = S.rooms[S.current];
    box.replaceChildren();
    if (!r) return;
    if (!r.messages.length) box.append(h('div', { class: 'empty-chat' }, h('div', { class: 'big-emoji' }, '👋'), h('b', {}, 'No messages yet'), 'Say hello to get things going!'));
    r.messages.forEach((m, i) => appendMessage(m, r.messages[i - 1], true));
    box.scrollTop = box.scrollHeight;
    renderTyping();
  }
  function appendMessage(m, prev, bulk) {
    const box = $('#messages');
    const empty = $('.empty-chat', box);
    if (empty) empty.remove();
    const stick = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    if (!prev || fmtDay(prev.ts) !== fmtDay(m.ts)) box.append(h('div', { class: 'day' }, fmtDay(m.ts)));
    box.append(msgEl(m, prev));
    if (!bulk && (stick || m.from === S.me.username)) box.scrollTop = box.scrollHeight;
  }
  const snippet = (m) => (m.deleted ? 'Message deleted' : m.text && m.text.startsWith('/me ') ? `* ${nameOf(m.from)} ${m.text.slice(4)}` : m.text ? m.text : m.poll ? `📊 ${m.poll.q}` : m.file ? `📎 ${m.file.name || m.file}` : 'Message');
  function msgEl(m, prev) {
    if (m.sys) return h('div', { class: 'sysmsg', 'data-id': m.id }, m.text);
    const mine = m.from === S.me.username;
    const cont = prev && !prev.sys && prev.from === m.from && m.ts - prev.ts < 5 * 60e3 && fmtDay(prev.ts) === fmtDay(m.ts) && !m.replyTo;
    if (m.deleted) {
      return h('div', { class: 'msg deleted' + (mine ? ' me' : '') + (cont ? ' cont' : ''), 'data-id': m.id },
        h('div', { class: 'av-slot', onclick: () => showProfile(m.from) }, avatar(m.from)),
        h('div', { class: 'body' },
          h('div', { class: 'meta' }, h('button', { class: 'who', onclick: () => showProfile(m.from) }, mine ? 'You' : nameOf(m.from)), h('span', { class: 'time' }, fmtTime(m.ts))),
          h('div', { class: 'text gone' }, mine ? '🚫 You deleted this message' : '🚫 This message was deleted')));
    }
    if (isBlocked(m.from) && !S.revealed.has(m.id)) {
      return h('div', { class: 'msg blocked-msg' + (mine ? ' me' : ''), 'data-id': m.id },
        h('div', { class: 'body' }, h('button', { class: 'text gone', title: 'Show it anyway', onclick: () => { S.revealed.add(m.id); const el = $(`#messages [data-id="${CSS.escape(m.id)}"]`); if (el) el.replaceWith(msgEl(m, prev)); } },
          '🚫 Message from someone you blocked · show')));
    }
    const edited = m.editedAt && m.history && m.history.length;
    const action = m.text && m.text.startsWith('/me ');
    const body = (t) => (t && t.startsWith('/me ') ? [h('b', {}, nameOf(m.from)), ' ', ...richText(t.slice(4))] : richText(t || ''));
    const textEl = m.text || edited ? h('div', { class: 'text' + (m.text ? '' : ' hidden') + (action ? ' me-action' : '') + (isJumbo(m.text) ? ' jumbo' : ''), title: new Date(m.ts).toLocaleString() }, body(m.text)) : null;
    let tag = null;
    if (edited) {
      // click "edited" to see the original text, click again to go back
      const original = m.history[0].text;
      let showing = false;
      tag = h('button', { class: 'edited', title: `Edited ${fmtTime(m.editedAt)}. Click to see the original.`, onclick: (e) => {
        e.stopPropagation();
        showing = !showing;
        textEl.replaceChildren(...(showing ? [original || '(no text)'] : body(m.text)));
        textEl.classList.toggle('original', showing);
        textEl.classList.toggle('hidden', !showing && !m.text);
        tag.textContent = showing ? `original · sent ${fmtTime(m.ts)} · show edited` : 'edited';
      } }, 'edited');
    }
    const el = h('div', { class: 'msg' + (mine ? ' me' : '') + (cont ? ' cont' : '') + (!mine && mentionsMe(m.text) ? ' mentioned' : ''), 'data-id': m.id, onclick: () => el.classList.toggle('tapped') },
      h('div', { class: 'av-slot', onclick: () => showProfile(m.from) }, avatar(m.from)),
      h('div', { class: 'body' },
        h('div', { class: 'meta' },
          h('button', { class: 'who', onclick: () => showProfile(m.from) }, mine ? 'You' : nameOf(m.from)),
          h('span', { class: 'time', title: new Date(m.ts).toLocaleString() }, fmtTime(m.ts))),
        m.pinned ? h('div', { class: 'pin-tag' }, `📌 Pinned by ${m.pinned.by === S.me.username ? 'you' : nameOf(m.pinned.by)}`) : null,
        m.replyTo ? replyQuote(m.replyTo) : null,
        m.file ? attachmentEl(m.file) : null,
        m.poll ? pollEl(m) : null,
        textEl,
        tag,
        reactionsEl(m)),
      h('div', { class: 'msg-actions' },
        h('button', { title: 'React', 'aria-label': 'React', onclick: (e) => { e.stopPropagation(); reactPicker(e.currentTarget, m); } }, '😊'),
        h('button', { title: 'Reply', 'aria-label': 'Reply', onclick: (e) => { e.stopPropagation(); startReply(m); } }, '↩'),
        mine && !m.poll ? h('button', { title: 'Edit', 'aria-label': 'Edit', onclick: (e) => { e.stopPropagation(); startEdit(m); } }, '✏️') : null,
        mine ? h('button', { title: 'Delete', 'aria-label': 'Delete', onclick: (e) => {
          e.stopPropagation();
          const room = S.current;
          uiConfirm('Delete this message for everyone?', 'Delete', () => send({ t: 'del', room, id: m.id }));
        } }, '🗑️') : null,
        h('button', { title: 'More', 'aria-label': 'More', onclick: (e) => { e.stopPropagation(); msgMenu(e.currentTarget, m); } }, '⋯')));
    // double-click a message to give it a 👍
    el.addEventListener('dblclick', (e) => {
      if (e.target.closest('button, a, input, video, .spoiler')) return;
      const sel = window.getSelection && window.getSelection();
      if (sel) sel.removeAllRanges();
      send({ t: 'react', room: S.current, id: m.id, emoji: '👍' });
    });
    return el;
  }
  // only emoji (up to 6): show them big
  function isJumbo(t) {
    if (!t) return false;
    t = t.trim();
    if (t.length > 48 || !/^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|‍|️|⃣|\s)+$/u.test(t)) return false;
    const n = (t.match(/\p{Extended_Pictographic}|\p{Regional_Indicator}{2}/gu) || []).length;
    return n >= 1 && n <= 6;
  }
  // ---------------------------------------------------------------- message menu: copy, forward, pin, save
  function menuItem(icon, label, fn, cls) {
    return h('button', { type: 'button', class: 'menu-item' + (cls ? ' ' + cls : ''), onclick: () => { closePop(); fn(); } }, h('span', { class: 'mi-icon' }, icon), label);
  }
  function msgMenu(anchor, m) {
    const room = S.current, saved = pref('saved', []).some((x) => x.id === m.id);
    popover(anchor, h('div', { class: 'menu' },
      m.text || m.poll || m.file ? menuItem('📋', 'Copy text', () => copyText(m.text || (m.poll ? m.poll.q : m.file.name))) : null,
      menuItem('↪️', 'Forward…', () => forwardModal(m)),
      menuItem('📌', m.pinned ? 'Unpin' : 'Pin to this chat', () => send({ t: 'pin', room, id: m.id, on: !m.pinned })),
      menuItem('🔖', saved ? 'Remove from saved' : 'Save for later', () => toggleSaved(m, room)),
      menuItem('👍', 'Like (double-click)', () => send({ t: 'react', room, id: m.id, emoji: '👍' }))), 'menu-pop');
  }
  async function copyText(t) {
    // some browsers never answer the clipboard request inside an embedded page: give up quickly and copy the old way
    try { await Promise.race([navigator.clipboard.writeText(t), new Promise((res, rej) => setTimeout(rej, 700))]); }
    catch {
      const ta = h('textarea', { style: 'position:fixed;left:-9999px;opacity:0' });
      ta.value = t; document.body.append(ta); ta.select();
      try { document.execCommand('copy'); } catch {}
      ta.remove();
    }
    toast('Copied');
  }
  function forwardText(m) {
    const quote = (t) => t.split('\n').map((l) => '> ' + l).join('\n');
    const what = m.text ? quote(m.text.startsWith('/me ') ? `* ${nameOf(m.from)} ${m.text.slice(4)}` : m.text) : m.poll ? quote('📊 ' + m.poll.q) : '';
    const file = m.file ? '\n> 📎 ' + (m.file.name || 'file') : '';
    return (`↪️ Forwarded from **${nameOf(m.from)}**\n` + what + file).slice(0, 1000);
  }
  function forwardModal(m) {
    openModal(() => [modalHead('Forward to…'),
      h('div', { class: 'fwd-preview' }, richText(forwardText(m))),
      h('ul', { class: 'list' }, sortedRooms().map((r) => h('li', { onclick: () => {
        send({ t: 'msg', room: r.id, text: forwardText(m) });
        closeModal();
        toast(`Forwarded to ${roomLabel(r)}`);
      } }, r.dm ? avatar(r.members.find((x) => x !== S.me.username) || S.me.username) : h('span', { class: 'room-icon' }, r.id === 'global' ? '🌐' : r.public ? '#' : '🔒'),
      h('span', { class: 'grow' }, roomLabel(r)))))]);
  }
  function toggleSaved(m, room) {
    const list = pref('saved', []);
    if (list.some((x) => x.id === m.id)) { setPref('saved', list.filter((x) => x.id !== m.id)); toast('Removed from saved'); return; }
    list.unshift({ id: m.id, room, from: m.from, text: snippet(m).slice(0, 300), ts: m.ts, at: Date.now() });
    setPref('saved', list.slice(0, 100));
    toast('Saved. Find it in ⋯ → Saved messages');
  }
  // ---------------------------------------------------------------- reactions and polls
  function reactionsEl(m) {
    const list = Object.entries(m.reactions || {}).filter(([, who]) => who.length);
    if (!list.length) return null;
    const room = S.current;
    return h('div', { class: 'reactions' }, list.map(([emoji, who]) => h('button', {
      class: 'reaction' + (who.includes(S.me.username) ? ' mine' : ''),
      title: who.map((u) => (u === S.me.username ? 'You' : nameOf(u))).join(', ') + ' reacted ' + emoji,
      onclick: (e) => { e.stopPropagation(); send({ t: 'react', room, id: m.id, emoji }); },
    }, emoji, h('span', {}, who.length))));
  }
  function reactPicker(anchor, m) {
    const room = S.current;
    popover(anchor, REACTIONS.map((emoji) => h('button', { class: 'emoji-btn', title: `React ${emoji}`, onclick: () => { closePop(); send({ t: 'react', room, id: m.id, emoji }); } }, emoji)), 'react-pop');
  }
  function pollEl(m) {
    const p = m.poll, room = S.current;
    const total = p.options.reduce((a, o) => a + o.votes.length, 0);
    const voted = p.options.some((o) => o.votes.includes(S.me.username));
    return h('div', { class: 'poll' },
      h('div', { class: 'poll-q' }, '📊 ', p.q),
      p.options.map((o, i) => {
        const pct = total ? Math.round((o.votes.length / total) * 100) : 0, mineVote = o.votes.includes(S.me.username);
        return h('button', { class: 'poll-opt' + (mineVote ? ' mine' : ''), title: o.votes.map(nameOf).join(', ') || 'No votes yet',
          onclick: (e) => { e.stopPropagation(); send({ t: 'vote', room, id: m.id, option: i }); } },
        h('span', { class: 'poll-bar', style: `width:${pct}%` }),
        h('span', { class: 'poll-text' }, mineVote ? '✓ ' : '', o.text),
        h('span', { class: 'poll-count' }, voted || total ? `${o.votes.length} · ${pct}%` : ''));
      }),
      h('small', { class: 'muted' }, `${total} vote${total === 1 ? '' : 's'} · ${voted ? 'tap your choice again to take it back' : 'tap to vote'}`));
  }
  function pollModal() {
    const roomId = S.current;
    openModal(() => {
      const q = h('input', { placeholder: 'Ask something, e.g. What should we play?', maxlength: 200 });
      const opts = h('div', { class: 'poll-inputs' });
      const err = h('div', { class: 'error' });
      const addOpt = () => {
        if (opts.children.length >= 6) return;
        const inp = h('input', { placeholder: `Option ${opts.children.length + 1}`, maxlength: 80 });
        opts.append(inp);
        addBtn.classList.toggle('hidden', opts.children.length >= 6);
        return inp;
      };
      const addBtn = h('button', { class: 'btn small', type: 'button', onclick: () => { const i = addOpt(); if (i) i.focus(); } }, '＋ Add option');
      addOpt(); addOpt();
      setTimeout(() => q.focus());
      return [modalHead('New poll'),
        h('label', { class: 'field' }, h('span', {}, 'Question'), q),
        h('div', { class: 'field' }, h('span', {}, 'Options'), opts, addBtn),
        err,
        h('div', { class: 'row end' },
          h('button', { class: 'btn', onclick: closeModal }, 'Cancel'),
          h('button', { class: 'btn primary', onclick: () => {
            const options = [...opts.querySelectorAll('input')].map((i) => i.value.trim()).filter(Boolean);
            if (!q.value.trim()) { err.textContent = 'Write a question.'; q.focus(); return; }
            if (options.length < 2) { err.textContent = 'Add at least two options.'; return; }
            send({ t: 'msg', room: roomId, text: '', poll: { q: q.value.trim(), options } });
            closeModal();
          } }, 'Post poll'))];
    });
  }
  function replyQuote(r) {
    const room = S.rooms[S.current], live = room && room.messages.find((x) => x.id === r.id);
    return h('button', { class: 'reply-quote', 'data-for': r.id, title: 'Show this message', onclick: (e) => { e.stopPropagation(); jumpTo(r.id); } },
      h('b', {}, r.from === S.me.username ? 'You' : nameOf(r.from)),
      h('span', {}, live ? snippet(live) : r.text || (r.file ? `📎 ${r.file}` : 'Message')));
  }
  function jumpTo(id) {
    const el = $(`#messages [data-id="${CSS.escape(id)}"]`);
    if (!el) { toast('That message is too old to show here.'); return; }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  // ---------------------------------------------------------------- replying and editing
  let replyTo = null, editing = null;
  function composeBar() {
    const bar = $('#composeBar'), target = editing || replyTo;
    if (!target) { bar.classList.add('hidden'); bar.replaceChildren(); return; }
    bar.classList.remove('hidden');
    bar.replaceChildren(
      h('span', { class: 'cb-icon' }, editing ? '✏️' : '↩'),
      h('div', { class: 'cb-text' },
        h('b', {}, editing ? 'Editing your message' : `Replying to ${replyTo.from === S.me.username ? 'yourself' : nameOf(replyTo.from)}`),
        h('span', {}, snippet(target))),
      h('button', { class: 'close-x', type: 'button', title: 'Cancel (Esc)', 'aria-label': 'Cancel', onclick: cancelCompose }, '✕'));
  }
  function startReply(m) {
    if (editing) $('#msgInput').value = '';
    editing = null; replyTo = m;
    composeBar();
    $('#msgInput').focus();
  }
  function startEdit(m) {
    replyTo = null; editing = m;
    $('#msgInput').value = m.text || '';
    fitInput();
    composeBar();
    $('#msgInput').focus();
  }
  function cancelCompose() {
    if (editing) $('#msgInput').value = '';
    replyTo = editing = null;
    composeBar();
  }
  // the message box grows with what you type; Enter sends, Shift+Enter starts a new line
  function fitInput() { const el = $('#msgInput'); el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight + 2, 160) + 'px'; }
  $('#msgInput').addEventListener('input', fitInput);
  $('#msgInput').addEventListener('keydown', (e) => {
    if (mentionKey(e)) return;
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#composer').requestSubmit(); return; }
    if (e.key === 'Escape' && (replyTo || editing)) { e.stopPropagation(); cancelCompose(); }
    if (e.key === 'ArrowUp' && !e.target.value && !editing) {
      // up arrow in an empty box edits your last message
      const room = S.rooms[S.current], mine = room && [...room.messages].reverse().find((x) => !x.sys && !x.deleted && !x.poll && x.from === S.me.username);
      if (mine) { e.preventDefault(); startEdit(mine); }
    }
  });
  // ---------------------------------------------------------------- suggestions: @people, :emoji:, /commands
  const mbox = $('#mentionBox');
  let mlist = [], mpick = 0;
  function mentionQuery() {
    const inp = $('#msgInput'), before = inp.value.slice(0, inp.selectionStart);
    let mt;
    if ((mt = /^\/(\w{0,12})$/.exec(before))) return { kind: 'cmd', q: mt[1].toLowerCase(), start: 0 };
    if ((mt = /(^|\s)@([^\s@]{0,20})$/.exec(before))) return { kind: 'at', q: mt[2].toLowerCase(), start: before.length - mt[2].length - 1 };
    if ((mt = /(^|\s):([a-z0-9_+-]{2,20})$/i.exec(before))) return { kind: 'emoji', q: mt[2].toLowerCase(), start: before.length - mt[2].length - 1 };
    return null;
  }
  function updateMentions() {
    const mq = mentionQuery();
    mlist = [];
    if (mq && mq.kind === 'at') {
      const r = S.rooms[S.current];
      mlist = Object.values(S.users)
        .filter((u) => u.username !== S.me.username && u.name && u.name.toLowerCase().startsWith(mq.q))
        .sort((a, b) => (a.presence === 'offline') - (b.presence === 'offline') || a.name.localeCompare(b.name)).slice(0, 6)
        .map((u) => ({ insert: '@' + u.name + ' ', view: [avatar(u.username), h('span', {}, u.name), h('small', { class: 'muted' }, PRESENCE_LABEL[u.presence])] }));
      if (r && !r.dm) for (const [k, d] of [['everyone', 'Everyone in this chat'], ['here', 'Everyone online here']]) {
        if (k.startsWith(mq.q)) mlist.push({ insert: '@' + k + ' ', view: [h('span', { class: 'sugg-icon' }, '📣'), h('span', {}, '@' + k), h('small', { class: 'muted' }, d)] });
      }
    } else if (mq && mq.kind === 'emoji') {
      mlist = Object.entries(EMOJI_CODES).filter(([k]) => k.startsWith(mq.q)).slice(0, 8)
        .map(([k, e]) => ({ insert: e + ' ', view: [h('span', { class: 'sugg-icon' }, e), h('span', {}, `:${k}:`)] }));
    } else if (mq && mq.kind === 'cmd') {
      mlist = COMMANDS.filter((c) => c.name.startsWith(mq.q))
        .map((c) => ({ insert: '/' + c.name + (c.args ? ' ' : ''), view: [h('span', { class: 'sugg-icon' }, c.icon), h('span', {}, h('b', {}, '/' + c.name), c.args ? h('span', { class: 'muted' }, ' ' + c.args) : null), h('small', { class: 'muted' }, c.desc)] }));
    }
    mpick = Math.min(mpick, Math.max(0, mlist.length - 1));
    if (!mlist.length) { mbox.classList.add('hidden'); mbox.replaceChildren(); return; }
    mbox.classList.remove('hidden');
    mbox.replaceChildren(...mlist.map((it, i) => h('button', { type: 'button', class: i === mpick ? 'sel' : '', onmousedown: (e) => { e.preventDefault(); pickMention(i); } }, it.view)));
  }
  function pickMention(i) {
    const it = mlist[i], mq = mentionQuery(), inp = $('#msgInput');
    if (!it || !mq) return;
    const after = inp.value.slice(inp.selectionStart);
    inp.value = inp.value.slice(0, mq.start) + it.insert + after.replace(/^\S*\s?/, '');
    const pos = mq.start + it.insert.length;
    inp.setSelectionRange(pos, pos);
    inp.focus();
    mlist = [];
    updateMentions();
  }
  function mentionKey(e) {
    if (!mlist.length) return false;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { mpick = (mpick + (e.key === 'ArrowDown' ? 1 : mlist.length - 1)) % mlist.length; updateMentions(); }
    else if (e.key === 'Tab' || (e.key === 'Enter' && !(mentionQuery() && mentionQuery().kind === 'cmd' && COMMANDS.some((c) => c.name === mentionQuery().q)))) pickMention(mpick);
    else if (e.key === 'Escape') { mlist = []; mbox.classList.add('hidden'); e.stopPropagation(); }
    else return false;
    e.preventDefault();
    return true;
  }

  // ---------------------------------------------------------------- slash commands
  const FACES = { shrug: '¯\\\\\\_(ツ)\\_/¯', tableflip: '(╯°□°)╯︵ ┻━┻', unflip: '┬─┬ノ( º \\_ ºノ)', lenny: '( ͡° ͜ʖ ͡°)' };
  const COMMANDS = [
    { name: 'me', icon: '💬', args: '<action>', desc: 'Say what you’re doing: /me waves', run: (r) => (r ? '/me ' + r : null) },
    { name: 'shrug', icon: '🤷', args: '[text]', desc: '¯\\_(ツ)_/¯', run: (r) => (r ? r + ' ' : '') + FACES.shrug },
    { name: 'tableflip', icon: '😤', args: '[text]', desc: '(╯°□°)╯︵ ┻━┻', run: (r) => (r ? r + ' ' : '') + FACES.tableflip },
    { name: 'unflip', icon: '😌', args: '[text]', desc: '┬─┬ノ( º _ ºノ)', run: (r) => (r ? r + ' ' : '') + FACES.unflip },
    { name: 'lenny', icon: '😏', args: '[text]', desc: '( ͡° ͜ʖ ͡°)', run: (r) => (r ? r + ' ' : '') + FACES.lenny },
    { name: 'roll', icon: '🎲', args: '[2d6]', desc: 'Roll dice for everyone to see', run: rollDice },
    { name: 'flip', icon: '🪙', args: '', desc: 'Flip a coin', run: () => `🪙 flipped a coin: **${Math.random() < 0.5 ? 'Heads' : 'Tails'}**` },
    { name: 'remind', icon: '⏰', args: '<10m> <note>', desc: 'Remind yourself later (only you see it)', run: (r) => { addReminder(r); return null; } },
    { name: 'help', icon: '❓', args: '', desc: 'Commands, formatting and shortcuts', run: () => { helpModal(); return null; } },
  ];
  function rollDice(arg) {
    const m = /^(?:(\d{1,2})?d)?(\d{1,3})$/i.exec((arg || '').trim()) || (arg ? null : [0, '1', '6']);
    if (!m) { toast('Try /roll, /roll 20 or /roll 2d6', 'err'); return null; }
    const n = Math.max(1, Math.min(10, +(m[1] || 1))), sides = Math.max(2, Math.min(100, +m[2]));
    const rolls = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * sides)), sum = rolls.reduce((a, b) => a + b, 0);
    return n === 1 ? `🎲 rolled a d${sides}: **${sum}**` : `🎲 rolled ${n}d${sides}: ${rolls.join(' + ')} = **${sum}**`;
  }
  // a text you're about to send that starts with / is a command; returns the text to send (or null)
  function runCommand(text) {
    const m = /^\/(\w+)(?:\s+([\s\S]*))?$/.exec(text);
    if (!m) return text;
    const c = COMMANDS.find((x) => x.name === m[1].toLowerCase());
    if (!c) { toast(`There’s no /${m[1]} command. Type /help to see them all.`, 'err'); return null; }
    return c.run((m[2] || '').trim());
  }
  // ---------------------------------------------------------------- reminders (this browser only)
  function addReminder(arg) {
    const m = /^(\d{1,4})\s*(s|sec|secs|seconds?|m|min|mins|minutes?|h|hr|hrs|hours?)?\s+([\s\S]+)$/i.exec(arg || '');
    if (!m) { toast('Try /remind 10m stretch, or /remind 1h start the tournament', 'err'); return; }
    const unit = (m[2] || 'm')[0].toLowerCase(), ms = +m[1] * (unit === 's' ? 1000 : unit === 'h' ? 3600e3 : 60e3);
    if (ms > 24 * 3600e3) { toast('Reminders can be up to 24 hours away', 'err'); return; }
    const list = pref('reminders', []);
    list.push({ at: Date.now() + ms, text: m[3].slice(0, 200), room: S.current });
    setPref('reminders', list);
    const mins = Math.round(ms / 60e3);
    toast(`⏰ I’ll remind you in ${ms < 60e3 ? Math.round(ms / 1000) + ' seconds' : mins < 60 ? mins + ' minute' + (mins === 1 ? '' : 's') : (ms / 3600e3).toFixed(ms % 3600e3 ? 1 : 0) + ' hours'}`);
  }
  setInterval(() => {
    if (!S.me) return;
    const list = pref('reminders', []), now = Date.now(), due = list.filter((r) => r.at <= now);
    if (!due.length) return;
    setPref('reminders', list.filter((r) => r.at > now));
    for (const r of due) {
      const t = toast(`⏰ Reminder: ${r.text}`, 'reminder-toast', 20000);
      t.style.cursor = 'pointer';
      t.addEventListener('click', () => t.remove());
      ping(soundKind() === 'off' ? 'off' : 'bell');
    }
  }, 2000);
  $('#msgInput').addEventListener('input', updateMentions);
  $('#msgInput').addEventListener('click', updateMentions);
  $('#msgInput').addEventListener('blur', () => setTimeout(() => { mlist = []; mbox.classList.add('hidden'); }, 150));

  // ---------------------------------------------------------------- emoji picker, polls, search
  function insertText(t) {
    const inp = $('#msgInput'), a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? a;
    inp.value = (inp.value.slice(0, a) + t + inp.value.slice(b)).slice(0, 1000);
    inp.setSelectionRange(a + t.length, a + t.length);
    inp.focus();
  }
  $('#emojiBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    if (pop && pop.classList.contains('emoji-pop')) { closePop(); return; }
    popover(e.currentTarget, EMOJIS.map((em) => h('button', { type: 'button', class: 'emoji-btn', onclick: () => insertText(em) }, em)), 'emoji-pop');
  });
  $('#emojiBtn').addEventListener('mousedown', (e) => e.stopPropagation());
  $('#pollBtn').addEventListener('click', () => pollModal());

  function searchModal() {
    let q = '';
    const input = h('input', { type: 'search', placeholder: 'Search messages, files and polls', maxlength: 100 });
    const results = h('div', { class: 'search-results' });
    const run = () => {
      const needle = q.trim().toLowerCase();
      if (!needle) { results.replaceChildren(h('div', { class: 'muted' }, 'Type to search recent messages in all your chats.')); return; }
      const hits = [];
      const rooms = Object.values(S.rooms).sort((a, b) => (a.id === S.current ? -1 : b.id === S.current ? 1 : 0));
      for (const r of rooms) {
        for (const m of r.messages) {
          if (m.sys || m.deleted) continue;
          const hay = [m.text, m.file && m.file.name, m.poll && m.poll.q].concat(m.poll ? m.poll.options.map((o) => o.text) : []).filter(Boolean).join(' \n ');
          if (hay.toLowerCase().includes(needle)) hits.push({ r, m });
        }
      }
      const shown = hits.sort((a, b) => (b.r.id === S.current) - (a.r.id === S.current) || b.m.ts - a.m.ts).slice(0, 50);
      if (!shown.length) { results.replaceChildren(h('div', { class: 'muted' }, 'No messages match.')); return; }
      results.replaceChildren(...shown.map(({ r, m }) => {
        const text = snippet(m), at = text.toLowerCase().indexOf(needle);
        const body = at < 0 ? [text] : [text.slice(Math.max(0, at - 40), at), h('mark', {}, text.slice(at, at + needle.length)), text.slice(at + needle.length, at + needle.length + 80)];
        if (at > 40) body.unshift('…');
        return h('button', { class: 'search-hit', onclick: () => { closeModal(); if (r.id !== S.current) selectRoom(r.id); setTimeout(() => jumpTo(m.id), 50); } },
          avatar(m.from),
          h('div', { class: 'grow' },
            h('div', { class: 'search-meta' }, h('b', {}, m.from === S.me.username ? 'You' : nameOf(m.from)), h('small', { class: 'muted' }, `${roomLabel(r)} · ${fmtDay(m.ts)} ${fmtTime(m.ts)}`)),
            h('div', { class: 'search-text' }, body)));
      }));
    };
    input.addEventListener('input', () => { q = input.value; run(); });
    run();
    setTimeout(() => input.focus());
    openModal(() => [modalHead('Search'), input, results], true);
  }

  // ---------------------------------------------------------------- files
  const fmtSize = (n) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);
  const isImage = (f) => /^image\/(png|jpeg|gif|webp|svg\+xml)$/.test(f.type);
  const isVideo = (f) => /^video\/(mp4|webm|ogg|quicktime)$/.test(f.type);
  function fileIcon(f) {
    if (f.type === 'application/pdf') return '📄';
    if (/^text\/|json$/.test(f.type)) return '📝';
    if (/^audio\//.test(f.type)) return '🎵';
    if (/zip|compressed|tar/.test(f.type)) return '🗜️';
    return '📎';
  }
  function saveButton(f, cls) {
    if (!ARTIFACT) return h('a', { class: 'btn small ' + (cls || ''), href: f.url, download: f.name, target: '_blank', rel: 'noopener' }, 'Save');
    if (!transport.canSave()) return null;
    return h('button', { class: 'btn small ' + (cls || ''), onclick: (e) => {
      e.stopPropagation();
      transport.save(f).catch((err) => toast(err.message, 'err'));
    } }, 'Save');
  }
  function keepBottom() {
    const box = $('#messages');
    if (box.scrollHeight - box.scrollTop - box.clientHeight < 400) box.scrollTop = box.scrollHeight;
  }
  function attachmentEl(f) {
    if (isImage(f)) {
      const img = h('img', { class: 'att-img', src: f.url, alt: f.name, loading: 'lazy', onload: keepBottom });
      img.addEventListener('error', () => img.replaceWith(h('div', { class: 'att-file' }, h('span', { class: 'att-icon' }, '🖼️'), h('div', {}, h('b', {}, f.name), h('small', {}, 'Image unavailable')))));
      return h('button', { class: 'att-media', title: f.name, onclick: () => showImage(f) }, img);
    }
    if (isVideo(f)) {
      return h('div', { class: 'att-media' }, h('video', { class: 'att-video', src: f.url, controls: true, preload: 'metadata', playsinline: true, onloadedmetadata: keepBottom }));
    }
    return h('div', { class: 'att-file' }, h('span', { class: 'att-icon' }, fileIcon(f)),
      h('div', { class: 'att-info' }, h('b', {}, f.name), h('small', {}, fmtSize(f.size))),
      saveButton(f));
  }
  function showImage(f) {
    openModal(() => [h('div', { class: 'modal-head' }, h('h2', { class: 'att-title' }, f.name), saveButton(f), h('button', { class: 'close-x', onclick: closeModal }, 'X')),
      h('img', { class: 'att-full', src: f.url, alt: f.name })], true);
  }
  const MAX_SERVER_FILE = 10 * 1024 * 1024;
  async function uploadFile(file) {
    if (ARTIFACT) return transport.upload(file);
    const res = await fetch('/upload', {
      method: 'POST', body: file,
      headers: { 'X-Token': S.token || '', 'X-File-Name': encodeURIComponent(file.name), 'Content-Type': file.type || 'application/octet-stream' },
    });
    const meta = await res.json().catch(() => ({ error: 'Upload failed' }));
    if (!res.ok) throw new Error(meta.error || 'Upload failed');
    return meta;
  }
  // Profile photos: cropped to the middle square and shrunk, so they load fast everywhere.
  async function squarePhoto(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error('That photo couldn’t be opened. Try a PNG or JPG.'));
        i.src = url;
      });
      const side = Math.min(img.naturalWidth, img.naturalHeight), size = 256;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, size, size);
      g.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
      const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.9));
      if (!blob) throw new Error('That photo couldn’t be opened. Try a PNG or JPG.');
      return new File([blob], 'profile.jpg', { type: 'image/jpeg' });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  async function setPhoto(file) {
    if (!file) return;
    if (!/^image\//.test(file.type) && !/\.(png|jpe?g|gif|webp|heic)$/i.test(file.name)) { toast('Pick a photo (PNG, JPG, GIF or WebP).', 'err'); return; }
    const note = toast('Uploading your photo…', null, 600000);
    try {
      const meta = await uploadFile(await squarePhoto(file));
      send({ t: 'profile', data: { photo: meta } });
      toast('Profile picture updated');
    } catch (err) {
      toast(err.message || 'That photo didn’t upload.', 'err');
    } finally {
      note.remove();
    }
  }
  async function uploadOne(file, roomId, rep) {
    const max = ARTIFACT ? transport.maxFile : MAX_SERVER_FILE;
    if (file.size > max) { toast(`“${file.name}” is over ${max / 1048576} MB. Try a smaller file.`, 'err'); return; }
    const note = toast(`Sending “${file.name}”…`, null, 600000);
    try {
      const meta = await uploadFile(file);
      send(rep ? { t: 'msg', room: roomId, text: '', file: meta, replyTo: rep } : { t: 'msg', room: roomId, text: '', file: meta });
    } catch (err) {
      toast(err.message || 'That file didn’t upload.', 'err');
    } finally {
      note.remove();
    }
  }
  function sendFiles(list) {
    const roomId = S.current, rep = replyTo && !editing ? replyTo.id : null;
    [...list].slice(0, 10).forEach((f) => uploadOne(f, roomId, rep));
    if (rep) cancelCompose();
  }
  $('#attachBtn').addEventListener('click', () => $('#fileInput').click());
  $('#fileInput').addEventListener('change', (e) => { sendFiles(e.target.files); e.target.value = ''; });
  $('#msgInput').addEventListener('paste', (e) => {
    const files = e.clipboardData && e.clipboardData.files;
    if (files && files.length) { e.preventDefault(); sendFiles(files); }
  });
  const pane = $('#chatPane');
  let dragDepth = 0;
  const hasFiles = (e) => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
  pane.addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth++; pane.classList.add('dragging'); });
  pane.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
  pane.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; pane.classList.remove('dragging'); } });
  pane.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth = 0;
    pane.classList.remove('dragging');
    sendFiles(e.dataTransfer.files);
  });

  // "Jump to latest" when you've scrolled up, with how many new messages arrived below
  function updateJump() {
    const box = $('#messages'), btn = $('#jumpBtn');
    const far = box.scrollHeight - box.scrollTop - box.clientHeight > 300;
    if (!far) S.newBelow = 0;
    btn.classList.toggle('hidden', !far);
    btn.textContent = S.newBelow ? `↓ ${S.newBelow} new message${S.newBelow === 1 ? '' : 's'}` : '↓ Jump to latest';
  }
  $('#messages').addEventListener('scroll', () => updateJump());
  $('#jumpBtn').addEventListener('click', () => { const box = $('#messages'); box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' }); S.newBelow = 0; setTimeout(updateJump, 400); });
  function renderTyping() {
    const t = S.typing[S.current] || {}, now = Date.now();
    const who = Object.keys(t).filter((u) => now - t[u] < 3500).map(nameOf);
    $('#typing').textContent = who.length ? `${who.join(', ')} ${who.length > 1 ? 'are' : 'is'} typing…` : '';
  }
  setInterval(() => { if (S.me) renderTyping(); }, 1000);

  function selectRoom(id) {
    if (!S.rooms[id]) return;
    const switching = id !== S.current;
    if (switching) { saveDraft(); cancelCompose(); }
    const unreadN = S.unread[id] || 0;
    S.current = id;
    store.set('chatRoom', id);
    delete S.unread[id];
    delete S.mentions[id];
    closePop();
    $('#app').classList.remove('menu-open');
    renderRooms();
    renderHeader();
    renderMessages();
    if (switching) { $('#msgInput').value = pref('drafts', {})[id] || ''; fitInput(); }
    // a line above the first message you haven't seen
    if (unreadN) {
      const msgs = S.rooms[id].messages, first = msgs[Math.max(0, msgs.length - unreadN)];
      const el = first && $(`#messages [data-id="${CSS.escape(first.id)}"]`);
      if (el) { el.before(h('div', { class: 'new-divider' }, h('span', {}, `${unreadN} new message${unreadN === 1 ? '' : 's'}`))); el.scrollIntoView({ block: 'center' }); }
    }
    S.newBelow = 0;
    updateJump();
    updateTitle();
    if (matchMedia('(min-width: 721px)').matches) $('#msgInput').focus();
  }

  // ---------------------------------------------------------------- composer
  let lastTyping = 0;
  $('#msgInput').addEventListener('input', () => {
    if (Date.now() - lastTyping > 2000 && !$('#msgInput').value.startsWith('/')) { lastTyping = Date.now(); send({ t: 'typing', room: S.current }); }
    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraft, 400);
  });
  // drafts: what you were typing in each chat is kept when you switch chats or reload
  let draftTimer = 0;
  function saveDraft(roomId) {
    if (!S.me || editing) return;
    const d = pref('drafts', {}), v = $('#msgInput').value;
    if (v.trim()) d[roomId || S.current] = v; else delete d[roomId || S.current];
    setPref('drafts', d);
  }
  $('#composer').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#msgInput'), text = input.value.trim();
    if (editing) {
      if (!text && !editing.file) return;
      if (text !== (editing.text || '')) send({ t: 'edit', room: S.current, id: editing.id, text });
      input.value = '';
      fitInput();
      cancelCompose();
      return;
    }
    if (!text) return;
    const out = text.startsWith('/') && !text.startsWith('//') ? runCommand(text) : text.replace(/^\/\//, '/');
    input.value = '';
    fitInput();
    saveDraft();
    if (!out) { cancelCompose(); return; }
    const body = swapShortcodes(out).slice(0, 1000);
    send(replyTo ? { t: 'msg', room: S.current, text: body, replyTo: replyTo.id } : { t: 'msg', room: S.current, text: body });
    lastTyping = 0;
    cancelCompose();
  });

  // ---------------------------------------------------------------- modals
  let modalRefresh = null;
  function openModal(build, wide) {
    const card = $('#modalCard');
    card.className = 'modal-card' + (wide ? ' wide' : '');
    card.replaceChildren(...[].concat(build()));
    modalRefresh = build.refresh || null;
    $('#modal').classList.remove('hidden');
  }
  function uiConfirm(text, okLabel, onOk) {
    openModal(() => [h('h2', {}, text),
      h('div', { class: 'row end' },
        h('button', { class: 'btn', onclick: closeModal }, 'Cancel'),
        h('button', { class: 'btn danger', onclick: () => { closeModal(); onOk(); } }, okLabel))]);
  }
  window.uiConfirm = uiConfirm;
  function closeModal() {
    $('#modal').classList.add('hidden');
    $('#modalCard').replaceChildren();
    modalRefresh = null;
  }
  function refreshOpenModal() { if (modalRefresh) modalRefresh(); }
  $('#modal').addEventListener('mousedown', (e) => { if (e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').classList.contains('hidden')) closeModal(); });
  const modalHead = (title) => h('div', { class: 'modal-head' }, h('h2', {}, title), h('button', { class: 'close-x', onclick: closeModal, title: 'Close' }, 'X'));

  function userChecklist(users, checked) {
    const box = h('div', { class: 'check-list' });
    if (!users.length) box.append(h('div', { class: 'muted' }, 'Nobody to add yet.'));
    users.sort((a, b) => (a.presence === 'offline') - (b.presence === 'offline') || a.name.localeCompare(b.name)).forEach((u) => {
      box.append(h('label', {}, h('input', { type: 'checkbox', value: u.username, checked: checked && checked.includes(u.username) }),
        avatar(u.username), u.name, u.handle && u.handle !== u.name ? h('small', { class: 'muted' }, ` ${handleText(u)}`) : null));
    });
    box.values = () => [...box.querySelectorAll('input:checked')].map((i) => i.value);
    return box;
  }

  function newChatModal() {
    openModal(() => {
      const name = h('input', { placeholder: 'Chat name, e.g. Game night', maxlength: 40 });
      const pub = h('input', { type: 'checkbox', style: 'width:auto' });
      const people = userChecklist(Object.values(S.users).filter((u) => u.username !== S.me.username));
      setTimeout(() => name.focus());
      return [modalHead('New chat'),
        h('label', { class: 'field' }, h('span', {}, 'Name'), name),
        h('label', { class: 'row' }, pub, 'Public — anyone can see and join this chat'),
        h('div', { class: 'field' }, h('span', {}, 'Add people'), people),
        h('div', { class: 'row end' },
          h('button', { class: 'btn', onclick: closeModal }, 'Cancel'),
          h('button', { class: 'btn primary', onclick: () => {
            if (!name.value.trim()) { name.focus(); return; }
            send({ t: 'createRoom', name: name.value, public: pub.checked, members: people.values() });
          } }, 'Create chat'))];
    });
  }

  function membersModal() {
    const r = S.rooms[S.current];
    const build = () => {
      const list = r.public ? onlineUsers().map((u) => u.username) : r.members;
      const kids = [modalHead(r.public ? `${roomLabel(r)} — online now` : `${roomLabel(r)} — members`),
        h('ul', { class: 'list' }, list.length ? list.map(personRow) : h('li', { class: 'empty' }, 'Nobody here'))];
      if (!r.dm && r.id !== 'global' && r.members.includes(S.me.username)) {
        const others = Object.values(S.users).filter((u) => !r.members.includes(u.username));
        const add = userChecklist(others);
        kids.push(h('div', { class: 'field' }, h('span', {}, 'Add people'), add),
          h('div', { class: 'row end' },
            h('button', { class: 'btn danger', onclick: () => uiConfirm(`Leave “${r.name}”?`, 'Leave chat', () => send({ t: 'leaveRoom', room: r.id })) }, 'Leave chat'),
            h('button', { class: 'btn primary', onclick: () => { send({ t: 'addMembers', room: r.id, members: add.values() }); closeModal(); } }, 'Add')));
      }
      return kids;
    };
    openModal(build);
  }

  function showProfile(u) {
    const build = () => {
      const x = userOf(u), mine = u === S.me.username, friend = (S.me.friends || []).includes(u);
      const favs = (x.favorites || []).map(gameName);
      return [
        h('div', { class: 'modal-head' }, h('div', { class: 'profile-top', style: 'flex:1' }, avatar(u, true),
          h('div', {}, h('h2', {}, x.name), h('div', { class: 'muted' }, handleText(x)),
            h('div', {}, h('i', { class: 'dot ' + x.presence }), ' ', PRESENCE_LABEL[x.presence], x.inGame ? ` · playing ${gameName(x.inGame)}` : ''),
            x.custom ? h('div', { class: 'custom-status' }, x.custom) : null)),
        h('button', { class: 'close-x', onclick: closeModal }, 'X')),
        h('div', { class: 'bio-box' }, h('b', {}, 'Bio'), h('div', { style: 'white-space:pre-wrap' }, x.bio || h('span', { class: 'muted' }, 'No bio yet.'))),
        h('div', { class: 'field' }, h('b', {}, 'Favorite games'),
          h('div', { class: 'chips' }, favs.length ? favs.map((g) => h('span', { class: 'chip' }, g)) : h('span', { class: 'muted' }, 'None picked'))),
        record(x.stats),
        mine ? h('div', { class: 'row end' }, h('button', { class: 'btn primary', onclick: settingsModal }, 'Edit in Settings'))
          : h('div', { class: 'row end' },
            h('button', { class: 'btn', onclick: () => send({ t: 'friend', username: u, add: !friend }) }, friend ? 'Remove friend' : '＋ Add friend'),
            h('button', { class: 'btn', onclick: () => send({ t: 'dm', with: u }) }, 'Message'),
            CALLS && x.presence !== 'offline' ? h('button', { class: 'btn', title: 'Voice call', onclick: () => { closeModal(); Calls.start(u, false); } }, '📞 Call') : null,
            CALLS && x.presence !== 'offline' ? h('button', { class: 'btn', title: 'Video call', onclick: () => { closeModal(); Calls.start(u, true); } }, '🎥 Video') : null,
            h('button', { class: 'btn primary', onclick: () => gameModal(u) }, 'Challenge')),
        mine ? null : h('div', { class: 'row end' }, h('button', { class: 'btn small ghost danger-text', onclick: () => {
          const on = toggleIn('blocked', u);
          toast(on ? `Blocked ${x.name}. You won’t see their messages, pings or challenges.` : `Unblocked ${x.name}`);
          build.refresh(); renderPeople(); renderMessages();
        } }, isBlocked(u) ? '✅ Unblock' : '🚫 Block')),
      ];
    };
    build.refresh = () => $('#modalCard').replaceChildren(...build());
    openModal(build);
  }

  const record = (st) => h('div', { class: 'record' },
    h('div', {}, h('b', {}, st.w), h('small', {}, 'Wins')), h('div', {}, h('b', {}, st.l), h('small', {}, 'Losses')), h('div', {}, h('b', {}, st.d), h('small', {}, 'Draws')));
  const gameName = (g) => (GameDock.META[g] || {}).name || g;
  const BOT = '__bot';
  function gameModal(opponent, preselect) {
    let game = preselect || (S.me.favorites && S.me.favorites[0]) || 'snake';
    let level = BotPlay.LEVELS[store.get('botLevel')] ? store.get('botLevel') : 'medium';
    let target = opponent || null;
    const build = () => {
      const r = S.rooms[S.current];
      const pool = onlineUsers().filter((u) => u.username !== S.me.username)
        .sort((a, b) => (r && r.members.includes(b.username)) - (r && r.members.includes(a.username)) || a.name.localeCompare(b.name));
      if (!target && pool.length) target = (r && r.dm && r.members.find((m) => m !== S.me.username && userOf(m).presence !== 'offline')) || pool[0].username;
      if (!target || (target !== BOT && !pool.some((u) => u.username === target))) target = BOT; // nobody (else) online: play the bot
      const grid = h('div', { class: 'game-grid' }, Object.entries(GameDock.META).map(([id, g]) =>
        h('button', { class: 'game-card' + (id === game ? ' sel' : ''), style: `--g:${g.color}`, onclick: () => { game = id; rebuild(); } },
          h('span', { class: 'emoji' }, g.emoji), h('b', {}, g.name), h('small', {}, g.desc))));
      const levels = h('div', { class: 'levels', role: 'radiogroup', 'aria-label': 'Bot difficulty' }, Object.entries(BotPlay.LEVELS).map(([id, l]) =>
        h('button', { class: 'level' + (id === level ? ' sel' : ''), role: 'radio', 'aria-checked': String(id === level), onclick: (e) => {
          e.stopPropagation(); level = id; store.set('botLevel', id); target = BOT; rebuild();
        } }, l.label)));
      const botRow = h('li', { class: 'bot-row' + (target === BOT ? ' active' : ''), onclick: () => { target = BOT; rebuild(); } },
        h('div', { class: 'avatar bot-avatar' }, '🤖'),
        h('span', { class: 'grow' }, 'Play the bot ', h('small', {}, pool.length ? 'Practice anytime' : 'Nobody else is online, so play the bot')), levels);
      const people = h('ul', { class: 'list' }, botRow, pool.map((u) => h('li', {
        class: u.username === target ? 'active' : '', onclick: () => { target = u.username; rebuild(); } },
      avatar(u.username), h('span', { class: 'grow' }, u.name, ' ', h('small', {}, u.inGame ? `🎮 in a game` : PRESENCE_LABEL[u.presence])))));
      const vsBot = target === BOT;
      return [modalHead('Request a game'), h('b', {}, '1. Pick a game'), grid, h('b', {}, '2. Pick who to play'), people,
        h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: closeModal }, 'Cancel'),
          h('button', { class: 'btn primary', onclick: () => {
            closeModal();
            if (vsBot) BotPlay.start(game, level, { username: S.me.username, name: S.me.name, avatar: S.me.avatar });
            else send({ t: 'gameInvite', game, to: target, room: S.current });
          } }, vsBot ? `Play the bot (${BotPlay.LEVELS[level].label})` : `Challenge ${nameOf(target)}`))];
    };
    const rebuild = () => $('#modalCard').replaceChildren(...build());
    build.refresh = rebuild;
    openModal(build, true);
  }

  function showInvite(inv) {
    const g = GameDock.META[inv.game];
    let left = Math.max(1, Math.round((inv.expires - Date.now()) / 1000));
    const count = h('small', { class: 'muted' });
    const el = h('div', { class: 'toast invite' },
      h('div', { class: 'row' }, avatar(inv.from), h('div', { style: 'flex:1' }, h('b', {}, nameOf(inv.from)), ` challenged you to ${g.emoji} ${g.name}!`)),
      h('div', { class: 'row end' }, count,
        h('button', { class: 'btn', onclick: () => { send({ t: 'gameRespond', id: inv.id, accept: false }); done(); } }, 'Decline'),
        h('button', { class: 'btn primary', onclick: () => { send({ t: 'gameRespond', id: inv.id, accept: true }); done(); } }, 'Accept')));
    const tick = () => { count.textContent = `${left}s`; if (left-- <= 0) done(); };
    const timer = setInterval(tick, 1000);
    function done() { clearInterval(timer); el.remove(); }
    tick();
    $('#toasts').append(el);
  }

  // settings — laid out like the mockup
  function settingsModal() {
    const set = (data) => send({ t: 'profile', data });
    let me = S.me;
    const statusOpt = (val, color, label) => h('button', { class: 'status-opt' + (me.status === val ? ' sel' : ''), onclick: () => { set({ status: val }); } },
      h('span', { class: 'arrow' }, me.status === val ? '➡' : ''), h('span', { class: 'sq', style: `background:${color}` }), label);
    const bgOpt = (val, cls, label, extra) => h('div', { class: 'bg-opt' + (me.bg === val ? ' sel' : '') }, h('span', { class: 'arrow' }, me.bg === val ? '➡' : ''),
      h('button', { class: 'btn ' + cls, onclick: () => set({ bg: val }) }, label), extra || null);
    const build = () => {
      me = S.me;
      const name = h('input', { value: me.name, maxlength: 30, onchange: (e) => e.target.value.trim() && set({ name: e.target.value }) });
      const oldPw = h('input', { type: 'password', placeholder: 'Current password', autocomplete: 'current-password' });
      const newPw = h('input', { type: 'password', placeholder: 'New password', autocomplete: 'new-password' });
      const bgColor = h('input', { type: 'color', value: me.bgCustom, title: 'Pick a background color', oninput: (e) => { me.bgCustom = e.target.value; me.bg = 'custom'; applyTheme(); }, onchange: (e) => set({ bg: 'custom', bgCustom: e.target.value }) });
      const preview = avatar(me.username, true);
      preview.querySelector('.dot').remove();
      const avColor = h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(me.avatar) ? me.avatar : '#6d5dfc', oninput: (e) => { preview.style.backgroundColor = e.target.value; }, onchange: (e) => set({ avatar: e.target.value }) });
      const photoInput = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/gif,image/webp,image/heic', hidden: true, onchange: (e) => { setPhoto(e.target.files[0]); e.target.value = ''; } });
      const bio = h('textarea', { maxlength: 300, placeholder: 'Tell people about yourself', onchange: (e) => set({ bio: e.target.value }) });
      bio.value = me.bio || '';
      const friends = (me.friends || []).filter((f) => S.users[f]);
      return [
        h('div', { class: 'modal-head' }, h('button', { class: 'close-x', onclick: closeModal, title: 'Close' }, 'X'),
          h('h2', {}, 'Settings'), h('button', { class: 'btn danger', onclick: signOut }, 'Sign out')),
        h('div', { class: 'settings-grid' },
          h('section', {},
            h('label', { class: 'field' }, h('span', {}, 'Name'), name),
            h('label', { class: 'field' }, h('span', {}, 'Custom status ', h('small', { class: 'muted' }, '(shows under your name)')),
              h('input', { value: me.custom || '', maxlength: 60, placeholder: 'e.g. 🎮 grinding Tower Defense', onchange: (e) => set({ custom: e.target.value }) })),
            ARTIFACT ? null : h('div', { class: 'field' }, h('span', {}, 'Password'), oldPw, newPw,
              h('button', { class: 'btn', onclick: () => { send({ t: 'password', old: oldPw.value, new: newPw.value }); oldPw.value = newPw.value = ''; } }, 'Change password')),
            h('label', { class: 'field' }, h('span', {}, ARTIFACT ? 'Claude account' : 'Username'), h('input', { value: me.handle || me.username, disabled: true, title: ARTIFACT ? 'You’re signed in with your Claude account' : 'Usernames can’t be changed' })),
            h('div', { class: 'field' }, h('div', { class: 'boxed-title' }, 'Profile picture'),
              h('div', { class: 'row' }, preview,
                h('div', { class: 'photo-btns' },
                  h('button', { class: 'btn small', onclick: () => photoInput.click() }, me.photo ? '📷 Change photo' : '📷 Choose a photo'),
                  me.photo ? h('button', { class: 'btn small ghost', onclick: () => set({ photo: null }) }, 'Remove photo') : null,
                  photoInput)),
              h('small', { class: 'muted' }, me.photo ? 'The color shows while your photo loads.' : 'Or pick a color:'),
              h('div', { class: 'swatches' }, AVATARS.map((c) => h('button', { class: 'swatch' + (me.avatar.toLowerCase() === c ? ' sel' : ''), style: `background:${c}`, title: c, onclick: () => set({ avatar: c }) }))),
              h('label', { class: 'field' }, h('small', {}, 'Color selector'), avColor)),
            h('div', { class: 'boxed-title' }, 'Notifications'),
            h('small', { class: 'muted' }, 'Plays when someone @mentions you or sends you a direct message while you’re on another tab or in another chat.'),
            h('div', { class: 'sound-grid' },
              h('select', { class: 'sound-pick', 'aria-label': 'Sound', onchange: (e) => { store.set('chatSound', null); setPref('sound', e.target.value); ping(); } },
                Object.entries(SOUNDS).map(([k, v]) => h('option', { value: k, selected: soundKind() === k }, '🔔 ' + v.label)),
                h('option', { value: 'off', selected: soundKind() === 'off' }, '🔕 No sound')),
              h('button', { class: 'btn small', onclick: () => ping(soundKind() === 'off' ? 'ding' : soundKind()) }, '▶ Test')),
            h('label', { class: 'field' }, h('small', {}, 'Volume'),
              h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: pref('volume', 0.7), oninput: (e) => setPref('volume', +e.target.value), onchange: () => ping() })),
            h('label', { class: 'row sound-row' }, h('input', { type: 'checkbox', checked: pref('friendAlerts', true), style: 'width:auto', onchange: (e) => setPref('friendAlerts', e.target.checked) }),
              'Tell me when a friend comes online')),
          h('section', {},
            h('div', { class: 'boxed-title' }, 'Status'),
            h('div', {}, statusOpt('online', 'var(--online)', 'Online'), statusOpt('offline', 'var(--offline)', 'Offline (appear offline)'), statusOpt('idle', 'var(--idle)', 'Idle / do not disturb')),
            h('div', { class: 'boxed-title' }, 'Background color'),
            ARTIFACT ? bgOpt('auto', '', 'Match Claude') : null, bgOpt('white', 'white', 'White'), bgOpt('black', 'black', 'Black'),
            bgOpt('custom', '', 'Color selection', bgColor),
            h('div', { class: 'boxed-title' }, 'Favorite games'),
            h('div', { class: 'game-grid', style: 'grid-template-columns:1fr 1fr' }, Object.entries(GameDock.META).map(([id, g]) => {
              const onFav = (me.favorites || []).includes(id);
              return h('button', { class: 'btn fav-btn' + (onFav ? ' on' : ''), onclick: () => set({ favorites: onFav ? me.favorites.filter((f) => f !== id) : (me.favorites || []).concat(id) }) }, `${g.emoji} ${g.name}`);
            }))),
          h('section', {},
            h('div', { class: 'bio-box' }, h('b', {}, 'Bio'), bio),
            h('div', { class: 'friends-box' }, h('b', {}, 'Friends list'),
              friends.length ? friends.map((f) => h('div', { class: 'row', style: 'cursor:pointer', onclick: () => showProfile(f) }, h('i', { class: 'dot ' + userOf(f).presence }), nameOf(f), h('small', { class: 'muted' }, PRESENCE_LABEL[userOf(f).presence])))
                : h('span', { class: 'muted' }, 'No friends yet — click someone’s name and press “Add friend”.')),
            h('div', { class: 'boxed-title' }, 'Your record'), record(me.stats),
            h('div', { class: 'friends-box' }, h('b', {}, 'Blocked people'),
              pref('blocked', []).length ? pref('blocked', []).map((b) => h('div', { class: 'row' }, h('span', { style: 'flex:1' }, nameOf(b)),
                h('button', { class: 'btn small', onclick: () => { toggleIn('blocked', b); $('#modalCard').replaceChildren(...build()); renderPeople(); renderMessages(); } }, 'Unblock')))
                : h('span', { class: 'muted' }, 'Nobody. Open someone’s profile to block them.')))),
      ];
    };
    // Re-render on updates, but never while the user is typing in a field.
    build.refresh = () => {
      const a = document.activeElement;
      if (a && $('#modalCard').contains(a) && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && a.type !== 'color'))) return;
      $('#modalCard').replaceChildren(...build());
    };
    openModal(build, true);
  }

  // ---------------------------------------------------------------- chat menu (⋯ in the top bar)
  function chatMenu(anchor) {
    const r = S.rooms[S.current];
    if (!r) return;
    const pins = r.messages.filter((m) => m.pinned && !m.deleted).length, saved = pref('saved', []).length;
    const unread = Object.values(S.unread).reduce((a, b) => a + b, 0);
    popover(anchor, h('div', { class: 'menu' },
      menuItem('📌', `Pinned messages${pins ? ` (${pins})` : ''}`, pinnedModal),
      menuItem('🔖', `Saved messages${saved ? ` (${saved})` : ''}`, savedModal),
      menuItem('🖼️', 'Photos & videos in this chat', galleryModal),
      menuItem('📤', 'Export this chat', exportChat),
      h('hr'),
      menuItem(isFav(r.id) ? '☆' : '★', isFav(r.id) ? 'Remove from favorites' : 'Favorite (keep at the top)', () => { toggleIn('favs', r.id); renderRooms(); }),
      menuItem(isMuted(r.id) ? '🔔' : '🔕', isMuted(r.id) ? 'Unmute this chat' : 'Mute (no sounds or counts, except @mentions)', () => { const on = toggleIn('muted', r.id); renderRooms(); updateTitle(); toast(on ? 'Muted. You’ll still hear @mentions.' : 'Unmuted'); }),
      menuItem('✔️', `Mark all chats as read${unread ? ` (${unread})` : ''}`, markAllRead),
      h('hr'),
      menuItem('⌨️', 'Commands, formatting & shortcuts', helpModal)), 'menu-pop');
  }
  function markAllRead() { S.unread = {}; S.mentions = {}; renderRooms(); updateTitle(); toast('All caught up ✔️'); }
  function jumpToMsg(roomId, id) {
    closeModal();
    if (!S.rooms[roomId]) { toast('That chat isn’t available any more.', 'err'); return; }
    if (roomId !== S.current) selectRoom(roomId);
    setTimeout(() => jumpTo(id), 60);
  }
  function msgRow(m, roomId, extra) {
    return h('div', { class: 'list-msg' }, avatar(m.from),
      h('div', { class: 'grow' }, h('div', { class: 'search-meta' }, h('b', {}, m.from === S.me.username ? 'You' : nameOf(m.from)),
        h('small', { class: 'muted' }, `${S.rooms[roomId] ? roomLabel(S.rooms[roomId]) : 'Old chat'} · ${fmtDay(m.ts)} ${fmtTime(m.ts)}`)),
      h('div', { class: 'search-text' }, typeof m.text === 'string' && !m.poll && !m.file ? richText(m.text) : snippet(m))),
      h('div', { class: 'list-msg-btns' }, h('button', { class: 'btn small', onclick: () => jumpToMsg(roomId, m.id) }, 'Go to'), extra || null));
  }
  function pinnedModal() {
    const build = () => {
      const r = S.rooms[S.current], pins = r.messages.filter((m) => m.pinned && !m.deleted).sort((a, b) => b.pinned.ts - a.pinned.ts);
      return [modalHead(`📌 Pinned in ${roomLabel(r)}`),
        h('div', { class: 'search-results' }, pins.length ? pins.map((m) => msgRow(m, r.id, h('button', { class: 'btn small ghost', onclick: () => send({ t: 'pin', room: r.id, id: m.id, on: false }) }, 'Unpin')))
          : h('div', { class: 'muted' }, 'Nothing pinned yet. Hover a message, press ⋯ and pick “Pin to this chat”.'))];
    };
    build.refresh = () => $('#modalCard').replaceChildren(...build());
    openModal(build, true);
  }
  function savedModal() {
    const build = () => {
      const list = pref('saved', []);
      return [modalHead('🔖 Saved messages'), h('small', { class: 'muted' }, 'Only you can see these. They’re kept in this browser.'),
        h('div', { class: 'search-results' }, list.length ? list.map((x) => msgRow({ id: x.id, from: x.from, text: x.text, ts: x.ts }, x.room,
          h('button', { class: 'btn small ghost', onclick: () => { setPref('saved', pref('saved', []).filter((y) => y.id !== x.id)); $('#modalCard').replaceChildren(...build()); } }, 'Remove')))
          : h('div', { class: 'muted' }, 'Nothing saved yet. Hover a message, press ⋯ and pick “Save for later”.'))];
    };
    openModal(build, true);
  }
  function galleryModal() {
    const r = S.rooms[S.current];
    const media = r.messages.filter((m) => m.file && !m.deleted && (isImage(m.file) || isVideo(m.file))).reverse();
    openModal(() => [modalHead(`🖼️ Photos & videos in ${roomLabel(r)}`),
      media.length ? h('div', { class: 'gallery' }, media.map((m) => isImage(m.file)
        ? h('button', { class: 'gallery-tile', title: `${m.file.name} · ${nameOf(m.from)}`, onclick: () => showImage(m.file) }, h('img', { src: m.file.url, alt: m.file.name, loading: 'lazy' }))
        : h('button', { class: 'gallery-tile video', title: `${m.file.name} · ${nameOf(m.from)}`, onclick: () => jumpToMsg(r.id, m.id) }, h('video', { src: m.file.url, preload: 'metadata', muted: true }), h('span', {}, '▶'))))
        : h('div', { class: 'muted' }, 'No photos or videos in the recent messages of this chat.')], true);
  }
  async function exportChat() {
    const r = S.rooms[S.current];
    const lines = [`${roomLabel(r)} — exported ${new Date().toLocaleString()}`, ''].concat(r.messages.map((m) => {
      const when = new Date(m.ts).toLocaleString();
      if (m.sys) return `[${when}] • ${m.text}`;
      const who = nameOf(m.from);
      if (m.deleted) return `[${when}] ${who}: (deleted)`;
      let t = m.text && m.text.startsWith('/me ') ? `* ${who} ${m.text.slice(4)}` : `${who}: ${m.text || ''}`;
      if (m.file) t += ` [file: ${m.file.name}]`;
      if (m.poll) t += ` [poll: ${m.poll.q} — ${m.poll.options.map((o) => `${o.text} (${o.votes.length})`).join(', ')}]`;
      return `[${when}] ${t}`;
    }));
    const name = `${roomLabel(r).replace(/[^\w -]+/g, '').trim() || 'chat'}.txt`, blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    try {
      if (ARTIFACT) await transport.saveBlob(name, blob);
      else {
        const url = URL.createObjectURL(blob), a = h('a', { href: url, download: name });
        document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    } catch (e) { toast(e.message || 'Couldn’t export the chat.', 'err'); }
  }
  function helpModal() {
    const row = (a, b) => h('div', { class: 'help-row' }, h('code', {}, a), h('span', {}, b));
    openModal(() => [modalHead('Commands, formatting & shortcuts'),
      h('div', { class: 'help-grid' },
        h('section', {}, h('b', {}, 'Commands'), COMMANDS.map((c) => row('/' + c.name + (c.args ? ' ' + c.args : ''), c.desc))),
        h('section', {}, h('b', {}, 'Formatting'),
          row('**bold**', 'bold'), row('*italic* or _italic_', 'italic'), row('~~strike~~', 'strikethrough'), row('`code`', 'code'),
          row('```code block```', 'code block'), row('> quote', 'quote'), row('||spoiler||', 'hidden until clicked'), row(':fire:', '🔥 emoji shortcodes'),
          row('@name, @everyone, @here', 'ping people'), row('\\*', 'show a symbol as is'),
          h('b', {}, 'Shortcuts'),
          row('Enter / Shift + Enter', 'send / new line'), row('Ctrl/⌘ + K', 'search'), row('Alt + ↑ / ↓', 'previous / next chat'), row('↑ in an empty box', 'edit your last message'),
          row('Double-click a message', '👍 it'), row('Esc', 'cancel a reply or edit')))], true);
  }

  // ---------------------------------------------------------------- wire up
  $('#moreBtn').addEventListener('click', (e) => { e.stopPropagation(); if (pop && pop.classList.contains('menu-pop')) { closePop(); return; } chatMenu(e.currentTarget); });
  $('#moreBtn').addEventListener('mousedown', (e) => e.stopPropagation());
  document.addEventListener('keydown', (e) => {
    if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') || !S.me || $('#app').classList.contains('hidden')) return;
    const ids = sortedRooms().map((r) => r.id), i = ids.indexOf(S.current);
    const next = ids[(i + (e.key === 'ArrowDown' ? 1 : ids.length - 1)) % ids.length];
    if (next) { e.preventDefault(); selectRoom(next); }
  });
  $('#newChatBtn').addEventListener('click', newChatModal);
  $('#settingsBtn').addEventListener('click', settingsModal);
  $('#meCard').addEventListener('click', settingsModal);
  $('#signOutBtn').addEventListener('click', signOut);
  $('#membersBtn').addEventListener('click', membersModal);
  $('#searchBtn').addEventListener('click', searchModal);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && S.me && !$('#app').classList.contains('hidden')) { e.preventDefault(); searchModal(); }
  });
  $('#requestGameBtn').addEventListener('click', () => gameModal());
  $('#onlineBtn').addEventListener('click', () => openModal(() => [modalHead(`${onlineUsers().length} Online`),
    h('ul', { class: 'list' }, onlineUsers().map((u) => personRow(u.username)))]));
  $('#menuBtn').addEventListener('click', () => $('#app').classList.toggle('menu-open'));
  $('#scrim').addEventListener('click', () => $('#app').classList.remove('menu-open'));

  if (CALLS) {
    Calls.init({
      send,
      toast,
      nameOf,
      avatarEl: (u) => avatar(u, true),
      me: () => S.me && S.me.username,
    });
  }
  const dmPartner = () => { const r = S.rooms[S.current]; return r && r.dm && r.members.find((m) => m !== S.me.username); };
  $('#callBtn').addEventListener('click', () => { const u = dmPartner(); if (u) Calls.start(u, false); });
  $('#videoBtn').addEventListener('click', () => { const u = dmPartner(); if (u) Calls.start(u, true); });

  GameDock.init({
    send: (id, input) => send({ t: 'gameInput', id, input }),
    leave: (id) => send({ t: 'gameLeave', id }),
    rematch: (game, opponent) => send({ t: 'gameInvite', game, to: opponent, room: S.current }),
    me: () => S.me,
  });

  connect();
})();
