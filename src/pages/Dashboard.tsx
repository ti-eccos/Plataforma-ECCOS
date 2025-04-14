
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

  // Navigate to other pages on click
  const handleNavigateToUsers = () => navigate('/usuarios');
  const handleNavigateToRequests = () => navigate('/solicitacoes');
  const handleNavigateToEquipment = () => navigate('/equipamentos');

  // If user is not an admin, show another dashboard
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

  // Count request by type
  const reservationRequests = requests.filter((req: any) => req.type === 'reservation').length;
  const purchaseRequests = requests.filter((req: any) => req.type === 'purchase').length;
  const supportRequests = requests.filter((req: any) => req.type === 'support').length;

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cards for main metrics */}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard 
                title="Solicitações Pendentes" 
                value={pendingRequests} 
                description="Aguardando aprovação"
                icon={<FileMinus className="h-8 w-8" />}
                onClick={handleNavigateToRequests}
                className="border-yellow-400 hover:border-yellow-500"
              />
              <StatCard 
                title="Solicitações Aprovadas" 
                value={approvedRequests} 
                description="Aprovadas recentemente"
                icon={<FileCheck className="h-8 w-8" />}
                onClick={handleNavigateToRequests}
                className="border-green-400 hover:border-green-500"
              />
              <StatCard 
                title="Solicitações Em Andamento" 
                value={inProgressRequests} 
                description="Em processamento"
                icon={<FileClock className="h-8 w-8" />}
                onClick={handleNavigateToRequests}
                className="border-blue-400 hover:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Request Status Chart */}
              <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={handleNavigateToRequests}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Status das Solicitações</span>
                    <Button variant="ghost" size="sm">
                      Ver Detalhes
                    </Button>
                  </CardTitle>
                  <CardDescription>Distribuição das solicitações por status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <RequestStatusChart
                      data={requestStatusData}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Equipment Type Chart */}
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
                    <RequestStatusChart
                      data={equipmentTypeData}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Request Types Chart */}
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
                  <RequestStatusChart
                    data={[
                      { name: 'Reservas', value: reservationRequests, color: '#3b82f6' },
                      { name: 'Compras', value: purchaseRequests, color: '#8b5cf6' },
                      { name: 'Suporte', value: supportRequests, color: '#ec4899' }
                    ]}
                  />
                </CardContent>
              </Card>

              {/* Recent Activity */}
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
                  <RecentActivity requests={requests} />
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
