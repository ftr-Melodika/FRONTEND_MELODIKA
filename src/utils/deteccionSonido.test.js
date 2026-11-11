// Pruebas con audio sintético que imita un micrófono de celular. Ejecutar con: npm test
import test from 'node:test';
import assert from 'node:assert';
import {
  calcularPotencias,
  compararAcorde,
  compararNota,
  crearDetector,
  crearVerificador,
  encontrarFundamentales,
  midiAFrecuencia,
  midiDePosicion,
  nombreDeMidi,
  obtenerObjetivo,
  obtenerSecuencia,
} from './deteccionSonido.js';

const FORMAS = {
  Do: [[5, 3], [4, 2], [3, 0], [2, 1], [1, 0]],
  Sol: [[6, 3], [5, 2], [4, 0], [3, 0], [2, 0], [1, 3]],
  Re: [[4, 0], [3, 2], [2, 3], [1, 2]],
  La: [[5, 0], [4, 2], [3, 2], [2, 2], [1, 0]],
  Mi: [[6, 0], [5, 2], [4, 2], [3, 1], [2, 0], [1, 0]],
  Fa: [[6, 1], [5, 3], [4, 3], [3, 2], [2, 1], [1, 1]],
  Lam: [[5, 0], [4, 2], [3, 2], [2, 1], [1, 0]],
  Mim: [[6, 0], [5, 2], [4, 2], [3, 0], [2, 0], [1, 0]],
  Rem: [[4, 0], [3, 2], [2, 3], [1, 1]],
};
const midisDe = (forma) => forma.map(([c, t]) => midiDePosicion(c, t));

// Generador con semilla: las pruebas dan siempre el mismo resultado
function crearAzar(semilla) {
  let x = semilla;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
}

// Cuerdas con armónicos, un poco desafinadas, y con los graves atenuados como en un celular
// Con sinFundamental el micrófono no capta la nota base, solo sus armónicos (pasa en las cuerdas graves).
// Puede ser true (ninguna nota) o una frecuencia: pierde la base de las notas más graves que esa.
function sintetizar(midis, sr, n, { semilla = 1, ruido = 0.003, desafinacionCents = 0, sinFundamental = false } = {}) {
  const azar = crearAzar(semilla);
  const b = new Float32Array(n);
  for (const midi of midis) {
    const f = midiAFrecuencia(midi + desafinacionCents / 100);
    const ganancia = 0.6 + 0.4 * azar();
    [1, 0.7, 0.45, 0.3, 0.2, 0.12].forEach((a, k) => {
      const armonico = k + 1;
      const fk = f * armonico * Math.sqrt(1 + 1e-4 * armonico * armonico);
      const pierdeBase = armonico === 1 && (sinFundamental === true || fk < sinFundamental);
      const respuesta = pierdeBase ? 0 : fk / (fk + 120); // El micrófono del celular capta poco por debajo de 120 Hz
      const fase = azar() * 2 * Math.PI;
      for (let i = 0; i < n; i++) b[i] += ganancia * a * respuesta * Math.sin((2 * Math.PI * fk * i) / sr + fase);
    });
  }
  for (let i = 0; i < n; i++) b[i] = (b[i] / midis.length) * 0.25 + ruido * (azar() * 2 - 1);
  return b;
}

function reducirBloque(buffer, factor) {
  const r = new Float32Array(Math.floor(buffer.length / factor));
  for (let i = 0; i < r.length; i++) {
    let s = 0;
    for (let j = 0; j < factor; j++) s += buffer[i * factor + j];
    r[i] = s / factor;
  }
  return r;
}

