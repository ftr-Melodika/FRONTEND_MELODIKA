import { test } from 'node:test';
import assert from 'node:assert';
import { usaVistaInmersiva } from './vistaInmersiva.js';

test('usaVistaInmersiva: las prácticas con mástil, riffs y canciones son inmersivas', () => {
  assert.strictEqual(usaVistaInmersiva({ practica: { tipo: 'secuencia', pasos: [] } }), true);
  assert.strictEqual(usaVistaInmersiva({ practica: { tipo: 'cancion', fase: 'tocar' } }), true);
  assert.strictEqual(usaVistaInmersiva({ practica: { tipo: 'notasAlAzar' } }), true);
  assert.strictEqual(usaVistaInmersiva({ trasteObjetivo: 3 }), true);
});

test('usaVistaInmersiva: quiz, afinación y ritmo necesitan sus controles', () => {
  assert.strictEqual(usaVistaInmersiva({ practica: { tipo: 'quiz' } }), false);
  assert.strictEqual(usaVistaInmersiva({ practica: { tipo: 'afinacion' } }), false);
  assert.strictEqual(usaVistaInmersiva({ practica: { tipo: 'ritmo' } }), false);
});

test('usaVistaInmersiva: varias consignas son inmersivas si ninguna necesita controles', () => {
  const consignas = (...tipos) => ({ practica: { tipo: 'consignas', consignas: tipos.map((tipo) => ({ tipo })) } });
  assert.strictEqual(usaVistaInmersiva(consignas('secuencia', 'secuencia')), true);
  assert.strictEqual(usaVistaInmersiva(consignas('secuencia', 'ritmo')), false);
});

test('usaVistaInmersiva: datos raros no rompen', () => {
  assert.strictEqual(usaVistaInmersiva(undefined), true);
  assert.strictEqual(usaVistaInmersiva({ practica: null }), true);
  assert.strictEqual(usaVistaInmersiva({ practica: { tipo: 'consignas', consignas: 'x' } }), true);
});
