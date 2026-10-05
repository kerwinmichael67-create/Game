// Bot strength and speed checks: each bot against a random/idle opponent, plus think time.
const assert = require('assert');
global.window = global;
global.Rules = require('../shared/rules');
global.Realtime = require('../realtime');
global.GameDock = {};
require('../public/bots.js');
const { TURN_BOTS, snakeBot, pongBot, fighterBot, tronBot, hockeyBot } = window.BotPlay._ai;
const L = window.BotPlay.LEVELS;
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function playTurn(game, level, games = 6) {
  let wins = 0, losses = 0, draws = 0, slowest = 0;
  for (let n = 0; n < games; n++) {
    let s = Rules[game].init(), plies = 0;
    while (!s.result && plies++ < 300) {
      let mv;
      if (s.turn === 1) {
        const t = Date.now();
        mv = TURN_BOTS[game](s, 1, L[level], level);
        slowest = Math.max(slowest, Date.now() - t);
      } else mv = pick(Rules[game].legal(s));
      if (game === 'connect4' && mv.col === undefined) mv = { col: mv.col };
      const r = Rules[game].move(s, s.turn, mv);
      assert(!r.error, `${game} bot made an illegal move: ${r.error}`);
      s = r.state;
    }
    if (!s.result) draws++;
    else if (s.result.winner === 1) wins++; else if (s.result.winner === 0) losses++; else draws++;
  }
  return { wins, losses, draws, slowest };
}
for (const game of ['tictactoe', 'connect4', 'checkers', 'chess', 'reversi', 'dots', 'mancala', 'gomoku']) {
  for (const level of ['easy', 'hard']) {
    const r = playTurn(game, level, game === 'chess' && level === 'hard' ? 3 : 6);
    console.log(`${game.padEnd(10)} ${level.padEnd(6)} vs random: ${r.wins}W ${r.losses}L ${r.draws}D, slowest move ${r.slowest} ms`);
    if (level === 'hard') assert(game === 'tictactoe' ? r.losses === 0 : r.losses <= 1 && r.wins > r.losses * 2, `${game} hard bot lost to random moves`);
  }
}
// perfect tic-tac-toe never loses, even to itself
{
  let s = Rules.tictactoe.init();
  while (!s.result) s = Rules.tictactoe.move(s, s.turn, TURN_BOTS.tictactoe(s, s.turn, L.hard, 'hard')).state;
  assert.strictEqual(s.result.winner, -1);
}

function playReal(game, level, idleInput) {
  const sim = Realtime[game], s = sim.init(), bot = { snake: snakeBot, pong: pongBot, fighter: fighterBot, tron: tronBot, hockey: hockeyBot }[game](level);
  let res = null;
  for (let i = 0; i < 40000 && !res; i++) {
    const inp = bot(s, 1);
    if (inp) sim.input(s, 1, game === 'snake' || game === 'tron' ? { dir: inp } : inp);
    if (idleInput) sim.input(s, 0, idleInput(s, i));
    res = sim.tick(s);
  }
  return res;
}
const snake = playReal('snake', 'hard', (s, i) => ({ dir: ['U', 'R', 'D', 'L'][Math.floor(i / 7) % 4] }));
console.log('snake      hard   vs circling player:', snake.winner === 1 ? 'bot won' : snake.winner === -1 ? 'draw' : 'bot lost', `(${snake.reason})`);
assert.strictEqual(snake.winner, 1);
const pong = playReal('pong', 'hard', null);
console.log('pong       hard   vs idle player:', pong.winner === 1 ? 'bot won' : 'bot lost', `(${pong.reason})`);
assert.strictEqual(pong.winner, 1);
const fight = playReal('fighter', 'medium', null);
console.log('fighter    medium vs idle player:', fight.winner === 1 ? 'bot won' : 'bot lost', `(${fight.reason})`);
assert.strictEqual(fight.winner, 1);
const tron = playReal('tron', 'medium', (s, i) => ({ dir: ['U', 'R', 'D', 'L'][Math.floor(i / 9) % 4] }));
console.log('tron       medium vs spiralling player:', tron.winner === 1 ? 'bot won' : 'bot lost', `(${tron.reason})`);
assert.strictEqual(tron.winner, 1);
const hockey = playReal('hockey', 'medium', null);
console.log('hockey     medium vs idle player:', hockey.winner === 1 ? 'bot won' : 'bot lost', `(${hockey.reason})`);
assert.strictEqual(hockey.winner, 1);
console.log('✓ bots');
