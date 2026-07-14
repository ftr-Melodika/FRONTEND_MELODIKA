import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export function Button({ title, onPress, variant = 'primary', style, textStyle, loading = false }) {
  const isSecondary = variant === 'secondary';
  const isLink = variant === 'link';
  const isBack = variant === 'back';

  return (
    <TouchableOpacity
      style={[
        styles.button, 
        isSecondary && styles.buttonSecondary, 
        isLink && styles.buttonLink, 
        isBack && styles.buttonBack,
        style
      ]}
      onPress={onPress}
      disabled={loading} // 👈 Evita doble tap accidental
      activeOpacity={isLink ? 0.6 : 0.8}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary || isLink ? "#b28cff" : "#fff"} />
      ) : (
        <Text style={[
          styles.text, 
          isSecondary && styles.textSecondary, 
          isLink && styles.textLink,
          isBack && styles.textBack,
          textStyle
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: '#b28cff', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginVertical: 10, width: '100%' },
  buttonBack: { backgroundColor: 'transparent', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 12, alignSelf: 'flex-start', marginVertical: 4, width: 'auto' },
  buttonSecondary: { backgroundColor: 'transparent', borderColor: '#fff', borderWidth: 1 },
  buttonLink: { backgroundColor: 'transparent', paddingVertical: 0, marginVertical: 0, width: 'auto' },
  text: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  textBack: { color: '#fff', fontSize: 14, fontWeight: '500' },
  textSecondary: { color: '#fff' },
  textLink: { color: '#fff', fontSize: 14, textDecorationLine: 'underline' },
});