// Archivo: src/hooks/useRiff.js
// El riff en movimiento: lleva el reloj del recorrido, escucha qué nota suena y marca cada nota
// como acertada o errada cuando pasa por la línea. En la primera el recorrido se frena hasta que se
// toque bien y recién ahí avanza a tempo. Si se erra mucho, vuelve atrás; si se traba
// siempre en el mismo acorde (o nota), se frena para practicarlo aparte y después sigue desde ahí.
// En las canciones cada "nota" del recorrido es un acorde (tipo 'acorde', con sus midis).
// El audio se procesa en el celular: no se guarda ni se envía a ningún lado.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMicrofono } from './useMicrofono';
import { crearDetector, compararAcorde, compararNota } from '../utils/deteccionSonido';
import { ruidoMedido } from '../utils/ruidoAmbiente';
import { armarRecorrido, decidirTropiezo, enVentana, esperaLaPrimera, finDeVentana, olvidarTropiezo, resumir, MS_DESPUES } from '../utils/riff';

// Antes de la primera nota: el detector mide el ruido del lugar (~1,5 s) y las notas se acercan
export const MS_ENTRADA = 2500;
// Después de volver atrás, cuánto antes de la nota se retoma (para verla venir)
export const MS_ENTRADA_RETOMAR = 2000;
// Al reanudar tras una pausa, cuánto antes de donde se pausó se retoma (para ver venir las notas)
const MS_RETOMAR_PAUSA = 1500;
const MS_AVISO_RETROCESO = 1300; // Lo que se ve el aviso "volvamos" antes de retomar
const MS_RELOJ = 30;
const MS_CAMBIO_MICROFONO = 400; // Al volver de practicar, deja que la práctica suelte el micrófono
const LECTURAS_RECIENTES = 4; // Un rasgueo hace sonar las cuerdas de a una: se juntan las últimas lecturas

