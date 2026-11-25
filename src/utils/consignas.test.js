import { test } from 'node:test';
import assert from 'node:assert';
import { obtenerConsignas, armarNotasAlAzar, resolverNotasAlAzar } from './consignas.js';

const nota = { tipo: 'nota', posiciones: [{ cuerda: 1, traste: 3, dedo: 3 }] };
const clase = (practica) => ({ id: 7, titulo: 'Clase', practica });

test('obtenerConsignas: cada consigna es una clase con su práctica y su instrucción', () => {
  const lista = obtenerConsignas(clase({
    tipo: 'consignas',
    consignas: [{ ...nota, instruccion: '  Tocá el Sol  ' }, { tipo: 'cancion', cancionId: 'x', fase: 'tocar' }],
  }));
  assert.strictEqual(lista.length, 2);
  assert.strictEqual(lista[0].id, 7);
  assert.strictEqual(lista[0].instruccion, 'Tocá el Sol');
  assert.deepStrictEqual(lista[0].practica, nota);
  assert.strictEqual(lista[1].instruccion, null);
});

test('obtenerConsignas: descarta lo inválido y no admite consignas anidadas', () => {
  assert.strictEqual(obtenerConsignas(clase(nota)), null);
  assert.strictEqual(obtenerConsignas(clase({ tipo: 'consignas', consignas: [] })), null);
  assert.strictEqual(obtenerConsignas(clase({ tipo: 'consignas' })), null);
  const lista = obtenerConsignas(clase({ tipo: 'consignas', consignas: [null, 5, { instruccion: 'sin tipo' }, { tipo: 'consignas', consignas: [nota] }, nota] }));
  assert.strictEqual(lista.length, 1);
});

// Azar fijo: siempre elige el primero / no mezcla
const SIN_AZAR = () => 0;

test('armarNotasAlAzar: cantidad, cuerdas, trastes y dedo', () => {
  const practica = { tipo: 'notasAlAzar', cantidad: 8, cuerdas: [1, 2, 3], trastes: [1, 2, 3, 4], dedo: 1, vecesPorTraste: 2 };
  const secuencia = armarNotasAlAzar(practica);
  assert.strictEqual(secuencia.tipo, 'secuencia');
  assert.strictEqual(secuencia.pasos.length, 8);
  const posiciones = secuencia.pasos.map((p) => p.posiciones[0]);
  for (const pos of posiciones) {
    assert.ok([1, 2, 3].includes(pos.cuerda));
    assert.strictEqual(pos.dedo, 1);
  }
  // 4 trastes x 2 veces = 8: cada traste sale exactamente dos veces
  for (const traste of [1, 2, 3, 4]) assert.strictEqual(posiciones.filter((p) => p.traste === traste).length, 2);
});

test('armarNotasAlAzar: dedoPorTraste usa el número del traste', () => {
  const secuencia = armarNotasAlAzar({ tipo: 'notasAlAzar', cantidad: 6, cuerdas: [1, 2], trastes: [1, 2, 3], dedoPorTraste: true });
  for (const { posiciones: [pos] } of secuencia.pasos) assert.strictEqual(pos.dedo, pos.traste);
});

test('armarNotasAlAzar: nunca repite la misma posición dos veces seguidas', () => {
  for (let i = 0; i < 50; i++) {
    const { pasos } = armarNotasAlAzar({ tipo: 'notasAlAzar', cantidad: 10, cuerdas: [1, 2], trastes: [1], vecesPorTraste: 10 });
    for (let j = 1; j < pasos.length; j++) {
      assert.notDeepStrictEqual(pasos[j].posiciones[0], pasos[j - 1].posiciones[0]);
    }
  }
});

test('armarNotasAlAzar: con una sola cuerda y traste no se cuelga', () => {
  const { pasos } = armarNotasAlAzar({ tipo: 'notasAlAzar', cantidad: 3, cuerdas: [2], trastes: [1] }, SIN_AZAR);
  assert.strictEqual(pasos.length, 3);
});

test('armarNotasAlAzar: formato inválido da null', () => {
  const ok = { tipo: 'notasAlAzar', cantidad: 4, cuerdas: [1], trastes: [1] };
  assert.ok(armarNotasAlAzar(ok));
  assert.strictEqual(armarNotasAlAzar({ ...ok, tipo: 'nota' }), null);
  assert.strictEqual(armarNotasAlAzar({ ...ok, cuerdas: [9] }), null);
  assert.strictEqual(armarNotasAlAzar({ ...ok, trastes: [] }), null);
  assert.strictEqual(armarNotasAlAzar({ ...ok, cantidad: 0 }), null);
  assert.strictEqual(armarNotasAlAzar({ ...ok, cantidad: 999 }), null);
  assert.strictEqual(armarNotasAlAzar(null), null);
});

test('resolverNotasAlAzar: reemplaza la práctica y deja lo demás; si no aplica, devuelve la misma clase', () => {
  const resuelta = resolverNotasAlAzar(clase({ tipo: 'notasAlAzar', cantidad: 2, cuerdas: [1], trastes: [2, 3] }));
  assert.strictEqual(resuelta.id, 7);
  assert.strictEqual(resuelta.practica.tipo, 'secuencia');
  const comun = clase(nota);
  assert.strictEqual(resolverNotasAlAzar(comun), comun);
});

// Clase de acordes: la consigna 1 toca el Re cuerda por cuerda (sin acorde) y la 2 lo toca entero
const paso = (cuerda, traste, nombre) => ({ tipo: 'nota', nombre, posiciones: [{ cuerda, traste }] });
const RE = [{ cuerda: 4, traste: 0 }, { cuerda: 3, traste: 2 }, { cuerda: 2, traste: 3 }, { cuerda: 1, traste: 2 }];
const claseDeAcorde = (primera) => clase({
  tipo: 'consignas',
  consignas: [
    { tipo: 'secuencia', pasos: primera, instruccion: 'Armá el Re' },
    { tipo: 'secuencia', pasos: [{ tipo: 'acorde', nombre: 'Re', posiciones: RE }] },
  ],
});

test('obtenerConsignas: las notas cuerda por cuerda traen la forma del acorde que viene después', () => {
  const lista = obtenerConsignas(claseDeAcorde([paso(4, 0, 'Re'), paso(3, 2, 'La'), paso(2, 3, 'Re'), paso(1, 2, 'Fa#')]));
  lista[0].practica.pasos.forEach((p) => {
    assert.deepStrictEqual(p.formaAcorde, RE);
    assert.strictEqual(p.nombreAcorde, 'Re');
  });
  // La consigna del acorde entero queda igual
  assert.strictEqual(lista[1].practica.pasos[0].formaAcorde, undefined);
});

test('obtenerConsignas: si una nota no es del acorde, no se le agrega ninguna forma', () => {
  const lista = obtenerConsignas(claseDeAcorde([paso(4, 0, 'Re'), paso(5, 3, 'Do')]));
  assert.strictEqual(lista[0].practica.pasos[0].formaAcorde, undefined);
});

test('obtenerConsignas: sin acorde en ninguna consigna, queda como estaba', () => {
  const lista = obtenerConsignas(clase({ tipo: 'consignas', consignas: [{ tipo: 'secuencia', pasos: [paso(4, 0, 'Re')] }] }));
  assert.strictEqual(lista[0].practica.pasos[0].formaAcorde, undefined);
});
