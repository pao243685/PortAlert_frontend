import { request } from "./client";

export type User = { id: number; email: string };
export type LoginOut = { access_token: string; token_type: string };
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

export const me = () => request<User>("/auth/me", { auth: true });

export const listHosts = () => request<Host[]>("/hosts", { auth: true });
export const createEnrollToken = () =>
  request<EnrollToken>("/hosts/enroll-token", { method: "POST", auth: true });

export type InstallerOS = "linux" | "windows";
export const installerUrl = (token: string, os: InstallerOS, base: string) =>
  `${base}/installers/instalar-${token}.${os === "linux" ? "sh" : "ps1"}`;