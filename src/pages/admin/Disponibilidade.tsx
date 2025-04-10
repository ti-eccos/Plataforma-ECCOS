
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Calendar as CalendarComponent,
  CalendarProps,
} from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Check, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  getAvailableDates,
  addAvailableDates,
  removeAvailableDates,
  isDateInPastOrToday,
} from "@/services/availabilityService";

const Disponibilidade = () => {
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load available dates from Firestore
  useEffect(() => {
    const loadAvailableDates = async () => {
      setIsLoading(true);
      try {
        const dates = await getAvailableDates();
        setAvailableDates(dates);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao carregar datas disponíveis",
          variant: "destructive",
        });
        console.error("Failed to load available dates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailableDates();
  }, [toast]);

  // Handle date selection/deselection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    setSelectedDates((currentSelectedDates) => {
      // Check if date is already selected
      const dateExists = currentSelectedDates.some(
        (selectedDate) => format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      );

      // If date exists, remove it, otherwise add it
      if (dateExists) {
        return currentSelectedDates.filter(
          (selectedDate) =>
            format(selectedDate, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd")
        );
      } else {
        return [...currentSelectedDates, date];
      }
    });
  };

  // Save selected dates as available
  const handleSaveAvailableDates = async () => {
    if (selectedDates.length === 0) {
      toast({
        title: "Nenhuma data selecionada",
        description: "Selecione pelo menos uma data para adicionar",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await addAvailableDates(selectedDates);
      
      // Update the available dates list
      setAvailableDates((current) => {
        // Create a new array with existing dates plus new dates
        const updatedDates = [...current];
        
        // Add each selected date if it doesn't exist already
        selectedDates.forEach((date) => {
          const dateExists = updatedDates.some(
            (existingDate) => 
              format(existingDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
          );
          
          if (!dateExists) {
            updatedDates.push(date);
          }
        });
        
        return updatedDates;
      });

      setSelectedDates([]);
      toast({
        title: "Datas adicionadas",
        description: `${selectedDates.length} data(s) adicionada(s) com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao adicionar datas disponíveis",
        variant: "destructive",
      });
      console.error("Failed to add available dates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove selected dates from available
  const handleRemoveAvailableDates = async () => {
    if (selectedDates.length === 0) {
      toast({
        title: "Nenhuma data selecionada",
        description: "Selecione pelo menos uma data para remover",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await removeAvailableDates(selectedDates);
      
      // Update the available dates list
      setAvailableDates((current) => 
        current.filter((existingDate) => 
          !selectedDates.some((selectedDate) => 
            format(existingDate, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
          )
        )
      );

      setSelectedDates([]);
      toast({
        title: "Datas removidas",
        description: `${selectedDates.length} data(s) removida(s) com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao remover datas disponíveis",
        variant: "destructive",
      });
      console.error("Failed to remove available dates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear selected dates
  const handleClearSelection = () => {
    setSelectedDates([]);
  };

  // Check if a date is available
  const isDateAvailable = (date: Date): boolean => {
    return availableDates.some(
      (availableDate) =>
        format(availableDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
  };

  // Check if a date is selected
  const isDateSelected = (date: Date): boolean => {
    return selectedDates.some(
      (selectedDate) =>
        format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
  };

  // Determine the CSS classes for the date
  const getDateClassName = (date: Date): string => {
    if (isDateSelected(date)) return "selected";
    if (isDateAvailable(date)) return "available";
    return "";
  };

  // Disable past dates
  const disableDate = (date: Date): boolean => {
    return isDateInPastOrToday(date);
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gradient">
                Disponibilidade
              </h2>
              <p className="text-muted-foreground mt-1">
                Gerencie as datas disponíveis para reservas de equipamentos.
              </p>
            </div>
          </div>

          <Card className="bg-black border-gray-800">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="text-white">Calendário de Disponibilidade</CardTitle>
              <CardDescription className="text-gray-400">
                Selecione datas para gerenciar a disponibilidade
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-80">
                  <Loader2 className="h-8 w-8 animate-spin text-eccos-blue" />
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="calendar-container bg-black text-white border border-gray-800 rounded-lg p-4 mb-4 w-full max-w-lg">
                    <CalendarComponent
                      mode="multiple"
                      selected={selectedDates}
                      onSelect={(date) => handleDateSelect(date)}
                      disabled={disableDate}
                      modifiers={{
                        available: (date) => isDateAvailable(date),
                        selected: (date) => isDateSelected(date)
                      }}
                      className="text-white border-gray-700"
                      showOutsideDays={true}
                      locale={ptBR}
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4 justify-center text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-transparent border-2 border-green-500 rounded-sm"></div>
                      <span>Disponível</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-transparent border-2 border-blue-500 rounded-sm"></div>
                      <span>Selecionado</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2 justify-between border-t border-gray-800 pt-4">
              <div className="text-white">
                {selectedDates.length} data(s) selecionada(s)
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleClearSelection}
                  disabled={selectedDates.length === 0 || isLoading}
                  className="border-gray-700 text-white hover:bg-gray-800"
                >
                  Limpar seleção
                </Button>
                <Button
                  onClick={handleRemoveAvailableDates}
                  disabled={selectedDates.length === 0 || isLoading}
                  variant="destructive"
                  className="gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover datas
                </Button>
                <Button
                  onClick={handleSaveAvailableDates}
                  disabled={selectedDates.length === 0 || isLoading}
                  className="bg-eccos-blue hover:bg-eccos-blue/80 gap-1"
                >
                  <Check className="h-4 w-4" />
                  Adicionar datas
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Disponibilidade;
