import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface EquipmentUsageChartProps {
  chromebooks: number;
  ipads: number;
  darkMode?: boolean;
}

const COLORS = ['#3b82f6', '#8b5cf6'];

export function EquipmentUsageChart({ 
  chromebooks, 
  ipads, 
  darkMode = false 
}: EquipmentUsageChartProps) {
  const data = [
    { name: 'Chromebooks', value: chromebooks },
    { name: 'iPads', value: ipads },
  ];

  const hasData = chromebooks > 0 || ipads > 0;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      {/* Gráfico */}
      <div className="flex-1 w-full flex justify-center items-center h-64">
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
              label={({ percent }) => hasData ? `${(percent * 100).toFixed(0)}%` : ""}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip 
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
        {!hasData && (
          <p className="text-center text-gray-500">Não há dados de equipamentos disponíveis</p>
        )}
        
        {hasData && (
          <ul className="flex flex-col gap-2 justify-center items-center">
            {data.filter(item => item.value > 0).map((entry, index) => (
              <li key={index} className="flex items-center gap-2 w-full justify-center">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
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
}