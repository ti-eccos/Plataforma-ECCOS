import React, { useEffect } from "react";
import { Bell, BellRing, CheckCheck, Globe, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  getNotifications, 
  Notification, 
  markAsRead, 
  markAllAsRead,
  setupNotificationsListener
} from "@/services/notificationService";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const NotificationBell = () => {
  const { currentUser } = useAuth();
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const [isMarkingAll, setIsMarkingAll] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  // Usando listener em tempo real
  useEffect(() => {
    if (!currentUser?.email) return;

    const unsubscribe = setupNotificationsListener(
      currentUser.email,
      (fetchedNotifications) => {
        setNotifications(fetchedNotifications);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.email]);

  const unreadCount = notifications.filter(notification => 
    !notification.readBy?.includes(currentUser?.email || '')
  ).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!currentUser?.email) return;
    
    try {
      if (!notification.readBy?.includes(currentUser.email)) {
        await markAsRead(notification.id, currentUser.email);
queryClient.invalidateQueries({ queryKey: ['notifications'] });      }
    } catch (error) {
      toast.error("Erro ao marcar notificação como lida");
      console.error("Error:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser?.email || unreadCount === 0) return;
    
    setIsMarkingAll(true);
    try {
      await markAllAsRead(notifications, currentUser.email);
queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`${unreadCount} notificações marcadas como lidas`);
    } catch (error) {
      toast.error("Erro ao marcar notificações como lidas");
      console.error("Error:", error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const translateStatusInMessage = (message: string) => {
    const statusMap: Record<string, string> = {
      "pending": "pendente",
      "approved": "aprovado",
      "rejected": "reprovado",
      "in-progress": "em andamento",
      "waitingDelivery": "aguardando entrega",
      "delivered": "recebido",
      "completed": "concluído",
      "canceled": "cancelado"
    };

    return message.replace(
      new RegExp(Object.keys(statusMap).join("|"), "gi"),
      matched => statusMap[matched.toLowerCase()] || matched
    );
  };

  if (!currentUser) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-lg animate-pulse z-10">
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}
        <PopoverTrigger asChild>
          <Button 
            variant="ghost"
            size="icon"
            className={cn(
              "relative rounded-full w-10 h-10 hover:bg-gray-100 transition-colors",
              unreadCount > 0 && "text-primary"
            )}
          >
            {unreadCount > 0 ? (
              <BellRing className="h-8 w-8" />
            ) : (
              <Bell className="h-8 w-8" />
            )}
          </Button>
        </PopoverTrigger>
      </div>
      
      <PopoverContent 
        className="w-[350px] p-0 rounded-lg shadow-xl border border-gray-200"
        align="end"
        sideOffset={10}
      >
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notificações
            </h4>
            {unreadCount > 0 && (
             <Button 
  variant="ghost"
  size="sm"
  onClick={handleMarkAllAsRead}
  disabled={isMarkingAll || unreadCount === 0}
  className="text-primary hover:bg-primary/10"
>
  {isMarkingAll ? (
    <span className="flex items-center gap-2">
      <span className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent" />
      Processando...
    </span>
  ) : (
    <span className="flex items-center gap-2">
      <CheckCheck className="h-4 w-4" />
      Marcar todas como lida
    </span>
  )}
</Button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const isUnread = !notification.readBy?.includes(currentUser.email || '');
                const translatedMessage = translateStatusInMessage(notification.message);
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "p-4 border-b border-gray-100 cursor-pointer transition-colors",
                      isUnread ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {notification.title === 'Alteração de Status' ? (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Status
                          </Badge>
                        ) : notification.recipients.length === 0 ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <Globe className="h-3 w-3 mr-1" />
                            Global
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <User className="h-3 w-3 mr-1" />
                            Individual
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {translatedMessage}
                        </p>
                        {notification.link && (
                          <a
                            href={notification.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-sm text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Ver detalhes
                          </a>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.createdAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      
                      {isUnread && (
                        <div className="w-2 h-2 rounded-full bg-primary ml-2" />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Bell className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Nenhuma notificação</p>
                <p className="text-gray-400 text-sm mt-1">
                  As notificações aparecerão aqui quando chegarem
                </p>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};