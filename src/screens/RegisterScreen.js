import { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Background } from '../components/Background';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { Checkbox } from '../components/form/Checkbox'; // 👈 Checkbox importado
import { authService } from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import { REQUISITOS_PASSWORD, passwordValida } from '../utils/password';
import { useAlturaTeclado } from '../hooks/useAlturaTeclado';
import { FUENTE_TITULO } from '../theme/fuentes';

export function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const alturaTeclado = useAlturaTeclado();

  const handleRegister = async () => {
    if (!nombre || !apellido || !telefono || !email || !password || !confirmPassword) return Alert.alert('Error', 'Faltan campos.');
    if (!/^\+?\d{10,15}$/.test(telefono.trim())) return Alert.alert('Error', 'El teléfono debe tener entre 10 y 15 números (sin espacios ni guiones).');
    // Comparamos versiones recortadas para evitar espacios accidentales
    if (String(password).trim() !== String(confirmPassword).trim()) return Alert.alert('Error', 'Las contraseñas no coinciden.');
    if (!passwordValida(password)) return Alert.alert('Contraseña no válida', REQUISITOS_PASSWORD);
    if (!acceptTerms) return Alert.alert('Error', 'Debes aceptar los términos y condiciones.');

    setLoading(true);
    try {
      await authService.registrar(nombre.trim(), apellido.trim(), telefono.trim(), email.trim(), password);
    } catch (error) {
      setLoading(false);
      return Alert.alert('Error en Registro', error.message);
    }
    // Cuenta creada: se entra directo, sin pasar por el inicio de sesión
    try {
      const data = await authService.login(email.trim(), password);
      await login(data.token, data.cuenta, data.refreshToken, data.expiresAt);
    } catch (error) {
      Alert.alert('Cuenta creada', 'Tu cuenta se creó, pero no pudimos iniciar sesión automáticamente. Iniciá sesión con tus datos.');
      navigation.navigate('Login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <View style={styles.glassCard}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: 16 + alturaTeclado }]} keyboardShouldPersistTaps="handled">
          <Button 
            title="Volver" icono="volver" 
            variant="back" 
            onPress={() => navigation.goBack()} 
            style={[styles.backButtonInside]}
            textStyle={{ fontSize: 16 }}
          />
          <Text style={styles.title}>Crear cuenta</Text>
          <InputField placeholder="Nombre" value={nombre} onChangeText={setNombre} />
          <InputField placeholder="Apellido" value={apellido} onChangeText={setApellido} />
          <InputField placeholder="Teléfono (ej: 1123456789)" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
          <InputField placeholder="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <InputField placeholder="Contraseña" secureTextEntry={true} value={password} onChangeText={setPassword} />
          <Text style={styles.requisitos}>{REQUISITOS_PASSWORD}</Text>
          <InputField placeholder="Confirmar contraseña" secureTextEntry={true} value={confirmPassword} onChangeText={setConfirmPassword} />

          {/* 👇 Checkbox limpio */}
          <Checkbox label="Acepto los términos y condiciones" checked={acceptTerms} onChange={setAcceptTerms} />

          {/* 👇 Botón de carga */}
          <Button title="Crear cuenta" onPress={handleRegister} loading={loading} style={{ marginTop: 10 }} />

          <View style={{alignItems: 'center', marginTop: 10}}>
            <Text style={{color: 'rgba(255,255,255,0.7)'}}>¿Ya tenés una cuenta?</Text>
            <Button title="Inicia sesión" variant="link" onPress={() => navigation.navigate('Login')} />
          </View>
        </ScrollView>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  backButtonInside: { alignSelf: 'flex-start' },
  glassCard: { alignSelf: 'center', width: '70%', maxWidth: 560, maxHeight: '90%', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 25, borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1, paddingHorizontal: 25, paddingVertical: 2 },
  scrollContent: { paddingVertical: 16 },
  requisitos: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: -4, marginBottom: 10 },
  title: { fontSize: 26, color: '#fff', textAlign: 'center', marginBottom: 15, fontFamily: FUENTE_TITULO, fontWeight: 'bold' },
});