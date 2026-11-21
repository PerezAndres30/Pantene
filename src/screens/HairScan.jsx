import { useState } from "react";
import PhotoButton from "../components/PhotoButton.jsx";
import { blobToCanvas, canvasToBase64 } from "../lib/image.js";
import { geminiJSON, aiErrorMessage, hasEnvKey } from "../lib/gemini.js";

const SYSTEM = `Eres el asistente de cuidado capilar de Pantene. Recibes la foto de un cabello. Describe solo lo que se ve (brillo aparente, frizz, textura, estado de las puntas, signos visibles de resequedad) y da recomendaciones de cuidado y de uso del acondicionador Clean Classic Conditioner. No diagnostiques condiciones médicas ni del cuero cabelludo; si ves algo preocupante, sugiere consultar a un especialista. No identifiques ni describas a la persona. Si la imagen no muestra cabello con claridad o la luz es mala, indícalo. No prometas resultados garantizados. Responde SOLO con un objeto JSON con esta forma: {"cabello_visible":true,"brillo":"bajo|medio|alto","frizz":"bajo|medio|alto","textura":"texto corto","puntas":"texto corto","resumen":"2 frases","recomendaciones":["..."],"uso_acondicionador":"cantidad, zona y tiempo de aplicación","aviso":"texto o vacío"}. Escribe en español.`;

function KeySettings({ apiKey, setApiKey }) {
  const [draft, setDraft] = useState("");
  return (
    <details style={{ marginTop: "1rem" }}>
      <summary style={{ cursor: "pointer" }}>Configuración de la IA</summary>
      <label htmlFor="gkey">Clave de API de Gemini</label>
      <input id="gkey" type="password" autoComplete="off" placeholder="AIza..." value={draft} onChange={(e) => setDraft(e.target.value)} />
      <button className="btn alt" onClick={() => { if (draft.trim()) { setApiKey(draft.trim()); setDraft(""); } }}>Guardar clave</button>{" "}
      <button className="btn alt" onClick={() => setApiKey("")}>Quitar clave</button>
      <div className="note">
        {hasEnvKey ? "Usando la clave de tu archivo .env." : apiKey ? "Clave guardada en este navegador." : "Aún no hay clave. Pégala aquí o ponla en el archivo .env."}
      </div>
    </details>
  );
}

export default function HairScan({ apiKey, setApiKey }) {
  const [b64, setB64] = useState(null);
  const [state, setState] = useState({ k: "idle" });

  async function run(b) {
    setState({ k: "load" });
    try {
      const data = await geminiJSON({ system: SYSTEM, prompt: "Analiza este cabello y responde con el JSON indicado.", imageB64: b, apiKey });
      setState({ k: "ok", data });
    } catch (e) {
      setState({ k: "err", msg: aiErrorMessage(e) });
    }
  }
  async function onPhoto(blob) {
    const c = await blobToCanvas(blob, 1024);
    const b = canvasToBase64(c);
    setB64(b);
    run(b);
  }
  const d = state.data;
  const li = (a) => (Array.isArray(a) ? a : []).map((x, i) => <li key={i}>{x}</li>);

  return (
    <section className="screen">
      <h2>Pantene HairScan</h2>
      <p className="lead">Toma una foto de tu cabello y una IA te dará recomendaciones de cuidado y de uso del acondicionador.</p>
      <PhotoButton onPhoto={onPhoto} hasPhoto={!!b64} />
      {b64 && <img className="pv" alt="Tu foto" src={"data:image/jpeg;base64," + b64} style={{ maxHeight: 320 }} />}
      {b64 && state.k !== "load" && <button className="btn alt" onClick={() => run(b64)}>Analizar de nuevo</button>}
      <div aria-live="polite">
        {state.k === "load" && <div className="out">Analizando tu cabello…</div>}
        {state.k === "err" && <div className="out"><span className="bad">No se pudo analizar.</span> {state.msg}</div>}
        {state.k === "ok" && d.cabello_visible === false && (
          <div className="out"><strong>No pude ver el cabello con claridad.</strong><p>{d.aviso || d.resumen || "Toma otra foto con buena luz y de cerca."}</p></div>
        )}
        {state.k === "ok" && d.cabello_visible !== false && (
          <div className="out">
            <strong>Lo que se ve en la foto</strong>
            <div>Brillo aparente: {d.brillo || "-"} · Frizz: {d.frizz || "-"}</div>
            {d.textura && <div>Textura: {d.textura}</div>}
            {d.puntas && <div>Puntas: {d.puntas}</div>}
            {d.resumen && <p>{d.resumen}</p>}
            <strong>Recomendaciones</strong><ul>{li(d.recomendaciones)}</ul>
            {d.uso_acondicionador && (<><strong>Uso del acondicionador</strong><p>{d.uso_acondicionador}</p></>)}
            {d.aviso && <p className="note">{d.aviso}</p>}
          </div>
        )}
      </div>
      {import.meta.env.DEV && !hasEnvKey && <KeySettings apiKey={apiKey} setApiKey={setApiKey} />}
      <p className="note">Procura que se vea solo el cabello, sin tu cara, y con buena luz. La foto se envía a la API de Gemini. Las recomendaciones son orientativas, no un diagnóstico, y no prometen resultados.</p>
    </section>
  );
}
