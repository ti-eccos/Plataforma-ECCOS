
import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface EquipmentUsageChartProps {
  requests: any[];
  equipment: any[];
}

export function EquipmentUsageChart({ requests, equipment }: EquipmentUsageChartProps) {
  // Count equipment usage in reservations
  const equipmentUsage = useMemo(() => {
    const usageCounts: Record<string, number> = {};
    
    // Go through each request that has equipment IDs
    requests.forEach((request: any) => {
      if (request.type === 'reservation' && Array.isArray(request.equipmentIds)) {
        request.equipmentIds.forEach((equipId: string) => {
          usageCounts[equipId] = (usageCounts[equipId] || 0) + 1;
        });
      }
    });
    
    // Convert to array and map equipment names
    const equipmentMap = equipment.reduce((map, item) => {
      map[item.id] = item.name;
      return map;
    }, {} as Record<string, string>);

    // Create chart data
    const chartData = Object.entries(usageCounts)
      .map(([id, count]) => ({
        name: equipmentMap[id] || `Equip. ${id.substring(0, 4)}`,
        value: count,
        fill: '#3b82f6'
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Get top 5
    
    return chartData;
  }, [requests, equipment]);

  return (
    <div className="h-[300px] w-full">
      <ChartContainer
        config={{
          value: { color: '#3b82f6' }
        }}
      >
        <BarChart 
          data={equipmentUsage}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 70, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" tick={{ fill: '#e5e7eb' }} />
          <YAxis 
            dataKey="name" 
            type="category" 
            tick={{ fill: '#e5e7eb' }} 
            width={60}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" name="Requisições" />
        </BarChart>
      </ChartContainer>
      
      {equipmentUsage.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground">Sem dados disponíveis</p>
        </div>
      )}
    </div>
  );
}
