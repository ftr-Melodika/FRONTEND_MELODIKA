import { useState, useContext } from 'react'; // 👈 1. Importamos useContext
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
// ❌ Borramos el import de AsyncStorage, ya no lo necesitamos acá
import { Background } from '../components/Background';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { ENDPOINTS } from '../config/api';
import axiosClient from '../api/axiosClient';

// 👈 2. Importamos nuestra nube
import { AuthContext } from '../context/AuthContext'; 

export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 👈 3. Traemos la función de login desde el altoparlante
  const { login } = useContext(AuthContext); 

const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Error', 'Por favor completá correo y contraseña.');
    }

    setLoading(true);

    try {
      // 2. Usamos axiosClient.post
      // Al ser una ruta relativa ('/cuentas/login' definida en ENDPOINTS), 
      // Axios le pega la baseURL automáticamente.
      const response = await axiosClient.post(ENDPOINTS.login, {
        email: email.trim(),
        password: password,
      });

      // 3. Axios ya parseó el JSON, no hace falta response.json()
      const { token, cuenta } = response.data;

      // 4. Llamamos a la nube
      await login(token, cuenta);

    } catch (error) {
      // 5. Axios pone la respuesta del backend en error.response.data
      const mensaje = error.response?.data?.message || 'Error al iniciar sesión';
      Alert.alert('Error', mensaje);
      console.log(error.response?.data); // Mirá esto en la terminal para ver el error real
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
  // ... (Tus estilos se mantienen exactamente iguales)
  glassCard: { width: '65%', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 25, paddingVertical: 15, paddingHorizontal: 25, marginVertical: 15, borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1 },
  title: { fontSize: 24, color: '#fff', textAlign: 'center', marginBottom: 15, fontFamily: 'serif', fontWeight: 'bold' },
  registerContainer: { alignItems: 'center', marginVertical: 6 },
  textHelper: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14 },
  textLink: { color: '#fff', fontSize: 14, fontWeight: 'bold', textDecorationLine: 'underline', marginTop: 5 },
});