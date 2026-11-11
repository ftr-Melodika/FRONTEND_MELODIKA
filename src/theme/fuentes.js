// Archivo: src/theme/fuentes.js
// 'serif' solo existe en Android. En iOS es una familia desconocida: React Native lanza
// "Unrecognized font family 'serif'" y en Expo Go la app se cae con la pantalla roja.
import { Platform } from 'react-native';

export const FUENTE_TITULO = Platform.select({ ios: 'Georgia', default: 'serif' });
