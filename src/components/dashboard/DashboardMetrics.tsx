
import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, Laptop, Tablet, FileMinus, FileCheck, FileClock } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";

interface DashboardMetricsProps {
  activeUsers: number;
  chromebooks: number;
  ipads: number;
  pendingRequests: number;
  approvedRequests: number;
  inProgressRequests: number;
  isLoading: boolean;
}

export function DashboardMetrics({
  activeUsers,
  chromebooks,
  ipads,
  pendingRequests,
  approvedRequests,
  inProgressRequests,
  isLoading
}: DashboardMetricsProps) {
  const navigate = useNavigate();

  // Navigate to other pages on click
  const handleNavigateToUsers = () => navigate('/usuarios');
  const handleNavigateToRequests = () => navigate('/solicitacoes');
  const handleNavigateToEquipment = () => navigate('/equipamentos');
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cards for main metrics */}
        <StatCard 
          title="Usuários Ativos" 
          value={activeUsers} 
          description="Usuários não bloqueados"
          icon={<Users className="h-8 w-8" />}
          onClick={handleNavigateToUsers}
        />
        <StatCard 
          title="Chromebooks" 
          value={chromebooks} 
          description="Total cadastrado"
          icon={<Laptop className="h-8 w-8" />}
          onClick={handleNavigateToEquipment}
        />
        <StatCard 
          title="iPads" 
          value={ipads} 
          description="Total cadastrado"
          icon={<Tablet className="h-8 w-8" />}
          onClick={handleNavigateToEquipment}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Solicitações Pendentes" 
          value={pendingRequests} 
          description="Aguardando aprovação"
          icon={<FileMinus className="h-8 w-8" />}
          onClick={handleNavigateToRequests}
          className="border-yellow-400 hover:border-yellow-500"
        />
        <StatCard 
          title="Solicitações Aprovadas" 
          value={approvedRequests} 
          description="Aprovadas recentemente"
          icon={<FileCheck className="h-8 w-8" />}
          onClick={handleNavigateToRequests}
          className="border-green-400 hover:border-green-500"
        />
        <StatCard 
          title="Solicitações Em Andamento" 
          value={inProgressRequests} 
          description="Em processamento"
          icon={<FileClock className="h-8 w-8" />}
          onClick={handleNavigateToRequests}
          className="border-blue-400 hover:border-blue-500"
        />
      </div>
    </div>
  );
}
