// src/pages/HomeRedirect.tsx
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import UserDashboard from "@/components/dashboard/UserDashboard";

const HomeRedirect = () => {
  const { userPermissions } = useAuth();
  
  return userPermissions.dashboard ? <Dashboard /> : <UserDashboard />;
};

export default HomeRedirect;