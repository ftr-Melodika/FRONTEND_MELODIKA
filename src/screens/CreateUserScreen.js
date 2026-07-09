// Archivo: src/screens/CreateUserScreen.js
import { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Background } from '../components/Background';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { ENDPOINTS } from '../config/api';
import axiosClient from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';

// Importamos nuestros especialistas modulares
import { DatePickerField } from '../components/form/DatePickerField';
import { DropdownField } from '../components/form/DropdownField';

const GENDER_OPTIONS = [
  { label: 'Masculino', value: 'Masculino' },
  { label: 'Femenino', value: 'Femenino' },
  { label: 'No binario', value: 'No binario' },
];

export function CreateUserScreen({ navigation }) {
  const { userData: cuenta } = useContext(AuthContext); 
  
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [pais, setPais] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [gender, setGender] = useState('');
  const [birthdayISO, setBirthdayISO] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async () => {
    if (!nombre.trim() || !username.trim() || !birthdayISO) {
      return Alert.alert('Error', 'Por favor completá el nombre, usuario y fecha de nacimiento.');
    }
    if (!cuenta?.id) {
      return Alert.alert('Error de sesión', 'No se encontró la cuenta activa. Volvé a iniciar sesión.');
    }

    setLoading(true);

    try {
      const requestBody = {
        cuenta_id: cuenta.id,
        nombre: nombre.trim(),
        username: username.trim(),
        fecha_nacimiento: birthdayISO,
        pais: pais.trim() || null,
        foto: fotoUrl.trim() || null,
        genero: gender || null,
      };

      const response = await axiosClient.post(ENDPOINTS.crearPerfil, requestBody);
      const nuevoPerfil = response.data.data;

      Alert.alert('¡Excelente!', `El perfil de ${nuevoPerfil.nombre} está listo.`);
      navigation.replace('Home', { perfil: nuevoPerfil });

    } catch (error) {
      const mensajeError = error.response?.data?.message || 'Ocurrió un error al crear el perfil.';
      Alert.alert('Error', mensajeError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background style={styles.background}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.glassCard}>
          <Text style={styles.title}>Crear usuario</Text>
          
          <InputField placeholder="Nombre completo" value={nombre} onChangeText={setNombre} />
          <InputField placeholder="Nombre de usuario" value={username} onChangeText={setUsername} />
          
          {/* Componente especializado en Fechas */}
          <DatePickerField onDateChange={setBirthdayISO} />

          <InputField placeholder="País (opcional)" value={pais} onChangeText={setPais} />
          
          {/* Componente especializado en Desplegables + Animación */}
          <DropdownField 
            label="Género (opcional)" 
            options={GENDER_OPTIONS} 
            value={gender} 
            onSelect={setGender} 
          />

          <InputField placeholder="Foto (URL opcional)" value={fotoUrl} onChangeText={setFotoUrl} />

          {loading ? (
            <ActivityIndicator size="large" color="#b28cff" style={{ marginVertical: 10 }} />
          ) : (
            <Button title="Crear usuario" onPress={handleCreateUser} />
          )}
        </View>
      </ScrollView>
    </Background>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  glassCard: { width: '85%', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 25, paddingVertical: 25, paddingHorizontal: 25, borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1 },
  title: { fontSize: 24, color: '#fff', textAlign: 'center', marginTop: -8, marginBottom: 15, fontFamily: 'serif', fontWeight: 'bold' },
});