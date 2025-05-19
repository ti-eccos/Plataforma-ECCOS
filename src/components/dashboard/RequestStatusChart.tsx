// src/components/dashboard/RequestStatusChart.tsx

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface RequestStatusChartProps {
  data: PieData[];
  darkMode?: boolean;
}

export const RequestStatusChart: React.FC<RequestStatusChartProps> = ({ data, darkMode = false }) => {
  return (
    <div className="h-full w-full flex flex-col">
      {/* Gráfico */}
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              innerRadius={50} // estilo donut
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ percent }) =>
                `${(percent * 100).toFixed(0)}%`
              }
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda customizada */}
      <div className="mt-4 px-2 text-sm">
        <ul className="space-y-2">
          {data.map((entry, index) => (
            <li key={index} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></span>
              <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                {entry.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};