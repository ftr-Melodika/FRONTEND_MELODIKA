// Archivo: src/utils/amigos.js
// Orden y filtro de la lista de amigos (selector de integrantes al crear un grupo).

// Minúsculas y sin tildes: "Ángel" coincide con "angel"
const normalizar = (texto) =>
  String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const nombreDe = (amigo) => amigo?.perfil?.nombre ?? '';
const usernameDe = (amigo) => amigo?.perfil?.username ?? '';

// Los amigos llegan como { amistadId, perfil: { id, nombre, username, avatarUrl } }.
// Orden A-Z por nombre (con el criterio del español: la base de datos puede ordenar mal las tildes).
export function ordenarAmigos(amigos) {
  return [...(amigos || [])].sort((a, b) =>
    nombreDe(a).localeCompare(nombreDe(b), 'es', { sensitivity: 'base' }) ||
    usernameDe(a).localeCompare(usernameDe(b), 'es', { sensitivity: 'base' })
  );
}

// Filtra solo dentro de los amigos que recibe, por nombre o username (con o sin "@").
export function filtrarAmigos(amigos, texto) {
  const consulta = normalizar(texto).replace(/^@/, '');
  if (!consulta) return amigos || [];
  return (amigos || []).filter((amigo) =>
    normalizar(nombreDe(amigo)).includes(consulta) || normalizar(usernameDe(amigo)).includes(consulta)
  );
}

// Alterna un id en el conjunto de seleccionados sin mutar el anterior.
export function alternarSeleccion(seleccionados, id) {
  const siguiente = new Set(seleccionados);
  if (siguiente.has(id)) siguiente.delete(id);
  else siguiente.add(id);
  return siguiente;
}
