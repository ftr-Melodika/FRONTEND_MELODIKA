// Archivo: src/utils/cejilla.js
// Detecta las cejillas de un acorde para dibujarlas como una barra en el mástil.
// Es lógica pura: se prueba en cejilla.test.js.

// Hay cejilla cuando un mismo dedo (indicado en los datos, no sugerido) aprieta 2 o más cuerdas
// en el mismo traste. La barra va desde la cuerda más grave hasta la más aguda que aprieta ese dedo:
// las del medio también quedan apretadas, aunque otro dedo las pise más arriba.
// Si alguna cuerda del medio se toca al aire, no puede ser una cejilla (la barra la apagaría).
// Devuelve [{ dedo, traste, desde, hasta }], con desde = cuerda más grave (número mayor).
export function detectarCejillas(posiciones) {
  if (!Array.isArray(posiciones)) return [];
  const grupos = new Map();
  posiciones.forEach((p) => {
    const traste = Number(p?.traste);
    const cuerda = Number(p?.cuerda);
    if (!p?.dedo || !traste || !cuerda) return;
    const clave = `${p.dedo}@${traste}`;
    if (!grupos.has(clave)) grupos.set(clave, { dedo: p.dedo, traste, cuerdas: [] });
    grupos.get(clave).cuerdas.push(cuerda);
  });

  const alAire = new Set(posiciones.filter((p) => Number(p?.traste) === 0).map((p) => Number(p.cuerda)));

  return [...grupos.values()]
    .filter((g) => g.cuerdas.length >= 2)
    .map((g) => ({ dedo: g.dedo, traste: g.traste, desde: Math.max(...g.cuerdas), hasta: Math.min(...g.cuerdas) }))
    .filter((c) => ![...alAire].some((cuerda) => cuerda < c.desde && cuerda > c.hasta));
}

// Cejillas de una lección (lista de consignas de obtenerSecuencia), para mostrarlas también en los
// pasos de nota suelta. Salen de sus acordes; si la lección no tiene acordes pero todas sus notas
// las aprieta el mismo dedo en el mismo traste (un ejercicio de cejilla nota por nota), de esas notas.
// No se juntan las notas sueltas de cualquier lección: en una escala un mismo dedo pisa el mismo
// traste en varias cuerdas y eso no es una cejilla.
export function cejillasDeSecuencia(secuencia) {
  if (!Array.isArray(secuencia)) return [];
  const acordes = secuencia.filter((paso) => paso?.tipo === 'acorde');
  if (acordes.length > 0) {
    const vistas = new Map();
    acordes.forEach((paso) => detectarCejillas(paso.posiciones).forEach((c) => vistas.set(`${c.dedo}@${c.traste}@${c.desde}@${c.hasta}`, c)));
    return [...vistas.values()];
  }
  const notas = secuencia.flatMap((paso) => (paso?.tipo === 'nota' ? paso.posiciones || [] : []));
  const cejillas = detectarCejillas(notas);
  const todasEnLaCejilla = cejillas.length === 1 && notas.every((p) => enCejilla(cejillas, Number(p.cuerda), p.traste));
  return todasEnLaCejilla ? cejillas : [];
}

// ¿Esta posición queda tapada por alguna cejilla? (mismo traste, dentro del rango de cuerdas)
export function enCejilla(cejillas, cuerda, traste) {
  return cejillas.some((c) => c.traste === Number(traste) && cuerda <= c.desde && cuerda >= c.hasta);
}
