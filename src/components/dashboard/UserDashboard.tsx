import React from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getUserRequests } from "@/services/reservationService";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

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
  userName?: string;
  userId?: string;
  userEmail?: string;
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

      const convertFirebaseDate = (date: any): Date => {
        if (date instanceof Timestamp) return date.toDate();
        if (date?.seconds) return new Date(date.seconds * 1000);
        if (date instanceof Date) return date;
        return new Date(date);
      };

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

      return {
        id: data.id || `temp-${Math.random().toString(36).substring(2, 11)}`,
        type: (data.type || '').toLowerCase().trim(),
        status: normalizedStatus as RequestStatus,
        createdAt: convertFirebaseDate(data.createdAt),
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

  const { data: requests = [], isLoading, isError } = useQuery<Request[]>({
    queryKey: ['userRequests', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        const res = await getUserRequests(currentUser.uid, currentUser.email);
        return res
          .map(item => convertFirestoreData(item))
          .filter(Boolean) as Request[];
      } catch (err) {
        throw err;
      }
    },
    enabled: !!currentUser,
  });

  const statusLabels: Record<RequestStatus, string> = {
    [RequestStatus.pending]: "Pendentes",
    [RequestStatus.approved]: "Aprovadas",
    [RequestStatus.rejected]: "Reprovadas",
    [RequestStatus['in-progress']]: "Em Progresso",
    [RequestStatus.completed]: "Concluídas",
  };

  const statusColors: Record<RequestStatus, string> = {
    [RequestStatus.pending]: "#eab308",
    [RequestStatus.approved]: "#22c55e",
    [RequestStatus['in-progress']]: "#3b82f6",
    [RequestStatus.rejected]: "#ef4444",
    [RequestStatus.completed]: "#8b5cf6",
  };

  const statusCounts = Object.values(RequestStatus).reduce((acc, status) => {
    acc[status] = requests.filter((r) => r.status === status).length;
    return acc;
  }, {} as Record<RequestStatus, number>);

  const requestTypeCounts = requests.reduce((acc: Record<string, number>, req) => {
    acc[req.type] = (acc[req.type] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = [
    { name: 'Pendentes', value: statusCounts[RequestStatus.pending], color: '#eab308' },
    { name: 'Aprovadas', value: statusCounts[RequestStatus.approved], color: '#22c55e' },
    { name: 'Em Progresso', value: statusCounts[RequestStatus['in-progress']], color: '#3b82f6' },
  ];

  const requestTypeData = [
    { name: 'Reservas', value: requestTypeCounts.reservation || 0, color: '#3b82f6' },
    { name: 'Compras', value: requestTypeCounts.purchase || 0, color: '#8b5cf6' },
    { name: 'Suporte', value: requestTypeCounts.support || 0, color: '#ec4899' }
  ];

  return (
    <AppLayout>
      <div className="space-y-8 p-4">
        <h1 className="text-2xl font-bold">Meu Dashboard</h1>

        {isLoading ? (
          <DashboardLoading isLoading={true} isError={false} />
        ) : isError ? (
          <div className="p-6 bg-destructive/10 rounded-lg text-destructive">
            <h3 className="text-xl font-bold mb-2">Erro ao carregar dados</h3>
            <p>Ocorreu um erro ao buscar suas solicitações.</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-6 bg-muted rounded-lg text-center">
            <h3 className="text-xl font-bold mb-2">Nenhuma solicitação encontrada</h3>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {Object.values(RequestStatus).map((status) => (
                <Card 
                key={status}
                className={cn(
                  "bg-background text-card-foreground hover:bg-accent/20 cursor-pointer",
                  "border-0 border-l-4 border-blue-500 hover:border-blue-600",
                  "shadow-[rgba(0,0,0,0.10)_2px_2px_3px_0px] hover:shadow-[rgba(0,0,0,0.12)_4px_4px_5px_0px",
                  "transition-all duration-300 relative w-full h-full flex flex-col", // Adicionado flex e h-full
                  "before:content-[''] before:absolute before:left-0 before:top-0",
                  "before:w-[2px] before:h-full before:bg-gradient-to-b",
                  "before:from-transparent before:via-white/10 before:to-transparent before:opacity-30"
                )}
                onClick={handleNavigateToRequests}
              >
                <CardHeader className="pb-2 flex-1 flex items-center justify-center"> {/* Centralização vertical */}
                  <CardTitle className="text-sm font-medium text-center"> {/* Centralização horizontal */}
                    {statusLabels[status]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center text-center"> {/* Centralização total */}
                  <div className="text-2xl font-bold">{statusCounts[status]}</div>
                  <Badge 
                    variant="outline" 
                    className="mt-2 "
                  >
                    Solicitações
                  </Badge>
                </CardContent>
              </Card>
              ))}
            </div>

            <DashboardCharts
              requestStatusData={statusChartData}
              requestTypeData={requestTypeData}
              chartWrapperClass="bg-card p-6 rounded-lg border"
              headerClass="text-lg font-semibold"
              hideOtherCharts={true}
              darkMode={false}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default UserDashboard;