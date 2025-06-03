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
<DialogContent className="w-full max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-xl rounded-lg p-4 max-h-[80vh] overflow-y-auto">        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ClipboardList className="h-5 w-5" /> Detalhes do Item
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Informações completas sobre o item do estoque
          </DialogDescription>
        </DialogHeader>

        {/* Conteúdo Responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Nome:</Label>
            <p className="font-medium text-sm">{selectedItemDetails.nome}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium">Quantidade:</Label>
            <p className="text-sm">{selectedItemDetails.quantidade}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium">Categoria:</Label>
            <p className="text-sm">{selectedItemDetails.categoria}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium">Valor Unitário:</Label>
            <p className="text-sm">
              {selectedItemDetails.valorUnitario?.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }) || 'Não informado'}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium">Valor Total:</Label>
            <p className="text-sm">
              {(selectedItemDetails.quantidade *
                (selectedItemDetails.valorUnitario || 0)
              ).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium">Unidade:</Label>
            <p className="text-sm">{selectedItemDetails.unidade}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium">Localização:</Label>
            <p className="text-sm">{selectedItemDetails.localizacao}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium">Estado:</Label>
            <p
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                estadoClassNames[selectedItemDetails.estado] ||
                'bg-gray-100 text-gray-800'
              }`}
            >
              {selectedItemDetails.estado}
            </p>
          </div>
          <div className="col-span-1 sm:col-span-2 space-y-1">
            <Label className="text-xs font-medium">Descrição:</Label>
            <p className="text-sm">{selectedItemDetails.descricao || 'Não informada'}</p>
          </div>
        </div>

        {/* Botões responsivos */}
        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2 justify-end">
          <Button variant="destructive" onClick={onDelete} className="w-full sm:w-auto">
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
          <Button onClick={onClone} className="w-full sm:w-auto">
            <Copy className="mr-2 h-4 w-4" /> Copiar
          </Button>
          <Button onClick={onEdit} className="w-full sm:w-auto">
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DetalhesModal;