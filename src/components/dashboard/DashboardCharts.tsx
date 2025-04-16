import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RequestStatusChart } from "@/components/dashboard/RequestStatusChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface DashboardChartsProps {
  requestStatusData?: PieData[];
  equipmentTypeData?: PieData[];
  requestTypeData?: PieData[];
  statusData?: PieData[]; // Adicionado para compatibilidade
  requests?: any[];
  hideOtherCharts?: boolean;
  darkMode?: boolean; // Novo prop para controlar o tema escuro
}

export function DashboardCharts({
  requestStatusData,
  equipmentTypeData,
  requestTypeData,
  statusData, // Para compatibilidade com o uso anterior
  requests,
  hideOtherCharts = false,
  darkMode = false
}: DashboardChartsProps) {
  const navigate = useNavigate();

  // Usar statusData se requestStatusData não for fornecido (para compatibilidade)
  const statusChartData = requestStatusData || statusData;

  const handleNavigateToRequests = () => navigate('/solicitacoes');
  const handleNavigateToEquipment = () => navigate('/equipamentos');

  // Classes condicionais baseadas no tema escuro
  const cardClass = darkMode 
    ? "bg-gray-800 border-gray-700 text-white shadow-md hover:shadow-lg transition-shadow cursor-pointer" 
    : "shadow-md hover:shadow-lg transition-shadow cursor-pointer";
  
  const descriptionClass = darkMode ? "text-gray-400" : "";
  const buttonClass = darkMode ? "text-blue-400 hover:text-blue-300" : "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Status das Solicitações */}
      {statusChartData && (
        <Card className={cardClass} onClick={handleNavigateToRequests}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Status das Solicitações</span>
              <Button variant="ghost" size="sm" className={buttonClass}>
                Ver Detalhes
              </Button>
            </CardTitle>
            <CardDescription className={descriptionClass}>
              Distribuição das solicitações por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <RequestStatusChart data={statusChartData}/>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Tipos de Solicitação */}
      {requestTypeData && (
        <Card className={cardClass} onClick={handleNavigateToRequests}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tipos de Solicitações</span>
              <Button variant="ghost" size="sm" className={buttonClass}>
                Ver Detalhes
              </Button>
            </CardTitle>
            <CardDescription className={descriptionClass}>
              Distribuição por tipo de solicitação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <RequestStatusChart data={requestTypeData}/>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Charts visíveis apenas no admin dashboard */}
      {!hideOtherCharts && (
        <>
          {/* Gráfico de Equipamentos */}
          {equipmentTypeData && (
            <Card className={cardClass} onClick={handleNavigateToEquipment}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tipos de Equipamentos</span>
                  <Button variant="ghost" size="sm" className={buttonClass}>
                    Ver Inventário
                  </Button>
                </CardTitle>
                <CardDescription className={descriptionClass}>
                  Distribuição por tipo de equipamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <RequestStatusChart data={equipmentTypeData} />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Atividade Recente */}
      {requests && requests.length > 0 && (
        <Card className={cardClass} onClick={handleNavigateToRequests}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Atividade Recente</span>
              <Button variant="ghost" size="sm" className={buttonClass}>
                Ver Todas
              </Button>
            </CardTitle>
            <CardDescription className={descriptionClass}>
              Últimas solicitações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity requests={requests} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}