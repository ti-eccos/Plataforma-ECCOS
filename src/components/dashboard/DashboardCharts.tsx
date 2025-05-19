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
  
  const cardClass = cn(
    "bg-background text-card-foreground border-0 border-l-4",
    "shadow-[rgba(0,0,0,0.10)_2px_2px_3px_0px] hover:shadow-[rgba(0,0,0,0.12)_4px_4px_5px_0px",
    "transition-all duration-300 w-full min-h-[300px] flex flex-col",
    darkMode 
      ? "border-blue-300 hover:border-blue-400" 
      : "border-blue-500 hover:border-blue-600",
    "before:content-[''] before:absolute before:left-0 before:top-0",
    "before:w-[2px] before:h-full before:bg-gradient-to-b",
    "before:from-transparent before:via-white/10 before:to-transparent before:opacity-30"
  );

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", chartWrapperClass)}>
  {/* Gráfico de Tipos de Equipamentos */}
  {equipmentTypeData && (
    <Card className={cardClass}>
      <CardHeader>
        <CardTitle className={cn("text-xl font-bold", headerClass)}>
          Tipos de Equipamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 flex-1">
        <div className="h-full">
          <RequestStatusChart data={equipmentTypeData} />
        </div>
      </CardContent>
    </Card>
  )}

  {/* Gráfico de Tipos de Solicitação */}
  {requestTypeData && (
    <Card className={cardClass}>
      <CardHeader>
        <CardTitle className={cn("text-xl font-bold", headerClass)}>
          Tipos de Solicitações
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 flex-1">
        <div className="h-full">
          <RequestStatusChart data={requestTypeData} />
        </div>
      </CardContent>
    </Card>
  )}
  
  {/* Gráfico de Status das Solicitações */}
  {requestStatusData && (
    <Card className={cardClass}>
      <CardHeader>
        <CardTitle className={cn("text-xl font-bold", headerClass)}>
          Status das Solicitações
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 flex-1">
        <div className="h-full">
          <RequestStatusChart data={requestStatusData} />
        </div>
      </CardContent>
    </Card>
  )}


  {/* Gráfico de Usuários Ativos */}
  {topUsersData && (
    <Card className={cardClass}>
      <CardHeader>
        <CardTitle className={cn("text-xl font-bold", headerClass)}>
          Usuários Mais Ativos
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 flex-1">
        <div className="h-full">
          <TopUsersChart data={topUsersData} />
        </div>
      </CardContent>
    </Card>
  )}
</div>
  );
}