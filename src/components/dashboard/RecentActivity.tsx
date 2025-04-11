
import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ShoppingCart, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RequestType } from "@/services/reservationService";

interface RecentActivityProps {
  requests: any[];
}

// Helper functions
const getRequestTypeIcon = (type: RequestType) => {
  switch (type) {
    case "reservation":
      return <Calendar className="h-4 w-4" />;
    case "purchase":
      return <ShoppingCart className="h-4 w-4" />;
    case "support":
      return <Wrench className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
};

const getReadableRequestType = (type: RequestType): string => {
  switch (type) {
    case "reservation": return "Reserva";
    case "purchase": return "Compra";
    case "support": return "Suporte";
    default: return "Desconhecido";
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline">Pendente</Badge>;
    case "approved":
      return <Badge variant="default" className="bg-green-500">Aprovada</Badge>;
    case "rejected":
      return <Badge variant="destructive">Reprovada</Badge>;
    case "in-progress":
      return <Badge variant="default" className="bg-blue-500">Em Andamento</Badge>;
    case "completed":
      return <Badge variant="default" className="bg-slate-500">Concluída</Badge>;
    case "canceled":
      return <Badge variant="default" className="bg-amber-500">Cancelada</Badge>;
    default:
      return <Badge variant="outline">Desconhecido</Badge>;
  }
};

export function RecentActivity({ requests }: RecentActivityProps) {
  // Sort requests by creation date (newest first)
  const sortedRequests = React.useMemo(() => {
    return [...requests]
      .filter(req => req.createdAt)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5); // Get only the 5 most recent
  }, [requests]);

  if (sortedRequests.length === 0) {
    return (
      <div className="text-center p-6 text-muted-foreground">
        Nenhuma atividade recente registrada.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedRequests.map((request, index) => (
        <div 
          key={`${request.collectionName}-${request.id}-${index}`}
          className="flex items-start gap-4 p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 p-2 text-primary flex items-center justify-center">
            {getRequestTypeIcon(request.type as RequestType)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium truncate">
                  {request.purpose || getReadableRequestType(request.type as RequestType)}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {request.userName || request.userEmail || "Usuário"}
                </p>
              </div>
              {getStatusBadge(request.status)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {request.createdAt ? 
                format(
                  new Date(request.createdAt.seconds * 1000),
                  "dd/MM/yy HH:mm",
                  { locale: ptBR }
                ) : 
                "Data desconhecida"
              }
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
