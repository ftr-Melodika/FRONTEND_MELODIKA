// Archivo: src/utils/afinador.js
// Lógica del afinador. Como deteccionSonido.js, es pura: se prueba con audio sintético (ver afinador.test.js).
// Un afinador necesita más precisión que la detección de notas, y el micrófono del celular capta poco
// la fundamental de las cuerdas graves: por eso mide el período de la onda (algoritmo YIN) en lugar de
// buscar picos en el espectro. La FFT sí se usa, pero para calcular YIN rápido (ver correlacionar):
// eso permite trabajar con el doble de muestras por segundo y una ventana el doble de larga.
import { NIVEL_MINIMO, calcularVolumen, fftCompleja, midiAFrecuencia, midiDePosicion, nombreDeMidi, reducir, tablasFft } from './deteccionSonido.js';

const FRECUENCIA_TRABAJO = 24000; // Más muestras por segundo: el período se mide con más detalle
const VENTANA = 3600; // ~150 ms: más períodos promediados, la lectura tiembla menos. Con el corrimiento máximo entra justo en una FFT de 4096
const MS_ENTRE_ANALISIS = 100;
// El audio pasa por un filtro antes de analizarlo. Lo que está fuera de este rango es ruido para el afinador:
// por arriba, soplido y ruido del ambiente (los armónicos que sirven para medir están por debajo);
// por abajo, golpes al celular y zumbidos.
const FILTRO_AGUDOS_HZ = 1000;
const FILTRO_GRAVES_HZ = 50;
const FRECUENCIA_MIN = 65; // Un poco por debajo de la 6ta muy floja
const FRECUENCIA_MAX = 500; // Un poco por encima de la 1ra muy tensa

const UMBRAL_YIN = 0.18; // Por encima de esto, el sonido no es lo bastante periódico para ser una nota
// Con la fundamental muy débil, la mitad del período también parece un período. Solo se corrige si el doble es mucho mejor.
const MEJORA_PARA_CORREGIR_OCTAVA = 0.5;
const DUDA_PARA_CORREGIR_OCTAVA = 0.02; // Por debajo, la nota ya es limpia: comparar dos valores casi nulos solo da ruido
const FRECUENCIA_MAX_CORREGIDA = 160; // El micrófono solo pierde la fundamental de las cuerdas graves (6ta, 5ta y 4ta)

// Una lectura suelta no cuenta: de las últimas, varias tienen que coincidir
// Enfoque: cuando se sabe qué cuerda se afina, además se escucha solo alrededor de su nota.
// Las otras cuerdas siguen sonando un rato después de tocarlas y, mezcladas, la señal no tiene un período
// claro: sin esto, las cuerdas finas (suenan más bajo y se apagan antes) quedan tapadas por las anteriores.
const CENTS_ENFOQUE = 150; // Más lejos que esto de la nota, la cuerda se busca con el análisis general
const Q_ENFOQUE = 8; // Qué tan angosto es el filtro alrededor de la nota. Más angosto separa mejor las otras cuerdas, pero el ruido empieza a parecer una nota
const MUESTRAS_ENFOQUE = 4094; // Con el corrimiento entra justo en una FFT de 4096
const MUESTRAS_POR_PERIODO_ENFOQUE = 75; // Para las cuerdas graves se guardan menos muestras por segundo: mismo detalle por período
// Un ruido filtrado tan angosto se parece a una nota por un par de períodos, pero no se sostiene:
// una nota de verdad se sigue repitiendo igual varios períodos después. Medir ahí además es más preciso.
const PERIODOS_ENFOQUE = 12;
const UMBRAL_SOSTENIDO = 0.25;

const LECTURAS_RECIENTES = 5;
const LECTURAS_COINCIDENTES = 3;
const CENTS_DE_COINCIDENCIA = 50;
const MS_RETENCION = 800; // Cuando la cuerda se apaga, la lectura queda un momento para poder verla

export const CENTS_AFINADA = 5;

const ORDEN_CUERDAS = [6, 5, 4, 3, 2, 1];

