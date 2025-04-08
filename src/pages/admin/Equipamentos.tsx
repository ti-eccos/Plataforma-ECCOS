
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FilePlus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import AddEquipmentDialog from "@/components/AddEquipmentDialog";
import { getAllEquipment, deleteEquipment, Equipment, EquipmentType, filterEquipmentByType } from "@/services/equipmentService";

const Equipamentos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  // Load equipment data
  const loadEquipmentData = async () => {
    setIsLoading(true);
    try {
      const data = await getAllEquipment();
      setEquipmentList(data);
      setFilteredEquipment(data);
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar a lista de equipamentos.",
        variant: "destructive",
      });
      console.error("Failed to load equipment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEquipmentData();
  }, []);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, selectedTypeFilter);
  };

  // Handle type filter
  const handleTypeFilter = (type: string) => {
    setSelectedTypeFilter(type);
    applyFilters(searchTerm, type);
  };

  // Apply both filters
  const applyFilters = (term: string, typeFilter: string) => {
    let filtered = [...equipmentList];
    
    // Apply search term filter
    if (term) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.type.toLowerCase().includes(term) ||
          item.location.toLowerCase().includes(term) ||
          item.serialNumber.toLowerCase().includes(term)
      );
    }
    
    // Apply type filter
    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter(
        (item) => item.type === typeFilter
      );
    }
    
    setFilteredEquipment(filtered);
  };

  // Handle equipment deletion
  const confirmDelete = (id: string) => {
    setEquipmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!equipmentToDelete) return;
    
    try {
      await deleteEquipment(equipmentToDelete);
      toast({
        title: "Equipamento excluído",
        description: "O equipamento foi removido com sucesso.",
      });
      loadEquipmentData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o equipamento.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setEquipmentToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "disponível":
        return "bg-green-500/20 text-green-500 hover:bg-green-500/30";
      case "em uso":
        return "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30";
      case "em manutenção":
        return "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30";
    }
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gradient">Equipamentos</h2>
              <p className="text-muted-foreground mt-1">
                Gerencie todos os equipamentos tecnológicos da instituição.
              </p>
            </div>
            <Button 
              className="bg-eccos-blue hover:bg-eccos-blue/80"
              onClick={() => setAddDialogOpen(true)}
            >
              <FilePlus className="mr-2 h-4 w-4" /> Adicionar Equipamento
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Inventário de Equipamentos</CardTitle>
              <CardDescription>
                Lista completa de equipamentos tecnológicos cadastrados no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center w-full md:w-auto">
                  <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar equipamentos..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="max-w-md"
                  />
                </div>
                <div className="w-full md:w-auto">
                  <Select 
                    value={selectedTypeFilter} 
                    onValueChange={handleTypeFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Chromebook">Chromebook</SelectItem>
                      <SelectItem value="iPad">iPad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Serial</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          <div className="flex justify-center items-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                            <span>Carregando equipamentos...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredEquipment.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          Nenhum equipamento encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEquipment.map((equipment) => (
                        <TableRow key={equipment.id} className="hover:bg-secondary/30">
                          <TableCell className="font-medium">{equipment.id?.substring(0, 8)}...</TableCell>
                          <TableCell>{equipment.name}</TableCell>
                          <TableCell>{equipment.type}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(equipment.status)}>
                              {equipment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{equipment.location}</TableCell>
                          <TableCell className="font-mono text-xs">{equipment.serialNumber}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 
                                  className="h-4 w-4" 
                                  onClick={() => equipment.id && confirmDelete(equipment.id)}
                                />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Equipment Dialog */}
        <AddEquipmentDialog 
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onEquipmentAdded={loadEquipmentData}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este equipamento? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </AppLayout>
  );
};

export default Equipamentos;
