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
import { Textarea } from '@/components/ui/textarea'; // Adicionado

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
    descricao: string; // Adicionado
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
    <DialogContent className="max-w-2xl w-full bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="flex flex-col h-[80vh]">
        {/* Cabeçalho Fixo */}
        <DialogHeader className="p-6 pb-2 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
          <DialogTitle className="flex items-center gap-2">
            <ListPlus className="h-6 w-6 text-purple-500" /> 
            <span className="bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
              Cadastrar Múltiplos Itens
            </span>
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-gray-500 mt-2">
              Preencha os campos para cadastrar vários itens idênticos
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Conteúdo Rolável */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form onSubmit={handleBulkSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nome Base */}
              <div className="space-y-2">
                <Label>
                  Nome Base <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Ex: Mesa de escritório"
                  value={bulkFormState.nomeBase}
                  onChange={(e) => handleBulkChange('nomeBase', e.target.value)}
                  className="focus:ring-2 focus:ring-eccos-purple focus:border-eccos-purple outline-none transition-all"
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
                  className="focus:ring-2 focus:ring-eccos-purple focus:border-eccos-purple outline-none transition-all"
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
                  className="w-full h-10 rounded-md border px-3 focus:ring-2 focus:ring-eccos-purple focus:border-eccos-purple outline-none transition-all"
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
                  className="w-full h-10 rounded-md border px-3 focus:ring-2 focus:ring-eccos-purple focus:border-eccos-purple outline-none transition-all"
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
                  className={`w-full h-10 rounded-md border px-3 focus:ring-2 focus:ring-eccos-purple focus:border-eccos-purple outline-none transition-all ${
                    !bulkFormState.unidade ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''
                  }`}
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
                  className="w-full h-10 rounded-md border px-3 focus:ring-2 focus:ring-eccos-purple focus:border-eccos-purple outline-none transition-all"
                >
                  <option value="">Selecione um estado</option>
                  <option value="Ótimo">Ótimo</option>
                  <option value="Bom">Bom</option>
                  <option value="Razoável">Razoável</option>
                  <option value="Ruim">Ruim</option>
                  <option value="Péssimo">Péssimo</option>
                </select>
              </div>
              
              {/* Descrição */}
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva os itens (opcional)"
                  value={bulkFormState.descricao || ''}
                  onChange={(e) => handleBulkChange('descricao', e.target.value)}
                  className="focus:ring-2 focus:ring-eccos-purple focus:border-eccos-purple outline-none transition-all"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Rodapé Fixo */}
        <DialogFooter className="p-6 border-t border-gray-100 bg-white sticky bottom-0 z-10">
          <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end w-full">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleBulkSubmit} 
              className="w-full sm:w-auto"
            >
              Adicionar Múltiplos Itens
            </Button>
          </div>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
);

export default CadastroMultiploModal;