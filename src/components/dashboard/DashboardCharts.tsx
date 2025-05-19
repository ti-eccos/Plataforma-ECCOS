import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RequestStatusChart } from "@/components/dashboard/RequestStatusChart";
import { TopUsersChart } from "@/components/dashboard/TopUsersChart";
import { cn } from "@/lib/utils";

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface DashboardChartsProps {
  requestStatusData?: PieData[];
  equipmentTypeData?: PieData[];
  requestTypeData?: PieData[];
  topUsersData?: any[];
  requests?: any[];
  hideOtherCharts?: boolean;
  darkMode?: boolean;
  chartWrapperClass?: string;
  headerClass?: string;
}

export function DashboardCharts({
  requestStatusData,
  equipmentTypeData,
  requestTypeData,
  topUsersData,
  requests,
  hideOtherCharts = false,
  darkMode = false,
  chartWrapperClass = "",
  headerClass = "",
}: DashboardChartsProps) {
  const navigate = useNavigate();

  // Classes para o card com estilo visual completo
  const cardClass = cn(
  "bg-white border border-gray-100 rounded-2xl shadow-lg",
  "hover:shadow-xl transition-all duration-300 relative group overflow-hidden",
  "min-h-[300px]",
  );

  // Classe para o background gradient no card
  const cardGradientOverlay = cn(
    "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent",
    "opacity-0 group-hover:opacity-100 transition-opacity"
  );

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", chartWrapperClass)}>
      {/* Gráfico de Tipos de Equipamentos */}
      {equipmentTypeData && (
        <Card className={cardClass}>
          <div className={cardGradientOverlay} />
          <CardHeader>
            <CardTitle className={cn("text-xl font-bold", headerClass)}>
              Tipos de Equipamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
      <RequestStatusChart data={equipmentTypeData} />
    </CardContent>
  </Card>
)}

      {/* Gráfico de Tipos de Solicitação */}
      {requestTypeData && (
        <Card className={cardClass}>
          <div className={cardGradientOverlay} />
          <CardHeader>
            <CardTitle className={cn("text-xl font-bold", headerClass)}>
              Tipos de Solicitações
            </CardTitle>
          </CardHeader>
          <CardContent>
      <RequestStatusChart data={requestTypeData} />
    </CardContent>
  </Card>
)}

      {/* Gráfico de Status das Solicitações */}
      {requestStatusData && (
        <Card className={cardClass}>
          <div className={cardGradientOverlay} />
          <CardHeader>
            <CardTitle className={cn("text-xl font-bold", headerClass)}>
              Status das Solicitações
            </CardTitle>
          </CardHeader>
          <CardContent>
      <RequestStatusChart data={requestStatusData} />
    </CardContent>
  </Card>
)}

      {/* Gráfico de Usuários Ativos */}
      {topUsersData && (
        <Card className={cardClass}>
          <div className={cardGradientOverlay} />
          <CardHeader>
            <CardTitle className={cn("text-xl font-bold", headerClass)}>
              Usuários Mais Ativos
            </CardTitle>
          </CardHeader>
           <CardContent>
      <TopUsersChart data={topUsersData} />
    </CardContent>
  </Card>
)}
    </div>
  );
}