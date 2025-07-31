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
import { addPurchaseRequest } from '@/services/purchaseService';
import { useAuth } from '@/contexts/AuthContext';
import { sendAdminNotification } from '@/lib/email';
import { cn } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import { RequestData, MessageData, RequestStatus } from '@/services/types';
import { getAllRequests, addMessageToRequest, uploadFile } from '@/services/sharedService'

const formSchema = z.object({
  tipo: z.enum(["Tecnologia", "Infraestrutura", "Pedagógico", "Administrativo"], {
    required_error: "Selecione o tipo de compra"
  }),
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
      quantity: 0,
      unitPrice: 0,
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
      await sendAdminNotification('Compra', user?.displayName || 'Usuário não identificado');
    } catch (error) {
      console.error('[Solicitação] Erro completo:', error);
      toast.error('Erro ao enviar solicitação');
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-white overflow-hidden relative">
        {/* Fundos decorativos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-sidebar blur-3xl opacity-5"></div>
          <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-eccos-purple blur-3xl opacity-5"></div>
        </div>

        {/* Conteúdo principal */}
        <div className="relative z-10 space-y-8 p-6 md:p-12 fade-up">
          <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
            <ShoppingCart className="text-eccos-purple" size={35} />
            Nova Compra
          </h1>
          <p className="text-gray-600 mt-1">
            Preencha todos os campos obrigatórios para solicitar novos equipamentos ou materiais
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Nome do Item + Tipo de Compra */}
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="itemName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Nome do Item *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Notebook Dell Latitude 5440" 
                          className="rounded-xl border-gray-200 focus:ring-eccos-purple"
                          {...field}
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Tipo de Compra *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-gray-200 focus:ring-eccos-purple">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-gray-200">
                          <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                          <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                          <SelectItem value="Pedagógico">Pedagógico</SelectItem>
                          <SelectItem value="Administrativo">Administrativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Quantidade + Valor Unitário */}
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Quantidade *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="rounded-xl border-gray-200 focus:ring-eccos-purple"
                          placeholder="Ex: 5"
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Valor Unitário (R$) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="rounded-xl border-gray-200 focus:ring-eccos-purple"
                          placeholder="Ex: 100.00"
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Valor Total Estimado + Urgência */}
              <div className="grid gap-6 md:grid-cols-2">
                <FormItem>
                  <FormLabel className="text-gray-700">Valor Total Estimado</FormLabel>
                  <FormControl>
                    <Input
                      readOnly
                      className="rounded-xl border-gray-200 bg-gray-50"
                      value={new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(
                        (form.watch('unitPrice') || 0) * (form.watch('quantity') || 0)
                      )}
                    />
                  </FormControl>
                </FormItem>

                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Nível de Urgência *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-gray-200 focus:ring-eccos-purple">
                            <SelectValue placeholder="Selecione a urgência" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-gray-200">
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
              </div>

              {/* Justificativa */}
              <FormField
                control={form.control}
                name="justification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Justificativa *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva detalhadamente a necessidade desta compra..."
                        className="rounded-xl border-gray-200 focus:ring-eccos-purple min-h-[120px]"
                        {...field}
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Informações Adicionais */}
              <FormField
                control={form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Informações Adicionais</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Links de referência, especificações técnicas..."
                        className="rounded-xl border-gray-200 focus:ring-eccos-purple min-h-[100px]"
                        {...field}
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Botões de Ação */}
              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => form.reset()}
                  className="rounded-xl border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                  Limpar Formulário
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-xl bg-eccos-purple hover:bg-sidebar text-white px-8 py-6 text-lg font-semibold transition-all"
                >
                  Enviar Solicitação
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </AppLayout>
  );
};

export default NovaCompra;