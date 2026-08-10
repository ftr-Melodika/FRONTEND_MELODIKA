import React from 'react';
// Importamos el Provider que acabamos de crear
import { AuthProvider } from './src/context/AuthContext';
// Importamos tu sistema de navegación (las pantallas)
import { AppNavigator } from './src/navigation/AppNavigator';

import { StreakProvider } from './src/context/StreakContext';

import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    // Envolvemos al Navigator. Ahora TODAS las pantallas pueden saber si hay sesión
    <AuthProvider>
      {/* El StreakProvider va acá para que la animación de racha pueda aparecer desde cualquier pantalla. */}
      <StreakProvider>
        <AppNavigator />
      </StreakProvider>
    </AuthProvider>
  );
}