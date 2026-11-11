// Archivo: src/components/ScreenHeader.js
// Encabezado de las pantallas internas: botón de menú (☰) + título.
// El propio header maneja el menú lateral, así cada pantalla no tiene que hacerlo.
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MenuButton } from './MenuButton';
import { SideMenu } from './SideMenu';
import { FUENTE_TITULO } from '../theme/fuentes';

export function ScreenHeader({ title, right }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <View style={styles.header}>
      <MenuButton onPress={() => setIsMenuOpen(true)} />
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {right}
      <SideMenu visible={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 15 },
  title: { flex: 1, fontSize: 24, color: '#fff', fontFamily: FUENTE_TITULO, fontWeight: 'bold' },
});
