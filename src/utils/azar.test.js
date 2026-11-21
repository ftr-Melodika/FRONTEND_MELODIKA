import test from 'node:test';
import assert from 'node:assert/strict';
import { azarPorDefecto, mezclar } from './azar.js';

test('azarPorDefecto devuelve un entero entre 0 y el máximo - 1', () => {
  for (let i = 0; i < 50; i++) {
    const n = azarPorDefecto(5);
    assert.ok(Number.isInteger(n) && n >= 0 && n < 5);
  }
});

test('mezclar no toca la lista original y conserva los elementos', () => {
  const original = [1, 2, 3, 4, 5];
  const mezclada = mezclar(original);
  assert.deepEqual(original, [1, 2, 3, 4, 5]);
  assert.deepEqual([...mezclada].sort(), [1, 2, 3, 4, 5]);
});

test('mezclar usa el azar recibido', () => {
  assert.deepEqual(mezclar([1, 2, 3], () => 0), [2, 3, 1]);
});
