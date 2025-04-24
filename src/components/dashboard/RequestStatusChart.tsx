import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface DataItem {
  name: string;
  value: number;
  color: string;
}

interface RequestStatusChartProps {
  data: DataItem[];
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  legendWrapperStyle?: React.CSSProperties;
}

export function RequestStatusChart({ 
  data, 
  legendPosition = 'bottom',
  legendWrapperStyle = {}
}: RequestStatusChartProps) {
  const filteredData = data.filter(item => item.value > 0);
  const totalValue = filteredData.reduce((sum, item) => sum + item.value, 0);

  const legendConfig = {
    layout: (legendPosition === 'top' || legendPosition === 'bottom' ? 'horizontal' : 'vertical') as 'horizontal' | 'vertical',
    verticalAlign: (legendPosition === 'left' || legendPosition === 'right' ? 'middle' : legendPosition) as 'top' | 'bottom' | 'middle',
    align: (legendPosition === 'right' ? 'right' : legendPosition === 'left' ? 'left' : 'center') as 'left' | 'center' | 'right',
    wrapperStyle: {
      ...legendWrapperStyle,
      paddingLeft: legendPosition === 'right' ? '20px' : '0',
      paddingRight: legendPosition === 'left' ? '20px' : '0',
      paddingTop: legendPosition === 'bottom' ? '20px' : '0',
      fontSize: '14px'
    }
  };

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
              data={filteredData}
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
              {filteredData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="#1f2937"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Legend 
              {...legendConfig}
              formatter={(value: string) => (
                <span className="text-gray-400">{value}</span>
              )}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              itemStyle={{ 
                color: '#e5e7eb',
                fontSize: '14px'
              }}
              formatter={(value: number, name: string, entry: any) => [
                <span key={`value-${name}`} className="text-indigo-400">
                  {value}
                </span>,
                <span key={`name-${name}`} style={{ color: entry.payload.color }}>
                  {name}
                </span>
              ]}
              itemSorter={(item) => -item.value}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}