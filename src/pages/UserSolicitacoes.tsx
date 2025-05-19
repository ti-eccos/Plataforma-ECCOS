import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // Import adicionado
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
} from "lucide-react";
import { toast } from "sonner";
import {
  getAllRequests,
  getRequestById,
  RequestStatus,
  RequestData,
  RequestType,
} from "@/services/reservationService";
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
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ChatUser from "@/components/ChatUser";
import { Input } from "@/components/ui/input";
import { createNotification } from "@/services/notificationService";

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
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Pendente
        </Badge>
      );
    case "approved":
      return (
        <Badge className="bg-green-500 text-foreground flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4" />
          Aprovada
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-4 w-4" />
          Reprovada
        </Badge>
      );
    case "in-progress":
      return (
        <Badge className="bg-blue-500 text-foreground flex items-center gap-1">
          <RefreshCw className="h-4 w-4" />
          Em Andamento
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-slate-500 text-foreground flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4" />
          Concluída
        </Badge>
      );
    case "canceled":
      return (
        <Badge className="bg-amber-500 text-foreground flex items-center gap-1">
          <AlertTriangle className="h-4 w-4" />
          Cancelada
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertTriangle className="h-4 w-4" />
          Desconhecido
        </Badge>
      );
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
      critical: "destructive",
      high: "bg-red-500 text-foreground",
      medium: "bg-amber-500 text-foreground",
      low: "bg-green-500 text-foreground",
    },
  };
  const normalizedLevel = level.toLowerCase();
  return (
    <Badge className={config.colors[normalizedLevel] || "bg-gray-500"}>
      {config.labels[normalizedLevel] || level}
    </Badge>
  );
};

