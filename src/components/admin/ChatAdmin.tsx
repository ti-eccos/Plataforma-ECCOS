import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { 
  addMessageToRequest,
  MessageData,
  RequestData,
  getRequestById
} from "@/services/reservationService";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ChatAdminProps {
  request: RequestData | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMessageSent: () => void;
}

const ChatAdmin = ({ request, isOpen, onOpenChange, onMessageSent }: ChatAdminProps) => {
  const { currentUser } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!request || !isOpen) return;

    const unsubscribe = onSnapshot(
      doc(db, request.collectionName, request.id),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setMessages(data.messages || []);
          setIsLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [request, isOpen]);

  const handleSendMessage = async () => {
    if (!request || !newMessage.trim()) return;
    
    try {
      setIsLoading(true);
      await addMessageToRequest(
        request.id, 
        newMessage, 
        true,
        request.collectionName,
        currentUser?.displayName || "Administrador"
      );
      
      setNewMessage("");
      toast.success("Mensagem enviada");
      onMessageSent();
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chat da Solicitação</DialogTitle>
          {request && (
            <DialogDescription>
              {getReadableRequestType(request.type)} - {request.userName || request.userEmail} - {format(
                new Date(request.createdAt.toMillis()),
                "dd/MM/yyyy",
                { locale: ptBR }
              )}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto p-2 border rounded-md">
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg ${msg.isAdmin ? 'bg-primary text-primary-foreground ml-8' : 'bg-muted mr-8'}`}
                  >
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{msg.userName}</span>
                      <span>
                        {format(
                          new Date(msg.timestamp.toMillis()),
                          "dd/MM HH:mm",
                          { locale: ptBR }
                        )}
                      </span>
                    </div>
                    <p>{msg.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma mensagem ainda</p>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            <Textarea 
              placeholder="Digite sua mensagem..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="resize-none"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage} 
              className="flex-shrink-0"
              disabled={isLoading || !newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const getReadableRequestType = (type: string): string => {
  switch (type) {
    case "reservation": return "Reserva";
    case "purchase": return "Compra";
    case "support": return "Suporte";
    default: return type;
  }
};

export default ChatAdmin;