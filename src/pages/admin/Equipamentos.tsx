
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getSortedEquipmentForLending, Equipment } from "@/services/equipmentService";
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
import DeleteEquipmentDialog from "@/components/admin/DeleteEquipmentDialog";
import AppLayout from "@/components/AppLayout";

export default function Equipamentos() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
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

  const handleDelete = (item: Equipment) => {
    setSelectedEquipment(item);
    setDeleteDialogOpen(true);
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
          <Button 
            className="bg-eccos-blue hover:bg-eccos-blue/80" 
            onClick={() => setAddDialogOpen(true)}
          >
            Adicionar Equipamento
          </Button>
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
                      <TableHead className="w-[150px]">Tipo</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="w-[80px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipment.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
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
                            onClick={() => handleDelete(item)}
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Excluir {item.name}</span>
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

      <AddEquipmentDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        onEquipmentAdded={fetchEquipment}
      />

      {selectedEquipment && (
        <DeleteEquipmentDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          equipmentId={selectedEquipment.id || ""}
          equipmentName={selectedEquipment.name}
          onEquipmentDeleted={fetchEquipment}
        />
      )}
    </AppLayout>
  );
}
