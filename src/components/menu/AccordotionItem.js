import { Icono } from '../icono/Icono';
import { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';


export function AccordotionItem({ title, icon, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);


  return (
    <View>
      <TouchableOpacity
        style={[styles.container, isOpen && styles.openContainer]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View style={styles.leftContent}>
          <Icono nombre={icon} tamano={22} style={styles.icon} />
          <Text style={[styles.text, isOpen && styles.openText]}>{title}</Text>
        </View>
        <Icono nombre={isOpen ? 'arriba' : 'abajo'} tamano={14} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.childrenContainer}>
          {/* 👇 La línea vertical estilo Figma que conecta los submenús */}
          <View style={styles.verticalLine} />
          <View style={styles.childrenWrapper}>
            {children}
          </View>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingLeft: 25, paddingRight: 20, borderLeftWidth: 4, borderLeftColor: 'transparent' },
  openContainer: { backgroundColor: 'rgba(255,255,255,0.02)' },
  leftContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  icon: { marginRight: 15 },
  text: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600', flexShrink: 1, flexWrap: 'wrap' },
  openText: { color: '#fff' },

  childrenContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)' },
  verticalLine: { width: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginLeft: 38, marginTop: 10, marginBottom: 10, borderRadius: 2 },
  childrenWrapper: { flex: 1, paddingLeft: 12, paddingVertical: 5 }
});
