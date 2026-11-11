import { FileLock2, Lock, Monitor, RefreshCw, Shield } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({ children, showSession = false }: { children: ReactNode; showSession?: boolean }) {
  return (
    <div className="shell">
      <aside className="brand">
        <div className="brand__logo">
          <span className="brand__symbol"><Shield size={20} color="#fff" aria-hidden /></span>
          <span>PortAlert</span>
        </div>
        <div className="brand__promise">
          <p className="brand__kicker">TU EQUIPO. BAJO OBSERVACIÓN.</p>
          <h2 className="brand__title">Entiende las señales.<br />Decide con calma.</h2>
          <p className="brand__desc">
            Puertos abiertos y anomalías en ejecutables de tu equipo personal, en un solo lugar.
          </p>
        </div>
        <div className="brand__principles">
          <div className="brand__principle"><Monitor size={20} aria-hidden /><span>Un único equipo, el tuyo</span></div>
          <div className="brand__principle"><RefreshCw size={20} aria-hidden /><span>Reportes del agente cada 30–60 s</span></div>
          <div className="brand__principle"><FileLock2 size={20} aria-hidden /><span>Sin leer el contenido de tus archivos</span></div>
        </div>
        <div className="brand__signature">
          <p>PORTALERT</p>
          <p>Visibilidad sin falsas certezas.</p>
        </div>
      </aside>
      <main className="main">
        {children}
        {showSession && (
          <div className="session-note"><Lock size={14} aria-hidden /><span>Tu sesión dura 60 minutos.</span></div>
        )}
        <p className="privacy">
          Monitorea únicamente equipos de tu propiedad.<br />
          Solo tu equipo. Nunca el contenido de tus archivos.
        </p>
      </main>
    </div>
  );
}
