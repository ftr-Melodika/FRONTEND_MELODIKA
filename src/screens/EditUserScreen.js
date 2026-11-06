import { TextoConIcono } from '../components/icono/Icono';
import { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Dimensions, Switch } from 'react-native';
import { Background } from '../components/Background';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { DatePickerField } from '../components/form/DatePickerField';
import { DropdownField } from '../components/form/DropdownField';
import { AvatarPicker } from '../components/form/AvatarPicker';
import { ScreenHeader } from '../components/ScreenHeader';
import { perfilesService } from '../services/perfilesService';
import { AuthContext } from '../context/AuthContext';

const GENDER_OPTIONS = [
  { label: 'Masculino', value: 'Masculino' },
  { label: 'Femenino', value: 'Femenino' },
  { label: 'No binario', value: 'No binario' }
];

export function EditUserScreen({ route, navigation }) {
  // Recibimos el perfil desde la navegación
  const { perfilAEditar } = route.params;
  const { perfil: perfilActivo, actualizarPerfil, quitarPerfil } = useContext(AuthContext);
  const esPerfilActivo = perfilActivo?.id === perfilAEditar?.id;
  // Si venimos desde el menú (Configuración) volvemos al Home; si no, a la selección de perfiles
  const vieneDeSelectUser = navigation.getState()?.routes?.some((r) => r.name === 'SelectUser');

  const [nombre, setNombre] = useState(perfilAEditar?.nombre || '');
  const [username] = useState(perfilAEditar?.username || ''); // Readonly
  const [pais, setPais] = useState(perfilAEditar?.pais || '');
  const [fotoUrl, setFotoUrl] = useState(perfilAEditar?.avatarUrl || '');
  const [gender, setGender] = useState(perfilAEditar?.genero || '');
  const [esPublico, setEsPublico] = useState(perfilAEditar?.esPublico ?? true);
  
  // Guardamos la fecha original si existe
  const [birthdayISO, setBirthdayISO] = useState(perfilAEditar?.fechaNacimiento || '');
  
  const [loading, setLoading] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(null);

  // perfilAEditar puede ser una copia vieja guardada en la sesión, así que pedimos el valor real.
  // Si el usuario ya tocó el interruptor, su elección manda sobre lo que llegue.
  const privacidadTocadaRef = useRef(false);
  const privacidadConfirmadaRef = useRef(false);
  const perfilId = perfilAEditar?.id;

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const perfilReal = await perfilesService.obtenerPerfil(perfilId);
        if (cancelado || typeof perfilReal?.esPublico !== 'boolean') return;
        privacidadConfirmadaRef.current = true;
        if (!privacidadTocadaRef.current) setEsPublico(perfilReal.esPublico);
      } catch (error) {
        console.log('Error leyendo la privacidad del perfil:', error.message);
      }
    })();
    return () => { cancelado = true; };
  }, [perfilId]);

  const handleCambioPrivacidad = (valor) => {
    privacidadTocadaRef.current = true;
    setErrorGuardado(null);
    setEsPublico(valor);
  };

  const SCREEN_WIDTH = Dimensions.get('window').width;
  const cardWidth = Math.round(SCREEN_WIDTH * 0.94);

  const handleUpdate = async () => {
    if (!nombre || !birthdayISO) return Alert.alert('Error', 'El nombre y la fecha de nacimiento son obligatorios.');
    
    setLoading(true);
    setErrorGuardado(null);
    try {
      // Mandamos solo los campos permitidos por el backend
      const datosActualizados = {
        nombre: nombre.trim(),
        fecha_nacimiento: birthdayISO,
        pais: pais.trim() || null,
        avatarUrl: fotoUrl.trim() || null,
        genero: gender || null,
      };
      // No mandamos un valor que no sabemos si es real: podría pisar la privacidad con una copia vieja
      const enviaPrivacidad = privacidadTocadaRef.current || privacidadConfirmadaRef.current;
      if (enviaPrivacidad) datosActualizados.esPublico = esPublico;

      const perfilActualizado = await perfilesService.editarPerfil(perfilAEditar.id, datosActualizados);

      // Nunca mostramos éxito si la privacidad guardada no es la que eligió el usuario
      if (enviaPrivacidad && perfilActualizado?.esPublico !== esPublico) {
        throw new Error('No pudimos guardar la privacidad de tu perfil. Probá de nuevo.');
      }

      Alert.alert('¡Excelente!', 'Perfil actualizado correctamente.');

      // Si es el perfil que está en uso, actualizamos también la sesión
      if (esPerfilActivo && perfilActualizado) await actualizarPerfil(perfilActualizado);

      if (!vieneDeSelectUser) {
        navigation.goBack();
        return;
      }

      // Volvemos a SelectUserScreen pasándole el perfil actualizado para optimizar el estado local
      navigation.navigate({
        name: 'SelectUser',
        params: { perfilActualizado: perfilActualizado },
        merge: true,
      });
    } catch (error) {
      // También queda escrito en la pantalla: el Alert no se ve en todas las plataformas
      setErrorGuardado(error.message);
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

              // Si borramos el perfil en uso, lo sacamos de la sesión y volvemos a elegir perfil
              if (esPerfilActivo) await quitarPerfil();
              if (!vieneDeSelectUser) {
                navigation.reset({ index: 0, routes: [{ name: 'SelectUser' }] });
                return;
              }

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
          {vieneDeSelectUser ? (
            <>
              <Button
                title="Volver" icono="volver"
                variant="back"
                onPress={() => navigation.goBack()}
                style={styles.backButtonInside}
                textStyle={styles.backButtonText}
              />
              <Text style={styles.title}>Editar perfil</Text>
            </>
          ) : (
            // Desde el menú (Configuración) el volver es el propio menú
            <ScreenHeader title="Configuración del perfil" />
          )}
          {/* El backend no permite borrar la foto (solo reemplazarla), por eso no mostramos "Quitar" */}
          <AvatarPicker value={fotoUrl} onChange={setFotoUrl} nombre={nombre} permitirQuitar={false} />
          
          <InputField placeholder="Nombre completo" value={nombre} onChangeText={setNombre} />
          <InputField 
            placeholder="Nombre de usuario" 
            value={username} 
            editable={false} 
            style={[styles.input, { opacity: 0.6 }]} 
          />
          <DatePickerField onDateChange={setBirthdayISO} initialValue={perfilAEditar?.fechaNacimiento} />
          <InputField placeholder="País (opcional)" value={pais} onChangeText={setPais} />
          <DropdownField label="Género" options={GENDER_OPTIONS} value={gender} onSelect={setGender} />

          <View style={styles.privacidad}>
            <View style={styles.privacidadTextos}>
              <TextoConIcono nombre={esPublico ? 'globo' : 'candado'} tamano={18} style={styles.privacidadTitulo}>{esPublico ? 'Perfil público' : 'Perfil privado'}</TextoConIcono>
              <Text style={styles.privacidadDetalle}>
                {esPublico
                  ? 'Cualquier usuario puede ver tus estadísticas.'
                  : 'Solo tus amigos pueden ver tus estadísticas.'}
              </Text>
            </View>
            <Switch
              value={esPublico}
              onValueChange={handleCambioPrivacidad}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#b28cff' }}
              thumbColor="#fff"
              accessibilityLabel="Perfil público"
            />
          </View>

          {!!errorGuardado && <Text style={styles.errorGuardado}>{errorGuardado}</Text>}

          <Button title="Guardar Cambios" onPress={handleUpdate} loading={loading} />
          
          {/* Botón rojo secundario para eliminar */}
          <Button 
            title="Eliminar perfil" 
            variant="danger"
            onPress={handleDelete}
            style={styles.deleteButton}
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
  deleteButton: { marginTop: 12 },
  privacidad: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 10 },
  privacidadTextos: { flex: 1 },
  privacidadTitulo: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  privacidadDetalle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  errorGuardado: { color: '#ffb3bd', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 4 },
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