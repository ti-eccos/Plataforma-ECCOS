import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { Equipment, EquipmentType, addMultipleEquipment } from "@/services/equipmentService";

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquipmentAdded: () => void;
}

const equipmentTypes: EquipmentType[] = [
  "Chromebook",
  "iPad",
];

export default function AddEquipmentDialog({
  open,
  onOpenChange,
  onEquipmentAdded,
}: AddEquipmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [equipments, setEquipments] = useState<Array<Partial<Omit<Equipment, "id">>>>([{}]);
  const { toast } = useToast();

  const resetForm = () => {
    setEquipments([{}]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Converter explicitamente o tipo para EquipmentType
      const validatedEquipments = equipments.map(equipment => ({
        ...equipment,
        type: equipment.type as EquipmentType,
        name: equipment.name || "Sem nome",
      }));

      await addMultipleEquipment(validatedEquipments as Omit<Equipment, "id">[]);
      
      toast({
        title: "Sucesso",
        description: "Equipamentos adicionados com sucesso!",
      });
      onEquipmentAdded();
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao adicionar equipamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addNewEquipmentField = () => {
    setEquipments([...equipments, {}]);
  };

  const updateEquipmentField = (index: number, field: string, value: string) => {
    const newEquipments = [...equipments];
    newEquipments[index] = { ...newEquipments[index], [field]: value };
    setEquipments(newEquipments);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Equipamentos</DialogTitle>
          <DialogDescription>
            Preencha os detalhes dos novos equipamentos. Você pode adicionar vários de uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {equipments.map((equipment, index) => (
            <div key={index} className="space-y-4 border p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`name-${index}`}>Nome *</Label>
                  <Input
                    id={`name-${index}`}
                    value={equipment.name || ""}
                    onChange={(e) => updateEquipmentField(index, "name", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor={`type-${index}`}>Tipo *</Label>
                  <Select
                    value={equipment.type || ""}
                    onValueChange={(value) => updateEquipmentField(index, "type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addNewEquipmentField}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar outro equipamento
          </Button>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar equipamentos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}