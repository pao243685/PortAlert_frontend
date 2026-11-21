import { Check, Circle } from "lucide-react";
import { checkPassword } from "../lib/password";

/** Lista de requisitos que se va marcando mientras se escribe la contraseña. */
export function PasswordRules({ password, touched }: { password: string; touched: boolean }) {
  const rules = checkPassword(password).filter((r) => r.id !== "bytes" || !r.ok); // el tope de bytes solo si se excede
  return (
    <ul className="pw-rules" aria-label="Requisitos de la contraseña" aria-live="polite">
      {rules.map((r) => (
        <li key={r.id} className={r.ok ? "pw-rule pw-rule--ok" : touched ? "pw-rule pw-rule--bad" : "pw-rule"}>
          {r.ok ? <Check size={14} aria-hidden /> : <Circle size={14} aria-hidden />}
          <span>{r.label}</span>
          <span className="sr-only">{r.ok ? " (cumplido)" : " (pendiente)"}</span>
        </li>
      ))}
    </ul>
  );
}
