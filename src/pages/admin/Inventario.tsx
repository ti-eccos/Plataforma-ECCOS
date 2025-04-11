
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  getAllEquipment, 
  deleteEquipment,
  updateEquipment,
  Equipment,
  EquipmentType
} from "@/services/equipmentService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/components/AppLayout";
import { 
  Check, 
  Eye, 
  EyeOff, 
  Filter, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X,
  Save
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
import AddEquipmentFormDialog from "@/components/admin/AddEquipmentFormDialog";

export default function Inventario() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Partial<Equipment>>({});
  const [editMode, setEditMode] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const { toast } = useToast();

  // Fetch equipment data
  const fetchEquipment = async () => {
    setIsLoading(true);
    try {
      const data = await getAllEquipment();
      setEquipment(data);
      setFilteredEquipment(data);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o inventário.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  // Filter equipment based on search term and filters
  useEffect(() => {
    let result = [...equipment];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.serialNumber?.toLowerCase().includes(term) ||
          item.model?.toLowerCase().includes(term) ||
          item.brand?.toLowerCase().includes(term)
      );
    }

    if (selectedStatus) {
      result = result.filter((item) => item.status === selectedStatus);
    }

    if (selectedType) {
      result = result.filter((item) => item.type === selectedType);
    }

    setFilteredEquipment(result);
  }, [equipment, searchTerm, selectedStatus, selectedType]);

  const handleDelete = (item: Equipment) => {
    setSelectedEquipment(item);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedEquipment.id) return;

    try {
      await deleteEquipment(selectedEquipment.id);
      toast({
        title: "Sucesso",
        description: "Equipamento excluído com sucesso.",
      });
      fetchEquipment();
      setOpenDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting equipment:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o equipamento.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (item: Equipment) => {
    setSelectedEquipment(item);
    setEditMode(false);
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!selectedEquipment.id) return;

    try {
      await updateEquipment(selectedEquipment.id, selectedEquipment);
      toast({
        title: "Sucesso",
        description: "Equipamento atualizado com sucesso.",
      });
      fetchEquipment();
      setEditMode(false);
    } catch (error) {
      console.error("Error updating equipment:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o equipamento.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    // Restore original data
    const original = equipment.find((item) => item.id === selectedEquipment.id);
    if (original) {
      setSelectedEquipment(original);
    }
    setEditMode(false);
  };

  const handleFilterReset = () => {
    setSearchTerm("");
    setSelectedStatus(null);
    setSelectedType(null);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "disponível":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "em uso":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "em manutenção":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "obsoleto":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getTypeClass = (type: string) => {
    switch (type) {
      case "Chromebook":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "iPad":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Projetor":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Inventário Completo</h1>
          <Button 
            onClick={() => setOpenAddDialog(true)}
            className="bg-eccos-blue hover:bg-eccos-blue/80"
          >
            <Plus size={16} className="mr-2" /> Adicionar Item
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtre o inventário por diversos critérios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nome, número de série, modelo..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="absolute right-2 top-2.5"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={selectedStatus || ""}
                  onValueChange={(value) => setSelectedStatus(value || null)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="disponível">Disponível</SelectItem>
                    <SelectItem value="em uso">Em uso</SelectItem>
                    <SelectItem value="em manutenção">Em manutenção</SelectItem>
                    <SelectItem value="obsoleto">Obsoleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={selectedType || ""}
                  onValueChange={(value) => setSelectedType(value || null)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    <SelectItem value="Chromebook">Chromebook</SelectItem>
                    <SelectItem value="iPad">iPad</SelectItem>
                    <SelectItem value="Projetor">Projetor</SelectItem>
                    <SelectItem value="Cabo">Cabo</SelectItem>
                    <SelectItem value="Desktop">Desktop</SelectItem>
                    <SelectItem value="Periférico">Periférico</SelectItem>
                    <SelectItem value="Áudio">Áudio</SelectItem>
                    <SelectItem value="Rede">Rede</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleFilterReset}
              >
                <X size={14} className="mr-1" /> Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eccos-blue"></div>
              </div>
            ) : filteredEquipment.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                Nenhum equipamento encontrado.
              </div>
            ) : (
              <div className="rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Tipo</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="hidden md:table-cell">Modelo/Marca</TableHead>
                      <TableHead className="hidden md:table-cell">Status</TableHead>
                      <TableHead className="hidden md:table-cell w-[200px]">Localização</TableHead>
                      <TableHead className="w-[100px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipment.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeClass(item.type)}`}>
                            {item.type}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.name}
                          {item.serialNumber && (
                            <div className="text-xs text-muted-foreground">
                              S/N: {item.serialNumber}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {item.brand && `${item.brand} `}
                          {item.model}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(item.status)}`}>
                            {item.status}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {item.location || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleViewDetails(item)}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Ver {item.name}</span>
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
                              <SheetHeader>
                                <SheetTitle>{editMode ? "Editar Equipamento" : "Detalhes do Equipamento"}</SheetTitle>
                                <SheetDescription>
                                  {editMode 
                                    ? "Modifique as informações do equipamento."
                                    : "Veja detalhes completos do equipamento."}
                                </SheetDescription>
                              </SheetHeader>
                              <div className="py-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="name">Nome</Label>
                                    {editMode ? (
                                      <Input 
                                        id="name"
                                        value={selectedEquipment.name || ""} 
                                        onChange={(e) => setSelectedEquipment({...selectedEquipment, name: e.target.value})}
                                      />
                                    ) : (
                                      <div className="p-2 bg-muted rounded-md">
                                        {selectedEquipment.name}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <Label htmlFor="type">Tipo</Label>
                                    {editMode ? (
                                      <Select
                                        value={selectedEquipment.type || ""}
                                        onValueChange={(value) => setSelectedEquipment({...selectedEquipment, type: value as EquipmentType})}
                                      >
                                        <SelectTrigger id="edit-type">
                                          <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Chromebook">Chromebook</SelectItem>
                                          <SelectItem value="iPad">iPad</SelectItem>
                                          <SelectItem value="Projetor">Projetor</SelectItem>
                                          <SelectItem value="Cabo">Cabo</SelectItem>
                                          <SelectItem value="Desktop">Desktop</SelectItem>
                                          <SelectItem value="Periférico">Periférico</SelectItem>
                                          <SelectItem value="Áudio">Áudio</SelectItem>
                                          <SelectItem value="Rede">Rede</SelectItem>
                                          <SelectItem value="Outro">Outro</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <div className="p-2 bg-muted rounded-md">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeClass(selectedEquipment.type || "")}`}>
                                          {selectedEquipment.type}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="serial">Número de Série</Label>
                                    {editMode ? (
                                      <Input 
                                        id="serial"
                                        value={selectedEquipment.serialNumber || ""} 
                                        onChange={(e) => setSelectedEquipment({...selectedEquipment, serialNumber: e.target.value})}
                                      />
                                    ) : (
                                      <div className="p-2 bg-muted rounded-md">
                                        {selectedEquipment.serialNumber || "—"}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <Label htmlFor="status">Status</Label>
                                    {editMode ? (
                                      <Select
                                        value={selectedEquipment.status || ""}
                                        onValueChange={(value) => setSelectedEquipment({
                                          ...selectedEquipment, 
                                          status: value as "disponível" | "em uso" | "em manutenção" | "obsoleto"
                                        })}
                                      >
                                        <SelectTrigger id="edit-status">
                                          <SelectValue placeholder="Selecione o status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="disponível">Disponível</SelectItem>
                                          <SelectItem value="em uso">Em uso</SelectItem>
                                          <SelectItem value="em manutenção">Em manutenção</SelectItem>
                                          <SelectItem value="obsoleto">Obsoleto</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <div className="p-2 bg-muted rounded-md">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(selectedEquipment.status || "")}`}>
                                          {selectedEquipment.status}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="brand">Marca</Label>
                                    {editMode ? (
                                      <Input 
                                        id="brand"
                                        value={selectedEquipment.brand || ""} 
                                        onChange={(e) => setSelectedEquipment({...selectedEquipment, brand: e.target.value})}
                                      />
                                    ) : (
                                      <div className="p-2 bg-muted rounded-md">
                                        {selectedEquipment.brand || "—"}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <Label htmlFor="model">Modelo</Label>
                                    {editMode ? (
                                      <Input 
                                        id="model"
                                        value={selectedEquipment.model || ""} 
                                        onChange={(e) => setSelectedEquipment({...selectedEquipment, model: e.target.value})}
                                      />
                                    ) : (
                                      <div className="p-2 bg-muted rounded-md">
                                        {selectedEquipment.model || "—"}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="purchaseDate">Data de Compra</Label>
                                    {editMode ? (
                                      <Input 
                                        id="purchaseDate"
                                        type="date"
                                        value={selectedEquipment.purchaseDate || ""} 
                                        onChange={(e) => setSelectedEquipment({...selectedEquipment, purchaseDate: e.target.value})}
                                      />
                                    ) : (
                                      <div className="p-2 bg-muted rounded-md">
                                        {selectedEquipment.purchaseDate || "—"}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <Label htmlFor="warrantyUntil">Garantia até</Label>
                                    {editMode ? (
                                      <Input 
                                        id="warrantyUntil"
                                        type="date"
                                        value={selectedEquipment.warrantyUntil || ""} 
                                        onChange={(e) => setSelectedEquipment({...selectedEquipment, warrantyUntil: e.target.value})}
                                      />
                                    ) : (
                                      <div className="p-2 bg-muted rounded-md">
                                        {selectedEquipment.warrantyUntil || "—"}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="location">Localização</Label>
                                  {editMode ? (
                                    <Input 
                                      id="location"
                                      value={selectedEquipment.location || ""} 
                                      onChange={(e) => setSelectedEquipment({...selectedEquipment, location: e.target.value})}
                                    />
                                  ) : (
                                    <div className="p-2 bg-muted rounded-md">
                                      {selectedEquipment.location || "—"}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <Label htmlFor="notes">Observações</Label>
                                  {editMode ? (
                                    <Textarea 
                                      id="notes"
                                      rows={3}
                                      value={selectedEquipment.notes || ""} 
                                      onChange={(e) => setSelectedEquipment({...selectedEquipment, notes: e.target.value})}
                                    />
                                  ) : (
                                    <div className="p-2 bg-muted rounded-md min-h-[80px]">
                                      {selectedEquipment.notes || "—"}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <Label htmlFor="lastMaintenance">Data da Última Manutenção</Label>
                                  {editMode ? (
                                    <Input 
                                      id="lastMaintenance"
                                      type="date"
                                      value={selectedEquipment.lastMaintenance || ""} 
                                      onChange={(e) => setSelectedEquipment({...selectedEquipment, lastMaintenance: e.target.value})}
                                    />
                                  ) : (
                                    <div className="p-2 bg-muted rounded-md">
                                      {selectedEquipment.lastMaintenance || "—"}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <SheetFooter className="flex flex-row space-x-2 justify-between sm:justify-between mt-4 border-t pt-4">
                                {editMode ? (
                                  <>
                                    <Button 
                                      variant="outline"
                                      onClick={handleCancelEdit}
                                    >
                                      <X className="mr-2 h-4 w-4" /> Cancelar
                                    </Button>
                                    <Button 
                                      className="bg-eccos-blue hover:bg-eccos-blue/80"
                                      onClick={handleSave}
                                    >
                                      <Save className="mr-2 h-4 w-4" /> Salvar
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button 
                                      variant="destructive"
                                      onClick={() => handleDelete(selectedEquipment as Equipment)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                    </Button>
                                    <Button 
                                      variant="default"
                                      className="bg-eccos-blue hover:bg-eccos-blue/80"
                                      onClick={handleEdit}
                                    >
                                      <Edit className="mr-2 h-4 w-4" /> Editar
                                    </Button>
                                  </>
                                )}
                              </SheetFooter>
                            </SheetContent>
                          </Sheet>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(item)}
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete {item.name}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddEquipmentFormDialog
        open={openAddDialog}
        onOpenChange={setOpenAddDialog}
        onEquipmentAdded={fetchEquipment}
      />

      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o equipamento"{selectedEquipment.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