for (const [sr, factor] of [[48000, 4], [44100, 3]]) {
  const fundamentalesDe = (midisSonando, opciones) => {
    const potencias = calcularPotencias(reducirBloque(sintetizar(midisSonando, sr, 4096 * factor, opciones), factor));
    return encontrarFundamentales(potencias, sr / factor / 4096);
  };
  const compararEn = (midisSonando, midisEsperados, opciones) => compararAcorde(fundamentalesDe(midisSonando, opciones), midisEsperados);

  test(`reconoce los acordes de cada forma (${sr} Hz)`, () => {
    for (const [nombre, forma] of Object.entries(FORMAS)) {
      const r = compararEn(midisDe(forma), midisDe(forma));
      assert.ok(r.correcta, `${nombre}: faltan ${r.faltantes}, sobran ${r.sobrantes}`);
    }
  });

  test(`tolera una guitarra algo desafinada (${sr} Hz)`, () => {
    for (const [nombre, forma] of Object.entries(FORMAS)) {
      const r = compararEn(midisDe(forma), midisDe(forma), { desafinacionCents: -20 });
      assert.ok(r.correcta, `${nombre}: faltan ${r.faltantes}, sobran ${r.sobrantes}`);
    }
  });

  test(`rechaza un acorde equivocado (${sr} Hz)`, () => {
    for (const [tocado, formaTocada] of Object.entries(FORMAS)) {
      for (const [esperado, formaEsperada] of Object.entries(FORMAS)) {
        if (tocado === esperado) continue;
        const r = compararEn(midisDe(formaTocada), midisDe(formaEsperada));
        assert.ok(!r.correcta, `tocó ${tocado} y aceptó ${esperado}`);
      }
    }
  });

  test(`rechaza una sola cuerda cuando se pide un acorde (${sr} Hz)`, () => {
    const esperado = midisDe(FORMAS.Do);
    for (const midi of esperado) assert.ok(!compararEn([midi], esperado).correcta, `aceptó ${nombreDeMidi(midi)} sola`);
  });

  test(`detecta la nota que falta aunque un armónico la imite (${sr} Hz)`, () => {
    const conSol = midisDe(FORMAS.Do);
    const sinSol = conSol.filter((m) => nombreDeMidi(m) !== 'Sol');
    assert.deepStrictEqual(compararEn(sinSol, conSol).faltantes, ['Sol']);
  });

  test(`detecta una nota de más (${sr} Hz)`, () => {
    assert.ok(!compararEn([...midisDe(FORMAS.Lam), 46], midisDe(FORMAS.Lam)).correcta);
  });

  test(`todas las notas de cada cuerda hasta el traste 12 (${sr} Hz)`, () => {
    for (let c = 1; c <= 6; c++) {
      for (let t = 0; t <= 12; t++) {
        const midi = midiDePosicion(c, t);
        const r = compararNota(fundamentalesDe([midi]), midi);
        assert.ok(r.correcta, `cuerda ${c} traste ${t}: detectó ${r.notaDetectada} a ${r.frecuencia} Hz`);
      }
    }
  });

  test(`la nota correcta en otra cuerda se informa como más grave o más aguda (${sr} Hz)`, () => {
    const grave = compararNota(fundamentalesDe([40]), 64);
    assert.deepStrictEqual([grave.correcta, grave.notaDetectada, grave.registro], [false, 'Mi', 'grave']);
    const aguda = compararNota(fundamentalesDe([64]), 40);
    assert.deepStrictEqual([aguda.correcta, aguda.notaDetectada, aguda.registro], [false, 'Mi', 'aguda']);
    const otra = compararNota(fundamentalesDe([45]), 40);
    assert.deepStrictEqual([otra.correcta, otra.notaDetectada, otra.registro], [false, 'La', null]);
  });

  test(`sin la nota base, sus armónicos no aprueban otra nota (${sr} Hz)`, () => {
    const sinBase = (midi) => fundamentalesDe([midi], { sinFundamental: true });
    // Do3 da Do4 y Sol4: no es un Sol
    const doSinBase = compararNota(sinBase(48), 55);
    assert.ok(!doSinBase.correcta, 'tocó Do y aceptó Sol');
    assert.strictEqual(doSinBase.notaDetectada, 'Do');
    // Mi2 da Mi3 y Si3: no es un Si
    assert.ok(!compararNota(sinBase(40), 59).correcta, 'tocó Mi y aceptó Si');
    // La2 da La3 y Mi4: no es un Mi
    assert.ok(!compararNota(sinBase(45), 52).correcta, 'tocó La y aceptó Mi');
  });

  test(`sin la nota base, igual la reconoce por sus armónicos (${sr} Hz)`, () => {
    for (const midi of [40, 45, 48, 50]) {
      const r = compararNota(fundamentalesDe([midi], { sinFundamental: true }), midi);
      assert.ok(r.correcta, `${nombreDeMidi(midi)}: detectó ${r.notaDetectada}`);
      assert.strictEqual(r.notaDetectada, nombreDeMidi(midi));
    }
  });

  test(`sin la nota base, ninguna nota de la primera posición aprueba otra (${sr} Hz)`, () => {
    const tocables = [...new Set([1, 2, 3, 4, 5, 6].flatMap((c) => [0, 1, 2, 3, 4, 5].map((t) => midiDePosicion(c, t))))];
    for (const tocada of tocables) {
      const fundamentales = fundamentalesDe([tocada], { sinFundamental: true, semilla: tocada });
      for (const pedida of tocables) {
        const mismaNota = (tocada - pedida) % 12 === 0 && Math.abs(tocada - pedida) <= 12;
        assert.strictEqual(compararNota(fundamentales, pedida).correcta, mismaNota, `tocó ${tocada} y se pidió ${pedida}`);
      }
    }
  });

  // Un Sol3 sin su base deja Sol4 y Re5: en un Do, ese Re no es una nota de más
  test(`los armónicos de una cuerda del acorde no son notas de más (${sr} Hz)`, () => {
    for (const nombre of ['Do', 'Sol', 'Mim', 'Mi', 'La', 'Lam']) {
      const forma = midisDe(FORMAS[nombre]);
      const r = compararAcorde(fundamentalesDe(forma, { sinFundamental: 200 }), forma);
      assert.deepStrictEqual(r.sobrantes, [], `${nombre}: sobran ${r.sobrantes}`);
    }
  });

  // Sin las bases, en un Do domina Sol4 y el Do4 queda débil: igual tiene que contar como nota de más
  test(`rechaza un acorde equivocado aunque la nota de más suene débil (${sr} Hz)`, () => {
    for (const semilla of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const r = compararAcorde(fundamentalesDe(midisDe(FORMAS.Do), { sinFundamental: 200, semilla }), midisDe(FORMAS.Sol));
      assert.ok(!r.correcta, `semilla ${semilla}: tocó Do y aceptó Sol`);
    }
  });

  // Limitación conocida: si el micrófono pierde la base de todas las cuerdas graves, una nota que
  // suma armónicos de varias cuerdas tapa a las demás (en el Mi, el Si3 deja al Mi3 en un 2 %), y
  // dos acordes que comparten dos notas (Do y Mim) pueden confundirse. Un micrófono real capta
  // algo de la base, y con eso se distinguen.

  test(`una octava de diferencia se acepta (${sr} Hz)`, () => {
    assert.ok(compararNota(fundamentalesDe([52]), 40).correcta);
    assert.ok(compararNota(fundamentalesDe([40]), 52).correcta);
  });
}

