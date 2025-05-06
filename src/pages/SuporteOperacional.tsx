import React, { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Wrench, 
  Filter, 
  Search, 
  Eye, 
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { 
  getAllRequests,
  getRequestById,
  deleteRequest,
  RequestStatus,
  RequestData,
  RequestType
} from "@/services/reservationService";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { 
  Table, 
  TableBody, 
  TableCaption, 
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
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNotification } from '@/services/notificationService';
import ChatAdmin from "@/components/admin/ChatAdmin";

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

const SuporteOperacional = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<RequestStatus>("pending");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<{id: string, collectionName: string} | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [viewedRequests, setViewedRequests] = useState<Set<string>>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('operacionalViewedRequests') : null;
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRequest, setChatRequest] = useState<RequestData | null>(null);

  const { 
    data: requests = [], 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ['supportRequests'],
    queryFn: () => getAllRequests(),
    select: (data) => data.filter(req => req.type === 'support'),
  });

  useEffect(() => {
    const checkUnreadMessages = () => {
      const newUnread: Record<string, number> = {};
      
      requests.forEach(req => {
        const messages = req.messages || [];
        const unreadCount = messages.filter(msg => 
          !msg.isAdmin && !viewedRequests.has(`${req.id}-${msg.timestamp.toMillis()}`)
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
      
      setViewedRequests(prev => {
        const newSet = new Set(prev);
        (fullRequest.messages || []).forEach(msg => {
          if (!msg.isAdmin) {
            newSet.add(`${fullRequest.id}-${msg.timestamp.toMillis()}`);
          }
        });
        localStorage.setItem('operacionalViewedRequests', JSON.stringify(Array.from(newSet)));
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

  const handleStatusChange = async () => {
    if (!selectedRequest || !newStatus) return;
    
    try {
      const docRef = doc(db, selectedRequest.collectionName, selectedRequest.id);
      await updateDoc(docRef, { status: newStatus });
  
      await createNotification({
        title: 'Alteração de Status',
        message: `Status do seu chamado foi alterado para: ${newStatus}`,
        link: 'minhas-solicitacoes',
        createdAt: new Date(),
        readBy: [],
        recipients: [selectedRequest.userEmail],
        isBatch: false
      });
  
      toast.success("Status atualizado");
      refetch();
      setSelectedRequest({ ...selectedRequest, status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      toast.error("Erro ao atualizar");
      console.error("Error:", error);
    }
  };

  const handleDeleteRequest = (request: RequestData) => {
    setRequestToDelete({
      id: request.id,
      collectionName: request.collectionName
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

  const filteredRequests = requests.filter(req => 
    req.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Chamados de Suporte</h1>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="text-center text-destructive p-4 border border-destructive rounded-md">
            Erro ao carregar chamados
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center text-muted-foreground p-8 border border-dashed rounded-md">
            Nenhum chamado encontrado
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden bg-background shadow-[rgba(0,0,0,0.10)_2px_2px_3px_0px] hover:shadow-[rgba(0,0,0,0.12)_4px_4px_5px_0px transition-all duration-300 relative border-0 border-l-4 border-blue-500 before:content-[''] before:absolute before:left-0 before:top-0 before:w-[2px] before:h-full before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent before:opacity-30">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center align-middle w-[30%]">Usuário</TableHead>
                  <TableHead className="text-center align-middle w-[40%]">Descrição</TableHead>
                  <TableHead className="text-center align-middle w-[20%]">Status</TableHead>
                  <TableHead className="text-center align-middle w-[10%]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={`${request.collectionName}-${request.id}`}>
                    <TableCell className="text-center align-middle truncate">
                      {request.userName || request.userEmail}
                    </TableCell>
                    <TableCell className="text-center align-middle truncate max-w-[300px]">
                      {request.description || "Sem descrição"}
                    </TableCell>
                    <TableCell className="text-center align-middle">
                      {getStatusBadge(request.status)}
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
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    {selectedRequest?.userName || selectedRequest?.userEmail}
                  </DialogTitle>
                  
                  <DialogDescription asChild>
                    <div className="text-sm text-muted-foreground px-1">
                      {selectedRequest && (
                        <div className="flex items-center justify-between">
                          <div>
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
                
                {selectedRequest && (
                  <div className="space-y-6 py-4">
                    <div className="space-y-4 border-b pb-4">
                      <h3 className="text-lg font-medium">Detalhes do Chamado</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Local</p>
                          <p>{selectedRequest.location}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Descrição Completa</p>
                          <pre className="whitespace-pre-wrap font-sans text-sm p-2">
                            {selectedRequest.description || "Nenhuma descrição fornecida"}
                          </pre>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 border-b pb-4">
                      <h3 className="text-lg font-medium">Alterar Status</h3>
                      <div className="flex gap-4">
                        <Select value={newStatus} onValueChange={(value) => setNewStatus(value as RequestStatus)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecionar status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="in-progress">Em Andamento</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                            <SelectItem value="canceled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={handleStatusChange}>Atualizar Status</Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <DialogFooter className="gap-2">
                  <Button 
                    variant="destructive" 
                    onClick={() => selectedRequest && handleDeleteRequest(selectedRequest)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Excluir
                  </Button>
                  <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                    Fechar
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <ChatAdmin 
          request={chatRequest} 
          isOpen={isChatOpen} 
          onOpenChange={setIsChatOpen}
          onMessageSent={refetch}
        />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir permanentemente este chamado?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm} 
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

export default SuporteOperacional;