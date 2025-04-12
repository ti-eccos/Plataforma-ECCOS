
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAdmin?: boolean;
}

const ProtectedRoute = ({ children, requiresAdmin = false }: ProtectedRouteProps) => {
  const { currentUser, loading, isAdmin } = useAuth();

  // Exibir o spinner enquanto estiver carregando
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eccos-blue"></div>
      </div>
    );
  }

  // Redirecionar para login se não estiver autenticado
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Redirecionar para página de não autorizado se for rota de admin e usuário não for admin
  if (requiresAdmin && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Renderizar o conteúdo protegido
  return <>{children}</>;
};

export default ProtectedRoute;
