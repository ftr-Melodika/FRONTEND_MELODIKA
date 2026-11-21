// Archivo: src/utils/azar.js
// Azar para los modos de práctica. `azar(maximo)` devuelve un entero de 0 a maximo - 1:
// se puede reemplazar en los tests para que el resultado sea fijo. Se prueba en azar.test.js.

export const azarPorDefecto = (maximo) => Math.floor(Math.random() * maximo);

// Copia de la lista en otro orden (Fisher-Yates), sin tocar la original
export function mezclar(lista, azar = azarPorDefecto) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = azar(i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
