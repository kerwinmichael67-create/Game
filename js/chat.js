/* =========================================================================
   chat.js — team chat.

   One panel, two homes: it docks inside the co-op room panel before the
   match so people can sort out who is bringing what, and floats over the
   battlefield once the match starts.  Collapsing it keeps an unread count.

   Three kinds of line:

     say      something a player typed
     quick    one of the canned phrases, sent as an index rather than text,
              so what arrives is a number and the phrase is drawn from this
              page's own table
     system   joins, leaves, waves, results — worked out locally by every
              page from what it already knows, so they cost no traffic

   Text from other players is inserted with textContent, never innerHTML,
   and both ends are rate limited: the room's send budget is shared with
   the commands that actually run the match, so chat must not crowd them
   out.
   ========================================================================= */
(function () {
  const Chat = TD.Chat = {
    lines: [],
    open: true,
    unread: 0,
    ready: false
  };

  const MAX_LINES = 120;              // kept in memory
  const MAX_LEN = 120;                // per message
  const SEND_GAP = 800;               // ms between our own messages
  const BURST_N = 5, BURST_MS = 8000; // our own burst allowance
  const PEER_N = 6, PEER_MS = 5000;   // what we accept from one peer

  /* Canned phrases.  Sent as an index; never as text. */
  const QUICK = Chat.QUICK = [
    'Hello!', 'Nice one!', 'Thanks!', 'Sorry!',
    'Need cash', 'Watch the air', 'Start the wave', 'Wait for me',
    'Defend the front', 'Good game'
  ];

  let elRoot, elLog, elInput, elBadge, elQuick, elTitle;
  let myTimes = [], lastSend = 0;
  const peerTimes = new Map();

  const $ = s => document.querySelector(s);

  /* ------------------------------------------------------------------ */
  Chat.init = function () {
    elRoot = $('#chat');
    if (!elRoot) return;
    elLog = $('#chat-log');
    elInput = $('#chat-input');
    elBadge = $('#chat-badge');
    elQuick = $('#chat-quick');
    elTitle = $('#chat-title');

    QUICK.forEach((phrase, i) => {
      const b = document.createElement('button');
      b.className = 'cq';
      b.textContent = phrase;
      b.onclick = () => { Chat.sendQuick(i); elInput.blur(); };
      elQuick.appendChild(b);
    });

    $('#chat-toggle').onclick = () => Chat.setOpen(!Chat.open);
    $('#chat-send').onclick = () => Chat.submit();
    $('#chat-quick-btn').onclick = () => {
      elQuick.classList.toggle('shown');
      $('#chat-quick-btn').classList.toggle('on', elQuick.classList.contains('shown'));
    };

    elInput.addEventListener('keydown', e => {
      e.stopPropagation();                       // the battle owns these keys otherwise
      if (e.key === 'Enter') Chat.submit();
      if (e.key === 'Escape') { elInput.value = ''; elInput.blur(); }
    });
    elInput.addEventListener('focus', () => { Chat.setOpen(true); });

    Chat.ready = true;
    Chat.render();
  };

  /* Where the panel lives right now.  `null` floats it over the battle. */
  Chat.dock = function (parent) {
    if (!elRoot) return;
    const host = parent || document.getElementById('battle-hud');
    if (host && elRoot.parentNode !== host) host.appendChild(elRoot);
    elRoot.classList.toggle('docked', !!parent);
    if (parent) Chat.setOpen(true);
    Chat.scroll();
  };

  Chat.show = function (on) {
    if (!elRoot) return;
    elRoot.classList.toggle('hidden', !on);
    if (on) Chat.scroll();
  };

  Chat.setOpen = function (on) {
    Chat.open = !!on;
    if (!elRoot) return;
    elRoot.classList.toggle('collapsed', !Chat.open);
    $('#chat-toggle').textContent = Chat.open ? '–' : '+';
    if (Chat.open) { Chat.unread = 0; Chat.badge(); Chat.scroll(); }
  };

  Chat.badge = function () {
    if (!elBadge) return;
    elBadge.textContent = Chat.unread > 9 ? '9+' : String(Chat.unread);
    elBadge.classList.toggle('hidden', Chat.unread === 0);
  };

  Chat.focus = function () {
    if (!elInput) return;
    Chat.setOpen(true);
    elInput.focus();
  };

  Chat.clear = function () {
    Chat.lines = []; Chat.unread = 0;
    peerTimes.clear();
    Chat.badge(); Chat.render();
  };

  /* ------------------------------------------------------------------
     Adding lines
     ------------------------------------------------------------------ */
  function stamp() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  Chat.push = function (line) {
    line.at = stamp();
    Chat.lines.push(line);
    while (Chat.lines.length > MAX_LINES) Chat.lines.shift();
    if (!Chat.open && line.kind !== 'system') { Chat.unread++; Chat.badge(); }
    Chat.render();
    if (line.kind !== 'system' && !line.mine) TD.Audio.ui();
  };

  /* A local note nobody sent: joins, waves, results. */
  Chat.system = function (text) {
    Chat.push({ kind: 'system', text: String(text).slice(0, 90) });
  };

  Chat.render = function () {
    if (!elLog) return;
    elLog.innerHTML = '';
    const from = Math.max(0, Chat.lines.length - 60);
    for (let i = from; i < Chat.lines.length; i++) {
      const l = Chat.lines[i];
      const row = document.createElement('div');
      row.className = 'chat-row-line ' + l.kind + (l.mine ? ' mine' : '');
      if (l.kind === 'system') {
        row.textContent = l.text;                          // never from the wire verbatim
      } else {
        const t = document.createElement('span');
        t.className = 'ct'; t.textContent = l.at;
        const b = document.createElement('b');
        b.textContent = l.who + ':';
        if (l.color) b.style.color = l.color;
        row.appendChild(t); row.appendChild(b);
        row.appendChild(document.createTextNode(' ' + l.text));   // text, never markup
      }
      elLog.appendChild(row);
    }
    Chat.scroll();
  };

  Chat.scroll = function () { if (elLog) elLog.scrollTop = elLog.scrollHeight; };

  /* ------------------------------------------------------------------
     Sending
     ------------------------------------------------------------------ */
  function maySend() {
    const now = Date.now();
    if (now - lastSend < SEND_GAP) return false;
    myTimes = myTimes.filter(t => now - t < BURST_MS);
    if (myTimes.length >= BURST_N) { TD.toast('Easy on the chat', 'bad'); return false; }
    lastSend = now; myTimes.push(now);
    return true;
  }

  Chat.submit = function () {
    if (!elInput) return;
    const text = elInput.value.trim();
    elInput.value = '';
    if (!text) return;
    Chat.say(text);
  };

  Chat.say = function (text) {
    text = String(text || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_LEN);
    if (!text) return;
    if (!TD.Coop || !TD.Coop.active) { Chat.system('Chat needs a co-op room.'); return; }
    if (!maySend()) return;
    TD.Coop.emitChat({ t: text });
    Chat.push({ kind: 'say', who: TD.Coop.myName(), text: text, mine: true, color: TD.Coop.myColor() });
  };

  Chat.sendQuick = function (i) {
    i = i | 0;
    if (!QUICK[i]) return;
    if (!TD.Coop || !TD.Coop.active) { Chat.system('Chat needs a co-op room.'); return; }
    if (!maySend()) return;
    TD.Coop.emitChat({ q: i });
    Chat.push({ kind: 'quick', who: TD.Coop.myName(), text: QUICK[i], mine: true, color: TD.Coop.myColor() });
  };

  /* ------------------------------------------------------------------
     Receiving — everything here is untrusted
     ------------------------------------------------------------------ */
  Chat.receive = function (peer, name, color, data) {
    const now = Date.now();
    const times = (peerTimes.get(peer) || []).filter(t => now - t < PEER_MS);
    if (times.length >= PEER_N) { peerTimes.set(peer, times); return; }   // flooding: drop it
    times.push(now);
    peerTimes.set(peer, times);

    if (data && typeof data.q === 'number') {
      const phrase = QUICK[data.q | 0];
      if (!phrase) return;
      Chat.push({ kind: 'quick', who: name, text: phrase, color: color });
      return;
    }
    const text = String((data && data.t) || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_LEN);
    if (!text) return;
    Chat.push({ kind: 'say', who: name, text: text, color: color });
  };
})();
