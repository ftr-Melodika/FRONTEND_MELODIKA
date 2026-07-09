import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';

export function AuthLink({ textHelper, textAction, onPress }) {
  return (
    <View style={styles.container}>
      <Text style={styles.textHelper}>{textHelper}</Text>
      
      {/* Nuestro Súper-Botón actuando como link */}
      <Button 
        title={textAction} 
        variant="link" 
        onPress={onPress} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 10 },
  textHelper: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 14 },
});