test('sin sonido no hay notas', () => {
  assert.deepStrictEqual(encontrarFundamentales(calcularPotencias(new Float32Array(4096)), 12000 / 4096), []);
  assert.strictEqual(compararNota([], 45).correcta, false);
});

test('obtenerObjetivo usa practica, cuerda + traste, o nada', () => {
  const conAcorde = obtenerObjetivo({
    practica: { tipo: 'acorde', nombre: 'Do mayor', posiciones: FORMAS.Do.map(([cuerda, traste]) => ({ cuerda, traste, dedo: 1 })) },
  });
  assert.strictEqual(conAcorde.tipo, 'acorde');
  assert.strictEqual(conAcorde.nombre, 'Do mayor');
  assert.deepStrictEqual(conAcorde.midis, midisDe(FORMAS.Do));

  const conNota = obtenerObjetivo({ practica: null, cuerda: 1, trasteObjetivo: 0 });
  assert.deepStrictEqual([conNota.tipo, conNota.nombre, conNota.midis[0]], ['nota', 'Mi', 64]);

  assert.strictEqual(obtenerObjetivo({ practica: null, cuerda: null, trasteObjetivo: null }), null);
  assert.strictEqual(obtenerObjetivo({ practica: null, cuerda: null, trasteObjetivo: 3 }), null);
  assert.strictEqual(obtenerObjetivo({}), null);
});

