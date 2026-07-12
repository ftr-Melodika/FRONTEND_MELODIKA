import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Background } from '../components/Background';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { Checkbox } from '../components/form/Checkbox'; // 👈 Checkbox importado
import { authService } from '../services/authService';

export function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nombre || !apellido || !email || !password || !confirmPassword) return Alert.alert('Error', 'Faltan campos.');
    if (password !== confirmPassword) return Alert.alert('Error', 'Las contraseñas no coinciden.');
    if (!acceptTerms) return Alert.alert('Error', 'Debes aceptar los términos y condiciones.');

    setLoading(true);
    try {
      await authService.registrar(nombre.trim(), apellido.trim(), telefono.trim() || null, email.trim(), password);
      Alert.alert('¡Éxito!', 'Cuenta creada correctamente. Ya podés iniciar sesión.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error en Registro', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <View style={styles.glassCard}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Button 
            title="⬅ Volver" 
            variant="link" 
            onPress={() => navigation.goBack()} 
            style={styles.backButtonInside}
            textStyle={{ fontSize: 16 }}
          />
          <Text style={styles.title}>Crear cuenta</Text>
          <InputField placeholder="Nombre" value={nombre} onChangeText={setNombre} />
          <InputField placeholder="Apellido" value={apellido} onChangeText={setApellido} />
          <InputField placeholder="Teléfono" value={telefono} onChangeText={setTelefono} />
          <InputField placeholder="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <InputField placeholder="Contraseña" secureTextEntry={true} value={password} onChangeText={setPassword} />
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
  glassCard: { width: '65%', maxHeight: '90%', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 25, borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1, paddingHorizontal: 25, paddingVertical: 2 },
  scrollContent: { paddingVertical: 20 },
  title: { fontSize: 32, color: '#fff', textAlign: 'center', marginBottom: 20, fontFamily: 'serif', fontWeight: 'bold' },
});