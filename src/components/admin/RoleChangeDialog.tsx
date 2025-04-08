
import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
import { changeUserRole, requestRoleChange, approveRoleChange, cancelRoleChange, User } from "@/services/userService";

interface RoleChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

export function RoleChangeDialog({ 
  open, 
  onOpenChange, 
  user, 
  onSuccess 
}: RoleChangeDialogProps) {
  const { currentUser, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  
  if (!user || !currentUser) return null;
  
  const handleRoleChange = async () => {
    try {
      const newRole = user.role === "admin" ? "user" : "admin";
      
      // If current user is superadmin, directly change role
      if (isSuperAdmin) {
        await changeUserRole(user.uid, newRole);
        toast({
          title: "Sucesso",
          description: `Função de ${user.displayName} alterada para ${newRole === "admin" ? "Administrador" : "Usuário"}.`,
        });
        onSuccess();
        onOpenChange(false);
        return;
      }
      
      // If target is admin, we need approval
      if (user.role === "admin") {
        await requestRoleChange(user.uid, "admin", "user", currentUser.uid);
        toast({
          title: "Solicitação enviada",
          description: `Sua solicitação para alterar a função de ${user.displayName} foi registrada e aguarda aprovação.`,
        });
      } else {
        // If user becomes admin, just do it
        await changeUserRole(user.uid, "admin");
        toast({
          title: "Sucesso",
          description: `${user.displayName} agora é Administrador.`,
        });
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error changing role:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao alterar a função do usuário.",
        variant: "destructive"
      });
    }
  };

  const handleApproveChange = async () => {
    try {
      if (user.pendingRoleChange && currentUser) {
        await approveRoleChange(user.uid, currentUser.uid);
        toast({
          title: "Aprovação confirmada",
          description: `Você aprovou a alteração de função de ${user.displayName}.`,
        });
        onSuccess();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error approving role change:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao aprovar a alteração.",
        variant: "destructive"
      });
    }
  };

  const handleCancelChange = async () => {
    try {
      if (user.pendingRoleChange) {
        await cancelRoleChange(user.uid);
        toast({
          title: "Solicitação cancelada",
          description: `A solicitação para alterar a função de ${user.displayName} foi cancelada.`,
        });
        onSuccess();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error cancelling role change:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao cancelar a solicitação.",
        variant: "destructive"
      });
    }
  };

  // Check if this is a pending role change request that needs approval
  const isPendingApproval = user.pendingRoleChange && 
    !user.pendingRoleChange.approvals.includes(currentUser.uid) &&
    user.pendingRoleChange.requestedBy !== currentUser.uid;

  // Check if this is the user's own pending request
  const isOwnRequest = user.pendingRoleChange && 
    user.pendingRoleChange.requestedBy === currentUser.uid;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isPendingApproval 
              ? "Aprovar alteração de função" 
              : isOwnRequest 
                ? "Cancelar solicitação"
                : user.role === "admin" 
                  ? "Remover privilégios de Admin" 
                  : "Adicionar privilégios de Admin"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isPendingApproval ? (
              <>
                Existe uma solicitação para alterar a função de <strong>{user.displayName}</strong> de{" "}
                <strong>{user.pendingRoleChange.from === "admin" ? "Administrador" : "Usuário"}</strong> para{" "}
                <strong>{user.pendingRoleChange.to === "admin" ? "Administrador" : "Usuário"}</strong>.
                <br /><br />
                Você deseja aprovar esta alteração?
              </>
            ) : isOwnRequest ? (
              <>
                Você solicitou alterar a função de <strong>{user.displayName}</strong> de{" "}
                <strong>{user.pendingRoleChange.from === "admin" ? "Administrador" : "Usuário"}</strong> para{" "}
                <strong>{user.pendingRoleChange.to === "admin" ? "Administrador" : "Usuário"}</strong>.
                <br /><br />
                Esta solicitação ainda aguarda aprovação. Deseja cancelá-la?
              </>
            ) : (
              <>
                {user.role === "admin" ? (
                  <>
                    Tem certeza que deseja remover os privilégios de administrador de <strong>{user.displayName}</strong>?
                    <br /><br />
                    {!isSuperAdmin && "Esta ação requer aprovação de outro administrador."}
                  </>
                ) : (
                  <>
                    Tem certeza que deseja conceder privilégios de administrador para <strong>{user.displayName}</strong>?
                  </>
                )}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          {isPendingApproval ? (
            <AlertDialogAction onClick={handleApproveChange} className="bg-eccos-purple hover:bg-eccos-purple/90">
              Aprovar
            </AlertDialogAction>
          ) : isOwnRequest ? (
            <AlertDialogAction onClick={handleCancelChange} variant="destructive">
              Cancelar solicitação
            </AlertDialogAction>
          ) : (
            <AlertDialogAction onClick={handleRoleChange}>
              Confirmar
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
