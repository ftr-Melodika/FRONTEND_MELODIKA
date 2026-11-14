// Archivo: src/data/canciones.js
// Catálogo de canciones de la sección Práctica: acordes, rasgueo, tempo y capo.
// No lleva letras: tienen derechos de autor. Los acordes van en cifrado americano (Em, C, G…).
//
// `progresion`: un elemento por compás (4/4); un compás con dos acordes ("Em C") lleva medio compás
// de cada uno. `formas`: si la canción usa otra forma de un acorde (Wonderwall), la reemplaza.
// `bpm` es el tempo aproximado del original.

// Cómo se arma cada acorde. Cuerda 1 = Mi agudo; las cuerdas que no se tocan no aparecen.
// Con capo, el traste 0 es el capo: las formas son las mismas y suenan más agudas.
const p = (cuerda, traste, dedo) => (traste === 0 ? { cuerda, traste } : { cuerda, traste, dedo });
export const FORMAS = {
  Em: [p(6, 0), p(5, 2, 2), p(4, 2, 3), p(3, 0), p(2, 0), p(1, 0)],
  Am: [p(5, 0), p(4, 2, 2), p(3, 2, 3), p(2, 1, 1), p(1, 0)],
  C: [p(5, 3, 3), p(4, 2, 2), p(3, 0), p(2, 1, 1), p(1, 0)],
  G: [p(6, 3, 2), p(5, 2, 1), p(4, 0), p(3, 0), p(2, 0), p(1, 3, 3)],
  D: [p(4, 0), p(3, 2, 1), p(2, 3, 3), p(1, 2, 2)],
  B7: [p(5, 2, 2), p(4, 1, 1), p(3, 2, 3), p(2, 0), p(1, 2, 4)],
  // Con cejilla en el traste 2 (de la 5ta a la 1ra)
  Bm: [p(5, 2, 1), p(4, 4, 3), p(3, 4, 4), p(2, 3, 2), p(1, 2, 1)],
  // Do con el Sol en el bajo
  'C/G': [p(6, 3, 3), p(5, 3, 4), p(4, 2, 2), p(3, 0), p(2, 1, 1), p(1, 0)],
  // Con cejilla en el traste 1
  F: [p(6, 1, 1), p(5, 3, 3), p(4, 3, 4), p(3, 2, 2), p(2, 1, 1), p(1, 1, 1)],
  Fm: [p(6, 1, 1), p(5, 3, 3), p(4, 3, 4), p(3, 1, 1), p(2, 1, 1), p(1, 1, 1)],
  // Con cejilla en el traste 3
  Gm: [p(6, 3, 1), p(5, 5, 3), p(4, 5, 4), p(3, 3, 1), p(2, 3, 1), p(1, 3, 1)],
  Cm: [p(5, 3, 1), p(4, 5, 3), p(3, 5, 4), p(2, 4, 2), p(1, 3, 1)],
  Em7: [p(6, 0), p(5, 2, 1), p(4, 2, 2), p(3, 0), p(2, 3, 3), p(1, 3, 4)],
  Dsus4: [p(4, 0), p(3, 2, 1), p(2, 3, 3), p(1, 3, 4)],
  A7sus4: [p(5, 0), p(4, 2, 1), p(3, 0), p(2, 3, 3), p(1, 3, 4)],
};

export const REFERENCIAS_RASGUEO = '↓ = abajo  ·  ↑ = arriba  ·  · = la mano pasa sin tocar  ·  X = golpe apagado';

export const CANCIONES = [
  {
    id: 'de-musica-ligera', titulo: 'De música ligera', artista: 'Soda Stereo', bpm: 126, capo: 0,
    progresion: ['Em C', 'G D'],
    rasgueo: '↓↓ / ↑↑↓↓',
    consejo: 'Dos acordes por compás: el "/" del rasgueo marca el cambio.',
  },
  {
    id: 'lamento-boliviano', titulo: 'Lamento boliviano', artista: 'Enanitos Verdes', bpm: 88, capo: 0,
    progresion: ['Em', 'Em', 'Bm', 'Bm', 'Am', 'Am', 'Em', 'B7'],
    rasgueo: '↓ · ↓↑ · ↑↓↑',
    consejo: 'Bm lleva cejilla en el traste 2. B7 te lleva de vuelta a Em.',
  },
  {
    id: 'flaca', titulo: 'Flaca', artista: 'Andrés Calamaro', bpm: 70, capo: 0,
    progresion: ['G', 'B7', 'Em', 'C', 'G', 'D', 'G', 'D'],
    rasgueo: '↓ · ↓↑ · ↑↓↑ (lento)',
    consejo: 'Tranquila y sin apuro: dejá sonar cada acorde.',
  },
  {
    id: 'arrancarmelo', titulo: 'Arrancármelo', artista: 'WOS', bpm: 80, capo: 0,
    progresion: ['C/G', 'F', 'Fm', 'Gm'],
    rasgueo: '↓ en las primeras 2 estrofas, y después ↓ · ↓↑ · ↑↓↑',
    consejo: 'F, Fm y Gm llevan cejilla. De F a Fm solo se mueve un dedo.',
  },
  {
    id: 'wonderwall', titulo: 'Wonderwall', artista: 'Oasis', bpm: 87, capo: 2,
    progresion: ['Em7', 'G', 'Dsus4', 'A7sus4'],
    // En Wonderwall el Sol se toca con los dedos 3 y 4 en las cuerdas 2 y 1, como en los demás acordes
    formas: { G: [p(6, 3, 2), p(5, 2, 1), p(4, 0), p(3, 0), p(2, 3, 3), p(1, 3, 4)] },
    rasgueo: '↓↓↓ / ↓↑↓↑↓↓ / ↓↑↓↑↓↓ / ↓↑↑ ↑↓↑↓↑',
    consejo: 'Los dedos 3 y 4 quedan fijos en las cuerdas 2 y 1 en los cuatro acordes: no los levantes.',
  },
  {
    id: 'creep', titulo: 'Creep', artista: 'Radiohead', bpm: 92, capo: 0,
    progresion: ['G', 'B7', 'C', 'Cm'],
    rasgueo: '↓↓ ↑↑↓ ↓↑↓↑',
    consejo: 'Cm lleva cejilla en el traste 3. De C a Cm la mano sube por el mástil.',
  },
  {
    id: 'riptide', titulo: 'Riptide', artista: 'Vance Joy', bpm: 101, capo: 1,
    progresion: ['Am', 'G', 'C', 'C'],
    rasgueo: '↓ ↓ ↑↓↑↓',
    consejo: 'Tres acordes abiertos y un rasgueo con mucho movimiento.',
  },
  {
    id: 'stand-by-me', titulo: 'Stand By Me', artista: 'Ben E. King', bpm: 118, capo: 2,
    progresion: ['G', 'Em', 'C', 'D'],
    rasgueo: '↓↑ X (se repite)',
    consejo: 'La X es un golpe apagado: apoyá la palma sobre las cuerdas al rasguear.',
  },
];