test('obtenerObjetivo trata una practica inválida como si no existiera', () => {
  const invalidas = [
    { tipo: 'acorde', posiciones: [] },
    { tipo: 'acorde', posiciones: [{ cuerda: 1, traste: 0 }] },
    { tipo: 'nota', posiciones: [{ cuerda: 1, traste: 0 }, { cuerda: 2, traste: 0 }] },
    { tipo: 'acorde', posiciones: [{ cuerda: 1, traste: 0 }, { cuerda: 1, traste: 2 }] },
    { tipo: 'acorde', posiciones: [{ cuerda: 7, traste: 0 }, { cuerda: 1, traste: 2 }] },
    { tipo: 'acorde', posiciones: [{ cuerda: 2, traste: -1 }, { cuerda: 1, traste: 2 }] },
    { tipo: 'otro', posiciones: [{ cuerda: 1, traste: 0 }] },
    { posiciones: 'x' },
    'x',
  ];
  for (const practica of invalidas) {
    assert.strictEqual(obtenerObjetivo({ practica }), null, JSON.stringify(practica));
    assert.strictEqual(obtenerObjetivo({ practica, cuerda: 5, trasteObjetivo: 0 }).midis[0], 45);
  }
});

test('obtenerSecuencia devuelve las consignas en orden y acepta el formato viejo', () => {
  const secuencia = obtenerSecuencia({
    cuerda: 6, trasteObjetivo: 0, // Para clientes viejos: igual al primer paso
    practica: {
      tipo: 'secuencia',
      nombre: 'Cambios',
      pasos: [
        { tipo: 'nota', posiciones: [{ cuerda: 6, traste: 0 }] },
        { tipo: 'acorde', nombre: 'Mim', posiciones: FORMAS.Mim.map(([cuerda, traste]) => ({ cuerda, traste })) },
        { tipo: 'nota', posiciones: [{ cuerda: 9, traste: 0 }] }, // Inválido: se descarta
        { tipo: 'nota', posiciones: [{ cuerda: 1, traste: 3, dedo: 3 }] },
      ],
    },
  });
  assert.deepStrictEqual(secuencia.map((o) => [o.tipo, o.nombre]), [['nota', 'Mi'], ['acorde', 'Mim'], ['nota', 'Sol']]);
  assert.strictEqual(secuencia[2].posiciones[0].dedo, 3);

  assert.deepStrictEqual(obtenerSecuencia({ cuerda: 1, trasteObjetivo: 3 }).map((o) => o.nombre), ['Sol']);
  // Una secuencia sin pasos válidos cae al formato viejo
  assert.deepStrictEqual(obtenerSecuencia({ cuerda: 5, trasteObjetivo: 0, practica: { tipo: 'secuencia', pasos: [] } }).map((o) => o.nombre), ['La']);
  assert.strictEqual(obtenerSecuencia({ practica: { tipo: 'secuencia', pasos: 'x' } }), null);
  assert.strictEqual(obtenerSecuencia({}), null);
});

