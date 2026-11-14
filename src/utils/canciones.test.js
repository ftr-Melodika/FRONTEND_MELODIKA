// Pruebas del catálogo de canciones. Ejecutar con: npm test
import test from 'node:test';
import assert from 'node:assert';
import { CANCIONES, FORMAS } from '../data/canciones.js';
import {
  acordesDeCancion, aprendizajeDeCancion, filtrarCanciones, formaDeAcorde, nivelDeCancion, objetivoDeAcorde, riffDeCancion, VELOCIDADES,
} from './canciones.js';
import { midiDePosicion } from './deteccionSonido.js';
import { armarRecorrido } from './riff.js';

test('cada canción del catálogo está completa y tiene la forma de todos sus acordes', () => {
  const ids = new Set();
  for (const c of CANCIONES) {
    assert.ok(!ids.has(c.id), `id repetido: ${c.id}`);
    ids.add(c.id);
    assert.ok(c.titulo && c.artista && c.consejo && c.rasgueo, c.id);
    assert.ok(c.bpm >= 40 && c.bpm <= 220, `${c.id}: tempo`);
    assert.ok(Number.isInteger(c.capo) && c.capo >= 0 && c.capo <= 7, `${c.id}: capo`);
    assert.ok(c.progresion.length > 0 && c.progresion.every((compas) => [1, 2].includes(compas.split(' ').length)), `${c.id}: progresión`);
    for (const acorde of acordesDeCancion(c)) assert.ok(formaDeAcorde(c, acorde), `${c.id}: no hay forma para ${acorde}`);
  }
});

// Las notas que lleva cada acorde según su cifrado, como distancias en semitonos desde la raíz
const NOTAS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const TIPOS = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], sus4: [0, 5, 7], '7sus4': [0, 5, 7, 10] };
function notasDelCifrado(nombre) {
  const [acorde, bajo] = nombre.split('/');
  const [, letra, alteracion, tipo] = /^([A-G])(#|b)?(.*)$/.exec(acorde);
  const raiz = (NOTAS[letra] + (alteracion === '#' ? 1 : alteracion === 'b' ? -1 : 0) + 12) % 12;
  return { raiz: bajo ? NOTAS[bajo] : raiz, clases: new Set(TIPOS[tipo].map((i) => (raiz + i) % 12)) };
}

test('cada forma suena como su nombre: las mismas notas y la raíz (o la del cifrado con /) en el bajo', () => {
  const formas = [...Object.entries(FORMAS), ...CANCIONES.flatMap((c) => Object.entries(c.formas || {}).map(([n, f]) => [`${n} (${c.id})`, f]))];
  for (const [nombre, posiciones] of formas) {
    const { raiz, clases } = notasDelCifrado(nombre.split(' ')[0]);
    const midis = posiciones.map((pos) => midiDePosicion(pos.cuerda, pos.traste));
    assert.deepStrictEqual(new Set(midis.map((m) => m % 12)), clases, `${nombre}: suena distinto a su nombre`);
    assert.strictEqual(Math.min(...midis) % 12, raiz, `${nombre}: el bajo no es la raíz`);
    assert.ok(posiciones.every((pos) => pos.traste === 0 || pos.dedo), `${nombre}: falta un dedo`);
  }
});

test('nivel: fácil si solo usa los acordes del curso de acordes', () => {
  assert.strictEqual(nivelDeCancion(CANCIONES.find((c) => c.id === 'riptide')), 'Fácil');
  assert.strictEqual(nivelDeCancion(CANCIONES.find((c) => c.id === 'lamento-boliviano')), 'Intermedia');
});

test('con capo, el detector espera las notas que suenan de verdad', () => {
  const wonderwall = CANCIONES.find((c) => c.id === 'wonderwall');
  const em7 = objetivoDeAcorde(wonderwall, 'Em7');
  assert.strictEqual(em7.midis[0], 40 + 2); // Mi grave con capo 2 = Fa#
  assert.deepStrictEqual(em7.posiciones, formaDeAcorde(wonderwall, 'Em7')); // la forma no cambia
  // Wonderwall usa su propio G (dedos 3 y 4 en las cuerdas 2 y 1)
  assert.deepStrictEqual(objetivoDeAcorde(wonderwall, 'G').posiciones.find((pos) => pos.cuerda === 2), { cuerda: 2, traste: 3, dedo: 3 });
});

test('aprender: cada acorde cuerda por cuerda y después entero; los cambios sin repetir', () => {
  const lamento = CANCIONES.find((c) => c.id === 'lamento-boliviano');
  const { acordes, cambios } = aprendizajeDeCancion(lamento);
  // Em (6 cuerdas + acorde) + Bm (5 + 1) + Am (5 + 1) + B7 (5 + 1)
  assert.strictEqual(acordes.length, 7 + 6 + 6 + 6);
  assert.deepStrictEqual(acordes.slice(0, 7).map((o) => o.tipo), ['nota', 'nota', 'nota', 'nota', 'nota', 'nota', 'acorde']);
  assert.strictEqual(acordes[0].posiciones[0].cuerda, 6); // de la más grave a la más aguda
  // Em→Bm, Bm→Am, Am→Em, Em→B7, B7→Em (vuelta al principio, ya contado como Em↔B7)
  const pares = [];
  for (let i = 0; i < cambios.length; i += 5) pares.push(`${cambios[i].nombre}-${cambios[i + 1].nombre}`);
  assert.deepStrictEqual(pares, ['Em-Bm', 'Bm-Am', 'Am-Em', 'Em-B7']);
});

test('tocarla: un acorde por compás, o dos si el compás tiene dos', () => {
  const ligera = CANCIONES.find((c) => c.id === 'de-musica-ligera');
  const riff = riffDeCancion(ligera);
  assert.deepStrictEqual(riff.notas.map((n) => [n.nombre, n.pulsos]), [['Em', 2], ['C', 2], ['G', 2], ['D', 2]]);
  assert.strictEqual(riff.notas[1].t, 2 * (60000 / 126));
  // Re se toca de la cuerda 4 a la 1
  assert.deepStrictEqual([riff.notas[3].cuerdaGrave, riff.notas[3].cuerdaAguda], [4, 1]);
  // Se repite hasta unos 16 compases
  assert.strictEqual(armarRecorrido(riff).notas.length, 4 * 8);
});

test('tocarla más lento', () => {
  const flaca = CANCIONES.find((c) => c.id === 'flaca');
  assert.strictEqual(riffDeCancion(flaca, VELOCIDADES.lenta).bpm, Math.round(70 * 0.7));
});

test('búsqueda y filtro por nivel', () => {
  assert.deepStrictEqual(filtrarCanciones(CANCIONES, 'soda').map((c) => c.id), ['de-musica-ligera']);
  assert.deepStrictEqual(filtrarCanciones(CANCIONES, 'música ligera').map((c) => c.id), ['de-musica-ligera']);
  assert.deepStrictEqual(filtrarCanciones(CANCIONES, 'calamaro').map((c) => c.id), ['flaca']);
  assert.ok(filtrarCanciones(CANCIONES, '', 'Fácil').every((c) => nivelDeCancion(c) === 'Fácil'));
});
