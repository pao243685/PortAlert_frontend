// Política de contraseñas del registro. Es la misma que valida el servidor (que es quien decide);
// aquí solo se muestra mientras la persona escribe. El servidor además rechaza las contraseñas
// muy comunes y las que contienen el correo.
export const MIN_LENGTH = 8;
export const MAX_BYTES = 72; // límite de bcrypt

export type Rule = { id: string; label: string; ok: boolean };

export function checkPassword(pw: string): Rule[] {
  return [
    { id: "len", label: `Al menos ${MIN_LENGTH} caracteres`, ok: [...pw].length >= MIN_LENGTH },
    { id: "upper", label: "Una letra mayúscula", ok: /\p{Lu}/u.test(pw) },
    { id: "lower", label: "Una letra minúscula", ok: /\p{Ll}/u.test(pw) },
    { id: "digit", label: "Un número", ok: /\p{Nd}/u.test(pw) },
    { id: "special", label: "Un carácter especial (! ? # $ % & * @)", ok: /[^\p{L}\p{N}\s]/u.test(pw) },
    { id: "bytes", label: `Máximo ${MAX_BYTES} bytes (los acentos y emojis cuentan más)`, ok: new TextEncoder().encode(pw).length <= MAX_BYTES },
  ];
}

export const passwordIsValid = (pw: string) => checkPassword(pw).every((r) => r.ok);
