import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, addDays, isSameWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllRequests, RequestData, RequestType } from "@/services/reservationService";
import { cn } from "@/lib/utils";

// Tipagem específica para Reserva
interface Reservation extends RequestData {
  equipmentQuantities: { [type: string]: number };
}

const CalendarioReservas = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Busca todas as reservas
  const { data: reservas = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['reservasCalendario'],
    queryFn: () => getAllRequests(),
    select: (data) => data.filter(req => req.type === 'reservation') as Reservation[],
    retry: 2,
  });

  // Animação de entrada (fade-up)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Gera os slots horários do dia todo (00:00 a 23:00)
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  // Converte uma string de hora em objeto Date baseado na data informada
  const parseTime = (dateString: string, timeString: string) => {
    const date = new Date(dateString);
    const [hours, minutes] = timeString.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Agrupa as reservas por data e adiciona objetos Date para início e fim
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

  // Retorna os dias da semana (domingo a sábado)
  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // começa no domingo
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  };

  // Calcula estatísticas para o dashboard
  const totalReservations = reservas.length;
  const weekReservations = getWeekDays().reduce((count, day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return count + (groupedReservations[dateKey]?.length || 0);
  }, 0);
  const uniqueLocations = [...new Set(reservas.map(r => r.location))].length;
  const uniqueUsers = [...new Set(reservas.map(r => r.userId))].length;



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
                {/* Total de Reservas */}
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

                {/* Reservas na Semana */}
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

                {/* Locais Diferentes */}
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

                {/* Usuários Diferentes */}
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

              {/* Calendário em grade para todas as telas */}
              <Card className="border border-gray-200 rounded-2xl shadow-lg overflow-hidden bg-white">
                {/* Cabeçalho Fixo */}
                <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                  <div className="grid grid-cols-8 h-12 md:h-16">
                    {/* Coluna Horário */}
                    <div className="flex items-center justify-center text-xs md:text-sm font-medium border-r border-gray-200"></div>
                    {/* Dias da Semana */}
                    {getWeekDays().map((date, i) => {
                      const dayInitials = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                      
                      return (
                        <div key={i} className="flex flex-col items-center justify-center text-xs md:text-sm font-medium border-r border-gray-200">
                          <span className="text-xs font-bold text-black">{dayInitials[i]}</span>
                          <span className="mt-1 text-sm md:text-lg font-bold text-eccos-purple">{format(date, "d")}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white overflow-x-auto">
                  <div className="grid grid-cols-8 min-w-full">
                    {/* Conteúdo da Grade Horária */}
                    {getTimeSlots().map((timeSlot) => (
                      <React.Fragment key={timeSlot}>
                        {/* Slot Horário */}
                        <div className="border-t border-r border-gray-200 p-1 md:p-2 text-xs text-blue-600 text-center font-medium h-12 md:h-16 flex items-center justify-center min-w-[50px]">
                          {timeSlot}
                        </div>
                        {/* Dias da Semana */}
                        {getWeekDays().map((date, dayIndex) => {
                          const dateKey = format(date, 'yyyy-MM-dd');
                          const reservations = groupedReservations[dateKey] || [];
                          return (
                            <div
                              key={dayIndex}
                              className="border-t border-r border-gray-200 relative hover:bg-gray-50 transition-colors bg-white h-12 md:h-16 min-w-[50px]"
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
                                  const topOffset = (reserva.start.getMinutes() / 60) * 100;
                                  return (
                                    <div
                                      key={i}
                                      role="button"
                                      tabIndex={0}
                                      onClick={() => setSelectedReservation(reserva)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          setSelectedReservation(reserva);
                                        }
                                      }}
                                      className="absolute bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded p-1 md:p-2 m-0.5 md:m-1 text-xs w-[95%] cursor-pointer z-20 shadow-md hover:shadow-lg transition-shadow"
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
              <DialogContent className="max-w-md mx-4 bg-white rounded-2xl border border-gray-100 shadow-xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                    Detalhes da Reserva
                  </DialogTitle>
                  <DialogDescription asChild>
                    <div className="text-sm text-muted-foreground">
                      Visualize os detalhes completos desta reserva.
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome do Usuário</label>
                    <p className="font-medium">{selectedReservation.userName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Propósito</label>
                    <p>{selectedReservation.purpose}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Local</label>
                    <p>{selectedReservation.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data</label>
                    <p>{format(selectedReservation.date.toDate(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Horário</label>
                    <p>
                      {selectedReservation.startTime} - {selectedReservation.endTime}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Equipamentos</label>
                    {Object.entries(selectedReservation.equipmentQuantities).length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1 mt-1">
                        {Object.entries(selectedReservation.equipmentQuantities).map(([tipo, quantidade]) => (
                          <li key={tipo}>
                            {tipo}: <strong>{typeof quantidade === 'number' ? quantidade : 0}</strong>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum equipamento solicitado.</p>
                    )}
                  </div>
                  <div className="pt-2">
                    <Button
                      className="w-full bg-eccos-purple hover:bg-sidebar text-white"
                      onClick={() => setSelectedReservation(null)}
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Rodapé */}
        <footer className="relative z-10 bg-gray-50 py-10 px-4 md:px-12 fade-up">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <p className="text-gray-500 text-sm">
                © 2025 Colégio ECCOS - Todos os direitos reservados
              </p>
            </div>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
};

export default CalendarioReservas;