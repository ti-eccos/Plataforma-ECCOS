import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import * as z from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { addSupportRequest } from '@/services/reservationService';
import { Timestamp } from 'firebase/firestore';
import { sendAdminNotification } from '@/lib/email';
import { cn } from "@/lib/utils";
import { Wrench } from 'lucide-react';

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
  tipo: z.enum(["Manutenção", "Tecnologia"], {required_error: "Selecione o tipo de suporte"}),
  unit: z.string({ required_error: "Selecione a unidade" }),
  location: z.string({ required_error: "Selecione a localização" }),
  category: z.string({ required_error: "Selecione a categoria" }),
  priority: z.string({ required_error: "Selecione a prioridade" }),
  deviceInfo: z.string().optional(),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
});

const NovaSuporte = () => {
  const { currentUser: user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("");
  
  const form = useForm<z.infer<typeof formSchema>>({
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      const payload = {
        ...values,
        userName: user?.displayName || "Usuário não identificado",
        userEmail: user?.email || "email@nao.informado",
        status: 'pending',
        type: 'support',
        createdAt: Timestamp.now(),
        hidden: false
      };

      await addSupportRequest(payload);
      toast.success('Solicitação enviada com sucesso!');
      form.reset();
      setSelectedUnit("");
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
            Novo Suporte
          </h1>
          <p className="text-gray-600 mt-1">
            Preencha todos os campos obrigatórios (*) para registrar sua solicitação
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Tipo de Suporte *</FormLabel>
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
                          <SelectItem value="Manutenção">Manutenção</SelectItem>
                          <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Tipo de Problema *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-gray-200 focus:ring-eccos-purple">
                            <SelectValue placeholder="Selecione a categoria do problema" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-gray-200">
                          <SelectItem value="Internet">Problemas de Internet</SelectItem>
                          <SelectItem value="Hardware">Defeito em Equipamento</SelectItem>
                          <SelectItem value="Software">Erro de Sistema</SelectItem>
                          <SelectItem value="Projeção">Problemas de Projeção</SelectItem>
                          <SelectItem value="Áudio">Falhas de Áudio</SelectItem>
                          <SelectItem value="Outros">Outros Problemas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name="deviceInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Identificação do Equipamento</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Notebook Dell Latitude 3420, Mouse bluetooth" 
                          className="rounded-xl border-gray-200 focus:ring-eccos-purple"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-gray-500">
                        Forneça modelo ou identificação completa
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Descrição Completa do Problema *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva detalhadamente: 
- O que está acontecendo?
- Quando começou o problema?
- Quais mensagens de erro aparecem?
- Quais tentativas de solução já foram feitas?"
                        className="rounded-xl border-gray-200 focus:ring-eccos-purple min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 border-t pt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setSelectedUnit("");
                  }}
                  className="rounded-xl border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                  Limpar Campos
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="rounded-xl bg-eccos-purple hover:bg-sidebar text-white px-8 py-6 text-lg font-semibold transition-all"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Enviando...
                    </span>
                  ) : "Enviar Solicitação"}
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