test('el verificador exige sostener y perdona una lectura suelta', () => {
  const v = crearVerificador(400, 300, 3);
  assert.strictEqual(v.agregar(true, 0), false);
  assert.strictEqual(v.agregar(false, 100), false);
  assert.strictEqual(v.agregar(true, 200), false);
  assert.strictEqual(v.agregar(true, 400), true);

  const corte = crearVerificador(400, 300, 2);
  corte.agregar(true, 0);
  corte.agregar(false, 400);
  assert.strictEqual(corte.agregar(true, 500), false);

  const pocas = crearVerificador(400, 300, 4);
  pocas.agregar(true, 0);
  assert.strictEqual(pocas.agregar(true, 500), false);
});

// ---- Con ruido ambiente ----

const SR = 48000;
const nota = (cuerda, traste) => obtenerObjetivo({ cuerda, trasteObjetivo: traste });
const acorde = (forma) => obtenerObjetivo({ practica: { tipo: 'acorde', posiciones: forma.map(([cuerda, traste]) => ({ cuerda, traste })) } });

function rms(b) {
  let s = 0;
  for (let i = 0; i < b.length; i++) s += b[i] * b[i];
  return Math.sqrt(s / b.length);
}

function concatenar(...partes) {
  const total = new Float32Array(partes.reduce((s, p) => s + p.length, 0));
  let i = 0;
  for (const p of partes) {
    total.set(p, i);
    i += p.length;
  }
  return total;
}

// Pasa audio por el detector en trozos, como llegan del micrófono
// `desde` sigue el reloj de una pasada anterior por el mismo detector
function reproducir(detector, audio, sr, desde = 0) {
  const trozo = Math.floor(sr / 10);
  const lecturas = [];
  let ahora = desde;
  for (let i = 0; i + trozo <= audio.length; i += trozo) {
    const lectura = detector.agregarBuffer(audio.subarray(i, i + trozo), 1, sr, ahora);
    if (lectura) lecturas.push(lectura);
    ahora += 100;
  }
  return lecturas;
}

// Una sala con gente: ruido grave de fondo, zumbido de 100 Hz y un murmullo que sube y baja
function ambiente(sr, n, { nivel = 0.05, semilla = 11, musica = null } = {}) {
  const azar = crearAzar(semilla);
  const b = new Float32Array(n);
  let filtrado = 0;
  for (let i = 0; i < n; i++) {
    filtrado += 0.15 * ((azar() * 2 - 1) - filtrado);
    const murmullo = 0.75 + 0.25 * Math.sin((2 * Math.PI * 0.7 * i) / sr);
    b[i] = filtrado * 2.5 * murmullo + 0.25 * Math.sin((2 * Math.PI * 100 * i) / sr) + 0.12 * (azar() * 2 - 1);
    if (musica) b[i] += 0.5 * Math.sin((2 * Math.PI * musica * i) / sr);
  }
  const factor = nivel / rms(b);
  for (let i = 0; i < n; i++) b[i] *= factor;
  return b;
}

// Cuerdas que se apagan solas sobre el ambiente, con la relación indicada en decibeles
function pasaje(midis, sr, segundos, ruido, dbSobreRuido) {
  const n = Math.floor(sr * segundos);
  const cuerdas = sintetizar(midis, sr, n, { semilla: 3, ruido: 0 });
  for (let i = 0; i < n; i++) cuerdas[i] *= Math.exp(-i / (sr * 1.2));
  const medio = Math.floor(sr * 0.5);
  const ganancia = (rms(ruido.subarray(0, medio)) * 10 ** (dbSobreRuido / 20)) / rms(cuerdas.subarray(0, medio));
  const mezcla = new Float32Array(n);
  for (let i = 0; i < n; i++) mezcla[i] = cuerdas[i] * ganancia + ruido[i];
  return mezcla;
}

