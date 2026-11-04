"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notice = Notice;
exports.FieldError = FieldError;
exports.Field = Field;
exports.Button = Button;
exports.StatusNotice = StatusNotice;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
function Notice(_a) {
    var variant = _a.variant, title = _a.title, children = _a.children, role = _a.role, triangle = _a.triangle;
    // Figma: el aviso de formulario usa triangle-alert; los errores de código usan circle-alert
    var Icon = variant === "info" ? lucide_react_1.Info : triangle ? lucide_react_1.TriangleAlert : lucide_react_1.CircleAlert;
    return (<div className={"notice notice--".concat(variant)} role={role !== null && role !== void 0 ? role : (variant === "error" ? "alert" : "status")}>
      <Icon size={18} aria-hidden color={variant === "error" ? "#b32d45" : "#285fdb"}/>
      <div className="notice__body">
        {title && <p className="notice__title">{title}</p>}
        <p>{children}</p>
      </div>
    </div>);
}
function FieldError(_a) {
    var id = _a.id, children = _a.children;
    return (<p className="field__error" id={id}>
      <lucide_react_1.CircleAlert size={16} aria-hidden/>
      <span>{children}</span>
    </p>);
}
function Field(_a) {
    var label = _a.label, error = _a.error, hint = _a.hint, code = _a.code, type = _a.type, className = _a.className, rest = __rest(_a, ["label", "error", "hint", "code", "type", "className"]);
    var id = (0, react_1.useId)();
    var _b = (0, react_1.useState)(false), shown = _b[0], setShown = _b[1];
    var isPassword = type === "password";
    return (<div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <div className={"field__control".concat(code ? " field__control--code" : "").concat(error ? " field__control--invalid" : "")}>
        <input id={id} className={"field__input".concat(code ? " field__input--code" : "", " ").concat(className !== null && className !== void 0 ? className : "")} type={isPassword && shown ? "text" : type} aria-invalid={error ? true : undefined} aria-describedby={error ? "".concat(id, "-err") : hint ? "".concat(id, "-hint") : undefined} {...rest}/>
        {isPassword && (<button type="button" className="field__toggle" onClick={function () { return setShown(function (s) { return !s; }); }} aria-label={shown ? "Ocultar contraseña" : "Mostrar contraseña"}>
            {shown ? <lucide_react_1.Eye size={18}/> : <lucide_react_1.EyeOff size={18}/>}
          </button>)}
      </div>
      {hint && <p className="field__hint" id={"".concat(id, "-hint")}>{hint}</p>}
      {error && <FieldError id={"".concat(id, "-err")}>{error}</FieldError>}
    </div>);
}
function Button(_a) {
    var _b = _a.variant, variant = _b === void 0 ? "primary" : _b, loading = _a.loading, icon = _a.icon, inline = _a.inline, children = _a.children, disabled = _a.disabled, className = _a.className, rest = __rest(_a, ["variant", "loading", "icon", "inline", "children", "disabled", "className"]);
    return (<button className={"btn btn--".concat(variant).concat(inline ? " btn--inline" : "").concat(loading ? " btn--loading" : "", " ").concat(className !== null && className !== void 0 ? className : "")} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <lucide_react_1.Loader2 size={18} className="spin" aria-hidden/> : icon}
      <span>{children}</span>
    </button>);
}
/** Aviso de estado del asistente (Figma: "Aviso de estado"). */
function StatusNotice(_a) {
    var variant = _a.variant, title = _a.title, children = _a.children, spinner = _a.spinner;
    var icon = spinner ? <lucide_react_1.Loader2 size={20} className="spin" aria-hidden/>
        : variant === "success" ? <lucide_react_1.CircleCheck size={20} aria-hidden/>
            : variant === "warning" ? <lucide_react_1.TriangleAlert size={20} aria-hidden/>
                : variant === "error" ? <lucide_react_1.CircleX size={20} aria-hidden/>
                    : <lucide_react_1.Info size={20} aria-hidden/>;
    return (<div className={"status status--".concat(variant)} role={variant === "error" ? "alert" : "status"}>
      <p className="status__head">{icon}<span>{title}</span></p>
      {children && <p className="status__body">{children}</p>}
    </div>);
}