const UserSolicitacoes = () => {
  const navigate = useNavigate(); // Hook adicionado para navegação
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<RequestType[]>([
    "reservation",
    "purchase",
    "support",
  ]);
  const [selectedStatuses, setSelectedStatuses] = useState<RequestStatus[]>([
    "pending",
    "approved",
    "in-progress",
  ]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "Manutenção",
    "Tecnologia",
    "Compra Pedagógica",
    "Compra Administrativa",
    "Compra Infraestrutura",
  ]);
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<{
    id: string;
    collectionName: string;
    userEmail: string;
  } | null>(null);
  const [equipmentCounts, setEquipmentCounts] = useState({
    ipads: 0,
    chromebooks: 0,
    others: 0,
  });
  const [equipmentCache, setEquipmentCache] = useState<
    Record<string, { type: string }>
  >({});
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>(
    {}
  );
  const [viewedRequests, setViewedRequests] = useState<Set<string>>(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("viewedRequests")
        : null;
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRequest, setChatRequest] = useState<RequestData | null>(null);

  const { data: requests = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["userRequests", currentUser?.email],
    queryFn: () => getAllRequests(false),
    staleTime: 1000 * 60 * 5,
  });

  const userRequests = useMemo(
    () =>
      requests
        .filter((req: RequestData) => req.userEmail === currentUser?.email)
        .filter((req: RequestData) => req.status !== "canceled"),
    [requests, currentUser?.email]
  );

  const filteredRequests = useMemo(
    () =>
      userRequests.filter((req) => {
        const search = searchTerm.toLowerCase();
        return (
          (req.userName?.toLowerCase().includes(search) ||
            req.userEmail?.toLowerCase().includes(search) ||
            req.purpose?.toLowerCase().includes(search) ||
            req.itemName?.toLowerCase().includes(search) ||
            req.location?.toLowerCase().includes(search)) &&
          selectedCategories.includes(req.type) &&
          selectedStatuses.includes(req.status) &&
          ((req.type === "support" && selectedTypes.includes(req.tipo)) ||
            (req.type === "purchase" && selectedTypes.includes(req.tipo)) ||
            req.type === "reservation")
        );
      }),
    [
      userRequests,
      searchTerm,
      selectedCategories,
      selectedStatuses,
      selectedTypes,
    ]
  );

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
      setUnreadMessages(newUnread);
    };
    checkUnreadMessages();
  }, [userRequests, viewedRequests]);

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

  const handleViewDetails = useCallback(
    async (request: RequestData) => {
      setIsDetailsLoading(true);
      try {
        const fullRequest = await getRequestById(
          request.id,
          request.collectionName
        );
        setSelectedRequest(fullRequest);
        setViewedRequests((prev) => {
          const newSet = new Set(prev);
          newSet.add(request.id);
          localStorage.setItem(
            "viewedRequests",
            JSON.stringify(Array.from(newSet))
          );
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
      } finally {
        setIsDetailsLoading(false);
      }
    },
    [countEquipment]
  );

  const handleOpenChat = async (request: RequestData) => {
    try {
      const fullRequest = await getRequestById(
        request.id,
        request.collectionName
      );
      setChatRequest(fullRequest);
      setViewedRequests((prev) => {
        const newSet = new Set(prev);
        fullRequest.messages?.forEach((msg) => {
          if (msg.isAdmin) {
            newSet.add(`${fullRequest.id}-${msg.timestamp.toMillis()}`);
          }
        });
        localStorage.setItem(
          "viewedRequests",
          JSON.stringify(Array.from(newSet))
        );
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
      const docRef = doc(
        db,
        requestToCancel.collectionName,
        requestToCancel.id
      );
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

  const renderEquipmentCounts = () => {
    const { ipads, chromebooks, others } = equipmentCounts;
    const items = [];
    if (ipads > 0)
      items.push(
        <li key="ipads">
          {ipads} iPad{ipads !== 1 ? "s" : ""}
        </li>
      );
    if (chromebooks > 0)
      items.push(
        <li key="chromebooks">
          {chromebooks} Chromebook{chromebooks !== 1 ? "s" : ""}
        </li>
      );
    if (others > 0)
      items.push(
        <li key="others">
          {others} Outro equipamento{others !== 1 ? "s" : ""}
        </li>
      );
    return items.length > 0 ? items : (
      <li>Nenhum equipamento selecionado</li>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="text-black" size={35} /> Minhas Solicitações
        </h1>

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
                  <ChevronDown className="h-4 w-4" />
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
                  <ChevronDown className="h-4 w-4" />
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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="text-center text-destructive p-4 border border-destructive rounded-md">
            Erro ao carregar solicitações
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 bg-gradient-to-br from-background to-muted rounded-xl border border-primary/20 text-center shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold mb-2 text-foreground">
              Nenhuma solicitação encontrada
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
              Parece que você ainda não fez nenhuma solicitação. Escolha o tipo de
              solicitação abaixo para começar!
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => navigate("/nova-solicitacao/reserva")}
                className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg transition-all shadow-md hover:shadow-lg focus:outline-none min-w-[160px]"
              >
                <span className="flex items-center justify-center w-5 h-5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </span>
                Reserva
              </button>

              <button
                onClick={() => navigate("/nova-solicitacao/compra")}
                className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-lg transition-all shadow-md hover:shadow-lg focus:outline-none min-w-[160px]"
              >
                <span className="flex items-center justify-center w-5 h-5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.74a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                </span>
                Compra
              </button>

              <button
                onClick={() => navigate("/nova-solicitacao/suporte")}
                className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 active:scale-95 text-white rounded-lg transition-all shadow-md hover:shadow-lg focus:outline-none min-w-[160px]"
              >
                <span className="flex items-center justify-center w-5 h-5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </span>
                Suporte
              </button>
            </div>
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

        {/* Modais e chats */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
            {isDetailsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : selectedRequest ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {getRequestTypeIcon(selectedRequest.type)}
                    <span>
                      {getReadableRequestType(selectedRequest.type)} -{" "}
                      {selectedRequest.userName || selectedRequest.userEmail}
                    </span>
                  </DialogTitle>
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
                </DialogHeader>
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
                              currency: "BRL",
                            }).format(selectedRequest.unitPrice || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                          <div className="bg-primary/10 p-2 rounded-md">
                            <p className="text-lg font-semibold text-primary">
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
                <DialogFooter className="gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelRequest(selectedRequest)}
                    disabled={selectedRequest?.status === "canceled"}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Cancelar Solicitação
                  </Button>
                  <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                    Fechar
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="text-center p-4 text-destructive">
                Nenhuma solicitação selecionada
              </div>
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