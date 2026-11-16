// Archivo: src/utils/canciones.fixture.js
// Canciones de ejemplo para las pruebas, con el formato en que las devuelve el backend
// (GET /api/canciones). El catálogo real está en el backend: src/database/seeds/canciones.js.
const p = (cuerda, traste, dedo) => (traste === 0 ? { cuerda, traste } : { cuerda, traste, dedo });
const conRasgueo = (rasgueo, compases) => compases.map((acordes) => ({ acordes, rasgueo }));

export const CANCIONES = [
  {
    id: 'de-musica-ligera', titulo: 'De música ligera', artista: 'Soda Stereo', bpm: 126, capo: 0,
    progresion: conRasgueo('D---D----UUDDDU-', ['Em C', 'G D']),
    formas: {}, notaRasgueo: null, consejo: 'Dos acordes por compás.',
  },
  {
    id: 'lamento-boliviano', titulo: 'Lamento boliviano', artista: 'Enanitos Verdes', bpm: 88, capo: 0,
    progresion: conRasgueo('D-DU-UDU', ['Em', 'Em', 'Bm', 'Bm', 'Am', 'Am', 'Em', 'B7']),
    formas: {}, notaRasgueo: null, consejo: 'Bm lleva cejilla.',
  },
  {
    id: 'flaca', titulo: 'Flaca', artista: 'Andrés Calamaro', bpm: 70, capo: 0,
    progresion: conRasgueo('D-DU-UDU', ['G', 'B7', 'Em', 'C', 'G', 'D', 'G', 'D']),
    formas: {}, notaRasgueo: null, consejo: 'Tranquila.',
  },
  {
    id: 'wonderwall', titulo: 'Wonderwall', artista: 'Oasis', bpm: 87, capo: 2,
    progresion: [
      { acordes: 'Em7', rasgueo: 'D-D-D---' },
      { acordes: 'G', rasgueo: 'DUDUD-D-' },
      { acordes: 'Dsus4', rasgueo: 'DUDUD-D-' },
      { acordes: 'A7sus4', rasgueo: 'DUUUDUDU' },
    ],
    formas: { G: [p(6, 3, 2), p(5, 2, 1), p(4, 0), p(3, 0), p(2, 3, 3), p(1, 3, 4)] },
    notaRasgueo: null, consejo: 'Dedos 3 y 4 fijos.',
  },
  {
    id: 'riptide', titulo: 'Riptide', artista: 'Vance Joy', bpm: 101, capo: 1,
    progresion: conRasgueo('D-DUDUD-', ['Am', 'G', 'C', 'C']),
    formas: {}, notaRasgueo: null, consejo: 'Tres acordes abiertos.',
  },
];
