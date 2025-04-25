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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AddEquipmentDialog from "@/components/AddEquipmentDialog";
import AppLayout from "@/components/AppLayout";
import { Checkbox } from "@/components/ui/checkbox";

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
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Equipamentos para Empréstimo</h1>
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
              >
                <Trash className="mr-2 h-4 w-4" />
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

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Lista de Equipamentos</CardTitle>
            <CardDescription>
              Gerencie os equipamentos disponíveis para empréstimo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eccos-blue"></div>
              </div>
            ) : equipment.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                Nenhum equipamento cadastrado para empréstimo.
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={selectedIds.length === equipment.length && equipment.length > 0}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead className="w-[150px]">Tipo</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="w-[80px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipment.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(item.id!)}
                            onCheckedChange={(checked) => {
                              setSelectedIds(prev => 
                                checked ? [...prev, item.id!] : prev.filter(id => id !== item.id!)
                    )}}
                          />
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeStyle(item.type)}`}>
                            {item.type}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSingle(item.id!)}
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          >
                            <Trash className="h-4 w-4" />
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

        <AddEquipmentDialog 
          open={addDialogOpen} 
          onOpenChange={setAddDialogOpen}
          onEquipmentAdded={fetchEquipment}
        />
      </div>
    </AppLayout>
  );
}