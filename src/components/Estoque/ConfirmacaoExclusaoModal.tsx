import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmacaoExclusaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  onConfirm: () => void;
}

const ConfirmacaoExclusaoModal: React.FC<ConfirmacaoExclusaoModalProps> = ({
  isOpen,
  onClose,
  itemName,
  onConfirm,
}) => (
  <AlertDialog open={isOpen} onOpenChange={onClose}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
        <AlertDialogDescription>
          Esta ação não pode ser desfeita. O item será permanentemente removido.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="py-4">
        Tem certeza que deseja excluir o item &quot;{itemName}&quot;?
      </div>
      <div className="flex justify-end gap-2">
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="bg-destructive hover:bg-destructive/90"
        >
          Confirmar Exclusão
        </AlertDialogAction>
      </div>
    </AlertDialogContent>
  </AlertDialog>
);

export default ConfirmacaoExclusaoModal;