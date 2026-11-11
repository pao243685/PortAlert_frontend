# PortAlert · Frontend

SPA en React + TypeScript + Vite. Vive sola: lo único que necesita del resto del sistema es la URL de la API.

```bash
cp .env.example .env      # VITE_API_URL=http://localhost:8001
npm install
npm run dev               # http://localhost:5173
npm run build             # genera dist/ (sitio estático)
```

## Despliegue
`npm run build` produce un sitio estático (`dist/`). La variable `VITE_API_URL` se fija **al compilar**, así que
en el hosting hay que definirla antes del build. El backend debe tener `FRONTEND_URL` igual al origen donde
se publique este sitio (CORS), y la API debe ir por HTTPS. Como es una SPA, el hosting necesita reescribir
cualquier ruta a `index.html`.

## Rutas y su diseño en Figma (archivo UMo1K4UH2bm9dEP9Q6hR9D, sección "01 · Acceso y verificación")
| Ruta | Pantalla | Nodo Figma |
|---|---|---|
| `/registro` | Registro (+ validación incorrecta) | `6:25253` |
| `/login` | Inicio de sesión (+ sesión vencida `?vencida=1`, demasiados intentos) | `6:25158`, `34:16977` |
| `/login/verificacion` | 2FA · iniciar sesión (+ cargando, error de código, demasiados intentos) | `34:15226`, `34:15259`, `34:15293`, `34:15329` |
| `/2fa/configurar` | 2FA · configurar (+ cargando, vacío, error de código) | `34:15066`, `34:15108`, `34:15148`, `34:15181` |
| `/vincular` | Vincular equipo, asistente de 3 pasos (+ preparando, venció, venció o ya se usó, error de red, primer reporte pendiente, todo listo) | sección "02 · Vincular mi equipo": `28:10838`, `28:10940`, `28:11045`, `28:11126`, `28:11219`, `28:11310`, `28:11391`, `28:11474`, `28:11553` |
| `/revision` | Primera revisión de tu equipo (+ cargando, sin hallazgos, error de red) | sección "03 · Primera revisión": `34:15365`, `34:15599`, `34:15720`, `34:15833` |
| `/alertas` | Alertas: filtros Todas/Nuevas/Atendidas/Ignoradas y bandeja vacía (la lista con alertas **no está en el Figma**: provisional) | sección "05 · Alertas y atención": `6:24849` |
| `/alertas/:id` | Detalle de alerta + diálogo de ignorar | `6:24069`, `34:17020` (Windows), `34:16556` (diálogo) |
| `/panel` | Placeholder (sin diseño todavía) dentro del layout con barra lateral | — |

Donde el Figma tiene dos versiones (hay un login con otro estilo, `6:23175`), se usó la más nueva: símbolo de escudo,
kicker en IBM Plex Mono, sin tarjeta. Los íconos son `lucide-react` con los mismos nombres del Figma
(`shield`, `monitor`, `refresh-cw`, `file-lock-2`, `eye-off`, `arrow-right`, `lock-keyhole`, `triangle-alert`, `circle-alert`, `info`, `loader-circle`).

## Contrato con la API
`POST /auth/register` · `POST /auth/login` (form) → `access_token` o `mfa_required` + `mfa_token` · `POST /auth/login/totp` ·
`GET /auth/me` · `POST /auth/totp/setup` · `POST /auth/totp/enable` · `GET /hosts` · `POST /hosts/enroll-token` ·
`GET /alerts` · `GET /alerts/{id}` · `PATCH /alerts/{id}` (`status`, `mark_normal`) · `GET /review` · `PUT /review/normal` · `POST /review/complete` · `GET /installers/instalar-{token}.sh|.ps1` (descarga del instalador; el backend responde con `Content-Disposition: attachment`).

## Notas
- El token de sesión se guarda en `sessionStorage`. El `mfa_token` solo viaja en memoria (state del router).
- Un 401 en cualquier llamada autenticada lleva a `/login?vencida=1`.
- Los estados "Demasiados intentos" ya están en la UI y reaccionan a un `429`, pero el backend **aún no limita intentos**.
- Vincular: el paso 3 consulta `GET /hosts` cada 3 s. Equipo presente con `score = null` = vinculado sin reporte; con `score` = primer reporte recibido.
- El color del aviso amarillo ("El instalador venció") se tomó a ojo de la captura: confirmar el hex en Figma.
- El Figma muestra nombre y correo de la cuenta; el backend aún no tiene campo de nombre, así que solo se muestra el correo.
- Alertas y Mi equipo aparecen deshabilitados en la barra lateral hasta que existan esas pantallas.
- Severidad: `components/Severity.tsx` es el único sitio donde se define el estilo de severidad (el del Resumen inicial). Cualquier vista de hallazgos nueva debe usar `SeverityBadge`, `SeverityCounters` y `SeverityLegend`.
- El texto del rango "Crítico" del puntaje no viene en el Figma; el de ese rango es de redacción propia.
- Alertas: la severidad usa siempre el estilo sólido del Resumen inicial (`SeverityBadge`), aunque el frame de detalle del Figma traiga la etiqueta suave.
- Sin diseño en Figma: lista con alertas, chips de estado Atendida/Ignorada y el botón "Reabrir alerta" (provisionales). Las frases de "Nivel de confianza" son de redacción propia.
