// Archivo: src/utils/ritmo.js
// Ejercicios de tempo: tocar a tiempo con el metrónomo. Es lógica pura: se prueba en ritmo.test.js.
//
// Una práctica de ritmo (practica.tipo = 'ritmo') viene del backend así:
//   { tipo: 'ritmo', nombre, compas: 4, subdivision: 1, patron?: [1,0,1,1,…],
//     etapas: [{ bpm: 60, compases: 4 }, …], cuenta?: 1, clicQueDesaparece?: false, aprobar?: 0.75 }
// - compas: pulsos por compás (4 en 4/4, 3 en un vals, 6 en 6/8 contando de a corchea).
// - subdivision: golpes posibles por pulso (1 = negras, 2 = corcheas).
// - patron: qué partes del compás se tocan (1) y cuáles no (0). Sin patrón se tocan todas.
// - etapas: el tempo y cuántos compases dura cada uno (una "escalera de tempo" son varias etapas).
// - cuenta: compases de cuenta antes de empezar (solo clic, no se toca).
// - clicQueDesaparece: el metrónomo se calla un compás de cada dos.
// - aprobar: proporción de golpes a tiempo para aprobar.

const BPM_MIN = 30;
const BPM_MAX = 240;
const APROBAR_POR_DEFECTO = 0.75;

const esEntero = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const esNumero = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

// Devuelve la configuración validada o null. Un dato inválido se trata como si no existiera.
export function obtenerRitmo(leccion) {
  const p = leccion?.practica;
  if (p?.tipo !== 'ritmo') return null;
  if (!esEntero(p.compas, 1, 12)) return null;
  const subdivision = p.subdivision === undefined ? 1 : p.subdivision;
  if (!esEntero(subdivision, 1, 4)) return null;
  const partes = p.compas * subdivision;
  const patron = p.patron === undefined ? Array(partes).fill(1) : p.patron;
  if (!Array.isArray(patron) || patron.length !== partes || patron.some((x) => x !== 0 && x !== 1) || !patron.includes(1)) return null;
  if (!Array.isArray(p.etapas) || p.etapas.length === 0) return null;
  if (p.etapas.some((e) => !esNumero(e?.bpm, BPM_MIN, BPM_MAX) || !esEntero(e?.compases, 1, 200))) return null;
  const cuenta = p.cuenta === undefined ? 1 : p.cuenta;
  if (!esEntero(cuenta, 0, 4)) return null;
  return {
    nombre: typeof p.nombre === 'string' && p.nombre.trim() ? p.nombre : 'Ritmo',
    compas: p.compas,
    subdivision,
    patron,
    etapas: p.etapas.map((e) => ({ bpm: e.bpm, compases: e.compases })),
    cuenta,
    clicQueDesaparece: p.clicQueDesaparece === true,
    aprobar: esNumero(p.aprobar, 0.1, 1) ? p.aprobar : APROBAR_POR_DEFECTO,
  };
}

// Margen para considerar un golpe "a tiempo", según lo que dura cada parte del compás.
// A 60 BPM en negras son 105 ms; en corcheas rápidas se achica.
export const toleranciaDeParte = (msParte) => Math.min(105, Math.max(45, msParte * 0.3));
// Hasta dónde se busca el golpe que corresponde a una parte (más lejos, es un golpe de más)
const ventanaDeParte = (msParte) => Math.min(250, msParte * 0.5);

