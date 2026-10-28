/* =====================================================================
   BLOXVERSE — +1 AURA EVERY SECOND. A satire of every "+1 something
   every second" game, in fluent brainrot. You get +1 aura every second,
   and clicking farms more (Mewing Lessons make clicks bigger, the Sigma
   Grindset makes the seconds bigger). Spend aura on crates for
   abilities, NPC to Ohio tier (the rarer, the more goated; a double
   levels one up), equip four, then challenge people to 1v1 duels in the
   rings: abilities aim themselves, you dodge by moving, and they hit
   harder the more aura you have. The winner steals 20% of the loser's
   aura and gets a free crate. Nobody around? Duel a bot. The host runs
   every duel (casts, cooldowns, projectiles and damage). Saved.
   ===================================================================== */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    #auTop{position:absolute;left:50%;top:66px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:6px 16px 7px;border-radius:999px;background:rgba(15,23,42,.76);border:2px solid rgba(255,255,255,.14);pointer-events:none;white-space:nowrap;box-shadow:0 4px 0 rgba(0,0,0,.3)}
    #auTop[hidden],#auDuel[hidden]{display:none!important}
    #auTop .n{font:600 24px var(--fh);color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.45);transition:transform .12s}
    #auTop .n.bump{transform:scale(1.12)}
    #auTop small{font:700 12px var(--fb);color:#cbd5e1}
    #auTop .rk{font:600 12px var(--fh);padding:3px 10px;border-radius:999px;color:#0b1020;background:var(--rc,#9ca3af)}
    #auTop .rk.r5,.au-card.r5,.au-ab.r5,#auBox .card.r5,#auBox .got.r5{animation:auRain 1.6s linear infinite}
    @keyframes auRain{0%{--rc:#f43f5e;border-color:#f43f5e}25%{border-color:#facc15}50%{border-color:#22d3ee}75%{border-color:#a855f7}100%{border-color:#f43f5e}}
    .au-pop{position:absolute;transform:translate(-50%,-50%);font:600 20px var(--fh);color:#fde047;-webkit-text-stroke:4px rgba(10,12,18,.65);paint-order:stroke fill;pointer-events:none;animation:auPop 1s ease-out forwards;white-space:nowrap;z-index:3}
    .au-pop.sec{font-size:15px;color:#c4b5fd}
    .au-pop.dmg{font-size:22px;color:#fff}
    .au-pop.heal{color:#86efac}
    @keyframes auPop{0%{opacity:0;margin-top:8px}15%{opacity:1}100%{opacity:0;margin-top:-64px}}
    .xslot.au-farm{min-width:150px;background:linear-gradient(180deg,#7c3aed,#4c1d95);border-color:#c4b5fd;font-size:13px}
    .xslot.au-farm .e{font-size:32px}
    .xslot.au-farm:active{transform:translateY(2px) scale(.97)}
    .xslot.au-ab{border-color:var(--rc)}
    .xslot.au-ab .au-cd{position:absolute;left:0;right:0;top:0;background:rgba(15,23,42,.72);border-radius:15px 15px 0 0;pointer-events:none}
    .xslot.au-ab .au-cdn{position:absolute;inset:0;display:grid;place-items:center;font:600 20px var(--fh);color:#fff;pointer-events:none}
    #auDuel{position:absolute;left:50%;top:62px;transform:translateX(-50%);display:flex;align-items:center;gap:12px;pointer-events:none}
    #auDuel .f{width:230px;padding:7px 10px 8px;border-radius:14px;background:rgba(15,23,42,.82);border:2px solid rgba(255,255,255,.14)}
    #auDuel .f.me{border-color:#60a5fa}
    #auDuel .f b{font:600 14px var(--fh);color:#fff;display:flex;justify-content:space-between;gap:6px}
    #auDuel .f b small{font:700 11px var(--fb);color:#fde68a}
    #auDuel .hp{height:13px;border-radius:7px;background:rgba(0,0,0,.5);margin-top:5px;overflow:hidden;position:relative}
    #auDuel .hp i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(180deg,#4ade80,#16a34a);border-radius:7px;transition:width .15s}
    #auDuel .hp i.lo{background:linear-gradient(180deg,#f87171,#dc2626)}
    #auDuel .hp u{position:absolute;top:0;bottom:0;background:rgba(147,197,253,.85);text-decoration:none;border-radius:7px}
    #auDuel .st{font:700 11px var(--fb);color:#cbd5e1;margin-top:3px;min-height:14px}
    #auDuel .vs{text-align:center;font:600 26px var(--fh);color:#fde047;text-shadow:0 3px 0 rgba(0,0,0,.5);line-height:1}
    #auDuel .vs small{display:block;font:700 13px var(--fb);color:#e2e8f0;margin-top:3px}
    #auChal{position:absolute;left:50%;top:128px;transform:translateX(-50%);padding:12px 16px;border-radius:18px;background:linear-gradient(180deg,#4c1d95,#1e1b4b);border:2px solid #a78bfa;box-shadow:0 10px 30px rgba(0,0,0,.5);pointer-events:auto;text-align:center;font:700 13px var(--fb);color:#e0e7ff;z-index:4;animation:auIn .25s ease-out;max-width:calc(100vw - 32px)}
    #auChal b{display:block;font:600 18px var(--fh);color:#fff;margin-bottom:4px}
    #auChal .row{display:flex;gap:8px;justify-content:center;margin-top:9px}
    @keyframes auIn{from{transform:translate(-50%,-14px);opacity:0}}
    #auBox{position:absolute;inset:0;z-index:6;display:grid;place-items:center;background:radial-gradient(circle,rgba(0,0,0,.5),rgba(0,0,0,.88));pointer-events:auto;cursor:pointer}
    #auBox .in{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%}
    #auBox h3{margin:0;font:600 26px var(--fh);color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.5)}
    #auBox .win{position:relative;width:min(760px,94vw);height:152px;overflow:hidden;border-radius:18px;border:3px solid rgba(255,255,255,.2);background:rgba(15,23,42,.85)}
    #auBox .strip{position:absolute;left:0;top:10px;display:flex;gap:8px;will-change:transform}
    #auBox .card{--rc:#9ca3af;width:120px;height:128px;flex:0 0 120px;border-radius:14px;background:linear-gradient(180deg,#1f2937,#0f172a);border:3px solid var(--rc);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}
    #auBox .card .e{font-size:44px;line-height:1}
    #auBox .card b{font:600 12.5px/1.1 var(--fh);color:#fff;text-align:center;padding:0 4px}
    #auBox .card small{font:700 11px var(--fb);color:var(--rc)}
    #auBox .mark{position:absolute;left:50%;top:0;bottom:0;width:4px;margin-left:-2px;background:#fde047;box-shadow:0 0 14px #fde047;z-index:2}
    #auBox .got{--rc:#9ca3af;width:240px;border-radius:24px;padding:18px;text-align:center;background:linear-gradient(180deg,#1f2937,#0f172a);border:3px solid var(--rc);box-shadow:0 0 60px var(--rc);animation:auGot .45s cubic-bezier(.2,1.6,.5,1)}
    #auBox .got .e{font-size:72px;line-height:1.1}
    #auBox .got b{display:block;font:600 24px var(--fh);color:#fff}
    #auBox .got span{display:block;font:600 16px var(--fh);color:var(--rc)}
    #auBox .got p{margin:8px 0 0;font:700 13px/1.35 var(--fb);color:#cbd5e1}
    #auBox .got .lv{color:#fde68a;font:700 14px var(--fb);margin-top:6px}
    #auBox .tap{color:#e2e8f0;font:600 14px var(--fh);opacity:.8}
    @keyframes auGot{from{transform:scale(.3);opacity:0}}
    #auRes{position:absolute;left:50%;top:36%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;z-index:5;animation:auGot .5s cubic-bezier(.2,1.6,.5,1)}
    #auRes .big{font:600 130px var(--fh);line-height:1;color:#4ade80;text-shadow:0 6px 0 rgba(0,0,0,.45),0 0 40px currentColor}
    #auRes.l .big{color:#f87171}#auRes.d .big{color:#e2e8f0}
    #auRes .sub{font:600 22px var(--fh);color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.5);margin-top:4px}
    #auRes .amt{font:700 18px var(--fb);color:#fde68a;text-shadow:0 2px 0 rgba(0,0,0,.5);margin-top:6px}
    #auGo{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);font:600 92px var(--fh);color:#fde047;text-shadow:0 6px 0 rgba(0,0,0,.45);pointer-events:none;z-index:5;animation:auGot .4s cubic-bezier(.2,1.6,.5,1)}
    #auHurt{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 45%,rgba(220,38,38,.55));opacity:0;transition:opacity .35s}
    .au-card{--rc:#9ca3af;border-color:var(--rc)!important}
    .au-card .rt{font:600 11px var(--fh);color:var(--rc)}
    .au-card .lv{position:absolute;top:6px;left:8px;font:700 11px var(--fb);color:#fde68a}
    .au-card .st{font:700 11px/1.3 var(--fb);color:#cbd5e1}
    .au-card.locked{opacity:.45}
    .au-card.eq{box-shadow:0 0 0 3px var(--rc),0 3px 0 rgba(0,0,0,.35)}
    .au-odds{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin:6px 0 8px}
    .au-odds div{text-align:center;border-radius:9px;padding:4px 2px;background:rgba(0,0,0,.25);border:2px solid var(--rc);font:700 10.5px/1.2 var(--fb);color:#fff}
    .au-odds div.zero{opacity:.3}
    .au-slots{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0 10px}
    .au-slots div{--rc:rgba(255,255,255,.18);border:2px dashed var(--rc);border-radius:12px;padding:6px 4px;text-align:center;font:700 11px var(--fb);color:#e2e8f0;min-height:58px}
    .au-slots div.on{border-style:solid}
    .au-slots .e{font-size:24px;display:block}
    .touchy #auTop{top:58px;transform:translateX(-50%) scale(.86)}
    .touchy #auDuel{top:56px;transform:translateX(-50%) scale(.82)}
    @media (max-width:640px){#auDuel .f{width:140px}#auDuel .st{display:none}#auRes .big{font-size:96px}#auBox .card{width:96px;flex-basis:96px}}`;
  document.head.append(style);

  /* ---------------- numbers ---------------- */
  const short = (n) => { n = Math.floor(n || 0); if (n < 1000) return String(n); const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi']; let i = -1; while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; } return (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)).replace(/\.?0+$/, '') + u[i]; };
  const comma = (n) => Math.floor(n || 0).toLocaleString('en-US');
  // the more aura you have, the harder you hit: +25% for every tenfold (100 aura: +26%, 10K: +75%, 1M: +125%)
  const auraMult = (au) => 1 + 0.25 * Math.log10(1 + Math.max(0, au) / 10);
  const pctOf = (m) => '+' + Math.round((m - 1) * 100) + '%';
  const clickCost = (l) => Math.round(15 * 1.55 ** l);
  const grindCost = (l) => Math.round(30 * 1.6 ** l);
  const MAX_LV = 10, LV_UP = 0.12, STEAL = 0.2, HP = 200, DUEL_T = 75, PRE = 3, RING_H = 12, CHAL_T = 20, MAX_CPS = 14;
  const lvK = (lvl) => 1 + LV_UP * (Math.max(1, lvl) - 1);

  /* ---------------- rarities, ranks, abilities, crates ---------------- */
  const RAR = [['NPC', '#9ca3af'], ['Mid', '#4ade80'], ['Bussin', '#60a5fa'], ['Goated', '#c084fc'], ['Sigma', '#fbbf24'], ['Ohio', '#f43f5e']];
  const rarHex = (r) => new THREE.Color(RAR[r][1]).getHex();
  // aura, title, colour, the size and strength of the glow round you
  const RANKS = [[0, 'NPC', '#9ca3af', 0, 0], [100, 'Mid', '#4ade80', 3.6, 0.35], [1000, 'Rizzler', '#60a5fa', 4.6, 0.45], [10000, 'Sigma', '#c084fc', 5.6, 0.55], [100000, 'Gigachad', '#fbbf24', 6.8, 0.65], [1000000, 'Ohio Final Boss', '#f43f5e', 8.2, 0.75]];
  const rankOf = (au) => { let k = 0; for (let i = 0; i < RANKS.length; i++) if (au >= RANKS[i][0]) k = i; return k; };
  // k: proj (flies at them; cnt, spread, ex: blows up, steal, slow, stun, dot, home) · beam (a moment to aim, then a line) ·
  // aoe (round you) · meteor (lands where they stood) · self (heal, shield, buff) · dash (through them) · melee
  const AB = {
    rizz: { n: 'Mild Rizz', e: '💘', r: 0, k: 'proj', dmg: 9, cd: 1.6, sp: 30, d: 'A weak pickup line, thrown at their face. Honest work.', say: 'hey shawty 😏' },
    side: { n: 'Side Eye', e: '👀', r: 0, k: 'beam', dmg: 11, cd: 2.4, w: 0.3, rng: 30, d: 'One look. That’s it. That’s the attack.', say: '👀' },
    lbozo: { n: 'L Bozo', e: '🇱', txt: 'L', r: 0, k: 'proj', dmg: 12, cd: 2.8, sp: 26, d: 'Throws an actual L at them.', say: 'L + bozo' },
    yap: { n: 'Yap Session', e: '🗣️', r: 1, k: 'proj', dmg: 6, cnt: 3, spread: 0.28, cd: 3, sp: 28, d: 'Three speech bubbles of pure yapping. They can’t get a word in.', say: 'and another thing—' },
    grass: { n: 'Touch Grass', e: '🌱', r: 1, k: 'self', heal: 25, cd: 9, d: 'Goes outside for a sec. Heals 25.', say: 'brb touching grass' },
    fanum: { n: 'Fanum Tax', e: '🍟', r: 1, k: 'proj', dmg: 14, steal: 1, cd: 5, sp: 28, d: 'Takes a bite out of their health and keeps it.', say: 'fanum tax 🍟' },
    mew: { n: 'Mewing Beam', e: '🤫', r: 2, k: 'beam', dmg: 26, cd: 4.5, w: 0.4, rng: 34, d: 'Jawline so sharp it fires a laser.', say: '🤫🧏‍♂️' },
    griddy: { n: 'Griddy Dash', e: '🕺', r: 2, k: 'dash', dmg: 22, cd: 5, rng: 14, d: 'Hits the griddy straight through them.', say: 'hitting the griddy' },
    ratio: { n: 'Ratio', e: '➗', r: 2, k: 'proj', dmg: 18, slow: [0.5, 3], cd: 5, sp: 32, d: 'Ratio + L + you fell off. Slows them by half for 3 seconds.', say: 'ratio' },
    blast: { n: 'Rizz Blast', e: '💥', r: 3, k: 'proj', dmg: 38, ex: 4.5, big: 1, cd: 6, sp: 18, d: 'A giant ball of unspoken rizz that blows up when it lands.', say: 'RIZZ BLAST' },
    glaze: { n: 'Glaze Shield', e: '🍩', r: 3, k: 'self', shield: [45, 6], cd: 11, d: 'Glazes yourself so hard nothing gets through: a 45 shield for 6 seconds.', say: 'im literally so him' },
    npc: { n: 'NPC Mode', e: '🤖', r: 3, k: 'proj', dmg: 12, stun: 1.6, cd: 9, sp: 30, d: 'They forget they’re the main character and freeze for 1.6 seconds.', say: 'you’re an NPC' },
    stare: { n: 'Sigma Stare', e: '🗿', r: 4, k: 'beam', dmg: 60, cd: 8, w: 0.55, rng: 40, d: 'The thousand-yard sigma stare. Do not make eye contact.', say: '🗿' },
    mog: { n: 'Mog Wave', e: '🌊', r: 4, k: 'aoe', dmg: 48, rad: 10, kb: 22, cd: 8, w: 0.3, d: 'Mogs anyone close so hard they fly back.', say: 'get mogged' },
    farm: { n: 'Aura Farm', e: '🔥', r: 4, k: 'self', heal: 40, buff: [1.5, 6], cd: 14, d: 'Farms aura mid-fight: heals 40 and hits 50% harder for 6 seconds.', say: 'aura farming rn' },
    meteor: { n: 'Ohio Meteor', e: '☄️', r: 5, k: 'meteor', dmg: 95, rad: 5, w: 1.2, cd: 10, d: 'Only in Ohio. Lands where they’re standing a moment later.', say: 'only in ohio 💀' },
    skibidi: { n: 'Skibidi Storm', e: '🌪️', r: 5, k: 'proj', dmg: 20, dot: [12, 6], home: 1, big: 1, cd: 11, sp: 16, d: 'A storm of pure brainrot that follows them: 20 on hit, then 72 more over 3 seconds.', say: 'skibidi dop dop' },
    inf: { n: 'Infinite Aura', e: '♾️', r: 5, k: 'self', heal: 60, shield: [40, 6], buff: [2, 6], cd: 18, d: 'Aura so big it has its own weather: heals 60, a 40 shield and double damage for 6 seconds.', say: '+∞ aura' },
  };
  const SLAP = { n: 'Slap', e: '🫲', r: 0, k: 'melee', dmg: 6, cd: 0.6, rng: 5.5, d: 'Unc-style slap. Up close only.', say: '' };
  const abOf = (k) => (k === 'slap' ? SLAP : AB[k]);
  const ABK = Object.keys(AB), BYR = RAR.map((_, r) => ABK.filter((k) => AB[k].r === r));
  const CRATES = [
    { id: 'mid', n: 'Mid Crate', e: '📦', price: 50, odds: [60, 30, 9, 1, 0, 0], c: 0x9ca3af, d: 'It’s mid. What did you expect?' },
    { id: 'rizz', n: 'Rizz Crate', e: '💘', price: 400, odds: [25, 35, 28, 10, 2, 0], c: 0x60a5fa, d: 'Smells like Axe body spray.' },
    { id: 'sigma', n: 'Sigma Crate', e: '🗿', price: 3000, odds: [0, 20, 35, 30, 13, 2], c: 0xfbbf24, d: 'Only opened on a 4am grindset.' },
    { id: 'ohio', n: 'Ohio Crate', e: '☄️', price: 25000, odds: [0, 0, 20, 40, 30, 10], c: 0xf43f5e, d: 'Nobody knows what’s in Ohio. Not even Ohio.' },
  ];
  const FREE_ODDS = CRATES[1].odds; // a W Crate (from winning a duel) rolls like a Rizz Crate
  const rollRar = (odds) => { const t = odds.reduce((a, b) => a + b, 0); let x = Math.random() * t; for (let r = 0; r < odds.length; r++) { x -= odds[r]; if (x < 0) return r; } return 0; };
  const rollAb = (odds) => { const l = BYR[rollRar(odds)]; return l[Math.floor(Math.random() * l.length)]; };

  /* ---------------- the brainrot ---------------- */
  const CLICK_WORDS = ['W', 'sheesh', 'no cap', 'fr fr', 'bussin', 'slay', 'rizz', 'sigma', 'mewing', 'goated', 'based', 'ate', 'locked in', 'main character', 'mogged', 'built different', 'it’s giving', 'lowkey him', 'highkey him', 'real', 'valid', 'cooking', '🗿', '💯', '🔥', '😤', 'W rizz', 'unc approved', 'aura++', 'no shot', 'goes hard'];
  const EVENTS = [['You said "no cap" and meant it.', 15], ['Your mewing streak hit 10 minutes.', 20], ['You walked past a mirror and didn’t check yourself.', 25], ['You left someone on read (respectfully).', 10], ['You understood the assignment.', 30], ['Your playlist ate.', 15], ['You held the door open. Unc behaviour, but W.', 10], ['You didn’t yap for a whole minute.', 25], ['Someone called you built different.', 20], ['You hit the griddy in public.', 15], ['You touched grass (on purpose).', 20], ['Your fit was certified bussin.', 25]];
  const WIN_LINES = ['W + ratio', '{L} got cooked 💀', '{L} lost all their rizz', 'Emotional damage!', '{L} thought they were him', '{W} is him fr fr', 'Skill issue tbh', '{L} has been mogged', '{W} ate and left no crumbs'];
  const LOSE_SUBS = ['Touch grass and run it back 🌱', 'You got mogged. It happens to the best of us (not really)', 'Your aura is in the negatives (spiritually)', 'L + ratio + you fell off', 'Not very sigma of you', 'Bro thought he was him 💀'];
  const BOT_NAMES = ['NPC #4821', 'Mid Mike', 'Rizzless Randy', 'Unc Gary', 'Yapper Yasmin', 'Sigma Steve', 'Ohio Olivia', 'Skibidi Sam', 'Fanum Fan', 'Mewing Max', 'Glazer Greg', 'Delulu Dana'];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const isBot = (id) => typeof id === 'string' && id.startsWith('bot:');

  /* ---------------- the place ---------------- */
  const RINGS = [-45, -15, 15, 45].map((x) => ({ x, z: -62 }));
  const CRATE_AT = CRATES.map((C, i) => ({ x: -34, z: -18 + i * 12 }));
  const STATIONS = [{ x: 34, z: -12, e: '🤫', n: 'Mewing Station', c: 0x7c3aed, k: 'up' }, { x: 34, z: 2, e: '💪', n: 'Grindset Gym', c: 0xdb2777, k: 'up' }, { x: 34, z: 16, e: '🎒', n: 'Ability Locker', c: 0x2563eb, k: 'ab' }];
  const NOMESH = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial()); NOMESH.visible = false;
  const solidBox = (x0, y0, z0, x1, y1, z1) => parts.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2, sx: x1 - x0, sy: y1 - y0, sz: z1 - z0, solid: true, on: true, ox: 0, oy: 0, oz: 0, dx: 0, dy: 0, dz: 0, c: 0, m: NOMESH });
  const sign = (text, x, y, z, size, color) => { const l = label(text, { size: size || 1.6, color }); l.position.set(x, y, z); place.add(l); return l; };

  const AU = {
    id: 'aura', code: 'au', genre: 'Simulator', rank: 0.001, name: '+1 Aura Every Second', emoji: '🗿', max: 12, stat: 'Aura', killY: -30, camDist: 20,
    land: { theme: 'blossom', fence: 'stone' },
    color: 'linear-gradient(135deg,#7c3aed,#db2777 55%,#f59e0b)',
    desc: 'You get +1 aura every second, no cap, and clicking farms way more. Open crates for abilities (NPC, Mid, Bussin, Goated, Sigma and Ohio tier: the rarer, the more goated), then challenge people to 1v1 duels in the rings. Abilities hit harder the more aura you have, and the winner steals 20% of the loser’s aura. Bots duel you when nobody’s around. Fully satirical. Your aura is saved.',
    welcome: 'You get +1 aura every second. Click anywhere to farm more 🗿 Then duel people to steal theirs. No cap.',
    welcomeTouch: 'You get +1 aura every second. Tap anywhere to farm more 🗿 Then duel people to steal theirs. No cap.',
    build() {
      sky('#a78bfa', '#fce7f3');
      slab(0, 0, -18, 128, 128, 0xede9fe, { sy: 2 });
      // the aura shrine: a giant moai with glowing eyes
      part({ x: 0, y: 1, z: -24, sx: 12, sy: 2, sz: 8, c: 0x4b5563 });
      part({ x: 0, y: 7, z: -24, sx: 6.4, sy: 10, sz: 5, c: 0x6b7280 });
      part({ x: 0, y: 10.6, z: -21.4, sx: 6.8, sy: 1.6, sz: 1.2, c: 0x4b5563 });
      part({ x: 0, y: 7.4, z: -21.2, sx: 1.6, sy: 4, sz: 1.2, c: 0x57534e });
      part({ x: 0, y: 3.6, z: -21.5, sx: 4.6, sy: 1.6, sz: 1, c: 0x4b5563 });
      for (const s of [-1, 1]) part({ x: s * 1.6, y: 9.2, z: -21.42, sx: 1.4, sy: 0.6, sz: 0.2, c: 0xc084fc, neon: true });
      this.shrineGlow = fxCard('glow', 0xc084fc, 16, 16, 0, 8, -25, place, (o, m, t) => { m.opacity = 0.35 + 0.12 * Math.sin(t * 2); });
      sign('🗿 THE AURA SHRINE', 0, 15.5, -24, 2.2, '#e9d5ff');
      sign('+1 AURA EVERY SECOND', 0, 19.5, -34, 4.4, '#fde047');
      // signs (very serious)
      for (const [t, x, z, c] of [['NO CAP ZONE 🧢🚫', 44, 30, '#86efac'], ['🚧 OHIO BORDER — DO NOT CROSS', -40, 38, '#fca5a5'], ['AURA FARMING IN PROGRESS 🗿', 14, -16, '#c4b5fd'], ['-1000 AURA FOR YAPPING', -14, 38, '#fde68a']]) { part({ x, y: 1.8, z, sx: 0.4, sy: 3.6, sz: 0.4, c: 0x78716c }); sign(t, x, 4.6, z, 1.2, c); }
      // the crates, on stands
      this.crates = CRATES.map((C, i) => {
        const { x, z } = CRATE_AT[i];
        part({ x, y: 0.7, z, sx: 6, sy: 1.4, sz: 6, c: 0x334155 });
        part({ x, y: 1.45, z, sx: 6.4, sy: 0.15, sz: 6.4, c: C.c, neon: true });
        part({ x, y: 3, z, sx: 3.2, sy: 3, sz: 3.2, c: C.c });
        for (const dy of [1.5, 4.5]) part({ x, y: dy, z, sx: 3.4, sy: 0.25, sz: 3.4, c: 0xffffff, neon: true });
        fxCard('glow', C.c, 7, 7, x, 3.2, z, place, (o, m, t) => { m.opacity = 0.3 + 0.15 * Math.sin(t * 2.5 + i); });
        sign(`${C.e} ${C.n}\n🗿 ${comma(C.price)} aura`, x, 7.4, z, 1.25);
        return { x, z, C };
      });
      // the machines: click power, aura a second, your abilities
      for (const M of STATIONS) {
        part({ x: M.x, y: 2.5, z: M.z, sx: 6, sy: 5, sz: 5, c: M.c });
        part({ x: M.x, y: 5.3, z: M.z, sx: 6.4, sy: 0.6, sz: 5.4, c: 0xffffff, neon: true });
        part({ x: M.x - 3.05, y: 2.8, z: M.z, sx: 0.12, sy: 2.6, sz: 3.6, c: 0x111827 });
        sign(`${M.e} ${M.n}`, M.x, 8, M.z, 1.4);
      }
      // the duel rings: glass boxes you can't get into (you're teleported in) or out of (until it's over)
      sign('⚔️ THE DUEL RINGS', 0, 13, -44, 2.4, '#fca5a5');
      part({ x: 0, y: 0.8, z: -44, sx: 7, sy: 1.6, sz: 3, c: 0x7f1d1d });
      sign('🤖 Duel a bot here', 0, 4.2, -44, 1.1, '#fecaca');
      RINGS.forEach((R, i) => {
        part({ x: R.x, y: 0.05, z: R.z, sx: RING_H * 2, sy: 0.1, sz: RING_H * 2, c: 0x312e81, plain: true });
        for (const [x, z, sx, sz] of [[R.x, R.z - RING_H, RING_H * 2 + 1, 0.6], [R.x, R.z + RING_H, RING_H * 2 + 1, 0.6], [R.x - RING_H, R.z, 0.6, RING_H * 2 + 1], [R.x + RING_H, R.z, 0.6, RING_H * 2 + 1]]) {
          part({ x, y: 3.5, z, sx, sy: 7, sz, c: 0xbfdbfe, alpha: 0.16 });
          part({ x, y: 7.1, z, sx: sx + 0.2, sy: 0.25, sz: sz + 0.2, c: 0xf472b6, neon: true });
          part({ x, y: 0.2, z, sx: sx + 0.2, sy: 0.25, sz: sz + 0.2, c: 0xf472b6, neon: true });
        }
        for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) part({ x: R.x + sx * RING_H, y: 3.7, z: R.z + sz * RING_H, sx: 0.9, sy: 7.4, sz: 0.9, c: 0xa855f7, neon: true });
        const c = new THREE.Mesh(new THREE.RingGeometry(4.6, 5.2, 48), new THREE.MeshBasicMaterial({ color: 0xf472b6, side: THREE.DoubleSide, ...DECAL })); c.rotation.x = -Math.PI / 2; c.position.set(R.x, 0.12, R.z); place.add(c);
        sign(`⚔️ RING ${i + 1}`, R.x, 10, R.z + RING_H, 1.6);
      });
      this.fx = []; this.pjv = new Map(); this.botAv = new Map(); this.fv = new Map(); this.tags = new Map();
    },
    pres() { return { au: 0, br: 0, eq: [], tq: [], th: 0 }; },
    async enter() {
      Object.assign(this, { H: null, lastG: null, gSeen: null, g: null, D: null, q: [], qn: 0, evSeen: null, acc: 0, evT: 40 + Math.random() * 30, clicks: [], duelId: 0, myIdx: -1, cdUntil: {}, move: null, chal: null, chalKey: '', resT: 0, backAt: 0, barHtml: '', sentAt: 0, savedAt: performance.now(), dirty: false, hpSeen: null, frozeBy: false, popAt: 0 });
      const s = await kvGet('au');
      const S = this.S = Object.assign({ au: 0, tot: 0, cl: 0, ps: 0, ab: { rizz: 1, side: 1 }, eq: ['rizz', 'side'], free: 1, w: 0, l: 0, best: 0, op: 0 }, s && typeof s === 'object' ? s : {});
      S.au = Math.max(0, +S.au || 0); S.tot = Math.max(0, +S.tot || 0); S.cl = Math.max(0, S.cl | 0); S.ps = Math.max(0, S.ps | 0); S.free = Math.max(0, S.free | 0);
      const ab = {}; for (const k of Object.keys(S.ab || {})) if (AB[k]) ab[k] = clamp(S.ab[k] | 0, 1, MAX_LV); S.ab = ab;
      S.eq = [...new Set((Array.isArray(S.eq) ? S.eq : []).filter((k) => S.ab[k]))].slice(0, 4);
      const hud = $('#xhud');
      this.top = document.createElement('div'); this.top.id = 'auTop'; hud.append(this.top);
      this.duelEl = document.createElement('div'); this.duelEl.id = 'auDuel'; this.duelEl.hidden = true; hud.append(this.duelEl);
      this.hurtEl = document.createElement('div'); this.hurtEl.id = 'auHurt'; hud.append(this.hurtEl);
      this.drawTop(true); this.drawBar(); this.send(true);
    },
    leave() {
      if (this.S) this.save();
      for (const a of this.botAv.values()) dropAvatar(a);
      this.botAv = new Map(); this.pjv = new Map(); this.fv = new Map(); this.tags = new Map(); this.fx = [];
      P.frozen = false;
    },
    save() { this.dirty = false; this.savedAt = performance.now(); return kvSet('au', this.S); },
    send(now) {
      const S = this.S, t = performance.now();
      if (!S || (!now && t - this.sentAt < 1000)) return;
      this.sentAt = t;
      send({ au: Math.floor(S.au), br: this.bestRar(), eq: S.eq.flatMap((k) => [k, S.ab[k] | 0]), th: hasItem('hp') ? 1 : 0 });
    },
    bestRar() { return Math.max(0, ...Object.keys(this.S.ab).map((k) => AB[k].r)); },
    spawn() {
      const D = this.D;
      if (D && D.ph !== 'end') { const R = RINGS[D.r]; return [R.x, 0.6, R.z + (this.myIdx ? -8 : 8), this.myIdx ? Math.PI : 0]; }
      return [(Math.random() - 0.5) * 10, 0.6, 22 + Math.random() * 4, 0];
    },
    speed() { const D = this.D; return D && D.ph === 'fight' && (D.sl || [])[this.myIdx] > 0 ? 8 : 16; },
    perSec() { return (1 + this.S.ps) * (hasItem('au2') ? 2 : 1); },
    perClick() { return (1 + this.S.cl) * (hasItem('au2') ? 2 : 1); },

    /* ---------------- aura ---------------- */
    gain(n) {
      const S = this.S; S.au += n; S.tot += n; if (S.au > S.best) S.best = S.au;
      this.dirty = true; questMax('aura.farm', Math.floor(S.tot));
    },
    // a click: anywhere on the world, the big button, or F (a few a second at most: autoclickers aren't sigma)
    farm(x, y) {
      const t = performance.now(); this.clicks = this.clicks.filter((c) => t - c < 1000);
      if (this.clicks.length >= MAX_CPS) return;
      this.clicks.push(t);
      const n = this.perClick(); this.gain(n);
      sfx('tap', { vol: 0.5, pitch: 0.9 + Math.random() * 0.4 });
      this.pop(x == null ? innerWidth / 2 + (Math.random() - 0.5) * 120 : x, y == null ? innerHeight - 150 : y, `+${short(n)} aura${Math.random() < 0.4 ? ' · ' + pick(CLICK_WORDS) : ''}`);
      this.drawTop();
    },
    pop(x, y, text, cls) {
      const el = document.createElement('div'); el.className = 'au-pop' + (cls ? ' ' + cls : ''); el.textContent = text;
      el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px'; $('#xhud').append(el);
      setTimeout(() => el.remove(), 1000);
    },
    auraEvent() {
      const [t, n] = pick(EVENTS), v = Math.round(n * Math.max(1, this.perSec()));
      this.gain(v); say(`🗿 ${t} +${comma(v)} aura`, '#e9d5ff'); sfx('magic', { vol: 0.6 });
    },
    drawTop(force) {
      const S = this.S; if (!S || !this.top) return;
      const k = rankOf(S.au), R = RANKS[k], m = auraMult(S.au);
      const html = `<span class="n">🗿 ${comma(S.au)}</span><small>aura · +${short(this.perSec())}/s</small><span class="rk r${k}" style="--rc:${R[2]}">${R[1]}</span><small>⚔️ ${pctOf(m)} dmg</small>`;
      if (force || html !== this.topHtml) { this.topHtml = html; this.top.innerHTML = html; }
      this.top.hidden = !!this.D; // (in a duel, the duel's bars take its place)
    },

    /* ---------------- each frame ---------------- */
    tick(dt) {
      const S = this.S; if (!S) return;
      // +1 aura every second, on real time (a slow computer's frames are capped; it keeps coming in another tab too)
      const now = performance.now(); this.acc += this.lastT ? Math.min(5, (now - this.lastT) / 1000) : dt; this.lastT = now;
      while (this.acc >= 1) {
        this.acc -= 1; const n = this.perSec(); this.gain(n);
        if (this.top && !this.top.hidden) { const r = this.top.getBoundingClientRect(); this.pop(r.left + r.width / 2, r.bottom + 14, `+${short(n)} aura`, 'sec'); const nEl = this.top.querySelector('.n'); if (nEl) { nEl.classList.add('bump'); setTimeout(() => nEl.classList.remove('bump'), 140); } }
      }
      this.evT -= dt; if (this.evT <= 0) { this.evT = 45 + Math.random() * 40; if (!this.D) this.auraEvent(); }
      const g = this.g = roundState(this);
      this.duelTick(g, dt);
      this.drawWorld(g, dt);
      this.drawTop();
      this.drawBar();
      this.send();
      if (this.dirty && performance.now() - this.savedAt > 8000) this.save();
    },

    /* ---------------- the host: challenges, duels, bots ---------------- */
    adopt() {
      const g = this.lastG;
      this.seen = new Map(); this.evSeq = 0;
      for (const p of players()) if (!p.me && Array.isArray(p.pr.tq)) this.seen.set(p.peer, { t: p.pr.t, n: Math.max(0, ...p.pr.tq.map((r) => (Array.isArray(r) ? +r[0] || 0 : 0))) });
      if (g && Array.isArray(g.D)) {
        this.evSeq = Math.max(0, ...(g.ev || []).map((e) => e[0]));
        const D = g.D.map((d) => Object.assign(JSON.parse(JSON.stringify(d)), { pj: [], pe: [], cd: [{}, {}], dot: [null, null], shT: [6, 6], bfT: [6, 6], np: 0 }));
        for (const d of D) if (d.bot) { const p = d.bot.p || [RINGS[d.r].x, RINGS[d.r].z, 0, 0]; Object.assign(d.bot, { x: p[0], z: p[1], yaw: p[2], mv: 0, think: 1, dir: 1, flip: 2, dashT: 0 }); }
        return { gs: 0, left: 0, D, C: Array.isArray(g.C) ? g.C.map((c) => c.slice()) : [], ev: (g.ev || []).slice(), nd: Math.max(0, ...D.map((d) => d.id)), nb: g.nb | 0 };
      }
      return { gs: 0, left: 0, D: [], C: [], ev: [], nd: 0, nb: 0 };
    },
    ev(e) { const H = this.H; this.evSeq = (this.evSeq || 0) + 1; H.ev.push([this.evSeq].concat(e)); if (H.ev.length > 30) H.ev.splice(0, H.ev.length - 30); },
    host(dt) {
      const H = this.H, pl = this.pl = players(), here = new Set(pl.map((p) => p.peer));
      for (const p of pl) {
        if (p.me) continue;
        const seen = this.seen.get(p.peer) || { t: 0, n: 0 };
        if (p.pr.t !== seen.t) { seen.t = p.pr.t; seen.n = 0; }
        for (const r of Array.isArray(p.pr.tq) ? p.pr.tq : []) { if (!Array.isArray(r) || !(r[0] > seen.n)) continue; seen.n = r[0]; this.apply(p.peer, r.slice(1)); }
        this.seen.set(p.peer, seen);
      }
      H.C = H.C.filter((c) => (c[2] -= dt) > 0 && here.has(c[0]) && here.has(c[1]) && !this.busy(c[0]) && !this.busy(c[1]));
      for (const D of H.D.slice()) this.runDuel(D, dt, here);
      const t = performance.now();
      if (t - (this.pubAt || 0) > 100) { this.pubAt = t; hostSend(this, { D: H.D.map((d) => this.pack(d)) }); }
    },
    // what everyone sees of a duel
    pack(D) {
      const r1 = (v) => Math.round(v * 10) / 10;
      const o = { id: D.id, r: D.r, f: D.f, ph: D.ph, left: r1(D.left), hp: D.hp.map(Math.round), mx: D.mx, sh: D.sh.map(Math.round), st: D.st.map(r1), sl: D.sl.map(r1), bf: D.bf, dt: D.dot.map((d) => (d ? 1 : 0)), w: D.w, amt: D.amt, pj: D.pj.map((q) => [q.id, q.k, r1(q.x), r1(q.z), r1(q.vx), r1(q.vz)]) };
      if (D.bot) o.bot = { n: D.bot.n, s: D.bot.s, au: D.bot.au, p: [r1(D.bot.x), r1(D.bot.z), r1(D.bot.yaw), D.bot.mv] };
      return o;
    },
    busy(id) { return this.H.D.some((d) => d.ph !== 'end' && (d.f[0] === id || d.f[1] === id)); },
    freeRing() { const used = new Set(this.H.D.map((d) => d.r)); const free = RINGS.map((_, i) => i).filter((i) => !used.has(i)); return free.length ? free[Math.floor(Math.random() * free.length)] : -1; },
    // a fighter's aura, abilities and levels (yours from your save, everyone else's from what they've told the server)
    info(D, i) {
      const id = D.f[i];
      if (isBot(id)) return { au: D.bot.au, lv: Object.fromEntries(D.bot.eq), th: 0 };
      if (id === myPeer()) { const S = this.S; return { au: S.au, lv: Object.fromEntries(S.eq.map((k) => [k, S.ab[k]])), th: hasItem('hp') ? 1 : 0 }; }
      const p = (this.pl || players()).find((q) => q.peer === id), pr = (p && p.pr) || {}, lv = {}, eq = Array.isArray(pr.eq) ? pr.eq : [];
      for (let j = 0; j + 1 < eq.length && j < 8; j += 2) if (AB[eq[j]]) lv[eq[j]] = clamp(eq[j + 1] | 0, 1, MAX_LV);
      return { au: Math.max(0, +pr.au || 0), lv, th: pr.th ? 1 : 0 };
    },
    posF(D, i) {
      const id = D.f[i];
      if (isBot(id)) return { x: D.bot.x, z: D.bot.z };
      const p = (this.pl || players()).find((q) => q.peer === id);
      return p ? { x: p.x, z: p.z } : null;
    },
    nameF(D, i) { return isBot(D.f[i]) ? D.bot.n : nameOf(D.f[i]); },
    apply(peer, req) {
      const H = this.H, [op, ...a] = req, pl = this.pl || players(), here = (id) => pl.some((p) => p.peer === id);
      if (op === 'ch') { // a challenge
        const to = a[0];
        if (typeof to !== 'string' || to === peer || !here(to) || this.busy(peer) || this.busy(to)) return;
        H.C = H.C.filter((c) => c[0] !== peer); H.C.push([peer, to, CHAL_T]);
      } else if (op === 'cx') H.C = H.C.filter((c) => c[0] !== peer);
      else if (op === 'dec') { const c = H.C.find((x) => x[0] === a[0] && x[1] === peer); if (c) { H.C = H.C.filter((x) => x !== c); this.ev(['dec', c[0], peer]); } }
      else if (op === 'acc') {
        const c = H.C.find((x) => x[0] === a[0] && x[1] === peer);
        if (!c || this.busy(c[0]) || this.busy(peer)) return;
        const r = this.freeRing(); if (r < 0) { this.ev(['full', peer, c[0]]); return; }
        H.C = H.C.filter((x) => x[0] !== c[0] && x[1] !== c[0] && x[0] !== peer && x[1] !== peer);
        this.startDuel(c[0], peer, r);
      } else if (op === 'bot') {
        if (this.busy(peer)) return;
        const r = this.freeRing(); if (r < 0) { this.ev(['full', peer]); return; }
        H.C = H.C.filter((x) => x[0] !== peer && x[1] !== peer);
        this.startDuel(peer, null, r);
      } else if (op === 'cast') {
        const D = H.D.find((d) => d.id === a[0]); if (!D || D.ph !== 'fight') return;
        const i = D.f.indexOf(peer); if (i < 0) return;
        this.cast(D, i, String(a[1]));
      } else if (op === 'ff') { const D = H.D.find((d) => d.id === a[0]); if (D && D.ph !== 'end') { const i = D.f.indexOf(peer); if (i >= 0) this.end(D, 1 - i, 'ff'); } }
    },
    startDuel(a, b, r) {
      const H = this.H, D = { id: ++H.nd, r, f: [a, b], ph: 'pre', left: PRE, hp: [HP, HP], mx: [HP, HP], sh: [0, 0], shT: [0, 0], st: [0, 0], sl: [0, 0], bf: [1, 1], bfT: [0, 0], dot: [null, null], cd: [{}, {}], pj: [], pe: [], w: -1, amt: 0, np: 0 };
      if (!b) { // a bot about as strong as you are
        H.nb = (H.nb | 0) + 1;
        const me = this.info(D, 0), R = RINGS[r], best = Math.max(0, ...Object.keys(me.lv).map((k) => AB[k].r));
        const pool = ABK.filter((k) => AB[k].r <= Math.min(5, best + (Math.random() < 0.3 ? 1 : 0))), eq = [];
        while (eq.length < 4 && pool.length) eq.push([pool.splice(Math.floor(Math.random() * pool.length), 1)[0], 1 + Math.floor(Math.random() * 3)]);
        D.f[1] = 'bot:' + H.nb;
        D.bot = { n: BOT_NAMES[H.nb % BOT_NAMES.length], s: Math.floor(Math.random() * 1e6), au: Math.round(me.au * (0.55 + Math.random() * 0.45)) + 30, eq, x: R.x, z: R.z - 8, yaw: Math.PI, mv: 0, think: 1.2, dir: 1, flip: 2, dashT: 0 };
      }
      for (const i of [0, 1]) { const th = this.info(D, i).th; D.hp[i] = D.mx[i] = HP + (th ? 25 : 0); }
      H.D.push(D);
      this.ev(['st', D.id, D.f[0], D.f[1]]);
    },
    cast(D, i, k) {
      const A = abOf(k); if (!A) return;
      const inf = this.info(D, i), lvl = k === 'slap' ? 1 : inf.lv[k]; if (!lvl) return; // (not one of theirs)
      const T = performance.now() / 1000, cd = D.cd[i];
      if (D.st[i] > 0 || (cd[k] || 0) > T + 0.15) return; // stunned, or still cooling down
      cd[k] = T + A.cd;
      const me = this.posF(D, i), tg = this.posF(D, 1 - i); if (!me || !tg) return;
      const dmg = A.dmg ? A.dmg * lvK(lvl) * auraMult(inf.au) * D.bf[i] : 0, L = lvK(lvl);
      this.ev(['c', D.id, i, k]);
      const dx = tg.x - me.x, dz = tg.z - me.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
      if (A.k === 'proj') {
        const n = A.cnt || 1;
        for (let j = 0; j < n; j++) {
          const a = (j - (n - 1) / 2) * (A.spread || 0), c = Math.cos(a), s = Math.sin(a), vx = (ux * c - uz * s) * A.sp, vz = (ux * s + uz * c) * A.sp;
          D.pj.push({ id: ++D.np, k, o: i, x: me.x + ux * 1.2, z: me.z + uz * 1.2, vx, vz, life: 42 / A.sp, dmg });
        }
      } else if (A.k === 'beam') { D.pe.push({ t: A.w, kind: 'beam', o: i, k, x0: me.x, z0: me.z, ux, uz, dmg }); this.ev(['b0', D.id, i, k, +me.x.toFixed(1), +me.z.toFixed(1), +(me.x + ux * A.rng).toFixed(1), +(me.z + uz * A.rng).toFixed(1), A.w]); }
      else if (A.k === 'aoe') D.pe.push({ t: A.w, kind: 'aoe', o: i, k, dmg });
      else if (A.k === 'meteor') { D.pe.push({ t: A.w, kind: 'meteor', o: i, k, x1: tg.x, z1: tg.z, dmg }); this.ev(['m0', D.id, k, +tg.x.toFixed(1), +tg.z.toFixed(1), A.w]); }
      else if (A.k === 'dash') { D.pe.push({ t: 0.32, kind: 'dash', o: i, k, dmg }); this.ev(['ds', D.id, i]); if (isBot(D.f[i])) D.bot.dashT = 0.3; }
      else if (A.k === 'melee') { if (d < A.rng + 1) this.hit(D, 1 - i, dmg, k, i); }
      else if (A.k === 'self') {
        if (A.heal) D.hp[i] = Math.min(D.mx[i], D.hp[i] + A.heal * L);
        if (A.shield) { D.sh[i] = Math.max(D.sh[i], A.shield[0] * L); D.shT[i] = A.shield[1]; }
        if (A.buff) { D.bf[i] = A.buff[0]; D.bfT[i] = A.buff[1]; }
        this.ev(['sf', D.id, i, k, Math.round(A.heal ? A.heal * L : 0)]);
      }
    },
    hit(D, t, dmg, k, src) {
      if (D.ph !== 'fight' || !(dmg > 0)) return;
      dmg = Math.round(dmg);
      let left = dmg; if (D.sh[t] > 0) { const a = Math.min(D.sh[t], left); D.sh[t] -= a; left -= a; }
      D.hp[t] = Math.max(0, D.hp[t] - left);
      const A = abOf(k) || SLAP;
      if (A.steal) D.hp[src] = Math.min(D.mx[src], D.hp[src] + Math.round(dmg * A.steal));
      if (A.slow) D.sl[t] = Math.max(D.sl[t], A.slow[1]);
      if (A.stun) D.st[t] = Math.max(D.st[t], A.stun);
      if (A.dot) D.dot[t] = { n: A.dot[1], per: Math.round(A.dot[0] * dmg / A.dmg), at: 0.5, src, k };
      if (A.kb && isBot(D.f[t])) { const s = this.posF(D, src), b = D.bot, R = RINGS[D.r]; if (s) { const dx = b.x - s.x, dz = b.z - s.z, l = Math.hypot(dx, dz) || 1; b.x = clamp(b.x + dx / l * A.kb * 0.35, R.x - RING_H + 1.5, R.x + RING_H - 1.5); b.z = clamp(b.z + dz / l * A.kb * 0.35, R.z - RING_H + 1.5, R.z + RING_H - 1.5); } }
      this.ev(['h', D.id, t, dmg, k, A.kb || 0, src]);
      if (D.hp[t] <= 0) this.end(D, src, 'ko');
    },
    runDuel(D, dt, here) {
      const H = this.H;
      if (D.ph === 'end') { D.left -= dt; if (D.left <= 0) H.D.splice(H.D.indexOf(D), 1); return; }
      // someone left the server: the other one wins (rage quit = L)
      for (const i of [0, 1]) if (!isBot(D.f[i]) && !here.has(D.f[i])) { this.end(D, 1 - i, 'left'); return; }
      D.left -= dt;
      if (D.ph === 'pre') { if (D.left <= 0) { D.ph = 'fight'; D.left = DUEL_T; this.ev(['go', D.id]); } return; }
      for (const i of [0, 1]) {
        D.st[i] = Math.max(0, D.st[i] - dt); D.sl[i] = Math.max(0, D.sl[i] - dt);
        if (D.shT[i] > 0) { D.shT[i] -= dt; if (D.shT[i] <= 0) D.sh[i] = 0; }
        if (D.bfT[i] > 0) { D.bfT[i] -= dt; if (D.bfT[i] <= 0) D.bf[i] = 1; }
        const o = D.dot[i]; if (o) { o.at -= dt; if (o.at <= 0) { o.at += 0.5; o.n--; if (o.n <= 0) D.dot[i] = null; const k = o.k; D.dot[i] = o.n > 0 ? o : null; this.hit(D, i, o.per, k === 'skibidi' ? 'storm' : k, o.src); if (D.ph !== 'fight') return; } }
      }
      // the projectiles
      const R = RINGS[D.r];
      for (let j = D.pj.length - 1; j >= 0; j--) {
        const q = D.pj[j], A = AB[q.k], tg = this.posF(D, 1 - q.o);
        if (tg) { const dx = tg.x - q.x, dz = tg.z - q.z, l = Math.hypot(dx, dz) || 1, k = Math.min(1, dt * (A.home ? 2.2 : 1.3)); q.vx += (dx / l * A.sp - q.vx) * k; q.vz += (dz / l * A.sp - q.vz) * k; }
        q.x += q.vx * dt; q.z += q.vz * dt; q.life -= dt;
        const hitR = A.big ? 2.4 : 1.8, out = q.life <= 0 || Math.abs(q.x - R.x) > RING_H - 0.4 || Math.abs(q.z - R.z) > RING_H - 0.4;
        if (tg && Math.hypot(tg.x - q.x, tg.z - q.z) < hitR) { D.pj.splice(j, 1); this.hit(D, 1 - q.o, q.dmg, q.k, q.o); if (A.ex) this.ev(['x', D.id, +q.x.toFixed(1), +q.z.toFixed(1), A.ex]); if (D.ph !== 'fight') return; continue; }
        if (out) { D.pj.splice(j, 1); if (A.ex) { this.ev(['x', D.id, +q.x.toFixed(1), +q.z.toFixed(1), A.ex]); if (tg && Math.hypot(tg.x - q.x, tg.z - q.z) < A.ex) { this.hit(D, 1 - q.o, q.dmg * 0.7, q.k, q.o); if (D.ph !== 'fight') return; } } }
      }
      // beams, waves, meteors and dashes landing
      for (let j = D.pe.length - 1; j >= 0; j--) {
        const e = D.pe[j]; e.t -= dt; if (e.t > 0) continue;
        D.pe.splice(j, 1);
        const A = AB[e.k], tg = this.posF(D, 1 - e.o), me = this.posF(D, e.o); if (!tg || !me) continue;
        if (e.kind === 'beam') {
          const px = tg.x - e.x0, pz = tg.z - e.z0, along = clamp(px * e.ux + pz * e.uz, 0, A.rng), dx = px - e.ux * along, dz = pz - e.uz * along;
          this.ev(['b1', D.id, e.o, e.k, +e.x0.toFixed(1), +e.z0.toFixed(1), +(e.x0 + e.ux * A.rng).toFixed(1), +(e.z0 + e.uz * A.rng).toFixed(1)]);
          if (Math.hypot(dx, dz) < 2.5) this.hit(D, 1 - e.o, e.dmg, e.k, e.o);
        } else if (e.kind === 'aoe') { this.ev(['ao', D.id, e.o, e.k, +me.x.toFixed(1), +me.z.toFixed(1), A.rad]); if (Math.hypot(tg.x - me.x, tg.z - me.z) < A.rad) this.hit(D, 1 - e.o, e.dmg, e.k, e.o); }
        else if (e.kind === 'meteor') { this.ev(['m1', D.id, e.k, +e.x1.toFixed(1), +e.z1.toFixed(1), A.rad]); if (Math.hypot(tg.x - e.x1, tg.z - e.z1) < A.rad) this.hit(D, 1 - e.o, e.dmg, e.k, e.o); }
        else if (e.kind === 'dash') { if (Math.hypot(tg.x - me.x, tg.z - me.z) < 4.4) this.hit(D, 1 - e.o, e.dmg, e.k, e.o); }
        if (D.ph !== 'fight') return;
      }
      if (D.bot) this.botStep(D, dt);
      if (D.left <= 0) { const a = D.hp[0] / D.mx[0], b = D.hp[1] / D.mx[1]; this.end(D, a > b + 1e-6 ? 0 : b > a + 1e-6 ? 1 : -1, 'time'); }
    },
    botStep(D, dt) {
      const b = D.bot, tg = this.posF(D, 0), R = RINGS[D.r]; if (!tg) return;
      const dx = tg.x - b.x, dz = tg.z - b.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
      b.yaw = Math.atan2(-dx, -dz);
      let mx = 0, mz = 0;
      if (D.st[1] <= 0) {
        if (b.dashT > 0) { b.dashT -= dt; mx = ux * 42; mz = uz * 42; }
        else {
          b.flip -= dt; if (b.flip <= 0) { b.flip = 1.2 + Math.random() * 2; b.dir = -b.dir; }
          const radial = d > 10.5 ? 1 : d < 6.5 ? -1 : 0, sp = 10 * (D.sl[1] > 0 ? 0.5 : 1);
          mx = (ux * radial - uz * b.dir * 0.6) * sp; mz = (uz * radial + ux * b.dir * 0.6) * sp;
        }
      }
      b.x = clamp(b.x + mx * dt, R.x - RING_H + 1.5, R.x + RING_H - 1.5); b.z = clamp(b.z + mz * dt, R.z - RING_H + 1.5, R.z + RING_H - 1.5);
      b.mv = Math.hypot(mx, mz) > 0.5 ? 1 : 0;
      b.think -= dt;
      if (b.think <= 0 && D.st[1] <= 0) {
        b.think = 0.55 + Math.random() * 0.9;
        const T = performance.now() / 1000, cd = D.cd[1], ready = b.eq.filter(([k]) => (cd[k] || 0) <= T && !(AB[k].k === 'self' && AB[k].heal && !AB[k].buff && D.hp[1] > D.mx[1] * 0.7));
        if (d < 5.5 && (cd.slap || 0) <= T && Math.random() < 0.6) this.cast(D, 1, 'slap');
        else if (ready.length) this.cast(D, 1, pick(ready)[0]);
      }
    },
    end(D, w, why) {
      if (D.ph === 'end') return;
      D.ph = 'end'; D.left = 4.5; D.w = w; D.pj = []; D.pe = [];
      const l = 1 - w, amt = w < 0 ? 0 : Math.floor(this.info(D, l).au * STEAL);
      D.amt = amt;
      this.ev(['end', D.id, w, D.f[0], D.f[1], amt, this.nameF(D, 0), this.nameF(D, 1), why]);
    },
    ask(op, ...args) {
      if (iAmHost() && this.H) return this.apply(myPeer(), [op, ...args]);
      this.q.push([++this.qn, op, ...args]); if (this.q.length > 12) this.q.shift();
      send({ tq: this.q.slice() });
    },

    /* ---------------- you, in a duel ---------------- */
    duelTick(g, dt) {
      const mine = myPeer(), all = g && Array.isArray(g.D) ? g.D : [];
      this.events(g);
      const D = all.find((d) => d.f[0] === mine || d.f[1] === mine) || null;
      if (D && D.id !== this.duelId && D.ph !== 'end') { // a new duel: into the ring
        this.duelId = D.id; this.myIdx = D.f[0] === mine ? 0 : 1; this.cdUntil = {}; this.hpSeen = null; this.chal = null; this.drawChal();
        const R = RINGS[D.r]; this.tpTo(R.x, R.z + (this.myIdx ? -8 : 8), this.myIdx ? Math.PI : 0);
        closePanel(); sfx('horn'); this.bigText(PRE >= 1 ? '3' : 'FIGHT');
        this.countSeen = 3;
      }
      this.D = D && D.id === this.duelId ? D : null;
      const Dn = this.D;
      if (Dn && Dn.ph === 'pre') { const c = Math.ceil(Dn.left); if (c !== this.countSeen && c > 0) { this.countSeen = c; this.bigText(String(c)); sfx('count'); } }
      // stunned: you can't move
      const stun = !!(Dn && Dn.ph === 'fight' && (Dn.st || [])[this.myIdx] > 0);
      if (stun !== this.frozeBy) { this.frozeBy = stun; P.frozen = stun; }
      // a dash or a knockback carries you (inside the ring)
      if (this.move) {
        const m = this.move, k = Math.min(dt, m.t); m.t -= dt;
        if (Dn) { const R = RINGS[Dn.r]; P.x = clamp(P.x + m.vx * k, R.x - RING_H + 1.2, R.x + RING_H - 1.2); P.z = clamp(P.z + m.vz * k, R.z - RING_H + 1.2, R.z + RING_H - 1.2); }
        if (m.t <= 0 || !Dn) this.move = null;
      }
      // after a duel: back to the plaza
      if (this.backAt && performance.now() > this.backAt) { this.backAt = 0; this.tpTo((Math.random() - 0.5) * 10, 22, 0); this.drawBar(); }
      // a challenge for you
      const C = g && Array.isArray(g.C) ? g.C.find((c) => c[1] === mine && c[2] > 0) : null;
      const key = C ? C[0] : '';
      if (key !== this.chalKey) { this.chalKey = key; this.chal = C ? C[0] : null; this.drawChal(); if (C) sfx('alarm', { vol: 0.5 }); }
      this.drawDuel();
    },
    tpTo(x, z, yaw) {
      P.x = x; P.y = 0.6; P.z = z; P.vx = P.vy = P.vz = 0; P.yaw = yaw; cam.yaw = yaw;
      sfx('teleport'); puffAt(x, 2.4, z, [0xc084fc, 0xffffff], 10);
    },
    useSlot(i) { // i: -1 the slap, 0–3 your abilities
      const D = this.D; if (!D || D.ph !== 'fight') return;
      const k = i < 0 ? 'slap' : this.S.eq[i]; if (!k) return;
      const A = abOf(k), T = performance.now() / 1000;
      if ((this.cdUntil[k] || 0) > T) { sfx('error', { vol: 0.4 }); return; }
      if ((D.st || [])[this.myIdx] > 0) { sfx('error'); toast('You’re in NPC mode. Can’t move, can’t think.', '#fca5a5'); return; }
      this.cdUntil[k] = T + A.cd;
      this.ask('cast', D.id, k);
    },
    challenge(peer) {
      if (this.D) return;
      this.ask('ch', peer); this.outChal = peer;
      toast(`⚔️ Challenged ${nameOf(peer)}. They have ${CHAL_T}s to accept (or be a coward)`, '#c4b5fd'); sfx('select');
    },
    duelBot() { if (this.D) return; this.ask('bot'); toast('🤖 Finding you a bot to cook…', '#c4b5fd'); sfx('select'); closePanel(); },
    drawChal() {
      let el = $('#auChal');
      if (!this.chal || this.D) { if (el) el.remove(); return; }
      if (!el) { el = document.createElement('div'); el.id = 'auChal'; $('#xhud').append(el); el.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; const from = this.chal; if (!from) return; this.ask(b.dataset.a === 'y' ? 'acc' : 'dec', from); this.chal = null; el.remove(); sfx(b.dataset.a === 'y' ? 'go' : 'close'); }; }
      const p = (players().find((q) => q.peer === this.chal) || {}).pr || {}, k = rankOf(+p.au || 0);
      el.innerHTML = `<b>⚔️ ${esc(nameOf(this.chal))} wants to duel you</b>🗿 ${comma(p.au)} aura · ${RANKS[k][1]} · ⚔️ ${pctOf(auraMult(+p.au || 0))} dmg<br><small>Lose and they steal 20% of your aura. Win and you steal 20% of theirs.</small><div class="row"><button class="xp-btn" data-a="y">✅ Bet (accept)</button><button class="xp-btn red" data-a="n">❌ Nah (decline)</button></div>`;
    },
    bigText(t) { const old = $('#auGo'); if (old) old.remove(); const el = document.createElement('div'); el.id = 'auGo'; el.textContent = t; $('#xhud').append(el); setTimeout(() => el.remove(), 800); },
    drawDuel() {
      const D = this.D, el = this.duelEl; if (!el) return;
      if (!D) { if (!el.hidden) el.hidden = true; return; }
      el.hidden = false;
      const side = (i) => {
        const id = D.f[i], me = i === this.myIdx, au = isBot(id) ? (D.bot ? D.bot.au : 0) : me ? this.S.au : +(((players().find((q) => q.peer === id) || {}).pr || {}).au || 0);
        const hp = (D.hp || [0, 0])[i], mx = (D.mx || [HP, HP])[i], sh = (D.sh || [0, 0])[i], f = clamp(hp / mx, 0, 1);
        const tags = [(D.st || [])[i] > 0 ? '🤖 NPC mode' : '', (D.sl || [])[i] > 0 ? '🐌 ratio’d' : '', (D.bf || [])[i] > 1 ? `🔥 ×${D.bf[i]}` : '', sh > 0 ? `🍩 ${Math.round(sh)}` : '', (D.dt || D.dot || [])[i] ? '🌪️' : ''].filter(Boolean).join(' · ');
        return `<div class="f ${me ? 'me' : ''}"><b><span>${esc(isBot(id) ? '🤖 ' + (D.bot ? D.bot.n : 'Bot') : me ? 'You' : nameOf(id))}</span><small>🗿 ${short(au)} · ${pctOf(auraMult(au))}</small></b><div class="hp"><i class="${f < 0.3 ? 'lo' : ''}" style="width:${(f * 100).toFixed(1)}%"></i>${sh > 0 ? `<u style="left:${(f * 100).toFixed(1)}%;width:${Math.min(100 - f * 100, sh / mx * 100).toFixed(1)}%"></u>` : ''}</div><div class="st">${Math.ceil(hp)} / ${mx}${tags ? ' · ' + tags : ''}</div></div>`;
      };
      const me = this.myIdx, html = side(me) + `<div class="vs">VS<small>${D.ph === 'pre' ? 'get ready' : D.ph === 'end' ? 'GG' : '⏱️ ' + Math.ceil(D.left) + 's'}</small></div>` + side(1 - me);
      if (html !== this.duelHtml) { this.duelHtml = html; el.innerHTML = html; }
      // you got hit
      const hp = (D.hp || [])[me];
      if (this.hpSeen != null && hp < this.hpSeen) { this.hurtEl.style.opacity = 1; setTimeout(() => { this.hurtEl.style.opacity = 0; }, 160); }
      this.hpSeen = hp;
    },

    /* ---------------- what happened (the host's events) ---------------- */
    events(g) {
      const ev = g && Array.isArray(g.ev) ? g.ev : [], top = ev.length ? ev[ev.length - 1][0] : 0;
      if (this.evSeen == null || top < this.evSeen - 100) { this.evSeen = top; return; } // (what happened before you got here doesn't replay)
      for (const e of ev) if (e[0] > this.evSeen) { try { this.onEv(e, g); } catch (x) { console.warn('aura ev', x); } }
      this.evSeen = Math.max(this.evSeen, top);
    },
    duelOf(g, id) { return g && Array.isArray(g.D) ? g.D.find((d) => d.id === id) : null; },
    onEv(e, g) {
      const [, type] = e, mine = myPeer();
      if (type === 'dec') { if (e[2] === mine) { toast(`${nameOf(e[3])} declined. Fear. 😨`, '#fca5a5'); sfx('lose', { vol: 0.5 }); } return; }
      if (type === 'full') { if (e[2] === mine || e[3] === mine) toast('All 4 rings are busy. Wait a sec (touch grass meanwhile)', '#fde68a'); return; }
      if (type === 'st') { if (e[3] !== mine && e[4] !== mine) say(`⚔️ ${isBot(e[4]) ? nameOf(e[3]) + ' is fighting a bot' : nameOf(e[3]) + ' vs ' + nameOf(e[4])}`, '#c4b5fd'); return; }
      const D = this.duelOf(g, e[2]);
      if (type === 'end') { this.onEnd(e); return; }
      if (!D) return;
      if (type === 'go') { if (D.id === this.duelId) { this.bigText('FIGHT!'); sfx('go'); } return; }
      const pos = (i) => this.fPos(D, i);
      if (type === 'c') {
        const A = abOf(e[4]), p = pos(e[3]); if (!A || !p) return;
        if (A.say) this.shout(p, A.say, RAR[A.r][1]);
        const snd = { proj: 'whoosh', beam: 'zap', aoe: 'powerup', meteor: 'whoosh', self: A.shield ? 'shield' : A.heal && !A.buff ? 'heal' : 'powerup', dash: 'whoosh', melee: 'swing' }[A.k];
        sfx3(snd, p.x, p.z, 90, { vol: 0.7 });
      } else if (type === 'b0') { this.line(e[5], e[6], e[7], e[8], 0xff4d6d, 0.12, e[9], 0.35); }
      else if (type === 'b1') { const A = AB[e[4]]; this.line(e[5], e[6], e[7], e[8], rarHex(A.r), A.r >= 4 ? 0.7 : 0.45, 0.25, 0.95); sfx3('laser', e[5], e[6], 90); }
      else if (type === 'ao') { this.wave(e[5], e[6], e[7], rarHex(AB[e[4]].r)); sfx3('boom', e[5], e[6], 90); }
      else if (type === 'm0') { this.meteor(e[4], e[5], e[6]); }
      else if (type === 'm1') { this.wave(e[4], e[5], e[6], 0xf97316); puffAt(e[4], 2, e[5], [0xf97316, 0xfde047, 0x444444], 24); sfx3('explode', e[4], e[5], 120); }
      else if (type === 'x') { this.wave(e[3], e[4], e[5], 0xc084fc); puffAt(e[3], 2.4, e[4], [0xc084fc, 0xf9a8d4], 16); sfx3('explode', e[3], e[4], 100, { vol: 0.7 }); }
      else if (type === 'sf') {
        const A = AB[e[4]], p = pos(e[3]); if (!p) return;
        puffAt(p.x, p.y + 3, p.z, A.heal && !A.buff ? [0x86efac, 0xffffff] : A.shield && !A.heal ? [0x93c5fd, 0xffffff] : [0xf97316, 0xfde047], 14);
        if (e[5] > 0) { const s = this.screen(p.x, p.y + 6, p.z); if (s) this.pop(s[0], s[1], `+${e[5]} ❤️`, 'heal'); }
      } else if (type === 'ds') {
        if (D.id === this.duelId && e[3] === this.myIdx) { const o = pos(1 - this.myIdx); if (o) { const dx = o.x - P.x, dz = o.z - P.z, l = Math.hypot(dx, dz) || 1, d = Math.min(14, l + 2.5); this.move = { t: 0.3, vx: dx / l * d / 0.3, vz: dz / l * d / 0.3 }; } }
      } else if (type === 'h') {
        const t = e[3], p = pos(t), A = abOf(e[5]) || (e[5] === 'storm' ? AB.skibidi : SLAP); if (!p) return;
        const s = this.screen(p.x, p.y + 6.2, p.z); if (s) this.pop(s[0] + (Math.random() - 0.5) * 40, s[1], `-${e[4]}`, 'dmg');
        puffAt(p.x, p.y + 2.8, p.z, [rarHex(A.r), 0xffffff], 8);
        sfx3(e[5] === 'slap' ? 'punch' : 'hit', p.x, p.z, 80, { vol: 0.8 });
        if (D.id === this.duelId && t === this.myIdx && e[6] > 0) { const o = pos(e[7]); if (o) { const dx = P.x - o.x, dz = P.z - o.z, l = Math.hypot(dx, dz) || 1; this.move = { t: 0.25, vx: dx / l * e[6], vz: dz / l * e[6] }; } }
      }
    },
    onEnd(e) {
      const [, , id, w, a, b, amt, na, nb, why] = e, mine = myPeer(), idx = a === mine ? 0 : b === mine ? 1 : -1, S = this.S;
      const W = w >= 0 ? [na, nb][w] : '', L = w >= 0 ? [na, nb][1 - w] : '';
      if (idx < 0) { if (w >= 0) say(`⚔️ ${pick(WIN_LINES).replace('{W}', W).replace('{L}', L)} (${W} stole ${comma(amt)} aura${why === 'left' ? ', they rage quit' : ''})`, '#c4b5fd'); return; }
      if (this.endSeen === id) return; this.endSeen = id;
      let cls, big, sub, amtTxt;
      if (w < 0) { cls = 'd'; big = 'DRAW'; sub = 'Nobody cooked. Nobody got cooked.'; amtTxt = 'No aura changes hands'; sfx('draw'); }
      else if (w === idx) {
        S.au += amt; S.tot += amt; if (S.au > S.best) S.best = S.au; S.w++; S.free++; this.dirty = true;
        quest('aura.win', 1); questMax('aura.farm', Math.floor(S.tot));
        cls = 'w'; big = 'W'; sub = why === 'left' || why === 'ff' ? `${L} rage quit. Still counts.` : pick(WIN_LINES).replace('{W}', 'You').replace('{L}', L);
        amtTxt = `+${comma(amt)} aura (fanum taxed from ${L}) · 🎁 +1 W Crate`; sfx('win'); earn(5, 'won a duel');
      } else {
        const lost = Math.min(S.au, amt); S.au -= lost; S.l++; this.dirty = true;
        cls = 'l'; big = 'L'; sub = pick(LOSE_SUBS); amtTxt = `-${comma(lost)} aura (${W} took it)`; sfx('lose');
      }
      const old = $('#auRes'); if (old) old.remove();
      const el = document.createElement('div'); el.id = 'auRes'; el.className = cls; el.innerHTML = `<div class="big">${big}</div><div class="sub">${esc(sub)}</div><div class="amt">${esc(amtTxt)}</div>`;
      $('#xhud').append(el); setTimeout(() => el.remove(), 3600);
      this.backAt = performance.now() + 3400; this.move = null; this.save(); this.send(true);
    },

    /* ---------------- drawing ---------------- */
    fPos(D, i) {
      const id = D.f[i];
      if (isBot(id)) { const a = this.botAv.get(D.id); return a ? a.g.position : null; }
      if (id === myPeer()) return new THREE.Vector3(P.x, P.y, P.z);
      const a = Net.avatars.get(id); return a ? a.g.position : null;
    },
    screen(x, y, z) { const v = new THREE.Vector3(x, y, z).project(camera); if (v.z > 1) return null; return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; },
    shout(p, text, color) { const l = label(text, { size: 1.1, color: color || '#fff', bg: 'rgba(15,23,42,.78)' }); l.position.set(p.x, p.y + 8, p.z); place.add(l); this.fx.push({ o: l, life: 1.4, max: 1.4, up: 1.2, dispose: true }); },
    line(x0, z0, x1, z1, c, w, life, op) {
      const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz) || 1;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, L), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.position.set((x0 + x1) / 2, 2.8, (z0 + z1) / 2); m.rotation.y = Math.atan2(dx, dz); m.userData.ownGeo = true; place.add(m);
      this.fx.push({ o: m, life, max: life, fade: op, dispose: true });
    },
    wave(x, z, r, c) {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false, ...DECAL }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, 0.3, z); m.userData.ownGeo = true; place.add(m);
      this.fx.push({ o: m, life: 0.5, max: 0.5, grow: r, fade: 0.85, dispose: true });
    },
    meteor(x, z, w) {
      const warn = new THREE.Mesh(new THREE.CircleGeometry(AB.meteor.rad, 40), new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.3, depthWrite: false, ...DECAL }));
      warn.rotation.x = -Math.PI / 2; warn.position.set(x, 0.25, z); warn.userData.ownGeo = true; place.add(warn);
      this.fx.push({ o: warn, life: w, max: w, pulse: true, dispose: true });
      const rock = new THREE.Group(); rock.position.set(x + 14, 40, z - 8); place.add(rock);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: emoTex('☄️'), transparent: true })); s.scale.setScalar(5); rock.add(s);
      fxCard('glow', 0xf97316, 8, 8, 0, 0, 0, rock);
      this.fx.push({ o: rock, life: w, max: w, fall: [x + 14, 40, z - 8, x, 1, z] });
    },
    drawWorld(g, dt) {
      const all = g && Array.isArray(g.D) ? g.D : [];
      // bots
      const wantBot = new Set();
      for (const D of all) {
        if (!D.bot) continue; wantBot.add(D.id);
        const q = D.bot.p || [D.bot.x, D.bot.z, D.bot.yaw, D.bot.mv];
        let a = this.botAv.get(D.id);
        if (!a) { const r = mulberry(D.bot.s | 0); a = makeAvatar(okAv([Math.floor(r() * 6), Math.floor(r() * 10), Math.floor(r() * 8), Math.floor(r() * 16), Math.floor(r() * 11), 0, 0, Math.floor(r() * 9), 0, 0]), '🤖 ' + D.bot.n, false); a.g.position.set(q[0], 0.1, q[1]); scene.add(a.g); this.botAv.set(D.id, a); }
        const p = a.g.position, k = this.H ? 1 : Math.min(1, dt * 10);
        p.x += (q[0] - p.x) * k; p.z += (q[1] - p.z) * k; p.y = 0.1;
        let dy = q[2] - a.g.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; a.g.rotation.y += dy * Math.min(1, dt * 12);
        animateAvatar(a, dt, !!q[3], false); placeShadow(a);
        a.g.userData.auAura = D.bot.au;
      }
      for (const [id, a] of this.botAv) if (!wantBot.has(id)) { dropAvatar(a); this.botAv.delete(id); }
      // projectiles (sliding along between updates)
      const want = new Set();
      for (const D of all) for (const q0 of D.pj || []) {
        const q = Array.isArray(q0) ? q0 : [q0.id, q0.k, q0.x, q0.z, q0.vx, q0.vz], key = D.id + ':' + q[0], A = AB[q[1]]; if (!A) continue;
        want.add(key);
        let v = this.pjv.get(key);
        if (!v) { v = { g: this.pjModel(A), x: q[2], z: q[3], sx: q[2], sz: q[3] }; place.add(v.g); this.pjv.set(key, v); }
        if (v.sx !== q[2] || v.sz !== q[3]) { v.sx = q[2]; v.sz = q[3]; v.x = q[2]; v.z = q[3]; } else { v.x += q[4] * dt; v.z += q[5] * dt; }
        v.g.position.set(v.x, 2.8 + Math.sin(performance.now() / 120 + q[0]) * 0.15, v.z);
        if (A.home) v.g.rotation.y += dt * 9;
      }
      for (const [key, v] of this.pjv) if (!want.has(key)) { place.remove(v.g); v.g.traverse((o) => { if (o.material) { if (o.userData.ownMap && o.material.map) o.material.map.dispose(); o.material.dispose(); } }); this.pjv.delete(key); }
      // shields, stuns, buffs and slows on the fighters
      const wantF = new Set();
      for (const D of all) for (const i of [0, 1]) {
        const p = this.fPos(D, i); if (!p) continue;
        const key = D.id + ':' + i; wantF.add(key);
        let f = this.fv.get(key);
        if (!f) {
          f = { g: new THREE.Group() }; place.add(f.g);
          f.shield = new THREE.Mesh(new THREE.SphereGeometry(3.2, 20, 14), new THREE.MeshPhongMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.28, shininess: 120, depthWrite: false })); f.shield.position.y = 3; f.shield.userData.ownGeo = true; f.g.add(f.shield);
          f.stun = new THREE.Sprite(new THREE.SpriteMaterial({ map: emoTex('💫'), transparent: true })); f.stun.scale.setScalar(1.8); f.stun.position.y = 7.6; f.g.add(f.stun);
          f.slow = new THREE.Sprite(new THREE.SpriteMaterial({ map: emoTex('🐌'), transparent: true })); f.slow.scale.setScalar(1.3); f.slow.position.set(1.4, 6.8, 0); f.g.add(f.slow);
          f.buff = fxCard('glow', 0xf97316, 6, 7, 0, 3, 0, f.g, (o, m, t) => { m.opacity = 0.45 + 0.2 * Math.sin(t * 9); });
          this.fv.set(key, f);
        }
        f.g.position.set(p.x, p.y, p.z);
        const live = D.ph !== 'end';
        f.shield.visible = live && (D.sh || [])[i] > 0; f.stun.visible = live && (D.st || [])[i] > 0; f.slow.visible = live && (D.sl || [])[i] > 0; f.buff.visible = live && (D.bf || [])[i] > 1;
        if (f.stun.visible) f.stun.material.rotation += dt * 4;
      }
      for (const [key, f] of this.fv) if (!wantF.has(key)) { place.remove(f.g); f.shield.geometry.dispose(); this.fv.delete(key); }
      // everyone's aura, as a glow round them (bigger and brighter the more they have) and their title
      this.auraGlow(me, this.S.au, myPeer());
      for (const [peer, a] of Net.avatars) { const p = Net.peers.find((x) => x.peer === peer); this.auraGlow(a, p && p.presence ? +p.presence.au || 0 : 0, peer); }
      for (const a of this.botAv.values()) this.auraGlow(a, a.g.userData.auAura || 0, null);
      // effects
      for (let i = this.fx.length - 1; i >= 0; i--) {
        const f = this.fx[i]; f.life -= dt; const k = 1 - Math.max(0, f.life) / f.max;
        if (f.up) f.o.position.y += f.up * dt;
        if (f.grow) f.o.scale.setScalar(0.5 + k * f.grow);
        if (f.fade != null && f.o.material) f.o.material.opacity = f.fade * (1 - k);
        if (f.pulse) f.o.material.opacity = 0.2 + 0.25 * (0.5 + 0.5 * Math.sin(k * 30));
        if (f.fall) { const [x0, y0, z0, x1, y1, z1] = f.fall; f.o.position.set(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k * k, z0 + (z1 - z0) * k); }
        if (f.life <= 0) { place.remove(f.o); if (f.dispose) { if (f.o.geometry && f.o.userData.ownGeo) f.o.geometry.dispose(); if (f.o.material) { if (f.o.isSprite && f.o.material.map) f.o.material.map.dispose(); f.o.material.dispose(); } } this.fx.splice(i, 1); }
      }
    },
    pjModel(A) {
      const g = new THREE.Group();
      let s;
      if (A.txt) { s = label(A.txt, { size: 2.4, color: '#f87171', fit: false }); s.userData.ownMap = true; }
      else { s = new THREE.Sprite(new THREE.SpriteMaterial({ map: emoTex(A.e), transparent: true })); s.scale.setScalar(A.big ? 3.2 : 1.9); }
      g.add(s);
      fxCard('glow', rarHex(A.r), A.big ? 5.5 : 3.4, A.big ? 5.5 : 3.4, 0, 0, 0, g);
      return g;
    },
    auraGlow(a, au, peer) {
      if (!a || !a.g) return;
      const k = rankOf(au), R = RANKS[k], u = a.g.userData;
      if (!u.auG) { u.auG = { k: -1, ph: Math.random() * 6 }; u.auG.card = fxCard('glow', 0xffffff, 1, 1, 0, 3, 0, a.g, (o, m, t) => { const G = u.auG; o.scale.set(G.w * (1 + 0.07 * Math.sin(t * 3 + G.ph)), G.w * 1.35 * (1 + 0.07 * Math.sin(t * 3 + G.ph)), 1); if (G.k === 5) m.color.setHSL((t * 0.25) % 1, 0.85, 0.6); m.opacity = G.o; }); u.auG.card.raycast = () => {}; }
      const G = u.auG;
      if (G.k !== k) {
        G.k = k; G.w = R[3]; G.o = R[4]; G.card.visible = k > 0; G.card.material.color.set(R[2]);
        if (G.tag) { a.g.remove(G.tag); G.tag.material.map.dispose(); G.tag.material.dispose(); }
        G.tag = label(`🗿 ${R[1]}`, { size: 0.75, color: R[2] }); G.tag.position.y = 7.7; a.g.add(G.tag);
      }
    },

    /* ---------------- the bar, keys, clicks ---------------- */
    drawBar() {
      const S = this.S; if (!S) return;
      const D = this.D, fight = D && D.ph !== 'end';
      const html = fight
        ? ['slap'].concat(S.eq).map((k, i) => { const A = abOf(k); return `<button class="xslot au-ab r${A.r}" data-cast="${i - 1}" style="--rc:${RAR[A.r][1]}" title="${esc(A.n)}: ${esc(A.d)}"><span class="k">${i ? i : 'F'}</span><span class="e">${A.e}</span>${esc(A.n)}<i class="au-cd" style="height:0"></i><span class="au-cdn"></span></button>`; }).join('')
        : `<button class="xslot au-farm" data-farm="1" title="Farm aura (F, or click anywhere)"><span class="k">F</span><span class="e">🗿</span>FARM AURA<span class="n">+${short(this.perClick())}</span></button><button class="xslot" data-duel="1"><span class="e">⚔️</span>Duel</button><button class="xslot" data-crates="1"><span class="e">🎁</span>Crates${S.free ? `<span class="n">${S.free} free</span>` : ''}</button><button class="xslot" data-abs="1"><span class="e">🎒</span>Abilities</button>`;
      if (html !== this.barHtml) {
        this.barHtml = html;
        setBar(html, (b) => {
          if (b.dataset.farm) { const r = b.getBoundingClientRect(); this.farm(r.left + r.width / 2 + (Math.random() - 0.5) * 60, r.top - 20); }
          else if (b.dataset.cast != null) this.useSlot(+b.dataset.cast);
          else if (b.dataset.duel) this.duelPanel(); else if (b.dataset.crates) this.cratePanel(); else if (b.dataset.abs) this.abilityPanel();
        });
      }
      if (fight) { // cooldowns: just the shading, so the buttons themselves never get swapped under your finger
        const T = performance.now() / 1000;
        document.querySelectorAll('#xbar [data-cast]').forEach((b) => {
          const i = +b.dataset.cast, k = i < 0 ? 'slap' : S.eq[i], A = abOf(k); if (!A) return;
          const left = Math.max(0, (this.cdUntil[k] || 0) - T), cdEl = b.querySelector('.au-cd'), n = b.querySelector('.au-cdn');
          cdEl.style.height = (left > 0 ? Math.min(100, left / A.cd * 100) : 0).toFixed(0) + '%';
          const txt = left > 0.05 ? (left < 1 ? left.toFixed(1) : String(Math.ceil(left))) : '';
          if (n.textContent !== txt) n.textContent = txt;
        });
      }
    },
    key(code, down) {
      if (!down) return false;
      const D = this.D;
      if (D && D.ph !== 'end') {
        const m = /^Digit([1-4])$/.exec(code);
        if (m) { this.useSlot(+m[1] - 1); return true; }
        if (code === 'KeyF') { this.useSlot(-1); return true; }
        return false;
      }
      if (code === 'KeyF') { this.farm(); return true; }
      return false;
    },
    click(e) {
      if (e.button !== 0 || $('#auBox')) return;
      const D = this.D;
      if (D && D.ph !== 'end') { this.useSlot(-1); return; } // in a duel: a click slaps
      this.farm(e.x, e.y);
    },
    hud() {
      const D = this.D;
      if (D && D.ph !== 'end') return touchy ? 'Tap your abilities (they aim themselves) · move to dodge!' : '1–4 abilities (they aim themselves) · F or click to slap · move to dodge!';
      return touchy ? 'Tap anywhere to farm aura 🗿 · walk up to someone to challenge them' : 'Click anywhere (or F) to farm aura 🗿 · walk up to someone and press E to challenge them';
    },
    prompts() {
      if (this.D || !this.S) return [];
      const out = [];
      for (const c of this.crates || []) out.push({ x: c.x, z: c.z, r: 6, text: `Open ${c.C.n} (🗿 ${comma(c.C.price)})`, fn: () => this.cratePanel(c.C.id) });
      for (const M of STATIONS) out.push({ x: M.x, z: M.z, r: 6, text: M.k === 'up' ? `${M.e} ${M.n}` : '🎒 Your abilities', fn: () => (M.k === 'up' ? this.upgradePanel() : this.abilityPanel()) });
      out.push({ x: 0, z: -44, r: 7, text: '🤖 Duel a bot', fn: () => this.duelBot() });
      const g = this.g, busy = new Set(g && Array.isArray(g.D) ? g.D.flatMap((d) => d.f) : []);
      for (const p of players()) if (!p.me && !busy.has(p.peer)) out.push({ x: p.x, z: p.z, r: 6, text: `⚔️ Challenge ${nameOf(p.peer)}`, fn: () => this.challenge(p.peer) });
      return out;
    },
    menu() {
      return [['⚔️ Duel', () => this.duelPanel(), 'Duel'], ['🎁 Crates', () => this.cratePanel(), 'Crates'], ['🎒 Abilities', () => this.abilityPanel(), 'Abilities'], ['⬆️ Upgrades', () => this.upgradePanel(), 'Upgrade']];
    },
    statOf(pr) { return pr && pr.au != null ? `🗿 ${short(pr.au)}` : '—'; },
    sortKey(pr) { return (pr && +pr.au) || 0; },

    /* ---------------- panels ---------------- */
    abCard(k, lvl, opts = {}) {
      const A = AB[k], au = this.S.au;
      const stat = A.k === 'self' ? [A.heal ? `❤️ +${Math.round(A.heal * lvK(lvl))}` : '', A.shield ? `🍩 ${Math.round(A.shield[0] * lvK(lvl))}` : '', A.buff ? `🔥 ×${A.buff[0]}` : ''].filter(Boolean).join(' ') : `⚔️ ${Math.round(A.dmg * lvK(lvl) * auraMult(au)) * (A.cnt || 1)}${A.dot ? ' + 🌪️' + Math.round(A.dot[0] * A.dot[1] * lvK(lvl) * auraMult(au)) : ''}`;
      return `<div class="xp-card au-card r${A.r} ${opts.eq ? 'eq' : ''} ${opts.locked ? 'locked' : ''}" style="--rc:${RAR[A.r][1]}">${lvl ? `<span class="lv">Lv ${lvl}</span>` : ''}<div class="big">${opts.locked ? '❔' : A.e}</div><b>${opts.locked ? '???' : esc(A.n)}</b><span class="rt">${RAR[A.r][0]}</span>${opts.locked ? '' : `<span class="st">${stat} · ⏱️ ${A.cd}s</span><span style="font-weight:600;color:#94a3b8">${esc(A.d)}</span>`}${opts.btn || ''}</div>`;
    },
    abilityPanel() {
      const S = this.S, own = ABK.filter((k) => S.ab[k]).sort((a, b) => AB[b].r - AB[a].r);
      const slots = [0, 1, 2, 3].map((i) => { const k = S.eq[i], A = k && AB[k]; return `<div class="${A ? 'on' : ''}" style="--rc:${A ? RAR[A.r][1] : 'rgba(255,255,255,.18)'}">${A ? `<span class="e">${A.e}</span>${esc(A.n)}<br><small>Lv ${S.ab[k]}</small>` : `<span class="e">➕</span>Slot ${i + 1}`}</div>`; }).join('');
      const html = `<p class="xp-note">🎒 Equip up to 4 abilities (keys 1–4 in a duel). They aim themselves; your aura (🗿 ${comma(S.au)}) makes them hit ${pctOf(auraMult(S.au))} harder. A double from a crate levels one up (+${Math.round(LV_UP * 100)}% each, up to Lv ${MAX_LV}).</p>
        <div class="au-slots">${slots}</div>
        <div class="xp-grid">${own.map((k) => { const on = S.eq.includes(k); return this.abCard(k, S.ab[k], { eq: on, btn: `<button class="xp-btn ${on ? 'alt' : ''}" data-eq="${k}">${on ? 'Unequip' : S.eq.length >= 4 ? 'Swap in' : 'Equip'}</button>` }); }).join('')}</div>
        <h4>📖 Every ability <small style="color:var(--muted);font:700 12px var(--fb)">— ${own.length}/${ABK.length} unlocked</small></h4>
        <div class="xp-grid">${ABK.filter((k) => !S.ab[k]).map((k) => this.abCard(k, 0, { locked: AB[k].r >= 3 })).join('') || '<p class="xp-note">You have every ability. Ohio has nothing left to teach you.</p>'}</div>`;
      openPanel('🎒 Abilities', html, (b) => {
        const k = b.dataset.eq; if (!k || !S.ab[k]) return;
        const i = S.eq.indexOf(k);
        if (i >= 0) { if (S.eq.length > 1) S.eq.splice(i, 1); else { sfx('error'); toast('Keep at least one. Even NPCs have one move.', '#fca5a5'); return; } }
        else { if (S.eq.length >= 4) S.eq.shift(); S.eq.push(k); }
        sfx('select'); this.dirty = true; this.send(true); this.abilityPanel();
      });
    },
    cratePanel(focus) {
      const S = this.S;
      const odds = (o) => `<div class="au-odds">${o.map((p, r) => `<div class="${p ? '' : 'zero'}" style="--rc:${RAR[r][1]}">${RAR[r][0]}<br><b>${p}%</b></div>`).join('')}</div>`;
      const html = `<p class="xp-note">🎁 Crates cost aura, so opening one makes your hits weaker until you farm it back. Gamble responsibly (you won’t). A double levels an ability up.</p>
        ${S.free ? `<div class="xp-row" style="display:block"><b>🏆 W Crate ×${S.free}</b> <small style="color:var(--muted)">— free, from winning duels. Rolls like a Rizz Crate.</small>${odds(FREE_ODDS)}<button class="xp-btn gold" data-free="1" style="width:100%">Open a W Crate (free)</button></div>` : ''}
        ${CRATES.map((C) => `<div class="xp-row" style="display:block;${focus === C.id ? 'border-color:#fde047' : ''}"><b>${C.e} ${C.n}</b> <small style="color:var(--muted)">— ${esc(C.d)}</small>${odds(C.odds)}<button class="xp-btn" data-crate="${C.id}" style="width:100%" ${S.au < C.price ? 'disabled' : ''}>${S.au < C.price ? `Need 🗿 ${comma(C.price - S.au)} more` : `Open for 🗿 ${comma(C.price)}`}</button></div>`).join('')}`;
      openPanel('🎁 Ability Crates', html, (b) => {
        if (b.dataset.free) { if (S.free < 1) return; S.free--; this.openCrate(FREE_ODDS, '🏆 W Crate'); }
        else if (b.dataset.crate) { const C = CRATES.find((c) => c.id === b.dataset.crate); if (!C || S.au < C.price) { sfx('error'); return; } S.au -= C.price; this.openCrate(C.odds, `${C.e} ${C.n}`, C.price); }
      });
    },
    // the reveal: a strip of abilities flies past and stops on what you got
    openCrate(odds, title, price) {
      const S = this.S, got = rollAb(odds), A = AB[got], was = S.ab[got] | 0;
      let note;
      if (!was) { S.ab[got] = 1; note = 'NEW ABILITY 🔥'; if (S.eq.length < 4) S.eq.push(got); }
      else if (was < MAX_LV) { S.ab[got] = was + 1; note = `Double! Lv ${was} → Lv ${was + 1}`; }
      else { const back = Math.round((price || 400) * 0.3); S.au += back; note = `Already max level: +${comma(back)} aura back`; }
      S.op = (S.op | 0) + 1; if (A.r === 5) questMax('aura.ohio', 1);
      this.dirty = true; this.save(); this.send(true); closePanel();
      const cards = []; for (let i = 0; i < 46; i++) cards.push(i === 40 ? got : rollAb(odds));
      const el = document.createElement('div'); el.id = 'auBox';
      el.innerHTML = `<div class="in"><h3>${esc(title)}</h3><div class="win"><div class="mark"></div><div class="strip">${cards.map((k) => `<div class="card r${AB[k].r}" style="--rc:${RAR[AB[k].r][1]}"><span class="e">${AB[k].e}</span><b>${esc(AB[k].n)}</b><small>${RAR[AB[k].r][0]}</small></div>`).join('')}</div></div><div class="tap">Opening… (click to skip)</div></div>`;
      $('#xhud').append(el);
      const strip = el.querySelector('.strip'), win = el.querySelector('.win'), cw = strip.children[0].getBoundingClientRect().width + 8;
      const end = -(40 * cw + cw / 2 - win.clientWidth / 2) + (Math.random() - 0.5) * cw * 0.6;
      strip.style.transform = 'translateX(0)'; void strip.offsetWidth;
      strip.style.transition = 'transform 3.4s cubic-bezier(.12,.75,.12,1)'; strip.style.transform = `translateX(${end}px)`;
      const ticks = setInterval(() => sfx('tick', { vol: 0.35 }), 140); setTimeout(() => clearInterval(ticks), 2600);
      let shown = false;
      const show = () => {
        if (shown) return; shown = true; clearInterval(ticks);
        el.innerHTML = `<div class="in"><div class="got r${A.r}" style="--rc:${RAR[A.r][1]}"><div class="e">${A.e}</div><b>${esc(A.n)}</b><span>${RAR[A.r][0]} tier</span><p>${esc(A.d)}</p><div class="lv">${esc(note)}</div></div><div class="tap">${A.r >= 4 ? 'HOLY AURA 🗿🗿🗿 · ' : A.r === 0 ? 'mid. · ' : ''}click to close</div></div>`;
        sfx(A.r >= 4 ? 'unlock' : A.r >= 2 ? 'reward' : 'coin');
        if (A.r >= 3) { Net.chat(`🎁 unboxed ${A.n} (${RAR[A.r][0]} tier) ${A.e}`); puffAt(P.x, P.y + 4, P.z, [rarHex(A.r), 0xffffff], 30); }
        this.drawBar();
      };
      setTimeout(show, 3500);
      el.onclick = () => { if (!shown) { show(); return; } el.remove(); };
    },
    upgradePanel() {
      const S = this.S, x2 = hasItem('au2') ? 2 : 1;
      const row = (k, e, n, lvl, cost, now, next, what) => `<div class="xp-row" style="display:block"><div style="display:flex;justify-content:space-between;align-items:center"><b>${e} ${n} <small style="color:var(--muted)">Lv ${lvl}</small></b><span>${what}: <b>+${short(now)}</b> → <b style="color:#86efac">+${short(next)}</b></span></div><div style="display:flex;gap:6px;margin-top:6px"><button class="xp-btn" data-up="${k}" style="flex:1" ${S.au < cost ? 'disabled' : ''}>${S.au < cost ? `Need 🗿 ${comma(cost - S.au)} more` : `Upgrade for 🗿 ${comma(cost)}`}</button><button class="xp-btn alt" data-max="${k}" ${S.au < cost ? 'disabled' : ''}>Max</button></div></div>`;
      const html = `<p class="xp-note">⬆️ More aura per click and per second. Every upgrade costs aura, which (for a while) makes your hits weaker. That’s the grindset.</p>
        ${row('cl', '🤫', 'Mewing Lessons', S.cl, clickCost(S.cl), (1 + S.cl) * x2, (2 + S.cl) * x2, 'per click')}
        ${row('ps', '💪', 'Sigma Grindset', S.ps, grindCost(S.ps), (1 + S.ps) * x2, (2 + S.ps) * x2, 'per second')}
        <p class="xp-note">🏆 ${S.w} W · ${S.l} L · best aura ever: 🗿 ${comma(S.best)} · crates opened: ${S.op | 0}</p>`;
      openPanel('⬆️ Upgrades', html, (b) => {
        const k = b.dataset.up || b.dataset.max; if (!k) return;
        const cost = (l) => (k === 'cl' ? clickCost(l) : grindCost(l));
        let n = 0; do { const c = cost(S[k]); if (S.au < c) break; S.au -= c; S[k]++; n++; } while (b.dataset.max && n < 200);
        if (!n) { sfx('error'); return; }
        sfx('levelup'); toast(k === 'cl' ? `🤫 Jawline +${n}. Clicks hit different now.` : `💪 Grindset +${n}. 4am club.`, '#c4b5fd');
        this.dirty = true; this.save(); this.upgradePanel(); this.drawBar();
      });
    },
    duelPanel() {
      const g = this.g, busy = new Set(g && Array.isArray(g.D) ? g.D.flatMap((d) => d.f) : []), others = players().filter((p) => !p.me);
      const live = g && Array.isArray(g.D) ? g.D.filter((d) => d.ph !== 'end') : [];
      const html = `<p class="xp-note">⚔️ Challenge someone to a 1v1. The winner steals <b>20%</b> of the loser’s aura and gets a free 🏆 W Crate. Your aura gives you ${pctOf(auraMult(this.S.au))} damage.</p>
        <button class="xp-btn gold" data-bot="1" style="width:100%;padding:12px;font-size:16px" ${this.D ? 'disabled' : ''}>🤖 Duel a bot</button>
        <h4>👥 On this server</h4>
        ${others.length ? others.map((p) => { const au = +p.pr.au || 0, k = rankOf(au), b = busy.has(p.peer); return `<div class="xp-row"><span><b>${esc(nameOf(p.peer))}</b><br><small style="color:${RANKS[k][2]}">🗿 ${comma(au)} · ${RANKS[k][1]}</small></span><button class="xp-btn ${b ? 'alt' : ''}" data-ch="${esc(p.peer)}" ${b || this.D ? 'disabled' : ''}>${b ? 'In a duel' : '⚔️ Challenge'}</button></div>`; }).join('') : '<p class="xp-note">Nobody else is here. It’s giving lonely. Duel a bot!</p>'}
        ${live.length ? `<h4>📺 Live now</h4>${live.map((d) => `<div class="xp-row"><span>Ring ${d.r + 1}: <b>${esc(isBot(d.f[0]) ? '🤖' : nameOf(d.f[0]))}</b> vs <b>${esc(isBot(d.f[1]) ? '🤖 ' + (d.bot ? d.bot.n : 'Bot') : nameOf(d.f[1]))}</b></span></div>`).join('')}` : ''}`;
      openPanel('⚔️ Duels', html, (b) => {
        if (b.dataset.bot) this.duelBot();
        else if (b.dataset.ch) { this.challenge(b.dataset.ch); closePanel(); }
      });
    },

    /* ---------------- the Blox Coin shop ---------------- */
    coinShop: [
      { id: 'au2', e: '🗿', n: '2× Aura', d: 'Twice the aura from every second and every click, for good', price: 600, kind: 'pass' },
      { id: 'hp', e: '🛡️', n: 'Thick Skin', d: 'Start every duel with 25 more health, for good', price: 450, kind: 'pass' },
      { id: 'snack', e: '🍟', n: 'Aura Snack', d: 'Aura right now: 300 seconds’ worth', price: 25, kind: 'now' },
    ],
    shopCan(id) { return id === 'snack' && !this.S ? 'Loading…' : ''; },
    onBuy(id) {
      if (id === 'au2' || id === 'hp') { this.send(true); this.drawBar(); return; }
      if (id !== 'snack') return;
      const v = 300 * this.perSec(); this.gain(v); toast(`🍟 +${comma(v)} aura. Bussin.`, '#86efac'); this.drawTop();
    },
  };
  addExp(AU);
  window.__rbAU = AU;
})();
