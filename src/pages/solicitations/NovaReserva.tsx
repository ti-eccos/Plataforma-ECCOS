import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { useAuth } from '@/contexts/AuthContext';
import { sendAdminNotification } from '@/lib/email';

const LOCATIONS = [
  'Recepção', 'Secretaria', 'Sala de atendimento', 
  'Sala de atendimento (Laranja)', 'Sala de auxiliar de coordenação fundamental 1',
  'Sala de oficinas', 'Sala de música', 'Sala de science', 'Integral', '4º Ano',
  'Patio (Cantina)', 'Refeitório', 'Biblioteca (Inferior)', '3º Ano', '2º Ano',
  '1º Ano', 'Sala dos professores', 'Sala de Linguas', 
  'Coordenação de linguas/Fundamental 2', 'Sala de artes',
  'Coordenação Fundamental 1 / Coordenação de matemática', '8º ano', '7º Ano',
  'Apoio pedagógico', 'Orientação educacional', 'TI', 
  'Sala de oficinas (Piso superior)', '5º Ano', '6º Ano',
  'Biblioteca (Superior)', 'Sala de convivência', '9º Ano'
];

const formSchema = z.object({
  date: z.date({
    required_error: "Data de reserva é obrigatória",
    invalid_type_error: "Formato de data inválido"
  }),
  startTime: z.string({ required_error: "Hora inicial é obrigatória" })
    .regex(/^(0[7-9]|1[0-9]):[0-5]\d$/, "Horário deve ser entre 07:00 e 19:00"),
  endTime: z.string({ required_error: "Hora final é obrigatória" })
    .regex(/^(0[7-9]|1[0-9]):[0-5]\d$/, "Horário deve ser entre 07:00 e 19:00"),
  selectedEquipment: z.array(z.string(), {
    required_error: "Selecione pelo menos um equipamento",
    invalid_type_error: "Selecione equipamentos válidos"
  }).min(1, "Pelo menos um equipamento deve ser selecionado"),
  location: z.string({ 
    required_error: "Local de uso é obrigatório",
    invalid_type_error: "Selecione um local válido"
  }).min(1, "Local não pode estar vazio"),
  purpose: z.string({
    required_error: "Finalidade é obrigatória",
    invalid_type_error: "Insira uma descrição válida"
  }).min(10, "Finalidade deve ter pelo menos 10 caracteres")
}).refine(data => {
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  return startH * 60 + startM < endH * 60 + endM;
}, {
  message: "A hora final deve ser depois da hora inicial",
  path: ["endTime"]
}).refine(data => {
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  return (startH >= 7 && startH < 19) && (endH > 7 && endH <= 19);
}, {
  message: "O horário deve estar entre 07:00 e 19:00",
  path: ["endTime"]
});

type FormValues = z.infer<typeof formSchema>;

const autoCompleteTime = (value: string) => {
  const digits = value.replace(/\D/g, '');
  let formatted = '';
  
  if (digits.length >= 1) formatted += digits.substring(0, 2);
  if (digits.length >= 3) formatted += ':' + digits.substring(2, 4);
  if (digits.length === 2 && value.length === 2) formatted += ':';
  
  return formatted.substring(0, 5);
};

const NovaReserva = () => {
  const { currentUser } = useAuth();
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedEquipment: [],
      purpose: '',
      startTime: '',
      endTime: '',
      location: '',
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dates, equipment] = await Promise.all([
          getAvailableDates(),
          getAllEquipment()
        ]);
        
        setAvailableDates(dates.filter(date => 
          date instanceof Date && !isNaN(date.getTime())
        ));
        setEquipment(equipment.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        toast.error("Erro ao carregar dados iniciais");
      }
    };
    loadData();
  }, []);

  const isDateAvailable = (date: Date) => {
    return availableDates.some(availableDate => 
      availableDate.toDateString() === date.toDateString()
    );
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const equipmentQuantities = values.selectedEquipment.reduce((acc, equipId) => {
        const equip = equipment.find(e => e.id === equipId);
        if (equip) {
          acc[equip.type] = (acc[equip.type] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const conflicts = await checkConflicts({
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        equipmentIds: values.selectedEquipment
      });

      if (conflicts.length > 0) {
        toast.error(
          <div>
            <p>Conflitos detectados:</p>
            <ul className="mt-2 list-disc pl-4">
              {conflicts.map((conflict, i) => (
                <li key={i}>
                  {conflict.equipmentName}: {conflict.startTime} - {conflict.endTime}
                </li>
              ))}
            </ul>
          </div>
        );
        return;
      }

      const autoApproved = isDateAvailable(values.date) && 
        values.startTime >= '07:00' && 
        values.endTime <= '19:00';

        await addReservation({
          date: values.date,
          startTime: values.startTime,
          endTime: values.endTime,
          location: values.location,
          purpose: values.purpose,
          equipmentIds: values.selectedEquipment,
          equipmentQuantities,
          userName: currentUser?.displayName || "Usuário",
          userEmail: currentUser?.email || "email@exemplo.com",
          userId: currentUser?.uid || "",
          status: autoApproved ? 'approved' : 'pending'
        });

       toast.success(autoApproved 
      ? 'Reserva aprovada automaticamente!' 
      : 'Solicitação enviada para aprovação');
    form.reset();

    await sendAdminNotification('Reserva', currentUser?.displayName || 'Usuário');
  } catch (error) {
    toast.error("Erro ao processar reserva");
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Nova Reserva</h2>
          <p className="text-foreground mt-1">
            Preencha o formulário para reservar equipamentos
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-foreground"
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
                        modifiers={{ available: availableDates }}
                        modifiersStyles={{
                          available: { border: "2px solid #22c55e" },
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
                    <FormLabel>Hora Inicial *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="07:00"
                        maxLength={5}
                        onChange={(e) => {
                          field.onChange(autoCompleteTime(e.target.value));
                        }}
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
                    <FormLabel>Hora Final *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="19:00"
                        maxLength={5}
                        onChange={(e) => {
                          field.onChange(autoCompleteTime(e.target.value));
                        }}
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
              render={({ field }) => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Equipamentos *</FormLabel>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {equipment.map((item) => (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value.includes(item.id)}
                            onCheckedChange={(checked) => {
                              const newValue = checked
                                ? [...field.value, item.id]
                                : field.value.filter(id => id !== item.id);
                              field.onChange(newValue);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {item.name} ({item.type})
                        </FormLabel>
                      </FormItem>
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
                  <FormLabel>Local de Uso *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Selecione o local"
                      list="locations-list"
                    />
                  </FormControl>
                  <datalist id="locations-list">
                    {LOCATIONS.map(location => (
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
                  <FormLabel>Finalidade *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descreva o propósito da reserva..."
                      className="min-h-[120px]"
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
              {isSubmitting ? "Enviando..." : "Solicitar Reserva"}
            </Button>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
};

export default NovaReserva;