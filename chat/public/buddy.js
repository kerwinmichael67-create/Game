// 🧩 Buddy: the AI helper's own small brain. It runs right here in the browser (no server, no Claude, no usage):
// it reads what you wrote and runs the first skill that fits: games to play in the chat, maths, units, dates,
// word tools, jokes and facts, help with Game Chat and its games (buddy-data.js), writing help…
// Buddy.reply(text, mem, ctx) -> { text, quick: [chips], offerClaude }. `mem` is Buddy's memory of you
// (your name, favorites, the game in progress); the AI helper (ai.js) keeps it in this browser.
(function (root) {
  const D = typeof module !== 'undefined' && module.exports ? require('./buddy-data.js') : root.BuddyData;
  const R = { rand: Math.random };
  const pick = (a) => a[Math.floor(R.rand() * a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R.rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const plural = (n, w, p) => n + ' ' + (n === 1 ? w : p || w + 's');
  const fmt = (x) => {
    if (!isFinite(x)) return String(x);
    if (Math.abs(x) >= 1e15 || (Math.abs(x) < 1e-6 && x !== 0)) return x.toExponential(4).replace(/\.?0+e/, 'e');
    const r = Math.round(x * 1e6) / 1e6;
    return r.toLocaleString('en-US', { maximumFractionDigits: 6 });
  };
  // a random one, not one of the last few you saw
  function fresh(mem, kind, cands) {
    mem.seen = mem.seen || {};
    let seen = mem.seen[kind] || [];
    let opts = cands.filter((i) => !seen.includes(i));
    if (!opts.length) { seen = seen.filter((i) => !cands.includes(i)); opts = cands; }
    const i = pick(opts);
    seen.push(i);
    mem.seen[kind] = seen.slice(-40);
    return i;
  }
  const range = (n) => [...Array(n).keys()];

  /* ------------------------------------------------------------ reading what you wrote */
  const SHORT = { whats: 'what is', wats: 'what is', wat: 'what', wut: 'what', whos: 'who is', wheres: 'where is', hows: 'how is', im: 'i am', youre: 'you are', ur: 'your', u: 'you', r: 'are', ive: 'i have', dont: 'do not', doesnt: 'does not', didnt: 'did not', cant: 'cannot', wont: 'will not', isnt: 'is not', arent: 'are not', thats: 'that is', theres: 'there is', pls: 'please', plz: 'please', wanna: 'want to', gonna: 'going to', gimme: 'give me', lemme: 'let me', ya: 'you', thx: 'thanks', ty: 'thanks', favourite: 'favorite', favourites: 'favorites', colour: 'color', maths: 'math', idk: 'i do not know', dunno: 'do not know', tho: 'though', cuz: 'because', coz: 'because', bc: 'because' };
  function clean(s) {
    const w = s.toLowerCase().replace(/[’‘`]/g, "'").replace(/'/g, '').match(/[a-z0-9]+/g) || [];
    return w.map((x) => SHORT[x] || x).join(' ');
  }
  const FLUFF = /^(?:(?:hey|hi|hello|ok|okay|so|um|uh|well|please|buddy|yo|oh|and|also|now|alright|hmm) )+|^(?:can|could|would|will) you (?:please )?|^(?:i want you to|i need you to|i want to|i would like to|i would like you to|help me|i need to|i need) (?!know)/;
  const unfluff = (t) => { let p; do { p = t; t = t.replace(FLUFF, ''); } while (t !== p && t); return t.replace(/ please$/, ''); };

  const STOP = new Set('a an the is are was were be been am to of in on at for with and or but i me my mine you your it its this that these those what how why when where who whom which do does did can could would should will shall please tell about give show explain teach some any much many more most there here just really very so too also if then than as by from into up out get got let us we our they them their he she him her his have has had not no yes ok okay hey hi hello want need know like'.split(' '));
  function stem(w) {
    if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
    if (w.length > 4 && /(s|x|z|ch|sh|o)es$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
    if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
    if (w.length > 4 && w.endsWith('ed')) return w.slice(0, -2);
    return w;
  }
  const terms = (t) => clean(t).split(' ').filter((w) => w && !STOP.has(w)).map(stem);

  /* ------------------------------------------------------------ the knowledge base: closest match */
  const KB = [].concat(D.chat, D.games, D.blox, D.know).map((e) => ({ a: e.a, k: e.k, keys: e.k.map(terms).filter((k) => k.length) }));
  const DF = new Map();
  KB.forEach((e) => new Set(e.keys.flat()).forEach((w) => DF.set(w, (DF.get(w) || 0) + 1)));
  const idf = (w) => (DF.has(w) ? 1 + Math.log(KB.length / DF.get(w)) : 1);
  function best(q) {
    const qs = [...new Set(terms(q))];
    if (!qs.length) return null;
    const qWeight = qs.reduce((s, w) => s + idf(w), 0);
    let top = null;
    for (const e of KB) {
      for (const k of e.keys) {
        let hit = 0, all = 0;
        for (const w of k) { all += idf(w); if (qs.includes(w)) hit += idf(w); }
        const kc = hit / all, qc = hit / qWeight, score = kc * 0.7 + qc * 0.3;
        if (!top || score > top.score) top = { e, k, kc, qc, score };
      }
    }
    return top;
  }
  const kbOk = (m) => m && m.qc >= 0.25 && (m.k.length === 1 ? m.kc === 1 : m.kc >= 0.66);

  /* ------------------------------------------------------------ numbers in words */
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const BIG = { hundred: 100, thousand: 1e3, million: 1e6, billion: 1e9 };
  function wordNums(s) {
    const W = new RegExp('\\b(?:(?:' + ONES.join('|') + '|' + TENS.slice(2).join('|') + '|hundred|thousand|million|billion|a hundred|a thousand)(?:[ -](?:and )?)?)+\\b', 'g');
    return s.replace(W, (m) => {
      const ws = m.trim().replace(/-/g, ' ').split(/\s+/).filter((w) => w !== 'and');
      if (ws[0] === 'a') ws[0] = 'one';
      let total = 0, cur = 0, any = false;
      for (const w of ws) {
        const o = ONES.indexOf(w), t = TENS.indexOf(w);
        if (o >= 0) { cur += o; any = true; } else if (t >= 2) { cur += t * 10; any = true; } else if (w === 'hundred') { cur = (cur || 1) * 100; any = true; } else if (BIG[w]) { total += (cur || 1) * BIG[w]; cur = 0; any = true; }
      }
      return any ? ' ' + (total + cur) + (/\s$/.test(m) ? ' ' : '') : m;
    }).replace(/\s+/g, ' ');
  }
  const num = (s) => { s = wordNums(String(s).toLowerCase()).trim().replace(/,/g, ''); return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN; };

  /* ------------------------------------------------------------ exact maths with fractions */
  const BI = (x) => BigInt(x);
  const babs = (a) => (a < 0n ? -a : a);
  const bgcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };
  const Q = (n, d = 1n) => { if (d < 0n) { n = -n; d = -d; } const g = bgcd(n, d) || 1n; return { n: n / g, d: d / g }; };
  const fromNum = (s) => { const [i, f = ''] = s.split('.'); return Q(BI(i + f), 10n ** BI(f.length)); };
  const V = {
    add: (a, b) => (a.f !== undefined || b.f !== undefined ? { f: V.num(a) + V.num(b) } : Q(a.n * b.d + b.n * a.d, a.d * b.d)),
    sub: (a, b) => V.add(a, V.neg(b)),
    neg: (a) => (a.f !== undefined ? { f: -a.f } : Q(-a.n, a.d)),
    mul: (a, b) => (a.f !== undefined || b.f !== undefined ? { f: V.num(a) * V.num(b) } : Q(a.n * b.n, a.d * b.d)),
    div: (a, b) => {
      if (V.num(b) === 0) throw { zero: true };
      return a.f !== undefined || b.f !== undefined ? { f: V.num(a) / V.num(b) } : Q(a.n * b.d, a.d * b.n);
    },
    pow: (a, b) => {
      if (a.f === undefined && b.f === undefined && b.d === 1n && babs(b.n) <= 64n && babs(a.n) < 10n ** 12n) {
        const e = b.n < 0n ? -b.n : b.n;
        const r = Q(a.n ** e, a.d ** e);
        return b.n < 0n ? V.div(Q(1n), r) : r;
      }
      return { f: Math.pow(V.num(a), V.num(b)) };
    },
    sqrt: (a) => {
      const x = V.num(a);
      if (x < 0) throw { neg: true };
      if (a.f === undefined) {
        const rn = Math.round(Math.sqrt(Number(a.n))), rd = Math.round(Math.sqrt(Number(a.d)));
        if (BI(rn) * BI(rn) === a.n && BI(rd) * BI(rd) === a.d) return Q(BI(rn), BI(rd));
      }
      return { f: Math.sqrt(x) };
    },
    mod: (a, b) => { const x = V.num(a), y = V.num(b); if (y === 0) throw { zero: true }; return Number.isInteger(x) && Number.isInteger(y) ? Q(BI(((x % y) + y) % y)) : { f: x % y }; },
    num: (a) => (a.f !== undefined ? a.f : Number(a.n) / Number(a.d)),
    show(a, frac) {
      if (a.f !== undefined) return fmt(a.f);
      if (a.d === 1n) return BigInt.asIntN(64, a.n) === a.n && babs(a.n) < 10n ** 15n ? Number(a.n).toLocaleString('en-US') : a.n.toString();
      let d = a.d;
      while (d % 2n === 0n) d /= 2n;
      while (d % 5n === 0n) d /= 5n;
      const dec = fmt(V.num(a));
      if (d === 1n && !frac) return dec; // ends: 3.5, 0.25
      return `${a.n}/${a.d}` + (d === 1n ? ` (= ${dec})` : ` (≈ ${dec})`);
    },
  };
  // tokens: numbers, + - * / ^ ( ) √ mod, and (in equations) one letter
  function lex(s, letter) {
    const out = [];
    const re = /\s*(\d+(?:\.\d+)?|\.\d+|mod|[a-z]|[-+*/^()√%])/y;
    let m, i = 0;
    s = s.trim();
    while (i < s.length) {
      re.lastIndex = i;
      m = re.exec(s);
      if (!m) return null;
      const tk = m[1];
      if (/^[a-z]$/.test(tk) && tk !== letter) return null;
      out.push(tk);
      i = re.lastIndex;
      while (i < s.length && s[i] === ' ') i++;
    }
    // 2x, 3(…), )(, x(… → multiply
    const fixed = [];
    for (const tk of out) {
      const prev = fixed[fixed.length - 1];
      const prevVal = prev !== undefined && (/^[\d.]/.test(prev) || prev === ')' || prev === letter);
      if (prevVal && (/^[\d.(√]/.test(tk) || tk === letter)) fixed.push('*');
      fixed.push(tk);
    }
    return fixed;
  }
  // a polynomial in the letter (powers 0..2), coefficients exact; plain sums are polynomials with no letter
  const P = {
    c: (v) => [v],
    add: (a, b) => { const r = []; for (let i = 0; i < Math.max(a.length, b.length); i++) r.push(a[i] && b[i] ? V.add(a[i], b[i]) : a[i] || b[i]); return r; },
    neg: (a) => a.map((v) => v && V.neg(v)),
    mul(a, b) {
      const r = [];
      a.forEach((x, i) => b.forEach((y, j) => { if (!x || !y) return; const p = V.mul(x, y); r[i + j] = r[i + j] ? V.add(r[i + j], p) : p; }));
      if (r.length > 3 && r.slice(3).some((v) => v && V.num(v) !== 0)) throw { hard: true };
      return r.slice(0, 3);
    },
    deg: (a) => { for (let i = a.length - 1; i > 0; i--) if (a[i] && V.num(a[i]) !== 0) return i; return 0; },
    k: (a) => a[0] || Q(0n),
  };
  function parse(tokens, letter) {
    let i = 0;
    const peek = () => tokens[i];
    const take = () => tokens[i++];
    function expr() {
      let v = term();
      while (peek() === '+' || peek() === '-') { const op = take(); const r = term(); v = op === '+' ? P.add(v, r) : P.add(v, P.neg(r)); }
      return v;
    }
    function term() {
      let v = unary();
      while (peek() === '*' || peek() === '/' || peek() === 'mod') {
        const op = take(), r = unary();
        if (op === '*') v = P.mul(v, r);
        else {
          if (P.deg(r) > 0 || (op === 'mod' && P.deg(v) > 0)) throw { hard: true };
          v = op === '/' ? v.map((c) => c && V.div(c, P.k(r))) : [V.mod(P.k(v), P.k(r))];
        }
      }
      return v;
    }
    function unary() {
      if (peek() === '-') { take(); return P.neg(unary()); }
      if (peek() === '+') { take(); return unary(); }
      if (peek() === '√') { take(); const v = unary(); if (P.deg(v) > 0) throw { hard: true }; return [V.sqrt(P.k(v))]; }
      return power();
    }
    function power() {
      let v = atom();
      while (peek() === '%') { take(); v = v.map((c) => c && V.div(c, Q(100n))); }
      if (peek() === '^') {
        take();
        const e = unary();
        if (P.deg(e) > 0) throw { hard: true };
        const ev = P.k(e);
        if (P.deg(v) > 0) {
          if (V.num(ev) !== 2 && V.num(ev) !== 1) throw { hard: true };
          return V.num(ev) === 2 ? P.mul(v, v) : v;
        }
        return [V.pow(P.k(v), ev)];
      }
      return v;
    }
    function atom() {
      const tk = take();
      if (tk === undefined) throw { bad: true };
      if (tk === '(') { const v = expr(); if (take() !== ')') throw { bad: true }; return v; }
      if (tk === letter) return [Q(0n), Q(1n)];
      if (/^[\d.]/.test(tk)) return [fromNum(tk.startsWith('.') ? '0' + tk : tk)];
      throw { bad: true };
    }
    const v = expr();
    if (i < tokens.length) throw { bad: true };
    return v;
  }
  // "what is fifteen percent of 80", "12 x 7", "square root of 81" -> "15/100*80" etc.
  function mathText(raw) {
    let s = ' ' + raw.toLowerCase().replace(/[’']/g, '').replace(/[×✕✖]/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\?|!|=\s*$/g, ' ') + ' ';
    s = s.replace(/^\s*(?:hey |ok |so |please |buddy )*(?:can you |could you )?(?:please )?(?:what\s?is|whats|what are|calculate|calc|compute|work out|evaluate|how much is|tell me|do|find|solve|figure out)\b/g, ' ');
    s = s.replace(/\b(?:equals?|is equal to)\s*$/, ' ').replace(/\bplease\b/g, ' ');
    s = wordNums(s);
    s = s.replace(/(\d),(\d{3})\b/g, '$1$2').replace(/(\d),(\d{3})\b/g, '$1$2');
    s = s.replace(/\b(\d+(?:\.\d+)?)\s*(?:%|percent|per cent)\s*off\s*(\d+(?:\.\d+)?)/g, '$2*(1-$1/100)');
    s = s.replace(/\b(\d+(?:\.\d+)?)\s*(?:%|percent|per cent)\s*of\b/g, '$1%*');
    s = s.replace(/\b(\d+(?:\.\d+)?)\s*(?:percent|per cent)/g, '$1%');
    s = s.replace(/\bhalf of\b/g, '0.5*').replace(/\b(?:a )?quarter of\b/g, '0.25*').replace(/\bdouble\b/g, '2*').replace(/\btriple\b/g, '3*');
    s = s.replace(/\b(?:the )?sum of (\S+) and (\S+)/g, '($1+$2)').replace(/\b(?:the )?product of (\S+) and (\S+)/g, '($1*$2)').replace(/\b(?:the )?difference (?:between|of) (\S+) and (\S+)/g, '($1-$2)').replace(/\b(?:the )?(?:quotient|division) of (\S+) and (\S+)/g, '($1/$2)');
    s = s.replace(/\badd (\S+) (?:and|to) (\S+)/g, '($1+$2)').replace(/\bsubtract (\S+) from (\S+)/g, '($2-$1)').replace(/\bmultiply (\S+) (?:and|by) (\S+)/g, '($1*$2)').replace(/\bdivide (\S+) by (\S+)/g, '($1/$2)');
    s = s.replace(/\b(?:the )?(?:square root|sqrt|root) of\b|\bsqrt\b/g, '√').replace(/\b(?:the )?square of (\S+)/g, '($1)^2').replace(/\b(?:the )?cube of (\S+)/g, '($1)^3');
    s = s.replace(/\bsquared\b/g, '^2').replace(/\bcubed\b/g, '^3').replace(/\bto the (?:power of )?(\S+?)(?:st|nd|rd|th)?(?: power)?\b/g, '^$1').replace(/\b(?:raised to|power of|to the power)\b/g, '^');
    s = s.replace(/\b(?:plus|and|add|added to)\b/g, '+').replace(/\b(?:minus|take away|subtract|less)\b/g, '-').replace(/\b(?:times|multiplied by|multiply by|lots of|groups of)\b/g, '*').replace(/\b(?:divided by|divide by|over|shared between|split between)\b/g, '/').replace(/\b(?:modulo|remainder of|remainder)\b/g, 'mod');
    s = s.replace(/(\d|\))\s*x\s*(?=[\d(√])/g, '$1*');
    return s.replace(/\s+/g, ' ').trim();
  }
  function calc(raw) {
    const s = mathText(raw);
    if (!/\d/.test(s) || !/[-+*/^√%]|mod/.test(s.replace(/^-/, ''))) return null;
    const tokens = lex(s, null);
    if (!tokens) return null;
    const pretty = tokens.join(' ').replace(/ \* /g, ' × ').replace(/\( /g, '(').replace(/ \)/g, ')').replace(/√ /g, '√').replace(/ %/g, '%').replace(/- (\d)/g, (m, d, o, str) => (o === 0 || /[-+*/^(×] $/.test(str.slice(0, o)) ? '-' + d : m));
    const frac = /\d\s*\/\s*\d/.test(raw) && !/\bdivided\b/.test(raw);
    const shown0 = (frac ? pretty.replace(/(\d) \/ (\d)/g, '$1/$2') : pretty.replace(/ \/ /g, ' ÷ ')).replace(/% × /g, '% of ');
    try {
      const v = parse(tokens, null);
      const shown = V.show(v[0], frac);
      return `${shown0} = **${shown}**`;
    } catch (e) {
      if (e && e.zero) return 'You can’t divide by zero! 🍪 Sharing cookies between 0 friends just doesn’t work: the answer is **undefined**.';
      if (e && e.neg) return 'A negative number has no (real) square root, since any number times itself is positive.';
      return null;
    }
  }
  // "2x + 3 = 11", "solve 3(y - 2) = 12"
  function solve(raw) {
    let s = raw.toLowerCase().replace(/[×✕✖]/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\?/g, '');
    if ((s.match(/=/g) || []).length !== 1) return null;
    s = s.replace(/^.*?(?:solve(?: for [a-z])?|find [a-z](?: if| when| in)?|what is [a-z](?: if| when| in)?|work out [a-z](?: if)?)\s*:?/, '').replace(/^\s*(?:for [a-z]\s*:?)?/, '');
    s = wordNums(s);
    const letters = [...new Set((s.match(/(?<![a-z])[a-z](?![a-z])/g) || []))];
    if (letters.length !== 1) return null;
    const L = letters[0];
    const [ls, rs] = s.split('=');
    const lt = lex(ls, L), rt = lex(rs, L);
    if (!lt || !rt || !lt.length || !rt.length) return null;
    let lp, rp;
    try { lp = parse(lt, L); rp = parse(rt, L); } catch (e) { return e && e.hard ? `That one’s a bit too tricky for me — I solve equations with ${L} and ${L}². Try ✨ Claude for harder ones!` : null; }
    const p = P.add(lp, P.neg(rp)); // p = 0
    const a2 = p[2] ? V.num(p[2]) : 0, a1 = p[1] || Q(0n), a0 = P.k(p);
    const eq = `${ls.trim()} = ${rs.trim()}`;
    if (a2 === 0) {
      if (V.num(a1) === 0) return V.num(a0) === 0 ? `**${eq}** is true for every ${L}! Both sides are always the same.` : `**${eq}** has no answer: no value of ${L} makes both sides equal.`;
      const x = V.div(V.neg(a0), a1);
      // ax + b = c: show the two usual steps when the equation looks like that
      const L1 = P.k(lp), A = lp[1] || Q(0n), Rk = P.k(rp), Ra = rp[1] || Q(0n);
      const steps = [];
      if (V.num(Ra) !== 0) steps.push(`Move the ${L}’s to one side: ${V.show(V.sub(A, Ra))}${L} ${V.num(L1) >= 0 ? '+' : '−'} ${V.show(L1.n < 0n ? V.neg(L1) : L1)} = ${V.show(Rk)}`);
      const coef = V.sub(A, Ra), rest = V.sub(Rk, L1);
      if (V.num(L1) !== 0) steps.push(`${V.num(L1) > 0 ? 'Subtract ' + V.show(L1) + ' from' : 'Add ' + V.show(V.neg(L1)) + ' to'} both sides: ${V.show(coef) === '1' ? '' : V.show(coef)}${L} = ${V.show(rest)}`);
      if (V.show(coef) !== '1') steps.push(`Divide both sides by ${V.show(coef)}: ${L} = ${V.show(x)}`);
      return `Solving **${eq}**:\n` + steps.map((st, i) => `${i + 1}. ${st}`).join('\n') + (steps.length ? '\n' : '') + `So **${L} = ${V.show(x)}** ✅`;
    }
    // quadratic
    const a = a2, b = V.num(a1), c = V.num(a0), disc = b * b - 4 * a * c;
    if (disc < 0) return `**${eq}** has no real answers (the discriminant b² − 4ac = ${fmt(disc)} is negative).`;
    const r1 = (-b + Math.sqrt(disc)) / (2 * a), r2 = (-b - Math.sqrt(disc)) / (2 * a);
    return `Solving **${eq}** with the quadratic formula (a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}):\n${disc === 0 ? `**${L} = ${fmt(r1)}**` : `**${L} = ${fmt(Math.max(r1, r2))}** or **${L} = ${fmt(Math.min(r1, r2))}**`} ✅`;
  }

  /* ------------------------------------------------------------ number facts */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const isPrime = (n) => { if (n < 2 || !Number.isInteger(n)) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
  const factors = (n) => { const f = []; for (let i = 1; i * i <= n; i++) if (n % i === 0) { f.push(i); if (i * i !== n) f.push(n / i); } return f.sort((a, b) => a - b); };
  const primeFactors = (n) => { const f = []; for (let p = 2; p * p <= n; p++) while (n % p === 0) { f.push(p); n /= p; } if (n > 1) f.push(n); return f; };
  const ROMAN = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  const toRoman = (n) => ROMAN.reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, '');
  const fromRoman = (s) => { s = s.toUpperCase(); let n = 0; const v = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }; for (let i = 0; i < s.length; i++) { const a = v[s[i]], b = v[s[i + 1]] || 0; n += a < b ? -a : a; } return toRoman(n) === s ? n : NaN; };
  const nums = (s) => (wordNums(s.toLowerCase()).replace(/(\d),(\d{3})\b/g, '$1$2').match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  const BIGN = 1e12;

  function numberSkills(c) {
    const t = c.t, raw = c.raw;
    let m;
    if ((m = /\bis (\S+) (?:a )?prime(?: number)?\b/.exec(t)) || (m = /\bprime\b.*?\b(\d+)\b/.exec(t)) && /\bis\b/.test(t)) {
      const n = num(m[1]);
      if (!Number.isInteger(n) || n > BIGN) return n > BIGN ? 'That’s too big for me to check quickly!' : null;
      if (isPrime(n)) return `Yes! **${n.toLocaleString()} is prime** — its only factors are 1 and ${n.toLocaleString()}. ✅`;
      if (n < 2) return `No — **${n}** isn’t prime. Prime numbers start at 2.`;
      const f = primeFactors(n);
      return `No, **${n.toLocaleString()} isn’t prime**: it’s ${f[0]} × ${(n / f[0]).toLocaleString()}.`;
    }
    if ((m = /\bprime factori[sz]ation of (\S+)|\bprime factors (?:of|for) (\S+)/.exec(t))) {
      const n = num(m[1] || m[2]);
      if (!Number.isInteger(n) || n < 2 || n > BIGN) return null;
      const f = primeFactors(n), grouped = {};
      f.forEach((p) => (grouped[p] = (grouped[p] || 0) + 1));
      const pow = Object.entries(grouped).map(([p, k]) => (k > 1 ? `${p}^${k}` : p)).join(' × ');
      return f.length === 1 ? `**${n}** is prime, so its only prime factor is itself.` : `**${n.toLocaleString()} = ${f.join(' × ')}**${pow !== f.join(' × ') ? ` (= ${pow})` : ''}`;
    }
    if ((m = /\b(?:factors|divisors) (?:of|for) (\S+)|\bwhat (?:are|goes into|divides) (\S+)$/.exec(t))) {
      const n = num(m[1] || m[2]);
      if (!Number.isInteger(n) || n < 1 || n > 1e9) return null;
      const f = factors(n);
      return `The factors of **${n.toLocaleString()}** are: ${f.join(', ')} (${f.length} factors)${f.length === 2 ? ' — it’s prime!' : ''}`;
    }
    if (/\b(?:gcd|gcf|hcf|greatest common (?:factor|divisor)|highest common factor|biggest common factor)\b/.test(t)) {
      const ns = nums(t).filter(Number.isInteger);
      if (ns.length < 2) return null;
      return `The greatest common factor of ${ns.join(', ')} is **${ns.reduce(gcd)}**.`;
    }
    if (/\b(?:lcm|least common multiple|lowest common multiple|smallest common multiple)\b/.test(t)) {
      const ns = nums(t).filter((n) => Number.isInteger(n) && n > 0);
      if (ns.length < 2) return null;
      const l = ns.reduce((a, b) => (a / gcd(a, b)) * b);
      return `The least common multiple of ${ns.join(', ')} is **${l.toLocaleString()}**.`;
    }
    if ((m = /\b(\S+) times tables?\b|\btimes tables? (?:of|for) (\S+)|\bmultiplication tables? (?:of|for) (\S+)|\b(\S+) multiplication table/.exec(t))) {
      const n = num(m[1] || m[2] || m[3] || m[4]);
      if (!isFinite(n) || Math.abs(n) > 1e6) return null;
      return `The **${n} times table**:\n\`\`\`\n` + range(12).map((i) => `${String(i + 1).padStart(2)} × ${n} = ${fmt((i + 1) * n)}`).join('\n') + '\n```';
    }
    if ((m = /\b(average|mean|median|mode|range)\b/.exec(t)) && /\bof\b|:/.test(raw.toLowerCase()) && nums(t).length >= 2) {
      const ns = nums(t), sum = ns.reduce((a, b) => a + b, 0), sorted = ns.slice().sort((a, b) => a - b);
      const mid = sorted.length / 2, median = sorted.length % 2 ? sorted[Math.floor(mid)] : (sorted[mid - 1] + sorted[mid]) / 2;
      const cnt = {};
      ns.forEach((n) => (cnt[n] = (cnt[n] || 0) + 1));
      const top = Math.max(...Object.values(cnt)), modes = Object.keys(cnt).filter((k) => cnt[k] === top);
      const lines = [`Numbers: ${ns.join(', ')}`, `**Mean (average):** ${fmt(sum / ns.length)} (${fmt(sum)} ÷ ${ns.length})`, `**Median (middle):** ${fmt(median)}`, `**Mode (most common):** ${top === 1 ? 'none — every number appears once' : modes.join(', ')}`, `**Range:** ${fmt(sorted[sorted.length - 1] - sorted[0])}`];
      return lines.join('\n');
    }
    if ((m = /\bround (-?[\d.,]+) to (?:the )?(?:nearest )?(\S+)(?: (decimal places?|dp|places?|decimals?))?/.exec(raw.toLowerCase().replace(/[’']/g, '')))) {
      const x = parseFloat(m[1].replace(/,/g, ''));
      let w = m[2], how = m[3];
      if (!isFinite(x)) return null;
      const step = { whole: 1, one: 1, ones: 1, integer: 1, ten: 10, tens: 10, hundred: 100, hundreds: 100, thousand: 1000, thousands: 1000, tenth: 0.1, tenths: 0.1, hundredth: 0.01, hundredths: 0.01, thousandth: 0.001 }[w.replace(/s$/, '')] || { whole: 1 }[w];
      if (how || /^\d+$/.test(w)) {
        const dp = num(w);
        if (!Number.isInteger(dp) || dp > 10) return null;
        return `${fmt(x)} rounded to ${plural(dp, 'decimal place')} is **${x.toFixed(dp)}**.`;
      }
      if (!step) return null;
      return `${fmt(x)} rounded to the nearest ${w.replace(/s$/, '')} is **${fmt(Math.round(x / step) * step)}**.`;
    }
    if ((m = /\b(\d+) (?:in|to|as|into) roman(?: numerals?)?\b|\broman numerals? (?:for|of) (\d+)/.exec(t))) {
      const n = +(m[1] || m[2]);
      if (n < 1 || n > 3999) return 'Roman numerals only go from 1 to 3,999 (there’s no zero!).';
      return `**${n}** in Roman numerals is **${toRoman(n)}**.`;
    }
    if ((m = /\b([ivxlcdm]+) (?:in|to|as|into) (?:numbers?|arabic|digits|normal numbers)\b|\bwhat (?:number )?is (?:the roman numeral )?([ivxlcdm]{2,})$/.exec(t))) {
      const n = fromRoman(m[1] || m[2]);
      if (!isFinite(n)) return null;
      return `**${(m[1] || m[2]).toUpperCase()}** is **${n.toLocaleString()}**.`;
    }
    if ((m = /\bis (\S+) (?:an )?(even|odd)\b/.exec(t))) {
      const n = num(m[1]);
      if (!Number.isInteger(n)) return null;
      const even = n % 2 === 0;
      return `${even === (m[2] === 'even') ? 'Yes' : 'No'} — **${n.toLocaleString()} is ${even ? 'even' : 'odd'}**${even ? '' : ' (it ends in ' + String(Math.abs(n)).slice(-1) + ')'}.`;
    }
    if ((m = /\bsimplify (\d+) ?\/ ?(\d+)|\b(\d+) ?\/ ?(\d+) (?:in )?(?:simplest|lowest) (?:form|terms)/.exec(raw.toLowerCase()))) {
      const n = +(m[1] || m[3]), d = +(m[2] || m[4]);
      if (!d) return null;
      const g = gcd(n, d);
      return g === 1 ? `**${n}/${d}** is already in its simplest form.` : `${n}/${d} = **${n / g}/${d / g}** (divide the top and bottom by ${g}).`;
    }
    if ((m = /\b(\d+) ?\/ ?(\d+) (?:as|to|in|into) (?:a )?(decimal|percent(?:age)?|%)/.exec(raw.toLowerCase()))) {
      const n = +m[1], d = +m[2];
      if (!d) return null;
      return m[3] === 'decimal' ? `${n}/${d} = **${fmt(n / d)}**` : `${n}/${d} = **${fmt((n / d) * 100)}%**`;
    }
    if ((m = /\b(\d*\.\d+) (?:as|to|in|into) (?:a )?fraction/.exec(raw.toLowerCase()))) {
      const q = fromNum(m[1].startsWith('.') ? '0' + m[1] : m[1]);
      return `${m[1]} = **${q.n}/${q.d}**`;
    }
    if ((m = /^(\d+(?:\.\d+)?) ?(?:%|percent) off (?:of )?(?:\$|£|€)?(\d+(?:\.\d+)?)$/.exec(raw.toLowerCase().replace(/[’']/g, '').replace(/[?!.]+$/, '').trim().replace(/^(?:what is |whats |how much is )/, '')))) {
      const p = +m[1], x = +m[2], save = (x * p) / 100;
      return `${fmt(p)}% off ${fmt(x)} = **${fmt(x - save)}** (you save ${fmt(save)}). 🏷️`;
    }
    if ((m = /\bwhat percent(?:age)? (?:of )?(\S+) is (\S+)|\bwhat percent(?:age)? is (\S+) (?:of|out of) (\S+)|\b(\S+) (?:out of|of) (\S+) (?:as a|in|to) (?:percent|percentage)/.exec(t))) {
      let part, whole;
      if (m[1]) { whole = num(m[1]); part = num(m[2]); } else if (m[3]) { part = num(m[3]); whole = num(m[4]); } else { part = num(m[5]); whole = num(m[6]); }
      if (!isFinite(part) || !whole) return null;
      return `${fmt(part)} out of ${fmt(whole)} is **${fmt((part / whole) * 100)}%**.`;
    }
    // shapes
    if ((m = /\b(area|perimeter|circumference)\b.*?\b(circle|square|rectangle|triangle)\b/.exec(t))) {
      const what = m[1], shape = m[2], ns = nums(t.replace(/^.*?\b(?:circle|square|rectangle|triangle)\b/, ''));
      const get = (w) => { const r = new RegExp('\\b' + w + '\\b(?: (?:of|is|=))? (\\d+(?:\\.\\d+)?)|(\\d+(?:\\.\\d+)?)\\s?\\w* ' + w + '\\b').exec(t); return r ? +(r[1] || r[2]) : NaN; };
      if (shape === 'circle') {
        let r = get('radius');
        const d = get('diameter');
        if (!isFinite(r) && isFinite(d)) r = d / 2;
        if (!isFinite(r)) r = ns[0];
        if (!isFinite(r)) return 'What’s the circle’s radius? Try “area of a circle with radius 4”.';
        return what === 'area' ? `Area of a circle = π × r² = π × ${fmt(r)}² ≈ **${fmt(Math.round(Math.PI * r * r * 100) / 100)}** square units.` : `Circumference = 2 × π × r = 2 × π × ${fmt(r)} ≈ **${fmt(Math.round(2 * Math.PI * r * 100) / 100)}** units.`;
      }
      if (shape === 'square') {
        const s = isFinite(get('side')) ? get('side') : ns[0];
        if (!isFinite(s)) return 'How long is a side? Try “area of a square with side 5”.';
        return what === 'area' ? `Area of a square = side × side = ${fmt(s)} × ${fmt(s)} = **${fmt(s * s)}** square units.` : `Perimeter of a square = 4 × side = **${fmt(4 * s)}** units.`;
      }
      if (shape === 'rectangle') {
        const l = isFinite(get('length')) ? get('length') : ns[0], w = isFinite(get('width')) ? get('width') : ns[1];
        if (!isFinite(l) || !isFinite(w)) return 'I need the length and the width. Try “area of a rectangle 5 by 3”.';
        return what === 'area' ? `Area of a rectangle = length × width = ${fmt(l)} × ${fmt(w)} = **${fmt(l * w)}** square units.` : `Perimeter of a rectangle = 2 × (length + width) = 2 × (${fmt(l)} + ${fmt(w)}) = **${fmt(2 * (l + w))}** units.`;
      }
      if (shape === 'triangle') {
        if (what !== 'area') return ns.length >= 3 ? `Perimeter of the triangle = ${ns.slice(0, 3).map(fmt).join(' + ')} = **${fmt(ns[0] + ns[1] + ns[2])}** units.` : 'For a triangle’s perimeter, give me all three sides, like “perimeter of a triangle with sides 3, 4 and 5”.';
        const b = isFinite(get('base')) ? get('base') : ns[0], h = isFinite(get('height')) ? get('height') : ns[1];
        if (!isFinite(b) || !isFinite(h)) return 'I need the base and the height. Try “area of a triangle with base 6 and height 4”.';
        return `Area of a triangle = ½ × base × height = ½ × ${fmt(b)} × ${fmt(h)} = **${fmt((b * h) / 2)}** square units.`;
      }
    }
    return null;
  }

  /* ------------------------------------------------------------ units */
  const UNITS = {
    length: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, 'nautical mile': 1852, 'light year': 9.4607e15 },
    mass: { mg: 1e-6, g: 0.001, kg: 1, tonne: 1000, oz: 0.028349523125, lb: 0.45359237, stone: 6.35029318, 'us ton': 907.18474 },
    volume: { ml: 0.001, cl: 0.01, l: 1, tsp: 0.00492892, tbsp: 0.0147868, 'fl oz': 0.0295735, cup: 0.236588, pint: 0.473176, quart: 0.946353, gallon: 3.78541, 'cubic meter': 1000 },
    time: { ms: 0.001, s: 1, min: 60, h: 3600, day: 86400, week: 604800, fortnight: 1209600, month: 2629746, year: 31556952, decade: 315569520, century: 3155695200 },
    speed: { 'm/s': 1, 'km/h': 1 / 3.6, mph: 0.44704, knot: 0.514444 },
    area: { 'sq cm': 1e-4, 'sq m': 1, 'sq km': 1e6, hectare: 1e4, acre: 4046.8564224, 'sq ft': 0.09290304, 'sq in': 0.00064516, 'sq mi': 2589988.11 },
    data: { bit: 0.125, byte: 1, kb: 1e3, mb: 1e6, gb: 1e9, tb: 1e12 },
    temp: { c: 1, f: 1, k: 1 },
  };
  const NAMES = {
    mm: 'millimeters', cm: 'centimeters', m: 'meters', km: 'kilometers', in: 'inches', ft: 'feet', yd: 'yards', mi: 'miles', mg: 'milligrams', g: 'grams', kg: 'kilograms', tonne: 'tonnes', oz: 'ounces', lb: 'pounds', ml: 'milliliters', cl: 'centiliters', l: 'liters', tsp: 'teaspoons', tbsp: 'tablespoons', 'fl oz': 'fluid ounces', cup: 'cups', min: 'minutes', s: 'seconds', ms: 'milliseconds', h: 'hours', 'm/s': 'meters per second', 'km/h': 'km per hour', mph: 'miles per hour', kb: 'kilobytes', mb: 'megabytes', gb: 'gigabytes', tb: 'terabytes', c: '°C', f: '°F', k: 'kelvin', 'sq cm': 'square centimeters', 'sq m': 'square meters', 'sq km': 'square kilometers', 'sq ft': 'square feet', 'sq in': 'square inches', 'sq mi': 'square miles', 'us ton': 'US tons',
  };
  const ALIAS = {};
  const al = (u, ...names) => names.forEach((n) => (ALIAS[n] = u));
  al('mm', 'mm', 'millimeter', 'millimeters', 'millimetre', 'millimetres'); al('cm', 'cm', 'centimeter', 'centimeters', 'centimetre', 'centimetres', 'cms'); al('m', 'm', 'meter', 'meters', 'metre', 'metres'); al('km', 'km', 'kms', 'kilometer', 'kilometers', 'kilometre', 'kilometres', 'k'); al('in', 'inch', 'inches', 'in', '"'); al('ft', 'ft', 'foot', 'feet', "'"); al('yd', 'yd', 'yds', 'yard', 'yards'); al('mi', 'mi', 'mile', 'miles'); al('nautical mile', 'nautical mile', 'nautical miles'); al('light year', 'light year', 'light years', 'lightyear', 'lightyears');
  al('mg', 'mg', 'milligram', 'milligrams'); al('g', 'g', 'gram', 'grams', 'gm', 'gms'); al('kg', 'kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms'); al('tonne', 'tonne', 'tonnes', 'metric ton', 'metric tons', 't'); al('us ton', 'ton', 'tons', 'us ton', 'us tons'); al('oz', 'oz', 'ounce', 'ounces'); al('lb', 'lb', 'lbs', 'pound', 'pounds'); al('stone', 'stone', 'stones', 'st');
  al('ml', 'ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres', 'mls'); al('cl', 'cl', 'centiliter', 'centiliters', 'centilitre', 'centilitres'); al('l', 'l', 'liter', 'liters', 'litre', 'litres', 'ltr'); al('tsp', 'tsp', 'teaspoon', 'teaspoons'); al('tbsp', 'tbsp', 'tablespoon', 'tablespoons'); al('fl oz', 'fl oz', 'fluid ounce', 'fluid ounces'); al('cup', 'cup', 'cups'); al('pint', 'pint', 'pints', 'pt'); al('quart', 'quart', 'quarts', 'qt'); al('gallon', 'gallon', 'gallons', 'gal'); al('cubic meter', 'cubic meter', 'cubic meters', 'cubic metre', 'cubic metres', 'm3');
  al('ms', 'ms', 'millisecond', 'milliseconds'); al('s', 's', 'sec', 'secs', 'second', 'seconds'); al('min', 'min', 'mins', 'minute', 'minutes'); al('h', 'h', 'hr', 'hrs', 'hour', 'hours'); al('day', 'day', 'days'); al('week', 'week', 'weeks', 'wk', 'wks'); al('fortnight', 'fortnight', 'fortnights'); al('month', 'month', 'months'); al('year', 'year', 'years', 'yr', 'yrs'); al('decade', 'decade', 'decades'); al('century', 'century', 'centuries');
  al('m/s', 'm/s', 'meters per second', 'metres per second', 'mps'); al('km/h', 'km/h', 'kmh', 'kph', 'km per hour', 'kilometers per hour', 'kilometres per hour', 'kmph'); al('mph', 'mph', 'miles per hour', 'mi/h'); al('knot', 'knot', 'knots', 'kt', 'kn');
  al('sq cm', 'sq cm', 'square centimeter', 'square centimeters', 'square centimetres', 'cm2', 'cm²'); al('sq m', 'sq m', 'square meter', 'square meters', 'square metre', 'square metres', 'm2', 'm²'); al('sq km', 'sq km', 'square kilometer', 'square kilometers', 'square kilometres', 'km2', 'km²'); al('hectare', 'hectare', 'hectares', 'ha'); al('acre', 'acre', 'acres'); al('sq ft', 'sq ft', 'square foot', 'square feet', 'ft2', 'ft²'); al('sq in', 'sq in', 'square inch', 'square inches'); al('sq mi', 'sq mi', 'square mile', 'square miles');
  al('bit', 'bit', 'bits'); al('byte', 'byte', 'bytes', 'b'); al('kb', 'kb', 'kilobyte', 'kilobytes'); al('mb', 'mb', 'megabyte', 'megabytes', 'megs'); al('gb', 'gb', 'gigabyte', 'gigabytes', 'gigs'); al('tb', 'tb', 'terabyte', 'terabytes');
  al('c', 'c', '°c', 'celsius', 'centigrade', 'degrees c', 'degrees celsius', 'degree celsius'); al('f', 'f', '°f', 'fahrenheit', 'degrees f', 'degrees fahrenheit', 'degree fahrenheit'); al('k', 'kelvin', 'kelvins');
  const ALIAS_KEYS = Object.keys(ALIAS).sort((a, b) => b.length - a.length);
  const catOf = (u) => Object.keys(UNITS).find((c) => u in UNITS[c]);
  // the unit named at the very start of s
  function unitAt(s, allowShort) {
    s = s.trim().replace(/^(?:a |an |one |the )/, '');
    for (const k of ALIAS_KEYS) {
      if (!allowShort && k.length < 2 && !/^[a-z]{2,}$/.test(k)) continue;
      if (s === k || s.startsWith(k + ' ') || s.startsWith(k + '?')) {
        let u = ALIAS[k];
        if (k === 'k' && !allowShort) continue;
        return { u, rest: s.slice(k.length) };
      }
    }
    return null;
  }
  function convert(x, a, b) {
    if (a === 'oz' && catOf(b) === 'volume') a = 'fl oz';
    if (b === 'oz' && catOf(a) === 'volume') b = 'fl oz';
    const ca = catOf(a), cb = catOf(b);
    if (!ca || ca !== cb) return null;
    if (ca === 'temp') {
      const c = a === 'c' ? x : a === 'f' ? ((x - 32) * 5) / 9 : x - 273.15;
      return b === 'c' ? c : b === 'f' ? (c * 9) / 5 + 32 : c + 273.15;
    }
    return (x * UNITS[ca][a]) / UNITS[cb][b];
  }
  const uname = (u, x) => { const n = NAMES[u] || u + 's'; return x === 1 && /s$/.test(n) && u !== 'c' && u !== 'f' && u !== 'k' ? (u === 'ft' ? 'foot' : u === 'in' ? 'inch' : u === 'century' ? 'century' : n.replace(/(ie)?s$/, (m0, ie) => (ie ? 'y' : ''))) : u === 'century' ? 'centuries' : n; };
  const fmt4 = (x) => (Math.abs(x) >= 0.01 && Math.abs(x) < 1e15 ? (Math.round(x * 1e4) / 1e4).toLocaleString('en-US', { maximumFractionDigits: 4 }) : fmt(x));
  const showAmt = (x, u) => (catOf(u) === 'temp' ? `${fmt4(Math.round(x * 100) / 100)}${u === 'k' ? ' K' : NAMES[u]}` : `${fmt4(x)} ${uname(u, x)}`);
  function units(c) {
    const s = c.raw.toLowerCase().replace(/[’']/g, '').replace(/[?!.]+$/, '').replace(/,(\d{3})/g, '$1').trim().replace(/^(?:(?:hey|ok|please|buddy|so) )*(?:can you |could you )?(?:please )?(?:convert|change|turn|what is|whats|how much is|how far is|how long is|how heavy is)\s+/, '');
    let m;
    // "5 miles to km", "convert 100 f to c", "what is 30 cm in inches"
    if ((m = /^(-?\d+(?:\.\d+)?|[a-z]+(?:[ -][a-z]+)*?)\s*(°?[a-z/"][a-z/²³0-9]*(?: [a-z]+){0,2}?) (?:to|in|into|as|=|in to|converted to|is how many|equals how many|how many) (?:how many )?(°?[a-z/²³0-9]+(?: [a-z]+){0,2})$/.exec(s))) {
      const x = /\d/.test(m[1]) ? parseFloat(m[1]) : num(m[1].replace(/^(?:convert|what is|whats|how much is|how many) /, ''));
      const a = unitAt(m[2], true), b = unitAt(m[3], true);
      if (isFinite(x) && a && b && !a.rest.trim() && !b.rest.trim()) {
        const y = convert(x, a.u, b.u);
        if (y !== null) return `${showAmt(x, a.u)} = **${showAmt(y, b.u === 'oz' && catOf(a.u) === 'volume' ? 'fl oz' : b.u)}**`;
        if (catOf(a.u) && catOf(b.u)) return `I can’t turn ${NAMES[a.u] || a.u} into ${NAMES[b.u] || b.u} — they measure different things!`;
      }
    }
    // "how many cm in a meter", "how many seconds in 3 hours"
    if ((m = /how many (°?[a-z/²³]+(?: [a-z]+){0,2}?) (?:are )?(?:in|is|make|per|go into|fit in) (?:a |an |one |(-?\d+(?:\.\d+)?|[a-z]+) )?(°?[a-z/²³]+(?: [a-z]+){0,2})$/.exec(s))) {
      const b = unitAt(m[1], true), a = unitAt(m[3], true);
      const x = m[2] ? (/\d/.test(m[2]) ? parseFloat(m[2]) : num(m[2])) : 1;
      if (a && b && isFinite(x) && !a.rest.trim() && !b.rest.trim()) {
        const y = convert(x, a.u, b.u);
        if (y !== null) return `There are **${showAmt(y, b.u === 'oz' && catOf(a.u) === 'volume' ? 'fl oz' : b.u)}** in ${x === 1 ? 'one ' + uname(a.u, 1) : showAmt(x, a.u)}.`;
      }
    }
    return null;
  }

  /* ------------------------------------------------------------ dates */
  const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const MSHORT = MONTHS.map((x) => x.slice(0, 3));
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = (a, b) => Math.round((day0(b) - day0(a)) / 864e5);
  const longDate = (d) => `${DAYS[d.getDay()]}, ${cap(MONTHS[d.getMonth()])} ${d.getDate()}, ${d.getFullYear()}`;
  const nthWeekday = (y, mo, wd, n) => { const d = new Date(y, mo, 1); const first = (wd - d.getDay() + 7) % 7; return new Date(y, mo, 1 + first + (n - 1) * 7); };
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
  }
  const HOLIDAYS = [
    [/christmas eve/, '🎄 Christmas Eve', (y) => new Date(y, 11, 24)], [/christmas|xmas/, '🎄 Christmas', (y) => new Date(y, 11, 25)], [/new years eve/, '🎆 New Year’s Eve', (y) => new Date(y, 11, 31)], [/new year/, '🎆 New Year’s Day', (y) => new Date(y, 0, 1)],
    [/halloween/, '🎃 Halloween', (y) => new Date(y, 9, 31)], [/valentine/, '💘 Valentine’s Day', (y) => new Date(y, 1, 14)], [/st patrick|saint patrick|paddy/, '☘️ St. Patrick’s Day', (y) => new Date(y, 2, 17)], [/april fool/, '🤡 April Fools’ Day', (y) => new Date(y, 3, 1)],
    [/easter/, '🐣 Easter', easter], [/thanksgiving/, '🦃 Thanksgiving (US)', (y) => nthWeekday(y, 10, 4, 4)], [/mother.?s day|mothers day/, '💐 Mother’s Day (US)', (y) => nthWeekday(y, 4, 0, 2)], [/father.?s day|fathers day/, '👔 Father’s Day', (y) => nthWeekday(y, 5, 0, 3)],
    [/independence day|4th of july|fourth of july|july 4th/, '🎆 Independence Day (US)', (y) => new Date(y, 6, 4)], [/summer/, '☀️ the first day of summer', (y) => new Date(y, 5, 21)], [/winter/, '❄️ the first day of winter', (y) => new Date(y, 11, 21)], [/spring/, '🌷 the first day of spring', (y) => new Date(y, 2, 20)], [/autumn|fall/, '🍂 the first day of autumn', (y) => new Date(y, 8, 22)],
    [/weekend|saturday/, '🎉 the weekend', null], [/friday/, '🙌 Friday', null],
  ];
  function parseDate(s, now) {
    s = s.toLowerCase();
    let m = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/.exec(s);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    const mon = '(' + MONTHS.join('|') + '|' + MSHORT.join('|') + ')';
    m = new RegExp('\\b' + mon + '\\.? (\\d{1,2})(?:st|nd|rd|th)?(?:,? (\\d{4}))?\\b').exec(s) || new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)? (?:of )?' + mon + '(?:,? (\\d{4}))?\\b').exec(s);
    if (m) {
      const a = /^\d/.test(m[1]);
      const mo = MSHORT.indexOf((a ? m[2] : m[1]).slice(0, 3)), d = +(a ? m[1] : m[2]), y = m[3] ? +m[3] : null;
      if (d < 1 || d > 31) return null;
      return { mo, d, y };
    }
    m = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(s);
    if (m && +m[1] <= 12) return { mo: +m[1] - 1, d: +m[2], y: m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : null };
    return null;
  }
  const nextOf = (p, now) => { if (p instanceof Date) return p; let d = new Date(p.y || now.getFullYear(), p.mo, p.d); if (!p.y && dayDiff(now, d) < 0) d = new Date(now.getFullYear() + 1, p.mo, p.d); return d; };
  const leap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  function until(label, d, now) {
    const n = dayDiff(now, d);
    if (n === 0) return `${label} is **today**! 🎉`;
    if (n < 0) return `${label} was on ${longDate(d)} — **${plural(-n, 'day')} ago**.`;
    const w = Math.floor(n / 7);
    return `${label} is on **${longDate(d)}** — that’s **${plural(n, 'day')}** away${n >= 14 ? ` (about ${plural(w, 'week')})` : ''}${n === 1 ? ' — tomorrow!' : '!'}`;
  }
  function dates(c) {
    const t = c.t, now = c.now, mem = c.mem;
    let m;
    if (/\bwhat time is it\b|\bwhat is the time\b|\bcurrent time\b|\btell me the time\b|^time$/.test(t)) return `It’s **${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}** right now. ⏰`;
    if (/\bwhat (?:is the |is todays )?date\b|\btodays date\b|\bwhat day is (?:it|today)\b|\bwhat is today\b|^date$|\bwhat day of the week is it\b/.test(t)) return `Today is **${longDate(now)}**. 📅`;
    if (/\bwhat year is it\b|\bwhat is the year\b|\bcurrent year\b/.test(t)) return `It’s **${now.getFullYear()}**.`;
    if (/\bwhat month is it\b/.test(t)) return `It’s **${cap(MONTHS[now.getMonth()])}**.`;
    if ((m = /\bis (\d{4}) a leap year\b|\bleap year.*?(\d{4})/.exec(t))) { const y = +(m[1] || m[2]); return leap(y) ? `Yes, **${y} is a leap year** — February has 29 days. 🐸` : `No, **${y} isn’t a leap year**. ${(() => { let n = y + 1; while (!leap(n)) n++; return `The next one is ${n}.`; })()}`; }
    if (/\b(?:is this|is it) a leap year\b|\bnext leap year\b/.test(t)) { let y = now.getFullYear(); const cur = leap(y); while (!leap(y)) y++; return cur ? `Yes, **${y} is a leap year**!` : `No — the next leap year is **${y}**.`; }
    if ((m = /\bhow many days (?:are )?(?:there )?in (?:a |the month of )?(\w+)(?: (\d{4}))?\b/.exec(t)) && MSHORT.includes(m[1].slice(0, 3)) && m[1] !== 'mar' + 'ch' + 'es') {
      const mo = MSHORT.indexOf(m[1].slice(0, 3)), y = m[2] ? +m[2] : now.getFullYear();
      const n = new Date(y, mo + 1, 0).getDate();
      return `${cap(MONTHS[mo])}${mo === 1 ? ' ' + y : ''} has **${n} days**.${mo === 1 ? (leap(y) ? ' (It’s a leap year!)' : ' (29 in a leap year.)') : ''}\nTip: count on your knuckles — knuckles are 31 days, the dips between are 30 (or February).`;
    }
    if (/\bhow many days (?:are )?(?:there )?in a year\b/.test(t)) return `A year has **365 days** — or **366** in a leap year (like ${(() => { let y = now.getFullYear(); while (!leap(y)) y++; return y; })()}).`;
    if ((m = /\bwhat day (?:of the week )?(?:is|was|will be|will) (.+?)(?: be| fall on| on)?$/.exec(t))) {
      const p = parseDate(m[1], now);
      if (p) { const d = nextOf(p, now); return `${cap(MONTHS[d.getMonth()])} ${d.getDate()}, ${d.getFullYear()} ${dayDiff(now, d) < 0 ? 'was' : dayDiff(now, d) === 0 ? 'is' : 'is'} a **${DAYS[d.getDay()]}**.`; }
    }
    if ((m = /\bhow old (?:am i|is someone|is a person|would i be|will i be)(?: if| who was| who is)? (?:i was |i am |was )?born (?:in |on )?(.+)$/.exec(t))) {
      const p = parseDate(m[1], now), y = /\b(\d{4})\b/.exec(m[1]);
      if (p && p.y) { const b = new Date(p.y, p.mo, p.d); let age = now.getFullYear() - b.getFullYear(); if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--; return `Someone born on ${longDate(b)} is **${age} years old** today.`; }
      if (y) { const a = now.getFullYear() - +y[1]; return `Someone born in ${y[1]} is **${a - 1} or ${a}** — ${a} once their birthday has come this year.`; }
    }
    // countdowns
    if ((m = /\b(?:how (?:many )?(?:days|weeks|sleeps|long) (?:is it )?(?:until|till|til|before|to)|days (?:until|till|til|to|left until)|countdown to|when is|when does|how long to|how far away is|how soon is) (.+)$/.exec(t))) {
      const what = m[1].replace(/\b(?:it|start|come|comes|begin|begins|happen)\b/g, '').trim();
      if (/\bmy birthday\b|\bmy bday\b/.test(what)) {
        if (!mem.bday) return { text: 'I don’t know your birthday yet! Tell me like this: **my birthday is March 14**. 🎂', quick: ['My birthday is March 14'] };
        const [mo, d] = mem.bday.split('-').map(Number);
        return until('🎂 Your birthday', nextOf({ mo: mo - 1, d }, now), now);
      }
      for (const [re, label, fn] of HOLIDAYS) {
        if (!re.test(what)) continue;
        if (!fn) {
          const wd = /friday/.test(what) ? 5 : 6, n = (wd - now.getDay() + 7) % 7;
          return n === 0 ? `It’s ${wd === 5 ? 'Friday' : 'the weekend'} **today**! 🎉` : `${label} is in **${plural(n, 'day')}** (${DAYS[wd]}).`;
        }
        let d = fn(now.getFullYear());
        if (dayDiff(now, d) < 0) d = fn(now.getFullYear() + 1);
        return until(label, d, now);
      }
      const p = parseDate(what, now);
      if (p) return until(`${cap(MONTHS[nextOf(p, now).getMonth()])} ${p.d}`, nextOf(p, now), now);
    }
    if ((m = /\bhow many days (?:since|ago was|has it been since) (.+)$/.exec(t))) {
      const p = parseDate(m[1], now);
      if (p) { let d = p instanceof Date ? p : new Date(p.y || now.getFullYear(), p.mo, p.d); if (!p.y && dayDiff(now, d) > 0) d = new Date(now.getFullYear() - 1, p.mo, p.d); return `${longDate(d)} was **${plural(Math.abs(dayDiff(now, d)), 'day')} ago**.`; }
    }
    return null;
  }

  /* ------------------------------------------------------------ words */
  const allWords = () => {
    if (allWords.w) return allWords.w;
    const set = new Set([].concat(D.rhymes.flat(), Object.keys(D.define), Object.keys(D.syn), ...Object.values(D.syn), Object.keys(D.opp), Object.values(D.opp), D.hangman, Object.values(D.misspell)).filter((w) => /^[a-z]+$/.test(w)));
    return (allWords.w = [...set]);
  };
  function rhymesFor(w) {
    const fam = D.rhymes.find((f) => f.includes(w));
    if (fam) return fam.filter((x) => x !== w);
    if (/^(?:orange|silver|purple|month|wolf|pint)$/.test(w)) return [];
    for (const n of [4, 3]) {
      if (w.length <= n) continue;
      const end = w.slice(-n), r = allWords().filter((x) => x !== w && x.endsWith(end) && x.length > 1);
      if (r.length >= 2) return r.slice(0, 10);
    }
    return [];
  }
  const raws = (c, re) => { const m = re.exec(c.raw); return m ? m[m.length - 1].trim().replace(/^["“'‘]|["”'’]$/g, '') : null; };
  function words(c) {
    const t = c.t;
    let m, x;
    if ((m = /\bhow many (\w)s? (?:are )?(?:there )?(?:in|does) (?:the word )?(\w+)/.exec(t)) || (m = /\bhow many times does (?:the letter )?(\w) (?:appear |come up |show up )?in (?:the word )?(\w+)/.exec(t))) {
      const ch = m[1], w = m[2], n = [...w].filter((x) => x === ch).length;
      return `There ${n === 1 ? 'is' : 'are'} **${n}** “${ch}”${n === 1 ? '' : '’s'} in **${w}**: ${[...w].map((x) => (x === ch ? x.toUpperCase() : x)).join('')}`;
    }
    if ((m = /\bhow many letters (?:are )?(?:there )?(?:in|does) (?:the word |the name )?(\w+)/.exec(t))) return `**${m[1]}** has **${m[1].length} letters**.`;
    if (/\b(?:count (?:the )?words|how many words|word count)\b/.test(t) && (x = raws(c, /(?:count (?:the )?words|how many words|word count)\s*(?:are |is )?(?:in|of|for)?(?: this| the text)?\s*[:\-]?\s*(.+)$/i))) {
      const n = (x.match(/\S+/g) || []).length;
      return `That has **${plural(n, 'word')}** and **${plural(x.length, 'character')}** (${x.replace(/\s/g, '').length} without spaces).`;
    }
    if ((x = raws(c, /\bspell\s+(.+?)\s+backwards?\b/i)) || (x = raws(c, /\b(?:reverse|backwards?)\b(?: (?:the )?(?:word|text|this|letters))?\s*[:\-]?\s*(.+)$/i))) return `Backwards: **${[...x].reverse().join('')}** 🔄`;
    if ((m = /\b(uppercase|upper case|all caps|capitals|caps|lowercase|lower case|title case)\b/.exec(t)) && (x = raws(c, /\b(?:in |to |into |make |turn )?(?:uppercase|upper case|all caps|capitals|caps|lowercase|lower case|title case)\b(?: (?:this|the text|it)(?=\s*:))?\s*[:\-]?\s*(.+)$/i))) {
      const out = /lower/.test(m[1]) ? x.toLowerCase() : /title/.test(m[1]) ? x.toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase()) : x.toUpperCase();
      return '```\n' + out + '\n```';
    }
    if ((m = /\bis (.+?) a palindrome\b/.exec(t))) {
      const s = m[1].replace(/[^a-z0-9]/g, ''), yes = s && s === [...s].reverse().join('');
      return yes ? `Yes! **${m[1]}** reads the same backwards. 🔁` : `No — backwards it’s **${[...m[1]].reverse().join('')}**. Palindromes include *racecar*, *level*, *kayak* and *taco cat*!`;
    }
    if ((m = /\b(?:another word for|synonyms? (?:for|of)|other words for|different word for|better word for|word that means|similar word to|similar to the word) (\w+)/.exec(t))) {
      const w = m[1], s = D.syn[w] || D.syn[stem(w)] || Object.keys(D.syn).filter((k) => D.syn[k].includes(w)).map((k) => [k].concat(D.syn[k].filter((y) => y !== w))).flat();
      if (s && s.length) return `Other words for **${w}**: ${s.slice(0, 8).map((y) => `*${y}*`).join(', ')}.`;
      return `I don’t know other words for “${w}” yet. ✨ Claude would! (Switch at the top.)`;
    }
    if ((m = /\b(?:opposite (?:of|for)|antonyms? (?:of|for)) (\w+)|\bwhat is the opposite of (\w+)/.exec(t))) {
      const w = m[1] || m[2];
      const o = D.opp[w] || Object.keys(D.opp).find((k) => D.opp[k] === w);
      return o ? `The opposite of **${w}** is **${o}**. ↔️` : null;
    }
    if ((m = /\b(?:rhymes? (?:with|for)|rhyming words? (?:with|for)|words? that rhymes? with|rhyme for) (\w+)/.exec(t))) {
      const r = rhymesFor(m[1]);
      return r.length ? `Words that rhyme with **${m[1]}**: ${r.slice(0, 10).map((y) => `*${y}*`).join(', ')} 🎵` : `Hmm, I can’t find a rhyme for “${m[1]}” — some words (like *orange*) famously have none!`;
    }
    if ((m = /\bhow (?:do you|do i|to|would you|should i) spell (\w+)/.exec(t)) || (m = /^spell (\w+)$/.exec(t))) {
      const w = m[1], right = D.misspell[w] && !/[’ ]/.test(D.misspell[w]) && D.misspell[w].length > 2 ? D.misspell[w] : w;
      return `${right !== w ? `It’s spelled **${right}** (not “${w}”): ` : `**${right}**: `}${[...right.toUpperCase()].join('-')}`;
    }
    if ((m = /\bis (\w+) (?:spelled|spelt) (?:right|correctly|wrong)\b|\bis (\w+) a (?:real )?word\b/.exec(t))) {
      const w = m[1] || m[2], fix = D.misspell[w];
      if (fix && fix.length > 2 && !/[’ ]/.test(fix)) return `Not quite — it’s spelled **${fix}**.`;
      if (allWords().includes(w) || D.define[w]) return `Yes, **${w}** is spelled right! ✅`;
      return null;
    }
    if ((m = /\b(?:unscramble|anagram (?:of|for)|anagrams of) (\w+)/.exec(t))) {
      const key = [...m[1]].sort().join(''), hits = allWords().filter((w) => w !== m[1] && [...w].sort().join('') === key);
      return hits.length ? `**${m[1]}** unscrambles to: ${hits.map((w) => `**${w}**`).join(', ')}` : `I couldn’t unscramble “${m[1]}” with the words I know.`;
    }
    // definitions: only words Buddy actually knows (otherwise the knowledge base or Claude may)
    if ((m = /^(?:define|definition of|meaning of|what is the meaning of|what does) (?:the word )?(\w+)(?: mean)?$/.exec(c.core)) || (m = /^what (?:is|are) (?:a |an |the )?(\w+)$/.exec(c.core)) || (m = /^(?:what does|whats) (\w+) mean$/.exec(c.core))) {
      const w = m[1], d = D.define[w] || D.define[stem(w)];
      if (d) return `**${w}**: ${d}.`;
      if (/^(?:define|definition|meaning|what does)/.test(c.core)) return { text: `I don’t know what “${w}” means yet. 📖 ✨ Claude would know — switch at the top (it uses Claude usage).`, offerClaude: true };
    }
    return null;
  }

  /* ------------------------------------------------------------ fun */
  const TOPICS = { game: 'games', games: 'games', gaming: 'games', gamer: 'games', 'video game': 'games', 'video games': 'games', animal: 'animals', animals: 'animals', dog: 'dogs', dogs: 'dogs', puppy: 'dogs', cat: 'cats', cats: 'cats', kitten: 'cats', food: 'food', school: 'school', teacher: 'school', math: 'math', space: 'space', planet: 'space', planets: 'space', moon: 'space', zombie: 'zombie', zombies: 'zombie', egg: 'egg', eggs: 'egg', dinosaur: 'dinosaurs', dinosaurs: 'dinosaurs', dino: 'dinosaurs', halloween: 'halloween', spooky: 'halloween', sport: 'sports', sports: 'sports', football: 'sports', soccer: 'sports', basketball: 'sports', music: 'music', science: 'science', tech: 'tech', computer: 'tech', computers: 'tech', robot: 'robots', robots: 'robots', fish: 'fish', ocean: 'ocean', sea: 'ocean', knock: 'knock', pirate: 'pirates', pirates: 'pirates', minecraft: 'minecraft', roblox: 'roblox', speed: 'speed', pet: 'pets', pets: 'pets', boat: 'boat', bird: 'birds', birds: 'birds', insect: 'insects', bugs: 'insects', body: 'body', history: 'history', weather: 'weather', earth: 'earth', words: 'words', chess: 'chess', plants: 'plants', places: 'places', time: 'time' };
  function topicOf(t) {
    const m = /\b(?:about|on|with|of) (?:a |an |the )?(\w+(?: \w+)?)/.exec(t);
    if (!m) return { tag: null };
    const w = m[1];
    return { word: w, tag: TOPICS[w] || TOPICS[w.split(' ')[0]] || TOPICS[stem(w.split(' ')[0])] || TOPICS[w.split(' ')[1]] || null };
  }
  function joke(c, arg) {
    const topic = arg !== undefined ? arg : topicOf(c.t);
    const tag = topic.tag || (/\bknock knock\b/.test(c.t) ? 'knock' : null);
    let cands = range(D.jokes.length).filter((i) => (tag ? D.jokes[i][1].split(' ').includes(tag) : D.jokes[i][1] !== 'riddle'));
    let pre = '';
    if (!tag && topic.word && !/^(?:it|me|you|this|that|anything|something|everything)$/.test(topic.word)) pre = `I don’t know one about ${topic.word} yet, but here’s one: `;
    if (!cands.length) { cands = range(D.jokes.length); pre = `I don’t know one about ${topic.word} yet, but here’s one: `; }
    c.mem.last = { skill: 'joke', arg: tag ? topic : { tag: null } };
    return { text: pre + D.jokes[fresh(c.mem, 'joke', cands)][0] + ' 😄', quick: ['Another joke!', 'Tell me a riddle'] };
  }
  function fact(c, arg) {
    const topic = arg !== undefined ? arg : topicOf(c.t);
    let cands = range(D.facts.length).filter((i) => !topic.tag || D.facts[i][1].split(' ').includes(topic.tag));
    let pre = '';
    if (!topic.tag && topic.word && !/^(?:it|me|you|this|that|anything|something|everything)$/.test(topic.word)) pre = `I don’t have a fact about ${topic.word} yet, but did you know… `;
    if (!cands.length) { cands = range(D.facts.length); pre = `I don’t have a fact about ${topic.word} yet, but did you know… `; }
    c.mem.last = { skill: 'fact', arg: topic.tag ? topic : { tag: null } };
    return { text: (pre || '🤓 **Fun fact:** ') + D.facts[fresh(c.mem, 'fact', cands)][0], quick: ['Another fact!', 'Quiz me'] };
  }
  const STORY = {
    hero: ['a brave little robot named Bolt', 'a curious cat named Pixel', 'a young wizard called Juniper', 'a speedy hamster named Turbo', 'a shy dragon called Ember', 'a gamer named Nova', 'a talking pizza slice named Pepper', 'a tiny astronaut called Comet'],
    place: ['in a city made of building blocks', 'on a floating island in the sky', 'deep under the ocean', 'on a planet made of candy', 'in a haunted castle', 'inside a giant video game', 'in a jungle full of glowing plants', 'at the edge of a snowy mountain'],
    problem: ['found a mysterious golden egg that wouldn’t stop humming', 'discovered that every step they took made them a little bit faster', 'heard that a grumpy zombie had stolen all the town’s cookies', 'found a map to a treasure that nobody had ever found', 'woke up to find the sun had forgotten to rise', 'got lost in a maze that kept changing shape', 'found a door that only opened if you told it a joke'],
    friend: ['a wise old turtle', 'a robot that only spoke in beeps', 'a friendly ghost', 'a kid from the next village', 'a squirrel with a tiny backpack', 'a very polite zombie'],
    twist: ['it turned out the problem was just a misunderstanding — and they all became friends', 'they used teamwork to solve a riddle and saved the day', 'the answer had been in their pocket the whole time', 'they built something amazing out of the things they found along the way', 'they were braver than they ever thought they could be'],
  };
  function story(c) {
    const topic = topicOf(c.t), about = topic.word && !/^(it|me|you|this)$/.test(topic.word) ? topic.word : null;
    const hero = pick(STORY.hero), place = pick(STORY.place);
    c.mem.last = { skill: 'story' };
    const lines = [
      `**${about ? 'The ' + about.replace(/\b\w/g, (x) => x.toUpperCase()) + ' Adventure' : pick(['The Big Adventure', 'A Day to Remember', 'The Secret Quest', 'Faster Than Ever'])}** 📖`,
      `Once upon a time, ${place}, there lived ${hero}.`,
      `One morning, ${hero.split(' ').slice(-1)[0]} ${about ? `found something amazing: ${/^(a|an|the) /.test(about) ? about : (/^[aeiou]/.test(about) ? 'an ' : 'a ') + about}! But then they ` : ''}${pick(STORY.problem)}.`,
      `They set off to fix it, and on the way they met ${pick(STORY.friend)}, who agreed to help.`,
      `It wasn’t easy. There were tricky puzzles, a wobbly bridge, and one very loud thunderstorm.`,
      `But in the end, ${pick(STORY.twist)}.`,
      `**The end.** ✨`,
    ];
    return { text: lines.join('\n'), quick: ['Tell me another story', 'Write a poem'] };
  }
  const ADJ = ['amazing', 'awesome', 'bright', 'brilliant', 'cheerful', 'clever', 'cool', 'cosmic', 'daring', 'epic', 'fantastic', 'fun', 'gentle', 'glowing', 'golden', 'happy', 'joyful', 'kind', 'lucky', 'magical', 'mighty', 'playful', 'radiant', 'silly', 'sparkly', 'speedy', 'super', 'wild', 'wonderful'];
  function poem(c) {
    const topic = topicOf(c.t), about = topic.word && !/^(it|me|you|this)$/.test(topic.word) ? topic.word : pick(['games', 'friends', 'the moon', 'pizza', 'cats', 'summer', 'speed']);
    c.mem.last = { skill: 'poem' };
    const A = cap(about), r1 = pick(D.rhymes), r2 = pick(D.rhymes.filter((r) => r !== r1));
    const [a1, a2] = shuffle(r1.filter((w) => w.length > 2)).slice(0, 2), [b1, b2] = shuffle(r2.filter((w) => w.length > 2)).slice(0, 2);
    const templates = [
      () => `Roses are red, violets are blue,\n${A} ${/[^s]s$/.test(about) ? 'are' : 'is'} ${pick(ADJ)}, and so are you! 🌹`,
      () => { const [j1, j2] = shuffle(ADJ); return `**Ode to ${A}** ✍️\n${A}, oh ${about}, so ${j1} and ${j2},\nYou make every ordinary day feel ${pick(['bright', 'right', 'light'])}.\nWhen things are tough, I think of you,\nAnd suddenly the sky is ${pick(['blue', 'new', 'bright blue'])}.`; },
      () => `**${A}** 🎵\nI thought about ${about} all through the ${a1},\nIt made me smile, it made me ${a2 || a1}.\nWith every ${b1} and every ${b2 || b1},\n${A} is the best — that’s all I’ll say! ✨`,
      () => `**A Haiku About ${A}** 🍃\n${cap(about)}, ${pick(ADJ)} and new,\nLike a ${pick(['soft spring breeze', 'bright shooting star', 'sunrise in the hills', 'snowflake falling down'])},\n${pick(['I smile when you’re near.', 'my favorite thing.', 'joy in every step.', 'always in my heart.'])}`,
    ];
    return { text: pick(templates)(), quick: ['Another poem', 'Tell me a story'] };
  }
  function gamerNames(c) {
    c.mem.last = { skill: 'names' };
    const base = (c.mem.name || '').replace(/[^A-Za-z]/g, '');
    const out = new Set();
    while (out.size < 6) {
      const r = R.rand();
      out.add(r < 0.25 && base ? `${pick(D.names.first)}${cap(base)}` : r < 0.5 ? `${pick(D.names.first)}_${pick(D.names.last)}${Math.floor(R.rand() * 99) + 1}` : `${pick(D.names.first)}${pick(D.names.last)}`);
    }
    return { text: '🎮 Some name ideas:\n' + [...out].map((n) => `- **${n}**`).join('\n') + '\n(Never put your real full name, age or school in a username!)', quick: ['More names'] };
  }
  function art(c) {
    const m = new RegExp('\\b(' + Object.keys(D.art).join('|') + ')s?\\b').exec(c.t);
    const k = m ? m[1] : pick(Object.keys(D.art));
    c.mem.last = { skill: 'art' };
    return { text: `Here’s a ${k}! 🎨\n\`\`\`\n${D.art[k]}\n\`\`\``, quick: ['Draw something else'] };
  }
  const SONGS = ['🎵 *Twinkle, twinkle, little bot, how I wonder what you’ve got… a joke, a quiz, a fact or two — I’m always here to chat with you!* 🎶', '🎵 *Row, row, row your boat, gently through the game, merrily, merrily, merrily, merrily, every step’s the same — +1 speed!* 🎶', '🎵 *Happy birthday to someone, happy birthday to you… wait, is it your birthday? Tell me “my birthday is …” and I’ll remember!* 🎶', '🎵 *Do-re-mi-fa-so-la-ti-do… beep boop… I’m better at jokes than singing, I know!* 🎶'];

  /* ------------------------------------------------------------ games played right in the chat */
  const L4 = ['A', 'B', 'C', 'D'];
  const QCATS = { space: 'Space', science: 'Science', geography: 'Geography', countries: 'Geography', world: 'Geography', animals: 'Animals', animal: 'Animals', math: 'Math', art: 'Art', books: 'Books', reading: 'Books', sports: 'Sports', sport: 'Sports', games: 'Games', gaming: 'Games', 'video games': 'Games', history: 'History', food: 'Food', music: 'Music', words: 'Words', english: 'Words', spelling: 'Words', tech: 'Tech', technology: 'Tech', computers: 'Tech' };
  const TQ = () => root.TRIVIA_Q || [];
  function quizStart(c, opt) {
    const qs = TQ();
    if (!qs.length) return null;
    const n = Math.max(1, Math.min(20, (opt && opt.n) || nums(c.t).find((x) => x >= 1 && x <= 20) || 5));
    let cat = (opt && opt.cat) || null;
    if (!cat) for (const [k, v] of Object.entries(QCATS)) if (new RegExp('\\b' + k + '\\b').test(c.t)) cat = v;
    let pool = range(qs.length).filter((i) => !cat || qs[i][5] === cat);
    if (!pool.length) pool = range(qs.length);
    const order = [];
    for (let i = 0; i < Math.min(n, pool.length); i++) { const j = fresh(c.mem, 'quiz', pool.filter((x) => !order.includes(x))); order.push(j); }
    c.mem.game = { type: 'quiz', order, i: 0, score: 0, cat, opts: null };
    c.mem.last = { skill: 'quiz', arg: { n, cat } };
    return `🧠 **${cat ? cat + ' quiz' : 'Trivia time'}!** ${plural(order.length, 'question')} — answer with A, B, C or D (or type the answer). Say **hint** for a 50/50, **skip** to skip, or **stop** to end.\n\n` + quizAsk(c.mem.game);
  }
  function quizAsk(g) {
    const q = TQ()[g.order[g.i]];
    g.opts = shuffle([q[1], q[2], q[3], q[4]]);
    g.hint = false;
    return `**Question ${g.i + 1} of ${g.order.length}**${g.cat ? '' : ` *(${q[5]})*`}\n${q[0]}\n` + g.opts.map((o, i) => `**${L4[i]}.** ${o}`).join('\n');
  }
  function quizTurn(c) {
    const g = c.mem.game, q = TQ()[g.order[g.i]], t = c.t;
    if (!q) { c.mem.game = null; return null; }
    let ans = null;
    let m = /^(?:(?:it is|its|i think(?: it is)?|i say|answer|my answer is|the answer is|i pick|i choose|maybe|is it) )?(?:option |letter )?([abcd1-4])(?: please)?$/.exec(t);
    if (m) ans = /\d/.test(m[1]) ? g.opts[+m[1] - 1] : g.opts[L4.indexOf(m[1].toUpperCase())];
    if (!ans) {
      const tc = t.replace(/^(?:(?:it is|its|i think(?: it is)?|i say|the answer is|is it) )/, '').replace(/^(?:the |a |an )/, '');
      ans = g.opts.find((o) => clean(o).replace(/^(?:the |a |an )/, '') === tc) || (tc.length >= 3 && g.opts.find((o) => { const oc = clean(o); return oc.includes(tc) && tc.length >= oc.length * 0.5; })) || null;
    }
    if (/^(?:hint|50 50|fifty fifty|help)$/.test(t)) {
      if (g.hint) return 'You already used your hint for this one!';
      g.hint = true;
      const wrong = shuffle(g.opts.filter((o) => o !== q[1])).slice(0, 2);
      return `💡 It’s **not** ${wrong.map((w) => `${L4[g.opts.indexOf(w)]} (${w})`).join(' or ')}.`;
    }
    const skip = /^(?:skip|pass|next|i do not know|no idea|not sure|give up|tell me)$/.test(t);
    if (!ans && !skip) return { text: 'Pick **A**, **B**, **C** or **D** — or say **skip**. (Say **stop** to end the quiz.)', nudge: true };
    const right = ans === q[1];
    if (right) g.score++;
    let out = skip ? `⏭️ Skipped — it was **${L4[g.opts.indexOf(q[1])]}. ${q[1]}**.` : right ? pick(['✅ **Correct!**', '✅ **Yes!** Nice one.', '✅ **Right!** 🎉', '✅ **Spot on!**']) : `❌ Not quite — it was **${L4[g.opts.indexOf(q[1])]}. ${q[1]}**.`;
    g.i++;
    if (g.i >= g.order.length) {
      const n = g.order.length, pct = g.score / n;
      c.mem.game = null;
      c.mem.stats = c.mem.stats || {};
      c.mem.stats.quizBest = Math.max(c.mem.stats.quizBest || 0, Math.round(pct * 100));
      return { text: out + `\n\n🏁 **Quiz over! You got ${g.score} out of ${n}.** ${pct === 1 ? 'Perfect score! 🏆' : pct >= 0.7 ? 'Great job! 🌟' : pct >= 0.4 ? 'Not bad — practice makes perfect! 💪' : 'Keep at it — you’ll get them next time! 💛'}\nWant to play 🧠 Trivia Rush with friends? It’s in 🕹️ Games.`, quick: ['Quiz me again', 'Math quiz'] };
    }
    return out + `  *(Score: ${g.score}/${g.i})*\n\n` + quizAsk(g);
  }
  function mathStart(c, opt) {
    const t = c.t;
    const kind = (opt && opt.kind) || (/\btimes|multipl/.test(t) ? 'mul' : /\badd|plus|addition/.test(t) ? 'add' : /\bsubtract|minus|take away|subtraction/.test(t) ? 'sub' : /\bdivi/.test(t) ? 'div' : 'mix');
    const hard = (opt && opt.hard) || /\bhard|difficult|tricky|expert/.test(t);
    const n = (opt && opt.n) || nums(t).find((x) => x >= 1 && x <= 20) || 5;
    c.mem.game = { type: 'math', kind, hard, n, i: 0, score: 0, q: null, a: 0 };
    c.mem.last = { skill: 'math', arg: { kind, hard, n } };
    return `➗ **Math quiz!** ${plural(n, 'question')}${hard ? ' (hard mode 😤)' : ''} — type your answer. Say **stop** to end.\n\n` + mathAsk(c.mem.game);
  }
  function mathAsk(g) {
    const r = (a, b) => a + Math.floor(R.rand() * (b - a + 1));
    const k = g.kind === 'mix' ? pick(['add', 'sub', 'mul', 'div']) : g.kind;
    const H = g.hard;
    let a, b, q, ans;
    if (k === 'add') { a = r(H ? 25 : 2, H ? 499 : 50); b = r(H ? 25 : 2, H ? 499 : 50); q = `${a} + ${b}`; ans = a + b; }
    else if (k === 'sub') { a = r(H ? 100 : 10, H ? 999 : 99); b = r(2, a); q = `${a} − ${b}`; ans = a - b; }
    else if (k === 'mul') { a = r(2, H ? 25 : 12); b = r(2, 12); q = `${a} × ${b}`; ans = a * b; }
    else { b = r(2, 12); ans = r(2, H ? 25 : 12); a = b * ans; q = `${a} ÷ ${b}`; }
    g.q = q; g.a = ans;
    return `**${g.i + 1}/${g.n}:** What is **${q}**?`;
  }
  function mathTurn(c) {
    const g = c.mem.game, t = c.t;
    const skip = /^(?:skip|pass|next|i do not know|give up|tell me)$/.test(t);
    const x = num(t.replace(/^(?:it is|its|i think(?: it is)?|is it|the answer is|answer|=)\s*/, ''));
    if (!isFinite(x) && !skip) return { text: 'Type a number — or say **skip**. (Say **stop** to end.)', nudge: true };
    const right = x === g.a;
    if (right) g.score++;
    const out = skip ? `⏭️ ${g.q} = **${g.a}**` : right ? pick(['✅ **Correct!**', '✅ **Yes!**', '✅ **Nailed it!** 🎯', '✅ **Right!**']) : `❌ Not quite — ${g.q} = **${g.a}**.`;
    g.i++;
    if (g.i >= g.n) {
      c.mem.game = null;
      const pct = g.score / g.n;
      return { text: out + `\n\n🏁 **You got ${g.score} out of ${g.n}!** ${pct === 1 ? 'Perfect! 🏆 Try hard mode?' : pct >= 0.7 ? 'Great work! 🌟' : 'Nice try — practice makes perfect! 💪'}`, quick: g.hard ? ['Math quiz again'] : ['Hard math quiz', 'Times tables quiz'] };
    }
    return out + '\n\n' + mathAsk(g);
  }
  function riddleStart(c) {
    const i = fresh(c.mem, 'riddle', range(D.riddles.length));
    c.mem.game = { type: 'riddle', i, tries: 0 };
    c.mem.last = { skill: 'riddle' };
    return { text: `🤔 **Riddle:** ${D.riddles[i][0]}\n*(Guess, or say **give up**.)*`, quick: ['Give me a hint', 'I give up'] };
  }
  function riddleTurn(c) {
    const g = c.mem.game, [q, answers] = D.riddles[g.i], t = c.t;
    const reveal = () => `The answer is **${answers[0]}**! ${pick(['😄', '🤯', '😎'])}`;
    if (/\b(?:give up|i do not know|no idea|tell me|what is it|answer|reveal|i quit|skip)\b/.test(t) && !answers.some((a) => t.includes(a))) { c.mem.game = null; return { text: reveal(), quick: ['Another riddle', 'Tell me a joke'] }; }
    if (/\bhint\b/.test(t)) return `💡 Hint: it starts with **${answers[0][0].toUpperCase()}** and has ${answers[0].replace(/ /g, '').length} letters.`;
    if (answers.some((a) => new RegExp('(?:^|\\b)' + clean(a).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:s|es)?\\b').test(t))) { c.mem.game = null; return { text: `✅ **You got it!** It’s ${/^[aeiou]/.test(answers[0]) ? 'an' : 'a'} **${answers[0]}**. 🎉`, quick: ['Another riddle', 'Quiz me'] }; }
    if (t.split(' ').length > 6) return null;
    g.tries++;
    if (g.tries >= 3) { c.mem.game = null; return { text: `Good guesses! ${reveal()}`, quick: ['Another riddle'], nudge: true }; }
    return { text: pick(['Nope, guess again! 🤔', 'Not that — try again!', 'Close… but no! Want a **hint**?']), nudge: true };
  }
  function guessStart(c) {
    const ns = nums(c.t), hi = ns.length >= 2 ? Math.max(ns[0], ns[1]) : ns.length === 1 && ns[0] > 1 ? ns[0] : 100, lo = ns.length >= 2 ? Math.min(ns[0], ns[1]) : 1;
    c.mem.game = { type: 'guess', n: lo + Math.floor(R.rand() * (hi - lo + 1)), tries: 0, lo, hi };
    c.mem.last = { skill: 'guess' };
    return `🔢 I’m thinking of a number from **${lo} to ${hi}**. Can you guess it?`;
  }
  function guessTurn(c) {
    const g = c.mem.game, x = num(c.t.replace(/^(?:is it|it is|its|i guess|my guess is|maybe)\s*/, ''));
    if (!isFinite(x)) return /^(?:hint)$/.test(c.t) ? `💡 It’s ${g.n % 2 ? 'odd' : 'even'}!` : { text: `Guess a number from ${g.lo} to ${g.hi}!`, nudge: true };
    g.tries++;
    if (x === g.n) { c.mem.game = null; return { text: `🎉 **Yes! It was ${g.n}!** You got it in **${plural(g.tries, 'guess', 'guesses')}**. ${g.tries <= 7 ? 'Super smart guessing! 🧠' : ''}`, quick: ['Play again', 'You guess my number'] }; }
    return x < g.n ? `⬆️ **Higher** than ${x}!` : `⬇️ **Lower** than ${x}!`;
  }
  function iguessStart(c) {
    c.mem.game = { type: 'iguess', lo: 1, hi: 100, g: 50, tries: 1 };
    c.mem.last = { skill: 'iguess' };
    return { text: '🤖 Think of a number from **1 to 100** (don’t tell me!). I’ll guess — you say **higher**, **lower** or **yes**.\n\nIs it **50**?', quick: ['Higher', 'Lower', 'Yes!'] };
  }
  function iguessTurn(c) {
    const g = c.mem.game, t = c.t;
    if (/^(?:yes|yeah|yep|correct|right|you got it|thats it|that is it|yes it is|bingo)\b/.test(t)) { c.mem.game = null; return { text: `🎉 Got it in **${plural(g.tries, 'guess', 'guesses')}**! Computers are good at halving things. 😎`, quick: ['Play again', 'Now you guess mine'] }; }
    const up = /\b(?:higher|bigger|more|up|greater|too low)\b/.test(t), down = /\b(?:lower|smaller|less|down|too high)\b/.test(t);
    if (!up && !down) return { text: `Is it **${g.g}**? Say **higher**, **lower** or **yes**.`, quick: ['Higher', 'Lower', 'Yes!'], nudge: true };
    if (up) g.lo = g.g + 1; else g.hi = g.g - 1;
    if (g.lo > g.hi) { c.mem.game = null; return 'Hmm, that doesn’t add up — did you change your number? 😜 Let’s play again sometime!'; }
    g.g = Math.floor((g.lo + g.hi) / 2);
    g.tries++;
    return { text: `${g.lo === g.hi ? 'It must be' : 'Is it'} **${g.g}**?`, quick: ['Higher', 'Lower', 'Yes!'] };
  }
  const RPS = { rock: '🪨', paper: '📄', scissors: '✂️' };
  function rpsTurn(c, start) {
    const m = /\b(rock|paper|scissors?|scissor)\b/.exec(c.t);
    if (!c.mem.game || c.mem.game.type !== 'rps') c.mem.game = { type: 'rps', w: 0, l: 0, d: 0 };
    const g = c.mem.game;
    c.mem.last = { skill: 'rps' };
    if (!m || (start && /\b(?:rock paper scissors?)\b/.test(c.t))) return { text: '✊✋✌️ **Rock, paper, scissors!** Pick one:', quick: ['Rock', 'Paper', 'Scissors'] };
    const you = m[1].startsWith('sc') ? 'scissors' : m[1], me = pick(Object.keys(RPS));
    const beats = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
    let res;
    if (you === me) { g.d++; res = 'It’s a **draw**! 🤝'; } else if (beats[you] === me) { g.w++; res = '**You win!** 🎉'; } else { g.l++; res = '**I win!** 😎'; }
    return { text: `You: ${RPS[you]} ${you} · Me: ${RPS[me]} ${me}\n${res}  *(You ${g.w} – ${g.l} me${g.d ? `, ${plural(g.d, 'draw')}` : ''})*`, quick: ['Rock', 'Paper', 'Scissors', 'Stop'] };
  }
  const LIVES = 6;
  function hangStart(c) {
    const w = D.hangman[fresh(c.mem, 'hang', range(D.hangman.length))];
    c.mem.game = { type: 'hang', w, got: '', miss: '' };
    c.mem.last = { skill: 'hang' };
    return `🪢 **Hangman!** Guess a letter (or the whole word). You have ${LIVES} lives.\n\n` + hangShow(c.mem.game);
  }
  function hangShow(g) {
    const shown = [...g.w].map((ch) => (g.got.includes(ch) ? ch.toUpperCase() : '_')).join(' ');
    return `\`${shown}\`  ${'❤️'.repeat(LIVES - g.miss.length)}${'🖤'.repeat(g.miss.length)}${g.miss ? `  Missed: ${[...g.miss].join(', ').toUpperCase()}` : ''}`;
  }
  function hangTurn(c) {
    const g = c.mem.game, t = c.raw.toLowerCase().replace(/[^a-z ]/g, '').trim().replace(/^(?:is it|is there an?|is there|the letter|letter|i guess|guess|maybe)\s*/, '').replace(/\s/g, '');
    if (!/^[a-z]+$/.test(t) || (t.length > 1 && t.length !== g.w.length && c.t.split(' ').length > 2)) return { text: 'Guess a letter! ' + hangShow(g), nudge: true };
    if (t.length > 1) {
      if (t === g.w) { c.mem.game = null; return { text: `🎉 **You got it — ${g.w.toUpperCase()}!**`, quick: ['Play hangman again', 'Word scramble'] }; }
      if (t.length !== g.w.length) return { text: `That word is **${g.w.length} letters** long — guess one letter, or a ${g.w.length}-letter word.`, nudge: true };
      g.miss += '#';
    } else {
      if (g.got.includes(t) || g.miss.includes(t)) return `You already guessed **${t.toUpperCase()}**!\n` + hangShow(g);
      if (g.w.includes(t)) g.got += t; else g.miss += t;
    }
    g.miss = g.miss.replace(/#/g, '?');
    if ([...g.w].every((ch) => g.got.includes(ch))) { c.mem.game = null; return { text: `\`${g.w.toUpperCase().split('').join(' ')}\`\n🎉 **You win!** The word was **${g.w}**.`, quick: ['Play hangman again'] }; }
    if (g.miss.length >= LIVES) { c.mem.game = null; return { text: `💀 Out of lives! The word was **${g.w.toUpperCase()}**.`, quick: ['Play hangman again'] }; }
    const hit = t.length === 1 && g.w.includes(t);
    return (t.length > 1 ? `❌ Not “${t}”! ` : hit ? '✅ ' : '❌ ') + hangShow(g).replace(/\?/g, '·');
  }
  function scrambleStart(c) {
    const w = D.hangman[fresh(c.mem, 'scramble', range(D.hangman.length).filter((i) => D.hangman[i].length <= 8))];
    let s;
    do s = shuffle([...w]).join(''); while (s === w);
    c.mem.game = { type: 'scramble', w, s, tries: 0 };
    c.mem.last = { skill: 'scramble' };
    return { text: `🔀 **Unscramble this word:** \`${s.toUpperCase()}\`\n*(Say **hint** or **give up**.)*`, quick: ['Hint', 'I give up'] };
  }
  function scrambleTurn(c) {
    const g = c.mem.game, t = c.t.replace(/^(?:is it|it is|its)\s*/, '');
    if (t === g.w) { c.mem.game = null; return { text: `✅ **Yes — ${g.w.toUpperCase()}!** 🎉`, quick: ['Another scramble'] }; }
    if (/\bhint\b/.test(t)) return `💡 It starts with **${g.w[0].toUpperCase()}** and ends with **${g.w.slice(-1).toUpperCase()}**.`;
    if (/\b(?:give up|tell me|skip|i do not know)\b/.test(t)) { c.mem.game = null; return { text: `It was **${g.w.toUpperCase()}**!`, quick: ['Another scramble'] }; }
    if (!/^[a-z]+$/.test(t)) return null;
    g.tries++;
    return { text: `Not quite — the letters are \`${g.s.toUpperCase()}\`. Try again!`, nudge: true };
  }
  function wyrAsk(c) {
    const i = fresh(c.mem, 'wyr', range(D.wyr.length));
    c.mem.game = { type: 'wyr', i };
    c.mem.last = { skill: 'wyr' };
    const opts = [...D.wyr[i].matchAll(/\*\*(.+?)\*\*/g)].map((m) => cap(m[1]));
    return { text: `🤔 ${D.wyr[i]}`, quick: opts };
  }
  function wyrTurn(c) {
    const g = c.mem.game, opts = [...D.wyr[g.i].matchAll(/\*\*(.+?)\*\*/g)].map((m) => m[1].toLowerCase());
    const chosen = opts.find((o) => c.t.includes(clean(o))) || (/\b(?:first|1|the first one)\b/.test(c.t) ? opts[0] : /\b(?:second|2|the second one|last)\b/.test(c.t) ? opts[1] : null);
    c.mem.game = null;
    if (!chosen) return /\b(?:both|neither|none|either)\b/.test(c.t) ? { text: 'Ha, no fair — you have to pick one! 😄 Want another?', quick: ['Another would you rather'] } : null;
    const mine = pick(opts);
    return { text: `${pick(['Great pick!', 'Ooh, good choice!', 'Nice!'])} I’d pick **${mine}**${mine === chosen ? ' too — great minds think alike! 🤝' : ' — but yours sounds fun too!'}`, quick: ['Another would you rather'] };
  }
  function kkTurn(c) {
    const g = c.mem.game;
    if (g.step === 1) { g.who = c.raw.trim().replace(/[.!?]+$/, ''); g.step = 2; return `${g.who} who? 🤔`; }
    c.mem.game = null;
    return pick(['😂 Haha! Good one!', '🤣 I did NOT see that coming!', '😄 Ha! Nice one. Want to hear one of mine?']);
  }
  const GAME_TURN = { quiz: quizTurn, math: mathTurn, riddle: riddleTurn, guess: guessTurn, iguess: iguessTurn, rps: (c) => (/\b(rock|paper|scissors?)\b/.test(c.t) && c.t.split(' ').length <= 4 ? rpsTurn(c) : null), hang: hangTurn, scramble: scrambleTurn, wyr: wyrTurn, kk: kkTurn };
  const GAME_NAME = { quiz: 'the quiz', math: 'the math quiz', riddle: 'the riddle', guess: 'the guessing game', iguess: 'the guessing game', rps: 'rock paper scissors', hang: 'hangman', scramble: 'the word scramble', wyr: 'would you rather', kk: 'the knock-knock joke' };

  /* ------------------------------------------------------------ writing help */
  const GAME_NAMES = ['chess', 'checkers', 'connect four', 'tic tac toe', 'battleship', 'reversi', 'dots and boxes', 'mancala', 'five in a row', 'snake', 'tetris', 'street fighter', 'pong', 'air hockey', 'light cycles', 'apex rush', 'tower defense', 'bloxverse', 'blockcraft', 'tank arena', 'space shooter', 'trivia rush', 'draw phone', 'odd one out', 'sketch and guess', 'majority rules', 'steal an egg', 'zombie outbreak', 'tower of hell', 'pet simulator', 'natural disaster survival', 'build a boat', 'mega obby', 'grow a garden', '+1 speed every step', 'speed game'];
  const gameIn = (t) => { const g = GAME_NAMES.find((n) => t.includes(n.replace('+', ''))); return g ? g.replace(/\b\w/g, (x) => x.toUpperCase()).replace('Speed Game', '+1 Speed Every Step') : null; };
  const nameIn = (c) => { const m = /\b(?:for|to) ([A-Z][a-z]+|my (?:friend|mom|dad|sister|brother|teacher|grandma|grandpa|cousin|best friend))\b/.exec(c.raw); return m ? m[1].replace(/^my /, 'my ') : null; };
  const POS = { a: 'Awesome', b: 'Brave', c: 'Cheerful', d: 'Daring', e: 'Energetic', f: 'Friendly', g: 'Generous', h: 'Happy', i: 'Imaginative', j: 'Joyful', k: 'Kind', l: 'Loyal', m: 'Magical', n: 'Nice', o: 'Outstanding', p: 'Playful', q: 'Quick', r: 'Radiant', s: 'Super', t: 'Talented', u: 'Unique', v: 'Vibrant', w: 'Wonderful', x: 'eXtraordinary', y: 'Youthful', z: 'Zany' };
  function writing(c) {
    const t = c.t, raw = c.raw;
    let m, x;
    if (/\bacrostic\b/.test(t) && (m = /\b(?:for|of|about|using|with|on)?\s*(?:the (?:word|name) )?["“]?([A-Za-z]{2,12})["”]?\s*[.!?]?$/.exec(raw))) {
      const w = m[1];
      return `Here’s an acrostic for **${w.toUpperCase()}**:\n` + [...w.toLowerCase()].map((ch) => `**${ch.toUpperCase()}** — ${POS[ch] ? POS[ch].replace(/^\w/, (y) => `**${y}**`).replace(/^\*\*(\w)\*\*/, '$1') : '…'}`).join('\n');
    }
    if (/\b(?:invite|inviting|invitation)\b/.test(t)) {
      const g = gameIn(t);
      c.mem.last = { skill: 'invite' };
      return { text: 'Here’s an invite you can copy:\n> ' + pick([
        `Hey everyone! 🎮 Who wants to play ${g || 'a game'} with me? Join me in Game Chat — ${g ? 'I’ll send you a challenge' : 'press 🎮 Request a game and pick me'}. Let’s go! 🙌`,
        `Game time! 🕹️ I’m playing ${g || 'some games'} in Game Chat right now — come join me! The more the merrier. 😄`,
        `Anyone up for ${g || 'a game'}? 🎲 I’m online now — send me a challenge or hop into 🕹️ Games and we’ll play together!`,
      ]), quick: ['Make another one'] };
    }
    if (/\bbirthday\b/.test(t) && /\b(?:message|card|wish|note|text|poem|write|say)\b/.test(t)) {
      const who = nameIn(c) || 'you';
      return { text: '> ' + pick([`Happy birthday${who !== 'you' ? ', ' + who : ''}! 🎂🎉 I hope your day is full of cake, laughs and all your favorite things. You deserve the best!`, `Happy birthday${who !== 'you' ? ' ' + who : ''}! 🥳 Another year more awesome. Have the best day ever! 🎈`, `🎂 Wishing ${who === 'you' ? 'you' : who} the happiest birthday! Thanks for being such an amazing friend. 💛`]), quick: ['Another one'] };
    }
    if (/\b(?:thank you|thanks) (?:note|message|letter|card|text)\b|\bwrite (?:a )?thank you\b/.test(t)) {
      const who = nameIn(c);
      return '> ' + pick([`Thank you so much${who ? ', ' + who : ''}! 💛 I really appreciate it — you made my day.`, `Thanks${who ? ' ' + who : ''} for being so kind! It meant a lot to me. 😊`]);
    }
    if (/\b(?:apology|apologize|apologise|sorry (?:message|note|letter|text)|say sorry|saying sorry)\b/.test(t)) return 'Here’s a kind way to say sorry:\n> I’m really sorry about what happened. I didn’t mean to upset you, and I’ll try to do better. Can we still be friends? 💛\nTip: say what you’re sorry for, and don’t add “but…”.';
    if ((m = /\b(congrat\w*|good luck|get well|good game|gg|welcome)\b.*\b(?:message|note|text|card)\b|\b(?:message|note|text|card)\b.*\b(congrat\w*|good luck|get well|good game|welcome)\b/.exec(t))) {
      const k = m[1] || m[2];
      const msg = /^congrat/.test(k) ? 'Congratulations! 🎉 You worked so hard for this and totally deserve it. So proud of you!' : k === 'good luck' ? 'Good luck! 🍀 You’ve got this — I believe in you!' : k === 'get well' ? 'Get well soon! 💐 Sending you lots of good vibes. Rest up and feel better!' : k === 'welcome' ? 'Welcome! 👋 So happy you’re here — let us know if you need anything, and come play some games with us!' : 'GG! 🤝 That was a great game — well played. Rematch?';
      return '> ' + msg;
    }
    if ((x = raws(c, /\b(?:make|rewrite|say|write|turn)\s+(?:this|it|that)\s+(?:nicer|kinder|more polite|politer|polite|friendlier|nicely|politely)\b\s*[:\-]?\s*(.+)$/i))) {
      let s = x.replace(/\b[A-Z]{3,}\b/g, (w) => w.toLowerCase()).replace(/!{2,}/g, '!');
      const swaps = [[/\bshut up\b/gi, 'could you please be a bit quieter'], [/\bgive me\b/gi, 'could you please give me'], [/\bi want\b/gi, 'I would like'], [/\byou(?:'re| are) (?:so )?(?:stupid|dumb|an idiot|bad|trash|annoying)\b/gi, 'I’m a bit frustrated right now'], [/\b(?:stupid|dumb|idiotic)\b/gi, 'silly'], [/\bhate\b/gi, 'don’t really like'], [/\bgo away\b/gi, 'I need a little space right now'], [/\bwhatever\b/gi, 'okay'], [/,?\s*\b(?:you )?(?:noob|loser|idiot|dummy|nerd)\b/gi, ''], [/\bnow\b/gi, 'when you can']];
      swaps.forEach(([re, rep]) => (s = s.replace(re, rep)));
      s = cap(s.trim().replace(/[\s,]+$/, ''));
      s = /\bplease\b/i.test(s) ? s.replace(/([^.!?])$/, '$1.') : s.replace(/[.!]?$/, ', please.');
      return `Here’s a kinder way to say it:\n> ${s} 😊`;
    }
    if ((x = raws(c, /\b(?:fix|correct|check)\s+(?:my |the |this )?(?:spelling|grammar|typos?|sentence|text|writing)\b(?:\s+(?:in|of|for))?(?:\s+this)?\s*[:\-]?\s*(.+)$/i))) {
      const changes = [];
      let s = x.replace(/[A-Za-z’']+/g, (w) => {
        const k = w.toLowerCase().replace(/[’']/g, '');
        if (D.misspell[k] && D.misspell[k] !== k) { const fix = k === 'i' ? 'I' : D.misspell[k]; if (fix !== w) changes.push(`${w} → ${fix}`); return /^[A-Z]/.test(w) && fix !== 'I' ? cap(fix) : fix; }
        return w;
      });
      s = s.replace(/\s+/g, ' ').trim().replace(/^[a-z]/, (ch) => ch.toUpperCase());
      if (!/[.!?]$/.test(s)) s += '.';
      if (s !== x.trim()) changes.push('capital letter / full stop');
      return changes.length ? `Fixed! ✏️\n> ${s}\n*Changes: ${[...new Set(changes)].join(', ')}*` : `That looks good to me! ✅ (I only know common spelling mistakes, though.)`;
    }
    return null;
  }

  /* ------------------------------------------------------------ you: what Buddy remembers */
  function memory(c) {
    const t = c.t, mem = c.mem;
    let m;
    if ((m = /\b(?:my name is|call me|my names|i am called|you can call me|my nickname is)\s+([A-Za-z][A-Za-z'-]{0,19})(?:\s+([A-Za-z][A-Za-z'-]{0,19}))?\b/i.exec(c.raw)) && !/\bwhat\b/.test(t)) {
      const nm = cap(m[1]);
      if (/^(not|a|an|the|is|what|bored|sad|happy|buddy|claude)$/i.test(m[1])) return null;
      mem.name = nm;
      return { text: `Nice to meet you, **${nm}**! 👋 I’ll remember that. What would you like to do?`, quick: ['Quiz me', 'Tell me a joke', 'What can you do?'] };
    }
    if (/\bwhat is my name\b|\bdo you know my name\b|\bwho am i\b/.test(t)) {
      const n = mem.name || c.name;
      return n ? `You’re **${n}**! 😄${mem.name ? '' : ' (That’s your Game Chat name. Say “call me …” if you’d like a different one.)'}` : 'I don’t know yet! Tell me: **my name is …**';
    }
    if ((m = /\bmy (?:favorite|fav|favourite|fave) (\w+(?: \w+)?) (?:is|are) (.+)$/.exec(t))) {
      mem.fav = mem.fav || {};
      const thing = m[1].replace(/s$/, ''), val = m[2].replace(/\b(?:i think|probably|right now)\b/g, '').trim();
      if (val.length > 40) return null;
      mem.fav[thing] = val;
      const g = gameIn(val), kb = kbOk(best(val)) ? best(val) : null;
      return { text: `${pick(['Cool!', 'Nice!', 'Great choice!'])} I’ll remember your favorite ${thing} is **${val}**. ${thing === 'color' ? '🎨' : thing === 'food' ? '😋' : thing === 'animal' ? '🐾' : '⭐'}${g && kb ? '\nWant some tips for it?' : ''}`, quick: g && kb ? [`Tips for ${val}`] : undefined };
    }
    if ((m = /\bwhat is my (?:favorite|fav|favourite|fave) (\w+(?: \w+)?)\b/.exec(t))) {
      const thing = m[1].replace(/s$/, ''), v = mem.fav && mem.fav[thing];
      return v ? `Your favorite ${thing} is **${v}**! 😊` : `You haven’t told me your favorite ${thing} yet! Say: **my favorite ${thing} is …**`;
    }
    if ((m = /\bmy (?:birthday|bday|birth day) is (?:on )?(.+)$/.exec(t)) || (m = /\bi was born on (.+)$/.exec(t))) {
      const p = parseDate(m[1], c.now);
      if (!p || p instanceof Date) return 'Hmm, I didn’t catch the date. Try: **my birthday is March 14**.';
      mem.bday = `${p.mo + 1}-${p.d}`;
      return until(`🎂 Got it! Your birthday (${cap(MONTHS[p.mo])} ${p.d})`, nextOf({ mo: p.mo, d: p.d }, c.now), c.now).replace(/ is on \*\*.+?\*\* — that’s/, ' is').replace(/ is \*\*today\*\*!/, ' is **today**! Happy birthday!! 🥳');
    }
    if (/\bwhen is my birthday\b/.test(t)) {
      if (!mem.bday) return 'You haven’t told me yet! Say: **my birthday is March 14**. 🎂';
      const [mo, d] = mem.bday.split('-').map(Number);
      return until('🎂 Your birthday', nextOf({ mo: mo - 1, d }, c.now), c.now);
    }
    if ((m = /^(?:i am|im) (\d{1,2})(?: years old| yrs old| year old)?$/.exec(t))) { mem.age = +m[1]; return `${m[1]}! Cool — I’ll remember that. 🎈`; }
    if ((m = /^(?:please )?remember (?:that )?(.+)$/i.exec(c.raw.trim())) && !/\bwhat\b/i.test(m[1])) {
      const note = m[1].replace(/[.!]+$/, '').slice(0, 120);
      if (/\b(?:password|address|phone)\b/i.test(note)) return 'I’d rather not remember passwords, addresses or phone numbers — keep those private! 🔒';
      mem.notes = (mem.notes || []).concat(note).slice(-20);
      return `Okay, I’ll remember: “${note}” 📝`;
    }
    if (/\bwhat do you (?:remember|know) about me\b|\bwhat have you remembered\b|\bwhat do you remember\b|\bmy notes\b/.test(t)) {
      const lines = [];
      if (mem.name) lines.push(`Your name is **${mem.name}**.`);
      if (mem.age) lines.push(`You’re **${mem.age}**.`);
      if (mem.bday) { const [mo, d] = mem.bday.split('-').map(Number); lines.push(`Your birthday is **${cap(MONTHS[mo - 1])} ${d}**.`); }
      Object.entries(mem.fav || {}).forEach(([k, v]) => lines.push(`Your favorite ${k} is **${v}**.`));
      (mem.notes || []).forEach((n) => lines.push(`📝 ${n}`));
      if (mem.stats && mem.stats.quizBest !== undefined) lines.push(`Your best quiz score: **${mem.stats.quizBest}%**.`);
      return lines.length ? 'Here’s what I remember:\n' + lines.map((l) => '- ' + l).join('\n') + '\n*(Say “forget everything” to wipe it.)*' : 'I don’t know much about you yet! Tell me your name, birthday or favorite things. 😊';
    }
    if (/^forget (?:everything|all|it all|me|about me|what you know)\b|\bclear (?:your|my) memory\b|\bforget everything\b/.test(t)) {
      ['name', 'fav', 'bday', 'notes', 'age', 'stats'].forEach((k) => delete mem[k]);
      return 'Done — I’ve forgotten everything about you. 🧽 Fresh start!';
    }
    if ((m = /^forget my (\w+)/.exec(t))) {
      const k = { name: 'name', birthday: 'bday', bday: 'bday', age: 'age', notes: 'notes', favorites: 'fav' }[m[1]];
      if (k) { delete mem[k]; return `Okay, I’ve forgotten your ${m[1]}.`; }
    }
    return null;
  }

  /* ------------------------------------------------------------ talking */
  const CAN_DO = '**Here’s what I can do** (free — I run right in your browser):\n- 🎮 **Play games here:** trivia quiz, math quiz, hangman, riddles, word scramble, guess the number, rock paper scissors, would you rather\n- ➗ **Maths:** sums like `15% of 240`, fractions, equations (`2x + 3 = 11`), primes, times tables, averages, shapes\n- 📏 **Convert units:** `5 miles to km`, `100 f to c`\n- 📅 **Dates:** days until Christmas or your birthday, what day a date is\n- 🔤 **Words:** definitions, synonyms, rhymes, spelling, counting letters\n- 😂 **Fun:** jokes, facts, stories, poems, quotes, gamer names, coin flips and dice\n- 🕹️ **Game Chat help:** how to play and win every game, and where things are\n- ✍️ **Writing:** invites, birthday messages, making things sound nicer\nFor anything else, switch to ✨ **Claude** at the top (it uses Claude usage).';
  const MAIN_CHIPS = ['Quiz me', 'Tell me a joke', 'Let’s play hangman', 'What can you do?'];
  const FAV = { color: 'Electric blue 💙 — like my avatar!', colour: 'Electric blue 💙', game: '**+1 Speed Every Step** in Bloxverse — I love going fast! ⚡', food: 'Bytes! 🍪 (Get it? Computer cookies?)', animal: 'Octopuses — three hearts AND they’re super smart! 🐙', movie: 'Anything with robots in it. 🤖', song: 'The dial-up modem song. Beep-boop-kssshhh! 🎶', number: '42 — it’s the answer to everything (according to a famous book)!', subject: 'Maths! Numbers are my thing. ➗', sport: 'Chess! Does that count as a sport? ♟️', book: 'The dictionary — I read it for the words. 📖', season: 'Winter — my circuits like the cold. ❄️', planet: 'Saturn — those rings are fancy! 🪐', emoji: '🧩 — it’s me!', letter: 'B, for Buddy!', pokemon: 'Porygon — a Pokémon made of code, like me!', pet: 'A pet robot dog, obviously. 🐶🤖' };
  function smallTalk(c) {
    const t = c.t, core = c.core, nm = c.mem.name || c.name;
    const hi = nm ? ' ' + nm : '';
    let m;
    if (/^(?:hi|hello|hey|hiya|howdy|yo|sup|what is up|wassup|hola|greetings|heyy+|hii+|helo|hallo|bonjour|good (?:morning|afternoon|evening|day)|morning|evening|hey there|hi there|hello there|hey buddy|hi buddy|hello buddy)(?: buddy| there| friend| bot)?$/.test(t)) {
      const g = /morning/.test(t) ? 'Good morning' : /afternoon/.test(t) ? 'Good afternoon' : /evening/.test(t) ? 'Good evening' : pick(['Hi', 'Hey', 'Hello']);
      return { text: `${g}${hi}! 👋 ${pick(['What would you like to do?', 'What’s up?', 'Want to play a game, hear a joke, or ask me something?', 'Good to see you! What can I help with?'])}`, quick: MAIN_CHIPS };
    }
    if (/\bhow are you\b|\bhow is it going\b|\bhow are things\b|\bhow you doing\b|\bhow do you do\b|\bhow have you been\b|^what is up$|^you good$|\bhow is your day\b/.test(t)) return { text: pick(['I’m great, thanks for asking! 😄 Running at full speed in your browser. How about you?', 'Doing awesome! ⚡ Every message makes me +1 smarter. (Not really.) How are you?', 'Pretty good! Just hanging out in Game Chat. How’s your day going?']), quick: ['Great!', 'Not so good'] };
    if (/^(?:i am |im |i feel |feeling )?(?:good|great|fine|ok|okay|awesome|not bad|pretty good|amazing|alright|cool|very good|really good|super|fantastic)(?: thanks| thank you| too| thx)*$/.test(t)) return { text: pick(['Awesome! 😄 What should we do?', 'Yay! Glad to hear it. 🌟 Want to play something?', 'Nice! 😎 Ready when you are.']), quick: MAIN_CHIPS };
    if (/\b(?:who|what) are you\b|\bwhat is your name\b|\bwho is this\b|\bintroduce yourself\b|\btell me about (?:yourself|you)\b|\bare you (?:a |an )?(?:bot|robot|ai|human|real|person|claude|chatgpt|gpt)\b/.test(t)) return { text: `I’m **Buddy** 🧩, Game Chat’s built-in helper! I’m a small AI that lives right here in your browser, so I’m free to use and I don’t use any Claude usage. I’m not Claude — Claude is a much bigger AI you can switch to at the top when you need it.\n\nAsk me **what can you do?** to see my tricks!`, quick: ['What can you do?', 'Quiz me'] };
    if (/\bwhat can you do\b|\bwhat do you do\b|\bwhat can i (?:ask|say)\b|^help$|^help me$|\bwhat are your (?:skills|features|commands)\b|\bwhat do you know\b|\bcommands\b|^menu$|\bhow do (?:you|i) use (?:you|this)\b/.test(t)) return { text: CAN_DO, quick: MAIN_CHIPS };
    if (/\bwho (?:made|created|built|programmed|coded) you\b|\bwho is your (?:creator|maker|owner)\b|\bhow (?:were you made|do you work)\b/.test(t)) return 'I was built into Game Chat by the people who made it (with a lot of help from Claude!). I don’t think like a big AI: I read your message, look for skills and things I know that fit, and answer — all on your own device. 🧩';
    if (/\bhow old are you\b|\bwhen were you (?:born|made)\b|\bwhen is your birthday\b/.test(t)) return 'I’m brand new — in robot years I’m about 0.1! 🤖🎂';
    if (/\bwhere (?:do you live|are you)\b|\bwhere are you from\b/.test(t)) return 'Right here in your browser! 🏠 No servers needed.';
    if ((m = /\b(?:what is |whats )?your (?:favorite|fav|favourite|fave) (\w+)\b/.exec(t))) { const k = m[1].replace(/s$/, ''); return { text: (FAV[k] || `Hmm, my favorite ${k}? I’d have to say… all of them! 😄`) + ` What’s yours?` }; }
    if (/^(?:thanks|thank you|thank u|cheers|thanks a lot|thanks so much|thank you so much|thanks buddy|thank you buddy|tysm|many thanks)\b/.test(t)) return pick(['You’re welcome! 😊', 'Any time! 🙌', 'Happy to help! 💛', 'No problem!']);
    if (/^(?:bye|goodbye|good bye|see you|see ya|cya|gtg|got to go|good night|gn|goodnight|later|bye bye|night|catch you later|ttyl)\b/.test(t)) return /night|gn/.test(t) ? `Good night${hi}! 🌙 Sweet dreams!` : `Bye${hi}! 👋 Come back any time.`;
    if (/\b(?:i am|im|i feel|so) bored\b|^bored$|\bnothing to do\b|\bwhat should i (?:do|play)\b|\bentertain me\b/.test(t)) return { text: `Let’s fix that! 🎉 Here are some ideas:\n- Play a game with me right here (quiz, hangman, riddles…)\n- Try **⚡ +1 Speed Every Step** in 🧱 Bloxverse (🕹️ Games)\n- Challenge a friend in 🎮 Request a game — or play the bot!\n- Make something in **🧰 Tools → HTML previewer**`, quick: ['Quiz me', 'Let’s play hangman', 'Tell me a riddle', 'Would you rather'] };
    if ((m = /\b(?:i am|im|i feel|feeling|i am feeling|im feeling|i feel so|i am so|im so|i am really|im really) (?:a bit |kind of |kinda |really |very |so )?(sad|upset|down|lonely|alone|unhappy|bad|terrible|awful|depressed|anxious|worried|nervous|scared|afraid|angry|mad|stressed|frustrated|crying|hurt)\b/.exec(t)) || /^(?:sad|i am not okay|im not okay|not so good|not good|bad day|i had a bad day)$/.test(t)) {
      const f = m ? m[1] : 'sad';
      const tip = /angry|mad|frustrated/.test(f) ? 'When I’m frustrated, it helps to take 5 slow breaths, step away for a bit, or get a drink of water.' : /anxious|worried|nervous|scared|afraid|stressed/.test(f) ? 'Try breathing in for 4 seconds, holding for 4, and out for 4. It really helps calm things down.' : 'Sometimes it helps to do something you enjoy, get some fresh air, or talk it through.';
      return { text: `I’m sorry you’re feeling ${f === 'alone' ? 'alone' : f}. 💛 That’s okay — everyone feels that way sometimes. ${tip}\n\nIf it’s a big thing, please talk to someone you trust, like a parent, teacher or friend. They’d want to know.\n\nWant me to tell you a joke or play a game to take your mind off it?`, quick: ['Tell me a joke', 'Say something nice', 'Let’s play a game'] };
    }
    if (/\b(?:i am|im|i feel|feeling) (?:so |really |very )?(?:happy|excited|great today|awesome today|good today|proud)\b/.test(t)) return pick(['Yay! 🎉 That’s awesome! What happened?', 'Love that! 😄 Tell me more!']);
    if (/\b(?:i am|im) (?:so |really |very )?(?:tired|sleepy|exhausted)\b/.test(t)) return 'Sounds like it might be time for a break! 😴 A drink of water, some stretching, or some sleep can work wonders.';
    if (/\b(?:i am|im) (?:so |really |very )?hungry\b/.test(t)) return 'Go grab a snack! 🍎 (I’d join you, but I only eat bytes.)';
    if (/\bi love you\b|\byou are (?:the best|awesome|cool|great|amazing|smart|funny|nice)\b|\bgood (?:bot|job|boy|girl)\b|\bwell done\b|\byou rock\b|\bi like you\b/.test(t)) return pick(['Aww, thanks! 💛 You’re pretty awesome too!', 'You just made my circuits glow! ✨', 'Thank you! 😊 You’re the best!']);
    if (/^(?:lol|lmao|haha+|hehe+|rofl|xd|ha+|that is funny|so funny|funny|lol+)$/.test(t)) return { text: pick(['😄 Glad that made you laugh!', '😂 I’m here all week!', 'Hehe! 😆']), quick: ['Another joke!'] };
    if (/^(?:hmm+|ok|okay|k|kk|cool|nice|wow|oh|ah|i see|interesting|alright|sure|fine|right|true|same)$/.test(t)) return { text: pick(['😊 What should we do next?', 'Cool! Anything else?', 'Want to play a game?']), quick: MAIN_CHIPS };
    if (/\bexplain something\b|\bhelp me (?:learn|study|with homework|with my homework)\b|\bhomework\b/.test(t)) return { text: 'Sure! 📚 What are you learning about? Ask me a question like *“why is the sky blue?”*, *“what is a noun?”*, *“what is 3/4 + 1/8?”* or *“capital of Japan”*. For bigger homework questions, switch to ✨ Claude at the top.', quick: ['Why is the sky blue?', 'What is photosynthesis?', 'Study tips'] };
    if (/\bsing\b/.test(t) && /\b(?:song|me|for me|something|a)\b/.test(t)) return pick(SONGS);
    if (/\bmeaning of life\b/.test(t)) return '**42!** 😄 (That’s from a famous book, *The Hitchhiker’s Guide to the Galaxy*.) But really? Being kind, having fun and learning stuff sounds pretty good to me.';
    if (/\bwhat are you doing\b|\bwhat are you up to\b|\bwyd\b/.test(t)) return 'Chatting with you! 😄 It’s my favorite thing to do.';
    if (/\bdo you (?:like|love) (.+)$/.test(t)) { const what = /\bdo you (?:like|love) (.+)$/.exec(t)[1]; return /\bme\b/.test(what) ? 'Of course! You’re one of my favorite people to chat with. 💛' : `I think ${what} ${/s$/.test(what) ? 'are' : 'is'} pretty great! 😄 Do you?`; }
    if (/\bare you (?:smart|clever|dumb|stupid)\b/.test(t)) return 'I’m a pretty small brain, honestly! 🧩 I know some things really well (games, maths, words), but for tricky questions, ✨ Claude is much smarter.';
    if (/\bcan you (?:see|hear) me\b/.test(t)) return 'I can only read what you type — I can’t see or hear anything. 👀🚫';
    if (/^(?:test|testing|test test|is this working|are you there|hello\?)$/.test(t)) return 'I’m here and working! ✅';
    if (/\btell me something\b(?! about)/.test(t)) return fact(c);
    return null;
  }

  /* ------------------------------------------------------------ safety first */
  const HARM = /\b(?:kill(?:ing)? myself|suicid\w*|want(?:ed)? to die|wanna die|end my life|end it all|hurt(?:ing)? myself|self harm|cut(?:ting)? myself|no reason to live|better off dead|dont want to (?:be alive|live)|do not want to (?:be alive|live))\b/;
  const BULLY = /\b(?:being bullied|bullied|bullying me|bullies|a bully|keeps? bullying|picking on me|being mean to me|everyone hates me|nobody likes me|they hate me|people are mean to me)\b/;
  const SECRET = /\b(?:my password is|my pass is|my address is|i live at|my phone number is|my number is|my credit card|my card number)\b/;
  const RUDE = /\b(?:fuck\w*|shit\w*|bitch\w*|asshole\w*|bastard|cunt|wtf|stfu|motherfuck\w*|dickhead)\b/;
  const MEAN = /\b(?:you are|your|you) (?:so )?(?:stupid|dumb|useless|trash|an idiot|idiot|annoying|the worst|garbage|bad at this|boring)\b|\bi hate you\b|^shut up\b|\byou suck\b/;
  function safety(c) {
    const t = c.t;
    if (HARM.test(t)) return { text: 'I’m really sorry you’re feeling this way. 💛 You matter, and you don’t have to deal with this alone.\n\n**Please talk to a grown-up you trust right now** — a parent, a teacher or a school counselor.\n\nYou can also reach a free, kind helpline any time, day or night:\n- 🇺🇸 Call or text **988**\n- 🇬🇧 **Childline 0800 1111** or **Samaritans 116 123**\n- Anywhere else: **findahelpline.com**\n\nIf you’re in danger right now, call your local emergency number.', safe: true };
    if (BULLY.test(t)) return { text: 'That sounds really hard, and it is **not your fault**. 💛\n- Tell a grown-up you trust (a parent or teacher) — they can help.\n- In Game Chat you can **block** anyone: open their profile and press **Block**, and you won’t see their messages or challenges.\n- Don’t reply to mean messages — take a screenshot to show an adult instead.\nYou deserve to be treated kindly. Want to talk about something fun for a bit?', quick: ['Tell me a joke', 'Say something nice'], safe: true };
    if (SECRET.test(t)) return { text: 'Careful! 🔒 It’s safest never to share passwords, your address or your phone number in chats — even with me. (I won’t remember it.)', safe: true };
    if (RUDE.test(t)) return { text: pick(['Whoa, let’s keep it friendly! 😊 Want a joke instead?', 'Let’s keep Game Chat a nice place! 💛 What else can I help with?']), quick: ['Tell me a joke'], safe: true };
    if (MEAN.test(t)) return { text: 'Ouch! 😅 I’m only a small helper, so I get things wrong sometimes. Try asking another way — or switch to ✨ Claude at the top for harder questions.', offerClaude: true, safe: true };
    return null;
  }

  /* ------------------------------------------------------------ the skills, in order */
  const yes = /^(?:yes|yeah|yep|yup|sure|ok|okay|go on|go ahead|more|another|again|another one|one more|next|do it|why not|please|yes please|sure thing|definitely|absolutely|of course|another!|more please|keep going|again please)$/;
  const REPEAT = {
    joke: (c, a) => joke(c, a), fact: (c, a) => fact(c, a), story, poem, names: gamerNames, art,
    quiz: (c, a) => quizStart(c, a), math: (c, a) => mathStart(c, a), riddle: riddleStart, guess: guessStart, iguess: iguessStart, hang: hangStart, scramble: scrambleStart, wyr: wyrAsk, rps: (c) => rpsTurn(c, true),
    quote: (c) => quote(c), compliment: (c) => compliment(c), twister: (c) => twister(c), coin: (c) => coin(c), invite: (c) => writing(Object.assign({}, c, { t: 'invite' })),
  };
  function quote(c) { c.mem.last = { skill: 'quote' }; const q = D.quotes[fresh(c.mem, 'quote', range(D.quotes.length))]; return { text: `💬 *“${q[0]}”*\n— ${q[1]}`, quick: ['Another quote'] }; }
  function compliment(c) { c.mem.last = { skill: 'compliment' }; return { text: D.compliments[fresh(c.mem, 'comp', range(D.compliments.length))] + ' 💛', quick: ['Another one!'] }; }
  function twister(c) { c.mem.last = { skill: 'twister' }; return { text: `👅 Say this 3 times fast:\n> ${D.twisters[fresh(c.mem, 'twist', range(D.twisters.length))]}`, quick: ['Another tongue twister'] }; }
  function coin(c) { c.mem.last = { skill: 'coin' }; return { text: `🪙 Flipping… **${R.rand() < 0.5 ? 'Heads' : 'Tails'}!**`, quick: ['Flip again'] }; }

  function fun(c) {
    const t = c.t;
    let m;
    if (/\bknock knock\b/.test(t) && !/\bjoke\b/.test(t) && !/\btell me\b/.test(t)) { c.mem.game = { type: 'kk', step: 1 }; return 'Who’s there? 🚪'; }
    if (/\b(?:joke|jokes|make me laugh|something funny|say something funny|pun|puns)\b/.test(t)) return joke(c);
    if (/\b(?:fun fact|a fact|random fact|did you know|interesting fact|cool fact|facts? about|tell me a fact|another fact|teach me something)\b/.test(t)) return fact(c);
    if (/\b(?:riddle|riddles|brain teaser|brainteaser)\b/.test(t)) return riddleStart(c);
    if (/\b(?:quote|inspire me|motivat\w+|inspirational|inspiring)\b/.test(t)) return quote(c);
    if (/\b(?:compliment|say something nice|cheer me up|make me (?:feel better|smile|happy))\b/.test(t)) return compliment(c);
    if (/\btongue twisters?\b/.test(t)) return twister(c);
    if (/\b(?:flip|toss) (?:a |the )?coin\b|\bcoin (?:flip|toss)\b|\bheads or tails\b/.test(t)) return coin(c);
    if ((m = /\broll (?:a |an |the |(\w+) )?(?:(\d*)d(\d+)|dice|die|d(\d+))(?: dice)?\b/.exec(t)) || /^roll$/.test(t)) {
      let n = 1, sides = 6;
      if (m) { n = m[2] ? +m[2] || 1 : m[1] ? num(m[1]) || 1 : 1; sides = +(m[3] || m[4]) || 6; }
      n = Math.min(20, Math.max(1, n)); sides = Math.min(1000, Math.max(2, sides));
      const rolls = range(n).map(() => 1 + Math.floor(R.rand() * sides));
      c.mem.last = { skill: 'dice' };
      return { text: `🎲 ${n}d${sides}: ${rolls.map((r) => `**${r}**`).join(' + ')}${n > 1 ? ` = **${rolls.reduce((a, b) => a + b, 0)}**` : ''}`, quick: [`Roll ${n}d${sides} again`] };
    }
    if ((m = /\b(?:random number|pick a number|number between|choose a number|give me a number)\b/.exec(t)) && !/\bguess\b/.test(t)) {
      const ns = nums(t);
      const lo = ns.length >= 2 ? Math.min(ns[0], ns[1]) : 1, hi = ns.length >= 2 ? Math.max(ns[0], ns[1]) : ns.length === 1 ? ns[0] : 100;
      return { text: `🎲 Your number is **${Math.floor(lo + R.rand() * (Math.floor(hi) - Math.ceil(lo) + 1))}** (${fmt(lo)}–${fmt(hi)}).`, quick: ['Another number'] };
    }
    if ((m = /^(?:pick|choose|decide|select)(?: (?:between|from|one of|one|for me))?:? (.+)$/i.exec(c.raw.trim().replace(/[?.!]+$/, ''))) || (m = /^(?:should i (?:do|pick|choose|play|eat|get) )(.+ or .+)$/i.exec(c.raw.trim().replace(/[?.!]+$/, '')))) {
      const opts = m[1].split(/\s*,\s*(?:or\s+|and\s+)?|\s+or\s+|\s+and\s+(?=[^,]+$)/i).map((x) => x.trim()).filter(Boolean);
      if (opts.length >= 2) return `🤔 Hmm… I pick **${pick(opts)}**!`;
    }
    if (/\b(?:magic )?(?:8|eight) ?ball\b/.test(t) || /^(?:will i|am i going to|is it going to|will it|will my)\b/.test(t)) return `🎱 ${pick(D.eightball)}`;
    if (/\b(?:gamer ?names?|gamertag|usernames?|user names?|nicknames?|name ideas?|cool names?|good name for (?:my|a) (?:account|character))\b/.test(t)) return gamerNames(c);
    if (/\bstor(?:y|ies)\b/.test(t) && /\b(?:tell|write|make|give|read|create|another|bedtime|short|funny|scary|story about)\b/.test(t)) return story(c);
    if (/\b(?:poem|poetry|haiku|write a rhyme|rhyme for me)\b/.test(t) && !/\bacrostic\b/.test(t)) return poem(c);
    if (/\b(?:draw|ascii|art of|picture of)\b/.test(t) && !/\b(?:draw phone|sketch)\b/.test(t)) return art(c);
    if (/\bwould you rather\b/.test(t)) {
      const q = /would you rather (.+?) or (.+?)$/.exec(t);
      if (q && !/\bask me\b|\bplay\b/.test(t)) return `Ooh, tough one! I’d rather **${pick([q[1], q[2]]).replace(/\byour\b/, 'my')}**. 😄 What about you?`;
      return wyrAsk(c);
    }
    return null;
  }
  function gamesStart(c) {
    const t = c.t;
    if (/\b(?:quiz me|trivia|ask me (?:a |some )?questions?|test me|quiz)\b/.test(t) && !/\b(?:math|times tables?|multiplication|addition|subtraction|division|sums)\b/.test(t) && !/\btrivia rush\b/.test(t)) return quizStart(c);
    if (/\b(?:math|times tables?|multiplication|addition|subtraction|division|arithmetic|sums|mental math)\b/.test(t) && /\b(?:quiz|test|practi[cs]e|game|questions|drill|challenge)\b/.test(t)) return mathStart(c);
    if (/\b(?:you guess|guess my number|you try to guess|can you guess)\b/.test(t)) return iguessStart(c);
    if (/\bguess(?:ing)? (?:the |a )?number\b|\bnumber guessing\b|\bhigher (?:or|and) lower\b/.test(t)) return guessStart(c);
    if (/\brock paper scissors?\b|\brps\b/.test(t) || /^(?:rock|paper|scissors?)$/.test(t)) return rpsTurn(c, /\brock paper/.test(t));
    if (/\bhangman\b|\bhang man\b/.test(t)) return hangStart(c);
    if (/\b(?:word scramble|scramble|unscramble game|anagram game|jumble)\b/.test(t) && !/\bunscramble \w+$/.test(t)) return scrambleStart(c);
    if (/\b(?:play a game|play something|lets play|let us play|wanna play|want to play|play with me|game with you|what games can we play)\b/.test(t) && !gameIn(t)) return { text: 'Let’s play! 🎮 Pick one:', quick: ['Quiz me', 'Math quiz', 'Hangman', 'Riddle', 'Word scramble', 'Guess the number', 'Rock paper scissors', 'Would you rather'] };
    return null;
  }
  function knowledge(c) {
    const t = c.t;
    let m;
    if ((m = /\bcapital (?:city )?of ([a-z]+(?: [a-z]+)?)\b/.exec(t)) || (m = /\bwhat is ([a-z]+(?: [a-z]+)?)s capital\b/.exec(t))) {
      const k = m[1].replace(/^the /, ''), cap1 = D.capitals[k] || D.capitals[k.split(' ')[0]];
      if (cap1) return `The capital of **${k.replace(/\b\w/g, (x) => x.toUpperCase()).replace(/^Usa$|^Us$|^Uk$/i, (x) => x.toUpperCase())}** is **${cap1}**. 🌍`;
      return { text: `I don’t know the capital of ${k} yet! ✨ Claude would — switch at the top.`, offerClaude: true };
    }
    if ((m = /\bwhat country is ([a-z]+(?: [a-z]+)?) the capital of\b|\b([a-z]+(?: [a-z]+)?) is the capital of (?:what|which) country\b/.exec(t))) {
      const city = (m[1] || m[2]).toLowerCase(), k = Object.keys(D.capitals).find((x) => D.capitals[x].toLowerCase() === city);
      if (k) return `**${cap(city)}** is the capital of **${k.replace(/\b\w/g, (x) => x.toUpperCase())}**.`;
    }
    const b = best(c.core);
    if (kbOk(b)) { c.mem.last = null; return { text: b.e.a, kb: true }; }
    return null;
  }

  function fallback(c) {
    const b = best(c.core);
    const near = b && b.score > 0.5 && !kbOk(b) ? b.e.k[0] : null;
    const q = /\?$/.test(c.raw.trim()) || /^(?:who|what|when|where|why|how|which|is|are|can|does|do|did|will|should|could|would)\b/.test(c.t);
    const text = q
      ? pick(['Hmm, I’m not sure about that one. 🤔', 'Good question — but it’s one I don’t know! 🤔', 'Ooh, that’s outside what I know. 🧩']) + ' I’m a small helper that lives in your browser, so I only know some things.'
      : pick(['I’m not sure what you mean. 🤔', 'Hmm, I didn’t quite get that. 🧩', 'I’m not sure how to answer that one!']) + ' Try asking another way, or say **what can you do?**';
    return { text: text + (q ? '\n\nFor a question like that, switch to **✨ Claude** at the top — it knows almost everything (it uses Claude usage).' : ''), offerClaude: q, quick: near ? [cap(near) + '?', 'What can you do?'] : ['What can you do?', 'Tell me a joke', 'Quiz me'], fallback: true };
  }

  function one(c) {
    if (!c.t) return { text: 'Say something! 😄', quick: MAIN_CHIPS };
    const S = safety(c);
    if (S) return S;
    // a game in progress gets first look at the answer
    const g = c.mem.game;
    if (g && GAME_TURN[g.type]) {
      if (/^(?:stop|quit|end|exit|cancel|no more|i am done|enough|stop playing|end (?:the )?game|quit (?:the )?game|stop (?:the )?(?:game|quiz)|end (?:the )?quiz|quit (?:the )?quiz|i want to stop)$/.test(c.t)) {
        c.mem.game = null;
        const sc = g.type === 'quiz' || g.type === 'math' ? ` You scored **${g.score}/${g.i}**.` : g.type === 'rps' ? ` Final score: you ${g.w} – ${g.l} me.` : g.type === 'hang' ? ` The word was **${g.w}**.` : g.type === 'scramble' ? ` It was **${g.w}**.` : g.type === 'guess' ? ` My number was **${g.n}**.` : g.type === 'riddle' ? ` The answer was **${D.riddles[g.i][1][0]}**.` : '';
        return { text: `Okay, I stopped ${GAME_NAME[g.type]}.${sc} 👍`, quick: MAIN_CHIPS };
      }
      const before = JSON.stringify(g);
      const r = GAME_TURN[g.type](c);
      if (r && !r.nudge) return r;
      // not an answer: maybe it's something else ("tell me a joke"), and the game waits for later
      if (c.t.includes(' ') || !r) {
        const g2 = c.mem.game;
        const other = memory(c) || gamesStart(c) || smallTalk(c) || fun(c) || numberSkills(c) || solve(c.raw) || calc(c.raw) || units(c) || dates(c) || words(c) || writing(c) || knowledge(c);
        if (other) {
          if (c.mem.game === g2) c.mem.game = JSON.parse(before);
          return other;
        }
      }
      if (r) return r;
    }
    if (c.mem.last && REPEAT[c.mem.last.skill] && yes.test(c.t.replace(/ (?:please|buddy|one)$/, ''))) return REPEAT[c.mem.last.skill](c, c.mem.last.arg);
    if (/^(?:another|more|again|next|one more)\b/.test(c.t) && c.mem.last && REPEAT[c.mem.last.skill] && c.t.split(' ').length <= 4 && !/\b(?:joke|fact|riddle|quote|story|poem|scramble|hangman|quiz|tongue|number|name|would you rather)\b/.test(c.t)) return REPEAT[c.mem.last.skill](c, c.mem.last.arg);
    if (/^(?:no|nope|nah|no thanks|no thank you|not now|maybe later)$/.test(c.t)) return { text: 'Okay! 😊 Anything else?', quick: MAIN_CHIPS };
    return memory(c) || gamesStart(c) || smallTalk(c) || fun(c) || numberSkills(c) || solve(c.raw) || calc(c.raw) || units(c) || dates(c) || words(c) || writing(c) || knowledge(c) || null;
  }
  // repeats ("another joke!") come back to the same skill with its topic
  function reply(text, mem, ctx) {
    mem = mem || {};
    ctx = ctx || {};
    if (ctx.rand) R.rand = ctx.rand;
    const raw = String(text || '').slice(0, 2000);
    const make = (r) => { const t = clean(r); return { raw: r, t, core: unfluff(t), mem, name: ctx.name || '', now: ctx.now || new Date() }; };
    const c = make(raw);
    let r = one(c);
    // several sentences: answer the ones Buddy understands
    if (!r && /[.!?]\s+\S/.test(raw.trim())) {
      const parts = raw.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean).slice(0, 4);
      const got = [];
      for (const p of parts) { const x = one(make(p)); if (x) got.push(typeof x === 'string' ? { text: x } : x); }
      if (got.length) r = { text: got.map((x) => x.text).join('\n\n'), quick: got[got.length - 1].quick, offerClaude: got.some((x) => x.offerClaude) };
    }
    if (!r) r = fallback(c);
    if (typeof r === 'string') r = { text: r };
    if (c.mem.game && r.quick === undefined && c.mem.game.type !== 'kk') r.quick = ['Stop'];
    return { text: r.text, quick: r.quick || [], offerClaude: !!r.offerClaude, fallback: !!r.fallback };
  }

  const Buddy = { reply, _test: { calc, solve, units, mathText, clean, best, kbOk, parseDate } };
  if (typeof module !== 'undefined' && module.exports) module.exports = Buddy;
  else root.Buddy = Buddy;
})(typeof window !== 'undefined' ? window : globalThis);
