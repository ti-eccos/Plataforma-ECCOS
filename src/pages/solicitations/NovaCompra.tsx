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
  const { currentUser: user } = useAuth();
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

  const onSubmit = async (values: FormValues) => {
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
    } catch (error) {
      toast.error('Erro ao enviar solicitação');
      console.error("Erro:", error);
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
                        min="1"
                        step="1"
                        placeholder="Ex: 5"
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(isNaN(value) ? 0 : value);
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
                    <FormLabel>Valor Unitário (R$) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Ex: 4500.00"
                        {...field}
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
                      <SelectTrigger>
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
                      placeholder="Descreva detalhadamente a necessidade desta compra, incluindo:
- Finalidade do item
- Benefícios esperados
- Impacto da não aquisição
- Alternativas consideradas"
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
                  <FormLabel>Informações Adicionais</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Links de referência, especificações técnicas, observações relevantes..."
                      className="min-h-[100px]"
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
              >
                Limpar Formulário
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90 text-white"
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