import React, { useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  PlusCircle,
  Trash2,
  Edit,
  Package,
  Warehouse,
  ClipboardList,
  Eye,
  ListPlus,
  Copy,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import {
  doc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import AppLayout from '@/components/AppLayout';

interface ItemEstoque {
  id?: string;
  nome: string;
  quantidade: number;
  valorUnitario?: number;
  descricao?: string;
  categoria: string;
  unidade: string;
  localizacao: string;
  estado: 'Ótimo' | 'Bom' | 'Razoável' | 'Ruim' | 'Péssimo';
}

type EstadoEstoque = 'Ótimo' | 'Bom' | 'Razoável' | 'Ruim' | 'Péssimo';

const locationsByUnit = {
  'Berçário e Educação Infantil': [
    'Recepção',
    'Sala de reuniões',
    'Cozinha',
    'Pátio',
    'Sala de música',
    'Sala de science',
    'Berçário 2',
    'Berçário 3',
    'Refeitório',
    'Sala de movimento',
    'Pátio integral',
    'Infantil 1',
    'Infantil 2',
  ],
  Fundamental: [
    'Recepção',
    'Secretaria',
    'Sala de atendimento',
    'Sala de atendimento (Laranja)',
    'Sala de auxiliar de coordenação fundamental 1',
    'Sala de oficinas',
    'Sala de música',
    'Sala de science',
    'Integral',
    '4º Ano',
    'Patio (Cantina)',
    'Refeitório',
    'Biblioteca (Inferior)',
    '3º Ano',
    '2º Ano',
    '1º Ano',
    'Sala dos professores',
    'Sala de Linguas',
    'Coordenação de linguas/Fundamental 2',
    'Sala de artes',
    'Coordenação Fundamental 1 / Coordenação de matemática',
    '8º ano',
    '7º Ano',
    'Apoio pedagógico',
    'Orientação educacional',
    'TI',
    'Sala de oficinas (Piso superior)',
    '5º Ano',
    '6º Ano',
    'Biblioteca (Superior)',
    'Sala de convivência',
    '9º Ano',
  ],
  Anexo: [
    'Sala de manutenção',
    'Sala de reuniões',
    'Refeitório',
    'Cozinha',
    'Nutrição',
    'Controladoria',
    'Financeiro',
    'Operacional',
    'Mantenedoria',
  ],
};

const Estoque = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemEstoque | null>(null);
  const [selectedItemDetails, setSelectedItemDetails] = useState<ItemEstoque | null>(
    null
  );
  const [editingItem, setEditingItem] = useState<ItemEstoque | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroLocalizacao, setFiltroLocalizacao] = useState('');
  const [formState, setFormState] = useState<Omit<ItemEstoque, 'id'>>({
    nome: '',
    quantidade: NaN,
    valorUnitario: undefined,
    descricao: undefined,
    categoria: '',
    unidade: '',
    localizacao: '',
    estado: 'Bom',
  });

  // Controle de duplicidade
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateItem, setDuplicateItem] = useState<ItemEstoque | null>(null);

  // Estado para formulário de múltiplos itens
  const [bulkFormState, setBulkFormState] = useState({
    nomeBase: '',
    quantidadeItens: 1,
    categoria: '',
    unidade: '',
    localizacao: '',
    estado: 'Bom' as EstadoEstoque,
  });

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ['estoque'],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, 'estoque'));
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ItemEstoque[];
    },
  });

  const itensFiltrados = itens.filter((item) => {
    const matchCategoria = filtroCategoria ? item.categoria === filtroCategoria : true;
    const matchLocalizacao = filtroLocalizacao
      ? item.localizacao === filtroLocalizacao
      : true;
    return matchCategoria && matchLocalizacao;
  });

  const todasCategorias = ['TI', 'Administrativo', 'Limpeza', 'Manutenção'];
  const localizacoesCadastradas = Array.from(
    new Set(itens.map((item) => item.localizacao).filter((local) => local !== ''))
  );

  const addMutation = useMutation({
    mutationFn: async (novoItem: Omit<ItemEstoque, 'id'>) => {
      await addDoc(collection(db, 'estoque'), novoItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      toast.success('Item adicionado com sucesso');
    },
  });

  const addMultipleMutation = useMutation({
    mutationFn: async (novosItens: Omit<ItemEstoque, 'id'>[]) => {
      const promises = novosItens.map(item => addDoc(collection(db, 'estoque'), item));
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      toast.success('Itens adicionados com sucesso');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (item: ItemEstoque) => {
      if (!item.id) return;
      const { id, ...data } = item;
      await updateDoc(doc(db, 'estoque', id), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      toast.success('Item atualizado com sucesso');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'estoque', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      toast.success('Item removido com sucesso');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const itemName = formState.nome.trim();

    if (!itemName) {
      toast.error('Nome do item é obrigatório');
      return;
    }

    if (formState.quantidade <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    if (!formState.categoria) {
      toast.error('Selecione uma categoria');
      return;
    }

    if (!formState.unidade) {
      toast.error('Selecione uma unidade');
      return;
    }

    if (!formState.localizacao) {
      toast.error('Selecione uma localização');
      return;
    }

    // Verifica se o nome já existe no estoque
    const existingItem = itens.find((item) => item.nome === itemName);

    if (existingItem && !editingItem) {
      // Mostra alerta caso o item já exista
      setDuplicateItem(existingItem);
      setShowDuplicateDialog(true);
      return;
    }

    // Caso não seja duplicado ou esteja editando, prossegue normalmente
    const itemData = {
      nome: itemName,
      quantidade: formState.quantidade,
      categoria: formState.categoria,
      unidade: formState.unidade,
      localizacao: formState.localizacao,
      estado: formState.estado,
      ...(formState.valorUnitario !== undefined && {
        valorUnitario: formState.valorUnitario,
      }),
      ...(formState.descricao && { descricao: formState.descricao }),
    };

    if (editingItem) {
      updateMutation.mutate({ ...itemData, id: editingItem.id });
    } else {
      addMutation.mutate(itemData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const {
      nomeBase,
      quantidadeItens,
      categoria,
      unidade,
      localizacao,
      estado,
    } = bulkFormState;
    if (!nomeBase.trim()) {
      toast.error('Nome base é obrigatório');
      return;
    }
    if (quantidadeItens <= 0 || !Number.isInteger(quantidadeItens)) {
      toast.error('Quantidade deve ser um número inteiro positivo');
      return;
    }
    if (!categoria || !unidade || !localizacao) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }
    const itemsToAdd = Array.from({ length: quantidadeItens }).map((_, index) => ({
      nome: `${nomeBase} ${index + 1}`,
      quantidade: 1,
      categoria,
      unidade,
      localizacao,
      estado,
    }));
    addMultipleMutation.mutate(itemsToAdd);
    setIsBulkModalOpen(false);
    setBulkFormState({
      nomeBase: '',
      quantidadeItens: 1,
      categoria: '',
      unidade: '',
      localizacao: '',
      estado: 'Bom',
    });
  };

  const resetForm = () => {
    setFormState({
      nome: '',
      quantidade: NaN,
      valorUnitario: undefined,
      descricao: undefined,
      categoria: '',
      unidade: '',
      localizacao: '',
      estado: 'Bom',
    });
    setEditingItem(null);
  };

  const handleEdit = (item: ItemEstoque) => {
    setEditingItem(item);
    setFormState(item);
    setIsDialogOpen(true);
  };

  const handleClone = (item: ItemEstoque) => {
    const clonedItem = { ...item };
    delete clonedItem.id;
    setEditingItem(null);
    setFormState(clonedItem);
    setIsDialogOpen(true);
  };

  // Função chamada ao confirmar "Criar Novo"
  const handleCreateAnyway = () => {
    setShowDuplicateDialog(false);
    const itemData = {
      nome: formState.nome,
      quantidade: formState.quantidade,
      categoria: formState.categoria,
      unidade: formState.unidade,
      localizacao: formState.localizacao,
      estado: formState.estado,
      ...(formState.valorUnitario !== undefined && {
        valorUnitario: formState.valorUnitario,
      }),
      ...(formState.descricao && { descricao: formState.descricao }),
    };
    addMutation.mutate(itemData);
    setIsDialogOpen(false);
    resetForm();
  };

  // Função chamada ao clicar em "Editar Item Existente"
  const handleEditExisting = () => {
    if (duplicateItem) {
      handleEdit(duplicateItem);
      setShowDuplicateDialog(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Warehouse className="h-8 w-8" />
            Controle de Estoque
          </h1>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Item
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Label>Filtrar por Categoria</Label>
            <select
              className="w-full mt-1 flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="">Todas categorias</option>
              {todasCategorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <Label>Filtrar por Localização</Label>
            <select
              className="w-full mt-1 flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={filtroLocalizacao}
              onChange={(e) => setFiltroLocalizacao(e.target.value)}
            >
              <option value="">Todas localizações</option>
              {localizacoesCadastradas.map((local) => (
                <option key={local} value={local}>
                  {local}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabela de Itens */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Item</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itensFiltrados.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {item.nome}
                    </div>
                  </TableCell>
                  <TableCell>{item.quantidade}</TableCell>
                  <TableCell>{item.categoria}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedItemDetails(item);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Modal Detalhes */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-6 w-6" />
                Detalhes do Item
              </DialogTitle>
              <DialogDescription>
                Informações completas sobre o item do estoque
              </DialogDescription>
            </DialogHeader>
            {selectedItemDetails && (
              <>
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
                        selectedItemDetails.estado === 'Ótimo'
                          ? 'bg-green-100 text-green-800'
                          : selectedItemDetails.estado === 'Bom'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedItemDetails.estado === 'Razoável'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedItemDetails.estado === 'Ruim'
                          ? 'bg-orange-100 text-orange-800'
                          : selectedItemDetails.estado === 'Péssimo'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
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
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setSelectedItem(selectedItemDetails);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                  <Button
                    onClick={() => {
                      handleClone(selectedItemDetails);
                      setIsDetailModalOpen(false);
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar
                  </Button>
                  <Button
                    onClick={() => {
                      handleEdit(selectedItemDetails);
                      setIsDetailModalOpen(false);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal Cadastro/Edição */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                    onChange={(e) =>
                      setFormState({ ...formState, nome: e.target.value })
                    }
                  />
                </div>
                {/* Quantidade */}
                <div className="space-y-2">
                  <Label>
                    Quantidade <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="Ex: 5"
                    min="0"
                    step="1"
                    value={isNaN(formState.quantidade) ? '' : formState.quantidade}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        quantidade: Number(e.target.value),
                      })
                    }
                  />
                </div>
                {/* Valor Unitário */}
                <div className="space-y-2">
                  <Label>Valor Unitário (opcional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1500.99"
                    value={formState.valorUnitario || ''}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        valorUnitario: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
                {/* Estado */}
                <div className="space-y-2">
                  <Label>
                    Estado <span className="text-destructive">*</span>
                  </Label>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formState.estado}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        estado: e.target.value as EstadoEstoque,
                      })
                    }
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
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formState.categoria}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        categoria: e.target.value,
                      })
                    }
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
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formState.unidade}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        unidade: e.target.value,
                        localizacao: '',
                      })
                    }
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
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formState.localizacao}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        localizacao: e.target.value,
                      })
                    }
                    disabled={!formState.unidade}
                  >
                    <option value="">Selecione uma localização</option>
                    {formState.unidade &&
                      locationsByUnit[
                        formState.unidade as keyof typeof locationsByUnit
                      ]?.map((local) => (
                        <option key={local} value={local}>
                          {local}
                        </option>
                      ))}
                  </select>
                </div>
                {/* Descrição */}
                <div className="col-span-2 space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Input
                    placeholder="Ex: Computador Dell usado no laboratório"
                    value={formState.descricao || ''}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        descricao: e.target.value || undefined,
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
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

        {/* Confirmação de Exclusão */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O item será permanentemente removido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              Tem certeza que deseja excluir o item &quot;{selectedItem?.nome}&quot;?
            </div>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (selectedItem?.id) {
                    deleteMutation.mutate(selectedItem.id);
                  }
                  setIsDeleteDialogOpen(false);
                  setIsDetailModalOpen(false);
                  setIsDialogOpen(false);
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                Confirmar Exclusão
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Alerta de Duplicidade */}
        <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Item já existe</AlertDialogTitle>
              <AlertDialogDescription>
                Um item com o nome "{formState.nome}" já está cadastrado no estoque.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">Você quer:</div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCreateAnyway}>
                Criar Novo Item
              </Button>
              <Button onClick={handleEditExisting}>Editar Item Existente</Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Estoque;