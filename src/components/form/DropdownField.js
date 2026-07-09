// Archivo: src/components/form/DropdownField.js
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { SelectField } from '../SelectField';
import { useDropdown } from '../../hooks/useDropdown';

const DropdownOptionsList = ({ options, value, onSelect, anim }) => {
  const maxDropdownHeight = options.length * 40; // Altura aproximada por opción
  
  return (
    <Animated.View style={[styles.dropdownBox, { 
      height: anim.interpolate({ inputRange: [0, 1], outputRange: [0, maxDropdownHeight] }), 
      opacity: anim 
    }]}>
      {options.map((option) => (
        <TouchableOpacity key={option.value} onPress={() => onSelect(option.value)} style={styles.dropdownOption}>
          <Text style={[styles.dropdownText, option.value === value && styles.dropdownTextSelected]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
};

export function DropdownField({ options, value, onSelect, label }) {
  const { isOpen, anim, toggle, close } = useDropdown();

  const handleSelect = (selectedValue) => {
    close(() => onSelect(selectedValue));
  };

  return (
    <View style={styles.selectContainer}>
      <SelectField label={label} value={value} onPress={toggle} isOpen={isOpen} />
      
      <DropdownOptionsList 
        options={options} 
        value={value} 
        onSelect={handleSelect} 
        anim={anim} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  selectContainer: { width: '100%', position: 'relative', marginBottom: 12 },
  dropdownBox: { position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', zIndex: 10 },
  dropdownOption: { paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0, 0, 0, 0.05)' },
  dropdownText: { fontSize: 14, color: '#333' },
  dropdownTextSelected: { color: '#b28cff', fontWeight: 'bold' },
});