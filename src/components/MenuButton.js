// Archivo: src/components/MenuButton.js
// Botón hamburguesa (☰) que reemplaza al "← Volver" en las pantallas internas de la app.
import { Icono } from './icono/Icono';
import { TouchableOpacity, StyleSheet } from 'react-native';

export function MenuButton({ onPress, style }) {
  return (
    <TouchableOpacity
      style={[styles.menuButton, style]}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel="Abrir menú"
    >
      <Icono nombre="menu" tamano={26} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menuButton: { backgroundColor: 'rgba(255,255,255,0.1)', width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
});
