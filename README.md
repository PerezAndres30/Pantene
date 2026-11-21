# Pantene · Clean Classic Smart System (React + Vite)

## Puesta en marcha
1. `npm install`
2. Copia `.env.example` como `.env` y pon tu clave de Gemini en `VITE_GEMINI_API_KEY`
   (créala en https://aistudio.google.com/apikey). También puedes dejarla vacía y pegar la clave
   dentro de la app, en HairScan > "Configuración de la IA".
3. `npm run dev` y abre http://localhost:5173

## Antes de usarla
- Lista de productos: edita `src/config.js` con los códigos de barras de tus compras.
- Modelo de Gemini: por defecto `gemini-flash-latest`. Si la API responde "el modelo no existe",
  cambia `VITE_GEMINI_MODEL` en `.env` por uno de la lista de modelos de Google AI Studio.
- Cámara y ubicación: el navegador solo las permite en `localhost` o en páginas `https`.
  Para probar en el celular, publica la app con https (Vercel, Netlify, etc.).

## Seguridad de la clave
Todo lo que lleva el prefijo `VITE_` queda dentro del código que baja el navegador. Úsala solo
para pruebas personales. Para publicar la app, pon la clave en un servidor intermedio y cambia
`src/lib/gemini.js` para llamar a tu servidor. No subas tu `.env` a GitHub (ya está en `.gitignore`).

## Probador virtual
- Detecta el cabello con MediaPipe (modelo `public/mediapipe/hair_segmenter.tflite`, corre en el navegador; la foto no sale del dispositivo) y aplica brillo y suavidad solo a esa zona.
- La persona no ajusta porcentajes: los define el producto en `src/config.js` (`EFECTO_BASE` y `EFECTOS_PRODUCTO`, por código de barras). Si se verificó un producto en "Verificar producto", se usa su perfil; si no, el perfil base.
- Si no se detecta cabello (menos de 1 % de la imagen), no se aplica ningún efecto y se pide otra foto.
- Los archivos de `public/mediapipe/` (wasm y modelo) deben quedar junto a la app al publicarla.

## Diseño
- Paleta: porcelana, azul medianoche y oro champán, con modo oscuro automático (`src/styles.css`, variables en `:root`).
- Tipografía: Bodoni Moda (títulos) y Jost (texto), desde Google Fonts (`index.html`). Sin internet usa Didot/Georgia y Avenir/system-ui.
- Navegación: riel lateral en escritorio y menú desplegable en móvil. La lista de funciones vive en `src/nav.jsx`.

## Estructura
- `src/screens/`: una pantalla por función (HairScan, Probador, Clima, Seguimiento, Asistente, Verificar, Frasco).
- `src/lib/gemini.js`: llamada a Gemini. `src/lib/image.js`: manejo de fotos.
- `src/components/PhotoButton.jsx`: captura con cámara (sin elegir archivos).
