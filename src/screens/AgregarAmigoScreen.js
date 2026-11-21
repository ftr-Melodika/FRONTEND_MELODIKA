// Archivo: src/screens/AgregarAmigoScreen.js
// Dos formas de sumar amigos: enviar una solicitud por username exacto o compartir mi link de invitación.
import { useCallback, useContext, useState } from 'react';
import { View, Text, ScrollView, Share, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { FormScroll } from '../components/FormScroll';
import { ScreenHeader } from '../components/ScreenHeader';
import { AuthContext } from '../context/AuthContext';
import { amistadesService } from '../services/amistadesService';
import { mensajeInvitacion } from '../utils/invitaciones';

export function AgregarAmigoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { perfil } = useContext(AuthContext);
  const miId = perfil?.id;

  const [username, setUsername] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null); // { ok, texto }

  const [invitacion, setInvitacion] = useState(null);
  const [errorLink, setErrorLink] = useState(null);
  const [regenerando, setRegenerando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      (async () => {
        try {
          const datos = await amistadesService.obtenerInvitacion(miId);
          if (!cancelado) { setInvitacion(datos); setErrorLink(null); }
        } catch (e) {
          if (!cancelado) setErrorLink(e.message);
        }
      })();
      return () => { cancelado = true; };
    }, [miId])
  );

  const enviar = async () => {
    const limpio = username.trim().replace(/^@/, '');
    if (!limpio) {
      setResultado({ ok: false, texto: 'Escribí el nombre de usuario exacto.' });
      return;
    }
    setEnviando(true);
    setResultado(null);
    try {
      await amistadesService.enviarSolicitudPorUsername(miId, limpio);
      setResultado({ ok: true, texto: `Solicitud enviada a @${limpio}.` });
      setUsername('');
    } catch (e) {
      setResultado({ ok: false, texto: e.message });
    } finally {
      setEnviando(false);
    }
  };

  const compartir = async () => {
    if (!invitacion?.url) return;
    try {
      await Share.share({ message: mensajeInvitacion(perfil?.nombre || 'Un músico', invitacion.url) });
    } catch (e) {
      setErrorLink(e.message);
    }
  };

  const regenerar = async () => {
    setRegenerando(true);
    setErrorLink(null);
    try {
      setInvitacion(await amistadesService.regenerarInvitacion(miId));
    } catch (e) {
      setErrorLink(e.message);
    } finally {
      setRegenerando(false);
    }
  };

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <ScreenHeader
          title="Agregar amigo"
          right={<Button title="Volver" icono="volver" variant="back" onPress={() => navigation.goBack()} />}
        />

        <View style={styles.fila}>
          <FormScroll style={styles.columna} contentContainerStyle={styles.contenido}>
            <Text style={styles.titulo}>Por nombre de usuario</Text>
            <Text style={styles.ayuda}>Escribilo exacto, sin el @.</Text>
            <InputField
              placeholder="Nombre de usuario"
              value={username}
              onChangeText={setUsername}
              onSubmitEditing={enviar}
              returnKeyType="send"
            />
            {!!resultado && <Text style={resultado.ok ? styles.ok : styles.error}>{resultado.texto}</Text>}
            <Button title="Enviar solicitud" onPress={enviar} loading={enviando} />
          </FormScroll>

          <ScrollView style={styles.columna} contentContainerStyle={styles.contenido}>
            <Text style={styles.titulo}>Mi link de invitación</Text>
            <Text style={styles.ayuda}>Quien lo abra te va a poder enviar una solicitud de amistad.</Text>
            <View style={styles.linkCaja}>
              <Text style={styles.link} selectable numberOfLines={2}>{invitacion?.url ?? 'Generando tu link...'}</Text>
            </View>
            {!!errorLink && <Text style={styles.error}>{errorLink}</Text>}
            <Button title="Compartir link" onPress={compartir} disabled={!invitacion?.url} />
            <Button title="Generar uno nuevo" variant="secondary" onPress={regenerar} loading={regenerando} disabled={!invitacion?.url} />
            <Text style={styles.ayuda}>Al generar uno nuevo, el link anterior deja de funcionar.</Text>
          </ScrollView>
        </View>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  fila: { flex: 1, flexDirection: 'row', gap: 20 },
  columna: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  contenido: { padding: 16 },
  titulo: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  ayuda: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2, marginBottom: 10 },
  linkCaja: { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 12, marginBottom: 6 },
  link: { color: '#fff', fontSize: 13 },
  ok: { color: '#a3fba3', fontSize: 14, textAlign: 'center', marginVertical: 6 },
  error: { color: '#ffb3bd', fontSize: 14, textAlign: 'center', marginVertical: 6 },
});
