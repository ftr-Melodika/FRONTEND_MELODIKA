import { test } from 'node:test';
import assert from 'node:assert';
import {
  obtenerRiff, armarRecorrido, enVentana, dondeRetroceder, resumir, MS_ANTES, MS_DESPUES,
  claveDeNota, decidirTropiezo, olvidarTropiezo, secuenciaDePractica, obtenerEscalon, opcionesConEscalon, velocidadesDeClase, esperaLaPrimera,
} from './riff.js';

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

// ───────── Práctica de un tropiezo ─────────

const acorde = (nombre) => ({
  tipo: 'acorde', nombre,
  posiciones: [{ cuerda: 4, traste: 2, dedo: 2 }, { cuerda: 6, traste: 0 }, { cuerda: 5, traste: 2, dedo: 1 }],
  midis: [52, 40, 47],
});

test('secuenciaDePractica: un acorde, cuerda por cuerda (de la 6 a la 1) y después entero', () => {
  const sec = secuenciaDePractica(acorde('Em'));
  assert.deepStrictEqual(sec.map((p) => p.tipo), ['nota', 'nota', 'nota', 'acorde']);
  assert.deepStrictEqual(sec.slice(0, 3).map((p) => p.posiciones[0].cuerda), [6, 5, 4]);
  assert.deepStrictEqual(sec.slice(0, 3).map((p) => p.midis[0]), [40, 47, 52]);
  assert.strictEqual(sec[3].nombre, 'Em');
});

test('secuenciaDePractica: una nota, sola', () => {
  const sec = secuenciaDePractica({ tipo: 'nota', cuerda: 4, traste: 2, dedo: 2, midi: 52 });
  assert.strictEqual(sec.length, 1);
  assert.deepStrictEqual(sec[0].midis, [52]);
  assert.deepStrictEqual(sec[0].posiciones, [{ cuerda: 4, traste: 2, dedo: 2 }]);
});

test('decidirTropiezo: la 1ra vez vuelve atrás; la 2da en el mismo acorde, practica', () => {
  const notas = ['Em', 'C', 'G', 'D', 'Em', 'C', 'G', 'D'].map(acorde);
  const errores = {};
  const retrocesos = {};
  // Erra C, G y D seguidos: vuelve a C
  let r = [true, false, false, false, null, null, null, null];
  assert.deepStrictEqual(decidirTropiezo(notas, r, [3], errores, retrocesos), { accion: 'retroceder', desde: 1 });
  // Vuelve a errar desde C: ahora practica C
  r = [true, false, false, false, null, null, null, null];
  const d = decidirTropiezo(notas, r, [3], errores, retrocesos);
  assert.strictEqual(d.accion, 'practicar');
  assert.strictEqual(d.desde, 1);
  assert.strictEqual(d.nota.nombre, 'C');
});

test('decidirTropiezo: errar el mismo acorde 3 veces, aunque no sea seguido, practica', () => {
  const notas = ['Em', 'C', 'Em', 'C', 'Em', 'C'].map(acorde);
  const errores = {};
  const retrocesos = {};
  assert.strictEqual(decidirTropiezo(notas, [false, null, null, null, null, null], [0], errores, retrocesos), null);
  assert.strictEqual(decidirTropiezo(notas, [false, true, false, null, null, null], [2], errores, retrocesos), null);
  const d = decidirTropiezo(notas, [false, true, false, true, false, null], [4], errores, retrocesos);
  assert.deepStrictEqual({ accion: d.accion, desde: d.desde }, { accion: 'practicar', desde: 4 });
  // Después de practicarlo, vuelve a contar de cero
  olvidarTropiezo(d.nota, errores, retrocesos);
  assert.strictEqual(errores[claveDeNota(d.nota)], undefined);
});

test('claveDeNota: los acordes por nombre, las notas por cuerda y traste', () => {
  assert.strictEqual(claveDeNota(acorde('G')), 'acorde:G');
  assert.strictEqual(claveDeNota({ tipo: 'nota', cuerda: 3, traste: 0 }), 'nota:3-0');
});

test('obtenerRiff: la velocidad baja el tempo sin cambiar el ritmo', () => {
  const mitad = obtenerRiff(leccion(TEMPO), 0.5);
  assert.strictEqual(mitad.bpm, 40);
  assert.strictEqual(mitad.msPulso, 1500);
  assert.strictEqual(mitad.duracion, 12000);
  assert.strictEqual(obtenerRiff(leccion(TEMPO)).bpm, 80);
});

test('obtenerEscalon: solo acepta un factor entre 0 y 1', () => {
  assert.strictEqual(obtenerEscalon({ escalon: 0.75 }), 0.75);
  for (const e of [1, 0, -1, 2, '0.5', null, undefined]) assert.strictEqual(obtenerEscalon({ escalon: e }), null);
  assert.strictEqual(obtenerEscalon(undefined), null);
  assert.deepStrictEqual(opcionesConEscalon(0.75), [{ valor: 0.75, titulo: 'x0.75' }, { valor: 1, titulo: 'x1' }]);
});

test('velocidadesDeClase: normalmente arranca y aprueba a la original', () => {
  assert.deepStrictEqual(velocidadesDeClase({ escalon: 0.5 }), { escalon: 0.5, inicial: 1, paraAprobar: 1 });
  assert.deepStrictEqual(velocidadesDeClase(undefined), { escalon: null, inicial: 1, paraAprobar: 1 });
});

test('velocidadesDeClase: con aprobarLento arranca en el escalón y aprueba a cualquiera', () => {
  assert.deepStrictEqual(velocidadesDeClase({ escalon: 0.5, aprobarLento: true }), { escalon: 0.5, inicial: 0.5, paraAprobar: undefined });
  // Sin escalón válido o con un valor que no es booleano, se comporta como siempre
  assert.deepStrictEqual(velocidadesDeClase({ aprobarLento: true }), { escalon: null, inicial: 1, paraAprobar: 1 });
  assert.strictEqual(velocidadesDeClase({ escalon: 0.5, aprobarLento: 'true' }).inicial, 1);
});

test('esperaLaPrimera: frena al llegar la primera nota y solo si todavía no sonó', () => {
  const notas = [{ t: 0 }, { t: 750 }];
  assert.strictEqual(esperaLaPrimera(notas, [null, null], -100), false);
  assert.strictEqual(esperaLaPrimera(notas, [null, null], 0), true);
  assert.strictEqual(esperaLaPrimera(notas, [true, null], 900), false);
  // Ya frenado el reloj no corre (-Infinity)
  assert.strictEqual(esperaLaPrimera(notas, [null, null], -Infinity), false);
});
