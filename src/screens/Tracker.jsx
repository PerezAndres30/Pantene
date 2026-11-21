import { useState } from "react";
import { useStored } from "../lib/storage.js";

const SER = [["f", "Frizz", "var(--warn)"], ["s", "Suavidad", "var(--gold-ink)"], ["c", "Peinado", "var(--steel)"]];

export default function Tracker() {
  const [log, setLog] = useStored("log", []);
  const [d, setD] = useState(new Date().toISOString().slice(0, 10));
  const [f, setF] = useState(3), [s, setS] = useState(3), [c, setC] = useState(3);
  const L = [...log].sort((a, b) => (a.d < b.d ? -1 : 1));
  const W = Math.max(300, L.length * 60), H = 150;
  const x = (i) => 20 + (L.length === 1 ? 0 : (i * (W - 40)) / (L.length - 1));
  const y = (v) => H - 20 - ((v - 1) * (H - 40)) / 4;

  return (
    <section className="screen">
      <h2>Aplicación de seguimiento capilar</h2>
      <p className="lead">Registra cada uso y cómo percibes tu cabello. Con varias semanas verás tu evolución.</p>
      <div className="row">
        <div><label htmlFor="tDate">Fecha de uso</label><input id="tDate" type="date" value={d} onChange={(e) => setD(e.target.value)} /></div>
        <div><label htmlFor="tF">Frizz percibido: {f}/5</label><input id="tF" type="range" min="1" max="5" value={f} onChange={(e) => setF(+e.target.value)} /></div>
        <div><label htmlFor="tS">Suavidad: {s}/5</label><input id="tS" type="range" min="1" max="5" value={s} onChange={(e) => setS(+e.target.value)} /></div>
        <div><label htmlFor="tC">Facilidad de peinado: {c}/5</label><input id="tC" type="range" min="1" max="5" value={c} onChange={(e) => setC(+e.target.value)} /></div>
      </div>
      <button className="btn" onClick={() => setLog([...log.filter((e) => e.d !== d), { d, f, s, c }])}>Guardar registro</button>{" "}
      <button className="btn alt" onClick={() => setLog([])}>Borrar registros</button>
      {!L.length ? <p className="lead">Aún no hay registros. Guarda el primero.</p> : (
        <>
          <div className="scroll">
            <svg viewBox={`0 0 ${W} ${H + 20}`} width={W} role="img" aria-label="Gráfica de progreso">
              {[1, 2, 3, 4, 5].map((v) => <line key={v} x1="20" x2={W - 20} y1={y(v)} y2={y(v)} stroke="var(--line)" />)}
              {SER.map(([k, , col]) => (
                <g key={k}>
                  <polyline fill="none" stroke={col} strokeWidth="2.5" points={L.map((e, i) => `${x(i)},${y(e[k])}`).join(" ")} />
                  {L.map((e, i) => <circle key={i} cx={x(i)} cy={y(e[k])} r="3.5" fill={col} />)}
                </g>
              ))}
            </svg>
          </div>
          <div className="chips" style={{ margin: ".3rem 0" }}>
            {SER.map(([k, n, col]) => <span key={k} style={{ color: col }}>● {n}</span>)}
          </div>
          <div className="scroll">
            <table>
              <thead><tr><th>Fecha</th><th>Frizz</th><th>Suavidad</th><th>Peinado</th></tr></thead>
              <tbody>{[...L].reverse().map((e) => <tr key={e.d}><td>{e.d}</td><td>{e.f}</td><td>{e.s}</td><td>{e.c}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}
      <p className="note">Muestra cambios percibidos, no resultados clínicos. Los datos se guardan solo en este navegador.</p>
    </section>
  );
}
