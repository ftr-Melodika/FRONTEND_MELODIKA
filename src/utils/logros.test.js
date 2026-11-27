import test from 'node:test';
import assert from 'node:assert/strict';
import { armarLogros, DESTINOS } from './logros.js';

const cursos = [
  { id: 'a', nombre: 'Primeros pasos I', completado: true, desbloqueado: true, totalLecciones: 4, leccionesCompletadas: 4 },
  { id: 'b', nombre: 'Primeros acordes', completado: false, desbloqueado: true, totalLecciones: 6, leccionesCompletadas: 2 },
  { id: 'c', nombre: 'Primer rasgueo', completado: false, desbloqueado: false, totalLecciones: 3, leccionesCompletadas: 0 },
];
const resumen = { xp: 250, racha: 4, leccionesCompletadas: 6, totalCursos: 3, cursosCompletados: 1, cursos };
const canciones = [
  { id: 'f1', titulo: 'Fácil', dificultad: 'facil', progresion: [] },
  { id: 'f2', titulo: 'Otra fácil', dificultad: 'facil', progresion: [] },
  { id: 'i1', titulo: 'Intermedia', dificultad: 'intermedia', progresion: [] },
  { id: 'd1', titulo: 'Difícil', dificultad: 'dificil', progresion: [] },
];
const buscar = (logros, id) => logros.find((l) => l.id === id);

test('armarLogros arma un logro por curso, con lo que falta', () => {
  const logros = armarLogros({ resumen });
  const primero = buscar(logros, 'curso-a');
  assert.equal(primero.titulo, 'Primeros pasos I');
  assert.equal(primero.conseguido, true);
  assert.equal(primero.porcentaje, 100);

  const segundo = buscar(logros, 'curso-b');
  assert.equal(segundo.conseguido, false);
  assert.equal(segundo.actual, 2);
  assert.equal(segundo.meta, 6);
  assert.match(segundo.comoDesbloquear, /faltan 4 lecciones/);
  assert.equal(segundo.destino, DESTINOS.cursos);

  assert.match(buscar(logros, 'curso-c').comoDesbloquear, /cuando terminás el anterior/);
});

test('armarLogros cuenta los cursos terminados para Graduado', () => {
  const graduado = buscar(armarLogros({ resumen }), 'graduado');
  assert.equal(graduado.actual, 1);
  assert.equal(graduado.meta, 3);
  assert.equal(graduado.conseguido, false);
});

test('armarLogros desbloquea la canción de un nivel con al menos una estrella', () => {
  const logros = armarLogros({ resumen, canciones, estrellas: { f2: 1, d1: 3 } });
  assert.equal(buscar(logros, 'cancionFacil').conseguido, true);
  assert.equal(buscar(logros, 'cancionIntermedia').conseguido, false);
  assert.equal(buscar(logros, 'cancionDificil').conseguido, true);
  assert.equal(buscar(logros, 'cancionPerfecta').conseguido, true);
  assert.equal(buscar(logros, 'cancionFacil').destino, DESTINOS.canciones);
});

test('armarLogros no muestra el logro de un nivel sin canciones', () => {
  const logros = armarLogros({ resumen, canciones: canciones.filter((c) => c.dificultad !== 'dificil') });
  assert.equal(buscar(logros, 'cancionDificil'), undefined);
  assert.ok(buscar(logros, 'cancionFacil'));
});

test('armarLogros usa racha y xp, con el perfil de respaldo', () => {
  const logros = armarLogros({ resumen });
  assert.equal(buscar(logros, 'racha3').conseguido, true);
  assert.equal(buscar(logros, 'racha7').actual, 4);
  assert.equal(buscar(logros, 'xp100').conseguido, true);
  assert.match(buscar(logros, 'xp500').comoDesbloquear, /faltan 250 XP/);

  const sinResumen = armarLogros({ perfil: { xp: 120, racha: 1 } });
  assert.equal(buscar(sinResumen, 'xp100').conseguido, true);
  assert.equal(buscar(sinResumen, 'graduado'), undefined);
});

test('armarLogros no pasa del 100 % ni muestra más que la meta', () => {
  const xp = buscar(armarLogros({ resumen: { ...resumen, xp: 9000 } }), 'xp500');
  assert.equal(xp.actual, 500);
  assert.equal(xp.porcentaje, 100);
  assert.equal(xp.falta, 0);
});
