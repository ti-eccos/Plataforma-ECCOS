import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  ShoppingCart,
  Wrench,
  Trash2,
  MessageSquare,
  Info,
  Filter,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Search,
  FileText,
  Truck,
  PackageCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAllRequests,
  getRequestById,
} from "@/services/sharedService";
import {
  RequestStatus,
  RequestData,
  RequestType,
} from "@/services/types";
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
  AlertDialogFooter,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ChatUser from "@/components/ChatUser";
import { Input } from "@/components/ui/input";
import { createNotification } from "@/services/notificationService";
import { cn } from "@/lib/utils";

// Ícones por tipo
const getRequestTypeIcon = (type: RequestType) => {
  switch (type) {
    case "reservation":
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case "purchase":
      return <ShoppingCart className="h-4 w-4 text-purple-500" />;
    case "support":
      return <Wrench className="h-4 w-4 text-pink-500" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
};

// Badges de status
const getStatusBadge = (status: RequestStatus) => {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-amber-50 text-amber-600 border-amber-100">
          <Clock className="h-4 w-4 mr-1 hidden sm:inline-block" />
          Pendente
        </Badge>
      );
    case "analyzing":
    return (
      <Badge className="bg-amber-50 text-amber-600 border-amber-100">
        <Clock className="h-4 w-4 mr-1 hidden sm:inline-block" />
        Em Análise
      </Badge>
    );
    case "approved":
      return (
        <Badge className="bg-green-50 text-green-600 border-green-100">
          <CheckCircle2 className="h-4 w-4 mr-1 hidden sm:inline-block" />
          Aprovado
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive">
          <XCircle className="h-4 w-4 mr-1 hidden sm:inline-block" />
          Reprovado
        </Badge>
      );
    case "waitingDelivery":
      return (
        <Badge className="bg-blue-50 text-blue-600 border-blue-100">
          <Truck className="h-4 w-4 mr-1 hidden sm:inline-block" />
          Aguardando entrega
        </Badge>
      );
    case "delivered":
      return (
        <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100">
          <PackageCheck className="h-4 w-4 mr-1 hidden sm:inline-block" />
          Recebido
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-slate-100 text-slate-600 border-slate-200">
          <CheckCircle2 className="h-4 w-4 mr-1 hidden sm:inline-block" />
          Concluído
        </Badge>
      );
    case "canceled":
      return (
        <Badge className="bg-red-50 text-red-600 border-red-100">
          <AlertTriangle className="h-4 w-4 mr-1 hidden sm:inline-block" />
          Cancelado
        </Badge>
      );
    case "in-progress":
      return (
        <Badge className="bg-orange-50 text-orange-600 border-orange-100">
          <RefreshCw className="h-4 w-4 mr-1 hidden sm:inline-block" />
          Em andamento
        </Badge>
      );
    default:
      console.warn("Status desconhecido:", status);
      return (
        <Badge variant="outline">
          <AlertTriangle className="h-4 w-4 mr-1 hidden sm:inline-block" />
          Desconhecido
        </Badge>
      );
  }
};

// Tradução do tipo
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

