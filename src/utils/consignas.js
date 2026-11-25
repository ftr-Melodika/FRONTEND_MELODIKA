// Archivo: src/utils/consignas.js
// Dos formatos de práctica que arman varias cosas a partir de una sola clase. Es lógica pura: se prueba en consignas.test.js.
//
// 1) practica.tipo = 'consignas': varias prácticas seguidas dentro de la misma clase.
//    { tipo: 'consignas', consignas: [ { …una práctica normal…, instruccion: 'texto propio' }, … ] }
//
// 2) practica.tipo = 'notasAlAzar': la app arma las notas cada vez que se entra a la clase.
//    { tipo: 'notasAlAzar', cantidad: 8, cuerdas: [1..6], trastes: [1..4], dedo: 1, vecesPorTraste: 2 }
//    Con `dedoPorTraste: true` el dedo es el mismo número que el traste (1 en el 1, 2 en el 2…).
import { azarPorDefecto, mezclar } from './azar.js';

const CUERDAS_VALIDAS = [1, 2, 3, 4, 5, 6];
const CANTIDAD_MAXIMA = 40;

const esObjeto = (valor) => !!valor && typeof valor === 'object' && !Array.isArray(valor);

// Las consignas de una clase como lecciones sueltas: cada una conserva todo lo de la clase
// pero con su propia `practica` y su `instruccion` (texto de la barra lateral, o null).
// Una consigna inválida se descarta y no se admiten consignas dentro de consignas.
// Devuelve null si la clase no es de tipo 'consignas' o no quedó ninguna válida.
const esPasoNota = (paso) => paso?.tipo === 'nota' && Array.isArray(paso.posiciones) && paso.posiciones.length === 1;
const primerPasoAcorde = (practica) =>
  practica?.tipo === 'secuencia' && Array.isArray(practica.pasos)
    ? practica.pasos.find((paso) => paso?.tipo === 'acorde' && Array.isArray(paso.posiciones))
    : null;
const tocaEnElAcorde = (paso, acorde) => acorde.posiciones.some(
  (a) => Number(a.cuerda) === Number(paso.posiciones[0].cuerda) && Number(a.traste) === Number(paso.posiciones[0].traste),
);

// En las clases de acordes, la primera consigna toca el acorde cuerda por cuerda (puras notas sueltas)
// y el acorde entero recién viene en una consigna posterior. A cada nota se le agrega la forma de ese
// acorde (`formaAcorde` y `nombreAcorde`) para que el mástil la muestre completa desde el principio.
// Solo si todas las notas de la consigna pertenecen al acorde.
export function conFormaDelAcorde(practicas) {
  return practicas.map((practica, i) => {
    const pasos = practica?.tipo === 'secuencia' ? practica.pasos : null;
    if (!Array.isArray(pasos) || pasos.length === 0 || !pasos.every(esPasoNota)) return practica;
    const acorde = practicas.slice(i + 1).map(primerPasoAcorde).find((a) => a && pasos.every((paso) => tocaEnElAcorde(paso, a)));
    if (!acorde) return practica;
    return { ...practica, pasos: pasos.map((paso) => ({ ...paso, formaAcorde: acorde.posiciones, nombreAcorde: acorde.nombre })) };
  });
}

export function obtenerConsignas(leccion) {
  const practica = leccion?.practica;
  if (practica?.tipo !== 'consignas' || !Array.isArray(practica.consignas)) return null;
  const consignas = conFormaDelAcorde(practica.consignas.filter((c) => esObjeto(c) && typeof c.tipo === 'string' && c.tipo !== 'consignas'))
    .map((c) => {
      const { instruccion, ...resto } = c;
      const texto = typeof instruccion === 'string' ? instruccion.trim() : '';
      return { ...leccion, practica: resto, instruccion: texto || null };
    });
  return consignas.length > 0 ? consignas : null;
}

// Lista de enteros únicos dentro de [minimo, maximo], o null si no queda ninguno
function enteros(valor, minimo, maximo) {
  if (!Array.isArray(valor)) return null;
  const lista = [...new Set(valor.map(Number).filter((n) => Number.isInteger(n) && n >= minimo && n <= maximo))];
  return lista.length > 0 ? lista : null;
}

// Los trastes a tocar: cada traste `vecesPorTraste` veces (1 si no se indica) y, si falta para
// llegar a `cantidad`, se vuelve a empezar la lista. Sobrante se descarta.
function trastesAlAzar(trastes, cantidad, vecesPorTraste, azar) {
  const veces = Number.isInteger(vecesPorTraste) && vecesPorTraste > 0 ? vecesPorTraste : 1;
  const base = trastes.flatMap((traste) => Array(veces).fill(traste));
  const lista = Array.from({ length: cantidad }, (_, i) => base[i % base.length]);
  return mezclar(lista, azar);
}

// Arma la práctica de tipo 'secuencia' (notas sueltas) a partir de una de 'notasAlAzar'.
// Una nota nunca repite la posición (cuerda + traste) de la anterior.
// Devuelve null si el formato es inválido (sin cuerdas, sin trastes o cantidad fuera de rango).
export function armarNotasAlAzar(practica, azar = azarPorDefecto) {
  if (practica?.tipo !== 'notasAlAzar') return null;
  const cuerdas = enteros(practica.cuerdas, 1, CUERDAS_VALIDAS.length);
  const trastes = enteros(practica.trastes, 1, 24);
  const cantidad = Number(practica.cantidad);
  if (!cuerdas || !trastes || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > CANTIDAD_MAXIMA) return null;

  const dedoFijo = Number.isInteger(practica.dedo) ? practica.dedo : null;
  const pasos = [];
  let anterior = null;
  for (const traste of trastesAlAzar(trastes, cantidad, practica.vecesPorTraste, azar)) {
    const posibles = cuerdas.filter((c) => !(anterior && anterior.cuerda === c && anterior.traste === traste));
    const candidatas = posibles.length > 0 ? posibles : cuerdas;
    const cuerda = candidatas[azar(candidatas.length)];
    const dedo = practica.dedoPorTraste ? traste : dedoFijo;
    anterior = { cuerda, traste };
    pasos.push({ tipo: 'nota', posiciones: [dedo ? { cuerda, traste, dedo } : { cuerda, traste }] });
  }
  return { tipo: 'secuencia', nombre: practica.nombre || 'Notas al azar', pasos };
}

// La clase con sus notas al azar ya armadas (una secuencia común). Si no es de ese tipo, o es
// inválida, devuelve la misma clase.
export function resolverNotasAlAzar(leccion, azar = azarPorDefecto) {
  const armada = armarNotasAlAzar(leccion?.practica, azar);
  return armada ? { ...leccion, practica: armada } : leccion;
}
