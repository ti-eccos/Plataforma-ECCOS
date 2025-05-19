import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

import { Trash2, Copy, Edit, ClipboardList } from 'lucide-react';

// Ajuste o caminho conforme a estrutura da sua aplicação
import { ItemEstoque } from '@/components/Estoque/types';

interface DetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItemDetails: ItemEstoque | null;
  onDelete: () => void;
  onClone: () => void;
  onEdit: () => void;
}

const DetalhesModal: React.FC<DetalhesModalProps> = ({
  isOpen,
  onClose,
  selectedItemDetails,
  onDelete,
  onClone,
  onEdit,
}) => {
  if (!selectedItemDetails) return null;

  const estadoClassNames: Record<string, string> = {
    Ótimo: 'bg-green-100 text-green-800',
    Bom: 'bg-blue-100 text-blue-800',
    Razoável: 'bg-yellow-100 text-yellow-800',
    Ruim: 'bg-orange-100 text-orange-800',
    Péssimo: 'bg-red-100 text-red-800',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6" /> Detalhes do Item
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre o item do estoque
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome:</Label>
            <p className="font-medium">{selectedItemDetails.nome}</p>
          </div>
          <div className="space-y-2">
            <Label>Quantidade:</Label>
            <p>{selectedItemDetails.quantidade}</p>
          </div>
          <div className="space-y-2">
            <Label>Categoria:</Label>
            <p>{selectedItemDetails.categoria}</p>
          </div>
          <div className="space-y-2">
            <Label>Valor Unitário:</Label>
            <p>
              {selectedItemDetails.valorUnitario?.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }) || 'Não informado'}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Valor Total:</Label>
            <p>
              {(selectedItemDetails.quantidade *
                (selectedItemDetails.valorUnitario || 0)
              ).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Unidade:</Label>
            <p>{selectedItemDetails.unidade}</p>
          </div>
          <div className="space-y-2">
            <Label>Localização:</Label>
            <p>{selectedItemDetails.localizacao}</p>
          </div>
          <div className="space-y-2">
            <Label>Estado:</Label>
            <p
              className={`inline-flex items-center rounded-md px-2 py-1 text-sm font-medium ${
                estadoClassNames[selectedItemDetails.estado] ||
                'bg-gray-100 text-gray-800'
              }`}
            >
              {selectedItemDetails.estado}
            </p>
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Descrição:</Label>
            <p>{selectedItemDetails.descricao || 'Não informada'}</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
          <Button onClick={onClone}>
            <Copy className="mr-2 h-4 w-4" /> Copiar
          </Button>
          <Button onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DetalhesModal;