
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Clock, 
  ShoppingCart, 
  Wrench, 
  Calendar, 
  Search, 
  Eye, 
  EyeOff, 
  Filter 
} from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  getAllRequests, 
  updateRequestStatus, 
  addMessageToRequest, 
  getRequestById, 
  RequestStatus, 
  RequestType 
} from "@/services/reservationService";

const getRequestTypeIcon = (type: string) => {
  switch (type) {
    case "reservation":
      return <Calendar className="h-4 w-4" />;
    case "purchase":
      return <ShoppingCart className="h-4 w-4" />;
    case "support":
      return <Wrench className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline">Pendente</Badge>;
    case "approved":
      return <Badge variant="default" className="bg-green-500">Aprovada</Badge>;
    case "rejected":
      return <Badge variant="destructive">Reprovada</Badge>;
    case "in-progress":
      return <Badge variant="default" className="bg-blue-500">Em Andamento</Badge>;
    case "completed":
      return <Badge variant="default" className="bg-slate-500">Concluída</Badge>;
    case "canceled":
      return <Badge variant="default" className="bg-amber-500">Cancelada</Badge>;
    default:
      return <Badge variant="outline">Desconhecido</Badge>;
  }
};

const getReadableRequestType = (type: string): string => {
  switch (type) {
    case "reservation": return "Reserva";
    case "purchase": return "Compra";
    case "support": return "Suporte";
    default: return "Desconhecido";
  }
};

const Dashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const [showHidden, setShowHidden] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["reservation", "purchase", "support"]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    "pending", "approved", "in-progress"
  ]);
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<RequestStatus | "">("");
  const [newMessage, setNewMessage] = useState("");

  // Fetch all requests for admin
  const { 
    data: requests = [], 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ['adminRequests', showHidden],
    queryFn: () => getAllRequests(showHidden),
    enabled: isAdmin,
  });

  // Handle opening request details
  const handleViewDetails = async (request: any) => {
    try {
      const fullRequest = await getRequestById(request.id, request.collectionName);
      setSelectedRequest(fullRequest);
      setNewStatus(fullRequest.status);
      setIsDetailsOpen(true);
    } catch (error) {
      toast.error("Erro ao carregar detalhes da solicitação");
      console.error("Error loading request details:", error);
    }
  };

  // Handle status change
  const handleStatusChange = async () => {
    if (!selectedRequest || !newStatus) return;
    
    try {
      await updateRequestStatus(
        selectedRequest.id, 
        newStatus as RequestStatus, 
        selectedRequest.collectionName
      );
      toast.success("Status atualizado com sucesso");
      refetch();
      
      // Update the local state
      setSelectedRequest({
        ...selectedRequest,
        status: newStatus
      });
    } catch (error) {
      toast.error("Erro ao atualizar status");
      console.error("Error updating status:", error);
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!selectedRequest || !newMessage.trim()) return;
    
    try {
      await addMessageToRequest(
        selectedRequest.id, 
        newMessage, 
        isAdmin, 
        selectedRequest.collectionName
      );
      
      // Refetch the request to get updated messages
      const updatedRequest = await getRequestById(
        selectedRequest.id, 
        selectedRequest.collectionName
      );
      
      setSelectedRequest(updatedRequest);
      setNewMessage("");
      toast.success("Mensagem enviada");
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
      console.error("Error sending message:", error);
    }
  };

  // Filter requests based on search, type and status
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      searchTerm === "" || 
      req.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = selectedTypes.includes(req.type);
    const matchesStatus = selectedStatuses.includes(req.status);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // If user is not an admin, show another dashboard
  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <h1 className="text-3xl font-bold">Dashboard do Usuário</h1>
          {/* User dashboard content would go here */}
          <p>Bem-vindo ao sistema de gestão de TI.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
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

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, email ou finalidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Tipo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                <DropdownMenuCheckboxItem
                  checked={selectedTypes.includes("reservation")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTypes([...selectedTypes, "reservation"]);
                    } else {
                      setSelectedTypes(selectedTypes.filter(t => t !== "reservation"));
                    }
                  }}
                >
                  Reservas
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedTypes.includes("purchase")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTypes([...selectedTypes, "purchase"]);
                    } else {
                      setSelectedTypes(selectedTypes.filter(t => t !== "purchase"));
                    }
                  }}
                >
                  Compras
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedTypes.includes("support")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTypes([...selectedTypes, "support"]);
                    } else {
                      setSelectedTypes(selectedTypes.filter(t => t !== "support"));
                    }
                  }}
                >
                  Suporte
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                <DropdownMenuCheckboxItem
                  checked={selectedStatuses.includes("pending")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStatuses([...selectedStatuses, "pending"]);
                    } else {
                      setSelectedStatuses(selectedStatuses.filter(s => s !== "pending"));
                    }
                  }}
                >
                  Pendente
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedStatuses.includes("approved")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStatuses([...selectedStatuses, "approved"]);
                    } else {
                      setSelectedStatuses(selectedStatuses.filter(s => s !== "approved"));
                    }
                  }}
                >
                  Aprovada
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedStatuses.includes("rejected")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStatuses([...selectedStatuses, "rejected"]);
                    } else {
                      setSelectedStatuses(selectedStatuses.filter(s => s !== "rejected"));
                    }
                  }}
                >
                  Reprovada
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedStatuses.includes("in-progress")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStatuses([...selectedStatuses, "in-progress"]);
                    } else {
                      setSelectedStatuses(selectedStatuses.filter(s => s !== "in-progress"));
                    }
                  }}
                >
                  Em Andamento
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedStatuses.includes("completed")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStatuses([...selectedStatuses, "completed"]);
                    } else {
                      setSelectedStatuses(selectedStatuses.filter(s => s !== "completed"));
                    }
                  }}
                >
                  Concluída
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedStatuses.includes("canceled")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStatuses([...selectedStatuses, "canceled"]);
                    } else {
                      setSelectedStatuses(selectedStatuses.filter(s => s !== "canceled"));
                    }
                  }}
                >
                  Cancelada
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="text-center text-destructive p-4 border border-destructive rounded-md">
            Erro ao carregar solicitações. Tente novamente mais tarde.
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center text-muted-foreground p-8 border border-dashed rounded-md">
            Nenhuma solicitação encontrada.
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableCaption>Lista de solicitações dos usuários</TableCaption>
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
                      {request.createdAt ? 
                        format(
                          new Date(request.createdAt.seconds * 1000), 
                          "dd/MM/yy HH:mm", 
                          { locale: ptBR }
                        ) : 
                        "Sem data"
                      }
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
      </div>
      
      {/* Request Details Dialog */}
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
            <DialogDescription>
              {selectedRequest && (
                <div className="flex items-center justify-between">
                  <div>
                    {selectedRequest.createdAt ? 
                      format(
                        new Date(selectedRequest.createdAt.seconds * 1000),
                        "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                        { locale: ptBR }
                      ) : 
                      "Sem data"
                    }
                  </div>
                  <div>{getStatusBadge(selectedRequest?.status)}</div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6 py-4">
              {/* Request Details */}
              <div className="space-y-4 border-b pb-4">
                <h3 className="text-lg font-medium">Detalhes da Solicitação</h3>

                {selectedRequest.type === "reservation" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data</p>
                      <p>
                        {selectedRequest.date ? 
                          format(
                            new Date(selectedRequest.date.seconds * 1000),
                            "dd/MM/yyyy",
                            { locale: ptBR }
                          ) : 
                          "Não especificada"
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Horário</p>
                      <p>{selectedRequest.startTime} - {selectedRequest.endTime}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Local</p>
                      <p>{selectedRequest.location || "Não especificado"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Finalidade</p>
                      <p>{selectedRequest.purpose || "Não especificada"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Equipamentos</p>
                      <ul className="list-disc pl-5">
                        {selectedRequest.equipmentIds?.map((id: string, index: number) => (
                          <li key={index}>{id}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {selectedRequest.type === "purchase" && (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Item Solicitado</p>
                      <p>{selectedRequest.itemName || "Não especificado"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Justificativa</p>
                      <p>{selectedRequest.justification || "Não especificada"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Urgência</p>
                      <p>{selectedRequest.urgency || "Não especificada"}</p>
                    </div>
                  </div>
                )}

                {selectedRequest.type === "support" && (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Problema</p>
                      <p>{selectedRequest.issueDescription || "Não especificado"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Local</p>
                      <p>{selectedRequest.location || "Não especificado"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Urgência</p>
                      <p>{selectedRequest.urgency || "Não especificada"}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Change */}
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

              {/* Messages */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Mensagens</h3>
                <div className="space-y-4 max-h-[200px] overflow-y-auto p-2 border rounded-md">
                  {selectedRequest.messages?.length > 0 ? (
                    selectedRequest.messages.map((msg: any, index: number) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg ${msg.isAdmin ? 
                          'bg-primary text-primary-foreground ml-8' : 
                          'bg-muted mr-8'}`}
                      >
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">{msg.userName}</span>
                          <span>
                            {msg.timestamp ? 
                              format(
                                new Date(msg.timestamp.seconds * 1000),
                                "dd/MM HH:mm",
                                { locale: ptBR }
                              ) : 
                              "Agora"
                            }
                          </span>
                        </div>
                        <p>{msg.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma mensagem ainda.
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
                  <Button onClick={handleSendMessage}>Enviar</Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Dashboard;
