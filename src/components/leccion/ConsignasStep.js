// Archivo: src/components/leccion/ConsignasStep.js
// Varias prácticas seguidas dentro de la misma clase (practica.tipo = 'consignas').
// Cada consigna se juega con la pantalla de práctica que le toque; al terminar una se pasa a la
// siguiente y solo la última termina la clase. "Saltear" saltea la clase entera.
// `renderPractica(leccion, props)` dibuja una práctica común (lo pasa PracticeStep).
import { Fragment, useEffect, useState } from 'react';

export function ConsignasStep({ consignas, renderPractica, onBack, onFinish, finishing, onInstruccion, reinicio }) {
  const [indice, setIndice] = useState(0);
  const consigna = consignas[indice];
  const esUltima = indice === consignas.length - 1;

  // La barra lateral muestra la instrucción de la consigna actual
  useEffect(() => {
    onInstruccion?.(consigna.instruccion);
    return () => onInstruccion?.(null);
  }, [consigna]);

  const alTerminar = (opciones) => (opciones?.omitida || esUltima ? onFinish(opciones) : setIndice(indice + 1));
  const alVolver = indice > 0 ? () => setIndice(indice - 1) : onBack;

  // La key reinicia la práctica (y vuelve a armar notas al azar) en cada consigna y al tocar Reiniciar
  return <Fragment key={`${indice}-${reinicio}`}>{renderPractica(consigna, { onBack: alVolver, onFinish: alTerminar, finishing })}</Fragment>;
}
