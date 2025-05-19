import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface FiltrosProps {
  filtroCategoria: string;
  filtroLocalizacao: string;
  filtroNomeDescricao: string;
  setFiltroCategoria: (value: string) => void;
  setFiltroLocalizacao: (value: string) => void;
  setFiltroNomeDescricao: (value: string) => void;
  todasCategorias: string[];
  localizacoesCadastradas: string[];
}

const Filtros: React.FC<FiltrosProps> = ({
  filtroCategoria,
  filtroLocalizacao,
  filtroNomeDescricao,
  setFiltroCategoria,
  setFiltroLocalizacao,
  setFiltroNomeDescricao,
  todasCategorias,
  localizacoesCadastradas,
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

    {/* Filtrar por Localização */}
    <div className="flex-1 min-w-[250px]">
      <Label>Filtrar por Localização</Label>
      <select
        className="w-full mt-1 flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
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
);

export default Filtros;