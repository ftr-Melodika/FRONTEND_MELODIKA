import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native'; 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 1. Importamos nuestra "nube" (Contexto)
import { AuthContext } from '../context/AuthContext';

// Importamos todas las pantallas
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { CreateUserScreen } from '../screens/CreateUserScreen';
import { SelectUserScreen } from '../screens/SelectUserScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LeccionScreen } from '../screens/LeccionScreen';
import { Background } from '../components/Background';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  // 2. Miramos hacia la nube para saber el estado actual
  const { isLoading, userToken } = useContext(AuthContext);

  // 3. Pantalla de Carga: Mientras la nube busca en la memoria del celular, mostramos la ruedita.
  if (isLoading) {
    return (
      <Background>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#b28cff" />
        </View>
      </Background>
    );
  }

  // 4. El de Seguridad (Renderizado Condicional)
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        
        {userToken === null ? (
          // ZONA PÚBLICA: Si NO hay token, SOLO existen estas pantallas en la app.
          // Es físicamente imposible que un usuario no logueado navegue al "Home".
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // ZONA PRIVADA: Si SÍ hay token, el mazo cambia por completo.
          // Es imposible que un usuario logueado vuelva por error al "Login" apretando 'Atrás'.
          <>
            <Stack.Screen name="SelectUser" component={SelectUserScreen} />
            <Stack.Screen name="CreateUser" component={CreateUserScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Leccion" component={LeccionScreen} />
          </>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}