import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Interface para os dados do gráfico de pizza
interface PieData {
  name: string;
  value: number;
  color: string;
}

// Interface para usuários ativos
interface TopUser {
  userId: string;
  userName: string;
  requestCount: number;
}

// Props do componente principal
interface DashboardChartsProps {
  requestStatusData?: PieData[];
  equipmentTypeData?: PieData[];
  requestTypeData?: PieData[];
  topUsersData?: TopUser[];
  requests?: any[]; // Adicionando a propriedade requests
  hideOtherCharts?: boolean;
  darkMode?: boolean;
  chartWrapperClass?: string;
  headerClass?: string;
}

// Componente de gráfico de donut reutilizável
const DonutChart = ({ data, title, darkMode = false }) => {
  // Estado para controlar se o gráfico está pronto para ser mostrado
  const [isReady, setIsReady] = useState(false);
  
  // Filtrar dados com valor maior que zero
  const validData = data.filter(item => item.value > 0);
  const hasData = validData.length > 0;
  
  // Efeito para simular animação de entrada
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden h-[420px]">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="pb-0 text-center">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-center items-center h-[350px]">
        <div className="h-64 w-full flex justify-center items-center">
          {isReady && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={validData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ percent }) => hasData ? `${(percent * 100).toFixed(0)}%` : ""}
                  paddingAngle={2}
                >
                  {validData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  contentStyle={{
                    backgroundColor: darkMode ? "#1f2937" : "#fff",
                    border: darkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                  }}
                  itemStyle={{ color: darkMode ? "#e5e7eb" : "#374151" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Legenda personalizada */}
        <div className="mt-2 px-2 text-sm w-full">
          {!hasData && (
            <p className="text-center text-gray-500">Não há dados disponíveis para exibir</p>
          )}
          
          {hasData && (
            <ul className="flex flex-col gap-2 justify-center items-center">
              {validData.map((entry, index) => (
                <li key={index} className="flex items-center gap-2 w-full justify-center">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                    {entry.name} ({entry.value})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de gráfico para usuários ativos
const TopUsersDonutChart = ({ data, title, darkMode = false }) => {
  // Estado para controlar se o gráfico está pronto para ser mostrado
  const [isReady, setIsReady] = useState(false);
  
  // Filtrar dados com contagem maior que zero
  const validData = data.filter(item => item.requestCount > 0);
  const hasData = validData.length > 0;
  
  // Cores para o gráfico
  const COLORS = ['#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
  
  // Dados formatados para o gráfico
  const chartData = validData.map((user, index) => ({
    ...user,
    color: COLORS[index % COLORS.length],
  }));
  
  // Efeito para simular animação de entrada
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden h-[420px]">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="pb-0 text-center">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-center items-center h-[350px]">
        <div className="h-64 w-full flex justify-center items-center">
          {isReady && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="requestCount"
                  nameKey="userName"
                  label={({ percent }) => hasData ? `${(percent * 100).toFixed(0)}%` : ""}
                  paddingAngle={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  contentStyle={{
                    backgroundColor: darkMode ? "#1f2937" : "#fff",
                    border: darkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                  }}
                  itemStyle={{ color: darkMode ? "#e5e7eb" : "#374151" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Legenda personalizada */}
        <div className="mt-2 px-2 text-sm w-full">
          {!hasData && (
            <p className="text-center text-gray-500">Não há dados de usuários disponíveis</p>
          )}
          
          {hasData && (
            <ul className="flex flex-col gap-2 justify-center items-center">
              {chartData.map((entry, index) => (
                <li key={index} className="flex items-center gap-2 w-full justify-center">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                    {entry.userName} ({entry.requestCount})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente principal que renderiza todos os gráficos
export function DashboardCharts({
  requestStatusData = [],
  equipmentTypeData = [],
  requestTypeData = [],
  topUsersData = [],
  requests = [],
  hideOtherCharts = false,
  darkMode = false,
  chartWrapperClass = "",
  headerClass = ""
}: DashboardChartsProps) {

  // Verifica se os dados existem e têm pelo menos um valor maior que zero
  const hasEquipmentData = equipmentTypeData.length > 0 && 
    equipmentTypeData.some(item => item.value > 0);
  
  const hasRequestTypeData = requestTypeData.length > 0 && 
    requestTypeData.some(item => item.value > 0);
  
  const hasStatusData = requestStatusData.length > 0 && 
    requestStatusData.some(item => item.value > 0);
  
  const hasTopUsersData = topUsersData.length > 0 && 
    topUsersData.some(item => item.requestCount > 0);

  // Se não houver dados em nenhum dos gráficos, mostra mensagem
  const hasAnyData = hasEquipmentData || hasRequestTypeData || hasStatusData || hasTopUsersData;

  return (
    <div className="space-y-6">
      <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", chartWrapperClass)}>
        {hasStatusData && (
          <DonutChart 
            data={requestStatusData} 
            title="Status das Solicitações" 
            darkMode={darkMode} 
          />
        )}

        {hasRequestTypeData && (
          <DonutChart 
            data={requestTypeData} 
            title="Tipos de Solicitações" 
            darkMode={darkMode} 
          />
        )}
      </div>
      
      <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", chartWrapperClass)}>
        {hasEquipmentData && (
          <DonutChart 
            data={equipmentTypeData} 
            title="Tipos de Equipamentos" 
            darkMode={darkMode} 
          />
        )}
        
        {hasTopUsersData && (
          <TopUsersDonutChart 
            data={topUsersData} 
            title="Usuários Mais Ativos" 
            darkMode={darkMode} 
          />
        )}
      </div>
      
      {!hasAnyData && (
        <div className="col-span-2 bg-white border border-gray-100 rounded-2xl shadow-lg p-8 text-center">
          <p className="text-lg text-gray-500">
            Não há dados suficientes para exibir os gráficos. Adicione equipamentos ou faça solicitações para visualizar as estatísticas.
          </p>
        </div>
      )}
    </div>
  );
}