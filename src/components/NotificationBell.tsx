import React, { useEffect } from "react";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { getNotifications, Notification, markAsRead } from "@/services/notificationService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const NotificationBell = () => {
  const { currentUser } = useAuth();
  const [open, setOpen] = React.useState(false);

  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ['notifications', currentUser?.email],
    queryFn: () => getNotifications(currentUser?.email || ''),
    enabled: !!currentUser,
  });

  useEffect(() => {
    console.log('Notificações atualizadas:', notifications);
  }, [notifications]);

  const unreadCount = notifications.filter(notification => 
    notification.userEmail === "" 
      ? !notification.readBy?.includes(currentUser?.email || '')
      : !notification.readBy?.includes(currentUser?.email || '')
  ).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.readBy?.includes(currentUser?.email || '')) {
      await markAsRead(notification.id, currentUser?.email || '');
      await refetch();
    }
  };

  if (isLoading) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full bg-primary hover:bg-primary/90">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-white" />
          ) : (
            <Bell className="h-5 w-5 text-white" />
          )}
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2">{unreadCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <div className="grid gap-4 p-4">
          <h4 className="font-medium">Notificações</h4>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors
                  ${!notification.readBy?.includes(currentUser?.email || '') ? 'bg-blue-50' : 'bg-muted'}
                  ${notification.userEmail === '' ? 'border-l-4 border-purple-500' : ''}`}
              >
                <div className="flex flex-col gap-2">
                  {notification.userEmail === '' && (
                    <Badge variant="secondary" className="self-start">Global</Badge>
                  )}
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
            ))}
            {notifications.length === 0 && (
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