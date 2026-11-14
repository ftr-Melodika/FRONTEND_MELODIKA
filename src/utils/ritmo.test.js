import { test } from 'node:test';
import assert from 'node:assert';
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

const SR = 48000;
// Audio de `ms` de largo con "púas" (tono grave con caída) en `golpes` y "clics" agudos en `clics`
function audio(ms, { golpes = [], clics = [], ruido = 0.001 }) {
  const n = Math.round((SR * ms) / 1000);
  const x = new Float32Array(n);
  let semilla = 1;
  const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647) * 2 - 1;
  for (let i = 0; i < n; i++) x[i] = ruido * azar();
  const muestra = (tMs) => Math.round((SR * tMs) / 1000);
  // Cuerda 5 al aire: cada púa vuelve a hacer vibrar la cuerda desde el principio (reemplaza a la
  // anterior) y trae unos milisegundos de ruido del ataque de la púa
  const orden = [...golpes].sort((a, b) => a - b);
  orden.forEach((tMs, k) => {
    const i0 = muestra(tMs);
    const fin = k + 1 < orden.length ? muestra(orden[k + 1]) : n;
    for (let i = i0; i < fin; i++) {
      const t = (i - i0) / SR;
      x[i] += 0.3 * Math.exp(-t / 0.4) * Math.sin(2 * Math.PI * 110 * t) + (t < 0.003 ? 0.2 * azar() : 0);
    }
  });
  // El clic del metrónomo, igual que en scripts/generarClics.mjs (ataque de 1 ms)
  clics.forEach((tMs) => {
    const i0 = muestra(tMs);
    for (let i = i0; i < n; i++) {
      const t = (i - i0) / SR;
      x[i] += 0.6 * Math.min(1, t / 0.001) * Math.exp(-t / 0.008) * Math.sin(2 * Math.PI * 3200 * t);
    }
  });
  return x;
}

// Pasa el audio al detector en bloques, como llega del micrófono
function detectar(x, bloque = 1024, opciones) {
  const detector = crearDetectorGolpes(opciones);
  const tiempos = [];
  for (let i = 0; i < x.length; i += bloque) tiempos.push(...detector.agregar(x.subarray(i, i + bloque), (i / SR) * 1000, SR));
  return tiempos;
}

test('detecta cada púa con menos de 10 ms de error', () => {
  const golpes = [200, 700, 1200, 1700, 2200];
  const detectados = detectar(audio(2600, { golpes }));
  assert.strictEqual(detectados.length, golpes.length, `detectó ${detectados}`);
  detectados.forEach((t, i) => assert.ok(Math.abs(t - golpes[i]) < 10, `${t} vs ${golpes[i]}`));
});

test('detecta un golpe nuevo aunque la cuerda anterior siga sonando', () => {
  const golpes = [100, 350, 600];
  assert.strictEqual(detectar(audio(900, { golpes })).length, 3);
});

test('el clic agudo del metrónomo no cuenta como golpe', () => {
  assert.deepStrictEqual(detectar(audio(2000, { clics: [100, 600, 1100, 1600] })), []);
});

test('con clic y guitarra juntos detecta solo la guitarra', () => {
  const golpes = [300, 1300];
  const detectados = detectar(audio(2000, { golpes, clics: [300, 800, 1300, 1800] }));
  assert.strictEqual(detectados.length, 2, `detectó ${detectados}`);
});

test('el silencio y el ruido de fondo no dan golpes', () => {
  assert.deepStrictEqual(detectar(audio(1500, { ruido: 0.003 })), []);
  assert.deepStrictEqual(detectar(audio(1500, { ruido: 0.003 }), 1024, { banda: 'agudos' }), []);
});

// Un aplauso o un golpe en la mesa: ruido de banda ancha que dura unos milisegundos
function aplausos(ms, tiempos, amplitud) {
  const x = audio(ms, {});
  let semilla = 7;
  const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647) * 2 - 1;
  tiempos.forEach((tMs) => {
    const i0 = Math.round((SR * tMs) / 1000);
    for (let i = i0; i < Math.min(x.length, i0 + SR * 0.06); i++) x[i] += amplitud * Math.exp(-(i - i0) / (SR * 0.01)) * azar();
  });
  return x;
}

