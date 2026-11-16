// Pruebas con audio sintético que imita un micrófono de celular. Ejecutar con: npm test
import test from 'node:test';
import assert from 'node:assert';
import { AFINACIONES, CUERDAS_AFINADOR, compararConCuerda, crearAfinador, cuerdasDeAfinacion, detectarFrecuencia } from './afinador.js';

const AMPLITUDES = [1, 0.7, 0.45, 0.3, 0.2, 0.12];
const TASA_ANALISIS = 24000;
const MUESTRAS_ANALISIS = 4800;

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

// Con ruido de ambiente casi tan fuerte como la cuerda: el filtro deja afuera el ruido agudo
test('afina aunque haya mucho ruido de ambiente', () => {
  for (const { cuerda, frecuencia } of CUERDAS_AFINADOR) {
    const afinador = crearAfinador();
    const real = conDesafinacion(frecuencia, -11);
    const audio = sintetizar(real, 48000, 48000, { ruido: 0.12 });
    const { ultima } = escuchar(afinador, audio, 48000);
    assert.ok(ultima.frecuencia, `no detectó la cuerda ${cuerda}`);
    assert.ok(Math.abs(centsEntre(ultima.frecuencia, real)) <= 2, `cuerda ${cuerda}: midió ${ultima.frecuencia.toFixed(2)} Hz en vez de ${real.toFixed(2)} Hz`);
  }
});

test('con ruido moderado la lectura no se mueve más de medio cent', () => {
  for (const { cuerda, frecuencia } of CUERDAS_AFINADOR) {
    const afinador = crearAfinador();
    const { ultima } = escuchar(afinador, sintetizar(frecuencia, 48000, 48000, { ruido: 0.01 }), 48000);
    assert.ok(Math.abs(centsEntre(ultima.frecuencia, frecuencia)) <= 0.5, `cuerda ${cuerda}: midió ${ultima.frecuencia.toFixed(3)} Hz`);
  }
});

test('el ruido de ambiente, aunque sea fuerte, no se lee como una nota', () => {
  for (const nivel of [0.01, 0.1, 0.5]) {
    let semilla = 5;
    let grave = 0;
    // Blanco más uno grave (como un ventilador o el viento), los dos pasan por el filtro
    const ruido = new Float32Array(48000 * 2).map(() => {
      semilla = (semilla * 1664525 + 1013904223) % 4294967296;
      const azar = semilla / 4294967296 - 0.5;
      grave = 0.99 * grave + azar * 0.1;
      return (azar + grave) * nivel;
    });
    const afinador = crearAfinador();
    let ahora = 0;
    for (let i = 0; i + 1024 <= ruido.length; i += 1024) {
      ahora += (1024 / 48000) * 1000;
      const lectura = afinador.agregarBuffer(ruido.subarray(i, i + 1024), 1, 48000, ahora);
      if (lectura) assert.strictEqual(lectura.frecuencia, null, `con ruido de nivel ${nivel} leyó ${lectura.frecuencia} Hz`);
    }
  }
});

// ---- Con la cuerda a afinar avisada (apuntar) ----

const frecuenciaDeCuerda = (cuerda) => CUERDAS_AFINADOR.find((c) => c.cuerda === cuerda).frecuencia;

// Varias cuerdas sonando a la vez: [[frecuencia, volumen], ...]
function mezclar(partes, sr, n) {
  const mezcla = new Float32Array(n);
  partes.forEach(([frecuencia, volumen], k) => {
    const audio = sintetizar(frecuencia, sr, n, { ruido: k === 0 ? 0.002 : 0 });
    for (let i = 0; i < n; i++) mezcla[i] += audio[i] * volumen;
  });
  return mezcla;
}

// En la guía, al llegar a una cuerda las anteriores siguen sonando, y más fuerte que las finas
for (const [cuerda, otras] of [[1, [2, 3]], [1, [4, 3, 2]], [2, [3]], [2, [4, 3]], [3, [5, 4]], [5, [6]]]) {
  test(`afina la cuerda ${cuerda} aunque sigan sonando más fuerte las cuerdas ${otras.join(', ')}`, () => {
    for (const sr of [48000, 44100]) {
      const real = conDesafinacion(frecuenciaDeCuerda(cuerda), 12);
      const audio = mezclar([[real, 0.3], ...otras.map((o) => [frecuenciaDeCuerda(o), 0.6])], sr, sr * 1.5);
      const afinador = crearAfinador();
      afinador.apuntar(frecuenciaDeCuerda(cuerda));
      const { ultima } = escuchar(afinador, audio, sr);
      assert.ok(ultima.frecuencia, `no detectó la nota (${sr} Hz)`);
      assert.ok(Math.abs(centsEntre(ultima.frecuencia, real)) <= 3, `midió ${ultima.frecuencia.toFixed(2)} Hz en vez de ${real.toFixed(2)} Hz (${sr} Hz)`);
    }
  });
}

