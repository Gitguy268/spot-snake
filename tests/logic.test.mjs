// Headless check of the game logic and the AI player's move filter: node tests/logic.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const src = html.slice(html.indexOf('/* LOGIC-START'), html.indexOf('/* LOGIC-END */'));
const L = new Function(src + '; return { createGame, step, aiQuestion, buildSequence, DIRS, COLS, ROWS };')();

// Seeded random, so a failure can be replayed.
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

// 1. Pinned in a corner with the tail behind: only one move is safe.
{
  const g = L.createGame(rng(1), 'normal');
  g.snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }];
  g.dir = L.DIRS.left;
  g.food = { x: 10, y: 10 };
  assert.deepEqual(L.aiQuestion(g).moves, ['down']);
}

// 2. The tail cell is free when Spot isn't growing, as in step().
{
  const g = L.createGame(rng(2), 'normal');
  g.snake = [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }];
  g.dir = L.DIRS.left; // came from (6,5)
  g.food = { x: 15, y: 15 };
  assert.ok(L.aiQuestion(g).moves.includes('down'), 'stepping into the leaving tail is safe');
}

// 3. Thousands of random games: a move the AI is offered never crashes Spot.
let offered = 0;
for (let seed = 1; seed <= 300; seed++) {
  const r = rng(seed), g = L.createGame(r, 'normal');
  for (let t = 0; t < 400 && !g.over; t++) {
    const q = L.aiQuestion(g);
    if (!q.moves.length) break; // boxed in: nothing to offer
    assert.equal(q.options.length, q.moves.length);
    const before = JSON.stringify(g);
    g.dir = L.DIRS[q.moves[Math.floor(r() * q.moves.length)]];
    const result = L.step(g, r);
    assert.notEqual(result, 'over', 'offered move crashed: ' + before);
    offered++;
  }
}

// 4. Laya's sequence: markers sit on [MASK], it is bracketed by [CLS]…[SEP] and fits 512.
{
  const enc = (s) => Array.from(s, (c) => c.charCodeAt(0)); // one id per character
  const g = L.createGame(rng(3), 'normal');
  const q = L.aiQuestion(g), s = L.buildSequence(enc, q);
  assert.equal(s.markers.length, q.options.length);
  s.markers.forEach((m) => assert.equal(s.ids[m], 50284));
  assert.equal(s.ids[0], 50281);
  assert.equal(s.ids[s.ids.length - 1], 50282);
  const long = L.buildSequence(enc, Object.assign({}, q, { state: 'x'.repeat(2000) }));
  assert.equal(long.ids.length, 512);
}

console.log('logic ok: ' + offered + ' AI moves, none fatal');
