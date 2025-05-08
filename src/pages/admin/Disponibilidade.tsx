import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
} from "lucide-react";

// Componente para renderizar o ícone de adição sobre as datas
const AddDateIcon = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-blue-100 rounded-full">
    <Check className="h-8 w-8 text-blue-600 stroke-[3]" />
  </div>
);

// Componente para renderizar o ícone de remoção sobre as datas
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

const buttonStyles = {
  primary: cn(
    "w-full text-xs sm:text-sm py-2",
    "transition-all duration-200",
    "bg-blue-600 hover:bg-blue-700 text-white",
    "rounded-lg"
  ),
  destructive: cn(
    "w-full text-xs sm:text-sm py-2",
    "transition-all duration-200",
    "bg-red-600 hover:bg-red-700 text-white",
    "rounded-lg"
  ),
  cancel: cn(
    "w-full text-xs sm:text-sm py-2",
    "transition-all duration-200",
    "bg-gray-600 hover:bg-gray-700 text-white",
    "rounded-lg"
  ),
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
        prev.filter((date) =>
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
    return availableDates.some(
      (availableDate) => availableDate.toISOString() === date.toISOString()
    );
  };

  const isDateSelectedForAdd = (date: Date) => {
    return selectedAddDates.some(
      (selectedDate) => selectedDate.toISOString() === date.toISOString()
    );
  };

  const isDateSelectedForRemove = (date: Date) => {
    return selectedRemoveDates.some(
      (selectedDate) => selectedDate.toISOString() === date.toISOString()
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

  return (
    <AppLayout>
      <section className="space-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <LucideCalendar className="text-black" size={35} />
          Gerenciamento de Disponibilidade
        </h1>
        <p className="text-muted-foreground">
          Selecione datas para liberar ou bloquear reservas
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full max-w-none bg-gray-100 dark:bg-gray-800 p-1 rounded-lg gap-px">
            <TabsTrigger
              value="add"
              className="rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white h-9 flex-1 flex items-center justify-center gap-1 text-sm"
            >
              <CalendarPlus className="h-4 w-4" />
              Adicionar
            </TabsTrigger>
            <TabsTrigger
              value="remove"
              className="rounded-md data-[state=active]:bg-red-600 data-[state=active]:text-white h-9 flex-1 flex items-center justify-center gap-1 text-sm"
            >
              <CalendarX className="h-4 w-4" />
              Remover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="mt-3">
            <Card className="shadow-sm">
              <CardContent className="space-y-3 pt-4">
                <div className="bg-gray-50 rounded-lg p-2 w-full">
                  <Calendar
                    mode="multiple"
                    selected={selectedAddDates}
                    onSelect={setSelectedAddDates}
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
                            <span
                              className={
                                isDateSelectedForAdd(date) ? "opacity-0" : ""
                              }
                            >
                              {day}
                            </span>
                            {isDateSelectedForAdd(date) && <AddDateIcon />}
                          </div>
                        );
                      },
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <p className="text-xs text-blue-600 mb-2">
                      {formatSelectedDates(selectedAddDates)}
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleAddDates}
                        disabled={isLoading.add}
                        className={buttonStyles.primary}
                      >
                        {isLoading.add ? "Salvando..." : "Confirmar Datas"}
                      </Button>
                      <Button
                        onClick={() => setSelectedAddDates([])}
                        disabled={isLoading.add}
                        className={buttonStyles.cancel}
                      >
                        Limpar Seleção
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-1 text-xs text-gray-600">
                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <p>
                      Datas verdes: disponíveis •{" "}
                      <Check className="h-3 w-3 inline mx-1 text-blue-600 stroke-[3]" />{" "}
                      Datas a adicionar • Dia atual: cinza • Selecione apenas datas futuras
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="remove" className="mt-3">
            <Card className="shadow-sm">
              <CardContent className="space-y-3 pt-4">
                <div className="bg-gray-50 rounded-lg p-2 w-full">
                  <Calendar
                    mode="multiple"
                    selected={selectedRemoveDates}
                    onSelect={setSelectedRemoveDates}
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
                            <span
                              className={
                                isDateSelectedForRemove(date) ? "opacity-0" : ""
                              }
                            >
                              {day}
                            </span>
                            {isDateSelectedForRemove(date) && <RemoveDateIcon />}
                          </div>
                        );
                      },
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <div className="bg-red-50 p-2 rounded-lg">
                    <p className="text-xs text-red-600 mb-2">
                      {formatSelectedDates(selectedRemoveDates)}
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleRemoveDates}
                        disabled={isLoading.remove}
                        className={buttonStyles.destructive}
                      >
                        {isLoading.remove ? "Removendo..." : "Confirmar Remoção"}
                      </Button>
                      <Button
                        onClick={() => setSelectedRemoveDates([])}
                        disabled={isLoading.remove}
                        className={buttonStyles.cancel}
                      >
                        Limpar Seleção
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-1 text-xs text-gray-600">
                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <p>
                      Datas verdes: disponíveis •{" "}
                      <X className="h-3 w-3 inline mx-1 text-red-600 stroke-[3]" />{" "}
                      Datas a remover • Apenas datas disponíveis podem ser removidas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </AppLayout>
  );
}