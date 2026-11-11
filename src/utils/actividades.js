// Archivo: src/utils/actividades.js
// Actividades de una lección que no son tocar notas: un quiz sobre una imagen y la afinación guiada.
// Vienen en el campo `practica` de la lección. Los valida un CHECK de la BD, pero puede cambiar:
// un dato inválido se trata como si no existiera.
// Es lógica pura: se prueba en actividades.test.js.
import { midiAFrecuencia, midiDePosicion, nombreDeMidi } from './deteccionSonido.js';

export const CENTS_AFINADA_POR_DEFECTO = 5;
export const MS_ESTABLE_POR_DEFECTO = 1000;

const esNumeroEntre = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const textoValido = (v) => typeof v === 'string' && v.trim().length > 0;

// Un marcador sobre la imagen, en coordenadas de 0 a 1. Con ancho y alto es un recuadro; sin ellos, un punto.
function validarMarcador(marcador) {
  if (!marcador || !esNumeroEntre(marcador.x, 0, 1) || !esNumeroEntre(marcador.y, 0, 1)) return null;
  const conTamano = esNumeroEntre(marcador.ancho, 0, 1) && esNumeroEntre(marcador.alto, 0, 1);
  return conTamano ? { x: marcador.x, y: marcador.y, ancho: marcador.ancho, alto: marcador.alto } : { x: marcador.x, y: marcador.y };
}

// Qué parte de la imagen mostrar: un recuadro { x, y, ancho, alto } de 0 a 1, con x e y en el centro.
// Tiene que tener tamaño; si no, se muestra la imagen entera.
function validarRecorte(recorte) {
  const valido = validarMarcador(recorte);
  return valido?.ancho > 0 && valido?.alto > 0 ? valido : null;
}

// practica.tipo = 'quiz'. Devuelve { nombre, imagen, preguntas } o null.
// Cada pregunta puede traer su propia imagen y un recorte (un acercamiento a una parte del dibujo).
// Una pregunta inválida (sin texto, con menos de 2 opciones o sin respuesta correcta) se descarta.
export function obtenerQuiz(leccion) {
  const practica = leccion?.practica;
  if (practica?.tipo !== 'quiz' || !Array.isArray(practica.preguntas)) return null;
  const preguntas = practica.preguntas
    .map((p) => {
      if (!textoValido(p?.pregunta) || !Array.isArray(p.opciones)) return null;
      const opciones = p.opciones.filter(textoValido);
      if (opciones.length < 2 || opciones.length !== p.opciones.length) return null;
      if (!Number.isInteger(p.correcta) || p.correcta < 0 || p.correcta >= opciones.length) return null;
      return {
        pregunta: p.pregunta,
        opciones,
        correcta: p.correcta,
        marcador: validarMarcador(p.marcador),
        imagen: textoValido(p.imagen) ? p.imagen : null,
        recorte: validarRecorte(p.recorte),
        explicacion: textoValido(p.explicacion) ? p.explicacion : null,
      };
    })
    .filter(Boolean);
  if (preguntas.length === 0) return null;
  return { nombre: textoValido(practica.nombre) ? practica.nombre : null, imagen: textoValido(practica.imagen) ? practica.imagen : null, preguntas };
}

// practica.tipo = 'afinacion'. Devuelve { nombre, toleranciaCents, msEstable, cuerdas } o null.
// Cada cuerda es { cuerda, nota, frecuencia }; si no trae frecuencia o nota, se usan las de la afinación estándar.
export function obtenerAfinacion(leccion) {
  const practica = leccion?.practica;
  if (practica?.tipo !== 'afinacion' || !Array.isArray(practica.cuerdas)) return null;
  const vistas = new Set();
  const cuerdas = [];
  for (const c of practica.cuerdas) {
    const numero = Number(c?.cuerda);
    if (!Number.isInteger(numero) || numero < 1 || numero > 6 || vistas.has(numero)) return null;
    vistas.add(numero);
    const midi = midiDePosicion(numero, 0);
    cuerdas.push({
      cuerda: numero,
      nota: textoValido(c.nota) ? c.nota : nombreDeMidi(midi),
      frecuencia: esNumeroEntre(c.frecuencia, 40, 1000) ? c.frecuencia : midiAFrecuencia(midi),
    });
  }
  if (cuerdas.length === 0) return null;
  return {
    nombre: textoValido(practica.nombre) ? practica.nombre : null,
    toleranciaCents: esNumeroEntre(practica.toleranciaCents, 1, 50) ? practica.toleranciaCents : CENTS_AFINADA_POR_DEFECTO,
    msEstable: esNumeroEntre(practica.msEstable, 200, 10000) ? practica.msEstable : MS_ESTABLE_POR_DEFECTO,
    cuerdas,
  };
}

// Compara lo que suena con la cuerda a afinar, sin importar la octava: el micrófono a veces capta
// el armónico de una cuerda grave y no su nota. Devuelve { cents, estado: 'afinada' | 'baja' | 'alta' }.
export function compararAfinacion(frecuencia, frecuenciaObjetivo, toleranciaCents = CENTS_AFINADA_POR_DEFECTO) {
  const crudos = 1200 * Math.log2(frecuencia / frecuenciaObjetivo);
  const cents = crudos - 1200 * Math.round(crudos / 1200);
  let estado = 'afinada';
  if (cents < -toleranciaCents) estado = 'baja';
  else if (cents > toleranciaCents) estado = 'alta';
  return { cents: Math.round(cents), estado };
}

// La siguiente cuerda que falta afinar, siguiendo el orden de la lista y dando la vuelta.
// null si ya están todas.
export function siguienteCuerda(orden, actual, afinadas) {
  const desde = orden.indexOf(actual);
  const resto = [...orden.slice(desde + 1), ...orden.slice(0, Math.max(desde, 0))];
  return resto.find((c) => !afinadas.includes(c)) ?? null;
}
