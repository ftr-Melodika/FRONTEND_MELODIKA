import { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Dimensions } from 'react-native';
import { Background } from '../components/Background';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { DatePickerField } from '../components/form/DatePickerField';
import { DropdownField } from '../components/form/DropdownField';
import { perfilesService } from '../services/perfilesService';

const GENDER_OPTIONS = [
  { label: 'Masculino', value: 'Masculino' },
  { label: 'Femenino', value: 'Femenino' },
  { label: 'No binario', value: 'No binario' }
];

export function EditUserScreen({ route, navigation }) {
  // Recibimos el perfil desde la navegación
  const { perfilAEditar } = route.params;

  const [nombre, setNombre] = useState(perfilAEditar?.nombre || '');
  const [username] = useState(perfilAEditar?.username || ''); // Readonly
  const [pais, setPais] = useState(perfilAEditar?.pais || '');
  const [fotoUrl, setFotoUrl] = useState(perfilAEditar?.foto || '');
  const [gender, setGender] = useState(perfilAEditar?.genero || '');
  
  // Guardamos la fecha original si existe
  const [birthdayISO, setBirthdayISO] = useState(perfilAEditar?.fecha_nacimiento || '');
  
  const [loading, setLoading] = useState(false);

  const SCREEN_WIDTH = Dimensions.get('window').width;
  const cardWidth = Math.min(Math.round(SCREEN_WIDTH * 0.9), 720);

  const handleUpdate = async () => {
    if (!nombre || !birthdayISO) return Alert.alert('Error', 'El nombre y la fecha de nacimiento son obligatorios.');
    
    setLoading(true);
    try {
      // Mandamos solo los campos permitidos por el backend
      const datosActualizados = {
        nombre: nombre.trim(),
        fecha_nacimiento: birthdayISO,
        pais: pais.trim() || null,
        foto: fotoUrl.trim() || null,
        genero: gender || null
      };

      const perfilActualizado = await perfilesService.editarPerfil(perfilAEditar.id, datosActualizados);
      
      Alert.alert('¡Excelente!', 'Perfil actualizado correctamente.');
      
      // Volvemos a SelectUserScreen pasándole el perfil actualizado para optimizar el estado local
      navigation.navigate({
        name: 'SelectUser',
        params: { perfilActualizado: perfilActualizado },
        merge: true,
      });
    } catch (error) {
      Alert.alert('Error al actualizar', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Perfil',
      `¿Estás seguro de que querés eliminar a ${nombre}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await perfilesService.eliminarPerfil(perfilAEditar.id);
              Alert.alert('Perfil eliminado', 'El perfil se eliminó correctamente.');
              
              // Volvemos pasándole el ID eliminado para quitarlo del estado local
              navigation.navigate({
                name: 'SelectUser',
                params: { perfilEliminadoId: perfilAEditar.id },
                merge: true,
              });
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Background>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.glassCard, { width: cardWidth }]}>
          <Button 
            title="← Volver" 
            variant="back" 
            onPress={() => navigation.goBack()} 
            style={styles.backButtonInside}
            textStyle={styles.backButtonText}
          />
          <Text style={styles.title}>Editar perfil</Text>
          
          <InputField placeholder="Nombre completo" value={nombre} onChangeText={setNombre} />
          <InputField 
            placeholder="Nombre de usuario" 
            value={username} 
            editable={false} 
            style={[styles.input, { opacity: 0.6 }]} 
          />
          <DatePickerField onDateChange={setBirthdayISO} />
          <InputField placeholder="País (opcional)" value={pais} onChangeText={setPais} />
          <DropdownField label="Género" options={GENDER_OPTIONS} value={gender} onSelect={setGender} />
          <InputField placeholder="Foto (URL opcional)" value={fotoUrl} onChangeText={setFotoUrl} />

          <Button title="Guardar Cambios" onPress={handleUpdate} loading={loading} />
          
          {/* Botón rojo secundario para eliminar */}
          <Button 
            title="Eliminar perfil" 
            variant="secondary" 
            onPress={handleDelete} 
            disabled={loading}
            style={styles.deleteButton}
            textStyle={styles.deleteText}
          />
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
  title: { fontSize: 24, color: '#fff', textAlign: 'center', marginBottom: 15, fontFamily: 'serif', fontWeight: 'bold' },
  deleteButton: {
    backgroundColor: 'rgba(226, 85, 106, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 126, 141, 0.9)',
    borderRadius: 16,
    marginTop: 20,
    shadowColor: '#d64a5d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  deleteText: { color: '#fff1f3', fontWeight: '700' },
  input: {
    width: '100%',
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    color: '#fff',
    fontSize: 15,
  }
});