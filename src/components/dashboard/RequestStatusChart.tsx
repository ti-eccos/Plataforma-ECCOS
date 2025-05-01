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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0].payload;
      const percentage = ((value / totalValue) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-md">
          <p className="text-blue-600 font-semibold">{name}</p>
          <p className="text-gray-700">{`${percentage}%`}</p>
        </div>
      );
    }
    return null;
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
              label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
            >
              {filteredData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="#f3f4f6"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Legend 
              {...legendConfig}
              formatter={(value: string, entry: any) => {
                const percentage = (entry.payload.value / totalValue * 100).toFixed(1);
                return <span className="text-gray-700">{value} ({percentage}%)</span>;
              }}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}