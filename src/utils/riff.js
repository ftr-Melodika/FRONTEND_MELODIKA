// Archivo: src/utils/riff.js
// El riff en movimiento: las notas avanzan por el mástil y hay que tocar cada una cuando pasa por
// la línea. Es la segunda parte de una lección de riff o melodía: primero se aprenden las notas
// una por una y después se tocan a tiempo. Es lógica pura: se prueba en riff.test.js.
//
// Sale de una práctica de secuencia que además trae el ritmo:
//   { tipo: 'secuencia', pasos: [nota, nota, …], tempo: { bpm: 80, duraciones: [1.5, 0.5, …] } }
// `duraciones` dice cuántos pulsos dura cada nota (hasta que llega la siguiente): 1 = negra, 0.5 = corchea.
import { midiDePosicion, nombreDeMidi } from './deteccionSonido.js';

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

// ───────────────────────── Práctica de un tropiezo ─────────────────────────
// Si se traba siempre en el mismo acorde (o nota), se frena y se practica aparte:
// la segunda vez que vuelve atrás por él, o la tercera vez que lo erra.
export const RETROCESOS_PARA_PRACTICAR = 2;
export const ERRORES_PARA_PRACTICAR = 3;

// Identifica un acorde por su nombre y una nota por su cuerda y traste (se repiten en el recorrido)
export const claveDeNota = (nota) => (nota.tipo === 'acorde' ? `acorde:${nota.nombre}` : `nota:${nota.cuerda}-${nota.traste}`);

// Lo que se practica: un acorde, cuerda por cuerda (de la más grave a la más aguda) y después entero;
// una nota, sola. Son consignas de la práctica de siempre (ver PracticaConDeteccion).
export function secuenciaDePractica(nota) {
  if (nota.tipo === 'acorde') {
    const cuerdas = nota.posiciones
      .map((pos, i) => ({ pos, midi: nota.midis[i] }))
      .sort((a, b) => b.pos.cuerda - a.pos.cuerda)
      .map(({ pos, midi }) => ({ tipo: 'nota', nombre: nombreDeMidi(midi), posiciones: [pos], midis: [midi] }));
    return [...cuerdas, { tipo: 'acorde', nombre: nota.nombre, posiciones: nota.posiciones, midis: nota.midis }];
  }
  const pos = { cuerda: nota.cuerda, traste: nota.traste, ...(nota.dedo != null ? { dedo: nota.dedo } : {}) };
  return [{ tipo: 'nota', nombre: nombreDeMidi(nota.midi), posiciones: [pos], midis: [nota.midi] }];
}

// Qué hacer cuando pasan notas sin sonar. `nuevosErrores` son los índices que se acaban de errar;
// `errores` y `retrocesos` cuentan por clave (ver claveDeNota) y se actualizan acá.
// Devuelve null (seguir), { accion: 'retroceder', desde } o { accion: 'practicar', desde, nota }.
export function decidirTropiezo(notas, resultados, nuevosErrores, errores, retrocesos) {
  for (const i of nuevosErrores) {
    const clave = claveDeNota(notas[i]);
    errores[clave] = (errores[clave] || 0) + 1;
  }
  const trabado = nuevosErrores.find((i) => errores[claveDeNota(notas[i])] >= ERRORES_PARA_PRACTICAR);
  const volverA = dondeRetroceder(resultados);
  if (volverA !== null) {
    const clave = claveDeNota(notas[volverA]);
    retrocesos[clave] = (retrocesos[clave] || 0) + 1;
    if (retrocesos[clave] >= RETROCESOS_PARA_PRACTICAR) return { accion: 'practicar', desde: volverA, nota: notas[volverA] };
  }
  if (trabado !== undefined) return { accion: 'practicar', desde: trabado, nota: notas[trabado] };
  if (volverA !== null) return { accion: 'retroceder', desde: volverA };
  return null;
}

// Después de practicar, ese acorde (o nota) vuelve a empezar de cero
export function olvidarTropiezo(nota, errores, retrocesos) {
  const clave = claveDeNota(nota);
  delete errores[clave];
  delete retrocesos[clave];
}
