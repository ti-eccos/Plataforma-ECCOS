
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAdmin?: boolean;
}

const ProtectedRoute = ({ children, requiresAdmin = false }: ProtectedRouteProps) => {
  const { currentUser, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only navigate if not loading and conditions aren't met
    if (!loading) {
      if (!currentUser) {
        navigate("/login", { replace: true, state: { from: location } });
      } else if (requiresAdmin && !isAdmin) {
        navigate("/unauthorized", { replace: true });
      }
    }
  }, [currentUser, loading, isAdmin, requiresAdmin, navigate, location]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eccos-blue"></div>
      </div>
    );
  }

  // Instead of using Navigate component which might cause issues,
  // return null while the useEffect handles the navigation
  if (!currentUser) {
    return null;
  }

  if (requiresAdmin && !isAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
