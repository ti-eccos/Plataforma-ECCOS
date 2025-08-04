// components/ExportDataDialog.tsx
import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface ColumnOption {
  id: string;
  label: string;
  defaultSelected?: boolean;
}

interface ExportDataDialogProps {
  data: any[];
  columns: ColumnOption[];
  filename: string;
  children?: React.ReactNode;
}

const ExportDataDialog = ({
  data,
  columns,
  filename,
  children,
}: ExportDataDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns
      .filter((col) => col.defaultSelected)
      .map((col) => col.id)
  );
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv">("xlsx");

  const handleExport = useCallback(() => {
    if (data.length === 0) {
      alert("Nenhum dado disponível para exportação");
      return;
    }

    // Filtrar e formatar os dados
    const filteredData = data.map((row) => {
      const newRow: Record<string, any> = {};
      selectedColumns.forEach((col) => {
        newRow[col] = row[col];
      });
      return newRow;
    });

    // Mapear os cabeçalhos para nomes amigáveis
    const headerMap: Record<string, string> = {};
    columns.forEach((col) => {
      if (selectedColumns.includes(col.id)) {
        headerMap[col.id] = col.label;
      }
    });

    // Criar dados com cabeçalhos formatados
    const formattedData = filteredData.map((row) => {
      const formattedRow: Record<string, any> = {};
      Object.keys(row).forEach((key) => {
        formattedRow[headerMap[key] || key] = row[key];
      });
      return formattedRow;
    });

    if (exportFormat === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } else {
      // CSV
      const csvContent = [
        Object.keys(formattedData[0]).join(";"),
        ...formattedData.map((row) =>
          Object.values(row)
            .map((value) => (typeof value === "string" ? `"${value}"` : value))
            .join(";")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      saveAs(blob, `${filename}.csv`);
    }

    setIsOpen(false);
  }, [data, selectedColumns, exportFormat, filename, columns]);

  const toggleColumn = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle>Exportar Dados</DialogTitle>
          <DialogDescription>
            Selecione as colunas e o formato para exportação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto py-2">
          <div>
            <h3 className="font-medium mb-2">Formato de Exportação:</h3>
            <div className="flex gap-4">
              <Button
                variant={exportFormat === "xlsx" ? "default" : "outline"}
                onClick={() => setExportFormat("xlsx")}
                className="flex-1"
              >
                Excel (.xlsx)
              </Button>
              <Button
                variant={exportFormat === "csv" ? "default" : "outline"}
                onClick={() => setExportFormat("csv")}
                className="flex-1"
              >
                CSV (.csv)
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Colunas:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg"
                >
                  <Checkbox
                    id={`column-${column.id}`}
                    checked={selectedColumns.includes(column.id)}
                    onCheckedChange={() => toggleColumn(column.id)}
                  />
                  <label
                    htmlFor={`column-${column.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {column.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={selectedColumns.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDataDialog;