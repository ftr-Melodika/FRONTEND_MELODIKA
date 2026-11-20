import { test } from 'node:test';
import assert from 'node:assert';
import { ordenarAmigos, filtrarAmigos, alternarSeleccion } from './amigos.js';

const amigo = (id, nombre, username) => ({ amistadId: `a${id}`, perfil: { id, nombre, username } });
const AMIGOS = [
  amigo('1', 'Zoe', 'zoe_g'),
  amigo('2', 'Ángel', 'angel99'),
  amigo('3', 'beto', 'betoguitar'),
  amigo('4', 'Álvaro', 'alva'),
];

test('ordenarAmigos: A-Z sin distinguir mayúsculas ni tildes, sin mutar el original', () => {
  const nombres = ordenarAmigos(AMIGOS).map((a) => a.perfil.nombre);
  assert.deepStrictEqual(nombres, ['Álvaro', 'Ángel', 'beto', 'Zoe']);
  assert.strictEqual(AMIGOS[0].perfil.nombre, 'Zoe');
});

test('ordenarAmigos: tolera listas vacías o nulas', () => {
  assert.deepStrictEqual(ordenarAmigos([]), []);
  assert.deepStrictEqual(ordenarAmigos(null), []);
});

test('filtrarAmigos: sin texto devuelve todos', () => {
  assert.strictEqual(filtrarAmigos(AMIGOS, '').length, 4);
  assert.strictEqual(filtrarAmigos(AMIGOS, '   ').length, 4);
});

test('filtrarAmigos: por nombre sin tildes ni mayúsculas', () => {
  assert.deepStrictEqual(filtrarAmigos(AMIGOS, 'angel').map((a) => a.perfil.id), ['2']);
  assert.deepStrictEqual(filtrarAmigos(AMIGOS, 'ÁL').map((a) => a.perfil.id), ['4']);
});

test('filtrarAmigos: por username, con o sin @', () => {
  assert.deepStrictEqual(filtrarAmigos(AMIGOS, 'guitar').map((a) => a.perfil.id), ['3']);
  assert.deepStrictEqual(filtrarAmigos(AMIGOS, '@zoe_g').map((a) => a.perfil.id), ['1']);
});

test('filtrarAmigos: sin coincidencias devuelve lista vacía', () => {
  assert.deepStrictEqual(filtrarAmigos(AMIGOS, 'xyz'), []);
});

test('alternarSeleccion: agrega, quita y no muta; la selección sobrevive a cualquier filtro', () => {
  const inicial = new Set(['1']);
  const conDos = alternarSeleccion(inicial, '2');
  assert.deepStrictEqual([...conDos], ['1', '2']);
  assert.deepStrictEqual([...inicial], ['1']);
  assert.deepStrictEqual([...alternarSeleccion(conDos, '1')], ['2']);
  // El filtro no toca el conjunto: 1 sigue marcado aunque no se vea en la lista filtrada
  filtrarAmigos(AMIGOS, 'angel');
  assert.ok(conDos.has('1'));
});
