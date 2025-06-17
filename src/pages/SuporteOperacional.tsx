import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Wrench,
  Filter,
  Search,
  Trash2,
  MessageSquare,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Calendar,
  Package
} from "lucide-react";
import { toast } from "sonner";
import {
  getAllRequests,
  getRequestById,
  deleteRequest,
} from "@/services/sharedService";
import {RequestStatus, RequestData} from '@/services/types'
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import ChatAdmin from "@/components/admin/ChatAdmin";
import { createNotification } from "@/services/notificationService";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const getStatusBadge = (status: RequestStatus) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pendente</Badge>;
    case "in-progress":
      return <Badge className="bg-blue-500 text-white">Em Andamento</Badge>;
    case "completed":
      return <Badge className="bg-green-500 text-white">Concluído</Badge>;
    case "canceled":
      return <Badge className="bg-amber-500 text-white">Cancelado</Badge>;
    default:
      return <Badge variant="outline">Desconhecido</Badge>;
  }
};

const getPriorityLevelBadge = (level?: string) => {
  if (!level) return <Badge variant="outline">Não especificado</Badge>;
  const config = {
    labels: {
      critical: "Crítica",
      high: "Alta",
      medium: "Média",
      low: "Baixa",
    },
    colors: {
      critical: "bg-red-100 text-red-600 border-red-200",
      high: "bg-orange-100 text-orange-600 border-orange-200",
      medium: "bg-amber-100 text-amber-600 border-amber-200",
      low: "bg-green-100 text-green-600 border-green-200",
    },
  };
  const normalizedLevel = level.toLowerCase();
  return (
    <Badge className={cn("border", config.colors[normalizedLevel])}>
      {config.labels[normalizedLevel] || level}
    </Badge>
  );
};

