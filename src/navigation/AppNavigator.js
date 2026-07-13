import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import { LoadingModal } from '../components/LoadingModal'; // 👈 El nuevo modal
import { ProgresoScreen } from '../screens/ProgresoScreen';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { CreateUserScreen } from '../screens/CreateUserScreen';
import { SelectUserScreen } from '../screens/SelectUserScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LeccionScreen } from '../screens/LeccionScreen';
import { Background } from '../components/Background';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const { isLoading, userToken } = useContext(AuthContext);

  if (isLoading) {
    return (
      <Background>
        {/* 👇 El modal avisa qué está haciendo la app al arrancar */}
        <LoadingModal visible={true} text="Afinando las cuerdas..." />
      </Background>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {userToken === null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="SelectUser" component={SelectUserScreen} />
            <Stack.Screen name="CreateUser" component={CreateUserScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Leccion" component={LeccionScreen} />
            <Stack.Screen name="Progreso" component={ProgresoScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}