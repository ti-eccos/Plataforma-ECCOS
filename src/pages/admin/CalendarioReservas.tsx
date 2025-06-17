import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Trash2,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Filter,
  Search,
  ChevronDown,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getAllRequests, deleteRequest } from "@/services/sharedService";
import { RequestData } from "@/services/types";
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Tipagem específica para Reserva
interface Reservation extends RequestData {
  equipmentQuantities: { [type: string]: number };
}

const getStatusBadge = (status: string) => {
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

const CalendarioReservas = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<Reservation | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Estados para busca e filtro
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["pending", "approved", "in-progress"]);
  const [equipmentNames, setEquipmentNames] = useState<{ [key: string]: string[] }>({});

  const { currentUser } = useAuth();
  const isAdmin = (currentUser?.role || []).includes("admin");

  // Busca todas as reservas
  const { data: reservas = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['reservasCalendario'],
    queryFn: () => getAllRequests(),
    select: (data) => data.filter(req => req.type === 'reservation') as Reservation[],
    retry: 2,
  });

  // Carrega nomes dos equipamentos
  const loadEquipmentNames = async (reservationId: string, equipmentIds: string[]) => {
    if (!equipmentIds.length) return [];

    const names = await Promise.all(
      equipmentIds.map(async (id) => {
        const equipDoc = await getDoc(doc(db, "equipment", id));
        return equipDoc.exists() ? equipDoc.data().name : "Equipamento desconhecido";
      })
    );

    setEquipmentNames(prev => ({
      ...prev,
      [reservationId]: names.filter(Boolean)
    }));
  };

    // Converte hora em objeto Date
  const parseTime = (dateString: string, timeString: string) => {
    const date = new Date(dateString);
    const [hours, minutes] = timeString.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Agrupa por data
  const groupedReservations = reservas.reduce((acc: { [key: string]: Reservation[] }, reserva) => {
    const date = format(reserva.date.toDate(), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push({
      ...reserva,
      start: parseTime(date, reserva.startTime),
      end: parseTime(date, reserva.endTime)
    });
    return acc;
  }, {});

  // Gera os slots horários
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  // Retorna dias da semana
  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  };

  // Calcula estatísticas
  const totalReservations = reservas.length;
  const weekReservations = getWeekDays().reduce((count, day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return count + (groupedReservations[dateKey]?.length || 0);
  }, 0);
  const uniqueLocations = [...new Set(reservas.map(r => r.location))].length;
  const uniqueUsers = [...new Set(reservas.map(r => r.userId))].length;

  // Funções auxiliares
  const handleViewDetails = async (reservation: Reservation) => {
    await loadEquipmentNames(reservation.id, reservation.equipmentIds || []);
    setSelectedReservation(reservation);
  };

  const handleStatusUpdate = async (status: string) => {
    if (!selectedReservation) return;
    try {
      const docRef = doc(db, selectedReservation.collectionName, selectedReservation.id);
      await updateDoc(docRef, {
        status,
        history: arrayUnion({
          status,
          message: `Status alterado para ${status}`,
          timestamp: Timestamp.now()
        })
      });
      toast.success("Status atualizado");
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDeleteRequest = (request: Reservation) => {
    setRequestToDelete(request);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return;
    try {
      await deleteRequest(requestToDelete.id, requestToDelete.collectionName);
      toast.success("Excluído com sucesso");
      setIsDeleteDialogOpen(false);
      setRequestToDelete(null);
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir");
      console.error("Error:", error);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-white overflow-hidden relative">
        {/* Fundos decorativos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-sidebar blur-3xl opacity-5"></div>
          <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-eccos-purple blur-3xl opacity-5"></div>
        </div>

        {/* Conteúdo principal */}
        <div className="relative z-10 space-y-6 p-4 md:p-6 lg:p-12 fade-up">
          {/* Cabeçalho */}
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
            <Calendar className="text-eccos-purple" size={35} />
            Calendário de Reservas
          </h1>

          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eccos-purple"></div>
            </div>
          )}

          {isError && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-8 text-center">
              <p className="text-lg text-gray-500 mb-4">
                Ocorreu um erro ao carregar as reservas.
              </p>
              <Button 
                onClick={() => refetch()}
                className="bg-eccos-purple hover:bg-sidebar text-white"
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="space-y-6 fade-up">
              {/* Cards com estatísticas */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Total de Reservas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">{totalReservations}</div>
                    <Badge variant="outline" className="mt-2 border-eccos-purple text-eccos-purple text-xs">Agendamentos</Badge>
                  </CardContent>
                </Card>
                <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Reservas Nesta Semana</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">{weekReservations}</div>
                    <Badge variant="outline" className="mt-2 border-eccos-purple text-eccos-purple text-xs">Esta Semana</Badge>
                  </CardContent>
                </Card>
                <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Locais Reservados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">{uniqueLocations}</div>
                    <Badge variant="outline" className="mt-2 border-eccos-purple text-eccos-purple text-xs">Espaços</Badge>
                  </CardContent>
                </Card>
                <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Usuários com Reservas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">{uniqueUsers}</div>
                    <Badge variant="outline" className="mt-2 border-eccos-purple text-eccos-purple text-xs">Professores</Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Controles do Calendário */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 py-4 bg-white rounded-lg shadow border border-gray-200">
                <div className="flex items-center gap-2 sm:gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-eccos-purple text-eccos-purple hover:bg-eccos-purple/10"
                    onClick={() => setCurrentDate(prev => addDays(prev, -7))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-black text-sm sm:text-lg whitespace-nowrap">
                    {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-eccos-purple text-black hover:bg-eccos-purple/10"
                    onClick={() => setCurrentDate(prev => addDays(prev, 7))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  size="sm"
                  className="bg-eccos-purple hover:bg-sidebar text-white"
                  onClick={() => refetch()}
                >
                  Atualizar
                </Button>
              </div>

              {/* Calendário em grade */}
              <Card className="rounded-2xl shadow-lg overflow-hidden bg-white">
                {/* Cabeçalho Fixo */}
                <div className="bg-white sticky top-0 z-10">
                  <div className="grid grid-cols-8 h-12 md:h-12">
                    <div className="flex items-center justify-center text-xs md:text-sm font-medium"></div>
                    {getWeekDays().map((date, i) => {
                      const dayInitials = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                      return (
                        <div key={i} className="flex flex-col items-center justify-center text-xs md:text-sm font-medium">
                          <span className="text-xs font-bold text-black">{dayInitials[i]}</span>
                          <span className="mt-1 text-sm md:text-lg font-bold text-eccos-purple">{format(date, "d")}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-white overflow-x-auto p-0">
                  <div className="grid grid-cols-8 min-w-full mt-0">
                    {getTimeSlots().map((timeSlot) => (
                      <React.Fragment key={timeSlot}>
                        {/* Slot Horário */}
                        <div
                          className="border-r border-gray-200 p-1 md:p-2 text-xs text-blue-600 text-center font-medium h-8 md:h-10 flex items-center justify-center min-w-[50px]"
                        >
                          {timeSlot}
                        </div>
                        {/* Dias da Semana */}
                        {getWeekDays().map((date, dayIndex) => {
                          const dateKey = format(date, 'yyyy-MM-dd');
                          const reservations = groupedReservations[dateKey] || [];
                          return (
                            <div
                              key={dayIndex}
                              className="border-t border-r border-gray-200 relative hover:bg-gray-50 transition-colors bg-white h-8 md:h-10 min-w-[50px]"
                              style={{ overflow: 'visible' }}
                            >
                              {reservations
                                .filter(reserva => {
                                  const slotStart = parseTime(dateKey, timeSlot);
                                  const [hours] = timeSlot.split(':').map(Number);
                                  const nextSlot = new Date(slotStart);
                                  nextSlot.setHours(hours + 1, 0, 0, 0);
                                  return reserva.start >= slotStart && reserva.start < nextSlot;
                                })
                                .map((reserva, i) => {
                                  const durationInHours =
                                    (reserva.end.getTime() - reserva.start.getTime()) / (1000 * 60 * 60);
                                  const topOffset = ((reserva.start.getHours() * 60 + reserva.start.getMinutes()) % 60) / 60 * 100;
                                  return (
                                    <div
                                      key={i}
                                      role="button"
                                      tabIndex={0}
                                      onClick={() => handleViewDetails(reserva)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          handleViewDetails(reserva);
                                        }
                                      }}
                                      className="absolute bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded p-1 md:p-2 m-0.5 md:m-1 text-xs w-[95%] cursor-pointer z-20 shadow-md hover:shadow-lg transition-shadow flex flex-col justify-center"
                                      style={{
                                        top: `${topOffset}%`,
                                        height: `${durationInHours * 100}%`
                                      }}
                                    >
                                      <div className="font-medium truncate text-xs" title={reserva.userName}>
                                        {reserva.userName.split(' ')[0]}
                                      </div>
                                      <div className="text-blue-600 mt-0.5 text-xs hidden md:block">
                                        {format(reserva.start, 'HH:mm')} - {format(reserva.end, 'HH:mm')}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Modal de Detalhes da Reserva */}
          {selectedReservation && (
  <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
    <DialogContent className="max-w-3xl bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="flex flex-col h-[80vh]">
        {/* Cabeçalho fixo */}
        <DialogHeader className="p-6 pb-2 border-b border-gray-100 bg-white sticky top-0 z-10">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            <span className="bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
              Solicitação de Reserva - {selectedReservation.userName || selectedReservation.userEmail}
            </span>
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center justify-between text-gray-500 px-1 mt-2">
              <div>
                {format(selectedReservation.date.toDate(), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </div>
              <div>{getStatusBadge(selectedReservation.status)}</div>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Conteúdo específico para reserva */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Solicitante</p>
              <p className="font-medium">{selectedReservation.userName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Local</p>
              <p className="font-medium">{selectedReservation.location}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Data/Hora</p>
              <p className="font-medium">
                {format(selectedReservation.date.toDate(), "dd/MM/yyyy", { locale: ptBR })} •{" "}
                {selectedReservation.startTime} - {selectedReservation.endTime}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">Finalidade</p>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="whitespace-pre-wrap break-words">{selectedReservation.purpose}</p>
            </div>
          </div>
          {/* Equipamentos */}
          {equipmentNames[selectedReservation.id]?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Equipamentos</p>
              <div className="bg-gray-50 p-4 rounded-xl">
                <ul className="list-disc list-inside space-y-1">
                  {equipmentNames[selectedReservation.id].map((name, idx) => (
                    <li key={idx} className="text-gray-700">{name}</li>
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
              <DropdownMenuContent align="start" className="bg-background rounded-xl">
                {["pending", "approved", "rejected", "in-progress", "completed", "canceled"].map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={selectedReservation.status === status}
                    onCheckedChange={() => handleStatusUpdate(status)}
                  >
                    {getStatusBadge(status)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Rodapé fixo opcional */}
        <DialogFooter className="p-6 border-t border-gray-100 gap-2 bg-white sticky bottom-0 z-10">
          <Button
            variant="destructive"
            onClick={() => handleDeleteRequest(selectedReservation)}
            className="w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Solicitação
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
)}
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

        {/* Rodapé */}
        <footer className="relative z-10 bg-gray-50 py-10 px-4 md:px-12 fade-up">
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

export default CalendarioReservas;