/* =========================================================================
   coop.js — servers, the roster, and keeping one host's world in front of
   everybody else.

   A SERVER is just a named room, and the game joins one by itself at
   startup — Server 1 unless you switched — so two people who each open the
   page are standing in the same plaza without arranging anything.  Servers
   2-8 are there to move to, and a private room behind a code is the same
   thing under a name only your friends know.

   Nobody is the host of a plaza.  A host exists only while a match runs:
   whoever pressed Deploy claims the seat and gives it up at the end.

   Shape of it:

     * The HOST runs the ordinary simulation — the same code a solo match
       runs — and publishes a packed snapshot of it through room presence,
       which the platform coalesces and hands to newcomers by itself.
     * Everyone else is a CLIENT.  A client simulates nothing.  It renders
       the host's snapshot and sends what its player did as a command.
     * Each player has their own wallet and their own towers.  The base HP
       is shared, because the base is.

   Nothing arriving from the room is trusted: a command is a request, and
   the host re-checks it against its own world before acting.
   ========================================================================= */
(function () {
  const Coop = TD.Coop = {
    active: false,          // in a server
    role: null,             // 'host' while a match runs, else 'client'
    code: null,             // the room name we are in
    server: null,           // {kind:'public', n} | {kind:'private', code}
    me: null,               // our own peer label
    hostPeer: null,
    players: [],            // roster, host first
    slots: [],              // peer labels by slot index
    map: 'greenway', diff: 'standard',
    phase: 'lobby',         // 'lobby' | in-match phase reported by the host
    lastSnapAt: 0,
    error: null
  };

  const TICK = 1000 / 15;               // world updates per second
  const MAX_PRESENCE = 3600;            // leave room under the platform's 4 KiB
  let session = null;
  let unsubs = [];
  let timer = null;
  let lastRosterKey = '';
  const knownNames = new Map();

  const me = () => cleanName(TD.Save.data.name);
  const myLevel = () => TD.levelFromXp(TD.Save.data.xp).level;

  /* ====================================================================
     Joining and leaving
     ==================================================================== */
  Coop.backend = async function () { return await TD.Net.connect(); };

  /* A room can end under us — a reconnect the platform could not carry.
     Try once to get back into the same server; if that fails, say so
     instead of leaving a plaza that will never update again. */
  let recovering = false;
  TD.Net.onRoomError = async function (code) {
    if (!Coop.active || recovering) return;
    recovering = true;
    const sv = Coop.server;
    const fatal = code === 'not_permitted' || code === 'not_granted' || code === 'revoked';
    await Coop.leave();
    /* after the leave, which clears the log — otherwise the one message
       explaining what happened is the first thing wiped */
    TD.Chat.system(fatal ? 'Disconnected from the server' : 'Connection lost — reconnecting…');
    if (!fatal && sv) {
      const ok = await Coop.open(sv);
      if (ok) TD.Chat.system('Back on ' + Coop.serverName());
      else Coop.error = joinError(code, sv);
    } else {
      Coop.error = joinError(code, sv || { kind: 'public', n: 1 });
    }
    recovering = false;
    TD.UI.afterServerChange && TD.UI.afterServerChange();
  };

  /* The platform refuses sends from view-only members.  Say so once rather
     than letting their clicks quietly do nothing. */
  let deniedOnce = false;
  TD.Net.onDenied = function () {
    if (deniedOnce) return;
    deniedOnce = true;
    TD.toast('You have view-only access to this page, so you can watch but not build', 'bad');
  };

  Coop.SERVERS = 8;
  Coop.serverName = function (sv) {
    sv = sv || Coop.server;
    if (!sv) return '—';
    return sv.kind === 'private' ? 'Private ' + sv.code.toUpperCase() : 'Server ' + sv.n;
  };
  const roomFor = sv => sv.kind === 'private' ? 'td-' + sv.code : 'plaza-' + sv.n;

  /* Why a join did not work, in words a player can act on. */
  function joinError(code, sv) {
    if (code === 'not_permitted')
      return 'This page cannot use servers — you may have view-only access to it.';
    if (code === 'limit_reached')
      return 'Too many rooms open on this page. Reload and try again.';
    return 'Could not reach ' + Coop.serverName(sv) + '. Try Reconnect.';
  }

  /* Joins are serialised: two clicks on two servers used to interleave
     their leave and join, leaving listeners on an abandoned room and the
     panel naming a server we were not actually in. */
  let joinSeq = 0;

  /* Join a server.  Nobody is host here; the seat is claimed on Deploy. */
  Coop.open = async function (sv) {
    const seq = ++joinSeq;
    Coop.error = null;
    const backend = await TD.Net.connect();
    if (seq !== joinSeq) return false;                 // superseded while connecting
    if (!backend) { Coop.error = 'This browser cannot reach other players.'; return false; }
    const room = roomFor(sv);
    let joined;
    try {
      joined = await TD.Net.join(room);
    } catch (e) {
      if (seq !== joinSeq) return false;
      Coop.error = joinError(e && e.code, sv);
      return false;
    }
    if (seq !== joinSeq) { await TD.Net.leave(); return false; }
    session = joined;
    Coop.active = true;
    Coop.announced = false;
    Coop.waiting = false;
    Coop.server = sv;
    Coop.code = room;
    Coop.role = 'client';
    Coop.phase = 'lobby';
    Coop.hostPeer = null;
    Coop.me = TD.Net.selfPeer();

    /* `connected()` is false for about a second at load and blips briefly
       when the platform refreshes the socket, so only a drop that persists
       counts as one — otherwise the banner cries wolf on every join. */
    Coop.online = true;
    if (session.onConnection) {
      let dropTimer = null;
      unsubs.push(session.onConnection(up => {
        if (up) {
          if (dropTimer) { clearTimeout(dropTimer); dropTimer = null; }
          if (Coop.online !== true) { Coop.online = true; TD.UI.tickRoomPill && TD.UI.tickRoomPill(); }
          return;
        }
        if (dropTimer) return;
        dropTimer = setTimeout(() => {
          dropTimer = null;
          Coop.online = false;
          TD.UI.tickRoomPill && TD.UI.tickRoomPill();
        }, 2500);
      }));
      unsubs.push(() => { if (dropTimer) clearTimeout(dropTimer); });
    }
    unsubs.push(session.on('act', onAct));
    unsubs.push(session.on('ev', onEvent));
    unsubs.push(session.on('chat', onChat));
    unsubs.push(session.onPeers(onPeers));

    pushPresence(true);
    timer = setInterval(tick, TICK);
    return true;
  };

  /* What the game does by itself at startup. */
  Coop.autoJoin = async function () {
    if (Coop.active) return true;
    const want = TD.Save.data.settings.server;
    const n = (typeof want === 'number' && want >= 1 && want <= Coop.SERVERS) ? want : 1;
    const ok = await Coop.open({ kind: 'public', n: n });
    if (ok) TD.Chat.system('Joined ' + Coop.serverName());
    TD.UI.afterServerChange && TD.UI.afterServerChange();
    return ok;
  };

  /* Switching converges on the LAST server asked for.  Clicking three
     buttons quickly used to leave you on whichever join happened to win
     the race; now each request just updates the target and the one switch
     in flight keeps going until it has landed on it. */
  let switching = false;
  Coop.switchTo = async function (sv) {
    if (TD.Battle.active) { TD.Audio.error(); TD.toast('Leave the match first', 'bad'); return false; }
    Coop.wanted = sv;
    if (switching) return true;
    switching = true;
    let ok = true;
    try {
      while (Coop.wanted && (!Coop.server || roomFor(Coop.server) !== roomFor(Coop.wanted))) {
        const target = Coop.wanted;
        await Coop.leave();
        ok = await Coop.open(target);
        if (!ok) break;
        if (target.kind === 'public') { TD.Save.data.settings.server = target.n; TD.Save.save(); }
        if (Coop.wanted === target) TD.Chat.system('Moved to ' + Coop.serverName());
      }
    } finally {
      switching = false;
    }
    TD.UI.afterServerChange && TD.UI.afterServerChange();
    return ok;
  };

  Coop.joinServer = n => Coop.switchTo({ kind: 'public', n: n });
  Coop.joinPrivate = code => Coop.switchTo({ kind: 'private', code: String(code).toLowerCase() });
  Coop.newPrivate = () => Coop.switchTo({ kind: 'private', code: TD.Net.makeCode() });

  Coop.leave = async function () {
    joinSeq++;
    if (timer) { clearInterval(timer); timer = null; }
    unsubs.forEach(u => { try { u(); } catch (e) { /* already gone */ } });
    unsubs = [];
    Coop.active = false; Coop.role = null; Coop.code = null; Coop.announced = false;
    Coop.server = null;
    Coop.players = []; Coop.slots = []; Coop.hostPeer = null; Coop.phase = 'lobby';
    session = null;
    knownNames.clear();
    TD.Lobby.clearAvatars();
    TD.Chat.show(false);
    TD.Chat.clear();
    await TD.Net.leave();
    TD.UI.renderCoop && TD.UI.renderCoop();
    TD.UI.tickRoomPill && TD.UI.tickRoomPill();
  };

  Coop.isHost = () => Coop.active && Coop.role === 'host';
  Coop.count = () => Coop.players.length;

  /* ====================================================================
     Roster

     Everyone publishes their own name and position; the host publishes the
     slot order so tower ownership can travel as a single character.
     ==================================================================== */
  function onPeers() {
    if (!session) return;
    const peers = session.peers();
    if (!Coop.me) Coop.me = TD.Net.selfPeer();

    /* Exactly one host.  If two pages both think they are it — both opened
       the same code at once — the lower peer label keeps it. */
    const claims = peers.filter(p => p.presence && p.presence.r === 'h').map(p => p.peer).sort();
    const host = claims[0] || null;
    Coop.hostPeer = host;
    if (Coop.role === 'host' && host && host !== Coop.me) {
      Coop.role = 'client';                       // we lost the tie; stand down
      pushPresence(true);
    }
    /* With no host there is no match, so anyone who was waiting for the
       next one is free: the host releases the seat when it returns to the
       plaza, and then nobody publishes the state that used to clear this. */
    if (!host && Coop.waiting) {
      Coop.waiting = false;
      TD.UI.tickRoomPill && TD.UI.tickRoomPill();
      TD.UI.renderCoop && TD.UI.renderCoop();
    }

    /* A plaza has no host at all — one exists only while a match runs, and
       nobody inherits a running match: if the host goes, it ends. */
    if (Coop.role === 'client' && !host && TD.Battle.active && TD.Battle.remote) {
      TD.toast('The host left the match', 'bad');
      TD.Chat.system('The host left the match');
      TD.Game.toLobby();
    }

    const list = peers.map(p => {
      const pr = p.presence || {};
      return {
        key: p.peer,
        isMe: !!p.isMe && !!p.sameTab,
        host: p.peer === host,
        name: cleanName(pr.n),
        level: Math.max(1, Math.min(999, Number(pr.lv) || 1)),
        x: Number(pr.x) || 0, z: Number(pr.z) || 0, ry: Number(pr.ry) || 0,
        scene: pr.sc === 'b' ? 'b' : (pr.sc === 'l' ? 'l' : ''),
        named: typeof pr.n === 'string'
      };
    }).filter(p => p.key);
    list.sort((a, b) => (b.host ? 1 : 0) - (a.host ? 1 : 0) || (a.key < b.key ? -1 : 1));

    /* Joins and leaves are announced by every page from what it already
       sees, so they cost no traffic and nobody can forge one. */
    list.forEach(p => {
      if (!p.named || p.isMe) return;              // wait until their name has arrived
      if (knownNames.has(p.key)) { knownNames.set(p.key, p.name); return; }
      knownNames.set(p.key, p.name);
      if (Coop.announced) TD.Chat.system(p.name + ' joined');
    });
    const here = new Set(list.map(p => p.key));
    knownNames.forEach((n, k) => {
      if (here.has(k)) return;
      knownNames.delete(k);
      if (Coop.announced) TD.Chat.system(n + ' left');
    });
    if (!Coop.announced && list.length) Coop.announced = true;
    Coop.players = list;

    /* Slot order is fixed for the length of a match: it is what tower
       ownership and the wallet list are indexed by, and claiming the host
       seat reorders the roster (host first), which would otherwise shift
       every slot under the clients' feet. */
    if (Coop.isHost() && !TD.Battle.active) Coop.slots = list.map(p => p.key);

    const hp = peers.find(p => p.peer === host);
    if (hp && hp.presence) readHostPresence(hp.presence);

    const key = list.map(p => p.key + p.name + (p.host ? 'h' : '')).join('|') + Coop.role;
    if (key !== lastRosterKey) { lastRosterKey = key; TD.UI.renderCoop && TD.UI.renderCoop(); }
    TD.UI.tickRoomPill && TD.UI.tickRoomPill();

    const av = list.map(p => ({
      key: p.key, name: p.name, level: p.level, x: p.x, z: p.z, ry: p.ry,
      isMe: p.isMe, scene: p.scene, slot: Math.max(0, list.indexOf(p))
    }));
    if (TD.Battle.active) {
      TD.Battle.syncAvatars(av.filter(p => p.scene !== 'l'));
      TD.Lobby.clearAvatars();
    } else if (TD.Lobby.active) {
      /* Only the people who are also standing in the plaza. */
      TD.Lobby.syncAvatars(av.filter(p => p.scene !== 'b'));
    }
  }

  /* Another page chose this string; show it, never trust it. */
  function cleanName(v) {
    let s = typeof v === 'string' ? v : '';
    s = s.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').trim().slice(0, 16);
    return s || 'Player';
  }

  /* ====================================================================
     What the host publishes, and what a client does with it
     ==================================================================== */
  function readHostPresence(pr) {
    if (Coop.role === 'host') return;
    if (typeof pr.mp === 'string') Coop.map = pr.mp;
    if (typeof pr.df === 'string') Coop.diff = pr.df;
    if (typeof pr.S === 'string' && pr.S) Coop.slots = pr.S.split('.');
    const st = typeof pr.st === 'string' ? pr.st : 'lobby';
    const was = Coop.phase;
    Coop.phase = st;

    if (st === 'lobby') {
      if (Coop.waiting) { Coop.waiting = false; TD.UI.tickRoomPill && TD.UI.tickRoomPill(); }
      if (was !== 'lobby' && TD.Battle.active && TD.Battle.remote) TD.Game.toLobby();
      return;
    }
    /* The host is in a match.  Join it — but only if we are one of its
       players.  Slots are fixed when Deploy is pressed, so somebody who
       arrives afterwards has no wallet and could place nothing: they used
       to be dropped into a match they could only watch, with an empty HUD.
       They wait in the plaza for the next one instead. */
    const mine = !Coop.me || Coop.slots.indexOf(Coop.me) >= 0;
    if (!mine) {
      if (!Coop.waiting) {
        Coop.waiting = true;
        TD.Chat.system('A match is already running here — you are in for the next one');
        TD.UI.tickRoomPill && TD.UI.tickRoomPill();
      }
      return;
    }
    Coop.waiting = false;
    if (TD.Battle.active && TD.Battle.remote && TD.Battle.map.id !== Coop.map) {
      TD.Game.toLobby();                       // they moved on to another map
    }
    if (!TD.Battle.active || !TD.Battle.remote) {
      if (!TD.mapById(Coop.map) || !TD.diffById(Coop.diff)) return;
      enterAsClient();
    }
    if (TD.Battle.active && TD.Battle.remote) {
      Coop.lastSnapAt = performance.now();
      TD.Battle.applySnapshot({
        st: st,
        hp: Number(pr.hp) || 0,
        mhp: Number(pr.mhp) || 100,
        w: Number(pr.w) || 0,
        pt: Number(pr.pt) || 0,
        sp: Number(pr.sp) || 1,
        paused: !!pr.pa,
        won: !!pr.won,
        slots: typeof pr.S === 'string' && pr.S ? pr.S.split('.') : Coop.slots,
        wallets: typeof pr.W === 'string' && pr.W ? pr.W.split('.').map(Number) : null,
        E: typeof pr.E === 'string' ? pr.E : '',
        T: typeof pr.T === 'string' ? pr.T : ''
      });
      if (typeof pr.S === 'string' && pr.S) Coop.slots = pr.S.split('.');
    }
  }

  function enterAsClient() {
    Coop.me = Coop.me || TD.Net.selfPeer() || 'me';
    const load = TD.Save.data.loadout.filter(Boolean);
    TD.Game.startMatch(Coop.map, Coop.diff, load.length ? load : ['recruit'], {
      net: netHandle(), me: Coop.me, slots: Coop.slots.length ? Coop.slots : [Coop.me]
    });
  }

  function netHandle() {
    return {
      role: Coop.role,
      send: cmd => { if (session) session.emit('act', cmd); }
    };
  }

  /* ====================================================================
     The heartbeat: our own presence, and the world if we are the host
     ==================================================================== */
  function pushPresence(full) {
    if (!session) return;
    const B = TD.Battle;
    const patch = {
      r: Coop.role === 'host' ? 'h' : 'c',
      n: me(), lv: myLevel()
    };
    const who = (B.active && B.player) ? B.player : (TD.Lobby.active && TD.Lobby.player ? TD.Lobby.player : null);
    if (who) {
      patch.x = Math.round(who.x * 10) / 10;
      patch.z = Math.round(who.z * 10) / 10;
      patch.ry = Math.round(who.dir * 100) / 100;
      patch.sc = B.active ? 'b' : 'l';         // which scene we are standing in
    }
    if (Coop.role === 'host') Object.assign(patch, hostFields());
    else if (full) { patch.st = null; patch.E = null; patch.T = null; patch.W = null; patch.S = null; }
    session.presence(patch);
  }

  function hostFields() {
    const B = TD.Battle;
    const f = { mp: Coop.map, df: Coop.diff, S: Coop.slots.join('.') };
    if (!B.active || B.remote) { f.st = 'lobby'; f.E = ''; f.T = ''; f.W = ''; return f; }
    f.st = B.phase;
    f.hp = Math.ceil(B.hp);
    f.mhp = B.maxHp;
    f.w = B.wave;
    f.pt = Math.round(B.prepT * 10) / 10;
    f.sp = B.speed;
    f.pa = B.paused ? 1 : 0;
    f.W = Coop.slots.map(k => Math.floor(B.wallets[k] || 0)).join('.');
    f.T = TD.Net.packTowers(B.towers);
    if (B.phase === 'over') f.won = B.wonMatch ? 1 : 0;

    /* Enemies are what can overflow presence, so the ones nearest the base
       — the ones that matter — are packed first and the tail is dropped. */
    const sorted = B.enemies.slice().sort((a, b) => b.d - a.d);
    let cap = sorted.length;
    f.E = TD.Net.packEnemies(sorted, cap);
    while (cap > 0 && JSON.stringify(f).length > MAX_PRESENCE) {
      cap = Math.max(0, cap - Math.max(8, Math.ceil(cap * 0.15)));
      f.E = TD.Net.packEnemies(sorted, cap);
    }
    return f;
  }

  function tick() {
    if (!Coop.active || !session) return;
    pushPresence(false);
    /* A client that has heard nothing for a while has lost the host. */
    if (Coop.role === 'client' && TD.Battle.active && TD.Battle.remote &&
      Coop.lastSnapAt && performance.now() - Coop.lastSnapAt > 8000) {
      TD.toast('Lost the host', 'bad');
      TD.Game.toLobby();
      Coop.lastSnapAt = 0;
    }
  }

  /* ====================================================================
     Commands from clients — host only
     ==================================================================== */
  function onAct(msg) {
    if (msg.isMe && msg.sameTab) return;
    if (!Coop.isHost()) return;
    const B = TD.Battle;
    if (!B.active || B.remote || B.phase === 'over') return;
    const key = msg.peer, c = msg.data;
    if (!key || !c || typeof c !== 'object') return;
    if (B.wallets[key] === undefined) return;          // not a player in this match

    switch (c.k) {
      case 'place': {
        const def = TD.TOWERS[String(c.d)];
        const x = Number(c.x), z = Number(c.z);
        if (!def || !isFinite(x) || !isFinite(z)) return;
        B.placeFor(key, def, Math.round(x / 2) * 2, Math.round(z / 2) * 2);
        break;
      }
      case 'up': { const t = B.towerByNid(Number(c.n)); if (t) B.upgrade(t, key); break; }
      case 'sell': { const t = B.towerByNid(Number(c.n)); if (t) B.sell(t, key); break; }
      case 'ability': { const t = B.towerByNid(Number(c.n)); if (t) B.useAbility(t, key); break; }
      case 'mode': {
        const t = B.towerByNid(Number(c.n));
        if (t && t.owner === key) t.mode = Math.max(0, Math.min(5, Number(c.m) | 0));
        break;
      }
      case 'wave': if (B.phase === 'prep') B.startWave(true); break;
      case 'perk': {
        const id = String(c.p || '');
        /* Only from the set this wave actually offered, so a client cannot
           hand itself a perk it was never shown.  This is the table's offer,
           not the host's own modal, which the host may already have closed. */
        if (B.draftIds && B.draftIds.indexOf(id) >= 0) B.pickPerk(id, key);
        break;
      }
      case 'cmd': {
        const a = String(c.a || '');
        const x = Number(c.x), z = Number(c.z);
        if (!B.CMD[a] || !isFinite(x) || !isFinite(z)) return;
        if (Math.abs(x) > 120 || Math.abs(z) > 120) return;
        B.useCommand(a, key, x, z);
        break;
      }
      default: break;
    }
  }

  /* ====================================================================
     Announcements — rare, so an event topic is the right place
     ==================================================================== */
  function onEvent(msg) {
    const d = msg.data || {};
    if (msg.isMe && msg.sameTab) return;
    if (d.k === 'wave' && TD.Battle.active) TD.UI.waveBanner('WAVE ' + (Number(d.n) || 0), String(d.s || '').slice(0, 80));
    if (d.k === 'draft' && TD.Battle.active && TD.Battle.remote) {
      const ids = (Array.isArray(d.ids) ? d.ids : []).map(String).filter(TD.perkById).slice(0, 3);
      if (ids.length) {
        TD.Battle.draft = { wave: Number(d.w) || TD.Battle.wave, ids: ids };
        TD.UI.showDraft(ids, TD.Battle.draft.wave);
      }
    }
    if (d.k === 'cmdfx' && TD.Battle.active && TD.Battle.remote && d.by !== TD.Battle.me) {
      TD.Battle.showCommandFx(String(d.a || ''), Number(d.x), Number(d.z));
    }
    if (d.k === 'start') Coop.lastSnapAt = performance.now();
    if (d.k === 'end' && TD.Battle.active && TD.Battle.remote) {
      const st = TD.Battle.stats;
      st.kills = Math.max(0, Number(d.kills) || 0);
      st.leaked = Math.max(0, Number(d.leaked) || 0);
      st.damage = Math.max(0, Number(d.dmg) || 0);
    }
  }

  Coop.announce = function (data) { if (session) session.emit('ev', data); };

  function onChat(msg) {
    if (msg.isMe && msg.sameTab) return;      // our own line is already on screen
    const d = msg.data || {};
    const p = Coop.players.find(q => q.key === msg.peer);
    TD.Chat.receive(msg.peer, p ? p.name : cleanName(d.n), Coop.colorOf(msg.peer), d);
  }

  /* Chat owns the wording and the rate limiting; we only carry it. */
  Coop.emitChat = function (data) {
    if (!session) return;
    session.emit('chat', Object.assign({ n: me() }, data));
  };
  Coop.say = function (text) { TD.Chat.say(text); };

  Coop.myName = function () { return me(); };
  Coop.refreshIdentity = function () { if (session) pushPresence(true); };
  /* Everyone derives a player's colour from the same ordering — the roster
     order in a room, the match's slot order once one is running — so your
     colour is the same on every screen. */
  Coop.slotOf = function (peer) {
    if (TD.Battle.active && TD.Battle.slots.length) {
      const i = TD.Battle.slots.indexOf(peer);
      if (i >= 0) return i;
    }
    const j = Coop.players.findIndex(p => p.key === peer);
    return j >= 0 ? j : 0;
  };
  Coop.colorOf = function (peer) {
    return '#' + TD.Battle.playerColor(Coop.slotOf(peer)).toString(16).padStart(6, '0');
  };
  Coop.myColor = function () { return Coop.colorOf(Coop.me); };

  /* ====================================================================
     Starting the match
     ==================================================================== */
  Coop.setMap = function (mapId, diffId) {
    if (!Coop.active) return;
    Coop.map = mapId; Coop.diff = diffId;
    pushPresence(true);
    TD.UI.renderCoop && TD.UI.renderCoop();
  };

  Coop.start = function () {
    if (!Coop.active) return;
    Coop.role = 'host';                        // claimed for the match's length
    const load = TD.Save.data.loadout.filter(Boolean);
    if (!load.length) { TD.Audio.error(); TD.toast('Pick at least one tower in Loadout', 'bad'); return; }
    Coop.me = Coop.me || TD.Net.selfPeer() || 'me';
    Coop.slots = Coop.players.map(p => p.key);
    TD.Game.startMatch(Coop.map, Coop.diff, load, {
      net: netHandle(), me: Coop.me, slots: Coop.slots
    });
    Coop.announce({ k: 'start' });
    TD.Chat.system('Match started — ' + (TD.mapById(Coop.map) || {}).name);
    pushPresence(true);
  };

  /* Back in the plaza: give the host seat up so the server has none again. */
  Coop.matchEnded = function () {
    if (!Coop.active) return;
    if (Coop.role === 'host' && !TD.Battle.active) Coop.role = 'client';
    pushPresence(true);
  };
})();
