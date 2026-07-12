import { useState, useContext } from 'react'; 
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Background } from '../components/Background';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { AuthContext } from '../context/AuthContext'; 
import { authService } from '../services/authService';

export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext); 

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Completá todo.');
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

        
        <Button title="Iniciar sesión" onPress={handleLogin} loading={loading} />

        <View style={styles.containerLinks}>
          <Text style={{color: 'rgba(255,255,255,0.7)'}}>¿No creaste tu cuenta todavía?</Text>
          <Button title="Crea tu cuenta" variant="link" onPress={() => navigation.navigate('Register')} />
        </View>

        <Button title="Inicia sesión con Google" variant="secondary" onPress={() => Alert.alert('Próximamente')} />
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  glassCard: { width: '65%', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 25, paddingVertical: 5, paddingHorizontal: 25, marginVertical: 15, borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1 },
  title: { fontSize: 24, color: '#fff', textAlign: 'center', marginBottom: 20, fontFamily: 'serif', fontWeight: 'bold' },
  containerLinks: { alignItems: 'center', marginVertical: 10 }
});