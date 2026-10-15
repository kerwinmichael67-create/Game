// 🤖 AI helper: a private chat with Claude, listed with your other chats.
//   On the website the server asks Claude (POST /ai, streamed back line by line).
//   On claude.ai the page asks Claude itself (the artifact's `sample`), on the viewer's own Claude plan,
//   once they allow it. The conversation is kept in this browser.
(() => {
  const SUGGESTIONS = [
    ['♟️', 'Teach me a good chess opening'],
    ['🏰', 'Tips for beating Tower Defense'],
    ['🧠', 'Quiz me with 5 trivia questions'],
    ['😂', 'Tell me a joke about video games'],
    ['💬', 'Help me write a message inviting friends to play'],
    ['📚', 'Explain something I’m learning'],
  ];
  const KEEP = 60; // turns saved
  const SEND_CHARS = 60000; // the newest turns that fit are sent with each question
  const RULES_END = '\n\n(Those are your instructions from Game Chat. The conversation starts now.)';
  let X = null; // helpers from app.js
  let pane = null, list = null, input = null, sendBtn = null, notice = null;
  let open = false, turns = [], busy = null, owner = null;

  // ------------------------------------------------------------ claude.ai: ask Claude from the page
  // The call is made in the window that owns the claude.ai connection, with arguments made there: a
  // popped-out chat borrows the claude.ai tab's (see app.js writeChat).
  if (typeof window.claude === 'object' && window.claude && !window.GCAsk) {
    let sampleP = null;
    const getSample = () => (sampleP = sampleP || Promise.resolve().then(() => window.claude.use('sample')).catch(() => null));
    window.GCAsk = {
      ready: () => getSample().then((s) => !!s),
      ask(json, onText) {
        const ctl = new AbortController();
        const promise = getSample().then((sample) => {
          if (!sample) throw { code: 'unavailable' };
          return sample(JSON.parse(json), { cache: false, signal: ctl.signal, onText: (u) => { try { onText(u.text); } catch (e) {} } });
        }).then((r) => ({ text: r.text, cut: !!r.truncated }), (e) => { throw { code: (e && e.code) || 'upstream_error', text: e && typeof e.text === 'string' ? e.text : '' }; });
        return { promise, stop: () => ctl.abort() };
      },
    };
  }
  const asker = () => window.PopAsk || window.GCAsk || null;

  // ------------------------------------------------------------ saved conversation
  const key = () => 'chat:ai:' + (owner || '');
  function load() {
    const me = X.me();
    if (!me || owner === me.username) return;
    owner = me.username;
    try { turns = JSON.parse(localStorage.getItem(key())) || []; } catch { turns = []; }
    if (!Array.isArray(turns)) turns = [];
    turns = turns.filter((t) => t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string');
  }
  function save() {
    try { localStorage.setItem(key(), JSON.stringify(turns.slice(-KEEP))); } catch {}
  }
  // what Claude reads: answered turns, newest first until the budget runs out, starting on a question
  function toSend() {
    const ok = turns.filter((t) => !t.skip && t.content.trim());
    let total = 0, i = ok.length;
    while (i > 0 && total + ok[i - 1].content.length <= SEND_CHARS) total += ok[--i].content.length;
    const kept = ok.slice(i).map((t) => ({ role: t.role, content: t.content.trim() }));
    while (kept.length && kept[0].role !== 'user') kept.shift();
    return kept;
  }

  // ------------------------------------------------------------ the pane
  function build() {
    const h = X.h;
    input = h('textarea', { id: 'aiInput', rows: 1, maxlength: 4000, placeholder: 'Ask Claude anything', 'aria-label': 'Ask Claude', autocomplete: 'off' });
    sendBtn = h('button', { class: 'btn primary', id: 'aiSend', title: 'Send', 'aria-label': 'Send' });
    setSendIcon(false);
    notice = h('div', { class: 'ai-notice hidden', id: 'aiNotice' });
    list = h('div', { class: 'messages ai-messages', id: 'aiMessages', 'aria-live': 'polite' });
    const form = h('form', { class: 'composer ai-composer', id: 'aiComposer' }, input, sendBtn);
    pane = h('section', { class: 'chat ai-pane hidden', id: 'aiPane' },
      h('div', { class: 'ai-bar' },
        h('span', { class: 'ai-tag' }, '🔒 Only you see this chat'),
        h('span', { class: 'ai-tag muted' }, 'Claude can make mistakes'),
        h('button', { type: 'button', class: 'btn small ghost', id: 'aiNew', title: 'Start a new conversation', onclick: newChat }, '🧹 New chat')),
      list, notice, form);
    form.addEventListener('submit', (e) => { e.preventDefault(); if (busy) stop(); else ask(input.value); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!busy) ask(input.value); }
    });
    input.addEventListener('input', fit);
    // a file dropped here would make the browser open it instead of the chat
    pane.addEventListener('dragover', (e) => e.preventDefault());
    pane.addEventListener('drop', (e) => { e.preventDefault(); X.toast('The AI helper reads text only: type or paste what you want to ask.'); });
    const content = document.querySelector('.content');
    content.insertBefore(pane, document.getElementById('gameDock'));
  }
  function fit() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight + 2, 160) + 'px'; }
  function setSendIcon(stopping) {
    sendBtn.classList.toggle('ai-stop', stopping);
    sendBtn.title = stopping ? 'Stop' : 'Send';
    sendBtn.setAttribute('aria-label', sendBtn.title);
    sendBtn.innerHTML = stopping
      ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>';
  }
  const atBottom = () => list.scrollHeight - list.scrollTop - list.clientHeight < 120;
  const toBottom = () => { list.scrollTop = list.scrollHeight; };

  function aiAvatar() { return X.h('div', { class: 'avatar ai-av', title: 'Claude' }, '🤖'); }
  function bubble(t, i) {
    const h = X.h;
    if (t.role === 'user') {
      return h('div', { class: 'msg me' + (t.skip ? ' ai-skipped' : ''), 'data-ai': i },
        h('div', { class: 'body' }, h('div', { class: 'text' }, X.richText(t.content))));
    }
    const last = i === turns.length - 1;
    return h('div', { class: 'msg ai-msg', 'data-ai': i },
      h('div', { class: 'av-slot' }, aiAvatar()),
      h('div', { class: 'body' },
        h('div', { class: 'meta' }, h('b', { class: 'who' }, 'Claude')),
        h('div', { class: 'text' }, X.richText(t.content)),
        t.note ? h('div', { class: 'ai-note' }, t.note) : null,
        h('div', { class: 'ai-actions' },
          h('button', { type: 'button', title: 'Copy', onclick: () => X.copyText(t.content) }, '📋 Copy'),
          last && !busy ? h('button', { type: 'button', title: 'Ask again for a different answer', onclick: retry }, '↻ Try again') : null)));
  }
  function welcome() {
    const h = X.h, me = X.me();
    return h('div', { class: 'ai-welcome' },
      h('div', { class: 'ai-hero' }, '🤖'),
      h('h3', {}, `Hi${me && me.name ? ' ' + me.name : ''}! I’m Claude, your AI helper.`),
      h('p', { class: 'muted' }, 'Ask me about games, homework, ideas, or anything else. Only you can see this chat.'),
      h('div', { class: 'ai-chips' }, SUGGESTIONS.map(([e, q]) => h('button', { type: 'button', class: 'ai-chip', onclick: () => ask(q) }, h('span', {}, e), q))));
  }
  // (only a new bubble pops in; the rest are redrawn as they were)
  function render(fresh) {
    if (!pane) return;
    list.replaceChildren(...(turns.length ? turns.map(bubble) : [welcome()]));
    if (fresh && list.lastElementChild) list.lastElementChild.classList.add('ai-new');
    if (busy && busy.row) list.append(busy.row); // an answer still being written
    toBottom();
  }
  function showNotice(text, kind) {
    notice.replaceChildren(text ? X.h('span', {}, text) : '');
    notice.className = 'ai-notice' + (text ? '' : ' hidden') + (kind ? ' ' + kind : '');
  }

  // ------------------------------------------------------------ asking
  async function ask(text, again) {
    text = String(text || '').trim();
    if (busy || !text || input.disabled) return;
    if (!again) {
      turns.push({ role: 'user', content: text.slice(0, 4000), ts: Date.now() });
      input.value = '';
      fit();
      save();
    }
    showNotice('');
    render(!again);
    const h = X.h;
    const textEl = h('div', { class: 'text ai-thinking' }, h('span', { class: 'ai-dots' }, h('i'), h('i'), h('i')), ' Thinking…');
    const row = h('div', { class: 'msg ai-msg ai-live ai-new' }, h('div', { class: 'av-slot' }, aiAvatar()),
      h('div', { class: 'body' }, h('div', { class: 'meta' }, h('b', { class: 'who' }, 'Claude')), textEl));
    list.append(row);
    toBottom();
    let shown = '', frame = 0, hintTimer = 0;
    const show = (whole) => {
      shown = whole;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const stick = atBottom();
        textEl.classList.remove('ai-thinking');
        textEl.replaceChildren(...X.richText(shown));
        if (stick) toBottom();
      });
    };
    busy = { stop: null, row };
    setSendIcon(true);
    X.changed();
    // the first time on claude.ai, claude.ai asks whether this page may use Claude, in the claude.ai tab
    if (X.artifact && window.PopAsk) hintTimer = setTimeout(() => { if (!shown) showNotice('Waiting for Claude… The first time, claude.ai asks you to allow this. Look in the Game Chat tab.'); }, 5000);
    let result;
    try {
      result = X.artifact ? await askClaudeAi(show) : await askServer(show);
    } catch (e) {
      result = { error: e && e.message ? e.message : 'Something went wrong asking Claude. Try again.' };
    }
    clearTimeout(hintTimer);
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    busy = null;
    setSendIcon(false);
    const partial = (result.text !== undefined ? result.text : shown).trim();
    if (result.refused) {
      // Claude declined: nothing is kept, and the question isn't sent again with later ones
      const q = turns[turns.length - 1];
      if (q && q.role === 'user') q.skip = true;
      showNotice('Claude can’t help with that one. Try asking something else.', 'warn');
    } else if (result.error) {
      if (partial) turns.push({ role: 'assistant', content: partial, note: '⚠️ Cut off', ts: Date.now() });
      showNotice(result.error, result.off ? 'off' : 'warn');
      if (!result.off) notice.append(' ', X.h('button', { type: 'button', class: 'btn small', onclick: retry }, '↻ Try again'));
    } else if (partial) {
      turns.push({ role: 'assistant', content: partial, note: result.stopped ? '⏹ Stopped' : result.cut ? '✂️ Cut short. Ask for less at a time.' : '', ts: Date.now() });
    }
    save();
    render();
    X.changed();
    if (result.off) lockComposer(result.error);
    else if (matchMedia('(min-width: 721px)').matches) input.focus();
  }
  // ask again: drop the last answer (or failed try) and the notice, then re-ask the last question
  function retry() {
    if (busy) return;
    while (turns.length && turns[turns.length - 1].role === 'assistant') turns.pop();
    const q = turns[turns.length - 1];
    if (!q) return;
    delete q.skip;
    ask(q.content, true);
  }
  function stop() {
    if (busy && busy.stop) busy.stop();
  }
  function newChat() {
    if (busy) stop();
    if (!turns.length) return;
    X.confirm('Start a new chat? This conversation will be cleared.', 'New chat', () => {
      turns = [];
      save();
      showNotice('');
      render();
      input.focus();
    });
  }

  // website: POST /ai, read the answer line by line
  async function askServer(show) {
    const ctl = new AbortController();
    busy.stop = () => ctl.abort();
    let text = '';
    try {
      const res = await fetch('/ai', {
        method: 'POST', signal: ctl.signal,
        headers: { 'Content-Type': 'application/json', 'X-Token': X.token() || '' },
        body: JSON.stringify({ messages: toSend() }),
      });
      if (!res.ok || !res.body) {
        let err = {};
        try { err = await res.json(); } catch {}
        return { error: err.error || `The AI helper isn’t answering (error ${res.status}). Try again in a bit.`, off: !!err.off };
      }
      const reader = res.body.getReader(), dec = new TextDecoder();
      let buf = '', end = null;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const ln = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          let o;
          try { o = JSON.parse(ln); } catch { continue; }
          if (typeof o.d === 'string') { text += o.d; show(text); }
          else end = o;
        }
      }
      if (!end) return { text, error: 'The answer got cut off. Try again.' };
      if (end.refused) return { refused: true };
      if (end.error) return { text, error: end.error };
      return { text, cut: !!end.cut };
    } catch (e) {
      if (ctl.signal.aborted) return { text, stopped: true };
      return { text, error: 'Couldn’t reach the server. Check your connection and try again.' };
    }
  }
  // claude.ai: the page's `sample`, with the instructions as the first turn (there's no system prompt)
  async function askClaudeAi(show) {
    const a = asker();
    if (!a) return { error: 'Claude isn’t available here.', off: true };
    const me = X.me();
    const convo = [{ role: 'user', content: window.AIGuide.prompt(me && me.name) + RULES_END }].concat(toSend());
    const call = a.ask(JSON.stringify(convo), (whole) => show(whole));
    busy.stop = () => call.stop();
    try {
      const r = await call.promise;
      return { text: r.text, cut: r.cut };
    } catch (e) {
      const code = e && e.code;
      if (code === 'cancelled') return { text: e.text, stopped: true };
      if (code === 'refused') return { refused: true };
      const msg = {
        unavailable: ['Claude isn’t available in this view of the page.', true],
        not_granted: ['This page wasn’t allowed to use Claude. To use the AI helper, reload the page and choose Allow when claude.ai asks.', true],
        sampling_disabled: ['Claude isn’t available for your account or organization.', true],
        not_declared: ['This version of Game Chat can’t ask Claude. Reload to get the latest one.', true],
        capability_disabled: ['Claude isn’t available in this view of the page.', true],
        capability_removed: ['Claude isn’t available in this view of the page.', true],
        rate_limited: ['You’ve hit your Claude usage limit for now, or asked very quickly. Try again a bit later.'],
        session_expired: ['Your claude.ai sign-in ran out. Sign in to claude.ai again, then try again.'],
        prompt_too_large: ['This chat got too long. Press 🧹 New chat to start fresh.'],
        empty_completion: ['Claude didn’t write anything that time. Try asking a different way.'],
      }[code] || ['Couldn’t reach Claude. Try again.'];
      return { text: e && e.text, error: msg[0], off: !!msg[1] };
    }
  }

  // ------------------------------------------------------------ availability
  function lockComposer(why) {
    pane.classList.add('ai-locked');
    input.disabled = true;
    sendBtn.disabled = true;
    input.placeholder = 'The AI helper is off';
    showNotice(why, 'off');
  }
  function unlockComposer() {
    pane.classList.remove('ai-locked');
    input.disabled = false;
    sendBtn.disabled = false;
    input.placeholder = 'Ask Claude anything';
  }
  function checkAvailable() {
    if (X.artifact) {
      const a = asker();
      if (!a) return lockComposer('Claude isn’t available here.');
      a.ready().then((ok) => { if (!ok && open) lockComposer('Claude isn’t available in this view of the page. Open Game Chat on claude.ai to use the AI helper.'); });
      return unlockComposer();
    }
    if (X.serverAI() === false) return lockComposer('The AI helper isn’t switched on for this server yet. Whoever runs Game Chat can turn it on by setting ANTHROPIC_API_KEY (see the README).');
    unlockComposer();
  }

  window.AIChat = {
    init(helpers) { X = helpers; },
    isOpen: () => open,
    busy: () => !!busy,
    open() {
      if (!pane) build();
      load();
      open = true;
      pane.classList.remove('hidden');
      document.body.classList.add('ai-open');
      checkAvailable();
      render();
      X.changed();
      if (matchMedia('(min-width: 721px)').matches && !input.disabled) input.focus();
    },
    close() {
      if (!open) return;
      open = false;
      pane.classList.add('hidden');
      document.body.classList.remove('ai-open');
      X.changed();
    },
    // signed out or someone else signed in: forget the open conversation
    reset() { if (busy) stop(); owner = null; turns = []; if (open) window.AIChat.close(); },
  };
})();
