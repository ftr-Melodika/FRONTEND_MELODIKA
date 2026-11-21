// Archivo: src/screens/AjustesCuentaScreen.js
// Ajustes de la cuenta (no del perfil): el correo con el que se entró y la zona para eliminarla.
import { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { Icono } from '../components/icono/Icono';
import { Background } from '../components/Background';
import { ScreenHeader } from '../components/ScreenHeader';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/authService';
import { FormScroll } from '../components/FormScroll';
import { REQUISITOS_PASSWORD, passwordValida } from '../utils/password';
import { FUENTE_TITULO } from '../theme/fuentes';

export function AjustesCuentaScreen() {
  const { userData: cuenta, logout } = useContext(AuthContext);
  const cardWidth = Math.round(Dimensions.get('window').width * 0.94);

  const [confirmando, setConfirmando] = useState(false);
  const [password, setPassword] = useState('');
  const [eliminando, setEliminando] = useState(false);
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passRepetida, setPassRepetida] = useState('');
  const [cambiando, setCambiando] = useState(false);
  const [abiertoPassword, setAbiertoPassword] = useState(false);

  // Las cuentas de Google no tienen contraseña: el backend no la pide
  const sinPassword = cuenta?.tienePassword === false;

  const cambiarPassword = async () => {
    if (!passActual || !passNueva || !passRepetida) return Alert.alert('Faltan datos', 'Completá los tres campos.');
    if (!passwordValida(passNueva)) return Alert.alert('Contraseña no válida', REQUISITOS_PASSWORD);
    if (passNueva !== passRepetida) return Alert.alert('Error', 'Las contraseñas nuevas no coinciden.');
    if (passNueva === passActual) return Alert.alert('Error', 'La contraseña nueva debe ser distinta de la actual.');
    setCambiando(true);
    try {
      await authService.cambiarPassword(passActual, passNueva);
      setPassActual('');
      setPassNueva('');
      setPassRepetida('');
      setAbiertoPassword(false);
      Alert.alert('¡Listo!', 'Tu contraseña se actualizó correctamente.');
    } catch (error) {
      Alert.alert('No se pudo cambiar la contraseña', error.message);
    } finally {
      setCambiando(false);
    }
  };

  const eliminar = async () => {
    if (!sinPassword && !password) return Alert.alert('Falta la contraseña', 'Ingresá tu contraseña para confirmar.');
    setEliminando(true);
    try {
      await authService.eliminarCuenta(sinPassword ? undefined : password);
    } catch (error) {
      setEliminando(false);
      return Alert.alert('No se pudo eliminar la cuenta', error.message);
    }
    // Cuenta borrada: se limpia la sesión y el navegador vuelve solo al inicio de sesión
    await logout();
  };

  const pedirConfirmacion = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Se van a borrar tu cuenta, todos tus perfiles y todo tu progreso. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: eliminar },
      ]
    );
  };

  return (
    <Background>
      <FormScroll
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.glassCard, { width: cardWidth }]}>
          <ScreenHeader title="Ajustes de cuenta" />

          <Text style={styles.seccion}>Tu cuenta</Text>
          <View style={styles.dato}>
            <Text style={styles.etiqueta}>Correo electrónico</Text>
            <Text style={styles.valor} selectable numberOfLines={1}>{cuenta?.email ?? '—'}</Text>
          </View>

          {!sinPassword && (
            <>
              <TouchableOpacity
                style={styles.desplegable}
                onPress={() => setAbiertoPassword((v) => !v)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ expanded: abiertoPassword }}
              >
                <Text style={styles.desplegableTitulo}>Cambiar contraseña</Text>
                <Icono nombre={abiertoPassword ? 'arriba' : 'abajo'} tamano={20} />
              </TouchableOpacity>
              {abiertoPassword && (
                <View style={styles.desplegableContenido}>
                  <InputField placeholder="Contraseña actual" secureTextEntry value={passActual} onChangeText={setPassActual} />
                  <InputField placeholder="Contraseña nueva" secureTextEntry value={passNueva} onChangeText={setPassNueva} />
                  <InputField placeholder="Repetir contraseña nueva" secureTextEntry value={passRepetida} onChangeText={setPassRepetida} />
                  <Text style={styles.ayuda}>{REQUISITOS_PASSWORD}</Text>
                  <Button title="Guardar contraseña" onPress={cambiarPassword} loading={cambiando} />
                </View>
              )}
            </>
          )}

          <Text style={[styles.seccion, styles.seccionPeligro]}>Zona de peligro</Text>
          <Text style={styles.ayuda}>
            Eliminar la cuenta borra también todos sus perfiles, el progreso, las amistades y los mensajes.
          </Text>

          {confirmando ? (
            <>
              {!sinPassword && (
                <InputField placeholder="Tu contraseña" secureTextEntry value={password} onChangeText={setPassword} />
              )}
              <Button title="Eliminar mi cuenta para siempre" variant="danger" onPress={pedirConfirmacion} loading={eliminando} />
              <Button title="Cancelar" variant="secondary" onPress={() => { setConfirmando(false); setPassword(''); }} disabled={eliminando} />
            </>
          ) : (
            <Button title="Eliminar cuenta" variant="danger" onPress={() => setConfirmando(true)} />
          )}
        </View>
      </FormScroll>
    </Background>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', paddingVertical: 20 },
  glassCard: { alignSelf: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 25, paddingVertical: 18, paddingHorizontal: 28, marginVertical: 18, borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1 },
  seccion: { color: '#fff', fontSize: 18, fontFamily: FUENTE_TITULO, fontWeight: 'bold', marginBottom: 8 },
  desplegable: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 1, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12 },
  desplegableTitulo: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  desplegableContenido: { marginTop: 10 },
  seccionPeligro: { marginTop: 20, color: '#ffb3bd' },
  dato: { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  etiqueta: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  valor: { color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 2 },
  ayuda: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 8 },
});
