import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export function LoadingModal({ visible, text = "Cargando..." }) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.glassBox}>
        <ActivityIndicator size="large" color="#b28cff" />
        {text && <Text style={styles.loadingText}>{text}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  glassBox: {
    backgroundColor: 'rgba(30, 30, 45, 0.85)',
    paddingVertical: 25,
    paddingHorizontal: 35,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  loadingText: {
    color: '#fff',
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});