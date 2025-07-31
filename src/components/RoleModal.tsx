import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Home,
  Laptop,
  Calendar,
  Users,
  PlusCircle,
  FileText,
  Bell,
  CalendarCheck,
  ShoppingCart,
  Wrench,
  Warehouse,
  Bug,
  Shield,
  X,
  Settings,
  Save,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: { [key: string]: boolean };
}

interface RoleModalProps {
  role: Role | null;
  onClose: () => void;
  onSave: () => void;
  onTogglePermission: (permission: string) => void;
  onChange: (field: keyof Role, value: string) => void;
}

const permissionLabels: { [key: string]: { label: string; icon: React.ReactNode; category: string } } = {
  dashboard: {
    label: "Dashboard Administrativo",
    icon: <Home className="h-4 w-4" />,
    category: "Administração"
  },
  userdashboard: {
    label: "Dashboard do Usuário",
    icon: <Laptop className="h-4 w-4" />,
    category: "Geral"
  },
  equipamentos: {
    label: "Equipamentos",
    icon: <Laptop className="h-4 w-4" />,
    category: "Recursos"
  },
  disponibilidade: {
    label: "Disponibilidade",
    icon: <Calendar className="h-4 w-4" />,
    category: "Recursos"
  },
  estoque: {
    label: "Estoque",
    icon: <Warehouse className="h-4 w-4" />,
    category: "Recursos"
  },
  usuarios: {
    label: "Usuários",
    icon: <Users className="h-4 w-4" />,
    category: "Administração"
  },
  solicitacoes: {
    label: "Solicitações (Admin)",
    icon: <FileText className="h-4 w-4" />,
    category: "Administração"
  },
  "user-solicitacoes": {
    label: "Minhas Solicitações",
    icon: <FileText className="h-4 w-4" />,
    category: "Geral"
  },
  "nova-reserva": {
    label: "Nova Reserva",
    icon: <CalendarCheck className="h-4 w-4" />,
    category: "Ações"
  },
  "nova-compra": {
    label: "Nova Compra",
    icon: <ShoppingCart className="h-4 w-4" />,
    category: "Ações"
  },
  "nova-suporte": {
    label: "Nova Solicitação Suporte",
    icon: <Wrench className="h-4 w-4" />,
    category: "Ações"
  },
  notificacoes: {
    label: "Notificações",
    icon: <Bell className="h-4 w-4" />,
    category: "Geral"
  },
  "compras-financeiro": {
    label: "Compras Financeiro",
    icon: <ShoppingCart className="h-4 w-4" />,
    category: "Financeiro"
  },
  "compras-tecnologia": {
    label: "Compras Tecnologia",
    icon: <ShoppingCart className="h-4 w-4" />,
    category: "Tecnologia"
  },
  "suporte-operacional": {
    label: "Suporte Operacional",
    icon: <Wrench className="h-4 w-4" />,
    category: "Operacional"
  },
  "calendario-reservas": {
    label: "Calendário de Reservas",
    icon: <Calendar className="h-4 w-4" />,
    category: "Recursos"
  },
  "suporte-plataforma": {
    label: "Suporte da Plataforma",
    icon: <Bug className="h-4 w-4" />,
    category: "Técnico"
  },
  "roles-management": {
    label: "Gerenciar Roles",
    icon: <PlusCircle className="h-4 w-4" />,
    category: "Administração"
  },
  profile: {
    label: "Perfil",
    icon: <Users className="h-4 w-4" />,
    category: "Geral"
  },
  "notice-board-edit": {
    label: "Editar Quadro de Avisos",
    icon: <FileText className="h-4 w-4" />,
    category: "Administração"
  },
};

const defaultPermissions = Object.keys(permissionLabels);

const categoryColors = {
  'Administração': 'bg-red-50 border-red-200 text-red-800',
  'Geral': 'bg-blue-50 border-blue-200 text-blue-800',
  'Recursos': 'bg-green-50 border-green-200 text-green-800',
  'Ações': 'bg-purple-50 border-purple-200 text-purple-800',
  'Financeiro': 'bg-yellow-50 border-yellow-200 text-yellow-800',
  'Operacional': 'bg-orange-50 border-orange-200 text-orange-800',
  'Tecnologia': 'bg-blue-800 border-blue-200 text-blue-50',
  'Técnico': 'bg-gray-50 border-gray-200 text-gray-800',
  'Outros': 'bg-slate-50 border-slate-200 text-slate-800'
};

const RoleModal: React.FC<RoleModalProps> = ({ role, onClose, onSave, onTogglePermission, onChange }) => {
  if (!role) return null;

  // Agrupar permissões por categoria
  const groupedPermissions = defaultPermissions.reduce((groups, permission) => {
    const category = permissionLabels[permission]?.category || 'Outros';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
    return groups;
  }, {} as Record<string, string[]>);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  {role.id ? "Editar Role" : "Nova Role"}
                </h3>
                <p className="text-white/80">
                  {role.id ? "Modificar permissões e informações da role" : "Criar uma nova role no sistema"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Informações básicas */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ID da Role</label>
                <Input
                  placeholder="ex: admin, user, financeiro"
                  value={role.id}
                  onChange={(e) =>
                    onChange("id", e.target.value.toLowerCase().replace(/\s+/g, "-"))
                  }
                  disabled={!!role.id && role.id !== ""}
                  className="rounded-lg border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nome da Role</label>
                <Input
                  placeholder="ex: Administrador, Usuário"
                  value={role.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  className="rounded-lg border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Descrição</label>
              <Input
                placeholder="Descreva as responsabilidades desta role"
                value={role.description}
                onChange={(e) => onChange("description", e.target.value)}
                className="rounded-lg border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            {/* Permissões por categoria */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                <h4 className="text-lg font-semibold text-gray-900">Permissões do Sistema</h4>
              </div>
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`px-3 py-1 text-xs font-medium ${categoryColors[category] || categoryColors['Outros']}`}
                    >
                      {category}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {permissions.filter(p => role.permissions?.[p]).length}/{permissions.length} ativas
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {permissions.map((permission) => {
                      const item = permissionLabels[permission];
                      const isActive = role.permissions?.[permission];
                      return (
                        <Button
                          key={permission}
                          variant={isActive ? "default" : "outline"}
                          onClick={() => onTogglePermission(permission)}
                          className={`justify-start text-sm h-auto py-3 px-4 rounded-lg transition-all ${
                            isActive 
                              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md hover:shadow-lg" 
                              : "hover:bg-gray-50 border-gray-200"
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                              {item.icon}
                            </span>
                            <span className="truncate font-medium">
                              {item.label}
                            </span>
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">
                {Object.values(role.permissions || {}).filter(Boolean).length}
              </span> permissões ativas de <span className="font-medium">{defaultPermissions.length}</span> disponíveis
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="px-6 rounded-lg border-gray-300 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button 
                onClick={onSave}
                className="px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                <Save className="mr-2 h-4 w-4" /> 
                Salvar Role
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleModal;