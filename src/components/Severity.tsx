// Estilo único de severidad, tomado del "Resumen inicial" (Figma 34:15365). Todas las vistas de
// hallazgos (tarjetas, contadores, leyenda, estado sin hallazgos) deben usar estos componentes.
import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import type { Severity } from "../api/auth";

export const SEVERITIES: Severity[] = ["critica", "alta", "media", "baja"];
export const SEVERITY_LABEL: Record<Severity, string> = { critica: "Crítica", alta: "Alta", media: "Media", baja: "Baja" };
const ICON = { critica: CircleAlert, alta: TriangleAlert, media: TriangleAlert, baja: Info };

/** `onCard`: la chip va sobre la tarjeta de color del contador (la crítica cambia a fondo claro). */
export function SeverityBadge({ severity, onCard = false }: { severity: Severity; onCard?: boolean }) {
  const Icon = ICON[severity];
  return (
    <span className={`sev-chip sev-chip--${severity}${onCard ? " sev-chip--on-card" : ""}`}>
      <Icon size={13} aria-hidden />
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

export function SeverityCounters({ counts }: { counts: Record<Severity, number> | null }) {
  return (
    <div className="sev-counters">
      {SEVERITIES.map((s) => (
        <div key={s} className={`sev-card sev-card--${s}`}>
          <SeverityBadge severity={s} onCard />
          {counts ? <p className="sev-card__n">{counts[s]}</p> : <span className="sev-card__n-skel skel-bar" aria-hidden />}
        </div>
      ))}
    </div>
  );
}

export function SeverityLegend() {
  return (
    <div className="sev-legend">
      <span>Severidad:</span>
      {SEVERITIES.map((s) => <SeverityBadge key={s} severity={s} />)}
    </div>
  );
}

const STATUS_LABEL = { nueva: "Nueva", atendida: "Atendida", ignorada: "Ignorada" } as const;
/** Estado de la alerta. Nueva es del Figma; Atendida e Ignorada no tienen diseño aún (colores provisionales). */
export function StatusChip({ status }: { status: keyof typeof STATUS_LABEL }) {
  return <span className={`status-chip status-chip--${status}`}>{STATUS_LABEL[status]}</span>;
}
