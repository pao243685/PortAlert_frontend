import { Bell, LayoutDashboard, LogOut, Lock, Monitor, Network, Shield } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// Alertas y Mi equipo aún no existen en el producto: se muestran deshabilitados.
export function AppShell({
  children, breadcrumb, activePanel = false,
}: { children: ReactNode; breadcrumb: string; activePanel?: boolean }) {
  const { user, signOut } = useAuth();
  return (
    <div className="app">
      <nav className="sidebar" aria-label="Principal">
        <div className="brand__logo">
          <span className="brand__symbol"><Shield size={20} color="#fff" aria-hidden /></span>
          <span>PortAlert</span>
        </div>
        <div className="sidebar__links">
          <NavLink to="/panel" className={({ isActive }) => `sidebar__link${isActive || activePanel ? " sidebar__link--active" : ""}`}>
            <LayoutDashboard size={20} aria-hidden /><span>Panel</span>
          </NavLink>
          <NavLink to="/alertas" className={({ isActive }) => `sidebar__link${isActive ? " sidebar__link--active" : ""}`}>
            <Bell size={20} aria-hidden /><span>Alertas</span>
          </NavLink>
          <span className="sidebar__link sidebar__link--disabled" aria-disabled="true" title="Próximamente">
            <Network size={20} aria-hidden /><span>Puertos</span>
          </span>
          <span className="sidebar__link sidebar__link--disabled" aria-disabled="true" title="Próximamente">
            <Monitor size={20} aria-hidden /><span>Mi equipo</span>
          </span>
        </div>
        <div className="sidebar__account">
          <p className="sidebar__email">{user?.email}</p>
          <button type="button" className="sidebar__logout" onClick={signOut}>
            <LogOut size={18} aria-hidden /><span>Cerrar sesión</span>
          </button>
        </div>
      </nav>
      <div className="app__main">
        <div>
          <header className="contextbar">
            <p>{breadcrumb}</p>
            <p className="contextbar__session"><Lock size={14} aria-hidden /><span>Sesión de 60 min</span></p>
          </header>
          <main className="content">{children}</main>
        </div>
        <footer className="app__footer">
          <p>Solo tu equipo. Nunca el contenido de tus archivos.</p>
          <p className="app__footer-mono">PORTALERT / PERSONAL</p>
        </footer>
      </div>
    </div>
  );
}
