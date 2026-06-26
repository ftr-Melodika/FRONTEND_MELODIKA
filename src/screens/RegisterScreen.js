import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { Background } from '../components/Background';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';

export function RegisterScreen({ navigation }) {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [receiveAds, setReceiveAds] = useState(false);

  // Función temporal al apretar "Crear cuenta"
  const handleRegister = () => {
    console.log('Datos listos para el backend:', {
      email,
      password,
      confirmPassword,
      username,
      acceptTerms,
      receiveAds
    });
  };

  return (
    <Background>
      <View style={styles.glassCard}>
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
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
          <InputField 
            placeholder="Username" 
            value={username}
            onChangeText={setUsername}
          />

          {/* Checkbox 1 */}
          <Pressable 
            style={styles.checkboxContainer} 
            onPress={() => setAcceptTerms(!acceptTerms)}
          >
            <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
              {acceptTerms && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Acepto los términos y condiciones</Text>
          </Pressable>

          {/* Checkbox 2 */}
          <Pressable 
            style={styles.checkboxContainer} 
            onPress={() => setReceiveAds(!receiveAds)}
          >
            <View style={[styles.checkbox, receiveAds && styles.checkboxChecked]}>
              {receiveAds && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Quiero recibir información y anuncios de melodika</Text>
          </Pressable>

          <Button title="Crear cuenta" onPress={handleRegister} style={styles.btnSubmit} />

          {/* Link para volver a iniciar sesión */}
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    paddingVertical: 15,
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
    marginBottom: 14,
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
    backgroundColor: '#b28cff', // El lila de tu diseño cuando está marcado
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
    flex: 1, // Permite que el texto se acomode si es muy largo
  },
  btnSubmit: {
    marginTop: 10,
  },
  loginLinkContainer: {
    alignItems: 'center',
    marginTop: 5,
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