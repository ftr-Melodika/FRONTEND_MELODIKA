// Archivo: src/utils/logros.js
// Arma la lista de logros con lo que ya manda el backend: el resumen de progreso (cursos, lecciones,
// xp, racha), el catálogo de canciones y las estrellas del perfil. Es pura: se prueba en logros.test.js.
// Hay un logro por cada curso (si se agrega un curso en el backend, aparece solo) y uno por cada
// nivel de canción. Cada logro trae el texto de qué hacer para desbloquearlo y a qué pantalla ir.
import { nivelDeCancion, ESTRELLAS_MAXIMAS } from './canciones.js';

// A dónde lleva el botón de la ventanita de cada logro
export const DESTINOS = {
  cursos: { pantalla: 'Home', texto: 'Ir a los cursos' },
  canciones: { pantalla: 'Canciones', texto: 'Ir a Canciones' },
};

const ICONOS_CURSO = ['pua', 'notas', 'guitarra', 'partitura'];
const RACHAS = [
  { meta: 3, icono: 'llama', titulo: 'En llamas' },
  { meta: 7, icono: 'cometa', titulo: 'Imparable' },
];
const METAS_XP = [
  { meta: 100, icono: 'rayo', color: 'rayo', titulo: 'Aprendiz' },
  { meta: 500, icono: 'diamante', color: 'celeste', titulo: 'Virtuoso' },
];
const NIVELES_CANCION = [
  { nivel: 'Fácil', id: 'cancionFacil', titulo: 'Primera canción', icono: 'notas', color: 'verde' },
  { nivel: 'Intermedia', id: 'cancionIntermedia', titulo: 'Subiendo el nivel', icono: 'partitura', color: 'violeta' },
  { nivel: 'Difícil', id: 'cancionDificil', titulo: 'Sin miedo', icono: 'trofeo', color: 'oro' },
];

const plural = (n, singular, varios) => `${n} ${n === 1 ? singular : varios}`;

// Completa cada logro con su avance: conseguido, porcentaje y cuánto falta
function conAvance(logro) {
  const actual = Math.max(0, logro.actual ?? 0);
  const meta = Math.max(1, logro.meta);
  const conseguido = logro.conseguido ?? actual >= meta;
  return {
    ...logro,
    actual: Math.min(actual, meta),
    meta,
    conseguido,
    porcentaje: conseguido ? 100 : Math.min(100, Math.round((actual / meta) * 100)),
    falta: conseguido ? 0 : Math.max(0, meta - actual),
  };
}

function logrosDeCursos(cursos) {
  return cursos.map((curso, i) => {
    const total = curso.totalLecciones ?? 0;
    const hechas = curso.leccionesCompletadas ?? 0;
    const faltan = Math.max(0, total - hechas);
    const pasos = [`Completá las ${plural(total, 'lección', 'lecciones')} del curso "${curso.nombre}".`];
    if (!curso.desbloqueado) pasos.push('Este curso se abre cuando terminás el anterior.');
    else if (faltan > 0) pasos.push(`Te ${faltan === 1 ? 'falta' : 'faltan'} ${plural(faltan, 'lección', 'lecciones')}.`);
    return {
      id: `curso-${curso.id}`,
      icono: ICONOS_CURSO[i % ICONOS_CURSO.length],
      titulo: curso.nombre,
      descripcion: 'Terminá este curso',
      comoDesbloquear: pasos.join(' '),
      actual: hechas,
      meta: total || 1,
      conseguido: !!curso.completado,
      destino: DESTINOS.cursos,
    };
  });
}

