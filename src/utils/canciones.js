// Archivo: src/utils/canciones.js
// Lógica de la sección Canciones. Es pura: se prueba en canciones.test.js.
// Una canción se puede aprender (cada acorde, después los cambios, después tocarla) o tocar
// directamente a tempo, con los acordes avanzando por el mástil (el "riff en movimiento").
//
// Las canciones vienen del backend (GET /api/canciones). Cada compás de `progresion` es
// { acordes: 'Em C', rasgueo: 'D-D-UUDD' }: el rasgueo son 8 corcheas (1 y 2 y 3 y 4 y) con
// D = abajo, U = arriba, X = apagado y - = sin tocar. Con 16 letras son semicorcheas (1 e y a 2 e y a…).
// Con dos acordes, la primera mitad es del primero y la segunda del segundo, salvo que un "|"
// marque dónde cambia: 'DD|UUDDDU' es 2 corcheas de Em y 6 de C.
import { midiDePosicion } from './deteccionSonido.js';
import { cuentaDelCompas } from './ritmo.js';
import { normalizarTexto as normalizar } from './texto.js';
import { secuenciaDePractica } from './riff.js';
import { FORMAS } from '../data/canciones.js';

// Los 8 acordes del curso "Acordes": una canción solo con estos es fácil
export const ACORDES_INICIALES = ['Em', 'Am', 'D', 'A', 'E', 'C', 'G', 'B7'];

// Los acordes de cada compás: { acordes: 'Em C' } -> ['Em', 'C']
export const acordesDeCompas = (compas) => (typeof compas === 'string' ? compas : compas.acordes).split(' ').filter(Boolean);

// ───────────────────────── Rasgueo ─────────────────────────

export const CORCHEAS_POR_COMPAS = 8;
const FLECHAS = { D: '↓', U: '↑', X: 'X' };
export const CUENTA_RASGUEO = cuentaDelCompas(4, 2); // 1 y 2 y 3 y 4 y

// Cuántas partes tiene el compás: 8 (corcheas) o 16 (semicorcheas), sin contar los "|"
export const partesDelRasgueo = (patron) => (patron || '').replace(/\|/g, '').length || CORCHEAS_POR_COMPAS;
// La cuenta de cada parte: "1 y 2 y…" en corcheas, "1 e y a 2 e y a…" en semicorcheas
export const cuentaDeRasgueo = (patron) => cuentaDelCompas(4, partesDelRasgueo(patron) / 4);

// 'D-DU-UDU' -> ['↓', null, '↓', '↑', null, '↑', '↓', '↑'] (null = la mano pasa sin tocar).
// La marca de cambio de acorde ("|") no es un golpe: se saltea.
export const golpesDeRasgueo = (patron) => [...(patron || '').replace(/\|/g, '')].map((letra) => FLECHAS[letra] ?? null);

// La parte del compás de cada acorde: [{ nombre, patron, inicio, corcheas }], donde inicio y
// corcheas se cuentan en partes del rasgueo (corcheas o semicorcheas, según el patrón).
// Con "|" en el rasgueo, cada acorde dura lo que marca; si no, el compás se reparte en partes iguales.
export function partesDeCompas(compas) {
  const acordes = acordesDeCompas(compas);
  const rasgueo = compas.rasgueo || '';
  const total = partesDelRasgueo(rasgueo);
  const tramos = rasgueo.includes('|')
    ? rasgueo.split('|')
    : acordes.map((_, j) => rasgueo.slice((j * total) / acordes.length, ((j + 1) * total) / acordes.length));
  let inicio = 0;
  return acordes.map((nombre, j) => {
    const patron = tramos[j] ?? '';
    const parte = { nombre, patron, inicio, corcheas: patron.length };
    inicio += patron.length;
    return parte;
  });
}

// '↓ · ↓ ↑ · ↑ ↓ ↑', para mostrarlo como texto
export const textoDeRasgueo = (patron) => golpesDeRasgueo(patron).map((g) => g ?? '·').join(' ');

