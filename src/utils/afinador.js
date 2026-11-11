// Archivo: src/utils/afinador.js
// Lógica del afinador. Como deteccionSonido.js, es pura: se prueba con audio sintético (ver afinador.test.js).
// Un afinador necesita más precisión que la detección de notas, y el micrófono del celular capta poco
// la fundamental de las cuerdas graves: por eso mide el período de la onda (algoritmo YIN) en lugar de
// buscar picos en el espectro.
import { NIVEL_MINIMO, calcularVolumen, midiAFrecuencia, midiDePosicion, nombreDeMidi, reducir } from './deteccionSonido.js';

const FRECUENCIA_TRABAJO = 12000;
const VENTANA = 2048;
const MS_ENTRE_ANALISIS = 100;
const FRECUENCIA_MIN = 65; // Un poco por debajo de la 6ta muy floja
const FRECUENCIA_MAX = 500; // Un poco por encima de la 1ra muy tensa

const UMBRAL_YIN = 0.12; // Por encima de esto, el sonido no es lo bastante periódico para ser una nota
// Con la fundamental muy débil, la mitad del período también parece un período. Solo se corrige si el doble es mucho mejor.
const MEJORA_PARA_CORREGIR_OCTAVA = 0.5;
const DUDA_PARA_CORREGIR_OCTAVA = 0.02; // Por debajo, la nota ya es limpia: comparar dos valores casi nulos solo da ruido
const FRECUENCIA_MAX_CORREGIDA = 160; // El micrófono solo pierde la fundamental de las cuerdas graves (6ta, 5ta y 4ta)

// Una lectura suelta no cuenta: de las últimas, varias tienen que coincidir
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

// Frecuencia de un bloque de audio, o null si no suena una nota clara.
// `muestras` debe tener al menos VENTANA + sampleRate / FRECUENCIA_MIN + 2 valores.
export function detectarFrecuencia(muestras, sampleRate) {
  const tauMin = Math.max(2, Math.floor(sampleRate / FRECUENCIA_MAX));
  const tauMax = Math.min(Math.ceil(sampleRate / FRECUENCIA_MIN), muestras.length - VENTANA - 2);
  if (tauMax <= tauMin) return null;

  // Diferencia de la señal con ella misma corrida `tau` muestras, normalizada: cerca de 0 significa "se repite"
  const curva = new Float64Array(tauMax + 2);
  curva[0] = 1;
  let acumulado = 0;
  for (let tau = 1; tau <= tauMax + 1; tau++) {
    let diferencia = 0;
    for (let j = 0; j < VENTANA; j++) {
      const resta = muestras[j] - muestras[j + tau];
      diferencia += resta * resta;
    }
    acumulado += diferencia;
    curva[tau] = acumulado > 0 ? (diferencia * tau) / acumulado : 1;
  }

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

  // Interpolación: el período real suele caer entre dos muestras
  const a = curva[tau - 1];
  const b = curva[tau];
  const c = curva[tau + 1];
  const divisor = a - 2 * b + c;
  const ajuste = divisor > 0 ? (a - c) / (2 * divisor) : 0;
  return sampleRate / (tau + ajuste);
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

// Recibe los buffers del micrófono a medida que llegan.
// agregarBuffer devuelve null si todavía no toca analizar, o { frecuencia }, con frecuencia null si no suena nada claro.
export function crearAfinador() {
  let anillo = null;
  let factor = 1;
  let posicion = 0;
  let llenas = 0;
  let ultimoAnalisis = -Infinity;
  let ultimaNota = null;
  const recientes = [];

  return {
    agregarBuffer(entrada, canales, sampleRate, ahora) {
      const nuevoFactor = Math.max(1, Math.floor(sampleRate / FRECUENCIA_TRABAJO));
      const tasa = sampleRate / nuevoFactor;
      const tamano = (VENTANA + Math.ceil(tasa / FRECUENCIA_MIN) + 2) * nuevoFactor;
      if (!anillo || anillo.length !== tamano) {
        anillo = new Float32Array(tamano);
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

      const muestras = new Float32Array(tamano);
      muestras.set(anillo.subarray(posicion));
      muestras.set(anillo.subarray(0, posicion), tamano - posicion);

      const hayVolumen = calcularVolumen(muestras) >= NIVEL_MINIMO;
      recientes.push(hayVolumen ? detectarFrecuencia(reducir(muestras, factor), tasa) : null);
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
