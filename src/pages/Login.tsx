import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { login } from "../api/auth";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AuthShell } from "../components/AuthShell";
import { Button, Field, Notice } from "../components/ui";

export default function Login() {
  const [params] = useSearchParams();
  const vencida = params.get("vencida") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, destinoTrasLogin } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!email.trim() || !password) {
      setError("Escribe tu correo y tu contraseña.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await login(email.trim().toLowerCase(), password);
      if (res.mfa_required && res.mfa_token) {
        // el mfa_token viaja solo en memoria (state del router), nunca a storage
        navigate("/login/verificacion", { state: { mfaToken: res.mfa_token } });
        return;
      }
      const user = await signIn(res.access_token!);
      navigate(await destinoTrasLogin(user), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setBlocked(true);
        setError("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.");
      } else if (err instanceof ApiError && err.status === 401) {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError(err instanceof ApiError ? err.detail : "Algo salió mal. Inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell showSession>
      <form className="form" onSubmit={onSubmit} noValidate>
        <header className="form__header">
          <p className="form__eyebrow">PORTALERT / ACCESO</p>
          <h1 className="form__title">Vuelve a tu espacio</h1>
          <p className="form__subtitle">Inicia sesión para revisar las señales de tu equipo.</p>
        </header>

        {vencida && !error && (
          <Notice variant="info" title="Tu sesión ha vencido">
            Han pasado 60 minutos. Inicia sesión de nuevo para continuar.
          </Notice>
        )}
        {error && <Notice variant="error">{error}</Notice>}

        <div className="form__fields">
          <Field
            label="Correo electrónico" type="email" autoComplete="email" inputMode="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            label="Contraseña" type="password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button type="submit" loading={loading} disabled={blocked} icon={<ArrowRight size={18} aria-hidden />}>
          {blocked ? "Espera unos minutos" : "Iniciar sesión"}
        </Button>

        <p className="form__note form__note--center">
          Después de verificar tu identidad, entrarás al panel si ya vinculaste tu equipo.
        </p>

        <p className="form__alt form__alt--divided">
          <span>¿Primera vez aquí?</span>
          <Link className="link" to="/registro">Crear cuenta</Link>
        </p>
      </form>
    </AuthShell>
  );
}
