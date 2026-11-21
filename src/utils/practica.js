// Archivo: src/utils/practica.js
// Lógica de la pantalla de Práctica. Es pura: se prueba en practica.test.js.
import { midiDePosicion, nombreDeMidi } from './deteccionSonido.js';
import { azarPorDefecto, mezclar } from './azar.js';

export const NOTAS = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
export const TRASTES_PRACTICA = 5; // Los mismos que dibuja GuitarNeck: la primera posición

export const notaDe = (cuerda, traste) => nombreDeMidi(midiDePosicion(cuerda, traste));

// Todas las posiciones de la primera posición, de la cuerda más fina a la más gruesa
export const POSICIONES = [1, 2, 3, 4, 5, 6].flatMap((cuerda) =>
  Array.from({ length: TRASTES_PRACTICA + 1 }, (_, traste) => ({ cuerda, traste }))
);

// Dónde se puede tocar una nota dentro de la primera posición
export function posicionesDeNota(nota) {
  return POSICIONES.filter((p) => notaDe(p.cuerda, p.traste) === nota);
}

// Una posición al azar cuya nota no sea la misma que la anterior: si se repite,
// la nota que todavía suena aprobaría la siguiente sin tocar nada
export function posicionAlAzar(anterior, azar = azarPorDefecto) {
  const notaAnterior = anterior ? notaDe(anterior.cuerda, anterior.traste) : null;
  const candidatas = POSICIONES.filter((p) => notaDe(p.cuerda, p.traste) !== notaAnterior);
  return candidatas[azar(candidatas.length)];
}

// Pregunta del modo "Adivinar": una posición distinta de la anterior y cuatro opciones
export function preguntaAlAzar(anterior, azar = azarPorDefecto, cantidadOpciones = 4) {
  let posicion;
  do {
    posicion = POSICIONES[azar(POSICIONES.length)];
  } while (anterior && anterior.cuerda === posicion.cuerda && anterior.traste === posicion.traste);
  const nota = notaDe(posicion.cuerda, posicion.traste);
  const incorrectas = mezclar(NOTAS.filter((n) => n !== nota), azar).slice(0, cantidadOpciones - 1);
  return { ...posicion, nota, opciones: mezclar([nota, ...incorrectas], azar) };
}
