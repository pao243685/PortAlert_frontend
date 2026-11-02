import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { listHosts, me } from "../api/auth";
import type { User } from "../api/auth";
import { setSessionExpiredHandler, tokenStore } from "../api/client";

type AuthState = {
  user: User | null;
  loading: boolean;
  signIn: (token: string) => Promise<User>;
  signOut: () => void;
  refreshUser: () => Promise<User>;
  /** Adónde mandar a la persona justo después de iniciar sesión. */
  destinoTrasLogin: (user: User) => Promise<string>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => tokenStore.get() !== null);
  const navigate = useNavigate();

  const refreshUser = useCallback(async () => {
    const u = await me();
    setUser(u);
    return u;
  }, []);

  const signIn = useCallback(async (token: string) => {
    tokenStore.set(token);
    return refreshUser();
  }, [refreshUser]);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  // Token vencido (60 min) en cualquier llamada autenticada -> pantalla "Sesión vencida".
  useEffect(() => {
    setSessionExpiredHandler(() => {
      tokenStore.clear();
      setUser(null);
      navigate("/login?vencida=1", { replace: true });
    });
    return () => setSessionExpiredHandler(null);
  }, [navigate]);

  // Rehidratar la sesión al recargar la pestaña.
  useEffect(() => {
    if (!tokenStore.get()) return;
    refreshUser().catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, [refreshUser]);

  // Con equipo vinculado va al panel; sin equipo, a vincularlo.
  const destinoTrasLogin = useCallback(async (_user: User) => {
    const hosts = await listHosts();
    return hosts.length ? "/panel" : "/vincular";
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, refreshUser, destinoTrasLogin }),
    [user, loading, signIn, signOut, refreshUser, destinoTrasLogin],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth fuera de AuthProvider");
  return v;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}