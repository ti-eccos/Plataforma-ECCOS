
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FilePlus, Search, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

// Mock data for equipment
const MOCK_EQUIPMENT = [
  { id: 1, name: "Notebook Dell Latitude", type: "Notebook", status: "disponível", location: "Sala de TI", serialNumber: "ND-5678-AB" },
  { id: 2, name: "Projetor Epson X41", type: "Projetor", status: "em uso", location: "Sala 202", serialNumber: "EP-8765-CD" },
  { id: 3, name: "iPad Air", type: "Tablet", status: "em manutenção", location: "Laboratório", serialNumber: "AP-1234-XZ" },
  { id: 4, name: "Lousa Digital", type: "Lousa", status: "disponível", location: "Sala 105", serialNumber: "LD-9876-EF" },
  { id: 5, name: "Notebook Lenovo ThinkPad", type: "Notebook", status: "disponível", location: "Laboratório", serialNumber: "LN-4321-GH" },
  { id: 6, name: "Microfone sem fio", type: "Áudio", status: "em uso", location: "Auditório", serialNumber: "MS-6543-IJ" },
  { id: 7, name: "Caixa de Som JBL", type: "Áudio", status: "disponível", location: "Depósito", serialNumber: "CS-7890-KL" },
  { id: 8, name: "Projetor BenQ", type: "Projetor", status: "em manutenção", location: "Manutenção", serialNumber: "BQ-3456-MN" },
];

const Equipamentos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEquipment, setFilteredEquipment] = useState(MOCK_EQUIPMENT);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term === "") {
      setFilteredEquipment(MOCK_EQUIPMENT);
    } else {
      const filtered = MOCK_EQUIPMENT.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.type.toLowerCase().includes(term) ||
          item.location.toLowerCase().includes(term) ||
          item.serialNumber.toLowerCase().includes(term)
      );
      setFilteredEquipment(filtered);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "disponível":
        return "bg-green-500/20 text-green-500 hover:bg-green-500/30";
      case "em uso":
        return "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30";
      case "em manutenção":
        return "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30";
    }
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gradient">Equipamentos</h2>
              <p className="text-muted-foreground mt-1">
                Gerencie todos os equipamentos tecnológicos da instituição.
              </p>
            </div>
            <Button className="bg-eccos-blue hover:bg-eccos-blue/80">
              <FilePlus className="mr-2 h-4 w-4" /> Adicionar Equipamento
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Inventário de Equipamentos</CardTitle>
              <CardDescription>
                Lista completa de equipamentos tecnológicos cadastrados no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-6">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar equipamentos..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="max-w-md"
                />
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Serial</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipment.map((equipment) => (
                      <TableRow key={equipment.id} className="hover:bg-secondary/30">
                        <TableCell className="font-medium">{equipment.id}</TableCell>
                        <TableCell>{equipment.name}</TableCell>
                        <TableCell>{equipment.type}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(equipment.status)}>
                            {equipment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{equipment.location}</TableCell>
                        <TableCell className="font-mono text-xs">{equipment.serialNumber}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Equipamentos;
