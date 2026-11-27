// Archivo: src/components/MedidorDeRuido.js
// Mide el ruido del lugar mientras se navega por los menús. No dibuja nada.
// Va aparte del navegador para que sus cambios no vuelvan a dibujar las pantallas.
import { useEffect, useState } from 'react';
import { useRuidoAmbiente } from '../hooks/useRuidoAmbiente';
import { puedeMedirEnPantalla } from '../utils/ruidoAmbiente';

export function MedidorDeRuido({ navigationRef, navegacionLista }) {
  const [medir, setMedir] = useState(false);

  useEffect(() => {
    if (!navegacionLista) return undefined;
    const revisar = () => setMedir(puedeMedirEnPantalla(navigationRef.getCurrentRoute()));
    revisar();
    return navigationRef.addListener('state', revisar);
  }, [navigationRef, navegacionLista]);

  useRuidoAmbiente(medir);
  return null;
}
