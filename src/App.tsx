import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/AuthContext";
import AlertaDetalle from "./pages/AlertaDetalle";
import Alertas from "./pages/Alertas";
import Login from "./pages/Login";
import Panel from "./pages/Panel";
import Register from "./pages/Register";
import Revision from "./pages/Revision";
import TotpSetup from "./pages/TotpSetup";
import TotpVerify from "./pages/TotpVerify";
import Vincular from "./pages/Vincular";

export default function App() {
  return (
    <Routes>
      <Route path="/registro" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/verificacion" element={<TotpVerify />} />
      <Route path="/2fa/configurar" element={<RequireAuth><TotpSetup /></RequireAuth>} />
      <Route path="/vincular" element={<RequireAuth><Vincular /></RequireAuth>} />
      <Route path="/revision" element={<RequireAuth><Revision /></RequireAuth>} />
      <Route path="/alertas" element={<RequireAuth><Alertas /></RequireAuth>} />
      <Route path="/alertas/:id" element={<RequireAuth><AlertaDetalle /></RequireAuth>} />
      <Route path="/panel" element={<RequireAuth><Panel /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
