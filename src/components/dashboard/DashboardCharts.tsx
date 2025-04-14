
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RequestStatusChart } from "@/components/dashboard/RequestStatusChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

interface DashboardChartsProps {
  requestStatusData: { name: string; value: number; color: string }[];
  equipmentTypeData: { name: string; value: number; color: string }[];
  requestTypeData: { name: string; value: number; color: string }[];
  requests: any[];
}

export function DashboardCharts({
  requestStatusData,
  equipmentTypeData,
  requestTypeData,
  requests
}: DashboardChartsProps) {
  const navigate = useNavigate();

  // Navigate to other pages on click
  const handleNavigateToRequests = () => navigate('/solicitacoes');
  const handleNavigateToEquipment = () => navigate('/equipamentos');

  return (
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
            <RequestStatusChart data={requestStatusData} />
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
            <RequestStatusChart data={equipmentTypeData} />
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
          <RequestStatusChart data={requestTypeData} />
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
  );
}
