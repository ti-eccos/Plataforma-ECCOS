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
  BarChart3
} from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { getAllRequests } from "@/services/reservationService";
import { getAllUsers } from "@/services/userService";
import { getAllEquipment } from "@/services/equipmentService";
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

  // Get recently completed requests (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentlyCompleted = requests.filter((req: any) => {
    if (req.status !== 'completed') return false;
    
    // Check if createdAt exists and is within last 30 days
    if (!req.createdAt) return false;
    
    const createdDate = new Date(req.createdAt.seconds * 1000);
    return createdDate >= thirtyDaysAgo;
  });

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Usuários" 
                value={users.length} 
                description="Total de usuários registrados"
                icon={<Users className="h-8 w-8" />}
                onClick={handleNavigateToUsers}
              />
              <StatCard 
                title="Solicitações" 
                value={requests.length} 
                description="Total de solicitações"
                icon={<BarChart3 className="h-8 w-8" />}
                onClick={handleNavigateToRequests}
              />
              <StatCard 
                title="Equipamentos" 
                value={equipment.length} 
                description="Total no inventário"
                icon={<Package className="h-8 w-8" />}
                onClick={handleNavigateToEquipment}
              />
              <StatCard 
                title="Completadas" 
                value={recentlyCompleted.length} 
                description="Nos últimos 30 dias"
                icon={<Check className="h-8 w-8" />}
                onClick={handleNavigateToRequests}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Request Types Chart */}
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Tipos de Solicitações</span>
                    <Button variant="ghost" size="sm" onClick={handleNavigateToRequests}>
                      Ver Detalhes
                    </Button>
                  </CardTitle>
                  <CardDescription>Distribuição por tipo de solicitação</CardDescription>
                </CardHeader>
                <CardContent>
                  <RequestStatusChart
                    data={[
                      { name: 'Reservas', value: requestTypes.reservation || 0, color: '#3b82f6' },
                      { name: 'Compras', value: requestTypes.purchase || 0, color: '#8b5cf6' },
                      { name: 'Suporte', value: requestTypes.support || 0, color: '#ec4899' }
                    ]}
                  />
                </CardContent>
              </Card>

              {/* Status Chart */}
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Status das Solicitações</span>
                    <Button variant="ghost" size="sm" onClick={handleNavigateToRequests}>
                      Ver Detalhes
                    </Button>
                  </CardTitle>
                  <CardDescription>Distribuição por status atual</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      pending: { color: '#eab308' },
                      approved: { color: '#22c55e' },
                      'in-progress': { color: '#3b82f6' },
                      completed: { color: '#6b7280' },
                      rejected: { color: '#ef4444' },
                      canceled: { color: '#a1a1aa' }
                    }}
                  >
                    <BarChart 
                      data={[
                        { name: 'Pendente', value: requestStatuses.pending || 0, fill: '#eab308' },
                        { name: 'Aprovada', value: requestStatuses.approved || 0, fill: '#22c55e' },
                        { name: 'Em Progresso', value: requestStatuses['in-progress'] || 0, fill: '#3b82f6' },
                        { name: 'Concluída', value: requestStatuses.completed || 0, fill: '#6b7280' },
                        { name: 'Rejeitada', value: requestStatuses.rejected || 0, fill: '#ef4444' },
                        { name: 'Cancelada', value: requestStatuses.canceled || 0, fill: '#a1a1aa' }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" tick={{ fill: '#e5e7eb' }} />
                      <YAxis tick={{ fill: '#e5e7eb' }} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" name="Quantidade" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Equipment Usage */}
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Equipamentos Mais Utilizados</span>
                    <Button variant="ghost" size="sm" onClick={handleNavigateToEquipment}>
                      Ver Inventário
                    </Button>
                  </CardTitle>
                  <CardDescription>Top equipamentos em requisições</CardDescription>
                </CardHeader>
                <CardContent>
                  <EquipmentUsageChart requests={requests} equipment={equipment} />
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Atividade Recente</span>
                    <Button variant="ghost" size="sm" onClick={handleNavigateToRequests}>
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
