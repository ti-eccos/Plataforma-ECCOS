import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  ShoppingCart, 
  Wrench, 
  Filter, 
  Search, 
  Eye, 
  EyeOff,
  Trash2,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User as UserIcon,
  AlertCircle,
  List,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { 
  getAllRequests,
  getRequestById,
  RequestStatus,
  RequestData,
  RequestType
} from "@/services/reservationService";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNotification } from '@/services/notificationService';
import ChatAdmin from "@/components/admin/ChatAdmin";

const getRequestTypeIcon = (type: RequestType) => {
  switch (type) {
    case "reservation": return <Calendar className="h-4 w-4" />;
    case "purchase": return <ShoppingCart className="h-4 w-4" />;
    case "support": return <Wrench className="h-4 w-4" />;
    default: return <List className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: RequestStatus) => {
  switch (status) {
    case "pending": return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Clock className="h-4 w-4" />
        Pendente
      </Badge>
    );
    case "approved": return (
      <Badge className="bg-green-500 text-foreground flex items-center gap-1">
        <CheckCircle2 className="h-4 w-4" />
        Aprovada
      </Badge>
    );
    case "rejected": return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-4 w-4" />
        Reprovada
      </Badge>
    );
    case "in-progress": return (
      <Badge className="bg-blue-500 text-foreground flex items-center gap-1">
        <RefreshCw className="h-4 w-4" />
        Em Andamento
      </Badge>
    );
    case "completed": return (
      <Badge className="bg-slate-500 text-foreground flex items-center gap-1">
        <CheckCircle2 className="h-4 w-4" />
        Concluída
      </Badge>
    );
    default: return (
      <Badge variant="outline" className="flex items-center gap-1">
        <AlertTriangle className="h-4 w-4" />
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

const Solicitacoes = () => {
  const queryClient = useQueryClient();
  const { currentUser: user, isAdmin } = useAuth();
  const [showHidden, setShowHidden] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<RequestType[]>(["reservation", "purchase", "support"]);
  const [selectedStatuses, setSelectedStatuses] = useState<RequestStatus[]>(["pending", "approved", "in-progress"]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Manutenção", "Tecnologia", "Compra Pedagógica", "Compra Administrativa", "Compra Infraestrutura"]);
  const [equipmentCounts, setEquipmentCounts] = useState({ ipads: 0, chromebooks: 0, others: 0 });
  const [showEquipmentList, setShowEquipmentList] = useState(false);
  const [newStatus, setNewStatus] = useState<RequestStatus>();
  const equipmentCache = useRef(new Map<string, any>());
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [viewedRequests, setViewedRequests] = useState<Set<string>>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('adminViewedRequests') : null;
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRequest, setChatRequest] = useState<RequestData | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<RequestData | null>(null);

  useEffect(() => {
    if (selectedRequest) {
      setNewStatus(selectedRequest.status);
    }
  }, [selectedRequest]);

  const { 
    data: requests = [], 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ['allRequests', showHidden],
    queryFn: () => getAllRequests(showHidden),
    enabled: isAdmin,
  });

  useEffect(() => {
    const checkUnreadMessages = () => {
      const newUnread: Record<string, number> = {};
      
      requests.forEach(req => {
        const messages = req.messages || [];
        const unreadCount = messages.filter(msg => 
          !msg.isAdmin && 
          msg.timestamp?.toMillis && // Verificação adicional
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

  const countEquipment = async (equipmentIds: string[] = []) => {
    try {
      const docs = await Promise.all(
        equipmentIds.map(async (id) => {
          if (equipmentCache.current.has(id)) {
            return equipmentCache.current.get(id);
          }
          const docRef = doc(db, 'equipment', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            equipmentCache.current.set(id, docSnap);
          }
          return docSnap;
        })
      );

      return docs.reduce((acc, docSnap) => {
        if (docSnap.exists()) {
          const type = docSnap.data().type.toLowerCase();
          if (type.includes('ipad')) acc.ipads++;
          else if (type.includes('chromebook')) acc.chromebooks++;
          else acc.others++;
        }
        return acc;
      }, { ipads: 0, chromebooks: 0, others: 0 });
    } catch (error) {
      console.error("Error counting equipment:", error);
      return { ipads: 0, chromebooks: 0, others: 0 };
    }
  };

  const handleViewDetails = async (request: RequestData) => {
    try {
      setIsDetailsLoading(true);
      setShowEquipmentList(false);
      const fullRequest = await getRequestById(request.id, request.collectionName);
      
      let counts = { ipads: 0, chromebooks: 0, others: 0 };
      if (fullRequest.type === 'reservation' && fullRequest.equipmentIds) {
        counts = await countEquipment(fullRequest.equipmentIds);
      }
      
      setSelectedRequest(fullRequest);
      setEquipmentCounts(counts);
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
      
      setViewedRequests(prev => {
        const newSet = new Set(prev);
        (fullRequest.messages || []).forEach(msg => {
          if (!msg.isAdmin) {
            newSet.add(`${fullRequest.id}-${msg.timestamp.toMillis()}`);
          }
        });
        localStorage.setItem('adminViewedRequests', JSON.stringify(Array.from(newSet)));
        return newSet;
      });
      
      setUnreadMessages(prev => {
        const newUnread = {...prev};
        delete newUnread[fullRequest.id];
        return newUnread;
      });
      
      setIsChatOpen(true);
    } catch (error) {
      toast.error("Erro ao abrir chat");
      console.error("Error:", error);
    }
  };

  const handleCancelConfirmation = (request: RequestData) => {
    setRequestToCancel(request);
    setIsCancelDialogOpen(true);
  };

  const handleCancelRequest = async () => {
    if (!requestToCancel) return;

    try {
      const docRef = doc(db, requestToCancel.collectionName, requestToCancel.id);
      await updateDoc(docRef, { status: "canceled" });

      await createNotification({
        title: 'Solicitação Cancelada',
        message: `Sua solicitação foi cancelada.`,
        link: 'minhas-solicitacoes',
        createdAt: new Date(),
        readBy: [],
        recipients: [requestToCancel.userEmail],
        isBatch: false
      });

      refetch();
      setIsDetailsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      toast.error("Erro ao cancelar solicitação");
      console.error("Error:", error);
    } finally {
      setIsCancelDialogOpen(false);
      setRequestToCancel(null);
    }
  };

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
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="h-8 w-8 text-primary" />
            Gerenciamento de Solicitações
          </h1>
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
            className="flex items-center gap-2"
          >
            {showHidden ? (
              <>
                <EyeOff className="h-4 w-4" />
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

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, email, finalidade ou local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Categoria
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                {["reservation", "purchase", "support"].map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={selectedCategories.includes(type as RequestType)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCategories([...selectedCategories, type as RequestType]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(t => t !== type));
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    {getRequestTypeIcon(type as RequestType)}
                    {getReadableRequestType(type as RequestType)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                {["pending", "approved", "rejected", "in-progress", "completed"].map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={selectedStatuses.includes(status as RequestStatus)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStatuses([...selectedStatuses, status as RequestStatus]);
                      } else {
                        setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                      }
                    }}
                  >
                    {getStatusBadge(status as RequestStatus)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Tipo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                {["Compra Pedagógica", "Compra Administrativa", "Compra Infraestrutura","Manutenção", "Tecnologia"].map((type) => (
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
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="text-center text-destructive p-4 border border-destructive rounded-md flex flex-col items-center">
            <AlertCircle className="h-8 w-8 mb-2" />
            Erro ao carregar solicitações
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center text-muted-foreground p-8 border border-dashed rounded-md flex flex-col items-center">
            <Search className="h-8 w-8 mb-2" />
            Nenhuma solicitação encontrada
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center align-middle">
                    <div className="flex items-center justify-center gap-1">
                      <List className="h-4 w-4" />
                      Tipo
                    </div>
                  </TableHead>
                  <TableHead className="text-center align-middle">
                    <div className="flex items-center justify-center gap-1">
                      <UserIcon className="h-4 w-4" />
                      Solicitante
                    </div>
                  </TableHead>
                  <TableHead className="text-center align-middle">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4" />
                      Status
                    </div>
                  </TableHead>
                  <TableHead className="text-center align-middle">
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      Ações
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={`${request.collectionName}-${request.id}`}>
                    <TableCell className="text-center align-middle">
                      <div className="flex items-center justify-center gap-2">
                        {getRequestTypeIcon(request.type)}
                        <span className="hidden sm:inline truncate">
                          {getReadableRequestType(request.type)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center align-middle truncate max-w-[180px] flex items-center justify-center gap-1">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      {request.userName || request.userEmail}
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
                          className="h-8 w-8"
                          onClick={() => handleViewDetails(request)}
                          title="Detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 relative"
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

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
            {isDetailsLoading ? (
              <div className="space-y-4">
                <div className="animate-pulse h-8 bg-muted rounded w-1/3" />
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse h-4 bg-muted rounded w-full" />
                  ))}
                </div>
                <div className="animate-pulse h-10 bg-muted rounded w-1/2" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse h-4 bg-muted rounded w-full" />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedRequest && (
                      <>
                        {getRequestTypeIcon(selectedRequest.type)}
                        <span>
                          {getReadableRequestType(selectedRequest.type)} - {selectedRequest.userName || selectedRequest.userEmail}
                        </span>
                      </>
                    )}
                  </DialogTitle>
                  
                  <DialogDescription asChild>
                    <div className="text-sm text-muted-foreground px-1">
                      {selectedRequest && (
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            {selectedRequest.createdAt 
                              ? format(
                                  new Date(selectedRequest.createdAt.toMillis()), 
                                  "dd 'de' MMMM 'de' yyyy 'às' HH:mm", 
                                  { locale: ptBR }
                                )
                              : "Data não disponível"}
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={newStatus || selectedRequest.status}
                              onChange={(e) => setNewStatus(e.target.value as RequestStatus)}
                              className="bg-background border rounded-md px-2 py-1 text-sm"
                            >
                              {["pending", "approved", "rejected", "in-progress", "completed"].map((status) => (
                                <option key={status} value={status}>
                                  {getStatusBadge(status as RequestStatus).props.children[1]}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogDescription>
                </DialogHeader>
                
                {selectedRequest && (
                  <div className="space-y-6 py-4">
                    <div className="space-y-4 border-b pb-4">
                      <h3 className="text-lg font-medium">Detalhes da Solicitação</h3>
                      {selectedRequest.type === "reservation" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Finalidade</label>
                            <p className="text-foreground">{selectedRequest.purpose}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Local</label>
                            <p className="text-foreground">{selectedRequest.location}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Período</label>
                            <p className="text-foreground">
                            {selectedRequest.createdAt 
  ? format(new Date(selectedRequest.createdAt.toMillis()), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
  : "Data não disponível"}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Equipamentos</label>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="gap-1"
                              onClick={() => setShowEquipmentList(!showEquipmentList)}
                            >
                              {showEquipmentList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              {equipmentCounts.ipads + equipmentCounts.chromebooks + equipmentCounts.others} itens
                            </Button>
                            
                            {showEquipmentList && (
                              <div className="space-y-1">
                                {equipmentCounts.ipads > 0 && <p>• {equipmentCounts.ipads} iPads</p>}
                                {equipmentCounts.chromebooks > 0 && <p>• {equipmentCounts.chromebooks} Chromebooks</p>}
                                {equipmentCounts.others > 0 && <p>• {equipmentCounts.others} Outros</p>}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedRequest.type === "purchase" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Item</label>
                            <p className="text-foreground">{selectedRequest.itemName}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Quantidade</label>
                            <p className="text-foreground">{selectedRequest.quantity}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Justificativa</label>
                            <p className="text-foreground">{selectedRequest.justification}</p>
                          </div>
                        </div>
                      )}

                      {selectedRequest.type === "support" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Tipo de Suporte</label>
                            <p className="text-foreground">{selectedRequest.tipo}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                            <p className="text-foreground">{selectedRequest.description}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
                            <p className="text-foreground">{selectedRequest.priority}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <DialogFooter className="gap-2">
                  <Button 
                    onClick={async () => {
                      if (!selectedRequest || !newStatus) return;
                      
                      try {
                        const docRef = doc(db, selectedRequest.collectionName, selectedRequest.id);
                        await updateDoc(docRef, { status: newStatus });
                        
                        await createNotification({
                          title: 'Status Atualizado',
                          message: `O status da sua solicitação foi alterado para ${newStatus}.`,
                          link: 'minhas-solicitacoes',
                          createdAt: new Date(),
                          readBy: [],
                          recipients: [selectedRequest.userEmail],
                          isBatch: false
                        });

                        refetch();
                        queryClient.invalidateQueries({ queryKey: ['allRequests'] });
                        toast.success("Status atualizado com sucesso");
                      } catch (error) {
                        toast.error("Erro ao atualizar status");
                        console.error("Error:", error);
                      }
                    }}
                    disabled={!newStatus || newStatus === selectedRequest?.status}
                  >
                    Salvar Alterações
                  </Button>

                  <Button 
                    variant="destructive" 
                    onClick={() => selectedRequest && handleCancelConfirmation(selectedRequest)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Cancelar Solicitação
                  </Button>
                  <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                    Fechar
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Confirmar cancelamento
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja cancelar esta solicitação? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleCancelRequest}
                className="bg-destructive hover:bg-destructive/90 flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ChatAdmin 
          request={chatRequest} 
          isOpen={isChatOpen} 
          onOpenChange={setIsChatOpen}
          onMessageSent={refetch}
        />
      </div>
    </AppLayout>
  );
};

export default Solicitacoes;