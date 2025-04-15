
import React from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getAllRequests } from "@/services/reservationService";
import { getAllUsers } from "@/services/userService";
import { getAllEquipment } from "@/services/equipmentService";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import UserDashboard from "../components/dashboard/UserDashboard";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";

const Dashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  
  // Fetch all requests
  const { 
    data: requests = [], 
    isLoading: requestsLoading, 
    isError: requestsError 
  } = useQuery({
    queryKey: ['adminAllRequests'],
    queryFn: () => getAllRequests(true),
    enabled: isAdmin,
  });

  // Fetch users
  const {
    data: users = [],
    isLoading: usersLoading,
    isError: usersError
  } = useQuery({
    queryKey: ['adminAllUsers'],
    queryFn: getAllUsers,
    enabled: isAdmin,
  });

  // Fetch equipment
  const {
    data: equipment = [],
    isLoading: equipmentLoading,
    isError: equipmentError
  } = useQuery({
    queryKey: ['adminAllEquipment'],
    queryFn: getAllEquipment,
    enabled: isAdmin,
  });

  // If user is not an admin, show another dashboard
  if (!isAdmin) {
    return <UserDashboard />;
  }

  const isLoading = requestsLoading || usersLoading || equipmentLoading;
  const isError = requestsError || usersError || equipmentError;

  // Count active users (not blocked)
  const activeUsers = users.filter((user: any) => !user.blocked).length;
  
  // Count request types
  const requestTypes = requests.reduce((acc: Record<string, number>, req: any) => {
    const type = req.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Count request statuses
  const requestStatuses = requests.reduce((acc: Record<string, number>, req: any) => {
    const status = req.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Count equipment by type
  const equipmentByType = equipment.reduce((acc: Record<string, number>, equip: any) => {
    const type = equip.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Count pending, approved and in-progress requests
  const pendingRequests = requests.filter((req: any) => req.status === 'pending').length;
  const approvedRequests = requests.filter((req: any) => req.status === 'approved').length;
  const inProgressRequests = requests.filter((req: any) => req.status === 'in-progress').length;
  
  // Count Chromebooks and iPads
  const chromebooks = equipment.filter((equip: any) => equip.type === 'Chromebook').length;
  const ipads = equipment.filter((equip: any) => equip.type === 'iPad').length;

  // Data for request status pie chart
  const requestStatusData = [
    { name: 'Pendentes', value: pendingRequests, color: '#eab308' },
    { name: 'Aprovadas', value: approvedRequests, color: '#22c55e' },
    { name: 'Em Progresso', value: inProgressRequests, color: '#3b82f6' },
  ];

  // Data for equipment type pie chart
  const equipmentTypeData = [
    { name: 'Chromebooks', value: chromebooks, color: '#3b82f6' },
    { name: 'iPads', value: ipads, color: '#8b5cf6' },
  ];

  // Count request by type
  const reservationRequests = requests.filter((req: any) => req.type === 'reservation').length;
  const purchaseRequests = requests.filter((req: any) => req.type === 'purchase').length;
  const supportRequests = requests.filter((req: any) => req.type === 'support').length;

  // Data for request types pie chart
  const requestTypeData = [
    { name: 'Reservas', value: reservationRequests, color: '#3b82f6' },
    { name: 'Compras', value: purchaseRequests, color: '#8b5cf6' },
    { name: 'Suporte', value: supportRequests, color: '#ec4899' }
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        
        <DashboardLoading isLoading={isLoading} isError={isError} />
        
        {!isLoading && !isError && (
          <div className="space-y-8">
            <DashboardMetrics 
              activeUsers={activeUsers}
              chromebooks={chromebooks}
              ipads={ipads}
              pendingRequests={pendingRequests}
              approvedRequests={approvedRequests}
              inProgressRequests={inProgressRequests}
              isLoading={isLoading}
            />
            
            <DashboardCharts 
              requestStatusData={requestStatusData}
              equipmentTypeData={equipmentTypeData}
              requestTypeData={requestTypeData}
              requests={requests}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;