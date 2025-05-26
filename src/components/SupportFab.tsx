// src/components/SupportFab.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Download, CircleHelp, Bug, BookOpen } from 'lucide-react';
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface Manual {
  name: string;
  url: string;
}

const SupportFab = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("manuals");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [manuais, setManuais] = useState<Manual[]>([]);
  const [loadingManuais, setLoadingManuais] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const fetchManuais = async () => {
    setLoadingManuais(true);
    const storageRef = ref(storage, 'manuais/');
    try {
      const listResult = await listAll(storageRef);
      const files = await Promise.all(
        listResult.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return { name: item.name, url };
        })
      );
      setManuais(files);
    } catch (error) {
      console.error("Erro ao carregar manuais:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os manuais.",
        variant: "destructive",
      });
    } finally {
      setLoadingManuais(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && activeTab === "manuals") {
      fetchManuais();
    }
  };

  const handleSubmitBugReport = async () => {
    if (!title || !description) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "bugReports"), {
        title,
        description,
        createdAt: new Date(),
        status: "open",
        userEmail: currentUser?.email || "Anônimo",
        pageUrl: window.location.href
      });
      toast({
        title: "Sucesso!",
        description: "Bug reportado com sucesso. Obrigado!",
      });
      setTitle("");
      setDescription("");
      setActiveTab("manuals");
    } catch (error) {
      console.error("Erro ao reportar bug:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar o relatório de bug.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button 
            variant="default" 
            size="icon"
            className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-sidebar to-eccos-purple hover:from-eccos-purple hover:to-sidebar group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CircleHelp className="h-12 w-12 relative z-10" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-gray-100 shadow-2xl rounded-2xl">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-sidebar blur-3xl opacity-5"></div>
            <div className="absolute right-1/4 bottom-1/4 h-24 w-24 rounded-full bg-eccos-purple blur-3xl opacity-5"></div>
          </div>
          
          <DialogHeader className="relative z-10">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-eccos-purple/10 text-eccos-purple">
                <CircleHelp className="h-5 w-5" />
              </div>
              Central de Suporte
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative z-10 mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-50 rounded-xl p-1">
                <TabsTrigger 
                  value="manuals" 
                  className="rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-eccos-purple font-medium"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manuais e Tutoriais
                </TabsTrigger>
                <TabsTrigger 
                  value="bugReport"
                  className="rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-eccos-purple font-medium"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Reportar Bug
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="manuals" className="mt-6">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-6">
                  <h3 className="font-bold text-xl mb-6 flex items-center gap-3 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-eccos-purple/10 text-eccos-purple">
                      <FileText className="h-4 w-4" />
                    </div>
                    Documentação e Tutoriais
                  </h3>
                  
                  {loadingManuais ? (
                    <div className="flex flex-col justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-eccos-purple mb-4"></div>
                      <p className="text-gray-500 font-medium">Carregando manuais...</p>
                    </div>
                  ) : manuais.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                        <FileText className="h-8 w-8" />
                      </div>
                      <p className="text-gray-500 font-medium text-lg">Nenhum manual disponível</p>
                      <p className="text-gray-400 text-sm mt-1">Os manuais serão exibidos aqui quando estiverem disponíveis</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {manuais.map((manual, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-md hover:border-eccos-purple/30 transition-all duration-300 group bg-white"
                        >
                          <div className="flex items-center gap-3">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-eccos-purple/10 text-eccos-purple group-hover:bg-eccos-purple/20 transition-colors">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 truncate max-w-[300px] block">
                                {manual.name}
                              </span>
                              <span className="text-sm text-gray-500">Documento PDF</span>
                            </div>
                          </div>
                          <a 
                            href={manual.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-eccos-purple hover:text-sidebar transition-colors"
                          >
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-eccos-purple text-eccos-purple hover:bg-eccos-purple hover:text-white transition-all duration-200"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Baixar
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="bugReport" className="mt-6">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-6">
                  <h3 className="font-bold text-xl mb-6 flex items-center gap-3 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600">
                      <Bug className="h-4 w-4" />
                    </div>
                    Reportar Problema
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="title" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Título do Problema *
                      </Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Descreva brevemente o problema"
                        className="border-gray-200 focus:border-eccos-purple focus:ring-eccos-purple/20 rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Descrição Detalhada *
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva o que aconteceu, incluindo os passos para reproduzir o problema..."
                        rows={5}
                        className="border-gray-200 focus:border-eccos-purple focus:ring-eccos-purple/20 rounded-lg resize-none"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Inclua detalhes como: O que você estava tentando fazer? O que aconteceu? O que você esperava que acontecesse?
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-3 mb-3">
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600">
                          <Bug className="h-3 w-3" />
                        </div>
                        Informações do Sistema
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 font-medium">URL:</span>
                          <span className="text-gray-800 font-mono text-xs bg-white px-2 py-1 rounded border truncate max-w-xs">
                            {window.location.href}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 font-medium">Usuário:</span>
                          <span className="text-gray-800 font-mono text-xs bg-white px-2 py-1 rounded border">
                            {currentUser?.email || "Anônimo"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleSubmitBugReport}
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-sidebar to-eccos-purple hover:from-eccos-purple hover:to-sidebar text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Enviando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Bug className="h-4 w-4" />
                          Enviar Relatório
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportFab;