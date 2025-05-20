import React, { useState, useEffect } from "react";
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
  Bell,
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

  // Animação de entrada (fade-up)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

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
    }
  };

  const { currentUser } = useAuth();

  if (!["admin", "superadmin", "financeiro"].includes(currentUser?.role || "")) return null;

  return (
    <AppLayout>
      <div className="min-h-screen bg-white relative">
        {/* Fundos decorativos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-sidebar blur-3xl opacity-5"></div>
          <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-eccos-purple blur-3xl opacity-5"></div>
        </div>

        {/* Conteúdo principal */}
        <div className="relative z-10 space-y-8 p-6 md:p-12 fade-up">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
              <Bell className="text-eccos-purple" size={35} />
              Gerenciamento de Notificações
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              Envie notificações globais ou individuais e gerencie o histórico
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="fade-up">
            <TabsList className="grid grid-cols-2 w-full bg-white border border-gray-100 rounded-2xl shadow-lg p-1 h-14">
              <TabsTrigger
                value="send"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-sidebar data-[state=active]:to-eccos-purple data-[state=active]:text-white data-[state=inactive]:text-gray-600 h-12 flex items-center justify-center gap-2 font-medium transition-all duration-300 mx-1"
              >
                <BellPlus className="h-4 w-4" />
                Enviar Notificação
              </TabsTrigger>
              <TabsTrigger
                value="manage"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-sidebar data-[state=active]:to-eccos-purple data-[state=active]:text-white data-[state=inactive]:text-gray-600 h-12 flex items-center justify-center gap-2 font-medium transition-all duration-300 mx-1"
              >
                <List className="h-4 w-4" />
                Gerenciar Notificações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="send" className="mt-8 fade-up relative z-20">
              <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
                <CardHeader className="pb-4 relative z-10">
                  <CardTitle className="text-xl font-semibold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                    Nova Notificação
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-6 relative z-10">
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={isGlobal ? "default" : "outline"}
                      onClick={() => setIsGlobal(true)}
                      className={`flex-1 h-12 rounded-xl font-medium transition-all duration-300 ${
                        isGlobal 
                          ? "bg-gradient-to-r from-sidebar to-eccos-purple hover:from-eccos-purple hover:to-sidebar" 
                          : "border-gray-200 text-gray-600 hover:border-eccos-purple hover:text-eccos-purple"
                      }`}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Global
                    </Button>
                    <Button
                      type="button"
                      variant={!isGlobal ? "default" : "outline"}
                      onClick={() => setIsGlobal(false)}
                      className={`flex-1 h-12 rounded-xl font-medium transition-all duration-300 ${
                        !isGlobal 
                          ? "bg-gradient-to-r from-sidebar to-eccos-purple hover:from-eccos-purple hover:to-sidebar" 
                          : "border-gray-200 text-gray-600 hover:border-eccos-purple hover:text-eccos-purple"
                      }`}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Individual
                    </Button>
                  </div>

                  {!isGlobal && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700">Destinatários</label>
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

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700">Título</label>
                    <Input
                      placeholder="Digite o título da notificação"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="h-12 rounded-xl border-gray-200 focus:border-eccos-purple focus:ring-eccos-purple"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700">Mensagem</label>
                    <Textarea
                      placeholder="Digite a mensagem detalhada..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      required
                      className="rounded-xl border-gray-200 focus:border-eccos-purple focus:ring-eccos-purple resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700">Link (opcional)</label>
                    <Input
                      placeholder="https://exemplo.com"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      type="url"
                      className="h-12 rounded-xl border-gray-200 focus:border-eccos-purple focus:ring-eccos-purple"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    onClick={handleSubmit} 
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-sidebar to-eccos-purple hover:from-eccos-purple hover:to-sidebar text-white font-medium transition-all duration-300"
                  >
                    <BellPlus className="h-4 w-4 mr-2" />
                    Enviar Notificação
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manage" className="mt-8 fade-up relative z-20">
              <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
                <CardHeader className="pb-4 relative z-10">
                  <CardTitle className="text-xl font-semibold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                    Histórico de Notificações
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-6 relative z-10">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Tabs
                      value={filterType}
                      onValueChange={(value) => setFilterType(value as typeof filterType)}
                      className="w-full sm:w-auto"
                    >
                      <TabsList className="grid grid-cols-4 bg-gray-50 p-1 rounded-xl h-12">
                        <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm h-10 text-sm">
                          Todos
                        </TabsTrigger>
                        <TabsTrigger value="global" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm h-10 text-sm">
                          <Globe className="h-4 w-4 mr-1" />
                        </TabsTrigger>
                        <TabsTrigger value="individual" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm h-10 text-sm">
                          <User className="h-4 w-4 mr-1" />
                        </TabsTrigger>
                        <TabsTrigger value="status" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm h-10 text-sm">
                          <RefreshCw className="h-4 w-4 mr-1" />
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Pesquisar notificações..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 rounded-xl border-gray-200 focus:border-eccos-purple focus:ring-eccos-purple"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {filteredNotifications.length === 0 ? (
                      <div className="text-center py-12">
                        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhuma notificação encontrada</p>
                      </div>
                    ) : (
                      filteredNotifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className="p-6 border border-gray-100 rounded-2xl bg-white hover:shadow-lg transition-all duration-300 relative z-10"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="font-semibold text-gray-900 text-lg">{notification.title}</h3>
                                {notification.title === "Alteração de Status" ? (
                                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Status
                                  </Badge>
                                ) : notification.recipients.length === 0 ? (
                                  <Badge className="bg-gradient-to-r from-sidebar to-eccos-purple text-white">
                                    <Globe className="h-3 w-3 mr-1" />
                                    Global
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-eccos-purple text-eccos-purple">
                                    <User className="h-3 w-3 mr-1" />
                                    Individual
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-600 leading-relaxed">{notification.message}</p>
                              {notification.link && (
                                <a 
                                  href={notification.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-block mt-2 text-eccos-purple hover:text-sidebar text-sm font-medium"
                                >
                                  Ver link relacionado →
                                </a>
                              )}
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  className="ml-4 rounded-xl hover:bg-red-600 transition-colors duration-300"
                                >
                                  Excluir
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. A notificação será permanentemente removida.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="rounded-xl bg-red-600 hover:bg-red-700"
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
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Rodapé */}
        <footer className="relative z-10 bg-gray-50 py-10 px-4 md:px-12 fade-up">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <p className="text-gray-500 text-sm">
                © 2025 Colégio ECCOS - Todos os direitos reservados
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Estilos CSS para animação fade-up */}
      <style>{`
        .fade-up {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        
        .fade-up.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </AppLayout>
  );
};

export default AdminNotificacoes;