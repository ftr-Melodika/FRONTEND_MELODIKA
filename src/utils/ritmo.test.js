import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { obtenerRitmo, armarLineaDeTiempo, crearDetectorGolpes, evaluarGolpes, cuentaDelCompas, curvaDeLuz, tramosDeLuces, OPACIDAD_LUZ_APAGADA } from './ritmo.js';

const leccion = (practica) => ({ practica: { tipo: 'ritmo', compas: 4, etapas: [{ bpm: 60, compases: 4 }], ...practica } });

// ───── obtenerRitmo ─────

test('obtenerRitmo completa los valores por defecto', () => {
  const r = obtenerRitmo(leccion({}));
  assert.deepStrictEqual(r.patron, [1, 1, 1, 1]);
  assert.strictEqual(r.subdivision, 1);
  assert.strictEqual(r.cuenta, 1);
  assert.strictEqual(r.aprobar, 0.75);
  assert.strictEqual(r.clicQueDesaparece, false);
});

test('obtenerRitmo descarta datos inválidos', () => {
  assert.strictEqual(obtenerRitmo({ practica: { tipo: 'secuencia' } }), null);
  assert.strictEqual(obtenerRitmo(leccion({ compas: 0 })), null);
  assert.strictEqual(obtenerRitmo(leccion({ etapas: [] })), null);
  assert.strictEqual(obtenerRitmo(leccion({ etapas: [{ bpm: 500, compases: 4 }] })), null);
  assert.strictEqual(obtenerRitmo(leccion({ subdivision: 2, patron: [1, 0, 1] })), null); // largo incorrecto
  assert.strictEqual(obtenerRitmo(leccion({ patron: [0, 0, 0, 0] })), null); // nada para tocar
});

// ───── armarLineaDeTiempo ─────

test('16 golpes a 60 BPM: uno por segundo, después de un compás de cuenta', () => {
  const linea = armarLineaDeTiempo(obtenerRitmo(leccion({})));
  assert.strictEqual(linea.golpes.length, 16);
  assert.strictEqual(linea.inicio, 4000);
  assert.strictEqual(linea.golpes[0].t, 4000);
  assert.strictEqual(linea.golpes[15].t, 19000);
  assert.strictEqual(linea.clics.filter((c) => c.cuenta).length, 4);
  assert.strictEqual(linea.duracion, 20000);
});

test('el patrón universal en corcheas toca 6 de las 8 partes', () => {
  const linea = armarLineaDeTiempo(obtenerRitmo(leccion({ subdivision: 2, patron: [1, 0, 1, 1, 0, 1, 1, 1], etapas: [{ bpm: 60, compases: 2 }] })));
  assert.strictEqual(linea.golpes.length, 12);
  assert.deepStrictEqual(linea.golpes.slice(0, 6).map((g) => g.t - linea.inicio), [0, 1000, 1500, 2500, 3000, 3500]);
});

test('escalera de tempo: cada etapa con su BPM', () => {
  const linea = armarLineaDeTiempo(obtenerRitmo(leccion({ etapas: [{ bpm: 60, compases: 1 }, { bpm: 120, compases: 1 }] })));
  const tiempos = linea.golpes.map((g) => g.t - linea.inicio);
  assert.deepStrictEqual(tiempos, [0, 1000, 2000, 3000, 4000, 4500, 5000, 5500]);
});

test('clic que desaparece: se calla un compás de cada dos (la cuenta siempre suena)', () => {
  const linea = armarLineaDeTiempo(obtenerRitmo(leccion({ clicQueDesaparece: true })));
  const porCompas = [0, 1, 2, 3].map((c) => linea.clics.filter((k) => k.compas === c).every((k) => k.audible));
  assert.deepStrictEqual(porCompas, [true, false, true, false]);
  assert.ok(linea.clics.filter((k) => k.cuenta).every((k) => k.audible));
});

test('cuenta del compás', () => {
  assert.deepStrictEqual(cuentaDelCompas(4, 2), ['1', 'y', '2', 'y', '3', 'y', '4', 'y']);
  assert.deepStrictEqual(cuentaDelCompas(3, 1), ['1', '2', '3']);
});

