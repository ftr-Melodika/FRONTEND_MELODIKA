// Archivo: src/utils/codigoGrupo.js
// Código de los grupos privados: 8 letras (mayúsculas y minúsculas, se distinguen) o números.
// El backend tiene la misma regla en src/helpers/codigoGrupo.js.

export const LARGO_CODIGO_GRUPO = 8;
const FORMATO = /^[A-Za-z0-9]{8}$/;

// Saca espacios y cualquier carácter que no sea letra o número (por ejemplo, al pegarlo de un chat).
// No cambia mayúsculas: "AbC12345" y "abc12345" son códigos distintos.
export const limpiarCodigoGrupo = (texto) => String(texto ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, LARGO_CODIGO_GRUPO);

export const esCodigoGrupoValido = (codigo) => FORMATO.test(codigo);
