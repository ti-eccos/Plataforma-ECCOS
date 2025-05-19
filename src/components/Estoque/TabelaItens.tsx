import React from 'react';

// Tipos
import { ItemEstoque } from '@/components/Estoque/types';

// UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from '@/components/ui/table';

import { Button } from '@/components/ui/button';

// Icons
import { Package, Eye } from 'lucide-react';

interface TabelaItensProps {
  itensFiltrados: ItemEstoque[];
  setIsDetailModalOpen: (open: boolean) => void;
  setSelectedItemDetails: (item: ItemEstoque | null) => void;
}

const TabelaItens: React.FC<TabelaItensProps> = ({
  itensFiltrados,
  setIsDetailModalOpen,
  setSelectedItemDetails,
}) => (
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
);

export default TabelaItens;