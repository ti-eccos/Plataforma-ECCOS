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
     <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="bg-white space-y-6" // Removido padding extra e arredondamento
>
       <div className="space-y-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
           <Wrench className="text-black" size={35} /> {/* Ícone adicionado */}
          Nova Suporte
        </h1>
    <p className="text-muted-foreground mt-1">
      Preencha todos os campos obrigatórios (*) para registrar sua solicitação
    </p>
  </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedUnit(value);
                        form.resetField("location");
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className={selectTriggerStyle}>
                          <SelectValue placeholder="Selecione sua unidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
      <FormLabel>Tipo de Suporte *</FormLabel>
      <Select
        onValueChange={field.onChange}
        defaultValue={field.value}
      >
        <FormControl>
          <SelectTrigger className={selectTriggerStyle}>
            <SelectValue placeholder="Selecione o tipo de suporte" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
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
                    <FormLabel>Localização Exata *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedUnit}
                    >
                      <FormControl>
                        <SelectTrigger className={selectTriggerStyle}>
                          <SelectValue 
                            placeholder={selectedUnit 
                              ? "Selecione o local específico" 
                              : "Selecione a unidade primeiro"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormLabel>Tipo de Problema *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={selectTriggerStyle}>
                          <SelectValue placeholder="Selecione a categoria do problema" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormLabel>Nível de Urgência *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={selectTriggerStyle}>
                          <SelectValue placeholder="Qual a urgência do atendimento?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormLabel>Identificação do Equipamento</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Notebook Dell Latitude 3420, Mouse bluetooth" 
                        className={inputStyle}
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
                  <FormLabel>Descrição Completa do Problema *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva detalhadamente: 
- O que está acontecendo?
- Quando começou o problema?
- Quais mensagens de erro aparecem?
- Quais tentativas de solução já foram feitas?"
                      className={cn(inputStyle, "min-h-[150px]")}
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
                variant="ghost"
                onClick={() => {
                  form.reset();
                  setSelectedUnit("");
                }}
                className="text-gray-600 hover:bg-gray-50"
              >
                Limpar Campos
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className={buttonPrimaryStyle}
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
    </AppLayout>
  );
};

export default NovaSuporte;