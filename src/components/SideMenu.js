import { useEffect, useRef, useState, useContext } from 'react';
import { View, StyleSheet, Animated, TouchableWithoutFeedback, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';

// Importamos TODAS nuestras piezas de Lego
import { SideMenuHeader } from './menu/SideMenuHeader';
import { AccordionItem } from './menu/AccordotionItem';
import { MenuItem } from './menu/MenuItem';
import { SubMenuItem } from './menu/SubMenuItem';
import { SideMenuFooter } from './menu/SideMenuFooter';

const DRAWER_WIDTH = 300; 

export function SideMenu({ visible, onClose, perfil, navigation }) {
  const { logout } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const safeLeft = Math.max(insets.left, 10);
  const safeDrawerWidth = DRAWER_WIDTH + safeLeft;
  const closedPosition = -safeDrawerWidth;
  
  const slideAnim = useRef(new Animated.Value(closedPosition)).current;
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsRendering(true);
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: closedPosition, duration: 250, useNativeDriver: true }).start(() => {
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
    await logout(); 
  };

  const handleCambiarPerfil = () => {
    onClose();
    navigation.replace('SelectUser'); 
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.drawer, { left: 0, width: safeDrawerWidth, paddingLeft: safeLeft, transform: [{ translateX: slideAnim }] }]}>
        
        <SideMenuHeader perfil={perfil} />

        <ScrollView showsVerticalScrollIndicator={false} style={styles.menuScroll}>
          
          <AccordionItem title="👤 Perfil">
            <SubMenuItem title="⚙️ Configuración" onPress={() => handleProximamente('Configuración')} />
            
            <AccordionItem title="📈 Seguimiento de usuario" isSubItem={true}>
              <SubMenuItem title="🏅 Logros y recompensas" onPress={() => handleProximamente('Logros')} />
              <SubMenuItem title="📊 Progreso" onPress={() => handleProximamente('Progreso')} />
              <SubMenuItem title="🏆 Ranking" onPress={() => handleProximamente('Ranking')} />
            </AccordionItem>
          </AccordionItem>

          <MenuItem 
            title="🎸 Cursos" 
            isActive={true} 
            onPress={() => { onClose(); navigation.navigate('Home'); }} 
          />

          <MenuItem 
            title="🎹 Práctica" 
            onPress={() => handleProximamente('Práctica')} 
          />

          <AccordionItem title="👥 Comunidad">
            <SubMenuItem title="💬 Dar feedback" onPress={() => handleProximamente('Dar feedback')} />
            <SubMenuItem title="🤝 Grupos" onPress={() => handleProximamente('Grupos')} />
          </AccordionItem>

          <AccordionItem title="🛠️ Soporte">
            <SubMenuItem title="❓ Preguntas frecuentes" onPress={() => handleProximamente('Preguntas frecuentes')} />
            <SubMenuItem title="🪲 Reportar errores" onPress={() => handleProximamente('Reportar errores')} />
            <SubMenuItem title="📞 Contacto" onPress={() => handleProximamente('Contacto')} />
          </AccordionItem>

        </ScrollView>

        <SideMenuFooter 
          onCambiarPerfil={handleCambiarPerfil} 
          onLogout={handleLogout} 
        />

      </Animated.View>
    </View>
  );
}

// Mirá lo limpio que quedó el StyleSheet. Solo tiene la estructura general.
const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: DRAWER_WIDTH, backgroundColor: '#151528', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)' },
  menuScroll: { flex: 1 },
});