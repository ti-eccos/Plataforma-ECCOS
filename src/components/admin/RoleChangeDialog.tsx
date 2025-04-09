
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
import { changeUserRole, User } from "@/services/userService";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RoleChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
  requiresApproval?: boolean;
}

export function RoleChangeDialog({ 
  open, 
  onOpenChange, 
  user, 
  onSuccess,
  requiresApproval = false,
}: RoleChangeDialogProps) {
  const { toast } = useToast();
  const [approvalState, setApprovalState] = React.useState<'initial' | 'pending' | 'approved'>('initial');
  const [adminCode, setAdminCode] = React.useState<string>('');
  
  React.useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setApprovalState('initial');
      setAdminCode('');
    }
  }, [open]);
  
  if (!user) return null;
  
  const isCurrentlyAdmin = user.role === 'admin';
  
  const handleRequestApproval = async () => {
    // In a real application, this would send a notification or email to another admin
    // For this demo, we'll just simulate the approval flow
    setApprovalState('pending');
    
    toast({
      title: "Solicitação enviada",
      description: "Aguardando aprovação de outro administrador.",
    });
    
    // Simulate waiting for approval
    setTimeout(() => {
      setApprovalState('approved');
      toast({
        title: "Aprovação recebida",
        description: "Outro administrador aprovou a alteração.",
      });
    }, 3000);
  };
  
  const handleChangeRole = async () => {
    try {
      await changeUserRole(user.uid, isCurrentlyAdmin ? 'user' : 'admin');
      
      toast({
        title: "Sucesso",
        description: `Usuário alterado para ${isCurrentlyAdmin ? "usuário comum" : "administrador"} com sucesso.`,
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error changing user role:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao alterar o papel do usuário.",
        variant: "destructive"
      });
    }
  };
  
  const handleSuperAdminApproval = () => {
    // Check if the code is correct (in a real app, this would be a more secure process)
    if (adminCode === '123456') { // Demo code
      setApprovalState('approved');
      toast({
        title: "Código válido",
        description: "Super administrador autorizou a alteração.",
      });
    } else {
      toast({
        title: "Código inválido",
        description: "O código informado não é válido.",
        variant: "destructive"
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCurrentlyAdmin ? "Remover privilégios de administrador" : "Conceder privilégios de administrador"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isCurrentlyAdmin ? (
              <>
                Tem certeza que deseja remover os privilégios de administrador de <strong>{user.displayName}</strong>?
                <br /><br />
                Esta ação removerá o acesso deste usuário a funcionalidades administrativas.
              </>
            ) : (
              <>
                Tem certeza que deseja conceder privilégios de administrador para <strong>{user.displayName}</strong>?
                <br /><br />
                Esta ação dará ao usuário acesso a funcionalidades administrativas sensíveis.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {requiresApproval && approvalState === 'initial' && (
          <div className="flex flex-col space-y-4">
            <p className="text-sm text-amber-500">
              Esta ação requer aprovação adicional de um superadministrador ou outro administrador.
            </p>
            <div className="flex justify-end space-x-2">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <Button 
                onClick={handleRequestApproval}
                className={cn(
                  isCurrentlyAdmin 
                    ? "bg-amber-600 hover:bg-amber-700" 
                    : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                Solicitar Aprovação
              </Button>
            </div>
          </div>
        )}
        
        {requiresApproval && approvalState === 'pending' && (
          <div className="flex flex-col space-y-4">
            <p className="text-sm">
              Aguardando aprovação... ou insira o código de superadministrador:
            </p>
            <input 
              type="text" 
              placeholder="Código de autorização" 
              className="p-2 border rounded text-black"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <Button onClick={handleSuperAdminApproval}>
                Verificar Código
              </Button>
            </div>
          </div>
        )}
        
        {(!requiresApproval || approvalState === 'approved') && (
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button 
              onClick={handleChangeRole}
              className={cn(
                isCurrentlyAdmin 
                  ? "bg-amber-600 hover:bg-amber-700" 
                  : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {isCurrentlyAdmin ? "Remover Administrador" : "Tornar Administrador"}
            </Button>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
