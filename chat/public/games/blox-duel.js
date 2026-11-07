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
    .du-ab.mim{border-color:#22d3ee;box-shadow:0 0 0 2px rgba(34,211,238,.35),0 0 18px rgba(34,211,238,.45),0 5px 14px rgba(0,0,0,.5)}.du-ab.mim .n{color:#a5f3fc}
    .du-mim{position:absolute;left:50%;bottom:150px;transform:translateX(-50%);z-index:12;pointer-events:auto;padding:12px 14px 10px;border-radius:16px;background:linear-gradient(180deg,rgba(15,23,42,.94),rgba(8,47,73,.94));border:2px solid #22d3ee;box-shadow:0 0 30px rgba(34,211,238,.35),0 12px 30px rgba(0,0,0,.5);text-align:center;animation:duMimIn .2s cubic-bezier(.2,1.4,.5,1)}
    @keyframes duMimIn{from{transform:translateX(-50%) scale(.85);opacity:0}}
    .du-mim>b{display:block;font:800 15px var(--fh);color:#cffafe;margin-bottom:8px}.du-mim .ops{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
    .du-mim button{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:104px;padding:9px 10px 7px;border-radius:12px;border:2px solid rgba(255,255,255,.18);background:linear-gradient(180deg,#1e293b,#0f172a);color:#fff;cursor:pointer;font:700 12px var(--fb)}
    .du-mim button:hover{border-color:#67e8f9;transform:translateY(-2px)}.du-mim button i{position:absolute;left:6px;top:4px;font:800 11px var(--fb);color:#fde68a;font-style:normal}.du-mim .ic{font-size:26px}.du-mim .nm{font:800 13px var(--fh)}.du-mim small{color:#94a3b8;font:600 10.5px var(--fb)}.du-mim .hint{display:block;margin-top:7px}
    #duFog{position:absolute;inset:0;pointer-events:none;z-index:1;opacity:0;transition:opacity .45s;backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);background:radial-gradient(ellipse at 50% 55%,rgba(226,232,240,.12),rgba(203,213,225,.55) 70%,rgba(148,163,184,.75));animation:duFogD 6s ease-in-out infinite alternate}
    #duFog.on{opacity:1}@keyframes duFogD{from{background-position:0 0}to{background-position:30px -20px}}
    .du-ab.no{animation:duNo .3s}@keyframes duNo{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
    .du-side{display:grid;grid-template-columns:repeat(2,auto);gap:5px;align-content:end}
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
    .du-stats{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}.du-sb{display:grid;grid-template-columns:170px 1fr;gap:12px;margin:10px 0 12px;align-items:stretch}.du-dps{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:10px;border-radius:14px;background:radial-gradient(circle at 50% 30%,rgba(250,204,21,.28),rgba(15,23,42,.6) 75%);border:1px solid rgba(250,204,21,.45)}.du-dps small{font:800 12px var(--fh);color:#fde68a;letter-spacing:.08em}.du-dps b{font:900 40px/1.05 var(--fh);color:#fff;text-shadow:0 0 18px rgba(250,204,21,.7),0 2px 0 rgba(0,0,0,.4);font-variant-numeric:tabular-nums}.du-dps span{font:600 10.5px/1.3 var(--fb);color:#94a3b8;margin-top:4px}.du-bars{display:flex;flex-direction:column;gap:5px;justify-content:center}.du-bars .r{display:grid;grid-template-columns:122px 1fr 128px;gap:8px;align-items:center;font:700 12px var(--fb);color:#e2e8f0}.du-bars .v{color:#cbd5e1;font-weight:600;text-align:right;white-space:nowrap}.du-bars .b{height:11px;border-radius:6px;background:rgba(0,0,0,.45);overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.5)}.du-bars .b i{display:block;height:100%;width:0;border-radius:6px;background:linear-gradient(90deg,#22c55e,#a3e635);transition:width .9s cubic-bezier(.2,.8,.2,1)}.du-bars .r:nth-child(2) .b i{background:linear-gradient(90deg,#ef4444,#fb923c)}.du-bars .r:nth-child(3) .b i{background:linear-gradient(90deg,#f59e0b,#fde047)}.du-bars .r:nth-child(4) .b i{background:linear-gradient(90deg,#0ea5e9,#67e8f9)}.du-bars .r:nth-child(5) .b i{background:linear-gradient(90deg,#64748b,#cbd5e1)}.du-bars .r:nth-child(6) .b i{background:linear-gradient(90deg,#eab308,#fef08a)}.du-bars .ov .b{height:14px}.du-bars .ov .b i{background:linear-gradient(90deg,#a855f7,#f43f5e,#fbbf24)}.du-bars .ov .v b{color:#fde68a;font-size:14px}.du-fcard .dp{display:block;font:800 10px var(--fb);color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.85);margin:1px 0 2px;opacity:.92}@media (max-width:640px){.du-sb{grid-template-columns:1fr}.du-bars .r{grid-template-columns:96px 1fr 92px;font-size:11px}.du-dps b{font-size:32px}}.du-stats span{padding:3px 9px;border-radius:8px;background:rgba(255,255,255,.08);font:700 12px var(--fb)}
    .du-abl{display:flex;flex-direction:column;gap:6px}.du-abl div{display:flex;gap:9px;align-items:flex-start;padding:7px 9px;border-radius:10px;background:rgba(255,255,255,.05);font:600 12.5px/1.35 var(--fb);color:#cbd5e1}
    .du-abl div>i{font-style:normal;font-size:22px}.du-abl b{color:#fff}.du-abl em{font-style:normal;color:#fde68a;font-weight:800}
    .du-tabs{display:flex;gap:8px;margin:0 0 12px;flex-wrap:wrap}.du-tabs button{flex:1;min-width:150px;padding:9px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(15,23,42,.55);color:#cbd5e1;font:800 14px var(--fh);cursor:pointer}.du-tabs button small{font:700 11px var(--fb);opacity:.8;margin-left:4px}.du-tabs button.on{background:linear-gradient(180deg,#f59e0b,#b45309);color:#fff;border-color:#fde68a;box-shadow:0 0 14px rgba(245,158,11,.45)}.du-blk{margin-top:6px;font:700 11.5px var(--fb);color:#94a3b8}.du-pity{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 12px}.du-pity>div{padding:10px 12px;border-radius:12px;background:rgba(15,23,42,.55);border:1px solid rgba(255,255,255,.12);font:700 13px/1.35 var(--fb);color:#e2e8f0}.du-pity>div b{color:#fde68a}.du-pity .lk{border-color:rgba(74,222,128,.55);background:linear-gradient(90deg,rgba(21,128,61,.35),rgba(15,23,42,.3))}.du-pity .lk b{color:#86efac}.du-pity small{display:block;font:600 11.5px var(--fb);color:#94a3b8;margin-top:2px}@media (max-width:640px){.du-pity{grid-template-columns:1fr}}.du-luck{padding:6px 16px;border-radius:999px;font:800 15px var(--fh);color:#052e16;background:linear-gradient(90deg,#4ade80,#bbf7d0);box-shadow:0 0 30px rgba(74,222,128,.6);animation:duBigPop .5s cubic-bezier(.2,1.6,.5,1)}.du-luck.sure{color:#451a03;background:linear-gradient(90deg,#f59e0b,#fde68a);box-shadow:0 0 40px rgba(245,158,11,.7)}.du-crates{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}
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
    #duShop{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;overflow:auto;color:#f8fafc;background:radial-gradient(ellipse at 50% -10%,rgba(124,58,237,.42),transparent 60%),radial-gradient(ellipse at 50% 115%,rgba(225,29,72,.28),transparent 60%),linear-gradient(180deg,#0b1020,#04060d);animation:dshIn .28s ease}@keyframes dshIn{from{opacity:0;transform:scale(1.015)}to{opacity:1;transform:none}}
    #duShop .dsh-top{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 20px;background:rgba(4,6,13,.78);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,.08)}
    #duShop .dsh-top>b{font:900 26px var(--fh);letter-spacing:.05em;background:linear-gradient(90deg,#fde68a,#f472b6,#a78bfa);-webkit-background-clip:text;background-clip:text;color:transparent}
    #duShop .dsh-clk{font:700 13.5px var(--fb);color:#e9d5ff;padding:6px 12px;border-radius:999px;background:rgba(124,58,237,.25);border:1px solid rgba(167,139,250,.45)}#duShop .dsh-clk b{color:#fff}
    #duShop .dsh-wal{margin-left:auto;font:800 15px var(--fh);padding:7px 14px;border-radius:12px;background:rgba(255,255,255,.08)}#duShop .dsh-wal small{font:600 11px var(--fb);color:#94a3b8}
    #duShop .dsh-x{width:42px;height:42px;border-radius:12px;border:0;background:rgba(255,255,255,.12);color:#fff;font:800 19px var(--fh);cursor:pointer}#duShop .dsh-x:hover{background:rgba(239,68,68,.6)}
    #duShop .dsh-sub{margin:14px 20px 0;text-align:center;font:600 13.5px var(--fb);color:#cbd5e1}
    #duShop .dsh-row{flex:1;display:flex;gap:22px;align-items:center;justify-content:center;padding:22px 18px 8px;flex-wrap:wrap}
    #duShop .dsh-c{position:relative;width:min(290px,92vw);display:flex;flex-direction:column;border-radius:22px;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.02));border:2px solid var(--a);box-shadow:0 18px 50px rgba(0,0,0,.55),0 0 34px var(--g);transition:transform .2s}#duShop .dsh-c:hover{transform:translateY(-5px)}
    #duShop .dsh-c.hero{width:min(350px,92vw)}#duShop .dsh-c.own{filter:saturate(.75)}
    #duShop .dsh-tag{position:absolute;top:10px;left:10px;z-index:2;padding:4px 10px;border-radius:999px;font:800 11px var(--fh);letter-spacing:.04em;color:#111827;background:var(--a)}
    #duShop .dsh-pic{height:300px;background:radial-gradient(circle at 50% 42%,var(--g),transparent 68%)}#duShop .dsh-c.hero .dsh-pic{height:380px}#duShop .dsh-pic img{width:100%;height:100%;object-fit:cover}
    #duShop .dsh-c .in{padding:12px 16px 16px;display:flex;flex-direction:column;gap:8px}#duShop .dsh-c .in small{font:700 11.5px var(--fb);color:#cbd5e1}#duShop .dsh-c .in>b{font:900 22px var(--fh)}
    #duShop .dsh-st,#duShop .dsh-ab{display:flex;gap:6px;flex-wrap:wrap}#duShop .dsh-st span{padding:4px 9px;border-radius:8px;background:rgba(0,0,0,.3);font:800 12.5px var(--fh)}
    #duShop .dsh-ab span{display:flex;align-items:center;gap:3px;padding:3px 7px;border-radius:8px;background:rgba(255,255,255,.07);font:700 11px var(--fb);color:#cbd5e1}#duShop .dsh-ab i{font-style:normal;font-size:16px}
    #duShop .dsh-next{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:center;padding:14px 20px 26px;font:700 13px var(--fb)}#duShop .dsh-next>b{font:800 15px var(--fh);margin-right:4px}
    #duShop .dsh-next span{display:flex;align-items:center;gap:8px;padding:5px 12px 5px 5px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1)}#duShop .dsh-next img{width:36px;height:36px;border-radius:50%;object-fit:cover;background:rgba(0,0,0,.3)}
    #duShop .du-lnk{background:none;border:0;color:#c4b5fd;font:700 12.5px var(--fb);text-decoration:underline;cursor:pointer;padding:2px}
    @media (max-width:640px){#duShop .dsh-top>b{font-size:20px}#duShop .dsh-wal{margin-left:0}#duShop .dsh-pic,#duShop .dsh-c.hero .dsh-pic{height:240px}}
    .du-exq{display:flex;gap:14px;align-items:flex-start;padding:14px;border-radius:16px;margin-bottom:12px;border:2px solid rgba(34,211,238,.55);background:linear-gradient(120deg,rgba(8,47,73,.85),rgba(30,27,75,.7));box-shadow:0 0 22px rgba(34,211,238,.18) inset}.du-exq.got{border-color:#86efac}.du-exq img{width:120px;height:150px;object-fit:cover;border-radius:12px;background:rgba(0,0,0,.3);flex:none}.du-exq>i{font-style:normal;font-size:46px;width:120px;text-align:center;flex:none}.du-exq b{font:800 18px var(--fh);color:#e0f2fe}.du-exq small{display:block;font:600 12.5px var(--fb);color:#cbd5e1;margin-top:3px}.du-exq.sec{border-style:dashed;border-color:rgba(186,230,253,.4);background:linear-gradient(120deg,rgba(15,23,42,.9),rgba(30,41,59,.7))}
    .du-exg{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px}.du-exg>div{display:flex;gap:8px;align-items:center;padding:7px 9px;border-radius:10px;background:rgba(255,255,255,.06);font:700 12.5px var(--fb);color:#e2e8f0}.du-exg>div.ok{background:rgba(34,197,94,.16)}.du-exg i{font-style:normal;font-size:18px}.du-exg span{flex:1;min-width:0}.du-exg em{display:block;font-style:normal;color:#a5f3fc;font-size:11.5px}.du-exg u{display:block;height:5px;border-radius:3px;background:rgba(0,0,0,.35);margin-top:3px;overflow:hidden}.du-exg s{display:block;height:100%;background:linear-gradient(90deg,#22d3ee,#a78bfa)}
    @media (max-width:640px){.du-exg{grid-template-columns:1fr}.du-exq img{width:80px;height:100px}.du-exq>i{width:80px}}
    .du-rw{display:flex;flex-direction:column;gap:7px;width:100%;margin:2px 0}.du-rw>div{display:flex;align-items:center;gap:12px;padding:8px 14px;border-radius:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);font:800 17px var(--fh);color:#f8fafc;text-align:left;opacity:0;transform:translateY(8px);animation:duRw .35s ease forwards}
    .du-rw>div i{font-style:normal;font-size:21px;width:30px;text-align:center}.du-rw>div img{width:42px;height:42px;object-fit:cover;border-radius:9px;background:rgba(0,0,0,.25)}.du-rw>div small{margin-left:auto;font:700 12px var(--fb);color:#94a3b8;text-align:right}
    .du-rw>div.new{background:linear-gradient(90deg,rgba(250,204,21,.28),rgba(250,204,21,.06));border-color:rgba(250,204,21,.6)}.du-rw>div.dim{font-size:14px;color:#cbd5e1;padding:6px 14px}@keyframes duRw{to{opacity:1;transform:none}}
    .du-gwrap{overflow-x:auto;padding:2px 2px 8px;-webkit-overflow-scrolling:touch}
    .du-g6{display:grid;grid-template-columns:58px repeat(8,minmax(120px,1fr));gap:8px;min-width:1080px;align-items:start}
    .du-code{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:14px 0 0;padding:10px 12px;border-radius:14px;background:rgba(15,23,42,.55);border:1px dashed rgba(253,230,138,.45);font:700 13px var(--fb,sans-serif);color:#fde68a}
    .du-code input{flex:1;min-width:160px;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(2,6,23,.6);color:#fff;font:800 14px ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase}
    .du-code #duCodeMsg{flex-basis:100%;font:600 12.5px var(--fb,sans-serif)}.du-code #duCodeMsg.ok{color:#86efac}.du-code #duCodeMsg.bad{color:#fca5a5}
    .du-qn{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 12px;font:700 13px var(--fb,sans-serif);color:#e2e8f0}.du-qn button,.du-ff button{padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(15,23,42,.6);color:#cbd5e1;font:800 12.5px var(--fh,sans-serif);cursor:pointer}.du-qn button.on,.du-ff button.on{background:#fde68a;color:#422006;border-color:#fde68a}.du-qn small{flex-basis:100%;font:600 12px var(--fb,sans-serif);color:#94a3b8}
    .du-ff{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 10px}.du-ff input{flex:1;min-width:200px;padding:8px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(2,6,23,.6);color:#fff;font:700 13.5px var(--fb,sans-serif)}.du-ff span{font:700 12px var(--fb,sans-serif);color:#94a3b8;margin-left:4px}
    .du-fcard.dim{opacity:.18;filter:grayscale(1);transform:scale(.96)}
    #duReel.multi{justify-content:flex-start;padding:28px 12px;overflow:auto}.du-mgrid{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;max-width:min(1100px,96vw)}
    .du-mres{display:flex;flex-direction:column;align-items:center;gap:5px;animation:duMPop .45s cubic-bezier(.2,1.5,.5,1) both}.du-mres span{font:800 11.5px var(--fb,sans-serif);color:#cbd5e1}.du-mres.new span{color:#86efac}.du-mres.dup .du-fc{filter:saturate(.55) brightness(.85)}.du-mres.leg .du-fc{box-shadow:0 0 30px #f59e0b,0 0 70px rgba(245,158,11,.45)}.du-mres .du-btn{padding:5px 12px;font-size:12px}
    @keyframes duMPop{from{opacity:0;transform:translateY(16px) scale(.7) rotateY(80deg)}to{opacity:1;transform:none}}.du-msum{margin:0;font:700 15px var(--fb,sans-serif);color:#e2e8f0;text-align:center}
    .du-opts{display:flex;flex-direction:column;gap:8px}.du-opt{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(15,23,42,.55);color:#e2e8f0;text-align:left;cursor:pointer}.du-opt .ic{font-size:22px}.du-opt span{flex:1;display:flex;flex-direction:column;gap:2px}.du-opt b{font:800 14.5px var(--fh,sans-serif)}.du-opt small{font:600 12px var(--fb,sans-serif);color:#94a3b8}.du-opt i{font:900 12px var(--fh,sans-serif);font-style:normal;padding:5px 10px;border-radius:999px;background:#334155;color:#cbd5e1}.du-opt.on i{background:#22c55e;color:#052e16}
    .du-wts{display:flex;flex-wrap:wrap;gap:6px 14px;margin:0 0 10px;font:600 12px var(--fb,sans-serif);color:#94a3b8}.du-wts b{color:#e2e8f0;margin-right:4px}
    .du-gh{font:800 14px var(--fh);color:#fff;text-align:center;padding:6px 4px;border-radius:10px;background:rgba(255,255,255,.07)}
    .du-gr{align-self:stretch;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);padding:6px 2px}
    .du-gr b{font-size:13px;line-height:1.05;color:var(--rc);text-align:center;word-break:break-all;width:40px;text-shadow:0 1px 2px #000}.du-gr small{font:800 9.5px var(--fb);color:#cbd5e1;text-transform:uppercase;letter-spacing:.03em}
    .du-gc{display:flex;flex-direction:column;gap:8px;min-height:40px;border-radius:12px;background:rgba(0,0,0,.14)}
    .du-fcard{position:relative;border-radius:14px;overflow:hidden;padding:0 0 7px;text-align:center;background:var(--cb);border:2px solid var(--cc);box-shadow:0 4px 10px rgba(0,0,0,.35)}
    .du-fcard.r0{--cb:linear-gradient(180deg,#f1f5f9,#cbd5e1 62%,#94a3b8);--cc:#f8fafc}.du-fcard.r1{--cb:linear-gradient(180deg,#93c5fd,#3b82f6 60%,#1d4ed8);--cc:#bfdbfe}
    .du-fcard.r2{--cb:linear-gradient(180deg,#d8b4fe,#a855f7 60%,#6b21a8);--cc:#e9d5ff}.du-fcard.r3{--cb:linear-gradient(180deg,#fde68a,#f59e0b 60%,#b45309);--cc:#fef3c7}
    .du-fcard.r5{--cb:linear-gradient(180deg,#67e8f9,#7c3aed 55%,#0b1120);--cc:#cffafe;animation:duExo 2.2s infinite alternate}@keyframes duExo{0%{box-shadow:0 0 14px #22d3ee,0 4px 10px rgba(0,0,0,.35)}100%{box-shadow:0 0 22px #a78bfa,0 4px 10px rgba(0,0,0,.35)}}
    .du-fcard.r5 .pic{position:relative}.du-fcard.r5 .pic::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:1;background-image:radial-gradient(circle,rgba(207,250,254,.95) 0 1.2px,transparent 2px),radial-gradient(circle,rgba(196,181,253,.95) 0 1px,transparent 2px);background-size:27px 33px,21px 25px;background-position:0 0,9px 6px;animation:duMotes 3s linear infinite;opacity:.9}.du-fcard.r5::after{content:'';position:absolute;left:0;right:0;top:0;height:122px;pointer-events:none;z-index:1;background:conic-gradient(from 0deg,transparent,rgba(34,211,238,.25),transparent 30%,rgba(167,139,250,.25),transparent 60%);mix-blend-mode:screen;animation:duShine 3.4s linear infinite;background-size:200% 200%}
    .du-lim.r5{--a:#67e8f9;--b:#1e1b4b;--c:#cffafe;animation:duExo 2.2s infinite alternate}
    .du-fcard.r4{--cb:linear-gradient(180deg,#fda4af,#e11d48 60%,#881337);--cc:#fecdd3;animation:duMyth 1.6s infinite alternate}@keyframes duMyth{to{box-shadow:0 0 18px #fb7185,0 4px 10px rgba(0,0,0,.35)}}
    .du-fcard.r3{animation:duLegG 2.4s infinite alternate}@keyframes duLegG{to{box-shadow:0 0 14px rgba(253,224,71,.6),0 4px 10px rgba(0,0,0,.35)}}
    .du-fcard.r3::after,.du-fcard.r4::after{content:'';position:absolute;left:0;right:0;top:0;height:122px;pointer-events:none;z-index:1;background:linear-gradient(115deg,transparent 38%,rgba(255,255,255,.42) 48%,transparent 58%);background-size:260% 100%;animation:duShine 3.4s linear infinite}
    .du-fcard.r4::after{animation-duration:2.6s}@keyframes duShine{from{background-position:130% 0}to{background-position:-130% 0}}
    .du-fcard.r4 .pic{position:relative}.du-fcard.r4 .pic::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:1;background-image:radial-gradient(circle,rgba(255,255,255,.95) 0 1.2px,transparent 2px),radial-gradient(circle,rgba(253,164,175,.95) 0 1px,transparent 2px);background-size:31px 37px,23px 29px;background-position:0 0,11px 7px;animation:duMotes 3.6s linear infinite;opacity:.8}
    @keyframes duMotes{to{background-position:0 -37px,11px -58px}}
    .du-fcard .lt{position:absolute;left:0;right:0;top:27px;z-index:2;font:800 9.5px var(--fb);letter-spacing:.08em;color:#fff;background:linear-gradient(90deg,transparent,rgba(124,58,237,.9),transparent);padding:2px 0;pointer-events:none}
    .du-fcard .eq.lim{background:#7c3aed;box-shadow:0 3px 0 #4c1d95}
    .du-shoph{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 0 12px;flex-wrap:wrap}.du-shoph>div>b{font:800 16px var(--fh);color:#fff;display:block}.du-shoph small{font:600 12.5px var(--fb);color:#cbd5e1}.du-shoph small b{color:#fde68a}
    .du-wal{font:800 13px var(--fb);color:#fde68a;background:rgba(15,23,42,.6);border-radius:10px;padding:6px 12px}
    .du-limg{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}
    .du-lim{position:relative;border-radius:16px;overflow:hidden;background:linear-gradient(180deg,var(--a),var(--b));border:2px solid var(--c);box-shadow:0 6px 18px rgba(0,0,0,.4);display:flex;flex-direction:column}
    .du-lim.r3{--a:#fde68a;--b:#92400e;--c:#fef3c7;animation:duLegG 2.4s infinite alternate}.du-lim.r4{--a:#fda4af;--b:#4c0519;--c:#fecdd3;animation:duMyth 1.6s infinite alternate}
    .du-lim img{width:100%;height:230px;object-fit:cover;background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.45),transparent 70%)}
    .du-lim .lt{position:absolute;left:10px;top:10px;padding:3px 9px;border-radius:999px;background:#7c3aed;color:#fff;font:800 11px var(--fb);letter-spacing:.06em;box-shadow:0 2px 0 #4c1d95}
    .du-lim .in{padding:10px 12px 12px;background:rgba(2,6,23,.6);display:flex;flex-direction:column;gap:6px;flex:1}
    .du-lim .in small{font:700 11px var(--fb);color:#e2e8f0}.du-lim .in>b{font:800 18px var(--fh);color:#fff}.du-lim .dp{font:700 12px var(--fb);color:#fde68a}
    .du-lim .buy.gold{background:linear-gradient(180deg,#fde047,#ca8a04);color:#422006}
    .du-lim .du-lnk{align-self:flex-start;background:none;border:0;color:#93c5fd;font:700 12px var(--fb);cursor:pointer;padding:0;text-decoration:underline}
    .du-next{margin:14px 0 0;display:flex;flex-wrap:wrap;gap:8px;align-items:center;font:700 12.5px var(--fb);color:#cbd5e1}.du-next b{color:#fff;margin-right:4px}.du-next span{padding:5px 10px;border-radius:999px;background:rgba(15,23,42,.6);border:1px solid rgba(255,255,255,.14)}.du-next span.r4{border-color:#fb7185}.du-next span.r3{border-color:#fbbf24}.du-next small{color:#fde68a}
    .du-fcard .pic{display:block;width:100%;padding:0;border:0;background:none;cursor:pointer}.du-fcard img{display:block;width:100%;height:122px;object-fit:cover;background:radial-gradient(circle at 50% 35%,rgba(255,255,255,.35),transparent 70%)}
    .du-fcard.lock img{filter:grayscale(1) brightness(.5)}.du-fcard.eqd{box-shadow:0 0 0 3px #4ade80}.du-fcard.sel{outline:3px solid #fde68a;outline-offset:1px}
    .du-fcard b{display:block;font:800 12.5px/1.15 var(--fh);color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.8);padding:4px 5px 0}.du-fcard.r0 b{color:#0f172a;text-shadow:none}
    .du-fcard small{display:block;font:800 11px var(--fb);color:#fef08a;text-shadow:0 1px 2px rgba(0,0,0,.6);letter-spacing:.02em}.du-fcard.r0 small{color:#475569;text-shadow:none}
    .du-fcard .st{position:absolute;left:5px;top:5px;z-index:2;padding:3px 8px;border-radius:7px;border:0;background:#dc2626;color:#fff;font:800 10.5px var(--fb);cursor:pointer;box-shadow:0 2px 0 #7f1d1d}
    .du-fcard .mb{position:absolute;right:5px;top:5px;z-index:2;padding:2px 6px;border-radius:7px;background:rgba(15,23,42,.8);font:800 10px var(--fb);color:#fde68a}
    .du-fcard .eq{display:block;margin:6px auto 0;width:calc(100% - 14px);padding:6px 0;border-radius:9px;border:0;background:#16a34a;color:#fff;font:800 12.5px var(--fh);cursor:pointer;box-shadow:0 3px 0 #14532d}
    .du-fcard .eq.on{background:#065f46;box-shadow:none;cursor:default}.du-fcard .eq.lk{background:#475569;box-shadow:0 3px 0 #1e293b}
    .du-x{float:right;width:30px;height:30px;border-radius:9px;border:1px solid rgba(255,255,255,.2);background:rgba(15,23,42,.7);color:#e2e8f0;font:800 14px var(--fb);cursor:pointer}
    @media (max-width:640px){#duTop{left:8px;right:8px;top:62px}.du-card{width:44vw;padding:6px 8px}.du-card .ch,.du-card .rr{display:none}#duMid .tm{font-size:24px}#duBig{font-size:40px}.du-ab{width:56px;height:56px;font-size:24px}.du-ab.m1{width:64px;height:64px}}`;
  document.head.append(style);

  /* ---------------- the four empires and their fighters ---------------- */
  const EMP = [
    { n: 'Rome', sn: 'Rome', e: '🦅', c1: '#7f1d1d', c2: '#e8b84a', d: 'Legions, the arena’s gladiators and the emperor’s own guard.' },
    { n: 'Greece', sn: 'Greece', e: '🏛️', c1: '#1e3a8a', c2: '#e2e8f0', d: 'Hoplites, skirmishers and archers of the city-states — and Sparta.' },
    { n: 'Medieval Europe', sn: 'Europe', e: '🏰', c1: '#1f2937', c2: '#93c5fd', d: 'Men-at-arms, bowmen, Norse raiders, crusaders — and the knight in full plate.' },
    { n: 'Medieval Japan', sn: 'Japan', e: '🏯', c1: '#450a0a', c2: '#fca5a5', d: 'Foot soldiers, masterless swordsmen, shinobi, warrior monks — and the samurai.' },
    { n: 'Ottoman Empire', sn: 'Ottoman', e: '🌙', c1: '#14532d', c2: '#f87171', d: 'Azabs and archers, grenadiers, the Sultan’s own Peyk guard — and the Janissary. All on foot.' },
    { n: 'Mongols', sn: 'Mongols', e: '🏹', c1: '#78350f', c2: '#7dd3fc', d: 'The arban’s spears, steppe archers, a shaman of the Eternal Blue Sky, the Kheshig — and the Great Khan. All on foot.' },
    { n: 'Colonial America', sn: 'Colonials', e: '🔔', c1: '#1e3a8a', c2: '#e7d3a1', d: 'Minutemen and frontier riflemen, the Continental line, light dragoons — and a colonel of the Continental Army. Early gunpowder: muskets that hit hard and reload slowly, and the bayonet.' },
    { n: 'Aztec Empire', sn: 'Aztecs', e: '🐍', c1: '#065f46', c2: '#fbbf24', d: 'Warriors of the Triple Alliance (1428–1521): the macuahuitl edged with obsidian, slings and the atlatl, and the eagle and jaguar orders. All on foot.' },
  ];
  // the rarities, one star each: ★ common … ★★★★★ mythic
  const RAR = [{ n: 'Common', c: '#cbd5e1' }, { n: 'Rare', c: '#38bdf8' }, { n: 'Epic', c: '#c084fc' }, { n: 'Legendary', c: '#fbbf24' }, { n: 'Mythic', c: '#f43f5e' }, { n: 'Exotic', c: '#22d3ee' }]; // (★★★★★★ Exotic, above Mythic: the creatures of American legend)
  RAR.forEach((R, i) => { R.s = '★'.repeat(i + 1); R.t = `${R.s} ${R.n}`; });
  const ODDS = [30, 30, 27, 12, 1]; // (a crate's five, in order: common, common, rare, epic, legendary)
  // the pity: 🍀 every 10th crate is a 2× luck roll (the rare, epic and legendary chances doubled), and 🌟 the 150th crate in a
  // row without a legendary is one, for certain (the count starts again at every legendary)
  const LUCK_ODDS = [10, 10, 54, 24, 2], LUCK_N = 10, PITY_N = 150;
  const CRATE_PRICE = 300, CRATE_GOLD = 100; // (a crate: 🪙 300 Blox Coins, or 🥇 100 of the duel's own gold)
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
      { n: 'Testudo', ic: '🛡️', k: 'buff', cd: 14, an: 'testudo', b: { dur: 2.5, blk: 1 }, d: 'Shield up like a whole legion: blocks every blow, from every side, for 2.5 s.' },
      { n: 'Imperial Charge', ic: '🦂', k: 'dash', dmg: 120, dist: 15, dd: 0.45, cd: 32, wind: 0.25, an: 'charge', fx: { st: 1, kb: 6 }, d: 'Charge behind the shield: 120 damage and they’re knocked down (1 s).' }] },
    { e: 0, r: 3, hp: 500, spd: 1.1, def: 0.88, ro: 'Damage dealer', ab: [
      { n: 'Sica Slash', ic: '⚔️', k: 'melee', dmg: 92, cd: 1.15, rng: 7, arc: 120, wind: 0.18, an: 'sica', fx: { bl: [110, 5], blc: 0.5 }, d: '92 damage, and a 50% chance to make them bleed: 110 more over 5 s.' },
      { n: 'Shield Rush', ic: '🛡️', k: 'dash', dmg: 125, dist: 13, dd: 0.3, cd: 7.5, wind: 0.1, an: 'rush', fx: { st: 1.2 }, d: 'Rush in behind the shield: 125 damage and a 1.2 s stun.' },
      { n: 'Berserk', ic: '🔥', k: 'buff', cd: 26, an: 'berserk', b: { dur: 7, cdM: 2, dmgA: 55, dmgM: 1.25, ls: 0.15 }, d: 'For 7 s: cooldowns 50% shorter, +55 damage on every hit, +25% on top, and 15% lifesteal.' }] },
    // 🏛️ Greece
    { e: 1, r: 0, hp: 450, ab: [
      { n: 'Dory Thrust', ic: '🔱', k: 'melee', dmg: 40, cd: 1.3, rng: 8.5, arc: 40, wind: 0.2, an: 'overhand' },
      { n: 'Aspis Wall', ic: '🛡️', k: 'buff', cd: 10, an: 'aspis', b: { dur: 2.5, blk: 1 }, d: 'Brace behind the aspis: blocks every blow for 2.5 s.' },
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
      { n: 'Shield Block', ic: '🛡️', k: 'buff', cd: 10, an: 'shieldup', b: { dur: 2.5, blk: 1 }, d: 'Behind the heater shield: blocks every blow for 2.5 s.' },
      { n: 'Rally', ic: '📯', k: 'buff', cd: 28, an: 'rally', b: { dur: 6, heal: 120, dmgM: 1.2 }, d: 'Heal 120 and +20% damage for 6 s.' }] },
    { e: 2, r: 0, hp: 340, ab: [
      { n: 'Longbow', ic: '🏹', k: 'proj', dmg: 48, cd: 1.5, spd: 105, wind: 0.3, an: 'bow', model: 'arrow' },
      { n: 'Piercing Shot', ic: '🎯', k: 'proj', dmg: 85, cd: 11, spd: 165, wind: 0.55, an: 'draw', model: 'arrow', d: 'A full draw: a fast arrow for 85.' },
      { n: 'Volley', ic: '🌧️', k: 'volley', dmg: 35, cnt: 5, rad: 6, delay: 1.0, cd: 30, wind: 0.35, an: 'sky', d: 'Five arrows rain down where they stand, 35 each.' }] },
    { e: 2, r: 1, hp: 470, ab: [
      { n: 'Dane Axe', ic: '🪓', k: 'melee', dmg: 55, cd: 1.5, rng: 6.5, arc: 110, wind: 0.25, an: 'chop' },
      { n: 'Axe Throw', ic: '🪓', k: 'proj', dmg: 60, cd: 10, spd: 70, wind: 0.3, an: 'throw', model: 'axe', fx: { sl: [0.6, 2] }, d: 'A spinning throwing axe: 60 damage and a 2 s slow.' },
      { n: 'Berserkergang', ic: '🐻', k: 'buff', cd: 32, an: 'roar', b: { dur: 6, dmgM: 1.4, ls: 0.3 }, d: 'The bear-shirt rage: +40% damage and 30% lifesteal for 6 s.' }] },
    { e: 2, r: 2, hp: 500, def: 0.9, ab: [
      { n: 'Longsword', ic: '⚔️', k: 'melee', dmg: 56, cd: 1.6, rng: 7, arc: 100, wind: 0.25, an: 'slash2' },
      { n: 'Holy Smite', ic: '✝️', k: 'melee', dmg: 85, cd: 14, rng: 7, arc: 60, wind: 0.55, an: 'smite', fx: { st: 0.8 }, d: 'A great overhead blow wreathed in light: 85 damage and a 0.8 s stun.' },
      { n: 'Deus Vult', ic: '🙏', k: 'buff', cd: 38, an: 'pray', b: { dur: 5, healP: 0.2, dmgM: 1.15 }, d: 'Heal 20% of your health and +15% damage for 5 s.' }] },
    { e: 2, r: 3, hp: 640, def: 0.75, spd: 0.75, ab: [
      { n: 'Sword Modes', ic: '⚔️', k: 'melee', modes: [
        { n: 'Overhead', ic: '⬇️', dmg: 105, cd: 2.6, rng: 8, arc: 60, wind: 0.5, an: 'overhead' },
        { n: 'Swing', ic: '↔️', dmg: 62, cd: 1.9, rng: 8, arc: 150, wind: 0.3, an: 'swing' },
        { n: 'Stab', ic: '🎯', dmg: 230, cd: 6, rng: 9.5, arc: 30, wind: 0.7, an: 'stab' }] },
      { n: 'Pommel Strike', ic: '🔨', k: 'melee', dmg: 45, cd: 13, rng: 5, arc: 70, wind: 0.2, an: 'pommel', fx: { st: 1 }, d: 'Murder-stroke with the pommel: 45 damage and a 1 s stun.' },
      { n: 'Iron Fortress', ic: '🏰', k: 'buff', cd: 34, an: 'fortress', b: { dur: 4, def: 0.6, hps: 16, imm: 1 }, d: 'For 4 s: 40% less damage, heal 16 a second, and nothing stuns, roots or slows you.' }] },
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
    // 🏛️ Greece's myth: the Laestrygonian — not in any crate (beat the boss, or reach Season Pass level 100)
    { e: 1, r: 4, hp: 1600, spd: 0.5, def: 0.55, big: 1.35, nc: 1, brute: 0.15, ro: 'Giant', how: 'Beat the 👹 Laestrygonian boss, or reach Season Pass level 100', pas: [['🛡️', 'Armored Giant', '50% slower than everyone else, and takes 45% less damage.'], ['💢', 'Brute Force', 'Every hit has a 15% chance to leave them Crushed: double damage until the round ends or they die.']], ab: [
      { n: 'Scimitar / Punch', ic: '🗡️', k: 'melee', modes: [
        { n: 'Scimitar', ic: '🗡️', dmg: 185, cd: 1.9, rng: 10.5, arc: 120, wind: 0.5, an: 'gslash' },
        { n: 'Punch', ic: '👊', dmg: 110, cd: 1.5, rng: 7.5, arc: 70, wind: 0.25, an: 'punch' }] },
      { n: 'Bloodrush', ic: '🩸', k: 'buff', cd: 12, an: 'bloodrush', b: { dur: 6, dmgM: 1.35, foeSpd: 1.2 }, d: '×1.35 damage on every hit for 6 s — but the blood in the air gives them a ×1.2 speed boost too.' },
      { n: 'Stomp / Crush', ic: '🦶', k: 'stomp', dmg: 40, crush: 105, near: 7, rad: 26, cd: 3.5, wind: 0.45, an: 'stomp', d: 'A shockwave rolls out across the sand: jump it or take 40. If they’re close it’s a Crush instead — 105 damage, a 1 s stun, and Crushed for the rest of the round.' },
      { n: 'Rush and Crush', ic: '🐂', k: 'dash', rush: 1, dmg: 275, dmg2: 350, dist: 26, dd: 2, cd: 35, wind: 0.3, an: 'rush', fx: { st: 1.2 }, d: 'Charge for 2 s, scimitar out: 275 damage and a 1.2 s stun to anyone in the way. Hit them head-on and it’s 350 and they’re Crushed for the round.' }] },
    // 🏰 Europe: the Executioner — the giant’s counter; his contract is in the achievements
    { e: 2, r: 4, hp: 420, spd: 1.35, def: 1.2, nc: 1, wish: 1, ro: 'Assassin', how: 'Accept the Executioner’s Contract (🏆 Achievements → 📜 Quests), then defeat 50 fighters and deal 15,000 damage', pas: [['🩻', 'Armorless', 'No armour at all: takes 20% more damage, and 35% faster.'], ['🪓', 'Executioner’s Wish', 'Every hit on a fighter: +10% damage (it stacks, until the round ends or you die) and heals 10% of your health.']], ab: [
      { n: 'Sever / Chop', ic: '🪓', k: 'melee', modes: [
        { n: 'Sever', ic: '🪓', dmg: 225, cd: 2.1, rng: 7.5, arc: 70, wind: 0.42, an: 'xsever' },
        { n: 'Chop', ic: '🔪', dmg: 180, cd: 1.6, rng: 7, arc: 110, wind: 0.3, an: 'xchop' }] },
      { n: 'Behead', ic: '💀', k: 'melee', dmg: 480, cd: 14, rng: 7.5, arc: 60, wind: 1.1, an: 'behead', say: '“OFF WITH HIS HEAD!”', d: '“Off with his head!” A 1.1 s wind-up, the axe raised high behind him — then 480 damage.' },
      { n: 'Blade Sharpen', ic: '🔥', k: 'buff', cd: 30, an: 'sharpen', b: { dur: 8, dmgM: 2.5 }, d: 'Whet the axe’s edge: 2.5× damage for 8 s.' },
      { n: 'Parry', ic: '⚔️', k: 'buff', cd: 12, an: 'parry', b: { dur: 3, blk: 1, parry: 1 }, d: 'The axe haft up for 3 s: every blow is blocked — and whoever lands one is stunned for 2 s and takes 1.5× damage.' }] },
    // 🌙 the Ottoman Empire (no cavalry)
    { e: 4, r: 0, hp: 430, ro: 'Skirmisher', ab: [
      { n: 'Javelin Jab', ic: '🔱', k: 'melee', dmg: 40, cd: 1.2, rng: 7.5, arc: 50, wind: 0.16, an: 'jab' },
      { n: 'Javelin Throw', ic: '🎯', k: 'proj', dmg: 58, cd: 8, spd: 80, wind: 0.3, an: 'throw', model: 'javelin', d: 'Throw the javelin: 58 damage.' },
      { n: 'Kalkan Wall', ic: '🛡️', k: 'buff', cd: 26, an: 'shieldup', b: { dur: 2.5, blk: 1, dmgM: 1.3 }, d: 'Brace behind the round kalkan: blocks every blow for 2.5 s, then +30% damage while it lasts.' }] },
    { e: 4, r: 0, hp: 340, spd: 1.05, ro: 'Ranger', ab: [
      { n: 'Recurve Shot', ic: '🏹', k: 'proj', dmg: 44, cd: 1.25, spd: 110, wind: 0.25, an: 'bow', model: 'arrow' },
      { n: 'Thumb-Ring Draw', ic: '💍', k: 'proj', dmg: 30, cnt: 3, gap: 0.16, cd: 9, spd: 125, wind: 0.2, an: 'bow', model: 'arrow', d: 'Three arrows loosed fast with the thumb ring, 30 each.' },
      { n: 'Arrow Rain', ic: '🌧️', k: 'volley', dmg: 34, cnt: 6, rad: 6, delay: 0.9, cd: 30, wind: 0.35, an: 'sky', d: 'Six arrows fall where they stand, 34 each.' }] },
    { e: 4, r: 1, hp: 380, ro: 'Ranger', ab: [
      { n: 'Kilij Cut', ic: '🗡️', k: 'melee', dmg: 42, cd: 1.15, rng: 6.5, arc: 100, wind: 0.16, an: 'quick' },
      { n: 'Humbara', ic: '💣', k: 'proj', dmg: 70, cd: 9, spd: 52, wind: 0.32, an: 'lob', model: 'bomb', fx: { bu: [30, 3] }, d: 'Lob a fused iron grenade: 70 damage, and 30 more as it burns.' },
      { n: 'Barrage', ic: '🎆', k: 'proj', dmg: 55, cnt: 3, spread: 16, cd: 28, spd: 50, wind: 0.35, an: 'lob', model: 'bomb', fx: { bu: [24, 3], kb: 5 }, d: 'Three grenades at once, 55 each, burning — and they’re thrown back.' }] },
    { e: 4, r: 2, hp: 530, def: 0.9, ro: 'Tank', ab: [
      { n: 'Teber Sweep', ic: '🌙', k: 'melee', dmg: 58, cd: 1.5, rng: 8.5, arc: 130, wind: 0.25, an: 'naginata' },
      { n: 'Crescent Hook', ic: '🪝', k: 'melee', dmg: 45, cd: 10, rng: 8.5, arc: 60, wind: 0.22, an: 'spear2', fx: { sl: [0.5, 2.5], st: 0.4 }, d: 'Hook their legs with the crescent: 45 damage, a stagger and a 2.5 s slow.' },
      { n: 'Sultan’s Guard', ic: '👳', k: 'buff', cd: 32, an: 'fortress', b: { dur: 5, def: 0.55, rf: 0.3, imm: 1 }, d: 'Stand as the Sultan’s own guard: 45% less damage for 5 s, 30% of it back at them, and nothing stops you.' }] },
    { e: 4, r: 3, hp: 560, ro: 'Damage dealer', ab: [
      { n: 'Yatagan Cut', ic: '🗡️', k: 'melee', dmg: 66, cd: 1.3, rng: 7, arc: 100, wind: 0.18, an: 'slash' },
      { n: 'Tüfek', ic: '🔫', k: 'proj', dmg: 125, cd: 12, spd: 230, wind: 0.9, an: 'gun', model: 'ball', d: 'Shoulder the matchlock for 0.9 s, then fire: 125 damage.' },
      { n: 'Mehter March', ic: '🥁', k: 'buff', cd: 32, an: 'rally', b: { dur: 7, dmgM: 1.35, spdM: 1.2, hps: 15 }, d: 'The war band strikes up: +35% damage, +20% speed and heal 15 a second for 7 s.' }] },
    // 🏹 the Mongols (no cavalry)
    { e: 5, r: 0, hp: 420, ro: 'Bruiser', ab: [
      { n: 'Spear Thrust', ic: '🔱', k: 'melee', dmg: 42, cd: 1.25, rng: 9, arc: 35, wind: 0.2, an: 'spear2' },
      { n: 'Lunge', ic: '💨', k: 'dash', dmg: 60, dist: 10, dd: 0.25, cd: 9, wind: 0.15, an: 'charge', d: 'Lunge forward spear-first: 60 damage.' },
      { n: 'Arban Discipline', ic: '🎖️', k: 'buff', cd: 28, an: 'rally', b: { dur: 6, dmgM: 1.25, def: 0.8 }, d: 'Ten men, one will: +25% damage and 20% less damage taken for 6 s.' }] },
    { e: 5, r: 0, hp: 340, spd: 1.12, ro: 'Ranger', ab: [
      { n: 'Composite Shot', ic: '🏹', k: 'proj', dmg: 42, cd: 1.1, spd: 115, wind: 0.24, an: 'bow', model: 'arrow' },
      { n: 'Parthian Shot', ic: '↩️', k: 'dash', back: true, dist: 10, dd: 0.28, cd: 10, wind: 0.08, an: 'hop', then: { k: 'proj', dmg: 50, cnt: 2, spread: 10, spd: 115, model: 'arrow' }, d: 'Spring back out of reach and loose two arrows as you land, 50 each.' },
      { n: 'Whistling Arrows', ic: '🎐', k: 'volley', dmg: 32, cnt: 7, rad: 6.5, delay: 0.8, cd: 30, wind: 0.35, an: 'sky', fx: { sl: [0.7, 1.5] }, d: 'Seven screaming arrows fall where they stand, 32 each.' }] },
    { e: 5, r: 1, hp: 390, ro: 'All-rounder', ab: [
      { n: 'Staff Strike', ic: '🪄', k: 'melee', dmg: 40, cd: 1.2, rng: 7.5, arc: 80, wind: 0.2, an: 'overhand' },
      { n: 'Spirit Drum', ic: '🥁', k: 'buff', cd: 14, an: 'drum', b: { dur: 5, heal: 90, dmgM: 1.2 }, d: 'Beat the drum to the spirits: heal 90, and +20% damage for 5 s.' },
      { n: 'Wrath of Tengri', ic: '⚡', k: 'proj', dmg: 75, cd: 28, spd: 70, wind: 0.4, an: 'fan', model: 'fire', fx: { bu: [45, 4], sl: [0.6, 2] }, d: 'Call down the Eternal Blue Sky: 75 damage, 45 more as it burns, and a 2 s slow.' }] },
    { e: 5, r: 2, hp: 520, def: 0.9, ro: 'Bruiser', ab: [
      { n: 'Mace Blow', ic: '🔨', k: 'melee', dmg: 58, cd: 1.4, rng: 6.5, arc: 90, wind: 0.22, an: 'overhand' },
      { n: 'Guard Rush', ic: '🛡️', k: 'dash', dmg: 75, dist: 11, dd: 0.3, cd: 10, wind: 0.12, an: 'rush', fx: { st: 1 }, d: 'Rush in behind the wicker shield: 75 damage and a 1 s stun.' },
      { n: 'Night Watch', ic: '🌌', k: 'buff', cd: 32, an: 'resolve', b: { dur: 6, def: 0.6, dmgM: 1.25, imm: 1 }, d: 'The Khan’s night guard: 40% less damage, +25% damage and nothing stops you for 6 s.' }] },
    { e: 5, r: 3, hp: 600, ro: 'Damage dealer', ab: [
      { n: 'Khan’s Saber', ic: '🗡️', k: 'melee', dmg: 76, cd: 1.35, rng: 7.5, arc: 110, wind: 0.2, an: 'slash' },
      { n: 'Feigned Retreat', ic: '↩️', k: 'dash', back: true, dist: 11, dd: 0.3, cd: 9, wind: 0.08, an: 'hop', then: { k: 'proj', dmg: 45, cnt: 3, spread: 14, spd: 100, model: 'arrow' }, d: 'Fall back as if beaten — then three arrows over the shoulder, 45 each.' },
      { n: 'Mandate of Heaven', ic: '👑', k: 'buff', cd: 34, an: 'wrath', b: { dur: 6, dmgM: 1.4, spdM: 1.2, ls: 0.2 }, d: '+40% damage, +20% speed and 20% lifesteal for 6 s.' }] },
    // 🏯 Japan's myth: the Kensei, the sword saint, with katana and wakizashi — not in any crate (his trial is in the achievements)
    { e: 3, r: 4, hp: 470, spd: 1.18, nc: 1, crit: [0.25, 1.8], exe: [0.3, 1.5], ro: 'Damage dealer', how: 'Accept the Sword Saint’s Trial (🏆 Achievements → 📜 Quests), then win 20 duels and deal 20,000 damage', pas: [['✴️', 'Sword Saint', '25% of his hits are critical: ×1.8 damage.'], ['🩸', 'Ichigeki', 'One strike, one kill: ×1.5 damage to anyone below 30% health.']], ab: [
      { n: 'Twin Cut', ic: '⚔️', k: 'multi', hits: [54, 54], gap: 0.14, cd: 1.15, rng: 7.5, arc: 120, wind: 0.14, an: 'twin', d: 'Katana, then wakizashi: two cuts of 54.' },
      { n: 'Flash Step', ic: '💨', k: 'dash', dmg: 150, dist: 16, dd: 0.18, cd: 8, wind: 0.12, an: 'iai', fx: { bl: [60, 3] }, d: 'Gone in a flash, through them and out the other side: 150 damage, and they bleed 60 more over 3 s.' },
      { n: 'Thousand Cuts', ic: '🌸', k: 'multi', hits: [28, 28, 28, 28, 28, 28, 28, 70], gap: 0.1, cd: 15, rng: 8, arc: 140, wind: 0.2, an: 'storm', fx: { bl: [80, 4] }, d: 'A storm of eight cuts with both blades — seven of 28, then one of 70 that leaves them bleeding 80 more.' },
      { n: 'Mushin', ic: '🧘', k: 'buff', cd: 32, an: 'mushin', b: { dur: 6, dmgM: 1.35, spdM: 1.25, cdM: 1.6, imm: 1 }, d: 'No-mind: for 6 s, +35% damage, +25% speed, cooldowns run 60% faster, and nothing stuns, roots or slows him.' }] },
    // 🦅 Rome's myth: the Imperator, the general who is emperor, with a gilded gladius and the legion's eagle — not in any crate (his Triumph is in the achievements)
    { e: 0, r: 4, hp: 560, spd: 1.05, def: 0.85, nc: 1, stunP: [0.15, 0.6], lsP: 0.15, ro: 'All-rounder', how: 'Accept the Imperator’s Triumph (🏆 Achievements → 📜 Quests), then win 15 Classic duels and defeat 40 fighters', pas: [['🦅', 'Imperium', '15% of his hits stagger them: a 0.6 s stun.'], ['🌿', 'Triumph', 'Heals 15% of the damage he deals.']], ab: [
      { n: 'Imperial Gladius', ic: '🗡️', k: 'melee', dmg: 78, cd: 1.05, rng: 7, arc: 90, wind: 0.16, an: 'thrust' },
      { n: 'Pila of the Legion', ic: '🎯', k: 'volley', dmg: 34, cnt: 8, rad: 7, delay: 0.8, cd: 11, wind: 0.3, an: 'sky', model: 'pilum', fx: { sl: [0.7, 1.5] }, d: 'He signals, and the legion behind him throws: eight pila fall where they stand, 34 each, and each one slows them.' },
      { n: 'Aquila', ic: '🦅', k: 'buff', cd: 28, an: 'aquila', b: { dur: 7, dmgM: 1.35, def: 0.7, hps: 18 }, d: 'Raise the eagle: for 7 s, +35% damage, 30% less damage taken, and heal 18 a second.' },
      { n: 'Triumph', ic: '👑', k: 'leap', dmg: 210, dist: 20, rad: 8, cd: 30, wind: 0.2, an: 'leap', fx: { st: 1.2 }, d: 'A triumphant leap with the eagle held high, and down on them: 210 damage all round and a 1.2 s stun.' }] },
    // 🏰 Europe's myth: the Frost Jötunn, a giant of the frozen north — not in any crate (its Frost Saga is in the achievements)
    { e: 2, r: 4, hp: 1250, spd: 0.55, def: 0.62, big: 1.4, nc: 1, frost: [0.8, 1.2], ro: 'Giant', how: 'Accept the Frost Saga (🏆 Achievements → 📜 Quests), then beat the 👹 boss 3 times and deal 25,000 damage', pas: [['🧊', 'Frost Giant', '45% slower than everyone else, and takes 38% less damage.'], ['❄️', 'Rime', 'Every hit chills them: 20% slower for 1.2 s.']], ab: [
      { n: 'Rime Club', ic: '🏏', k: 'melee', dmg: 165, cd: 2.0, rng: 10, arc: 110, wind: 0.5, an: 'overhead' },
      { n: 'Ice Boulder', ic: '🧊', k: 'proj', dmg: 130, cd: 9, spd: 42, wind: 0.6, an: 'lob', model: 'ice', fx: { sl: [0.5, 3] }, d: 'Wrench a boulder of ice from the ground and hurl it: 130 damage, and they’re 50% slower for 3 s.' },
      { n: 'Frost Stomp', ic: '🦶', k: 'stomp', dmg: 40, crush: 100, near: 7, rad: 28, cd: 6.5, wind: 0.5, an: 'stomp', wspd: 20, d: 'A shockwave of frost rolls out: jump it or take 40. Up close it’s a Crush — 100, a 1 s stun and Crushed for the rest of the round.' },
      { n: 'Fimbulwinter', ic: '🌨️', k: 'volley', dmg: 26, cnt: 10, rad: 8, delay: 0.9, cd: 32, wind: 0.45, an: 'roar', model: 'hail', fx: { sl: [0.7, 1.5] }, d: 'The great winter: ten shards of hail crash down where they stand, 26 each, and each one chills them.' }] },
    // 🏛️ Macedon: the Phalangite, a pikeman of the phalanx — a legendary with a quest of his own (no crate has him)
    { e: 1, r: 3, hp: 560, spd: 0.95, def: 0.85, nc: 1, sh: 1, ro: 'Tank', how: 'Accept The Sarissa (🏆 Achievements → 📜 Quests), then defeat 25 fighters and deal 10,000 damage', pas: [['📏', 'Sarissa', 'The longest reach in the Colosseum: his pike strikes from 13 m.']], ab: [
      { n: 'Sarissa Thrust', ic: '🔱', k: 'melee', dmg: 72, cd: 1.5, rng: 13, arc: 30, wind: 0.26, an: 'spear' },
      { n: 'Shield Wall', ic: '🛡️', k: 'buff', cd: 13, an: 'aspis', b: { dur: 2.5, blk: 1, rf: 0.3 }, d: 'Brace behind pike and shield: blocks every blow for 2.5 s, and 30% of it goes back at them.' },
      { n: 'Hedgehog', ic: '🦔', k: 'multi', hits: [45, 45, 60], gap: 0.28, cd: 11, rng: 12.5, arc: 50, wind: 0.2, an: 'flurry', fx: { kb: 10 }, d: 'Three thrusts of the sarissa — 45, 45, 60 — and the last drives them back.' },
      { n: 'Macedonian Charge', ic: '☀️', k: 'dash', dmg: 160, dist: 16, dd: 0.5, cd: 26, wind: 0.25, an: 'charge', fx: { st: 1, kb: 10 }, d: 'Charge with the pike levelled: 160 damage, a 1 s stun, and they’re thrown back.' }] },
    // 🏰 Europe: the Halberdier — an epic with a quest of his own
    { e: 2, r: 2, hp: 520, def: 0.9, nc: 1, ro: 'Bruiser', how: 'Accept The Swiss Guard (🏆 Achievements → 📜 Quests), then win 8 Classic duels and defeat 20 fighters', ab: [
      { n: 'Axe / Spike', ic: '🪓', k: 'melee', modes: [
        { n: 'Axe', ic: '🪓', dmg: 66, cd: 1.6, rng: 9, arc: 110, wind: 0.26, an: 'naginata' },
        { n: 'Spike', ic: '🔱', dmg: 50, cd: 1.15, rng: 10, arc: 40, wind: 0.18, an: 'spear2' }] },
      { n: 'Hook', ic: '🪝', k: 'melee', dmg: 35, cd: 9, rng: 9.5, arc: 60, wind: 0.22, an: 'spear2', fx: { rt: 1.2, st: 0.3 }, d: 'Catch them with the hook behind the blade: 35 damage, and they can’t move for 1.2 s.' },
      { n: 'Pike Square', ic: '🏰', k: 'buff', cd: 24, an: 'fortress', b: { dur: 4, def: 0.6, imm: 1 }, d: 'Stand as the Swiss square: 40% less damage, and nothing stuns, roots or slows you for 4 s.' }] },
    // 🏛️ Greece's myth: the Cyclops, a giant
    { e: 1, r: 4, hp: 1400, spd: 0.55, def: 0.62, big: 1.4, nc: 1, rage: [0.5, 1.3], ro: 'Giant', how: 'Accept The Forge of Zeus (🏆 Achievements → 📜 Quests), then beat the 👹 boss 2 times and defeat 30 fighters', pas: [['👁️', 'Giant of Sicily', '45% slower than everyone else, and takes 38% less damage.'], ['💢', 'Rage', 'Below half health: +30% damage.']], ab: [
      { n: 'Olive Club', ic: '🏏', k: 'melee', dmg: 170, cd: 2.2, rng: 10, arc: 110, wind: 0.5, an: 'overhead' },
      { n: 'Hurl Boulder', ic: '🪨', k: 'proj', dmg: 140, cd: 10, spd: 40, wind: 0.65, an: 'lob', model: 'rock', fx: { st: 0.8 }, d: 'Tear up a rock and hurl it: 140 damage and a 0.8 s stun.' },
      { n: 'Quake', ic: '🦶', k: 'stomp', dmg: 40, crush: 115, near: 7, rad: 26, cd: 6.5, wind: 0.5, an: 'stomp', wspd: 18, d: 'A shockwave rolls out: jump it or take 40. Up close it’s a Crush — 115, a 1 s stun and Crushed for the round.' },
      { n: 'Thunderbolt', ic: '⚡', k: 'proj', dmg: 190, cd: 28, spd: 150, wind: 0.8, an: 'lob', model: 'bolt', fx: { st: 1.2 }, d: 'The Cyclopes forged the thunderbolts of Zeus — he hurls one: 190 damage and a 1.2 s stun.' }] },
    // 🏯 Japan's myth: the Oni, a giant and a tank — vast, armoured, and slow to swing
    { e: 3, r: 4, hp: 2300, spd: 0.6, def: 0.5, big: 1.45, nc: 1, ro: 'Giant', how: 'Accept The Oni’s Gate (🏆 Achievements → 📜 Quests), then win 20 duels and deal 30,000 damage', pas: [['👹', 'Demon Hide', '40% slower than everyone else, and takes half damage.'], ['🐢', 'Slow and Heavy', 'Its kanabō swings only every 2.8 s — but every blow staggers.']], ab: [
      { n: 'Kanabō', ic: '🏏', k: 'melee', dmg: 72, cd: 2.8, rng: 9.5, arc: 120, wind: 0.6, an: 'overhead', fx: { st: 0.4 } },
      { n: 'Iron Hide', ic: '🛡️', k: 'buff', cd: 16, an: 'fortress', b: { dur: 5, def: 0.45, imm: 1 }, d: 'Its hide like iron: 55% less damage, and nothing stuns, roots or slows it for 5 s.' },
      { n: 'Oni Roar', ic: '📢', k: 'stomp', dmg: 25, crush: 60, near: 6, rad: 22, cd: 10, wind: 0.6, an: 'stomp', wspd: 16, d: 'A roar and a stamp that shakes the sand: jump it or take 25 — up close, 60 and Crushed.' },
      { n: 'Demon Gate', ic: '⛩️', k: 'buff', cd: 32, an: 'benkei', b: { dur: 6, def: 0.5, rf: 0.5, hps: 30 }, d: 'It stands like a gate of hell: half damage for 6 s, half of it back at them, and it heals 30 a second.' }] },
    // 🦅 Rome's myth: Cacus, the fire-breathing giant, son of Vulcan
    { e: 0, r: 4, hp: 1400, spd: 0.58, def: 0.62, big: 1.4, nc: 1, fireImm: 1, ro: 'Giant', how: 'Accept The Cave of Cacus (🏆 Achievements → 📜 Quests), then beat the 👹 boss 2 times and deal 20,000 damage', pas: [['🔥', 'Son of Vulcan', 'Burns can’t hurt him — and his hammer sets them alight.'], ['🗿', 'Giant of the Aventine', '42% slower than everyone else, and takes 38% less damage.']], ab: [
      { n: 'Forge Hammer', ic: '🔨', k: 'melee', dmg: 165, cd: 2.1, rng: 10, arc: 110, wind: 0.5, an: 'overhead', fx: { bu: [30, 3] } },
      { n: 'Fire Breath', ic: '🔥', k: 'proj', dmg: 30, cnt: 5, spread: 10, cd: 8, spd: 60, wind: 0.35, an: 'roar', model: 'flame', fx: { bu: [20, 3] }, d: 'A gout of fire from his mouth: five flames, 30 each, and they burn.' },
      { n: 'Molten Stomp', ic: '🦶', k: 'stomp', dmg: 40, crush: 115, near: 7, rad: 24, cd: 6.5, wind: 0.5, an: 'stomp', wspd: 18, d: 'A shockwave of fire rolls out: jump it or take 40. Up close it’s a Crush — 115, a 1 s stun and Crushed for the round.' },
      { n: 'Cave of Smoke', ic: '💨', k: 'buff', cd: 28, an: 'smoke', b: { dur: 3, inv: 1, nx: 2 }, d: 'He hides in smoke, as he hid in his cave: unseen for 3 s, and his next blow does double damage.' }] },
    // 🏹 the Mongols' spirit: the Chötgör — a new class, the Spirit: little health, quick claws, and possession
    { e: 5, r: 4, hp: 300, spd: 1.3, nc: 1, ro: 'Spirit', how: 'Accept The Shaman’s Call (🏆 Achievements → 📜 Quests), then defeat 60 fighters and win 15 duels', pas: [['👻', 'Spirit', 'Only half here: little health, but quick — and while it phases, blows pass straight through it.'], ['🕯️', 'Possession', 'Its G takes the foe over: for 3 s they walk where it looks, and can’t fight back.']], ab: [
      { n: 'Spirit Claw', ic: '👻', k: 'melee', dmg: 36, cd: 0.5, rng: 6.5, arc: 110, wind: 0.08, an: 'quick' },
      { n: 'Phase', ic: '🌫️', k: 'buff', cd: 9, an: 'smoke', b: { dur: 1.6, ph: 1, imm: 1 }, d: 'It fades out of the world for 1.6 s: every blow and arrow passes through it.' },
      { n: 'Soul Drain', ic: '💀', k: 'proj', dmg: 55, cd: 7, spd: 70, wind: 0.25, an: 'fan', model: 'soul', drain: 1, fx: { sl: [0.6, 2] }, d: 'A wisp of its cold: 55 damage and a 2 s slow — and all of it heals the Chötgör.' },
      { n: 'Possession', ic: '🕯️', k: 'dash', dmg: 30, dist: 14, dd: 0.22, cd: 26, wind: 0.15, an: 'iai', fx: { pos: 3, bl: [60, 3] }, d: 'It flies into them and takes them over: for 3 s they walk wherever it looks and can’t fight back — and their soul bleeds 60.' }] },
    // 🏯 Japan's spirit: the Yūrei — the ghost of one who died with a grudge: the white burial kimono, long black hair over its face, ghost-fires round it
    { e: 3, r: 4, hp: 320, spd: 1.25, nc: 1, ro: 'Spirit', how: 'Accept The Haunting (🏆 Achievements → 📜 Quests), then win 12 duels and deal 15,000 damage', pas: [['👻', 'Spirit', 'Only half here: little health, but quick — and its touch is cold enough to slow.'], ['👺', 'Onryō', 'Its G lays a grudge on the foe: for 5 s every blow they land does half — and hurts them just as much.']], ab: [
      { n: 'Grave Touch', ic: '🖐️', k: 'melee', dmg: 34, cd: 0.5, rng: 6.5, arc: 110, wind: 0.08, an: 'quick', fx: { sl: [0.8, 0.6] } },
      { n: 'Hitodama', ic: '🏮', k: 'proj', dmg: 24, cnt: 3, spread: 14, cd: 6.5, spd: 50, wind: 0.25, an: 'fan', model: 'hitodama', fx: { bu: [18, 3] }, d: 'Three ghost-fires drift at them: 24 each, and their cold blue flame burns for 18 more.' },
      { n: 'Kanashibari', ic: '🫥', k: 'dash', dmg: 20, dist: 13, dd: 0.2, cd: 15, wind: 0.15, an: 'iai', fx: { st: 1.2, vu: 2.5 }, d: 'Sleep paralysis: it rushes through them in a cold breath — 20 damage, frozen stiff for 1.2 s, and ×1.5 damage taken for 2.5 s.' },
      { n: 'Onryō’s Grudge', ic: '👺', k: 'proj', dmg: 40, cd: 22, spd: 62, wind: 0.3, an: 'fan', model: 'grudge', fx: { cu: 5 }, d: 'A vengeful spirit flies at them: 40 damage and the Grudge for 5 s — every blow they land does half, and hurts them just as much.' }] },
    // 🔔 Colonial America: early gunpowder. Each carries a gun and a blade, and switches between them (1 and 2): the gun hits
    // much harder but takes a long time to reload; the blade is quick. Each has its own cooldown, so stab while you reload
    { e: 6, r: 0, hp: 430, ro: 'All-rounder', pas: [['⚖️', 'All-rounder', 'Average at everything — health, damage, range, attack speed and speed — and weak at nothing.']], ab: [
      { n: 'Musket / Bayonet', ic: '🔫', k: 'melee', split: 1, modes: [
        { n: 'Musket', ic: '🔫', k: 'proj', dmg: 75, cd: 3.4, spd: 230, wind: 0.35, an: 'musket', model: 'ball' },
        { n: 'Bayonet', ic: '🗡️', dmg: 26, cd: 0.95, rng: 8.5, arc: 45, wind: 0.16, an: 'spear2' }] },
      { n: 'Minute’s Notice', ic: '⏱️', k: 'buff', cd: 14, an: 'ram', b: { dur: 4, spdM: 1.3, rl: 1 }, d: 'Ready at a minute’s notice: the musket’s loaded at once, and you’re 30% faster for 4 s.' },
      { n: 'Butt Stroke', ic: '💥', k: 'melee', dmg: 32, cd: 9, rng: 5.5, arc: 70, wind: 0.2, an: 'pommel', fx: { st: 0.6, kb: 8 }, d: 'The musket’s butt to the face: 32 damage, a 0.6 s stun and they’re knocked back.' }] },
    { e: 6, r: 0, hp: 350, spd: 1.08, ro: 'Ranger', pas: [['🎯', 'Long Rifle', 'The rifled barrel reaches furthest and hits hardest — and takes longest to load.']], ab: [
      { n: 'Rifle / Tomahawk', ic: '🎯', k: 'melee', split: 1, modes: [
        { n: 'Long Rifle', ic: '🎯', k: 'proj', dmg: 100, cd: 4.8, spd: 300, wind: 0.5, an: 'musket', model: 'ball' },
        { n: 'Tomahawk', ic: '🪓', dmg: 25, cd: 0.8, rng: 6, arc: 100, wind: 0.12, an: 'slash' }] },
      { n: 'Tomahawk Throw', ic: '🪓', k: 'proj', dmg: 45, cd: 8, spd: 60, wind: 0.3, an: 'throw', model: 'axe', fx: { bl: [30, 3] }, d: 'The tomahawk end over end: 45 damage, and 30 more as they bleed.' },
      { n: 'Dead Aim', ic: '🦌', k: 'proj', dmg: 120, cd: 18, spd: 340, wind: 1.1, an: 'musket', model: 'ball', fx: { st: 0.6 }, d: 'Draw a bead for 1.1 s, as a hunter does: 120 damage, and it staggers them.' }] },
    { e: 6, r: 1, hp: 480, def: 0.95, ro: 'All-rounder', pas: [['⚖️', 'All-rounder', 'Average at everything — health, damage, range, attack speed and speed — and weak at nothing.']], ab: [
      { n: 'Musket / Bayonet', ic: '🔫', k: 'melee', split: 1, modes: [
        { n: 'Musket', ic: '🔫', k: 'proj', dmg: 80, cd: 3.2, spd: 230, wind: 0.35, an: 'musket', model: 'ball' },
        { n: 'Bayonet', ic: '🗡️', dmg: 30, cd: 0.9, rng: 8.5, arc: 45, wind: 0.16, an: 'spear2' }] },
      { n: 'Platoon Fire', ic: '🥁', k: 'proj', dmg: 28, cnt: 3, spread: 7, cd: 11, spd: 220, wind: 0.4, an: 'musket', model: 'ball', d: 'The file beside you fires with you: three musket balls, 28 each.' },
      { n: 'Bayonet Charge', ic: '🗡️', k: 'dash', dmg: 50, dist: 14, dd: 0.3, cd: 14, wind: 0.25, an: 'charge', fx: { kb: 10, st: 0.4 }, d: 'Fix bayonets and charge: 50 damage, and they’re thrown back.' }] },
    { e: 6, r: 2, hp: 420, spd: 1.15, ro: 'Skirmisher', pas: [['🐎', 'Light Dragoon', '15% faster than most: in with the sabre, out with the pistol.']], ab: [
      { n: 'Pistol / Sabre', ic: '🔫', k: 'melee', split: 1, modes: [
        { n: 'Pistol', ic: '🔫', k: 'proj', dmg: 62, cd: 2.6, spd: 210, wind: 0.2, an: 'pistol', model: 'ball' },
        { n: 'Sabre', ic: '🗡️', dmg: 34, cd: 0.75, rng: 6.5, arc: 110, wind: 0.1, an: 'slash' }] },
      { n: 'Brace of Pistols', ic: '🔫', k: 'proj', dmg: 52, cnt: 2, gap: 0.25, cd: 9, spd: 210, wind: 0.2, an: 'pistol', model: 'ball', d: 'The second and third pistols from the holsters: two shots, 52 each.' },
      { n: 'Sabre Charge', ic: '🐎', k: 'dash', dmg: 55, dist: 16, dd: 0.25, cd: 12, wind: 0.15, an: 'iai', fx: { bl: [30, 3] }, d: 'A dragoon’s charge, sabre out: 55 damage, and 30 more as they bleed.' }] },
    { e: 6, r: 3, hp: 560, spd: 1.05, def: 0.88, ro: 'All-rounder', pas: [['⚖️', 'All-rounder', 'Good at everything — health, damage, range, attack speed and speed — and weak at nothing.'], ['🎖️', 'Colonel', 'He leads from the front: his Rally heals and steels him, and the guns answer when he calls.']], ab: [
      { n: 'Pistol / Sword', ic: '🔫', k: 'melee', split: 1, modes: [
        { n: 'Pistol', ic: '🔫', k: 'proj', dmg: 75, cd: 2.6, spd: 230, wind: 0.22, an: 'pistol', model: 'ball' },
        { n: 'Sword', ic: '⚔️', dmg: 42, cd: 0.75, rng: 6.5, arc: 100, wind: 0.12, an: 'slash' }] },
      { n: 'Rally the Line', ic: '🎖️', k: 'buff', cd: 22, an: 'rally', b: { dur: 6, dmgM: 1.25, def: 0.8, heal: 80 }, d: '“Steady, boys!”: heal 80, +25% damage and 20% less damage taken for 6 s.' },
      { n: 'Artillery!', ic: '💣', k: 'volley', dmg: 60, cnt: 4, rad: 7, delay: 1.2, cd: 26, wind: 0.4, an: 'sky', model: 'cannon', d: 'His sword points and the guns answer: four cannonballs fall where they stand, 60 each.' }] },
    // 🔔 America's myth: the Headless Horseman of Sleepy Hollow — a Hessian trooper's ghost (1790), a Spirit with a quest
    { e: 6, r: 4, hp: 440, spd: 1.3, def: 0.92, nc: 1, ro: 'Spirit', how: 'Accept The Legend of Sleepy Hollow (🏆 Achievements → 📜 Quests), then win 18 duels and deal 20,000 damage', pas: [['🎃', 'Headless', 'Only half of him is here — the half without a head: quick on his feet, and he takes 8% less damage.'], ['😱', 'Terror', 'His laugh sends them running: for 2.5 s they flee from him and can’t fight back.']], ab: [
      { n: 'Hessian Sabre', ic: '🗡️', k: 'melee', dmg: 60, cd: 0.8, rng: 7, arc: 110, wind: 0.12, an: 'slash' },
      { n: 'Jack-o’-Lantern', ic: '🎃', k: 'proj', dmg: 75, cd: 8, spd: 55, wind: 0.3, an: 'lob', model: 'pumpkin', fx: { bu: [40, 4] }, d: 'He hurls the flaming pumpkin he carries for a head: 75 damage, and it burns for 40 more.' },
      { n: 'Phantom Gallop', ic: '🐎', k: 'dash', dmg: 70, dist: 20, dd: 0.35, cd: 14, wind: 0.2, an: 'charge', fx: { kb: 12, st: 0.6 }, d: 'The ghost of his horse carries him through them: 70 damage, a 0.6 s stun, and they’re thrown back.' },
      { n: 'Hollow Laugh', ic: '😱', k: 'proj', dmg: 30, cd: 22, spd: 70, wind: 0.25, an: 'roar', model: 'laugh', fx: { fr: 2.5 }, d: 'His laugh rings across the sand: 30 damage and Terror for 2.5 s — they flee from him and can’t fight back.' }] },
    // 🐍 the Aztec Empire: a crate of five, from the macehualli of the city's levy to the eagle warrior
    { e: 7, r: 0, hp: 400, ro: 'Bruiser', ab: [
      { n: 'Macuahuitl', ic: '🗡️', k: 'melee', dmg: 38, cd: 1.0, rng: 6.5, arc: 110, wind: 0.18, an: 'slash', fx: { bl: [24, 3], blc: 0.3 } },
      { n: 'Chimalli Bash', ic: '🛡️', k: 'melee', dmg: 30, cd: 9, rng: 5.5, arc: 70, wind: 0.15, an: 'bash', fx: { st: 0.6, kb: 6 }, d: 'The round shield in their face: 30 damage, a 0.6 s stun, and they stagger back.' },
      { n: 'Death Whistle', ic: '💀', k: 'buff', cd: 24, an: 'roar', b: { dur: 6, dmgM: 1.2, spdM: 1.1 }, d: 'The skull whistle shrieks: +20% damage and 10% faster for 6 s.' }] },
    { e: 7, r: 0, hp: 340, spd: 1.08, ro: 'Ranger', ab: [
      { n: 'Sling Stone', ic: '🪨', k: 'proj', dmg: 34, cd: 0.9, spd: 95, wind: 0.22, an: 'fan', model: 'stone' },
      { n: 'Hail of Stones', ic: '🌧️', k: 'proj', dmg: 22, cnt: 3, spread: 10, cd: 7, spd: 90, wind: 0.3, an: 'fan', model: 'stone', d: 'Three stones whirled and loosed at once, 22 each.' },
      { n: 'Obsidian Knife', ic: '🔪', k: 'melee', dmg: 48, cd: 6, rng: 5, arc: 80, wind: 0.1, an: 'quick', fx: { bl: [30, 3] }, d: 'Up close, the volcanic-glass knife: 48 damage, and 30 more as they bleed.' }] },
    { e: 7, r: 1, hp: 400, spd: 1.1, ro: 'Skirmisher', ab: [
      { n: 'Atlatl Dart', ic: '🎯', k: 'proj', dmg: 56, cd: 1.5, spd: 85, wind: 0.3, an: 'throw', model: 'javelin' },
      { n: 'Tepoztopilli', ic: '🔱', k: 'melee', dmg: 50, cd: 6, rng: 8.5, arc: 45, wind: 0.2, an: 'spear2', d: 'A thrust of the obsidian-edged spear: 50 damage, with a long reach.' },
      { n: 'Rain of Darts', ic: '🌧️', k: 'volley', dmg: 30, cnt: 5, rad: 6, delay: 1.0, cd: 24, wind: 0.35, an: 'sky', model: 'javelin', d: 'Five atlatl darts fall where they stand, 30 each.' }] },
    { e: 7, r: 2, hp: 430, spd: 1.15, ro: 'Assassin', ab: [
      { n: 'Macuahuitl', ic: '🗡️', k: 'melee', dmg: 50, cd: 0.9, rng: 6.5, arc: 110, wind: 0.14, an: 'slash', fx: { bl: [30, 3], blc: 0.35 } },
      { n: 'Pounce', ic: '🐆', k: 'leap', dmg: 75, dist: 18, rad: 6, cd: 10, wind: 0.12, an: 'leap', fx: { bl: [40, 3] }, d: 'The jaguar springs: 75 damage where it lands, and 40 more as they bleed.' },
      { n: 'Jungle Shadow', ic: '🌿', k: 'buff', cd: 24, an: 'smoke', b: { dur: 2.5, inv: 1, nx: 2 }, d: 'Gone into the shadows: unseen for 2.5 s, and the next blow does double damage.' }] },
    { e: 7, r: 3, hp: 520, spd: 1.05, ro: 'Damage dealer', ab: [
      { n: 'Macuahuitl', ic: '🗡️', k: 'melee', dmg: 62, cd: 1.05, rng: 7, arc: 120, wind: 0.18, an: 'slash', fx: { bl: [40, 3], blc: 0.4 } },
      { n: 'Eagle Dive', ic: '🦅', k: 'leap', dmg: 110, dist: 22, rad: 7, cd: 11, wind: 0.2, an: 'leap', fx: { st: 0.8 }, d: 'The eagle stoops on them from on high: 110 damage all round and a 0.8 s stun.' },
      { n: 'Flowery War', ic: '🌺', k: 'buff', cd: 28, an: 'rally', b: { dur: 7, dmgM: 1.3, spdM: 1.15, ls: 0.2 }, d: 'The war for captives: +30% damage, 15% faster and 20% lifesteal for 7 s.' }] },
    // ⏳ the limited fighters (v128): in no crate — each in the 🛒 Limited Shop a week at a time, for Blox Coins (lim: [Blox Coins, gold])
    { e: 2, r: 4, hp: 640, spd: 1.05, def: 0.85, big: 1.12, nc: 1, lim: [10000, 30000], exe: [0.5, 1.25], ro: 'Bruiser', pas: [['📜', 'The Naughty List', 'He knows who’s been bad: +25% damage to anyone under half health.'], ['🔔', 'Bells and Chains', 'The cowbells on his belt ring as he comes, and his chain drags them in to him.']], ab: [
      { n: 'Birch Switches', ic: '🌿', k: 'multi', hits: [36, 36], gap: 0.16, cd: 1.0, rng: 7, arc: 120, wind: 0.14, an: 'flurry', d: 'The bundle of birch switches, twice: 36 and 36.' },
      { n: 'Rattling Chain', ic: '⛓️', k: 'proj', dmg: 55, cd: 9, spd: 85, wind: 0.3, an: 'throw', model: 'chain', fx: { pl: 1, st: 0.5 }, d: 'He flings his chain and hooks them: 55 damage, and they’re dragged in to him and stunned for 0.5 s.' },
      { n: 'Into the Basket', ic: '🧺', k: 'melee', dmg: 95, cd: 15, rng: 6.5, arc: 90, wind: 0.3, an: 'overhead', fx: { st: 1.5, bl: [40, 3] }, d: 'He stuffs them into the basket on his back: 95 damage, a 1.5 s stun, and 40 more as the switches cut.' },
      { n: 'Krampusnacht', ic: '🔔', k: 'buff', cd: 28, an: 'roar', b: { dur: 8, dmgM: 1.35, spdM: 1.25, ls: 0.2 }, d: 'Krampus Night — every bell rings: +35% damage, 25% faster and 20% lifesteal for 8 s.' }] },
    { e: 1, r: 4, hp: 520, spd: 1.12, def: 0.9, nc: 1, lim: [6000], ro: 'Ranger', pas: [['🐍', 'Serpent Born', 'Her arrows are dipped in her own venom: every one of them poisons.'], ['🗿', 'The Gorgon’s Gaze', 'Meet her eyes and you turn to stone — frozen where you stand, unable to move, fight or block.']], ab: [
      { n: 'Venom Arrow', ic: '🏹', k: 'proj', dmg: 58, cd: 1.05, spd: 115, wind: 0.25, an: 'bow', model: 'arrow', fx: { bl: [28, 3] } },
      { n: 'Serpent Volley', ic: '🐍', k: 'proj', dmg: 38, cnt: 3, spread: 12, cd: 8, spd: 105, wind: 0.3, an: 'bow', model: 'arrow', fx: { bl: [30, 3] }, d: 'Three venomed arrows at once, 38 each, and they poison for 30 more.' },
      { n: 'Coils', ic: '🌀', k: 'dash', dmg: 75, dist: 14, dd: 0.3, cd: 12, wind: 0.15, an: 'charge', fx: { rt: 1.4 }, d: 'She slithers through them and her coils close round them: 75 damage, and they’re held fast for 1.4 s.' },
      { n: 'Petrifying Gaze', ic: '🗿', k: 'proj', dmg: 50, cd: 18, spd: 90, wind: 0.45, an: 'roar', model: 'gaze', fx: { pt: 2.5 }, d: 'She lifts her eyes to theirs: 50 damage, and they turn to stone for 2.5 s — they can’t move, act or block.' }] },
    { e: 2, r: 3, hp: 520, spd: 1.08, def: 0.88, nc: 1, lim: [2500], ro: 'Damage dealer', pas: [['🪽', 'The Wings', 'The eagle feathers on his back roar as he charges: his Kopia Charge throws them further than any other.']], ab: [
      { n: 'Szabla', ic: '🗡️', k: 'melee', dmg: 56, cd: 0.9, rng: 7, arc: 115, wind: 0.13, an: 'slash' },
      { n: 'Kopia Charge', ic: '🐎', k: 'dash', dmg: 95, dist: 20, dd: 0.3, cd: 10, wind: 0.2, an: 'charge', fx: { kb: 14, st: 0.6 }, d: 'He couches the long kopia lance and charges through them: 95 damage, a 0.6 s stun, and they’re thrown back.' },
      { n: 'Thunder of Wings', ic: '🪽', k: 'buff', cd: 24, an: 'rally', b: { dur: 7, dmgM: 1.3, spdM: 1.2, def: 0.85 }, d: 'The wings roar like a storm: +30% damage, 20% faster and 15% less damage taken for 7 s.' }] },
    { e: 3, r: 3, hp: 480, spd: 1.12, nc: 1, lim: [2500], ro: 'Duelist', pas: [['🌸', 'Bushidō', 'Her naginata keeps them at a distance: the longest reach of any blade in Japan.']], ab: [
      { n: 'Naginata Cut', ic: '🌙', k: 'melee', dmg: 54, cd: 1.0, rng: 9, arc: 125, wind: 0.18, an: 'naginata' },
      { n: 'Whirling Blade', ic: '🌀', k: 'multi', hits: [26, 26, 26, 40], gap: 0.16, cd: 9, rng: 8.5, arc: 360, wind: 0.12, an: 'whirl', fx: { kb: 6 }, d: 'She spins the naginata round her: three cuts of 26, then 40 that throws them back.' },
      { n: 'Petal Storm', ic: '🌸', k: 'multi', hits: [24, 24, 24, 24, 24, 70], gap: 0.11, cd: 18, rng: 9, arc: 140, wind: 0.2, an: 'flurry', fx: { bl: [50, 3] }, d: 'Six strokes as fast as falling petals — five of 24, then 70 — and a 50 bleed.' }] },
    { e: 0, r: 3, hp: 580, spd: 0.98, def: 0.86, nc: 1, lim: [2500], ro: 'Tank', pas: [['🪖', 'Primus Pilus', 'A centurion of the first rank: his scutum stops every blow from the front, and the phalerae on his chest say he has never lost.']], ab: [
      { n: 'Gladius', ic: '🗡️', k: 'melee', dmg: 50, cd: 0.85, rng: 6, arc: 80, wind: 0.12, an: 'stab' },
      { n: 'Vitis', ic: '🌿', k: 'melee', dmg: 40, cd: 8, rng: 6, arc: 90, wind: 0.15, an: 'bash', fx: { st: 1.0 }, d: 'A crack of the vine stick that keeps the line in order: 40 damage and a 1 s stun.' },
      { n: 'Hold the Line!', ic: '🦅', k: 'buff', cd: 22, an: 'rally', b: { dur: 7, dmgM: 1.2, def: 0.7, heal: 60 }, d: '“Hold the line!”: heal 60, +20% damage and 30% less damage taken for 7 s.' }] },
    // 🌑 ★★★★★★ the Exotics (v129), above Mythic: creatures of American legend
    { e: 6, r: 5, hp: 680, spd: 1.1, def: 0.86, nc: 1, skin: 1, ro: 'All-rounder', how: 'Complete the Skinwalker’s quest (🏆 Achievements → 🌑 Exotic)', pas: [['🎭', 'Shapeshifter', 'It wears whatever it steals: a mimicked ability does ×1.5 its damage and heals, and cools down twice as fast.'], ['🌑', 'Skin-walker', 'An all-rounder that fights however its enemy fights — up close, at range, behind them.']], ab: [
      { n: 'Rend', ic: '🐾', k: 'melee', dmg: 100, cd: 1.2, rng: 7, arc: 115, wind: 0.16, an: 'slash' },
      { n: 'Mimic', ic: '🎭', k: 'mimic', cd: 20, dur: 10, est: 950, d: 'Pick one of your enemy’s abilities (1–4) and use it as your own for 10 s — ×1.5 its damage and heals, half its cooldown. When the 10 s are up, Mimic’s cooldown starts.' },
      { n: 'Screech', ic: '😱', k: 'melee', dmg: 50, cd: 30, rng: 15, arc: 360, wind: 0.3, an: 'roar', scream: 1, fx: { sl: [0.55, 4], fog: 4, vu: 4 }, d: 'An unearthly scream all round it: 40 damage, and for 4 s they’re slowed 45%, their sight fogs over and they take ×1.5 damage.' },
      { n: 'Mimic Form', ic: '🧬', k: 'mimic2', cd: 35, dur: 30, d: 'Copy your enemy’s health, block or passives for 30 s (pick 1–3). Health: their max health, at the share of it they have left. Block: their shield and armour. Passives: their speed and every passive they have. Then the cooldown starts.' },
      { n: 'Behind You', ic: '👁️', k: 'blink', dmg: 90, cd: 16, rng: 26, wind: 0.2, an: 'slash', fx: { st: 0.6 }, d: 'It’s gone — then it’s right behind them: 90 damage and a 0.6 s stun.' }] },
    { e: 6, r: 5, hp: 760, spd: 1.15, def: 0.95, big: 1.12, nc: 1, secret: 1, aura: [9, 0.65], regen: [0.02, 5], stages: 1, ro: 'Bruiser', how: '❄️ A secret. Something hunts in a winter forest…', pas: [['❄️', 'Creature of Winter', 'A freezing aura round it: anyone who comes near is slowed 35%.'], ['♾️', 'Immortality', 'It regenerates 2% of its health a second — until it’s hit; then not for 5 s.'], ['🩸', 'Wounded Beast', 'Four stages as it’s hurt (75%, 50%, 25%) — at each it looks worse, moves worse, and hits 25% harder.']], ab: [
      { n: 'Claw / Maul', ic: '🦴', k: 'melee', split: 1, modes: [
        { n: 'Claw', ic: '🦴', dmg: 150, cd: 1.5, rng: 8, arc: 120, wind: 0.2, an: 'slash' },
        { n: 'Maul', ic: '🩸', dmg: 50, cd: 1.3, rng: 7, arc: 100, wind: 0.14, an: 'quick', maul: [0.25, 3] }] },
      { n: 'Self Cannibal', ic: '🍖', k: 'buff', cd: 15, an: 'roar', selfP: 0.1, low: 1, b: { dur: 5, spdM: 1.25, dmgM: 1.5, cdM: 1.5 }, d: 'It tears at its own flesh — 10% of its health — for +25% speed and +50% damage and attack speed for 5 s. Under 10% health it becomes ♾️ Immortal Being instead.' },
      { n: 'Antler Gore', ic: '🦌', k: 'dash', dmg: 130, dist: 18, dd: 0.3, cd: 15, wind: 0.25, an: 'charge', fx: { kb: 12, bl: [50, 3] }, d: 'Head down, it drives its antlers through them: 130 damage, thrown back, and 50 more as they bleed.' },
      { n: 'Endless Hunger', ic: '🌑', k: 'leap', dmg: 150, dist: 22, rad: 6.5, cd: 20, wind: 0.2, an: 'leap', drain: 0.5, fx: { sl: [0.5, 2] }, d: 'It leaps on them to feed: 150 damage, slowed 50% for 2 s, and it heals half of what it deals.' }] },
  ];
  CH.forEach((C, i) => { C.i = i; C.n = DUEL_N[i]; C.ic = DUEL_IC[i]; C.spdX = C.spd != null; C.spd = C.spd || 1; C.def = C.def || 1; });
  // what each one is for, at a glance
  const ROLE = ['Tank', 'Skirmisher', 'Skirmisher', 'Tank', 'Damage dealer', 'Tank', 'Skirmisher', 'Ranger', 'Bruiser', 'Bruiser', 'Bruiser', 'Ranger', 'Bruiser', 'Bruiser', 'Tank', 'Skirmisher', 'Duelist', 'Assassin', 'Bruiser', 'Damage dealer'];
  CH.forEach((C, i) => { C.ro = C.ro || ROLE[i] || 'All-rounder'; });
  // each class its own pace (unless a fighter has one of its own): the light quick on their feet, the heavy slow
  const CLASS_SPD = { Assassin: 1.16, Spirit: 1.2, Ranger: 1.06, Skirmisher: 1.12, Bruiser: 1.0, 'Damage dealer': 1.04, Duelist: 1.08, 'All-rounder': 1.04, Tank: 0.9, Giant: 0.6 };
  CH.forEach((C) => { if (!C.spdX && CLASS_SPD[C.ro]) C.spd = CLASS_SPD[C.ro]; });
  // three weights, and the classes in each: 🪶 Light (quick, fragile), ⚔️ Medium, 🛡️ Heavy (slow, hard to kill)
  const WTS = [['Light', '🪶', ['Assassin', 'Spirit', 'Ranger', 'Skirmisher']], ['Medium', '⚔️', ['Bruiser', 'Damage dealer', 'Duelist', 'All-rounder']], ['Heavy', '🛡️', ['Tank', 'Giant']]];
  CH.forEach((C) => { const W = WTS.find((w) => w[2].includes(C.ro)); if (!W) console.error('duel: no weight for', C.n, C.ro); C.wt = W ? W[0] : 'Medium'; C.wtI = W ? W[1] : '⚔️'; });
  const rosterN = (S) => CH.filter((C) => !C.secret || S.own.includes(C.i)).length;
  const CRATE = EMP.map((_, e) => CH.filter((C) => C.e === e && !C.nc).map((C) => C.i)); // (each crate's five, common to legendary)
  const LAE = 20, EXE = 21, KEN = 32, IMP = 33, JOT = 34, PHA = 35, HAL = 36, CYC = 37, ONI = 38, CAC = 39, CHO = 40, YUR = 41, MIN = 42, RIF = 43, REG = 44, DRA = 45, COLN = 46, HH = 47, KRA = 53, MED = 54, HUS = 55, ONN = 56, CEN = 57, SKW = 58, WEN = 59;
  for (const i of [0, 1, 3, 4, 5, 6, 8, 9, 10, 12, 13, 22, 30, 35, 48, 51, 52, 57]) CH[i].sh = 1; // (the ones with a shield: blocking stops everything — without one it halves the damage) // (the mythics — the Laestrygonian, the Executioner, the Kensei: no crate has them)
  const KEN_W = 20, KEN_D = 20000; // (the Sword Saint's Trial: wins, damage)
  // the mythics' quests: each accepted in the achievements, then two counts to reach (k kills, d damage, w wins, c Classic
  // wins, b boss wins)
  const QUESTS = [
    { key: 'q', c: EXE, ic: '💀', n: 'The Executioner’s Contract', need: [['k', 50, '⚔️', 'defeated'], ['d', 15000, '💥', 'damage']], how: 'defeat 50 fighters (bots or players) and deal 15,000 damage', tail: 'the giant’s counter', done: 'the Executioner’s Contract is fulfilled', col: ['239,68,68', '127,29,29', '#fecaca', '#ef4444,#fca5a5'] },
    { key: 'q2', c: KEN, ic: '👺', n: 'The Sword Saint’s Trial', need: [['w', KEN_W, '🏆', 'wins'], ['d', KEN_D, '💥', 'damage']], how: `win ${KEN_W} duels (any mode, bots or players) and deal ${KEN_D.toLocaleString()} damage`, tail: 'the sword saint: two blades, critical hits and a killing stroke', done: 'the Sword Saint’s Trial is complete', col: ['244,63,94', '136,19,55', '#fecdd3', '#e11d48,#fda4af'] },
    { key: 'q3', c: IMP, ic: '🌿', n: 'The Imperator’s Triumph', need: [['c', 15, '🏛️', 'Classic wins'], ['k', 40, '⚔️', 'defeated']], how: 'win 15 Classic duels and defeat 40 fighters', tail: 'Rome’s general-emperor: the legion’s pila, the eagle and a triumphant leap', done: 'Rome grants you a Triumph', col: ['250,204,21', '113,63,18', '#fef08a', '#ca8a04,#fde68a'] },
    { key: 'q5', c: PHA, ic: '🌞', n: 'The Sarissa', need: [['k', 25, '⚔️', 'defeated'], ['d', 10000, '💥', 'damage']], how: 'defeat 25 fighters and deal 10,000 damage', tail: 'a Macedonian of the phalanx with the longest reach in the Colosseum', done: 'the phalanx takes you in', col: ['251,191,36', '120,53,15', '#fde68a', '#d97706,#fde68a'] },
    { key: 'q6', c: HAL, ic: '🪓', n: 'The Swiss Guard', need: [['c', 8, '🏛️', 'Classic wins'], ['k', 20, '⚔️', 'defeated']], how: 'win 8 Classic duels and defeat 20 fighters', tail: 'a halberd that cuts, thrusts and hooks', done: 'you’ve joined the Swiss Guard', col: ['239,68,68', '127,29,29', '#fecaca', '#dc2626,#facc15'] },
    { key: 'q7', c: CYC, ic: '👁️', n: 'The Forge of Zeus', need: [['b', 2, '👹', 'boss wins'], ['k', 30, '⚔️', 'defeated']], how: 'beat the 👹 boss 2 times and defeat 30 fighters', tail: 'a one-eyed giant who throws boulders and thunderbolts', done: 'the Cyclops answers your call', col: ['214,167,122', '67,40,20', '#fed7aa', '#b45309,#fed7aa'] },
    { key: 'q8', c: ONI, ic: '👹', n: 'The Oni’s Gate', need: [['w', 20, '🏆', 'wins'], ['d', 30000, '💥', 'damage']], how: 'win 20 duels and deal 30,000 damage', tail: 'a giant tank: vast health, half damage taken, slow heavy blows', done: 'the Oni’s gate opens', col: ['220,38,38', '69,10,10', '#fecaca', '#b91c1c,#fca5a5'] },
    { key: 'q9', c: CAC, ic: '🔥', n: 'The Cave of Cacus', need: [['b', 2, '👹', 'boss wins'], ['d', 20000, '💥', 'damage']], how: 'beat the 👹 boss 2 times and deal 20,000 damage', tail: 'Rome’s fire-breathing giant, son of Vulcan', done: 'Cacus comes out of his cave', col: ['249,115,22', '67,20,7', '#fed7aa', '#ea580c,#fdba74'] },
    { key: 'q10', c: CHO, ic: '👻', n: 'The Shaman’s Call', need: [['k', 60, '⚔️', 'defeated'], ['w', 15, '🏆', 'wins']], how: 'defeat 60 fighters and win 15 duels', tail: 'a spirit of the steppe that possesses its foes', done: 'the spirit answers the drum', col: ['45,212,191', '17,72,68', '#99f6e4', '#0d9488,#99f6e4'] },
    { key: 'q12', c: HH, ic: '🎃', n: 'The Legend of Sleepy Hollow', need: [['w', 18, '🏆', 'wins'], ['d', 20000, '💥', 'damage']], how: 'win 18 duels and deal 20,000 damage', tail: 'the headless Hessian of Sleepy Hollow: a flaming jack-o’-lantern, a phantom gallop and a laugh that sends them running', done: 'the Horseman rides out of the Hollow', col: ['251,146,60', '67,20,7', '#fed7aa', '#ea580c,#fdba74'] },
    { key: 'q11', c: YUR, ic: '🏮', n: 'The Haunting', need: [['w', 12, '🏆', 'wins'], ['d', 15000, '💥', 'damage']], how: 'win 12 duels and deal 15,000 damage', tail: 'a vengeful ghost of old Japan: ghost-fires, sleep paralysis and a grudge', done: 'the lantern gutters — the Yūrei follows you home', col: ['147,197,253', '30,41,82', '#dbeafe', '#3b82f6,#dbeafe'] },
    { key: 'q4', c: JOT, ic: '🧊', n: 'The Frost Saga', need: [['b', 3, '👹', 'boss wins'], ['d', 25000, '💥', 'damage']], how: 'beat the 👹 Laestrygonian boss 3 times and deal 25,000 damage', tail: 'a giant of the frozen north: ice, frost and a great club', done: 'the Frost Saga is sung', col: ['125,211,252', '12,74,110', '#bae6fd', '#0284c7,#bae6fd'] },
  ];
  // the boss: a Laestrygonian bigger still, in silver, bronze and gold — 4,000 health, a scimitar blow every 6 s for 250 (a
  // long 1.4 s warning, 120° in front of it), a stomp every 8 s for 30, 75% slower, 40% less damage, 8% Crush
  const BOSS_C = Object.assign({}, CH[LAE], { hp: 6000, def: 0.5, spd: 0.3, big: 2.4, boss: 1, brute: 0.12, swing: 5, stomp: 6.5, ab: [
    { n: 'Great Scimitar', ic: '🗡️', k: 'melee', dmg: 320, cd: 5, rng: 10, arc: 120, wind: 1.4, an: 'bcleave' },
    { n: 'Earthshaker', ic: '🦶', k: 'stomp', dmg: 45, rad: 36, cd: 6.5, wind: 0.8, an: 'bplant', wspd: 17 }] }); // (bcleave, bplant: its own two-handed blows — the pack holds the sword for them)
  /* ❄️ the Wendigo boss: one boss fight in ten, in the winter forest, 8 minutes. 15,000 health and 75% more for each of you
     after the first; no extra armour; a colder aura than the playable one (50% slow, and cooldowns ×1.25 in it); its four
     stages (+25% damage each). Claw every 5 s, Maul every 10, Self Cannibal every 15 (2% of its health: 10% of 15,000 every
     15 s would kill it), Antler Gore and Endless Hunger every 20 — never Immortal Being */
  const BOSS_W = Object.assign({}, CH[WEN], { hp: 15000, def: 1, spd: 0.8, big: 2.1, boss: 1, wenBoss: 1, secret: 0, aura: [7, 0.5], regen: [0.004, 5], ab: [
    { n: 'Claw', ic: '🦴', k: 'melee', dmg: 150, cd: 5, rng: 9, arc: 130, wind: 0.6, an: 'slash' },
    { n: 'Maul', ic: '🩸', k: 'melee', dmg: 50, cd: 10, rng: 8, arc: 110, wind: 0.45, an: 'quick', maul: [0.25, 3] },
    { n: 'Self Cannibal', ic: '🍖', k: 'buff', cd: 15, an: 'roar', selfP: 0.02, b: { dur: 5, spdM: 1.25, dmgM: 1.5, cdM: 1.5 } },
    { n: 'Antler Gore', ic: '🦌', k: 'dash', dmg: 140, dist: 24, dd: 0.45, cd: 20, wind: 0.85, an: 'charge', fx: { kb: 14, bl: [50, 3] } },
    { n: 'Endless Hunger', ic: '🌑', k: 'leap', dmg: 160, dist: 28, rad: 8, cd: 20, wind: 0.7, an: 'leap', drain: 0.5, fx: { sl: [0.5, 2] } }] });
  /* 🌑 the Skinwalker's quest (🏆 Achievements → 🌑 Exotic): every character quest done, the Extreme bot beaten 10 times, 100,000
     damage, the boss beaten 15 times, 3 wins in a row on Hard or Extreme, and 20 kills in one deathmatch without dying */
  const exoGoals = (S) => { const st = S.st || {}; return [
    ['📜', 'Complete every character quest', QUESTS.filter((Q) => S.own.includes(Q.c)).length, QUESTS.length],
    ['💀', 'Defeat the Extreme bot 10 times', st.b3 | 0, 10],
    ['💥', 'Deal 100,000 damage in total', st.dmg | 0, 100000],
    ['👹', 'Defeat the boss 15 times', st.boss | 0, 15],
    ['🔥', 'Win 3 games in a row on Hard or Extreme', st.hsb | 0, 3],
    ['🗡️', 'Get 20 kills in a deathmatch without dying once', st.dms | 0, 20]]; };
  const WEN_T = 480, strHash = (t) => { let h = 7; for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
    // the fighters' looks for their trails and glows
  /* ⏳ the Limited Shop: the limited fighters are in no crate. The shop has three a week — a mythic and two legendaries — and
     turns over at midnight UTC every Monday (week 0 began on Monday 2 November 2026); each costs Blox Coins, Krampus gold too */
  const LIM_M = [KRA, MED], LIM_L = [HUS, ONN, CEN], LIM_W0 = Date.UTC(2026, 10, 2), LIM_WK = 6048e5, wmod = (a, n) => ((a % n) + n) % n;
  const limWeek = (t = Date.now()) => Math.floor((t - LIM_W0) / LIM_WK);
  const limShop = (w = limWeek()) => { const l = wmod(w, 3); return [LIM_M[wmod(w, 2)], LIM_L[l], LIM_L[(l + 1) % 3]]; };
  const limBack = (c) => { const w = limWeek(); for (let k = 0; k < 6; k++) if (limShop(w + k).includes(c)) return k; return 6; }; // (weeks till it's in the shop: 0 = it is now)
  const limLeft = () => LIM_W0 + (limWeek() + 1) * LIM_WK - Date.now();
  const fmtLeft = (ms) => { const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4); return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${Math.max(1, m)}m`; };
  const COL = ['#ef4444', '#f59e0b', '#2dd4bf', '#a855f7', '#f97316', '#60a5fa', '#fbbf24', '#fb923c', '#a3a3a3', '#dc2626', '#facc15', '#84cc16', '#38bdf8', '#fef3c7', '#e2e8f0', '#93c5fd', '#fda4af', '#a78bfa', '#fb923c', '#fde047', '#fbbf24', '#991b1b', '#f87171', '#fbbf24', '#f97316', '#2dd4bf', '#dc2626', '#a16207', '#7dd3fc', '#38bdf8', '#cbd5e1', '#facc15', '#f43f5e', '#fbbf24', '#7dd3fc', '#f59e0b', '#ef4444', '#d6a77a', '#dc2626', '#fb923c', '#5eead4', '#bfdbfe', '#a16207', '#65a30d', '#3b82f6', '#16a34a', '#e7d3a1', '#fb923c', '#10b981', '#a8a29e', '#14b8a6', '#facc15', '#f59e0b', '#dc2626', '#4ade80', '#e11d48', '#f472b6', '#ef4444', '#22d3ee', '#bae6fd'];
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
  const ROUND_T = 180, DM_T = 300, TO = 3, A0 = 50, B0 = 36; // (a round, a deathmatch; first to; the arena's half-length (x) and half-width (z))
  const LZ = 12; // (the ludus, set back to make room for the Colosseum: everything in it is this much further along z)
  const LOBBY = { z0: 92 + LZ, z1: 156 + LZ, x: 46 }, PADS = [{ md: 'c', x: -18, z: 108 + LZ, n: '⚔️ CLASSIC 1v1', s: 'first to 3' }, { md: 'd', x: 18, z: 108 + LZ, n: '💀 DEATHMATCH 1v1', s: 'most kills in 5:00' }, { md: 'b', x: 0, z: 103 + LZ, n: '👹 BOSS · CO-OP', s: 'up to 4 vs the Laestrygonian' }];
  const SHRINES = [1, 0, 2, 3, 4, 5, 7, 6].map((e, k) => { const x = -38.5 + k * 11; return { e, x, z: Math.round(141 - x * x * 0.009) + LZ }; }); // (an arc of shrines, oldest to newest)
  // one-time codes: only a SHA-256 of each code lives here (never the code), with the fighter it gives. Its claim is a
  // shared document named by a second hash of the code — one nobody can work out without the code — so once anyone
  // redeems it, nobody else can, and nobody without it can spoil it
  const CODES = [{ h: '6124d1a5e45ade300695bd33962ba7fc2cd580976a6e7fe50b0e2fda3e56bc37', c: 4 }]; // (🎟️ the Thraex Gladiator)
  const sha = async (t) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const BOSS_LIVES = 5, BOSS_T = 600; // (and the Wendigo's fight: WEN_T) // (the boss: its health with one of you — more with more — your lives each, and the time you have)
  const ARMORY = { x: -40, z: 120 + LZ }, BOTGATE = { x: 40, z: 120 + LZ }, TABLET = { x: 0, z: 150 + LZ }, SHOP = { x: 24, z: 147 + LZ };
  const isFloor = (x, z) => (x / A0) ** 2 + (z / B0) ** 2;
  const angOf = (dx, dz) => Math.atan2(-dx, -dz); // (the yaw that faces along dx, dz)
  const wrapA = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const now = () => performance.now() / 1000;

  /* ---------------- the Colosseum ----------------
     Built the way the real one was, round an oval of sand: the podium (a marble wall carved with fighters and laurel
     wreaths, a cornice, a balustrade on top, braziers and the four empires' banners); three tiers of seats — marble for
     the senators at the front, travertine, then wooden benches at the top — with stairways and the dark mouths of the
     vomitoria, packed with a crowd that leaps up and throws its arms in the air at every big hit, flags waving; a
     colonnade round the top under a tiled roof; the masts of the velarium, its striped sails and ropes webbing in to a
     ring over the arena. The gates at each end carry the four legends in gold; the emperor sits in his box under a
     purple canopy between two of his guard. Outside: three storeys of open arches you can see into, the attic, a paved
     piazza, cypresses and a triumphal arch on the road to the ludus. Architecture is profiles swept round the oval
     (cornices, steps, walls), repeated things are instanced, the crowd is two meshes moved by its shader. */
  const SC = { fires: [], padFx: [], crates: [], legends: [], banners: [], birds: [], motes: null }; // (the scenery that moves)
  const PA = A0 + 1.2, PB = B0 + 1.2; // (the podium's face)
  // the rows of seats: each a tread at height y from d to d + depth (d: out from the podium's face); tiers, walkways and the walls between
  const ROWS = (() => { const R = []; let d = 1.8, y = 6.0;
    const tier = (n, t, first) => { for (let i = 0; i < n; i++) { const rise = i === 0 ? (first || 1.05) : 1.05; R.push({ d, y0: y, y: y + rise, w: 1.2, t }); y += rise; d += 1.2; } };
    tier(8, 0, 0.6); R.push({ d, y0: y, y, w: 1.6, t: 0, walk: 1 }); d += 1.6; tier(8, 1, 1.8); R.push({ d, y0: y, y, w: 1.6, t: 1, walk: 1 }); d += 1.6; tier(7, 2, 1.8); R.push({ d, y0: y, y, w: 4.6, t: 2, walk: 1, top: 1 }); d += 4.6;
    R.end = d; R.yTop = y; return R; })();
  const YTOP = ROWS.yTop, FH = YTOP + 12.5, FA = PA + ROWS.end + 0.7, FB = PB + ROWS.end + 0.7; // (the top of the seats, the outer wall's height and its oval)
  // points round an oval, evenly spaced along it (not by angle: that bunches them at the ends), each with the turn that faces its +z outwards
  const arcCache = new Map();
  function ellPts(a, b, n, d = 0, off = 0) {
    const key = a + '|' + b; let L = arcCache.get(key);
    if (!L) { const N = 2048, cum = [0]; let s = 0; for (let i = 1; i <= N; i++) { const t0 = ((i - 1) / N) * Math.PI * 2, t1 = (i / N) * Math.PI * 2; s += Math.hypot(a * (Math.cos(t1) - Math.cos(t0)), b * (Math.sin(t1) - Math.sin(t0))); cum.push(s); } L = { cum, N, len: s }; arcCache.set(key, L); }
    const out = []; let j = 0;
    for (let k = 0; k < n; k++) { const target = ((k + off) / n) * L.len; while (j < L.N && L.cum[j + 1] < target) j++; const f = (target - L.cum[j]) / Math.max(1e-6, L.cum[j + 1] - L.cum[j]), t = ((j + f) / L.N) * Math.PI * 2;
      const c = Math.cos(t), s = Math.sin(t), nx = c / a, nz = s / b, nl = Math.hypot(nx, nz); out.push({ t, x: a * c + (nx / nl) * d, z: b * s + (nz / nl) * d, ry: Math.atan2(nx / nl, nz / nl), nx: nx / nl, nz: nz / nl }); }
    out.len = L.len; return out;
  }
  // a profile swept round the oval: [[d, y, colour?], …] — bottom to top (or inside to out) faces in and up; o.out: faces out. o.hard: sharp corners
  function sweep(key, a, b, prof, o = {}) {
    return kg('duSw' + key, () => {
      let P = prof; if (o.hard) { P = []; prof.forEach((p, i) => { P.push(p); if (i > 0 && i < prof.length - 1) P.push(p); }); }
      if (o.out) P = P.slice().reverse();
      const N = o.N || 192, M = P.length, pos = [], uv = [], col = [], idx = [], C = new THREE.Color(), t0 = o.t0 || 0, t1 = o.t1 == null ? Math.PI * 2 : o.t1, vs = o.vs || 4;
      for (let k = 0; k <= N; k++) { const t = t0 + (k / N) * (t1 - t0), c = Math.cos(t), s = Math.sin(t), nx = c / a, nz = s / b, nl = Math.hypot(nx, nz); let v = 0;
        for (let j = 0; j < M; j++) { const [d, y, cc] = P[j]; if (j) v += Math.hypot(d - P[j - 1][0], y - P[j - 1][1]); pos.push(a * c + (nx / nl) * d, y, b * s + (nz / nl) * d); uv.push((k / N) * (o.u || 32), v / vs); C.set(cc || '#ffffff'); col.push(C.r, C.g, C.b); } }
      for (let k = 0; k < N; k++) for (let j = 0; j < M - 1; j++) { const i0 = k * M + j, i1 = (k + 1) * M + j; idx.push(i0, i1, i0 + 1, i1, i1 + 1, i0 + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
    });
  }
  // the textures
  const grain = (g, r, w, h, n, c1, c2) => { for (let k = 0; k < n; k++) { g.fillStyle = r() < 0.5 ? c1 : c2; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2); } };
  const veins = (g, r, w, h, n, col) => { g.strokeStyle = col; for (let k = 0; k < n; k++) { g.lineWidth = 0.6 + r() * 1.4; g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let q = 0; q < 8; q++) { x += (r() - 0.3) * 40; y += (r() - 0.5) * 22; g.lineTo(x, y); } g.stroke(); } };
  const marbleTex = () => kCanvas('duMarble', 256, 256, (g, r) => { g.fillStyle = '#f1ece2'; g.fillRect(0, 0, 256, 256); grain(g, r, 256, 256, 2500, 'rgba(160,150,130,.06)', 'rgba(255,255,255,.08)'); veins(g, r, 256, 256, 14, 'rgba(150,140,125,.22)'); });
  const travTex = () => kCanvas('duTrav', 256, 256, (g, r) => { g.fillStyle = '#d9c9a6'; g.fillRect(0, 0, 256, 256); grain(g, r, 256, 256, 5000, 'rgba(120,100,70,.12)', 'rgba(255,245,220,.1)');
    for (let k = 0; k < 400; k++) { g.fillStyle = 'rgba(110,90,60,.25)'; g.beginPath(); g.ellipse(r() * 256, r() * 256, 1 + r() * 3, 0.6 + r(), 0, 0, 7); g.fill(); } // (the pores)
    g.strokeStyle = 'rgba(100,85,60,.4)'; g.lineWidth = 1.2; for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); for (let x = (y / 32) % 2 ? 32 : 0; x < 256; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } } });
  const seatTex = () => kCanvas('duSeat', 256, 256, (g, r) => { g.fillStyle = '#e9e1d0'; g.fillRect(0, 0, 256, 256); grain(g, r, 256, 256, 4000, 'rgba(120,105,80,.1)', 'rgba(255,255,255,.1)');
    g.strokeStyle = 'rgba(90,75,55,.45)'; g.lineWidth = 1.5; for (let x = 0; x < 256; x += 51) { g.beginPath(); g.moveTo(x + r() * 4, 0); g.lineTo(x + r() * 4, 256); g.stroke(); } for (let y = 0; y < 256; y += 64) { g.fillStyle = 'rgba(80,65,45,.18)'; g.fillRect(0, y, 256, 3); } veins(g, r, 256, 256, 6, 'rgba(140,125,105,.18)'); });
  const plankTex = () => kCanvas('duPlank', 256, 128, (g, r) => { for (let y = 0; y < 128; y += 16) { const c = 120 + r() * 40; g.fillStyle = `rgb(${c},${c * 0.72},${c * 0.45})`; g.fillRect(0, y, 256, 16); g.fillStyle = 'rgba(40,25,10,.5)'; g.fillRect(0, y + 15, 256, 1);
    for (let k = 0; k < 30; k++) { g.fillStyle = 'rgba(60,35,15,.25)'; g.fillRect(r() * 256, y + r() * 15, 10 + r() * 50, 1); } for (let x = r() * 80; x < 256; x += 90 + r() * 60) { g.fillStyle = 'rgba(30,20,10,.6)'; g.fillRect(x, y, 1.5, 15); } } });
  const tileTex = () => kCanvas('duTile', 128, 128, (g) => { g.fillStyle = '#9a3d22'; g.fillRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < 136; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, '#7c2d12'); gr.addColorStop(0.5, '#c2603a'); gr.addColorStop(1, '#7c2d12'); g.fillStyle = gr; g.fillRect(x, y, 15, 15); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x, y + 13, 15, 3); } });
  const sandTex = () => kCanvas('duSand2', 1024, 1024, (g, r) => {
    const gr0 = g.createRadialGradient(512, 512, 60, 512, 512, 520); gr0.addColorStop(0, '#e2c28a'); gr0.addColorStop(0.8, '#d8b67c'); gr0.addColorStop(1, '#b8915a'); g.fillStyle = gr0; g.fillRect(0, 0, 1024, 1024); // (darker where it's piled against the wall)
    for (let k = 0; k < 60000; k++) { const v = r(); g.fillStyle = v < 0.33 ? 'rgba(120,80,30,.12)' : v < 0.66 ? 'rgba(255,240,205,.15)' : 'rgba(80,55,20,.09)'; g.fillRect(r() * 1024, r() * 1024, 1 + r() * 2.5, 1 + r() * 2); }
    for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(${90 + r() * 60},${70 + r() * 40},${40 + r() * 30},.55)`; g.beginPath(); g.arc(r() * 1024, r() * 1024, 0.8 + r() * 2.2, 0, 7); g.fill(); } // (pebbles)
    g.lineWidth = 2.2; for (let k = 3; k < 30; k++) { g.strokeStyle = `rgba(150,105,50,${0.08 + (k % 2) * 0.06})`; g.beginPath(); g.ellipse(512, 512, k * 17.5, k * 17.5, 0, 0, 7); g.stroke(); } // (raked)
    for (let k = 0; k < 14; k++) { const x = 140 + r() * 744, y = 140 + r() * 744, gr = g.createRadialGradient(x, y, 2, x, y, 30 + r() * 60); gr.addColorStop(0, 'rgba(110,70,30,.28)'); gr.addColorStop(1, 'rgba(110,70,30,0)'); g.fillStyle = gr; g.fillRect(x - 100, y - 100, 200, 200); } // (scuffed)
    for (let w = 0; w < 9; w++) { let x = 200 + r() * 620, y = 200 + r() * 620, a = r() * 7; for (let k = 0; k < 26; k++) { a += (r() - 0.5) * 0.6; x += Math.cos(a) * 14; y += Math.sin(a) * 14; const s = k % 2 ? 1 : -1; g.fillStyle = 'rgba(95,60,25,.32)'; g.beginPath(); g.ellipse(x + Math.cos(a + 1.57) * 5 * s, y + Math.sin(a + 1.57) * 5 * s, 5, 2.6, a, 0, 7); g.fill(); } } // (footprints)
    g.strokeStyle = 'rgba(70,45,15,.38)'; g.lineWidth = 7; g.beginPath(); g.arc(512, 512, 100, 0, 7); g.stroke(); g.lineWidth = 2.5; g.beginPath(); g.arc(512, 512, 86, 0, 7); g.stroke();
    g.fillStyle = 'rgba(70,45,15,.26)'; g.beginPath(); for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, rr = k % 2 ? 30 : 80; g.lineTo(512 + Math.cos(a) * rr, 512 + Math.sin(a) * rr); } g.fill();
  });
  const groundTex = () => kCanvas('duGround', 512, 512, (g, r) => { g.fillStyle = '#9a8a5e'; g.fillRect(0, 0, 512, 512); for (let k = 0; k < 9000; k++) { const v = r(); g.fillStyle = v < 0.4 ? 'rgba(90,110,50,.25)' : v < 0.7 ? 'rgba(180,160,110,.2)' : 'rgba(60,50,30,.15)'; g.fillRect(r() * 512, r() * 512, 2 + r() * 4, 2 + r() * 3); } });
  const paveTex = () => kCanvas('duPave', 256, 256, (g, r) => { g.fillStyle = '#b9ab8c'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < 256; x += 64) { const c = 175 + r() * 45; g.fillStyle = `rgb(${c},${c * 0.93},${c * 0.8})`; g.fillRect(x + 2, y + 2, 60, 28); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 2, y + 2, 60, 2); } for (let k = 0; k < 1500; k++) { g.fillStyle = 'rgba(80,60,40,.08)'; g.fillRect(r() * 256, r() * 256, 2, 2); } });
  // the podium's face: carved panels — fighters at it, the wreath and the eagle — between garlands, a moulding above and below
  const reliefTex = () => kCanvas('duRelief', 512, 256, (g, r) => {
    g.fillStyle = '#eee7d8'; g.fillRect(0, 0, 512, 256); grain(g, r, 512, 256, 3500, 'rgba(150,135,110,.07)', 'rgba(255,255,255,.08)'); veins(g, r, 512, 256, 10, 'rgba(150,140,125,.16)');
    const carve = (draw) => { g.save(); g.translate(-1.6, -1.6); g.fillStyle = 'rgba(255,255,255,.9)'; draw(); g.fill(); g.restore(); g.save(); g.translate(2, 2.2); g.fillStyle = 'rgba(90,75,55,.55)'; draw(); g.fill(); g.restore(); g.fillStyle = '#e4dccb'; draw(); g.fill(); };
    const fighter = (x, y, s, f, shield) => () => { g.beginPath(); g.arc(x, y - 52 * s, 7 * s, 0, 7); g.rect(x - 7 * s, y - 45 * s, 14 * s, 24 * s); g.moveTo(x - 6 * s, y - 21 * s); g.lineTo(x - 14 * s * f, y); g.lineTo(x - 8 * s * f, y); g.lineTo(x, y - 18 * s); g.lineTo(x + 6 * s * f, y); g.lineTo(x + 12 * s * f, y); g.lineTo(x + 6 * s, y - 21 * s); g.closePath();
      g.rect(x + (f > 0 ? 6 : -26) * s, y - 44 * s, 20 * s, 4 * s); g.moveTo(x + 24 * f * s, y - 46 * s); g.lineTo(x + 46 * f * s, y - 60 * s); g.lineTo(x + 25 * f * s, y - 40 * s); if (shield) g.rect(x - (f > 0 ? 22 : -8) * s, y - 46 * s, 14 * s, 26 * s); };
    // two panels: a pair of fighters, then the wreath and eagle
    g.strokeStyle = 'rgba(120,105,80,.6)'; g.lineWidth = 3;
    for (const [x0, k] of [[14, 0], [266, 1]]) { g.fillStyle = 'rgba(205,192,168,.55)'; g.fillRect(x0, 40, 232, 168); g.strokeRect(x0, 40, 232, 168); g.strokeRect(x0 + 8, 48, 216, 152);
      if (k === 0) { carve(fighter(x0 + 80, 186, 1.9, 1, true)); carve(fighter(x0 + 156, 186, 1.9, -1, false)); }
      else { carve(() => { g.beginPath(); g.ellipse(x0 + 116, 124, 54, 54, 0, 0, 7); g.ellipse(x0 + 116, 124, 40, 40, 0, 0, 7, true); }); for (let q = 0; q < 14; q++) { const a = Math.PI * 0.6 + (q / 13) * Math.PI * 1.8; carve(() => { g.beginPath(); g.ellipse(x0 + 116 + Math.cos(a) * 47, 124 + Math.sin(a) * 47, 9, 4, a + 1, 0, 7); }); }
        carve(() => { const cx = x0 + 116, cy = 120; g.beginPath(); g.moveTo(cx, cy - 26); g.lineTo(cx + 10, cy - 8); g.lineTo(cx + 32, cy - 18); g.lineTo(cx + 22, cy + 2); g.lineTo(cx + 8, cy + 4); g.lineTo(cx + 6, cy + 24); g.lineTo(cx - 6, cy + 24); g.lineTo(cx - 8, cy + 4); g.lineTo(cx - 22, cy + 2); g.lineTo(cx - 32, cy - 18); g.lineTo(cx - 10, cy - 8); g.closePath(); }); } }
    for (const x of [0, 252, 504]) carve(() => { g.beginPath(); g.rect(x, 30, 8, 190); }); // (pilaster strips)
    g.fillStyle = 'rgba(120,100,70,.35)'; g.fillRect(0, 26, 512, 4); g.fillRect(0, 218, 512, 4); for (let x = 0; x < 512; x += 16) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x, 8, 8, 10); g.fillStyle = 'rgba(110,90,60,.4)'; g.fillRect(x + 8, 8, 8, 10); } // (dentils)
    for (let x = 0; x < 512; x += 28) { g.strokeStyle = 'rgba(120,140,70,.55)'; g.lineWidth = 4; g.beginPath(); g.arc(x + 14, 226, 14, 0.1, Math.PI - 0.1); g.stroke(); } // (garlands)
  });
  // the outer wall, one bay: three storeys of open arches (see-through) and the attic's windows; a keystone and moulding round each arch
  const arcadeTex = () => kCanvas('duArcade', 256, 512, (g, r) => {
    g.fillStyle = '#d6c6a2'; g.fillRect(0, 0, 256, 512); grain(g, r, 256, 512, 6000, 'rgba(110,90,60,.13)', 'rgba(255,245,220,.1)');
    g.strokeStyle = 'rgba(100,85,60,.35)'; g.lineWidth = 1; for (let y = 0; y < 512; y += 14) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); for (let x = (y / 14) % 2 ? 0 : 26; x < 256; x += 52) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 14); g.stroke(); } }
    g.fillStyle = 'rgba(40,30,20,.85)'; for (const x of [70, 158]) g.fillRect(x, 40, 28, 34); // (the attic's windows)
    for (let s = 0; s < 3; s++) { const y0 = 134 + s * 126, h = 112;
      g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(62, y0 + h); g.lineTo(62, y0 + 48); g.arc(128, y0 + 48, 66, Math.PI, 0); g.lineTo(194, y0 + h); g.closePath(); g.fill(); g.restore(); // (an opening)
      g.strokeStyle = '#efe4c8'; g.lineWidth = 8; g.beginPath(); g.arc(128, y0 + 48, 70, Math.PI, 0); g.stroke(); g.fillStyle = '#efe4c8'; g.fillRect(122, y0 - 30, 12, 16); g.fillRect(52, y0 + 44, 14, 8); g.fillRect(190, y0 + 44, 14, 8);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, y0 - 6, 256, 5); }
  });
  const corridorTex = () => kCanvas('duCorr', 128, 256, (g, r) => { const gr = g.createLinearGradient(0, 256, 0, 0); gr.addColorStop(0, '#5b3a1e'); gr.addColorStop(0.3, '#2b2018'); gr.addColorStop(1, '#14100c'); g.fillStyle = gr; g.fillRect(0, 0, 128, 256); for (const y of [80, 160, 238]) { const gg = g.createRadialGradient(64, y, 2, 64, y, 40); gg.addColorStop(0, 'rgba(255,170,80,.6)'); gg.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = gg; g.fillRect(0, y - 40, 128, 80); } });
  const sailTex = () => kCanvas('duSail', 256, 128, (g, r) => { for (let x = 0; x < 256; x += 32) { g.fillStyle = (x / 32) % 2 ? '#f3e9d2' : '#a61b1b'; g.fillRect(x, 0, 32, 128); } grain(g, r, 256, 128, 1500, 'rgba(0,0,0,.05)', 'rgba(255,255,255,.06)'); g.fillStyle = 'rgba(80,50,20,.35)'; for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 1.5, 128); g.fillRect(0, 0, 256, 3); g.fillRect(0, 125, 256, 3); });
  const vomTex = () => kCanvas('duVom', 128, 128, (g) => { g.clearRect(0, 0, 128, 128); g.fillStyle = '#e9e1d0'; g.beginPath(); g.moveTo(14, 128); g.lineTo(14, 52); g.arc(64, 52, 50, Math.PI, 0); g.lineTo(114, 128); g.closePath(); g.fill(); const gr = g.createLinearGradient(0, 128, 0, 20); gr.addColorStop(0, '#2a1f16'); gr.addColorStop(1, '#0c0907'); g.fillStyle = gr; g.beginPath(); g.moveTo(26, 128); g.lineTo(26, 54); g.arc(64, 54, 38, Math.PI, 0); g.lineTo(102, 128); g.closePath(); g.fill(); g.fillStyle = '#cfc4ad'; g.fillRect(58, 4, 12, 12); });
  const bannerTex = (e) => kCanvas('duBan2' + e, 128, 448, (g) => {
    const [bg, fg] = [['#8f1414', '#e8b84a'], ['#1d3f99', '#f8fafc'], ['#16306b', '#facc15'], ['#f7f2e6', '#b91c1c']][e]; g.fillStyle = bg; g.fillRect(0, 0, 128, 400);
    const sh = g.createLinearGradient(0, 0, 128, 0); sh.addColorStop(0, 'rgba(0,0,0,.25)'); sh.addColorStop(0.5, 'rgba(255,255,255,.08)'); sh.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = sh; g.fillRect(0, 0, 128, 400);
    g.fillStyle = fg; g.fillRect(0, 0, 128, 12); g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(10, 20, 108, 368);
    for (let x = 4; x < 128; x += 12) { g.beginPath(); g.moveTo(x, 400); g.lineTo(x + 6, 440); g.lineTo(x + 12, 400); g.fill(); } // (the fringe)
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (e === 0) { g.font = 'bold 30px serif'; g.fillText('SPQR', 64, 300); g.beginPath(); g.moveTo(64, 70); g.lineTo(98, 124); g.lineTo(80, 120); g.lineTo(102, 176); g.lineTo(64, 146); g.lineTo(26, 176); g.lineTo(48, 120); g.lineTo(30, 124); g.closePath(); g.fill(); g.beginPath(); g.arc(64, 214, 26, 0, 7); g.lineWidth = 6; g.stroke(); }
    else if (e === 1) { g.lineWidth = 7; g.beginPath(); g.moveTo(26, 270); g.lineTo(64, 110); g.lineTo(102, 270); g.stroke(); for (let x = 16; x < 112; x += 20) g.strokeRect(x, 330, 14, 14); }
    else if (e === 2) { g.font = 'bold 120px serif'; g.fillText('⚜', 64, 186); g.fillRect(30, 290, 68, 8); g.fillRect(60, 260, 8, 70); }
    else { g.beginPath(); g.arc(64, 156, 46, 0, 7); g.fill(); g.font = 'bold 40px serif'; g.fillText('武', 64, 280); g.fillText('士', 64, 328); }
  });
  // the crowd: a body (a robe, folded legs and two arms that go up when they cheer) and a head with hair, all drawn at once,
  // each with its own moment: uT the time, uAmp how much they bounce, uCheer how high the arms go (the excitement)
  const CROWD = { u: { uT: { value: 0 }, uAmp: { value: 0.05 }, uCheer: { value: 0.1 } }, ex: 0 };
  function crowdGeo(key, parts, armIdx) { return kg(key, () => { const B = [], arms = [];
    for (const [i, [w, h, d, x, y, z, col]] of parts.entries()) { const q = new THREE.BoxGeometry(w, h, d).toNonIndexed(); q.translate(x, y, z); const n = q.attributes.position.count, cc = new THREE.Color(col || '#ffffff'), c = new Float32Array(n * 3), am = new Float32Array(n);
      for (let k = 0; k < n; k++) { c[k * 3] = cc.r; c[k * 3 + 1] = cc.g; c[k * 3 + 2] = cc.b; am[k] = armIdx[i] || 0; } q.setAttribute('color', new THREE.BufferAttribute(c, 3)); q.setAttribute('aArm', new THREE.BufferAttribute(am, 1)); q.deleteAttribute('uv'); B.push(q); }
    const pos = [], nor = [], col = [], arm = []; for (const q of B) { pos.push(...q.attributes.position.array); nor.push(...q.attributes.normal.array); col.push(...q.attributes.color.array); arm.push(...q.attributes.aArm.array); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aArm', new THREE.Float32BufferAttribute(arm, 1)); return g; }); }
  const crowdMat = (flag) => { const m = new THREE.MeshLambertMaterial({ color: '#ffffff', vertexColors: true, side: flag ? THREE.DoubleSide : THREE.FrontSide });
    m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, CROWD.u); sh.vertexShader = 'attribute float aPh;\nattribute float aArm;\nuniform float uT;\nuniform float uAmp;\nuniform float uCheer;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float ph = aPh * 40.0; float up = uAmp * max(0.0, sin(uT * (6.0 + aPh * 4.0) + ph));
      if (abs(aArm) > 0.5 && aArm < 1.5) { float raise = uCheer * (2.1 + 0.7 * sin(uT * (7.0 + aPh * 5.0) + ph + aArm)) * step(fract(aPh * 7.3), 0.25 + uCheer * 0.75); vec3 p = transformed - vec3(0.0, 1.05, 0.0); float c = cos(raise), s = sin(raise); transformed = vec3(p.x, p.y * c + p.z * s, -p.y * s + p.z * c) + vec3(0.0, 1.05, 0.0); }
      if (aArm > 1.5) { float w = (transformed.x + 0.1) * 1.4; transformed.z += sin(uT * 9.0 + ph + w * 2.5) * 0.18 * w; transformed.y += sin(uT * 7.0 + ph + w * 2.0) * 0.06 * w; }
      transformed.y += up;`); }; m.customProgramCacheKey = () => 'duCrowd' + (flag ? 'f' : ''); return m; };
  function crowd(par, rnd) {
    const dens = touchy ? 0.6 : 0.88, spots = [], aisles = ellPts(PA, PB, 24, 0).map((p) => p.t);
    ROWS.forEach((R, s) => { if (R.walk) return; const pts = ellPts(PA, PB, Math.floor(ellPts(PA, PB, 1, R.d + 0.45).len / 1.12), R.d + 0.45);
      for (const p of pts) { const dt = Math.min(...aisles.map((a) => Math.abs(wrapA(a - p.t)))); if (dt * (PA + R.d) < 1.1 || rnd() > dens) continue;
        if (p.z < -PB - 2 && Math.abs(p.x) < 11 && R.t === 0) continue; if (Math.abs(p.z) < 8 && p.x * p.x > 900 && R.t === 0 && s < 4) continue; // (the emperor's box; over the gates)
        spots.push([p.x, R.y, p.z, p.ry + Math.PI + (rnd() - 0.5) * 0.4, rnd(), R.t]); } });
    const n = spots.length, ph = new Float32Array(n); spots.forEach((s, i) => (ph[i] = s[4]));
    const body = crowdGeo('duCrB', [[0.9, 1.0, 0.55, 0, 0.62, 0], [0.86, 0.32, 0.75, 0, 0.16, -0.32, '#d8d0c0'], [0.24, 0.78, 0.26, 0.57, 0.66, 0], [0.24, 0.78, 0.26, -0.57, 0.66, 0]], [0, 0, 1, 1]);
    const head = crowdGeo('duCrH', [[0.58, 0.56, 0.56, 0, 1.43, -0.03], [0.62, 0.22, 0.62, 0, 1.76, 0.02, '#2a1a0e']], [0, 0]);
    const flagG = crowdGeo('duCrF', [[0.06, 2.2, 0.06, 0.5, 1.9, -0.1, '#5b3a1e'], [1.1, 0.7, 0.02, 1.07, 2.65, -0.1]], [0, 2]);
    const mk = (geo, m, cnt) => { const g2 = geo.clone(); g2.setAttribute('aPh', new THREE.InstancedBufferAttribute(cnt === n ? ph : ph.slice(0, cnt), 1)); const im = new THREE.InstancedMesh(g2, m, cnt); im.frustumCulled = false; im.userData.noShadow = true; par.add(im); return im; };
    const nf = Math.floor(n * 0.05), B = mk(body, crowdMat(), n), H = mk(head, crowdMat(), n), F = mk(flagG, crowdMat(true), nf); SC.crowdM = [B, H, F]; // (kept: 🚀 performance mode empties the stands)
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), c = new THREE.Color();
    const TOG = [['#f5f1e6', '#efe6d2', '#e7dcc3', '#f5f1e6', '#b91c1c', '#1d4ed8', '#7c2d12', '#5b21b6', '#15803d', '#ca8a04', '#9a3412', '#334155'], ['#e7dcc3', '#a16207', '#7f1d1d', '#1e3a8a', '#365314', '#78350f', '#57534e'], ['#a8a29e', '#78716c', '#92400e', '#7c2d12', '#3f6212', '#57534e']];
    const SK = ['#f5cd9b', '#e0ac69', '#c68642', '#8d5524', '#ffe0bd', '#f2c94c'], FLG = ['#b91c1c', '#1d4ed8', '#facc15', '#f8fafc', '#16a34a', '#7c3aed'];
    let f = 0; const fIdx = new Set(); while (fIdx.size < nf) fIdx.add(Math.floor(rnd() * n));
    spots.forEach(([x, y, z, ry, r0, t], i) => { const sc = 0.9 + r0 * 0.22; Q.setFromAxisAngle(up, ry); V.set(x, y, z); S.set(sc, sc, sc); M.compose(V, Q, S); B.setMatrixAt(i, M); H.setMatrixAt(i, M);
      const T = TOG[t]; B.setColorAt(i, c.set(T[Math.floor(rnd() * T.length)])); H.setColorAt(i, c.set(SK[Math.floor(rnd() * SK.length)]));
      if (fIdx.has(i) && f < nf) { F.setMatrixAt(f, M); F.setColorAt(f, c.set(FLG[Math.floor(rnd() * FLG.length)])); ph[f] = r0; f++; } });
    for (const im of [B, H, F]) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
    return n;
  }
  // a figure that never moves, made into one mesh for each of its materials: hundreds of parts drawn in a few calls (its glows kept as they are)
  function bake(root) {
    root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), by = new Map(), keep = [];
    root.traverse((o) => { let vis = true; for (let q = o; q && q !== root.parent; q = q.parent) if (!q.visible) vis = false; if (!vis) return;
      const M = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      if (o.isSprite || (o.isMesh && (Array.isArray(o.material) || o.isInstancedMesh))) { const c = o.clone(); c.matrixAutoUpdate = false; c.matrix.copy(M); keep.push(c); return; }
      if (!o.isMesh) return; const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()); g.applyMatrix4(M); const k = o.material.uuid; if (!by.has(k)) by.set(k, { m: o.material, gs: [] }); by.get(k).gs.push(g); });
    const out = new THREE.Group(); out.position.copy(root.position); out.rotation.copy(root.rotation); out.scale.copy(root.scale);
    for (const { m, gs } of by.values()) { const n = gs.reduce((a, g) => a + g.attributes.position.count, 0), P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2), C = m.vertexColors ? new Float32Array(n * 3).fill(1) : null; let o2 = 0;
      for (const g of gs) { const c = g.attributes.position.count; P.set(g.attributes.position.array.subarray(0, c * 3), o2 * 3); if (g.attributes.normal) N.set(g.attributes.normal.array.subarray(0, c * 3), o2 * 3); if (g.attributes.uv) U.set(g.attributes.uv.array.subarray(0, c * 2), o2 * 2); if (C && g.attributes.color && g.attributes.color.itemSize === 3) C.set(g.attributes.color.array.subarray(0, c * 3), o2 * 3); o2 += c; g.dispose(); }
      const G2 = new THREE.BufferGeometry(); G2.setAttribute('position', new THREE.BufferAttribute(P, 3)); G2.setAttribute('normal', new THREE.BufferAttribute(N, 3)); G2.setAttribute('uv', new THREE.BufferAttribute(U, 2)); if (C) G2.setAttribute('color', new THREE.BufferAttribute(C, 3));
      const mesh = new THREE.Mesh(G2, m); mesh.userData.ownGeo = 1; out.add(mesh); }
    for (const c of keep) out.add(c); return out;
  }
  // a figure of one of the legends in gold, for the gates
  function goldStatue(c, x, y, z, ry, s = 1.15) {
    const a = makeAvatar([1, 0, 0, 0, 17, 0, 0, 0, 0, 0, DUEL_BT + c, DUEL_AN + c], '', true); scene.remove(a.shadow); for (let k = 0; k < 25; k++) animateAvatar(a, 0.1, false, false);
    const gold = metalMat('#e8b84a', { specular: '#fff2c0', shininess: 90, reflectivity: 0.6 }); a.g.traverse((o) => { if (o.isMesh) o.material = gold; else if (o.isSprite) o.visible = false; });
    a.g.position.set(x, y, z); a.g.rotation.y = ry; a.g.scale.setScalar(s); return bake(a.g);
  }
  function buildColosseum() {
    const G = new THREE.Group(); place.add(G); SC.colG = G; const rnd = mulberry(1907);
    const Lm = (o) => new THREE.MeshLambertMaterial(Object.assign({ color: '#ffffff' }, o || {})), add = (geo, m, x = 0, y = 0, z = 0, par = G) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); par.add(o); return o; };
    const MARB = Lm({ map: marbleTex(), vertexColors: true }), TRAV = Lm({ map: travTex(), vertexColors: true }), bronze = metalMat('#b8763a', { shininess: 90 }), gold = metalMat('#e8b84a', { specular: '#fff2c0' }), iron = metalMat('#3f3f46', { shininess: 60 });
    const inst = (geo, mat, list, f) => { const im = new THREE.InstancedMesh(geo, mat, list.length), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
      list.forEach((p, i) => { const [x, y, z, ry, sx, sy, sz] = f(p, i); Q.setFromAxisAngle(up, ry); V.set(x, y, z); S.set(sx, sy, sz); M.compose(V, Q, S); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; G.add(im); return im; };
    /* the arena floor: sand (solid underneath), a stone gutter round its edge, wooden trapdoors to the hypogeum */
    const fl = add(kg('duFloor', () => { const q = new THREE.CircleGeometry(1, 128); q.rotateX(-Math.PI / 2); return q; }), Lm({ map: sandTex() }), 0, 0.01, 0); fl.scale.set(PA, 1, PB);
    const solid = slab(0, 0, 0, 2 * (A0 + 4), 2 * (B0 + 4), 0xd9b77c, { sy: 2 }); solid.m.visible = false;
    for (const p of ellPts(PA + 0.9, PB + 0.9, 96)) { const w = part({ x: p.x, y: 8, z: p.z, sx: 2.6, sy: 16, sz: 2.6 }); w.m.visible = false; } // (an unseen wall round the arena, taller than any jump)
    add(sweep('gutter', PA, PB, [[-1.9, 0.02, '#b9ab8c'], [-1.9, 0.08, '#cfc2a4'], [-1.5, 0.1, '#cfc2a4'], [-1.45, 0.03, '#6b5a40'], [-1.0, 0.03, '#6b5a40'], [-0.95, 0.1, '#cfc2a4'], [0, 0.1, '#cfc2a4']], { hard: true, u: 60 }), TRAV);
    const plank = Lm({ map: plankTex() }); for (const [x, z, w, d] of [[-30, -13, 4, 2.6], [30, 13, 4, 2.6], [-13, 20, 2.6, 4], [13, -20, 2.6, 4], [0, 0, 3, 3]]) { if (!x && !z) continue; const td = add(BOX, plank, x, 0.03, z); td.scale.set(w, 0.06, d); for (const s of [-1, 1]) { const rg = add(kTor(0.25), iron, x + s * w * 0.28, 0.08, z); rg.rotation.x = Math.PI / 2; rg.scale.setScalar(0.22); } }
    // the debris of earlier fights against the wall: shields leant there, spears in the sand
    for (const p of ellPts(PA - 1.3, PB - 1.3, 14, 0, 0.3)) { if (Math.abs(p.z) < 8 && Math.abs(p.x) > 25) continue; if (rnd() < 0.5) { const sh = add(kg('duDebSh', () => new THREE.CylinderGeometry(0.9, 0.9, 0.12, 20)), rnd() < 0.5 ? bronze : Lm({ map: woodTex(), color: '#8b5a2b' }), p.x, 0.85, p.z); sh.rotation.set(Math.PI / 2 - 0.35, 0, 0); sh.rotation.y = p.ry; sh.rotateX(0); }
      else { const sp = add(kCyl(), Lm({ map: woodTex(), color: '#8b5a2b' }), p.x, 1.4, p.z); sp.scale.set(0.07, 3.2, 0.07); sp.rotation.z = (rnd() - 0.5) * 0.5; sp.rotation.x = (rnd() - 0.5) * 0.4; } }
    /* the podium: a plinth, the carved marble face, a cornice, the walkway on top and a balustrade */
    add(sweep('podium', PA, PB, [[-0.55, 0, '#8d8473'], [-0.55, 0.85, '#9b917f'], [-0.25, 1.0], [-0.25, 5.15], [-0.45, 5.25], [-0.75, 5.45], [-0.75, 5.62], [-0.45, 5.72], [-0.3, 5.95], [0, 6.0], [1.8, 6.0]], { hard: true, u: 1, vs: 1 }), MARB);
    const face = add(sweep('podFace2', PA, PB, [[-0.3, 1.0], [-0.3, 5.15]], { u: 24, vs: 4.15, N: 256 }), Lm({ map: reliefTex() })); face.material.map.wrapT = THREE.ClampToEdgeWrapping;
    const pil = ellPts(PA, PB, 48, -0.32, 0.5); inst(rboxGeo(0.62, 4.2, 0.3, 0.05), Lm({ map: marbleTex() }), pil, (p) => [p.x, 3.08, p.z, p.ry, 1, 1, 1]); inst(rboxGeo(0.95, 0.32, 0.5, 0.05), Lm({ map: marbleTex() }), pil, (p) => [p.x, 5.3, p.z, p.ry, 1, 1, 1]);
    const gap = (p) => !(Math.abs(p.z) < 4.5 && Math.abs(p.x) > 20) && !(p.z < -PB + 1 && Math.abs(p.x) < 9);
    const bal = ellPts(PA, PB, 420, 0.35).filter(gap); inst(kLathe('duBaluster', [[0, 0], [0.12, 0], [0.12, 0.08], [0.07, 0.16], [0.14, 0.42], [0.06, 0.62], [0.09, 0.7], [0.12, 0.8], [0, 0.8]], 6), Lm({ map: marbleTex(), color: '#f3eee4' }), bal, (p) => [p.x, 6.0, p.z, 0, 1, 1, 1]).userData.noShadow = true;
    add(sweep('balRail', PA, PB, [[0.18, 6.78], [0.18, 6.98], [0.24, 7.02], [0.52, 7.02], [0.56, 6.98], [0.56, 6.78], [0.18, 6.78]], { hard: true, u: 90 }), MARB);
    /* the seats: marble, then travertine, then wooden benches; between the tiers a walkway and a wall (the balteus) */
    const prof = [[1.8, 6.0, '#efe9dc']]; ROWS.forEach((R) => { const c = R.t === 0 ? '#f2ede2' : R.t === 1 ? '#dfd0b2' : '#c8b796'; prof.push([R.d, R.y0, c], [R.d, R.y, R.walk ? c : c], [R.d + R.w, R.y, c]); if (R.walk && !R.top) prof.push([R.d + R.w, R.y + 0.0, c]); });
    const stone = prof.filter((p) => p[1] <= ROWS.find((R) => R.t === 2 && !R.walk).y0 + 0.01), wood = prof.slice(stone.length - 1);
    add(sweep('cavStone', PA, PB, stone, { hard: true, u: 140, vs: 2.4 }), Lm({ map: seatTex(), vertexColors: true }));
    add(sweep('cavWood', PA, PB, wood, { hard: true, u: 160, vs: 1.2 }), Lm({ map: plankTex(), vertexColors: true }));
    // parapets along the front of each balteus, and the stairways up through the tiers
    for (const R of ROWS.filter((q) => q.walk && !q.top)) add(sweep('parapet' + R.d, PA, PB, [[R.d + 0.05, R.y, '#d8cbb0'], [R.d + 0.05, R.y + 0.95, '#e7dcc6'], [R.d + 0.35, R.y + 1.0, '#e7dcc6'], [R.d + 0.35, R.y, '#d8cbb0']], { hard: true, u: 120 }), TRAV);
    const aisle = ellPts(PA, PB, 24, 0), stairs = []; for (const a of aisle) for (const R of ROWS) { if (R.walk) continue; for (const h of [0, 1]) { const d = R.d + 0.3 + h * 0.6; stairs.push([a.x + a.nx * d, R.y0 + (R.y - R.y0) * (0.5 + 0.5 * h), a.z + a.nz * d, a.ry]); } }
    inst(BOX, Lm({ map: travTex(), color: '#cdbf9f' }), stairs, ([x, y, z, ry]) => [x, y - 0.25, z, ry, 1.6, 0.55, 0.62]);
    const voms = []; for (const R of ROWS.filter((q) => q.walk && !q.top)) for (const p of ellPts(PA, PB, 24, R.d + R.w - 0.02, 0.5)) voms.push([p.x, R.y + 0.9, p.z, p.ry]); // (the vomitoria: in the wall at the back of each walkway)
    const nextWall = (R) => { const i = ROWS.indexOf(R); return ROWS[i + 1]; }; void nextWall;
    inst(kg('duVomG', () => new THREE.PlaneGeometry(2.4, 1.8)), Lm({ map: vomTex(), transparent: true, alphaTest: 0.5 }), voms, ([x, y, z, ry]) => [x, y, z, ry + Math.PI, 1, 1, 1]);
    CROWD.n = crowd(G, rnd);
    /* the colonnade at the top, its tiled roof, and the inside of the attic */
    const top = ROWS[ROWS.length - 1], cd = top.d + 1.4, cols = ellPts(PA, PB, 120, cd);
    inst(kLathe('duColShaft', [[0, 0], [0.5, 0], [0.5, 0.18], [0.4, 0.3], [0.36, 5.6], [0.44, 5.75], [0.6, 5.95], [0.6, 6.15], [0, 6.15]], 12), Lm({ map: marbleTex() }), cols, (p) => [p.x, YTOP, p.z, p.ry, 1, 1, 1]);
    add(sweep('architrave', PA, PB, [[cd - 0.7, YTOP + 6.1], [cd - 0.7, YTOP + 6.9], [cd - 0.9, YTOP + 7.1], [cd - 0.9, YTOP + 7.3]], { hard: true, u: 60 }), MARB);
    add(sweep('roof', PA, PB, [[cd - 0.9, YTOP + 7.3, '#c2603a'], [ROWS.end + 0.05, YTOP + 9.6, '#c2603a']], { u: 200, vs: 1.5 }), Lm({ map: tileTex(), vertexColors: true }));
    add(sweep('attIn', PA, PB, [[ROWS.end, YTOP, '#cbb995'], [ROWS.end, FH, '#d8c8a6']], { u: 80, vs: 4 }), TRAV);
    add(sweep('attTop', PA, PB, [[ROWS.end, FH], [ROWS.end + 0.7, FH]], { u: 80 }), TRAV);
    /* the outer wall: open arches over a dark corridor (you see in), half-columns, cornices between the storeys, the attic's pilasters; a plinth of steps at its foot */
    const NB = 80, arc = add(sweep('arcade', FA - 0.7, FB - 0.7, [[0.7, 0], [0.7, FH]], { u: NB, vs: FH, out: true, N: NB * 4 }), Lm({ map: arcadeTex(), alphaTest: 0.5, side: THREE.DoubleSide })); arc.material.map.wrapT = THREE.ClampToEdgeWrapping;
    // (the texture's v runs bottom to top over the wall's height: its arches are drawn from the top down)
    add(sweep('corrWall', FA - 0.7, FB - 0.7, [[-4.2, 0], [-4.2, FH * 0.73]], { u: 60, vs: FH * 0.73, out: true }), Lm({ map: corridorTex() }));
    for (const f of [0, 1, 2]) { const y = FH * (1 - (134 + f * 126 + 112) / 512); add(sweep('corrFl' + f, FA - 0.7, FB - 0.7, [[-4.2, y + 0.02, '#4a3a2a'], [0.6, y + 0.02, '#6b5a40']], { u: 60, out: false }), Lm({ map: travTex(), vertexColors: true })); }
    const bays = ellPts(FA, FB, NB, 0.15), half = [];
    for (const p of bays) for (let f = 0; f < 3; f++) { const y0 = FH * (1 - (134 + f * 126 + 112) / 512), y1 = FH * (1 - (134 + f * 126 - 6) / 512); half.push([p, y0, y1 - y0]); }
    inst(kg('duHalfCol', () => new THREE.CylinderGeometry(0.62, 0.68, 1, 12, 1)), Lm({ map: travTex(), color: '#e2d4b4' }), half, ([p, y, h]) => [p.x, y + h / 2, p.z, p.ry, 1, h, 1]);
    inst(BOX, Lm({ map: travTex(), color: '#e8dcc0' }), half, ([p, y, h]) => [p.x + p.nx * 0.1, y + h - 0.35, p.z + p.nz * 0.1, p.ry, 1.7, 0.7, 1.3]);
    const att = ellPts(FA, FB, NB, 0.1); inst(BOX, Lm({ map: travTex(), color: '#e2d4b4' }), att, (p) => [p.x, FH * (1 - 66 / 512), p.z, p.ry, 1.2, FH * (120 / 512), 0.5]);
    for (const f of [0, 1, 2]) { const y = FH * (1 - (134 + f * 126 - 6) / 512); add(sweep('corn' + f, FA - 0.7, FB - 0.7, [[0.65, y - 0.4], [1.3, y - 0.2], [1.5, y + 0.1], [1.5, y + 0.4], [0.65, y + 0.45]], { hard: true, out: true, u: 120 }), TRAV); }
    add(sweep('crown', FA - 0.7, FB - 0.7, [[0.65, FH - 0.6], [1.4, FH - 0.3], [1.4, FH + 0.2], [-0.05, FH + 0.2]], { hard: true, out: true, u: 120 }), TRAV);
    add(sweep('steps', FA - 0.7, FB - 0.7, [[4.2, 0, '#bfb08f'], [4.2, 0.35], [3.2, 0.35], [3.2, 0.7], [2.2, 0.7], [2.2, 1.05], [0.7, 1.05]], { hard: true, out: true, u: 100 }), TRAV);
    /* the velarium: masts on the attic, sails out over the seats (gaps between them), ropes to a ring above the arena */
    const masts = ellPts(FA, FB, 64, -0.3); inst(kg('duMast2', () => new THREE.CylinderGeometry(0.16, 0.22, 9, 6)), Lm({ map: woodTex(), color: '#7c5a36' }), masts, (p) => [p.x, FH + 4.5, p.z, 0, 1, 1, 1]);
    const sail = kg('duSails', () => { const N = 32, pos = [], uv = [], idx = [], R0 = 1.0, R1 = 0.62; let b = 0;
      for (let k = 0; k < N; k++) { const t0 = (k / N) * Math.PI * 2 + 0.012, t1 = ((k + 1) / N) * Math.PI * 2 - 0.03; for (let i = 0; i <= 6; i++) for (let j = 0; j <= 4; j++) { const r = R0 + (R1 - R0) * (i / 6), t = t0 + (t1 - t0) * (j / 4), sag = Math.sin((i / 6) * Math.PI) * Math.sin((j / 4) * Math.PI) * 1.6;
          pos.push(Math.cos(t) * r, 8 - (i / 6) * 5 - sag, Math.sin(t) * r); uv.push(j / 4, i / 6); }
        for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const q = b + i * 5 + j; idx.push(q, q + 5, q + 1, q + 1, q + 5, q + 6); } b += 35; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; });
    const sl = add(sail, Lm({ map: sailTex(), side: THREE.DoubleSide }), 0, FH, 0); sl.scale.set(FA - 0.3, 1, FB - 0.3);
    const ring = add(kg('duOculus', () => new THREE.TorusGeometry(1, 0.012, 6, 96)), Lm({ color: '#6b4a22' }), 0, FH + 2.5, 0); ring.rotation.x = Math.PI / 2; ring.scale.set((FA - 0.3) * 0.36, (FB - 0.3) * 0.36, 1);
    const rp = []; for (const p of ellPts(FA - 0.3, FB - 0.3, 64, 0)) { const ix = p.x * 0.36, iz = p.z * 0.36; rp.push(p.x, FH + 8.8, p.z, ix, FH + 2.5, iz); }
    const ropes = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)), new THREE.LineBasicMaterial({ color: '#5b4126', transparent: true, opacity: 0.85 })); G.add(ropes);
    const pen = ellPts(FA, FB, 32, -0.3); inst(kg('duPennant', () => { const q = new THREE.PlaneGeometry(1.8, 0.7); q.translate(0.9, 0, 0); return q; }), Lm({ color: '#b91c1c', side: THREE.DoubleSide }), pen, (p) => [p.x, FH + 8.4, p.z, p.ry + Math.PI / 2, 1, 1, 1]).userData.noShadow = true;
    /* the gates at each end: an arch through the podium, an iron portcullis, columns, an entablature and two of the legends in gold */
    const LEG4 = [[4, 9], [14, 19]];
    [-1, 1].forEach((s, gi) => { const g = new THREE.Group(); g.position.set(s * (PA - 0.15), 0, 0); g.rotation.y = s * Math.PI / 2; G.add(g); const m = Lm({ map: marbleTex() });
      add(BOX, new THREE.MeshBasicMaterial({ color: '#120d09' }), 0, 2.7, 0.3, g).scale.set(5.4, 5.4, 0.3);
      for (let k = -2; k <= 2; k++) add(BOX, iron, k * 1.05, 2.6, -0.05, g).scale.set(0.16, 5.2, 0.16); for (let k = 0; k < 5; k++) add(BOX, iron, 0, 0.6 + k * 1.15, -0.05, g).scale.set(5.2, 0.13, 0.13);
      for (let k = -2; k <= 2; k++) { const sp = add(kCone(), iron, k * 1.05, 0.15, -0.05, g); sp.scale.set(0.12, 0.3, 0.12); sp.rotation.x = Math.PI; }
      const ar = add(kg('duGateArch2', () => new THREE.TorusGeometry(3.0, 0.42, 10, 24, Math.PI)), m, 0, 4.4, -0.15, g); ar.scale.set(1, 0.55, 1);
      for (const x of [-4.1, 4.1]) { add(kLathe('duGateCol', [[0, 0], [0.62, 0], [0.62, 0.3], [0.5, 0.45], [0.46, 6.6], [0.55, 6.75], [0.75, 7.0], [0.75, 7.25], [0, 7.25]], 14), m, x, 0, -0.55, g); const t = emTorchProp(new THREE.Group()); t.parent.position.set(x * 0.78, 4.2, -0.9); g.add(t.parent); t.parent.rotation.x = -0.9; SC.fires.push({ fl: t.userData.fl, gl: t.userData.gl, ph: x + gi * 3, torch: 1 }); }
      add(rboxGeo(10.2, 1.3, 1.8, 0.1), m, 0, 7.9, -0.55, g); add(rboxGeo(10.8, 0.35, 2.2, 0.08), m, 0, 8.7, -0.55, g);
      const ins = label(gi ? 'PORTA TRIVMPHALIS' : 'PORTA LIBITINENSIS', { size: 0.62, color: '#8a6a2a', weight: 900 }); ins.position.set(0, 7.9, -1.5); g.add(ins);
      LEG4[gi].forEach((c, k) => { const st = goldStatue(c, (k ? 2.4 : -2.4), 8.9, -0.6, Math.PI + (k ? -0.25 : 0.25)); g.add(st); add(rboxGeo(1.8, 0.4, 1.8, 0.08), m, k ? 2.4 : -2.4, 8.9, -0.6, g); });
    });
    /* the emperor's box (north) and the box of the games' giver opposite */
    const box = (z, big) => { const EB = new THREE.Group(); EB.position.set(0, 6.0, z); EB.rotation.y = z < 0 ? 0 : Math.PI; G.add(EB); const m = Lm({ map: marbleTex() }), pur = Lm({ color: big ? '#5b21b6' : '#f5f1e6' }), W = big ? 9 : 6;
      add(rboxGeo(W * 2, 0.6, 7, 0.1), m, 0, 0, -2.6, EB); add(rboxGeo(W * 2 - 0.4, 1.2, 0.35, 0.08), pur, 0, 0.9, 0.55, EB); add(BOX, gold, 0, 1.55, 0.6, EB).scale.set(W * 2 - 0.2, 0.14, 0.45);
      for (let k = 0; k < (big ? 6 : 4); k++) { const x = -W + 1 + k * (2 * W - 2) / ((big ? 6 : 4) - 1); add(kLathe('duEbCol2', [[0, 0], [0.4, 0], [0.4, 0.2], [0.3, 0.3], [0.27, 6.2], [0.34, 6.3], [0.48, 6.5], [0.48, 6.65], [0, 6.65]], 12), m, x, 0.3, 0.4, EB); }
      add(rboxGeo(W * 2 + 0.6, 0.9, 1.4, 0.08), m, 0, 7.4, 0.3, EB); const ped = add(kg('duPed' + W, () => { const sh = new THREE.Shape(); sh.moveTo(-W - 0.3, 0); sh.lineTo(W + 0.3, 0); sh.lineTo(0, big ? 3.2 : 2.2); sh.closePath(); return new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false }); }), m, 0, 7.85, -0.3, EB);
      const can = add(kg('duCan' + W, () => { const q = new THREE.PlaneGeometry(W * 2, 6.6, 16, 1); const p = q.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.35 * Math.abs(Math.sin((p.getX(i) / (W * 2) + 0.5) * Math.PI * 8))); q.computeVertexNormals(); q.rotateX(-Math.PI / 2); return q; }), Lm({ map: sailTex(), side: THREE.DoubleSide }), 0, 6.95, -2.8, EB);
      for (const x of [-W + 0.3, W - 0.3]) { const dr = add(kg('duDrape', () => { const q = new THREE.PlaneGeometry(1.4, 6, 4, 1); const p = q.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.18 * Math.sin(p.getX(i) * 7)); q.computeVertexNormals(); return q; }), big ? Lm({ color: '#6d28d9', side: THREE.DoubleSide }) : Lm({ color: '#fef3c7', side: THREE.DoubleSide }), x, 3.6, 0.65, EB); }
      const ban = add(kg('duEbBan2', () => new THREE.PlaneGeometry(2.6, 6.2)), Lm({ map: bannerTex(big ? 0 : 3), side: THREE.DoubleSide }), 0, -3.4, 0.75, EB);
      if (big) { const eg = add(ovShape('duEagleS', [[0, 0.9], [0.35, 0.45], [1.2, 0.75], [0.8, 0.2], [1.1, 0.0], [0.35, 0.05], [0.25, -0.6], [0, -0.45], [-0.25, -0.6], [-0.35, 0.05], [-1.1, 0.0], [-0.8, 0.2], [-1.2, 0.75], [-0.35, 0.45]], 0.12, 0.03), gold, 0, 10.9, 0.5, EB); eg.scale.setScalar(1.6);
        const th = add(rboxGeo(2.4, 2.6, 1.6, 0.2), gold, 0, 1.6, -2.6, EB); const emp = makeAvatar([0, 7, 5, 0, 17, 0, 0, 0, 0, 0, 1, 0], '', true); scene.remove(emp.shadow); emWreath(emp.head); emp.g.position.set(0, 0.3, -2.0); emp.g.rotation.y = Math.PI; EB.add(emp.g);
        emp.legL.rotation.x = emp.legR.rotation.x = 1.4; if (emp.knL) emp.knL.rotation.x = emp.knR.rotation.x = -1.4; emp.g.position.y = -0.6; emp.g.position.z = -2.3; emp.armR.rotation.x = 0.6; EB.remove(emp.g); EB.add(bake(emp.g));
        for (const x of [-6, 6]) { const gd = makeAvatar([1, 0, 0, 0, 17, 0, 0, 0, 0, 0, DUEL_BT + 3, DUEL_AN + 3], '', true); scene.remove(gd.shadow); gd.g.position.set(x, 0.3, -1.4); gd.g.rotation.y = Math.PI; EB.add(gd.g); for (let k = 0; k < 25; k++) animateAvatar(gd, 0.1, false, false); EB.remove(gd.g); EB.add(bake(gd.g)); } } };
    box(-(PB + 0.6), true); box(PB + 0.6, false);
    /* braziers along the podium; the four empires' banners hanging over its face */
    const banM = [0, 1, 2, 3].map((e) => Lm({ map: bannerTex(e), side: THREE.DoubleSide, transparent: true, alphaTest: 0.3 }));
    const BG = kg('duBanG2', () => { const q = new THREE.PlaneGeometry(1.9, 6.4, 1, 8); q.translate(0, -3.2, 0); return q; });
    ellPts(PA, PB, 28, 0.15, 0.25).forEach((p, k) => { if (!gap(p) || (Math.abs(p.z) > PB - 2 && Math.abs(p.x) < 13)) return;
      if (k % 2 === 0) { const h = new THREE.Group(); h.position.set(p.x, 6.75, p.z); h.rotation.y = p.ry + Math.PI; G.add(h); const b = add(BG, banM[(k / 2) % 4], 0, 0, -0.05, h); SC.banners.push({ h, ph: k }); }
      else { const bz = new THREE.Group(); bz.position.set(p.x + p.nx * 0.9, 6.0, p.z + p.nz * 0.9); G.add(bz); for (let q = 0; q < 3; q++) { const leg = add(kCyl(), bronze, Math.cos(q * 2.1) * 0.35, 0.8, Math.sin(q * 2.1) * 0.35, bz); leg.scale.set(0.07, 1.7, 0.07); leg.rotation.set(Math.sin(q * 2.1) * 0.25, 0, -Math.cos(q * 2.1) * 0.25); }
        add(kLathe('duBowl', [[0.1, 0], [0.8, 0.35], [1.05, 0.75], [1.12, 0.85], [0.95, 0.8], [0.1, 0.4]], 18), bronze, 0, 1.55, 0, bz);
        const fl = [0, 1, 2, 3].map((j) => { const f = emSprite(bz, fxTex('flame'), 1.3, { blending: THREE.AdditiveBlending }); f.position.set(Math.cos(j * 1.6) * 0.3, 2.7, Math.sin(j * 1.6) * 0.3); return f; }); const gl = kitGlow(bz, '#fb923c', 5, 0.5); gl.position.y = 2.6; SC.fires.push({ fl, gl, ph: k, bz }); } });
    /* outside: a paved piazza round it, cypresses and pines, the triumphal arch on the road to the ludus */
    add(kg('duPiazza', () => { const q = new THREE.RingGeometry(0.98, 1.3, 128, 1); q.rotateX(-Math.PI / 2); return q; }), Lm({ map: paveTex(), color: '#e6dcc6' }), 0, 0.005, 0).scale.set(FA, 1, FB);
    const trees = []; for (const p of ellPts(FA * 1.36, FB * 1.36, 46, 0, 0.3)) if (!(p.z > 0 && Math.abs(p.x) < 14)) trees.push(p);
    inst(kg('duCypress', () => { const q = new THREE.ConeGeometry(1.6, 11, 9); q.translate(0, 7, 0); return q; }), Lm({ color: '#2f4f2a' }), trees, (p, i) => [p.x, 0, p.z, i, 1, 0.8 + (i % 5) * 0.12, 1]);
    inst(kg('duTrunk', () => { const q = new THREE.CylinderGeometry(0.25, 0.32, 2, 6); q.translate(0, 1, 0); return q; }), Lm({ color: '#5b4126' }), trees, (p) => [p.x, 0, p.z, 0, 1, 1, 1]);
    const TA = new THREE.Group(); TA.position.set(0, 0, (FB + LOBBY.z0) / 2 + 2); G.add(TA); const tm = Lm({ map: marbleTex() });
    for (const x of [-7.5, 7.5]) { add(rboxGeo(5, 13, 4, 0.1), tm, x, 6.5, 0, TA); for (const xx of [-1.7, 1.7]) add(kLathe('duTACol', [[0, 0], [0.45, 0], [0.45, 0.3], [0.36, 0.45], [0.33, 9.4], [0.42, 9.55], [0.58, 9.8], [0, 9.8]], 12), tm, x + xx, 1.2, -2.3, TA); }
    add(rboxGeo(20, 3.4, 4.4, 0.1), tm, 0, 14.7, 0, TA); add(rboxGeo(20.6, 0.5, 4.8, 0.08), tm, 0, 13.2, 0, TA); const ta = add(kg('duTAArch', () => new THREE.TorusGeometry(5, 0.5, 8, 20, Math.PI)), tm, 0, 8, -2, TA); ta.scale.set(1, 0.9, 1);
    const tl = label('SENATVS POPVLVSQVE ROMANVS', { size: 0.8, color: '#7a5a1a', weight: 900 }); tl.position.set(0, 14.9, -2.3); TA.add(tl);
    for (const [c, x] of [[4, -6], [19, 6]]) { const st = goldStatue(c, x, 16.4, 0, Math.PI, 1.0); TA.add(st); }
    /* life: birds wheeling high over it; motes of dust drifting in the sun over the sand */
    for (let k = 0; k < 9; k++) { const b = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: '#2b2b2b', side: THREE.DoubleSide }); for (const s of [-1, 1]) { const w = new THREE.Mesh(kg('duWing', () => { const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.4, 0, 0, 0.3, 2.2, 0.2, 0.1], 3)); q.computeVertexNormals(); return q; }), m); w.scale.x = s; b.add(w); b.userData['w' + s] = w; }
      b.userData.r = 40 + rnd() * 60; b.userData.h = 62 + rnd() * 30; b.userData.sp = (0.08 + rnd() * 0.08) * (rnd() < 0.5 ? 1 : -1); b.userData.a = rnd() * 7; G.add(b); SC.birds.push(b); }
    const mp = new Float32Array(240 * 3); for (let k = 0; k < 240; k++) { mp[k * 3] = (rnd() - 0.5) * 2 * A0; mp[k * 3 + 1] = 1 + rnd() * 16; mp[k * 3 + 2] = (rnd() - 0.5) * 2 * B0; }
    const motes = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(mp, 3)), new THREE.PointsMaterial({ map: glowTex(), color: '#fff1c4', size: 0.45, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); G.add(motes); SC.motes = motes;
    return G;
  }
  // the scenery's moving parts, every frame
  function sceneryTick(t, dt) {
    if (SC.win && SC.win.g.visible) { hemiL.intensity = 0.62; sunL.intensity = 0.36; } // (the forest's own light, whatever the graphics setting does)
    if (SC.win && SC.win.g.visible && SC.win.snow.visible) { const W2 = SC.win, p = W2.snow.geometry.attributes.position, A = p.array, cx = camera.position.x, cz = camera.position.z; for (let k = 0; k < W2.N; k++) { A[k * 3 + 1] -= dt * (3 + (k % 5)); A[k * 3] += Math.sin(t * 0.7 + k) * dt * 0.8; if (A[k * 3 + 1] < 0) A[k * 3 + 1] += 40; } p.needsUpdate = true; W2.snow.position.set(Math.round(cx / 60) * 60, 0, Math.round(cz / 60) * 60); } // (❄️ snow in the winter forest)
    for (const f of SC.fires) { f.fl.forEach((s, j) => { const k = 1 + 0.22 * Math.sin(t * (13 + j * 4) + f.ph + j); s.scale.set((f.torch ? 0.65 : 1.0) * k, (f.torch ? 1.3 : 2.1) * k, 1); }); f.gl.material.opacity = 0.42 + 0.12 * Math.sin(t * 11 + f.ph);
      if (f.bz && Math.random() < dt * 3) { const e = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#fdba74', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); const p = f.bz.position; e.position.set(p.x + (Math.random() - 0.5), p.y + 2.8, p.z + (Math.random() - 0.5)); e.scale.setScalar(0.18);
        e.userData = { v: new THREE.Vector3((Math.random() - 0.5) * 1.5, 3 + Math.random() * 2, (Math.random() - 0.5) * 1.5), life: 1.6, g: -0.5, spinless: 1, tick: (o, u) => { o.material.opacity = Math.min(1, u.life); } }; scene.add(e); bits.push(e); } }
    for (const b of SC.banners) b.h.rotation.x = 0.04 * Math.sin(t * 1.3 + b.ph) + 0.03 * Math.sin(t * 2.9 + b.ph * 2);
    for (const b of SC.birds) { const u = b.userData; u.a += u.sp * dt; b.position.set(Math.cos(u.a) * u.r, u.h + Math.sin(t * 0.5 + u.r) * 3, Math.sin(u.a) * u.r); b.rotation.y = -u.a + (u.sp > 0 ? 0 : Math.PI); const fl = Math.sin(t * (6 + u.r * 0.05) + u.r) * 0.6; u['w-1'].rotation.z = -fl; u['w1'].rotation.z = fl; }
    if (SC.motes) { const p = SC.motes.geometry.attributes.position; for (let k = 0; k < p.count; k++) { let y = p.getY(k) + dt * 0.35, x = p.getX(k) + Math.sin(t * 0.3 + k) * dt * 0.4; if (y > 18) y = 1; p.setXY(k, x, y); } p.needsUpdate = true; SC.motes.material.opacity = 0.4 + 0.15 * Math.sin(t * 0.7); }
  }
  // rose petals thrown down from the seats for a winner
  function petals(x, z, n = 40) { if (FXQ.lite) n = Math.ceil(n / 4);
    for (let k = 0; k < n; k++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: Math.random() < 0.6 ? '#f43f5e' : Math.random() < 0.5 ? '#fda4af' : '#fef3c7', transparent: true, depthWrite: false })); m.position.set(x + (Math.random() - 0.5) * 18, 14 + Math.random() * 10, z + (Math.random() - 0.5) * 18); m.scale.set(0.35, 0.22, 1);
      const w = Math.random() * 6; m.userData = { v: new THREE.Vector3((Math.random() - 0.5) * 2, -3 - Math.random() * 2, (Math.random() - 0.5) * 2), life: 5, g: 0, spinless: 1, tick: (o, u) => { o.position.x += Math.sin(u.life * 3 + w) * 0.03; if (o.position.y < 0.15) { o.position.y = 0.15; u.v.set(0, 0, 0); } o.material.opacity = Math.min(1, u.life); } }; scene.add(m); bits.push(m); }
  }
  // a crate for a shrine: a chest in its empire's colours, bound in metal, its emblem on the front, light in its seams
  function crateModel(e) {
    const g = new THREE.Group(), [c1, c2] = [['#7f1d1d', '#e8b84a'], ['#1e3a8a', '#e2e8f0'], ['#374151', '#93c5fd'], ['#450a0a', '#fca5a5'], ['#14532d', '#f87171'], ['#78350f', '#7dd3fc'], ['#1e3a8a', '#e7d3a1']][e] || [EMP[e].c1, EMP[e].c2];
    const wood = new THREE.MeshLambertMaterial({ color: c1, map: woodTex() }), band = metalMat(e === 1 || e === 2 ? '#cbd5e1' : '#e8b84a', { shininess: 110 }), glow = new THREE.MeshBasicMaterial({ color: c2 });
    const add = (geo, m, x, y, z, sx, sy, sz) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); g.add(o); return o; };
    add(rboxGeo(3, 2, 2.2, 0.12), wood, 0, 1, 0, 1, 1, 1); const lid = add(kg('duLid', () => { const q = new THREE.CylinderGeometry(1.1, 1.1, 3, 20, 1, false, 0, Math.PI); q.rotateZ(Math.PI / 2); return q; }), wood, 0, 2, 0, 1, 0.55, 1);
    for (const x of [-1.2, 0, 1.2]) { add(BOX, band, x, 1, 0, 0.18, 2.06, 2.28); } add(BOX, glow, 0, 2.02, 0, 3.02, 0.05, 2.24);
    const em = add(kg('duEmb', () => new THREE.CircleGeometry(0.5, 24)), new THREE.MeshBasicMaterial({ map: kCanvas('duEmbT' + e, 128, 128, (q) => { q.fillStyle = c2; q.beginPath(); q.arc(64, 64, 62, 0, 7); q.fill(); q.font = 'bold 76px serif'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(EMP[e].e, 64, 70); }) }), 0, 1.15, -1.12, 1, 1, 1); em.rotation.y = Math.PI;
    const gl = kitGlow(g, c2, 6, 0.35); gl.position.y = 1.6; g.userData.gl = gl; return g;
  }
  /* ❄️ the winter forest, where the Wendigo is fought (built the first time, then kept): a clearing of snow under a night sky
     and a pale moon; tall snow-laden pines and dead trees all round, fading into a freezing fog; a frozen pond, an old
     hunter's cabin, rocks, and the bones and antlers of what it's eaten in the snow; snow falling. The Colosseum and the
     courtyard are hidden while you're here (its unseen walls stay: the clearing is the arena) */
  function buildWinter() {
    const G = new THREE.Group(); place.add(G); const r = mulberry(4407), Lm = (o) => new THREE.MeshLambertMaterial(Object.assign({ color: '#ffffff' }, o || {}));
    const add = (geo, m, x = 0, y = 0, z = 0, par = G) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); par.add(o); return o; };
    const inst = (geo, mat, list) => { const im = new THREE.InstancedMesh(geo, mat, list.length), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S3 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
      list.forEach(([x, y, z, ry, sx, sy, sz], i) => { Q.setFromAxisAngle(up, ry); V.set(x, y, z); S3.set(sx, sy, sz); M4.compose(V, Q, S3); im.setMatrixAt(i, M4); }); im.instanceMatrix.needsUpdate = true; G.add(im); return im; };
    const snowT = kCanvas('duSnowT', 256, 256, (g, q) => { g.fillStyle = '#e9eff6'; g.fillRect(0, 0, 256, 256); for (let k = 0; k < 2600; k++) { const v = 215 + q() * 40; g.fillStyle = `rgba(${v - 12},${v - 4},${v + 8},.35)`; g.fillRect(q() * 256, q() * 256, 1 + q() * 2.5, 1 + q() * 2.5); }
      g.strokeStyle = 'rgba(150,170,200,.16)'; g.lineWidth = 2; for (let k = 0; k < 46; k++) { g.beginPath(); g.ellipse(q() * 256, q() * 256, 10 + q() * 34, 3 + q() * 9, q() * 3, 0, 7); g.stroke(); } }); snowT.repeat.set(36, 36);
    add(kg('duWinG', () => { const q = new THREE.CircleGeometry(1, 72); q.rotateX(-Math.PI / 2); return q; }), Lm({ map: snowT, color: '#eef3fa' }), 0, 0.05, 0).scale.set(330, 1, 330); // (the snow)
    const out = (minE, maxE) => { for (let g = 0; g < 50; g++) { const a = r() * Math.PI * 2, k = minE + r() * (maxE - minE); const x = Math.cos(a) * (A0 * k), z = Math.sin(a) * (B0 * k); if (isFloor(x, z) > minE * minE) return [x, z]; } return [Math.cos(r() * 7) * A0 * maxE, B0 * maxE]; };
    // pines: a trunk, three tiers of needles, snow on each
    const P = []; for (let k = 0; k < 190; k++) { const [x, z] = out(1.28, 4.2), sc = 0.75 + r() * 0.75; P.push([x, z, sc, r() * 6.28]); }
    inst(kCyl(), Lm({ color: '#3b2a1e' }), P.map(([x, z, s3, ry]) => [x, 2.2 * s3, z, ry, 0.65 * s3, 4.4 * s3, 0.65 * s3]));
    [[4.6, 6.5, 4.2, '#1f3b2c'], [3.6, 5.6, 8.0, '#24452f'], [2.4, 4.6, 11.4, '#2b5136']].forEach(([rad, h, y, c], tier) => {
      inst(kCone(), Lm({ color: c }), P.map(([x, z, s3, ry]) => [x, y * s3, z, ry + tier, rad * s3, h * s3, rad * s3]));
      inst(kCone(), Lm({ color: '#f4f8fc' }), P.map(([x, z, s3, ry]) => [x, (y + h * 0.18) * s3, z, ry + tier, rad * 0.82 * s3, h * 0.62 * s3, rad * 0.82 * s3])); });
    // drifts along the clearing's edge, rocks capped with snow
    inst(kSph(), Lm({ color: '#f1f5fa' }), Array.from({ length: 70 }, (_, k) => { const a = (k / 70) * Math.PI * 2 + r() * 0.05, e = 1.08 + r() * 0.12; return [Math.cos(a) * A0 * e, 0.1, Math.sin(a) * B0 * e, r() * 6, 3 + r() * 4, 0.9 + r() * 1.3, 2 + r() * 3]; }));
    const rk = Array.from({ length: 26 }, () => { const [x, z] = out(1.12, 2.4), s3 = 0.8 + r() * 2.2; return [x, s3 * 0.5, z, r() * 6, s3 * 1.3, s3, s3 * 1.1]; });
    inst(kg('duRock', () => new THREE.DodecahedronGeometry(1, 0)), Lm({ color: '#59606b' }), rk); inst(kg('duRockC', () => new THREE.DodecahedronGeometry(1, 0)), Lm({ color: '#f4f8fc' }), rk.map(([x, y, z, ry, sx, sy, sz]) => [x, y + sy * 0.45, z, ry, sx * 0.85, sy * 0.4, sz * 0.85]));
    // dead trees, bare and black: baked into a few meshes
    const dg = new THREE.Group(), bark = Lm({ color: '#2a211b' }); for (let k = 0; k < 16; k++) { const [x, z] = out(1.18, 2.6), h = 9 + r() * 9, t = add(kCyl(), bark, x, h / 2, z, dg); t.scale.set(0.38, h, 0.38); t.rotation.z = (r() - 0.5) * 0.12;
      for (let b = 0; b < 4; b++) { const br = add(kCyl(), bark, x, h * (0.45 + b * 0.13), z, dg), a = r() * 6.28, l = 2.5 + r() * 3.5; br.scale.set(0.14, l, 0.14); br.rotation.set(0, a, 0.9 + r() * 0.5); br.position.x += Math.cos(a) * l * 0.35; br.position.z -= Math.sin(a) * l * 0.35; } }
    // the old hunter's cabin, its door hanging open; the frozen pond
    const cab = new THREE.Group(); cab.position.set(-A0 - 20, 0, 14); cab.rotation.y = 1.2; dg.add(cab); const lg = Lm({ color: '#5a4030', map: woodTex() });
    add(BOX, lg, 0, 3, 0, cab).scale.set(11, 6, 8); add(BOX, Lm({ color: '#0b0d12' }), -1.5, 2.2, -4.01, cab).scale.set(1.8, 3.6, 0.1); add(BOX, Lm({ color: '#141821' }), 2.6, 3.4, -4.01, cab).scale.set(1.6, 1.4, 0.1);
    for (const s2 of [-1, 1]) { const rf = add(BOX, Lm({ color: '#f4f8fc' }), 0, 7.1, s2 * 2.2, cab); rf.scale.set(12, 0.5, 5.4); rf.rotation.x = s2 * 0.55; }
    // bones and antlers in the clearing (just looks — nothing to trip on)
    const bone = Lm({ color: '#e9e4d6' }); for (let k = 0; k < 9; k++) { const a = r() * 6.28, e = 0.35 + r() * 0.55, x = Math.cos(a) * A0 * e, z = Math.sin(a) * B0 * e;
      if (k % 3 === 0) { for (const s2 of [-1, 1]) { const an = add(kg('duAntler' + s2, () => sweepGeo([[0, 0, 0], [s2 * 0.5, 0.5, 0.1], [s2 * 1.1, 0.9, 0.05], [s2 * 1.6, 1.5, -0.2]], (t) => 0.12 * (1 - t * 0.6), 12, 6)), bone, x + s2 * 0.3, 0.15, z, dg); an.rotation.set(-1.2, a, 0); } }
      else { const b = add(kCyl(), bone, x, 0.18, z, dg); b.scale.set(0.12, 1.4 + r(), 0.12); b.rotation.set(Math.PI / 2, a, 0); add(kSph(), bone, x + Math.sin(a) * 0.8, 0.2, z + Math.cos(a) * 0.8, dg).scale.setScalar(0.2); } }
    G.add(bake(dg));
    const pond = add(kg('duPond', () => { const q = new THREE.CircleGeometry(1, 40); q.rotateX(-Math.PI / 2); return q; }), new THREE.MeshPhongMaterial({ color: '#a5c8e4', shininess: 140, specular: '#ffffff', transparent: true, opacity: 0.9 }), A0 + 16, 0.08, -18); pond.scale.set(16, 1, 10);
    // the moon (above the fog), and the snow falling round you
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#dbe7ff', transparent: true, depthWrite: false, fog: false, opacity: 0.9 })); moon.scale.setScalar(70); moon.position.set(-160, 170, -240); G.add(moon);
    const md = new THREE.Mesh(kg('duMoonD', () => new THREE.CircleGeometry(14, 40)), new THREE.MeshBasicMaterial({ color: '#f1f5ff', fog: false })); md.position.copy(moon.position); md.lookAt(0, 0, 0); G.add(md);
    const N = 1600, pos = new Float32Array(N * 3); for (let k = 0; k < N; k++) { pos[k * 3] = (r() - 0.5) * 120; pos[k * 3 + 1] = r() * 40; pos[k * 3 + 2] = (r() - 0.5) * 120; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 0.45, transparent: true, opacity: 0.9, depthWrite: false, map: glowTex(), alphaTest: 0.02 })); snow.frustumCulled = false; G.add(snow);
    G.visible = false; return { g: G, snow, N };
  }
  function buildLobby() {
    const G = new THREE.Group(); place.add(G); const L = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {})), add = (geo, m, x = 0, y = 0, z = 0, par = G) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); par.add(o); return o; };
    const marble = L('#ece4d3'), trav = L('#d8c9a8'), gold = metalMat('#e8b84a', { specular: '#fff2c0' }), bronze = metalMat('#b8763a', { shininess: 90 }), zc = (LOBBY.z0 + LOBBY.z1) / 2, W = LOBBY.x * 2, D = LOBBY.z1 - LOBBY.z0;
    // the ground all round and the road to the Colosseum's gate
    const gr = add(kg('duGroundG', () => { const q = new THREE.PlaneGeometry(1, 1); q.rotateX(-Math.PI / 2); return q; }), L('#ffffff', { map: groundTex() }), 0, -0.04, 50); gr.scale.set(280, 1, 300); gr.material.map.repeat.set(16, 18);
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
      const glow = add(kg('duPadGlow', () => { const q = new THREE.RingGeometry(5.9, 6.6, 48); q.rotateX(-Math.PI / 2); return q; }), new THREE.MeshBasicMaterial({ color: ['#f59e0b', '#ef4444', '#a855f7'][i], transparent: true, opacity: 0.6, depthWrite: false }), 0, 0.07, 0, g);
      for (const x of [-6.6, 6.6]) { add(kg('duPadPost', () => new THREE.CylinderGeometry(0.35, 0.4, 7, 10)), marble, x, 3.5, 0, g); const f = emSprite(g, fxTex('flame'), 1.6, { blending: THREE.AdditiveBlending }); f.position.set(x, 7.9, 0); add(kLathe('duBowl', [[0.1, 0], [0.8, 0.35], [1.05, 0.75], [1.12, 0.85], [0.95, 0.8], [0.1, 0.4]], 18), bronze, x, 7, 0, g).scale.setScalar(0.7); }
      const lb = label(p.n, { size: 2.2, color: '#fff' }); lb.position.set(0, 9.6, 0); g.add(lb); const sb = label(p.s, { size: 1.1, color: '#fde68a' }); sb.position.set(0, 8.2, 0); g.add(sb);
      return { g, glow, ring: r }; });
    // the crate shrines
    SC.crates = SHRINES.map((s) => { const g = new THREE.Group(); g.position.set(s.x, 0, s.z); G.add(g); const pd = part({ x: s.x, y: 1.2, z: s.z, sx: 5, sy: 2.4, sz: 5, c: 0xd8c9a8 }); pd.m.material = trav;
      add(BOX, marble, 0, 2.5, 0, g).scale.set(5.6, 0.3, 5.6); const c = crateModel(s.e); c.position.y = 3.6; g.add(c);
      const lb = label(`${EMP[s.e].e} ${EMP[s.e].sn.toUpperCase()} CRATE`, { size: 1.35, color: '#fff' }); lb.position.set(0, 9.2, 0); g.add(lb); const pl = label(`🥇 ${CRATE_GOLD} · 🪙 ${CRATE_PRICE}`, { size: 1.0, color: '#fde68a' }); pl.position.set(0, 8, 0); g.add(pl);
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
    // 🛒 the Limited Shop: a merchant's stall behind the shrines — posts, a striped awning, a counter with a cloth, a chest of coins — and the week's three fighters standing on it
    { const sh = new THREE.Group(); sh.position.set(SHOP.x, 0, SHOP.z); sh.rotation.y = Math.atan2(SHOP.x, SHOP.z - 124); G.add(sh); const wd = L('#6b4423', { map: woodTex() });
      const aw = L('#ffffff', { map: kCanvas('duAwning', 128, 32, (g) => { for (let x = 0; x < 128; x += 16) { g.fillStyle = (x / 16) % 2 ? '#fde68a' : '#b91c1c'; g.fillRect(x, 0, 16, 32); } g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 26, 128, 6); }) });
      for (const x of [-4.2, 4.2]) for (const z of [-2.2, 2.2]) add(BOX, wd, x, 2.7, z, sh).scale.set(0.35, 5.4, 0.35); // (posts)
      const awn = add(BOX, aw, 0, 5.75, 0.3, sh); awn.scale.set(9.6, 0.16, 5.8); awn.rotation.x = -0.12; for (let k = 0; k < 9; k++) add(kCone(), L(k % 2 ? '#fde68a' : '#b91c1c'), -4.3 + k * 1.075, 5.2, -2.65, sh).scale.set(0.5, 0.5, 0.12); // (the awning, scalloped)
      add(BOX, wd, 0, 1.15, -1.6, sh).scale.set(8.6, 2.3, 1.3); add(BOX, L('#5b21b6', { map: plushTex() }), 0, 2.36, -1.6, sh).scale.set(8.8, 0.12, 1.5); add(BOX, L('#5b21b6', { map: plushTex() }), 0, 1.7, -2.36, sh).scale.set(8.8, 1.3, 0.06); // (the counter, a purple cloth)
      const ch = add(BOX, L('#7c4a1e', { map: woodTex() }), 3.6, 0.5, 1.2, sh); ch.scale.set(1.4, 1, 1); for (let k = 0; k < 6; k++) add(kCyl(), metalMat('#e8b84a', { shininess: 140 }), 3.2 + (k % 3) * 0.35, 1.05 + Math.floor(k / 3) * 0.1, 1.0 + (k % 2) * 0.3, sh).scale.set(0.22, 0.05, 0.22); // (a chest of coins)
      limShop().forEach((c, k) => { const x = [0, -2.9, 2.9][k], col = CH[c].r === 4 ? '#fb7185' : '#fbbf24'; add(kCyl(), new THREE.MeshBasicMaterial({ color: col }), x, 2.45, -1.6, sh).scale.set(1.0, 0.06, 0.7);
        const a = makeAvatar([1, 0, 0, 0, 17, 0, 0, 0, 0, 0, 23 + c, 15 + c], '', true); scene.remove(a.shadow); a.g.position.set(x, 2.5, -1.6); a.g.scale.setScalar(k ? 0.42 : 0.5); sh.add(a.g); for (let n = 0; n < 25; n++) animateAvatar(a, 0.1, false, false); sh.remove(a.g); sh.add(bake(a.g)); });
      const lb4 = label('🛒 LIMITED SHOP', { size: 1.8, color: '#fde68a' }); lb4.position.set(SHOP.x, 8.4, SHOP.z); G.add(lb4); const lb5 = label('⏳ new fighters every Monday', { size: 0.8, color: '#e9d5ff' }); lb5.position.set(SHOP.x, 7.2, SHOP.z); G.add(lb5); }
    // the four legends on plinths at the corners, in their guard
    { const x = 0, z = 95 + LZ, pd = part({ x, y: 1, z, sx: 6, sy: 2, sz: 4.5, c: 0x9ca3af }); pd.m.material = L('#8b8f99', { map: travTex() });
      const a = makeAvatar([5, 0, 0, 0, 17, 0, 0, 0, 0, 0, LAE_BOSS_BT, DUEL_AN + LAE], '', true); scene.remove(a.shadow); a.g.position.set(x, 2, z); a.g.rotation.y = Math.PI; a.g.scale.setScalar(1.8); G.add(a.g); for (let k = 0; k < 25; k++) animateAvatar(a, 0.1, false, false); G.remove(a.g); G.add(bake(a.g));
      const lb = label('👹 THE LAESTRYGONIAN', { size: 1.3, color: '#fca5a5' }); lb.position.set(x, 17, z); G.add(lb); }
    SC.legends = [[4, -41, 151], [9, 41, 151], [14, -41, 97], [19, 41, 97]].map(([c, x, z]) => [c, x, z + LZ, angOf(-x, 124 - z)]).map(([c, x, z, ry]) => { const pd = part({ x, y: 1.5, z, sx: 4, sy: 3, sz: 4, c: 0xece4d3 }); pd.m.material = marble;
      const a = makeAvatar([1, 0, 0, 0, 17, 0, 0, 0, 0, 0, 23 + c, 15 + c], '', true); scene.remove(a.shadow); a.g.position.set(x, 3, z); a.g.rotation.y = ry; G.add(a.g); for (let k = 0; k < 25; k++) animateAvatar(a, 0.1, false, false); G.remove(a.g); G.add(bake(a.g));
      const lb = label(`${DUEL_IC[c]} ${DUEL_N[c]}`, { size: 1.1, color: '#fbbf24' }); lb.position.set(x, 11.4, z); G.add(lb); return a; });
    return G;
  }

  /* ---------------- fighting ----------------
     A fighter: whose (me, a bot, or the other player — 'rem', whose numbers come from them), its health and stamina,
     cooldowns, what it's doing (act) and what's been done to it (S: stun, root, slow, the damage-over-time, buffs, the
     dodge's moment of not being hit). Bots and I take hits here; the other player takes the hits I send them. */
  const lerp = (a, b, k) => a + (b - a) * k, ease = (k) => smooth(clamp(k, 0, 1));
  function newFighter(c, kind, o = {}) {
    const C = o.C || CH[c], hm = o.hpM || 1, n = C.ab.length;
    return { c, C, kind, name: o.name || C.n, hp: Math.round(C.hp * hm), mhp: Math.round(C.hp * hm), st: 100, rest: 0, cd: Array(n).fill(0), cdMax: Array(n).fill(1), mode: 0, act: null, blk: false, nx: 0, wishN: 0,
      S: { stun: 0, root: 0, slow: 0, slowM: 1, vuln: 0, ifr: 0, sp: 0, crush: 0, dots: [], buffs: [] }, dmgM: o.dmgM || 1, D: o.D, peer: o.peer || null, x: 0, y: 0, z: 0, yaw: 0, dead: false, acN: 0, kb: null, a: null, deaths: 0 };
  }
  // ♾️ the Wendigo's Self Cannibal, under 10% health: Immortal Being — every blow blocked and 5% of its health back a second for 5 s, but it hits half as hard and half as fast
  const WEN_IMM = { n: 'Immortal Being', ic: '♾️', k: 'buff', cd: 15, an: 'rally', b: { dur: 5, blk: 1, free: 1, hpsP: 0.05, dmgM: 0.5, cdM: 0.5, imm: 1 }, d: 'Under 10% health: every blow blocked, 5% of its health back every second for 5 s — but its blows and attack speed are halved.' };
  /* 🎭 the Skinwalker. Mimic: one of the enemy's abilities, worn for 10 s — ×1.5 the damage and heals (not how long it
     stuns or roots), half the cooldown (never under 0.5 s). Mimic Form: their health (their max, at the share they have
     left), their block (shield and armour) or their passives (speed and the rest) for 30 s. pv/defOf/shOf read a fighter's
     passives, armour and shield through whatever it has copied */
  const PASK = ['spd', 'crit', 'exe', 'rage', 'brute', 'stunP', 'frost', 'lsP', 'wish', 'fireImm', 'aura', 'regen', 'stages'];
  const pv = (F, k) => (F.mimF && F.mimF.k === 'p' && F.mimF.P[k] !== undefined ? F.mimF.P[k] : F.C[k]);
  const defOf = (F) => (F.mimF && F.mimF.k === 'b' ? F.mimF.def : F.C.def), shOf = (F) => (F.mimF && F.mimF.k === 'b' ? F.mimF.sh : F.C.sh);
  function mimicScale(src) { const q = JSON.parse(JSON.stringify(src)), k = 1.5, R = (v) => Math.round(v * k); delete q.modes; delete q.split; delete q.si; delete q.sm;
    if (q.dmg) q.dmg = R(q.dmg); if (q.hits) q.hits = q.hits.map(R); if (q.crush) q.crush = R(q.crush); if (q.then && q.then.dmg) q.then.dmg = R(q.then.dmg);
    if (q.fx) { if (q.fx.bl) q.fx.bl[0] = R(q.fx.bl[0]); if (q.fx.bu) q.fx.bu[0] = R(q.fx.bu[0]); }
    if (q.b) { const b = q.b; if (b.dmgM) b.dmgM = +(1 + (b.dmgM - 1) * k).toFixed(3); if (b.spdM) b.spdM = +(1 + (b.spdM - 1) * k).toFixed(3); if (b.cdM) b.cdM = +(1 + (b.cdM - 1) * k).toFixed(3); if (b.def) b.def = Math.max(0.3, +(1 - (1 - b.def) * k).toFixed(3));
      for (const x of ['heal', 'hps', 'dmgA']) if (b[x]) b[x] = R(b[x]); for (const x of ['ls', 'healP', 'hpsP']) if (b[x]) b[x] = +(b[x] * k).toFixed(3); }
    q.cd = Math.max(0.5, +(q.cd * 0.5).toFixed(2)); q.mim = 1; return q; }
  const mimicOps = (T) => T.C.ab.map((_, k) => Object.assign({}, abOf(T, k), { si: k, sm: T.mode | 0 })).filter((a) => a.k !== 'mimic' && a.k !== 'mimic2');
  const mimicFromNet = (mm) => { const C = CH[mm[0]]; if (!C || !C.ab[mm[1]]) return null; return mimicScale(Object.assign({}, abOf({ C, mode: mm[2] | 0, hp: 1, mhp: 1 }, mm[1]))); };
  const pasOf = (C) => { const P = {}; for (const k of PASK) if (C[k] !== undefined && !(k === 'spd' && C[k] === 1)) P[k] = Array.isArray(C[k]) ? C[k].slice() : C[k]; return P; };
  const MULT = new Set(['def', 'dmgM', 'spdM', 'cdM']), SUM = new Set(['dmgA', 'ls', 'rf', 'hps']);
  function bval(F, k) { let v = MULT.has(k) ? 1 : 0; for (const b of F.S.buffs) { const q = b[k]; if (q == null) continue; if (MULT.has(k)) v *= q; else if (SUM.has(k)) v += q; else v = Math.max(v, q); } return v; }
  function abOf(F, i) { if (i === 1 && F.mim && F.C.skin) return F.mim.ab; const ab = F.C.ab[i]; if (ab.low && F.mhp && F.hp > 0 && F.hp / F.mhp < 0.1) return WEN_IMM; if (ab.modes) { const m = ab.modes[Math.min(F.mode, ab.modes.length - 1)]; return Object.assign({}, ab, m, { k: m.k || 'melee' }); } return ab; }
  // switching between a gun and a blade: with split cooldowns each keeps its own (the gun reloads while you stab)
  function swapMode(F, k) { if (k === F.mode) return; if (F.C.ab[0].split) { F.mcd = F.mcd || []; F.mcd[F.mode] = F.cd[0]; F.cd[0] = F.mcd[k] || 0; F.cdMax[0] = Math.max(F.cd[0], F.C.ab[0].modes[k].cd); } F.mode = k; }
  function actDur(ab) {
    const w = ab.wind || 0;
    switch (ab.k) {
      case 'melee': return w + (ab.an === 'stab' ? 0.55 : ab.an === 'bcleave' ? 0.9 : ab.an === 'overhead' || ab.an === 'smite' ? 0.45 : 0.32);
      case 'multi': case 'combo': return w + ab.gap * (ab.hits.length - 1) + 0.34;
      case 'proj': return w + (ab.cnt > 1 && ab.gap ? ab.gap * (ab.cnt - 1) : 0) + 0.3;
      case 'dash': return w + ab.dd + (ab.then ? 0.45 : 0.25);
      case 'leap': return w + 0.62 + 0.32;
      case 'blink': return w + 0.5;
      case 'volley': return w + 0.45;
      case 'stomp': return w + (ab.an === 'bplant' ? 1.0 : 0.55);
      default: return ab.b && ab.b.blk && !ab.b.free ? ab.b.dur : 0.8;
    }
  }
  const stunned = (F) => F.S.stun > 0 || F.S.pos > 0 || F.S.fear > 0 || F.S.stone > 0; // (stunned, possessed, terrified, or turned to stone)
  const stageOf = (F) => { const f = F.hp / Math.max(1, F.mhp); return f > 0.75 ? 1 : f > 0.5 ? 2 : f > 0.25 ? 3 : 4; }; // (🩸 the Wendigo's wounds: 1 at full health … 4 under a quarter)
  const isBoss = (F) => !!F && (F.kind === 'boss' || F.kind === 'rboss');
  const local = (T) => T.kind === 'me' || T.kind === 'bot' || T.kind === 'boss'; // (the ones whose hits are judged here)
  const bigR = (F) => (F && F.C.big ? (F.C.big - 1) * 2.4 : 0); // (how much further a giant reaches, and is reached)
  /* ---------------- the effects ---------------- */
  function sparks(F, col, n = 8, y = 3.4, o = {}) { if (!F.a || F.a.dead || F.a.g.parent !== scene) return; for (let q = 0; q < n; q++) kitSpark(F.a, F.a.g, (Math.random() - 0.5) * 1.4, y + (Math.random() - 0.5) * 1.2, -0.6 + (Math.random() - 0.5), col, Object.assign({ v: [(Math.random() - 0.5) * 9, 2 + Math.random() * 6, (Math.random() - 0.5) * 9], life: 0.45, s: 0.32, g: 18, j: 2 }, o)); }
  function burstAt(x, y, z, col, s = 3, life = 0.35) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); m.position.set(x, y, z); m.scale.setScalar(s);
    m.userData = { v: new THREE.Vector3(), life, g: 0, spinless: 1, tick: (o, u) => { const k = Math.max(0, u.life / life); o.material.opacity = k; o.scale.setScalar(s * (1.6 - 0.6 * k)); } }; scene.add(m); bits.push(m); }
  function smokeAt(x, y, z, n = 10, col = '#9ca3af', s = 2.2) { if (FXQ.lite) n = Math.ceil(n / 3); for (let q = 0; q < n; q++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: col, transparent: true, depthWrite: false, opacity: 0.8 })); m.position.set(x + (Math.random() - 0.5) * 2, y + Math.random() * 2, z + (Math.random() - 0.5) * 2); const s0 = s * (0.7 + Math.random() * 0.6); m.scale.setScalar(s0);
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
  function floatText(F, text, cls = '') { if (!opt('num') && /^(🛡️ )?\d+$|CRIT \d/.test(text)) return; const p = toScreen(F.x + (Math.random() - 0.5) * 1.5, F.y + 7 + Math.random(), F.z); if (!p) return; const d = document.createElement('div'); d.className = 'du-dmg ' + cls; d.textContent = text; d.style.left = p.x + 'px'; d.style.top = p.y + 'px'; $('#xhud').append(d); setTimeout(() => d.remove(), 950); }
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
  const BUFFLOOK = { ram: ['#e7d3a1'], aquila: ['#fbbf24'], mushin: ['#f43f5e'], testudo: ['#fde68a', 1], aspis: ['#93c5fd', 1], shieldup: ['#93c5fd', 1], berserk: ['#ef4444'], hype: ['#fbbf24'], wrath: ['#38bdf8'], molon: ['#f59e0b', 1], rally: ['#4ade80'], roar: ['#dc2626'], pray: ['#fef3c7'], fortress: ['#cbd5e1', 1], resolve: ['#fda4af'], smoke: ['#6b7280'], benkei: ['#facc15'], bloodrush: ['#dc2626'], sharpen: ['#f97316'], parry: ['#e5e7eb', 1], drum: ['#7dd3fc'], haste: ['#fca5a5'] };
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
    if (F.S.crush && Math.random() < dt * 7) kitSpark(a, a.g, (Math.random() - 0.5) * 1.6, 2 + Math.random() * 4, (Math.random() - 0.5) * 1.2, '#ef4444', { v: [0, 1.5, 0], life: 0.6, s: 0.3, j: 0.4 });
    if (F.S.sp > 0 && Math.random() < dt * 24) kitSpark(a, a.g, (Math.random() - 0.5) * 2.4, Math.random() * 6, (Math.random() - 0.5) * 2.4, '#fde68a', { v: [0, 2, 0], life: 0.5, s: 0.3, j: 0.2 });
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
    twin: [[{ aR: [2.6, 0.2, 0.7], eR: [0.5], aL: [0.8, 0, -0.3], eL: [0.6], bd: [0.1, -0.45, 0] }, { aR: [0.9, 0, -0.8], eR: [0.15], wr: [-0.6], aL: [0.7, 0, -0.4], eL: [0.6], bd: [-0.25, 0.5, 0], lL: [0.4], kL: [-0.4] }],
      [{ aR: [0.9, 0, -0.6], eR: [0.4], aL: [2.4, -0.2, -0.7], eL: [0.5], bd: [0.05, 0.4, 0] }, { aR: [0.8, 0, 0.3], eR: [0.4], aL: [0.9, 0, 0.8], eL: [0.15], bd: [-0.25, -0.5, 0], lR: [0.4], kR: [-0.4] }]], // (the Kensei: katana, then wakizashi)
    storm: [[{ aR: [2.5, 0, 0.8], eR: [0.4], aL: [1.0, 0, -0.6], eL: [0.6], bd: [0, -0.4, 0] }, { aR: [0.8, 0, -0.9], eR: [0.1], wr: [-0.7], aL: [1.1, 0, -0.5], eL: [0.6], bd: [-0.25, 0.5, 0], lL: [0.4], kL: [-0.4] }],
      [{ aR: [0.9, 0, -0.7], eR: [0.5], aL: [2.5, 0, -0.8], eL: [0.4], bd: [0, 0.4, 0] }, { aR: [1.0, 0, -0.5], eR: [0.5], aL: [0.8, 0, 0.9], eL: [0.1], bd: [-0.25, -0.5, 0], lR: [0.4], kR: [-0.4] }],
      [{ aR: [0.5, 0, 0.9], eR: [0.3], aL: [0.9, 0, -0.4], eL: [0.6], bd: [-0.2, -0.3, 0], up: -0.3, kL: [-0.6], kR: [-0.6] }, { aR: [2.4, 0, -0.3], eR: [0.2], wr: [0.4], aL: [1.0, 0, -0.4], eL: [0.5], bd: [0.15, 0.4, 0], up: 0.1 }],
      [{ aR: [1.5, 0, 1.3], eR: [0.2], aL: [1.5, 0, -1.3], eL: [0.2], bd: [0, 0, 0], up: -0.15 }, { aR: [1.5, 0, -0.6], eR: [0.2], wr: [-0.4], aL: [1.5, 0, 0.6], eL: [0.2], bd: [-0.3, 0, 0], up: -0.35, kL: [-0.7], kR: [-0.7] }]], // (both blades, every way)
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
    musket: [{ aR: [1.5, 0.05, 0.12], eR: [0.08], aL: [1.42, 0.45, 0.5], eL: [0.42], bd: [-0.05, -0.35, 0], hd: [0.05, 0.3, 0.12], lL: [0.35], lR: [-0.2] }, { aR: [1.74, 0.05, 0.12], eR: [0.05], aL: [1.66, 0.45, 0.5], eL: [0.38], bd: [0.12, -0.35, 0], hd: [0.12, 0.3, 0.12], lL: [0.3], lR: [-0.2] }], // (to the shoulder, cheek to the stock — and the kick)
    pistol: [{ aR: [1.55, 0.1, 0], eR: [0.05], aL: [0.15, 0, -0.35], eL: [0.3], bd: [0, -0.6, 0], hd: [0, 0.55, 0], lL: [0.25], lR: [-0.15] }, { aR: [1.88, 0.1, 0], eR: [0.05], aL: [0.15, 0, -0.35], eL: [0.3], bd: [0.08, -0.6, 0], hd: [0.05, 0.55, 0] }], // (side-on, arm out, as a duellist stands)
    ram: { aR: [2.3, 0, 0.3], eR: [1.5], aL: [1.15, 0.3, 0.35], eL: [0.9], hd: [-0.25, 0, 0], bd: [-0.05, 0, 0] }, // (ramming a charge home)
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
    aquila: { aL: [2.9, 0, -0.15], eL: [0.05], aR: [0.7, 0, 0.3], eR: [0.9], hd: [0.35], bd: [0.12, 0, 0] }, // (the eagle raised high)
    mushin: { aR: [1.25, 0, -0.55], eR: [0.95], aL: [1.25, 0, 0.55], eL: [0.95], hd: [-0.3], bd: [0.05, 0, 0], up: -0.25, kL: [-0.6], kR: [-0.6] }, // (the blades crossed before him, eyes down: no-mind)
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
    // the Laestrygonian's: the great scimitar swept round, a punch, a stomp; the Executioner's: the beheading stroke
    gslash: [{ aR: [2.5, 0.3, 0.9], eR: [0.5], wr: [-0.8], aL: [1.1, 0, -0.7], eL: [0.6], bd: [0.15, -0.75, 0], hd: [0.15] }, { aR: [1.2, -0.2, -0.9], eR: [0.15], wr: [-0.9], aL: [0.5, 0, -0.4], eL: [0.4], bd: [-0.3, 0.85, 0], lL: [0.5], kL: [-0.45], lR: [-0.3] }],
    punch: [{ aR: [0.9, 0, 0.4], eR: [1.7], aL: [0.8, 0, -0.3], eL: [1.4], bd: [0.05, -0.45, 0] }, { aR: [1.6, 0, 0], eR: [0.05], aL: [0.7, 0, -0.3], eL: [1.5], bd: [-0.3, 0.5, 0], lL: [0.5], kL: [-0.4], lR: [-0.3] }],
    stomp: [{ lR: [1.3], kR: [-1.4], bd: [0.2, 0, 0], aL: [0.5, 0, -0.9], aR: [0.5, 0, 0.9], hd: [0.2], up: 0.15 }, { lR: [0.25], kR: [-0.2], lL: [0.3], kL: [-0.6], bd: [-0.45, 0, 0], aL: [0.7, 0, -1.1], aR: [0.7, 0, 1.1], hd: [-0.2], up: -0.4 }],
    behead: [{ aR: [3.1, 0, 0.15], eR: [1.1], wr: [0.6], aL: [3.0, 0, -0.15], eL: [1.1], bd: [0.35, 0, 0], hd: [0.35], up: 0.1, lL: [0.2], lR: [-0.15] }, { aR: [0.55, 0, 0], eR: [0.05], wr: [-0.8], aL: [0.6, 0, 0], eL: [0.1], bd: [-0.75, 0, 0], hd: [0.4], lL: [0.8], kL: [-1.0], lR: [-0.45], kR: [-0.4], up: -0.5 }], // (the axe raised high behind him in both hands, then down through it)
    xsever: [{ aR: [3.0, 0.1, 0.1], eR: [0.8], wr: [0.3], aL: [2.9, 0.2, -0.1], eL: [0.8], bd: [0.25, 0, 0], hd: [0.15], up: 0.05 }, { aR: [0.7, 0, -0.05], eR: [0.1], wr: [-0.5], aL: [0.75, 0, 0.1], eL: [0.15], bd: [-0.65, 0, 0], hd: [0.3], lL: [0.65], kL: [-0.85], lR: [-0.35], kR: [-0.3], up: -0.4 }], // (Sever: off the shoulder, up over the head, straight down)
    xchop: [{ aR: [2.6, 0.3, 0.9], eR: [0.9], wr: [0.2], aL: [2.0, 0.4, 0.4], eL: [1.0], bd: [0.15, -0.7, 0] }, { aR: [1.1, -0.3, -0.9], eR: [0.15], wr: [-0.6], aL: [1.0, -0.2, -0.5], eL: [0.25], bd: [-0.35, 0.8, 0], lL: [0.55], kL: [-0.5], lR: [-0.3] }], // (Chop: from the shoulder, down across)
    lob: [{ aL: [2.7, 0, -0.3], eL: [1.2], aR: [0.8, 0, 0.3], eR: [0.8], bd: [0.2, 0.5, 0] }, { aL: [1.3, 0, 0], eL: [0.1], aR: [0.6, 0, 0.3], bd: [-0.3, -0.4, 0], lR: [-0.3] }],
    bloodrush: { aR: [0.6, 0, 1.3], eR: [0.4], aL: [0.6, 0, -1.3], eL: [0.4], hd: [0.7], bd: [0.4, 0, 0], up: -0.2 },
    sharpen: { aR: [1.0, 0, -0.3], eR: [1.4], wr: [-1.6], aL: [1.0, 0.3, 0.45], eL: [1.0], hd: [-0.4], bd: [-0.2, 0, 0] },
    parry: { aR: [1.5, 0.3, -0.5], eR: [1.2], wr: [-1.57], aL: [1.4, -0.3, 0.6], eL: [1.2], bd: [-0.1, 0, 0], up: -0.15 },
    drum: { aL: [1.2, 0, 0.6], eL: [1.5], aR: [1.4, 0, -0.4], eR: [1.3], hd: [0.35], bd: [0.1, 0, 0] },
  };
  AN.iaido = AN.iai; AN.rush = AN.charge;
  const JT = ['aR', 'aL', 'eR', 'eL', 'bd', 'hd', 'lL', 'lR', 'kL', 'kR', 'ws'];
  // R6, as the duels are: no elbows or knees — the elbow's bend goes to the shoulder (so the weapon points where it did)
  function r6P(P0) { const o = Object.assign({}, P0);
    for (const [e, sh] of [['eR', 'aR'], ['eL', 'aL']]) { if (o[e] && o[sh]) { const v = o[sh]; o[sh] = v.length > 1 ? [Math.min(3.1, v[0] + o[e][0]), v[1], v[2]] : [Math.min(3.1, v[0] + o[e][0])]; } if (o[e]) o[e] = [0]; }
    if (o.kL) o.kL = [0]; if (o.kR) o.kR = [0]; if (o.up) o.up = Math.max(-0.15, o.up); return o; }
  function setPose(F, P0, k) { // turn each joint P0 names towards its angle, by k
    const a = F.a, J = a.jt; if (!J) return; if (DU.r6) P0 = r6P(P0);
    for (const n of JT) { const v = P0[n]; if (!v) continue; const o = J[n]; if (!o) continue; o.rotation.x += (v[0] - o.rotation.x) * k; if (v.length > 1) { o.rotation.y += (v[1] - o.rotation.y) * k; o.rotation.z += (v[2] - o.rotation.z) * k; } }
    if (P0.wr && a.dg) { const w = a.dg.hR; w.rotation.x += (P0.wr[0] - w.rotation.x) * k; }
    if (P0.up) a.body.position.y += (P0.up - a.body.position.y) * k;
  }
  const mixP = (A, B, k) => { const o = {}; for (const n of new Set(Object.keys(A).concat(Object.keys(B)))) { const x = A[n], y = B[n]; if (n === 'up') { o.up = lerp(x || 0, y || 0, k); continue; } const p = x || [0, 0, 0], q = y || x; o[n] = [lerp(p[0], q[0], k), lerp(p[1] || 0, q[1] || 0, k), lerp(p[2] || 0, q[2] || 0, k)]; if (!x) o[n] = q; } return o; };
  function poseAct(F, dt) {
    const A = F.act, a = F.a; if (!a || a.dead) return; a.duActing = !!(A && A.an); a.duAn = A ? A.an : null; a.duT = A ? A.t : 0; a.duW = A ? A.ab.wind || 0 : 0; // (a pack that holds its weapon itself — the giant's — hands it to the blow)
    if (a.dg && !a.dg.own) { if (!A || !A.an || !(AN[A.an] && (AN[A.an].wr || (Array.isArray(AN[A.an]) && (AN[A.an][0].wr || AN[A.an][1].wr))))) a.dg.hR.rotation.x *= Math.max(0, 1 - dt * 10); } // (the wrist back to its guard)
    if (A && A.an === 'gun' && a.dg && !a.duGun) { const g = new THREE.Group(); a.dg.hR.add(g); g.rotation.x = -Math.PI / 2; const wd = new THREE.MeshLambertMaterial({ color: '#5b3a1e', map: woodTex() }), ir = metalMat('#3f3f46'); const st = new THREE.Mesh(BOX, wd); st.scale.set(0.22, 0.3, 2.4); st.position.z = -0.4; g.add(st); const br = new THREE.Mesh(kCyl(), ir); br.scale.set(0.07, 2.6, 0.07); br.rotation.x = Math.PI / 2; br.position.set(0, 0.16, -1.6); g.add(br); g.userData.tip = new THREE.Object3D(); g.userData.tip.position.set(0, 0.16, -2.9); g.add(g.userData.tip); a.duGun = g; }
    if (a.duGun) a.duGun.visible = !!(A && A.an === 'gun');
    if (!A) return;
    const ab = A.ab, t = A.t, w0 = Math.max(0.05, ab.wind || 0.05), dur = A.dur, P0 = AN[A.an]; if (!P0) { if (A.an === 'bcleave') A.trail = t > w0 - 0.14 && t < w0 + 0.14; return; } // (the boss's own: its pack poses it)
    if (a.dg && (A.an === 'gun' || ((A.an === 'throw' || A.an === 'hop') && t > w0 && A.thrown))) for (const o of a.dg.R) o.visible = false; // (the thrown weapon leaves the hand)
    if (a.dg && (A.an === 'net' || A.an === 'lob') && t > w0 && a.dg.L) a.dg.L.visible = false;
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
  const foeOf = (F) => { const M = DU.M; if (!M) return null; if (F === M.foe) return isBoss(F) ? (F.tgt || M.me) : M.me; return M.foe; };
  const targetsOf = (F) => { const M = DU.M; if (!M) return []; if (isBoss(F)) return [M.me, ...M.allies].filter((T) => !T.dead && !T.out && !T.gone); const T = foeOf(F); return T ? [T] : []; };
  const live = () => DU.M && DU.M.ph === 'fight';
  function clampArena(x, z, r = 1.6) { const a = A0 - r, b = B0 - r, q = (x / a) ** 2 + (z / b) ** 2; if (q <= 1) return [x, z]; const s = 1 / Math.sqrt(q); return [x * s, z * s]; }
  function moveF(F, dx, dz) { const r = 1.6 * (F.C.big || 1); if (F.kind === 'me') { [P.x, P.z] = clampArena(P.x + dx, P.z + dz, r); F.x = P.x; F.z = P.z; } else if (F.kind === 'bot' || F.kind === 'boss') { [F.x, F.z] = clampArena(F.x + dx, F.z + dz, r); } }
  function faceF(F, yaw) { F.yaw = yaw; if (F.kind === 'me') P.yaw = yaw; }
  /* aiming made easy (your own shots; bots aim by their difficulty): a shot turns you to them if they're anywhere
     within AIM_CONE of where you or your camera face, it's let go where they'll BE when it gets there (their speed,
     smoothed, times its flight), it homes in harder and hits a little wider, and a volley follows them until just
     before it falls. A mark on them says whether a shot now would find them */
  const AIM_CONE = 1.75, AIM_RANGE = 60;
  function trackVel(F, dt) { if (!F || !(dt > 0)) return; if (F.lpx == null) { F.lpx = F.x; F.lpz = F.z; F.mvx = F.mvz = 0; return; } const ix = (F.x - F.lpx) / dt, iz = (F.z - F.lpz) / dt; F.lpx = F.x; F.lpz = F.z; if (Math.hypot(ix, iz) > 70) return; const k = Math.min(1, dt * 7); F.mvx += (ix - F.mvx) * k; F.mvz += (iz - F.mvz) * k; } // (a jump of the camera or a respawn isn't speed)
  function leadAt(F, T, spd) { let x = T.x, z = T.z; for (let i = 0; i < 3; i++) { const t = Math.hypot(x - F.x, z - F.z) / Math.max(20, spd || 60); x = T.x + (T.mvx || 0) * t; z = T.z + (T.mvz || 0) * t; } return angOf(x - F.x, z - F.z); }
  const aimOff = (F, a) => F.kind === 'me' ? Math.min(Math.abs(wrapA(a - F.yaw)), Math.abs(wrapA(a - cam.yaw))) : Math.abs(wrapA(a - F.yaw)); // (yours: how far from where you OR your camera face)
  function aimAssist(F, ab) { const T = foeOf(F); if (!T || T.dead || bval(T, 'inv') || Math.hypot(T.x - F.x, T.z - F.z) > AIM_RANGE) return; const a = leadAt(F, T, ab.spd); if (aimOff(F, a) < AIM_CONE) faceF(F, a); }
  /* 🟥 hitboxes: each fighter's body as a wire cylinder (green you, red them, blue allies) — a blow lands when its
     reach (the sector on the sand: amber as it winds up, red as it strikes) touches it — a dash's contact ring, and
     each shot's hit sphere */
  const HB = { g: null, cyl: [], sec: [], sph: [] };
  function hbPool(list, make, i) { let m = list[i]; if (!m) { m = list[i] = make(); HB.g.add(m); } m.visible = true; return m; }
  const hbSecGeo = (half) => kg('duHbSec' + half.toFixed(2), () => { const q = new THREE.CircleGeometry(1, 40, Math.PI / 2 - half, half * 2); q.rotateX(-Math.PI / 2); return q; });
  function hbTick(M) {
    if (!opt('hb') || !M) { if (HB.g) HB.g.visible = false; return; }
    if (!HB.g || !HB.g.parent) { HB.g = new THREE.Group(); HB.g.renderOrder = 998; scene.add(HB.g); HB.cyl = []; HB.sec = []; HB.sph = []; }
    HB.g.visible = true; for (const L of [HB.cyl, HB.sec, HB.sph]) for (const m of L) m.visible = false;
    let ci = 0, si = 0, pi = 0;
    for (const F of [M.me, M.foe].concat(M.allies || [])) { if (!F || F.dead || F.out || (F.a && !F.a.g.visible)) continue;
      const bg = F.C.big || 1, r = 1.2 + bigR(F), h = 5.6 * bg, y0 = F.y + (F.lift || 0), col = F === M.me ? '#22c55e' : (M.allies || []).includes(F) ? '#3b82f6' : '#ef4444';
      const c = hbPool(HB.cyl, () => new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(1, 1, 1, 20, 3, true)), new THREE.LineBasicMaterial({ color: '#fff', transparent: true, opacity: 0.85, depthTest: false })), ci++);
      c.material.color.set(col); c.scale.set(r, h, r); c.position.set(F.x, y0 + h / 2, F.z);
      const A = F.act, ab = A && A.ab; if (!ab) continue;
      const w = ab.wind || 0, sector = (half, reach, color, op) => { const m = hbPool(HB.sec, () => new THREE.Mesh(hbSecGeo(1), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide })), si++); m.geometry = hbSecGeo(half); m.material.color.set(color); m.material.opacity = op; m.scale.set(reach, 1, reach); m.position.set(F.x, y0 + 0.12, F.z); m.rotation.y = A.an === 'whirl' ? 0 : F.yaw; };
      if (ab.k === 'melee' || ab.k === 'multi' || ab.k === 'combo') { const reach = (ab.rng || 6) + (ab.an === 'stab' ? 2.5 : 0) + bigR(F), half = (ab.arc || 90) >= 360 || A.an === 'whirl' ? Math.PI : Math.min(Math.PI, (ab.arc || 90) / 2 * Math.PI / 180 + 0.3), hot = A.t >= w - 0.06, live = ab.k !== 'melee' || A.t <= (A.live || w + 0.3); sector(half, reach, !hot ? '#f59e0b' : live ? '#ef4444' : '#94a3b8', !hot ? 0.24 : live ? 0.42 : 0.14); }
      else if (ab.k === 'dash' && A.t > w && A.t < w + (ab.dd || 0.3) + 0.1) sector(Math.PI, 2.2 + bigR(F), '#a855f7', 0.35); }
    for (const p of DU.proj) { if (p.life <= 0) continue; const r = (p.F.kind === 'me' ? 2.9 : 2.3) - 1.2, m = hbPool(HB.sph, () => new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.SphereGeometry(1, 10, 6)), new THREE.LineBasicMaterial({ color: '#facc15', transparent: true, opacity: 0.9, depthTest: false })), pi++); m.scale.setScalar(r); m.position.set(p.x, p.y, p.z); }
  }
  const aimTex = () => kCanvas('duAim', 128, 128, (g) => { g.strokeStyle = '#fff'; g.lineWidth = 7; g.beginPath(); g.arc(64, 64, 38, 0, Math.PI * 2); g.stroke(); g.lineWidth = 8; for (const [x0, y0, x1, y1] of [[64, 6, 64, 34], [64, 94, 64, 122], [6, 64, 34, 64], [94, 64, 122, 64]]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); } g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 6, 0, 7); g.fill(); });
  function aimMark(F, T, M, dt) {
    let m = DU.aimM; const ab = abOf(F, 0), A = F.act, ranged = ab.k === 'proj' || F.C.ro === 'Ranger' || !!(A && A.ab.k === 'proj');
    if (!(opt('aim') && M.ph === 'fight' && ranged && T && !T.dead && !F.dead && !bval(T, 'inv'))) { if (m) m.visible = false; return; }
    if (!m || !m.parent) { m = DU.aimM = new THREE.Sprite(new THREE.SpriteMaterial({ map: aimTex(), transparent: true, depthTest: false, depthWrite: false })); m.renderOrder = 999; scene.add(m); }
    const d = Math.hypot(T.x - F.x, T.z - F.z), on = d < AIM_RANGE && aimOff(F, angOf(T.x - F.x, T.z - F.z)) < AIM_CONE, bg = T.C.big || 1, s = (3.2 + d * 0.07) * Math.sqrt(bg);
    m.visible = true; m.position.set(T.x, T.y + (T.lift || 0) + 3.2 * bg, T.z); m.scale.set(s, s, 1); m.material.rotation += dt * 1.5;
    m.material.color.set(!on ? '#94a3b8' : ab.k === 'proj' && F.cd[0] > 0 ? '#fbbf24' : '#4ade80'); m.material.opacity = on ? 0.95 : 0.45; // (green: it'll find them; amber: reloading; grey: turn towards them)
  }
  const canAct = (F) => live() && !F.dead && !stunned(F) && !F.act && !(F.kind === 'me' && P.dead) && !(F.possEnd && F.possEnd > performance.now()); // (a spirit inside someone can't strike)
  // a blow begins: face them (if they're near enough to be what you meant), start the animation, and say so
  // 🎭 Mimic (k 'mimic') and Mimic Form ('mimic2'): you pick (1–4 or a click; bots pick at once), then it's yours for its time
  function mimicStart(F, i, ab, T) {
    if (!T || T.dead || (i === 3 && F.mimF)) return false;
    if (ab.k === 'mimic') { const ops = mimicOps(T); if (!ops.length) return false;
      if (F.kind === 'me') { DU.mimPick('🎭 Mimic — wear one of their abilities for 10 s (×1.5, half the cooldown)', ops.map((o) => [o.ic, o.n, o.k === 'buff' ? 'a buff' : o.hits ? `${o.hits.map((h) => Math.round(h * 1.5)).join('+')} dmg` : o.dmg ? `${Math.round(o.dmg * 1.5)} dmg${o.cnt > 1 ? ' ×' + o.cnt : ''}` : '', `${Math.max(0.5, o.cd * 0.5).toFixed(1)} s`]), (k) => mimicSet(F, ops[k], T)); return false; }
      const by = (o) => ((o.hits ? o.hits.reduce((a, b) => a + b, 0) : o.dmg || 0) * (o.cnt || 1) + (o.b ? 60 : 0)) / Math.max(0.5, o.cd * 0.5); mimicSet(F, ops.reduce((b, o) => (by(o) > by(b) ? o : b)), T); return true; } // (a bot: whatever does the most for its cooldown)
    const P = pasOf(T.C), np = Object.keys(P).length, opts = [['❤️', 'Health', `${Math.round(T.hp)} of ${T.mhp}`, `${Math.round(T.hp / T.mhp * 100)}%`], ['🛡️', 'Block', shOf(T) ? 'their shield' : 'no shield', `armour ×${defOf(T).toFixed(2)}`], ['✨', 'Passives', np ? Object.keys(P).join(', ') : 'none', np ? `${np}` : '—']];
    if (F.kind === 'me') { DU.mimPick('🧬 Mimic Form — copy them for 30 s', opts, (k) => mimicForm(F, ['h', 'b', 'p'][k], T)); return false; }
    mimicForm(F, T.hp / T.mhp - F.hp / F.mhp > 0.2 || T.mhp > F.mhp * 1.6 ? 'h' : np ? 'p' : 'b', T); return true;
  }
  function mimicSet(F, src, T) { const q = mimicScale(src); F.mim = { ab: q, t: F.C.ab[1].dur || 10, mm: [T.c, src.si, src.sm | 0] }; F.cd[1] = 0; F.cdMax[1] = q.cd;
    floatText(F, `🎭 ${src.n.toUpperCase()}`, 'big'); smokeAt(F.x, 2.5, F.z, 12, '#111827', 2.4); sparks(F, '#22d3ee', 10, 3.4, { s: 0.3 }); sfx3('magic', F.x, F.z, 60); if (F.kind === 'me') DU.pubDu(true); }
  function mimicForm(F, k, T) { if (F.mimF || !T) return; const f = { k, t: F.C.ab[3].dur || 30 };
    if (k === 'h') { f.mhp0 = F.mhp; f.hp0 = F.hp; F.mhp = Math.max(1, Math.round(T.mhp)); F.hp = Math.max(1, Math.round(T.hp)); } // (their max, at the share they have left)
    else if (k === 'b') { f.sh = shOf(T) ? 1 : 0; f.def = defOf(T); } else f.P = pasOf(T.C);
    F.mimF = f; F.cd[3] = F.cdMax[3] = f.t; floatText(F, `🧬 ${k === 'h' ? 'THEIR HEALTH' : k === 'b' ? 'THEIR BLOCK' : 'THEIR PASSIVES'}`, 'big'); smokeAt(F.x, 2.5, F.z, 12, '#111827', 2.4); sfx3('magic', F.x, F.z, 60); }
  function mimicEnd(F, form) { // (worn off: its own again, and now the cooldown)
    if (!form && F.mim) { F.mim = null; F.cd[1] = F.cdMax[1] = F.C.ab[1].cd; if (F.kind !== 'rem') floatText(F, '🎭 MIMIC FADES', 'tag'); if (F.kind === 'me') DU.pubDu(true); }
    if (form && F.mimF) { const f = F.mimF; F.mimF = null; if (f.k === 'h') { const fr = F.hp / Math.max(1, F.mhp); F.mhp = f.mhp0; if (!F.dead) F.hp = Math.max(1, Math.min(f.hp0, Math.round(fr * F.mhp))); } // (its own health back: the share it was left at, never more than it had)
      F.cd[3] = F.cdMax[3] = F.C.ab[3].cd; if (F.kind !== 'rem') floatText(F, '🧬 FORM FADES', 'tag'); } }
  const endMimics = (F) => { if (F && (F.mim || F.mimF)) { mimicEnd(F, false); mimicEnd(F, true); } };
  function useAb(F, i, vis) {
    if (i >= F.C.ab.length || (!vis && (!canAct(F) || F.cd[i] > 0 || F.blk))) return false;
    const ab = abOf(F, i), T = foeOf(F);
    if (ab.k === 'mimic' || ab.k === 'mimic2') return vis ? false : mimicStart(F, i, ab, T); // (🎭 the Skinwalker picks first; the cooldown waits till it wears off)
    if (!vis) { F.cd[i] = F.cdMax[i] = ab.cd;
      if (T && !T.dead) { const dx = T.x - F.x, dz = T.z - F.z, d = Math.hypot(dx, dz), da = wrapA(angOf(dx, dz) - F.yaw), far = ab.k === 'proj' || ab.k === 'volley' || ab.k === 'leap' || ab.k === 'dash';
        if ((far && (F.kind === 'me' ? aimOff(F, angOf(dx, dz)) < AIM_CONE : Math.abs(da) < 1.3)) || d < (ab.rng || 7) + 5 && Math.abs(da) < 1.9 || DU.lockOn && F.kind === 'me' || F.kind === 'bot' || F.kind === 'boss') faceF(F, angOf(dx, dz) + (F.kind === 'bot' && ab.k === 'proj' ? (Math.random() - 0.5) * 0.5 * (1 - DIFF[F.D].aim) : 0)); } }
    const A = F.act = { i, ab, t: 0, dur: actDur(ab), an: ab.an, h: 0, yaw: F.yaw, vis: !!vis, x0: F.x, z0: F.z };
    if (T && (ab.k === 'volley' || ab.k === 'leap')) { A.tx = T.x; A.tz = T.z; }
    if (ab.k === 'buff' && ab.b && ab.b.blk && !ab.b.free) A.dur = ab.b.dur;
    if (ab.an === 'stab') A.strikeAt = ab.wind;
    F.acN++; if (F.kind === 'me') DU.pubAct(F, A); if (F.kind === 'boss' && DU.M.coop) { DU.bac = [F.acN, i]; DU.pubDu(true); }
    if (ab.say) DU.say(F, ab.say);
    if (isBoss(F) && F.C.wenBoss) { if (F.tele) scene.remove(F.tele); F.tele = ab.k === 'melee' ? teleArc(F, (ab.rng || 6) + 1.2 + bigR(F), (ab.arc || 90) + 34) : ab.k === 'dash' ? teleArc(F, ab.dist + bigR(F), 34) : ab.k === 'leap' && T ? teleFill(telegraph(T.x, T.z, ab.rad)) : null;
      DU.say(F, { Claw: '⚠️ ITS CLAWS — GET OUT OF REACH', Maul: '⚠️ IT MAULS — EVERY CURSE AT ONCE', 'Self Cannibal': '🍖 IT FEEDS ON ITSELF — STRONGER, FASTER', 'Antler Gore': '⚠️ ANTLERS DOWN — SIDESTEP THE CHARGE', 'Endless Hunger': '⚠️ IT LEAPS TO FEED — MOVE!' }[ab.n] || ab.n.toUpperCase()); sfx3('horn', F.x, F.z, 90, { vol: 0.45 }); } // (❄️ the Wendigo's own warnings)
    else if (isBoss(F)) { if (F.tele) scene.remove(F.tele); F.tele = ab.k === 'melee' ? teleArc(F, (ab.rng || 6) + 1.2 + bigR(F), (ab.arc || 90) + 34) : teleFill(telegraph(F.x, F.z, 9)); DU.say(F, ab.k === 'melee' ? '⚠️ THE GREAT SCIMITAR — GET BEHIND IT' : '⚠️ EARTHSHAKER — JUMP!'); if (ab.k === 'melee') sfx3('horn', F.x, F.z, 90, { vol: 0.5 }); }
    sfx3(ab.k === 'buff' ? 'magic' : ab.k === 'proj' || ab.k === 'volley' ? 'whoosh' : 'swing', F.x, F.z, 60, { vol: 0.6 });
    if (ab.k === 'buff' && ab.b) { burstAt(F.x, F.y + 3.5, F.z, BUFFLOOK[ab.an] ? BUFFLOOK[ab.an][0] : COL[F.c], 7, 0.5); ringAt(F.x, F.z, BUFFLOOK[ab.an] ? BUFFLOOK[ab.an][0] : COL[F.c], 8); if (ab.an === 'smoke') smokeAt(F.x, F.y + 1, F.z, 16, '#6b7280', 3); if (ab.an === 'pray') beamAt(F.x, F.z, '#fef3c7', 40, 1.2, 2.2); }
    if (ab.an === 'smite') beamAt(F.x, F.z, '#fde68a', 14, 0.6, 0.8);
    if (ab.an === 'aquila') { beamAt(F.x, F.z, '#fde68a', 34, 1.1, 2.2); ringAt(F.x, F.z, '#fbbf24', 12, 0.6); }
    if (ab.an === 'gun') sfx3('count', F.x, F.z, 60, { vol: 0.5 });
    if (i === 0 && ab.k === 'proj' && F.C.ab[0].split && F.kind === 'me' && !vis) setTimeout(() => { if (DU.M && DU.M.me === F && F.cd[0] > 0.4) floatText(F, `🔄 Reloading… ${ab.cd} s`, 'tag'); }, (ab.wind + 0.15) * 1000);
    if (ab.k === 'combo') { DU.say(F, '🌸 COMBO'); }
    return true;
  }
  function actTick(F, dt) {
    const A = F.act; if (!A) return; const ab = A.ab, w = ab.wind || 0, t0 = A.t; A.t += dt; const t = A.t, T = foeOf(F);
    const at = (x) => t0 < x && t >= x;
    if (ab.k === 'melee') { if (A.live == null) A.live = w + Math.min(0.5, Math.max(0.15, actDur(ab) - w)); if (A.struck && t0 >= w && t0 < A.live) meleeHit(F, ab, ab.dmg, ab.fx, A, undefined, true); // (still swinging: still live — each target once)
      if (at(w)) { A.struck = 1; if (ab.an === 'stab' && !A.vis) { moveF(F, -Math.sin(F.yaw) * 2.5, -Math.cos(F.yaw) * 2.5); } meleeHit(F, ab, ab.dmg, ab.fx, A);
      if (ab.an === 'bcleave') bossCleaveFx(F, ab); else if (ab.an === 'gslash' && isBoss(F)) { ringAt(F.x - Math.sin(F.yaw) * 6, F.z - Math.cos(F.yaw) * 6, '#fde68a', 14, 0.45); camShake(me, 0.5); sfx3('crash', F.x, F.z, 90); }
      if (ab.scream) { for (let k = 0; k < 3; k++) setTimeout(() => ringAt(F.x, F.z, k ? '#94a3b8' : '#e2e8f0', (ab.rng || 12) * (0.6 + k * 0.3), 0.5), k * 110); sfx3('horn', F.x, F.z, 90, { vol: 0.7 }); camShake(me, 0.35); }
      if (ab.an === 'behead') { slashLine(F.x + Math.cos(F.yaw) * 4, F.z - Math.sin(F.yaw) * 4, F.x - Math.cos(F.yaw) * 4, F.z + Math.sin(F.yaw) * 4, '#ef4444'); sfx3('zap', F.x, F.z, 70); } } }
    else if (ab.k === 'multi' || ab.k === 'combo') {
      for (let h = A.h; h < ab.hits.length && t >= w + h * ab.gap; h++) { A.h = h + 1; const ok = meleeHit(F, ab, ab.hits[h], h === ab.hits.length - 1 ? ab.fx : null, A, h);
        if (ab.an === 'storm' || ab.an === 'twin') { const cx = F.x - Math.sin(F.yaw) * 4.5, cz = F.z - Math.cos(F.yaw) * 4.5, an = F.yaw + (h % 2 ? 0.9 : -0.9) + (Math.random() - 0.5) * 0.8, L = ab.an === 'storm' ? 3.2 : 4; slashLine(cx - Math.cos(an) * L, cz + Math.sin(an) * L, cx + Math.cos(an) * L, cz - Math.sin(an) * L, h % 2 ? '#fecdd3' : '#f43f5e');
          if (ab.an === 'storm' && h === ab.hits.length - 1) { ringAt(cx, cz, '#f43f5e', 7, 0.45); burstAt(cx, F.y + 3.2, cz, '#fb7185', 6, 0.35); for (let q = 0; q < 14; q++) kitSpark(F.a, F.a.g, (Math.random() - 0.5) * 4, 1 + Math.random() * 4, -3 - Math.random() * 3, Math.random() < 0.5 ? '#fda4af' : '#fff1f2', { v: [(Math.random() - 0.5) * 4, 1.5, (Math.random() - 0.5) * 4], g: 2, life: 1.4, s: 0.2, j: 0.8 }); } } // (each cut drawn across them, a burst of petals at the last)
        if (ab.k === 'combo' && h === 0 && !A.vis) { if (ok) { A.held = 1; if (T && T.kind !== 'rem') T.S.root = Math.max(T.S.root, ab.gap * (ab.hits.length - 1) + 0.3); }
          else { F.act = null; F.S.stun = 1.5; F.S.vuln = 1.5; DU.say(F, 'MISSED!'); floatText(F, 'MISSED — STUNNED', 'me'); sfx3('error', F.x, F.z, 60); return; } }
        if (ab.k === 'combo' && A.held && T) { if (T.kind !== 'rem') T.S.root = Math.max(T.S.root, 0.4); for (let q = 0; q < 6; q++) kitSpark(F.a, F.a.g, (Math.random() - 0.5) * 3, 2 + Math.random() * 3, -2 - Math.random() * 2, Math.random() < 0.6 ? '#f9a8d4' : '#fce7f3', { v: [(Math.random() - 0.5) * 3, -1, (Math.random() - 0.5) * 3], life: 1.2, s: 0.22, j: 0.6 }); } } }
    else if (ab.k === 'proj') { const n = ab.cnt || 1; for (let k = 0; k < n; k++) { const tk = w + (ab.spread ? 0 : k * (ab.gap || 0)); if (at(tk)) { if (F.kind === 'me' && !A.vis) aimAssist(F, ab); spawnProj(F, ab, ab.spread ? (k - (n - 1) / 2) * ab.spread * Math.PI / 180 : 0, A.vis); A.thrown = true; } } }
    else if (ab.k === 'blink') { // 👁️ Behind You: gone in a puff of smoke, and back right behind them, striking
      if (at(w)) { if (T && !T.dead && Math.hypot(T.x - F.x, T.z - F.z) < ab.rng + bigR(T)) { smokeAt(F.x, 2, F.z, 14, '#0b0f19', 2.6); const bx = T.x + Math.sin(T.yaw) * (3 + bigR(T)), bz = T.z + Math.cos(T.yaw) * (3 + bigR(T)); if (!A.vis) moveF(F, bx - F.x, bz - F.z); faceF(F, angOf(T.x - F.x, T.z - F.z));
          smokeAt(F.x, 2, F.z, 14, '#0b0f19', 2.6); sfx3('whoosh', F.x, F.z, 60); if (!A.vis) meleeHit(F, Object.assign({}, ab, { rng: 5, arc: 140 }), ab.dmg, ab.fx, A); } else if (!A.vis) floatText(F, 'TOO FAR', 'tag'); } }
    else if (ab.k === 'dash') {
      if (t > w && t0 < w + ab.dd) { const s = (Math.min(t, w + ab.dd) - Math.max(t0, w)) / ab.dd * ab.dist * (ab.back ? -1 : 1); moveF(F, -Math.sin(A.yaw) * s, -Math.cos(A.yaw) * s);
        if (Math.random() < 0.6) kitSpark(F.a, F.a.g, (Math.random() - 0.5) * 2, 0.3, 1, '#d6b98c', { v: [0, 1.5, 3], life: 0.5, s: 0.7, j: 1, flat: true });
        if (ab.rush && Math.random() < 0.5) kitSpark(F.a, F.a.g, (Math.random() - 0.5) * 3, 3 + Math.random() * 3, -2, '#fde68a', { v: [0, 0, 6], life: 0.3, s: 0.3, j: 0.5 });
        if (!ab.back && !A.hit && T && !T.dead && Math.hypot(T.x - F.x, T.z - F.z) < 3.4 + bigR(F) + bigR(T)) { A.hit = 1;
          if (ab.rush) { const head = Math.abs(wrapA(angOf(T.x - F.x, T.z - F.z) - A.yaw)) < 0.35; // (head-on: a direct hit)
            dealHitAs(F, T, head ? ab.dmg2 : ab.dmg, head ? Object.assign({ cr: 1 }, ab.fx) : ab.fx, ab, A); if (head && !A.vis) DU.say(F, '💢 DIRECT HIT'); camShake(me, 0.5); }
          else dealHitAs(F, T, ab.dmg, ab.fx, ab, A); } }
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
    else if (ab.k === 'stomp') { if (at(w)) stompAt(F, ab, A); }
    if (F.act === A && t >= A.dur) { F.act = null; F.lift = 0; }
  }
  // the stomp: up close it crushes (judged by whoever stomped); further out a shockwave rolls across the sand — each one
  // it reaches judges for itself whether it was in the air
  function stompAt(F, ab, A) {
    const big = F.C.big || 1, nr = ab.near ? ab.near + bigR(F) : 0, hit = new Set();
    ringAt(F.x, F.z, '#d6b98c', 5 * big, 0.5); smokeAt(F.x, 0.5, F.z, 12, '#c8a97e', 2.2 * big); sfx3('boom', F.x, F.z, 90, { vol: 0.9 }); camShake(me, 0.45); CROWD.ex = Math.min(1, CROWD.ex + 0.3); if (ab.an === 'bplant') bossPlantFx(F);
    if (nr && !A.vis) for (const T of targetsOf(F)) if (!T.dead && Math.hypot(T.x - F.x, T.z - F.z) < nr + bigR(T)) { hit.add(T); dealHitAs(F, T, ab.crush, { st: 1, cr: 1 }, ab, A); DU.say(F, '💥 CRUSH!'); }
    const g = new THREE.Group(), mat = (o) => new THREE.MeshBasicMaterial(Object.assign({ color: '#fde68a', transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }, o));
    g.add(new THREE.Mesh(kg('duWaveR', () => { const q = new THREE.RingGeometry(0.9, 1, 72); q.rotateX(-Math.PI / 2); return q; }), mat({ opacity: 0.9 })));
    g.add(new THREE.Mesh(kg('duWaveW', () => { const q = new THREE.CylinderGeometry(1, 1, 1.3, 72, 1, true); q.translate(0, 0.65, 0); return q; }), mat({ color: '#d6b98c', opacity: 0.4 })));
    g.position.set(F.x, 0.15, F.z); scene.add(g);
    DU.waves.push({ F, x: F.x, z: F.z, r: Math.max(1, nr * 0.5), min: nr, max: ab.rad, spd: ab.wspd || 24, dmg: ab.dmg, hit, g, bj: new Set() });
  }
  const GROUND = 0.5; // (feet on the sand: P.y)
  function wavesTick(dt) {
    for (const w of DU.waves) { w.r += w.spd * dt; const k = w.r / w.max; w.g.scale.set(w.r, 1, w.r); w.g.children[0].material.opacity = 0.9 * (1 - k); w.g.children[1].material.opacity = 0.4 * (1 - k);
      if (Math.random() < 0.45) { const an = Math.random() * Math.PI * 2; smokeAt(w.x + Math.cos(an) * w.r, 0.3, w.z + Math.sin(an) * w.r, 1, '#d6b98c', 1.3); }
      if (isBoss(w.F) && w.F.a && w.F.a.g.parent === scene) { for (let q = 0; q < 2; q++) { const an = Math.random() * Math.PI * 2; kitSpark(w.F.a, scene, w.x + Math.cos(an) * w.r, 0.3, w.z + Math.sin(an) * w.r, Math.random() < 0.5 ? '#8a6a42' : '#a8875c', { v: [Math.cos(an) * 2, 5 + Math.random() * 4, Math.sin(an) * 2], g: 20, life: 0.6, s: 0.45, j: 1, flat: 1 }); }
        if (Math.random() < 0.1) { const an = Math.random() * Math.PI * 2; crackAt(w.F.a, 2.5 + Math.random() * 2, w.x + Math.cos(an) * w.r, 0, w.z + Math.sin(an) * w.r); } } // (rocks popping up along its front, the ground cracking behind it)
      for (const T of targetsOf(w.F)) { if (!local(T) || T.dead || w.hit.has(T)) continue; const d = Math.hypot(T.x - w.x, T.z - w.z); if (d < w.min) { w.hit.add(T); continue; } if (Math.abs(d - w.r) > 1.3 + bigR(T)) continue;
        w.hit.add(T); if ((T.y || 0) + (T.lift || 0) > GROUND + 1.1) { floatText(T, '⤴️ JUMPED IT', 'tag'); if (T.kind === 'me') DU.bump('dodges', 1); continue; }
        const n = Math.round(w.dmg * bval(w.F, 'dmgM')); takeHit(T, n, { ub: 1 }, w.F); if (w.F.kind === 'me') { DU.bump('dmg', n); DU.M.dealt += n; DU.qBump('d', n); } } }
    DU.waves = DU.waves.filter((w) => { if (w.r < w.max) return true; scene.remove(w.g); return false; });
  }
  // the boss's warnings: its scimitar's whole reach and arc on the sand (an edge, its sides, a fill that grows out to the
  // edge as it winds up), and a fill for the Earthshaker's ring
  function teleArc(F, r1, arc) { const th = arc * Math.PI / 180, a0 = Math.PI / 2 - th / 2, key = r1.toFixed(1) + '_' + arc;
    const mat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide });
    const m = new THREE.Mesh(kg('duArcE' + key, () => { const q = new THREE.RingGeometry(r1 - 0.5, r1, 48, 1, a0, th); q.rotateX(-Math.PI / 2); return q; }), mat('#ef4444', 0.8));
    for (const ph of [a0, a0 + th]) { const e = new THREE.Mesh(BOX, m.material); e.scale.set(0.32, 0.02, r1); e.position.set(Math.cos(ph) * r1 / 2, 0, -Math.sin(ph) * r1 / 2); e.rotation.y = Math.atan2(Math.cos(ph), -Math.sin(ph)); m.add(e); }
    const f = new THREE.Mesh(kg('duArcF' + key, () => { const q = new THREE.RingGeometry(0.4, r1, 48, 1, a0, th); q.rotateX(-Math.PI / 2); return q; }), mat('#dc2626', 0.2)); f.position.y = -0.01; f.scale.setScalar(0.01); m.add(f); m.userData.fill = f;
    m.position.set(F.x, 0.14, F.z); m.rotation.y = F.yaw; scene.add(m); return m; }
  function teleFill(m) { const f = new THREE.Mesh(kg('duTeleF', () => { const q = new THREE.CircleGeometry(0.85, 40); q.rotateX(-Math.PI / 2); return q; }), new THREE.MeshBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide })); f.scale.setScalar(0.01); m.add(f); m.userData.fill = f; return m; }
  // the Great Scimitar lands: a crescent of light thrown across the sand, a wall of it standing a moment, the sand split and
  // sprayed along the arc, sparks and a flash and a deep crack where the point bit, earth flung up
  function bossCleaveFx(F, ab) {
    const a = F.a; if (!a || !a.g || a.g.parent !== scene) return; const r1 = (ab.rng || 6) + 1.2 + bigR(F), th = ((ab.arc || 90) + 34) * Math.PI / 180, a0 = Math.PI / 2 - th / 2, key = r1.toFixed(1) + '_' + th.toFixed(2);
    const fade = (m, life, s0, s1, op, y) => { m.position.set(F.x, y, F.z); m.rotation.y = F.yaw; m.scale.setScalar(s0); m.userData = { v: new THREE.Vector3(), life, g: 0, spinless: 1, tick: (o, u) => { const k = 1 - u.life / life; o.scale.setScalar(s0 + (s1 - s0) * (1 - Math.pow(1 - k, 3))); o.material.opacity = op * (1 - k); } }; scene.add(m); bits.push(m); };
    const add = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const cres = kg('duCres' + key, () => { const q = new THREE.RingGeometry(r1 * 0.7, r1, 48, 1, a0, th); q.rotateX(-Math.PI / 2); return q; });
    for (const [c, life, s0, op, y] of [['#ffffff', 0.3, 0.6, 1, 0.26], ['#fde68a', 0.55, 0.5, 0.95, 0.22], ['#f97316', 0.8, 0.35, 0.8, 0.18]]) fade(new THREE.Mesh(cres, add(c)), life, s0, 1.08, op, y);
    fade(new THREE.Mesh(kg('duCresW' + key, () => { const q = new THREE.CylinderGeometry(r1 * 0.9, r1 * 0.95, 3.6, 40, 1, true, Math.PI - th / 2, th); q.translate(0, 1.8, 0); return q; }), add('#fde68a')), 0.45, 0.55, 1.05, 0.55, 0.1); // (a standing wall of light)
    for (let k = 0; k < 8; k++) { const an = F.yaw + (k / 7 - 0.5) * th * 0.85, rr = r1 * (0.5 + Math.random() * 0.45), x = F.x - Math.sin(an) * rr, z = F.z - Math.cos(an) * rr;
      smokeAt(x, 0.4, z, 2, '#d6b98c', 2.6); if (k % 2 === 0) crackAt(a, 3 + Math.random() * 2.5, x, 0, z);
      for (let j = 0; j < 3; j++) kitSpark(a, scene, x, 0.4, z, Math.random() < 0.5 ? '#c8a97e' : '#a8875c', { v: [(Math.random() - 0.5) * 6, 5 + Math.random() * 6, (Math.random() - 0.5) * 6], g: 22, life: 0.9, s: 0.4, j: 0.6, flat: 1 }); } // (the sand thrown up, the ground split)
    const tp = a.lgG ? a.lgG.tip.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(F.x - Math.sin(F.yaw) * r1 * 0.6, 0, F.z - Math.cos(F.yaw) * r1 * 0.6);
    crackAt(a, 7, tp.x, 0, tp.z); burstAt(tp.x, 1.4, tp.z, '#fde68a', 11, 0.4); burstAt(tp.x, 0.8, tp.z, '#ffffff', 6, 0.18);
    for (let q = 0; q < 24; q++) kitSpark(a, scene, tp.x, 0.5, tp.z, Math.random() < 0.5 ? '#fdba74' : '#fde68a', { v: [(Math.random() - 0.5) * 11, 3 + Math.random() * 9, (Math.random() - 0.5) * 11], g: 16, life: 0.75, s: 0.22, j: 0.6 });
    emBits(a, 0, 0.4, -r1 * 0.5 / (a.g.scale.y || 1), ['#a8875c', '#8a6a42', '#d6b98c', '#6b5236'], 18, { size: 0.5, speed: 8, up: 9, g: 22, life: 1.3, spread: 4 });
    ringAt(F.x - Math.sin(F.yaw) * 6, F.z - Math.cos(F.yaw) * 6, '#fde68a', 14, 0.45); camShake(me, 0.8); CROWD.ex = 1; sfx3('crash', F.x, F.z, 90); sfx3('boom', F.x, F.z, 90, { vol: 0.8 });
  }
  // the Earthshaker lands: the ground cracked wide round it, the sword's point sunk in a crater of sparks, rings of light,
  // rocks heaved up in a ring and settling again, earth and dust flung up
  let ROCK_M = null;
  function bossPlantFx(F) {
    const a = F.a; if (!a || !a.g || a.g.parent !== scene) return; const tp = a.lgG ? a.lgG.tip.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(F.x, 0, F.z);
    crackAt(a, 18, F.x, 0, F.z); crackAt(a, 8, tp.x, 0, tp.z); burstAt(tp.x, 1.6, tp.z, '#fde68a', 15, 0.45); burstAt(F.x, 2.2, F.z, '#fff7ed', 24, 0.22);
    for (const [sz, l, c] of [[10, 0.35, '#ffffff'], [19, 0.6, '#fde68a'], [30, 0.85, '#f97316']]) ringAt(F.x, F.z, c, sz, l);
    for (let q = 0; q < 28; q++) kitSpark(a, scene, tp.x, 0.5, tp.z, Math.random() < 0.5 ? '#fdba74' : '#fde68a', { v: [(Math.random() - 0.5) * 12, 3 + Math.random() * 10, (Math.random() - 0.5) * 12], g: 16, life: 0.8, s: 0.22, j: 0.6 });
    emBits(a, 0, 0.3, -1.6, ['#a8875c', '#8a6a42', '#d6b98c', '#6b5236'], 26, { size: 0.55, speed: 10, up: 11, g: 22, life: 1.5, spread: 5 });
    const rock = ROCK_M || (ROCK_M = new THREE.MeshLambertMaterial({ color: '#8a6a42' }));
    for (let k = 0; k < 14; k++) { const an = (k / 14) * Math.PI * 2 + Math.random() * 0.3, r = 7 + Math.random() * 4, h = 1.4 + Math.random() * 1.6, m = new THREE.Mesh(BOX, rock); m.scale.set(0.9 + Math.random() * 0.8, h, 0.9 + Math.random() * 0.8); m.rotation.set((Math.random() - 0.5) * 0.6, Math.random() * 3, (Math.random() - 0.5) * 0.6);
      const x = F.x + Math.cos(an) * r, z = F.z + Math.sin(an) * r, L = 1.7, d = Math.random() * 0.15; m.position.set(x, -h, z);
      m.userData = { v: new THREE.Vector3(), life: L + d, g: 0, spinless: 1, tick: (o, u) => { const k2 = clamp((L + d - u.life - d) / L, 0, 1); o.position.y = -h / 2 + h * 0.75 * (k2 < 0.12 ? ease(k2 / 0.12) : k2 > 0.65 ? 1 - ease((k2 - 0.65) / 0.35) : 1); } }; scene.add(m); bits.push(m); } // (rocks heaved up in a ring)
    smokeAt(F.x, 0.5, F.z, 16, '#c8a97e', 3.4); camShake(me, 0.9); CROWD.ex = 1; sfx3('crash', F.x, F.z, 90, { vol: 0.8 });
  }
  function telegraph(x, z, r) { const m = new THREE.Mesh(kg('duTele', () => { const q = new THREE.RingGeometry(0.85, 1, 40); q.rotateX(-Math.PI / 2); return q; }), new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide })); m.position.set(x, 0.15, z); m.scale.setScalar(r); scene.add(m); return m; }
  function buffOn(F, ab) {
    const b = Object.assign({ an: ab.an, t: ab.b.dur }, ab.b); if (b.hpsP) b.hps = F.mhp * b.hpsP; F.S.buffs = F.S.buffs.filter((q) => q.an !== ab.an); F.S.buffs.push(b);
    if (ab.selfP && F.kind !== 'rem') { const n = Math.round(F.mhp * ab.selfP); F.hp = Math.max(1, F.hp - n); F.hurtT = 0; floatText(F, `🍖 -${n}`, 'big'); sparks(F, '#991b1b', 14, 3.2, { flat: true, s: 0.3, life: 0.8 }); sfx3('crunch', F.x, F.z, 60); } // (Self Cannibal: it eats itself)
    if (b.heal) heal(F, b.heal); if (b.healP) heal(F, F.mhp * b.healP);
    if (b.imm) { F.S.stun = F.S.root = F.S.slow = 0; }
    if (b.nx) F.nx = b.nx;
    if (b.rl) { F.cd[0] = 0; F.mcd = []; floatText(F, '🔄 LOADED', 'tag'); } // (the Minuteman: loaded at once)
    if (b.inv) smokeAt(F.x, 1, F.z, 18, '#4b5563', 3.2);
    if (b.foeSpd) { const T = foeOf(F); if (T && !T.dead) applyFx(T, { hs: [b.foeSpd, b.dur] }, F); } // (the Bloodrush: the blood in the air quickens them too)
    DU.say(F, ab.n.toUpperCase());
  }
  function heal(F, n) { n = Math.round(Math.min(n, F.mhp - F.hp)); if (n <= 0 || F.kind === 'rem') return; F.hp += n; floatText(F, '+' + n, 'heal'); sparks(F, '#4ade80', 6, 3, { v: [0, 4, 0], g: 0 }); }
  // does a blow land? within reach, in front (the arc), not far above or below
  function meleeHit(F, ab, dmg, fx, A, h, late) {
    let any = false;
    for (const T of targetsOf(F)) { if (T.dead || (A && A.hitT && A.hitT.has(T))) continue;
      const dx = T.x - F.x, dz = T.z - F.z, d = Math.hypot(dx, dz), da = Math.abs(wrapA(angOf(dx, dz) - (A && A.an === 'whirl' ? angOf(dx, dz) : F.yaw)));
      const reach = (ab.rng || 6) + 1.2 + (ab.an === 'stab' ? 2.5 : 0) + bigR(F) + bigR(T), arc = (ab.arc || 90) >= 360 ? 9 : (ab.arc || 90) / 2 * Math.PI / 180 + 0.3;
      if (d > reach || da > arc || Math.abs((T.y + (T.lift || 0)) - (F.y + (F.lift || 0))) > 4.5 * Math.max(F.C.big || 1, T.C.big || 1)) continue;
      any = true; if (A) (A.hitT || (A.hitT = new Set())).add(T); if (!(A && A.vis)) dealHitAs(F, T, dmg, fx, ab, A, h); }
    if (!any && !late && (!A || !A.vis)) sfx3('whoosh', F.x, F.z, 40, { vol: 0.35 });
    return any;
  }
  // a hit: how hard (their buffs and the next-hit bonus), then theirs to take — here, or sent to them
  function dealHitAs(F, T, base, fx, ab, A, h) {
    if (A && A.vis) return;
    let dmg = (base + bval(F, 'dmgA')) * bval(F, 'dmgM') * F.dmgM * (pv(F, 'wish') ? 1 + 0.1 * (F.wishN || 0) : 1) * (pv(F, 'stages') ? 1 + 0.25 * (stageOf(F) - 1) : 1); if (F.nx) { dmg *= F.nx; F.nx = 0; F.S.buffs = F.S.buffs.filter((b) => !b.inv); floatText(F, 'AMBUSH ×2', 'big'); }
    let crit = false; const cr0 = pv(F, 'crit'); if (cr0 && Math.random() < cr0[0]) { dmg *= cr0[1]; crit = true; } // (the Kensei: Sword Saint)
    const ex0 = pv(F, 'exe'); if (ex0 && T.mhp && T.hp > 0 && T.hp / T.mhp < ex0[0]) dmg *= ex0[1]; // (and Ichigeki)
    const rg0 = pv(F, 'rage'); if (rg0 && F.hp / F.mhp < rg0[0]) dmg *= rg0[1]; // (the Cyclops' rage)
    const cu = F.S.cu > 0; if (cu) dmg *= 0.5; // (under a grudge: half the blow…)
    dmg = Math.round(dmg); const f2 = Object.assign({}, fx || {}); if (f2.bl && f2.blc != null && Math.random() > f2.blc) delete f2.bl; delete f2.blc;
    if (pv(F, 'brute') && !f2.cr && Math.random() < pv(F, 'brute')) f2.cr = 1; // (Brute Force)
    if (ab && ab.maul && Math.random() < ab.maul[0] && !(F.maulT > now())) { F.maulT = now() + 6; const d3 = ab.maul[1]; Object.assign(f2, { st: Math.max(f2.st || 0, 1), rt: d3, sl: [0.5, d3], bl: [45, d3], bu: [45, d3], vu: d3, fog: 1.5 }); floatText(T, '☠️ EVERY CURSE', 'big'); burstAt(T.x, T.y + 3.4, T.z, '#7f1d1d', 6, 0.45); } // (the Maul: 1 in 4, everything bad at once — at most once in 6 s)
    const sp0 = pv(F, 'stunP'); if (sp0 && Math.random() < sp0[0]) f2.st = Math.max(f2.st || 0, sp0[1]); // (the Imperator: Imperium)
    if (pv(F, 'frost') && !f2.sl) f2.sl = pv(F, 'frost').slice(); // (the Jötunn: Rime)
    if (T.kind === 'rem' || T.kind === 'rboss') { DU.sendHit(T, dmg, f2, F); hitLook(T, dmg, false, ab); floatText(T, String(dmg), dmg >= 100 ? 'big' : ''); if (f2.cr && !T.S.crush) floatText(T, '💢 CRUSHED', 'tag'); }
    else takeHit(T, dmg, f2, F, { ab });
    if (crit) { floatText(T, `✴️ CRIT ${dmg}`, 'big'); sparks(T, '#f43f5e', 10, 3.4, { s: 0.28 }); burstAt(T.x, T.y + 3.4, T.z, '#fb7185', 4.5, 0.3); }
    const ls = bval(F, 'ls') + (pv(F, 'lsP') || 0); if (ls) heal(F, dmg * ls); if (ab && ab.drain) heal(F, dmg * ab.drain); // (the Soul Drain)
    if (f2.pos && !isBoss(T) && !(T.C && T.S && bval(T, 'imm'))) { F.possT = T; F.possEnd = performance.now() + f2.pos * 1000; } // (the spirit goes into them)
    if (cu && dmg > 0 && !F.dead) { floatText(F, '👺 GRUDGE', 'tag'); sparks(F, '#a78bfa', 6, 3.4, { s: 0.3 }); takeHit(F, dmg, { ub: 1 }, F.S.cuBy && !F.S.cuBy.dead ? F.S.cuBy : null, { rf: 1 }); } // (…and as much again to themselves)
    if (f2.cu && (T.kind === 'rem' || T.kind === 'rboss')) T.S.cu = Math.max(T.S.cu || 0, f2.cu); // (to see it on them here)
    if (pv(F, 'wish')) { F.wishN = (F.wishN || 0) + 1; heal(F, F.mhp * 0.1); if (F.kind === 'me') floatText(F, `🪓 WISH +${F.wishN * 10}%`, 'tag'); } // (the Executioner's Wish)
    if (F.kind === 'me') { DU.bump('dmg', dmg); DU.M.dealt += dmg; DU.qBump('d', dmg); }
  }
  function hitLook(T, dmg, blocked, ab) {
    const big = dmg >= 100; sfx3(blocked ? 'block' : big ? 'crunch' : 'hit', T.x, T.z, 70, { vol: big ? 1 : 0.8 });
    sparks(T, blocked ? '#bae6fd' : '#fef3c7', big ? 16 : 9); if (!blocked) sparks(T, '#dc2626', big ? 8 : 4, 3.2, { flat: true, s: 0.25, life: 0.6 });
    burstAt(T.x, T.y + 3.4, T.z, blocked ? '#93c5fd' : '#fff7ed', big ? 5 : 3);
    if (T.a && !T.a.dead) { setGlow(T.a, blocked ? '#1e3a8a' : '#7f1d1d'); clearTimeout(T.glowT); T.glowT = setTimeout(() => T.a && setGlow(T.a, null), 110); }
    if (big) { ringAt(T.x, T.z, '#fde68a', 6, 0.4); CROWD.ex = Math.min(1, CROWD.ex + 0.5); } else CROWD.ex = Math.min(1, CROWD.ex + 0.18);
    if (T.kind === 'me' || (ab && foeOf(T) && foeOf(T).kind === 'me')) camShake(me, big ? 0.6 : 0.22);
  }
  // an effect with no blow (a parry's stun, the Bloodrush's haste): here, or sent to whoever judges them
  function applyFx(T, fx, from) {
    if (T.kind === 'rem' || T.kind === 'rboss') { DU.sendHit(T, 0, Object.assign({}, fx, { fo: 1 }), from); return; }
    if (T.dead) return; const imm = bval(T, 'imm');
    if (fx.st && !imm) { T.S.stun = Math.max(T.S.stun, fx.st); T.act = null; T.blk = false; floatText(T, '💫 STUNNED', 'tag'); }
    if (fx.vu) { T.S.vuln = Math.max(T.S.vuln, fx.vu); floatText(T, '⚠️ ×1.5 DAMAGE', 'tag'); }
    if (fx.hs) { T.S.buffs = T.S.buffs.filter((b) => b.an !== 'haste'); T.S.buffs.push({ an: 'haste', t: fx.hs[1], spdM: fx.hs[0] }); floatText(T, `🩸 ×${fx.hs[0]} SPEED`, 'tag'); }
  }
  // taking a hit (mine, or a bot's, or the boss's if it's mine to run): a dodge's moment, a block (all of it), armour and buffs, then what it does to you
  function takeHit(T, dmg, fx, from, o = {}) {
    if (T.dead || !live()) return; fx = fx || {};
    if (fx.fo) { applyFx(T, fx, from); return; }
    if (T.S.sp > 0) { floatText(T, '✨ PROTECTED', 'tag'); return; } // (just back from a death in the boss fight)
    if (bval(T, 'ph') || (T.possEnd && T.possEnd > performance.now())) { floatText(T, '🌫️ PHASED', 'tag'); return; } // (the spirit: out of the world, or inside someone)
    if (T.S.ifr > 0) { floatText(T, 'DODGED', 'tag'); sfx3('whoosh', T.x, T.z, 50); if (T.kind === 'me') DU.bump('dodges', 1); return; }
    const imm = bval(T, 'imm'), ub = !!fx.ub, blkB = ub ? 0 : bval(T, 'blk'); let mult = defOf(T) * bval(T, 'def') * (T.S.vuln > 0 ? 1.5 : 1) * (T.S.crush ? 2 : 1), blocked = false;
    if (blkB) { mult *= 1 - blkB; blocked = true;
      if (bval(T, 'parry') && from && !o.rf) { floatText(T, '⚔️ PARRIED!', 'big'); sfx3('crash', T.x, T.z, 70); burstAt(T.x, T.y + 4, T.z, '#e5e7eb', 7, 0.45); applyFx(from, { st: 2, vu: 2 }, T); } }
    else if (!ub && T.blk && from && Math.abs(wrapA(angOf(from.x - T.x, from.z - T.z) - T.yaw)) < 1.2) { mult = shOf(T) ? 0 : mult * 0.5; blocked = true; // (a shield stops it all; a blade or a staff only takes half of it) T.st -= 12 + dmg * 0.12; T.rest = 0;
      if (T.st <= 0) { T.st = 0; T.blk = false; T.S.stun = Math.max(T.S.stun, 1.2); floatText(T, 'GUARD BROKEN', 'big'); sfx3('crash', T.x, T.z, 60); } }
    dmg = mult <= 0 ? 0 : Math.max(1, Math.round(dmg * mult)); T.hp -= dmg; T.rTaken = (T.rTaken || 0) + dmg; if (dmg > 0) T.hurtT = 0;
    floatText(T, blocked ? (dmg ? `🛡️ ${dmg}` : '🛡️ BLOCKED') : String(dmg), (T.kind === 'me' ? 'me ' : '') + (dmg >= 100 ? 'big' : '')); hitLook(T, dmg, blocked, o.ab);
    if (T.kind === 'me') { const h = $('#duHurt'); if (h) { h.style.opacity = blocked ? 0.25 : 0.8; clearTimeout(DU.hurtT); DU.hurtT = setTimeout(() => (h.style.opacity = 0), 200); } }
    if (!blocked) {
      if (!imm) { if (fx.st) { T.S.stun = Math.max(T.S.stun, fx.st); T.act = null; T.blk = false; } if (fx.rt) T.S.root = Math.max(T.S.root, fx.rt); if (fx.sl) { T.S.slow = Math.max(T.S.slow, fx.sl[1]); T.S.slowM = fx.sl[0]; }
        if (fx.kb && from) { const dx = T.x - from.x, dz = T.z - from.z, l = Math.hypot(dx, dz) || 1; T.push = { vx: dx / l * fx.kb / 0.3, vz: dz / l * fx.kb / 0.3, t: 0.3 }; } }
      if (fx.bl) { T.S.dots.push({ k: 'bl', dps: fx.bl[0] / fx.bl[1], t: fx.bl[1], acc: 0 }); floatText(T, '🩸 BLEEDING', 'tag'); }
      if (fx.bu && !pv(T, 'fireImm')) { T.S.dots.push({ k: 'bu', dps: fx.bu[0] / fx.bu[1], t: fx.bu[1], acc: 0 }); floatText(T, '🔥 BURNING', 'tag'); }
      if (fx.pos && !isBoss(T)) { T.S.pos = Math.max(T.S.pos || 0, fx.pos); T.S.posBy = from || null; T.act = null; T.blk = false; floatText(T, '👻 POSSESSED', 'big'); sfx3('magic', T.x, T.z, 70); } // (possessed: it walks them where it looks)
      if (fx.fr && !isBoss(T)) { T.S.fear = Math.max(T.S.fear || 0, fx.fr); T.S.fearBy = from || null; T.act = null; T.blk = false; floatText(T, '😱 TERRIFIED', 'big'); sfx3('magic', T.x, T.z, 70); } // (the Horseman's laugh: they run from him)
      if (fx.pl && from && !isBoss(T)) { const dx = T.x - from.x, dz = T.z - from.z, l = Math.hypot(dx, dz) || 1, d = Math.max(0, l - 3.4 - bigR(T) - bigR(from)); if (d > 0) T.push = { vx: -dx / l * d / 0.3, vz: -dz / l * d / 0.3, t: 0.3 }; floatText(T, '⛓️ DRAGGED IN', 'tag'); } // (Krampus's chain: dragged in to him)
      if (fx.pt && !isBoss(T)) { T.S.stone = Math.max(T.S.stone || 0, fx.pt); T.act = null; T.blk = false; stoneFx(T, true); floatText(T, '🗿 TURNED TO STONE', 'big'); sfx3('crunch', T.x, T.z, 70); } // (Medusa's gaze)
      if (fx.cu) { T.S.cu = Math.max(T.S.cu || 0, fx.cu); T.S.cuBy = from || null; floatText(T, '👺 CURSED', 'big'); sfx3('magic', T.x, T.z, 60); } // (the Yūrei's grudge: see dealHitAs)
      if (fx.cr && !T.S.crush) { T.S.crush = 1; floatText(T, '💢 CRUSHED — ×2 DAMAGE', 'big'); sfx3('crunch', T.x, T.z, 70); } // (until the round ends, or they die)
      if (fx.vu) T.S.vuln = Math.max(T.S.vuln, fx.vu);
      if (fx.fog && !isBoss(T)) { T.S.fog = Math.max(T.S.fog || 0, fx.fog); if (T.kind === 'me') DU.fogOn(fx.fog); floatText(T, '🌫️ BLINDED', 'tag'); } // (the Screech: a fog over their eyes)
      if (fx.st && !imm) floatText(T, '💫 STUNNED', 'tag'); if (fx.rt && !imm) floatText(T, '🕸️ ROOTED', 'tag');
    }
    const rf = bval(T, 'rf'); if (rf && from && !o.rf && dmg > 0) { const back = Math.round(dmg * rf); if (from.kind === 'rem' || from.kind === 'rboss') { DU.sendHit(from, back, { rf: 1 }, T); floatText(from, String(back), ''); } else takeHit(from, back, {}, T, { rf: 1 }); }
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
  // Medusa's gaze: they go grey as stone (and a bot freezes mid-move) until it wears off
  function stoneFx(T, on) { const a = T.a;
    if (on) { if (T.stoneM || !a) return; T.stoneM = []; a.g.traverse((o) => { if (!o.isMesh || !o.material) return; for (const m of [].concat(o.material)) { if (!m.color || m.transparent || m.blending === THREE.AdditiveBlending || T.stoneM.some((q) => q[0] === m)) continue; T.stoneM.push([m, m.color.getHex(), m.emissive ? m.emissive.getHex() : null]); m.color.setHex(0x9a9690); if (m.emissive) m.emissive.setHex(0x000000); } }); smokeAt(T.x, 2.5, T.z, 10, '#a8a29e', 2.2); }
    else if (T.stoneM) { for (const [m, c, e] of T.stoneM) { m.color.setHex(c); if (e != null && m.emissive) m.emissive.setHex(e); } T.stoneM = null; if (a) smokeAt(T.x, 2.5, T.z, 8, '#a8a29e', 2); } }
  const frostRingTex = () => kCanvas('duFrostRingT', 256, 256, (g, r) => { const gr = g.createRadialGradient(128, 128, 40, 128, 128, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.62, 'rgba(255,255,255,.1)'); gr.addColorStop(0.9, 'rgba(255,255,255,.55)'); gr.addColorStop(0.97, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.2; for (let k = 0; k < 40; k++) { const a = r() * 6.283, d = 70 + r() * 52, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d, l = 3 + r() * 5; for (let j = 0; j < 3; j++) { const b = (j * Math.PI) / 3; g.beginPath(); g.moveTo(x - Math.cos(b) * l, y - Math.sin(b) * l); g.lineTo(x + Math.cos(b) * l, y + Math.sin(b) * l); g.stroke(); } } }); // (frost: a ring of it, and crystals)
  function statusTick(F, dt) {
    const S = F.S, cdm = bval(F, 'cdM') * (S.chill > 0 ? 0.8 : 1); // (the Wendigo boss's cold: cooldowns 25% slower)
    for (let i = 0; i < F.cd.length; i++) if (F.cd[i] > 0) F.cd[i] = Math.max(0, F.cd[i] - dt * cdm); if (F.mcd) for (let k = 0; k < F.mcd.length; k++) if (k !== F.mode && F.mcd[k] > 0) F.mcd[k] = Math.max(0, F.mcd[k] - dt * cdm); // (the other mode's, too)
    if (S.stone > 0 && (S.stone -= dt) <= 0) S.stone = 0; if (F.stoneM && !(S.stone > 0)) stoneFx(F, false);
    S.sp = Math.max(0, S.sp - dt); S.stun = Math.max(0, S.stun - dt); if (S.pos > 0 && (S.pos -= dt) <= 0) { S.pos = 0; S.posBy = null; } S.root = Math.max(0, S.root - dt); S.vuln = Math.max(0, S.vuln - dt); if (S.cu > 0 && (S.cu -= dt) <= 0) { S.cu = 0; S.cuBy = null; } if (S.fear > 0 && (S.fear -= dt) <= 0) { S.fear = 0; S.fearBy = null; } S.ifr = Math.max(0, S.ifr - dt); if ((S.slow = Math.max(0, S.slow - dt)) === 0) S.slowM = 1;
    for (const b of S.buffs) b.t -= dt; S.buffs = S.buffs.filter((b) => b.t > 0);
    if (F.mim && (F.mim.t -= dt) <= 0) mimicEnd(F, false); if (F.mimF) { F.mimF.t -= dt; F.cd[3] = Math.max(0.01, F.mimF.t); if (F.mimF.t <= 0) mimicEnd(F, true); } // (🎭 the time left on what it wears)
    if (S.fog > 0) S.fog = Math.max(0, S.fog - dt); if (S.chill > 0) S.chill = Math.max(0, S.chill - dt);
    F.hurtT = (F.hurtT == null ? 99 : F.hurtT) + dt; const rgn = pv(F, 'regen');
    if (rgn && !F.dead && F.kind !== 'rem' && F.kind !== 'rboss' && F.hurtT >= rgn[1] && F.hp < F.mhp && live()) { F.hp = Math.min(F.mhp, F.hp + F.mhp * rgn[0] * dt); F.rgT = (F.rgT || 0) + dt; if (F.rgT > 1) { F.rgT = 0; floatText(F, `♾️ +${Math.round(F.mhp * rgn[0])}`, 'heal'); } } // (♾️ Immortality: healing while nobody touches it)
    if (pv(F, 'stages')) { const st = stageOf(F); if (F.stage && st !== F.stage && !F.dead && st > F.stage) { floatText(F, `🩸 STAGE ${st} — +${(st - 1) * 25}% DAMAGE`, 'big'); sfx3('horn', F.x, F.z, 80, { vol: 0.6 }); burstAt(F.x, F.y + 4, F.z, '#7f1d1d', 6, 0.4); } F.stage = st; }
    const au = pv(F, 'aura'); if (au && !F.dead && live()) for (const T of targetsOf(F)) { if (T.dead || Math.hypot(T.x - F.x, T.z - F.z) > au[0] * (F.C.big || 1) + bigR(T)) continue; // (❄️ Creature of Winter: slowed in its cold)
      if (!(T.S.slow > 0.05) || T.S.slowM >= au[1]) { T.S.slow = Math.max(T.S.slow, 0.25); T.S.slowM = au[1]; } if (F.C.wenBoss) T.S.chill = 0.3; if (T.kind === 'me' && !(T.chillFx > now())) { T.chillFx = now() + 1.2; floatText(T, F.C.wenBoss ? '❄️ CHILLED — COOLDOWNS ×1.25' : '❄️ CHILLED', 'tag'); } }
    if (au && F.a && !F.dead) { let r = F.auraR; if (!r) { r = F.auraR = new THREE.Mesh(kg('duAuraDisc', () => { const q = new THREE.CircleGeometry(1, 56); q.rotateX(-Math.PI / 2); return q; }), new THREE.MeshBasicMaterial({ map: frostRingTex(), color: '#38bdf8', transparent: true, opacity: 0.75, depthWrite: false })); r.renderOrder = 2; scene.add(r); } // (❄️ the cold, drawn on the ground: as far as it reaches)
      r.visible = true; r.position.set(F.x, (F.y || 0) + 0.1, F.z); r.scale.setScalar(au[0] * (F.C.big || 1)); r.rotation.y += dt * 0.25; } else if (F.auraR) F.auraR.visible = false;
    if (F.kind === 'rem' || F.kind === 'rboss' || F.dead) return;
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
    else if (kind === 'rock') { const s2 = new THREE.Group(); g.add(s2); const m = new THREE.Mesh(kg('duRockB', () => new THREE.IcosahedronGeometry(1, 0)), new THREE.MeshLambertMaterial({ color: '#8b8378', flatShading: true })); m.scale.set(1.25, 1.05, 1.15); s2.add(m); g.userData.spin = s2; } // (a boulder)
    else if (kind === 'bolt') { const mt = new THREE.MeshBasicMaterial({ color: '#fef9c3', transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }); let z = 0.6; for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(BOX, mt); const l = 0.7; b.scale.set(0.14, 0.14, l); b.position.set(k % 2 ? 0.18 : -0.18, 0, z - l / 2); b.rotation.y = k % 2 ? -0.5 : 0.5; g.add(b); z -= l * 0.85; } kitGlow(g, '#fde047', 4.2, 0.85); kitGlow(g, '#ffffff', 1.8, 0.9); } // (a thunderbolt)
    else if (kind === 'flame') { const f = emSprite(g, fxTex('flame'), 1.6, { blending: THREE.AdditiveBlending }); kitGlow(g, '#f97316', 2.6, 0.75); } // (a gout of fire)
    else if (kind === 'pumpkin') { const b = new THREE.Mesh(kSph(), new THREE.MeshPhongMaterial({ color: '#ea580c', emissive: '#f97316', emissiveIntensity: 0.55, shininess: 40 })); b.scale.set(0.75, 0.62, 0.75); g.add(b); const st = new THREE.Mesh(kCyl(), new THREE.MeshLambertMaterial({ color: '#3f6212' })); st.scale.set(0.08, 0.3, 0.08); st.position.y = 0.6; g.add(st); kitGlow(g, '#fb923c', 2.2, 0.8); const f = emSprite(g, fxTex('flame'), 1.3, { blending: THREE.AdditiveBlending }); f.position.z = 0.9; g.userData.spin = b; g.userData.spinAx = 'x'; } // (a jack-o'-lantern, alight)
    else if (kind === 'laugh') { kitGlow(g, '#84cc16', 2.8, 0.85); kitGlow(g, '#fef9c3', 0.9, 0.95); for (const z of [0.6, 1.3]) { const t2 = emSprite(g, fxTex('flame'), 1.3 - z * 0.3, { blending: THREE.AdditiveBlending, color: '#a3e635' }); t2.position.z = z; } } // (a laugh you can see: sickly green)
    else if (kind === 'chain') { const ir = metalMat('#4b5058', { shininess: 70 }); for (let k = 0; k < 6; k++) { const o = new THREE.Mesh(kTor(0.24), ir); o.scale.set(0.12, 0.2, 0.12); o.rotation.x = Math.PI / 2; if (k % 2) o.rotateY(Math.PI / 2); o.position.z = 0.35 + k * 0.32; g.add(o); } const hk = new THREE.Mesh(dkHookGeo(), ir); hk.scale.setScalar(1.8); hk.rotation.x = Math.PI / 2; g.add(hk); } // (Krampus's chain, the hook first)
    else if (kind === 'gaze') { kitGlow(g, '#4ade80', 3.2, 0.85); kitGlow(g, '#f0fdf4', 1.1, 0.95); const e = new THREE.Mesh(kSph(), new THREE.MeshBasicMaterial({ color: '#bbf7d0' })); e.scale.set(0.38, 0.24, 0.2); g.add(e); const pu = new THREE.Mesh(kSph(), new THREE.MeshBasicMaterial({ color: '#052e16' })); pu.scale.set(0.07, 0.22, 0.24); g.add(pu); } // (her gaze: a green eye of light)
    else if (kind === 'stone') { const b = new THREE.Mesh(kSph(), new THREE.MeshLambertMaterial({ color: '#78716c' })); b.scale.setScalar(0.28); g.add(b); } // (a sling stone)
    else if (kind === 'hitodama') { kitGlow(g, '#3b82f6', 2.4, 0.8); kitGlow(g, '#e0f2fe', 0.9, 0.95); const t2 = emSprite(g, fxTex('flame'), 1.2, { blending: THREE.AdditiveBlending, color: '#93c5fd' }); t2.position.z = 0.7; } // (a ghost-fire: a cold blue flame with a tail)
    else if (kind === 'grudge') { kitGlow(g, '#7c3aed', 2.8, 0.85); kitGlow(g, '#f5f3ff', 0.9, 0.9); for (const z of [0.6, 1.2]) { const t2 = emSprite(g, fxTex('flame'), 1.3 - z * 0.3, { blending: THREE.AdditiveBlending, color: '#a78bfa' }); t2.position.z = z; } } // (a vengeful spirit: violet, trailing)
    else if (kind === 'cannon') { const b = new THREE.Mesh(kSph(), metalMat('#1f2937', { shininess: 60 })); b.scale.setScalar(0.55); g.add(b); const t2 = emSprite(g, fxTex('flame'), 1.2, { blending: THREE.AdditiveBlending, color: '#fdba74' }); t2.position.z = 0.8; } // (a cannonball, hot from the gun)
    else if (kind === 'soul') { kitGlow(g, '#5eead4', 2.2, 0.85); kitGlow(g, '#ecfeff', 0.9, 0.95); const t2 = emSprite(g, fxTex('flame'), 1.0, { blending: THREE.AdditiveBlending, color: '#5eead4' }); t2.position.z = 0.6; } // (a wisp of soul)
    else if (kind === 'ice' || kind === 'hail') { const s2 = new THREE.Group(); g.add(s2); const m = new THREE.Mesh(kg('duIceB', () => new THREE.IcosahedronGeometry(1, 0)), new THREE.MeshPhongMaterial({ color: '#cfeeff', emissive: '#3b82f6', emissiveIntensity: 0.35, shininess: 150, specular: '#ffffff', transparent: true, opacity: 0.92, flatShading: true }));
      m.scale.setScalar(kind === 'ice' ? 1.25 : 0.45); s2.add(m); kitGlow(g, '#93c5fd', kind === 'ice' ? 3.6 : 1.4, 0.5); g.userData.spin = s2; } // (a boulder of ice, spinning; or a shard of hail)
    else if (kind === 'bomb') { const w = new THREE.Group(); g.add(w); dgBomb(w); g.userData.spin = w; g.userData.spinAx = 'x'; const f = emSprite(g, fxTex('flame'), 0.8, { blending: THREE.AdditiveBlending }); f.position.set(0, 0.5, 0); }
    else { const b = new THREE.Mesh(kSph(), new THREE.MeshBasicMaterial({ color: '#fde68a' })); b.scale.setScalar(0.18); g.add(b); const tr = new THREE.Mesh(kCyl(), new THREE.MeshBasicMaterial({ color: '#fef3c7', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending })); tr.scale.set(0.06, 5, 0.06); tr.rotation.x = Math.PI / 2; tr.position.z = 2.5; g.add(tr); }
    return g;
  }
  function spawnProj(F, ab, off, vis) {
    const yaw = F.yaw + off, dx = -Math.sin(yaw), dz = -Math.cos(yaw), T = foeOf(F), m = projModel(ab.model || 'arrow'), y0 = F.y + (F.lift || 0) + 4.2;
    const x0 = F.x + dx * 1.6, z0 = F.z + dz * 1.6, ty = T ? T.y + 3 * (T.C.big || 1) : y0, d = T ? Math.hypot(T.x - x0, T.z - z0) : 30, lob = ab.model === 'bomb', tt = Math.max(0.2, Math.min(d, 60) / ab.spd), gr = lob ? 32 : 0;
    const vy = lob ? (GROUND + 0.5 - y0) / tt + 0.5 * gr * tt : clamp((ty - y0) / tt, -20, 20); // (a grenade: thrown up so it comes down on them)
    m.position.set(x0, y0, z0); scene.add(m);
    DU.proj.push({ m, F, ab, x: x0, y: y0, z: z0, vx: dx * ab.spd, vy, vz: dz * ab.spd, gr, life: lob ? tt + 0.6 : 70 / ab.spd + 0.4, vis, fx: ab.fx });
    if (ab.model === 'ball') { burstAt(x0, y0, z0, '#fde68a', 4, 0.2); smokeAt(x0, y0, z0, 8, '#d1d5db', 1.6); sfx3('boom', F.x, F.z, 90, { vol: 0.8 }); camShake(F.a, 0.3); }
  }
  function projTick(dt) {
    for (const p of DU.proj) {
      const ox = p.x, oy = p.y, oz = p.z; p.vy -= (p.gr || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; // (where it was: a fast shot is checked along the whole way it went) p.life -= dt; p.m.position.set(p.x, p.y, p.z); p.m.lookAt(p.x + p.vx, p.y + p.vy, p.z + p.vz); p.m.rotateY(Math.PI);
      const sp = p.m.userData.spin; if (sp) sp.rotation[p.m.userData.spinAx || 'x'] += dt * 22;
      const H = foeOf(p.F), mine = p.F.kind === 'me'; if (H && !H.dead && !bval(H, 'inv') && (p.ab.model !== 'ball' || mine)) { const v = Math.hypot(p.vx, p.vz), a0 = Math.atan2(p.vx, p.vz), a1 = Math.atan2(H.x - p.x, H.z - p.z), turn = clamp(wrapA(a1 - a0), -1, 1) * Math.min(1, dt * 2.2 * (p.F.kind === 'bot' ? DIFF[p.F.D].aim : mine ? 2 : 1)); if (Math.abs(wrapA(a1 - a0)) < (mine ? 1.25 : 0.9)) { p.vx = Math.sin(a0 + turn) * v; p.vz = Math.cos(a0 + turn) * v; } } // (a little help: it bends towards them)
      if (p.ab.model === 'fire' && Math.random() < 0.5) burstAt(p.x, p.y, p.z, '#f97316', 1.2, 0.25);
      const T = foeOf(p.F);
      const bg = T ? T.C.big || 1 : 1;
      const sx = p.x - ox, sz = p.z - oz, sl = sx * sx + sz * sz, st = sl > 1e-6 ? clamp(((T ? T.x : 0) - ox) * sx / sl + ((T ? T.z : 0) - oz) * sz / sl, 0, 1) : 1, cx = ox + sx * st, cz = oz + sz * st, cy = oy + (p.y - oy) * st; // (the nearest it came to them this frame)
      if (T && !T.dead && Math.hypot(T.x - cx, T.z - cz) < (p.F.kind === 'me' ? 2.9 : 2.3) + bigR(T) && Math.abs(T.y + (T.lift || 0) + 3 * bg - cy) < 4.2 * bg) { p.life = 0; p.boom = 1; if (!p.vis) dealHitAs(p.F, T, p.ab.dmg, p.fx, p.ab); else burstAt(p.x, p.y, p.z, '#fff7ed', 2); }
      if (p.y < 0.2 || isFloor(p.x, p.z) > 1.15) { p.life = 0; smokeAt(p.x, 0.4, p.z, 3, '#c8a97e', 1.2);
        if (p.gr && !p.boom) { p.boom = 1; if (!p.vis && T && !T.dead && Math.hypot(T.x - p.x, T.z - p.z) < 4.5 + bigR(T)) dealHitAs(p.F, T, p.ab.dmg, p.fx, p.ab); } } // (a grenade bursts where it lands)
      if (p.life <= 0 && p.gr) { burstAt(p.x, Math.max(1, p.y), p.z, '#f97316', 7, 0.4); smokeAt(p.x, 0.6, p.z, 8, '#57534e', 2.4); sfx3('boom', p.x, p.z, 80, { vol: 0.7 }); ringAt(p.x, p.z, '#f97316', 5, 0.35); }
    }
    DU.proj = DU.proj.filter((p) => { if (p.life > 0) return true; scene.remove(p.m); return false; });
    for (const v of DU.volleys) { v.t += dt; if (v.F.kind === 'me' && !v.vis && v.t < v.ab.delay * 0.75) { const T = foeOf(v.F); if (T && !T.dead && !bval(T, 'inv')) { const k = Math.min(1, dt * 5); v.x += (T.x - v.x) * k; v.z += (T.z - v.z) * k; v.ring.position.x = v.x; v.ring.position.z = v.z; } } v.ring.material.opacity = 0.5 + 0.4 * Math.sin(v.t * 20); v.ring.scale.setScalar(v.ab.rad * (1 - 0.15 * Math.min(1, v.t / v.ab.delay)));
      while (v.n < v.ab.cnt && v.t >= v.ab.delay + v.n * 0.08) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * v.ab.rad, x = v.x + Math.cos(a) * r, z = v.z + Math.sin(a) * r, m = projModel(v.ab.model || 'arrow'); m.position.set(x + 3, 26, z + 3); scene.add(m);
        DU.drops.push({ m, x, z, y: 26, F: v.F, ab: v.ab, vis: v.vis, done: false }); v.n++; } }
    DU.volleys = DU.volleys.filter((v) => { if (v.n < v.ab.cnt) return true; scene.remove(v.ring); return false; });
    for (const d of DU.drops) { d.y -= 70 * dt; d.m.position.set(d.x + 3 * d.y / 26, d.y, d.z + 3 * d.y / 26); d.m.lookAt(d.x, -10, d.z); d.m.rotateY(Math.PI);
      if (d.y <= 0.5 && !d.done) { d.done = true; const cn = d.ab.model === 'cannon'; smokeAt(d.x, 0.4, d.z, cn ? 9 : 2, d.ab.model === 'hail' ? '#e0f2fe' : cn ? '#78716c' : '#c8a97e', cn ? 2.6 : 1); if (d.ab.model === 'hail') burstAt(d.x, 0.6, d.z, '#bfdbfe', 2.4, 0.25); if (cn) { burstAt(d.x, 1, d.z, '#fb923c', 6, 0.3); ringAt(d.x, d.z, '#fdba74', 7, 0.4); sfx3('boom', d.x, d.z, 90, { vol: 0.7 }); } const T = foeOf(d.F); if (T && !T.dead && Math.hypot(T.x - d.x, T.z - d.z) < (cn ? 3.6 : 2.3) + bigR(T)) { if (!d.vis) dealHitAs(d.F, T, d.ab.dmg, d.ab.model ? d.ab.fx || null : null, d.ab); } d.t = 1.5; } if (d.done) d.t -= dt; } // (the newer volleys — pila, hail — carry their effect)
    DU.drops = DU.drops.filter((d) => { if (!d.done || d.t > 0) return true; scene.remove(d.m); return false; });
  }

  /* ---------------- the bots ----------------
     They see your blow coming (after a moment: how long depends how good they are) and block or dodge it; keep to the
     range their weapon likes, circling; and use their abilities when they'd do the most good */
  function fSpeed(F) {
    if (stunned(F) || F.S.root > 0 || F.dead || !live()) return 0;
    let s = 16 * pv(F, 'spd') * bval(F, 'spdM') * (F.S.slow > 0 ? F.S.slowM : 1); if (F.blk) s *= 0.45;
    if (F.act) { const ab = F.act.ab; s *= ab.k === 'dash' || ab.k === 'leap' ? 0 : ab.b && ab.b.blk ? 0.5 : ab.k === 'buff' ? 0.6 : 0.4; }
    if (F.kind === 'bot') s *= DIFF[F.D].spdM; return s;
  }
  function abilityGood(F, ab, d, T) {
    if (ab.k === 'mimic') return d < 30; if (ab.k === 'mimic2') return !F.mimF && (d < 20 || T.hp / T.mhp > F.hp / F.mhp + 0.2); if (ab.k === 'blink') return d > 5 && d < ab.rng; if (ab.selfP) return F.hp / F.mhp > 0.3 && d < 14;
    if (ab.k === 'buff') { const b = ab.b; if (b.blk) return !!T.act && d < 12; if (b.heal || b.healP || b.hps) return F.hp / F.mhp < 0.65 || (b.def && d < 10); if (b.inv) return d < 18; return d < 14; }
    if (ab.k === 'dash') return ab.back ? d < 8 : d > 4 && d < ab.dist + 2;
    if (ab.k === 'leap') return d > 6 && d < ab.dist; if (ab.k === 'proj') return d < 45; if (ab.k === 'volley') return true;
    if (ab.k === 'stomp') return d < (ab.near || 0) + 2 + bigR(F) || d < ab.rad * 0.7;
    return d < (ab.rng || 6) + 0.6;
  }
  // possession: each frame, the possessed walk the way the spirit that has them is looking; the spirit, inside them, goes
  // where they go (unseen, nothing reaches it) until it lets go
  function possTick(F, dt) {
    if (F.S.pos > 0 && F.S.posBy && F.kind !== 'rem' && F.kind !== 'rboss') { const y = F.S.posBy.yaw, sp = 9 * dt; moveF(F, -Math.sin(y) * sp, -Math.cos(y) * sp); faceF(F, y); if (F.a && Math.random() < dt * 14) kitSpark(F.a, F.a.g, (Math.random() - 0.5) * 2, 1 + Math.random() * 4, (Math.random() - 0.5) * 1.5, '#5eead4', { v: [0, 1.5, 0], life: 0.9, s: 0.3, grow: 1.2, op: 0.6, j: 0.5 }); }
    if (F.S.fear > 0 && F.S.fearBy && F.kind !== 'rem' && F.kind !== 'rboss') { const B = F.S.fearBy, dx = F.x - B.x, dz = F.z - B.z, l = Math.hypot(dx, dz) || 1, sp = 10 * dt; moveF(F, dx / l * sp, dz / l * sp); faceF(F, angOf(dx, dz)); if (F.a && Math.random() < dt * 10) kitSpark(F.a, F.a.g, (Math.random() - 0.5) * 2, 5 + Math.random(), (Math.random() - 0.5) * 1.5, Math.random() < 0.5 ? '#fb923c' : '#a3e635', { v: [0, 1.2, 0], life: 0.7, s: 0.3, op: 0.6, j: 0.4 }); } // (terrified: away from him, as fast as they can)
    if (F.S.cu > 0 && F.a && Math.random() < dt * 10) kitSpark(F.a, F.a.g, (Math.random() - 0.5) * 2.4, 1 + Math.random() * 4, (Math.random() - 0.5) * 1.6, Math.random() < 0.5 ? '#a78bfa' : '#4c1d95', { v: [0, 1.2, 0], life: 0.8, s: 0.3, grow: 1.2, op: 0.55, j: 0.4 }); // (a grudge on them)
    const inside = F.possEnd && F.possEnd > performance.now() && F.possT && !F.possT.dead;
    if (inside && (F.kind === 'me' || F.kind === 'bot')) { const T = F.possT; if (F.kind === 'me') { P.x = T.x; P.z = T.z; } F.x = T.x; F.z = T.z; if (F.kind === 'bot') F.yaw += dt * 1.1; }
    if (inside && F.a) { F.a.g.visible = false; F.wasIn = 1; } else if (F.wasIn) { if (F.a) F.a.g.visible = true; F.wasIn = 0; } if (!inside && F.possEnd) { F.possEnd = 0; F.possT = null; }
  }
  function botTick(F, dt) {
    if (F.S.pos > 0 || F.S.fear > 0) { F.mv = true; F.blk = false; return; } // (possessed or terrified: it isn't theirs to move)
    if (F.S.stone > 0) { F.mv = false; F.blk = false; return; } // (stone)
    const T = foeOf(F), D = DIFF[F.D], B = F.bot || (F.bot = { t: 0.5, str: 1, strT: 0, seen: -1, blkT: 0, react: null, lx: 0, lz: 0 });
    F.mv = false; F.sprint = false;
    if (F.jT > 0) { F.jT -= dt; F.lift = F.jT > 0 ? Math.sin(Math.PI * (1 - F.jT / 0.75)) * 4.2 : 0; } // (jumping a shockwave)
    else if (!F.act) for (const w of DU.waves) { if (w.F === F || w.hit.has(F) || w.bj.has(F)) continue; const d = Math.hypot(F.x - w.x, F.z - w.z); if (d > w.r && d - w.r < 4.5 && d > w.min) { w.bj.add(F); if (Math.random() < [0.3, 0.55, 0.8, 0.95][F.D]) F.jT = 0.75; } }
    if (!T || F.dead || !live()) { F.blk = false; return; }
    const inv = bval(T, 'inv') > 0; if (!inv) { B.lx = T.x; B.lz = T.z; } // (lost in the smoke: where they were last)
    const dx = (inv ? B.lx : T.x) - F.x, dz = (inv ? B.lz : T.z) - F.z, d = Math.max(0.01, Math.hypot(dx, dz)), yawTo = angOf(dx, dz);
    if (T.act && T.acN !== B.seen && !T.act.vis0) { B.seen = T.acN; B.react = D.react * (0.7 + Math.random() * 0.6) * (F.S.fog > 0 ? 2.2 : 1); B.rab = T.act.ab; } // (fogged by a Screech: slow to see it coming)
    if (B.react != null && (B.react -= dt) <= 0) { B.react = null; const ab = B.rab, threat = ab.k !== 'buff' && (d < (ab.rng || 8) + 4 || ab.k === 'proj' || ab.k === 'dash' || ab.k === 'leap' || ab.k === 'volley');
      if (threat && !F.act && !stunned(F)) { const r = Math.random(); if (r < D.dodge) { const s = Math.random() < 0.5 ? 1 : -1; dodge(F, -dz / d * s - dx / d * 0.5, dx / d * s - dz / d * 0.5); } else if (r < D.dodge + D.guard && ab.k !== 'volley' && F.st > 30) { F.blk = true; B.blkT = 0.45 + Math.random() * 0.4; } } }
    if (B.blkT > 0 && ((B.blkT -= dt) <= 0 || F.st <= 0 || F.act)) { F.blk = false; B.blkT = 0; }
    const md = F.C.ab[0].split && F.C.ab[0].modes; if (md && !F.act) { const g = md.findIndex((q) => q.k === 'proj'), bl = g ? 0 : 1, gcd = F.mode === g ? F.cd[0] : (F.mcd && F.mcd[g]) || 0, k = d < 8 || (d < 13 && gcd > 0.5) ? bl : d > 11 ? g : F.mode; if (k !== F.mode) swapMode(F, k); } // (a musket: the bayonet when they're close, or while it reloads)
    const m1 = abOf(F, 0), ranged = m1.k === 'proj', want = ranged ? (md ? 14 : 18) : (m1.rng || 6) * 0.72;
    if ((B.strT -= dt) <= 0) { B.strT = 1 + Math.random() * 2.2; B.str = Math.random() < 0.5 ? 1 : -1; }
    let mx = 0, mz = 0; if (d > want + 1.5) { mx += dx / d; mz += dz / d; F.sprint = d > 22 && F.st > 40 && !F.blk; } else if (d < want - 2.5) { mx -= dx / d; mz -= dz / d; }
    const orb = d < want + 6 ? 0.75 : 0.25; mx += -dz / d * B.str * orb; mz += dx / d * B.str * orb;
    if (!F.act || F.act.ab.k === 'buff') { const turn = 3 + D.aim * 9; F.yaw += clamp(wrapA(yawTo - F.yaw), -turn * dt, turn * dt); }
    if ((B.t -= dt) <= 0 && !F.act && !F.blk && !stunned(F)) { B.t = D.react * 0.55 + Math.random() * 0.3;
      for (let i = F.C.ab.length - 1; i >= 1; i--) { if (F.cd[i] > 0 || Math.random() > D.abil) continue; if (abilityGood(F, abOf(F, i), d, T)) { useAb(F, i); break; } }
      if (!F.act && F.cd[0] <= 0 && Math.random() < D.aggr && (ranged ? d < 45 : d < (m1.rng || 6) + 1.2) && Math.abs(wrapA(yawTo - F.yaw)) < (ranged ? 0.25 : 0.7)) useAb(F, 0); }
    const l = Math.hypot(mx, mz), sp = fSpeed(F) * (F.sprint ? 1.45 : 1);
    if (l > 0.1 && sp > 0) { F.mv = true; moveF(F, mx / l * sp * dt, mz / l * sp * dt); }
  }
  // ❄️ the Wendigo boss's mind: the nearest of you, its five blows each on its own clock (faster while Self Cannibal's on)
  function wenBossTick(F, dt) {
    const B = F.bot || (F.bot = { t: [2.5, 6, 9, 11, 15] }), Ts = targetsOf(F); F.mv = false; if (!Ts.length || F.dead || !live()) return;
    let T = Ts[0], bd = 1e9; for (const q of Ts) { const d = Math.hypot(q.x - F.x, q.z - F.z) + (q.S.sp > 0 ? 8 : 0); if (d < bd) { bd = d; T = q; } }
    F.tgt = T; const dx = T.x - F.x, dz = T.z - F.z, d = Math.max(0.01, Math.hypot(dx, dz)), yawTo = angOf(dx, dz);
    if (!F.act && !stunned(F)) F.yaw += clamp(wrapA(yawTo - F.yaw), -2.4 * dt, 2.4 * dt);
    const k = bval(F, 'cdM'); for (let i = 0; i < 5; i++) B.t[i] -= dt * k; const reach = 9 + bigR(F), facing = Math.abs(wrapA(yawTo - F.yaw)) < 0.6;
    if (!F.act && !stunned(F)) {
      if (B.t[2] <= 0) { useAb(F, 2); B.t[2] = 15; }
      else if (B.t[4] <= 0 && d > 8 && d < 26 + bigR(F)) { useAb(F, 4); B.t[4] = 20; }
      else if (B.t[3] <= 0 && d > 6 && d < 22 + bigR(F) && facing) { useAb(F, 3); B.t[3] = 20; }
      else if (B.t[1] <= 0 && d < reach && facing) { useAb(F, 1); B.t[1] = 10; }
      else if (B.t[0] <= 0 && d < reach && facing) { useAb(F, 0); B.t[0] = 5; } }
    if (F.a && stageOf(F) >= 3 && Math.random() < dt * (stageOf(F) === 4 ? 9 : 4)) kitSpark(F.a, F.a.g, (Math.random() - 0.5) * 2, 3 + Math.random() * 4, (Math.random() - 0.5) * 1.2, '#7f1d1d', { v: [0, -3, 0], life: 0.7, s: 0.35, op: 0.85, j: 0.3, flat: true }); // (it bleeds)
    const sp = fSpeed(F); if (!F.act && d > 7 + bigR(F) && sp > 0) { F.mv = true; moveF(F, dx / d * sp * dt, dz / d * sp * dt); }
  }
  function bossTick(F, dt) {
    const B = F.bot || (F.bot = { sw: 3.5, stp: 7 }), Ts = targetsOf(F); F.mv = false; if (!Ts.length || F.dead || !live()) return;
    let T = Ts[0], bd = 1e9; for (const q of Ts) { const d = Math.hypot(q.x - F.x, q.z - F.z) + (q.S.sp > 0 ? 8 : 0); if (d < bd) { bd = d; T = q; } }
    F.tgt = T; const dx = T.x - F.x, dz = T.z - F.z, d = Math.max(0.01, Math.hypot(dx, dz)), yawTo = angOf(dx, dz);
    if (!F.act && !stunned(F)) F.yaw += clamp(wrapA(yawTo - F.yaw), -1.8 * dt, 1.8 * dt);
    if (!B.rage && F.hp < F.mhp * 0.5) { B.rage = 1; F.dmgM = (F.dmgM || 1) * 1.25; floatText(F, '😡 ENRAGED', 'big'); DU.say(F, '😡 THE GIANT IS ENRAGED — FASTER, HARDER'); ringAt(F.x, F.z, '#ef4444', 22, 0.7); burstAt(F.x, 9, F.z, '#f87171', 9, 0.5); sfx3('horn', F.x, F.z, 90); camShake(me, 0.5); } // (at half health: +25% damage, and it swings and stamps a third more often)
    const rg = B.rage ? 0.7 : 1; B.sw -= dt; B.stp -= dt;
    if (!F.act && !stunned(F)) { if (B.sw <= 0 && d < 10 + bigR(F) && Math.abs(wrapA(yawTo - F.yaw)) < 0.5) { useAb(F, 0); B.sw = (F.C.swing || 6) * rg; } else if (B.stp <= 0) { useAb(F, 1); B.stp = (F.C.stomp || 8) * rg; } }
    if (B.rage && F.a && Math.random() < dt * 8) kitSpark(F.a, F.a.g, (Math.random() - 0.5) * 3, 2 + Math.random() * 6, (Math.random() - 0.5) * 2, Math.random() < 0.6 ? '#ef4444' : '#fca5a5', { v: [0, 2, 0], life: 0.8, s: 0.5, grow: 1.4, op: 0.6, j: 0.6 }); // (red heat off it)
    const sp = fSpeed(F); if (!F.act && d > 8 + bigR(F) && sp > 0) { F.mv = true; moveF(F, dx / d * sp * dt, dz / d * sp * dt); }
  }
  /* ---------------- the HUD (as drawn: you on the left, them on the right, the clock between; your abilities bottom left) ---------------- */
  const KEYS = touchy ? ['TAP', 'TAP', 'TAP', 'TAP', 'TAP'] : ['M1', 'E', 'R', 'G', 'V'], KEYN = ['M1', 'E', 'R', 'G', 'V'];
  function hudBuild(M) {
    const el = document.createElement('div'); el.id = 'duHud'; const F = M.me, md = F.C.ab[0].modes;
    el.innerHTML = `<div id="duTop"><div class="du-card me" id="duMe"></div><div id="duMid"></div><div class="du-card op" id="duOp"></div></div>
      <div id="duHurt"></div><div id="duBig"></div><div id="duKill"></div>
      <div id="duAb">${md ? `<div class="du-side">${md.map((m, k) => `<button data-mode="${k}"><b>${k + 1}</b>${m.ic} ${m.n}</button>`).join('')}</div>` : ''}
        ${F.C.ab.map((_, i) => `<button class="du-ab${i === 0 ? ' m1' : i === F.C.ab.length - 1 ? ' ult' : ''}" data-ab="${i}"><span class="k">${KEYS[i]}</span><span class="e"></span><span class="n"></span><span class="cd"></span><span class="s"></span></button>`).join('')}
        <div class="du-side"><button data-k="dodge"><b>${touchy ? '' : 'Q'}</b>💨 Dodge</button><button data-k="block"><b>${touchy ? '' : 'F'}</b>🛡️ Block</button>${touchy ? '<button data-k="run">🏃 Sprint</button>' : ''}<button data-k="lock"><b>${touchy ? '' : 'T'}</b>🎯 Lock</button><button data-k="hb"><b>${touchy ? '' : 'H'}</b>🟥 Hitboxes</button></div></div>
      <div id="duTip">🖱️ Click: ${esc(abOf(F, 0).n)} · E ${esc(F.C.ab[1].n)} · R ${esc(F.C.ab[2].n)}${F.C.ab[3] ? ` · G ${esc(F.C.ab[3].n)}` : ''}${F.C.ab[4] ? ` · V ${esc(F.C.ab[4].n)}` : ''} · Space jump · Q dodge · F / right-click block · Shift sprint${md ? ` · ${md.map((m, k) => k + 1).join('/')} switch` : ''} · T lock-on · H hitboxes</div>`;
    $('#xhud').append(el); HUD.el = el; HUD.last = {};
    const ab = el.querySelector('#duAb');
    ab.addEventListener('pointerdown', (e) => { const b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation();
      if (b.dataset.ab) { DU.tryAb(+b.dataset.ab); if (b.dataset.ab === '0') { DU.lmb = true; DU.lmbPid = e.pointerId; } } else if (b.dataset.mode) DU.setMode(+b.dataset.mode); else if (b.dataset.k === 'dodge') DU.tryDodge(); else if (b.dataset.k === 'block') DU.blockHeld = true;
      else if (b.dataset.k === 'run') DU.touchRun = !DU.touchRun; else if (b.dataset.k === 'lock') DU.toggleLock(); else if (b.dataset.k === 'hb') DU.toggleOpt('hb'); });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) ab.addEventListener(ev, (e) => { const b = e.target.closest && e.target.closest('button'); if (b && b.dataset.k === 'block') DU.blockHeld = false; if (e.pointerId === DU.lmbPid) { DU.lmb = false; DU.lmbPid = null; } }); // (holding the M1 button swings again and again, as holding the mouse does)
  }
  function hudCard(F, who) {
    const C = F.C, hp = Math.max(0, Math.ceil(F.hp)), st = Math.round(F.st), fx = [];
    if (F.S.stun > 0) fx.push('<span class="bad">💫 Stunned</span>'); if (F.S.root > 0) fx.push('<span class="bad">🕸️ Rooted</span>'); if (F.S.slow > 0) fx.push('<span class="bad">🐌 Slowed</span>');
    if (F.S.dots.some((d) => d.k === 'bl')) fx.push('<span class="bad">🩸 Bleed</span>'); if (F.S.dots.some((d) => d.k === 'bu')) fx.push('<span class="bad">🔥 Burn</span>'); if (F.S.vuln > 0) fx.push('<span class="bad">⚠️ +50% dmg</span>'); if (F.S.cu > 0) fx.push('<span class="bad">👺 Grudge</span>'); if (F.S.fear > 0) fx.push('<span class="bad">😱 Terrified</span>'); if (F.S.stone > 0) fx.push('<span class="bad">🗿 Stone</span>'); if (F.S.fog > 0) fx.push('<span class="bad">🌫️ Fogged</span>'); if (F.S.chill > 0) fx.push('<span class="bad">❄️ Chilled</span>');
    if (F.mim) fx.push(`<span class="good">🎭 ${esc(F.mim.ab.n)} ${Math.ceil(F.mim.t)}s</span>`); if (F.mimF) fx.push(`<span class="good">🧬 ${{ h: 'Health', b: 'Block', p: 'Passives' }[F.mimF.k]} ${Math.ceil(F.mimF.t)}s</span>`); if (pv(F, 'stages')) fx.push(`<span class="${stageOf(F) > 1 ? 'bad' : 'good'}">🩸 Stage ${stageOf(F)}</span>`); if (F.S.crush) fx.push('<span class="bad">💢 Crushed ×2</span>'); if (F.S.sp > 0) fx.push('<span class="good">✨ Protected</span>');
    if (F.C.wish && F.wishN) fx.push(`<span class="good">🪓 Wish +${F.wishN * 10}%</span>`); if (F.S.buffs.some((b) => b.an === 'haste')) fx.push('<span class="good">🩸 ×1.2 speed</span>');
    for (const b of F.S.buffs) { const ab = C.ab.find((q) => q.an === b.an); if (ab) fx.push(`<span class="good">${ab.ic} ${esc(ab.n)}</span>`); } if (F.blk) fx.push('<span class="good">🛡️ Blocking</span>');
    return `<div class="tp"><span class="who">[${esc(who)}]</span><span class="ch">${C.ic} ${esc(C.n)}</span><span class="rr" style="background:${RAR[C.r].c}">${RAR[C.r].s} ${RAR[C.r].n.toUpperCase()}</span></div>
      <div class="hl"><span>Hp</span><div class="du-bar hp${hp / F.mhp < 0.25 ? ' low' : ''}"><u style="width:${(F.hpLag || hp) / F.mhp * 100}%"></u><i style="width:${hp / F.mhp * 100}%"></i><b>${hp}/${F.mhp}</b></div></div>
      <div class="du-bar st${F.st < 25 ? ' tired' : ''}"><i style="width:${st}%"></i><b>Stamina ${st}/100</b></div><div class="fx">${fx.join('')}</div>`;
  }
  function hudTick(M, dt) {
    if (!HUD.el) return; for (const F of [M.me, M.foe, ...M.allies]) if (F && F.a) { if (pv(F, 'stages')) F.a.wdStage = stageOf(F); if (F.C.skin) F.a.swMim = !!(F.mim || F.mimF); } // (🩸 the Wendigo's wounds, on its body; 🎭 the Skinwalker's eyes while it wears another's power)
    if (DU.pick && (DU.pick.t -= dt) <= 0) DU.pickDo(-1); const L = HUD.last, me = M.me, foe = M.foe;
    for (const F of [me, foe]) { F.hpLag = F.hpLag == null || F.hp > F.hpLag ? F.hp : F.hpLag - Math.max(F.mhp * 0.4 * dt, 0); if (F.hpLag < F.hp) F.hpLag = F.hp; }
    const a = hudCard(me, 'You'), b = hudCard(foe, M.md === 'b' ? (M.wen ? '❄️ BOSS' : '👹 BOSS') : M.pvp ? nameOf(M.opp) : `🤖 ${DIFF[M.D].n}`);
    if (a !== L.a) { $('#duMe').innerHTML = L.a = a; } if (b !== L.b) { $('#duOp').innerHTML = L.b = b; }
    const left = Math.max(0, M.left), sc = M.md === 'b' ? `<span class="sc"><span class="a">❤️ ${M.lv}</span><small>${M.lv === 1 ? 'life' : 'lives'}</small>${M.coop ? `<span class="b">👥 ${1 + M.allies.filter((q) => !q.out && !q.gone).length}</span>` : ''}</span><span class="md">${M.wen ? '❄️' : '👹'} Boss · ${M.coop ? 'together vs' : 'you vs'} the ${M.wen ? 'Wendigo' : 'Laestrygonian'}</span>` : M.md === 'c' ? `<span class="sc"><span class="a">${M.sc[0]}</span><small>—</small><span class="b">${M.sc[1]}</span></span><span class="md">⚔️ Classic · first to ${TO} · round ${M.rd}</span>` : `<span class="sc"><span class="a">${M.kills}</span><small>kills</small><span class="b">${M.deaths}</span></span><span class="md">💀 Deathmatch · most kills</span>`;
    const mid = `<div class="tm${left < 20 && M.ph === 'fight' ? ' low' : ''}">${mmss(Math.ceil(left))}</div>${sc}`; if (mid !== L.m) $('#duMid').innerHTML = L.m = mid;
    for (let i = 0; i < me.C.ab.length; i++) { const ab = abOf(me, i), b = HUD.el.querySelector(`[data-ab="${i}"]`), cd = me.cd[i], mi = i === 1 && me.mim, mf = i === 3 && me.mimF, nm = mi ? `${ab.n} (Mimic) ${Math.ceil(me.mim.t)}s left` : mf ? `${{ h: 'Health', b: 'Block', p: 'Passives' }[me.mimF.k]} ${Math.ceil(me.mimF.t)}s left` : ab.n, key = `${ab.ic}|${nm}|${cd > 0 ? Math.ceil(cd * (cd < 1 ? 10 : 1)) : 0}|${Math.round(cd / me.cdMax[i] * 40)}|${canAct(me)}`;
      if (L['ab' + i] === key) continue; L['ab' + i] = key; b.querySelector('.e').textContent = ab.ic; b.querySelector('.n').textContent = nm; b.classList.toggle('mim', !!(mi || mf)); b.querySelector('.cd').style.setProperty('--p', (cd > 0 ? cd / me.cdMax[i] * 100 : 0) + '%'); b.querySelector('.s').textContent = cd > 0 ? (cd < 1 ? cd.toFixed(1) : Math.ceil(cd)) : ''; b.classList.toggle('ready', cd <= 0); }
    HUD.el.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('on', +b.dataset.mode === me.mode));
    const lk = HUD.el.querySelector('[data-k="lock"]'); if (lk) lk.classList.toggle('on', !!DU.lockOn); const hb = HUD.el.querySelector('[data-k="hb"]'); if (hb) hb.classList.toggle('on', !!opt('hb')); const rn = HUD.el.querySelector('[data-k="run"]'); if (rn) rn.classList.toggle('on', !!DU.touchRun); const bk = HUD.el.querySelector('[data-k="block"]'); if (bk) bk.classList.toggle('on', !!me.blk);
  }
  function big(text, sub, color, hold = 1.7) { const b = $('#duBig'); if (!b) return; b.innerHTML = text ? `${text}${sub ? `<small>${sub}</small>` : ''}` : ''; b.style.color = color || '#fff'; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); clearTimeout(HUD.bigT); HUD.bigT = setTimeout(() => { if (b.isConnected) b.innerHTML = ''; }, hold * 1000); }
  function feed(html) { const k = $('#duKill'); if (!k) return; const d = document.createElement('div'); d.innerHTML = html; k.prepend(d); setTimeout(() => d.remove(), 5000); while (k.children.length > 4) k.lastChild.remove(); }

  // a fighter's picture for the menus and the crate reel: in its guard, weapon in hand
  /* ---------------- a fighter's numbers: DPS, and bars against the whole roster ----------------
     DPS: 30 s against a foe standing in front of them, every blow used as it comes off cooldown (a damage buff first,
     then whatever hits hardest; the M1 in its best mode), buffs and passives counted — bleeds and burns, critical hits,
     the Wish's stacks, Crushed (double damage once it lands), the killing stroke. Attack: the M1's damage a blow. Attack
     speed: its hits a second. Defense: health lasts this many times as long (1 ÷ damage taken). Overall: out of 10,
     from DPS, toughness (health × defense), speed and attack speed */
  function fStats(C) {
    const T = 30, dt = 0.05, m1s = C.ab[0].modes ? C.ab[0].modes.map((m) => Object.assign({}, C.ab[0], m, { modes: null })) : [C.ab[0]];
    const hitsOf = (ab) => ab.k === 'multi' || ab.k === 'combo' ? ab.hits.slice() : ab.k === 'proj' || ab.k === 'volley' ? Array(ab.cnt || 1).fill(ab.dmg) : ab.k === 'dash' ? [ab.dmg || 0].concat(ab.then ? Array(ab.then.cnt || 1).fill(ab.then.dmg) : []).filter((x) => x > 0) : ab.k === 'stomp' ? [ab.crush || ab.dmg] : ab.k === 'buff' || ab.k === 'mimic2' ? [] : ab.k === 'mimic' ? [ab.est || 0] : [ab.dmg || 0];
    const boosts = (ab) => ab.k === 'buff' && ab.b && ((ab.b.dmgM || 1) > 1 || ab.b.dmgA || (ab.b.cdM || 1) > 1 || ab.b.nx);
    let best = null;
    for (const m1 of C.ab[0].split ? [m1s[0]] : m1s) {
      const sp = C.ab[0].split ? m1s.length : 0, abs = (sp ? m1s : [m1]).concat(C.ab.slice(1)), cd = abs.map(() => 0), buffs = [], dots = {}; let lastM = -1, t = 0, busy = 0, dmg = 0, wish = 0, nx = 0, n = 0, crushed = 0;
      const mult = (k) => buffs.reduce((m, b) => (b.end > t && b[k] ? m * b[k] : m), 1), add = (k) => buffs.reduce((m, b) => (b.end > t && b[k] ? m + b[k] : m), 0);
      while (t < T) {
        for (const k in dots) if (dots[k].end > t) dmg += dots[k].rate * dt * (1 + crushed);
        const cm = mult('cdM'); for (let i = 0; i < cd.length; i++) cd[i] = Math.max(0, cd[i] - dt * cm);
        if (busy <= 0) { let pick = -1, bv = -1;
          for (let i = 0; i < abs.length; i++) { if (cd[i] > 0) continue; const ab = abs[i], v = ab.k === 'buff' ? (boosts(ab) ? 1e9 : -1) : hitsOf(ab).reduce((a, b) => a + b, 0); if (v > bv && v > 0) { bv = v; pick = i; } }
          if (pick >= 0) { const ab = abs[pick]; cd[pick] = ab.cd + (ab.k === 'mimic' ? ab.dur || 0 : 0); busy = ab.k === 'mimic' ? 0.3 : actDur(ab); if (pick < sp) { if (lastM >= 0 && pick !== lastM) busy += 0.4; lastM = pick; } // (a split weapon: a moment to switch)
            if (ab.k === 'buff') { buffs.push(Object.assign({ end: t + (ab.b.dur || 0) }, ab.b)); if (ab.b.nx) nx = ab.b.nx; }
            else { for (const h of hitsOf(ab)) { let d = (h + add('dmgA')) * mult('dmgM') * (C.wish ? 1 + 0.1 * wish : 1) * (1 + crushed); if (nx) { d *= nx; nx = 0; } if (C.crit) d *= 1 + C.crit[0] * (C.crit[1] - 1); dmg += d; n++; if (C.wish) wish++; if (C.brute) crushed = 1 - Math.pow(1 - C.brute, n); }
              if (ab.k === 'stomp' && ab.crush) crushed = 1;
              const fx = ab.fx || {}; if (fx.bl) dots.bl = { end: t + busy + fx.bl[1], rate: fx.bl[0] / fx.bl[1] * (fx.blc != null ? fx.blc : 1) }; if (fx.bu) dots.bu = { end: t + busy + fx.bu[1], rate: fx.bu[0] / fx.bu[1] }; } } }
        busy -= dt; t += dt;
      }
      const dps = dmg / T * (C.exe ? 1 / (1 - C.exe[0] + C.exe[0] / C.exe[1]) : 1) * (C.stages ? 1.3 : 1) * C.ab.reduce((m, ab) => m * (ab.fx && ab.fx.vu ? 1 + 0.5 * Math.min(1, ab.fx.vu / ab.cd) : 1), 1), h = hitsOf(m1); // (and a foe made vulnerable takes ×1.5 for a while) // (stages: +25% a stage as it's hurt — about 1.3× over a fight)
      if (!best || dps > best.dps) best = { dps, atk: h.reduce((a, b) => a + b, 0), aspd: h.length / Math.max(0.2, m1.cd), m1: m1.n, hits: n };
    }
    // how long they last: health, armour, and what their blows and buffs add — blocks and damage cut while they're up,
    // heals, lifesteal, the Wish's heal on every hit — and how much of the fight their stuns, roots and slows take away
    let red = 1, heal = 0, ctrl = 0;
    for (const ab of C.ab.flatMap((q) => (q.modes ? q.modes.map((m) => Object.assign({}, q, m)) : [q]))) { const per = T / Math.max(0.3, ab.cd, actDur(ab)) / (ab.modes || C.ab[0] === ab ? 1 : 1), b = ab.b, fx = ab.fx || {};
      if (ab.k === 'mimic2') red *= 1 - 0.25 * Math.min(1, (ab.dur || 0) / (ab.cd + (ab.dur || 0))); if (ab.selfP) heal -= ab.selfP * C.hp * per; if (ab.drain) heal += (ab.dmg || 0) * ab.drain * per; if (ab.maul) ctrl += (T / 6) * 1.2; // (Mimic Form: another's health or block for a while; Self Cannibal's cost; Endless Hunger's drain; the Maul's curses)
      if (ab.k === 'buff' && b) { const up = Math.min(1, (b.dur || 0) / ab.cd); if (b.def) red *= 1 - (1 - b.def) * up; if (b.blk) red *= 1 - 0.85 * up; heal += ((b.heal || 0) + (b.healP || 0) * C.hp + (b.hps || 0) * (b.dur || 0) + (b.ls || 0) * best.dps * (b.dur || 0)) * per; }
      ctrl += ((fx.st || 0) + (fx.rt || 0) * 0.6 + (fx.sl ? fx.sl[1] * (1 - fx.sl[0]) : 0) + (fx.kb ? 0.4 : 0)) * per * (C.ab[0].modes && C.ab[0].modes.includes && false ? 0.5 : 1); }
    if (C.regen) heal += C.regen[0] * C.hp * T * 0.15; if (C.aura) ctrl += T * 0.5 * (1 - C.aura[1]); if (C.wish) heal += 0.1 * C.hp * best.hits; if (C.lsP) heal += C.lsP * best.dps * T; if (C.stunP) ctrl += best.hits * C.stunP[0] * C.stunP[1]; if (C.frost) ctrl += Math.min(T, best.hits * C.frost[1]) * (1 - C.frost[0]);
    for (const ab of C.ab) { if (ab.fx && ab.fx.pos) ctrl += ab.fx.pos * T / Math.max(ab.cd, 1); if (ab.fx && ab.fx.cu) ctrl += ab.fx.cu * 0.4 * T / Math.max(ab.cd, 1); if (ab.fx && ab.fx.fr) ctrl += ab.fx.fr * T / Math.max(ab.cd, 1); if (ab.fx && ab.fx.pt) ctrl += ab.fx.pt * T / Math.max(ab.cd, 1); if (ab.fx && ab.fx.pl) ctrl += 0.5 * T / Math.max(ab.cd, 1); if (ab.drain) heal += ab.dmg * T / ab.cd; } if (C.rage) best.dps *= 1 + (C.rage[1] - 1) * C.rage[0];
    const cf = Math.min(0.5, ctrl / T), def = 1 / (C.def * red);
    return Object.assign(best, { hp: C.hp, spd: C.spd, def, armor: 1 / C.def, guard: red < 1, ctrl: cf, ehp: (C.hp + heal) * def / (1 - cf) });
  }
  let FST = null;
  function fStatsAll() { // (everyone's, and the roster's lows and highs for the bars; an overall rating out of 10)
    if (FST) return FST; const L = CH.map(fStats), rng = {}, LOG = { dps: 1, atk: 1, hp: 1, ehp: 1 }; // (those spread widest go on a log scale, so the giant doesn't squash everyone else)
    for (const k of ['dps', 'atk', 'aspd', 'hp', 'spd', 'def', 'ehp', 'ctrl']) { const v = L.map((x) => x[k]); rng[k] = [Math.min(...v), Math.max(...v)]; }
    const nrm = (k, v) => { const [a, b] = rng[k]; return LOG[k] ? clamp(Math.log(v / a) / Math.max(1e-6, Math.log(b / a)), 0, 1) : clamp((v - a) / Math.max(1e-6, b - a), 0, 1); };
    for (const x of L) x.pw = 0.42 * nrm('dps', x.dps) + 0.33 * nrm('ehp', x.ehp) + 0.1 * nrm('ctrl', x.ctrl) + 0.08 * nrm('spd', x.spd) + 0.07 * nrm('aspd', x.aspd);
    const p1 = Math.max(...L.map((x) => x.pw)); for (const x of L) x.ov = Math.max(1, Math.round((1 + 9 * x.pw / p1) * 10) / 10);
    return (FST = { L, rng, nrm, bar: (k, v) => 8 + 92 * nrm(k, v) });
  }
  function fighterPic(c, big) {
    return snapshot(`duPic${c}|${AV.s}|${big ? 1 : 0}`, () => { const a = makeAvatar([AV.s, 0, 0, 0, 17, 0, 0, 0, 0, 0, 23 + c, 15 + c], '', true); scene.remove(a.shadow); for (let k = 0; k < 25; k++) animateAvatar(a, 0.1, false, false); return a.g; },
      { w: big ? 300 : 180, h: big ? 360 : 200, dir: [0.55, 0.12, -1], zoom: 0.9, sphere: c === LAE ? [[0, 4.4, 0], 5.9] : c === EXE ? [[0, 4.6, 0], 5.6] : [[0, 3.6, 0], 4.7] });
  }
  const rollFoe = (Di) => { const w = [[62, 30, 8, 0], [40, 35, 22, 3], [18, 30, 37, 15], [5, 18, 37, 40]][Di]; let r = Math.random() * 100, k = 0; while (k < 3 && r >= w[k]) { r -= w[k]; k++; } const pool = CH.filter((C) => C.r === k); return pool[Math.floor(Math.random() * pool.length)].i; };
  const DEF_SAVE = () => ({ own: [0], eq: 0, xp: {}, st: {}, ach: [], diff: 1, md: 'c', lk: 0, gold: 0, q: null, qd: 0, q2: null, q3: null, q4: null, rolls: 0, pity: 0, qn: 1, opt: {} });
  // ⚙️ the duel's options (saved with it): hitboxes shown, screen shake, damage numbers, the 🎯 aim mark
  const OPT_DEF = { hb: 0, shake: 1, num: 1, aim: 1, perf: 0 }, OPTS = [['perf', '🚀', 'Performance mode', 'For a smoother game on a slow computer or phone: the stands emptied, far fewer sparks, motes and smoke, no falling snow, graphics on Low.'], ['hb', '🟥', 'Show hitboxes', 'Every fighter’s body, each blow’s reach (amber as it winds up, red as it lands) and every shot’s hit sphere. H in a match.'], ['shake', '📳', 'Screen shake', 'The camera jolts on big hits, stomps and shots.'], ['num', '🔢', 'Damage numbers', 'The numbers that pop up over whoever’s hit.'], ['aim', '🎯', 'Aim mark', 'The mark on your opponent that turns green when a shot will hit (ranged fighters).']];
  const opt = (k) => { const o = DU.save && DU.save.opt; return o && o[k] != null ? o[k] : OPT_DEF[k]; };
  const camShake = (a, k) => { if (opt('shake')) window.camShake(a, k); }; // (Bloxverse's own, unless it's switched off) // (lk: lock-on, off unless you turn it on; gold: the duel's own; q: the Executioner's Contract)

  const DU = {
    id: 'duel', code: 'du', genre: 'PvP', rank: 0.001, name: 'Colosseum Duels', emoji: '⚔️', max: 12, stat: 'Wins', killY: -40, banner: true, camDist: 15, noReset: true, noSprint: true, respawnDelay: 2200, r6: false, // (r6: rigid limbs for everyone in here — off: the fighters are R15 again, knees and elbows bending)
    land: { theme: 'meadow', mode: 'ground', fence: 'none', box: [-86, -76, 86, 166] },
    color: 'linear-gradient(135deg,#7f1d1d,#b45309 45%,#1e3a8a)',
    desc: 'One on one in the Colosseum. Thirty-two fighters from Greece, Rome, medieval Europe, medieval Japan, the Ottoman Empire and the Mongols, ★ to ★★★★★ — win them from crates (Blox Coins or the duel’s own gold; each with a 1% legend) or the duel’s own achievements. Beat the giant Laestrygonian boss in co-op to make it yours, or take the Executioner’s Contract. Classic (first to 3), Deathmatch or the Boss, against friends or bots from Easy to Extreme. Master a fighter to wear it anywhere.',
    welcome: '⚔️ Pick a fighter (C), open crates, then stand on a pad to duel, team up on the 👹 boss pad — or 🤖 fight a bot. In a match: click to attack, E R G abilities, Q dodge, F block, Space jump.',
    welcomeTouch: '⚔️ Pick a fighter, open crates, then stand on a pad to duel — or 🤖 fight a bot.',
    M: null, proj: [], volleys: [], drops: [], waves: [], save: null,
    build() { sky('#4f86c6', '#fde7c2'); buildColosseum(); SC.lobG = buildLobby(); SC.win = null; },
    async enter() {
      Object.assign(this, { M: null, proj: [], volleys: [], drops: [], waves: [], hitSeenM: new Map(), bac: null, passT: 0, padT: 0, padI: -1, done: new Set(), hitN: 0, hitSeen: 0, acN: 0, ac: null, dq: [], H: null, lastG: null, gSeen: null, blockHeld: false, rmb: false, touchRun: false, sprinting: false, tired: false, duAt: 0, duKey: '', warm: 0 });
      const s = await kvGet('duel'), S = this.save = Object.assign(DEF_SAVE(), s && typeof s === 'object' ? s : {});
      S.own = [...new Set((Array.isArray(S.own) ? S.own : []).map((x) => x | 0).filter((x) => x >= 0 && x < CH.length))]; if (!S.own.includes(0)) S.own.unshift(0);
      if (!S.own.includes(S.eq | 0)) S.eq = 0; S.eq |= 0; for (const k of ['xp', 'st']) if (!S[k] || typeof S[k] !== 'object') S[k] = {}; if (!Array.isArray(S.ach)) S.ach = []; S.diff = clamp(S.diff | 0, 0, 3); if (S.md !== 'd' && S.md !== 'b') S.md = 'c';
      S.gold = Math.max(0, S.gold | 0); for (const Q of QUESTS) if (!S[Q.key] || typeof S[Q.key] !== 'object') S[Q.key] = null; S.rolls = Math.max(0, S.rolls | 0); S.pity = clamp(S.pity | 0, 0, PITY_N - 1); // (rolls: crates opened; pity: since the last legendary)
      this.lockOn = S.lk === 1; send({ dw: S.st.wins | 0, du: null }); this.passCheck(); this.drawBar(); this.perfApply();
    },
    leave() {
      if (this.M) { for (const F of [this.M.me, this.M.foe]) if (F && F.stoneM) stoneFx(F, false); this.cleanMatch(); } this.M = null; AVO = null; P.frozen = false;
      for (const p of this.proj) scene.remove(p.m); for (const v of this.volleys) scene.remove(v.ring); for (const d of this.drops) scene.remove(d.m); for (const w of this.waves) scene.remove(w.g);
      this.shopClose(); FXQ.lite = false; dropTrail(me); const r = $('#duReel'); if (r) r.remove(); document.body.classList.remove('duMatch'); if (this.saveT) { clearTimeout(this.saveT); kvSet('duel', this.save); }
    },
    dirty() { clearTimeout(this.saveT); this.saveT = setTimeout(() => { this.saveT = null; kvSet('duel', this.save); }, 700); },
    statOf(pr, isMe) { return isMe ? (this.save ? this.save.st.wins | 0 : 0) : +pr.dw || 0; },
    sortKey(pr, isMe) { return this.statOf(pr, isMe); },
    spawn() {
      const M = this.M;
      if (M && M.ph !== 'end') { if (M.md === 'b') return [-11 + (Math.random() - 0.5) * 5, 0.5, (Math.random() - 0.5) * 12, -Math.PI / 2]; if (M.md === 'd' && M.started) { const s = this.randSpot(M.foe); s[3] = cam.yaw; return s; } const s = M.side; return [s ? 18 : -18, 0.5, 0, s ? Math.PI / 2 : -Math.PI / 2]; }
      return [(Math.random() - 0.5) * 12, 0.5, 122 + LZ + Math.random() * 6, 0];
    },
    randSpot(avoid) { for (let k = 0; k < 40; k++) { const a = Math.random() * Math.PI * 2, r = 0.25 + Math.sqrt(Math.random()) * 0.6, x = Math.cos(a) * A0 * r, z = Math.sin(a) * B0 * r;
      if (!avoid || Math.hypot(x - avoid.x, z - avoid.z) > 20 || k === 39) return [x, 0.5, z, angOf((avoid ? avoid.x : 0) - x, (avoid ? avoid.z : 0) - z)]; } },
    camRoom(tx, ty, tz, ux, uy, uz, dist) { // (the podium, the seats rising behind it and the attic: the camera comes in front of them)
      if (!this.M) return dist; const hTop = YTOP + 0.8;
      for (let d = 0.6; d < dist; d += 0.5) { const x = tx + ux * d, y = ty + uy * d, z = tz + uz * d, rho = Math.sqrt((x / PA) ** 2 + (z / PB) ** 2); if (Math.abs(z) < 6 && Math.abs(x) > PA - 2.5 && y < 19) return Math.max(0.6, d - 0.4); if (rho <= 0.985) continue; // (the gates' gold statues, too)
        const dd = (rho - 1) * Math.hypot(x, z) / rho, h = dd > ROWS.end ? FH + 2 : Math.min(hTop, 6.4 + Math.max(0, dd - 1.2) * 0.86); if (y < h + 0.6) return Math.max(0.6, d - 0.4); }
      return dist;
    },
    speed() { const M = this.M; if (!M) return 16; return fSpeed(M.me) * (this.sprinting ? 1.45 : 1); },
    jumpPower() { const M = this.M; if (!M) return JUMP; const F = M.me; return stunned(F) || F.S.root > 0 || F.act || F.blk || F.out ? 0 : JUMP * 0.9; },

    /* ---------------- the host: pairs up people standing on the same pad ---------------- */
    adopt() { const g = this.lastG; return { gs: 0, left: 0, el: 0, M: g && Array.isArray(g.M) ? g.M.slice() : [] }; },
    host() {
      const H = this.H; if (!H) return; const pl = players(), t = Date.now(); let ch = false;
      const busy = new Set(H.M.flatMap((m) => m.p));
      PADS.forEach((pd) => { const on = pl.filter((p) => !busy.has(p.peer) && Math.hypot(p.x - pd.x, p.z - pd.z) < 6 && !(p.pr.du && p.pr.du.m));
        if (pd.md === 'b') { // (two or more of you on the boss pad: a few seconds for anyone else to step on, then in you all go)
          if (on.length < 2) { H.bT = 0; return; } H.bT = H.bT || t;
          if (t - H.bT > 6000 || on.length >= 4) { const m = { id: Math.random().toString(36).slice(2, 9), md: 'b', p: on.slice(0, 4).map((q) => q.peer), t }; H.M.push(m); m.p.forEach((x) => busy.add(x)); H.bT = 0; ch = true; }
          return; }
        if (on.length >= 2) { const m = { id: Math.random().toString(36).slice(2, 9), md: pd.md, p: [on[0].peer, on[1].peer], t }; H.M.push(m); busy.add(m.p[0]); busy.add(m.p[1]); ch = true; } });
      const keep = H.M.filter((m) => { const there = m.p.filter((id) => { const p = pl.find((q) => q.peer === id); return p && p.pr.du && p.pr.du.m === m.id; }).length; return t - m.t < 15000 || (there > 0 && t - m.t < 900000); });
      if (keep.length !== H.M.length) { H.M = keep; ch = true; }
      if (ch || performance.now() - (this.hsAt || 0) > 1000) { this.hsAt = performance.now(); hostSend(this); }
    },

    tick(dt) {
      const t = now();
      CROWD.u.uT.value = t; CROWD.ex = Math.max(0, CROWD.ex - dt * 0.3); CROWD.u.uAmp.value = 0.03 + CROWD.ex * 0.75; CROWD.u.uCheer.value = 0.06 + CROWD.ex * 0.94; sceneryTick(t, dt);
      SC.crates.forEach((c, i) => { c.c.position.y = 3.7 + 0.25 * Math.sin(t * 1.6 + i); c.c.rotation.y = 0.35 * Math.sin(t * 0.7 + i); c.c.userData.gl.material.opacity = 0.28 + 0.12 * Math.sin(t * 3 + i); });
      SC.padFx.forEach((p, i) => { p.glow.material.opacity = 0.35 + 0.3 * Math.sin(t * 3 + i * 1.5); });
      const g = roundState(this);
      if (this.M) { this.matchFrame(dt); return; }
      if (this.warm < 20 && !panelOpen()) fighterPic(this.warm++); // (the menus' pictures, one a frame)
      const mine = myPeer(), m = g && Array.isArray(g.M) ? g.M.find((q) => Array.isArray(q.p) && q.p.includes(mine) && !this.done.has(q.id)) : null;
      if (m) { if (m.md === 'b') this.startMatch({ md: 'b', coop: true, mid: m.id, ps: m.p.slice(0, 4), own: m.p[0] === mine }); else this.startMatch({ md: m.md === 'd' ? 'd' : 'c', pvp: true, mid: m.id, opp: m.p.find((x) => x !== mine), side: m.p.indexOf(mine) }); return; }
      if ((this.passT -= dt) <= 0) { this.passT = 5; this.passCheck(); }
      const pi = PADS.findIndex((p) => Math.hypot(P.x - p.x, P.z - p.z) < 6) ;
      if (pi !== this.padI) { this.padI = pi; this.padT = 0; if (pi >= 0) sfx('select'); }
      const S = this.save, D = DIFF[S.diff];
      if (pi >= 0 && !P.dead && PADS[pi].md === 'b') { this.padT += dt; const pd = PADS[pi], others = [...Net.avatars.values()].filter((a) => Math.hypot(a.g.position.x - pd.x, a.g.position.z - pd.z) < 6).length;
        setBanner(others ? `👹 BOSS · 👥 ${others + 1} of you here — the fight starts in a moment (up to 4)` : `👹 BOSS · ⏳ Waiting for allies — on your own it starts in ${Math.max(1, Math.ceil(10 - this.padT))}s`);
        if ((!others && this.padT > 10) || this.padT > 30) { this.padT = 0; this.startMatch({ md: 'b', coop: false, own: true, ps: [mine] }); } }
      else if (pi >= 0 && !P.dead) { this.padT += dt; setBanner(`${PADS[pi].n} · ⏳ Waiting for an opponent — a ${D.e} ${D.n} bot takes the spot in ${Math.max(1, Math.ceil(8 - this.padT))}s`);
        if (this.padT > 8) { this.padT = 0; this.startMatch({ md: PADS[pi].md, pvp: false, D: S.diff }); } }
      else setBanner(`${CH[S.eq].ic} <b>${esc(CH[S.eq].n)}</b> · stand on a ⚔️ pad to duel, or 🤖 fight a bot`);
    },

    /* ---------------- a match ---------------- */
    startMatch(o) {
      closePanel(); const S = this.save, c = S.eq, M = this.M = Object.assign({ ph: 'intro', t: 0, left: o.md === 'd' ? DM_T : o.md === 'b' ? BOSS_T : ROUND_T, rd: 1, sc: [0, 0], dr: 0, l: 0, fl: 0, d: 0, kills: 0, deaths: 0, dealt: 0, roundsWon: 0, side: 0, goneT: 0, started: false, allies: [], ps: [], lv: BOSS_LIVES, res: 0, cam0: cam.dist }, o);
      M.me = newFighter(c, 'me', { name: Net.name }); this.hitSeenM = new Map(); this.bac = null;
      const seen = (pid) => { const pr = Net.peers.find((x) => x.peer === pid), q = pr && pr.presence && Array.isArray(pr.presence.dq) ? pr.presence.dq : []; this.hitSeenM.set(pid, Math.max(0, ...q.map((h) => (Array.isArray(h) ? +h[0] || 0 : 0)))); };
      if (o.md === 'b') { // the boss: whoever's first runs it; its health grows with each of you
        M.allies = M.ps.filter((x) => x !== myPeer()).map((x) => Object.assign(newFighter(0, 'rem', { peer: x, name: nameOf(x) }), { acSeen: -1 })); M.ps.forEach(seen);
        M.wen = o.wen != null ? !!o.wen : o.mid ? strHash(String(o.mid)) % 10 === 0 : Math.random() < 0.1; const np = Math.max(1, M.ps.length); // (❄️ 1 in 10: the Wendigo)
        if (M.wen) { M.foe = newFighter(WEN, M.own ? 'boss' : 'rboss', { C: BOSS_W, hpM: 1 + 0.75 * (np - 1), name: '❄️ The Wendigo', peer: M.ps[0] || null }); M.foe.av = [5, 0, 0, 0, 17, 0, 0, 0, 0, 0, 23 + WEN, 15 + WEN]; this.winterOn(); }
        else { M.foe = newFighter(LAE, M.own ? 'boss' : 'rboss', { C: BOSS_C, hpM: 1 + 0.5 * (np - 1), name: '👹 Laestrygonian Colossus', peer: M.ps[0] || null }); M.foe.av = [5, 0, 0, 0, 17, 0, 0, 0, 0, 0, LAE_BOSS_BT, DUEL_AN + LAE]; } } // (in silver, bronze and gold; half as much health again for each of you after the first)
      else if (o.pvp) { M.foe = newFighter(0, 'rem', { peer: o.opp, name: nameOf(o.opp) }); M.foe.acSeen = -1; seen(o.opp); }
      else { const D = DIFF[o.D], fc = rollFoe(o.D); M.foe = newFighter(fc, 'bot', { D: o.D, hpM: D.hpM, dmgM: D.dmgM, name: `🤖 ${CH[fc].n}` }); M.side = Math.random() < 0.5 ? 0 : 1; M.foe.av = [Math.floor(Math.random() * 5), 0, 0, 0, 17, 0, 0, 0, 0, 0, 23 + fc, 15 + fc]; }
      this.respawnDelay = M.md === 'd' ? 450 : M.md === 'b' ? 2500 : 1e9;
      setAvOverride({ av: [AV.s, AV.sh, AV.p, 0, AV.f, 0, 0, 0, 0, 0, 23 + c, 15 + c] });
      cam.dist = Math.max(cam.dist, CH[c].big ? 19 : M.md === 'b' ? 18 : 15); // (room to see a giant)
      document.body.classList.add('duMatch'); setBar(''); setBanner(''); hudBuild(M); this.resetRound(true);
      this.bump('played', 1); sfx('horn'); if (o.pvp || M.coop) this.pubDu(true);
    },
    revive(F) { Object.assign(F, { hp: F.mhp, st: 100, dead: false, act: null, blk: false, push: null, lift: 0, nx: 0, rTaken: 0, wishN: 0, jT: 0 }); F.S = { stun: 0, root: 0, slow: 0, slowM: 1, vuln: 0, ifr: 0, sp: 0, crush: 0, dots: [], buffs: [] }; },
    botAvatar(F) { if (F.a) { dropTrail(F.a); dropAvatar(F.a); } F.a = makeAvatar(F.av, F.name, false); F.a.dgMode = F.mode; scene.add(F.a.g); F.a.g.position.set(F.x, 0, F.z); F.a.g.rotation.y = F.yaw; },
    resetRound(first) {
      const M = this.M; for (const F of [M.me, M.foe]) { if (F && F.stoneM) stoneFx(F, false); endMimics(F); } this.pickDo(-1); M.ph = 'intro'; M.t = 0; M.toT = null; M.toWait = 0; M.left = M.md === 'd' ? DM_T : M.md === 'b' ? (M.wen ? WEN_T : BOSS_T) : ROUND_T; M.base = { l: M.l, fl: this.foeL() };
      if (first && M.wen) { setTimeout(() => { if (this.M === M) { big('❄️ THE WENDIGO', 'something was hunting in the winter forest…', '#bae6fd', 3.2); sfx('horn'); } }, 400); }
      for (const F of [M.me, M.foe]) { this.revive(F); F.cd = F.C.ab.map(() => 0); }
      for (const p of this.proj) scene.remove(p.m); for (const v of this.volleys) scene.remove(v.ring); for (const d of this.drops) scene.remove(d.m); for (const w of this.waves) scene.remove(w.g); this.proj = []; this.volleys = []; this.drops = []; this.waves = [];
      const cy = cam.yaw; respawn(true); M.me.x = P.x; M.me.z = P.z; M.me.yaw = P.yaw; if (!first) cam.yaw = cy; // (the camera stays where you had it)
      if (M.foe.kind === 'bot') { const s = 1 - M.side; Object.assign(M.foe, { x: s ? 18 : -18, z: 0, yaw: s ? Math.PI / 2 : -Math.PI / 2 }); this.botAvatar(M.foe); }
      if (isBoss(M.foe)) { Object.assign(M.foe, { x: 16, z: 0, yaw: Math.PI / 2 }); this.botAvatar(M.foe); big('👹 THE LAESTRYGONIAN', `${M.coop ? 'beat it together' : 'beat it'} — ${BOSS_LIVES} lives each · jump its stomps, get behind its blade`, '#fca5a5', 2.6); this.pubDu(true); return; }
      big(M.md === 'd' ? '💀 DEATHMATCH' : `ROUND ${M.rd}`, M.md === 'd' ? 'most kills in 5:00 — you come back at once' : M.sc[0] === TO - 1 && M.sc[1] === TO - 1 ? 'FINAL ROUND' : `first to ${TO}`, '#fde68a'); if (!first) sfx('horn');
      this.pubDu(true);
    },
    foeDu(any) { const M = this.M, p = M && Net.peers.find((q) => q.peer === M.opp), du = p && p.presence && p.presence.du; return du && (any || du.m === M.mid) ? du : null; },
    foeL() { const M = this.M; if (!M.pvp) return M.fl; const du = this.foeDu(); return du ? du.l | 0 : M.flSeen || 0; },
    matchFrame(dt) {
      const M = this.M, F = M.me, T = M.foe; M.t += dt;
      this.syncF(F); this.syncF(T); if (M.pvp) this.mirror(T, dt); if (T.kind === 'rboss') this.mirrorBoss(T, dt); for (const A of M.allies) { this.syncF(A); this.mirrorAlly(A, dt); } if (!this.M) return;
      // my hands: blocking, sprinting
      const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y, r = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x, moving = Math.hypot(f, r) > 0.2;
      F.blk = (this.blockHeld || this.rmb || !!keys.KeyF) && live() && !F.act && !stunned(F) && F.st > 0 && !F.dead;
      if (this.lmb && M.ph === 'fight' && !F.act && F.cd[0] <= 0 && !F.blk && canAct(F) && !$('#duRes')) this.tryAb(0); // (holding the M1: the next swing as soon as it's ready)
      if (F.st <= 0) this.tired = true; else if (F.st > 30) this.tired = false;
      this.sprinting = (sprintHeld() || this.touchRun) && moving && !this.tired && !F.blk && !F.act && live() && fSpeed(F) > 0;
      // mid-attack you keep facing the blow; with shift lock (or first person) on, your swing and your aim follow the camera as you turn it — a dash or a leap is already on its way
      if (F.act && F.act.ab.k !== 'buff' && !F.act.vis) { const k = F.act.ab.k; if (lockFacing() && !this.lockOn && k !== 'dash' && k !== 'leap' && live()) F.act.yaw += wrapA(cam.yaw - F.act.yaw) * Math.min(1, dt * 12); P.yaw = F.yaw = F.act.yaw; }
      if (M.ph === 'intro') { if (M.t > 1.7 && !M.fightSaid) { M.fightSaid = 1; big('⚔️ FIGHT!', '', '#fef3c7'); } if (M.t > 2.6) { M.ph = 'fight'; M.t = 0; M.started = true; M.fightSaid = 0; sfx('go'); CROWD.ex = 1; } }
      else if (M.ph === 'fight') {
        M.left -= dt; if (M.pvp || M.coop) this.recvHits();
        trackVel(F, dt); trackVel(T, dt); statusTick(F, dt); actTick(F, dt); statusTick(T, dt); possTick(F, dt); possTick(T, dt); aimMark(F, T, M, dt); hbTick(M); for (const A of M.allies) possTick(A, dt);
        if (T.kind === 'bot') { if (!T.dead) { botTick(T, dt); actTick(T, dt); } } else if (T.kind === 'boss') { if (!T.dead) { (T.C.wenBoss ? wenBossTick : bossTick)(T, dt); actTick(T, dt); } } else actTick(T, dt);
        for (const A of M.allies) { statusTick(A, dt); actTick(A, dt); }
        projTick(dt); wavesTick(dt);
        if (M.md === 'b') this.bossFrame(dt);
        else if (M.md === 'd') {
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
      if (isBoss(T) && T.tele) { const A = T.act; if (!A || A.t >= (A.ab.wind || 0)) { scene.remove(T.tele); T.tele = null; } else { const k = clamp(A.t / Math.max(0.05, A.ab.wind || 0.05), 0, 1), f = T.tele.userData.fill; T.tele.material.opacity = 0.45 + 0.4 * Math.sin(A.t * (14 + 18 * k)); if (f) { f.scale.setScalar(Math.max(0.01, k)); f.material.opacity = 0.16 + 0.3 * k; } } } // (the warning on the sand, until the blow)
      if ((T.kind === 'bot' || isBoss(T)) && T.a) { if (T.a.dead) updateDead(T.a, dt); else { T.a.g.position.set(T.x, T.y + (T.lift || 0), T.z); T.a.g.rotation.y = T.yaw; animateAvatar(T.a, T.S.stone > 0 ? 0 : T.sprint ? dt * 1.4 : dt, !!T.mv, (T.lift || 0) > 0.5); placeShadow(T.a); } }
      // lock-on: the camera keeps them in view and you face them
      if (this.lockOn && !T.dead && !bval(T, 'inv') && M.ph !== 'end') { const ty = angOf(T.x - P.x, T.z - P.z); cam.yaw += wrapA(ty + 0.32 - cam.yaw) * Math.min(1, dt * 5); if (!this.sprinting && !(F.act && F.act.ab.k !== 'buff') && !F.push && live()) P.yaw = F.yaw = ty; }
      if (M.ph !== 'end' && !P.dead) { [P.x, P.z] = clampArena(P.x, P.z, 1.6 * (F.C.big || 1)); F.x = P.x; F.z = P.z; } // (the podium wall: nobody walks out of the arena)
      P.frozen = M.ph !== 'fight' || stunned(F) || F.S.root > 0 || !!F.push || F.dead || F.out || !!(F.act && (F.act.ab.k === 'dash' || F.act.ab.k === 'leap'));
      // nobody else in the arena but the two of you
      for (const [peer, a] of Net.avatars) { const ally = M.allies.find((q) => q.peer === peer); a.g.visible = (M.pvp && peer === M.opp && !(T.S.buffs.some((b) => b.inv))) || !!(ally && !ally.out && !ally.S.buffs.some((b) => b.inv)); if (a.pet) a.pet.g.visible = false; }
      if (T.kind === 'bot' && T.a) T.a.g.visible = !bval(T, 'inv');
      this.pubDu(); hudTick(M, dt); const tip = $('#duTip'); if (tip && M.rd === 1 && M.t > 12 && M.ph === 'fight') tip.style.opacity = 0;
    },
    syncF(F) {
      if (F.kind === 'me') { if (F.a !== me) { dropTrail(F.a); F.a = me; } F.x = P.x; F.y = P.y; F.z = P.z; if (!F.act || F.act.ab.k === 'buff') F.yaw = P.yaw; }
      else if (F.kind === 'rem') { const a = Net.avatars.get(F.peer) || null; if (F.a !== a) { dropTrail(F.a); F.a = a; } if (a) { F.x = a.g.position.x; F.y = a.g.position.y; F.z = a.g.position.z; F.yaw = a.g.rotation.y; } }
      if (F.a) F.a.dgMode = F.mode;
    },
    // the other player (or an ally): their numbers from what they say, their blows played out here for the look of it
    mirrorF(F, du) {
      if (CH[du.c] && du.c !== F.c) { F.c = du.c | 0; F.C = CH[F.c]; }
      F.hp = clamp(+du.hp || 0, 0, 5000); F.mhp = Math.max(1, +du.mhp || F.C.hp); F.st = clamp(+du.st || 0, 0, 100); F.mode = du.mo | 0; const sx = String(du.sx || '');
      F.blk = sx.includes('b'); F.S.stun = sx.includes('s') ? 0.3 : 0; F.S.root = sx.includes('r') ? 0.3 : 0; F.S.slow = sx.includes('w') ? 0.3 : 0; F.S.crush = sx.includes('c') ? 1 : 0; F.S.sp = sx.includes('p') ? 0.3 : 0;
      F.S.buffs = (Array.isArray(du.bf) ? du.bf : []).slice(0, 4).map((an) => ({ an: String(an), t: 0.3, inv: an === 'smoke' ? 1 : undefined }));
      if (Array.isArray(du.ac) && du.ac[0] !== F.acSeen) { const first = F.acSeen === -1; F.acSeen = du.ac[0];
        if (!first) { if (du.ac[3]) { smokeAt(F.x, 0.6, F.z, 5, '#e7d3a8', 1.6); sfx3('whoosh', F.x, F.z, 50); } else if (du.ac[1] >= 0 && du.ac[1] < F.C.ab.length) { F.mode = du.ac[2] | 0; F.act = null; useAb(F, du.ac[1] | 0, true); if (F.act && F.act.ab.k === 'volley') { F.act.tx = +du.ac[4] || 0; F.act.tz = +du.ac[5] || 0; } } } }
      if (Array.isArray(du.mm)) { const key = du.mm.join(); if (!F.mim || F.mim.key !== key) { const q = mimicFromNet(du.mm); F.mim = q ? { ab: q, t: 10, key, mm: du.mm } : null; } if (F.mim) F.mim.t = 10; } else F.mim = null; // (🎭 what their Skinwalker wears, so its blows look right here)
      F.dead = !!du.dead; F.out = !!du.out;
    },
    mirror(F, dt) {
      const M = this.M, du = this.foeDu();
      if (!du) { M.goneT += dt; if (M.goneT > (M.started ? 5 : 12) && M.ph !== 'end') { feed('🏳️ They left the arena — you win'); this.endMatch(1); } return; }
      M.goneT = 0; M.flSeen = du.l | 0; const dead0 = F.dead; this.mirrorF(F, du); F.dead = dead0;
      const d = du.d | 0; if (F.dSeen == null) F.dSeen = d;
      if (d > F.dSeen) { F.dSeen = d; M.kills++; this.bump('kills', 1); this.qBump('k', 1); quest('duel.kill'); feed(`⚔️ You defeated <b>${esc(nameOf(M.opp))}</b>`); big('⚔️ KO!', '', '#fde68a'); CROWD.ex = 1; sfx('kill'); }
      F.dead = !!du.dead;
    },
    mirrorAlly(F, dt) {
      const p = Net.peers.find((q) => q.peer === F.peer), du = p && p.presence && p.presence.du;
      if (!du || du.m !== this.M.mid) { F.gT = (F.gT || 0) + dt; if (F.gT > 6 && !F.gone) { F.gone = true; feed(`🏳️ <b>${esc(F.name)}</b> left the fight`); } return; }
      F.gT = 0; F.gone = false; this.mirrorF(F, du);
    },
    bossDu() { const M = this.M, p = Net.peers.find((q) => q.peer === M.ps[0]), du = p && p.presence && p.presence.du; return du && du.m === M.mid && du.bs && typeof du.bs === 'object' ? du.bs : null; },
    mirrorBoss(F, dt) {
      const M = this.M, bs = this.bossDu();
      if (!bs) { M.goneT += dt; if (M.goneT > (M.started ? 6 : 15) && M.ph !== 'end') { feed('🏳️ The boss’s host left — the fight is off'); this.endMatch(0); } return; }
      M.goneT = 0; const k = Math.min(1, dt * 10), x0 = F.x, z0 = F.z; if (!F.mx) { F.x = +bs.x || 0; F.z = +bs.z || 0; F.mx = 1; }
      F.x += ((+bs.x || 0) - F.x) * k; F.z += ((+bs.z || 0) - F.z) * k; F.yaw += wrapA((+bs.yaw || 0) - F.yaw) * k; F.mv = Math.hypot(F.x - x0, F.z - z0) > dt * 0.8;
      F.hp = clamp(+bs.hp || 0, 0, 1e5); F.mhp = Math.max(1, +bs.mhp || F.mhp); const sx = String(bs.sx || ''); F.S.stun = sx.includes('s') ? 0.3 : 0; F.S.crush = sx.includes('c') ? 1 : 0; F.S.vuln = sx.includes('v') ? 0.3 : 0;
      F.S.buffs = (Array.isArray(bs.bf) ? bs.bf : []).slice(0, 4).map((an) => ({ an: String(an), t: 0.3 }));
      if (Array.isArray(bs.ac) && bs.ac[0] !== F.acSeen) { const first = F.acSeen == null; F.acSeen = bs.ac[0]; if (!first && bs.ac[1] >= 0 && bs.ac[1] < F.C.ab.length) { F.act = null; useAb(F, bs.ac[1] | 0, true); } }
      F.tgt = bs.tg === myPeer() ? M.me : M.allies.find((A) => A.peer === bs.tg) || M.me;
    },
    // the boss fight, every frame: back from a death (protected for 2 s), and — if it's yours to run — how it ends
    bossFrame(dt) {
      const M = this.M, F = M.me, B = M.foe;
      if (F.dead && !P.dead && !F.out) { this.revive(F); F.x = P.x; F.z = P.z; F.S.sp = 2; burstAt(P.x, 3, P.z, '#fde68a', 6); floatText(F, '✨ PROTECTED FOR 2 s', 'tag'); this.pubDu(true); }
      if (B.hp <= 0) B.deadT = (B.deadT || 0) + dt; // (❄️ the Wendigo's death plays out before the result)
      if (M.own) { const res = B.hp <= 0 ? (M.wen && !(B.deadT > 2.6) ? 0 : 1) : [F, ...M.allies].every((q) => q.out || q.gone) || M.left <= 0 ? -1 : 0;
        if (res) { if (res < 0 && M.left <= 0) feed('⏰ Out of time'); M.res = res; this.pubDu(true); this.endMatch(res); } }
      else { const bs = this.bossDu(); if (bs && bs.res) this.endMatch((bs.res | 0) > 0 ? 1 : -1); }
    },
    // the hits the others say they've landed: on me — or, if the boss is mine to run, on the boss
    recvHits() {
      const M = this.M, mine = myPeer(), ids = M.coop ? M.ps.filter((x) => x !== mine) : [M.opp];
      for (const pid of ids) { const pr = Net.peers.find((x) => x.peer === pid), q = pr && pr.presence && Array.isArray(pr.presence.dq) ? pr.presence.dq : []; let seen = this.hitSeenM.get(pid) || 0;
        const from = M.coop ? (pid === M.ps[0] && !M.own ? M.foe : M.allies.find((A) => A.peer === pid) || M.foe) : M.foe;
        for (const h of q) { if (!Array.isArray(h) || !(+h[0] > seen)) continue; seen = +h[0]; if (h[4] !== M.mid) continue;
          const fx = h[3] && typeof h[3] === 'object' ? h[3] : {}, dmg = clamp(+h[2] || 0, 0, 5000);
          if (h[5] === 'b') { if (M.foe.kind === 'boss') takeHit(M.foe, dmg, fx, from, { rf: !!fx.rf }); } else if (h[1] === mine) takeHit(M.me, dmg, fx, from, { rf: !!fx.rf }); }
        this.hitSeenM.set(pid, seen); }
    },
    sendHit(T, dmg, fx, F) { this.hitN++; this.dq = this.dq.concat([[this.hitN, T.peer, dmg, fx || {}, this.M.mid, T.kind === 'rboss' ? 'b' : 0]]).slice(-16); send({ dq: this.dq }); },
    pubAct(F, A, kind) { this.acN++; this.ac = [this.acN, A ? A.i : -1, F.mode, kind === 'dodge' ? 1 : 0, A && A.tx != null ? Math.round(A.tx) : 0, A && A.tz != null ? Math.round(A.tz) : 0]; this.pubDu(true); },
    fStatsAll() { return fStatsAll(); },
    pubDu(force) {
      const M = this.M; if (!M || !(M.pvp || M.coop)) return; const F = M.me, B = M.foe;
      const du = { m: M.mid, c: F.c, hp: Math.max(0, Math.round(F.hp)), mhp: F.mhp, st: Math.round(F.st), l: M.l, d: M.d, dead: F.dead ? 1 : 0, ac: this.ac, mo: F.mode,
        sx: (F.blk ? 'b' : '') + (F.S.stun > 0 ? 's' : '') + (F.S.root > 0 ? 'r' : '') + (F.S.slow > 0 ? 'w' : '') + (F.S.crush ? 'c' : '') + (F.S.sp > 0 ? 'p' : ''), bf: F.S.buffs.map((b) => b.an).slice(0, 4), mm: F.mim ? F.mim.mm : 0, mf: F.mimF ? F.mimF.k : 0 };
      if (M.coop) { du.lv = M.lv; du.out = F.out ? 1 : 0; }
      if (M.coop && M.own) du.bs = { hp: Math.max(0, Math.round(B.hp)), mhp: B.mhp, x: +B.x.toFixed(2), z: +B.z.toFixed(2), yaw: +B.yaw.toFixed(2), ac: this.bac, tg: B.tgt ? (B.tgt.kind === 'me' ? myPeer() : B.tgt.peer) : '', res: M.res || 0,
        sx: (B.S.stun > 0 ? 's' : '') + (B.S.crush ? 'c' : '') + (B.S.vuln > 0 ? 'v' : ''), bf: B.S.buffs.map((b) => b.an).slice(0, 4) };
      const key = JSON.stringify(du), t = now(); if (key === this.duKey || (!force && t - this.duAt < 0.1)) return; this.duKey = key; this.duAt = t; send({ du });
    },
    killed(T, from) {
      const M = this.M; if (!M || T.dead) return; T.dead = true; endMimics(T); if (T.kind === 'me') this.pickDo(-1); T.act = null; T.blk = false; T.S.dots = []; T.S.buffs = []; CROWD.ex = 1; sfx3('kill', T.x, T.z, 90);
      if (T.kind === 'me') { M.l++; M.d++; M.deaths++; M.ks = 0; die(); feed(`💀 <b>${esc(M.foe.name)}</b> defeated you`);
        if (M.md === 'b') { M.lv--; if (M.lv <= 0) { T.out = true; this.respawnDelay = 1e9; big('☠️ OUT OF LIVES', M.coop ? 'your allies fight on' : '', '#fca5a5', 2.5); } else big('☠️ DOWN', `❤️ ${M.lv} ${M.lv === 1 ? 'life' : 'lives'} left`, '#fca5a5'); }
        else big('☠️ DEFEATED', '', '#fca5a5'); this.pubDu(true); }
      else if (isBoss(T)) { M.kills++; if (T.a && !T.a.dead) scatter(T.a); if (M.wen) { feed('❄️ <b>The Wendigo</b> is down!'); big('❄️ THE WENDIGO FALLS', 'the winter forest is quiet', '#bae6fd', 3); } else { feed('👹 <b>The Laestrygonian Colossus</b> is down!'); big('👹 THE GIANT FALLS!', '', '#fde68a', 2.5); } camShake(me, 1); sfx('horn'); }
      else { M.fl++; M.kills++; T.respT = 0.6; if (M.md === 'd') { M.ks = (M.ks | 0) + 1; const st = this.save.st; if (M.ks > (st.dms | 0)) st.dms = M.ks; } this.bump('kills', 1); this.qBump('k', 1); quest('duel.kill'); if (T.a && !T.a.dead) scatter(T.a); feed(`⚔️ You defeated <b>${esc(T.name)}</b>`); big('⚔️ KO!', '', '#fde68a'); }
    },
    roundOver(r) {
      const M = this.M; M.ph = 'rend'; M.t = 0; M.sc = [this.foeL(), M.l]; CROWD.ex = 1;
      if (r > 0) { M.roundsWon++; quest('duel.round'); if (!(M.me.rTaken > 0)) { this.bump('flaw', 1); feed('✨ Flawless round!'); } big('🏆 ROUND WON', `${M.sc[0]} — ${M.sc[1]}`, '#86efac'); sfx('levelup'); petals(M.me.x, M.me.z, 60); }
      else if (r < 0) { big('ROUND LOST', `${M.sc[0]} — ${M.sc[1]}`, '#fca5a5'); sfx('lose'); } else big('DRAW', `${M.sc[0]} — ${M.sc[1]}`, '#e2e8f0');
      this.pubDu(true);
    },
    endMatch(r) {
      const M = this.M; if (!M || M.ph === 'end') return; for (const F of [M.me, M.foe]) { if (F && F.stoneM) stoneFx(F, false); endMimics(F); } this.pickDo(-1); M.ph = 'end'; M.t = 0; M.autoT = 25; P.frozen = true; const S = this.save;
      const boss = M.md === 'b', D = M.pvp || boss ? null : DIFF[M.D]; let coins = r > 0 ? (boss ? 120 : M.pvp ? 60 : D.coins) : r < 0 ? (M.pvp || boss ? 15 : 8) : 20; coins += M.roundsWon * 5 + (M.md === 'd' ? M.kills * 3 : 0);
      const xp = Math.round((M.dealt / 10 + M.kills * 25 + M.roundsWon * 40 + (r > 0 ? 120 : 30)) * (boss ? 1.6 : M.pvp ? 1.5 : [0.6, 1, 1.3, 1.6][M.D]));
      const gold = (boss ? (r > 0 ? 150 : 25) : r > 0 ? (M.pvp ? 60 : [20, 30, 45, 60][M.D]) : r < 0 ? 10 : 15) + M.kills * 3; S.gold = (S.gold | 0) + gold; // (the duel's own gold: crates)
      if (r > 0) { this.bump('wins', 1); this.qBump('w', 1); if (M.md === 'c') { this.bump('cwins', 1); this.qBump('c', 1); } if (!M.pvp && !boss) for (let k = 0; k <= M.D; k++) this.bump('b' + k, 1); quest('duel.win'); send({ dw: S.st.wins | 0 }); }
      if (!M.pvp && !boss && M.D >= 2) { const st = S.st; st.hs = r > 0 ? (st.hs | 0) + 1 : 0; if ((st.hs | 0) > (st.hsb | 0)) st.hsb = st.hs; } // (🔥 wins in a row on Hard or Extreme)
      let prize = false, pm = null, bonus = 0; // (prize: the fighter you won; pm: its mastery XP instead, when it's already yours)
      if (boss && r > 0) { this.bump('boss', 1); this.qBump('k', 1); this.qBump('b', 1); const pc = M.wen ? WEN : LAE;
        if (M.wen) { this.bump('wen', 1); quest('bv.wendigo'); bonus = 1000; earn(1000, 'You defeated the Wendigo'); }
        if (S.own.includes(pc)) { const n = M.wen ? 1500 : 600; pm = Object.assign({ c: pc, n }, this.addXp(pc, n)); } else { this.unlock(pc, M.wen ? 'you defeated the Wendigo' : 'you beat the Laestrygonian'); prize = pc; } }
      const pxp = typeof spOn === 'function' && spOn() ? (r > 0 ? (M.wen ? 300 : boss ? 120 : M.pvp ? 80 : [30, 45, 60, 80][M.D]) : r < 0 ? 15 : 25) : 0; if (pxp) spXp(pxp); // (Season Pass XP for every match)
      if (M.md === 'd') { this.bump('dmk', M.kills); if (r > 0 && M.kills >= 15) this.bump('dm15', 1); }
      earn(coins, `${r > 0 ? 'Victory' : r < 0 ? 'Defeat' : 'Draw'} in Colosseum Duels`); const mr = this.addXp(M.me.c, xp);
      this.checkAch(); sfx(r > 0 ? 'win' : 'lose'); CROWD.ex = 1; if (r > 0) petals(M.me.x, M.me.z, 110); this.result(r, coins + bonus, xp, mr, gold, prize, pm, pxp); this.pubDu(true);
    },
    result(r, coins, xp, mr, gold, prize, pm, pxp) {
      const M = this.M, C = M.me.C, el = document.createElement('div'); el.id = 'duRes'; el.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(2,6,23,.5);pointer-events:auto;z-index:20';
      const sc = M.md === 'b' ? `${mmss(Math.ceil((M.wen ? WEN_T : BOSS_T) - Math.max(0, M.left)))} · ❤️ ${Math.max(0, M.lv)} left` : M.md === 'c' ? `${M.sc[0]} — ${M.sc[1]}` : `${M.kills} kills · ${M.deaths} deaths`, foe = M.md === 'b' ? (M.wen ? '❄️ the Wendigo' : '👹 the Laestrygonian') : M.pvp ? esc(nameOf(M.opp)) : `${DIFF[M.D].e} ${DIFF[M.D].n} bot`, lv = mr.after, nx = MAST[Math.min(10, lv + 1)], have = this.save.xp[C.i] | 0;
      el.innerHTML = `<div class="du-res" style="padding:22px 30px;border-radius:22px;background:linear-gradient(180deg,rgba(30,41,59,.96),rgba(15,23,42,.96));border:2px solid ${r > 0 ? '#fbbf24' : '#475569'};box-shadow:0 20px 60px rgba(0,0,0,.6);max-width:min(470px,92vw)">
        <div style="font:800 50px/1 var(--fh);color:${r > 0 ? '#fde68a' : r < 0 ? '#fca5a5' : '#e2e8f0'};-webkit-text-stroke:6px rgba(0,0,0,.4);paint-order:stroke fill">${r > 0 ? '🏆 VICTORY' : r < 0 ? '☠️ DEFEAT' : '🤝 DRAW'}</div>
        <div style="font:700 15px var(--fb);color:#cbd5e1">${C.ic} ${esc(C.n)} vs ${foe} · ${sc}</div>
        <div class="du-rw">${[pxp ? ['⭐', `+${pxp.toLocaleString()} XP`, 'Season Pass'] : null, ['🥇', `+${gold.toLocaleString()} coins`, 'Colosseum gold'], ['🪙', `+${coins.toLocaleString()} Blox Coins`, ''], ['🌟', `+${xp.toLocaleString()} ${esc(C.n)} XP`, 'mastery'],
          prize !== false && prize != null ? ['', `+1 new fighter: ${CH[prize].ic} ${esc(CH[prize].n)}`, `<span style="color:${RAR[CH[prize].r].c}">${RAR[CH[prize].r].t}</span>`, 'new', fighterPic(prize)] : null,
          pm ? ['🌟', `+${pm.n.toLocaleString()} ${esc(CH[pm.c].n)} XP`, `mastery — you have the ${esc(CH[pm.c].n)} already`, 'new'] : null, ['💥', `${M.dealt.toLocaleString()} damage`, 'dealt', 'dim']].filter(Boolean).map(([ic, t, sm, cl, pic], k) => `<div class="${cl || ''}" style="animation-delay:${(0.15 + k * 0.12).toFixed(2)}s">${pic ? `<img src="${pic}" alt="">` : `<i>${ic}</i>`}<b>${t}</b>${sm ? `<small>${sm}</small>` : ''}</div>`).join('')}</div>
        <div style="width:100%"><div style="font:700 12.5px var(--fb);color:#e2e8f0;margin-bottom:4px">${mr.after > mr.before ? `⬆️ <b style="color:#fde68a">Mastery ${lv}!</b>` : `Mastery ${lv}/10`} ${lv >= 10 ? '— mastered: wear it anywhere from the avatar editor' : `· ${have}/${nx} XP`}</div><div class="du-mx" style="margin:0"><i style="width:${lv >= 10 ? 100 : (have - MAST[lv]) / (nx - MAST[lv]) * 100}%"></i></div></div>
        <div style="display:flex;gap:10px;margin-top:6px;flex-wrap:wrap;justify-content:center">${prize !== false && prize != null ? `<button class="du-btn" data-x="equip" style="background:linear-gradient(180deg,#fde68a,#f59e0b);color:#1f2937">⚔️ Equip the ${esc(CH[prize].n)}</button>` : ''}<button class="du-btn" data-x="again">${M.pvp || M.coop ? '🏛️ Back to the courtyard' : M.md === 'b' ? '🔁 Fight it again' : '🔁 Rematch'} <small style="opacity:.7">Enter</small></button>${M.pvp || M.coop ? '' : '<button class="du-btn alt" data-x="lobby">🏛️ Courtyard <small style="opacity:.7">Esc</small></button>'}</div></div>`;
      HUD.el.append(el); if (document.exitPointerLock) document.exitPointerLock();
      const key = (e) => { if (!document.body.contains(el)) { window.removeEventListener('keydown', key, true); return; } const x = e.key === 'Enter' ? 'again' : e.key === 'Escape' ? (M.pvp || M.coop ? 'again' : 'lobby') : null; if (!x) return; const b = el.querySelector(`[data-x="${x}"]`); if (b) { e.preventDefault(); e.stopImmediatePropagation(); b.click(); } };
      window.addEventListener('keydown', key, true); // (⌨️ Enter: again; Esc: the courtyard)
      el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.x === 'equip') { this.save.eq = prize; this.dirty(); sfx('select'); b.disabled = true; b.textContent = `✔ ${CH[prize].n} equipped`; return; } window.removeEventListener('keydown', key, true); const again = b.dataset.x === 'again' && !M.pvp && !M.coop, o = M.md === 'b' ? { md: 'b', coop: false, own: true, ps: [myPeer()] } : { md: M.md, pvp: false, D: M.D }; this.leaveMatch(); if (again) this.startMatch(o); });
    },
    cleanMatch() {
      const M = this.M; if (!M) return; this.winterOff(); for (const F of [M.me, M.foe, ...(M.allies || [])]) if (F && F.auraR) { scene.remove(F.auraR); F.auraR = null; } if ((M.foe.kind === 'bot' || isBoss(M.foe)) && M.foe.a) { dropTrail(M.foe.a); dropAvatar(M.foe.a); } dropTrail(M.me.a); if (M.foe.kind === 'rem') dropTrail(M.foe.a); for (const A of M.allies) dropTrail(A.a);
      if (M.foe.tele) { scene.remove(M.foe.tele); M.foe.tele = null; }
      for (const p of this.proj) scene.remove(p.m); for (const v of this.volleys) scene.remove(v.ring); for (const d of this.drops) scene.remove(d.m); for (const w of this.waves) scene.remove(w.g); this.proj = []; this.volleys = []; this.drops = []; this.waves = [];
      if (HUD.el) HUD.el.remove(); HUD.el = null; document.body.classList.remove('duMatch'); for (const a of Net.avatars.values()) { a.g.visible = true; a.g.scale.setScalar(1); if (a.pet) a.pet.g.visible = true; }
      cam.dist = M.cam0 || 15;
      if (M.mid) this.done.add(M.mid);
    },
    leaveMatch() { if (this.aimM) this.aimM.visible = false; if (HB.g) HB.g.visible = false;
      if (!this.M) return; this.cleanMatch(); this.M = null; this.respawnDelay = 2200; this.blockHeld = this.rmb = this.lmb = false; this.sprinting = false;
      setAvOverride(null); respawn(true); P.frozen = false; send({ du: null }); this.drawBar(); this.padI = -1;
    },

    /* ---------------- the fighting keys ---------------- */
    tryAb(i) { const M = this.M; if (!M) return; const ok = useAb(M.me, i); const b = HUD.el && HUD.el.querySelector(`[data-ab="${i}"]`); if (b) { b.classList.remove('act', 'no'); void b.offsetWidth; b.classList.add(ok ? 'act' : 'no'); } },
    // 🎭 the Skinwalker's choice: their abilities (Mimic) or health / block / passives (Mimic Form), 1–4 or a click, 6 s to choose
    mimPick(title, opts, cb) { const old = $('#duMim'); if (old) old.remove(); if (!HUD.el) return; const el = document.createElement('div'); el.id = 'duMim'; el.className = 'du-mim';
      el.innerHTML = `<b>${esc(title)}</b><div class="ops">${opts.map((o, k) => `<button data-k="${k}"><i>${k + 1}</i><span class="ic">${o[0]}</span><span class="nm">${esc(o[1])}</span><small>${esc(o[2] || '')}${o[3] ? ' · ' + esc(o[3]) : ''}</small></button>`).join('')}</div><small class="hint">Press 1–${opts.length} or click · Esc to cancel · the cooldown only starts when it wears off</small>`;
      HUD.el.append(el); this.pick = { cb, n: opts.length, t: 8 }; sfx('select');
      el.addEventListener('pointerdown', (e) => { const b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); this.pickDo(+b.dataset.k); }); },
    pickDo(k) { const p = this.pick; this.pick = null; const el = $('#duMim'); if (el) el.remove(); if (p && k >= 0 && k < p.n && this.M && live() && !this.M.me.dead) { p.cb(k); sfx('unlock'); } },
    // 🌫️ the Screech's fog over your eyes: you can still see, just not well
    fogOn(d) { if (!HUD.el) return; let f = $('#duFog'); if (!f) { f = document.createElement('div'); f.id = 'duFog'; HUD.el.prepend(f); } f.classList.add('on'); clearTimeout(this.fogT); this.fogT = setTimeout(() => f.classList.remove('on'), d * 1000); },
    winterOn() { if (!SC.win) SC.win = buildWinter(); const W2 = SC.win; if (W2.g.visible) return; W2.g.visible = true; if (SC.colG) SC.colG.visible = false; if (SC.lobG) SC.lobG.visible = false;
      W2.save = { fog: scene.fog, top: SKYC.top, bot: SKYC.bot, h: [hemiL.color.getHex(), hemiL.groundColor.getHex(), hemiL.intensity], s: [sunL.color.getHex(), sunL.intensity] };
      W2.theme = this.land.theme; this.land.theme = 'night'; if (opt('perf')) W2.snow.visible = false;
      sky('#0a1222', '#4d5b70'); scene.fog = new THREE.Fog('#5d6b80', 26, 135); hemiL.color.set('#a9bddf'); hemiL.groundColor.set('#3a4354'); hemiL.intensity = 0.62; sunL.color.set('#c4d6ff'); sunL.intensity = 0.36; }, // (night, and a freezing fog)
    winterOff() { const W2 = SC.win; if (!W2 || !W2.g.visible) return; W2.g.visible = false; if (SC.colG) SC.colG.visible = true; if (SC.lobG) SC.lobG.visible = true; const sv = W2.save;
      sky(sv.top || '#4f86c6', sv.bot || '#fde7c2'); scene.fog = sv.fog; hemiL.color.setHex(sv.h[0]); hemiL.groundColor.setHex(sv.h[1]); hemiL.intensity = sv.h[2]; sunL.color.setHex(sv.s[0]); sunL.intensity = sv.s[1]; this.land.theme = W2.theme || 'meadow'; gfxApply(); },
    themeId() { const M = this.M; return M && M.wen && M.ph !== 'end' ? 'wendigo' : null; }, // (🎵 the Wendigo's own song, only in its fight)
    tryDodge() { const M = this.M; if (!M) return; const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y, r = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x, cy = cam.yaw;
      dodge(M.me, -Math.sin(cy) * f + Math.cos(cy) * r, -Math.cos(cy) * f - Math.sin(cy) * r); },
    setMode(k) { const M = this.M; if (!M) return; const md = M.me.C.ab[0].modes; if (!md || k >= md.length || M.me.act || k === M.me.mode) return; swapMode(M.me, k); sfx('select'); floatText(M.me, `${md[k].ic} ${md[k].n}`, 'tag'); this.pubDu(true); },
    toggleOpt(k) { const S = this.save; S.opt = Object.assign({}, OPT_DEF, S.opt || {}); S.opt[k] = S.opt[k] ? 0 : 1; this.dirty(); sfx('click'); if (k === 'perf') { this.perfApply(); if (S.opt.perf) { GFX.pick = 'low'; try { localStorage.setItem('bv-gfx', 'low'); } catch (e) { /* (not saved) */ } gfxApply(); } } const O = OPTS.find((q) => q[0] === k); if (O) toast(`${O[1]} ${O[2]}: ${S.opt[k] ? 'on' : 'off'}`); },
    optionsPanel() {
      const html = `<div class="du-opts">${OPTS.map(([k, ic, n, d]) => `<button class="du-opt${opt(k) ? ' on' : ''}" data-o="${k}"><span class="ic">${ic}</span><span><b>${n}</b><small>${d}</small></span><i>${opt(k) ? 'ON' : 'OFF'}</i></button>`).join('')}</div>
        <p style="font:600 12.5px var(--fb);color:#94a3b8;margin:12px 0 0">Keys in a match: <b>M1/E/R/G</b> abilities · <b>1/2</b> switch weapon · <b>Q</b> dodge · <b>F</b> block · <b>T</b> lock-on · <b>H</b> hitboxes. In the ludus: <b>C</b> fighters.</p>`;
      openPanel('⚙️ Duel options', html, (b) => { if (b.dataset.o) { this.toggleOpt(b.dataset.o); this.optionsPanel(); } });
    },
    toggleLock() { this.lockOn = !this.lockOn; this.save.lk = this.lockOn ? 1 : 0; this.dirty(); toast(this.lockOn ? '🎯 Lock-on: the camera follows your opponent' : '🎯 Lock-on off'); sfx('click'); },
    press(btn, down) { if (!this.M) return; if (btn === 2) this.rmb = !!down; else if (btn === 0) { this.lmb = !!down; if (down && !$('#duRes')) { this.lmbT = performance.now(); this.tryAb(0); } } }, // (the M1 on the press, so you can drag the camera while you swing; held, it keeps swinging)
    click(e) { if (this.M && e.button !== 2 && !$('#duRes') && !(this.lmbT && performance.now() - this.lmbT < 2000)) this.tryAb(0); }, // (a tap without a press: touch)
    key(code, down) {
      if (!this.M) { if (down && code === 'KeyC') { this.fightersPanel(); return true; } return; }
      if (code === 'KeyF') { this.blockHeld = !!down; return true; }
      if (!down) return;
      if (code === 'KeyE') { this.tryAb(1); return true; } if (code === 'KeyR') { this.tryAb(2); return true; } if (code === 'KeyG') { this.tryAb(3); return true; } if (code === 'KeyV') { this.tryAb(4); return true; } if (code === 'KeyQ') { this.tryDodge(); return true; } if (code === 'KeyT') { this.toggleLock(); return true; } if (code === 'KeyH') { this.toggleOpt('hb'); return true; }
      if (this.pick) { if (/^Digit[1-9]$/.test(code)) { this.pickDo(+code.slice(5) - 1); return true; } if (code === 'Escape') { this.pickDo(-1); return true; } } // (🎭 the Skinwalker choosing what to wear)
      if (/^Digit[1-3]$/.test(code) && this.M.me.C.ab[0].modes) { this.setMode(+code.slice(5) - 1); return true; }
    },
    menuKey(code) { if (code === 'KeyC') closePanel(); },
    pose(dt) {
      const M = this.M; if (!M) return;
      for (const F of [M.me, M.foe, ...M.allies]) { const a = F.a; if (!a || a.dead) continue;
        const sc = F.C.big || 1; if (Math.abs(a.g.scale.x - sc) > 1e-3) a.g.scale.setScalar(sc); // (the giants, their size)
        if (F.kind === 'me' && !P.dead) { const r = 1.6 * sc, q = (P.x / (A0 - r)) ** 2 + (P.z / (B0 - r)) ** 2; if (q > 1) { const k = 1 / Math.sqrt(q); P.x *= k; P.z *= k; a.g.position.x = P.x; a.g.position.z = P.z; } } // (inside the arena, after the move too)
        poseAct(F, dt); trailTick(F, !!(F.act && F.act.trail)); buffLook(F); statusLook(F, dt);
        if (F.lift) a.g.position.y += F.lift;
        if (F.blk && !F.act) setPose(F, F.C.ab[1].an === 'bash' || [0, 3, 4, 5, 8, 9, 10, 12, 13, 22, 30].includes(F.c) ? AN.shieldup : { aR: [1.3, 0.3, -0.5], eR: [1.3], aL: [1.2, -0.3, 0.6], eL: [1.3], bd: [-0.1, 0, 0] }, Math.min(1, dt * 14)); // (a block: the shield up, or the blade across)
        if (F.kind === 'me') { const inv = bval(F, 'inv') > 0; if (inv !== !!a.duInv) { a.duInv = inv; a.g.traverse((o) => { const m = o.material; if (!m || o.isSprite || Array.isArray(m)) return; if (!m.userData.op0) m.userData.op0 = [m.transparent, m.opacity]; m.transparent = inv || m.userData.op0[0]; m.opacity = inv ? 0.28 : m.userData.op0[1]; }); } } // (in the smoke: half there)
        if (a.shadow && !a.g.visible) a.shadow.visible = false; }
      for (const a of Net.avatars.values()) if (!a.g.visible && a.shadow) a.shadow.visible = false;
    },
    prompts() {
      if (this.M) return [];
      return [{ x: ARMORY.x, z: ARMORY.z, r: 7, text: 'Fighters', fn: () => this.fightersPanel() }, { x: BOTGATE.x, z: BOTGATE.z, r: 7, text: 'Fight a bot', fn: () => this.botPanel() }, { x: TABLET.x, z: TABLET.z - 1.5, r: 7, text: 'Achievements', fn: () => this.achPanel() }, { x: SHOP.x - 2, z: SHOP.z - 3.5, r: 7, text: 'Limited Shop', fn: () => this.shopPanel() }]
        .concat(SHRINES.map((s) => ({ x: s.x, z: s.z, r: 6.5, text: `Open the ${EMP[s.e].n} crate`, fn: () => this.cratesPanel(s.e) })));
    },
    say(F, text) { floatText(F, text, 'tag'); },
    flash() { const d = document.createElement('div'); d.style.cssText = 'position:absolute;inset:0;background:#fff;opacity:.85;pointer-events:none;transition:opacity .45s'; $('#xhud').append(d); requestAnimationFrame(() => { d.style.opacity = 0; }); setTimeout(() => d.remove(), 500); },

    /* ---------------- progress: stats, the duel's achievements, mastery ---------------- */
    unlock(c, why) { const S = this.save; if (S.own.includes(c)) return false; S.own.push(c); this.dirty(); sfx('unlock'); toast(`${CH[c].ic} ${CH[c].n} unlocked — ${why}!`, '#fde68a'); say(`⚔️ Colosseum Duels: the ${CH[c].n} is yours — ${why}!`, '#fde68a'); if (!this.M) this.drawBar(); return true; },
    perfApply() { const on = !!opt('perf'); FXQ.lite = on; if (SC.crowdM) for (const m of SC.crowdM) m.visible = !on; if (SC.win) SC.win.snow.visible = !on; }, // (🚀: what performance mode turns off)
    exoCheck() { const S = this.save; if (!S || !S.st || S.own.includes(SKW)) return; if (exoGoals(S).every(([, , v, n]) => v >= n)) this.unlock(SKW, 'you completed the Skinwalker’s quest'); },
    passCheck() { try { if (this.save && spLvl() >= 100) this.unlock(LAE, 'you reached Season Pass level 100'); } catch (e) { /* (no pass yet) */ } },
    qBump(k, n) { const S = this.save; if (!S) return; // (the mythics' quests: each counts what it needs)
      for (const Q of QUESTS) { const q = S[Q.key]; if (!q || !q.on || !Q.need.some(([x]) => x === k)) continue; q[k] = (q[k] | 0) + n;
        if (Q.need.every(([x, v]) => (q[x] | 0) >= v)) { q.on = 0; if (Q.key === 'q') S.qd = 1; this.unlock(Q.c, Q.done); } this.dirty(); } },
    bump(k, n = 1) { const st = this.save.st; st[k] = (st[k] | 0) + n; this.checkAch(); this.dirty(); },
    checkAch() {
      const S = this.save; this.exoCheck();
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
      setBar(`<button class="xslot" data-k="fi"><span class="k">C</span><span class="e">${C.ic}</span>${esc(C.n)}<small>🌟 mastery ${mLvl(S.xp[S.eq] | 0)}/10</small></button><button class="xslot" data-k="cr"><span class="e">🎁</span>Crates<small>🥇 ${S.gold | 0} gold</small></button><button class="xslot" data-k="bot"><span class="e">🤖</span>Fight a bot<small>${DIFF[S.diff].e} ${DIFF[S.diff].n}</small></button><button class="xslot" data-k="ach"><span class="e">🏆</span>Achievements<small>${S.ach.length}/${ACH.length}</small></button><button class="xslot" data-k="shop"><span class="e">🛒</span>Shop<small>⏳ ${fmtLeft(limLeft())}</small></button><button class="xslot" data-k="opt"><span class="e">⚙️</span>Options<small>${opt('hb') ? '🟥 hitboxes on' : 'hitboxes, shake…'}</small></button>`,
        (b) => { const k = b.dataset.k; if (k === 'fi') this.fightersPanel(); else if (k === 'cr') this.cratesPanel(); else if (k === 'bot') this.botPanel(); else if (k === 'ach') this.achPanel(); else if (k === 'shop') this.shopPanel(); else if (k === 'opt') this.optionsPanel(); });
    },
    fighterHow(c) { const S = this.save, C = CH[c], A = ACH.find((q) => q.c === c);
      if (C.lim) { const k = limBack(c); return k === 0 ? `⏳ <b>Limited</b> — in the 🛒 Limited Shop this week for 🪙 ${C.lim[0].toLocaleString()} Blox Coins${C.lim[1] ? ` or 🥇 ${C.lim[1].toLocaleString()} gold` : ''} (gone in ${fmtLeft(limLeft())})` : `⏳ <b>Limited</b> — only ever in the 🛒 Limited Shop, a week at a time: back in ${k} week${k > 1 ? 's' : ''}`; }
      if (C.how) return `🔒 ${esc(C.how)}${c === EXE && S.q && S.q.on ? ` — ⚔️ ${S.q.k | 0}/50 · 💥 ${(S.q.d | 0).toLocaleString()}/15,000` : ''}`;
      return `🔒 ${A ? `Win it with the duel achievement <b>${esc(A.n)}</b> (${esc(A.d)}), or find it` : 'Only'} in the ${EMP[C.e].e} ${esc(EMP[C.e].n)} crate (${ODDS[CRATE[C.e].indexOf(c)]}%)`; },
    shopPanel() { // 🛒 the Limited Shop — a screen of its own (v129): this week's three side by side, the mythic in the middle and bigger, each with
      // its stats, abilities and prices; your wallet and a live clock to the next change at the top; next week's below. Esc or ✕ to leave
      const S = this.save, w = limWeek(), now = limShop(w), nx = limShop(w + 1); if (!$('#xpanel').hidden) closePanel(); for (const k in keys) keys[k] = false; if (document.exitPointerLock) document.exitPointerLock();
      let el = document.getElementById('duShop'); const first = !el; if (!el) { el = document.createElement('div'); el.id = 'duShop'; document.body.appendChild(el); sfx('whoosh'); }
      const card = (c) => { const C = CH[c], own = S.own.includes(c), [pb, pg] = C.lim, F = fStatsAll().L[c], hero = C.r >= 4;
        return `<div class="dsh-c${hero ? ' hero' : ''}${own ? ' own' : ''}" style="--a:${hero ? '#fb7185' : '#fbbf24'};--g:${hero ? 'rgba(251,113,133,.38)' : 'rgba(251,191,36,.3)'}"><span class="dsh-tag">${hero ? '🔥 FEATURED · ' : ''}⏳ LIMITED</span><div class="dsh-pic"><img src="${fighterPic(c, 1)}" alt=""></div>
          <div class="in"><small>${RAR[C.r].t} · ${EMP[C.e].e} ${esc(EMP[C.e].sn || EMP[C.e].n)} · ${esc(C.ro)}</small><b>${C.ic} ${esc(C.n)}</b>
            <div class="dsh-st"><span>⚡ ${Math.round(F.dps)} DPS</span><span>❤️ ${C.hp}</span><span>⭐ ${F.ov.toFixed(1)}</span></div>
            <div class="dsh-ab">${C.ab.map((ab, k) => `<span title="${esc(ab.n)}"><i>${ab.ic}</i>${esc(KEYN[k])}</span>`).join('')}</div>
            ${own ? '<button class="du-btn alt" disabled>✔ Yours</button>' : `<button class="du-btn buy" data-buy="${c}" data-cur="b">🪙 ${pb.toLocaleString()} Blox Coins</button>${pg ? `<button class="du-btn buy gold" data-buy="${c}" data-cur="g">🥇 ${pg.toLocaleString()} gold</button>` : ''}`}
            <button class="du-lnk" data-st="${c}">abilities and stats</button></div></div>`; };
      el.innerHTML = `<div class="dsh-top"><b>🛒 LIMITED SHOP</b><span class="dsh-clk">⏳ new fighters in <b id="dshClk">${fmtLeft(limLeft())}</b></span><span class="dsh-wal">🪙 ${(W.coins | 0).toLocaleString()} <small>Blox Coins</small> · 🥇 ${(S.gold | 0).toLocaleString()} <small>gold</small></span><button class="dsh-x" data-x="1" aria-label="Close the shop">✕</button></div>
        <p class="dsh-sub">Only here, and only this week — once bought, yours for good. A new three every Monday at 00:00 UTC.</p>
        <div class="dsh-row">${[now[1], now[0], now[2]].map(card).join('')}</div>
        <div class="dsh-next"><b>🔮 Next week</b>${nx.map((c) => `<span class="r${CH[c].r}"><img src="${fighterPic(c)}" alt="">${CH[c].ic} ${esc(CH[c].n)} <small>${RAR[CH[c].r].s}</small></span>`).join('')}</div>`;
      el.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.x) this.shopClose(); else if (b.dataset.buy) this.buyLim(+b.dataset.buy, b.dataset.cur); else if (b.dataset.st) { sfx('click'); this.shopClose(); this.fightersPanel(+b.dataset.st); } };
      clearInterval(this.shopT); this.shopT = setInterval(() => { const k = document.getElementById('dshClk'); if (!k) { clearInterval(this.shopT); return; } k.textContent = fmtLeft(limLeft()); if (limWeek() !== w) this.shopPanel(); }, 1000);
      if (first) { this.shopKey = (e) => { if (!document.getElementById('duShop')) return; const typing = e.target && /INPUT|TEXTAREA/.test(e.target.tagName); if (e.key === 'Escape') { e.preventDefault(); this.shopClose(); } if (!typing) e.stopImmediatePropagation(); }; window.addEventListener('keydown', this.shopKey, true); } // (the game doesn't hear the keys while you shop)
    },
    shopClose() { const el = document.getElementById('duShop'); if (el) { el.remove(); sfx('close'); } clearInterval(this.shopT); if (this.shopKey) { window.removeEventListener('keydown', this.shopKey, true); this.shopKey = null; } },
    buyLim(c, cur) { const S = this.save, C = CH[c]; if (!C || !C.lim || S.own.includes(c)) return false;
      if (!limShop().includes(c)) { sfx('error'); toast('That fighter has left the shop — it’ll be back'); this.shopPanel(); return false; }
      if (cur === 'g') { const pr = C.lim[1]; if (!pr) return false; if ((S.gold | 0) < pr) { sfx('error'); toast(`Not enough 🥇 gold — ${(pr - (S.gold | 0)).toLocaleString()} more`); return false; } S.gold -= pr; sfx('buy'); }
      else { const pr = C.lim[0]; if (W.coins < pr) { sfx('error'); toast(`Not enough Blox Coins — ${(pr - W.coins).toLocaleString()} more`); return false; } if (!spend(pr)) return false; }
      S.own.push(c); this.dirty(); this.drawBar(); sfx('unlock'); CROWD.ex = 1; toast(`⏳ ${C.ic} ${C.n} is yours — equip it in ⚔️ Fighters!`, '#fde68a'); say(`🛒 Limited Shop: the ${C.n} is yours!`, '#fde68a'); this.shopPanel(); return true; },
    fightersPanel(sel) {
      const S = this.save, COLS = [1, 0, 2, 3, 4, 5, 7, 6]; let det = '';
      if (sel != null) { // the stats: everything about one fighter
        const C = CH[sel], own = S.own.includes(sel), xp = S.xp[sel] | 0, lv = mLvl(xp), nx = MAST[Math.min(10, lv + 1)];
        const abl = C.ab.map((ab, i) => ab.modes ? ab.modes.map((m, k) => `<div><i>${m.ic}</i><span><b>${KEYN[i]} · ${esc(m.n)}</b> (key ${k + 1}) — <em>${m.dmg}</em> damage, every <em>${m.cd} s</em>${m.wind >= 0.4 ? ` · ${m.wind} s wind-up` : ''}</span></div>`).join('')
          : `<div><i>${ab.ic}</i><span><b>${KEYN[i]} · ${esc(ab.n)}</b> — ${ab.d ? esc(ab.d) : `<em>${ab.dmg}</em> damage${ab.k === 'proj' ? ' (ranged)' : ''}`} · cooldown <em>${ab.cd} s</em></span></div>`).join('');
        const pas = (C.pas || []).map(([ic, n, d]) => `<div><i>${ic}</i><span><b>Passive · ${esc(n)}</b> — ${esc(d)}</span></div>`).join('');
        det = `<div class="du-det" style="--rc:${RAR[C.r].c}"><img src="${fighterPic(sel, 1)}" alt=""><div><div class="sub">${EMP[C.e].e} ${esc(EMP[C.e].n)} · ${RAR[C.r].t} · ${C.wtI} ${C.wt} · ${esc(C.ro)}</div><h3>${C.ic} ${esc(C.n)} <button class="du-x" data-x="close" aria-label="Close">✕</button></h3>
          ${this.statBars(sel)}
          <div class="du-abl">${pas}${abl}</div>
          <div style="margin-top:10px;font:700 12.5px var(--fb);color:#e2e8f0">🌟 Mastery ${lv}/10 ${lv >= 10 ? '— <b style="color:#fde68a">MASTERED</b>: its body and animation pack are in your avatar editor' : `· ${xp}/${nx} XP — master it (10) to wear its body and animations anywhere`}</div><div class="du-mx" style="margin:4px 0 12px"><i style="width:${lv >= 10 ? 100 : (xp - MAST[lv]) / (nx - MAST[lv]) * 100}%"></i></div>
          ${own ? (S.eq === sel ? '<button class="du-btn alt" disabled>✔ Equipped</button>' : `<button class="du-btn" data-eq="${sel}">⚔️ Equip</button>`) : `<div style="font:600 12.5px/1.45 var(--fb);color:#cbd5e1">${this.fighterHow(sel)}</div>${C.lim && limBack(sel) === 0 ? '<button class="du-btn" data-shop="1" style="margin-top:8px">🛒 Open the Limited Shop</button>' : ''}`}</div></div>`; }
      const card = (c) => { const Q = CH[c], o = S.own.includes(c), l = mLvl(S.xp[c] | 0);
        return `<div class="du-fcard r${Q.r}${o ? '' : ' lock'}${c === S.eq ? ' eqd' : ''}${c === sel ? ' sel' : ''}" data-fn="${esc((Q.n + ' ' + Q.ro + ' ' + EMP[Q.e].n + ' ' + RAR[Q.r].n).toLowerCase())}" data-wt="${Q.wt}" data-own="${o ? 1 : 0}"><button class="st" data-st="${c}">stats</button>${o ? `<span class="mb">🌟 ${l}</span>` : '<span class="mb">🔒</span>'}${Q.lim ? '<span class="lt">⏳ LIMITED</span>' : ''}<button class="pic" data-st="${c}" aria-label="${esc(Q.n)} stats"><img src="${fighterPic(c)}" alt=""></button>
          <b>${Q.ic} ${esc(Q.n)}</b><small>${RAR[Q.r].s}</small><span class="dp">⚡ ${Math.round(fStatsAll().L[c].dps)} DPS · ⭐ ${fStatsAll().L[c].ov.toFixed(1)}</span>${o ? (c === S.eq ? '<button class="eq on" disabled>✔ equipped</button>' : `<button class="eq" data-eq="${c}">equip</button>`) : Q.lim ? (limBack(c) === 0 ? '<button class="eq lim" data-shop="1">🛒 in the shop</button>' : `<button class="eq lk" data-st="${c}">⏳ limited</button>`) : `<button class="eq lk" data-st="${c}">🔒 locked</button>`}</div>`; };
      const head = `<div></div>${COLS.map((e) => `<div class="du-gh">${EMP[e].e} ${esc(EMP[e].sn || EMP[e].n)}</div>`).join('')}`;
      const rows = RAR.map((R, r) => `<div class="du-gr" style="--rc:${R.c}"><b>${R.s}</b><small>${R.n}</small></div>${COLS.map((e) => `<div class="du-gc">${CH.filter((C) => C.e === e && C.r === r && (!C.secret || S.own.includes(C.i))).map((C) => card(C.i)).join('')}</div>`).join('')}`).join('');
      const FF = this.ff || (this.ff = { f: 'all', q: '' }), FLT = [['all', 'All'], ['own', '✔ Owned'], ['lock', '🔒 Not yet'], ['Light', '🪶 Light'], ['Medium', '⚔️ Medium'], ['Heavy', '🛡️ Heavy']];
      const fbar = `<div class="du-ff"><input id="duFq" placeholder="🔎 Search fighters, classes, empires…" value="${esc(FF.q)}" autocomplete="off" spellcheck="false">${FLT.map(([k, n]) => `<button data-ff="${k}" class="${FF.f === k ? 'on' : ''}">${n}</button>`).join('')}<span id="duFn"></span></div>`;
      openPanel('⚔️ Fighters', `${det}${fbar}<div class="du-wts">${WTS.map(([n, ic, L]) => `<span><b>${ic} ${n}</b> ${L.join(' · ')}</span>`).join('')}</div><div class="du-gwrap"><div class="du-g6">${head}${rows}</div></div>`, (b) => {
        if (b.dataset.ff) { FF.f = b.dataset.ff; sfx('click'); document.querySelectorAll('#xpBody [data-ff]').forEach((q) => q.classList.toggle('on', q.dataset.ff === FF.f)); this.fFilter(); return; }
        if (b.dataset.shop) { sfx('click'); this.shopPanel(); return; }
        if (b.dataset.eq) { S.eq = +b.dataset.eq; this.dirty(); sfx('select'); this.drawBar(); this.fightersPanel(); }
        else if (b.dataset.st) { sfx('click'); this.fightersPanel(+b.dataset.st); $('#xpBody').scrollTop = 0; } else if (b.dataset.x === 'close') { sfx('click'); this.fightersPanel(); } }, null, { full: true, extra: `<span class="xchip">⚔️ ${S.own.length}/${rosterN(S)}</span>` }); // (a secret fighter isn't counted till it's yours)
      const fq = $('#duFq'); if (fq) fq.addEventListener('input', () => { FF.q = fq.value; this.fFilter(); }); this.fFilter();
      if (sel != null) { $('#xpBody').scrollTop = 0; this.statAnim(); }
    },
    fFilter() { const FF = this.ff || { f: 'all', q: '' }, q = FF.q.trim().toLowerCase(); let n = 0, all = 0;
      document.querySelectorAll('#xpBody .du-fcard').forEach((el) => { all++; const ok = (FF.f === 'all' || (FF.f === 'own' ? el.dataset.own === '1' : FF.f === 'lock' ? el.dataset.own === '0' : el.dataset.wt === FF.f)) && (!q || el.dataset.fn.includes(q)); el.classList.toggle('dim', !ok); if (ok) n++; });
      const c = $('#duFn'); if (c) c.textContent = n === all ? `${all} fighters` : `${n} of ${all}`; },
    // the stats area: a DPS counter (counting up as it opens) and a bar for each stat — filled by where it sits among all
    // the fighters — with an overall rating out of 10
    statBars(c) {
      const F = fStatsAll(), x = F.L[c], C = CH[c], pct = (v) => `${v > 0 ? '+' : '−'}${Math.round(Math.abs(v) * 100)}%`;
      const rows = [['❤️', 'Health', 'hp', x.hp, `${x.hp.toLocaleString()} HP`], ['⚔️', 'Attack', 'atk', x.atk, `${x.atk} a blow`], ['⏱️', 'Attack speed', 'aspd', x.aspd, `${x.aspd.toFixed(2)} hits/s`],
        ['🏃', 'Speed', 'spd', x.spd, x.spd === 1 ? 'normal' : `${pct(x.spd - 1)} speed`], ['🛡️', 'Defense', 'def', x.def, `${C.def === 1 ? 'normal armour' : `${pct(C.def - 1)} dmg taken`}${x.guard ? ' · +guard' : ''}`]]; // (+guard: blocks or damage cut from its abilities, in the bar too)
      const bar = (ic, n, w, val, cls = '') => `<div class="r${cls}"><span class="l">${ic} ${n}</span><div class="b"><i data-w="${w.toFixed(1)}"></i></div><span class="v">${val}</span></div>`;
      return `<div class="du-sb"><div class="du-dps"><small>⚡ DPS</small><b data-dps="${Math.round(x.dps)}">0</b><span>damage a second over 30 s against a foe in front of it, every ability used as it’s ready (M1: ${esc(x.m1)}), buffs, bleeds, burns and passives counted</span></div>
        <div class="du-bars">${rows.map(([ic, n, k, v, val]) => bar(ic, n, F.bar(k, v), val)).join('')}${bar('⚡', 'DPS', F.bar('dps', x.dps), `${Math.round(x.dps)}`)}${bar('⭐', 'Overall', x.ov * 10, `<b>${x.ov.toFixed(1)}</b> / 10`, ' ov')}<div class="du-blk">${C.sh ? '🛡️ Shield: blocking stops every blow from the front' : '✋ No shield: blocking halves the damage from the front'}</div></div></div>`;
    },
    statAnim() { // (the bars fill and the DPS counts up)
      const box = $('#xpBody'); if (!box) return; const b = box.querySelector('.du-dps b'), is = box.querySelectorAll('.du-bars i[data-w]');
      requestAnimationFrame(() => requestAnimationFrame(() => { for (const i of is) i.style.width = i.dataset.w + '%'; }));
      if (b) { const to = +b.dataset.dps, t0 = performance.now(), step = (n) => { const k = Math.min(1, (n - t0) / 900); b.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString(); if (k < 1 && b.isConnected) requestAnimationFrame(step); }; requestAnimationFrame(step); }
    },
    cratesPanel(only) {
      const S = this.save, luck = ((S.rolls | 0) + 1) % LUCK_N === 0, sure = (S.pity | 0) + 1 >= PITY_N, od = sure ? [0, 0, 0, 0, 100] : luck ? LUCK_ODDS : ODDS, toL = LUCK_N - ((S.rolls | 0) % LUCK_N), toP = PITY_N - (S.pity | 0);
      const pity = `<div class="du-pity"><div class="${luck ? 'lk' : ''}">🍀 2× luck ${luck ? '<b>on your next crate!</b>' : `in <b>${toL}</b> crates`}<small>Every 10th crate doubles the rare, epic and legendary chances (2% legendary, 24% epic, 54% rare).</small><div class="du-mx"><i style="width:${((S.rolls | 0) % LUCK_N) / LUCK_N * 100}%;background:linear-gradient(90deg,#22c55e,#bbf7d0)"></i></div></div>
        <div class="${sure ? 'lk' : ''}">🌟 A legendary, guaranteed, ${sure ? '<b>on your next crate!</b>' : `in <b>${toP}</b> crates`}<small>Pity: ${S.pity | 0}/${PITY_N} crates since your last legendary — the ${PITY_N}th is always one.</small><div class="du-mx"><i style="width:${(S.pity | 0) / PITY_N * 100}%"></i></div></div></div>`;
      const QN = [1, 2, 5, 10, 'max'], qn = QN.includes(S.qn) ? S.qn : 1, MAXN = 50;
      const ng = qn === 'max' ? Math.min(MAXN, Math.floor((S.gold | 0) / CRATE_GOLD)) : qn, nc = qn === 'max' ? Math.min(MAXN, Math.floor(W.coins / CRATE_PRICE)) : qn;
      const qrow = `<div class="du-qn"><b>Open at once:</b>${QN.map((q) => `<button data-qn="${q}" class="${q === qn ? 'on' : ''}">${q === 'max' ? 'Max' : '×' + q}</button>`).join('')}<small>${qn === 'max' ? `Max: as many as you can pay for (up to ${MAXN}) — 🥇 ${Math.floor((S.gold | 0) / CRATE_GOLD)} with gold, 🪙 ${Math.floor(W.coins / CRATE_PRICE)} with coins` : qn > 1 ? 'They open together and show you everything at once — the luck rolls and the pity count every one.' : 'One at a time, with the reel.'}</small></div>`;
      const html = `${pity}${qrow}<div class="du-crates">${EMP.map((E, e) => `<div class="du-crate" style="--c1:${E.c1};--c2:${E.c2}${only === e ? ';box-shadow:0 0 0 3px #fde68a' : ''}"><h4>${E.e} ${esc(E.n)} Crate</h4><span style="font:600 12px/1.35 var(--fb);color:#cbd5e1">${esc(E.d)}</span>
        <div class="od">${CRATE[e].map((c, k) => `<span style="--rc:${RAR[CH[c].r].c}"><b>${CH[c].ic} ${esc(CH[c].n)}${S.own.includes(c) ? ' ✔' : ''}</b><i>${od[k]}% · ${RAR[CH[c].r].s}</i></span>`).join('')}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="du-btn" data-open="${e}" data-cur="g" data-n="${ng}" ${ng < 1 || (S.gold | 0) < CRATE_GOLD * ng ? 'disabled' : ''}>🥇 ${(CRATE_GOLD * Math.max(1, ng)).toLocaleString()} gold${ng > 1 ? ` · ×${ng}` : ''}</button><button class="du-btn alt" data-open="${e}" data-cur="c" data-n="${nc}" ${nc < 1 || W.coins < CRATE_PRICE * nc ? 'disabled' : ''}>🪙 ${(CRATE_PRICE * Math.max(1, nc)).toLocaleString()}${nc > 1 ? ` · ×${nc}` : ''}</button></div></div>`).join('')}</div>
        <p style="font:600 12.5px var(--fb);color:#94a3b8;margin:12px 0 0">Pay with the duel’s own 🥇 gold — every match earns some (more for wins, harder bots, other players and the boss) — or with Blox Coins. Already have the fighter you get? +250 mastery XP for it and 🥇 40 back. The mythics, the giants, the spirit and the other quest fighters aren’t in any crate — they’re in 🏆 Achievements → 📜 Quests.</p>`;
      const codeBox = `<div class="du-code"><b>🎟️ Have a code?</b><input id="duCode" maxlength="40" placeholder="Type it here" autocomplete="off" spellcheck="false"><button class="du-btn" data-code="1">Redeem</button><span id="duCodeMsg"></span></div>`;
      openPanel('🎁 Crates', html + codeBox, (b) => { if (b.dataset.qn) { S.qn = b.dataset.qn === 'max' ? 'max' : +b.dataset.qn; this.dirty(); sfx('click'); this.cratesPanel(only); } else if (b.dataset.open) { const n = +b.dataset.n || 1; if (n > 1) this.openCrates(+b.dataset.open, b.dataset.cur, n); else this.openCrate(+b.dataset.open, b.dataset.cur); } else if (b.dataset.code) this.redeem($('#duCode').value); }, null, { full: true, extra: `<span class="xchip">🥇 ${S.gold | 0}</span><span class="xchip">🪙 ${W.coins}</span>` });
      const ci = $('#duCode'); if (ci) ci.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.redeem(ci.value); } });
    },
    // a one-time code: right, not yours yet, and nobody has used it — then it's claimed for everyone, and the fighter's yours
    async redeem(raw) {
      const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, ''), S = this.save;
      const msg = (t, ok) => { const m = $('#duCodeMsg'); if (m) { m.textContent = t; m.className = ok ? 'ok' : 'bad'; } if (!ok) sfx('error'); };
      if (!code) return msg('Type a code first.'); if (this.redeeming) return;
      this.redeeming = 1;
      try {
        const h = await sha('bv-code|' + code), C = CODES.find((q) => q.h === h);
        if (!C) return msg('That code isn’t valid.');
        if (S.own.includes(C.c)) return msg(`You already have the ${CH[C.c].n} — the code is still unused.`);
        if (Market.state === 'off') await marketStart(); for (let k = 0; k < 40 && Market.state === 'wait'; k++) await new Promise((r) => setTimeout(r, 100));
        const db = Market.db; if (!db) return msg('Codes need the shared server, and it isn’t reachable here right now.');
        msg('Checking…', true);
        const id = (await sha('bv-claim|' + code)).slice(0, 40), ref = db.doc('codes/' + id), me0 = myId();
        if (!(await lease(ref, 8000))) return msg('Someone else is redeeming that code right now.');
        const snap = await ref.get(); if (snap.exists && (snap.data() || {}).by) return msg('That code has already been used.');
        await ref.set({ by: me0, at: Date.now(), c: C.c });
        const chk = await ref.get(); if (!chk.exists || (chk.data() || {}).by !== me0) return msg('That code has already been used.');
        if (!S.own.includes(C.c)) S.own.push(C.c); S.codes = (S.codes || []).concat(id).slice(-20); this.dirty(); this.drawBar();
        sfx('unlock'); msg(`🎉 The ${CH[C.c].n} is yours! This code can’t be used again.`, true); toast(`🎟️ Code redeemed — the ${CH[C.c].ic} ${CH[C.c].n} is yours!`); CROWD.ex = 1;
      } catch (e) { msg('Couldn’t reach the server — try again.'); } finally { this.redeeming = 0; }
    },
    openCrate(e, cur) {
      const S = this.save;
      if (cur === 'g') { if ((S.gold | 0) < CRATE_GOLD) { sfx('error'); toast('Not enough 🥇 gold — win some duels!'); return; } S.gold -= CRATE_GOLD; }
      else { if (W.coins < CRATE_PRICE) { sfx('error'); toast('Not enough Blox Coins — or pay with 🥇 gold'); return; } if (!spend(CRATE_PRICE)) return; }
      const R = this.rollCrate(e); this.dirty(); closePanel(); this.reel(e, R.c, R.dup, R.luck, R.sure);
    },
    rollCrate(e) { // (one crate's roll: the luck and the pity, the fighter, whether you had it)
      const S = this.save; S.rolls = (S.rolls | 0) + 1; S.pity = (S.pity | 0) + 1; const luck = S.rolls % LUCK_N === 0, sure = S.pity >= PITY_N, od = luck ? LUCK_ODDS : ODDS; // (🍀 the 10th, 20th… crate; 🌟 the pity)
      let k = 4; if (!sure) { let r = Math.random() * 100; k = 0; while (k < 4 && r >= od[k]) { r -= od[k]; k++; } } if (k === 4) S.pity = 0; const c = CRATE[e][k], dup = S.own.includes(c);
      if (!dup) S.own.push(c); this.bump('crates', 1); quest('duel.crate'); return { c, dup, luck, sure };
    },
    // several at once: paid together, rolled one by one (luck and pity as ever), then everything shown in a grid
    openCrates(e, cur, n) {
      const S = this.save; n = Math.max(1, Math.min(50, n | 0));
      if (cur === 'g') { if ((S.gold | 0) < CRATE_GOLD * n) { sfx('error'); toast(`Not enough 🥇 gold for ${n} crates`); return; } S.gold -= CRATE_GOLD * n; }
      else { if (W.coins < CRATE_PRICE * n) { sfx('error'); toast(`Not enough Blox Coins for ${n} crates`); return; } if (!spend(CRATE_PRICE * n)) return; }
      const res = []; for (let i = 0; i < n; i++) { const R = this.rollCrate(e); if (R.dup) { this.addXp(R.c, 250); S.gold = (S.gold | 0) + 40; } res.push(R); }
      this.dirty(); closePanel(); this.crateResults(e, res);
    },
    crateResults(e, res) {
      const nw = res.filter((r) => !r.dup), legs = res.filter((r) => CH[r.c].r >= 3), dups = res.length - nw.length;
      const cell = (r, i) => { const C = CH[r.c]; return `<div class="du-mres${r.dup ? ' dup' : ' new'}${C.r >= 3 ? ' leg' : ''}" style="animation-delay:${(i * 0.09).toFixed(2)}s"><div class="du-fc" style="--rc:${RAR[C.r].c}"><img src="${fighterPic(r.c)}" alt=""><b>${C.ic} ${esc(C.n)}</b><small>${RAR[C.r].t}</small></div><span>${r.dup ? '+250 XP · 🥇 40' : '✨ NEW'}${r.luck ? ' · 🍀' : ''}${r.sure ? ' · 🌟' : ''}</span>${r.dup ? '' : `<button class="du-btn" data-eq="${r.c}">⚔️ Equip</button>`}</div>`; };
      const el = document.createElement('div'); el.id = 'duReel'; el.className = 'multi';
      el.innerHTML = `<h2>${EMP[e].e} ${esc(EMP[e].n)} Crate × ${res.length}</h2><div class="du-mgrid">${res.map(cell).join('')}</div>
        <p class="du-msum">${nw.length ? `<b>${nw.length} new fighter${nw.length > 1 ? 's' : ''}!</b>` : 'No new fighters this time.'}${legs.length ? ` 🌟 <b style="color:#fde68a">${legs.length} legendary!</b>` : ''}${dups ? ` · ${dups} you already had: <b>+${(dups * 250).toLocaleString()} mastery XP</b> and <b>🥇 ${dups * 40}</b> back` : ''}</p>
        <div style="display:flex;gap:10px"><button class="du-btn alt" data-x="again">🎁 Open more</button><button class="du-btn alt" data-x="close">Done</button></div>`;
      $('#xhud').append(el); sfx(legs.length ? 'reward' : nw.length ? 'unlock' : 'coin'); if (legs.length) { sfx('horn'); CROWD.ex = 1; }
      el.addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (!b) return;
        if (b.dataset.eq) { el.remove(); this.save.eq = +b.dataset.eq; this.dirty(); this.drawBar(); this.fightersPanel(+b.dataset.eq); } else if (b.dataset.x === 'again') { el.remove(); this.cratesPanel(e); } else if (b.dataset.x === 'close') { el.remove(); this.drawBar(); } });
    },
    reel(e, c, dup, luck, sure) {
      const pick = () => { let r = Math.random() * 100, k = 0; while (k < 4 && r >= ODDS[k]) { r -= ODDS[k]; k++; } return CRATE[e][k]; }, N = 46, win = 40, list = [];
      for (let i = 0; i < N; i++) list.push(i === win ? c : i === win + 1 || i === win - 1 ? CRATE[e][4] : pick()); // (the 1% one, so near…)
      const card = (q) => `<div class="du-fc" style="--rc:${RAR[CH[q].r].c}"><img src="${fighterPic(q)}" alt=""><b>${CH[q].ic} ${esc(CH[q].n)}</b><small>${RAR[CH[q].r].t}</small></div>`;
      const el = document.createElement('div'); el.id = 'duReel'; el.innerHTML = `<h2>${EMP[e].e} ${esc(EMP[e].n)} Crate</h2>${sure ? '<div class="du-luck sure">🌟 PITY — A LEGENDARY, GUARANTEED</div>' : luck ? '<div class="du-luck">🍀 2× LUCK — rare, epic and legendary chances doubled</div>' : ''}<div class="du-strip"><div class="mk"></div><div class="row">${list.map(card).join('')}</div></div><div class="du-out"></div>`;
      $('#xhud').append(el); const row = el.querySelector('.row'), W0 = el.querySelector('.du-strip').clientWidth, off = win * 142 + 66 - W0 / 2 + (Math.random() - 0.5) * 90;
      row.style.transform = 'translateX(0)'; requestAnimationFrame(() => requestAnimationFrame(() => { row.style.transition = 'transform 5.2s cubic-bezier(.08,.62,.12,1)'; row.style.transform = `translateX(${-off}px)`; }));
      let tick = 0; const tk = setInterval(() => { tick++; sfx('click', { vol: 0.4 }); }, 120); setTimeout(() => clearInterval(tk), 4200);
      setTimeout(() => {
        const C = CH[c], leg = C.r === 3, out = el.querySelector('.du-out'); sfx(leg ? 'reward' : 'unlock'); if (leg) { sfx('horn'); CROWD.ex = 1; }
        if (dup) { this.addXp(c, 250); this.save.gold = (this.save.gold | 0) + 40; this.dirty(); }
        el.querySelector('.du-strip').style.display = 'none';
        out.innerHTML = `<div class="du-won${leg ? ' leg' : ''}"><div class="du-fc" style="--rc:${RAR[C.r].c}"><img src="${fighterPic(c, 1)}" alt=""><b>${C.ic} ${esc(C.n)}</b><small>${RAR[C.r].t}</small></div>
          <p>${dup ? `You already had the ${esc(C.n)} — <b>+250 mastery XP</b> and <b>🥇 40</b> back.` : leg ? `🌟 <b style="color:#fde68a">LEGENDARY!</b> The ${esc(C.n)} is yours — ${sure ? 'your pity legendary, after 150 crates' : luck ? 'on a 2× luck roll' : 'the 1% one'}.` : `<b>New fighter!</b> The ${esc(C.n)} is yours.`}</p>
          <div style="display:flex;gap:10px">${dup ? '' : `<button class="du-btn" data-x="eq">⚔️ Equip</button>`}<button class="du-btn alt" data-x="again">🎁 Open another</button><button class="du-btn alt" data-x="close">Done</button></div></div>`;
        out.addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (!b) return; el.remove(); if (b.dataset.x === 'eq') { this.save.eq = c; this.dirty(); this.drawBar(); this.fightersPanel(c); } else if (b.dataset.x === 'again') this.cratesPanel(e); });
      }, 5400);
    },
    botPanel() {
      const S = this.save, md = [['c', '⚔️ Classic', `First to ${TO} rounds, 3 minutes a round`], ['d', '💀 Deathmatch', 'Most kills in 5 minutes — you come back at once, somewhere random'], ['b', '👹 Boss', `You vs the giant Laestrygonian in silver, bronze and gold: ${BOSS_C.hp.toLocaleString()} health, ${BOSS_LIVES} lives. Win and the Laestrygonian is yours. (Bring friends: the boss pad, up to 4)`]];
      const html = `<h4 style="margin:0 0 8px;font:800 16px var(--fh);color:#fff">Difficulty</h4><div class="du-diff">${DIFF.map((D, i) => `<button data-d="${i}" style="--dc:${D.c}" class="${S.diff === i ? 'on' : ''}">${D.e} ${D.n}<small>${esc(D.d)}<br>Win: 🪙 ${D.coins}</small></button>`).join('')}</div>
        <h4 style="margin:16px 0 8px;font:800 16px var(--fh);color:#fff">Mode</h4><div class="du-diff">${md.map(([m, n, d]) => `<button data-m="${m}" style="--dc:#fbbf24" class="${S.md === m ? 'on' : ''}">${n}<small>${esc(d)}</small></button>`).join('')}</div>
        <div style="margin-top:18px;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="du-btn" data-go="1">⚔️ Fight as ${CH[S.eq].ic} ${esc(CH[S.eq].n)}</button><button class="du-btn alt" data-fi="1">Change fighter</button></div>`;
      openPanel('🤖 Fight a bot', html, (b) => { if (b.dataset.d) { S.diff = +b.dataset.d; this.dirty(); sfx('click'); this.botPanel(); this.drawBar(); } else if (b.dataset.m) { S.md = b.dataset.m; this.dirty(); sfx('click'); this.botPanel(); } else if (b.dataset.go) this.startMatch(S.md === 'b' ? { md: 'b', coop: false, own: true, ps: [myPeer()] } : { md: S.md, pvp: false, D: S.diff }); else if (b.dataset.fi) this.fightersPanel(); }, null, { full: true });
    },
    achPanel(tab) {
      const S = this.save; tab = tab || this.achTab || 'q'; this.achTab = tab; const done = QUESTS.filter((Q) => S.own.includes(Q.c)).length;
      const qb = QUESTS.map((Q) => { const q = S[Q.key], got = S.own.includes(Q.c), C = CH[Q.c], [b1, b2, tc, bar] = Q.col, prog = Q.need.map(([x, v, ic, nm]) => [Math.min(v, q ? q[x] | 0 : 0), v, ic, nm]);
        return `<div class="du-ach" style="margin-bottom:12px"><div class="${got ? 'got' : ''}" style="border-color:rgba(${b1},.55);background:linear-gradient(90deg,rgba(${b2},.35),rgba(15,23,42,.2))"><i>${Q.ic}</i><span style="flex:1"><b>${esc(Q.n)}</b><small>Accept it, then ${esc(Q.how)} → ${C.ic} the ${esc(C.n)} <span style="color:${RAR[C.r].c}">(${RAR[C.r].t})</span>, ${esc(Q.tail)}</small>
          ${q && q.on ? `<small style="display:block;margin-top:4px;color:${tc}">${prog.map(([a, v, ic, nm]) => `${ic} ${a.toLocaleString()}/${v.toLocaleString()} ${nm}`).join(' · ')}</small><div class="du-mx" style="margin:4px 0 0"><i style="width:${prog.reduce((m, [a, v]) => m + a / v, 0) / prog.length * 100}%;background:linear-gradient(90deg,${bar})"></i></div>` : ''}</span>
          ${got ? '<span class="pr">✔ Done</span>' : q && q.on ? '<span class="pr">📜 Active</span>' : `<button class="du-btn" data-qk="${Q.key}">📜 Accept</button>`}</div></div>`; }).join('');
      const tabs = `<div class="du-tabs"><button data-tab="q" class="${tab === 'q' ? 'on' : ''}">📜 Quests <small>${done}/${QUESTS.length}</small></button><button data-tab="ach" class="${tab === 'ach' ? 'on' : ''}">🏆 Achievements <small>${S.ach.length}/${ACH.length}</small></button><button data-tab="ex" class="${tab === 'ex' ? 'on' : ''}" style="--tc:#22d3ee">🌑 Exotic <small>${S.own.includes(SKW) ? '1' : '0'}/1</small></button></div>`;
      const G = exoGoals(S), gd = G.filter(([, , v, n]) => v >= n).length, sw = CH[SKW], ownW = S.own.includes(WEN);
      const exo = `${tabs}<p style="font:600 13px var(--fb);color:#cbd5e1;margin:0 0 12px">🌑 <b style="color:#22d3ee">Exotic</b> is the rarest of all, above Mythic. No crate has them and no shop sells them: they are earned.</p>
        <div class="du-exq${S.own.includes(SKW) ? ' got' : ''}"><img src="${fighterPic(SKW, true)}" alt=""><div style="flex:1;min-width:0"><b>🎭 The Skinwalker’s Quest</b><small>Do all six and the ${sw.ic} <strong style="color:#e0f2fe">Skinwalker</strong> is yours — <span style="color:#22d3ee">${RAR[sw.r].t}</span>, an all-rounder that takes its foe’s own powers and turns them back on it: Mimic, Mimic Form, Screech, Behind You.</small>
          <div class="du-exg">${G.map(([ic, t, v, n]) => `<div class="${v >= n ? 'ok' : ''}"><i>${v >= n ? '✅' : ic}</i><span>${t}<em>${Math.min(v, n).toLocaleString()} / ${n.toLocaleString()}</em><u><s style="width:${(100 * Math.min(1, v / n)).toFixed(1)}%"></s></u></span></div>`).join('')}</div>
          <div style="margin-top:8px;font:800 13px var(--fh);color:${gd === 6 ? '#86efac' : '#a5f3fc'}">${S.own.includes(SKW) ? '✔ Done — the Skinwalker is yours' : `${gd} / 6 done`}</div></div></div>
        <div class="du-exq sec${ownW ? ' got' : ''}">${ownW ? `<img src="${fighterPic(WEN, true)}" alt="">` : '<i>❓</i>'}<div style="flex:1"><b>${ownW ? '❄️ The Wendigo' : '❓ A secret'}</b><small>${ownW ? 'You met it in the winter forest — and lived. It’s yours.' : 'Something hunts in a winter forest… Not every boss fight is the one you expect.'}</small></div></div>`;
      const html = tab === 'ex' ? exo : tab === 'q' ? `${tabs}<p style="font:600 13px var(--fb);color:#cbd5e1;margin:0 0 12px">Every new fighter has a quest of its own — the mythics, the giants, the spirit and the rest. Accept one, play, and when both counts are full it’s yours.</p>${qb}` : `${tabs}<p style="font:600 13px var(--fb);color:#cbd5e1;margin:0 0 10px">The Colosseum’s own honours — each one wins you a fighter. (The 1% legends only come from crates; the Laestrygonian from the 👹 boss or Season Pass level 100.)</p><div class="du-ach">${ACH.map((A) => { const got = S.ach.includes(A.id), v = A.k === 'mast' ? S.st.mast | 0 : S.st[A.k] | 0, C = CH[A.c];
        return `<div class="${got ? 'got' : ''}"><i>${A.ic}</i><span><b>${esc(A.n)}</b><small>${esc(A.d)} → ${C.ic} ${esc(C.n)} <span style="color:${RAR[C.r].c}">(${RAR[C.r].t})</span></small></span><span class="pr">${got ? '✔ Done' : `${Math.min(v, A.n0).toLocaleString()} / ${A.n0.toLocaleString()}`}</span></div>`; }).join('')}</div>`;
      openPanel('🏆 Duel Achievements', html, (b) => { if (b.dataset.tab) { sfx('click'); this.achPanel(b.dataset.tab); return; } const Q = b.dataset.qk && QUESTS.find((x) => x.key === b.dataset.qk);
        if (Q && !(S[Q.key] && S[Q.key].on) && !S.own.includes(Q.c)) { S[Q.key] = Object.assign({ on: 1 }, ...Q.need.map(([x]) => ({ [x]: 0 }))); this.dirty(); sfx('unlock'); toast(`📜 ${Q.n}: ${Q.how}`, Q.col[2]); this.achPanel('q'); } }, null, { full: true, extra: `<span class="xchip">${S.ach.length}/${ACH.length}</span>` });
    },
  };
  addExp(DU);
})();
