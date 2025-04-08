
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

const Inventario = () => {
  const [reportType, setReportType] = useState("current");

  // Mock data for inventory overview
  const inventoryOverview = [
    { name: "Em uso", value: 42, color: "#0074E0" },
    { name: "Disponível", value: 28, color: "#00E676" },
    { name: "Em manutenção", value: 8, color: "#F97316" },
    { name: "Obsoleto", value: 12, color: "#8B5CF6" },
  ];

  // Mock data for equipment distribution
  const equipmentDistribution = [
    { name: "Notebooks", quantity: 25, color: "#0074E0" },
    { name: "Projetores", quantity: 15, color: "#F472B6" },
    { name: "Tablets", quantity: 20, color: "#8B5CF6" },
    { name: "Periféricos", quantity: 40, color: "#F97316" },
    { name: "Áudio", quantity: 10, color: "#FACC15" },
    { name: "Outros", quantity: 8, color: "#00E676" },
  ];

  // Mock data for acquisition history
  const acquisitionHistory = [
    { year: "2020", quantity: 15 },
    { year: "2021", quantity: 22 },
    { year: "2022", quantity: 30 },
    { year: "2023", quantity: 28 },
    { year: "2024", quantity: 18 },
  ];

  // Mock data for recent acquisitions
  const recentAcquisitions = [
    { id: 1, name: "Notebooks Dell Latitude", date: "15/03/2024", quantity: 5, value: "R$ 25.000,00" },
    { id: 2, name: "iPads Air", date: "10/02/2024", quantity: 10, value: "R$ 35.000,00" },
    { id: 3, name: "Projetores Epson", date: "25/01/2024", quantity: 3, value: "R$ 12.000,00" },
    { id: 4, name: "Caixas de Som JBL", date: "15/01/2024", quantity: 4, value: "R$ 8.000,00" },
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gradient">Inventário</h2>
              <p className="text-muted-foreground mt-1">
                Visão geral dos ativos tecnológicos da instituição.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={reportType}
                onValueChange={setReportType}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de relatório" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Atual</SelectItem>
                  <SelectItem value="historical">Histórico</SelectItem>
                  <SelectItem value="detailed">Detalhado</SelectItem>
                </SelectContent>
              </Select>
              <Button>Exportar</Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Visão Geral</CardTitle>
                <CardDescription>
                  Distribuição de equipamentos por status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inventoryOverview}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {inventoryOverview.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tipos de Equipamentos</CardTitle>
                <CardDescription>
                  Distribuição por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={equipmentDistribution}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="quantity" name="Quantidade">
                        {equipmentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="history">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="history">Histórico de Aquisição</TabsTrigger>
              <TabsTrigger value="recent">Aquisições Recentes</TabsTrigger>
            </TabsList>
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Aquisições por Ano</CardTitle>
                  <CardDescription>
                    Total de equipamentos adquiridos anualmente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={acquisitionHistory}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="quantity" name="Quantidade" fill="#0074E0" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="recent">
              <Card>
                <CardHeader>
                  <CardTitle>Aquisições Recentes</CardTitle>
                  <CardDescription>
                    Últimos equipamentos adquiridos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-3 text-left">ID</th>
                          <th className="px-4 py-3 text-left">Nome</th>
                          <th className="px-4 py-3 text-left">Data</th>
                          <th className="px-4 py-3 text-left">Quantidade</th>
                          <th className="px-4 py-3 text-left">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {recentAcquisitions.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/30">
                            <td className="px-4 py-3">{item.id}</td>
                            <td className="px-4 py-3">{item.name}</td>
                            <td className="px-4 py-3">{item.date}</td>
                            <td className="px-4 py-3">{item.quantity}</td>
                            <td className="px-4 py-3">{item.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Inventario;
