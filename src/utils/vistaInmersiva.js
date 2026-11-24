// Archivo: src/utils/vistaInmersiva.js
// Qué prácticas se juegan en la vista inmersiva: el mástil ocupa casi toda la pantalla, sin barra
// lateral ni botones, y al tocar la pantalla se abre el menú de pausa. Es lógica pura: se prueba en vistaInmersiva.test.js.
//
// Las prácticas que necesitan sus propios controles (responder un quiz, el medidor de afinación,
// la cuenta del ritmo) siguen con la pantalla de siempre.

const TIPOS_CON_CONTROLES = ['quiz', 'afinacion', 'ritmo'];

const esObjeto = (valor) => !!valor && typeof valor === 'object' && !Array.isArray(valor);
const tieneControles = (practica) => esObjeto(practica) && TIPOS_CON_CONTROLES.includes(practica.tipo);

// Una clase con varias consignas es inmersiva solo si ninguna de sus consignas necesita controles
export function usaVistaInmersiva(leccion) {
  const practica = leccion?.practica;
  if (tieneControles(practica)) return false;
  if (esObjeto(practica) && practica.tipo === 'consignas' && Array.isArray(practica.consignas)) {
    return !practica.consignas.some(tieneControles);
  }
  return true;
}
