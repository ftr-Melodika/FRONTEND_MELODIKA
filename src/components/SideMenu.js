import { useEffect, useRef, useState, useContext } from 'react';
import { View, StyleSheet, Animated, Dimensions, TouchableWithoutFeedback, ScrollView, Alert, TouchableOpacity, Text } from 'react-native';

// 👇 1. VOLVEMOS A IMPORTAR NUESTRO CONTEXTO
import { AuthContext } from '../context/AuthContext';
import { SideMenuFooter } from './menu/SideMenuFooter';
import { SideMenuHeader } from './menu/SideMenuHeader';
import { MenuItem } from './menu/MenuItem';
import { AccordotionItem } from './menu/AccordotionItem';
import { SubMenuItem } from './menu/SubMenuItem';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = 320; 
const DRAWER_LEFT_OFFSET = 48; // separacion para evitar notch/isla dinámica (ajuste final)

// 👇 2. LIMPIAMOS LAS PROPS FANTASMAS (Chau cuenta y token)
export function SideMenu({ visible, onClose, perfil, navigation }) {
  // 👇 3. TRAEMOS EL LOGOUT VERDADERO DESDE EL CONTEXTO
  const { logout } = useContext(AuthContext);
  
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsRendering(true);
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 250, useNativeDriver: true }).start(() => {
        setIsRendering(false);
      });
    }
  }, [visible]);

  if (!isRendering) return null;

  const handleProximamente = (nombreItem) => {
    Alert.alert('Melodika', `${nombreItem} estará disponible próximamente.`);
  };

  const handleLogout = async () => {
    onClose();
    // 👇 4. USAMOS EL LOGOUT GLOBAL (Limpia memoria, estado y almacenamiento)
    await logout();
  };

  const handleCambiarPerfil = () => {
    onClose();
    // 👇 5. NAVEGAMOS LIMPIO SIN ROUTE.PARAMS
    navigation.replace('SelectUser');
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      {/* Relleno izquierdo para que el contenido del drawer no quede pegado al borde */}
      <View style={styles.leftFill} />
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        
        {/* Usamos el header de tu compa, pero sin pasarle la 'cuenta' innecesaria */}
        <SideMenuHeader perfil={perfil} />

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          
          <AccordotionItem title="Perfil" icon="👤">
            <SubMenuItem title="Configuración" icon="⚙️" onPress={() => handleProximamente('Configuración')} />
            
            <AccordotionItem title="Seguimiento de usuario" icon="📈">
              <SubMenuItem title="Logros y recompensas" icon="🏆" onPress={() => handleProximamente('Logros y recompensas')} />
              <SubMenuItem
                title="Progreso"
                icon="📊"
                onPress={() => { onClose(); navigation.navigate('Progreso'); }}
              />
              <SubMenuItem title="Ranking" icon="🥇" onPress={() => handleProximamente('Ranking')} />
            </AccordotionItem>
          </AccordotionItem>

          <MenuItem
            title="Cursos"
            icon="🎸"
            isActive={true}
            onPress={() => { onClose(); navigation.navigate('Home'); }}
          />
          
          <MenuItem
            title="Práctica"
            icon="🎹"
            onPress={() => handleProximamente('Práctica')}
          />

          <AccordotionItem title="Comunidad" icon="👥">
            <SubMenuItem title="Dar feedback" icon="💬" onPress={() => handleProximamente('Dar feedback')} />
            <SubMenuItem title="Grupos" icon="🤝" onPress={() => handleProximamente('Grupos')} />
          </AccordotionItem>

          <AccordotionItem title="Soporte" icon="🛠️">
            <SubMenuItem title="Preguntas frecuentes" icon="❓" onPress={() => handleProximamente('Preguntas frecuentes')} />
            <SubMenuItem title="Reportar errores" icon="🐛" onPress={() => handleProximamente('Reportar errores')} />
            <SubMenuItem title="Contacto" icon="📧" onPress={() => handleProximamente('Contacto')} />
          </AccordotionItem>

          <View style={{ height: 10 }}/>

          {/* Mantenemos el Footer inline con su estilo visual */}
          <SideMenuFooter 
          onCambiarPerfil={handleCambiarPerfil} 
          onLogout={handleLogout} 
          />

        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  drawer: {
    position: 'absolute', top: 0, bottom: 0, left: DRAWER_LEFT_OFFSET,
    width: DRAWER_WIDTH,
    backgroundColor: '#0B0B15', // Fondo Deep Dark Figma
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)'
  },
  scroll: { flex: 1, paddingTop: 5 },
  leftFill: { position: 'absolute', left: 0, top: 0, bottom: 0, width: DRAWER_LEFT_OFFSET, backgroundColor: '#0B0B15' },
  
});