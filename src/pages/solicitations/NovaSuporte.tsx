import React, { useState } from 'react';
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
  FormDescription
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
import { addSupportRequest } from '@/services/supportService';
import { useAuth } from '@/contexts/AuthContext';
import { sendAdminNotification } from '@/lib/email';
import { cn } from '@/lib/utils';
import { Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import { Timestamp } from 'firebase/firestore';
import { RequestData, MessageData, RequestStatus } from '@/services/types';
import UserDropdown from '@/components/UserDropdown';
import { User } from '@/services/userService';

const locationsByUnit = {
  'Berçário e Educação Infantil': [
    'Recepção', 'Sala de reuniões', 'Cozinha', 'Pátio', 'Sala de música',
    'Sala de science', 'Berçário 2', 'Berçário 3', 'Refeitório',
    'Sala de movimento', 'Pátio integral', 'Infantil 1', 'Infantil 2'
  ],
  'Fundamental': [
    'Recepção', 'Secretaria', 'Sala de atendimento', 'Sala de atendimento (Laranja)',
    'Sala de auxiliar de coordenação fundamental 1', 'Sala de oficinas', 'Sala de música',
    'Sala de science', 'Integral', '4º Ano', 'Patio (Cantina)', 'Refeitório',
    'Biblioteca (Inferior)', '3º Ano', '2º Ano', '1º Ano', 'Sala dos professores',
    'Sala de Linguas', 'Coordenação de linguas/Fundamental 2', 'Sala de artes',
    'Coordenação Fundamental 1 / Coordenação de matemática', '8º ano', '7º Ano',
    'Apoio pedagógico', 'Orientação educacional', 'TI', 'Sala de oficinas (Piso superior)',
    '5º Ano', '6º Ano', 'Biblioteca (Superior)', 'Sala de convivência', '9º Ano'
  ],
  'Anexo': [
    'Sala de manutenção', 'Sala de reuniões', 'Refeitório', 'Cozinha',
    'Nutrição', 'Controladoria', 'Financeiro', 'Operacional', 'Mantenedoria'
  ]
};

const formSchema = z.object({
  tipo: z.enum(["Manutenção", "Tecnologia"], {
    required_error: "Selecione o tipo de suporte"
  }),
  unit: z.string({ required_error: "Selecione a unidade" }),
  location: z.string({ required_error: "Selecione a localização" }),
  category: z.string({ required_error: "Selecione a categoria" }),
  priority: z.string({ required_error: "Selecione a prioridade" }),
  deviceInfo: z.string().optional(),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
});

type FormValues = z.infer<typeof formSchema>;

const NovaSuporte = () => {
  const { currentUser, isSuperAdmin, userPermissions } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const canSeeUserDropdown = isSuperAdmin || userPermissions['usuarios'];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unit: "",
      location: "",
      category: "",
      priority: "",
      deviceInfo: "",
      description: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const user = selectedUser || currentUser;
      
      await addSupportRequest({
        ...values,
        userName: user?.displayName || "Usuário não identificado",
        userEmail: user?.email || "email@nao.informado",
        userId: user?.uid || "",
        type: 'support',
        status: 'pending',
        createdAt: Timestamp.now(),
        hidden: false
      });
      
      toast.success('Solicitação enviada com sucesso!');
      form.reset();
      setSelectedUnit("");
      setSelectedUser(null);
      await sendAdminNotification('Suporte', user?.displayName || 'Usuário não identificado');
    } catch (error) {
      toast.error('Erro ao enviar solicitação');
      console.error("Erro detalhado:", error);
    } finally {
      setIsSubmitting(false);
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 space-y-8 p-6 md:p-12 fade-up"
        >
          <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
            <Wrench className="text-eccos-purple" size={35} />
            Nova Manutenção
          </h1>
          <p className="text-gray-600 mt-1">
            Preencha todos os campos obrigatórios (*) para registrar sua solicitação
          </p>

          {canSeeUserDropdown && (
            <UserDropdown 
              onSelectUser={setSelectedUser} 
              selectedUser={selectedUser}
              onClearSelection={() => setSelectedUser(null)}
            />
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Unidade */}
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Unidade *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedUnit(value);
                          form.resetField("location");
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-gray-200 focus:ring-eccos-purple">
                            <SelectValue placeholder="Selecione sua unidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-gray-200">
                          <SelectItem value="Berçário e Educação Infantil">
                            Berçário e Educação Infantil
                          </SelectItem>
                          <SelectItem value="Fundamental">Fundamental</SelectItem>
                          <SelectItem value="Anexo">Anexo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Localização */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Localização Exata *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedUnit}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-gray-200 focus:ring-eccos-purple">
                            <SelectValue 
                              placeholder={selectedUnit 
                                ? "Selecione o local específico" 
                                : "Selecione a unidade primeiro"}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-gray-200">
                          {selectedUnit && 
                            locationsByUnit[selectedUnit as keyof typeof locationsByUnit].map((location) => (
                              <SelectItem key={location} value={location}>
                                {location}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tipo de Suporte */}
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Tipo de Manutenção *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-gray-200 focus:ring-eccos-purple">
                            <SelectValue placeholder="Selecione o tipo de suporte" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-gray-200">
                          <SelectItem value="Manutenção">Infraestrutura</SelectItem>
                          <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Categoria */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Categoria da Manutenção *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-gray-200 focus:ring-eccos-purple">
                            <SelectValue placeholder="Selecione a categoria do problema" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-gray-200">
                          <SelectItem value="Manutenção Preventiva">Manutenção Preventiva</SelectItem>
                          <SelectItem value="Manutenção Corretiva">Manutenção Corretiva</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Prioridade */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Nível de Urgência *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-gray-200 focus:ring-eccos-purple">
                            <SelectValue placeholder="Qual a urgência do atendimento?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-gray-200">
                          <SelectItem value="low">
                            Baixa - Não interfere nas atividades
                          </SelectItem>
                          <SelectItem value="medium">
                            Média - Afeta parcialmente o trabalho
                          </SelectItem>
                          <SelectItem value="high">
                            Alta - Impede atividades importantes
                          </SelectItem>
                          <SelectItem value="critical">
                            Crítica - Paralisação total
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Identificação do Equipamento */}
                <FormField
                  control={form.control}
                  name="deviceInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Identificação do Equipamento</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Torneira da Cozinha, Notebook Cinza, etc." 
                          className="rounded-xl border-gray-200 focus:ring-eccos-purple"
                          {...field} 
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Descrição do Problema */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Descrição Completa do Problema *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva detalhadamente:&#10;- O que está acontecendo?&#10;- Quando começou o problema?&#10;- Quais mensagens de erro aparecem?&#10;- Quais tentativas de solução já foram feitas?"
                        className="rounded-xl border-gray-200 focus:ring-eccos-purple min-h-[150px]"
                        {...field}
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

             <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setSelectedUser(null);
                  }}
                  className="rounded-xl border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                  Limpar Formulário
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-xl bg-eccos-purple hover:bg-sidebar text-white px-8 py-6 text-lg font-semibold transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default NovaSuporte;