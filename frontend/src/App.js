import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "sonner";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ModuleMaster from "@/pages/ModuleMaster";
import ChampionOfTheWeek from "@/pages/ChampionOfTheWeek";
import Edustation from "@/pages/Edustation";
import HomeroomArena from "@/pages/HomeroomArena";
import AdminPanel from "@/pages/AdminPanel";
import Gallery from "@/pages/Gallery";
import ModuleLibrary from "@/pages/ModuleLibrary";
import ReportPrint from "@/pages/ReportPrint";

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function Root() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Login />;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors closeButton />
          <Routes>
            <Route path="/" element={<Root />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/module-master" element={<Protected><ModuleMaster /></Protected>} />
            <Route path="/module-library" element={<Protected><ModuleLibrary /></Protected>} />
            <Route path="/gallery" element={<Protected><Gallery /></Protected>} />
            <Route path="/cotw" element={<Protected><ChampionOfTheWeek /></Protected>} />
            <Route path="/edustation" element={<Protected><Edustation /></Protected>} />
            <Route path="/homeroom-arena" element={<Protected><HomeroomArena /></Protected>} />
            <Route path="/admin" element={<Protected><AdminPanel /></Protected>} />
            <Route path="/report/:id/print" element={<Protected><ReportPrint /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
