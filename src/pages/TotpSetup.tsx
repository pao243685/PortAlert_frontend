import { Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { totpEnable, totpSetup } from "../api/auth";
import type { TotpSetup as Setup } from "../api/auth";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AuthShell } from "../components/AuthShell";
import { Button, Field, Notice } from "../components/ui";

export default function TotpSetup() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);

  const prepare = useCallback(async () => {
    setPrepError(null);
    setSetup(null);
    try {
      setSetup(await totpSetup()); // cada llamada genera un secreto nuevo y descarta el anterior
    } catch (err) {
      setPrepError(err instanceof ApiError ? err.detail : "No pudimos preparar la configuración.");
    }
  }, []);

  useEffect(() => {
    if (started.current || user?.totp_enabled) return;
    started.current = true; // evita el doble efecto de StrictMode (generaría dos secretos)
    void prepare();
  }, [prepare, user?.totp_enabled]);

  if (user?.totp_enabled) return <Navigate to="/vincular" replace />;

  const grouped = setup?.secret.match(/.{1,4}/g)?.join(" ") ?? "";

  async function copy() {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.secret);
    } catch {
      return; // sin permiso de portapapeles: la clave sigue visible
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Escribe los 6 dígitos que muestra tu app de autenticación.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await totpEnable(code);
      await refreshUser();
      navigate("/vincular", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 400
          ? "El código no es correcto. Revisa que tu app esté escaneada y escribe el código vigente."
          : err instanceof ApiError ? err.detail : "Algo salió mal. Inténtalo de nuevo.",
      );
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <form className="form" onSubmit={onSubmit} noValidate>
        <header className="form__header">
          <p className="form__eyebrow">Te damos la bienvenida a PortAlert</p>
          <h1 className="form__title">Protege tu cuenta</h1>
          <p className="form__subtitle">
            Escanea el código QR con tu app de autenticación y escribe el código de 6 dígitos que aparece.
          </p>
          <p className="form__steps">Crear cuenta ✓ &nbsp;/&nbsp; <strong>Verificación en dos pasos</strong> &nbsp;/&nbsp; Vincular equipo</p>
        </header>

        {setup ? (
          <div className="qr">
            <div className="qr__box"><QRCodeSVG value={setup.otpauth_uri} size={142} /></div>
            <p className="qr__label">Clave manual (Base32), por si no puedes escanear</p>
            <div className="manual-key">
              <p className="manual-key__value">{grouped}</p>
              <Button type="button" variant="secondary" inline onClick={copy}>{copied ? "Copiado" : "Copiar"}</Button>
            </div>
          </div>
        ) : prepError ? (
          <div className="stack">
            <Notice variant="error">{prepError}</Notice>
            <Button type="button" variant="secondary" onClick={() => { started.current = true; void prepare(); }}>
              Intentar de nuevo
            </Button>
          </div>
        ) : (
          <div className="stack" aria-busy="true">
            <p className="preparing"><Loader2 size={20} className="spin" aria-hidden />Preparando tu configuración…</p>
            <div className="skeleton" style={{ width: 160, height: 160 }} />
            <div className="skeleton" style={{ height: 48 }} />
          </div>
        )}

        <Field
          label="Código de 6 dígitos" code autoComplete="one-time-code" inputMode="numeric" maxLength={6}
          value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} disabled={!setup}
        />

        {error && <Notice variant="error">{error}</Notice>}

        <Button type="submit" loading={loading} disabled={!setup}>
          {loading ? "Activando" : "Activar verificación"}
        </Button>
        <p className="form__note">Después de activar la verificación, podrás vincular tu equipo.</p>
      </form>
    </AuthShell>
  );
}
