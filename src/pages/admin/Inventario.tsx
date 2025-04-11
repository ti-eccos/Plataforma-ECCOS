import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Package, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Filter, 
  ArrowUpDown,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  getAllEquipment, 
  addEquipment, 
  updateEquipment, 
  deleteEquipment,
  Equipment,
  EquipmentCategory
} from "@/services/equipmentService";

const Inventario = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<EquipmentCategory[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Equipment | null;
    direction: 'ascending' | 'descending';
  }>({ key: null, direction: 'ascending' });
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<Partial<Equipment>>({
    name: "",
    description: "",
    category: "computer",
    status: "available",
    location: "",
    serialNumber: "",
    purchaseDate: "",
    isAvailableForReservation: true
  });

  // Fetch equipment data
  const { 
    data: equipment = [], 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['equipment'],
    queryFn: getAllEquipment
  });

  // Add equipment mutation
  const addMutation = useMutation({
    mutationFn: addEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast.success("Equipamento adicionado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar equipamento");
      console.error("Error adding equipment:", error);
    }
  });

  // Update equipment mutation
  const updateMutation = useMutation({
    mutationFn: (equipment: Equipment) => updateEquipment(equipment.id, equipment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setIsEditDialogOpen(false);
      resetForm();
      toast.success("Equipamento atualizado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar equipamento");
      console.error("Error updating equipment:", error);
    }
  });

  // Delete equipment mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEquipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setIsDeleteDialogOpen(false);
      toast.success("Equipamento removido com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao remover equipamento");
      console.error("Error deleting equipment:", error);
    }
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "computer",
      status: "available",
      location: "",
      serialNumber: "",
      purchaseDate: "",
      isAvailableForReservation: true
    });
    setSelectedEquipment(null);
  };

  // Handle edit button click
  const handleEditClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setFormData({
      name: equipment.name,
      description: equipment.description,
      category: equipment.category,
      status: equipment.status,
      location: equipment.location,
      serialNumber: equipment.serialNumber,
      purchaseDate: equipment.purchaseDate,
      isAvailableForReservation: equipment.isAvailableForReservation
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsDeleteDialogOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isAvailableForReservation: checked }));
  };

  // Handle add form submission
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(formData as Equipment);
  };

  // Handle edit form submission
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEquipment) {
      updateMutation.mutate({
        ...formData,
        id: selectedEquipment.id
      } as Equipment);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedEquipment) {
      deleteMutation.mutate(selectedEquipment.id);
    }
  };

  // Handle sort
  const requestSort = (key: keyof Equipment) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort equipment
  const filteredEquipment = React.useMemo(() => {
    let filtered = [...equipment];
    
    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(lowerCaseSearch) ||
        item.description.toLowerCase().includes(lowerCaseSearch) ||
        item.location.toLowerCase().includes(lowerCaseSearch) ||
        item.serialNumber.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(item => 
        selectedCategories.includes(item.category as EquipmentCategory)
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key!] < b[sortConfig.key!]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key!] > b[sortConfig.key!]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [equipment, searchTerm, selectedCategories, sortConfig]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="default" className="bg-green-500">Disponível</Badge>;
      case "in-use":
        return <Badge variant="default" className="bg-blue-500">Em Uso</Badge>;
      case "maintenance":
        return <Badge variant="default" className="bg-amber-500">Em Manutenção</Badge>;
      case "broken":
        return <Badge variant="destructive">Quebrado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  // Get category label
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "computer":
        return "Computador";
      case "printer":
        return "Impressora";
      case "network":
        return "Equipamento de Rede";
      case "peripheral":
        return "Periférico";
      case "audiovisual":
        return "Audiovisual";
      case "other":
        return "Outro";
      default:
        return "Desconhecido";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Inventário de Equipamentos</h1>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Adicionar Equipamento
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar equipamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" /> Categorias
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background">
              <DropdownMenuCheckboxItem
                checked={selectedCategories.includes("computer")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedCategories([...selectedCategories, "computer"]);
                  } else {
                    setSelectedCategories(selectedCategories.filter(c => c !== "computer"));
                  }
                }}
              >
                Computadores
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedCategories.includes("printer")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedCategories([...selectedCategories, "printer"]);
                  } else {
                    setSelectedCategories(selectedCategories.filter(c => c !== "printer"));
                  }
                }}
              >
                Impressoras
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedCategories.includes("network")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedCategories([...selectedCategories, "network"]);
                  } else {
                    setSelectedCategories(selectedCategories.filter(c => c !== "network"));
                  }
                }}
              >
                Equipamentos de Rede
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedCategories.includes("peripheral")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedCategories([...selectedCategories, "peripheral"]);
                  } else {
                    setSelectedCategories(selectedCategories.filter(c => c !== "peripheral"));
                  }
                }}
              >
                Periféricos
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedCategories.includes("audiovisual")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedCategories([...selectedCategories, "audiovisual"]);
                  } else {
                    setSelectedCategories(selectedCategories.filter(c => c !== "audiovisual"));
                  }
                }}
              >
                Audiovisual
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedCategories.includes("other")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedCategories([...selectedCategories, "other"]);
                  } else {
                    setSelectedCategories(selectedCategories.filter(c => c !== "other"));
                  }
                }}
              >
                Outros
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="text-center text-destructive p-4 border border-destructive rounded-md">
            Erro ao carregar equipamentos. Tente novamente mais tarde.
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="text-center text-muted-foreground p-8 border border-dashed rounded-md">
            Nenhum equipamento encontrado.
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableCaption>Lista de equipamentos do inventário</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => requestSort('name')}
                    >
                      Nome
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Disponível para Reserva</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{getCategoryLabel(item.category)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>
                      {item.isAvailableForReservation ? (
                        <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500">
                          Sim
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-500/20 text-red-500 border-red-500">
                          Não
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <span className="sr-only">Abrir menu</span>
                            <Filter className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background">
                          <DropdownMenuItem onClick={() => handleEditClick(item)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteClick(item)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Excluir</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Equipment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Equipamento</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do novo equipamento.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Categoria
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="computer">Computador</SelectItem>
                    <SelectItem value="printer">Impressora</SelectItem>
                    <SelectItem value="network">Equipamento de Rede</SelectItem>
                    <SelectItem value="peripheral">Periférico</SelectItem>
                    <SelectItem value="audiovisual">Audiovisual</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="in-use">Em Uso</SelectItem>
                    <SelectItem value="maintenance">Em Manutenção</SelectItem>
                    <SelectItem value="broken">Quebrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Localização
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="serialNumber" className="text-right">
                  Nº de Série
                </Label>
                <Input
                  id="serialNumber"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="purchaseDate" className="text-right">
                  Data de Compra
                </Label>
                <Input
                  id="purchaseDate"
                  name="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isAvailableForReservation" className="text-right">
                  Disponível para Reserva
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Checkbox
                    id="isAvailableForReservation"
                    checked={formData.isAvailableForReservation}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <label
                    htmlFor="isAvailableForReservation"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Sim
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Adicionar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Equipment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Equipamento</DialogTitle>
            <DialogDescription>
              Atualize os detalhes do equipamento.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Descrição
                </Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-category" className="text-right">
                  Categoria
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="computer">Computador</SelectItem>
                    <SelectItem value="printer">Impressora</SelectItem>
                    <SelectItem value="network">Equipamento de Rede</SelectItem>
                    <SelectItem value="peripheral">Periférico</SelectItem>
                    <SelectItem value="audiovisual">Audiovisual</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="in-use">Em Uso</SelectItem>
                    <SelectItem value="maintenance">Em Manutenção</SelectItem>
                    <SelectItem value="broken">Quebrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-location" className="text-right">
                  Localização
                </Label>
                <Input
                  id="edit-location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-serialNumber" className="text-right">
                  Nº de Série
                </Label>
                <Input
                  id="edit-serialNumber"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-purchaseDate" className="text-right">
                  Data de Compra
                </Label>
                <Input
                  id="edit-purchaseDate"
                  name="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-isAvailableForReservation" className="text-right">
                  Disponível para Reserva
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Checkbox
                    id="edit-isAvailableForReservation"
                    checked={formData.isAvailableForReservation}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <label
                    htmlFor="edit-isAvailableForReservation"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Sim
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o equipamento "{selectedEquipment?.name}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Inventario;
