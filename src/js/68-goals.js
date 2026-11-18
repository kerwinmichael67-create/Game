/* ========================================================================
   Challenges: three running goals with a credit reward each. Progress is
   added up at the end of every race; a finished goal pays out and a new one
   takes its place, so there is always something to aim for.
   ======================================================================== */
const GOALS = [
  { id: 'overtake', stat: 'overtakes', n: [8, 12, 16], reward: 300, text: (n) => `Overtake ${n} cars` },
  { id: 'near', stat: 'nearMisses', n: [4, 6, 8], reward: 350, text: (n) => `Make ${n} close passes` },
  { id: 'sling', stat: 'slingshots', n: [3, 5], reward: 350, text: (n) => `Pull off ${n} slingshots out of a slipstream` },
  { id: 'coins', stat: 'coins', n: [60, 90, 120], reward: 300, text: (n) => `Collect ${n} coins` },
  { id: 'drift', stat: 'drift', n: [3000, 6000, 10000], reward: 350, text: (n) => `Bank ${fmtInt(n)} drift points` },
  { id: 'clean', stat: 'cleanLaps', n: [2, 3, 4], reward: 300, text: (n) => `Drive ${n} clean laps` },
  { id: 'podium', stat: 'podiums', n: [2, 3], reward: 400, text: (n) => `Finish on the podium ${n} times` },
  { id: 'win', stat: 'wins', n: [1, 2], reward: 500, text: (n) => (n === 1 ? 'Win a race' : `Win ${n} races`) },
  { id: 'ko', stat: 'koFinal', n: [3, 2], reward: 450, best: true, text: (n) => `Reach the final ${n} in Knockout` },
  { id: 'style', stat: 'style', n: [1500, 2500, 4000], reward: 400, best: true, text: (n) => `Score ${fmtInt(n)} style points in one race` },
];
const Goals = {
  def(g) {
    return GOALS.find((d) => d.id === g.id);
  },
  text(g) {
    const d = this.def(g);
    return d ? d.text(g.n) : '';
  },
  /* keep three distinct goals on the board */
  ensure(prof = Profile.data) {
    if (!prof.goals || !Array.isArray(prof.goals.list)) prof.goals = { seq: 0, list: [] };
    const G = prof.goals;
    G.list = G.list.filter((g) => this.def(g) && g.n > 0);
    let guard = 0;
    while (G.list.length < 3 && guard++ < 50) {
      const R = rng(1009 + G.seq++ * 7919),
        d = GOALS[Math.floor(R() * GOALS.length)];
      if (G.list.some((g) => g.id === d.id) || d.id === G.last) continue;
      G.list.push({ id: d.id, n: d.n[Math.floor(R() * d.n.length)], p: 0 });
    }
    return G.list;
  },
  /* add one race's numbers; returns the goals it completed, already paid */
  apply(stats, prof = Profile.data) {
    const done = [];
    for (const g of this.ensure(prof).slice()) {
      const d = this.def(g),
        v = stats[d.stat] || 0;
      /* koFinal is the finishing place: the goal is met by placing at or above its number */
      if (d.id === 'ko') g.p = v > 0 && v <= g.n ? g.n : g.p;
      else g.p = d.best ? Math.max(g.p, v) : g.p + v;
      if (g.p >= g.n) {
        done.push({ text: this.text(g), reward: d.reward });
        prof.credits += d.reward;
        prof.goals.last = g.id;
        prof.goals.list.splice(prof.goals.list.indexOf(g), 1);
        prof.goalsDone = (prof.goalsDone || 0) + 1;
      }
    }
    this.ensure(prof);
    return done;
  },
  /* the menu panel */
  render(box) {
    if (!box) return;
    box.innerHTML = '';
    for (const g of this.ensure()) {
      const d = this.def(g),
        f = clamp(g.p / g.n, 0, 1);
      box.append(
        el('div', { class: 'goal' }, [
          el('div', { class: 'g-top' }, [el('span', { class: 'g-text', text: this.text(g) }), el('span', { class: 'g-reward', text: '+' + d.reward + ' CR' })]),
          el('div', { class: 'g-bar' }, [el('i', { style: `transform:scaleX(${f})` })]),
          el('div', { class: 'g-num', text: d.id === 'ko' ? 'Not yet' : `${fmtInt(Math.min(g.p, g.n))} / ${fmtInt(g.n)}` }),
        ])
      );
    }
  },
};
