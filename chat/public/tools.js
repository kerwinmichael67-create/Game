// 🧰 Tools: handy tools next to the chat. An HTML previewer, a calculator, a timer and stopwatch, a unit
// converter, random pickers, notes, a to-do list, colors, text tools and number bases. What you type is
// kept in this browser.
(() => {
  let X = null; // helpers from app.js
  let pane = null, tabs = null, body = null, open = false, current = null, cleanup = null;
  const sfx = (n, o) => { if (window.Sfx) window.Sfx.play(n, o); };
  // per-person storage in this browser
  const key = (k) => 'chat:tools:' + k + ':' + ((X && X.me() && X.me().username) || '');
  function load(k, d) { try { const v = JSON.parse(localStorage.getItem(key(k))); return v === null || v === undefined ? d : v; } catch { return d; } }
  function save(k, v) { try { localStorage.setItem(key(k), JSON.stringify(v)); } catch {} }
  const h = (...a) => X.h(...a);
  const rand = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }; // 0..n-1
  const fmt = (x, sig = 10) => {
    if (!isFinite(x)) return '';
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a >= 1e15 || a < 1e-9) return x.toExponential(6).replace(/\.?0+e/, 'e');
    return String(+x.toPrecision(sig));
  };
  const card = (title, ...kids) => h('section', { class: 'tl-card' }, title ? h('h4', {}, title) : null, ...kids);
  const btn = (label, onclick, cls, attrs) => h('button', Object.assign({ type: 'button', class: 'btn ' + (cls || ''), onclick }, attrs || {}), label);

  const TOOLS = [
    { id: 'html', icon: '🌐', name: 'HTML', build: htmlTool },
    { id: 'calc', icon: '🧮', name: 'Calculator', build: calcTool },
    { id: 'timer', icon: '⏱️', name: 'Timer', build: timerTool },
    { id: 'convert', icon: '🔁', name: 'Converter', build: convertTool },
    { id: 'random', icon: '🎲', name: 'Random', build: randomTool },
    { id: 'notes', icon: '📝', name: 'Notes', build: notesTool },
    { id: 'todo', icon: '✅', name: 'To-do', build: todoTool },
    { id: 'color', icon: '🎨', name: 'Colors', build: colorTool },
    { id: 'text', icon: '🔤', name: 'Text', build: textTool },
    { id: 'bases', icon: '🔢', name: 'Number bases', build: basesTool },
  ];

  /* ================================================================ 🌐 HTML previewer */
  const TEMPLATES = {
    'Starter page': `<!doctype html>
<html>
<head>
<style>
  body { font-family: system-ui, sans-serif; background: #eef2ff; text-align: center; padding: 30px; }
  h1 { color: #6d5dfc; }
  button { font-size: 18px; padding: 10px 22px; border: 0; border-radius: 12px; background: #6d5dfc; color: white; cursor: pointer; }
</style>
</head>
<body>
  <h1>Hello! 👋</h1>
  <p>Change the code on the left and this page updates.</p>
  <button onclick="add()">Click me</button>
  <p>Clicks: <b id="n">0</b></p>
  <script>
    let clicks = 0;
    function add() {
      clicks++;
      document.getElementById('n').textContent = clicks;
      console.log('clicked', clicks, 'times');
    }
  </script>
</body>
</html>`,
    'Bouncing ball': `<!doctype html>
<html>
<head>
<style>
  body { margin: 0; background: #111827; }
  canvas { display: block; width: 100vw; height: 100vh; }
</style>
</head>
<body>
  <canvas id="c"></canvas>
  <script>
    const c = document.getElementById('c'), g = c.getContext('2d');
    let x = 80, y = 80, dx = 4, dy = 3, r = 24, hue = 0;
    function frame() {
      c.width = innerWidth; c.height = innerHeight;
      x += dx; y += dy; hue = (hue + 2) % 360;
      if (x < r || x > c.width - r) dx = -dx;
      if (y < r || y > c.height - r) dy = -dy;
      g.fillStyle = 'hsl(' + hue + ', 90%, 60%)';
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      requestAnimationFrame(frame);
    }
    frame();
  </script>
</body>
</html>`,
    'Profile card': `<!doctype html>
<html>
<head>
<style>
  body { font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #6d5dfc, #ec4899); }
  .card { background: white; border-radius: 20px; padding: 28px; width: 260px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,.25); }
  .pic { font-size: 64px; }
  h2 { margin: 8px 0 4px; }
  p { color: #666; }
  .tags span { display: inline-block; background: #eef2ff; color: #6d5dfc; border-radius: 99px; padding: 4px 10px; margin: 3px; font-size: 13px; }
</style>
</head>
<body>
  <div class="card">
    <div class="pic">🦊</div>
    <h2>Your name</h2>
    <p>I like games, coding and pizza.</p>
    <div class="tags"><span>🎮 Gamer</span><span>💻 Coder</span><span>🍕 Pizza</span></div>
  </div>
</body>
</html>`,
    'Quiz': `<!doctype html>
<html>
<head>
<style>
  body { font-family: system-ui, sans-serif; max-width: 420px; margin: 30px auto; padding: 0 16px; }
  button { display: block; width: 100%; margin: 8px 0; padding: 12px; font-size: 16px; border-radius: 10px; border: 2px solid #ddd; background: white; cursor: pointer; }
  .right { background: #bbf7d0; border-color: #22c55e; }
  .wrong { background: #fecaca; border-color: #ef4444; }
</style>
</head>
<body>
  <h2 id="q"></h2>
  <div id="answers"></div>
  <p id="score"></p>
  <script>
    const quiz = [
      { q: 'What is 7 × 8?', a: ['54', '56', '64'], right: 1 },
      { q: 'Which planet is the biggest?', a: ['Jupiter', 'Mars', 'Earth'], right: 0 },
      { q: 'How many legs does a spider have?', a: ['6', '10', '8'], right: 2 },
    ];
    let i = 0, score = 0;
    function show() {
      const item = quiz[i];
      document.getElementById('q').textContent = item.q;
      const box = document.getElementById('answers');
      box.innerHTML = '';
      item.a.forEach((text, k) => {
        const b = document.createElement('button');
        b.textContent = text;
        b.onclick = () => {
          b.className = k === item.right ? 'right' : 'wrong';
          if (k === item.right) score++;
          setTimeout(next, 600);
        };
        box.appendChild(b);
      });
    }
    function next() {
      i++;
      if (i < quiz.length) show();
      else { document.getElementById('q').textContent = 'Done!'; document.getElementById('answers').innerHTML = ''; }
      document.getElementById('score').textContent = 'Score: ' + score + ' / ' + quiz.length;
    }
    show();
  </script>
</body>
</html>`,
    'Blank': '<!doctype html>\n<html>\n<head>\n<style>\n\n</style>\n</head>\n<body>\n\n<script>\n\n</script>\n</body>\n</html>',
  };
  // forwards the page's console and errors to the tool (one line, so error line numbers stay right)
  const CONSOLE = '<script>(function(){var p=function(t,a){try{parent.postMessage({__gcPreview:1,t:t,m:Array.prototype.map.call(a,function(x){if(typeof x==="string")return x;try{return JSON.stringify(x)}catch(e){return String(x)}}).join(" ")},"*")}catch(e){}};["log","info","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){p(k,arguments);if(o)o.apply(console,arguments)}});addEventListener("error",function(e){p("error",[e.message+(e.lineno?" (line "+e.lineno+")":"")])});addEventListener("unhandledrejection",function(e){p("error",["Promise: "+(e.reason&&e.reason.message||e.reason)])})})();</script>';
  function withConsole(code) {
    const m = /<head[^>]*>/i.exec(code) || /<html[^>]*>/i.exec(code);
    return m ? code.slice(0, m.index + m[0].length) + CONSOLE + code.slice(m.index + m[0].length) : CONSOLE + code;
  }
  function htmlTool(el) {
    let code = load('html', TEMPLATES['Starter page']), auto = load('htmlAuto', true), timer = 0, logs = 0;
    const ed = h('textarea', { class: 'tl-code', spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', 'aria-label': 'HTML code' });
    ed.value = code;
    const frame = h('iframe', { class: 'tl-frame', title: 'Preview', sandbox: 'allow-scripts allow-modals allow-forms allow-pointer-lock' });
    const out = h('div', { class: 'tl-console', 'aria-live': 'polite' });
    const count = h('span', { class: 'tl-count' });
    const run = () => { out.replaceChildren(); logs = 0; count.textContent = ''; frame.srcdoc = withConsole(ed.value); };
    const autoBox = h('input', { type: 'checkbox', checked: auto ? true : null, onchange: () => { auto = autoBox.checked; save('htmlAuto', auto); if (auto) run(); } });
    const pick = h('select', { class: 'tl-select', 'aria-label': 'Start from a template', onchange: () => {
      const t = pick.value;
      pick.value = '';
      if (!t) return;
      const go = () => { ed.value = TEMPLATES[t]; save('html', ed.value); run(); };
      if (ed.value.trim() && ed.value !== TEMPLATES[t]) X.confirm(`Replace your code with the “${t}” template?`, 'Replace', go); else go();
    } }, h('option', { value: '' }, '📄 Templates…'), Object.keys(TEMPLATES).map((t) => h('option', { value: t }, t)));
    const wrap = h('div', { class: 'tl-html' });
    const big = btn('⤢ Big preview', () => { wrap.classList.toggle('big'); big.textContent = wrap.classList.contains('big') ? '⤡ Show code' : '⤢ Big preview'; }, 'small');
    ed.addEventListener('input', () => {
      save('html', ed.value);
      if (auto) { clearTimeout(timer); timer = setTimeout(run, 600); }
    });
    // Tab indents instead of leaving the box
    ed.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); const s = ed.selectionStart; ed.setRangeText('  ', s, ed.selectionEnd, 'end'); ed.dispatchEvent(new Event('input')); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
    });
    const onMsg = (e) => {
      if (e.source !== frame.contentWindow || !e.data || e.data.__gcPreview !== 1) return;
      logs++;
      count.textContent = logs;
      out.append(h('div', { class: 'tl-log ' + (e.data.t === 'error' ? 'err' : e.data.t === 'warn' ? 'warn' : '') }, String(e.data.m).slice(0, 500)));
      if (out.childElementCount > 200) out.firstElementChild.remove();
      out.scrollTop = out.scrollHeight;
    };
    addEventListener('message', onMsg);
    const download = () => X.saveFile('my-page.html', new Blob([ed.value], { type: 'text/html' }));
    wrap.append(
      h('div', { class: 'tl-bar' }, pick,
        btn('▶ Run', run, 'primary small', { title: 'Run (Ctrl+Enter)' }),
        h('label', { class: 'tl-check', title: 'Update the preview as you type' }, autoBox, ' Live'),
        big, btn('💾 Download', download, 'small')),
      h('div', { class: 'tl-split' },
        h('div', { class: 'tl-pane' }, ed),
        h('div', { class: 'tl-pane tl-preview' }, frame,
          h('div', { class: 'tl-console-head' }, h('b', {}, 'Console '), count, btn('Clear', () => { out.replaceChildren(); logs = 0; count.textContent = ''; }, 'ghost small')), out)),
      h('p', { class: 'tl-hint muted' }, 'Write HTML, CSS (in <style>) and JavaScript (in <script>). console.log shows up under the preview. The page runs on its own, so it can’t see your chats.'));
    el.append(wrap);
    run();
    return () => { removeEventListener('message', onMsg); clearTimeout(timer); };
  }

  /* ================================================================ 🧮 calculator */
  // A small parser (no eval): + − × ÷ ^ % ! ( ), sin cos tan asin acos atan sqrt cbrt log ln abs
  // round floor ceil, π e Ans, and 2π / 3(4) style multiplication.
  const FUNCS = { sqrt: Math.sqrt, cbrt: Math.cbrt, log: Math.log10, ln: Math.log, abs: Math.abs, round: Math.round, floor: Math.floor, ceil: Math.ceil, exp: Math.exp };
  const TRIG = { sin: Math.sin, cos: Math.cos, tan: Math.tan }, ATRIG = { asin: Math.asin, acos: Math.acos, atan: Math.atan };
  function evaluate(src, deg, ans) {
    const s = String(src).replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/π/g, ' pi ').replace(/√/g, ' sqrt ').replace(/,/g, '').toLowerCase();
    const toks = [];
    for (let i = 0; i < s.length;) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      const num = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(s.slice(i));
      if (num) { toks.push({ n: parseFloat(num[0]) }); i += num[0].length; continue; }
      const id = /^[a-z]+/.exec(s.slice(i));
      if (id) { toks.push({ id: id[0] }); i += id[0].length; continue; }
      if ('+-*/^%!()'.includes(c)) { toks.push({ op: c }); i++; continue; }
      throw new Error(`I don’t know “${c}”`);
    }
    let p = 0;
    const peek = () => toks[p], isOp = (o) => toks[p] && toks[p].op === o;
    const rad = (x) => (deg ? x * Math.PI / 180 : x), unrad = (x) => (deg ? x * 180 / Math.PI : x);
    function expr() {
      let v = term();
      while (isOp('+') || isOp('-')) { const o = toks[p++].op, r = term(); v = o === '+' ? v + r : v - r; }
      return v;
    }
    function term() {
      let v = unary();
      for (;;) {
        if (isOp('*') || isOp('/')) { const o = toks[p++].op, r = unary(); v = o === '*' ? v * r : v / r; continue; }
        const t = peek();
        if (t && (t.n !== undefined || t.id || t.op === '(')) { v *= unary(); continue; } // 2π, 3(4), 2sin(30)
        return v;
      }
    }
    function unary() {
      if (isOp('-')) { p++; return -unary(); }
      if (isOp('+')) { p++; return unary(); }
      return power();
    }
    function power() {
      const b = postfix();
      if (isOp('^')) { p++; return Math.pow(b, unary()); }
      return b;
    }
    function postfix() {
      let v = primary();
      for (;;) {
        if (isOp('!')) { p++; v = fact(v); } else if (isOp('%')) { p++; v /= 100; } else return v;
      }
    }
    function fact(n) {
      if (n < 0 || n !== Math.floor(n) || n > 170) return NaN;
      let r = 1;
      for (let i = 2; i <= n; i++) r *= i;
      return r;
    }
    function primary() {
      const t = toks[p++];
      if (!t) throw new Error('Something’s missing at the end');
      if (t.n !== undefined) return t.n;
      if (t.op === '(') { const v = expr(); if (isOp(')')) p++; return v; } // a missing ) is fine at the end
      if (t.id) {
        if (t.id === 'pi') return Math.PI;
        if (t.id === 'e') return Math.E;
        if (t.id === 'ans') return ans || 0;
        const f = FUNCS[t.id] || TRIG[t.id] || ATRIG[t.id];
        if (!f) throw new Error(`I don’t know “${t.id}”`);
        const arg = isOp('(') ? (p++, (() => { const v = expr(); if (isOp(')')) p++; return v; })()) : power();
        if (TRIG[t.id]) { const v = f(rad(arg)); return Math.abs(v) < 1e-12 ? 0 : v; }
        if (ATRIG[t.id]) return unrad(f(arg));
        return f(arg);
      }
      throw new Error(t.op === ')' ? 'There’s an extra )' : `“${t.op}” needs a number before it`);
    }
    if (!toks.length) return null;
    const v = expr();
    if (p < toks.length) throw new Error(toks[p].op === ')' ? 'There’s an extra )' : 'Check the expression');
    return v;
  }
  function calcTool(el) {
    let deg = load('calcDeg', true), ans = load('calcAns', 0), hist = load('calcHist', []);
    const input = h('input', { class: 'tl-calc-in', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Calculation', placeholder: '0' });
    const res = h('div', { class: 'tl-calc-res', 'aria-live': 'polite' });
    const histEl = h('div', { class: 'tl-hist' });
    const preview = () => {
      try { const v = evaluate(input.value, deg, ans); res.textContent = v === null ? '' : isFinite(v) ? '= ' + fmt(v, 12) : '= error'; res.classList.remove('err'); }
      catch { res.textContent = ''; }
    };
    const put = (t) => {
      const a = input.selectionStart ?? input.value.length, b = input.selectionEnd ?? input.value.length;
      input.setRangeText(t, a, b, 'end');
      input.focus();
      preview();
    };
    const equals = () => {
      if (!input.value.trim()) return;
      try {
        const v = evaluate(input.value, deg, ans);
        if (v === null) return;
        if (!isFinite(v)) throw new Error(isNaN(v) ? 'That doesn’t have an answer' : 'That’s too big (or ÷ 0)');
        const r = fmt(v, 12);
        hist = [{ q: input.value, a: r }].concat(hist).slice(0, 20);
        save('calcHist', hist);
        ans = v; save('calcAns', ans);
        input.value = r;
        res.textContent = '';
        renderHist();
        sfx('tap', { vol: 0.5 });
      } catch (e) { res.textContent = e.message; res.classList.add('err'); sfx('error', { vol: 0.4 }); }
    };
    const back = () => { const a = input.selectionStart, b = input.selectionEnd; if (a !== b) input.setRangeText('', a, b, 'end'); else if (a > 0) input.setRangeText('', a - 1, a, 'end'); input.focus(); preview(); };
    const negate = () => { const v = input.value.trim(); input.value = !v ? '-' : /^-\(.*\)$/.test(v) ? v.slice(2, -1) : `-(${v})`; input.focus(); preview(); };
    const degBtn = btn(deg ? 'Deg' : 'Rad', () => { deg = !deg; save('calcDeg', deg); degBtn.textContent = deg ? 'Deg' : 'Rad'; preview(); }, 'tl-k fn', { title: 'Angles in degrees or radians' });
    const K = (label, act, cls, title) => btn(label, act, 'tl-k ' + (cls || ''), title ? { title } : null);
    const ins = (t) => () => put(t);
    const keys = [
      degBtn, K('x²', ins('^2'), 'fn'), K('xʸ', ins('^'), 'fn', 'Power'), K('π', ins('π'), 'fn'), K('e', ins('e'), 'fn'),
      K('log', ins('log('), 'fn', 'Log base 10'), K('ln', ins('ln('), 'fn', 'Natural log'), K('n!', ins('!'), 'fn', 'Factorial'), K('%', ins('%'), 'fn', 'Percent'), K('Ans', ins('Ans'), 'fn', 'The last answer'),
      K('C', () => { input.value = ''; res.textContent = ''; input.focus(); }, 'clear'), K('(', ins('(')), K(')', ins(')')), K('⌫', back, '', 'Delete'), K('÷', ins('÷'), 'op'),
      K('sin', ins('sin('), 'fn'), K('7', ins('7')), K('8', ins('8')), K('9', ins('9')), K('×', ins('×'), 'op'),
      K('cos', ins('cos('), 'fn'), K('4', ins('4')), K('5', ins('5')), K('6', ins('6')), K('−', ins('−'), 'op'),
      K('tan', ins('tan('), 'fn'), K('1', ins('1')), K('2', ins('2')), K('3', ins('3')), K('+', ins('+'), 'op'),
      K('√', ins('√('), 'fn', 'Square root'), K('±', negate), K('0', ins('0')), K('.', ins('.')), K('=', equals, 'eq'),
    ];
    function renderHist() {
      histEl.replaceChildren(...(hist.length ? hist.map((x) => h('button', { type: 'button', class: 'tl-hist-row', title: 'Use this answer', onclick: () => put(x.a) }, h('span', { class: 'muted' }, x.q + ' ='), h('b', {}, x.a))) : [h('p', { class: 'muted' }, 'Your answers show up here.')]));
    }
    input.addEventListener('input', preview);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); equals(); }
      if (e.key === 'Escape') { input.value = ''; preview(); }
    });
    el.append(h('div', { class: 'tl-calc' },
      h('div', { class: 'tl-calc-main' }, h('div', { class: 'tl-calc-screen' }, input, res), h('div', { class: 'tl-keys' }, keys)),
      card('History', histEl, btn('Clear history', () => { hist = []; save('calcHist', hist); renderHist(); }, 'ghost small'))));
    renderHist();
    if (matchMedia('(min-width: 721px)').matches) setTimeout(() => input.focus());
  }

  /* ================================================================ ⏱️ timer and stopwatch */
  // They keep going while you're in the chat; the timer rings wherever you are.
  const SW = { on: false, start: 0, acc: 0, laps: [] };
  const TM = { on: false, end: 0, left: 5 * 60e3, total: 5 * 60e3, ring: 0 };
  let tick = 0, timerView = null;
  const swNow = () => SW.acc + (SW.on ? Date.now() - SW.start : 0);
  const tmLeft = () => (TM.on ? Math.max(0, TM.end - Date.now()) : TM.left);
  const clock = (ms, cs) => { const t = Math.floor(ms / 10), c = t % 100, s = Math.floor(t / 100) % 60, m = Math.floor(t / 6000) % 60, hr = Math.floor(t / 360000); return (hr ? hr + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(s).padStart(2, '0') + (cs ? '.' + String(c).padStart(2, '0') : ''); };
  function ticking() {
    if (tick || (!SW.on && !TM.on)) return;
    tick = setInterval(() => {
      if (TM.on && Date.now() >= TM.end) {
        TM.on = false; TM.left = 0;
        sfx('alarm'); setTimeout(() => sfx('alarm'), 700); setTimeout(() => sfx('bell'), 1400);
        X.toast('⏰ Time’s up!', null, 8000);
      }
      if (timerView) timerView();
      if (!SW.on && !TM.on) { clearInterval(tick); tick = 0; }
    }, 50);
  }
  function timerTool(el) {
    const swDisp = h('div', { class: 'tl-big' }), lapsEl = h('ol', { class: 'tl-laps' });
    const swGo = btn('', () => { if (SW.on) { SW.acc = swNow(); SW.on = false; } else { SW.start = Date.now(); SW.on = true; ticking(); } sfx('click'); draw(); }, 'primary');
    const swLap = btn('Lap', () => { if (!SW.on) { SW.acc = 0; SW.laps = []; } else SW.laps.unshift(swNow()); sfx('tick'); draw(); });
    const tmDisp = h('div', { class: 'tl-big' }), bar = h('div', { class: 'tl-bar-fill' });
    const mins = h('input', { type: 'number', min: 0, max: 999, value: 5, 'aria-label': 'Minutes' }), secs = h('input', { type: 'number', min: 0, max: 59, value: 0, 'aria-label': 'Seconds' });
    const setFrom = () => { if (TM.on) return; TM.total = TM.left = (Math.max(0, +mins.value || 0) * 60 + Math.max(0, Math.min(59, +secs.value || 0))) * 1000; draw(); };
    mins.addEventListener('input', setFrom); secs.addEventListener('input', setFrom);
    const tmGo = btn('', () => {
      if (TM.on) { TM.left = tmLeft(); TM.on = false; }
      else { if (TM.left <= 0) setFrom(); if (TM.left <= 0) return; TM.end = Date.now() + TM.left; TM.on = true; ticking(); }
      sfx('click'); draw();
    }, 'primary');
    const tmReset = btn('Reset', () => { TM.on = false; setFrom(); sfx('click'); });
    const quick = [['30s', 30], ['1 min', 60], ['3 min', 180], ['5 min', 300], ['10 min', 600], ['15 min', 900]].map(([l, s]) => btn(l, () => { TM.on = false; mins.value = Math.floor(s / 60); secs.value = s % 60; setFrom(); }, 'small chip-btn'));
    function draw() {
      swDisp.textContent = clock(swNow(), true);
      swGo.textContent = SW.on ? '⏸ Pause' : swNow() ? '▶ Resume' : '▶ Start';
      swLap.textContent = SW.on ? '🏁 Lap' : '↺ Reset';
      lapsEl.replaceChildren(...SW.laps.map((t, i) => h('li', {}, h('span', { class: 'muted' }, `Lap ${SW.laps.length - i}`), h('b', {}, clock(t - (SW.laps[i + 1] || 0), true)), h('span', { class: 'muted' }, clock(t, true)))));
      const left = tmLeft();
      tmDisp.textContent = clock(left + (TM.on ? 999 : 0), false);
      tmDisp.classList.toggle('done', !TM.on && left === 0 && TM.total > 0);
      bar.style.width = (TM.total ? 100 * left / TM.total : 0) + '%';
      tmGo.textContent = TM.on ? '⏸ Pause' : left > 0 && left < TM.total ? '▶ Resume' : '▶ Start';
      mins.disabled = secs.disabled = TM.on;
    }
    timerView = draw;
    el.append(h('div', { class: 'tl-grid2' },
      card('⏱️ Stopwatch', swDisp, h('div', { class: 'tl-row' }, swGo, swLap), lapsEl),
      card('⏲️ Timer', tmDisp, h('div', { class: 'tl-progress' }, bar),
        h('div', { class: 'tl-row tl-mmss' }, h('label', {}, mins, ' min'), h('label', {}, secs, ' sec')),
        h('div', { class: 'tl-row wrap' }, quick),
        h('div', { class: 'tl-row' }, tmGo, tmReset),
        h('p', { class: 'muted tl-hint' }, 'The timer keeps going while you chat, and rings when it’s done.'))));
    if (!TM.on && TM.left === TM.total) { mins.value = Math.floor(TM.total / 60000); secs.value = Math.floor(TM.total / 1000) % 60; }
    draw();
    return () => { timerView = null; };
  }

  /* ================================================================ 🔁 unit converter */
  const UNITS = {
    Length: { m: ['meters', 1], cm: ['centimeters', 0.01], mm: ['millimeters', 0.001], km: ['kilometers', 1000], in: ['inches', 0.0254], ft: ['feet', 0.3048], yd: ['yards', 0.9144], mi: ['miles', 1609.344] },
    Weight: { kg: ['kilograms', 1], g: ['grams', 0.001], mg: ['milligrams', 1e-6], t: ['tonnes', 1000], oz: ['ounces', 0.028349523125], lb: ['pounds', 0.45359237], st: ['stone', 6.35029318] },
    Temperature: { C: ['°C Celsius'], F: ['°F Fahrenheit'], K: ['K Kelvin'] },
    Speed: { 'km/h': ['km per hour', 1 / 3.6], mph: ['miles per hour', 0.44704], 'm/s': ['meters per second', 1], kn: ['knots', 0.514444] },
    Time: { s: ['seconds', 1], min: ['minutes', 60], h: ['hours', 3600], d: ['days', 86400], wk: ['weeks', 604800], yr: ['years', 31557600] },
    Volume: { L: ['liters', 1], mL: ['milliliters', 0.001], tsp: ['teaspoons (US)', 0.00492892], tbsp: ['tablespoons (US)', 0.0147868], cup: ['cups (US)', 0.236588], pt: ['pints (US)', 0.473176], gal: ['gallons (US)', 3.78541] },
    Data: { B: ['bytes', 1], KB: ['kilobytes', 1e3], MB: ['megabytes', 1e6], GB: ['gigabytes', 1e9], TB: ['terabytes', 1e12], bit: ['bits', 0.125] },
    Area: { 'm²': ['square meters', 1], 'km²': ['square km', 1e6], 'ft²': ['square feet', 0.09290304], acre: ['acres', 4046.8564224], ha: ['hectares', 1e4] },
  };
  const toC = { C: (v) => v, F: (v) => (v - 32) * 5 / 9, K: (v) => v - 273.15 }, fromC = { C: (v) => v, F: (v) => v * 9 / 5 + 32, K: (v) => v + 273.15 };
  function convert(cat, v, a, b) {
    if (cat === 'Temperature') return fromC[b](toC[a](v));
    return v * UNITS[cat][a][1] / UNITS[cat][b][1];
  }
  function convertTool(el) {
    let st = load('convert', { cat: 'Length', a: 'km', b: 'mi', v: '1' });
    if (!UNITS[st.cat]) st = { cat: 'Length', a: 'km', b: 'mi', v: '1' };
    const cats = h('div', { class: 'tl-row wrap' });
    const va = h('input', { type: 'text', inputmode: 'decimal', 'aria-label': 'Value' }), vb = h('input', { type: 'text', inputmode: 'decimal', 'aria-label': 'Converted value' });
    const ua = h('select', { class: 'tl-select', 'aria-label': 'From' }), ub = h('select', { class: 'tl-select', 'aria-label': 'To' });
    const note = h('p', { class: 'tl-formula muted' });
    const fill = (sel, cat, v) => { sel.replaceChildren(...Object.entries(UNITS[cat]).map(([k, [n]]) => h('option', { value: k }, `${k} — ${n}`))); sel.value = v; };
    function render(from) {
      const cat = st.cat;
      cats.replaceChildren(...Object.keys(UNITS).map((c) => btn(c, () => { const ks = Object.keys(UNITS[c]); st = { cat: c, a: ks[0], b: ks[1], v: '1' }; fill(ua, c, st.a); fill(ub, c, st.b); va.value = '1'; render('a'); }, 'small chip-btn' + (c === cat ? ' on' : ''))));
      const src = from === 'b' ? vb : va, dst = from === 'b' ? va : vb;
      const n = parseFloat(String(src.value).replace(/,/g, ''));
      if (src.value.trim() === '' || isNaN(n)) dst.value = '';
      else dst.value = fmt(from === 'b' ? convert(cat, n, st.b, st.a) : convert(cat, n, st.a, st.b));
      st.v = va.value;
      const u = (k) => (cat === 'Temperature' && k !== 'K' ? '°' + k : k);
      note.textContent = `1 ${u(st.a)} = ${fmt(convert(cat, 1, st.a, st.b))} ${u(st.b)}`;
      save('convert', st);
    }
    va.addEventListener('input', () => render('a'));
    vb.addEventListener('input', () => render('b'));
    ua.addEventListener('change', () => { st.a = ua.value; render('a'); });
    ub.addEventListener('change', () => { st.b = ub.value; render('a'); });
    const swap = btn('⇄', () => { [st.a, st.b] = [st.b, st.a]; ua.value = st.a; ub.value = st.b; va.value = vb.value || va.value; render('a'); }, 'tl-swap', { title: 'Swap', 'aria-label': 'Swap units' });
    fill(ua, st.cat, st.a); fill(ub, st.cat, st.b); va.value = st.v;
    el.append(card('🔁 Unit converter', cats,
      h('div', { class: 'tl-conv' }, h('div', { class: 'tl-conv-side' }, va, ua), swap, h('div', { class: 'tl-conv-side' }, vb, ub)), note));
    render('a');
  }

  /* ================================================================ 🎲 random */
  const PIPS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  function randomTool(el) {
    // dice
    let nDice = load('dice', 2), sides = load('sides', 6);
    const diceOut = h('div', { class: 'tl-dice' }), total = h('div', { class: 'tl-total' });
    const nSel = h('select', { class: 'tl-select', 'aria-label': 'How many dice', onchange: () => { nDice = +nSel.value; save('dice', nDice); } }, [1, 2, 3, 4, 5, 6].map((n) => h('option', { value: n }, `${n} ${n === 1 ? 'die' : 'dice'}`)));
    const sSel = h('select', { class: 'tl-select', 'aria-label': 'Sides', onchange: () => { sides = +sSel.value; save('sides', sides); } }, [4, 6, 8, 10, 12, 20, 100].map((n) => h('option', { value: n }, `d${n}`)));
    nSel.value = nDice; sSel.value = sides;
    const roll = () => {
      const r = Array.from({ length: nDice }, () => 1 + rand(sides));
      diceOut.replaceChildren(...r.map((v) => h('span', { class: 'tl-die' + (sides === 6 ? ' pips' : '') }, sides === 6 ? PIPS[v] : v)));
      total.textContent = nDice > 1 ? `Total: ${r.reduce((a, b) => a + b, 0)}` : '';
      diceOut.classList.remove('shake'); void diceOut.offsetWidth; diceOut.classList.add('shake');
      sfx('click'); sfx('pop', { vol: 0.5 });
    };
    // coin
    const tally = { H: 0, T: 0 }, coin = h('div', { class: 'tl-coin' }, '🪙'), coinTxt = h('div', { class: 'tl-total' });
    const flip = () => {
      const heads = rand(2) === 0;
      tally[heads ? 'H' : 'T']++;
      coin.textContent = heads ? 'H' : 'T';
      coin.classList.remove('flip'); void coin.offsetWidth; coin.classList.add('flip');
      coinTxt.textContent = `${heads ? 'Heads!' : 'Tails!'}  ·  ${tally.H} heads, ${tally.T} tails`;
      sfx('coin');
    };
    // number
    const lo = h('input', { type: 'number', value: load('lo', 1), 'aria-label': 'From' }), hi = h('input', { type: 'number', value: load('hi', 100), 'aria-label': 'To' }), numOut = h('div', { class: 'tl-total big' });
    const pickNum = () => {
      let a = Math.round(+lo.value), b = Math.round(+hi.value);
      if (!isFinite(a) || !isFinite(b)) return;
      if (a > b) [a, b] = [b, a];
      save('lo', a); save('hi', b);
      numOut.textContent = a + rand(b - a + 1);
      sfx('select');
    };
    // names
    const names = h('textarea', { rows: 5, placeholder: 'One name per line', 'aria-label': 'Names' });
    names.value = load('names', '');
    names.addEventListener('input', () => save('names', names.value));
    const teamsN = h('input', { type: 'number', min: 2, max: 20, value: 2, 'aria-label': 'Number of teams' });
    const namesOut = h('div', { class: 'tl-picked' });
    const list = () => names.value.split('\n').map((s) => s.trim()).filter(Boolean);
    const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const need = (n) => { const l = list(); if (l.length < n) { namesOut.replaceChildren(h('p', { class: 'muted' }, n > 1 ? `Type at least ${n} names, one per line.` : 'Type some names first, one per line.')); return null; } return l; };
    const pickOne = () => { const l = need(1); if (!l) return; namesOut.replaceChildren(h('div', { class: 'tl-total big' }, '🎉 ' + l[rand(l.length)])); sfx('reward'); };
    const teams = () => {
      const k = Math.max(2, Math.min(20, Math.round(+teamsN.value) || 2)), l = need(k);
      if (!l) return;
      const sh = shuffle(l), out = Array.from({ length: k }, () => []);
      sh.forEach((n, i) => out[i % k].push(n));
      namesOut.replaceChildren(h('div', { class: 'tl-teams' }, out.map((t, i) => h('div', { class: 'tl-team' }, h('b', {}, `Team ${i + 1}`), h('ul', {}, t.map((n) => h('li', {}, n)))))));
      sfx('select');
    };
    const order = () => { const l = need(2); if (!l) return; namesOut.replaceChildren(h('ol', { class: 'tl-order' }, shuffle(l).map((n) => h('li', {}, n)))); sfx('select'); };
    el.append(h('div', { class: 'tl-grid2' },
      card('🎲 Dice', h('div', { class: 'tl-row' }, nSel, sSel, btn('Roll', roll, 'primary')), diceOut, total),
      card('🪙 Coin flip', h('div', { class: 'tl-row' }, btn('Flip', flip, 'primary')), coin, coinTxt),
      card('🔢 Random number', h('div', { class: 'tl-row' }, h('label', {}, 'From ', lo), h('label', {}, 'to ', hi), btn('Pick', pickNum, 'primary')), numOut),
      card('🙋 Name picker', names, h('div', { class: 'tl-row wrap' }, btn('Pick one', pickOne, 'primary'), btn('Shuffle order', order), h('span', { class: 'tl-teams-n' }, btn('Make teams', teams), ' of ', teamsN)), namesOut)));
  }

  /* ================================================================ 📝 notes */
  function notesTool(el) {
    let notes = load('notes', null);
    if (!Array.isArray(notes) || !notes.length) notes = [{ id: Date.now(), text: '' }];
    let cur = load('noteCur', notes[0].id);
    if (!notes.some((n) => n.id === cur)) cur = notes[0].id;
    const listEl = h('div', { class: 'tl-notes-list' });
    const ed = h('textarea', { class: 'tl-note', placeholder: 'Write anything… The first line is the title.', 'aria-label': 'Note' });
    const info = h('span', { class: 'muted' });
    const note = () => notes.find((n) => n.id === cur);
    const title = (n) => (n.text.split('\n').find((l) => l.trim()) || 'New note').trim().slice(0, 40);
    const persist = () => { save('notes', notes); save('noteCur', cur); };
    function renderList() {
      listEl.replaceChildren(...notes.map((n) => h('button', { type: 'button', class: 'tl-note-item' + (n.id === cur ? ' on' : ''), onclick: () => { cur = n.id; ed.value = n.text; persist(); renderList(); stats(); ed.focus(); } },
        h('b', {}, title(n)), h('small', { class: 'muted' }, n.at ? new Date(n.at).toLocaleDateString() : ''))));
    }
    const stats = () => { const t = ed.value; info.textContent = `${t.trim() ? t.trim().split(/\s+/).length : 0} words · ${t.length} characters · saved`; };
    ed.addEventListener('input', () => { const n = note(); n.text = ed.value; n.at = Date.now(); persist(); renderList(); stats(); });
    const add = () => { const n = { id: Date.now(), text: '', at: Date.now() }; notes.unshift(n); cur = n.id; ed.value = ''; persist(); renderList(); stats(); ed.focus(); };
    const del = () => {
      const go = () => { notes = notes.filter((n) => n.id !== cur); if (!notes.length) notes = [{ id: Date.now(), text: '' }]; cur = notes[0].id; ed.value = note().text; persist(); renderList(); stats(); };
      if (ed.value.trim()) X.confirm('Delete this note?', 'Delete', go); else go();
    };
    ed.value = note().text;
    el.append(h('div', { class: 'tl-notes' },
      h('div', { class: 'tl-notes-side' }, btn('＋ New note', add, 'primary small'), listEl),
      h('div', { class: 'tl-notes-main' }, ed, h('div', { class: 'tl-row' }, info, h('span', { class: 'grow' }),
        btn('💾 Download', () => X.saveFile((title(note()).replace(/[^\w -]+/g, '').trim() || 'note') + '.txt', new Blob([ed.value], { type: 'text/plain' })), 'small'),
        btn('🗑️ Delete', del, 'small')))));
    renderList(); stats();
  }

  /* ================================================================ ✅ to-do */
  function todoTool(el) {
    let items = load('todo', []);
    const input = h('input', { placeholder: 'Add something to do…', maxlength: 200, 'aria-label': 'New to-do' });
    const listEl = h('ul', { class: 'tl-todo' }), left = h('span', { class: 'muted' });
    const persist = () => save('todo', items);
    function render() {
      listEl.replaceChildren(...(items.length ? items.map((it) => h('li', { class: it.done ? 'done' : '' },
        h('label', {}, h('input', { type: 'checkbox', checked: it.done ? true : null, onchange: (e) => { it.done = e.target.checked; if (it.done) sfx('check'); persist(); render(); } }), h('span', {}, it.text)),
        h('button', { type: 'button', class: 'tl-x', title: 'Remove', 'aria-label': 'Remove', onclick: () => { items = items.filter((x) => x !== it); persist(); render(); } }, '✕'))) : [h('li', { class: 'empty muted' }, 'Nothing to do yet. Add something above!')]));
      const n = items.filter((i) => !i.done).length;
      left.textContent = items.length ? (n ? `${n} left to do` : '🎉 All done!') : '';
    }
    const add = () => { const t = input.value.trim(); if (!t) return; items.push({ text: t, done: false, at: Date.now() }); input.value = ''; persist(); render(); sfx('tap'); };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    el.append(card('✅ To-do list', h('div', { class: 'tl-row' }, input, btn('Add', add, 'primary')), listEl,
      h('div', { class: 'tl-row' }, left, h('span', { class: 'grow' }), btn('Clear done', () => { items = items.filter((i) => !i.done); persist(); render(); }, 'ghost small'))));
    render();
  }

  /* ================================================================ 🎨 colors */
  const hex2rgb = (x) => { const m = /^#?([0-9a-f]{6})$/i.exec(x.trim()) || /^#?([0-9a-f]{3})$/i.exec(x.trim()); if (!m) return null; let s = m[1]; if (s.length === 3) s = s.split('').map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)); };
  const rgb2hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    let hh = 0, s = 0;
    if (d) { s = d / (1 - Math.abs(2 * l - 1)); hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; if (hh < 0) hh += 360; }
    return [Math.round(hh), Math.round(s * 100), Math.round(l * 100)];
  }
  function hsl2rgb(hh, s, l) {
    s /= 100; l /= 100;
    const k = (n) => (n + hh / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0) * 255, f(8) * 255, f(4) * 255];
  }
  const lum = ([r, g, b]) => { const c = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b); };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  function colorTool(el) {
    let col = load('color', '#6d5dfc'), recent = load('recentColors', []);
    const picker = h('input', { type: 'color', 'aria-label': 'Pick a color' }), hexIn = h('input', { 'aria-label': 'Hex color', maxlength: 7, spellcheck: 'false' });
    const swatch = h('div', { class: 'tl-swatch' }), vals = h('div', { class: 'tl-vals' }), shades = h('div', { class: 'tl-shades' }), recentEl = h('div', { class: 'tl-shades small' }), contrastEl = h('div', { class: 'tl-contrast' });
    const copyRow = (label, text) => h('div', { class: 'tl-val' }, h('span', { class: 'muted' }, label), h('code', {}, text), btn('📋', () => X.copyText(text), 'ghost small', { title: 'Copy', 'aria-label': 'Copy ' + label }));
    function set(c, remember) {
      const rgb = hex2rgb(c);
      if (!rgb) return;
      col = rgb2hex(...rgb);
      save('color', col);
      if (remember) { recent = [col].concat(recent.filter((x) => x !== col)).slice(0, 12); save('recentColors', recent); }
      picker.value = col;
      if (document.activeElement !== hexIn) hexIn.value = col;
      swatch.style.background = col;
      const [hh, s, l] = rgb2hsl(...rgb);
      vals.replaceChildren(copyRow('HEX', col), copyRow('RGB', `rgb(${rgb.join(', ')})`), copyRow('HSL', `hsl(${hh}, ${s}%, ${l}%)`));
      shades.replaceChildren(...[10, 20, 30, 40, 50, 60, 70, 80, 90].map((L) => { const hx = rgb2hex(...hsl2rgb(hh, s, L)); return h('button', { type: 'button', class: 'tl-shade', style: `background:${hx}`, title: hx, 'aria-label': hx, onclick: () => set(hx, true) }); }));
      recentEl.replaceChildren(...recent.map((hx) => h('button', { type: 'button', class: 'tl-shade', style: `background:${hx}`, title: hx, 'aria-label': hx, onclick: () => set(hx) })));
      const cw = contrast(rgb, [255, 255, 255]), cb = contrast(rgb, [0, 0, 0]);
      const pass = (r) => (r >= 4.5 ? '✓ easy to read' : r >= 3 ? '~ OK for big text' : '✗ hard to read');
      contrastEl.replaceChildren(
        h('div', { style: `background:${col};color:#fff` }, h('b', {}, 'White text'), h('small', {}, `${cw.toFixed(1)} : 1 · ${pass(cw)}`)),
        h('div', { style: `background:${col};color:#000` }, h('b', {}, 'Black text'), h('small', {}, `${cb.toFixed(1)} : 1 · ${pass(cb)}`)));
    }
    picker.addEventListener('input', () => set(picker.value));
    picker.addEventListener('change', () => set(picker.value, true));
    hexIn.addEventListener('input', () => { if (hex2rgb(hexIn.value)) set(hexIn.value.startsWith('#') ? hexIn.value : '#' + hexIn.value, true); });
    const randomColor = () => { set(rgb2hex(...hsl2rgb(rand(360), 55 + rand(40), 40 + rand(30))), true); sfx('pop', { vol: 0.5 }); };
    el.append(h('div', { class: 'tl-grid2' },
      card('🎨 Color picker', h('div', { class: 'tl-row' }, picker, hexIn, btn('🎲 Random', randomColor)), swatch, vals),
      card('Shades', shades, h('h4', {}, 'Readable on it?'), contrastEl, h('h4', {}, 'Recent'), recentEl)));
    set(col);
  }

  /* ================================================================ 🔤 text tools */
  function textTool(el) {
    const ta = h('textarea', { class: 'tl-text', rows: 9, placeholder: 'Type or paste some text…', 'aria-label': 'Text' });
    ta.value = load('text', '');
    const stats = h('div', { class: 'tl-stats' });
    const find = h('input', { placeholder: 'Find', 'aria-label': 'Find' }), repl = h('input', { placeholder: 'Replace with', 'aria-label': 'Replace with' });
    const update = () => {
      const t = ta.value, words = t.trim() ? t.trim().split(/\s+/).length : 0;
      const n = [['Characters', t.length], ['No spaces', t.replace(/\s/g, '').length], ['Words', words], ['Sentences', (t.match(/[^.!?]+[.!?]+/g) || []).length + (/[^.!?\s]\s*$/.test(t) ? 1 : 0)], ['Lines', t ? t.split('\n').length : 0], ['Reading time', words ? `${Math.max(1, Math.round(words / 200))} min` : '0 min']];
      stats.replaceChildren(...n.map(([k, v]) => h('div', {}, h('b', {}, v), h('small', { class: 'muted' }, k))));
      save('text', t);
    };
    const apply = (f) => () => { ta.value = f(ta.value); update(); sfx('tap', { vol: 0.4 }); };
    const title = (s) => s.toLowerCase().replace(/(^|[\s(\["'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
    const sentence = (s) => s.toLowerCase().replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
    const ops = [
      ['UPPERCASE', (s) => s.toUpperCase()], ['lowercase', (s) => s.toLowerCase()], ['Title Case', title], ['Sentence case', sentence],
      ['aLtErNaTe', (s) => { let i = 0; return s.replace(/\p{L}/gu, (c) => (i++ % 2 ? c.toUpperCase() : c.toLowerCase())); }],
      ['Reverse', (s) => Array.from(s).reverse().join('')], ['Tidy spaces', (s) => s.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim()],
      ['Sort lines', (s) => s.split('\n').sort((a, b) => a.localeCompare(b)).join('\n')], ['Remove repeats', (s) => [...new Set(s.split('\n'))].join('\n')],
    ];
    const replaceAll = () => { if (!find.value) return; const n = ta.value.split(find.value).length - 1; ta.value = ta.value.split(find.value).join(repl.value); update(); X.toast(n ? `Replaced ${n}` : 'Not found'); };
    ta.addEventListener('input', update);
    el.append(card('🔤 Text tools', ta, stats,
      h('div', { class: 'tl-row wrap' }, ops.map(([l, f]) => btn(l, apply(f), 'small'))),
      h('div', { class: 'tl-row' }, find, repl, btn('Replace all', replaceAll, 'small')),
      h('div', { class: 'tl-row' }, btn('📋 Copy', () => X.copyText(ta.value), 'small'), btn('Clear', () => { ta.value = ''; update(); }, 'ghost small'))));
    update();
  }

  /* ================================================================ 🔢 number bases */
  function basesTool(el) {
    const B = [['Decimal', 10, /^-?\d+$/], ['Binary', 2, /^-?[01]+$/], ['Octal', 8, /^-?[0-7]+$/], ['Hex', 16, /^-?[0-9a-f]+$/i]];
    const ins = B.map(([n]) => h('input', { 'aria-label': n, spellcheck: 'false', autocomplete: 'off' }));
    const msg = h('p', { class: 'muted tl-hint' });
    const toStr = (v, base) => (v < 0n ? '-' + (-v).toString(base) : v.toString(base)).toUpperCase();
    function from(i) {
      const pre = { 2: /^(-?)0b/i, 8: /^(-?)0o/i, 16: /^(-?)0x/i }[B[i][1]]; // 0b101, 0o17, 0xff
      const raw = ins[i].value.trim().replace(/[\s_]/g, '').replace(pre || /^$/, '$1');
      if (!raw) { ins.forEach((x, j) => { if (j !== i) x.value = ''; }); msg.textContent = ''; return; }
      if (!B[i][2].test(raw)) { msg.textContent = `That isn’t a ${B[i][0].toLowerCase()} number.`; return; }
      const neg = raw.startsWith('-'), digits = neg ? raw.slice(1) : raw;
      let v = 0n;
      for (const c of digits.toLowerCase()) v = v * BigInt(B[i][1]) + BigInt(parseInt(c, 16));
      if (neg) v = -v;
      ins.forEach((x, j) => { if (j !== i) x.value = toStr(v, B[j][1]); });
      msg.textContent = '';
      save('bases', ins[0].value);
    }
    ins.forEach((x, i) => x.addEventListener('input', () => from(i)));
    // text <-> binary
    const txt = h('textarea', { rows: 3, placeholder: 'Type text to turn it into binary…', 'aria-label': 'Text' }), bin = h('textarea', { rows: 3, placeholder: '…or paste binary (01001000 01101001) to turn it into text', 'aria-label': 'Binary', spellcheck: 'false' });
    txt.addEventListener('input', () => { bin.value = Array.from(new TextEncoder().encode(txt.value), (b) => b.toString(2).padStart(8, '0')).join(' '); });
    bin.addEventListener('input', () => { const bytes = (bin.value.match(/[01]{8}/g) || []).map((b) => parseInt(b, 2)); try { txt.value = new TextDecoder().decode(new Uint8Array(bytes)); } catch { txt.value = ''; } });
    el.append(h('div', { class: 'tl-grid2' },
      card('🔢 Number bases', h('div', { class: 'tl-bases' }, B.map(([n], i) => h('label', {}, h('span', {}, n), ins[i]))), msg),
      card('💬 Text ↔ binary', txt, bin)));
    ins[0].value = load('bases', '42');
    from(0);
  }

  /* ================================================================ the pane */
  function build() {
    tabs = h('div', { class: 'tl-tabs', role: 'tablist', 'aria-label': 'Tools' });
    body = h('div', { class: 'tl-body' });
    pane = h('section', { class: 'tools-pane hidden', id: 'toolsPane' }, tabs, body);
    document.querySelector('.content').insertBefore(pane, document.getElementById('gameDock'));
  }
  function show(id) {
    const t = TOOLS.find((x) => x.id === id) || TOOLS[0];
    if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
    current = t.id;
    save('last', current);
    tabs.replaceChildren(...TOOLS.map((x) => h('button', { type: 'button', role: 'tab', class: 'tl-tab' + (x.id === current ? ' on' : ''), 'aria-selected': x.id === current ? 'true' : 'false', 'data-tool': x.id, onclick: () => { if (x.id !== current) { show(x.id); sfx('tap', { vol: 0.5 }); } } }, h('span', {}, x.icon), ' ', x.name)));
    const holder = h('div', { class: 'tl-tool', 'data-tool': t.id });
    body.replaceChildren(holder);
    cleanup = t.build(holder) || null;
    const on = tabs.querySelector('.on');
    if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  window.ToolsUI = {
    init(helpers) { X = helpers; },
    isOpen: () => open,
    open(id) {
      if (!pane) build();
      open = true;
      pane.classList.remove('hidden');
      document.body.classList.add('tools-open');
      show(id || current || load('last', 'html'));
      X.changed();
    },
    close() {
      if (!open) return;
      open = false;
      if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
      body.replaceChildren(); // (the timer keeps running; its display is rebuilt next time)
      pane.classList.add('hidden');
      document.body.classList.remove('tools-open');
      X.changed();
    },
    // the HTML previewer with this code in it (the AI helper's 🧰 Edit in HTML tool)
    openHtml(code) { save('html', String(code)); window.ToolsUI.open('html'); },
    reset() { if (open) window.ToolsUI.close(); current = null; },
    evaluate, // (for tests)
  };
})();