test('sin clic (banda agudos) detecta aplausos', () => {
  const tiempos = [200, 700, 1200, 1700];
  const detectados = detectar(aplausos(2000, tiempos, 0.3), 1024, { banda: 'agudos' });
  assert.strictEqual(detectados.length, 4, `detectó ${detectados}`);
  detectados.forEach((t, i) => assert.ok(Math.abs(t - tiempos[i]) < 10));
});

test('detecta golpes suaves (micrófono de iOS sin ajuste de volumen)', () => {
  const tiempos = [200, 700, 1200];
  assert.strictEqual(detectar(aplausos(1500, tiempos, 0.02), 1024, { banda: 'agudos' }).length, 3);
});

test('el medidor de nivel sube con un golpe y baja en silencio', () => {
  const detector = crearDetectorGolpes({ banda: 'agudos' });
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

// Cuerda 6 al aire tocada a tempo, como en la lección 1.2: cada púa suma vibración sobre la que
// sigue sonando (sustain largo). Los armónicos agudos se apagan más rápido que la fundamental,
// y el ataque de la púa es un chasquido corto y suave.
function cuerdaQueSigueSonando(ms, tiempos, { ataque = 0.03, amplitud = 0.3 } = {}) {
  const n = Math.round((SR * ms) / 1000);
  const x = new Float32Array(n);
  let semilla = 3;
  const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647) * 2 - 1;
  tiempos.forEach((tMs) => {
    const i0 = Math.round((SR * tMs) / 1000);
    for (let i = i0; i < n; i++) {
      const t = (i - i0) / SR;
      let v = 0;
      for (let k = 1; k <= 12; k++) v += (amplitud / k) * Math.exp(-t / (3 / k)) * Math.sin(2 * Math.PI * 82.4 * k * t);
      if (t < 0.002) v += ataque * azar();
      x[i] += v;
    }
  });
  for (let i = 0; i < n; i++) x[i] += 0.0005 * azar();
  return x;
}

test('cuerda 6 a 60 BPM sonando todo el tiempo: con agudos detecta los 8 golpes', () => {
  const tiempos = [200, 1200, 2200, 3200, 4200, 5200, 6200, 7200];
  const detectados = detectar(cuerdaQueSigueSonando(8000, tiempos), 1024, { banda: 'agudos' });
  assert.strictEqual(detectados.length, tiempos.length, `detectó ${detectados.map(Math.round)}`);
  detectados.forEach((t, i) => assert.ok(Math.abs(t - tiempos[i]) < 10, `${t} vs ${tiempos[i]}`));
});

test('púa suave sobre la cuerda que suena (sin chasquido casi): igual la detecta con agudos', () => {
  const tiempos = [200, 1200, 2200, 3200];
  const detectados = detectar(cuerdaQueSigueSonando(4000, tiempos, { ataque: 0.005, amplitud: 0.1 }), 1024, { banda: 'agudos' });
  assert.strictEqual(detectados.length, tiempos.length, `detectó ${detectados.map(Math.round)}`);
});

test('corcheas a 120 BPM sobre la cuerda que suena: detecta cada una', () => {
  const tiempos = Array.from({ length: 8 }, (_, i) => 200 + i * 250);
  const detectados = detectar(cuerdaQueSigueSonando(2500, tiempos), 1024, { banda: 'agudos' });
  assert.strictEqual(detectados.length, tiempos.length, `detectó ${detectados.map(Math.round)}`);
});

test('una sola púa que sigue sonando no genera golpes de más', () => {
  assert.strictEqual(detectar(cuerdaQueSigueSonando(3000, [200]), 1024, { banda: 'agudos' }).length, 1);
});

test('con clic (banda graves): detecta la cuerda 6 sonando todo el tiempo y no cuenta el clic', () => {
  const tiempos = [200, 1200, 2200, 3200, 4200, 5200, 6200, 7200];
  const x = cuerdaQueSigueSonando(8000, tiempos);
  const conClic = audio(8000, { clics: tiempos.map((t) => t + 500) });
  for (let i = 0; i < x.length; i++) x[i] += conClic[i];
  const detectados = detectar(x);
  assert.strictEqual(detectados.length, tiempos.length, `detectó ${detectados.map(Math.round)}`);
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
