// src/components/dashboard/UserDashboard.tsx
import React from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getUserRequests } from "@/services/reservationService";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";

// Tipo completo com conversão de Timestamp
type RequestStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'in-progress'
  | 'completed'
  | 'canceled';

interface Request {
  id: string;
  type: string;
  status: RequestStatus;
  createdAt: Date; // Alterado para apenas Date
  // Outros campos conforme necessário
  collectionName?: string;
  userName?: string;
  userEmail?: string;
  userId?: string;
}

const UserDashboard = () => {
  const { currentUser } = useAuth();

  // Função de conversão de Timestamp para Date
  const convertFirestoreData = (data: any): Request => ({
    ...data,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    status: (data.status === 'canceled' ? 'rejected' : data.status) as RequestStatus
  });

  // Query com tratamento completo de tipos
  const {
    data: requests = [],
    isLoading,
    isError,
  } = useQuery<Request[]>({
    queryKey: ['userRequests', currentUser?.uid],
    queryFn: () => currentUser ? 
      getUserRequests(currentUser.uid)
        .then(res => res.map(convertFirestoreData)) 
      : [],
  });

  const statusCounts = requests.reduce((acc: Record<string, number>, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {});

  const recentActivities = [...requests]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const statusColors: Record<RequestStatus, string> = {
    pending: "bg-yellow-500",
    approved: "bg-green-500",
    rejected: "bg-red-500",
    "in-progress": "bg-blue-500",
    completed: "bg-purple-500",
    canceled: "bg-gray-500"
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Meu Painel</h1>
        
        <DashboardLoading isLoading={isLoading} isError={isError} />
        
        {!isLoading && !isError && (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {Object.entries(statusCounts).map(([status, count]) => (
                <Card key={status}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium capitalize">
                      {status.replace("-", " ")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{count}</div>
                    <Badge className={`mt-2 ${statusColors[status as RequestStatus]}`}>
                      Solicitações
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium capitalize">{request.type}</div>
                        <div className="text-sm text-gray-500">
                          {format(request.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                      <Badge className={statusColors[request.status]}>
                        {request.status.replace("-", " ")}
                      </Badge>
                    </div>
                  ))}
                  {recentActivities.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      Nenhuma atividade recente
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default UserDashboard;