// ───── crearDetectorGolpes (con audio sintético) ─────
// En los ejercicios de tempo no se reconocen notas: cuenta como golpe un sonido fuerte y repentino.

const SR = 48000;

function generador(semilla) {
  let s = semilla;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1;
}

function silencio(ms, ruido = 0.001) {
  const azar = generador(1);
  return new Float32Array(Math.round((SR * ms) / 1000)).map(() => ruido * azar());
}

// Un aplauso: ruido que dura unos milisegundos, con casi toda su fuerza entre 700 y 2800 Hz
function aplausos(ms, tiempos, amplitud, { ruido = 0.001, caidaMs = 10 } = {}) {
  const x = silencio(ms, ruido);
  const azar = generador(7);
  tiempos.forEach((tMs) => {
    const i0 = Math.round((SR * tMs) / 1000);
    let grave = 0;
    let agudo = 0;
    for (let i = i0; i < Math.min(x.length, i0 + SR * 0.25); i++) {
      const blanco = azar();
      agudo += 0.35 * (blanco - agudo); // Saca lo más agudo
      grave += 0.09 * (agudo - grave); // Lo más grave, para restarlo
      x[i] += amplitud * 2 * (agudo - grave) * Math.exp(-(i - i0) / ((SR * caidaMs) / 1000));
    }
  });
  return x;
}

// El clic del metrónomo tal como suena en la app (assets/sonidos), captado fuerte por el micrófono
function leerClic(nombre) {
  const wav = readFileSync(new URL(`../../assets/sonidos/${nombre}`, import.meta.url));
  const tasa = wav.readUInt32LE(24);
  const inicio = wav.indexOf('data') + 8;
  const original = Array.from({ length: (wav.length - inicio) / 2 }, (_, i) => wav.readInt16LE(inicio + i * 2) / 32768);
  // A la frecuencia de muestreo de las pruebas
  return Float32Array.from({ length: Math.floor((original.length * SR) / tasa) }, (_, i) => {
    const pos = (i * tasa) / SR;
    const k = Math.floor(pos);
    return original[k] + ((original[k + 1] ?? 0) - original[k]) * (pos - k);
  });
}
const CLIC = leerClic('clic.wav');
const CLIC_FUERTE = leerClic('clic-fuerte.wav');

function conClics(x, tiempos) {
  tiempos.forEach((tMs, k) => {
    const clic = k % 4 === 0 ? CLIC_FUERTE : CLIC;
    const i0 = Math.round((SR * tMs) / 1000);
    for (let i = 0; i < clic.length && i0 + i < x.length; i++) x[i0 + i] += clic[i];
  });
  return x;
}

// Pasa el audio al detector en bloques, como llega del micrófono
function detectar(x, opciones, bloque = 1024) {
  const detector = crearDetectorGolpes(opciones);
  const tiempos = [];
  for (let i = 0; i < x.length; i += bloque) tiempos.push(...detector.agregar(x.subarray(i, i + bloque), (i / SR) * 1000, SR));
  return tiempos;
}

const BANDAS = ['todo', 'bajoClic'];