// Los rasgueos distintos de la canción, en orden, con los compases que los usan:
// [{ patron, golpes, compases: [{ indice, acordes: ['Em', 'C'] }] }]
export function rasgueosDeCancion(cancion) {
  const rasgueos = [];
  cancion.progresion.forEach((compas, indice) => {
    let r = rasgueos.find((x) => x.patron === compas.rasgueo);
    if (!r) {
      r = { patron: compas.rasgueo, golpes: golpesDeRasgueo(compas.rasgueo), compases: [] };
      rasgueos.push(r);
    }
    r.compases.push({ indice, acordes: acordesDeCompas(compas) });
  });
  return rasgueos;
}

// Todos los acordes de la canción, sin repetir, en el orden en que aparecen
export function acordesDeCancion(cancion) {
  const vistos = [];
  for (const compas of cancion.progresion) {
    for (const acorde of acordesDeCompas(compas)) if (!vistos.includes(acorde)) vistos.push(acorde);
  }
  return vistos;
}

// ¿Algún acorde se toca más de una vez? (si no, es un golpe por acorde, sin rasgueo)
export const tieneRasgueo = (cancion) => cancion.progresion.some((compas) =>
  partesDeCompas(compas).some((parte) => (parte.patron.match(/[DUX]/g) || []).length > 1));

export const NIVELES = ['Fácil', 'Intermedia', 'Difícil'];
const NIVEL_DEL_BACKEND = { facil: 'Fácil', intermedia: 'Intermedia', dificil: 'Difícil' };

// Si el backend indica la `dificultad` ('facil' | 'intermedia' | 'dificil'), se usa esa. Si no, se deduce:
// 'Fácil' si es un golpe por acorde y solo usa los acordes del curso de acordes; si tiene rasgueo
// o suma otros acordes, 'Intermedia'
export function nivelDeCancion(cancion) {
  const indicado = NIVEL_DEL_BACKEND[cancion.dificultad];
  if (indicado) return indicado;
  const acordesBasicos = acordesDeCancion(cancion).every((a) => ACORDES_INICIALES.includes(a));
  return acordesBasicos && !tieneRasgueo(cancion) ? 'Fácil' : 'Intermedia';
}

// La forma de un acorde en esta canción (algunas usan otra forma, como el G de Wonderwall)
export const formaDeAcorde = (cancion, nombre) => cancion.formas?.[nombre] ?? FORMAS[nombre] ?? null;

// Lo que espera el detector. Con capo, la forma es la misma pero todo suena `capo` semitonos más agudo.
const midiConCapo = (pos, capo) => midiDePosicion(pos.cuerda, pos.traste) + capo;

export function objetivoDeAcorde(cancion, nombre) {
  const posiciones = formaDeAcorde(cancion, nombre);
  if (!posiciones) return null;
  return { tipo: 'acorde', nombre, posiciones, midis: posiciones.map((pos) => midiConCapo(pos, cancion.capo || 0)) };
}

// Aprender la canción, en dos partes que usan la práctica de siempre (consignas una por una):
// - acordes: cada acorde cuerda por cuerda (de la más grave a la más aguda) y después rasgueado.
// - cambios: cada cambio de la canción, ida y vuelta dos veces (A B A B A).
export function aprendizajeDeCancion(cancion) {
  const acordes = acordesDeCancion(cancion).flatMap((nombre) => {
    const objetivo = objetivoDeAcorde(cancion, nombre);
    return secuenciaDePractica(objetivo); // Cada cuerda, de la más grave a la más aguda, y el acorde entero
  });

  // Los cambios en el orden de la canción (contando la vuelta al principio), sin repetir
  const seguidos = cancion.progresion.flatMap(acordesDeCompas);
  const pares = [];
  seguidos.forEach((a, i) => {
    const b = seguidos[(i + 1) % seguidos.length];
    const clave = [a, b].sort().join('|');
    if (a !== b && !pares.some((par) => par.clave === clave)) pares.push({ clave, a, b });
  });
  const cambios = pares.flatMap(({ a, b }) => [a, b, a, b, a].map((nombre) => objetivoDeAcorde(cancion, nombre)));

  return { acordes, cambios };
}

