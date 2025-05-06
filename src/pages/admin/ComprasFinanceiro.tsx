import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ShoppingCart, 
  Filter, 
  Search, 
  Trash2,
  MessageSquare,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { 
  getAllRequests,
  getRequestById,
  deleteRequest,
  RequestStatus,
  RequestData
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

const ComprasFinanceiro = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<RequestStatus>("pending");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<{id: string, collectionName: string} | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRequest, setChatRequest] = useState<RequestData | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [viewedRequests, setViewedRequests] = useState<Set<string>>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('financeViewedRequests') : null;
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  const purchaseTypes = ["Compra Pedagógica", "Compra Administrativa", "Compra Infraestrutura"];
  const [selectedTypes, setSelectedTypes] = useState<string[]>(purchaseTypes);

  const { data: allRequests = [], isLoading } = useQuery({
    queryKey: ['allRequests'],
    queryFn: () => getAllRequests(),
  });

  useEffect(() => {
    const checkUnreadMessages = () => {
      const newUnread: Record<string, number> = {};
      
      allRequests.forEach(req => {
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
  }, [allRequests, viewedRequests]);

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
        localStorage.setItem('financeViewedRequests', JSON.stringify(Array.from(newSet)));
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
        message: `Status da sua solicitação de compra foi alterado para: ${newStatus}`,
        link: 'minhas-solicitacoes',
        createdAt: new Date(),
        readBy: [],
        recipients: [selectedRequest.userEmail],
        isBatch: false
      });
  
      toast.success("Status atualizado");
      queryClient.invalidateQueries({ queryKey: ['allRequests'] });
      setSelectedRequest({ ...selectedRequest, status: newStatus });
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
      queryClient.invalidateQueries({ queryKey: ['allRequests'] });
    } catch (error) {
      toast.error("Erro ao excluir");
      console.error("Error:", error);
    }
  };

  const filteredRequests = allRequests
    .filter(req => req.type === 'purchase')
    .filter(req => {
      const search = searchTerm.toLowerCase();
      return (
        (req.userName?.toLowerCase().includes(search) ||
        req.userEmail?.toLowerCase().includes(search) ||
        req.itemName?.toLowerCase().includes(search)) &&
        selectedTypes.includes(req.tipo)
    )});

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Gerenciamento de Compras</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, email ou item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" /> Tipo ({selectedTypes.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background">
              {purchaseTypes.map((type) => (
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

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center text-muted-foreground p-8 border border-dashed rounded-md">
            Nenhuma solicitação de compra encontrada
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden bg-background shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.userName}</TableCell>
                    <TableCell>{request.itemName}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format((request.quantity || 0) * (request.unitPrice || 0))}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
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
                          className="relative"
                          onClick={() => handleOpenChat(request)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          {unreadMessages[request.id] > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {unreadMessages[request.id]}
                            </span>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRequest(request)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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
          <DialogContent className="max-w-2xl">
            {selectedRequest && (
              <>
                <DialogHeader>
                  <DialogTitle>Detalhes da Compra</DialogTitle>
                  <DialogDescription>
                    {format(
                      new Date(selectedRequest.createdAt.toMillis()),
                      "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo</p>
                      <p>{selectedRequest.tipo || "Não especificado"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Solicitante</p>
                      <p>{selectedRequest.userName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="flex items-center gap-2">
                        <Select 
                          value={selectedRequest.status} 
                          onValueChange={(value) => setNewStatus(value as RequestStatus)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecionar status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="approved">Aprovada</SelectItem>
                            <SelectItem value="rejected">Reprovada</SelectItem>
                            <SelectItem value="in-progress">Em Andamento</SelectItem>
                            <SelectItem value="completed">Concluída</SelectItem>
                            <SelectItem value="canceled">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={handleStatusChange}>Atualizar</Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Item</p>
                      <p>{selectedRequest.itemName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quantidade</p>
                      <p>{selectedRequest.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Unitário</p>
                      <p>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(selectedRequest.unitPrice || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="font-semibold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format((selectedRequest.quantity || 0) * (selectedRequest.unitPrice || 0))}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Justificativa</p>
                    <p className="whitespace-pre-wrap">{selectedRequest.justification}</p>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteRequest(selectedRequest)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Excluir
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
          onMessageSent={() => queryClient.invalidateQueries({ queryKey: ['allRequests'] })}
        />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir permanentemente esta solicitação?
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

export default ComprasFinanceiro;