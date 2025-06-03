import React, { useEffect } from "react";
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
import { Home } from 'lucide-react';
import { Button } from "@/components/ui/button";
import NoticeBoard from "@/components/NoticeBoard";

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
  
  const handleNavigateToRequests = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/minhas-solicitacoes');
  };

  const handleNavigateToNewRequest = (type: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/nova-solicitacao/${type}`);
  };

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

  const { data: requests = [], isLoading, isError, refetch } = useQuery<Request[]>({
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

    const elements = document.querySelectorAll('.fade-up');
    elements.forEach((el) => observer.observe(el));
    
    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

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
      <div className="min-h-screen bg-white relative">
        {/* Background decorativo - removido pointer-events-none para evitar conflitos */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-sidebar blur-3xl opacity-5"></div>
          <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-eccos-purple blur-3xl opacity-5"></div>
        </div>

        <div className="relative z-10 p-6 md:p-12">
          {/* Título Fixo */}
          <div className="mb-8 fade-up">
            <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
              <Home className="text-eccos-purple" size={35} />
              Dashboard
            </h1>
          </div>

          {/* NoticeBoard - Sempre visível após o título */}
          <div className="fade-up mb-8">
            <NoticeBoard />
          </div>

          {/* Loading State */}
          <DashboardLoading isLoading={isLoading} isError={isError} />

          {/* Conteúdo Principal */}
          {!isLoading && !isError && (
            <>
              {requests.length === 0 ? (
                /* Estado Vazio */
                <div className="p-8 bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center fade-up">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-eccos-purple/10 text-eccos-purple mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>

                  <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                    Nenhuma solicitação encontrada
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                    Parece que você ainda não fez nenhuma solicitação. Escolha o tipo de solicitação abaixo para começar!
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button
                      type="button"
                      onClick={handleNavigateToNewRequest('reserva')}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[160px] cursor-pointer"
                    >
                      <span className="flex items-center justify-center w-5 h-5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </span>
                      Reserva
                    </Button>

                    <Button
                      type="button"
                      onClick={handleNavigateToNewRequest('compra')}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 min-w-[160px] cursor-pointer"
                    >
                      <span className="flex items-center justify-center w-5 h-5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="21" r="1"></circle>
                          <circle cx="20" cy="21" r="1"></circle>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.74a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                      </span>
                      Compra
                    </Button>

                    <Button
                      type="button"
                      onClick={handleNavigateToNewRequest('suporte')}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 min-w-[160px] cursor-pointer"
                    >
                      <span className="flex items-center justify-center w-5 h-5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                      </span>
                      Suporte
                    </Button>
                  </div>
                </div>
              ) : (
                /* Conteúdo com Solicitações */
                <div className="space-y-8 fade-up">
                  {/* Cards de Status */}
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
                    {Object.values(RequestStatus).map((status) => (
                      <Card
                        key={status}
                        className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden cursor-pointer"
                        onClick={handleNavigateToRequests}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleNavigateToRequests(e as any);
                          }
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            {statusLabels[status]}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                            {statusCounts[status]}
                          </div>
                          <Badge variant="outline" className="mt-2 border-eccos-purple text-eccos-purple">
                            Solicitações
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Gráficos */}
                  <div>
                    <DashboardCharts
                      requestStatusData={statusChartData}
                      requestTypeData={requestTypeData}
                      chartWrapperClass="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                      headerClass="text-lg font-semibold text-gray-600"
                      hideOtherCharts={true}
                      darkMode={false}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
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

export default UserDashboard;