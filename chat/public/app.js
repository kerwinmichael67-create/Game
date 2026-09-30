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
    unread: {}, typing: {}, token: store.get('chatToken'), signedOut: false, retry: 0, authMode: 'login', queue: [],
  };
  const PRESENCE_LABEL = { online: 'Online', offline: 'Offline', idle: 'Do not disturb' };
  const AVATARS = ['#22c55e', '#111111', '#ef4444', '#facc15', '#d946ef'];

  // ---------------------------------------------------------------- connection
  function send(obj) {
    if (S.ws && S.ws.readyState === 1) S.ws.send(JSON.stringify(obj));
    else S.queue.push(obj);
  }
  function connect() {
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
      S.token = m.token;
      store.set('chatToken', m.token);
      S.me = m.me;
      S.games = m.games;
      S.users = {};
      m.users.forEach((u) => { S.users[u.username] = u; });
      S.rooms = {};
      m.rooms.forEach((r) => { S.rooms[r.id] = r; });
      if (!S.rooms[S.current]) S.current = 'global';
      $('#auth').classList.add('hidden');
      $('#app').classList.remove('hidden');
      applyTheme();
      renderAll();
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
      S.rooms[m.room.id] = m.room;
      if (old && old.messages.length > m.room.messages.length) m.room.messages = old.messages;
      renderRooms();
      if (m.room.id === S.current) renderHeader();
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
      if ((m.room !== S.current || document.hidden) && m.msg.from && m.msg.from !== S.me.username) {
        S.unread[m.room] = (S.unread[m.room] || 0) + 1;
      }
      renderRooms();
      updateTitle();
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
    invite(m) { showInvite(m.invite); },
    gameStart(m) { closeModal(); GameDock.start(m); renderPeople(); },
    gameState(m) { GameDock.state(m); },
    gameEvent(m) { GameDock.event(m); },
    gameOver(m) { GameDock.over(m); },
    gameError(m) { toast(m.text, 'err'); },
  };

  // ---------------------------------------------------------------- auth
  function showAuth() {
    S.me = null;
    $('#app').classList.add('hidden');
    $('#auth').classList.remove('hidden');
    document.body.dataset.theme = 'light';
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
  function signOut() {
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
  const onlineUsers = () => Object.values(S.users).filter((u) => u.presence !== 'offline');
  function avatar(u, big) {
    const x = userOf(u);
    return h('div', { class: 'avatar' + (big ? ' big' : ''), style: `background:${x.avatar}`, title: x.name },
      (x.name || '?')[0].toUpperCase(), h('i', { class: 'dot ' + x.presence }));
  }
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
    if (!document.hidden && S.unread[S.current]) { delete S.unread[S.current]; renderRooms(); updateTitle(); }
  });

  function applyTheme() {
    const me = S.me, body = document.body;
    body.style.removeProperty('--bg');
    body.style.removeProperty('--panel');
    if (me.bg === 'black') body.dataset.theme = 'dark';
    else if (me.bg === 'custom') {
      const c = me.bgCustom, n = parseInt(c.slice(1), 16);
      const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
      body.dataset.theme = lum < 0.5 ? 'dark' : 'light';
      body.style.setProperty('--bg', c);
      body.style.setProperty('--panel', lum < 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)');
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
        r.dm ? avatar(other || S.me.username) : r.public ? h('span', {}, r.id === 'global' ? '🌐' : '#') : h('span', {}, '🔒'),
        h('span', { class: 'grow' }, roomLabel(r), ' ', r.dm ? null : h('small', {}, `${roomActive(r)} active`)),
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
  }
  function renderMessages() {
    const box = $('#messages'), r = S.rooms[S.current];
    box.replaceChildren();
    if (!r) return;
    if (!r.messages.length) box.append(h('div', { class: 'empty-chat' }, h('div', { style: 'font-size:40px' }, '👋'), 'No messages yet — say hello!'));
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
    if (m.sys) {
      box.append(h('div', { class: 'sysmsg' }, m.text));
    } else {
      const mine = m.from === S.me.username;
      box.append(h('div', { class: 'msg' + (mine ? ' me' : '') },
        h('div', { onclick: () => showProfile(m.from) }, avatar(m.from)),
        h('div', {},
          h('button', { class: 'who', onclick: () => showProfile(m.from) }, nameOf(m.from)),
          h('span', { class: 'time' }, fmtTime(m.ts)),
          h('div', { class: 'text' }, m.text))));
    }
    if (!bulk && (stick || m.from === S.me.username)) box.scrollTop = box.scrollHeight;
  }
  function renderTyping() {
    const t = S.typing[S.current] || {}, now = Date.now();
    const who = Object.keys(t).filter((u) => now - t[u] < 3500).map(nameOf);
    $('#typing').textContent = who.length ? `${who.join(', ')} ${who.length > 1 ? 'are' : 'is'} typing…` : '';
  }
  setInterval(() => { if (S.me) renderTyping(); }, 1000);

  function selectRoom(id) {
    if (!S.rooms[id]) return;
    S.current = id;
    store.set('chatRoom', id);
    delete S.unread[id];
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
    if (!text) return;
    send({ t: 'msg', room: S.current, text });
    input.value = '';
    lastTyping = 0;
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
        avatar(u.username), u.name, h('small', { class: 'muted' }, ` @${u.username}`)));
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
            h('button', { class: 'btn danger', onclick: () => { if (confirm(`Leave “${r.name}”?`)) { send({ t: 'leaveRoom', room: r.id }); closeModal(); } } }, 'Leave chat'),
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
          h('div', {}, h('h2', {}, x.name), h('div', { class: 'muted' }, '@' + x.username),
            h('div', {}, h('i', { class: 'dot ' + x.presence }), ' ', PRESENCE_LABEL[x.presence], x.inGame ? ` · playing ${gameName(x.inGame)}` : ''))),
        h('button', { class: 'close-x', onclick: closeModal }, 'X')),
        h('div', { class: 'bio-box' }, h('b', {}, 'Bio'), h('div', { style: 'white-space:pre-wrap' }, x.bio || h('span', { class: 'muted' }, 'No bio yet.'))),
        h('div', { class: 'field' }, h('b', {}, 'Favorite games'),
          h('div', { class: 'chips' }, favs.length ? favs.map((g) => h('span', { class: 'chip' }, g)) : h('span', { class: 'muted' }, 'None picked'))),
        h('div', {}, h('b', {}, 'Record: '), `${x.stats.w} wins · ${x.stats.l} losses · ${x.stats.d} draws`),
        mine ? h('div', { class: 'row end' }, h('button', { class: 'btn primary', onclick: settingsModal }, 'Edit in Settings'))
          : h('div', { class: 'row end' },
            h('button', { class: 'btn', onclick: () => send({ t: 'friend', username: u, add: !friend }) }, friend ? 'Remove friend' : '＋ Add friend'),
            h('button', { class: 'btn', onclick: () => send({ t: 'dm', with: u }) }, 'Message'),
            h('button', { class: 'btn primary', onclick: () => gameModal(u) }, 'Challenge')),
      ];
    };
    build.refresh = () => $('#modalCard').replaceChildren(...build());
    openModal(build);
  }

  const gameName = (g) => (GameDock.META[g] || {}).name || g;
  function gameModal(opponent, preselect) {
    let game = preselect || (S.me.favorites && S.me.favorites[0]) || 'snake';
    let target = opponent || null;
    const build = () => {
      const r = S.rooms[S.current];
      const pool = onlineUsers().filter((u) => u.username !== S.me.username)
        .sort((a, b) => (r && r.members.includes(b.username)) - (r && r.members.includes(a.username)) || a.name.localeCompare(b.name));
      if (!target && pool.length) target = (r && r.dm && r.members.find((m) => m !== S.me.username && userOf(m).presence !== 'offline')) || pool[0].username;
      const grid = h('div', { class: 'game-grid' }, Object.entries(GameDock.META).map(([id, g]) =>
        h('button', { class: 'game-card' + (id === game ? ' sel' : ''), onclick: () => { game = id; rebuild(); } },
          h('span', { class: 'emoji' }, g.emoji), h('b', {}, g.name), h('small', {}, g.desc))));
      const people = h('ul', { class: 'list' }, pool.length ? pool.map((u) => h('li', {
        class: u.username === target ? 'active' : '', onclick: () => { target = u.username; rebuild(); } },
      avatar(u.username), h('span', { class: 'grow' }, u.name, ' ', h('small', {}, u.inGame ? `🎮 in a game` : PRESENCE_LABEL[u.presence]))))
        : h('li', { class: 'empty' }, 'Nobody else is online right now. Invite a friend to open this page!'));
      return [modalHead('Request a game'), h('b', {}, '1. Pick a game'), grid, h('b', {}, '2. Pick who to play'), people,
        h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: closeModal }, 'Cancel'),
          h('button', { class: 'btn primary', disabled: !target || !pool.some((u) => u.username === target), onclick: () => {
            send({ t: 'gameInvite', game, to: target, room: S.current });
            closeModal();
          } }, `Challenge${target ? ' ' + nameOf(target) : ''}`))];
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
    const statusOpt = (val, color, label) => h('button', { class: 'status-opt', onclick: () => { set({ status: val }); } },
      h('span', { class: 'arrow' }, me.status === val ? '➡' : ''), h('span', { class: 'sq', style: `background:${color}` }), label);
    const bgOpt = (val, cls, label, extra) => h('div', { class: 'bg-opt' }, h('span', { class: 'arrow' }, me.bg === val ? '➡' : ''),
      h('button', { class: 'btn ' + cls, onclick: () => set({ bg: val }) }, label), extra || null);
    const build = () => {
      me = S.me;
      const name = h('input', { value: me.name, maxlength: 30, onchange: (e) => e.target.value.trim() && set({ name: e.target.value }) });
      const oldPw = h('input', { type: 'password', placeholder: 'Current password', autocomplete: 'current-password' });
      const newPw = h('input', { type: 'password', placeholder: 'New password', autocomplete: 'new-password' });
      const bgColor = h('input', { type: 'color', value: me.bgCustom, title: 'Pick a background color', oninput: (e) => { me.bgCustom = e.target.value; me.bg = 'custom'; applyTheme(); }, onchange: (e) => set({ bg: 'custom', bgCustom: e.target.value }) });
      const avColor = h('input', { type: 'color', value: me.avatar, oninput: (e) => { $('#settingsAvatar').style.background = e.target.value; }, onchange: (e) => set({ avatar: e.target.value }) });
      const bio = h('textarea', { maxlength: 300, placeholder: 'Tell people about yourself', onchange: (e) => set({ bio: e.target.value }) });
      bio.value = me.bio || '';
      const friends = (me.friends || []).filter((f) => S.users[f]);
      return [
        h('div', { class: 'modal-head' }, h('button', { class: 'close-x', onclick: closeModal, title: 'Close' }, 'X'),
          h('h2', {}, 'Settings'), h('button', { class: 'btn danger', onclick: signOut }, 'Sign out')),
        h('div', { class: 'settings-grid' },
          h('section', {},
            h('label', { class: 'field' }, h('span', {}, 'Name'), name),
            h('div', { class: 'field' }, h('span', {}, 'Password'), oldPw, newPw,
              h('button', { class: 'btn', onclick: () => { send({ t: 'password', old: oldPw.value, new: newPw.value }); oldPw.value = newPw.value = ''; } }, 'Change password')),
            h('label', { class: 'field' }, h('span', {}, 'Username'), h('input', { value: me.username, disabled: true, title: 'Usernames can’t be changed' })),
            h('div', { class: 'field' }, h('div', { class: 'boxed-title' }, 'Profile picture color'),
              h('div', { class: 'row' }, h('div', { id: 'settingsAvatar', class: 'avatar big', style: `background:${me.avatar}` }, me.name[0].toUpperCase()),
                h('div', { class: 'swatches' }, AVATARS.map((c) => h('button', { class: 'swatch' + (me.avatar.toLowerCase() === c ? ' sel' : ''), style: `background:${c}`, title: c, onclick: () => set({ avatar: c }) })))),
              h('label', { class: 'field' }, h('small', {}, 'Color selector'), avColor))),
          h('section', {},
            h('div', { class: 'boxed-title' }, 'Status'),
            h('div', {}, statusOpt('online', 'var(--online)', 'Online'), statusOpt('offline', 'var(--offline)', 'Offline (appear offline)'), statusOpt('idle', 'var(--idle)', 'Idle / do not disturb')),
            h('div', { class: 'boxed-title' }, 'Background color'),
            bgOpt('white', 'white', 'White'), bgOpt('black', 'black', 'Black'),
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
            h('div', { class: 'muted' }, `Your record: ${me.stats.w} W · ${me.stats.l} L · ${me.stats.d} D`))),
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
  $('#signOutBtn').addEventListener('click', signOut);
  $('#membersBtn').addEventListener('click', membersModal);
  $('#requestGameBtn').addEventListener('click', () => gameModal());
  $('#onlineBtn').addEventListener('click', () => openModal(() => [modalHead(`${onlineUsers().length} Online`),
    h('ul', { class: 'list' }, onlineUsers().map((u) => personRow(u.username)))]));
  $('#menuBtn').addEventListener('click', () => $('#app').classList.toggle('menu-open'));
  $('#scrim').addEventListener('click', () => $('#app').classList.remove('menu-open'));

  GameDock.init({
    send: (id, input) => send({ t: 'gameInput', id, input }),
    leave: (id) => send({ t: 'gameLeave', id }),
    rematch: (game, opponent) => send({ t: 'gameInvite', game, to: opponent, room: S.current }),
    me: () => S.me,
  });

  connect();
})();