// fase: 'listo' | 'preparando' (abriendo el micrófono) | 'tocando' | 'retrocediendo'
//   | 'practicando' (frenado: se practica `practica.nota` aparte, con su propio micrófono)
//   | 'pausado' (frenado donde estaba, sin micrófono: reanudar() sigue desde ahí) | 'terminado'
// tramo: { desde (ms del recorrido), inicio (Date.now() en que se pasa por `desde`) } para animar
// resultados: true / false / null por nota
export function useRiff(riff) {
  const recorrido = useMemo(() => armarRecorrido(riff), [riff]);
  const [fase, setFase] = useState('listo');
  const [tramo, setTramo] = useState(null);
  const [resultados, setResultados] = useState(() => recorrido.notas.map(() => null));
  const [retrocesos, setRetrocesos] = useState(0);
  // { nota, desde }: el acorde (o nota) que se practica y el índice desde donde se retoma
  const [practica, setPractica] = useState(null);

  // Cambian decenas de veces por segundo: no deben provocar renders
  const detector = useRef(null);
  const reloj = useRef(null); // { desde, inicio }: posición del recorrido = desde + (ahora - inicio)
  const marcas = useRef(recorrido.notas.map(() => null));
  const muestras = useRef(0);
  const desfase = useRef(null);
  const enMarcha = useRef(false);
  const esperando = useRef(false); // Frenado en la primera nota (ver esperaLaPrimera): el reloj no corre
  const recientes = useRef([]);
  const practicaActual = useRef(null); // Lo mismo que `practica`, para no depender del render
  const esperaVolver = useRef(null); // El regreso de la práctica, por si se para antes
  const desdePendiente = useRef(null); // Desde dónde arranca cuando el micrófono esté listo
  const retomarEn = useRef(null); // Desde dónde sigue al reanudar una pausa (ms del recorrido)
  const errores = useRef({}); // Por acorde o nota (ver claveDeNota)
  const retrocesosPorClave = useRef({});

  const posicion = (ahora = Date.now()) => (reloj.current ? reloj.current.desde + (ahora - reloj.current.inicio) : -Infinity);

  const publicar = () => setResultados([...marcas.current]);

  const suena = (nota, lectura) => (nota.tipo === 'acorde'
    ? compararAcorde(lectura.fundamentales, nota.midis, recientes.current.flat()).correcta
    : compararNota(lectura.fundamentales, nota.midi).correcta);

  const procesarBuffer = ({ data, sampleRate, channels }) => {
    if (!detector.current) return;
    const crudo = new Float32Array(data);
    const canales = channels || 1;
    // Reloj del micrófono: las muestras recibidas (ver useRitmo: el timestamp de expo-audio falla en iOS)
    const llegada = Date.now();
    muestras.current += crudo.length / canales;
    const fin = (muestras.current / sampleRate) * 1000;
    if (desfase.current === null || llegada - fin < desfase.current) desfase.current = llegada - fin;
    const ahora = fin + desfase.current;

    const lectura = detector.current.agregarBuffer(crudo, canales, sampleRate, ahora);
    if (!lectura || lectura.calibrando) return;
    recientes.current.push(lectura.fundamentales || []);
    if (recientes.current.length > LECTURAS_RECIENTES) recientes.current.shift();
    if (!enMarcha.current || !lectura.fundamentales?.length) return;

    // Frenado en la primera: solo se escucha esa y, al sonar bien, el recorrido sigue desde ella
    if (esperando.current) {
      const primera = recorrido.notas[0];
      if (!suena(primera, lectura)) return;
      marcas.current[0] = true;
      publicar();
      arrancarDesde(primera.t);
      return;
    }

    // ¿La nota que suena es la de alguna nota que está pasando por la línea?
    const t = posicion(ahora);
    let cambio = false;
    recorrido.notas.forEach((nota, i) => {
      if (marcas.current[i] !== null || !enVentana(nota, t)) return;
      if (suena(nota, lectura)) {
        marcas.current[i] = true;
        cambio = true;
      }
    });
    if (cambio) publicar();
  };

  // Mientras se practica aparte, la práctica usa su propio micrófono
  const estado = useMicrofono(procesarBuffer, fase !== 'listo' && fase !== 'terminado' && fase !== 'practicando' && fase !== 'pausado');

  const arrancarDesde = (desde) => {
    esperando.current = false;
    reloj.current = { desde, inicio: Date.now() };
    enMarcha.current = true;
    setTramo({ ...reloj.current });
    setFase('tocando');
  };

  // Abre el micrófono de cero y arranca desde `desde` (ms del recorrido) cuando escuche
  const preparar = (desde) => {
    // El objetivo del detector no importa: se usan las notas oídas (fundamentales) de cada lectura
    const primera = recorrido.notas[0];
    detector.current = crearDetector({ tipo: 'nota', nombre: '', posiciones: [], midis: [primera.midi ?? primera.midis[0]] }, { ruido: ruidoMedido() });
    recientes.current = [];
    muestras.current = 0;
    desfase.current = null;
    reloj.current = null;
    enMarcha.current = false;
    esperando.current = false;
    desdePendiente.current = desde;
    setFase('preparando');
  };

  const empezar = () => {
    marcas.current = recorrido.notas.map(() => null);
    publicar();
    setRetrocesos(0);
    practicaActual.current = null;
    setPractica(null);
    errores.current = {};
    retrocesosPorClave.current = {};
    preparar(-MS_ENTRADA);
  };

  // Termina la práctica (bien hecha o salteada) y vuelve a donde estaba, con tiempo para verlo venir
  const volverDePracticar = () => {
    // Puede llegar dos veces (el botón y el regreso automático): solo cuenta la primera
    const actual = practicaActual.current;
    if (!actual) return;
    practicaActual.current = null;
    olvidarTropiezo(actual.nota, errores.current, retrocesosPorClave.current);
    const desde = recorrido.notas[actual.desde].t - MS_ENTRADA;
    setPractica(null);
    esperaVolver.current = setTimeout(() => preparar(desde), MS_CAMBIO_MICROFONO);
  };

  // Frena donde está, sin perder los aciertos: reanudar() sigue desde ahí. Solo en pleno riff (o abriendo el micrófono)
  const pausar = () => {
    if (fase !== 'tocando' && fase !== 'preparando') return;
    // Frenado en la primera nota el reloj no corre: la posición es la de esa nota
    const enPantalla = esperando.current ? recorrido.notas[0].t : posicion();
    const t = fase === 'tocando' ? enPantalla : desdePendiente.current ?? -MS_ENTRADA;
    esperando.current = false;
    retomarEn.current = fase === 'tocando' ? t - MS_RETOMAR_PAUSA : t;
    enMarcha.current = false;
    detector.current = null;
    reloj.current = null;
    setTramo({ desde: t, inicio: null }); // Quieto donde quedó
    setFase('pausado');
  };

  const reanudar = () => {
    if (fase !== 'pausado') return;
    preparar(retomarEn.current ?? -MS_ENTRADA);
  };

  const detener = () => {
    clearTimeout(esperaVolver.current);
    enMarcha.current = false;
    esperando.current = false;
    detector.current = null;
    reloj.current = null;
    setTramo(null);
    practicaActual.current = null;
    setPractica(null);
    setFase('listo');
  };

  useEffect(() => () => clearTimeout(esperaVolver.current), []);

  // Cuando el micrófono ya escucha, arranca el recorrido
  useEffect(() => {
    if (fase === 'preparando' && estado === 'escuchando') arrancarDesde(desdePendiente.current ?? -MS_ENTRADA);
  }, [fase, estado]);

  // Las notas que pasaron sin sonar son errores; si hay muchos, se vuelve atrás
  useEffect(() => {
    if (fase !== 'tocando') return undefined;
    const intervalo = setInterval(() => {
      const t = posicion();
      if (esperaLaPrimera(recorrido.notas, marcas.current, t)) {
        esperando.current = true;
        reloj.current = null;
        setTramo({ desde: recorrido.notas[0].t, inicio: null }); // Quieto con la primera nota en la línea
        return;
      }
      const nuevosErrores = [];
      recorrido.notas.forEach((nota, i) => {
        if (marcas.current[i] === null && t > finDeVentana(nota)) {
          marcas.current[i] = false;
          nuevosErrores.push(i);
        }
      });
      if (nuevosErrores.length) {
        publicar();
        const tropiezo = decidirTropiezo(recorrido.notas, marcas.current, nuevosErrores, errores.current, retrocesosPorClave.current);
        if (tropiezo) {
          // Se borran los resultados desde ahí: esas notas se vuelven a tocar
          const volverA = tropiezo.desde;
          enMarcha.current = false;
          for (let i = volverA; i < marcas.current.length; i++) marcas.current[i] = null;
          publicar();
          setTramo({ desde: t, inicio: null }); // Quieto donde quedó
          if (tropiezo.accion === 'practicar') {
            // Se suelta el micrófono para que lo use la práctica
            detector.current = null;
            reloj.current = null;
            practicaActual.current = { nota: tropiezo.nota, desde: volverA };
            setPractica(practicaActual.current);
            setFase('practicando');
            return;
          }
          setRetrocesos((r) => r + 1);
          setFase('retrocediendo');
          setTimeout(() => {
            if (reloj.current) arrancarDesde(recorrido.notas[volverA].t - MS_ENTRADA_RETOMAR);
          }, MS_AVISO_RETROCESO);
          return;
        }
      }
      if (t > recorrido.duracion + MS_DESPUES) {
        enMarcha.current = false;
        detector.current = null;
        setFase('terminado');
      }
    }, MS_RELOJ);
    return () => clearInterval(intervalo);
  }, [fase, recorrido]);

  const resumen = useMemo(() => resumir(resultados), [resultados]);
  return { fase, estado, empezar, detener, pausar, reanudar, recorrido, tramo, resultados, resumen, retrocesos, practica, volverDePracticar };
}
