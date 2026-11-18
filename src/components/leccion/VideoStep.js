// Archivo: src/components/leccion/VideoStep.js
// El video de una lección, de YouTube, reproducido dentro de la app. En modo zurdo (ver useZurdo)
// se ve como en un espejo, para que la mano del profesor coincida con la del alumno.
// Si el video no se puede ver acá (o en web, donde no hay WebView), se abre en YouTube.
import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Linking, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { TextoConIcono } from '../icono/Icono';
import { Button } from '../Button';
import { useZurdo } from '../../hooks/useZurdo';

// YouTube no deja reproducir un video incrustado en una página sin origen (da "error 153"):
// el reproductor va dentro de una página propia con esta dirección de base
const ORIGEN = 'https://melodika.app';

// Solo letras, números, guion y guion bajo: el id va dentro del HTML
const idSeguro = (id) => String(id || '').replace(/[^a-zA-Z0-9_-]/g, '');

// El reproductor ocupa toda la página. Espejado, se da vuelta el reproductor entero (es de otro
// dominio: no se puede espejar solo la imagen sin los controles).
function paginaDelVideo(videoId, espejado) {
  const id = idSeguro(videoId);
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}
iframe{position:absolute;inset:0;width:100%;height:100%;border:0;${espejado ? 'transform:scaleX(-1);' : ''}}</style></head>
<body><iframe src="https://www.youtube.com/embed/${id}?playsinline=1&rel=0&modestbranding=1&origin=${encodeURIComponent(ORIGEN)}"
allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></body></html>`;
}

export const VideoStep = ({ videoId, title, onNext }) => {
  const { height } = useWindowDimensions();
  const zurdo = useZurdo();
  const [fallo, setFallo] = useState(false);
  // El video se achica en pantallas bajas para que el botón de abajo siempre se vea
  const alto = Math.round(Math.min(220, Math.max(120, height * 0.5)));
  const openYouTube = () => {
    Linking.openURL(`https://www.youtube.com/watch?v=${idSeguro(videoId)}`);
  };

  const enLaApp = Platform.OS !== 'web' && !fallo;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {title && <Text style={styles.title}>{title}</Text>}
        {enLaApp ? (
          <View style={[styles.card, { height: alto, maxWidth: Math.min(500, (alto * 16) / 9) }]}>
            <WebView
              source={{ html: paginaDelVideo(videoId, zurdo), baseUrl: ORIGEN }}
              style={styles.web}
              allowsInlineMediaPlayback
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              // El video no debe navegar a otra página dentro de la app (ej. tocar el logo de YouTube)
              onShouldStartLoadWithRequest={(req) => {
                const permitida = req.url.startsWith(ORIGEN) || req.url.startsWith('about:') || req.url.includes('youtube.com/embed');
                if (!permitida && req.isTopFrame !== false) {
                  Linking.openURL(req.url);
                  return false;
                }
                return true;
              }}
              onError={() => setFallo(true)}
              accessibilityLabel={zurdo ? 'Video de la lección, espejado' : 'Video de la lección'}
            />
          </View>
        ) : (
          <TouchableOpacity onPress={openYouTube} style={styles.card}>
            <Image
              source={{ uri: `https://img.youtube.com/vi/${idSeguro(videoId)}/hqdefault.jpg` }}
              style={[styles.thumbnail, { height: alto }]}
            />
            <View style={styles.overlay}>
              <TextoConIcono nombre="play" tamano={20} style={styles.playText}>Reproducir video</TextoConIcono>
            </View>
          </TouchableOpacity>
        )}
        {enLaApp && (
          <TouchableOpacity onPress={openYouTube} style={styles.enlace} accessibilityRole="link">
            <Text style={styles.enlaceTexto}>
              ¿No se ve? Abrir en YouTube{zurdo ? ' (sin espejar)' : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          title="Ya lo vi, seguir"
          iconoDerecha="adelante"
          onPress={onNext}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#fff' },
  card: { borderRadius: 12, overflow: 'hidden', position: 'relative', backgroundColor: '#000', width: '100%', maxWidth: 500 },
  web: { flex: 1, backgroundColor: '#000' },
  thumbnail: { width: '100%', opacity: 0.8 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  playText: { color: '#fff', fontSize: 18, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 8 },
  enlace: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 8 },
  enlaceTexto: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textDecorationLine: 'underline' },
  footer: { width: '100%', paddingTop: 10 }
});
