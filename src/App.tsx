import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Notificacao from "@/pages/Notificacoes";
import AppWrapper from "@/components/AppWrapper";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserDashboard from "./components/dashboard/UserDashboard";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import UserSolicitacoes from "@/pages/UserSolicitacoes";
import ComprasFinanceiro from "@/pages/admin/ComprasFinanceiro";
import ComprasTecnologia from "@/pages/admin/ComprasTecnologia";
import ComprasInfraestrutura from "@/pages/admin/ComprasInfraestrutura";
import Equipamentos from "./pages/admin/Equipamentos";
import Disponibilidade from "./pages/admin/Disponibilidade";
import Usuarios from "./pages/admin/Usuarios";
import Solicitacoes from "./pages/admin/Solicitacoes";
import NovaReserva from "./pages/solicitations/NovaReserva";
import NovaCompra from "./pages/solicitations/NovaCompra";
import NovaSuporte from "./pages/solicitations/NovaSuporte";
import SuporteOperacional from "./pages/SuporteOperacional";
import Estoque from "./pages/admin/Estoque";
import CalendarioReservas from "@/pages/admin/CalendarioReservas";
import SuportePlataforma from "@/pages/admin/SuportePlataforma";
import Profile from "@/pages/Profile";
import RolesManagement from "@/pages/admin/RolesManagement";
import HomeRedirect from "@/components/HomeRedirect";
import ComprasPedagogicoAdmin from "./pages/admin/ComprasPedagogicoAdmin";
import React from "react";


const queryClient = new QueryClient();

interface AppProps {
  basename?: string;
}

const App = ({ basename = "" }: AppProps) => {
  const router = createBrowserRouter(
    [
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/unauthorized",
        element: <Unauthorized />,
      },
      {
        path: "/404",
        element: <NotFound />,
      },
      {
        path: "/",
        element: <AppWrapper />,
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <HomeRedirect />
              </ProtectedRoute>
            ),
          },
          {
            path: "dashboard",
            element: (
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: "nova-solicitacao/reserva",
            element: (
              <ProtectedRoute>
                <NovaReserva />
              </ProtectedRoute>
            ),
          },
          {
            path: "nova-solicitacao/compra",
            element: (
              <ProtectedRoute>
                <NovaCompra />
              </ProtectedRoute>
            ),
          },
          {
            path: "nova-solicitacao/suporte",
            element: (
              <ProtectedRoute>
                <NovaSuporte />
              </ProtectedRoute>
            ),
          },
          {
            path: "suporte-operacional",
            element: (
              <ProtectedRoute requiredPermission="suporte-operacional">
                <SuporteOperacional />
              </ProtectedRoute>
            ),
          },
          {
            path: "compras-financeiro",
            element: (
              <ProtectedRoute requiredPermission="compras-financeiro">
                <ComprasFinanceiro />
              </ProtectedRoute>
            ),
          },
          {
            path: "compras-tecnologia",
            element: (
              <ProtectedRoute requiredPermission="compras-tecnologia">
                <ComprasTecnologia />
              </ProtectedRoute>
            ),
          },
          {
            path: "compras-infraestrutura",
            element: (
              <ProtectedRoute requiredPermission="compras-infraestrutura">
                <ComprasInfraestrutura />
              </ProtectedRoute>
            ),
          },
          {
            path: "compras-pedagogicoadmin",
            element: (
              <ProtectedRoute requiredPermission="compras-pedagogicoadmin">
                <ComprasPedagogicoAdmin />
              </ProtectedRoute>
            ),
          },
          {
            path: "calendario",
            element: (
              <ProtectedRoute requiredPermission="solicitacoes">
                <CalendarioReservas />
              </ProtectedRoute>
            ),
          },
          {
            path: "equipamentos",
            element: (
              <ProtectedRoute requiredPermission="equipamentos">
                <Equipamentos />
              </ProtectedRoute>
            ),
          },
          {
            path: "estoque",
            element: (
              <ProtectedRoute requiredPermission="estoque">
                <Estoque />
              </ProtectedRoute>
            ),
          },
          {
            path: "disponibilidade",
            element: (
              <ProtectedRoute requiredPermission="equipamentos">
                <Disponibilidade />
              </ProtectedRoute>
            ),
          },
          {
            path: "usuarios",
            element: (
              <ProtectedRoute requiredPermission="usuarios">
                <Usuarios />
              </ProtectedRoute>
            ),
          },
          {
            path: "solicitacoes",
            element: (
              <ProtectedRoute requiredPermission="solicitacoes">
                <Solicitacoes />
              </ProtectedRoute>
            ),
          },
          {
            path: "suporte-plataforma",
            element: (
              <ProtectedRoute requiredPermission="suporte-plataforma">
                <SuportePlataforma />
              </ProtectedRoute>
            ),
          },
          {
            path: "notificacoes",
            element: (
              <ProtectedRoute requiredPermission="notificacoes">
                <Notificacao />
              </ProtectedRoute>
            ),
          },
          {
            path: "minhas-solicitacoes",
            element: (
              <ProtectedRoute>
                <UserSolicitacoes />
              </ProtectedRoute>
            ),
          },
          {
            path: "perfil",
            element: (
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            ),
          },
          {
            path: "roles",
            element: (
              <ProtectedRoute requiredPermission="all">
                <RolesManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: "*",
            element: <Navigate to="/404" replace />,
          },
        ],
      },
      {
        path: "/index",
        element: <Navigate to="/" replace />,
      },
    ],
    {
      basename,
    }
  );
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App basename="/Plataforma-ECCOS/" /> // Adicione esta linha
  </React.StrictMode>
);
  // Aplicar redirecionamento se necessário
  React.useEffect(() => {
    if (window.__REDIRECT_PATH__) {
      const redirectPath = window.__REDIRECT_PATH__;
      delete window.__REDIRECT_PATH__;
      window.history.replaceState(null, "", redirectPath);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RouterProvider router={router} />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;