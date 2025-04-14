// components/dashboard/RequestStatusChart.tsx
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface DataItem {
  name: string;
  value: number;
  color: string;
}

interface RequestStatusChartProps {
  data: DataItem[];
}

export function RequestStatusChart({ data }: RequestStatusChartProps) {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-[300px] w-full relative">
      {totalValue === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          Nenhum dado disponível
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => 
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend 
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{
                paddingLeft: '20px',
                fontSize: '14px'
              }}
              formatter={(value: string) => (
                <span className="text-gray-400">{value}</span>
              )}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              itemStyle={{ color: '#e5e7eb' }}
              formatter={(value: number, name: string, entry: any) => [
                value, 
                <span key={name} style={{ color: entry.payload.color }}>
                  {name}
                </span>
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}