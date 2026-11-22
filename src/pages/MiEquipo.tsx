import { CircleCheck, CircleX, Copy, Info, Laptop, Loader2, Monitor, Terminal, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteHost, getPanel } from "../api/auth";
import type { PanelData } from "../api/auth";
import { ApiError } from "../api/client";
import {
  createTelegramLink,
  getTelegramStatus,
  removeTelegramLink,
  sendTelegramTest,
} from "../api/telegram";
import type { TelegramStatus } from "../api/telegram";
import { AppShell } from "../components/AppShell";
import { Button, NetworkErrorCard } from "../components/ui";
import { agoLabel, fmtDate, OS_LABEL } from "../lib/format";

const LINUX_UNINSTALL =
  "sudo systemctl disable --now portalert-agent && sudo rm -f /etc/systemd/system/portalert-agent.service /usr/local/bin/portalert-agent && sudo rm -rf /etc/portalert && sudo systemctl daemon-reload";
const WINDOWS_UNINSTALL =
  "Unregister-ScheduledTask -TaskName PortAlertAgent -Confirm:$false -ErrorAction SilentlyContinue; for ($i=0; $i -lt 5; $i++) { Stop-Process -Name portalert-agent -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 2; Remove-Item -Recurse -Force \"$env:ProgramFiles\\PortAlert\",\"$env:ProgramData\\PortAlert\" -ErrorAction SilentlyContinue; if (-not (Test-Path \"$env:ProgramFiles\\PortAlert\")) { break } }; [Environment]::SetEnvironmentVariable('PORTALERT_CONFIG',$null,'Machine'); if (Test-Path \"$env:ProgramFiles\\PortAlert\") { Write-Host 'No se pudo borrar todo. Reinicia el equipo y vuelve a ejecutar este comando.' -ForegroundColor Yellow } else { Write-Host 'PortAlert se quitó por completo de este equipo.' -ForegroundColor Green }";

const REACTIVAR = {
  windows: {
    pasos: "Abre PowerShell como administrador y ejecuta:",
    comando:
      "$s = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Seconds 0) -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries; Set-ScheduledTask -TaskName PortAlertAgent -Settings $s | Out-Null; Start-ScheduledTask -TaskName PortAlertAgent",
  },
  linux: {
    pasos: "En la terminal ejecuta:",
    comando: "sudo systemctl restart portalert-agent",
  },
} as const;

function errorText(err: unknown): string {
  return err instanceof ApiError && err.status !== 0
    ? err.detail
    : "No pudimos conectar con el servidor. Revisa tu conexión.";
}

function manualStart(url: string): { bot: string; command: string } | null {
  try {
    const u = new URL(url);
    const token = u.searchParams.get("start");
    return token ? { bot: u.pathname.slice(1), command: `/start ${token}` } : null;
  } catch {
    return null;
  }
}

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return { copied, copy };
}

function AgentBadge({ status }: { status: PanelData["agent_status"] }) {
  if (status === "conectado") {
    return <span className="badge"><span aria-hidden>● ✓ </span>Estado del agente: Conectado</span>;
  }
  if (status === "sin_conexion") {
    return <span className="badge badge--down"><span aria-hidden>● ! </span>Estado del agente: Sin conexión</span>;
  }
  return <span className="badge badge--idle"><span aria-hidden>○ </span>Esperando el primer reporte</span>;
}

