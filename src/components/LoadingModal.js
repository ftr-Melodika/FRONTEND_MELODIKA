import React from 'react';
import { Modal, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export function LoadingModal({ visible, text = "Cargando..." }) {
  return (
    <Modal transparent={true} animationType="fade" visible={visible} onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.glassBox}>
          <ActivityIndicator size="large" color="#b28cff" />
          {text && <Text style={styles.loadingText}>{text}</Text>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center' },
  glassBox: { backgroundColor: 'rgba(30, 30, 45, 0.85)', paddingVertical: 25, paddingHorizontal: 35, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  loadingText: { color: '#fff', marginTop: 15, fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
});