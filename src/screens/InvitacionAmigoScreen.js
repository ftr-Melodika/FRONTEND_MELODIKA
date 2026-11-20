// Archivo: src/screens/InvitacionAmigoScreen.js
// Destino del link melodika://invitar/<token>: muestra quién invita y permite enviar la solicitud.
import { useCallback, useContext, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Button } from '../components/Button';
import { LoadingModal } from '../components/LoadingModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { AvatarUsuario } from '../components/AvatarUsuario';
import { AuthContext } from '../context/AuthContext';
import { amistadesService } from '../services/amistadesService';
import { FUENTE_TITULO } from '../theme/fuentes';

export function InvitacionAmigoScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { perfil: miPerfil } = useContext(AuthContext);
  const miId = miPerfil?.id;
  const token = route.params?.token;

  const [datos, setDatos] = useState(null); // { perfil, relacion }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [errorAccion, setErrorAccion] = useState(null);

  const cargar = useCallback(() => amistadesService.resolverInvitacion(miId, token), [miId, token]);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const respuesta = await cargar();
          if (!cancelado) setDatos(respuesta);
        } catch (e) {
          if (!cancelado) setError(e.message);
        } finally {
          if (!cancelado) setLoading(false);
        }
      })();
      return () => { cancelado = true; };
    }, [cargar])
  );

  const ejecutar = async (accion) => {
    setProcesando(true);
    setErrorAccion(null);
    try {
      await accion();
      setDatos(await cargar());
    } catch (e) {
      setErrorAccion(e.message);
    } finally {
      setProcesando(false);
    }
  };

  const enviar = () => ejecutar(() => amistadesService.enviarSolicitudPorToken(miId, token));
  const aceptar = () => ejecutar(() => amistadesService.responderSolicitud(miId, datos.relacion.amistadId, 'aceptar'));

  const salir = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'));

  const renderAcciones = () => {
    const estado = datos.relacion?.estado;
    if (datos.esPropio || estado === 'propia' || datos.perfil.id === miId) {
      return <Text style={styles.estado}>Este es tu propio link. Compartilo con quien quieras sumar.</Text>;
    }
    switch (estado) {
      case 'amigos':
        return <Text style={styles.estado}>¡Ya son amigos!</Text>;
      case 'enviada':
        return <Text style={styles.estado}>Ya le enviaste una solicitud. Falta que la acepte.</Text>;
      case 'recibida':
        return (
          <>
            <Text style={styles.estado}>Esta persona ya te había enviado una solicitud.</Text>
            <Button title="Aceptar solicitud" onPress={aceptar} loading={procesando} />
          </>
        );
      default:
        return <Button title="Enviar solicitud de amistad" onPress={enviar} loading={procesando} />;
    }
  };

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <ScreenHeader
          title="Invitación de amistad"
          right={<Button title="Cerrar" icono="volver" variant="back" onPress={salir} />}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        {!!datos && (
          <View style={styles.tarjeta}>
            <AvatarUsuario nombre={datos.perfil.nombre} foto={datos.perfil.avatarUrl} tamano={84} />
            <Text style={styles.nombre}>{datos.perfil.nombre}</Text>
            <Text style={styles.username}>@{datos.perfil.username}</Text>
            <Text style={styles.invita}>te invita a ser su amigo en Melodika</Text>
            <View style={styles.acciones}>{renderAcciones()}</View>
            {!!errorAccion && <Text style={styles.error}>{errorAccion}</Text>}
            <Button
              title="Ver perfil"
              variant="link"
              onPress={() => navigation.navigate('PerfilPublico', { perfilId: datos.perfil.id })}
              style={styles.verPerfil}
            />
          </View>
        )}
      </View>
      <LoadingModal visible={loading} text="Abriendo invitación..." />
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  error: { color: '#ffb3bd', fontSize: 14, textAlign: 'center', marginTop: 10 },
  tarjeta: { alignSelf: 'center', alignItems: 'center', width: '60%', maxWidth: 420, padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  nombre: { color: '#fff', fontSize: 20, fontFamily: FUENTE_TITULO, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  username: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 2 },
  invita: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 6, marginBottom: 6, textAlign: 'center' },
  acciones: { width: '100%' },
  estado: { color: '#a3fba3', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginVertical: 6 },
  verPerfil: { marginTop: 8 },
});
