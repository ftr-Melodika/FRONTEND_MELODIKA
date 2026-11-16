import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Fraunces_600SemiBold, Fraunces_600SemiBold_Italic, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Figtree_400Regular, Figtree_500Medium, Figtree_700Bold } from '@expo-google-fonts/figtree';
// Importamos el Provider que acabamos de crear
import { AuthProvider } from './src/context/AuthContext';
// El StreakProvider va acá para que la animación de racha pueda aparecer desde cualquier pantalla.
import { StreakProvider } from './src/context/StreakContext';
// Importamos tu sistema de navegación (las pantallas)
import { AppNavigator } from './src/navigation/AppNavigator';

// La splash se queda hasta que las tipografías estén listas, así el texto no "salta" de fuente
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fuentesListas, errorFuentes] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_600SemiBold_Italic,
    Fraunces_700Bold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_700Bold,
  });
  const listo = fuentesListas || !!errorFuentes; // si falla la carga, la app sigue con la fuente del sistema

  useEffect(() => {
    if (listo) SplashScreen.hideAsync().catch(() => {});
  }, [listo]);

  if (!listo) return null;

  return (
    // Envolvemos al Navigator. Ahora TODAS las pantallas pueden saber si hay sesión
    <AuthProvider>
      <StreakProvider>
        <AppNavigator />
      </StreakProvider>
    </AuthProvider>
  );
}
