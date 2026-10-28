// 🤖 AI helper: a private chat, listed with your other chats, with two helpers to pick from at the top:
//   🧩 Buddy (buddy.js), the default, answers right in this browser: free, and it uses no AI usage.
//   ✨ Claude: on the website the server asks Claude (POST /ai, streamed back line by line); on claude.ai
//   the page asks Claude itself (the artifact's `sample`), on the viewer's own Claude plan, once they allow it.
// The conversation, the choice of helper and what Buddy remembers about you are kept in this browser.
(() => {
  const SUGGESTIONS = {
    buddy: [
      ['🧠', 'Quiz me with 5 trivia questions'],
      ['😂', 'Tell me a joke about video games'],
      ['♟️', 'Teach me a good chess opening'],
      ['⚡', 'How do I play +1 Speed Every Step?'],
      ['🪢', 'Let’s play hangman'],
      ['➗', 'What is 15% of 240?'],
    ],
    claude: [
      ['♟️', 'Teach me a good chess opening'],
      ['🏰', 'Tips for beating Tower Defense'],
      ['🧠', 'Quiz me with 5 trivia questions'],
      ['😂', 'Tell me a joke about video games'],
      ['💬', 'Help me write a message inviting friends to play'],
      ['📚', 'Explain something I’m learning'],
    ],
  };
  const NAME = { buddy: 'Buddy', claude: 'Claude' };
  const KEEP = 60; // turns saved
  const SEND_CHARS = 60000; // the newest turns that fit are sent with each question
  const RULES_END = '\n\n(Those are your instructions from Game Chat. The conversation starts now.)';
  let X = null; // helpers from app.js
  let pane = null, list = null, input = null, sendBtn = null, notice = null, modeBtns = null, modeTag = null;
  let open = false, turns = [], busy = null, owner = null;
  let mode = 'buddy', bmem = {}, claudeOk = null; // who answers; Buddy's memory; whether Claude can (null: not known yet)

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
  const modeKey = () => 'chat:ai:mode:' + (owner || '');
  const memKey = () => 'chat:buddy:' + (owner || '');
  function load() {
    const me = X.me();
    if (!me || owner === me.username) return;
    owner = me.username;
    try { turns = JSON.parse(localStorage.getItem(key())) || []; } catch { turns = []; }
    if (!Array.isArray(turns)) turns = [];
    turns = turns.filter((t) => t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string');
    try { mode = localStorage.getItem(modeKey()) === 'claude' ? 'claude' : 'buddy'; } catch { mode = 'buddy'; }
    try { bmem = JSON.parse(localStorage.getItem(memKey())) || {}; } catch { bmem = {}; }
    if (typeof bmem !== 'object' || Array.isArray(bmem)) bmem = {};
  }
  function save() {
    try { localStorage.setItem(key(), JSON.stringify(turns.slice(-KEEP))); } catch {}
  }
  function saveMem() {
    try { localStorage.setItem(memKey(), JSON.stringify(bmem)); } catch {}
  }
  // what Claude reads: answered turns, newest first until the budget runs out, starting on a question
  // (Buddy's answers are marked, so Claude knows they weren't its own)
  function toSend() {
    const ok = turns.filter((t) => !t.skip && t.content.trim());
    let total = 0, i = ok.length;
    while (i > 0 && total + ok[i - 1].content.length <= SEND_CHARS) total += ok[--i].content.length;
    const kept = ok.slice(i).map((t) => ({ role: t.role, content: (t.by === 'buddy' ? '[Buddy] ' : '') + t.content.trim() }));
    while (kept.length && kept[0].role !== 'user') kept.shift();
    return kept;
  }

  // ------------------------------------------------------------ the pane
  function build() {
    const h = X.h;
    input = h('textarea', { id: 'aiInput', rows: 1, maxlength: 4000, placeholder: 'Ask anything', 'aria-label': 'Ask the AI helper', autocomplete: 'off' });
    sendBtn = h('button', { class: 'btn primary', id: 'aiSend', title: 'Send', 'aria-label': 'Send' });
    setSendIcon(false);
    notice = h('div', { class: 'ai-notice hidden', id: 'aiNotice' });
    list = h('div', { class: 'messages ai-messages', id: 'aiMessages', 'aria-live': 'polite' });
    const form = h('form', { class: 'composer ai-composer', id: 'aiComposer' }, input, sendBtn);
    modeBtns = {
      buddy: h('button', { type: 'button', class: 'ai-mode', id: 'aiModeBuddy', role: 'radio', title: 'Buddy: Game Chat’s own helper. It runs in your browser, so it’s free and uses no AI usage.', onclick: () => setMode('buddy') }, '🧩 Buddy', h('small', {}, 'free')),
      claude: h('button', { type: 'button', class: 'ai-mode', id: 'aiModeClaude', role: 'radio', title: 'Claude: a much bigger AI from Anthropic that knows almost everything. It uses Claude usage.', onclick: () => setMode('claude') }, '✨ Claude'),
    };
    modeTag = h('span', { class: 'ai-tag muted' });
    pane = h('section', { class: 'chat ai-pane hidden', id: 'aiPane' },
      h('div', { class: 'ai-bar' },
        h('div', { class: 'ai-modes', role: 'radiogroup', 'aria-label': 'Who answers' }, modeBtns.buddy, modeBtns.claude),
        h('span', { class: 'ai-tag' }, '🔒 Only you see this chat'),
        modeTag,
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

  // ------------------------------------------------------------ HTML in an answer: ▶ Preview runs it right here
  // (in a sandboxed frame with no access to the chat), ⛶ full screen, or 🧰 Edit in HTML tool to change it
  const PV = new Set(); // the open previews, as "turn:block"
  const pvErr = new Map(); // a preview's frame → where its errors show
  // the closed ```fences of a message, as [language, code], in order: the same ones richText draws as <pre>
  function codeBlocks(text) {
    const parts = String(text).split('```'), out = [];
    for (let i = 1; i < parts.length - 1; i += 2) {
      const m = /^([a-z0-9+-]*)\n/i.exec(parts[i]);
      out.push([m ? m[1].toLowerCase() : '', (m ? parts[i].slice(m[0].length) : parts[i]).replace(/\n$/, '')]);
    }
    return out;
  }
  const isHtml = ([lang, code]) => /^(html?|xhtml|svg)$/.test(lang) || (!lang && /^\s*<(!doctype\s+html|html|head|body|svg|canvas|style|div|h1|main)\b/i.test(code));
  // the page to run: the HTML block, with any CSS and JavaScript blocks from the same answer put in
  function pageOf(blocks, k) {
    let code = blocks[k][1];
    const css = blocks.filter(([l]) => l === 'css').map(([, c]) => c).join('\n');
    const js = blocks.filter(([l]) => /^(js|javascript)$/.test(l)).map(([, c]) => c).join('\n');
    if (css) code = /<\/head>/i.test(code) ? code.replace(/<\/head>/i, `<style>\n${css}\n</style>\n</head>`) : `<style>\n${css}\n</style>\n${code}`;
    if (js) code = /<\/body>/i.test(code) ? code.replace(/<\/body>(?![\s\S]*<\/body>)/i, `<script>\n${js}\n<\/script>\n</body>`) : `${code}\n<script>\n${js}\n<\/script>`;
    return code;
  }
  // its errors come back to show under it (one line, so the page's line numbers stay right)
  const PV_ERRORS = '<script>(function(){var p=function(m){try{parent.postMessage({__gcAiPv:1,m:String(m)},"*")}catch(e){}};addEventListener("error",function(e){p(e.message+(e.lineno?" (line "+e.lineno+")":""))});addEventListener("unhandledrejection",function(e){p("Promise: "+(e.reason&&e.reason.message||e.reason))});var o=console.error;console.error=function(){p(Array.prototype.join.call(arguments," "));if(o)o.apply(console,arguments)}})();<\/script>';
  function withErrors(code) {
    const m = /<head[^>]*>/i.exec(code) || /<html[^>]*>/i.exec(code);
    return m ? code.slice(0, m.index + m[0].length) + PV_ERRORS + code.slice(m.index + m[0].length) : PV_ERRORS + code;
  }
  addEventListener('message', (e) => {
    const d = e.data; if (!d || d.__gcAiPv !== 1) return;
    for (const [frame, err] of pvErr) {
      if (!frame.isConnected) { pvErr.delete(frame); continue; }
      if (frame.contentWindow !== e.source) continue;
      const n = (+err.dataset.n || 0) + 1; err.dataset.n = n;
      err.classList.remove('hidden');
      err.textContent = `⚠️ ${n === 1 ? 'An error' : n + ' errors'} in this page: ${String(d.m).slice(0, 200)}`;
    }
  });
  function previewBox(page, full) {
    const h = X.h;
    const frame = h('iframe', { class: 'ai-pv-frame', title: 'Preview', sandbox: 'allow-scripts allow-modals allow-forms allow-pointer-lock' });
    const err = h('div', { class: 'ai-pv-err hidden' });
    pvErr.set(frame, err);
    frame.srcdoc = withErrors(page);
    return h('div', { class: 'ai-pv' + (full ? ' full' : '') }, frame, err);
  }
  function fullPreview(page) {
    const h = X.h, old = document.getElementById('aiPvFull'); if (old) old.remove();
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    const close = () => { el.remove(); removeEventListener('keydown', onKey, true); };
    const el = h('div', { class: 'ai-pv-full', id: 'aiPvFull', role: 'dialog', 'aria-label': 'Preview' },
      h('div', { class: 'ai-pv-full-head' }, h('b', {}, '▶ Preview'), h('span', { class: 'muted' }, 'It runs on its own, so it can’t see your chats.'), h('button', { type: 'button', class: 'btn small', onclick: close }, '✕ Close')),
      previewBox(page, true));
    document.body.append(el);
    addEventListener('keydown', onKey, true);
  }
  // under every HTML block in an answer: ▶ Preview (and the preview, if it's open), ⛶ Full screen, 🧰 Edit, 📋 Copy
  function addPreviews(textEl, content, i) {
    const h = X.h, blocks = codeBlocks(content), pres = textEl.querySelectorAll('pre.md-code');
    blocks.forEach((b, k) => {
      const pre = pres[k]; if (!pre || !isHtml(b)) return;
      const key = i + ':' + k, page = pageOf(blocks, k);
      let box = null;
      const pvBtn = h('button', { type: 'button', class: 'ai-pv-btn', 'data-pv': key, onclick: () => setOpen(!box) });
      const setOpen = (on) => {
        if (on && !box) { box = previewBox(page); bar.after(box); PV.add(key); }
        else if (!on && box) { box.remove(); box = null; PV.delete(key); }
        pvBtn.textContent = box ? '⏹ Hide preview' : '▶ Preview';
        pvBtn.classList.toggle('on', !!box);
      };
      const bar = h('div', { class: 'ai-code-bar' }, pvBtn,
        h('button', { type: 'button', title: 'Show it as big as the window', onclick: () => fullPreview(page) }, '⛶ Full screen'),
        X.openHtml ? h('button', { type: 'button', title: 'Open it in 🧰 Tools → HTML to change it', onclick: () => X.openHtml(page) }, '🧰 Edit in HTML tool') : null,
        h('button', { type: 'button', title: 'Copy the code', onclick: () => X.copyText(b[1]) }, '📋 Copy code'));
      pre.classList.add('ai-html');
      pre.after(bar);
      setOpen(PV.has(key));
    });
  }

  function aiAvatar(by) { return X.h('div', { class: 'avatar ai-av' + (by === 'buddy' ? ' buddy' : ''), title: NAME[by] }, by === 'buddy' ? '🧩' : '🤖'); }
  function bubble(t, i) {
    const h = X.h;
    if (t.role === 'user') {
      return h('div', { class: 'msg me' + (t.skip ? ' ai-skipped' : ''), 'data-ai': i },
        h('div', { class: 'body' }, h('div', { class: 'text' }, X.richText(t.content))));
    }
    const last = i === turns.length - 1, by = t.by === 'buddy' ? 'buddy' : 'claude';
    // Buddy's last answer can suggest what to say next, and offer Claude for what it doesn't know
    const more = last && !busy && by === 'buddy' && mode === 'buddy';
    return h('div', { class: 'msg ai-msg', 'data-ai': i, 'data-by': by },
      h('div', { class: 'av-slot' }, aiAvatar(by)),
      h('div', { class: 'body' },
        h('div', { class: 'meta' }, h('b', { class: 'who' }, NAME[by])),
        withPreviews(h('div', { class: 'text' }, X.richText(t.content)), t.content, i),
        t.note ? h('div', { class: 'ai-note' }, t.note) : null,
        more && t.quick && t.quick.length ? h('div', { class: 'ai-quick' }, t.quick.map((q) => h('button', { type: 'button', class: 'ai-qchip', onclick: () => ask(q) }, q))) : null,
        more && t.offer && claudeOk !== false ? h('button', { type: 'button', class: 'btn small ai-offer', id: 'aiOffer', onclick: askClaudeInstead }, '✨ Ask Claude instead', h('small', {}, ' uses Claude usage')) : null,
        h('div', { class: 'ai-actions' },
          h('button', { type: 'button', title: 'Copy', onclick: () => X.copyText(t.content) }, '📋 Copy'),
          last && !busy ? h('button', { type: 'button', title: 'Ask again for a different answer', onclick: retry }, '↻ Try again') : null)));
  }
  function withPreviews(el, content, i) { addPreviews(el, content, i); return el; }
  function welcome() {
    const h = X.h, me = X.me(), hi = `Hi${me && me.name ? ' ' + me.name : ''}!`;
    const buddy = mode === 'buddy';
    return h('div', { class: 'ai-welcome' },
      h('div', { class: 'ai-hero' + (buddy ? ' buddy' : '') }, buddy ? '🧩' : '🤖'),
      h('h3', {}, buddy ? `${hi} I’m Buddy, your AI helper.` : `${hi} I’m Claude, your AI helper.`),
      h('p', { class: 'muted' }, buddy
        ? 'I live right here in Game Chat, so I’m free and use no AI usage. Ask me about the games, maths, words and facts, or play a game with me! For harder questions, switch to ✨ Claude at the top.'
        : 'Ask me about games, homework, ideas, or anything else. Only you can see this chat.'),
      h('div', { class: 'ai-chips' }, SUGGESTIONS[mode].map(([e, q]) => h('button', { type: 'button', class: 'ai-chip', onclick: () => ask(q) }, h('span', {}, e), q))));
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
    const by = mode;
    const textEl = h('div', { class: 'text ai-thinking' }, h('span', { class: 'ai-dots' }, h('i'), h('i'), h('i')), by === 'buddy' ? ' Typing…' : ' Thinking…');
    const row = h('div', { class: 'msg ai-msg ai-live ai-new', 'data-by': by }, h('div', { class: 'av-slot' }, aiAvatar(by)),
      h('div', { class: 'body' }, h('div', { class: 'meta' }, h('b', { class: 'who' }, NAME[by])), textEl));
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
    if (by === 'claude' && X.artifact && window.PopAsk) hintTimer = setTimeout(() => { if (!shown) showNotice('Waiting for Claude… The first time, claude.ai asks you to allow this. Look in the Game Chat tab.'); }, 5000);
    let result;
    try {
      result = by === 'buddy' ? await askBuddy(text, show) : X.artifact ? await askClaudeAi(show) : await askServer(show);
    } catch (e) {
      result = { error: e && e.message ? e.message : `Something went wrong asking ${NAME[by]}. Try again.` };
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
      if (partial) turns.push({ role: 'assistant', content: partial, by, note: '⚠️ Cut off', ts: Date.now() });
      showNotice(result.error, result.off ? 'off' : 'warn');
      if (!result.off) notice.append(' ', X.h('button', { type: 'button', class: 'btn small', onclick: retry }, '↻ Try again'));
    } else if (partial) {
      const t = { role: 'assistant', content: partial, by, note: result.stopped && by === 'claude' ? '⏹ Stopped' : result.cut ? '✂️ Cut short. Ask for less at a time.' : '', ts: Date.now() };
      if (result.quick && result.quick.length) t.quick = result.quick;
      if (result.offer) t.offer = true;
      turns.push(t);
      if (!result.stopped && !result.cut) { const k = codeBlocks(partial).findIndex(isHtml); if (k >= 0) PV.add(turns.length - 1 + ':' + k); } // (its HTML, running)
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
    if (input.disabled) return;
    while (turns.length && turns[turns.length - 1].role === 'assistant') { const n = turns.length - 1; turns.pop(); for (const k of PV) if (k.startsWith(n + ':')) PV.delete(k); }
    const q = turns[turns.length - 1];
    if (!q) return;
    delete q.skip;
    ask(q.content, true);
  }
  function stop() {
    if (busy && busy.stop) busy.stop();
  }
  // Buddy didn't know: ask Claude the same question instead
  function askClaudeInstead() {
    if (busy) return;
    while (turns.length && turns[turns.length - 1].role === 'assistant') { const n = turns.length - 1; turns.pop(); for (const k of PV) if (k.startsWith(n + ':')) PV.delete(k); }
    const q = turns[turns.length - 1];
    setMode('claude');
    if (!q || input.disabled) { save(); render(); return; } // Claude is off here: the notice says why
    delete q.skip;
    ask(q.content, true);
  }
  function setMode(m) {
    if (busy || (m !== 'buddy' && m !== 'claude')) return;
    const changed = m !== mode;
    mode = m;
    try { localStorage.setItem(modeKey(), m); } catch {}
    showMode();
    if (!changed) return;
    showNotice('');
    checkAvailable();
    render();
    X.changed();
    if (matchMedia('(min-width: 721px)').matches && !input.disabled) input.focus();
  }
  function showMode() {
    if (!pane) return;
    for (const k of ['buddy', 'claude']) {
      modeBtns[k].classList.toggle('on', mode === k);
      modeBtns[k].setAttribute('aria-checked', String(mode === k));
    }
    pane.dataset.mode = mode;
    modeTag.textContent = mode === 'buddy' ? 'Runs in your browser · no AI usage' : 'Uses Claude usage · can make mistakes';
    if (!input.disabled) input.placeholder = mode === 'buddy' ? 'Ask Buddy anything (free)' : 'Ask Claude anything';
  }
  function newChat() {
    if (busy) stop();
    if (!turns.length) return;
    X.confirm('Start a new chat? This conversation will be cleared.', 'New chat', () => {
      turns = [];
      PV.clear();
      bmem.game = null; // (Buddy still remembers your name and favorites)
      saveMem();
      save();
      showNotice('');
      render();
      input.focus();
    });
  }

  // Buddy: worked out right here, then typed out quickly so it reads like a chat
  async function askBuddy(text, show) {
    let r;
    try {
      r = window.Buddy.reply(text, bmem, { name: (X.me() || {}).name || '' });
    } finally {
      saveMem();
    }
    let done = false;
    busy.stop = () => { done = true; };
    const wait = (ms) => new Promise((res) => setTimeout(res, ms));
    await wait(Math.min(700, 280 + r.text.length * 2));
    const steps = Math.min(12, Math.ceil(r.text.length / 40));
    for (let i = 1; i < steps && !done; i++) {
      show(r.text.slice(0, Math.round((r.text.length * i) / steps)).replace(/\S*$/, ''));
      await wait(30);
    }
    return { text: r.text, quick: r.quick, offer: r.offerClaude };
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
        not_granted: ['This page wasn’t allowed to use Claude. To ask Claude, reload the page and choose Allow when claude.ai asks.', true],
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
    input.placeholder = 'Claude is off here';
    showNotice(why + ' Switch to 🧩 Buddy to keep chatting for free.', 'off');
  }
  function unlockComposer() {
    pane.classList.remove('ai-locked');
    input.disabled = false;
    sendBtn.disabled = false;
    showMode();
  }
  // Buddy always answers; Claude only where it's switched on (the website's server key, or claude.ai's `sample`)
  function checkAvailable() {
    const off = (why) => {
      claudeOk = false;
      if (mode === 'claude') lockComposer(why);
      else if (busy === null && open) render();
    };
    if (mode === 'buddy') unlockComposer();
    if (X.artifact) {
      const a = asker();
      if (!a) return off('Claude isn’t available here.');
      a.ready().then((ok) => { if (!ok) off('Claude isn’t available in this view of the page. Open Game Chat on claude.ai to ask Claude.'); else claudeOk = true; });
      return mode === 'claude' ? unlockComposer() : undefined;
    }
    if (X.serverAI() === false) return off('Claude isn’t switched on for this server yet. Whoever runs Game Chat can turn it on by setting ANTHROPIC_API_KEY (see the README).');
    claudeOk = true;
    unlockComposer();
  }

  window.AIChat = {
    init(helpers) { X = helpers; },
    isOpen: () => open,
    busy: () => !!busy,
    // who's answering: 'Buddy' or 'Claude'
    who() { if (X) load(); return NAME[mode]; },
    open() {
      if (!pane) build();
      load();
      open = true;
      pane.classList.remove('hidden');
      document.body.classList.add('ai-open');
      showMode();
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
    reset() { if (busy) stop(); owner = null; turns = []; bmem = {}; mode = 'buddy'; if (open) window.AIChat.close(); },
  };
})();
