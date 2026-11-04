import { request } from "./client";

export type User = { id: number; email: string; totp_enabled: boolean };
export type LoginOut = {
  access_token: string | null;
  mfa_required: boolean;
  mfa_token: string | null;
};
export type TotpSetup = { secret: string; otpauth_uri: string };
export type Host = {
  id: number;
  name: string;
  os_family: string;
  os_version: string | null;
  last_seen: string;
  score: number | null;
};
export type EnrollToken = { enroll_token: string; expires_at: string };

export const register = (email: string, password: string) =>
  request<User>("/auth/register", { method: "POST", json: { email, password } });

export const login = (email: string, password: string) =>
  request<LoginOut>("/auth/login", { method: "POST", form: { username: email, password } });

export const loginTotp = (mfa_token: string, code: string) =>
  request<LoginOut>("/auth/login/totp", { method: "POST", json: { mfa_token, code } });

export const me = () => request<User>("/auth/me", { auth: true });
export const totpSetup = () => request<TotpSetup>("/auth/totp/setup", { method: "POST", auth: true });
export const totpEnable = (code: string) =>
  request<User>("/auth/totp/enable", { method: "POST", json: { code }, auth: true });

export const listHosts = () => request<Host[]>("/hosts", { auth: true });
export const createEnrollToken = () =>
  request<EnrollToken>("/hosts/enroll-token", { method: "POST", auth: true });

export type InstallerOS = "linux" | "windows";
export const installerUrl = (token: string, os: InstallerOS, base: string) =>
  `${base}/installers/instalar-${token}.${os === "linux" ? "sh" : "ps1"}`;
