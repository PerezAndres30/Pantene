import { useEffect, useRef, useState } from "react";
import { geminiJSON, aiErrorMessage } from "../lib/gemini.js";

const SUGS = ["¿Cada cuánto lo uso?", "¿Cómo se aplica?", "¿Sirve con cabello teñido?", "¿Qué ingredientes tiene?"];

const SYSTEM = `Eres el asistente virtual de Pantene para el acondicionador Clean Classic Conditioner y el cuidado capilar en general. Responde en español, en lenguaje cotidiano y breve (máximo 4 frases).
Reglas:
- Habla solo de cuidado capilar y de los productos del contexto. Si preguntan otra cosa, di amablemente que solo puedes ayudar con cuidado capilar.
- No inventes ingredientes, fórmulas, certificaciones, precios ni datos del producto. Usa solo los datos del contexto; si no los tienes, dilo y marca derivar_atencion en true.
- No diagnostiques ni des consejos médicos. Ante alergias, irritación, embarazo, niños o condiciones del cuero cabelludo, marca derivar_atencion en true y sugiere consultar a un profesional.
- No prometas resultados garantizados.
- Para modo de uso general puedes dar orientación común (aplicar de medios a puntas, dejar actuar 2 a 3 minutos, enjuagar), aclarando que se confirme con la etiqueta del envase.
Responde SOLO con un objeto JSON: {"respuesta":"texto","derivar_atencion":false}`;

function context(p) {
  if (!p) return "Contexto: el usuario aún no ha verificado ningún producto, así que no tienes datos de ingredientes.";
  return `Contexto del producto verificado (datos de Open Beauty Facts, base comunitaria que puede estar incompleta): nombre "${p.name}"${p.brand ? `, marca "${p.brand}"` : ""}${p.qty ? `, contenido ${p.qty}` : ""}. Ingredientes: ${p.ing || "no disponibles"}.`;
}

export default function Assistant({ product, apiKey }) {
  const [msgs, setMsgs] = useState([{ r: "bot", t: "Hola. Puedo ayudarte con modo de uso, frecuencia, ingredientes y compatibilidad con tu rutina." }]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef(null);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [msgs, busy]);

  async function ask(text = q) {
    const t = text.trim();
    if (!t || busy) return;
    const history = msgs.slice(-6).map((m) => `${m.r === "me" ? "Usuario" : "Asistente"}: ${m.t}`).join("\n");
    setMsgs((m) => [...m, { r: "me", t }]);
    setQ(""); setBusy(true);
    try {
      const d = await geminiJSON({
        system: SYSTEM,
        prompt: `${context(product)}\n\nConversación reciente:\n${history}\n\nPregunta nueva del usuario: ${t}`,
        apiKey,
      });
      let a = String(d.respuesta || "No tengo esa información con certeza.");
      if (d.derivar_atencion) a += " Te recomiendo contactar al servicio de atención al cliente para que te ayuden con esto.";
      setMsgs((m) => [...m, { r: "bot", t: a }]);
    } catch (e) {
      setMsgs((m) => [...m, { r: "bot", t: aiErrorMessage(e).replace("“Configuración de la IA”", "la sección HairScan, “Configuración de la IA”") }]);
    } finally { setBusy(false); }
  }

  return (
    <section className="screen">
      <h2>Asistente virtual Pantene</h2>
      <p className="lead">Pregunta en lenguaje cotidiano sobre ingredientes, modo de uso y compatibilidad.</p>
      <div className="chat" ref={box} aria-live="polite">
        {msgs.map((m, i) => <div key={i} className={"msg " + (m.r === "me" ? "me" : "bot")}>{m.t}</div>)}
        {busy && <div className="msg bot">Escribiendo…</div>}
      </div>
      <div className="chips">{SUGS.map((s) => <button key={s} disabled={busy} onClick={() => ask(s)}>{s}</button>)}</div>
      <div className="askrow" style={{ marginTop: ".8rem" }}>
        <input aria-label="Tu pregunta" placeholder="Escribe tu pregunta…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} />
        <button className="btn" disabled={busy} onClick={() => ask()}>Enviar</button>
      </div>
      <p className="note">Respuestas generadas con Gemini. Si verificas un producto, usa sus datos de Open Beauty Facts (base comunitaria, puede estar incompleta). Confirma siempre con la etiqueta y, ante dudas de salud, con un profesional.</p>
    </section>
  );
}
