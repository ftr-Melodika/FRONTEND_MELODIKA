// Archivo: src/utils/texto.js
// Texto para buscar: es lógica pura y se prueba en texto.test.js.

// Minúsculas, sin tildes y sin espacios en los bordes: "Ángel " coincide con "angel"
export const normalizarTexto = (texto) =>
  String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
