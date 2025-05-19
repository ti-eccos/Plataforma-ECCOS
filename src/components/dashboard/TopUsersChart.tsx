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

export const TopUsersChart: React.FC<TopUsersChartProps> = ({ data, darkMode = false }) => {
  const chartData = data.map((user, index) => ({
    ...user,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="h-full w-full flex flex-col">
      {/* Gráfico */}
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              innerRadius={50} // ← estilo em forma de donut
              fill="#8884d8"
              dataKey="requestCount"
              nameKey="userName"
              label={({ percent }) =>
                `${(percent * 100).toFixed(0)}%`
              }
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.userId}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? "#1f2937" : "#fff",
                border: darkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              itemStyle={{ color: darkMode ? "#e5e7eb" : "#374151" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda personalizada */}
      <div className="mt-4 px-2 text-sm">
        <ul className="space-y-2">
          {chartData.map((entry, index) => (
            <li key={index} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></span>
              <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                {entry.userName}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};