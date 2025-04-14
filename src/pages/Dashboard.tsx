// pages/Dashboard.tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Package,
  BarChart3,
  ArrowUpRight,
  Calendar,
  Activity,
  Clock
} from "lucide-react";
import { Timestamp } from "firebase/firestore";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllRequests } from "@/services/reservationService";
import { getAllUsers } from "@/services/userService";
import { getAllEquipment } from "@/services/equipmentService";
import { RequestStatusChart } from "@/components/dashboard/RequestStatusChart";
import { EquipmentUsageChart } from "@/components/dashboard/EquipmentUsageChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface EquipmentUsageChartProps {
  requests: any[];
  equipment: any[];
  showTop?: number;
}

const toDate = (firebaseTime: Timestamp | Date): Date => {
  return firebaseTime instanceof Timestamp ? firebaseTime.toDate() : firebaseTime;
};

const EnhancedStatCard = ({ 
  title, 
  value, 
  icon, 
  onClick, 
  trend, 
  description 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  onClick?: () => void;
  trend?: { value: number; positive: boolean };
  description?: string;
}) => (
  <div 
    className="p-4 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-750 hover:shadow-md hover:shadow-primary/10 transition-all cursor-pointer flex items-center gap-4"
    onClick={onClick}
  >
    <div className="p-3 rounded-full bg-primary/20">
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="text-sm font-medium text-gray-400">{title}</h3>
      <div className="flex items-center gap-2">
        <p className="text-2xl font-bold text-white">{value}</p>
        {trend && (
          <Badge variant={trend.positive ? "default" : "destructive"} className="h-5">
            {trend.positive ? '+' : ''}{trend.value}%
          </Badge>
        )}
      </div>
      {description && (
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      )}
    </div>
    {onClick && <ArrowUpRight className="h-5 w-5 text-gray-400" />}
  </div>
);

const Dashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  
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
    data: equipment = [],
    isLoading: equipmentLoading,
    isError: equipmentError
  } = useQuery({
    queryKey: ['equipment'],
    queryFn: getAllEquipment,
    enabled: isAdmin,
  });

  const {
    data: users = [],
    isLoading: usersLoading,
    isError: usersError
  } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
    enabled: isAdmin,
  });

  const pendingRequests = requests.filter(req => req.status === 'pending').length;
  const activeUsers = users.filter(user => !user.blocked).length;

  const requestTypes = requests.reduce((acc, req) => {
    acc[req.type] = (acc[req.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const requestStatuses = requests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = [
    { name: 'Reservas', value: requestTypes.reservation || 0, color: '#60a5fa' },
    { name: 'Compras', value: requestTypes.purchase || 0, color: '#a78bfa' },
    { name: 'Suporte', value: requestTypes.support || 0, color: '#f472b6' }
  ];

  const statusData = [
    { name: 'Pendentes', value: requestStatuses.pending || 0, color: '#fbbf24' },
    { name: 'Aprovadas', value: requestStatuses.approved || 0, color: '#34d399' },
    { name: 'Em Andamento', value: requestStatuses['in-progress'] || 0, color: '#60a5fa' },
    { name: 'Concluídas', value: requestStatuses.completed || 0, color: '#a78bfa' },
    { name: 'Rejeitadas', value: requestStatuses.rejected || 0, color: '#f87171' },
    { name: 'Canceladas', value: requestStatuses.canceled || 0, color: '#94a3b8' }
  ];

  const handleNavigateToEquipment = () => navigate('/equipamentos');
  const handleNavigateToRequests = () => navigate('/solicitacoes');
  const handleNavigateToUsers = () => navigate('/usuarios');

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="space-y-8 p-6 max-w-6xl mx-auto bg-black text-white">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <Button onClick={() => navigate('/solicitar')} size="sm" variant="outline">Nova Solicitação</Button>
          </div>
          
          <Card className="bg-gray-900 border-gray-700 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Bem-vindo, {currentUser?.displayName || 'Usuário'}</CardTitle>
              <CardDescription className="text-gray-400">Acesse o sistema de gestão de TI da Eccos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => navigate('/solicitar/equipamento')} className="h-24 bg-gray-800 hover:bg-gray-700 border-gray-700 text-white">
                  <Package className="mr-2 h-5 w-5" />
                  Solicitar Equipamento
                </Button>
                <Button onClick={() => navigate('/solicitar/suporte')} className="h-24 bg-gray-800 hover:bg-gray-700 border-gray-700 text-white">
                  <Activity className="mr-2 h-5 w-5" />
                  Suporte Técnico
                </Button>
                <Button onClick={() => navigate('/minhas-solicitacoes')} className="h-24 bg-gray-800 hover:bg-gray-700 border-gray-700 text-white">
                  <Clock className="mr-2 h-5 w-5" />
                  Minhas Solicitações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const isLoading = requestsLoading || equipmentLoading || usersLoading;
  const isError = requestsError || equipmentError || usersError;

  return (
    <AppLayout>
      <div className="space-y-6 p-6 max-w-7xl mx-auto bg-black text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="text-gray-400">Visão geral do sistema de gestão de TI</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-transparent text-white border-gray-700 hover:bg-gray-800" onClick={() => navigate('/admin/relatorios')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Relatórios
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => navigate('/admin/solicitacoes/novo')}>
              Nova Solicitação
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-gray-900 border-gray-700 shadow-md">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24 bg-gray-700" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2 bg-gray-700" />
                  <Skeleton className="h-3 w-32 bg-gray-700" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center text-rose-500 p-8 border border-rose-500 rounded-md bg-rose-500/10">
            <h3 className="text-lg font-semibold">Erro ao carregar dados</h3>
            <p className="text-gray-300">Verifique a conexão e tente novamente mais tarde.</p>
            <Button variant="outline" className="mt-4 border-rose-500 text-rose-500 hover:bg-rose-500/20" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <EnhancedStatCard
                title="Solicitações"
                value={requests.length}
                icon={<Calendar className="h-5 w-5 text-primary" />}
                description={`${pendingRequests} pendentes`}
                onClick={handleNavigateToRequests}
              />

              <EnhancedStatCard
                title="Inventário"
                value={equipment.length}
                icon={<Package className="h-5 w-5 text-primary" />}
                onClick={handleNavigateToEquipment}
              />

              <EnhancedStatCard
                title="Usuários Ativos"
                value={activeUsers}
                icon={<Users className="h-5 w-5 text-primary" />}
                onClick={handleNavigateToUsers}
              />
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-3 mb-4 bg-gray-800">
                <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">Visão Geral</TabsTrigger>
                <TabsTrigger value="requests" className="data-[state=active]:bg-gray-700">Solicitações</TabsTrigger>
                <TabsTrigger value="equipment" className="data-[state=active]:bg-gray-700">Equipamentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4 pt-2">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gray-900 border-gray-700 shadow-md h-full">
                    <CardHeader>
                      <CardTitle className="text-white">Tipos de Solicitação</CardTitle>
                      <CardDescription className="text-gray-400">Distribuição por categoria</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <RequestStatusChart data={chartData} />
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900 border-gray-700 shadow-md h-full">
                    <CardHeader>
                      <CardTitle className="text-white">Status das Solicitações</CardTitle>
                      <CardDescription className="text-gray-400">Panorama atual</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <RequestStatusChart data={statusData} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="requests" className="space-y-4 pt-2">
                <Card className="bg-gray-900 border-gray-700 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-white">Tendência de Solicitações</CardTitle>
                    <CardDescription className="text-gray-400">Últimos 30 dias</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <EquipmentUsageChart 
                      requests={requests} 
                      equipment={equipment} 
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="equipment" className="space-y-4 pt-2">
                <Card className="bg-gray-900 border-gray-700 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-white">Utilização de Equipamentos</CardTitle>
                    <CardDescription className="text-gray-400">Top 5 mais solicitados</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <EquipmentUsageChart 
                      requests={requests} 
                      equipment={equipment} 
                      showTop={5}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;