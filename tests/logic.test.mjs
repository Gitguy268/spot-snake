// Headless check of the game logic and the AI player's move filter: node tests/logic.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const src = html.slice(html.indexOf('/* LOGIC-START'), html.indexOf('/* LOGIC-END */'));
const L = new Function(src + '; return { createGame, step, aiQuestion, buildSequence, d1Row, d1Readout, DIRS, COLS, ROWS };')();

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

// 4. Laya's sequence: markers sit on <mask>, it is bracketed by <bos>…<eos> and fits max_len.
const LAYA = { cls: 2, sep: 1, mask: 4, maxLen: 1024, headMax: 256 };
{
  const enc = (s) => Array.from(s, (c) => c.charCodeAt(0)); // one id per character
  const g = L.createGame(rng(3), 'normal');
  const q = L.aiQuestion(g), s = L.buildSequence(enc, q, LAYA);
  assert.equal(s.markers.length, q.options.length);
  s.markers.forEach((m) => assert.equal(s.ids[m], LAYA.mask));
  assert.equal(s.ids[0], LAYA.cls);
  assert.equal(s.ids[s.ids.length - 1], LAYA.sep);
  const long = L.buildSequence(enc, Object.assign({}, q, { state: 'x'.repeat(4000) }), LAYA);
  assert.equal(long.ids.length, LAYA.maxLen);
}

// 5 and 6. Golden rows: the JS builders give exactly the ids of each model's own Python
// pipeline. `pieces` holds the Python tokenizer's ids for every text the builders encode
// (tests/fixtures/make_fixtures.py), so no tokenizer is needed here.
const fixture = (name) => JSON.parse(readFileSync(new URL('fixtures/' + name, import.meta.url), 'utf8'));
const lookup = (pieces) => (s) => {
  assert.ok(s in pieces, 'no fixture ids for ' + JSON.stringify(s.slice(0, 60)));
  return pieces[s];
};
let golden = 0;
{
  const f = fixture('laya.json');
  const t = { cls: f.special.cls, sep: f.special.sep, mask: f.special.mask, maxLen: f.max_len, headMax: f.head_max_len };
  assert.deepEqual(t, LAYA);
  for (const r of f.rows) {
    const s = L.buildSequence(lookup(r.pieces), r, t);
    assert.deepEqual(s.ids, r.ids);
    assert.deepEqual(s.markers, r.markers);
    golden++;
  }
}
{
  const f = fixture('d1.json');
  for (const r of f.rows) {
    const enc = lookup(r.pieces), row = L.d1Row(enc, r);
    assert.deepEqual(row.ids, r.ids);
    assert.deepEqual(row.questionIds, r.question_ids);
    assert.deepEqual([row.slot], r.slot_positions);
    assert.deepEqual(L.d1Readout(enc, r.options.length), r.readout);
    golden++;
  }
}

console.log('logic ok: ' + offered + ' AI moves, none fatal; ' + golden + ' golden rows match Python');
