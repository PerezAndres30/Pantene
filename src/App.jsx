import { useEffect, useState } from "react";
import { useStored } from "./lib/storage.js";
import { GROUPS, TITLES } from "./nav.jsx";
import Home from "./screens/Home.jsx";
import HairScan from "./screens/HairScan.jsx";
import TryOn from "./screens/TryOn.jsx";
import Weather from "./screens/Weather.jsx";
import Tracker from "./screens/Tracker.jsx";
import Assistant from "./screens/Assistant.jsx";
import Verify from "./screens/Verify.jsx";
import SmartBottle from "./screens/SmartBottle.jsx";

export default function App() {
  const initial = TITLES[location.hash.slice(1)] ? location.hash.slice(1) : "home";
  const [screen, setScreen] = useState(initial);
  const [menu, setMenu] = useState(false);
  const [product, setProduct] = useState(null);
  const [apiKey, setApiKey] = useStored("gemini_key", "");

  const go = (id) => { setScreen(id); setMenu(false); window.scrollTo(0, 0); history.replaceState(null, "", "#" + id); };
  useEffect(() => {
    const k = (e) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const view = {
    home: <Home go={go} />,
    scan: <HairScan apiKey={apiKey} setApiKey={setApiKey} />,
    try: <TryOn product={product} />,
    clima: <Weather />,
    track: <Tracker />,
    bot: <Assistant product={product} apiKey={apiKey} />,
    auth: <Verify setProduct={setProduct} />,
    smart: <SmartBottle product={product} />,
  }[screen];

  return (
    <>
      <header className="top">
        <button className="menu" aria-expanded={menu} aria-controls="tabs" onClick={() => setMenu(!menu)}>Menú</button>
        <button className="mark" onClick={() => go("home")} aria-label="Pantene, ir al inicio">
          <span className="wm">Pantene</span>
          <span className="sys">Clean Classic Smart System</span>
        </button>
        {screen !== "home" && <div className="here" aria-live="polite">{TITLES[screen]}</div>}
      </header>
      <div id="scrim" className={menu ? "open" : ""} onClick={() => setMenu(false)} />
      <div className="shell">
        <nav id="tabs" className={menu ? "open" : ""} aria-label="Funciones">
          <button aria-current={screen === "home" ? "page" : undefined} onClick={() => go("home")}>Inicio</button>
          {GROUPS.map(([title, items]) => (
            <div className="tg" key={title}>
              <p className="gt">{title}</p>
              {items.map(([id, name]) => (
                <button key={id} aria-current={id === screen ? "page" : undefined} onClick={() => go(id)}>{name}</button>
              ))}
            </div>
          ))}
        </nav>
        <main>{view}</main>
      </div>
    </>
  );
}
