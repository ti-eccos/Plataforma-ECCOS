import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Notificacao from "@/pages/Notificacoes";
import AppWrapper from "@/components/AppWrapper";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import UserSolicitacoes from "@/pages/UserSolicitacoes";
import ComprasFinanceiro from "@/pages/admin/ComprasFinanceiro";
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

const queryClient = new QueryClient();

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
            <ProtectedRoute allowedRoles={['operacional']}>
              <SuporteOperacional />
            </ProtectedRoute>
          ),
        },
        {
          path: "compras-financeiro",
          element: (
            <ProtectedRoute allowedRoles={['financeiro']}>
              <ComprasFinanceiro />
            </ProtectedRoute>
          ),
        },
        {
          path: "calendario",
          element: (
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <CalendarioReservas />
            </ProtectedRoute>
          ),
        },
        {
          path: "equipamentos",
          element: (
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <Equipamentos />
            </ProtectedRoute>
          ),
        },
        {
          path: "estoque",
          element: (
            <ProtectedRoute allowedRoles={['admin', 'superadmin', 'financeiro', 'operacional']}>
              <Estoque />
            </ProtectedRoute>
          ),
        },
        {
          path: "disponibilidade",
          element: (
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <Disponibilidade />
            </ProtectedRoute>
          ),
        },
        {
          path: "usuarios",
          element: (
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <Usuarios />
            </ProtectedRoute>
          ),
        },
        {
          path: "solicitacoes",
          element: (
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <Solicitacoes />
            </ProtectedRoute>
          ),
        },
        {
          path: "suporte-plataforma",
          element: (
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <SuportePlataforma />
            </ProtectedRoute>
          ),
        },
        {
          path: "notificacoes",
          element: (
            <ProtectedRoute allowedRoles={['admin', 'superadmin', 'financeiro']}>
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
          path: "*",
          element: <Navigate to="/404" replace />,
        },
        {
          path: "perfil",
          element: (
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          ),
        },
      ],
    },
    {
      path: "/index",
      element: <Navigate to="/" replace />,
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);

const App = () => (
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

export default App;