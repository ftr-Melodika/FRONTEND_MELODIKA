// Archivo: prototipos/deteccion-sonido/detector.js
// Lógica pura de detección de notas: no usa el navegador ni el micrófono.
// Recibe muestras de audio (números de -1 a 1), así que puede reutilizarse en la app.
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Detector = fabrica();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const NOMBRES_ES = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
  const NOMBRES_EN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Nota MIDI de cada cuerda al aire, con la numeración de GuitarNeck (1 = la más aguda).
  const CUERDAS_AL_AIRE = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 };

  // Volumen de un bloque de audio (0 = silencio, 1 = máximo).
  function calcularVolumen(muestras) {
    let suma = 0;
    for (let i = 0; i < muestras.length; i++) suma += muestras[i] * muestras[i];
    return muestras.length ? Math.sqrt(suma / muestras.length) : 0;
  }

  function volumenADecibeles(volumen) {
    return volumen > 0 ? 20 * Math.log10(volumen) : -Infinity;
  }

  // Algoritmo YIN: busca cada cuánto se repite la onda. Se usa en lugar de buscar el pico
  // de frecuencias porque en las cuerdas graves el armónico suele sonar más que la nota real.
  // Devuelve { frecuencia, confianza } o null si no hay una nota clara.
  function detectarFrecuencia(muestras, frecuenciaMuestreo, opciones = {}) {
    const { frecuenciaMin = 70, frecuenciaMax = 1400, umbral = 0.15 } = opciones;
    const tauMin = Math.max(2, Math.floor(frecuenciaMuestreo / frecuenciaMax));
    const tauMax = Math.min(Math.ceil(frecuenciaMuestreo / frecuenciaMin), Math.floor(muestras.length / 2) - 1);
    if (tauMax <= tauMin) return null;

    const ventana = muestras.length - tauMax - 1;
    const curva = new Float64Array(tauMax + 2);
    curva[0] = 1;

    // Diferencia entre la señal y ella misma desplazada, normalizada por su promedio acumulado
    let acumulado = 0;
    for (let tau = 1; tau <= tauMax + 1; tau++) {
      let diferencia = 0;
      for (let i = 0; i < ventana; i++) {
        const delta = muestras[i] - muestras[i + tau];
        diferencia += delta * delta;
      }
      acumulado += diferencia;
      curva[tau] = acumulado > 0 ? (diferencia * tau) / acumulado : 1;
    }

    // Primer valle por debajo del umbral: tomar el primero evita caer una octava más abajo
    let mejorTau = -1;
    for (let tau = tauMin; tau <= tauMax; tau++) {
      if (curva[tau] < umbral) {
        while (tau < tauMax && curva[tau + 1] < curva[tau]) tau++;
        mejorTau = tau;
        break;
      }
    }
    if (mejorTau === -1) return null;

    // Interpolación entre muestras para ganar precisión en las notas agudas
    const a = curva[mejorTau - 1];
    const b = curva[mejorTau];
    const c = curva[mejorTau + 1];
    const divisor = a - 2 * b + c;
    const ajuste = divisor !== 0 ? (0.5 * (a - c)) / divisor : 0;

    return {
      frecuencia: frecuenciaMuestreo / (mejorTau + ajuste),
      confianza: Math.max(0, 1 - b),
    };
  }

  function frecuenciaAMidi(frecuencia, la4 = 440) {
    return 69 + 12 * Math.log2(frecuencia / la4);
  }

  function midiAFrecuencia(midi, la4 = 440) {
    return la4 * Math.pow(2, (midi - 69) / 12);
  }

  function describirMidi(midi) {
    const indice = ((midi % 12) + 12) % 12;
    const octava = Math.floor(midi / 12) - 1;
    return { midi, nombre: NOMBRES_ES[indice], cifrado: `${NOMBRES_EN[indice]}${octava}`, octava };
  }

  // Nota más cercana a una frecuencia y cuántos cents está desafinada (100 cents = 1 semitono).
  function frecuenciaANota(frecuencia, la4 = 440) {
    const exacto = frecuenciaAMidi(frecuencia, la4);
    const midi = Math.round(exacto);
    return { ...describirMidi(midi), cents: Math.round((exacto - midi) * 100), frecuencia };
  }

  // Nota que debería sonar en una cuerda (1 a 6) y traste (0 = al aire).
  function notaDeCuerdaYTraste(cuerda, traste) {
    const alAire = CUERDAS_AL_AIRE[Number(cuerda)];
    if (alAire === undefined) return null;
    return describirMidi(alAire + Number(traste));
  }

  // Compara lo que suena con lo esperado, incluida la octava.
  function evaluarNota(frecuencia, midiEsperado, toleranciaCents = 50, la4 = 440) {
    const cents = (frecuenciaAMidi(frecuencia, la4) - midiEsperado) * 100;
    return { correcta: Math.abs(cents) <= toleranciaCents, cents: Math.round(cents) };
  }

  // Filtra lecturas sueltas erróneas (como el golpe de la púa) con la mediana de las últimas.
  function crearEstabilizador(cantidad = 5) {
    let lecturas = [];
    return {
      agregar(frecuencia) {
        lecturas.push(frecuencia);
        if (lecturas.length > cantidad) lecturas.shift();
        const validas = lecturas.filter((f) => f !== null).sort((x, y) => x - y);
        if (validas.length <= cantidad / 2) return null;
        return validas[Math.floor(validas.length / 2)];
      },
      reiniciar() {
        lecturas = [];
      },
    };
  }

  return {
    calcularVolumen,
    volumenADecibeles,
    detectarFrecuencia,
    frecuenciaANota,
    midiAFrecuencia,
    notaDeCuerdaYTraste,
    evaluarNota,
    crearEstabilizador,
  };
});
