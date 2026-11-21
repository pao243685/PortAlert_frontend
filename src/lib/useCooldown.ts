import { useEffect, useState } from "react";

/** "14:57 min" si falta más de un minuto; "45 s" si no. */
export const fmtWait = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} min` : `${s} s`);

/** Cuenta regresiva tras un 429: `left` son los segundos que faltan (0 = ya se puede reintentar). */
export function useCooldown() {
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (until <= Date.now()) return;
    const id = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= until) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [until]);
  return {
    left: Math.max(0, Math.ceil((until - now) / 1000)),
    start: (seconds: number) => {
      setNow(Date.now());
      setUntil(Date.now() + seconds * 1000);
    },
  };
}
