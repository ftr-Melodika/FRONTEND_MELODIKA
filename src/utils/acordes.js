// Archivo: src/utils/acordes.js
// Acordes para la pantalla de Práctica. Vienen del backend, en el campo `practica` de las lecciones
// de acordes (curso "Tus Primeros Acordes"). Es lógica pura: se prueba en acordes.test.js.
import { obtenerObjetivo } from './deteccionSonido.js';

// Respaldo por si el backend no responde: los mismos 6 acordes del curso, con sus dedos.
// Cuerda 1 = Mi agudo; las cuerdas que no se tocan no aparecen.
export const ACORDES_RESPALDO = [
  { nombre: 'Mim', titulo: 'Mi menor', posiciones: [
    { cuerda: 6, traste: 0 }, { cuerda: 5, traste: 2, dedo: 2 }, { cuerda: 4, traste: 2, dedo: 3 },
    { cuerda: 3, traste: 0 }, { cuerda: 2, traste: 0 }, { cuerda: 1, traste: 0 }] },
  { nombre: 'Mi', titulo: 'Mi mayor', posiciones: [
    { cuerda: 6, traste: 0 }, { cuerda: 5, traste: 2, dedo: 2 }, { cuerda: 4, traste: 2, dedo: 3 },
    { cuerda: 3, traste: 1, dedo: 1 }, { cuerda: 2, traste: 0 }, { cuerda: 1, traste: 0 }] },
  { nombre: 'Lam', titulo: 'La menor', posiciones: [
    { cuerda: 5, traste: 0 }, { cuerda: 4, traste: 2, dedo: 2 }, { cuerda: 3, traste: 2, dedo: 3 },
    { cuerda: 2, traste: 1, dedo: 1 }, { cuerda: 1, traste: 0 }] },
  { nombre: 'Do', titulo: 'Do mayor', posiciones: [
    { cuerda: 5, traste: 3, dedo: 3 }, { cuerda: 4, traste: 2, dedo: 2 }, { cuerda: 3, traste: 0 },
    { cuerda: 2, traste: 1, dedo: 1 }, { cuerda: 1, traste: 0 }] },
  { nombre: 'Sol', titulo: 'Sol mayor', posiciones: [
    { cuerda: 6, traste: 3, dedo: 2 }, { cuerda: 5, traste: 2, dedo: 1 }, { cuerda: 4, traste: 0 },
    { cuerda: 3, traste: 0 }, { cuerda: 2, traste: 0 }, { cuerda: 1, traste: 3, dedo: 3 }] },
  { nombre: 'Re', titulo: 'Re mayor', posiciones: [
    { cuerda: 4, traste: 0 }, { cuerda: 3, traste: 2, dedo: 1 }, { cuerda: 2, traste: 3, dedo: 3 },
    { cuerda: 1, traste: 2, dedo: 2 }] },
];

// Formas de todos los acordes abiertos que enseñan los cursos 3 y 5, para dibujarlos y detectarlos
// donde no vienen de una lección (por ejemplo, en las canciones). Las mismas formas que las lecciones.
const p = (cuerda, traste, dedo) => (dedo ? { cuerda, traste, dedo } : { cuerda, traste });
export const FORMAS_ACORDES = {
  ...Object.fromEntries(ACORDES_RESPALDO.map((a) => [a.nombre, a.posiciones])),
  La: [p(5, 0), p(4, 2, 1), p(3, 2, 2), p(2, 2, 3), p(1, 0)],
  Rem: [p(4, 0), p(3, 2, 2), p(2, 3, 3), p(1, 1, 1)],
  Mi7: [p(6, 0), p(5, 2, 2), p(4, 0), p(3, 1, 1), p(2, 0), p(1, 0)],
  La7: [p(5, 0), p(4, 2, 2), p(3, 0), p(2, 2, 3), p(1, 0)],
  Re7: [p(4, 0), p(3, 2, 2), p(2, 1, 1), p(1, 2, 3)],
  Sol7: [p(6, 3, 3), p(5, 2, 2), p(4, 0), p(3, 0), p(2, 0), p(1, 1, 1)],
  // Sin cejilla: el dedo 1 aprieta la 1ra y la 2da cuerda a la vez
  Fa: [p(4, 3, 3), p(3, 2, 2), p(2, 1, 1), p(1, 1, 1)],
};