// Mide el ruido del lugar y después toca
function tocarEnRuido(objetivo, midis, dbSobreRuido, opciones = {}) {
  const previo = ambiente(SR, SR * 2.5, opciones);
  const durante = ambiente(SR, SR * 2.5, { ...opciones, semilla: 23 });
  const audio = concatenar(previo, pasaje(midis, SR, 2.5, durante, dbSobreRuido));
  return reproducir(crearDetector(objetivo), audio, SR).filter((l) => !l.calibrando);
}

test('primero mide el ruido y avisa que está calibrando', () => {
  const lecturas = reproducir(crearDetector(nota(5, 0)), ambiente(SR, SR * 3), SR);
  assert.ok(lecturas[0].calibrando);
  assert.strictEqual(lecturas.filter((l) => l.calibrando).length, 8);
  assert.ok(!lecturas.at(-1).calibrando);
});

test('el ambiente solo no dispara notas, con distintos ruidos y niveles', () => {
  for (const nivel of [0.01, 0.05, 0.2]) {
    for (const semilla of [11, 37, 91]) {
      const audio = ambiente(SR, SR * 15, { nivel, semilla });
      for (const objetivo of [nota(5, 0), nota(1, 3), nota(6, 0), acorde(FORMAS.Do), acorde(FORMAS.Mim)]) {
        const lecturas = reproducir(crearDetector(objetivo), audio, SR);
        assert.ok(!lecturas.at(-1).aprobado, `aprobó solo con ambiente, nivel ${nivel}`);
        assert.ok(!lecturas.some((l) => l.hayNota), `mostró una nota solo con ambiente, nivel ${nivel}`);
      }
    }
  }
});

test('reconoce las notas con el ruido igual de fuerte que la guitarra', () => {
  for (let c = 1; c <= 6; c++) {
    for (const t of [0, 3]) {
      assert.ok(tocarEnRuido(nota(c, t), [midiDePosicion(c, t)], 0).at(-1).aprobado, `cuerda ${c} traste ${t}`);
    }
  }
});

test('reconoce las notas con el ruido más fuerte que la guitarra', () => {
  for (const [c, t] of [[6, 0], [5, 0], [3, 0], [1, 0], [1, 3]]) {
    assert.ok(tocarEnRuido(nota(c, t), [midiDePosicion(c, t)], -10).at(-1).aprobado, `cuerda ${c} traste ${t}`);
  }
});

// Lejos del celular la guitarra llega muy baja: en iOS el micrófono no sube el volumen solo.
// A unos 2 m queda cerca de 0,002 de nivel, en una habitación silenciosa (0,0003 de ruido).
const LEJOS = { nivel: 0.0003 };

test('reconoce las notas con el celular lejos, en un lugar silencioso', () => {
  for (const [c, t] of [[6, 0], [5, 0], [4, 2], [3, 0], [2, 1], [1, 0], [1, 3]]) {
    const lecturas = tocarEnRuido(nota(c, t), [midiDePosicion(c, t)], 12, LEJOS);
    assert.ok(lecturas.at(-1).aprobado, `cuerda ${c} traste ${t}`);
  }
});

test('reconoce los acordes con el celular lejos, en un lugar silencioso', () => {
  for (const [nombre, forma] of Object.entries(FORMAS)) {
    assert.ok(tocarEnRuido(acorde(forma), midisDe(forma), 12, LEJOS).at(-1).aprobado, nombre);
  }
});

test('con el celular lejos sigue rechazando lo equivocado', () => {
  assert.ok(!tocarEnRuido(nota(1, 0), [65], 12, LEJOS).at(-1).aprobado);
  assert.ok(!tocarEnRuido(acorde(FORMAS.Do), midisDe(FORMAS.Lam), 12, LEJOS).at(-1).aprobado);
});

test('un lugar silencioso, sin tocar, no dispara notas', () => {
  for (const semilla of [11, 37, 91]) {
    for (const objetivo of [nota(5, 0), nota(1, 3), acorde(FORMAS.Do)]) {
      const lecturas = reproducir(crearDetector(objetivo), ambiente(SR, SR * 15, { ...LEJOS, semilla }), SR);
      assert.ok(!lecturas.at(-1).aprobado);
      assert.ok(!lecturas.some((l) => l.hayNota));
    }
  }
});

