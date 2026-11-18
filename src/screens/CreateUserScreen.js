// Archivo: src/screens/CreateUserScreen.js
import { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Dimensions } from 'react-native';
import { Background } from '../components/Background';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { AuthContext } from '../context/AuthContext';
import { DatePickerField } from '../components/form/DatePickerField';
import { DropdownField } from '../components/form/DropdownField';
import { PaisField } from '../components/form/PaisField';
import { ModoZurdoField } from '../components/form/ModoZurdoField';
import { OPCIONES_GENERO } from '../data/generos';
import { useAlturaTeclado } from '../hooks/useAlturaTeclado';
import { AvatarPicker } from '../components/form/AvatarPicker';

// 👇 Importamos nuestro servicio especialista
import { perfilesService } from '../services/perfilesService';
import { FUENTE_TITULO } from '../theme/fuentes';


export function CreateUserScreen({ navigation }) {
  const { actualizarPerfil } = useContext(AuthContext);
  // Lo que ocupa el teclado se suma al final del formulario, para poder bajar hasta el último campo
  const alturaTeclado = useAlturaTeclado();

  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [pais, setPais] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [gender, setGender] = useState('');
  const [esZurdo, setEsZurdo] = useState(false);
  const [birthdayISO, setBirthdayISO] = useState('');
  const [loading, setLoading] = useState(false);

  // Calcular ancho responsivo para la tarjeta para que nunca supere el ancho de pantalla
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const cardWidth = Math.round(SCREEN_WIDTH * 0.94);

  const handleCreateUser = async () => {
    if (!nombre || !username || !birthdayISO) return Alert.alert('Error', 'Por favor completá los campos clave.');
    setLoading(true);

    try {
      // 👇 Usamos el servicio, la pantalla ya no sabe qué es un Endpoint
      const nuevoPerfil = await perfilesService.crearPerfil({
        nombre: nombre.trim(), 
        username: username.trim(), 
        fecha_nacimiento: birthdayISO, 
        pais: pais.trim() || null, 
        avatarUrl: fotoUrl.trim() || null, 
        genero: gender || null,
        esZurdo,
      });
      
      // Guardamos en contexto global y navegamos. En Cursos lo recibe "Tocá cualquier cuerda para
      // comenzar" (ver PrimeraCuerdaModal), que hace de bienvenida: no hace falta otra alerta.
      await actualizarPerfil(nuevoPerfil);
      navigation.replace('Home', { bienvenida: true });

    } catch (error) {
      // El servicio ya filtró el error a un mensaje legible
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + alturaTeclado }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        <View style={[styles.glassCard, { width: cardWidth }]}>
          <Button 
            title="Volver" icono="volver" 
            variant="back" 
            onPress={() => navigation.goBack()} 
            style={styles.backButtonInside}
            textStyle={styles.backButtonText}
          />
          <Text style={styles.title}>Crear perfil</Text>
          <AvatarPicker value={fotoUrl} onChange={setFotoUrl} nombre={nombre} />
          <InputField placeholder="Nombre completo" value={nombre} onChangeText={setNombre} />
          <InputField placeholder="Nombre de usuario" value={username} onChangeText={setUsername} />
          <DatePickerField onDateChange={setBirthdayISO} />
          <PaisField value={pais} onSelect={setPais} />
          <DropdownField label="Género" options={OPCIONES_GENERO} value={gender} onSelect={setGender} />
          <ModoZurdoField value={esZurdo} onChange={setEsZurdo} />
          <Button title="Crear perfil" onPress={handleCreateUser} loading={loading} />
        </View>
      </ScrollView>
    </Background>
  );
}

const styles = StyleSheet.create({
  backButtonInside: { alignSelf: 'flex-start', marginBottom: 15 },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', paddingVertical: 20 },
  glassCard: { alignSelf: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 25, paddingVertical: 18, paddingHorizontal: 28, marginVertical: 18, borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1 },
  title: { fontSize: 24, color: '#fff', textAlign: 'center', marginBottom: 15, fontFamily: FUENTE_TITULO, fontWeight: 'bold' },
});