// Afinaciones que se pueden elegir en el afinador. `semitonos` dice cuánto se baja o sube cada cuerda
// respecto de la estándar, en el orden de ORDEN_CUERDAS (de la 6ta a la 1ra).
// Ninguna pone seguidas dos cuerdas con la misma nota: la guía avanza sola y la anterior todavía suena.
export const AFINACIONES = [
  { id: 'estandar', nombre: 'Estándar', semitonos: [0, 0, 0, 0, 0, 0] },
  { id: 'drop-d', nombre: 'Drop D', semitonos: [-2, 0, 0, 0, 0, 0] },
  { id: 'medio-tono', nombre: 'Medio tono abajo', semitonos: [-1, -1, -1, -1, -1, -1] },
  { id: 'un-tono', nombre: 'Un tono abajo', semitonos: [-2, -2, -2, -2, -2, -2] },
  { id: 'drop-c', nombre: 'Drop C', semitonos: [-4, -2, -2, -2, -2, -2] },
  { id: 'open-g', nombre: 'Open G', semitonos: [-2, -2, 0, 0, 0, -2] },
  { id: 'open-d', nombre: 'Open D', semitonos: [-2, 0, 0, -1, -2, -2] },
  { id: 'dadgad', nombre: 'DADGAD', semitonos: [-2, 0, 0, 0, -2, -2] },
];

// Las seis cuerdas de una afinación: [{ cuerda, nota, frecuencia }], de la 6ta a la 1ra.
// Con un id desconocido devuelve la estándar.
export function cuerdasDeAfinacion(id) {
  const afinacion = AFINACIONES.find((a) => a.id === id) ?? AFINACIONES[0];
  return ORDEN_CUERDAS.map((cuerda, i) => {
    const midi = midiDePosicion(cuerda, 0) + afinacion.semitonos[i];
    return { cuerda, nota: nombreDeMidi(midi), frecuencia: midiAFrecuencia(midi) };
  });
}

export const CUERDAS_AFINADOR = cuerdasDeAfinacion('estandar');

const centsEntre = (frecuencia, referencia) => 1200 * Math.log2(frecuencia / referencia);

function mediana(valores) {
  const ordenados = [...valores].sort((a, b) => a - b);
  return ordenados[Math.floor(ordenados.length / 2)];
}

// El mínimo más cercano a `tau`, bajando por la curva hacia cualquiera de los dos lados
function buscarMinimo(curva, tau) {
  let actual = tau;
  while (actual + 1 < curva.length && curva[actual + 1] < curva[actual]) actual += 1;
  while (actual - 1 > 0 && curva[actual - 1] < curva[actual]) actual -= 1;
  return actual;
}

// Correlación del principio del bloque (VENTANA muestras) con el bloque entero corrido `tau` muestras,
// para tau de 0 a `hasta`. Hacerla directo cuesta VENTANA × tau multiplicaciones; con la FFT
// (teorema de Wiener-Khinchin) son dos transformadas. Las dos señales son reales: van juntas en una sola
// transformada compleja (ventana como parte real, bloque como imaginaria) y después se separan.
const buffersCorrelacion = new Map();

function correlacionar(muestras, ventana, hasta) {
  let n = 1;
  while (n < muestras.length) n <<= 1;
  let buffers = buffersCorrelacion.get(n);
  if (!buffers) {
    buffers = { tablas: tablasFft(2 * n), re: new Float64Array(n), im: new Float64Array(n), re2: new Float64Array(n), im2: new Float64Array(n) };
    buffersCorrelacion.set(n, buffers);
  }
  const { tablas, re, im, re2, im2 } = buffers;
  for (let i = 0; i < n; i++) {
    re[i] = i < ventana ? muestras[i] : 0;
    im[i] = i < muestras.length ? muestras[i] : 0;
  }
  fftCompleja(re, im, tablas);

  // Se separan las dos transformadas (A de la ventana, B del bloque) y se arma conj(A)·B.
  // Se guarda conjugado: la transformada inversa sale de transformar el conjugado.
  for (let k = 0; k < n; k++) {
    const m = (n - k) % n;
    const ar = (re[k] + re[m]) / 2;
    const ai = (im[k] - im[m]) / 2;
    const br = (im[k] + im[m]) / 2;
    const bi = (re[m] - re[k]) / 2;
    re2[k] = ar * br + ai * bi;
    im2[k] = ai * br - ar * bi;
  }
  fftCompleja(re2, im2, tablas);

  const correlacion = new Float64Array(hasta + 1);
  for (let tau = 0; tau <= hasta; tau++) correlacion[tau] = re2[tau] / n;
  return correlacion;
}

