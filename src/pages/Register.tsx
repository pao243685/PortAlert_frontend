import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, register } from "../api/auth";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AuthShell } from "../components/AuthShell";
import { PasswordRules } from "../components/PasswordRules";
import { Button, Field, Notice } from "../components/ui";
import { checkPassword } from "../lib/password";
import { fmtWait, useCooldown } from "../lib/useCooldown";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = { email?: string; password?: string; form?: string };

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const cooldown = useCooldown();
  const { signIn } = useAuth();
  const navigate = useNavigate();

  function validate(): Errors {
    const e: Errors = {};
    if (!EMAIL_RE.test(email.trim())) e.email = "Introduce un correo válido, por ejemplo: lucia@ejemplo.es.";
    const faltan = checkPassword(password).filter((r) => !r.ok);
    if (password.length === 0) e.password = "Escribe una contraseña que cumpla los requisitos de abajo.";
    else if (faltan.length) e.password = "La contraseña aún no cumple: " + faltan.map((r) => r.label.toLowerCase()).join("; ") + ".";
    return e;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const found = validate();
    if (found.email || found.password) {
      setErrors({ ...found, form: "Revisa los campos indicados para continuar." });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const clean = email.trim().toLowerCase();
      await register(clean, password);
      const res = await login(clean, password);
      await signIn(res.access_token!);
      navigate("/2fa/configurar", { replace: true }); // paso 2: verificación en dos pasos
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        cooldown.start(err.retryAfter ?? 60);
        setErrors({ form: "Demasiados intentos. Espera a que termine la cuenta regresiva e inténtalo de nuevo." });
      } else if (err instanceof ApiError && err.status === 422) {
        // el servidor también rechaza contraseñas muy comunes o que contienen tu correo
        setErrors({ form: "Revisa los campos indicados para continuar.", password: err.detail });
      } else if (err instanceof ApiError && err.status === 409) {
        setErrors({ form: "Revisa los campos indicados para continuar.", email: "Este correo ya está registrado. Inicia sesión." });
      } else {
        setErrors({ form: err instanceof ApiError ? err.detail : "Algo salió mal. Inténtalo de nuevo." });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell showSession>
      <form className="form" onSubmit={onSubmit} noValidate>
        <header className="form__header">
          <p className="form__eyebrow">Te damos la bienvenida a PortAlert</p>
          <h1 className="form__title">Crea tu cuenta</h1>
          <p className="form__subtitle">El primer paso para entender qué ocurre en tu equipo.</p>
        </header>

        {errors.form && <Notice variant="error" triangle>{errors.form}</Notice>}

        <div className="form__fields">
          <Field
            label="Correo electrónico" type="email" autoComplete="email" inputMode="email"
            value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email}
          />
          <Field
            label="Contraseña" type="password" autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <PasswordRules password={password} touched={password.length > 0} />
        </div>

        <Button type="submit" loading={loading} disabled={cooldown.left > 0} icon={<ArrowRight size={18} aria-hidden />}>
          {cooldown.left > 0 ? `Espera ${fmtWait(cooldown.left)}` : "Crear cuenta"}
        </Button>

        <p className="form__alt">
          <span>¿Ya tienes una cuenta?</span>
          <Link className="link" to="/login">Inicia sesión</Link>
        </p>
      </form>
    </AuthShell>
  );
}
