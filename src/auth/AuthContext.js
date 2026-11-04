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
exports.AuthProvider = AuthProvider;
exports.useAuth = useAuth;
exports.RequireAuth = RequireAuth;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var auth_1 = require("../api/auth");
var client_1 = require("../api/client");
var Ctx = (0, react_1.createContext)(null);
function AuthProvider(_a) {
    var _this = this;
    var children = _a.children;
    var _b = (0, react_1.useState)(null), user = _b[0], setUser = _b[1];
    var _c = (0, react_1.useState)(function () { return client_1.tokenStore.get() !== null; }), loading = _c[0], setLoading = _c[1];
    var navigate = (0, react_router_dom_1.useNavigate)();
    var refreshUser = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var u;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, auth_1.me)()];
                case 1:
                    u = _a.sent();
                    setUser(u);
                    return [2 /*return*/, u];
            }
        });
    }); }, []);
    var signIn = (0, react_1.useCallback)(function (token) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            client_1.tokenStore.set(token);
            return [2 /*return*/, refreshUser()];
        });
    }); }, [refreshUser]);
    var signOut = (0, react_1.useCallback)(function () {
        client_1.tokenStore.clear();
        setUser(null);
        navigate("/login", { replace: true });
    }, [navigate]);
    // Token vencido (60 min) en cualquier llamada autenticada -> pantalla "Sesión vencida".
    (0, react_1.useEffect)(function () {
        (0, client_1.setSessionExpiredHandler)(function () {
            client_1.tokenStore.clear();
            setUser(null);
            navigate("/login?vencida=1", { replace: true });
        });
        return function () { return (0, client_1.setSessionExpiredHandler)(null); };
    }, [navigate]);
    // Rehidratar la sesión al recargar la pestaña.
    (0, react_1.useEffect)(function () {
        if (!client_1.tokenStore.get())
            return;
        refreshUser().catch(function () { return client_1.tokenStore.clear(); }).finally(function () { return setLoading(false); });
    }, [refreshUser]);
    // Con equipo vinculado va al panel; sin equipo, a vincularlo.
    var destinoTrasLogin = (0, react_1.useCallback)(function (_user) { return __awaiter(_this, void 0, void 0, function () {
        var hosts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, auth_1.listHosts)()];
                case 1:
                    hosts = _a.sent();
                    return [2 /*return*/, hosts.length ? "/panel" : "/vincular"];
            }
        });
    }); }, []);
    var value = (0, react_1.useMemo)(function () { return ({ user: user, loading: loading, signIn: signIn, signOut: signOut, refreshUser: refreshUser, destinoTrasLogin: destinoTrasLogin }); }, [user, loading, signIn, signOut, refreshUser, destinoTrasLogin]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
function useAuth() {
    var v = (0, react_1.useContext)(Ctx);
    if (!v)
        throw new Error("useAuth fuera de AuthProvider");
    return v;
}
function RequireAuth(_a) {
    var children = _a.children;
    var _b = useAuth(), user = _b.user, loading = _b.loading;
    var location = (0, react_router_dom_1.useLocation)();
    if (loading)
        return null;
    if (!user)
        return <react_router_dom_1.Navigate to="/login" replace state={{ from: location.pathname }}/>;
    return <>{children}</>;
}
