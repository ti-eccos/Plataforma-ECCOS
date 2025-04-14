
// src/pages/Disponibilidade.tsx
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getAvailableDates, 
  addAvailableDates, 
  removeAvailableDates, 
  isDateInPastOrToday
} from "@/services/availabilityService";
import AppLayout from "@/components/AppLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Objeto de estilos para o calendário
const calendarStyles = {
  availableDate: {
    border: "2px solid #22c55e",
    backgroundColor: "transparent"
  },
  selectedAdd: {
    border: "2px solid #3b82f6",
    backgroundColor: "transparent"
  },
  selectedRemove: {
    border: "2px solid #ef4444",
    backgroundColor: "transparent"
  }
};

export default function Disponibilidade() {
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedAddDates, setSelectedAddDates] = useState<Date[]>([]);
  const [selectedRemoveDates, setSelectedRemoveDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState({
    add: false,
    remove: false,
    initial: true
  });
  const [activeTab, setActiveTab] = useState("add");
  const { toast } = useToast();

  useEffect(() => {
    const loadDates = async () => {
      try {
        const dates = await getAvailableDates();
        
        // Filtrar datas passadas ou hoje
        const datesToRemove = dates.filter(date => isDateInPastOrToday(date));
        
        if (datesToRemove.length > 0) {
          // Remover do backend
          await removeAvailableDates(datesToRemove);
          // Manter apenas datas futuras no estado
          const futureDates = dates.filter(date => !isDateInPastOrToday(date));
          setAvailableDates(futureDates);
        } else {
          setAvailableDates(dates);
        }
      } catch (error) {
        showErrorToast("Erro ao carregar datas disponíveis");
      } finally {
        setIsLoading(prev => ({ ...prev, initial: false }));
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
      className: "bg-green-500 text-white",
    });
  };

  const handleAddDates = async () => {
    if (selectedAddDates.length === 0) return;
    
    setIsLoading(prev => ({ ...prev, add: true }));
    try {
      await addAvailableDates(selectedAddDates);
      setAvailableDates(prev => [...prev, ...selectedAddDates]);
      setSelectedAddDates([]);
      showSuccessToast("Datas adicionadas com sucesso!");
    } catch (error) {
      showErrorToast("Erro ao adicionar datas");
    } finally {
      setIsLoading(prev => ({ ...prev, add: false }));
    }
  };

  const handleRemoveDates = async () => {
    if (selectedRemoveDates.length === 0) return;
    
    setIsLoading(prev => ({ ...prev, remove: true }));
    try {
      await removeAvailableDates(selectedRemoveDates);
      setAvailableDates(prev => 
        prev.filter(date => 
          !selectedRemoveDates.some(selected => 
            selected.toISOString() === date.toISOString()
          )
        )
      );
      setSelectedRemoveDates([]);
      showSuccessToast("Datas removidas com sucesso!");
    } catch (error) {
      showErrorToast("Erro ao remover datas");
    } finally {
      setIsLoading(prev => ({ ...prev, remove: false }));
    }
  };

  const isDateAvailable = (date: Date) => {
    return availableDates.some(availableDate => 
      availableDate.toISOString() === date.toISOString()
    );
  };

  const formatSelectedDates = (dates: Date[]) => {
    return dates.length > 0 
      ? dates.map(date => 
          format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        ).join(", ")
      : "Nenhuma data selecionada";
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8">Gerenciamento de Disponibilidade</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-6">
            <TabsTrigger value="add">Adicionar</TabsTrigger>
            <TabsTrigger value="remove">Remover</TabsTrigger>
          </TabsList>

          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Disponibilidade</CardTitle>
                <CardDescription>
                  Selecione as datas que deseja liberar para reservas
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <Calendar
                    mode="multiple"
                    selected={selectedAddDates}
                    onSelect={setSelectedAddDates}
                    disabled={(date) => 
                      isDateInPastOrToday(date) || 
                      isDateAvailable(date) ||
                      date < new Date()
                    }
                    className="rounded-lg border p-4"
                    modifiers={{
                      available: (date) => isDateAvailable(date),
                    }}
                    modifiersStyles={{
                      available: calendarStyles.availableDate,
                      selected: calendarStyles.selectedAdd
                    }}
                  />
                </div>
                
                <div className="flex-1 space-y-4">
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">Datas Selecionadas:</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatSelectedDates(selectedAddDates)}
                        </p>
                      </div>
                      <Button
                        onClick={handleAddDates}
                        disabled={isLoading.add || selectedAddDates.length === 0}
                        className="w-full"
                      >
                        {isLoading.add ? "Salvando..." : "Confirmar Datas"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="remove">
            <Card>
              <CardHeader>
                <CardTitle>Remover Disponibilidade</CardTitle>
                <CardDescription>
                  Selecione as datas que deseja bloquear para reservas
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <Calendar
                    mode="multiple"
                    selected={selectedRemoveDates}
                    onSelect={setSelectedRemoveDates}
                    disabled={(date) => !isDateAvailable(date)}
                    className="rounded-lg border p-4"
                    modifiers={{
                      available: (date) => isDateAvailable(date),
                    }}
                    modifiersStyles={{
                      available: calendarStyles.availableDate,
                      selected: calendarStyles.selectedRemove
                    }}
                  />
                </div>
                
                <div className="flex-1 space-y-4">
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">Datas Selecionadas:</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatSelectedDates(selectedRemoveDates)}
                        </p>
                      </div>
                      <Button
                        onClick={handleRemoveDates}
                        disabled={isLoading.remove || selectedRemoveDates.length === 0}
                        className="w-full bg-destructive hover:bg-destructive/80"
                      >
                        {isLoading.remove ? "Removendo..." : "Confirmar Remoção"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
