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
  review_completed_at: string | null;
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

export type Severity = "critica" | "alta" | "media" | "baja";
export type Finding = {
  title: string;
  severity: Severity;
  confidence: "alta" | "media" | "baja";
  port: number | null;
  protocol: string | null;
  service: string | null;
  bind_address: string | null;
  process: string | null;
  exe_path: string | null;
  username: string | null;
  package: string | null;
  recommendation: string;
  can_mark_normal: boolean;
  is_normal: boolean;
};
export type Review = {
  host: Host;
  report_id: number;
  received_at: string;
  score: number | null;
  review_completed: boolean;
  counts: Record<Severity, number>;
  findings: Finding[];
};

export const getReview = () => request<Review>("/review", { auth: true });
export const setNormal = (f: Pick<Finding, "port" | "protocol" | "exe_path">, normal: boolean) =>
  request<void>("/review/normal", { method: "PUT", json: { ...f, normal }, auth: true });
export const completeReview = () => request<Host>("/review/complete", { method: "POST", auth: true });

export type AlertStatus = "nueva" | "atendida" | "ignorada";
export type AlertItem = {
  id: number;
  reference: string;
  title: string;
  severity: Severity;
  status: AlertStatus;
  confidence: "alta" | "media" | "baja";
  port: number | null;
  event_type: string | null;
  event_label: string | null;
  created_at: string;
};
export type AlertDetail = AlertItem & {
  host: Host;
  description: string;
  protocol: string | null;
  service: string | null;
  bind_address: string | null;
  exe_path: string | null;
  username: string | null;
  package: string | null;
  confidence_note: string;
  recommendation: string;
  can_mark_normal: boolean;
};

export const listAlerts = () => request<AlertItem[]>("/alerts", { auth: true });
export const getAlert = (id: number | string) => request<AlertDetail>(`/alerts/${id}`, { auth: true });
export const updateAlert = (id: number, status: AlertStatus, markNormal = false) =>
  request<AlertItem>(`/alerts/${id}`, { method: "PATCH", json: { status, mark_normal: markNormal }, auth: true });
