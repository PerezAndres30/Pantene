import { useEffect, useRef, useState } from "react";
import PhotoButton from "../components/PhotoButton.jsx";
import { blobToCanvas } from "../lib/image.js";
import { segmentHair, applyHairEffect, loadSegmenter } from "../lib/hair.js";
import { EFECTO_BASE, EFECTOS_PRODUCTO } from "../config.js";

export default function TryOn({ product }) {
  const cv = useRef(null);
  const [photo, setPhoto] = useState(null); // canvas original
  const [result, setResult] = useState(null); // canvas con el efecto
  const [state, setState] = useState({ k: "idle" }); // idle | load | ok | nohair | err
  const [showOriginal, setShowOriginal] = useState(false);

  // El efecto lo define el producto; la persona no lo ajusta.
  const fx = (product && EFECTOS_PRODUCTO[product.code]) || EFECTO_BASE;
  const nombre = product?.name || EFECTO_BASE.nombre;

  useEffect(() => { loadSegmenter().catch(() => {}); }, []); // precarga el modelo

  async function onPhoto(blob) {
    setState({ k: "load" }); setResult(null); setShowOriginal(false);
    try {
      const c = await blobToCanvas(blob, 720);
      setPhoto(c);
      const { mask, coverage } = await segmentHair(c);
      if (coverage < 0.01) return setState({ k: "nohair" });
      setResult(applyHairEffect(c, mask, fx));
      setState({ k: "ok", coverage });
    } catch {
      setState({ k: "err" });
    }
  }

  // Dibuja en el canvas visible: original o simulación.
  useEffect(() => {
    const src = showOriginal || !result ? photo : result;
    if (!src || !cv.current) return;
    const c = cv.current, x = c.getContext("2d");
    c.width = src.width; c.height = src.height;
    x.drawImage(src, 0, 0);
    if (!showOriginal && result) {
      x.fillStyle = "rgba(0,0,0,.55)"; x.fillRect(0, c.height - 26, c.width, 26);
      x.fillStyle = "#fff"; x.font = "13px sans-serif";
      x.fillText("Simulación ilustrativa, no es un resultado garantizado", 8, c.height - 9);
    }
  }, [photo, result, showOriginal]);

  return (
    <section className="screen">
      <h2>Probador virtual de resultados capilares</h2>
      <p className="lead">Toma una foto donde se vea tu cabello y mira una simulación ilustrativa de brillo y suavidad. El efecto se aplica solo al cabello.</p>
      <div className="out" style={{ marginTop: 0 }}>
        <div><strong>{nombre}</strong></div>
        <div>Brillo simulado: {fx.brillo}% · Suavidad simulada: {fx.suavidad}%</div>
        {!product && <p className="note">Usando el perfil base del acondicionador. Si verificas un producto en “Verificar producto”, se usa el perfil de ese producto.</p>}
      </div>
      <PhotoButton hasPhoto={!!photo} onPhoto={onPhoto} />
      <div aria-live="polite">
        {state.k === "load" && <div className="out">Detectando tu cabello…</div>}
        {state.k === "nohair" && <div className="out"><strong>No detecté cabello en la foto.</strong> Toma otra con el cabello bien visible y buena luz.</div>}
        {state.k === "err" && <div className="out"><span className="bad">No se pudo procesar la foto.</span> Revisa tu conexión y vuelve a intentarlo.</div>}
      </div>
      {state.k === "ok" && (
        <div className="chips" style={{ marginTop: ".8rem" }}>
          <button aria-pressed={!showOriginal} onClick={() => setShowOriginal(false)}>Con simulación</button>
          <button aria-pressed={showOriginal} onClick={() => setShowOriginal(true)}>Original</button>
        </div>
      )}
      <canvas ref={cv} hidden={!photo || state.k === "load"} />
      <p className="note">Esta imagen es una simulación ilustrativa hecha en tu navegador; la foto no sale de tu dispositivo. Los porcentajes son un perfil de demostración, no un resultado medido ni garantizado.</p>
    </section>
  );
}