test('reconoce los acordes con el ruido igual de fuerte que la guitarra', () => {
  for (const [nombre, forma] of Object.entries(FORMAS)) {
    assert.ok(tocarEnRuido(acorde(forma), midisDe(forma), 0).at(-1).aprobado, nombre);
  }
});

test('con ruido sigue rechazando lo equivocado', () => {
  const fa = tocarEnRuido(nota(1, 0), [65], 0);
  assert.ok(!fa.at(-1).aprobado);
  assert.ok(fa.some((l) => l.hayNota && l.notaDetectada === 'Fa'));

  const lam = tocarEnRuido(acorde(FORMAS.Do), midisDe(FORMAS.Lam), 0);
  assert.ok(!lam.at(-1).aprobado);
  assert.ok(lam.some((l) => l.hayNota && l.faltantes.includes('Sol')));
});

test('una música de fondo constante deja de molestar', () => {
  assert.ok(tocarEnRuido(acorde(FORMAS.Do), midisDe(FORMAS.Do), 0, { musica: 233 }).at(-1).aprobado);
});

test('una voz que cambia de altura no aprueba una nota', () => {
  const n = SR * 4;
  const voz = new Float32Array(n);
  let fase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const altura = 170 + 50 * Math.sin(2 * Math.PI * 1.5 * t); // Entonación del habla
    fase += (2 * Math.PI * altura) / SR;
    const silabas = Math.max(0, Math.sin(2 * Math.PI * 3 * t));
    voz[i] = 0.1 * silabas * (Math.sin(fase) + 0.6 * Math.sin(2 * fase) + 0.3 * Math.sin(3 * fase));
  }
  const audio = concatenar(ambiente(SR, SR * 2), voz);
  for (const objetivo of [nota(5, 0), nota(3, 0), nota(4, 0)]) {
    assert.ok(!reproducir(crearDetector(objetivo), audio, SR).at(-1).aprobado);
  }
});

test('se recupera si alguien tocó mientras medía el ruido', () => {
  const tocandoAlCalibrar = pasaje([45], SR, 2, ambiente(SR, SR * 2), 10);
  const pausa = ambiente(SR, SR * 3, { semilla: 41 });
  const despues = pasaje([45], SR, 2.5, ambiente(SR, SR * 2.5, { semilla: 53 }), 0);
  const lecturas = reproducir(crearDetector(nota(5, 0)), concatenar(tocandoAlCalibrar, pausa, despues), SR);
  assert.ok(lecturas.at(-1).aprobado);
});

test('de punta a punta en un lugar silencioso', () => {
  const conPausa = (audio, sr) => concatenar(new Float32Array(sr * 2), audio);
  const objetivoAcorde = acorde(FORMAS.Do);
  assert.ok(reproducir(crearDetector(objetivoAcorde), conPausa(sintetizar(midisDe(FORMAS.Do), SR, SR * 2), SR), SR).at(-1).aprobado);

  const mal = reproducir(crearDetector(objetivoAcorde), conPausa(sintetizar(midisDe(FORMAS.Lam), SR, SR * 2), SR), SR).at(-1);
  assert.ok(!mal.aprobado);
  assert.ok(mal.faltantes.includes('Sol'));

  const objetivoNota = nota(5, 3);
  assert.ok(reproducir(crearDetector(objetivoNota), conPausa(sintetizar([48], 44100, 44100 * 2), 44100), 44100).at(-1).aprobado);
  const otra = reproducir(crearDetector(objetivoNota), conPausa(sintetizar([50], 44100, 44100 * 2), 44100), 44100).at(-1);
  assert.ok(!otra.aprobado);
  assert.strictEqual(otra.notaDetectada, 'Re');

  const nada = reproducir(crearDetector(objetivoNota), new Float32Array(SR * 4), SR).at(-1);
  assert.strictEqual(nada.hayNota, false);
  assert.ok(!nada.aprobado);
});

