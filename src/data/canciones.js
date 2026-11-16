// Archivo: src/data/canciones.js
// Datos fijos de la sección Canciones. Las canciones (acordes, rasgueo, tempo, capo y las formas de
// sus acordes) vienen del backend: GET /api/canciones. Acá quedan las formas comunes, por si una
// canción no trae la de algún acorde.

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
