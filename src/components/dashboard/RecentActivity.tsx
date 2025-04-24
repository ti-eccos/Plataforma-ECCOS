import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RequestData } from "@/services/reservationService";
import { Calendar, ShoppingCart, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecentActivityProps {
  requests: RequestData[];
  showType?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-500';
    case 'approved': return 'bg-green-500';
    case 'rejected': return 'bg-red-500';
    case 'in-progress': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

export const RecentActivity = ({ requests, showType = false }: RecentActivityProps) => {
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Atividade Recente</h3>
      {requests.map((request) => (
        <div key={request.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
          <div className="flex items-center gap-3">
            {showType && (
              <div className="text-muted-foreground">
                {request.type === 'reservation' && <Calendar className="h-4 w-4" />}
                {request.type === 'purchase' && <ShoppingCart className="h-4 w-4" />}
                {request.type === 'support' && <Wrench className="h-4 w-4" />}
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{request.userName}</p>
              <p className="text-xs text-muted-foreground">
              {format(
  new Date(
    typeof request.createdAt === 'string' 
      ? request.createdAt 
      : Number(request.createdAt) * 1000 
  ), 
  "dd/MM/yy HH:mm", 
  { locale: ptBR }
)}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(request.status)}>
            {request.status}
          </Badge>
        </div>
      ))}
    </div>
  );
};