
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getAvailableDates, isDateInPastOrToday } from '@/services/availabilityService';
import { getAllEquipment } from '@/services/equipmentService';
import { addReservation, checkConflicts } from '@/services/reservationService';

// Define the locations
const LOCATIONS = [
  'Recepção',
  'Secretaria',
  'Sala de atendimento',
  'Sala de atendimento (Laranja)',
  'Sala de auxiliar de coordenação fundamental 1',
  'Sala de oficinas',
  'Sala de música',
  'Sala de science',
  'Integral',
  '4º Ano',
  'Patio (Cantina)',
  'Refeitório',
  'Biblioteca (Inferior)',
  '3º Ano',
  '2º Ano',
  '1º Ano',
  'Sala dos professores',
  'Sala de Linguas',
  'Coordenação de linguas/Fundamental 2',
  'Sala de artes',
  'Coordenação Fundamental 1 / Coordenação de matemática',
  '8º ano',
  '7º Ano',
  'Apoio pedagógico',
  'Orientação educacional',
  'TI',
  'Sala de oficinas (Piso superior)',
  '5º Ano',
  '6º Ano',
  'Biblioteca (Superior)',
  'Sala de convivência',
  '9º Ano'
];

// Define the time options
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 7; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      options.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

// Define the form schema
const formSchema = z.object({
  date: z.date({
    required_error: "Data de reserva é obrigatória",
  }),
  startTime: z.string({
    required_error: "Hora inicial é obrigatória",
  }),
  endTime: z.string({
    required_error: "Hora final é obrigatória",
  }),
  selectedEquipment: z.array(z.string()).min(1, "Pelo menos um equipamento deve ser selecionado"),
  location: z.string({
    required_error: "Local de uso é obrigatório",
  }),
  purpose: z.string().min(10, "Finalidade deve ter pelo menos 10 caracteres"),
}).refine((data) => data.startTime < data.endTime, {
  message: "A hora final deve ser depois da hora inicial",
  path: ["endTime"],
});

type FormValues = z.infer<typeof formSchema>;

const NovaReserva = () => {
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedEquipment: [],
      purpose: '',
    },
  });

  useEffect(() => {
    // Load available dates
    const loadAvailableDates = async () => {
      try {
        const dates = await getAvailableDates();
        setAvailableDates(dates);
      } catch (error) {
        console.error("Error loading available dates:", error);
        toast.error("Erro ao carregar datas disponíveis");
      }
    };

    // Load equipment
    const loadEquipment = async () => {
      try {
        const items = await getAllEquipment();
        setEquipment(items);
      } catch (error) {
        console.error("Error loading equipment:", error);
        toast.error("Erro ao carregar equipamentos");
      }
    };

    loadAvailableDates();
    loadEquipment();
  }, []);

  // Check if a date is in the available dates
  const isDateAvailable = (date: Date) => {
    return availableDates.some(availableDate => 
      availableDate.getFullYear() === date.getFullYear() &&
      availableDate.getMonth() === date.getMonth() &&
      availableDate.getDate() === date.getDate()
    );
  };

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Check for conflicts
      const conflicts = await checkConflicts({
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        equipmentIds: values.selectedEquipment
      });

      if (conflicts.length > 0) {
        // Format the conflicts message
        const conflictMessages = conflicts.map(conflict => 
          `- ${conflict.equipmentName}: já reservado das ${conflict.startTime} às ${conflict.endTime}`
        ).join('\n');
        
        toast.error(
          <div>
            <p>Conflitos de reserva detectados:</p>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-sm max-h-40 overflow-auto">
              {conflictMessages}
            </pre>
          </div>
        );
        return;
      }

      // Add reservation
      await addReservation({
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        equipmentIds: values.selectedEquipment,
        location: values.location,
        purpose: values.purpose,
      });

      toast.success('Solicitação de reserva enviada com sucesso!');
      form.reset();
    } catch (error) {
      console.error("Error submitting reservation:", error);
      toast.error("Erro ao enviar solicitação de reserva");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Nova Reserva</h2>
          <p className="text-muted-foreground mt-1">
            Preencha o formulário abaixo para solicitar a reserva de equipamentos.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Date Selector */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          // Disable dates that are not available or in the past/today
                          return isDateInPastOrToday(date) || !isDateAvailable(date);
                        }}
                        modifiers={{
                          available: (date) => isDateAvailable(date),
                        }}
                        modifiersStyles={{
                          available: { border: "2px solid green" },
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Selection */}
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Inicial</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a hora inicial" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {TIME_OPTIONS.map(time => (
                          <SelectItem key={`start-${time}`} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Final</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a hora final" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {TIME_OPTIONS.map(time => (
                          <SelectItem key={`end-${time}`} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Equipment Selection */}
            <FormField
              control={form.control}
              name="selectedEquipment"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Equipamentos</FormLabel>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {equipment.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="selectedEquipment"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, item.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {item.name} ({item.type})
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Selection */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local de Uso</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o local de uso" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60">
                      {LOCATIONS.map(location => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Purpose */}
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Finalidade</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva para que você precisa deste equipamento"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
};

export default NovaReserva;
