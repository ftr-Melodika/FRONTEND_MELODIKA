// Archivo: src/utils/medidasRiff.js
// Las medidas del mástil del riff según su alto: todo crece parejo, así las notas se ven más
// grandes cuando el mástil ocupa más pantalla. Es lógica pura: se prueba en medidasRiff.test.js.

export const CUERDAS_RIFF = [6, 5, 4, 3, 2, 1]; // De arriba hacia abajo, como el mástil del resto de la app

export const ALTO_MASTIL_BASE = 186;
const NOTA_BASE = 26; // Con este tamaño las medidas de abajo valen lo que dicen
const NOTA_MAXIMA = 46;
const PROPORCION_NOTA = 0.88; // De lo que mide una cuerda de alto
const ACORDE_BASE = 48;
const GOLPE_BASE = 34; // Entra entre corchea y corchea con aire; en semicorcheas se achica
const LINEA_BASE = 56; // Dónde está la línea para tocar, desde el borde izquierdo del mástil
const PX_POR_PULSO_BASE = 110;
const ETIQUETA_BASE = 20;

export function medidasDelMastil(alto = ALTO_MASTIL_BASE) {
  const altoCuerda = alto / CUERDAS_RIFF.length;
  const tamanoNota = Math.min(NOTA_MAXIMA, Math.max(NOTA_BASE, Math.round(altoCuerda * PROPORCION_NOTA)));
  const escala = tamanoNota / NOTA_BASE;
  const etiqueta = Math.round(ETIQUETA_BASE * Math.min(escala, 1.3));
  return {
    alto,
    altoCuerda,
    tamanoNota,
    anchoAcorde: Math.round(ACORDE_BASE * escala),
    anchoGolpe: Math.round(GOLPE_BASE * escala),
    xLinea: Math.round(LINEA_BASE * escala),
    pxPorPulso: Math.round(PX_POR_PULSO_BASE * escala),
    etiqueta,
    anchoEtiqueta: etiqueta + 2,
    // Altura del centro de una cuerda dentro del mástil
    centroCuerda: (cuerda) => altoCuerda * (CUERDAS_RIFF.indexOf(cuerda) + 0.5),
  };
}
