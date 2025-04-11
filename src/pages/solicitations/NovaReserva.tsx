import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getAvailableDates, isDateInPastOrToday } from '@/services/availabilityService';
import { getAllEquipment } from '@/services/equipmentService';
import { addReservation, checkConflicts } from '@/services/reservationService';

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

const formSchema = z.object({
  date: z.date({
    required_error: "Data de reserva é obrigatória",
  }),
  startTime: z.string({
    required_error: "Hora inicial é obrigatória",
  }).regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (use HH:mm)"),
  endTime: z.string({
    required_error: "Hora final é obrigatória",
  }).regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (use HH:mm)"),
  selectedEquipment: z.array(z.string()).min(1, "Pelo menos um equipamento deve ser selecionado"),
  location: z.string({
    required_error: "Local de uso é obrigatório",
  }),
  purpose: z.string().min(10, "Finalidade deve ter pelo menos 10 caracteres"),
}).refine((data) => {
  const [startHours, startMinutes] = data.startTime.split(':').map(Number);
  const [endHours, endMinutes] = data.endTime.split(':').map(Number);
  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;
  return startTotal < endTotal;
}, {
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
    const loadAvailableDates = async () => {
      try {
        const dates = await getAvailableDates();
        const validDates = dates.filter(date => 
          date instanceof Date && !isNaN(date.getTime())
        );
        setAvailableDates(validDates);
      } catch (error) {
        console.error("Error loading available dates:", error);
        toast.error("Erro ao carregar datas disponíveis");
      }
    };

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

  const isDateAvailable = (date: Date) => {
    if (!date || isNaN(date.getTime())) return false;
    return availableDates.some(availableDate => 
      availableDate.getFullYear() === date.getFullYear() &&
      availableDate.getMonth() === date.getMonth() &&
      availableDate.getDate() === date.getDate()
    );
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const conflicts = await checkConflicts({
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        equipmentIds: values.selectedEquipment
      });

      if (conflicts.length > 0) {
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
                        disabled={(date) => 
                          isDateInPastOrToday(date) || !isDateAvailable(date)
                        }
                        modifiers={{
                          available: (date) => isDateAvailable(date),
                        }}
                        modifiersStyles={{
                          available: { border: "2px solid green" },
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Inicial</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        step="900"
                        placeholder="HH:mm"
                      />
                    </FormControl>
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
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        step="900"
                        placeholder="HH:mm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                        render={({ field }) => (
                          <FormItem
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
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local de Uso</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      {...field}
                      placeholder="Digite o local de uso"
                      list="locations-list"
                    />
                  </FormControl>
                  <datalist id="locations-list">
                    {LOCATIONS.map((location) => (
                      <option key={location} value={location} />
                    ))}
                  </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <Button 
              type="submit" 
              className="w-full md:w-auto" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
};

export default NovaReserva;