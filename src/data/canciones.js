// Archivo: src/data/canciones.js
// Catálogo de canciones para tocar: acordes, rasgueo sugerido, tempo y estructura.
// No hay una API pública que dé esto (los sitios de cifrados no tienen API abierta y no permiten
// copiar su contenido), así que el catálogo es propio. No lleva letras: tienen derechos de autor.
// Solo usa los acordes abiertos de los cursos 3 y 5 (ver FORMAS_ACORDES): las que en el original
// llevan cejilla se tocan con capo y formas abiertas. El tempo es aproximado.
//
// Cada sección es una lista de compases; un compás con dos acordes ("Do Fa") lleva medio compás de cada uno.

// Rasgueos sugeridos. `cuenta` es lo que se dice en voz alta; `golpes` el rasgueo en cada parte
// ('↓' abajo, '↑' arriba, '' la mano pasa sin tocar).
export const RASGUEOS = {
  basico: {
    nombre: 'Básico',
    descripcion: 'Uno hacia abajo en cada tiempo. Es el primero que aprendiste: sirve para cualquier canción.',
    cuenta: ['1', '2', '3', '4'],
    golpes: ['↓', '↓', '↓', '↓'],
  },
  abajoArriba: {
    nombre: 'Abajo y arriba',
    descripcion: 'Abajo en cada número y arriba en cada "y". Le da movimiento a las canciones rápidas.',
    cuenta: ['1', 'y', '2', 'y', '3', 'y', '4', 'y'],
    golpes: ['↓', '↑', '↓', '↑', '↓', '↑', '↓', '↑'],
  },
  balada: {
    nombre: 'Balada',
    descripcion: 'El rasgueo más usado del pop y del fogón. La mano no se detiene: en los huecos pasa sin tocar.',
    cuenta: ['1', 'y', '2', 'y', '3', 'y', '4', 'y'],
    golpes: ['↓', '', '↓', '↑', '', '↑', '↓', '↑'],
  },
  seisOchos: {
    nombre: 'En 6/8',
    descripcion: 'Seis partes por compás, con el acento en el 1 y en el 4. Suena a vals lento.',
    cuenta: ['1', '2', '3', '4', '5', '6'],
    golpes: ['↓', '↓', '↑', '↓', '↓', '↑'],
  },
};

export const CANCIONES = [
  {
    id: 'knockin-on-heavens-door', titulo: "Knockin' on Heaven's Door", artista: 'Bob Dylan', anio: 1973,
    bpm: 69, compas: '4/4', pulsosPorCompas: 4, tonalidad: 'Sol mayor', capo: 0, rasgueo: 'balada',
    consejo: 'Toda la canción repite las mismas dos vueltas. Ideal para la primera canción.',
    secciones: [
      { nombre: 'Estrofa', compases: ['Sol', 'Re', 'Lam', 'Lam', 'Sol', 'Re', 'Do', 'Do'] },
      { nombre: 'Estribillo', compases: ['Sol', 'Re', 'Lam', 'Lam', 'Sol', 'Re', 'Do', 'Do'] },
    ],
  },
  {
    id: 'zombie', titulo: 'Zombie', artista: 'The Cranberries', anio: 1994,
    bpm: 84, compas: '4/4', pulsosPorCompas: 4, tonalidad: 'Mi menor', capo: 0, rasgueo: 'balada',
    consejo: 'Cuatro acordes que se repiten en toda la canción. En el estribillo rasgueá con más fuerza.',
    secciones: [
      { nombre: 'Estrofa', compases: ['Mim', 'Do', 'Sol', 'Re'] },
      { nombre: 'Estribillo', compases: ['Mim', 'Do', 'Sol', 'Re'] },
    ],
  },
  {
    id: 'stand-by-me', titulo: 'Stand By Me', artista: 'Ben E. King', anio: 1961,
    bpm: 118, compas: '4/4', pulsosPorCompas: 4, tonalidad: 'La mayor (con capo)', capo: 2, rasgueo: 'balada',
    consejo: 'El original está en La, con un acorde de cejilla. Con capo en el traste 2 y estas formas suena igual.',
    secciones: [
      { nombre: 'Estrofa', compases: ['Sol', 'Sol', 'Mim', 'Mim', 'Do', 'Re', 'Sol', 'Sol'] },
      { nombre: 'Estribillo', compases: ['Sol', 'Sol', 'Mim', 'Mim', 'Do', 'Re', 'Sol', 'Sol'] },
    ],
  },
  {
    id: 'wonderwall', titulo: 'Wonderwall (versión simplificada)', artista: 'Oasis', anio: 1995,
    bpm: 87, compas: '4/4', pulsosPorCompas: 4, tonalidad: 'Fa# menor (con capo)', capo: 2, rasgueo: 'abajoArriba',
    consejo: 'El original usa acordes con notas agregadas; estos son los acordes básicos que están debajo. El rasgueo es constante y con mucho movimiento.',
    secciones: [
      { nombre: 'Estrofa', compases: ['Mim', 'Sol', 'Re', 'La'] },
      { nombre: 'Pre-estribillo', compases: ['Do', 'Re', 'Mim', 'Mim', 'Do', 'Re', 'Mim', 'Mim', 'Do', 'Re', 'La', 'La'] },
      { nombre: 'Estribillo', compases: ['Do', 'Mim', 'Sol', 'Mim'] },
    ],
  },
  {
    id: 'let-it-be', titulo: 'Let It Be', artista: 'The Beatles', anio: 1970,
    bpm: 72, compas: '4/4', pulsosPorCompas: 4, tonalidad: 'Do mayor', capo: 0, rasgueo: 'basico',
    consejo: 'Empezá con el rasgueo básico, parejo y tranquilo. El Fa es el de cuatro cuerdas, sin cejilla.',
    secciones: [
      { nombre: 'Estrofa', compases: ['Do', 'Sol', 'Lam', 'Fa', 'Do', 'Sol', 'Fa Do', 'Do'] },
      { nombre: 'Estribillo', compases: ['Lam', 'Sol', 'Fa', 'Do', 'Do', 'Sol', 'Fa Do', 'Do'] },
    ],
  },
  {
    id: 'despacito', titulo: 'Despacito', artista: 'Luis Fonsi', anio: 2017,
    bpm: 89, compas: '4/4', pulsosPorCompas: 4, tonalidad: 'Si menor (con capo)', capo: 2, rasgueo: 'balada',
    consejo: 'Los mismos cuatro acordes en toda la canción. Con capo en el traste 2 suena como el original, que usa cejillas.',
    secciones: [
      { nombre: 'Estrofa', compases: ['Lam', 'Fa', 'Do', 'Sol'] },
      { nombre: 'Estribillo', compases: ['Lam', 'Fa', 'Do', 'Sol'] },
    ],
  },
  {
    id: 'la-bamba', titulo: 'La Bamba', artista: 'Ritchie Valens', anio: 1958,
    bpm: 150, compas: '4/4', pulsosPorCompas: 4, tonalidad: 'Do mayor', capo: 0, rasgueo: 'abajoArriba',
    consejo: 'Un solo ciclo que se repite toda la canción: Do y Fa medio compás cada uno, y Sol un compás entero. Es rápida: practicala lento primero.',
    secciones: [
      { nombre: 'Toda la canción', compases: ['Do Fa', 'Sol', 'Do Fa', 'Sol'] },
    ],
  },
  {
    id: 'brown-eyed-girl', titulo: 'Brown Eyed Girl', artista: 'Van Morrison', anio: 1967,
    bpm: 150, compas: '4/4', pulsosPorCompas: 4, tonalidad: 'Sol mayor', capo: 0, rasgueo: 'abajoArriba',
    consejo: 'Alegre y rápida. El Re7 del estribillo se sostiene dos compases antes de volver a Sol.',
    secciones: [
      { nombre: 'Estrofa', compases: ['Sol', 'Do', 'Sol', 'Re', 'Sol', 'Do', 'Sol', 'Re'] },
      { nombre: 'Puente', compases: ['Do', 'Re', 'Sol', 'Mim', 'Do', 'Re', 'Sol', 'Re'] },
      { nombre: 'Estribillo', compases: ['Re7', 'Re7', 'Sol', 'Do', 'Sol', 'Re'] },
    ],
  },
  {
    id: 'imagine', titulo: 'Imagine', artista: 'John Lennon', anio: 1971,
    bpm: 76, compas: '4/4', pulsosPorCompas: 4, tonalidad: 'Do mayor', capo: 0, rasgueo: 'basico',
    consejo: 'Originalmente es en piano: en guitarra queda muy bien con el rasgueo básico y suave.',
    secciones: [
      { nombre: 'Estrofa', compases: ['Do', 'Fa', 'Do', 'Fa'] },
      { nombre: 'Puente', compases: ['Fa', 'Lam', 'Rem', 'Fa', 'Sol', 'Sol7'] },
      { nombre: 'Estribillo', compases: ['Fa', 'Sol', 'Do', 'Mi7', 'Fa', 'Sol', 'Do', 'Mi7'] },
    ],
  },
  {
    id: 'hallelujah', titulo: 'Hallelujah', artista: 'Leonard Cohen', anio: 1984,
    bpm: 56, compas: '6/8', pulsosPorCompas: 2, tonalidad: 'Do mayor', capo: 0, rasgueo: 'seisOchos',
    consejo: 'Se cuenta de a seis (1 2 3 4 5 6) y el pulso cae en el 1 y en el 4. Tocala lenta y suave.',
    secciones: [
      { nombre: 'Estrofa', compases: ['Do', 'Lam', 'Do', 'Lam', 'Fa', 'Sol', 'Do', 'Sol', 'Do', 'Fa', 'Sol', 'Lam', 'Fa', 'Sol', 'Mi7', 'Lam'] },
      { nombre: 'Estribillo', compases: ['Fa', 'Lam', 'Fa', 'Do', 'Sol', 'Do'] },
    ],
  },
];
