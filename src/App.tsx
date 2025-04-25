import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation,
  useNavigate
} from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect } from 'react';

// Páginas
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import UserSolicitacoes from "@/pages/UserSolicitacoes";

// Admin
import Equipamentos from "./pages/admin/Equipamentos";
import Disponibilidade from "./pages/admin/Disponibilidade";
import Usuarios from "./pages/admin/Usuarios";
import Solicitacoes from "./pages/admin/Solicitacoes";

// Solicitações
import NovaReserva from "./pages/solicitations/NovaReserva";
import NovaCompra from "./pages/solicitations/NovaCompra";
import NovaSuporte from "./pages/solicitations/NovaSuporte";

const queryClient = new QueryClient();

// Componente para tratamento de redirecionamento
const RoutingHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedPath = sessionStorage.getItem('redirectPath');
    if (savedPath && savedPath !== '/') {
      sessionStorage.removeItem('redirectPath');
      navigate(savedPath);
    }
  }, [navigate, location]);

  return null;
};

// Configuração de rotas
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
      element: (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: "/nova-solicitacao/reserva",
      element: (
        <ProtectedRoute>
          <NovaReserva />
        </ProtectedRoute>
      ),
    },
    {
      path: "/nova-solicitacao/compra",
      element: (
        <ProtectedRoute>
          <NovaCompra />
        </ProtectedRoute>
      ),
    },
    {
      path: "/nova-solicitacao/suporte",
      element: (
        <ProtectedRoute>
          <NovaSuporte />
        </ProtectedRoute>
      ),
    },
    {
      path: "/equipamentos",
      element: (
        <ProtectedRoute requiresAdmin>
          <Equipamentos />
        </ProtectedRoute>
      ),
    },
    {
      path: "/disponibilidade",
      element: (
        <ProtectedRoute requiresAdmin>
          <Disponibilidade />
        </ProtectedRoute>
      ),
    },
    {
      path: "/usuarios",
      element: (
        <ProtectedRoute requiresAdmin>
          <Usuarios />
        </ProtectedRoute>
      ),
    },
    {
      path: "/solicitacoes",
      element: (
        <ProtectedRoute requiresAdmin>
          <Solicitacoes />
        </ProtectedRoute>
      ),
    },
    {
      path: "/index",
      element: <Navigate to="/" replace />,
    },
    {
      path: "/minhas-solicitacoes",
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
  ],
  {
    basename: import.meta.env.BASE_URL || "/Tecnologia-ECCOS",
  }
);

// Componente principal
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RoutingHandler />
        <RouterProvider router={router} />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;