import React from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, opcionesPersistencia } from './src/api/queryClient';
// Importamos el Provider que acabamos de crear
import { AuthProvider } from './src/context/AuthContext';
// El StreakProvider va acá para que la animación de racha pueda aparecer desde cualquier pantalla.
import { StreakProvider } from './src/context/StreakContext';
// Importamos tu sistema de navegación (las pantallas)
import { AppNavigator } from './src/navigation/AppNavigator';

// La pantalla de inicio se queda hasta que la sesión esté leída (ver AppNavigator)
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  return (
    // La caché de datos va afuera: la usan todas las pantallas y se guarda entre aperturas de la app
    <PersistQueryClientProvider client={queryClient} persistOptions={opcionesPersistencia}>
      {/* Envolvemos al Navigator. Ahora TODAS las pantallas pueden saber si hay sesión */}
      <AuthProvider>
        <StreakProvider>
          <AppNavigator />
        </StreakProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
