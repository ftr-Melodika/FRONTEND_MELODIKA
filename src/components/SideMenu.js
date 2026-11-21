import { useEffect, useRef, useState, useContext } from 'react';
import { View, StyleSheet, Animated, Pressable, ScrollView, Modal, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthContext } from '../context/AuthContext';
import { SideMenuFooter } from './menu/SideMenuFooter';
import { SideMenuHeader } from './menu/SideMenuHeader';
import { MenuItem } from './menu/MenuItem';
import { AccordotionItem } from './menu/AccordotionItem';
import { SubMenuItem } from './menu/SubMenuItem';

const DRAWER_WIDTH = 300;
const URL_SITIO_WEB = 'https://melodika.netlify.app';

// El menú se dibuja dentro de un Modal: así queda por encima de cualquier pantalla
// y tocar en cualquier lugar fuera del panel lo cierra.
export function SideMenu({ visible, onClose }) {
  const { logout, perfil } = useContext(AuthContext);
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const anchoTotal = DRAWER_WIDTH + insets.left;

  const slideAnim = useRef(new Animated.Value(-anchoTotal)).current;
  const fondoAnim = useRef(new Animated.Value(0)).current;
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (visible) {
      setSeccionAbierta(seccionDe(pantallaActual)); // al abrir, el menú se reinicia
      setIsRendering(true);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(fondoAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else if (isRendering) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -anchoTotal, duration: 220, useNativeDriver: true }),
        Animated.timing(fondoAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => setIsRendering(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pantallaActual = route?.name;

  // Solo un acordeón abierto a la vez
  const seccionDe = (pantalla) => {
    if (['EditUser', 'AjustesCuenta', 'Logros', 'Progreso', 'Ranking'].includes(pantalla)) return 'Perfil';
    if (['Practica', 'Canciones', 'Cancion'].includes(pantalla)) return 'Práctica';
    if (['Solicitudes', 'Feedback', 'Grupos', 'GrupoChat'].includes(pantalla)) return 'Comunidad';
    if (['PreguntasFrecuentes', 'ReportarError', 'Contacto'].includes(pantalla)) return 'Soporte';
    return null;
  };
  const [seccionAbierta, setSeccionAbierta] = useState(() => seccionDe(pantallaActual));
  const acordeon = (nombre) => ({
    open: seccionAbierta === nombre,
    onToggle: (abrir) => setSeccionAbierta(abrir ? nombre : null),
  });

  // Navega y cierra el menú. Si ya estamos en esa pantalla, solo cierra.
  const irA = (pantalla, params) => {
    onClose();
    if (pantalla !== pantallaActual) navigation.navigate(pantalla, params);
  };

  const abrirSitioWeb = () => {
    onClose();
    Linking.openURL(URL_SITIO_WEB).catch(() => {});
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const handleCambiarPerfil = () => {
    onClose();
    navigation.reset({ index: 0, routes: [{ name: 'SelectUser' }] });
  };

  return (
    <Modal
      visible={isRendering}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
      supportedOrientations={['landscape', 'landscape-left', 'landscape-right', 'portrait']}
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Fondo oscuro: tocarlo cierra el menú */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: fondoAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar menú" />
        </Animated.View>

        <Animated.View
          style={[
            styles.drawer,
            { width: anchoTotal, paddingLeft: insets.left, transform: [{ translateX: slideAnim }] },
          ]}
        >
          <SideMenuHeader perfil={perfil} />

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + 10 }}>

            <MenuItem
              title="Cursos"
              icon="guitarra"
              isActive={pantallaActual === 'Home' || pantallaActual === 'Leccion'}
              onPress={() => irA('Home')}
            />

            <AccordotionItem
              title="Perfil"
              icon="usuario"
              {...acordeon('Perfil')}
            >
              <SubMenuItem
                title="Configuración"
                icon="ajustes"
                isActive={pantallaActual === 'EditUser'}
                onPress={() => irA('EditUser', { perfilAEditar: perfil })}
              />
              <SubMenuItem title="Ajustes de cuenta" icon="candado" isActive={pantallaActual === 'AjustesCuenta'} onPress={() => irA('AjustesCuenta')} />
              <SubMenuItem title="Logros y recompensas" icon="trofeo" isActive={pantallaActual === 'Logros'} onPress={() => irA('Logros')} />
              <SubMenuItem title="Progreso" icon="barras" isActive={pantallaActual === 'Progreso'} onPress={() => irA('Progreso')} />
              <SubMenuItem title="Ranking" icon="medalla1" isActive={pantallaActual === 'Ranking'} onPress={() => irA('Ranking')} />
            </AccordotionItem>

            <AccordotionItem title="Práctica" icon="pua" {...acordeon('Práctica')}>
              <SubMenuItem title="Práctica" icon="rayo" isActive={pantallaActual === 'Practica'} onPress={() => irA('Practica')} />
              <SubMenuItem
                title="Canciones"
                icon="partitura"
                isActive={pantallaActual === 'Canciones' || pantallaActual === 'Cancion'}
                onPress={() => irA('Canciones')}
              />
            </AccordotionItem>

            <MenuItem title="Afinador" icon="notas" isActive={pantallaActual === 'Afinador'} onPress={() => irA('Afinador')} />

            <AccordotionItem title="Comunidad" icon="amigos" {...acordeon('Comunidad')}>
              <SubMenuItem title="Solicitudes y amigos" icon="saludo" isActive={pantallaActual === 'Solicitudes'} onPress={() => irA('Solicitudes')} />
              <SubMenuItem title="Dar feedback" icon="chat" isActive={pantallaActual === 'Feedback'} onPress={() => irA('Feedback')} />
              <SubMenuItem title="Grupos" icon="union" isActive={pantallaActual === 'Grupos' || pantallaActual === 'GrupoChat'} onPress={() => irA('Grupos')} />
            </AccordotionItem>

            <AccordotionItem title="Soporte" icon="soporte" {...acordeon('Soporte')}>
              <SubMenuItem
                title="Preguntas frecuentes"
                icon="pregunta"
                isActive={pantallaActual === 'PreguntasFrecuentes'}
                onPress={() => irA('PreguntasFrecuentes')}
              />
              <SubMenuItem title="Reportar errores" icon="insecto" isActive={pantallaActual === 'ReportarError'} onPress={() => irA('ReportarError')} />
              <SubMenuItem title="Contacto" icon="sobre" isActive={pantallaActual === 'Contacto'} onPress={() => irA('Contacto')} />
              <SubMenuItem title="Sitio web" icon="globo" onPress={abrirSitioWeb} />
            </AccordotionItem>

            <View style={{ height: 10 }} />

            <SideMenuFooter
              onCambiarPerfil={handleCambiarPerfil}
              onLogout={handleLogout}
            />

          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  drawer: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    backgroundColor: '#3E3876', // Fondo Deep Dark Figma
    borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 16,
  },
  scroll: { flex: 1, paddingTop: 5 },
});
