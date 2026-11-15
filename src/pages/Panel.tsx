// Figma: "04 · Panel y estados" — Panel (6:23410), Sin conexión (10:10722), Sin reportes (6:24751),
// Carga (6:24949) y Error (6:25074).
import { ArrowRight, CheckCircle2, CloudOff, Info, Laptop, Loader2, Monitor, Radio, RefreshCw, TriangleAlert, WifiOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPanel, getScoreHistory } from "../api/auth";
import type { PanelData, ScoreHistory } from "../api/auth";
import { ApiError } from "../api/client";
import { AppShell } from "../components/AppShell";
import { ScoreChart } from "../components/ScoreChart";
import { SeverityBadge, SeverityCounters, StatusChip } from "../components/Severity";
import type { Severity } from "../api/auth";
import { Button } from "../components/ui";
import { agoLabel, cap, fmtDate, OS_LABEL, scoreBand } from "../lib/format";

const ASCENDING: Severity[] = ["baja", "media", "alta", "critica"]; // orden del Figma en "Alertas nuevas"

function PanelHeader({ data }: { data: PanelData | null }) {
  const reports = !!data?.latest;
  const os = data ? OS_LABEL[data.host.os_family] ?? data.host.os_family : "";
  return (
    <header className="form__header">
      <p className="form__eyebrow">{data && reports ? `PANEL / ${data.host.name}`.toUpperCase() : "ESPACIO PERSONAL"}</p>
      <h1 className="form__title">Tu equipo, en perspectiva</h1>
      <p className="form__subtitle">
        {!data ? "" : reports ? "Revisa los indicios y decide qué atender primero." : `${data.host.name} · ${os} · Hora local`}
      </p>
    </header>
  );
}

function ScoreCard({ score }: { score: number | null }) {
  const band = score !== null ? scoreBand(score) : null;
  return (
    <section className="wcard">
      <div className="score-card__title">
        <h2 className="wcard__subtitle">Puntaje del equipo</h2>
        {band && <span title="El puntaje resume indicios del agente; no certifica que el equipo sea seguro."><Info size={16} color="#5e6c80" aria-label="Qué mide el puntaje" /></span>}
      </div>
      {band && score !== null ? (
        <div className="score">
          <p className="score__value">{score}<span className="score__max">/100</span></p>
          <div className="score__read">
            <p style={{ color: band.color }} className="score__label">{band.label}</p>
            <p className="score__text">{band.text}</p>
          </div>
        </div>
      ) : (
        <div className="score">
          <span className="score__none" aria-hidden />
          <div className="score__read">
            <p className="score__label score__label--ink">Aún sin evaluar</p>
            <p className="score__text">El puntaje aparecerá con el primer reporte.</p>
          </div>
        </div>
      )}
      <hr className="finding__sep" />
      <p className="legend-small">Bueno 80–100 · Regular 50–79 · Crítico 0–49</p>
    </section>
  );
}

function AgentCard({ data }: { data: PanelData }) {
  const { host, latest, agent_status } = data;
  const down = agent_status === "sin_conexion";
  const os = [OS_LABEL[host.os_family] ?? host.os_family, host.os_version].filter(Boolean).join(" · ");
  return (
    <section className="wcard wcard--dark">
      <div className="agent__id">
        <Laptop size={24} aria-hidden />
        <div><p className="host-dark__name">{host.name}</p><p className="host-dark__os">{os}</p></div>
      </div>
      <div>
        <p className="host-dark__muted">Último reporte del agente</p>
        <p className="agent__ago">{latest ? agoLabel(latest.seconds_ago) : "—"}</p>
      </div>
      <div className="host-dark__muted">
        <p>{down ? "El agente monitorea cada 30–60 s." : "El agente envía reportes cada 30–60 s."}</p>
        {latest && <p>Último reporte: {fmtDate(latest.received_at).replace(" · Hora local", "")}.</p>}
      </div>
      <p className="agent__status">
        <span className="agent__dot">{down ? <WifiOff size={14} aria-hidden /> : <CheckCircle2 size={14} aria-hidden />}</span>
        Estado del agente: {down ? "Sin conexión" : "Conectado"}
      </p>
      {down && <p className="host-dark__small">Conectado: reporte de menos de 5 min. Sin conexión: más de 5 min. La conexión no cambia el puntaje.</p>}
    </section>
  );
}

