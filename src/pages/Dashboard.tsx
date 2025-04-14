import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  ShoppingCart, 
  Wrench, 
  Calendar,
  Check,
  Clock,
  Package,
  BarChart3,
  Laptop,
  Tablet,
  FileText,
  FileClock,
  FileCheck,
  FileMinus
} from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { getAllRequests, RequestStatus, RequestType } from "@/services/reservationService";
import { getAllUsers } from "@/services/userService";
import { getAllEquipment, EquipmentType } from "@/services/equipmentService";
import { StatCard } from "@/components/dashboard/StatCard";
import { RequestStatusChart } from "@/components/dashboard/RequestStatusChart";
import { EquipmentUsageChart } from "@/components/dashboard/EquipmentUsageChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

const Dashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  
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

  // Contagem completa de status
  const requestStatusCounts = requests.reduce((acc: Record<RequestStatus, number>, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {} as Record<RequestStatus, number>);

  // Contagem de tipos de solicitação
  const requestTypeCounts = requests.reduce((acc: Record<RequestType, number>, req) => {
    acc[req.type] = (acc[req.type] || 0) + 1;
    return acc;
  }, {} as Record<RequestType, number>);

  // Dados para gráfico de status
  const requestStatusData = [
    { name: 'Pendentes', value: requestStatusCounts.pending || 0, color: '#eab308' },
    { name: 'Aprovadas', value: requestStatusCounts.approved || 0, color: '#22c55e' },
    { name: 'Reprovadas', value: requestStatusCounts.rejected || 0, color: '#ef4444' },
    { name: 'Em Andamento', value: requestStatusCounts['in-progress'] || 0, color: '#3b82f6' },
    { name: 'Concluídas', value: requestStatusCounts.completed || 0, color: '#64748b' },
    { name: 'Canceladas', value: requestStatusCounts.canceled || 0, color: '#f59e0b' },
  ];

  // Dados para gráfico de tipos de solicitação
  const requestTypeData = [
    { name: 'Reservas', value: requestTypeCounts.reservation || 0, color: '#3b82f6' },
    { name: 'Compras', value: requestTypeCounts.purchase || 0, color: '#8b5cf6' },
    { name: 'Suporte', value: requestTypeCounts.support || 0, color: '#ec4899' }
  ];

  // Contagem de equipamentos
  const chromebooks = equipment.filter((equip: any) => equip.type === 'Chromebook').length;
  const ipads = equipment.filter((equip: any) => equip.type === 'iPad').length;
  const activeUsers = users.filter((user: any) => !user.blocked).length;

  // Handlers de navegação
  const handleNavigateToUsers = () => navigate('/usuarios');
  const handleNavigateToRequests = () => navigate('/solicitacoes');
  const handleNavigateToEquipment = () => navigate('/equipamentos');

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <h1 className="text-3xl font-bold">Dashboard do Usuário</h1>
          <p>Bem-vindo ao sistema de gestão de TI.</p>
        </div>
      </AppLayout>
    );
  }

  const isLoading = requestsLoading || usersLoading || equipmentLoading;
  const isError = requestsError || usersError || equipmentError;

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="text-center text-destructive p-4 border border-destructive rounded-md">
            Erro ao carregar dados. Tente novamente mais tarde.
          </div>
        ) : (
          <div className="space-y-8">
            {/* Primeira linha de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard 
                title="Usuários Ativos" 
                value={activeUsers} 
                description="Usuários não bloqueados"
                icon={<Users className="h-8 w-8" />}
                onClick={handleNavigateToUsers}
              />
              <StatCard 
                title="Chromebooks" 
                value={chromebooks} 
                description="Total cadastrado"
                icon={<Laptop className="h-8 w-8" />}
                onClick={handleNavigateToEquipment}
              />
              <StatCard 
                title="iPads" 
                value={ipads} 
                description="Total cadastrado"
                icon={<Tablet className="h-8 w-8" />}
                onClick={handleNavigateToEquipment}
              />
            </div>

            {/* Segunda linha de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard 
                title="Solicitações Pendentes" 
                value={requestStatusCounts.pending || 0} 
                description="Aguardando aprovação"
                icon={<FileMinus className="h-8 w-8" />}
                onClick={handleNavigateToRequests}
                className="border-yellow-400 hover:border-yellow-500"
              />
              <StatCard 
                title="Solicitações Aprovadas" 
                value={requestStatusCounts.approved || 0} 
                description="Aprovadas recentemente"
                icon={<FileCheck className="h-8 w-8" />}
                onClick={handleNavigateToRequests}
                className="border-green-400 hover:border-green-500"
              />
              <StatCard 
                title="Em Andamento" 
                value={requestStatusCounts['in-progress'] || 0} 
                description="Em processamento"
                icon={<FileClock className="h-8 w-8" />}
                onClick={handleNavigateToRequests}
                className="border-blue-400 hover:border-blue-500"
              />
            </div>

            {/* Gráficos e visualizações */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de status das solicitações */}
              <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={handleNavigateToRequests}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Status das Solicitações</span>
                    <Button variant="ghost" size="sm">
                      Ver Detalhes
                    </Button>
                  </CardTitle>
                  <CardDescription>Distribuição completa dos status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <RequestStatusChart
                      data={requestStatusData}
                      legendPosition="bottom"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de tipos de equipamentos */}
              <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={handleNavigateToEquipment}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Tipos de Equipamentos</span>
                    <Button variant="ghost" size="sm">
                      Ver Inventário
                    </Button>
                  </CardTitle>
                  <CardDescription>Distribuição por tipo de equipamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <EquipmentUsageChart
                      chromebooks={chromebooks}
                      ipads={ipads}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de tipos de solicitação */}
              <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={handleNavigateToRequests}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Tipos de Solicitações</span>
                    <Button variant="ghost" size="sm">
                      Ver Detalhes
                    </Button>
                  </CardTitle>
                  <CardDescription>Distribuição por tipo de solicitação</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <RequestStatusChart
                      data={requestTypeData}
                      legendPosition="right"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Atividade Recente */}
              <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={handleNavigateToRequests}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Atividade Recente</span>
                    <Button variant="ghost" size="sm">
                      Ver Todas
                    </Button>
                  </CardTitle>
                  <CardDescription>Últimas 5 solicitações</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentActivity 
                    requests={requests.slice(-5).reverse()} 
                    showType={true}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;