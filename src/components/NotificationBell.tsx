import React from "react";
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
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: !!currentUser,
    refetchOnWindowFocus: true,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
      await refetch();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-full 
            bg-[#0077E6]
            hover:bg-[#0060B3]
            active:bg-[#004C8F]
            transition-all
            duration-300
            shadow-lg
            shadow-[#0077E6]/30
            group"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-white/95 group-hover:text-white transition-colors" />
          ) : (
            <Bell className="h-5 w-5 text-white/95 group-hover:text-white transition-colors" />
          )}

          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-white/30" />

          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-2 rounded-full
                border-2 border-[#0077E6] bg-[#FF3B30] text-white
                shadow-sm"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <div className="grid gap-4 p-4">
          <h4 className="font-medium leading-none">Notificações</h4>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                Nenhuma notificação recente
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors
                    ${!notification.read 
                      ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30' 
                      : 'hover:bg-muted/50'}`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">{notification.title}</h5>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                    </div>

                    {notification.link && (
                      <a
                        href={notification.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver detalhes →
                      </a>
                    )}

                    <time className="text-xs text-muted-foreground mt-1">
                      {format(
                        new Date(notification.createdAt),
                        "dd/MM/yy 'às' HH:mm",
                        { locale: ptBR }
                      )}
                    </time>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};