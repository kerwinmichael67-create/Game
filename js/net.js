/* =========================================================================
   net.js — transport for online co-op.

   Two interchangeable backends behind one tiny interface:

     "room"    the claude.ai artifact `room` capability.  Real online play:
               everyone who has the published page open can reach each other.
     "channel" BroadcastChannel.  Same browser, other tab.  Used when the
               room capability is absent (plain file://, GitHub Pages) and by
               the automated tests, which drive two pages at once.

   The interface is deliberately the shape `room` already has, so the room
   backend is nearly a pass-through and the fallback is the one doing work:

     connect()              -> 'room' | 'channel' | null
     join(code)             -> Promise<Session>
     Session.emit(topic, data)
     Session.on(topic, fn)  -> unsubscribe
     Session.presence(patch)
     Session.peers()        -> [{peer, isMe, presence, ...}]
     Session.onPeers(fn)    -> unsubscribe
     Session.connected()
     Session.leave()

   Everything a peer sends is untrusted: `data` is what some other page
   claims, never an instruction and never HTML.  The host validates every
   command against its own simulation before acting on it.
   ========================================================================= */
(function () {
  const Net = TD.Net = {
    backend: null,      // 'room' | 'channel' | null
    session: null,      // the joined Session, if any
    code: null,         // the room code we are in
    peer: null          // our own peer label
  };

  /* Room codes: 4 characters, no vowels and no look-alikes, so nobody has to
     spell "0 or O" down a call.  Matches the platform's name grammar. */
  const ALPHABET = '23456789bcdfghjkmnpqrstvwxz';
  Net.makeCode = function () {
    let s = '';
    for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    return s;
  };
  Net.validCode = c => typeof c === 'string' && /^[a-z0-9]{4,8}$/.test(c.toLowerCase());

  /* ====================================================================
     Backend 1 — the artifact `room` capability
     ==================================================================== */
  function roomSession(named) {
    return {
      kind: 'room',
      emit: (topic, data) => named.emit(topic, data).catch(e => {
        if (e && e.code === 'not_permitted') Net.onDenied && Net.onDenied(topic);
        return null;
      }),
      on: (topic, fn) => named.on(topic, fn, () => {}),
      presence: patch => named.presence(patch).catch(() => null),
      peers: () => named.peers(),
      onPeers: fn => named.onPeers(fn, () => {}),
      connected: () => named.connected(),
      leave: () => named.leave().catch(() => null)
    };
  }

  /* ====================================================================
     Backend 2 — BroadcastChannel

     Presence is not a transport primitive here, so we rebuild it: every
     page re-broadcasts its whole presence object on change and on a
     keepalive, and peers that go quiet for PEER_TTL are dropped.  Same
     contract as the real thing: absolute state, newcomers get everything,
     nothing persists.
     ==================================================================== */
  const KEEPALIVE = 900;
  const PEER_TTL = 3000;

  function channelSession(code) {
    const ch = new BroadcastChannel('td-coop-' + code);
    const me = Math.random().toString(36).slice(2, 10);
    const mine = { peer: me, isMe: true, sameTab: true, kind: 'viewer', guest: false, by: null, presence: {}, updatedAt: Date.now() };
    const others = new Map();                       // peer -> record
    const topicSubs = new Map();                    // topic -> Set<fn>
    const peerSubs = new Set();
    let snapshot = [mine];
    let alive = true;

    const rebuild = () => { snapshot = [mine].concat(Array.from(others.values())); };
    const firePeers = change => {
      rebuild();
      change.peers = snapshot;
      peerSubs.forEach(fn => { try { fn(change); } catch (e) { /* a listener must not break the room */ } });
    };

    const post = m => { try { ch.postMessage(m); } catch (e) { /* channel closed */ } };

    ch.onmessage = ev => {
      const m = ev.data;
      if (!m || !alive || m.peer === me) return;
      if (m.t === 'pres') {
        let rec = others.get(m.peer);
        const joined = !rec;
        if (!rec) {
          rec = { peer: m.peer, isMe: false, sameTab: false, kind: 'viewer', guest: false, by: null, presence: {}, updatedAt: 0 };
          others.set(m.peer, rec);
        }
        rec.presence = m.presence || {};
        rec.updatedAt = Date.now();
        rec.seen = Date.now();
        firePeers(joined ? { joined: [rec], left: [], updated: [] } : { joined: [], left: [], updated: [rec] });
        if (joined) post({ t: 'pres', peer: me, presence: mine.presence });   // answer a newcomer
      } else if (m.t === 'bye') {
        const rec = others.get(m.peer);
        if (rec) { others.delete(m.peer); firePeers({ joined: [], left: [rec], updated: [] }); }
      } else if (m.t === 'msg') {
        const subs = topicSubs.get(m.topic);
        if (!subs) return;
        const msg = { topic: m.topic, data: m.data, peer: m.peer, by: null, isMe: false, sameTab: false, kind: 'viewer', guest: false };
        subs.forEach(fn => { try { fn(msg); } catch (e) { /* ditto */ } });
      }
    };

    const beat = setInterval(() => {
      if (!alive) return;
      post({ t: 'pres', peer: me, presence: mine.presence });
      const now = Date.now();
      const gone = [];
      others.forEach(r => { if (now - (r.seen || 0) > PEER_TTL) gone.push(r); });
      if (gone.length) { gone.forEach(r => others.delete(r.peer)); firePeers({ joined: [], left: gone, updated: [] }); }
    }, KEEPALIVE);

    const bye = () => post({ t: 'bye', peer: me });
    window.addEventListener('pagehide', bye);

    post({ t: 'pres', peer: me, presence: {} });
    setTimeout(() => firePeers({ joined: [mine], left: [], updated: [] }), 0);

    return {
      kind: 'channel',
      emit: (topic, data) => { post({ t: 'msg', peer: me, topic: topic, data: data }); return Promise.resolve(); },
      on: (topic, fn) => {
        if (!topicSubs.has(topic)) topicSubs.set(topic, new Set());
        topicSubs.get(topic).add(fn);
        return () => { const s = topicSubs.get(topic); if (s) s.delete(fn); };
      },
      presence: patch => {
        const next = Object.assign({}, mine.presence);
        Object.keys(patch).forEach(k => { if (patch[k] === null) delete next[k]; else next[k] = patch[k]; });
        mine.presence = next; mine.updatedAt = Date.now();
        post({ t: 'pres', peer: me, presence: next });
        firePeers({ joined: [], left: [], updated: [mine] });
        return Promise.resolve();
      },
      peers: () => snapshot,
      onPeers: fn => { peerSubs.add(fn); return () => peerSubs.delete(fn); },
      connected: () => alive,
      leave: () => {
        alive = false; clearInterval(beat); bye();
        window.removeEventListener('pagehide', bye);
        try { ch.close(); } catch (e) { /* already closed */ }
        return Promise.resolve();
      },
      myPeer: me
    };
  }

  /* ====================================================================
     Connecting
     ==================================================================== */
  let roomNs = null;
  let probe = null;

  /* Resolves the backend name once.  `claude.use` may take a moment (and
     resolves null when this view cannot connect), so everything that needs
     the answer awaits this rather than reading a flag. */
  Net.connect = function () {
    if (probe) return probe;
    probe = (async () => {
      try {
        if (window.claude && typeof window.claude.use === 'function') {
          roomNs = await window.claude.use('room');
          if (roomNs) return (Net.backend = 'room');
        }
      } catch (e) { /* fall through to the local backend */ }
      if (typeof BroadcastChannel === 'function') return (Net.backend = 'channel');
      return (Net.backend = null);
    })();
    return probe;
  };

  Net.join = async function (code) {
    code = String(code || '').toLowerCase();
    if (!Net.validCode(code)) throw new Error('bad code');
    await Net.connect();
    if (Net.session) await Net.leave();

    if (Net.backend === 'room') {
      const named = await roomNs.join('td-' + code);
      Net.session = roomSession(named);
    } else if (Net.backend === 'channel') {
      Net.session = channelSession(code);
    } else {
      throw new Error('no transport');
    }
    Net.code = code;
    Net.peer = Net.session.myPeer || null;
    return Net.session;
  };

  Net.leave = async function () {
    const s = Net.session;
    Net.session = null; Net.code = null; Net.peer = null;
    if (s) await s.leave();
  };

  /* Where our own peer label comes from: the room backend only tells us
     through a delivered message, so we read it off the peer marked isMe. */
  Net.selfPeer = function () {
    if (Net.peer) return Net.peer;
    const s = Net.session; if (!s) return null;
    const me = s.peers().find(p => p.isMe && p.sameTab);
    if (me) Net.peer = me.peer;
    return Net.peer;
  };

  /* ====================================================================
     Packing — presence is 4 KiB, so the world goes over as fixed-width
     base36 records rather than JSON objects.
     ==================================================================== */
  const PAD = '0000000';
  function b36(n, w) {
    n = Math.round(n);
    if (!(n >= 0)) n = 0;
    const max = Math.pow(36, w) - 1;
    if (n > max) n = max;
    const s = n.toString(36);
    return s.length >= w ? s : PAD.slice(0, w - s.length) + s;
  }
  const un = (s, a, b) => parseInt(s.slice(a, b), 36);
  Net.b36 = b36;

  /* Stable indexes so a type travels as two characters. */
  let ENEMY_IDS = null, TOWER_IDS = null;
  function enemyIds() { return ENEMY_IDS || (ENEMY_IDS = Object.keys(TD.ENEMIES).sort()); }
  function towerIds() { return TOWER_IDS || (TOWER_IDS = Object.keys(TD.TOWERS).sort()); }
  Net.enemyIndex = id => enemyIds().indexOf(id);
  Net.enemyAt = i => enemyIds()[i];
  Net.towerIndex = id => towerIds().indexOf(id);
  Net.towerAt = i => towerIds()[i];

  /* One enemy = 11 chars: id(3) type(2) path(1) dist(3) hp(1) flags(1).
     Distance carries 1/8 of a unit, which is finer than the eye can read at
     the camera's distance, and position is derived from it exactly the way
     the host derives it — same path data, same function. */
  const D_SCALE = 8;
  Net.packEnemies = function (list, cap) {
    const out = [];
    const n = Math.min(list.length, cap || 220);
    for (let i = 0; i < n; i++) {
      const e = list[i];
      let fl = 0;
      if (e.freezeT > 0) fl |= 1;
      if (e.slow > 0) fl |= 2;
      if (e.burnT > 0) fl |= 4;
      if (e.poisonT > 0) fl |= 8;
      if (e.blocked) fl |= 16;
      out.push(
        b36(e.nid, 3) +
        b36(Net.enemyIndex(e.def.id), 2) +
        b36(e.pathIdx, 1) +
        b36(e.d * D_SCALE, 3) +
        b36(TD.clamp(e.hp / e.maxHp, 0, 1) * 35, 1) +
        b36(fl, 1));
    }
    return out.join('');
  };
  Net.unpackEnemies = function (s) {
    const out = [];
    if (!s) return out;
    for (let i = 0; i + 11 <= s.length; i += 11) {
      const r = s.slice(i, i + 11);
      out.push({
        nid: un(r, 0, 3),
        type: Net.enemyAt(un(r, 3, 5)),
        pathIdx: un(r, 5, 6),
        d: un(r, 6, 9) / D_SCALE,
        hp: un(r, 9, 10) / 35,
        flags: un(r, 10, 11)
      });
    }
    return out;
  };

  /* One tower = 10 chars: id(2) def(2) level(1) x(2) z(2) owner(1).
     Towers snap to a 2-unit grid, so x*6 is an integer and survives the
     round trip exactly. */
  const XY_OFF = 95, XY_SCALE = 6;
  Net.packTowers = function (list) {
    const out = [];
    for (let i = 0; i < list.length && i < 80; i++) {
      const t = list[i];
      out.push(
        b36(t.nid, 2) +
        b36(Net.towerIndex(t.def.id), 2) +
        b36(t.level, 1) +
        b36((t.x + XY_OFF) * XY_SCALE, 2) +
        b36((t.z + XY_OFF) * XY_SCALE, 2) +
        b36(t.slot, 1));
    }
    return out.join('');
  };
  Net.unpackTowers = function (s) {
    const out = [];
    if (!s) return out;
    for (let i = 0; i + 10 <= s.length; i += 10) {
      const r = s.slice(i, i + 10);
      out.push({
        nid: un(r, 0, 2),
        type: Net.towerAt(un(r, 2, 4)),
        level: un(r, 4, 5),
        x: un(r, 5, 7) / XY_SCALE - XY_OFF,
        z: un(r, 7, 9) / XY_SCALE - XY_OFF,
        slot: un(r, 9, 10)
      });
    }
    return out;
  };
})();
