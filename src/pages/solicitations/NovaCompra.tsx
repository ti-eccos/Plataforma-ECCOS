
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
  itemName: z.string().min(3, {
    message: "O nome do item deve ter pelo menos 3 caracteres",
  }),
  itemType: z.string({
    required_error: "Selecione o tipo de item",
  }),
  quantity: z.string().transform(val => parseInt(val, 10)),
  estimatedPrice: z.string().optional(),
  urgency: z.string({
    required_error: "Selecione o nível de urgência",
  }),
  justification: z.string().min(10, {
    message: "A justificativa deve ter pelo menos 10 caracteres",
  }),
  additionalInfo: z.string().optional(),
});

// Define the correct output type to include transformed values
type FormValues = Omit<z.infer<typeof formSchema>, 'quantity'> & {
  quantity: number;
};

const NovaCompra = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: "",
      itemType: "",
      quantity: "1",
      estimatedPrice: "",
      urgency: "",
      justification: "",
      additionalInfo: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    // The values.quantity is now correctly transformed to a number thanks to the schema
    const formValues: FormValues = values;
    
    // Simulate API call
    setTimeout(() => {
      console.log(formValues);
      toast({
        title: "Solicitação enviada!",
        description: `Sua solicitação de compra para ${formValues.quantity}x ${formValues.itemName} foi enviada com sucesso.`,
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
            <h2 className="text-3xl font-bold tracking-tight text-gradient">Nova Compra</h2>
            <p className="text-muted-foreground mt-2">
              Preencha o formulário abaixo para solicitar a compra de equipamentos ou materiais.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Compra</CardTitle>
              <CardDescription>
                Informe os detalhes do item que você deseja solicitar a compra.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="itemName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Item</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Nome ou modelo do item desejado.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="itemType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Item</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="hardware">Hardware</SelectItem>
                              <SelectItem value="software">Software</SelectItem>
                              <SelectItem value="peripheral">Periférico</SelectItem>
                              <SelectItem value="network">Equipamento de Rede</SelectItem>
                              <SelectItem value="accessory">Acessório</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Categoria do item solicitado.
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
                            Quantidade de itens necessários.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimatedPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Estimado (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormDescription>
                            Se souber, informe o preço aproximado (opcional).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="urgency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Urgência</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a urgência" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Baixa</SelectItem>
                              <SelectItem value="medium">Média</SelectItem>
                              <SelectItem value="high">Alta</SelectItem>
                              <SelectItem value="critical">Crítica</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Nível de urgência da solicitação.
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
                          <Textarea 
                            placeholder="Explique por que este item é necessário..." 
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Explique a necessidade e como este item será utilizado.
                        </FormDescription>
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
                            placeholder="Links para produtos, especificações técnicas ou outras informações relevantes..." 
                            className="min-h-[80px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Links para produtos, especificações ou outras informações relevantes.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-eccos-orange to-eccos-yellow hover:from-eccos-orange/90 hover:to-eccos-yellow/90">
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

export default NovaCompra;
