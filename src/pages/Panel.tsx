// Placeholder (sin diseño todavía): confirma que cuenta -> sesión -> equipo vinculado funciona.
import { useEffect, useState } from "react";
import { listHosts } from "../api/auth";
import type { Host } from "../api/auth";
import { AppShell } from "../components/AppShell";

export default function Panel() {
  const [hosts, setHosts] = useState<Host[] | null>(null);
  useEffect(() => { listHosts().then(setHosts).catch(() => setHosts([])); }, []);
  const host = hosts?.[0];

  return (
    <AppShell breadcrumb="Espacio personal / Panel">
      <header className="form__header">
        <p className="form__eyebrow">PANEL</p>
        <h1 className="form__title">Tu equipo</h1>
      </header>
      {host ? (
        <dl className="card" style={{ maxWidth: 640 }}>
          <dt>Nombre</dt><dd>{host.name}</dd>
          <dt>Sistema</dt><dd>{host.os_family} {host.os_version ?? ""}</dd>
          <dt>Último reporte</dt><dd>{new Date(host.last_seen).toLocaleString()}</dd>
          <dt>Puntaje</dt><dd>{host.score ?? "Sin reportes todavía"}</dd>
        </dl>
      ) : hosts ? <p className="form__subtitle">Aún no hay un equipo vinculado.</p> : null}
    </AppShell>
  );
}