// Arma la línea de tiempo del ejercicio, en ms desde que arranca la cuenta:
// - clics: un clic por pulso ({ t, fuerte, audible, cuenta, pulso, compas }).
// - golpes: los golpes que hay que tocar ({ t, parte, compas, etapa, tolerancia, ventana }).
// - partes: todas las partes del compás, para resaltar la que suena ({ t, parte }).
export function armarLineaDeTiempo(config) {
  const { compas, subdivision, patron, etapas, cuenta, clicQueDesaparece } = config;
  const clics = [];
  const golpes = [];
  const partes = [];
  let t = 0;

  const msCuenta = 60000 / etapas[0].bpm;
  for (let i = 0; i < cuenta * compas; i++) {
    clics.push({ t, fuerte: i % compas === 0, audible: true, cuenta: true, pulso: i % compas, compas: -1, bpm: etapas[0].bpm, etapa: 0 });
    t += msCuenta;
  }

  let indiceCompas = 0;
  etapas.forEach((etapa, indiceEtapa) => {
    const msPulso = 60000 / etapa.bpm;
    const msParte = msPulso / subdivision;
    for (let c = 0; c < etapa.compases; c++) {
      const callado = clicQueDesaparece && indiceCompas % 2 === 1;
      for (let pulso = 0; pulso < compas; pulso++) {
        clics.push({ t: t + pulso * msPulso, fuerte: pulso === 0, audible: !callado, cuenta: false, pulso, compas: indiceCompas, bpm: etapa.bpm, etapa: indiceEtapa });
      }
      for (let parte = 0; parte < compas * subdivision; parte++) {
        const tParte = t + parte * msParte;
        partes.push({ t: tParte, parte });
        if (patron[parte]) {
          golpes.push({ t: tParte, parte, compas: indiceCompas, etapa: indiceEtapa, tolerancia: toleranciaDeParte(msParte), ventana: ventanaDeParte(msParte) });
        }
      }
      t += compas * msPulso;
      indiceCompas++;
    }
  });
  return { clics, golpes, partes, inicio: cuenta * compas * msCuenta, duracion: t };
}

// ───────────────────────── Detección de golpes ─────────────────────────