const SuporteOperacional = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<{ id: string; collectionName: string } | null>(
    null
  );
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [viewedRequests, setViewedRequests] = useState<Set<string>>(() => {
    const saved = typeof window !== "undefined"
      ? localStorage.getItem("operacionalViewedRequests")
      : null;
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRequest, setChatRequest] = useState<RequestData | null>(null);
  const supportTypes = ["Tecnologia", "Manutenção"];
  const [selectedTypes, setSelectedTypes] = useState<string[]>(supportTypes);

  const { data: allRequests = [], isLoading } = useQuery({
    queryKey: ['allRequests'],
    queryFn: () => getAllRequests(),
  });

  useEffect(() => {
    const checkUnreadMessages = () => {
      const newUnread: Record<string, number> = {};
      allRequests.forEach((req) => {
        const messages = req.messages || [];
        const unreadCount = messages.filter(
          (msg) =>
            !msg.isAdmin &&
            !viewedRequests.has(`${req.id}-${msg.timestamp.toMillis()}`)
        ).length;
        if (unreadCount > 0) {
          newUnread[req.id] = unreadCount;
        }
      });
      setUnreadMessages(newUnread);
    };
    checkUnreadMessages();
  }, [allRequests, viewedRequests]);

  const handleOpenChat = async (request: RequestData) => {
    try {
      const fullRequest = await getRequestById(request.id, request.collectionName);
      setChatRequest(fullRequest);
      setViewedRequests((prev) => {
        const newSet = new Set(prev);
        (fullRequest.messages || []).forEach((msg) => {
          if (!msg.isAdmin) {
            newSet.add(`${fullRequest.id}-${msg.timestamp.toMillis()}`);
          }
        });
        localStorage.setItem("operacionalViewedRequests", JSON.stringify(Array.from(newSet)));
        return newSet;
      });
      setUnreadMessages((prev) => {
        const newUnread = { ...prev };
        delete newUnread[fullRequest.id];
        return newUnread;
      });
      setIsChatOpen(true);
    } catch (error) {
      toast.error("Erro ao abrir chat");
      console.error("Error:", error);
    }
  };

  const handleStatusChange = async (status: RequestStatus) => {
    if (!selectedRequest) return;
    
    try {
      const docRef = doc(db, selectedRequest.collectionName, selectedRequest.id);
      await updateDoc(docRef, { status });
      
      await createNotification({
        title: "Alteração de Status",
        message: `Status do seu chamado foi alterado para: ${status}`,
        link: "minhas-solicitacoes",
        createdAt: new Date(),
        readBy: [],
        recipients: [selectedRequest.userEmail],
        isBatch: false,
      });
      
      toast.success("Status atualizado");
      queryClient.invalidateQueries({ queryKey: ['allRequests'] });
      setSelectedRequest({ ...selectedRequest, status });
    } catch (error) {
      toast.error("Erro ao atualizar");
      console.error("Error:", error);
    }
  };

  const handleDeleteRequest = (request: RequestData) => {
    setRequestToDelete({
      id: request.id,
      collectionName: request.collectionName,
    });
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return;
    try {
      await deleteRequest(requestToDelete.id, requestToDelete.collectionName);
      toast.success("Excluído com sucesso");
      setIsDeleteDialogOpen(false);
      setRequestToDelete(null);
      if (isDetailsOpen) setIsDetailsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['allRequests'] });
    } catch (error) {
      toast.error("Erro ao excluir");
      console.error("Error:", error);
    }
  };

  const filteredRequests = allRequests
    .filter(req => req.type === 'support')
    .filter(req => {
      const search = searchTerm.toLowerCase();
      return (
        (req.userName?.toLowerCase().includes(search) ||
        req.userEmail?.toLowerCase().includes(search) ||
        req.description?.toLowerCase().includes(search)) &&
        selectedTypes.includes(req.tipo)
      );
    });

  // Calcular estatísticas
  const totalRequests = filteredRequests.length;
  const pendingRequests = filteredRequests.filter(req => req.status === 'pending').length;
  const inProgressRequests = filteredRequests.filter(req => req.status === 'in-progress').length;
  const completedRequests = filteredRequests.filter(req => req.status === 'completed').length;

  return (
    <AppLayout>
      <div className="min-h-screen bg-white relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-sidebar blur-3xl opacity-5"></div>
          <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-eccos-purple blur-3xl opacity-5"></div>
        </div>

        <div className="relative z-10 space-y-8 p-6 md:p-12">
          {/* Header */}
          <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
            <Wrench className="text-eccos-purple" size={35} />
            Solicitações de Suporte
          </h1>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eccos-purple"></div>
            </div>
          ) : (
            <>
              {/* Cards de estatísticas */}
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total de Chamados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                      {totalRequests}
                    </div>
                    <Badge variant="outline" className="mt-2 border-eccos-purple text-eccos-purple">
                      Total
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Pendentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                      {pendingRequests}
                    </div>
                    <Badge variant="outline" className="mt-2 border-yellow-500 text-yellow-500">
                      <Clock className="h-3 w-3 mr-1" />
                      Aguardando
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Em Andamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                      {inProgressRequests}
                    </div>
                    <Badge variant="outline" className="mt-2 border-blue-500 text-blue-500">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Concluídos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                      {completedRequests}
                    </div>
                    <Badge variant="outline" className="mt-2 border-green-500 text-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Finalizados
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Filtros */}
              <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Pesquisar por nome, email ou descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12 rounded-xl border-gray-200 focus:border-eccos-purple"
                      />
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2 h-12 rounded-xl border-gray-200 px-6">
                          <Filter className="h-4 w-4" /> Tipo ({selectedTypes.length})
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background rounded-xl">
                        {supportTypes.map((type) => (
                          <DropdownMenuCheckboxItem
                            key={type}
                            checked={selectedTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTypes([...selectedTypes, type]);
                              } else {
                                setSelectedTypes(selectedTypes.filter(t => t !== type));
                              }
                            }}
                          >
                            {type}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela */}
              {filteredRequests.length === 0 ? (
                <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg">
                  <CardContent className="p-12">
                    <div className="text-center text-muted-foreground">
                      <Wrench className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">Nenhuma solicitação de suporte encontrada</p>
                      <p className="text-sm">Tente ajustar os filtros para ver mais resultados</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-100">
                            <TableHead className="font-semibold text-gray-700">Solicitante</TableHead>
                            <TableHead className="font-semibold text-gray-700 hidden md:table-cell">Tipo</TableHead>
                            <TableHead className="font-semibold text-gray-700">Status</TableHead>
                            <TableHead className="font-semibold text-gray-700 hidden lg:table-cell">Prioridade</TableHead>
                            <TableHead className="font-semibold text-gray-700">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRequests.map((request) => (
                            <TableRow key={request.id} className="border-gray-100 hover:bg-gray-50/50 transition-colors">
                              <TableCell className="font-medium">{request.userName}</TableCell>
                              <TableCell className="hidden md:table-cell">{request.tipo}</TableCell>
                              <TableCell>{getStatusBadge(request.status)}</TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {getPriorityLevelBadge(request.priority)}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl hover:bg-eccos-purple/10 hover:text-eccos-purple"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setIsDetailsOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-blue-600 relative"
                                    onClick={() => handleOpenChat(request)}
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                    {unreadMessages[request.id] > 0 && (
                                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {unreadMessages[request.id]}
                                      </span>
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Dialog de detalhes */}
         <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
  <DialogContent className="max-w-3xl bg-white border border-gray-100 rounded-2xl overflow-hidden">
    {selectedRequest && (
      <div className="flex flex-col h-[80vh]">
        {/* Cabeçalho fixo */}
        <DialogHeader className="p-6 pb-2 border-b border-gray-100 bg-white sticky top-0 z-10">
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-purple-500" />
            <span className="bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
              Chamado de Suporte - {selectedRequest.userName || selectedRequest.userEmail}
            </span>
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center justify-between text-gray-500 px-1 mt-2">
              <div>
                {format(
                  selectedRequest.createdAt.toDate(),
                  "dd/MM/yyyy HH:mm",
                  { locale: ptBR }
                )}
              </div>
              <div>{getStatusBadge(selectedRequest.status)}</div>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Conteúdo específico para suporte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Tipo</p>
              <p className="font-medium">{selectedRequest.tipo || "Não especificado"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Solicitante</p>
              <p className="font-medium">{selectedRequest.userName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Unidade</p>
              <p className="font-medium">{selectedRequest.unit}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Localização</p>
              <p className="font-medium">{selectedRequest.location}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Categoria</p>
              <p className="font-medium">{selectedRequest.category}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Prioridade</p>
              <div className="mt-1">
                {getPriorityLevelBadge(selectedRequest.priority)}
              </div>
            </div>
          </div>
          {selectedRequest.deviceInfo && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Identificação do Equipamento</p>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="break-words">{selectedRequest.deviceInfo}</p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">Descrição do Problema</p>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="whitespace-pre-wrap break-words">{selectedRequest.description}</p>
            </div>
          </div>
          {/* Controle de status */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  Alterar Status
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-xl">
                {["pending", "in-progress", "completed", "canceled"].map((status) => (
                  <DropdownMenuItem 
                    key={status} 
                    onSelect={() => handleStatusChange(status as RequestStatus)}
                    className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusBadge(status as RequestStatus)}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Rodapé fixo opcional */}
        <DialogFooter className="p-6 border-t border-gray-100 gap-2 bg-white sticky bottom-0 z-10">
          <Button
            variant="destructive"
            onClick={() => handleDeleteRequest(selectedRequest)}
            className="w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Chamado
          </Button>
        </DialogFooter>
      </div>
    )}
  </DialogContent>
</Dialog>

          {/* Chat Admin */}
          <ChatAdmin
            request={chatRequest}
            isOpen={isChatOpen}
            onOpenChange={setIsChatOpen}
            onMessageSent={() => queryClient.invalidateQueries({ queryKey: ['allRequests'] })}
          />

          {/* Dialog de confirmação de exclusão */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir permanentemente este chamado? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  className="rounded-xl bg-red-600 hover:bg-red-700"
                >
                  Confirmar Exclusão
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Footer */}
        <footer className="relative z-10 bg-gray-50 py-10 px-4 md:px-12">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-gray-500 text-sm">
              © 2025 Colégio ECCOS - Todos os direitos reservados
            </p>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
};

export default SuporteOperacional;