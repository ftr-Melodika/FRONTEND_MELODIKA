import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Background } from '../components/Background';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { SelectField } from '../components/SelectField';

const GENDER_OPTIONS = [
  { label: 'Masculino', value: 'Masculino' },
  { label: 'Femenino', value: 'Femenino' },
  { label: 'No binario', value: 'No binario' },
];

export function CreateUserScreen() {
  const [username, setUsername] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const handleCreateUser = () => {
    console.log('Crear usuario:', { username, birthday, gender });
  };

  const toggleDropdown = () => {
    const toValue = dropdownOpen ? 0 : 1;
    Animated.timing(dropdownAnim, {
      toValue,
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
    <Background>
      <View style={styles.glassCard}>
        <Text style={styles.title}>Crear usuario</Text>

        <InputField
          placeholder="Nombre de usuario"
          value={username}
          onChangeText={setUsername}
        />
        <InputField
          placeholder="Fecha de nacimiento"
          value={birthday}
          onChangeText={setBirthday}
        />

        <View style={styles.selectContainer}>
          <SelectField
            label="Género (opcional)"
            value={gender}
            onPress={toggleDropdown}
            isOpen={dropdownOpen}
          />

          <Animated.View
            style={[
              styles.dropdownBox,
              {
                height: dropdownAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, GENDER_OPTIONS.length * 36],
                }),
                opacity: dropdownAnim,
              },
            ]}
          >
            {GENDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => selectGender(option.value)}
                style={styles.dropdownOption}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    option.value === gender && styles.dropdownTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>

        <Button title="Crear usuario" onPress={handleCreateUser} />
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    width: '65%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 25,
    marginVertical: 15,
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
