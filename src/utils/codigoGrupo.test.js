import { test } from 'node:test';
import assert from 'node:assert';
import { limpiarCodigoGrupo, esCodigoGrupoValido } from './codigoGrupo.js';

test('acepta 8 letras o números, con mayúsculas y minúsculas', () => {
  assert.ok(esCodigoGrupoValido('aB3dE9xZ'));
  assert.ok(esCodigoGrupoValido('12345678'));
  assert.ok(!esCodigoGrupoValido('aB3dE9x'));
  assert.ok(!esCodigoGrupoValido('aB3dE9xZ1'));
  assert.ok(!esCodigoGrupoValido('aB3d-9xZ'));
  assert.ok(!esCodigoGrupoValido('ñB3dE9xZ'));
});

test('limpia espacios y símbolos sin cambiar mayúsculas', () => {
  assert.strictEqual(limpiarCodigoGrupo(' aB3d E9xZ '), 'aB3dE9xZ');
  assert.strictEqual(limpiarCodigoGrupo('aB3d-E9xZ'), 'aB3dE9xZ');
  assert.strictEqual(limpiarCodigoGrupo('aB3dE9xZextra'), 'aB3dE9xZ');
  assert.strictEqual(limpiarCodigoGrupo(null), '');
});
