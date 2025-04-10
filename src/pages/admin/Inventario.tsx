
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
import { Search, Plus, FileText, Loader2, Download, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where } from "firebase/firestore";
import AddEquipmentDialog from "@/components/AddEquipmentDialog";

// Define types for the inventory page
export type EquipmentType = 
  | "Chromebook" 
  | "iPad" 
  | "Projetor" 
  | "Cabo" 
  | "Desktop" 
  | "Periférico"
  | "Áudio"
  | "Rede"
  | "Outro";

export interface Equipment {
  id?: string;
  name: string;
  type: EquipmentType;
  status: "disponível" | "em uso" | "em manutenção" | "obsoleto";
  location?: string;
  serialNumber?: string;
  model?: string;
  brand?: string;
  purchaseDate?: string;
  warrantyUntil?: string;
  notes?: string;
  lastMaintenance?: string;
  properties?: Record<string, string>;
}

// Equipment details dialog component
interface EquipmentDetailsDialogProps {
  equipment: Equipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquipmentUpdated: () => void;
}

const EquipmentDetailsDialog = ({ equipment, open, onOpenChange, onEquipmentUpdated }: EquipmentDetailsDialogProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedEquipment, setEditedEquipment] = useState<Equipment | null>(equipment);
  const { toast } = useToast();

  useEffect(() => {
    setEditedEquipment(equipment);
  }, [equipment]);

  if (!equipment) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedEquipment(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleStatusChange = (status: "disponível" | "em uso" | "em manutenção" | "obsoleto") => {
    setEditedEquipment(prev => prev ? { ...prev, status } : null);
  };

  const handleUpdate = async () => {
    if (!editedEquipment || !editedEquipment.id) return;
    
    setIsUpdating(true);
    try {
      const equipmentRef = doc(db, "inventory", editedEquipment.id);
      await updateDoc(equipmentRef, editedEquipment);
      toast({
        title: "Equipamento atualizado",
        description: "As informações foram atualizadas com sucesso."
      });
      onEquipmentUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar as informações.",
        variant: "destructive"
      });
      console.error("Failed to update equipment:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!equipment.id) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "inventory", equipment.id));
      toast({
        title: "Equipamento removido",
        description: "O equipamento foi removido com sucesso."
      });
      onEquipmentUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o equipamento.",
        variant: "destructive"
      });
      console.error("Failed to delete equipment:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" 
         style={{ display: open ? 'flex' : 'none' }}>
      <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{equipment.name}</h2>
          <button 
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <Input 
              name="name" 
              value={editedEquipment?.name || ''} 
              onChange={handleInputChange} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select 
              name="type" 
              value={editedEquipment?.type || ''} 
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="Chromebook">Chromebook</option>
              <option value="iPad">iPad</option>
              <option value="Projetor">Projetor</option>
              <option value="Cabo">Cabo</option>
              <option value="Desktop">Desktop</option>
              <option value="Periférico">Periférico</option>
              <option value="Áudio">Áudio</option>
              <option value="Rede">Rede</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Número de Série</label>
            <Input 
              name="serialNumber" 
              value={editedEquipment?.serialNumber || ''} 
              onChange={handleInputChange} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Modelo</label>
            <Input 
              name="model" 
              value={editedEquipment?.model || ''} 
              onChange={handleInputChange} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Marca</label>
            <Input 
              name="brand" 
              value={editedEquipment?.brand || ''} 
              onChange={handleInputChange} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Localização</label>
            <Input 
              name="location" 
              value={editedEquipment?.location || ''} 
              onChange={handleInputChange} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data de Compra</label>
            <Input 
              name="purchaseDate" 
              type="date" 
              value={editedEquipment?.purchaseDate || ''} 
              onChange={handleInputChange} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Garantia Até</label>
            <Input 
              name="warrantyUntil" 
              type="date" 
              value={editedEquipment?.warrantyUntil || ''} 
              onChange={handleInputChange} 
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium mb-1">Status</label>
            <div className="flex flex-wrap gap-2">
              {["disponível", "em uso", "em manutenção", "obsoleto"].map((status) => (
                <Badge 
                  key={status}
                  onClick={() => handleStatusChange(status as "disponível" | "em uso" | "em manutenção" | "obsoleto")}
                  className={`
                    cursor-pointer
                    ${editedEquipment?.status === status ? (
                      status === "disponível" ? "bg-green-500" :
                      status === "em uso" ? "bg-blue-500" :
                      status === "em manutenção" ? "bg-orange-500" :
                      "bg-gray-500"
                    ) : "bg-secondary"}
                  `}
                >
                  {status}
                </Badge>
              ))}
            </div>
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea 
              name="notes" 
              value={editedEquipment?.notes || ''} 
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border rounded-md bg-background"
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting || isUpdating}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Remover Equipamento
          </Button>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={isUpdating || isDeleting}
              className="bg-eccos-blue hover:bg-eccos-blue/80"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
      const inventoryCollectionRef = collection(db, "inventory");
      const snapshot = await getDocs(inventoryCollectionRef);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Equipment[];
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

  // Export inventory as CSV
  const exportInventory = () => {
    if (equipmentList.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há equipamentos no inventário para exportar.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create CSV header
      const headers = [
        "Nome", "Tipo", "Status", "Localização", "Número de Série", 
        "Modelo", "Marca", "Data de Compra", "Garantia Até", "Notas"
      ];
      
      // Create CSV content
      let csvContent = headers.join(",") + "\n";
      
      equipmentList.forEach(item => {
        const row = [
          `"${item.name || ''}"`,
          `"${item.type || ''}"`,
          `"${item.status || ''}"`,
          `"${item.location || ''}"`,
          `"${item.serialNumber || ''}"`,
          `"${item.model || ''}"`,
          `"${item.brand || ''}"`,
          `"${item.purchaseDate || ''}"`,
          `"${item.warrantyUntil || ''}"`,
          `"${item.notes || ''}"`
        ];
        csvContent += row.join(",") + "\n";
      });
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `inventario-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exportação concluída",
        description: "O inventário foi exportado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o inventário.",
        variant: "destructive",
      });
      console.error("Export error:", error);
    }
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

  // Add new equipment handler
  const handleEquipmentAdded = () => {
    loadEquipmentData();
    toast({
      title: "Equipamento adicionado",
      description: "O novo equipamento foi adicionado ao inventário."
    });
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
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setAddDialogOpen(true)}
                className="bg-eccos-blue hover:bg-eccos-blue/80"
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar
              </Button>
              <Button
                onClick={exportInventory}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
            </div>
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
        <AddEquipmentDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onEquipmentAdded={handleEquipmentAdded}
        />
      </motion.div>
    </AppLayout>
  );
};

export default Inventario;