test('toma un solo canal del audio estéreo', () => {
  const mono = concatenar(ambiente(SR, SR * 2), pasaje([64], SR, 2, ambiente(SR, SR * 2, { semilla: 5 }), 10));
  const estereo = new Float32Array(mono.length * 2);
  for (let i = 0; i < mono.length; i++) estereo[i * 2] = mono[i];
  const detector = crearDetector(nota(1, 0));
  let ultima = null;
  let ahora = 0;
  for (let i = 0; i + 9600 <= estereo.length; i += 9600) {
    ultima = detector.agregarBuffer(estereo.subarray(i, i + 9600), 2, SR, ahora) || ultima;
    ahora += 100;
  }
  assert.ok(ultima.aprobado);
});

test('los armónicos altos de una cuerda grave no aparecen como otras notas', () => {
  const hzPorBin = 12000 / 4096;
  const potencias = new Float64Array(4096 / 2 + 1);
  const pico = (hz, p) => {
    const bin = Math.round(hz / hzPorBin);
    potencias[bin] = p;
    potencias[bin - 1] = p / 4;
    potencias[bin + 1] = p / 4;
  };
  const f0 = midiAFrecuencia(40);
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((k) => pico(f0 * k, 1 / k));
  const notas = encontrarFundamentales(potencias, hzPorBin).map((f) => nombreDeMidi(f.midi));
  assert.deepStrictEqual(notas, ['Mi']);
});

test('una nota aguda fuerte no se descarta como armónico de un zumbido grave', () => {
  const hzPorBin = 12000 / 4096;
  const potencias = new Float64Array(4096 / 2 + 1);
  const pico = (hz, p) => {
    const bin = Math.round(hz / hzPorBin);
    potencias[bin] = p;
    potencias[bin - 1] = p / 4;
    potencias[bin + 1] = p / 4;
  };
  pico(midiAFrecuencia(40), 0.05);
  pico(midiAFrecuencia(76), 1); // Mi5: 8 veces el Mi2, pero mucho más fuerte
  const midis = encontrarFundamentales(potencias, hzPorBin).map((f) => Math.round(f.midi));
  assert.ok(midis.includes(76), `se perdió la nota aguda: ${midis}`);
});

test('cambiarObjetivo pasa a otra nota sin volver a calibrar', () => {
  const detector = crearDetector(nota(5, 0));
  const primera = reproducir(detector, concatenar(ambiente(SR, SR * 2.5), pasaje([midiDePosicion(5, 0)], SR, 2.5, ambiente(SR, SR * 2.5, { semilla: 23 }), 0)), SR);
  assert.ok(primera.at(-1).aprobado);

  detector.cambiarObjetivo(nota(1, 3));
  const durante = ambiente(SR, SR * 2.5, { semilla: 29 });
  const segunda = reproducir(detector, concatenar(ambiente(SR, SR * 0.5, { semilla: 31 }), pasaje([midiDePosicion(1, 3)], SR, 2.5, durante, 0)), SR, 100000);
  assert.ok(!segunda.some((l) => l.calibrando), 'volvió a calibrar');
  assert.ok(!segunda[0].aprobado, 'arrastró el acierto anterior');
  assert.ok(segunda.at(-1).aprobado);
});

test('después de cambiarObjetivo la nota anterior no aprueba la nueva', () => {
  const detector = crearDetector(nota(5, 0));
  reproducir(detector, ambiente(SR, SR * 2.5), SR);
  detector.cambiarObjetivo(nota(1, 3));
  const lecturas = reproducir(detector, pasaje([midiDePosicion(5, 0)], SR, 2.5, ambiente(SR, SR * 2.5, { semilla: 23 }), 0), SR, 100000);
  assert.ok(!lecturas.at(-1).aprobado);
});