// Velocidades para tocarla: siempre arranca en la original y se puede bajar a la mitad desde la
// pantalla de tocar (x2 no se ofrece; VELOCIDADES.doble queda para usarla desde el código)
export const VELOCIDADES = { mitad: 0.5, original: 1, doble: 2 };
export const OPCIONES_VELOCIDAD = [
  { valor: VELOCIDADES.mitad, titulo: 'x0.5' },
  { valor: VELOCIDADES.original, titulo: 'x1' },
];
const COMPASES_A_TOCAR = 16; // La progresión se repite hasta llegar a unos 16 compases
const PULSOS_POR_COMPAS = 4;
const MS_MARGEN_ACORDE_MAX = 1500;

// Tocarla a tempo: un "riff" (ver utils/riff.js) donde cada nota es un acorde, con el nombre,
// la forma, las notas que espera el detector y las cuerdas que ocupa en el mástil.
export function riffDeCancion(cancion, velocidad = VELOCIDADES.original) {
  const bpm = Math.round(cancion.bpm * velocidad);
  const msPulso = 60000 / bpm;
  const notas = [];
  let t = 0;
  for (const compas of cancion.progresion) {
    // Lo que dura cada parte del rasgueo: una corchea, o una semicorchea si el patrón tiene 16
    const partes = partesDelRasgueo(compas.rasgueo);
    const msParte = (msPulso * PULSOS_POR_COMPAS) / partes;
    partesDeCompas(compas).forEach(({ nombre, patron, corcheas }) => {
      const pulsos = corcheas * (PULSOS_POR_COMPAS / partes);
      const objetivo = objetivoDeAcorde(cancion, nombre);
      const cuerdas = objetivo.posiciones.map((pos) => pos.cuerda);
      notas.push({
        tipo: 'acorde',
        nombre,
        posiciones: objetivo.posiciones,
        midis: objetivo.midis,
        cuerdaGrave: Math.max(...cuerdas),
        cuerdaAguda: Math.min(...cuerdas),
        t,
        pulsos,
        // Un acorde se puede rasguear durante buena parte de lo que dura
        msDespues: Math.min(MS_MARGEN_ACORDE_MAX, pulsos * msPulso * 0.8),
        // Los golpes del rasgueo después del primero (que es el bloque del acorde), con su tiempo
        // desde que empieza el acorde. Son solo una guía: lo que se evalúa es el acorde.
        golpes: golpesDeRasgueo(patron)
          .map((golpe, k) => ({ golpe, t: k * msParte }))
          .filter((g, k) => k > 0 && g.golpe),
        msParte, // Para dibujar los golpes sin que se pisen
      });
      t += pulsos * msPulso;
    });
  }
  // Si toda la canción tiene el mismo rasgueo, se muestra debajo del mástil
  const rasgueos = rasgueosDeCancion(cancion);
  return {
    nombre: cancion.titulo,
    bpm,
    msPulso,
    notas,
    duracion: t,
    vueltas: Math.max(1, Math.round(COMPASES_A_TOCAR / cancion.progresion.length)),
    capo: cancion.capo || 0,
    rasgueo: rasgueos.length === 1 ? textoDeRasgueo(rasgueos[0].patron) : null,
  };
}

