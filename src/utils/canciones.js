// Archivo: src/utils/canciones.js
// Lógica de la sección Canciones. Es pura: se prueba en canciones.test.js.
// Una canción se puede aprender (cada acorde, después los cambios, después tocarla) o tocar
// directamente a tempo, con los acordes avanzando por el mástil (el "riff en movimiento").
import { midiDePosicion, nombreDeMidi } from './deteccionSonido.js';
import { FORMAS } from '../data/canciones.js';

// Los 8 acordes del curso "Acordes": una canción solo con estos es fácil
export const ACORDES_INICIALES = ['Em', 'Am', 'D', 'A', 'E', 'C', 'G', 'B7'];

// Los acordes de cada compás: "Em C" -> ['Em', 'C']
export const acordesDeCompas = (compas) => compas.split(' ').filter(Boolean);

// Todos los acordes de la canción, sin repetir, en el orden en que aparecen
export function acordesDeCancion(cancion) {
  const vistos = [];
  for (const compas of cancion.progresion) {
    for (const acorde of acordesDeCompas(compas)) if (!vistos.includes(acorde)) vistos.push(acorde);
  }
  return vistos;
}

// 'Fácil' si solo usa los acordes del curso de acordes; si no, 'Intermedia'
export function nivelDeCancion(cancion) {
  return acordesDeCancion(cancion).every((a) => ACORDES_INICIALES.includes(a)) ? 'Fácil' : 'Intermedia';
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

const objetivoDeNota = (cancion, pos) => {
  const midi = midiConCapo(pos, cancion.capo || 0);
  return { tipo: 'nota', nombre: nombreDeMidi(midi), posiciones: [pos], midis: [midi] };
};

// Aprender la canción, en dos partes que usan la práctica de siempre (consignas una por una):
// - acordes: cada acorde cuerda por cuerda (de la más grave a la más aguda) y después rasgueado.
// - cambios: cada cambio de la canción, ida y vuelta dos veces (A B A B A).
export function aprendizajeDeCancion(cancion) {
  const acordes = acordesDeCancion(cancion).flatMap((nombre) => {
    const objetivo = objetivoDeAcorde(cancion, nombre);
    const cuerdaPorCuerda = [...objetivo.posiciones].sort((a, b) => b.cuerda - a.cuerda).map((pos) => objetivoDeNota(cancion, pos));
    return [...cuerdaPorCuerda, objetivo];
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

// Velocidades para tocarla a tempo
export const VELOCIDADES = { lenta: 0.7, original: 1 };
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
    const acordes = acordesDeCompas(compas);
    const pulsos = PULSOS_POR_COMPAS / acordes.length;
    for (const nombre of acordes) {
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
      });
      t += pulsos * msPulso;
    }
  }
  return {
    nombre: cancion.titulo,
    bpm,
    msPulso,
    notas,
    duracion: t,
    vueltas: Math.max(1, Math.round(COMPASES_A_TOCAR / cancion.progresion.length)),
    capo: cancion.capo || 0,
    rasgueo: cancion.rasgueo,
  };
}

const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Busca por título o artista, sin importar tildes ni mayúsculas. `nivel` = 'Fácil' | 'Intermedia' | null.
export function filtrarCanciones(canciones, texto = '', nivel = null) {
  const buscado = normalizar(texto.trim());
  return canciones.filter((c) =>
    (!nivel || nivelDeCancion(c) === nivel) &&
    (!buscado || normalizar(`${c.titulo} ${c.artista}`).includes(buscado)));
}
