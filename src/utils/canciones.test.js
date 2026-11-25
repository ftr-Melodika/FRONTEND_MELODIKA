// Pruebas del catálogo de canciones. Ejecutar con: npm test
import test from 'node:test';
import assert from 'node:assert';
import { FORMAS } from '../data/canciones.js';
import { CANCIONES } from './canciones.fixture.js';
import {
  acordesDeCancion, aprendizajeDeCancion, filtrarCanciones, formaDeAcorde, golpesDeRasgueo, nivelDeCancion, objetivoDeAcorde, partesDeCompas, cuentaDeRasgueo,
  rasgueosDeCancion, riffDeCancion, textoDeRasgueo, VELOCIDADES, generosDeCanciones, columnasDeCanciones,
  seccionesDeCanciones, estrellasDeResultado, estrellasPorCancion,
} from './canciones.js';
import { midiDePosicion } from './deteccionSonido.js';
import { armarRecorrido } from './riff.js';

test('las canciones de ejemplo tienen el formato del backend y la forma de todos sus acordes', () => {
  for (const c of CANCIONES) {
    assert.ok(c.progresion.every((compas) => [1, 2].includes(compas.acordes.split(' ').length)), `${c.id}: progresión`);
    assert.ok(c.progresion.every((compas) => /^([DUX-]{8}|[DUX-]{16})$/.test(compas.rasgueo.replace(/\|/g, ''))), `${c.id}: rasgueo`);
    for (const acorde of acordesDeCancion(c)) assert.ok(formaDeAcorde(c, acorde), `${c.id}: no hay forma para ${acorde}`);
  }
});

test('rasgueo: de letras a flechas', () => {
  assert.deepStrictEqual(golpesDeRasgueo('D-DUX-U-'), ['↓', null, '↓', '↑', 'X', null, '↑', null]);
  assert.strictEqual(textoDeRasgueo('D-DU-UDU'), '↓ · ↓ ↑ · ↑ ↓ ↑');
  // Wonderwall cambia de rasgueo: los distintos, en orden y con sus compases
  const wonderwall = rasgueosDeCancion(CANCIONES.find((c) => c.id === 'wonderwall'));
  assert.deepStrictEqual(wonderwall.map((r) => [r.patron, r.compases.map((x) => x.indice)]), [['D-D-D---', [0]], ['DUDUD-D-', [1, 2]], ['DUUUDUDU', [3]]]);
});