function HistoryCard({ days, setDays, history, noReports }: { days: 7 | 30; setDays: (d: 7 | 30) => void; history: ScoreHistory | null; noReports: boolean }) {
  const band = history?.current_score != null ? scoreBand(history.current_score) : null;
  const end = new Date(), start = new Date(Date.now() - (days - 1) * 86400000);
  const range = `${start.toLocaleDateString("es-MX", { day: "numeric", month: start.getMonth() === end.getMonth() ? undefined : "short" }).replace(/\./g, "")}–${end.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }).replace(/\./g, "")}`;
  return (
    <section className="wcard history">
      <div className="history__head">
        <h2 className="wcard__subtitle wcard__subtitle--lg">Historial del puntaje</h2>
        <div className="period" role="group" aria-label="Periodo">
          {([7, 30] as const).map((d) => (
            <button key={d} type="button" aria-pressed={days === d} className={`period__opt${days === d ? " period__opt--on" : ""}`} onClick={() => setDays(d)}>{d} días</button>
          ))}
        </div>
      </div>
      {noReports ? (
        <>
          <p className="legend-small">El puntaje resume indicios del agente; no certifica que el equipo sea seguro.</p>
          <p className="wcard__text">El historial aparecerá con el primer reporte</p>
        </>
      ) : !history ? (
        <div className="skeleton" style={{ height: 300 }} aria-busy="true" />
      ) : history.points.length === 0 ? (
        <p className="wcard__text">No hay reportes en este periodo.</p>
      ) : (
        <>
          <div className="history__now">
            <p className="history__score">{history.current_score}</p>
            {band && <p style={{ color: band.color }} className="history__band">/100 · {band.label}</p>}
            <p className="legend-small">{range}</p>
          </div>
          <ScoreChart history={history} />
          <div className="history__legend">
            <span className="muted">○ Primera revisión {history.first_score ?? "—"}</span>
            <span className="blue">● Actual {history.current_score}</span>
          </div>
          <p className="legend-small">El puntaje resume indicios del agente; no certifica que el equipo sea seguro.</p>
        </>
      )}
    </section>
  );
}

