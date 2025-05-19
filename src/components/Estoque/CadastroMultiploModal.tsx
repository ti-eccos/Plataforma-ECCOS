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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { ListPlus } from 'lucide-react';

interface CadastroMultiploModalProps {
  isOpen: boolean;
  onClose: () => void;
  bulkFormState: {
    nomeBase: string;
    quantidadeItens: number;
    categoria: string;
    unidade: string;
    localizacao: string;
    estado: string;
  };
  handleBulkChange: (field: string, value: any) => void;
  handleBulkSubmit: (e: React.FormEvent) => void;
  locationsByUnit: Record<string, string[]>;
}

const CadastroMultiploModal: React.FC<CadastroMultiploModalProps> = ({
  isOpen,
  onClose,
  bulkFormState,
  handleBulkChange,
  handleBulkSubmit,
  locationsByUnit,
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ListPlus className="h-6 w-6" /> Cadastrar Múltiplos Itens
        </DialogTitle>
        <DialogDescription>
          Preencha os campos para cadastrar vários itens idênticos
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleBulkSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Nome Base */}
          <div className="space-y-2">
            <Label>
              Nome Base <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Ex: Mesa de escritório"
              value={bulkFormState.nomeBase}
              onChange={(e) => handleBulkChange('nomeBase', e.target.value)}
            />
          </div>
          {/* Quantidade de Itens */}
          <div className="space-y-2">
            <Label>
              Quantidade de Itens <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={bulkFormState.quantidadeItens}
              onChange={(e) =>
                handleBulkChange('quantidadeItens', Number(e.target.value))
              }
            />
          </div>
          {/* Categoria */}
          <div className="space-y-2">
            <Label>
              Categoria <span className="text-destructive">*</span>
            </Label>
            <select
              value={bulkFormState.categoria}
              onChange={(e) => handleBulkChange('categoria', e.target.value)}
              className="w-full h-10 rounded-md border px-3"
            >
              <option value="">Selecione uma categoria</option>
              <option value="TI">TI</option>
              <option value="Administrativo">Administrativo</option>
              <option value="Limpeza">Limpeza</option>
              <option value="Manutenção">Manutenção</option>
            </select>
          </div>
          {/* Unidade */}
          <div className="space-y-2">
            <Label>
              Unidade <span className="text-destructive">*</span>
            </Label>
            <select
              value={bulkFormState.unidade}
              onChange={(e) => handleBulkChange('unidade', e.target.value)}
              className="w-full h-10 rounded-md border px-3"
            >
              <option value="">Selecione uma unidade</option>
              {Object.keys(locationsByUnit).map((unidade) => (
                <option key={unidade} value={unidade}>
                  {unidade}
                </option>
              ))}
            </select>
          </div>
          {/* Localização */}
          <div className="space-y-2">
            <Label>
              Localização <span className="text-destructive">*</span>
            </Label>
            <select
              value={bulkFormState.localizacao}
              onChange={(e) => handleBulkChange('localizacao', e.target.value)}
              disabled={!bulkFormState.unidade}
              className="w-full h-10 rounded-md border px-3"
            >
              <option value="">Selecione uma localização</option>
              {bulkFormState.unidade &&
                locationsByUnit[bulkFormState.unidade]?.map((local) => (
                  <option key={local} value={local}>
                    {local}
                  </option>
                ))}
            </select>
          </div>
          {/* Estado */}
          <div className="space-y-2">
            <Label>
              Estado <span className="text-destructive">*</span>
            </Label>
            <select
              value={bulkFormState.estado}
              onChange={(e) => handleBulkChange('estado', e.target.value)}
              className="w-full h-10 rounded-md border px-3"
            >
              <option value="">Selecione um estado</option>
              <option value="Ótimo">Ótimo</option>
              <option value="Bom">Bom</option>
              <option value="Razoável">Razoável</option>
              <option value="Ruim">Ruim</option>
              <option value="Péssimo">Péssimo</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onClose();
            }}
          >
            Cancelar
          </Button>
          <Button type="submit">Adicionar Múltiplos Itens</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);

export default CadastroMultiploModal;