test('con la cuerda avisada mide cada cuerda sola con medio cent de error', () => {
  for (const { cuerda, frecuencia } of CUERDAS_AFINADOR) {
    for (const cents of [-40, -6, 0, 9, 35]) {
      const real = conDesafinacion(frecuencia, cents);
      const afinador = crearAfinador();
      afinador.apuntar(frecuencia);
      const { ultima } = escuchar(afinador, sintetizar(real, 48000, 48000 * 1.5), 48000);
      assert.ok(ultima.frecuencia, `no detectó la cuerda ${cuerda}`);
      assert.ok(Math.abs(centsEntre(ultima.frecuencia, real)) <= 0.5, `cuerda ${cuerda} a ${cents} cents: midió ${ultima.frecuencia.toFixed(3)} Hz en vez de ${real.toFixed(3)} Hz`);
    }
  }
});

test('con la cuerda avisada igual lee una cuerda muy desafinada, en la octava de la nota buscada', () => {
  const objetivo = frecuenciaDeCuerda(1);
  for (const cents of [-400, 300]) {
    const real = conDesafinacion(objetivo, cents);
    const afinador = crearAfinador();
    afinador.apuntar(objetivo);
    const { ultima } = escuchar(afinador, sintetizar(real, 48000, 48000), 48000);
    assert.ok(ultima.frecuencia, 'no detectó la nota');
    assert.ok(Math.abs(centsEntre(ultima.frecuencia, real)) <= 2, `midió ${ultima.frecuencia.toFixed(2)} Hz en vez de ${real.toFixed(2)} Hz`);
  }
  // La 6ta leída una octava arriba (el micrófono capta poco su nota base) se informa en su octava
  const sexta = frecuenciaDeCuerda(6);
  const afinador = crearAfinador();
  afinador.apuntar(sexta);
  const { ultima } = escuchar(afinador, sintetizar(sexta * 2, 48000, 48000), 48000);
  assert.ok(Math.abs(centsEntre(ultima.frecuencia, sexta)) <= 2, `midió ${ultima.frecuencia.toFixed(2)} Hz`);
});

test('con la cuerda avisada, el ruido de ambiente tampoco se lee como una nota', () => {
  for (const { cuerda, frecuencia } of CUERDAS_AFINADOR) {
    let semilla = 11 + cuerda;
    let grave = 0;
    const ruido = new Float32Array(48000 * 4).map(() => {
      semilla = (semilla * 1664525 + 1013904223) % 4294967296;
      const azar = semilla / 4294967296 - 0.5;
      grave = 0.99 * grave + azar * 0.1;
      return (azar + grave) * 0.1;
    });
    const afinador = crearAfinador();
    afinador.apuntar(frecuencia);
    let ahora = 0;
    for (let i = 0; i + 1024 <= ruido.length; i += 1024) {
      ahora += (1024 / 48000) * 1000;
      const lectura = afinador.agregarBuffer(ruido.subarray(i, i + 1024), 1, 48000, ahora);
      if (lectura) assert.strictEqual(lectura.frecuencia, null, `buscando la cuerda ${cuerda} leyó ${lectura.frecuencia} Hz`);
    }
  }
});

test('al cambiar de cuerda no queda la lectura de la anterior', () => {
  const afinador = crearAfinador();
  afinador.apuntar(frecuenciaDeCuerda(2));
  const { ultima, ahora } = escuchar(afinador, sintetizar(frecuenciaDeCuerda(2), 48000, 48000), 48000);
  assert.ok(ultima.frecuencia);
  afinador.apuntar(frecuenciaDeCuerda(1));
  assert.strictEqual(escuchar(afinador, new Float32Array(48000), 48000, ahora).ultima.frecuencia, null);
});

test('las afinaciones dan las notas esperadas de la 6ta a la 1ra', () => {
  const notas = (id) => cuerdasDeAfinacion(id).map((c) => c.nota).join(' ');
  assert.strictEqual(notas('estandar'), 'Mi La Re Sol Si Mi');
  assert.strictEqual(notas('drop-d'), 'Re La Re Sol Si Mi');
  assert.strictEqual(notas('un-tono'), 'Re Sol Do Fa La Re');
  assert.strictEqual(notas('open-g'), 'Re Sol Re Sol Si Re');
  assert.strictEqual(notas('dadgad'), 'Re La Re Sol La Re');
  // La 6ta en Drop D suena un tono más grave que en la estándar
  assert.ok(Math.abs(cuerdasDeAfinacion('drop-d')[0].frecuencia - 73.42) < 0.01);
  // Un id desconocido cae en la estándar
  assert.deepStrictEqual(cuerdasDeAfinacion('no-existe'), CUERDAS_AFINADOR);
});

test('ninguna afinación pone seguidas dos cuerdas con la misma nota', () => {
  for (const { id, semitonos } of AFINACIONES) {
    assert.strictEqual(semitonos.length, 6, id);
    const cuerdas = cuerdasDeAfinacion(id);
    for (let i = 1; i < cuerdas.length; i++) assert.notStrictEqual(cuerdas[i].nota, cuerdas[i - 1].nota, id);
  }
});
