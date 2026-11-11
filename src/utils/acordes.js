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

// Toma las lecciones de uno o varios cursos y devuelve un acorde por nombre, en el orden de las lecciones.
// Cada acorde es { nombre, titulo, objetivo }: `objetivo` es lo que necesita el detector de sonido.
// Una `practica` inválida (nadie la valida en el backend) se descarta.
export function extraerAcordes(lecciones) {
  const vistos = new Set();
  const acordes = [];
  [...(lecciones || [])]
    .sort((a, b) => (a?.orden ?? 0) - (b?.orden ?? 0))
    .forEach((leccion) => {
      if (leccion?.practica?.tipo !== 'acorde') return;
      const objetivo = obtenerObjetivo({ practica: leccion.practica });
      if (!objetivo || objetivo.tipo !== 'acorde' || vistos.has(objetivo.nombre)) return;
      vistos.add(objetivo.nombre);
      acordes.push({ nombre: objetivo.nombre, titulo: leccion.titulo || objetivo.nombre, objetivo });
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
