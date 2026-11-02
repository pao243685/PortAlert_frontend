
import { ArrowRight, Check, CircleDot, Copy, Monitor, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { createEnrollToken, installerUrl, listHosts } from "../api/auth";
import type { EnrollToken, Host, InstallerOS } from "../api/auth";
import { API_URL, ApiError } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Button, StatusNotice } from "../components/ui";

const OS_LABEL: Record<InstallerOS, string> = { linux: "Linux", windows: "Windows" };
const detectOS = (): InstallerOS => (/windows/i.test(navigator.userAgent) ? "windows" : "linux");

type Phase = "idle" | "preparing" | "ready" | "waiting";
type Status = "done" | "active" | "pending";
const STATUS_TEXT: Record<Status, string> = { done: "Completado", active: "En curso", pending: "Pendiente" };
const STEP_TITLES = ["1 Descargar el instalador", "2 Ejecutar el instalador", "3 Confirmación en vivo"];

function Steps({ active }: { active: 0 | 1 | 2 | 3 }) {
  // active: 1..3 = paso en curso; 0 = todo completado
  return (
    <ol className="steps" aria-label="Progreso">
      {STEP_TITLES.map((title, i) => {
        const n = i + 1;
        const status: Status = active === 0 || n < active ? "done" : n === active ? "active" : "pending";
        return (
          <li key={n} className={`step step--${status}`} aria-current={status === "active" ? "step" : undefined}>
            <span className="step__dot">{status === "done" ? <Check size={14} aria-hidden /> : n}</span>
            <span className="step__text">
              <span className="step__title">{title}</span>
              <span className="step__status">{STATUS_TEXT[status]}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function HostCard({ host }: { host: Host }) {
  return (
    <div className="hostcard">
      <p className="hostcard__name"><Monitor size={22} aria-hidden />{host.name}</p>
      <p className="hostcard__os">{[OS_LABEL[host.os_family as InstallerOS] ?? host.os_family, host.os_version].filter(Boolean).join(" · ")}</p>
      <p className="hostcard__meta">Detectado automáticamente · Solo lectura · Tu único equipo</p>
    </div>
  );
}

function Card({ title, children, wide }: { title?: string; children: ReactNode; wide?: boolean }) {
  return (
    <section className={`wcard${wide ? " wcard--wide" : ""}`}>
      {title && <h2 className="wcard__title">{title}</h2>}
      {children}
    </section>
  );
}

export default function Vincular() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const [os, setOs] = useState<InstallerOS>(detectOS);
  const [choosingOs, setChoosingOs] = useState(false);
  const [token, setToken] = useState<EnrollToken | null>(null);
  const [host, setHost] = useState<Host | null>(null);
  const [expired, setExpired] = useState(false);
  const [netError, setNetError] = useState<string | null>(null);
  const [pollError, setPollError] = useState(false);
  const [copied, setCopied] = useState(false);

  const refreshHost = useCallback(async () => {
    try {
      const hosts = await listHosts();
      setHost(hosts[0] ?? null);
      setPollError(false);
    } catch {
      setPollError(true);
    }
  }, []);

  useEffect(() => { void refreshHost(); }, [refreshHost]);

  const polling = !host ? phase === "ready" || phase === "waiting" : host.score === null;
  useEffect(() => {
    if (!polling) return;
    const id = setInterval(() => void refreshHost(), 3000);
    return () => clearInterval(id);
  }, [polling, refreshHost]);

  useEffect(() => {
    if (!token || host) return;
    const left = new Date(token.expires_at).getTime() - Date.now();
    if (left <= 0) { setExpired(true); return; }
    const id = setTimeout(() => setExpired(true), left);
    return () => clearTimeout(id);
  }, [token, host]);

  async function generate() {
    setNetError(null);
    setExpired(false);
    setCopied(false);
    setPhase("preparing");
    try {
      const t = await createEnrollToken();
      setToken(t);
      const a = document.createElement("a"); // el backend responde con Content-Disposition: attachment
      a.href = installerUrl(t.enroll_token, os, API_URL);
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setPhase("ready");
    } catch (err) {
      setPhase("idle");
      if (err instanceof ApiError && err.status === 409) return void refreshHost(); // ya hay equipo
      setNetError(err instanceof ApiError && err.status !== 0 ? err.detail : "network");
    }
  }

  const command = token
    ? os === "linux"
      ? `curl -fsSLO ${installerUrl(token.enroll_token, "linux", API_URL)} && sudo bash instalar-${token.enroll_token}.sh`
      : `powershell -NoProfile -ExecutionPolicy Bypass -Command "iwr '${installerUrl(token.enroll_token, "windows", API_URL)}' -OutFile instalar.ps1; .\\instalar.ps1"`
    : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
    }
    setCopied(true);
    setPhase("waiting"); 
  }

  const osPicker = choosingOs ? (
    <div className="stack" role="radiogroup" aria-label="Sistema operativo">
      {(Object.keys(OS_LABEL) as InstallerOS[]).map((k) => (
        <button
          key={k} type="button" role="radio" aria-checked={os === k}
          className={`os${os === k ? " os--selected" : ""}`}
          onClick={() => { setOs(k); setChoosingOs(false); }}
        >
          <CircleDot size={20} aria-hidden /><span className="os__name">{OS_LABEL[k]}</span><span className="os__id">{k}</span>
        </button>
      ))}
    </div>
  ) : (
    <div className="stack">
      <p className="field__label">Sistema operativo detectado en este navegador</p>
      <div className="os os--selected">
        <CircleDot size={20} aria-hidden /><span className="os__name">{OS_LABEL[os]}</span><span className="os__id">{os}</span>
      </div>
    </div>
  );
  const changeOs = <button type="button" className="link-underline" onClick={() => setChoosingOs((c) => !c)}>Cambiar sistema operativo</button>;
  
  let active: 0 | 1 | 2 | 3 = 1;
  let body: ReactNode;

  if (host) {
    const reported = host.score !== null;
    active = reported ? 0 : 3;
    body = reported ? (
      <Card wide>
        <StatusNotice variant="success" title="Todo listo">Equipo vinculado y primer reporte recibido. Ya puedes abrir el panel de tu equipo.</StatusNotice>
        <HostCard host={host} />
        <p className="wcard__text wcard__text--small">La configuración de tu único equipo está completada. Consulta en el panel los datos del reporte recibido.</p>
        <Button icon={<ArrowRight size={18} aria-hidden />} onClick={() => navigate("/panel")}>Ver resumen de mi equipo</Button>
      </Card>
    ) : (
      <Card title="Confirmación en vivo" wide>
        <StatusNotice variant="success" title="Equipo vinculado">El instalador se conectó y detectó tu único equipo.</StatusNotice>
        <HostCard host={host} />
        <StatusNotice variant="info" title="Esperando el primer reporte" spinner>
          La vinculación está confirmada. Aún no hay un reporte disponible para mostrar el panel.
        </StatusNotice>
        <Button className="btn--wizard" disabled>Ir al panel</Button>
      </Card>
    );
  } else if (netError) {
    body = (
      <Card title="Descargar el instalador" wide>
        <StatusNotice variant="error" title="No pudimos conectar">
          {netError === "network"
            ? "Un problema de red impidió preparar el instalador y consultar la vinculación. Comprueba la conexión a internet del navegador y vuelve a intentarlo."
            : netError}
        </StatusNotice>
        <p className="wcard__text wcard__text--small">Este error no indica el estado del agente ni confirma si tu equipo está vinculado.</p>
        <Button icon={<RefreshCw size={18} aria-hidden />} onClick={generate}>Reintentar</Button>
      </Card>
    );
  } else if (expired && phase === "waiting") {
    active = 2;
    body = (
      <Card title="El instalador venció o ya se usó" wide>
        <StatusNotice variant="error" title="El instalador venció o ya se usó">Genera uno nuevo y vuelve a ejecutarlo</StatusNotice>
        <p className="wcard__text wcard__text--small">Genera uno nuevo y vuelve a ejecutarlo</p>
        <Button icon={<RefreshCw size={18} aria-hidden />} onClick={generate}>Generar nuevo instalador</Button>
        <Button variant="secondary" className="btn--blue" onClick={() => void refreshHost()}>Reintentar</Button>
      </Card>
    );
  } else if (expired) {
    body = (
      <Card title="Descargar el instalador" wide>
        <StatusNotice variant="warning" title="El instalador venció">El enlace de vinculación de un solo uso venció. Genera un nuevo instalador para continuar.</StatusNotice>
        <Button icon={<RefreshCw size={18} aria-hidden />} onClick={generate}>Generar nuevo instalador</Button>
        <p className="wcard__text wcard__text--small">Se preparará una nueva descarga para tu cuenta. El equipo se vinculará cuando ejecutes el nuevo instalador y este se conecte.</p>
      </Card>
    );
  } else if (phase === "preparing") {
    body = (
      <Card title="Descargar el instalador" wide>
        <StatusNotice variant="info" title="Preparando tu instalador..." spinner>Estamos preparando la descarga para tu cuenta. Espera un momento antes de continuar.</StatusNotice>
        <div className="skel-box" aria-hidden><div className="skel-bar skel-bar--lg" /><div className="skel-bar" /></div>
        <Button className="btn--wizard" disabled>Preparando descarga</Button>
        <p className="wcard__text wcard__text--small">La descarga estará disponible cuando termine la preparación. Todavía no hay un equipo vinculado.</p>
      </Card>
    );
  } else if (phase === "ready") {
    active = 2;
    body = (
      <>
        <StatusNotice variant="success" title="Descarga completada">Ahora ejecuta el instalador. Tu equipo todavía no está vinculado; esperamos a que el instalador se conecte.</StatusNotice>
        <Card>
          <p className="os-title"><Monitor size={20} color="#285fdb" aria-hidden />{OS_LABEL[os]}</p>
          {changeOs}
          {choosingOs && osPicker}
          <p className="wcard__text wcard__text--ink">{os === "linux" ? "Pega este comando en una terminal:" : "Pega este comando en PowerShell, abierto como administrador:"}</p>
          <div className="cmd">
            <p className="cmd__text">{command}</p>
            <Button variant="secondary" className="btn--blue" icon={<Copy size={16} aria-hidden />} onClick={copy}>{copied ? "Copiado" : "Copiar"}</Button>
          </div>
          {pollError && <StatusNotice variant="error" title="No pudimos consultar la vinculación">Reintentando automáticamente.</StatusNotice>}
        </Card>
      </>
    );
  } else if (phase === "waiting") {
    active = 3;
    body = (
      <Card title="Confirmación en vivo" wide>
        <p className="wcard__text">Después de ejecutar el instalador, el equipo se detectará automáticamente.</p>
        <StatusNotice variant="info" title="Esperando que el instalador se conecte..." spinner>
          Todavía no hay un equipo vinculado. Continuaremos automáticamente cuando el instalador se conecte; no necesitas introducir datos del equipo.
        </StatusNotice>
        {pollError && <StatusNotice variant="error" title="No pudimos consultar la vinculación">Reintentando automáticamente.</StatusNotice>}
        <p className="wcard__text wcard__text--small">Mantén abierta esta página y termina de ejecutar el instalador en tu computadora.</p>
        <Button className="btn--wizard" disabled>Ir al panel</Button>
        <button type="button" className="link-underline" onClick={() => setPhase("ready")}>Volver a ver el comando</button>
      </Card>
    );
  } else {
    body = (
      <div className="cols">
        <Card title="Descargar el instalador">
          <p className="wcard__text">El instalador incluye un enlace de vinculación de un solo uso que vence en 10 minutos. No necesitas instalar Python.</p>
          {osPicker}
          <div className="stack">
            <Button onClick={generate}>Descargar instalador para {OS_LABEL[os]}</Button>
            {changeOs}
            <p className="wcard__text wcard__text--small">Descarga en un clic. La vinculación se completa cuando ejecutas el instalador y este se conecta, no al descargarlo.</p>
          </div>
        </Card>
        <Card title="Después de descargar">
          <p className="wcard__text">Ejecuta el instalador en la computadora que quieres proteger. El equipo se vinculará cuando se conecte.</p>
          <StatusNotice variant="info" title="La descarga no vincula el equipo">La confirmación llegará automáticamente cuando el instalador se conecte a tu cuenta.</StatusNotice>
        </Card>
      </div>
    );
  }

  const stepNumber = active === 0 ? 3 : active;
  return (
    <AppShell breadcrumb="Espacio personal / Primeros pasos">
      <div className="wizard">
        <header className="form__header">
          <p className="form__eyebrow">CONFIGURACIÓN INICIAL / 0{stepNumber}</p>
          <h1 className="form__title">Vincula tu equipo</h1>
          <p className="form__subtitle">Cada usuario puede vincular un solo equipo. Si reinstalas, volverás al paso 1 para el mismo equipo.</p>
        </header>
        <Steps active={active} />
      </div>
      {body}
    </AppShell>
  );
}