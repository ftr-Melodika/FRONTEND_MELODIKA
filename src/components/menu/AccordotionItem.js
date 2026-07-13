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
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 25, borderLeftWidth: 4, borderLeftColor: 'transparent' },
  openContainer: { backgroundColor: 'rgba(255,255,255,0.02)' },
  leftContent: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 20, marginRight: 15, color: 'rgba(255,255,255,0.7)' },
  text: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600' },
  openText: { color: '#fff' },
  arrow: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  
  childrenContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)' },
  verticalLine: { width: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginLeft: 34, marginTop: 10, marginBottom: 10, borderRadius: 2 },
  childrenWrapper: { flex: 1, paddingLeft: 10, paddingVertical: 5 }
});