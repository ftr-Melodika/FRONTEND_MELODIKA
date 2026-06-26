import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importamos las dos pantallas que creamos
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { CreateUserScreen } from '../screens/CreateUserScreen';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login" // Abre primero la pantalla de crear usuario para revisión
        screenOptions={{ 
          headerShown: false, // Ocultamos la barra superior gris que viene por defecto
          animation: 'fade',  // Animación suave al cambiar de pantalla
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="CreateUser" component={CreateUserScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}