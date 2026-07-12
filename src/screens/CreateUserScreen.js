// Archivo: src/screens/CreateUserScreen.js
import { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Background } from '../components/Background';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { AuthContext } from '../context/AuthContext';
import { DatePickerField } from '../components/form/DatePickerField';
import { DropdownField } from '../components/form/DropdownField';

// 👇 Importamos nuestro servicio especialista
import { perfilesService } from '../services/perfilesService';

const GENDER_OPTIONS = [
  { label: 'Masculino', value: 'Masculino' },
  { label: 'Femenino', value: 'Femenino' },
  { label: 'No binario', value: 'No binario' }
];

export function CreateUserScreen({ navigation }) {
  const { userData: cuenta, actualizarPerfil } = useContext(AuthContext); 

  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [pais, setPais] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [gender, setGender] = useState('');
  const [birthdayISO, setBirthdayISO] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async () => {
    if (!nombre || !username || !birthdayISO) return Alert.alert('Error', 'Por favor completá los campos clave.');
    setLoading(true);

    try {
      // 👇 Usamos el servicio, la pantalla ya no sabe qué es un Endpoint
      const nuevoPerfil = await perfilesService.crearPerfil({
        cuenta_id: cuenta.id, 
        nombre: nombre.trim(), 
        username: username.trim(), 
        fecha_nacimiento: birthdayISO, 
        pais: pais.trim() || null, 
        foto: fotoUrl.trim() || null, 
        genero: gender || null
      });
      
      Alert.alert('¡Excelente!', `El perfil de ${nuevoPerfil.nombre} está listo.`);
      
      // Guardamos en contexto global y navegamos
      await actualizarPerfil(nuevoPerfil);
      navigation.replace('Home');

    } catch (error) {
      // El servicio ya filtró el error a un mensaje legible
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <ScrollView style={{flex: 1}} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.glassCard}>
          <Text style={styles.title}>Crear usuario</Text>
          <InputField placeholder="Nombre completo" value={nombre} onChangeText={setNombre} />
          <InputField placeholder="Nombre de usuario" value={username} onChangeText={setUsername} />
          <DatePickerField onDateChange={setBirthdayISO} />
          <InputField placeholder="País (opcional)" value={pais} onChangeText={setPais} />
          <DropdownField label="Género (opcional)" options={GENDER_OPTIONS} value={gender} onSelect={setGender} />
          <InputField placeholder="Foto (URL opcional)" value={fotoUrl} onChangeText={setFotoUrl} />
          <Button title="Crear usuario" onPress={handleCreateUser} loading={loading} />
        </View>
      </ScrollView>
    </Background>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  glassCard: { width: '85%', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 25, paddingVertical: 25, paddingHorizontal: 25, borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1 },
  title: { fontSize: 24, color: '#fff', textAlign: 'center', marginBottom: 15, fontFamily: 'serif', fontWeight: 'bold' },
});