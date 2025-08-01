import React, { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import Filtros from '@/components/Estoque/Filtros';
import TabelaItens from '@/components/Estoque/TabelaItens';
import DetalhesModal from '@/components/Estoque/DetalhesModal';
import CadastroEdicaoModal from '@/components/Estoque/CadastroEdicaoModal';
import ConfirmacaoExclusaoModal from '@/components/Estoque/ConfirmacaoExclusaoModal';
import AlertaDuplicidadeModal from '@/components/Estoque/AlertaDuplicidadeModal';
import CadastroMultiploModal from '@/components/Estoque/CadastroMultiploModal';

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
  responsavel?: string;
  dataRecebimento?: string;
  notaFiscal?: string;
  numeroPedido?: string;
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
  const [selectedItemDetails, setSelectedItemDetails] = useState<ItemEstoque | null>(null);
  const [editingItem, setEditingItem] = useState<ItemEstoque | null>(null);

  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroLocalizacao, setFiltroLocalizacao] = useState('');
  const [filtroNomeDescricao, setFiltroNomeDescricao] = useState('');

  const [formState, setFormState] = useState<Omit<ItemEstoque, 'id'>>({
    nome: '',
    quantidade: NaN,
    valorUnitario: undefined,
    descricao: '',
    categoria: '',
    unidade: '',
    localizacao: '',
    estado: 'Bom',
    responsavel: '',
    dataRecebimento: '',
    notaFiscal: '',
    numeroPedido: '',
  });

  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateItem, setDuplicateItem] = useState<ItemEstoque | null>(null);

  const [bulkFormState, setBulkFormState] = useState({
    nomeBase: '',
    quantidadeItens: 1,
    categoria: '',
    unidade: '',
    localizacao: '',
    estado: 'Bom' as EstadoEstoque,
    descricao: '',
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

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
    const matchNomeDescricao = filtroNomeDescricao
      ? item.nome.toLowerCase().includes(filtroNomeDescricao.toLowerCase()) ||
        (item.descricao?.toLowerCase().includes(filtroNomeDescricao.toLowerCase()) || false)
      : true;
    return matchCategoria && matchLocalizacao && matchNomeDescricao;
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
      const promises = novosItens.map((item) => addDoc(collection(db, 'estoque'), item));
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

    if (!formState.responsavel) {
      if (!formState.unidade) {
        toast.error('Selecione uma unidade');
        return;
      }
      if (!formState.localizacao) {
        toast.error('Selecione uma localização');
        return;
      }
    } else {
      formState.unidade = '';
      formState.localizacao = '';
    }

    const existingItem = itens.find((item) => item.nome === itemName);
    if (existingItem && !editingItem) {
      setDuplicateItem(existingItem);
      setShowDuplicateDialog(true);
      return;
    }

    const itemData = {
      nome: itemName,
      quantidade: formState.quantidade,
      categoria: formState.categoria,
      estado: formState.estado,
      ...(formState.valorUnitario !== undefined && { valorUnitario: formState.valorUnitario }),
      ...(formState.descricao && { descricao: formState.descricao }),
      ...(formState.responsavel && { responsavel: formState.responsavel }),
      ...(!formState.responsavel && {
        unidade: formState.unidade,
        localizacao: formState.localizacao,
      }),
      ...(formState.dataRecebimento && { dataRecebimento: formState.dataRecebimento }),
      ...(formState.notaFiscal && { notaFiscal: formState.notaFiscal }),
      ...(formState.numeroPedido && { numeroPedido: formState.numeroPedido }),
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
      descricao,
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
      descricao,
      dataRecebimento: '',
      notaFiscal: '',
      numeroPedido: '',
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
      descricao: '',
    });
  };

  const resetForm = () => {
    setFormState({
      nome: '',
      quantidade: NaN,
      valorUnitario: undefined,
      descricao: '',
      categoria: '',
      unidade: '',
      localizacao: '',
      estado: 'Bom',
      responsavel: '',
      dataRecebimento: '',
      notaFiscal: '',
      numeroPedido: '',
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

  const handleCreateAnyway = () => {
    setShowDuplicateDialog(false);
    const itemData = {
      nome: formState.nome,
      quantidade: formState.quantidade,
      categoria: formState.categoria,
      estado: formState.estado,
      ...(formState.valorUnitario !== undefined && { valorUnitario: formState.valorUnitario }),
      ...(formState.descricao && { descricao: formState.descricao }),
      ...(formState.responsavel && { responsavel: formState.responsavel }),
      ...(!formState.responsavel && {
        unidade: formState.unidade,
        localizacao: formState.localizacao,
      }),
      ...(formState.dataRecebimento && { dataRecebimento: formState.dataRecebimento }),
      ...(formState.notaFiscal && { notaFiscal: formState.notaFiscal }),
      ...(formState.numeroPedido && { numeroPedido: formState.numeroPedido }),
    };
    addMutation.mutate(itemData);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEditExisting = () => {
    if (duplicateItem) {
      handleEdit(duplicateItem);
      setShowDuplicateDialog(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-white overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-sidebar blur-3xl opacity-5"></div>
          <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-eccos-purple blur-3xl opacity-5"></div>
        </div>

        <div className="relative z-10 space-y-8 p-6 md:p-12 fade-up">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
              <Warehouse className="text-eccos-purple" size={36} />
              Controle de Estoque
            </h1>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-eccos-purple hover:bg-sidebar text-white transition-all duration-300"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Item
              </Button>
              <Button
                onClick={() => setIsBulkModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white transition-all duration-300"
              >
                <ListPlus className="mr-2 h-4 w-4" />
                Múltiplos Itens
              </Button>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-6 fade-up">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Filtros</h2>
            <Filtros
              filtroCategoria={filtroCategoria}
              filtroNomeDescricao={filtroNomeDescricao}
              setFiltroCategoria={setFiltroCategoria}
              setFiltroNomeDescricao={setFiltroNomeDescricao}
              todasCategorias={todasCategorias}
              localizacoesCadastradas={localizacoesCadastradas}
            />
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden fade-up">
            <TabelaItens
              itensFiltrados={itensFiltrados}
              setIsDetailModalOpen={setIsDetailModalOpen}
              setSelectedItemDetails={setSelectedItemDetails}
            />
          </div>

          <DetalhesModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            selectedItemDetails={selectedItemDetails}
            onDelete={() => {
              setSelectedItem(selectedItemDetails);
              setIsDeleteDialogOpen(true);
            }}
            onClone={() => handleClone(selectedItemDetails!)}
            onEdit={() => handleEdit(selectedItemDetails!)}
          />

          <CadastroEdicaoModal
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            formState={formState}
            editingItem={editingItem}
            handleSubmit={handleSubmit}
            handleChange={handleChange}
            locationsByUnit={locationsByUnit}
          />

          <CadastroMultiploModal
            isOpen={isBulkModalOpen}
            onClose={() => setIsBulkModalOpen(false)}
            bulkFormState={bulkFormState}
            handleBulkChange={(field, value) => setBulkFormState(prev => ({ ...prev, [field]: value }))}
            handleBulkSubmit={handleBulkSubmit}
            locationsByUnit={locationsByUnit}
          />

          <ConfirmacaoExclusaoModal
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            itemName={selectedItem?.nome || ''}
            onConfirm={() => {
              if (selectedItem?.id) {
                deleteMutation.mutate(selectedItem.id);
              }
              setIsDeleteDialogOpen(false);
              setIsDetailModalOpen(false);
              setIsDialogOpen(false);
            }}
          />

          <AlertaDuplicidadeModal
            isOpen={showDuplicateDialog}
            onClose={() => setShowDuplicateDialog(false)}
            itemName={formState.nome}
            onCreateAnyway={handleCreateAnyway}
            onEditExisting={handleEditExisting}
          />
        </div>

        <footer className="relative z-10 bg-gray-50 py-10 px-4 md:px-12 fade-up">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <p className="text-gray-500 text-sm">
                © 2025 Colégio ECCOS - Todos os direitos reservados
              </p>
            </div>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
};

export default Estoque;