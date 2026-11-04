import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/AuthContext";
import Login from "./pages/Login";
import Panel from "./pages/Panel";
import Register from "./pages/Register";
import TotpSetup from "./pages/TotpSetup";
import Vincular from "./pages/Vincular";

export default function App() {
  return (
    <Routes>
      <Route path="/registro" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/2fa/configurar" element={<RequireAuth><TotpSetup /></RequireAuth>} />
      <Route path="/vincular" element={<RequireAuth><Vincular /></RequireAuth>} />
      <Route path="/panel" element={<RequireAuth><Panel /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
