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
    // User routes
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
    // Admin routes
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
      element: <UserSolicitacoes />,
    },
    {
      path: "*",
      element: <NotFound />,
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