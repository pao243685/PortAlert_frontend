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

const UNINSTALL_COMMAND = "sudo portalert-agent uninstall";

function errorText(err: unknown): string {
  return err instanceof ApiError && err.status !== 0
    ? err.detail
    : "No pudimos conectar con el servidor. Revisa tu conexión.";
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

function CommandLine() {
  const { copied, copy } = useCopy(UNINSTALL_COMMAND);
  return (
    <div className="cmdline">
      <code>{UNINSTALL_COMMAND}</code>
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
          <p className="wcard__text wcard__text--small">Configuración › Aplicaciones, busca «PortAlert Agent» y selecciona Desinstalar.</p>
        </div>
        <div className="uninstall__os">
          <p className="uninstall__head"><Terminal size={14} aria-hidden />Linux</p>
          <p className="wcard__text wcard__text--small">Ejecuta el siguiente comando en la terminal:</p>
          <CommandLine />
        </div>
      </div>
      <div className="actions">
        <Button inline variant="secondary" icon={<Trash2 size={18} aria-hidden />} onClick={onUnlink}>Desvincular equipo</Button>
      </div>
    </section>
  );
}

function UnlinkDialog({
  hostName, busy, error, onCancel, onConfirm,
}: { hostName: string; busy: boolean; error: string | null; onCancel: () => void; onConfirm: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { copied, copy } = useCopy(UNINSTALL_COMMAND);

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
          <p>Para volver a usar PortAlert con este equipo, tendrás que vincularlo de nuevo mediante el instalador. El agente instalado debe desinstalarse aparte.</p>
        </div>
        <div className="confirm__steps">
          <p className="confirm__steps-title">Después de desvincular</p>
          <div className="confirm__box">
            <p className="confirm__box-title">Windows</p>
            <p className="confirm__box-text">1. Abre <strong>Configuración</strong> &gt; <strong>Aplicaciones</strong> y desinstala el agente.</p>
          </div>
          <div className="confirm__box">
            <p className="confirm__box-title">Linux</p>
            <p className="confirm__box-text confirm__box-text--mono">{UNINSTALL_COMMAND}</p>
            <button type="button" className="confirm__copy" onClick={copy}><Copy size={14} aria-hidden />{copied ? "Copiado" : "Copiar"}</button>
          </div>
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
