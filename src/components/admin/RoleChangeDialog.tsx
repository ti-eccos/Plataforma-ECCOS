import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { changeUserRole, User, UserRole } from "@/services/userService";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";

const ROLE_OPTIONS = [
  { value: "user", label: "Usuário Padrão" },
  { value: "financeiro", label: "Financeiro" },
  { value: "operacional", label: "Manutenção" },
  { value: "admin", label: "Administrador" },
];

interface RoleChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

export const RoleChangeDialog = ({ open, onOpenChange, user, onSuccess }: RoleChangeDialogProps) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || "user");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { refreshUser, reloadPermissions } = useAuth();

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || !selectedRole) return;
    
    setIsSubmitting(true);
    try {
      await changeUserRole(user.uid, selectedRole);
      
      // Disparar evento para atualizar a sidebar
      window.dispatchEvent(new CustomEvent('userRoleChanged'));
      
      // Se o usuário atual estiver alterando a si mesmo
      if (user.uid === auth.currentUser?.uid) {
        await refreshUser();
        await reloadPermissions();
      }
      
      onSuccess();
      onOpenChange(false);
      
      toast({
        title: "Sucesso",
        description: `Função alterada para ${ROLE_OPTIONS.find(r => r.value === selectedRole)?.label}`,
      });
    } catch (error) {
      console.error("Error changing role:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a função",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Função do Usuário</DialogTitle>
          <DialogDescription>
            Selecione a nova função para {user?.displayName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Nova Função
            </Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || !selectedRole || selectedRole === user?.role}
          >
            {isSubmitting ? "Salvando..." : "Confirmar Alteração"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};