import { CircleAlert, CircleCheck, CircleX, Eye, EyeOff, Info, Loader2, TriangleAlert, WifiOff } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { forwardRef, useId, useState } from "react";

export function Notice({
  variant, title, children, role, triangle,
}: { variant: "error" | "info"; title?: string; children: ReactNode; role?: "alert" | "status"; triangle?: boolean }) {
  // Figma: el aviso de formulario usa triangle-alert; los errores de código usan circle-alert
  const Icon = variant === "info" ? Info : triangle ? TriangleAlert : CircleAlert;
  return (
    <div className={`notice notice--${variant}`} role={role ?? (variant === "error" ? "alert" : "status")}>
      <Icon size={18} aria-hidden color={variant === "error" ? "#b32d45" : "#285fdb"} />
      <div className="notice__body">
        {title && <p className="notice__title">{title}</p>}
        <p>{children}</p>
      </div>
    </div>
  );
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p className="field__error" id={id}>
      <CircleAlert size={16} aria-hidden />
      <span>{children}</span>
    </p>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  code?: boolean;
};

export function Field({ label, error, hint, code, type, className, ...rest }: FieldProps) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <div className={`field__control${code ? " field__control--code" : ""}${error ? " field__control--invalid" : ""}`}>
        <input
          id={id}
          className={`field__input${code ? " field__input--code" : ""} ${className ?? ""}`}
          type={isPassword && shown ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          {...rest}
        />
        {isPassword && (
          <button
            type="button" className="field__toggle" onClick={() => setShown((s) => !s)}
            aria-label={shown ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {shown ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}
      </div>
      {hint && <p className="field__hint" id={`${id}-hint`}>{hint}</p>}
      {error && <FieldError id={`${id}-err`}>{error}</FieldError>}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  loading?: boolean;
  icon?: ReactNode;
  inline?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", loading, icon, inline, children, disabled, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`btn btn--${variant}${inline ? " btn--inline" : ""}${loading ? " btn--loading" : ""} ${className ?? ""}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 size={18} className="spin" aria-hidden /> : icon}
      <span>{children}</span>
    </button>
  );
});

/** Aviso de estado del asistente (Figma: "Aviso de estado"). */
export function StatusNotice({
  variant, title, children, spinner,
}: { variant: "info" | "success" | "warning" | "error"; title: string; children?: ReactNode; spinner?: boolean }) {
  const icon = spinner ? <Loader2 size={20} className="spin" aria-hidden />
    : variant === "success" ? <CircleCheck size={20} aria-hidden />
    : variant === "warning" ? <TriangleAlert size={20} aria-hidden />
    : variant === "error" ? <CircleX size={20} aria-hidden />
    : <Info size={20} aria-hidden />;
  return (
    <div className={`status status--${variant}`} role={variant === "error" ? "alert" : "status"}>
      <p className="status__head">{icon}<span>{title}</span></p>
      {children && <p className="status__body">{children}</p>}
    </div>
  );
}

/** Estado de error de red (Figma 34:15833): mismo patrón en todas las vistas con datos. */
export function NetworkErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="wcard wcard--center">
      <WifiOff size={32} color="#285fdb" aria-hidden />
      <h2 className="wcard__title">No pudimos cargar la información</h2>
      <p className="wcard__text wcard__text--narrow">Revisa tu conexión a internet e inténtalo de nuevo. No se muestran datos que no pudimos recuperar.</p>
      <Button inline onClick={onRetry}>Reintentar</Button>
    </section>
  );
}