
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
import { getAvailableDates, addAvailableDates, removeAvailableDates, isDateInPastOrToday } from "@/services/availabilityService";

const Disponibilidade = () => {
  // State for selected dates by the user
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  
  // QueryClient for refetching data
  const queryClient = useQueryClient();

  // Fetch available dates from Firebase
  const { data: availableDates = [], isLoading } = useQuery({
    queryKey: ['availableDates'],
    queryFn: getAvailableDates
  });

  // Add dates mutation
  const addDatesMutation = useMutation({
    mutationFn: addAvailableDates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableDates'] });
      toast.success("Datas adicionadas com sucesso!");
      setSelectedDates([]);
    },
    onError: (error) => {
      toast.error("Erro ao adicionar datas: " + (error as Error).message);
    }
  });

  // Remove dates mutation
  const removeDatesMutation = useMutation({
    mutationFn: removeAvailableDates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableDates'] });
      toast.success("Datas removidas com sucesso!");
      setSelectedDates([]);
    },
    onError: (error) => {
      toast.error("Erro ao remover datas: " + (error as Error).message);
    }
  });

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Normalize the date by setting time to 00:00:00
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    
    // Check if the date is in the past or today
    if (isDateInPastOrToday(new Date(normalizedDate))) {
      toast.error("Não é possível selecionar datas passadas ou o dia atual");
      return;
    }
    
    setSelectedDates(prevDates => {
      // Check if date is already selected
      const dateExists = prevDates.some(d => {
        const normalizedD = new Date(d);
        normalizedD.setHours(0, 0, 0, 0);
        return normalizedD.getTime() === normalizedDate.getTime();
      });
      
      // If date exists in array, remove it, otherwise add it
      if (dateExists) {
        return prevDates.filter(d => {
          const normalizedD = new Date(d);
          normalizedD.setHours(0, 0, 0, 0);
          return normalizedD.getTime() !== normalizedDate.getTime();
        });
      } else {
        return [...prevDates, normalizedDate];
      }
    });
  };

  // Add available dates
  const handleAddDates = () => {
    if (selectedDates.length === 0) {
      toast.error("Selecione pelo menos uma data para adicionar");
      return;
    }
    
    // Filter out dates that are already available to avoid duplicates
    const newDates = selectedDates.filter(selectedDate => 
      !availableDates.some(availableDate => {
        const normalizedAvailable = new Date(availableDate);
        const normalizedSelected = new Date(selectedDate);
        normalizedAvailable.setHours(0, 0, 0, 0);
        normalizedSelected.setHours(0, 0, 0, 0);
        return normalizedAvailable.getTime() === normalizedSelected.getTime();
      })
    );
    
    if (newDates.length === 0) {
      toast.error("As datas selecionadas já estão disponíveis");
      return;
    }
    
    addDatesMutation.mutate(newDates);
  };

  // Remove available dates
  const handleRemoveDates = () => {
    if (selectedDates.length === 0) {
      toast.error("Selecione pelo menos uma data para remover");
      return;
    }
    
    // Filter only dates that are actually available
    const datesToRemove = selectedDates.filter(selectedDate => 
      availableDates.some(availableDate => {
        const normalizedAvailable = new Date(availableDate);
        const normalizedSelected = new Date(selectedDate);
        normalizedAvailable.setHours(0, 0, 0, 0);
        normalizedSelected.setHours(0, 0, 0, 0);
        return normalizedAvailable.getTime() === normalizedSelected.getTime();
      })
    );
    
    if (datesToRemove.length === 0) {
      toast.error("Nenhuma das datas selecionadas está disponível");
      return;
    }
    
    removeDatesMutation.mutate(datesToRemove);
  };

  // Custom modifiers for the calendar
  const modifiers = {
    available: availableDates.map(date => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    }),
    selected: selectedDates,
  };

  // Custom modifiers styles
  const modifiersStyles = {
    available: { border: "2px solid #00e676", borderRadius: "50%" },
    selected: { border: "2px solid #1EAEDB", borderRadius: "50%" }
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Disponibilidade</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie as datas disponíveis para reservas.
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendário de Disponibilidade
            </CardTitle>
            <CardDescription>
              Selecione datas para torná-las disponíveis ou remover disponibilidade.
              <br />
              <span className="flex items-center gap-2 mt-2">
                <span className="inline-block h-3 w-3 bg-[#222222] rounded-sm"></span>
                <span>Hoje</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 border-2 border-[#00e676] rounded-sm"></span>
                <span>Data disponível</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 border-2 border-[#1EAEDB] rounded-sm"></span>
                <span>Data selecionada</span>
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="flex flex-col items-center">
              <div className="mb-6 border border-border rounded-lg p-4">
                <Calendar
                  mode="multiple"
                  onSelect={(date) => handleDateSelect(date as Date)}
                  selected={selectedDates}
                  className="rounded-md border text-white"
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  fromDate={new Date()}
                  disabled={date => isDateInPastOrToday(date)}
                />
              </div>
              
              <div className="flex gap-4 w-full justify-center mt-4">
                <Button 
                  onClick={handleAddDates} 
                  disabled={selectedDates.length === 0 || addDatesMutation.isPending}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar disponibilidade
                </Button>
                <Button 
                  onClick={handleRemoveDates} 
                  variant="destructive" 
                  disabled={selectedDates.length === 0 || removeDatesMutation.isPending}
                  className="gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover disponibilidade
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AppLayout>
  );
};

export default Disponibilidade;
