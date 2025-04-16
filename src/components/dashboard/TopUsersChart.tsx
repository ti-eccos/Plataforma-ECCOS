import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface TopUsersChartProps {
  data: Array<{
    userName: string;
    requestCount: number;
  }>;
  darkMode?: boolean;
}

export function TopUsersChart({ data, darkMode = false }: TopUsersChartProps) {
  const COLORS = ['#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
  
  const chartData = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length]
  }));

  // Função para truncar nomes longos
  const truncateName = (name: string) => {
    return name.length > 12 
      ? `${name.substring(0, 10)}...`
      : name;
  };

  return (
    <div className="h-[300px] w-full relative">
      {data.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          Nenhum dado disponível
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="requestCount"
              nameKey="userName"
              label={({ name, percent }) => 
                `${truncateName(name)}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="#1f2937"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Legend 
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px'
              }}
              formatter={(value: string) => (
                <span className="text-gray-400">
                  {truncateName(value)}
                </span>
              )}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              itemStyle={{ 
                color: darkMode ? '#e5e7eb' : '#374151',
                fontSize: '14px'
              }}
              formatter={(value: number, name: string, entry: any) => [
                <span key={`value-${name}`} className="text-indigo-400">
                  {value} solicitações
                </span>,
                <span key={`name-${name}`} style={{ color: entry.payload.color }}>
                  {name} {/* Nome completo no tooltip */}
                </span>
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}