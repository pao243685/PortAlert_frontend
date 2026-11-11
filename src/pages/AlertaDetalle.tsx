// Figma: "05 · Alertas y atención" — Detalle de alerta (6:24069, Windows 34:17020) y
// Ignorar alerta · Confirmación (34:16556).
import { ArrowLeft, Check, Info } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { getAlert, updateAlert } from "../api/auth";
import type { AlertDetail, AlertStatus } from "../api/auth";
import { ApiError } from "../api/client";
import { AppShell } from "../components/AppShell";
import { SeverityBadge, StatusChip } from "../components/Severity";
import { Button, NetworkErrorCard, StatusNotice } from "../components/ui";
import { cap, fmtDate, OS_LABEL } from "../lib/format";

const PUBLIC_ADDR = new Set(["0.0.0.0", "::", "*"]);

function Row({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="datum">
      <p className="datum__label">{label}</p>
      <div className={`datum__value${mono ? " mono" : ""}`}>{children}</div>
    </div>
  );
}

function IgnoreDialog({
  alert, busy, error, onCancel, onConfirm,
}: { alert: AlertDetail; busy: boolean; error: string | null; onCancel: () => void; onConfirm: (markNormal: boolean) => void }) {
  const [normal, setNormal] = useState(false);
  const firstRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="ignore-title">
        <h2 id="ignore-title" className="dialog__title">¿Ignorar esta alerta?</h2>
        <p className="dialog__subtitle">{alert.title}{alert.port !== null && alert.protocol && !alert.title.includes(String(alert.port)) ? ` · ${alert.port}/${alert.protocol.toUpperCase()}` : ""}</p>
        {alert.can_mark_normal && (
          <label className="check">
            <input type="checkbox" checked={normal} onChange={(e) => setNormal(e.target.checked)} />
            <span>Es normal en este equipo. No volver a avisarme de este puerto como nuevo.</span>
          </label>
        )}
        <p className="dialog__note">Si incumple una regla grave, seguirá apareciendo en tu resumen.</p>
        {error && <StatusNotice variant="error" title="No se pudo ignorar">{error}</StatusNotice>}
        <div className="dialog__actions">
          <Button ref={firstRef} variant="secondary" inline disabled={busy} onClick={onCancel}>Cancelar</Button>
          <Button inline loading={busy} onClick={() => onConfirm(normal && alert.can_mark_normal)}>Ignorar</Button>
        </div>
      </div>
    </div>
  );
}

export default function AlertaDetalle() {
  const { id } = useParams();
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "notfound" | "net">("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState(false);

  const load = useCallback(async () => {
    setState("loading");
    try {
      setAlert(await getAlert(id!));
      setState("ok");
    } catch (err) {
      setState(err instanceof ApiError && err.status === 404 ? "notfound" : "net");
    }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  async function change(status: AlertStatus, markNormal = false) {
    if (!alert) return;
    setBusy(true);
    setError(null);
    try {
      await updateAlert(alert.id, status, markNormal);
      setAlert({ ...alert, status });
      setDialog(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Algo salió mal. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  const back = <Link to="/alertas" className="back-link"><ArrowLeft size={17} aria-hidden />Todas las alertas</Link>;
  let body: ReactNode;
  if (state === "loading") {
    body = <div className="stack" aria-busy="true"><div className="skeleton" style={{ height: 200 }} /><div className="skeleton" style={{ height: 420 }} /></div>;
  } else if (state === "net") {
    body = <NetworkErrorCard onRetry={load} />;
  } else if (state === "notfound" || !alert) {
    body = (
      <section className="wcard wcard--center">
        <h2 className="wcard__title">No encontramos esta alerta</h2>
        <p className="wcard__text wcard__text--narrow">Puede que ya no exista o que no pertenezca a tu cuenta.</p>
      </section>
    );
  } else {
    const os = [OS_LABEL[alert.host.os_family] ?? alert.host.os_family, alert.host.os_version].filter(Boolean).join(" · ");
    const hasPort = alert.port !== null;
    const bind = alert.bind_address ? (PUBLIC_ADDR.has(alert.bind_address) ? `${alert.bind_address} · todas las interfaces` : alert.bind_address) : "No disponible";
    body = (
      <>
        <header className="alert-summary">
          <div className="alert-summary__ref">
            <span className="mono mono--ref">{alert.reference}</span>
            <StatusChip status={alert.status} />
          </div>
          <h1 className="alert-summary__title">{alert.title}</h1>
          {alert.event_label && <p className="alert-summary__type">{alert.event_label}</p>}
          <p className="alert-summary__when">{fmtDate(alert.created_at)}&nbsp; /&nbsp; {alert.host.name}</p>
          <div className="alert-summary__data">
            <SeverityBadge severity={alert.severity} />
            <span className="mono mono--ref">{hasPort ? `Puerto ${alert.port}/${(alert.protocol ?? "").toUpperCase()}` : "Puerto —"}</span>
            <span>Confianza {cap(alert.confidence)}</span>
            <span>{os}</span>
          </div>
        </header>

        <section className="wcard wcard--flush">
          <div className="alert-desc">
            <h2 className="wcard__subtitle wcard__subtitle--lg">Descripción de la alerta</h2>
            <p className="alert-desc__text">{alert.description}</p>
          </div>
          <Row label="Servicio">{alert.service ?? "No identificado"}</Row>
          <Row label="Protocolo">{hasPort && alert.protocol ? alert.protocol.toUpperCase() : "No aplica · sin puerto asociado"}</Row>
          {hasPort && <Row label="Dirección de enlace">{bind}</Row>}
          <Row label="Ejecutable" mono>{alert.exe_path ?? "No disponible"}</Row>
          <Row label="Usuario" mono>{alert.username ?? "Desconocido"}</Row>
          <Row label="Paquete">{alert.package ?? "Sin paquete asociado"}</Row>
          <Row label="Nivel de confianza">{alert.confidence_note}</Row>
          {alert.recommendation && <Row label="Recomendación">{alert.recommendation}</Row>}
          <div className="alert-notice">
            <div className="aviso aviso--info" role="note">
              <Info size={18} color="#285fdb" aria-hidden />
              <div>
                <p>Aviso</p>
                <p>Este resultado es un indicio, no una confirmación. Ninguna interpretación de hallazgo es 100% segura.</p>
              </div>
            </div>
          </div>
        </section>

        {error && !dialog && <StatusNotice variant="error" title="No se pudo cambiar el estado">{error}</StatusNotice>}
        <div className="finish">
          {alert.status === "nueva" ? (
            <>
              <Button inline loading={busy && !dialog} icon={<Check size={18} aria-hidden />} onClick={() => void change("atendida")}>Marcar como atendida</Button>
              <Button variant="secondary" inline disabled={busy} onClick={() => { setError(null); setDialog(true); }}>Ignorar alerta</Button>
            </>
          ) : (
            // Figma no define alertas ya resueltas: acción provisional para poder revertir un cambio.
            <Button variant="secondary" inline loading={busy} onClick={() => void change("nueva")}>Reabrir alerta</Button>
          )}
        </div>
        <p className="legend-small legend-small--md">Cambiar el estado organiza tu revisión. No modifica el equipo ni elimina el indicio.</p>
        {dialog && <IgnoreDialog alert={alert} busy={busy} error={error} onCancel={() => setDialog(false)} onConfirm={(m) => void change("ignorada", m)} />}
      </>
    );
  }

  return (
    <AppShell breadcrumb="Espacio personal / Alertas">
      {back}
      {body}
    </AppShell>
  );
}
