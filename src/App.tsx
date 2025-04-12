
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Redirect / to dashboard */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            {/* Protected User Routes */}
            <Route path="/nova-solicitacao/reserva" element={
              <ProtectedRoute>
                <NovaReserva />
              </ProtectedRoute>
            } />
            <Route path="/nova-solicitacao/compra" element={
              <ProtectedRoute>
                <NovaCompra />
              </ProtectedRoute>
            } />
            <Route path="/nova-solicitacao/suporte" element={
              <ProtectedRoute>
                <NovaSuporte />
              </ProtectedRoute>
            } />
            
            {/* Protected Admin Routes */}
            <Route path="/equipamentos" element={
              <ProtectedRoute requiresAdmin>
                <Equipamentos />
              </ProtectedRoute>
            } />
            <Route path="/disponibilidade" element={
              <ProtectedRoute requiresAdmin>
                <Disponibilidade />
              </ProtectedRoute>
            } />
            <Route path="/usuarios" element={
              <ProtectedRoute requiresAdmin>
                <Usuarios />
              </ProtectedRoute>
            } />
            <Route path="/solicitacoes" element={
              <ProtectedRoute requiresAdmin>
                <Solicitacoes />
              </ProtectedRoute>
            } />
            
            {/* Index route redirect */}
            <Route path="/index" element={<Navigate to="/" replace />} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
