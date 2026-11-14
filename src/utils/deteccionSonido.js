// Archivo: src/utils/deteccionSonido.js
// Detección de notas y acordes. Es lógica pura: no depende de React ni del micrófono,
// así se puede probar con audio sintético (ver deteccionSonido.test.js).

const NOTAS = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

// Afinación estándar, con la numeración de GuitarNeck: cuerda -> nota MIDI al aire
const CUERDAS_AL_AIRE = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 };
const TRASTE_MAXIMO = 24;

export const NIVEL_MINIMO = 0.0005; // Por debajo de este volumen lo tomamos como silencio. Era 0,003: con el celular a un par de metros la guitarra llegaba más baja y se descartaba

// Separar notas graves requiere unos 3 Hz de resolución: por eso la ventana es larga
const FRECUENCIA_TRABAJO = 12000;
const VENTANA = 4096;
const MS_ENTRE_ANALISIS = 150;
const FRECUENCIA_MIN = 70;
const FRECUENCIA_MAX = 1400;

const UMBRAL_PICO = 0.01; // Potencia mínima de un pico, relativa al más fuerte
const UMBRAL_PRESENTE = 0.03; // Desde acá una nota esperada cuenta como presente
const UMBRAL_SOBRANTE = 0.15; // Una nota ajena solo molesta si suena fuerte

// Qué tan cerca de la nota tiene que sonar para contar (un semitono son 100 cents). Antes se
// redondeaba a la nota más cercana: algo corrido hasta 49 cents, a mitad de camino de la nota
// de al lado, aprobaba igual. La frecuencia se mide con un error de unos 10 cents en el peor ruido.
const TOLERANCIA_NOTA_CENTS = 30;
// En un acorde los armónicos de varias cuerdas se pisan y corren un poco cada pico
const TOLERANCIA_ACORDE_CENTS = 40;
// La nota pedida tiene que ser de lo más fuerte que suena. Antes alcanzaba con un 3 %: se podía
// tocar otra nota y aprobar porque la pedida sonaba apenas (otra cuerda rozada, la nota anterior).
const UMBRAL_NOTA_PRINCIPAL = 0.3;
// Armónicos de una cuerda del acorde que caen en otra nota (quinta y tercera, octavas arriba).
// Si la base de esa cuerda no se oye, pueden parecer notas sueltas: no cuentan como notas de más.
const ARMONICOS_DEL_ACORDE = [3, 5, 6];
const TOLERANCIA_ARMONICO_CENTS = 35;
const ARMONICO_MAXIMO = 6;
// Más arriba ya no hay notas de un acorde abierto, pero una cuerda grave sigue dando armónicos.
// Solo cuentan si son más débiles que la nota grave: una nota aguda fuerte no es un armónico.
const ARMONICO_MAXIMO_DEBIL = 16;

// La nota más grave de la guitarra es Mi2 (82,4 Hz). El micrófono del celular casi no capta
// la nota base de las cuerdas graves, pero sí sus armónicos: con ellos se deduce cuál sonó.
const FRECUENCIA_MIN_GUITARRA = 78;
const ARMONICO_MAXIMO_VIRTUAL = 6;
const UMBRAL_VIRTUAL = 0.1; // Un pico más débil puede ser ruido: no alcanza para deducir una nota

// Ruido ambiente: se mide por frecuencia y un pico debe superarlo por este factor (unos 12 dB)
const MARGEN_SOBRE_RUIDO = 16;
const BINS_SUAVIZADO_RUIDO = 5; // El ruido fluctúa mucho en cada frecuencia: se promedia con sus vecinas
const LECTURAS_CALIBRACION = 8; // Alrededor de 1,5 segundos al abrir la práctica
// Se adapta lento en los dos sentidos: una nota sostenida no debe tomarse por ruido,
// y en una pausa del murmullo no hay que olvidar que el murmullo va a volver.
const ADAPTACION_SUBE = 0.08;
const ADAPTACION_BAJA = 0.05;
// Solo baja rápido si la frecuencia quedó muy por debajo: alguien tocó mientras se medía el ruido
const ADAPTACION_BAJA_RAPIDA = 0.3;
const CAIDA_BRUSCA = 16;
const LIMITE_SUBIDA = 3;

