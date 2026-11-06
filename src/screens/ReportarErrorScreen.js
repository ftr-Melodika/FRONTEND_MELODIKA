// Archivo: src/screens/ReportarErrorScreen.js
import { MensajeForm } from '../components/MensajeForm';

export function ReportarErrorScreen() {
  return (
    <MensajeForm
      titulo="Reportar errores"
      tipo="reporte_error"
      intro="Contanos qué estabas haciendo, qué esperabas que pasara y qué pasó en realidad."
      etiquetaCategoria="¿Dónde pasó?"
      categorias={['Lecciones', 'Perfil', 'Progreso o racha', 'Inicio de sesión', 'Otro']}
      placeholder="Describí el error paso a paso..."
      textoExito="¡Recibimos tu reporte! Gracias por avisarnos. 🐛"
    />
  );
}
