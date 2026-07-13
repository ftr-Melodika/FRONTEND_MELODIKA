import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, TouchableWithoutFeedback, ScrollView, Alert, TouchableOpacity, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importamos tus componentes modulares
import { SideMenuHeader } from './menu/SideMenuHeader';
import { MenuItem } from './menu/MenuItem';
import { AccordotionItem } from './menu/AccordotionItem';
import { SubMenuItem } from './menu/SubMenuItem';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = 320; // Ancho amplio para que el anidado respire bien

export function SideMenu({ visible, onClose, perfil, cuenta, token, navigation }) {
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
    await AsyncStorage.clear();
    onClose();
    navigation.replace('Login');
  };

  const handleCambiarPerfil = () => {
    onClose();
    navigation.replace('SelectUser', { cuenta, token });
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        
        <SideMenuHeader perfil={perfil} cuenta={cuenta} />

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          
          <AccordotionItem title="Perfil" icon="👤">
            <SubMenuItem title="Configuración" icon="⚙️" onPress={() => handleProximamente('Configuración')} />
            
            {/* 👇 Anidado nivel 2: Funciona perfecto gracias a tu diseño */}
            <AccordotionItem title="Seguimiento de usuario" icon="📈">
              <SubMenuItem title="Logros y recompensas" icon="🏅" onPress={() => handleProximamente('Logros y recompensas')} />
              
              <SubMenuItem 
                title="Progreso" 
                icon="📊" 
                onPress={() => { onClose(); navigation.navigate('Progreso'); }} 
              />

              <SubMenuItem title="Ranking" icon="🏆" onPress={() => handleProximamente('Ranking')} />
            </AccordotionItem>
          </AccordotionItem>

          <MenuItem 
            title="Cursos" 
            icon="🎸" 
            isActive={true} // Por ahora asume que el Home está activo
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
            <SubMenuItem title="Reportar errores" icon="🪲" onPress={() => handleProximamente('Reportar errores')} />
            <SubMenuItem title="Contacto" icon="📞" onPress={() => handleProximamente('Contacto')} />
          </AccordotionItem>

          <View style={{ height: 10 }}/>

          <TouchableOpacity style={styles.footerBtn} onPress={handleCambiarPerfil}>
            <Text style={styles.footerBtnText}>🔄 Cambiar Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.footerBtn, styles.footerLogoutBtn]} onPress={handleLogout}>
            <Text style={styles.footerLogoutText}>🚪 Cerrar Sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  drawer: { 
    position: 'absolute', top: 0, bottom: 0, left: 0, 
    width: DRAWER_WIDTH, 
    backgroundColor: '#0B0B15', // Fondo Deep Dark Figma
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)' 
  },
  scroll: { flex: 1, paddingTop: 5 }
  ,
  footerContainer: { padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: '#0B0B15' },
  footerBtn: { width: '90%', marginLeft: '5%', paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 10 },
  footerLogoutBtn: { backgroundColor: 'rgba(226, 85, 106, 0.1)', marginBottom: 0 },
  footerBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  footerLogoutText: { color: '#E2556A', fontSize: 14, fontWeight: 'bold', textAlign: 'center' }
});