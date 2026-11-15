export const OS_LABEL: Record<string, string> = { linux: "Linux", windows: "Windows", macos: "macOS" };

/** "30 oct 2026 · 10:42 · Hora local" */
export function fmtDate(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }).replace(/\./g, "");
  const time = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day} · ${time} · Hora local`;
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "hace 2 min", "hace 3 h"… a partir de segundos transcurridos. */
export function agoLabel(seconds: number): string {
  if (seconds < 60) return "hace unos segundos";
  const min = Math.floor(seconds / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} ${d === 1 ? "día" : "días"}`;
}

/** "24 oct" */
export const fmtDay = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short" }).replace(/\./g, "");

/** Puntaje: Bueno 80–100, Regular 50–79, Crítico 0–49 (leyenda del Figma). */
export function scoreBand(score: number) {
  if (score >= 80) return { label: "Bueno", color: "#226e60", text: "Mantén la revisión periódica." };
  if (score >= 50) return { label: "Regular", color: "#805e0e", text: "Hay señales que conviene revisar." };
  // El Figma no trae el texto del rango crítico: redacción propia, confirmar.
  return { label: "Crítico", color: "#a52843", text: "Hay riesgos que conviene atender pronto." };
}
