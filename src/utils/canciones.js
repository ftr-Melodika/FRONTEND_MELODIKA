// Archivo: src/utils/canciones.js
// Lógica de la sección Canciones. Es pura: se prueba en canciones.test.js.
import { objetivoDeAcorde } from './acordes.js';

// Los acordes del curso "Tus Primeros Acordes": una canción solo con estos es fácil
export const ACORDES_INICIALES = ['Mim', 'Mi', 'Lam', 'Do', 'Sol', 'Re'];

// Los acordes de cada compás: "Do Fa" -> ['Do', 'Fa']
export const acordesDeCompas = (compas) => compas.split(' ').filter(Boolean);

// Todos los acordes de la canción, sin repetir, en el orden en que aparecen
export function acordesDeCancion(cancion) {
  const vistos = [];
  for (const seccion of cancion.secciones) {
    for (const compas of seccion.compases) {
      for (const acorde of acordesDeCompas(compas)) if (!vistos.includes(acorde)) vistos.push(acorde);
    }
  }
  return vistos;
}

// 'Fácil' si solo usa los acordes del curso 3; si no, 'Intermedia' (necesita los del curso 5)
export function nivelDeCancion(cancion) {
  return acordesDeCancion(cancion).every((a) => ACORDES_INICIALES.includes(a)) ? 'Fácil' : 'Intermedia';
}

// Los cambios de acorde para practicar con el micrófono: cada sección una vez, sin repetir
// el mismo acorde seguido (el que sigue sonando aprobaría solo el siguiente).
// Con `conCapo`, el detector espera las notas que suenan con el capo puesto.
export function secuenciaDeCancion(cancion, conCapo = false) {
  const capo = conCapo ? cancion.capo || 0 : 0;
  const nombres = [];
  for (const seccion of cancion.secciones) {
    for (const compas of seccion.compases) {
      for (const acorde of acordesDeCompas(compas)) if (nombres[nombres.length - 1] !== acorde) nombres.push(acorde);
    }
  }
  return nombres.map((nombre) => objetivoDeAcorde(nombre, capo)).filter(Boolean);
}

const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Busca por título o artista, sin importar tildes ni mayúsculas. `nivel` = 'Fácil' | 'Intermedia' | null.
export function filtrarCanciones(canciones, texto = '', nivel = null) {
  const buscado = normalizar(texto.trim());
  return canciones.filter((c) =>
    (!nivel || nivelDeCancion(c) === nivel) &&
    (!buscado || normalizar(`${c.titulo} ${c.artista}`).includes(buscado)));
}
