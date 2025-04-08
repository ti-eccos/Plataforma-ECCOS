
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const Disponibilidade = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [equipmentType, setEquipmentType] = useState("all");

  // Mock data for equipment availability
  const availabilityData: Record<string, any[]> = {
    notebooks: [
      { id: 1, name: "Notebook Dell #1", periods: ["morning", "afternoon"] },
      { id: 2, name: "Notebook Dell #2", periods: ["morning"] },
      { id: 3, name: "Notebook HP #1", periods: ["afternoon", "night"] },
      { id: 4, name: "Notebook HP #2", periods: [] },
    ],
    projectors: [
      { id: 1, name: "Projetor Epson #1", periods: ["morning", "night"] },
      { id: 2, name: "Projetor BenQ #1", periods: ["afternoon"] },
    ],
    tablets: [
      { id: 1, name: "iPad Air #1", periods: ["morning", "afternoon", "night"] },
      { id: 2, name: "iPad Air #2", periods: ["afternoon"] },
      { id: 3, name: "Samsung Tablet #1", periods: [] },
    ],
  };

  const allEquipment: { type: string; items: any[] }[] = [
    { type: "notebooks", items: availabilityData.notebooks },
    { type: "projectors", items: availabilityData.projectors },
    { type: "tablets", items: availabilityData.tablets },
  ];

  // Function to get equipment data based on selected type
  const getEquipmentData = () => {
    if (equipmentType === "all") {
      return allEquipment;
    } else {
      return [
        {
          type: equipmentType,
          items: availabilityData[equipmentType] || [],
        },
      ];
    }
  };

  // Function to render availability status
  const renderAvailability = (periods: string[]) => {
    const timeBlocks = [
      { id: "morning", label: "Manhã", time: "7h às 12h" },
      { id: "afternoon", label: "Tarde", time: "13h às 18h" },
      { id: "night", label: "Noite", time: "19h às 22h" },
    ];

    return (
      <div className="flex gap-2">
        {timeBlocks.map((block) => (
          <Badge
            key={block.id}
            variant="outline"
            className={
              periods.includes(block.id)
                ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                : "bg-green-500/20 text-green-500 hover:bg-green-500/30"
            }
          >
            {block.label}: {periods.includes(block.id) ? "Reservado" : "Disponível"}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gradient">Disponibilidade</h2>
            <p className="text-muted-foreground mt-1">
              Verifique a disponibilidade de equipamentos por data e período.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Calendário</CardTitle>
                  <CardDescription>Selecione uma data</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="border rounded-md p-3"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de Equipamento</label>
                    <Select
                      value={equipmentType}
                      onValueChange={setEquipmentType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="notebooks">Notebooks</SelectItem>
                        <SelectItem value="projectors">Projetores</SelectItem>
                        <SelectItem value="tablets">Tablets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>
                  Disponibilidade para {date?.toLocaleDateString('pt-BR')}
                </CardTitle>
                <CardDescription>
                  Visualize quais equipamentos estão disponíveis em cada período do dia.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {getEquipmentData().map((group) => (
                  <div key={group.type} className="space-y-3">
                    <h3 className="text-lg font-semibold capitalize">
                      {group.type === "notebooks"
                        ? "Notebooks"
                        : group.type === "projectors"
                        ? "Projetores"
                        : group.type === "tablets"
                        ? "Tablets"
                        : group.type}
                    </h3>
                    <div className="rounded-md border overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-4 py-3 text-left">Equipamento</th>
                            <th className="px-4 py-3 text-left">Disponibilidade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {group.items.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/30">
                              <td className="px-4 py-3">{item.name}</td>
                              <td className="px-4 py-3">
                                {renderAvailability(item.periods)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Disponibilidade;
