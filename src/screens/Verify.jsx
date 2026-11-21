import { useEffect, useRef, useState } from "react";
import { MIS_PRODUCTOS } from "../config.js";
import { useStored } from "../lib/storage.js";

const OBF = "https://world.openbeautyfacts.org/api/v2/product/";
const FIELDS = "product_name,brands,quantity,categories,ingredients_text,ingredients_text_es,image_front_small_url";
function parseMl(q = "") {
  const m = q.match(/(\d+(?:[.,]\d+)?)\s*(ml|cl|l)\b/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(",", ".")), u = m[2].toLowerCase();
  return Math.round(u === "l" ? n * 1000 : u === "cl" ? n * 10 : n);
}
const canScan = typeof window !== "undefined" && "BarcodeDetector" in window;

export default function Verify({ setProduct }) {
  const [code, setCode] = useState("");
  const [out, setOut] = useState(null);
  const [cache, setCache] = useStored("obf", {});
  const [cam, setCam] = useState(false);
  const vid = useRef(null), stream = useRef(null);

  async function verify(raw = code) {
    const k = raw.replace(/\D/g, "");
    setProduct(null);
    if (k.length < 8) return setOut({ t: "info", msg: "Escribe un código de barras válido (8 a 13 dígitos)." });
    if (!MIS_PRODUCTOS.includes(k)) return setOut({ t: "no", k });
    setOut({ t: "load" });
    let p = cache[k];
    try {
      if (!p) {
        const r = await fetch(`${OBF}${k}.json?fields=${FIELDS}`);
        if (!r.ok) throw new Error();
        const j = await r.json();
        p = j.status === 1 ? j.product : null;
        if (p) setCache({ ...cache, [k]: p });
      }
    } catch { return setOut({ t: "net" }); }
    if (!p) return setOut({ t: "nodata" });
    const prod = { code: k, name: p.product_name || "Producto sin nombre", brand: p.brands || "", qty: p.quantity || "", cats: p.categories || "", ing: p.ingredients_text_es || p.ingredients_text || "", img: p.image_front_small_url || "", capMl: parseMl(p.quantity) };
    setProduct(prod);
    setOut({ t: "ok", p: prod });
  }

  const stopCam = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; setCam(false); };
  async function startCam() {
    try { stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); setCam(true); }
    catch { setOut({ t: "info", msg: "No pude abrir la cámara. Escribe el código a mano." }); }
  }
  useEffect(() => {
    if (!cam || !vid.current) return;
    const v = vid.current; v.srcObject = stream.current; v.play().catch(() => {});
    const det = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
    let alive = true;
    const tick = async () => {
      if (!alive) return;
      try { const r = await det.detect(v); if (r.length) { const val = r[0].rawValue; stopCam(); setCode(val); verify(val); return; } } catch {}
      setTimeout(tick, 300);
    };
    tick();
    const to = setTimeout(stopCam, 30000);
    return () => { alive = false; clearTimeout(to); };
  }, [cam]);
  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), []);

  const p = out?.p;
  return (
    <section className="screen">
      <h2>Verificación de producto</h2>
      <p className="lead">Escribe o escanea el código de barras. Si el producto está en tu lista de compras, verás sus datos desde Open Beauty Facts.</p>
      <div className="chips">{MIS_PRODUCTOS.map((c) => <button key={c} onClick={() => { setCode(c); verify(c); }}>{c}</button>)}</div>
      <label htmlFor="code">Código de barras</label>
      <input id="code" inputMode="numeric" placeholder="Ej. 7501006701234" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && verify()} />
      <button className="btn" onClick={() => verify()}>Verificar</button>{" "}
      {canScan && <button className="btn alt" onClick={cam ? stopCam : startCam}>{cam ? "Cerrar cámara" : "Escanear con cámara"}</button>}
      {cam && <video ref={vid} playsInline muted style={{ maxWidth: "100%", borderRadius: 10, marginTop: ".8rem" }} />}
      <div aria-live="polite">
        {out?.t === "info" && <div className="out">{out.msg}</div>}
        {out?.t === "load" && <div className="out">Consultando Open Beauty Facts…</div>}
        {out?.t === "no" && <div className="out"><span className="bad">No está en tu lista.</span> El código {out.k} no corresponde a ninguno de los productos que registraste. Revisa el código o agrégalo a la lista.</div>}
        {out?.t === "net" && <div className="out"><span className="ok">Está en tu lista.</span> Pero no pude consultar Open Beauty Facts. Revisa tu conexión a internet.</div>}
        {out?.t === "nodata" && <div className="out"><span className="ok">Está en tu lista.</span> Open Beauty Facts todavía no tiene datos de este producto.</div>}
        {p && (
          <div className="out">
            <span className="ok">Está en tu lista de productos.</span>
            {p.img && <img className="pv" alt="Frente del producto" src={p.img} style={{ maxHeight: 140 }} />}
            <p><strong>{p.name}</strong>{p.brand && ` · ${p.brand}`}{p.qty && ` · ${p.qty}`}</p>
            {p.cats && <div>Categorías: {p.cats}</div>}
            <div style={{ marginTop: ".5rem" }}><strong>Ingredientes</strong><br />{p.ing || "Sin lista de ingredientes en la base."}</div>
            <p className="note">Ahora puedes preguntarle al asistente sobre este producto.</p>
          </div>
        )}
      </div>
      <p className="note">El código de barras identifica el modelo del producto, no cada frasco, así que esta función no detecta copias que repitan el código. Los datos vienen de Open Beauty Facts, una base comunitaria que puede estar incompleta; confirma siempre con la etiqueta. Requiere internet.</p>
    </section>
  );
}
