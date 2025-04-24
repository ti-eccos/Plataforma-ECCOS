
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Equipment, updateEquipment, deleteEquipment } from "@/services/equipmentService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Trash2 } from "lucide-react";
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

interface EquipmentDetailsDialogProps {
  equipment: Equipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquipmentUpdated: () => void;
}

const EquipmentDetailsDialog = ({
  equipment,
  open,
  onOpenChange,
  onEquipmentUpdated,
}: EquipmentDetailsDialogProps) => {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Equipment>>({});
  const { toast } = useToast();

  useState(() => {
    if (equipment && open) {
      setFormData({ ...equipment });
      setEditMode(false);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    if (!equipment?.id || !formData) return;

    setLoading(true);
    try {
      await updateEquipment(equipment.id, formData);
      toast({
        title: "Equipamento atualizado",
        description: "As informações foram atualizadas com sucesso."
      });
      onEquipmentUpdated();
      setEditMode(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o equipamento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!equipment?.id) return;

    setLoading(true);
    try {
      await deleteEquipment(equipment.id);
      toast({
        title: "Equipamento excluído",
        description: "O equipamento foi removido com sucesso."
      });
      onEquipmentUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o equipamento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  if (!equipment) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Editar Equipamento" : "Detalhes do Equipamento"}
            </DialogTitle>
            <DialogDescription>
              {editMode
                ? "Edite as informações do equipamento abaixo."
                : "Informações detalhadas sobre o equipamento."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                {editMode ? (
                  <Input
                    id="name"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{equipment.name}</div>
                )}
              </div>

              <div>
                <Label htmlFor="type">Tipo</Label>
                {editMode ? (
                  <Select
                    value={formData.type || ""}
                    onValueChange={(value) => handleSelectChange("type", value)}
                  >
                    <SelectTrigger>
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
                  <div className="p-2 border rounded-md">{equipment.type}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                {editMode ? (
                  <Select
                    value={formData.status || ""}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger>
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
                  <div className="p-2 border rounded-md">{equipment.status}</div>
                )}
              </div>

              <div>
                <Label htmlFor="serialNumber">Número de Série</Label>
                {editMode ? (
                  <Input
                    id="serialNumber"
                    name="serialNumber"
                    value={formData.serialNumber || ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="p-2 border rounded-md">
                    {equipment.serialNumber || "N/A"}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Marca</Label>
                {editMode ? (
                  <Input
                    id="brand"
                    name="brand"
                    value={formData.brand || ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="p-2 border rounded-md">
                    {equipment.brand || "N/A"}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="model">Modelo</Label>
                {editMode ? (
                  <Input
                    id="model"
                    name="model"
                    value={formData.model || ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="p-2 border rounded-md">
                    {equipment.model || "N/A"}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchaseDate">Data de Compra</Label>
                {editMode ? (
                  <Input
                    id="purchaseDate"
                    name="purchaseDate"
                    type="date"
                    value={formData.purchaseDate || ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="p-2 border rounded-md">
                    {equipment.purchaseDate || "N/A"}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="warrantyUntil">Garantia até</Label>
                {editMode ? (
                  <Input
                    id="warrantyUntil"
                    name="warrantyUntil"
                    type="date"
                    value={formData.warrantyUntil || ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="p-2 border rounded-md">
                    {equipment.warrantyUntil || "N/A"}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="location">Localização</Label>
              {editMode ? (
                <Input
                  id="location"
                  name="location"
                  value={formData.location || ""}
                  onChange={handleInputChange}
                />
              ) : (
                <div className="p-2 border rounded-md">
                  {equipment.location || "N/A"}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              {editMode ? (
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes || ""}
                  onChange={handleInputChange}
                  rows={3}
                />
              ) : (
                <div className="p-2 border rounded-md min-h-[80px]">
                  {equipment.notes || "Sem observações"}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {editMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
                <Button variant="outline" onClick={() => setEditMode(true)}>
                  Editar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EquipmentDetailsDialog;
