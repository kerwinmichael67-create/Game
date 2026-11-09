/* ========================================================================
   Apex Circuit — util
   ======================================================================== */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
/* frame-rate independent exponential approach */
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const TAU = Math.PI * 2;
const wrapAngle = (a) => { a = a % TAU; if (a > Math.PI) a -= TAU; if (a < -Math.PI) a += TAU; return a; };
const sign = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);

function fmtTime(ms, blank = '--:--.---') {
  if (ms == null || !isFinite(ms) || ms < 0) return blank;
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000), t = Math.floor(ms % 1000);
  return `${m}:${String(s).padStart(2, '0')}.${String(t).padStart(3, '0')}`;
}
function ordinal(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0]; }

/* seeded PRNG (mulberry32) so online clients can agree on scenery / bot colours */
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

const Store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
};

function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === false || v == null) continue;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) if (c != null) e.append(c);
  return e;
}

/* segmented control helper: <div class="seg"><button data-v=..> */
function segValue(seg) { const b = seg.querySelector('[aria-pressed="true"]'); return b ? b.dataset.v : null; }
function segSet(seg, v) { $$('button', seg).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v) === String(v) ? 'true' : 'false')); }
function segInit(seg, onChange) {
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]'); if (!b || seg.dataset.locked === '1') return;
    segSet(seg, b.dataset.v); onChange && onChange(b.dataset.v);
  });
}

const PAINTS = [
  { id: 'ember', name: 'Ember', hex: 0xff5a1f },
  { id: 'ice', name: 'Glacier', hex: 0x3ad0ff },
  { id: 'lime', name: 'Volt', hex: 0xa3ff3a },
  { id: 'violet', name: 'Ultraviolet', hex: 0x9b5cff },
  { id: 'rose', name: 'Rosso', hex: 0xff2d6f },
  { id: 'gold', name: 'Champagne', hex: 0xf3c04a },
  { id: 'pearl', name: 'Pearl', hex: 0xe8ecf4 },
  { id: 'carbon', name: 'Carbon', hex: 0x2a2f3a },
];
const BOT_NAMES = ['Vega', 'Kessler', 'Okafor', 'Lindqvist', 'Moreau', 'Tanaka', 'Ibarra', 'Novak', 'Reyes', 'Haddad', 'Petrov', 'Nkemelu'];
