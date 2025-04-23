import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ShoppingCart, Wrench, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { 
  getAllRequests,
  getRequestById,
  addMessageToRequest,
  RequestStatus,
  RequestData,
  MessageData,
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
import { Textarea } from "@/components/ui/textarea";
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

const getRequestTypeIcon = (type: RequestType) => {
  switch (type) {
    case "reservation": 
      return <Calendar className="h-4 w-4" />;
    case "purchase": 
      return <ShoppingCart className="h-4 w-4" />;
    case "support": 
      return <Wrench className="h-4 w-4" />;
    default: 
      return <Calendar className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: RequestStatus) => {
  switch (status) {
    case "pending": 
      return <Badge variant="outline">Pendente</Badge>;
    case "approved": 
      return <Badge className="bg-green-500 text-white">Aprovada</Badge>;
    case "rejected": 
      return <Badge variant="destructive">Reprovada</Badge>;
    case "in-progress": 
      return <Badge className="bg-blue-500 text-white">Em Andamento</Badge>;
    case "completed": 
      return <Badge className="bg-slate-500 text-white">Concluída</Badge>;
    case "canceled": 
      return <Badge className="bg-amber-500 text-white">Cancelada</Badge>;
    default: 
      return <Badge variant="outline">Desconhecido</Badge>;
  }
};

const getReadableRequestType = (type: RequestType): string => {
  switch (type) {
    case "reservation": 
      return "Reserva";
    case "purchase": 
      return "Compra";
    case "support": 
      return "Suporte";
    default: 
      return "Desconhecido";
  }
};

const getPriorityBadge = (priority?: string) => {
  if (!priority) return <Badge variant="outline">Não especificado</Badge>;
  
  switch (priority.toLowerCase()) {
    case 'critical':
      return <Badge variant="destructive">Crítica</Badge>;
    case 'high':
      return <Badge className="bg-red-500 text-white">Alta</Badge>;
    case 'medium':
      return <Badge className="bg-amber-500 text-white">Média</Badge>;
    case 'low':
      return <Badge className="bg-green-500 text-white">Baixa</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
};

const UserSolicitacoes = () => {
  const { currentUser } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<{ id: string; collectionName: string } | null>(null);
  const [selectedType, setSelectedType] = useState<RequestType | 'todos'>('todos');
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | 'todos'>('todos');
  const [equipmentCounts, setEquipmentCounts] = useState({ ipads: 0, chromebooks: 0, others: 0 });

  const { data: requests = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["userRequests", currentUser?.email],
    queryFn: () => getAllRequests(false)
  });

  const countEquipment = async (equipmentIds: string[] = []) => {
    let ipads = 0;
    let chromebooks = 0;
    let others = 0;

    for (const id of equipmentIds) {
      try {
        const docRef = doc(db, 'equipment', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const type = docSnap.data().type.toLowerCase();
          if (type.includes('ipad')) {
            ipads++;
          } else if (type.includes('chromebook')) {
            chromebooks++;
          } else {
            others++;
          }
        }
      } catch (error) {
        console.error("Error fetching equipment:", error);
      }
    }

    return { ipads, chromebooks, others };
  };

  const handleViewDetails = async (request: RequestData) => {
    try {
      const fullRequest = await getRequestById(request.id, request.collectionName);
      setSelectedRequest(fullRequest);
      
      if (fullRequest.type === 'reservation' && fullRequest.equipmentIds) {
        const counts = await countEquipment(fullRequest.equipmentIds);
        setEquipmentCounts(counts);
      }
      
      setIsDetailsOpen(true);
    } catch (error) {
      toast.error("Erro ao carregar detalhes");
      console.error("Error:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedRequest || !newMessage.trim()) return;
    
    try {
      await addMessageToRequest(
        selectedRequest.id, 
        newMessage, 
        false,
        selectedRequest.collectionName,
        currentUser?.displayName || "Usuário"
      );
      
      const updatedRequest = await getRequestById(
        selectedRequest.id, 
        selectedRequest.collectionName
      );
      
      setSelectedRequest(updatedRequest);
      setNewMessage("");
      toast.success("Mensagem enviada");
    } catch (error) {
      toast.error("Erro ao enviar");
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

  const userRequests = requests
    .filter((req: RequestData) => req.userEmail === currentUser?.email)
    .filter((req: RequestData) => req.status !== 'canceled');

  const filteredRequests = userRequests
    .filter(req => selectedType === 'todos' || req.type === selectedType)
    .filter(req => selectedStatus === 'todos' || req.status === selectedStatus);

  const renderEquipmentCounts = () => {
    const { ipads, chromebooks, others } = equipmentCounts;
    const items = [];
    
    if (ipads > 0) {
      items.push(<li key="ipads">{ipads} iPad{ipads !== 1 ? 's' : ''}</li>);
    }
    if (chromebooks > 0) {
      items.push(<li key="chromebooks">{chromebooks} Chromebook{chromebooks !== 1 ? 's' : ''}</li>);
    }
    if (others > 0) {
      items.push(<li key="others">{others} Outro equipamento{others !== 1 ? 's' : ''}</li>);
    }
    
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
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request: RequestData) => (
                  <TableRow key={`${request.collectionName}-${request.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRequestTypeIcon(request.type)}
                        <span>{getReadableRequestType(request.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(request)}
                      >
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
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
                <DialogDescription>
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
                        <p className="text-sm font-medium text-muted-foreground">Justificativa</p>
                        <p>{selectedRequest.justification}</p>
                      </div>
                    </div>
                  )}

                  {selectedRequest.type === "support" && (
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Problema</p>
                        <p>{selectedRequest.issueDescription}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Local</p>
                        <p>{selectedRequest.location}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Prioridade</p>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(selectedRequest.priority)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Mensagens</h3>
                  <div className="space-y-4 max-h-[200px] overflow-y-auto p-2 border rounded-md">
                    {selectedRequest.messages?.length > 0 ? (
                      selectedRequest.messages.map((msg: MessageData, index: number) => (
                        <div 
                          key={index} 
                          className={`p-3 rounded-lg ${msg.isAdmin ? 'bg-primary text-primary-foreground ml-8' : 'bg-muted mr-8'}`}
                        >
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium">{msg.userName}</span>
                            <span>
                              {format(
                                new Date(msg.timestamp.toMillis()),
                                "dd/MM HH:mm",
                                { locale: ptBR }
                              )}
                            </span>
                          </div>
                          <p>{msg.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Nenhuma mensagem ainda</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Textarea 
                      placeholder="Digite uma mensagem..." 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="resize-none"
                    />
                    <Button onClick={handleSendMessage} className="flex-shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
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
          </DialogContent>
        </Dialog>

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