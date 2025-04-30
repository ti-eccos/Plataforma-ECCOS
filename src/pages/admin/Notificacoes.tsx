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
  createBatchNotifications,
  deleteNotification,
  getNotifications,
  Notification,
} from "@/services/notificationService";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  User,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import { getAllUsers } from "@/services/userService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<
    "all" | "global" | "individual" | "status"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ["allNotifications"],
    queryFn: () => getNotifications(""),
    enabled: isAdmin,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => getAllUsers(),
    enabled: isAdmin,
  });

  const filteredNotifications = notifications.filter((notification) => {
    const typeMatch =
      filterType === "all" ||
      (filterType === "global" && notification.recipients.length === 0) ||
      (filterType === "individual" &&
        notification.recipients.length > 0 &&
        notification.title !== "Alteração de Status") ||
      (filterType === "status" && notification.title === "Alteração de Status");

    const searchMatch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    return typeMatch && searchMatch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setIsUploading(true);
    try {
      const notificationsToCreate = isGlobal
        ? [
            {
              title,
              message,
              link: link.trim() || null,
              createdAt: new Date(),
              readBy: [],
              recipients: [],
              isBatch: false,
            },
          ]
        : [
            {
              title,
              message,
              link: link.trim() || null,
              createdAt: new Date(),
              readBy: [],
              recipients: selectedEmails,
              isBatch: selectedEmails.length > 1,
            },
          ];

      await createBatchNotifications(notificationsToCreate);
      toast.success("Notificação enviada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["allNotifications"] });
      setTitle("");
      setMessage("");
      setLink("");
      setSelectedEmails([]);
    } catch (error) {
      toast.error("Erro ao enviar notificação");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    queryClient.invalidateQueries({ queryKey: ["allNotifications"] });
    toast.success("Notificação excluída!");
  };

  if (!isAdmin) return null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Gerenciamento de Notificações</h1>

        <div className="bg-card p-6 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isGlobal ? "default" : "outline"}
                onClick={() => setIsGlobal(true)}
                className="flex-1"
              >
                <Globe className="h-4 w-4 mr-2" />
                Global
              </Button>
              <Button
                type="button"
                variant={!isGlobal ? "default" : "outline"}
                onClick={() => setIsGlobal(false)}
                className="flex-1"
              >
                <User className="h-4 w-4 mr-2" />
                Individual
              </Button>
            </div>

            {!isGlobal && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Destinatários</label>
                <MultiSelect
                  values={selectedEmails}
                  onValuesChange={setSelectedEmails}
                  placeholder="Selecione os usuários..."
                  options={users
                    .filter((user) => user.email)
                    .map((user) => ({
                      value: user.email!,
                      label: user.displayName || user.email!,
                      icon: (
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={user.photoURL || ""} />
                          <AvatarFallback>
                            {user.displayName?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ),
                    }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                placeholder="Digite o título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mensagem</label>
              <Textarea
                placeholder="Digite a mensagem"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Link (opcional)</label>
              <Input
                placeholder="https://exemplo.com"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                type="url"
              />
            </div>

            <Button type="submit" disabled={isUploading} className="w-full">
              {isUploading ? "Enviando..." : "Enviar Notificação"}
            </Button>
          </form>
        </div>

        <div className="bg-card p-6 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <Tabs
              value={filterType}
              onValueChange={(value) =>
                setFilterType(value as typeof filterType)
              }
              className="w-full sm:w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="global">
                  <Globe className="h-4 w-4 mr-1" />
                  Global
                </TabsTrigger>
                <TabsTrigger value="individual">
                  <User className="h-4 w-4 mr-1" />
                  Individual
                </TabsTrigger>
                <TabsTrigger value="status">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Status
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por título ou mensagem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredNotifications.map((notification) => {
              const allRecipients =
                notification.recipients.length === 0
                  ? users
                  : users.filter((user) =>
                      notification.recipients.includes(user.email!)
                    );

              const readers = allRecipients.filter((user) =>
                notification.readBy.includes(user.email!)
              );

              const unread = allRecipients.filter(
                (user) => !notification.readBy.includes(user.email!)
              );

              return (
                <div
                  key={notification.id}
                  className="p-4 border rounded-lg bg-background"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{notification.title}</h3>
                        {notification.title === "Alteração de Status" ? (
                          <Badge className="bg-purple-500 hover:bg-purple-600">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Status
                          </Badge>
                        ) : notification.recipients.length === 0 ? (
                          <Badge className="bg-blue-500 hover:bg-blue-600">
                            <Globe className="h-3 w-3 mr-1" />
                            Global
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600">
                            <User className="h-3 w-3 mr-1" />
                            Individual
                          </Badge>
                        )}
                      </div>

                      <p className="text-muted-foreground mb-2">
                        {notification.message}
                      </p>

                      {notification.link && (
                        <a
                          href={notification.link}
                          className="text-primary text-sm underline block mb-2"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {notification.link}
                        </a>
                      )}

                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground w-full">
                          <ChevronDown className="h-4 w-4" />
                          <span className="flex-1 text-left">
                            {allRecipients.length} destinatário
                            {allRecipients.length !== 1 && "s"} •{" "}
                            {readers.length} visualizaç
                            {readers.length !== 1 ? "ões" : "ão"}
                          </span>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="mt-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-green-500">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  Visualizado por
                                </span>
                              </div>
                              <div className="space-y-2">
                                {readers.map((user) => (
                                  <div
                                    key={user.uid}
                                    className="flex items-center gap-2"
                                  >
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={user.photoURL} />
                                      <AvatarFallback>
                                        {user.displayName?.[0]?.toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">
                                      {user.displayName || user.email}
                                    </span>
                                  </div>
                                ))}
                                {readers.length === 0 && (
                                  <span className="text-sm text-muted-foreground">
                                    Nenhuma visualização registrada
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-red-500">
                                <XCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  Não visualizado por
                                </span>
                              </div>
                              <div className="space-y-2">
                                {unread.map((user) => (
                                  <div
                                    key={user.uid}
                                    className="flex items-center gap-2"
                                  >
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={user.photoURL} />
                                      <AvatarFallback>
                                        {user.displayName?.[0]?.toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">
                                      {user.displayName || user.email}
                                    </span>
                                  </div>
                                ))}
                                {unread.length === 0 && (
                                  <span className="text-sm text-muted-foreground">
                                    Todos os destinatários visualizaram
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <time className="text-xs text-muted-foreground block mt-2">
                        {format(
                          new Date(notification.createdAt),
                          "dd/MM/yy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </time>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotificationToDelete(notification.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              );
            })}

            {filteredNotifications.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Nenhuma notificação encontrada
              </div>
            )}
          </div>
        </div>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
                onClick={async () => {
                  if (notificationToDelete) {
                    await handleDelete(notificationToDelete);
                    setIsDeleteDialogOpen(false);
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