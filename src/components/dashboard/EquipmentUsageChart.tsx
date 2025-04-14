import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface EquipmentUsageChartProps {
  chromebooks: number;
  ipads: number;
}

const COLORS = ['#3b82f6', '#8b5cf6'];

export function EquipmentUsageChart({ chromebooks, ipads }: EquipmentUsageChartProps) {
  const data = [
    { name: 'Chromebooks', value: chromebooks },
    { name: 'iPads', value: ipads },
  ];

  return (
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
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]} 
              stroke="#1f2937"
              strokeWidth={2}
            />
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
            borderRadius: '8px'
          }}
          itemStyle={{ color: '#e5e7eb' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}