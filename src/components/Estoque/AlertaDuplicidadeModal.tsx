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

import { Button } from '@/components/ui/button';

interface AlertaDuplicidadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  onCreateAnyway: () => void;
  onEditExisting: () => void;
}

const AlertaDuplicidadeModal: React.FC<AlertaDuplicidadeModalProps> = ({
  isOpen,
  onClose,
  itemName,
  onCreateAnyway,
  onEditExisting,
}) => (
  <AlertDialog open={isOpen} onOpenChange={onClose}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Item já existe</AlertDialogTitle>
        <AlertDialogDescription>
          Um item com o nome &quot;{itemName}&quot; já está cadastrado no estoque.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="py-4">Você quer:</div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCreateAnyway}>
          Criar Novo Item
        </Button>
        <Button onClick={onEditExisting}>Editar Item Existente</Button>
      </div>
    </AlertDialogContent>
  </AlertDialog>
);

export default AlertaDuplicidadeModal;