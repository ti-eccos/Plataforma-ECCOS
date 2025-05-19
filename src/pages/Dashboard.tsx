import React from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getAllRequests } from "@/services/reservationService";
import { getAllUsers } from "@/services/userService";
import { getAllEquipment } from "@/services/equipmentService";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import UserDashboard from "../components/dashboard/UserDashboard";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Home } from 'lucide-react';

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
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Home className="text-black" size={35} /> {/* Ícone adicionado */}
          Dashboard Administrativo
        </h1>

        <DashboardLoading isLoading={isLoading} isError={isError} />

        {!isLoading && !isError && (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
              <Card className={cn(
                "bg-background text-card-foreground hover:bg-accent/20 cursor-pointer",
                "border-0 border-l-4 border-blue-500 hover:border-blue-600",
                "shadow-[rgba(0,0,0,0.10)_2px_2px_3px_0px] hover:shadow-[rgba(0,0,0,0.12)_4px_4px_5px_0px",
                "transition-all duration-300 relative w-full h-full flex flex-col",
                "before:content-[''] before:absolute before:left-0 before:top-0",
                "before:w-[2px] before:h-full before:bg-gradient-to-b",
                "before:from-transparent before:via-white/10 before:to-transparent before:opacity-30"
              )}>
                <CardHeader className="pb-2 flex-1 flex items-center justify-center">
                  <CardTitle className="text-sm font-medium text-center">
                    Usuários Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="text-2xl font-bold">{activeUsers}</div>
                  <Badge variant="outline" className="mt-2">
                    Contas
                  </Badge>
                </CardContent>
              </Card>

              <Card className={cn(
                "bg-background text-card-foreground hover:bg-accent/20 cursor-pointer",
                "border-0 border-l-4 border-blue-500 hover:border-blue-600",
                "shadow-[rgba(0,0,0,0.10)_2px_2px_3px_0px] hover:shadow-[rgba(0,0,0,0.12)_4px_4px_5px_0px",
                "transition-all duration-300 relative w-full h-full flex flex-col",
                "before:content-[''] before:absolute before:left-0 before:top-0",
                "before:w-[2px] before:h-full before:bg-gradient-to-b",
                "before:from-transparent before:via-white/10 before:to-transparent before:opacity-30"
              )}>
                <CardHeader className="pb-2 flex-1 flex items-center justify-center">
                  <CardTitle className="text-sm font-medium text-center">
                    Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="text-2xl font-bold">{pendingRequests}</div>
                  <Badge variant="outline" className="mt-2">
                    Solicitações
                  </Badge>
                </CardContent>
              </Card>

              <Card className={cn(
                "bg-background text-card-foreground hover:bg-accent/20 cursor-pointer",
                "border-0 border-l-4 border-blue-500 hover:border-blue-600",
                "shadow-[rgba(0,0,0,0.10)_2px_2px_3px_0px] hover:shadow-[rgba(0,0,0,0.12)_4px_4px_5px_0px",
                "transition-all duration-300 relative w-full h-full flex flex-col",
                "before:content-[''] before:absolute before:left-0 before:top-0",
                "before:w-[2px] before:h-full before:bg-gradient-to-b",
                "before:from-transparent before:via-white/10 before:to-transparent before:opacity-30"
              )}>
                <CardHeader className="pb-2 flex-1 flex items-center justify-center">
                  <CardTitle className="text-sm font-medium text-center">
                    Aprovadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="text-2xl font-bold">{approvedRequests}</div>
                  <Badge variant="outline" className="mt-2">
                    Solicitações
                  </Badge>
                </CardContent>
              </Card>

              <Card className={cn(
                "bg-background text-card-foreground hover:bg-accent/20 cursor-pointer",
                "border-0 border-l-4 border-blue-500 hover:border-blue-600",
                "shadow-[rgba(0,0,0,0.10)_2px_2px_3px_0px] hover:shadow-[rgba(0,0,0,0.12)_4px_4px_5px_0px",
                "transition-all duration-300 relative w-full h-full flex flex-col",
                "before:content-[''] before:absolute before:left-0 before:top-0",
                "before:w-[2px] before:h-full before:bg-gradient-to-b",
                "before:from-transparent before:via-white/10 before:to-transparent before:opacity-30"
              )}>
                <CardHeader className="pb-2 flex-1 flex items-center justify-center">
                  <CardTitle className="text-sm font-medium text-center">
                    Em Progresso
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="text-2xl font-bold">{inProgressRequests}</div>
                  <Badge variant="outline" className="mt-2">
                    Solicitações
                  </Badge>
                </CardContent>
              </Card>
            </div>

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