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
import { LeccionScreen } from '../screens/LeccionScreen';
import { Background } from '../components/Background';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const [isChecking, setIsChecking] = useState(true); 
  const [savedData, setSavedData] = useState(null);

  useEffect(() => {
    async function checkToken() {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const cuentaGuardada = await AsyncStorage.getItem('userCuenta');
        if (token && cuentaGuardada) setSavedData({ token, cuenta: JSON.parse(cuentaGuardada) });
      } catch (error) { console.log(error); } finally { setIsChecking(false); }
    }
    checkToken();
  }, []);

  if (isChecking) {
    return <Background><View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#b28cff" /></View></Background>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={savedData ? "SelectUser" : "Login"} screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="SelectUser" component={SelectUserScreen} initialParams={savedData ? { cuenta: savedData.cuenta, token: savedData.token } : undefined} />
        <Stack.Screen name="CreateUser" component={CreateUserScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Leccion" component={LeccionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}