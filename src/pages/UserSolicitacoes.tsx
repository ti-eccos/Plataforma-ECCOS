import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  ShoppingCart, 
  Wrench, 
  Trash2, 
  MessageSquare,
  Info
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ChatUser from "@/components/ChatUser";

const getRequestTypeIcon = (type: RequestType) => {
  switch (type) {
    case "reservation": return <Calendar className="h-4 w-4" />;
    case "purchase": return <ShoppingCart className="h-4 w-4" />;
    case "support": return <Wrench className="h-4 w-4" />;
    default: return <Calendar className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: RequestStatus) => {
  switch (status) {
    case "pending": return <Badge variant="outline">Pendente</Badge>;
    case "approved": return <Badge className="bg-green-500 text-foreground">Aprovada</Badge>;
    case "rejected": return <Badge variant="destructive">Reprovada</Badge>;
    case "in-progress": return <Badge className="bg-blue-500 text-foreground">Em Andamento</Badge>;
    case "completed": return <Badge className="bg-slate-500 text-foreground">Concluída</Badge>;
    case "canceled": return <Badge className="bg-amber-500 text-foreground">Cancelada</Badge>;
    default: return <Badge variant="outline">Desconhecido</Badge>;
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

const getPriorityLevelBadge = (level?: string) => {
  if (!level) return <Badge variant="outline">Não especificado</Badge>;
  
  const config = {
    labels: {
      critical: 'Crítica',
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa'
    },
    colors: {
      critical: 'destructive',
      high: 'bg-red-500 text-foreground',
      medium: 'bg-amber-500 text-foreground',
      low: 'bg-green-500 text-foreground'
    }
  };

  const normalizedLevel = level.toLowerCase();
  return (
    <Badge className={config.colors[normalizedLevel] || 'bg-gray-500'}>
      {config.labels[normalizedLevel] || level}
    </Badge>
  );
};

const UserSolicitacoes = () => {
  const { currentUser } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<{ id: string; collectionName: string } | null>(null);
  const [selectedType, setSelectedType] = useState<RequestType | 'todos'>('todos');
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | 'todos'>('todos');
  const [equipmentCounts, setEquipmentCounts] = useState({ ipads: 0, chromebooks: 0, others: 0 });
  const [equipmentCache, setEquipmentCache] = useState<Record<string, {type: string}>>({});
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [viewedRequests, setViewedRequests] = useState<Set<string>>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('viewedRequests') : null;
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRequest, setChatRequest] = useState<RequestData | null>(null);

  const { data: requests = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["userRequests", currentUser?.email],
    queryFn: () => getAllRequests(false),
    staleTime: 1000 * 60 * 5
  });

  const userRequests = useMemo(() => 
    requests
      .filter((req: RequestData) => req.userEmail === currentUser?.email)
      .filter((req: RequestData) => req.status !== 'canceled'),
    [requests, currentUser?.email]
  );

  const filteredRequests = useMemo(() => 
    userRequests
      .filter(req => selectedType === 'todos' || req.type === selectedType)
      .filter(req => selectedStatus === 'todos' || req.status === selectedStatus),
    [userRequests, selectedType, selectedStatus]
  );

  useEffect(() => {
    const fetchEquipmentData = async () => {
      const equipmentIds = requests
        .filter(req => req.type === 'reservation' && req.equipmentIds)
        .flatMap(req => req.equipmentIds)
        .filter((id, index, self) => self.indexOf(id) === index);

      if (equipmentIds.length > 0) {
        try {
          const equipmentDocs = await Promise.all(
            equipmentIds.map(id => getDoc(doc(db, 'equipment', id))
          ));
          
          const newCache = {...equipmentCache};
          equipmentDocs.forEach((docSnap, index) => {
            if (docSnap.exists()) {
              newCache[equipmentIds[index]] = {type: docSnap.data().type};
            }
          });
          setEquipmentCache(newCache);
        } catch (error) {
          console.error("Error pre-fetching equipment:", error);
        }
      }
    };

    fetchEquipmentData();
  }, [requests]);

  useEffect(() => {
    const checkUnreadMessages = () => {
      const newUnread: Record<string, number> = {};
      
      userRequests.forEach(req => {
        const unreadCount = req.messages?.filter(msg => 
          msg.isAdmin && !viewedRequests.has(`${req.id}-${msg.timestamp.toMillis()}`)
        ).length || 0;
        
        if (unreadCount > 0) {
          newUnread[req.id] = unreadCount;
        }
      });
      
      setUnreadMessages(newUnread);
    };

    checkUnreadMessages();
  }, [userRequests, viewedRequests]);

  const countEquipment = useCallback(async (equipmentIds: string[] = []) => {
    const counts = { ipads: 0, chromebooks: 0, others: 0 };
    const idsToFetch: string[] = [];
    
    equipmentIds.forEach(id => {
      if (equipmentCache[id]) {
        const type = equipmentCache[id].type.toLowerCase();
        if (type.includes('ipad')) counts.ipads++;
        else if (type.includes('chromebook')) counts.chromebooks++;
        else counts.others++;
      } else {
        idsToFetch.push(id);
      }
    });
    
    if (idsToFetch.length > 0) {
      try {
        const equipmentDocs = await Promise.all(
          idsToFetch.map(id => getDoc(doc(db, 'equipment', id))
        ));
        
        const newCache = {...equipmentCache};
        
        equipmentDocs.forEach((docSnap, index) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            newCache[idsToFetch[index]] = {type: data.type};
            
            const type = data.type.toLowerCase();
            if (type.includes('ipad')) counts.ipads++;
            else if (type.includes('chromebook')) counts.chromebooks++;
            else counts.others++;
          }
        });
        
        setEquipmentCache(newCache);
      } catch (error) {
        console.error("Error fetching equipment:", error);
      }
    }
    
    return counts;
  }, [equipmentCache]);

  const handleViewDetails = useCallback(async (request: RequestData) => {
    setIsDetailsLoading(true);
    try {
      const fullRequest = await getRequestById(request.id, request.collectionName);
      setSelectedRequest(fullRequest);
      
      setViewedRequests(prev => {
        const newSet = new Set(prev);
        newSet.add(request.id);
        localStorage.setItem('viewedRequests', JSON.stringify(Array.from(newSet)));
        return newSet;
      });
      
      setUnreadMessages(prev => {
        const newUnread = {...prev};
        delete newUnread[request.id];
        return newUnread;
      });

      if (fullRequest.type === 'reservation' && fullRequest.equipmentIds) {
        const counts = await countEquipment(fullRequest.equipmentIds);
        setEquipmentCounts(counts);
      }
      
      setIsDetailsOpen(true);
    } catch (error) {
      toast.error("Erro ao carregar detalhes");
      console.error("Error:", error);
    } finally {
      setIsDetailsLoading(false);
    }
  }, [countEquipment]);

  const handleOpenChat = async (request: RequestData) => {
    try {
      const fullRequest = await getRequestById(request.id, request.collectionName);
      setChatRequest(fullRequest);
      
      setViewedRequests(prev => {
        const newSet = new Set(prev);
        fullRequest.messages?.forEach(msg => {
          if (msg.isAdmin) {
            newSet.add(`${fullRequest.id}-${msg.timestamp.toMillis()}`);
          }
        });
        localStorage.setItem('viewedRequests', JSON.stringify(Array.from(newSet)));
        return newSet;
      });
      
      setUnreadMessages(prev => {
        const newUnread = {...prev};
        delete newUnread[request.id];
        return newUnread;
      });
      
      setIsChatOpen(true);
    } catch (error) {
      toast.error("Erro ao abrir chat");
      console.error("Error:", error);
    }
  };

  const handleCancelRequest = (request: RequestData) => {
    setRequestToCancel({ id: request.id, collectionName: request.collectionName });
    setIsCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!requestToCancel) return;
    try {
      // Implementar lógica de cancelamento aqui
      toast.success("Solicitação cancelada");
      setIsCancelDialogOpen(false);
      setRequestToCancel(null);
      if (isDetailsOpen) setIsDetailsOpen(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao cancelar");
      console.error("Error:", error);
    }
  };

  const renderEquipmentCounts = () => {
    const { ipads, chromebooks, others } = equipmentCounts;
    const items = [];
    
    if (ipads > 0) items.push(<li key="ipads">{ipads} iPad{ipads !== 1 ? 's' : ''}</li>);
    if (chromebooks > 0) items.push(<li key="chromebooks">{chromebooks} Chromebook{chromebooks !== 1 ? 's' : ''}</li>);
    if (others > 0) items.push(<li key="others">{others} Outro equipamento{others !== 1 ? 's' : ''}</li>);
    
    return items.length > 0 ? items : <li>Nenhum equipamento selecionado</li>;
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Minhas Solicitações</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Filtrar por tipo</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as RequestType | 'todos')}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="reservation">Reserva</option>
              <option value="purchase">Compra</option>
              <option value="support">Suporte</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Filtrar por status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as RequestStatus | 'todos')}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="todos">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovada</option>
              <option value="rejected">Reprovada</option>
              <option value="in-progress">Em Andamento</option>
              <option value="completed">Concluída</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="text-center text-destructive p-4 border border-destructive rounded-md">
            Erro ao carregar solicitações
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center text-muted-foreground p-8 border border-dashed rounded-md">
            Nenhuma solicitação encontrada
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden bg-background shadow-[rgba(0,0,0,0.10)_2px_2px_3px_0px] hover:shadow-[rgba(0,0,0,0.12)_4px_4px_5px_0px transition-all duration-300 relative border-0 border-l-4 border-blue-500 before:content-[''] before:absolute before:left-0 before:top-0 before:w-[2px] before:h-full before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent before:opacity-30">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center align-middle w-[40%] sm:w-[35%]">Tipo</TableHead>
                  <TableHead className="text-center align-middle w-[35%] sm:w-[30%]">Status</TableHead>
                  <TableHead className="text-center align-middle w-[25%] sm:w-[35%]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request: RequestData) => (
                  <TableRow key={`${request.collectionName}-${request.id}`}>
                    <TableCell className="text-center align-middle">
                      <div className="flex items-center justify-center gap-2">
                        {getRequestTypeIcon(request.type)}
                        <span className="truncate">{getReadableRequestType(request.type)}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center align-middle">
                      <div className="flex justify-center">
                        {getStatusBadge(request.status)}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center align-middle">
                      <div className="flex justify-center items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewDetails(request)}
                          title="Detalhes"
                        >
                          <Info className="h-4 w-4" />
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
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
                  {selectedRequest && (
                    <DialogDescription asChild>
                      <div className="px-1 flex items-center justify-between">
                        <div>
                          {format(
                            new Date(selectedRequest.createdAt.toMillis()),
                            "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                            { locale: ptBR }
                          )}
                        </div>
                        <div>{getStatusBadge(selectedRequest.status)}</div>
                      </div>
                    </DialogDescription>
                  )}
                </DialogHeader>

                {selectedRequest && (
                  <div className="space-y-6 py-4">
                    <div className="space-y-4 border-b pb-4">
                      <h3 className="text-lg font-medium">Detalhes da Solicitação</h3>

                      {selectedRequest.type === "reservation" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Data</p>
                            <p>
                              {format(
                                new Date(selectedRequest.date.toMillis()),
                                "dd/MM/yyyy",
                                { locale: ptBR }
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Horário</p>
                            <p>{selectedRequest.startTime} - {selectedRequest.endTime}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Local</p>
                            <p>{selectedRequest.location}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Finalidade</p>
                            <p>{selectedRequest.purpose}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm font-medium text-muted-foreground">Equipamentos</p>
                            <ul className="list-disc pl-5">
                              {renderEquipmentCounts()}
                            </ul>
                          </div>
                        </div>
                      )}

                      {selectedRequest.type === "purchase" && (
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Item Solicitado</p>
                            <p>{selectedRequest.itemName}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Quantidade</p>
                            <p>{selectedRequest.quantity}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Valor Unitário</p>
                            <p>
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                              }).format(selectedRequest.unitPrice || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                            <div className="bg-primary/10 p-2 rounded-md">
                              <p className="text-lg font-semibold text-primary">
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL"
                                }).format((selectedRequest.quantity || 0) * (selectedRequest.unitPrice || 0))}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Urgência</p>
                            <div className="flex items-center gap-2">
                              {getPriorityLevelBadge(selectedRequest.urgency)}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Justificativa</p>
                            <p>{selectedRequest.justification}</p>
                          </div>
                        </div>
                      )}

                      {selectedRequest.type === "support" && (
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Problema</p>
                            <div className="max-h-[200px] overflow-y-auto rounded-md bg-muted p-3">
                              <pre className="whitespace-pre-wrap font-sans text-sm">
                                {selectedRequest.description || "Nenhuma descrição fornecida"}
                              </pre>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Local</p>
                            <p>{selectedRequest.location}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Prioridade</p>
                            <div className="flex items-center gap-2">
                              {getPriorityLevelBadge(selectedRequest.priority)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <DialogFooter className="gap-2">
                  <Button 
                    variant="destructive" 
                    onClick={() => selectedRequest && handleCancelRequest(selectedRequest)}
                    disabled={selectedRequest?.status === 'canceled'}
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

        <ChatUser 
          request={chatRequest} 
          isOpen={isChatOpen} 
          onOpenChange={setIsChatOpen}
          onMessageSent={refetch}
        />

        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar cancelamento</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="py-4">
              Tem certeza que deseja cancelar esta solicitação?
            </div>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleCancelConfirm}
                className="bg-destructive hover:bg-destructive/90"
              >
                Confirmar Cancelamento
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default UserSolicitacoes;