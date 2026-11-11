// Ejecutar con: npm test
import test from 'node:test';
import assert from 'node:assert';
import { NOTAS, POSICIONES, notaDe, posicionAlAzar, posicionesDeNota, preguntaAlAzar } from './practica.js';

test('las cuerdas al aire dan Mi, Si, Sol, Re, La, Mi', () => {
  assert.deepStrictEqual([1, 2, 3, 4, 5, 6].map((c) => notaDe(c, 0)), ['Mi', 'Si', 'Sol', 'Re', 'La', 'Mi']);
  assert.strictEqual(notaDe(1, 3), 'Sol');
  assert.strictEqual(notaDe(5, 3), 'Do');
});

test('hay 36 posiciones, del aire al traste 5', () => {
  assert.strictEqual(POSICIONES.length, 36);
  assert.ok(POSICIONES.every((p) => p.traste >= 0 && p.traste <= 5));
});

test('cada nota tiene al menos una posición en la primera posición', () => {
  for (const nota of NOTAS) {
    const lista = posicionesDeNota(nota);
    assert.ok(lista.length > 0, nota);
    assert.ok(lista.every((p) => notaDe(p.cuerda, p.traste) === nota));
  }
});

test('posicionAlAzar nunca repite la nota anterior', () => {
  let anterior = null;
  for (let i = 0; i < 500; i++) {
    const nueva = posicionAlAzar(anterior);
    if (anterior) assert.notStrictEqual(notaDe(nueva.cuerda, nueva.traste), notaDe(anterior.cuerda, anterior.traste));
    anterior = nueva;
  }
});

test('preguntaAlAzar trae la nota correcta entre cuatro opciones distintas', () => {
  for (let i = 0; i < 200; i++) {
    const p = preguntaAlAzar();
    assert.strictEqual(p.nota, notaDe(p.cuerda, p.traste));
    assert.strictEqual(p.opciones.length, 4);
    assert.strictEqual(new Set(p.opciones).size, 4);
    assert.ok(p.opciones.includes(p.nota));
  }
});