// Filtro pasa-bajos de 2do orden (Butterworth), para quedarse con el cuerpo del sonido de la guitarra
function crearPasaBajos(frecuenciaCorte, sampleRate) {
  const w = (2 * Math.PI * frecuenciaCorte) / sampleRate;
  const alfa = Math.sin(w) / Math.SQRT2;
  const cos = Math.cos(w);
  const a0 = 1 + alfa;
  const b0 = (1 - cos) / 2 / a0;
  const b1 = (1 - cos) / a0;
  const a1 = (-2 * cos) / a0;
  const a2 = (1 - alfa) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = b0 * x + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

// Filtro pasa-altos de 2do orden (Butterworth)
function crearPasaAltos(frecuenciaCorte, sampleRate) {
  const w = (2 * Math.PI * frecuenciaCorte) / sampleRate;
  const alfa = Math.sin(w) / Math.SQRT2;
  const cos = Math.cos(w);
  const a0 = 1 + alfa;
  const b0 = (1 + cos) / 2 / a0;
  const b1 = -(1 + cos) / a0;
  const a1 = (-2 * cos) / a0;
  const a2 = (1 - alfa) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = b0 * x + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

const MS_BLOQUE = 5; // Resolución de la detección
// El volumen se mide en una ventana de 20 ms (4 bloques), más larga que una vibración de la cuerda
// más grave (12 ms): con ventanas más cortas el volumen sube y baja con la propia onda y una
// cuerda que sigue sonando parece una seguidilla de golpes.
const BLOQUES_VENTANA = 4;
const BLOQUES_HISTORIA = 8; // 40 ms: con qué se compara cada ventana para ver si el sonido "subió de golpe"

// Qué parte del sonido se escucha para encontrar los golpes:
// - agudos: el "chasquido" del ataque (púa, rasgueo, aplauso). Una cuerda que sigue sonando casi
//   no tiene agudos, así que cada golpe nuevo se destaca aunque la anterior siga sonando fuerte.
//   Es la mejor opción, pero el clic del metrónomo también es agudo: solo sirve sin clic.
// - graves: el cuerpo del sonido, por debajo de 900 Hz. Se usa cuando suena el clic, que casi no
//   pasa el filtro. Detecta peor un golpe sobre una cuerda que sigue sonando.
// `piso` es el volumen mínimo de un golpe (bajo: en iOS el micrófono llega sin ajuste automático) y
// `saltoDb` cuánto tiene que subir de golpe. En graves el salto de una púa sobre una cuerda que
// sigue sonando es chico, así que el umbral es menor.
const BANDAS = {
  agudos: { crear: (sr) => crearPasaAltos(1500, sr), piso: 0.0008, saltoDb: 5 },
  graves: { crear: (sr) => crearPasaBajos(900, sr), piso: 0.004, saltoDb: 3 },
};

// Detecta el comienzo de cada golpe en el audio del micrófono: un salto brusco de energía.
// agregar(muestras, tInicioMs, sampleRate) recibe audio mono y devuelve los tiempos (ms) de los
// golpes nuevos. nivel() devuelve el volumen reciente (0 a 1), para mostrar un medidor.
export function crearDetectorGolpes({ banda = 'graves', saltoDb = BANDAS[banda].saltoDb, piso = BANDAS[banda].piso, refractarioMs = 70 } = {}) {
  let sampleRate = null;
  let filtros = null;
  let tamBloque = 0;
  let suma = 0;
  let sumaCruda = 0;
  let cuenta = 0;
  let inicioBloqueMs = null;
  const ventana = []; // Energía de los últimos bloques
  const historia = []; // Energía de las últimas ventanas
  let ultimoGolpe = -Infinity;
  let nivelReciente = 0;
  const factorSalto = 10 ** (saltoDb / 10);
  const pisoEnergia = piso * piso;

  return {
    nivel: () => nivelReciente,
    agregar(muestras, tInicioMs, sr) {
      if (sr !== sampleRate) {
        sampleRate = sr;
        // Dos filtros en cadena: con 'graves', el clic de 3-4 kHz queda unos 40 dB más bajo
        const f1 = BANDAS[banda].crear(sr);
        const f2 = BANDAS[banda].crear(sr);
        filtros = (x) => f2(f1(x));
        tamBloque = Math.max(1, Math.round((sr * MS_BLOQUE) / 1000));
        suma = 0;
        sumaCruda = 0;
        cuenta = 0;
        ventana.length = 0;
        historia.length = 0;
      }
      const golpes = [];
      const msPorMuestra = 1000 / sampleRate;
      nivelReciente *= 0.5; // El medidor baja solo si no hay sonido
      for (let i = 0; i < muestras.length; i++) {
        if (cuenta === 0) inicioBloqueMs = tInicioMs + i * msPorMuestra;
        const x = muestras[i];
        const y = filtros(x);
        suma += y * y;
        sumaCruda += x * x;
        cuenta++;
        if (cuenta < tamBloque) continue;
        ventana.push(suma / cuenta);
        if (ventana.length > BLOQUES_VENTANA) ventana.shift();
        // El medidor muestra el volumen de todo el sonido, no solo de la banda que se escucha
        nivelReciente = Math.max(nivelReciente, Math.sqrt(sumaCruda / cuenta));
        suma = 0;
        sumaCruda = 0;
        cuenta = 0;
        const energia = ventana.reduce((s, e) => s + e, 0) / ventana.length;
        const minimoReciente = historia.length ? Math.min(...historia) : Infinity;
        const subio = energia > pisoEnergia && energia > minimoReciente * factorSalto;
        if (subio && inicioBloqueMs - ultimoGolpe >= refractarioMs) {
          golpes.push(inicioBloqueMs);
          ultimoGolpe = inicioBloqueMs;
        }
        historia.push(energia);
        if (historia.length > BLOQUES_HISTORIA) historia.shift();
      }
      return golpes;
    },
  };
}

// ───────────────────────── Evaluación ─────────────────────────

const mediana = (valores) => {
  if (!valores.length) return 0;
  const orden = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[medio] : (orden[medio - 1] + orden[medio]) / 2;
};

// Entre que suena el clic y el celular registra el golpe pasa un tiempo que depende del equipo
// (parlante, micrófono, auriculares bluetooth…). No se puede medir de antemano, así que se toma
// el desfase típico de cada intento y se mide cuánto se separa cada golpe de ese desfase.
// Así se evalúa la regularidad, que es lo que importa al aprender; tocar siempre un poco antes
// o un poco después del clic no se puede distinguir de ese retraso del equipo.
const LATENCIA_MIN = -80;
export const LATENCIA_MAX = 250;
// Desde cuánto corrimiento acumulado se avisa que el alumno se apura o se atrasa
const MS_TENDENCIA = 45;

// esperados: los golpes de armarLineaDeTiempo. detectados: tiempos de crearDetectorGolpes, en la
// misma escala. Devuelve { total, aciertos, deMas, aprobado, desviacionMs, tendencia, golpes }
// donde cada golpe es { t, desfase (ms, o null si no se tocó), aTiempo }.
export function evaluarGolpes(esperados, detectados, { aprobar = APROBAR_POR_DEFECTO } = {}) {
  const ordenados = [...detectados].sort((a, b) => a - b);
  const usados = new Set();

  // A cada golpe esperado le toca el detectado más cercano dentro de su ventana, sin repetir
  const crudos = esperados.map((g) => {
    let mejor = -1;
    let distancia = Infinity;
    for (let j = 0; j < ordenados.length; j++) {
      if (usados.has(j)) continue;
      const d = ordenados[j] - g.t;
      if (d < -g.ventana - LATENCIA_MAX) continue;
      if (d > g.ventana + LATENCIA_MAX) break;
      if (Math.abs(d) < Math.abs(distancia)) {
        mejor = j;
        distancia = d;
      }
    }
    if (mejor >= 0) usados.add(mejor);
    return mejor >= 0 ? distancia : null;
  });

  const tocados = crudos.filter((d) => d !== null);
  const latencia = Math.min(LATENCIA_MAX, Math.max(LATENCIA_MIN, mediana(tocados)));

  const golpes = esperados.map((g, i) => {
    const desfase = crudos[i] === null ? null : crudos[i] - latencia;
    const dentro = desfase !== null && Math.abs(desfase) <= g.ventana;
    return { t: g.t, desfase: dentro ? desfase : null, aTiempo: dentro && Math.abs(desfase) <= g.tolerancia };
  });

  const aciertos = golpes.filter((g) => g.aTiempo).length;
  const conDesfase = golpes.filter((g) => g.desfase !== null);
  const desviacionMs = conDesfase.length ? Math.round(Math.sqrt(conDesfase.reduce((s, g) => s + g.desfase ** 2, 0) / conDesfase.length)) : null;

  // Golpes que no corresponden a ninguna parte (dentro del tiempo del ejercicio)
  const desde = esperados.length ? esperados[0].t - esperados[0].ventana + latencia : 0;
  const hasta = esperados.length ? esperados[esperados.length - 1].t + esperados[esperados.length - 1].ventana + latencia : 0;
  const deMas = ordenados.filter((t, j) => !usados.has(j) && t >= desde && t <= hasta).length;

  return {
    total: esperados.length,
    aciertos,
    deMas,
    aprobado: esperados.length > 0 && aciertos / esperados.length >= aprobar,
    desviacionMs,
    tendencia: tendencia(conDesfase),
    golpes,
  };
}

// ¿Los golpes se van adelantando (se apura) o atrasando a lo largo del ejercicio?
// Pendiente de la recta que mejor sigue los desfases, multiplicada por lo que dura el ejercicio.
function tendencia(golpes) {
  if (golpes.length < 6) return 'parejo';
  const n = golpes.length;
  const mx = golpes.reduce((s, g) => s + g.t, 0) / n;
  const my = golpes.reduce((s, g) => s + g.desfase, 0) / n;
  let num = 0;
  let den = 0;
  golpes.forEach((g) => {
    num += (g.t - mx) * (g.desfase - my);
    den += (g.t - mx) ** 2;
  });
  if (den === 0) return 'parejo';
  const corrimiento = (num / den) * (golpes[n - 1].t - golpes[0].t);
  if (corrimiento < -MS_TENDENCIA) return 'apura';
  if (corrimiento > MS_TENDENCIA) return 'atrasa';
  return 'parejo';
}

// Texto de cada parte del compás para mostrar el patrón: "1 y 2 y" en corcheas, "1 e y a" en semicorcheas
export function cuentaDelCompas(compas, subdivision) {
  const sufijos = { 1: [], 2: ['y'], 3: ['y', 'a'], 4: ['e', 'y', 'a'] }[subdivision];
  return Array.from({ length: compas }, (_, i) => [String(i + 1), ...sufijos]).flat();
}

// ───────────────────────── Luces del metrónomo ─────────────────────────

export const OPACIDAD_LUZ_APAGADA = 0.18;
const MS_DESTELLO_LUZ = 150;

// Cómo se prende una luz a lo largo de un ciclo (0 a 1): apagada, y en cada destello se prende
// de golpe y se apaga en `duracion`. Es el inputRange/outputRange de una interpolación de Animated.
export function curvaDeLuz(destellos, duracion) {
  const puntos = [[0, OPACIDAD_LUZ_APAGADA]];
  const ultimo = () => puntos[puntos.length - 1][0];
  [...destellos].sort((a, b) => a - b).forEach((f) => {
    if (f === 0) puntos[0] = [0, 1];
    else {
      const antes = f - 1e-4;
      if (antes > ultimo()) puntos.push([antes, OPACIDAD_LUZ_APAGADA]);
      if (f > ultimo()) puntos.push([f, 1]);
    }
    const fin = Math.min(f + duracion, 1);
    if (fin > ultimo()) puntos.push([fin, OPACIDAD_LUZ_APAGADA]);
  });
  if (ultimo() < 1) puntos.push([1, OPACIDAD_LUZ_APAGADA]);
  return { inputRange: puntos.map((p) => p[0]), outputRange: puntos.map((p) => p[1]) };
}

// Divide los clics en tramos que se repiten igual (mismo tempo, y la cuenta aparte), para animar
// las luces con un loop nativo: así se prenden a tiempo aunque JavaScript esté ocupado con el
// micrófono. Cada tramo: { inicio (ms desde la cuenta), msCiclo, ciclos, luces: [curvaDeLuz por pulso] }.
// Un ciclo es un compás; con el clic que desaparece son dos (uno con luces y otro sin).
export function tramosDeLuces(linea, compas) {
  const compases = [];
  for (let i = 0; i < linea.clics.length; i += compas) compases.push(linea.clics.slice(i, i + compas));

  const grupos = [];
  compases.forEach((c) => {
    const ultimo = grupos[grupos.length - 1];
    const mismo = ultimo && ultimo[0][0].bpm === c[0].bpm && ultimo[0][0].cuenta === c[0].cuenta;
    if (mismo) ultimo.push(c);
    else grupos.push([c]);
  });

  return grupos.map((grupo) => {
    const msPulso = 60000 / grupo[0][0].bpm;
    const alterna = grupo.length > 1 && grupo.some((c) => c[0].audible !== grupo[0][0].audible);
    const porCiclo = alterna ? 2 : 1;
    const pulsosCiclo = porCiclo * compas;
    const luces = Array.from({ length: compas }, (_, pulso) => {
      const destellos = [];
      for (let k = 0; k < porCiclo; k++) if (grupo[k][0].audible || !alterna) destellos.push((k * compas + pulso) / pulsosCiclo);
      return curvaDeLuz(destellos, Math.min(MS_DESTELLO_LUZ, msPulso * 0.4) / (msPulso * pulsosCiclo));
    });
    return { inicio: grupo[0][0].t, msCiclo: msPulso * pulsosCiclo, ciclos: Math.ceil(grupo.length / porCiclo), luces, cuenta: grupo[0][0].cuenta };
  });
}
