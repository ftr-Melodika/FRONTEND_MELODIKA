// Archivo: src/components/practica/estilos.js
// Estilos comunes a los modos de la pantalla de Práctica
import { StyleSheet } from 'react-native';
import { FUENTE_TITULO } from '../../theme/fuentes';

export const VERDE = '#a3fba3';

export const estilosPractica = StyleSheet.create({
  fila: { flex: 1, flexDirection: 'row', gap: 20 },
  columnaMastil: { flex: 1.6, justifyContent: 'center' },
  columnaLateral: { flex: 1 },
  lateralContenido: { flexGrow: 1, justifyContent: 'center', paddingBottom: 10 },

  consigna: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  ayuda: { color: 'rgba(255,255,255,0.65)', fontSize: 12, textAlign: 'center' },
  pregunta: { color: '#fff', fontSize: 20, fontFamily: FUENTE_TITULO, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },

  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: { flexGrow: 1, flexBasis: '45%', paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  opcionCorrecta: { backgroundColor: 'rgba(50,205,50,0.35)', borderColor: VERDE },
  opcionError: { backgroundColor: 'rgba(255,126,141,0.3)', borderColor: '#ff7e8d' },
  opcionTexto: { color: '#fff', fontSize: 17, fontWeight: 'bold' },

  resultado: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginTop: 10 },
  resultadoOk: { color: VERDE },
  resultadoMal: { color: '#ffb3bd' },

  marcadorFila: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 10 },
  marcador: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },

  // La nota pedida, bien grande
  notaGrande: { color: '#fff', fontSize: 40, fontFamily: FUENTE_TITULO, fontWeight: 'bold', textAlign: 'center' },
  detalleNota: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', marginBottom: 8 },
  botonesFila: { flexDirection: 'row', gap: 10 },
  botonMitad: { flex: 1 },
});
