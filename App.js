import React from 'react';
// Importamos el Provider que acabamos de crear
import { AuthProvider } from './src/context/AuthContext';
// El StreakProvider va acá para que la animación de racha pueda aparecer desde cualquier pantalla.
import { StreakProvider } from './src/context/StreakContext';
// Importamos tu sistema de navegación (las pantallas)
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    // Envolvemos al Navigator. Ahora TODAS las pantallas pueden saber si hay sesión
    <AuthProvider>
      <StreakProvider>
        <AppNavigator />
      </StreakProvider>
    </AuthProvider>
  );
}