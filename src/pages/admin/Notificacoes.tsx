import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  createNotification,
  deleteNotification,
  getNotifications,
} from "@/services/notificationService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminNotificacoes = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ['adminNotifications'],
    queryFn: getNotifications,
    enabled: isAdmin,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsUploading(true);
    try {
      await createNotification({
        title,
        message,
        link: link.trim() || null,
        createdAt: new Date(),
        read: false,
      });

      toast.success("Notificação criada com sucesso!");
      setTitle("");
      setMessage("");
      setLink("");
      queryClient.invalidateQueries({ queryKey: ['adminNotifications', 'notifications'] });
    } catch (error) {
      toast.error("Erro ao criar notificação");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      queryClient.invalidateQueries({ queryKey: ['adminNotifications', 'notifications'] });
      toast.success("Notificação excluída com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir notificação");
    }
  };

  if (!isAdmin) return null;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold">Painel de Notificações</h1>
        
        <div className="p-6 bg-card rounded-lg shadow">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Título *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da notificação"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Mensagem *</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Conteúdo da notificação"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Link (opcional)</label>
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://exemplo.com"
              />
            </div>
            
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Publicando..." : "Publicar Notificação"}
            </Button>
          </form>
        </div>

        <div className="p-6 bg-card rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Histórico de Notificações</h2>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className="p-4 border rounded-lg flex justify-between items-start bg-background"
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{notification.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {format(
                          new Date(notification.createdAt),
                          "dd/MM/yy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setNotificationToDelete(notification.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                  {notification.link && (
                    <div className="text-sm text-blue-600">
                      <a 
                        href={notification.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {notification.link}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {notifications.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                Nenhuma notificação enviada
              </div>
            )}
          </div>
        </div>

        <AlertDialog open={!!notificationToDelete} onOpenChange={() => setNotificationToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir permanentemente esta notificação?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (notificationToDelete) {
                    handleDelete(notificationToDelete);
                    setNotificationToDelete(null);
                  }
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default AdminNotificacoes;