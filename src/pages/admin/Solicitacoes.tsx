import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import {
  Calendar,
  ShoppingCart,
  Wrench,
  Filter,
  Search,
  Eye,
  Trash2,
  MessageSquare,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  List,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAllRequests,
  getRequestById,
} from "@/services/sharedService";
import {  RequestStatus, RequestData, RequestType} from '@/services/types'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { doc, getDoc, updateDoc, deleteDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNotification } from "@/services/notificationService";
import ChatAdmin from "@/components/admin/ChatAdmin";
import { cn } from "@/lib/utils";

// Funções auxiliares

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

const getRequestTypeIcon = (type: RequestType) => {
  switch (type) {
    case "reservation": return <Calendar className="h-4 w-4 text-blue-500" />;
    case "purchase": return <ShoppingCart className="h-4 w-4 text-purple-500" />;
    case "support": return <Wrench className="h-4 w-4 text-pink-500" />;
    default: return <List className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: RequestStatus) => {
  switch (status) {
    case "pending": return (
      <Badge className="bg-amber-50 text-amber-600 border-amber-100">
        {/* Adicionada classe responsiva */}
        <Clock className="h-4 w-4 mr-1 hidden sm:inline-block" />
        Pendente
      </Badge>
    );
    case "approved": return (
      <Badge className="bg-green-50 text-green-600 border-green-100">
        <CheckCircle2 className="h-4 w-4 mr-1 hidden sm:inline-block" />
        Aprovada
      </Badge>
    );
    case "rejected": return (
      <Badge variant="destructive">
        <XCircle className="h-4 w-4 mr-1 hidden sm:inline-block" />
        Reprovada
      </Badge>
    );
    case "in-progress": return (
      <Badge className="bg-blue-50 text-blue-600 border-blue-100">
        <RefreshCw className="h-4 w-4 mr-1 hidden sm:inline-block" />
        Em Andamento
      </Badge>
    );
    case "completed": return (
      <Badge className="bg-slate-100 text-slate-600 border-slate-200">
        <CheckCircle2 className="h-4 w-4 mr-1 hidden sm:inline-block" />
        Concluída
      </Badge>
    );
    default: return (
      <Badge variant="outline">
        <AlertTriangle className="h-4 w-4 mr-1 hidden sm:inline-block" />
        Desconhecido
      </Badge>
    );
  }
};

const getReadableRequestType = (type: RequestType): string => {
  switch (type) {
    case "reservation": return "Reserva";
    case "purchase": return "Compra";
    case "support": return "Suporte";
    default: return "Desconhecido";
  }
};

// Componente Principal
const Solicitacoes = () => {
  const queryClient = useQueryClient();
  const { currentUser: user} = useAuth();
  const isAdmin = (user?.role || []).includes("admin");
  const [showHidden, setShowHidden] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<RequestType[]>(["reservation", "purchase", "support"]);
  const [selectedStatuses, setSelectedStatuses] = useState<RequestStatus[]>(["pending", "approved", "in-progress"]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Manutenção", "Tecnologia", "Compra Pedagógica", "Compra Administrativa", "Compra Infraestrutura"]);
  const [equipmentNames, setEquipmentNames] = useState<string[]>([]);
  const [newStatus, setNewStatus] = useState<RequestStatus>();
  const equipmentCache = useRef(new Map<string, any>());
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [viewedRequests, setViewedRequests] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('adminViewedRequests');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRequest, setChatRequest] = useState<RequestData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<RequestData | null>(null);

  // Carregar novo status ao selecionar uma solicitação
  useEffect(() => {
    if (selectedRequest) {
      setNewStatus(selectedRequest.status);
    }
  }, [selectedRequest]);

  // Buscar todas as solicitações
  const { data: requests = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['allRequests', showHidden],
    queryFn: () => getAllRequests(showHidden),
    enabled: isAdmin,
  });

  // Atualiza mensagens não lidas
  useEffect(() => {
    const checkUnreadMessages = () => {
      const newUnread: Record<string, number> = {};
      requests.forEach(req => {
        const messages = req.messages || [];
        const unreadCount = messages.filter(msg =>
          !msg.isAdmin &&
          !viewedRequests.has(`${req.id}-${msg.timestamp.toMillis()}`))
          .length;
        if (unreadCount > 0) newUnread[req.id] = unreadCount;
      });
      setUnreadMessages(newUnread);
    };
    checkUnreadMessages();
  }, [requests, viewedRequests]);

  // Busca detalhes dos equipamentos
  const getEquipmentDetails = async (equipmentIds: string[] = []) => {
    try {
      const docs = await Promise.all(
        equipmentIds.map(async (id) => {
          if (equipmentCache.current.has(id)) return equipmentCache.current.get(id);
          const docRef = doc(db, 'equipment', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) equipmentCache.current.set(id, docSnap.data());
          return docSnap.data();
        })
      );
      return docs.filter(Boolean).map(equip => equip?.name || 'Equipamento desconhecido');
    } catch (error) {
      console.error("Error getting equipment details:", error);
      return [];
    }
  };

  // Manipuladores

  const handleViewDetails = async (request: RequestData) => {
    try {
      setIsDetailsLoading(true);
      const fullRequest = await getRequestById(request.id, request.collectionName);
      let names: string[] = [];
      if (fullRequest.type === 'reservation' && fullRequest.equipmentIds) {
        names = await getEquipmentDetails(fullRequest.equipmentIds);
      }
      setSelectedRequest(fullRequest);
      setEquipmentNames(names);
      setIsDetailsOpen(true);
    } catch (error) {
      toast.error("Erro ao carregar detalhes");
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleOpenChat = async (request: RequestData) => {
    try {
      const fullRequest = await getRequestById(request.id, request.collectionName);
      setChatRequest(fullRequest);
      const newSet = new Set(viewedRequests);
      (fullRequest.messages || []).forEach(msg => {
        if (!msg.isAdmin) newSet.add(`${fullRequest.id}-${msg.timestamp.toMillis()}`);
      });
      localStorage.setItem('adminViewedRequests', JSON.stringify(Array.from(newSet)));
      setViewedRequests(newSet);
      setUnreadMessages(prev => ({ ...prev, [fullRequest.id]: 0 }));
      setIsChatOpen(true);
    } catch (error) {
      toast.error("Erro ao abrir chat");
    }
  };

  const handleDeleteConfirmation = (request: RequestData) => {
    setRequestToDelete(request);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    try {
      await deleteDoc(doc(db, requestToDelete.collectionName, requestToDelete.id));
      await createNotification({
        title: 'Solicitação Excluída',
        message: `Sua solicitação foi excluída pelo administrador.`,
        link: 'minhas-solicitacoes',
        recipients: [requestToDelete.userEmail],
        createdAt: undefined,
        readBy: [],
        isBatch: false
      });
      refetch();
      setIsDetailsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      toast.error("Erro ao excluir solicitação");
    } finally {
      setIsDeleteDialogOpen(false);
      setRequestToDelete(null);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest || !newStatus) return;
    try {
      await updateDoc(doc(db, selectedRequest.collectionName, selectedRequest.id), {
        status: newStatus,
        history: arrayUnion({
          status: newStatus,
          message: `Status alterado por ${user?.displayName || user?.email}`,
          timestamp: Timestamp.now()
        })
      });
      await createNotification({
        title: 'Status Atualizado',
        message: `Sua solicitação teve o status alterado para ${newStatus}.`,
        link: 'minhas-solicitacoes',
        recipients: [selectedRequest.userEmail],
        createdAt: undefined,
        readBy: [],
        isBatch: false
      });
      refetch();
      toast.success("Status atualizado com sucesso");
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  // Cálculo das estatísticas
  const pendingRequests = requests.filter((req) => req.status === "pending").length;
  const approvedRequests = requests.filter((req) => req.status === "approved").length;
  const inProgressRequests = requests.filter((req) => req.status === "in-progress").length;

  // Filtro de solicitações
  const filteredRequests = requests.filter(req => {
    const search = searchTerm.toLowerCase();
    return (
      (req.userName?.toLowerCase().includes(search) ||
       req.userEmail?.toLowerCase().includes(search) ||
       req.purpose?.toLowerCase().includes(search) ||
       req.itemName?.toLowerCase().includes(search) ||
       req.location?.toLowerCase().includes(search)) &&
      selectedCategories.includes(req.type) &&
      selectedStatuses.includes(req.status) &&
      (isAdmin || req.status !== "canceled") &&
      (
        (req.type === "support" && selectedTypes.includes(req.tipo)) ||
        (req.type === "purchase" && selectedTypes.includes(req.tipo)) ||
        (req.type === "reservation")
      )
    );
  });

  return (
    <AppLayout>
      <div className="min-h-screen bg-white overflow-hidden relative">
                    <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
              <Wrench className="text-eccos-purple" size={35} />
              Gerenciamento de Solicitações
            </h1>
        {/* Fundos decorativos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-sidebar blur-3xl opacity-5"></div>
          <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-eccos-purple blur-3xl opacity-5"></div>
        </div>

        {/* Conteúdo principal */}
        <div className="relative z-10 space-y-8 p-6 md:p-12">
          {/* Cards de Estatísticas */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {/* Card Pendentes */}
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sidebar">{pendingRequests}</div>
                <Badge variant="outline" className="mt-2 border-sidebar text-sidebar">Pendências</Badge>
              </CardContent>
            </Card>

            {/* Card Aprovadas */}
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Aprovadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sidebar">{approvedRequests}</div>
                <Badge variant="outline" className="mt-2 border-sidebar text-sidebar">Concluídas</Badge>
              </CardContent>
            </Card>

            {/* Card Em Progresso */}
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Em Progresso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sidebar">{inProgressRequests}</div>
                <Badge variant="outline" className="mt-2 border-sidebar text-sidebar">Processando</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e busca */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar por nome, email, finalidade ou local..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-lg border-gray-200 focus:border-eccos-purple"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 text-gray-700">
                    <Filter className="h-4 w-4 text-eccos-purple" />
                    Categoria
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border border-gray-100">
                  {["reservation", "purchase", "support"].map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={selectedCategories.includes(type as RequestType)}
                      onCheckedChange={(checked) => {
                        setSelectedCategories(checked ?
                          [...selectedCategories, type as RequestType] :
                          selectedCategories.filter(t => t !== type))
                      }}
                      className="flex items-center gap-2 hover:bg-gray-50"
                    >
                      {getRequestTypeIcon(type as RequestType)}
                      {getReadableRequestType(type as RequestType)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 text-gray-700">
                    <Filter className="h-4 w-4 text-eccos-purple" />
                    Status
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border border-gray-100">
                  {["pending", "approved", "rejected", "in-progress", "completed"].map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={selectedStatuses.includes(status as RequestStatus)}
                      onCheckedChange={(checked) => {
                        setSelectedStatuses(checked ?
                          [...selectedStatuses, status as RequestStatus] :
                          selectedStatuses.filter(s => s !== status))
                      }}
                      className="hover:bg-gray-50"
                    >
                      {getStatusBadge(status as RequestStatus)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 text-gray-700">
                    <Filter className="h-4 w-4 text-eccos-purple" />
                    Tipo
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border border-gray-100">
                  {["Compra Pedagógica", "Compra Administrativa", "Compra Infraestrutura", "Manutenção", "Tecnologia"].map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={(checked) => {
                        setSelectedTypes(checked ?
                          [...selectedTypes, type] :
                          selectedTypes.filter(t => t !== type))
                      }}
                      className="hover:bg-gray-50"
                    >
                      {type}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
              variant="outline"
              onClick={() => {
                setShowHidden(!showHidden);
                setSelectedCategories(["reservation", "purchase", "support"]);
                setSelectedStatuses(isAdmin
                  ? ["pending", "approved", "rejected", "in-progress", "completed", "canceled"]
                  : ["pending", "approved", "in-progress", "completed"]
                );
                setSelectedTypes(["Manutenção", "Tecnologia", "Compra Pedagógica", "Compra Administrativa", "Compra Infraestrutura"]);
              }}
              className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              {showHidden ? (
                <>
                  <Eye className="h-4 w-4" />
                  Ocultar Finalizadas
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Mostrar Todas
                </>
              )}
            </Button>
            </div>
          </div>

          {/* Tabela de solicitações */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eccos-purple"></div>
            </div>
          ) : isError ? (
            <div className="text-center text-red-500 p-4 border border-red-200 rounded-xl bg-red-50">
              Erro ao carregar solicitações
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center text-gray-500 p-8 border border-dashed rounded-xl bg-gray-50">
              Nenhuma solicitação encontrada
            </div>
          ) : (
            <div className="rounded-lg border border-gray-100 overflow-hidden bg-white shadow-sm">
              <Table>
                <TableHeader className="bg-gray-50">
                <TableRow>
                    <TableHead className="text-center font-medium text-gray-600 w-[20%]">Tipo</TableHead>
                    <TableHead className="text-center font-medium text-gray-600 w-[25%]">Usuário</TableHead>
                    <TableHead className="text-center font-medium text-gray-600 w-[25%]">Status</TableHead>
                    <TableHead className="text-center font-medium text-gray-600 w-[30%]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
  {filteredRequests.map((request) => (
    <TableRow key={`${request.collectionName}-${request.id}`} className="hover:bg-gray-50">
      {/* Célula TIPO (modificada) */}
      <TableCell className="text-center align-middle p-2 md:p-4">
        <div className="flex items-center justify-center">
          {getRequestTypeIcon(request.type)}
          {/* Texto visível apenas em md+ */}
          <span className="font-medium hidden md:inline ml-2">
            {getReadableRequestType(request.type)}
          </span>
        </div>
      </TableCell>
                      <TableCell className="text-center align-middle">
                        {request.userName}
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        <div className="flex justify-center">
                          {getStatusBadge(request.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        <div className="flex justify-center items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:bg-gray-100"
                            onClick={() => handleViewDetails(request)}
                            title="Detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 relative text-gray-600 hover:bg-gray-100"
                            onClick={() => handleOpenChat(request)}
                            title="Chat"
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
          )}

          {/* Diálogo de detalhes */}
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
  <DialogContent className="max-w-3xl bg-white border border-gray-100 max-h-[90vh] overflow-y-auto">
    {isDetailsLoading ? (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eccos-purple"></div>
      </div>
    ) : selectedRequest ? (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getRequestTypeIcon(selectedRequest.type)}
            <span className="bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
              {getReadableRequestType(selectedRequest.type)} - {selectedRequest.userName || selectedRequest.userEmail}
            </span>
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center justify-between text-gray-500 px-1">
              <div>
                {format(selectedRequest.createdAt.toDate(), "dd/MM/yyyy HH:mm")}
              </div>
              <div>{getStatusBadge(selectedRequest.status)}</div>
            </div>
          </DialogDescription>
        </DialogHeader>
                  <div className="flex-1 overflow-y-auto space-y-6 py-4">
                    {/* Conteúdo detalhado */}
                    {selectedRequest.type === "reservation" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Data</p>
                          <p className="text-gray-700">
                            {format(selectedRequest.date.toDate(), "dd/MM/yyyy")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Horário</p>
                          <p className="text-gray-700">
                            {selectedRequest.startTime} - {selectedRequest.endTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Finalidade</p>
                          <p className="text-gray-700">{selectedRequest.purpose}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Local</p>
                          <p className="text-gray-700">{selectedRequest.location}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-gray-500">Equipamentos</p>
                          <ul className="list-disc pl-5 text-gray-700">
                            {equipmentNames.map((name, index) => (
                              <li key={index}>{name}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {selectedRequest.type === "purchase" && (
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Item</p>
                          <p className="text-gray-700">{selectedRequest.itemName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Quantidade</p>
                          <p className="text-gray-700">{selectedRequest.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Valor Unitário</p>
                          <p className="text-gray-700">
                            {selectedRequest.unitPrice?.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Valor Total</p>
                          <div className="bg-eccos-purple/10 p-2 rounded-md">
                            <p className="text-lg font-semibold text-eccos-purple">
                              {(selectedRequest.quantity * selectedRequest.unitPrice)?.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedRequest.type === "support" && (
  <div className="grid grid-cols-1 gap-4">
    <div>
      <p className="text-sm font-medium text-gray-500">Tipo</p>
      <p className="text-gray-700">{selectedRequest.tipo}</p>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">Unidade</p>
      <p className="text-gray-700">{selectedRequest.unit}</p>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">Localização</p>
      <p className="text-gray-700">{selectedRequest.location}</p>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">Categoria</p>
      <p className="text-gray-700">{selectedRequest.category}</p>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">Prioridade</p>
      <p className="text-gray-700">
        {getPriorityLevelBadge(selectedRequest.priority)}
      </p>
    </div>
    {selectedRequest.deviceInfo && (
      <div>
        <p className="text-sm font-medium text-gray-500">Identificação do Equipamento</p>
        <p className="text-gray-700">{selectedRequest.deviceInfo}</p>
      </div>
    )}
    <div className="col-span-full">
      <p className="text-sm font-medium text-gray-500">Descrição</p>
      <pre className="whitespace-pre-wrap font-sans text-gray-700">
        {selectedRequest.description}
      </pre>
    </div>
  </div>
)}
<div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  Alterar Status
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {["pending", "approved", "rejected", "in-progress", "completed"].map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={newStatus === status}
                    onCheckedChange={() => setNewStatus(status as RequestStatus)}
                  >
                    {getStatusBadge(status as RequestStatus)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={handleStatusUpdate}
              disabled={!newStatus || newStatus === selectedRequest.status}
            >
              Salvar
            </Button>
          </div>
                    {/* Histórico */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-lg font-medium text-gray-800">Histórico</h3>
            <div className="space-y-2">
              {selectedRequest.history?.map((event: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">
                      {format(event.timestamp.toDate(), "dd/MM/yyyy HH:mm")}
                    </p>
                    <p className="text-sm text-gray-500">{event.message}</p>
                  </div>
                  {getStatusBadge(event.status)}
                </div>
              )) || (
                <p className="text-gray-500 text-sm">Nenhum histórico registrado</p>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="pt-4 border-t border-gray-100 gap-2">
          <Button
            variant="destructive"
            onClick={() => handleDeleteConfirmation(selectedRequest)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Solicitação
          </Button>
        </DialogFooter>
      </>
    ) : (
      <div className="text-center p-4 text-red-500">
        Nenhuma solicitação selecionada
      </div>
    )}
  </DialogContent>
</Dialog>

          {/* Diálogo de confirmação de exclusão */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="bg-white border border-gray-100">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-800">
                  Confirmar exclusão
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600">
                  Tem certeza que deseja excluir permanentemente esta solicitação?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-gray-200 text-gray-700">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteRequest}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirmar Exclusão
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Componente de chat */}
          <ChatAdmin
            request={chatRequest}
            isOpen={isChatOpen}
            onOpenChange={setIsChatOpen}
            onMessageSent={refetch}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default Solicitacoes;