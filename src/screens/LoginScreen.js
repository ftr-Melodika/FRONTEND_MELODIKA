import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
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
      Alert.alert('Error', 'Por favor completá correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password 
        }),
      });

      const textResponse = await response.text();
      let data = null;

      if (textResponse) {
        try {
          data = JSON.parse(textResponse);
        } catch (e) {
          throw new Error(`El servidor respondió con un formato inesperado (${response.status}). Revisá que el backend esté corriendo y que la URL sea correcta.`);
        }
      }

      if (!response.ok) {
        throw new Error(data?.message || `Error al iniciar sesión (${response.status})`);
      }

      const token = data?.token || data?.accessToken || data?.session?.access_token || data?.session?.accessToken || data?.cuenta?.token;
      const cuentaConToken = data?.cuenta ? { ...data.cuenta, token } : null;

      console.log('¡Token real recibido!: ', token);
      
      // Redirección dinámica: Mandamos a la pantalla de selección con token seguro
      navigation.replace('SelectUser', { cuenta: cuentaConToken || data.cuenta, token });

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

        <InputField 
          placeholder="Correo electrónico" 
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <InputField 
          placeholder="Contraseña" 
          secureTextEntry={true} 
          value={password}
          onChangeText={setPassword}
        />

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