// Cuánto se parece la señal a ella misma corrida `tau` muestras, para tau de 0 a `tauMax` + 1.
// Devuelve { diferencias, curva }: `curva` es la diferencia normalizada, cerca de 0 significa "se repite".
function medirRepeticion(muestras, ventana, tauMax) {
  // Diferencia de la señal con ella misma corrida `tau` muestras: Σ (x[j] - x[j+tau])².
  // Desarrollando el cuadrado queda energía de la ventana + energía de la ventana corrida - 2 × correlación.
  const correlacion = correlacionar(muestras, ventana, tauMax + 1);
  const diferencias = new Float64Array(tauMax + 2);
  let energiaCorrida = correlacion[0]; // Energía de muestras[tau .. tau + ventana)
  for (let tau = 1; tau <= tauMax + 1; tau++) {
    const sale = muestras[tau - 1];
    const entra = muestras[tau + ventana - 1];
    energiaCorrida += entra * entra - sale * sale;
    diferencias[tau] = Math.max(0, correlacion[0] + energiaCorrida - 2 * correlacion[tau]);
  }

  const curva = new Float64Array(tauMax + 2);
  curva[0] = 1;
  let acumulado = 0;
  for (let tau = 1; tau <= tauMax + 1; tau++) {
    acumulado += diferencias[tau];
    curva[tau] = acumulado > 0 ? (diferencias[tau] * tau) / acumulado : 1;
  }
  return { diferencias, curva };
}

// Interpolación: el período real suele caer entre dos muestras.
// Sobre la diferencia sin normalizar: la normalización tuerce la curva y corre el mínimo.
function afinarMinimo(diferencias, tau) {
  const a = diferencias[tau - 1];
  const b = diferencias[tau];
  const c = diferencias[tau + 1];
  const divisor = a - 2 * b + c;
  return tau + (divisor > 0 ? (a - c) / (2 * divisor) : 0);
}

// Frecuencia de un bloque de audio, o null si no suena una nota clara.
// `muestras` debe tener al menos VENTANA + sampleRate / FRECUENCIA_MIN + 2 valores.
export function detectarFrecuencia(muestras, sampleRate) {
  const tauMin = Math.max(2, Math.floor(sampleRate / FRECUENCIA_MAX));
  const tauMax = Math.min(Math.ceil(sampleRate / FRECUENCIA_MIN), muestras.length - VENTANA - 2);
  if (tauMax <= tauMin) return null;

  const { diferencias, curva } = medirRepeticion(muestras, VENTANA, tauMax);

  let primero = -1;
  for (let tau = tauMin; tau <= tauMax; tau++) {
    if (curva[tau] < UMBRAL_YIN) {
      primero = tau;
      break;
    }
  }
  if (primero === -1) return null;

  let tau = buscarMinimo(curva, primero);
  if (tau * 2 <= tauMax && sampleRate / (tau * 2) <= FRECUENCIA_MAX_CORREGIDA) {
    const doble = buscarMinimo(curva, tau * 2);
    if (curva[tau] > DUDA_PARA_CORREGIR_OCTAVA && curva[doble] < curva[tau] * MEJORA_PARA_CORREGIR_OCTAVA) tau = doble;
  }
  if (tau < 1 || tau > tauMax) return null;

  return sampleRate / afinarMinimo(diferencias, tau);
}

// Como detectarFrecuencia, pero solo busca cerca de `objetivo` (hasta CENTS_ENFOQUE para cada lado).
// `muestras` ya tiene que venir filtrado alrededor de esa nota.
export function detectarCercaDe(muestras, sampleRate, objetivo) {
  const margen = 2 ** (CENTS_ENFOQUE / 1200);
  const tauMin = Math.max(2, Math.floor(sampleRate / (objetivo * margen)));
  const tauMax = Math.ceil((sampleRate * margen) / objetivo);
  const hasta = PERIODOS_ENFOQUE * tauMax + 1;
  const ventana = muestras.length - hasta - 2;
  if (ventana < 2 * tauMax) return null;

  const { diferencias, curva } = medirRepeticion(muestras, ventana, hasta);

  let tau = tauMin;
  for (let t = tauMin; t <= tauMax; t++) if (curva[t] < curva[tau]) tau = t;
  // En el borde no es un mínimo de verdad: la nota está más lejos de lo que se busca acá
  if (tau === tauMin || tau === tauMax || curva[tau] >= UMBRAL_YIN) return null;
  const periodo = afinarMinimo(diferencias, tau);

  const esperado = Math.round(periodo * PERIODOS_ENFOQUE);
  const lejos = buscarMinimo(curva, esperado);
  if (Math.abs(lejos - esperado) > periodo / 4 || lejos > hasta - 1 || curva[lejos] >= UMBRAL_SOSTENIDO) return null;
  return (sampleRate * PERIODOS_ENFOQUE) / afinarMinimo(diferencias, lejos);
}