function Recent({ data }: { data: PanelData }) {
  const list = data.recent_alerts;
  return (
    <section className="stack">
      <div className="recent__head">
        <h2 className="sec-title sec-title--lg">
          {list.length === 5 ? "Las 5 alertas más recientes" : "Alertas recientes"}{data.new_total > 0 && ` · ${data.new_total} ${data.new_total === 1 ? "nueva" : "nuevas"} en total`}
        </h2>
        <Link to="/alertas" className="back-link">Ver todas<ArrowRight size={16} aria-hidden /></Link>
      </div>
      {list.length === 0 ? (
        <section className="wcard"><p className="wcard__text">Sin alertas por ahora. El agente seguirá enviando señales; no tener alertas no garantiza la ausencia de riesgos.</p></section>
      ) : (
        <div className="table" role="table">
          <div className="table__row table__row--head" role="row">
            <span>Alerta / fecha</span><span>Puerto</span><span>Severidad</span><span>Confianza</span><span>Estado</span>
          </div>
          {list.map((a) => (
            <Link key={a.id} to={`/alertas/${a.id}`} className="table__row" role="row">
              <span className="table__main">
                <strong>{a.title}</strong>
                {a.event_label && <small>{a.event_label}</small>}
                <small>{fmtDate(a.created_at).replace(" · Hora local", "")} · {a.reference}</small>
              </span>
              <span className="mono">{a.port ?? "—"}</span>
              <span><SeverityBadge severity={a.severity} /></span>
              <span className="muted">{cap(a.confidence)}</span>
              <span><StatusChip status={a.status} /></span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function PanelSkeleton() {
  return (
    <div className="stack" aria-busy="true">
      <p className="preparing"><Loader2 size={16} className="spin" aria-hidden />Cargando el panel…</p>
      <div className="eval">
        <div className="wcard"><div className="skel-bar skel-bar--lg" style={{ width: 160 }} /><div className="skeleton" style={{ height: 64, width: 100 }} /><div className="skel-bar" /></div>
        <div className="wcard"><div className="skel-bar skel-bar--lg" style={{ width: 160 }} /><div className="skeleton" style={{ height: 64, width: 100 }} /><div className="skel-bar" /></div>
      </div>
      <div className="wcard">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skel-bar skel-bar--lg" />)}</div>
      <div className="skeleton" style={{ height: 240 }} />
    </div>
  );
}

export default function Panel() {
  const navigate = useNavigate();
  const [data, setData] = useState<PanelData | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "net">("loading");
  const [days, setDays] = useState<7 | 30>(7);
  const [history, setHistory] = useState<ScoreHistory | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setState("loading");
    try {
      setData(await getPanel());
      setState("ok");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return void navigate("/vincular", { replace: true });
      if (!silent) setState("net");
    }
  }, [navigate]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { // el "hace X min" y el estado de conexión se refrescan solos
    const id = setInterval(() => void load(true), 30000);
    return () => clearInterval(id);
  }, [load]);

  const hasReports = !!data?.latest;
  useEffect(() => {
    if (!hasReports) return;
    setHistory(null);
    getScoreHistory(days).then(setHistory).catch(() => setHistory({ days, points: [], first_score: null, current_score: null }));
  }, [days, hasReports, data?.latest?.received_at]);

  let body: ReactNode;
  if (state === "net") {
    body = (
      <section className="wcard wcard--center wcard--empty">
        <span className="empty-icon empty-icon--gray"><CloudOff size={28} color="#5e6c80" aria-hidden /></span>
        <h2 className="wcard__title wcard__title--lg">No pudimos cargar el panel</h2>
        <p className="wcard__text">No se pudo obtener la información de tu equipo.<br />Comprueba tu conexión y vuelve a intentarlo. Tus datos no se han eliminado.</p>
        <Button inline icon={<RefreshCw size={18} aria-hidden />} onClick={() => void load()}>Reintentar</Button>
        <p className="mono mono--ref">Error de conexión · sin datos actualizados</p>
      </section>
    );
  } else if (state === "loading" || !data) {
    body = <PanelSkeleton />;
  } else if (!data.latest) {
    body = (
      <>
        <ScoreCard score={null} />
        <section className="wcard wcard--center wcard--empty">
          <span className="empty-icon"><Radio size={26} color="#285fdb" aria-hidden /></span>
          <h2 className="wcard__title wcard__title--lg">Esperando el primer reporte del agente</h2>
          <p className="wcard__text">Tu equipo ya está vinculado. Los reportes llegan cada 30–60 segundos.</p>
          <p className="mono mono--ref">Último reporte del agente: todavía no disponible</p>
          {/* "Mi equipo" aún no existe: este botón lleva al estado de la vinculación */}
          <Button variant="secondary" inline onClick={() => navigate("/vincular")}>Ver mi equipo</Button>
        </section>
        <HistoryCard days={days} setDays={setDays} history={null} noReports />
      </>
    );
  } else {
    const down = data.agent_status === "sin_conexion";
    body = (
      <>
        {!data.review_completed && (
          <div className="aviso aviso--info aviso--action" role="note">
            <Info size={20} color="#285fdb" aria-hidden />
            <p>Revisa el resumen inicial de tu equipo</p>
            <Button inline className="btn--shadow" onClick={() => navigate("/revision")}>Ver resumen</Button>
          </div>
        )}
        <div className="eval">
          <ScoreCard score={data.latest.score} />
          <AgentCard data={data} />
        </div>
        {down && (
          <section className="wcard help-box">
            <p className="help-box__text"><TriangleAlert size={20} color="#805e0e" aria-hidden />Revisa que el equipo esté encendido y con internet. Si sigue sin reportar, reinstala el agente</p>
            {/* "Mi equipo" aún no existe: por ahora abre el estado de la vinculación */}
            <Button variant="secondary" inline className="btn--blue" icon={<Monitor size={18} aria-hidden />} onClick={() => navigate("/vincular")}>Mi equipo</Button>
          </section>
        )}
        <section className="stack">
          <div className="recent__head">
            <h2 className="sec-title sec-title--lg">Alertas nuevas</h2>
            <p className="legend-small">{data.new_total} por revisar</p>
          </div>
          <SeverityCounters counts={data.new_alerts} order={ASCENDING} />
        </section>
        <HistoryCard days={days} setDays={setDays} history={history} noReports={false} />
        <Recent data={data} />
        {down ? (
          <p className="legend-small legend-small--md">Este resultado es un indicio, no una confirmación. Ninguna interpretación de hallazgo es 100% segura.<br />Severidad = impacto potencial · Confianza = certeza del indicio · Medidas diferentes.</p>
        ) : (
          <p className="legend-small legend-small--md">Los hallazgos son indicios para revisar, no confirmaciones de una amenaza. · Fechas en Hora local.</p>
        )}
      </>
    );
  }

  return (
    <AppShell breadcrumb="Espacio personal / Panel">
      <PanelHeader data={state === "ok" ? data : null} />
      {body}
    </AppShell>
  );
}