// Una nota debe mantenerse para contar: una voz o un ruido cambian de frecuencia enseguida
const LECTURAS_ESTABLES = 3;
const MS_PARA_APROBAR = 300;
const LECTURAS_PARA_APROBAR = 3;
const MS_DE_GRACIA = 300; // Una lectura mala suelta (el golpe de la púa) no corta el acierto
// En un rasgueo con ruido alguna cuerda se hunde por momentos: cuenta si se oyó hace poco (unos 600 ms)
const LECTURAS_MEMORIA_ACORDE = 4;

const claseDeMidi = (midi) => ((Math.round(midi) % 12) + 12) % 12;
export const nombreDeMidi = (midi) => NOTAS[claseDeMidi(midi)];
export const midiAFrecuencia = (midi) => 440 * 2 ** ((midi - 69) / 12);
const frecuenciaAMidi = (frecuencia) => 69 + 12 * Math.log2(frecuencia / 440);

export function midiDePosicion(cuerda, traste) {
  const alAire = CUERDAS_AL_AIRE[Number(cuerda)];
  const numeroTraste = Number(traste);
  if (alAire === undefined || !Number.isInteger(numeroTraste) || numeroTraste < 0 || numeroTraste > TRASTE_MAXIMO) return null;
  return alAire + numeroTraste;
}

function posicionesValidas(posiciones) {
  if (!Array.isArray(posiciones) || posiciones.length === 0) return false;
  const cuerdas = posiciones.map((p) => Number(p?.cuerda));
  if (new Set(cuerdas).size !== cuerdas.length) return false;
  return posiciones.every((p) => midiDePosicion(p?.cuerda, p?.traste) !== null);
}

// Qué tiene que sonar en una lección. Usa `practica` si es válida y, si no, cuerda + trasteObjetivo.
// Nadie valida estos datos en el backend, así que un dato inválido se trata como si no existiera.
// Devuelve { tipo, nombre, posiciones, midis } o null si la lección no permite detectar nada.
export function obtenerObjetivo(leccion) {
  const practica = leccion?.practica;
  if (posicionesValidas(practica?.posiciones)) {
    const cantidad = practica.posiciones.length;
    if ((practica.tipo === 'nota' && cantidad === 1) || (practica.tipo === 'acorde' && cantidad >= 2)) {
      const posiciones = practica.posiciones.map((p) => ({ ...p, cuerda: Number(p.cuerda), traste: Number(p.traste) }));
      const midis = posiciones.map((p) => midiDePosicion(p.cuerda, p.traste));
      return { tipo: practica.tipo, nombre: practica.nombre || nombreDeMidi(midis[0]), posiciones, midis };
    }
  }

  if (leccion?.cuerda === null || leccion?.cuerda === undefined) return null;
  if (leccion?.trasteObjetivo === null || leccion?.trasteObjetivo === undefined) return null;
  const midi = midiDePosicion(leccion.cuerda, leccion.trasteObjetivo);
  if (midi === null) return null;
  return {
    tipo: 'nota',
    nombre: nombreDeMidi(midi),
    posiciones: [{ cuerda: Number(leccion.cuerda), traste: Number(leccion.trasteObjetivo) }],
    midis: [midi],
  };
}

// Las consignas de una lección, en orden: cada una es un objetivo como los de obtenerObjetivo.
// Con practica.tipo = 'secuencia' son sus `pasos` (cada paso tiene la forma de una practica de
// nota o de acorde). Si no, es una sola consigna (formato viejo). Un paso inválido se descarta.
// Devuelve null si no hay nada que detectar.
export function obtenerSecuencia(leccion) {
  const practica = leccion?.practica;
  if (practica?.tipo === 'secuencia' && Array.isArray(practica.pasos)) {
    const pasos = practica.pasos.map((paso) => obtenerObjetivo({ practica: paso })).filter(Boolean);
    if (pasos.length > 0) return pasos;
  }
  const unico = obtenerObjetivo(leccion);
  return unico ? [unico] : null;
}

