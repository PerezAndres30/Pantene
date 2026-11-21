const MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-flash-latest";
const ENV_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
export const hasEnvKey = !!ENV_KEY;

// Llama a Gemini y devuelve un objeto JSON.
export async function geminiJSON({ system, prompt, imageB64, apiKey }) {
  const key = apiKey || ENV_KEY;
  if (!key) { const e = new Error("no-key"); e.code = "no-key"; throw e; }
  const parts = [{ text: prompt }];
  if (imageB64) parts.unshift({ inlineData: { mimeType: "image/jpeg", data: imageB64 } });
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.4, maxOutputTokens: 2000 },
    }),
  });
  if (!r.ok) { const e = new Error("HTTP " + r.status); e.status = r.status; throw e; }
  const j = await r.json();
  const txt = (j.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Respuesta sin formato");
  return JSON.parse(m[0]);
}

export function aiErrorMessage(e) {
  if (e.code === "no-key") return "Falta la clave de Gemini. Pégala en “Configuración de la IA”.";
  if (e.status === 400 || e.status === 403) return "La clave de API no es válida o no tiene permiso.";
  if (e.status === 404) return "El modelo no existe. Cambia VITE_GEMINI_MODEL en tu archivo .env.";
  if (e.status === 429) return "Se alcanzó el límite de uso. Intenta de nuevo en un momento.";
  if (e.status) return `La API respondió con un error (${e.status}).`;
  return "No pude conectar con la IA. Revisa tu conexión a internet.";
}
