"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
var react_router_dom_1 = require("react-router-dom");
var AuthContext_1 = require("./auth/AuthContext");
var Login_1 = require("./pages/Login");
var Panel_1 = require("./pages/Panel");
var Register_1 = require("./pages/Register");
var TotpSetup_1 = require("./pages/TotpSetup");
var Vincular_1 = require("./pages/Vincular");
function App() {
    return (<react_router_dom_1.Routes>
      <react_router_dom_1.Route path="/registro" element={<Register_1.default />}/>
      <react_router_dom_1.Route path="/login" element={<Login_1.default />}/>
      <react_router_dom_1.Route path="/2fa/configurar" element={<AuthContext_1.RequireAuth><TotpSetup_1.default /></AuthContext_1.RequireAuth>}/>
      <react_router_dom_1.Route path="/vincular" element={<AuthContext_1.RequireAuth><Vincular_1.default /></AuthContext_1.RequireAuth>}/>
      <react_router_dom_1.Route path="/panel" element={<AuthContext_1.RequireAuth><Panel_1.default /></AuthContext_1.RequireAuth>}/>
      <react_router_dom_1.Route path="*" element={<react_router_dom_1.Navigate to="/login" replace/>}/>
    </react_router_dom_1.Routes>);
}
