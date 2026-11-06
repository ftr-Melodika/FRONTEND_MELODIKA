// Archivo: src/components/form/DropdownField.js
// Las opciones se abren "empujando" el contenido de abajo (no flotan encima),
// así nunca quedan tapadas por los campos siguientes.
import { Icono } from '../icono/Icono';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { SelectField } from '../SelectField';
import { useDropdown } from '../../hooks/useDropDown';

const ALTO_OPCION = 42;

const DropdownOptionsList = ({ options, value, onSelect, anim }) => {
  const maxDropdownHeight = options.length * ALTO_OPCION;

  return (
    <Animated.View style={[styles.dropdownBox, {
      height: anim.interpolate({ inputRange: [0, 1], outputRange: [0, maxDropdownHeight] }),
      opacity: anim,
      marginBottom: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }),
    }]}>
      {options.map((option) => (
        <TouchableOpacity key={option.value} onPress={() => onSelect(option.value)} style={styles.dropdownOption}>
          <Text style={[styles.dropdownText, option.value === value && styles.dropdownTextSelected]}>
            {option.label}
          </Text>
          {option.value === value && <Icono nombre="check" tamano={16} color="#7d5bd6" />}
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

  const opcionElegida = options.find((o) => o.value === value);

  return (
    <View style={styles.selectContainer}>
      <SelectField label={label} value={opcionElegida?.label || value} onPress={toggle} isOpen={isOpen} />

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
  selectContainer: { width: '100%' },
  dropdownBox: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginTop: -4 },
  dropdownOption: { height: ALTO_OPCION, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(0, 0, 0, 0.05)' },
  dropdownText: { fontSize: 14, color: '#333' },
  dropdownTextSelected: { color: '#7d5bd6', fontWeight: 'bold' },
});
