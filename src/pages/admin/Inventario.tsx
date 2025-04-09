
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { getAllEquipment, Equipment, EquipmentType } from "@/services/equipmentService";
import EquipmentDetailsDialog from "@/components/admin/EquipmentDetailsDialog";
import AddEquipmentFormDialog from "@/components/admin/AddEquipmentFormDialog";

const Inventario = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Available equipment types
  const equipmentTypes: EquipmentType[] = [
    "Chromebook",
    "iPad",
    "Projetor",
    "Cabo",
    "Desktop",
    "Periférico",
    "Áudio",
    "Rede",
    "Outro",
  ];

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

  // Filter equipment when search term changes
  useEffect(() => {
    if (searchTerm) {
      const filtered = equipmentList.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.serialNumber && item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredEquipment(filtered);
    } else {
      setFilteredEquipment(equipmentList);
    }
  }, [searchTerm, equipmentList]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // View equipment details
  const viewEquipmentDetails = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setDetailsDialogOpen(true);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case "disponível": return "bg-green-500 hover:bg-green-600";
      case "em uso": return "bg-blue-500 hover:bg-blue-600";
      case "em manutenção": return "bg-orange-500 hover:bg-orange-600";
      case "obsoleto": return "bg-gray-500 hover:bg-gray-600";
      default: return "bg-slate-500";
    }
  };

  // Group equipment by type
  const getEquipmentByType = (type: EquipmentType) => {
    return filteredEquipment.filter(item => item.type === type);
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
              <h2 className="text-3xl font-bold tracking-tight text-gradient">Inventário</h2>
              <p className="text-muted-foreground mt-1">
                Gerencie todos os equipamentos tecnológicos da instituição.
              </p>
            </div>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-eccos-blue hover:bg-eccos-blue/80"
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Equipamento
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar equipamentos por nome, número de série, marca..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-eccos-blue" />
            </div>
          ) : (
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="flex h-auto flex-wrap">
                <TabsTrigger value="all">Todos</TabsTrigger>
                {equipmentTypes.map((type) => (
                  <TabsTrigger key={type} value={type}>
                    {type}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {/* All Equipment Tab */}
              <TabsContent value="all">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Todos os Equipamentos</CardTitle>
                    <CardDescription>
                      Lista completa de todos os equipamentos cadastrados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="w-[300px]">Nome</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEquipment.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                              Nenhum equipamento encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredEquipment.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.type}</TableCell>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>
                                <Badge className={getStatusBadgeColor(item.status)}>{item.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => viewEquipmentDetails(item)}
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  Detalhes
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Equipment By Type Tabs */}
              {equipmentTypes.map((type) => (
                <TabsContent key={type} value={type}>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Equipamentos: {type}</CardTitle>
                      <CardDescription>
                        Lista de equipamentos do tipo {type}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[300px]">Nome</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getEquipmentByType(type).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                                Nenhum equipamento do tipo {type} encontrado
                              </TableCell>
                            </TableRow>
                          ) : (
                            getEquipmentByType(type).map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>
                                  <Badge className={getStatusBadgeColor(item.status)}>{item.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => viewEquipmentDetails(item)}
                                  >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Detalhes
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>

        {/* Equipment Details Dialog */}
        <EquipmentDetailsDialog
          equipment={selectedEquipment}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          onEquipmentUpdated={loadEquipmentData}
        />

        {/* Add Equipment Dialog */}
        <AddEquipmentFormDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onEquipmentAdded={loadEquipmentData}
        />
      </motion.div>
    </AppLayout>
  );
};

export default Inventario;