function logrosDeCanciones(canciones, estrellas) {
  const logros = [];
  NIVELES_CANCION.forEach(({ nivel, id, titulo, icono, color }) => {
    const delNivel = canciones.filter((c) => nivelDeCancion(c) === nivel);
    if (delNivel.length === 0) return; // Si no hay canciones de ese nivel, no se puede conseguir
    const aprendidas = delNivel.filter((c) => (estrellas[c.id] ?? 0) >= 1).length;
    logros.push({
      id,
      icono,
      color,
      titulo,
      descripcion: `Aprendé una canción ${nivel.toLowerCase()}`,
      comoDesbloquear: `En Canciones, elegí una canción ${nivel.toLowerCase()} y tocala entera a velocidad normal (x1). Cuando la terminás ganás estrellas y el logro queda desbloqueado.`,
      actual: aprendidas,
      meta: 1,
      destino: DESTINOS.canciones,
    });
  });

  if (canciones.length > 0) {
    const perfectas = Object.values(estrellas).filter((e) => e >= ESTRELLAS_MAXIMAS).length;
    logros.push({
      id: 'cancionPerfecta',
      icono: 'medalla1',
      color: 'oro',
      titulo: 'Perfecta',
      descripcion: `Conseguí ${ESTRELLAS_MAXIMAS} estrellas en una canción`,
      comoDesbloquear: `Tocá cualquier canción entera a velocidad normal (x1) acertando casi todos los acordes (95 % o más) para llevarte las ${ESTRELLAS_MAXIMAS} estrellas.`,
      actual: perfectas,
      meta: 1,
      destino: DESTINOS.canciones,
    });
  }
  return logros;
}

// `resumen` es la respuesta de /progreso; `perfil` se usa de respaldo para xp y racha.
// `canciones` es el catálogo y `estrellas` es { idDeLaCancion: 1 a 3 }.
export function armarLogros({ resumen = null, perfil = null, canciones = [], estrellas = {} } = {}) {
  const cursos = resumen?.cursos ?? [];
  const lecciones = resumen?.leccionesCompletadas ?? 0;
  const racha = resumen?.racha ?? perfil?.racha ?? 0;
  const xp = resumen?.xp ?? perfil?.xp ?? 0;
  const totalCursos = resumen?.totalCursos ?? cursos.length;
  const cursosCompletados = resumen?.cursosCompletados ?? cursos.filter((c) => c.completado).length;

  const logros = [
    {
      id: 'primeraLeccion',
      icono: 'guitarra',
      titulo: 'Primeros acordes',
      descripcion: 'Completá tu primera lección',
      comoDesbloquear: 'Entrá a un curso desde el inicio y completá cualquier lección.',
      actual: lecciones,
      meta: 1,
      destino: DESTINOS.cursos,
    },
    ...logrosDeCursos(cursos),
  ];

  if (totalCursos > 0) {
    logros.push({
      id: 'graduado',
      icono: 'trofeo',
      color: 'oro',
      titulo: 'Graduado',
      descripcion: 'Terminá todos los cursos',
      comoDesbloquear: `Completá los ${plural(totalCursos, 'curso', 'cursos')}. Llevás ${cursosCompletados}.`,
      actual: cursosCompletados,
      meta: totalCursos,
      destino: DESTINOS.cursos,
    });
  }

  logros.push(...logrosDeCanciones(canciones, estrellas));

  RACHAS.forEach(({ meta, icono, titulo }) => logros.push({
    id: `racha${meta}`,
    icono,
    color: 'llama',
    titulo,
    descripcion: `Llegá a una racha de ${meta} días`,
    comoDesbloquear: `Completá al menos una lección por día durante ${meta} días seguidos. Si un día no practicás, la racha vuelve a empezar.`,
    actual: racha,
    meta,
    destino: DESTINOS.cursos,
  }));

  METAS_XP.forEach(({ meta, icono, color, titulo }) => logros.push({
    id: `xp${meta}`,
    icono,
    color,
    titulo,
    descripcion: `Juntá ${meta} XP`,
    comoDesbloquear: `Ganás XP la primera vez que completás cada lección de los cursos.${xp < meta ? ` Te faltan ${meta - xp} XP.` : ''}`,
    actual: xp,
    meta,
    destino: DESTINOS.cursos,
  }));

  return logros.map(conAvance);
}
