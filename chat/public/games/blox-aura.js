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
    #auStreak{position:absolute;left:50%;top:114px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:4px;pointer-events:none;--tc:#fff}
    #auStreak[hidden]{display:none!important}
    #auStreak .s{font:600 20px var(--fh);color:var(--tc);-webkit-text-stroke:5px rgba(10,12,18,.72);paint-order:stroke fill;white-space:nowrap;letter-spacing:.02em}
    #auStreak .s b{font-size:30px}
    #auStreak .s small{font:700 13px var(--fb);color:#e2e8f0}
    #auStreak .bar{width:220px;height:7px;border-radius:5px;background:rgba(0,0,0,.5);overflow:hidden;box-shadow:0 0 12px var(--tc)}
    #auStreak .bar i{display:block;height:100%;background:var(--tc);border-radius:5px}
    #auStreak.t1 .s{animation:auShk .5s infinite}#auStreak.t2 .s{animation:auShk .3s infinite}#auStreak.t3 .s{animation:auShk2 .22s infinite}
    #auStreak.t4 .s,#auStreak.t5 .s,#auStreak.t6 .s{animation:auShk3 .16s infinite}
    @keyframes auShk{0%,100%{transform:translate(0,0)}25%{transform:translate(-1px,1px) rotate(-1deg)}75%{transform:translate(1px,-1px) rotate(1deg)}}
    @keyframes auShk2{0%,100%{transform:translate(0,0) scale(1.04)}25%{transform:translate(-2px,1px) rotate(-2deg)}75%{transform:translate(2px,-2px) rotate(2deg)}}
    @keyframes auShk3{0%,100%{transform:translate(0,0) scale(1.08)}25%{transform:translate(-3px,2px) rotate(-3deg)}75%{transform:translate(3px,-2px) rotate(3deg) scale(1.12)}}
    #auVig{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .25s;background:radial-gradient(ellipse at center,transparent 52%,var(--tc,#a855f7) 150%)}
    #auTier{--tc:#a855f7;position:absolute;left:50%;top:30%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;z-index:5;animation:auTierIn 1.4s ease-out forwards;white-space:nowrap}
    #auTier .m{font:600 86px var(--fh);color:var(--tc);-webkit-text-stroke:9px rgba(10,12,18,.7);paint-order:stroke fill;line-height:1;text-shadow:0 0 40px var(--tc)}
    #auTier .n{font:600 30px var(--fh);color:#fff;-webkit-text-stroke:6px rgba(10,12,18,.7);paint-order:stroke fill;margin-top:4px}
    #auTier.rb .m{animation:auHue .6s linear infinite}
    @keyframes auTierIn{0%{transform:translate(-50%,-50%) scale(2.4) rotate(-6deg);opacity:0}12%{transform:translate(-50%,-50%) scale(1) rotate(0);opacity:1}75%{opacity:1}100%{opacity:0;transform:translate(-50%,-62%) scale(1.05)}}
    @keyframes auHue{0%{color:#f43f5e}25%{color:#facc15}50%{color:#22d3ee}75%{color:#a855f7}100%{color:#f43f5e}}
    .au-pop.t1{color:#93c5fd;font-size:22px}.au-pop.t2{color:#d8b4fe;font-size:24px}.au-pop.t3{color:#fde047;font-size:27px}.au-pop.t4{color:#fca5a5;font-size:30px}
    .au-pop.t5,.au-pop.t6{font-size:33px;animation:auPop 1s ease-out forwards,auHue .5s linear infinite}
    .au-pop.end{color:#cbd5e1;font-size:19px}
    #auTop .rn{font:600 12px var(--fh);padding:3px 10px;border-radius:999px;color:#06202a;background:linear-gradient(90deg,#22d3ee,#a855f7);animation:auShk .4s infinite}
    #auEdit{position:absolute;inset:0;pointer-events:none;z-index:4;background:radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.75))}
    #auEdit::before,#auEdit::after{content:'';position:absolute;left:0;right:0;height:9vh;background:#000;animation:auBars .35s ease-out}
    #auEdit::before{top:0}#auEdit::after{bottom:0}
    @keyframes auBars{from{height:0}}
    #auEdit .sk{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);font-size:190px;line-height:1;filter:grayscale(1) contrast(1.6) drop-shadow(0 0 30px #fff);animation:auSkull .7s ease-out forwards}
    #auEdit .tf{position:absolute;left:50%;top:66%;transform:translateX(-50%);font:600 48px var(--fh);color:#fff;letter-spacing:.24em;-webkit-text-stroke:7px #000;paint-order:stroke fill;animation:auShk3 .14s infinite;white-space:nowrap}
    @keyframes auSkull{0%{transform:translate(-50%,-50%) scale(2.6) rotate(-12deg);opacity:0}18%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(0)}100%{opacity:0;transform:translate(-50%,-50%) scale(.85)}}
    #auBox.phonk{background:radial-gradient(circle,rgba(30,0,40,.6),rgba(0,0,0,.94));animation:auShk .13s infinite}
    #auBox.phonk .win{border-color:#c026d3;box-shadow:0 0 40px #a21caf}
    #auBox.phonk h3{letter-spacing:.2em;color:#f0abfc}
    #auBox.phonk .card{filter:grayscale(.85) contrast(1.3)}
    .au-card.ph{background:linear-gradient(180deg,#18181b,#09090b)!important}
    .au-card.ph .rt::after{content:' · PHONK 💀';color:#f0abfc}
    .touchy #auStreak{top:100px;transform:translateX(-50%) scale(.85)}
    .touchy #auTop{top:58px;transform:translateX(-50%) scale(.86)}
    .touchy #auDuel{top:56px;transform:translateX(-50%) scale(.82)}
    #auTop .x2{font:600 12px var(--fh);padding:3px 10px;border-radius:999px;color:#1c1917;background:linear-gradient(90deg,#fde047,#f59e0b)}
    .au-pop.crit{font-size:32px;color:#fde047;-webkit-text-stroke:6px #7c2d12}
    .xslot.au-bpb{background:linear-gradient(180deg,#f59e0b,#7c3aed);border-color:#fde68a}
    .au-card.bpx .rt::after{content:' · BATTLE PASS 💯';color:#fde047}
    .au-bptag{display:block;margin-top:6px;font:800 11px var(--fb);color:#fde047}
    #auBP{position:absolute;left:50%;top:30%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;z-index:6;animation:auTierIn 2.2s ease-out forwards;white-space:nowrap}
    #auBP .m{font:700 20px var(--fh);letter-spacing:.2em;color:#fde047;-webkit-text-stroke:5px rgba(10,12,18,.75);paint-order:stroke fill}
    #auBP .n{font:700 66px/1.05 var(--fh);color:#fff;-webkit-text-stroke:9px rgba(76,29,149,.9);paint-order:stroke fill;text-shadow:0 0 30px #a855f7}
    #auBP .s{font:700 15px var(--fb);color:#fef3c7;margin-top:6px;-webkit-text-stroke:4px rgba(10,12,18,.7);paint-order:stroke fill}
    .au-bp .hd{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:12px}
    .au-bp .lvl{width:86px;height:86px;flex:0 0 86px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#fef08a,#f59e0b 58%,#92400e);box-shadow:0 0 26px rgba(253,224,71,.5),inset 0 -4px 0 rgba(0,0,0,.25);color:#1c1917}
    .au-bp .lvl small{font:800 10px var(--fb);letter-spacing:.14em}
    .au-bp .lvl b{font:700 38px/1 var(--fh)}
    .au-bp .xp{flex:1;min-width:200px}
    .au-bp .xp .tt{font:700 15px var(--fh);color:#fff;margin-bottom:6px}
    .au-bp .bar{height:12px;border-radius:7px;background:rgba(0,0,0,.45);overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.5)}
    .au-bp .bar i{display:block;height:100%;background:linear-gradient(90deg,#a855f7,#ec4899,#fde047);border-radius:7px}
    .au-bp .xp small,.au-bp .q small{color:#94a3b8;font:700 12px var(--fb)}
    .au-bp .prem{padding:10px 14px;border-radius:14px;margin-bottom:12px;background:linear-gradient(90deg,rgba(250,204,21,.14),rgba(168,85,247,.16));border:2px solid rgba(250,204,21,.4);font:600 13.5px/1.5 var(--fb);color:#fef3c7}
    .au-bp .prem .xp-btn{margin:6px 0 0;display:inline-flex}
    .au-bp .prem.on{border-color:#facc15;box-shadow:0 0 20px rgba(250,204,21,.3)}
    .au-bp .track{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 12px;scrollbar-width:thin}
    .au-bp .c{flex:0 0 98px;display:flex;flex-direction:column;gap:6px}
    .au-bp .c>b{text-align:center;font:700 15px var(--fh);color:#94a3b8;border-radius:9px;background:rgba(255,255,255,.06);padding:3px 0}
    .au-bp .c.on>b{background:linear-gradient(180deg,#a855f7,#7c3aed);color:#fff}
    .au-bp .c.next>b{outline:2px dashed #fde047;outline-offset:-2px;color:#fde047}
    .au-bp .c.big>b::after{content:' ⭐'}
    .au-bp .t{position:relative;height:108px;border-radius:14px;border:2px solid rgba(255,255,255,.14);background:linear-gradient(180deg,#1f2937,#111827);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:4px 4px 18px;font:inherit;cursor:default}
    .au-bp .t.p{background:linear-gradient(180deg,#3d2c07,#1a1306);border-color:rgba(250,204,21,.4)}
    .au-bp .t .e{font-size:30px;line-height:1}
    .au-bp .t .n{font:800 11px/1.15 var(--fb);text-align:center}
    .au-bp .t i{position:absolute;left:0;right:0;bottom:4px;text-align:center;font:800 10px var(--fb);font-style:normal;color:#94a3b8}
    .au-bp .t.can{cursor:pointer;border-color:#fde047;animation:auBpGlow 1.2s ease-in-out infinite}
    .au-bp .t.can i{color:#fde047}
    .au-bp .t.got{opacity:.45}
    .au-bp .t.got i{color:#86efac;font-size:14px}
    .au-bp .t.lock .e,.au-bp .t.lock .n,.au-bp .t.plock .e,.au-bp .t.plock .n{opacity:.55}
    .au-bp .t.plock{cursor:pointer}
    .au-bp .t.plock i{color:#facc15}
    @keyframes auBpGlow{0%,100%{box-shadow:0 0 10px rgba(253,224,71,.45)}50%{box-shadow:0 0 24px rgba(253,224,71,.95)}}
    .au-bp .lbs{display:flex;gap:14px;font:800 11px var(--fb);letter-spacing:.14em;color:#94a3b8;margin-bottom:4px}
    .au-bp .lbs .p{color:#facc15}
    .au-bp .q{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .au-bp .q>span{flex:1}
    .au-bp .q .bar{height:8px;margin:5px 0 3px}
    .au-bp .q .x{color:#fde047;font:700 14px var(--fh);white-space:nowrap}
    .au-bp .q.done{opacity:.6}
    .au-card.pwx .rt::after{content:' · POWER ⚡';color:#67e8f9}
    .au-pwtag{display:block;margin-top:6px;font:800 11px var(--fb);color:#67e8f9}
    #auBox.power .win{border-color:#22d3ee;box-shadow:0 0 40px #0891b2}
    #auBox.power h3{letter-spacing:.14em;color:#a5f3fc}
    .au-bp .tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:-4px 0 14px}
    .au-bp .tabs button{font:700 15px var(--fh);padding:9px 16px;border-radius:12px;border:2px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#cbd5e1;cursor:pointer}
    .au-bp .tabs button.on{background:linear-gradient(180deg,#a855f7,#6d28d9);border-color:#c4b5fd;color:#fff}
    .au-bp .tabs .pcb{margin-left:auto;font:700 16px var(--fh);color:#fde047;padding:7px 14px;border-radius:12px;background:rgba(250,204,21,.12);border:2px solid rgba(250,204,21,.35)}
    .au-bp .c.inf{flex-basis:130px}
    .au-bp .c.inf .t{height:222px;background:linear-gradient(180deg,#312e81,#0f172a);border-color:#a5b4fc}
    .au-bp .c.inf .t .e{font-size:44px}
    .au-ps .crates{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
    .au-ps .pcr{border-radius:16px;padding:12px;background:linear-gradient(180deg,#0e2a3a,#0b1220);border:2px solid #22d3ee;box-shadow:0 0 18px rgba(34,211,238,.18)}
    .au-ps .pcr.g{border-color:#a78bfa;background:linear-gradient(180deg,#2a1450,#0b0b1a);box-shadow:0 0 18px rgba(167,139,250,.25)}
    .au-ps .pcr.m{border-color:#f43f5e;background:linear-gradient(180deg,#3a0d1c,#120509);box-shadow:0 0 22px rgba(244,63,94,.3)}
    .au-ps .pcr .top{display:flex;align-items:center;gap:10px}
    .au-ps .pcr .top .e{font-size:40px}
    .au-ps .pcr b{font:700 17px var(--fh)}
    .au-ps .pcr small{display:block;color:#94a3b8;font:700 12px var(--fb)}
    .au-ps .pcr .left{color:#fde047}
    .au-ps .pcr .xp-btn{width:100%}
    .au-ps .sold{opacity:.55}
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
  const LUCK = 0.05, luckOdds = (odds, l) => odds.map((p, r) => (r >= 2 ? p * (1 + LUCK * (l | 0) * (r - 1)) : p));
  const gapOf = (l) => STREAK_GAP + 0.15 * (l | 0), cdK = (l) => 1 - 0.03 * clamp(l | 0, 0, 10);
  const dur = (secs) => { const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60); return h ? `${h}h ${m}m` : `${m}m`; };
  // the upgrades, all bought with aura: click and second power, then crits, longer streaks, aura while you're away,
  // crate luck, and three for duels. v: what it is at level l (x: your aura multiplier), t: what it says when you buy it
  const UPS = [
    { k: 'cl', g: 0, e: '🤫', n: 'Mewing Lessons', cost: clickCost, what: 'per click', v: (l, x) => '+' + short((1 + l) * x), t: 'Jawline +{n}. Clicks hit different now.' },
    { k: 'ps', g: 0, e: '💪', n: 'Sigma Grindset', cost: grindCost, what: 'per second', v: (l, x) => '+' + short((1 + l) * x), t: 'Grindset +{n}. 4am club.' },
    { k: 'cr', g: 0, e: '🎯', n: 'Aura Crit', max: 10, cost: (l) => Math.round(250 * 1.75 ** l), what: 'chance a click crits ×10', v: (l) => l * 3 + '%', d: 'Some clicks are just built different.', t: 'Crit +{n}. Your clicks are built different.' },
    { k: 'lg', g: 0, e: '🔒', n: 'Lock In', max: 8, cost: (l) => Math.round(200 * 1.8 ** l), what: 'between clicks before a streak ends', v: (l) => gapOf(l).toFixed(2) + 's', d: 'More time between clicks before your 🔥 streak ends.', t: 'Locked in +{n}. You don’t blink anymore.' },
    { k: 'af', g: 0, e: '😴', n: 'AFK Farming', max: 10, cost: (l) => Math.round(400 * 1.8 ** l), what: 'of your aura a second while you’re away', v: (l) => l * 5 + '%', d: 'Farm aura in your sleep, for up to 8 hours away.', t: 'AFK Farming +{n}. Sleep is part of the grind now.' },
    { k: 'lk', g: 1, e: '🍀', n: 'Rizz Luck', max: 10, cost: (l) => Math.round(500 * 1.9 ** l), what: 'chance of Ohio tier', v: (l) => '×' + (1 + LUCK * l * 4).toFixed(1), d: 'Every crate (and key) rolls rarer: Bussin ×' + (1 + LUCK * 10).toFixed(1) + ' up to Ohio ×' + (1 + LUCK * 40).toFixed(0) + ' at max.', t: 'Rizz Luck +{n}. The crates fear you.' },
    { k: 'hu', g: 2, e: '🍔', n: 'Mog Mass', max: 10, cost: (l) => Math.round(600 * 1.7 ** l), what: 'health in a duel', v: (l) => String(HP + l * 8), d: 'Bulk up: 8 more health in every duel, a level.', t: 'Mog Mass +{n}. Built like a fridge.' },
    { k: 'cdr', g: 2, e: '⏩', n: 'Speedrun', max: 10, cost: (l) => Math.round(800 * 1.8 ** l), what: 'ability cooldowns', v: (l) => (l ? '-' + l * 3 : '0') + '%', d: 'Any% duels: your abilities come back faster.', t: 'Speedrun +{n}. Any% duels.' },
    { k: 'tx', g: 2, e: '💸', n: 'Fanum Tax Rate', max: 10, cost: (l) => Math.round(1000 * 1.85 ** l), what: 'of their aura when you win', v: (l) => Math.round((STEAL + l * 0.01) * 100) + '%', d: 'Take a bigger bite of the loser’s aura when you win a duel.', t: 'Fanum Tax Rate +{n}. Fanum approves.' },
  ];
  const UP_GROUPS = ['💰 Farming', '🎁 Crates', '⚔️ Duels'];

  /* ---------------- the Bussin Battle Pass: XP, 50 levels, a free track and Bussin+ (Blox Coins, in the shop) ---------------- */
  const BP_MAX = 50, BP_PRICE = 500, bpNeed = (l) => 100 + 4 * (l - 1); // the XP from level l-1 to l
  const BP_TOTAL = Array.from({ length: BP_MAX }, (_, i) => bpNeed(i + 1)).reduce((a, b) => a + b, 0);
  const bpLevel = (x) => { let l = 0; while (l < BP_MAX && x >= bpNeed(l + 1)) { x -= bpNeed(l + 1); l++; } return [l, x]; }; // [level, XP into the next]
  // a reward: au (s seconds of your aura a second) · key (a free crate) · bc (Blox Coins) · x2 (m minutes of 2× aura) ·
  // ab (an ability) · lv (+1 level to your equipped abilities)
  const bpFree = (l) => ({ 5: { t: 'key', c: 'rizz' }, 10: { t: 'ab', k: 'barrage' }, 15: { t: 'key', c: 'sigma' }, 20: { t: 'x2', m: 15 }, 25: { t: 'lv' }, 30: { t: 'ab', k: 'chef' }, 35: { t: 'key', c: 'sigma' }, 40: { t: 'key', c: 'phonk' }, 45: { t: 'bc', n: 50 }, 50: { t: 'key', c: 'ohio' } })[l]
    || [{ t: 'au', s: 60 + l * 12 }, { t: 'key', c: l < 20 ? 'mid' : 'rizz' }, { t: 'bc', n: 5 + Math.floor(l / 10) * 5 }, { t: 'x2', m: 5 }][l % 4];
  const bpPrem = (l) => ({ 1: { t: 'key', c: 'sigma' }, 10: { t: 'key', c: 'phonk' }, 20: { t: 'ab', k: 'nocap' }, 25: { t: 'key', c: 'ohio' }, 30: { t: 'lv' }, 35: { t: 'key', c: 'phonk' }, 40: { t: 'x2', m: 60 }, 45: { t: 'key', c: 'ohio' }, 50: { t: 'ab', k: 'boss' } })[l]
    || [{ t: 'au', s: 150 + l * 25 }, { t: 'key', c: l < 25 ? 'rizz' : 'sigma' }, { t: 'bc', n: 10 + Math.floor(l / 10) * 5 }, { t: 'x2', m: 10 }][l % 4];
  // Pass Coins (🎟️): +20 for every level, +25 for a daily challenge, and past level 50, +20 for every 100 XP, forever
  // (Bussin+: half as much again). They buy the Pass Shop's Limited Power Crates and abilities, a new lot every day
  const PC_LV = 20, PC_DAILY = 25, PC_INF = 20, PC_INF_XP = 100;
  const POWER_CRATES = [
    { id: 'pw1', n: 'Power Crate', e: '⚡', cls: '', pc: 300, stock: 3, odds: [0, 0, 0, 50, 38, 12], au: 10000, d: 'Goated or better, every time. Has the Power abilities.' },
    { id: 'pw2', n: 'Galaxy Crate', e: '🌌', cls: 'g', pc: 750, stock: 2, odds: [0, 0, 0, 0, 70, 30], au: 25000, d: 'Sigma or Ohio, nothing else.' },
    { id: 'pw3', n: 'Mythic Crate', e: '💎', cls: 'm', pc: 1500, stock: 1, odds: [0, 0, 0, 0, 0, 100], au: 60000, d: 'Ohio tier. Guaranteed. One a day.' },
  ];
  const PC_AB = [60, 120, 250, 500, 1000, 2000], pcPrice = (k) => Math.round(PC_AB[AB[k].r] * (AB[k].pw ? 1.5 : AB[k].phonk ? 1.25 : 1));
  // today's abilities: one of each tier from Mid up, and a Power one (the same for everyone on a day)
  const shopOf = (day) => {
    const r = mulberry([...day + 'shop'].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 11) >>> 0), pick1 = (l) => l[Math.floor(r() * l.length)];
    const out = [1, 2, 3, 4, 5].map((t) => pick1(ABK.filter((k) => AB[k].r === t && !AB[k].bp && !AB[k].pw)));
    out.push(pick1(ABK.filter((k) => AB[k].pw)));
    return out;
  };
  const untilMidnight = () => { const d = new Date(), m = new Date(d); m.setHours(24, 0, 0, 0); return (m - d) / 1000; };
  // three daily challenges (the same three for everyone on a day)
  const DAILY = [
    { id: 'clk', n: 'Farm aura 300 times', goal: 300, xp: 120 }, { id: 'win', n: 'Win 2 duels', goal: 2, xp: 150 }, { id: 'duel', n: 'Play 3 duels', goal: 3, xp: 120 },
    { id: 'crate', n: 'Open 3 crates', goal: 3, xp: 100 }, { id: 'stk', n: 'Reach 🗿 SIGMA MODE (a 50-click streak)', goal: 1, xp: 120 }, { id: 'joke', n: 'Survive 3 of Unc Joe’s jokes', goal: 3, xp: 80 },
    { id: 'time', n: 'Farm for 10 minutes', goal: 600, xp: 100 }, { id: 'hit', n: 'Land 20 ability hits in duels', goal: 20, xp: 140 }, { id: 'up', n: 'Buy 5 upgrade levels', goal: 5, xp: 80 },
  ];
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const dailyOf = (day) => { const r = mulberry([...day].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7) >>> 0), pool = DAILY.slice(), out = []; while (out.length < 3) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]); return out; };
  const HB_BODY = 1.2; // a fighter's hitbox: 2.4 wide (an attack's reach is drawn this much short, so the boxes touching = a hit)
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
    rizz: { n: 'Mild Rizz', e: '💘', r: 0, k: 'proj', dmg: 9, cd: 1.6, sp: 30, d: 'A corny pickup line, thrown at their face. Honest work.', say: 'hey shawty 😏', says: ['are you Ohio? cuz you’re unexplainable', 'is your name Wi-Fi? i feel a connection', 'are you a crate? i’d spend all my aura on you', 'are you corn? cuz you’re a-maize-ing 🌽', 'do you mew? cuz you left me speechless', 'are you a W? i can’t take an L near you', 'are you a moai? cuz i’m stone-cold for you 🗿', 'you must be a Rizz Blast cuz you blew me away'] },
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
    // the Tuff Phonk Crate's own (they're in no other crate)
    cowbell: { n: 'Cowbell Barrage', e: '🔔', r: 3, phonk: 1, k: 'proj', dmg: 9, cnt: 5, spread: 0.16, cd: 5, sp: 30, d: 'Five cowbells straight out of a phonk drop.', say: '🔔🔔🔔🔔🔔' },
    drift: { n: 'Tokyo Drift', e: '🏎️', r: 3, phonk: 1, k: 'dash', dmg: 32, cd: 6, rng: 15, d: 'Drifts straight through them in a cloud of tire smoke.', say: 'drift mode 🏎️💨' },
    bass: { n: 'Bass Drop', e: '🔊', r: 4, phonk: 1, k: 'aoe', dmg: 58, rad: 11, kb: 26, cd: 9, w: 0.55, d: 'Builds up… then drops the 808 on anyone close, knocking them flying.', say: 'WAIT FOR IT…' },
    edit: { n: 'Skull Edit', e: '💀', r: 4, phonk: 1, k: 'proj', dmg: 34, stun: 2, cd: 10, sp: 26, d: 'Turns their screen into a black-and-white skull edit and freezes them for 2 seconds.', say: '💀💀💀' },
    eyes: { n: 'Close Eyes', e: '😑', r: 5, phonk: 1, k: 'beam', dmg: 80, cd: 10, w: 0.6, rng: 42, d: 'Closes its eyes and fires the tuffest beam in Ohio.', say: 'close eyes 😑' },
    montagem: { n: 'Montagem Mode', e: '🎧', r: 5, phonk: 1, k: 'self', heal: 50, shield: [35, 7], buff: [2.2, 7], cd: 20, d: 'The edit begins: phonk plays, your screen goes black and white, you heal 50, get a 35 shield and hit 2.2× harder for 7 seconds.', say: 'MONTAGEM 🎧' },
    inf: { n: 'Infinite Aura', e: '♾️', r: 5, k: 'self', heal: 60, shield: [40, 6], buff: [2, 6], cd: 18, d: 'Aura so big it has its own weather: heals 60, a 40 shield and double damage for 6 seconds.', say: '+∞ aura' },
    // Power abilities (pw): only from the Pass Shop's Limited Power Crates, or bought there
    thunder: { n: 'Gigachad Thunder', e: '⚡', r: 4, pw: 1, k: 'meteor', dmg: 82, rad: 5.5, w: 0.8, cd: 9, d: 'Calls lightning down where they’re standing a moment later.', say: 'GIGACHAD THUNDER ⚡' },
    vortex: { n: 'Rizz Vortex', e: '🌀', r: 4, pw: 1, k: 'aoe', dmg: 52, rad: 12, slow: [0.45, 3], cd: 9, w: 0.4, d: 'A whirlpool of rizz round you: hits anyone close and slows them for 3 seconds.', say: 'get in the vortex 🌀' },
    dragon: { n: 'Ohio Dragon', e: '🐉', r: 5, pw: 1, k: 'proj', dmg: 88, ex: 6, big: 1, home: 1, cd: 12, sp: 20, d: 'A dragon from Ohio that hunts them down and blows up.', say: 'OHIO DRAGON 🐉' },
    eclipse: { n: 'Sigma Eclipse', e: '🌑', r: 5, pw: 1, k: 'beam', dmg: 105, stun: 1, w: 0.9, rng: 46, cd: 12, d: 'The sun goes out. Then a beam that freezes them for a second.', say: '🌑🗿' },
    // the Bussin Battle Pass's own (bp: its level; prem: on the Bussin+ track)
    barrage: { n: 'Bussin Barrage', e: '💯', r: 3, bp: 10, k: 'proj', dmg: 13, cnt: 3, spread: 0.22, home: 1, cd: 6, sp: 24, d: 'Three 💯s that follow them round the ring.', say: 'this is bussin fr' },
    chef: { n: 'Chef’s Kiss', e: '🤌', r: 4, bp: 30, k: 'proj', dmg: 46, ex: 5, big: 1, steal: 0.4, cd: 10, sp: 20, d: 'Serves them a plate so bussin it blows up, and you keep some of their health.', say: 'chef’s kiss 🤌' },
    nocap: { n: 'No Cap Beam', e: '🧢', r: 5, bp: 20, prem: 1, k: 'beam', dmg: 70, slow: [0.5, 2.5], cd: 9, w: 0.5, rng: 44, d: 'The truth hurts: a beam that slows them by half for 2.5 seconds.', say: 'no cap 🧢🚫' },
    boss: { n: 'Final Boss Mode', e: '👑', r: 5, bp: 50, prem: 1, k: 'self', heal: 70, shield: [50, 8], buff: [2.4, 8], cd: 22, d: 'You become the final boss: heal 70, a 50 shield and 2.4× damage for 8 seconds.', say: 'FINAL BOSS MODE 👑' },
  };
  const SLAP = { n: 'Slap', e: '🫲', r: 0, k: 'melee', dmg: 6, cd: 0.6, rng: 5.5, d: 'Unc-style slap. Up close only.', say: '' };
  const abOf = (k) => (k === 'slap' ? SLAP : AB[k]);
  const ABK = Object.keys(AB), BYR = RAR.map((_, r) => ABK.filter((k) => AB[k].r === r && !AB[k].phonk && !AB[k].bp && !AB[k].pw)), PHONK_BY = RAR.map((_, r) => ABK.filter((k) => AB[k].r === r && AB[k].phonk));
  const POWER_BY = RAR.map((_, r) => ABK.filter((k) => AB[k].r === r && !AB[k].bp)); // a Power Crate: everything but the Battle Pass's own
  const CRATES = [
    { id: 'mid', n: 'Mid Crate', e: '📦', price: 50, odds: [60, 30, 9, 1, 0, 0], c: 0x9ca3af, d: 'It’s mid. What did you expect?' },
    { id: 'rizz', n: 'Rizz Crate', e: '💘', price: 400, odds: [25, 35, 28, 10, 2, 0], c: 0x60a5fa, d: 'Smells like Axe body spray.' },
    { id: 'sigma', n: 'Sigma Crate', e: '🗿', price: 3000, odds: [0, 20, 35, 30, 13, 2], c: 0xfbbf24, d: 'Only opened on a 4am grindset.' },
    { id: 'phonk', n: 'Tuff Phonk Crate', e: '💀', price: 10000, odds: [0, 0, 0, 55, 35, 10], c: 0xc026d3, phonk: true, d: 'Plays phonk when you open it. Six abilities you can’t get anywhere else. Contains only tuff.' },
    { id: 'ohio', n: 'Ohio Crate', e: '☄️', price: 25000, odds: [0, 0, 20, 40, 30, 10], c: 0xf43f5e, d: 'Nobody knows what’s in Ohio. Not even Ohio.' },
  ];
  const FREE_ODDS = CRATES[1].odds; // a W Crate (from winning a duel) rolls like a Rizz Crate
  const rollRar = (odds) => { const t = odds.reduce((a, b) => a + b, 0); let x = Math.random() * t; for (let r = 0; r < odds.length; r++) { x -= odds[r]; if (x < 0) return r; } return 0; };
  const rollAb = (odds, ph) => { const l = (ph === 'pw' ? POWER_BY : ph ? PHONK_BY : BYR)[rollRar(odds)]; return l[Math.floor(Math.random() * l.length)]; };

  /* ---------------- the brainrot ---------------- */
  const CLICK_WORDS = ['W', 'sheesh', 'no cap', 'fr fr', 'bussin', 'slay', 'rizz', 'sigma', 'mewing', 'goated', 'based', 'ate', 'locked in', 'main character', 'mogged', 'built different', 'it’s giving', 'lowkey him', 'highkey him', 'real', 'valid', 'cooking', '🗿', '💯', '🔥', '😤', 'W rizz', 'unc approved', 'aura++', 'no shot', 'goes hard', 'skibidi', 'rizzler', 'fanum tax', 'only in ohio', 'mewing streak', 'looksmaxxing', 'mogging', 'he’s him', 'chat is this real', 'on god', 'glazing', 'delulu', 'crashout', 'aura points', '6 7', 'tung tung tung', 'tralalero', 'bombardiro', 'brr brr patapim', 'goofy ahh', 'sigma grindset', 'gigachad', 'W in the chat', '+1000 aura', 'yapping', 'big W', 'unc status', 'erm what the sigma', 'what the helly', 'skibidi rizz', 'fanum taxed', 'lowkey cooking', 'aura farming', 'mog city', 'rizz god', 'no thoughts just aura'];
  const EVENTS = [['You said "no cap" and meant it.', 15], ['Your mewing streak hit 10 minutes.', 20], ['You walked past a mirror and didn’t check yourself.', 25], ['You left someone on read (respectfully).', 10], ['You understood the assignment.', 30], ['Your playlist ate.', 15], ['You held the door open. Unc behaviour, but W.', 10], ['You didn’t yap for a whole minute.', 25], ['Someone called you built different.', 20], ['You hit the griddy in public.', 15], ['You touched grass (on purpose).', 20], ['Your fit was certified bussin.', 25], ['You said "6 7" at the perfect moment.', 25], ['Tung Tung Tung Sahur knocked. You answered.', 30], ['You out-mewed your own reflection.', 20], ['A Tralalero Tralala swam past and nodded at you.', 25], ['You explained skibidi to your teacher.', 30], ['Your mom said you have rizz (it counts).', 10], ['You looksmaxxed so hard the mirror cracked.', 25], ['You fanum taxed your sibling’s fries.', 20], ['Chat, is this real? (it is)', 15], ['You crashed out, but in an aura way.', 20], ['Erm, what the sigma?', 15], ['Bombardiro Crocodilo flew over and saluted.', 30], ['You didn’t say "bro" for a whole sentence.', 20], ['You told a dad joke. Nobody laughed. +aura anyway.', 15], ['You said "it’s corn" with your whole chest. 🌽', 20], ['A phonk edit of you went viral (in Ohio). 💀', 30], ['You laughed at Unc Joe’s joke. Respectfully.', 10]];
  const WIN_LINES = ['{W} won. That’s a-maize-ing 🌽', '{L} got popped like popcorn 🍿', 'W + ratio', '{L} got cooked 💀', '{L} lost all their rizz', 'Emotional damage!', '{L} thought they were him', '{W} is him fr fr', 'Skill issue tbh', '{L} has been mogged', '{W} ate and left no crumbs'];
  const LOSE_SUBS = ['You got cooked. Like popcorn. 🍿', 'That was corny. And not the good kind. 🌽', 'Touch grass and run it back 🌱', 'You got mogged. It happens to the best of us (not really)', 'Your aura is in the negatives (spiritually)', 'L + ratio + you fell off', 'Not very sigma of you', 'Bro thought he was him 💀'];
  const JOKES = ['Why did the sigma bring a ladder to the duel? To reach a higher aura level.', 'What do you call a moai that tells jokes? A rock-star. 🗿', 'Why did the corn stalk get promoted? It was outstanding in its field. 🌽', 'What do you call corn that rizzes? A-maize-ing. 🌽', 'I’m reading a book about mewing. I can’t put my jaw down.', 'Why was the NPC so calm? It had no side quests.', 'Why did the cowbell go to school? To get more class (and more phonk).', 'What did one moai say to the other? Stop being so stone-cold.', 'Why did the shark wear sneakers? Tralalero said shoes are tuff.', 'What do you call a crocodile that flies a plane? Bombardiro. That’s literally his name.', 'How does a log wake you up? Tung tung tung. Every. Single. Time.', 'Why is the duel ring good at maths? It’s full of W’s.', 'What’s corny and goes pop? Your aura after this joke. 🍿', 'I asked a crate for a good ability. It said "mid". Tough crowd.', 'Why do sigmas never get lost? They follow the grindset.', 'My jokes are like your aura: it all depends on the streak.', 'What do you call 6 and 7 hanging out? Nobody knows. That’s the joke.', 'Why did Fanum go to the bank? To collect his tax returns. 🍟', 'Knock knock. Who’s there? Aura. Aura who? Aura you gonna laugh or what?', 'Why don’t NPCs tell jokes? Their dialogue options are limited.', 'I tried to farm aura in a corn field. Now it’s all ear-ra. 🌽', 'What do skeletons listen to? Phonk. Because they’ve got no body to dance with. 💀', 'Why did the rizzler sit on the clock? He wanted to be on time for the date.', 'What’s an Ohio resident’s favourite snack? Unexplainable chips.', 'Why can’t the moai keep a secret? It’s got big ears. 🗿'];
  const BOT_NAMES = ['NPC #4821', 'Mid Mike', 'Rizzless Randy', 'Unc Gary', 'Yapper Yasmin', 'Sigma Steve', 'Ohio Olivia', 'Skibidi Sam', 'Fanum Fan', 'Mewing Max', 'Glazer Greg', 'Delulu Dana'];
  const BIG_WORDS = ['+1000 AURA', 'HE’S HIM', 'TUNG TUNG TUNG SAHUR', 'TRALALERO TRALALA', 'BOMBARDIRO CROCODILO', 'ERM WHAT THE SIGMA', 'ONLY IN OHIO', 'CHAT IS THIS REAL', '6 7 6 7', 'SKIBIDI', 'GIGACHAD', 'AURA OVERLOAD', 'MOGGED THE WHOLE SERVER', 'INFINITE RIZZ', 'BRR BRR PATAPIM', 'LOOKSMAXXED', 'MEWING SO HARD RN', 'NO CAP FR FR'];
  const FELL_OFF = ['you fell off 💀', 'fingers said nah', 'bro got tired 😭', 'streak got ratio’d', 'skill issue', 'L + ratio', 'go touch grass then', 'NPC behaviour', 'the grindset was mid', 'chat, he fell off'];
  const RAIN_EMO = ['🧠', '🗿', '🦈', '🐊', '🪵', '🍟', '💀', '🔥', '🤫', '😭', '💯', '🚽', '🧏', '😤'];
  // the click streak: click again within STREAK_GAP seconds and it keeps going; the longer it goes, the more each click is worth
  const STREAK_GAP = 1.2;
  const TIERS = [
    { at: 0, n: '', e: '', m: 1, c: '#e9d5ff' },
    { at: 10, n: 'LOCKED IN', e: '🔒', m: 1.5, c: '#60a5fa', say: 'locked in', ring: 'LOCKED IN' },
    { at: 25, n: 'AURA FARMING', e: '🔥', m: 2, c: '#a855f7', say: 'aura farming', ring: 'AURA FARMING' },
    { at: 50, n: 'SIGMA MODE', e: '🗿', m: 3, c: '#fbbf24', say: 'sigma mode activated', ring: 'SIGMA MODE' },
    { at: 100, n: 'HE IS HIM', e: '😤', m: 4, c: '#ef4444', say: 'he is him', ring: 'HE IS HIM' },
    { at: 200, n: 'OHIO FINAL BOSS', e: '☄️', m: 5, c: 'rainbow', say: 'only in ohio', ring: 'OHIO FINAL BOSS' },
    { at: 400, n: 'BRAINROT ASCENDED', e: '🧠', m: 7, c: 'rainbow', say: 'tung tung tung tung sahur', ring: 'BRAINROT ASCENDED' },
  ];
  const tierOf = (n) => { let k = 0; for (let i = 0; i < TIERS.length; i++) if (n >= TIERS[i].at) k = i; return k; };
  const _tc = new THREE.Color();
  const tierCol = (t, time) => (TIERS[t].c === 'rainbow' ? _tc.setHSL((time * 0.35) % 1, 0.9, 0.62) : _tc.set(TIERS[t].c));
  // a ring of glowing letters for under your feet
  const RUNES = {};
  function runeTex(text) {
    if (RUNES[text]) return RUNES[text];
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.translate(128, 128); g.strokeStyle = '#fff'; g.lineWidth = 5;
    for (const r of [122, 90]) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
    const unit = [...(text + ' ✦ ')], reps = Math.max(1, Math.floor(44 / unit.length)), chars = [].concat(...Array(reps).fill(unit));
    g.font = `800 ${Math.min(22, Math.floor(640 / chars.length * 1.45))}px sans-serif`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    chars.forEach((ch, i) => { g.save(); g.rotate(i / chars.length * Math.PI * 2); g.fillText(ch, 0, -106); g.restore(); });
    g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 5; i++) { const a = i * Math.PI * 4 / 5 - Math.PI / 2; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 84, Math.sin(a) * 84); } g.stroke(); // a star in the middle
    const t = new THREE.CanvasTexture(c); return (RUNES[text] = t);
  }
  let BEAM_TEX = null;
  const beamTex = () => { if (!BEAM_TEX) { const cv = document.createElement('canvas'); cv.width = 4; cv.height = 128; const x = cv.getContext('2d'), gr = x.createLinearGradient(0, 128, 0, 0); for (const [k, a] of [[0, 0.9], [0.3, 0.45], [0.75, 0.1], [1, 0]]) gr.addColorStop(k, `rgba(255,255,255,${a})`); x.fillStyle = gr; x.fillRect(0, 0, 4, 128); BEAM_TEX = new THREE.CanvasTexture(cv); } return BEAM_TEX; };
  const emoSprite = (e, s) => { const o = new THREE.Sprite(new THREE.SpriteMaterial({ map: emoTex(e), transparent: true, depthWrite: false })); o.scale.setScalar(s); o.raycast = () => {}; return o; };
  // the aura you get from clicking, round your character: it flares on every click and gets cooler the longer your
  // streak (a glow and rising sparkles; then flames and a ring of runes; lightning; a beam and orbiting moai; rainbow; brainrot)
  function makeClickAura(parent) {
    const g = new THREE.Group(), C = { g, tier: -1, pulse: 0 }; parent.add(g);
    const card = (k, w, h, y) => { const o = fxCard(k, 0xffffff, w, h, 0, y, 0, g); o.raycast = () => {}; return o; };
    C.glow = card('glow', 5, 6, 2.9);
    C.spark = Array.from({ length: 8 }, (_, i) => Object.assign(card('twinkle', 0.7, 0.7, 1), { userData: { fx: true, i } }));
    C.flames = Array.from({ length: 10 }, () => card('flame', 0.9, 1.6, 1.3));
    C.rune = new THREE.Mesh(new THREE.CircleGeometry(3.3, 48), new THREE.MeshBasicMaterial({ map: runeTex('AURA'), transparent: true, depthWrite: false, side: THREE.DoubleSide, ...DECAL }));
    C.rune.rotation.x = -Math.PI / 2; C.rune.position.y = 0.18; C.rune.raycast = () => {}; C.rune.userData.noShadow = true; g.add(C.rune);
    C.ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...DECAL }));
    C.ring.rotation.x = -Math.PI / 2; C.ring.position.y = 0.22; C.ring.raycast = () => {}; g.add(C.ring);
    C.bolts = Array.from({ length: 4 }, () => { const o = emoSprite('⚡', 1.3); g.add(o); return o; });
    C.beam = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 10, 24, 1, true), new THREE.MeshBasicMaterial({ map: beamTex(), transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }));
    C.beam.position.y = 5; C.beam.raycast = () => {}; C.beam.userData.noShadow = true; g.add(C.beam);
    C.orbit = new THREE.Group(); C.orbit.position.y = 4.4; g.add(C.orbit);
    C.orbs = Array.from({ length: 4 }, (_, i) => { const o = emoSprite('🗿', 1.5); const a = i * Math.PI / 2; o.position.set(Math.cos(a) * 2.3, 0, Math.sin(a) * 2.3); C.orbit.add(o); return o; });
    return C;
  }
  function tickClickAura(C, tier, pulse, t) {
    if (C.tier !== tier) { // what shows at this tier
      C.tier = tier;
      C.spark.forEach((o) => (o.visible = tier >= 1)); C.flames.forEach((o) => (o.visible = tier >= 2)); C.rune.visible = tier >= 2;
      C.bolts.forEach((o) => (o.visible = tier >= 3)); C.beam.visible = tier >= 4; C.orbit.visible = tier >= 4;
      if (tier >= 2) C.rune.material.map = runeTex(TIERS[tier].ring);
      C.orbs.forEach((o, i) => { o.material.map = emoTex(tier >= 6 ? ['🦈', '🐊', '🪵', '🧠'][i] : tier >= 5 ? ['🗿', '☄️', '🗿', '☄️'][i] : '🗿'); });
    }
    C.g.visible = tier > 0 || pulse > 0;
    if (!C.g.visible) return;
    const col = tierCol(Math.max(1, tier), t);
    // the glow: steady with a streak, a flash on every click
    C.glow.visible = true;
    const gw = (tier ? 3.4 + tier * 0.95 : 0) + pulse * 3.2;
    C.glow.scale.set(gw * (1 + 0.06 * Math.sin(t * 7)), gw * 1.3, 1);
    C.glow.material.color.copy(tier ? col : _tc.set('#e9d5ff')); C.glow.material.opacity = Math.min(1, (tier ? 0.4 + tier * 0.07 : 0) + pulse * 0.6);
    // the click ring: a shockwave at your feet
    C.ring.visible = pulse > 0; if (pulse > 0) { C.ring.scale.setScalar(1 + (1 - pulse) * 3.2); C.ring.material.opacity = pulse * 0.9; C.ring.material.color.copy(tier ? col : _tc.set('#e9d5ff')); }
    if (tier >= 1) C.spark.forEach((o, i) => { const k = (t * 0.7 + i / 8) % 1, a = i * 2.4 + t * 0.6, r = 1.2 + 0.5 * Math.sin(i); o.position.set(Math.cos(a) * r, 0.4 + k * 6, Math.sin(a) * r); o.material.color.copy(col); o.material.opacity = Math.sin(k * Math.PI); });
    if (tier >= 2) {
      C.flames.forEach((o, i) => { const a = i / 10 * Math.PI * 2 + t * 0.9, h = 1.5 + tier * 0.25 + 0.5 * Math.sin(t * 13 + i * 2); o.position.set(Math.cos(a) * 1.25, 0.2 + h / 2, Math.sin(a) * 1.25); o.scale.set(0.8 + 0.15 * Math.sin(t * 17 + i), h, 1); o.material.color.copy(col).lerp(_c2.set(0xffffff), 0.15); });
      C.rune.rotation.z = t * 1.4; C.rune.material.color.copy(col); C.rune.material.opacity = 0.8;
    }
    if (tier >= 3) C.bolts.forEach((o, i) => { if (Math.random() < 0.18) { const a = Math.random() * Math.PI * 2, r = 1.2 + Math.random() * 1.3; o.position.set(Math.cos(a) * r, 0.8 + Math.random() * 5, Math.sin(a) * r); o.material.rotation = (Math.random() - 0.5) * 1.4; } o.material.opacity = Math.random() < 0.7 ? 1 : 0.15; });
    if (tier >= 4) { C.beam.material.color.copy(col); C.beam.material.opacity = 0.32 + 0.12 * Math.sin(t * 5); C.beam.rotation.y = t; C.orbit.rotation.y = t * 1.6; C.orbs.forEach((o, i) => { o.position.y = Math.sin(t * 3 + i) * 0.4; }); }
  }
  const _c2 = new THREE.Color();
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const isBot = (id) => typeof id === 'string' && id.startsWith('bot:');

  /* ---------------- the place ---------------- */
  const RINGS = [-45, -15, 15, 45].map((x) => ({ x, z: -62 }));
  const CRATE_AT = CRATES.map((C, i) => ({ x: -34, z: -20 + i * 10 }));
  const STATIONS = [{ x: 34, z: -12, e: '🤫', n: 'Mewing Station', c: 0x7c3aed, k: 'up' }, { x: 34, z: 2, e: '💪', n: 'Grindset Gym', c: 0xdb2777, k: 'up' }, { x: 34, z: 16, e: '🎒', n: 'Ability Locker', c: 0x2563eb, k: 'ab' }];
  const NOMESH = new THREE.Mesh(BOX, new THREE.MeshBasicMaterial()); NOMESH.visible = false;
  const solidBox = (x0, y0, z0, x1, y1, z1) => parts.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2, sx: x1 - x0, sy: y1 - y0, sz: z1 - z0, solid: true, on: true, ox: 0, oy: 0, oz: 0, dx: 0, dy: 0, dz: 0, c: 0, m: NOMESH });
  const sign = (text, x, y, z, size, color) => { const l = label(text, { size: size || 1.6, color }); l.position.set(x, y, z); place.add(l); return l; };

  /* ---------------- hitboxes (Show hitboxes, or H): wire boxes drawn through everything ---------------- */
  const HB_GREEN = 0x22c55e, HB_RED = 0xef4444, HB_IDLE = 0xf8fafc;
  const HB_GEO = (() => {
    const box = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), v = [];
    // a cylinder cage of radius 1 from y 0 to 1: rings top and bottom, and 8 uprights
    for (const y of [0, 1]) for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, b = (i + 1) / 48 * Math.PI * 2; v.push(Math.cos(a), y, Math.sin(a), Math.cos(b), y, Math.sin(b)); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; v.push(Math.cos(a), 0, Math.sin(a), Math.cos(a), 1, Math.sin(a)); }
    const cyl = new THREE.BufferGeometry(); cyl.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    const disc = new THREE.CircleGeometry(1, 48); disc.rotateX(-Math.PI / 2);
    return { box, cyl, fill: new THREE.BoxGeometry(1, 1, 1), disc };
  })();
  // a hitbox: wire lines plus a faint fill, always on top. kind 'box' (centred) or 'cyl' (standing on y 0)
  function hbShape(kind, c, op) {
    const g = new THREE.Group(), lm = new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: op, depthTest: false, depthWrite: false });
    const fm = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op * 0.16, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
    const line = new THREE.LineSegments(kind === 'cyl' ? HB_GEO.cyl : HB_GEO.box, lm), fill = new THREE.Mesh(kind === 'cyl' ? HB_GEO.disc : HB_GEO.fill, fm);
    if (kind === 'cyl') fill.position.y = 0.05;
    line.renderOrder = fill.renderOrder = 990; g.add(fill, line);
    g.userData.hb = { lm, fm, op };
    return g;
  }
  const hbColor = (g, c) => { const u = g.userData.hb; u.lm.color.setHex(c); u.fm.color.setHex(c); };
  const hbDrop = (g) => { const u = g.userData.hb; u.lm.dispose(); u.fm.dispose(); };

  /* ---------------- the models: carved stone, polished metal and glowing parts (and the still bits baked together) ---------------- */
  const GEO = {
    box: BOX, cyl: new THREE.CylinderGeometry(1, 1, 1, 18), oct: new THREE.CylinderGeometry(1, 1, 1, 8), sq: new THREE.CylinderGeometry(0.7071, 1, 1, 4),
    cone: new THREE.ConeGeometry(1, 1, 16), ball: new THREE.SphereGeometry(1, 18, 12), dome: new THREE.SphereGeometry(1, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2),
    gem: new THREE.OctahedronGeometry(1, 0), ring: new THREE.TorusGeometry(1, 0.08, 8, 44), thin: new THREE.TorusGeometry(1, 0.035, 6, 44),
  };
  const MATC = new Map(), mc = (k, f) => { if (!MATC.has(k)) MATC.set(k, f()); return MATC.get(k); };
  let NOISE = null;
  const noiseTex = () => { if (!NOISE) { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#bbb'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 2600; i++) { const v = 150 + Math.floor(Math.random() * 105); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 3, 1 + Math.random() * 3); } NOISE = new THREE.CanvasTexture(c); NOISE.wrapS = NOISE.wrapT = THREE.RepeatWrapping; } return NOISE; };
  const steel = (c) => mc('m' + c, () => metalMat(c));
  const lit = (c) => mc('l' + c, () => new THREE.MeshBasicMaterial({ color: c }));
  const matte = (c) => mc('a' + c, () => new THREE.MeshLambertMaterial({ color: c }));
  const stone = (c) => mc('s' + c, () => new THREE.MeshPhongMaterial({ color: c, map: noiseTex(), shininess: 8, specular: 0x222222 }));
  const shiny = (c) => mc('p' + c, () => new THREE.MeshPhongMaterial({ color: c, shininess: 80, specular: 0x666666 }));
  const GOLD = 0xf2c14e, STEEL = 0xc3cbd6;
  const pc = (p, geo, m, x, y, z, sx, sy, sz, rx, ry, rz) => { const o = new THREE.Mesh(GEO[geo] || geo, m); o.position.set(x, y, z); o.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz); if (rx || ry || rz) o.rotation.set(rx || 0, ry || 0, rz || 0); p.add(o); return o; };
  const _up = new THREE.Vector3(0, 1, 0), _ra = new THREE.Vector3(), _rb = new THREE.Vector3();
  const rod = (p, a, b, r, m) => { _ra.set(...a); _rb.set(...b).sub(_ra); const o = new THREE.Mesh(GEO.cyl, m); o.scale.set(r, _rb.length(), r); o.position.copy(_ra).addScaledVector(_rb, 0.5); o.quaternion.setFromUnitVectors(_up, _rb.normalize()); p.add(o); return o; };
  const glowAt = (p, c, w, h, x, y, z, fn) => { const o = fxCard('glow', c, w, h, x, y, z, p, fn); o.raycast = () => {}; return o; };
  // the still parts of a model become one mesh per material (dozens of pieces, a handful of draw calls)
  function bake(src) {
    const out = new THREE.Group(), by = new Map(), v3 = new THREE.Vector3(), nm = new THREE.Matrix3();
    src.updateMatrixWorld(true);
    src.traverse((o) => { if (o.isMesh && !o.userData.fx) { if (!by.has(o.material)) by.set(o.material, []); by.get(o.material).push(o); } });
    for (const [m, list] of by) {
      let n = 0, ni = 0; for (const o of list) { n += o.geometry.attributes.position.count; ni += o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count; }
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = new (n > 65535 ? Uint32Array : Uint16Array)(ni);
      let v = 0, k = 0;
      for (const o of list) {
        const G = o.geometry, P = G.attributes.position, N = G.attributes.normal, U = G.attributes.uv; nm.getNormalMatrix(o.matrixWorld);
        for (let i = 0; i < P.count; i++) {
          v3.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); pos.set([v3.x, v3.y, v3.z], (v + i) * 3);
          v3.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.set([v3.x, v3.y, v3.z], (v + i) * 3);
          if (U) uv.set([U.getX(i), U.getY(i)], (v + i) * 2);
        }
        if (G.index) for (let i = 0; i < G.index.count; i++) idx[k++] = G.index.getX(i) + v; else for (let i = 0; i < P.count; i++) idx[k++] = v + i;
        v += P.count;
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
      const mesh = new THREE.Mesh(geo, m); mesh.userData.ownGeo = true; out.add(mesh);
    }
    return out;
  }
  // build into `fn(group)`, then the still parts are baked; returns the group (moving bits added after stay as they are)
  const model = (x, y, z, ry, fn) => { const g = new THREE.Group(), S = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0; const anim = fn(S, g) || null; g.add(bake(S)); place.add(g); return { g, anim }; };
  const settle = (g) => { const parts = g.children.filter((o) => o.isMesh && !o.userData.fx); if (!parts.length) return g; const tmp = new THREE.Group(); parts.forEach((o) => tmp.add(o)); g.add(bake(tmp)); return g; };
  const mover = (p, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); return g; };
  // a stand: carved stone, a gold rim, a glowing ring
  function pedestal(S, r, h, glow) {
    pc(S, 'oct', stone(0x6b6478), 0, h / 2, 0, r, h, r, 0, Math.PI / 8);
    pc(S, 'oct', steel(GOLD), 0, h + 0.06, 0, r + 0.08, 0.12, r + 0.08, 0, Math.PI / 8);
    pc(S, 'oct', stone(0x857d93), 0, h + 0.16, 0, r - 0.25, 0.1, r - 0.25, 0, Math.PI / 8);
    if (glow != null) pc(S, 'ring', lit(glow), 0, h * 0.55, 0, r + 0.06, r + 0.06, 3, Math.PI / 2);
  }

  // the aura shrine: a moai carved in stone on three steps, glowing eyes, a red topknot, a gold halo, purple flames round it
  function buildShrine(x, z) {
    return model(x, 0, z, 0, (S, g) => {
      [[9, 0.8], [7.4, 1.6], [5.9, 2.4]].forEach(([r, top]) => { pc(S, 'oct', stone(0x5b5566), 0, top - 0.4, 0, r, 0.8, r, 0, Math.PI / 8); pc(S, 'oct', steel(GOLD), 0, top + 0.02, 0, r + 0.05, 0.08, r + 0.05, 0, Math.PI / 8); });
      const rune = new THREE.Mesh(new THREE.CircleGeometry(5.4, 48), new THREE.MeshBasicMaterial({ map: runeTex('THE AURA SHRINE'), color: 0xc084fc, transparent: true, depthWrite: false, ...DECAL }));
      rune.rotation.x = -Math.PI / 2; rune.position.y = 2.45; rune.userData.ownGeo = true; g.add(rune);
      const st = stone(0x7a7486), dk = stone(0x3f3a48);
      pc(S, 'box', st, 0, 4.1, 0, 6.6, 3.4, 4.6); // shoulders
      for (const s of [-1, 1]) { pc(S, 'box', stone(0x6d6779), s * 2.5, 3.9, -2.32, 0.7, 2.6, 0.2, 0, 0, s * 0.25); pc(S, 'box', stone(0x6d6779), s * 1.2, 2.9, -2.33, 1.6, 0.5, 0.2); } // arms carved in, hands meeting
      pc(S, 'sq', st, 0, 10.4, 0, 3.15, 9.2, 2.55, 0, Math.PI / 4); // the head, narrower at the top
      pc(S, 'box', st, 0, 13.1, -1.2, 5.4, 1.4, 1.6); // the brow
      for (const s of [-1, 1]) {
        pc(S, 'box', dk, s * 1.25, 12.0, -1.95, 1.6, 1.0, 0.3); // eye sockets
        pc(S, 'box', st, s * 2.85, 11.0, -0.2, 0.55, 3.6, 1.3); // long ears
      }
      pc(S, 'box', st, 0, 10.7, -2.0, 1.3, 3.2, 1.2, -0.12); // the nose
      pc(S, 'box', st, 0, 9.1, -2.25, 1.9, 0.6, 0.9); // nostrils
      pc(S, 'box', dk, 0, 8.25, -2.05, 2.3, 0.35, 0.4); // lips, pursed
      pc(S, 'box', st, 0, 7.2, -1.6, 3.8, 1.3, 1.2); // the chin
      pc(S, 'cyl', stone(0x9a3412), 0, 15.5, 0.2, 2.4, 1.9, 2.4); pc(S, 'cyl', stone(0xb45309), 0, 16.6, 0.2, 1.5, 0.5, 1.5); // the red topknot
      for (const s of [-1, 1]) { pc(S, 'ball', lit(0xe9d5ff), s * 1.25, 12.0, -2.12, 0.42, 0.3, 0.12); glowAt(g, 0xc084fc, 2.6, 2.2, s * 1.25, 12.0, -2.3, (o, m, t) => { m.opacity = 0.75 + 0.25 * Math.sin(t * 3 + s); }); }
      const halo = mover(g, 0, 18.6, 0.2); pc(halo, 'ring', steel(GOLD), 0, 0, 0, 3.4, 3.4, 3.4, Math.PI / 2); pc(halo, 'thin', lit(0xfde68a), 0, 0, 0, 2.9, 2.9, 2.9, Math.PI / 2); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; pc(halo, 'gem', lit(0xfde047), Math.cos(a) * 3.4, 0, Math.sin(a) * 3.4, 0.22, 0.32, 0.22); } settle(halo);
      glowAt(g, 0xc084fc, 18, 18, 0, 10, 1.5, (o, m, t) => { m.opacity = 0.3 + 0.1 * Math.sin(t * 2); });
      const fl = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, o = fxCard('flame', 0xd8b4fe, 1.6, 3, Math.cos(a) * 7.6, 2.4, Math.sin(a) * 7.6, g); o.raycast = () => {}; fl.push([o, i]); }
      return (t) => { halo.rotation.y = t * 0.6; halo.position.y = 18.6 + Math.sin(t * 1.4) * 0.3; for (const [o, i] of fl) o.scale.set(1.5 + 0.2 * Math.sin(t * 9 + i), 2.6 + 0.7 * Math.sin(t * 7 + i * 1.7), 1); rune.rotation.z = t * 0.15; };
    });
  }

  // a crate on its stand: metal bands, rivets, glowing seams and a lock; it bobs and turns; its best abilities go round above it
  function buildCrate(C, x, z) {
    const look = { mid: [0x92400e, steel(0x9ca3af), 0xfde68a], rizz: [0xdb2777, steel(0xe5e7eb), 0x93c5fd], sigma: [0x52525b, steel(GOLD), 0xfde047], phonk: [0x111014, steel(0x3f3f46), 0xc026d3], ohio: [0x7f1d1d, steel(0x1f2937), 0xf43f5e] }[C.id];
    const [body, band, seam] = look;
    return model(x, 0, z, Math.PI / 2, (S, g) => {
      pedestal(S, 3.1, 1.3, seam);
      const box = mover(g, 0, 3.4, 0), B = new THREE.Group();
      pc(B, 'box', C.id === 'mid' ? matte(body) : shiny(body), 0, 0, 0, 2.8, 2.2, 2.8);
      for (const [ax, ay, az, sx, sy, sz] of [[0, 1.1, 1.4, 3, 0.22, 0.22], [0, 1.1, -1.4, 3, 0.22, 0.22], [0, -1.1, 1.4, 3, 0.22, 0.22], [0, -1.1, -1.4, 3, 0.22, 0.22], [1.4, 1.1, 0, 0.22, 0.22, 3], [-1.4, 1.1, 0, 0.22, 0.22, 3], [1.4, -1.1, 0, 0.22, 0.22, 3], [-1.4, -1.1, 0, 0.22, 0.22, 3], [1.4, 0, 1.4, 0.22, 2.4, 0.22], [-1.4, 0, 1.4, 0.22, 2.4, 0.22], [1.4, 0, -1.4, 0.22, 2.4, 0.22], [-1.4, 0, -1.4, 0.22, 2.4, 0.22]]) pc(B, 'box', band, ax, ay, az, sx, sy, sz);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pc(B, 'ball', steel(C.id === 'sigma' ? GOLD : STEEL), sx * 1.42, sy * 1.12, sz * 1.42, 0.16);
      pc(B, 'box', lit(seam), 0, 0.62, 0, 2.86, 0.08, 2.86); // the lid's glowing seam
      pc(B, 'box', steel(GOLD), 0, 0.15, -1.45, 0.7, 0.8, 0.14); pc(B, 'gem', lit(seam), 0, 0.15, -1.55, 0.18, 0.26, 0.1); // the lock
      if (C.id === 'phonk') { // speakers on the sides and a cowbell on top
        for (const s of [-1, 1]) { pc(B, 'cyl', matte(0x09090b), s * 1.45, 0, 0, 0.9, 0.12, 0.9, 0, 0, Math.PI / 2); pc(B, 'thin', steel(0x71717a), s * 1.52, 0, 0, 0.9, 0.9, 0.9, 0, Math.PI / 2); pc(B, 'cone', matte(0x27272a), s * 1.5, 0, 0, 0.55, 0.3, 0.55, 0, 0, s * -Math.PI / 2); pc(B, 'ball', lit(0xe879f9), s * 1.62, 0, 0, 0.16); }
        pc(B, 'cone', steel(GOLD), 0, 1.85, 0, 0.55, 1.1, 0.55); pc(B, 'ring', steel(GOLD), 0, 1.3, 0, 0.56, 0.56, 0.56, Math.PI / 2); pc(B, 'ball', steel(0x52525b), 0, 1.22, 0, 0.14);
      }
      B.children.slice().forEach((o) => box.add(o)); settle(box);
      if (C.id === 'phonk') { const sk = emoSprite('💀', 1.4); sk.position.set(0, -0.35, -1.7); box.add(sk); }
      glowAt(g, seam, 7, 7, 0, 3.4, 0, (o, m, t) => { m.opacity = 0.3 + 0.15 * Math.sin(t * 2.5 + x); });
      const orbit = mover(g, 0, 6.6, 0), best = CRATES.indexOf(C) >= 0 ? C : null, top = best ? Math.max(...best.odds.map((p, r) => (p ? r : 0))) : 0;
      const pool = (C.phonk ? PHONK_BY : BYR)[top] || [];
      pool.slice(0, 3).forEach((k, i) => { const o = emoSprite(AB[k].e, 1.2); const a = i / 3 * Math.PI * 2; o.position.set(Math.cos(a) * 1.8, 0, Math.sin(a) * 1.8); orbit.add(o); });
      const sparks = C.id === 'phonk' ? [0, 1, 2].map(() => { const o = emoSprite('⚡', 1); g.add(o); return o; }) : [];
      return (t) => {
        const beat = C.id === 'phonk' ? Math.pow(Math.max(0, Math.sin(t * Math.PI * 130 / 60)), 8) : 0; // it bounces to 130 bpm
        box.position.y = 3.4 + Math.sin(t * 1.6 + x) * 0.18 + beat * 0.25; box.rotation.y = t * 0.35; box.scale.setScalar(1 + beat * 0.06);
        orbit.rotation.y = -t * 0.8;
        for (const o of sparks) if (Math.random() < 0.2) { const a = Math.random() * 6.28; o.position.set(Math.cos(a) * 2.2, 2.4 + Math.random() * 2.4, Math.sin(a) * 2.2); o.material.opacity = Math.random() < 0.6 ? 1 : 0; }
      };
    });
  }

  // the three machines: a mirror booth for mewing, a gym for the grindset, lockers for your abilities
  function buildMewing(x, z) {
    return model(x, 0, z, Math.PI / 2, (S, g) => {
      pc(S, 'box', matte(0x2e1065), 0, 0.15, 0, 6.4, 0.3, 4.6);
      pc(S, 'box', shiny(0x4c1d95), 0, 3.0, 1.9, 6, 5.4, 0.6);
      pc(S, 'box', steel(0xdbeafe), 0, 3.3, 1.55, 3.4, 3.6, 0.1); // the mirror
      for (const [fx, fy, fw, fh] of [[0, 5.2, 3.9, 0.3], [0, 1.4, 3.9, 0.3], [-1.85, 3.3, 0.3, 4.1], [1.85, 3.3, 0.3, 4.1]]) pc(S, 'box', steel(GOLD), fx, fy, 1.5, fw, fh, 0.22);
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++) pc(S, 'ball', lit(0xfde68a), s * 2.15, 1.6 + i * 1.15, 1.5, 0.13); // bulbs round the mirror
      pc(S, 'cyl', steel(0x111827), 0, 1.1, -0.4, 0.75, 0.18, 0.75); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; rod(S, [Math.cos(a) * 0.5, 0.2, -0.4 + Math.sin(a) * 0.5], [0, 1.05, -0.4], 0.06, steel(STEEL)); } // the stool
      const sh = emoSprite('🤫', 1.6); sh.position.set(-2.2, 6.6, 1.2); g.add(sh); const ear = emoSprite('🧏', 1.6); ear.position.set(2.2, 6.6, 1.2); g.add(ear);
      return (t) => { sh.position.y = 6.6 + Math.sin(t * 2) * 0.25; ear.position.y = 6.6 - Math.sin(t * 2) * 0.25; };
    });
  }
  function buildGym(x, z) {
    return model(x, 0, z, Math.PI / 2, (S, g) => {
      pc(S, 'box', matte(0x18181b), 0, 0.1, 0, 7, 0.2, 5.4);
      for (const s of [-1, 1]) { pc(S, 'box', steel(0x334155), s * 1.8, 2.4, 1.6, 0.3, 4.6, 0.3); pc(S, 'box', steel(GOLD), s * 1.8, 3.4, 1.35, 0.4, 0.15, 0.4); } // the rack
      pc(S, 'cyl', steel(STEEL), 0, 3.55, 1.35, 0.07, 4.6, 0.07, 0, 0, Math.PI / 2); for (const s of [-1, 1]) for (const k of [0, 1]) pc(S, 'cyl', matte(k ? 0xdc2626 : 0x111827), s * (1.95 + k * 0.28), 3.55, 1.35, 0.75 - k * 0.15, 0.22, 0.75 - k * 0.15, 0, 0, Math.PI / 2); // the barbell
      pc(S, 'box', matte(0x1f2937), 0, 1.0, -0.2, 3.2, 0.35, 1.0); for (const s of [-1, 1]) pc(S, 'box', steel(0x334155), s * 1.3, 0.5, -0.2, 0.15, 0.8, 0.8); // the bench
      for (let i = 0; i < 3; i++) { const dx = -2.6 + i * 0.9; pc(S, 'cyl', steel(STEEL), dx, 0.7, -2.1, 0.05, 0.7, 0.05, Math.PI / 2); for (const s of [-1, 1]) pc(S, 'cyl', matte(0x111827), dx, 0.7, -2.1 + s * 0.32, 0.22, 0.14, 0.22, Math.PI / 2); } // dumbbells
      pc(S, 'box', steel(0x334155), 2.7, 3.2, -1.6, 0.25, 6.4, 0.25); pc(S, 'box', steel(0x334155), 2.2, 6.3, -1.6, 1.2, 0.25, 0.25);
      const bag = mover(g, 1.7, 6.2, -1.6); rod(bag, [0, 0, 0], [0, -1.2, 0], 0.04, steel(STEEL)); pc(bag, 'cyl', shiny(0xb91c1c), 0, -2.6, 0, 0.6, 2.6, 0.6); pc(bag, 'dome', shiny(0x7f1d1d), 0, -1.3, 0, 0.6, 0.3, 0.6); settle(bag);
      return (t) => { bag.rotation.z = Math.sin(t * 2.4) * 0.18; bag.rotation.x = Math.sin(t * 1.7) * 0.1; };
    });
  }
  function buildLockers(x, z) {
    return model(x, 0, z, Math.PI / 2, (S, g) => {
      pc(S, 'box', matte(0x0f172a), 0, 0.1, 0, 7, 0.2, 3.4);
      for (let i = 0; i < 4; i++) {
        const lx = -2.4 + i * 1.6, open = i === 2;
        pc(S, 'box', steel(0x1d4ed8), lx, 2.3, 0.6, 1.5, 4.2, 1.5);
        for (let v = 0; v < 3; v++) pc(S, 'box', matte(0x0b1023), lx, 3.7 + v * 0.22, -0.16, 0.9, 0.08, 0.04); // vents
        pc(S, 'box', lit([0x60a5fa, 0xa78bfa, 0xfde047, 0xf472b6][i]), lx, 3.1, -0.17, 0.5, 0.3, 0.04);
        if (open) { pc(S, 'box', steel(0x1d4ed8), lx - 0.95, 2.3, -0.4, 0.08, 4.1, 1.4, 0, -0.9); glowAt(g, 0xfde047, 2.2, 3.6, lx, 2.3, -0.1); }
        else pc(S, 'box', steel(GOLD), lx + 0.5, 2.3, -0.17, 0.08, 0.5, 0.08);
      }
      const bp = emoSprite('🎒', 1.6); bp.position.set(0.8, 2.2, -0.4); g.add(bp);
      return (t) => { bp.position.y = 2.2 + Math.sin(t * 2.2) * 0.15; };
    });
  }

  // the Bussin Battle Pass stand: a gold pedestal, a spinning ring, a big 💯 and a crown going round it
  function buildPassStand(x, z) {
    return model(x, 0, z, 0, (S, g) => {
      pedestal(S, 2.2, 1.4, 0xfde047);
      pc(S, 'cyl', steel(GOLD), 0, 2.2, 0, 0.45, 1.6, 0.45);
      const ring = mover(g, 0, 5.4, 0); pc(ring, 'ring', steel(GOLD), 0, 0, 0, 2.3, 2.3, 2.3); settle(ring);
      const e = emoSprite('💯', 3.2); e.position.set(0, 5.4, 0); g.add(e);
      const crown = emoSprite('👑', 1.4); g.add(crown);
      glowAt(g, 0xfde047, 6.5, 6.5, 0, 5.4, 0);
      return (t) => { e.position.y = 5.4 + Math.sin(t * 2) * 0.3; ring.rotation.y = t * 0.9; ring.rotation.x = Math.sin(t * 0.7) * 0.5; crown.position.set(Math.cos(t * 1.3) * 2.7, 6.6, Math.sin(t * 1.3) * 2.7); };
    });
  }

  // a duel ring: posts with glowing caps, neon ropes, spotlights sweeping, a rune circle in the middle
  function buildArena(R, i) {
    return model(R.x, 0, R.z, 0, (S, g) => {
      const H = RING_H, ropes = [[1.6, 0xf472b6], [3.0, 0xa855f7], [4.4, 0x22d3ee]];
      for (const [px, pz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) { pc(S, 'cyl', steel(0x334155), px * H, 3, pz * H, 0.45, 6, 0.45); pc(S, 'cyl', matte(0xbe185d), px * H, 3, pz * H, 0.62, 3.4, 0.62); pc(S, 'ball', lit(0xf9a8d4), px * H, 6.2, pz * H, 0.55); pc(S, 'oct', stone(0x4b4458), px * H, 0.3, pz * H, 1.1, 0.6, 1.1); }
      for (const [y, c] of ropes) for (const [ax, az, bx, bz] of [[-H, -H, H, -H], [-H, H, H, H], [-H, -H, -H, H], [H, -H, H, H]]) rod(S, [ax, y, az], [bx, y, bz], 0.12, lit(c));
      const rune = new THREE.Mesh(new THREE.CircleGeometry(6.2, 48), new THREE.MeshBasicMaterial({ map: runeTex(`RING ${i + 1}`), color: 0xf472b6, transparent: true, depthWrite: false, ...DECAL }));
      rune.rotation.x = -Math.PI / 2; rune.position.y = 0.14; rune.userData.ownGeo = true; g.add(rune);
      const beams = [-1, 1].map((s) => { const b = new THREE.Mesh(new THREE.ConeGeometry(4, 15, 24, 1, true), new THREE.MeshBasicMaterial({ color: s < 0 ? 0xf0abfc : 0x93c5fd, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); b.userData.ownGeo = true; b.raycast = () => {}; const holder = mover(g, s * H, 15, -s * H); b.position.y = -7.5; holder.add(b); pc(holder, 'cyl', steel(0x1f2937), 0, 0.4, 0, 0.8, 1, 0.8); return holder; });
      return (t) => { beams.forEach((h, k) => { h.rotation.z = Math.sin(t * 0.7 + k * 2) * 0.35 + (k ? -0.3 : 0.3); h.rotation.x = Math.cos(t * 0.5 + k) * 0.3; }); rune.rotation.z = -t * 0.2; };
    });
  }

  // the classics, in 3D
  function buildTralalero(x, z) { // a shark in blue sneakers, on three legs
    return model(x, 0, z, Math.PI, (S, g) => {
      pedestal(S, 2.8, 1.6, 0x67e8f9);
      const body = mover(g, 0, 0, 0), B = new THREE.Group(), sk = shiny(0x5b7a99), wh = shiny(0xf1f5f9);
      pc(B, 'ball', sk, 0, 4.4, 0, 1.15, 1.05, 2.7); pc(B, 'ball', wh, 0, 4.05, -0.15, 0.95, 0.75, 2.4);
      pc(B, 'cone', sk, 0, 5.75, 0.3, 0.5, 1.5, 0.5, -0.35); // dorsal fin
      for (const s of [-1, 1]) { pc(B, 'cone', sk, 0, 4.8 + s * 0.6, 2.95, 0.35, 1.3, 0.35, s * 0.9 + Math.PI / 2 * 0.0, 0, 0); pc(B, 'box', sk, s * 1.25, 4.0, -0.6, 1.2, 0.12, 0.7, 0, s * 0.4, s * 0.5); pc(B, 'ball', matte(0x0b0b0b), s * 0.62, 4.75, -2.15, 0.17); }
      pc(B, 'box', matte(0x7f1d1d), 0, 3.95, -2.45, 0.9, 0.18, 0.4); for (let i = 0; i < 5; i++) pc(B, 'cone', wh, -0.36 + i * 0.18, 4.03, -2.55, 0.06, 0.16, 0.06, Math.PI);
      for (const [lx, lz] of [[-0.55, -1.0], [0.55, -1.0], [0, 1.3]]) { pc(B, 'cyl', sk, lx, 2.55, lz, 0.22, 1.9, 0.22); pc(B, 'box', shiny(0x2563eb), lx, 1.82, lz - 0.15, 0.55, 0.42, 1.0); pc(B, 'box', matte(0xffffff), lx, 1.62, lz - 0.15, 0.58, 0.12, 1.04); pc(B, 'box', lit(0xffffff), lx + 0.29, 1.85, lz - 0.1, 0.03, 0.08, 0.5, 0, 0, 0.3); }
      B.children.slice().forEach((o) => body.add(o)); settle(body);
      return (t) => { body.position.y = Math.abs(Math.sin(t * 3)) * 0.25; body.rotation.y = Math.sin(t * 0.8) * 0.4; };
    });
  }
  function buildTung(x, z) { // a wooden log with a bat
    return model(x, 0, z, Math.PI, (S, g) => {
      pedestal(S, 2.8, 1.6, 0xfdba74);
      const wood = matte(0x8b5a2b), dark = matte(0x5c3a1a);
      for (const s of [-1, 1]) { pc(S, 'cyl', wood, s * 0.45, 2.4, 0, 0.26, 1.6, 0.26); pc(S, 'box', dark, s * 0.45, 1.7, -0.15, 0.5, 0.25, 0.8); }
      pc(S, 'cyl', wood, 0, 5.1, 0, 1.05, 4.2, 1.05); pc(S, 'cyl', matte(0xd6a46b), 0, 7.22, 0, 1.0, 0.06, 1.0);
      for (const y of [3.6, 4.7, 5.9, 6.8]) pc(S, 'thin', dark, 0, y, 0, 1.06, 1.06, 3, Math.PI / 2);
      for (const s of [-1, 1]) { pc(S, 'ball', matte(0xffffff), s * 0.42, 6.0, -0.95, 0.32, 0.36, 0.12); pc(S, 'ball', matte(0x0b0b0b), s * 0.42, 6.0, -1.05, 0.13); pc(S, 'box', dark, s * 0.42, 6.5, -0.98, 0.5, 0.1, 0.1, 0, 0, s * -0.4); }
      pc(S, 'box', matte(0x1c0f06), 0, 5.2, -1.0, 0.8, 0.22, 0.08);
      rod(S, [-1.0, 5.3, 0], [-1.6, 4.0, -0.3], 0.16, wood);
      const arm = mover(g, 1.0, 5.4, 0); rod(arm, [0, 0, 0], [0.6, -0.9, -0.6], 0.16, wood); const bat = rod(arm, [0.6, -0.9, -0.6], [0.9, 1.7, -1.2], 0.18, matte(0xe5c08a)); bat.scale.x = bat.scale.z = 0.2; pc(arm, 'ball', matte(0xe5c08a), 0.9, 1.75, -1.2, 0.24); settle(arm);
      return (t) => { const k = Math.max(0, Math.sin(t * 4.5)); arm.rotation.x = -k * 0.8; arm.rotation.z = k * 0.2; };
    });
  }
  function buildBombardiro(x, z) { // a crocodile that's also a bomber plane
    return model(x, 0, z, Math.PI, (S, g) => {
      pedestal(S, 2.8, 1.6, 0x86efac);
      const plane = mover(g, 0, 5.2, 0), B = new THREE.Group(), ol = shiny(0x4d5b2a), cr = shiny(0x3f7d3a);
      pc(B, 'cyl', ol, 0, 0, 0.6, 0.8, 4.4, 0.8, Math.PI / 2); pc(B, 'cone', ol, 0, 0, 3.4, 0.8, 1.4, 0.8, Math.PI / 2);
      pc(B, 'box', ol, 0, -0.1, 0.4, 7.4, 0.16, 1.5); pc(B, 'box', ol, 0, 0.2, 3.4, 2.6, 0.12, 0.8); pc(B, 'box', ol, 0, 0.75, 3.5, 0.12, 1.2, 0.8);
      for (const s of [-1, 1]) { pc(B, 'cyl', matte(0x3f3f46), s * 2.2, -0.65, 0.3, 0.2, 1.2, 0.2, Math.PI / 2); pc(B, 'ball', matte(0x3f3f46), s * 2.2, -0.65, -0.3, 0.2); pc(B, 'cyl', steel(0x52525b), s * 2.2, -0.2, 0.3, 0.06, 0.4, 0.06); pc(B, 'cyl', steel(0x3f3f46), s * 2.2, 0, -0.45, 0.3, 0.6, 0.3, Math.PI / 2); }
      pc(B, 'box', cr, 0, 0.05, -2.0, 1.3, 0.8, 2.0); pc(B, 'box', cr, 0, -0.05, -3.4, 0.95, 0.45, 1.6); pc(B, 'box', cr, 0, -0.38, -3.2, 0.9, 0.22, 1.9); // the head and jaws
      for (const s of [-1, 1]) { pc(B, 'ball', matte(0xfef9c3), s * 0.42, 0.6, -1.7, 0.26); pc(B, 'ball', matte(0x0b0b0b), s * 0.42, 0.65, -1.85, 0.11); for (let i = 0; i < 6; i++) pc(B, 'cone', matte(0xffffff), s * 0.44, -0.24, -2.4 - i * 0.3, 0.06, 0.18, 0.06, Math.PI); }
      B.children.slice().forEach((o) => plane.add(o)); settle(plane);
      const props = [-1, 1].map((s) => { const p = mover(plane, s * 2.2, 0, -0.78); pc(p, 'box', matte(0x18181b), 0, 0, 0, 1.6, 0.14, 0.04); pc(p, 'box', matte(0x18181b), 0, 0, 0, 0.14, 1.6, 0.04); settle(p); return p; });
      return (t) => { plane.position.y = 5.2 + Math.sin(t * 1.3) * 0.4; plane.rotation.z = Math.sin(t * 0.9) * 0.18; plane.rotation.x = Math.sin(t * 1.3) * 0.05; for (const p of props) p.rotation.z = t * 25; };
    });
  }

  // the 6 7 hologram: two glowing seven-segment digits over a projector that nobody can explain
  function buildHolo(x, z) {
    const SEG = { a: [0, 1, 1.2, 0.26], b: [0.6, 0.5, 0.26, 1.0], c: [0.6, -0.5, 0.26, 1.0], d: [0, -1, 1.2, 0.26], e: [-0.6, -0.5, 0.26, 1.0], f: [-0.6, 0.5, 0.26, 1.0], g: [0, 0, 1.2, 0.26] };
    return model(x, 0, z, 0, (S, g) => {
      pc(S, 'cyl', steel(0x334155), 0, 0.5, 0, 1.6, 1, 1.6); pc(S, 'ring', lit(0x22d3ee), 0, 1.02, 0, 1.4, 1.4, 1.4, Math.PI / 2); pc(S, 'cyl', lit(0xa5f3fc), 0, 1.1, 0, 0.5, 0.1, 0.5);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(3.4, 6, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); cone.rotation.x = Math.PI; cone.position.y = 4.1; cone.userData.ownGeo = true; cone.raycast = () => {}; g.add(cone);
      const digit = (segs, c, dx) => { const d = mover(g, dx, 8, 0), m = new THREE.MeshBasicMaterial({ color: c, transparent: true }); for (const s of segs) { const [sx, sy, w, h] = SEG[s]; const o = new THREE.Mesh(BOX, m); o.position.set(sx * 1.6, sy * 1.6, 0); o.scale.set(w * 1.6, h * 1.6, 0.3); d.add(o); } glowAt(d, c, 6, 7, 0, 0, 0); d.userData.m = m; return d; };
      const six = digit('acdefg', 0x22d3ee, -1.8), seven = digit('abc', 0xf472b6, 1.8);
      return (t) => { six.position.y = 8 + Math.sin(t * 3) * 0.9; seven.position.y = 8 - Math.sin(t * 3) * 0.9; six.rotation.y = seven.rotation.y = Math.sin(t * 0.6) * 0.3; const fl = Math.random() < 0.06 ? 0.4 : 1; six.userData.m.opacity = seven.userData.m.opacity = fl; };
    });
  }

  // the Ohio portal: a stone arch round a swirling disk, everything nearby drifting in
  let SWIRL = null;
  const swirlTex = () => { if (!SWIRL) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.translate(128, 128); for (let i = 0; i < 900; i++) { const a = i * 0.11, r = i / 900 * 124; g.fillStyle = `hsla(${270 - i / 900 * 130},90%,${45 + (i % 3) * 12}%,0.9)`; g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, 2 + r / 18, 0, Math.PI * 2); g.fill(); } SWIRL = new THREE.CanvasTexture(c); } return SWIRL; };
  function buildPortal(x, z) {
    return model(x, 0, z, Math.PI / 2, (S, g) => {
      const st = stone(0x4b4458);
      for (const s of [-1, 1]) { pc(S, 'box', st, s * 5.2, 2.8, 0, 1.5, 5.6, 1.6); pc(S, 'box', stone(0x3a3445), s * 5.2, 0.3, 0, 2, 0.6, 2.1); }
      const arch = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.75, 10, 36, Math.PI), st); arch.position.y = 5.6; S.add(arch);
      for (let i = 0; i < 7; i++) { const a = i / 6 * Math.PI; pc(S, 'gem', lit(0xa855f7), Math.cos(a) * 5.2, 5.6 + Math.sin(a) * 5.2, -0.8, 0.28, 0.4, 0.2); }
      const disk = new THREE.Mesh(new THREE.CircleGeometry(4.5, 48), new THREE.MeshBasicMaterial({ map: swirlTex(), transparent: true, side: THREE.DoubleSide, depthWrite: false })); disk.position.y = 5.2; disk.userData.ownGeo = true; disk.raycast = () => {}; g.add(disk);
      glowAt(g, 0x8b5cf6, 13, 13, 0, 5.2, 0, (o, m, t) => { m.opacity = 0.5 + 0.2 * Math.sin(t * 4); });
      const bits = Array.from({ length: 10 }, (_, i) => { const o = emoSprite(['🗿', '🌽', '💀', '🧠', '🍟'][i % 5], 0.9); g.add(o); return o; });
      return (t) => { disk.rotation.z = -t * 1.6; bits.forEach((o, i) => { const k = (t * 0.35 + i / 10) % 1, a = i * 2.1 + t; o.position.set(Math.cos(a) * 6 * (1 - k), 5.2 + Math.sin(a) * 5 * (1 - k), -3 * (1 - k)); o.material.opacity = Math.min(1, (1 - k) * 2); o.scale.setScalar(0.3 + (1 - k)); }); };
    });
  }

  // corn (it's corny now): stalks with cobs and leaves, all baked into one
  function cornStalk(S, x, z, h, r) {
    const st = matte(0x4d7c0f), lf = matte(0x65a30d);
    pc(S, 'cyl', st, x, h / 2, z, 0.1, h, 0.1);
    for (let i = 0; i < 4; i++) { const y = 0.8 + i * h * 0.2, a = r() * 6.28; pc(S, 'box', lf, x + Math.cos(a) * 0.55, y, z + Math.sin(a) * 0.55, 1.2, 0.05, 0.22, 0, -a, 0.5); }
    for (let i = 0; i < 1 + (r() < 0.5 ? 1 : 0); i++) { const a = r() * 6.28, y = h * (0.5 + i * 0.15); pc(S, 'cyl', matte(0xfacc15), x + Math.cos(a) * 0.3, y, z + Math.sin(a) * 0.3, 0.17, 0.75, 0.17, 0.4 * Math.cos(a), 0, -0.4 * Math.sin(a)); pc(S, 'box', lf, x + Math.cos(a) * 0.36, y - 0.2, z + Math.sin(a) * 0.36, 0.22, 0.7, 0.08, 0, -a, 0.3); }
    pc(S, 'cone', matte(0xd9a441), x, h + 0.3, z, 0.25, 0.7, 0.25);
  }
  function buildCorn(spots) { return model(0, 0, 0, 0, (S) => { const r = mulberry(4242); for (const [x, z] of spots) cornStalk(S, x + (r() - 0.5), z + (r() - 0.5), 3.6 + r() * 1.6, r); }); }

  // phonk, made on the spot: a cowbell riff, an 808 and hi-hats at 130 bpm (with the sound on)
  let NOISE_BUF = null;
  const noiseBuf = (ac) => { if (!NOISE_BUF || NOISE_BUF.sampleRate !== ac.sampleRate) { NOISE_BUF = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate); const d = NOISE_BUF.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return NOISE_BUF; };
  function phonk(secs, bpm = 130) {
    const A = window.Sfx && Sfx.on && Sfx.audio && Sfx.audio(); if (!A) return null;
    const { ac, out } = A, step = 60 / bpm / 4, t0 = ac.currentTime + 0.05, n = Math.floor(secs / step);
    noiseBuf(ac);
    const bus = ac.createGain(); bus.gain.value = 0.5; bus.connect(out);
    const sh = ac.createWaveShaper(), cv = new Float32Array(256); for (let i = 0; i < 256; i++) cv[i] = Math.tanh((i / 128 - 1) * 3.5); sh.curve = cv; sh.connect(bus);
    const RIFF = [0, -1, 0, 3, -1, 5, 3, -1, 7, -1, 5, 3, -1, 3, 5, -1], BASS = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0];
    const note = (f, t, d, vol, type, filt) => { const o = ac.createOscillator(), gn = ac.createGain(), bp = ac.createBiquadFilter(); o.type = type; o.frequency.value = f; bp.type = 'bandpass'; bp.frequency.value = filt || f * 1.4; bp.Q.value = 2.5; gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.004); gn.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(bp).connect(gn).connect(bus); o.start(t); o.stop(t + d + 0.02); };
    for (let i = 0; i < n; i++) {
      const t = t0 + i * step, s = i % 16, r = RIFF[(s + (i >> 4) * 0) % 16];
      if (r >= 0) { const f = 560 * 2 ** (r / 12); note(f, t, 0.2, 0.16, 'square'); note(f * 1.505, t, 0.18, 0.09, 'square'); } // cowbell: two square waves, bandpassed
      if (BASS[s]) { const o = ac.createOscillator(), gn = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(41, t + 0.14); gn.gain.setValueAtTime(0.85, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(gn).connect(sh); o.start(t); o.stop(t + 0.65); }
      const hat = ac.createBufferSource(), hp = ac.createBiquadFilter(), hg = ac.createGain(); hat.buffer = NOISE_BUF; hp.type = 'highpass'; hp.frequency.value = 7500; hg.gain.setValueAtTime(s % 2 ? 0.05 : 0.11, t); hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); hat.connect(hp).connect(hg).connect(bus); hat.start(t); hat.stop(t + 0.06);
      if (s === 4 || s === 12) { const cl = ac.createBufferSource(), bp = ac.createBiquadFilter(), cg = ac.createGain(); cl.buffer = NOISE_BUF; bp.type = 'bandpass'; bp.frequency.value = 1500; cg.gain.setValueAtTime(0.3, t); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); cl.connect(bp).connect(cg).connect(bus); cl.start(t); cl.stop(t + 0.2); }
    }
    return { stop() { try { bus.gain.setTargetAtTime(0, ac.currentTime, 0.05); setTimeout(() => bus.disconnect(), 500); } catch (e) {} } };
  }
  // ba dum tss (after a corny joke)
  function rimshot() {
    const A = window.Sfx && Sfx.on && Sfx.audio && Sfx.audio(); if (!A) return;
    const { ac, out } = A, t = ac.currentTime + 0.02;
    [[220, 0], [160, 0.16]].forEach(([f, d]) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(f, t + d); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + d + 0.15); g.gain.setValueAtTime(0.5, t + d); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.18); o.connect(g).connect(out); o.start(t + d); o.stop(t + d + 0.2); });
    const c = ac.createBufferSource(), hp = ac.createBiquadFilter(), g = ac.createGain(); c.buffer = noiseBuf(ac); hp.type = 'highpass'; hp.frequency.value = 6000; g.gain.setValueAtTime(0.25, t + 0.34); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0); c.connect(hp).connect(g).connect(out); c.start(t + 0.34); c.stop(t + 1.05);
  }

  const AU = {
    id: 'aura', code: 'au', genre: 'Simulator', rank: 0.001, name: '+1 Aura Every Second', emoji: '🗿', max: 12, stat: 'Aura', killY: -30, camDist: 20,
    land: { theme: 'blossom', fence: 'stone' },
    color: 'linear-gradient(135deg,#7c3aed,#db2777 55%,#f59e0b)',
    desc: 'You get +1 aura every second, no cap, and clicking farms way more. Open crates for abilities (NPC, Mid, Bussin, Goated, Sigma and Ohio tier: the rarer, the more goated), then challenge people to 1v1 duels in the rings. Abilities hit harder the more aura you have, and the winner steals 20% of the loser’s aura. Bots duel you when nobody’s around. Fully satirical. Your aura is saved.',
    welcome: 'You get +1 aura every second. Click fast anywhere to farm more: keep the streak going for ×2 aura and up 🔥 Then duel people to steal theirs. No cap.',
    welcomeTouch: 'You get +1 aura every second. Tap fast anywhere to farm more: keep the streak going for ×2 aura and up 🔥 Then duel people to steal theirs. No cap.',
    build() {
      sky('#a78bfa', '#fce7f3');
      slab(0, 0, -18, 128, 128, 0xede9fe, { sy: 2 });
      this.anims = [];
      const add = (m) => { if (m.anim) this.anims.push(m.anim); return m; };
      // the aura shrine (steps you can climb; the moai's solid)
      add(buildShrine(0, -24));
      for (const [r, top] of [[8, 0.8], [6.6, 1.6], [5.2, 2.4]]) solidBox(-r, 0, -24 - r, r, top, -24 + r);
      solidBox(-3.3, 2.4, -26.3, 3.3, 18, -21.7);
      sign('🗿 THE AURA SHRINE', 0, 3.4, -15.2, 1.5, '#e9d5ff');
      sign('+1 AURA EVERY SECOND', 0, 25, -36, 4.4, '#fde047');
      // signs (very serious)
      for (const [t, x, z, c] of [['NO CAP ZONE 🧢🚫', 44, 30, '#86efac'], ['🚧 OHIO BORDER — DO NOT CROSS', -40, 38, '#fca5a5'], ['AURA FARMING IN PROGRESS 🗿', 14, -16, '#c4b5fd'], ['-1000 AURA FOR YAPPING', -14, 38, '#fde68a']]) { part({ x, y: 1.8, z, sx: 0.4, sy: 3.6, sz: 0.4, c: 0x78716c }); sign(t, x, 4.6, z, 1.2, c); }
      // the crates, on stands
      this.crates = CRATES.map((C, i) => {
        const { x, z } = CRATE_AT[i];
        add(buildCrate(C, x, z)); solidBox(x - 3, 0, z - 3, x + 3, 5, z + 3);
        sign(`${C.e} ${C.n}\n🗿 ${comma(C.price)} aura`, x, 8.6, z, 1.25, C.phonk ? '#f0abfc' : '#fff');
        return { x, z, C };
      });
      // the machines: click power, aura a second, your abilities
      add(buildMewing(STATIONS[0].x, STATIONS[0].z)); add(buildGym(STATIONS[1].x, STATIONS[1].z)); add(buildLockers(STATIONS[2].x, STATIONS[2].z));
      for (const M of STATIONS) { solidBox(M.x - 2.6, 0, M.z - 3.4, M.x + 2.6, 6, M.z + 3.4); sign(`${M.e} ${M.n}`, M.x, 8.6, M.z, 1.4); }
      // the duel rings: you can't get in (you're teleported in) or out (until it's over)
      sign('⚔️ THE DUEL RINGS', 0, 13, -44, 2.4, '#fca5a5');
      part({ x: 0, y: 0.8, z: -44, sx: 7, sy: 1.6, sz: 3, c: 0x7f1d1d });
      sign('🤖 Duel a bot here', 0, 4.2, -44, 1.1, '#fecaca');
      RINGS.forEach((R, i) => {
        part({ x: R.x, y: 0.05, z: R.z, sx: RING_H * 2, sy: 0.1, sz: RING_H * 2, c: 0x1e1b4b, plain: true });
        for (const [x, z, sx, sz] of [[R.x, R.z - RING_H, RING_H * 2 + 1, 0.6], [R.x, R.z + RING_H, RING_H * 2 + 1, 0.6], [R.x - RING_H, R.z, 0.6, RING_H * 2 + 1], [R.x + RING_H, R.z, 0.6, RING_H * 2 + 1]]) part({ x, y: 3.5, z, sx, sy: 7, sz, c: 0xbfdbfe, alpha: 0.07 });
        add(buildArena(R, i));
        sign(`⚔️ RING ${i + 1}`, R.x, 10, R.z + RING_H, 1.6);
      });
      // the brainrot: the classics in 3D, the 6 7 hologram, a portal to Ohio, the Mewing Zone
      add(buildTralalero(-24, 31)); add(buildTung(24, 31)); add(buildBombardiro(0, 40));
      for (const [n, x, z, c] of [['TRALALERO TRALALA', -24, 31, '#67e8f9'], ['TUNG TUNG TUNG SAHUR', 24, 31, '#fdba74'], ['BOMBARDIRO CROCODILO', 0, 40, '#86efac']]) { solidBox(x - 2.6, 0, z - 2.6, x + 2.6, 1.6, z + 2.6); sign(n, x, x === 0 ? 9.6 : 9, z, 1.1, c); }
      add(buildHolo(-14.5, -6)); solidBox(-16.1, 0, -7.6, -12.9, 1, -4.4);
      sign('the 6 7 hologram (nobody knows what it means)', -14.5, 2.4, -3.8, 0.9, '#e2e8f0');
      add(buildPortal(-52, 28)); for (const s of [-1, 1]) solidBox(-53, 0, 28 + s * 5.2 - 0.8, -51, 5.6, 28 + s * 5.2 + 0.8);
      sign('🌀 OHIO PORTAL\n(closed for maintenance)', -52, 13.5, 28, 1.2, '#d8b4fe');
      part({ x: 14, y: 0.06, z: 30, sx: 10, sy: 0.12, sz: 10, c: 0x0ea5e9, alpha: 0.35 });
      sign('🤫 MEWING ZONE (no yapping)', 14, 4, 30, 1.1, '#bae6fd');
      // Unc Joe's corny joke corner (and actual corn, because it's corny now)
      part({ x: -12, y: 0.25, z: 12, sx: 7, sy: 0.5, sz: 5, c: 0x854d0e });
      part({ x: -12, y: 0.52, z: 12, sx: 7.2, sy: 0.06, sz: 5.2, c: 0xfacc15, neon: true });
      model(-10, 0.5, 10.6, 0, (S) => { rod(S, [0, 0, 0], [0, 3.2, 0], 0.06, steel(STEEL)); pc(S, 'cyl', steel(0x1f2937), 0, 0.05, 0, 0.5, 0.1, 0.5); pc(S, 'ball', steel(0x52525b), 0, 3.4, -0.1, 0.26); });
      sign('🌽 JOKE CORN-ER\nwith Unc Joe', -12, 7.4, 12, 1.15, '#fde68a');
      const spots = [];
      for (let x = -58; x <= 58; x += 4.5) if (Math.abs(x) > 5) spots.push([x, 43]);
      for (let z = -36; z <= 40; z += 5) { spots.push([-61, z]); spots.push([61, z]); }
      for (let i = 0; i < 7; i++) spots.push([-15.2 + i * 1.1, 9.3]);
      buildCorn(spots);
      // the Bussin Battle Pass stand
      add(buildPassStand(12, 12)); solidBox(10.2, 0, 10.2, 13.8, 2, 13.8);
      sign('💯 BUSSIN BATTLE PASS', 12, 9.6, 12, 1.25, '#fde047');
      this.unc = makeAvatar(okAv([1, 2, 3, 7, 4, 0, 0, 2, 0, 0]), '🧓 Unc Joe', false); this.unc.g.position.set(-12, 0.55, 12); this.unc.g.rotation.y = Math.PI; scene.add(this.unc.g);
      this.uncAt = -1e9; this.uncBub = null;
      this.fx = []; this.pjv = new Map(); this.botAv = new Map(); this.fv = new Map(); this.tags = new Map(); this.props = [];
    },
    pres() { return { au: 0, br: 0, eq: [], tq: [], th: 0, sk: 0, u: [] }; },
    async enter() {
      Object.assign(this, { H: null, lastG: null, gSeen: null, g: null, D: null, q: [], qn: 0, evSeen: null, acc: 0, evT: 40 + Math.random() * 30, clicks: [], duelId: 0, myIdx: -1, cdUntil: {}, move: null, chal: null, chalKey: '', resT: 0, backAt: 0, barHtml: '', sentAt: 0, savedAt: performance.now(), dirty: false, hpSeen: null, frozeBy: false, popAt: 0, streak: 0, lastClick: 0, tier: 0, pulseAt: 0, rainAt: 0 });
      const s = await kvGet('au');
      const S = this.S = Object.assign({ au: 0, tot: 0, cl: 0, ps: 0, ab: { rizz: 1, side: 1 }, eq: ['rizz', 'side'], free: 1, w: 0, l: 0, best: 0, op: 0, hb: false, keys: {}, bx: 0, bpc: {}, dq: null, x2u: 0, seen: 0, pc: 0, pcl: null, pco: 0, pshop: null }, s && typeof s === 'object' ? s : {});
      S.au = Math.max(0, +S.au || 0); S.tot = Math.max(0, +S.tot || 0); S.cl = Math.max(0, S.cl | 0); S.ps = Math.max(0, S.ps | 0); S.free = Math.max(0, S.free | 0); S.hb = !!S.hb;
      for (const u of UPS) if (u.max) S[u.k] = clamp(S[u.k] | 0, 0, u.max);
      const keys = {}; for (const C of CRATES) if (S.keys && S.keys[C.id] > 0) keys[C.id] = S.keys[C.id] | 0; S.keys = keys;
      S.bx = Math.max(0, +S.bx || 0); S.bpc = S.bpc && typeof S.bpc === 'object' ? S.bpc : {}; S.x2u = +S.x2u || 0;
      if (!S.dq || typeof S.dq !== 'object' || !S.dq.p || !S.dq.done) S.dq = null;
      S.pc = Math.max(0, Math.floor(+S.pc || 0)); S.pco = Math.max(0, S.pco | 0);
      if (!S.pshop || typeof S.pshop !== 'object' || !S.pshop.b) S.pshop = null;
      if (S.pcl == null) S.pcl = 0; // (levels you'd reached before Pass Coins: they pay out now)
      this.payLevels();
      // AFK Farming: what you farmed while you were away (up to 8 hours)
      const away = S.seen ? (Date.now() - S.seen) / 1000 : 0; S.seen = Date.now();
      if (S.af > 0 && away > 60) { const secs = Math.min(away, 8 * 3600), v = Math.floor(secs * (1 + S.ps) * (hasItem('au2') ? 2 : 1) * 0.05 * S.af); if (v > 0) { this.gain(v); setTimeout(() => { toast(`😴 You were away ${dur(secs)} and AFK-farmed +${comma(v)} aura`, '#c4b5fd'); sfx('reward'); }, 1800); } }
      const ab = {}; for (const k of Object.keys(S.ab || {})) if (AB[k]) ab[k] = clamp(S.ab[k] | 0, 1, MAX_LV); S.ab = ab;
      S.eq = [...new Set((Array.isArray(S.eq) ? S.eq : []).filter((k) => S.ab[k]))].slice(0, 4);
      const hud = $('#xhud');
      this.top = document.createElement('div'); this.top.id = 'auTop'; hud.append(this.top);
      this.duelEl = document.createElement('div'); this.duelEl.id = 'auDuel'; this.duelEl.hidden = true; hud.append(this.duelEl);
      this.hurtEl = document.createElement('div'); this.hurtEl.id = 'auHurt'; hud.append(this.hurtEl);
      this.vig = document.createElement('div'); this.vig.id = 'auVig'; hud.append(this.vig);
      this.stEl = document.createElement('div'); this.stEl.id = 'auStreak'; this.stEl.hidden = true; this.stEl.innerHTML = '<div class="s"></div><div class="bar"><i></i></div>'; hud.append(this.stEl);
      this.drawTop(true); this.drawBar(); this.send(true);
    },
    leave() {
      if (this.S) this.save();
      this.editOff(); if (this.music) { this.music.stop(); this.music = null; }
      if (this.unc) { dropAvatar(this.unc); this.unc = null; }
      for (const a of this.botAv.values()) dropAvatar(a);
      this.botAv = new Map(); this.pjv = new Map(); this.fv = new Map(); this.tags = new Map(); this.fx = [];
      P.frozen = false;
    },
    save() { this.dirty = false; this.savedAt = performance.now(); this.S.seen = Date.now(); return kvSet('au', this.S); },
    send(now) {
      const S = this.S, t = performance.now();
      if (!S || (!now && t - this.sentAt < 1000)) return;
      this.sentAt = t;
      send({ au: Math.floor(S.au), br: this.bestRar(), eq: S.eq.flatMap((k) => [k, S.ab[k] | 0]), th: hasItem('hp') ? 1 : 0, sk: this.tier | 0, u: [S.hu | 0, S.cdr | 0, S.tx | 0] });
    },
    bestRar() { return Math.max(0, ...Object.keys(this.S.ab).map((k) => AB[k].r)); },
    spawn() {
      const D = this.D;
      if (D && D.ph !== 'end') { const R = RINGS[D.r]; return [R.x, 0.6, R.z + (this.myIdx ? -8 : 8), this.myIdx ? Math.PI : 0]; }
      return [(Math.random() - 0.5) * 10, 0.6, 22 + Math.random() * 4, 0];
    },
    speed() { const D = this.D; return D && D.ph === 'fight' && (D.sl || [])[this.myIdx] > 0 ? 8 : 16; },
    mult() { return (hasItem('au2') ? 2 : 1) * (this.x2Left() > 0 ? 2 : 1); },
    x2Left() { return Math.max(0, ((this.S && this.S.x2u) || 0) - Date.now()) / 1000; }, // a 2× aura boost from the Battle Pass
    perSec() { return (1 + this.S.ps) * this.mult(); },
    perClick() { return (1 + this.S.cl) * this.mult(); },
    gap() { return gapOf(this.S.lg); },

    /* ---------------- aura ---------------- */
    gain(n) {
      const S = this.S; S.au += n; S.tot += n; if (S.au > S.best) S.best = S.au;
      this.dirty = true; questMax('aura.farm', Math.floor(S.tot));
    },
    // a click: anywhere on the world, the big button, or F (a few a second at most: autoclickers aren't sigma)
    farm(x, y) {
      const t = performance.now(); this.clicks = this.clicks.filter((c) => t - c < 1000);
      this.lastClick = t; // (a click over the limit still keeps your streak going)
      if (this.clicks.length >= MAX_CPS) return;
      this.clicks.push(t);
      this.streak++;
      const k = tierOf(this.streak); if (k > this.tier) this.tierUp(k);
      const T = TIERS[this.tier], rain = this.rainOn() ? 2 : 1, crit = this.S.cr > 0 && Math.random() < this.S.cr * 0.03, n = Math.round(this.perClick() * T.m * rain * (crit ? 10 : 1));
      this.gain(n); this.pulseAt = t;
      this.bpClk = (this.bpClk | 0) + 1; if (this.bpClk % 5 === 0) this.xp(1); this.daily('clk', 1);
      if (crit) { this.pop(x == null ? innerWidth / 2 : x, (y == null ? innerHeight - 150 : y) - 34, `💥 CRIT ×10 · +${short(n)} aura`, 'crit'); sfx('kill', { vol: 0.6 }); this.drawTop(); return; }
      sfx('tap', { vol: 0.5, pitch: 0.85 + this.tier * 0.13 + Math.random() * 0.25 });
      const word = this.tier >= 2 || Math.random() < 0.4 ? ' · ' + pick(this.tier >= 4 && Math.random() < 0.6 ? BIG_WORDS : CLICK_WORDS) : '';
      this.pop(x == null ? innerWidth / 2 + (Math.random() - 0.5) * 140 : x, y == null ? innerHeight - 150 : y, `+${short(n)} aura${T.m > 1 ? ' ×' + T.m : ''}${rain > 1 ? ' 🌧️' : ''}${word}`, this.tier ? 't' + this.tier : '');
      this.drawTop();
    },
    // a new tier: it's announced, said out loud (with the sound on) and everyone can see your aura change
    tierUp(k) {
      this.tier = k; const T = TIERS[k];
      const old = $('#auTier'); if (old) old.remove();
      const el = document.createElement('div'); el.id = 'auTier'; if (T.c === 'rainbow') el.className = 'rb';
      el.style.setProperty('--tc', T.c === 'rainbow' ? '#f0abfc' : T.c);
      el.innerHTML = `<div class="m">×${T.m} AURA</div><div class="n">${T.e} ${T.n} ${T.e}</div>`;
      $('#xhud').append(el); setTimeout(() => el.remove(), 1450);
      sfx(k >= 4 ? 'unlock' : 'powerup'); this.speak(T.say);
      if (me) puffAt(me.g.position.x, me.g.position.y + 3, me.g.position.z, [tierCol(k, performance.now() / 1000).getHex(), 0xffffff], 18 + k * 4);
      if (k >= 4) Net.chat(`${T.e} ${T.n} (${this.streak} click streak, ×${T.m} aura)`);
      if (k >= 3) this.daily('stk', 1);
      this.send(true);
    },
    endStreak(quiet) {
      const n = this.streak, S = this.S; this.streak = 0;
      if (n > (S.bs | 0)) { S.bs = n; this.dirty = true; if (n >= 25 && !quiet) toast(`🏆 New best streak: ${n} clicks`, '#fde68a'); }
      if (this.tier) { this.tier = 0; this.send(true); }
      if (n >= 10 && !quiet) { this.pop(innerWidth / 2, 168, `streak ended at ${n} · ${pick(FELL_OFF)}`, 'end'); sfx('lose', { vol: 0.3 }); }
    },
    // Unc Joe tells a joke (you get a little aura for surviving it, every 15 seconds at most)
    joke() {
      const j = pick(JOKES), u = this.unc; if (!u) return;
      if (this.uncBub) { u.g.remove(this.uncBub); this.uncBub.material.map.dispose(); this.uncBub.material.dispose(); }
      const words = j.split(' '), lines = []; let cur = '';
      for (const w of words) { if ((cur + ' ' + w).trim().length > 30) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }
      if (cur.trim()) lines.push(cur.trim());
      this.uncBub = label(lines.join('\n'), { size: 0.85, color: '#422006', bg: 'rgba(254,243,199,.95)' }); this.uncBub.position.y = 8.6 + lines.length * 0.35; u.g.add(this.uncBub);
      clearTimeout(this.bubT); this.bubT = setTimeout(() => { if (this.uncBub && this.unc) { this.unc.g.remove(this.uncBub); this.uncBub.material.map.dispose(); this.uncBub.material.dispose(); this.uncBub = null; } }, 6500);
      say(`🧓 Unc Joe: ${j}`, '#fde68a'); setTimeout(() => rimshot(), 900);
      const now = performance.now();
      if (now - this.uncAt > 15000) { this.uncAt = now; this.xp(5); this.daily('joke', 1); const v = Math.max(5, Math.round(5 * this.perSec())); setTimeout(() => { this.gain(v); toast(`😐 +${comma(v)} aura for surviving the cringe`, '#fde68a'); this.drawTop(); }, 1400); }
    },
    // the edit: black and white, letterbox bars, a skull, a word (and phonk, if `music`)
    editFx(secs, word, music) {
      const old = $('#auEdit'); if (old) old.remove();
      const el = document.createElement('div'); el.id = 'auEdit'; el.innerHTML = `<div class="sk">💀</div>${word ? `<div class="tf">${esc(word)}</div>` : ''}`;
      $('#xhud').append(el);
      try { canvas.style.filter = 'grayscale(1) contrast(1.45) brightness(1.06)'; } catch (e) {}
      this.editUntil = performance.now() + secs * 1000;
      if (music) { if (this.music) this.music.stop(); this.music = phonk(secs); }
    },
    editOff() {
      this.editUntil = 0;
      try { canvas.style.filter = ''; } catch (e) {}
      const el = $('#auEdit'); if (el) el.remove();
    },
    rainOn() { const g = this.g; return !!(g && g.rn > 0); },
    // the brainrot announcer (only with the sound on, and only for the big moments)
    speak(text) {
      try {
        if (!text || !window.Sfx || !Sfx.on || !window.speechSynthesis || document.hidden) return;
        const u = new SpeechSynthesisUtterance(text); u.rate = 1.05; u.pitch = 0.55; u.volume = 0.8;
        speechSynthesis.cancel(); speechSynthesis.speak(u);
      } catch (e) { /* no voice here: the text says it anyway */ }
    },
    drawStreak() {
      const el = this.stEl; if (!el) return;
      const on = this.streak >= 3 && !this.D, T = TIERS[this.tier], now = performance.now();
      const col = T.c === 'rainbow' ? `hsl(${Math.round(now / 6) % 360},90%,64%)` : T.c;
      el.hidden = !on;
      if (on) {
        const cls = 't' + this.tier; if (el.className !== cls) el.className = cls;
        el.style.setProperty('--tc', col);
        const next = TIERS[this.tier + 1];
        const html = `🔥 <b>${this.streak}</b> STREAK${T.m > 1 ? ` · ×${T.m} · ${T.e} ${T.n}` : ''}${next ? ` <small>(${next.at - this.streak} more for ×${next.m})</small>` : ' <small>(max brainrot)</small>'}`;
        if (html !== this.stHtml) { this.stHtml = html; el.firstChild.innerHTML = html; }
        el.lastChild.firstChild.style.width = (100 * clamp(1 - (now - this.lastClick) / (this.gap() * 1000), 0, 1)).toFixed(1) + '%';
      }
      this.vig.style.setProperty('--tc', col);
      const vo = on && this.tier >= 2 ? Math.min(0.95, 0.2 + 0.11 * this.tier + 0.08 * Math.sin(now / 140)) : 0;
      this.vig.style.opacity = vo.toFixed(2);
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
      const g = this.g, rain = g && g.rn > 0 ? `<span class="rn">🌧️🧠 BRAINROT RAIN · clicks ×2 · ${Math.ceil(g.rn)}s</span>` : '', x2 = this.x2Left();
      const boost = x2 > 0 ? `<span class="x2">⚡ 2× aura ${Math.floor(x2 / 60)}:${String(Math.floor(x2 % 60)).padStart(2, '0')}</span>` : '';
      const html = `<span class="n">🗿 ${comma(S.au)}</span><small>aura · +${short(this.perSec())}/s</small><span class="rk r${k}" style="--rc:${R[2]}">${R[1]}</span><small>⚔️ ${pctOf(m)} dmg</small>${rain}${boost}`;
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
        this.bpSec = (this.bpSec | 0) + 1; if (this.bpSec % 10 === 0) this.xp(1); this.daily('time', 1);
        if (this.top && !this.top.hidden) { const r = this.top.getBoundingClientRect(); this.pop(this.streak >= 3 ? r.right + 46 : r.left + r.width / 2, this.streak >= 3 ? r.top + r.height / 2 : r.bottom + 14, `+${short(n)} aura`, 'sec'); const nEl = this.top.querySelector('.n'); if (nEl) { nEl.classList.add('bump'); setTimeout(() => nEl.classList.remove('bump'), 140); } }
      }
      this.evT -= dt; if (this.evT <= 0) { this.evT = 45 + Math.random() * 40; if (!this.D) this.auraEvent(); }
      const g = this.g = roundState(this);
      if (this.streak && now - this.lastClick > this.gap() * 1000) this.endStreak();
      for (const f of this.anims || []) f(now / 1000);
      if (this.unc) { animateAvatar(this.unc, dt, false, false); placeShadow(this.unc); }
      if (this.editUntil && now > this.editUntil) this.editOff();
      this.duelTick(g, dt);
      this.drawWorld(g, dt);
      if (g && g.rn > 0) this.rainTick(dt);
      this.drawTop();
      this.drawStreak();
      this.drawBar();
      this.send();
      if (this.dirty && performance.now() - this.savedAt > 8000) this.save();
    },

    // brainrot falling out of the sky round you
    rainTick(dt) {
      this.rainAcc = (this.rainAcc || 0) + dt * 7;
      while (this.rainAcc >= 1) {
        this.rainAcc -= 1;
        const x = P.x + (Math.random() - 0.5) * 40, z = P.z + (Math.random() - 0.5) * 40, o = emoSprite(pick(RAIN_EMO), 1.6 + Math.random() * 1.4);
        o.position.set(x, 30, z); place.add(o);
        this.fx.push({ o, life: 2.2, max: 2.2, fall: [x, 30, z, x + (Math.random() - 0.5) * 4, 0.5, z], disposeMat: true });
      }
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
        return { gs: 0, left: 0, D, C: Array.isArray(g.C) ? g.C.map((c) => c.slice()) : [], ev: (g.ev || []).slice(), nd: Math.max(0, ...D.map((d) => d.id)), nb: g.nb | 0, rn: +g.rn || 0, rnT: g.rnT != null ? +g.rnT : null };
      }
      if (g) return { gs: 0, left: 0, D: [], C: [], ev: (g.ev || []).slice(), nd: 0, nb: g.nb | 0, rn: +g.rn || 0, rnT: g.rnT != null ? +g.rnT : null };
      return { gs: 0, left: 0, D: [], C: [], ev: [], nd: 0, nb: 0, rn: 0, rnT: null };
    },
    ev(e) { const H = this.H; this.evSeq = (this.evSeq || 0) + 1; H.ev.push([this.evSeq].concat(e)); if (H.ev.length > 48) H.ev.splice(0, H.ev.length - 48); },
    // an attack landed or missed, and the shape it hit with ('p' a box round a projectile, 'b' along a beam, 'c' a circle), for Show hitboxes
    hb(D, o, k, hit, shape, ...a) { this.ev(['hb', D.id, o, k, hit ? 1 : 0, shape, ...a.map((v) => +(+v).toFixed(1))]); },
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
      // now and then: brainrot rain (clicks count double for everyone for 15 seconds)
      H.rnT = (H.rnT == null ? 100 + Math.random() * 60 : H.rnT) - dt;
      if (H.rn > 0) H.rn = Math.max(0, H.rn - dt);
      else if (H.rnT <= 0) { H.rn = 15; H.rnT = 160 + Math.random() * 90; this.ev(['rain']); }
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
      if (isBot(id)) return { au: D.bot.au, lv: Object.fromEntries(D.bot.eq), th: 0, hu: 0, cdr: 0, tx: 0 };
      if (id === myPeer()) { const S = this.S; return { au: S.au, lv: Object.fromEntries(S.eq.map((k) => [k, S.ab[k]])), th: hasItem('hp') ? 1 : 0, hu: S.hu | 0, cdr: S.cdr | 0, tx: S.tx | 0 }; }
      const p = (this.pl || players()).find((q) => q.peer === id), pr = (p && p.pr) || {}, lv = {}, eq = Array.isArray(pr.eq) ? pr.eq : [];
      for (let j = 0; j + 1 < eq.length && j < 8; j += 2) if (AB[eq[j]]) lv[eq[j]] = clamp(eq[j + 1] | 0, 1, MAX_LV);
      const u = Array.isArray(pr.u) ? pr.u : [];
      return { au: Math.max(0, +pr.au || 0), lv, th: pr.th ? 1 : 0, hu: clamp(u[0] | 0, 0, 10), cdr: clamp(u[1] | 0, 0, 10), tx: clamp(u[2] | 0, 0, 10) };
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
        const pool = ABK.filter((k) => !AB[k].bp && !AB[k].pw && AB[k].r <= Math.min(5, best + (Math.random() < 0.3 ? 1 : 0))), eq = [];
        while (eq.length < 4 && pool.length) eq.push([pool.splice(Math.floor(Math.random() * pool.length), 1)[0], 1 + Math.floor(Math.random() * 3)]);
        D.f[1] = 'bot:' + H.nb;
        D.bot = { n: BOT_NAMES[H.nb % BOT_NAMES.length], s: Math.floor(Math.random() * 1e6), au: Math.round(me.au * (0.55 + Math.random() * 0.45)) + 30, eq, x: R.x, z: R.z - 8, yaw: Math.PI, mv: 0, think: 1.2, dir: 1, flip: 2, dashT: 0 };
      }
      for (const i of [0, 1]) { const f = this.info(D, i); D.hp[i] = D.mx[i] = HP + (f.th ? 25 : 0) + 8 * f.hu; }
      H.D.push(D);
      this.ev(['st', D.id, D.f[0], D.f[1]]);
    },
    cast(D, i, k) {
      const A = abOf(k); if (!A) return;
      const inf = this.info(D, i), lvl = k === 'slap' ? 1 : inf.lv[k]; if (!lvl) return; // (not one of theirs)
      const T = performance.now() / 1000, cd = D.cd[i];
      if (D.st[i] > 0 || (cd[k] || 0) > T + 0.15) return; // stunned, or still cooling down
      cd[k] = T + A.cd * cdK(inf.cdr);
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
      else if (A.k === 'dash') { D.pe.push({ t: 0.32, kind: 'dash', o: i, k, dmg }); this.ev(['ds', D.id, i, k]); if (isBot(D.f[i])) D.bot.dashT = 0.3; }
      else if (A.k === 'melee') { const hit = d < A.rng + 1; this.hb(D, i, k, hit, 'c', me.x, me.z, A.rng + 1 - HB_BODY); if (hit) this.hit(D, 1 - i, dmg, k, i); }
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
        if (tg && Math.hypot(tg.x - q.x, tg.z - q.z) < hitR) { D.pj.splice(j, 1); this.hb(D, q.o, q.k, 1, 'p', q.x, q.z, hitR - HB_BODY); this.hit(D, 1 - q.o, q.dmg, q.k, q.o); if (A.ex) this.ev(['x', D.id, +q.x.toFixed(1), +q.z.toFixed(1), A.ex]); if (D.ph !== 'fight') return; continue; }
        if (out) {
          D.pj.splice(j, 1);
          if (A.ex) { this.ev(['x', D.id, +q.x.toFixed(1), +q.z.toFixed(1), A.ex]); const hit = tg && Math.hypot(tg.x - q.x, tg.z - q.z) < A.ex; this.hb(D, q.o, q.k, hit, 'c', q.x, q.z, A.ex - HB_BODY); if (hit) { this.hit(D, 1 - q.o, q.dmg * 0.7, q.k, q.o); if (D.ph !== 'fight') return; } }
          else this.hb(D, q.o, q.k, 0, 'p', q.x, q.z, hitR - HB_BODY);
        }
      }
      // beams, waves, meteors and dashes landing
      for (let j = D.pe.length - 1; j >= 0; j--) {
        const e = D.pe[j]; e.t -= dt; if (e.t > 0) continue;
        D.pe.splice(j, 1);
        const A = AB[e.k], tg = this.posF(D, 1 - e.o), me = this.posF(D, e.o); if (!tg || !me) continue;
        if (e.kind === 'beam') {
          const px = tg.x - e.x0, pz = tg.z - e.z0, along = clamp(px * e.ux + pz * e.uz, 0, A.rng), dx = px - e.ux * along, dz = pz - e.uz * along;
          this.ev(['b1', D.id, e.o, e.k, +e.x0.toFixed(1), +e.z0.toFixed(1), +(e.x0 + e.ux * A.rng).toFixed(1), +(e.z0 + e.uz * A.rng).toFixed(1)]);
          const hit = Math.hypot(dx, dz) < 2.5; this.hb(D, e.o, e.k, hit, 'b', e.x0, e.z0, e.x0 + e.ux * A.rng, e.z0 + e.uz * A.rng, 2.5 - HB_BODY);
          if (hit) this.hit(D, 1 - e.o, e.dmg, e.k, e.o);
        } else if (e.kind === 'aoe') { this.ev(['ao', D.id, e.o, e.k, +me.x.toFixed(1), +me.z.toFixed(1), A.rad]); const hit = Math.hypot(tg.x - me.x, tg.z - me.z) < A.rad; this.hb(D, e.o, e.k, hit, 'c', me.x, me.z, A.rad - HB_BODY); if (hit) this.hit(D, 1 - e.o, e.dmg, e.k, e.o); }
        else if (e.kind === 'meteor') { this.ev(['m1', D.id, e.k, +e.x1.toFixed(1), +e.z1.toFixed(1), A.rad]); const hit = Math.hypot(tg.x - e.x1, tg.z - e.z1) < A.rad; this.hb(D, e.o, e.k, hit, 'c', e.x1, e.z1, A.rad - HB_BODY); if (hit) this.hit(D, 1 - e.o, e.dmg, e.k, e.o); }
        else if (e.kind === 'dash') { const hit = Math.hypot(tg.x - me.x, tg.z - me.z) < 4.4; this.hb(D, e.o, e.k, hit, 'c', me.x, me.z, 4.4 - HB_BODY); if (hit) this.hit(D, 1 - e.o, e.dmg, e.k, e.o); }
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
      const l = 1 - w, amt = w < 0 ? 0 : Math.floor(this.info(D, l).au * (STEAL + 0.01 * this.info(D, w).tx));
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
        this.endStreak(true); this.duelId = D.id; this.myIdx = D.f[0] === mine ? 0 : 1; this.cdUntil = {}; this.hpSeen = null; this.chal = null; this.drawChal();
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
        if (m.smoke) puffAt(P.x, P.y + 0.4, P.z, [0x9ca3af, 0xd1d5db, 0x4b5563], 3);
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
      this.cdUntil[k] = T + A.cd * cdK(this.S.cdr);
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
      if (type === 'rain') { toast('🌧️🧠 BRAINROT RAIN! Every click is worth double for 15 seconds', '#a5f3fc'); sfx('thunder', { vol: 0.6 }); this.speak('it is raining brainrot'); return; }
      if (type === 'full') { if (e[2] === mine || e[3] === mine) toast('All 4 rings are busy. Wait a sec (touch grass meanwhile)', '#fde68a'); return; }
      if (type === 'st') { if (e[3] !== mine && e[4] !== mine) say(`⚔️ ${isBot(e[4]) ? nameOf(e[3]) + ' is fighting a bot' : nameOf(e[3]) + ' vs ' + nameOf(e[4])}`, '#c4b5fd'); return; }
      const D = this.duelOf(g, e[2]);
      if (type === 'end') { this.onEnd(e); return; }
      if (!D) return;
      if (type === 'go') { if (D.id === this.duelId) { this.bigText('FIGHT!'); sfx('go'); } return; }
      if (type === 'hb') { if (this.S && this.S.hb) this.hbFlash(D, e); return; }
      const pos = (i) => this.fPos(D, i);
      if (type === 'c') {
        const A = abOf(e[4]), p = pos(e[3]); if (!A || !p) return;
        const line = A.says ? pick(A.says) : A.say; if (line) this.shout(p, line, RAR[A.r][1]);
        const mineD = D.id === this.duelId, isMe = mineD && e[3] === this.myIdx;
        if (e[4] === 'bass') this.riser(p);
        if (e[4] === 'cowbell' && (mineD || Math.hypot(p.x - P.x, p.z - P.z) < 60)) { const m = phonk(0.9, 150); if (m) setTimeout(() => m.stop(), 900); }
        if (e[4] === 'montagem' && isMe) this.editFx(7, 'MONTAGEM', true);
        if (e[4] === 'boss' && isMe) { this.bigText('👑 FINAL BOSS'); sfx('unlock'); }
        const snd = { proj: 'whoosh', beam: 'zap', aoe: 'powerup', meteor: 'whoosh', self: A.shield ? 'shield' : A.heal && !A.buff ? 'heal' : 'powerup', dash: 'whoosh', melee: 'swing' }[A.k];
        sfx3(snd, p.x, p.z, 90, { vol: 0.7 });
      } else if (type === 'b0') { this.line(e[5], e[6], e[7], e[8], 0xff4d6d, 0.12, e[9], 0.35); }
      else if (type === 'b1') { const A = AB[e[4]]; this.line(e[5], e[6], e[7], e[8], rarHex(A.r), A.r >= 4 ? 0.7 : 0.45, 0.25, 0.95); sfx3('laser', e[5], e[6], 90); }
      else if (type === 'ao') { this.wave(e[5], e[6], e[7], rarHex(AB[e[4]].r)); sfx3('boom', e[5], e[6], 90); if (e[4] === 'bass') { this.wave(e[5], e[6], e[7] * 0.6, 0xc026d3); puffAt(e[5], 1.5, e[6], [0x111111, 0xc026d3, 0xffffff], 22); sfx3('explode', e[5], e[6], 120); } }
      else if (type === 'm0') { this.meteor(e[4], e[5], e[6], e[3]); }
      else if (type === 'm1') { const bolt = e[3] === 'thunder'; this.wave(e[4], e[5], e[6], bolt ? 0x22d3ee : 0xf97316); puffAt(e[4], 2, e[5], bolt ? [0x67e8f9, 0xfde047, 0xffffff] : [0xf97316, 0xfde047, 0x444444], 24); sfx3(bolt ? 'thunder' : 'explode', e[4], e[5], 120); }
      else if (type === 'x') { this.wave(e[3], e[4], e[5], 0xc084fc); puffAt(e[3], 2.4, e[4], [0xc084fc, 0xf9a8d4], 16); sfx3('explode', e[3], e[4], 100, { vol: 0.7 }); }
      else if (type === 'sf') {
        const A = AB[e[4]], p = pos(e[3]); if (!p) return;
        puffAt(p.x, p.y + 3, p.z, A.heal && !A.buff ? [0x86efac, 0xffffff] : A.shield && !A.heal ? [0x93c5fd, 0xffffff] : [0xf97316, 0xfde047], 14);
        if (e[5] > 0) { const s = this.screen(p.x, p.y + 6, p.z); if (s) this.pop(s[0], s[1], `+${e[5]} ❤️`, 'heal'); }
      } else if (type === 'ds') {
        if (D.id === this.duelId && e[3] === this.myIdx) { const o = pos(1 - this.myIdx); if (o) { const dx = o.x - P.x, dz = o.z - P.z, l = Math.hypot(dx, dz) || 1, d = Math.min(14, l + 2.5); this.move = { t: 0.3, vx: dx / l * d / 0.3, vz: dz / l * d / 0.3, smoke: e[4] === 'drift' }; } }
        const cp = pos(e[3]); if (cp) puffAt(cp.x, cp.y + 0.6, cp.z, e[4] === 'drift' ? [0x6b7280, 0xd1d5db, 0x111827] : [0x9ca3af, 0xe5e7eb], e[4] === 'drift' ? 22 : 10);
      } else if (type === 'h') {
        const t = e[3], p = pos(t), A = abOf(e[5]) || (e[5] === 'storm' ? AB.skibidi : SLAP); if (!p) return;
        const s = this.screen(p.x, p.y + 6.2, p.z); if (s) this.pop(s[0] + (Math.random() - 0.5) * 40, s[1], `-${e[4]}`, 'dmg');
        puffAt(p.x, p.y + 2.8, p.z, [rarHex(A.r), 0xffffff], 8);
        sfx3(e[5] === 'slap' ? 'punch' : 'hit', p.x, p.z, 80, { vol: 0.8 });
        if (D.id === this.duelId && t === this.myIdx && e[5] === 'edit') this.editFx(2, 'EDITED', true);
        if (D.id === this.duelId && e[7] === this.myIdx && t !== this.myIdx && e[5] !== 'slap' && e[5] !== 'storm') { this.xp(2); this.daily('hit', 1); }
        if (D.id === this.duelId && t === this.myIdx && e[6] > 0) { const o = pos(e[7]); if (o) { const dx = P.x - o.x, dz = P.z - o.z, l = Math.hypot(dx, dz) || 1; this.move = { t: 0.25, vx: dx / l * e[6], vz: dz / l * e[6] }; } }
      }
    },
    onEnd(e) {
      const [, , id, w, a, b, amt, na, nb, why] = e, mine = myPeer(), idx = a === mine ? 0 : b === mine ? 1 : -1, S = this.S;
      const W = w >= 0 ? [na, nb][w] : '', L = w >= 0 ? [na, nb][1 - w] : '';
      if (idx < 0) { if (w >= 0) say(`⚔️ ${pick(WIN_LINES).replace('{W}', W).replace('{L}', L)} (${W} stole ${comma(amt)} aura${why === 'left' ? ', they rage quit' : ''})`, '#c4b5fd'); return; }
      if (this.endSeen === id) return; this.endSeen = id;
      this.daily('duel', 1); if (w === idx) this.daily('win', 1);
      this.xp(w < 0 ? 30 : w === idx ? 60 : 25);
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
    // Show hitboxes: where an attack hit (green) or missed (red), and the same flash on whoever it was aimed at
    hbFlash(D, e) {
      const [, , , o, k, hit, shape, ...a] = e, c = hit ? HB_GREEN : HB_RED;
      let g;
      if (shape === 'b') { const [x0, z0, x1, z1, w] = a, dx = x1 - x0, dz = z1 - z0; g = hbShape('box', c, 1); g.scale.set(w * 2, 4, Math.hypot(dx, dz) || 1); g.position.set((x0 + x1) / 2, 2.8, (z0 + z1) / 2); g.rotation.y = Math.atan2(dx, dz); }
      else if (shape === 'c') { const [x, z, r] = a; g = hbShape('cyl', c, 1); g.scale.set(Math.max(0.3, r), 5.6, Math.max(0.3, r)); g.position.set(x, 0.15, z); }
      else { const [x, z, r] = a; g = hbShape('box', c, 1); g.scale.setScalar(Math.max(0.3, r) * 2); g.position.set(x, 2.8, z); }
      place.add(g); this.fx.push({ o: g, life: 0.7, max: 0.7, hb: true });
      const f = this.fv.get(D.id + ':' + (1 - o)); if (f) { hbColor(f.hb, c); f.hbT = 0.45; }
      if (D.id === this.duelId) { // HIT / MISS over it, in your own duel
        const l = label(hit ? 'HIT' : 'MISS', { size: 0.8, color: hit ? '#86efac' : '#fca5a5', bg: 'rgba(15,23,42,.7)' });
        const [x, z] = shape === 'b' ? [a[2], a[3]] : [a[0], a[1]]; l.position.set(x, 6.2, z); place.add(l);
        this.fx.push({ o: l, life: 0.7, max: 0.7, up: 2, dispose: true });
      }
    },
    toggleHb() {
      const S = this.S; if (!S) return;
      S.hb = !S.hb; this.save(); sfx('toggle');
      toast(S.hb ? '🟩 Hitboxes on: green = hit, red = miss' : 'Hitboxes off', S.hb ? '#86efac' : '#cbd5e1');
    },
    meteor(x, z, w, k) {
      const A = AB[k] || AB.meteor, bolt = k === 'thunder';
      const warn = new THREE.Mesh(new THREE.CircleGeometry(A.rad, 40), new THREE.MeshBasicMaterial({ color: bolt ? 0x22d3ee : 0xef4444, transparent: true, opacity: 0.3, depthWrite: false, ...DECAL }));
      warn.rotation.x = -Math.PI / 2; warn.position.set(x, 0.25, z); warn.userData.ownGeo = true; place.add(warn);
      this.fx.push({ o: warn, life: w, max: w, pulse: true, dispose: true });
      const rock = new THREE.Group(); rock.position.set(x + 14, 40, z - 8); place.add(rock);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: emoTex(bolt ? '⚡' : '☄️'), transparent: true })); s.scale.setScalar(5); rock.add(s);
      fxCard('glow', bolt ? 0x67e8f9 : 0xf97316, 8, 8, 0, 0, 0, rock);
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
        if (this.S.hb && !v.hb) { const r = (A.big ? 2.4 : 1.8) - HB_BODY; v.hb = hbShape('box', HB_IDLE, 0.9); v.hb.scale.setScalar(r * 2); v.g.add(v.hb); }
        if (v.hb) v.hb.visible = this.S.hb;
        if (v.sx !== q[2] || v.sz !== q[3]) { v.sx = q[2]; v.sz = q[3]; v.x = q[2]; v.z = q[3]; } else { v.x += q[4] * dt; v.z += q[5] * dt; }
        v.g.position.set(v.x, 2.8 + Math.sin(performance.now() / 120 + q[0]) * 0.15, v.z);
        v.tr = (v.tr || 0) + dt; if (v.tr > 0.06) { v.tr = 0; puffAt(v.x, 2.8, v.z, [rarHex(A.r), 0xffffff], 1); }
        if (A.home) v.g.rotation.y += dt * 9;
      }
      for (const [key, v] of this.pjv) if (!want.has(key)) { place.remove(v.g); if (v.hb) { v.g.remove(v.hb); hbDrop(v.hb); } v.g.traverse((o) => { if (o.material) { if (o.userData.ownMap && o.material.map) o.material.map.dispose(); o.material.dispose(); } }); this.pjv.delete(key); }
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
          f.hb = hbShape('box', HB_IDLE, 0.85); f.hb.scale.set(HB_BODY * 2, 5.6, HB_BODY * 2); f.hb.position.y = 2.8; f.g.add(f.hb); f.hbT = 0;
          this.fv.set(key, f);
        }
        f.g.position.set(p.x, p.y, p.z);
        const live = D.ph !== 'end';
        f.shield.visible = live && (D.sh || [])[i] > 0; f.stun.visible = live && (D.st || [])[i] > 0; f.slow.visible = live && (D.sl || [])[i] > 0; f.buff.visible = live && (D.bf || [])[i] > 1;
        if (f.stun.visible) f.stun.material.rotation += dt * 4;
        // Show hitboxes: white, flashing green when something hits them and red when it misses
        f.hb.visible = !!this.S.hb && live;
        if (f.hbT > 0) { f.hbT -= dt; if (f.hbT <= 0) hbColor(f.hb, HB_IDLE); }
      }
      for (const [key, f] of this.fv) if (!wantF.has(key)) { place.remove(f.g); f.shield.geometry.dispose(); hbDrop(f.hb); this.fv.delete(key); }
      // everyone's aura, as a glow round them (bigger and brighter the more they have) and their title
      this.auraGlow(me, this.S.au, myPeer());
      for (const [peer, a] of Net.avatars) { const p = Net.peers.find((x) => x.peer === peer); this.auraGlow(a, p && p.presence ? +p.presence.au || 0 : 0, peer); }
      // the click aura: yours flares on every click and grows with your streak; everyone else's shows their streak's tier
      const T = performance.now() / 1000;
      this.clickAura(me, this.D ? 0 : this.tier, this.D ? 0 : clamp(1 - (performance.now() - this.pulseAt) / 380, 0, 1), T);
      for (const [peer, a] of Net.avatars) { const p = Net.peers.find((x) => x.peer === peer); this.clickAura(a, clamp((p && p.presence && p.presence.sk) | 0, 0, TIERS.length - 1), 0, T); }
      for (const a of this.botAv.values()) this.auraGlow(a, a.g.userData.auAura || 0, null);
      // effects
      for (let i = this.fx.length - 1; i >= 0; i--) {
        const f = this.fx[i]; f.life -= dt; const k = 1 - Math.max(0, f.life) / f.max;
        if (f.up) f.o.position.y += f.up * dt;
        if (f.grow) f.o.scale.setScalar(0.5 + k * f.grow);
        if (f.fade != null && f.o.material) f.o.material.opacity = f.fade * (1 - k);
        if (f.hb) { const u = f.o.userData.hb, a = k < 0.6 ? 1 : (1 - k) / 0.4; u.lm.opacity = u.op * a; u.fm.opacity = u.op * 0.16 * a; }
        if (f.pulse) f.o.material.opacity = 0.2 + 0.25 * (0.5 + 0.5 * Math.sin(k * 30));
        if (f.fall) { const [x0, y0, z0, x1, y1, z1] = f.fall; f.o.position.set(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k * k, z0 + (z1 - z0) * k); }
        if (f.life <= 0) { place.remove(f.o); if (f.hb) hbDrop(f.o); if (f.dispose) { if (f.o.geometry && f.o.userData.ownGeo) f.o.geometry.dispose(); if (f.o.material) { if (f.o.isSprite && f.o.material.map) f.o.material.map.dispose(); f.o.material.dispose(); } } else if (f.disposeMat && f.o.material) f.o.material.dispose(); this.fx.splice(i, 1); }
      }
    },
    // the bass drop's build-up: a rising tone where it's cast
    riser(p) {
      const A = window.Sfx && Sfx.on && Sfx.audio && Sfx.audio(); if (!A) return;
      const d = Math.hypot(p.x - P.x, p.z - P.z); if (d > 90) return;
      const { ac, out } = A, t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(80, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.55);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12 * (1 - d / 90), t + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      o.connect(g).connect(out); o.start(t); o.stop(t + 0.62);
    },
    clickAura(a, tier, pulse, t) {
      if (!a || !a.g) return;
      const u = a.g.userData;
      if (!u.ca) { if (!tier && !pulse) return; u.ca = makeClickAura(a.g); }
      tickClickAura(u.ca, tier, pulse, t);
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
      const D = this.D, fight = D && D.ph !== 'end', nFree = S.free + Object.values(S.keys).reduce((a, b) => a + b, 0), bpCan = fight ? 0 : this.bpClaimable();
      const html = fight
        ? ['slap'].concat(S.eq).map((k, i) => { const A = abOf(k); return `<button class="xslot au-ab r${A.r}" data-cast="${i - 1}" style="--rc:${RAR[A.r][1]}" title="${esc(A.n)}: ${esc(A.d)}"><span class="k">${i ? i : 'F'}</span><span class="e">${A.e}</span>${esc(A.n)}<i class="au-cd" style="height:0"></i><span class="au-cdn"></span></button>`; }).join('')
        : `<button class="xslot au-farm" data-farm="1" title="Farm aura (F, or click anywhere)"><span class="k">F</span><span class="e">🗿</span>FARM AURA<span class="n">+${short(this.perClick())}</span></button><button class="xslot" data-duel="1"><span class="e">⚔️</span>Duel</button><button class="xslot" data-crates="1"><span class="e">🎁</span>Crates${nFree ? `<span class="n">${nFree} free</span>` : ''}</button><button class="xslot" data-abs="1"><span class="e">🎒</span>Abilities</button><button class="xslot au-bpb" data-bp="1"><span class="e">💯</span>Pass<span class="n">${bpCan ? bpCan + ' 🎁' : 'Lv ' + bpLevel(S.bx)[0]}</span></button>`;
      if (html !== this.barHtml) {
        this.barHtml = html;
        setBar(html, (b) => {
          if (b.dataset.farm) { const r = b.getBoundingClientRect(); this.farm(r.left + r.width / 2 + (Math.random() - 0.5) * 60, r.top - 20); }
          else if (b.dataset.cast != null) this.useSlot(+b.dataset.cast);
          else if (b.dataset.duel) this.duelPanel(); else if (b.dataset.crates) this.cratePanel(); else if (b.dataset.abs) this.abilityPanel(); else if (b.dataset.bp) this.bpPanel('pass');
        });
      }
      if (fight) { // cooldowns: just the shading, so the buttons themselves never get swapped under your finger
        const T = performance.now() / 1000;
        document.querySelectorAll('#xbar [data-cast]').forEach((b) => {
          const i = +b.dataset.cast, k = i < 0 ? 'slap' : S.eq[i], A = abOf(k); if (!A) return;
          const left = Math.max(0, (this.cdUntil[k] || 0) - T), cdEl = b.querySelector('.au-cd'), n = b.querySelector('.au-cdn');
          cdEl.style.height = (left > 0 ? Math.min(100, left / (A.cd * cdK(S.cdr)) * 100) : 0).toFixed(0) + '%';
          const txt = left > 0.05 ? (left < 1 ? left.toFixed(1) : String(Math.ceil(left))) : '';
          if (n.textContent !== txt) n.textContent = txt;
        });
      }
    },
    key(code, down) {
      if (!down) return false;
      if (code === 'KeyH') { this.toggleHb(); return true; }
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
      if (D && D.ph !== 'end') return touchy ? 'Tap your abilities (they aim themselves) · move to dodge!' : '1–4 abilities (they aim themselves) · F or click to slap · move to dodge! · H: hitboxes';
      if (this.streak >= 3) { const next = TIERS[this.tier + 1]; return next ? `Keep clicking! ${next.at - this.streak} more for ${next.e} ${next.n} (×${next.m} aura)` : 'MAX BRAINROT. Keep clicking, the server is watching 🗿'; }
      return touchy ? 'Tap fast to farm aura 🗿 · 25 in a row = ×2 · walk up to someone to challenge them' : 'Click fast (or F) to farm aura 🗿 · 25 in a row = ×2 aura · walk up to someone and press E to challenge them';
    },
    prompts() {
      if (this.D || !this.S) return [];
      const out = [];
      for (const c of this.crates || []) out.push({ x: c.x, z: c.z, r: 6, text: `Open ${c.C.n} (🗿 ${comma(c.C.price)})`, fn: () => this.cratePanel(c.C.id) });
      for (const M of STATIONS) out.push({ x: M.x, z: M.z, r: 6, text: M.k === 'up' ? `${M.e} ${M.n}` : '🎒 Your abilities', fn: () => (M.k === 'up' ? this.upgradePanel() : this.abilityPanel()) });
      out.push({ x: 0, z: -44, r: 7, text: '🤖 Duel a bot', fn: () => this.duelBot() });
      out.push({ x: -12, z: 12, r: 6, text: '🌽 Hear a corny joke from Unc Joe', fn: () => this.joke() });
      out.push({ x: 12, z: 12, r: 6, text: `💯 Battle Pass (level ${bpLevel(this.S.bx)[0]}) & 🛒 Pass Shop`, fn: () => this.bpPanel('pass') });
      const g = this.g, busy = new Set(g && Array.isArray(g.D) ? g.D.flatMap((d) => d.f) : []);
      for (const p of players()) if (!p.me && !busy.has(p.peer)) out.push({ x: p.x, z: p.z, r: 6, text: `⚔️ Challenge ${nameOf(p.peer)}`, fn: () => this.challenge(p.peer) });
      return out;
    },
    menu() {
      return [['⚔️ Duel', () => this.duelPanel(), 'Duel'], ['🎁 Crates', () => this.cratePanel(), 'Crates'], ['🎒 Abilities', () => this.abilityPanel(), 'Abilities'], ['⬆️ Upgrades', () => this.upgradePanel(), 'Upgrade'], ['💯 Battle Pass', () => this.bpPanel('pass'), 'Pass'], [this.S && this.S.hb ? '🟩 Hitboxes: on' : '🟥 Hitboxes: off', () => this.toggleHb(), 'Hitbox']];
    },
    statOf(pr) { return pr && pr.au != null ? `🗿 ${short(pr.au)}` : '—'; },
    sortKey(pr) { return (pr && +pr.au) || 0; },

    /* ---------------- panels ---------------- */
    abCard(k, lvl, opts = {}) {
      const A = AB[k], au = this.S.au;
      const stat = A.k === 'self' ? [A.heal ? `❤️ +${Math.round(A.heal * lvK(lvl))}` : '', A.shield ? `🍩 ${Math.round(A.shield[0] * lvK(lvl))}` : '', A.buff ? `🔥 ×${A.buff[0]}` : ''].filter(Boolean).join(' ') : `⚔️ ${Math.round(A.dmg * lvK(lvl) * auraMult(au)) * (A.cnt || 1)}${A.dot ? ' + 🌪️' + Math.round(A.dot[0] * A.dot[1] * lvK(lvl) * auraMult(au)) : ''}`;
      return `<div class="xp-card au-card r${A.r} ${A.phonk ? 'ph' : ''} ${A.bp ? 'bpx' : ''} ${A.pw ? 'pwx' : ''} ${opts.eq ? 'eq' : ''} ${opts.locked ? 'locked' : ''}" style="--rc:${RAR[A.r][1]}">${lvl ? `<span class="lv">Lv ${lvl}</span>` : ''}<div class="big">${opts.locked ? '❔' : A.e}</div><b>${opts.locked ? '???' : esc(A.n)}</b><span class="rt">${RAR[A.r][0]}</span>${opts.locked ? '' : `<span class="st">${stat} · ⏱️ ${+(A.cd * cdK(this.S.cdr)).toFixed(1)}s</span><span style="font-weight:600;color:#94a3b8">${esc(A.d)}</span>`}${opts.btn || ''}</div>`;
    },
    abilityPanel() {
      const S = this.S, own = ABK.filter((k) => S.ab[k]).sort((a, b) => AB[b].r - AB[a].r);
      const slots = [0, 1, 2, 3].map((i) => { const k = S.eq[i], A = k && AB[k]; return `<div class="${A ? 'on' : ''}" style="--rc:${A ? RAR[A.r][1] : 'rgba(255,255,255,.18)'}">${A ? `<span class="e">${A.e}</span>${esc(A.n)}<br><small>Lv ${S.ab[k]}</small>` : `<span class="e">➕</span>Slot ${i + 1}`}</div>`; }).join('');
      const html = `<p class="xp-note">🎒 Equip up to 4 abilities (keys 1–4 in a duel). They aim themselves; your aura (🗿 ${comma(S.au)}) makes them hit ${pctOf(auraMult(S.au))} harder. A double from a crate levels one up (+${Math.round(LV_UP * 100)}% each, up to Lv ${MAX_LV}).</p>
        <div class="au-slots">${slots}</div>
        <div class="xp-grid">${own.map((k) => { const on = S.eq.includes(k); return this.abCard(k, S.ab[k], { eq: on, btn: `<button class="xp-btn ${on ? 'alt' : ''}" data-eq="${k}">${on ? 'Unequip' : S.eq.length >= 4 ? 'Swap in' : 'Equip'}</button>` }); }).join('')}</div>
        <h4>📖 Every ability <small style="color:var(--muted);font:700 12px var(--fb)">— ${own.length}/${ABK.length} unlocked</small></h4>
        <div class="xp-grid">${ABK.filter((k) => !S.ab[k]).map((k) => this.abCard(k, 0, { locked: AB[k].r >= 3 && !AB[k].bp && !AB[k].pw, btn: AB[k].bp ? `<span class="au-bptag">💯 ${AB[k].prem ? 'Bussin+ ' : ''}Battle Pass level ${AB[k].bp}</span>` : AB[k].pw ? '<span class="au-pwtag">⚡ Power Crates and the 💯 Pass Shop</span>' : '' })).join('') || '<p class="xp-note">You have every ability. Ohio has nothing left to teach you.</p>'}</div>`;
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
      const odds = (o0) => { const o = luckOdds(o0, S.lk), t = o.reduce((a, b) => a + b, 0) || 1; return `<div class="au-odds">${o.map((p, r) => { const q = p / t * 100; return `<div class="${p ? '' : 'zero'}" style="--rc:${RAR[r][1]}">${RAR[r][0]}<br><b>${q >= 10 || !q ? Math.round(q) : q.toFixed(1)}%</b></div>`; }).join('')}</div>`; };
      const html = `<p class="xp-note">🎁 Crates cost aura, so opening one makes your hits weaker until you farm it back. Gamble responsibly (you won’t). A double levels an ability up.${S.lk ? ` 🍀 Rizz Luck Lv ${S.lk} makes every crate rarer (the odds below include it).` : ''} 🔑 Keys from the 💯 Battle Pass open a crate for free. ⚡ Limited Power Crates are in the 💯 Pass Shop, for Pass Coins.</p>
        ${S.free ? `<div class="xp-row" style="display:block"><b>🏆 W Crate ×${S.free}</b> <small style="color:var(--muted)">— free, from winning duels. Rolls like a Rizz Crate.</small>${odds(FREE_ODDS)}<button class="xp-btn gold" data-free="1" style="width:100%">Open a W Crate (free)</button></div>` : ''}
        ${CRATES.map((C) => `<div class="xp-row" style="display:block;${focus === C.id ? 'border-color:#fde047;' : ''}${C.phonk ? 'background:linear-gradient(180deg,#1c0b22,#0b0b10);border-color:#a21caf' : ''}"><b>${C.e} ${C.n}</b> <small style="color:var(--muted)">— ${esc(C.d)}</small>${odds(C.odds)}${S.keys[C.id] ? `<button class="xp-btn gold" data-key="${C.id}" style="width:100%;margin-bottom:6px">🔑 Open free with a key (×${S.keys[C.id]})</button>` : ''}<button class="xp-btn" data-crate="${C.id}" style="width:100%" ${S.au < C.price ? 'disabled' : ''}>${S.au < C.price ? `Need 🗿 ${comma(C.price - S.au)} more` : `Open for 🗿 ${comma(C.price)}`}</button></div>`).join('')}`;
      openPanel('🎁 Ability Crates', html, (b) => {
        if (b.dataset.free) { if (S.free < 1) return; S.free--; this.openCrate(FREE_ODDS, '🏆 W Crate'); }
        else if (b.dataset.key) { const C = CRATES.find((c) => c.id === b.dataset.key); if (!C || !(S.keys[C.id] > 0)) return; S.keys[C.id]--; if (!S.keys[C.id]) delete S.keys[C.id]; this.openCrate(C.odds, `🔑 ${C.e} ${C.n}`, C.price, C.phonk); }
        else if (b.dataset.crate) { const C = CRATES.find((c) => c.id === b.dataset.crate); if (!C || S.au < C.price) { sfx('error'); return; } S.au -= C.price; this.openCrate(C.odds, `${C.e} ${C.n}`, C.price, C.phonk); }
      });
    },
    // the reveal: a strip of abilities flies past and stops on what you got
    openCrate(odds, title, price, ph) {
      const S = this.S; odds = luckOdds(odds, S.lk);
      const got = rollAb(odds, ph), A = AB[got], was = S.ab[got] | 0;
      let note;
      if (!was) { S.ab[got] = 1; note = 'NEW ABILITY 🔥'; if (S.eq.length < 4) S.eq.push(got); }
      else if (was < MAX_LV) { S.ab[got] = was + 1; note = `Double! Lv ${was} → Lv ${was + 1}`; }
      else { const back = Math.round((price || 400) * 0.3); S.au += back; note = `Already max level: +${comma(back)} aura back`; }
      S.op = (S.op | 0) + 1; if (A.r === 5) questMax('aura.ohio', 1);
      this.xp(20); this.daily('crate', 1);
      this.dirty = true; this.save(); this.send(true); closePanel();
      const cards = []; for (let i = 0; i < 46; i++) cards.push(i === 40 ? got : rollAb(odds, ph));
      const el = document.createElement('div'); el.id = 'auBox'; if (ph === true) { el.className = 'phonk'; if (this.music) this.music.stop(); this.music = phonk(6.2); } else if (ph === 'pw') el.className = 'power';
      el.innerHTML = `<div class="in"><h3>${esc(title)}</h3><div class="win"><div class="mark"></div><div class="strip">${cards.map((k) => `<div class="card r${AB[k].r}" style="--rc:${RAR[AB[k].r][1]}"><span class="e">${AB[k].e}</span><b>${esc(AB[k].n)}</b><small>${RAR[AB[k].r][0]}</small></div>`).join('')}</div></div><div class="tap">Opening… (click to skip)</div></div>`;
      $('#xhud').append(el);
      const strip = el.querySelector('.strip'), win = el.querySelector('.win'), cw = strip.children[0].getBoundingClientRect().width + 8;
      const end = -(40 * cw + cw / 2 - win.clientWidth / 2) + (Math.random() - 0.5) * cw * 0.6;
      strip.style.transform = 'translateX(0)'; void strip.offsetWidth;
      strip.style.transition = 'transform 3.4s cubic-bezier(.12,.75,.12,1)'; strip.style.transform = `translateX(${end}px)`;
      const ticks = setInterval(() => sfx('tick', { vol: ph === true ? 0.2 : 0.35 }), 140); setTimeout(() => clearInterval(ticks), 2600);
      let shown = false;
      const show = () => {
        if (shown) return; shown = true; clearInterval(ticks);
        el.innerHTML = `<div class="in"><div class="got r${A.r}" style="--rc:${RAR[A.r][1]}"><div class="e">${A.e}</div><b>${esc(A.n)}</b><span>${RAR[A.r][0]} tier</span><p>${esc(A.d)}</p><div class="lv">${esc(note)}</div></div><div class="tap">${A.r >= 4 ? 'HOLY AURA 🗿🗿🗿 · ' : A.r === 0 ? 'mid. · ' : ''}click to close</div></div>`;
        sfx(A.r >= 4 ? 'unlock' : A.r >= 2 ? 'reward' : 'coin');
        if (ph === true) this.editFx(2.4, 'TUFF');
        if (A.r >= 3) { Net.chat(`🎁 unboxed ${A.n} (${RAR[A.r][0]} tier) ${A.e}`); puffAt(P.x, P.y + 4, P.z, [rarHex(A.r), 0xffffff], 30); }
        this.drawBar();
      };
      setTimeout(show, 3500);
      el.onclick = () => { if (!shown) { show(); return; } el.remove(); if (ph === true && this.music && !this.editUntil) { this.music.stop(); this.music = null; } };
    },
    upgradePanel() {
      const S = this.S, x = this.mult(), body = $('#xpBody'), keep = $('#xpTitle').textContent === '⬆️ Upgrades' ? body.scrollTop : 0;
      const row = (u) => {
        const l = S[u.k] | 0, maxed = u.max && l >= u.max, cost = maxed ? 0 : u.cost(l), poor = S.au < cost;
        return `<div class="xp-row" style="display:block"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>${u.e} ${u.n} <small style="color:var(--muted)">Lv ${l}${u.max ? ' / ' + u.max : ''}</small></b><span style="text-align:right">${esc(u.what)}: <b>${u.v(l, x)}</b>${maxed ? '' : ` → <b style="color:#86efac">${u.v(l + 1, x)}</b>`}</span></div>${u.d ? `<small style="color:var(--muted)">${esc(u.d)}</small>` : ''}<div style="display:flex;gap:6px;margin-top:6px">${maxed ? '<button class="xp-btn alt" style="flex:1" disabled>MAXED 💯</button>' : `<button class="xp-btn" data-up="${u.k}" style="flex:1" ${poor ? 'disabled' : ''}>${poor ? `Need 🗿 ${comma(cost - S.au)} more` : `Upgrade for 🗿 ${comma(cost)}`}</button><button class="xp-btn alt" data-max="${u.k}" ${poor ? 'disabled' : ''}>Max</button>`}</div></div>`;
      };
      const html = `<p class="xp-note">⬆️ Every upgrade costs aura, which (for a while) makes your hits weaker. That’s the grindset.</p>
        ${UP_GROUPS.map((g, i) => `<h4>${g}</h4>${UPS.filter((u) => u.g === i).map(row).join('')}`).join('')}
        <p class="xp-note">🔥 Click streaks: ${TIERS.slice(1).map((T) => `${T.at} clicks ${T.e} ×${T.m}`).join(' · ')}. Click again within ${this.gap().toFixed(2)}s or it ends. Your best: ${S.bs | 0} clicks.</p>
        <p class="xp-note">🏆 ${S.w} W · ${S.l} L · best aura ever: 🗿 ${comma(S.best)} · crates opened: ${S.op | 0}</p>`;
      openPanel('⬆️ Upgrades', html, (b) => {
        const k = b.dataset.up || b.dataset.max, u = UPS.find((q) => q.k === k); if (!u) return;
        let n = 0; do { if (u.max && (S[k] | 0) >= u.max) break; const c = u.cost(S[k] | 0); if (S.au < c) break; S.au -= c; S[k] = (S[k] | 0) + 1; n++; } while (b.dataset.max && n < 200);
        if (!n) { sfx('error'); return; }
        sfx('levelup'); toast(`${u.e} ${u.t.replace('{n}', n)}`, '#c4b5fd');
        this.xp(5 * Math.min(n, 10)); this.daily('up', n);
        this.dirty = true; this.save(); this.send(true); this.upgradePanel(); this.drawBar();
      });
      $('#xpBody').scrollTop = keep;
    },

    /* ---------------- the Bussin Battle Pass ---------------- */
    // XP: past level 50, every 500 more is a free W Crate
    xp(n) {
      const S = this.S; if (!S || !(n > 0)) return;
      const l0 = bpLevel(S.bx)[0], inf0 = this.pcInf();
      S.bx += n; this.dirty = true;
      const l1 = bpLevel(S.bx)[0];
      if (l1 > l0) { this.bpUp(l1); this.payLevels(); }
      if (this.pcInf() > inf0) toast(`♾️ +${this.pcK(PC_INF)} Pass Coins ready to claim in 💯 Pass`, '#a5b4fc');
    },
    pcK(n) { return Math.round(n * (hasItem('bp') ? 1.5 : 1)); }, // Bussin+: half as much again
    // Pass Coins for every level you've reached (they come in by themselves)
    payLevels() {
      const S = this.S, L = bpLevel(S.bx)[0]; if (L <= S.pcl) return;
      const n = this.pcK(PC_LV * (L - S.pcl)); S.pcl = L; S.pc += n; this.dirty = true;
      setTimeout(() => toast(`🎟️ +${comma(n)} Pass Coins`, '#fde047'), 900);
    },
    // past level 50: Pass Coins waiting to be claimed (every 100 XP), no end to them
    pcInf() { const S = this.S; return Math.max(0, Math.floor(Math.max(0, S.bx - BP_TOTAL) / PC_INF_XP) - S.pco); },
    claimInf() {
      const S = this.S, k = this.pcInf(); if (!k) return 0;
      const n = this.pcK(PC_INF * k); S.pco += k; S.pc += n; this.dirty = true; this.save(); this.drawBar();
      return n;
    },
    bpUp(l) {
      const old = $('#auBP'); if (old) old.remove();
      const el = document.createElement('div'); el.id = 'auBP';
      const R = bpFree(l), P2 = hasItem('bp') ? bpPrem(l) : null;
      el.innerHTML = `<div class="m">💯 BUSSIN BATTLE PASS</div><div class="n">LEVEL ${l}</div><div class="s">${this.bpLabel(R).join(' ')}${P2 ? ' · 👑 ' + this.bpLabel(P2).join(' ') : ''} · 🎟️ +${this.pcK(PC_LV)} · claim it in 💯 Pass${l === BP_MAX ? ' · ♾️ INFINITE PASS COINS UNLOCKED' : ''}</div>`;
      $('#xhud').append(el); setTimeout(() => el.remove(), 2300);
      sfx('levelup'); if (l % 10 === 0) { Net.chat(`💯 reached Bussin Battle Pass level ${l}`); this.speak('battle pass level ' + l); }
    },
    dailies() { const d = today(); if (!this.dqc || this.dqc[0] !== d) this.dqc = [d, dailyOf(d)]; return this.dqc[1]; },
    daily(id, n) {
      const S = this.S; if (!S) return;
      const day = today(), T = this.dailies().find((q) => q.id === id); if (!T) return;
      if (!S.dq || S.dq.d !== day) S.dq = { d: day, p: {}, done: {} };
      if (S.dq.done[id]) return;
      S.dq.p[id] = Math.min(T.goal, (S.dq.p[id] || 0) + n); this.dirty = true;
      if (S.dq.p[id] >= T.goal) { S.dq.done[id] = 1; const c = this.pcK(PC_DAILY); S.pc += c; toast(`✅ Daily challenge done: ${T.n} · +${T.xp} XP · +${c} 🎟️`, '#86efac'); sfx('reward'); this.xp(T.xp); }
    },
    bpLabel(R) {
      if (R.t === 'au') return ['🗿', `+${short(Math.max(50, R.s * this.perSec()))} aura`];
      if (R.t === 'key') { const C = CRATES.find((c) => c.id === R.c); return ['🔑', `${C.e} ${C.n.replace(' Crate', '')} key`]; }
      if (R.t === 'bc') return ['🪙', `${R.n} Blox Coins`];
      if (R.t === 'x2') return ['⚡', `2× aura · ${R.m >= 60 ? R.m / 60 + 'h' : R.m + ' min'}`];
      if (R.t === 'ab') return [AB[R.k].e, AB[R.k].n];
      return ['⬆️', '+1 level: your 4 abilities'];
    },
    bpCan(tr, l, L = bpLevel(this.S.bx)[0]) { return l <= L && !this.S.bpc[tr + l] && (tr === 'f' || hasItem('bp')); },
    bpClaimable() { const L = bpLevel(this.S.bx)[0]; let n = this.pcInf() ? 1 : 0; for (let l = 1; l <= L; l++) { if (this.bpCan('f', l, L)) n++; if (this.bpCan('p', l, L)) n++; } return n; },
    bpClaim(tr, l, quiet) {
      const S = this.S; if (!this.bpCan(tr, l)) return false;
      S.bpc[tr + l] = 1;
      const R = (tr === 'f' ? bpFree : bpPrem)(l), [e, t] = this.bpLabel(R);
      if (R.t === 'au') this.gain(Math.max(50, Math.round(R.s * this.perSec())));
      else if (R.t === 'key') S.keys[R.c] = (S.keys[R.c] | 0) + 1;
      else if (R.t === 'bc') earn(R.n, 'Bussin Battle Pass');
      else if (R.t === 'x2') S.x2u = Math.max(Date.now(), S.x2u || 0) + R.m * 60000;
      else if (R.t === 'lv') { for (const k of S.eq) S.ab[k] = Math.min(MAX_LV, (S.ab[k] | 0) + 1); }
      else if (R.t === 'ab') {
        const A = AB[R.k], was = S.ab[R.k] | 0;
        if (!was) { S.ab[R.k] = 1; if (S.eq.length < 4) S.eq.push(R.k); } else S.ab[R.k] = Math.min(MAX_LV, was + 1);
        if (!quiet) this.showGot(A, was ? `Lv ${was} → Lv ${S.ab[R.k]}` : 'BATTLE PASS EXCLUSIVE 💯');
        Net.chat(`💯 unlocked ${A.n} ${A.e} from the Bussin Battle Pass`);
      }
      if (!quiet) { toast(`${e} ${t}`, tr === 'p' ? '#fde047' : '#c4b5fd'); sfx(tr === 'p' ? 'unlock' : 'reward'); }
      this.dirty = true; this.save(); this.send(true); this.drawBar(); this.drawTop();
      return true;
    },
    // a reward, big, in the middle (the same card as a crate's)
    showGot(A, note) {
      const old = $('#auBox'); if (old) old.remove();
      const el = document.createElement('div'); el.id = 'auBox';
      el.innerHTML = `<div class="in"><div class="got r${A.r}" style="--rc:${RAR[A.r][1]}"><div class="e">${A.e}</div><b>${esc(A.n)}</b><span>${RAR[A.r][0]} tier</span><p>${esc(A.d)}</p><div class="lv">${esc(note)}</div></div><div class="tap">click to close</div></div>`;
      el.onclick = () => el.remove(); $('#xhud').append(el); sfx('unlock');
    },
    bpBuy() { closePanel(); openShop(); },
    bpTabs(on) { return `<div class="tabs"><button data-tab="pass" class="${on === 'pass' ? 'on' : ''}">💯 Battle Pass</button><button data-tab="shop" class="${on === 'shop' ? 'on' : ''}">🛒 Pass Shop</button><span class="pcb">🎟️ ${comma(this.S.pc)} Pass Coins</span></div>`; },
    // the Pass Shop: Limited Power Crates (so many a day) and today's abilities (one each a day), for Pass Coins
    pshop() { const S = this.S, d = today(); if (!S.pshop || S.pshop.d !== d) S.pshop = { d, b: {} }; return S.pshop; },
    passShop() {
      const S = this.S, sh = this.pshop(), left = untilMidnight(), body = $('#xpBody'), keep = !$('#xpanel').hidden && $('#xpTitle').textContent === '💯 Bussin Battle Pass' && this.psOpen ? body.scrollTop : 0;
      const odds = (o) => `<div class="au-odds">${luckOdds(o, S.lk).map((p, r, a) => { const q = p / a.reduce((x, y) => x + y, 0) * 100; return `<div class="${p ? '' : 'zero'}" style="--rc:${RAR[r][1]}">${RAR[r][0]}<br><b>${q >= 10 || !q ? Math.round(q) : q.toFixed(1)}%</b></div>`; }).join('')}</div>`;
      const crates = POWER_CRATES.map((C) => {
        const got = sh.b[C.id] | 0, out = got >= C.stock, poor = S.pc < C.pc;
        return `<div class="pcr ${C.cls} ${out ? 'sold' : ''}"><div class="top"><span class="e">${C.e}</span><span><b>${C.n}</b><small>${esc(C.d)}</small><small class="left">⏳ LIMITED: ${C.stock - got} / ${C.stock} left today</small></span></div>${odds(C.odds)}<button class="xp-btn ${out || poor ? '' : 'gold'}" data-pcrate="${C.id}" ${out || poor ? 'disabled' : ''}>${out ? 'SOLD OUT · back tomorrow' : poor ? `Need 🎟️ ${comma(C.pc - S.pc)} more` : `Open for 🎟️ ${comma(C.pc)}`}</button></div>`;
      }).join('');
      const abs = shopOf(sh.d).map((k) => {
        const A = AB[k], lv = S.ab[k] | 0, bought = sh.b['a:' + k], price = pcPrice(k), maxed = lv >= MAX_LV, poor = S.pc < price;
        const btn = `<button class="xp-btn ${bought || maxed || poor ? '' : 'gold'}" data-pab="${k}" ${bought || maxed || poor ? 'disabled' : ''}>${bought ? '✅ Bought today' : maxed ? 'MAXED' : poor ? `Need 🎟️ ${comma(price - S.pc)}` : `${lv ? `Lv ${lv} → ${lv + 1}` : 'Buy'} · 🎟️ ${comma(price)}`}</button>`;
        return this.abCard(k, lv, { btn });
      }).join('');
      const html = `<div class="au-bp au-ps">${this.bpTabs('shop')}
        <p class="xp-note">🛒 New stock every day (in <b>${dur(left)}</b>). ⚡ Limited Power Crates hold everything, the Phonk and the four ⚡ Power abilities included (Gigachad Thunder, Rizz Vortex, Ohio Dragon, Sigma Eclipse); 🍀 Rizz Luck counts. Abilities are one each a day: one you have goes up a level.</p>
        <h4>⚡ Limited Power Crates</h4><div class="crates">${crates}</div>
        <h4>🎒 Today’s abilities</h4><div class="xp-grid">${abs}</div>
        <p class="xp-note">🎟️ Pass Coins: +${this.pcK(PC_LV)} for every Battle Pass level, +${this.pcK(PC_DAILY)} for a daily challenge, and after level 50, ♾️ +${this.pcK(PC_INF)} for every ${PC_INF_XP} XP, forever. You have <b>🎟️ ${comma(S.pc)}</b>.</p></div>`;
      openPanel('💯 Bussin Battle Pass', html, (b) => {
        if (b.dataset.tab) { this.bpPanel(b.dataset.tab); return; }
        if (b.dataset.pcrate) {
          const C = POWER_CRATES.find((c) => c.id === b.dataset.pcrate), sh2 = this.pshop(); if (!C) return;
          if ((sh2.b[C.id] | 0) >= C.stock || S.pc < C.pc) { sfx('error'); return; }
          S.pc -= C.pc; sh2.b[C.id] = (sh2.b[C.id] | 0) + 1; this.psOpen = false;
          this.openCrate(C.odds, `${C.e} ${C.n}`, C.au, 'pw');
          if (C.id === 'pw3') Net.chat(`💎 opened a Mythic Crate from the Pass Shop`);
        } else if (b.dataset.pab) {
          const k = b.dataset.pab, A = AB[k], sh2 = this.pshop(), price = pcPrice(k), was = S.ab[k] | 0;
          if (!A || sh2.b['a:' + k] || was >= MAX_LV || S.pc < price || !shopOf(sh2.d).includes(k)) { sfx('error'); return; }
          S.pc -= price; sh2.b['a:' + k] = 1; S.ab[k] = was + 1; if (!was && S.eq.length < 4) S.eq.push(k);
          this.dirty = true; this.save(); this.send(true); this.drawBar();
          this.showGot(A, was ? `Lv ${was} → Lv ${was + 1}` : 'NEW ABILITY 🔥 (from the Pass Shop)');
          if (A.r >= 4) Net.chat(`🛒 bought ${A.n} ${A.e} in the Pass Shop`);
          this.passShop();
        }
      }, null, { full: true });
      this.psOpen = true; $('#xpBody').scrollTop = keep;
    },
    bpPanel(tab) {
      if (tab) this.bpTab = tab; if (this.bpTab === 'shop') { this.passShop(); return; }
      const S = this.S, [L, into] = bpLevel(S.bx), prem = hasItem('bp'), need = L < BP_MAX ? bpNeed(L + 1) : 1, can = this.bpClaimable();
      const day = today(), dq = S.dq && S.dq.d === day ? S.dq : { p: {}, done: {} };
      const tile = (tr, l) => {
        const R = (tr === 'f' ? bpFree : bpPrem)(l), [e, t] = this.bpLabel(R), got = S.bpc[tr + l], cls = got ? 'got' : l > L ? 'lock' : tr === 'p' && !prem ? 'plock' : 'can';
        return `<button class="t ${tr} ${cls}" data-bpc="${tr}${l}"><span class="e">${e}</span><span class="n">${esc(t)}</span><i>${got ? '✓' : cls === 'can' ? 'CLAIM' : cls === 'plock' ? '🔒 Bussin+' : '🔒'}</i></button>`;
      };
      const inf = this.pcInf();
      const cols = Array.from({ length: BP_MAX }, (_, i) => i + 1).map((l) => `<div class="c ${l <= L ? 'on' : ''} ${l === L + 1 ? 'next' : ''} ${l % 10 === 0 ? 'big' : ''}"><b>${l}</b>${tile('f', l)}${tile('p', l)}</div>`).join('')
        + `<div class="c inf ${L >= BP_MAX ? 'on' : ''}"><b>♾️</b><button class="t ${L < BP_MAX ? 'lock' : inf ? 'can' : 'got'}" data-pinf="1"><span class="e">♾️</span><span class="n">Infinite Pass Coins<br>🎟️ +${this.pcK(PC_INF)} every ${PC_INF_XP} XP</span><i>${L < BP_MAX ? '🔒 level 50' : inf ? `CLAIM +${comma(this.pcK(PC_INF * inf))}` : `next in ${PC_INF_XP - (S.bx - BP_TOTAL) % PC_INF_XP} XP`}</i></button></div>`;
      const html = `<div class="au-bp">${this.bpTabs('pass')}
        <div class="hd"><div class="lvl"><small>LEVEL</small><b>${L}</b></div><div class="xp"><div class="tt">${L >= BP_MAX ? 'MAXED 💯 ♾️ Infinite Pass Coins: +${this.pcK(PC_INF)} 🎟️ every ${PC_INF_XP} XP' : `${comma(into)} / ${comma(need)} XP to level ${L + 1}`}</div><div class="bar"><i style="width:${L >= BP_MAX ? 100 : (into / need * 100).toFixed(1)}%"></i></div><small>${comma(S.bx)} XP so far · season 1: no cap</small></div>${can ? `<button class="xp-btn gold" data-bpall="1">🎁 Claim all (${can})</button>` : ''}</div>
        <div class="prem ${prem ? 'on' : ''}">${prem ? '👑 <b>Bussin+ is active.</b> Both tracks are yours. Main character energy.' : `👑 <b>Bussin+</b>: a second track of 50 rewards (Sigma, Phonk and Ohio keys, more aura and coins, 2× boosts) and two abilities you can’t get anywhere else, 🧢 No Cap Beam and 👑 Final Boss Mode. Levels you’ve already reached unlock right away.<br><button class="xp-btn buy" data-bpbuy="1">👑 Get Bussin+ · 🪙 ${BP_PRICE} in the shop</button>`}</div>
        <div class="lbs"><span>TOP: FREE</span><span class="p">BOTTOM: 👑 BUSSIN+</span></div>
        <div class="track">${cols}</div>
        <h4>📅 Daily challenges <small style="color:var(--muted);font:700 12px var(--fb)">— new ones every day</small></h4>
        ${this.dailies().map((q) => { const p = Math.min(q.goal, dq.p[q.id] || 0), d = dq.done[q.id]; return `<div class="xp-row q ${d ? 'done' : ''}"><span><b>${d ? '✅' : '🎯'} ${esc(q.n)}</b><div class="bar"><i style="width:${(p / q.goal * 100).toFixed(0)}%"></i></div><small>${q.id === 'time' ? `${Math.floor(p / 60)} / ${q.goal / 60} min` : `${comma(p)} / ${comma(q.goal)}`}</small></span><b class="x">+${q.xp} XP</b></div>`; }).join('')}
        <p class="xp-note">🎟️ Pass Coins: +${this.pcK(PC_LV)} for every level, +${this.pcK(PC_DAILY)} for a daily challenge, and after level 50, ♾️ +${this.pcK(PC_INF)} for every ${PC_INF_XP} XP, forever${hasItem('bp') ? ' (Bussin+: half as much again, included)' : ' (Bussin+ gets half as much again)'}. Spend them in the 🛒 Pass Shop.</p>
        <p class="xp-note">💯 XP comes from playing: farming (1 XP every 5 clicks and every 10 seconds), duels (+60 for a W, +25 for an L), opening crates (+20), landing abilities (+2 a hit), buying upgrades (+5 a level), Unc Joe’s jokes (+5) and the daily challenges.</p></div>`;
      const old = $('#xpBody .au-bp .track'), keep = old ? old.scrollLeft : null;
      openPanel('💯 Bussin Battle Pass', html, (b) => {
        if (b.dataset.bpall) {
          let n = 0; const L2 = bpLevel(S.bx)[0];
          for (let l = 1; l <= L2; l++) for (const t of ['f', 'p']) if (this.bpClaim(t, l, true)) n++;
          const c = this.claimInf(); if (c) { n++; toast(`♾️ +${comma(c)} Pass Coins`, '#a5b4fc'); }
          if (n) { sfx('reward'); toast(`🎁 Claimed ${n} reward${n === 1 ? '' : 's'}. Bussin.`, '#fde047'); }
          this.bpPanel();
        } else if (b.dataset.tab) this.bpPanel(b.dataset.tab);
        else if (b.dataset.pinf) { const c = this.claimInf(); if (c) { sfx('reward'); toast(`♾️ +${comma(c)} Pass Coins`, '#a5b4fc'); this.bpPanel(); } }
        else if (b.dataset.bpbuy || b.classList.contains('plock')) this.bpBuy();
        else if (b.dataset.bpc) { if (this.bpClaim(b.dataset.bpc[0], +b.dataset.bpc.slice(1))) this.bpPanel(); }
      }, null, { full: true });
      const tr = $('#xpBody .au-bp .track'); if (tr) tr.scrollLeft = keep != null ? keep : Math.max(0, (Math.min(L, BP_MAX - 1) - 1) * 106);
    },
    duelPanel() {
      const g = this.g, busy = new Set(g && Array.isArray(g.D) ? g.D.flatMap((d) => d.f) : []), others = players().filter((p) => !p.me);
      const live = g && Array.isArray(g.D) ? g.D.filter((d) => d.ph !== 'end') : [];
      const html = `<p class="xp-note">⚔️ Challenge someone to a 1v1. The winner steals <b>20%</b> of the loser’s aura (you steal <b>${Math.round((STEAL + 0.01 * this.S.tx) * 100)}%</b>: 💸 Fanum Tax Rate) and gets a free 🏆 W Crate. Your aura gives you ${pctOf(auraMult(this.S.au))} damage.</p>
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
      { id: 'bp', e: '👑', n: 'Bussin+ Pass', d: 'The premium track of the 💯 Bussin Battle Pass: 50 more rewards (Sigma, Phonk and Ohio keys, more aura and coins, 2× boosts) and two abilities you can’t get anywhere else, No Cap Beam and Final Boss Mode. Levels you’ve already reached unlock right away', price: BP_PRICE, kind: 'pass' },
      { id: 'snack', e: '🍟', n: 'Aura Snack', d: 'Aura right now: 300 seconds’ worth', price: 25, kind: 'now' },
    ],
    shopCan(id) { return id === 'snack' && !this.S ? 'Loading…' : ''; },
    onBuy(id) {
      if (id === 'au2' || id === 'hp') { this.send(true); this.drawBar(); return; }
      if (id === 'bp') { toast('👑 Bussin+ unlocked! Claim your premium rewards in 💯 Battle Pass', '#fde047'); sfx('unlock'); this.drawBar(); return; }
      if (id !== 'snack') return;
      const v = 300 * this.perSec(); this.gain(v); toast(`🍟 +${comma(v)} aura. Bussin.`, '#86efac'); this.drawTop();
    },
  };
  addExp(AU);
  window.__rbAU = AU;
})();
