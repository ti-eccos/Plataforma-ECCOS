import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const formSchema = z.object({
  itemName: z.string().min(1, 'Nome do item é obrigatório'),
  quantity: z.coerce
    .number()
    .int({ message: 'Deve ser um número inteiro' })
    .positive('Quantidade deve ser positiva'),
  unitPrice: z.coerce
    .number()
    .positive('Valor unitário deve ser positivo'),
  urgency: z.string().min(1, 'Nível de urgência é obrigatório'),
  justification: z.string().min(10, 'Justificativa deve ter pelo menos 10 caracteres'),
  additionalInfo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const NovaCompra = () => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: '',
      quantity: undefined,
      unitPrice: undefined,
      urgency: '',
      justification: '',
      additionalInfo: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    const totalPrice = values.unitPrice * values.quantity;
    console.log('Form values:', { ...values, totalPrice });
    toast.success('Solicitação enviada com sucesso!');
    form.reset();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Nova Solicitação de Compra</h2>
          <p className="text-muted-foreground mt-1">
            Preencha o formulário abaixo para solicitar a compra de um novo equipamento ou material.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="itemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Item</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Notebook Dell Inspiron" {...field} />
                    </FormControl>
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
                      <Input
                        type="number"
                        placeholder="Ex: 5"
                        value={field.value || ''}
                        onKeyPress={(e) => {
                          if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value)) {
                            field.onChange(Math.max(1, value));
                          } else {
                            field.onChange('');
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Unitário (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Ex: 2500.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Valor Total</FormLabel>
                <FormControl>
                  <Input
                    readOnly
                    value={new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(
                      (form.watch('unitPrice') || 0) * (form.watch('quantity') || 0)
                    )}
                  />
                </FormControl>
              </FormItem>
            </div>

            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível de Urgência</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível de urgência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Baixa - Pode esperar algumas semanas</SelectItem>
                      <SelectItem value="medium">Média - Necessário nos próximos dias</SelectItem>
                      <SelectItem value="high">Alta - Necessário imediatamente</SelectItem>
                      <SelectItem value="critical">Crítica - Situação emergencial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="justification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva por que este item é necessário e como será utilizado"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Informações Adicionais (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Qualquer informação adicional relevante para a solicitação"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full md:w-auto">
              Enviar Solicitação
            </Button>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
};

export default NovaCompra;