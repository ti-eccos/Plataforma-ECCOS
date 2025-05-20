// src/components/dashboard/RequestStatusChart.tsx

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface RequestStatusChartProps {
  data: PieData[];
  darkMode?: boolean;
}

// Esta função garante que o gráfico tenha pelo menos dados mínimos para exibição
const normalizeChartData = (data: PieData[]): PieData[] => {
  // Filtra dados com valor zero
  const filteredData = data.filter(item => item.value > 0);
  
  // Se não houver dados válidos, retorna um placeholder
  if (filteredData.length === 0) {
    return [{
      name: "Sem dados",
      value: 1,
      color: "#d1d5db"
    }];
  }
  
  return filteredData;
};

export const RequestStatusChart: React.FC<RequestStatusChartProps> = ({ 
  data = [], 
  darkMode = false 
}) => {
  const chartData = normalizeChartData(data);
  const hasRealData = data.some(item => item.value > 0);

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
              dataKey="value"
              nameKey="name"
              label={({ percent }) => hasRealData ? `${(percent * 100).toFixed(0)}%` : ""}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => hasRealData ? [value, name] : ["Sem dados", ""]}
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

      {/* Legenda customizada */}
      <div className="mt-2 px-2 text-sm w-full">
        {!hasRealData && (
          <p className="text-center text-gray-500">Não há dados disponíveis para exibir</p>
        )}
        
        {hasRealData && (
          <ul className="flex flex-col gap-2 justify-center items-center">
            {data.filter(item => item.value > 0).map((entry, index) => (
              <li key={index} className="flex items-center gap-2 w-full justify-center">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></span>
                <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                  {entry.name} ({entry.value})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};