// Prioridade
const getPriorityLevelBadge = (level?: string) => {
  if (!level)
    return <Badge variant="outline">Não especificado</Badge>;
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

export default function UserSolicitacoes() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Estados de filtro
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<RequestType[]>([
    "reservation",
    "purchase",
    "support",
  ]);
  const [selectedStatuses, setSelectedStatuses] = useState<RequestStatus[]>([
    "pending",
    "analyzing",
    "approved",
    "in-progress",
    "waitingDelivery",
    "delivered"
  ]);

  // Estados de detalhes
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Estados de cancelamento
  const [requestToCancel, setRequestToCancel] = useState<{
    id: string;
    collectionName: string;
    userEmail: string;
  } | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // Estado de equipamentos
  const [equipmentCounts, setEquipmentCounts] = useState({
    ipads: 0,
    chromebooks: 0,
    others: 0,
  });
  const [equipmentCache, setEquipmentCache] = useState<Record<string, { type: string }>>({});

  // Estado de mensagens não lidas
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [viewedRequests, setViewedRequests] = useState<Set<string>>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("viewedRequests") : null;
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Estado do chat
  const [chatRequest, setChatRequest] = useState<RequestData | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Carregamento de dados
  const { data: requests = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["userRequests", currentUser?.email],
    queryFn: () => getAllRequests(false),
    staleTime: 1000 * 60 * 5,
  });

  // Filtra por usuário e status não cancelado
  const userRequests = useMemo(
    () =>
      requests
        .filter((req: RequestData) => req.userEmail === currentUser?.email)
        .filter((req: RequestData) => req.status !== "canceled"),
    [requests, currentUser?.email]
  );

  // Aplica todos os filtros
  const filteredRequests = useMemo(() => {
    return userRequests.filter((req) => {
      const search = searchTerm.toLowerCase();
      return (
        (req.userName?.toLowerCase().includes(search) ||
          req.userEmail?.toLowerCase().includes(search) ||
          req.purpose?.toLowerCase().includes(search) ||
          req.itemName?.toLowerCase().includes(search) ||
          req.location?.toLowerCase().includes(search)) &&
        selectedCategories.includes(req.type) &&
        selectedStatuses.includes(req.status)
      );
    });
  }, [userRequests, searchTerm, selectedCategories, selectedStatuses]);

  // Busca dados dos equipamentos
  useEffect(() => {
    const fetchEquipmentData = async () => {
      const equipmentIds = requests
        .filter((req) => req.type === "reservation" && req.equipmentIds)
        .flatMap((req) => req.equipmentIds)
        .filter((id, index, self) => self.indexOf(id) === index);
      if (equipmentIds.length > 0) {
        try {
          const equipmentDocs = await Promise.all(
            equipmentIds.map((id) => getDoc(doc(db, "equipment", id)))
          );
          const newCache = { ...equipmentCache };
          equipmentDocs.forEach((docSnap, index) => {
            if (docSnap.exists()) {
              newCache[equipmentIds[index]] = { type: docSnap.data().type };
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

  // Verifica mensagens não lidas
  useEffect(() => {
    const checkUnreadMessages = () => {
      const newUnread: Record<string, number> = {};
      userRequests.forEach((req) => {
        const unreadCount = req.messages?.filter(
          (msg) =>
            msg.isAdmin &&
            !viewedRequests.has(`${req.id}-${msg.timestamp.toMillis()}`)
        ).length;
        if (unreadCount > 0) {
          newUnread[req.id] = unreadCount;
        }
      });
      if (JSON.stringify(newUnread) !== JSON.stringify(unreadMessages)) {
        setUnreadMessages(newUnread);
      }
    };
    checkUnreadMessages();
  }, [userRequests, viewedRequests]);

  // Conta equipamentos
  const countEquipment = useCallback(
    async (equipmentIds: string[] = []) => {
      const counts = { ipads: 0, chromebooks: 0, others: 0 };
      const idsToFetch: string[] = [];
      equipmentIds.forEach((id) => {
        if (equipmentCache[id]) {
          const type = equipmentCache[id].type.toLowerCase();
          if (type.includes("ipad")) counts.ipads++;
          else if (type.includes("chromebook")) counts.chromebooks++;
          else counts.others++;
        } else {
          idsToFetch.push(id);
        }
      });
      if (idsToFetch.length > 0) {
        try {
          const equipmentDocs = await Promise.all(
            idsToFetch.map((id) => getDoc(doc(db, "equipment", id)))
          );
          const newCache = { ...equipmentCache };
          equipmentDocs.forEach((docSnap, index) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              newCache[idsToFetch[index]] = { type: data.type };
              const type = data.type.toLowerCase();
              if (type.includes("ipad")) counts.ipads++;
              else if (type.includes("chromebook")) counts.chromebooks++;
              else counts.others++;
            }
          });
          setEquipmentCache(newCache);
        } catch (error) {
          console.error("Error fetching equipment:", error);
        }
      }
      return counts;
    },
    [equipmentCache]
  );

  // Abre detalhes da solicitação
  const handleViewDetails = useCallback(
    async (request: RequestData) => {
      try {
        const fullRequest = await getRequestById(request.id, request.collectionName);
        setSelectedRequest(fullRequest);
        setViewedRequests((prev) => {
          const newSet = new Set(prev);
          newSet.add(request.id);
          localStorage.setItem("viewedRequests", JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        setUnreadMessages((prev) => {
          const newUnread = { ...prev };
          delete newUnread[request.id];
          return newUnread;
        });
        if (fullRequest.type === "reservation" && fullRequest.equipmentIds) {
          const counts = await countEquipment(fullRequest.equipmentIds);
          setEquipmentCounts(counts);
        }
        setIsDetailsOpen(true);
      } catch (error) {
        toast.error("Erro ao carregar detalhes");
        console.error("Error:", error);
      }
    },
    [countEquipment]
  );

  // Abre chat
  const handleOpenChat = async (request: RequestData) => {
    try {
      const fullRequest = await getRequestById(request.id, request.collectionName);
      setChatRequest(fullRequest);
      setViewedRequests((prev) => {
        const newSet = new Set(prev);
        fullRequest.messages?.forEach((msg) => {
          if (msg.isAdmin) {
            newSet.add(`${fullRequest.id}-${msg.timestamp.toMillis()}`);
          }
        });
        localStorage.setItem("viewedRequests", JSON.stringify(Array.from(newSet)));
        return newSet;
      });
      setUnreadMessages((prev) => {
        const newUnread = { ...prev };
        delete newUnread[request.id];
        return newUnread;
      });
      setIsChatOpen(true);
    } catch (error) {
      toast.error("Erro ao abrir chat");
      console.error("Error:", error);
    }
  };

  // Cancelar solicitação
  const handleCancelRequest = (request: RequestData) => {
    setRequestToCancel({
      id: request.id,
      collectionName: request.collectionName,
      userEmail: request.userEmail,
    });
    setIsCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!requestToCancel) return;
    try {
      const docRef = doc(db, requestToCancel.collectionName, requestToCancel.id);
      await updateDoc(docRef, { status: "canceled" });
      await createNotification({
        title: "Solicitação Cancelada",
        message: `Sua solicitação foi cancelada.`,
        link: "minhas-solicitacoes",
        createdAt: new Date(),
        readBy: [],
        recipients: [requestToCancel.userEmail],
        isBatch: false,
      });
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

  // Renderiza contagem de equipamentos
  const renderEquipmentCounts = () => {
    const { ipads, chromebooks, others } = equipmentCounts;
    const items = [];
    if (ipads > 0)
      items.push(<li key="ipads">iPad{ipads !== 1 ? "s" : ""}: {ipads}</li>);
    if (chromebooks > 0)
      items.push(
        <li key="chromebooks">Chromebook{chromebooks !== 1 ? "s" : ""}: {chromebooks}</li>
      );
    if (others > 0)
      items.push(
        <li key="others">Outro{others !== 1 ? "s" : ""}: {others}</li>
      );
    return items.length > 0 ? (
      <ul className="list-disc pl-5">{items}</ul>
    ) : (
      <p>Nenhum equipamento selecionado</p>
    );
  };

  // Marcar como entregue
  const handleMarkAsDelivered = async () => {
    if (!selectedRequest) return;
    try {
      const docRef = doc(db, selectedRequest.collectionName, selectedRequest.id);
      await updateDoc(docRef, { status: "delivered" });
      await createNotification({
        title: "Entrega Recebida",
        message: `Você marcou a solicitação como entregue.`,
        link: "minhas-solicitacoes",
        createdAt: new Date(),
        readBy: [],
        recipients: [selectedRequest.userEmail],
        isBatch: false,
      });
      toast.success("Status atualizado para Recebido");
      setIsDetailsOpen(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar status");
      console.error("Error:", error);
    }
  };

  // Marcar como concluído
  const handleMarkAsCompleted = async () => {
    if (!selectedRequest) return;
    try {
      const docRef = doc(db, selectedRequest.collectionName, selectedRequest.id);
      await updateDoc(docRef, { status: "completed" });
      await createNotification({
        title: "Solicitação Concluída",
        message: `Sua solicitação foi marcada como concluída.`,
        link: "minhas-solicitacoes",
        createdAt: new Date(),
        readBy: [],
        recipients: [selectedRequest.userEmail],
        isBatch: false,
      });
      toast.success("Solicitação marcada como concluída");
      setIsDetailsOpen(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar status");
      console.error("Error:", error);
    }
  };

  // Status por categoria - ATUALIZADO
  const statusByCategory = useMemo(() => {
    const map: Record<RequestType, RequestStatus[]> = {
      reservation: [
        "pending",
        "approved",
        "in-progress",
        "completed",
        "canceled",
        "rejected"
      ],
      purchase: [
        "pending",
        "analyzing",
        "approved",
        "rejected",
        "waitingDelivery",
        "delivered",
        "completed"
      ],
      support: ["pending", "in-progress", "completed", "canceled"]
    };
    return map;
  }, []);

  // Exibe botão de concluir
  const showCompleteButton = selectedRequest
    ? ["purchase", "support"].includes(selectedRequest.type) &&
      !["canceled", "rejected", "completed"].includes(selectedRequest.status)
    : false;

  return (
    <AppLayout>
      {/* Conteúdo principal */}
      <div className="relative z-10 space-y-8 p-6 md:p-12 fade-up">
        <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
          <FileText className="text-eccos-purple" size={35} />
          Minhas Solicitações
        </h1>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, email, finalidade ou local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-gray-200 focus-visible:ring-eccos-purple"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Botão Limpar Filtros */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategories(["reservation", "purchase", "support"]);
                setSelectedStatuses([
                  "pending",
                  "analyzing",
                  "approved",
                  "in-progress",
                  "waitingDelivery",
                  "delivered"
                ]);
              }}
              className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 text-gray-600"
            >
              <RefreshCw className="h-4 w-4" />
              Limpar Filtros
            </Button>
            {/* Dropdown de Categoria */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-gray-200 hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 text-eccos-purple" />
                  Categoria
                  <ChevronDown className="h-4 w-4" />
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
                        setSelectedCategories(
                          selectedCategories.filter((t) => t !== type)
                        );
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
            {/* Dropdown de Status - ATUALIZADO */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-gray-200 hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 text-eccos-purple" />
                  Status
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background max-h-80 overflow-y-auto">
                {Object.entries(statusByCategory).map(([type, statuses]) => {
                  if (selectedCategories.includes(type as RequestType)) {
                    return (
                      <React.Fragment key={type}>
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500">
                          {getReadableRequestType(type as RequestType)}
                        </div>
                        {statuses.map((status) => (
                          <DropdownMenuCheckboxItem
                            key={status}
                            checked={selectedStatuses.includes(status)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStatuses([...selectedStatuses, status]);
                              } else {
                                setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
                              }
                            }}
                            className="flex items-center gap-2"
                          >
                            {getStatusBadge(status)}
                          </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator />
                      </React.Fragment>
                    );
                  }
                  return null;
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabela de resultados */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eccos-purple"></div>
          </div>
        ) : isError ? (
          <div className="text-center text-destructive p-4 border border-destructive rounded-md bg-red-50">
            Erro ao carregar solicitações
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 bg-white border border-gray-100 rounded-2xl shadow-lg text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-eccos-purple/10 text-eccos-purple mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Nenhuma solicitação encontrada</h3>
            <p className="text-gray-600 mb-6">
              Parece que você ainda não fez nenhuma solicitação.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button
                onClick={() => navigate("/nova-solicitacao/reserva")}
                className="bg-eccos-purple hover:bg-sidebar text-white"
              >
                Nova Reserva
              </Button>
              <Button
                onClick={() => navigate("/nova-solicitacao/compra")}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Nova Compra
              </Button>
              <Button
                onClick={() => navigate("/nova-solicitacao/suporte")}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                Novo Suporte
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-gray-100 overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-center font-medium text-gray-600 w-[35%]">
                    Tipo
                  </TableHead>
                  <TableHead className="text-center font-medium text-gray-600 w-[35%]">
                    Status
                  </TableHead>
                  <TableHead className="text-center font-medium text-gray-600 w-[30%]">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request: RequestData) => (
                  <TableRow
                    key={`${request.collectionName}-${request.id}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="text-center align-middle">
                      <div className="flex items-center justify-center gap-2">
                        {getRequestTypeIcon(request.type)}
                        <span className="font-medium">{getReadableRequestType(request.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center align-middle">
                      <div className="flex justify-center">{getStatusBadge(request.status)}</div>
                    </TableCell>
                    <TableCell className="text-center align-middle">
                      <div className="flex justify-center items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-600 hover:bg-gray-100"
                          onClick={() => handleViewDetails(request)}
                          title="Detalhes"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-600 hover:bg-gray-100 relative"
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

        {/* Detalhes da Solicitação */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-full sm:max-w-3xl border-gray-100 p-0">
            {selectedRequest && (
              <>
                {/* Cabeçalho Fixo */}
                <DialogHeader className="p-4 border-b bg-white sticky top-0 z-10">
                  <DialogTitle className="flex items-center gap-2">
                    {getRequestTypeIcon(selectedRequest.type)}
                    <span className="bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                      {getReadableRequestType(selectedRequest.type)} -{" "}
                      {selectedRequest.userName || selectedRequest.userEmail}
                    </span>
                  </DialogTitle>
                  <DialogDescription asChild>
                    <div className="flex items-center justify-between text-gray-500 text-xs px-1 mt-1">
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
                </DialogHeader>

                {/* Conteúdo Rolável */}
                <div className="p-4 overflow-y-auto max-h-[70vh]">
                  <div className="space-y-6">
                    <div className="space-y-4 border-b pb-4">
                      <h3 className="text-lg font-medium text-gray-800">Detalhes da Solicitação</h3>
                      {selectedRequest.type === "reservation" && (
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Data</p>
                            <p className="text-sm text-gray-700">
                              {format(
                                new Date(selectedRequest.date.toMillis()),
                                "dd/MM/yyyy",
                                { locale: ptBR }
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Horário</p>
                            <p className="text-sm text-gray-700">
                              {selectedRequest.startTime} - {selectedRequest.endTime}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Local</p>
                            <p className="text-sm text-gray-700">{selectedRequest.location}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Finalidade</p>
                            <p className="text-sm text-gray-700">{selectedRequest.purpose}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Equipamentos</p>
                            {renderEquipmentCounts()}
                          </div>
                        </div>
                      )}
                      {selectedRequest.type === "purchase" && (
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Item Solicitado</p>
                            <p className="text-sm text-gray-700">{selectedRequest.itemName}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Quantidade</p>
                            <p className="text-sm text-gray-700">{selectedRequest.quantity}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Valor Unitário</p>
                            <p className="text-sm text-gray-700">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(selectedRequest.unitPrice || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Valor Total</p>
                            <div className="bg-eccos-purple/10 p-2 rounded-md">
                              <p className="text-sm font-semibold text-eccos-purple">
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(
                                  (selectedRequest.quantity || 0) *
                                    (selectedRequest.unitPrice || 0)
                                )}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Urgência</p>
                            <div className="flex items-center gap-2">
                              {getPriorityLevelBadge(selectedRequest.urgency)}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Justificativa</p>
                            <p className="text-sm text-gray-700">{selectedRequest.justification}</p>
                          </div>
                        </div>
                      )}
                      {selectedRequest.type === "support" && (
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Unidade</p>
                            <p className="text-sm text-gray-700">{selectedRequest.unit}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Localização</p>
                            <p className="text-sm text-gray-700">{selectedRequest.location}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Categoria</p>
                            <p className="text-sm text-gray-700">{selectedRequest.category}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Prioridade</p>
                            <div className="flex items-center gap-2">
                              {getPriorityLevelBadge(selectedRequest.priority)}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Descrição</p>
                            <pre className="whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-md text-sm text-gray-700">
                              {selectedRequest.description || "Nenhuma descrição"}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rodapé Fixo */}
                <DialogFooter className="p-4 border-t bg-white sticky bottom-0 z-10 flex-row gap-2 justify-end">
                  {selectedRequest.type === "purchase" &&
                    selectedRequest.status === "waitingDelivery" && (
                      <Button
                        variant="outline"
                        onClick={handleMarkAsDelivered}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <PackageCheck className="h-4 w-4 mr-2" />
                        Entrega Recebida
                      </Button>
                    )}
                  {showCompleteButton && (
                    <Button
                      variant="secondary"
                      onClick={handleMarkAsCompleted}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Concluir
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelRequest(selectedRequest)}
                    disabled={selectedRequest.status === "canceled"}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancelar Solicitação
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Chat */}
        <ChatUser
          request={chatRequest}
          isOpen={isChatOpen}
          onOpenChange={setIsChatOpen}
          onMessageSent={refetch}
        />

        {/* Confirmação de Cancelamento */}
        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <AlertDialogContent className="border-gray-100">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-800">
                Confirmar cancelamento
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="py-4 text-gray-600">
              Tem certeza que deseja cancelar esta solicitação?
            </div>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="border-gray-200 text-gray-700">Voltar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirmar Cancelamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}