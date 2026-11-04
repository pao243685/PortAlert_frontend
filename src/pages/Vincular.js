"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Vincular;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var auth_1 = require("../api/auth");
var client_1 = require("../api/client");
var AppShell_1 = require("../components/AppShell");
var ui_1 = require("../components/ui");
var OS_LABEL = { linux: "Linux", windows: "Windows" };
var detectOS = function () { return (/windows/i.test(navigator.userAgent) ? "windows" : "linux"); };
var STATUS_TEXT = { done: "Completado", active: "En curso", pending: "Pendiente" };
var STEP_TITLES = ["1 Descargar el instalador", "2 Ejecutar el instalador", "3 Confirmación en vivo"];
function Steps(_a) {
    var active = _a.active;
    // active: 1..3 = paso en curso; 0 = todo completado
    return (<ol className="steps" aria-label="Progreso">
      {STEP_TITLES.map(function (title, i) {
            var n = i + 1;
            var status = active === 0 || n < active ? "done" : n === active ? "active" : "pending";
            return (<li key={n} className={"step step--".concat(status)} aria-current={status === "active" ? "step" : undefined}>
            <span className="step__dot">{status === "done" ? <lucide_react_1.Check size={14} aria-hidden/> : n}</span>
            <span className="step__text">
              <span className="step__title">{title}</span>
              <span className="step__status">{STATUS_TEXT[status]}</span>
            </span>
          </li>);
        })}
    </ol>);
}
function HostCard(_a) {
    var _b;
    var host = _a.host;
    return (<div className="hostcard">
      <p className="hostcard__name"><lucide_react_1.Monitor size={22} aria-hidden/>{host.name}</p>
      <p className="hostcard__os">{[(_b = OS_LABEL[host.os_family]) !== null && _b !== void 0 ? _b : host.os_family, host.os_version].filter(Boolean).join(" · ")}</p>
      <p className="hostcard__meta">Detectado automáticamente · Solo lectura · Tu único equipo</p>
    </div>);
}
function Card(_a) {
    var title = _a.title, children = _a.children, wide = _a.wide;
    return (<section className={"wcard".concat(wide ? " wcard--wide" : "")}>
      {title && <h2 className="wcard__title">{title}</h2>}
      {children}
    </section>);
}
function Vincular() {
    var _this = this;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _a = (0, react_1.useState)("idle"), phase = _a[0], setPhase = _a[1];
    var _b = (0, react_1.useState)(detectOS), os = _b[0], setOs = _b[1];
    var _c = (0, react_1.useState)(false), choosingOs = _c[0], setChoosingOs = _c[1];
    var _d = (0, react_1.useState)(null), token = _d[0], setToken = _d[1];
    var _e = (0, react_1.useState)(null), host = _e[0], setHost = _e[1];
    var _f = (0, react_1.useState)(false), expired = _f[0], setExpired = _f[1];
    var _g = (0, react_1.useState)(null), netError = _g[0], setNetError = _g[1];
    var _h = (0, react_1.useState)(false), pollError = _h[0], setPollError = _h[1];
    var _j = (0, react_1.useState)(false), copied = _j[0], setCopied = _j[1];
    var refreshHost = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var hosts, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, auth_1.listHosts)()];
                case 1:
                    hosts = _c.sent();
                    setHost((_b = hosts[0]) !== null && _b !== void 0 ? _b : null);
                    setPollError(false);
                    return [3 /*break*/, 3];
                case 2:
                    _a = _c.sent();
                    setPollError(true);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); }, []);
    (0, react_1.useEffect)(function () { void refreshHost(); }, [refreshHost]);
    var polling = !host ? phase === "ready" || phase === "waiting" : host.score === null;
    (0, react_1.useEffect)(function () {
        if (!polling)
            return;
        var id = setInterval(function () { return void refreshHost(); }, 3000);
        return function () { return clearInterval(id); };
    }, [polling, refreshHost]);
    (0, react_1.useEffect)(function () {
        if (!token || host)
            return;
        var left = new Date(token.expires_at).getTime() - Date.now();
        if (left <= 0) {
            setExpired(true);
            return;
        }
        var id = setTimeout(function () { return setExpired(true); }, left);
        return function () { return clearTimeout(id); };
    }, [token, host]);
    function generate() {
        return __awaiter(this, void 0, void 0, function () {
            var t, a, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setNetError(null);
                        setExpired(false);
                        setCopied(false);
                        setPhase("preparing");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, auth_1.createEnrollToken)()];
                    case 2:
                        t = _a.sent();
                        setToken(t);
                        a = document.createElement("a");
                        a.href = (0, auth_1.installerUrl)(t.enroll_token, os, client_1.API_URL);
                        a.rel = "noopener";
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        setPhase("ready");
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        setPhase("idle");
                        if (err_1 instanceof client_1.ApiError && err_1.status === 409)
                            return [2 /*return*/, void refreshHost()]; // ya hay equipo
                        setNetError(err_1 instanceof client_1.ApiError && err_1.status !== 0 ? err_1.detail : "network");
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    var command = token
        ? os === "linux"
            ? "curl -fsSLO ".concat((0, auth_1.installerUrl)(token.enroll_token, "linux", client_1.API_URL), " && sudo bash instalar-").concat(token.enroll_token, ".sh")
            : "powershell -NoProfile -ExecutionPolicy Bypass -Command \"iwr '".concat((0, auth_1.installerUrl)(token.enroll_token, "windows", client_1.API_URL), "' -OutFile instalar.ps1; .\\instalar.ps1\"")
        : "";
    function copy() {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, navigator.clipboard.writeText(command)];
                    case 1:
                        _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 3:
                        setCopied(true);
                        setPhase("waiting");
                        return [2 /*return*/];
                }
            });
        });
    }
    var osPicker = choosingOs ? (<div className="stack" role="radiogroup" aria-label="Sistema operativo">
      {Object.keys(OS_LABEL).map(function (k) { return (<button key={k} type="button" role="radio" aria-checked={os === k} className={"os".concat(os === k ? " os--selected" : "")} onClick={function () { setOs(k); setChoosingOs(false); }}>
          <lucide_react_1.CircleDot size={20} aria-hidden/><span className="os__name">{OS_LABEL[k]}</span><span className="os__id">{k}</span>
        </button>); })}
    </div>) : (<div className="stack">
      <p className="field__label">Sistema operativo detectado en este navegador</p>
      <div className="os os--selected">
        <lucide_react_1.CircleDot size={20} aria-hidden/><span className="os__name">{OS_LABEL[os]}</span><span className="os__id">{os}</span>
      </div>
    </div>);
    var changeOs = <button type="button" className="link-underline" onClick={function () { return setChoosingOs(function (c) { return !c; }); }}>Cambiar sistema operativo</button>;
    var active = 1;
    var body;
    if (host) {
        var reported = host.score !== null;
        active = reported ? 0 : 3;
        body = reported ? (<Card wide>
        <ui_1.StatusNotice variant="success" title="Todo listo">Equipo vinculado y primer reporte recibido. Ya puedes abrir el panel de tu equipo.</ui_1.StatusNotice>
        <HostCard host={host}/>
        <p className="wcard__text wcard__text--small">La configuración de tu único equipo está completada. Consulta en el panel los datos del reporte recibido.</p>
        <ui_1.Button icon={<lucide_react_1.ArrowRight size={18} aria-hidden/>} onClick={function () { return navigate("/panel"); }}>Ver resumen de mi equipo</ui_1.Button>
      </Card>) : (<Card title="Confirmación en vivo" wide>
        <ui_1.StatusNotice variant="success" title="Equipo vinculado">El instalador se conectó y detectó tu único equipo.</ui_1.StatusNotice>
        <HostCard host={host}/>
        <ui_1.StatusNotice variant="info" title="Esperando el primer reporte" spinner>
          La vinculación está confirmada. Aún no hay un reporte disponible para mostrar el panel.
        </ui_1.StatusNotice>
        <ui_1.Button className="btn--wizard" disabled>Ir al panel</ui_1.Button>
      </Card>);
    }
    else if (netError) {
        body = (<Card title="Descargar el instalador" wide>
        <ui_1.StatusNotice variant="error" title="No pudimos conectar">
          {netError === "network"
                ? "Un problema de red impidió preparar el instalador y consultar la vinculación. Comprueba la conexión a internet del navegador y vuelve a intentarlo."
                : netError}
        </ui_1.StatusNotice>
        <p className="wcard__text wcard__text--small">Este error no indica el estado del agente ni confirma si tu equipo está vinculado.</p>
        <ui_1.Button icon={<lucide_react_1.RefreshCw size={18} aria-hidden/>} onClick={generate}>Reintentar</ui_1.Button>
      </Card>);
    }
    else if (expired && phase === "waiting") {
        active = 2;
        body = (<Card title="El instalador venció o ya se usó" wide>
        <ui_1.StatusNotice variant="error" title="El instalador venció o ya se usó">Genera uno nuevo y vuelve a ejecutarlo</ui_1.StatusNotice>
        <p className="wcard__text wcard__text--small">Genera uno nuevo y vuelve a ejecutarlo</p>
        <ui_1.Button icon={<lucide_react_1.RefreshCw size={18} aria-hidden/>} onClick={generate}>Generar nuevo instalador</ui_1.Button>
        <ui_1.Button variant="secondary" className="btn--blue" onClick={function () { return void refreshHost(); }}>Reintentar</ui_1.Button>
      </Card>);
    }
    else if (expired) {
        body = (<Card title="Descargar el instalador" wide>
        <ui_1.StatusNotice variant="warning" title="El instalador venció">El enlace de vinculación de un solo uso venció. Genera un nuevo instalador para continuar.</ui_1.StatusNotice>
        <ui_1.Button icon={<lucide_react_1.RefreshCw size={18} aria-hidden/>} onClick={generate}>Generar nuevo instalador</ui_1.Button>
        <p className="wcard__text wcard__text--small">Se preparará una nueva descarga para tu cuenta. El equipo se vinculará cuando ejecutes el nuevo instalador y este se conecte.</p>
      </Card>);
    }
    else if (phase === "preparing") {
        body = (<Card title="Descargar el instalador" wide>
        <ui_1.StatusNotice variant="info" title="Preparando tu instalador..." spinner>Estamos preparando la descarga para tu cuenta. Espera un momento antes de continuar.</ui_1.StatusNotice>
        <div className="skel-box" aria-hidden><div className="skel-bar skel-bar--lg"/><div className="skel-bar"/></div>
        <ui_1.Button className="btn--wizard" disabled>Preparando descarga</ui_1.Button>
        <p className="wcard__text wcard__text--small">La descarga estará disponible cuando termine la preparación. Todavía no hay un equipo vinculado.</p>
      </Card>);
    }
    else if (phase === "ready") {
        active = 2;
        body = (<>
        <ui_1.StatusNotice variant="success" title="Descarga completada">Ahora ejecuta el instalador. Tu equipo todavía no está vinculado; esperamos a que el instalador se conecte.</ui_1.StatusNotice>
        <Card>
          <p className="os-title"><lucide_react_1.Monitor size={20} color="#285fdb" aria-hidden/>{OS_LABEL[os]}</p>
          {changeOs}
          {choosingOs && osPicker}
          <p className="wcard__text wcard__text--ink">{os === "linux" ? "Pega este comando en una terminal:" : "Pega este comando en PowerShell, abierto como administrador:"}</p>
          <div className="cmd">
            <p className="cmd__text">{command}</p>
            <ui_1.Button variant="secondary" className="btn--blue" icon={<lucide_react_1.Copy size={16} aria-hidden/>} onClick={copy}>{copied ? "Copiado" : "Copiar"}</ui_1.Button>
          </div>
          {pollError && <ui_1.StatusNotice variant="error" title="No pudimos consultar la vinculación">Reintentando automáticamente.</ui_1.StatusNotice>}
        </Card>
      </>);
    }
    else if (phase === "waiting") {
        active = 3;
        body = (<Card title="Confirmación en vivo" wide>
        <p className="wcard__text">Después de ejecutar el instalador, el equipo se detectará automáticamente.</p>
        <ui_1.StatusNotice variant="info" title="Esperando que el instalador se conecte..." spinner>
          Todavía no hay un equipo vinculado. Continuaremos automáticamente cuando el instalador se conecte; no necesitas introducir datos del equipo.
        </ui_1.StatusNotice>
        {pollError && <ui_1.StatusNotice variant="error" title="No pudimos consultar la vinculación">Reintentando automáticamente.</ui_1.StatusNotice>}
        <p className="wcard__text wcard__text--small">Mantén abierta esta página y termina de ejecutar el instalador en tu computadora.</p>
        <ui_1.Button className="btn--wizard" disabled>Ir al panel</ui_1.Button>
        <button type="button" className="link-underline" onClick={function () { return setPhase("ready"); }}>Volver a ver el comando</button>
      </Card>);
    }
    else {
        body = (<div className="cols">
        <Card title="Descargar el instalador">
          <p className="wcard__text">El instalador incluye un enlace de vinculación de un solo uso que vence en 10 minutos. No necesitas instalar Python.</p>
          {osPicker}
          <div className="stack">
            <ui_1.Button onClick={generate}>Descargar instalador para {OS_LABEL[os]}</ui_1.Button>
            {changeOs}
            <p className="wcard__text wcard__text--small">Descarga en un clic. La vinculación se completa cuando ejecutas el instalador y este se conecta, no al descargarlo.</p>
          </div>
        </Card>
        <Card title="Después de descargar">
          <p className="wcard__text">Ejecuta el instalador en la computadora que quieres proteger. El equipo se vinculará cuando se conecte.</p>
          <ui_1.StatusNotice variant="info" title="La descarga no vincula el equipo">La confirmación llegará automáticamente cuando el instalador se conecte a tu cuenta.</ui_1.StatusNotice>
        </Card>
      </div>);
    }
    var stepNumber = active === 0 ? 3 : active;
    return (<AppShell_1.AppShell breadcrumb="Espacio personal / Primeros pasos">
      <div className="wizard">
        <header className="form__header">
          <p className="form__eyebrow">CONFIGURACIÓN INICIAL / 0{stepNumber}</p>
          <h1 className="form__title">Vincula tu equipo</h1>
          <p className="form__subtitle">Cada usuario puede vincular un solo equipo. Si reinstalas, volverás al paso 1 para el mismo equipo.</p>
        </header>
        <Steps active={active}/>
      </div>
      {body}
    </AppShell_1.AppShell>);
}
