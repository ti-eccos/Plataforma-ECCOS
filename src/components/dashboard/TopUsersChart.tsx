// src/components/dashboard/TopUsersChart.tsx

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface TopUser {
  userId: string;
  userName: string;
  requestCount: number;
}

interface TopUsersChartProps {
  data: TopUser[];
  darkMode?: boolean;
}

const COLORS = ['#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

// Esta função garante que o gráfico tenha pelo menos dados mínimos para exibição
const normalizeChartData = (data: TopUser[]): TopUser[] => {
  // Filtra dados com valor zero
  const filteredData = data.filter(item => item.requestCount > 0);
  
  // Se não houver dados válidos, retorna um placeholder
  if (filteredData.length === 0) {
    return [{
      userId: "no-data",
      userName: "Sem dados",
      requestCount: 1
    }];
  }
  
  return filteredData;
};

export const TopUsersChart: React.FC<TopUsersChartProps> = ({ data = [], darkMode = false }) => {
  const hasRealData = data.some(item => item.requestCount > 0);
  const normalizedData = normalizeChartData(data);
  
  const chartData = normalizedData.map((user, index) => ({
    ...user,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      {/* Gráfico */}
      <div className="flex-1 w-full flex justify-center items-center h-64">
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
              label={({ percent }) => 
                hasRealData ? `${(percent * 100).toFixed(0)}%` : ""
              }
            >
              {chartData.map((entry) => (
                <Cell 
                  key={`cell-${entry.userId}`} 
                  fill={hasRealData ? entry.color : "#d1d5db"}
                  stroke="#fff" 
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => hasRealData ? [value, name] : ["Sem dados", ""]}
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
      </div>

      {/* Legenda personalizada */}
      <div className="mt-2 px-2 text-sm w-full">
        {!hasRealData && (
          <p className="text-center text-gray-500">Não há dados de usuários disponíveis</p>
        )}
        
        {hasRealData && (
          <ul className="flex flex-col gap-2 justify-center items-center">
            {chartData
              .filter(entry => entry.userId !== "no-data" && entry.requestCount > 0)
              .map((entry, index) => (
                <li key={index} className="flex items-center gap-2 w-full justify-center">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></span>
                  <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                    {entry.userName} ({entry.requestCount})
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};