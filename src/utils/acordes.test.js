// Ejecutar con: npm test
import test from 'node:test';
import assert from 'node:assert';
import { ACORDES_RESPALDO, acordeAlAzar, acordesDeContexto, acordesDeRespaldo, extraerAcordes, preguntaDeAcorde, tituloDeAcorde } from './acordes.js';
import { nombreDeMidi } from './deteccionSonido.js';

// Como llega del backend (GET /api/cursos/perfil/:perfilId/curso/:cursoId), ya pasado por mapearLeccion
const leccionDo = {
  id: 'e1', orden: 4, titulo: 'Acorde de Do mayor (Do)', tipo: 'Practica',
  practica: { tipo: 'acorde', nombre: 'Do', posiciones: [
    { dedo: 3, cuerda: 5, traste: 3 }, { dedo: 2, cuerda: 4, traste: 2 }, { cuerda: 3, traste: 0 },
    { dedo: 1, cuerda: 2, traste: 1 }, { cuerda: 1, traste: 0 }] },
};

test('extrae los acordes de las lecciones, con su forma y sus dedos', () => {
  const [acorde] = extraerAcordes([leccionDo]);
  assert.strictEqual(acorde.nombre, 'Do');
  assert.strictEqual(acorde.titulo, 'Acorde de Do mayor (Do)');
  assert.strictEqual(acorde.objetivo.tipo, 'acorde');
  assert.deepStrictEqual(acorde.objetivo.posiciones.map((p) => p.dedo), [3, 2, undefined, 1, undefined]);
  assert.deepStrictEqual([...new Set(acorde.objetivo.midis.map(nombreDeMidi))].sort(), ['Do', 'Mi', 'Sol']);
});

test('ignora lecciones sin acorde, inválidas o repetidas, y respeta el orden', () => {
  const lecciones = [
    { orden: 9, practica: { tipo: 'acorde', nombre: 'Re', posiciones: [{ cuerda: 4, traste: 0 }, { cuerda: 3, traste: 2 }] } },
    { ...leccionDo, orden: 5 },
    { orden: 1, practica: null, cuerda: 1, trasteObjetivo: 3 },
    { orden: 2, practica: { tipo: 'nota', posiciones: [{ cuerda: 1, traste: 0 }] } },
    { orden: 3, practica: { tipo: 'acorde', nombre: 'Roto', posiciones: [{ cuerda: 9, traste: 0 }, { cuerda: 1, traste: 0 }] } },
    { ...leccionDo, orden: 7, titulo: 'Repaso de Do' },
    null,
  ];
  assert.deepStrictEqual(extraerAcordes(lecciones).map((a) => a.nombre), ['Do', 'Re']);
  assert.deepStrictEqual(extraerAcordes(undefined), []);
});

test('el respaldo tiene los 6 acordes del curso y todos son válidos', () => {
  const acordes = acordesDeRespaldo();
  assert.deepStrictEqual(acordes.map((a) => a.nombre), ACORDES_RESPALDO.map((a) => a.nombre));
  const notas = Object.fromEntries(acordes.map((a) => [a.nombre, [...new Set(a.objetivo.midis.map(nombreDeMidi))].sort().join(' ')]));
  assert.deepStrictEqual(notas, {
    Mim: 'Mi Si Sol', Mi: 'Mi Si Sol#', Lam: 'Do La Mi', Do: 'Do Mi Sol', Sol: 'Re Si Sol', Re: 'Fa# La Re',
  });
});

test('acordeAlAzar no repite el anterior, salvo que haya uno solo', () => {
  const acordes = acordesDeRespaldo();
  let anterior = null;
  for (let i = 0; i < 300; i++) {
    const nuevo = acordeAlAzar(acordes, anterior);
    if (anterior) assert.notStrictEqual(nuevo.nombre, anterior.nombre);
    anterior = nuevo;
  }
  const uno = acordes.slice(0, 1);
  assert.strictEqual(acordeAlAzar(uno, uno[0]).nombre, uno[0].nombre);
});

test('preguntaDeAcorde trae el acorde correcto entre opciones distintas', () => {
  const acordes = acordesDeRespaldo();
  for (let i = 0; i < 100; i++) {
    const { acorde, opciones } = preguntaDeAcorde(acordes);
    assert.strictEqual(opciones.length, 4);
    assert.strictEqual(new Set(opciones).size, 4);
    assert.ok(opciones.includes(acorde.nombre));
  }
  // Con menos acordes que opciones, se usan los que hay
  assert.strictEqual(preguntaDeAcorde(acordes.slice(0, 2)).opciones.length, 2);
});

