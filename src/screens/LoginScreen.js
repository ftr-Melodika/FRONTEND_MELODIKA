import { useState, useContext } from 'react'; 
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Background } from '../components/Background';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { AuthLink } from '../components/AuthLink';
import { AuthContext } from '../context/AuthContext'; 
import { authService } from '../services/authService';

export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext); 

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Error', 'Por favor completá correo y contraseña.');
    }

    setLoading(true);

    try {
      const data = await authService.login(email.trim(), password);
      await login(data.token, data.cuenta);
    } catch (error) {
      Alert.alert('Error', error.message);
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
          <ActivityIndicator size="large" color="#b28cff" style={{ marginVertical: 12 }} />
        ) : (
          <Button title="Iniciar sesión" onPress={handleLogin} />
        )}

        <AuthLink 
          textHelper="¿No creaste tu cuenta todavía?" 
          textAction="Crea tu cuenta" 
          onPress={() => navigation.navigate('Register')} 
        />

        <Button 
          title="Inicia sesión con Google" 
          variant="secondary" 
          onPress={() => Alert.alert('Próximamente 🚀', 'El inicio de sesión con Google todavía no está disponible.')}
        />
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  glassCard: { width: '65%', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 25, paddingVertical: 20, paddingHorizontal: 25, marginVertical: 15, borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1 },
  title: { fontSize: 24, color: '#fff', textAlign: 'center', marginBottom: 20, fontFamily: 'serif', fontWeight: 'bold' },
});