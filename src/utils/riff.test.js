import { test } from 'node:test';
import assert from 'node:assert';
import { obtenerRiff, armarRecorrido, enVentana, dondeRetroceder, resumir, MS_ANTES, MS_DESPUES } from './riff.js';

const nota = (cuerda, traste, dedo) => ({ tipo: 'nota', nombre: 'x', posiciones: [traste ? { cuerda, traste, dedo } : { cuerda, traste }] });
// Seven Nation Army
const pasos = [nota(4, 2, 2), nota(4, 2, 2), nota(3, 0), nota(4, 2, 2), nota(4, 0), nota(5, 3, 3), nota(5, 2, 2)];
const leccion = (tempo) => ({ practica: { tipo: 'secuencia', nombre: 'Seven Nation Army', pasos, tempo } });
const TEMPO = { bpm: 80, duraciones: [1.5, 0.5, 0.75, 0.75, 0.5, 2, 2] };

test('obtenerRiff: tiempos de cada nota según el ritmo', () => {
  const riff = obtenerRiff(leccion(TEMPO));
  assert.strictEqual(riff.msPulso, 750);
  assert.deepStrictEqual(riff.notas.map((n) => n.t), [0, 1125, 1500, 2062.5, 2625, 3000, 4500]);
  assert.strictEqual(riff.duracion, 6000);
  assert.strictEqual(riff.notas[0].midi, 52); // Mi en la cuerda 4, traste 2
  assert.strictEqual(riff.notas[2].midi, 55); // Sol al aire
});

test('obtenerRiff: sin ritmo, o con datos inválidos, no hay riff en movimiento', () => {
  assert.strictEqual(obtenerRiff(leccion(undefined)), null);
  assert.strictEqual(obtenerRiff(leccion({ bpm: 80, duraciones: [1, 1] })), null); // faltan duraciones
  assert.strictEqual(obtenerRiff(leccion({ bpm: 500, duraciones: TEMPO.duraciones })), null);
  assert.strictEqual(obtenerRiff(leccion({ bpm: 80, duraciones: [0, ...TEMPO.duraciones.slice(1)] })), null);
  const conAcorde = { practica: { tipo: 'secuencia', pasos: [...pasos.slice(0, 2), { tipo: 'acorde', nombre: 'Mim', posiciones: [{ cuerda: 6, traste: 0 }, { cuerda: 5, traste: 2, dedo: 2 }] }], tempo: { bpm: 80, duraciones: [1, 1, 1] } } };
  assert.strictEqual(obtenerRiff(conAcorde), null);
});

test('armarRecorrido: dos vueltas seguidas', () => {
  const { notas, duracion } = armarRecorrido(obtenerRiff(leccion(TEMPO)));
  assert.strictEqual(notas.length, 14);
  assert.strictEqual(duracion, 12000);
  assert.strictEqual(notas[7].t, 6000);
  assert.strictEqual(notas[7].vuelta, 1);
});

test('enVentana: un poco antes de la línea y un rato después', () => {
  const n = { t: 1000 };
  assert.ok(enVentana(n, 1000 - MS_ANTES));
  assert.ok(enVentana(n, 1000 + MS_DESPUES));
  assert.ok(!enVentana(n, 1000 - MS_ANTES - 1));
  assert.ok(!enVentana(n, 1000 + MS_DESPUES + 1));
});

test('dondeRetroceder: 3 errores seguidos vuelven al primero de ellos', () => {
  assert.strictEqual(dondeRetroceder([true, true, false, false, null]), null);
  assert.strictEqual(dondeRetroceder([true, true, false, false, false, null]), 2);
});

test('dondeRetroceder: 4 errores entre las últimas 6 notas vuelven al primero de ellos', () => {
  assert.strictEqual(dondeRetroceder([true, false, true, false, true, false, false, null]), 1);
  // 3 errores en 6 no alcanzan
  assert.strictEqual(dondeRetroceder([true, false, true, false, true, false, null]), null);
});

test('dondeRetroceder: solo se decide después de un error', () => {
  assert.strictEqual(dondeRetroceder([false, false, true, false, false, true]), null);
  assert.strictEqual(dondeRetroceder([null, null]), null);
});

test('resumir: aprueba con el 75 %', () => {
  assert.deepStrictEqual(resumir([true, true, true, false]), { total: 4, aciertos: 3, aprobado: true });
  assert.deepStrictEqual(resumir([true, true, false, false]), { total: 4, aciertos: 2, aprobado: false });
});
