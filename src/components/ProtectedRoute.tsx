import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
  const { currentUser, userPermissions, isSuperAdmin, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !currentUser) sessionStorage.removeItem("redirectPath");
  }, [loading, currentUser]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-eccos-blue rounded-full"></div></div>;
  }

  if (!currentUser) {
    const redirectPath = location.pathname.replace(/^\/+/g, '');
    sessionStorage.setItem("redirectPath", redirectPath);
    return <Navigate to="/login" replace />;
  }
  
  // Redirecionamento do Superadmin para dashboard
  if (isSuperAdmin && location.pathname === "/") {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (isSuperAdmin) return <>{children}</>;

  if (requiredPermission && !userPermissions[requiredPermission]) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;