test('tocarla: los golpes del rasgueo después del primero, con su tiempo, y cada acorde con su mitad', () => {
  const lamento = riffDeCancion(CANCIONES.find((c) => c.id === 'lamento-boliviano'));
  const corchea = 60000 / 88 / 2;
  // D-DU-UDU: el primer ↓ es el bloque del acorde
  assert.deepStrictEqual(lamento.notas[0].golpes, [
    { golpe: '↓', t: 2 * corchea }, { golpe: '↑', t: 3 * corchea }, { golpe: '↑', t: 5 * corchea },
    { golpe: '↓', t: 6 * corchea }, { golpe: '↑', t: 7 * corchea },
  ]);
  assert.strictEqual(lamento.rasgueo, '↓ · ↓ ↑ · ↑ ↓ ↑'); // Toda la canción con el mismo rasgueo

  // De música ligera, en semicorcheas: Em "D---D---" (↓ en el 1 y en el 2), C "-UUDDDU-"
  const ligera = riffDeCancion(CANCIONES.find((c) => c.id === 'de-musica-ligera'));
  const semi = 60000 / 126 / 4; // El tempo del fixture
  assert.deepStrictEqual(ligera.notas[0].golpes, [{ golpe: '↓', t: 4 * semi }]);
  assert.deepStrictEqual(ligera.notas[1].golpes.map((g) => g.golpe), ['↑', '↑', '↓', '↓', '↓', '↑']);
  assert.strictEqual(ligera.notas[1].golpes[0].t, semi);
  assert.strictEqual(ligera.notas[1].t, 8 * semi); // C entra en el tiempo 3
  assert.strictEqual(ligera.notas[1].msParte, semi);

  // Con rasgueos distintos no hay uno solo para mostrar
  assert.strictEqual(riffDeCancion(CANCIONES.find((c) => c.id === 'wonderwall')).rasgueo, null);
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

test('nivel: fácil solo con un golpe por acorde y los acordes del curso de acordes', () => {
  const riptide = CANCIONES.find((c) => c.id === 'riptide');
  // Acordes básicos pero con rasgueo: intermedia (como todas las del catálogo por ahora)
  assert.strictEqual(nivelDeCancion(riptide), 'Intermedia');
  assert.ok(CANCIONES.every((c) => nivelDeCancion(c) === 'Intermedia'));
  // Los mismos acordes con un golpe cada uno: fácil
  const unGolpe = { ...riptide, progresion: riptide.progresion.map((c) => ({ ...c, rasgueo: 'D-------' })) };
  assert.strictEqual(nivelDeCancion(unGolpe), 'Fácil');
  // Un golpe por acorde pero con cejilla: intermedia
  const lamento = CANCIONES.find((c) => c.id === 'lamento-boliviano');
  assert.strictEqual(nivelDeCancion({ ...lamento, progresion: lamento.progresion.map((c) => ({ ...c, rasgueo: 'D-------' })) }), 'Intermedia');
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

test('partes del compás: mitad y mitad, o donde marque el "|"', () => {
  assert.deepStrictEqual(partesDeCompas({ acordes: 'Em C', rasgueo: 'D-D-UUDD' }), [
    { nombre: 'Em', patron: 'D-D-', inicio: 0, corcheas: 4 }, { nombre: 'C', patron: 'UUDD', inicio: 4, corcheas: 4 },
  ]);
  assert.deepStrictEqual(partesDeCompas({ acordes: 'Em C', rasgueo: 'DD|UUDDDU' }), [
    { nombre: 'Em', patron: 'DD', inicio: 0, corcheas: 2 }, { nombre: 'C', patron: 'UUDDDU', inicio: 2, corcheas: 6 },
  ]);
  assert.deepStrictEqual(partesDeCompas({ acordes: 'G', rasgueo: 'D-DU-UDU' }), [{ nombre: 'G', patron: 'D-DU-UDU', inicio: 0, corcheas: 8 }]);
  // En semicorcheas, mitad y mitad son 8 y 8
  assert.deepStrictEqual(partesDeCompas({ acordes: 'Em C', rasgueo: 'D---D----UUDDDU-' }).map((p) => [p.patron, p.inicio]), [['D---D---', 0], ['-UUDDDU-', 8]]);
  assert.deepStrictEqual(cuentaDeRasgueo('D---D----UUDDDU-').slice(0, 5), ['1', 'e', 'y', 'a', '2']);
});

test('tocarla: un acorde por compás, o dos si el compás tiene dos', () => {
  const ligera = CANCIONES.find((c) => c.id === 'de-musica-ligera');
  const riff = riffDeCancion(ligera);
  assert.deepStrictEqual(riff.notas.map((n) => [n.nombre, n.pulsos]), [['Em', 2], ['C', 2], ['G', 2], ['D', 2]]);
  assert.strictEqual(riff.notas[1].t, 2 * (60000 / 126));
  // Con "|" cada acorde dura lo que marca: DD|UUDDDU = 1 pulso y 3
  const marcado = riffDeCancion({ ...ligera, progresion: [{ acordes: 'Em C', rasgueo: 'DD|UUDDDU' }] });
  assert.deepStrictEqual(marcado.notas.map((n) => [n.nombre, n.pulsos]), [['Em', 1], ['C', 3]]);
  assert.ok(Math.abs(riff.duracion - 2 * 4 * (60000 / 126)) < 1e-6); // 2 compases
  // Re se toca de la cuerda 4 a la 1
  assert.deepStrictEqual([riff.notas[3].cuerdaGrave, riff.notas[3].cuerdaAguda], [4, 1]);
  // Se repite hasta unos 16 compases
  assert.strictEqual(armarRecorrido(riff).notas.length, 4 * 8);
});

test('tocarla más lento', () => {
  const flaca = CANCIONES.find((c) => c.id === 'flaca');
  assert.strictEqual(riffDeCancion(flaca, VELOCIDADES.mitad).bpm, 35);
  assert.strictEqual(riffDeCancion(flaca, VELOCIDADES.doble).bpm, 140);
  assert.strictEqual(riffDeCancion(flaca).bpm, 70); // Sin elegir, la original
});

test('búsqueda y filtro por nivel', () => {
  assert.deepStrictEqual(filtrarCanciones(CANCIONES, 'soda').map((c) => c.id), ['de-musica-ligera']);
  assert.deepStrictEqual(filtrarCanciones(CANCIONES, 'música ligera').map((c) => c.id), ['de-musica-ligera']);
  assert.deepStrictEqual(filtrarCanciones(CANCIONES, 'calamaro').map((c) => c.id), ['flaca']);
  assert.deepStrictEqual(filtrarCanciones(CANCIONES, '', 'Fácil'), []); // Por ahora no hay fáciles
  assert.strictEqual(filtrarCanciones(CANCIONES, '', 'Intermedia').length, CANCIONES.length);
});

test('nivelDeCancion: si el backend indica la dificultad, se usa esa', () => {
  const cancion = CANCIONES[0];
  assert.strictEqual(nivelDeCancion({ ...cancion, dificultad: 'dificil' }), 'Difícil');
  assert.strictEqual(nivelDeCancion({ ...cancion, dificultad: 'facil' }), 'Fácil');
  assert.strictEqual(nivelDeCancion({ ...cancion, dificultad: 'otra' }), nivelDeCancion(cancion)); // Dato raro: se deduce
});

test('filtro por dificultad, género y favoritas', () => {
  const lista = [
    { ...CANCIONES[0], id: 'a', genero: 'Rock nacional', dificultad: 'dificil' },
    { ...CANCIONES[1], id: 'b', genero: 'Pop' },
    { ...CANCIONES[2], id: 'c' },
  ];
  assert.deepStrictEqual(filtrarCanciones(lista, '', 'Difícil').map((c) => c.id), ['a']);
  assert.deepStrictEqual(filtrarCanciones(lista, '', null, { genero: 'rock NACIONAL' }).map((c) => c.id), ['a']);
  assert.deepStrictEqual(filtrarCanciones(lista, '', null, { favoritas: ['b', 'c'] }).map((c) => c.id), ['b', 'c']);
  assert.deepStrictEqual(filtrarCanciones(lista, '', null, { favoritas: [] }), []); // Sin favoritas marcadas, no hay nada
  assert.deepStrictEqual(filtrarCanciones(lista, '', null, { genero: 'Pop', favoritas: ['a'] }), []);
  assert.strictEqual(filtrarCanciones(lista, '', null, { favoritas: null }).length, 3); // null = no filtrar
});

test('generosDeCanciones: sin repetir, ordenados, y vacío si no hay géneros', () => {
  assert.deepStrictEqual(generosDeCanciones(CANCIONES), []);
  assert.deepStrictEqual(
    generosDeCanciones([{ genero: 'Rock' }, { genero: 'pop' }, { genero: 'rock ' }, { genero: '' }, {}]),
    ['pop', 'Rock'],
  );
});

test('columnasDeCanciones: parte la lista en columnas de a dos', () => {
  assert.deepStrictEqual(columnasDeCanciones([1, 2, 3, 4, 5]), [[1, 2], [3, 4], [5]]);
  assert.deepStrictEqual(columnasDeCanciones([]), []);
  assert.deepStrictEqual(columnasDeCanciones([1, 2, 3], 3), [[1, 2, 3]]);
});

test('seccionesDeCanciones: favoritas, fáciles, intermedias y difíciles, sin repetir ni dejar grupos vacíos', () => {
  const lista = [
    { ...CANCIONES[0], id: 'a', dificultad: 'intermedia' },
    { ...CANCIONES[1], id: 'b', dificultad: 'facil' },
    { ...CANCIONES[2], id: 'c', dificultad: 'dificil' },
    { ...CANCIONES[3], id: 'd', dificultad: 'facil' },
  ];
  const secciones = seccionesDeCanciones(lista, ['c', 'zzz']);
  assert.deepStrictEqual(secciones.map((s) => [s.titulo, s.canciones.map((c) => c.id)]), [
    ['Favoritas', ['c']], ['Fáciles', ['b', 'd']], ['Intermedias', ['a']],
  ]);
  assert.deepStrictEqual(seccionesDeCanciones(lista).map((s) => s.titulo), ['Fáciles', 'Intermedias', 'Difíciles']);
  assert.deepStrictEqual(seccionesDeCanciones([]), []);
});

test('seccionesDeCanciones: una canción no sale dos veces, ni repetida ni en dos grupos', () => {
  const a = { ...CANCIONES[0], id: 'a', dificultad: 'facil' };
  const secciones = seccionesDeCanciones([a, a, { ...CANCIONES[1], id: 'b', dificultad: 'facil' }], ['a', 'a']);
  assert.deepStrictEqual(secciones.map((s) => [s.titulo, s.canciones.map((c) => c.id)]), [['Favoritas', ['a']], ['Fáciles', ['b']]]);
});

test('estrellasDeResultado: 1 por intentarla, 2 desde el 75 % y 3 desde el 95 %', () => {
  assert.strictEqual(estrellasDeResultado(0, 40), 1);
  assert.strictEqual(estrellasDeResultado(29, 40), 1); // 72,5 %
  assert.strictEqual(estrellasDeResultado(30, 40), 2); // 75 %
  assert.strictEqual(estrellasDeResultado(37, 40), 2); // 92,5 %
  assert.strictEqual(estrellasDeResultado(38, 40), 3); // 95 %
  assert.strictEqual(estrellasDeResultado(40, 40), 3);
  assert.strictEqual(estrellasDeResultado(0, 0), 0);
});

test('estrellasPorCancion: acepta un objeto o una lista y descarta lo raro', () => {
  assert.deepStrictEqual(estrellasPorCancion({ sera: 2, creep: '3', flaca: 0, otra: 7 }), { sera: 2, creep: 3 });
  assert.deepStrictEqual(estrellasPorCancion([{ cancionId: 'sera', estrellas: 1 }, { cancionId: 'x', estrellas: null }, null]), { sera: 1 });
  assert.deepStrictEqual(estrellasPorCancion(null), {});
});
