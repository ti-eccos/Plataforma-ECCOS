import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Globe,
  User,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Search,
  BellPlus,
  List,
} from "lucide-react";
import {
  createBatchNotifications,
  deleteNotification,
  getNotifications,
  Notification,
} from "@/services/notificationService";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import { getAllUsers } from "@/services/userService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminNotificacoes = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("send");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<"all" | "global" | "individual" | "status">("all");
  const [searchTerm, setSearchTerm] = useState("");

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

    try {
      const notificationsToCreate = isGlobal
        ? [{
            title,
            message,
            link: link.trim() || null,
            createdAt: new Date(),
            readBy: [],
            recipients: [],
            isBatch: false,
          }]
        : [{
            title,
            message,
            link: link.trim() || null,
            createdAt: new Date(),
            readBy: [],
            recipients: selectedEmails,
            isBatch: selectedEmails.length > 1,
          }];

      await createBatchNotifications(notificationsToCreate);
      toast.success("Notificação enviada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["allNotifications"] });
      setTitle("");
      setMessage("");
      setLink("");
      setSelectedEmails([]);
    } catch (error) {
      toast.error("Erro ao enviar notificação");
    }
  };

  const { currentUser } = useAuth();
  if (!['admin', 'superadmin', 'financeiro'].includes(currentUser?.role || '')) return null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">
            Gerenciamento de Notificações
          </h1>
          <p className="text-sm text-muted-foreground">
            Envie notificações globais ou individuais e gerencie o histórico
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full bg-gray-100 dark:bg-gray-800 p-1 rounded-lg gap-px">
            <TabsTrigger
              value="send"
              className="rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white h-9 flex items-center justify-center gap-2"
            >
              <BellPlus className="h-4 w-4" />
              Enviar Notificação
            </TabsTrigger>
            <TabsTrigger
              value="manage"
              className="rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white h-9 flex items-center justify-center gap-2"
            >
              <List className="h-4 w-4" />
              Gerenciar Notificações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="mt-4">
            <Card className="shadow-sm">
              <CardContent className="pt-6 space-y-4">
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
                        }))}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Input
                    placeholder="Título da notificação"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Mensagem detalhada..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="Link relacionado (opcional)"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    type="url"
                  />
                </div>

                <Button type="submit" onClick={handleSubmit} className="w-full">
                  Enviar Notificação
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="mt-4">
            <Card className="shadow-sm">
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Tabs
                    value={filterType}
                    onValueChange={(value) => setFilterType(value as typeof filterType)}
                    className="w-full sm:w-auto"
                  >
                    <TabsList className="grid grid-cols-4 gap-1">
                      <TabsTrigger value="all">Todos</TabsTrigger>
                      <TabsTrigger value="global">
                        <Globe className="h-4 w-4 mr-1" />
                      </TabsTrigger>
                      <TabsTrigger value="individual">
                        <User className="h-4 w-4 mr-1" />
                      </TabsTrigger>
                      <TabsTrigger value="status">
                        <RefreshCw className="h-4 w-4 mr-1" />
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar notificações..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div key={notification.id} className="p-4 border rounded-lg bg-background">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{notification.title}</h3>
                            {notification.title === "Alteração de Status" ? (
                              <Badge variant="secondary">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Status
                              </Badge>
                            ) : notification.recipients.length === 0 ? (
                              <Badge variant="default">
                                <Globe className="h-3 w-3 mr-1" />
                                Global
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <User className="h-3 w-3 mr-1" />
                                Individual
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm">{notification.message}</p>
                        </div>
                        <AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">
      Excluir
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta ação não pode ser desfeita. A notificação será permanentemente removida.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction
        onClick={async () => {
          try {
            await deleteNotification(notification.id);
            toast.success("Notificação excluída com sucesso");
            queryClient.invalidateQueries({ queryKey: ["allNotifications"] });
          } catch (error) {
            toast.error("Falha ao excluir notificação");
          }
        }}
      >
        Confirmar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AdminNotificacoes;