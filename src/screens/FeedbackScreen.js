// Archivo: src/screens/FeedbackScreen.js
import { MensajeForm } from '../components/MensajeForm';

export function FeedbackScreen() {
  return (
    <MensajeForm
      titulo="Dar feedback"
      tipo="feedback"
      intro="¿Qué te gusta de Melodika y qué mejorarías? Leemos todas las opiniones para decidir qué hacer después."
      etiquetaCategoria="¿Sobre qué es tu comentario?"
      categorias={['Lecciones', 'Práctica', 'Diseño', 'Otro']}
      placeholder="Contanos tu opinión..."
      textoExito="¡Gracias por tu opinión!"
    />
  );
}
