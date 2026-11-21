import { useState, useEffect } from "react";
export function useStored(key, initial) {
  const [v, setV] = useState(() => {
    try { const x = localStorage.getItem(key); return x ? JSON.parse(x) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, setV];
}
