// Pruebas del catálogo de canciones. Ejecutar con: npm test
import test from 'node:test';
import assert from 'node:assert';
import { CANCIONES, RASGUEOS } from '../data/canciones.js';
import { FORMAS_ACORDES, objetivoDeAcorde } from './acordes.js';
import { acordesDeCancion, filtrarCanciones, nivelDeCancion, secuenciaDeCancion } from './canciones.js';
import { nombreDeMidi } from './deteccionSonido.js';

test('cada canción del catálogo está completa y usa acordes que la app sabe dibujar', () => {
  const ids = new Set();
  for (const c of CANCIONES) {
    assert.ok(!ids.has(c.id), `id repetido: ${c.id}`);
    ids.add(c.id);
    assert.ok(c.titulo && c.artista && c.consejo && c.tonalidad, c.id);
    assert.ok(c.bpm >= 40 && c.bpm <= 220, `${c.id}: tempo`);
    assert.ok(Number.isInteger(c.capo) && c.capo >= 0 && c.capo <= 7, `${c.id}: capo`);
    assert.ok(RASGUEOS[c.rasgueo], `${c.id}: rasgueo ${c.rasgueo}`);
    assert.ok(c.pulsosPorCompas >= 2, `${c.id}: pulsos`);
    assert.ok(c.secciones.length > 0 && c.secciones.every((s) => s.nombre && s.compases.length > 0), `${c.id}: secciones`);
    for (const acorde of acordesDeCancion(c)) assert.ok(FORMAS_ACORDES[acorde], `${c.id}: no hay forma para ${acorde}`);
  }
});

test('los rasgueos tienen un golpe por cada parte de la cuenta', () => {
  for (const [id, r] of Object.entries(RASGUEOS)) {
    assert.strictEqual(r.cuenta.length, r.golpes.length, id);
    assert.ok(r.golpes.every((g) => ['↓', '↑', ''].includes(g)), id);
  }
});

test('las formas del diccionario suenan como su nombre', () => {
  const esperadas = {
    La: 'Do# La Mi', Rem: 'Fa La Re', Mi7: 'Mi Re Si Sol#', La7: 'Do# La Mi Sol', Re7: 'Do Fa# La Re', Sol7: 'Fa Re Si Sol', Fa: 'Do Fa La',
  };
  for (const [nombre, notas] of Object.entries(esperadas)) {
    const suena = [...new Set(objetivoDeAcorde(nombre).midis.map(nombreDeMidi))].sort().join(' ');
    assert.strictEqual(suena, notas.split(' ').sort().join(' '), nombre);
  }
});

test('la secuencia para practicar no repite el mismo acorde seguido', () => {
  for (const c of CANCIONES) {
    const pasos = secuenciaDeCancion(c);
    assert.ok(pasos.length >= 3, c.id);
    pasos.slice(1).forEach((paso, i) => assert.notStrictEqual(paso.nombre, pasos[i].nombre, c.id));
  }
  const ks = CANCIONES.find((c) => c.id === 'knockin-on-heavens-door');
  assert.deepStrictEqual(secuenciaDeCancion(ks).map((p) => p.nombre), ['Sol', 'Re', 'Lam', 'Sol', 'Re', 'Do', 'Sol', 'Re', 'Lam', 'Sol', 'Re', 'Do']);
});

test('con capo, el detector espera las notas que suenan de verdad', () => {
  const despacito = CANCIONES.find((c) => c.id === 'despacito');
  const [sinCapo] = secuenciaDeCancion(despacito, false);
  const [conCapo] = secuenciaDeCancion(despacito, true);
  // Forma de La menor con capo 2: suena Si menor
  assert.deepStrictEqual(conCapo.posiciones, sinCapo.posiciones);
  assert.deepStrictEqual([...new Set(conCapo.midis.map(nombreDeMidi))].sort(), ['Fa#', 'Re', 'Si']);
});

test('nivel y búsqueda', () => {
  const zombie = CANCIONES.find((c) => c.id === 'zombie');
  const imagine = CANCIONES.find((c) => c.id === 'imagine');
  assert.strictEqual(nivelDeCancion(zombie), 'Fácil');
  assert.strictEqual(nivelDeCancion(imagine), 'Intermedia');
  assert.deepStrictEqual(filtrarCanciones(CANCIONES, 'beatles').map((c) => c.id), ['let-it-be']);
  assert.deepStrictEqual(filtrarCanciones(CANCIONES, 'DESPACITO').map((c) => c.id), ['despacito']);
  assert.ok(filtrarCanciones(CANCIONES, '', 'Fácil').every((c) => nivelDeCancion(c) === 'Fácil'));
});
