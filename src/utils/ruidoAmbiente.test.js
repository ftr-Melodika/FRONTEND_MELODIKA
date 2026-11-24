import { test } from 'node:test';
import assert from 'node:assert';
import { ruidoMedido, guardarRuido, olvidarRuido } from './ruidoAmbiente.js';

test('ruidoAmbiente: empieza sin nada medido', () => {
  olvidarRuido();
  assert.strictEqual(ruidoMedido(), null);
});

test('ruidoAmbiente: guarda lo último medido y se puede olvidar', () => {
  const ruido = { perfil: new Float64Array(4), sampleRate: 48000 };
  guardarRuido(ruido);
  assert.strictEqual(ruidoMedido(), ruido);
  guardarRuido(undefined);
  assert.strictEqual(ruidoMedido(), null);
  guardarRuido(ruido);
  olvidarRuido();
  assert.strictEqual(ruidoMedido(), null);
});
