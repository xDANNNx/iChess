import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';

test('starts in standard position with 20 legal moves', () => {
  const game = new Chess();
  assert.equal(game.turn(), 'w');
  assert.equal(game.moves().length, 20);
  assert.equal(game.fen(), 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
});
test('accepts legal moves and rejects illegal moves', () => {
  const game = new Chess();
  assert.equal(game.move('e4').san, 'e4');
  assert.throws(() => game.move('Ke7'));
  assert.equal(game.turn(), 'b');
});
test('supports undo and PGN export', () => {
  const game = new Chess();
  game.move('e4'); game.move('e5'); game.move('Nf3');
  assert.match(game.pgn(), /1\. e4 e5 2\. Nf3/);
  assert.equal(game.undo().san, 'Nf3');
  assert.equal(game.history().length, 2);
});
test('detects checkmate and terminal state', () => {
  const game = new Chess();
  for (const move of ['f3', 'e5', 'g4', 'Qh4#']) game.move(move);
  assert.equal(game.isCheckmate(), true);
  assert.equal(game.isGameOver(), true);
});
