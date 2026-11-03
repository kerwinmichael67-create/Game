/* =====================================================================
   BLOXVERSE — ⚔️ COLOSSEUM DUELS. One on one in the Colosseum.
   Twenty fighters from four empires — Rome, Greece, medieval Europe and
   medieval Japan — five to a crate: two common, a rare, an epic and a
   1% legendary (the Gladiator, the Spartan, the Heavy Knight and the
   Samurai), the strongest of all. Win the rest with the duel's own
   achievements too. Each fighter has three abilities: an M1, a special
   (7–15 s) and an ultimate (25–35 s), and its own animations for each.
   In a match you become the fighter you picked — body, armour, weapons
   and the way they move — until it ends. Classic: first to 3 rounds,
   3 minutes a round. Deathmatch: most kills in 5 minutes, back at once
   somewhere random. Fight a friend on a pad, or a bot (Easy, Normal,
   Hard, Extreme). Play a fighter to raise its mastery: master it (level
   10) and its body and animation pack are yours to wear anywhere.
   In a match against a player each of you runs your own fighter: you say
   who you hit and how hard, they take it (their blocks and dodges are
   theirs to judge). The host only pairs people up on the pads.
   ===================================================================== */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    .duMatch #board,.duMatch #meter,.duMatch #banner,.duMatch #title,.duMatch #coins,.duMatch #stat,.duMatch #stam,.duMatch #xside{display:none!important}
    .duMatch #chatlog{top:178px;width:min(330px,40vw)}
    #duTop{position:absolute;left:62px;right:12px;top:10px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;pointer-events:none}
    .du-card{width:min(310px,33vw);padding:8px 12px 9px;border-radius:14px;background:linear-gradient(180deg,rgba(17,24,39,.9),rgba(15,23,42,.72));border:2px solid rgba(255,255,255,.16);box-shadow:0 8px 22px rgba(0,0,0,.4);color:#e2e8f0}
    .du-card.me{border-color:rgba(96,165,250,.55)}.du-card.op{border-color:rgba(248,113,113,.55)}
    .du-card .tp{display:flex;align-items:baseline;gap:10px;white-space:nowrap;overflow:hidden}
    .du-card .who{font:800 15px var(--fh);color:#fff;overflow:hidden;text-overflow:ellipsis;max-width:48%}
    .du-card .ch{font:700 14px var(--fh);color:#fde68a;overflow:hidden;text-overflow:ellipsis}
    .du-card .rr{margin-left:auto;font:800 9.5px var(--fb);padding:2px 6px;border-radius:6px;color:#0b1220;letter-spacing:.04em}
    .du-card .hl{display:flex;align-items:center;gap:6px;margin-top:5px}.du-card .hl>span{font:800 11px var(--fb);color:#cbd5e1;width:18px}
    .du-bar{position:relative;flex:1;height:16px;border-radius:6px;background:rgba(0,0,0,.6);overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,.7),0 0 0 1px rgba(0,0,0,.5)}
    .du-bar i,.du-bar u{position:absolute;left:0;top:0;bottom:0;border-radius:6px}
    .du-bar u{background:rgba(255,255,255,.6);transition:width .5s .3s}.du-bar i{transition:width .12s}
    .du-bar.hp i{background:linear-gradient(180deg,#fb7185,#dc2626 55%,#991b1b)}
    .du-bar.hp.low i{background:linear-gradient(180deg,#fda4af,#ef4444 55%,#b91c1c);animation:duLow .6s infinite alternate}
    @keyframes duLow{to{filter:brightness(1.5)}}
    .du-bar.st{height:20px;margin:5px 0 0}.du-bar.st i{background:linear-gradient(180deg,#93c5fd,#3b82f6 55%,#1d4ed8)}
    .du-bar.st.tired i{background:linear-gradient(180deg,#fdba74,#f97316 55%,#c2410c)}
    .du-bar b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:800 11px var(--fb);color:#fff;text-shadow:0 1px 2px #000,0 0 3px #000;letter-spacing:.02em}
    .du-bar.st b{font-size:13px}
    .du-card .fx{display:flex;gap:4px;margin-top:5px;min-height:17px;flex-wrap:wrap}.du-card .fx span{font:700 10.5px var(--fb);padding:1px 6px;border-radius:6px;background:rgba(255,255,255,.12);white-space:nowrap}
    .du-card .fx .bad{background:rgba(220,38,38,.35)}.du-card .fx .good{background:rgba(34,197,94,.3)}
    #duMid{text-align:center;padding-top:0;min-width:120px}
    #duMid .tm{font:800 34px/1 var(--fh);color:#fff;-webkit-text-stroke:6px rgba(10,12,18,.75);paint-order:stroke fill;letter-spacing:.03em}
    #duMid .tm.low{color:#fca5a5;animation:duLow .5s infinite alternate}
    #duMid .sc{display:inline-flex;gap:9px;align-items:center;margin-top:5px;padding:3px 13px;border-radius:999px;background:rgba(15,23,42,.8);border:1px solid rgba(255,255,255,.14);font:800 19px var(--fh)}
    #duMid .sc .a{color:#60a5fa}#duMid .sc .b{color:#f87171}#duMid .sc small{font:700 11px var(--fb);color:#cbd5e1}
    #duMid .md{display:block;margin-top:3px;font:700 11px var(--fb);color:#e2e8f0;text-shadow:0 1px 2px #000}
    #duAb{position:absolute;left:14px;bottom:14px;display:flex;gap:8px;align-items:flex-end;pointer-events:auto}
    .touchy #duAb{left:auto;right:12px;bottom:120px;flex-wrap:wrap;justify-content:flex-end;max-width:300px}
    .du-ab{position:relative;width:68px;height:68px;border-radius:15px;background:linear-gradient(180deg,#273449,#0f172a);border:2px solid rgba(255,255,255,.2);box-shadow:0 5px 14px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:30px;color:#fff;cursor:pointer;overflow:hidden;padding:0;transition:transform .08s}
    .du-ab:active{transform:scale(.94)}.du-ab.m1{width:78px;height:78px;font-size:34px}
    .du-ab .k{position:absolute;left:6px;top:4px;font:800 11px var(--fb);color:#fde68a;text-shadow:0 1px 2px #000;z-index:4}
    .du-ab .n{position:absolute;left:0;right:0;bottom:3px;font:700 9.5px/1.1 var(--fb);color:#e2e8f0;text-align:center;z-index:4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 4px;text-shadow:0 1px 2px #000}
    .du-ab .e{transform:translateY(-5px);filter:drop-shadow(0 2px 2px rgba(0,0,0,.6))}
    .du-ab .cd{position:absolute;inset:0;background:conic-gradient(rgba(2,6,23,.8) var(--p,0%),transparent 0);z-index:2}
    .du-ab .s{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:800 21px var(--fh);color:#fff;text-shadow:0 2px 4px #000;z-index:3}
    .du-ab.ready{border-color:#fde68a;box-shadow:0 0 0 2px rgba(253,230,138,.22),0 0 16px rgba(253,230,138,.25),0 5px 14px rgba(0,0,0,.5)}
    .du-ab.ult.ready{border-color:#f472b6;box-shadow:0 0 0 2px rgba(244,114,182,.3),0 0 20px rgba(244,114,182,.45),0 5px 14px rgba(0,0,0,.5)}
    .du-ab.act{animation:duPop .35s}@keyframes duPop{0%{transform:scale(1.18);filter:brightness(1.8)}}
    .du-ab.no{animation:duNo .3s}@keyframes duNo{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
    .du-side{display:flex;flex-direction:column;gap:5px}
    .du-side button{min-width:50px;height:30px;padding:0 8px;border-radius:9px;border:1.5px solid rgba(255,255,255,.2);background:rgba(15,23,42,.85);color:#e2e8f0;font:800 11px var(--fb);cursor:pointer;white-space:nowrap}
    .du-side button.on{background:#b45309;border-color:#fde68a;color:#fff}.du-side button b{color:#fde68a;margin-right:3px}
    #duBig{position:absolute;left:50%;top:31%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;font:800 64px/1.05 var(--fh);letter-spacing:.04em;-webkit-text-stroke:9px rgba(10,12,18,.75);paint-order:stroke fill;white-space:nowrap;color:#fff}
    #duBig small{display:block;font-size:23px;-webkit-text-stroke:5px rgba(10,12,18,.75);margin-top:8px;color:#e2e8f0;letter-spacing:.02em}
    #duBig.pop{animation:duBigPop .5s cubic-bezier(.2,1.6,.5,1)}@keyframes duBigPop{from{transform:translate(-50%,-50%) scale(.3);opacity:0}}
    .du-dmg{position:absolute;transform:translate(-50%,-50%);font:800 24px var(--fh);color:#fff;-webkit-text-stroke:5px rgba(10,12,18,.75);paint-order:stroke fill;pointer-events:none;animation:duDmg .9s ease-out forwards;white-space:nowrap}
    .du-dmg.me{color:#fca5a5}.du-dmg.big{font-size:34px;color:#fde047}.du-dmg.heal{color:#86efac}.du-dmg.tag{font-size:17px;color:#93c5fd}
    @keyframes duDmg{0%{opacity:0;margin-top:8px;transform:translate(-50%,-50%) scale(1.5)}15%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;margin-top:-64px}}
    #duHurt{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 45%,rgba(220,38,38,.55));opacity:0;transition:opacity .35s}
    #duKill{position:absolute;right:14px;top:150px;display:flex;flex-direction:column;gap:4px;align-items:flex-end;pointer-events:none}
    #duKill div{padding:5px 12px;border-radius:10px;background:rgba(15,23,42,.8);font:700 13px var(--fb);color:#e2e8f0;animation:duIn .25s ease-out}
    @keyframes duIn{from{transform:translateX(30px);opacity:0}}
    #duTip{position:absolute;left:50%;bottom:104px;transform:translateX(-50%);transition:opacity 1s;padding:6px 14px;border-radius:999px;background:rgba(15,23,42,.72);font:600 12.5px var(--fb);color:#cbd5e1;pointer-events:none;white-space:nowrap}
    .touchy #duTip{display:none}
    #duReel{position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,rgba(30,41,59,.96),rgba(2,6,23,.97));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;z-index:40;pointer-events:auto}
    #duReel h2{margin:0;font:800 30px var(--fh);color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.4)}
    .du-strip{width:min(940px,94vw);height:200px;overflow:hidden;position:relative;border-radius:18px;border:2px solid rgba(255,255,255,.16);background:linear-gradient(180deg,#0b1220,#111827);box-shadow:inset 0 0 40px rgba(0,0,0,.8)}
    .du-strip .row{position:absolute;left:0;top:14px;display:flex;gap:10px;will-change:transform}
    .du-strip .mk{position:absolute;left:50%;top:0;bottom:0;width:4px;margin-left:-2px;background:#fde68a;box-shadow:0 0 16px #fde68a;z-index:3}
    .du-strip .mk::before,.du-strip .mk::after{content:'';position:absolute;left:-8px;border:10px solid transparent}.du-strip .mk::before{top:0;border-top-color:#fde68a}.du-strip .mk::after{bottom:0;border-bottom-color:#fde68a}
    .du-fc{width:132px;height:172px;border-radius:14px;flex:none;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 30%,var(--rc),#0f172a 72%);border:2px solid var(--rc)}
    .du-fc img{position:absolute;left:0;top:0;width:100%;height:140px;object-fit:cover}
    .du-fc b{position:absolute;left:0;right:0;bottom:17px;text-align:center;font:800 12.5px var(--fh);color:#fff;text-shadow:0 1px 2px #000}
    .du-fc small{position:absolute;left:0;right:0;bottom:3px;text-align:center;font:800 10px var(--fb);color:var(--rc);letter-spacing:.05em;text-transform:uppercase}
    .du-won{display:flex;flex-direction:column;align-items:center;gap:6px;animation:duBigPop .6s cubic-bezier(.2,1.6,.5,1)}
    .du-won .du-fc{width:200px;height:258px}.du-won .du-fc img{height:214px}.du-won .du-fc b{font-size:17px;bottom:22px}.du-won .du-fc small{font-size:12px;bottom:5px}
    .du-won.leg .du-fc{box-shadow:0 0 50px #f59e0b,0 0 120px rgba(245,158,11,.5);animation:duLeg 1s infinite alternate}@keyframes duLeg{to{box-shadow:0 0 70px #fde047,0 0 160px rgba(253,224,71,.6)}}
    .du-won p{margin:0;font:700 15px var(--fb);color:#e2e8f0;text-align:center}
    .du-btn{padding:10px 22px;border-radius:12px;border:0;font:800 15px var(--fh);color:#1c1003;background:linear-gradient(180deg,#fde68a,#f59e0b);cursor:pointer;box-shadow:0 4px 0 #92400e}
    .du-btn.alt{background:linear-gradient(180deg,#e2e8f0,#94a3b8);box-shadow:0 4px 0 #475569}
    .du-btn:disabled{filter:grayscale(1);opacity:.6;cursor:default}
    .du-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:10px}
    .du-tile{position:relative;border-radius:14px;overflow:hidden;background:radial-gradient(circle at 50% 28%,var(--rc) -40%,#0f172a 70%);border:2px solid var(--rc);padding:0;text-align:center;cursor:pointer;color:#e2e8f0;font:inherit}
    .du-tile img{display:block;width:100%;height:150px;object-fit:cover}.du-tile.lock img{filter:grayscale(1) brightness(.4)}
    .du-tile .t{padding:4px 6px 7px}.du-tile .t b{display:block;font:800 13.5px var(--fh);color:#fff}.du-tile .t small{font:800 10px var(--fb);color:var(--rc);letter-spacing:.05em;text-transform:uppercase}
    .du-tile .lk{position:absolute;left:0;right:0;top:56px;font-size:30px}.du-tile .eq{position:absolute;left:6px;top:6px;padding:2px 7px;border-radius:7px;background:#16a34a;font:800 10px var(--fb);color:#fff}
    .du-tile .mb{position:absolute;right:6px;top:6px;padding:2px 7px;border-radius:7px;background:rgba(15,23,42,.85);font:800 10px var(--fb);color:#fde68a}
    .du-tile.on{box-shadow:0 0 0 3px #fde68a}
    .du-mx{height:6px;border-radius:4px;background:rgba(0,0,0,.5);overflow:hidden;margin:4px 6px 0}.du-mx i{display:block;height:100%;background:linear-gradient(90deg,#f59e0b,#fde68a)}
    .du-det{display:grid;grid-template-columns:minmax(150px,220px) 1fr;gap:14px;margin-bottom:14px;padding:12px;border-radius:16px;background:rgba(15,23,42,.55);border:1px solid rgba(255,255,255,.1)}
    @media (max-width:640px){.du-det{grid-template-columns:1fr}}
    .du-det img{width:100%;border-radius:12px;background:radial-gradient(circle at 50% 30%,var(--rc),#0f172a 72%)}
    .du-det h3{margin:0 0 2px;font:800 22px var(--fh);color:#fff}.du-det .sub{font:700 12px var(--fb);color:var(--rc);text-transform:uppercase;letter-spacing:.05em}
    .du-stats{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}.du-stats span{padding:3px 9px;border-radius:8px;background:rgba(255,255,255,.08);font:700 12px var(--fb)}
    .du-abl{display:flex;flex-direction:column;gap:6px}.du-abl div{display:flex;gap:9px;align-items:flex-start;padding:7px 9px;border-radius:10px;background:rgba(255,255,255,.05);font:600 12.5px/1.35 var(--fb);color:#cbd5e1}
    .du-abl div>i{font-style:normal;font-size:22px}.du-abl b{color:#fff}.du-abl em{font-style:normal;color:#fde68a;font-weight:800}
    .du-crates{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}
    .du-crate{border-radius:16px;padding:12px;background:linear-gradient(160deg,var(--c1),#0f172a 78%);border:2px solid var(--c2);display:flex;flex-direction:column;gap:7px;color:#e2e8f0}
    .du-crate h4{margin:0;font:800 18px var(--fh);color:#fff}.du-crate .od{display:flex;flex-direction:column;gap:3px;font:700 12px var(--fb)}
    .du-crate .od span{display:flex;justify-content:space-between;gap:8px;padding:3px 8px;border-radius:7px;background:rgba(0,0,0,.3)}.du-crate .od span i{font-style:normal;color:var(--rc)}
    .du-ach{display:flex;flex-direction:column;gap:7px}.du-ach div{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
    .du-ach div.got{border-color:rgba(34,197,94,.5);background:rgba(34,197,94,.08)}.du-ach i{font-style:normal;font-size:24px}.du-ach b{display:block;color:#fff;font:800 14px var(--fh)}
    .du-ach small{font:600 12px var(--fb);color:#94a3b8}.du-ach .pr{margin-left:auto;text-align:right;font:800 12px var(--fb);color:#fde68a;white-space:nowrap}
    .du-diff{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
    .du-diff button{padding:14px 10px;border-radius:14px;border:2px solid var(--dc);background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(0,0,0,.2));color:#fff;font:800 17px var(--fh);cursor:pointer;text-align:center}
    .du-diff button small{display:block;margin-top:4px;font:600 11.5px/1.3 var(--fb);color:#cbd5e1}.du-diff button.on{background:var(--dc);color:#0b1220}.du-diff button.on small{color:#0b1220}
    .du-res{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center}
    @media (max-width:640px){#duTop{left:8px;right:8px;top:62px}.du-card{width:44vw;padding:6px 8px}.du-card .ch,.du-card .rr{display:none}#duMid .tm{font-size:24px}#duBig{font-size:40px}.du-ab{width:56px;height:56px;font-size:24px}.du-ab.m1{width:64px;height:64px}}`;
  document.head.append(style);

  /* ---------------- the four empires and their fighters ---------------- */
  const EMP = [
    { n: 'Rome', e: '🦅', c1: '#7f1d1d', c2: '#e8b84a', d: 'Legions, the arena’s gladiators and the emperor’s own guard.' },
    { n: 'Greece', e: '🏛️', c1: '#1e3a8a', c2: '#e2e8f0', d: 'Hoplites, skirmishers and archers of the city-states — and Sparta.' },
    { n: 'Medieval Europe', e: '🏰', c1: '#1f2937', c2: '#93c5fd', d: 'Men-at-arms, bowmen, Norse raiders, crusaders — and the knight in full plate.' },
    { n: 'Medieval Japan', e: '🏯', c1: '#450a0a', c2: '#fca5a5', d: 'Foot soldiers, masterless swordsmen, shinobi, warrior monks — and the samurai.' },
  ];
  const RAR = [{ n: 'Common', c: '#94a3b8' }, { n: 'Rare', c: '#38bdf8' }, { n: 'Epic', c: '#c084fc' }, { n: 'Legendary', c: '#fbbf24' }];
  const ODDS = [30, 30, 27, 12, 1]; // (a crate's five, in order: common, common, rare, epic, legendary)
  const CRATE_PRICE = 300;
  /* An ability: k what it is — melee (one hit), multi (several), combo (the Samurai's), proj (thrown or shot), dash, leap,
     volley (arrows fall where they stand), buff — dmg · cd (seconds) · rng (reach) · arc (degrees in front) · wind (the
     wind-up before it lands) · an (its animation) · fx what it does to them: st stun, rt root, sl [speed, s] slow,
     bl [damage, s] bleed (blc: the chance), bu [damage, s] burn, kb knockback · b (a buff): dur, def (damage taken ×),
     dmgM, dmgA (added to each hit), cdM (cooldowns run this much faster), spdM, ls (lifesteal), rf (reflect), hps,
     heal, healP, imm (no stuns, roots or slows), blk (blocks this much), inv (unseen), nx (the next hit ×) */
  const CH = [
    // 🦅 Rome
    { e: 0, r: 0, hp: 420, ab: [
      { n: 'Gladius Thrust', ic: '🗡️', k: 'melee', dmg: 42, cd: 1.2, rng: 6.5, arc: 70, wind: 0.18, an: 'thrust' },
      { n: 'Scutum Bash', ic: '🛡️', k: 'melee', dmg: 30, cd: 9, rng: 5.5, arc: 90, wind: 0.2, an: 'bash', fx: { st: 0.8 }, d: 'Slam the big shield into them: 30 damage and a 0.8 s stun.' },
      { n: 'Pilum Volley', ic: '🎯', k: 'proj', dmg: 45, cd: 26, cnt: 2, gap: 0.4, spd: 75, wind: 0.35, an: 'throw', model: 'pilum', fx: { sl: [0.6, 2] }, d: 'Two heavy pila, 45 each; each one slows them by 40% for 2 s.' }] },
    { e: 0, r: 0, hp: 360, spd: 1.1, ab: [
      { n: 'Javelin Jab', ic: '🔱', k: 'melee', dmg: 36, cd: 1.0, rng: 7, arc: 50, wind: 0.15, an: 'jab' },
      { n: 'Javelin Throw', ic: '🎯', k: 'proj', dmg: 55, cd: 8, spd: 82, wind: 0.3, an: 'throw', model: 'javelin', d: 'A fast javelin: 55 damage.' },
      { n: 'Skirmish', ic: '🐺', k: 'dash', back: true, dist: 11, dd: 0.3, cd: 28, wind: 0.08, an: 'hop', then: { k: 'proj', dmg: 40, cnt: 3, spread: 14, spd: 80, model: 'javelin' }, d: 'Leap back out of reach and throw three javelins as you land, 40 each.' }] },
    { e: 0, r: 1, hp: 400, spd: 1.05, ab: [
      { n: 'Trident Thrust', ic: '🔱', k: 'melee', dmg: 48, cd: 1.3, rng: 7.5, arc: 50, wind: 0.2, an: 'lunge' },
      { n: 'Net Cast', ic: '🕸️', k: 'proj', dmg: 20, cd: 12, spd: 48, wind: 0.3, an: 'net', model: 'net', fx: { rt: 2 }, d: 'Throw the weighted net: 20 damage and they can’t move for 2 s.' },
      { n: 'Trident Flurry', ic: '🌊', k: 'multi', hits: [30, 30, 30, 30], gap: 0.17, cd: 30, rng: 7.5, arc: 60, wind: 0.2, an: 'flurry', d: 'Four quick thrusts, 30 each.' }] },
    { e: 0, r: 2, hp: 520, def: 0.9, ab: [
      { n: 'Spatha Cut', ic: '⚔️', k: 'melee', dmg: 58, cd: 1.4, rng: 7, arc: 100, wind: 0.22, an: 'slash' },
      { n: 'Testudo', ic: '🛡️', k: 'buff', cd: 14, an: 'testudo', b: { dur: 3, blk: 0.8 }, d: 'Shield up like a whole legion: 80% less damage from every side for 3 s.' },
      { n: 'Imperial Charge', ic: '🦂', k: 'dash', dmg: 120, dist: 15, dd: 0.45, cd: 32, wind: 0.25, an: 'charge', fx: { st: 1, kb: 6 }, d: 'Charge behind the shield: 120 damage and they’re knocked down (1 s).' }] },
    { e: 0, r: 3, hp: 425, ab: [
      { n: 'Sica Slash', ic: '⚔️', k: 'melee', dmg: 55, cd: 1.5, rng: 6.5, arc: 110, wind: 0.2, an: 'sica', fx: { bl: [65, 5], blc: 0.35 }, d: '35% chance to make them bleed: 65 damage over 5 s.' },
      { n: 'Shield Rush', ic: '🛡️', k: 'dash', dmg: 70, dist: 11, dd: 0.3, cd: 10, wind: 0.12, an: 'rush', fx: { st: 1 }, d: 'Rush in behind the shield: 70 damage and a 1 s stun.' },
      { n: 'Berserk', ic: '🔥', k: 'buff', cd: 35, an: 'berserk', b: { dur: 5, cdM: 2, dmgA: 35 }, d: 'For 5 s: cooldowns 50% shorter and +35 damage on every hit.' }] },
    // 🏛️ Greece
    { e: 1, r: 0, hp: 450, ab: [
      { n: 'Dory Thrust', ic: '🔱', k: 'melee', dmg: 40, cd: 1.3, rng: 8.5, arc: 40, wind: 0.2, an: 'overhand' },
      { n: 'Aspis Wall', ic: '🛡️', k: 'buff', cd: 10, an: 'aspis', b: { dur: 2.5, blk: 0.7 }, d: 'Brace behind the aspis: 70% less damage for 2.5 s.' },
      { n: 'Phalanx Push', ic: '🦉', k: 'dash', dmg: 80, dist: 9, dd: 0.35, cd: 28, wind: 0.2, an: 'push', fx: { kb: 12 }, d: 'Drive forward shield first: 80 damage and they’re thrown back.' }] },
    { e: 1, r: 0, hp: 380, spd: 1.1, ab: [
      { n: 'Kopis Cut', ic: '🗡️', k: 'melee', dmg: 38, cd: 1.0, rng: 6, arc: 100, wind: 0.15, an: 'slash' },
      { n: 'Javelin', ic: '🎯', k: 'proj', dmg: 50, cd: 8, spd: 80, wind: 0.28, an: 'throw', model: 'javelin', d: 'A javelin: 50 damage.' },
      { n: 'Hit and Run', ic: '🌙', k: 'buff', cd: 25, an: 'hype', b: { dur: 6, spdM: 1.4, dmgM: 1.25 }, d: '+40% speed and +25% damage for 6 s.' }] },
    { e: 1, r: 1, hp: 340, ab: [
      { n: 'Bow Shot', ic: '🏹', k: 'proj', dmg: 45, cd: 1.4, spd: 100, wind: 0.25, an: 'bow', model: 'arrow' },
      { n: 'Fire Arrow', ic: '🔥', k: 'proj', dmg: 60, cd: 10, spd: 95, wind: 0.4, an: 'bow', model: 'fire', fx: { bu: [30, 3] }, d: 'A burning arrow: 60 damage, and 30 more as it burns for 3 s.' },
      { n: 'Arrow Storm', ic: '🌧️', k: 'volley', dmg: 35, cnt: 6, rad: 6, delay: 0.9, cd: 32, wind: 0.35, an: 'sky', d: 'Six arrows fall where they stand, 35 each.' }] },
    { e: 1, r: 2, hp: 500, ab: [
      { n: 'Xiphos Strike', ic: '🗡️', k: 'melee', dmg: 60, cd: 1.4, rng: 6.5, arc: 90, wind: 0.2, an: 'slash' },
      { n: 'Leap of Achilles', ic: '🐜', k: 'leap', dmg: 70, dist: 18, rad: 6.5, cd: 12, wind: 0.15, an: 'leap', fx: { st: 0.5 }, d: 'Leap at them and come down hard: 70 damage all round.' },
      { n: 'Wrath of Achilles', ic: '⚡', k: 'buff', cd: 34, an: 'wrath', b: { dur: 6, dmgM: 1.3, spdM: 1.2, ls: 0.25 }, d: '+30% damage, +20% speed and 25% lifesteal for 6 s.' }] },
    { e: 1, r: 3, hp: 500, ab: [
      { n: 'Spear / Sword', ic: '🔱', k: 'melee', modes: [
        { n: 'Spear', ic: '🔱', dmg: 75, cd: 3, rng: 9, arc: 40, wind: 0.3, an: 'spear' },
        { n: 'Sword', ic: '🗡️', dmg: 50, cd: 1.7, rng: 6.5, arc: 100, wind: 0.18, an: 'slash' }] },
      { n: 'Spartan Kick', ic: '🦶', k: 'melee', dmg: 45, cd: 9, rng: 5.5, arc: 70, wind: 0.2, an: 'kick', fx: { st: 1, kb: 14 }, d: 'THIS IS SPARTA: 45 damage, a 1 s stun and they fly back.' },
      { n: 'Molon Labe', ic: '🛡️', k: 'buff', cd: 30, an: 'molon', b: { dur: 4, def: 0.3, rf: 0.4 }, d: '“Come and take them”: 70% less damage for 4 s, and 40% of it goes back at them.' }] },
    // 🏰 Medieval Europe
    { e: 2, r: 0, hp: 460, ab: [
      { n: 'Arming Sword', ic: '🗡️', k: 'melee', dmg: 45, cd: 1.3, rng: 6.5, arc: 100, wind: 0.2, an: 'slash' },
      { n: 'Shield Block', ic: '🛡️', k: 'buff', cd: 10, an: 'shieldup', b: { dur: 2.5, blk: 0.75 }, d: 'Behind the heater shield: 75% less damage for 2.5 s.' },
      { n: 'Rally', ic: '📯', k: 'buff', cd: 28, an: 'rally', b: { dur: 6, heal: 120, dmgM: 1.2 }, d: 'Heal 120 and +20% damage for 6 s.' }] },
    { e: 2, r: 0, hp: 340, ab: [
      { n: 'Longbow', ic: '🏹', k: 'proj', dmg: 48, cd: 1.5, spd: 105, wind: 0.3, an: 'bow', model: 'arrow' },
      { n: 'Piercing Shot', ic: '🎯', k: 'proj', dmg: 85, cd: 11, spd: 165, wind: 0.55, an: 'draw', model: 'arrow', d: 'A full draw: a fast arrow for 85.' },
      { n: 'Volley', ic: '🌧️', k: 'volley', dmg: 35, cnt: 5, rad: 6, delay: 1.0, cd: 30, wind: 0.35, an: 'sky', d: 'Five arrows rain down where they stand, 35 each.' }] },
    { e: 2, r: 1, hp: 470, ab: [
      { n: 'Dane Axe', ic: '🪓', k: 'melee', dmg: 55, cd: 1.5, rng: 6.5, arc: 110, wind: 0.25, an: 'chop' },
      { n: 'Axe Throw', ic: '🪓', k: 'proj', dmg: 60, cd: 10, spd: 70, wind: 0.3, an: 'throw', model: 'axe', fx: { sl: [0.6, 2] }, d: 'A spinning throwing axe: 60 damage and a 2 s slow.' },
      { n: 'Berserkergang', ic: '🐻', k: 'buff', cd: 32, an: 'roar', b: { dur: 6, dmgM: 1.4, ls: 0.3 }, d: 'The bear-shirt rage: +40% damage and 30% lifesteal for 6 s.' }] },
    { e: 2, r: 2, hp: 560, def: 0.85, ab: [
      { n: 'Longsword', ic: '⚔️', k: 'melee', dmg: 65, cd: 1.6, rng: 7, arc: 100, wind: 0.25, an: 'slash2' },
      { n: 'Holy Smite', ic: '✝️', k: 'melee', dmg: 100, cd: 13, rng: 7, arc: 60, wind: 0.5, an: 'smite', fx: { st: 1 }, d: 'A great overhead blow wreathed in light: 100 damage and a 1 s stun.' },
      { n: 'Deus Vult', ic: '🙏', k: 'buff', cd: 35, an: 'pray', b: { dur: 6, healP: 0.3, dmgM: 1.25 }, d: 'Heal 30% of your health and +25% damage for 6 s.' }] },
    { e: 2, r: 3, hp: 735, def: 0.65, spd: 0.75, ab: [
      { n: 'Sword Modes', ic: '⚔️', k: 'melee', modes: [
        { n: 'Overhead', ic: '⬇️', dmg: 125, cd: 2.5, rng: 8, arc: 60, wind: 0.45, an: 'overhead' },
        { n: 'Swing', ic: '↔️', dmg: 75, cd: 1.8, rng: 8, arc: 150, wind: 0.3, an: 'swing' },
        { n: 'Stab', ic: '🎯', dmg: 300, cd: 5.5, rng: 9.5, arc: 30, wind: 0.65, an: 'stab' }] },
      { n: 'Pommel Strike', ic: '🔨', k: 'melee', dmg: 50, cd: 12, rng: 5, arc: 70, wind: 0.2, an: 'pommel', fx: { st: 1.2 }, d: 'Murder-stroke with the pommel: 50 damage and a 1.2 s stun.' },
      { n: 'Iron Fortress', ic: '🏰', k: 'buff', cd: 32, an: 'fortress', b: { dur: 5, def: 0.5, hps: 25, imm: 1 }, d: 'For 5 s: half the damage, heal 25 a second, and nothing stuns, roots or slows you.' }] },
    // 🏯 Medieval Japan
    { e: 3, r: 0, hp: 400, ab: [
      { n: 'Yari Thrust', ic: '🔱', k: 'melee', dmg: 40, cd: 1.2, rng: 9, arc: 35, wind: 0.2, an: 'spear2' },
      { n: 'Spear Sweep', ic: '🌀', k: 'melee', dmg: 55, cd: 9, rng: 8.5, arc: 170, wind: 0.25, an: 'sweep', fx: { sl: [0.6, 2] }, d: 'A low sweep of the yari: 55 damage and a 2 s slow.' },
      { n: 'Arquebus', ic: '🔫', k: 'proj', dmg: 140, cd: 30, spd: 230, wind: 1.2, an: 'gun', model: 'ball', d: 'Aim the matchlock for 1.2 s, then fire: 140 damage.' }] },
    { e: 3, r: 0, hp: 410, ab: [
      { n: 'Katana Cut', ic: '🗡️', k: 'melee', dmg: 46, cd: 1.2, rng: 7, arc: 100, wind: 0.18, an: 'katana' },
      { n: 'Iaijutsu', ic: '💨', k: 'dash', dmg: 70, dist: 12, dd: 0.2, cd: 10, wind: 0.15, an: 'iai', d: 'Draw and cut as you dash through them: 70 damage.' },
      { n: 'Wanderer’s Resolve', ic: '🍂', k: 'buff', cd: 28, an: 'resolve', b: { dur: 5, heal: 100, imm: 1, def: 0.85 }, d: 'Heal 100; for 5 s nothing stuns, roots or slows you, and 15% less damage.' }] },
    { e: 3, r: 1, hp: 360, spd: 1.15, ab: [
      { n: 'Ninjato Slash', ic: '🗡️', k: 'melee', dmg: 38, cd: 0.9, rng: 6, arc: 100, wind: 0.12, an: 'quick' },
      { n: 'Shuriken Fan', ic: '✴️', k: 'proj', dmg: 25, cnt: 3, spread: 16, cd: 8, spd: 90, wind: 0.15, an: 'fan', model: 'shuriken', d: 'Three shuriken in a fan, 25 each.' },
      { n: 'Smoke Bomb', ic: '💨', k: 'buff', cd: 30, an: 'smoke', b: { dur: 3, inv: 1, nx: 2 }, d: 'Vanish for 3 s; your next hit does double damage.' }] },
    { e: 3, r: 2, hp: 540, ab: [
      { n: 'Naginata Cut', ic: '🌙', k: 'melee', dmg: 62, cd: 1.5, rng: 8.5, arc: 120, wind: 0.25, an: 'naginata' },
      { n: 'Whirlwind', ic: '🌀', k: 'multi', hits: [30, 30, 30, 30], gap: 0.2, cd: 13, rng: 7.5, arc: 360, wind: 0.15, an: 'whirl', d: 'Spin the naginata round you: four hits of 30.' },
      { n: 'Benkei’s Stand', ic: '📿', k: 'buff', cd: 33, an: 'benkei', b: { dur: 6, def: 0.5, imm: 1, dmgM: 1.3 }, d: 'Plant your feet like Benkei at the bridge: half damage, no stuns, +30% damage for 6 s.' }] },
    { e: 3, r: 3, hp: 635, ab: [
      { n: 'Tachi Cut', ic: '🗡️', k: 'melee', dmg: 80, cd: 1.4, rng: 7.5, arc: 100, wind: 0.2, an: 'katana' },
      { n: 'Combo', ic: '🌸', k: 'combo', hits: [75, 35, 40, 25, 40], gap: 0.27, cd: 7, rng: 7.5, arc: 90, wind: 0.2, an: 'combo', d: 'Five cuts: 75, 35, 40, 25, 40. If the first lands they can’t move until it’s done — if it misses you’re stunned for 1.5 s and take 50% more damage.' },
      { n: 'Iaido Strike', ic: '🌙', k: 'dash', dmg: 180, dist: 15, dd: 0.25, cd: 28, wind: 0.35, an: 'iaido', d: 'One perfect draw-cut as you pass through them: 180 damage.' }] },
  ];
  CH.forEach((C, i) => { C.i = i; C.n = DUEL_N[i]; C.ic = DUEL_IC[i]; C.spd = C.spd || 1; C.def = C.def || 1; });
  const CRATE = EMP.map((_, e) => CH.filter((C) => C.e === e).map((C) => C.i)); // (each crate's five, common to legendary)
  const LEG = new Set([4, 9, 14, 19]);
  // the fighters' looks for their trails and glows
  const COL = ['#ef4444', '#f59e0b', '#2dd4bf', '#a855f7', '#f97316', '#60a5fa', '#fbbf24', '#fb923c', '#a3a3a3', '#dc2626', '#facc15', '#84cc16', '#38bdf8', '#fef3c7', '#e2e8f0', '#93c5fd', '#fda4af', '#a78bfa', '#fb923c', '#fde047'];
  // the duel's own achievements: each wins a fighter (the 1% ones only come from crates)
  const ACH = [
    { id: 'blood', ic: '🩸', n: 'First Blood', d: 'Defeat a fighter', k: 'kills', n0: 1, c: 1 },
    { id: 'win1', ic: '🏆', n: 'Into the Arena', d: 'Win a Classic duel', k: 'cwins', n0: 1, c: 5 },
    { id: 'win3', ic: '🎖️', n: 'Crowd Pleaser', d: 'Win 3 duels', k: 'wins', n0: 3, c: 10 },
    { id: 'normal', ic: '🟡', n: 'Proving Ground', d: 'Beat a Normal bot', k: 'b1', n0: 1, c: 15 },
    { id: 'dmg', ic: '💥', n: 'Heavy Hitter', d: 'Deal 5,000 damage', k: 'dmg', n0: 5000, c: 6 },
    { id: 'flaw', ic: '✨', n: 'Untouched', d: 'Win a round without taking damage', k: 'flaw', n0: 1, c: 16 },
    { id: 'dm10', ic: '💀', n: 'Bloodsport', d: 'Get 10 kills in Deathmatch', k: 'dmk', n0: 10, c: 11 },
    { id: 'hard', ic: '🟠', n: 'Veteran', d: 'Beat a Hard bot', k: 'b2', n0: 1, c: 2 },
    { id: 'crate3', ic: '🎁', n: 'Collector', d: 'Open 3 crates', k: 'crates', n0: 3, c: 7 },
    { id: 'win10', ic: '⚔️', n: 'Champion of the Sands', d: 'Win 10 duels', k: 'wins', n0: 10, c: 12 },
    { id: 'dodge', ic: '💨', n: 'Untouchable', d: 'Dodge 40 attacks', k: 'dodges', n0: 40, c: 17 },
    { id: 'extreme', ic: '🔴', n: 'Legend of the Arena', d: 'Beat an Extreme bot', k: 'b3', n0: 1, c: 3 },
    { id: 'win25', ic: '👑', n: 'Hero of the People', d: 'Win 25 duels', k: 'wins', n0: 25, c: 8 },
    { id: 'master', ic: '🌟', n: 'Devoted', d: 'Reach mastery 5 with any fighter', k: 'mast', n0: 5, c: 13 },
    { id: 'dm15', ic: '☠️', n: 'Unstoppable', d: 'Win a Deathmatch with 15 kills or more', k: 'dm15', n0: 1, c: 18 },
  ];
  const DIFF = [
    { n: 'Easy', e: '🟢', c: '#4ade80', react: 0.7, aggr: 0.45, abil: 0.25, guard: 0.04, dodge: 0.03, dmgM: 0.65, hpM: 0.85, spdM: 0.85, aim: 0.55, coins: 20, d: 'Slow to react, rarely uses abilities.' },
    { n: 'Normal', e: '🟡', c: '#facc15', react: 0.42, aggr: 0.65, abil: 0.55, guard: 0.14, dodge: 0.1, dmgM: 0.85, hpM: 1, spdM: 0.95, aim: 0.8, coins: 35, d: 'A fair fight.' },
    { n: 'Hard', e: '🟠', c: '#fb923c', react: 0.26, aggr: 0.8, abil: 0.85, guard: 0.3, dodge: 0.24, dmgM: 1, hpM: 1.1, spdM: 1, aim: 0.92, coins: 50, d: 'Blocks, dodges and saves its abilities for the right moment.' },
    { n: 'Extreme', e: '🔴', c: '#ef4444', react: 0.13, aggr: 0.95, abil: 1, guard: 0.45, dodge: 0.42, dmgM: 1.15, hpM: 1.25, spdM: 1.05, aim: 1, coins: 80, d: 'Reads you, punishes every mistake. More health, harder hits.' },
  ];
  const MAST = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000]; // (mastery XP for each level, 1 to 10)
  const mLvl = (xp) => { let l = 0; while (l < 10 && xp >= MAST[l + 1]) l++; return l; };
  const ROUND_T = 180, DM_T = 300, TO = 3, A0 = 34, B0 = 24; // (a round, a deathmatch; first to; the arena's half-length (x) and half-width (z))
  const LOBBY = { z0: 92, z1: 156, x: 46 }, PADS = [{ md: 'c', x: -16, z: 108, n: '⚔️ CLASSIC 1v1', s: 'first to 3' }, { md: 'd', x: 16, z: 108, n: '💀 DEATHMATCH 1v1', s: 'most kills in 5:00' }];
  const SHRINES = [{ e: 0, x: -33, z: 132 }, { e: 1, x: -11, z: 140 }, { e: 2, x: 11, z: 140 }, { e: 3, x: 33, z: 132 }];
  const ARMORY = { x: -40, z: 120 }, BOTGATE = { x: 40, z: 120 }, TABLET = { x: 0, z: 150 };
  const isFloor = (x, z) => (x / A0) ** 2 + (z / B0) ** 2;
  const angOf = (dx, dz) => Math.atan2(-dx, -dz); // (the yaw that faces along dx, dz)
  const wrapA = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const now = () => performance.now() / 1000;

  /* ---------------- the Colosseum ----------------
     An oval of sand, a marble podium wall hung with the four empires' banners, braziers burning on top; tiers of seats
     packed with a crowd that jumps up when blood's drawn; the emperor's box; the three arcaded storeys and the attic of
     the outer wall, the velarium's awnings above. Next to it, through the trees, the ludus: the courtyard where you wait,
     pick a fighter, open crates and step onto a pad. Only the arena floor and the courtyard are solid. */
  const SC = { fires: [], padFx: [], crates: [], legends: [] }; // (the scenery that moves)
  const CS = 26, CDR = 1.2, CH0 = 6.6, CDH = 1.05, FA = A0 + 3 + CS * CDR + 1.6, FB = B0 + 3 + CS * CDR + 1.6, FH = 43; // (seat rows; each row's depth, the first row's height, each row's rise; the outer wall)
  const sandTex = () => kCanvas('duSand', 1024, 1024, (g, r) => {
    g.fillStyle = '#d9b77c'; g.fillRect(0, 0, 1024, 1024);
    for (let k = 0; k < 26000; k++) { const v = r(); g.fillStyle = v < 0.33 ? 'rgba(120,80,30,.10)' : v < 0.66 ? 'rgba(255,240,200,.13)' : 'rgba(90,60,20,.07)'; g.fillRect(r() * 1024, r() * 1024, 1 + r() * 3, 1 + r() * 2); }
    g.strokeStyle = 'rgba(150,105,50,.18)'; g.lineWidth = 3; for (let k = 1; k < 26; k++) { g.beginPath(); g.ellipse(512, 512, k * 19, k * 19, 0, 0, 7); g.stroke(); } // (raked in rings)
    for (let k = 0; k < 9; k++) { const x = 140 + r() * 744, y = 140 + r() * 744, gr = g.createRadialGradient(x, y, 2, x, y, 30 + r() * 50); gr.addColorStop(0, 'rgba(100,60,25,.25)'); gr.addColorStop(1, 'rgba(100,60,25,0)'); g.fillStyle = gr; g.fillRect(x - 90, y - 90, 180, 180); } // (scuffs)
    g.strokeStyle = 'rgba(70,45,15,.32)'; g.lineWidth = 6; g.beginPath(); g.arc(512, 512, 96, 0, 7); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(512, 512, 84, 0, 7); g.stroke(); // (the centre circle, a star in it)
    g.fillStyle = 'rgba(70,45,15,.22)'; g.beginPath(); for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, rr = k % 2 ? 30 : 78; g.lineTo(512 + Math.cos(a) * rr, 512 + Math.sin(a) * rr); } g.fill();
    for (const s of [-1, 1]) { g.strokeStyle = 'rgba(40,25,10,.4)'; g.lineWidth = 3; for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(512 + s * 300 - 40, 470 + k * 14); g.lineTo(512 + s * 300 + 40, 470 + k * 14); g.stroke(); } } // (trapdoors to the hypogeum)
  });
  const podiumTex = () => kCanvas('duPodium', 512, 128, (g, r) => {
    g.fillStyle = '#e9e1d0'; g.fillRect(0, 0, 512, 128); for (let k = 0; k < 2500; k++) { g.fillStyle = `rgba(${120 + r() * 60},${110 + r() * 50},${90 + r() * 40},${0.05 + r() * 0.06})`; g.fillRect(r() * 512, r() * 128, 2 + r() * 6, 1); }
    for (let p = 0; p < 4; p++) { const x = 8 + p * 128; g.fillStyle = ['#7f1d1d', '#1e3a8a', '#7f1d1d', '#14532d'][p]; g.fillRect(x, 22, 112, 82); g.strokeStyle = '#e8b84a'; g.lineWidth = 4; g.strokeRect(x + 4, 26, 104, 74);
      g.fillStyle = 'rgba(255,236,200,.85)'; g.font = 'bold 34px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(['SPQR', 'ΣΠΑΡΤΗ', 'DEVS VVLT', '武士道'][p], x + 56, 64); }
    g.fillStyle = '#b8ad97'; g.fillRect(0, 0, 512, 12); g.fillRect(0, 116, 512, 12); g.fillStyle = '#8a7f6a'; g.fillRect(0, 12, 512, 3); g.fillRect(0, 113, 512, 3);
  });
  const facadeTex = () => kCanvas('duFacade', 256, 512, (g, r) => { // one bay of the outer wall, top to bottom: the attic, three storeys of arches
    g.fillStyle = '#d8c9a8'; g.fillRect(0, 0, 256, 512); for (let k = 0; k < 2600; k++) { g.fillStyle = `rgba(${90 + r() * 70},${80 + r() * 60},${60 + r() * 40},${0.06 + r() * 0.08})`; g.fillRect(r() * 256, r() * 512, 1 + r() * 4, 1 + r() * 3); }
    g.strokeStyle = 'rgba(110,95,70,.35)'; g.lineWidth = 1; for (let y = 0; y < 512; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); for (let x = (y / 16) % 2 ? 0 : 24; x < 256; x += 48) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); } } // (the blocks)
    g.fillStyle = 'rgba(40,30,20,.85)'; for (const [x, y] of [[54, 40], [170, 40]]) g.fillRect(x, y, 32, 26); // (the attic's windows)
    for (let s = 0; s < 3; s++) { const y0 = 106 + s * 136, h = 118; const gr = g.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, '#1a140e'); gr.addColorStop(1, '#3b2f22'); g.fillStyle = gr;
      g.beginPath(); g.moveTo(58, y0 + h); g.lineTo(58, y0 + 46); g.arc(128, y0 + 46, 70, Math.PI, 0); g.lineTo(198, y0 + h); g.closePath(); g.fill();
      g.strokeStyle = '#efe4c8'; g.lineWidth = 7; g.beginPath(); g.arc(128, y0 + 46, 74, Math.PI, 0); g.stroke(); g.fillStyle = '#efe4c8'; g.fillRect(124, y0 - 32, 8, 14); // (the arch's moulding, its keystone)
      if (s < 2) { g.fillStyle = 'rgba(245,240,228,.9)'; g.beginPath(); g.arc(128, y0 + 36, 10, 0, 7); g.fill(); g.fillRect(118, y0 + 46, 20, 44); g.fillRect(114, y0 + 90, 28, 22); g.fillRect(104, y0 + 52, 12, 30); g.fillRect(140, y0 + 50, 12, 32); } // (a statue in each upper arch)
      g.fillStyle = '#c4b493'; g.fillRect(0, y0 - 18, 256, 14); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, y0 - 5, 256, 4); }
  });
  const awningTex = () => kCanvas('duAwning', 256, 64, (g) => { for (let x = 0; x < 256; x += 32) { g.fillStyle = (x / 32) % 2 ? '#f5ecd7' : '#b91c1c'; g.fillRect(x, 0, 32, 64); } g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(0, 56, 256, 8); });
  const groundTex = () => kCanvas('duGround', 512, 512, (g, r) => { g.fillStyle = '#9a8a5e'; g.fillRect(0, 0, 512, 512); for (let k = 0; k < 9000; k++) { const v = r(); g.fillStyle = v < 0.4 ? 'rgba(90,110,50,.25)' : v < 0.7 ? 'rgba(180,160,110,.2)' : 'rgba(60,50,30,.15)'; g.fillRect(r() * 512, r() * 512, 2 + r() * 4, 2 + r() * 3); } });
  const paveTex = () => kCanvas('duPave', 256, 256, (g, r) => { g.fillStyle = '#cbbd9d'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < 256; x += 64) { const c = 175 + r() * 45; g.fillStyle = `rgb(${c},${c * 0.93},${c * 0.8})`; g.fillRect(x + 2, y + 2, 60, 28); } for (let k = 0; k < 1500; k++) { g.fillStyle = 'rgba(80,60,40,.08)'; g.fillRect(r() * 256, r() * 256, 2, 2); } });
  const bannerTex = (e) => kCanvas('duBan' + e, 128, 384, (g) => {
    const [bg, fg] = [['#991b1b', '#e8b84a'], ['#1e40af', '#f8fafc'], ['#1e3a8a', '#facc15'], ['#f8fafc', '#b91c1c']][e]; g.fillStyle = bg; g.fillRect(0, 0, 128, 384);
    g.fillStyle = fg; g.fillRect(0, 0, 128, 10); g.fillRect(0, 374, 128, 10); g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(10, 18, 108, 348);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (e === 0) { g.font = 'bold 30px serif'; g.fillText('SPQR', 64, 290); g.beginPath(); g.moveTo(64, 70); g.lineTo(96, 120); g.lineTo(80, 118); g.lineTo(100, 170); g.lineTo(64, 140); g.lineTo(28, 170); g.lineTo(48, 118); g.lineTo(32, 120); g.closePath(); g.fill(); g.beginPath(); g.arc(64, 205, 26, 0, 7); g.lineWidth = 6; g.stroke(); } // (the eagle, a wreath)
    else if (e === 1) { g.lineWidth = 6; g.beginPath(); g.moveTo(26, 260); g.lineTo(64, 110); g.lineTo(102, 260); g.stroke(); for (let x = 16; x < 112; x += 20) { g.strokeRect(x, 320, 14, 14); } } // (a lambda, a key border)
    else if (e === 2) { g.font = 'bold 120px serif'; g.fillText('⚜', 64, 180); g.fillRect(30, 280, 68, 8); g.fillRect(60, 250, 8, 70); } // (the lily, a cross)
    else { g.beginPath(); g.arc(64, 150, 44, 0, 7); g.fill(); g.font = 'bold 40px serif'; g.fillText('武', 64, 270); g.fillText('士', 64, 318); } // (the rising sun)
  });
  // the seats: rows rising round the arena, a walkway between each tier, colours by tier (marble for the senators near the front)
  const caveaGeo = () => kg('duCavea', () => {
    const N = 128, pos = [], nor = [], col = [], idx = [], c = new THREE.Color();
    const quad = (p, n, cc) => { const b = pos.length / 3; for (const q of p) { pos.push(q[0], q[1], q[2]); nor.push(n[0], n[1], n[2]); col.push(cc.r, cc.g, cc.b); } idx.push(b, b + 1, b + 2, b, b + 2, b + 3); };
    for (let s = 0; s < CS; s++) {
      const a1 = A0 + 3 + s * CDR, b1 = B0 + 3 + s * CDR, a2 = a1 + CDR, b2 = b1 + CDR, y1 = CH0 + s * CDH, y0 = y1 - CDH, walk = s % 9 === 8;
      const tier = s < 9 ? '#efe8da' : s < 18 ? '#d8c8a8' : '#b9a789';
      for (let k = 0; k < N; k++) {
        const t0 = (k / N) * Math.PI * 2, t1 = ((k + 1) / N) * Math.PI * 2, P = (a, b, t, y) => [a * Math.cos(t), y, b * Math.sin(t)], tm = (t0 + t1) / 2, stair = k % 8 === 0;
        const nx = -Math.cos(tm) / a1, nz = -Math.sin(tm) / b1, nl = Math.hypot(nx, nz);
        c.set(stair ? '#9c8f78' : tier).multiplyScalar(0.72); quad([P(a1, b1, t0, y0), P(a1, b1, t1, y0), P(a1, b1, t1, y1), P(a1, b1, t0, y1)], [nx / nl, 0, nz / nl], c); // (the riser)
        c.set(walk ? '#a8987c' : stair ? '#b4a68c' : tier).multiplyScalar(0.94 + 0.06 * Math.sin(k * 1.7 + s)); quad([P(a1, b1, t0, y1), P(a1, b1, t1, y1), P(a2, b2, t1, y1), P(a2, b2, t0, y1)], [0, 1, 0], c); // (the seat)
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); return g;
  });
  // the crowd: a block of a body and a head for each, all drawn at once; each bobs up when the crowd's excited (uT, uAmp)
  const CROWD = { u: { uT: { value: 0 }, uAmp: { value: 0.05 } }, ex: 0 };
  function crowdMesh(par) {
    const rnd = mulberry(77), spots = [];
    for (let s = 0; s < CS; s++) { if (s % 9 === 8) continue; const am = A0 + 3 + (s + 0.45) * CDR, bm = B0 + 3 + (s + 0.45) * CDR, y = CH0 + s * CDH, L = Math.PI * (am + bm), n = Math.floor(L / 1.25);
      for (let k = 0; k < n; k++) { const t = ((k + rnd() * 0.3) / n) * Math.PI * 2, seg = (t / (Math.PI * 2)) * 128;
        if (seg % 8 < 0.9 || rnd() > 0.72) continue; // (the stairs; empty seats)
        const z = bm * Math.sin(t), x = am * Math.cos(t); if (z < -B0 - 2 && Math.abs(x) < 9 && s < 8) continue; // (the emperor's box)
        if (Math.abs(z) < 7 && s < 4) continue; // (over the gates)
        spots.push([x, y, z, Math.atan2(x, z) + Math.PI, rnd()]); } }
    const n = spots.length, body = kg('duCrowdB', () => { const q = new THREE.BoxGeometry(0.85, 1.05, 0.55); q.translate(0, 0.55, 0); return q; }), head = kg('duCrowdH', () => { const q = new THREE.BoxGeometry(0.6, 0.6, 0.6); q.translate(0, 1.42, -0.04); return q; });
    const ph = new Float32Array(n); spots.forEach((s, i) => (ph[i] = s[4]));
    const mk = (geo) => { const m = new THREE.MeshLambertMaterial({ color: '#ffffff' }); m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, CROWD.u); sh.vertexShader = 'attribute float aPh;\nuniform float uT;\nuniform float uAmp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.y += uAmp * max(0.0, sin(uT * (6.0 + aPh * 4.0) + aPh * 40.0));'); };
      const g2 = geo.clone(); g2.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 1)); const im = new THREE.InstancedMesh(g2, m, n); im.userData.ownGeo = 1; im.frustumCulled = false; par.add(im); return im; };
    const B = mk(body), H = mk(head), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0), c = new THREE.Color();
    const TOG = ['#f5f1e6', '#f5f1e6', '#e7dcc3', '#b91c1c', '#1d4ed8', '#7c2d12', '#5b21b6', '#15803d', '#ca8a04', '#9a3412', '#334155', '#f5f1e6'], SK = ['#f5cd9b', '#e0ac69', '#c68642', '#8d5524', '#ffe0bd', '#f2c94c'];
    spots.forEach(([x, y, z, ry], i) => { Q.setFromAxisAngle(up, ry); V.set(x, y, z); M.compose(V, Q, S); B.setMatrixAt(i, M); H.setMatrixAt(i, M); B.setColorAt(i, c.set(TOG[Math.floor(rnd() * TOG.length)])); H.setColorAt(i, c.set(SK[Math.floor(rnd() * SK.length)])); });
    B.instanceMatrix.needsUpdate = H.instanceMatrix.needsUpdate = true; return n;
  }
  function buildColosseum() {
    const G = new THREE.Group(); place.add(G); const L = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {})), add = (geo, m, x = 0, y = 0, z = 0, par = G) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); par.add(o); return o; };
    const marble = L('#ece4d3'), trav = L('#d8c9a8'), bronze = metalMat('#b8763a', { shininess: 90 }), gold = metalMat('#e8b84a', { specular: '#fff2c0' }), dark = L('#2a2118');
    // the floor
    const fl = add(kg('duFloor', () => { const q = new THREE.CircleGeometry(1, 96); q.rotateX(-Math.PI / 2); return q; }), L('#ffffff', { map: sandTex() }), 0, 0.01, 0); fl.scale.set(A0 + 1.2, 1, B0 + 1.2);
    const solid = slab(0, 0, 0, 2 * (A0 + 4), 2 * (B0 + 4), 0xd9b77c, { sy: 2 }); solid.m.visible = false;
    // the podium wall, its rail and the bronze grille on top
    const pw = add(kg('duPodW', () => uvScale(new THREE.CylinderGeometry(1, 1, CH0 - 0.4, 128, 1, true), -16, 1)), L('#ffffff', { map: podiumTex(), side: THREE.BackSide }), 0, (CH0 - 0.4) / 2, 0); pw.scale.set(A0 + 1.25, 1, B0 + 1.25);
    const cap = add(kg('duPodCap', () => new THREE.CylinderGeometry(1, 1, 0.5, 128, 1, true)), L('#cfc6b2', { side: THREE.DoubleSide }), 0, CH0 - 0.15, 0); cap.scale.set(A0 + 1.5, 1, B0 + 1.5);
    const top = add(kg('duPodTop', () => { const q = new THREE.RingGeometry(1, 1.06, 128, 1); q.rotateX(-Math.PI / 2); return q; }), marble, 0, CH0 + 0.1, 0); top.scale.set(A0 + 1.3, 1, B0 + 1.3);
    const grill = add(kg('duGrill', () => uvScale(new THREE.CylinderGeometry(1, 1, 1.3, 128, 1, true), 90, 1)), L('#ffffff', { map: kCanvas('duGrillT', 64, 64, (g) => { g.clearRect(0, 0, 64, 64); g.fillStyle = '#7c4a22'; g.fillRect(0, 0, 64, 6); g.fillRect(0, 58, 64, 6); for (let x = 4; x < 64; x += 14) g.fillRect(x, 0, 5, 64); g.strokeStyle = '#7c4a22'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 32); g.lineTo(32, 6); g.lineTo(64, 32); g.lineTo(32, 58); g.closePath(); g.stroke(); }), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }), 0, CH0 + 0.75, 0); grill.scale.set(A0 + 1.9, 1, B0 + 1.9);
    // the seats and the crowd on them
    add(caveaGeo(), L('#ffffff', { vertexColors: true }));
    for (const s of [8, 17]) { const pr = add(kg('duPrae' + s, () => new THREE.CylinderGeometry(1, 1, 1.2, 128, 1, true)), L('#c8baa0', { side: THREE.DoubleSide }), 0, CH0 + s * CDH + 0.6, 0); pr.scale.set(A0 + 3 + (s + 1) * CDR, 1, B0 + 3 + (s + 1) * CDR); } // (the walls between tiers)
    CROWD.n = crowdMesh(G);
    // the outer wall: the arcades outside, plain stone inside; half-columns between the arches, cornices between storeys, the attic's masts
    const fo = add(kg('duFacO', () => uvScale(new THREE.CylinderGeometry(1, 1, FH, 128, 1, true), 64, 1)), L('#ffffff', { map: facadeTex() }), 0, FH / 2, 0); fo.scale.set(FA, 1, FB);
    const fi = add(kg('duFacI', () => uvScale(new THREE.CylinderGeometry(1, 1, FH - CH0 - CS * CDH + 2, 128, 1, true), 40, 1)), L('#ffffff', { map: facadeTex(), side: THREE.BackSide }), 0, CH0 + CS * CDH - 1 + (FH - CH0 - CS * CDH + 2) / 2, 0); fi.scale.set(FA - 0.8, 1, FB - 0.8);
    const fT = add(kg('duFacTop', () => { const q = new THREE.RingGeometry(0.985, 1.0, 128, 1); q.rotateX(-Math.PI / 2); return q; }), trav, 0, FH, 0); fT.scale.set(FA, 1, FB);
    const colG = kg('duCol', () => new THREE.CylinderGeometry(0.75, 0.82, 1, 12)), mastG = kg('duMast', () => new THREE.CylinderGeometry(0.16, 0.2, 7, 6)), NB = 64;
    const cols = new THREE.InstancedMesh(colG, trav, NB * 3), masts = new THREE.InstancedMesh(mastG, L('#7c5a36'), NB / 2), M = new THREE.Matrix4(), Sv = new THREE.Vector3(), Q = new THREE.Quaternion(), V = new THREE.Vector3();
    for (let k = 0; k < NB; k++) { const t = (k / NB) * Math.PI * 2 + Math.PI / NB * 0, x = Math.cos(t), z = Math.sin(t);
      for (let s = 0; s < 3; s++) { const sh = FH * (136 / 512), y0 = FH * (1 - (106 + s * 136 + 118) / 512); V.set(x * (FA + 0.35), y0 + sh / 2, z * (FB + 0.35)); Sv.set(1, sh, 1); M.compose(V, Q, Sv); cols.setMatrixAt(k * 3 + s, M); }
      if (k % 2 === 0) { V.set(x * (FA - 0.4), FH + 3.4, z * (FB - 0.4)); Sv.set(1, 1, 1); M.compose(V, Q, Sv); masts.setMatrixAt(k / 2, M); } }
    G.add(cols); G.add(masts); cols.userData.ownGeo = masts.userData.ownGeo = 0;
    for (const f of [106 - 18, 242 - 18, 378 - 18, 497]) { const y = FH * (1 - f / 512); const cr = add(kg('duCorn', () => new THREE.CylinderGeometry(1, 1, 0.7, 128, 1, false)), trav, 0, y, 0); cr.scale.set(FA + 0.75, 1, FB + 0.75); }
    // the velarium: awnings out from the top of the wall, with gaps, on ropes to the masts
    const aw = add(kg('duAwn', () => { const N = 64, pos = [], uv = [], idx = []; for (let k = 0; k < N; k++) { if (k % 4 === 3) continue; const t0 = (k / N) * Math.PI * 2, t1 = ((k + 1) / N) * Math.PI * 2, b = pos.length / 3;
        for (const [t, f, y] of [[t0, 1, 0], [t1, 1, 0], [t1, 0.8, -3.2], [t0, 0.8, -3.2]]) pos.push(Math.cos(t) * f, y, Math.sin(t) * f); uv.push(0, 1, 1, 1, 1, 0, 0, 0); idx.push(b, b + 2, b + 1, b, b + 3, b + 2); }
      const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); q.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); q.setIndex(idx); q.computeVertexNormals(); return q; }), L('#ffffff', { map: awningTex(), side: THREE.DoubleSide }), 0, FH + 5.5, 0);
    aw.scale.set(FA - 0.6, 1, FB - 0.6);
    // the gates at each end: a dark arch, a portcullis
    for (const s of [-1, 1]) { const g = new THREE.Group(); g.position.set(s * (A0 + 1.15), 0, 0); g.rotation.y = s * Math.PI / 2; G.add(g);
      add(BOX, dark, 0, 2.6, 0.2, g).scale.set(6, 5.2, 0.3); const ar = add(kg('duGateArch', () => new THREE.TorusGeometry(3.2, 0.35, 8, 20, Math.PI)), marble, 0, 3.3, -0.05, g); ar.scale.set(1, 0.9, 1);
      for (let k = -2; k <= 2; k++) add(BOX, L('#3f3f46'), k * 1.1, 2.6, -0.1, g).scale.set(0.16, 5.2, 0.16); for (let k = 0; k < 4; k++) add(BOX, L('#3f3f46'), 0, 0.8 + k * 1.3, -0.1, g).scale.set(5.2, 0.14, 0.14);
      for (const x of [-3.7, 3.7]) { add(kg('duPil', () => new THREE.CylinderGeometry(0.45, 0.5, 6.2, 12)), marble, x, 3.1, -0.3, g); add(BOX, marble, x, 6.3, -0.3, g).scale.set(1.2, 0.3, 1.2); } }
    // the emperor's box: a marble balcony on the north side, purple and gold, the emperor in his laurels between two guards
    const EB = new THREE.Group(); EB.position.set(0, CH0, -(B0 + 1.4)); G.add(EB);
    add(BOX, marble, 0, -0.2, -2.4, EB).scale.set(16, 0.5, 6); add(BOX, L('#5b21b6'), 0, 0.6, 0.15, EB).scale.set(15, 1.1, 0.25); add(BOX, gold, 0, 1.2, 0.2, EB).scale.set(15.3, 0.15, 0.4);
    for (const x of [-7.4, -2.5, 2.5, 7.4]) { add(kg('duEbCol', () => new THREE.CylinderGeometry(0.32, 0.36, 6.5, 12)), marble, x, 3.0, 0.2, EB); add(BOX, gold, x, 6.3, 0.2, EB).scale.set(0.9, 0.25, 0.9); }
    const can = add(kg('duCanopy', () => { const q = new THREE.PlaneGeometry(16.5, 6.5, 12, 1); const p = q.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.6 * Math.sin((p.getX(i) / 16.5 + 0.5) * Math.PI * 6)); q.computeVertexNormals(); q.rotateX(-Math.PI / 2 + 0.25); return q; }), L('#ffffff', { map: awningTex(), side: THREE.DoubleSide }), 0, 6.9, -2.2, EB);
    const eagle = add(kg('duEagle', () => ovShape('duEagleS', [[0, 0.9], [0.35, 0.45], [1.2, 0.75], [0.8, 0.2], [1.1, 0.0], [0.35, 0.05], [0.25, -0.6], [0, -0.45], [-0.25, -0.6], [-0.35, 0.05], [-1.1, 0.0], [-0.8, 0.2], [-1.2, 0.75], [-0.35, 0.45]], 0.12, 0.03)), gold, 0, 8.1, 0.3, EB); eagle.scale.setScalar(1.4);
    const ban = add(kg('duEbBan', () => new THREE.PlaneGeometry(2.4, 5.5)), L('#ffffff', { map: bannerTex(0), side: THREE.DoubleSide }), 0, -2.4, 0.32, EB); ban.position.set(0, -2.9, 0.42);
    // the four empires' banners down the podium wall, all round; braziers on top
    const BG = kg('duBanG', () => { const q = new THREE.PlaneGeometry(2.0, 5.2, 1, 6); const p = q.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.12 * Math.sin(p.getY(i) * 1.5)); q.computeVertexNormals(); return q; });
    const banM = [0, 1, 2, 3].map((e) => L('#ffffff', { map: bannerTex(e), side: THREE.DoubleSide }));
    SC.fires = [];
    for (let k = 0; k < 20; k++) { const t = (k / 20) * Math.PI * 2 + Math.PI / 20, x = Math.cos(t), z = Math.sin(t); if (Math.abs(z) < 0.3) continue; if (z < -0.95) continue;
      const b = add(BG, banM[k % 4], x * (A0 + 1.0), CH0 - 3.0, z * (B0 + 1.0)); b.lookAt(0, CH0 - 3, 0);
      if (k % 2 === 0) { const bz = new THREE.Group(); bz.position.set(x * (A0 + 1.7), CH0 + 0.2, z * (B0 + 1.7)); G.add(bz); add(kg('duTripod', () => new THREE.CylinderGeometry(0.15, 0.4, 1.6, 6)), bronze, 0, 0.8, 0, bz);
        add(kLathe('duBowl', [[0.1, 0], [0.8, 0.35], [1.05, 0.75], [1.12, 0.85], [0.95, 0.8], [0.1, 0.4]], 18), bronze, 0, 1.55, 0, bz);
        const fl = [0, 1, 2].map((j) => { const f = emSprite(bz, fxTex('flame'), 1.2, { blending: THREE.AdditiveBlending }); f.position.set((j - 1) * 0.35, 2.7, 0); return f; }); const gl = kitGlow(bz, '#fb923c', 5, 0.55); gl.position.y = 2.6; SC.fires.push({ fl, gl, ph: k }); } }
    // standards on the gates' posts and over the seats: the four empires' banners on poles
    return G;
  }
  // a crate for a shrine: a chest in its empire's colours, bound in metal, its emblem on the front, light in its seams
  function crateModel(e) {
    const g = new THREE.Group(), [c1, c2] = [['#7f1d1d', '#e8b84a'], ['#1e3a8a', '#e2e8f0'], ['#374151', '#93c5fd'], ['#450a0a', '#fca5a5']][e];
    const wood = new THREE.MeshLambertMaterial({ color: c1, map: woodTex() }), band = metalMat(e === 1 || e === 2 ? '#cbd5e1' : '#e8b84a', { shininess: 110 }), glow = new THREE.MeshBasicMaterial({ color: c2 });
    const add = (geo, m, x, y, z, sx, sy, sz) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); g.add(o); return o; };
    add(rboxGeo(3, 2, 2.2, 0.12), wood, 0, 1, 0, 1, 1, 1); const lid = add(kg('duLid', () => { const q = new THREE.CylinderGeometry(1.1, 1.1, 3, 20, 1, false, 0, Math.PI); q.rotateZ(Math.PI / 2); return q; }), wood, 0, 2, 0, 1, 0.55, 1);
    for (const x of [-1.2, 0, 1.2]) { add(BOX, band, x, 1, 0, 0.18, 2.06, 2.28); } add(BOX, glow, 0, 2.02, 0, 3.02, 0.05, 2.24);
    const em = add(kg('duEmb', () => new THREE.CircleGeometry(0.5, 24)), new THREE.MeshBasicMaterial({ map: kCanvas('duEmbT' + e, 128, 128, (q) => { q.fillStyle = c2; q.beginPath(); q.arc(64, 64, 62, 0, 7); q.fill(); q.font = 'bold 76px serif'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(EMP[e].e, 64, 70); }) }), 0, 1.15, -1.12, 1, 1, 1); em.rotation.y = Math.PI;
    const gl = kitGlow(g, c2, 6, 0.35); gl.position.y = 1.6; g.userData.gl = gl; return g;
  }
  function buildLobby() {
    const G = new THREE.Group(); place.add(G); const L = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {})), add = (geo, m, x = 0, y = 0, z = 0, par = G) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); par.add(o); return o; };
    const marble = L('#ece4d3'), trav = L('#d8c9a8'), gold = metalMat('#e8b84a', { specular: '#fff2c0' }), bronze = metalMat('#b8763a', { shininess: 90 }), zc = (LOBBY.z0 + LOBBY.z1) / 2, W = LOBBY.x * 2, D = LOBBY.z1 - LOBBY.z0;
    // the ground all round and the road to the Colosseum's gate
    const gr = add(kg('duGroundG', () => { const q = new THREE.PlaneGeometry(1, 1); q.rotateX(-Math.PI / 2); return q; }), L('#ffffff', { map: groundTex() }), 0, -0.04, 45); gr.scale.set(170, 1, 240); gr.material.map.repeat.set(10, 14);
    const rd = add(kg('duRoad', () => { const q = new THREE.PlaneGeometry(1, 1); q.rotateX(-Math.PI / 2); return q; }), L('#ffffff', { map: paveTex() }), 0, -0.01, (FB + LOBBY.z0) / 2); rd.scale.set(12, 1, LOBBY.z0 - FB + 2); rd.material.map.repeat.set(2, 6);
    const fl = slab(0, 0, zc, W, D, 0xcbbd9d, { sy: 1 }); fl.m.material = L('#ffffff', { map: paveTex() }); fl.m.material.map.repeat.set(10, 7); // (the courtyard's paving)
    // walls you can't get past, a colonnade on top so you see the Colosseum over it
    for (const [x, z, sx, sz] of [[0, LOBBY.z0, W + 2, 1], [0, LOBBY.z1, W + 2, 1], [-LOBBY.x, zc, 1, D], [LOBBY.x, zc, 1, D]]) { const w = part({ x, y: 4, z, sx, sy: 8, sz }); w.m.visible = false;
      const rail = add(BOX, trav, x, 0.8, z); rail.scale.set(sx, 1.6, sz); const cap = add(BOX, marble, x, 1.68, z); cap.scale.set(sx + 0.3, 0.16, sz + 0.3);
      const n = Math.round(Math.max(sx, sz) / 6); for (let k = 0; k <= n; k++) { const f = k / n - 0.5, cx = sx > sz ? x + f * sx : x, cz = sx > sz ? z : z + f * sz; add(kg('duLCol', () => new THREE.CylinderGeometry(0.4, 0.46, 6, 12)), marble, cx, 4.6, cz); add(BOX, marble, cx, 7.7, cz).scale.set(1.1, 0.3, 1.1); }
      const ent = add(BOX, trav, x, 8.2, z); ent.scale.set(sx + 0.6, 0.7, sz + 0.6); }
    // the pads: a ring of bronze, the arena's sand inside, its name over it
    SC.padFx = PADS.map((p, i) => { const g = new THREE.Group(); g.position.set(p.x, 0.02, p.z); G.add(g);
      const r = add(kg('duPadRing', () => { const q = new THREE.RingGeometry(5.2, 6.0, 48); q.rotateX(-Math.PI / 2); return q; }), bronze, 0, 0.05, 0, g); const s = add(kg('duPadIn', () => { const q = new THREE.CircleGeometry(5.2, 48); q.rotateX(-Math.PI / 2); return q; }), L('#ffffff', { map: sandTex() }), 0, 0.04, 0, g);
      const glow = add(kg('duPadGlow', () => { const q = new THREE.RingGeometry(5.9, 6.6, 48); q.rotateX(-Math.PI / 2); return q; }), new THREE.MeshBasicMaterial({ color: i ? '#ef4444' : '#f59e0b', transparent: true, opacity: 0.6, depthWrite: false }), 0, 0.07, 0, g);
      for (const x of [-6.6, 6.6]) { add(kg('duPadPost', () => new THREE.CylinderGeometry(0.35, 0.4, 7, 10)), marble, x, 3.5, 0, g); const f = emSprite(g, fxTex('flame'), 1.6, { blending: THREE.AdditiveBlending }); f.position.set(x, 7.9, 0); add(kLathe('duBowl', [[0.1, 0], [0.8, 0.35], [1.05, 0.75], [1.12, 0.85], [0.95, 0.8], [0.1, 0.4]], 18), bronze, x, 7, 0, g).scale.setScalar(0.7); }
      const lb = label(p.n, { size: 2.2, color: '#fff' }); lb.position.set(0, 9.6, 0); g.add(lb); const sb = label(p.s, { size: 1.1, color: '#fde68a' }); sb.position.set(0, 8.2, 0); g.add(sb);
      return { g, glow, ring: r }; });
    // the crate shrines
    SC.crates = SHRINES.map((s) => { const g = new THREE.Group(); g.position.set(s.x, 0, s.z); G.add(g); const pd = part({ x: s.x, y: 1.2, z: s.z, sx: 5, sy: 2.4, sz: 5, c: 0xd8c9a8 }); pd.m.material = trav;
      add(BOX, marble, 0, 2.5, 0, g).scale.set(5.6, 0.3, 5.6); const c = crateModel(s.e); c.position.y = 3.6; g.add(c);
      const lb = label(`${EMP[s.e].e} ${EMP[s.e].n.toUpperCase()} CRATE`, { size: 1.5, color: '#fff' }); lb.position.set(0, 9.2, 0); g.add(lb); const pl = label(`🪙 ${CRATE_PRICE}`, { size: 1.1, color: '#fde68a' }); pl.position.set(0, 8, 0); g.add(pl);
      return { g, c, e: s.e }; });
    // the armory: a weapon rack; the bot gate: an arch; the tablet of achievements
    const rack = new THREE.Group(); rack.position.set(ARMORY.x, 0, ARMORY.z); rack.rotation.y = Math.PI / 2; G.add(rack); add(BOX, L('#7c5a36', { map: woodTex() }), 0, 2.2, 0, rack).scale.set(7, 0.3, 0.4); add(BOX, L('#7c5a36', { map: woodTex() }), 0, 0.6, 0, rack).scale.set(7, 0.3, 0.4);
    for (const x of [-3.4, 3.4]) add(BOX, L('#7c5a36', { map: woodTex() }), x, 1.8, 0, rack).scale.set(0.35, 3.6, 0.5);
    [['gladius', 0], ['katana', 1], ['great', 2], ['xiphos', 3], ['spatha', 4]].forEach(([k, j]) => { const h = new THREE.Group(); h.position.set(-2.6 + j * 1.3, 0.5, 0); h.rotation.x = -Math.PI / 2; rack.add(h); dgSword(h, k, { tsuba: k === 'katana' }).scale.setScalar(0.8); });
    const lb1 = label('⚔️ FIGHTERS', { size: 1.8, color: '#fff' }); lb1.position.set(ARMORY.x, 6, ARMORY.z); G.add(lb1);
    const arch = new THREE.Group(); arch.position.set(BOTGATE.x, 0, BOTGATE.z); arch.rotation.y = -Math.PI / 2; G.add(arch); for (const x of [-3, 3]) add(BOX, trav, x, 3, 0, arch).scale.set(1.2, 6, 1.2); add(kg('duGateArch', () => new THREE.TorusGeometry(3.2, 0.35, 8, 20, Math.PI)), marble, 0, 6, 0, arch).scale.set(0.95, 0.7, 2.5);
    add(BOX, new THREE.MeshBasicMaterial({ color: '#1e1b4b' }), 0, 3, 0, arch).scale.set(4.8, 6, 0.2);
    const lb2 = label('🤖 FIGHT A BOT', { size: 1.8, color: '#fff' }); lb2.position.set(BOTGATE.x, 9.4, BOTGATE.z); G.add(lb2);
    const tab = part({ x: TABLET.x, y: 2.5, z: TABLET.z, sx: 7, sy: 5, sz: 1, c: 0xe9e1d0 }); tab.m.material = new THREE.MeshLambertMaterial({ color: '#ffffff', map: kCanvas('duTablet', 256, 192, (g) => { g.fillStyle = '#e9e1d0'; g.fillRect(0, 0, 256, 192); g.strokeStyle = '#b8ad97'; g.lineWidth = 8; g.strokeRect(8, 8, 240, 176); g.fillStyle = '#6b5a3e'; g.font = 'bold 26px serif'; g.textAlign = 'center'; g.fillText('HONORES', 128, 50); g.font = '17px serif'; for (let k = 0; k < 5; k++) g.fillRect(48, 76 + k * 20, 160, 3); }) });
    const lb3 = label('🏆 ACHIEVEMENTS', { size: 1.6, color: '#fff' }); lb3.position.set(TABLET.x, 6.6, TABLET.z); G.add(lb3);
    // the four legends on plinths at the corners, in their guard
    SC.legends = [[4, -41, 151], [9, 41, 151], [14, -41, 97], [19, 41, 97]].map(([c, x, z]) => [c, x, z, angOf(-x, 124 - z)]).map(([c, x, z, ry]) => { const pd = part({ x, y: 1.5, z, sx: 4, sy: 3, sz: 4, c: 0xece4d3 }); pd.m.material = marble;
      const a = makeAvatar([1, 0, 0, 0, 17, 0, 0, 0, 0, 0, 23 + c, 15 + c], '', true); scene.remove(a.shadow); a.g.position.set(x, 3, z); a.g.rotation.y = ry; G.add(a.g); for (let k = 0; k < 25; k++) animateAvatar(a, 0.1, false, false);
      const lb = label(`${DUEL_IC[c]} ${DUEL_N[c]}`, { size: 1.1, color: '#fbbf24' }); lb.position.set(x, 11.4, z); G.add(lb); return a; });
    return G;
  }

  /* ---------------- fighting ----------------
     A fighter: whose (me, a bot, or the other player — 'rem', whose numbers come from them), its health and stamina,
     cooldowns, what it's doing (act) and what's been done to it (S: stun, root, slow, the damage-over-time, buffs, the
     dodge's moment of not being hit). Bots and I take hits here; the other player takes the hits I send them. */
  const lerp = (a, b, k) => a + (b - a) * k, ease = (k) => smooth(clamp(k, 0, 1));
  function newFighter(c, kind, o = {}) {
    const C = CH[c], hm = o.hpM || 1;
    return { c, C, kind, name: o.name || C.n, hp: Math.round(C.hp * hm), mhp: Math.round(C.hp * hm), st: 100, rest: 0, cd: [0, 0, 0], cdMax: [1, 1, 1], mode: 0, act: null, blk: false, nx: 0,
      S: { stun: 0, root: 0, slow: 0, slowM: 1, vuln: 0, ifr: 0, dots: [], buffs: [] }, dmgM: o.dmgM || 1, D: o.D, peer: o.peer || null, x: 0, y: 0, z: 0, yaw: 0, dead: false, acN: 0, kb: null, a: null, deaths: 0 };
  }
  const MULT = new Set(['def', 'dmgM', 'spdM', 'cdM']), SUM = new Set(['dmgA', 'ls', 'rf', 'hps']);
  function bval(F, k) { let v = MULT.has(k) ? 1 : 0; for (const b of F.S.buffs) { const q = b[k]; if (q == null) continue; if (MULT.has(k)) v *= q; else if (SUM.has(k)) v += q; else v = Math.max(v, q); } return v; }
  function abOf(F, i) { const ab = F.C.ab[i]; if (ab.modes) { const m = ab.modes[Math.min(F.mode, ab.modes.length - 1)]; return Object.assign({}, ab, m, { k: 'melee' }); } return ab; }
  function actDur(ab) {
    const w = ab.wind || 0;
    switch (ab.k) {
      case 'melee': return w + (ab.an === 'stab' ? 0.55 : ab.an === 'overhead' || ab.an === 'smite' ? 0.45 : 0.32);
      case 'multi': case 'combo': return w + ab.gap * (ab.hits.length - 1) + 0.34;
      case 'proj': return w + (ab.cnt > 1 && ab.gap ? ab.gap * (ab.cnt - 1) : 0) + 0.3;
      case 'dash': return w + ab.dd + (ab.then ? 0.45 : 0.25);
      case 'leap': return w + 0.62 + 0.32;
      case 'volley': return w + 0.45;
      default: return ab.b && ab.b.blk ? ab.b.dur : 0.8;
    }
  }
  const stunned = (F) => F.S.stun > 0;
  /* ---------------- the effects ---------------- */
  function sparks(F, col, n = 8, y = 3.4, o = {}) { if (!F.a || F.a.dead || F.a.g.parent !== scene) return; for (let q = 0; q < n; q++) kitSpark(F.a, F.a.g, (Math.random() - 0.5) * 1.4, y + (Math.random() - 0.5) * 1.2, -0.6 + (Math.random() - 0.5), col, Object.assign({ v: [(Math.random() - 0.5) * 9, 2 + Math.random() * 6, (Math.random() - 0.5) * 9], life: 0.45, s: 0.32, g: 18, j: 2 }, o)); }
  function burstAt(x, y, z, col, s = 3, life = 0.35) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); m.position.set(x, y, z); m.scale.setScalar(s);
    m.userData = { v: new THREE.Vector3(), life, g: 0, spinless: 1, tick: (o, u) => { const k = Math.max(0, u.life / life); o.material.opacity = k; o.scale.setScalar(s * (1.6 - 0.6 * k)); } }; scene.add(m); bits.push(m); }
  function smokeAt(x, y, z, n = 10, col = '#9ca3af', s = 2.2) { for (let q = 0; q < n; q++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: col, transparent: true, depthWrite: false, opacity: 0.8 })); m.position.set(x + (Math.random() - 0.5) * 2, y + Math.random() * 2, z + (Math.random() - 0.5) * 2); const s0 = s * (0.7 + Math.random() * 0.6); m.scale.setScalar(s0);
    m.userData = { v: new THREE.Vector3((Math.random() - 0.5) * 4, 1 + Math.random() * 2, (Math.random() - 0.5) * 4), life: 1.4 + Math.random() * 0.6, g: 0, spinless: 1, tick: (o, u) => { o.material.opacity = Math.min(0.75, u.life * 0.6); o.scale.setScalar(s0 * (2.2 - u.life * 0.6)); } }; scene.add(m); bits.push(m); } }
  function ringAt(x, z, col, size, life = 0.5) { const m = new THREE.Mesh(SHOCK_GEO, new THREE.MeshBasicMaterial({ color: col, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); m.position.set(x, 0.12, z); m.rotation.x = -Math.PI / 2;
    m.userData = { v: new THREE.Vector3(), life, g: 0, spinless: 1, tick: (o, u) => { const k = 1 - u.life / life; o.scale.setScalar(0.4 + size * (1 - Math.pow(1 - k, 2.5))); o.material.opacity = 0.9 * (1 - k); } }; scene.add(m); bits.push(m); }
  function beamAt(x, z, col, h = 30, life = 0.8, r = 1.6) { const m = new THREE.Mesh(kg('duBeam', () => { const q = new THREE.CylinderGeometry(1, 1, 1, 18, 1, true); q.translate(0, 0.5, 0); return q; }), new THREE.MeshBasicMaterial({ color: col, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    m.position.set(x, 0, z); m.scale.set(r, h, r); m.userData = { v: new THREE.Vector3(), life, g: 0, spinless: 1, tick: (o, u) => { const k = u.life / life; o.material.opacity = 0.75 * k; o.scale.x = o.scale.z = r * (0.3 + k); } }; scene.add(m); bits.push(m); }
  function slashLine(x0, z0, x1, z1, col) { const m = new THREE.Mesh(kg('duSlashL', () => { const q = new THREE.PlaneGeometry(1, 1); q.rotateX(-Math.PI / 2); return q; }), new THREE.MeshBasicMaterial({ color: col, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    const L = Math.hypot(x1 - x0, z1 - z0); m.position.set((x0 + x1) / 2, 3.2, (z0 + z1) / 2); m.rotation.y = Math.atan2(x1 - x0, z1 - z0); m.scale.set(0.2, 1, L + 2);
    m.userData = { v: new THREE.Vector3(), life: 0.5, g: 0, spinless: 1, tick: (o, u) => { o.material.opacity = u.life * 2; o.scale.x = 0.35 + (0.5 - u.life) * 1.5; } }; scene.add(m); bits.push(m); }
  const HUD = { el: null };
  function toScreen(x, y, z) { const v = new THREE.Vector3(x, y, z).project(camera); if (v.z > 1) return null; const r = renderer.domElement.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; }
  function floatText(F, text, cls = '') { const p = toScreen(F.x + (Math.random() - 0.5) * 1.5, F.y + 7 + Math.random(), F.z); if (!p) return; const d = document.createElement('div'); d.className = 'du-dmg ' + cls; d.textContent = text; d.style.left = p.x + 'px'; d.style.top = p.y + 'px'; $('#xhud').append(d); setTimeout(() => d.remove(), 950); }
  // the weapon's trail: a ribbon from the hand to the tip, a few frames long, fading
  function trailTick(F, on) {
    const a = F.a; if (!a || !a.dg) return; let T = a.duTrail;
    if (!T) { const n = 14, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3)); const idx = []; for (let i = 0; i < n - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); g.setIndex(idx);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); m.frustumCulled = false; scene.add(m); T = a.duTrail = { m, h: [], n, col: new THREE.Color(COL[F.c]) }; a.duTrailOwn = m; }
    const w = a.dg.R[Math.min(F.mode, a.dg.R.length - 1)], tip = w && w.userData.tip;
    if (on && tip && w.visible) { const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(); a.dg.hR.getWorldPosition(p0); tip.getWorldPosition(p1); T.h.unshift([p0, p1]); } else T.h.pop();
    if (T.h.length > T.n) T.h.length = T.n;
    const P = T.m.geometry.attributes.position, Cc = T.m.geometry.attributes.color; T.m.visible = T.h.length > 1;
    for (let i = 0; i < T.n; i++) { const s = T.h[Math.min(i, T.h.length - 1)]; if (!s) continue; const k = Math.max(0, 1 - i / T.n);
      P.setXYZ(i * 2, lerp(s[0].x, s[1].x, 0.35), lerp(s[0].y, s[1].y, 0.35), lerp(s[0].z, s[1].z, 0.35)); P.setXYZ(i * 2 + 1, s[1].x, s[1].y, s[1].z); const q = k * k * 0.6; Cc.setXYZ(i * 2, T.col.r * q * 0.15, T.col.g * q * 0.15, T.col.b * q * 0.15); Cc.setXYZ(i * 2 + 1, T.col.r * q, T.col.g * q, T.col.b * q); }
    P.needsUpdate = Cc.needsUpdate = true;
  }
  function dropTrail(a) { if (a && a.duTrail) { scene.remove(a.duTrail.m); a.duTrail.m.geometry.dispose(); a.duTrail.m.material.dispose(); a.duTrail = null; } }
  // a buff's look on the fighter: a coloured glow round them, and for some a shield of light
  const BUFFLOOK = { testudo: ['#fde68a', 1], aspis: ['#93c5fd', 1], shieldup: ['#93c5fd', 1], berserk: ['#ef4444'], hype: ['#fbbf24'], wrath: ['#38bdf8'], molon: ['#f59e0b', 1], rally: ['#4ade80'], roar: ['#dc2626'], pray: ['#fef3c7'], fortress: ['#cbd5e1', 1], resolve: ['#fda4af'], smoke: ['#6b7280'], benkei: ['#facc15'] };
  function buffLook(F) {
    const a = F.a; if (!a || a.dead) return; const B = F.S.buffs.filter((b) => b.an && BUFFLOOK[b.an]), on = B.length > 0 && !bval(F, 'inv');
    let L = a.duAura; if (!L && on) { L = a.duAura = { gl: kitGlow(a.g, '#ffffff', 6, 0.3), sh: new THREE.Mesh(kg('duBubble', () => new THREE.SphereGeometry(4.2, 28, 18)), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })) }; L.gl.position.y = 3.2; L.sh.position.y = 3.3; a.g.add(L.sh); }
    if (!L) return; L.gl.visible = on; L.sh.visible = on && B.some((b) => BUFFLOOK[b.an][1]);
    if (on) { const col = BUFFLOOK[B[B.length - 1].an][0]; L.gl.material.color.set(col); L.sh.material.color.set(col); const t = now(); L.gl.material.opacity = 0.16 + 0.07 * Math.sin(t * 8); L.sh.material.opacity = 0.12 + 0.05 * Math.sin(t * 5); L.sh.rotation.y = t;
      if (Math.random() < 0.25) kitSpark(a, a.g, (Math.random() - 0.5) * 3, 0.5 + Math.random() * 4, (Math.random() - 0.5) * 3, col, { v: [0, 2.5 + Math.random() * 2, 0], life: 0.8, s: 0.25, j: 0.5 }); }
  }
  // stars round the head of the stunned; flames on the burning; blood on the bleeding; a net on the rooted
  function statusLook(F, dt) {
    const a = F.a; if (!a || a.dead || a.g.parent !== scene) return; const t = now();
    if (F.S.stun > 0 && Math.random() < dt * 14) { const an = t * 6 + Math.random(); kitSpark(a, a.g, Math.cos(an) * 1.1, 7.0, Math.sin(an) * 1.1, '#fde047', { v: [0, 0.3, 0], life: 0.35, s: 0.45, j: 0 }); }
    if (F.S.dots.some((d) => d.k === 'bu') && Math.random() < dt * 18) kitSpark(a, a.g, (Math.random() - 0.5) * 1.6, 1 + Math.random() * 4, (Math.random() - 0.5) * 1.2, Math.random() < 0.5 ? '#f97316' : '#fde047', { v: [0, 3, 0], life: 0.5, s: 0.45, j: 0.4 });
    if (F.S.dots.some((d) => d.k === 'bl') && Math.random() < dt * 10) kitSpark(a, a.g, (Math.random() - 0.5) * 1.4, 2.5 + Math.random() * 2, (Math.random() - 0.5) * 1, '#b91c1c', { v: [0, -2, 0], life: 0.5, s: 0.22, j: 0.3, flat: true, g: 10 });
    if (F.S.slow > 0 && Math.random() < dt * 8) kitSpark(a, a.g, (Math.random() - 0.5) * 2, 0.3, (Math.random() - 0.5) * 2, '#7dd3fc', { v: [0, 1, 0], life: 0.6, s: 0.4, j: 0.3 });
    if (F.S.root > 0) { if (!a.duNet) { const n = new THREE.Mesh(kg('duNetWrap', () => new THREE.CylinderGeometry(1.4, 1.7, 4.5, 14, 4, true)), new THREE.MeshLambertMaterial({ map: dgNetTex(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide })); n.position.y = 2.3; a.g.add(n); a.duNet = n; } a.duNet.visible = true; }
    else if (a.duNet) a.duNet.visible = false;
  }
  /* ---------------- the abilities' animations ----------------
     Each one a wind-up pose (W) and the blow (S), set over the fighter's own stance; a multi-hit one has a pair for
     each hit. Joints: aR aL (shoulders), eR eL (elbows), wr (the right wrist: turns what's held), bd (the body),
     hd (the head), lL lR (hips), kL kR (knees); up drops the body. Angles: x forward, y turn, z out */
  const AN = {
    thrust: [{ aR: [0.4, 0, 0.3], eR: [1.7], wr: [-1.4], bd: [0.05, -0.35, 0] }, { aR: [1.45, 0, -0.05], eR: [0.1], wr: [-1.5], bd: [-0.3, 0.4, 0], lL: [0.55], kL: [-0.4], lR: [-0.3] }],
    jab: [{ aR: [0.9, 0, 0.4], eR: [1.4], bd: [0, -0.3, 0] }, { aR: [1.5, 0, 0], eR: [0.05], bd: [-0.25, 0.3, 0], lL: [0.4], kL: [-0.3] }],
    lunge: [{ aR: [0.7, 0, 0.3], eR: [1.5], aL: [0.9, 0, 0.6], eL: [1.3], bd: [0.1, -0.4, 0] }, { aR: [1.5, 0, 0], eR: [0], aL: [1.4, 0, 0.4], eL: [0.6], bd: [-0.4, 0.3, 0], lL: [0.7], kL: [-0.6], lR: [-0.4] }],
    overhand: [{ aR: [2.5, 0, 0.25], eR: [1.0], wr: [-1.9], bd: [0.1, -0.3, 0] }, { aR: [1.8, 0, 0], eR: [0.1], wr: [-0.3], bd: [-0.3, 0.3, 0], lL: [0.45], kL: [-0.4] }],
    spear: [{ aR: [2.5, 0, 0.3], eR: [1.1], wr: [-1.9], aL: [1.3, 0, -0.1], eL: [1.1], bd: [0.15, -0.45, 0] }, { aR: [1.9, 0, 0], eR: [0.1], wr: [-0.4], aL: [1.2, 0, 0.2], eL: [1.2], bd: [-0.45, 0.4, 0], lL: [0.65], kL: [-0.65], lR: [-0.35] }],
    spear2: [{ aR: [0.6, 0.2, 0.2], eR: [1.4], aL: [1.0, 0.3, 0.3], eL: [0.9], bd: [0.1, -0.3, 0] }, { aR: [1.3, 0, 0], eR: [0.3], aL: [1.4, 0.2, 0.2], eL: [0.3], bd: [-0.35, 0.2, 0], lL: [0.6], kL: [-0.5] }],
    slash: [{ aR: [1.4, 0, 1.2], eR: [0.5], wr: [-0.6], bd: [0, -0.6, 0] }, { aR: [1.2, 0, -0.6], eR: [0.3], wr: [-0.9], bd: [-0.15, 0.6, 0], lL: [0.35], kL: [-0.3] }],
    slash2: [{ aR: [2.5, 0, 0.5], eR: [0.6], aL: [2.4, 0, -0.2], eL: [0.6], bd: [0.1, -0.4, 0] }, { aR: [0.7, 0, -0.4], eR: [0.2], aL: [0.8, 0, 0.2], eL: [0.3], bd: [-0.35, 0.45, 0], lL: [0.4], kL: [-0.4] }],
    sica: [{ aR: [1.0, 0, 1.4], eR: [1.2], wr: [0.6], bd: [0, -0.7, 0], aL: [1.1, 0, -0.2], eL: [1.1] }, { aR: [1.4, 0, -0.9], eR: [0.2], wr: [-1.0], bd: [-0.25, 0.7, 0], lL: [0.5], kL: [-0.4], aL: [0.9, 0, 0.3], eL: [1.2] }],
    katana: [{ aR: [2.7, 0.2, 0.3], eR: [0.7], aL: [2.6, 0.3, -0.1], eL: [0.7], bd: [0.1, -0.3, 0] }, { aR: [0.9, 0, -0.2], eR: [0.15], aL: [1.0, 0.2, 0.2], eL: [0.2], bd: [-0.3, 0.4, 0], lL: [0.45], kL: [-0.45], lR: [-0.25] }],
    quick: [{ aR: [1.2, 0, 0.9], eR: [1.2], bd: [0, -0.4, 0] }, { aR: [1.1, 0, -0.8], eR: [0.2], bd: [-0.2, 0.5, 0], lL: [0.4], kL: [-0.3] }],
    naginata: [{ aR: [1.2, 0.3, 1.0], eR: [0.5], aL: [1.0, 0.3, 0.6], eL: [0.8], bd: [0, -0.9, 0] }, { aR: [1.2, -0.3, -0.8], eR: [0.3], aL: [1.0, 0, -0.4], eL: [0.6], bd: [-0.2, 0.9, 0], lL: [0.5], kL: [-0.4] }],
    chop: [{ aR: [2.9, 0, 0.4], eR: [1.2], bd: [0.2, -0.3, 0] }, { aR: [0.6, 0, -0.3], eR: [0.2], bd: [-0.45, 0.3, 0], lL: [0.5], kL: [-0.5] }],
    overhead: [{ aR: [3.0, 0.2, 0.2], eR: [0.9], aL: [2.9, 0.3, -0.2], eL: [0.9], bd: [0.25, 0, 0], hd: [0.2] }, { aR: [0.5, 0, 0], eR: [0.1], aL: [0.6, 0.2, 0.1], eL: [0.2], bd: [-0.6, 0, 0], lL: [0.6], kL: [-0.8], lR: [-0.3], kR: [-0.3], up: -0.3 }],
    smite: [{ aR: [3.1, 0.1, 0.1], eR: [0.4], aL: [3.0, 0.2, -0.1], eL: [0.4], bd: [0.3, 0, 0], hd: [0.4], up: 0.2 }, { aR: [0.5, 0, 0], eR: [0.1], aL: [0.6, 0.2, 0.1], eL: [0.2], bd: [-0.65, 0, 0], lL: [0.7], kL: [-0.9], lR: [-0.3], kR: [-0.4], up: -0.4 }],
    swing: [{ aR: [1.3, 0.4, 1.3], eR: [0.4], aL: [1.2, 0.5, 0.9], eL: [0.6], bd: [0, -1.0, 0] }, { aR: [1.2, -0.4, -1.0], eR: [0.3], aL: [1.1, -0.2, -0.5], eL: [0.5], bd: [-0.15, 1.0, 0], lL: [0.4], kL: [-0.3] }],
    stab: [{ aR: [0.3, 0, 0.4], eR: [1.9], wr: [-1.5], aL: [0.6, 0.4, 0.3], eL: [1.6], bd: [0.1, -0.6, 0], up: -0.45, kL: [-0.8], kR: [-0.8], lL: [0.4] }, { aR: [1.5, 0, 0], eR: [0.05], wr: [-1.5], aL: [1.3, 0.4, 0.2], eL: [0.6], bd: [-0.5, 0.2, 0], lL: [0.9], kL: [-0.9], lR: [-0.5], up: -0.25 }],
    bash: [{ aL: [0.9, 0, 0.6], eL: [1.4], bd: [0.1, 0.4, 0] }, { aL: [1.5, 0, 0.2], eL: [0.4], bd: [-0.3, -0.5, 0], lL: [0.6], kL: [-0.5] }],
    pommel: [{ aR: [2.3, 0, 0.2], eR: [2.0], aL: [2.2, 0.2, -0.2], eL: [1.9], bd: [0.15, 0, 0] }, { aR: [1.2, 0, 0], eR: [1.6], aL: [1.2, 0, 0], eL: [1.6], bd: [-0.45, 0, 0], lL: [0.4] }],
    kick: [{ lR: [-0.4], kR: [-1.4], bd: [0.2, 0, 0], aL: [1.2, 0, -0.1], eL: [1.1] }, { lR: [1.7], kR: [0], bd: [0.4, 0, 0], aR: [0.4, 0, 0.7], aL: [1.0, 0, -0.3], hd: [-0.1] }],
    throw: [{ aR: [2.7, 0, 0.3], eR: [1.3], wr: [-2.3], aL: [1.4, 0, -0.2], eL: [0.1], bd: [0.2, -0.5, 0], lL: [0.5] }, { aR: [1.1, 0, 0], eR: [0.1], wr: [0], aL: [0.4, 0, -0.3], bd: [-0.35, 0.4, 0], lR: [-0.3] }],
    net: [{ aL: [0.6, 0, -1.2], eL: [0.3], bd: [0, 0.7, 0] }, { aL: [1.4, 0, 0.4], eL: [0.2], bd: [-0.1, -0.6, 0], lL: [0.4] }],
    fan: [{ aR: [1.3, 0, -0.9], eR: [1.5], bd: [0, 0.4, 0] }, { aR: [1.3, 0, 0.9], eR: [0.1], bd: [0, -0.4, 0] }],
    bow: [{ aL: [1.55, 0, 0.05], eL: [0.05], aR: [1.5, 0.5, 0.35], eR: [2.1], bd: [0, -0.5, 0], hd: [0, 0.45, 0] }, { aL: [1.55, 0, 0.05], eL: [0.05], aR: [1.4, 0.6, 0.8], eR: [1.0], bd: [0, -0.5, 0], hd: [0, 0.45, 0] }],
    draw: [{ aL: [1.6, 0, 0.05], eL: [0], aR: [1.5, 0.6, 0.45], eR: [2.3], bd: [0.05, -0.6, 0], hd: [0, 0.5, 0], lL: [0.3], lR: [-0.2] }, { aL: [1.6, 0, 0.05], eL: [0], aR: [1.3, 0.7, 0.9], eR: [1.1], bd: [-0.05, -0.6, 0], hd: [0, 0.5, 0] }],
    sky: [{ aL: [2.4, 0, 0.05], eL: [0.05], aR: [2.3, 0.5, 0.3], eR: [2.0], bd: [0.25, -0.5, 0], hd: [0.6, 0.3, 0] }, { aL: [2.4, 0, 0.05], eL: [0.05], aR: [2.2, 0.6, 0.8], eR: [1.2], bd: [0.25, -0.5, 0], hd: [0.6, 0.3, 0] }],
    gun: [{ aR: [1.5, 0.2, 0.05], eR: [0.15], aL: [1.45, 0.4, 0.4], eL: [0.5], bd: [-0.05, -0.3, 0], hd: [-0.1, 0.3, 0], lL: [0.3], lR: [-0.2] }, { aR: [1.9, 0.2, 0.05], eR: [0.1], aL: [1.8, 0.4, 0.4], eL: [0.4], bd: [0.2, -0.3, 0], hd: [0.1, 0.3, 0] }],
    hop: [{ up: -0.35, kL: [-0.9], kR: [-0.9], bd: [-0.25, 0, 0], aR: [0.2, 0, 0.5] }, { lL: [0.8], lR: [-0.3], kL: [-1.2], kR: [-0.6], aR: [2.6, 0, 0.3], eR: [1.2], wr: [-2.3], aL: [1.3, 0, -0.2], bd: [0.2, -0.4, 0] }],
    charge: [{ aL: [1.4, 0, 0.4], eL: [1.3], bd: [-0.5, 0.3, 0], up: -0.25, aR: [0.6, 0, 0.4], eR: [1.2] }, { aL: [1.5, 0, 0.3], eL: [1.0], bd: [-0.55, -0.2, 0], up: -0.2, aR: [1.2, 0, 0.2], eR: [0.6], lL: [0.7], kL: [-0.5] }],
    push: [{ aL: [1.3, 0, 0.3], eL: [1.3], aR: [1.0, 0, 0.2], eR: [0.6], bd: [-0.3, 0.2, 0], up: -0.2 }, { aL: [1.6, 0, 0.2], eL: [0.6], aR: [1.3, 0, 0], eR: [0.2], bd: [-0.5, -0.2, 0], lL: [0.8], kL: [-0.6], lR: [-0.5] }],
    iai: [{ aR: [0.9, 0, -0.9], eR: [1.6], aL: [0.7, 0, 0.5], eL: [1.3], bd: [-0.2, 0.5, 0], kL: [-0.6], kR: [-0.6], up: -0.3 }, { aR: [1.4, 0, 1.4], eR: [0.1], wr: [-0.5], aL: [0.4, 0, -0.6], eL: [0.4], bd: [-0.3, -0.6, 0], lL: [0.8], kL: [-0.7], lR: [-0.5] }],
    leap: [{ up: -0.5, kL: [-1.2], kR: [-1.2], aR: [-0.5, 0, 0.4], aL: [-0.5, 0, -0.4], bd: [-0.3, 0, 0] }, { aR: [0.5, 0, 0], eR: [0.2], aL: [0.9, 0, -0.2], bd: [-0.6, 0, 0], kL: [-1.0], kR: [-1.0], lL: [0.5], up: -0.45 }],
    flurry: [[{ aR: [0.8, 0, 0.3], eR: [1.4], bd: [0, -0.25, 0] }, { aR: [1.5, 0, 0], eR: [0.05], bd: [-0.25, 0.25, 0], lL: [0.4] }], [{ aR: [0.8, 0.2, 0.1], eR: [1.4], bd: [0, -0.1, 0] }, { aR: [1.5, 0.15, -0.15], eR: [0.05], bd: [-0.25, 0.1, 0], lL: [0.5] }]],
    whirl: [{ aR: [1.5, 0, 0.9], eR: [0.2], aL: [1.4, 0, -0.3], eL: [0.8], up: -0.2 }, { aR: [1.5, 0, 0.9], eR: [0.2], aL: [1.4, 0, -0.3], eL: [0.8], up: -0.2 }],
    sweep: [{ aR: [0.9, 0.3, 1.0], aL: [0.8, 0.3, 0.6], eL: [0.6], bd: [-0.3, -0.9, 0], up: -0.4, kL: [-0.9], kR: [-0.9] }, { aR: [0.9, -0.3, -0.8], aL: [0.8, 0, -0.4], eL: [0.6], bd: [-0.3, 0.9, 0], up: -0.4, kL: [-0.9], kR: [-0.6], lL: [0.5] }],
    combo: [[{ aR: [2.7, 0.2, 0.3], eR: [0.7], aL: [2.6, 0.3, -0.1], eL: [0.7], bd: [0.1, -0.3, 0] }, { aR: [0.9, 0, -0.2], eR: [0.15], aL: [1.0, 0.2, 0.2], eL: [0.2], bd: [-0.3, 0.4, 0], lL: [0.45], kL: [-0.45] }],
      [{ aR: [0.6, 0, -0.4], eR: [0.3], aL: [0.7, 0.2, 0.2], eL: [0.3], bd: [-0.3, 0.4, 0] }, { aR: [2.6, 0, 0.5], eR: [0.4], aL: [2.4, 0.2, 0], eL: [0.5], bd: [0.15, -0.4, 0], lR: [0.4] }],
      [{ aR: [1.4, 0.3, 1.2], eR: [0.4], aL: [1.3, 0.4, 0.8], eL: [0.6], bd: [0, -0.9, 0] }, { aR: [1.3, -0.3, -0.9], eR: [0.3], aL: [1.2, -0.1, -0.4], eL: [0.5], bd: [-0.15, 0.9, 0], lL: [0.4] }],
      [{ aR: [1.3, -0.3, -0.9], eR: [0.3], aL: [1.2, -0.1, -0.4], eL: [0.5], bd: [-0.15, 0.9, 0] }, { aR: [1.4, 0.3, 1.2], eR: [0.4], aL: [1.3, 0.4, 0.8], eL: [0.6], bd: [0, -0.9, 0], lR: [0.4] }],
      [{ aR: [3.1, 0.1, 0.1], eR: [0.4], aL: [3.0, 0.2, -0.1], eL: [0.4], bd: [0.3, 0, 0], hd: [0.3], up: 0.25 }, { aR: [0.4, 0, 0], eR: [0.05], aL: [0.5, 0.2, 0.1], eL: [0.1], bd: [-0.7, 0, 0], lL: [0.8], kL: [-1.0], lR: [-0.4], kR: [-0.5], up: -0.5 }]],
    // the buffs: each its own gesture, held
    testudo: { aL: [1.6, 0, 0.5], eL: [1.5], aR: [0.8, 0, 0.3], eR: [1.3], up: -0.45, kL: [-1.0], kR: [-1.0], bd: [-0.3, 0, 0] },
    aspis: { aL: [1.5, 0, 0.45], eL: [1.3], aR: [2.2, 0, 0.3], eR: [0.9], wr: [-1.6], up: -0.25, kL: [-0.6], kR: [-0.6], bd: [-0.2, 0.2, 0] },
    shieldup: { aL: [1.5, 0, 0.45], eL: [1.3], aR: [1.0, 0, 0.4], eR: [1.0], up: -0.2, kL: [-0.5], kR: [-0.5], bd: [-0.15, 0.25, 0] },
    berserk: { aR: [2.6, 0, 0.9], eR: [0.3], aL: [2.5, 0, -0.9], eL: [0.3], hd: [0.6], bd: [0.3, 0, 0] },
    roar: { aR: [0.5, 0, 1.2], eR: [0.6], aL: [0.5, 0, -1.2], eL: [0.6], hd: [0.7], bd: [0.35, 0, 0], up: -0.2 },
    wrath: { aR: [3.0, 0, 0.2], eR: [0.1], aL: [1.0, 0, -0.5], eL: [0.8], up: -0.4, kL: [-0.8], kR: [-0.8], hd: [0.4] },
    hype: { aR: [2.9, 0, 0.4], eR: [0.4], aL: [0.4, 0, -0.5], hd: [0.3], bd: [0.1, 0, 0] },
    molon: { aL: [1.4, 0, 0.3], eL: [1.2], aR: [2.8, 0, 0.2], eR: [0.3], wr: [-2.4], hd: [0.25], bd: [0.15, 0, 0], lL: [0.4], lR: [-0.3] },
    rally: { aR: [3.0, 0, 0.1], eR: [0.1], hd: [0.45], aL: [0.6, 0, -0.5], bd: [0.15, 0, 0] },
    pray: { aR: [1.0, 0, -0.55], eR: [1.5], aL: [1.0, 0, 0.55], eL: [1.5], hd: [-0.4], lL: [1.5], kL: [-1.6], lR: [-0.1], kR: [-1.7], up: -1.1 },
    fortress: { aR: [0.9, 0, -0.25], eR: [0.8], wr: [-3.27], aL: [0.9, 0, 0.25], eL: [0.8], hd: [0.15], lL: [0.2, 0, -0.25], lR: [-0.1, 0, 0.25] },
    resolve: { aR: [0.6, 0, -0.6], eR: [1.6], aL: [0.5, 0, 0.4], eL: [1.4], bd: [0.05, 0, 0], hd: [-0.35], up: -0.1 },
    smoke: { aR: [0.3, 0, 0.3], eR: [0.2], up: -0.5, kL: [-1.1], kR: [-1.1], bd: [-0.4, 0, 0], hd: [0.2] },
    benkei: { aR: [0.8, 0, 0.3], eR: [1.2], wr: [-1.9], aL: [0.5, 0, -0.4], lL: [0.3, 0, -0.45], lR: [-0.2, 0, 0.45], up: -0.35, hd: [0.3], bd: [0.1, 0, 0] },
  };
  AN.iaido = AN.iai; AN.rush = AN.charge;
  const JT = ['aR', 'aL', 'eR', 'eL', 'bd', 'hd', 'lL', 'lR', 'kL', 'kR', 'ws'];
  function setPose(F, P0, k) { // turn each joint P0 names towards its angle, by k
    const a = F.a, J = a.jt; if (!J) return;
    for (const n of JT) { const v = P0[n]; if (!v) continue; const o = J[n]; if (!o) continue; o.rotation.x += (v[0] - o.rotation.x) * k; if (v.length > 1) { o.rotation.y += (v[1] - o.rotation.y) * k; o.rotation.z += (v[2] - o.rotation.z) * k; } }
    if (P0.wr && a.dg) { const w = a.dg.hR; w.rotation.x += (P0.wr[0] - w.rotation.x) * k; }
    if (P0.up) a.body.position.y += (P0.up - a.body.position.y) * k;
  }
  const mixP = (A, B, k) => { const o = {}; for (const n of new Set(Object.keys(A).concat(Object.keys(B)))) { const x = A[n], y = B[n]; if (n === 'up') { o.up = lerp(x || 0, y || 0, k); continue; } const p = x || [0, 0, 0], q = y || x; o[n] = [lerp(p[0], q[0], k), lerp(p[1] || 0, q[1] || 0, k), lerp(p[2] || 0, q[2] || 0, k)]; if (!x) o[n] = q; } return o; };
  function poseAct(F, dt) {
    const A = F.act, a = F.a; if (!a || a.dead) return;
    if (a.dg) { if (!A || !A.an || !(AN[A.an] && (AN[A.an].wr || (Array.isArray(AN[A.an]) && (AN[A.an][0].wr || AN[A.an][1].wr))))) a.dg.hR.rotation.x *= Math.max(0, 1 - dt * 10); } // (the wrist back to its guard)
    if (A && A.an === 'gun' && a.dg && !a.duGun) { const g = new THREE.Group(); a.dg.hR.add(g); g.rotation.x = -Math.PI / 2; const wd = new THREE.MeshLambertMaterial({ color: '#5b3a1e', map: woodTex() }), ir = metalMat('#3f3f46'); const st = new THREE.Mesh(BOX, wd); st.scale.set(0.22, 0.3, 2.4); st.position.z = -0.4; g.add(st); const br = new THREE.Mesh(kCyl(), ir); br.scale.set(0.07, 2.6, 0.07); br.rotation.x = Math.PI / 2; br.position.set(0, 0.16, -1.6); g.add(br); g.userData.tip = new THREE.Object3D(); g.userData.tip.position.set(0, 0.16, -2.9); g.add(g.userData.tip); a.duGun = g; }
    if (a.duGun) a.duGun.visible = !!(A && A.an === 'gun');
    if (!A) return;
    const ab = A.ab, t = A.t, w0 = Math.max(0.05, ab.wind || 0.05), dur = A.dur, P0 = AN[A.an]; if (!P0) return;
    if (a.dg && (A.an === 'gun' || ((A.an === 'throw' || A.an === 'hop') && t > w0 && A.thrown))) for (const o of a.dg.R) o.visible = false; // (the thrown weapon leaves the hand)
    if (a.dg && (A.an === 'net') && t > w0 && a.dg.L) a.dg.L.visible = false;
    let target, k;
    if (!Array.isArray(P0)) { target = P0; k = A.ab.k === 'buff' ? ease(t / 0.25) * (1 - ease((t - (dur - 0.25)) / 0.25)) : 1; } // (a buff's gesture, held)
    else if (Array.isArray(P0[0])) { // several blows: a pair for each
      const n = ab.hits.length, h = Math.min(n - 1, Math.max(0, Math.floor((t - w0 + 0.12) / ab.gap))), th = w0 + h * ab.gap, pr = P0[h % P0.length];
      const sw = ease((t - th + 0.04) / 0.1); target = t < w0 ? pr[0] : mixP(pr[0], pr[1], sw); if (t > th + 0.1 && h < n - 1) target = mixP(pr[1], P0[(h + 1) % P0.length][0], ease((t - th - 0.1) / Math.max(0.05, ab.gap - 0.12)));
      k = t < w0 ? ease(t / w0) : 1 - ease((t - (w0 + (n - 1) * ab.gap + 0.14)) / 0.2);
    } else {
      const strike = A.strikeAt != null ? A.strikeAt : w0, sw = ease((t - strike + 0.04) / 0.12);
      target = t < strike ? P0[0] : mixP(P0[0], P0[1], sw); k = t < strike ? ease(t / Math.min(strike, 0.2)) : 1 - ease((t - (strike + 0.16)) / Math.max(0.1, dur - strike - 0.16));
      if (A.an === 'leap') { const air = clamp((t - w0) / 0.62, 0, 1); target = t < w0 ? P0[0] : air < 1 ? { aR: [3.0, 0, 0.2], eR: [0.4], aL: [2.6, 0, -0.3], eL: [0.4], kL: [-1.4], kR: [-0.8], lL: [1.0], bd: [0.1, 0, 0] } : P0[1]; k = t < w0 ? ease(t / w0) : 1 - ease((t - w0 - 0.7) / 0.25); }
      if ((A.an === 'charge' || A.an === 'rush' || A.an === 'push') && t > w0 && t < w0 + ab.dd) { const s = Math.sin(t * 26); target = Object.assign({}, target, { lL: [0.7 * s], lR: [-0.7 * s], kL: [-0.4 - 0.4 * Math.max(0, -s)], kR: [-0.4 - 0.4 * Math.max(0, s)] }); }
    }
    setPose(F, target, clamp(k, 0, 1));
    if (A.an === 'whirl') { const s = clamp((t - w0) / (ab.gap * ab.hits.length), 0, 1); a.g.rotation.y = F.yaw + ease(s) * Math.PI * 4; }
    // the weapon's trail during the blows
    const melee = ab.k === 'melee' || ab.k === 'multi' || ab.k === 'combo' || (ab.k === 'dash' && !ab.back);
    const live = melee && (ab.k === 'dash' ? t > w0 - 0.05 && t < w0 + ab.dd + 0.12 : ab.hits ? t > w0 - 0.06 && t < w0 + ab.gap * (ab.hits.length - 1) + 0.16 : t > (A.strikeAt || w0) - 0.06 && t < (A.strikeAt || w0) + 0.16);
    A.trail = live;
  }

  /* ---------------- doing things ---------------- */
  const foeOf = (F) => { const M = DU.M; return !M ? null : F === M.me ? M.foe : M.me; };
  const live = () => DU.M && DU.M.ph === 'fight';
  function clampArena(x, z, r = 1.6) { const a = A0 - r, b = B0 - r, q = (x / a) ** 2 + (z / b) ** 2; if (q <= 1) return [x, z]; const s = 1 / Math.sqrt(q); return [x * s, z * s]; }
  function moveF(F, dx, dz) { if (F.kind === 'me') { [P.x, P.z] = clampArena(P.x + dx, P.z + dz); F.x = P.x; F.z = P.z; } else if (F.kind === 'bot') { [F.x, F.z] = clampArena(F.x + dx, F.z + dz); } }
  function faceF(F, yaw) { F.yaw = yaw; if (F.kind === 'me') P.yaw = yaw; }
  const canAct = (F) => live() && !F.dead && !stunned(F) && !F.act && !(F.kind === 'me' && P.dead);
  // a blow begins: face them (if they're near enough to be what you meant), start the animation, and say so
  function useAb(F, i, vis) {
    if (!vis && (!canAct(F) || F.cd[i] > 0 || F.blk)) return false;
    const ab = abOf(F, i), T = foeOf(F);
    if (!vis) { F.cd[i] = F.cdMax[i] = ab.cd;
      if (T && !T.dead) { const dx = T.x - F.x, dz = T.z - F.z, d = Math.hypot(dx, dz), da = wrapA(angOf(dx, dz) - F.yaw), far = ab.k === 'proj' || ab.k === 'volley' || ab.k === 'leap' || ab.k === 'dash';
        if ((far && Math.abs(da) < 1.3) || d < (ab.rng || 7) + 5 && Math.abs(da) < 1.9 || DU.lockOn && F.kind === 'me' || F.kind === 'bot') faceF(F, angOf(dx, dz) + (F.kind === 'bot' && ab.k === 'proj' ? (Math.random() - 0.5) * 0.5 * (1 - DIFF[F.D].aim) : 0)); } }
    const A = F.act = { i, ab, t: 0, dur: actDur(ab), an: ab.an, h: 0, yaw: F.yaw, vis: !!vis, x0: F.x, z0: F.z };
    if (T && (ab.k === 'volley' || ab.k === 'leap')) { A.tx = T.x; A.tz = T.z; }
    if (ab.k === 'buff' && ab.b && ab.b.blk) A.dur = ab.b.dur;
    if (ab.an === 'stab') A.strikeAt = ab.wind;
    F.acN++; if (F.kind === 'me') DU.pubAct(F, A);
    sfx3(ab.k === 'buff' ? 'magic' : ab.k === 'proj' || ab.k === 'volley' ? 'whoosh' : 'swing', F.x, F.z, 60, { vol: 0.6 });
    if (ab.k === 'buff' && ab.b) { burstAt(F.x, F.y + 3.5, F.z, BUFFLOOK[ab.an] ? BUFFLOOK[ab.an][0] : COL[F.c], 7, 0.5); ringAt(F.x, F.z, BUFFLOOK[ab.an] ? BUFFLOOK[ab.an][0] : COL[F.c], 8); if (ab.an === 'smoke') smokeAt(F.x, F.y + 1, F.z, 16, '#6b7280', 3); if (ab.an === 'pray') beamAt(F.x, F.z, '#fef3c7', 40, 1.2, 2.2); }
    if (ab.an === 'smite') beamAt(F.x, F.z, '#fde68a', 14, 0.6, 0.8);
    if (ab.an === 'gun') sfx3('count', F.x, F.z, 60, { vol: 0.5 });
    if (ab.k === 'combo') { DU.say(F, '🌸 COMBO'); }
    return true;
  }
  function actTick(F, dt) {
    const A = F.act; if (!A) return; const ab = A.ab, w = ab.wind || 0, t0 = A.t; A.t += dt; const t = A.t, T = foeOf(F);
    const at = (x) => t0 < x && t >= x;
    if (ab.k === 'melee') { if (at(w)) { if (ab.an === 'stab' && !A.vis) { moveF(F, -Math.sin(F.yaw) * 2.5, -Math.cos(F.yaw) * 2.5); } meleeHit(F, ab, ab.dmg, ab.fx, A); } }
    else if (ab.k === 'multi' || ab.k === 'combo') {
      for (let h = A.h; h < ab.hits.length && t >= w + h * ab.gap; h++) { A.h = h + 1; const ok = meleeHit(F, ab, ab.hits[h], h === ab.hits.length - 1 ? ab.fx : null, A, h);
        if (ab.k === 'combo' && h === 0 && !A.vis) { if (ok) { A.held = 1; if (T && T.kind !== 'rem') T.S.root = Math.max(T.S.root, ab.gap * (ab.hits.length - 1) + 0.3); }
          else { F.act = null; F.S.stun = 1.5; F.S.vuln = 1.5; DU.say(F, 'MISSED!'); floatText(F, 'MISSED — STUNNED', 'me'); sfx3('error', F.x, F.z, 60); return; } }
        if (ab.k === 'combo' && A.held && T) { if (T.kind !== 'rem') T.S.root = Math.max(T.S.root, 0.4); for (let q = 0; q < 6; q++) kitSpark(F.a, F.a.g, (Math.random() - 0.5) * 3, 2 + Math.random() * 3, -2 - Math.random() * 2, Math.random() < 0.6 ? '#f9a8d4' : '#fce7f3', { v: [(Math.random() - 0.5) * 3, -1, (Math.random() - 0.5) * 3], life: 1.2, s: 0.22, j: 0.6 }); } } }
    else if (ab.k === 'proj') { const n = ab.cnt || 1; for (let k = 0; k < n; k++) { const tk = w + (ab.spread ? 0 : k * (ab.gap || 0)); if (at(tk)) { spawnProj(F, ab, ab.spread ? (k - (n - 1) / 2) * ab.spread * Math.PI / 180 : 0, A.vis); A.thrown = true; } } }
    else if (ab.k === 'dash') {
      if (t > w && t0 < w + ab.dd) { const s = (Math.min(t, w + ab.dd) - Math.max(t0, w)) / ab.dd * ab.dist * (ab.back ? -1 : 1); moveF(F, -Math.sin(A.yaw) * s, -Math.cos(A.yaw) * s);
        if (Math.random() < 0.6) kitSpark(F.a, F.a.g, (Math.random() - 0.5) * 2, 0.3, 1, '#d6b98c', { v: [0, 1.5, 3], life: 0.5, s: 0.7, j: 1, flat: true });
        if (!ab.back && !A.hit && T && !T.dead && Math.hypot(T.x - F.x, T.z - F.z) < 3.4) { A.hit = 1; dealHitAs(F, T, ab.dmg, ab.fx, ab, A); } }
      if (at(w)) { if (ab.an === 'iai' || ab.an === 'iaido') { A.sx = F.x; A.sz = F.z; } burstAt(F.x, F.y + 3, F.z, COL[F.c], 4, 0.3); }
      if (at(w + ab.dd)) { if (A.sx != null) { slashLine(A.sx, A.sz, F.x, F.z, ab.an === 'iaido' ? '#ffffff' : COL[F.c]); if (ab.an === 'iaido') { DU.flash(F); sfx3('zap', F.x, F.z, 70); } }
        if (ab.then && T) { faceF(F, angOf(T.x - F.x, T.z - F.z)); const th = ab.then; for (let k = 0; k < (th.cnt || 1); k++) spawnProj(F, th, (k - ((th.cnt || 1) - 1) / 2) * (th.spread || 0) * Math.PI / 180, A.vis); A.thrown = true; } } }
    else if (ab.k === 'leap') {
      if (at(w) && A.tx == null && T) { A.tx = T.x; A.tz = T.z; }
      if (t > w && t0 < w + 0.62 && A.tx != null) { const k0 = clamp((t0 - w) / 0.62, 0, 1), k1 = clamp((t - w) / 0.62, 0, 1), dx = A.tx - A.x0, dz = A.tz - A.z0, d = Math.hypot(dx, dz), lim = Math.min(1, ab.dist / Math.max(d, 0.01)), stop = Math.max(0, 1 - 2.5 / Math.max(d, 0.01));
        moveF(F, dx * lim * stop * (k1 - k0), dz * lim * stop * (k1 - k0)); F.lift = Math.sin(k1 * Math.PI) * 9; }
      if (at(w + 0.62)) { F.lift = 0; ringAt(F.x, F.z, '#d6b98c', ab.rad * 1.6, 0.6); ringAt(F.x, F.z, COL[F.c], ab.rad, 0.4); smokeAt(F.x, 0.5, F.z, 10, '#c8a97e', 2.4); sfx3('boom', F.x, F.z, 80, { vol: 0.7 }); camShake(F.a, 0.5);
        if (!A.vis && T && !T.dead && Math.hypot(T.x - F.x, T.z - F.z) < ab.rad + 1) dealHitAs(F, T, ab.dmg, ab.fx, ab, A); } }
    else if (ab.k === 'volley') { if (at(w) && A.tx != null) DU.volleys.push({ F, ab, x: A.tx, z: A.tz, t: 0, vis: A.vis, n: 0, ring: telegraph(A.tx, A.tz, ab.rad) }); }
    else if (ab.k === 'buff') { if (at(0.22) && !A.vis) buffOn(F, ab); }
    if (F.act === A && t >= A.dur) { F.act = null; F.lift = 0; }
  }
  function telegraph(x, z, r) { const m = new THREE.Mesh(kg('duTele', () => { const q = new THREE.RingGeometry(0.85, 1, 40); q.rotateX(-Math.PI / 2); return q; }), new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide })); m.position.set(x, 0.15, z); m.scale.setScalar(r); scene.add(m); return m; }
  function buffOn(F, ab) {
    const b = Object.assign({ an: ab.an, t: ab.b.dur }, ab.b); F.S.buffs = F.S.buffs.filter((q) => q.an !== ab.an); F.S.buffs.push(b);
    if (b.heal) heal(F, b.heal); if (b.healP) heal(F, F.mhp * b.healP);
    if (b.imm) { F.S.stun = F.S.root = F.S.slow = 0; }
    if (b.nx) F.nx = b.nx;
    if (b.inv) smokeAt(F.x, 1, F.z, 18, '#4b5563', 3.2);
    DU.say(F, ab.n.toUpperCase());
  }
  function heal(F, n) { n = Math.round(Math.min(n, F.mhp - F.hp)); if (n <= 0 || F.kind === 'rem') return; F.hp += n; floatText(F, '+' + n, 'heal'); sparks(F, '#4ade80', 6, 3, { v: [0, 4, 0], g: 0 }); }
  // does a blow land? within reach, in front (the arc), not far above or below
  function meleeHit(F, ab, dmg, fx, A, h) {
    const T = foeOf(F); if (!T || T.dead) return false;
    const dx = T.x - F.x, dz = T.z - F.z, d = Math.hypot(dx, dz), da = Math.abs(wrapA(angOf(dx, dz) - (A && A.an === 'whirl' ? angOf(dx, dz) : F.yaw)));
    const reach = (ab.rng || 6) + 1.2 + (ab.an === 'stab' ? 2.5 : 0), arc = (ab.arc || 90) >= 360 ? 9 : (ab.arc || 90) / 2 * Math.PI / 180 + 0.3;
    if (d > reach || da > arc || Math.abs((T.y + (T.lift || 0)) - (F.y + (F.lift || 0))) > 4.5) { if (!A || !A.vis) sfx3('whoosh', F.x, F.z, 40, { vol: 0.35 }); return false; }
    if (A && A.vis) return true;
    dealHitAs(F, T, dmg, fx, ab, A, h); return true;
  }
  // a hit: how hard (their buffs and the next-hit bonus), then theirs to take — here, or sent to them
  function dealHitAs(F, T, base, fx, ab, A, h) {
    if (A && A.vis) return;
    let dmg = (base + bval(F, 'dmgA')) * bval(F, 'dmgM') * F.dmgM; if (F.nx) { dmg *= F.nx; F.nx = 0; F.S.buffs = F.S.buffs.filter((b) => !b.inv); floatText(F, 'AMBUSH ×2', 'big'); }
    dmg = Math.round(dmg); const f2 = Object.assign({}, fx || {}); if (f2.bl && f2.blc != null && Math.random() > f2.blc) delete f2.bl; delete f2.blc;
    if (T.kind === 'rem') { DU.sendHit(T, dmg, f2, F); hitLook(T, dmg, false, ab); floatText(T, String(dmg), dmg >= 100 ? 'big' : ''); }
    else takeHit(T, dmg, f2, F, { ab });
    const ls = bval(F, 'ls'); if (ls) heal(F, dmg * ls);
    if (F.kind === 'me') { DU.bump('dmg', dmg); DU.M.dealt += dmg; }
  }
  function hitLook(T, dmg, blocked, ab) {
    const big = dmg >= 100; sfx3(blocked ? 'block' : big ? 'crunch' : 'hit', T.x, T.z, 70, { vol: big ? 1 : 0.8 });
    sparks(T, blocked ? '#bae6fd' : '#fef3c7', big ? 16 : 9); if (!blocked) sparks(T, '#dc2626', big ? 8 : 4, 3.2, { flat: true, s: 0.25, life: 0.6 });
    burstAt(T.x, T.y + 3.4, T.z, blocked ? '#93c5fd' : '#fff7ed', big ? 5 : 3);
    if (T.a && !T.a.dead) { setGlow(T.a, blocked ? '#1e3a8a' : '#7f1d1d'); clearTimeout(T.glowT); T.glowT = setTimeout(() => T.a && setGlow(T.a, null), 110); }
    if (big) { ringAt(T.x, T.z, '#fde68a', 6, 0.4); CROWD.ex = Math.min(1, CROWD.ex + 0.5); } else CROWD.ex = Math.min(1, CROWD.ex + 0.18);
    if (T.kind === 'me' || (ab && foeOf(T) && foeOf(T).kind === 'me')) camShake(me, big ? 0.6 : 0.22);
  }
  // taking a hit (mine, or a bot's): a dodge's moment, a block, armour and buffs, then what it does to you
  function takeHit(T, dmg, fx, from, o = {}) {
    if (T.dead || !live()) return;
    if (T.S.ifr > 0) { floatText(T, 'DODGED', 'tag'); sfx3('whoosh', T.x, T.z, 50); if (T.kind === 'me') DU.bump('dodges', 1); return; }
    const imm = bval(T, 'imm'), blkB = bval(T, 'blk'); let mult = T.C.def * bval(T, 'def') * (T.S.vuln > 0 ? 1.5 : 1), blocked = false;
    if (blkB) { mult *= 1 - blkB; blocked = true; }
    else if (T.blk && from && Math.abs(wrapA(angOf(from.x - T.x, from.z - T.z) - T.yaw)) < 1.2) { mult *= 0.4; blocked = true; T.st -= 12 + dmg * 0.12; T.rest = 0;
      if (T.st <= 0) { T.st = 0; T.blk = false; T.S.stun = Math.max(T.S.stun, 1.2); floatText(T, 'GUARD BROKEN', 'big'); sfx3('crash', T.x, T.z, 60); } }
    dmg = Math.max(1, Math.round(dmg * mult)); T.hp -= dmg; T.rTaken = (T.rTaken || 0) + dmg;
    floatText(T, blocked ? `🛡️ ${dmg}` : String(dmg), (T.kind === 'me' ? 'me ' : '') + (dmg >= 100 ? 'big' : '')); hitLook(T, dmg, blocked, o.ab);
    if (T.kind === 'me') { const h = $('#duHurt'); if (h) { h.style.opacity = blocked ? 0.25 : 0.8; clearTimeout(DU.hurtT); DU.hurtT = setTimeout(() => (h.style.opacity = 0), 200); } }
    if (fx && !blocked) {
      if (!imm) { if (fx.st) { T.S.stun = Math.max(T.S.stun, fx.st); T.act = null; T.blk = false; } if (fx.rt) T.S.root = Math.max(T.S.root, fx.rt); if (fx.sl) { T.S.slow = Math.max(T.S.slow, fx.sl[1]); T.S.slowM = fx.sl[0]; }
        if (fx.kb && from) { const dx = T.x - from.x, dz = T.z - from.z, l = Math.hypot(dx, dz) || 1; T.push = { vx: dx / l * fx.kb / 0.3, vz: dz / l * fx.kb / 0.3, t: 0.3 }; } }
      if (fx.bl) { T.S.dots.push({ k: 'bl', dps: fx.bl[0] / fx.bl[1], t: fx.bl[1], acc: 0 }); floatText(T, '🩸 BLEEDING', 'tag'); }
      if (fx.bu) { T.S.dots.push({ k: 'bu', dps: fx.bu[0] / fx.bu[1], t: fx.bu[1], acc: 0 }); floatText(T, '🔥 BURNING', 'tag'); }
      if (fx.st && !imm) floatText(T, '💫 STUNNED', 'tag'); if (fx.rt && !imm) floatText(T, '🕸️ ROOTED', 'tag');
    }
    const rf = bval(T, 'rf'); if (rf && from && !o.rf) { const back = Math.round(dmg * rf); if (from.kind === 'rem') { DU.sendHit(from, back, { rf: 1 }, T); floatText(from, String(back), ''); } else takeHit(from, back, {}, T, { rf: 1 }); }
    if (T.hp <= 0) { T.hp = 0; DU.killed(T, from); }
  }
  // the dodge: a quick dash with a moment you can't be hit
  function dodge(F, dx, dz) {
    if (!live() || F.dead || stunned(F) || F.S.root > 0 || F.st < 25 || F.push || (F.act && F.act.ab.k !== 'buff')) return false;
    let l = Math.hypot(dx, dz); if (l < 0.1) { dx = Math.sin(F.yaw); dz = Math.cos(F.yaw); l = 1; } // (no direction: backwards)
    F.st -= 25; F.rest = 0; F.S.ifr = 0.34; F.push = { vx: dx / l * 40, vz: dz / l * 40, t: 0.22, dodge: 1 }; F.blk = false;
    sfx3('whoosh', F.x, F.z, 50, { vol: 0.8 }); smokeAt(F.x, 0.6, F.z, 5, '#e7d3a8', 1.6); if (F.kind === 'me') DU.pubAct(F, null, 'dodge'); return true;
  }
  // every frame: timers, damage over time, healing, stamina, the push of a dodge or a knock
  function statusTick(F, dt) {
    const S = F.S, cdm = bval(F, 'cdM');
    for (let i = 0; i < 3; i++) if (F.cd[i] > 0) F.cd[i] = Math.max(0, F.cd[i] - dt * cdm);
    S.stun = Math.max(0, S.stun - dt); S.root = Math.max(0, S.root - dt); S.vuln = Math.max(0, S.vuln - dt); S.ifr = Math.max(0, S.ifr - dt); if ((S.slow = Math.max(0, S.slow - dt)) === 0) S.slowM = 1;
    for (const b of S.buffs) b.t -= dt; S.buffs = S.buffs.filter((b) => b.t > 0);
    if (F.kind === 'rem' || F.dead) return;
    const hps = bval(F, 'hps'); if (hps && live()) { F.hpAcc = (F.hpAcc || 0) + hps * dt; if (F.hpAcc >= 5) { heal(F, F.hpAcc); F.hpAcc = 0; } }
    for (const d of S.dots) { if (!live()) break; d.t -= dt; d.acc += d.dps * dt; if (d.acc >= 6 || d.t <= 0) { const n = Math.round(d.acc); d.acc = 0; if (n > 0) { F.hp -= n; F.rTaken = (F.rTaken || 0) + n; floatText(F, String(n), d.k === 'bu' ? 'tag' : 'me'); if (F.hp <= 0) { F.hp = 0; DU.killed(F, foeOf(F)); return; } } } }
    S.dots = S.dots.filter((d) => d.t > 0);
    const sprint = F.kind === 'me' ? DU.sprinting : F.sprint;
    if (sprint) { F.st = Math.max(0, F.st - 15 * dt); F.rest = 0; } else if (F.blk) F.rest = 0; else { F.rest += dt; if (F.rest > 0.7) F.st = Math.min(100, F.st + 26 * dt); }
    if (F.push) { moveF(F, F.push.vx * dt, F.push.vz * dt); F.push.t -= dt; if (F.push.t <= 0) F.push = null; }
  }
  /* ---------------- things thrown and shot ---------------- */
  function projModel(kind) {
    const g = new THREE.Group();
    if (kind === 'javelin' || kind === 'pilum') { const p = dgPole(g, kind); p.position.z = 1.2; }
    else if (kind === 'arrow' || kind === 'fire') { emArrowProp(g).position.z = 1.0; if (kind === 'fire') { const f = emSprite(g, fxTex('flame'), 1.1, { blending: THREE.AdditiveBlending }); f.position.z = -1.2; kitGlow(g, '#f97316', 2.6, 0.7).position.z = -1.2; } }
    else if (kind === 'axe') { const s = new THREE.Group(); g.add(s); dgAxe(s).position.z = 1.2; g.userData.spin = s; }
    else if (kind === 'shuriken') { const s = new THREE.Mesh(ovShape('duShur', [[0, 0.5], [0.12, 0.12], [0.5, 0], [0.12, -0.12], [0, -0.5], [-0.12, -0.12], [-0.5, 0], [-0.12, 0.12]], 0.04, 0.01), metalMat('#cbd5e1', { shininess: 140 })); s.rotation.x = Math.PI / 2; s.scale.setScalar(1.3); const w = new THREE.Group(); w.add(s); g.add(w); g.userData.spin = w; g.userData.spinAx = 'y'; }
    else if (kind === 'net') { const n = new THREE.Mesh(kg('duNetP', () => new THREE.PlaneGeometry(3.2, 3.2, 4, 4)), new THREE.MeshLambertMaterial({ map: dgNetTex(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide })); const w = new THREE.Group(); w.add(n); g.add(w); g.userData.spin = w; g.userData.spinAx = 'z'; }
    else { const b = new THREE.Mesh(kSph(), new THREE.MeshBasicMaterial({ color: '#fde68a' })); b.scale.setScalar(0.18); g.add(b); const tr = new THREE.Mesh(kCyl(), new THREE.MeshBasicMaterial({ color: '#fef3c7', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending })); tr.scale.set(0.06, 5, 0.06); tr.rotation.x = Math.PI / 2; tr.position.z = 2.5; g.add(tr); }
    return g;
  }
  function spawnProj(F, ab, off, vis) {
    const yaw = F.yaw + off, dx = -Math.sin(yaw), dz = -Math.cos(yaw), T = foeOf(F), m = projModel(ab.model || 'arrow'), y0 = F.y + (F.lift || 0) + 4.2;
    const x0 = F.x + dx * 1.6, z0 = F.z + dz * 1.6, ty = T ? T.y + 3 : y0, d = T ? Math.hypot(T.x - x0, T.z - z0) : 30, vy = clamp((ty - y0) / Math.max(0.2, d / ab.spd), -20, 20);
    m.position.set(x0, y0, z0); scene.add(m);
    DU.proj.push({ m, F, ab, x: x0, y: y0, z: z0, vx: dx * ab.spd, vy, vz: dz * ab.spd, life: 70 / ab.spd + 0.4, vis, fx: ab.fx });
    if (ab.model === 'ball') { burstAt(x0, y0, z0, '#fde68a', 4, 0.2); smokeAt(x0, y0, z0, 8, '#d1d5db', 1.6); sfx3('boom', F.x, F.z, 90, { vol: 0.8 }); camShake(F.a, 0.3); }
  }
  function projTick(dt) {
    for (const p of DU.proj) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.life -= dt; p.m.position.set(p.x, p.y, p.z); p.m.lookAt(p.x + p.vx, p.y + p.vy, p.z + p.vz); p.m.rotateY(Math.PI);
      const sp = p.m.userData.spin; if (sp) sp.rotation[p.m.userData.spinAx || 'x'] += dt * 22;
      const H = foeOf(p.F); if (H && !H.dead && !bval(H, 'inv') && p.ab.model !== 'ball') { const v = Math.hypot(p.vx, p.vz), a0 = Math.atan2(p.vx, p.vz), a1 = Math.atan2(H.x - p.x, H.z - p.z), turn = clamp(wrapA(a1 - a0), -1, 1) * Math.min(1, dt * 2.2 * (p.F.kind === 'bot' ? DIFF[p.F.D].aim : 1)); if (Math.abs(wrapA(a1 - a0)) < 0.9) { p.vx = Math.sin(a0 + turn) * v; p.vz = Math.cos(a0 + turn) * v; } } // (a little help: it bends towards them)
      if (p.ab.model === 'fire' && Math.random() < 0.5) burstAt(p.x, p.y, p.z, '#f97316', 1.2, 0.25);
      const T = foeOf(p.F);
      if (T && !T.dead && Math.hypot(T.x - p.x, T.z - p.z) < 2.3 && Math.abs(T.y + (T.lift || 0) + 3 - p.y) < 3.8) { p.life = 0; if (!p.vis) dealHitAs(p.F, T, p.ab.dmg, p.fx, p.ab); else burstAt(p.x, p.y, p.z, '#fff7ed', 2); }
      if (p.y < 0.2 || isFloor(p.x, p.z) > 1.15) { p.life = 0; smokeAt(p.x, 0.4, p.z, 3, '#c8a97e', 1.2); }
    }
    DU.proj = DU.proj.filter((p) => { if (p.life > 0) return true; scene.remove(p.m); return false; });
    for (const v of DU.volleys) { v.t += dt; v.ring.material.opacity = 0.5 + 0.4 * Math.sin(v.t * 20); v.ring.scale.setScalar(v.ab.rad * (1 - 0.15 * Math.min(1, v.t / v.ab.delay)));
      while (v.n < v.ab.cnt && v.t >= v.ab.delay + v.n * 0.08) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * v.ab.rad, x = v.x + Math.cos(a) * r, z = v.z + Math.sin(a) * r, m = projModel('arrow'); m.position.set(x + 3, 26, z + 3); scene.add(m);
        DU.drops.push({ m, x, z, y: 26, F: v.F, ab: v.ab, vis: v.vis, done: false }); v.n++; } }
    DU.volleys = DU.volleys.filter((v) => { if (v.n < v.ab.cnt) return true; scene.remove(v.ring); return false; });
    for (const d of DU.drops) { d.y -= 70 * dt; d.m.position.set(d.x + 3 * d.y / 26, d.y, d.z + 3 * d.y / 26); d.m.lookAt(d.x, -10, d.z); d.m.rotateY(Math.PI);
      if (d.y <= 0.5 && !d.done) { d.done = true; smokeAt(d.x, 0.4, d.z, 2, '#c8a97e', 1); const T = foeOf(d.F); if (T && !T.dead && Math.hypot(T.x - d.x, T.z - d.z) < 2.3) { if (!d.vis) dealHitAs(d.F, T, d.ab.dmg, null, d.ab); } d.t = 1.5; } if (d.done) d.t -= dt; }
    DU.drops = DU.drops.filter((d) => { if (!d.done || d.t > 0) return true; scene.remove(d.m); return false; });
  }

  /* ---------------- the bots ----------------
     They see your blow coming (after a moment: how long depends how good they are) and block or dodge it; keep to the
     range their weapon likes, circling; and use their abilities when they'd do the most good */
  function fSpeed(F) {
    if (stunned(F) || F.S.root > 0 || F.dead || !live()) return 0;
    let s = 16 * F.C.spd * bval(F, 'spdM') * (F.S.slow > 0 ? F.S.slowM : 1); if (F.blk) s *= 0.45;
    if (F.act) { const ab = F.act.ab; s *= ab.k === 'dash' || ab.k === 'leap' ? 0 : ab.b && ab.b.blk ? 0.5 : ab.k === 'buff' ? 0.6 : 0.4; }
    if (F.kind === 'bot') s *= DIFF[F.D].spdM; return s;
  }
  function abilityGood(F, ab, d, T) {
    if (ab.k === 'buff') { const b = ab.b; if (b.blk) return !!T.act && d < 12; if (b.heal || b.healP || b.hps) return F.hp / F.mhp < 0.65 || (b.def && d < 10); if (b.inv) return d < 18; return d < 14; }
    if (ab.k === 'dash') return ab.back ? d < 8 : d > 4 && d < ab.dist + 2;
    if (ab.k === 'leap') return d > 6 && d < ab.dist; if (ab.k === 'proj') return d < 45; if (ab.k === 'volley') return true;
    return d < (ab.rng || 6) + 0.6;
  }
  function botTick(F, dt) {
    const T = foeOf(F), D = DIFF[F.D], B = F.bot || (F.bot = { t: 0.5, str: 1, strT: 0, seen: -1, blkT: 0, react: null, lx: 0, lz: 0 });
    F.mv = false; F.sprint = false; if (!T || F.dead || !live()) { F.blk = false; return; }
    const inv = bval(T, 'inv') > 0; if (!inv) { B.lx = T.x; B.lz = T.z; } // (lost in the smoke: where they were last)
    const dx = (inv ? B.lx : T.x) - F.x, dz = (inv ? B.lz : T.z) - F.z, d = Math.max(0.01, Math.hypot(dx, dz)), yawTo = angOf(dx, dz);
    if (T.act && T.acN !== B.seen && !T.act.vis0) { B.seen = T.acN; B.react = D.react * (0.7 + Math.random() * 0.6); B.rab = T.act.ab; }
    if (B.react != null && (B.react -= dt) <= 0) { B.react = null; const ab = B.rab, threat = ab.k !== 'buff' && (d < (ab.rng || 8) + 4 || ab.k === 'proj' || ab.k === 'dash' || ab.k === 'leap' || ab.k === 'volley');
      if (threat && !F.act && !stunned(F)) { const r = Math.random(); if (r < D.dodge) { const s = Math.random() < 0.5 ? 1 : -1; dodge(F, -dz / d * s - dx / d * 0.5, dx / d * s - dz / d * 0.5); } else if (r < D.dodge + D.guard && ab.k !== 'volley' && F.st > 30) { F.blk = true; B.blkT = 0.45 + Math.random() * 0.4; } } }
    if (B.blkT > 0 && ((B.blkT -= dt) <= 0 || F.st <= 0 || F.act)) { F.blk = false; B.blkT = 0; }
    const m1 = abOf(F, 0), ranged = m1.k === 'proj', want = ranged ? 18 : (m1.rng || 6) * 0.72;
    if ((B.strT -= dt) <= 0) { B.strT = 1 + Math.random() * 2.2; B.str = Math.random() < 0.5 ? 1 : -1; }
    let mx = 0, mz = 0; if (d > want + 1.5) { mx += dx / d; mz += dz / d; F.sprint = d > 22 && F.st > 40 && !F.blk; } else if (d < want - 2.5) { mx -= dx / d; mz -= dz / d; }
    const orb = d < want + 6 ? 0.75 : 0.25; mx += -dz / d * B.str * orb; mz += dx / d * B.str * orb;
    if (!F.act || F.act.ab.k === 'buff') { const turn = 3 + D.aim * 9; F.yaw += clamp(wrapA(yawTo - F.yaw), -turn * dt, turn * dt); }
    if ((B.t -= dt) <= 0 && !F.act && !F.blk && !stunned(F)) { B.t = D.react * 0.55 + Math.random() * 0.3;
      for (const i of [2, 1]) { if (F.cd[i] > 0 || Math.random() > D.abil) continue; if (abilityGood(F, abOf(F, i), d, T)) { useAb(F, i); break; } }
      if (!F.act && F.cd[0] <= 0 && Math.random() < D.aggr && (ranged ? d < 45 : d < (m1.rng || 6) + 1.2) && Math.abs(wrapA(yawTo - F.yaw)) < (ranged ? 0.25 : 0.7)) useAb(F, 0); }
    const l = Math.hypot(mx, mz), sp = fSpeed(F) * (F.sprint ? 1.45 : 1);
    if (l > 0.1 && sp > 0) { F.mv = true; moveF(F, mx / l * sp * dt, mz / l * sp * dt); }
  }
  /* ---------------- the HUD (as drawn: you on the left, them on the right, the clock between; your abilities bottom left) ---------------- */
  const KEYS = touchy ? ['TAP', 'TAP', 'TAP'] : ['M1', 'E', 'R'];
  function hudBuild(M) {
    const el = document.createElement('div'); el.id = 'duHud'; const F = M.me, md = F.C.ab[0].modes;
    el.innerHTML = `<div id="duTop"><div class="du-card me" id="duMe"></div><div id="duMid"></div><div class="du-card op" id="duOp"></div></div>
      <div id="duHurt"></div><div id="duBig"></div><div id="duKill"></div>
      <div id="duAb">${md ? `<div class="du-side">${md.map((m, k) => `<button data-mode="${k}"><b>${k + 1}</b>${m.ic} ${m.n}</button>`).join('')}</div>` : ''}
        ${[0, 1, 2].map((i) => `<button class="du-ab${i === 0 ? ' m1' : i === 2 ? ' ult' : ''}" data-ab="${i}"><span class="k">${KEYS[i]}</span><span class="e"></span><span class="n"></span><span class="cd"></span><span class="s"></span></button>`).join('')}
        <div class="du-side"><button data-k="dodge"><b>${touchy ? '' : 'Q'}</b>💨 Dodge</button><button data-k="block"><b>${touchy ? '' : 'F'}</b>🛡️ Block</button>${touchy ? '<button data-k="run">🏃 Sprint</button>' : ''}<button data-k="lock"><b>${touchy ? '' : 'T'}</b>🎯 Lock</button></div></div>
      <div id="duTip">🖱️ Click: ${esc(abOf(F, 0).n)} · E ${esc(F.C.ab[1].n)} · R ${esc(F.C.ab[2].n)} · Q dodge · F / right-click block · Shift sprint${md ? ` · ${md.map((m, k) => k + 1).join('/')} switch` : ''} · T lock-on</div>`;
    $('#xhud').append(el); HUD.el = el; HUD.last = {};
    const ab = el.querySelector('#duAb');
    ab.addEventListener('pointerdown', (e) => { const b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation();
      if (b.dataset.ab) DU.tryAb(+b.dataset.ab); else if (b.dataset.mode) DU.setMode(+b.dataset.mode); else if (b.dataset.k === 'dodge') DU.tryDodge(); else if (b.dataset.k === 'block') DU.blockHeld = true;
      else if (b.dataset.k === 'run') DU.touchRun = !DU.touchRun; else if (b.dataset.k === 'lock') DU.toggleLock(); });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) ab.addEventListener(ev, (e) => { const b = e.target.closest && e.target.closest('button'); if (b && b.dataset.k === 'block') DU.blockHeld = false; });
  }
  function hudCard(F, who) {
    const C = F.C, hp = Math.max(0, Math.ceil(F.hp)), st = Math.round(F.st), fx = [];
    if (F.S.stun > 0) fx.push('<span class="bad">💫 Stunned</span>'); if (F.S.root > 0) fx.push('<span class="bad">🕸️ Rooted</span>'); if (F.S.slow > 0) fx.push('<span class="bad">🐌 Slowed</span>');
    if (F.S.dots.some((d) => d.k === 'bl')) fx.push('<span class="bad">🩸 Bleed</span>'); if (F.S.dots.some((d) => d.k === 'bu')) fx.push('<span class="bad">🔥 Burn</span>'); if (F.S.vuln > 0) fx.push('<span class="bad">⚠️ +50% dmg</span>');
    for (const b of F.S.buffs) { const ab = C.ab.find((q) => q.an === b.an); if (ab) fx.push(`<span class="good">${ab.ic} ${esc(ab.n)}</span>`); } if (F.blk) fx.push('<span class="good">🛡️ Blocking</span>');
    return `<div class="tp"><span class="who">[${esc(who)}]</span><span class="ch">${C.ic} ${esc(C.n)}</span><span class="rr" style="background:${RAR[C.r].c}">${RAR[C.r].n.toUpperCase()}</span></div>
      <div class="hl"><span>Hp</span><div class="du-bar hp${hp / F.mhp < 0.25 ? ' low' : ''}"><u style="width:${(F.hpLag || hp) / F.mhp * 100}%"></u><i style="width:${hp / F.mhp * 100}%"></i><b>${hp}/${F.mhp}</b></div></div>
      <div class="du-bar st${F.st < 25 ? ' tired' : ''}"><i style="width:${st}%"></i><b>Stamina ${st}/100</b></div><div class="fx">${fx.join('')}</div>`;
  }
  function hudTick(M, dt) {
    if (!HUD.el) return; const L = HUD.last, me = M.me, foe = M.foe;
    for (const F of [me, foe]) { F.hpLag = F.hpLag == null || F.hp > F.hpLag ? F.hp : F.hpLag - Math.max(F.mhp * 0.4 * dt, 0); if (F.hpLag < F.hp) F.hpLag = F.hp; }
    const a = hudCard(me, 'You'), b = hudCard(foe, M.pvp ? nameOf(M.opp) : `🤖 ${DIFF[M.D].n}`);
    if (a !== L.a) { $('#duMe').innerHTML = L.a = a; } if (b !== L.b) { $('#duOp').innerHTML = L.b = b; }
    const left = Math.max(0, M.left), sc = M.md === 'c' ? `<span class="sc"><span class="a">${M.sc[0]}</span><small>—</small><span class="b">${M.sc[1]}</span></span><span class="md">⚔️ Classic · first to ${TO} · round ${M.rd}</span>` : `<span class="sc"><span class="a">${M.kills}</span><small>kills</small><span class="b">${M.deaths}</span></span><span class="md">💀 Deathmatch · most kills</span>`;
    const mid = `<div class="tm${left < 20 && M.ph === 'fight' ? ' low' : ''}">${mmss(Math.ceil(left))}</div>${sc}`; if (mid !== L.m) $('#duMid').innerHTML = L.m = mid;
    for (let i = 0; i < 3; i++) { const ab = abOf(me, i), b = HUD.el.querySelector(`[data-ab="${i}"]`), cd = me.cd[i], key = `${ab.ic}|${ab.n}|${cd > 0 ? Math.ceil(cd * (cd < 1 ? 10 : 1)) : 0}|${Math.round(cd / me.cdMax[i] * 40)}|${canAct(me)}`;
      if (L['ab' + i] === key) continue; L['ab' + i] = key; b.querySelector('.e').textContent = ab.ic; b.querySelector('.n').textContent = ab.n; b.querySelector('.cd').style.setProperty('--p', (cd > 0 ? cd / me.cdMax[i] * 100 : 0) + '%'); b.querySelector('.s').textContent = cd > 0 ? (cd < 1 ? cd.toFixed(1) : Math.ceil(cd)) : ''; b.classList.toggle('ready', cd <= 0); }
    HUD.el.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('on', +b.dataset.mode === me.mode));
    const lk = HUD.el.querySelector('[data-k="lock"]'); if (lk) lk.classList.toggle('on', !!DU.lockOn); const rn = HUD.el.querySelector('[data-k="run"]'); if (rn) rn.classList.toggle('on', !!DU.touchRun); const bk = HUD.el.querySelector('[data-k="block"]'); if (bk) bk.classList.toggle('on', !!me.blk);
  }
  function big(text, sub, color, hold = 1.7) { const b = $('#duBig'); if (!b) return; b.innerHTML = text ? `${text}${sub ? `<small>${sub}</small>` : ''}` : ''; b.style.color = color || '#fff'; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); clearTimeout(HUD.bigT); HUD.bigT = setTimeout(() => { if (b.isConnected) b.innerHTML = ''; }, hold * 1000); }
  function feed(html) { const k = $('#duKill'); if (!k) return; const d = document.createElement('div'); d.innerHTML = html; k.prepend(d); setTimeout(() => d.remove(), 5000); while (k.children.length > 4) k.lastChild.remove(); }

  // a fighter's picture for the menus and the crate reel: in its guard, weapon in hand
  function fighterPic(c, big) {
    return snapshot(`duPic${c}|${AV.s}|${big ? 1 : 0}`, () => { const a = makeAvatar([AV.s, 0, 0, 0, 17, 0, 0, 0, 0, 0, 23 + c, 15 + c], '', true); scene.remove(a.shadow); for (let k = 0; k < 25; k++) animateAvatar(a, 0.1, false, false); return a.g; },
      { w: big ? 300 : 180, h: big ? 360 : 200, dir: [0.55, 0.12, -1], zoom: 0.9, sphere: [[0, 3.6, 0], 4.7] });
  }
  const rollFoe = (Di) => { const w = [[62, 30, 8, 0], [40, 35, 22, 3], [18, 30, 37, 15], [5, 18, 37, 40]][Di]; let r = Math.random() * 100, k = 0; while (k < 3 && r >= w[k]) { r -= w[k]; k++; } const pool = CH.filter((C) => C.r === k); return pool[Math.floor(Math.random() * pool.length)].i; };
  const DEF_SAVE = () => ({ own: [0], eq: 0, xp: {}, st: {}, ach: [], diff: 1, md: 'c', lock: 1 });

  const DU = {
    id: 'duel', code: 'du', genre: 'PvP', rank: 0.001, name: 'Colosseum Duels', emoji: '⚔️', max: 12, stat: 'Wins', killY: -40, banner: true, camDist: 15, noReset: true, noSprint: true, respawnDelay: 2200,
    land: { theme: 'meadow', mode: 'ground', fence: 'none', box: [-86, -76, 86, 166] },
    color: 'linear-gradient(135deg,#7f1d1d,#b45309 45%,#1e3a8a)',
    desc: 'One on one in the Colosseum. Twenty fighters from Rome, Greece, medieval Europe and medieval Japan — win them from crates (each with a 1% legend: the Gladiator, the Spartan, the Heavy Knight, the Samurai) or the duel’s own achievements. Three abilities each, its own animations, and in a match you become your fighter. Classic (first to 3) or Deathmatch (most kills in 5 minutes), against a friend or a bot from Easy to Extreme. Master a fighter to wear it anywhere.',
    welcome: '⚔️ Pick a fighter (C), open crates, then stand on a pad to duel — or 🤖 fight a bot. In a match: click to attack, E and R abilities, Q dodge, F block.',
    welcomeTouch: '⚔️ Pick a fighter, open crates, then stand on a pad to duel — or 🤖 fight a bot.',
    M: null, proj: [], volleys: [], drops: [], save: null,
    build() { sky('#4f86c6', '#fde7c2'); buildColosseum(); buildLobby(); },
    async enter() {
      Object.assign(this, { M: null, proj: [], volleys: [], drops: [], padT: 0, padI: -1, done: new Set(), hitN: 0, hitSeen: 0, acN: 0, ac: null, dq: [], H: null, lastG: null, gSeen: null, blockHeld: false, rmb: false, touchRun: false, sprinting: false, tired: false, duAt: 0, duKey: '', warm: 0 });
      const s = await kvGet('duel'), S = this.save = Object.assign(DEF_SAVE(), s && typeof s === 'object' ? s : {});
      S.own = [...new Set((Array.isArray(S.own) ? S.own : []).map((x) => x | 0).filter((x) => x >= 0 && x < 20))]; if (!S.own.includes(0)) S.own.unshift(0);
      if (!S.own.includes(S.eq | 0)) S.eq = 0; S.eq |= 0; for (const k of ['xp', 'st']) if (!S[k] || typeof S[k] !== 'object') S[k] = {}; if (!Array.isArray(S.ach)) S.ach = []; S.diff = clamp(S.diff | 0, 0, 3); if (S.md !== 'd') S.md = 'c';
      this.lockOn = S.lock !== 0; send({ dw: S.st.wins | 0, du: null }); this.drawBar();
    },
    leave() {
      if (this.M) this.cleanMatch(); this.M = null; AVO = null; P.frozen = false;
      for (const p of this.proj) scene.remove(p.m); for (const v of this.volleys) scene.remove(v.ring); for (const d of this.drops) scene.remove(d.m);
      dropTrail(me); const r = $('#duReel'); if (r) r.remove(); document.body.classList.remove('duMatch'); if (this.saveT) { clearTimeout(this.saveT); kvSet('duel', this.save); }
    },
    dirty() { clearTimeout(this.saveT); this.saveT = setTimeout(() => { this.saveT = null; kvSet('duel', this.save); }, 700); },
    statOf(pr, isMe) { return isMe ? (this.save ? this.save.st.wins | 0 : 0) : +pr.dw || 0; },
    sortKey(pr, isMe) { return this.statOf(pr, isMe); },
    spawn() {
      const M = this.M;
      if (M && M.ph !== 'end') { if (M.md === 'd' && M.started) return this.randSpot(M.foe); const s = M.side; return [s ? 15 : -15, 0.5, 0, s ? Math.PI / 2 : -Math.PI / 2]; }
      return [(Math.random() - 0.5) * 12, 0.5, 122 + Math.random() * 6, 0];
    },
    randSpot(avoid) { for (let k = 0; k < 40; k++) { const a = Math.random() * Math.PI * 2, r = 0.25 + Math.sqrt(Math.random()) * 0.6, x = Math.cos(a) * A0 * r, z = Math.sin(a) * B0 * r;
      if (!avoid || Math.hypot(x - avoid.x, z - avoid.z) > 20 || k === 39) return [x, 0.5, z, angOf((avoid ? avoid.x : 0) - x, (avoid ? avoid.z : 0) - z)]; } },
    speed() { const M = this.M; if (!M) return 16; return fSpeed(M.me) * (this.sprinting ? 1.45 : 1); },
    jumpPower() { const M = this.M; if (!M) return JUMP; const F = M.me; return stunned(F) || F.S.root > 0 || F.act || F.blk ? 0 : JUMP * 0.9; },

    /* ---------------- the host: pairs up people standing on the same pad ---------------- */
    adopt() { const g = this.lastG; return { gs: 0, left: 0, el: 0, M: g && Array.isArray(g.M) ? g.M.slice() : [] }; },
    host() {
      const H = this.H; if (!H) return; const pl = players(), t = Date.now(); let ch = false;
      const busy = new Set(H.M.flatMap((m) => m.p));
      PADS.forEach((pd) => { const on = pl.filter((p) => !busy.has(p.peer) && Math.hypot(p.x - pd.x, p.z - pd.z) < 6 && !(p.pr.du && p.pr.du.m));
        if (on.length >= 2) { const m = { id: Math.random().toString(36).slice(2, 9), md: pd.md, p: [on[0].peer, on[1].peer], t }; H.M.push(m); busy.add(m.p[0]); busy.add(m.p[1]); ch = true; } });
      const keep = H.M.filter((m) => { const there = m.p.filter((id) => { const p = pl.find((q) => q.peer === id); return p && p.pr.du && p.pr.du.m === m.id; }).length; return t - m.t < 15000 || (there > 0 && t - m.t < 900000); });
      if (keep.length !== H.M.length) { H.M = keep; ch = true; }
      if (ch || performance.now() - (this.hsAt || 0) > 1000) { this.hsAt = performance.now(); hostSend(this); }
    },

    tick(dt) {
      const t = now();
      CROWD.u.uT.value = t; CROWD.ex = Math.max(0, CROWD.ex - dt * 0.35); CROWD.u.uAmp.value = 0.04 + CROWD.ex * 0.9;
      for (const f of SC.fires) { f.fl.forEach((s, j) => { const k = 1 + 0.22 * Math.sin(t * (13 + j * 4) + f.ph + j); s.scale.set(1.1 * k, 2.1 * k, 1); }); f.gl.material.opacity = 0.45 + 0.12 * Math.sin(t * 11 + f.ph); }
      SC.crates.forEach((c, i) => { c.c.position.y = 3.7 + 0.25 * Math.sin(t * 1.6 + i); c.c.rotation.y = 0.35 * Math.sin(t * 0.7 + i); c.c.userData.gl.material.opacity = 0.28 + 0.12 * Math.sin(t * 3 + i); });
      SC.padFx.forEach((p, i) => { p.glow.material.opacity = 0.35 + 0.3 * Math.sin(t * 3 + i * 1.5); });
      const g = roundState(this);
      if (this.M) { this.matchFrame(dt); return; }
      if (this.warm < 20 && !panelOpen()) fighterPic(this.warm++); // (the menus' pictures, one a frame)
      const mine = myPeer(), m = g && Array.isArray(g.M) ? g.M.find((q) => Array.isArray(q.p) && q.p.includes(mine) && !this.done.has(q.id)) : null;
      if (m) { this.startMatch({ md: m.md === 'd' ? 'd' : 'c', pvp: true, mid: m.id, opp: m.p.find((x) => x !== mine), side: m.p.indexOf(mine) }); return; }
      const pi = PADS.findIndex((p) => Math.hypot(P.x - p.x, P.z - p.z) < 6) ;
      if (pi !== this.padI) { this.padI = pi; this.padT = 0; if (pi >= 0) sfx('select'); }
      const S = this.save, D = DIFF[S.diff];
      if (pi >= 0 && !P.dead) { this.padT += dt; setBanner(`${PADS[pi].n} · ⏳ Waiting for an opponent — a ${D.e} ${D.n} bot takes the spot in ${Math.max(1, Math.ceil(8 - this.padT))}s`);
        if (this.padT > 8) { this.padT = 0; this.startMatch({ md: PADS[pi].md, pvp: false, D: S.diff }); } }
      else setBanner(`${CH[S.eq].ic} <b>${esc(CH[S.eq].n)}</b> · stand on a ⚔️ pad to duel, or 🤖 fight a bot`);
    },

    /* ---------------- a match ---------------- */
    startMatch(o) {
      closePanel(); const S = this.save, c = S.eq, M = this.M = Object.assign({ ph: 'intro', t: 0, left: o.md === 'd' ? DM_T : ROUND_T, rd: 1, sc: [0, 0], dr: 0, l: 0, fl: 0, d: 0, kills: 0, deaths: 0, dealt: 0, roundsWon: 0, side: 0, goneT: 0, started: false }, o);
      M.me = newFighter(c, 'me', { name: Net.name });
      if (o.pvp) { M.foe = newFighter(0, 'rem', { peer: o.opp, name: nameOf(o.opp) }); M.foe.acSeen = -1; const q = this.foeDu(true); this.hitSeen = Math.max(0, ...((q && Array.isArray(q.dq) ? q.dq : []).map((h) => (Array.isArray(h) ? +h[0] || 0 : 0)))); }
      else { const D = DIFF[o.D], fc = rollFoe(o.D); M.foe = newFighter(fc, 'bot', { D: o.D, hpM: D.hpM, dmgM: D.dmgM, name: `🤖 ${CH[fc].n}` }); M.side = Math.random() < 0.5 ? 0 : 1; M.foe.av = [Math.floor(Math.random() * 5), 0, 0, 0, 17, 0, 0, 0, 0, 0, 23 + fc, 15 + fc]; }
      this.respawnDelay = M.md === 'd' ? 450 : 1e9;
      setAvOverride({ av: [AV.s, AV.sh, AV.p, 0, AV.f, 0, 0, 0, 0, 0, 23 + c, 15 + c] });
      document.body.classList.add('duMatch'); setBar(''); setBanner(''); hudBuild(M); this.resetRound(true);
      this.bump('played', 1); sfx('horn'); if (o.pvp) this.pubDu(true);
    },
    revive(F) { Object.assign(F, { hp: F.mhp, st: 100, dead: false, act: null, blk: false, push: null, lift: 0, nx: 0, rTaken: 0 }); F.S = { stun: 0, root: 0, slow: 0, slowM: 1, vuln: 0, ifr: 0, dots: [], buffs: [] }; },
    botAvatar(F) { if (F.a) { dropTrail(F.a); dropAvatar(F.a); } F.a = makeAvatar(F.av, F.name, false); F.a.dgMode = F.mode; scene.add(F.a.g); F.a.g.position.set(F.x, 0, F.z); F.a.g.rotation.y = F.yaw; },
    resetRound(first) {
      const M = this.M; M.ph = 'intro'; M.t = 0; M.toT = null; M.toWait = 0; M.left = M.md === 'd' ? DM_T : ROUND_T; M.base = { l: M.l, fl: this.foeL() };
      for (const F of [M.me, M.foe]) { this.revive(F); F.cd = [0, 0, 0]; }
      for (const p of this.proj) scene.remove(p.m); for (const v of this.volleys) scene.remove(v.ring); for (const d of this.drops) scene.remove(d.m); this.proj = []; this.volleys = []; this.drops = [];
      respawn(true); M.me.x = P.x; M.me.z = P.z; M.me.yaw = P.yaw; cam.yaw = P.yaw;
      if (M.foe.kind === 'bot') { const s = 1 - M.side; Object.assign(M.foe, { x: s ? 15 : -15, z: 0, yaw: s ? Math.PI / 2 : -Math.PI / 2 }); this.botAvatar(M.foe); }
      big(M.md === 'd' ? '💀 DEATHMATCH' : `ROUND ${M.rd}`, M.md === 'd' ? 'most kills in 5:00 — you come back at once' : M.sc[0] === TO - 1 && M.sc[1] === TO - 1 ? 'FINAL ROUND' : `first to ${TO}`, '#fde68a'); if (!first) sfx('horn');
      this.pubDu(true);
    },
    foeDu(any) { const M = this.M, p = M && Net.peers.find((q) => q.peer === M.opp), du = p && p.presence && p.presence.du; return du && (any || du.m === M.mid) ? du : null; },
    foeL() { const M = this.M; if (!M.pvp) return M.fl; const du = this.foeDu(); return du ? du.l | 0 : M.flSeen || 0; },
    matchFrame(dt) {
      const M = this.M, F = M.me, T = M.foe; M.t += dt;
      this.syncF(F); this.syncF(T); if (M.pvp) this.mirror(T, dt); if (!this.M) return;
      // my hands: blocking, sprinting
      const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y, r = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x, moving = Math.hypot(f, r) > 0.2;
      F.blk = (this.blockHeld || this.rmb || !!keys.KeyF) && live() && !F.act && !stunned(F) && F.st > 0 && !F.dead;
      if (F.st <= 0) this.tired = true; else if (F.st > 30) this.tired = false;
      this.sprinting = (sprintHeld() || this.touchRun) && moving && !this.tired && !F.blk && !F.act && live() && fSpeed(F) > 0;
      if (F.act && F.act.ab.k !== 'buff' && !F.act.vis) { P.yaw = F.yaw = F.act.yaw; }
      if (M.ph === 'intro') { if (M.t > 1.7 && !M.fightSaid) { M.fightSaid = 1; big('⚔️ FIGHT!', '', '#fef3c7'); } if (M.t > 2.6) { M.ph = 'fight'; M.t = 0; M.started = true; M.fightSaid = 0; sfx('go'); CROWD.ex = 1; } }
      else if (M.ph === 'fight') {
        M.left -= dt; if (M.pvp) this.recvHits();
        statusTick(F, dt); actTick(F, dt); statusTick(T, dt);
        if (T.kind === 'bot') { if (!T.dead) { botTick(T, dt); actTick(T, dt); } } else actTick(T, dt);
        projTick(dt);
        if (M.md === 'd') {
          if (F.dead && !P.dead) { this.revive(F); F.x = P.x; F.z = P.z; burstAt(P.x, 3, P.z, '#fde68a', 6); }
          if (T.kind === 'bot' && T.dead && (T.respT -= dt) <= 0) { this.revive(T); [T.x, , T.z, T.yaw] = this.randSpot(F); this.botAvatar(T); burstAt(T.x, 3, T.z, '#fca5a5', 6); }
          if (M.left <= 0) this.endMatch(M.kills > M.deaths ? 1 : M.kills < M.deaths ? -1 : 0);
        } else {
          const fl = this.foeL(), iLost = M.l > M.base.l, iWon = fl > M.base.fl;
          if (iLost || iWon) this.roundOver(iWon && !iLost ? 1 : iLost && !iWon ? -1 : 0);
          else if (M.left <= 0) { M.ph = 'time'; M.t = 0; big('⏰ TIME!', 'the most health left takes the round', '#fde68a'); }
        }
      } else if (M.ph === 'time') { // (time's up: the one with less health left loses the round)
        const fl = this.foeL(); if (fl > M.base.fl) this.roundOver(1); else if (M.l > M.base.l) this.roundOver(-1);
        else if (M.t > 0.8) { const a = F.hp / F.mhp, b = T.hp / T.mhp;
          if (Math.abs(a - b) < 0.001) { M.dr++; this.roundOver(0); } else if (a < b) { M.l++; this.pubDu(true); this.roundOver(-1); } else if (!M.pvp) { M.fl++; this.roundOver(1); } else if (M.t > 3.5) { M.dr++; this.roundOver(0); } }
      } else if (M.ph === 'rend') { if (M.t > 3.6) { if (M.sc[0] >= TO || M.sc[1] >= TO) this.endMatch(M.sc[0] >= TO ? 1 : -1); else { M.rd++; this.resetRound(); } } }
      else if (M.ph === 'end') { if ((M.autoT -= dt) <= 0) { this.leaveMatch(); return; } }
      // the bot's body
      if (T.kind === 'bot' && T.a) { if (T.a.dead) updateDead(T.a, dt); else { T.a.g.position.set(T.x, T.y + (T.lift || 0), T.z); T.a.g.rotation.y = T.yaw; animateAvatar(T.a, T.sprint ? dt * 1.4 : dt, !!T.mv, (T.lift || 0) > 0.5); placeShadow(T.a); } }
      // lock-on: the camera keeps them in view and you face them
      if (this.lockOn && !T.dead && !bval(T, 'inv') && M.ph !== 'end') { const ty = angOf(T.x - P.x, T.z - P.z); cam.yaw += wrapA(ty + 0.32 - cam.yaw) * Math.min(1, dt * 5); if (!this.sprinting && !(F.act && F.act.ab.k !== 'buff') && !F.push && live()) P.yaw = F.yaw = ty; }
      P.frozen = M.ph !== 'fight' || stunned(F) || F.S.root > 0 || !!F.push || F.dead || !!(F.act && (F.act.ab.k === 'dash' || F.act.ab.k === 'leap'));
      // nobody else in the arena but the two of you
      for (const [peer, a] of Net.avatars) { a.g.visible = M.pvp && peer === M.opp && !(T.S.buffs.some((b) => b.inv)); if (a.pet) a.pet.g.visible = false; }
      if (T.kind === 'bot' && T.a) T.a.g.visible = !bval(T, 'inv');
      this.pubDu(); hudTick(M, dt); const tip = $('#duTip'); if (tip && M.rd === 1 && M.t > 12 && M.ph === 'fight') tip.style.opacity = 0;
    },
    syncF(F) {
      if (F.kind === 'me') { if (F.a !== me) { dropTrail(F.a); F.a = me; } F.x = P.x; F.y = P.y; F.z = P.z; if (!F.act || F.act.ab.k === 'buff') F.yaw = P.yaw; }
      else if (F.kind === 'rem') { const a = Net.avatars.get(F.peer) || null; if (F.a !== a) { dropTrail(F.a); F.a = a; } if (a) { F.x = a.g.position.x; F.y = a.g.position.y; F.z = a.g.position.z; F.yaw = a.g.rotation.y; } }
      if (F.a) F.a.dgMode = F.mode;
    },
    // the other player: their numbers from what they say, their blows played out here for the look of it
    mirror(F, dt) {
      const M = this.M, du = this.foeDu();
      if (!du) { M.goneT += dt; if (M.goneT > (M.started ? 5 : 12) && M.ph !== 'end') { feed('🏳️ They left the arena — you win'); this.endMatch(1); } return; }
      M.goneT = 0; M.flSeen = du.l | 0;
      if (CH[du.c] && du.c !== F.c) { F.c = du.c | 0; F.C = CH[F.c]; }
      F.hp = clamp(+du.hp || 0, 0, 2000); F.mhp = Math.max(1, +du.mhp || F.C.hp); F.st = clamp(+du.st || 0, 0, 100); F.mode = du.mo | 0; const sx = String(du.sx || '');
      F.blk = sx.includes('b'); F.S.stun = sx.includes('s') ? 0.3 : 0; F.S.root = sx.includes('r') ? 0.3 : 0; F.S.slow = sx.includes('w') ? 0.3 : 0;
      F.S.buffs = (Array.isArray(du.bf) ? du.bf : []).slice(0, 4).map((an) => ({ an: String(an), t: 0.3, inv: an === 'smoke' ? 1 : undefined }));
      if (Array.isArray(du.ac) && du.ac[0] !== F.acSeen) { const first = F.acSeen === -1; F.acSeen = du.ac[0];
        if (!first) { if (du.ac[3]) { smokeAt(F.x, 0.6, F.z, 5, '#e7d3a8', 1.6); sfx3('whoosh', F.x, F.z, 50); } else if (du.ac[1] >= 0 && du.ac[1] < 3) { F.mode = du.ac[2] | 0; F.act = null; useAb(F, du.ac[1] | 0, true); if (F.act && F.act.ab.k === 'volley') { F.act.tx = +du.ac[4] || 0; F.act.tz = +du.ac[5] || 0; } } } }
      const d = du.d | 0; if (F.dSeen == null) F.dSeen = d;
      if (d > F.dSeen) { F.dSeen = d; M.kills++; this.bump('kills', 1); quest('duel.kill'); feed(`⚔️ You defeated <b>${esc(nameOf(M.opp))}</b>`); big('⚔️ KO!', '', '#fde68a'); CROWD.ex = 1; sfx('kill'); }
      F.dead = !!du.dead;
    },
    recvHits() {
      const M = this.M, du = this.foeDu(), q = du && Array.isArray(du.dq) ? du.dq : (() => { const p = Net.peers.find((x) => x.peer === M.opp); return p && p.presence && Array.isArray(p.presence.dq) ? p.presence.dq : []; })();
      for (const h of q) { if (!Array.isArray(h) || !(+h[0] > this.hitSeen)) continue; this.hitSeen = +h[0]; if (h[1] !== myPeer() || h[4] !== M.mid) continue;
        const fx = h[3] && typeof h[3] === 'object' ? h[3] : {}; takeHit(M.me, clamp(+h[2] || 0, 0, 450), fx, M.foe, { rf: !!fx.rf }); }
    },
    sendHit(T, dmg, fx, F) { this.hitN++; this.dq = this.dq.concat([[this.hitN, T.peer, dmg, fx || {}, this.M.mid]]).slice(-10); send({ dq: this.dq }); },
    pubAct(F, A, kind) { this.acN++; this.ac = [this.acN, A ? A.i : -1, F.mode, kind === 'dodge' ? 1 : 0, A && A.tx != null ? Math.round(A.tx) : 0, A && A.tz != null ? Math.round(A.tz) : 0]; this.pubDu(true); },
    pubDu(force) {
      const M = this.M; if (!M || !M.pvp) return; const F = M.me;
      const du = { m: M.mid, c: F.c, hp: Math.max(0, Math.round(F.hp)), mhp: F.mhp, st: Math.round(F.st), l: M.l, d: M.d, dead: F.dead ? 1 : 0, ac: this.ac, mo: F.mode,
        sx: (F.blk ? 'b' : '') + (F.S.stun > 0 ? 's' : '') + (F.S.root > 0 ? 'r' : '') + (F.S.slow > 0 ? 'w' : ''), bf: F.S.buffs.map((b) => b.an).slice(0, 4) };
      const key = JSON.stringify(du), t = now(); if (key === this.duKey || (!force && t - this.duAt < 0.1)) return; this.duKey = key; this.duAt = t; send({ du });
    },
    killed(T, from) {
      const M = this.M; if (!M || T.dead) return; T.dead = true; T.act = null; T.blk = false; T.S.dots = []; T.S.buffs = []; CROWD.ex = 1; sfx3('kill', T.x, T.z, 90);
      if (T.kind === 'me') { M.l++; M.d++; M.deaths++; die(); feed(`💀 <b>${esc(M.foe.name)}</b> defeated you`); big('☠️ DEFEATED', '', '#fca5a5'); this.pubDu(true); }
      else { M.fl++; M.kills++; T.respT = 0.6; this.bump('kills', 1); quest('duel.kill'); if (T.a && !T.a.dead) scatter(T.a); feed(`⚔️ You defeated <b>${esc(T.name)}</b>`); big('⚔️ KO!', '', '#fde68a'); }
    },
    roundOver(r) {
      const M = this.M; M.ph = 'rend'; M.t = 0; M.sc = [this.foeL(), M.l]; CROWD.ex = 1;
      if (r > 0) { M.roundsWon++; quest('duel.round'); if (!(M.me.rTaken > 0)) { this.bump('flaw', 1); feed('✨ Flawless round!'); } big('🏆 ROUND WON', `${M.sc[0]} — ${M.sc[1]}`, '#86efac'); sfx('levelup'); }
      else if (r < 0) { big('ROUND LOST', `${M.sc[0]} — ${M.sc[1]}`, '#fca5a5'); sfx('lose'); } else big('DRAW', `${M.sc[0]} — ${M.sc[1]}`, '#e2e8f0');
      this.pubDu(true);
    },
    endMatch(r) {
      const M = this.M; if (!M || M.ph === 'end') return; M.ph = 'end'; M.t = 0; M.autoT = 25; P.frozen = true; const S = this.save;
      const D = M.pvp ? null : DIFF[M.D]; let coins = r > 0 ? (M.pvp ? 60 : D.coins) : r < 0 ? (M.pvp ? 15 : 8) : 20; coins += M.roundsWon * 5 + (M.md === 'd' ? M.kills * 3 : 0);
      const xp = Math.round((M.dealt / 10 + M.kills * 25 + M.roundsWon * 40 + (r > 0 ? 120 : 30)) * (M.pvp ? 1.5 : [0.6, 1, 1.3, 1.6][M.D]));
      if (r > 0) { this.bump('wins', 1); if (M.md === 'c') this.bump('cwins', 1); if (!M.pvp) for (let k = 0; k <= M.D; k++) this.bump('b' + k, 1); quest('duel.win'); send({ dw: S.st.wins | 0 }); }
      if (M.md === 'd') { this.bump('dmk', M.kills); if (r > 0 && M.kills >= 15) this.bump('dm15', 1); }
      earn(coins, `${r > 0 ? 'Victory' : r < 0 ? 'Defeat' : 'Draw'} in Colosseum Duels`); const mr = this.addXp(M.me.c, xp);
      sfx(r > 0 ? 'win' : 'lose'); CROWD.ex = 1; this.result(r, coins, xp, mr); this.pubDu(true);
    },
    result(r, coins, xp, mr) {
      const M = this.M, C = M.me.C, el = document.createElement('div'); el.id = 'duRes'; el.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(2,6,23,.5);pointer-events:auto;z-index:20';
      const sc = M.md === 'c' ? `${M.sc[0]} — ${M.sc[1]}` : `${M.kills} kills · ${M.deaths} deaths`, foe = M.pvp ? esc(nameOf(M.opp)) : `${DIFF[M.D].e} ${DIFF[M.D].n} bot`, lv = mr.after, nx = MAST[Math.min(10, lv + 1)], have = this.save.xp[C.i] | 0;
      el.innerHTML = `<div class="du-res" style="padding:22px 30px;border-radius:22px;background:linear-gradient(180deg,rgba(30,41,59,.96),rgba(15,23,42,.96));border:2px solid ${r > 0 ? '#fbbf24' : '#475569'};box-shadow:0 20px 60px rgba(0,0,0,.6);max-width:min(470px,92vw)">
        <div style="font:800 50px/1 var(--fh);color:${r > 0 ? '#fde68a' : r < 0 ? '#fca5a5' : '#e2e8f0'};-webkit-text-stroke:6px rgba(0,0,0,.4);paint-order:stroke fill">${r > 0 ? '🏆 VICTORY' : r < 0 ? '☠️ DEFEAT' : '🤝 DRAW'}</div>
        <div style="font:700 15px var(--fb);color:#cbd5e1">${C.ic} ${esc(C.n)} vs ${foe} · ${sc}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;font:800 15px var(--fh)"><span style="padding:6px 12px;border-radius:10px;background:rgba(250,204,21,.15);color:#fde68a">🪙 +${coins}</span><span style="padding:6px 12px;border-radius:10px;background:rgba(251,191,36,.12);color:#fbbf24">🌟 +${xp} mastery XP</span><span style="padding:6px 12px;border-radius:10px;background:rgba(255,255,255,.08);color:#e2e8f0">💥 ${M.dealt} damage</span></div>
        <div style="width:100%"><div style="font:700 12.5px var(--fb);color:#e2e8f0;margin-bottom:4px">${mr.after > mr.before ? `⬆️ <b style="color:#fde68a">Mastery ${lv}!</b>` : `Mastery ${lv}/10`} ${lv >= 10 ? '— mastered: wear it anywhere from the avatar editor' : `· ${have}/${nx} XP`}</div><div class="du-mx" style="margin:0"><i style="width:${lv >= 10 ? 100 : (have - MAST[lv]) / (nx - MAST[lv]) * 100}%"></i></div></div>
        <div style="display:flex;gap:10px;margin-top:6px"><button class="du-btn" data-x="again">${M.pvp ? '🏛️ Back to the courtyard' : '🔁 Rematch'}</button>${M.pvp ? '' : '<button class="du-btn alt" data-x="lobby">🏛️ Courtyard</button>'}</div></div>`;
      HUD.el.append(el); if (document.exitPointerLock) document.exitPointerLock();
      el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const again = b.dataset.x === 'again' && !M.pvp, o = { md: M.md, pvp: false, D: M.D }; this.leaveMatch(); if (again) this.startMatch(o); });
    },
    cleanMatch() {
      const M = this.M; if (!M) return; if (M.foe.kind === 'bot' && M.foe.a) { dropTrail(M.foe.a); dropAvatar(M.foe.a); } dropTrail(M.me.a); if (M.foe.kind === 'rem') dropTrail(M.foe.a);
      for (const p of this.proj) scene.remove(p.m); for (const v of this.volleys) scene.remove(v.ring); for (const d of this.drops) scene.remove(d.m); this.proj = []; this.volleys = []; this.drops = [];
      if (HUD.el) HUD.el.remove(); HUD.el = null; document.body.classList.remove('duMatch'); for (const a of Net.avatars.values()) { a.g.visible = true; if (a.pet) a.pet.g.visible = true; }
      if (M.mid) this.done.add(M.mid);
    },
    leaveMatch() {
      if (!this.M) return; this.cleanMatch(); this.M = null; this.respawnDelay = 2200; this.blockHeld = this.rmb = false; this.sprinting = false;
      setAvOverride(null); respawn(true); P.frozen = false; send({ du: null }); this.drawBar(); this.padI = -1;
    },

    /* ---------------- the fighting keys ---------------- */
    tryAb(i) { const M = this.M; if (!M) return; const ok = useAb(M.me, i); const b = HUD.el && HUD.el.querySelector(`[data-ab="${i}"]`); if (b) { b.classList.remove('act', 'no'); void b.offsetWidth; b.classList.add(ok ? 'act' : 'no'); } },
    tryDodge() { const M = this.M; if (!M) return; const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y, r = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x, cy = cam.yaw;
      dodge(M.me, -Math.sin(cy) * f + Math.cos(cy) * r, -Math.cos(cy) * f - Math.sin(cy) * r); },
    setMode(k) { const M = this.M; if (!M) return; const md = M.me.C.ab[0].modes; if (!md || k >= md.length || M.me.act || k === M.me.mode) return; M.me.mode = k; sfx('select'); floatText(M.me, `${md[k].ic} ${md[k].n}`, 'tag'); this.pubDu(true); },
    toggleLock() { this.lockOn = !this.lockOn; this.save.lock = this.lockOn ? 1 : 0; this.dirty(); toast(this.lockOn ? '🎯 Lock-on: the camera follows your opponent' : '🎯 Lock-on off'); sfx('click'); },
    press(btn, down) { if (this.M && btn === 2) this.rmb = !!down; },
    click(e) { if (this.M && e.button !== 2 && !$('#duRes')) this.tryAb(0); },
    key(code, down) {
      if (!this.M) { if (down && code === 'KeyC') { this.fightersPanel(); return true; } return; }
      if (code === 'KeyF') { this.blockHeld = !!down; return true; }
      if (!down) return;
      if (code === 'KeyE') { this.tryAb(1); return true; } if (code === 'KeyR') { this.tryAb(2); return true; } if (code === 'KeyQ') { this.tryDodge(); return true; } if (code === 'KeyT') { this.toggleLock(); return true; }
      if (/^Digit[1-3]$/.test(code) && this.M.me.C.ab[0].modes) { this.setMode(+code.slice(5) - 1); return true; }
    },
    menuKey(code) { if (code === 'KeyC') closePanel(); },
    pose(dt) {
      const M = this.M; if (!M) return;
      for (const F of [M.me, M.foe]) { const a = F.a; if (!a || a.dead) continue;
        poseAct(F, dt); trailTick(F, !!(F.act && F.act.trail)); buffLook(F); statusLook(F, dt);
        if (F.lift) a.g.position.y += F.lift;
        if (F.blk && !F.act) setPose(F, F.C.ab[1].an === 'bash' || [0, 3, 4, 5, 8, 9, 10, 12, 13].includes(F.c) ? AN.shieldup : { aR: [1.3, 0.3, -0.5], eR: [1.3], aL: [1.2, -0.3, 0.6], eL: [1.3], bd: [-0.1, 0, 0] }, Math.min(1, dt * 14)); // (a block: the shield up, or the blade across)
        if (F.kind === 'me') { const inv = bval(F, 'inv') > 0; if (inv !== !!a.duInv) { a.duInv = inv; a.g.traverse((o) => { const m = o.material; if (!m || o.isSprite || Array.isArray(m)) return; if (!m.userData.op0) m.userData.op0 = [m.transparent, m.opacity]; m.transparent = inv || m.userData.op0[0]; m.opacity = inv ? 0.28 : m.userData.op0[1]; }); } } // (in the smoke: half there)
        if (a.shadow && !a.g.visible) a.shadow.visible = false; }
      for (const a of Net.avatars.values()) if (!a.g.visible && a.shadow) a.shadow.visible = false;
    },
    prompts() {
      if (this.M) return [];
      return [{ x: ARMORY.x, z: ARMORY.z, r: 7, text: 'Fighters', fn: () => this.fightersPanel() }, { x: BOTGATE.x, z: BOTGATE.z, r: 7, text: 'Fight a bot', fn: () => this.botPanel() }, { x: TABLET.x, z: TABLET.z - 1.5, r: 7, text: 'Achievements', fn: () => this.achPanel() }]
        .concat(SHRINES.map((s) => ({ x: s.x, z: s.z, r: 6.5, text: `Open the ${EMP[s.e].n} crate`, fn: () => this.cratesPanel(s.e) })));
    },
    say(F, text) { floatText(F, text, 'tag'); },
    flash() { const d = document.createElement('div'); d.style.cssText = 'position:absolute;inset:0;background:#fff;opacity:.85;pointer-events:none;transition:opacity .45s'; $('#xhud').append(d); requestAnimationFrame(() => { d.style.opacity = 0; }); setTimeout(() => d.remove(), 500); },

    /* ---------------- progress: stats, the duel's achievements, mastery ---------------- */
    bump(k, n = 1) { const st = this.save.st; st[k] = (st[k] | 0) + n; this.checkAch(); this.dirty(); },
    checkAch() {
      const S = this.save;
      for (const A of ACH) { if (S.ach.includes(A.id)) continue; const v = A.k === 'mast' ? S.st.mast | 0 : S.st[A.k] | 0; if (v < A.n0) continue;
        S.ach.push(A.id); const C = CH[A.c]; sfx('unlock');
        if (!S.own.includes(A.c)) { S.own.push(A.c); toast(`🏆 ${A.n} — ${C.ic} ${C.n} unlocked!`, '#fde68a'); say(`🏆 Duel achievement: ${A.n} — you’ve won the ${C.n}!`, '#fde68a'); }
        else { toast(`🏆 ${A.n}!`, '#fde68a'); earn(100, `Duel achievement: ${A.n}`); }
        this.dirty(); if (!this.M) this.drawBar(); }
    },
    addXp(c, n) {
      const S = this.save, before = mLvl(S.xp[c] | 0); S.xp[c] = (S.xp[c] | 0) + Math.max(0, Math.round(n)); const after = mLvl(S.xp[c]);
      if (after > before) { say(`🌟 ${CH[c].n}: mastery ${after}!`, '#fde68a'); sfx('levelup'); S.st.mast = Math.max(S.st.mast | 0, after); this.checkAch(); }
      if (after >= 10 && before < 10) { grantCosmetic('bt', DUEL_BT + c, `you mastered the ${CH[c].n}`); grantCosmetic('an', DUEL_AN + c, `you mastered the ${CH[c].n}`); toast(`👑 ${CH[c].n} MASTERED — its body and animations are yours!`, '#fde68a'); }
      this.dirty(); return { before, after };
    },

    /* ---------------- the menus ---------------- */
    drawBar() {
      if (this.M || !this.save) { setBar(''); return; } const S = this.save, C = CH[S.eq];
      setBar(`<button class="xslot" data-k="fi"><span class="k">C</span><span class="e">${C.ic}</span>${esc(C.n)}<small>🌟 mastery ${mLvl(S.xp[S.eq] | 0)}/10</small></button><button class="xslot" data-k="cr"><span class="e">🎁</span>Crates<small>🪙 ${CRATE_PRICE} each</small></button><button class="xslot" data-k="bot"><span class="e">🤖</span>Fight a bot<small>${DIFF[S.diff].e} ${DIFF[S.diff].n}</small></button><button class="xslot" data-k="ach"><span class="e">🏆</span>Achievements<small>${S.ach.length}/${ACH.length}</small></button>`,
        (b) => { const k = b.dataset.k; if (k === 'fi') this.fightersPanel(); else if (k === 'cr') this.cratesPanel(); else if (k === 'bot') this.botPanel(); else if (k === 'ach') this.achPanel(); });
    },
    fightersPanel(sel) {
      const S = this.save; if (sel == null) sel = S.eq; const C = CH[sel], own = S.own.includes(sel), xp = S.xp[sel] | 0, lv = mLvl(xp), nx = MAST[Math.min(10, lv + 1)], A = ACH.find((q) => q.c === sel);
      const how = `🔒 ${A ? `Win it with the duel achievement <b>${esc(A.n)}</b> (${esc(A.d)}), or find it` : 'Only'} in the ${EMP[C.e].e} ${esc(EMP[C.e].n)} crate (${ODDS[CRATE[C.e].indexOf(sel)]}%)`;
      const abl = C.ab.map((ab, i) => ab.modes ? ab.modes.map((m, k) => `<div><i>${m.ic}</i><span><b>${['M1', 'E', 'R'][i]} · ${esc(m.n)}</b> (key ${k + 1}) — <em>${m.dmg}</em> damage, every <em>${m.cd} s</em></span></div>`).join('')
        : `<div><i>${ab.ic}</i><span><b>${['M1', 'E', 'R'][i]} · ${esc(ab.n)}</b> — ${ab.d ? esc(ab.d) : `<em>${ab.dmg}</em> damage${ab.k === 'proj' ? ' (ranged)' : ''}`} · cooldown <em>${ab.cd} s</em></span></div>`).join('');
      const det = `<div class="du-det" style="--rc:${RAR[C.r].c}"><img src="${fighterPic(sel, 1)}" alt=""><div><div class="sub">${EMP[C.e].e} ${esc(EMP[C.e].n)} · ${RAR[C.r].n}</div><h3>${C.ic} ${esc(C.n)}</h3>
        <div class="du-stats"><span>❤️ ${C.hp} HP</span>${C.def < 1 ? `<span>🛡️ −${Math.round((1 - C.def) * 100)}% damage taken</span>` : ''}${C.spd !== 1 ? `<span>${C.spd > 1 ? '🏃 +' : '🐢 −'}${Math.round(Math.abs(C.spd - 1) * 100)}% speed</span>` : ''}<span>💨 Q dodge · 🛡️ F block</span></div>
        <div class="du-abl">${abl}</div>
        <div style="margin-top:10px;font:700 12.5px var(--fb);color:#e2e8f0">🌟 Mastery ${lv}/10 ${lv >= 10 ? '— <b style="color:#fde68a">MASTERED</b>: its body and animation pack are in your avatar editor' : `· ${xp}/${nx} XP — master it (10) to wear its body and animations anywhere`}</div><div class="du-mx" style="margin:4px 0 12px"><i style="width:${lv >= 10 ? 100 : (xp - MAST[lv]) / (nx - MAST[lv]) * 100}%"></i></div>
        ${own ? (S.eq === sel ? '<button class="du-btn alt" disabled>✔ Equipped</button>' : `<button class="du-btn" data-eq="${sel}">⚔️ Equip</button>`) : `<div style="font:600 12.5px/1.45 var(--fb);color:#cbd5e1">${how}</div>`}</div></div>`;
      const tile = (c) => { const Q = CH[c], o = S.own.includes(c), l = mLvl(S.xp[c] | 0), x = S.xp[c] | 0, n2 = MAST[Math.min(10, l + 1)];
        return `<button class="du-tile${o ? '' : ' lock'}${c === sel ? ' on' : ''}" data-pick="${c}" style="--rc:${RAR[Q.r].c}"><img src="${fighterPic(c)}" alt="">${o ? '' : '<span class="lk">🔒</span>'}${c === S.eq ? '<span class="eq">EQUIPPED</span>' : ''}${o ? `<span class="mb">🌟 ${l}</span>` : ''}<div class="t"><b>${Q.ic} ${esc(Q.n)}</b><small>${RAR[Q.r].n}</small>${o ? `<div class="du-mx"><i style="width:${l >= 10 ? 100 : (x - MAST[l]) / (n2 - MAST[l]) * 100}%"></i></div>` : ''}</div></button>`; };
      const grid = EMP.map((E, e) => `<h4 style="margin:12px 0 7px;font:800 16px var(--fh);color:#fff">${E.e} ${esc(E.n)}</h4><div class="du-grid">${CRATE[e].map(tile).join('')}</div>`).join('');
      openPanel('⚔️ Fighters', det + grid, (b) => { if (b.dataset.eq) { S.eq = +b.dataset.eq; this.dirty(); sfx('select'); this.drawBar(); this.fightersPanel(S.eq); } else if (b.dataset.pick) { sfx('click'); this.fightersPanel(+b.dataset.pick); $('#xpBody').scrollTop = 0; } }, null, { full: true, extra: `<span class="xchip">⚔️ ${S.own.length}/20</span>` });
    },
    cratesPanel(only) {
      const S = this.save;
      const html = `<div class="du-crates">${EMP.map((E, e) => `<div class="du-crate" style="--c1:${E.c1};--c2:${E.c2}${only === e ? ';box-shadow:0 0 0 3px #fde68a' : ''}"><h4>${E.e} ${esc(E.n)} Crate</h4><span style="font:600 12px/1.35 var(--fb);color:#cbd5e1">${esc(E.d)}</span>
        <div class="od">${CRATE[e].map((c, k) => `<span style="--rc:${RAR[CH[c].r].c}"><b>${CH[c].ic} ${esc(CH[c].n)}${S.own.includes(c) ? ' ✔' : ''}</b><i>${ODDS[k]}% · ${RAR[CH[c].r].n}</i></span>`).join('')}</div>
        <button class="du-btn" data-open="${e}" ${W.coins < CRATE_PRICE ? 'disabled' : ''}>Open · 🪙 ${CRATE_PRICE}</button></div>`).join('')}</div>
        <p style="font:600 12.5px var(--fb);color:#94a3b8;margin:12px 0 0">Already have the fighter you get? +250 mastery XP for it and 🪙 75 back. Win coins in duels: more for harder bots and other players.</p>`;
      openPanel('🎁 Crates', html, (b) => { if (b.dataset.open) this.openCrate(+b.dataset.open); }, null, { full: true, extra: `<span class="xchip">🪙 ${W.coins}</span>` });
    },
    openCrate(e) {
      if (W.coins < CRATE_PRICE) { sfx('error'); toast('Not enough Blox Coins — win some duels!'); return; } if (!spend(CRATE_PRICE)) return;
      let r = Math.random() * 100, k = 0; while (k < 4 && r >= ODDS[k]) { r -= ODDS[k]; k++; } const c = CRATE[e][k], S = this.save, dup = S.own.includes(c);
      if (!dup) S.own.push(c); this.bump('crates', 1); quest('duel.crate'); this.dirty(); closePanel(); this.reel(e, c, dup);
    },
    reel(e, c, dup) {
      const pick = () => { let r = Math.random() * 100, k = 0; while (k < 4 && r >= ODDS[k]) { r -= ODDS[k]; k++; } return CRATE[e][k]; }, N = 46, win = 40, list = [];
      for (let i = 0; i < N; i++) list.push(i === win ? c : i === win + 1 || i === win - 1 ? CRATE[e][4] : pick()); // (the 1% one, so near…)
      const card = (q) => `<div class="du-fc" style="--rc:${RAR[CH[q].r].c}"><img src="${fighterPic(q)}" alt=""><b>${CH[q].ic} ${esc(CH[q].n)}</b><small>${RAR[CH[q].r].n}</small></div>`;
      const el = document.createElement('div'); el.id = 'duReel'; el.innerHTML = `<h2>${EMP[e].e} ${esc(EMP[e].n)} Crate</h2><div class="du-strip"><div class="mk"></div><div class="row">${list.map(card).join('')}</div></div><div class="du-out"></div>`;
      $('#xhud').append(el); const row = el.querySelector('.row'), W0 = el.querySelector('.du-strip').clientWidth, off = win * 142 + 66 - W0 / 2 + (Math.random() - 0.5) * 90;
      row.style.transform = 'translateX(0)'; requestAnimationFrame(() => requestAnimationFrame(() => { row.style.transition = 'transform 5.2s cubic-bezier(.08,.62,.12,1)'; row.style.transform = `translateX(${-off}px)`; }));
      let tick = 0; const tk = setInterval(() => { tick++; sfx('click', { vol: 0.4 }); }, 120); setTimeout(() => clearInterval(tk), 4200);
      setTimeout(() => {
        const C = CH[c], leg = C.r === 3, out = el.querySelector('.du-out'); sfx(leg ? 'reward' : 'unlock'); if (leg) { sfx('horn'); CROWD.ex = 1; }
        if (dup) { this.addXp(c, 250); earn(75, `Duplicate ${C.n}`); }
        el.querySelector('.du-strip').style.display = 'none';
        out.innerHTML = `<div class="du-won${leg ? ' leg' : ''}"><div class="du-fc" style="--rc:${RAR[C.r].c}"><img src="${fighterPic(c, 1)}" alt=""><b>${C.ic} ${esc(C.n)}</b><small>${RAR[C.r].n}</small></div>
          <p>${dup ? `You already had the ${esc(C.n)} — <b>+250 mastery XP</b> and <b>🪙 75</b> back.` : leg ? `🌟 <b style="color:#fde68a">LEGENDARY!</b> The ${esc(C.n)} is yours — the 1% one.` : `<b>New fighter!</b> The ${esc(C.n)} is yours.`}</p>
          <div style="display:flex;gap:10px">${dup ? '' : `<button class="du-btn" data-x="eq">⚔️ Equip</button>`}<button class="du-btn alt" data-x="again">🎁 Open another</button><button class="du-btn alt" data-x="close">Done</button></div></div>`;
        out.addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (!b) return; el.remove(); if (b.dataset.x === 'eq') { this.save.eq = c; this.dirty(); this.drawBar(); this.fightersPanel(c); } else if (b.dataset.x === 'again') this.cratesPanel(e); });
      }, 5400);
    },
    botPanel() {
      const S = this.save, md = [['c', '⚔️ Classic', `First to ${TO} rounds, 3 minutes a round`], ['d', '💀 Deathmatch', 'Most kills in 5 minutes — you come back at once, somewhere random']];
      const html = `<h4 style="margin:0 0 8px;font:800 16px var(--fh);color:#fff">Difficulty</h4><div class="du-diff">${DIFF.map((D, i) => `<button data-d="${i}" style="--dc:${D.c}" class="${S.diff === i ? 'on' : ''}">${D.e} ${D.n}<small>${esc(D.d)}<br>Win: 🪙 ${D.coins}</small></button>`).join('')}</div>
        <h4 style="margin:16px 0 8px;font:800 16px var(--fh);color:#fff">Mode</h4><div class="du-diff">${md.map(([m, n, d]) => `<button data-m="${m}" style="--dc:#fbbf24" class="${S.md === m ? 'on' : ''}">${n}<small>${esc(d)}</small></button>`).join('')}</div>
        <div style="margin-top:18px;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="du-btn" data-go="1">⚔️ Fight as ${CH[S.eq].ic} ${esc(CH[S.eq].n)}</button><button class="du-btn alt" data-fi="1">Change fighter</button></div>`;
      openPanel('🤖 Fight a bot', html, (b) => { if (b.dataset.d) { S.diff = +b.dataset.d; this.dirty(); sfx('click'); this.botPanel(); this.drawBar(); } else if (b.dataset.m) { S.md = b.dataset.m; this.dirty(); sfx('click'); this.botPanel(); } else if (b.dataset.go) this.startMatch({ md: S.md, pvp: false, D: S.diff }); else if (b.dataset.fi) this.fightersPanel(); }, null, { full: true });
    },
    achPanel() {
      const S = this.save;
      const html = `<p style="font:600 13px var(--fb);color:#cbd5e1;margin:0 0 10px">The Colosseum’s own honours — each one wins you a fighter. (The 1% legends only come from crates.)</p><div class="du-ach">${ACH.map((A) => { const got = S.ach.includes(A.id), v = A.k === 'mast' ? S.st.mast | 0 : S.st[A.k] | 0, C = CH[A.c];
        return `<div class="${got ? 'got' : ''}"><i>${A.ic}</i><span><b>${esc(A.n)}</b><small>${esc(A.d)} → ${C.ic} ${esc(C.n)} <span style="color:${RAR[C.r].c}">(${RAR[C.r].n})</span></small></span><span class="pr">${got ? '✔ Done' : `${Math.min(v, A.n0).toLocaleString()} / ${A.n0.toLocaleString()}`}</span></div>`; }).join('')}</div>`;
      openPanel('🏆 Duel Achievements', html, null, null, { full: true, extra: `<span class="xchip">${S.ach.length}/${ACH.length}</span>` });
    },
  };
  addExp(DU);
})();