// Compara con la cuerda elegida o, sin elegir, con la más cercana.
// Devuelve { cuerda, nota, frecuenciaObjetivo, cents, estado }; estado: 'afinada' | 'baja' | 'alta'.
export function compararConCuerda(frecuencia, cuerdaElegida = null) {
  const distancia = (c) => Math.abs(centsEntre(frecuencia, c.frecuencia));
  const objetivo = CUERDAS_AFINADOR.find((c) => c.cuerda === cuerdaElegida)
    ?? CUERDAS_AFINADOR.reduce((a, b) => (distancia(b) < distancia(a) ? b : a));

  // Con una cuerda elegida se ignora la octava: el micrófono a veces capta el armónico, no la nota grave
  const crudos = centsEntre(frecuencia, objetivo.frecuencia);
  const cents = cuerdaElegida === null ? crudos : crudos - 1200 * Math.round(crudos / 1200);

  let estado = 'afinada';
  if (cents < -CENTS_AFINADA) estado = 'baja';
  else if (cents > CENTS_AFINADA) estado = 'alta';
  return { cuerda: objetivo.cuerda, nota: objetivo.nota, frecuenciaObjetivo: objetivo.frecuencia, cents: Math.round(cents), estado };
}

// Filtro de segundo orden (biquad, Butterworth). Guarda su estado para filtrar el audio de corrido,
// a medida que llega, sin cortes entre un buffer y el siguiente.
// tipo: 'agudos' (los saca), 'graves' (los saca) o 'banda' (deja pasar solo alrededor de `frecuencia`; más angosto con más `q`).
function crearFiltro(tipo, frecuencia, sampleRate, q = Math.SQRT1_2) {
  const w = (2 * Math.PI * frecuencia) / sampleRate;
  const alfa = Math.sin(w) / (2 * q);
  const cos = Math.cos(w);
  const a0 = 1 + alfa;
  let b0 = alfa / a0;
  let b1 = 0;
  let b2 = -b0;
  if (tipo !== 'banda') {
    b1 = (tipo === 'agudos' ? 1 - cos : -(1 + cos)) / a0;
    b0 = Math.abs(b1) / 2;
    b2 = b0;
  }
  const a1 = (-2 * cos) / a0;
  const a2 = (1 - alfa) / a0;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  return (x) => {
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
}

// Copia de un anillo con las muestras en orden, de la más vieja a la más nueva
function desenrollar(anillo, posicion) {
  const muestras = new Float32Array(anillo.length);
  muestras.set(anillo.subarray(posicion));
  muestras.set(anillo.subarray(0, posicion), anillo.length - posicion);
  return muestras;
}

// Recibe los buffers del micrófono a medida que llegan.
// agregarBuffer devuelve null si todavía no toca analizar, o { frecuencia }, con frecuencia null si no suena nada claro.
// apuntar(frecuencia) avisa qué nota se está afinando (null: ninguna): se la busca aunque suenen otras cuerdas,
// y lo que se detecte se informa en la octava de esa nota.
export function crearAfinador() {
  let anillo = null;
  let factor = 1;
  let filtrarAgudos = null;
  let filtrarGraves = null;
  let posicion = 0;
  let llenas = 0;
  let ultimoAnalisis = -Infinity;
  let ultimaNota = null;
  let objetivo = null;
  let enfoque = null; // Segundo anillo, solo con lo que suena alrededor de `objetivo`
  let suma = 0;
  let sumadas = 0;
  const recientes = [];

  return {
    apuntar(frecuencia) {
      const nuevo = frecuencia > 0 ? frecuencia : null;
      if (nuevo === objetivo) return;
      objetivo = nuevo;
      enfoque = null;
      // Lo que se venía leyendo era de otra cuerda
      recientes.length = 0;
      ultimaNota = null;
    },

    agregarBuffer(entrada, canales, sampleRate, ahora) {
      const nuevoFactor = Math.max(1, Math.round(sampleRate / FRECUENCIA_TRABAJO));
      const tasa = sampleRate / nuevoFactor;
      const tamano = (VENTANA + Math.ceil(tasa / FRECUENCIA_MIN) + 2) * nuevoFactor;
      if (!anillo || anillo.length !== tamano) {
        anillo = new Float32Array(tamano);
        factor = nuevoFactor;
        filtrarAgudos = crearFiltro('agudos', FILTRO_AGUDOS_HZ, sampleRate);
        filtrarGraves = crearFiltro('graves', FILTRO_GRAVES_HZ, sampleRate);
        posicion = 0;
        llenas = 0;
        enfoque = null;
      }
      if (objetivo && !enfoque) {
        const paso = Math.max(1, Math.floor(tasa / objetivo / MUESTRAS_POR_PERIODO_ENFOQUE));
        enfoque = {
          // Dos filtros seguidos: cortan mucho más lo que está lejos de la nota
          filtros: [crearFiltro('banda', objetivo, tasa, Q_ENFOQUE), crearFiltro('banda', objetivo, tasa, Q_ENFOQUE)],
          paso,
          tasa: tasa / paso,
          salteadas: 0,
          anillo: new Float32Array(MUESTRAS_ENFOQUE),
          posicion: 0,
          llenas: 0,
        };
        suma = 0;
        sumadas = 0;
      }

      const cantidad = Math.floor(entrada.length / canales);
      for (let i = 0; i < cantidad; i++) {
        const muestra = filtrarGraves(filtrarAgudos(entrada[i * canales]));
        anillo[posicion] = muestra;
        posicion = (posicion + 1) % tamano;
        if (!enfoque) continue;
        // El enfoque trabaja a la frecuencia de trabajo, o menos para las notas graves
        suma += muestra;
        sumadas += 1;
        if (sumadas < factor) continue;
        const filtrada = enfoque.filtros[1](enfoque.filtros[0](suma / factor));
        suma = 0;
        sumadas = 0;
        enfoque.salteadas += 1;
        if (enfoque.salteadas < enfoque.paso) continue;
        enfoque.salteadas = 0;
        enfoque.anillo[enfoque.posicion] = filtrada;
        enfoque.posicion = (enfoque.posicion + 1) % MUESTRAS_ENFOQUE;
        enfoque.llenas = Math.min(MUESTRAS_ENFOQUE, enfoque.llenas + 1);
      }
      llenas = Math.min(tamano, llenas + cantidad);
      if (llenas < tamano || ahora - ultimoAnalisis < MS_ENTRE_ANALISIS) return null;
      ultimoAnalisis = ahora;

      const muestras = desenrollar(anillo, posicion);
      let lectura = null;
      if (calcularVolumen(muestras) >= NIVEL_MINIMO) {
        if (enfoque && enfoque.llenas === MUESTRAS_ENFOQUE) {
          lectura = detectarCercaDe(desenrollar(enfoque.anillo, enfoque.posicion), enfoque.tasa, objetivo);
        }
        if (lectura === null) {
          lectura = detectarFrecuencia(reducir(muestras, factor), tasa);
          // En la octava de la nota buscada: el micrófono a veces capta el armónico de una cuerda grave
          if (lectura !== null && objetivo) lectura /= 2 ** Math.round(Math.log2(lectura / objetivo));
        }
      }
      recientes.push(lectura);
      if (recientes.length > LECTURAS_RECIENTES) recientes.shift();

      const validas = recientes.filter((f) => f !== null);
      if (validas.length >= LECTURAS_COINCIDENTES) {
        const centro = mediana(validas);
        const coincidentes = validas.filter((f) => Math.abs(centsEntre(f, centro)) <= CENTS_DE_COINCIDENCIA);
        if (coincidentes.length >= LECTURAS_COINCIDENTES) {
          ultimaNota = { frecuencia: mediana(coincidentes), momento: ahora };
          return { frecuencia: ultimaNota.frecuencia };
        }
      }
      if (ultimaNota && ahora - ultimaNota.momento <= MS_RETENCION) return { frecuencia: ultimaNota.frecuencia };
      ultimaNota = null;
      return { frecuencia: null };
    },
  };
}
