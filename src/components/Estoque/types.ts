// src/components/Estoque/types.ts
// src/components/Estoque/types.ts
export interface ItemEstoque {
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
  dataRecebimento?: string; // Novo campo
  notaFiscal?: string; // Novo campo
  numeroPedido?: string; // Novo campo
}