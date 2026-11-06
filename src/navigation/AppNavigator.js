import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import { LoadingModal } from '../components/LoadingModal'; // 👈 El nuevo modal
import { ProgresoScreen } from '../screens/ProgresoScreen';
import { RankingScreen } from '../screens/RankingScreen';
import { LogrosScreen } from '../screens/LogrosScreen';
import { PreguntasFrecuentesScreen } from '../screens/PreguntasFrecuentesScreen';
import { PracticaScreen } from '../screens/PracticaScreen';
import { PerfilPublicoScreen } from '../screens/PerfilPublicoScreen';
import { SolicitudesScreen } from '../screens/SolicitudesScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { GruposScreen } from '../screens/GruposScreen';
import { GrupoChatScreen } from '../screens/GrupoChatScreen';
import { ReportarErrorScreen } from '../screens/ReportarErrorScreen';
import { ContactoScreen } from '../screens/ContactoScreen';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { CreateUserScreen } from '../screens/CreateUserScreen';
import { SelectUserScreen } from '../screens/SelectUserScreen';
import { EditUserScreen } from '../screens/EditUserScreen';
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
            <Stack.Screen name="EditUser" component={EditUserScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Leccion" component={LeccionScreen} />
            <Stack.Screen name="Progreso" component={ProgresoScreen} />
            <Stack.Screen name="Ranking" component={RankingScreen} />
            <Stack.Screen name="Logros" component={LogrosScreen} />
            <Stack.Screen name="PreguntasFrecuentes" component={PreguntasFrecuentesScreen} />
            <Stack.Screen name="Practica" component={PracticaScreen} />
            <Stack.Screen name="PerfilPublico" component={PerfilPublicoScreen} />
            <Stack.Screen name="Solicitudes" component={SolicitudesScreen} />
            <Stack.Screen name="Feedback" component={FeedbackScreen} />
            <Stack.Screen name="Grupos" component={GruposScreen} />
            <Stack.Screen name="GrupoChat" component={GrupoChatScreen} />
            <Stack.Screen name="ReportarError" component={ReportarErrorScreen} />
            <Stack.Screen name="Contacto" component={ContactoScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}