
import * as React from "react";
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
import { toggleBlockUser, User } from "@/services/userService";
import { cn } from "@/lib/utils";

interface BlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

export function BlockUserDialog({ 
  open, 
  onOpenChange, 
  user, 
  onSuccess 
}: BlockUserDialogProps) {
  const { toast } = useToast();
  
  if (!user) return null;
  
  const isCurrentlyBlocked = user.blocked === true;
  
  const handleToggleBlock = async () => {
    try {
      await toggleBlockUser(user.uid, !isCurrentlyBlocked);
      toast({
        title: "Sucesso",
        description: `Usuário ${isCurrentlyBlocked ? "desbloqueado" : "bloqueado"} com sucesso.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error toggling user block status:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao alterar o status do usuário.",
        variant: "destructive"
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCurrentlyBlocked ? "Desbloquear usuário" : "Bloquear usuário"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isCurrentlyBlocked ? (
              <>
                Tem certeza que deseja desbloquear <strong>{user.displayName}</strong>?
                <br /><br />
                O usuário poderá acessar o sistema novamente após esta ação.
              </>
            ) : (
              <>
                Tem certeza que deseja bloquear <strong>{user.displayName}</strong>?
                <br /><br />
                O usuário não poderá acessar o sistema enquanto estiver bloqueado.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleToggleBlock}
            className={cn(
              isCurrentlyBlocked 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-destructive hover:bg-destructive/90"
            )}
          >
            {isCurrentlyBlocked ? "Desbloquear" : "Bloquear"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
