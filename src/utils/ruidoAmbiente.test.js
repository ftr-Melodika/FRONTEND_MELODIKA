import { test } from 'node:test';
import assert from 'node:assert';
import { ruidoMedido, guardarRuido, olvidarRuido, puedeMedirEnPantalla } from './ruidoAmbiente.js';

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

test('ruidoAmbiente: se mide en los menús y no donde se toca o suena algo', () => {
  for (const name of ['Home', 'Ranking', 'GrupoChat', 'Canciones', 'UsoMicrofono']) {
    assert.ok(puedeMedirEnPantalla({ name }), name);
  }
  for (const name of ['Afinador', 'Practica', 'Cancion', 'Leccion', 'Login']) {
    assert.ok(!puedeMedirEnPantalla({ name }), name);
  }
  assert.ok(!puedeMedirEnPantalla(null));
});

test('ruidoAmbiente: no se mide mientras la bienvenida de Home escucha la primera cuerda', () => {
  assert.ok(!puedeMedirEnPantalla({ name: 'Home', params: { bienvenida: true } }));
  assert.ok(puedeMedirEnPantalla({ name: 'Home', params: { bienvenida: false } }));
});
