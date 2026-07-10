import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export function Checkbox({ label, checked, onChange, style }) {
  return (
    <Pressable style={[styles.checkboxContainer, style]} onPress={() => onChange(!checked)}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkboxTick}>✓</Text>}
      </View>
      {label && <Text style={styles.checkboxLabel}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 2 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.6)', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  checkboxChecked: { backgroundColor: '#b28cff', borderColor: '#b28cff' },
  checkboxTick: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  checkboxLabel: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, flex: 1 },
});