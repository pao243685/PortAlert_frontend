// Figma: "05 · Alertas y atención" — Alertas · Sin alertas (6:24849). La lista con alertas no está
// en el Figma todavía: las filas siguen el patrón de tarjetas de hallazgos (provisional).
import { BellOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listAlerts } from "../api/auth";
import type { AlertItem, AlertStatus } from "../api/auth";
import { AppShell } from "../components/AppShell";
import { SeverityBadge, StatusChip } from "../components/Severity";
import { Button, NetworkErrorCard } from "../components/ui";
import { cap, fmtDate } from "../lib/format";

type Tab = "todas" | AlertStatus;
const TABS: { id: Tab; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "nueva", label: "Nuevas" },
  { id: "atendida", label: "Atendidas" },
  { id: "ignorada", label: "Ignoradas" },
];
const EMPTY_FILTER: Record<AlertStatus, string> = {
  nueva: "No hay alertas nuevas",
  atendida: "No hay alertas atendidas",
  ignorada: "No hay alertas ignoradas",
};

export default function Alertas() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertItem[] | null>(null);
  const [netError, setNetError] = useState(false);
  const [tab, setTab] = useState<Tab>("todas");

  const load = useCallback(async () => {
    setNetError(false);
    setAlerts(null);
    try {
      setAlerts(await listAlerts());
    } catch {
      setNetError(true);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const shown = alerts ? alerts.filter((a) => tab === "todas" || a.status === tab) : [];

  let body;
  if (netError) {
    body = <NetworkErrorCard onRetry={load} />;
  } else if (!alerts) {
    body = <div className="stack" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 112 }} />)}</div>;
  } else if (shown.length === 0) {
    body = (
      <section className="wcard wcard--center wcard--empty">
        <span className="empty-icon"><BellOff size={28} color="#285fdb" aria-hidden /></span>
        {tab === "todas" ? (
          <>
            <h2 className="wcard__title wcard__title--lg">Sin cambios desde tu primer reporte</h2>
            <p className="wcard__text">No hay alertas registradas en este momento.<br />El agente seguirá enviando señales; no tener alertas no garantiza la ausencia de riesgos.</p>
            <Button variant="secondary" inline onClick={() => navigate("/revision")}>Ver resumen inicial</Button>
          </>
        ) : (
          <>
            <h2 className="wcard__title wcard__title--lg">{EMPTY_FILTER[tab]}</h2>
            <p className="wcard__text">Cuando cambie el estado de alguna alerta, la verás aquí.</p>
          </>
        )}
      </section>
    );
  } else {
    body = (
      <div className="findings">
        {shown.map((a) => (
          <Link key={a.id} to={`/alertas/${a.id}`} className="finding alert-row">
            <div className="alert-row__top">
              <span className="mono mono--ref">{a.reference}</span>
              <StatusChip status={a.status} />
              <SeverityBadge severity={a.severity} />
            </div>
            <h3 className="finding__title">{a.title}</h3>
            <p className="finding__muted">
              {[a.event_label, fmtDate(a.created_at), a.port !== null ? `Puerto ${a.port}` : null, `Confianza ${cap(a.confidence)}`].filter(Boolean).join(" · ")}
            </p>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <AppShell breadcrumb="Espacio personal / Alertas">
      <header className="form__header">
        <p className="form__eyebrow">ESPACIO PERSONAL</p>
        <h1 className="form__title">Alertas</h1>
        <p className="form__subtitle">Revisa las señales de tu equipo, con todo su contexto.</p>
      </header>
      <div className="tabs" role="tablist" aria-label="Filtrar por estado">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`tab${tab === t.id ? " tab--active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {body}
      {alerts && !netError && <p className="legend-small legend-small--md">{shown.length} {shown.length === 1 ? "alerta" : "alertas"}</p>}
    </AppShell>
  );
}
