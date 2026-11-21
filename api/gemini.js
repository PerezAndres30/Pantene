// Función de Vercel: guarda la clave de Gemini en el servidor (variable GEMINI_API_KEY, sin prefijo VITE_).
// La app llama a /api/gemini y esta función reenvía la petición a Google.
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const MAX_IMG = 4_000_000; // caracteres base64 (~3 MB)
const MAX_TXT = 12_000;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "no-key" });

  const { system, prompt, imageB64 } = req.body || {};
  if (typeof prompt !== "string" || typeof system !== "string" || prompt.length > MAX_TXT || system.length > MAX_TXT) {
    return res.status(400).json({ error: "bad-request" });
  }
  if (imageB64 != null && (typeof imageB64 !== "string" || imageB64.length > MAX_IMG)) {
    return res.status(413).json({ error: "image-too-large" });
  }

  const parts = [{ text: prompt }];
  if (imageB64) parts.unshift({ inlineData: { mimeType: "image/jpeg", data: imageB64 } });
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4, maxOutputTokens: 2000 },
      }),
    });
    if (!r.ok) return res.status(r.status).json({ error: "upstream" });
    const j = await r.json();
    const text = (j.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
    return res.status(200).json({ text });
  } catch {
    return res.status(502).json({ error: "network" });
  }
}
