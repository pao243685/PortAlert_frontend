"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.default = Register;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var auth_1 = require("../api/auth");
var client_1 = require("../api/client");
var AuthContext_1 = require("../auth/AuthContext");
var AuthShell_1 = require("../components/AuthShell");
var ui_1 = require("../components/ui");
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function Register() {
    var _a = (0, react_1.useState)(""), email = _a[0], setEmail = _a[1];
    var _b = (0, react_1.useState)(""), password = _b[0], setPassword = _b[1];
    var _c = (0, react_1.useState)({}), errors = _c[0], setErrors = _c[1];
    var _d = (0, react_1.useState)(false), loading = _d[0], setLoading = _d[1];
    var signIn = (0, AuthContext_1.useAuth)().signIn;
    var navigate = (0, react_router_dom_1.useNavigate)();
    function validate() {
        var e = {};
        if (!EMAIL_RE.test(email.trim()))
            e.email = "Introduce un correo válido, por ejemplo: lucia@ejemplo.es.";
        if (password.length === 0)
            e.password = "Escribe una contraseña de mínimo 8 caracteres.";
        else if (password.length < 8)
            e.password = "La contrase\u00F1a tiene ".concat(password.length, " caracteres. Usa m\u00EDnimo 8.");
        else if (password.length > 72)
            e.password = "La contraseña admite máximo 72 caracteres.";
        return e;
    }
    function onSubmit(ev) {
        return __awaiter(this, void 0, void 0, function () {
            var found, clean, res, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ev.preventDefault();
                        found = validate();
                        if (found.email || found.password) {
                            setErrors(__assign(__assign({}, found), { form: "Revisa los campos indicados para continuar." }));
                            return [2 /*return*/];
                        }
                        setErrors({});
                        setLoading(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, 6, 7]);
                        clean = email.trim().toLowerCase();
                        return [4 /*yield*/, (0, auth_1.register)(clean, password)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, (0, auth_1.login)(clean, password)];
                    case 3:
                        res = _a.sent();
                        return [4 /*yield*/, signIn(res.access_token)];
                    case 4:
                        _a.sent();
                        navigate("/vincular", { replace: true });
                        return [3 /*break*/, 7];
                    case 5:
                        err_1 = _a.sent();
                        if (err_1 instanceof client_1.ApiError && err_1.status === 409) {
                            setErrors({ form: "Revisa los campos indicados para continuar.", email: "Este correo ya está registrado. Inicia sesión." });
                        }
                        else {
                            setErrors({ form: err_1 instanceof client_1.ApiError ? err_1.detail : "Algo salió mal. Inténtalo de nuevo." });
                        }
                        return [3 /*break*/, 7];
                    case 6:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    return (<AuthShell_1.AuthShell showSession>
      <form className="form" onSubmit={onSubmit} noValidate>
        <header className="form__header">
          <p className="form__eyebrow">Te damos la bienvenida a PortAlert</p>
          <h1 className="form__title">Crea tu cuenta</h1>
          <p className="form__subtitle">El primer paso para entender qué ocurre en tu equipo.</p>
        </header>

        {errors.form && <ui_1.Notice variant="error" triangle>{errors.form}</ui_1.Notice>}

        <div className="form__fields">
          <ui_1.Field label="Correo electrónico" type="email" autoComplete="email" inputMode="email" value={email} onChange={function (e) { return setEmail(e.target.value); }} error={errors.email}/>
          <ui_1.Field label="Contraseña" type="password" autoComplete="new-password" value={password} onChange={function (e) { return setPassword(e.target.value); }} hint="Mínimo 8 caracteres" error={errors.password}/>
        </div>

        <ui_1.Button type="submit" loading={loading} icon={<lucide_react_1.ArrowRight size={18} aria-hidden/>}>Crear cuenta</ui_1.Button>

        <p className="form__alt">
          <span>¿Ya tienes una cuenta?</span>
          <react_router_dom_1.Link className="link" to="/login">Inicia sesión</react_router_dom_1.Link>
        </p>
      </form>
    </AuthShell_1.AuthShell>);
}
