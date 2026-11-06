// Pruebas con audio sintético. Ejecutar con: node --test
const test = require('node:test');
const assert = require('node:assert');
const D = require('./detector.js');

const FRECUENCIAS = [44100, 48000];
const TAMANO = 4096;

// Simula una cuerda: varios armónicos, con opción de un fundamental débil.
function cuerda(f, sr, armonicos = [1, 0.6, 0.4, 0.25, 0.15], ruido = 0) {
  const b = new Float32Array(TAMANO);
  for (let i = 0; i < TAMANO; i++) {
    let v = 0;
    armonicos.forEach((a, k) => { v += a * Math.sin((2 * Math.PI * f * (k + 1) * i) / sr + k); });
    b[i] = 0.2 * v + ruido * (Math.random() * 2 - 1);
  }
  return b;
}

function centsEntre(a, b) { return Math.abs(1200 * Math.log2(a / b)); }

for (const sr of FRECUENCIAS) {
  test(`todas las notas de cada cuerda hasta el traste 12 (${sr} Hz)`, () => {
    for (let c = 1; c <= 6; c++) {
      for (let t = 0; t <= 12; t++) {
        const nota = D.notaDeCuerdaYTraste(c, t);
        const f = D.midiAFrecuencia(nota.midi);
        const r = D.detectarFrecuencia(cuerda(f, sr), sr);
        assert.ok(r, `sin detección en cuerda ${c} traste ${t}`);
        assert.ok(centsEntre(r.frecuencia, f) < 5, `cuerda ${c} traste ${t}: ${r.frecuencia} vs ${f}`);
      }
    }
  });

  test(`cuerda grave con fundamental débil no sube de octava (${sr} Hz)`, () => {
    const f = D.midiAFrecuencia(40);
    const r = D.detectarFrecuencia(cuerda(f, sr, [0.2, 1, 0.7, 0.4]), sr);
    assert.strictEqual(D.frecuenciaANota(r.frecuencia).cifrado, 'E2');
  });

  test(`tolera ruido de fondo (${sr} Hz)`, () => {
    const f = D.midiAFrecuencia(45);
    const r = D.detectarFrecuencia(cuerda(f, sr, undefined, 0.02), sr);
    assert.strictEqual(D.frecuenciaANota(r.frecuencia).cifrado, 'A2');
  });

  test(`silencio y ruido blanco no dan nota (${sr} Hz)`, () => {
    assert.strictEqual(D.detectarFrecuencia(new Float32Array(TAMANO), sr), null);
    const ruido = Float32Array.from({ length: TAMANO }, () => Math.random() * 2 - 1);
    assert.strictEqual(D.detectarFrecuencia(ruido, sr), null);
  });
}

test('un bloque demasiado corto no rompe la detección', () => {
  assert.strictEqual(D.detectarFrecuencia(new Float32Array(16), 48000), null);
});

test('afinación de la guitarra según la numeración de GuitarNeck', () => {
  const cifrados = [1, 2, 3, 4, 5, 6].map((c) => D.notaDeCuerdaYTraste(c, 0).cifrado);
  assert.deepStrictEqual(cifrados, ['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
  assert.strictEqual(D.notaDeCuerdaYTraste(5, 3).nombre, 'Do');
  assert.strictEqual(D.notaDeCuerdaYTraste(7, 0), null);
});

test('frecuenciaANota informa nombre y desafinación', () => {
  const nota = D.frecuenciaANota(440);
  assert.strictEqual(nota.nombre, 'La');
  assert.strictEqual(nota.cifrado, 'A4');
  assert.strictEqual(nota.cents, 0);
  assert.strictEqual(D.frecuenciaANota(445).cents, 20);
});

test('evaluarNota exige la nota y la octava correctas', () => {
  assert.strictEqual(D.evaluarNota(110, 45).correcta, true);
  assert.strictEqual(D.evaluarNota(112, 45).correcta, true);
  assert.strictEqual(D.evaluarNota(220, 45).correcta, false);
  assert.strictEqual(D.evaluarNota(116.54, 45).correcta, false);
});

test('el estabilizador ignora lecturas sueltas', () => {
  const e = D.crearEstabilizador(5);
  assert.strictEqual(e.agregar(110), null);
  e.agregar(110);
  assert.strictEqual(e.agregar(110), 110);
  assert.strictEqual(e.agregar(880), 110);
  e.agregar(null);
  e.agregar(null);
  e.agregar(null);
  assert.strictEqual(e.agregar(null), null);
});
