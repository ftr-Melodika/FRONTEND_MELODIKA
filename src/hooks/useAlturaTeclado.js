// Archivo: src/hooks/useAlturaTeclado.js
// Cuánto ocupa el teclado en pantalla (0 si está cerrado). Sirve para sumar ese espacio al final de
// un formulario y poder bajar hasta el último campo: con la app de borde a borde (Android) la pantalla
// no se achica sola al abrir el teclado, y en iOS nunca lo hace.
import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export function useAlturaTeclado() {
  const [altura, setAltura] = useState(0);

  useEffect(() => {
    // En iOS los eventos "will" llegan antes de la animación: el espacio aparece junto con el teclado
    const mostrar = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const ocultar = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s1 = Keyboard.addListener(mostrar, (e) => setAltura(e.endCoordinates?.height ?? 0));
    const s2 = Keyboard.addListener(ocultar, () => setAltura(0));
    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  return altura;
}
