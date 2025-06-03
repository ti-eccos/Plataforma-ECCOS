// Exemplo de como implementar na sua lista de solicitações

import React from "react";
import { RequestData } from "@/services/reservationService";
import MessageBadge from "@/components/MessageBadge";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface RequestListItemProps {
  request: RequestData;
  onOpenChat: (request: RequestData) => void;
}

const RequestListItem = ({ request, onOpenChat }: RequestListItemProps) => {
  return (
    <div className="p-4 border rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{request.userName}</h3>
          <p className="text-sm text-muted-foreground">
            {request.type === 'reservation' ? 'Reserva' : 
             request.type === 'purchase' ? 'Compra' : 'Suporte'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Corrigido: removido .length */}
          <MessageBadge 
            hasUnreadMessages={request.hasUnreadMessages || false}
            unreadCount={request.unreadMessages || 0} // Alterado aqui
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChat(request)}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </Button>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Status: <span className="capitalize">{request.status}</span>
      </div>
    </div>
  );
};

export default RequestListItem;