export function calcularVolumen(muestras) {
  let suma = 0;
  for (let i = 0; i < muestras.length; i++) suma += muestras[i] * muestras[i];
  return muestras.length ? Math.sqrt(suma / muestras.length) : 0;
}

// Baja la frecuencia de muestreo para no sobrecargar el hilo de JS.
// Promediar además funciona como un filtro simple de agudos.
// `destino` permite reusar el arreglo en cada análisis en vez de crear uno nuevo.
export function reducir(muestras, factor, destino = null) {
  if (factor === 1) return muestras;
  const largo = Math.floor(muestras.length / factor);
  const reducidas = destino && destino.length === largo ? destino : new Float32Array(largo);
  for (let i = 0; i < largo; i++) {
    let suma = 0;
    const base = i * factor;
    for (let j = 0; j < factor; j++) suma += muestras[base + j];
    reducidas[i] = suma / factor;
  }
  return reducidas;
}

// ---- Análisis del espectro ----

// Todo lo que no cambia entre un análisis y otro se calcula una sola vez por tamaño: la ventana,
// los senos y cosenos y el orden de la FFT. Antes se calculaban ~24.000 senos y cosenos cada vez,
// y en Hermes (el motor de la app, sin JIT) eso pesa mucho en un celular de gama media.
const tablasPorTamano = new Map();

