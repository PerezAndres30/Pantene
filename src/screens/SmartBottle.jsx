import { useEffect, useRef, useState } from "react";
import PhotoButton from "../components/PhotoButton.jsx";
import { blobToCanvas } from "../lib/image.js";

const STEPS = [
  "Paso 1 de 3: toca la base del frasco (donde empieza el líquido).",
  "Paso 2 de 3: toca donde termina el líquido (el nivel actual).",
  "Paso 3 de 3: toca hasta donde llegaría el líquido si el frasco estuviera lleno.",
];
const COLS = ["#3b82f6", "#e5484d", "#16a34a"];

export default function SmartBottle({ product }) {
  const cv = useRef(null);
  const [img, setImg] = useState(null);
  const [pts, setPts] = useState([]);
  const [pct, setPct] = useState(null);
  const [msg, setMsg] = useState("");
  const [cap, setCap] = useState(300), [capFrom, setCapFrom] = useState("");
  const [left, setLeft] = useState(180), [dose, setDose] = useState(15), [week, setWeek] = useState(3);

  useEffect(() => { if (product?.capMl) { setCap(product.capMl); setCapFrom(`el producto verificado (${product.qty})`); } }, [product]);

  useEffect(() => {
    if (!img || !cv.current) return;
    const c = cv.current, x = c.getContext("2d");
    c.width = img.width; c.height = img.height;
    x.drawImage(img, 0, 0);
    pts.forEach((yy, i) => { x.strokeStyle = COLS[i]; x.lineWidth = 3; x.beginPath(); x.moveTo(0, yy); x.lineTo(c.width, yy); x.stroke(); });
  }, [img, pts]);

  function reset() { setPts([]); setPct(null); setMsg(""); }
  function tap(e) {
    if (!img || pts.length >= 3) return;
    const r = cv.current.getBoundingClientRect();
    const next = [...pts, ((e.clientY - r.top) * cv.current.height) / r.height];
    setPts(next);
    if (next.length < 3) return;
    const [base, liq, top] = next, span = base - top;
    if (span < 20 || liq > base + 2 || liq < top - 2) { setMsg("order"); return; }
    setPct(Math.max(0, Math.min(100, ((base - liq) / span) * 100)));
    setMsg("");
  }

  const leftVal = pct != null ? Math.round((cap * pct) / 100) : Math.min(left, cap);
  const perWeek = dose * week;
  const days = perWeek > 0 ? Math.floor((leftVal / perWeek) * 7) : null;
  const lvl = cap > 0 ? Math.round((leftVal / cap) * 100) : 0;
  const until = days != null ? new Date(Date.now() + days * 864e5).toLocaleDateString("es-MX") : "";
  const low = lvl <= 20 || (days != null && days <= 10);

  return (
    <section className="screen">
      <h2>Frasco inteligente</h2>
      <p className="lead">Mide con una foto cuánto producto te queda y calcula cuándo pedir tu refill.</p>
      <h3 className="sub" style={{ marginTop: ".8rem", borderTop: 0, paddingTop: 0 }}>Medir con una foto</h3>
      <PhotoButton label="Tomar foto del frasco" hasPhoto={!!img} onPhoto={async (b) => { setImg(await blobToCanvas(b, 520)); reset(); }} />
      {img && <p className="lead" style={{ fontWeight: 600, color: "var(--ink)", marginTop: ".8rem" }}>{pts.length < 3 ? STEPS[pts.length] : pct != null ? "Listo." : "Las marcas no quedaron en orden."}</p>}
      <canvas ref={cv} hidden={!img} onPointerDown={tap} style={{ cursor: "crosshair", touchAction: "manipulation" }} />
      {img && <button className="btn alt" onClick={reset}>Repetir marcas</button>}
      {msg === "order" && <div className="out">La base debe quedar abajo, el nivel en medio y el tope arriba. Toca “Repetir marcas” e inténtalo de nuevo.</div>}
      {pct != null && (
        <div className="out">
          <div>Nivel estimado: <strong>{Math.round(pct)}%</strong> (unos <strong>{leftVal} ml</strong>)</div>
          <div>Capacidad usada: {cap} ml {capFrom ? `(tomada de ${capFrom})` : "(la que escribiste abajo)"}</div>
          <div className="bar"><i style={{ width: pct + "%" }} /></div>
          <p className="note">Es una estimación a ojo. Si la capacidad no es correcta, cámbiala abajo y el contenido se recalcula.</p>
        </div>
      )}
      <h3 className="sub">Calcular cuánto te dura</h3>
      <div className="row">
        <div><label htmlFor="cap">Capacidad (ml)</label><input id="cap" type="number" value={cap} onChange={(e) => { setCap(+e.target.value); setCapFrom(""); }} /></div>
        <div><label htmlFor="left">Contenido actual (ml)</label><input id="left" type="number" value={leftVal} onChange={(e) => { setPct(null); setLeft(+e.target.value); }} /></div>
        <div><label htmlFor="dose">Uso por lavado (ml)</label><input id="dose" type="number" value={dose} onChange={(e) => setDose(+e.target.value)} /></div>
        <div><label htmlFor="week">Lavados por semana</label><input id="week" type="number" value={week} onChange={(e) => setWeek(+e.target.value)} /></div>
      </div>
      <div className="out" aria-live="polite">
        {days == null ? "Indica una dosis y lavados por semana mayores que cero." : (
          <>
            <div>Nivel: {lvl}%</div>
            <div className="bar"><i style={{ width: Math.min(100, lvl) + "%" }} /></div>
            <p>Te alcanza para unos <strong>{days} días</strong> (hasta el {until}).</p>
            <p className={low ? "bad" : "ok"}>{low ? "Es momento de pedir tu refill." : "Nivel suficiente por ahora."}</p>
          </>
        )}
      </div>
      <p className="note">La foto sirve cuando se ve el nivel del líquido (envase translúcido o con ventana); en un envase opaco no se puede medir. El tamaño no se deduce de la foto: se toma del producto verificado o de lo que escribas en Capacidad.</p>
    </section>
  );
}
