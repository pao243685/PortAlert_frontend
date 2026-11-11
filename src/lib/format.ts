export const OS_LABEL: Record<string, string> = { linux: "Linux", windows: "Windows", macos: "macOS" };

/** "30 oct 2026 · 10:42 · Hora local" */
export function fmtDate(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }).replace(/\./g, "");
  const time = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day} · ${time} · Hora local`;
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
