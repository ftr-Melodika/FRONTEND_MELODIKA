import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Background } from '../components/Background';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { ENDPOINTS } from '../config/api';

export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Error', 'Por favor completá correo y contraseña.');
    }

    setLoading(true);

    try {
      const response = await fetch(ENDPOINTS.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // GUARDA EL TOKEN Y LA CUENTA EN EL CELULAR
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userCuenta', JSON.stringify(data.cuenta)); 

      navigation.replace('SelectUser', { cuenta: data.cuenta, token: data.token });

    } catch (error) {
      Alert.alert('Error de Inicio de Sesión', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <View style={styles.glassCard}>
        <Text style={styles.title}>Inicio de sesión</Text>
        <InputField placeholder="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <InputField placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />

        {loading ? (
          <ActivityIndicator size="large" color="#b28cff" style={{ marginBottom: 12 }} />
        ) : (
          <Button title="Iniciar sesión" onPress={handleLogin} />
        )}

        <View style={styles.registerContainer}>
          <Text style={styles.textHelper}>¿No creaste tu cuenta todavía?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.textLink}>Crea tu cuenta</Text>
          </TouchableOpacity>
        </View>

        <Button title="Inicia sesión con Google" variant="secondary" />
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    width: '65%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 25,
    marginVertical: 15,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  registerContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  textHelper: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  textLink: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginTop: 5,
  },
});