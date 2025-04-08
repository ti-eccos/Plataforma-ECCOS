
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const formSchema = z.object({
  equipmentType: z.string({
    required_error: "Selecione o tipo de equipamento",
  }),
  quantity: z.string().transform(val => parseInt(val, 10)),
  date: z.date({
    required_error: "Selecione a data de uso",
  }),
  period: z.string({
    required_error: "Selecione o período",
  }),
  justification: z.string().min(10, {
    message: "A justificativa deve ter pelo menos 10 caracteres",
  }),
});

const NovaReserva = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [equipmentOptions, setEquipmentOptions] = useState([
    { value: "laptops", label: "Notebooks" },
    { value: "projectors", label: "Projetores" },
    { value: "tablets", label: "Tablets" },
    { value: "microphones", label: "Microfones" },
    { value: "speakers", label: "Caixas de Som" },
  ]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      equipmentType: "",
      quantity: "1",
      justification: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log(values);
      toast({
        title: "Solicitação enviada!",
        description: `Sua reserva de ${values.quantity} ${getEquipmentLabel(values.equipmentType)} foi solicitada com sucesso.`,
      });
      form.reset();
      setIsSubmitting(false);
    }, 1500);
  }

  function getEquipmentLabel(value: string): string {
    const equipment = equipmentOptions.find(opt => opt.value === value);
    return equipment ? equipment.label : value;
  }

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gradient">Nova Reserva</h2>
            <p className="text-muted-foreground mt-2">
              Preencha o formulário abaixo para solicitar a reserva de equipamentos.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Reserva</CardTitle>
              <CardDescription>
                Informe os equipamentos e o período de uso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="equipmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Equipamento</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o equipamento" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {equipmentOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Selecione o tipo de equipamento que deseja reservar.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormDescription>
                            Quantidade de equipamentos necessários.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Uso</FormLabel>
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
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Data em que o equipamento será utilizado.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="period"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Período</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o período" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="morning">Manhã (7h às 12h)</SelectItem>
                              <SelectItem value="afternoon">Tarde (13h às 18h)</SelectItem>
                              <SelectItem value="night">Noite (19h às 22h)</SelectItem>
                              <SelectItem value="fullday">Dia inteiro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Período em que o equipamento será utilizado.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="justification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Justificativa</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Explique brevemente o motivo da solicitação.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-eccos-blue to-eccos-green hover:from-eccos-blue/90 hover:to-eccos-green/90">
                    {isSubmitting ? "Enviando..." : "Enviar Solicitação"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default NovaReserva;
