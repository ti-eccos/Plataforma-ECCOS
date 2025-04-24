import React, { useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getUserRequests } from "@/services/reservationService";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";

enum RequestStatus {
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected',
  'in-progress' = 'in-progress',
  completed = 'completed',
}

type Request = {
  id: string;
  type: string;
  status: RequestStatus;
  createdAt: Date;
  collectionName?: string;
  userName?: string;
  userEmail?: string;
  userId?: string;
  
  location?: string;
 
  category?: string;
  description?: string;
  deviceInfo?: string;
  priority?: string;
  unit?: string;

  date?: Date;
  endTime?: string;
  equipmentIds?: string[];
  purpose?: string;
  startTime?: string;

  itemName?: string;
  justification?: string;
  quantity?: number;
  unitPrice?: number;
  urgency?: string;
};

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const handleNavigateToRequests = () => navigate('/minhas-solicitacoes');

  const convertFirestoreData = (data: any): Request | null => {
    try {
      if (!data) return null;
      
      let normalizedStatus = ((data.status || '')).toLowerCase().trim();

      const statusMap: Record<string, RequestStatus> = {
        'hprongress': RequestStatus['in-progress'],
        'inprogress': RequestStatus['in-progress'],
        'in progress': RequestStatus['in-progress'],
        'em andamento': RequestStatus['in-progress'],
        'pendente': RequestStatus.pending,
        'aguardando': RequestStatus.pending,
        'aprovada': RequestStatus.approved,
        'aprovado': RequestStatus.approved,
        'rejeitada': RequestStatus.rejected,
        'rejeitado': RequestStatus.rejected,
        'negado': RequestStatus.rejected,
        'denied': RequestStatus.rejected,
        'concluida': RequestStatus.completed,
        'concluído': RequestStatus.completed,
        'finalizado': RequestStatus.completed,
        'done': RequestStatus.completed,
      };

      normalizedStatus = statusMap[normalizedStatus] || normalizedStatus;

      if (!Object.values(RequestStatus).includes(normalizedStatus as RequestStatus)) {
        normalizedStatus = RequestStatus.pending;
      }

      const convertFirebaseDate = (date: any): Date => {
        if (!date) return new Date();
        if (date instanceof Date) return date;
        return date?.toDate?.() || 
              (date?.seconds ? new Date(date.seconds * 1000) : 
              typeof date === 'string' ? new Date(date) : new Date());
      };

      return {
        id: data.id || `temp-${Math.random().toString(36).substring(2, 11)}`,
        type: (data.type || '').toLowerCase().trim(),
        status: normalizedStatus as RequestStatus,
        createdAt: convertFirebaseDate(data.createdAt),
        collectionName: data.collectionName,
        userName: data.userName || 'Usuário não identificado',
        userEmail: (data.userEmail || '').toLowerCase(),
        userId: data.userId || data.uid,
        location: data.location,

        category: data.category,
        description: data.description,
        deviceInfo: data.deviceInfo,
        priority: data.priority,
        unit: data.unit,

        date: data.date ? convertFirebaseDate(data.date) : undefined,
        endTime: data.endTime,
        equipmentIds: Array.isArray(data.equipmentIds) ? data.equipmentIds : [],
        purpose: data.purpose,
        startTime: data.startTime,
        
        itemName: data.itemName,
        justification: data.justification,
        quantity: Number(data.quantity) || 0,
        unitPrice: Number(data.unitPrice) || 0,
        urgency: data.urgency,
      };
    } catch (error) {
      console.error("Erro ao converter solicitação:", error, data);
      return null;
    }
  };

  const { data: requests = [], isLoading, isError, error } = useQuery<Request[]>({
    queryKey: ['userRequests', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        const res = await getUserRequests(currentUser.uid,currentUser.email);
        const processedData = res
          .filter(item => item) 
          .map((item) => {
            const processed = convertFirestoreData(item);
            return processed;
          })
          .filter(Boolean) as Request[];
        return processedData;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, 
    retry: 1,
  });

  const statusLabels: Record<RequestStatus, string> = {
    [RequestStatus.pending]: "Pendentes",
    [RequestStatus.approved]: "Aprovadas",
    [RequestStatus.rejected]: "Reprovadas",
    [RequestStatus['in-progress']]: "Em Progresso", 
    [RequestStatus.completed]: "Concluídas",
  };

  const statusColors: Record<RequestStatus, string> = {
    [RequestStatus.pending]: "#F59E0B",    
    [RequestStatus.approved]: "#10B981",   
    [RequestStatus['in-progress']]: "#3B82F6",
    [RequestStatus.rejected]: "#EF4444",  
    [RequestStatus.completed]: "#8B5CF6", 
  };

  const statusCounts = Object.values(RequestStatus).reduce((acc, status) => {
    acc[status] = requests.filter((r) => r.status === status).length;
    return acc;
  }, {} as Record<RequestStatus, number>);

  const statusChartData = [RequestStatus.pending, RequestStatus.approved, RequestStatus['in-progress']]
  .map((status) => ({
    name: statusLabels[status],
    value: statusCounts[status] || 0,
    color: statusColors[status]
  }));

  const typeCounts = requests.reduce((acc: Record<string, number>, req) => {
    acc[req.type] = (acc[req.type] || 0) + 1;
    return acc;
  }, {});

  const requestTypeData = Object.entries(typeCounts).map(([type, count]) => ({
    name: type === 'reservation' ? 'Reservas' :
          type === 'purchase' ? 'Compras' :
          type === 'support' ? 'Suporte' : type,
    value: count,
    color: type === 'reservation' ? '#3b82f6' :
           type === 'purchase' ? '#8b5cf6' :
           type === 'support' ? '#ec4899' :
           '#6b7280'
  }));

  const recentActivities = [...requests]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  return (
    <AppLayout>
      <div className="space-y-8 bg-black text-white p-4 rounded-lg">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        {isLoading ? (
          <DashboardLoading isLoading={true} isError={false} />
        ) : isError ? (
          <div className="p-6 bg-red-900 rounded-lg text-white">
            <h3 className="text-xl font-bold mb-2">Erro ao carregar dados</h3>
            <p>Ocorreu um erro ao buscar suas solicitações. Por favor, tente novamente mais tarde ou entre em contato com o suporte.</p>
            <button 
              className="mt-4 px-4 py-2 bg-white text-red-900 rounded-md font-medium"
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-6 bg-gray-800 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-2">Nenhuma solicitação encontrada</h3>
            <p className="text-gray-400">Você ainda não fez nenhuma solicitação ou todas foram canceladas.</p>
          </div>
        ) : (
          <>
            {/* Cards de status */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {Object.values(RequestStatus).map((status) => (
  <Card 
    key={status} 
    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 transition-colors cursor-pointer"
    onClick={handleNavigateToRequests}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">
        {statusLabels[status]}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{statusCounts[status] || 0}</div>
      <Badge className={`mt-2 ${statusColors[status]}`}>
        Solicitações
      </Badge>
    </CardContent>
  </Card>
))}
            </div>

            <DashboardCharts
              requestStatusData={statusChartData}
              requestTypeData={requestTypeData}
              requests={requests}
              darkMode={true}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default UserDashboard;