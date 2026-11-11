// Archivo: src/screens/PerfilPublicoScreen.js
// Perfil de otro usuario. Qué se puede ver lo decide el backend: si el perfil es privado
// y no son amigos, las estadísticas directamente no llegan.
import { Icono, TextoConIcono, COLORES_ICONO } from '../components/icono/Icono';
import { useCallback, useContext, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
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

function Estadistica({ icono, acento, etiqueta, valor }) {
  return (
    <View style={styles.statCard}>
      <Icono nombre={icono} tamano={28} acento={acento} />
      <Text style={styles.statValor}>{valor}</Text>
      <Text style={styles.statEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

export function PerfilPublicoScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { perfil: miPerfil } = useContext(AuthContext);
  const otroId = route.params?.perfilId;

  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [errorAccion, setErrorAccion] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  const miId = miPerfil?.id;

  const cargar = useCallback(async () => {
    const respuesta = await amistadesService.obtenerPerfil(miId, otroId);
    setDatos(respuesta);
  }, [miId, otroId]);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const respuesta = await amistadesService.obtenerPerfil(miId, otroId);
          if (!cancelado) setDatos(respuesta);
        } catch (e) {
          if (!cancelado) setError(e.message);
        } finally {
          if (!cancelado) setLoading(false);
        }
      })();
      return () => { cancelado = true; };
    }, [miId, otroId])
  );

  // Hace la acción y vuelve a pedir el perfil: al aceptar, por ejemplo, ya se ven las estadísticas
  const ejecutar = async (accion) => {
    setProcesando(true);
    setErrorAccion(null);
    setConfirmando(false);
    try {
      await accion();
      await cargar();
    } catch (e) {
      setErrorAccion(e.message);
    } finally {
      setProcesando(false);
    }
  };

  const amistadId = datos?.relacion?.amistadId;
  const seguir = () => ejecutar(() => amistadesService.enviarSolicitud(miId, otroId));
  const responder = (accion) => ejecutar(() => amistadesService.responderSolicitud(miId, amistadId, accion));
  const quitar = () => ejecutar(() => amistadesService.eliminarAmistad(miId, amistadId));

  const renderAcciones = () => {
    if (datos.esPropio) {
      return <Button title="Editar mi perfil" variant="secondary" onPress={() => navigation.navigate('EditUser', { perfilAEditar: miPerfil })} />;
    }
    switch (datos.relacion?.estado) {
      case 'amigos':
        return (
          <>
            <TextoConIcono nombre="union" tamano={18} centrado style={styles.estado}>Son amigos</TextoConIcono>
            {confirmando ? (
              <Button title="Confirmar: dejar de seguir" variant="danger" onPress={quitar} loading={procesando} />
            ) : (
              <Button title="Dejar de seguir" variant="secondary" onPress={() => setConfirmando(true)} disabled={procesando} />
            )}
          </>
        );
      case 'enviada':
        return (
          <>
            <TextoConIcono nombre="reloj" tamano={18} centrado style={styles.estado}>Solicitud enviada</TextoConIcono>
            <Button title="Cancelar solicitud" variant="secondary" onPress={quitar} loading={procesando} />
          </>
        );
      case 'recibida':
        return (
          <>
            <TextoConIcono nombre="saludo" tamano={18} acento={COLORES_ICONO.rayo} centrado style={styles.estado}>Te envió una solicitud</TextoConIcono>
            <Button title="Aceptar" onPress={() => responder('aceptar')} loading={procesando} />
            <Button title="Rechazar" variant="danger" onPress={() => responder('rechazar')} disabled={procesando} />
          </>
        );
      default:
        return <Button title="Seguir" onPress={seguir} loading={procesando} />;
    }
  };

  const stats = datos?.puedeVerEstadisticas ? datos.estadisticas : null;

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <ScreenHeader
          title={datos ? `@${datos.username}` : 'Perfil'}
          right={<Button title="Volver" icono="volver" variant="back" onPress={() => navigation.goBack()} />}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        {!!datos && (
          <View style={styles.fila}>
            <ScrollView style={styles.columnaPerfil} contentContainerStyle={styles.perfilContenido}>
              <AvatarUsuario nombre={datos.nombre} foto={datos.avatarUrl} tamano={84} />
              <Text style={styles.nombre}>{datos.nombre}</Text>
              {!!datos.pais && <TextoConIcono nombre="pin" tamano={15} acento={COLORES_ICONO.rojo} centrado style={styles.detalle}>{datos.pais}</TextoConIcono>}
              <TextoConIcono nombre={datos.esPublico ? 'globo' : 'candado'} tamano={15} centrado style={styles.detalle}>
                {datos.esPublico ? 'Perfil público' : 'Perfil privado'}  •  {datos.totalAmigos ?? 0} {datos.totalAmigos === 1 ? 'amigo' : 'amigos'}
              </TextoConIcono>
              <View style={styles.acciones}>{renderAcciones()}</View>
              {!!errorAccion && <Text style={styles.error}>{errorAccion}</Text>}
            </ScrollView>

            <ScrollView style={styles.columnaStats} contentContainerStyle={styles.statsContenido}>
              {stats ? (
                <>
                  <View style={styles.statsFila}>
                    <Estadistica icono="rayo" acento={COLORES_ICONO.rayo} etiqueta="XP total" valor={stats.xp ?? 0} />
                    <Estadistica icono="llama" acento={COLORES_ICONO.llama} etiqueta="Racha (días)" valor={stats.racha ?? 0} />
                    <Estadistica icono="completado" acento={COLORES_ICONO.verde} etiqueta="Lecciones" valor={`${stats.leccionesCompletadas ?? 0} / ${stats.totalLecciones ?? 0}`} />
                    <Estadistica icono="trofeo" acento={COLORES_ICONO.oro} etiqueta="Cursos terminados" valor={stats.cursosCompletados ?? 0} />
                  </View>

                  {(stats.cursos || []).map((curso) => {
                    const porcentaje = Math.min(100, Math.max(0, Number(curso.porcentaje) || 0));
                    return (
                      <View key={curso.id} style={styles.curso}>
                        <View style={styles.cursoTitulo}>
                          <TextoConIcono nombre={curso.completado ? 'completado' : 'guitarra'} tamano={18} acento={curso.completado ? COLORES_ICONO.verde : undefined} contenedorStyle={styles.cursoNombreFila} style={styles.cursoNombre} numberOfLines={1}>{curso.nombre}</TextoConIcono>
                          <Text style={styles.cursoPorcentaje}>{porcentaje}%</Text>
                        </View>
                        <View style={styles.barraFondo}>
                          <View style={[styles.barraRelleno, { width: `${porcentaje}%` }]} />
                        </View>
                      </View>
                    );
                  })}
                </>
              ) : (
                <View style={styles.privado}>
                  <Icono nombre="candado" tamano={48} />
                  <Text style={styles.privadoTitulo}>Este perfil es privado</Text>
                  <Text style={styles.privadoTexto}>Vas a poder ver sus estadísticas cuando acepte tu solicitud.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
      <LoadingModal visible={loading} text="Cargando perfil..." />
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  error: { color: '#ffb3bd', fontSize: 14, textAlign: 'center', marginTop: 10 },
  fila: { flex: 1, flexDirection: 'row', gap: 20 },
  columnaPerfil: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  perfilContenido: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  nombre: { color: '#fff', fontSize: 20, fontFamily: FUENTE_TITULO, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  detalle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4, textAlign: 'center' },
  acciones: { width: '100%', marginTop: 10 },
  estado: { color: '#a3fba3', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 },
  columnaStats: { flex: 1.6 },
  statsContenido: { flexGrow: 1, paddingBottom: 10 },
  statsFila: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statCard: { flexGrow: 1, flexBasis: 130, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: 'rgba(178,140,255,0.15)', borderWidth: 1, borderColor: 'rgba(178,140,255,0.5)' },
  statValor: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  statEtiqueta: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2, textAlign: 'center' },
  curso: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, marginBottom: 8 },
  cursoTitulo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cursoNombreFila: { flex: 1 },
  cursoNombre: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cursoPorcentaje: { color: '#a3fba3', fontSize: 14, fontWeight: 'bold', marginLeft: 10 },
  barraFondo: { height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.35)', overflow: 'hidden' },
  barraRelleno: { height: '100%', backgroundColor: '#b28cff' },
  privado: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  privadoTitulo: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  privadoTexto: { color: 'rgba(255,255,255,0.75)', fontSize: 14, textAlign: 'center', marginTop: 4 },
});
