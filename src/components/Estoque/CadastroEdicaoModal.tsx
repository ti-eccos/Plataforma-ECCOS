import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';

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
}) => {
  // Estado para controlar o modo: Local ou Responsável
  const [destinationType, setDestinationType] = useState<'local' | 'responsible'>(
    formState.responsavel ? 'responsible' : 'local'
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="flex flex-col h-[80vh] max-h-[80vh]">
          {/* Cabeçalho Fixo */}
          <DialogHeader className="p-6 pb-2 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-purple-500" />
              <span className="bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                {editingItem ? 'Editar Item' : 'Novo Item'}
              </span>
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm text-gray-500 mt-2">
                Campos marcados com <span className="text-destructive">*</span> são obrigatórios
              </div>
            </DialogDescription>
          </DialogHeader>

          {/* Conteúdo Rolável */}
          <div className="flex-1 overflow-y-auto p-6 pb-16">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="space-y-2">
                  <Label>
                    Nome do Item <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Ex: Computador"
                    value={formState.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    className="focus:ring-2 focus:ring-eccos-purple focus:border-eccos-purple outline-none transition-all"
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
                    className="focus:ring-2 focus:ring-eccos-purple focus:border-eccos-purple outline-none transition-all"
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

                {/* Categoria */}
                <div className="space-y-2">
                  <Label>
                    Categoria <span className="text-destructive">*</span>
                  </Label>
                  <select
                    value={formState.categoria}
                    onChange={(e) => handleChange('categoria', e.target.value)}
                    className="w-full h-10 rounded-md border px-3 focus:ring-2 focus:ring-eccos-purple focus:border-eccos-purple outline-none transition-all"
                  >
                    <option value="">Selecione uma categoria</option>
                    <option value="TI">TI</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Limpeza">Limpeza</option>
                    <option value="Manutenção">Manutenção</option>
                  </select>
                </div>

                {/* Data de Recebimento */}
                <div className="space-y-2">
                  <Label>Data de Recebimento</Label>
                  <Input
                    type="date"
                    value={formState.dataRecebimento || ''}
                    onChange={(e) => handleChange('dataRecebimento', e.target.value)}
                    className="focus:ring-2 focus:ring-eccos-purple focus:border-eccos-purple outline-none transition-all"
                  />
                </div>

                {/* Nota Fiscal */}
                <div className="space-y-2">
                  <Label>Nota Fiscal</Label>
                  <Input
                    placeholder="Número da nota fiscal"
                    value={formState.notaFiscal || ''}
                    onChange={(e) => handleChange('notaFiscal', e.target.value)}
                    className="focus:ring-2 focus:ring-eccos-purple focus:border-eccos-purple outline-none transition-all"
                  />
                </div>

                {/* Número do Pedido */}
                <div className="space-y-2">
                  <Label>Número do Pedido</Label>
                  <Input
                    placeholder="Número do pedido"
                    value={formState.numeroPedido || ''}
                    onChange={(e) => handleChange('numeroPedido', e.target.value)}
                    className="focus:ring-2 focus:ring-eccos-purple focus:border-eccos-purple outline-none transition-all"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descreva o item (opcional)"
                    value={formState.descricao || ''}
                    onChange={(e) => handleChange('descricao', e.target.value)}
                    className="w-full h-20 focus:ring-2 focus:ring-eccos-purple focus:border-eccos-purple outline-none transition-all"
                  />
                </div>

                {/* Toggle entre Local e Responsável */}
                <div className="col-span-1 sm:col-span-2 space-y-4">
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant={destinationType === 'local' ? 'default' : 'outline'}
                      onClick={() => setDestinationType('local')}
                      className="flex-1"
                    >
                      Local
                    </Button>
                    <Button
                      type="button"
                      variant={destinationType === 'responsible' ? 'default' : 'outline'}
                      onClick={() => setDestinationType('responsible')}
                      className="flex-1"
                    >
                      Responsável
                    </Button>
                  </div>

                  {/* Campo condicional */}
                  {destinationType === 'responsible' ? (
                    // Campo: Nome do Responsável
                    <div className="space-y-2">
                      <Label>
                        Nome do Responsável <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="Ex: João Silva"
                        value={formState.responsavel || ''}
                        onChange={(e) => handleChange('responsavel', e.target.value)}
                        className="focus:ring-2 focus:ring-eccos-purple focus:border-eccos-purple outline-none transition-all"
                      />
                    </div>
                  ) : (
                    // Campos: Unidade e Localização
                    <>
                      <div className="space-y-2">
                        <Label>
                          Unidade <span className="text-destructive">*</span>
                        </Label>
                        <select
                          value={formState.unidade}
                          onChange={(e) => handleChange('unidade', e.target.value)}
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

                      <div className="space-y-2">
                        <Label>
                          Localização <span className="text-destructive">*</span>
                        </Label>
                        <select
                          value={formState.localizacao}
                          onChange={(e) => handleChange('localizacao', e.target.value)}
                          disabled={!formState.unidade}
                          className={`w-full h-10 rounded-md border px-3 focus:ring-2 focus:ring-eccos-purple focus:border-eccos-purple outline-none transition-all ${
                            !formState.unidade
                              ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                              : ''
                          }`}
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
                    </>
                  )}
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
                onClick={handleSubmit} 
                className="w-full sm:w-auto"
              >
                {editingItem ? 'Salvar Alterações' : 'Adicionar Item'}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CadastroEdicaoModal;