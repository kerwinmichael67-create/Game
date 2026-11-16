/* ========================================================================
   Game: race controller (setup, frame loop, laps, results)
   ======================================================================== */
/* drift attack medals scale with lap distance (points for the two-lap run) */
function driftMedals(track, laps) {
  const km = ((track.length / 1000) * laps) / 2;
  return {
    bronze: Math.round((km * 1100) / 100) * 100,
    silver: Math.round((km * 2700) / 100) * 100,
    gold: Math.round((km * 4800) / 100) * 100,
  };
}
const BOT_GARAGE = [
  ['vanta', 'vanta', 'kite'],
  ['vanta', 'kite', 'brute', 'vanta'],
  ['kite', 'brute', 'apex', 'apex'],
];

const Game = {
  world: null,
  track: null,
  cars: [],
  player: null,
  bots: [],
  ghost: null,
  ghostRec: [],
  ghostData: null,
  state: 'idle',
  mode: 'ai',
  laps: 3,
  raceTime: 0,
  countdown: 0,
  countdownTotal: 4,
  standings: [],
  playerPos: 1,
  finishedAt: null,
  results: null,
  acc: 0,
  seed: 1,
  opts: {},
  paused: false,
  onFinish: null,
  onTick: null,
  autopilot: false,
  headless: false,
  launchAt: null,
  launchHeld: false,
  resetHold: 0,

  setup(opts) {
    this.opts = opts;
    this.mode = opts.mode;
    this.laps = opts.mode === 'drift' ? 2 : opts.laps || 3;
    this.seed = opts.seed || 1;
    const def = TRACKS.find((t) => t.id === opts.trackId) || TRACKS[0];
    this.clearCars();
    if (!this.track || this.track.id !== def.id || this.world.track !== this.track) {
      this.track = new Track(def);
      this.world.load(this.track, hashStr(def.id));
    }
    const prof = Profile.data,
      R = rng(this.seed),
      night = !!this.track.def.theme.night;
    const paint = PAINTS.find((p) => p.id === prof.paint) || PAINTS[0];
    this.player = new Car({
      id: 'me',
      name: (prof.name || '').trim().slice(0, 16) || 'You',
      hex: paint.hex,
      paintId: paint.id,
      isPlayer: true,
      model: prof.car,
      levels: Profile.up(),
      night,
      number: 1,
    });
    this.cars.push(this.player);
    const di = opts.difficulty ?? 1,
      diff = DIFFICULTY[di];
    const botCount = opts.mode === 'trial' || opts.mode === 'drift' ? 0 : (opts.botCount ?? 5);
    const names = BOT_NAMES.slice().sort(() => R() - 0.5),
      used = new Set([paint.id]);
    for (let i = 0; i < botCount; i++) {
      const palette = PAINTS.filter((p) => !used.has(p.id));
      const bp = palette[Math.floor(R() * palette.length)] || PAINTS[i % PAINTS.length];
      used.add(bp.id);
      const lv = {};
      for (const k in diff.levels)
        lv[k] = clamp(diff.levels[k] + Math.floor(R() * 3) - 1, 0, MAX_LEVEL); /* per-bot jitter so the grid isn't uniform */
      const model = BOT_GARAGE[di][Math.floor(R() * BOT_GARAGE[di].length)];
      const bot = new Car({
        id: 'bot' + i,
        name: names[i % names.length],
        hex: bp.hex,
        paintId: bp.id,
        model,
        levels: lv,
        label: opts.mode === 'online' ? names[i % names.length] : null,
        night,
        number: 2 + i + Math.floor(R() * 60),
      });
      bot.ai = new AIDriver(bot, this.track, diff, this.seed * 31 + i);
      this.bots.push(bot);
      this.cars.push(bot);
    }
    /* grid order: the player starts at the back in AI races (earn your way forward) */
    const order = opts.mode === 'online' ? opts.gridOrder(this.cars) : [...this.bots, this.player];
    order.forEach((c, k) => {
      if (!c) return;
      const g = this.track.gridPose(k);
      c.place(g, g.idx);
      this.world.add(c.mesh);
    });
    this.world.attachHeadlights(this.player);
    /* ghost for time trial */
    this.ghost = null;
    this.ghostData = null;
    this.ghostRec = [];
    if (opts.mode === 'trial') {
      const gd = prof.ghosts && prof.ghosts[this.track.id];
      if (gd && gd.length > 10) {
        this.ghostData = gd;
        this.ghost = new Car({ id: 'ghost', name: 'Ghost', hex: 0xffffff, ghost: true, model: prof.car });
        this.ghost.mesh.visible = false;
        this.world.add(this.ghost.mesh);
      }
    }
    this.state = 'countdown';
    this.countdown = 3.999;
    this.countdownTotal = 3.999;
    this.raceTime = 0;
    this.finishedAt = null;
    this.results = null;
    this.paused = false;
    this.acc = 0;
    this.launchAt = null;
    this.launchHeld = false;
    this.resetHold = 0;
    this.newRecord = false;
    this.driftHintShown = false;
    const w = this.world;
    w.camMode = prof.cam || 0;
    w.updateCamera(this.player, 0, w.camMode, true);
    w.introCamera(this.player, 0);
    w.setStartLights(0, false);
    w.onLap = (car) => this.onLap(car);
    w.onDrift = (car, evt, d) => this.onDrift(car, evt, d);
    w.onPad = (car) => this.onPad(car);
    this.updateStandings();
    HUD.lastStand = '';
    HUD.tagKey = '~';
    HUD.bankT = 0;
    HUD.show(true);
    HUD.update(this, 0);
    document.body.classList.toggle('touch', Input.isTouch);
    Audio.resume();
    Audio.stopAll();
    Music.setMode('race', this.track.id);
    HUD.message('3');
  },
  clearCars() {
    for (const c of this.cars) this.world.remove(c.mesh);
    if (this.ghost) this.world.remove(this.ghost.mesh);
    this.cars = [];
    this.bots = [];
    this.player = null;
    this.ghost = null;
  },

  startRacing() {
    this.state = 'racing';
    this.raceTime = 0;
    for (const c of this.cars) c.lapStart = 0;
    HUD.message('GO!', 'green', 0.8);
    Audio.beep(1200, 0.5, 'square', 0.3);
    this.world.setStartLights(5, true);
    setTimeout(() => this.world.setStartLights(0, false), 2500);
    /* throttle picked up in the last half second of the countdown = rocket start */
    if (this.launchAt != null && this.launchAt <= 0.5 && !this.autopilot) {
      const p = this.player;
      p.turboT = 1.4;
      p.turboPow = 0.9;
      p.turboTier = 2;
      HUD.toast('PERFECT START', 1.6, 'good');
      Audio.whoosh(1);
    } else if (this.mode === 'drift') HUD.toast('TAP DRIFT AS YOU TURN IN · STRAIGHTEN UP FOR A BOOST', 4);
  },

  onDrift(car, evt, d) {
    if (!car.isPlayer || this.headless) return;
    if (evt === 'tier') Audio.tier(d.tier);
    else if (evt === 'end') {
      if (d.banked > 0) HUD.banked(d.banked, d.tier);
      if (d.tier > 0) {
        Audio.whoosh(0.6 + d.tier * 0.2);
        this.world.shake = Math.max(this.world.shake, 0.15);
      }
    } else if (evt === 'fail') {
      if (car.driftPts > 150) {
        HUD.toast('DRIFT LOST', 1, 'bad');
        Audio.fail();
      }
    }
  },
  onPad(car) {
    if (car.isPlayer && !this.headless) {
      Audio.whoosh(1);
      this.world.shake = Math.max(this.world.shake, 0.2);
    }
  },

  onLap(car) {
    if (car.finished) return;
    const t = this.raceTime,
      lapT = Math.round((t - car.lapStart) * 1000);
    car.lapTimes.push(lapT);
    car.lapStart = t;
    if (car.bestLap == null || lapT < car.bestLap) car.bestLap = lapT;
    if (car.isPlayer) {
      Audio.lap();
      const prof = Profile.data,
        id = this.track.id,
        prevBest = prof.bestLaps[id];
      const record = !prevBest || lapT < prevBest;
      if (record && !this.autopilot) {
        prof.bestLaps[id] = lapT;
        this.newRecord = true;
        if (this.mode === 'trial' && this.ghostRec.length > 10) prof.ghosts[id] = this.ghostRec;
        Profile.save();
      }
      if (this.mode === 'trial') {
        if (record) {
          HUD.toast('NEW RECORD  ' + fmtTime(lapT), 2.5, 'good');
          this.ghostData = prof.ghosts[id];
          if (!this.ghost && this.ghostData) {
            this.ghost = new Car({ id: 'ghost', name: 'Ghost', hex: 0xffffff, ghost: true, model: prof.car });
            this.world.add(this.ghost.mesh);
          }
        } else HUD.toast('LAP  ' + fmtTime(lapT) + '  +' + ((lapT - prevBest) / 1000).toFixed(2), 2, 'bad');
        this.ghostRec = [];
      } else {
        const prev = car.lapTimes.length > 1 ? Math.min(...car.lapTimes.slice(0, -1)) : null;
        const d = prev == null ? '' : (lapT - prev >= 0 ? '  +' : '  −') + (Math.abs(lapT - prev) / 1000).toFixed(2);
        HUD.toast(
          (record ? 'RECORD  ' : 'LAP  ') + fmtTime(lapT) + d,
          1.8,
          record ? 'good' : prev == null ? '' : lapT < prev ? 'good' : 'bad'
        );
        if (car.lap === this.laps - 1)
          setTimeout(() => {
            if (this.state === 'racing') HUD.message('FINAL LAP', '', 1.4);
          }, 900);
      }
    }
    if (car.lap >= this.laps) {
      car.finished = true;
      car.finishTime = Math.round(t * 1000);
      if (car.isPlayer) {
        if (car.drifting) car.endDrift(this.world, true);
        this.finishedAt = t;
        HUD.message('FINISH', 'green', 2);
        Audio.fanfare();
        car.ai = new AIDriver(car, this.track, DIFFICULTY[1], 7);
        car.ai.d = Object.assign({}, DIFFICULTY[1], { speed: 0.6, nitro: 0 });
        if (this.onFinish) this.onFinish(car);
      }
    }
  },

  updateStandings() {
    const live = this.cars.filter((c) => !c.ghost);
    live.sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.totalProgress - a.totalProgress;
    });
    this.standings = live;
    this.playerPos = live.indexOf(this.player) + 1;
  },
  resetPlayer() {
    const p = this.player;
    if (!p || this.state !== 'racing' || p.finished) return;
    p.recover(this.track);
    this.world.updateCamera(p, 0, this.world.camMode, true);
    HUD.toast('BACK ON TRACK', 1);
  },

  frame(dt) {
    if (this.state === 'idle') return;
    if (this.paused && this.mode !== 'online') {
      this.world.render();
      return;
    }
    const w = this.world,
      p = this.player;
    const racing = this.state === 'racing' || this.state === 'finished';
    /* inputs */
    const ai = (p.finished || this.autopilot) && p.ai;
    if (ai) {
      if (racing) p.ai.update(dt, this.cars, null);
    } else Input.read(p.input);
    p.digital = !ai;
    if (this.state === 'countdown') {
      const th = p.input.throttle > 0.5;
      if (th && !this.launchHeld) this.launchAt = this.countdown;
      if (!th) this.launchAt = null;
      this.launchHeld = th;
      const prev = Math.ceil(this.countdown);
      this.countdown -= dt;
      const now = Math.ceil(this.countdown);
      if (now !== prev && now > 0) {
        HUD.message(String(now));
        Audio.beep(660, 0.15, 'square', 0.25);
        w.setStartLights(4 - now, false);
      }
      if (this.countdown <= 0) this.startRacing();
    }
    if (racing) this.raceTime += dt;
    for (const b of this.bots) {
      if (racing) b.ai.update(dt, this.cars, p.totalProgress);
      else {
        b.input.throttle = 0;
        b.input.brake = 0;
      }
    }
    for (const c of this.cars) if (!c.remote) c.hold = !(this.state === 'racing' || this.state === 'finished');
    /* slipstream: tucked in behind another car at speed */
    for (const c of this.cars) {
      if (c.remote || c.ghost) continue;
      let d = 0;
      if (c.speed > 24) {
        const f = c.forward(),
          r = c.rightVec();
        for (const o of this.cars) {
          if (o === c || o.ghost) continue;
          const ox = o.pos.x - c.pos.x,
            oz = o.pos.z - c.pos.z,
            ahead = ox * f.x + oz * f.z;
          if (ahead > 4 && ahead < 26 && Math.abs(ox * r.x + oz * r.z) < 2.4 && o.speed > 15) {
            d = 1;
            break;
          }
        }
      }
      c.draft = damp(c.draft, d, d ? 1.6 : 3.5, dt);
    }
    /* fixed-step physics */
    this.acc += Math.min(dt, 0.1);
    const h = 1 / 120;
    let steps = 0;
    while (this.acc >= h && steps < 12) {
      for (const c of this.cars) if (!c.remote) c.step(h, this.track, w);
      for (let i = 0; i < this.cars.length; i++)
        for (let j = i + 1; j < this.cars.length; j++) {
          const a = this.cars[i],
            b = this.cars[j];
          if (a.ghost || b.ghost || (a.remote && b.remote)) continue;
          if (a.remote) b.collide(a, w);
          else a.collide(b, w);
        }
      this.acc -= h;
      steps++;
    }
    for (const c of this.cars) {
      if (c.remote) c.netUpdate && c.netUpdate(dt);
      c.syncMesh(dt);
    }
    /* recovery: automatic when wedged, manual with R (or brake + drift on touch) */
    if (this.state === 'racing' && !p.finished && !ai) {
      if (p.stuck > 3.5) this.resetPlayer();
      this.resetHold = Input.isTouch && p.input.brake > 0.5 && p.input.handbrake && Math.abs(p.speed) < 6 ? this.resetHold + dt : 0;
      if (this.resetHold > 0.8) {
        this.resetHold = 0;
        this.resetPlayer();
      }
    }
    /* ghost */
    if (this.mode === 'trial' && this.state === 'racing' && !p.finished) {
      const lapT = this.raceTime - p.lapStart;
      if (this.ghostRec.length === 0 || lapT - this.ghostRec[this.ghostRec.length - 1][3] >= 0.1)
        this.ghostRec.push([+p.pos.x.toFixed(2), +p.pos.z.toFixed(2), +p.yaw.toFixed(3), +lapT.toFixed(2)]);
      if (this.ghost && this.ghostData) {
        const gd = this.ghostData;
        let i = 0;
        while (i < gd.length - 2 && gd[i + 1][3] < lapT) i++;
        const a = gd[i],
          b = gd[Math.min(i + 1, gd.length - 1)];
        const f = b[3] > a[3] ? clamp((lapT - a[3]) / (b[3] - a[3]), 0, 1) : 0;
        this.ghost.mesh.visible = lapT < gd[gd.length - 1][3] + 0.3;
        /* the recording stores x, z and yaw only: height and lean come from the track surface */
        const gx = lerp(a[0], b[0], f),
          gz = lerp(a[1], b[1], f),
          gyaw = a[2] + wrapAngle(b[2] - a[2]) * f,
          gi = this.track.nearest(gx, gz);
        this.ghost.mesh.position.set(gx, this.track.heightAt(gi, this.track.lateral(gx, gz, gi)) + 0.02, gz);
        this.ghost.mesh.rotation.set(0, gyaw, -this.track.bank[gi] * Math.cos(wrapAngle(gyaw - this.track.yawAt(gi))), 'YXZ');
      }
    }
    this.updateStandings();
    if (this.onTick) this.onTick(dt);
    if (this.headless) {
      this.checkEnd();
      return;
    }
    w.effects(this.cars, dt);
    if (this.state === 'countdown') w.introCamera(p, 1 - this.countdown / this.countdownTotal);
    else w.updateCamera(p, dt);
    w.render();
    HUD.update(this, dt);
    /* audio */
    const sp = Math.max(p.spd, Math.abs(p.speed)),
      rpm = clamp(((sp % 18) / 18) * 0.6 + (sp / p.stats.topSpeed) * 0.5, 0, 1),
      hot = p.boosting || p.turboT > 0 || p.padT > 0;
    Audio.updateEngine('me', rpm, p.input.throttle, 1, sp > 4 ? p.slip : 0, hot ? 1 : 0);
    let k = 0;
    for (const b of this.cars) {
      if (b.isPlayer || b.ghost) continue;
      const d = b.pos.distanceTo(p.pos);
      if (d < 60 && k < 3) {
        k++;
        const vol = clamp(1 - d / 60, 0, 1) * 0.45;
        Audio.updateEngine(b.id, clamp(Math.abs(b.speed) / b.stats.topSpeed, 0, 1), 0.6, vol, b.slip * 0.5, b.boosting ? 0.5 : 0);
      } else Audio.stopEngine(b.id);
    }
    this.checkEnd();
  },
  checkEnd() {
    if (this.player.finished && this.state !== 'finished') this.state = 'finished';
    if (this.state === 'finished' && !this.results) {
      const others = this.cars.filter((c) => !c.ghost && !c.isPlayer);
      const waited = this.raceTime - this.finishedAt,
        solo = this.mode === 'trial' || this.mode === 'drift';
      if (solo ? waited > 1.2 : others.every((c) => c.finished) || waited > (this.mode === 'online' ? 30 : 12)) this.finishRace();
    }
  },

  finishRace() {
    /* project unfinished cars' times from their remaining distance */
    for (const c of this.cars)
      if (!c.ghost && !c.finished) {
        const rem = Math.max(0, this.laps - c.totalProgress) * this.track.length;
        c.finishTime = Math.round((this.raceTime + rem / Math.max(20, c.stats.topSpeed * 0.75)) * 1000);
        c.projected = true;
      }
    this.updateStandings();
    const p = this.player,
      prof = Profile.data,
      pos = this.playerPos,
      n = this.standings.length,
      tid = this.track.id;
    const res = {
      mode: this.mode,
      pos,
      n,
      credits: 0,
      title: '',
      note: '',
      head: ['Pos', 'Driver', 'Best lap', 'Total'],
      rows: [],
      win: false,
      record: this.newRecord,
    };
    if (this.mode === 'drift') {
      const score = p.driftScore,
        med = driftMedals(this.track, this.laps);
      const medal = score >= med.gold ? 'gold' : score >= med.silver ? 'silver' : score >= med.bronze ? 'bronze' : null;
      res.credits = Math.min(1500, Math.floor(score / 12)) + ({ gold: 500, silver: 250, bronze: 100 }[medal] || 0);
      res.title = medal ? medal[0].toUpperCase() + medal.slice(1) + ' medal' : 'Drift attack';
      res.win = medal === 'gold';
      const best = prof.bestDrift[tid] || 0;
      if (score > best) {
        prof.bestDrift[tid] = score;
        res.record = true;
      }
      res.head = ['', 'Target', 'Score', ''];
      res.rows = [
        { cells: ['★', 'Your run', fmtInt(score), 'Best slide ' + fmtInt(p.driftBest)], me: true },
        { cells: ['1', 'Gold', fmtInt(med.gold), score >= med.gold ? 'Beaten' : ''], cls: 'p1' },
        { cells: ['2', 'Silver', fmtInt(med.silver), score >= med.silver ? 'Beaten' : ''], cls: 'p2' },
        { cells: ['3', 'Bronze', fmtInt(med.bronze), score >= med.bronze ? 'Beaten' : ''], cls: 'p3' },
      ];
      res.note =
        (score > best ? 'New personal best on this circuit. ' : 'Personal best ' + fmtInt(best) + '. ') +
        'Chain slides within 2.5 seconds to build the multiplier.';
    } else if (this.mode === 'trial') {
      res.credits = 60 * p.lapTimes.length;
      res.title = 'Time trial';
      res.note = 'Time trial pays 60 CR per lap. Beat your record for a new ghost.';
      res.head = ['Lap', 'Time', 'Gap to best', ''];
      const best = p.bestLap;
      res.rows = p.lapTimes.map((t, i) => ({
        cells: [i + 1, fmtTime(t), t === best ? 'Best' : '+' + ((t - best) / 1000).toFixed(3), ''],
        me: t === best,
      }));
    } else {
      const table = [500, 360, 260, 180, 140, 120, 100, 90],
        diffMul = [0.8, 1, 1.35][this.opts.difficulty ?? 1] || 1;
      res.credits = Math.round((table[pos - 1] || 80) * (this.laps / 3) * diffMul * (this.mode === 'online' ? 1.4 : 1));
      const bestAll = Math.min(...this.standings.filter((c) => c.bestLap != null).map((c) => c.bestLap));
      if (p.bestLap != null && p.bestLap <= bestAll && n > 1) {
        res.credits += 100;
        res.note = 'Fastest lap +100 CR. ';
      }
      const driftCr = Math.min(400, Math.floor(p.driftScore / 30));
      if (driftCr > 0) {
        res.credits += driftCr;
        res.note += `Drift bonus +${driftCr} CR. `;
      }
      res.note += pos === 1 ? 'Race win!' : pos <= 3 ? 'Podium finish.' : 'Finish higher for a bigger payout.';
      if (this.mode === 'online') res.note += ' Online races pay 40% extra.';
      prof.races = (prof.races || 0) + 1;
      if (pos === 1) prof.wins = (prof.wins || 0) + 1;
      res.title = pos === 1 ? 'Victory' : `${pos}${ordinal(pos)} place`;
      res.win = pos === 1;
      res.rows = this.standings.map((c, i) => ({
        id: c.id,
        cells: [
          i + 1,
          c.name + (c.isPlayer && c.name !== 'You' ? ' (you)' : ''),
          fmtTime(c.bestLap),
          (c.projected ? '~' : '') + fmtTime(c.finishTime),
        ],
        me: c.isPlayer,
        posCls: i < 3 ? 'p' + (i + 1) : '',
      }));
    }
    prof.credits += res.credits;
    Profile.save();
    if (res.record) Profile.pushRecord();
    this.results = res;
    HUD.show(false);
    Audio.stopAll();
    UI.showResults(res);
    if (Net.active && this.mode === 'online') Net.onLocalResults();
  },

  stop() {
    this.state = 'idle';
    this.clearCars();
    HUD.show(false);
    HUD.lastPos = null;
    Audio.stopAll();
    Music.setMode('menu');
    document.body.classList.remove('touch');
  },
};
