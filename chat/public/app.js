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
    unread: {}, mentions: {}, typing: {}, token: store.get('chatToken'), signedOut: false, retry: 0, authMode: 'login', queue: [],
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
      if (m.room === S.current) {
        appendMessage(m.msg, room.messages[room.messages.length - 2]);
        renderTyping();
      }
      const fromOther = m.msg.from && m.msg.from !== S.me.username;
      const away = m.room !== S.current || document.hidden;
      if (away && fromOther) {
        S.unread[m.room] = (S.unread[m.room] || 0) + 1;
        const mentioned = mentionsMe(m.msg.text);
        if (mentioned) S.mentions[m.room] = true;
        if (mentioned || room.dm) ping();
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
    },
    typing(m) {
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
    invite(m) { showInvite(m.invite); },
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
    return new RegExp('@' + escRe(S.me.name) + AFTER_NAME, 'iu').test(text);
  }
  // Text with clickable links and highlighted @names (built as nodes, never as HTML).
  function richText(text) {
    const names = [...new Set(Object.values(S.users).map((u) => u.name).filter(Boolean))].sort((a, b) => b.length - a.length).map(escRe);
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
        out.push(h('span', { class: 'mention' + (who && who.username === S.me.username ? ' you' : ''), onclick: who ? (e) => { e.stopPropagation(); showProfile(who.username); } : null }, '@' + mt[2]));
      }
      last = mt.index + whole.length;
      re.lastIndex = last;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }
  let actx = null;
  const soundOn = () => store.get('chatSound') !== '0';
  function ping() {
    if (!soundOn()) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, t);
      o.frequency.setValueAtTime(1320, t + 0.09);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g).connect(actx.destination);
      o.start(t);
      o.stop(t + 0.3);
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
    const n = Object.values(S.unread).reduce((a, b) => a + b, 0);
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
    const rooms = Object.values(S.rooms).sort((a, b) => (a.id === 'global' ? -1 : b.id === 'global' ? 1 : lastTs(b) - lastTs(a)));
    for (const r of rooms) {
      const n = S.unread[r.id];
      const other = r.dm && r.members.find((m) => m !== S.me.username);
      list.append(h('li', { class: r.id === S.current ? 'active' : '', onclick: () => selectRoom(r.id) },
        r.dm ? avatar(other || S.me.username) : h('span', { class: 'room-icon' }, r.id === 'global' ? '🌐' : r.public ? '#' : '🔒'),
        h('span', { class: 'grow' }, roomLabel(r), ' ', r.dm ? null : h('small', {}, `${roomActive(r)} active`)),
        S.mentions[r.id] ? h('span', { class: 'badge mention', title: 'You were mentioned' }, '@') : null,
        n ? h('span', { class: 'badge' }, n) : null));
    }
  }
  function personRow(u) {
    const x = userOf(u);
    return h('li', { onclick: () => showProfile(u) }, avatar(u),
      h('span', { class: 'grow' }, x.name, u === S.me.username ? h('small', {}, ' (you)') : null, ' ',
        x.inGame ? h('small', {}, `🎮 ${gameName(x.inGame)}`) : h('small', {}, PRESENCE_LABEL[x.presence])));
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
      h('div', { class: 'grow' }, h('b', {}, me.name), h('small', {}, `${ARTIFACT ? '' : handleText(me) + ' · '}${PRESENCE_LABEL[me.presence]}`)),
      h('span', { class: 'muted', style: 'font-size:18px' }, '⚙'));
  }
  function renderHeader() {
    const r = S.rooms[S.current];
    if (!r || !S.me) return;
    $('#roomName').textContent = r.dm ? `💬 ${roomLabel(r)}` : roomLabel(r);
    let meta;
    if (r.dm) {
      const other = userOf(r.members.find((m) => m !== S.me.username) || S.me.username);
      meta = PRESENCE_LABEL[other.presence];
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
  const snippet = (m) => (m.deleted ? 'Message deleted' : m.text ? m.text : m.poll ? `📊 ${m.poll.q}` : m.file ? `📎 ${m.file.name || m.file}` : 'Message');
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
    const edited = m.editedAt && m.history && m.history.length;
    const textEl = m.text || edited ? h('div', { class: 'text' + (m.text ? '' : ' hidden'), title: fmtTime(m.ts) }, richText(m.text || '')) : null;
    let tag = null;
    if (edited) {
      // click "edited" to see the original text, click again to go back
      const original = m.history[0].text;
      let showing = false;
      tag = h('button', { class: 'edited', title: `Edited ${fmtTime(m.editedAt)}. Click to see the original.`, onclick: (e) => {
        e.stopPropagation();
        showing = !showing;
        textEl.replaceChildren(...(showing ? [original || '(no text)'] : richText(m.text || '')));
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
          h('span', { class: 'time' }, fmtTime(m.ts))),
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
        } }, '🗑️') : null));
    return el;
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
    composeBar();
    $('#msgInput').focus();
  }
  function cancelCompose() {
    if (editing) $('#msgInput').value = '';
    replyTo = editing = null;
    composeBar();
  }
  $('#msgInput').addEventListener('keydown', (e) => {
    if (mentionKey(e)) return;
    if (e.key === 'Escape' && (replyTo || editing)) { e.stopPropagation(); cancelCompose(); }
    if (e.key === 'ArrowUp' && !e.target.value && !editing) {
      // up arrow in an empty box edits your last message
      const room = S.rooms[S.current], mine = room && [...room.messages].reverse().find((x) => !x.sys && !x.deleted && !x.poll && x.from === S.me.username);
      if (mine) { e.preventDefault(); startEdit(mine); }
    }
  });
  // ---------------------------------------------------------------- @mention suggestions
  const mbox = $('#mentionBox');
  let mlist = [], mpick = 0;
  function mentionQuery() {
    const inp = $('#msgInput'), before = inp.value.slice(0, inp.selectionStart);
    const mt = /(^|\s)@([^\s@]{0,20})$/.exec(before);
    return mt ? { q: mt[2], start: before.length - mt[2].length - 1 } : null;
  }
  function updateMentions() {
    const mq = mentionQuery();
    const q = mq && mq.q.toLowerCase();
    mlist = !mq ? [] : Object.values(S.users)
      .filter((u) => u.username !== S.me.username && u.name && u.name.toLowerCase().startsWith(q))
      .sort((a, b) => (a.presence === 'offline') - (b.presence === 'offline') || a.name.localeCompare(b.name)).slice(0, 6);
    mpick = Math.min(mpick, Math.max(0, mlist.length - 1));
    if (!mlist.length) { mbox.classList.add('hidden'); mbox.replaceChildren(); return; }
    mbox.classList.remove('hidden');
    mbox.replaceChildren(...mlist.map((u, i) => h('button', { type: 'button', class: i === mpick ? 'sel' : '', onmousedown: (e) => { e.preventDefault(); pickMention(i); } },
      avatar(u.username), h('span', {}, u.name), h('small', { class: 'muted' }, PRESENCE_LABEL[u.presence]))));
  }
  function pickMention(i) {
    const u = mlist[i], mq = mentionQuery(), inp = $('#msgInput');
    if (!u || !mq) return;
    const after = inp.value.slice(inp.selectionStart);
    const ins = '@' + u.name + ' ';
    inp.value = inp.value.slice(0, mq.start) + ins + after.replace(/^\S*\s?/, '');
    const pos = mq.start + ins.length;
    inp.setSelectionRange(pos, pos);
    inp.focus();
    mlist = [];
    updateMentions();
  }
  function mentionKey(e) {
    if (!mlist.length) return false;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { mpick = (mpick + (e.key === 'ArrowDown' ? 1 : mlist.length - 1)) % mlist.length; updateMentions(); }
    else if (e.key === 'Enter' || e.key === 'Tab') pickMention(mpick);
    else if (e.key === 'Escape') { mlist = []; mbox.classList.add('hidden'); e.stopPropagation(); }
    else return false;
    e.preventDefault();
    return true;
  }
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

  function renderTyping() {
    const t = S.typing[S.current] || {}, now = Date.now();
    const who = Object.keys(t).filter((u) => now - t[u] < 3500).map(nameOf);
    $('#typing').textContent = who.length ? `${who.join(', ')} ${who.length > 1 ? 'are' : 'is'} typing…` : '';
  }
  setInterval(() => { if (S.me) renderTyping(); }, 1000);

  function selectRoom(id) {
    if (!S.rooms[id]) return;
    if (id !== S.current) cancelCompose();
    S.current = id;
    store.set('chatRoom', id);
    delete S.unread[id];
    delete S.mentions[id];
    closePop();
    $('#app').classList.remove('menu-open');
    renderRooms();
    renderHeader();
    renderMessages();
    updateTitle();
    if (matchMedia('(min-width: 721px)').matches) $('#msgInput').focus();
  }

  // ---------------------------------------------------------------- composer
  let lastTyping = 0;
  $('#msgInput').addEventListener('input', () => {
    if (Date.now() - lastTyping > 2000) { lastTyping = Date.now(); send({ t: 'typing', room: S.current }); }
  });
  $('#composer').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#msgInput'), text = input.value.trim();
    if (editing) {
      if (!text && !editing.file) return;
      if (text !== (editing.text || '')) send({ t: 'edit', room: S.current, id: editing.id, text });
      input.value = '';
      cancelCompose();
      return;
    }
    if (!text) return;
    send(replyTo ? { t: 'msg', room: S.current, text, replyTo: replyTo.id } : { t: 'msg', room: S.current, text });
    input.value = '';
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
            h('div', {}, h('i', { class: 'dot ' + x.presence }), ' ', PRESENCE_LABEL[x.presence], x.inGame ? ` · playing ${gameName(x.inGame)}` : ''))),
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
            h('label', { class: 'row sound-row' }, h('input', { type: 'checkbox', checked: soundOn(), style: 'width:auto', onchange: (e) => { store.set('chatSound', e.target.checked ? null : '0'); if (e.target.checked) ping(); } }),
              'Play a sound when someone @mentions you or sends you a direct message')),
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
            h('div', { class: 'boxed-title' }, 'Your record'), record(me.stats))),
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

  // ---------------------------------------------------------------- wire up
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
