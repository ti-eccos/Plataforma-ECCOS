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
    return <Skeleton className="h-12 w-12 rounded-full" />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="default" 
          size="icon"
          className="relative rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-sidebar to-eccos-purple hover:from-eccos-purple hover:to-sidebar group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {unreadCount > 0 ? (
            <BellRing className="h-6 w-6 text-white animate-pulse relative z-10" />
          ) : (
            <Bell className="h-6 w-6 text-white relative z-10" />
          )}
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-semibold shadow-lg animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0 border border-gray-100 shadow-2xl rounded-2xl bg-white" align="end">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
          <div className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-sidebar blur-3xl opacity-5"></div>
          <div className="absolute right-1/4 bottom-1/4 h-24 w-24 rounded-full bg-eccos-purple blur-3xl opacity-5"></div>
        </div>

        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
            <h4 className="font-bold text-xl flex items-center gap-3 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-eccos-purple/10 text-eccos-purple">
                <Bell className="h-4 w-4" />
              </div>
              Notificações
            </h4>
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="border-eccos-purple text-eccos-purple hover:bg-eccos-purple hover:text-white transition-all duration-200 rounded-lg"
              >
                {isMarkingAll ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
                    Marcando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCheck className="h-4 w-4" />
                    Marcar todas
                  </div>
                )}
              </Button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-3">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const isUnread = !notification.readBy?.includes(currentUser?.email || '');
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border relative group ${
                      isUnread 
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:border-eccos-purple shadow-sm hover:shadow-md' 
                        : 'bg-gray-50 border-gray-100 hover:bg-gray-100 opacity-75'
                    }`}
                  >
                    {isUnread && (
                      <div className="absolute top-3 right-3 w-3 h-3 bg-gradient-to-r from-sidebar to-eccos-purple rounded-full animate-pulse shadow-lg"></div>
                    )}
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        {notification.title === 'Alteração de Status' ? (
                          <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-sm">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Status
                          </Badge>
                        ) : notification.recipients.length === 0 ? (
                          <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm">
                            <Globe className="h-3 w-3 mr-1" />
                            Global
                          </Badge>
                        ) : (
                          <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-sm">
                            <User className="h-3 w-3 mr-1" />
                            Individual
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="font-semibold text-gray-900 leading-tight">
                          {notification.title}
                        </h5>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {notification.message}
                        </p>
                        {notification.link && (
                          <a
                            href={notification.link}
                            className="inline-flex items-center text-sm text-eccos-purple hover:text-sidebar font-medium transition-colors underline decoration-2 underline-offset-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Ver detalhes
                          </a>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <time className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded-lg border border-gray-100">
                          {format(new Date(notification.createdAt), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                        </time>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                  <Bell className="h-8 w-8" />
                </div>
                <p className="text-gray-500 font-medium text-lg">Nenhuma notificação</p>
                <p className="text-gray-400 text-sm mt-1">As notificações aparecerão aqui quando chegarem</p>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};