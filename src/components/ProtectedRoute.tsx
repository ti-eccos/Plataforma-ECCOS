import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export type UserRole = "user" | "admin" | "superadmin" | "financeiro" | "operacional";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !currentUser) {
      sessionStorage.removeItem("redirectPath");
    }
  }, [loading, currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eccos-blue"></div>
      </div>
    );
  }

  if (!currentUser) {
  const redirectPath = location.pathname.replace(/^\/+/g, '');
  sessionStorage.setItem("redirectPath", redirectPath);
  return <Navigate to="/login" replace />;
}

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;