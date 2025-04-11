
// Import only the necessary functions from the file
import { useState, useEffect, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getAllAvailableDates, 
  addAvailableDates, 
  removeAvailableDates,
  AvailabilityDate
} from "@/services/availabilityService";
import AppLayout from "@/components/AppLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Disponibilidade() {
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedAddDates, setSelectedAddDates] = useState<Date[]>([]);
  const [selectedRemoveDates, setSelectedRemoveDates] = useState<Date[]>([]);
  const [isAddingDates, setIsAddingDates] = useState(false);
  const [isRemovingDates, setIsRemovingDates] = useState(false);
  const [tab, setTab] = useState("add");
  const { toast } = useToast();

  // Fix: Function to convert Firestore timestamp to Date
  const convertToJsDate = (date: AvailabilityDate): Date => {
    if (date.date && typeof date.date === 'object' && 'toDate' in date.date) {
      return date.date.toDate();
    }
    // Try to handle string date from Firestore
    if (typeof date.date === 'string') {
      return new Date(date.date);
    }
    // Fallback
    return new Date();
  };

  // Fetch available dates
  const fetchAvailableDates = async () => {
    try {
      const dates = await getAllAvailableDates();
      // Convert Firestore timestamps to JavaScript Date objects
      const jsDateObjects = dates.map(convertToJsDate);
      setAvailableDates(jsDateObjects);
    } catch (error) {
      console.error("Error fetching available dates:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as datas disponíveis.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAvailableDates();
  }, []);

  // This function will check if a date is in the availableDates array
  const isDateAvailable = (date: Date): boolean => {
    return availableDates.some(availableDate => 
      availableDate.getDate() === date.getDate() &&
      availableDate.getMonth() === date.getMonth() &&
      availableDate.getFullYear() === date.getFullYear()
    );
  };

  const handleAddDates = async () => {
    if (selectedAddDates.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos uma data para adicionar.",
      });
      return;
    }

    setIsAddingDates(true);
    try {
      // Fix: Pass each date individually to addAvailableDates
      for (const date of selectedAddDates) {
        await addAvailableDates(date);
      }
      
      toast({
        title: "Sucesso",
        description: `${selectedAddDates.length} data(s) adicionada(s) como disponível(is).`,
      });
      
      // Clear selection and refresh
      setSelectedAddDates([]);
      fetchAvailableDates();
    } catch (error) {
      console.error("Error adding dates:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar as datas.",
        variant: "destructive",
      });
    } finally {
      setIsAddingDates(false);
    }
  };

  const handleRemoveDates = async () => {
    if (selectedRemoveDates.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos uma data para remover.",
      });
      return;
    }

    setIsRemovingDates(true);
    try {
      // Fix: Pass each date individually to removeAvailableDates
      for (const date of selectedRemoveDates) {
        await removeAvailableDates(date);
      }
      
      toast({
        title: "Sucesso",
        description: `${selectedRemoveDates.length} data(s) removida(s) da disponibilidade.`,
      });
      
      // Clear selection and refresh
      setSelectedRemoveDates([]);
      fetchAvailableDates();
    } catch (error) {
      console.error("Error removing dates:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover as datas.",
        variant: "destructive",
      });
    } finally {
      setIsRemovingDates(false);
    }
  };

  // Format the date list for display
  const formatDateList = (dates: Date[]): string => {
    if (dates.length === 0) return "Nenhuma data selecionada";
    
    return dates
      .map(date => format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }))
      .join(", ");
  };

  // Reset selections when tab changes
  useEffect(() => {
    setSelectedAddDates([]);
    setSelectedRemoveDates([]);
  }, [tab]);

  // Custom styles for the calendar
  const calendarClassName = "bg-black rounded-md border-gray-700 text-white";

  return (
    <AppLayout>
      <div className="container mx-auto p-4 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Gerenciar Disponibilidade</h1>
        
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="add">Adicionar Datas Disponíveis</TabsTrigger>
            <TabsTrigger value="remove">Remover Datas Disponíveis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Datas Disponíveis</CardTitle>
                <CardDescription>
                  Selecione as datas que estarão disponíveis para reserva.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Calendar
                      mode="multiple"
                      selected={selectedAddDates}
                      onSelect={setSelectedAddDates as any}
                      className={calendarClassName}
                      classNames={{
                        day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                        day_today: "bg-white text-black",
                        day: "text-white hover:bg-gray-700",
                        day_outside: "text-gray-500 opacity-50",
                        head_cell: "text-gray-300",
                        nav_button: "text-gray-300 hover:bg-gray-700",
                        table: "border-gray-700",
                      }}
                      disabled={(date) => 
                        date < new Date(new Date().setHours(0, 0, 0, 0)) || 
                        isDateAvailable(date)
                      }
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <Card className="h-full bg-gray-50 dark:bg-gray-900">
                      <CardHeader>
                        <CardTitle>Datas Selecionadas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4">
                          {formatDateList(selectedAddDates)}
                        </p>
                        <Button 
                          onClick={handleAddDates} 
                          disabled={isAddingDates || selectedAddDates.length === 0}
                          className="w-full bg-eccos-blue hover:bg-eccos-blue/80"
                        >
                          {isAddingDates ? "Adicionando..." : "Confirmar Adição"}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="remove" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Remover Datas Disponíveis</CardTitle>
                <CardDescription>
                  Selecione as datas que não estarão mais disponíveis para reserva.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Calendar
                      mode="multiple"
                      selected={selectedRemoveDates}
                      onSelect={setSelectedRemoveDates as any}
                      className={calendarClassName}
                      classNames={{
                        day_selected: "bg-red-600 text-white hover:bg-red-700",
                        day_today: "bg-white text-black",
                        day: "text-white hover:bg-gray-700",
                        day_outside: "text-gray-500 opacity-50",
                        head_cell: "text-gray-300",
                        nav_button: "text-gray-300 hover:bg-gray-700",
                        table: "border-gray-700",
                      }}
                      disabled={(date) => !isDateAvailable(date)}
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <Card className="h-full bg-gray-50 dark:bg-gray-900">
                      <CardHeader>
                        <CardTitle>Datas Selecionadas para Remoção</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4">
                          {formatDateList(selectedRemoveDates)}
                        </p>
                        <Button 
                          onClick={handleRemoveDates} 
                          disabled={isRemovingDates || selectedRemoveDates.length === 0}
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                        >
                          {isRemovingDates ? "Removendo..." : "Confirmar Remoção"}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
