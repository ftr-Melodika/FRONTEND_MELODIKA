// Archivo: src/context/VistaLeccionContext.js
// Cómo se está viendo la práctica de una clase. Lo arma LeccionScreen y lo leen las prácticas
// (mástil, riff, canciones) sin que haya que pasarlo de componente en componente:
// - inmersivo: sin botones, con el mástil lo más grande posible (el menú de pausa está en LeccionScreen).
// - pausado: el menú de pausa está abierto, así que el micrófono y el riff se frenan.
// Fuera de una clase (la sección Canciones, por ejemplo) no hay proveedor y vale el valor de siempre.
import { createContext, useContext } from 'react';

export const VISTA_NORMAL = { inmersivo: false, pausado: false };

export const VistaLeccionContext = createContext(VISTA_NORMAL);

export const useVistaLeccion = () => useContext(VistaLeccionContext);
