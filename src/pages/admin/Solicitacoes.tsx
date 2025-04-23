import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Send
} from "lucide-react";
import { toast } from "sonner";
import { 
  getAllRequests,
  getRequestById,
  addMessageToRequest,
  deleteRequest,
  RequestStatus,
  RequestData,
  MessageData
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { RequestType } from "@/services/reservationService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
    case "approved": return <Badge className="bg-green-500 text-white">Aprovada</Badge>;
    case "rejected": return <Badge variant="destructive">Reprovada</Badge>;
    case "in-progress": return <Badge className="bg-blue-500 text-white">Em Andamento</Badge>;
    case "completed": return <Badge className="bg-slate-500 text-white">Concluída</Badge>;
    case "canceled": return <Badge className="bg-amber-500 text-white">Cancelada</Badge>;
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
      high: 'bg-red-500 text-white',
      medium: 'bg-amber-500 text-white',
      low: 'bg-green-500 text-white'
    }
  };

  const normalizedLevel = level.toLowerCase();
  
  return (
    <Badge className={config.colors[normalizedLevel] || 'bg-gray-500'}>
      {config.labels[normalizedLevel] || level}
    </Badge>
  );
};

const Solicitacoes = () => {
  const { currentUser: user, isAdmin } = useAuth();
  const [showHidden, setShowHidden] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<RequestType[]>(["reservation", "purchase", "support"]);
  const [selectedStatuses, setSelectedStatuses] = useState<RequestStatus[]>([
    "pending", "approved", "in-progress"
  ]);
  const [equipmentCounts, setEquipmentCounts] = useState({ ipads: 0, chromebooks: 0, others: 0 });
  
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<RequestStatus>("pending");
  const [newMessage, setNewMessage] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<{id: string, collectionName: string} | null>(null);

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
      
      setNewStatus(fullRequest.status);
      setIsDetailsOpen(true);
    } catch (error) {
      toast.error("Erro ao carregar detalhes");
      console.error("Error:", error);
    }
  };

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

  const handleStatusChange = async () => {
    if (!selectedRequest || !newStatus) return;
    
    try {
      toast.success("Status atualizado");
      refetch();
      setSelectedRequest({ ...selectedRequest, status: newStatus });
    } catch (error) {
      toast.error("Erro ao atualizar");
      console.error("Error:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedRequest || !newMessage.trim()) return;
    
    try {
      await addMessageToRequest(
        selectedRequest.id, 
        newMessage, 
        true,
        selectedRequest.collectionName,
        user?.displayName || "Administrador"
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

  const filteredRequests = requests.filter(req => {
    const search = searchTerm.toLowerCase();
    return (
      (req.userName?.toLowerCase().includes(search) ||
      req.userEmail?.toLowerCase().includes(search) ||
      req.purpose?.toLowerCase().includes(search) ||
      req.itemName?.toLowerCase().includes(search) ||
      req.location?.toLowerCase().includes(search)) &&
      selectedTypes.includes(req.type) && 
      selectedStatuses.includes(req.status)
    );
  });

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Cabeçalho e Filtros */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Gerenciamento de Solicitações</h1>
          <Button
            variant="outline"
            onClick={() => setShowHidden(!showHidden)}
            className="flex items-center gap-2"
          >
            {showHidden ? (
              <>
                <EyeOff className="h-4 w-4" /> Ocultar Finalizadas
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" /> Mostrar Todas
              </>
            )}
          </Button>
        </div>

        {/* Barra de Pesquisa e Filtros */}
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
            {/* Filtro de Tipo */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Tipo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                {["reservation", "purchase", "support"].map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={selectedTypes.includes(type as RequestType)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTypes([...selectedTypes, type as RequestType]);
                      } else {
                        setSelectedTypes(selectedTypes.filter(t => t !== type));
                      }
                    }}
                  >
                    {getReadableRequestType(type as RequestType)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Filtro de Status */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                {["pending", "approved", "rejected", "in-progress", "completed", "canceled"].map((status) => (
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
          </div>
        </div>

        {/* Tabela de Resultados */}
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
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={`${request.collectionName}-${request.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRequestTypeIcon(request.type)}
                        <span>{getReadableRequestType(request.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{request.userName || request.userEmail}</TableCell>
                    <TableCell>
                      {format(
                        new Date(request.createdAt.toMillis()), 
                        "dd/MM/yy HH:mm", 
                        { locale: ptBR }
                      )}
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

        {/* Diálogo de Detalhes */}
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
                {/* Detalhes Específicos por Tipo */}
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
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(selectedRequest.unitPrice || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                        <div className="bg-primary/10 p-2 rounded-md">
                          <p className="text-lg font-semibold text-primary">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
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
      <p className="text-sm font-medium text-muted-foreground">Descrição</p>
      <div className="max-h-[200px] overflow-y-auto">
  <pre className="whitespace-pre-wrap font-sans text-sm p-2">
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
    <div>
      <p className="text-sm font-medium text-muted-foreground">Unidade</p>
      <p>{selectedRequest.unit}</p>
    </div>
  </div>
)}
                </div>

                {/* Alteração de Status */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="text-lg font-medium">Alterar Status</h3>
                  <div className="flex gap-4">
                    <Select value={newStatus} onValueChange={(value) => setNewStatus(value as RequestStatus)}>
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
                    <Button onClick={handleStatusChange}>Atualizar Status</Button>
                  </div>
                </div>

                {/* Mensagens */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Mensagens</h3>
                  <div className="space-y-4 max-h-[200px] overflow-y-auto p-2 border rounded-md">
                    {selectedRequest.messages?.length > 0 ? (
                      selectedRequest.messages.map((msg: MessageData, index: number) => (
                        <div 
                          key={index} 
                          className={`p-3 rounded-lg ${msg.isAdmin ? 
                            'bg-primary text-primary-foreground ml-8' : 
                            'bg-muted mr-8'}`}
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
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma mensagem ainda
                      </p>
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
                onClick={() => selectedRequest && handleDeleteRequest(selectedRequest)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </Button>
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Confirmação de Exclusão */}
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

export default Solicitacoes;