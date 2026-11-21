import { useState } from "react";

const WX = "https://api.open-meteo.com/v1/forecast";
const wdesc = (c) => c === 0 ? "despejado" : c <= 3 ? "parcialmente nublado" : c <= 48 ? "niebla" : c <= 57 ? "llovizna" : c <= 67 ? "lluvia" : c <= 77 ? "nieve" : c <= 82 ? "chubascos" : c <= 86 ? "nieve" : "tormenta";
const REGIONS = { "Costa húmeda": [31, 85], "Desierto seco": [34, 18], "Montaña fría": [8, 45], "Templado": [21, 55] };

function routine(t, h, x = {}) {
  const r = [];
  if (h >= 70) r.push("Humedad alta: el cabello tiende al frizz. Usa una cantidad pequeña de Clean Classic Conditioner, solo de medios a puntas, y enjuaga bien.");
  else if (h <= 30) r.push("Humedad baja: el cabello se reseca. Deja actuar el acondicionador 3 minutos y evita el agua muy caliente.");
  else r.push("Humedad moderada: sigue tu rutina habitual con el acondicionador.");
  if (t >= 30) r.push("Calor intenso: lava con agua tibia y protege el cabello del sol.");
  else if (t <= 12) r.push("Frío: seca bien el cabello antes de salir para evitar quiebre.");
  if (h >= 70 && t >= 25) r.push("Calor húmedo: evita capas pesadas de producto en la raíz.");
  if (x.uv != null && x.uv >= 6) r.push(`Radiación UV alta hoy (${Math.round(x.uv)}): cubre el cabello con gorra o sombrero si estarás al sol.`);
  if (x.rain != null && x.rain >= 60) r.push(`Alta probabilidad de lluvia (${x.rain}%): lleva algo para cubrirte; el cabello mojado se esponja más con la humedad.`);
  if (x.wind != null && x.wind >= 25) r.push(`Viento fuerte (${Math.round(x.wind)} km/h): recoge el cabello para evitar enredos.`);
  return r;
}

export default function Weather() {
  const [out, setOut] = useState(null); // {k:"load"|"msg"|"data", ...}
  const [city, setCity] = useState("");
  const [temp, setTemp] = useState(24);
  const [hum, setHum] = useState(60);

  const show = (t, h, x) => setOut({ k: "data", t, h, x, tips: routine(t, h, x) });

  async function at(lat, lon, label) {
    setOut({ k: "load", msg: "Consultando el clima…" });
    try {
      const r = await fetch(`${WX}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=uv_index_max,precipitation_probability_max&timezone=auto&forecast_days=1`);
      if (!r.ok) throw new Error();
      const j = await r.json(), c = j.current;
      show(c.temperature_2m, c.relative_humidity_2m, { feels: c.apparent_temperature, wind: c.wind_speed_10m, uv: j.daily.uv_index_max[0], rain: j.daily.precipitation_probability_max[0], desc: wdesc(c.weather_code), label });
    } catch {
      setOut({ k: "msg", bad: true, msg: "No pude consultar el clima. Revisa tu conexión o ingresa los datos a mano." });
    }
  }
  function geo() {
    if (!navigator.geolocation) return setOut({ k: "msg", msg: "Tu navegador no permite obtener la ubicación. Busca una ciudad." });
    setOut({ k: "load", msg: "Obteniendo tu ubicación…" });
    navigator.geolocation.getCurrentPosition(
      (p) => at(p.coords.latitude.toFixed(3), p.coords.longitude.toFixed(3), "Tu ubicación"),
      () => setOut({ k: "msg", msg: "No pude obtener tu ubicación (permiso denegado o no disponible). Busca una ciudad o ingresa los datos a mano." }),
      { timeout: 12000, maximumAge: 600000 });
  }
  async function byCity() {
    const q = city.trim(); if (!q) return;
    setOut({ k: "load", msg: "Buscando ciudad…" });
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=1&language=es&name=${encodeURIComponent(q)}`);
      const j = await r.json();
      if (!j.results?.length) return setOut({ k: "msg", msg: "No encontré esa ciudad. Prueba con otro nombre." });
      const c = j.results[0];
      at(c.latitude, c.longitude, [c.name, c.admin1, c.country].filter(Boolean).join(", "));
    } catch {
      setOut({ k: "msg", bad: true, msg: "No pude buscar la ciudad. Revisa tu conexión." });
    }
  }

  return (
    <section className="screen">
      <h2>Rutina adaptada al clima</h2>
      <p className="lead">Consulta el clima de tu ubicación y recibe una rutina de cuidado para hoy.</p>
      <button className="btn" onClick={geo}>Usar mi ubicación</button>
      <label htmlFor="city">O busca una ciudad</label>
      <div style={{ display: "flex", gap: ".5rem" }}>
        <input id="city" placeholder="Ej. Tuxtla Gutiérrez" value={city} onChange={(e) => setCity(e.target.value)} onKeyDown={(e) => e.key === "Enter" && byCity()} />
        <button className="btn" style={{ marginTop: 0 }} onClick={byCity}>Buscar</button>
      </div>
      <details style={{ marginTop: "1rem" }}>
        <summary style={{ cursor: "pointer" }}>Ingresar datos a mano</summary>
        <div className="chips" style={{ marginTop: ".6rem" }}>
          {Object.entries(REGIONS).map(([n, [t, h]]) => (
            <button key={n} onClick={() => { setTemp(t); setHum(h); show(t, h, { label: n }); }}>{n}</button>
          ))}
        </div>
        <div className="row">
          <div><label htmlFor="temp">Temperatura (°C)</label><input id="temp" type="number" value={temp} onChange={(e) => setTemp(+e.target.value)} /></div>
          <div><label htmlFor="hum">Humedad (%)</label><input id="hum" type="number" min="0" max="100" value={hum} onChange={(e) => setHum(+e.target.value)} /></div>
        </div>
        <button className="btn alt" onClick={() => show(temp, hum, { label: "Datos manuales" })}>Ver rutina</button>
      </details>
      <div aria-live="polite">
        {out?.k === "load" && <div className="out">{out.msg}</div>}
        {out?.k === "msg" && <div className="out">{out.bad && <span className="bad">Error. </span>}{out.msg}</div>}
        {out?.k === "data" && (
          <div className="out">
            <div><strong>{out.x.label}</strong>{out.x.desc && ` · ${out.x.desc}`}</div>
            <div style={{ margin: ".3rem 0" }}>Temperatura: {Math.round(out.t)} °C{out.x.feels != null && ` (sensación ${Math.round(out.x.feels)} °C)`} · Humedad: {Math.round(out.h)}%</div>
            <strong>Tu rutina de hoy</strong>
            <ul>{out.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </div>
        )}
      </div>
      <p className="note">Tu ubicación solo se usa para consultar el clima y no se guarda. Datos meteorológicos de Open-Meteo.com (licencia CC BY 4.0). Las recomendaciones son orientativas.</p>
    </section>
  );
}
