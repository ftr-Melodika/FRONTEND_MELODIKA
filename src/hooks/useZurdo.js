// Archivo: src/hooks/useZurdo.js
// ¿El perfil activo tiene el modo zurdo? Con el modo zurdo la app se ve como en un espejo, para
// que coincida con la guitarra de un zurdo: los mástiles y acordes tienen las cuerdas al aire a la
// derecha y los trastes crecen hacia la izquierda, en los riffs y canciones las notas avanzan
// hacia la derecha, y los videos y dibujos se ven espejados. El orden de las cuerdas (6ta arriba)
// no cambia: un zurdo también ve la 6ta arriba al mirar su guitarra.
import { useContext } from 'react';
import { StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export function useZurdo() {
  const { perfil } = useContext(AuthContext);
  return perfil?.esZurdo === true;
}

// Para espejar una vista entera; los textos de adentro se vuelven a dar vuelta con `espejo` otra vez
export const estilosZurdo = StyleSheet.create({
  espejo: { transform: [{ scaleX: -1 }] },
});
