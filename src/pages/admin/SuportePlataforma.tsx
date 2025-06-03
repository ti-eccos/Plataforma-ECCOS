// src/pages/admin/SuportePlataforma.tsx
import React, { useState, useEffect } from 'react';
import {
  useToast
} from "@/hooks/use-toast";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc
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

  // Carregar relatórios de bugs
  useEffect(() => {
    const fetchBugReports = async () => {
      try {
        const q = query(
          collection(db, "bugReports"),
          where("status", "==", "open")
        );
        const querySnapshot = await getDocs(q);
        const reports: BugReport[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          reports.push({
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
        setBugReports(reports.sort((a, b) =>
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
      setBugReports(bugReports.filter(report => report.id !== id));
    } catch (error) {
      console.error("Erro ao marcar bug como resolvido:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar o status do bug.",
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
      <div className="min-h-screen bg-white overflow-hidden relative">
        {/* Conteúdo principal */}
        <div className="relative z-20 space-y-8 p-6 md:p-12 fade-up">
          <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
            <Headphones className="text-eccos-purple" size={35} />
            Suporte da Plataforma
          </h1>

          {/* Cards de estatísticas */}
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
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
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg transition-all duration-300 xs:col-span-2 lg:col-span-1">
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
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-8 fade-up">
            {/* Seção de Relatórios de Bugs */}
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="text-red-500" size={24} />
                  <span className="bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                    Relatórios de Bugs
                  </span>
                  <Badge variant="destructive" className="ml-2">
                    {bugReports.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bugReports.length === 0 ? (
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
                    {bugReports.map((report) => (
                      <div key={report.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-all duration-200 hover:shadow-md relative">
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResolveBug(report.id)}
                            className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200 relative z-10"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Resolver
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seção de Manuais e Tutoriais */}
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="text-blue-500" size={24} />
                  <span className="bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                    Manuais e Tutoriais
                  </span>
                  <Badge variant="secondary" className="ml-2">
                    {manuais.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Upload de arquivos */}
                <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
                  <h3 className="font-semibold text-lg mb-4 text-gray-800">Adicionar Novo Manual</h3>
                  <div className="flex gap-3">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="flex-1 border-gray-200 focus:border-eccos-purple focus:ring-eccos-purple"
                    />
                    <Button
                      onClick={handleUpload}
                      disabled={!file || uploading}
                      className="flex items-center gap-2 bg-eccos-purple hover:bg-sidebar text-white transition-all duration-200"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    Apenas arquivos PDF são permitidos. Tamanho máximo: 10MB.
                  </p>
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
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {manuais.map((manual, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600">
                            <FileText className="h-5 w-5" />
                          </div>
                          <span className="font-medium text-gray-800 truncate max-w-[200px]">{manual.name}</span>
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
          </div>
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