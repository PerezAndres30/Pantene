import { useRef, useState, useEffect } from "react";

// Botón que abre la cámara y devuelve la foto como Blob (no deja elegir archivos).
export default function PhotoButton({ onPhoto, hasPhoto, label = "Tomar foto", again = "Tomar otra foto" }) {
  const [open, setOpen] = useState(false);
  const vid = useRef(null), stream = useRef(null), fb = useRef(null);

  const stop = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; setOpen(false); };
  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), []);
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && stop();
    window.addEventListener("keydown", k);
    if (vid.current && stream.current) { vid.current.srcObject = stream.current; vid.current.play().catch(() => {}); }
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  async function start() {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      setOpen(true);
    } catch {
      fb.current?.click(); // respaldo: cámara nativa del teléfono
    }
  }
  function shot() {
    const v = vid.current;
    if (!v?.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    stop();
    c.toBlob((b) => b && onPhoto(b), "image/jpeg", 0.92);
  }
  return (
    <>
      <button className="btn" onClick={start}>{hasPhoto ? again : label}</button>
      <input ref={fb} type="file" accept="image/*" capture="environment" hidden
        onChange={(e) => { const f = e.target.files[0]; if (f) onPhoto(f); e.target.value = ""; }} />
      {open && (
        <div id="camModal" role="dialog" aria-modal="true" aria-label="Cámara">
          <video ref={vid} id="camVid" playsInline muted autoPlay />
          <div className="camBar">
            <button className="btn alt" onClick={stop}>Cancelar</button>
            <button className="btn" onClick={shot}>Capturar</button>
          </div>
        </div>
      )}
    </>
  );
}