for (const banda of BANDAS) {
  test(`cuenta cada aplauso con menos de 10 ms de error (${banda})`, () => {
    const tiempos = [300, 800, 1300, 1800, 2300];
    for (const amplitud of [0.15, 0.4, 0.9]) {
      const detectados = detectar(aplausos(2700, tiempos, amplitud), { banda });
      assert.strictEqual(detectados.length, tiempos.length, `con amplitud ${amplitud} detectó ${detectados.map(Math.round)}`);
      detectados.forEach((t, i) => assert.ok(Math.abs(t - tiempos[i]) < 10, `${t} vs ${tiempos[i]}`));
    }
  });

  test(`aplausos seguidos (semicorcheas a 120 BPM) se cuentan de a uno (${banda})`, () => {
    const tiempos = Array.from({ length: 12 }, (_, i) => 300 + i * 125);
    const detectados = detectar(aplausos(2000, tiempos, 0.4), { banda });
    assert.strictEqual(detectados.length, tiempos.length, `detectó ${detectados.map(Math.round)}`);
  });

  test(`los sonidos suaves no cuentan (${banda})`, () => {
    // Un aplauso muy flojo o lejano, como rozar una cuerda o apoyar algo en la mesa
    assert.deepStrictEqual(detectar(aplausos(2000, [300, 800, 1300], 0.01), { banda }), []);
    // Ruido de fondo, bajo y alto (un ventilador, la calle)
    assert.deepStrictEqual(detectar(silencio(3000, 0.003), { banda }), []);
    assert.deepStrictEqual(detectar(silencio(3000, 0.08), { banda }), []);
  });

  test(`con ruido de ambiente fuerte, un aplauso fuerte se sigue contando y uno apenas más fuerte que el ruido no (${banda})`, () => {
    const tiempos = [600, 1100, 1600];
    assert.strictEqual(detectar(aplausos(2000, tiempos, 0.9, { ruido: 0.05 }), { banda }).length, 3);
    assert.deepStrictEqual(detectar(aplausos(2000, tiempos, 0.06, { ruido: 0.05 }), { banda }), []);
  });

  test(`un aplauso con eco largo cuenta una sola vez (${banda})`, () => {
    const detectados = detectar(aplausos(1500, [300], 0.5, { caidaMs: 80 }), { banda });
    assert.strictEqual(detectados.length, 1, `detectó ${detectados.map(Math.round)}`);
  });

  test(`un sonido fuerte que sigue sonando cuenta una sola vez (${banda})`, () => {
    const x = silencio(3000);
    for (let i = Math.round(SR * 0.3); i < x.length; i++) x[i] += 0.4 * Math.sin((2 * Math.PI * 440 * i) / SR);
    const detectados = detectar(x, { banda });
    assert.strictEqual(detectados.length, 1, `detectó ${detectados.map(Math.round)}`);
  });
}

test('el clic del metrónomo no cuenta como golpe', () => {
  const clics = [200, 700, 1200, 1700, 2200, 2700, 3200, 3700];
  assert.deepStrictEqual(detectar(conClics(silencio(4200), clics)), []);
});

test('con el clic sonando cuenta solo los aplausos, caigan o no sobre el clic', () => {
  const clics = [200, 700, 1200, 1700, 2200, 2700, 3200, 3700];
  const tiempos = [1200, 1700, 2450, 2700, 3200];
  const detectados = detectar(conClics(aplausos(4200, tiempos, 0.4), clics));
  assert.strictEqual(detectados.length, tiempos.length, `detectó ${detectados.map(Math.round)}`);
  detectados.forEach((t, i) => assert.ok(Math.abs(t - tiempos[i]) < 10, `${t} vs ${tiempos[i]}`));
});

test('el medidor de nivel sube con un golpe y baja en silencio', () => {
  const detector = crearDetectorGolpes({ banda: 'todo' });
  const x = aplausos(400, [100], 0.3);
  detector.agregar(x.subarray(0, Math.round(SR * 0.15)), 0, SR);
  const conGolpe = detector.nivel();
  for (let i = 0; i < 6; i++) detector.agregar(new Float32Array(1024), 1000 + i * 21, SR);
  assert.ok(conGolpe > 0.01, `nivel ${conGolpe}`);
  assert.ok(detector.nivel() < conGolpe / 10);
});

// ───── evaluarGolpes ─────

const lineaBase = () => armarLineaDeTiempo(obtenerRitmo(leccion({})));

test('todo a tiempo, con un retraso fijo del equipo de 120 ms: aprobado y parejo', () => {
  const { golpes } = lineaBase();
  const r = evaluarGolpes(golpes, golpes.map((g, i) => g.t + 120 + (i % 2 ? 15 : -15)));
  assert.strictEqual(r.aciertos, 16);
  assert.strictEqual(r.deMas, 0);
  assert.ok(r.aprobado);
  assert.strictEqual(r.tendencia, 'parejo');
  assert.strictEqual(r.desviacionMs, 15);
});

