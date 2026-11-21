@AGENTS.md

@AGENTS.md

# Reglas para Claude en FRONTEND_MELODIKA

Melodika es una app para aprender guitarra: cursos con lecciones prácticas, afinador, canciones, rachas, amigos, grupos y rankings. Este repo es la app (Expo + React Native, en JavaScript, sin TypeScript). Consume la API de BACKEND_MELODIKA, que tiene su propio CLAUDE.md con el contrato de respuestas.

## 1. Cómo comunicarte (prioridad máxima)
Quien lee puede no saber programar. Al terminar cada edición, responder SIEMPRE en dos bloques, en este orden:

**En palabras simples**: qué se hizo y para qué, con analogías cotidianas, sin jerga (si hay que usar un término técnico, explicarlo en una frase).

**Detalle técnico**: archivos tocados, decisiones tomadas y por qué, riesgos, y cómo probarlo (en qué pantalla y qué tocar).

## 2. Hallazgos durante una tarea (avisar y preguntar)
Si mientras haces una tarea ves algo mal modularizado, mal estructurado o con errores **que no es parte de lo pedido**:
- No lo arregles ni te desvíes de la tarea.
- Termina lo pedido y, al final (o con AskUserQuestion si te bloquea), cuéntalo: qué viste en lenguaje simple, qué riesgo tiene y qué propones.
- Pregunta si se corrige ahora o después.

## 3. Stack y versiones
- Expo SDK 58, React Native 0.88, React 19.3. Antes de usar una API de Expo, revisar la documentación de la versión 58 (ver AGENTS.md): muchas cambiaron.
- Navegación: React Navigation 7 (`native-stack`), todo en `src/navigation/AppNavigator.js`.
- Datos del servidor: TanStack Query 5 con caché persistida + axios.
- La app es horizontal (`"orientation": "landscape"` en `app.json`). Diseñar cada pantalla para pantalla apaisada.
- Corre en iOS, Android y web (`react-native-web`). Lo que dependa de la plataforma va con `Platform.select`.

## 4. Dónde va cada cosa
| Carpeta | Qué contiene |
| --- | --- |
| `src/screens/` | Una pantalla por archivo (`XxxScreen.js`). Solo arman la vista y usan hooks. |
| `src/components/` | Piezas reutilizables, agrupadas por tema (`leccion/`, `grupos/`, `form/`, `practica/`…). |
| `src/hooks/` | Lógica con estado (`useAfinador`, `useRitmo`, `useZurdo`…) y consultas al servidor (`useConsultas.js`). |
| `src/services/` | Llamadas al backend, una por módulo (`gruposService`, `perfilesService`…). |
| `src/api/` | Cliente axios con tokens (`axiosClient`, `tokenSesion`) y caché (`queryClient`). |
| `src/config/api.js` | URL del backend y todos los `ENDPOINTS`. |
| `src/context/` | Estado global: sesión (`AuthContext`) y racha (`StreakContext`). |
| `src/utils/` | Lógica pura sin React (audio, acordes, ritmo, validaciones), con sus tests. |
| `src/data/`, `src/theme/` | Datos fijos y fuentes. |

No crear carpetas nuevas si ya existe una para eso.

## 5. Cómo se piden datos al backend
Camino fijo: **pantalla → hook (`useConsultas`) → service → `axiosClient` → backend**.
- Las URLs se agregan solo en `ENDPOINTS` de `src/config/api.js`. Nunca escribir una URL suelta en una pantalla o service.
- Los services siguen el patrón de `gruposService`: `pedir()` para leer, `modificar()` para cambiar datos, `getErrorMessage()` para el texto del error. Devuelven `response.data.data` (el backend responde `{ success, message, data }`).
- Después de crear, cambiar o borrar algo, invalidar las claves de caché que correspondan (`invalidar('misGrupos', ...)`), o la pantalla va a mostrar datos viejos.
- Claves de React Query: primero el nombre del dato y después el perfil activo (`['mapa', perfilId, cursoId]`).
- Solo se guarda en el celular lo liviano (`CLAVES_PERSISTIDAS` en `queryClient.js`). No agregar ahí datos con fotos en base64 ni datos que cambian seguido.
- Si hace falta un endpoint que no existe, no inventarlo: avisar qué necesita el backend (ruta, campos, respuesta).
- `axiosClient` ya agrega el token y lo renueva. No manejar tokens a mano en pantallas ni services.

## 6. Lógica, tests y modularización
- La lógica que se pueda separar de React va en `src/utils/` como funciones puras (ej. `ritmo.js`, `acordes.js`), y se usa desde un hook.
- Cada archivo de `utils` con lógica tiene su test `nombre.test.js` con `node:test` y `node:assert` (ver `ritmo.test.js`).
- **Al crear un test nuevo, agregarlo a mano al script `test` de `package.json`**: la lista es explícita y un test que no está ahí nunca corre.
- Correr `npm test` antes de dar una tarea por terminada si se tocó algo de `utils`.
- Una responsabilidad por archivo y por función, nombres en español como el resto del código, y constantes en vez de números mágicos.

## 7. Audio y micrófono (cuidado especial)
- El audio se procesa solo en el celular: **nunca guardarlo ni enviarlo al backend**. Es una promesa al usuario (está en el permiso de micrófono de `app.json`).
- El detector de golpes (`src/utils/ritmo.js`) escucha graves y medios; el clic del metrónomo es agudo (3–4 kHz) para no contarse como golpe. Si se cambian los sonidos, regenerarlos con `node scripts/generarClics.mjs`.
- Todo lo que dibuje la guitarra o el mástil tiene que respetar el modo zurdo (`useZurdo`).

## 8. Estilos y textos
- Estilos con `StyleSheet.create` al final del archivo, como en el resto de las pantallas.
- Reusar los colores que ya usa la app (`#4c52d9` violeta principal, `#b28cff`, `#a3fba3`, `#ffb3bd`, `#ffd35c`) en vez de inventar nuevos.
- Fuente de títulos: siempre `FUENTE_TITULO` de `src/theme/fuentes.js`. Nunca `'serif'` directo: en iOS la app se cae.
- Los textos de la app van en español rioplatense con voseo ("Revisá tu conexión", "Tocá el acorde").

## 9. Configuración y seguridad
- `SERVER_URL` en `src/config/api.js` es la IP o el ngrok de cada uno. No cambiarlo salvo que se pida, y nunca commitear la IP personal de alguien en lugar de la de otro.
- En el frontend no hay secretos: la URL de Supabase es pública. Si algo necesita una clave privada, va en el backend.
- Los tokens se guardan solo desde `src/api/tokenSesion.js`: el refresh token (el que da acceso por mucho tiempo) en `expo-secure-store`, y el de acceso, que dura ~1 h, en AsyncStorage. No guardar tokens ni contraseñas en ningún otro lado.

## 10. Flujo de trabajo
- Leer el código existente antes de editar y seguir su estilo.
- Cambios mínimos y enfocados en lo pedido.
- No hacer commits ni instalar paquetes salvo que se pida. Si hace falta un paquete de Expo, usar `npx expo install <paquete>` para que quede en la versión compatible con el SDK.
- No crear las carpetas `ios/` ni `android/` (están en `.gitignore`).
- Si es necesario, siempre contactarse con el chat del backend para trabajar en conjunto. Usá la funcion SendMessage.
- Ante ambigüedad o duda, preguntar.

## 11. Comandos
`npm start` (Expo) · `npm run android` · `npm run ios` · `npm run web` · `npm test` (tests de `utils`) · `node scripts/generarClics.mjs`