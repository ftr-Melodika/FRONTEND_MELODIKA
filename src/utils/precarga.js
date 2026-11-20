// Archivo: src/utils/precarga.js
// Imágenes que se bajan al arrancar, mientras se ve la pantalla de inicio: así el fondo ya está listo
// cuando aparece la primera pantalla (en Expo Go se descarga desde la PC y tardaba en verse).
import { Asset } from 'expo-asset';

export const IMAGEN_FONDO = require('../../assets/background.png');

export const precargarImagenes = Asset.loadAsync([IMAGEN_FONDO]).catch(() => {
  // Si falla, la imagen se carga normalmente cuando se la pide
});