test('golpes que faltan y golpes de más', () => {
  const { golpes } = lineaBase();
  const tocados = golpes.filter((_, i) => i % 4 !== 3).map((g) => g.t + 50); // falta el 4 de cada compás
  tocados.push(golpes[0].t + 550, golpes[5].t + 550); // dos golpes entre pulsos
  const r = evaluarGolpes(golpes, tocados);
  assert.strictEqual(r.aciertos, 12);
  assert.strictEqual(r.deMas, 2);
  assert.ok(r.aprobado); // 12/16 = 75 %
  assert.strictEqual(r.golpes[3].desfase, null);
});

test('se apura: cada golpe llega un poco antes que el anterior', () => {
  const { golpes } = lineaBase();
  const r = evaluarGolpes(golpes, golpes.map((g, i) => g.t + 100 - i * 8));
  assert.strictEqual(r.tendencia, 'apura');
});

test('se atrasa: cada golpe llega un poco después', () => {
  const { golpes } = lineaBase();
  const r = evaluarGolpes(golpes, golpes.map((g, i) => g.t + 100 + i * 8));
  assert.strictEqual(r.tendencia, 'atrasa');
});

test('golpes al azar no aprueban', () => {
  const { golpes } = lineaBase();
  const r = evaluarGolpes(golpes, golpes.map((g, i) => g.t + [0, 300, -250, 180][i % 4]));
  assert.ok(!r.aprobado, `aciertos ${r.aciertos}`);
});

test('sin golpes: nada a tiempo', () => {
  const r = evaluarGolpes(lineaBase().golpes, []);
  assert.strictEqual(r.aciertos, 0);
  assert.ok(!r.aprobado);
  assert.strictEqual(r.desviacionMs, null);
});

// ───── Luces del metrónomo ─────

test('curvaDeLuz: se prende en cada destello y vuelve a apagarse', () => {
  const { inputRange, outputRange } = curvaDeLuz([0, 0.5], 0.1);
  assert.deepStrictEqual(inputRange, [0, 0.1, 0.4999, 0.5, 0.6, 1]);
  assert.deepStrictEqual(outputRange, [1, OPACIDAD_LUZ_APAGADA, OPACIDAD_LUZ_APAGADA, 1, OPACIDAD_LUZ_APAGADA, OPACIDAD_LUZ_APAGADA]);
  // Una interpolación necesita un inputRange creciente
  inputRange.slice(1).forEach((v, i) => assert.ok(v > inputRange[i]));
});

test('tramos: la cuenta y cada tempo de la escalera por separado', () => {
  const r = obtenerRitmo(leccion({ etapas: [{ bpm: 60, compases: 2 }, { bpm: 120, compases: 2 }] }));
  const tramos = tramosDeLuces(armarLineaDeTiempo(r), 4);
  assert.deepStrictEqual(tramos.map((t) => [t.inicio, t.msCiclo, t.ciclos, t.cuenta]), [
    [0, 4000, 1, true], [4000, 4000, 2, false], [12000, 2000, 2, false],
  ]);
  // La luz del pulso 3 se prende a los 3/4 del compás
  assert.ok(tramos[1].luces[2].inputRange.includes(0.5));
});

test('tramos: con el clic que desaparece, el ciclo es de dos compases y solo el primero tiene luces', () => {
  const r = obtenerRitmo(leccion({ etapas: [{ bpm: 60, compases: 8 }], clicQueDesaparece: true }));
  const [, tramo] = tramosDeLuces(armarLineaDeTiempo(r), 4);
  assert.strictEqual(tramo.msCiclo, 8000);
  assert.strictEqual(tramo.ciclos, 4);
  const pulso1 = tramo.luces[0];
  assert.strictEqual(pulso1.outputRange.filter((o) => o === 1).length, 1); // un solo destello por ciclo
  assert.strictEqual(pulso1.inputRange[pulso1.outputRange.indexOf(1)], 0);
});
