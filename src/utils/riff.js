// Archivo: src/utils/riff.js
// El riff en movimiento: las notas avanzan por el mástil y hay que tocar cada una cuando pasa por
// la línea. Es la segunda parte de una lección de riff o melodía: primero se aprenden las notas
// una por una y después se tocan a tiempo. Es lógica pura: se prueba en riff.test.js.
//
// Sale de una práctica de secuencia que además trae el ritmo:
//   { tipo: 'secuencia', pasos: [nota, nota, …], tempo: { bpm: 80, duraciones: [1.5, 0.5, …] } }
// `duraciones` dice cuántos pulsos dura cada nota (hasta que llega la siguiente): 1 = negra, 0.5 = corchea.
import { midiDePosicion } from './deteccionSonido.js';

const BPM_MIN = 30;
const BPM_MAX = 240;
export const VUELTAS = 2; // El riff se toca dos veces seguidas
export const APROBAR = 0.75;

// Una nota cuenta si suena desde un poco antes de llegar a la línea hasta un rato después:
// el detector tarda en reconocerla (analiza cada 150 ms una ventana de ~340 ms de audio)
export const MS_ANTES = 150;
export const MS_DESPUES = 550;

// Cuándo se frena y vuelve atrás: 3 errores seguidos, o 4 entre las últimas 6 notas
const ERRORES_SEGUIDOS = 3;
const ERRORES_EN_TRAMO = 4;
const TRAMO = 6;

// Devuelve { nombre, bpm, msPulso, notas, duracion } o null si la práctica no tiene ritmo.
// Cada nota es { cuerda, traste, dedo, midi, t (ms desde el comienzo), pulsos }.
export function obtenerRiff(leccion) {
  const p = leccion?.practica;
  if (p?.tipo !== 'secuencia' || !Array.isArray(p.pasos) || !p.tempo) return null;
  const { bpm, duraciones } = p.tempo;
  if (typeof bpm !== 'number' || bpm < BPM_MIN || bpm > BPM_MAX) return null;
  if (!Array.isArray(duraciones) || duraciones.length !== p.pasos.length) return null;
  if (duraciones.some((d) => typeof d !== 'number' || !(d > 0) || d > 16)) return null;

  const msPulso = 60000 / bpm;
  let t = 0;
  const notas = [];
  for (let i = 0; i < p.pasos.length; i++) {
    const paso = p.pasos[i];
    const pos = paso?.posiciones?.[0];
    // Solo notas sueltas: un acorde no entra en el riff en movimiento
    if (paso?.tipo !== 'nota' || paso.posiciones.length !== 1) return null;
    const cuerda = Number(pos.cuerda);
    const traste = Number(pos.traste);
    const midi = midiDePosicion(cuerda, traste);
    if (midi === null) return null;
    notas.push({ tipo: 'nota', cuerda, traste, dedo: pos.dedo ?? null, midi, t, pulsos: duraciones[i] });
    t += duraciones[i] * msPulso;
  }
  return { nombre: p.nombre || 'Riff', bpm, msPulso, notas, duracion: t };
}

// Las notas de todas las vueltas seguidas, con su tiempo dentro del recorrido completo.
// En las canciones, cada "nota" del recorrido puede ser un acorde (ver utils/canciones.js).
export function armarRecorrido(riff, vueltas = riff.vueltas ?? VUELTAS) {
  const notas = [];
  for (let v = 0; v < vueltas; v++) {
    riff.notas.forEach((n, i) => notas.push({ ...n, t: n.t + v * riff.duracion, vuelta: v, indiceEnRiff: i }));
  }
  return { notas, duracion: riff.duracion * vueltas };
}

// Hasta cuándo puede sonar: un acorde dura un compás, así que tiene más margen (`msDespues`)
export const finDeVentana = (nota) => nota.t + (nota.msDespues ?? MS_DESPUES);

// ¿Este momento (ms del recorrido) está dentro del margen de la nota?
export const enVentana = (nota, t) => t >= nota.t - MS_ANTES && t <= finDeVentana(nota);

// resultados: true (acertada), false (errada) o null (todavía no pasó), uno por nota.
// Si hay que volver atrás, devuelve el índice de la nota donde empezó a errar; si no, null.
export function dondeRetroceder(resultados) {
  const evaluados = [];
  resultados.forEach((r, i) => {
    if (r !== null) evaluados.push(i);
  });
  const ultimos = evaluados.slice(-TRAMO);
  if (ultimos.length === 0 || resultados[ultimos[ultimos.length - 1]] !== false) return null;

  // Errores seguidos al final
  let seguidos = 0;
  for (let k = ultimos.length - 1; k >= 0 && resultados[ultimos[k]] === false; k--) seguidos++;
  if (seguidos >= ERRORES_SEGUIDOS) return ultimos[ultimos.length - seguidos];

  // Muchos errores en un tramo corto: vuelve al primero de ellos
  const errores = ultimos.filter((i) => resultados[i] === false);
  if (errores.length >= ERRORES_EN_TRAMO) return errores[0];
  return null;
}

export function resumir(resultados) {
  const total = resultados.length;
  const aciertos = resultados.filter((r) => r === true).length;
  return { total, aciertos, aprobado: total > 0 && aciertos / total >= APROBAR };
}
