// Archivo: src/screens/ContactoScreen.js
import { MensajeForm } from '../components/MensajeForm';

export function ContactoScreen() {
  return (
    <MensajeForm
      titulo="Contacto"
      tipo="contacto"
      intro="¿Tenés una consulta sobre tu cuenta o sobre Melodika? Escribinos desde acá."
      etiquetaCategoria="Motivo de la consulta"
      categorias={['Mi cuenta', 'Cursos', 'Otra consulta']}
      placeholder="Escribí tu consulta..."
      textoExito="¡Recibimos tu consulta! 📧"
    />
  );
}
