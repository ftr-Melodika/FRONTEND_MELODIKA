// Lo mismo que exige el backend al crear una cuenta o cambiar la contraseña
export const REQUISITOS_PASSWORD = 'La contraseña debe tener al menos 6 caracteres, una mayúscula y un caracter especial (por ejemplo ! ? @ # $ . -).';

export function passwordValida(password) {
  return password.length >= 6 && /[A-ZÁÉÍÓÚÑ]/.test(password) && /[^\p{L}\p{N}]/u.test(password);
}
