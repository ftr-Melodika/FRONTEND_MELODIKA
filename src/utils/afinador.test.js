// Pruebas con audio sintético que imita un micrófono de celular. Ejecutar con: npm test
import test from 'node:test';
import assert from 'node:assert';
import { CUERDAS_AFINADOR, compararConCuerda, crearAfinador, detectarFrecuencia } from './afinador.js';

const AMPLITUDES = [1, 0.7, 0.45, 0.3, 0.2, 0.12];
const TASA_ANALISIS = 12000;
const MUESTRAS_ANALISIS = 2400;

// Cuerda con armónicos, y graves atenuados como en un celular. `fundamental` atenúa aún más la nota base.
function sintetizar(frecuencia, sr, n, { fundamental = 1, ruido = 0.002 } = {}) {
  let semilla = 7;
  const azar = () => {
    semilla = (semilla * 1664525 + 1013904223) % 4294967296;
    return semilla / 4294967296;
  };
  const b = new Float32Array(n);
  AMPLITUDES.forEach((a, k) => {
    const armonico = k + 1;
    const fk = frecuencia * armonico;
    const respuesta = fk / (fk + 120);
    const ganancia = a * respuesta * (armonico === 1 ? fundamental : 1);
    const fase = azar() * 2 * Math.PI;
    for (let i = 0; i < n; i++) b[i] += ganancia * Math.sin((2 * Math.PI * fk * i) / sr + fase);
  });
  for (let i = 0; i < n; i++) b[i] = b[i] * 0.2 + ruido * (azar() * 2 - 1);
  return b;
}

const centsEntre = (a, b) => 1200 * Math.log2(a / b);
const conDesafinacion = (f, cents) => f * 2 ** (cents / 1200);

// Pasa audio por el afinador en trozos, como llegan del micrófono. Devuelve la última lectura.
function escuchar(afinador, audio, sr, inicio = 0) {
  const trozo = 1024;
  let ultima = null;
  let ahora = inicio;
  for (let i = 0; i + trozo <= audio.length; i += trozo) {
    ahora += (trozo / sr) * 1000;
    const lectura = afinador.agregarBuffer(audio.subarray(i, i + trozo), 1, sr, ahora);
    if (lectura) ultima = lectura;
  }
  return { ultima, ahora };
}

for (const { cuerda, frecuencia } of CUERDAS_AFINADOR) {
  for (const cents of [-30, -8, 0, 8, 30]) {
    test(`mide la cuerda ${cuerda} desafinada ${cents} cents con 2 cents de error`, () => {
      const real = conDesafinacion(frecuencia, cents);
      const medida = detectarFrecuencia(sintetizar(real, TASA_ANALISIS, MUESTRAS_ANALISIS), TASA_ANALISIS);
      assert.ok(medida, 'no detectó la nota');
      assert.ok(Math.abs(centsEntre(medida, real)) <= 2, `midió ${medida.toFixed(2)} Hz en vez de ${real.toFixed(2)} Hz`);
    });
  }

  test(`no confunde la octava de la cuerda ${cuerda} si la fundamental casi no se oye`, () => {
    const medida = detectarFrecuencia(sintetizar(frecuencia, TASA_ANALISIS, MUESTRAS_ANALISIS, { fundamental: 0.1 }), TASA_ANALISIS);
    assert.ok(medida, 'no detectó la nota');
    assert.ok(Math.abs(centsEntre(medida, frecuencia)) <= 5, `midió ${medida.toFixed(2)} Hz en vez de ${frecuencia.toFixed(2)} Hz`);
  });
}

test('el ruido no se toma como una nota', () => {
  let semilla = 3;
  const ruido = new Float32Array(MUESTRAS_ANALISIS).map(() => {
    semilla = (semilla * 1664525 + 1013904223) % 4294967296;
    return (semilla / 4294967296 - 0.5) * 0.2;
  });
  assert.strictEqual(detectarFrecuencia(ruido, TASA_ANALISIS), null);
});

test('elige la cuerda más cercana e indica hacia dónde corregir', () => {
  const la = 110;
  const { cuerda, nota, estado } = compararConCuerda(la);
  assert.deepStrictEqual({ cuerda, nota, estado }, { cuerda: 5, nota: 'La', estado: 'afinada' });
  assert.strictEqual(compararConCuerda(conDesafinacion(la, -20)).estado, 'baja');
  assert.strictEqual(compararConCuerda(conDesafinacion(la, 20)).estado, 'alta');
  assert.strictEqual(compararConCuerda(conDesafinacion(la, 4)).estado, 'afinada');
});

test('con una cuerda elegida compara contra esa, sin importar la octava', () => {
  const r = compararConCuerda(110, 6);
  assert.strictEqual(r.cuerda, 6);
  assert.strictEqual(r.estado, 'alta');
  assert.strictEqual(compararConCuerda(82.41 * 2, 6).estado, 'afinada');
  assert.strictEqual(compararConCuerda(82.41 / 2, 6).estado, 'afinada');
});

for (const sr of [48000, 44100]) {
  test(`sigue una cuerda y la suelta al apagarse (${sr} Hz)`, () => {
    const afinador = crearAfinador();
    const real = conDesafinacion(146.83, -12);
    const { ultima, ahora } = escuchar(afinador, sintetizar(real, sr, sr), sr);
    assert.ok(ultima.frecuencia, 'no detectó la nota');
    assert.ok(Math.abs(centsEntre(ultima.frecuencia, real)) <= 2);
    assert.strictEqual(compararConCuerda(ultima.frecuencia).cuerda, 4);

    const silencio = new Float32Array(sr * 2);
    assert.strictEqual(escuchar(afinador, silencio, sr, ahora).ultima.frecuencia, null);
  });
}

// Lejos del celular la cuerda llega muy baja (en iOS el micrófono no sube el volumen solo)
test('afina con el celular lejos, con la cuerda muy baja', () => {
  for (const sr of [48000, 44100]) {
    const afinador = crearAfinador();
    const real = conDesafinacion(110, 15);
    const audio = sintetizar(real, sr, sr, { ruido: 0.002 }).map((v) => v * 0.012);
    let suma = 0;
    for (const v of audio) suma += v * v;
    assert.ok(Math.sqrt(suma / audio.length) < 0.002, 'el audio de prueba no es lo bastante bajo');
    const { ultima } = escuchar(afinador, audio, sr);
    assert.ok(ultima.frecuencia, `no detectó la nota (${sr} Hz)`);
    assert.ok(Math.abs(centsEntre(ultima.frecuencia, real)) <= 3);
  }
});
