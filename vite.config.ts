import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";

// Política de contenido del sitio compilado: solo scripts propios y conexiones a esta misma web y a la API.
// (Solo en `build`: el servidor de desarrollo necesita scripts en línea para el recargado en caliente.)
function csp(apiUrl: string): Plugin {
  let api = "";
  try { api = new URL(apiUrl).origin; } catch { /* sin URL válida: solo 'self' */ }
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'", // React usa estilos en línea (style={...})
    "img-src 'self' data:",
    "font-src 'self' data:",
    `connect-src 'self' ${api}`.trim(),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  return {
    name: "portalert-csp",
    apply: "build",
    transformIndexHtml: (html) => html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`),
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), csp(process.env.VITE_API_URL ?? env.VITE_API_URL ?? "")],
    server: { port: 5173 }, // el backend permite este origen por CORS (FRONTEND_URL)
  };
});
