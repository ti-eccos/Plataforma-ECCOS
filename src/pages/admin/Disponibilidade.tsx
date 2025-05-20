import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  getAvailableDates,
  addAvailableDates,
  removeAvailableDates,
  isDateInPast,
} from "@/services/availabilityService";
import AppLayout from "@/components/AppLayout";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CalendarX,
  CalendarPlus,
  Check,
  X,
  Calendar as LucideCalendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const AddDateIcon = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-blue-100 rounded-full">
    <Check className="h-8 w-8 text-blue-600 stroke-[3]" />
  </div>
);

const RemoveDateIcon = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-red-100 rounded-full">
    <X className="h-8 w-8 text-red-600 stroke-[3]" />
  </div>
);

const calendarStyles: Record<string, React.CSSProperties> = {
  availableDate: {
    border: "2px solid #22c55e",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: "50%",
  },
  selectedAdd: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: "50%",
  },
  selectedRemove: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: "50%",
  },
  today: {
    color: "#9ca3af",
    opacity: "0.5",
    pointerEvents: "none",
  },
};

export default function Disponibilidade() {
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedAddDates, setSelectedAddDates] = useState<Date[]>([]);
  const [selectedRemoveDates, setSelectedRemoveDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState({
    add: false,
    remove: false,
    initial: true,
  });
  const [activeTab, setActiveTab] = useState("add");
  const { toast } = useToast();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const loadDates = async () => {
      try {
        const dates = await getAvailableDates();
        const datesToRemove = dates.filter((date) => isDateInPast(date));
        if (datesToRemove.length > 0) {
          await removeAvailableDates(datesToRemove);
          setAvailableDates(dates.filter((date) => !isDateInPast(date)));
        } else {
          setAvailableDates(dates);
        }
      } catch (error) {
        showErrorToast("Erro ao carregar datas disponíveis");
      } finally {
        setIsLoading((prev) => ({ ...prev, initial: false }));
      }
    };
    loadDates();
  }, []);

  const showErrorToast = (description: string) => {
    toast({
      title: "Erro",
      description,
      variant: "destructive",
    });
  };

  const showSuccessToast = (description: string) => {
    toast({
      title: "Sucesso",
      description,
      className: "bg-green-500 text-foreground",
    });
  };

  const handleAddDates = async () => {
    if (selectedAddDates.length === 0) return;
    setIsLoading((prev) => ({ ...prev, add: true }));
    try {
      await addAvailableDates(selectedAddDates);
      setAvailableDates((prev) => [...prev, ...selectedAddDates]);
      setSelectedAddDates([]);
      showSuccessToast("Datas adicionadas com sucesso!");
    } catch (error) {
      showErrorToast("Erro ao adicionar datas");
    } finally {
      setIsLoading((prev) => ({ ...prev, add: false }));
    }
  };

  const handleRemoveDates = async () => {
    if (selectedRemoveDates.length === 0) return;
    setIsLoading((prev) => ({ ...prev, remove: true }));
    try {
      await removeAvailableDates(selectedRemoveDates);
      setAvailableDates((prev) =>
        prev.filter(
          (date) =>
            !selectedRemoveDates.some(
              (selected) => selected.toISOString() === date.toISOString()
            )
        )
      );
      setSelectedRemoveDates([]);
      showSuccessToast("Datas removidas com sucesso!");
    } catch (error) {
      showErrorToast("Erro ao remover datas");
    } finally {
      setIsLoading((prev) => ({ ...prev, remove: false }));
    }
  };

  const isDateAvailable = (date: Date) => {
    return availableDates.some((availableDate) => isSameDay(availableDate, date));
  };

  const isDateSelectedForAdd = (date: Date) => {
    return selectedAddDates.some((selectedDate) => isSameDay(selectedDate, date));
  };

  const isDateSelectedForRemove = (date: Date) => {
    return selectedRemoveDates.some(
      (selectedDate) => isSameDay(selectedDate, date)
    );
  };

  const isTodayDate = (date: Date) => {
    return isSameDay(date, today);
  };

  const formatSelectedDates = (dates: Date[]) => {
    return dates.length > 0
      ? dates
          .map((date) =>
            format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
          )
          .join(", ")
      : "Nenhuma data selecionada";
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const totalAvailableDates = availableDates.length;
  const currentMonthAvailableDates = availableDates.filter(
    (date) =>
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear()
  ).length;
  const selectedAddCount = selectedAddDates.length;
  const selectedRemoveCount = selectedRemoveDates.length;

  return (
    <AppLayout>
      <div className="min-h-screen bg-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-sidebar blur-3xl opacity-5"></div>
          <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-eccos-purple blur-3xl opacity-5"></div>
        </div>

        <div className="relative z-10 space-y-8 p-6 md:p-12">
          <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
            <LucideCalendar className="text-eccos-purple" size={35} />
            Gerenciamento de Disponibilidade
          </h1>

          {isLoading.initial && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eccos-purple"></div>
            </div>
          )}

          {!isLoading.initial && (
            <div className="space-y-8">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total de Datas Disponíveis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                      {totalAvailableDates}
                    </div>
                    <Badge variant="outline" className="mt-2 border-eccos-purple text-eccos-purple">
                      Datas
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Disponíveis Este Mês</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                      {currentMonthAvailableDates}
                    </div>
                    <Badge variant="outline" className="mt-2 border-eccos-purple text-eccos-purple">
                      Este Mês
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {activeTab === "add" ? "Selecionadas p/ Adicionar" : "Modo Adicionar"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                      {selectedAddCount}
                    </div>
                    <Badge variant="outline" className="mt-2 border-blue-500 text-blue-500">
                      Para Adicionar
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {activeTab === "remove" ? "Selecionadas p/ Remover" : "Modo Remover"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                      {selectedRemoveCount}
                    </div>
                    <Badge variant="outline" className="mt-2 border-red-500 text-red-500">
                      Para Remover
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-[200px]">
                <TabsList className="grid grid-cols-2 w-full bg-white border border-gray-100 rounded-2xl shadow-lg p-1 h-14">
                  <TabsTrigger
                    value="add"
                    className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-sidebar data-[state=active]:to-eccos-purple data-[state=active]:text-white h-12 transition-all duration-300"
                  >
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Adicionar
                  </TabsTrigger>
                  <TabsTrigger
                    value="remove"
                    className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-sidebar data-[state=active]:to-eccos-purple data-[state=active]:text-white h-12 transition-all duration-300"
                  >
                    <CalendarX className="h-4 w-4 mr-2" />
                    Remover
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="add" className="mt-6">
                  <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <Calendar
                          mode="multiple"
                          selected={selectedAddDates}
                          onSelect={setSelectedAddDates}
                          month={currentMonth}
                          onMonthChange={setCurrentMonth}
                          disabled={(date) => isDateInPast(date) || isDateAvailable(date)}
                          modifiers={{
                            available: (date) => isDateAvailable(date),
                            today: (date) => isTodayDate(date),
                            selectedAdd: (date) => isDateSelectedForAdd(date),
                          }}
                          modifiersStyles={calendarStyles}
                          className="border-0"
                          components={{
                            DayContent: (props) => {
                              const { date } = props;
                              const day = date.getDate();
                              return (
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <span className={isDateSelectedForAdd(date) ? "opacity-0" : ""}>
                                    {day}
                                  </span>
                                  {isDateSelectedForAdd(date) && <AddDateIcon />}
                                </div>
                              );
                            },
                          }}
                        />
                      </div>
                      
                      <div className="mt-6 space-y-4">
                        <div className="bg-blue-50 p-4 rounded-2xl">
                          <div className="flex items-center gap-2 mb-3">
                            <CalendarPlus className="h-5 w-5 text-blue-600" />
                            <h3 className="font-medium text-blue-600">Datas para Adicionar</h3>
                          </div>
                          <p className="text-sm text-blue-600 mb-4 max-h-20 overflow-y-auto">
                            {formatSelectedDates(selectedAddDates)}
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <Button
                              onClick={handleAddDates}
                              disabled={isLoading.add || selectedAddDates.length === 0}
                              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-sidebar to-eccos-purple hover:from-eccos-purple hover:to-sidebar text-white"
                            >
                              {isLoading.add ? "Salvando..." : "Confirmar Adição"}
                            </Button>
                            <Button
                              onClick={() => setSelectedAddDates([])}
                              variant="outline"
                              className="flex-1 h-12 rounded-xl border-eccos-purple text-eccos-purple hover:bg-eccos-purple/10"
                            >
                              Limpar Seleção
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="remove" className="mt-6">
                  <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <Calendar
                          mode="multiple"
                          selected={selectedRemoveDates}
                          onSelect={setSelectedRemoveDates}
                          month={currentMonth}
                          onMonthChange={setCurrentMonth}
                          disabled={(date) => !isDateAvailable(date)}
                          modifiers={{
                            available: (date) => isDateAvailable(date),
                            today: (date) => isTodayDate(date),
                            selectedRemove: (date) => isDateSelectedForRemove(date),
                          }}
                          modifiersStyles={calendarStyles}
                          className="border-0"
                          components={{
                            DayContent: (props) => {
                              const { date } = props;
                              const day = date.getDate();
                              return (
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <span className={isDateSelectedForRemove(date) ? "opacity-0" : ""}>
                                    {day}
                                  </span>
                                  {isDateSelectedForRemove(date) && <RemoveDateIcon />}
                                </div>
                              );
                            },
                          }}
                        />
                      </div>
                      
                      <div className="mt-6 space-y-4">
                        <div className="bg-red-50 p-4 rounded-2xl">
                          <div className="flex items-center gap-2 mb-3">
                            <CalendarX className="h-5 w-5 text-red-600" />
                            <h3 className="font-medium text-red-600">Datas para Remover</h3>
                          </div>
                          <p className="text-sm text-red-600 mb-4 max-h-20 overflow-y-auto">
                            {formatSelectedDates(selectedRemoveDates)}
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <Button
                              onClick={handleRemoveDates}
                              disabled={isLoading.remove || selectedRemoveDates.length === 0}
                              className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                            >
                              {isLoading.remove ? "Removendo..." : "Confirmar Remoção"}
                            </Button>
                            <Button
                              onClick={() => setSelectedRemoveDates([])}
                              variant="outline"
                              className="flex-1 h-12 rounded-xl border-red-600 text-red-600 hover:bg-red-50"
                            >
                              Limpar Seleção
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

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
}