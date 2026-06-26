import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';

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
      /* ⚠️ IMPORTANTE: 
         Si estás probando en tu celular físico con Expo Go, 'localhost' no va a funcionar. 
         Tenés que poner la IP local de tu compu (ej: http://192.168.0.15:3000/api/cuentas/login)
      */
      const response = await fetch('http://localhost:3000/api/cuentas/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password 
        }),
      });

      const data = await response.json();

      // error
      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // login exitoso
      console.log('¡Token recibido!: ', data.token);
      Alert.alert('¡Bienvenido!', `Iniciaste sesión como ${data.cuenta.email}`);

    } catch (error) {
      Alert.alert('Error de Inicio de Sesión', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#4c52d9', '#6b5ce7', '#8e71ff']}
      style={styles.container}
    >
      <View style={styles.glassCard}>
        <Text style={styles.title}>Inicio de sesión</Text>

        {/* Conectamos los inputs con nuestros estados */}
        <InputField 
          placeholder="Correo electrónico" 
          value={email}
          onChangeText={setEmail}
        />
        <InputField 
          placeholder="Contraseña" 
          secureTextEntry={true} 
          value={password}
          onChangeText={setPassword}
        />

        {/* Botón principal. Si está cargando, mostramos un spinner */}
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassCard: {
    width: '65%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    borderRadius: 25,
    paddingVertical: 5,
    paddingHorizontal: 25,
    marginVertical: 15,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'serif', 
    fontWeight: 'bold',
  },
  registerContainer: {
    alignItems: 'center',
    marginVertical: 5,
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