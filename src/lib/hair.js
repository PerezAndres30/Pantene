// Segmentación de cabello (MediaPipe, corre en el navegador) y aplicación del efecto solo sobre el cabello.
const BASE = import.meta.env.BASE_URL || "/";

let segmenterPromise = null;
export function loadSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { FilesetResolver, ImageSegmenter } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks(BASE + "mediapipe/wasm");
      const opts = (delegate) => ({
        baseOptions: { modelAssetPath: BASE + "mediapipe/hair_segmenter.tflite", delegate },
        runningMode: "IMAGE",
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      });
      try { return await ImageSegmenter.createFromOptions(fileset, opts("GPU")); }
      catch { return await ImageSegmenter.createFromOptions(fileset, opts("CPU")); }
    })().catch((e) => { segmenterPromise = null; throw e; });
  }
  return segmenterPromise;
}

// Devuelve { mask: Float32Array (0..1, tamaño del canvas), coverage } con la probabilidad de "cabello" por píxel.
export async function segmentHair(canvas) {
  const seg = await loadSegmenter();
  const res = seg.segment(canvas);
  try {
    const masks = res.confidenceMasks || [];
    // El modelo da [fondo, cabello]; si solo hay una máscara, es la de cabello.
    const m = masks.length > 1 ? masks[1] : masks[0];
    if (!m) throw new Error("sin-mascara");
    const data = Float32Array.from(m.getAsFloat32Array());
    const w = canvas.width, h = canvas.height;
    let mask = data;
    if (m.width !== w || m.height !== h) { // por si la máscara viene a otro tamaño
      mask = new Float32Array(w * h);
      for (let y = 0; y < h; y++) {
        const sy = Math.min(m.height - 1, Math.floor((y * m.height) / h));
        for (let x = 0; x < w; x++) mask[y * w + x] = data[sy * m.width + Math.min(m.width - 1, Math.floor((x * m.width) / w))];
      }
    }
    let sum = 0;
    for (let i = 0; i < mask.length; i++) sum += mask[i] > 0.5 ? 1 : 0;
    return { mask, coverage: sum / mask.length };
  } finally {
    res.close?.();
  }
}

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// Aplica suavidad y brillo SOLO donde la máscara dice que hay cabello.
// fx = { brillo: 0..100, suavidad: 0..100 }. Devuelve un canvas nuevo.
export function applyHairEffect(src, mask, fx) {
  const w = src.width, h = src.height;
  const out = document.createElement("canvas");
  out.width = w; out.height = h;
  const ctx = out.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(src, 0, 0);
  const base = ctx.getImageData(0, 0, w, h);

  // Copia suavizada (reduce frizz y textura fina).
  const blurC = document.createElement("canvas");
  blurC.width = w; blurC.height = h;
  const bctx = blurC.getContext("2d", { willReadFrequently: true });
  bctx.filter = `blur(${((fx.suavidad / 100) * Math.max(w, h)) / 110}px)`;
  bctx.drawImage(src, 0, 0);
  bctx.filter = "none";
  const soft = bctx.getImageData(0, 0, w, h).data;

  // Luminancia media y caja del cabello.
  const d = base.data;
  let lumSum = 0, n = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (mask[i] > 0.5) {
      const p = i * 4;
      lumSum += (0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]) / 255;
      n++;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (!n) return out;
  const mu = lumSum / n;
  const bandY = minY + 0.32 * (maxY - minY), bandW = Math.max(8, 0.14 * (maxY - minY));
  const sa = (fx.suavidad / 100) * 0.85, sh = fx.brillo / 100;

  for (let y = 0; y < h; y++) {
    const band = Math.exp(-(((y - bandY) / bandW) ** 2));
    for (let x = 0; x < w; x++) {
      const i = y * w + x, m = clamp((mask[i] - 0.15) / 0.7); // borde suave
      if (m <= 0) continue;
      const p = i * 4;
      let r = d[p], g = d[p + 1], b = d[p + 2];
      // 1) suavidad: mezcla con la copia desenfocada
      const k = sa * m;
      r += (soft[p] - r) * k; g += (soft[p + 1] - g) * k; b += (soft[p + 2] - b) * k;
      // 2) brillo: más contraste en el cabello + reflejo que sigue la luz de cada mechón
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const c = 1 + (sh * 0.35 * m);
      r = (r - mu * 255) * c + mu * 255; g = (g - mu * 255) * c + mu * 255; b = (b - mu * 255) * c + mu * 255;
      const strand = clamp(0.5 + (lum - mu) * 2.5);
      const hi = sh * m * (0.12 + 0.88 * band) * (0.3 + 0.7 * strand) * 0.75;
      d[p] = clamp(r + (255 - r) * hi, 0, 255);
      d[p + 1] = clamp(g + (255 - g) * hi, 0, 255);
      d[p + 2] = clamp(b + (255 - b) * hi * 0.96, 0, 255);
    }
  }
  ctx.putImageData(base, 0, 0);
  return out;
}
