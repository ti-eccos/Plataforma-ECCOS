import React, { useEffect } from "react";
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
import { Button } from "@/components/ui/button";

export const Dashboard = () => {
  const { currentUser, isAdmin } = useAuth();

  // Configuração para tentar refetch caso os dados venham vazios
  const { 
    data: requests = [], 
    isLoading: requestsLoading, 
    isError: requestsError,
    refetch: refetchRequests
  } = useQuery({
    queryKey: ['adminAllRequests'],
    queryFn: () => getAllRequests(true),
    enabled: isAdmin,
    retry: 2,
  });

  const {
    data: users = [],
    isLoading: usersLoading,
    isError: usersError,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['adminAllUsers'],
    queryFn: getAllUsers,
    enabled: isAdmin,
    retry: 2,
  });

  const {
    data: equipment = [],
    isLoading: equipmentLoading,
    isError: equipmentError,
    refetch: refetchEquipment
  } = useQuery({
    queryKey: ['adminAllEquipment'],
    queryFn: getAllEquipment,
    enabled: isAdmin,
    retry: 2,
  });

  // Tentar recarregar dados se algum deles vier vazio
  useEffect(() => {
    if (isAdmin && !requestsLoading && !requestsError && requests.length === 0) {
      console.log("Tentando recarregar solicitações...");
      refetchRequests();
    }
    
    if (isAdmin && !usersLoading && !usersError && users.length === 0) {
      console.log("Tentando recarregar usuários...");
      refetchUsers();
    }
    
    if (isAdmin && !equipmentLoading && !equipmentError && equipment.length === 0) {
      console.log("Tentando recarregar equipamentos...");
      refetchEquipment();
    }
  }, [isAdmin, 
      requests.length, requestsLoading, requestsError, 
      users.length, usersLoading, usersError, 
      equipment.length, equipmentLoading, equipmentError]);

  // Animação de entrada (fade-up)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  if (!isAdmin) {
    return <UserDashboard />;
  }

  const isLoading = requestsLoading || usersLoading || equipmentLoading;
  const isError = requestsError || usersError || equipmentError;
  
  // Verifica se há dados válidos
  const hasValidData = requests.length > 0 && users.length > 0 && equipment.length > 0;

  // Calcula estatísticas apenas se houver dados válidos
  const activeUsers = users.filter((user: any) => !user.blocked).length;
  const pendingRequests = requests.filter((req: any) => req.status === 'pending').length;
  const approvedRequests = requests.filter((req: any) => req.status === 'approved').length;
  const inProgressRequests = requests.filter((req: any) => req.status === 'in-progress').length;
  const chromebooks = equipment.filter((equip: any) => equip.type === 'Chromebook').length;
  const ipads = equipment.filter((equip: any) => equip.type === 'iPad').length;

  const reservationRequests = requests.filter((req: any) => req.type === 'reservation').length;
  const purchaseRequests = requests.filter((req: any) => req.type === 'purchase').length;
  const supportRequests = requests.filter((req: any) => req.type === 'support').length;

  // Trate dados para os gráficos
  const requestStatusData = [
    { name: 'Pendentes', value: pendingRequests, color: '#eab308' },
    { name: 'Aprovadas', value: approvedRequests, color: '#22c55e' },
    { name: 'Em Progresso', value: inProgressRequests, color: '#3b82f6' },
  ];

  const equipmentTypeData = [
    { name: 'Chromebooks', value: chromebooks, color: '#3b82f6' },
    { name: 'iPads', value: ipads, color: '#8b5cf6' },
  ];

  const requestTypeData = [
    { name: 'Reservas', value: reservationRequests, color: '#3b82f6' },
    { name: 'Compras', value: purchaseRequests, color: '#8b5cf6' },
    { name: 'Suporte', value: supportRequests, color: '#ec4899' }
  ];

  // Calcule as estatísticas de usuários
  const userRequestCounts = requests.reduce((acc: Record<string, any>, req: any) => {
    const userId = req.userId || 'unknown';
    if (!acc[userId]) {
      acc[userId] = {
        userId,
        userName: req.userName || 'Usuário Desconhecido',
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
      <div className="min-h-screen bg-white overflow-hidden relative">
        {/* Fundos decorativos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-sidebar blur-3xl opacity-5"></div>
          <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-eccos-purple blur-3xl opacity-5"></div>
        </div>

        {/* Conteúdo principal */}
        <div className="relative z-10 space-y-8 p-6 md:p-12 fade-up">
          <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
            <Home className="text-eccos-purple" size={35} />
            Dashboard Administrativo
          </h1>

          <DashboardLoading isLoading={isLoading} isError={isError} />

          {!isLoading && !isError && (
            <div className="space-y-8 fade-up">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                {/* Card Usuários Ativos */}
                <Card
                  className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Usuários Ativos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                      {activeUsers}
                    </div>
                    <Badge variant="outline" className="mt-2 border-eccos-purple text-eccos-purple">
                      Contas
                    </Badge>
                  </CardContent>
                </Card>

                {/* Card Pendentes */}
                <Card
                  className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Solicitações Pendentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                      {pendingRequests}
                    </div>
                    <Badge variant="outline" className="mt-2 border-eccos-purple text-eccos-purple">
                      Pendências
                    </Badge>
                  </CardContent>
                </Card>

                {/* Card Aprovadas */}
                <Card
                  className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Solicitações Aprovadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                      {approvedRequests}
                    </div>
                    <Badge variant="outline" className="mt-2 border-eccos-purple text-eccos-purple">
                      Concluídas
                    </Badge>
                  </CardContent>
                </Card>

                {/* Card Em Progresso */}
                <Card
                  className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Em Progresso
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                      {inProgressRequests}
                    </div>
                    <Badge variant="outline" className="mt-2 border-eccos-purple text-eccos-purple">
                      Processando
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <div className="fade-up">
                <DashboardCharts 
                  requestStatusData={requestStatusData}
                  equipmentTypeData={equipmentTypeData}
                  requestTypeData={requestTypeData}
                  topUsersData={topUsersData}
                  requests={requests}
                />
              </div>
            </div>
          )}

          {!isLoading && !isError && !hasValidData && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-8 text-center">
              <p className="text-lg text-gray-500 mb-4">
                Não há dados suficientes para exibir o dashboard completo.
              </p>
              <Button 
                onClick={() => {
                  refetchRequests();
                  refetchUsers();
                  refetchEquipment();
                }}
                className="bg-eccos-purple hover:bg-sidebar text-white"
              >
                Recarregar dados
              </Button>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <footer className="relative z-10 bg-gray-50 py-10 px-4 md:px-12 fade-up">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <p className="text-gray-500 text-sm">
                © 2025 Colégio ECCOS - Todos os direitos reservados
              </p>
            </div>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
};

export default Dashboard;