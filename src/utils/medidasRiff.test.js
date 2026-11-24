import { test } from 'node:test';
import assert from 'node:assert';
import { medidasDelMastil, ALTO_MASTIL_BASE } from './medidasRiff.js';

test('medidasDelMastil: con el alto de siempre las notas no se achican', () => {
  const m = medidasDelMastil(ALTO_MASTIL_BASE);
  assert.ok(m.tamanoNota >= 26);
  assert.strictEqual(m.altoCuerda, ALTO_MASTIL_BASE / 6);
});

test('medidasDelMastil: un mástil más alto agranda las notas y el espacio entre ellas', () => {
  const chico = medidasDelMastil(186);
  const grande = medidasDelMastil(260);
  assert.ok(grande.tamanoNota > chico.tamanoNota);
  assert.ok(grande.pxPorPulso > chico.pxPorPulso);
  assert.ok(grande.xLinea > chico.xLinea);
  assert.ok(grande.anchoAcorde > chico.anchoAcorde);
});

test('medidasDelMastil: las notas tienen un máximo y un mínimo', () => {
  assert.strictEqual(medidasDelMastil(1000).tamanoNota, 46);
  assert.strictEqual(medidasDelMastil(50).tamanoNota, 26);
});

test('medidasDelMastil: la 6ta cuerda queda arriba y la 1ra abajo, cada una en el centro de su fila', () => {
  const m = medidasDelMastil(180);
  assert.strictEqual(m.centroCuerda(6), 15);
  assert.strictEqual(m.centroCuerda(1), 165);
});
