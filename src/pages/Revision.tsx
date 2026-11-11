// Figma: "03 · Primera revisión" — Resumen inicial (34:15365), Cargando (34:15599),
// Sin hallazgos (34:15720) y Error de red (34:15833).
import { Info, WifiOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { completeReview, getReview, setNormal } from "../api/auth";
import type { Finding, Review } from "../api/auth";
import { ApiError } from "../api/client";
import { fmtDate, OS_LABEL } from "../lib/format";
import { AppShell } from "../components/AppShell";
import { SeverityBadge, SeverityCounters, SeverityLegend } from "../components/Severity";
import { Button, StatusNotice } from "../components/ui";

const PUBLIC_ADDR = new Set(["0.0.0.0", "::", "*"]);

// Puntaje: Bueno 80–100, Regular 50–79, Crítico 0–49 (leyenda del Figma).
function scoreBand(score: number) {
  if (score >= 80) return { label: "Bueno", color: "#226e60", text: "Mantén la revisión periódica." };
  if (score >= 50) return { label: "Regular", color: "#805e0e", text: "Hay señales que conviene revisar." };
  // El Figma no trae el texto del rango crítico: redacción propia, confirmar.
  return { label: "Crítico", color: "#a52843", text: "Hay riesgos que conviene atender pronto." };
}

function Aviso({ tone, children }: { tone: "highlight" | "info"; children: ReactNode }) {
  return (
    <div className={`aviso aviso--${tone}`} role="note">
      <Info size={18} color="#285fdb" aria-hidden />
      <p>{children}</p>
    </div>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="switch">
      <button type="button" role="switch" aria-checked={checked} className={`switch__track${checked ? " switch__track--on" : ""}`} onClick={() => onChange(!checked)}>
        <span className="switch__knob" />
      </button>
      <span className="switch__label">{label}</span>
    </label>
  );
}

function FindingCard({ f, onToggle }: { f: Finding; onToggle: (v: boolean) => void }) {
  const bind = f.bind_address ? (PUBLIC_ADDR.has(f.bind_address) ? `${f.bind_address} · todas las interfaces` : f.bind_address) : null;
  return (
    <article className="finding">
      <header className="finding__head">
        <h3 className="finding__title">{f.title}</h3>
        <SeverityBadge severity={f.severity} />
        <span className="finding__conf">Confianza {f.confidence[0].toUpperCase() + f.confidence.slice(1)}</span>
      </header>
      {f.port !== null && (
        <div className="finding__row">
          <span className="finding__col mono">{f.port}/{(f.protocol ?? "").toUpperCase()}</span>
          <span className="finding__col finding__col--wide">Servicio: {f.service ?? "no identificado"}</span>
          {bind && <span className="finding__muted">{bind}</span>}
        </div>
      )}
      <div className="finding__row">
        <span className="finding__col">Proceso: {f.process ?? "no identificado"}</span>
        {f.exe_path && <span className="mono mono--sm">{f.exe_path}</span>}
      </div>
      <div className="finding__row">
        <span className="finding__col">Usuario: {f.username ?? "desconocido"}</span>
        <span>Paquete: {f.package ?? "sin paquete asociado"}</span>
      </div>
      <hr className="finding__sep" />
      <div className="finding__foot">
        <p className="finding__rec">{f.recommendation}</p>
        {f.can_mark_normal && <Switch checked={f.is_normal} onChange={onToggle} label="Es normal en este equipo" />}
      </div>
    </article>
  );
}

function Header({ review }: { review: Review | null }) {
  const host = review?.host;
  const os = host ? OS_LABEL[host.os_family] ?? host.os_family : "";
  return (
    <>
      <header className="form__header">
        {host && <p className="form__eyebrow">{`${host.name} / ${os}`.toUpperCase()}</p>}
        <h1 className="form__title">Primera revisión de tu equipo</h1>
        {host && <p className="form__subtitle">{[host.name, os, host.os_version].filter(Boolean).join(" · ")}</p>}
      </header>
      <div className="data-context">
        <span />
        {review && <span>Primer reporte · {fmtDate(review.received_at)}</span>}
      </div>
    </>
  );
}

function Skeleton() {
  return (
    <>
      <div className="eval" aria-busy="true">
        <div className="wcard"><div className="skel-bar skel-bar--lg" style={{ width: 160 }} /><div className="skeleton" style={{ height: 72, width: 230 }} /><div className="skel-bar" style={{ width: "70%" }} /></div>
        <div className="wcard wcard--dark"><div className="skeleton skeleton--dark" style={{ height: 28, width: 220 }} /><div className="skel-bar skel-bar--dark" style={{ width: 160 }} /><div className="skel-bar skel-bar--dark" style={{ width: "60%" }} /></div>
      </div>
      <section className="stack">
        <h2 className="sec-title">Hallazgos actuales</h2>
        <SeverityCounters counts={null} />
      </section>
      {[0, 1, 2].map((i) => (
        <div key={i} className="finding" aria-hidden>
          <div className="skel-bar skel-bar--lg" style={{ width: 460 }} /><div className="skel-bar" /><div className="skel-bar" /><div className="skel-bar" style={{ width: 700, maxWidth: "100%" }} />
        </div>
      ))}
    </>
  );
}

export default function Revision() {
  const navigate = useNavigate();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [netError, setNetError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNetError(false);
    try {
      setReview(await getReview());
    } catch (err) {
      // sin equipo o sin primer reporte: todavía no hay nada que revisar
      if (err instanceof ApiError && err.status === 404) return void navigate("/vincular", { replace: true });
      setNetError(true);
    } finally {
      setLoading(false);
    }
  }, [navigate]);
  useEffect(() => { void load(); }, [load]);

  async function toggle(index: number, value: boolean) {
    if (!review) return;
    const f = review.findings[index];
    const patch = (v: boolean) => setReview((r) => r && { ...r, findings: r.findings.map((x, i) => (i === index ? { ...x, is_normal: v } : x)) });
    patch(value); // optimista
    setError(null);
    try {
      await setNormal(f, value);
    } catch {
      patch(!value);
      setError("No pudimos guardar tu preferencia. Inténtalo de nuevo.");
    }
  }

  async function finish() {
    setFinishing(true);
    setError(null);
    try {
      await completeReview();
      navigate("/panel", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "No pudimos terminar la revisión. Inténtalo de nuevo.");
      setFinishing(false);
    }
  }

  let body: ReactNode;
  if (netError) {
    body = (
      <section className="wcard wcard--center">
        <WifiOff size={32} color="#285fdb" aria-hidden />
        <h2 className="wcard__title">No pudimos cargar la información</h2>
        <p className="wcard__text wcard__text--narrow">Revisa tu conexión a internet e inténtalo de nuevo. No se muestran datos que no pudimos recuperar.</p>
        <Button inline onClick={load}>Reintentar</Button>
      </section>
    );
  } else if (loading || !review) {
    body = <Skeleton />;
  } else {
    const band = review.score !== null ? scoreBand(review.score) : null;
    const none = review.findings.length === 0;
    body = (
      <>
        <div className="eval">
          <section className="wcard">
            <h2 className="wcard__subtitle">Puntaje · Primer reporte</h2>
            <div className="score">
              <p className="score__value">{review.score ?? "—"}<span className="score__max">/100</span></p>
              {band && (
                <div className="score__read">
                  <p style={{ color: band.color }} className="score__label">{band.label}</p>
                  <p className="score__text">{band.text}</p>
                </div>
              )}
            </div>
            <hr className="finding__sep" />
            <p className="legend-small">Bueno 80–100 · Regular 50–79 · Crítico 0–49</p>
          </section>
          <section className="wcard wcard--dark">
            <p className="host-dark__name">{review.host.name}</p>
            <p className="host-dark__os">{[OS_LABEL[review.host.os_family] ?? review.host.os_family, review.host.os_version].filter(Boolean).join(" · ")}</p>
            <p className="host-dark__muted">Último reporte</p>
            <p className="host-dark__last">{fmtDate(review.received_at)}</p>
            <p className="host-dark__small">El agente envía reportes cada 30–60 s.</p>
          </section>
        </div>

        <section className="stack">
          <h2 className="sec-title">Hallazgos actuales</h2>
          <SeverityCounters counts={review.counts} />
        </section>

        {none ? (
          <section className="wcard">
            <h2 className="wcard__title wcard__title--lg">No hay hallazgos actuales en este reporte</h2>
            <p className="wcard__text">No encontramos riesgos calculados que mostrar con la información disponible. Esto no confirma que el equipo esté libre de riesgos.</p>
          </section>
        ) : (
          <>
            <Aviso tone="highlight">
              Estos hallazgos ya existían cuando instalaste el agente, por eso no generaron alertas. A partir de ahora te avisaremos solo de los cambios.
            </Aviso>
            <div className="findings">
              {review.findings.map((f, i) => <FindingCard key={`${f.title}-${i}`} f={f} onToggle={(v) => void toggle(i, v)} />)}
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <AppShell breadcrumb="Espacio personal / Panel" activePanel>
      <Header review={netError ? null : review} />
      {body}
      {!netError && (
        <>
          {review && review.findings.length === 0 && <SeverityLegend />}
          <p className="legend-small legend-small--md">Severidad: impacto potencial del hallazgo. Confianza: certeza del indicio. Son dos medidas distintas.</p>
          <Aviso tone="info">Este resultado es un indicio, no una confirmación. Ninguna interpretación de hallazgo es 100% segura.</Aviso>
          {error && <StatusNotice variant="error" title="Algo salió mal">{error}</StatusNotice>}
          <div className="finish">
            <Button inline disabled={loading || !review} loading={finishing} onClick={finish}>Terminar revisión</Button>
            <div>
              <p className="finish__help">Puedes cambiar esto después en Puertos.</p>
              <p className="finish__small">Al terminar, continuarás al Panel.</p>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
