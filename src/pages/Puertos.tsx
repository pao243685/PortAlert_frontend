// Figma: "06 · Puertos del equipo" — Detalle lateral (34:16049), Sin reportes (34:16235),
// Cargando (34:16313) y Error de red (34:16473).
import { Monitor, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getPorts, setNormal } from "../api/auth";
import type { PortRow, PortsData } from "../api/auth";
import { AppShell } from "../components/AppShell";
import { SeverityBadge, SeverityLegend } from "../components/Severity";
import { Aviso, NetworkErrorCard, Switch } from "../components/ui";
import { cap, fmtDate, OS_LABEL } from "../lib/format";

type Filter = "todos" | "riesgo" | "normal";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "riesgo", label: "Con riesgo" },
  { id: "normal", label: "Marcados como normal" },
];
const SCOPE = {
  all: { label: (ip: string) => `${ip} · todas las interfaces`, note: "Accesible desde la red", color: "#ab4a16" },
  local: { label: (ip: string) => `${ip} · solo este equipo`, note: "Acceso local", color: "#246b67" },
  specific: { label: (ip: string) => `${ip} · interfaz específica`, note: "Depende de la red", color: "#5e6c80" },
} as const;
const keyOf = (p: PortRow) => `${p.port}/${p.protocol}/${p.bind_address}`;
const portLabel = (p: PortRow) => `${p.port}/${p.protocol.toUpperCase()}`;

function Detail({ p, onClose, onToggle }: { p: PortRow; onClose: () => void; onToggle: (v: boolean) => void }) {
  const scope = SCOPE[p.scope];
  const data: [string, string][] = [
    ["Proceso", p.process ?? "No identificado"],
    ["PID", p.pid !== null ? String(p.pid) : "No disponible"],
    ["Ruta", p.exe_path ?? "No disponible"],
    ["Usuario", p.username ?? "Desconocido"],
    ["Paquete", p.package ?? "Sin paquete asociado"],
    ["Binario eliminado del disco", p.exe_deleted ? "Sí" : "No"],
  ];
  return (
    <aside className="side" aria-label={`Detalle de ${portLabel(p)}`}>
      <div className="side__head">
        <h2 className="side__title">{portLabel(p)}{p.service ? ` · ${p.service}` : ""}</h2>
        <button type="button" className="side__close" onClick={onClose} aria-label="Cerrar detalle"><X size={18} /></button>
      </div>
      <p className="wcard__text wcard__text--small">{p.bind_address} · {scope.label("").replace(/^ · /, "")}</p>
      <div className="side__eval">
        {p.severity ? <SeverityBadge severity={p.severity} /> : <span className="ok-text">Sin hallazgos actuales</span>}
        {p.confidence && <span className="wcard__text wcard__text--small">Confianza {cap(p.confidence)}</span>}
      </div>
      {p.finding_title && <p className="side__finding">{p.finding_title}</p>}
      {p.recommendation && <p className="wcard__text wcard__text--small">{p.recommendation}</p>}
      {data.map(([k, v]) => (
        <div key={k} className="pdata"><p className="pdata__k">{k}</p><p className="pdata__v mono">{v}</p></div>
      ))}
      <Switch checked={p.is_normal} onChange={onToggle} label="Es normal en este equipo" />
      <p className="legend-small">Hallazgo calculado sobre el estado actual. No es una alerta guardada.</p>
    </aside>
  );
}

