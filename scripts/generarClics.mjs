// Genera los sonidos del metrónomo: assets/sonidos/clic.wav y clic-fuerte.wav (el 1 de cada compás).
// Uso: node scripts/generarClics.mjs
// Son tonos agudos y cortos (3 a 4 kHz): el detector de golpes (src/utils/ritmo.js) escucha
// solo los graves y medios, así el clic que sale del parlante no cuenta como un golpe de guitarra.
import { mkdirSync, writeFileSync } from 'node:fs';

const FRECUENCIA_MUESTREO = 44100;

function wav(muestras) {
  const datos = Buffer.alloc(muestras.length * 2);
  muestras.forEach((m, i) => datos.writeInt16LE(Math.round(Math.max(-1, Math.min(1, m)) * 32767), i * 2));
  const cabecera = Buffer.alloc(44);
  cabecera.write('RIFF', 0);
  cabecera.writeUInt32LE(36 + datos.length, 4);
  cabecera.write('WAVE', 8);
  cabecera.write('fmt ', 12);
  cabecera.writeUInt32LE(16, 16);
  cabecera.writeUInt16LE(1, 20); // PCM
  cabecera.writeUInt16LE(1, 22); // mono
  cabecera.writeUInt32LE(FRECUENCIA_MUESTREO, 24);
  cabecera.writeUInt32LE(FRECUENCIA_MUESTREO * 2, 28);
  cabecera.writeUInt16LE(2, 32);
  cabecera.writeUInt16LE(16, 34);
  cabecera.write('data', 36);
  cabecera.writeUInt32LE(datos.length, 40);
  return Buffer.concat([cabecera, datos]);
}

// Un "toc" de madera: tono agudo con un ataque de 1 ms y una caída rápida
function clic(frecuencia, volumen, ms = 35) {
  const n = Math.round((FRECUENCIA_MUESTREO * ms) / 1000);
  return Array.from({ length: n }, (_, i) => {
    const t = i / FRECUENCIA_MUESTREO;
    const ataque = Math.min(1, t / 0.001);
    const caida = Math.exp(-t / 0.008);
    return volumen * ataque * caida * (Math.sin(2 * Math.PI * frecuencia * t) + 0.3 * Math.sin(2 * Math.PI * frecuencia * 1.5 * t));
  });
}

const carpeta = new URL('../assets/sonidos/', import.meta.url);
mkdirSync(carpeta, { recursive: true });
writeFileSync(new URL('clic.wav', carpeta), wav(clic(3200, 0.6)));
writeFileSync(new URL('clic-fuerte.wav', carpeta), wav(clic(4000, 0.9)));
console.log('Listo: assets/sonidos/clic.wav y clic-fuerte.wav');
