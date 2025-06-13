import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Card, CardContent, CardHeader, CardTitle 
} from "@/components/ui/card";
import {
  Calendar, Filter, Search, Eye, Trash2, MessageSquare, ChevronDown, Clock, CheckCircle2, XCircle, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { getAllRequests, getRequestById, deleteRequest } from "@/services/sharedService";
import { RequestStatus, RequestData } from '@/services/types';
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
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNotification } from "@/services/notificationService";
import ChatAdmin from "@/components/admin/ChatAdmin";

const getStatusBadge = (status: RequestStatus) => {
  switch (status) {
    case "pending": return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pendente</Badge>;
    case "approved": return <Badge className="bg-green-500 text-white">Aprovada</Badge>;
    case "rejected": return <Badge variant="destructive">Reprovada</Badge>;
    case "in-progress": return <Badge className="bg-blue-500 text-white">Em Andamento</Badge>;
    case "completed": return <Badge className="bg-slate-500 text-white">Concluída</Badge>;
    case "canceled": return <Badge className="bg-amber-500 text-white">Cancelada</Badge>;
    default: return <Badge variant="outline">Desconhecido</Badge>;
  }
};

const Solicitacoes = () => {
  const queryClient = useQueryClient();
  const { currentUser: user } = useAuth();
  const isAdmin = (user?.role || []).includes("admin");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<RequestStatus[]>(["pending", "approved", "in-progress"]);
  const [equipmentNames, setEquipmentNames] = useState<string[]>([]);
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<RequestData | null>(null);
  const [newStatus, setNewStatus] = useState<RequestStatus>();
  
  useEffect(() => {
    if (selectedRequest) {
      setNewStatus(selectedRequest.status);
    }
  }, [selectedRequest]);

  const { data: allRequests = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['allRequests'],
    queryFn: () => getAllRequests(),
    enabled: isAdmin,
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

  const getEquipmentDetails = async (equipmentIds: string[] = []) => {
    try {
      const docs = await Promise.all(equipmentIds.map(async (id) => {
        if (equipmentCache.current.has(id)) return equipmentCache.current.get(id);
        const docRef = doc(db, 'equipment', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) equipmentCache.current.set(id, docSnap.data());
        return docSnap.data();
      }));
      return docs.filter(Boolean).map(equip => equip?.name || 'Equipamento desconhecido');
    } catch (error) {
      console.error("Error getting equipment details:", error);
      return [];
    }
  };

  const handleViewDetails = async (request: RequestData) => {
    try {
      setIsDetailsLoading(true);
      const fullRequest = await getRequestById(request.id, request.collectionName);
      let names: string[] = [];
      if (fullRequest.equipmentIds) {
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

  const handleDeleteRequest = (request: RequestData) => {
    setRequestToDelete(request);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return;
    try {
      await deleteRequest(requestToDelete.id, requestToDelete.collectionName);
      await createNotification({
        title: 'Solicitação Excluída',
        message: `Sua solicitação foi excluída pelo administrador.`,
        link: 'minhas-solicitacoes',
        recipients: [requestToDelete.userEmail],
        createdAt: new Date(),
        readBy: [],
        isBatch: false
      });
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

  const handleStatusUpdate = async (status: RequestStatus) => {
    if (!selectedRequest) return;

    try {
      const docRef = doc(db, selectedRequest.collectionName, selectedRequest.id);
      await updateDoc(docRef, {
        status: status,
        history: arrayUnion({
          status: status,
          message: `Status alterado para ${status} por ${user?.displayName || user?.email}`,
          timestamp: Timestamp.now()
        })
      });

      await createNotification({
        title: 'Alteração de Status',
        message: `Status da sua solicitação de reserva foi alterado para: ${status}`,
        link: 'minhas-solicitacoes',
        createdAt: new Date(),
        readBy: [],
        recipients: [selectedRequest.userEmail],
        isBatch: false
      });

      toast.success("Status atualizado");
      queryClient.invalidateQueries({ queryKey: ['allRequests'] });
      setSelectedRequest({ ...selectedRequest, status });
    } catch (error) {
      toast.error("Erro ao atualizar");
      console.error("Error:", error);
    }
  };

  const filteredRequests = allRequests
    .filter(req => req.type === 'reservation')
    .filter(req => {
      const search = searchTerm.toLowerCase();
      return (
        (req.userName?.toLowerCase().includes(search) ||
        req.userEmail?.toLowerCase().includes(search) ||
        req.purpose?.toLowerCase().includes(search) ||
        req.location?.toLowerCase().includes(search)) &&
        selectedStatuses.includes(req.status)
      );
    });

  // Calcular estatísticas
  const totalRequests = filteredRequests.length;
  const pendingRequests = filteredRequests.filter(req => req.status === 'pending').length;
  const approvedRequests = filteredRequests.filter(req => req.status === 'approved').length;
  const inProgressRequests = filteredRequests.filter(req => req.status === 'in-progress').length;

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

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
            <Calendar className="text-eccos-purple" size={35} />
            Solicitações de Reserva
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
                    <CardTitle className="text-sm font-medium text-gray-600">Total de Solicitações</CardTitle>
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
                    <CardTitle className="text-sm font-medium text-gray-600">Aprovadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                      {approvedRequests}
                    </div>
                    <Badge variant="outline" className="mt-2 border-green-500 text-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Aprovadas
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
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Em Progresso
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
                        placeholder="Pesquisar por nome, email, finalidade ou local..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12 rounded-xl border-gray-200 focus:border-eccos-purple"
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2 h-12 rounded-xl border-gray-200 px-6">
                          <Filter className="h-4 w-4" /> Status ({selectedStatuses.length})
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background rounded-xl">
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
                  </div>
                </CardContent>
              </Card>

              {/* Tabela */}
              {filteredRequests.length === 0 ? (
                <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg">
                  <CardContent className="p-12">
                    <div className="text-center text-muted-foreground">
                      <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">Nenhuma solicitação de reserva encontrada</p>
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
                            <TableHead className="font-semibold text-gray-700 hidden md:table-cell">Finalidade</TableHead>
                            <TableHead className="font-semibold text-gray-700">Status</TableHead>
                            <TableHead className="font-semibold text-gray-700 hidden lg:table-cell">Data</TableHead>
                            <TableHead className="font-semibold text-gray-700">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRequests.map((request) => (
                            <TableRow key={request.id} className="border-gray-100 hover:bg-gray-50/50 transition-colors">
                              <TableCell className="font-medium">{request.userName}</TableCell>
                              <TableCell className="hidden md:table-cell">{request.purpose}</TableCell>
                              <TableCell>{getStatusBadge(request.status)}</TableCell>
                              <TableCell className="font-medium hidden lg:table-cell">
                                {format(request.createdAt.toDate(), "dd/MM/yyyy", { locale: ptBR })}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl hover:bg-eccos-purple/10 hover:text-eccos-purple"
                                    onClick={() => handleViewDetails(request)}
                                    disabled={isDetailsLoading}
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
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-600"
                                    onClick={() => handleDeleteRequest(request)}
                                  >
                                    <Trash2 className="h-4 w-4" />
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
            <DialogContent className="max-w-3xl bg-white border border-gray-100 max-h-[90vh] overflow-y-auto rounded-2xl">
              {selectedRequest && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-500" />
                      <span className="bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                        Solicitação de Reserva - {selectedRequest.userName || selectedRequest.userEmail}
                      </span>
                    </DialogTitle>
                    <DialogDescription asChild>
                      <div className="flex items-center justify-between text-gray-500 px-1">
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
                  <div className="flex-1 overflow-y-auto space-y-6 py-4">
                    {/* Conteúdo específico para reservas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Solicitante</p>
                        <p className="font-medium">{selectedRequest.userName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="font-medium">{selectedRequest.userEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Local</p>
                        <p className="font-medium">{selectedRequest.location}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Data/Hora</p>
                        <p className="font-medium">
                          {selectedRequest.startDate && format(
                            selectedRequest.startDate.toDate(),
                            "dd/MM/yyyy HH:mm",
                            { locale: ptBR }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">Finalidade</p>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="whitespace-pre-wrap break-words">{selectedRequest.purpose}</p>
                      </div>
                    </div>
                    {equipmentNames.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">Equipamentos</p>
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <ul className="list-disc list-inside space-y-1">
                            {equipmentNames.map((name, index) => (
                              <li key={index} className="text-gray-700">{name}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {/* Controle de status */}
                    <div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="flex items-center gap-2">
                            Alterar Status
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {["pending", "approved", "rejected", "in-progress", "completed", "canceled"].map((status) => (
                            <DropdownMenuCheckboxItem
                              key={status}
                              checked={selectedRequest.status === status}
                              onCheckedChange={() => handleStatusUpdate(status as RequestStatus)}
                            >
                              {getStatusBadge(status as RequestStatus)}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {/* Histórico */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <h3 className="text-lg font-medium text-gray-800">Histórico</h3>
                      <div className="space-y-2">
                        {selectedRequest.history?.map((event: any, index: number) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-600">
                                {format(event.timestamp.toDate(), "dd/MM/yyyy HH:mm", { locale: ptBR })}
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
                      onClick={() => handleDeleteRequest(selectedRequest)}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Solicitação
                    </Button>
                  </DialogFooter>
                </>
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
                  Tem certeza que deseja excluir permanentemente esta solicitação? Esta ação não pode ser desfeita.
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

export default Solicitacoes;