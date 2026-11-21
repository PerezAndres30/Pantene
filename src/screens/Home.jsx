import { GROUPS, ICONS } from "../nav.jsx";

// Hebras doradas: se dibujan una sola vez al abrir la portada.
const STRANDS = Array.from({ length: 13 }, (_, i) => {
  const y = 90 + i * 34, s = (i % 4) * 14;
  return {
    d: `M-40 ${y} C 140 ${y - 150 - s}, 300 ${y + 190 + s}, 470 ${y + 20} S 640 ${y - 120}, 700 ${y - 40 + i * 6}`,
    w: i % 3 === 0 ? 1.4 : 0.8,
    o: i % 3 === 0 ? 0.95 : 0.55,
    delay: (i * 0.09).toFixed(2),
  };
});

export default function Home({ go }) {
  return (
    <section className="screen home">
      <div className="hero">
        <svg className="strands" viewBox="0 0 640 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
          {STRANDS.map((s, i) => (
            <path key={i} d={s.d} pathLength="1" strokeWidth={s.w} opacity={s.o} style={{ animationDelay: s.delay + "s" }} />
          ))}
        </svg>
        <h1>Clean Classic<br />Smart System</h1>
        <p className="deck">Un ecosistema de cuidado capilar que analiza tu cabello, adapta tu rutina al clima y te acompaña en cada uso.</p>
        <div className="cta">
          <button className="btn" onClick={() => go("scan")}>Analizar mi cabello</button>
          <button className="btn alt" onClick={() => go("auth")}>Verificar mi producto</button>
        </div>
        <p className="fine">Prototipo de demostración. No reemplaza el consejo de un especialista.</p>
      </div>
      {GROUPS.map(([title, items]) => (
        <div className="group" key={title}>
          <h3>{title}</h3>
          <div className="cards">
            {items.map(([id, t, d]) => (
              <button className="card" key={id} onClick={() => go(id)}>
                <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">{ICONS[id]}</svg>
                <b>{t}</b>
                <span className="d">{d}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
