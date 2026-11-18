/* ========================================================================
   Style: rewards for driving with flair. Overtakes, close passes, slingshots
   out of a slipstream and clean laps pay points and a shot of nitro; events
   in quick succession build a combo multiplier, and a hit breaks it.
   ======================================================================== */
const STYLE = {
  overtake: { label: 'OVERTAKE', pts: 100, nitro: 8 },
  close: { label: 'CLOSE PASS', pts: 160, nitro: 12 },
  slingshot: { label: 'SLINGSHOT', pts: 200, nitro: 14 },
  clean: { label: 'CLEAN LAP', pts: 250, nitro: 20 },
  start: { label: 'PERFECT START', pts: 150, nitro: 0 },
  canister: { label: 'NITRO', pts: 30, nitro: 35 },
  survive: { label: 'SURVIVED', pts: 120, nitro: 10 },
};
const COMBO_WINDOW = 5; /* seconds to land the next move and keep the multiplier */

const Style = {
  score: 0,
  combo: 0,
  comboT: 0,
  stats: {},
  reset() {
    this.score = 0;
    this.combo = 0;
    this.comboT = 0;
    this.stats = { overtakes: 0, nearMisses: 0, slingshots: 0, cleanLaps: 0, coins: 0, canisters: 0 };
    this.prev = new Map(); /* per rival: how far ahead of us it was last frame, and when it last paid out */
    this.draftT = 0;
    this.draftAt = -99;
    this.at = null;
  },
  mult() {
    return 1 + this.combo * 0.5;
  },
  /* pay out one move; returns the points banked */
  award(game, kind) {
    const s = STYLE[kind],
      p = game.player;
    this.combo = this.comboT > 0 ? Math.min(this.combo + 1, 4) : 0;
    this.comboT = COMBO_WINDOW;
    const got = Math.round(s.pts * this.mult());
    this.score += got;
    if (p && s.nitro) p.nitro = Math.min(p.stats.nitroCap, p.nitro + s.nitro);
    if (!game.headless) {
      HUD.style(s.label, got, this.mult());
      Audio.beep(880 * Math.pow(1.122, this.combo), 0.07, 'triangle', 0.16);
      setTimeout(() => Audio.beep(1320 * Math.pow(1.122, this.combo), 0.1, 'triangle', 0.14), 60);
    }
    return got;
  },
  /* a banked drift keeps the combo alive and adds a share of its points, without a second popup */
  drift(banked) {
    if (banked <= 0) return;
    this.combo = this.comboT > 0 ? Math.min(this.combo + 1, 4) : this.combo;
    this.comboT = COMBO_WINDOW;
    this.score += Math.round(banked * 0.1 * this.mult());
  },
  lap(game, car) {
    if (!car.dirty) {
      this.stats.cleanLaps++;
      this.award(game, 'clean');
    }
    car.dirty = false;
  },
  update(game, dt) {
    const p = game.player;
    if (!p || p.finished || game.state !== 'racing') return;
    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) this.combo = 0;
    }
    /* contact breaks the combo */
    if (p.hitT > 0.7 && (this.combo > 0 || this.comboT > 0)) {
      this.combo = 0;
      this.comboT = 0;
      if (!game.headless) HUD.style('COMBO LOST', 0, 1, 'bad');
    }
    /* time spent tucked in a slipstream: leaving it by passing the car ahead is a slingshot */
    if (p.draft > 0.5) {
      this.draftT += dt;
      if (this.draftT > 0.9) this.draftAt = game.raceTime;
    } else this.draftT = 0;
    /* a reset or any other jump is not a pass: forget where everyone was */
    if (this.at && (p.pos.x - this.at.x) ** 2 + (p.pos.z - this.at.z) ** 2 > 16) this.prev.clear();
    this.at = { x: p.pos.x, z: p.pos.z };
    const f = p.forward(),
      r = p.rightVec(),
      seen = this.prev;
    for (const o of game.cars) {
      if (o === p || o.ghost) continue;
      const ox = o.pos.x - p.pos.x,
        oz = o.pos.z - p.pos.z,
        ahead = ox * f.x + oz * f.z,
        side = Math.abs(ox * r.x + oz * r.z);
      const was = seen.get(o.id);
      if (was && was.ahead > 0 && ahead <= 0 && was.ahead < 4 && side < 7 && p.speed > 12 && p.speed > o.speed + 0.5 && game.raceTime - was.paid > 6) {
        /* we just drove past this car */
        was.paid = game.raceTime;
        this.stats.overtakes++;
        if (p.hitT > 0 || o.hitT > 0) {
          /* shoved through: it counts as a pass, but there is nothing stylish about it */
        } else if (game.raceTime - this.draftAt < 2.5) {
          this.stats.slingshots++;
          this.award(game, 'slingshot');
        } else if (side < 3.4) {
          this.stats.nearMisses++;
          this.award(game, 'close');
        } else this.award(game, 'overtake');
      }
      if (was) was.ahead = ahead;
      else seen.set(o.id, { ahead, paid: -99 });
    }
  },
};
