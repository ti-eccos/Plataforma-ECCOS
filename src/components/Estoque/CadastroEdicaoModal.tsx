import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { ClipboardList } from 'lucide-react';

interface CadastroEdicaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  formState: any;
  editingItem: any;
  handleSubmit: (e: React.FormEvent) => void;
  handleChange: (field: string, value: any) => void;
  locationsByUnit: Record<string, string[]>;
}

const CadastroEdicaoModal: React.FC<CadastroEdicaoModalProps> = ({
  isOpen,
  onClose,
  formState,
  editingItem,
  handleSubmit,
  handleChange,
  locationsByUnit,
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          {editingItem ? 'Editar Item' : 'Novo Item'}
        </DialogTitle>
        <DialogDescription>
          Campos marcados com{' '}
          <span className="text-destructive">*</span> são obrigatórios
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label>
              Nome do Item <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Ex: Computador"
              value={formState.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
            />
          </div>
          {/* Quantidade */}
          <div className="space-y-2">
            <Label>
              Quantidade <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={isNaN(formState.quantidade) ? '' : formState.quantidade}
              onChange={(e) =>
                handleChange('quantidade', Number(e.target.value))
              }
            />
          </div>
          {/* Estado */}
          <div className="space-y-2">
            <Label>
              Estado <span className="text-destructive">*</span>
            </Label>
            <select
              value={formState.estado}
              onChange={(e) => handleChange('estado', e.target.value)}
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
          {/* Categoria */}
          <div className="space-y-2">
            <Label>
              Categoria <span className="text-destructive">*</span>
            </Label>
            <select
              value={formState.categoria}
              onChange={(e) => handleChange('categoria', e.target.value)}
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
              value={formState.unidade}
              onChange={(e) => handleChange('unidade', e.target.value)}
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
              value={formState.localizacao}
              onChange={(e) => handleChange('localizacao', e.target.value)}
              disabled={!formState.unidade}
              className="w-full h-10 rounded-md border px-3"
            >
              <option value="">Selecione uma localização</option>
              {formState.unidade &&
                locationsByUnit[formState.unidade]?.map((local) => (
                  <option key={local} value={local}>
                    {local}
                  </option>
                ))}
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
          <Button type="submit">
            {editingItem ? 'Salvar Alterações' : 'Adicionar Item'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);

export default CadastroEdicaoModal;