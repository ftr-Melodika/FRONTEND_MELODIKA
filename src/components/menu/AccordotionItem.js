import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function AccordionItem({ title, isSubItem = false, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity 
        style={[styles.menuItem, isSubItem && styles.subMenuItem]} 
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={isSubItem ? styles.subMenuItemText : styles.menuItemText}>{title}</Text>
        <Text style={isSubItem ? styles.arrowIconSub : styles.arrowIcon}>
          {isOpen ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>
      
      {isOpen && (
        <View style={isSubItem ? styles.subSubItemsContainer : styles.subItemsContainer}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  menuItemText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '700' },
  arrowIcon: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  
  subItemsContainer: { backgroundColor: 'rgba(0, 0, 0, 0.2)', paddingLeft: 15 },
  subMenuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15 },
  subMenuItemText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  arrowIconSub: { color: 'rgba(255,255,255,0.3)', fontSize: 10 },
  
  subSubItemsContainer: { backgroundColor: 'rgba(0, 0, 0, 0.15)', paddingLeft: 15 },
});