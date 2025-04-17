import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import UserSolicitacoes from "@/pages/UserSolicitacoes";

// Admin Pages
import Equipamentos from "./pages/admin/Equipamentos";
import Disponibilidade from "./pages/admin/Disponibilidade";
import Usuarios from "./pages/admin/Usuarios";
import Solicitacoes from "./pages/admin/Solicitacoes";

// Solicitation Pages
import NovaReserva from "./pages/solicitations/NovaReserva";
import NovaCompra from "./pages/solicitations/NovaCompra";
import NovaSuporte from "./pages/solicitations/NovaSuporte";

const queryClient = new QueryClient();

const RedirectToDashboard = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (sessionStorage.redirect) {
      const redirect = sessionStorage.redirect;
      delete sessionStorage.redirect;
      navigate(redirect);
    }
  }, [navigate]);

  return null;
};

const RoutingHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedPath = sessionStorage.getItem('redirectPath');
    if (savedPath) {
      sessionStorage.removeItem('redirectPath');
      navigate(savedPath.replace('/eccos-portal-digital', ''));
    }
  }, [navigate, location]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <RoutingHandler />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<RedirectToDashboard />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Rotas protegidas para usuários */}
            <Route
              path="/nova-solicitacao/reserva"
              element={
                <ProtectedRoute>
                  <NovaReserva />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nova-solicitacao/compra"
              element={
                <ProtectedRoute>
                  <NovaCompra />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nova-solicitacao/suporte"
              element={
                <ProtectedRoute>
                  <NovaSuporte />
                </ProtectedRoute>
              }
            />

            {/* Rotas administrativas */}
            <Route
              path="/equipamentos"
              element={
                <ProtectedRoute requiresAdmin>
                  <Equipamentos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/disponibilidade"
              element={
                <ProtectedRoute requiresAdmin>
                  <Disponibilidade />
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute requiresAdmin>
                  <Usuarios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/solicitacoes"
              element={
                <ProtectedRoute requiresAdmin>
                  <Solicitacoes />
                </ProtectedRoute>
              }
            />

            <Route path="/index" element={<Navigate to="/" replace />} />
            <Route path="/minhas-solicitacoes" element={<UserSolicitacoes />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;