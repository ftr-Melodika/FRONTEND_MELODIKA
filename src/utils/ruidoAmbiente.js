// Archivo: src/utils/ruidoAmbiente.js
// El ruido del lugar que ya se midió, guardado solo en memoria mientras la app esté abierta:
// no va al disco ni a ningún servidor. Si se cierra la app, la próxima vez se mide de nuevo.
// Lo escribe useRuidoAmbiente (cuando el alumno no está tocando) y lo leen los detectores de las
// prácticas, para empezar sin calibrar. Es lógica pura: se prueba en ruidoAmbiente.test.js.
let medido = null;

export const ruidoMedido = () => medido;
export const guardarRuido = (ruido) => {
  medido = ruido || null;
};
export const olvidarRuido = () => {
  medido = null;
};