// Lo que necesita el detector para un acorde por nombre, o null si no se conoce su forma.
// Con capo, la forma se arma igual pero todo suena `capo` semitonos más agudo: el dibujo
// muestra la forma y el detector espera las notas que suenan de verdad.
export function objetivoDeAcorde(nombre, capo = 0) {
  const posiciones = FORMAS_ACORDES[nombre];
  if (!posiciones) return null;
  const objetivo = obtenerObjetivo({ practica: { tipo: 'acorde', nombre, posiciones } });
  return capo ? { ...objetivo, midis: objetivo.midis.map((m) => m + capo) } : objetivo;
}

// "Lam" -> "La menor", "Sol7" -> "Sol séptima", "Fa" -> "Fa mayor". Otros nombres quedan igual.
export function tituloDeAcorde(nombre) {
  const partes = /^(Do|Re|Mi|Fa|Sol|La|Si)(#|b)?(m|7|m7)?$/.exec(nombre || '');
  if (!partes) return nombre;
  const base = partes[1] + (partes[2] || '');
  const tipo = { m: 'menor', 7: 'séptima', m7: 'menor séptima' }[partes[3]] || 'mayor';
  return `${base} ${tipo}`;
}

// En una secuencia, solo cuentan como acordes para practicar los de 3 cuerdas o más:
// dos notas juntas (un "power chord" de un riff) no son un acorde para elegir en la Práctica.
const CUERDAS_MINIMAS_EN_SECUENCIA = 3;

// Toma las lecciones de uno o varios cursos y devuelve un acorde por nombre, en el orden de las lecciones.
// Cada acorde es { nombre, titulo, objetivo }: `objetivo` es lo que necesita el detector de sonido.
// Sale de practica.tipo = 'acorde' o de los pasos de acorde de una secuencia (así vienen las lecciones
// de acordes: primero las notas sueltas y al final el acorde entero).
// Una `practica` inválida (nadie la valida en el backend) se descarta.
export function extraerAcordes(lecciones) {
  const vistos = new Set();
  const acordes = [];
  const agregar = (practica, titulo) => {
    const objetivo = obtenerObjetivo({ practica });
    if (!objetivo || objetivo.tipo !== 'acorde' || vistos.has(objetivo.nombre)) return;
    vistos.add(objetivo.nombre);
    acordes.push({ nombre: objetivo.nombre, titulo: titulo || objetivo.nombre, objetivo });
  };
  // Primero por curso y después por lección: si dos cursos enseñan el mismo acorde (Fa sin cejilla
  // y Fa con cejilla), queda la forma del curso más fácil
  [...(lecciones || [])]
    .sort((a, b) => (a?.ordenCurso ?? 0) - (b?.ordenCurso ?? 0) || (a?.orden ?? 0) - (b?.orden ?? 0))
    .forEach((leccion) => {
      const practica = leccion?.practica;
      if (practica?.tipo === 'acorde') agregar(practica, leccion.titulo);
      else if (practica?.tipo === 'secuencia' && Array.isArray(practica.pasos)) {
        practica.pasos
          .filter((paso) => paso?.tipo === 'acorde' && Array.isArray(paso.posiciones) && paso.posiciones.length >= CUERDAS_MINIMAS_EN_SECUENCIA)
          .forEach((paso) => agregar(paso, tituloDeAcorde(paso.nombre)));
      }
    });
  return acordes;
}

export const acordesDeRespaldo = () =>
  extraerAcordes(ACORDES_RESPALDO.map((a, orden) => ({ orden, titulo: a.titulo, practica: { tipo: 'acorde', ...a } })));

const azarPorDefecto = (maximo) => Math.floor(Math.random() * maximo);

// Un acorde al azar distinto del anterior: el que todavía suena no debe aprobar el siguiente
export function acordeAlAzar(acordes, anterior, azar = azarPorDefecto) {
  const candidatos = acordes.length > 1 ? acordes.filter((a) => a.nombre !== anterior?.nombre) : acordes;
  return candidatos[azar(candidatos.length)];
}

function mezclar(lista, azar) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = azar(i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Pregunta del modo "Adivinar" con acordes: el mástil muestra la forma y hay que elegir el nombre
export function preguntaDeAcorde(acordes, anterior, azar = azarPorDefecto, cantidadOpciones = 4) {
  const acorde = acordeAlAzar(acordes, anterior, azar);
  const otros = mezclar(acordes.filter((a) => a.nombre !== acorde.nombre), azar).slice(0, cantidadOpciones - 1);
  return { acorde, opciones: mezclar([acorde, ...otros], azar).map((a) => a.nombre) };
}
