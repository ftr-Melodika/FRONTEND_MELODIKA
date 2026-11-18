import { test } from 'node:test';
import assert from 'node:assert';
import { PAISES, filtrarPaises } from './paises.js';

// La misma validación que hace el backend al guardar el perfil
const FORMATO_BACKEND = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;

test('todos los países pasan la validación del backend y no se repiten', () => {
  for (const pais of PAISES) assert.ok(FORMATO_BACKEND.test(pais), pais);
  assert.strictEqual(new Set(PAISES).size, PAISES.length);
  assert.ok(PAISES.length >= 195);
});

test('filtrarPaises: sin texto, todos', () => {
  assert.strictEqual(filtrarPaises('').length, PAISES.length);
});

test('filtrarPaises: sin importar tildes ni mayúsculas', () => {
  assert.deepStrictEqual(filtrarPaises('peru'), ['Perú']);
  assert.ok(filtrarPaises('MEXI').includes('México'));
});

test('filtrarPaises: primero los que empiezan con lo buscado', () => {
  const ar = filtrarPaises('ar');
  assert.strictEqual(ar[0], 'Arabia Saudita');
  assert.ok(ar.includes('Argentina'));
  assert.ok(ar.indexOf('Argentina') < ar.indexOf('Catar'));
  assert.ok(filtrarPaises('unidos').includes('Estados Unidos'));
});
