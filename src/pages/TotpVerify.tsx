import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { loginTotp } from "../api/auth";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AuthShell } from "../components/AuthShell";
import { Button, Field, Notice } from "../components/ui";

export default function TotpVerify() {
  const location = useLocation();
  const mfaToken = (location.state as { mfaToken?: string } | null)?.mfaToken;
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, destinoTrasLogin } = useAuth();
  const navigate = useNavigate();

  if (!mfaToken) return <Navigate to="/login" replace />;

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Escribe los 6 dígitos de tu app de autenticación.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await loginTotp(mfaToken!, code);
      const user = await signIn(res.access_token!);
      navigate(await destinoTrasLogin(user), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setBlocked(true);
        setError("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.");
      } else if (err instanceof ApiError && err.status === 401) {
        // el backend rechaza igual un código mal escrito, uno ya usado (anti-replay) y un mfa_token vencido (5 min)
        setError("El código no es válido o ya se usó. Espera al siguiente código; si pasaron más de 5 minutos, vuelve a iniciar sesión.");
      } else {
        setError(err instanceof ApiError ? err.detail : "Algo salió mal. Inténtalo de nuevo.");
      }
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <form className="form" onSubmit={onSubmit} noValidate>
        <header className="form__header">
          <p className="form__eyebrow">PORTALERT / ACCESO</p>
          <h1 className="form__title">Verifica tu identidad</h1>
          <p className="form__subtitle">Escribe el código de 6 dígitos de tu app de autenticación.</p>
        </header>

        <Field
          label="Código de 6 dígitos" code autoFocus autoComplete="one-time-code"
          inputMode="numeric" maxLength={6} value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        />

        {error && <Notice variant="error">{error}</Notice>}

        <Button type="submit" loading={loading} disabled={blocked}>
          {loading ? "Verificando" : blocked ? "Espera unos minutos" : "Verificar"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate("/login", { replace: true })}>Volver</Button>
      </form>
    </AuthShell>
  );
}
