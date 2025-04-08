
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import * as z from "zod";
import { motion } from "framer-motion";

const formSchema = z.object({
  problemType: z.string({
    required_error: "Selecione o tipo de problema",
  }),
  location: z.string().min(3, {
    message: "Informe a localização com pelo menos 3 caracteres",
  }),
  deviceInfo: z.string().min(3, {
    message: "Descreva o dispositivo com pelo menos 3 caracteres",
  }),
  priority: z.string({
    required_error: "Selecione a prioridade",
  }),
  description: z.string().min(10, {
    message: "A descrição deve ter pelo menos 10 caracteres",
  }),
});

const NovaSuporte = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      problemType: "",
      location: "",
      deviceInfo: "",
      priority: "",
      description: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log(values);
      toast({
        title: "Solicitação enviada!",
        description: `Sua solicitação de suporte foi registrada com sucesso. Um técnico irá atendê-la em breve.`,
      });
      form.reset();
      setIsSubmitting(false);
    }, 1500);
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
            <h2 className="text-3xl font-bold tracking-tight text-gradient">Novo Suporte Técnico</h2>
            <p className="text-muted-foreground mt-2">
              Preencha o formulário abaixo para solicitar suporte técnico.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Suporte</CardTitle>
              <CardDescription>
                Descreva o problema para que nossa equipe possa ajudar você da melhor forma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="problemType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Problema</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de problema" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="hardware">Problema de Hardware</SelectItem>
                              <SelectItem value="software">Problema de Software</SelectItem>
                              <SelectItem value="network">Problema de Rede/Internet</SelectItem>
                              <SelectItem value="printer">Problema de Impressora</SelectItem>
                              <SelectItem value="projector">Problema de Projetor</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Categoria do problema encontrado.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a prioridade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Baixa - Não é urgente</SelectItem>
                              <SelectItem value="medium">Média - Importante, mas pode esperar</SelectItem>
                              <SelectItem value="high">Alta - Urgente, afeta o trabalho</SelectItem>
                              <SelectItem value="critical">Crítica - Impede completamente o trabalho</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Nível de urgência para resolução do problema.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Localização</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Sala 101, Laboratório de Informática" {...field} />
                          </FormControl>
                          <FormDescription>
                            Local onde o problema está ocorrendo.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deviceInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Informações do Dispositivo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Notebook Dell, Série X123" {...field} />
                          </FormControl>
                          <FormDescription>
                            Marca, modelo ou informações do equipamento com problema.
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
                        <FormLabel>Descrição Detalhada</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva o problema em detalhes. O que acontece? Quando começou? Tentou alguma solução?" 
                            className="min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Forneça o máximo de detalhes possível sobre o problema.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-eccos-green to-eccos-blue hover:from-eccos-green/90 hover:to-eccos-blue/90">
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

export default NovaSuporte;
