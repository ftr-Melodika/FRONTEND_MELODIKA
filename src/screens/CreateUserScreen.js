import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Alert, ActivityIndicator, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Background } from '../components/Background';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { SelectField } from '../components/SelectField';
import { ENDPOINTS } from '../config/api';

const GENDER_OPTIONS = [
  { label: 'Masculino', value: 'Masculino' },
  { label: 'Femenino', value: 'Femenino' },
  { label: 'No binario', value: 'No binario' },
];

export function CreateUserScreen({ route, navigation }) {
  const { cuenta, token } = route.params || {};

  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [pais, setPais] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [gender, setGender] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState(new Date(2008, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthdayLabel, setBirthdayLabel] = useState('Seleccionar fecha de nacimiento');
  const [birthdayISO, setBirthdayLabelISO] = useState('');

  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      const dia = String(selectedDate.getDate()).padStart(2, '0');
      const mes = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const anio = selectedDate.getFullYear();
      setBirthdayLabel(`${dia}/${mes}/${anio}`);
      setBirthdayLabelISO(`${anio}-${mes}-${dia}`);
    }
  };

  const handleCreateUser = async () => {
    if (!nombre.trim() || !username.trim() || !birthdayISO) {
      return Alert.alert('Error', 'Por favor completá el nombre, usuario y fecha de nacimiento.');
    }
    if (!token || !cuenta?.id) {
      return Alert.alert('Error de sesión', 'No se encontró la cuenta activa. Volvé a iniciar sesión.');
    }

    setLoading(true);

    try {
      // Objeto limpio, exacto y directo al punto
      const requestBody = {
        cuenta_id: cuenta.id,
        nombre: nombre.trim(),
        username: username.trim(),
        fecha_nacimiento: birthdayISO,
        pais: pais.trim() || null,
        foto: fotoUrl.trim() || null,
        genero: gender || null,
      };

      const response = await fetch(ENDPOINTS.crearPerfil, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Error al crear el perfil');
      }

      // Tu backend devuelve success: true y data: nuevoPerfil
      const nuevoPerfil = data.data;

      Alert.alert('¡Excelente!', `El perfil de ${nuevoPerfil.nombre} está listo.`);
      navigation.replace('Home', { cuenta, perfil: nuevoPerfil, token });

    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: dropdownOpen ? 0 : 1,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
    setDropdownOpen(!dropdownOpen);
  };

  const selectGender = (value) => {
    setGender(value);
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.ease),
      useNativeDriver: false,
    }).start(() => setDropdownOpen(false));
  };

  return (
    <Background style={styles.background}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.glassCard}>
          <Text style={styles.title}>Crear usuario</Text>
          <InputField placeholder="Nombre completo" value={nombre} onChangeText={setNombre} />
          <InputField placeholder="Nombre de usuario" value={username} onChangeText={setUsername} />
          <InputField placeholder="País" value={pais} onChangeText={setPais} />
          <InputField placeholder="Foto (URL opcional)" value={fotoUrl} onChangeText={setFotoUrl} />

          <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
            <Text style={[styles.datePickerText, birthdayISO !== '' && styles.datePickerTextSelected]}>{birthdayLabel}</Text>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>

          {showDatePicker && <DateTimePicker value={date} mode="date" display="default" maximumDate={new Date()} onChange={onChangeDate} />}

          <View style={styles.selectContainer}>
            <SelectField label="Género (opcional)" value={gender} onPress={toggleDropdown} isOpen={dropdownOpen} />
            <Animated.View style={[styles.dropdownBox, { height: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0, GENDER_OPTIONS.length * 36] }), opacity: dropdownAnim }]}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity key={option.value} onPress={() => selectGender(option.value)} style={styles.dropdownOption}>
                  <Text style={[styles.dropdownText, option.value === gender && styles.dropdownTextSelected]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </View>

          {loading ? <ActivityIndicator size="large" color="#b28cff" style={{ marginVertical: 10 }} /> : <Button title="Crear usuario" onPress={handleCreateUser} />}
        </View>
      </ScrollView>
    </Background>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  glassCard: {
    width: '69%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },

  title: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 8,
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  datePickerButton: {
    width: '100%',
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  datePickerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  datePickerTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  calendarIcon: {
    fontSize: 16,
    opacity: 0.8,
  },
  selectContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 6,
  },
  dropdownBox: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 10,
  },
  dropdownOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  dropdownText: {
    fontSize: 13,
    color: '#333',
  },
  dropdownTextSelected: {
    color: '#6b5ce7',
    fontWeight: 'bold',
  },
});