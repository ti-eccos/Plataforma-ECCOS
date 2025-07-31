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
import { getAllRoles, Role } from "@/services/rolesService";

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
  const [roles, setRoles] = useState<Role[]>([]); // Estado para armazenar as roles
  const [loadingRoles, setLoadingRoles] = useState(false); // Estado de carregamento

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  // Buscar roles quando o dialog abrir
  useEffect(() => {
    const fetchRoles = async () => {
      if (open) {
        setLoadingRoles(true);
        try {
          const rolesList = await getAllRoles();
          setRoles(rolesList);
        } catch (error) {
          console.error("Erro ao buscar roles:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar as funções disponíveis",
            variant: "destructive",
          });
        } finally {
          setLoadingRoles(false);
        }
      }
    };

    fetchRoles();
  }, [open, toast]);

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
        description: `Função alterada para ${roles.find(r => r.id === selectedRole)?.name || selectedRole}`,
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
              disabled={isSubmitting || loadingRoles}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={loadingRoles ? "Carregando funções..." : "Selecione uma função"} />
              </SelectTrigger>
              <SelectContent>
                {loadingRoles ? (
                  // Exibe apenas o placeholder no SelectTrigger enquanto carrega
                  null
                ) : (
                  roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))
                )}
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
            disabled={isSubmitting || !selectedRole || selectedRole === user?.role || loadingRoles}
          >
            {isSubmitting ? "Salvando..." : "Confirmar Alteração"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};