// Busca por título o artista, sin importar tildes ni mayúsculas. `nivel` = 'Fácil' | 'Intermedia' | 'Difícil' | null.
// `genero` (texto o null) deja solo ese género. `favoritas` (lista de ids, o null para no filtrar) deja solo esas.
export function filtrarCanciones(canciones, texto = '', nivel = null, { genero = null, favoritas = null } = {}) {
  const buscado = normalizar(texto);
  const generoBuscado = genero ? normalizar(genero) : null;
  const ids = favoritas ? new Set(favoritas) : null;
  return canciones.filter((c) =>
    (!nivel || nivelDeCancion(c) === nivel) &&
    (!generoBuscado || normalizar(c.genero || '') === generoBuscado) &&
    (!ids || ids.has(c.id)) &&
    (!buscado || normalizar(`${c.titulo} ${c.artista}`).includes(buscado)));
}

// Los géneros que hay en el catálogo (sin repetir, por orden alfabético). Vacío si el backend no manda géneros.
export function generosDeCanciones(canciones) {
  const vistos = new Map();
  canciones.forEach((c) => {
    const genero = typeof c.genero === 'string' ? c.genero.trim() : '';
    if (genero && !vistos.has(normalizar(genero))) vistos.set(normalizar(genero), genero);
  });
  return [...vistos.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

// El orden del catálogo cuando no hay filtros, con un subtítulo por grupo: primero las favoritas
// y después las fáciles, intermedias y difíciles (una canción favorita sale en Favoritas y también en su dificultad).
// Devuelve [{ titulo, canciones }] sin los grupos vacíos.
export const TITULO_FAVORITAS = 'Favoritas';
export function seccionesDeCanciones(canciones, favoritas = []) {
  const ids = new Set(favoritas.map(String));
  // Cada canción sale una sola vez por grupo, aunque el catálogo la traiga repetida
  const unicas = canciones.filter((c, i) => canciones.findIndex((otra) => String(otra.id) === String(c.id)) === i);
  const secciones = [{ titulo: TITULO_FAVORITAS, canciones: unicas.filter((c) => ids.has(String(c.id))) }];
  [['Fácil', 'Fáciles'], ['Intermedia', 'Intermedias'], ['Difícil', 'Difíciles']].forEach(([nivel, titulo]) => {
    secciones.push({ titulo, canciones: unicas.filter((c) => nivelDeCancion(c) === nivel) });
  });
  return secciones.filter((s) => s.canciones.length > 0);
}

// Estrellas de una vez que se tocó la canción hasta el final: 1 por intentarla, 2 desde el 75 % de aciertos
// y 3 desde el 95 %. 0 si no hay nada que medir.
export const ESTRELLAS_MAXIMAS = 3;
export const ACIERTOS_PARA_DOS_ESTRELLAS = 0.75;
export const ACIERTOS_PARA_TRES_ESTRELLAS = 0.95;
export function estrellasDeResultado(aciertos, total) {
  if (!(total > 0)) return 0;
  const proporcion = aciertos / total;
  if (proporcion >= ACIERTOS_PARA_TRES_ESTRELLAS) return 3;
  if (proporcion >= ACIERTOS_PARA_DOS_ESTRELLAS) return 2;
  return 1;
}

// Las estrellas que ya tiene cada canción: { idDeLaCancion: 1 a 3 }. El backend puede mandarlas como
// un objeto o como una lista [{ cancionId, estrellas }]; lo que no es 1, 2 o 3 se descarta.
export function estrellasPorCancion(datos) {
  const pares = Array.isArray(datos) ? datos.map((d) => [d?.cancionId, d?.estrellas]) : Object.entries(datos || {});
  return Object.fromEntries(pares.filter(([id, estrellas]) => id && [1, 2, 3].includes(Number(estrellas))).map(([id, estrellas]) => [id, Number(estrellas)]));
}

// Para una lista que se desliza de lado en varias filas: la lista partida en columnas de `filas` canciones
export function columnasDeCanciones(canciones, filas = 2) {
  const columnas = [];
  for (let i = 0; i < canciones.length; i += filas) columnas.push(canciones.slice(i, i + filas));
  return columnas;
}
