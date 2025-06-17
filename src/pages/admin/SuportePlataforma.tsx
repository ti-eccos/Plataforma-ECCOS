// src/pages/admin/SuportePlataforma.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  useToast
} from "@/hooks/use-toast";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, listAll, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { FileText, Download, XCircle, CheckCircle2, Bug, Upload, Headphones } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from "@/components/AppLayout";
import { Trash2 } from 'lucide-react';

interface BugReport {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  status: 'open' | 'resolved';
  userEmail: string;
  pageUrl: string;
}

const SuportePlataforma = () => {
  const { toast } = useToast();
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [manuais, setManuais] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'bugs' | 'manuais'>('bugs');
  const [resolvedReports, setResolvedReports] = useState<BugReport[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar relatórios de bugs
  useEffect(() => {
    const fetchBugReports = async () => {
      try {
        const openQuery = query(
          collection(db, "bugReports"),
          where("status", "==", "open")
        );
        const resolvedQuery = query(
          collection(db, "bugReports"),
          where("status", "==", "resolved")
        );
        
        const [openSnapshot, resolvedSnapshot] = await Promise.all([
          getDocs(openQuery),
          getDocs(resolvedQuery)
        ]);
        
        const openReports: BugReport[] = [];
        const resolvedReports: BugReport[] = [];
        
        openSnapshot.forEach((doc) => {
          const data = doc.data();
          openReports.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            createdAt: data.createdAt.toDate(),
            status: data.status,
            userEmail: data.userEmail,
            pageUrl: data.pageUrl
          });
        });
        
        resolvedSnapshot.forEach((doc) => {
          const data = doc.data();
          resolvedReports.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            createdAt: data.createdAt.toDate(),
            status: data.status,
            userEmail: data.userEmail,
            pageUrl: data.pageUrl
          });
        });
        
        // Ordenar por data (mais recente primeiro)
        setBugReports(openReports.sort((a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime()
        ));
        setResolvedReports(resolvedReports.sort((a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime()
        ));
        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar relatórios de bugs:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os relatórios de bugs.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };
    fetchBugReports();
  }, [toast]);

  // Carregar manuais existentes
  useEffect(() => {
    const fetchManuais = async () => {
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
      }
    };
    fetchManuais();
  }, [toast]);

  // Animação de entrada (fade-up)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Apenas arquivos PDF são permitidos.",
          variant: "destructive",
        });
      }
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo.",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      // Verificar se o arquivo é PDF
      if (file.type !== 'application/pdf') {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Apenas arquivos PDF são permitidos.",
          variant: "destructive",
        });
        return;
      }
      const storageRef = ref(storage, `manuais/${file.name}`);
      await uploadBytes(storageRef, file);
      toast({
        title: "Sucesso!",
        description: "Arquivo enviado com sucesso.",
      });
      // Atualizar a lista de manuais
      const url = await getDownloadURL(storageRef);
      setManuais([...manuais, { name: file.name, url }]);
      setFile(null);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteManual = async (name: string) => {
    try {
      const storageRef = ref(storage, `manuais/${name}`);
      await deleteObject(storageRef);
      toast({
        title: "Sucesso",
        description: "Manual removido com sucesso.",
      });
      setManuais(manuais.filter(m => m.name !== name));
    } catch (error) {
      console.error("Erro ao excluir manual:", error);
      toast({
        title: "Erro",
        description: "Falha ao remover o manual.",
        variant: "destructive",
      });
    }
  };

  const handleResolveBug = async (id: string) => {
    try {
      const bugRef = doc(db, "bugReports", id);
      await updateDoc(bugRef, {
        status: "resolved",
        resolvedAt: new Date()
      });
      toast({
        title: "Bug resolvido",
        description: "O problema foi marcado como resolvido.",
      });
      
      // Mover bug para lista de resolvidos
      const resolvedBug = bugReports.find(report => report.id === id);
      if (resolvedBug) {
        setResolvedReports([resolvedBug, ...resolvedReports]);
        setBugReports(bugReports.filter(report => report.id !== id));
      }
    } catch (error) {
      console.error("Erro ao marcar bug como resolvido:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar o status do bug.",
        variant: "destructive",
      });
    }
  };

  const handleReopenBug = async (id: string) => {
    try {
      const bugRef = doc(db, "bugReports", id);
      await updateDoc(bugRef, {
        status: "open",
        resolvedAt: null
      });
      toast({
        title: "Bug reaberto",
        description: "O problema foi marcado como aberto novamente.",
      });
      
      // Mover bug de volta para lista de abertos
      const reopenedBug = resolvedReports.find(report => report.id === id);
      if (reopenedBug) {
        setBugReports([reopenedBug, ...bugReports]);
        setResolvedReports(resolvedReports.filter(report => report.id !== id));
      }
    } catch (error) {
      console.error("Erro ao reabrir bug:", error);
      toast({
        title: "Erro",
        description: "Falha ao reabrir o bug.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBug = async (id: string) => {
  try {
    const bugRef = doc(db, "bugReports", id);
    await deleteDoc(bugRef);
    toast({
      title: "Bug Excluído",
      description: "O relatório foi removido com sucesso.",
    });
    // Atualiza os estados removendo o bug excluído
    setBugReports(bugReports.filter(report => report.id !== id));
    setResolvedReports(resolvedReports.filter(report => report.id !== id));
  } catch (error) {
    console.error("Erro ao excluir bug:", error);
    toast({
      title: "Erro",
      description: "Falha ao remover o relatório.",
      variant: "destructive",
    });
  }
};
  
  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-eccos-purple/10 text-eccos-purple mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-eccos-purple"></div>
            </div>
            <p className="text-gray-600">Carregando dados do suporte...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-white relative">
        {/* Conteúdo principal */}
        <div className="relative z-20 space-y-8 p-6 md:p-12 fade-up">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
              <Headphones className="text-eccos-purple" size={35} />
              Suporte da Plataforma
            </h1>
            
            <div className="flex gap-2">
              <Button 
                variant={activeTab === 'bugs' ? 'default' : 'outline'}
                onClick={() => setActiveTab('bugs')}
                className="flex items-center gap-2"
              >
                <Bug className="h-4 w-4" />
                Relatórios de Bugs
              </Button>
              <Button 
                variant={activeTab === 'manuais' ? 'default' : 'outline'}
                onClick={() => setActiveTab('manuais')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Manuais
              </Button>
            </div>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card Bugs Abertos */}
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Bugs Reportados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                  {bugReports.length}
                </div>
                <Badge variant="outline" className="mt-2 border-red-500 text-red-500">
                  Em Aberto
                </Badge>
              </CardContent>
            </Card>

            {/* Card Bugs Resolvidos */}
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Bugs Resolvidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                  {resolvedReports.length}
                </div>
                <Badge variant="outline" className="mt-2 border-green-500 text-green-500">
                  Concluídos
                </Badge>
              </CardContent>
            </Card>

            {/* Card Manuais */}
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Manuais Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                  {manuais.length}
                </div>
                <Badge variant="outline" className="mt-2 border-blue-500 text-blue-500">
                  Documentos
                </Badge>
              </CardContent>
            </Card>

            {/* Card Status */}
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Status do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                  Online
                </div>
                <Badge variant="outline" className="mt-2 border-green-500 text-green-500">
                  Operacional
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Seções principais */}
          {activeTab === 'bugs' ? (
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg transition-all duration-300 fade-up">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Bug className="text-red-500" size={24} />
                    <CardTitle className="bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                      Relatórios de Bugs
                    </CardTitle>
                    <Badge variant="destructive" className="ml-2">
                      {bugReports.length}
                    </Badge>
                  </div>
                  <Button 
                    variant={showResolved ? "default" : "outline"} 
                    onClick={() => setShowResolved(!showResolved)}
                    className="flex items-center gap-2"
                  >
                    {showResolved ? (
                      <>
                        <XCircle className="h-4 w-4" />
                        Ocultar Resolvidos
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Mostrar Resolvidos
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {bugReports.length === 0 && !showResolved ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                      <CheckCircle2 size={24} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">
                      Nenhum bug reportado
                    </h3>
                    <p className="text-gray-500">
                      Todos os problemas foram resolvidos ou não há bugs reportados recentemente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {/* Bugs Abertos */}
                    {bugReports.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500"></span>
                          Bugs Abertos ({bugReports.length})
                        </h3>
                        {bugReports.map((report) => (
                          <div key={report.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-all duration-200 hover:shadow-md relative mb-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-gray-800 mb-2">{report.title}</h3>
                                <p className="text-gray-600 mb-3 leading-relaxed">{report.description}</p>
                                <div className="space-y-1 text-sm text-gray-500">
                                  <p><span className="font-medium">Reportado por:</span> {report.userEmail}</p>
                                  <p><span className="font-medium">Página:</span> {report.pageUrl}</p>
                                  <p><span className="font-medium">Data:</span> {format(report.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={() => handleResolveBug(report.id)}
    className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
  >
    <CheckCircle2 className="h-4 w-4" />
    Resolver
  </Button>

  <Button
    variant="outline"
    size="sm"
    onClick={() => handleDeleteBug(report.id)}
    className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
  >
    <Trash2 className="h-4 w-4" />
    Excluir
  </Button>
</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bugs Resolvidos */}
                    {showResolved && resolvedReports.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-gray-100">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-500"></span>
                          Bugs Resolvidos ({resolvedReports.length})
                        </h3>
                        {resolvedReports.map((report) => (
                          <div key={report.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-all duration-200 hover:shadow-md relative mb-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-gray-800 mb-2">{report.title}</h3>
                                <p className="text-gray-600 mb-3 leading-relaxed">{report.description}</p>
                                <div className="space-y-1 text-sm text-gray-500">
                                  <p><span className="font-medium">Reportado por:</span> {report.userEmail}</p>
                                  <p><span className="font-medium">Página:</span> {report.pageUrl}</p>
                                  <p><span className="font-medium">Data:</span> {format(report.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                                </div>
                              </div>
                             <div className="flex gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={() => handleReopenBug(report.id)}
    className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
  >
    <XCircle className="h-4 w-4" />
    Reabrir
  </Button>

  <Button
    variant="outline"
    size="sm"
    onClick={() => handleDeleteBug(report.id)}
    className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
  >
    <Trash2 className="h-4 w-4" />
    Excluir
  </Button>
</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {showResolved && resolvedReports.length === 0 && (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-600 mb-4">
                          <FileText size={24} />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-800">
                          Nenhum bug resolvido
                        </h3>
                        <p className="text-gray-500">
                          Todos os bugs reportados estão em aberto.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg transition-all duration-300 fade-up">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="text-blue-500" size={24} />
                  <CardTitle className="bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                    Manuais e Tutoriais
                  </CardTitle>
                  <Badge variant="secondary" className="ml-2">
                    {manuais.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Upload de arquivos */}
                <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
                  <h3 className="font-semibold text-lg mb-4 text-gray-800">Adicionar Novo Manual</h3>
                  
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive 
                        ? 'border-eccos-purple bg-purple-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={openFileDialog}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Upload className="h-10 w-10 text-gray-400" />
                      <p className="text-gray-600">
                        <span className="text-eccos-purple font-medium">Clique para enviar</span> ou arraste e solte
                      </p>
                      <p className="text-sm text-gray-500">PDF (máx. 10MB)</p>
                    </div>
                  </div>
                  
                  {file && (
                    <div className="mt-4 flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="text-gray-500" />
                        <span className="font-medium">{file.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setFile(null)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <XCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={handleUpload}
                      disabled={!file || uploading}
                      className="flex items-center gap-2 bg-eccos-purple hover:bg-sidebar text-white transition-all duration-200"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? "Enviando..." : "Enviar Arquivo"}
                    </Button>
                  </div>
                </div>
                
                <h3 className="font-semibold text-lg mb-4 text-gray-800">Manuais Disponíveis</h3>
                {manuais.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                      <FileText size={24} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">
                      Nenhum manual disponível
                    </h3>
                    <p className="text-gray-500">
                      Faça upload dos primeiros manuais para começar a biblioteca de documentação.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {manuais.map((manual, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600">
                            <FileText className="h-5 w-5" />
                          </div>
                          <span className="font-medium text-gray-800 truncate max-w-xs">{manual.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={manual.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200">
                              <Download className="h-4 w-4 mr-1" />
                              Baixar
                            </Button>
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteManual(manual.name)}
                            className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Rodapé */}
        <footer className="relative z-20 bg-gray-50 py-10 px-4 md:p-12 fade-up">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <p className="text-gray-500 text-sm">
                © 2025 Colégio ECCOS - Todos os direitos reservados
              </p>
            </div>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
};

export default SuportePlataforma;