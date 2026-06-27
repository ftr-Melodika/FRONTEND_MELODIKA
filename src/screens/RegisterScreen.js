import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Background } from '../components/Background';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { ENDPOINTS } from '../config/api';

export function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validaciones
    if (!email || !password || !confirmPassword) {
      return Alert.alert('Error', 'Por favor, completá todos los campos.');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Las contraseñas no coinciden.');
    }
    if (!acceptTerms) {
      return Alert.alert('Error', 'Debes aceptar los términos y condiciones.');
    }

    setLoading(true);

    try {
      const response = await fetch(ENDPOINTS.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error(data?.message || `Error al registrar la cuenta (${response.status})`);
      }

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
          <Text style={styles.title}>Crear cuenta</Text>

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
          <InputField 
            placeholder="Confirmar contraseña" 
            secureTextEntry={true} 
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Pressable style={styles.checkboxContainer} onPress={() => setAcceptTerms(!acceptTerms)}>
            <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
              {acceptTerms && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Acepto los términos y condiciones</Text>
          </Pressable>

          {loading ? (
            <ActivityIndicator size="large" color="#b28cff" style={{ marginVertical: 10 }} />
          ) : (
            <Button title="Crear cuenta" onPress={handleRegister} style={styles.btnSubmit} />
          )}

          <View style={styles.loginLinkContainer}>
            <Text style={styles.textHelper}>¿Ya tenés una cuenta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.textLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    width: '65%',
    maxHeight: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    borderRadius: 25,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 25,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  checkboxChecked: {
    backgroundColor: '#b28cff',
    borderColor: '#b28cff',
  },
  checkboxTick: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    flex: 1,
  },
  btnSubmit: {
    marginTop: 10,
  },
  loginLinkContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  textHelper: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  textLink: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginTop: 3,
  },
});