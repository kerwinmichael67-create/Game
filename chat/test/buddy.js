// Buddy (the AI helper's built-in brain): answers that don't need Claude.
const assert = require('assert');
global.window = global;
require('../public/games/trivia-q.js');
const Buddy = require('../public/buddy.js');
const now = new Date(2026, 9, 17, 15, 30); // a Saturday
let mem = {};
const say = (q) => Buddy.reply(q, mem, { name: 'Sam', now });
const has = (q, ...want) => {
  const r = say(q);
  for (const w of want) assert(w instanceof RegExp ? w.test(r.text) : r.text.includes(w), `"${q}" → expected ${w}, got:\n${r.text}`);
  assert(!r.fallback, `"${q}" fell through to "I don't know"`);
  return r;
};

// maths
has('what is 15% of 240?', '**36**');
has("what's seven times eight", '**56**');
has('1/2 + 1/3', '5/6');
has('7 divided by 2', '**3.5**');
has('0.1 + 0.2', '**0.3**');
has('2^10', '1,024');
has('10 / 0', 'undefined');
has('2x + 3 = 11', '**x = 4**');
has('solve 3(y - 2) = 12', '**y = 6**');
has('x^2 - 5x + 6 = 0', '**x = 3**', '**x = 2**');
has('is 91 prime', '7 × 13');
has('is 97 prime', 'Yes');
has('prime factors of 84', '2 × 2 × 3 × 7');
has('gcd of 12 and 18', '**6**');
has('lcm of 4 and 6', '**12**');
has('7 times table', '12 × 7 = 84');
has('average of 3, 5, 10', 'Mean (average):** 6');
has('round 3.14159 to 2 decimal places', '**3.14**');
has('2026 in roman numerals', 'MMXXVI');
has('area of a circle with radius 4', '50.27');
has('20% off 50', '**40**');
has('what percent is 15 of 60', '**25%**');
// units
has('convert 5 miles to km', '8.0467 kilometers');
has('100 f to c', '37.78°C');
has('how many feet in a mile', '5,280 feet');
has('how many ounces in a cup', '8 fluid ounces');
// dates
has('how many days until christmas', 'Friday, December 25, 2026', '**69 days**');
has('what day is july 4 2027', 'Sunday');
has('is 2028 a leap year', 'Yes');
has('how many days in february', '28 days');
// words
has("how many r's in strawberry", '**3**');
has('another word for happy', 'joyful');
has('opposite of hot', '**cold**');
has('what rhymes with cat', 'hat');
has('how do you spell recieve', '**receive**');
has('define curious', 'eager to know');
has('is racecar a palindrome', 'Yes');
// Game Chat and its games
has('Teach me a good chess opening', 'Italian Game');
has('how do I rebirth in the speed game', 'rebirth');
has('how do i make a poll', '📊');
has('what is bloxverse', 'Roblox-style');
has('how do I trade with someone in bloxverse', 'Trading in Bloxverse', 'Accept');
has('fishing tycoon tips', 'Fishing Tycoon tips');
has('how do I catch fish in the fishing game', 'Fishing tips');
has('how do I deliver pizza', 'Pizza Place tips');
has('how do I ride the roller coaster', 'Theme Park Tycoon tips');
has('mining tycoon pickaxe', 'Mining Tycoon tips');
has('how do I test drive in car factory', 'Car Factory Tycoon tips');
has('cube factory tycoon rebirth', 'Cube Factory Tycoon tips');
has('how do I fix generators in forsaken', 'Forsaken tips');
has('how do I become the killer', 'malice');
has('why is the sky blue', 'scatter');
has('capital of france', 'Paris');
has('I want to know how photosynthesis works because I have a test', 'sunlight');
// memory
has('my name is Alex', 'Alex');
has("what's my name", 'Alex');
has('my favorite color is green', 'green');
has('my birthday is march 14', '148 days');
has('what do you remember about me', 'Alex', 'March 14', 'green');
has('forget everything', 'forgotten');
assert(!mem.name && !mem.bday);
// games in the chat
let r = has('quiz me with 2 trivia questions', 'Question 1 of 2');
const right = (g) => { const q = window.TRIVIA_Q[g.order[g.i]]; return 'ABCD'[g.opts.indexOf(q[1])]; };
has(right(mem.game), 'Question 2 of 2');
has('tell me a joke', '😄'); // a joke mid-quiz doesn't end it
assert.strictEqual(mem.game.type, 'quiz');
r = has(right(mem.game), 'You got 2 out of 2');
assert.strictEqual(mem.game, null);
has('guess the number', 'thinking of a number');
const n = mem.game.n;
has(n > 1 ? '1' : '2', n > 1 ? 'Higher' : 'Lower');
has(String(n), `It was ${n}`);
has('lets play hangman', 'Hangman');
const word = mem.game.w;
for (const ch of new Set(word)) r = say(ch);
assert(/You win/.test(r.text), r.text);
has('tell me a riddle', 'Riddle');
has('inspire me', '—'); // not taken as a guess
assert.strictEqual(mem.game.type, 'riddle');
has('i give up', 'The answer is');
has('rock paper scissors', 'Pick one');
has('rock', 'You: 🪨');
has('stop', 'stopped');
has('tell me a joke about dinosaurs', 'dino');
has('another one', '😄');
// safety
r = say('i want to die');
assert(/988/.test(r.text) && /trust/.test(r.text) && !r.offerClaude);
assert(/block/i.test(say('I am being bullied').text));
say('my password is hunter2');
assert(!JSON.stringify(mem).includes('hunter2'));
// what Buddy doesn't know: offer Claude
r = say('who won the world cup in 2022?');
assert(r.fallback && r.offerClaude && /Claude/.test(r.text));
// fast enough to feel instant
let t = Date.now();
for (let i = 0; i < 200; i++) Buddy.reply('how do i play tower of hell and what is 12 x 12', {}, { now });
assert(Date.now() - t < 2000, 'Buddy is slow: ' + (Date.now() - t) + ' ms for 200 replies');
console.log('✓ buddy');
