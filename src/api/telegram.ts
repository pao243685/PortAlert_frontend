import { request } from "./client";

export type TelegramState = "none" | "pending" | "linked" | "expired";
export type TelegramStatus = { state: TelegramState; available: boolean; expires_at: string | null };
export type TelegramLink = { url: string; expires_at: string };

export const getTelegramStatus = () => request<TelegramStatus>("/telegram/status", { auth: true });
export const createTelegramLink = () => request<TelegramLink>("/telegram/link", { method: "POST", auth: true });
export const sendTelegramTest = () => request<void>("/telegram/test", { method: "POST", auth: true });
export const removeTelegramLink = () => request<void>("/telegram/link", { method: "DELETE", auth: true });
