import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizarTexto } from './texto.js';

test('normalizarTexto saca tildes, mayúsculas y espacios de los bordes', () => {
  assert.equal(normalizarTexto('  Ángel Pérez '), 'angel perez');
  assert.equal(normalizarTexto('Perú'), 'peru');
});

test('normalizarTexto acepta null y undefined', () => {
  assert.equal(normalizarTexto(null), '');
  assert.equal(normalizarTexto(undefined), '');
});
