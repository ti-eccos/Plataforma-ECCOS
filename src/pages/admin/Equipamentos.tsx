import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getSortedEquipmentForLending, Equipment, deleteMultipleEquipment, deleteEquipment } from "@/services/equipmentService";
import { Trash } from "lucide-react";
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

export default function Equipamentos() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const data = await getSortedEquipmentForLending();
      setEquipment(data);
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

  const toggleAll = () => {
    if (selectedIds.length === equipment.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(equipment.map(e => e.id!));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      await deleteMultipleEquipment(selectedIds);
      toast({
        title: "Sucesso",
        description: `${selectedIds.length} equipamentos excluídos com sucesso.`
      });
      fetchEquipment();
      setSelectedIds([]);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir equipamentos",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      await deleteEquipment(id);
      toast({
        title: "Sucesso",
        description: "Equipamento excluído com sucesso."
      });
      fetchEquipment();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir equipamento",
        variant: "destructive"
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

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Gestão de Equipamentos</h1>
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
              className="bg-eccos-blue hover:bg-eccos-blue/80" 
              onClick={() => setAddDialogOpen(true)}
            >
              Adicionar Equipamentos
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Gerencie os equipamentos disponíveis para empréstimo.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : equipment.length === 0 ? (
            <div className="text-center text-muted-foreground p-8 border border-dashed rounded-md">
              Nenhum equipamento cadastrado para empréstimo.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden bg-background shadow-[rgba(0,0,0,0.10)_2px_2px_3px_0px] hover:shadow-[rgba(0,0,0,0.12)_4px_4px_5px_0px transition-all duration-300 relative border-0 border-l-4 border-blue-500 before:content-[''] before:absolute before:left-0 before:top-0 before:w-[2px] before:h-full before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent before:opacity-30">
              <Table>
                <TableHeader>
                  <TableRow className="bg-accent/10 hover:bg-accent/10">
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedIds.length === equipment.length && equipment.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead className="text-center align-middle w-[25%]">Tipo</TableHead>
                    <TableHead className="text-center align-middle w-[55%]">Nome</TableHead>
                    <TableHead className="text-center align-middle w-[20%]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.map((item) => (
                    <TableRow 
                      key={item.id}
                      className="hover:bg-accent/20 border-t-0"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(item.id!)}
                          onCheckedChange={(checked) => {
                            setSelectedIds(prev => 
                              checked ? [...prev, item.id!] : prev.filter(id => id !== item.id!)
                   )}}
                        />
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        <Badge className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeStyle(item.type)}`}>
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
            </div>
          )}
        </div>

        <AddEquipmentDialog 
          open={addDialogOpen} 
          onOpenChange={setAddDialogOpen}
          onEquipmentAdded={fetchEquipment}
        />
      </div>
    </AppLayout>
  );
}