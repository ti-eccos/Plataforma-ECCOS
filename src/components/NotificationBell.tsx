import React from "react";
import { Bell, BellRing, CheckCheck, Globe, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotifications, Notification, markAsRead, markAllAsRead } from "@/services/notificationService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const NotificationBell = () => {
  const { currentUser } = useAuth();
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const [isMarkingAll, setIsMarkingAll] = React.useState(false);

  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ['notifications', currentUser?.email],
    queryFn: () => getNotifications(currentUser?.email || ''),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000,
  });

  const unreadCount = notifications.filter(notification => 
    !notification.readBy?.includes(currentUser?.email || '')
  ).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.readBy?.includes(currentUser?.email || '')) {
      await markAsRead(notification.id, currentUser?.email || '');
      await refetch();
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || !currentUser?.email) return;
    
    setIsMarkingAll(true);
    try {
      await markAllAsRead(notifications, currentUser.email);
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`${unreadCount} notificações marcadas como lidas`);
    } catch (error) {
      toast.error("Erro ao marcar notificações como lidas");
      console.error("Erro:", error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  if (isLoading) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full bg-primary hover:bg-primary/90">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-white animate-pulse" />
          ) : (
            <Bell className="h-5 w-5 text-white" />
          )}
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 px-1.5 py-0.5">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0 border-blue-100 shadow-xl" align="end">
        <div className="grid gap-4 p-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-medium text-blue-800">Notificações</h4>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="flex items-center gap-1 text-xs"
              >
                <CheckCheck className="h-4 w-4" />
                {isMarkingAll ? "Marcando..." : "Marcar todas como lidas"}
              </Button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors relative
                    ${!notification.readBy?.includes(currentUser?.email || '') 
                      ? 'bg-blue-100 border-2 border-blue-500 shadow-sm' 
                      : 'bg-muted opacity-75'}
                    ${notification.userEmail === '' ? 'border-l-4 border-blue-500' : 
                    notification.title === 'Alteração de Status' ? 'border-l-4 border-green-500' : ''}`}
                >
                  {!notification.readBy?.includes(currentUser?.email || '') && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  )}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {notification.userEmail === '' ? (
                        <Badge className="self-start bg-blue-500 hover:bg-blue-600 flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span>Global</span>
                        </Badge>
                      ) : notification.title === 'Alteração de Status' ? (
                        <Badge className="self-start bg-green-500 hover:bg-green-600 flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          <span>Status</span>
                        </Badge>
                      ) : (
                        <Badge className="self-start bg-emerald-500 hover:bg-emerald-600 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Pessoal</span>
                        </Badge>
                      )}
                    </div>
                    <h5 className="font-medium">{notification.title}</h5>
                    <p className="text-sm">{notification.message}</p>
                    {notification.link && (
                      <a
                        href={notification.link}
                        className="text-primary text-sm underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver detalhes
                      </a>
                    )}
                    <time className="text-xs text-muted-foreground">
                      {format(new Date(notification.createdAt), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                    </time>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Nenhuma notificação recente
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};