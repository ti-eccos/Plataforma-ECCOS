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

export const Dashboard = () => {
  const { currentUser, isAdmin } = useAuth();

  const { 
    data: requests = [], 
    isLoading: requestsLoading, 
    isError: requestsError 
  } = useQuery({
    queryKey: ['adminAllRequests'],
    queryFn: () => getAllRequests(true),
    enabled: isAdmin,
  });

  const {
    data: users = [],
    isLoading: usersLoading,
    isError: usersError
  } = useQuery({
    queryKey: ['adminAllUsers'],
    queryFn: getAllUsers,
    enabled: isAdmin,
  });

  const {
    data: equipment = [],
    isLoading: equipmentLoading,
    isError: equipmentError
  } = useQuery({
    queryKey: ['adminAllEquipment'],
    queryFn: getAllEquipment,
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return <UserDashboard />;
  }

  const isLoading = requestsLoading || usersLoading || equipmentLoading;
  const isError = requestsError || usersError || equipmentError;

  const activeUsers = users.filter((user: any) => !user.blocked).length;

  const requestTypes = requests.reduce((acc: Record<string, number>, req: any) => {
    const type = req.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const requestStatuses = requests.reduce((acc: Record<string, number>, req: any) => {
    const status = req.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const equipmentByType = equipment.reduce((acc: Record<string, number>, equip: any) => {
    const type = equip.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const pendingRequests = requests.filter((req: any) => req.status === 'pending').length;
  const approvedRequests = requests.filter((req: any) => req.status === 'approved').length;
  const inProgressRequests = requests.filter((req: any) => req.status === 'in-progress').length;

  const chromebooks = equipment.filter((equip: any) => equip.type === 'Chromebook').length;
  const ipads = equipment.filter((equip: any) => equip.type === 'iPad').length;

  const requestStatusData = [
    { name: 'Pendentes', value: pendingRequests, color: '#eab308' },
    { name: 'Aprovadas', value: approvedRequests, color: '#22c55e' },
    { name: 'Em Progresso', value: inProgressRequests, color: '#3b82f6' },
  ];

  const equipmentTypeData = [
    { name: 'Chromebooks', value: chromebooks, color: '#3b82f6' },
    { name: 'iPads', value: ipads, color: '#8b5cf6' },
  ];

  const reservationRequests = requests.filter((req: any) => req.type === 'reservation').length;
  const purchaseRequests = requests.filter((req: any) => req.type === 'purchase').length;
  const supportRequests = requests.filter((req: any) => req.type === 'support').length;

  const requestTypeData = [
    { name: 'Reservas', value: reservationRequests, color: '#3b82f6' },
    { name: 'Compras', value: purchaseRequests, color: '#8b5cf6' },
    { name: 'Suporte', value: supportRequests, color: '#ec4899' }
  ];

  const userRequestCounts = requests.reduce((acc: Record<string, any>, req: any) => {
    const userName = req.userName || 'Usuário Desconhecido';
    const userId = req.userId || 'unknown';
    
    if (!acc[userId]) {
      acc[userId] = {
        userId,
        userName,
        requestCount: 0
      };
    }
    
    acc[userId].requestCount++;
    return acc;
  }, {});

  const topUsersData = Object.values(userRequestCounts)
  .sort((a: any, b: any) => b.requestCount - a.requestCount)
  .slice(0, 5)
  .map((user: any) => ({
    userId: user.userId,      
    userName: user.userName,
    requestCount: user.requestCount,
  }));

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
              topUsersData={topUsersData}
              requests={requests}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;