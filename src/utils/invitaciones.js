// Archivo: src/utils/invitaciones.js
// Links de invitación de amistad: melodika://invitar/<token>
// (en Expo Go llega como exp://host/--/invitar/<token>, por eso solo buscamos el tramo "invitar/<token>").

const PATRON_TOKEN = /(?:^|\/)invitar\/([A-Za-z0-9_-]{16,64})(?:[/?#]|$)/;

// Devuelve el token del link, o null si la URL no es una invitación.
export function extraerTokenInvitacion(url) {
  if (typeof url !== 'string') return null;
  return url.match(PATRON_TOKEN)?.[1] ?? null;
}

// Texto para compartir por WhatsApp, etc.
export function mensajeInvitacion(nombre, url) {
  return `${nombre} te invita a ser su amigo en Melodika. Abrí este link: ${url}`;
}