function TeamCard({ data }: { data: PanelData }) {
  const { host, latest, agent_status } = data;
  const os = OS_LABEL[host.os_family] ?? host.os_family;
  return (
    <section className="team" aria-label="Información del equipo">
      <div className="team__id">
        <span className="team__icon"><Laptop size={28} aria-hidden /></span>
        <div className="team__who">
          <p className="team__name">{host.name}<AgentBadge status={agent_status} /></p>
          <p className="team__meta">Detectado automáticamente · Solo lectura</p>
        </div>
      </div>
      <hr className="team__sep" />
      <div className="team__info">
        <div className="team__datum">
          <p className="team__label">Sistema operativo</p>
          <p className="team__value">{os}</p>
          <p className="team__detail">{[host.os_version, host.os_family].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="team__datum">
          <p className="team__label">Último reporte del agente</p>
          <p className="team__value">{latest ? agoLabel(latest.seconds_ago) : "Sin reportes"}</p>
          <p className="team__detail">{latest ? fmtDate(latest.received_at) : "Aún no llega el primer reporte"}</p>
        </div>
        <div className="team__datum">
          <p className="team__label">Frecuencia del agente</p>
          <p className="team__value">30–60 segundos</p>
          <p className="team__detail">Entre cada envío de reportes</p>
        </div>
      </div>
    </section>
  );
}

function ReconnectCard({ data, checking, onCheck }: { data: PanelData; checking: boolean; onCheck: () => void }) {
  const guia = REACTIVAR[data.host.os_family as keyof typeof REACTIVAR];
  return (
    <section className="wcard" aria-labelledby="reconnect-title">
      <div className="wcard__head">
        <h2 className="wcard__subtitle wcard__subtitle--lg" id="reconnect-title">El agente no está reportando</h2>
        <p className="wcard__text">
          {data.latest ? `El último reporte llegó ${agoLabel(data.latest.seconds_ago)}. ` : ""}
          Puede ser que el equipo esté apagado o suspendido, sin internet, o que el agente se haya detenido. PortAlert no puede saber cuál fue.
        </p>
      </div>
      <div className="tgstate tgstate--warn">
        <p className="tgstate__row"><Info size={20} aria-hidden />Cómo reactivarlo</p>
        <p className="tgstate__text">1. Confirma que el equipo esté encendido y con internet.</p>
        {guia ? (
          <>
            <p className="tgstate__text">2. {guia.pasos}</p>
            <CommandLine text={guia.comando} />
          </>
        ) : (
          <p className="tgstate__text">2. Reinicia el servicio del agente desde tu sistema.</p>
        )}
        <p className="tgstate__text">3. Espera uno o dos minutos. Esta página se actualiza sola y pasará a Conectado.</p>
        <p className="tgstate__text">Si sigue sin conectarse, desvincula el equipo más abajo e instala el agente de nuevo.</p>
      </div>
      <div className="actions">
        <Button inline variant="secondary" loading={checking} onClick={onCheck}>Comprobar ahora</Button>
      </div>
    </section>
  );
}

function TelegramCard() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<"link" | "test" | "remove" | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [loadError, setLoadError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const s = await getTelegramStatus();
      setStatus(s);
      if (s.state !== "pending") setUrl(null);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const pending = status?.state === "pending";
  useEffect(() => {
    if (!pending) return;
    const id = setInterval(() => void refresh(), 3000);
    return () => clearInterval(id);
  }, [pending, refresh]);

  async function generate() {
    setBusy("link");
    setFeedback(null);
    try {
      const link = await createTelegramLink();
      setUrl(link.url);
      await refresh();
    } catch (err) {
      setFeedback({ ok: false, text: errorText(err) });
    } finally {
      setBusy(null);
    }
  }

  async function sendTest() {
    setBusy("test");
    setFeedback(null);
    try {
      await sendTelegramTest();
      setFeedback({ ok: true, text: "Enviamos el mensaje de prueba. Revisa tu chat con el bot." });
    } catch (err) {
      setFeedback({ ok: false, text: errorText(err) });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("remove");
    setFeedback(null);
    try {
      await removeTelegramLink();
      setUrl(null);
      await refresh();
    } catch (err) {
      setFeedback({ ok: false, text: errorText(err) });
    } finally {
      setBusy(null);
    }
  }

  const manual = url ? manualStart(url) : null;
  let box;
  let actions;

  if (!status) {
    box = (
      <div className="tgstate" aria-busy>
        <p className="tgstate__row"><Loader2 size={20} className="spin tgstate__spin" aria-hidden />Consultando el estado de Telegram</p>
      </div>
    );
  } else if (!status.available) {
    box = (
      <div className="tgstate">
        <p className="tgstate__row"><Info size={20} aria-hidden />Notificaciones no disponibles</p>
        <p className="tgstate__text">Las notificaciones por Telegram no están disponibles todavía.</p>
      </div>
    );
  } else if (status.state === "linked") {
    box = (
      <div className="tgstate tgstate--ok">
        <p className="tgstate__row"><CircleCheck size={20} aria-hidden />Telegram conectado</p>
        <p className="tgstate__text">Recibirás las alertas de tu equipo en el chat con el bot.</p>
      </div>
    );
    actions = (
      <>
        <Button inline loading={busy === "test"} disabled={busy !== null} onClick={sendTest}>Enviar mensaje de prueba</Button>
        <Button inline variant="secondary" loading={busy === "remove"} disabled={busy !== null} onClick={remove}>Desconectar</Button>
      </>
    );
  } else if (status.state === "pending") {
    box = (
      <div className="tgstate">
        <p className="tgstate__row"><Loader2 size={20} className="spin tgstate__spin" aria-hidden />Esperando conexión con Telegram</p>
        <p className="tgstate__text">Abre el enlace, pulsa Iniciar en el chat con el bot y vuelve aquí. El enlace vence en 10 minutos.</p>
        {manual && (
          <>
            <p className="tgstate__text">¿Telegram Web no avanza al abrir el enlace? Abre el chat con @{manual.bot} y envía este mensaje tal cual:</p>
            <CommandLine text={manual.command} />
          </>
        )}
      </div>
    );
    actions = (
      <>
        {url ? (
          <a className="btn btn--primary btn--inline" href={url} target="_blank" rel="noopener noreferrer">Abrir Telegram</a>
        ) : (
          <Button inline loading={busy === "link"} disabled={busy !== null} onClick={generate}>Generar nuevo enlace</Button>
        )}
        <Button inline variant="secondary" loading={busy === "remove"} disabled={busy !== null} onClick={remove}>Cancelar</Button>
      </>
    );
  } else if (status.state === "expired") {
    box = (
      <div className="tgstate tgstate--error">
        <p className="tgstate__row"><CircleX size={20} aria-hidden />El enlace venció o ya se usó</p>
      </div>
    );
    actions = <Button inline loading={busy === "link"} disabled={busy !== null} onClick={generate}>Generar nuevo enlace</Button>;
  } else {
    box = (
      <div className="tgstate">
        <p className="tgstate__row"><Info size={20} aria-hidden />Telegram no conectado</p>
        <p className="tgstate__text">Genera un enlace, ábrelo en Telegram y pulsa Iniciar en el chat con el bot. El enlace vence en 10 minutos.</p>
      </div>
    );
    actions = <Button inline loading={busy === "link"} disabled={busy !== null} onClick={generate}>Conectar Telegram</Button>;
  }

  return (
    <section className="wcard" aria-labelledby="tg-title">
      <div className="wcard__head">
        <h2 className="wcard__subtitle wcard__subtitle--lg" id="tg-title">Notificaciones por Telegram</h2>
        <p className="wcard__text">Recibe avisos al instante en tu teléfono.</p>
      </div>
      {loadError ? (
        <div className="tgstate tgstate--error" role="alert">
          <p className="tgstate__row"><CircleX size={20} aria-hidden />No pudimos consultar el estado de Telegram</p>
        </div>
      ) : box}
      {feedback && (
        <p className={`tgfeedback${feedback.ok ? "" : " tgfeedback--error"}`} role={feedback.ok ? "status" : "alert"}>{feedback.text}</p>
      )}
      {loadError ? (
        <div className="actions"><Button inline onClick={() => void refresh()}>Reintentar</Button></div>
      ) : actions && <div className="actions">{actions}</div>}
    </section>
  );
}

function CommandLine({ text }: { text: string }) {
  const { copied, copy } = useCopy(text);
  return (
    <div className="cmdline">
      <code>{text}</code>
      <Button inline variant="secondary" icon={<Copy size={16} aria-hidden />} onClick={copy}>{copied ? "Copiado" : "Copiar"}</Button>
    </div>
  );
}

function ManageCard({ onUnlink }: { onUnlink: () => void }) {
  return (
    <section className="manage" aria-labelledby="manage-title">
      <div className="wcard__head">
        <h2 className="wcard__subtitle wcard__subtitle--lg" id="manage-title">Desvincular equipo</h2>
        <p className="wcard__text wcard__text--small">Se eliminarán el equipo, sus reportes y todas sus alertas. Para volver a usarlo tendrás que vincularlo de nuevo. El agente instalado en el sistema no se desinstala automáticamente.</p>
      </div>
      <div className="uninstall">
        <p className="uninstall__title">Cómo desinstalar el agente</p>
        <div className="uninstall__os">
          <p className="uninstall__head"><Monitor size={14} aria-hidden />Windows</p>
          <p className="wcard__text wcard__text--small">Abre PowerShell como administrador, pega el comando y espera unos segundos. Al terminar debe aparecer “PortAlert se quitó por completo de este equipo” en verde. Si aparece un aviso amarillo, reinicia el equipo y vuelve a ejecutar el comando.</p>
          <CommandLine text={WINDOWS_UNINSTALL} />
        </div>
        <div className="uninstall__os">
          <p className="uninstall__head"><Terminal size={14} aria-hidden />Linux</p>
          <p className="wcard__text wcard__text--small">Ejecuta el siguiente comando en la terminal:</p>
          <CommandLine text={LINUX_UNINSTALL} />
        </div>
      </div>
      <div className="actions">
        <Button inline variant="secondary" icon={<Trash2 size={18} aria-hidden />} onClick={onUnlink}>Desvincular equipo</Button>
      </div>
    </section>
  );
}

function CopyBox({ title, text }: { title: string; text: string }) {
  const { copied, copy } = useCopy(text);
  return (
    <div className="confirm__box">
      <p className="confirm__box-title">{title}</p>
      <p className="confirm__box-text confirm__box-text--mono">{text}</p>
      <button type="button" className="confirm__copy" onClick={copy}><Copy size={14} aria-hidden />{copied ? "Copiado" : "Copiar"}</button>
    </div>
  );
}

function UnlinkDialog({
  hostName, busy, error, onCancel, onConfirm,
}: { hostName: string; busy: boolean; error: string | null; onCancel: () => void; onConfirm: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div className="overlay">
      <div className="confirm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <span className="confirm__symbol"><Trash2 size={22} color="#b32d45" aria-hidden /></span>
        <div className="confirm__head">
          <h2 className="confirm__title" id="confirm-title">¿Desvincular tu equipo?</h2>
          <p className="confirm__name">{hostName}</p>
          <p className="confirm__text">Se borrarán todos los reportes y las alertas de este equipo. Esta acción no se puede deshacer.</p>
        </div>
        <div className="confirm__note" role="note">
          <Info size={18} color="#285fdb" aria-hidden />
          <p>Para volver a usar PortAlert con este equipo, tendrás que vincularlo de nuevo con el instalador. El agente instalado se quita aparte con los comandos de abajo.</p>
        </div>
        <div className="confirm__steps">
          <p className="confirm__steps-title">Después de desvincular</p>
          <p className="confirm__text">En Windows, al terminar debe aparecer “PortAlert se quitó por completo de este equipo” en verde. Si aparece un aviso amarillo, reinicia el equipo y vuelve a ejecutar el comando.</p>
          <CopyBox title="Windows (PowerShell como administrador)" text={WINDOWS_UNINSTALL} />
          <CopyBox title="Linux (terminal)" text={LINUX_UNINSTALL} />
        </div>
        {error && <p className="tgfeedback tgfeedback--error" role="alert">{error}</p>}
        <div className="confirm__actions">
          <Button ref={cancelRef} inline variant="secondary" disabled={busy} onClick={onCancel}>Cancelar</Button>
          <Button inline className="btn--danger" loading={busy} onClick={onConfirm}>Desvincular equipo</Button>
        </div>
      </div>
    </div>
  );
}

export default function MiEquipo() {
  const navigate = useNavigate();
  const [data, setData] = useState<PanelData | null>(null);
  const [failed, setFailed] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      setData(await getPanel());
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        navigate("/vincular", { replace: true });
        return;
      }
      setFailed(true);
    }
  }, [navigate]);

  useEffect(() => { void load(); }, [load]);

  const down = data?.agent_status === "sin_conexion";
  useEffect(() => {
    if (!down) return;
    const id = setInterval(() => void load(), 15000);
    return () => clearInterval(id);
  }, [down, load]);

  async function check() {
    setChecking(true);
    await load();
    setChecking(false);
  }

  const closeDialog = useCallback(() => {
    setDialog(false);
    setUnlinkError(null);
  }, []);

  async function unlink() {
    if (!data) return;
    setUnlinking(true);
    setUnlinkError(null);
    try {
      await deleteHost(data.host.id);
      navigate("/vincular", { replace: true });
    } catch (err) {
      setUnlinkError(errorText(err));
      setUnlinking(false);
    }
  }

  return (
    <AppShell breadcrumb="Espacio personal / Mi equipo">
      <header className="form__header">
        <p className="form__eyebrow">ESPACIO PERSONAL</p>
        <h1 className="form__title">Mi equipo</h1>
        <p className="form__subtitle">La información de tu único equipo vinculado.</p>
      </header>
      {failed ? (
        <NetworkErrorCard onRetry={load} />
      ) : !data ? (
        <div className="skel-box" aria-busy aria-label="Cargando">
          <div className="skel-bar skel-bar--lg" />
          <div className="skel-bar" />
          <div className="skel-bar" />
        </div>
      ) : (
        <>
          <TeamCard data={data} />
          {down && <ReconnectCard data={data} checking={checking} onCheck={check} />}
          <TelegramCard />
          <ManageCard onUnlink={() => setDialog(true)} />
          <p className="form__note">PortAlert está pensado exclusivamente para tu propio equipo.</p>
          {dialog && (
            <UnlinkDialog
              hostName={data.host.name}
              busy={unlinking}
              error={unlinkError}
              onCancel={closeDialog}
              onConfirm={unlink}
            />
          )}
        </>
      )}
    </AppShell>
  );
}
