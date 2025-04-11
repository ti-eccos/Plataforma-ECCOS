
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

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
  
  // Create a configuration object for the chart
  const config = data.reduce((acc, item) => {
    acc[item.name] = { color: item.color };
    return acc;
  }, {} as Record<string, { color: string }>);

  return (
    <div className="h-[300px] w-full">
      <ChartContainer config={config}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
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
          <Tooltip content={<ChartTooltipContent />} />
          <Legend />
        </PieChart>
      </ChartContainer>
      
      {totalValue === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground">Sem dados disponíveis</p>
        </div>
      )}
    </div>
  );
}
