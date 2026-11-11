// Ejecutar con: npm test
import test from 'node:test';
import assert from 'node:assert';
import { compararAfinacion, obtenerAfinacion, obtenerQuiz, siguienteCuerda } from './actividades.js';

const preguntaValida = {
  pregunta: '¿Cómo se llama la parte marcada?',
  marcador: { x: 0.07, y: 0.5, ancho: 0.12, alto: 0.33 },
  opciones: ['Clavijero', 'Puente', 'Boca', 'Traste'],
  correcta: 0,
  explicacion: 'En el clavijero están las clavijas.',
};

test('obtenerQuiz lee las preguntas y descarta las inválidas', () => {
  const quiz = obtenerQuiz({
    practica: {
      tipo: 'quiz',
      nombre: 'Partes de la guitarra',
      imagen: 'guitarra-acustica',
      preguntas: [
        preguntaValida,
        { ...preguntaValida, marcador: { x: 0.5, y: 0.5 }, explicacion: undefined },
        { ...preguntaValida, correcta: 4 }, // Fuera de rango
        { ...preguntaValida, opciones: ['Sola'] }, // Una sola opción
        { ...preguntaValida, opciones: ['A', ''] }, // Opción vacía
        { ...preguntaValida, pregunta: '' },
        { ...preguntaValida, marcador: { x: 2, y: 0.5 } }, // Marcador inválido: la pregunta sigue, sin marcador
        null,
      ],
    },
  });
  assert.strictEqual(quiz.nombre, 'Partes de la guitarra');
  assert.strictEqual(quiz.imagen, 'guitarra-acustica');
  assert.strictEqual(quiz.preguntas.length, 3);
  assert.deepStrictEqual(quiz.preguntas[0].marcador, { x: 0.07, y: 0.5, ancho: 0.12, alto: 0.33 });
  assert.deepStrictEqual(quiz.preguntas[1].marcador, { x: 0.5, y: 0.5 });
  assert.strictEqual(quiz.preguntas[1].explicacion, null);
  assert.strictEqual(quiz.preguntas[2].marcador, null);
});

test('obtenerQuiz devuelve null sin preguntas válidas o con otro tipo', () => {
  assert.strictEqual(obtenerQuiz({ practica: { tipo: 'quiz', preguntas: [] } }), null);
  assert.strictEqual(obtenerQuiz({ practica: { tipo: 'quiz', preguntas: [{ pregunta: 'x' }] } }), null);
  assert.strictEqual(obtenerQuiz({ practica: { tipo: 'secuencia', pasos: [] } }), null);
  assert.strictEqual(obtenerQuiz({}), null);
});

test('obtenerAfinacion completa notas y frecuencias de la afinación estándar', () => {
  const afinacion = obtenerAfinacion({
    practica: { tipo: 'afinacion', toleranciaCents: 8, cuerdas: [{ cuerda: 6, nota: 'Mi', frecuencia: 82.41 }, { cuerda: 5 }, { cuerda: '4' }] },
  });
  assert.strictEqual(afinacion.toleranciaCents, 8);
  assert.strictEqual(afinacion.msEstable, 1000);
  assert.deepStrictEqual(afinacion.cuerdas.map((c) => [c.cuerda, c.nota, Math.round(c.frecuencia * 10) / 10]), [[6, 'Mi', 82.4], [5, 'La', 110], [4, 'Re', 146.8]]);
});

test('obtenerAfinacion rechaza cuerdas inválidas o repetidas y usa valores por defecto', () => {
  assert.strictEqual(obtenerAfinacion({ practica: { tipo: 'afinacion', cuerdas: [{ cuerda: 7 }] } }), null);
  assert.strictEqual(obtenerAfinacion({ practica: { tipo: 'afinacion', cuerdas: [{ cuerda: 1 }, { cuerda: 1 }] } }), null);
  assert.strictEqual(obtenerAfinacion({ practica: { tipo: 'afinacion', cuerdas: [] } }), null);
  const conRaros = obtenerAfinacion({ practica: { tipo: 'afinacion', toleranciaCents: 500, msEstable: 5, cuerdas: [{ cuerda: 1, frecuencia: -3 }] } });
  assert.strictEqual(conRaros.toleranciaCents, 5);
  assert.strictEqual(conRaros.msEstable, 1000);
  assert.strictEqual(Math.round(conRaros.cuerdas[0].frecuencia), 330);
});

test('compararAfinacion ignora la octava e indica hacia dónde corregir', () => {
  assert.deepStrictEqual(compararAfinacion(110, 110), { cents: 0, estado: 'afinada' });
  assert.strictEqual(compararAfinacion(220, 110).estado, 'afinada'); // Armónico: otra octava
  assert.strictEqual(compararAfinacion(110 * 2 ** (-20 / 1200), 110).estado, 'baja');
  assert.strictEqual(compararAfinacion(110 * 2 ** (20 / 1200), 110).estado, 'alta');
  assert.strictEqual(compararAfinacion(110 * 2 ** (7 / 1200), 110, 8).estado, 'afinada');
});

test('siguienteCuerda sigue el orden, da la vuelta y termina', () => {
  const orden = [6, 5, 4, 3, 2, 1];
  assert.strictEqual(siguienteCuerda(orden, 6, [6]), 5);
  assert.strictEqual(siguienteCuerda(orden, 2, [6, 5, 4, 3, 2]), 1);
  assert.strictEqual(siguienteCuerda(orden, 3, [3, 2, 1]), 6); // Elegida a mano: vuelve a las que faltan
  assert.strictEqual(siguienteCuerda(orden, 1, orden), null);
});