test('también toma los acordes que vienen dentro de una secuencia, sin los de dos notas', () => {
  const mim = { tipo: 'acorde', nombre: 'Mim', posiciones: [
    { cuerda: 6, traste: 0 }, { dedo: 2, cuerda: 5, traste: 2 }, { dedo: 3, cuerda: 4, traste: 2 },
    { cuerda: 3, traste: 0 }, { cuerda: 2, traste: 0 }, { cuerda: 1, traste: 0 }] };
  const lecciones = [
    { orden: 1, titulo: 'Acorde de Mi menor (Mim)', practica: { tipo: 'secuencia', nombre: 'Mim', pasos: [
      { tipo: 'nota', posiciones: [{ dedo: 2, cuerda: 5, traste: 2 }] },
      { tipo: 'nota', posiciones: [{ dedo: 3, cuerda: 4, traste: 2 }] },
      mim,
    ] } },
    { orden: 2, titulo: 'Boogie', practica: { tipo: 'secuencia', pasos: [
      { tipo: 'acorde', nombre: 'La5', posiciones: [{ cuerda: 5, traste: 0 }, { cuerda: 4, traste: 2 }] },
      { tipo: 'acorde', nombre: 'Sol7', posiciones: [
        { cuerda: 6, traste: 3 }, { cuerda: 5, traste: 2 }, { cuerda: 4, traste: 0 },
        { cuerda: 3, traste: 0 }, { cuerda: 2, traste: 0 }, { cuerda: 1, traste: 1 }] },
      mim,
    ] } },
  ];
  const acordes = extraerAcordes(lecciones);
  assert.deepStrictEqual(acordes.map((a) => a.nombre), ['Mim', 'Sol7']);
  assert.deepStrictEqual(acordes.map((a) => a.titulo), ['Mi menor', 'Sol séptima']);
});

test('tituloDeAcorde nombra mayores, menores y séptimas', () => {
  assert.strictEqual(tituloDeAcorde('Lam'), 'La menor');
  assert.strictEqual(tituloDeAcorde('Fa'), 'Fa mayor');
  assert.strictEqual(tituloDeAcorde('Re7'), 'Re séptima');
  assert.strictEqual(tituloDeAcorde('Fa#m'), 'Fa# menor');
  assert.strictEqual(tituloDeAcorde('La5'), 'La5');
});

test('si dos cursos enseñan el mismo acorde, queda el del curso anterior', () => {
  const fa = (posiciones) => ({ tipo: 'acorde', nombre: 'Fa', posiciones });
  const facil = fa([{ cuerda: 4, traste: 3 }, { cuerda: 3, traste: 2 }, { cuerda: 2, traste: 1 }, { cuerda: 1, traste: 1 }]);
  const cejilla = fa([{ cuerda: 6, traste: 1 }, { cuerda: 5, traste: 3 }, { cuerda: 4, traste: 3 }, { cuerda: 3, traste: 2 }, { cuerda: 2, traste: 1 }, { cuerda: 1, traste: 1 }]);
  const [acorde] = extraerAcordes([
    { ordenCurso: 8, orden: 2, titulo: 'Fa con cejilla', practica: cejilla },
    { ordenCurso: 5, orden: 8, titulo: 'Fa sin cejilla', practica: facil },
  ]);
  assert.strictEqual(acorde.titulo, 'Fa sin cejilla');
});

test('acordesDeContexto: cada nota del acorde perfecto muestra la forma entera del acorde', () => {
  const nota = (cuerda, traste) => ({ tipo: 'nota', posiciones: [{ cuerda, traste }] });
  const lam = { tipo: 'acorde', nombre: 'Lam', posiciones: [{ cuerda: 5, traste: 0 }, { cuerda: 4, traste: 2, dedo: 2 }, { cuerda: 3, traste: 2, dedo: 3 }, { cuerda: 2, traste: 1, dedo: 1 }, { cuerda: 1, traste: 0 }] };
  const contexto = acordesDeContexto([nota(5, 0), nota(4, 2), nota(2, 1), lam]);
  assert.deepStrictEqual(contexto, [lam.posiciones, lam.posiciones, lam.posiciones, null]);
});

test('acordesDeContexto: una nota que no es del acorde siguiente (un riff) se muestra sola', () => {
  const nota = (cuerda, traste) => ({ tipo: 'nota', posiciones: [{ cuerda, traste }] });
  const re = { tipo: 'acorde', nombre: 'Re', posiciones: [{ cuerda: 4, traste: 0 }, { cuerda: 3, traste: 2, dedo: 1 }, { cuerda: 2, traste: 3, dedo: 3 }, { cuerda: 1, traste: 2, dedo: 2 }] };
  assert.deepStrictEqual(acordesDeContexto([nota(6, 3), re]), [null, null]);
  assert.deepStrictEqual(acordesDeContexto([nota(1, 0), nota(1, 1), nota(1, 3)]), [null, null, null]);
});
