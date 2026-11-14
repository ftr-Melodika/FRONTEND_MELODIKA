import { test } from 'node:test';
import assert from 'node:assert';
import { detectarCejillas, enCejilla, cejillasDeSecuencia } from './cejilla.js';

const p = (cuerda, traste, dedo) => (dedo ? { cuerda, traste, dedo } : { cuerda, traste });

test('Fa con cejilla: una barra del dedo 1 en el traste 1, de la 6ta a la 1ra', () => {
  const fa = [p(6, 1, 1), p(5, 3, 3), p(4, 3, 4), p(3, 2, 2), p(2, 1, 1), p(1, 1, 1)];
  assert.deepStrictEqual(detectarCejillas(fa), [{ dedo: 1, traste: 1, desde: 6, hasta: 1 }]);
});

test('la barra cubre todo el rango aunque solo vengan los extremos', () => {
  const fa = [p(6, 1, 1), p(5, 3, 3), p(4, 3, 4), p(3, 2, 2), p(1, 1, 1)];
  const cejillas = detectarCejillas(fa);
  assert.deepStrictEqual(cejillas, [{ dedo: 1, traste: 1, desde: 6, hasta: 1 }]);
  assert.ok(enCejilla(cejillas, 2, 1));
  assert.ok(!enCejilla(cejillas, 5, 3));
});

test('Fa sin cejilla: el dedo 1 aprieta 1ra y 2da (media cejilla)', () => {
  const fa = [p(4, 3, 3), p(3, 2, 2), p(2, 1, 1), p(1, 1, 1)];
  assert.deepStrictEqual(detectarCejillas(fa), [{ dedo: 1, traste: 1, desde: 2, hasta: 1 }]);
});

test('acordes abiertos sin dedo repetido no tienen cejilla', () => {
  const lam = [p(5, 0), p(4, 2, 2), p(3, 2, 3), p(2, 1, 1), p(1, 0)];
  assert.deepStrictEqual(detectarCejillas(lam), []);
});

test('sin dedo indicado no se adivina una cejilla', () => {
  assert.deepStrictEqual(detectarCejillas([p(2, 1), p(1, 1)]), []);
});

test('una cuerda al aire en el medio impide la cejilla', () => {
  assert.deepStrictEqual(detectarCejillas([p(3, 2, 1), p(2, 0), p(1, 2, 1)]), []);
});

test('datos inválidos devuelven lista vacía', () => {
  assert.deepStrictEqual(detectarCejillas(undefined), []);
  assert.deepStrictEqual(detectarCejillas([null, {}]), []);
});

const nota = (cuerda, traste, dedo) => ({ tipo: 'nota', posiciones: [p(cuerda, traste, dedo)] });
const acorde = (posiciones) => ({ tipo: 'acorde', posiciones });

test('"Tu primera cejilla": seis notas con el dedo 1 en el traste 3 forman la cejilla', () => {
  const secuencia = [6, 5, 4, 3, 2, 1].map((c) => nota(c, 3, 1));
  assert.deepStrictEqual(cejillasDeSecuencia(secuencia), [{ dedo: 1, traste: 3, desde: 6, hasta: 1 }]);
});

test('"Si menor con cejilla": la cejilla sale del acorde y cubre la nota de la 5ta', () => {
  const sim = acorde([p(5, 2, 1), p(4, 4, 3), p(3, 4, 4), p(2, 3, 2), p(1, 2, 1)]);
  const cejillas = cejillasDeSecuencia([nota(5, 2, 1), nota(4, 4, 3), nota(2, 3, 2), sim]);
  assert.deepStrictEqual(cejillas, [{ dedo: 1, traste: 2, desde: 5, hasta: 1 }]);
  assert.ok(enCejilla(cejillas, 5, 2));
  assert.ok(!enCejilla(cejillas, 4, 4));
});

test('una escala (un dedo por traste en varias cuerdas) no es una cejilla', () => {
  const escala = [nota(6, 3, 2), nota(5, 0), nota(5, 2, 1), nota(5, 3, 2), nota(4, 0), nota(4, 2, 1)];
  assert.deepStrictEqual(cejillasDeSecuencia(escala), []);
});