function tablasFft(n) {
  let tablas = tablasPorTamano.get(n);
  if (tablas) return tablas;
  const mitad = n / 2;
  const cos = new Float64Array(mitad);
  const sen = new Float64Array(mitad);
  for (let k = 0; k < mitad; k++) {
    cos[k] = Math.cos((2 * Math.PI * k) / n);
    sen[k] = Math.sin((2 * Math.PI * k) / n);
  }
  const inversion = new Uint32Array(mitad);
  for (let i = 1, j = 0; i < mitad; i++) {
    let bit = mitad >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    inversion[i] = j;
  }
  const ventana = new Float64Array(n);
  for (let i = 0; i < n; i++) ventana[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  tablas = { mitad, cos, sen, inversion, ventana, re: new Float64Array(mitad), im: new Float64Array(mitad) };
  tablasPorTamano.set(n, tablas);
  return tablas;
}

// FFT compleja en el lugar, de tamaño n/2, con los senos y cosenos de la tabla de tamaño n
function fftCompleja(re, im, { mitad, cos, sen, inversion }) {
  for (let i = 1; i < mitad; i++) {
    const j = inversion[i];
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  const n = mitad * 2;
  for (let largo = 2; largo <= mitad; largo <<= 1) {
    const paso = largo >> 1;
    const salto = n / largo; // Índice en la tabla de tamaño n
    for (let inicio = 0; inicio < mitad; inicio += largo) {
      for (let k = 0, w = 0; k < paso; k++, w += salto) {
        const wr = cos[w];
        const wi = -sen[w];
        const a = inicio + k;
        const b = a + paso;
        const tr = re[b] * wr - im[b] * wi;
        const ti = re[b] * wi + im[b] * wr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
    }
  }
}

// Potencia de cada frecuencia en un bloque de audio (tamaño potencia de 2).
// El audio es real: se arma una señal compleja de la mitad de largo (pares + impares·i),
// se transforma y se separa. Hace la mitad de cuentas que una FFT compleja del bloque entero.
export function calcularPotencias(muestras) {
  const n = muestras.length;
  const tablas = tablasFft(n);
  const { mitad, cos, sen, ventana, re, im } = tablas;
  for (let m = 0; m < mitad; m++) {
    re[m] = muestras[2 * m] * ventana[2 * m];
    im[m] = muestras[2 * m + 1] * ventana[2 * m + 1];
  }
  fftCompleja(re, im, tablas);

  const potencias = new Float64Array(mitad + 1);
  for (let k = 0; k <= mitad; k++) {
    const a = k % mitad;
    const b = (mitad - k) % mitad;
    const zr = re[a];
    const zi = im[a];
    const cr = re[b];
    const ci = -im[b]; // Conjugado de Z[mitad - k]
    const pr = (zr + cr) / 2; // Parte de las muestras pares
    const pi = (zi + ci) / 2;
    const ir = (zi - ci) / 2; // Parte de las impares
    const ii = -(zr - cr) / 2;
    const wr = k < mitad ? cos[k] : -1;
    const wi = k < mitad ? -sen[k] : 0;
    const xr = pr + wr * ir - wi * ii;
    const xi = pi + wr * ii + wi * ir;
    potencias[k] = xr * xr + xi * xi;
  }
  return potencias;
}

// Aprende cuánto ruido hay en cada frecuencia y se adapta si el ambiente cambia.
// Un ventilador o una música de fondo constante dejan de molestar; una nota recién tocada no.
function crearPerfilRuido() {
  let perfil = null;
  let lecturas = 0;
  return {
    listo: () => lecturas >= LECTURAS_CALIBRACION,
    // Promedio con las frecuencias vecinas, sin bajar de lo medido: un tono constante sigue tapado
    potencias() {
      const suavizado = new Float64Array(perfil.length);
      let suma = 0;
      for (let i = 0; i < perfil.length; i++) {
        suma += perfil[i];
        if (i > 2 * BINS_SUAVIZADO_RUIDO) suma -= perfil[i - 2 * BINS_SUAVIZADO_RUIDO - 1];
        const centro = i - BINS_SUAVIZADO_RUIDO;
        if (centro >= 0) suavizado[centro] = Math.max(perfil[centro], suma / (2 * BINS_SUAVIZADO_RUIDO + 1));
      }
      for (let i = Math.max(0, perfil.length - BINS_SUAVIZADO_RUIDO); i < perfil.length; i++) suavizado[i] = perfil[i];
      return suavizado;
    },
    agregar(potencias) {
      if (!perfil || perfil.length !== potencias.length) {
        perfil = new Float64Array(potencias.length);
        lecturas = 0;
      }
      const calibrando = lecturas < LECTURAS_CALIBRACION;
      for (let i = 0; i < perfil.length; i++) {
        if (calibrando) {
          perfil[i] += (potencias[i] - perfil[i]) / (lecturas + 1);
        } else if (potencias[i] < perfil[i]) {
          const adaptacion = potencias[i] * CAIDA_BRUSCA < perfil[i] ? ADAPTACION_BAJA_RAPIDA : ADAPTACION_BAJA;
          perfil[i] += (potencias[i] - perfil[i]) * adaptacion;
        } else {
          perfil[i] += (Math.min(potencias[i], perfil[i] * LIMITE_SUBIDA) - perfil[i]) * ADAPTACION_SUBE;
        }
      }
      lecturas += 1;
    },
  };
}

function esArmonicoDe(pico, grave) {
  const multiplo = Math.round(pico.frecuencia / grave.frecuencia);
  if (multiplo < 2 || multiplo > ARMONICO_MAXIMO_DEBIL) return false;
  if (multiplo > ARMONICO_MAXIMO && pico.potencia > grave.potencia) return false;
  const cents = 1200 * Math.log2(pico.frecuencia / (grave.frecuencia * multiplo));
  return Math.abs(cents) <= TOLERANCIA_ARMONICO_CENTS;
}

// Notas que suenan por encima del ruido, cada una como { frecuencia, midi, potencia, fuerza },
// con la potencia relativa a la más fuerte. Resta el ruido medido y descarta los armónicos,
// porque el armónico de una cuerda no prueba que suene otra: el Do grave también
// produce un Sol aunque la cuerda de Sol esté apagada.
// `potencia` es la del pico de la nota; `fuerza` le suma sus armónicos. Para saber cuál de dos
// notas suena más fuerte sirve la fuerza: el micrófono del celular capta poco la base de las
// cuerdas graves, y por su pico solo parecerían más débiles de lo que son.
export function encontrarFundamentales(potencias, hzPorBin, ruido = null) {
  const binMin = Math.max(1, Math.floor(FRECUENCIA_MIN / hzPorBin));
  const binMax = Math.min(potencias.length - 2, Math.ceil(FRECUENCIA_MAX / hzPorBin));

  const limpias = new Float64Array(binMax + 2);
  let maxima = 0;
  for (let i = binMin - 1; i <= binMax + 1; i++) {
    const nivelRuido = ruido ? ruido[i] : 0;
    if (potencias[i] <= nivelRuido * MARGEN_SOBRE_RUIDO) continue;
    limpias[i] = potencias[i] - nivelRuido;
    if (limpias[i] > maxima) maxima = limpias[i];
  }
  if (maxima === 0) return [];

  const picos = [];
  for (let i = binMin; i <= binMax; i++) {
    const p = limpias[i];
    if (p < maxima * UMBRAL_PICO || p <= limpias[i - 1] || p < limpias[i + 1]) continue;
    // Interpolación sobre el logaritmo: da la frecuencia real entre dos bins
    const a = Math.log(potencias[i - 1] + 1e-12);
    const b = Math.log(potencias[i] + 1e-12);
    const c = Math.log(potencias[i + 1] + 1e-12);
    const divisor = a - 2 * b + c;
    const ajuste = divisor !== 0 ? (0.5 * (a - c)) / divisor : 0;
    picos.push({ frecuencia: (i + ajuste) * hzPorBin, potencia: p });
  }

  const fundamentales = [];
  const armonicos = [];
  for (const pico of picos) {
    const esArmonico = picos.some((grave) => grave.frecuencia < pico.frecuencia && esArmonicoDe(pico, grave));
    if (esArmonico) armonicos.push(pico);
    else fundamentales.push({ ...pico, fuerza: pico.potencia });
  }
  // Cada armónico suma a la nota más grave que lo explica (los picos están de grave a agudo)
  for (const armonico of armonicos) {
    const base = fundamentales.find((f) => f.frecuencia < armonico.frecuencia && esArmonicoDe(armonico, f));
    if (base) base.fuerza += armonico.potencia;
  }
  const mayor = fundamentales.reduce((max, p) => Math.max(max, p.potencia), 0);
  const mayorFuerza = fundamentales.reduce((max, p) => Math.max(max, p.fuerza), 0);
  return fundamentales.map((p) => ({
    frecuencia: p.frecuencia,
    midi: frecuenciaAMidi(p.frecuencia),
    potencia: p.potencia / mayor,
    fuerza: p.fuerza / mayorFuerza,
  }));
}

const coincide = (frecuencia, objetivo) => Math.abs(1200 * Math.log2(frecuencia / objetivo)) <= TOLERANCIA_ARMONICO_CENTS;
const fuerzaDe = (nota) => nota.fuerza ?? nota.potencia;

// Si dos notas son armónicos distintos de una misma nota de guitarra que no se oye, sonó esa.
// Ej.: un Do3 sin su base deja Do4 (2º armónico) y Sol4 (3º). Como 392/261 = 1,5, el Sol no se
// descarta como armónico del Do4, y sin esto un Do aprobaba un Sol pedido.
// Solo se usa con notas sueltas: en un acorde, dos notas reales pueden tener esa relación.
export function agruparArmonicos(fundamentales) {
  const restantes = [...fundamentales].sort((a, b) => b.potencia - a.potencia);
  const resultado = [];
  while (restantes.length > 0) {
    const nota = restantes.shift();
    let mejor = null;
    for (let k = 2; k <= ARMONICO_MAXIMO_VIRTUAL; k++) {
      const base = nota.frecuencia / k;
      if (base < FRECUENCIA_MIN_GUITARRA) break;
      const explicadas = restantes.filter((otra) => {
        if (otra.potencia < UMBRAL_VIRTUAL) return false;
        const j = Math.round(otra.frecuencia / base);
        return j >= 2 && j <= ARMONICO_MAXIMO_VIRTUAL && j !== k && coincide(otra.frecuencia, base * j);
      });
      if (explicadas.length === 0) continue;
      // A una nota sin su base se le oye el 2º armónico. Si no está, son dos notas distintas que
      // suenan juntas: Si3 y Mi4 (dos cuerdas vecinas al aire) también son el 3º y el 4º de un Mi2.
      const estaElSegundo = k === 2 || explicadas.some((otra) => Math.round(otra.frecuencia / base) === 2);
      if (!estaElSegundo) continue;
      const potencia = explicadas.reduce((suma, otra) => suma + otra.potencia, nota.potencia);
      if (!mejor || potencia > mejor.potencia) mejor = { base, explicadas, potencia };
    }
    if (!mejor) {
      resultado.push(nota);
      continue;
    }
    // La fuerza de la nota deducida es la de todos los armónicos que se le oyeron
    let fuerza = fuerzaDe(nota);
    mejor.explicadas.forEach((otra) => {
      fuerza += fuerzaDe(otra);
      restantes.splice(restantes.indexOf(otra), 1);
    });
    // Los armónicos más débiles de la nota deducida tampoco son otras notas
    const virtual = { frecuencia: mejor.base, potencia: nota.potencia };
    for (let i = restantes.length - 1; i >= 0; i--) {
      if (restantes[i].potencia <= nota.potencia && esArmonicoDe(restantes[i], virtual)) {
        fuerza += fuerzaDe(restantes[i]);
        restantes.splice(i, 1);
      }
    }
    resultado.push({ frecuencia: mejor.base, midi: frecuenciaAMidi(mejor.base), potencia: nota.potencia, fuerza, virtual: true });
  }
  return resultado;
}

// Compara con la nota pedida. Tiene que sonar afinada (a menos de TOLERANCIA_NOTA_CENTS) y ser de
// lo más fuerte que se oye: medio semitono corrida, o apenas audible debajo de otra, no cuenta.
// Acepta una octava arriba o abajo, porque el micrófono del celular capta poco la fundamental de
// las cuerdas graves. Mi2 y Mi4 siguen siendo distintas.
// Devuelve { correcta, notaDetectada, frecuencia, cents, registro, afinacion }:
// - cents: cuánto se aparta lo que suena de la nota informada
// - registro: 'grave' | 'aguda' si es la nota pedida pero en otra octava
// - afinacion: 'baja' | 'alta' si es la nota pedida pero suena corrida
export function compararNota(fundamentalesOidas, midiEsperado) {
  const fundamentales = agruparArmonicos(fundamentalesOidas);
  if (fundamentales.length === 0) return { correcta: false, notaDetectada: null, registro: null, afinacion: null };
  const octavasDe = (f) => Math.round((f.midi - midiEsperado) / 12);
  const desvioDe = (f) => (f.midi - midiEsperado - 12 * octavasDe(f)) * 100; // Cents hasta la nota pedida, sin contar octavas
  const masFuerte = (a, b) => (fuerzaDe(b) > fuerzaDe(a) ? b : a);

  const principal = fundamentales.reduce(masFuerte);
  const acertadas = fundamentales.filter(
    (f) =>
      Math.abs(octavasDe(f)) <= 1 &&
      Math.abs(desvioDe(f)) <= TOLERANCIA_NOTA_CENTS &&
      fuerzaDe(f) >= fuerzaDe(principal) * UMBRAL_NOTA_PRINCIPAL
  );
  const correcta = acertadas.length > 0;
  const informada = correcta ? acertadas.reduce(masFuerte) : principal;

  let registro = null;
  let afinacion = null;
  if (!correcta && claseDeMidi(informada.midi) === claseDeMidi(midiEsperado)) {
    if (Math.abs(octavasDe(informada)) > 1) registro = octavasDe(informada) < 0 ? 'grave' : 'aguda';
    else afinacion = desvioDe(informada) < 0 ? 'baja' : 'alta';
  }
  return {
    correcta,
    notaDetectada: nombreDeMidi(informada.midi),
    frecuencia: informada.frecuencia,
    cents: Math.round((informada.midi - Math.round(informada.midi)) * 100),
    registro,
    afinacion,
  };
}

// Compara con las notas del acorde, en cualquier octava. Lo que sobra se mira en lo que suena ahora;
// lo que falta, en lo que sonó recién (`recientes`).
// Lo que sobra excluye los armónicos de las cuerdas que se esperan: un Sol3 sin su base deja
// Sol4 y Re5, y ese Re no es una nota de más en un Do.
// Cada nota del acorde tiene que sonar afinada (a menos de TOLERANCIA_ACORDE_CENTS): si solo se
// oye corrida va a `desafinadas` y el acorde no aprueba.
export function compararAcorde(fundamentales, midis, recientes = fundamentales) {
  const frecuenciasEsperadas = midis.map(midiAFrecuencia);
  const esArmonicoDelAcorde = (f) =>
    frecuenciasEsperadas.some((base) => ARMONICOS_DEL_ACORDE.some((j) => coincide(f.frecuencia, base * j)));
  const afinada = (f) => Math.abs(f.midi - Math.round(f.midi)) * 100 <= TOLERANCIA_ACORDE_CENTS;
  const potenciasPorNota = (lista) => {
    const potencias = new Array(12).fill(0);
    lista.forEach((f) => {
      const clase = claseDeMidi(f.midi);
      potencias[clase] = Math.max(potencias[clase], f.potencia);
    });
    return potencias;
  };
  const actuales = potenciasPorNota(fundamentales.filter((f) => !esArmonicoDelAcorde(f)));
  const oidas = potenciasPorNota(recientes);
  const oidasAfinadas = potenciasPorNota(recientes.filter(afinada));

  const esperadas = [...new Set(midis.map(claseDeMidi))];
  const faltantes = esperadas.filter((clase) => oidas[clase] < UMBRAL_PRESENTE).map((clase) => NOTAS[clase]);
  const desafinadas = esperadas
    .filter((clase) => oidas[clase] >= UMBRAL_PRESENTE && oidasAfinadas[clase] < UMBRAL_PRESENTE)
    .map((clase) => NOTAS[clase]);
  const sobrantes = NOTAS.filter((_, clase) => !esperadas.includes(clase) && actuales[clase] >= UMBRAL_SOBRANTE);
  const correcta = fundamentales.length > 0 && faltantes.length === 0 && desafinadas.length === 0 && sobrantes.length === 0;
  return { correcta, faltantes, sobrantes, desafinadas };
}

// ---- Seguimiento en el tiempo ----

// La nota debe sostenerse un rato para aprobar, así un ruido suelto no la da por buena
export function crearVerificador(msParaAprobar = MS_PARA_APROBAR, msDeGracia = MS_DE_GRACIA, lecturasMinimas = LECTURAS_PARA_APROBAR) {
  let inicio = null;
  let ultimaCorrecta = null;
  let correctas = 0;
  return {
    agregar(correcta, ahora) {
      if (correcta) {
        if (inicio === null) inicio = ahora;
        ultimaCorrecta = ahora;
        correctas += 1;
        return ahora - inicio >= msParaAprobar && correctas >= lecturasMinimas;
      }
      if (ultimaCorrecta !== null && ahora - ultimaCorrecta > msDeGracia) {
        inicio = null;
        ultimaCorrecta = null;
        correctas = 0;
      }
      return false;
    },
  };
}

// Recibe los buffers del micrófono a medida que llegan y evalúa cada cierto tiempo.
// agregarBuffer devuelve null si todavía no toca analizar, o la lectura:
// { calibrando, hayNota, correcta, aprobado, nivel, oidas, ...detalle }
// cambiarObjetivo pasa a otra nota sin volver a medir el ruido del lugar.
export function crearDetector(objetivoInicial) {
  let objetivo = objetivoInicial;
  let esAcorde = objetivo.tipo === 'acorde';
  let verificador = crearVerificador();
  const perfilRuido = crearPerfilRuido();
  let anillo = null;
  let ordenadas = null; // Se reusan en cada análisis: crear arreglos de 16.000 muestras cada 150 ms pesa
  let reducidas = null;
  let factor = 1;
  let posicion = 0;
  let llenas = 0;
  let ultimoAnalisis = -Infinity;
  let aprobado = false;
  let ultimaClave = null;
  let repeticiones = 0;
  const recientes = [];

  return {
    cambiarObjetivo(nuevo) {
      objetivo = nuevo;
      esAcorde = nuevo.tipo === 'acorde';
      verificador = crearVerificador();
      aprobado = false;
      ultimaClave = null;
      repeticiones = 0;
      recientes.length = 0;
    },

    agregarBuffer(entrada, canales, sampleRate, ahora) {
      const nuevoFactor = Math.max(1, Math.floor(sampleRate / FRECUENCIA_TRABAJO));
      const tamano = VENTANA * nuevoFactor;
      if (!anillo || anillo.length !== tamano) {
        anillo = new Float32Array(tamano);
        ordenadas = new Float32Array(tamano);
        reducidas = new Float32Array(VENTANA);
        factor = nuevoFactor;
        posicion = 0;
        llenas = 0;
      }

      const cantidad = Math.floor(entrada.length / canales);
      for (let i = 0; i < cantidad; i++) {
        anillo[posicion] = entrada[i * canales];
        posicion = (posicion + 1) % tamano;
      }
      llenas = Math.min(tamano, llenas + cantidad);
      if (llenas < tamano || ahora - ultimoAnalisis < MS_ENTRE_ANALISIS) return null;
      ultimoAnalisis = ahora;

      // Ordenamos el anillo: lo más viejo primero
      const muestras = ordenadas;
      muestras.set(anillo.subarray(posicion));
      muestras.set(anillo.subarray(0, posicion), tamano - posicion);

      const nivel = calcularVolumen(muestras);
      const potencias = calcularPotencias(reducir(muestras, factor, reducidas));

      if (!perfilRuido.listo()) {
        perfilRuido.agregar(potencias);
        return { calibrando: true, hayNota: false, correcta: false, aprobado, nivel, oidas: [] };
      }

      const hzPorBin = sampleRate / factor / VENTANA;
      const fundamentales = nivel >= NIVEL_MINIMO ? encontrarFundamentales(potencias, hzPorBin, perfilRuido.potencias()) : [];
      perfilRuido.agregar(potencias); // Después de analizar: la nota actual no debe contar como ruido

      recientes.push(fundamentales);
      if (recientes.length > LECTURAS_MEMORIA_ACORDE) recientes.shift();

      const comparacion = esAcorde
        ? compararAcorde(fundamentales, objetivo.midis, recientes.flat())
        : compararNota(fundamentales, objetivo.midis[0]);
      if (verificador.agregar(comparacion.correcta, ahora)) aprobado = true;

      // Solo se informa lo que se mantiene: un sonido suelto del ambiente no debe aparecer en pantalla
      const clave = esAcorde ? (fundamentales.length > 0 ? 'sonido' : null) : comparacion.notaDetectada;
      repeticiones = clave !== null && clave === ultimaClave ? repeticiones + 1 : 1;
      ultimaClave = clave;

      return {
        ...comparacion,
        calibrando: false,
        hayNota: clave !== null && repeticiones >= LECTURAS_ESTABLES,
        aprobado,
        nivel,
        oidas: fundamentales.map((f) => nombreDeMidi(f.midi)),
        // Las notas oídas, para comparar contra otra nota que la del objetivo (el riff en movimiento)
        fundamentales,
      };
    },
  };
}
