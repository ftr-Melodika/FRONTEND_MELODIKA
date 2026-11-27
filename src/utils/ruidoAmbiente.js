// Archivo: src/utils/ruidoAmbiente.js
// El ruido del lugar que ya se midió, guardado solo en memoria mientras la app esté abierta:
// no va al disco ni a ningún servidor. Si se cierra la app, la próxima vez se mide de nuevo.
// Lo escribe useRuidoAmbiente (cuando el alumno no está tocando) y lo leen los detectores de las
// prácticas, que empiezan sin esperar ninguna medición. Es lógica pura: se prueba en ruidoAmbiente.test.js.
let medido = null;

// Pantallas donde no se toca la guitarra ni suena nada de la app: ahí se puede medir.
// Quedan afuera el afinador, la práctica y las canciones. La lección decide sola (ver LeccionScreen).
const PANTALLAS_PARA_MEDIR = [
  'SelectUser', 'CreateUser', 'EditUser', 'AjustesCuenta', 'Home', 'Progreso', 'Ranking', 'RankingGrupo',
  'Logros', 'PreguntasFrecuentes', 'PerfilPublico', 'Solicitudes', 'AgregarAmigo', 'InvitacionAmigo',
  'Feedback', 'Grupos', 'GrupoChat', 'ReportarError', 'Contacto', 'Canciones', 'UsoMicrofono',
];

// `ruta` es la pantalla actual de React Navigation: { name, params }
export function puedeMedirEnPantalla(ruta) {
  if (!ruta) return false;
  // La bienvenida de Home ("tocá cualquier cuerda") ya usa el micrófono
  if (ruta.name === 'Home' && ruta.params?.bienvenida) return false;
  return PANTALLAS_PARA_MEDIR.includes(ruta.name);
}

export const ruidoMedido = () => medido;
export const guardarRuido = (ruido) => {
  medido = ruido || null;
};
export const olvidarRuido = () => {
  medido = null;
};
