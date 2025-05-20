import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getSortedEquipmentForLending,
  Equipment,
  deleteMultipleEquipment,
  deleteEquipment,
} from "@/services/equipmentService";
import { Trash, Laptop, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AddEquipmentDialog from "@/components/AddEquipmentDialog";
import AppLayout from "@/components/AppLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Equipamentos() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const { toast } = useToast();

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const data = await getSortedEquipmentForLending();
      setEquipment(data);
      setFilteredEquipment(data); // Inicialmente, mostre todos os equipamentos
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de equipamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  // Aplicar filtro quando filterType mudar
  useEffect(() => {
    if (filterType === "all") {
      setFilteredEquipment(equipment);
    } else {
      setFilteredEquipment(equipment.filter(item => item.type === filterType));
    }
    // Resetar seleções ao trocar o filtro
    setSelectedIds([]);
  }, [filterType, equipment]);

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

  const toggleAll = () => {
    if (selectedIds.length === filteredEquipment.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEquipment.map((e) => e.id!));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      await deleteMultipleEquipment(selectedIds);
      toast({
        title: "Sucesso",
        description: `${selectedIds.length} equipamentos excluídos com sucesso.`,
      });
      fetchEquipment();
      setSelectedIds([]);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir equipamentos",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      await deleteEquipment(id);
      toast({
        title: "Sucesso",
        description: "Equipamento excluído com sucesso.",
      });
      fetchEquipment();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir equipamento",
        variant: "destructive",
      });
    }
  };

  const getTypeStyle = (type: string) => {
    if (type === "Chromebook") {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    } else if (type === "iPad") {
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    }
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  };

  // Estatísticas de equipamentos
  const chromebooks = equipment.filter(item => item.type === "Chromebook").length;
  const ipads = equipment.filter(item => item.type === "iPad").length;
  const outros = equipment.length - chromebooks - ipads;

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
            <Laptop className="text-eccos-purple" size={35} />
            Gestão de Equipamentos
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Gerencie os equipamentos disponíveis para empréstimo.
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 fade-up">
            {/* Card Chromebooks */}
            <Card
              className={`bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden ${filterType === "Chromebook" ? "ring-2 ring-blue-400" : ""}`}
              onClick={() => setFilterType(filterType === "Chromebook" ? "all" : "Chromebook")}
              role="button"
              tabIndex={0}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Chromebooks</h3>
                <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-blue bg-clip-text text-transparent">
                  {chromebooks}
                </div>
                <Badge variant="outline" className="mt-2 border-eccos-blue text-eccos-blue">
                  Disponíveis
                </Badge>
                {filterType === "Chromebook" && (
                  <Badge className="ml-2 mt-2 bg-blue-100 text-blue-800">
                    Filtro Ativo
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Card iPads */}
            <Card
              className={`bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden ${filterType === "iPad" ? "ring-2 ring-purple-400" : ""}`}
              onClick={() => setFilterType(filterType === "iPad" ? "all" : "iPad")}
              role="button"
              tabIndex={0}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">iPads</h3>
                <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                  {ipads}
                </div>
                <Badge variant="outline" className="mt-2 border-eccos-purple text-eccos-purple">
                  Disponíveis
                </Badge>
                {filterType === "iPad" && (
                  <Badge className="ml-2 mt-2 bg-purple-100 text-purple-800">
                    Filtro Ativo
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Card Total */}
            <Card
              className={`bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden ${filterType === "all" ? "ring-2 ring-green-400" : ""}`}
              onClick={() => setFilterType("all")}
              role="button"
              tabIndex={0}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total de Equipamentos</h3>
                <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-blue bg-clip-text text-transparent">
                  {equipment.length}
                </div>
                <Badge variant="outline" className="mt-2 border-green-500 text-green-500">
                  Cadastrados
                </Badge>
                {filterType === "all" && (
                  <Badge className="ml-2 mt-2 bg-green-100 text-green-800">
                    Todos Visíveis
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 fade-up">
            <div className="flex gap-2 items-center">
              <Card className="bg-white border border-gray-100 rounded-2xl shadow-md">
                <CardContent className="py-2 px-3 flex items-center gap-2">
                  <Filter size={16} className="text-gray-500" />
                  <Select
                    value={filterType}
                    onValueChange={setFilterType}
                  >
                    <SelectTrigger className="w-[180px] border-0 p-0 h-8 focus:ring-0">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Tipo de Equipamento</SelectLabel>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Chromebook">Chromebook</SelectItem>
                        <SelectItem value="iPad">iPad</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
            <div className="flex gap-2">
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2"
                >
                  <Trash className="h-4 w-4" />
                  Excluir ({selectedIds.length})
                </Button>
              )}
              <Button
                className="bg-eccos-purple hover:bg-sidebar text-white transition-colors duration-300"
                onClick={() => setAddDialogOpen(true)}
              >
                Adicionar Equipamentos
              </Button>
            </div>
          </div>

          <div className="space-y-4 fade-up">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eccos-purple"></div>
              </div>
            ) : filteredEquipment.length === 0 ? (
              <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg p-8 text-center">
                <p className="text-lg text-gray-500 mb-4">
                  {equipment.length > 0 
                    ? `Nenhum equipamento do tipo "${filterType}" encontrado.` 
                    : "Nenhum equipamento cadastrado para empréstimo."}
                </p>
                <Button 
                  onClick={() => filterType !== "all" ? setFilterType("all") : setAddDialogOpen(true)} 
                  className="bg-eccos-purple hover:bg-sidebar text-white"
                >
                  {filterType !== "all" ? "Mostrar Todos" : "Adicionar Equipamentos"}
                </Button>
              </Card>
            ) : (
              <Card className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-accent/10 hover:bg-accent/10">
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={selectedIds.length === filteredEquipment.length && filteredEquipment.length > 0}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead className="text-center align-middle w-[25%]">Tipo</TableHead>
                      <TableHead className="text-center align-middle w-[55%]">Nome</TableHead>
                      <TableHead className="text-center align-middle w-[20%]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipment.map((item) => (
                      <TableRow key={item.id} className="hover:bg-accent/20 border-t-0">
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(item.id!)}
                            onCheckedChange={(checked) => {
                              setSelectedIds((prev) =>
                                checked ? [...prev, item.id!] : prev.filter((id) => id !== item.id!)
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          <Badge
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeStyle(
                              item.type
                            )}`}
                          >
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center align-middle font-medium truncate max-w-[180px]">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          <div className="flex justify-center items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              onClick={() => handleDeleteSingle(item.id!)}
                              title="Excluir"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>

          <AddEquipmentDialog
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
            onEquipmentAdded={fetchEquipment}
          />

          {/* Rodapé */}
          <footer className="bg-gray-50 py-8 px-4 md:px-8 rounded-xl mt-12 fade-up">
            <div className="max-w-6xl mx-auto">
              <div className="text-center">
                <p className="text-gray-500 text-sm">
                  © 2025 Colégio ECCOS - Todos os direitos reservados
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </AppLayout>
  );
}