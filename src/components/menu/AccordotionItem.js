import { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export function AccordotionItem({ title, icon, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity 
        style={[styles.container, isOpen && styles.openContainer]} 
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View style={styles.leftContent}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={[styles.text, isOpen && styles.openText]}>{title}</Text>
        </View>
        <Text style={[styles.arrow, isOpen && styles.openText]}>{isOpen ? '▲' : '▼'}</Text>
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
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingLeft: 30, paddingRight: 20, borderLeftWidth: 4, borderLeftColor: 'transparent' },
  openContainer: { backgroundColor: 'rgba(255,255,255,0.02)' },
  leftContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  icon: { fontSize: 20, marginRight: 12, color: 'rgba(255,255,255,0.7)' },
  text: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600', flexShrink: 1, flexWrap: 'wrap' },
  openText: { color: '#fff' },
  arrow: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 8 },
  
  childrenContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)' },
  verticalLine: { width: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginLeft: 38, marginTop: 10, marginBottom: 10, borderRadius: 2 },
  childrenWrapper: { flex: 1, paddingLeft: 12, paddingVertical: 5 }
});