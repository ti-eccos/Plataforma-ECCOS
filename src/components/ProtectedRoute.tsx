
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAdmin?: boolean;
}

const ProtectedRoute = ({ children, requiresAdmin = false }: ProtectedRouteProps) => {
  const { currentUser, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eccos-blue"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiresAdmin && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
