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
import { addPurchaseRequest } from '@/services/reservationService';
import { useAuth } from '@/contexts/AuthContext';
import { sendAdminNotification } from '@/lib/email';
import { cn } from '@/lib/utils';

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

const inputStyle = cn(
  "shadow-[rgba(0,0,0,0.10)_2px_2px_3px_0px] hover:shadow-[rgba(0,0,0,0.12)_4px_4px_5px_0px",
  "transition-all duration-300 relative border-0 border-l-4 border-blue-500 pl-8",
  "before:content-[''] before:absolute before:left-0 before:top-0",
  "before:w-[2px] before:h-full before:bg-gradient-to-b",
  "before:from-transparent before:via-white/10 before:to-transparent before:opacity-30",
  "hover:bg-accent/20 bg-background"
);

const selectTriggerStyle = cn(
  "shadow-[rgba(0,0,0,0.10)_2px_2px_3px_0px] hover:shadow-[rgba(0,0,0,0.12)_4px_4px_5px_0px",
  "transition-all duration-300 relative border-0 border-l-4 border-blue-500",
  "before:content-[''] before:absolute before:left-0 before:top-0",
  "before:w-[2px] before:h-full before:bg-gradient-to-b",
  "before:from-transparent before:via-white/10 before:to-transparent before:opacity-30",
  "hover:bg-accent/20 bg-background"
);

const buttonPrimaryStyle = cn(
  "shadow-[rgba(0,0,0,0.10)_2px_2px_3px_0px] hover:shadow-[rgba(0,0,0,0.12)_4px_4px_5px_0px",
  "transition-all duration-300 relative",
  "bg-blue-500 hover:bg-blue-600 text-white",
  "hover:scale-[1.02]"
);

const NovaCompra = () => {
  const { currentUser: user } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: '',
      quantity: 0,
      unitPrice: 0,
      urgency: '',
      justification: '',
      additionalInfo: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await addPurchaseRequest({
        ...values,
        userName: user?.displayName || "Usuário não identificado",
        userEmail: user?.email || "email@nao.informado",
        type: 'purchase',
        status: 'pending',
        createdAt: new Date(),
        hidden: false
      });
      
      toast.success('Solicitação de compra enviada com sucesso!');
      form.reset();
      await sendAdminNotification('Compra', user?.displayName || 'Usuário não identificado');
    } catch (error) {
      console.error('[Solicitação] Erro completo:', error);
      toast.error('Erro ao enviar solicitação');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Nova Solicitação de Compra</h2>
          <p className="text-muted-foreground mt-1">
            Preencha todos os campos obrigatórios para solicitar novos equipamentos ou materiais
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
                    <FormLabel>Nome do Item *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Notebook Dell Latitude 5440" 
                        className={inputStyle}
                        {...field} 
                      />
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
                    <FormLabel>Quantidade *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className={inputStyle}
                        placeholder="Ex: 5"
                        value={field.value === 0 ? '' : field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                    <FormLabel>Valor Unitário (R$) *</FormLabel>
                    <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className={inputStyle}
                      placeholder="Ex: 100.00"
                      value={field.value === 0 ? '' : field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Valor Total Estimado</FormLabel>
                <FormControl>
                  <Input
                    readOnly
                    className={inputStyle}
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
                  <FormLabel>Nível de Urgência *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className={selectTriggerStyle}>
                        <SelectValue placeholder="Selecione a urgência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Baixa (30+ dias)</SelectItem>
                      <SelectItem value="medium">Média (15 dias)</SelectItem>
                      <SelectItem value="high">Alta (7 dias)</SelectItem>
                      <SelectItem value="critical">Crítica (Imediata)</SelectItem>
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
                  <FormLabel>Justificativa *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva detalhadamente a necessidade desta compra..."
                      className={cn(inputStyle, "min-h-[120px]")}
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
                  <FormLabel>Informações Adicionais</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Links de referência, especificações técnicas..."
                      className={cn(inputStyle, "min-h-[100px]")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => form.reset()}
                className="shadow-[rgba(0,0,0,0.10)_2px_2px_3px_0px hover:shadow-[rgba(0,0,0,0.12)_4px_4px_5px_0px"
              >
                Limpar Formulário
              </Button>
              <Button 
                type="submit" 
                className={buttonPrimaryStyle}
              >
                Enviar Solicitação
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
};

export default NovaCompra;