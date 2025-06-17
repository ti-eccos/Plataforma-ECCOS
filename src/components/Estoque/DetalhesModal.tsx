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
    Ótimo: 'bg-green-500 text-white',
    Bom: 'bg-blue-500 text-white',
    Razoável: 'bg-yellow-500 text-white',
    Ruim: 'bg-orange-500 text-white',
    Péssimo: 'bg-red-500 text-white',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="flex flex-col h-[80vh]">
          {/* Cabeçalho Fixo */}
          <DialogHeader className="p-6 pb-2 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-purple-500" />
              <span className="bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                Detalhes do Item
              </span>
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm text-gray-500 mt-2">
                Informações completas sobre o item do estoque
              </div>
            </DialogDescription>
          </DialogHeader>

          {/* Conteúdo Rolável */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                <p className="text-sm whitespace-pre-wrap break-words">
                  {selectedItemDetails.descricao || 'Não informada'}
                </p>
              </div>
            </div>
          </div>

          {/* Rodapé Fixo */}
          <DialogFooter className="p-6 border-t border-gray-100 bg-white sticky bottom-0 z-10">
            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end w-full">
              <Button variant="destructive" onClick={onDelete} className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </Button>
              <Button onClick={onClone} className="w-full sm:w-auto">
                <Copy className="mr-2 h-4 w-4" /> Copiar
              </Button>
              <Button onClick={onEdit} className="w-full sm:w-auto">
                <Edit className="mr-2 h-4 w-4" /> Editar
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetalhesModal;