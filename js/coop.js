/* =========================================================================
   coop.js — online co-op: the room, the roster, and keeping one host's
   world in front of everybody else.

   Shape of it:

     * Whoever opens the room is the HOST.  The host runs the ordinary
       simulation — the same code a solo match runs — and publishes a
       packed snapshot of it through room presence, which the platform
       coalesces and hands to newcomers by itself.
     * Everyone else is a CLIENT.  A client simulates nothing.  It renders
       the host's snapshot and sends what its player did as a command.
     * Each player has their own wallet and their own towers.  The base HP
       is shared, because the base is.

   Nothing arriving from the room is trusted: a command is a request, and
   the host re-checks it against its own world before acting.
   ========================================================================= */
(function () {
  const Coop = TD.Coop = {
    active: false,          // in a room
    role: null,             // 'host' | 'client'
    code: null,
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

  const me = () => cleanName(TD.Save.data.name);
  const myLevel = () => TD.levelFromXp(TD.Save.data.xp).level;

  /* ====================================================================
     Joining and leaving
     ==================================================================== */
  Coop.backend = async function () { return await TD.Net.connect(); };

  /* The platform refuses sends from view-only members.  Say so once rather
     than letting their clicks quietly do nothing. */
  let deniedOnce = false;
  TD.Net.onDenied = function () {
    if (deniedOnce) return;
    deniedOnce = true;
    TD.toast('You have view-only access to this page, so you can watch but not build', 'bad');
  };

  Coop.open = async function (code, asHost) {
    Coop.error = null;
    const backend = await TD.Net.connect();
    if (!backend) { Coop.error = 'This browser cannot open a co-op room.'; return false; }
    try {
      session = await TD.Net.join(code);
    } catch (e) {
      Coop.error = 'Could not open room ' + String(code).toUpperCase() + '.';
      return false;
    }
    Coop.active = true;
    Coop.announced = false;
    Coop.code = code;
    Coop.role = asHost ? 'host' : 'client';
    Coop.phase = 'lobby';
    Coop.hostPeer = null;
    Coop.me = TD.Net.selfPeer();

    unsubs.push(session.on('act', onAct));
    unsubs.push(session.on('ev', onEvent));
    unsubs.push(session.on('chat', onChat));
    unsubs.push(session.onPeers(onPeers));

    pushPresence(true);
    timer = setInterval(tick, TICK);
    return true;
  };

  Coop.host = function () { return Coop.open(TD.Net.makeCode(), true); };
  Coop.joinCode = function (code) { return Coop.open(String(code).toLowerCase(), false); };

  Coop.leave = async function () {
    if (timer) { clearInterval(timer); timer = null; }
    unsubs.forEach(u => { try { u(); } catch (e) { /* already gone */ } });
    unsubs = [];
    Coop.active = false; Coop.role = null; Coop.code = null; Coop.announced = false;
    Coop.players = []; Coop.slots = []; Coop.hostPeer = null; Coop.phase = 'lobby';
    session = null;
    TD.Chat.show(false);
    TD.Chat.clear();
    await TD.Net.leave();
    TD.UI.renderCoop && TD.UI.renderCoop();
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
    if (Coop.role === 'client' && !host && peers.length) {
      /* The host left.  Nobody inherits a running match: it ends. */
      if (TD.Battle.active && TD.Battle.remote) {
        TD.toast('The host left the match', 'bad');
        TD.Chat.system('The host left the match');
        TD.Game.toLobby();
      }
    }

    const list = peers.map(p => {
      const pr = p.presence || {};
      return {
        key: p.peer,
        isMe: !!p.isMe && !!p.sameTab,
        host: p.peer === host,
        name: cleanName(pr.n),
        level: Math.max(1, Math.min(999, Number(pr.lv) || 1)),
        x: Number(pr.x) || 0, z: Number(pr.z) || 0, ry: Number(pr.ry) || 0
      };
    }).filter(p => p.key);
    list.sort((a, b) => (b.host ? 1 : 0) - (a.host ? 1 : 0) || (a.key < b.key ? -1 : 1));

    /* Joins and leaves are announced by every page from what it already
       sees, so they cost no traffic and nobody can forge one. */
    if (Coop.announced) {
      const before = new Map(Coop.players.map(p => [p.key, p.name]));
      const after = new Map(list.map(p => [p.key, p.name]));
      after.forEach((n, k) => { if (!before.has(k)) TD.Chat.system(n + ' joined'); });
      before.forEach((n, k) => { if (!after.has(k)) TD.Chat.system(n + ' left'); });
    } else if (list.length) {
      Coop.announced = true;
    }
    Coop.players = list;

    if (Coop.isHost()) Coop.slots = list.map(p => p.key);

    const hp = peers.find(p => p.peer === host);
    if (hp && hp.presence) readHostPresence(hp.presence);

    const key = list.map(p => p.key + p.name + (p.host ? 'h' : '')).join('|') + Coop.role;
    if (key !== lastRosterKey) { lastRosterKey = key; TD.UI.renderCoop && TD.UI.renderCoop(); }

    if (TD.Battle.active) TD.Battle.syncAvatars(list.map(p => ({
      key: p.key, name: p.name, level: p.level, x: p.x, z: p.z, ry: p.ry
    })));
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
      if (was !== 'lobby' && TD.Battle.active && TD.Battle.remote) TD.Game.toLobby();
      return;
    }
    /* The host is in a match.  Join it. */
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
    if (B.active && B.player) {
      patch.x = Math.round(B.player.x * 10) / 10;
      patch.z = Math.round(B.player.z * 10) / 10;
      patch.ry = Math.round(B.player.dir * 100) / 100;
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
    if (d.k === 'start') Coop.lastSnapAt = performance.now();
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
  Coop.colorOf = function (peer) {
    const i = Coop.slots.indexOf(peer);
    const j = i >= 0 ? i : Math.max(0, Coop.players.findIndex(p => p.key === peer));
    return '#' + TD.Battle.playerColor(j).toString(16).padStart(6, '0');
  };
  Coop.myColor = function () { return Coop.colorOf(Coop.me); };

  /* ====================================================================
     Starting the match
     ==================================================================== */
  Coop.setMap = function (mapId, diffId) {
    if (!Coop.isHost()) return;
    Coop.map = mapId; Coop.diff = diffId;
    pushPresence(true);
    TD.UI.renderCoop && TD.UI.renderCoop();
  };

  Coop.start = function () {
    if (!Coop.isHost()) return;
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

  /* The host's own match ending or being left behind. */
  Coop.matchEnded = function () {
    if (Coop.isHost()) pushPresence(true);
  };
})();
