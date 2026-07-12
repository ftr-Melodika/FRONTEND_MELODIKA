// Archivo: src/components/form/DatePickerField.js
import { useState } from 'react';
import { View, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SelectField } from '../SelectField';

export function DatePickerField({ onDateChange }) {
  const [date, setDate] = useState(new Date(2008, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthdayLabel, setBirthdayLabel] = useState('Seleccionar fecha de nacimiento');
  
  const onChangeDate = (event, selectedDate) => {
    // Solo cerramos si el usuario seleccionó una fecha (evita bugs en iOS al cancelar)
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate && event.type !== "dismissed") {
      setDate(selectedDate);
      
      const dia = String(selectedDate.getDate()).padStart(2, '0');
      const mes = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const anio = selectedDate.getFullYear();
      setBirthdayLabel(`${dia}/${mes}/${anio}`);
      
      onDateChange(`${anio}-${mes}-${dia}`);
      
      if(Platform.OS === 'ios') {
          setShowDatePicker(false);
      }
    } else if (event.type === "dismissed") {
       setShowDatePicker(false); 
    }
  };

  return (
    <View style={{ width: '100%', marginBottom: 12, position: 'relative' }}>
      <SelectField
        label={birthdayLabel !== 'Seleccionar fecha de nacimiento' ? birthdayLabel : 'Fecha de nacimiento'}
        value={birthdayLabel !== 'Seleccionar fecha de nacimiento' ? birthdayLabel : ''}
        onPress={() => setShowDatePicker(true)}
        isOpen={showDatePicker}
      />
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'} // Mejor renderizado
          maximumDate={new Date()}
          onChange={onChangeDate}
          style={{ alignSelf: 'center', backgroundColor: 'transparent' }} // Intenta centrarlo
        />
      )}
    </View>
  );
}