// Navegación compartida por el menú y la portada.
export const ICONS = {
  scan: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  try: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></>,
  clima: <><circle cx="9" cy="9" r="3" /><path d="M9 3v1.5M3 9h1.5M4.8 4.8l1 1M13.2 4.8l-1 1" /><path d="M8 19h9a3.5 3.5 0 0 0 .5-6.9A5 5 0 0 0 8 13a3 3 0 0 0 0 6z" /></>,
  track: <><path d="M4 20V4M4 20h16" /><path d="M8 15l3-4 3 2 5-6" /></>,
  smart: <><path d="M10 3h4v3l1.5 2.5V20a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V8.5L10 6z" /><path d="M8.5 14h7" /></>,
  bot: <path d="M4 5h16v11H9l-5 4z" />,
  auth: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
};

export const GROUPS = [
  ["Analiza tu cabello", [
    ["scan", "Pantene HairScan", "Una foto de tu cabello y recomendaciones personalizadas con IA."],
    ["try", "Probador virtual", "Mira una simulación de brillo y suavidad sobre tu propio cabello."],
  ]],
  ["Cuida tu rutina", [
    ["clima", "Rutina adaptada al clima", "Cuidados para hoy según la humedad y la temperatura de tu ciudad."],
    ["track", "Seguimiento capilar", "Registra cada uso y observa cómo evoluciona tu cabello."],
    ["smart", "Frasco inteligente", "Calcula cuánto te queda y cuándo pedir tu refill."],
  ]],
  ["Consulta y verifica", [
    ["bot", "Asistente virtual", "Resuelve dudas sobre ingredientes, modo de uso y compatibilidad."],
    ["auth", "Verificar producto", "Comprueba tu producto con su código de barras."],
  ]],
];

export const TITLES = { home: "Inicio", ...Object.fromEntries(GROUPS.flatMap(([, items]) => items.map(([id, t]) => [id, t]))) };
