import { test } from 'node:test';
import assert from 'node:assert';
import { extraerTokenInvitacion, mensajeInvitacion } from './invitaciones.js';

const TOKEN = 'Ab3_dEf-Gh1JkLmNoPqRsT';

test('extrae el token del esquema propio', () => {
  assert.strictEqual(extraerTokenInvitacion(`melodika://invitar/${TOKEN}`), TOKEN);
});

test('extrae el token en Expo Go y con parámetros', () => {
  assert.strictEqual(extraerTokenInvitacion(`exp://192.168.0.5:8081/--/invitar/${TOKEN}`), TOKEN);
  assert.strictEqual(extraerTokenInvitacion(`melodika://invitar/${TOKEN}?x=1`), TOKEN);
  assert.strictEqual(extraerTokenInvitacion(`melodika://invitar/${TOKEN}/`), TOKEN);
});

test('ignora URLs que no son invitaciones o tokens inválidos', () => {
  assert.strictEqual(extraerTokenInvitacion('melodika://home'), null);
  assert.strictEqual(extraerTokenInvitacion('melodika://invitar/corto'), null);
  assert.strictEqual(extraerTokenInvitacion('melodika://invitar/'), null);
  assert.strictEqual(extraerTokenInvitacion(null), null);
  assert.strictEqual(extraerTokenInvitacion(undefined), null);
});

test('mensajeInvitacion incluye el nombre y el link', () => {
  const texto = mensajeInvitacion('Ana', `melodika://invitar/${TOKEN}`);
  assert.ok(texto.includes('Ana') && texto.includes(`melodika://invitar/${TOKEN}`));
});
