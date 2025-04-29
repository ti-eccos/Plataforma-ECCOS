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
  getNotifications
} from "@/services/notificationService";
import { Badge } from "@/components/ui/badge";

const AdminNotificacoes = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['allNotifications'],
    queryFn: () => getNotifications(''),
    enabled: isAdmin,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setIsUploading(true);
    try {
      await createNotification({
        title,
        message,
        link: link.trim() || null,
        createdAt: new Date(),
        readBy: [],
        userEmail: ""
      });
      
      toast.success("Notificação global enviada!");
      queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
    toast.success("Notificação excluída!");
  };

  if (!isAdmin) return null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Painel de Notificações</h1>
        
        <div className="p-6 bg-card rounded-lg shadow">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Mensagem"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />
            <Input
              placeholder="Link (opcional)"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              type="url"
            />
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Enviando..." : "Enviar Notificação Global"}
            </Button>
          </form>
        </div>

        <div className="p-6 bg-card rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Todas as Notificações</h2>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{notification.title}</h3>
                      <Badge variant={notification.userEmail ? "outline" : "secondary"}>
                        {notification.userEmail ? `Para: ${notification.userEmail}` : "Global"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {notification.readBy.length} usuários leram
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(notification.id)}
                  >
                    Excluir
                  </Button>
                </div>
                {notification.link && (
                  <a
                    href={notification.link}
                    className="text-primary text-sm underline mt-2 block"
                  >
                    {notification.link}
                  </a>
                )}
                <time className="text-xs text-muted-foreground block mt-2">
                  {format(new Date(notification.createdAt), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                </time>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminNotificacoes;