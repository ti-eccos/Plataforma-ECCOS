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
} from "lucide-react";
import { toast } from "sonner";
import {
  getAllRequests,
  getRequestById,
  deleteRequest,
  RequestStatus,
  RequestData,
} from "@/services/reservationService";
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
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const getStatusBadge = (status: RequestStatus) => {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="border-amber-500 text-amber-600">
          Pendente
        </Badge>
      );
    case "in-progress":
      return (
        <Badge className="bg-blue-50 text-blue-600 border-blue-100">
          Em Andamento
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-green-50 text-green-600 border-green-100">
          Concluído
        </Badge>
      );
    case "canceled":
      return (
        <Badge className="bg-red-50 text-red-600 border-red-100">
          Cancelado
        </Badge>
      );
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
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<RequestStatus>("pending");
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

  const {
    data: requests = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["supportRequests"],
    queryFn: () => getAllRequests(),
    select: (data) => data.filter((req) => req.type === "support"),
  });

  const filteredRequests = requests.filter(
    (req) =>
      (req.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      selectedTypes.includes(req.tipo)
  );

  useEffect(() => {
    const checkUnreadMessages = () => {
      const newUnread: Record<string, number> = {};
      requests.forEach((req) => {
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
  }, [requests, viewedRequests]);

  const handleViewDetails = async (request: RequestData) => {
    try {
      setIsDetailsLoading(true);
      const fullRequest = await getRequestById(request.id, request.collectionName);
      setSelectedRequest(fullRequest);
      setNewStatus(fullRequest.status);
      setIsDetailsOpen(true);
    } catch (error) {
      toast.error("Erro ao carregar detalhes");
      console.error("Error:", error);
    } finally {
      setIsDetailsLoading(false);
    }
  };

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

  const handleStatusChange = async () => {
    if (!selectedRequest || !newStatus) return;
    try {
      const docRef = doc(db, selectedRequest.collectionName, selectedRequest.id);
      await updateDoc(docRef, { status: newStatus });
      await createNotification({
        title: "Alteração de Status",
        message: `Status do seu chamado foi alterado para: ${newStatus}`,
        link: "minhas-solicitacoes",
        createdAt: new Date(),
        readBy: [],
        recipients: [selectedRequest.userEmail],
        isBatch: false,
      });
      toast.success("Status atualizado");
      refetch();
      setSelectedRequest({ ...selectedRequest, status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
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
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir");
      console.error("Error:", error);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-white relative overflow-hidden">
        {/* Background Decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-sidebar blur-3xl opacity-5"></div>
          <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-eccos-purple blur-3xl opacity-5"></div>
        </div>

        <div className="relative z-10 space-y-8 p-6 md:p-12">
          <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
            <Wrench className="text-eccos-purple" size={35} />
            Chamados de Suporte
          </h1>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 rounded-xl border-gray-200 focus:ring-eccos-purple"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 h-12 rounded-xl border-gray-200"
                >
                  <Filter className="h-4 w-4" /> Tipo ({selectedTypes.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white rounded-xl shadow-lg">
                {supportTypes.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTypes([...selectedTypes, type]);
                      } else {
                        setSelectedTypes(selectedTypes.filter((t) => t !== type));
                      }
                    }}
                    className="focus:bg-gray-50"
                  >
                    {type}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eccos-purple"></div>
            </div>
          ) : isError ? (
            <div className="text-center text-destructive p-4 border border-destructive rounded-2xl bg-red-50">
              Erro ao carregar chamados
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center text-gray-500 p-8 border-2 border-dashed rounded-2xl bg-gray-50">
              Nenhum chamado encontrado
            </div>
          ) : (
            <Card className="border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-center font-semibold text-gray-600 w-[35%]">
                      Tipo
                    </TableHead>
                    <TableHead className="text-center font-semibold text-gray-600 w-[35%]">
                      Status
                    </TableHead>
                    <TableHead className="text-center font-semibold text-gray-600 w-[30%]">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow
                      key={`${request.collectionName}-${request.id}`}
                      className="hover:bg-gray-50"
                    >
                      <TableCell className="text-center truncate font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <Wrench className="h-4 w-4 text-pink-500" />
                          {request.tipo || "Suporte"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(request)}
                            className="h-8 w-8"
                            title="Detalhes"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenChat(request)}
                            className="h-8 w-8 relative"
                            title="Chat"
                          >
                            <MessageSquare className="h-4 w-4 text-gray-600" />
                            {unreadMessages[request.id] > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
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
            </Card>
          )}

          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
  <DialogContent className="max-w-full sm:max-w-3xl w-[95%] rounded-2xl border-gray-100 shadow-xl p-0 overflow-y-auto max-h-screen">
    {isDetailsLoading ? (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eccos-purple"></div>
      </div>
    ) : selectedRequest ? (
      <>
        {/* Cabeçalho rola com o conteúdo */}
        <DialogHeader className="p-4 border-b bg-gray-50">
          <DialogTitle className="flex items-center gap-2 text-gray-900 text-lg">
            <Wrench className="h-5 w-5 text-eccos-purple" />
            {selectedRequest.userName || selectedRequest.userEmail}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-gray-600 px-1 mt-1">
              {selectedRequest && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-sm">
                    {format(
                      new Date(selectedRequest.createdAt.toMillis()),
                      "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )}
                  </div>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Corpo com scroll */}
        <div className="p-4 space-y-0">
          <div className="space-y-4 border-b pb-4">
            <h3 className="text-base font-medium text-gray-900">Detalhes do Chamado</h3>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <p className="font-medium text-gray-500">Tipo</p>
                <p className="text-gray-700">{selectedRequest.tipo}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Unidade</p>
                <p className="text-gray-700">{selectedRequest.unit}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Localização</p>
                <p className="text-gray-700">{selectedRequest.location}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Categoria</p>
                <p className="text-gray-700">{selectedRequest.category}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Prioridade</p>
                <p className="text-gray-700">
                  {getPriorityLevelBadge(selectedRequest.priority)}
                </p>
              </div>
              {selectedRequest.deviceInfo && (
                <div>
                  <p className="font-medium text-gray-500">Identificação do Equipamento</p>
                  <p className="text-gray-700">{selectedRequest.deviceInfo}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-500">Descrição Completa</p>
                <pre className="whitespace-pre-wrap font-sans p-2 bg-gray-50 rounded-md text-xs sm:text-sm">
                  {selectedRequest.description || "Nenhuma descrição fornecida"}
                </pre>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-b pb-4">
            <h3 className="text-base font-medium text-gray-900">Alterar Status</h3>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as RequestStatus)}>
                <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-lg">
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="pending" className="rounded-lg">Pendente</SelectItem>
                  <SelectItem value="in-progress" className="rounded-lg">Em Andamento</SelectItem>
                  <SelectItem value="completed" className="rounded-lg">Concluído</SelectItem>
                  <SelectItem value="canceled" className="rounded-lg">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleStatusChange}
                className="w-full sm:w-auto h-10 rounded-lg bg-gradient-to-r from-sidebar to-eccos-purple text-white hover:from-eccos-purple hover:to-sidebar"
              >
                Atualizar Status
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => selectedRequest && handleDeleteRequest(selectedRequest)}
                className="w-full sm:w-auto h-10 rounded-lg text-sm"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </Button>
            </div>
          </div>
        </div>
      </>
    ) : (
      <div className="p-4 text-destructive text-center">
        Nenhuma solicitação selecionada
      </div>
    )}
  </DialogContent>
</Dialog>

          <ChatAdmin
            request={chatRequest}
            isOpen={isChatOpen}
            onOpenChange={setIsChatOpen}
            onMessageSent={refetch}
          />

          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogContent className="rounded-2xl border-gray-100">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-900">
                  Confirmar exclusão
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600">
                  Tem certeza que deseja excluir permanentemente este chamado?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl h-12 border-gray-200">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  className="rounded-xl h-12 bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirmar Exclusão
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

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