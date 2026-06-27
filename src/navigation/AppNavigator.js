import { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native'; 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { CreateUserScreen } from '../screens/CreateUserScreen';
import { SelectUserScreen } from '../screens/SelectUserScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { Background } from '../components/Background'; 
import { LeccionScreen } from '../screens/LeccionScreen';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  // Estados para saber si estamos buscando en el storage, y qué encontramos
  const [isChecking, setIsChecking] = useState(true); 
  const [savedData, setSavedData] = useState(null);

  useEffect(() => {
    async function checkToken() {
      try {
        // Leemos el storage a ver si están guardados
        const token = await AsyncStorage.getItem('userToken');
        const cuentaGuardada = await AsyncStorage.getItem('userCuenta');

        if (token && cuentaGuardada) {
          // Si están, los guardamos en el estado para pasárselos a SelectUser
          setSavedData({ 
            token: token, 
            cuenta: JSON.parse(cuentaGuardada) 
          });
        }
      } catch (error) {
        console.log('Error leyendo el storage', error);
      } finally {
        // Terminamos de buscar, apagamos la ruedita de carga
        setIsChecking(false);
      }
    }

    checkToken();
  }, []);

  // Mientras busca en el storage mostramos esto:
  if (isChecking) {
    return (
      <Background>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#b28cff" />
        </View>
      </Background>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        // Si savedData tiene algo, arrancamos en SelectUser. Si no, en Login.
        initialRouteName={savedData ? "SelectUser" : "Login"} 
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen 
          name="SelectUser" 
          component={SelectUserScreen} 
          // Si arrancamos directo acá, le inyectamos los datos que sacamos del storage
          initialParams={savedData ? { cuenta: savedData.cuenta, token: savedData.token } : undefined} 
        />
        <Stack.Screen name="CreateUser" component={CreateUserScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Leccion" component={LeccionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}