export default function Puertos() {
  const [data, setData] = useState<PortsData | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "net">("loading");
  const [filter, setFilter] = useState<Filter>("todos");
  const [selected, setSelected] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const d = await getPorts();
      setData(d);
      setSelected((cur) => cur && d.ports.some((p) => keyOf(p) === cur) ? cur : d.ports.find((p) => p.severity)?.port !== undefined ? keyOf(d.ports.find((p) => p.severity)!) : d.ports[0] ? keyOf(d.ports[0]) : null);
      setState("ok");
    } catch {
      setState("net");
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const rows = useMemo(() => (data?.ports ?? []).filter((p) => filter === "todos" || (filter === "riesgo" ? p.severity : p.is_normal)), [data, filter]);
  const sel = data?.ports.find((p) => keyOf(p) === selected) ?? null;
  const counts = data ? { total: data.ports.length, risk: data.ports.filter((p) => p.severity).length, normal: data.ports.filter((p) => p.is_normal).length } : null;

  async function toggle(p: PortRow, value: boolean) {
    if (!data) return;
    const patch = (v: boolean) => setData((d) => d && { ...d, ports: d.ports.map((x) => (x.port === p.port && x.protocol === p.protocol && (x.exe_path ?? "") === (p.exe_path ?? "") ? { ...x, is_normal: v } : x)) });
    patch(value);
    setSaveError(false);
    try {
      await setNormal({ port: p.port, protocol: p.protocol, exe_path: p.exe_path }, value);
    } catch {
      patch(!value);
      setSaveError(true);
    }
  }

  const host = data?.host;
  const os = host ? OS_LABEL[host.os_family] ?? host.os_family : "";
  const noReports = state === "ok" && data && data.report_id === null;

  let body: ReactNode;
  if (state === "net") {
    body = <NetworkErrorCard onRetry={() => void load()} />;
  } else if (state === "loading" || !data) {
    body = (
      <section className="stack" aria-busy="true">
        <div className="table">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="table__row table__row--skel"><span className="skel-bar skel-bar--lg" /></div>)}</div>
      </section>
    );
  } else if (noReports) {
    body = (
      <section className="wcard wcard--center wcard--empty">
        <Monitor size={32} color="#285fdb" aria-hidden />
        <h2 className="wcard__title">Aún no hay reportes</h2>
        <p className="wcard__text">El agente enviará su primer reporte al terminar la vinculación.</p>
      </section>
    );
  } else {
    body = (
      <div className="ports-layout">
        <section className="stack ports-main">
          <p className="legend-small legend-small--md">{counts!.total} puertos · {counts!.risk} con riesgo actual · {counts!.normal} marcados como normal</p>
          {rows.length === 0 ? (
            <section className="wcard"><p className="wcard__text">No hay puertos en este filtro.</p></section>
          ) : (
            <div className="table ports-table" role="table">
              <div className="ports-row ports-row--head" role="row">
                <span>Puerto / Protocolo</span><span>Dirección de enlace</span><span>Servicio</span><span>Proceso</span><span>Riesgo</span><span>Confianza</span><span>Normal</span>
              </div>
              {rows.map((p) => {
                const sc = SCOPE[p.scope];
                return (
                  <button key={keyOf(p)} type="button" role="row" aria-selected={selected === keyOf(p)} className={`ports-row${selected === keyOf(p) ? " ports-row--sel" : ""}`} onClick={() => setSelected(keyOf(p))}>
                    <span className="mono">{portLabel(p)}</span>
                    <span className="ports-row__scope"><strong style={{ color: sc.color }}>{sc.label(p.bind_address)}</strong><small>{sc.note}</small></span>
                    <span>{p.service ?? "—"}</span>
                    <span className="mono">{p.process ?? "—"}</span>
                    <span>{p.severity ? <SeverityBadge severity={p.severity} /> : <small className="ok-text">Sin hallazgos actuales</small>}</span>
                    <span className="muted">{p.confidence ? cap(p.confidence) : "—"}</span>
                    <span className="muted">{p.is_normal ? "Sí" : "No"}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
        {sel && <Detail p={sel} onClose={() => setSelected(null)} onToggle={(v) => void toggle(sel, v)} />}
      </div>
    );
  }

  return (
    <AppShell breadcrumb="Espacio personal / Puertos">
      <header className="form__header">
        {host && <p className="form__eyebrow">{`${host.name} / ${os}`.toUpperCase()}</p>}
        <h1 className="form__title">Puertos de tu equipo</h1>
        {host && <p className="form__subtitle">Monitorea los servicios que escuchan conexiones en {host.name}.</p>}
      </header>
      {host && (
        <div className="data-context">
          <span className="mono mono--ref">{[os, host.os_version].filter(Boolean).join(" · ")}</span>
          <span>{data?.received_at ? `Último reporte: ${fmtDate(data.received_at)}` : "Información del agente"}</span>
        </div>
      )}
      <div className="tabs tabs--auto" role="tablist" aria-label="Filtrar puertos">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className={`tab${filter === f.id ? " tab--active" : ""}`} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>
      {body}
      {saveError && <Aviso tone="info">No pudimos guardar tu preferencia. Inténtalo de nuevo.</Aviso>}
      {data?.improvements.map((m) => (
        <Aviso key={`${m.port}/${m.protocol}`} tone="info">
          {m.service ? `${m.service} ` : ""}{m.port}/{m.protocol.toUpperCase()} {m.bind_address.startsWith("127.") || m.bind_address === "::1" ? `ahora escucha solo en ${m.bind_address} y no presenta` : "ya no presenta"} hallazgos actuales. Esta mejora respecto del primer reporte no modifica las alertas guardadas.
        </Aviso>
      ))}
      {state !== "net" && <Aviso tone="info">Lo marcado como normal solo silencia avisos de puerto nuevo; los riesgos graves se siguen mostrando.</Aviso>}
      {state !== "net" && (
        <>
          <SeverityLegend />
          <p className="legend-small legend-small--md">Severidad: impacto potencial del hallazgo. Confianza: certeza del indicio. Son dos medidas distintas.</p>
          <Aviso tone="info">Este resultado es un indicio, no una confirmación. Ninguna interpretación de hallazgo es 100% segura.</Aviso>
        </>
      )}
    </AppShell>
  );
}
