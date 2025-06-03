import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface FiltrosProps {
  filtroCategoria: string;
  filtroNomeDescricao: string;
  setFiltroCategoria: (value: string) => void;
  setFiltroNomeDescricao: (value: string) => void;
  todasCategorias: string[];
  localizacoesCadastradas: string[];
}

const Filtros: React.FC<FiltrosProps> = ({
  filtroCategoria,
  filtroNomeDescricao,
  setFiltroCategoria,
  setFiltroNomeDescricao,
  todasCategorias,
}) => (
  <div className="flex flex-wrap gap-4">
    {/* Filtrar por Nome ou Descrição */}
    <div className="flex-1 min-w-[250px]">
      <Label>Filtrar por Nome ou Descrição</Label>
      <Input
        placeholder="Digite um termo..."
        value={filtroNomeDescricao}
        onChange={(e) => setFiltroNomeDescricao(e.target.value)}
      />
    </div>

    {/* Filtrar por Categoria */}
    <div className="flex-1 min-w-[250px]">
      <Label>Filtrar por Categoria</Label>
      <select
        className="w-full mt-1 flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
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

  </div>
);

export default Filtros;