// Archivo: src/components/FormScroll.js
// ScrollView para formularios: cuando aparece el teclado, deja espacio abajo y sube solo hasta que
// el campo que se está escribiendo queda a la vista (con la app de borde a borde el teclado no
// empuja la pantalla, y en horizontal ocupa casi la mitad).
import { useCallback, useEffect, useRef } from 'react';
import { Dimensions, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useAlturaTeclado } from '../hooks/useAlturaTeclado';

const MARGEN = 24; // Aire entre el campo y el teclado
const ESPERA_MS = 150; // Para medir cuando el espacio del teclado ya se sumó

const oyentes = new Set();
// Los campos avisan acá cuando reciben el foco (ver InputField): sirve cuando se pasa de un campo a
// otro con el teclado ya abierto
export function avisarFoco() {
  oyentes.forEach((oyente) => oyente());
}

export const FormScroll = ({ contentContainerStyle, children, ...rest }) => {
  const estilo = StyleSheet.flatten(contentContainerStyle) || {};
  const ref = useRef(null);
  const posicion = useRef(0);
  const alturaTeclado = useAlturaTeclado();
  const alturaRef = useRef(0);
  alturaRef.current = alturaTeclado;

  const asegurarVisible = useCallback(() => {
    const campo = TextInput.State.currentlyFocusedInput?.();
    if (!campo || !ref.current || alturaRef.current === 0) return;
    campo.measureInWindow((x, y, ancho, alto) => {
      const limite = Dimensions.get('window').height - alturaRef.current - MARGEN;
      const sobra = y + alto - limite;
      if (sobra > 0) ref.current?.scrollTo({ y: posicion.current + sobra, animated: true });
    });
  }, []);

  // Un solo temporizador: teclado recién abierto y campo nuevo suelen llegar juntos
  const espera = useRef(null);
  const programar = useCallback(() => {
    clearTimeout(espera.current);
    espera.current = setTimeout(asegurarVisible, ESPERA_MS);
  }, [asegurarVisible]);

  // Teclado recién abierto
  useEffect(() => {
    if (alturaTeclado > 0) programar();
  }, [alturaTeclado, programar]);

  // Campo nuevo con el teclado ya abierto
  useEffect(() => {
    oyentes.add(programar);
    return () => {
      oyentes.delete(programar);
      clearTimeout(espera.current);
    };
  }, [programar]);

  return (
    <ScrollView
      ref={ref}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
      onScroll={(e) => { posicion.current = e.nativeEvent.contentOffset.y; }}
      {...rest}
      contentContainerStyle={[estilo, { paddingBottom: (estilo.paddingBottom ?? 0) + alturaTeclado }]}
    >
      {children}
    </ScrollView>
  );
};
