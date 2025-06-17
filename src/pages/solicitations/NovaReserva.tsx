import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, CalendarCheck, ChevronDown, MapPin } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getAvailableDates, isDateInPast } from '@/services/availabilityService';
import { getAllEquipment } from '@/services/equipmentService';
import { addReservation, checkConflicts } from '@/services/reservationService';
import { useAuth } from '@/contexts/AuthContext';
import { sendAdminNotification } from '@/lib/email';
import { RequestData, MessageData, RequestStatus } from '@/services/types';
import UserDropdown from '@/components/UserDropdown';
import { User } from '@/services/userService';

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
  date: z.date({ required_error: "Data de reserva é obrigatória", invalid_type_error: "Formato de data inválido" }),
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
  }).min(10, "Finalidade deve ter pelo menos 10 caracteres"),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.enum(['daily', 'weekly']).optional(),
  recurrenceEndDate: z.date().optional(),
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
}).refine(data => {
  if (data.isRecurring) {
    return data.recurrencePattern && data.recurrenceEndDate;
  }
  return true;
}, {
  message: "Selecione o padrão de recorrência",
  path: ["recurrencePattern"]
}).refine(data => {
  if (data.isRecurring) {
    return data.recurrenceEndDate && data.recurrenceEndDate > data.date;
  }
  return true;
}, {
  message: "Data de término deve ser depois da data inicial",
  path: ["recurrenceEndDate"]
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

const generateRecurrenceDates = (
  startDate: Date, 
  endDate: Date, 
  pattern: 'daily' | 'weekly'
): Date[] => {
  const dates: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    dates.push(new Date(current));
    pattern === 'daily' 
      ? current.setDate(current.getDate() + 1)
      : current.setDate(current.getDate() + 7);
  }
  
  return dates;
};

const NovaReserva = () => {
  const { currentUser, isSuperAdmin, userPermissions } = useAuth();
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const canSeeUserDropdown = isSuperAdmin || userPermissions['usuarios'];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedEquipment: [],
      purpose: '',
      startTime: '',
      endTime: '',
      location: '',
      isRecurring: false,
      recurrencePattern: undefined,
      recurrenceEndDate: undefined, 
    },
  });

  // Adiciona suporte ao padrão de recorrência mensal
  const recurrenceOptions = [
    { value: 'daily', label: 'Diariamente' },
    { value: 'weekly', label: 'Semanalmente' },
    { value: 'monthly', label: 'Mensalmente' },
  ];

  // Atualiza a função para gerar datas mensais
  const generateRecurrenceDates = (
    startDate: Date, 
    endDate: Date, 
    pattern: 'daily' | 'weekly' | 'monthly'
  ): Date[] => {
    const dates: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      dates.push(new Date(current));
      if (pattern === 'daily') {
        current.setDate(current.getDate() + 1);
      } else if (pattern === 'weekly') {
        current.setDate(current.getDate() + 7);
      } else if (pattern === 'monthly') {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return dates;
  };

  const recurrencePattern = form.watch('recurrencePattern');
  const isRecurring = form.watch('isRecurring');

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
      const user = selectedUser || currentUser;
      
      const equipmentQuantities = values.selectedEquipment.reduce((acc, equipId) => {
        const equip = equipment.find(e => e.id === equipId);
        if (equip) {
          acc[equip.type] = (acc[equip.type] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Lógica para reservas recorrentes
      if (values.isRecurring && values.recurrencePattern && values.recurrenceEndDate) {
        const recurrenceDates = generateRecurrenceDates(
          values.date,
          values.recurrenceEndDate,
          values.recurrencePattern
        );

        // Verificar conflitos para todas as datas
        const allConflicts: { date: Date; conflicts: any[] }[] = [];
        
        for (const date of recurrenceDates) {
          const conflicts = await checkConflicts({
            date,
            startTime: values.startTime,
            endTime: values.endTime,
            equipmentIds: values.selectedEquipment
          });
          
          if (conflicts.length > 0) {
            allConflicts.push({ date, conflicts });
          }
        }

        if (allConflicts.length > 0) {
          toast.error(
            <div>
              <p className="font-bold">Conflitos detectados em algumas datas:</p>
              {allConflicts.map(({ date, conflicts }, idx) => (
                <div key={idx} className="mt-2">
                  <p className="font-medium">{format(date, 'dd/MM/yyyy')}:</p>
                  <ul className="mt-1 list-disc pl-4">
                    {conflicts.map((conflict, i) => (
                      <li key={i}>
                        {conflict.equipmentName}: {conflict.startTime} - {conflict.endTime}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          );
          return;
        }

        // Criar todas as reservas recorrentes
        for (const date of recurrenceDates) {
          const autoApproved = isDateAvailable(date) &&
            values.startTime >= '07:00' &&
            values.endTime <= '19:00';

          await addReservation({
            date,
            startTime: values.startTime,
            endTime: values.endTime,
            equipmentIds: values.selectedEquipment,
            location: values.location,
            purpose: values.purpose,
            equipmentQuantities,
            userName: user?.displayName || "Usuário",
            userEmail: user?.email || "email@exemplo.com",
            userId: user?.uid || "",
            status: autoApproved ? 'approved' : 'pending',
            isRecurring: values.isRecurring,
            recurrencePattern: values.recurrencePattern,
            recurrenceEndDate: values.recurrenceEndDate
          });
        }

        toast.success(`Reservas recorrentes criadas (${recurrenceDates.length} dias)`);
      } 
      // Lógica para reserva única
      else {
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
          equipmentIds: values.selectedEquipment,
          location: values.location,
          purpose: values.purpose,
          equipmentQuantities,
          userName: user?.displayName || "Usuário",
          userEmail: user?.email || "email@exemplo.com",
          userId: user?.uid || "",
          status: autoApproved ? 'approved' : 'pending',
          isRecurring: values.isRecurring,
          recurrencePattern: values.recurrencePattern,
          recurrenceEndDate: values.recurrenceEndDate
        });

        toast.success(autoApproved
          ? 'Reserva aprovada automaticamente!'
          : 'Solicitação enviada para aprovação');
      }

      form.reset();
      setSelectedUser(null);
      await sendAdminNotification('Reserva', user?.displayName || 'Usuário');
    } catch (error) {
      toast.error("Erro ao processar reserva");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearForm = () => {
    form.reset();
    setSelectedUser(null);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-white overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-sidebar blur-3xl opacity-5"></div>
          <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-eccos-purple blur-3xl opacity-5"></div>
        </div>
        <div className="relative z-10 space-y-8 p-6 md:p-12">
          <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
            <CalendarCheck className="text-eccos-purple" size={35} />
            Nova Reserva
          </h1>
          <p className="text-gray-600 mt-1">
            Preencha o formulário para reservar equipamentos
          </p>
          {canSeeUserDropdown && (
            <UserDropdown 
              onSelectUser={setSelectedUser} 
              selectedUser={selectedUser}
              onClearSelection={() => setSelectedUser(null)}
            />
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-gray-700">Data *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal rounded-xl",
                              "bg-white border border-gray-200 hover:border-gray-300",
                              "shadow-sm hover:shadow-md transition-all duration-300",
                              "text-gray-700 hover:bg-gray-50",
                              !field.value && "text-gray-400"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 text-gray-500" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[320px] h-[320px] p-0 border-gray-200 shadow-xl rounded-2xl overflow-hidden"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            isDateInPast(date) || !isDateAvailable(date)
                          }
                          modifiers={{ available: availableDates }}
                          modifiersStyles={{
                            available: { border: "2px solid #22c55e" },
                          }}
                          initialFocus
                          className="bg-white"
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
                      <FormLabel className="text-gray-700">Hora Inicial *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="07:00"
                          maxLength={5}
                          autoComplete="off"
                          className="rounded-xl border-gray-200 focus:ring-eccos-purple"
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
                      <FormLabel className="text-gray-700">Hora Final *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="19:00"
                          maxLength={5}
                          autoComplete="off"
                          className="rounded-xl border-gray-200 focus:ring-eccos-purple"
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
                    <div className="mb-4 relative">
                      <FormLabel className="text-base text-gray-700">Equipamentos *</FormLabel>
                      {(() => {
                        const chromebookCount = equipment.filter(
                          (item) => field.value.includes(item.id) && item.type === 'Chromebook'
                        ).length;
                        const iPadCount = equipment.filter(
                          (item) => field.value.includes(item.id) && item.type === 'iPad'
                        ).length;
                        if (chromebookCount > 0 || iPadCount > 0) {
                          return (
                            <div className="fixed top-1/2 right-6 -translate-y-1/2 bg-white border border-gray-200 shadow-lg rounded-lg px-5 py-3 z-50 flex flex-col gap-1 transition-all duration-300">
                              {chromebookCount > 0 && (
                                <span className="text-sm text-blue-600">Chromebooks: <strong>{chromebookCount}</strong></span>
                              )}
                              {iPadCount > 0 && (
                                <span className="text-sm text-purple-600">iPads: <strong>{iPadCount}</strong></span>
                              )}
                            </div>
                          );
                        }
                      })()}
                      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-6">
                        {equipment.map((item) => {
                          const isChecked = field.value.includes(item.id);
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                const newValue = isChecked
                                  ? field.value.filter(id => id !== item.id)
                                  : [...field.value, item.id];
                                field.onChange(newValue);
                              }}
                              className={cn(
                                "flex flex-col justify-between p-3 cursor-pointer",
                                "bg-white border border-gray-200 rounded-lg",
                                "hover:border-gray-300 hover:shadow-md transition-all",
                                isChecked && "ring-2 ring-eccos-purple bg-eccos-purple/5"
                              )}
                            >
                              <p className="font-normal text-gray-700 text-sm">{item.name}</p>
                            </div>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-gray-700">Local de Uso *</FormLabel>
                    <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-between pl-3 text-left font-normal rounded-xl",
                              "bg-white border border-gray-200 hover:border-gray-300",
                              "shadow-sm hover:shadow-md transition-all duration-300",
                              "text-gray-700 hover:bg-gray-50",
                              !field.value && "text-gray-400"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              {field.value || "Selecione um local"}
                            </div>
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-[var(--radix-popover-trigger-width)] p-0 border-gray-200 shadow-xl rounded-2xl overflow-hidden max-h-[300px]"
                        align="start"
                        sideOffset={4}
                      >
                        <div className="bg-white">
                          <div className="p-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-600 px-2 py-1">
                              Selecione um local
                            </p>
                          </div>
                          <div className="max-h-[250px] overflow-y-auto">
                            {LOCATIONS.map((location) => (
                              <button
                                key={location}
                                type="button"
                                onClick={() => {
                                  field.onChange(location);
                                  setLocationPopoverOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-4 py-3 text-sm transition-colors",
                                  "hover:bg-gray-50 focus:bg-gray-50 focus:outline-none",
                                  "border-b border-gray-50 last:border-b-0",
                                  field.value === location && "bg-eccos-purple/5 text-eccos-purple font-medium"
                                )}
                              >
                                {location}
                              </button>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Finalidade *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Descreva o propósito da reserva..."
                        autoComplete="off"
                        className="rounded-xl border-gray-200 focus:ring-eccos-purple min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Seção de Recorrência */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Reserva Recorrente</FormLabel>
                        <FormDescription>
                          Marque para repetir esta reserva periodicamente
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {isRecurring && (
                  <>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="recurrencePattern"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Frequência *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                              <FormControl>
                                <SelectTrigger className="rounded-xl border-gray-200">
                                  <SelectValue placeholder="Selecione a frequência" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="daily">Diariamente</SelectItem>
                                <SelectItem value="weekly">Semanalmente</SelectItem>
                                <SelectItem value="monthly">Mensalmente</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="recurrenceEndDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-gray-700">Data de Término *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal rounded-xl",
                                      "bg-white border border-gray-200 hover:border-gray-300",
                                      "shadow-sm hover:shadow-md transition-all duration-300",
                                      "text-gray-700 hover:bg-gray-50",
                                      !field.value && "text-gray-400"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: ptBR })
                                    ) : (
                                      <span>Selecione uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 text-gray-500" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0 border-gray-200 shadow-xl rounded-2xl"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      A reserva será repetida {recurrencePattern === 'daily' 
                        ? 'diariamente' 
                        : 'semanalmente no mesmo dia'} até a data de término.
                    </p>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleClearForm}
                  className="rounded-xl border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                  Limpar Formulário
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-xl bg-eccos-purple hover:bg-sidebar text-white px-8 py-6 text-lg font-semibold transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? 'Enviando...' 
                    : isRecurring 
                      ? 'Enviar Reservas Recorrentes' 
                      : 'Enviar Solicitação'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </AppLayout>
  );
};

export default NovaReserva;